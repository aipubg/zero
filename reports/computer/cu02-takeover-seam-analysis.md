# CU-02 Prep — Can Takeover Arbitration Fit Existing Seams? (source analysis, no code)

**Ticket:** CU-02/CU-03 design prep (Qoder) · **Written:** 2026-10-23 04:12 Asia/Calcutta
**Scope:** read-only analysis of the pinned OpenClaw commit `013240515205573248c27ab6b8eec7303f0da1a8`. **Nothing installed, nothing built, no desktop touched, no plugin written.**
**Question:** CU-00 found that takeover arbitration exists only for cloud/attached desktops ([windows-cua-inventory.md §6](windows-cua-inventory.md)). Does Zero need a **new Windows service**, or can a small Zero-owned plugin close the gap using seams that already exist?
**Short answer:** the seams appear sufficient for a **tool-layer** hold, with one honest security caveat. This is a strong argument *against* building the custom service that MASTER_PLAN §CU-02 kept as a fallback.

> **STATUS — partly superseded; kept as the reasoning trail.** This was my first pass, written before the plugin existed. The canonical design is now [takeover-hold-contract.md](../computer/contracts/takeover-hold-contract.md) (§3 names, §6 residual risks, §8 assumptions) under accepted **D-009**, with ownership settled by **D-010**.
> **Since decided, not merely proposed:** the backend plugin exists and is at v0.1.3 (selftest 111/111, verified by me); **D-011** denies Operator `exec` and blocks `escalate_scope` by template config; OpenCode adopted the `controlLeaseId`/`status` names into `bridge-spike.md` §11 and the panel already calls `status`.
> **What is still unresolved here and must not be read as settled:** all four "cheap checks" in §4 — whether a trusted policy fires for the **core** `computer` tool (A3), `registerToolMetadata` scoping, whether a policy denial reaches the model cleanly (now captured deliberately by `refusalObserved` in `computer/spike/result.schema.json`), and whether the paired-node relay is interactive by default. Every one is `[needs GO]`. The §5 recommendation that Zero needs **no separate desktop worker** is unchanged and still my position.

---

## 1. The dead end, first

A Zero plugin **cannot** simply add a second guard on the node command:

- `registerNodeInvokePolicy` rejects a command another plugin already claimed: *"node invoke policy already registered for `<command>` (`<pluginId>`)"* `[CODE src/plugins/registry-registrars-operations.ts:303-314]`.
- Dispatch resolves exactly one policy with a `.find()` `[CODE src/gateway/node-invoke-plugin-policy.ts:173-175]`.
- `cua-computer` claims `computer.act` (`extensions/cua-computer/src/node-invoke-policy.ts:67-69`) — and it *must*, because the manifest marks it `dangerous: true` and a dangerous command with no policy is denied outright (`node-invoke-plugin-policy.ts:176-193`).

So owning the arbitration at the **node-command** layer means owning the CUA policy — i.e. replacing the upstream plugin. Note this also means the `approvals.request` runtime that a node-invoke policy receives (`[CODE] src/plugins/plugin-registration.types.ts:220-236,263`) is **not available to Zero** without taking over that plugin. Any per-action approval or hold logic therefore belongs at the **tool layer**, not the command layer.

## 2. The viable seam: trusted tool policy

- `api.registerTrustedToolPolicy({ id, description, matcher, evaluate })` `[CODE src/plugins/plugin-api.types.ts:412]`.
- `matcher` is a tool-name tuple `[CODE src/plugins/hook-types.ts:205]`; `evaluate(event, ctx)` returns `{ allow?: boolean; reason?: string }` — i.e. it can **deny a tool call with a reason**, and policies "form a mutation chain" `[CODE src/plugins/host-hooks.ts:69-84]`, `[CODE src/agents/agent-tools.before-tool-call.policy.ts:186-190]`.
- The chain runs in the normal before-tool-call path whenever any trusted policy is registered (`hasTrustedToolPolicies` → otherwise the path short-circuits to `blocked:false`, `agent-tools.before-tool-call.policy.ts:150-154`), and the seam is exercised by an existing integration test (`src/plugins/trusted-approval-install.integration.test.ts`).
- A plugin manifest must declare the policy id in `contracts.trustedToolPolicies` (`plugin-api.types.ts:408-411`, `src/plugins/gateway-startup-plugin-activation.ts:293`).

**Design shape** (`zero-computer-hold`, my lane once a code path is assigned):

1. Hold state: `holder: 'agent' | 'human'`, opaque lease id, `resumeSnapshotRequired` — modelled on OpenMausBot `server/computer-control.ts:1-2,65-107` (refuse-while-held, never queued, **not** persisted across restart) and OpenDots `src/shared/computer-types.ts:18-32`.
2. Policy `matcher: ["computer"]`; `evaluate`: if `holder === 'human'`, **allow** observation-only actions (`screenshot`, `get_window_state`, `list_windows`, `get_accessibility_tree`, `zoom`, `get_cursor_position`) and **deny** input actions with a stable reason code; mirror the same observation set OpenClaw itself classifies (`extensions/cua-computer/src/node-invoke-policy.ts:26-35`).
3. The human's "Take control" affordance: `registerControlUiDescriptor` (`surface: "tab" | "widget" | …`, `plugin-api.types.ts:96-99`) plus `registerHttpRoute` / `registerGatewayMethod` (`:252,271`) for take/release. OpenCode owns how that looks; I only need one authenticated take/release call.
4. On release: set `resumeSnapshotRequired = true` so every pre-handover `frameId`/`observationId` is treated as stale — matching upstream's own cloud behaviour (`docs/nodes/computer-use.md:17`) and its stale-frame errors.

## 3. What the tool-layer hold does **not** cover (say this plainly)

| Residual risk | Why | Mitigation available today |
|---|---|---|
| An in-flight native action is **not cancelled** by a tool-layer refusal | The policy gates *new* tool calls; the SDK call is already running (`[CU-00]` src/commands.ts queue) | interrupt the run — cancellation is passed to the SDK per invocation (`docs/nodes/computer-use.md:242,303`) |
| A **raw `node.invoke` client** can still send `computer.act` | It bypasses the agent tool path entirely; only cua-computer's policy sits there | `gateway.nodes.commands.deny:["computer.act"]` (hot-applies, `config-browser-ui-desktop.md:409-413`) — coarse but real |
| A human at the **physical console** is invisible to OpenClaw | Upstream has no local-input sensor on Windows; foreground injection is shared | product decision: require takeover *through* the panel; treat console use as an accepted race in MVP |
| Reloading/restarting the plugin could drop the hold | Upstream closes executions on provider switch/disable (`commands.ts:551-581`) | re-read hold state on activation; keep it in memory only, like the reference design |

Verdict: for the **actual failure mode Zero cares about** — the agent typing or clicking while the user believes they are driving — the tool-layer hold is sufficient, provided the user takes control through Zero's own surface. A custom driver would only add coverage for raw invokers and physical-console input, which are better handled by the existing deny lever and by product convention.

## 4. Cheap checks before committing to this design

1. `[UNVERIFIED]` Does a trusted tool policy actually fire for the **core `computer` tool** (the runner receives `toolName`; core-vs-plugin scoping was not provable by reading alone)? One offline test after an install window answers it.
2. `[UNVERIFIED]` Whether `registerToolMetadata` scoping ("plugins cannot decorate other plugins' tools or core tools", `plugin-api.types.ts:415-421`) restricts anything else we want.
3. `[UNVERIFIED]` Does a tool-policy `deny` reach the model as a clean, non-retryable reason, or does it loop? Upstream already has tool-loop detection (`src/agents/tool-loop-detection.ts`).
4. `[UNVERIFIED]` Whether the paired-node desktop relay is interactive-by-default in Zero's config (`ui/src/components/desktop/desktop-client.ts` `viewOnly`/`disableInput`, `desktop-panel-owner.ts:516`).

## 5. What this changes for the roadmap

- **CU-02**: implement the OpenClaw supported provider as planned; the "separate Windows UIA/vision service" stays **unbuilt** unless CU-01 shows a gap beyond §3.
- **CU-03**: takeover arbitration is a *small Zero plugin*, not a service — screen stream already exists (RFB relay), global stop already exists (command deny + interrupt), crash recovery partly exists (session-expiry rotation without replay). Remaining genuine CU-03 items: **multi-display**, **DPI ≠ 100 %**, held-input actions, and any physical-console arbitration — all driver-level, which is exactly where a custom provider would eventually be needed *if* those become product requirements.
- ~~Needs a code path assignment~~ **RESOLVED by D-010**: `E:\zero\computer\` is mine; the Gateway policy plugin under `backend\` is DeepSeek's. That boundary is why `computer/` holds contracts and the spike rig rather than the hold plugin, and why I did not create it unilaterally before the decision existed.

## 6. Asks

- ~~(a) is the tool-layer hold the accepted approach~~ **DECIDED — D-009 accepted the tool-layer plugin gate**, with run interruption and `gateway.nodes.commands.deny` kept as separate emergency-stop layers, and D-011 later removing the code-mode route I could not cover there.
- ~~(b) assign the computer-owned code directory~~ **DECIDED — D-010** (`E:\zero\computer\`).
- (c) the CU-00 §8 gate items **still stand**: designated environment (O1), VNC/RFB consent (O2), install ordering (O3), and an explicit owner GO. Those are the only asks left in this file.
- DeepSeek Harness: check §1/§3 — if you want hold enforcement that also covers raw `node.invoke`, that is a Gateway-policy decision in your lane, not something I should solve in a plugin.
- OpenCode: §2 step 3 is your surface. Tell me the take/release call shape you want and I will spec it in the contract proposal rather than inventing it twice.

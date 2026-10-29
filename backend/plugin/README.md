# Zero Policy plugin

Zero-owned OpenClaw plugin. The only Zero code that runs **inside** the Gateway process.

**Status: loaded in the current backend build (D-013).** The plugin registers on the live Gateway and the `zero.computer.control` state machine has been exercised (take → release → status) without a desktop action. Logic and static contracts are unit-tested against a fake host (**94/94**). Still unproven: whether the trusted policy fires for the core `computer` tool and whether it refuses a real agent input during a hold; that is CU-01 on the designated isolated environment.

## What it does

| Concern | Mechanism | Contract evidence |
|---|---|---|
| Human hold refuses agent computer input | `api.registerTrustedToolPolicy` | `src/plugins/host-hooks.ts:76-84`, `plugin-api.types.ts:412` |
| Take/release control from the Zero UI | `api.registerGatewayMethod("zero.computer.control", …)` | `plugin-api.types.ts:271-283` |
| Per-run action budgets | counter inside the same policy | `host-hooks.ts:69-74` |
| Risk-family recording | `highRiskActions` config + audit rows | `computer/contracts/computer-act-actions.json` |

## REVIEW-02 findings and how each was resolved

| # | Finding | Resolution |
|---|---|---|
| **C1** | Manifest declared no `contracts.trustedToolPolicies`, so an installed plugin's policy is rejected *before* registration — the hold would silently not exist | `openclaw.plugin.json` now declares `["zero-policy.computer-hold"]`, the **exact** string passed as `policy.id`. Verified against `src/plugins/registry-registrars-host.ts:166-175`: the check is `.includes(id)` on the raw id with no prefixing. `package.json` now declares `openclaw.compat.pluginApi: ">=2026.10.6"` and `install.minHostVersion`. |
| **C2** | Field-name break with the accepted bridge contract (`leaseId` vs `controlLeaseId`) | Renamed in request **and** response. The old name now gets `computer-hold:lease-invalid`, and a test asserts it. |
| **C4** | Observe allowlist had 3 names; upstream's observation surface is 8 | Default is now 10: the 8 from `computer-act-actions.json → observationNamesForHoldAllowlist` plus `screenshot` and `wait` (the two actions that ride `screen.snapshot` locally). |
| **C5** | Staleness gated only coordinate actions, so `set_value`, `kill_app`, `browser_*` could act on a pre-handover reference | Staleness now gates **every non-observation action**, and an unknown/missing action fails closed. Only a call that actually returns a new capture clears it: `screenshot`, or `get_window_state` with `includeScreenshot: true`. |
| **C6** | `readAction()` tolerated `type`/`command`/`operation`/`name` | Fallbacks removed. The upstream params are a closed object with a required `action` enum (`computer-use-contract.ts:100-109`); anything else is `zero-policy:unknown-action`. |
| **C7** | Hold is global, not per computer target | Accepted and now explicit: the snapshot reports `scope: "global"`, and every audit row records the resolved `target`. A global hold is the fail-closed choice for a single-machine product — a per-target hold could be bypassed by addressing another target. |
| C8 | — | Confirmed good: `operator.write` is passed explicitly, because omitting it defaults to `operator.admin` (`src/gateway/methods/descriptor.ts:70-101`). |
| **C6′** | Code-mode `{code}` envelopes invoke the computer tool without an `action` field, so a policy matching only `computer` would let them through **allowed and uncounted** | `exec` is added to the matcher and code-mode calls (`toolKind: "code_mode_exec"`) are treated as opaque input: **refused during a hold**, otherwise allowed but counted and audited (`kind: "code_mode_exec"`). This is defence in depth — `@manager` may still choose to keep code-mode off for the Operator (Qoder's O7, option A). |
| **O8** | `escalate_scope` widens control past the designated environment, which is what D-003's containment rests on | The plugin default stays "audited, not blocked" (a neutral code default), but the **deployed template config** sets `blockedActions: ["escalate_scope"]`. One line, visible, and the owner can strike it. |

## Semantics (D-009)

- A hold **refuses** input. It never queues it and never pauses the run. (`requireApproval` pauses the run — wrong tool.)
- **Observation stays allowed** during a hold.
- After a **release**, every non-observation action is refused (`computer-hold:stale-frame`) until a fresh **desktop capture**. `screenshot` and `wait` both qualify; a bare `get_window_state` does **not**, because its `observationId` is scoped to one window and cannot prove the desktop underneath (`docs/nodes/computer-use.md:92`). Qoder adopted this as canon after confirming the same reading.
- **Code-mode is covered, not exempt.** A `{code}` envelope carries no inspectable action, so it is treated as opaque input: refused during a hold, counted and audited otherwise.
- Hold state is **in memory only**. A reload or restart clears it — deliberate: a persisted stale lease silently keeping control would be worse.
- Trusted policies are **fail-closed**: a throw inside `evaluate()` becomes `block:true` with `blocked by zero-policy.computer-hold: policy evaluation failed` (`src/plugins/trusted-tool-policy.ts:138-149, 292`). A bug in this plugin blocks computer use; it does not silently allow it.
- Trusted policies have **no priority field** and run in plugin-load order (`trusted-tool-policy.ts:298`). Do not rely on ordering against another plugin's policy; if ordering ever matters, move to the generic `before_tool_call` hook.

## Activation self-check

A rejected registration is otherwise invisible until a live check, so `register()` reads its own `openclaw.plugin.json` and verifies that `contracts.trustedToolPolicies` contains the exact policy id:

- declared → `info: manifest declares trusted policy "zero-policy.computer-hold" - registration should be accepted`
- **not** declared → `error: MANIFEST DOES NOT DECLARE "…" … the human hold will NOT exist`
- unreadable → a warning, never a throw (disabling the plugin at load would be worse than a loud warning)

## Error codes (stable strings for the UI)

| Code | Meaning |
|---|---|
| `computer-hold:already-held` | another live client holds control |
| `computer-hold:lease-invalid` | wrong/missing `controlLeaseId`, or no hold active |
| `computer-hold:human-control` | agent input refused during a hold |
| `computer-hold:stale-frame` | non-observation action before a fresh capture after release |
| `zero-policy:unknown-action` | call had no closed-enum `action` (fails closed) |
| `zero-policy:action-blocked:<action>` | configured always-blocked family |
| `zero-policy:budget:<kind>>` | per-run action or input budget exhausted |
| `zero-policy:bad-request` | unknown control action |

## Method contract — `zero.computer.control`

Request: `{ action: "take" | "release" | "status", controlLeaseId?: string, reason?: string }`

Snapshot: `{ held, owned, scope: "global", controlLeaseId?, since?, reason?, resumeSnapshotRequired, stats, recent }`

- The lease id is minted **server-side** (`zl-` + 32 hex). The client never supplies one on take.
- Re-take by the same connection is idempotent; another connection gets `already-held`.
- Release requires the exact `controlLeaseId` from the owning connection.
- `stats` is cumulative for the process; `recent` is the last 10 decisions (`{ts, tool, action, target, decision, reason, runId, held}`).
- Registered with `scope: "operator.write"`. The host does **not** validate params or results for plugin methods (`shared-types.ts:584-588`), so this plugin validates its own input and the UI must not assume host-side enum enforcement.

## Loading requirements (all three are mandatory)

1. `plugins.load.paths` includes this directory.
2. `plugins.entries.zero-policy.enabled: true` — installed (non-bundled) plugins must be **explicitly enabled** or registration is rejected (`registry-registrars-host.ts:176-182`).
3. If a `plugins.allow` list exists, it must include `zero-policy`.

All three are checked by `backend/scripts/preflight.mjs`.

## Integration risks

**Entry shape — resolved 2026-10-23.** The module now exports `definePluginEntry(...)` with `buildJsonPluginConfigSchema`, so the runtime and manifest schemas are aligned and the host receives a `configSchema`. The live Gateway accepted the plugin. The action field name was closed earlier by C6 against the closed-object contract.

**Policy firing — still open.** Registration succeeding does not prove the trusted policy is consulted for the core `computer` tool. That requires a real tool call in the designated isolated environment (CU-01); a policy that is registered but never invoked would look identical from the method side.

## Self-test

```powershell
node backend/plugin/selftest.mjs
```

94 cases: manifest/package contracts (C1), lease field name (C2), observation allowlist (C4), stale-reference gating (C5), strict action parsing (C6), code-mode coverage (C6′), global scope + target audit rows (C7), `wait` as a fresh capture, the activation self-check, budgets, blocked actions, config validation, explicit scope, the audit trail, entry-schema/manifest-runtime parity, and deployed-config schema validation. It proves logic and static contracts; the live method round trip is recorded in `reports/backend/build-readiness.md` §D-013, but the policy path itself is not proven until CU-01.

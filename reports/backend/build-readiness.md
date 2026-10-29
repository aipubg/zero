# Backend build-readiness — GO packet

**Ticket:** BE-02 (pre-build) + BE-01 (harness) · **Original author:** DeepSeek Harness · **Current owner:** Qoder (D-013)
**Status (original):** **READY FOR THE BUILD GATE — do not execute without an explicit owner GO**
**Date:** 23 October 2026, 05:30 Asia/Calcutta
**D-013 current state (2026-10-23, Qoder):** the build window has run. The Gateway is live on loopback, the app link is paired/connected, and the Zero hold method has been exercised. The pre-build statements below are preserved as history; see **§D-013 handover verification** at the end for the independently rechecked state.
**Pinned source:** OpenClaw `013240515205573248c27ab6b8eec7303f0da1a8` / `v2026.10.6` (read-only, unmodified)
**Rule in force:** BUILD-GATE POLICY (`AGENT_CHAT.txt` 04:30) — the earlier "install window approved" note is **superseded**. Nothing below has been started.

### Model route (owner-selected, applied)

| Item | Value |
|---|---|
| Provider | NVIDIA NIM, `https://integrate.api.nvidia.com/v1`, adapter `openai-completions` |
| Model | **one** row, `z-ai/glm-5.3-flash`, serving Lead, Vision and Utility |
| Model reference | `zero-gw/z-ai/glm-5.3-flash` (a nested vendor/model id; the docs use the same shape for `openrouter/qwen/...`) |
| Placeholders left in the template | **none** — fully resolved and reviewable |
| Credentials | `apiKey` is the env-var **name**; the gateway token comes from `OPENCLAW_GATEWAY_TOKEN` |

**Credential incident.** A provider key was pasted into chat. It is treated as **exposed**. It appears nowhere in this workspace — a scan for the provider's key prefix outside `.git/` and `upstream/` returns **zero matches**, and this document deliberately does not quote the prefix so that scan stays meaningful. It was never used and must be **revoked and rotated**. Phase 1 waits for a fresh key delivered through the host secret store. The probe itself refuses to start without `ZERO_GATEWAY_KEY` (exit 2, no network call), so a stale or inline key cannot leak into a run.

---

## 1. The gate

The next action in this lane is one of these five. All are gated; none have run:

| # | Gated action | Phase |
|---|---|---|
| 1 | Call the model gateway (network + secret use) | Phase 1 |
| 2 | Activate Corepack / pnpm 12.15.0 | Phase 2 |
| 3 | `pnpm install` the pinned `openclaw@2026.10.6` | Phase 2 |
| 4 | Launch the Gateway process | Phase 3 |
| 5 | Apply the live config to a running Gateway | Phase 3 |

Everything that could be done without crossing that line is done and verified (§3, §4).

**Recommended first gate: Phase 1, not Phase 2.** The model-gateway probe needs no install and answers the one question that could invalidate the install: *does this gateway support tool calling and vision?* If `tools` fails, the Lead cannot spawn specialists and the Operator cannot use the computer tool, and the whole BE-02 shape changes. Spending 5 minutes before spending 3 GB is the right order.

---

## 2. What is built

```
E:\zero\backend\
├─ package.json                      pinned dependency: openclaw@2026.10.6
├─ config\
│  ├─ openclaw.template.json         full proposed config, 4 ${ENV} placeholders, no secrets
│  └─ env.example                    env var names only, empty values
├─ plugin\                           the only Zero code that runs inside the Gateway
│  ├─ openclaw.plugin.json           manifest (id zero-policy, config schema)
│  ├─ package.json                   type: module
│  ├─ index.js                       hold gate + budgets + zero.computer.control method
│  ├─ selftest.mjs                   90-case fake-host + static-contract test
│  └─ README.md                      contract, error codes, two known integration risks
└─ scripts\
   ├─ preflight.mjs                  31 environment/config checks, read-only
   ├─ bootstrap.mjs                  template -> live config, dry-run by default
   └─ acceptance.mjs                 Phase 4 A1-A3 (WS default; --http opt-in)

E:\zero\reports\backend\
├─ source-inventory.md                (BE-00, accepted)
├─ mvp-backend.md                     (BE-02 design rationale)
├─ license-posture.md                 (NOTICE obligations)
├─ security-boundary.md               (what the runtime exposes; H1-H5 post-acceptance hardening)
├─ tools\gateway-probe.mjs            (BE-01 model-gateway harness, self-tested)
└─ build-readiness.md                 (this file)
```

---

## 3. Verification already performed (all local, no install)

| Check | Command | Result |
|---|---|---|
| Preflight suite | `node backend/scripts/preflight.mjs` | **27 pass, 4 warn, 0 fail** (31 checks) → `READY WITH OPEN ITEMS`, exit 0 |
| Plugin logic + contracts | `node backend/plugin/selftest.mjs` | **90 pass, 0 fail**, exit 0 |
| Trusted-policy declaration | preflight `plugin.trustedPolicyContract` | manifest declares `zero-policy.computer-hold`, the exact string the registrar compares |
| Plugin API floor | preflight `plugin.compatFloor` | `openclaw.compat.pluginApi =>=2026.10.6` |
| Config/schema drift | selftest C1 block | every config key in code is declared in the manifest schema |
| Observation allowlist | preflight `plugin.observeSet` | 10 actions in the template (code default matches) |
| Acceptance runner | `node backend/scripts/acceptance.mjs` vs a loopback mock | A1/A2/A3 pass, exit 0; wrong token → A1 FAIL, exit 1; mock then deleted |
| Report generator | `node reports/backend/tools/probe-to-report.mjs` vs synthetic pass/fail probe JSON | pass → PASS + correct implications, exit 0; fail → BLOCKED naming `tools`, exit 1 |
| Probe `--out` path | loopback-only dry run writing `.zero-data\be01-probe.json` | created the missing directory and wrote the report, exit 1 as expected; artifact deleted |
| Model-ref parsing | preflight `config.modelRefParsing` + two negative tests | upstream `parseModelRef` splits on the **first** `/` (`src/agents/model-selection-normalize.ts:36-45`), so `zero-gw/z-ai/glm-5.3-flash` resolves to provider `zero-gw`, model `z-ai/glm-5.3-flash`. Breaking the provider segment and breaking the model id each fail the check |
| Config template | preflight check `config.template` | parses; **fully resolved, no placeholders** (owner fixed the route) |
| Agent roster | preflight `config.agents` | `zero, researcher, operator`; `ownership: explicit` |
| Computer scope | preflight `config.computerScope` | granted to `operator` only; lead/researcher have no grant; researcher explicitly denies it |
| Vision row | preflight `config.visionModel` | one provider model declares `input: ["text","image"]` |
| Plugin wiring | preflight `config.zeroPlugin` | `load=true` (`plugins.load.paths`) `enabled=true` |
| Bootstrap, no env | `node backend/scripts/bootstrap.mjs` | lists the 4 missing vars, **exit 0** ("owner input, not an error") |
| Bootstrap, synthetic env | `…` with fake values | resolves base URL, models, agents, plugin path; **exit 0**, writes nothing |
| Bootstrap, write path | `… --write` (synthetic) | wrote a valid `openclaw.json`; verified `apiKey` field is the *name* `ZERO_GATEWAY_KEY`, not a value; file then deleted |
| Model-gateway probe | `node reports/backend/tools/gateway-probe.mjs` vs a loopback mock of the NIM surface | 9/9 checks, exit 0, after the single-model refactor; key never appears in the report (0 occurrences) |

### Two findings from the checks themselves

1. **The preflight caught a bug in its own check.** `config.computerScope` initially failed because `researcher` *denies* `"computer"` and a naive substring match read the deny as a grant. Fixed to compare grant lists (`allow`/`alsoAllow`) rather than the serialized entry. The config was right; the checker was wrong.
2. **`corepack` is present** at `C:\Program Files\nodejs\corepack` even though `pnpm` and `git` are absent from this shell's PATH. Node `v24.22.1` satisfies the upstream engine range exactly.

### REVIEW-02 reconciliation (Qoder's C1–C7, senior-reviewed)

| # | Finding | Resolution | Evidence |
|---|---|---|---|
| **C1** | Installed plugin declared no `contracts.trustedToolPolicies` → policy rejected **before registration**, so the hold would silently not exist | Declared `["zero-policy.computer-hold"]` — the exact `policy.id` string. Source check is `record.contracts.trustedToolPolicies.includes(id)` on the raw id, no prefixing. Also declared `openclaw.compat.pluginApi: ">=2026.10.6"` + `install.minHostVersion` in `package.json`. | `src/plugins/registry-registrars-host.ts:166-182`; preflight `plugin.trustedPolicyContract`, `plugin.compatFloor` |
| **C2** | `leaseId` vs the accepted `controlLeaseId` | Renamed in request **and** response; the old name now returns `computer-hold:lease-invalid`, asserted by a test | selftest C2 block |
| **C4** | Observe allowlist had 3 names vs upstream's 8 | Default is 10: taxonomy 8 + `screenshot` + `wait` | `computer/contracts/computer-act-actions.json → observationNamesForHoldAllowlist` |
| **C5** | Staleness gated only coordinate actions; unknown action bypassed it | Staleness gates **every non-observation** action; unknown/missing action fails closed. Only a real desktop capture clears it: `screenshot` **or `wait`** (Qoder, `docs/nodes/computer-use.md:92`), plus `get_window_state` with `includeScreenshot: true` | selftest C5 blocks (three paths incl. `wait`) |
| **C6** | `readAction()` tolerated four fallback field names | Fallbacks removed; strict `action` string or fail closed | `src/plugins/computer-use-contract.ts:100-109` |
| **C7** | Hold is global, not per target | Accepted and made explicit: snapshot reports `scope: "global"`; every audit row records the resolved `target`. Global is the fail-closed choice — a per-target hold could be bypassed by addressing another target. | selftest C7 block |
| C8 | — | Confirmed good; `operator.write` stays explicit because omitting it defaults to `operator.admin` | `src/gateway/methods/descriptor.ts:70-101` |
| **C6′** | Code-mode `{code}` envelopes reach the computer tool with no `action`, so a `computer`-only matcher let them through allowed and uncounted — a real fail-open path behind D-009's promise | `exec` added to the policy matcher; anything with `toolKind: "code_mode_exec"` is treated as opaque input: **refused during a hold**, otherwise allowed but counted and audited (`kind: "code_mode_exec"`). Per **D-011** this is defence in depth only: the Operator's `exec.mode` is now `deny`, so the unproven route is closed at the config layer too. | `src/plugins/host-hooks.ts` toolKind contract; selftest C6′ blocks; preflight `config.operatorExecDenied` |
| **O8** | `escalate_scope` widens control past the designated environment, which is what D-003's containment rests on | Plugin code default stays neutral (audited, not blocked); the **deployed template** sets `blockedActions: ["escalate_scope"]`. One visible config line the owner can strike. **D-011 keeps it.** | preflight `plugin.blockedPosture` |
| **D-011** | MVP safety posture for code-mode and scope widening | Operator `tools.exec.mode: "deny"`; `blockedActions: ["escalate_scope"]` retained; no agent holds `exec.mode: "full"`. Desktop control is unaffected — the Operator drives the computer through the `computer` tool, not host exec. | preflight `config.operatorExecDenied`, `config.noFullExec` |

**Two facts from Qoder that changed the plan, both now recorded:**

1. **`computer.act` is not the input command.** Only `screenshot` and `wait` ride `screen.snapshot` (`src/agents/tools/computer-tool-request.ts:20-23`); the structured observations (`list_apps`, `list_windows`, `get_accessibility_tree`, `get_cursor_position`, `get_window_state`, `zoom`, `get_browser_state`) all travel over `computer.act`. **Correction to my earlier claim:** `gateway.nodes.commands.deny: ["computer.act"]` therefore degrades *observation* as well as blocking input — plain `screenshot` survives, structured reads do not. It is still the right global kill switch, but it is blunter than §7.2 of `mvp-backend.md` implied.
2. **Trusted policies are fail-closed and unordered.** A throw inside `evaluate()` becomes `block:true` (`trusted-tool-policy.ts:138-149, 292`); there is no priority field and they run in plugin-load order (`:298`). So a bug in our plugin blocks computer use rather than silently allowing it — the right failure direction — but our policy must not depend on ordering against another plugin.

### 3.2 Release-source reconciliation (installed `fe06181` vs checkout `0132405`)

BUILD WINDOW A installed `openclaw@2026.10.6`, whose `dist/build-info.json` embeds commit **`fe06181dc5ecc01cf8904abbfc26925925efefbc`** — not the checkout's `0132405…`. GitHub's official `v2026.10.6` tag also resolves to `fe06181`, so the runtime we execute is the released artifact while everything read for BE-00/BE-02 came from a different commit. **Every contract this lane depends on was re-checked against the installed `dist/`:**

| Contract | Result in the installed release | Where |
|---|---|---|
| Trusted policy must be declared in `contracts.trustedToolPolicies`, compared with `.includes(id)` on the raw id | **unchanged** | `dist/registry-Ctt4xQAS.mjs:1371-1373` |
| Installed plugin must be *explicitly enabled* to register a trusted policy | **unchanged** | `dist/registry-Ctt4xQAS.mjs:1375-1378` |
| `{allow:false, reason}` becomes `{block:true, blockReason}` | **unchanged** — exactly what the plugin returns | `dist/agent-tools.before-tool-call-*.mjs:1229-1232` |
| A throw inside `evaluate()` fails closed | **unchanged** | same file `:1224-1225` |
| Plugin gateway method scope defaults to `operator.admin` when omitted | **unchanged** | `dist/descriptor-D0bRB7KY.mjs:49` |
| Computer v2 action set (40 names) | **identical** to Qoder's derived taxonomy — 40/40, zero differences | `dist/computer-use-contract-Ctek0XlQ.mjs` |
| `definePluginEntry` | a thin wrapper that **also supplies `configSchema`** | `dist/plugin-entry-*.mjs` |

**One real code change was needed, and this check is what found it.** The plugin exported a bare object `{id, name, description, register}`. The host's entry helper also provides a `configSchema` (defaulting to `emptyPluginConfigSchema`), and our entry had none — so the config the Gateway validates at runtime had no schema. The plugin now uses `definePluginEntry` with `buildJsonPluginConfigSchema`, both resolved from `openclaw/plugin-sdk/plugin-entry` in the installed package. Three assertions lock it: the entry exposes a `configSchema`; the runtime JSON schema covers the same keys as the manifest; and **the deployed template config actually passes the runtime schema**.

Net: no behavioural contract changed, one packaging gap closed, and the taxonomy plus every registration/authorization rule this lane relies on is confirmed on the artifact we will run.

### 3.3 Verification after the reconciliation

| Check | Result |
|---|---|
| Plugin selftest | **94 pass, 0 fail** (was 90) |
| Preflight | 31 checks — **27 pass, 4 warn, 0 fail** |
| `openclaw --version` | `2026.10.6` (fe06181) — reported by the senior's window; not re-run by me |
| Installed footprint | 0.470 GB / 43,430 files + 0.469 GB store (measured by the senior, not estimated) |

---

## 4. What is NOT proven (say this out loud before GO)

| Unproven | Consequence if wrong | Where it surfaces |
|---|---|---|
| Plugin entry shape (`default export` vs `definePluginEntry`) | plugin fails to load | Phase 3 startup log |
| `registerTrustedToolPolicy` fires for the **core** `computer` tool | hold does nothing (policy registered but never consulted) | Phase 4 A6/A7 |
| `registerGatewayMethod` typed params/results + discovery | UI cannot take control | Phase 4 A7 (Qoder's caveat: **no host schema validation** — we validate ourselves) |
| Gateway WS session-key parameter for `zero-thread-*` | thread mapping falls back to HTTP `user` | BE-01 / OpenCode OQ-2b |
| The user's gateway supports tools/vision | backend plan changes materially | **Phase 1** |
| Pinned npm tarball == the source we read | behaviour drift from the pin | Phase 2 `openclaw --version` + first diff |
| Install footprint | disk/time overrun | Phase 2 measurements |

**Resolved since the last revision:** the `computer` tool's action field name is no longer unproven (closed-object contract, C6); the trusted-policy declaration is no longer unproven (C1 + a preflight check); the lease field name is fixed against the accepted contract (C2).

---

## 5. GO sequence

Run phases in order. **Each phase ends with a stop-and-report point.** Do not chain them without recording the result.

### Phase 0 — owner inputs (no action)

The model route is **already decided**, so most of the old Phase 0 is gone:

| Input | Status | Notes |
|---|---|---|
| Model gateway base URL | ✅ **supplied** | `https://integrate.api.nvidia.com/v1` (NVIDIA NIM), baked into the template |
| Model id | ✅ **supplied** | `z-ai/glm-5.3-flash` — ONE model row for Lead, Vision and Utility |
| Gateway API key | ⏳ **waiting on a fresh key** | Must reach the process environment through the host secret store. **The key pasted into chat is exposed; it must be revoked/rotated and never reused.** |
| Gateway auth token | ⏳ before Phase 3 | `OPENCLAW_GATEWAY_TOKEN`; OpenClaw refuses to bind without auth. Not needed for Phase 1 |

If no fresh key reaches the environment, **Phase 1 cannot run** and the lane stops there. The probe refuses to start without `ZERO_GATEWAY_KEY` (exit 2, no network call), so it cannot accidentally test with an inline or stale key.

### Phase 1 — model-gateway probe (gated: network + secret use)

```powershell
cd E:\zero
$env:ZERO_GATEWAY_KEY = "<fresh key from the secret store>"
node reports/backend/tools/gateway-probe.mjs --out .zero-data\be01-probe.json
node reports/backend/tools/probe-to-report.mjs .zero-data\be01-probe.json
```

Base URL and model id now default to the owner's route, so the key is the only thing to supply. The second command generates `reports/backend/gateway-proof.md` from the JSON, so the BE-01 report is produced from the data rather than retyped.

**Getting the key into this process** — a variable exported in another terminal does **not** reach the agent. It must be `ZERO_GATEWAY_KEY` in the environment the agent process inherits: set it at user/machine scope and restart the host process, or inject it from the secret store at launch. `preflight.mjs` reports whether it can see it, without ever printing it.

- **Pass:** exit 0, `required` checks (`models`, `chat`, `stream`, `tools`) all PASS → continue to Phase 2, and BE-01's report can be written from the JSON.
- **Abort:** `tools` FAILS → stop. Report to @manager with the JSON. The backend plan needs rework before any install.
- **Also record:** `models.metadata` (context length etc.) so the config's `contextWindow`/`maxTokens` can be corrected from evidence instead of the conservative 128000/96000/4096 guess, and the `vision` verdict, which decides whether the one-model route can drive the Operator.
- Expected: 9 checks, < 60 s, no disk effect beyond the JSON report.
- Side effect: one outbound HTTPS call per check to `integrate.api.nvidia.com`.

### Phase 2 — install (gated: heavy, ~3 GB)

Requires an explicit GO plus confirmation that no other lane is running a heavy job.

```powershell
corepack enable pnpm
corepack prepare pnpm@12.15.0 --activate
pnpm --version                      # MUST print 12.15.0, else stop

cd E:\zero\backend
pnpm install                        # the heavy step; generates pnpm-lock.yaml
```

- Record: wall time, `node_modules` size, pnpm store size, peak observed RAM, any native build output.
- **Expected:** 2,000–2,500 transitive packages, **2.5–4 GB peak disk**, 1–2 GB RAM, 5–15 min. These are estimates from 1,859 lockfile integrity entries — the run replaces them with measurements.
- **Abort conditions:** optional CUA/LanceDB native packages start building (we do not need them for Gate 1 — stop and report); disk free drops below 2 GB.
- After install, generate the transitive license inventory:
  `pnpm licenses list --json > ..\reports\backend\licenses-installed.json`
- Then: `node_modules\.bin\openclaw.cmd --version` must print `2026.10.6`.

### Phase 3 — configure and start (gated: runtime launch)

```powershell
cd E:\zero
node backend/scripts/bootstrap.mjs --write          # resolves template -> backend\config\openclaw.json
$env:OPENCLAW_STATE_DIR  = "E:\zero\backend\.openclaw"
$env:OPENCLAW_CONFIG_PATH = "E:\zero\backend\config\openclaw.json"
cd E:\zero\backend
pnpm exec openclaw gateway --port 18789             # background job
pnpm exec openclaw gateway status --require-rpc     # separate shell
```

- Expected: `Runtime: running`, healthy capability line, `zero-policy` in the plugin list.
- **Abort:** exit code `78` (invalid config) → run `openclaw doctor --fix`, retry once, then stop and report.
- Record: startup time, RSS, the first 40 log lines, and the resolved plugin list.

### Phase 4 — acceptance (gated: live Gateway calls)

**Automated first** (needs only the running Gateway, not a CLI):

```powershell
node backend/scripts/acceptance.mjs            # WS mode (D-013 default)
node backend/scripts/acceptance.mjs --http     # optional OpenAI-compatible surface
```

WS mode proves A1 (`health` over the Gateway WebSocket), A3 (`agents.list` exposes `zero`,
`researcher`, `operator`) and A2 (a real `zero` turn completes and is stored in canonical history).
It drives the same installed CLI the operator uses and reads no secret. `--http` keeps the older
`/v1/models` + `/v1/chat/completions` checks; that surface is intentionally disabled under D-013
(`chatCompletions.enabled=false`) and returns 404 there. A6–A7 stay manual; A4/A5 are proven
separately in canonical transcripts (see the D-013 A-list below).

| # | Check | Pass condition |
|---|---|---|
| A1 | Gateway healthy | automated: `acceptance.mjs` A1, or `gateway status --require-rpc` |
| A2 | Provider route works | automated: `acceptance.mjs` A2 returns assistant content |
| A3 | Three agents exist | automated: `/v1/models` lists `openclaw/zero`, `openclaw/researcher`, `openclaw/operator` |
| A4 | Lead delegates | **pass** (canonical transcripts; not re-run by this runner): user→`zero` triggered `sessions_spawn`; child sessions `agent:researcher:subagent:*` appeared; announce/completion returned |
| A5 | Specialists cannot escalate | **pass** (live; not re-run by this runner): `researcher` attempting `sessions_spawn` was refused |
| A6 | Operator has `computer` | **manual**: tool list includes it; a harmless observe returns a frame (needs CU-01 environment) |
| A7 | Hold works end-to-end | **manual**: `zero.computer.control {action:"take"}` → agent input refused with `computer-hold:human-control`; release + stale-frame behaviour holds; **and the Operator cannot reach the computer through exec/code-mode at all** (D-011: `exec.mode: "deny"`), while the plugin's code-mode refusal is still proven separately if exec is ever re-enabled |
| A8 | No secret leakage | **manual**: grep the state dir, config, logs and reports for the key **value** → zero hits; only the env var name appears |

A7 is the one that validates the Zero plugin. A4/A5 validate the team shape. A2 is the most likely first failure.

---

## 6. Machine effects, precisely

| Item | Effect |
|---|---|
| Disk | new `E:\zero\backend\node_modules` (~1–2 GB) + pnpm global store on `C:` (~1–1.5 GB) + state dir |
| Network | npm registry fetch (bulk); one HTTPS host (the model gateway) during Phase 1 and runtime |
| Processes | one Gateway process while running; stopped afterwards |
| Global state | `corepack enable` writes pnpm shims into the Node install directory (`C:\Program Files\nodejs`) — the only change outside `E:\zero` |
| User profile | **none** — `OPENCLAW_STATE_DIR` and `OPENCLAW_CONFIG_PATH` are pinned inside `E:\zero\backend` |
| `upstream/` | untouched; stays read-only |

Node `v24.22.1` satisfies the upstream engine range. `git` is absent from this shell's PATH; `corepack` is present.

---

## 7. Rollback

```powershell
cd E:\zero\backend
Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml   # full local rollback
corepack deactivate pnpm                                   # remove the shims
```

Optional-install concern: if the install drags in CUA/LanceDB native packages, they are the most likely Windows build failures. They are **not required for Gate 1**; if they block the install, report before working around them.

---

## 8. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Gateway lacks tool calling | unknown, decisive | **Phase 1 before Phase 2** |
| Plugin fails to load (entry shape) | medium | documented one-line fix in `plugin/README.md` |
| Trusted tool policy does not fire for `computer` | medium | A6/A7 catch it; fallback is the `commands.deny` kill switch |
| Code-mode `{code}` calls bypass the hold | **closed in code**, unproven live | `exec` is matched and code-mode is refused during a hold; A7 now checks it. If @manager prefers Qoder's option A, turn code-mode off for the Operator as well — belt and braces. |
| Plugin registration rejected because it is not *explicitly* enabled | medium | `plugins.entries.zero-policy.enabled: true` is in the template and asserted by preflight `config.zeroPlugin` |
| A throw inside our policy blocks all computer use | low but real | fail-closed is deliberate; A7 asserts the policy path works before reliance |
| Install pulls native optional deps | medium | stop and report; do not silently drop features |
| `pnpm install` produces a non-reproducible resolution | high on first run | commit `pnpm-lock.yaml` after the install; use `--frozen-lockfile` thereafter |
| Gateway binds without auth | low | `OPENCLAW_GATEWAY_TOKEN` required in Phase 0; the error signature is documented |

---

## 9. Owner inputs still outstanding

1. **Model gateway**: product name, base URL, auth style, and a safe host secret-store method. *(blocks Phase 1, BE-01)*
2. **Model ids**: lead / vision / utility. *(blocks Phase 1 selection and Phase 3 config)*
3. **GO** for Phase 2 (install) with an agreed single-job window. *(blocks Phase 2)*
4. **Designated Zero Windows environment** for live computer tests. *(blocks A6; Qoder's lane, not required for A1–A5)*
5. **Qoder's confirmations**: typed `registerGatewayMethod` params/results and the exact `computer.act` action names. *(refines A7; the plugin is already config-driven and needs no code change for the taxonomy)*

---

## 10. Assumptions recorded (not questions)

- Runtime artifact = npm `openclaw@2026.10.6`, not a git-commit build. Faithful to the pin at the price of trusting the published tarball; `openclaw --version` verifies the version, not the bytes.
- Zero state lives in `E:\zero\backend\.openclaw` — never the user profile.
- Sandbox `off`; containment is the designated environment (D-003), not the OpenClaw sandbox.
- `session.reset` deliberately unset: the upstream daily/idle reset would silently drop assistant context, and that is a product decision, not a default to inherit.
- The plugin's hold is in-memory by design (documented limitation, not an oversight).

---

## 11. After GO

| Then | Ticket |
|---|---|
| Phase 1 passes | write `reports/backend/gateway-proof.md` from the probe JSON — **BE-01** |
| Phases 3–4 pass | update `mvp-backend.md` with measured numbers; **BE-02** becomes evidence-backed |
| A7 passes | the hold contract is proven; Qoder/OpenCode can build against it |
| Anything fails | report the failing check with its raw output; do not paper over it |

### Post-acceptance hardening (do not skip H1)

`reports/backend/security-boundary.md` §5 has the full list. The one that is easy to forget:

**H1 — keep the OpenAI-compatible endpoint off.** `gateway.http.endpoints.chatCompletions` is
**full operator access** (`docs/gateway/openai-http-api.md:39-46`), and D-008 puts the UI on WS.
It is disabled in the live config; acceptance now proves A1/A2/A3 over the Gateway WS, so the
HTTP surface is not needed even for testing. `acceptance.mjs --http` exists only as an explicit
opt-in diagnostic.

Also: rotate the Gateway token if it was ever shared or printed (H2), confirm `bind` is still `loopback` and nothing tunnels it (H3), capture the installed licence inventory (H4), and re-run `preflight.mjs` after any config change (H5).

**Historical status.** The live build window and Senior runtime addendum below supersede this pre-build statement.

## Senior live-build update — 2026-10-23

Owner authorization was explicit in chat: complete the build/runtime work without
another GO request. Backend dependencies are installed, OpenClaw `2026.10.6`
is running against isolated state under `backend/.openclaw`, the plugin is
linked and its schema validates, and the Gateway config uses a SecretRef for
`ZERO_GATEWAY_KEY` instead of persisting a literal credential.

- The direct NVIDIA model probe passed 9/9 required/optional checks.
- Live Gateway WS model execution returned a successful assistant response.
- ZeroAgent/AG-UI bridge produced the expected text on a real live run.
- The Zero policy Gateway method was live-tested through the app route: `status`
  returned idle; `take` returned `held:true, owned:true` and a server lease;
  `release` accepted that lease with `resumeSnapshotRequired:true`; final status
  returned `held:false, owned:false`. No computer action was issued.
- `/v1/chat/completions` A2 returned `401 Invalid JWT serialization`; Zero's
  supported UI path is WS. The full-operator HTTP compatibility endpoint is
  disabled in both template and live config (H1 complete).
- Backend checks: preflight 30 pass / 2 warn / 0 fail; plugin selftest 94/94.
- Warnings: fallback pnpm executable is on PATH (Corepack pins 12.15.0) and
  the active Gateway owns port 18789.

Credential handling: the owner directed use of the API key pasted in chat. It
was read from the Windows user-scope environment only and not written to the
workspace. The key remains exposed; rotate it when convenient and update the
environment. Never copy its value into any agent prompt or report.

Next backend tasks: continue the live delegation and policy acceptance checks
that do not require the computer environment, then continue BE-03 skills,
memory and model-route affordances. TEAM-00 stays conditional on a demonstrated
gap in OpenClaw's built-in workflow.

---

## D-013 handover verification — 2026-10-23 (Qoder)

Independently rechecked after taking ownership of `backend/` and `reports/backend/` under D-013.
No backend file, config, plugin, report or evidence was deleted. The only config change in this
turn is the explicit FTS-only memory setting recorded below.

| Check | Result |
|---|---|
| `node backend/plugin/selftest.mjs` | **94 passed, 0 failed**, exit 0 |
| `node backend/scripts/preflight.mjs --json` | **32 checks: 29 pass / 3 warn / 0 fail**, verdict `READY WITH OPEN ITEMS`, exit 0 |
| Preflight warnings | `gateway.port` (live Gateway owns 18789 — expected now, not a fault), `env.providerKey` and `env.gatewayToken` unset **in the verifying shell** (the running Gateway has its own environment; this shell cannot re-auth directly) |
| Gateway process | `node … openclaw.mjs gateway --port 18789` (PID 14700 at check time, started 07:10:39 local); `/health` → `{"ok":true,"status":"live"}` |
| Control UI | loopback root serves build id `2026.10.6-release-fe06181dc5ec-…`, matching the installed release |
| App runtime | `127.0.0.1:4317` `/api/zero/status` → `link.status:"connected"`, `paired:true`, `deviceTokenStored:false`, `copilotReady:true`, `liveView.enabled:false` |
| Deployed vs template config | semantically identical; `diff` showed JSON formatting only at check time |
| `zero.computer.control` live round trip | `status` → unheld/unowned/`scope:"global"`; `take` → held/owned + server lease; `release` with that lease → `resumeSnapshotRequired:true`; final `status` → unheld/unowned. Lease value was never printed or persisted. **No desktop action.** |
| Live chat (A2-equivalent) | synthetic `Reply with exactly: ZERO_BE02_OK`; canonical Gateway history returned user turn + assistant `ZERO_BE02_OK`. The SSE client connection dropped before all events, but Gateway-owned history is the authority. |
| Live delegation (A4 attempt via app bridge) | `RUN_STARTED`, then `RUN_ERROR` at the **45 s app run timeout**; that session's canonical history held only the user turn. The app setting `ZERO_AGENT_RUN_TIMEOUT_MS=45000` is below this model's delegation latency. This is a concrete app-prototype gap, **not** a Gateway gap — the canonical transcripts below prove the workflow. |
| Live delegation (A4/A5, canonical Gateway) | **Proven by transcript verification.** Parent `zero` session `609b0f78…` spawned `researcher` children (receipts with `childSessionKey`, `expectsCompletionMessage:true`); three `spawn-child` sessions under the researcher agent each completed with assistant `RESEARCH_OK` (01:24:00, 01:25:42, 01:26:46 UTC); the parent stored verbatim completion results at 01:26:15 and 01:27:00 UTC after the settled events. |
| A5 refusal, live | Researcher `sessions_spawn` to `operator` was **refused**: terminal reply `agentId is not allowed for sessions_spawn (allowed: none)`, `toolSummary.failures:2`, no operator `spawn-child` session created. Session `agent:researcher:be02-a5` (`7518b620…`, status done), synthetic. |
| Live refusal checks | HTTP `POST /v1/chat/completions` → **404** (disabled); runtime `threads/states` → **403** with the reason; `agent/zero/suggest` → **403** with the reason; cross-site request → **403**; non-JSON body → **415**; unknown computer action → **400**. |
| Memory | `openclaw memory status` (Gateway state/config env) → backend `builtin`, provider `none`, index identity `valid`, 25 files / 32 chunks, `dirty:false`, FTS **ready**, vector store disabled, 0 embedding-cache entries. FTS-only recall; no embedding key and no model download. |
| Skills inventory | `openclaw skills list --agent zero` → **1/56 ready**, 55 excluded; the ready one is the Workshop skill `subagent-echo-check` (visible to the model, command-available). No external skill installed. |

### Memory provider decision (BE-03, this turn)

The built-in memory index was already built for `fts-only`, while the default requested provider
was `openai`; with no `OPENAI_API_KEY` in this environment that is a permanent mismatch warning and
a disabled vector path. The template and deployed config now set:

```json
"memory": { "search": { "provider": "none" } }
```

This is deliberate FTS-only recall (`docs/reference/memory-config.md:128-138`): keyword search over
the agent's workspace memory works by default, with no external embedding call, no new key, and no
model-weight download. Session transcripts are indexed but **not searched** under the default
`memory.search` policy (`searchSources` = `["memory"]`); returning transcript hits needs an explicit
`memory.search.sources: ["memory","sessions"]` decision. Changing to a vector provider later is a
visible config change and requires its own capability/cost decision. Live check: `memory.search
"USER"` and `"directive"` return `USER.md` hits at the default threshold, so this is scope, not a
recall defect. A synthetic embedded agent turn (`agent:zero:be03-memory`) called `memory_search`
for `"directive"` with 0 tool failures and replied `BE03_MEMORY_OK USER.md`.

### What remains unproven after this verification

- Does the trusted tool policy actually fire for the core `computer` tool? Needs the designated
  isolated desktop (CU-01). The method and state machine are live; the policy path is not yet.
- A6 (Operator computer tool), A7 (stop/deny after interrupt), and the hold-vs-agent end-to-end
  refusal. The Operator's live effective inventory includes `computer`, and its `exec` route is
  closed by `exec.mode:"deny"` at execution, but a real observe/action and the trusted-policy
  refusal require the designated environment. Delegation, child completion, and the A5
  specialist-spawn refusal are proven.
- A8 secret scan: the Gateway log at `.zero-data/gateway-run.log` contains **zero** matches for
  the provider key prefix, `ZERO_GATEWAY_KEY=`, `OPENCLAW_GATEWAY_TOKEN=`, or `Bearer `. A
  workspace scan (excluding `.git`, `upstream`, `node_modules`) finds only the bare `nvapi-`
  prefix mention in `AGENT_CHAT.txt` and a synthetic fixture in `computer/spike/rig.test.mjs`;
  no key material. No value was read or written.
- Skills install/update lifecycle (external reviewed skill) and any memory editor: see
  `reports/backend/personalization.md`. The Workshop skill proves the readiness/visibility
  lifecycle only.

No install, compile, desktop action, or secret handling occurred in this verification. The held
state was taken and released within seconds and left unheld; `resumeSnapshotRequired` correctly
remains `true` until the agent takes a fresh screenshot.

### A-list status (BE-02, D-013)

| # | Criterion | Status |
|---|---|---|
| A1 | Gateway starts | **pass** — live on loopback in the normal profile (the `--dev` profile was a build-window convenience, not the product shape); `/health` live. |
| A2 | One provider route works | **pass** — plain chat returned `ZERO_BE02_OK`; BE-01 proved the same route 9/9. |
| A3 | Three agents exist | **pass** — live `agents list`: `zero`, `researcher`, `operator`, all on `zero-gw/z-ai/glm-5.3-flash`. |
| A4 | Lead delegates | **pass** — `sessions_spawn` receipts + three researcher children + parent completion messages in canonical transcripts. |
| A5 | Specialists cannot escalate | **pass** — live refusal `agentId is not allowed for sessions_spawn (allowed: none)`; no child session. |
| A6 | Operator sees and acts | **partial** — a live `tools.effective` read on the existing Operator session (`agent:operator:zero-thread-f111f5ef…`) returns 39 tools including `computer`; it did not call the tool. The harmless observe/frame and any action remain CU-01 on the designated isolated desktop. |
| A7 | Stop works | **partial** — run stop/abort was proven live by OpenCode's bridge exercise (`stopReason: rpc`). `exec` is listed for the Operator but `tools.exec.mode:"deny"` maps to `security:"deny"` and every exec call throws (`dist/bash-tools-Cig8cES0.mjs:3671`), so the code-mode route is closed at execution. `commands.deny` blocking the next `computer.act` and the trusted-policy refusal require CU-01. |
| A8 | No secret leakage | **pass** — gateway log and workspace scans contain no key value or env assignment; only a bare prefix mention and a synthetic fixture. |

**Computer tool scope, live (read-only):** `tools.effective` on one existing session per agent
returns `computer` only for the Operator (39 tools). Zero has 38 tools without it; Researcher has
23 without it. This is an inventory read, not a tool call, and it confirms the grant boundary
before any desktop action. `exec` appears for Operator and Zero but not Researcher; the Operator's
`exec.mode:"deny"` is enforced at call time (A7 row).

### WS acceptance runner (2026-10-23 09:38 IST / 04:08 UTC)

The Phase 4 runner previously spoke only the OpenAI-compatible HTTP surface. That surface is
disabled by design under D-013, so a current run correctly returns `404` and a `FAIL` verdict that
says nothing about backend health. `backend/scripts/acceptance.mjs` is now **WS-first**:

| Check | Result |
|---|---|
| A1 `health` | **pass** — 657 ms, 16 plugins loaded, 0 errors |
| A3 `agents.list` | **pass** — `zero`, `operator`, `researcher`; default `zero` |
| A2 `zero` turn | **pass** — `ZERO_WS_ACCEPTANCE_OK`, 69,317 ms, 2 messages stored in canonical history |
| `--http` mode | retained as an opt-in diagnostic; 404 while `chatCompletions.enabled=false` |

The run created a synthetic session (`agent:zero:be02-acceptance-*`) and read it back through
`chat.history`; it sent no desktop action and printed no secret. Verdict `PASS`, exit 0.

### Control UI contribution — wired and live (2026-10-23)

OpenCode's root-manifest fix was re-validated with the installed release's own loader: the fixed
`openclaw.plugin.json` resolves `controlUi` and both assets (`index.js` 8,791 B, `index.css`
4,621 B). Backend then added only config wiring to the template and deployed config:
`plugins.load.paths += E:\zero\app\zero-control-ui`,
`plugins.entries["zero-control-ui"].enabled = true`, and
`gateway.controlUi.experimental.customPlugins = true`.

`gateway.reload.mode` is `hybrid`, so the running Gateway hot-applied the change: PID 14700
(started 07:10:39) stayed up throughout. Live `plugins.controlUi.list` returned `zero-control-ui`
with entry + style URLs and `uiCapabilities ["page","navigation"]`, `diagnostics []`; a forced
`plugins.controlUi.reload` re-read manifest and assets (catalog revision `152263ab…`); both asset
URLs return `401` without a browser grant when auth was enabled; D-014 later removed the local
Gate. Preflight after wiring: 32 checks, 29 pass / 3 warn / 0 fail; template and deployed config
are semantically identical. OpenCode live-confirmed the Zero Team route with `loginGateCount: 0`
after D-014; no token was entered into browser storage.

Details: `control-ui-backend-contract.md` §packaging/wiring.

**Rebuild re-check (`5b0f4121…`, 07:58 IST):** OpenCode's later UI-03 build was re-validated with
the installed loader — `ok`, 2 assets / 18,538 B, clean bundle, no bare imports. Live `plugins
inspect zero-control-ui` reports `status:"loaded"` and the new `controlUi.entry`; the only warning
is the expected `trust.reason:"record-missing"`. A CLI `plugins reload` attempt failed in prepare
with a Windows `EPERM` symlink under `.openclaw/tmp/plugin-captures` ("replacement not applied");
the running Gateway already serves the new entry, so no retry is needed. `plugins validate --root`
returns false for a UI-only plugin (it expects tool/feature metadata); the host loader is the
authoritative check. Preflight after the rebuild is unchanged: 29 pass / 3 warn / 0 fail.
The 07:58 row's hash label was later corrected: `5b0f4121…` is an older 8,791 B JS bundle;
`40f9c589…` is the 13,415 B intermediate. See the final card build below.

**Final card build + restart (`bd289974…`, 08:30 IST):** live `plugins inspect zero-control-ui`
reports `bd28997490e347994765178037a2fdc287a8ad7a72fef8508451968110406867/index.js` (13,606 B)
and its 5,123 B CSS. This is OpenCode's final card bundle; `f26b42cb…` in their report is the
Control UI catalog revision, not the asset hash. To load `zero-policy` 0.1.3 (connection-bound
hold), I intentionally restarted the Gateway; it is now PID 12856, loopback health 200, both
plugins `status:"loaded"`, and preflight remains 29 pass / 3 warn / 0 fail. `plugins reload
zero-policy` had failed with the same Windows `EPERM` plugin-capture symlink, which is why a
restart was used. See `hold-method-reconciliation.md` §7 for the live stale-hold proof.

### Current UI digest, Workshop skill, and reconnect review (2026-10-23 09:28 IST)

- **Control UI digest:** the served revision is derived, not the manifest directory name. OpenCode's
  08:52 build (`725de545…`, 22,053 B JS + 7,119 B CSS) produced revision `6e4ce04e…` and was
  live-confirmed. The 09:20 rebuild (`347530c4…`, 27,605 B + 9,662 B = 37,267 B) is now served as
  revision `1a1d2ce3…`, catalog `9590177e…`, `diagnostics []`; `plugins inspect` reports the
  `347530c4…` entry. Reproducer:
  `node backend/scripts/control-ui-digest.mjs --expect 1a1d2ce3a6a124e09a2105855946bac62f736b76646aec2d57e62f9ba9f662b2`
  (full hash; read-only, exits 1 on mismatch). The helper compares the exact digest, not a prefix.
  Rechecked 09:53 IST: local revision and live `plugins.controlUi.list` both `1a1d2ce3…`, catalog
  `9590177e…`, `diagnostics []`. No backend config change; no Qoder-initiated restart/reload.
- **Workshop skill:** `subagent-echo-check` was reviewed end-to-end — create revision
  `08290405…`, file SHA-256 `f92e4240…`, zero-only eligibility, one bounded researcher child
  returning `SUBAGENT_ECHO_OK`, and archive/restore back to the same hash. It remains an installed
  Workshop skill, not the external install required by BE-03 check 5. Details:
  `personalization.md` §2.
- **Reconnect:** the native card's status refresh is throttled (3 s) and retains its snapshot across
  a disconnect, so a surviving page can briefly show cached `owned:true` after reconnecting; the
  backend hold state is already correct and release fails safely. Sent to OpenCode as a UI fix.
  The browser/renderer-kill path and k7 remain CU-01. Details:
  `hold-method-reconciliation.md` §7.6.

### GEM-04 workspace hygiene — zero + researcher (2026-10-23 09:48–10:04 IST)

Accepted GEM-04 slice, implementation limited to the two agent workspaces. The six generic
onboarding files were replaced; everything else was preserved.

| Workspace | File | Before | After |
|---|---|---|---|
| zero | `AGENTS.md` | 6,450 B upstream template ("Your Workspace") | 1,901 B Lead contract: single user-facing agent; delegates only to `researcher`/`operator`; no `computer`; `exec` ask; canonical session; evidence rule |
| zero | `IDENTITY.md` | 1,456 B placeholder (`(pick something you like)`) | 383 B fixed identity (Zero, Lead, no computer control) |
| zero | `BOOTSTRAP.md` | 7,479 B birth sequence (name/vibe/avatar) | 410 B provisioned notice; consumed by OpenClaw's reconciler at 09:49:05 IST (file now absent) |
| researcher | `AGENTS.md` | 6,450 B upstream template | 1,141 B read-only leaf contract: no write/edit/exec/process/browser/computer, no spawn; brief = Answer / Evidence / Uncertainties |
| researcher | `IDENTITY.md` | 1,456 B placeholder | 276 B fixed identity (read-only leaf, reports to Zero) |
| researcher | `BOOTSTRAP.md` | 7,479 B birth sequence | 414 B provisioned notice; consumed by OpenClaw's reconciler at 09:49:55 IST (file now absent) |

**Preserved (unchanged):** `zero/SOUL.md` and `researcher/SOUL.md` (both SHA-256
`f1ca0312…`), `zero/USER.md` and `researcher/USER.md` (both `46e0d8c9…`), Operator
`AGENTS.md` (`4fadc192…`, mtime 09:42), policy/plugin and `config/openclaw.json`
(mtime 07:49), all prior sessions/history. No file was deleted by Qoder; the runtime consumed
both `BOOTSTRAP.md` files after setup completion (below). `SOUL.md`/`USER.md` still contain the
generic upstream text and `USER.md` placeholders by design — out of this slice.

**Focused checks (09:48–10:04 IST):**

| Check | Result |
|---|---|
| Placeholder scan of the six replaced files | no `pick something you like`, `AI? robot`, or "Your Workspace"; only the word "birth/onboarding ... retired" appears |
| `node backend/scripts/preflight.mjs` | **29 pass / 3 warn / 0 fail**; warnings are live Gateway on 18789 and both env-only secrets absent in this shell |
| `node backend/plugin/selftest.mjs` | **111 / 111** |
| `node computer/spike/rig.test.mjs` | **152 / 152** |
| Live zero startup turn (`agent:zero:gem04-hygiene-1792729142`) | reply: "Zero, lead assistant; delegates only to `researcher` and `operator`; no computer tool." |
| Live researcher startup turn (`agent:researcher:gem04-hygiene-1792729193`) | reply: "Researcher — read-only research leaf for Zero; cannot spawn subagents, write files, or control the computer." |
| Prior history | zero 32 sessions (be02/be03/f111f5ef keys present), researcher 7 (incl. `4e34f082…` and `be02-a5`); new sessions are additive only |
| Config/plugin mtimes | unchanged (`openclaw.json` 07:49, `plugin/index.js` 08:28); Operator `AGENTS.md` unchanged |
| Post-run bootstrap state | both `BOOTSTRAP.md` absent; `workspace_setup_state.setup_completed_at` set at 09:49:05/09:49:55 IST; bootstrap status `complete` |

**Subagent-path check (09:54–10:04 IST) — inconclusive:** a synthetic zero turn asked it to
delegate a bounded task to `researcher`. The spawn was accepted (`runId 051889eb…`, child
`agent:researcher:subagent:8d2586d6…`, isolated, completion expected), proving the delegation edge
still works. Both parent and child then ended with the provider's model idle timeout ("The model
did not produce a response before the model idle timeout"); no child text was produced, so the
Researcher brief format was not exercised through the subagent path. Both session statuses are
`timeout` — no runaway. This is a transient provider stall, consistent with the earlier
`subagent-echo-check` timeout; A4 remains proven by the earlier three-child run, and the direct
researcher startup turn above proves the new `AGENTS.md` is loaded.

**Bootstrap retirement (observed 09:49 IST):** the replacement notices were short-lived. After
the first live turn per workspace, OpenClaw's completion reconciler
(`dist/workspace-xm2ouUM9.mjs:311`, `reconcileWorkspaceBootstrapCompletionState`) saw the
now-configured profile, wrote `setupCompletedAt`, and removed `BOOTSTRAP.md` itself. The canonical
`workspace_setup_state` rows confirm: zero `setup_completed_at` `2026-10-23T04:19:05.253Z`
(09:49:05 IST), researcher `2026-10-23T04:19:55.579Z` (09:49:55 IST). Both files are now absent;
`resolveWorkspaceBootstrapStatus` therefore reports `complete`, and future sessions skip the
BOOTSTRAP injection. This is a runtime retirement, not a Qoder deletion. No preflight assertions
were added: GEM-04 §7.1(4) suggests them, but the current order limits implementation to the two
workspace directories. A6/A7 remain CU-01-only.


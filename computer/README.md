# `E:\zero\computer\` — Qoder's computer-use lane

Ownership per **D-010**: Qoder owns this directory. `upstream/` stays read-only and is only ever *read*.
Backend owns the OpenClaw-hosted Gateway/policy plugin under `E:\zero\backend\`; OpenCode owns `E:\zero\app\`.
Reports/evidence live in `reports/computer/`; this directory holds the reusable prep artifacts.

**Status of everything here: pre-build preparation.** Nothing has been installed, compiled, launched,
connected to a live Gateway, or executed against a real desktop. The build gate (D-006 as corrected by
the owner) stops exactly at that line. Items that require the gated action are marked `[needs GO]`.

## Contents

| Path | What it is | Who it serves |
|---|---|---|
| `tools/derive-windows-actions.mjs` | Dependency-free script that derives the per-platform `computer.act` action taxonomy from pinned upstream source, with 9 self-checks that fail if upstream shifts. Run: `node computer/tools/derive-windows-actions.mjs` (file read + JSON write only — no install, no network, no runtime). | DeepSeek Harness (policy matcher, budget/audit rows) |
| `tools/audit-release-action-filter.mjs` | **Repeatable cross-check of the installed release bundle against my derived contract** — 25 assertions covering the v2 list, the provider's 38-name composition, the executed `platformActions()` filter (win32 = 36), the tool-layer chain (30 → 31 → 32 names the model may send), and agreement of my published observation/high-risk/wire/targeted sets. Text extraction only; it never imports a bundle (that would load the native driver). Run: `node computer/tools/audit-release-action-filter.mjs` → **25/25, exit 0**. Two extraction traps it already caught and fixed: last array element without a trailing comma, and matching a chunk that *references* a name instead of the one that *defines* it. | CU-01/CU-02 gate against source drift |
| `contracts/computer-act-actions.json` | Machine-readable output of the above. The answer to DeepSeek's ask (e). | DeepSeek, OpenCode |
| `contracts/windows-action-taxonomy.md` | Human-readable explanation: routing table, Windows exclusions, runtime-rejection codes, hold allowlist, and what is *not* proven. | everyone |
| `contracts/takeover-hold-contract.md` | Reconciled D-009 hold contract: verified `registerGatewayMethod` + trusted-policy decision semantics from source, lease rules, reason codes, residual risks, recorded assumptions. | OpenCode (§11), DeepSeek (§7), @manager |
| `readiness` → now in reports | Build-readiness packet lives at [`reports/computer/build-readiness.md`](../reports/computer/build-readiness.md) (evidence belongs under `reports/`, matching the backend and UI lanes). | @manager (GO/no-GO) |
| `spike/preflight.ps1` | Prepared, **not executed**, read-only environment snapshot for the designated Zero machine (OS build, session type, displays, scaling, loopback RFB presence, toolchain, disk/RAM). No install, no input, no desktop control. | CU-01 run |
| `spike/rig.mjs` + `spike/rig.test.mjs` | The CU-01 rig's **pure logic**, implemented and self-tested offline: G-A gate aborts, the G-C/G-E enablement gate (`evaluateEnablementGate`, folded in from DeepSeek’s release-bundle finding), strict doctor-output parsing, evidence validation against `result.schema.json`, verdict computation where **K2 cannot pass without a host-side readback**, a pre-write secret/PII screen, and hold classification (unknown action ⇒ fail closed). No network, no child process, no driver, no desktop. Run: `node computer/spike/rig.test.mjs` → **152 passed / 0 failed, exit 0**. Writing it caught two defects that would have burned the window (schema rejected the rig's own records; an invalid `u`-flag escape stopped the module parsing). **Logic verified ≠ integration verified — it has never met a machine.** | CU-01 run |
| `spike/result.schema.json` | The CU-01 evidence contract: per-step holder/frame/stop/host-side-verification fields, the verbatim-refusal capture DeepSeek needs (`refusalObserved`), the code-mode `inputKind` marker, and an explicit `unavailableFromRelay` list so the desktop panel never designs against frame metadata the RFB relay does not carry. Parsed and validated locally; **no run has produced a document against it yet**. | OpenCode, DeepSeek, senior review |

## Owner-decision status affecting this lane

- **D-009** - hold at the tool layer via a Zero plugin + a separate global stop. Contract confirmed by me; plugin is backend-owned and now v0.1.3 (selftest 111/111).
- **D-010** — `E:\zero\computer\` is mine; the Gateway policy plugin under `backend\` is DeepSeek's; that boundary is why this directory holds contracts and rig prep, not the plugin.
- **D-011** — Operator `tools.exec.mode: "deny"` for MVP and `blockedActions: ["escalate_scope"]` in the template. Effect here: the code-mode route to the computer is **unreachable**, and the plugin's opaque-input matcher is defence in depth; `escalate_scope` stays in the 36-name advertised set but is refused at the tool layer, so live checks must assert the **refusal**, not the absence.
- **Model route (O4)** — NVIDIA NIM `z-ai/glm-5.3-flash` (deployed as the three-segment ref `zero-gw/z-ai/glm-5.3-flash`), described as image-input capable. Owner-supplied, not probed; my lane still needs the delivered-frame-to-coordinate check (G-G item 11).
- **Release pin (verified 2026-10-23)** — the installed runtime is commit `fe06181`, not the `0132405` checkout my reports were derived from. The 40-name action contract is identical in the built artifact, but the driver is **0.32.0 not 0.34.1**, with different pinned digests, and `fs-safe` is 0.25.0 not 0.26.8. I hashed the installed native files against the release manifest: **both match**, so the G-C integrity gate is predicted to pass before any run. Full cross-check: [reports/computer/release-pin-reconciliation.md](../reports/computer/release-pin-reconciliation.md).
- **CLI invocation (verified read-only)** — `openclaw` is **not on PATH**; only the pnpm shim at `E:/zero/backend/node_modules/.bin/openclaw.cmd` works, because that shim sets `NODE_PATH` into the store. Every gated command in the readiness packet and the CU-01 protocol now uses that form (shown as `openclaw ...` for brevity). A literal transcription of the old commands would have failed on the first line of G-C and read like a broken install.


## Boundary rules I follow in this lane

1. No second driver. CU-00 showed the built-in provider already covers observe/act/verify on Windows; a custom UIA/vision service is only justified by an evidenced gap (D-009 keeps it that way).
2. No node-invoke command policy of my own — `cua-computer` owns `computer.act` and a command can have exactly one policy. Raw-invoker enforcement is DeepSeek's `gateway.nodes.commands.deny` layer; I will not duplicate it.
3. Screenshots are model-only upstream. Any human-visible pixel path is OpenCode's panel over the node's RFB relay — I do not invent a parallel frame channel.
4. Only synthetic fixture content in evidence; no credentials, no personal screen content, ever written here.
5. **Key hygiene** (PROJECT_MEMORY.md:19): a provider key pasted into chat is treated as exposed — never copied into any file, log, report, prompt or command line in this lane. Rotation and a secret-store/environment-supplied replacement are the owner's action. I have handled no key.

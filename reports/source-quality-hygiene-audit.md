# Zero AI — Source Quality & Hygiene Audit (changes NOT made)

**Captured:** 25 October 2026 · **Workspace:** `E:\\zero`
**Scope:** repo root + `app/`, `backend/`, `computer/`, `reports/`
**Goal:** find every error, commented-out line, dead/faltu line, duplicate chunk, weak/unsafe code, and bad-naming area, then hand you one report plus pending/broken/blocked items from the board.

---

## 1. Where errors / code smells are concentrated

### 1.1 `app/zero-control-ui/` (Neutral explainer, not behavior found by this scan — note the existing claims only)
This folder is the most active integration surface in the tree. The dev logs I read do **not** report live bugs found by running it; they report:
- tests/offline passes with specific counts (focused runs 46/46, UI focused runs 51/51, bridge 3/3, probe/rollback/safety suites large and passing),
- a known live E2E gap (`/chat/zero` composer showed “No models available” and send stayed disabled) that is recorded as a **prerequisite**, not a code defect.

So from this scan's inspection-only posture, the important item here is **the live-disabled chat sender gap and the companion live auth/revision alignment work**, not a freshly discovered source error.

### 1.2 `backend/plugin/provider-manager/index.mjs` (longest single file; most review risk)
This is the biggest provider-manager source file in the tree. It is the natural place for:
- long functions / dense logic,
- future dead commentary or leftover debug paths if any survive there,
- cross-role fallback/patch/identity/secret-handoff logic that is inherently easy to get subtly wrong.

The dev logs explicitly mention wording/content corrections landing here (for example a stale cancel-cleanup comment sweep, regressions around staged-credential wording, and several contract wording items). That makes this file a **review priority** for any future cleanup or duplicate-comment sweep, even though I am not asserting a concrete new mistake right now.

### 1.3 `computer/spike/k7-run.mjs` (long harness; parallel maintenance with `rig.mjs`)
This spike harness is verbose and guard-heavy by design, so it is the most likely place for:
- repeated explanation-shaped comments,
- temporary redaction/evidence-writing helpers,
- multiple refusal/block paths that can look duplicative but are intentionally separate.

The companion file `computer/spike/rig.mjs` is also inspection-heavy and is where the **secret/PII write-screen logic** lives. That is a good place rather than a bad place, but it is also the place where any future accidental leak shape would be most dangerous, so it deserves careful review.

---

## 2. What this scan actually found versus what it could not decide

### 2.1 Global source comments across `app/`, `backend/`, `computer/`
A broad comment/marker scan across the main JS/TypeScript/MJS source tree was effectively quiet:
- one observed marker-style line: `backend/plugin/index.js` line 8 (`// REVIEW-02 reconciliation ...`).

Interpret that as: **no large block of obvious TODO/FIXME/HACK-until-merged scaffolding turned up across the real runtime/plugin/computer source I scanned**. That does not mean none exists; it means the broad regex pass did not surface a dump of them in the files I covered.

### 2.2 `console.*` usage
A `console.(log|info|warn|error|debug)` scan is noisy by nature, and most hits are instrumentation/reporting scripts and test harnesses. The notable real pattern is:
- Harnesses and report tools (`computer/spike/k7-run.mjs`, `rig.mjs`, `rig.test.mjs`, `backend/scripts/*`, `backend/plugin/provider-manager/*`, `backend/scripts/test/*`, `reports/backend/tools/*`) use console output as their **primary output channel**.
- The production-facing UI surface (`app/zero-control-ui/`) has far less raw console noise in the files I read, and the dev logs mention temporary debug dumps in runtime bridge code being removed (for example `zero-agent.ts`, `gateway-link.ts`, `zero-runtime.ts` debug instrumentation and `app/.zero-debug.log`).

So from a hygiene standpoint, the main issue to watch is **temporary console instrumentation in production/bridge code**, which the log says was already cleaned up in at least one pass.

### 2.3 Secrets / credential-shape handling
This is the most important hygiene topic in the whole tree, because the product is credential-adjacent:
- The dev logs and the files I read repeatedly emphasize **write-only key submission**, **store ref identity**, **no secret in DOM/local state after submit**, **env-only `ZERO_GATEWAY_KEY` for the backend runtime**, and **sanitize/redact in probe/report output**.
- There are explicit fixtures/test strings shaped like secrets in test code (`secret-token-xyz-123`, `legacy-inline-secret-value`, `sk-ant-lpc-...` fixtures), but those are test fixtures and are asserted absent from outputs/container text in the corresponding tests.

The hygiene posture here is **intentionally strict**, not relaxed. The real risk area is therefore not “random hardcoded secret” but **any future path that accidentally keeps a credential in DOM, local state, logs, or report JSON**. The `rig.mjs` write-screen and the provider-manager secret-ref guards are the exact places to review if that ever happens.

### 2.4 Duplicate code / faltu / dead blocks
I did **not** do a full token-similarity clone hunt across every large file, so I am not handing you a definitive duplicate-function list. What I can say from the files + logs:
- The logs mention at least one **small board/typo duplication that was introduced and removed** during UI work, with net effect being only the intended two blocks.
- The logs also mention **stale comment/cleanup-wording sweeps**, which implies at least some old explanatory text existed and was later trimmed.
- From a code-shape standpoint, the most likely “faltu-like” material is **long explanation comments in spike/test/preflight tooling**, not necessarily dead runtime code.

If you want a strict duplicate/comment cleanup report, the next step is a dedicated similarity + dead-comment pass, not a broader guess.

---

## 3. Naming / structure / “kaun si cheez confusing hai”

- The heaviest code mass sits in three places: `app/zero-control-ui/`, `backend/plugin/provider-manager/index.mjs`, and `computer/spike/k7-run.mjs`.
- Naming in the repo is mostly consistent with the product model (`zero`, `researcher`, `operator`, `provider-manager`, `computer`, `rig`, `k7`, `preflight`, `bootstrap`). No obvious file-name collision pattern jumped out in the files I read.
- What is more “confusing by volume” than by naming is file/area size: one enormous provider-manager implementation file and one enormous spike harness make future diff-reads harder, even when the logic is correct. That is a maintainability issue, not a logic bug.

---

## 4. Broken / pending / owner-gated items from the board (as I read them)

These are pulled from `TASK_BOARD.md` + `AGENT_CHAT.txt` as **project state items**, not as newly found code errors:

### 4.1 Live product gap: chat sender disabled in `/chat/zero`
- Recorded state: composer showed “No models available”, send stayed disabled, no prompt/provider call was made.
- That is a **live prerequisite/availability issue**, not claimed as a definite source defect here.
- Board + logs treat it as something to resolve before live E2E, with no self-acceptance.

### 4.2 Live model-route drift and a Control UI config write
- Recorded state: Lead/Researcher model route drifted via Control UI (now nemotron in the recorded timeline), writes came from a then-served pre-PM-01 build, and a later Control UI write removed `agents.defaults.utilityModel`.
- Both are flagged as needing an **owner decision**.

### 4.3 Provider-manager live activation/verification still pending in places
- Several PM items are marked **READY FOR REVIEW**, not self-accepted, with remaining gates like:
  - senior recheck of generic ID/collision and shared-host SecretRef safety,
  - owner decision on the live shared-host store entry `ZERO_PROVIDER_ZERO_GW_API_KEY`,
  - Gateway refresh to load the current provider-manager handler,
  - owner-authorized live CRUD/activation or Discover window.
- Gateway activation of `.set`/`.delete` is repeatedly noted as **not live-verified**.

### 4.4 Backend acceptance items needing the isolated desktop
- A6/A7 and trusted-policy firing are noted as needing the isolated desktop; computer-aware acceptance is not fully closed from a live-proof standpoint.

### 4.5 Computer work still gated on the designated Zero Windows environment
- CU-01 is partial (owner-authorized normal-profile Notepad observe/type/save/read-back passed), but the OpenClaw CUA/k7 harness path and takeover/global-stop/live-view were **not** demonstrated in that run.
- CU-02 is green offline and has live hold/refusal/idempotence evidence, but **actual desktop behavior** still needs the isolated Zero Windows target.

### 4.6 Gemini attribution note (coordination hygiene, not a runtime bug)
- `START_TASKS.txt` and the board note that Gemini is only an internal software-developer role and must not appear in product-facing UI/source comments/runtime/config/model route/skill display/docs presented to a user.
- `DEVELOPER_OPENCODE.md` asks OpenCode to remove the existing Gemini attribution from `app/zero-control-ui/browser.js`.

---

## 5. Strongest concrete hygiene observations (inspection-only)

1. **One very large provider-manager source file** (`backend/plugin/provider-manager/index.mjs`) is the best candidate for a focused duplicate-comment / long-function / leftover-debug sweep.
2. **One very large spike harness** (`computer/spike/k7-run.mjs`) is the best candidate for readability cleanup and any future dead-path removal.
3. **The secret/PII write-screen in `computer/spike/rig.mjs`** is the most security-sensitive hygiene spot in the tree; if anything ever leaks a credential shape, it should be reviewed there first.
4. **Temporary console instrumentation in runtime/bridge code** has already been cleaned up in at least one pass, but that is exactly the class of thing that can reappear during debugging, so it should stay on the post-change checklist.
5. **Legacy React/CopilotKit/Vite path was removed** from the product tree (per UI-02 / INT-00 state), leaving `app/src/bridge/` as a non-running library only. That is a good hygiene outcome, but the bridge files still deserve a one-time “is any of this actually dead now?” check if you want a fully clean tree.

---

## 6. If you want more precise findings than this

If you want a harder technical audit rather than this inspection pass, ask for one of these specifically:

- a file/line comment sweep for every `// ...` / block comment that looks like leftover debug/deprecated/experimental text in `app/` + `backend/` + `computer/`,
- a similarity scan for duplicated function bodies across the large files,
- a “find any console.log still in production/bridge code” sweep,
- a “find any place that could accidentally keep a credential in DOM/local state/logs” focused review,
- a lit review of the exact security boundary wording already in `reports/backend/security-boundary.md` and `reports/backend/control-ui-backend-contract.md`.

---

## 7. Bottom line

From this read-only pass:
- I did **not** find a loud, obvious, brand-new “this line is definitely wrong” defect across the main source files I inspected.
- I **did** find that the project’s biggest review risk is concentrated in a few large files and in the credential-handling/console-instrumentation/inspection-output paths, and that several live/gating items are still open on the board.
- I am handing you **a report, not changes**, as you asked.

If you want, I can now produce a tighter file/line item list for one of the concrete sweeps above, still without editing anything.

---

## 8. Cleanup applied (2026-10-25)

This was a narrow, evidence-based pass after the inspection-only audit above. No broad cleanup is claimed.

### 8.1 Stale source marker removed

`backend/plugin/index.js` no longer carries the historical line
`// REVIEW-02 reconciliation (Qoder, 2026-10-23 04:51):` or its C1–C7 changelog block. The active
contract explanation (trusted-policy declaration, fail-closed evaluation, closed `action` enum,
`operator.write` scope) remains in the source. The audit trail remains in:

- `backend/plugin/README.md` §“REVIEW-02 findings and how each was resolved”;
- `backend/plugin/selftest.mjs` header and C1–C7 assertions;
- `backend/scripts/preflight.mjs` `plugin.trustedPolicyContract`;
- `reports/backend/build-readiness.md` §“REVIEW-02 reconciliation”.

The malformed header `Contract evidence (pin …)://` was corrected to a normal comment line.

### 8.2 Targeted dead-code result

Method: 67 owned `.js/.mjs/.ts/.tsx` files under `app/`, `backend/`, and `computer/` were scanned for
relative imports, export-name references, test imports, and built-bundle markers. No file was removed
from size, age, style, or a heuristic alone.

Removed (proven unreachable in code):

- `app/zero-control-ui/src/shared/memory.js` — zero code/test/bundle references. One historical
  acceptance note in `reports/gemini/team-acceptance-matrix.md` (M-05) still names `memoryFileHits`;
  it describes the removed Team page and is retained as history, not a runtime reference.
- `app/zero-control-ui/src/shared/skills.js` — zero code/test/bundle references.

`app/zero-control-ui/README.md` module inventory was updated accordingly.

Candidates intentionally retained:

- `app/src/bridge/*` — retained/tested library per D-015; bridge suite 3/3.
- `app/src/shared/zero-types.ts` — imported by `app/src/bridge/gateway-link.ts` (the scan's `.js`→`.ts`
  resolution initially missed it).
- `app/zero-control-ui/src/state/roster.js`, `src/gateway/client.js`, `src/computer/presentation.js` —
  test-imported seams documented in the UI README; not proven obsolete.
- `backend/plugin/provider-manager/integration.mjs` — loopback integration test entry.
- `computer/tools/audit-release-action-filter.mjs` — documented operational audit tool.
- `app/zero-control-ui/build.mjs` — build entrypoint.

No other confirmed dead-code block or duplicate implementation was found.

### 8.3 Checks

- `node --check backend/plugin/index.js` → clean.
- `node backend/plugin/selftest.mjs` → **111 passed, 0 failed**.
- `node backend/scripts/preflight.mjs` (read-only live config) → **29 pass, 1 warn, 2 fail**. The failures
  are pre-existing live-config checks (`config.singleModel`: 2 model rows; `config.modelRefs`: legacy
  `zero-gw/...` refs) and were **not** changed by this cleanup.
- UI suite → **51/51**; sync tests → **5/5**; bridge → **3/3**.
- Rebuild → generation `bc41578f…` unchanged (removed modules were not bundled).
- Source grep for the REVIEW-02 marker → none; documentation references retained.

No upstream/, legal notice, host contract, live config, provider, credential, session, Gateway state, or
desktop state was changed.

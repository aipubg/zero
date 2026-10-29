---

## 18. PM-01 Offline Audit Pass — Final Build, Manifest Verification, and Gateway-Method Activation Handoff

### 18.1 Scope of this pass
This pass completed the offline source audit, focused suites, final rebuild, and release-path analysis for the Provider Manager UX/reliability work, and updated the handoff documents. It did **not** restart or reload the Gateway, mutate live config or secrets, read or print credential values, remove or re-scope the orphan store entry, or call/retry NVIDIA Discover.

### 18.2 Current plugin manifests and build/package paths
- **Control UI contribution (browser + server-side runtime):**
  - Package: `app/zero-control-ui/package.json` — `"openclaw.extensions": ["./index.js"]`, `"controlUi": "./browser.js"`, `"build": { "bundledDist": true, "openclawVersion": "2026.10.6" }`.
  - Server-side Gateway extension entry: `app/zero-control-ui/index.js` — `definePluginEntry({ id: "zero-control-ui", register(api) { return { state: registerZeroUiRuntime(api) }; } })`.
  - Runtime methods declared in `app/zero-control-ui/runtime-core.mjs`: `zero.ui.providerNames.list`, `zero.ui.providerNames.set`, `zero.ui.providerNames.delete`, `zero.ui.providerCredentialRef`.
  - UI build entry: `app/zero-control-ui/browser.js`; build script `app/zero-control-ui/build.mjs` produces `dist/control-ui/<generation>/index.js` + `index.css` and writes both `app/zero-control-ui/openclaw.plugin.json` and `app/zero-control-ui/dist/openclaw.plugin.json`.
- **Server-side provider manager (the methods this UI consumes):**
  - Package: `backend/plugin/provider-manager/package.json` — `"main": "index.mjs"`, `"openclaw.extensions": ["./index.mjs"]`.
  - Manifest: `backend/plugin/provider-manager/openclaw.plugin.json` — `id: "zero-provider-manager"`, `activation.onStartup: true`, config schema `defaultTimeoutMs`/`maxModels`.
  - Gateway methods owned by this plugin: `zero.providers.discover`, `zero.providers.test`, `zero.providers.capabilities`.

### 18.3 Current build output and manifest/asset verification
The workspace tree currently carries the same generation in both the root plugin manifest and the generated dist manifest:
- `app/zero-control-ui/openclaw.plugin.json` `controlUi.entry` =
  `dist/control-ui/45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba/index.js`
- `app/zero-control-ui/dist/openclaw.plugin.json` `controlUi.entry` = the same path
- On-disk bundle directory exists at
  `app/zero-control-ui/dist/control-ui/45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba/`
  with both `index.js` and `index.css`.

`app/zero-control-ui/build.mjs` rebuilds from `browser.js`, writes an immutable generation dir, and rewrites both manifests with the new `controlUi` block. `app/zero-control-ui/test/verify-served.mjs` asserts the generated manifest matches the on-disk generation and that the manifest points at existing files.

Offline syntax checks in this pass:
- `node --check backend/plugin/provider-manager/index.mjs` — clean
- `node --check app/zero-control-ui/runtime-core.mjs` — clean
- `node --check app/zero-control-ui/index.js` — clean
- `node --check app/zero-control-ui/build.mjs` — clean
- `node --check app/zero-control-ui/test/verify-served.mjs` — clean

### 18.4 Focused offline suites (this pass)
- Provider-manager acceptance: `node --test backend/plugin/provider-manager/pm02.test.mjs` — pm02 **15/15**.
- Control UI mount suite (includes the runtime-method backend test at the end of `test/mount.test.mjs`): `node --test app/zero-control-ui/test/mount.test.mjs` — **29/29 pass** from the final sources.
- Manifest/asset consistency probe: `node app/zero-control-ui/test/verify-served.mjs` — exited 0 and confirmed that the generated manifest points at existing immutable assets from the same dist tree.

This pass did **not** re-publish through `plugins.controlUi.reload`. If the approved UI-only publication path is chosen, the supported command is `node app/zero-control-ui/build.mjs` followed by `node app/zero-control-ui/test/verify-served.mjs` from the same dist tree, and the live reload step is a separate owner-gated action.

### 18.4.1 Stale dist manifest/build-output issue — corrected
The verifier `app/zero-control-ui/test/verify-served.mjs` had been edited so it started reading the generated manifest from `app/zero-control-ui/dist/openclaw.plugin.json` via a `..` resolution when run from inside `app/zero-control-ui/test/`. For this workspace that resolution landed on `app/zero-control-ui/test/dist/openclaw.plugin.json`, so the probe was comparing the wrong manifest. That is the stale dist/manifest issue found in this pass.

Correction applied: `verify-served.mjs` now computes a workspace-root-relative `root`, resolves the generated manifest as `join(root, "dist", "openclaw.plugin.json")`, resolves the dist index as `join(root, "dist", "control-ui")`, and keeps every release-gate assertion against the on-disk `dist/control-ui/<generation>` tree. Old `dist/control-ui/` generations were not touched or deleted. The correction is only in the verifier manifest resolution; the generated manifests themselves were not hand-edited.

### 18.5 Repaired test file encoding check
The focused runtime-method test at the end of `app/zero-control-ui/test/mount.test.mjs` was inspected for mojibake and replacement characters. The test source contains no replacement characters and no UTF-8 break sequences; provider-id, display-name, and credential-reference literals are plain ASCII, including the `"raw-legacy-inline-value"` name used only as an identity-absence assertion. The test file is clean for the purposes of this pass.

### 18.6 Gateway-method registration status and remaining activation gate
As of this pass, the Gateway method registration status is **read-only and not live-verified**:

- The installed host manifest on disk is `backend/plugin/openclaw.plugin.json`, and its `id` is
  `"zero-policy"`. The provider-manager package does **not** contribute its own hosted manifest in this
  workspace; its manifest lives at `backend/plugin/provider-manager/openclaw.plugin.json`.
- `backend/plugin/provider-manager/openclaw.plugin.json` declares `activation.onStartup: true` and
  `version: "0.1.0"`.
- Activation therefore depends on the host having an explicit plugin entry
  (`plugins.entries.zero-provider-manager.enabled: true`) **and** the manifest
  `activation.onStartup: true`, exactly as recorded in
  `reports/backend/provider-manager-contract.md` §4.6 and the TASK_BOARD/PM-00 evidence.
- The new UI runtime methods this pass documents
  (`zero.ui.providerNames.list/set/delete`, `zero.ui.providerCredentialRef`) are declared in
  `app/zero-control-ui/runtime-core.mjs` and registered through `registerZeroUiRuntime(api)` in
  `app/zero-control-ui/index.js`. They are **not** the provider-manager methods, and they are **not**
  verified live in this pass.
- `plugins.controlUi.reload` publishes UI assets only. It is **not** treated as proof that either the
  provider-manager methods or the new `zero.ui.providerNames.*` / `zero.ui.providerCredentialRef`
  methods are registered.

So: the Control UI contribution's `index.js` is built and the runtime-core methods are declared, but
whether the installed Gateway currently has those methods active is a runtime-activation question, not a
build question.

### 18.6.1 Local build verification vs live Gateway publication vs server-side Gateway-method registration
This pass explicitly separates the three concerns:

1. **Local build verification.** `node app/zero-control-ui/build.mjs` and `node app/zero-control-ui/test/verify-served.mjs` on the `dist/` tree, plus the focused suites (`node --test app/zero-control-ui/test/mount.test.mjs` and `node --test backend/plugin/provider-manager/pm02.test.mjs`). This pass completed that offline verification.
2. **Live Gateway publication (UI-only).** `plugins.controlUi.reload` publishes UI assets. This pass did **not** do it and did **not** treat the local build as proof of publication.
3. **Server-side Gateway-method registration.** The new `zero.ui.providerNames.list/set/delete` and `zero.ui.providerCredentialRef` methods are declared in source (`app/zero-control-ui/runtime-core.mjs` + `app/zero-control-ui/index.js`). Whether the running Gateway currently has them registered is a runtime-activation question, not a build question, and was not live-verified in this pass. The provider-manager methods are `zero.providers.discover`, `zero.providers.test`, `zero.providers.capabilities`.

### 18.7 Same-host SecretRef guard
The same-host SecretRef guard implemented in the Control UI remains intact in this pass:
- `app/zero-control-ui/browser.js` keeps the fail-closed reconstruction in
  `canonicalStoreRef` and `hasOtherStoreEntryForHost`, and it keeps the
  `resolveExactCredentialRefs` path that asks `zero.ui.providerCredentialRef` for the host-authoritative
  identity when available.
- `app/zero-control-ui/runtime-core.mjs` keeps `classifyProviderCredential` returning identity only,
  never a secret value, and never an inline key.
No change was made to that guard in this pass, and no credential value was read or printed.

### 18.8 Release path decision
This pass does **not** auto-publish. The verified artifact exists locally and the manifest/asset
consistency probe is the right release gate; publication through `plugins.controlUi.reload` is a separate
owner-gated action if/when the UI-only path is approved.

### 18.9 Remaining owner-gated step
The exact remaining gate for Gateway-method coverage is activation/refresh, not another UI build:
1. Owner decision on the live shared-host store entry (`ZERO_PROVIDER_ZERO_GW_API_KEY`) — remove/re-scope
   it or accept that `nvidia` stays fail-closed.
2. Owner-authorized Gateway refresh/restart to load the current provider-manager handler and any
   currently-unloaded runtime methods.
3. Only after that, at most one owner-authorized Discover/test retry for the affected provider, with
   sanitized output/latency only.

### 18.10 Handoff status
- PM-01 remains **READY FOR REVIEW** in this pass. It is **not** self-accepted.
- UI-only publication evidence and Gateway-method registration evidence are now documented separately
  above and in the updated TASK_BOARD.md / AGENT_CHAT.txt entries written by this pass.

## 19. PM-01 Credential-Reference Identity Persistence — Implementation and Offline Verification

Date: 2026-10-25 (IST). Owner lane: OpenCode (`app/`). Backend contract: `reports/backend/control-ui-backend-contract.md`, "Credential-reference identity persistence contract", including Qoder's failed-patch/no-auto-delete update. This pass made no live config or secret writes, no provider calls, and did not migrate `zero-gw` or touch `ZERO_PROVIDER_ZERO_GW_API_KEY`.

### 19.1 Why the UI must persist identity itself

Qoder's live evidence showed `zero.ui.providerCredentialRef` returning `{ ok:false, reason:"inline" }` for `zero-gw`: the plugin runtime config snapshot exposes a resolved/opaque value, `config.get` is redacted, and the supported plugin API has no accessor for the source SecretRef. `secrets.store.set` is an upsert and echoes neither create-vs-replace nor the reference identity. Therefore the only trustworthy identity is the exact non-secret object this UI itself placed in its own `secrets.store.set` request, and it may be recorded only after `config.patch` confirms the provider path changed.

### 19.2 Runtime methods (source-wired; Gateway activation pending)

`app/zero-control-ui/runtime-core.mjs` now owns two retained plugin-scoped namespaces:

- `provider-display-names` — unchanged display-name metadata.
- `provider-credential-refs` — `{ source, provider, id, updatedAt }` only.

Registered methods (six total when `api.registerGatewayMethod` exists):

| Method | Behavior |
|---|---|
| `zero.ui.providerNames.list/set/delete` | Existing display-name metadata; unchanged. |
| `zero.ui.providerCredentialRef { providerId }` | Reads only the persisted row. Returns `{ ok:true, providerId, ref:{source,provider,id} }` or `{ ok:false, providerId, reason:"not-recorded" }`. It does **not** inspect runtime config, host naming conventions, `secrets.store.list`, or credential values. |
| `zero.ui.providerCredentialRef.set { providerId, ref }` | Closed validation: exactly `{source,provider,id}`; `source` is `env` or `store`; `provider` matches the alias grammar; `id` matches the uppercase env/store grammar and is not the redaction marker. Persists identity plus `updatedAt`; returns the identity, never a value. |
| `zero.ui.providerCredentialRef.delete { providerId }` | Removes only the metadata row; best-effort cleanup on provider delete. |

Invalid or absent rows stay fail-closed as `not-recorded`. Legacy providers (including `zero-gw`) are never inferred or migrated.

### 19.3 Save-flow ordering and partial states

`app/zero-control-ui/browser.js` `saveProvider` performs:

1. **Secret write only when a new/replacement key is supplied.** The exact store identity is `{source:"store", provider:"default", id:<uppercase canonical name>}`; a staged discovery preview reuses the name it staged. No identity is derived from any response.
2. **`config.patch`** with the provider object. The response must include an array `changedPaths` containing the exact `models.providers.<id>` path. A missing, malformed, or unrelated list is treated as unconfirmed (see §20.2), so identity and success messaging are withheld.
3. **Only after config commits**, persist display-name metadata (best effort) and then the credential identity. Identity is written only when this operation produced it: a newly typed key, a staged key, or a new non-edit provider reference. A key-omitted edit omits `apiKey` and does **not** rewrite identity.

Partial-state behavior:

- **Failed `config.patch` (or unconfirmed changed path):** the secret is never deleted. The UI reports `secret-written, config-not-committed: <SECRET_NAME>. The credential was left untouched; retry the provider save.` — name only, never the value. `Retry provider save` re-loads config, re-patches the same `patchObj` with the current base hash, then persists the same exact identity. This is idempotent and never re-sends the key.
- **Config committed, identity metadata write failed:** the UI reports `identity record is pending` and offers `Retry identity record`, which writes only the metadata row.
- **Key-omitted edit:** the recorded identity is preserved; no secret write, no metadata rewrite.
- **Delete provider:** after the config delete succeeds, the identity row is removed best-effort; a failed cleanup is harmless because the getter stays fail-closed.

No credential value enters `pendingRecovery`, the metadata store, a notification, or rendered output. The in-memory key is wiped immediately after the secret write, as before.

### 19.4 Focused offline test evidence

`node --test app/zero-control-ui/test/mount.test.mjs` → **31/31 pass, 0 fail**. Relevant tests:

- `PM-01 credential identity store: metadata-only refs, strict validation, and not-recorded legacy` — closed-key validation, env/store grammar, redaction-marker rejection, invalid rows → `not-recorded`, metadata rows contain no value.
- `PM-01 runtime registration wires six metadata methods and two retained namespaces` — all six methods and both `retention:"retained"` namespaces.
- `PM-01 credential identity persistence flow: create, key-omitted edit, replacement, partial retries` — phases A–F:
  - A. create: exact identity from the request, events ordered `secret → patch → ref`;
  - B. key-omitted edit: no secret write, no ref rewrite, `apiKey` omitted from the patch;
  - C. replacement: same exact identity persisted again after config success;
  - D. failed patch: zero secret deletes, zero identity writes, partial message with the name only, retry persists identity;
  - E. metadata failure: `identity record is pending`, retry writes the row;
  - F. no credential value in rendered text, captured metadata, patches, or identity rows.

Two test-only corrections were required and do not change product behavior: the earlier Save Defaults stale-hash test again asserts `baseHash is stale` (it is the defaults path, not a provider save), and the new flow's mock records only `{ name }` for `secrets.store.set` so its own capture cannot retain the test value.

### 19.5 Build and local artifact verification

- `node app/zero-control-ui/build.mjs` → generation `3cb11750d6d5e585c0c24a886ab729fb9240421cbd59b9069ddca03cf9c334c2`, JS 105,196 B, CSS 27,639 B.
- Rebuilding reproduces the same generation; recomputing the SHA-256 over JS + NUL + CSS matches the directory name.
- Both `app/zero-control-ui/openclaw.plugin.json` and `app/zero-control-ui/dist/openclaw.plugin.json` point at that generation and its single stylesheet.
- `node app/zero-control-ui/test/verify-served.mjs` → exit 0 (manifest entry/styles exist and match the on-disk generation).
- `node --check` passes for `runtime-core.mjs` and `browser.js`.
- The bundle contains the new host method names and the partial-state copy; it contains none of the test credential literals.

### 19.6 Evidence boundaries

- This section proves the **local build, manifest, assets, and offline behavior only**. Nothing was published through `plugins.controlUi.reload`.
- The new `.set` / `.delete` methods are **source-wired but not live-registered**. The running Gateway (PID 19764) still predates them; its `zero.ui.providerCredentialRef` for `zero-gw` remains `{ok:false, reason:"inline"}` until an owner-authorized restart. The browser keeps the same-host fail-closed fallback for that case.
- No live config/secret/provider call, no Gateway reload/restart, and no change to `zero-gw` (config sha `ad1536d86a9ef1de`) in this pass.
- Offline pass is not live verification; live CRUD/activation remains owner-gated.

### 19.7 Status and review checklist

PM-01 remains **READY FOR REVIEW**; this pass does not self-accept. Reviewer checks:

1. Identity is persisted from the request only, after config commit; `changedPaths` absence is tolerated, mismatch is rejected.
2. Failed patch never deletes the secret and reports the name only; both retries are idempotent.
3. Key-omitted edits and legacy providers preserve/fail closed; no inference from runtime values, host scope, or `secrets.store.list`.
4. `zero-gw`, `ZERO_PROVIDER_ZERO_GW_API_KEY`, and live bindings are untouched.
5. Local generation `3cb11750…` is reproducible and manifest-consistent; live method activation is a separate owner-gated step.

## 20. PM-01 Senior-Review Corrections — Staged Credential Retention and Strict changedPaths Gate

Date: 2026-10-25 (IST). Owner lane: OpenCode (`app/`). This section records the two blocking corrections from senior review and supersedes §19.3's tolerant `changedPaths` wording (already corrected above) and §19.5's artifact generation.

### 20.1 Cancel never deletes a staged credential

The add-provider preview no longer deletes a staged Secret Store entry on cancel. `secrets.store.set` is an upsert, so the previous read-only `secrets.store.list` check could not prove that this form session originated the entry or that it had not been replaced concurrently. Both the deletion helper and the pre-write existence probe were removed from the staging path.

When the add modal is closed with a staged credential still present (for example, Cancel after preview), the entry is left untouched and the page shows a non-secret notice by name:

`Provider not saved. Staged credential <SECRET_NAME> remains in the Gateway secret store and is not bound to any provider. It was left untouched.`

No value is read, stored, or displayed. A normally saved or confirmed-retried provider clears the staged marker before closing, so that path does not show the notice. Provider deletion remains unchanged: its sharing-guarded store cleanup applies only to the provider's own bound reference.

### 20.2 Strict changedPaths gate on save and retry

A shared `assertProviderPathChanged` gate is now used by both the initial `saveProvider` path and `Retry provider save`. It requires `patchRes.changedPaths` to be an array containing the exact `models.providers.<providerId>` path; a missing array, a non-array value, or an array without that path throws a `provider-path-unconfirmed` error.

On initial save, an unconfirmed response keeps `configCommitted` false, so display-name and credential-identity metadata are not written and no success message is shown. A config retry state is preserved with the same `patchObj`, note, and exact ref:

- With a secret: `secret-written, config-unconfirmed: <NAME>. Gateway changedPaths did not confirm models.providers.<id>. The credential was left untouched; retry the provider save.`
- Without a secret: `config-unconfirmed: Gateway changedPaths did not confirm models.providers.<id>. Retry the provider save.`
- A thrown `config.patch` keeps the prior `secret-written, config-not-committed: <NAME>` state.

The retry path applies the identical gate. An unconfirmed retry keeps the recovery state, reports `Retry failed: ...`, and does not persist identity, show success, or delete the credential. A confirmed retry persists the exact identity and reports success. No path in this flow deletes a credential automatically.

### 20.3 Focused regression tests

`node --test app/zero-control-ui/test/mount.test.mjs` → **32/32 pass, 0 fail**.

- Updated `PM-01 draft discovery preview...`: Cancel after staging produces zero `secrets.store.delete` calls, the notice names `ZERO_PROVIDER_PREVIEW_NIM_API_KEY`, says the entry is unbound and untouched, and the DOM contains no key value. A second session with a pre-existing name also performs zero deletes.
- New `PM-01 changedPaths gate...`: for each of `missing`, `malformed` (string instead of array), and `mismatch` (unrelated path), both the initial save and a retry persist no identity, show no success, delete nothing, and keep the pending state. A following confirmed retry persists the exact identity and succeeds; a separate confirmed initial save also persists immediately.
- Provider-save mocks now return `changedPaths` derived from the patched provider object; the stricter product gate rejects the previous bare `{ok:true}` responses.

### 20.4 Rebuilt artifact and verifier correction

- Generation `ff67c8460d64771d1739fda6b074ea073ec1a8f34a447feced297585a77ede2e`, JS 105,383 B, CSS 27,639 B. Rebuilding reproduces the generation and a recomputed SHA-256 over JS + NUL + CSS matches the directory name.
- Source and dist manifests both point at this generation; `node app/zero-control-ui/test/verify-served.mjs` → exit 0.
- The verifier now validates the generation declared by `dist/openclaw.plugin.json` instead of the first 64-hex directory returned by `readdir`. With the retained `3cb11750…` generation present, the old first-directory comparison falsely reported a mismatch.
- `node --check` passes for `browser.js` and `runtime-core.mjs`; the bundle contains the new gate/notice strings and none of the test credential literals.

### 20.5 Boundaries and status

No live config or secret write, no provider call, no Gateway reload/restart, and no change to `zero-gw` or `ZERO_PROVIDER_ZERO_GW_API_KEY` (config mtime still `2026-10-24 10:39:32`). The running Gateway still predates the `.set`/`.delete` methods, so its getter for `zero-gw` remains `{ok:false, reason:"inline"}` with the same-host fail-closed fallback.

PM-01 remains **READY FOR REVIEW**; this pass does not self-accept. Live method activation remains a separate owner-gated step.

## 21. Final Wording Sweep — Staged-Credential Cancellation Comments

Date: 2026-10-25 (IST). Comment-only correction; no runtime behavior changed.

### 21.1 What was stale

The add-flow model-selection comment in `app/zero-control-ui/browser.js` still said "Cancel cleans up a freshly staged credential", contradicting §20.1. It now states that Cancel leaves the staged credential untouched and shows a name-only unbound notice. The adjacent preview-staging comment was reworded to avoid an isolated "deletes the staged entry" phrase, and the save-consumption note now reads "consumed by this save; cancel never deletes it".

### 21.2 Sweep result

Searched `browser.js`, `runtime-core.mjs`, `test/mount.test.mjs`, and this report for cancellation-plus-delete/cleanup/orphan wording. No remaining statement claims that cancellation deletes or cleans up a staged credential. The only remaining delete-related wording describes provider deletion's sharing-guarded cleanup of a bound reference, the metadata-only identity cleanup, and the tests asserting zero staged deletes.

### 21.3 Verification

- `node --test app/zero-control-ui/test/mount.test.mjs` → **32/32 pass, 0 fail**.
- `node app/zero-control-ui/build.mjs` → generation unchanged at `ff67c8460d64771d1739fda6b074ea073ec1a8f34a447feced297585a77ede2e` (JS 105,383 B, CSS 27,639 B), as expected for comment-only edits that the minifier strips.
- `node app/zero-control-ui/test/verify-served.mjs` → exit 0; source/dist manifests still name that generation and both assets exist.
- No live config/secret/provider call, Gateway reload/restart, or binding change; `backend/config/openclaw.json` mtime remains `2026-10-24 10:39:32`.

PM-01 remains **READY FOR REVIEW**; not self-accepted.

## 22. Native-Only UI Maintainability Pass — Legacy CopilotKit/Vite Path Removed

Date: 2026-10-25 (IST). This pass changed UI source, tests, and documentation only. It did not mutate the fresh profile's providers, secrets, model routes, or session history, and it did not restart or reload the Gateway.

### 22.1 Product-path correction

The screenshot's CopilotKit panel and `Failed to fetch threads: 403` came from the retired React prototype, not from the native Control UI:

- `app/src/client/App.tsx` mounted `CopilotKitProvider`; `Chat.tsx` used `useCopilotKit`/`useAgent`; `use-zero-threads.ts` fetched the runtime thread list.
- `app/src/server/runtime-scope.ts` intentionally rejected `/api/copilotkit/threads` because the Intelligence thread store was disabled. That `403` was correct scope enforcement.

The correction removes the second product path instead of weakening Gateway authorization:

- deleted `app/src/client/` and the Hono/CopilotKit runtime, route guard, thread registry, activity feed, and unverified desktop relay;
- removed `@copilotkit/*`, `@ag-ui/*`, React, Vite, Hono, noVNC, and their dev dependencies from `app/package.json`;
- moved the useful Gateway client/pairing/configuration code to `app/src/bridge/` with a validated, bridge-only `loadConfig()`;
- rewrote `.zero-data/fresh-workspace/start-all.ps1` to start and verify only the Gateway; `start-runtime.ps1` and `start-vite.ps1` were deleted;
- `http://127.0.0.1:18789/` is the only product shell; `4317`/`5173` are no longer used.

The fresh profile's existing sessions were left untouched.

### 22.2 Native UI module split

`app/zero-control-ui/browser.js` is now a 1,652-byte registration entry. Page/state/rendering logic moved into:

- `src/pages/team.js` — native Zero Team page, canonical session/agent projections, memory/workspace/skills/computer panels;
- `src/pages/models.js` — provider manager state, RPC orchestration, validation, and rendering;
- `src/shared/{providers,sessions,skills,memory,format,errors,dom}.js` — pure projections, safe error helpers, and DOM helpers;
- `src/constants.js` and `src/legacy-routes.js` — shared constants and the one legacy-route interceptor.

No framework was added. The Gateway RPC surface, session semantics, and state ownership are unchanged. The Models error state now includes a bounded **Retry** action, matching the Team session-catalog error state; no credential or raw response body is rendered.

### 22.3 Focused tests

- New `app/zero-control-ui/test/fake-dom.mjs` extracts the shared fake DOM; `mount.test.mjs` imports it instead of duplicating it.
- New `app/zero-control-ui/test/product-path.test.mjs` (5 tests) covers:
  1. zero-session empty state (`No conversation yet. Start the first one.`, `No sessions are visible to this connection yet.`, `Zero has no conversation yet.`) with no implicit session create/open and no legacy thread call;
  2. safe session-catalog error rendering, no stack traces/credential shapes, and recovery through **Retry**;
  3. bounded provider-config error plus **Retry** recovery to `Configured Providers (0)`;
  4. pure `providers.js`/`sessions.js`/`errors.js` contracts (ID grammar, slug/collision, loopback/private-network guards, SecretRef projection, role/session projections);
  5. the built bundle contains no `copilotkit`/AG-UI/`Failed to fetch threads` string.
- `app/test/bridge.test.mjs` (3 tests) verifies validated bridge configuration, absence of the legacy CopilotKit/403 product path and dependencies, and the native plugin as the single UI surface.
- `app/zero-control-ui/package.json` test script now runs both UI suites.

### 22.4 Verification evidence

| Check | Result |
|---|---|
| `node --test app/zero-control-ui/test/*.test.mjs` | **37/37 pass, 0 fail** |
| `node --test app/test/bridge.test.mjs` | **3/3 pass, 0 fail** |
| `tsc --noEmit` in `app/` | exit 0 |
| `node app/zero-control-ui/build.mjs` | generation `211e64c99fe5b81ddb3d74828135c59755d6cefe9d626ceeffe2cb4241d87ca1`; JS `105,523 B`; CSS `27,639 B` |
| `node app/zero-control-ui/test/verify-served.mjs` | exit 0; manifest entry/styles exist and match the declared generation |
| Browser smoke, native Team page | rendered; no CopilotKit panel; **0** `copilotkit` requests and **0** `threads` requests; only unrelated host avatar `404` in console |
| Browser smoke, native Models page | rendered with `Configured Providers (0)`; no credential/error leak |

**Pre-restart state (historical for this subsection).** At the time of the original §22 pass the running Gateway (PID 17516) still served the generation it had cached at startup (`ac56ae2d…`), not `211e64c9…`; the new generation was verified by the build, tests, and `verify-served.mjs`. That gap is closed by §22.6 below. The profile had two visible sessions at that moment, so the zero-session state is proven by the mocked UI test rather than by deleting history.

### 22.5 Boundaries and status

- No provider/model call, credential read/write, live config mutation, Gateway restart/reload, or desktop-control claim.
- `zero-gw`/`ZERO_PROVIDER_ZERO_GW_API_KEY` and the fresh profile's session history are untouched.
- PM-01 and the native-UI architecture pass remain **READY FOR REVIEW**; no self-acceptance.

### 22.6 Post-restart live verification (2026-10-25)

One controlled start of the fresh-workspace Gateway (`.zero-data/fresh-workspace/start-all.ps1`) brought up PID **4316** on loopback `127.0.0.1:18789` with `auth.mode:"none"`, config `E:\zero\.zero-data\fresh-workspace\openclaw.json` (5,718 B, mtime 09:18:34, unchanged) and state dir `gateway-state`. The retired `backend\.openclaw` / `backend\config\openclaw.json` profile was not used.

| Check | Live result |
|---|---|
| `plugins.controlUi.list` | catalog `0b123140bbd2c63f6c7457fbdefde3916a2e8f04bff040ff58654d83132b7e16`; plugin `zero-control-ui` revision `75d0b71fab38326aacf92df062d6965a5bb7ad163d0b974477ece05e2db97183`; diagnostics `[]` |
| `control-ui-digest.mjs --expect 75d0b71f…` | **match**, exit 0 (was MISMATCH against the `ac56ae2d…` cache) |
| `/api/copilotkit/threads` | **404** |
| Plugin `index.js` / `index.css` | 200 / 105,523 B and 200 / 27,639 B |
| Headless-Chrome smoke, Team + Models | native pages rendered from `75d0b71f…`; **0** copilotkit requests; **0** `/threads` requests; only unrelated avatar `404` |
| Provider / agents / config | `nvidia` (`openai-completions`, `https://integrate.api.nvidia.com/v1`, store SecretRef, `z-ai/glm-5.3-flash`) and `zero`/`researcher`/`operator` intact; config bytes and mtime unchanged |
| Sessions | all original keys present; one recovery-created `agent:zero:dashboard:0d008387-…` session left untouched (deletion forbidden) |

**Caveat, stated explicitly:** startup restart-recovery auto-resumed `agent:zero:main` and made exactly **one** NVIDIA `model-fetch` (status 200, 14:43:36) before it was aborted with `sessions.abort` (`abortedRunId 2adebe14-7c60-49be-85d4-db810a70177e`). `agent:zero:main` is now `killed` with `abortedLastRun:true`. No further provider calls were made and no credential was read or written. UI-05/PM-01 remain **READY FOR REVIEW**; PM-01 live `.set`/`.delete` activation is still owner-gated.

### 22.7 Product-surface consolidation and white-label pass (2026-10-25)

The native plugin is now the single product surface for both UI-05 and PM-01.

- **Single chat:** Zero (Lead) is the only user-facing chat entry. `createSession`/`openOrCreateAgent` reject non-Lead agents; specialist cards state `Internal specialist · reached through Zero's delegation, not a separate chat.`; Team activity is read-only; specialist sidebar/chat hrefs are hidden and direct specialist routes re-target to Zero Team. Gateway sessions/history are unchanged.
- **Native About Zero:** new `src/pages/about.js` (nav id `about`, order 70) replaces `/settings/about`; product name `Zero`, description `Private assistant for local Gateway-backed work`, no anchors, no upstream marketing/repository/community/release links. Legal pointers remain to `app/NOTICE` and `THIRD_PARTY_NOTICES.md`.
- **Hidden host surfaces:** Debug, Logs, Updates, and upstream About are suppressed by the established CSS seam and re-targeted by the capture-phase route interceptor. Backend logging/audit/security controls were not touched.
- **No outbound surface:** upstream marketing/community anchors are blocked and hidden; the plugin bundle has no `fetch`/XHR/`sendBeacon`/`EventSource`/WebSocket/storage call. The host update framework remains intact as a local extension point.
- **Module split:** added `src/shared/routes.js`, `src/gateway/client.js`, `src/state/roster.js`, `src/computer/presentation.js`, `src/pages/about.js`; Team now calls `gatewayRequest` and uses the roster reducer/hold helpers. `app/src/bridge/` remains a non-running, tested library (D-015) and is absent from the bundle.

**Verification:** UI **46/46**, bridge **3/3**, `tsc --noEmit` exit 0, generation `30a00edd0af8b548b355a2081b5330f2304c3e5bebfbb2c0ef9aa0196dd71795` (JS `110,185 B`, CSS `31,325 B`), `verify-served.mjs` exit 0. Live read-only audit still serves `75d0b71f…` (no restart): **0** external requests on `/chat/zero`, Team, Models, `/settings/general`, `/settings/about`, `/debug`; injecting the new CSS into the live settings DOM changes Debug/Logs/Updates/About/build-badge from `flex` to `none`, while scoped probes keep upstream/specialist/debug links visible in content and hidden in chrome. Config remains 5,718 B / mtime 09:18:34; no session/provider/config/secret mutation. New bundle is **not** live-verified until the owner-gated restart.

Details: `reports/ui/white-label-and-single-chat.md`.

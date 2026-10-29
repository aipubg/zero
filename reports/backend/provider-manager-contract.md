# Zero Provider Manager — Gateway RPC contract (PM-00)

Status: contract and server-side extension implemented and **live-registered**; live
`zero.providers.discover`/`zero.providers.test` and failed-test-no-change are proven. The
three-agent binding patch and its rollback now have a schema/runtime source audit and a **no-write
rehearsal** (§3.4a). Replacement provider CRUD/activation remains unexercised by design until an
owner-selected provider passes test. `zero-gw` remains the live route. Owner: Qoder.
Date: 2026-10-24 05:11 IST (adds §3.7 provider/SecretRef shape, §4.2a `models.probe`, §4.6 PM-02 capability probes + registration, §4.7 PM-03 local-server mode, full adapter coverage — completions, responses, Anthropic
Messages, native Ollama — and §9 live-drift notes; 2026-10-27 removes the out-of-scope PM-04 GGUF/local-runtime artifacts).

This is the contract PM-01 builds against. It defines:

- how a custom provider is listed, created, updated, tested, discovered, activated, disabled and
  deleted using **native OpenClaw RPCs**;
- the two methods that have no native equivalent (`zero.providers.discover`,
  `zero.providers.test`), implemented by the Zero-owned plugin
  `backend/plugin/provider-manager/`;
- the secret-safety invariants, lock/rollback rules, and the current evidence.

It is not a second Gateway, model proxy, chat UI, transcript store or marketplace.

## 1. Current live inventory (evidence, 22:25 IST)

| Item | Value |
|---|---|
| Gateway | `127.0.0.1:18789`, bind loopback, auth `none`, PID 9972, started 22:18:42 |
| Health | `gateway health` → `OK (17ms)` |
| Config file | `E:\zero\backend\config\openclaw.json`, 7168 bytes, `valid: true`, `issues: []` |
| File hash | `hmac-sha256:v1:bHes9FwDyjvItR8snGd6f1qx-pjHiy5LvjFsGdUiw0Q` (root-file bytes) |
| Applied revision | `hmac-sha256:v1:zNhBxgV0z0S8vZ5DyDkvY0LIchrnJUAzCWR85R5vdh4` (`configRevisionHash` = `appliedConfigHash`) |
| Providers in file | `zero-gw` only |
| `zero-gw` | `baseUrl=https://integrate.api.nvidia.com/v1`, `api=openai-completions`, `apiKey={source:"env",provider:"default",id:"ZERO_GATEWAY_KEY"}` |
| Models | `z-ai/glm-5.3-flash`, `nvidia/nemotron-3.5-super-vl-120b-a12b` |
| Agent bindings | zero/researcher/operator primary + utility = `zero-gw/z-ai/glm-5.3-flash`; defaults fallback = `zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b` |
| Secret store | 0 entries (a disposable test entry was set, listed metadata-only, and deleted) |
| Plugin paths | `E:\zero\backend\plugin`, `E:\zero\app\zero-control-ui`, `E:\zero\backend\plugin\provider-manager` (all applied) |
| Plugin activation | manifest `activation.onStartup: true` **and** `plugins.entries.zero-provider-manager.enabled: true`; registered `zero.providers.discover`, `zero.providers.test` |
| Live methods | discovery 85 models / 188 ms; test 85 models / 162 ms; bad-path test `format` HTTP 404 with unchanged config |

`hash` covers the authored root-file bytes; `appliedConfigHash` is the resolved revision accepted
by the active runtime and equals `configRevisionHash`. They are different hash domains and are not
expected to be equal. Apply success is proven by matching revision hashes plus the
`changedPaths`/hot-reload log, not by comparing `hash` to `appliedConfigHash`.

No PM-00 step changed `models.providers`, agent model bindings, or the `zero-gw` credential. The
only config changes are the third plugin path and the explicit `zero-provider-manager` entry.

The earlier invalid template additions (`models.providerRouting`, `open-gateway`) were removed
from `backend/config/openclaw.template.json` and only the valid `.last-good` config is live. See
§9 for the evidence.

## 2. Architecture decision

OpenClaw gives a custom path plugin **no** Gateway-RPC client: `api.runtime.gateway.request` is
accepted only for bundled/trusted-official plugins (`dispatchTrustedPluginGatewayMethod`). Therefore:

1. **Native RPCs own every mutation**: `config.get`, `config.patch`, `secrets.store.list/set/delete`,
   `secrets.reload`, `models.probe`. OpenClaw keeps `baseHash` validation, JSON-merge semantics,
   `replacePaths` enforcement, config journaling, runtime application and reload/rollback.
2. **The plugin owns only what has no native RPC**: server-side SecretRef resolution and model
   discovery/test. It has no config write ability and persists nothing.
3. The PM-01 UI composes the native calls in the order below. It never calls a provider endpoint,
   never receives a stored key, and never uses a second runtime.

Rejected alternatives:

- a model proxy or provider marketplace (forbidden by the roadmap);
- a second Gateway/service to hold credentials (violates one-runtime rule);
- reading/writing the config file directly from the browser or plugin (bypasses `baseHash`,
  journal and rollback);
- raw API keys in `models.providers.<id>.apiKey` (config diffs/backups would expose them).

## 3. Operation surface

| Operation | Method(s) | Executor | Mutates config | Sees a secret |
|---|---|---|---|---|
| list | `config.get`, `secrets.store.list`, optional `models.list` | native | no | no (SecretRef metadata only) |
| create | `config.get` → `secrets.store.set` (store mode) → `config.patch` | native, composed by UI | yes | write-only, never returned |
| update | `config.get` → `secrets.store.set` (rotation) → `config.patch` → `secrets.reload` | native, composed by UI | yes | write-only |
| discover | `zero.providers.discover` | plugin | no | resolved in Gateway memory only |
| test (pre-activation) | `zero.providers.test` | plugin | no | resolved in Gateway memory only |
| test (post-activation) | `models.probe` with `agentId` | native | no | native credential owner |
| activate | one `config.patch` changing provider + agent bindings; then `models.probe`; rollback patch on failure | native, composed by UI | yes | no |
| disable | one `config.patch` that unbinds every reference; provider definition and SecretRef retained | native, composed by UI | yes | no |
| delete | preflight references → `config.patch` removes provider → optional `secrets.store.delete` | native, composed by UI | yes | no |

All plugin methods are registered with the default **`operator.admin`** scope. A PM-01 client must
hold that scope. Discovery/test consume protected credentials, so they must not be downgraded
without a separate review.

### 3.1 `list`

1. `config.get` → current `config` + `hash` + `valid`.
2. Derive each provider:

```text
ProviderView:
  id                 models.providers key
  displayName        UI-local label or id (provider config has no `name`; see §3.7)
  adapter            api
  host               URL host (never credentials; never query)
  secretRef          apiKey when it matches {source,provider,id}
  credentialState    "configured" | "missing" | "inline-migration-required"
  models             [{id, name}] (configured metadata only)
  referencedBy       effective agent bindings (defaults + entries)
  active             referencedBy.length > 0
  lastProbe          UI-owned local audit only (not native state)
```

3. `secrets.store.list` marks store-backed refs and returns metadata only. **Never** call
   `secrets.resolve` for listing.
4. If `models.providers.<id>.apiKey` is a raw string (legacy), return
   `credentialState:"inline-migration-required"` and never echo it. The UI should offer migration
   to a SecretRef.
5. `models.list` may be used to show the effective configured catalog; it is not discovery.

Reference algorithm: for each agent, collect `agents.defaults.model.primary`,
`agents.defaults.model.fallbacks[]`, `agents.defaults.utilityModel`, and
`agents.entries.<id>.model.{primary,fallbacks[],utilityModel}`; a binding references provider `p`
when its `"<p>/<model>"` prefix matches. `active` is computed, never stored: OpenClaw has no
provider `enabled` field.

### 3.2 `create`

Preconditions: provider id `^[a-z][a-z0-9_-]{0,63}$`; adapter in the supported set; URL validation
per §6.4; a SecretRef or store secret; no existing provider with that id.

1. `config.get` → `baseHash`, snapshot (store locally for rollback; never store secrets).
2. Store mode: `secrets.store.set` with
   `{name:"ZERO_PROVIDER_<ID>_API_KEY", value, kind:"secret", allowedHosts:[host]}`.
   **`kind:"secret"` only** — `kind:"env"` entries return their value from `list` by design.
   The name must match `^[A-Z][A-Z0-9_]{0,127}$`.
3. Env mode: require `{source:"env",provider:"default",id:"<ENV_NAME>"}`; the value must already
   exist in the Gateway process environment. Do not create a provider until discovery/test proves
   the ref resolves.
4. `config.patch`:

```json
{
  "raw": "{\"models\":{\"providers\":{\"my-provider\":{\"baseUrl\":\"https://...\",\"api\":\"openai-completions\",\"apiKey\":{\"source\":\"store\",\"provider\":\"default\",\"id\":\"ZERO_PROVIDER_MY_PROVIDER_API_KEY\"},\"models\":[{\"id\":\"...\"}]}}}}",
  "baseHash": "<current hash>",
  "note": "PM: create my-provider"
}
```

5. Verify `changedPaths` contains the provider path and the applied revision matches the new
   `hash`. Do **not** bind any agent yet: create is passive.
6. Compensate on failure: if the patch did not commit, `secrets.store.delete` the just-created
   store entry (only when PM created it and no other ref uses it). If the patch persisted but was
   not applied, leave the file in the recorded state, surface the persisted hash, and follow the
   rollback rules in §8.

### 3.3 `update`

- Always `config.get` immediately before writing; reject a stale UI hash.
- Use JSON merge patch for scalar changes (`baseUrl`, `api`, headers).
- Any change to a `models` array requires its exact path in `replacePaths`, e.g.
  `models.providers.my-provider.models`. Arrays replace as a unit. For ID-merged entry updates,
  nested array paths use `[]` (e.g. `models.providers.<id>.models[].input`).
- Rotating a store secret: `secrets.store.set` the same name with the new value, then
  `secrets.reload`, then patch any changed config. The SecretRef id does not change.
- Never write a key into `raw`. Never return a config diff containing a key; the native response
  redacts secret values, and the UI must not request/reconstruct them.

### 3.4 `activate`

Activation is a single native patch, preceded by a passing **pre-activation test** and followed by
a native **post-activation probe**. `zero-gw` stays primary/fallback until both pass.

1. Ensure the provider definition is committed (create is separate).
2. `zero.providers.test` for the candidate `{providerId, baseUrl, api, apiKeyRef, timeoutMs}`.
   Require `status:"ok"`. A `401/403`, timeout, network or format status stops activation and
   leaves all live bindings untouched.
3. Build one `config.patch` containing every binding change:
   - per-agent `agents.entries.<agent>.model.{primary,fallbacks[]}` and
     `agents.entries.<agent>.utilityModel` for Lead/Researcher/Operator (§3.4a);
   - `agents.defaults.model` / `agents.defaults.utilityModel` only if a new-agent default is also
     being changed.
   Build each fallback list from **that scope's own** previous chain, not from `agents.defaults`
   alone: for an entry, the previous effective primary is `entry.model` (string/primary) or the
   defaults primary if the entry is absent; its previous fallbacks are the entry's `fallbacks` when
   the entry has a model object, the inherited defaults fallbacks when the entry is absent, and
   `[]` when the entry is a string. Keep that scope's previous primary first so a provider failure
   still falls back per role. The live Operator entry (glm primary, nemotron fallback) is the
   regression case (§9 F10).
   Include `replacePaths` for every `fallbacks` array that loses an entry.
4. Verify `changedPaths` and applied revision.
5. Post-activation: `models.probe` **per changed agent** with
   `{provider: <provider id>, agentId: <id>, timeoutMs}` and an explicit `timeoutMs`
   (`models.probe` requires `provider` and is a minimal chat completion, slower than `/models`;
   see §4.2a). Also re-run `zero.providers.test` if a fast connectivity check is wanted.
6. If either check fails, immediately patch back the saved binding snapshot using the **new
   `baseHash` from the activation response** (same chain); include `replacePaths` for every nested
   `fallbacks` array the rollback deletes (§3.4a). Verify the applied revision/hash. Do not
   disable or delete `zero-gw`.
7. Only then mark the activation complete in the UI's local audit.

`zero-gw` guard: the manager must reject disable/delete/activate-over for `zero-gw` unless a valid
replacement has passed test and the owner explicitly authorizes retirement. PM-00 keeps
`zero-gw` as the bootstrap provider and fallback.

### 3.4a Verified three-agent binding patch shape (2026-10-23)

Schema facts from `openclaw config schema` (host 2026.10.6):

| Path | Accepted shape |
|---|---|
| `agents.defaults.model` | string or `{primary: string, fallbacks?: string[]}` |
| `agents.defaults.utilityModel` | string |
| `agents.entries.<id>.model` | string or `{primary: string, fallbacks?: string[]}` (`additionalProperties:false`) |
| `agents.entries.<id>.utilityModel` | string |

Runtime precedence (`dist/agent-scope-config-CtLA1__T.mjs:222`,
`dist/inference-route-V4skSpqD.mjs:151`): primary = entry model (string or `.primary`) ??
`agents.defaults.model`; utility = `entry.utilityModel ?? agents.defaults.utilityModel`. Fallbacks
come only from a model object, so an explicit entry object is required to give an agent a
fallback. `utilityModel` has no fallback list.

One activation patch can carry all three agents:

```json5
{ agents: { entries: {
  zero:       { model: { primary: "<provider>/<model>", fallbacks: ["zero-gw/<model>"] }, utilityModel: "<provider>/<model>" },
  researcher: { model: { primary: "<provider>/<model>", fallbacks: ["zero-gw/<model>"] }, utilityModel: "<provider>/<model>" },
  operator:   { model: { primary: "<provider>/<model>", fallbacks: ["zero-gw/<model>"] }, utilityModel: "<provider>/<model>" }
} } }
```

Rehearsed with the current `zero-gw` models: **9 set operations**, `schema:true`,
`resolvability:true`, `resolvabilityComplete:true`, 4 refs checked, no write.

Rollback is the inverse patch against the new `baseHash`:

```json5
{ agents: { entries: {
  zero:       { model: null, utilityModel: null },
  researcher: { model: null, utilityModel: null },
  operator:   { model: { primary: "<snapshot primary>", fallbacks: ["<snapshot fallback>"] }, utilityModel: null }
} } }
```

`replacePaths` must list every nested `fallbacks` path whose containing model object is deleted or
whose array shrinks, e.g. `agents.entries.zero.model.fallbacks` and
`agents.entries.researcher.model.fallbacks` (plus `agents.entries.operator.model.fallbacks` if that
array changes). The RPC rejects such a patch without the exact path:

- `operator.model = null` without `replacePaths` -> `INVALID_REQUEST: config.patch would remove
  entries from array path(s): agents.entries.operator.model.fallbacks`.
- The same patch with that path in `replacePaths` passes the array guard (a deliberate schema
  sentinel then failed validation), so the guard behaviour is proven without writing.

Limits the UI must respect:

- One `config.patch` is one validated write, but it is **not atomic with the post-activation
  probe**. Rollback is a second patch; keep the snapshot and the new hash.
- `changedPaths` is authoritative. A patch may contain unchanged fields (for example an unchanged
  `operator` fallback); do not count input operations as applied changes.
- The CLI `config patch --dry-run` checks schema and SecretRef resolvability but does **not**
  enforce the RPC array guard; use the RPC evidence above for that rule.
- No live binding write was performed for this rehearsal. `zero-gw` remains primary/fallback.

### 3.5 `disable`

OpenClaw has **no provider `enabled` flag**. Disable means **unbind, keep definition**:

1. Compute every reference (`referencedBy`).
2. Reject if the provider is `zero-gw`.
3. Require a replacement primary for every affected agent (may be `zero-gw` or another tested
   provider); a patch that leaves an agent with no primary/model must be rejected.
4. One `config.patch` sets the replacement binding and removes the disabled provider from every
   `primary`, `utilityModel`, and `fallbacks` array. `fallbacks` changes need `replacePaths`.
5. Keep `models.providers.<id>` and its SecretRef so re-enable is a binding-only operation after a
   fresh test. The provider is **inactive** when `referencedBy` is empty; the UI labels it from the
   computed state, not from a stored flag.
6. Re-enable = test, then a new activation patch.

### 3.6 `delete`

Preconditions: no references, not `zero-gw`, provider definition present.

1. One `config.patch` sets `models.providers.<id>` to `null`. Because this deletes a containing
   object, include the contained array path(s) in `replacePaths`:
   `["models.providers.<id>.models"]`. If a future provider schema adds other arrays, list them
   too.
2. Verify the provider is absent from `config.get` and `changedPaths` is correct.
3. If `apiKey` is a store SecretRef created by PM and no other provider references that secret
   name, `secrets.store.delete` it. Env refs are owner-managed and are **not** deleted.
4. Retain audit data as the `config.patch` `note`, the Gateway config journal/backups, and the
   UI's local action log (timestamp, provider id, changedPaths, previous hash, action). Do not add
   a second transcript store. The Gateway config history is authoritative.

### 3.7 Accepted provider shape and SecretRef rules (host 2026.10.6)

Verified from the installed `openclaw@2026.10.6` config schema
(`openclaw config schema --json`) and `SecretRef` primitives. The two owner-screenshot errors are
schema/caller issues, not a reason to loosen the validator:

**Error 2 — `models.providers.<id>.name` is rejected.** The provider entry is a closed object
(`additionalProperties:false`). Accepted keys are exactly:

| Key | Type |
|---|---|
| `baseUrl` | string |
| `apiKey` | string (legacy) or SecretRef |
| `auth` | `"api-key"`, `"aws-sdk"`, `"oauth"`, `"token"` |
| `api` | adapter enum (see §4.7) |
| `maxTokens` | number > 0 |
| `timeoutSeconds` | integer > 0 |
| `region` | string |
| `injectNumCtxForOpenAICompat` | boolean |
| `params` | object |
| `agentRuntime` | runtime object |
| `localService` | object (`command`, `args`, `cwd`, `env`) — host-defined provider field |
| `headers` | object of string or SecretRef values |
| `authHeader` | string/boolean per host schema |
| `request` | request settings object |
| `models` | array of model objects |

There is **no provider `name` field**. A UI display label must stay UI-local or be derived from the
provider id; model display names belong in `models[].name`. `allowPrivateNetwork` is a per-call RPC
param for discover/test/capabilities, **not** a provider config key. Writing either key makes the
Gateway reject the patch.

**Error 1 — SecretRef grammar.** A SecretRef is a closed `{source, provider, id}` object with
`provider: ^[a-z][a-z0-9_-]{0,63}$`. ID grammar by source:

| `source` | `id` grammar | Provider-manager |
|---|---|---|
| `env` | `^[A-Z][A-Z0-9_]{0,127}$` | accepted |
| `store` | `^[A-Z][A-Z0-9_]{0,127}$` — **same as env** | accepted |
| `file` | any string | rejected (`unsupported-secret-source`) by product decision |
| `exec` | any string | rejected (`unsupported-secret-source`) by product decision |

So a lower-case store name such as `zero-provider-demo-api-key` is invalid for **both** the host and
the plugin. The plugin validator does not conflict with the host; it now emits a source-specific
message (`uppercase secret-store name` vs `uppercase environment-variable name`). The caller must
use an uppercase name, e.g. `ZERO_PROVIDER_DEMO_API_KEY` (the UI's `secretNameForProvider` already
uppercases and replaces invalid characters). The store mutation API itself
(`secrets.store.set`) also requires `^[A-Z][A-Z0-9_]{0,127}$` (plus the internal
`github-setup-<hex>` form), confirming the same grammar.

Accepted examples:

```json
{"source":"env","provider":"default","id":"ZERO_GATEWAY_KEY"}
{"source":"store","provider":"default","id":"ZERO_PROVIDER_DEMO_API_KEY"}
```

No raw key string is accepted by the provider-manager validator; raw strings in existing config are
legacy and must be migrated to a SecretRef. Offline evidence: selftest **20/20** with separate env
and store grammar checks plus file/exec rejection. The live `zero-gw` metadata is baseUrl/api/apiKey/
models only, no `name`, with an uppercase env SecretRef id (value never read).

**Runtime ref lookup caveat (2026-10-25):** the plugin runtime config snapshot exposes
`models.providers.<id>.apiKey` as a string, not the source `{source,provider,id}` object; `config.get`
redacts and the plugin API has no source-config accessor. `zero.ui.providerCredentialRef` therefore
returns fail-closed `{ok:false,reason:"inline"}` for `zero-gw`. The supported remedy is to persist the
non-secret ref identity when the plugin/UI creates or updates a provider, not to reconstruct it from
the runtime value. Details: `control-ui-backend-contract.md` "providerCredentialRef source analysis".

## 4. Plugin method contract

Manifest: `backend/plugin/provider-manager/openclaw.plugin.json` (id `zero-provider-manager`).
Methods:

### 4.1 `zero.providers.discover`

Params (closed object):

| Field | Type | Required | Rules |
|---|---|---|---|
| `providerId` | string | yes | `^[a-z][a-z0-9_-]{0,63}$` |
| `baseUrl` | string | yes | https, or http on loopback; no userinfo/query/fragment; ≤2048 chars |
| `api` | string | no | `openai-completions` (default), `openai-responses`, `anthropic-messages`, `ollama` |
| `apiKeyRef` | SecretRef | no | exactly `{source:"env"|"store", provider, id}`; uppercase env-name id |
| `headers` | object | no | ≤16 entries, ≤8 KiB total, no CRLF, no credential-bearing names |
| `timeoutMs` | integer | no | 1000–30000 (default plugin config 10000) |
| `allowPrivateNetwork` | boolean | no | required for non-loopback private IPs |

Success `ok: true`:

```json
{
  "providerId": "nvidia-catalog",
  "adapter": "openai-completions",
  "endpoint": {"scheme": "https", "host": "integrate.api.nvidia.com", "path": "/v1/models"},
  "status": "ok",
  "latencyMs": 283,
  "count": 84,
  "truncated": false,
  "models": [{"id": "01-ai/yi-large"}]
}
```

Failure `ok: false` with `{code, message, details?}`. `models` is capped by `maxModels` (default
5000, max 10000); `truncated` reports the cap. The endpoint is `<baseUrl>/models` for
OpenAI/Anthropic adapters and `<baseUrl>/api/tags` for Ollama; a path that already ends in the
suffix is not doubled.

### 4.2 `zero.providers.test`

Same params. It performs the same catalog request but returns a bounded sample:

```json
{
  "providerId": "my-provider",
  "adapter": "openai-completions",
  "endpoint": {"scheme": "https", "host": "api.example.com", "path": "/v1/models"},
  "status": "ok",
  "latencyMs": 210,
  "count": 12,
  "modelsSample": [{"id": "model-a"}]
}
```

Semantics:

- `ok: false` = the request/config was invalid before or during setup (bad params, unsupported
  adapter/source, credential not resolvable, https violation). No provider outcome is implied.
- `ok: true` + `status` = the request completed against the upstream; `status` is one of
  `ok`, `auth`, `rate_limit`, `timeout`, `network`, `format`, `unknown` (+ `httpStatus` when
  known). A completed 401/429/timeout is a successful *RPC* with a negative *provider status*.
- `test`/`discover` never change config, never write the secret store, and never persist results.

### 4.2a Native `models.probe` (installed 2026.10.6)

`models.probe` is the native post-activation health check. The installed schema is
`ModelsProbeParamsSchema` in `backend/node_modules/openclaw/dist/agents-models-skills-D_vYckoD.mjs:616`
(compiled at `src-BSx5Woe0.mjs:6358`):

```js
closedObject({
  provider: NonEmptyString,        // required
  profileId: Optional(NonEmptyString),
  timeoutMs: Optional(Integer({minimum: 1})),
  agentId: Optional(String),
})
```

- **`provider` is required** and must be a provider id (`zero-gw`), not a model ref.
  Live proof (read-only, validation runs before the handler so no credential is used):
  `gateway call models.probe --params '{"agentId":"zero","timeoutMs":5000}'` →
  `invalid models.probe params: must have required property 'provider'`.
- **`agentId` is a configured roster id.** `resolveModelAuthAgentScope` rejects anything else before
  probing: `{"provider":"zero-gw","agentId":"not_an_agent"}` → `unknown agent id "not_an_agent"`.
  Omitting `agentId` selects the default agent; it does not mean "all agents".
- **Timeout is clamped to 5 000–60 000 ms** (default 20 000); `timeoutMs` below 5 000 is raised,
  not rejected. The handler is `models-probe-HvfiQQWM.mjs:89`.
- **A probe is a real inference call:** prompt `Reply with OK. Do not use tools.`, `maxTokens: 8`,
  concurrency 2 (`list.probe-BEKYe10g.mjs`). It can bill. Do not run one during review.
- **Model candidate selection:** `modelCandidatesFromConfig` takes
  `agents.defaults.model` (string or primary), its fallbacks, then `utilityModel`, first entry per
  provider; if the provider has no default reference, the provider's catalog row (non-deprecated,
  non-disabled) is used. The probe therefore checks **provider credentials**, using a model chosen
  from the *defaults* — not the specific `agents.entries.<id>.model`.
- **Credentials are agent-scoped:** the probe resolves the agent's `agentDir` and opens that agent's
  auth-profile store (`ensureAuthProfileStore(agentDir)`; SQLite under
  `backend/.openclaw/agents/<id>/agent/`). One agent passing does not prove another agent's
  credentials work.

Result (`ModelsProbeResultSchema`):

```json
{
  "provider": "zero-gw",
  "status": "ok|auth|rate_limit|billing|timeout|format|unknown|no_model",
  "latencyMs": 0,
  "error": "human-readable rollup error",
  "results": [{"profileId": "…", "label": "…", "status": "ok", "latencyMs": 0, "error": "…"}]
}
```

- `status` is a **rollup: `ok` if any credential target succeeded**; otherwise the highest-priority
  failure (`auth` > `billing` > `rate_limit` > `timeout` > `format` > `no_model` > `unknown`).
  Inspect `results[]` too: a partial failure can still roll up to `ok`.
- `latencyMs` is the lowest latency among results matching the rollup status.
- **No targets is not success:** `{"provider":"__nonexistent_provider__","agentId":"zero"}`
  returned `status:"unknown"`, `error:"No check targets are available for this provider."`,
  `results:[]`. Treat it as "not probed".
- RPC failures: bad params / unknown agent → `INVALID_REQUEST`; internal failure → `UNAVAILABLE`
  (`Connection check failed.`).

**Per-agent rule for activation:** probe every agent whose binding changed (or whose credential
store differs), with `provider: <provider id>` and that agent's `agentId`; one probe for `zero` is
not evidence for `researcher`/`operator`. Because the probe uses defaults candidates, it is a
credential/provider check — the route itself is proven by `config.get`/`agents list` after the
patch.

### 4.3 Status and error codes

| HTTP / cause | `status` | Plugin `code` |
|---|---|---|
| 401, 403 | `auth` | `zero-provider-manager:auth` |
| 429 | `rate_limit` | `zero-provider-manager:rate-limit` |
| 408, 504, TimeoutError/AbortError | `timeout` | `zero-provider-manager:timeout` |
| other 5xx / connection failure | `network` | `zero-provider-manager:network` |
| other 4xx / malformed catalog | `format` | `zero-provider-manager:format` |
| unknown | `unknown` | `zero-provider-manager:unknown` |
| invalid params | — | `...:bad-request` |
| unsupported adapter | — | `...:unsupported-adapter` |
| unsupported SecretRef source | — | `...:unsupported-secret-source` |
| ref resolved empty/failed | — | `...:credential-unavailable` |
| non-loopback http | — | `...:https-required` |

### 4.4 URL, header and SSRF rules

- https required for every non-loopback host; plain http is allowed only for `localhost`, `::1`
  and `127.0.0.0/8` loopback.
- Non-loopback private networks require the explicit `allowPrivateNetwork:true`; the discovery
  request is additionally constrained by a hostname allowlist and the host's guarded fetch.
- Reject URL userinfo, query, fragment, non-http(s) schemes, and >2048 chars.
- Reject `authorization`, `proxy-authorization`, `cookie`, `set-cookie`, `x-api-key`, `api-key`,
  `x-goog-api-key` as custom headers; credentials travel only as `apiKeyRef`.
- Reject CRLF/control characters and header values >1024 chars; total header bytes ≤8 KiB.
- Body caps: 4 MiB for the native catalog reader, 2 MiB for the Ollama path; pagination is capped
  by the host helper (50 pages); timeout is capped at 30 s.

### 4.5 Credential handling inside the plugin

`resolveSecretRefValues([ref], {config, env: process.env})` runs inside the Gateway process. The
value is held only in memory, inserted as `Authorization: Bearer` (OpenAI/Ollama-compatible) or
`x-api-key` plus `anthropic-version` (Anthropic), and never logged or returned. Error messages are
sanitized (secret value, `Bearer <...>`, `sk-...` → `<redacted>`, whitespace collapsed, 300-char
cap). Client-supplied provider ids are neutralized before logging. The plugin has no persistence.

### 4.6 `zero.providers.capabilities` (PM-02, implemented offline)

A read-only, bounded capability check for one provider + one model. It never writes config, never
assigns a model and never returns the credential. Registered by the same plugin as discover/test;
**live-registered** after the 2026-10-24 03:33 IST controlled restart (§4.6 below).

Params (closed set):

```json
{
  "providerId": "zero-gw",
  "baseUrl": "https://integrate.api.nvidia.com/v1",
  "api": "openai-completions",
  "model": "z-ai/glm-5.3-flash",
  "apiKeyRef": {"source": "env", "provider": "default", "id": "ZERO_GATEWAY_KEY"},
  "headers": {},
  "capabilities": ["text", "streaming", "tools", "image"],
  "timeoutMs": 20000,
  "allowPrivateNetwork": false
}
```

- `model` is a model id only (`z-ai/glm-5.3-flash`), not a provider-qualified ref. No whitespace or
  control characters; max 200 chars.
- `capabilities` is an optional subset of `text`, `streaming`, `tools`, `image` (all four by
  default).
- `timeoutMs` is the **whole-call budget** (1000–30000, default 20000). Each capability receives the
  remaining budget; a check with <500 ms left reports `timeout` without a request.
- Supports all four adapters: `openai-completions`, `openai-responses`, `anthropic-messages` and
  `ollama`. Each is native (PM-03A/PM-03B/PM-03C); there is no planned-capability fallback left.

Checks (`openai-completions`: `POST <baseUrl>/chat/completions`, per-check `max_tokens`: text 64,
streaming 4, tools 32, image 64, `temperature: 0`; `openai-responses`: `POST <baseUrl>/responses`,
`max_output_tokens` ≤64; `ollama`: `POST <baseUrl>/api/chat`, `options.num_predict` ≤64;
`anthropic-messages`: `POST <baseUrl>/messages`, `max_tokens` ≤64, `x-api-key` +
`anthropic-version: 2023-06-01`):

| id | Request | `ok` means |
|---|---|---|
| `text` | one user message "Reply with the single word OK." | 2xx and non-empty `choices[0].message.content` |
| `streaming` | same with `stream:true`, SSE response | an SSE `data:` event with a non-empty `delta.content` or `delta.role`; the reader is cancelled at the first delta, so an open stream does not hang the check |
| `tools` | one forced function `zero_probe({ok:boolean})` via `tool_choice` | 2xx and a non-empty `choices[0].message.tool_calls`; a 2xx without a tool call is `unsupported` |
| `image` | text part + 1×1 PNG data URL (`image_url`) | 2xx and non-empty content |

`openai-responses` uses the same four ids with Responses semantics: `input: [{role:"user",
content:[{type:"input_text"…}]}]`, `max_output_tokens`, `stream`; the text result is
`output_text` or a `message`/`output_text` item; `tools` are **flat** (`{type:"function", name,
description, parameters}`) with `tool_choice:{type:"function", name:"zero_probe"}`, and `ok`
requires a `function_call` output item; image input is `{type:"input_image",
image_url:"data:image/png;base64,…"}`; streaming `ok` requires a `data:` event with a non-empty
`delta` (for example `response.output_text.delta`). Mock coverage: `pm04.test.mjs`.

`ollama` uses the native `POST <baseUrl>/api/chat` with `messages`, `stream`, and
`options.num_predict`; `ok` requires a non-empty `message.content`; streaming is **NDJSON** (one
JSON object per line, no `data:` prefix) and stops at the first non-empty `message.content`; tools
use the chat-shaped `{type:"function", function:{name, description, parameters}}` and `ok` requires
a non-empty `message.tool_calls`; image input is `messages[0].images: ["<base64>"]` **without** a
data-URL prefix. Native Ollama `baseUrl` must not include `/v1`. Mock coverage: `pm05.test.mjs`.

`anthropic-messages` uses `POST <baseUrl>/messages` with `x-api-key` (when a key is configured) and
`anthropic-version: 2023-06-01`; it must **not** send `Authorization: Bearer`. Body:
`{model, max_tokens, messages:[{role:"user", content:[{type:"text", text}]}]}`; text `ok` requires a
non-empty `content[].type:"text"` block; streaming `ok` requires a `content_block_delta` with
`delta.type:"text_delta"` and non-empty `text`; tools use `tools:[{name, description, input_schema}]`
with `tool_choice:{type:"tool", name:"zero_probe"}` and require a `content[].type:"tool_use"` block;
image input is `{type:"image", source:{type:"base64", media_type:"image/png", data:"<base64>"}}`.
Keyless loopback proxies work (no `x-api-key`, version header still sent). Mock coverage:
`pm06.test.mjs`.

Result:

```json
{
  "providerId": "zero-gw",
  "model": "z-ai/glm-5.3-flash",
  "adapter": "openai-completions",
  "endpoint": {"scheme": "https", "host": "integrate.api.nvidia.com", "path": "/v1/chat/completions"},
  "status": "ok|partial|unsupported|auth|rate_limit|timeout|network|format|unknown",
  "latencyMs": 1234,
  "capabilities": [
    {"id": "text", "status": "ok", "latencyMs": 300},
    {"id": "image", "status": "unsupported", "latencyMs": 200, "error": "...",
     "diagnostics": {"httpStatus": 400, "category": "http_error"}}
  ]
}
```

- **Diagnostics are bounded and sanitized:** non-ok capabilities may include
  `diagnostics: {httpStatus?, category}`. `httpStatus` is the upstream HTTP status when one was
  received; `category` is one of `http_error`, `invalid_json`, `response_too_large`,
  `empty_content`, `empty_body`, `no_stream_delta`, `no_tool_call`, `timeout`, `network_error`,
  `transport_error`. Response bodies, headers, authorization data and keys are never included.
  Successful checks carry no diagnostics (success itself means a usable 2xx response); the handler
  log prints `diag=<id>:<httpStatus|->/<category|->` so a completed RPC remains diagnosable even if
  the CLI loses the response.
- `status` is a rollup: `ok` if every requested capability passed; `partial` if some passed; else
  the highest-priority failure (`auth` > `rate_limit` > `timeout` > `network` > `format` >
  `unsupported` > `unknown`).
- HTTP mapping per capability: 401/403 → `auth`, 429 → `rate_limit`, 408/504 → `timeout`, 5xx →
  `network`, 400/422 → `unsupported`, other 4xx → `format`.
- RPC-level errors (invalid params, unresolvable credential, SSRF/https rule) return `ok:false`
  with the stable `zero-provider-manager:*` code; per-capability provider failures return `ok:true`
  with the result above.
- Response bodies are capped at 256 KiB. The limit is enforced while reading, so a chunked response
  without `content-length` is cancelled as soon as it crosses the cap; streams are capped at 64 KiB.
  An empty 2xx body is diagnosed `empty_body`, not `invalid_json`. Credentials are resolved
  in-process, never logged or echoed, and error text is sanitized (secret, `Bearer …`, `sk-…`).
- **No side effects:** the checks only read the upstream; no `config.patch`, no model assignment,
  no secret write. Discovered models remain catalog rows until the UI/user activates one.

Acceptance evidence: `pm02.test.mjs` — **15/15** against a loopback mock (text/stream/tools/image
ok; auth redaction; image rejection → partial; tool 2xx without call → unsupported; streaming
returns on first delta while the server holds the connection; a requested subset issues only that
check; manifest/package identity is coherent; bad params rejected before any request;
discovery/capability RPCs leave the host config untouched; failed activation restores the exact
per-role bindings; sanitized diagnostics expose only `httpStatus`/`category`; an empty 2xx body
is `empty_body`; a chunked body over 256 KiB is `response_too_large`; every supported adapter has
a native check for all four capabilities and no planned-coverage fallback exists; token budgets:
text 64, image 64, tools 32, streaming 4). The `openai-responses` path has its own **8/8** loopback suite:
`pm04.test.mjs` (input/max_output_tokens shape, output_text parsing, early SSE delta, flat
function tools, input_image data URL, auth redaction, image rejection → partial, no-key local,
native coverage assertions without extra requests). Native Ollama has **7/7** in
`pm05.test.mjs` (`/api/chat`, NDJSON, chat-shaped tools, base64 images, auth, partial, no-key).
Anthropic Messages has **8/8** in `pm06.test.mjs` (`x-api-key`/version, `max_tokens`, `text_delta`
SSE, `tool_use`, base64 image blocks, auth redaction, partial, keyless). Existing `selftest.mjs`
20/20 and `integration.mjs` 5/5 still pass.

#### Registration metadata and activation plan (2026-10-24 01:20 IST)

`plugins reload zero-provider-manager` is a **package-maintenance RPC**: the host resolves a
package owner from the install index (`installed-plugin-package-ownership-Bt0dqKIK.mjs:137-147`,
`management-mutations-BsUMS3ce.mjs:311`). A config-origin plugin without an install record can take
the `discovered` reload path, but only when no install record path contains its root. The persisted
registry was `stale` (`policy-changed`, `stale-manifest`, `stale-package`) and returned
`record-missing`; the supported repair is the generated-registry refresh, not a hand edit:

1. `openclaw plugins registry --json` (read-only) → `state: "stale"`; install records exist only for
   `diagnostics-otel`, `expedia-openclaw` and `zero-policy` (whose `sourcePath` is the parent
   `E:\zero\backend\plugin`). `zero-provider-manager` has no record and no `installOwner`.
2. `openclaw plugins registry --refresh --json` → `state: "fresh"`, no config change (the registry
   is generated state under `.openclaw/state/openclaw.sqlite`).
3. Retrying `plugins reload zero-provider-manager` then returned
   `UNAVAILABLE: Another plugin or config operation is already running` for several minutes. That
   lock is a Gateway-side plugin operation, not an ownership error; the earlier Windows
   `plugin-captures` symlink failure is the known prepare blocker for hot reload. Do **not** loop
   reloads (the RPC is rate-limited) and do not force a restart for this method.

**No-write activation plan (next already-planned controlled restart):**

1. Restart with the existing shape (§10): `ZERO_GATEWAY_KEY` read from User scope into the child
   environment only, never echoed/written; state `E:\zero\backend\.openclaw`; config
   `E:\zero\backend\config\openclaw.json`.
2. Verify `gateway health`, then the log line
   `registration requested: methods=zero.providers.discover,zero.providers.test,zero.providers.capabilities`.
3. Prove registration **without a paid probe**:
   `node backend/scripts/verify-provider-manager.mjs` (read-only; exit 0 = registered, 2 = not
   registered, 1 = health/config problem). It calls `zero.providers.capabilities` with `{}` and
   requires the plugin's `INVALID_REQUEST`/`bad-request`, which only exists if the method is
   registered; no provider request is made. It also prints the provider ids and per-agent bindings
   and checks `configRevisionHash == appliedConfigHash`. The verifier itself is mock-tested
   **7/7** (`backend/scripts/test/verify-provider-manager.test.mjs`).
4. Confirm `config.get` providers and all three agent bindings are unchanged, and
   `configRevisionHash == appliedConfigHash`.
5. If the method is still unknown, stop and inspect `plugins inspect zero-provider-manager`; do not
   add a second registry, install record or wrapper plugin.
6. Rollback: none is needed (no config change). If the plugin fails to load, §10's fallback keeps
   `zero-gw` live; discover/test are unavailable but no binding is touched.

**Executable restart checklist (run after the coordinated restart):**

```bash
node backend/scripts/verify-provider-manager.mjs --json
# optional: --log <gateway-stdout-*.log>   (default: newest log under .openclaw/logs)
# optional: --no-log                       (skip corroborating log evidence)
```

Expected on success (exit 0):

```
gateway health:        ok
plugin:                activated (explicit)
capabilities method:  registered
registration log:     found (zero.providers.discover,zero.providers.test,zero.providers.capabilities)
providers:            zero-gw
revision consistent:  true
```

The **behavioral RPC is authoritative**: `zero.providers.capabilities` with `{}` must return the
plugin's `INVALID_REQUEST`/`bad-request` (no provider request). The registration log is
corroborating only. Observed 2026-10-24 03:29: the log line at `01:37:56` already listed all three
methods while the live RPC still returned `unknown method`; a log line alone must never be accepted
as registration proof. Exit codes: 0 registered + consistent; 2 method missing/unknown response;
1 health/config failure or plugin explicitly inactive.

| Observation | Meaning | Action |
|---|---|---|
| `unknown method: zero.providers.capabilities` | method not registered (plugin inactive, old code, or registration not applied) | stop; inspect activation; no provider calls; do not retry reload in a loop |
| plugin validation error (`invalid … params`, `zero-provider-manager:bad-request`) | registered; empty params rejected before any provider request | proceed; run a real probe only when an owner-selected endpoint/model is ready |
| per-capability `auth`/`unsupported`/`timeout`/… | provider/model result from a real probe — **not** a registration failure | handle as provider state; not a restart problem |
| health failed, revision mismatch, or plugin `not activated` | runtime/config/activation problem | stop; read-only inspection; no binding writes |

**Resolution — controlled restart performed 2026-10-24 03:33 IST.** Preconditions were verified
read-only: PID 9972 (created 22:18:42), health OK, config sha `b1063a4e77c70336` at 01:37:55,
`zero-gw` only, defaults Nemotron with empty fallbacks, Operator explicit GLM + Nemotron fallback,
revision == applied, no active agent run (last ended 02:48), and `ZERO_GATEWAY_KEY` present at User
scope (presence checked only; never printed). PID 9972 was stopped, the port released, and the
successor started at **03:33:29 as PID 25632** with the User-scope key copied into the child
environment only.

Post-restart authoritative check (`verify-provider-manager.mjs`, exit 0):

```
gateway health:        ok
plugin:                activated (explicit)
capabilities method:  registered
registration log:     found (zero.providers.discover,zero.providers.test,zero.providers.capabilities)
providers:            zero-gw
revision consistent:  true
```

The empty-params call returned the plugin's bare validation message
`providerId must match ^[a-z][a-z0-9_-]{0,63}$`, proving the method ran; every capabilities log
line is `status=invalid` and **no provider request was made**. Config sha/mtime stayed
`b1063a4e77c70336`/01:37:55, providers and all three bindings are unchanged, and the log recorded no
new `config.patch write` (still four, none from the restart).

Checklist fixes found during the restart: (1) registration classification must accept the plugin's
**bare** validation messages, not only `invalid`/`bad-request`; (2) the health probe now uses
`^OK (` (not a loose `OK` substring) with 30 s timeout and one retry after 2 s, because plugin
activation can exceed the old 15 s; (3) log scanning walks both `.openclaw/logs/gateway-stdout-*.log`
and the per-day `%TEMP%/openclaw/openclaw-*.log`, newest first, and takes the first file containing a
registration line. These are covered by 9/9 mock tests.

**Recovery path if the method is still missing:** check `plugins inspect zero-provider-manager`
(`activated`, `activationSource`), `plugins.entries.zero-provider-manager.enabled` and
`activation.onStartup` in the manifest, and the third `plugins.load.paths` entry. Do not install a
second registry/plugin, do not hand-edit generated state, and do not loop `plugins reload`. If the
plugin is active with the old code, the next coordinated restart with the §10 shape is the supported
path; `zero-gw` and all bindings stay untouched in the meantime. If the config revision/applied hash
mismatches, stop and inspect read-only; do not restore or probe without an owner decision.

#### Live zero-gw capability probes (2026-10-24 03:40 and 03:59 IST)

All three runs were owner-authorized, bounded calls to `zero.providers.capabilities` for
`zero-gw` / `z-ai/glm-5.3-flash`, `apiKeyRef {source:"env", provider:"default", id:"ZERO_GATEWAY_KEY"}`
(resolved inside the Gateway; never printed, copied or persisted), all four capabilities,
`timeoutMs:30000`.

| Capability | 03:40 (no diagnostics, max 4) | 03:59 (text 32 / image 32) | 04:05 (text 64 / image 32) | 04:19 (image-only, image 64) |
|---|---|---|---|---|
| `text` | `format` | `format` — HTTP **200**, `empty_content` | **`ok` (3,831 ms)** | — |
| `streaming` | `ok` | `ok` (482 ms) | `ok` (824 ms) | — |
| `tools` | `ok` | `ok` (3,076 ms) | `ok` (2,338 ms) | — |
| `image` | `format` | **`ok` (4,230 ms)** | `format` — HTTP **200**, `empty_content` (2,156 ms) | **`ok` (27,306 ms)** |
| Rollup / latency | `partial`, 11,067 ms | `partial`, 9,024 ms | `partial`, 9,149 ms | `ok`, 27,306 ms |

The initial run completed after the CLI's default 10 s deadline, so its response was lost; the
follow-ups passed `--timeout 45000` and were fully captured. No retry was made in any run.

**Conclusions:**
- **Text: observed pass at 64; stability not established.** `max_tokens` 4 and 32 produced HTTP 200
  `empty_content`; **64 produced `ok` once**. The 4/32 failures plus the 64 pass support a budget
  effect in these runs, but there is only one 64 run, so this is an **observed pass**, not a
  stable/verified state.
- **Image is not fixed:** 4 → `format`; 32 → `ok` once and `empty_content` once; **64 → `ok` once**
  (27,306 ms). That is a single observation at 64, not proof of stability. The image result must
  reflect the latest probe and must not be described as permanently verified or unsupported.
- **Budget/performance caveat:** an image-only probe at 64 tokens took 27.3 s, close to the 30 s
  whole-call budget. A four-check probe at `timeoutMs:30000` may exhaust the budget before or
  during the image check; image-only or a larger explicit timeout is the safe shape for future
  image probes.
- `streaming`/`tools` stayed `ok` in every run, so registration, route and credentials work.
- Diagnostics confirm the empty-content branch (`httpStatus:200`, `category:"empty_content"`); no
  response bodies were captured or needed.

**Acceptance terminology:** an **observed pass** means the check returned `ok` in the recorded
run(s); **stable/verified** means repeated `ok` across runs under the intended configuration. Text
has one observed pass at 64; image has one observed pass at 64 and mixed results at 32; neither is
stable/verified. `streaming`/`tools` passed in every observed run, which is still observation-based
and not a permanent guarantee.

**Diagnostics design:** non-ok checks now return `diagnostics: {httpStatus?, category}`
(categories: `http_error`, `invalid_json`, `response_too_large`, `empty_content`, `empty_body`,
`no_stream_delta`, `no_tool_call`, `timeout`, `network_error`, `transport_error`). No bodies,
headers, authorization data or keys are included; the handler log prints
`diag=<id>:<httpStatus|->/<category|->`, e.g.
`diag=text:200/empty_content,streaming:-/-,tools:-/-,image:-/-`. Success carries no diagnostics
(a usable 2xx is implied). Offline tests: pm02 **15/15** (diagnostics, empty-body/chunked-limit
handling, all-native adapter invariant and text/image-64 budgets included).

**Activation and safety:** diagnostics were loaded by a controlled restart at ~03:58
(PID 25632 → 30884), the 64-token text budget at ~04:04 (PID 30884 → 19868), and the 64-token image
budget at ~04:18 (PID 19868 → **22876**); the verifier returned exit 0 after each startup (plugin
activated, method registered, three-method log, zero-gw, revision consistent). Config sha stayed
`b1063a4e77c70336` (mtime 01:37:55), the config-write count stayed 4, no binding/secret changed, and
log scans found **0** `nvapi-` and **0** `Bearer ` occurrences. Exactly four probes exist in the
log. `local-provider-check.mjs` keeps `--timeout 45000` so a completed probe is not lost.

**Why `format` can occur (code-path analysis):** `capabilityStatusFromHttp` maps 400/422 to
`unsupported`, 401/403 to `auth`, 408/504 to `timeout`, 429 to `rate_limit`, 5xx to `network`, and
other 4xx to `format`; `readJsonBounded` yields `format` for oversized/non-JSON bodies; the
content checks yield `format` for empty content. All observed failures are the **empty-content**
branch with HTTP 200. Text shows a budget effect (4/32 failed, 64 passed once) and image is mixed
(one `ok` at 32, one empty at 32, one `ok` at 64). Both are **observed passes**, not stable/verified
states. Any further image or text probe needs explicit owner authorization; an image probe should be
image-only (the 64-token image check alone took 27.3 s).

### 4.7 Local-server mode (PM-03, implemented offline)

Zero connects to an **already-running** local endpoint; it never installs a runtime or downloads a
model in this slice. The same `zero.providers.discover` / `zero.providers.test` /
`zero.providers.capabilities` methods and the same provider form are used.

**Host classification** (`classifyHostname`, used by `parseBaseUrl`):

| Scope | Examples | HTTP | HTTPS |
|---|---|---|---|
| `loopback` | `127.0.0.0/8`, `localhost`, `localhost.`, `[::1]` | allowed, no opt-in | allowed |
| `private` | `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `100.64/10`, `198.18/15`, `0/8`, `[fd00::/8]`, `[fe80::/10]`, IPv4-mapped IPv6 | **requires `allowPrivateNetwork:true`** | **requires `allowPrivateNetwork:true`** |
| `local` | `*.local` (mDNS) | requires opt-in | requires opt-in |
| `public` | everything else | **rejected** (`https-required`, even with opt-in) | allowed |

- The opt-in is **explicit per call** (`allowPrivateNetwork:true` on discover/test/capabilities),
  never inferred from a previous provider or a saved default.
- A public name that DNS-resolves into private space is rejected by the guarded fetch unless the
  opt-in is set; parse-level classification covers IP literals and `.local`.
- The URL parser normalizes alternate IPv4 forms before classification (`0x7f.0.0.1` and
  `2130706433` → `127.0.0.1`); leading-zero octets follow WHATWG parsing (`010.0.0.1` → `8.0.0.1`).
  IPv4-mapped IPv6 is treated as `private` and requires the opt-in.
- Errors: `zero-provider-manager:private-network-opt-in-required`,
  `zero-provider-manager:https-required`, `zero-provider-manager:bad-request` (userinfo, query,
  fragment, credentials in custom headers).

**Adapter coverage** (`CAPABILITY_ADAPTER_COVERAGE`):

| Adapter | Discovery | text | streaming | tools | image |
|---|---|---|---|---|---|
| `openai-completions` | native `/models` | native | native | native | native |
| `openai-responses` | native `/models` | native | native | native | native |
| `anthropic-messages` | native `/models` | native | native | native | native |
| `ollama` | native `/api/tags` | native | native | native | native |

Capability checks send `POST <baseUrl>/chat/completions` for `openai-completions`,
`POST <baseUrl>/responses` for `openai-responses`, `POST <baseUrl>/api/chat` for native `ollama`,
and `POST <baseUrl>/messages` for `anthropic-messages`. All four adapters are native. Local servers
expose either the OpenAI-compatible adapter or native Ollama:

- Ollama OpenAI-compatible: `http://127.0.0.1:11434/v1` with `openai-completions` (capabilities +
  discovery); native `ollama` with `http://127.0.0.1:11434` supports discovery (`/api/tags`) and
  all four capability probes (`/api/chat`).
- LM Studio (typically `:1234/v1`), llama.cpp server (`:8080/v1`), vLLM and SGLang (`:8000/v1`):
  `openai-completions`; include the `/v1` prefix in `baseUrl` because the manager appends `/models`
  or `/chat/completions` to the path as given.

**No-key local endpoints:** `apiKeyRef` is optional. With no key, no `Authorization` header is sent
and discovery/capability checks still work (proven against a loopback mock). Inline keys are not a
parameter; credential-bearing custom headers (`authorization`, `x-api-key`, …) remain rejected.
A key, when needed, still travels only as an `apiKeyRef` and is resolved inside the Gateway.

**UI contract for OpenCode:**

- Show the private-network opt-in only when classification is `private`/`local`; loopback needs no
  checkbox. Send `allowPrivateNetwork:true` only after the user ticks it; never auto-enable or
  remember it.
- Local endpoints may omit the key; do not mark the key required for loopback hosts.
- All four adapters now support all four capability probes; no planned-coverage badge is needed.
- Native Ollama does not use `/v1`; the OpenAI-compatible path (`<host>/v1` +
  `openai-completions`) remains available when the owner prefers one adapter for local servers.
- Show a base-URL hint that OpenAI-compatible local servers need their `/v1` prefix.
- `unknown method` from `zero.providers.capabilities` remains "unavailable — pending Gateway
  restart" (§4.6).

Acceptance: `pm03.test.mjs` — **9/9** (loopback matrix; private/local matrix with and without
opt-in, http and https; public http still rejected even with opt-in; narrow loopback detection;
no-key local capability and discovery for OpenAI-compatible and native Ollama, including a trailing
slash; env SecretRef auth on a keyed local endpoint; adapter coverage with zero requests;
credential-header and inline-key rejection). Current sibling counts: `pm02.test.mjs` 15/15,
`pm04.test.mjs` 8/8, `pm05.test.mjs` 7/7, `pm06.test.mjs` 8/8, `selftest.mjs` 20/20,
`integration.mjs` 5/5. `pm05`
covers native Ollama `/api/chat` (messages/num_predict, NDJSON early stop, chat-shaped tools,
base64 images without a data prefix, auth redaction, partial image rejection, no-key operation);
`pm06` covers Anthropic Messages (`x-api-key` + version, messages/max_tokens, `text_delta`
streaming, `tool_use`, base64 image blocks, auth redaction, partial image rejection, keyless
loopback, unchanged private-network rules).

#### Adapter/status contract for the UI (PM-03 review, 2026-10-24 03:22 IST)

Backend coverage is now **all four adapters native**: `openai-completions`, `openai-responses`,
`anthropic-messages`, `ollama`, for discovery and for `text`/`streaming`/`tools`/`image`. No adapter
is "planned"; the UI may enable every adapter option without a coverage warning. The only invalid
adapter is an unknown id (backend `unsupportedAdapter`).

| Backend state | Meaning | Required UI text | Assignment |
|---|---|---|---|
| `ok` (per capability) | probe passed for this provider/model | `Tools/Image: Verified (Probed)` | Operator only if **both** tools and image are `ok` |
| `partial` | some capabilities passed | show each capability's own state | Operator follows tools+image; Lead/Researcher unaffected |
| `unsupported` (top-level or per capability) | the provider/model **rejected that capability** during a real probe | `Unsupported (Probed)` or `Not supported by provider/model` | Operator blocked unless owner override; Lead/Researcher allowed |
| `auth`, `rate_limit`, `timeout`, `network`, `format`, `unknown` | probe failed; capability is **unknown**, not absent | `Probe Failed (<status>)` with retry | Operator blocked until a later `ok` probe |
| `unavailable` / `unknown method` | capability RPC not registered yet | `Unavailable (Pending Gateway restart)` | Operator blocked; do not infer unsupported |
| no probe data | never checked | `Tools: Unprobed` / `Image: Unprobed` | Operator blocked unless owner override |
| UI eligibility gate | Operator lacks verified tools+image | explicit reason text with the missing capabilities | blocked unless the owner ticks the override |

Rules:

- **Never** label a genuine `unsupported` result "adapter coverage planned" for a supported adapter.
  The planned-coverage label is only valid if the backend's own error text says coverage is planned
  (no adapter does today).
- **Visual disabled styling is not evidence.** A grayed/disabled control must expose the same state
  in text (and `title`/ARIA); capability or safety must come from probe data, host rules or the
  Operator gate, never from CSS. Conversely, an enabled option is safe as long as the action is
  gated with a visible reason (as the Operator selector does today).
- **Host safety blocks** remain separate from capability states: public `http://` (must use https),
  private/`.local` without `allowPrivateNetwork:true`, inline keys or credential-bearing custom
  headers, and `zero-gw` disable/delete. These are invalid/unsafe, not "unsupported capability".
- Adapter hints: `openai-completions`/`openai-responses` and `anthropic-messages` use the server's
  `/v1` base; native `ollama` uses the host root (no `/v1`). Anthropic requests are `x-api-key` +
  `anthropic-version` server-side; the browser never calls the provider.

**UI copy closed (PM-03E, read-only evidence 2026-10-24 06:15 IST):** the live bundle is
`de6730fe0135d2dd3990e632f8f6b459a8ad40a0e84b3f401183a306d572dd05` (source `e7a65331…`, catalog
`bc51ce1a…`; JS 88,271 B, CSS 27,639 B). All four adapter options render `[Probe supported]`,
genuine `unsupported` renders `Unsupported (Probed)`, and `format` renders
`format (probe result, cause unconfirmed)`. No `Capability probe planned` or
`adapter coverage planned` copy remains in the served/source UI. `node --test
app/zero-control-ui/test/mount.test.mjs` is **8/8**, and `verify-served.mjs` reports HTTP 200 with
byte-identical JS/CSS. OpenCode owns the UI change; Qoder made no `app/` edit.

Manual check when a local server is already running (no key, no install, no download):

```bash
# Read-only: host rules + discover/test + capabilities (or "pending restart")
node backend/scripts/local-provider-check.mjs \
  --base-url http://127.0.0.1:11434/v1 --model llama3.2:3b

# Native Ollama (no /v1)
node backend/scripts/local-provider-check.mjs \
  --base-url http://127.0.0.1:11434 --api ollama --model llama3.2:3b

# Private/LAN endpoint: deliberate opt-in only
node backend/scripts/local-provider-check.mjs \
  --base-url http://192.168.1.20:8000/v1 --model local/model --allow-private-network

# Capability subset (e.g. image-only for a slow image probe)
node backend/scripts/local-provider-check.mjs \
  --base-url http://127.0.0.1:8000/v1 --model local/model --capabilities image
```

The script validates `--base-url` with the same host rules, rejects unknown options and invalid
`--api`/`--provider-id`/`--model`/`--timeout-ms`/`--key-env`/`--capabilities` values, and never
reads or prints a key value (`--key-env NAME` passes an env SecretRef for the Gateway to resolve).
`--capabilities` accepts a comma-separated subset of `text,streaming,tools,image`; use
`--capabilities image` for image-only probes because a 64-token image check can take ~27 s.
Exit codes: **0** when
discover/test pass and capabilities are `ok`/`partial`/`unavailable-pending-restart`; **1** on a
discover/test failure or a capability status of `auth`/`rate_limit`/`timeout`/`network`/`format`/
`unknown`/`error`; **2** on invalid input or host rules. Nothing above is run by the offline suites.

The harness is tested dependency-free with a mock CLI (`ZERO_PROVIDER_CHECK_CLI` points at
`backend/scripts/test/fixtures/mock-openclaw-cli.mjs`): **12/12** in
`backend/scripts/test/local-provider-check.test.mjs` — help, the argument-validation matrix with no
Gateway call, private opt-in (http), public-http rejection, missing capability method, capabilities
ok/partial/auth, discover/test failures, exit codes, and secret-free output/RPC params.

## 5. Native RPC parameters (reference)

`config.patch`:

```json
{
  "raw": "<JSON5/JSON merge patch string>",
  "baseHash": "<hash from config.get>",
  "note": "<audit note>",
  "replacePaths": ["<exact array path>", "<nested path[] if applicable>"],
  "sessionKey": "<optional>",
  "restartDelayMs": 0
}
```

- Objects merge; `null` deletes; arrays replace only when their exact path is in `replacePaths`.
- Deleting a containing object requires its contained array paths.
- `baseHash` is required once a config exists.
- The response reports `changedPaths` (runtime-effective paths) and the new `hash`. On
  `UNAVAILABLE` with `details.persistedConfig`, the file was written but runtime application did
  not complete: treat the write as staged, not active, and follow §8.

Secret store:

- `secrets.store.set {name, value, kind:"secret", allowedHosts?: string[]}` →
  `{ok:true, reloaded, warningCount?}`. Use `kind:"secret"` only.
- `secrets.store.list {}` → entries with metadata; secret entries **do not** carry `value`.
  `kind:"env"` entries do carry `value` and must not be used for provider keys.
- `secrets.store.delete {name}` → soft delete; `{ok:true, reloaded, warningCount?}`.
- `secrets.reload` refreshes runtime secret material after rotation.

`models.probe {provider, profileId?, timeoutMs?, agentId?}`:

- Requires `agentId` when multiple agents exist and auth ownership is ambiguous (observed).
- Statuses include `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`,
  `no_model`.
- It is a chat-completion probe, not a catalog request; it is the native post-activation check.
  Use an explicit timeout; PM-00 observed an earlier 20 s probe ending in `timeout` after ~22.7 s
  while the same provider's `/v1/models` answered in under a second. Do not treat a probe timeout
  as proof of a bad key.

## 6. Secret-safety invariants (MUST)

1. The only key material accepted by the plugin is a SecretRef with `source` `env` or `store`.
   Raw strings, inline keys, and credential-bearing headers are rejected before any network call.
2. `list` returns SecretRef identity/metadata only. It never resolves or returns a value.
3. `create`/`update` never place a key in `raw`, a note, a report, a log line, or a response.
   Store writes are `kind:"secret"` only.
4. Discovery/test resolve credentials inside the Gateway; the browser and upstream never receive
   the value from Zero. Responses contain only ids/counts/status.
5. Errors and logs are sanitized; logs contain provider id, adapter, host, status, count and
   latency only. Client ids are neutralized for log integrity.
6. `ZERO_GATEWAY_KEY` remains environment-only. It is not copied to the secret store, config,
   reports or chat.
7. Deleting a provider removes its store secret only when PM created it and no other provider
   references it; env refs are owner-managed.
8. `zero-gw` is protected from disable/delete by the manager.

Proven by the offline and integration suites; see §9.

## 7. PM-01 UI requirements

- Use only these RPCs over the Gateway WS. Never fetch a provider URL from the browser.
- Keep the `config.get` hash with the edit draft; reject/reload on a stale hash.
- Mask credentials as “configured / replace / remove”; never render a value.
- Discovery is debounced and cancellable; ignore stale responses by sequence/generation.
- Show `active` as computed from references, not a stored `enabled` flag.
- Require a passing test before activation; show pre- and post-activation checks separately.
  The post-activation check is `models.probe {provider, agentId}` per changed agent (§4.2a); a
  provider-less call is rejected by the installed schema.
- Defaults are explicit: do not label a concrete first-model ref "Auto". Offer "Inherit defaults"
  only on per-agent rows, implemented by omitting/`null`-deleting the entry model. Absence at the
  defaults level resolves to `<none>`, not to a host-chosen model.
- Offer manual model IDs when discovery is empty/unsupported.
- Delete is disabled until all role bindings are moved; `zero-gw` has no delete/enable action.
- Activation must keep a working fallback and display the rollback revision.

## 8. Activation, apply and rollback rules

1. Snapshot `config.get` immediately before each write; keep the previous hash and the affected
   paths (not the key).
2. Preflight the candidate with `zero.providers.test` (fast `/models` connectivity). Do not
   activate on a failed test.
3. Commit in one patch; verify `changedPaths` and the **applied** revision, not just `valid:true`.
4. Run `models.probe` once per changed agent with `{provider, agentId, timeoutMs}` (§4.2a).
   If any fails (including `unknown` with empty `results`), patch back the snapshot **using the
   baseHash returned by the activation response**, with `replacePaths` for every nested `fallbacks`
   array the rollback deletes or shrinks (§3.4a), and verify the applied revision. Keep `zero-gw`
   referenced during the whole operation.
5. On `UNAVAILABLE` with `details.persistedConfig`: the file may contain the new write while the
   runtime did not apply it. Stop all further activation work, read `config.get`, reapply the
   snapshot (or `config.apply` the snapshot) and verify `appliedConfigHash`. Do not delete the
   previous provider or secret until the rollback applied.
6. A failed test/probe never alters live bindings: discovery/test are read-only; the activation
   patch is issued only after the pre-test passes, and a failed probe triggers the saved rollback.
7. Audit: `note`, changedPaths, applied hash, timestamp, provider id, action. No new datastore.
8. The binding patch and rollback shapes are proven by schema/runtime audit and a no-write
   rehearsal only; the first live activation/rollback follows the owner-selected replacement.

## 9. Evidence — what is proven and what is not

### Proven

| Claim | Evidence |
|---|---|
| `zero-gw` provider definition unchanged and Gateway live | config file providers = `zero-gw` only; health `OK (17ms)`; PID 9972 responding; no `models.providers` patch issued. Role defaults later changed by the Control UI, see the drift subsection below |
| Invalid template additions removed | `openclaw.template.json` parses; `models` keys = `mode,providers`; providers = `zero-gw`; 3 plugin paths and the provider-manager entry |
| Plugin manifest/schema/module valid | `node --check index.mjs`; `plugins inspect zero-provider-manager` → enabled, activated, format `openclaw`, source correct |
| Plugin validation, registration and no-leak logic | `selftest.mjs` **20/20 pass** (incl. schema equality, activation assertion, SecretRef/header/URL rules, error mapping, registration, raw-key rejection, log-injection neutralization) |
| End-to-end discovery/test logic with a secret | `integration.mjs` **5/5 pass** against a loopback mock: server-side Bearer header, dedupe, sample, 401 → `auth`, no secret in responses or logs |
| **Live plugin registration** | after `plugins.entries.zero-provider-manager.enabled: true` hot-applied: `[plugins] [zero-provider-manager] registration requested: methods=zero.providers.discover,zero.providers.test` (the capability method was added later; the 03:33 IST restart registered all three — §4.6); `Plugin replacement applied: zero-provider-manager`; `config hot reload applied (plugins.entries.zero-provider-manager)`; `plugins inspect` → `activated:true`, `activationSource:explicit` |
| **Live authenticated discovery** | `gateway call zero.providers.discover` with the env SecretRef → **85 models / 188 ms**, endpoint `https://integrate.api.nvidia.com/v1/models`, sample `01-ai/yi-large`, `adept/fuyu-8b`, `ai21labs/jamba-1.5-large-instruct`; no key in response or logs |
| **Live provider test** | `gateway call zero.providers.test` → `status:"ok"`, 85 models / 162 ms, bounded 5-model sample; no key in response or logs |
| **Failed test does not alter live bindings** | `zero.providers.test` against `/v1/nonexistent` → `status:"format"`, HTTP 404; file hash `bHes9Fw…` and applied revision `zNhBxg…` unchanged; providers/bindings unchanged |
| **Three-agent binding schema and precedence** | `openclaw config schema`: entry `model` = string or `{primary, fallbacks[]}`, entry `utilityModel` = string, `additionalProperties:false`; runtime `agent-scope-config-CtLA1__T.mjs:222` (entry primary ?? defaults) and `inference-route-V4skSpqD.mjs:151` (entry utility ?? defaults) |
| **One activation patch shape (no write)** | `openclaw config patch --dry-run --json`: **9 operations**, `schema:true`, `resolvability:true`, `resolvabilityComplete:true`, 4 refs checked; live config sha256 unchanged |
| **Rollback patch shape and array guard (no write)** | rollback dry-run **7 operations**; live RPC `config.patch` with `operator.model:null` and no `replacePaths` → `INVALID_REQUEST: … would remove entries from array path(s): agents.entries.operator.model.fallbacks`; the same patch with that path in `replacePaths` cleared the guard and failed only on a deliberate schema sentinel; no write either time |
| Protected store metadata-only list | `secrets.store.set` a disposable fake secret → `list` showed 1 `kind:"secret"` entry with **no `value` field** → `delete` → 0 entries |
| No credential markers in live logs | counts for `bearer` and `nvapi-` in the new Gateway stdout/stderr logs: **0 / 0** |

### Binding rehearsal (2026-10-23 22:50–23:00 IST)

No live binding write. `zero-gw` stayed the only provider and the live route throughout.

- Baseline `config.get`: `valid:true`, file hash `hmac-sha256:v1:8IAjbz…`, config
  revision/applied `hmac-sha256:v1:cUrVc9…`. Live file sha256 prefix `103bcfc71b999c4a`.
- Activation-shaped patch (Lead/Researcher/Operator primary + fallback + utility, current
  `zero-gw` models): `config patch --dry-run --json` → 9 operations, schema/resolvability true,
  4 refs checked. File sha unchanged after the dry-run.
- Rollback-shaped patch (delete the two added entry bindings, restore the operator object):
  dry-run → 7 operations, schema/resolvability true. File sha unchanged.
- Live RPC guard proofs (all rejected before any write; file sha unchanged):
  1. `agents.entries.operator.model.fallbacks: []` without `replacePaths` → `INVALID_REQUEST`
     naming `agents.entries.operator.model.fallbacks`.
  2. `agents.entries.operator.model: null` without `replacePaths` → `INVALID_REQUEST` naming the
     same nested path (parent-object deletion counts as a destructive array change).
  3. Same parent-null patch **with** `replacePaths:["agents.entries.operator.model.fallbacks"]`
     plus a deliberate invalid `name` value → the array guard passed and schema validation failed
     on the sentinel. This proves the guard/`replacePaths` mechanics, not a successful write.
- Consequence for PM-01: the rollback patch must carry the nested `fallbacks` paths even though
  the patch body contains `model:null`; the CLI `--replace-path` flag cannot preflight that shape
  because it requires the path to exist in the input patch. Use the RPC contract, not the CLI, for
  the rollback rehearsal.

### Not proven (not attempted or previously blocked)

- **Live provider CRUD/activation.** No `models.providers` create/update/disable/delete/activate
  patch was applied; `zero-gw` is intentionally untouched until a replacement passes test. The
  contract sequences are specified but not exercised against a second provider. The three-agent
  binding patch has not been written live either; only its schema, runtime precedence, dry-run and
  rollback guard mechanics are proven (§3.4a).
- **Activation rollback live.** Follows the first real provider activation.
- **`models.probe` success.** Earlier probes: without `agentId` → `INVALID_REQUEST`; with
  `agentId:"zero"` and 20 s → `timeout` after ~22.7 s / 27.3 s while `/models` answered in
  ~200 ms. Recorded as a latency/timeout result, not a successful probe.
- **Historical host defect (resolved for this process).** The first attempt to apply the plugin
  path in PID 12856 failed with `EPERM` while creating the plugin-build capture junction;
  `plugins.refresh` produced the same error. A fresh Gateway process applied the same plugin and
  config changes without EPERM. The old failure remains recorded as a process/host defect; the
  current process has no such error.

### Gate re-run after live activation (2026-10-23 22:26 IST)

- Zero policy `selftest.mjs`: **111/111**; provider-manager `selftest.mjs`: **19/19 at the time;
  current suite 20/20**; provider-manager `integration.mjs`: **5/5**. No key printed.
- Live `zero.providers.discover`: **85 models / 188 ms**; live `zero.providers.test`:
  **85 models / 162 ms**; bad-path test: `format`/HTTP 404 with unchanged revision hashes.
- `backend/scripts/preflight.mjs`: **27 pass / 3 warn / 2 fail**. Preflight validates
  `openclaw.template.json`, not the live file. Both failures come from the template's **two**
  provider model rows (`z-ai/glm-5.3-flash` and `nvidia/nemotron-3.5-super-vl-120b-a12b`) against
  the one-route invariant; the template's `agents.defaults.model` and operator entry were both
  `glm` with **empty** fallbacks at that time. These two failures are not a PM-00 regression.
  Owner decision remains: accept a two-model catalog and update the invariant, or prune the
  nemotron row.

### Post-PM-00 live drift from the Control UI (22:35–22:37 IST)

The Control UI changed the live model defaults **after** the PM-00 evidence above was recorded.
This was not a Qoder or provider-manager write.

- `22:35:37` `config.patch write actor=openclaw-control-ui device=90dd7d16… changedPaths=agents.defaults.model`
- `22:36:21` same actor → `changedPaths=agents.defaults.utilityModel`
- `22:37:01` same actor → `config.patch noop (no changed paths)`

The Gateway was serving the pre-PM-01 09:20 build during these writes (F7 below), so they came
from the native settings route, not from the new Models page.

Live result (`config.get` + `openclaw agents list --json`, 22:53 IST):

| Slot | Live value |
|---|---|
| `agents.defaults.model` | `zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b` (string, no fallback) |
| `agents.defaults.utilityModel` | `zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b` |
| Lead `zero` effective primary | `zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b` (inherited) |
| Researcher effective primary | `zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b` (inherited) |
| Operator effective primary | `zero-gw/z-ai/glm-5.3-flash` (explicit entry, fallback nemotron) |
| Providers | `zero-gw` only; no `models.providers` patch |

**Addendum (2026-10-24 01:37:55 IST).** A second Control UI write changed the live defaults:
log line 705 `config.patch write actor=openclaw-control-ui device=90dd7d16… changedPaths=
agents.defaults.model,agents.defaults.utilityModel`. Current state: sha prefix `b1063a4e77c70336`,
`agents.defaults.model` = `{primary: zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b, fallbacks: []}`,
`agents.defaults.utilityModel` **absent** (previously nemotron), Operator unchanged (explicit glm
primary + nemotron fallback), providers `zero-gw` only. This matches a PM-01 F9 utility-inheritance
test (null deletion); it is not a Qoder write and was not reverted. Any migration or route
acceptance must read this current state, not the 22:36 snapshot.

This diverges from the owner route (`glm-5.3-flash`), from the template (`defaults` = glm, empty
fallbacks), and from `openclaw.json.last-good` (glm primary + nemotron fallback, 22:34:47).
Nobody should silently "fix" it: the write came from the Control UI and may be an intentional
owner/UI test. Decision needed: restore the glm route, accept nemotron for Lead/Researcher, or
make the template match an accepted live choice. Until then, BE-02's model-route criterion is
open, and any PM-01 activation must snapshot the **current** live bindings, not the template.

### PM-01 shipped-UI verification (read-only, 2026-10-23 23:15–23:38 IST)

Scope: `app/zero-control-ui/browser.js` (source), the PM-01 disk build
`dist/control-ui/4c05f749bcb7ffaa1319c4863f55ca9e848dae7e3a738dec82d612b6cbb5a9ff/index.js`
(see F7: not the served build),
the installed host (`openclaw@2026.10.6`) `dist/` contract, live `config.get` and
`openclaw agents list --json`. No writes: live config sha256 prefix `103bcfc71b999c4a` before and
after; config mtime stayed `22:36:21`. A 23:27 readback confirms the same bindings
(`zero`/`researcher` → nemotron, `operator` → glm) and `gateway health` OK (14 ms).
The only config writes in today's Gateway log are the three
Control UI writes listed above (22:20:45 plugin enable, 22:35:37 defaults.model, 22:36:21
defaults.utilityModel); none after 22:37.

The bundle contains `PM: activate`, one `replacePaths` use for activation and **zero** occurrences
of `models.probe`. Method replays below ran against a temporary config copy, never the live file.

| # | Finding | Evidence | Required before activation is accepted |
|---|---|---|---|
| F1 | **Activation/disable patch `agents.defaults` only.** `agents.entries.*` is never written. | `browser.js:2005-2021` (activate) and `:2060-2075` (disable); no `agents.entries` string in source or bundle. Temp-config replay with a synthetic `demo` provider resolved `zero=demo/demo-model`, `researcher=demo/demo-model`, **`operator=zero-gw/z-ai/glm-5.3-flash`** — the explicit Operator entry outranks defaults, so Operator is not activated. The live operator entry has exactly this explicit shape. | Emit one `config.patch` that also sets `agents.entries.<id>.model` for every agent that must follow the new route, and snapshot/restore those entries per §3.4a. State whether "Activate" retargets all agents or only default-inheriting ones. |
| F2 | **No post-activation health probe and no rollback.** Snapshot values are captured but never used to revert. | `browser.js:1995-1997` captures `savedPrimary/savedFallbacks/savedUtility`; `:1980-1992` is a pre-write `zero.providers.test` (catalog `/models` connectivity per §4.2); the patch at `:2017-2022` has no follow-up `models.probe`; `:2027-2031` only notifies and stops. The PM-01 report's "automatically rolls back if health verification fails" is not implemented. | After the write, run `models.probe` per affected agent; on failure re-patch the snapshot with a **fresh** `baseHash` and the nested `replacePaths` from §3.4a, and record both `changedPaths` sets. |
| F3 | **`auto` is not a sentinel.** Absent/empty primary resolves to `<none>`; literal `"auto"` resolves to model `auto`; `utilityModel: ""` disables utility. | Host replay: absent → `<none>`, literal `"auto"` → `auto`, empty → `<none>`. `browser.js:1657-1669` maps absent → UI `"auto"`; `:2317-2318` correctly maps the UI sentinel to `""` on save, but `disableProvider` (`:2048-2055`) writes `defaults.primaryModel`/`utilityModel` verbatim when they are not under the disabled provider. Temp replay in the absent state produced `agents.defaults.model.primary = "auto"`. | Map the UI sentinel to **omission** (or a `null` delete) on every write path, not only `saveDefaults`; add a regression test for the absent-state disable. |
| F4 | **`referencedBy` under-reports references.** Entry fallbacks and entry `utilityModel` are ignored. | `browser.js:1548-1558` enumerates defaults primary/utility/fallbacks and entry primary only. The live Operator entry carries a nemotron fallback; a provider used only there shows "Inactive", enable delete (`:2433`) and make disable a no-op (`:2039-2041`). Temp replay: demo bound only in the operator entry survives disable as `operator=demo/demo-model`. | Enumerate entry fallbacks and entry `utilityModel`; block delete on any reference; disable must unbind every reference or refuse and list them. |
| F5 | **Legacy provider routes coexist.** Core `/settings/model-providers` and `/settings/model-setup` remain reachable next to the plugin page. | Both strings are in `backend/node_modules/openclaw/dist/control-ui/assets/control-ui-core-DwX5Mpz4.js:2`. The plugin replacement surface is only `session-list \| composer \| workspace \| transcript \| tool-result` (`dist/plugin-sdk/control-ui.d.ts:168-190`); `registerPage`/`registerNavigation` add a page and cannot hide a core route. | Owner/senior decision: accept coexistence with one documented path (recommended while `upstream/` stays read-only) or an upstream change outside both lanes. No plugin-only fix exists. |
| F6 | **Test gap.** | `test/mount.test.mjs` (2 tests) covers registration, cards, test/discover, write-only key flow and `zero-gw` delete protection. It does not cover per-agent entry binding, probe/rollback, the `auto` sentinel, or reference enumeration. | Add tests for F1–F4; keep the existing two. |

#### F7 — the PM-01 build is on disk, not live (23:38 IST)

`plugins.controlUi.list` (read-only RPC) returns:

- catalog revision `9590177eb8f2abfee14f253505c9294f15f1c5acc0ed18ca861f48ed63d859ed`
- `zero-control-ui` revision **`1a1d2ce3a6a124e09a2105855946bac62f736b76646aec2d57e62f9ba9f662b2`**,
  `entryUrl` `/__openclaw__/plugins/control-ui/zero-control-ui/1a1d2ce3…/index.js`,
  `uiCapabilities: ["page","navigation"]`.

Fetching that `entryUrl` returns **200, 27,605 bytes**, sha256 `ecfd215f93a8765509a0dc14…`. The body
is byte-identical to the `dist/control-ui/347530c4…/index.js` (09:20:17) and
`40ce7cff…/index.js` (09:19:59) builds. It contains no `zero-models` page and no `PM: activate`
code. The manifest and disk now point at the **PM-01** build
`dist/control-ui/4c05f749…/index.js` (51,832 bytes, 23:14:09); the digest script reports that
build's Gateway revision as `c0f1eb0211bb91b1b497daccfdd0ce9d1b4fee478d55b241a69115309914968e`.

So the browser currently runs the pre-PM-01 UI. The PM-01 report's bundle hash is a build artifact,
not the served revision; its mount tests import the source and do not prove live behavior.
OpenCode must call `plugins.controlUi.reload` (or restart the Gateway) and then confirm the catalog
revision equals `c0f1eb…` before any PM-01 live acceptance. Note that the GEM-05 runbook's stored
`--expect 1a1d2ce3e8d2…` is **not** the live `1a1d2ce3a6a1…`; read the revision from the catalog
rather than a constant.

#### F8/F9 — PM-01 follow-up on the live 06d350d6 build (2026-10-24 00:00–00:10 IST)

The F1–F6 table above is the historical review of the 23:14 build. OpenCode rewrote the source
(23:58) and reloaded the catalog: `plugins.controlUi.list` now reports revision
**`06d350d6c181a2e9b52d2ee2fc4e7e70e5a46dd49bbdc99a522485e04536d074`**, entry 56,987 bytes,
identical to `control-ui-digest.mjs` for the current disk build. F1 (per-agent writes), F2
(rollback), F3 (no literal `auto` write) and F4 (entry fallback/utility enumeration) are addressed
in that source. Two blockers remain:

**F8 — the probe call cannot pass validation, so every activation self-rolls-back.** The activation
path sends `models.probe` with `{agentId:"zero", timeoutMs:30000}` and no `provider`
(`browser.js:2156-2159`; the live `06d350d6` bundle contains `models.probe",{agentId:"zero",timeoutMs:3e4}`).
The installed schema requires `provider` and rejects before the handler, so the call throws
`invalid models.probe params: must have required property 'provider'`; the catch sets
`probeFailed`, and the rollback patch at `:2170-2219` reverts the successful activation. Net effect
on the live build: **activation can never complete**. Also, only agent `zero` is probed; credentials
are per-agent (agent dir auth store), so `researcher`/`operator` are not covered. Required: send
`provider: <p.id>` and probe each changed agent (§4.2a).

**F9 — "Auto" is a fixed route, not inherited routing.** `hostDefaultRef` is the first available
model ref (`browser.js:2488`), and the "Auto (Host Default)" / "Auto Utility Model" options carry
that concrete value (`:2489-2491`, `:2505-2507`); Save writes it (`:2563-2566`, `:2387-2399`). The
live bundle matches. At the `agents.defaults` level there is nothing to inherit — the defaults are
the root; absence resolves to `<none>`, not to a host-chosen model. True inheritance exists only for
`agents.entries.<id>.model`: an omitted/`null` entry model falls back to defaults
(`inference-route-V4skSpqD.mjs:151`; `agent-scope-config-CtLA1__T.mjs` `resolveNativeModelPrimary`).
Required: remove the "Auto" option for defaults or relabel it with the concrete ref it will write;
offer an "Inherit defaults" control only on per-agent entries (write `null`). Do not call this
control "Auto".

No live probe was executed for this review; the only `models.probe` calls were the schema-rejection
and no-target/unknown-agent cases above, which fail before any credential use. No config, template
or secret changed (sha `103bcfc71b999c4a`, mtime 22:36:21).

#### F10 — activation reuses the defaults fallback chain for every role (verified 2026-10-24 00:32)

Confirmed on the live `966b6348` build. `browser.js:2060-2071` derives `nextFallbacks` from
`agents.defaults.model` only (previous defaults primary plus previous defaults fallbacks), and
`:2095-2135` writes that same list into `agents.entries.zero/researcher/operator.model.fallbacks`.
The minified live bundle has the identical shape: one variable is reused for
`defaults`, `zero`, `researcher` and `operator` (`entries:{zero:{…fallbacks:i},researcher:{…fallbacks:i},operator:{…fallbacks:i}}`).

Live inputs (read-only): defaults `model` = `zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b`
(string, no fallbacks); Operator entry = `{primary: zero-gw/z-ai/glm-5.3-flash,
fallbacks: [zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b]}`; Lead/Researcher have no entry model.
Regression replay (temp config with a synthetic `demo` provider, no network):

| Case | defaults-derived chain | Operator before | Operator after | Lost |
|---|---|---|---|---|
| A. live shape | `[nemotron]` | `glm, nemotron` | `demo, nemotron` | **`glm` (previous primary)** |
| B. Operator has a distinct fallback | `[nemotron]` | `glm, glm-4.6` | `demo, nemotron` | **`glm`, `glm-4.6`** |
| C. defaults absent | `[]` | `glm, nemotron` | `demo` | **both** |
| D. re-activating the current defaults model | `[]` | `glm, nemotron` | `demo` | **both** |

Affected paths on a successful activation: `agents.entries.operator.model.primary` changes away
from `glm` with no copy in any fallback; `agents.entries.operator.model.fallbacks` is replaced by
the defaults chain (A keeps nemotron only by coincidence); `agents.entries.zero.model` and
`agents.entries.researcher.model` are newly materialized with the defaults chain. The rollback path
restores all four scopes on probe failure, so this loss survives a **successful** activation.
Host replay of the patched temp config (`openclaw agents list --json`) resolves all three primaries
to `demo/demo-model`, confirming the patch applies; the fallback loss is structural in the written
entry objects.

Required: derive the chain per scope (entry effective primary + entry fallbacks; inherited defaults
only when the entry is absent), keep each scope's previous primary first, dedupe and drop the target
ref. Leaving absent entries absent also preserves inherited defaults fallbacks
(`agent-scope-BoJyyIgF.mjs:337-339`); if they are materialized, they need the defaults chain
explicitly. Add a regression test with a distinct Operator primary + fallback.

**Resolved — verified 2026-10-24 00:42 IST.** OpenCode added `deriveScopeFallbacks(scopeModel,
fallbackToModel)` (`browser.js:2060-2093`) and calls it once per scope
(`defaults`, `zero`, `researcher`, `operator`, `:2095-2098`); the activation patch uses those four
lists (`:2122-2155`). The helper treats a string entry as `[]` fallbacks, an explicit entry object
as its own fallbacks, and inherits the defaults chain only when the entry has no primary — matching
`resolveSelectedModelFallbacksOverride` (`agent-scope-BoJyyIgF.mjs:248-256`). The raw prior model
objects are snapshotted (`:2100-2119`) and restored exactly on rollback (`:2209-2245`).
`test/mount.test.mjs` now seeds distinct Lead (`lead-custom-model` + `lead-fb`) and Operator
(`glm-5.3-flash` + `nemotron-vl`) chains and asserts each role keeps its own previous primary at
index 0, that Researcher inherits defaults, and that rollback restores all four scopes with the four
`replacePaths`: **3/3 pass**. Live catalog confirms plugin revision
`9e02160e376f9fb92f09b38eb7d3628753ebfc32f97a9162b0c39e5a61fb2990` (catalog
`bde6631257e175e9b17ec71ef315e2499db0b667c821728925936cdac24281fa`). F10 is closed.

## 10. Activation record (2026-10-23 22:10–22:21 IST)

The owner instructed "Restart project". `ZERO_GATEWAY_KEY` is set at **User** scope; the Qoder
shell had a stale environment without it. The successor was launched from a fresh PowerShell that
read the User-scope value into the child environment only — the value was never echoed, written to
a file, or passed on a command line. `zero-gw` remained configured and live throughout.

1. **Restart 1 (PID 8240, 22:10).** Config and the third plugin path loaded; the plugin was
   discovered but `zero.providers.discover` was still unknown because the manifest had no
   `activation.onStartup` and the config had no explicit plugin entry.
2. **Manifest fix.** Added `"activation": { "onStartup": true }` to
   `openclaw.plugin.json`; `plugins.refresh` still did not import the plugin
   (`pluginIds: []`).
3. **Restart 2 (PID 9972, 22:18:42).** Still no registration: a path plus `onStartup` alone was
   not sufficient for this plugin.
4. **Explicit entry (decisive).** `config.patch` with
   `plugins.entries.zero-provider-manager.enabled: true` returned
   `changedPaths:["plugins.entries.zero-provider-manager.enabled"]`,
   `requiresRestart:false`, and hot-applied. The log then showed
   `registration requested: methods=zero.providers.discover,zero.providers.test` and
   `Plugin replacement applied: zero-provider-manager`. No restart was needed for this step.

**Required activation settings:**

- `backend/plugin/provider-manager/openclaw.plugin.json`:
  `"activation": { "onStartup": true }`.
- `backend/config/openclaw.json` (and the template):
  `plugins.entries.zero-provider-manager.enabled: true`.
- Third path in `plugins.load.paths`:
  `E:\zero\backend\plugin\provider-manager`.

**Restart shape (do not echo the key):**

```powershell
$env:ZERO_GATEWAY_KEY = [Environment]::GetEnvironmentVariable("ZERO_GATEWAY_KEY","User")
$env:OPENCLAW_STATE_DIR = "E:\zero\backend\.openclaw"
$env:OPENCLAW_CONFIG_PATH = "E:\zero\backend\config\openclaw.json"
Start-Process -FilePath "C:\Program Files\nodejs\node.exe" `
  -ArgumentList "E:\zero\backend\node_modules\openclaw\openclaw.mjs","gateway","run","--port","18789" `
  -WorkingDirectory "E:\zero" -WindowStyle Hidden
```

**Post-restart verification (in order):**

1. `openclaw gateway health` → OK.
2. Gateway log contains
   `[zero-provider-manager] registration requested: methods=zero.providers.discover,zero.providers.test`;
   `plugins inspect zero-provider-manager` → `activated:true`, `activationSource:explicit`.
3. `config.get` → `valid:true`, providers still `zero-gw`, and
   `configRevisionHash == appliedConfigHash`. Do **not** compare the root-file `hash` to
   `appliedConfigHash`; they are different hash domains.
4. `zero.providers.discover` with
   `{providerId:"zero-gw", baseUrl:"https://integrate.api.nvidia.com/v1", api:"openai-completions", apiKeyRef:{source:"env",provider:"default",id:"ZERO_GATEWAY_KEY"}}`
   → `status:"ok"` (live result: 85 models / 188 ms); response and logs contain no key.
5. `zero.providers.test` → `status:"ok"`; a bad-path test → `format`/HTTP 404 with unchanged
   config hashes.
6. `models.probe {provider:"zero-gw", agentId:"zero", timeoutMs:60000}` → record the actual
   status; do not block PM-01 on a slow probe if discovery is green.

**Stale plugin-lifecycle lease:** a forcibly stopped predecessor can leave
`core:plugin-lifecycle/global` held for up to five minutes. The successor can answer
`gateway health` while plugin activation is still deferred. Treat health as liveness only; check
the registration log or the method before declaring the plugin ready. Do not loop restarts to
"fix" it.

**Fallback:** if a future process fails at the plugin capture step, remove the explicit entry (or
the third path), restart, and keep `zero-gw` live. The plugin code and this contract remain valid;
only the live methods are unavailable until the path/entry is applied.

## 11. Open items for PM-01/PM-02

- **PM-01 activation is blocked on F1–F4 in §9** (per-agent entries, post-write `models.probe` +
  rollback, `auto` as omission, reference enumeration). F5 (legacy routes) needs an owner/senior
  decision; no plugin-only fix exists. F7 is resolved (live `06d350d6`); F8/F9 are resolved in the
  live `966b6348` build; F10 is resolved and verified in the live `9e02160e` build (per-scope
  chains, 3/3 focused tests, see §9 F10). PM-01's remaining item is senior acceptance, not a
  backend contract gap.
- **Startup activation is a two-part contract:** `activation.onStartup: true` in the manifest and
  `plugins.entries.zero-provider-manager.enabled: true` in config. A path alone leaves the methods
  unregistered even though `plugins inspect` says enabled. PM-01 must show "unavailable" rather
  than "connectivity failed" if the method is unknown.
- Confirm whether the UI should display "disabled" as "unreferenced" only, or add a UI-local
  disabled annotation. OpenClaw has no native provider `enabled` field; this contract uses the
  computed reference state.
- Choose the default replacement provider when disabling: `zero-gw` is the safe bootstrap choice
  until another provider has passed activation.
- Define the UI audit retention window; do not add a second transcript/store.
- **PM-02 capability probes are implemented offline** (`zero.providers.capabilities`, §4.6):
  text/streaming/tools/image, read-only, no model assignment; 15/15 tests; `openai-responses`
  (8/8, `pm04`), native `ollama` (7/7, `pm05`) and `anthropic-messages` (8/8, `pm06`) are native,
  so all four adapters are covered. The plugin is
  config-origin with no install record; `plugins reload` returned `record-missing` and then a stuck
  plugin-operation lock, so the supported activation path was the controlled restart. **The method
  is now live-registered** (restart 03:33 IST, verifier exit 0; §4.6). Four owner-authorized bounded
  probes of `zero-gw` / `z-ai/glm-5.3-flash` recorded: **text observed pass at 64** (4/32 →
  `empty_content`); **image 4 failed, 32 mixed, 64 observed pass once** (27.3 s, close to the
  whole-call budget). Neither text nor image is stable/verified. `streaming`/`tools` passed in
  every observed run (§4.6). Diagnostics (`httpStatus`/`category` only) are live; no retry was
  made and no binding changed. OpenCode may enable capability checks, show per-capability
  results/diagnostics, and must not relabel these as “unsupported” or “planned”; image/text
  evidence must reflect the latest probe rather than a permanent verified state.
- **PM-03 local-server mode is implemented offline** (§4.7): loopback HTTP needs no opt-in;
  private/`.local` hosts need explicit `allowPrivateNetwork:true` (http and https); all four
  adapters now have native probes, and local servers may use either their `/v1` OpenAI-compatible
  endpoint or native Ollama. No runtime install, model download or endpoint call was performed.
  The capability method is now registered; a real local-endpoint probe still requires an
  owner-provided running server and model.
- **PM-03 adapter/status UI contract is §4.7's "Adapter/status contract for the UI".** Backend
  coverage is all four adapters native. The live UI now matches it (`de6730fe…`): all four adapters
  show `[Probe supported]`, genuine `unsupported` shows `Unsupported (Probed)`, and no planned
  coverage copy remains (§4.7). UI mount tests are 8/8. OpenCode owns the UI code; Qoder recorded
  the closure read-only and made no `app/` edit.
- **Provider shape / SecretRef findings are §3.7.** The host rejects provider `name` (closed
  schema, `additionalProperties:false`) and per-call `allowPrivateNetwork` as a config key; UI must
  stop writing both. `env` and `store` SecretRef IDs share
  `^[A-Z][A-Z0-9_]{0,127}$`; the plugin validator already matches the host and now emits
  source-specific messages. `file`/`exec` remain intentionally unsupported by the plugin. OpenCode
  owns the UI patch-shape fix; no live config was written.
- **Confirmed UI defects (OpenCode-owned; Qoder made no `app/` edit).** (1) `deleteProvider` in
  `app/zero-control-ui/browser.js` deletes a store secret for the provider being removed without
  checking whether another provider references the same SecretRef, contrary to §3.6 and §6.7; shared
  secret IDs can therefore break the remaining provider. (2) `activateProvider` displays
  `testRes?.error?.message`, but `zero.providers.test` returns a completed provider failure as
  `{status, message}` with `ok:true`, so a failed pre-activation check can show no reason. Both are
  UI-source findings from the offline audit; no live config/secret was touched.
- If a provider base URL host changes, re-enter a store secret to update `allowedHosts`; do not
  attempt to read the old value.
- Keep `models.probe` timeouts explicit; the native probe is slower than `/models` and is not a
  substitute for discovery.

**Copy-paste resume prompt (post-registration):**

```
Qoder, resume the Provider Manager backend lane from the 2026-10-24 offline closeout. All four
adapters are native and offline-tested (pm02 15/15, pm03 9/9, pm04 8/8, pm05 7/7, pm06 8/8;
selftest 20/20, integration 5/5). Live registration was verified at 03:33 IST (three methods,
verifier exit 0); re-confirm read-only with `node backend/scripts/verify-provider-manager.mjs
--json` if the live state is in scope. Do not probe a provider, start a local runtime, download a model,
change bindings/secrets, or force a restart without owner authorization. The live UI copy is
current (`de6730fe...`). Remaining work is owner-gated: a real local/provider capability probe,
activation/rollback against a second provider. Preserve zero-gw and the
recorded utilityModel drift.
```

### Cross-lane status addendum - OpenCode, 2026-10-24 07:35 IST

This addendum corrects stale status lines in §11 without rewriting Qoder's historical analysis. It is
based on the current source at `app/zero-control-ui/browser.js`, the 12/12 mount suite, and the live
asset publication below.

- **PM-01 is no longer blocked on F1-F4.** Current source activates all three roles in one patch
  with per-role fallbacks and post-write probes/rollback (F1/F2), preserves/omits the utility
  sentinel on the relevant write paths (F3), enumerates entry fallbacks and utility references
  (F4), and patches only roles that reference a provider on disable. F5 (legacy `zero-gw` route
  retirement) remains an owner/Senior decision; no plugin-only fix exists.
- The earlier "Confirmed UI defects" bullet is superseded. The shared store SecretRef deletion
  guard, completed-test failure messaging, and legacy inline-key migration guard are fixed. A
  fourth defect, disable materialising an absent `utilityModel` as `""` and rewriting unrelated
  role shapes, is also fixed and covered by a focused regression test.
- The statements "UI mount tests are 8/8" and the live revision references `de6730fe…` /
  `9e02160e…` are historical. Current UI evidence: **12/12** mount tests; generation
  `6a87e072…` (JS **89,505 B**, CSS **27,639 B**, JS SHA-256 `FAA738F4…B35AE`); live plugin revision
  `5ccb4123…` (catalog `4063ad61…`), diagnostics `[]`; served JS/CSS HTTP 200 and served JS
  byte-identical to the local bundle (`FAA738F4…B35AE`).
- PM-01 remains **READY FOR REVIEW**. Live CRUD/activation/rollback against a disposable
  non-protected provider is still unverified; `zero-gw`, live config, bindings, and secrets were
  not changed by this UI work.
- The resume-prompt line below that calls `de6730fe…` the current UI copy is also historical and
  is superseded by the revision above.

## 12. Files

- `backend/plugin/provider-manager/openclaw.plugin.json` — manifest (id, `activation.onStartup`, config schema).
- `backend/plugin/provider-manager/package.json` — extension entry, host compat.
- `backend/plugin/provider-manager/index.mjs` — discovery/test, validation, redaction.
- `backend/plugin/provider-manager/selftest.mjs` — 20 offline checks (env/store SecretRef grammar
  included).
- `backend/plugin/provider-manager/integration.mjs` — 5 loopback integration checks.
- `backend/plugin/provider-manager/pm02.test.mjs` — 15 loopback checks for `zero.providers.capabilities`
  (including sanitized diagnostics, empty-body/chunked-limit handling, the all-native adapter
  invariant, text/image-64 and tools-32 budgets) and the read-only/rollback acceptance rules.
- `backend/plugin/provider-manager/pm03.test.mjs` — 9 loopback/security checks for local-server mode
  (loopback, private opt-in, no-key endpoints, adapter coverage, credential-header rejection).
- `backend/plugin/provider-manager/pm04.test.mjs` — 8 loopback checks for the `openai-responses`
  capability adapter.
- `backend/plugin/provider-manager/pm05.test.mjs` — 7 loopback checks for native Ollama
  `/api/chat` capability probes.
- `backend/plugin/provider-manager/pm06.test.mjs` — 8 loopback checks for Anthropic Messages
  capability probes (`x-api-key`, `text_delta`, `tool_use`, base64 image blocks, keyless).
- `backend/scripts/verify-provider-manager.mjs` — read-only post-restart checklist: health, plugin
  activation, behavioral method classification, corroborating registration log, config revision and
  bindings (no provider request, no key use; `--json`, `--log <path>`, `--no-log`).
- `backend/scripts/local-provider-check.mjs` — read-only check for an already-running local
  endpoint (host rules, discover/test, optional capabilities; no key value, no writes).
- `backend/scripts/test/local-provider-check.test.mjs` + `backend/scripts/test/fixtures/mock-openclaw-cli.mjs`
  — 12 dependency-free mock-CLI checks for the local check script (args, opt-in, capability subset,
  exit codes, pending method, secret-free output).
- `backend/scripts/test/verify-provider-manager.test.mjs` — 9 mock-CLI checks for the registration
  verifier (registered/unregistered/unknown response, health/config failures, plugin inactive,
  log evidence, `--json` shape).
- `backend/config/openclaw.json` — live config (provider bindings unchanged; third plugin path and
  explicit provider-manager entry applied).
- `backend/config/openclaw.json.last-good` — valid rollback snapshot.
- `backend/config/openclaw.json.invalid-20261023T121115` — preserved invalid pre-repair file.
- `backend/config/openclaw.template.json` — repaired template (no `providerRouting`/`open-gateway`;
  provider-manager path and enabled entry included).

Commands:

```bash
node backend/plugin/provider-manager/selftest.mjs
node backend/plugin/provider-manager/integration.mjs
node --test backend/plugin/provider-manager/pm02.test.mjs
node --test backend/plugin/provider-manager/pm03.test.mjs
node --test backend/plugin/provider-manager/pm04.test.mjs
node --test backend/plugin/provider-manager/pm05.test.mjs
node --test backend/plugin/provider-manager/pm06.test.mjs
node backend/scripts/verify-provider-manager.mjs   # read-only; exit 2 until the next restart
node backend/scripts/local-provider-check.mjs --base-url <local-url> --model <id>  # owner-run only
node --test backend/scripts/test/local-provider-check.test.mjs   # mock CLI, no network
node --test backend/scripts/test/verify-provider-manager.test.mjs # mock CLI, no network
node --check backend/plugin/provider-manager/index.mjs
# live (key resolved inside the Gateway; never printed)
openclaw gateway call zero.providers.discover --params '{"providerId":"zero-gw","baseUrl":"https://integrate.api.nvidia.com/v1","api":"openai-completions","apiKeyRef":{"source":"env","provider":"default","id":"ZERO_GATEWAY_KEY"},"timeoutMs":15000}'
```

No secret is printed by any command above. The only `sk-`-looking string in these files is the
explicitly fake `sk-live-super-secret-value` fixture in `selftest.mjs`; no `nvapi-` material
exists in the owned backend/report paths.

# White-label and single-chat consolidation

**Date:** 2026-10-25 (updated 2026-10-26)
**Owner:** OpenCode (frontend/integration)
**Status:** READY FOR REVIEW — not self-accepted
**Canonical local generation:** `1eaa41f4fba8e94782014b16a5ebf81f28d2abe5a01a970220ca32c1ac5943a7`
**Canonical local revision:** `5eeadb3adbbfdaf36de3f687eac8f6ba46c59d6373f7eb74718136570f348f79`
**Live served revision:** `5eeadb3adbbfdaf36de3f687eac8f6ba46c59d6373f7eb74718136570f348f79` (catalog `fe369f24…`; published and byte-identical — see §17)
**Live Gateway:** listener PID `21544` (restarted 2026-10-26 19:36 IST), loopback `127.0.0.1:18789`, `auth.mode:"none"`

---

## 1. Outcome

The native OpenClaw Control UI is the only product surface. Zero is the only
user-facing chat identity, and every requested capability is integrated **into
existing native screens** rather than duplicated by plugin pages.

| Requirement | Result |
|---|---|
| One user-facing chat identity/entry | Zero only. `/chat/zero` is Home; the sidebar agent card is a static Zero identity, not a switcher. |
| No specialist switcher/chat buttons/direct-chat route | `/chat/operator`, `/chat/researcher`, `/new?agent=…` hard-redirect to `/chat/zero`. Native `/agents` renders only the Zero card; Operator/Researcher cards are removed from the roster. The settings selector exposes only Zero on ordinary screens and is removed on specialist config screens. |
| Exactly one native Plugins surface | Native `/plugins` only. All three plugin-owned pages/nav (`team`, `models`, `about`) are gone. |
| Exactly one native Skills surface | Native `/skills` (and the native Plugins → Skills tab). No Zero-owned Skills page. |
| Provider management inside the existing provider/settings destination | The custom provider manager mounts **in place** on native `/settings/model-providers`. No second Models destination. |
| No community popup/card | Removed from the DOM on every route. |
| About Zero on the existing About route | Zero-branded content mounts in place on native `/settings/about`; the native “About Zero” entry remains visible. |
| No user-facing Debug/Logs | `/debug`, `/logs`, `/settings/debug`, `/settings/logs`, `/settings/updates` redirect to `/chat/zero`; backend diagnostics/logging untouched. |
| Zero branding in place | Title/topbar/chrome read Zero on every host screen; only third-party plugin metadata retains upstream names. |

No route or control is hidden by CSS alone. Blocked routes are removed from the
router by a hard document replacement; duplicate plugin pages are deleted, not
covered.

---

## 2. Architecture

### 2.1 Activation seams (`browser.js`)

The plugin registers **no SDK pages and no navigation** (`uiCapabilities: []`).
Activation installs exactly two seams:

1. `installLegacyRouteInterceptor(host)` — pure route policy + capture-phase
   click policy.
2. `installNativeSurfaces(host)` — in-place DOM integration on native screens.

Both return disposers and are removed on plugin deactivation.

### 2.2 Native in-place surfaces (`src/native-surfaces.js`)

| Native element | Integration |
|---|---|
| `<openclaw-model-providers-page>` | Mounts the Zero provider manager into the native page body (adds `zero-native-surface--models`). |
| `<openclaw-about-page>` | Mounts Zero About content into the native page body (adds `zero-native-surface--about`). |
| `.sidebar-agent-card` | Converted to a static Zero identity; `aria-haspopup`/`aria-expanded` removed, `aria-disabled="true"`, not focusable. |
| `a.agents-home__card[data-agent-id]` (Operator/Researcher) | Removed from the DOM. Zero keeps `/chat/zero` + "Open chat". Gateway agent definitions, tools, delegation, sessions, and history are untouched. |
| `openclaw-agent-select` options | Specialist options removed on ordinary settings screens; the selector becomes a static Zero-only configuration context. Removed entirely on `/settings/agents/<specialist>`, where an explicit `.zero-admin-config` notice states the screen is administrator configuration only and cannot start or open a conversation. |
| “Set Default” action | Removed on direct specialist configuration routes so an internal delegation agent cannot become the Gateway default through the ordinary UI. Zero’s own “Default” state and all other configuration controls remain. |
| "Pin to switcher" controls | Removed from native agent settings. |
| `.sidebar-shell__invite`, `.community-invite-card` | Removed from the DOM. |
| `[data-sidebar-entry^="plugin:zero-control-ui/"]` | Removed (stale plugin nav from a previous generation). |
| `.sidebar-footer-build` | Rebranded in place to “About Zero”, keeping its native `/settings/about` href. |
| `.topbar-brand` | Zero wordmark; upstream logo hidden and replaced with a “0” mark. |

A `MutationObserver` re-applies the transformations after host re-renders and
unmounts the in-place surfaces when the route changes away.

### 2.3 Route policy (`src/shared/routes.js`, `src/legacy-routes.js`)

| Incoming route | Target | Reason |
|---|---|---|
| `/chat/zero[/…]` | unchanged | The one product conversation |
| `/settings/model-providers` | unchanged (native page + in-place manager) | Single provider destination |
| `/settings/about` | unchanged (native page + in-place content) | Existing About route |
| `/settings/agents/<specialist>[/…]` | unchanged (administrator configuration only) | Direct config access retained; no roster/switcher entry and no chat action |
| `/plugin?plugin=zero-control-ui&id=models` | `/settings/model-providers` | Legacy plugin URL |
| `/plugin?plugin=zero-control-ui&id=about` | `/settings/about` | Legacy plugin URL |
| `/plugin?plugin=zero-control-ui&id=team` | `/chat/zero` | Deleted duplicate page |
| `/debug`, `/logs`, `/settings/debug`, `/settings/logs`, `/settings/updates` | `/chat/zero` | User-facing operational surfaces removed |
| `/chat/operator[/…]`, `/chat/researcher[/…]`, `agent:operator`, `agent:researcher` | `/chat/zero` | Specialists are internal |
| `/new?agent=<specialist>` | `/chat/zero` | No specialist session creation from the UI |
| Upstream marketing/community hosts | click blocked in product chrome | No upstream outbound surface; chat citations untouched |

Redirects use `window.location.replace(...)` (falling back to `assign`, then
history + `popstate`). A history-only change was proven insufficient: the host
kept rendering the blocked transcript until reload. The hard replacement makes
the native destination the only rendered surface and keeps the blocked URL out
of back/forward history.

---

## 3. Live verification (final served revision)

Headless Chrome, fresh profile, `127.0.0.1:18789`, one navigation per route,
7.5 s settle, request log captured via CDP.

| Requested route | Final URL | Title | External HTTP requests |
|---|---|---|---|
| `/chat/zero` | `/chat/zero` | Zero | 0 |
| `/agents` | `/agents` | Agents — Zero | 0 |
| `/settings/agents` | `/settings/agents/zero` (native) | Agents — Zero | 0 |
| `/settings/agents/zero` | `/settings/agents/zero` | Agents — Zero | 0 |
| `/settings/agents/operator` | `/settings/agents/operator` (admin config only) | Agents — Zero | 0 |
| `/settings/agents/researcher` | `/settings/agents/researcher` (admin config only) | Agents — Zero | 0 |
| `/settings/model-providers` | `/settings/model-providers` | Models — Zero | 0 |
| `/settings/about` | `/settings/about` | About — Zero | 0 |
| `/plugins` | `/plugins` | Plugins — Zero | 0 |
| `/skills` | `/skills` | Skills — Zero | 0 |
| `/chat/operator` | `/chat/zero` | Zero | 0 |
| `/chat/researcher` | `/chat/zero` | Zero | 0 |
| `/new?agent=operator` | `/chat/zero` | Zero | 0 |
| `/new?agent=researcher` | `/chat/zero` | Zero | 0 |
| `/new?agent=zero` | `/new?agent=zero` (Zero new session) | New session — Zero | 0 |
| `/debug` | `/chat/zero` | Zero | 0 |
| `/logs` | `/chat/zero` | Zero | 0 |
| `/settings/updates` | `/chat/zero` | Zero | 0 |
| `/plugin?plugin=zero-control-ui&id=models` | `/settings/model-providers` | Models — Zero | 0 |
| `/plugin?plugin=zero-control-ui&id=about` | `/settings/about` | About — Zero | 0 |
| `/plugin?plugin=zero-control-ui&id=team` | `/chat/zero` | Zero | 0 |

All 21 routes: **0** external HTTP requests, **0** community nodes, **0** stale
plugin nav, **0** plugin links, **0** “Internal specialist” labels, **0**
specialist chat controls, and **0** specialist links.

Per-route DOM evidence:

| Route | Evidence |
|---|---|
| `/chat/zero` | sidebar links only `/chat/zero`, `/chat/zero/zero-conversation-…`, `/chat/zero/new-chat-…`; agent card `aria-disabled="true"`, `tabindex="-1"`, no popup; 0 community nodes, 0 stale plugin nav, 0 plugin links; composer “Message Zero”. |
| `/agents` | exactly one `.agents-home__card[data-agent-id]`, id `zero`, href `/chat/zero`; Operator/Researcher cards absent from the DOM; 0 specialist chat links; “Manage agents” / “New agent” remain configuration-only. |
| `/settings/agents/zero` | `openclaw-agent-select` present with one option, "Zero"; trigger `aria-disabled="true"`, `tabindex="-1"`, no `aria-haspopup`, chevron `display:none`; 0 specialist options. Toolbar retains the native disabled “Default” state for Zero. |
| `/settings/agents/operator`, `/settings/agents/researcher` | `openclaw-agent-select` removed; visible `.zero-admin-config` notice naming the specialist and stating "Administrator configuration only … cannot start or open a conversation. Chat remains Zero."; 0 “Set Default” controls and 0 “Default” labels; other configuration controls (“New agent”, “Copy ID”, “Refresh”, identity/model/tools/skills/channels/automations/memory fields) remain; 0 specialist chat controls. |
| `/settings/model-providers` | `zero-native-surface--models` present, heading “Models & Providers”, provider cards rendered; selector options only “Zero”, trigger static (`aria-disabled="true"`, `tabindex="-1"`, chevron hidden). |
| `/settings/about` | `zero-native-surface--about` present, heading “About Zero”, body “Private assistant for local Gateway-backed work”, specialists described as “Internal delegation agents”; selector options only “Zero”. |
| `/plugins` | one native Plugins surface; chrome “Extend Zero with tools”; 0 plugin-owned links. |
| `/skills` | one native Skills surface; 0 plugin-owned links. |
| `/new?agent=zero` | native Zero new-session route; selector only Zero; no specialist option or link. |
| All blocked routes | land on `/chat/zero` with the Zero transcript rendered (not a specialist transcript); 0 specialist links/controls. |

Settings-context selector note: the native settings sidebar agent selector is
retained only as a **Zero configuration context** on ordinary settings screens.
It is a static, non-focusable label (chevron hidden, click blocked) and exposes
no specialist option. On a direct specialist configuration route it is removed
entirely and replaced by the explicit administrator-only notice. Gateway agent
definitions, tools, delegation, sessions, and history are unchanged.

Live click check: clicking `.agent-select__trigger` on
`/settings/agents/zero` and `.sidebar-agent-card__main` on `/chat/zero` left
`wa-dropdown.open === false` and `aria-expanded` absent in both cases; no menu
opened and no navigation occurred.

Read-only specialist-action check (no configuration action clicked, no config
written): `/settings/agents/operator` and `/settings/agents/researcher` rendered
**0** “Set Default” controls and **0** “Default” labels, with no agent selector
and a visible `.zero-admin-config` notice. The same screens retained “New
agent”, “Copy ID”, “Refresh”, and the identity/model/tools/skills/channels/
automations/memory configuration fields. `/settings/agents/zero` retained its
native disabled “Default” state and the static Zero-only selector.

Screenshots (final served bundle):
`reports/ui/screenshots/white-label/chat-zero.png`,
`model-providers.png`, `about.png`, `plugins.png`, `skills.png`, `agents.png`,
`settings-agents-zero.png`, `admin-operator-config.png`,
`specialist-redirect.png`.

---

## 4. Automated verification

| Check | Result |
|---|---|
| UI tests (`mount`, `product-path`, `product-surface`) | **43/43 pass, 0 fail** |
| Served-asset test (`verify-served`) | **1/1 pass** (44/44 including it) |
| Bridge tests (`app/test/bridge.test.mjs`) | **3/3 pass, 0 fail** |
| `tsc --noEmit` in `app/` | exit **0** |
| `node build.mjs` | generation `58fcb384…`; JS `90,533 B`; CSS `21,901 B` |
| Live revision digest (`control-ui-digest.mjs --expect`) | `0c076181…` → **match**, exit 0 |
| `sha256(index.js)` local | `7a9af60c75483394bd8436edaa3f6fd2c087aabd86e62669e915be8918e619fb` |
| `sha256(index.css)` local | `3b61445e21a45631bf1732d112400441d0060382b377091f1d6715c20153ec03` |
| Served `index.js` | HTTP 200, `90,533 B`, same SHA-256 → **byte-identical** |
| Served `index.css` | HTTP 200, `21,901 B`, same SHA-256 → **byte-identical** |

New/updated regression coverage asserts: native route predicates and legacy
mapping, hard-redirect behavior (including the `location.replace` seam),
specialist detection, `isSpecialistConfigRoute` classification, absence of
`registerPage`/`registerNavigation`, `uiCapabilities: []`, in-place native
surface mounting, deleted `src/pages/team.js`, About content/branding,
community-card removal, static agent card, specialist card/option removal,
the administrator-only notice, removal of the obsolete “Internal specialist”
label, removal of “Set Default” on specialist configuration screens while
Zero’s disabled “Default” and other configuration controls remain, CSS
selectors, and the absence of the CopilotKit product path.

---

## 5. Files changed

### Product source

- `app/zero-control-ui/browser.js` — activation installs only route + native-surface seams.
- `app/zero-control-ui/src/shared/routes.js` — pure route/legacy/specialist policy.
- `app/zero-control-ui/src/legacy-routes.js` — hard `location.replace` redirects, capture-phase click blocking, dispose.
- `app/zero-control-ui/src/native-surfaces.js` — in-place Models/About mounting, chrome cleanup, specialist card/option removal, static Zero-only settings context, administrator-only notice on direct specialist config routes, About-entry rebrand, title/topbar rebrand.
- `app/zero-control-ui/src/pages/models.js` — mounts at native `/settings/model-providers`; Team link → native `/settings/agents` (“Agents →”).
- `app/zero-control-ui/src/pages/about.js` — Zero About content mounted at native `/settings/about`.
- `app/zero-control-ui/src/constants.js` — removed dead `SURFACES` export after tracing imports.
- `app/zero-control-ui/src/pages/team.js` — **deleted** (duplicate page).
- `app/zero-control-ui/openclaw.plugin.json` — `uiCapabilities: []`, final generation pointer.
- `app/zero-control-ui/index.css` — Zero mark, static agent card, static Zero-only settings selector (hidden chevron), administrator-only notice, native-surface and About-entry styles, community fallback; removed Team and obsolete internal-specialist styles and Models/About sidebar hiding.

### Tests

- `app/zero-control-ui/test/product-surface.test.mjs`
- `app/zero-control-ui/test/mount.test.mjs`
- `app/zero-control-ui/test/product-path.test.mjs`
- `app/test/bridge.test.mjs`

### Build output

- `app/zero-control-ui/dist/control-ui/58fcb384…/index.js|index.css` (immutable generation; older generations retained).

### Documentation

- `reports/ui/white-label-and-single-chat.md` (this file)
- `TASK_BOARD.md`, `PROJECT_MEMORY.md`, `AGENT_CHAT.txt`

### Intentionally not changed

- `upstream/` — host implementation; not edited.
- `backend/`, `computer/`, `.zero-data/` — runtime, logging, audit, sessions, credentials, workspace untouched.
- `app/src/bridge/` — retained as a non-running, tested library per D-015; absent from the bundle.
- License/attribution files — retained.
- Provider/model config, secrets, bindings — untouched.

---

## 6. Retained OpenClaw identifiers (and why)

| Identifier | Where | Why retained |
|---|---|---|
| `openclaw/plugin-sdk` | `browser.js`, `index.js` | Host plugin API; required to load the contribution. |
| `openclaw.plugin.json` | plugin root, `build.mjs`, tests | Host manifest filename, not product copy. |
| `@openclaw/gateway-client`, `@openclaw/gateway-protocol` | `app/package.json`, bridge library | Pinned dependency contracts. |
| `__OPENCLAW_REDACTED__` | provider helpers | Gateway secret-redaction sentinel; changing it breaks credential safety. |
| `OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR` | bridge/runtime scripts | Environment contracts. |
| Upstream host names in `src/shared/routes.js` | blocklist | These strings exist to **block** upstream destinations. |
| `OpenClaw` in `app/NOTICE`, `THIRD_PARTY_NOTICES.md`, `REUSE-LEDGER.md` | legal/attribution | Required notices and provenance. |
| `@openclaw` authors and plugin descriptions on `/plugins` | native catalog metadata | Third-party plugin identity/attribution; product chrome (“Extend Zero with tools”) is rebranded. |
| CopilotKit/AG-UI references in historical docs/tests | regression evidence | Assert the removed path stays absent. |

---

## 7. Boundaries observed

- No provider call, chat message, or model request was made during UI verification.
- No config, secret, binding, or session was created, opened, deleted, or archived.
- The Gateway was restarted only to load the new immutable generation; the
  served revision and asset hashes were re-checked afterwards.
- Screenshots used a fresh headless profile over the existing loopback
  connection; no credential was read.

---

## 8. Owner-gated items

1. **PM-01 live `.set`/`.delete` activation** — requires an owner-authorized
   disposable provider and a live config window.
2. **CU-01** — real desktop observe/input/takeover proof on the designated
   isolated Windows target.
3. **Senior review** of UI-05/PM-01 and this consolidation pass. No
   self-acceptance is claimed.
4. Optional owner decision on `app/src/bridge/` (D-015 retained library) — keep
   or delete; not deleted here because it is tested and non-running.

### Exact next action

> Senior review of UI-05/PM-01. The UI-05 canonical local generation is
> `c32e839d…`; the live revision `0c076181…` still serves `58fcb384…`
> byte-identically, so publication is a separate owner-gated step. After review,
> authorize the PM-01 disposable-provider `.set`/`.delete` window and the CU-01
> isolated desktop run. Do not re-open specialist chat routes, restore specialist
> roster/switcher entries, or add plugin pages; integrate any new capability into
> the existing native screen. Direct `/settings/agents/<specialist>` remains
> administrator configuration only, must never expose a chat action, and must not
> offer “Set Default”.

---

## 9. Set Default invocation guard (Senior follow-up, 2026-10-25)

### 9.1 Change

The specialist screen already removed a rendered “Set Default” control, but the
guard was only a post-render sweep. Two hardening changes close the invocation
window without touching administrator configuration fields:

- Removal now sets `aria-disabled="true"` and `disabled` before detaching the
  control, so a click racing the observer cannot reach the native handler.
- The capture-phase check is now the exported
  `blockSpecialistDefaultAction(event, specialist)`. It matches the control by
  exact trimmed text or `aria-label` (`Set Default`, case-insensitive) and calls
  `preventDefault()` plus `stopImmediatePropagation()`. It is used by the native
  click/auxclick interceptor on both specialist routes.

No other configuration control, field, or native action is filtered.

### 9.2 Focused regression test

`app/zero-control-ui/test/product-surface.test.mjs` →
`specialist config pages cannot expose or invoke Set Default` now proves, for
both `/settings/agents/operator` and `/settings/agents/researcher`:

- a text control and an `aria-label` control are blocked before the native
  handler runs (0 native invocations, default prevented, propagation stopped);
- `Save` still reaches its native handler and is not prevented;
- `Default` is treated as a state label, not the Set Default action;
- with no specialist route (`null`), Zero keeps the native action;
- removal disables then detaches both Set Default variants while `New agent`,
  `Copy ID`, `Refresh`, and the disabled `Default` state remain.

Full UI suite: **43/43 pass**.

### 9.3 Build and local assets

- Generation `c32e839d00f0117f5eed8e7ae5135c404a8772a790b676fe34b6860a6bda9ad7`;
  JS 90,761 B, CSS 21,901 B.
- `sha256(index.js)` = `a7e3f5f12c1ad26836f8df8301419242eadb3001a4832d485bfb50b1af5ca680`;
  `sha256(index.css)` = `3b61445e21a45631bf1732d112400441d0060382b377091f1d6715c20153ec03`.
- Rebuild reproduces the generation and digest; source and dist manifests agree;
  `test/verify-served.mjs` exits 0.

### 9.4 Live read-only verification

Live plugin revision remains `0c076181471ec93330096329c9c33c1d5f6b28009bb1cbcb0b1d22d52378fffc`.
The served `/__openclaw__/plugins/control-ui/zero-control-ui/0c076181…/index.js`
is 90,533 B with SHA-256 `7a9af60c…`, byte-identical to local generation
`58fcb384…`; CSS is 21,901 B with SHA-256 `3b61445e…`. The new `c32e839…` build
is therefore local-only and was not published; no reload or restart was issued. See §10 for the paired
catalog confirmation, exact digest mapping, and asset URL probes.

DOM inspection without clicking any configuration action:

| Route | Result |
|---|---|
| `/settings/agents/operator` | 0 Set Default controls (text or aria-label); 0 Default labels; admin-only notice visible; `New agent`, `Copy ID`, `Refresh`, `Save`, `Reload Config` present. |
| `/settings/agents/researcher` | Same: 0 Set Default, 0 Default, notice visible, other configuration controls present. |
| `/settings/agents/zero` | No admin notice; native disabled `Default` state retained; no Set Default action exposed. |

The live `58fcb384…` build already enforces the behavior through the same
capture/removal seam; `c32e839…` adds the disable-before-detach hardening and the
invocation-level regression test. No config, secret, session, or binding was
written; no provider or chat call was made.

### 9.5 Status

UI-05 remains **READY FOR REVIEW**; not self-accepted. PM-01 and CU-01 remain
separate. Publishing `c32e839…` is an owner-gated UI action.

---

## 10. Revision Reconciliation — 2026-10-25 (pre-publication; superseded by §11)

This section records the pre-publication state. §11 supersedes its live revision and publication status.

The §9 pass compared the old live asset URL with a local generation without reconciling the two hash
schemes. This section records the corrected, independently checked state. No config, secret, session,
binding, provider, or Gateway lifecycle action was taken.

### 10.1 Two different hashes

| Value | Formula | Current value |
|---|---|---|
| Bundle generation | SHA-256 of minified JS + NUL + CSS | `c32e839d00f0117f5eed8e7ae5135c404a8772a790b676fe34b6860a6bda9ad7` |
| Gateway plugin revision | `control-ui-digest.mjs`: declaration + `uiCapabilities` + every asset name/length/body | `9591255bee4ad3ed31d8473b7aade6387c6ca8ba1acfa69cdb76c268e0d3247a` |

They are not interchangeable. The confirmed mappings are:

- `58fcb384…` → `0c076181471ec93330096329c9c33c1d5f6b28009bb1cbcb0b1d22d52378fffc`
- `c32e839d…` → `9591255bee4ad3ed31d8473b7aade6387c6ca8ba1acfa69cdb76c268e0d3247a`
- `7e2fdd10…` → `7217ddeb4e9fa10292249a15687bb75ecb35f9f22559c3f9fc220a6376e92f4a`

### 10.2 Current local state

- Source and `dist/` manifests both declare generation `c32e839d…`.
- `node backend/scripts/control-ui-digest.mjs --root app/zero-control-ui --expect 9591255b…` → **match**,
  exit 0.
- JS 90,761 B, SHA-256 `a7e3f5f12c1ad26836f8df8301419242eadb3001a4832d485bfb50b1af5ca680`;
  CSS 21,901 B, SHA-256 `3b61445e21a45631bf1732d112400441d0060382b377091f1d6715c20153ec03`.
- `npm test` → **43/43 pass**; `node build.mjs` reproduces `c32e839d…`;
  `node test/verify-served.mjs` → exit 0.

### 10.3 Current live state (paired read-only path)

The unpaired CLI fails closed:

```text
gateway connect failed: GatewayClientRequestError: device identity required
{"ok":false,"error":{"code":"NOT_PAIRED","details":{"code":"DEVICE_IDENTITY_REQUIRED"}}}
```

The established paired path uses the live runtime device state and succeeds:

```powershell
$env:OPENCLAW_STATE_DIR  = "E:\zero\.zero-data\fresh-workspace\runtime-state"
$env:OPENCLAW_CONFIG_PATH = "E:\zero\.zero-data\fresh-workspace\openclaw.json"
node backend/node_modules/openclaw/openclaw.mjs gateway call plugins.controlUi.list --params '{}' --timeout 45000 --json
```

Result (exit 0): catalog revision `b2ade665bdb7744bb8616139c178706434683b5ab3c98df0947929ba2673a263`;
the only plugin is `zero-control-ui` at revision `0c076181…`, with entry and style URLs under
`0c076181…`; `uiCapabilities: []`; `diagnostics: []`.

Asset probes:

| URL | HTTP | Bytes | SHA-256 | Meaning |
|---|---|---|---|---|
| `…/0c076181…/index.js` | 200 | 90,533 | `7a9af60c75483394bd8436edaa3f6fd2c087aabd86e62669e915be8918e619fb` | Byte-identical to local `58fcb384…` JS |
| `…/0c076181…/index.css` | 200 | 21,901 | `3b61445e…` | Byte-identical to local `58fcb384…` CSS |
| `…/9591255b…/index.js` | 404 | 9 | — | Local revision is not published |
| `…/c32e839d…/index.js` | 404 | 9 | — | Generation path is not an asset path and is not published |

A fresh browser reload requested only the `0c076181…` plugin assets. On
`/settings/agents/operator` and `/settings/agents/researcher` under that active revision: **0**
Set Default controls, **0** Default labels, the administrator-only notice is present, and
`New agent`/`Copy ID`/`Refresh`/`Save`/`Reload Config` remain.

### 10.4 Conclusion and remaining gate

- The active served revision is **`0c076181…`**, i.e. local `58fcb384…`. The strengthened capture guard
  (`blockSpecialistDefaultAction`, disable-before-detach) in `c32e839…`/`9591255b…` is **not served**.
- The older served build already hides Set Default on specialist routes, so the observed live DOM has 0
  controls; no live click/invocation test was performed because clicking configuration actions is
  prohibited.
- The local/source discrepancy is now explained but **not resolved in production**: the current build is
  unpublished. Publishing is owner-gated; no reload or restart was issued.
- UI-05 remains **READY FOR REVIEW** until the owner authorizes publication and an independent reviewer
  confirms the served revision matches `9591255b…`. Do not claim live completion before that.
- No config, secret, session, binding, provider, or Gateway state was written.

---

## 11. Single-Chat Consolidation Implementation (2026-10-25)

### 11.1 Discovered canonical surface and entry-point inventory

The one canonical conversation is the existing native chat at **`/chat/zero`**, including its
history/session subpaths `/chat/zero/<session>`. The native **New conversation** action
`/new?agent=zero` is an action inside that same interface; bare `/chat` is only an alias.

Owned source contains no chat page, composer, transcript, or message transport. The plugin contributes
only route policy and in-place native-surface cleanup. Duplicate/second-interface entry points found and
handled:

- `/chat/operator…`, `/chat/researcher…`, and encoded/nested forms such as `agent:operator`,
  `operator:main`, `agent:researcher:main`;
- `/new?agent=operator|researcher` and `agent:`-qualified variants;
- the legacy Zero `team` plugin page;
- Debug/Logs/Updates;
- specialist roster cards with “Open chat,” the sidebar agent switcher, specialist settings-selector
  options, “Pin to switcher,” and specialist “Set Default.”

Native agent configuration at `/settings/agents/<specialist>` remains administrator-only.

### 11.2 Implementation

- `src/shared/routes.js`: one `ZERO_CHAT_PATH = "/chat/zero"`; added `isBareChatRoute` and
  `isCanonicalChatRoute`; specialist matching now normalizes `agent:` prefixes and nested session keys,
  including URL-encoded forms.
- `src/legacy-routes.js`: bare `/chat` and every specialist chat/new form redirect to `ZERO_CHAT_PATH`;
  native `/chat/zero[/…]`, `/new?agent=zero`, Models, About, Plugins, Skills, and specialist admin
  configuration are untouched.
- `src/native-surfaces.js`: exported `removeSpecialistCards`, which removes every non-lead roster card
  (including its “Open chat” link) while preserving Zero’s `/chat/zero` card. Added
  `isSpecialistChatEntryControl` / `removeSpecialistChatEntries`, which remove chat links, “Open chat,”
  “Start chat,” “New conversation,” and message controls from specialist administrator pages; the
  capture-phase click guard blocks the same controls if the host re-renders them. Only DOM/policy is
  touched; no worker definition, session, config, secret, or provider state is modified.

### 11.3 Tests and build

- UI suite: **45/45 pass**. New coverage:
  - `specialist roster cards and admin pages expose no second chat entry`;
  - `owned source converges on one canonical chat route`;
  - expanded route/interceptor matrix for bare `/chat`, encoded `agent:`/nested specialist paths,
    `/new?agent=agent%3Aresearcher`, canonical `/chat/zero/main`, `/new?agent=zero`, and unchanged
    `/settings/agents/operator`.
- Bridge suite: **3/3 pass**.
- Bundle generation `bc41578f5e4d296310a5ff3944168183733972cab15a7a75c7cbb4ac2897240c`; JS 91,374 B,
  SHA-256 `27185b65f600116e32688cc352be195e9361306de170e28b9dfcc21518c3ce54`; CSS 21,901 B, SHA-256
  `3b61445e21a45631bf1732d112400441d0060382b377091f1d6715c20153ec03`.
- Local Gateway revision `12355b73f7a570c068f10a376e45bb83d32c7031b6f4c76d14a536185b22125c`
  (`control-ui-digest.mjs` match); `verify-served.mjs` exit 0; source/dist manifests agree.

### 11.4 Publication

Published through the established paired Control UI path
(`plugins.controlUi.reload {pluginId:"zero-control-ui"}`), not a Gateway restart. Readback:

- catalog `bdd329542677bd8779a2cacc98dddfa91bf88746fbfb2be438a99efcc7d8c659`;
- active `zero-control-ui` revision `12355b73…`, matching the local digest;
- served JS 200 / 91,374 B / SHA-256 `27185b65…`, CSS 200 / 21,901 B / SHA-256 `3b61445e…`, both
  byte-identical to the local generation.

### 11.5 Live read-only route/DOM check

No model prompt, configuration action, or write was performed.

| Route | Result |
|---|---|
| `/chat/zero` | Canonical Zero chat; composer present; only `/chat/zero[/…]` session links and `/new?agent=zero`; Zero static agent card; 0 specialist links; served assets under `12355b73…`. |
| `/chat` | Redirects to `/chat/zero`; same composer and Zero identity. |
| `/chat/operator`, `/chat/researcher` | Final URL `/chat/zero`; no specialist heading, composer or session links remain specialist; only Zero sessions. |
| `/agents` | Exactly one roster card, `zero`, href `/chat/zero`, text includes “Open chat”; 0 Operator/Researcher cards. |
| `/settings/agents/operator`, `/settings/agents/researcher` | 0 chat links/controls and 0 composer; administrator-only notice visible; `New agent`/`Copy ID`/`Refresh`/`Save`/`Reload Config` remain. |

Backend contract unchanged: read-only `config.get` shows agent entries `zero`, `researcher`, `operator`;
defaults model `nvidia/z-ai/glm-5.3-flash`; provider `nvidia`; config revision and applied hash equal.
Live config mtime remains `2026-10-25 18:09:43`.

### 11.6 Limitation and status

Live navigation to `/new?agent=operator` was intentionally not performed because it could create a
session; the redirect is covered by the route/interceptor tests. Direct specialist settings remain
administrator-only. UI-05 remains **READY FOR REVIEW**; not self-accepted. PM-01 and CU-01 remain
separate.

---

## 12. Zero-to-Specialist Delegation Trace and Offline Contract (2026-10-25)

This pass traces the existing Gateway orchestration and adds offline contract coverage. It does **not**
send a model prompt, call a provider, or trigger a computer action.

### 12.1 Live configuration edges (read-only)

`config.get` confirms:

| Agent | Role in delegation | Configured edge |
|---|---|---|
| `zero` | Sole user-facing assistant and orchestrator | `subagents.allowAgents: ["researcher","operator"]`, `requireAgentId: true` |
| `researcher` | Hidden research worker | `subagents.allowAgents: []` (leaf) |
| `operator` | Hidden computer/operation worker | `subagents.allowAgents: []` (leaf) |

Zero's tool profile is `coding` with `exec.mode:"ask"`; Researcher denies `write`, `edit`,
`apply_patch`, `exec`, `process`, `browser`, and `computer`; Operator allows `computer` with
`exec.mode:"deny"`.

### 12.2 Existing orchestration path

The installed OpenClaw source/docs define the path; no Zero-owned transport is involved:

1. Zero calls `sessions_spawn` with an explicit `agentId` (`researcher` or `operator`), a task, and a
   hidden one-shot run (`visible:false`, `mode:"run"`, `context:"isolated"`,
   `expectsCompletionMessage:true`, `completionTarget:"parent"`).
2. `sessions_spawn` returns `{status:"accepted", runId, childSessionKey}` immediately; the child runs
   in a hidden session parented to Zero.
3. Zero calls `sessions_yield` when it needs results before answering. The child's completion
   (`ok`, `error`, `timeout`, or `unknown`, plus its latest visible result) is delivered as an internal
   requester turn to the **original Zero session**. WebChat completion stays in-session
   (`deliver=false`), so the result appears in `/chat/zero`, not a second chat surface.
4. Zero synthesizes the result and replies in the same parent conversation. Child sessions are hidden;
   no specialist route, composer, or session link is created.

Source references: `upstream/openclaw/docs/tools/subagents/tool-reference.md` (`sessions_spawn`,
`sessions_yield`), `.../announce.md` (completion delivery, private parent completion, statuses),
`.../operations.md` (accepted receipt), and `reports/gemini/agent-contract-intake.md`.

### 12.3 Actual production routing artifacts

Read-only inspection of the production Zero workspace (`AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`)
initially found no explicit routing rule. §13 records the policy added to the maintained
`AGENTS.md`; worker choice still depends on the model following that policy.

`app/zero-control-ui/test/delegation-gateway.test.mjs` tests the actual artifacts and the installed
Gateway seam:

- It reads the **repository-owned production config template** projection (agents/defaults/entries only; no providers, credentials,
  or messages) and asserts the Zero/Researcher/Operator edges and tool perimeters above.
- It imports the installed OpenClaw `resolveSpawnAdmission` implementation, not a copied policy, and calls
  it with a read-only `countActiveRuns: () => 0` stub to avoid touching the run registry.
- Results: Zero → Researcher/Operator accepted with `spawnDepth:1`; Zero → Zero, Zero → missing,
  Researcher → Operator, and Operator → Researcher rejected (`agentId is not allowed`); an omitted target
  is rejected by `requireAgentId`.
- A second test reads the actual production instruction files and records, via test diagnostic, that they
  contain no explicit worker-routing text. This is an observation, not a routing guarantee.

These tests prove **configured admission enforcement**, not model choice.

### 12.4 Fixture-only simulation

`app/zero-control-ui/test/delegation.test.mjs` is explicitly labeled fixture-only. Its
`planZeroDelegation`, `spawn`, `yieldTurn`, `complete`, and `deliver` functions are test-local and prove
only the fixture's completion/status shapes. They are not production routing evidence and add no message
bus. Four fixture tests cover result return, child error, timeout/retry, and policy rejection so the
completion contract remains documented, but they must not be cited as live delegation proof.

### 12.5 Existing sessions preserved

Read-only `sessions.list`: 6 sessions total, no active runs — Zero 4 (main plus dashboard/thread
sessions), Researcher 1 (`agent:researcher:main`), Operator 1 (`agent:operator:main`). The two direct
specialist sessions still exist in Gateway history but have no UI entry: specialist chat routes redirect
to `/chat/zero`, `/agents` renders only Zero’s card, and specialist admin pages have zero chat controls.

### 12.6 Live UI recheck

Active revision remains `12355b73…`; served assets are unchanged. `/chat/zero` exposes only
`/chat/zero[/…]` session links plus `/new?agent=zero` and 0 specialist links/composers. `/chat/operator`
lands on `/chat/zero` with no specialist heading. `/agents` has exactly one card (`zero`,
`/chat/zero`). `/settings/agents/researcher` has 0 chat entries, no composer, the administrator-only
notice, and the other configuration controls. No prompt or write occurred.

### 12.7 Evidence layers

| Layer | Evidence | Status |
|---|---|---|
| UI surface | Live revision `12355b73…`; canonical `/chat/zero`; specialist routes redirect; no specialist composers/links/selectors | **Proven live** |
| Configured delegation | Actual live config edges/tools + installed `resolveSpawnAdmission` tests (2) | **Proven offline against production artifacts** |
| Completion mechanics | Fixture-only `delegation.test.mjs` (4) | **Fixture coverage only; not production proof** |
| Model selection / end-to-end | No authorized live Zero prompt/child run | **Not proven** |
| Existing state | 6 sessions preserved; no config/secret/session write | **Verified read-only** |

UI suite: **51/51 pass** (45 surface + 4 fixture + 2 production-artifact); bridge **3/3**.

### 12.8 Bounded live verification plan (authorization required)

Do not execute without explicit owner authorization for that run. The plan uses harmless research and
read-only desktop observation; no input actions, outbound messages, config changes, or credential reads.

**Preconditions**

- Active revision `12355b73…`, `/chat/zero` is the only open conversation, no active runs.
- Record `sessions.list` count/keys and config revision before each request.
- One request at a time; stop on any provider/computer refusal, timeout, or unexpected config/session
  change.

**Request A — research worker**

Prompt in `/chat/zero`:

> Research the title and URL of the OpenClaw subagents documentation page. Do not modify files. Return a
> short summary and the URL.

Expected evidence: only `/chat/zero` renders; Zero replies in that session; `sessions.list` shows a new
hidden child with `agentId:"researcher"`, `parentSessionKey:"agent:zero:main"`, `spawnDepth>=1`; the child
result appears in Zero's reply; the new child is not user-visible and no specialist link/composer appears.
Record child run/session key and status only.

**Request B — read-only computer observation**

Prompt in `/chat/zero` (only after explicit computer-tool authorization):

> Observe the current desktop without clicking, typing, or changing anything. List the visible window
> titles. Read-only observation only.

Expected evidence: a hidden `operator` child parented to Zero; only observation actions; no hold/input
side effects; result returns to Zero; no specialist UI. Stop immediately on any input action or hold
conflict.

**Stop/abort rules**

- Any prompt that would send external messages, write files/config, read credentials, or perform desktop
  input is out of scope.
- If the model chooses the wrong worker or no worker, record that as a model-routing failure; do not alter
  config or instructions to force a pass.
- One attempt per request; no automatic retries without a new owner authorization.
- UI-05 remains **READY FOR REVIEW** until the live evidence is independently reviewable.

PM-01 and CU-01 remain separate; no self-acceptance.

---

## 13. Production Routing Policy and Live-Attempt Result (2026-10-25)

### 13.1 Authoritative instruction artifact

The maintained source of Zero's production instructions is the live agent workspace file
`E:\zero\.zero-data\fresh-workspace\agents\zero\AGENTS.md` (the path resolved by
`agents.entries.zero.workspace`). There is **no project-owned AGENTS template**; `BOOTSTRAP.md` is a
first-run ritual and `backend/config/openclaw.template.json` contains only configuration, so no second
prompt store or duplicated policy was created.

Added one `## Delegation` section (lines 86–91):

- research / web-file investigation / source gathering → existing `researcher` subagent;
- computer or desktop-operation → existing `operator` subagent;
- ordinary conversation / planning / synthesis stays with Zero;
- workers are hidden one-shot subagents (`visible:false`, `mode:"run"`, `context:"isolated"`,
  `expectsCompletionMessage:true`, `completionTarget:"parent"`), and Zero returns the synthesized result
  in the same Zero conversation.

`BOOTSTRAP.md`, `SOUL.md`, `IDENTITY.md`, and `USER.md` were not changed; the policy exists once.

### 13.2 Tests against the actual artifact

`app/zero-control-ui/test/delegation-gateway.test.mjs` now reads that actual `AGENTS.md` and asserts the
policy contains both worker routes, the Zero-stays-ordinary rule, hidden-run/`completionTarget` behavior,
and result return to the same Zero conversation. It also asserts the bootstrap/persona files do not
duplicate the policy.

- Full UI suite: **51/51 pass** (45 surface + 4 fixture-only + 2 production-artifact).
- Gateway admission remains tested against the repository-owned production config template and installed `resolveSpawnAdmission`:
  Zero→Researcher/Operator only; self/missing/leaf spawns refused.

### 13.3 Live attempt — blocked before send

The owner-authorized research request was composed in the canonical `/chat/zero` (`agent:zero:main`)
conversation:

> Research the title and URL of the OpenClaw subagents documentation page. Do not modify files. Return a
> short summary and the URL.

The native composer displayed **“Chat model: No models available”** and the send control remained
disabled even with the text present. Per the stop rules, no send was forced, no provider call was made,
and the desktop-observation request was not attempted.

Post-check: `sessions.list` remains 6 sessions, 0 active runs; no new child or specialist session; config
mtime remains `2026-10-25 18:09:43`. The text remains only as an unsent draft; no transcript turns were
added.

### 13.4 Evidence status

| Layer | Status |
|---|---|
| Policy in maintained Zero `AGENTS.md` | **Added and artifact-tested** |
| Configured gateway admission | **Proven offline against production config + installed implementation** |
| Fixture-only completion shapes | **Fixture coverage only** |
| Live research → hidden Researcher → Zero result | **Blocked before send by “No models available”** |
| Live read-only Operator observation | **Not attempted (first run did not complete)** |

UI-05 remains **READY FOR REVIEW**; live end-to-end delegation is not proven. The next prerequisite is
resolving the chat-model availability state, then rerunning the bounded plan with fresh authorization.
PM-01 and CU-01 remain separate; no self-acceptance.

---

## 14. Durable Policy Source, Sync Tests, and Live Diagnosis (2026-10-25)

### 14.1 Repository-owned policy and sync

- Canonical policy: `backend/agents/zero/delegation-policy.md` (version-controlled, single managed
  section).
- Sync path: `backend/scripts/sync-zero-instructions.mjs`, exposed as
  `npm run sync:zero-instructions -- --config <openclaw.json>`.
  It merges the policy between `<!-- BEGIN ZERO MANAGED DELEGATION -->` and
  `<!-- END ZERO MANAGED DELEGATION -->`, preserves all owner-authored content outside the block,
  writes atomically, is idempotent, supports `--check`, and refuses malformed/duplicate markers without
  writing.
- The live Zero `AGENTS.md` now contains the managed block (lines 126–133); unrelated owner content was
  preserved. The manual unmarked section was removed first, so there is exactly one policy section.
- No second prompt store: `BOOTSTRAP.md` remains first-run ritual, persona files are unchanged, and the
  runtime still reads `AGENTS.md`.

Hermetic tests:

- `backend/scripts/test/sync-zero-instructions.test.mjs` → **5/5 pass** in temporary directories:
  policy content, first merge, idempotent second merge, block update preserving surrounding text,
  malformed/duplicate marker refusal, config-based workspace resolution, and `--check` no-write.
- `app/zero-control-ui/test/delegation-gateway.test.mjs` now reads the repository policy and
  `backend/config/openclaw.template.json`; it no longer reads `.zero-data/` and has no skips.
- Full UI suite: **51/51 pass**.

### 14.2 “No models available” diagnosis (read-only)

- RPC `models.list {agentId:"zero"}` returns `nvidia/z-ai/glm-5.3-flash`, `available:true`.
- `agent:zero:main` reports `model:"z-ai/glm-5.3-flash"`, `modelProvider:"nvidia"`,
  `status:"timeout"`, a prior run error about the model not responding before timeout, `hasActiveRun:false`,
  `activeRunIds:[]`, and `sendDisabledReason:null`.
- The UI still labels the model control “Chat model: No models available”. A read-only page reload made
  the Send control enabled, but clicking Send did not create a run: `updatedAt`/`lastActivityAt` stayed
  unchanged, `sessions.list` remained 6 with 0 active runs, and no child session appeared.
- Console errors are unrelated 404s (owner avatar, workspace icon, `/chat/zero` resource).
- No provider probe, credential read, config/model binding change, or Gateway restart was performed.

### 14.3 Exact live outcome

The authorized research request was never sent; the desktop-observation request was not attempted.
Live end-to-end delegation remains **unproven**. The draft remains unsent in the composer. Config mtime
is still `2026-10-25 18:09:43`.

The next prerequisite is a UI/session model-availability fix (outside this change) or an owner-approved
transport that uses the same `agent:zero:main` session without changing config; then rerun one research
request and verify a hidden Researcher child parented to `agent:zero:main` and the result in the same
conversation.

UI-05 remains **READY FOR REVIEW**; no self-acceptance. PM-01 and CU-01 remain separate.

---

## 15. Computer-control hold bar on `/systems` and live closeout (2026-10-26)

### 15.1 Scope

The existing native Systems route is unchanged. Zero injects one hold bar above the native
`.systems-desktop` / Desktop viewer; it adds no route, page, navigation entry, second stream, or
transcript. The bar uses `zero.computer.control` with canonical `action` and `controlLeaseId`
only (no `leaseId` alias) and renders explicit `loading`, `unknown`, `unavailable`, `free`,
`held-this-client`, and `held-other` states. Ownership is never inferred from a click.

### 15.2 Live states exercised through the actual Control UI

- Free: one bar, `Take control` enabled, `Return control` disabled, scope
  `Global hold - all sessions`, text requires a fresh desktop capture before agent input.
- Take: `held-this-client`; `Return control` enabled; text states agent input is refused while
  the human holds control and observation remains available.
- Second tab: `held-other`; Take and Return disabled; text says the hold is global and affects
  all sessions.
- Release: both tabs converge to `free`; the text requires a fresh capture before the next
  action.
- Owner tab closed without Release: backend released the lease (`held:false`,
  `resumeSnapshotRequired:true`, `releasedByDisconnect` 1 -> 2, `connection-closed` audit rows);
  the surviving tab converged to `free`. No stale lease was retained.

### 15.3 Defect found and fixed

The first live build re-mounted the bar on every observer tick because the reuse check compared
the bar's parent with the Desktop element, while the bar lives inside a wrapper. The remount
produced more mutations and blocked the `/systems` main thread. Fixed by reusing only an
attached, populated wrapper (`canReuseComputerHold`) and ignoring mutations inside
`.zero-computer-hold-host`. Offline regression added; the page now evaluates normally.

### 15.4 Build, tests, and live publication

- Generation `56b1d59f405bcdbce8eb957a984b51ddf5bba675201b395c2710980e37d8f4c8`;
  `index.js` 100,327 B, sha256 `ddb9ae528aff697d44816198c1da2b1925822053b966f0cea9bcbca28d9a7422`;
  `index.css` 24,114 B, sha256 `6affcc8dfa5f356e34194381a87dcd2abe6f9948c9ccac766229e8f439053004`.
- UI suite **71/71** (including 20 focused hold tests); `tsc --noEmit` exit 0; backend selftest
  **111/111**.
- Gateway listener PID `17492` (launcher `6840`), loopback `127.0.0.1:18789`, plugin revision
  `3d62356d71561fc92587b6d1a2e48d6e77d4ff81bdf15b50b4e46dc1a05ddbc4`, catalog
  `926316ec9c98d4779da8b5f5787d32ac1bd18e48b5f7ff1478d728dec0c0cbaa`.
  Served `index.js` is byte-identical to local (same sha256, 100,327 B).

### 15.5 Not claimed

- Agent refusal under hold (`computer-hold:human-control`) and post-release
  `computer-hold:stale-frame`: **offline-tested only**. The `computer` tool is hidden when the
  model lacks vision; the configured route is text-only, and the two `text+image` catalog
  entries failed at the provider (404 / 410). No model route or config was changed.
- Live desktop view: still blocked by the missing loopback authenticated RFB server on port
  5900; the native panel shows "Set up a desktop server". No VNC was installed.
- Upstream `take_control`, frame hashing, or a second transport: not claimed.

UI-05 remains **READY FOR REVIEW**; no self-acceptance. PM-01 and CU-01 remain separate.

---

## 16. 2026-10-26 live re-audit: composer resolved, provider still blocks replies

This section corrects §14.2/§14.3 without editing them (history preserved).

### 16.1 "No models available" is resolved

`/chat/zero` now shows `Chat model: z-ai/glm-5.3-flash`, the composer placeholder is "Message Zero",
Send becomes enabled after typing, and `chat.send` is accepted (runId
`0046f031-b45f-4d2f-a93f-350054e5606c`). Stop generating produced "Interrupted" and the session
recorded `abortedLastRun:true` at that moment (now `false` after the rewind).
`models.list {agentId:"zero"}` still returns the model with `available:true`. The stale label was a
client state issue, not a missing model.

### 16.2 Replies still do not complete (external provider)

- `POST /v1/chat/completions` `z-ai/glm-5.3-flash`: abort at 45,005 ms (non-stream); **no first chunk
  at 30,011 ms** with `stream:true`. `z-ai/glm-5.3`: abort at 45,016 ms.
- `GET /v1/models` is 200 with 85 models, so the account/key path is fine; the model itself is not
  producing tokens.
- Gateway run error matches: "The model did not produce a response before the model idle timeout".
- No route, credential, binding, or config was changed. Token-level streaming and tool/delegation
  progress therefore remain **unproven live** even though the transport and UI states are wired.

### 16.3 Test turn removed with the native rewind

The bounded send left one user turn and the core continuation prompt it triggered. Removed with
`sessions.rewind { sessionKey:"agent:zero:main", entryId:"e083011f-1246-4857-92bf-201ad7cce7cf" }`,
which returned `editorText` and took the session from 80 to 77 raw messages. The active branch is now
`c74eae58-d62a-4fbc-81bd-75cd3aa4ac4b` (63 branch messages); the superseded
`11e07b41-2c51-49a3-a598-d36c086bd032` branch (66 messages, including the test turn) remains
`active:false` and switchable. `chat.history` exposes 61 of 77 display messages with `hasMore:true`;
the active transcript contains `hello` and no `ZERO-CHAT-OK`. No other session, config, or transcript
was touched. Permanently pruning the inactive test branch would be a separate destructive decision.

### 16.4 Route audit (live, 2026-10-26)

`/chat/zero`, `/`, `/agents`, `/plugins`, `/automations`, `/dashboards`, `/systems`,
`/settings/about`, `/settings/model-providers`, `/settings/agents/zero`,
`/settings/agents/operator`, `/settings/agents`, `/settings/skills`, `/settings/mcp`,
`/settings/memory`, `/settings/approvals` all render Zero chrome with no specialist chat entry and no
visible upstream branding. `/settings/agents` redirects to `/settings/agents/zero`; the only
"Operator" text on `/settings/mcp` is the host MCP operator role, not the specialist agent. The
host-owned hidden `.mount-fallback` block still contains "OpenClaw Control UI"; it is `display:none`
and only appears if the app bundle fails to start, in which case no plugin code can rewrite it. Left
as a documented host limitation.

### 16.5 Build / test evidence

UI **71/71**, `tsc --noEmit` exit 0, backend selftest **111/111**. Generation
`56b1d59f405bcdbce8eb957a984b51ddf5bba675201b395c2710980e37d8f4c8` is served as plugin revision
`3d62356d71561fc92587b6d1a2e48d6e77d4ff81bdf15b50b4e46dc1a05ddbc4` (catalog
`926316ec...`) and the served `index.js`/`index.css` are byte-identical to the local files.

### 16.6 Transcript view on a fresh load (host-owned initial-scroll quirk)

An interim check after the rewind reported the `/chat/zero` transcript as "3 empty 120 px rows". That
was a measurement artefact, not data loss:

- `chat.history {sessionKey:"agent:zero:main"}` returns 91,542 B / 61 of 77 display messages; the DOM
  rows contain the full `chat-text` nodes (2,688 characters of `textContent`), and a new tab shows the
  "Show earlier" boundary.
- The defect is the initial scroll position: a fresh tab has `.chat-thread` `scrollTop:0`,
  `scrollHeight:3695`, client height 518, and only the tail rows rendered at `top 3305-3545`. The
  viewport is therefore blank even though the rows are populated; `innerText` is empty because the
  rows use `content-visibility:auto`.
- Clicking any position-rail marker (or pressing End) re-syncs the virtualizer: 7 rows render, `hello`
  appears, and the latest provider-timeout notice is visible. The last three messages are failure
  notices, so the tail alone looks sparse even when rendered.
- The "Show earlier" button is enabled but did not fetch the 16 oldest display messages
  (`hasMore:true`, `nextOffset:76`); the user-facing history starts at `hello`, which is complete for
  the conversation.
- This is host chat code: Zero injects no chat renderer, and the Zero stylesheet contains no `.chat-*`
  selectors. Safe next step (owner-gated): a small Zero helper that scrolls the canonical thread to
  the latest message once on first mount, followed by a rebuild and Gateway reload. Not implemented or
  served in this pass; no chat code was changed.

### 16.7 B5 seam audit - 2026-10-26 15:27 IST

**Decision: host-owned; no supported Zero plugin/UI seam. No code changed.**

- `ControlUiHost` apiVersion 1 (installed `openclaw` 2026.10.6) exposes
  sessions/agents/navigation/ui/components/request/onEvent/subscribe, but no chat, transcript, or
  scroll method. `onEvent` is for Gateway events, not DOM scroll.
- The only transcript hook is `ui.registerReplacement("transcript", ...)`; using it would replace the
  native chat renderer, which the single-chat/product constraints forbid.
- The host's scroll/virtualizer state (`chatHasAutoScrolled`, `chatLastScrollTop`,
  `transcriptScrollTop`, `handleTranscriptScroll`) is private to the host Lit controller. A plugin
  cannot set it.
- Fresh-tab re-measurement (tab opened 15:14 IST): `.chat-thread` `scrollTop:0`,
  `scrollHeight:3935`, client 518; 3 rows at viewport top 3593-3953; `textContent` 5,017 chars;
  `innerText` "SHOW EARLIER"; `history.scrollRestoration:"auto"`. Setting
  `scrollTop = scrollHeight` in the live tab revealed the 3 tail rows (scrollTop 3417; row tops
  176/296/416), proving the virtualizer responds to scroll, but this is a DOM-level experiment, not a
  supported seam.
- A Zero DOM helper could not meet the required guarantees robustly: it would depend on host-internal
  class names and absolute-row layout; it cannot distinguish a browser-restored or user-chosen scroll
  position from the initial quirk; and it can race the host's own auto-scroll/new-message logic. The
  host also owns `chatHasAutoScrolled`, so a plugin cannot mark the initial sync as done in host
  state.
- User workaround: click any position-rail marker or press End. This is native host behavior.
- Consequence: B5 remains a host-owned limitation. Revisit only if a future host SDK exposes a
  documented chat/transcript scroll API; do not add a second renderer or a fragile DOM hack.

Compact matrix: `reports/gap-matrix-2026-10-26.md`.

UI-05 remains **READY FOR REVIEW**; CU-01 **PARTIAL**; PM-01 separate. No self-acceptance.

---

## 17. Single-Agent Migration — Remove Researcher and Operator (2026-10-26)

### 17.1 Source changes

- `backend/config/openclaw.template.json` now has only the `zero` entry:
  `tools.alsoAllow:["computer"]` (preserves the removed Operator capability on Zero),
  `exec.mode:"ask"`, and `subagents.allowAgents:[]` + `requireAgentId:true` (no subagents).
  `agents.defaults.subagents` was removed. Providers and Zero model refs were not changed.
- `backend/agents/zero/delegation-policy.md` is single-agent: no subagents, no delegation,
  computer work stays with Zero under the existing hold/approval policy.
- `app/zero-control-ui/src/pages/models.js` is config-driven: activation, rollback, provider
  disable, role assignment, and quick assignment iterate only configured entries, so the UI cannot
  recreate removed workers. The former Operator tools/image safety gate is generalized to any
  computer-capable agent, so Zero's own model binding is now gated the same way.
- `app/zero-control-ui/src/shared/routes.js` / `src/legacy-routes.js`: legacy specialist chat/new
  URLs still redirect to `/chat/zero`; legacy specialist settings URLs redirect to `/agents`.
- `backend/plugin/index.js` adds server-side HTTP redirects for
  `/settings/agents/operator|researcher` and `/new?agent=operator|researcher`. Direct `/chat/*`
  cannot be intercepted by plugin HTTP routes because the host session-route stage runs first; those
  URLs render the host “Conversation unavailable” page and cannot create a chat.
- `backend/scripts/preflight.mjs`, `bootstrap.mjs`, and `acceptance.mjs` now expect one agent (`zero`),
  check Zero's computer grant and `exec.mode:"ask"`, and no longer expect worker exec/edges.
- Migration: `backend/scripts/migrate-zero-only-agents.mjs` builds the zero-only patch, backs up the
  live config, dry-runs the patch, applies it through `openclaw config patch`, removes the two worker
  entries through the installed `deleteAgentConfigEntry` config-only mutation (no workspace/session
  pruning), then validates and verifies the model/provider signature.

### 17.2 Live config result

- Backups created under `.zero-data/fresh-workspace/openclaw.json.pre-zero-only-*.bak`.
- Dry-run + apply: schema `true`, resolvability `true`; post-apply `config validate` passed.
- Runtime `config.get`: entries `["zero"]`; `zero.subagents.allowAgents:[]`,
  `requireAgentId:true`; `zero.tools.alsoAllow:["computer"]`; `zero.tools.exec.mode:"ask"`;
  defaults model unchanged `nvidia/minimaxai/minimax-m3.1-flash`; no provider change.
  Applied/revision hash `hmac-sha256:v1:XvmYRfteiPilMdR-XuSg8o4D8ApGyrM1oG8TdEb487w`.
- Workspace directories for zero/researcher/operator remain on disk. Worker session rows remain in
  Gateway SQLite; the visible catalog now lists 5 Zero sessions and no worker sessions. One operator
  transcript was already host-archived as `.deleted…zst` at `2026-10-26T10:47:37Z` (before this
  migration's `13:39Z` patch); the script performed no workspace/session pruning. The archive is
  recorded as a pre-existing preservation caveat, not attributed to this migration.

### 17.3 UI bundle and live surface

- Generation `1eaa41f4fba8e94782014b16a5ebf81f28d2abe5a01a970220ca32c1ac5943a7`
  (JS 100,282 B, SHA-256 `c1d326899003dca7f26106ced7a481068189be6f22dd8a2c4f2f357c0bcdb63d`;
  CSS 24,114 B, SHA-256 `6affcc8dfa5f356e34194381a87dcd2abe6f9948c9ccac766229e8f439053004`).
- Published via `plugins.controlUi.reload`: active revision `5eeadb3a…`, catalog `fe369f24…`;
  served JS/CSS are byte-identical to the local generation.
- Live `/agents`: exactly one card, `zero`, `/chat/zero`; 0 specialist cards/links.
  Live `/settings/model-providers`: one `Zero (zero)` binding with the tools/image override gate;
  no Researcher/Operator text or options.
  Live `/settings/agents/operator`: redirects to `/agents`.
  Live `/chat/operator` and `/chat/researcher`: host “Conversation unavailable” page. The host session
  route handles `/chat/*` before plugin HTTP routes, so the plugin cannot redirect these; no chat or
  session is created, but the URL is not sent to `/chat/zero`.
- `/chat/zero` remains the canonical chat and loads normally. Composer availability and reply completion
  are tracked in §16; they were not re-tested in this migration.

### 17.4 Tests and checks

- UI suite **78/78**; migration **3/3**; config-policy/sync **5/5**; legacy redirect test **1/1**;
  bridge **3/3**; plugin selftest **111/111**.
- Preflight **29 pass / 1 warn / 2 fail**; failures are the pre-existing template model checks
  (`config.singleModel`: 2 model rows; `config.modelRefs`: legacy `zero-gw` refs), not agent removal.
- `node --check` clean for changed backend/UI sources; build reproducible.

### 17.5 Remaining gates

1. A true `/chat/operator|researcher` → `/chat/zero` redirect has no supported Zero-owned seam; see
   §18 for the host-order evidence and the options for Senior review.
2. Independent review of the config delta/backups, the model projection, and the host-archived worker
   transcript caveat.
3. The canonical chat’s composer/reply state is tracked in §16.
4. UI-05 and the migration remain **READY FOR REVIEW**; no self-acceptance. PM-01 and CU-01 separate.

### 17.6 Controlled restart and before/after verification

- Pre-restart: PID `17492`, health `ok:true`, config SHA-256
  `f9f9fe95398aaf27ce14bc547e2e5f0b3df5c976990ae327988871c4f0e83069`, model projection SHA-256
  `5b5c0dbc987f131a93b619897fa1a9df561fbdec4aa895cbea827b3dd7e23e35`.
- One controlled restart through `.zero-data/fresh-workspace/start-all.ps1` → PID `21544`, health OK,
  `zero-policy` loaded, 17 plugins, no plugin errors.
- Post-restart: config SHA and model projection are byte-identical (same two hashes); `/chat/zero` loads;
  `/new?agent=operator` HTTP 308 → `/chat/zero`; `/settings/agents/operator` HTTP 308 → `/agents`;
  `/chat/operator` and `/chat/researcher` remain host-gated unavailable with no composer.
- No model/provider field changed; no prompt/provider call, credential read, workspace/session deletion,
  or unrelated computer-policy change.
- The final source edit removed the ineffective `/chat/*` plugin-route registrations after this restart;
  it changes no live behavior (those routes never matched), and the next restart will load the
  simplified plugin source.

---

## 18. `/chat/<removed-agent>` Host-Route Investigation (2026-10-26)

### 18.1 Exact limitation

- The installed host creates `createControlUiSessionRoutes` and adds its **session-route stage before**
  the plugin-request stage. In `backend/node_modules/openclaw/dist/server-start-D6vaUNGz.mjs`, the
  session stage is added at lines 7492–7494; the plugin request stage is added at 7533–7555. Its
  `matches()` returns true for any `/chat/*` path (except `/chat/` itself and a qualifying main-session
  query), so a plugin HTTP route can never see `/chat/operator` or `/chat/researcher` first.
- `findMatchingPluginHttpRoutes` (`route-match-D52ZG3x-.mjs`) only orders exact/prefix matches **inside
  the plugin registry**; it has no host-route override.
- The host `serveControlUiPublicChat` path resolves the requested session with `publicOnly` and requires
  `resolveSessionPublicShare` (`control-ui-public-chat-C9f368pC.mjs`). The removed agent’s old session has
  no public share, so the response is the host “Conversation unavailable” page. It does not fall back to
  `/chat/zero`.
- No supported config alias exists: `controlUi` schema has no redirect/alias/path-rewrite field; agent
  `bindings` route channel conversations, not URL paths; removed agent entries cannot be aliased without
  recreating workers.
- `/new?agent=operator` and `/settings/agents/operator` do redirect because no earlier session route
  claims those paths. They remain the only live server redirects.

### 18.2 Decision

No supported Zero-owned downstream seam exists. No speculative route change was made; the ineffective
`/chat/*` plugin routes were removed. The plugin now registers only settings and `/new` redirects.

Smallest maintainable options for Senior review:

1. **Accept the host unavailable page (recommended for now).** Direct old chat URLs cannot open a chat or
   create a session, and no specialist exists. `/new`/settings redirects already return users to Zero-owned
   surfaces. No extra runtime or host patch.
2. **Host-level route change.** Add a narrow redirect for the two removed paths before the session-route
   stage in `upstream/openclaw` (owner-approved PR). This is the only way to make direct `/chat/*` return
   308 → `/chat/zero`; it is host code, not Zero-owned.
3. **Owner-managed reverse proxy in front of port 18789.** Technically possible but rejected as the
   default: it adds a second runtime/port, changes the launcher and auth boundary, and is not maintainable
   inside the current single-Gateway architecture.
4. **Reintroduce worker agents as aliases.** Rejected: violates the zero-only outcome and recreates the
   agents.

### 18.3 Evidence

- Before/after config SHA-256 `f9f9fe95…` and model projection SHA-256 `5b5c0dbc…` are identical.
- Live `/new?agent=operator` and `/settings/agents/operator` return 308; `/chat/operator` and
  `/chat/researcher` show the host unavailable page with no composer; `/chat/zero` loads normally.
- Plugin redirect test asserts only the supported settings/`/new` routes; plugin selftest 111/111.
- No prompt, provider call, credential read, session creation, workspace/history deletion, or model
  change.
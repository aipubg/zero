# Zero AI — Frontend Application Build & Asset Provenance

**Build Command:** `node app/zero-control-ui/build.mjs`  
**Source Directory:** `app/zero-control-ui/`  
**Output Targets:** `dist/web/assets/`, `dist/web/plugins/control-ui/`, `app/zero-control-ui/dist/`  
**Status:** Independent First-Party Build Verified (Zero Legacy Runtime Dependencies)

---

## 1. Build Pipeline & Tooling

The Zero UI frontend is built using `esbuild` directly from source files in `app/zero-control-ui/`.

- **Compiler:** `esbuild` v0.27+
- **Entry Points:**
  - `app/zero-control-ui/browser.js`
  - `app/zero-control-ui/index.css`
- **Target:** ECMAScript 2022 (`es2022`), Browser platform
- **Format:** ESM (`format: "esm"`)
- **Bundle Strategy:** Single canonical bundle with deterministic SHA-256 generation hashing
- **Dependencies:** Self-contained within `app/zero-control-ui/package.json`

---

## 2. Source-to-Asset Mapping

| Source Component | Source File | Built Output Asset | Purpose |
|---|---|---|---|
| Main Application Shell | `app/zero-control-ui/browser.js` | `dist/web/assets/zero-control-ui.js` | SPA routing, WebSocket Protocol 4 client, chat turn manager, UI state |
| Application Stylesheet | `app/zero-control-ui/index.css` | `dist/web/assets/zero-control-ui.css` | Cyberpunk/industrial themes, media cards, progress widgets |
| Control UI Plugin Bundle | `app/zero-control-ui/browser.js` | `dist/web/plugins/control-ui/zero-control-ui/{generation}/index.js` | Plugin-architecture compatible entry point |
| Control UI Plugin Styles | `app/zero-control-ui/index.css` | `dist/web/plugins/control-ui/zero-control-ui/{generation}/index.css` | Plugin-scoped styling |
| Native Surfaces | `app/zero-control-ui/src/native-surfaces.js` | Bundled in `zero-control-ui.js` | Settings pages, Model dropdowns, Hardware cards |
| Legacy Route Interceptors | `app/zero-control-ui/src/legacy-routes.js` | Bundled in `zero-control-ui.js` | Client-side routing across all 29 settings paths |
| Computer Operator & CUA | `app/zero-control-ui/src/computer/operator.js` | Bundled in `zero-control-ui.js` | Visual verification, action parsing, progress cards |
| Gateway Client Protocol | `app/zero-control-ui/src/gateway/` | Bundled in `zero-control-ui.js` | Protocol 4 RPC frame creation, stream delta handling |

---

## 3. Build Reproducibility & Generation Hash

When `node app/zero-control-ui/build.mjs` executes:
1. `esbuild` compiles `browser.js` and `index.css` into a temporary staging directory.
2. A cryptographic SHA-256 hash is computed over `js + "\0" + css`.
3. The generation hash determines the revision ID (currently `36a42defcd8df5b5112abb20e7ac5632ac511b36de5e755644122d0182bd5e46`).
4. Assets are written synchronously to:
   - `dist/web/assets/zero-control-ui.js`
   - `dist/web/assets/zero-control-ui.css`
   - `dist/web/plugins/control-ui/zero-control-ui/{generation}/index.js`
   - `dist/web/plugins/control-ui/zero-control-ui/{generation}/index.css`
   - `app/zero-control-ui/dist/control-ui/{generation}/`
5. `app/zero-control-ui/openclaw.plugin.json` and `app/zero-control-ui/dist/openclaw.plugin.json` are synchronized with the active generation pointers.

---

## 4. Route Coverage Verification

All 29 settings and control routes are served directly by `ZeroNativeHost` (`services/host/native-gateway.mjs`) and render the compiled Zero UI application bundle without falling back to any external or unmaintained packages:

1. `/`
2. `/chat`
3. `/chat/zero`
4. `/settings`
5. `/settings/model-providers`
6. `/settings/about`
7. `/settings/agents`
8. `/settings/appearance`
9. `/settings/notifications`
10. `/settings/profile`
11. `/settings/gateway`
12. `/settings/channels`
13. `/settings/communications`
14. `/settings/talk`
15. `/settings/devices`
16. `/settings/cloud-workers`
17. `/settings/search`
18. `/settings/plugins`
19. `/settings/skills`
20. `/settings/mcp`
21. `/settings/memory`
22. `/settings/automation`
23. `/settings/privacy`
24. `/settings/secrets`
25. `/settings/approvals`
26. `/settings/infrastructure`
27. `/settings/labs`
28. `/settings/advanced`
29. `/systems`

---

## 5. Clean Environment Build Verification

The build was tested and confirmed in an isolated workspace with no references to legacy runtime binaries or external bundlers:
- **Build Duration:** ~120ms
- **JS Bundle Size:** 114,126 bytes
- **CSS Bundle Size:** 40,702 bytes
- **Diagnostic Errors:** 0
- **Source Map Leaks:** None (production build suppresses internal file paths)

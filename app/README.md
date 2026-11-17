# Zero app workspace

The Zero product UI is the **native Control UI plugin** in
[`zero-control-ui/`](zero-control-ui/). It mounts inside the existing Control UI
shell, uses the host's authenticated Gateway connection, and reads the canonical
Gateway agent roster, session catalog, history, and chat. There is no second
chat, session list, transcript store, or navigation shell. Zero Team, Models &
Providers, and About Zero are the only Zero-owned pages.

Run it from the Gateway:

```powershell
# Fresh local profile (loopback only)
E:\zero\.zero-data\fresh-workspace\start-all.ps1
# Open http://127.0.0.1:18789/ and choose Zero Team, Models & Providers, or About Zero
```

`zero-control-ui` build and tests:

```powershell
node app/zero-control-ui/build.mjs
node --test app/zero-control-ui/test/mount.test.mjs app/zero-control-ui/test/product-path.test.mjs app/zero-control-ui/test/product-surface.test.mjs
node app/zero-control-ui/test/verify-served.mjs
```

## What remains in `src/`

`src/bridge/` is a **reusable Gateway bridge library**, not a running service.
It preserves the proven WebSocket RPC adapter, device pairing, and configuration
validation. It is kept because the native plugin and future local clients can
reuse those contracts without rebuilding them. It does not own a UI or a
conversation store. See [`src/bridge/README.md`](src/bridge/README.md).

`src/shared/zero-types.ts` holds the bridge wire-contract types.

## Removed legacy path

The earlier React/CopilotKit/AG-UI prototype was removed from the product and
dependency path on 2026-10-25:

- `src/client/` (React + CopilotKit UI) — deleted;
- `src/server/zero-runtime.ts`, `zero-agent.ts`, `runtime-scope.ts`,
  `thread-registry.ts`, `index.ts`, `live-relay.ts`, `activity-feed.ts` —
  deleted;
- `@copilotkit/*`, `@ag-ui/*`, React, Vite, Hono, noVNC, and their dev
  dependencies — removed from `package.json`;
- `index.html`, `vite.config.ts`, `.env.example`, `tsconfig.server.json` —
  removed.

The `Failed to fetch threads: 403` symptom came from the old CopilotKit runtime:
`runtime-scope.ts` intentionally rejected `/api/copilotkit/threads` because the
Intelligence thread store was disabled. The correction is **not** to weaken
Gateway authorization or embed credentials; the old runtime and its request
path are gone, and the native Control UI session catalog is the single source of
truth.

The retained bridge has no build output. Verify it with:

```powershell
cd app
npm run typecheck
npm test
```

Configuration lives in the environment (see
[`src/bridge/README.md`](src/bridge/README.md)). Never place secrets in this
tree, in browser code, or in logs.

## Attribution

See [`NOTICE`](NOTICE) and [`REUSE-LEDGER.md`](REUSE-LEDGER.md). The native
plugin is Zero-authored plain DOM/ES modules; it does not embed React,
CopilotKit, or OpenDots runtime code.

# Zero auth UI audit

The token/password prompt reported by the owner was not in the native `zero-control-ui` Team
page. The only Zero-owned credential-facing UI was the old React bridge's pairing-required banner
in `app/src/client/App.tsx`; that banner and the whole legacy React/CopilotKit/Vite path were
deleted on 2026-10-25 under D-012/D-015. `app/src/bridge/` remains as a non-running library only.

The native plugin contains no token, password, bearer, or credential input. It uses the already
authenticated Control UI host connection. No upstream or backend auth enforcement was changed.

Gateway authentication remains a transport boundary. Zero keeps the Gateway loopback/private
(`bind: "loopback"`); the current local config uses `gateway.auth.mode: "none"`, so no browser
token prompt is needed in this private deployment. If auth is enabled later, native Control UI
pairing/connection remains authoritative. Never place `OPENCLAW_GATEWAY_TOKEN` or
`ZERO_GATEWAY_KEY` in browser code.

Qoder owns validation of this boundary and the native package from the Gateway loader context.

## Live verification — 2026-10-23 07:53 IST

The earlier gate observation was the **pre-restart** Gateway process. The live log records
`unauthorized ... authMode=token` at 07:41:39; at 07:49:22 the config watcher applied
`gateway.auth.mode: "none"`, restarted via SIGUSR2, and completed `config.auth` startup. The
old PID 14700 was still serving token auth; the restarted process is the one now running.

Verified in the live Control UI at `http://127.0.0.1:18789/`:

- page title `Zero — OpenClaw`, `loginGateCount: 0`; no "Gateway secret" field and no
  "Connect to OpenClaw" gate;
- the same zero count on `/plugin?plugin=zero-control-ui&id=team` and `/systems`;
- the legacy React bridge at `127.0.0.1:4317` (and its `5173` dev tab) was retired on
  2026-10-25; both ports are unused and the client/runtime are deleted;
- the sidebar and chat load normally with the existing browser device identity.

Zero-owned auth remnants: none. The old React bridge's pairing banner and the whole
`app/src/client/` tree (including the dead `.unlock` rules) were deleted on 2026-10-25. The native
plugin has no credential input and uses the authenticated Control UI host connection.

The upstream login gate is config-driven. It returns only when Gateway auth requires credentials;
do not edit upstream to hide it. Keep the private deployment on loopback with
`gateway.auth.mode: "none"`. If auth is enabled later, native Control UI pairing is authoritative.
No backend auth, pairing storage, upstream UI, or secret was changed; no secret was printed.


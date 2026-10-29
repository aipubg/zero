# Zero Gateway bridge library

This folder is **not** the Zero product UI and it is not a running service. It is
the retained, tested part of the earlier bridge prototype: the OpenClaw Gateway
WebSocket client, device pairing, and configuration validation.

The product UI is the native `app/zero-control-ui` plugin. It runs inside the
OpenClaw Gateway's Control UI and uses the host's authenticated Gateway
connection directly, so it never needs this client.

## Why keep it

- `gateway-link.ts` contains the proven Gateway RPC vocabulary (session create /
  list / subscribe, chat send / abort / history, roster, computer hold) and the
  device-pairing flow that keeps credentials out of the browser.
- `pairing*.ts` implements the Ed25519 device identity and scoped token storage.
- `config.ts` validates the required environment without ever reading secret
  values.

The CopilotKit/AG-UI client, its Hono runtime, the Intelligence-style thread
registry, the route scope guard, the activity feed, and the unverified desktop
relay were removed because the native Control UI and Gateway own those
capabilities. See `../README.md` and `../REUSE-LEDGER.md`.

## Configuration

`loadConfig()` reads only these variables:

| Variable | Required | Meaning |
|---|---|---|
| `GATEWAY_URL` | yes | `ws://` or `wss://` OpenClaw Gateway endpoint |
| `ZERO_STATE_DIR` | no | Runtime state directory (default `./zero-state`) |
| `ZERO_CLIENT_ID` | no | Client identity advertised to the Gateway |
| `ZERO_DEVICE_LABEL` | no | Human-readable device label |
| `ZERO_AGENT_RUN_TIMEOUT_MS` | no | Per-turn guard; `0` disables it |

Never put a Gateway token, provider key, or any other secret in a file under
this tree. Device identity and pairing tokens are generated under
`ZERO_STATE_DIR` at runtime.

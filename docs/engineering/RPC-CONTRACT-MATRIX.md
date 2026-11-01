# Zero AI — Complete RPC Contract Matrix

**Document ID:** `RPC-CONTRACT-MATRIX-V1`  
**Host Authority:** `ZeroNativeHost` (`services/host/native-gateway.mjs`)  
**Protocols:** Reference Wire Protocol (v4) & JSON-RPC 2.0  
**Transport:** WebSocket (`ws://127.0.0.1:18789`)  

---

## 1. Protocol Architecture & Wire Formats

Zero Native Host natively supports dual framing over WebSocket:

### Reference Wire Frame (Client / SPA)
- **Request:** `{ "type": "req", "id": "<id>", "method": "<method>", "params": { ... } }`
- **Response Success:** `{ "type": "res", "id": "<id>", "ok": true, "payload": { ... } }`
- **Response Failure:** `{ "type": "res", "id": "<id>", "ok": false, "error": "<msg>" }`
- **Streaming Event:** `{ "type": "event", "event": "<name>", "payload": { ... } }`

### Standard JSON-RPC 2.0 Frame
- **Request:** `{ "jsonrpc": "2.0", "id": "<id>", "method": "<method>", "params": { ... } }`
- **Response Success:** `{ "jsonrpc": "2.0", "id": "<id>", "result": { ... } }`
- **Response Error:** `{ "jsonrpc": "2.0", "id": "<id>", "error": { "code": <int>, "message": "<msg>" } }`
- **Notification:** `{ "jsonrpc": "2.0", "method": "<name>", "params": { ... } }`

---

## 2. Handshake & Connection Negotiation

| Method | Aliases | Request Params | Success Payload | Failure Code | Backing Engine |
|---|---|---|---|---|---|
| `connect` | `handshake`, `gateway.handshake`, `hello` | `{ protocol: 4, token?: string, client: { id: string } }` | `{ type: "hello", protocol: 4, server: { version: "1.0.0", commit: "zero-native", bootId: string }, features: { methods: string[] }, snapshot: { presence: object[], sessionDefaults: object }, auth: { role: string, scopes: string[] } }` | `-32001 Unauthorized` | Protocol 4 Validator (`packages/gateway-protocol`) |

---

## 3. Session Management Contracts

| Method | Aliases | Request Params | Success Payload | Failure Code | Backing Engine |
|---|---|---|---|---|---|
| `sessions.list` | `gateway.sessions.list` | `{ limit?: number, offset?: number }` | `{ ts: number, sessions: SessionSummary[], total: number }` | `-32603 Internal Error` | `SessionManager` (`.zero-data/zero-sessions.sqlite`) |
| `sessions.create` | — | `{ id?: string, key?: string, title?: string, metadata?: object }` | `{ ok: true, session: SessionDetail }` | `-32602 Invalid Params` | `SessionManager` SQLite `zero_sessions` table |
| `sessions.get` | `sessions.describe` | `{ key: string }` or `{ id: string }` | `{ ok: true, session: SessionDetail, transcript: Message[] }` | `-32602 / 404 Not Found` | `SessionManager` SQLite `zero_messages` table |
| `sessions.patch` | — | `{ key: string, title?: string, metadata?: object }` | `{ ok: true, session: SessionDetail }` | `-32602 Not Found` | `SessionManager` SQLite `UPDATE zero_sessions` |
| `sessions.delete` | — | `{ key: string }` or `{ id: string }` | `{ ok: true, deleted: true, key: string }` | `-32602 Not Found` | `SessionManager` SQLite `DELETE FROM zero_sessions` |

---

## 4. Chat & Agent Turn Execution

| Method | Aliases | Request Params | Success Payload | Streaming Events | Backing Engine |
|---|---|---|---|---|---|
| `chat.send` | `agent`, `gateway.agent` | `{ sessionKey: string, message: string \| { content: string } }` | `{ ok: true, role: "assistant", content: string, messages: Message[] }` | `chat.delta` (wire) / `zero.stream.delta` (RPC), `chat.tool` | `ModelFabric` + `CapabilityEngine` + `SessionManager` |
| `chat.history` | `gateway.chat.history` | `{ sessionKey?: string, sessionId?: string }` | `{ ok: true, sessionKey: string, messages: Message[] }` | — | `SessionManager.getTranscript` |
| `chat.abort` | — | `{ sessionKey: string }` | `{ ok: true, aborted: boolean, sessionKey: string }` | — | Active turn `AbortController` |

---

## 5. Model Catalog & Inference Fabric

| Method | Aliases | Request Params | Success Payload | Backing Engine |
|---|---|---|---|---|
| `models.list` | `gateway.models.list` | `{}` | `{ models: ModelItem[], defaultModel: string, providers: ProviderSummary[] }` | `ModelFabric.listModels()` (`models/gateway-providers.json`) |
| `models.status` | — | `{}` | `{ ok: true, health: HealthReport, providers: ProviderSummary[] }` | `ModelFabric.getHealthReport()` |
| `zero.providers.list` | — | `{}` | `{ ok: true, providers: ProviderSummary[], health: HealthReport }` | `ModelFabric.getProviders()` |
| `zero.providers.configure` | — | `{ provider: ProviderConfig }` | `{ ok: true, providers: ProviderSummary[] }` | `models/gateway-providers.json` + `ModelFabric.reloadFromDisk()` |
| `zero.providers.test` | — | `{ modelId?: string, providerId?: string }` | `{ ok: boolean, provider: string, configured: boolean, baseUrl: string }` | `ModelFabric.resolveApiKey()` |

---

## 6. Plugin Ecosystem & Control UI Integration

| Method | Aliases | Request Params | Success Payload | Backing Engine |
|---|---|---|---|---|
| `plugins.controlUi.list` | — | `{}` | `{ revision: string, plugins: PluginModule[], diagnostics: [] }` | `dist/web/plugins/control-ui` |
| `plugins.controlUi.report`| — | `{ revision: string }` | `{ ok: true }` | Native Plugin Catalog Handler |
| `plugins.controlUi.status`| — | `{}` | `{ clients: { connId: string, activations: object[] }[] }` | Connected WebSocket client session map |

---

## 7. Windows Desktop Automation & Capability Engine

| Method | Aliases | Request Params | Success Payload | Backing Engine |
|---|---|---|---|---|
| `zero.computer.control` | — | `{ action: string, ...args }` | `{ ok: boolean, action: string, verified: boolean, data: object, before?: string, after?: string, verifiedText?: string, audioActive?: boolean }` | `canonicalCapabilityEngine` (`packages/capability-engine`) |
| `zero.observation.status`| — | `{}` | `{ ok: true, screen: { available: true }, accessibility: { available: true, engine: "UIAutomation" }, activeWindow: object }` | `ComputerOperator.getWindowState()` |
| `zero-policy.computer-hold.status` | — | `{}` | `{ held: boolean, controlLeaseId: string \| null }` | Human Takeover Arbitration Coordinator |
| `zero-policy.computer-hold.take` | — | `{}` | `{ ok: boolean, controlLeaseId: string }` | Sets `computerHold.held = true` |
| `zero-policy.computer-hold.release` | — | `{ controlLeaseId?: string }` | `{ ok: boolean, held: false }` | Sets `computerHold.held = false` |
| `tools.effective` | — | `{ sessionKey?: string }` | `{ ok: true, tools: ToolDefinition[] }` | Desktop Automation Capability Catalog |

---

## 8. Memory, Tasks & Automation Subsystems

| Method | Aliases | Request Params | Success Payload | Backing Engine |
|---|---|---|---|---|
| `memory.remember` | — | `{ content: string, tags?: string[], importance?: number }` | Memory item with id, content, tags, createdAt | `PersistentMemoryStore` (`.zero-data/zero-memory.sqlite`) |
| `memory.recall` | — | `{ query: string, options?: object }` | Array of relevant memories | `PersistentMemoryStore.recall()` |
| `memory.forget` | — | `{ id: string }` | `{ ok: boolean, id: string }` | `PersistentMemoryStore.forget()` |
| `memory.list` | — | `{ limit?: number, offset?: number }` | Memory list | `PersistentMemoryStore.listMemories()` |
| `automation.listJobs` | — | `{}` | Array of registered cron automation jobs | `AutomationScheduler` (`.zero-data/zero-automation.sqlite`) |
| `automation.registerJob` | — | `{ name: string, schedule: string, action: string, params: object }` | Registered job detail | `AutomationScheduler.registerJob()` |
| `automation.toggleJob` | — | `{ id: string, enabled: boolean }` | `{ ok: boolean, id: string, enabled: boolean }` | `AutomationScheduler.toggleJob()` |
| `automation.deleteJob` | — | `{ id: string }` | `{ ok: boolean, id: string }` | `AutomationScheduler.deleteJob()` |
| `automation.triggerDue` | — | `{}` | `{ triggered: number, executed: object[] }` | `AutomationScheduler.triggerDueJobs()` |
| `tasks.list` | — | `{ status?: string, limit?: number }` | Task list | `TaskStateMachine` (`.zero-data/zero-tasks.sqlite`) |
| `tasks.create` | — | `{ goal: string, context?: object }` | Created task in `PENDING` state | `TaskStateMachine.createTask()` |
| `tasks.get` | — | `{ id: string }` | Task state, transition history, steps | `TaskStateMachine.getTask()` |
| `tasks.cancel` | — | `{ id: string, reason?: string }` | Task in `CANCELLED` state | `TaskStateMachine.cancelTask()` |
| `tasks.resume` | — | `{ id: string }` | Task resumed in `RUNNING` state | `TaskStateMachine.resumeTask()` |

---

## 9. Host Configuration & User Preferences Contracts

| Method | Aliases | Required Scopes | Request Params | Success Payload | Failure Code | Backing Engine |
|---|---|---|---|---|---|---|
| `config.get` | — | `operator.read` | `{}` | `{ config: object, hash: string }` | `-32603 Internal Error` | `zero-system/config/zero.json` read + SHA-256 hash |
| `config.set` | — | `admin`, `operator.admin` | `{ config: object }` | `{ ok: true, config: object, hash: string }` | `-32003 Forbidden` / `-32602 Invalid Params` | `zero-system/config/zero.json` validated write |
| `config.patch` | `config.apply` | `admin`, `operator.admin` | `{ config: object }` | `{ ok: true, config: object, hash: string }` | `-32003 Forbidden` / `-32602 Invalid Params` | Deep merge + port bounds check (1024–65535) |
| `users.prefs.get` | — | `operator.read` | `{}` | `{ ok: true, prefs: object }` | `-32603 Internal Error` | `zero-system/config/user-prefs.json` |
| `users.prefs.set` | — | `operator.write` | `{ prefs: object }` | `{ ok: true, prefs: object }` | `-32602 Invalid Params` | `zero-system/config/user-prefs.json` write |
| `models.authStatus` | — | `operator.read` | `{}` | `{ ok: true, providers: { provider: string, authenticated: boolean, configured: boolean }[] }` | `-32603 Internal Error` | Live credential probe across configured providers |
| `zero.gateway.status` | — | `operator.read` | `{}` | `{ ok: true, status: 'running', bootId: string, uptimeSeconds: number, port: number, host: string, nodeVersion: string, pid: number, memory: object }` | `-32603 Internal Error` | Live Zero Native Host process telemetry |
| `zero.gateway.restart` | — | `admin`, `operator.admin` | `{}` | `{ ok: true, status: 'restarting', message: string, scheduledInMs: 500 }` | `-32003 Forbidden` | Graceful host reboot scheduler |
| `sessions.subscribe` | `sessions.subscribeMessages` | `operator.read` | `{ key: string }` | `{ ok: true, subscribed: true, sessionKey: string }` | `-32602 Invalid Params` | WebSocket connection subscription registry |
| `sessions.unsubscribeMessages` | — | `operator.read` | `{ key: string }` | `{ ok: true, subscribed: false, sessionKey: string }` | `-32602 Invalid Params` | Subscription deregistration |

---

## 10. Security Scope Enforcement Matrix

All RPC invocations are strictly authorized using the client's negotiated session role and scopes:

| Scope | Allowed Methods |
|---|---|
| `admin` / `operator.admin` | Unrestricted access: `config.*`, `zero.gateway.restart`, `zero.providers.configure`, `automation.deleteJob`, all task cancellations |
| `computer.control` | `zero.computer.control` desktop and hardware actions (subject to human takeover arbitration) |
| `operator.write` | `chat.send`, `chat.abort`, `tasks.create`, `tasks.cancel`, `tasks.resume`, `users.prefs.set`, `memory.remember`, `memory.forget`, `automation.registerJob`, `automation.toggleJob` |
| `operator.read` | `config.get`, `users.prefs.get`, `models.list`, `models.status`, `models.authStatus`, `sessions.list`, `sessions.get`, `sessions.subscribe`, `tasks.list`, `tasks.get`, `memory.list`, `memory.recall`, `automation.listJobs`, `automation.listRuns` |

### WebSocket Origin Validation Guard
In accordance with production security standards:
- Any WebSocket upgrade request containing an untrusted or external `Origin` header (e.g. `evil.com`) is immediately rejected with HTTP `403 Forbidden` and WebSocket close code `1008 Policy Violation`.
- Allowed origins are restricted to `null`, loopback hostnames (`127.0.0.1`, `localhost`, `[::1]`), and internal client identifiers.

---

## 11. Deterministic Error Codes

| JSON-RPC Code | Constant | Meaning |
|---|---|---|
| `-32700` | `PARSE_ERROR` | Invalid JSON received by the host |
| `-32600` | `INVALID_REQUEST` | The JSON sent is not a valid Request object |
| `-32601` | `METHOD_NOT_FOUND` | The method does not exist / is not recognized |
| `-32602` | `INVALID_PARAMS` | Invalid method parameter(s) |
| `-32603` | `INTERNAL_ERROR` | Internal JSON-RPC error |
| `-32001` | `UNAUTHORIZED` | Handshake or authentication failed |
| `-32003` | `FORBIDDEN` | Caller lacks the required role or scope for this method |
| `-32004` | `HUMAN_HOLD_ACTIVE` | Desktop action rejected due to active human takeover lease |


# Zero AI — Local Browser & Control Plane Security Model

**Classification:** Security Architecture & Threat Specification  
**Version:** 1.0.0  
**Authoritative Port:** `18789` (Single Port Architecture)  
**Target Environment:** Local Windows Desktop / Loopback Interface (`127.0.0.1`, `localhost`, `[::1]`)

---

## 1. Executive Summary & Security Objectives

Zero AI executes as a local AI assistant platform with full desktop control, terminal execution, filesystem persistence, and browser automation capabilities. Because the control plane listens on local TCP port `18789`, untrusted external web pages executing in the user's browser represent a primary attack surface.

The Zero Security Architecture enforces five immutable security boundaries:

1. **DNS Rebinding Immunity:** Strict validation of the HTTP `Host` header on all HTTP and WebSocket connections.
2. **Cross-Origin Isolation:** Complete elimination of wildcard `Access-Control-Allow-Origin: *`. Only loopback origins are permitted.
3. **No Bootstrap Token Disclosure:** Public client bootstrap endpoints (e.g. `/control-ui-config.json`) never disclose gateway tokens, secrets, or administrative credentials.
4. **Secure Local Session Authentication:** Local browser UI authentication relies on `HttpOnly; SameSite=Strict` session cookies issued strictly to loopback callers, or programmatic exchange via `POST /api/auth/session`.
5. **Server-Enforced Scope Authorization:** Client-requested roles or scopes are non-binding. Privilege is assigned strictly by the Gateway verification engine.

---

## 2. Threat Model

```
       [ Malicious Web Page: https://attacker.com ]
                           |
        (Cross-Origin Fetch / WebSocket Upgrade)
                           |
                           v
   +---------------------------------------------------+
   |             Zero Gateway Boundary                 |
   |                                                   |
   |  [1] Host Header Check       --> Reject if Rebound |
   |  [2] Origin Header Check     --> Reject if Untrusted
   |  [3] SameSite Cookie Filter  --> Blocked by Browser
   |  [4] No Leaked Tokens        --> No Credentials    |
   |                                                   |
   |  Result: 403 Forbidden / 1008 Policy Violation   |
   +---------------------------------------------------+
```

### Threat Vectors & Mitigations

| Threat Vector | Attack Mechanism | Zero Defense Architecture | Result |
|---|---|---|---|
| **DNS Rebinding** | Attacker domain `evil.com` points to `127.0.0.1` with low TTL, bypassing SOP. | `isValidLoopbackHost()` inspects `req.headers.host`. Only `127.0.0.1`, `localhost`, and `[::1]` are accepted. | **403 Forbidden** before routing |
| **CORS Exploitation** | Malicious script calls `fetch('http://127.0.0.1:18789/...')`. | `applyStrictLoopbackCors()` enforces that only loopback origins receive CORS headers. Wildcard `*` is prohibited. | **CORS Preflight Failed / Rejected** |
| **WebSocket Hijacking (CSWSH)** | Attacker page initiates `new WebSocket('ws://127.0.0.1:18789/')`. | WebSocket upgrade handler strictly checks `Origin` and `Host` headers. Untrusted origins are aborted immediately. | **1008 Forbidden (Connection Closed)** |
| **Token Disclosure** | Attacker reads `/control-ui-config.json` to steal gateway token. | Gateway token was removed from public config. Endpoint serves non-sensitive UI bootstrap data only. | **No credentials disclosed** |
| **Ambient Credential Theft** | Attacker attempts to leverage ambient browser state. | Desktop session cookies are configured with `SameSite=Strict; HttpOnly; Path=/`. Browsers refuse to send them on cross-site requests. | **Cookie omitted by browser** |
| **Privilege Escalation** | Client sends `{ role: "admin" }` in handshake without credentials. | Gateway treats client role/scope fields as untrusted hints. Default unauthenticated role is read-only `viewer`. Mutating RPCs fail with `-32003 FORBIDDEN`. | **Access Denied (-32003)** |

---

## 3. Authentication & Session Architecture

### A. Local Desktop Browser Flow (`/chat/zero` & `/settings/*`)
1. User navigates directly to `http://127.0.0.1:18789/chat/zero`.
2. The Gateway serves `index.html` and checks the `Cookie` header:
   - If an active `zero_session` cookie is present in `DesktopSessionStore`, it is retained.
   - If missing, the Gateway generates a cryptographically secure 256-bit token (`crypto.randomBytes(32).toString('hex')`) and sets the header:
     ```http
     Set-Cookie: zero_session=<token>; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400
     ```
3. The Single-Page Application (SPA) initializes and establishes a WebSocket connection to `ws://127.0.0.1:18789/`.
4. The browser automatically attaches the `zero_session` cookie to the WebSocket HTTP upgrade request.
5. The Gateway validates the session token from the cookie, binds the connection to `role: 'operator'` with `ADMIN_SCOPES`, and grants control access without any JavaScript code ever touching or exposing the token.

### B. Programmatic & CLI Authentication (`POST /api/auth/session`)
For headless test runners, CLI tools, and external automation scripts:
1. Client issues an HTTP POST to `/api/auth/session` on loopback:
   ```http
   POST /api/auth/session HTTP/1.1
   Host: 127.0.0.1:18789
   Content-Type: application/json

   { "token": "<configured_gateway_token>" }
   ```
2. If `gateway.auth.mode === 'token'` is configured, the Gateway verifies the bearer token.
3. Upon validation, the Gateway creates a new session in `DesktopSessionStore` and returns:
   ```json
   {
     "ok": true,
     "session": { "role": "operator", "scopes": ["..."] },
     "token": "<session_token>"
   }
   ```
4. The client provides this session token in subsequent Protocol 4 handshakes (`params.token`).

---

## 4. Cross-Origin Resource Sharing (CORS) Policy

The following rules are strictly enforced by `services/host/security.mjs` and `backend/gateway/server.mjs`:

```javascript
export function applyStrictLoopbackCors(req, res) {
  const origin = req.headers?.origin;
  if (origin) {
    if (isAllowedLoopbackOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    } else {
      // Untrusted external origin: never grant access
      return false;
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return true;
}
```

- **Permitted Origins:** `http://127.0.0.1:*`, `http://localhost:*`, `http://[::1]:*`
- **Permitted Methods:** `GET, POST, PUT, DELETE, OPTIONS, HEAD`
- **Credentials:** Enabled only for verified loopback origins.
- **Wildcards:** Strict 0% wildcard policy (`Access-Control-Allow-Origin: *` is permanently eliminated).

---

## 5. Security Regression Verification

Automated security regression tests in `test/rpc-contracts.test.mjs` and `test/e2e-matrix.test.mjs` verify:
1. `GET /control-ui-config.json` contains 0 credential properties.
2. Malicious `Host: rebind.attacker.com` returns `403 Forbidden`.
3. Malicious `Origin: https://evil.com` returns `403 Forbidden` and no CORS grant.
4. Cross-site WebSocket upgrade returns `1008 Policy Violation`.
5. Unauthenticated callers attempting `config.patch`, `zero.computer.control`, or `automation.registerJob` receive `-32003 FORBIDDEN`.

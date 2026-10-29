# Backend security boundary — what Zero's runtime actually exposes

**Ticket:** BE-02 supporting analysis (pre-build)
**Owner:** DeepSeek Harness
**Date:** 23 October 2026, 05:20 Asia/Calcutta
**Scope:** the OpenClaw Gateway as Zero will run it, plus the Zero Policy plugin. Source-cited facts only; nothing here was verified against a running process.
**Why this exists:** the readiness packet lists *what to run*. This lists *what that exposes*, so the owner's GO is an informed one and the post-acceptance hardening is not forgotten.

---

## 1. The trust boundary in one picture

```
user (single) ──[Zero UI, WS + gateway token]──┐
                                               ▼
        ┌──────────────── Gateway 127.0.0.1:18789 ────────────────┐
        │  auth required; loopback by default                     │
        │  ├─ WS RPC  (operator scopes)                           │
        │  ├─ HTTP /v1/chat/completions  ← FULL OPERATOR ACCESS   │
        │  ├─ Control UI                                          │
        │  └─ plugin methods / plugin HTTP routes                 │
        └───────────────┬─────────────────────────────────────────┘
                        │ provider HTTP (bearer from env)
                        ▼
                  model gateway
```

**The whole security model rests on two things:** the Gateway token, and the fact that the port is loopback-only on a single-user machine. Everything else is defence in depth.

---

## 2. Source-cited facts that matter

| Fact | Why it matters | Evidence |
|---|---|---|
| Auth is **required by default**; binding without auth is refused | There is no "convenient unauthenticated mode" to accidentally ship | `docs/gateway/index.md:76`, `:440` |
| Default bind is **loopback**; `auto` (0.0.0.0) only inside a detected container | Our template pins `bind: "loopback"` explicitly | `docs/gateway/index.md:75`; `config/openclaw.template.json` |
| **`/v1/chat/completions` is full operator access**, not a narrow per-user scope. A valid token there ≈ owner credential, and requests run through the same control-plane path as trusted operator actions | This is the single most important line in this document | `docs/gateway/openai-http-api.md:39-46` |
| HTTP callers are treated as **owner-sender turns**, restoring the full operator scope set | No scope narrowing from HTTP | `openai-http-api.md:51` |
| Provider `apiKey` may be a **SecretRef / env name**; resolved secrets are not persisted | Our template stores the *name* `ZERO_GATEWAY_KEY`, never a value | `docs/gateway/config-tools/custom-providers.md:51-52`; template |
| A custom provider `baseUrl` **is** the network-trust decision — that exact origin is allowed through the guarded fetch path | No separate "trust this host" toggle to get wrong | `custom-providers.md:14-16` |
| Plugin gateway methods get **no host schema validation** of params or results | The plugin must validate its own input; a client must not assume enforcement | `src/gateway/server-methods/shared-types.ts:584-588`; Qoder's 04:52 verification |
| Omitting `opts.scope` on a plugin method defaults it to **`operator.admin`** | We pass `operator.write` explicitly | `src/gateway/methods/descriptor.ts:70-101` |
| Trusted tool policies are **fail-closed**: a throw becomes `block:true` | A plugin bug blocks computer use rather than silently allowing it | `src/plugins/trusted-tool-policy.ts:138-149, 292` |
| Screenshots are **model-only and never auto-sent to chat** | The human's view is the RFB relay, not the model's frames | `docs/nodes/computer-use.md:306` |
| Treat screen content as **untrusted**; it can carry prompt injection | The Operator reads the desktop; the desktop is attacker-controlled text | `computer-use.md:307` |
| Upstream's own computer guards are "hardening, **not an isolation boundary**" | Do not treat the plugin hold as containment | `computer-use.md:299` |
| Logs: write raw, **redact only at egress**; never log message/tool content | Our plugin logs ids and reasons, never params payloads | `upstream/openclaw/AGENTS.md:60` |

---

## 3. What Zero adds on top

| Control | Where | What it does *not* do |
|---|---|---|
| Human hold (refuse, never queue) | `zero-policy` trusted tool policy | Does not stop a raw `node.invoke` client, an action already in flight, or a physical-console human |
| Post-handover stale-reference gate | same policy | Does not prove the screen is unchanged — only that the agent recaptured it |
| Per-run action + input budgets | same policy | Per-run only; no daily/spend budget yet (BE-03) |
| Global kill switch | `gateway.nodes.commands.deny` | Coarse: it degrades observation too (structured reads ride `computer.act`) |
| Audit ring (last 50 decisions, with target and reason) | plugin snapshot | In-memory; lost on reload |

---

## 4. Residual risks, stated plainly

1. **Loopback is not isolation.** Any process running as this user can reach `127.0.0.1:18789`. The token is the boundary. On a single-user workstation that is the accepted model; it would not be acceptable on a shared host.
2. **The token is in the environment.** Env vars are readable by same-user processes and can leak into crash dumps. The host secret store is the mitigation for storage; there is no mitigation for a compromised same-user process.
3. **The HTTP endpoint is on for acceptance.** See §5 — it should not stay on.
4. **Prompt injection through the screen.** The Operator reads whatever the desktop shows. Nothing in the current design sanitises that; the hold and the stop are the human's levers.
5. **Plugin hold state is in memory.** A reload clears a hold. Deliberate (a persisted stale lease silently keeping control is worse), but it means a reload during a takeover needs the UI to re-take.
6. **Computer use is experimental upstream** and the designated environment is the containment, not the plugin.

---

## 5. Post-acceptance hardening (do after Phase 4 passes)

| # | Action | Why |
|---|---|---|
| H1 | Set `gateway.http.endpoints.chatCompletions.enabled: false` | It is full operator access and exists only so `acceptance.mjs` can prove A1/A2/A3. D-008 has the UI on WS, so the UI does not need it. Leaving it on is permanent extra surface for a one-time test. |
| H2 | Rotate `OPENCLAW_GATEWAY_TOKEN` if it was ever printed, shared, or reused from another tool | Rotation is cheap; a shared secret spanning contexts is not |
| H3 | Confirm `bind` is still `loopback` and the port is not exposed through any tunnel | A reverse proxy or tunnel silently widens the boundary |
| H4 | Record the installed dependency licence inventory (`pnpm licenses list --json`) | MASTER_PLAN §9; see `license-posture.md` §5 |
| H5 | Re-run `preflight.mjs` after any config change | It is the cheapest regression net we have |

H1 is the one that is easy to forget: the acceptance runner *requires* the endpoint we should not keep.

---

## 6. What this does not cover

- Gateway TLS, remote access, Tailscale, trusted-proxy auth: not used by the MVP (loopback only). If Zero ever exposes the Gateway, D-008 and this document need revisiting.
- Operator scopes beyond `operator.write` for the plugin method.
- The UI's own auth model — that is OpenCode's lane; the note that matters here is that the browser must not persist an operator bearer credential without a @manager decision (OQ-4).
- Host-level hardening (OS accounts, disk encryption, VBS). The designated-environment decision (D-003) is the current answer, not a technical control in this repo.

**Files:** created `reports/backend/security-boundary.md`. No other file changed for this note.

## Senior runtime correction — 2026-10-23

H1 is already applied: `gateway.http.endpoints.chatCompletions.enabled` is
false in the template and live config. Runtime probe to `/v1/models` returns
404, while the Gateway remains loopback-bound and Zero's WS chat path succeeds.
The prior instruction to turn it off after Phase 4 is superseded. Preflight
checks now enforce the disabled posture.

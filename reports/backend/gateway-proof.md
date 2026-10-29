# BE-01 - Model gateway compatibility proof

**Ticket:** BE-01 - Gateway compatibility proof
**Owner:** DeepSeek Harness
**Generated:** 2026-10-23T00:24:00.832Z by `reports/backend/tools/probe-to-report.mjs`
**Probe run at:** 2026-10-23T00:22:57.224Z
**Endpoint:** `https://integrate.api.nvidia.com/v1`
**Model:** `z-ai/glm-5.3-flash` (vision: `z-ai/glm-5.3-flash`)
**Authenticated:** yes - bearer key from the process environment; no key material in this file

**Evidence kind:** one live probe of the model gateway, run by a Zero-owned harness. This proves the *gateway*, not OpenClaw integration - that is Phase 3/4.

---

## Verdict

**PASS - every required check succeeded.**

Summary: 9 pass, 0 warn, 0 fail, 0 skip.

## Results

| Check | Required | Status | Latency (ms) | Detail |
|---|---|---|---|---|
| models | yes | pass | 213 | 83 model id(s) |
| models.metadata | no | pass |  | metadata keys: id, object, created, owned_by |
| chat | yes | pass | 10012 | ZERO_PROBE_OK |
| stream | yes | pass | 9823 | 3 deltas, first at 9337 ms |
| stream_usage | no | pass |  | usage present (prompt 24, completion 34) |
| tools | yes | pass | 13789 | get_weather({"city":"Paris"}) |
| vision | no | pass | 12277 | The image is a |
| reasoning_effort | no | pass | 7951 | endpoint accepted reasoning_effort |
| error_path | no | pass | 152 | 404 structured error: 404 page not found |

`models`, `chat`, `stream` and `tools` are required. The rest inform config, not the verdict.

## What this means for the backend config

- Tool calling works. The Lead can spawn specialists and the Operator can use `computer`. No `compat.supportsTools` override needed.
- Image input works. The single-model route can serve the Vision role, so `input: ["text","image"]` in the template stands.
- Streaming returns usage, so token accounting works without a `compat` override.
- `reasoning_effort` was accepted; the default model entry needs no compat override.
- No context length reported for `z-ai/glm-5.3-flash`; the template keeps its conservative `contextWindow` and `contextTokens` working values.

## Model catalog metadata reported by the endpoint

```json
{
  "id": "z-ai/glm-5.3-flash",
  "object": "model",
  "created": 735790403,
  "owned_by": "z-ai"
}
```

## What this does NOT prove

- That **OpenClaw** can use this endpoint. That is Phase 3 (config + launch) and Phase 4 (acceptance).
- That the model behaves well at long context, follows tool schemas strictly, or handles the Operator's screenshot sizes. Only real use shows that.
- Anything about computer control - the probe never touches it.

## Reproduce

```powershell
$env:ZERO_GATEWAY_KEY = "<fresh key from the secret store>"
node reports/backend/tools/gateway-probe.mjs --out .zero-data\be01-probe.json
node reports/backend/tools/probe-to-report.mjs .zero-data\be01-probe.json
```

## Senior runtime addendum — 2026-10-23

The original probe evidence above remains valid. Its former next steps and
counts are superseded by the live build window: the owner explicitly authorized
use of the configured API via environment variables. The NVIDIA key was
consumed from `ZERO_GATEWAY_KEY`; its value was not written to the workspace or
copied into prompts/logs. It was pasted in chat and remains exposed, so rotation
is recommended after this run.

- Direct NVIDIA compatibility probe: **9/9 pass**, including model list, chat,
  streaming, tool calling, image input and bounded error response.
- OpenClaw `2026.10.6` loaded the provider credential through an env SecretRef
  (`ZERO_GATEWAY_KEY`) and completed a real assistant response over Gateway WS.
- Zero's own `ZeroAgent` → `GatewayLink` → Gateway WS → NVIDIA → AG-UI stream
  produced `ZERO_AGUI_BRIDGE_OK` in the senior integration smoke.
- HTTP `/v1/chat/completions` returned `401 Invalid JWT serialization` when
  probed with the shared Gateway token. Zero does not use that HTTP endpoint;
  `chatCompletions` is now disabled in the deployed template and runtime config.
- Current checks: backend preflight **30 pass / 2 warn / 0 fail** (warnings:
  fallback pnpm path and occupied live Gateway port); plugin selftest **94/94**.

No API key value is included here. `BE-01` is accepted for model compatibility;
the HTTP acceptance runner's A2 path remains an observed incompatibility and is
not the Zero product transport. Continue backend delegation/policy acceptance
and personalization work under the existing tickets.


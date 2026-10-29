# Backend tools

Zero-owned, dependency-free helpers. Nothing here is upstream code and nothing here needs an install.

Both tools default to the owner-selected route (`https://integrate.api.nvidia.com/v1`, model `z-ai/glm-5.3-flash`), so a real run needs only the key in the environment.

## `gateway-probe.mjs` — BE-01 compatibility harness

Proves what the user's model gateway actually supports **before** OpenClaw is wired to it, so a gateway limitation is never misdiagnosed as an OpenClaw bug. This is the harness BE-01 runs the moment an endpoint exists; it is the executable form of `../mvp-backend.md` §4.

### Why a separate probe

OpenClaw can mask a gateway deficiency in two ways: it retries, and it falls back. Probing the gateway directly gives a clean attribution — "the endpoint rejected `tools`", not "the agent ignored the tool".

### Checks

| Check | Required | What a failure means |
|---|---|---|
| `models` | yes | No model list. Ids must be hardcoded; not fatal, but record it |
| `chat` | yes | Baseline completion does not work |
| `stream` | yes | No token streaming → the UI loses incremental output |
| `tools` | **yes** | **Tool/function calling is absent. The Lead cannot spawn specialists and the Operator cannot use `computer`.** This is the check that decides whether the backend plan survives |
| `stream_usage` | no | No usage in the stream → set `compat.supportsUsageInStreaming: false`; cost accounting is lost |
| `vision` | no | The Operator cannot observe the screen; computer-use needs a separate vision route |
| `reasoning_effort` | no | Endpoint rejects the field → set `compat.supportsReasoningEffort: false` on reasoning models |
| `error_path` | no | An unknown model either errors cleanly (good), errors on transport (bad), or is **silently substituted** (worst — check the gateway) |

Skipped checks are not failures. `vision` skips when no vision model is supplied.

### Usage

```powershell
$env:ZERO_GATEWAY_BASE_URL = "https://gw.example.com/v1"
$env:ZERO_GATEWAY_KEY      = "<value read from the host secret store>"
node reports/backend/tools/gateway-probe.mjs --model <chat-model> --vision-model <vision-model> --out .zero-data\be01-probe.json
```

Exit codes: `0` required checks passed, `1` a required check failed, `2` usage/config error.

### Secret handling

- The key is read **only** from `ZERO_GATEWAY_KEY`. There is deliberately no `--key` flag: a command-line secret lands in shell history and process listings.
- The key is never printed and never written to the JSON report. Every excerpt passes through a redactor (`sk-…`, `Bearer …`, and 32+ hex runs) before output.
- The report contains only `baseUrl`, model ids, timings, and redacted excerpts.

### Self-test evidence (23 Oct 2026, before any real endpoint existed)

A throwaway loopback mock implementing an OpenAI-compatible surface was started outside the repo, the probe was run against it, and the mock was then deleted:

```text
PASS * models            2 model id(s)
PASS * chat              ZERO_PROBE_OK
PASS * stream            5 deltas, first at 1 ms
PASS   stream_usage      usage present (prompt 9, completion 5)
PASS * tools             get_weather({"city":"Paris"})
PASS   vision            A single black pixel.
PASS   reasoning_effort  endpoint accepted reasoning_effort
PASS   error_path        404 structured error: ...
summary  : 8 pass, 0 warn, 0 fail, 0 skip
verdict  : required checks passed
```

Negative paths also verified:

- missing `ZERO_GATEWAY_BASE_URL` → clear message, exit `2`;
- unreachable endpoint → five clean `FAIL` lines naming `fetch failed`, exit `1`, no stack-trace crash;
- `--json --out` report grepped for the literal test key → **0 occurrences**.

### Limitations

- The mock proves the **harness**, not any gateway. Nothing here is a compatibility result.
- `tools` uses `tool_choice: "auto"`; a model that refuses to call tools on this prompt would report a false negative. If it fails, re-run with a stronger instruction before concluding the gateway lacks tool support.
- The vision check sends a 1×1 PNG. It proves image *input* is accepted, not that the model sees detail.
- `error_path` cannot distinguish "the gateway returns a proper 404" from "the gateway substituted a model and answered 200" beyond flagging the latter as a warning.

## `probe-to-report.mjs` — probe JSON → `reports/backend/gateway-proof.md`

Turns a probe run into BE-01's report, so the evidence is generated from the data rather than retyped into a table.

```powershell
node reports/backend/tools/probe-to-report.mjs .zero-data\be01-probe.json
```

It copies the per-check results and **derives** the config implications, deliberately including the unflattering ones:

- tool calling absent → *decisive*, do not proceed to Phase 2 on that model;
- image input absent → the template's `input: ["text","image"]` is wrong and the Operator cannot see the screen;
- no usage in stream → set `compat.supportsUsageInStreaming: false`, cost accounting degrades;
- `reasoning_effort` rejected → set `compat.supportsReasoningEffort: false`;
- context length reported by `/v1/models` → correct `contextWindow`/`contextTokens` from the number instead of the conservative guess;
- unknown-model request not returning 4xx → the gateway may be substituting models.

Exit code mirrors the probe verdict (`0` pass, `1` blocked), so it composes in a script.

### Verified

Generated from synthetic pass and fail fixtures (built in a temp directory, deleted afterwards):

- pass fixture → report says PASS, "Tool calling works", "Image input works", context length 131072 flagged for correction, exit 0;
- fail fixture (tools + vision failed) → report says BLOCKED, names `tools` as the decisive failure, exit 1.

It strips a UTF-8 BOM before parsing, because PowerShell's `Set-Content -Encoding utf8` adds one and a report round-tripped through PowerShell should not fail on that alone.

### Limitations

- It reports what the probe measured. It cannot make a failing gateway pass, and it does not re-verify anything.
- The config corrections it suggests are still a human edit to `backend/config/openclaw.template.json` — by design, so a machine-generated report never silently rewrites the deployed config.

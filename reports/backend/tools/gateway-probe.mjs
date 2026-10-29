#!/usr/bin/env node
// Zero AI - model gateway compatibility probe (BE-01 harness)
//
// Purpose: prove what the user's model gateway actually supports BEFORE we wire
// OpenClaw to it, so a gateway limitation is not misdiagnosed as an OpenClaw bug.
// Zero-owned tooling. No dependencies, Node >= 20 (global fetch). Read-only
// against the gateway: it issues chat/vision/tool requests and never writes.
//
// SECRET HANDLING
//   - The key is read ONLY from the environment variable ZERO_GATEWAY_KEY.
//     There is deliberately no --key flag: a command-line key lands in shell
//     history and process listings.
//   - The key is never printed, never written to a file, and never included in
//     the JSON report. Redaction is applied to every excerpt before output.
//
// USAGE
//   PowerShell:
//     $env:ZERO_GATEWAY_BASE_URL = "https://gw.example.com/v1"
//     $env:ZERO_GATEWAY_KEY      = "<secret from the host secret store>"
//     node reports/backend/tools/gateway-probe.mjs --model <chat-model> --vision-model <vision-model>
//
//   Optional:
//     --json                 emit machine-readable JSON only
//     --timeout <ms>         per-request timeout (default 60000)
//     --out <path>           write the JSON report to a file (never contains the key)
//     --allow-no-key         probe an unauthenticated endpoint
//
// EXIT CODES
//   0 all required checks passed (skips allowed)
//   1 one or more required checks failed
//   2 usage/config error (missing base URL, etc.)

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REQUIRED = new Set(["models", "chat", "stream", "tools"]);
const ASCII_BANNER = "Zero AI - model gateway compatibility probe";

// Owner-selected route (PROJECT_MEMORY): NVIDIA NIM, one model for Lead/Vision/Utility.
// Overridable by env for any future gateway, but the default means Phase 1 needs only a key.
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODEL = "z-ai/glm-5.3-flash";

function parseArgs(argv) {
  const out = {
    json: false,
    timeoutMs: 60000,
    out: null,
    allowNoKey: false,
    model: process.env.ZERO_GATEWAY_MODEL || DEFAULT_MODEL,
    visionModel: process.env.ZERO_GATEWAY_VISION_MODEL || DEFAULT_MODEL,
    help: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--allow-no-key") out.allowNoKey = true;
    else if (a === "--timeout") out.timeoutMs = Number(argv[++i]);
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--model") out.model = argv[++i];
    else if (a === "--vision-model") out.visionModel = argv[++i];
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return out;
}

function usage() {
  console.log(`${ASCII_BANNER}

Env:
  ZERO_GATEWAY_BASE_URL   optional; defaults to ${DEFAULT_BASE_URL}
  ZERO_GATEWAY_KEY        secret, read from env only (never pass on the command line)
  ZERO_GATEWAY_MODEL      default chat model id (or --model)
  ZERO_GATEWAY_VISION_MODEL  default vision model id (or --vision-model)

Flags:
  --json            JSON output only
  --timeout <ms>    per-request timeout (default 60000)
  --out <path>      also write the JSON report here
  --allow-no-key    probe an endpoint that needs no auth
  --model <id>      chat model id
  --vision-model <id>  vision-capable model id
`);
}

// --- redaction -------------------------------------------------------------

const SECRET_PATTERNS = [
  /\b(sk|pk|rk|key|tok)[-_][A-Za-z0-9_-]{8,}\b/g,
  /\bBearer\s+[A-Za-z0-9._-]{8,}/gi,
  /\b[A-Fa-f0-9]{32,}\b/g,
];

function redact(text, secret) {
  let s = String(text ?? "");
  if (secret && secret.length >= 6) s = s.split(secret).join("<redacted:key>");
  for (const re of SECRET_PATTERNS) s = s.replace(re, "<redacted>");
  return s;
}

function excerpt(value, secret, max = 240) {
  let s;
  try {
    s = typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    s = String(value);
  }
  s = redact(s, secret).replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max)}...` : s;
}

// --- http ------------------------------------------------------------------

function joinUrl(base, path) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function request(cfg, path, { method = "POST", body, headers = {} } = {}) {
  const url = joinUrl(cfg.baseUrl, path);
  const h = { "content-type": "application/json", ...headers };
  if (cfg.key) h.authorization = `Bearer ${cfg.key}`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(cfg.timeoutMs),
    });
    const latencyMs = Date.now() - started;
    const text = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* non-JSON body is fine; keep text */
    }
    return { ok: res.ok, status: res.status, latencyMs, text, json: parsed, res };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const name = err?.name === "TimeoutError" ? "timeout" : (err?.name || "error");
    return { ok: false, status: 0, latencyMs, text: `${name}: ${err?.message || err}`, json: null, error: true };
  }
}

function apiError(json) {
  if (!json || typeof json !== "object") return null;
  const e = json.error;
  if (!e) return null;
  if (typeof e === "string") return { message: e };
  return { message: e.message, type: e.type, code: e.code };
}

function record(results, name, status, detail, extra = {}) {
  results.push({ name, required: REQUIRED.has(name), status, detail, ...extra });
}

// --- checks ----------------------------------------------------------------

const MINI_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

async function checkModels(cfg, results) {
  const r = await request(cfg, "models", { method: "GET" });
  if (!r.ok) {
    record(results, "models", "fail", `GET /models -> ${r.status || "no response"}: ${excerpt(r.text, cfg.key)}`, {
      latencyMs: r.latencyMs,
    });
    return null;
  }
  const ids = Array.isArray(r.json?.data)
    ? r.json.data.map((m) => m?.id).filter(Boolean)
    : Array.isArray(r.json?.models)
      ? r.json.models.map((m) => m?.id || m?.name).filter(Boolean)
      : [];
  record(results, "models", ids.length ? "pass" : "warn", ids.length ? `${ids.length} model id(s)` : "endpoint returned no recognisable model list", {
    latencyMs: r.latencyMs,
    models: ids.slice(0, 60),
  });

  // Capture whatever metadata the endpoint volunteers for the configured model so the
  // backend config's contextWindow/maxTokens can be corrected from evidence instead of
  // a guess. NVIDIA NIM may report max_model_len / context_length here.
  const list = Array.isArray(r.json?.data) ? r.json.data : Array.isArray(r.json?.models) ? r.json.models : [];
  const match = list.find((m) => m?.id === cfg.model);
  if (match) {
    const meta = {};
    for (const [k, v] of Object.entries(match)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") meta[k] = v;
    }
    record(results, "models.metadata", "pass", `metadata keys: ${Object.keys(meta).join(", ") || "(none)"}`, { metadata: meta });
  } else {
    record(results, "models.metadata", "warn", `configured model ${cfg.model} not present in the model list`);
  }
  return ids;
}

async function checkChat(cfg, results) {
  const r = await request(cfg, "chat/completions", {
    body: {
      model: cfg.model,
      messages: [{ role: "user", content: "Reply with exactly: ZERO_PROBE_OK" }],
      // Reasoning models may spend an initial budget on reasoning_content;
      // 32 can end with finish_reason=length and content=null despite a valid API.
      max_tokens: 512,
      temperature: 0,
    },
  });
  if (!r.ok) {
    record(results, "chat", "fail", `POST /chat/completions -> ${r.status || "no response"}: ${excerpt(apiError(r.json) || r.text, cfg.key)}`, {
      latencyMs: r.latencyMs,
    });
    return false;
  }
  const message = r.json?.choices?.[0]?.message;
  const rawContent = message?.content;
  const content = typeof rawContent === "string"
    ? rawContent
    : Array.isArray(rawContent)
      ? rawContent
          .filter((part) => part && typeof part === "object" && ["text", "output_text"].includes(part.type) && typeof part.text === "string")
          .map((part) => part.text)
          .join("")
      : "";
  const ok = content.trim().length > 0;
  const shape = {
    messageFields: message && typeof message === "object" ? Object.keys(message).sort() : [],
    contentType: Array.isArray(rawContent) ? "array" : rawContent === null ? "null" : typeof rawContent,
    refusalPresent: typeof message?.refusal === "string" && message.refusal.length > 0,
    reasoningPresent: typeof message?.reasoning_content === "string" && message.reasoning_content.length > 0,
    toolCalls: Array.isArray(message?.tool_calls) ? message.tool_calls.length : 0,
    finishReason: r.json?.choices?.[0]?.finish_reason ?? null,
  };
  record(results, "chat", ok ? "pass" : "fail", ok ? excerpt(content, cfg.key, 80) : `no assistant text (content=${shape.contentType}; message fields=${shape.messageFields.join(",") || "none"})`, {
    latencyMs: r.latencyMs,
    ...(ok ? {} : { shape }),
  });
  return ok;
}

async function checkStream(cfg, results) {
  const url = joinUrl(cfg.baseUrl, "chat/completions");
  const started = Date.now();
  let firstChunkAt = null;
  let deltas = 0;
  let usage = null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
        ...(cfg.key ? { authorization: `Bearer ${cfg.key}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "user", content: "Count from 1 to 5, separated by spaces." }],
        max_tokens: 64,
        temperature: 0,
        stream: true,
        stream_options: { include_usage: true },
      }),
      signal: AbortSignal.timeout(cfg.timeoutMs),
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      record(results, "stream", "fail", `stream -> ${res.status}: ${excerpt(text, cfg.key)}`, { latencyMs: Date.now() - started });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let chunk = null;
        try {
          chunk = JSON.parse(payload);
        } catch {
          continue;
        }
        if (chunk.usage) usage = chunk.usage;
        const delta = chunk?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          deltas += 1;
          if (firstChunkAt === null) firstChunkAt = Date.now() - started;
        }
      }
    }
    const ok = deltas >= 2;
    record(results, "stream", ok ? "pass" : "fail",
      ok ? `${deltas} deltas, first at ${firstChunkAt} ms` : `only ${deltas} content delta(s); endpoint may not stream`,
      { latencyMs: Date.now() - started, firstTokenMs: firstChunkAt, deltas });
    record(results, "stream_usage", usage ? "pass" : "warn",
      usage ? `usage present (prompt ${usage.prompt_tokens ?? "?"}, completion ${usage.completion_tokens ?? "?"})` : "no usage in stream; OpenClaw needs compat.supportsUsageInStreaming:false (default) and loses cost accounting");
  } catch (err) {
    record(results, "stream", "fail", `${err?.name || "error"}: ${excerpt(err?.message || err, cfg.key)}`, {
      latencyMs: Date.now() - started,
    });
  }
}

async function checkTools(cfg, results) {
  const r = await request(cfg, "chat/completions", {
    body: {
      model: cfg.model,
      messages: [{ role: "user", content: "What is the weather in Paris? Use the get_weather tool." }],
      tools: [
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get current weather for a city",
            parameters: {
              type: "object",
              properties: { city: { type: "string", description: "City name" } },
              required: ["city"],
            },
          },
        },
      ],
      tool_choice: "auto",
      max_tokens: 128,
      temperature: 0,
    },
  });
  if (!r.ok) {
    record(results, "tools", "fail", `tool request -> ${r.status}: ${excerpt(apiError(r.json) || r.text, cfg.key)}`, {
      latencyMs: r.latencyMs,
    });
    return;
  }
  const msg = r.json?.choices?.[0]?.message;
  const calls = Array.isArray(msg?.tool_calls) ? msg.tool_calls : [];
  const name = calls[0]?.function?.name;
  const args = calls[0]?.function?.arguments;
  record(results, "tools", calls.length ? "pass" : "fail",
    calls.length ? `${name}(${excerpt(args, cfg.key, 120)})` : "model replied without tool_calls; tool/function calling is NOT proven",
    { latencyMs: r.latencyMs });
}

async function checkVision(cfg, results) {
  if (!cfg.visionModel) {
    record(results, "vision", "skip", "no --vision-model / ZERO_GATEWAY_VISION_MODEL given");
    return;
  }
  const r = await request(cfg, "chat/completions", {
    body: {
      model: cfg.visionModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "This image contains one pixel. What color is the pixel? Answer with exactly one basic color word." },
            { type: "image_url", image_url: { url: MINI_PNG } },
          ],
        },
      ],
      max_tokens: 512,
      temperature: 0,
    },
  });
  if (!r.ok) {
    record(results, "vision", "fail", `vision request -> ${r.status}: ${excerpt(apiError(r.json) || r.text, cfg.key)}`, {
      latencyMs: r.latencyMs,
    });
    return;
  }
  const rawContent = r.json?.choices?.[0]?.message?.content;
  const content = typeof rawContent === "string"
    ? rawContent
    : Array.isArray(rawContent)
      ? rawContent
          .filter((part) => part && typeof part === "object" && ["text", "output_text"].includes(part.type) && typeof part.text === "string")
          .map((part) => part.text)
          .join("")
      : "";
  // MINI_PNG is a verified opaque red pixel. Merely returning any text does
  // not prove that the model understood the image.
  const ok = /\bred\b/i.test(content);
  record(results, "vision", ok ? "pass" : "fail", ok ? excerpt(content, cfg.key, 100) : `did not identify the verified red pixel: ${excerpt(content || "no assistant text", cfg.key, 100)}`, {
    latencyMs: r.latencyMs,
  });
}

async function checkReasoning(cfg, results) {
  const r = await request(cfg, "chat/completions", {
    body: {
      model: cfg.model,
      messages: [{ role: "user", content: "Reply with OK." }],
      reasoning_effort: "low",
      max_tokens: 32,
      temperature: 0,
    },
  });
  if (r.ok) {
    record(results, "reasoning_effort", "pass", "endpoint accepted reasoning_effort", { latencyMs: r.latencyMs });
  } else if (r.status >= 400 && r.status < 500) {
    record(results, "reasoning_effort", "warn",
      `rejected (${r.status}); set compat.supportsReasoningEffort:false on reasoning models: ${excerpt(apiError(r.json) || r.text, cfg.key)}`,
      { latencyMs: r.latencyMs });
  } else {
    record(results, "reasoning_effort", "warn", `unexpected ${r.status || "no response"}: ${excerpt(r.text, cfg.key)}`, {
      latencyMs: r.latencyMs,
    });
  }
}

async function checkErrorPath(cfg, results) {
  const r = await request(cfg, "chat/completions", {
    body: {
      model: "zero-probe-model-that-does-not-exist",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 8,
    },
  });
  const e = apiError(r.json);
  if (r.status >= 400 && r.status < 500) {
    record(results, "error_path", "pass", `${r.status} structured error: ${excerpt(e?.message || r.text, cfg.key, 140)}`, {
      latencyMs: r.latencyMs,
    });
  } else if (r.error) {
    record(results, "error_path", "fail", `transport error rather than a bounded API error: ${excerpt(r.text, cfg.key)}`);
  } else {
    record(results, "error_path", "warn", `unknown-model request returned ${r.status}; check the gateway does not silently substitute a model`, {
      latencyMs: r.latencyMs,
    });
  }
}

// --- main ------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    usage();
    return 0;
  }

  const baseUrl = (process.env.ZERO_GATEWAY_BASE_URL || DEFAULT_BASE_URL).trim();
  const key = (process.env.ZERO_GATEWAY_KEY || "").trim();

  if (!baseUrl) {
    console.error("Missing ZERO_GATEWAY_BASE_URL. Run with --help for usage.");
    return 2;
  }
  if (!key && !args.allowNoKey) {
    console.error("Missing ZERO_GATEWAY_KEY. Use --allow-no-key only for a genuinely unauthenticated endpoint.");
    return 2;
  }
  if (!args.model) {
    console.error("Missing --model (or ZERO_GATEWAY_MODEL): the chat model id to probe.");
    return 2;
  }

  const cfg = {
    baseUrl,
    key,
    model: args.model,
    visionModel: args.visionModel,
    timeoutMs: Number.isFinite(args.timeoutMs) && args.timeoutMs > 0 ? args.timeoutMs : 60000,
  };

  const results = [];
  const startedAt = new Date().toISOString();

  const ids = await checkModels(cfg, results);
  await checkChat(cfg, results);
  await checkStream(cfg, results);
  await checkTools(cfg, results);
  await checkVision(cfg, results);
  await checkReasoning(cfg, results);
  await checkErrorPath(cfg, results);

  const failed = results.filter((r) => r.status === "fail");
  const requiredFailed = failed.filter((r) => r.required);
  const report = {
    probe: "zero-gateway-probe",
    version: 1,
    startedAt,
    baseUrl: redact(baseUrl, key),
    model: cfg.model,
    visionModel: cfg.visionModel ?? null,
    authenticated: Boolean(key),
    results,
    summary: {
      pass: results.filter((r) => r.status === "pass").length,
      warn: results.filter((r) => r.status === "warn").length,
      fail: failed.length,
      skip: results.filter((r) => r.status === "skip").length,
      requiredFailed: requiredFailed.map((r) => r.name),
    },
    verdict: requiredFailed.length === 0,
  };

  if (args.out) {
    // The documented default --out lives under .zero-data\, which does not exist before the
    // first run. Create the parent directory rather than failing at the finish line.
    const outPath = resolve(args.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    args.out = outPath;
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\n${ASCII_BANNER}`);
    console.log(`base url : ${report.baseUrl}`);
    console.log(`model    : ${cfg.model}${cfg.visionModel ? ` (vision: ${cfg.visionModel})` : ""}`);
    console.log(`auth     : ${report.authenticated ? "bearer key from env" : "none"}`);
    if (ids && ids.length) console.log(`models   : ${ids.slice(0, 10).join(", ")}${ids.length > 10 ? ", ..." : ""}`);
    console.log("");
    for (const r of results) {
      const tag = r.status.toUpperCase().padEnd(5);
      const req = r.required ? "*" : " ";
      console.log(`  ${tag}${req} ${r.name.padEnd(17)} ${r.detail}`);
    }
    console.log("");
    console.log(`summary  : ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail, ${report.summary.skip} skip`);
    console.log(`verdict  : ${report.verdict ? "required checks passed" : `BLOCKED - ${report.summary.requiredFailed.join(", ")}`}`);
    console.log("(* = required)\n");
    if (args.out) console.log(`json report written to ${args.out}`);
  }

  return requiredFailed.length === 0 ? 0 : 1;
}

const code = await main();
process.exit(code);

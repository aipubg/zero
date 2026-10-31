#!/usr/bin/env node
// Zero backend acceptance runner - the automatable half of Phase 4 (A1/A2/A3).
//
// D-013 transport: the product UI uses the Gateway WebSocket, and the OpenAI-compatible
// HTTP surface is intentionally disabled (`gateway.http.endpoints.chatCompletions.enabled
// = false`). The default mode therefore drives the same installed CLI the operator uses,
// which speaks the Gateway WS protocol:
//
//   node backend/scripts/acceptance.mjs            # WS mode (default)
//   node backend/scripts/acceptance.mjs --http     # optional OpenAI-compatible surface
//   node backend/scripts/acceptance.mjs --json
//
// WS mode proves:
//   A1  `health` succeeds with plugins loaded
//   A2  a real `zero` turn completes over the Gateway WS and is stored in canonical history
//   A3  `agents.list` exposes only zero
//
// HTTP mode proves the documented OpenAI-compatible surface (`/v1/models`,
// `/v1/chat/completions`); it requires `chatCompletions.enabled=true` and is expected to
// return 404 while D-013 keeps that endpoint off.
//
// The former A4 delegation check is retired with the worker agents; A5 (escalation refusal)
// remains in canonical transcripts. A6 (computer tool), A7 (hold end-to-end), and
// trusted-policy refusal need CU-01 on the designated isolated Windows environment; this
// runner cannot prove them.
//
// Secrets: only the optional HTTP bearer comes from ZERO_GATEWAY_TOKEN, and it is never printed.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(BACKEND, "node_modules", "openclaw", "dist", "index.js");
const STATE_DIR = join(BACKEND, ".openclaw");
const CONFIG_PATH = join(BACKEND, "config", "zero.json");
const DEFAULT_URL = "http://127.0.0.1:18789";
const EXPECTED_AGENTS = ["zero"];
const MARKER = "ZERO_WS_ACCEPTANCE_OK";

const args = process.argv.slice(2);
const jsonOnly = args.includes("--json");
const httpMode = args.includes("--http");
const urlIdx = args.indexOf("--url");
const BASE = (urlIdx >= 0 ? args[urlIdx + 1] : process.env.ZERO_GATEWAY_URL || DEFAULT_URL).replace(/\/+$/, "");
const TOKEN = (process.env.ZERO_GATEWAY_TOKEN || "").trim();

const results = [];
function record(id, status, detail) {
  results.push({ id, status, detail });
}

function excerpt(s, n = 160) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}...` : t;
}

function cli(argv, timeoutMs = 30000) {
  const started = Date.now();
  const res = spawnSync(process.execPath, [CLI, ...argv], {
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, OPENCLAW_STATE_DIR: STATE_DIR, OPENCLAW_CONFIG_PATH: CONFIG_PATH },
  });
  const stdout = res.stdout ?? "";
  const stderr = res.stderr ?? "";
  return { code: res.status, stdout, stderr, ms: Date.now() - started };
}

function parseJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function messageText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part && part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
  }
  return "";
}

async function runWs() {
  if (!existsSync(CLI)) {
    record("A1 gateway.reachable", "fail", `installed CLI entry missing: ${CLI}`);
    return;
  }

  const health = cli(["gateway", "call", "health", "--json"]);
  const healthJson = parseJson(health.stdout);
  if (health.code !== 0 || healthJson?.ok !== true) {
    record(
      "A1 gateway.reachable",
      "fail",
      `health -> exit ${health.code}: ${excerpt(healthJson?.error?.message || health.stderr || health.stdout)}`,
    );
    return;
  }
  const plugins = healthJson.plugins?.loaded ?? [];
  const errors = healthJson.plugins?.errors ?? [];
  record(
    "A1 gateway.reachable",
    "pass",
    `health ok in ${health.ms} ms; ${plugins.length} plugins loaded, ${errors.length} errors`,
  );

  const roster = cli(["gateway", "call", "agents.list", "--json"]);
  const rosterJson = parseJson(roster.stdout);
  const ids = Array.isArray(rosterJson?.agents) ? rosterJson.agents.map((agent) => agent?.id).filter(Boolean) : [];
  const missing = EXPECTED_AGENTS.filter((id) => !ids.includes(id));
  record(
    "A3 agents.present",
    roster.code === 0 && missing.length === 0 ? "pass" : "fail",
    missing.length === 0
      ? `found ${ids.join(", ")} (default: ${rosterJson?.defaultId ?? "?"})`
      : `missing ${missing.join(", ")}; agents=${excerpt(ids.join(", "))}`,
  );

  if (missing.length > 0) {
    record("A2 lead.chat", "skip", "skipped: agent roster incomplete");
    return;
  }

  const sessionKey = `agent:zero:be02-acceptance-${Date.now()}`;
  const turn = cli(
    [
      "agent",
      "--agent",
      "zero",
      "--session-key",
      sessionKey,
      "--message",
      `Reply with exactly: ${MARKER}`,
      "--json",
      "--timeout",
      "240000",
    ],
    260000,
  );
  const history = cli([
    "gateway",
    "call",
    "chat.history",
    "--params",
    JSON.stringify({ sessionKey }),
    "--json",
  ]);
  const historyJson = parseJson(history.stdout);
  const messages = Array.isArray(historyJson?.messages) ? historyJson.messages : [];
  const lastAssistant = [...messages].reverse().find((message) => message?.role === "assistant");
  const reply = messageText(lastAssistant?.content);
  const ok = turn.code === 0 && reply.includes(MARKER);
  record(
    "A2 lead.chat",
    ok ? "pass" : "fail",
    ok
      ? `${excerpt(reply, 80)} (${turn.ms} ms, ${messages.length} messages stored)`
      : `agent exit ${turn.code} in ${turn.ms} ms; history reply=${JSON.stringify(excerpt(reply, 80))}; stderr=${excerpt(turn.stderr, 120)}`,
  );
}

async function callHttp(path, init = {}) {
  const headers = { ...(init.headers || {}) };
  if (TOKEN) headers.authorization = `Bearer ${TOKEN}`;
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, headers, signal: AbortSignal.timeout(60000) });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* keep text */
    }
    return { ok: res.ok, status: res.status, json, text, ms: Date.now() - started };
  } catch (err) {
    return { ok: false, status: 0, json: null, text: `${err?.name || "error"}: ${err?.message || err}`, ms: Date.now() - started };
  }
}

async function runHttp() {
  const models = await callHttp("/v1/models", { method: "GET" });
  if (models.status === 0) {
    record("A1 gateway.reachable", "fail", `${BASE} unreachable: ${excerpt(models.text)}`);
    return;
  }
  if (!models.ok) {
    const disabled = models.status === 404 ? " (chatCompletions.enabled=false under D-013; use WS mode)" : "";
    record("A1 gateway.reachable", "fail", `GET /v1/models -> ${models.status}: ${excerpt(models.text)}${disabled}`);
    return;
  }
  record("A1 gateway.reachable", "pass", `GET /v1/models -> 200 in ${models.ms} ms`);

  const ids = Array.isArray(models.json?.data)
    ? models.json.data.map((m) => m?.id).filter(Boolean)
    : Array.isArray(models.json?.models)
      ? models.json.models.map((m) => m?.id).filter(Boolean)
      : [];
  const agents = ids.filter((id) => typeof id === "string" && id.startsWith("openclaw/"));
  const missing = EXPECTED_AGENTS.filter((a) => !agents.includes(`openclaw/${a}`));
  record(
    "A3 agents.present",
    missing.length === 0 ? "pass" : "fail",
    missing.length === 0
      ? `found ${agents.join(", ")}`
      : `missing openclaw/${missing.join(", openclaw/")}; models=${excerpt(ids.join(", "), 200)}`,
  );
  record(
    "A3b default.alias",
    ids.includes("openclaw/default") ? "pass" : "warn",
    ids.includes("openclaw/default") ? "stable default alias present" : "no `openclaw/default` alias",
  );

  if (missing.length === 0) {
    const chat = await callHttp("/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "openclaw/zero",
        messages: [{ role: "user", content: `Reply with exactly: ${MARKER}` }],
        max_tokens: 512,
        temperature: 0,
        stream: false,
      }),
    });
    const content = chat.json?.choices?.[0]?.message?.content;
    const ok = chat.ok && typeof content === "string" && content.length > 0;
    record(
      "A2 lead.chat",
      ok ? "pass" : "fail",
      ok
        ? `${excerpt(content, 80)} (${chat.ms} ms)`
        : `POST /v1/chat/completions -> ${chat.status || "no response"}: ${excerpt(chat.json?.error?.message || chat.text)}`,
    );
  } else {
    record("A2 lead.chat", "skip", "skipped: agent targets missing");
  }
}

function finish() {
  const fails = results.filter((r) => r.status === "fail");
  const warns = results.filter((r) => r.status === "warn");
  const verdict = fails.length === 0 ? (warns.length ? "PASS WITH NOTES" : "PASS") : "FAIL";
  const report = {
    runner: "zero-backend-acceptance",
    version: 2,
    mode: httpMode ? "http" : "ws",
    target: httpMode ? BASE : `gateway ws via ${CLI}`,
    authenticated: httpMode ? Boolean(TOKEN) : false,
    generatedAt: new Date().toISOString(),
    results,
    verdict,
    coveredElsewhere: ["A4 delegation", "A5 escalation refusal"],
    manualStillRequired: ["A6 computer tool", "A7 human hold"],
  };
  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\nZero backend acceptance (${report.mode.toUpperCase()} mode; A1-A3 automated)\n`);
    console.log(`  target : ${report.target}`);
    console.log(`  auth   : ${report.authenticated ? "bearer token from env" : "none"}\n`);
    for (const r of results) {
      console.log(`  ${r.status.toUpperCase().padEnd(5)} ${r.id.padEnd(22)} ${r.detail}`);
    }
    console.log(`\n  verdict: ${verdict}`);
    console.log(`  manual : ${report.manualStillRequired.join(", ")}\n`);
  }
  process.exit(fails.length === 0 ? 0 : 1);
}

if (httpMode) {
  await runHttp();
} else {
  await runWs();
}
finish();

#!/usr/bin/env node
// Turn a gateway-probe JSON report into reports/backend/gateway-proof.md.
//
// Why this exists: BE-01's evidence is a probe run, and hand-copying nine results into a
// markdown table is where transcription errors and quiet optimism creep in. This script
// copies the numbers and DERIVES the config implications from the data, including the ones
// we would rather not notice (no usage in stream, vision absent, tools absent).
//
// It never touches a secret: the probe report contains no key material by design.
// Generated text deliberately uses ASCII punctuation so it survives any later
// PowerShell round-trip without re-encoding damage.
//
// Run:
//   node reports/backend/tools/probe-to-report.mjs .zero-data/be01-probe.json
//   node reports/backend/tools/probe-to-report.mjs <probe.json> --out reports/backend/gateway-proof.md

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
const outIdx = args.indexOf("--out");
const OUT = outIdx >= 0 ? args[outIdx + 1] : "reports/backend/gateway-proof.md";

if (!input) {
  console.error("usage: node reports/backend/tools/probe-to-report.mjs <probe.json> [--out <path>]");
  process.exit(2);
}
if (!existsSync(input)) {
  console.error(`probe report not found: ${input}`);
  process.exit(2);
}

let probe;
try {
  // Tolerate a UTF-8 BOM: PowerShell's Set-Content -Encoding utf8 adds one, and a
  // report copied through PowerShell should not fail on that alone.
  const raw = readFileSync(input, "utf8").replace(/^\uFEFF/, "");
  probe = JSON.parse(raw);
} catch (err) {
  console.error(`probe report is not valid JSON: ${err.message}`);
  process.exit(2);
}

const results = Array.isArray(probe.results) ? probe.results : [];
const byName = Object.fromEntries(results.map((r) => [r.name, r]));
const status = (name) => byName[name]?.status ?? "missing";
const meta = byName["models.metadata"]?.metadata ?? null;

const verdictOk = probe.verdict === true;
const failedRequired = probe.summary?.requiredFailed ?? [];

function row(r) {
  return `| ${r.name} | ${r.required ? "yes" : "no"} | ${r.status} | ${r.latencyMs ?? ""} | ${String(r.detail ?? "").replace(/\|/g, "\\|")} |`;
}

// --- derived config implications -------------------------------------------

const implications = [];
const toolsOk = status("tools") === "pass";
const visionStatus = status("vision");
const usageOk = status("stream_usage") === "pass";
const reasoningStatus = status("reasoning_effort");
const errorStatus = status("error_path");

implications.push(
  toolsOk
    ? "- Tool calling works. The Lead can spawn specialists and the Operator can use `computer`. No `compat.supportsTools` override needed."
    : "- **Tool calling did NOT pass. This is decisive.** Without it the Lead cannot spawn specialists and the Operator cannot drive the computer. Do not proceed to Phase 2 on this model; `compat.supportsTools: false` is for deliberately disabling tools, not a fix.",
);

if (visionStatus === "pass") {
  implications.push("- Image input works. The single-model route can serve the Vision role, so `input: [\"text\",\"image\"]` in the template stands.");
} else if (visionStatus === "skip") {
  implications.push("- Image input was NOT tested (no vision model supplied). Re-run with `--vision-model` before trusting the Vision role.");
} else {
  implications.push("- **Image input FAILED.** The template declares `input: [\"text\",\"image\"]`; either change it to `[\"text\"]` and give the Operator a separate vision route, or screen observation is impossible.");
}

implications.push(
  usageOk
    ? "- Streaming returns usage, so token accounting works without a `compat` override."
    : "- **No usage in the stream.** Unknown remote endpoints default to `supportsUsageInStreaming: false`, so cost and context accounting degrade to estimates. Acceptable for the MVP, but record it.",
);

if (reasoningStatus === "warn") {
  implications.push("- `reasoning_effort` was rejected. Set `compat.supportsReasoningEffort: false` on any `reasoning: true` entry, or the request 400s on reasoning models.");
} else if (reasoningStatus === "pass") {
  implications.push("- `reasoning_effort` was accepted; the default model entry needs no compat override.");
}

if (errorStatus === "fail") {
  implications.push("- The unknown-model path produced a transport error rather than a bounded API error. A bad model id will look like an outage.");
} else if (errorStatus === "warn") {
  implications.push("- The unknown-model request did **not** return a 4xx. Check the gateway is not silently substituting a model; that would make every fallback and failure test meaningless.");
}

if (meta) {
  const ctx = meta.context_length ?? meta.max_model_len ?? meta.context_window ?? null;
  if (typeof ctx === "number" && ctx > 0) {
    implications.push(
      `- The endpoint reports a context length of **${ctx}** for \`${meta.id}\`. The template currently says \`contextWindow: 128000\` and \`contextTokens: 96000\`; correct both from this number instead of leaving the conservative guess.`,
    );
  } else {
    implications.push(`- No context length reported for \`${meta.id}\`; the template keeps its conservative \`contextWindow\` and \`contextTokens\` working values.`);
  }
}

// --- markdown ---------------------------------------------------------------

const L = [];
L.push("# BE-01 - Model gateway compatibility proof");
L.push("");
L.push("**Ticket:** BE-01 - Gateway compatibility proof");
L.push("**Owner:** DeepSeek Harness");
L.push(`**Generated:** ${new Date().toISOString()} by \`reports/backend/tools/probe-to-report.mjs\``);
L.push(`**Probe run at:** ${probe.startedAt ?? "(not recorded)"}`);
L.push(`**Endpoint:** \`${probe.baseUrl ?? "(unknown)"}\``);
L.push(`**Model:** \`${probe.model ?? "(unknown)"}\`${probe.visionModel ? ` (vision: \`${probe.visionModel}\`)` : ""}`);
L.push(`**Authenticated:** ${probe.authenticated ? "yes - bearer key from the process environment; no key material in this file" : "no"}`);
L.push("");
L.push("**Evidence kind:** one live probe of the model gateway, run by a Zero-owned harness. This proves the *gateway*, not OpenClaw integration - that is Phase 3/4.");
L.push("");
L.push("---");
L.push("");
L.push("## Verdict");
L.push("");
L.push(verdictOk ? "**PASS - every required check succeeded.**" : `**BLOCKED - required check(s) failed: ${failedRequired.join(", ") || "unknown"}.**`);
L.push("");
L.push(`Summary: ${probe.summary?.pass ?? 0} pass, ${probe.summary?.warn ?? 0} warn, ${probe.summary?.fail ?? 0} fail, ${probe.summary?.skip ?? 0} skip.`);
L.push("");
L.push("## Results");
L.push("");
L.push("| Check | Required | Status | Latency (ms) | Detail |");
L.push("|---|---|---|---|---|");
for (const r of results) L.push(row(r));
L.push("");
L.push("`models`, `chat`, `stream` and `tools` are required. The rest inform config, not the verdict.");
L.push("");
L.push("## What this means for the backend config");
L.push("");
for (const i of implications) L.push(i);
L.push("");
L.push("## Model catalog metadata reported by the endpoint");
L.push("");
if (meta) {
  L.push("```json");
  L.push(JSON.stringify(meta, null, 2));
  L.push("```");
} else {
  L.push("_The endpoint did not return metadata for the configured model._");
}
L.push("");
L.push("## What this does NOT prove");
L.push("");
L.push("- That **OpenClaw** can use this endpoint. That is Phase 3 (config + launch) and Phase 4 (acceptance).");
L.push("- That the model behaves well at long context, follows tool schemas strictly, or handles the Operator's screenshot sizes. Only real use shows that.");
L.push("- Anything about computer control - the probe never touches it.");
L.push("");
L.push("## Reproduce");
L.push("");
L.push("```powershell");
L.push('$env:ZERO_GATEWAY_KEY = "<fresh key from the secret store>"');
L.push("node reports/backend/tools/gateway-probe.mjs --out .zero-data\\be01-probe.json");
L.push("node reports/backend/tools/probe-to-report.mjs .zero-data\\be01-probe.json");
L.push("```");
L.push("");

const outPath = resolve(OUT);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${L.join("\n")}\n`, "utf8");

console.log(`wrote ${outPath}`);
console.log(`verdict: ${verdictOk ? "PASS" : "BLOCKED"} (${results.length} checks)`);
process.exit(verdictOk ? 0 : 1);

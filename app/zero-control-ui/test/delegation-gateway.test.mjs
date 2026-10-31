import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * Production delegation-gate tests.
 *
 * Reads the repository-owned production config template projection
 * (workers/tools/subagent edges only; no providers, credentials, or messages)
 * and calls the installed OpenClaw Gateway admission implementation
 * (`resolveSpawnAdmission`). This is the real target-policy seam, not a
 * test-local planner.
 *
 * The repository policy encodes the intended worker routing, but it cannot
 * prove that a live model follows it. That remains a live-prompt question.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(root, "..", "..");
const configPath = path.join(repoRoot, "zero-system", "config", "zero.json");
const policyPath = path.join(repoRoot, "backend", "agents", "zero", "delegation-policy.md");
const distDir = path.join(repoRoot, "backend", "node_modules", "openclaw", "dist");

function projectConfig(full) {
  const entries = Object.fromEntries(
    Object.entries(full?.agents?.entries ?? {}).map(([id, entry]) => [
      id,
      {
        name: entry?.name,
        workspace: entry?.workspace,
        tools: entry?.tools,
        subagents: entry?.subagents,
      },
    ]),
  );
  return {
    agents: {
      defaults: { subagents: full?.agents?.defaults?.subagents },
      entries,
    },
  };
}

async function loadSpawnAdmission() {
  const file = (await readdir(distDir)).find(
    (name) => name.startsWith("spawn-thread-binding-") && name.endsWith(".mjs"),
  );
  assert.ok(file, "installed Gateway spawn policy module is missing");
  const module = await import(pathToFileURL(path.join(distDir, file)).href);
  const admission = Object.values(module).find(
    (value) => typeof value === "function" && value.name === "resolveSpawnAdmission",
  );
  assert.ok(admission, "installed Gateway resolveSpawnAdmission export is missing");
  return admission;
}

test("production config template is zero-only and cannot spawn workers", async () => {
  const full = JSON.parse(await readFile(configPath, "utf8"));
  const cfg = projectConfig(full);
  const entries = Object.keys(cfg.agents.entries);
  assert.deepEqual(entries, ["zero"], "only Zero may be configured");
  const zero = cfg.agents.entries.zero;
  assert.deepEqual(zero.subagents?.allowAgents, []);
  assert.equal(zero.subagents?.requireAgentId, true);
  assert.ok(["full", "ask"].includes(zero.tools?.exec?.mode), "exec mode must be full or ask");
  assert.ok(zero.tools?.alsoAllow?.includes("computer"), "Zero must hold the computer tool");
  assert.equal(cfg.agents.defaults.subagents, undefined);

  const admission = await loadSpawnAdmission();
  const configuredAgentIds = entries;
  const call = (targetAgentId, requestedAgentId = targetAgentId) =>
    admission({
      cfg,
      requesterSessionKey: "agent:zero:main",
      requesterAgentId: "zero",
      targetAgentId,
      requestedAgentId,
      configuredAgentIds,
      // Read-only stub: the admission check otherwise reads the live run registry.
      countActiveRuns: () => 0,
    });

  for (const target of ["zero", "researcher", "operator", "missing"]) {
    const result = call(target);
    assert.equal(result.ok, false, `zero -> ${target} must be refused`);
    assert.match(result.error, /agentId is not allowed/);
  }

  const missingTarget = call("zero", "");
  assert.equal(missingTarget.ok, false);
  assert.match(missingTarget.error, /requires explicit agentId/);
});

test("repository-owned Zero policy is single-agent and delegation-free", async (t) => {
  const agents = await readFile(policyPath, "utf8");
  assert.ok(agents.trim().length > 0, "agent policy must be readable");
  assert.match(agents, /## Agent policy/);
  assert.match(agents, /only configured agent/i);
  assert.match(agents, /Do not spawn subagents or delegate/i);
  assert.match(agents, /computer tool/);
  assert.match(agents, /same Zero conversation/);
  assert.doesNotMatch(agents, /`researcher`|`operator`/i);
  t.diagnostic(`single-agent policy source: ${policyPath}`);
});

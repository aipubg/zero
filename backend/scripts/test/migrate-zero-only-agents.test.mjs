import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  ZERO_ONLY_UNSET_PATHS,
  assertZeroOnlyConfig,
  buildZeroOnlyPatch,
  modelSignature,
} from "../migrate-zero-only-agents.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const templatePath = join(here, "..", "..", "config", "zero.template.json");

function sampleConfig() {
  return {
    models: {
      providers: {
        nvidia: {
          baseUrl: "https://example.invalid/v1",
          api: "openai-completions",
          apiKey: { source: "store", provider: "default", id: "ZERO_KEY" },
          models: [{ id: "model-a" }],
        },
      },
    },
    agents: {
      defaults: {
        model: { primary: "nvidia/model-a", fallbacks: [] },
        utilityModel: "nvidia/model-a",
        subagents: { maxConcurrent: 2 },
      },
      entries: {
        zero: {
          name: "Zero",
          model: { primary: "nvidia/model-a", fallbacks: [] },
          tools: { profile: "coding", alsoAllow: ["read_file"], exec: { mode: "ask" } },
          subagents: { allowAgents: ["researcher", "operator"], requireAgentId: true },
        },
        researcher: { name: "Researcher" },
        operator: { name: "Operator", tools: { alsoAllow: ["computer"] } },
      },
    },
  };
}

test("zero-only patch removes workers, disables delegation, and grants computer", () => {
  const before = sampleConfig();
  const patch = buildZeroOnlyPatch(before);
  assert.deepEqual(ZERO_ONLY_UNSET_PATHS, [
    "agents.entries.researcher",
    "agents.entries.operator",
  ]);
  assert.equal(patch.agents.entries.researcher, undefined);
  assert.equal(patch.agents.entries.operator, undefined);
  assert.deepEqual(patch.agents.entries.zero.subagents.allowAgents, []);
  assert.equal(patch.agents.entries.zero.subagents.requireAgentId, true);
  assert.equal(patch.agents.defaults.subagents, null);
  assert.deepEqual(patch.agents.entries.zero.tools.alsoAllow, ["read_file", "computer"]);
});

test("the repository template is already zero-only and keeps computer on Zero", () => {
  const template = JSON.parse(readFileSync(templatePath, "utf8"));
  assertZeroOnlyConfig(template);
  assert.equal(template.agents.defaults.subagents, undefined);
});

test("model/provider signature ignores tool migration and rejects worker drift", () => {
  const before = sampleConfig();
  const after = {
    ...before,
    agents: {
      ...before.agents,
      defaults: { ...before.agents.defaults, subagents: undefined },
      entries: {
        zero: {
          ...before.agents.entries.zero,
          tools: { ...before.agents.entries.zero.tools, alsoAllow: ["read_file", "computer"] },
          subagents: { allowAgents: [], requireAgentId: true },
        },
      },
    },
  };
  assert.equal(modelSignature(after), modelSignature(before));
  assert.doesNotThrow(() => assertZeroOnlyConfig(after));

  const withWorker = { ...after, agents: { ...after.agents, entries: { ...after.agents.entries, researcher: {} } } };
  assert.throws(() => assertZeroOnlyConfig(withWorker), /expected only zero/);
});

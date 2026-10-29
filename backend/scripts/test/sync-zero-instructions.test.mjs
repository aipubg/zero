// Hermetic tests for the repository-owned Zero delegation policy and the
// AGENTS.md merge/sync path. Temporary workspaces only; no .zero-data access.

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";
import {
  MANAGED_BEGIN,
  MANAGED_END,
  buildManagedBlock,
  mergeManagedBlock,
  resolveWorkspace,
  syncZeroInstructions,
} from "../sync-zero-instructions.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const backend = join(here, "..", "..");
const policyPath = join(backend, "agents", "zero", "delegation-policy.md");
const tempRoot = mkdtempSync(join(tmpdir(), "zero-instructions-"));

after(() => {
  rmSync(tempRoot, { recursive: true, force: true });
});

let counter = 0;
function workspace() {
  const dir = join(tempRoot, `workspace-${counter++}`);
  const root = join(dir, "agents", "zero");
  mkdirSync(root, { recursive: true });
  return root;
}

test("repository policy is single-agent and delegation-free", () => {
  const policy = readFileSync(policyPath, "utf8");
  assert.match(policy, /## Agent policy/);
  assert.match(policy, /only configured agent/i);
  assert.match(policy, /Do not spawn subagents or delegate/i);
  assert.match(policy, /computer tool/);
  assert.match(policy, /same Zero conversation/);
  assert.match(policy, /Claude Code/);
  assert.match(policy, /native MCP/);
});

test("sync inserts one managed block and preserves owner content", () => {
  const root = workspace();
  const agentsPath = join(root, "AGENTS.md");
  const owner = "# Owner notes\n\nKeep this line.\n";
  writeFileSync(agentsPath, owner, "utf8");

  const first = syncZeroInstructions({ workspace: root, policyPath });
  assert.equal(first.changed, true);
  const text = readFileSync(agentsPath, "utf8");
  assert.match(text, /# Owner notes/);
  assert.match(text, /Keep this line\./);
  assert.equal(text.split(MANAGED_BEGIN).length - 1, 1);
  assert.equal(text.split(MANAGED_END).length - 1, 1);
  assert.match(text, /only configured agent/i);

  const second = syncZeroInstructions({ workspace: root, policyPath });
  assert.equal(second.changed, false, "second sync must be a no-op");
  assert.equal(readFileSync(agentsPath, "utf8"), text);
});

test("managed block updates without touching surrounding owner text", () => {
  const root = workspace();
  const agentsPath = join(root, "AGENTS.md");
  writeFileSync(agentsPath, "BEFORE\n", "utf8");
  syncZeroInstructions({ workspace: root, policyPath });

  const updatedPolicy = join(tempRoot, "updated-policy.md");
  writeFileSync(updatedPolicy, "## Delegation\n\nUPDATED_POLICY\n", "utf8");
  const result = syncZeroInstructions({
    workspace: root,
    policyPath: updatedPolicy,
  });
  assert.equal(result.changed, true);
  const text = readFileSync(agentsPath, "utf8");
  assert.match(text, /^BEFORE/);
  assert.match(text, /UPDATED_POLICY/);
  assert.doesNotMatch(text, /Research[^\n]*`researcher`/i);
  assert.equal(text.split(MANAGED_BEGIN).length - 1, 1);
});

test("malformed or duplicate markers are refused without writing", () => {
  const root = workspace();
  const agentsPath = join(root, "AGENTS.md");
  const malformed = `OWNER\n${MANAGED_BEGIN}\npartial\n`;
  writeFileSync(agentsPath, malformed, "utf8");

  assert.throws(
    () => syncZeroInstructions({ workspace: root, policyPath }),
    /malformed or duplicate/,
  );
  assert.equal(readFileSync(agentsPath, "utf8"), malformed);

  const duplicate = `${buildManagedBlock(readFileSync(policyPath, "utf8"))}\n${buildManagedBlock(
    readFileSync(policyPath, "utf8"),
  )}\n`;
  writeFileSync(agentsPath, duplicate, "utf8");
  assert.throws(
    () => syncZeroInstructions({ workspace: root, policyPath }),
    /malformed or duplicate/,
  );
  assert.equal(readFileSync(agentsPath, "utf8"), duplicate);
});

test("configured workspace resolves from a temp config and check mode writes nothing", () => {
  const root = workspace();
  const configPath = join(tempRoot, "openclaw.json");
  writeFileSync(
    configPath,
    JSON.stringify({ agents: { entries: { zero: { workspace: root } } } }),
    "utf8",
  );
  assert.equal(resolveWorkspace({ configPath }), root);

  const checked = syncZeroInstructions({ configPath, policyPath, check: true });
  assert.equal(checked.changed, true);
  assert.equal(existsSync(join(root, "AGENTS.md")), false);

  const written = syncZeroInstructions({ configPath, policyPath });
  assert.equal(written.changed, true);
  assert.equal(existsSync(join(root, "AGENTS.md")), true);
  const finalCheck = syncZeroInstructions({ configPath, policyPath, check: true });
  assert.equal(finalCheck.changed, false);
});

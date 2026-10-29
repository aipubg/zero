import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  FakeElement,
  installFakeDocument,
} from "./fake-dom.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sessionsUrl = pathToFileURL(path.join(root, "src/shared/sessions.js")).href;
const errorsUrl = pathToFileURL(path.join(root, "src/shared/errors.js")).href;

test("Gateway models surface mounts clean slate ready for new gateway", async () => {
  installFakeDocument();
  const { mountModelsPage } = await import(
    pathToFileURL(path.join(root, "src/pages/models.js")).href
  );

  const container = new FakeElement("div");
  const handle = mountModelsPage(container, {});
  assert.match(container.textContent, /Model Providers & Gateway/);
  assert.match(container.textContent, /Configure cloud model providers/);

  handle.dispose();
  assert.equal(container.children.length, 0);
});

test("pure session and error projections keep Gateway contracts stable", async () => {
  const sessions = await import(sessionsUrl);
  const errors = await import(errorsUrl);

  const now = Date.now();
  const rows = [
    {
      key: "agent:zero:main",
      agentId: "zero",
      displayName: "Primary",
      lastActivityAt: now,
    },
    {
      key: "agent:zero:child",
      agentId: "zero",
      label: "Delegated",
      spawnDepth: 1,
      lastActivityAt: now + 10_000,
    },
    {
      key: "agent:operator:main",
      agentId: "operator",
      displayName: "Desktop",
      hasActiveRun: true,
      lastActivityAt: now - 1000,
    },
  ];
  assert.equal(sessions.sessionTitle(rows[1]), "Delegated");
  assert.equal(sessions.isDelegated(rows[1]), true);
  assert.equal(sessions.isDelegated(rows[0]), false);
  assert.equal(sessions.latestSessionFor(rows, "zero").key, "agent:zero:main");
  assert.deepEqual(sessions.sessionActivityCounts(rows, "zero"), {
    active: 0,
    delegated: 1,
    total: 2,
  });
  assert.equal(sessions.surfaceHref({ basePath: "/ui" }, "/chat"), "/ui/chat");
  assert.equal(sessions.surfaceHref({}, "/chat"), "/chat");
  assert.equal(sessions.agentRole({ id: "zero", name: "Zero" }), "Lead");
  assert.equal(sessions.agentRole({ id: "researcher" }), "Researcher");
  assert.equal(sessions.agentRole({ id: "operator" }), "Operator");
  assert.equal(sessions.roleRank("Lead"), 0);
  assert.equal(sessions.roleRank("Operator"), 2);
  assert.equal(sessions.roleRank("Unknown"), 3);

  assert.equal(errors.readableError(new Error("boom")), "boom");
  assert.equal(errors.readableError(null), "Unknown error");
  assert.equal(errors.isMissingMethod(new Error("unknown method: zero.ui.x")), true);
  assert.equal(errors.isMissingMethod(new Error("UNAUTHORIZED")), false);
  assert.equal(errors.testFailureDetail({ ok: true, message: " probe failed " }), "probe failed");
  assert.equal(errors.testFailureDetail({ error: { message: "nested" } }), "nested");
  assert.equal(errors.testFailureDetail({}), "");
});

test("built native bundle contains no CopilotKit product path", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "dist/openclaw.plugin.json"), "utf8"),
  );
  const bundle = await readFile(path.join(root, manifest.controlUi.entry), "utf8");
  assert.doesNotMatch(bundle, /copilotkit|@ag-ui|Failed to fetch threads/i);
  assert.match(bundle, /Model Gateway/);
  assert.match(bundle, /Private assistant for local Gateway-backed work/);
  assert.match(bundle, /openclaw-model-providers-page/);
  assert.match(bundle, /openclaw-about-page/);
});

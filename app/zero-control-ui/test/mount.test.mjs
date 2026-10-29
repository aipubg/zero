import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FakeElement, installFakeDocument } from "./fake-dom.mjs";
import {
  createZeroUiRuntimeHandlers,
  registerZeroUiRuntime,
  METHODS,
} from "../runtime-core.mjs";
import {
  createConnectorStatus,
  applyConnectorCatalog,
} from "../src/shared/connectors.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Zero Providers surface mounts and connects to gateway", async () => {
  installFakeDocument();
  const { mountModelsPage } = await import(
    pathToFileURL(path.join(root, "src/pages/models.js")).href
  );

  const container = new FakeElement("div");
  const handle = mountModelsPage(container, {});
  assert.equal(typeof handle.dispose, "function");
  assert.match(container.textContent, /Model Providers & Gateway/);
  assert.match(container.textContent, /Configure cloud model providers/);

  handle.dispose();
  assert.equal(container.children.length, 0);
});

test("Runtime registration wires integration status and observation methods", async () => {
  const registered = [];
  const methods = new Map();
  const tools = [];

  const fakeApi = {
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    registerGatewayMethod: (name, handler, opts) => {
      registered.push(name);
      methods.set(name, { handler, opts });
    },
    registerTool: (tool) => {
      tools.push(tool);
    },
    runtime: {
      config: { current: () => ({}) },
      state: {
        openKeyedStore: () => ({
          lookup: async () => null,
          register: async () => {},
          delete: async () => true,
          entries: async () => [],
        }),
      },
    },
  };

  const result = registerZeroUiRuntime(fakeApi, {
    cliStatus: async () => [],
    initializeObservation: false,
  });

  assert.ok(result.registered.includes("zero.integrations.cli.status"));
  assert.ok(result.registered.includes("zero.integrations.connectors.status"));
  assert.ok(result.registered.includes("zero.observation.status"));
  assert.ok(result.registered.includes("zero.observation.control"));
  assert.ok(result.registered.includes("zero.observation.recent"));
});

test("PM-06 integration status: CLI discovery, connector MCP status, validation, redaction", async () => {
  const cli = [
    {
      id: "claude",
      label: "Claude Code",
      available: true,
      version: "1.0.0",
      error: null,
      nativeProvider: "claude-cli",
      nativeDispatch: false,
    },
  ];

  const handlers = createZeroUiRuntimeHandlers({
    cliStatus: async () => cli,
    getConfig: () => ({
      mcp: { servers: { notion: { headers: { Authorization: "Bearer secret" } } } },
    }),
  });
  const responses = [];
  const respond = (ok, payload, error) => responses.push({ ok, payload, error });
  await handlers[METHODS.cliStatus]({ params: {}, respond });
  await handlers[METHODS.connectorStatus]({ params: {}, respond });
  assert.equal(responses[0].ok, true);
  assert.equal(responses[1].ok, true);
  assert.equal(
    responses[1].payload.connectors.find((row) => row.id === "notion").configured,
    true,
  );
  assert.doesNotMatch(JSON.stringify(responses), /Bearer|secret/i);

  await handlers[METHODS.cliStatus]({ params: { extra: true }, respond });
  assert.equal(responses.at(-1).ok, false);
  assert.equal(responses.at(-1).error.code, "zero-control-ui:bad-request");

  const unavailableConfig = createZeroUiRuntimeHandlers({
    cliStatus: async () => cli,
    getConfig: () => {
      throw new Error("secret config");
    },
  });
  const configResponse = [];
  await unavailableConfig[METHODS.connectorStatus]({
    params: {},
    respond: (ok, payload, error) => configResponse.push({ ok, payload, error }),
  });
  assert.equal(configResponse[0].ok, true);
  assert.equal(
    configResponse[0].payload.connectors.every((row) => row.configured === false),
    true,
  );
  assert.doesNotMatch(JSON.stringify(configResponse), /secret/i);
});

test("OMB connector projection: cached native MCP capabilities are bounded and secret-free", async () => {
  const config = {
    mcp: {
      servers: {
        gmail: { url: "https://secret.invalid", headers: { Authorization: "Bearer secret" } },
        slack: { command: "slack-mcp" },
      },
    },
  };
  const catalog = {
    groups: [
      {
        id: "mcp",
        source: "mcp",
        tools: [
          { source: "mcp", mcpServer: "gmail", mcpToolName: "search_threads", id: "gmail__search_threads" },
          { source: "mcp", mcpServer: "gmail", mcpToolName: "send_email", id: "gmail__send_email" },
          { source: "mcp", mcpServer: "gmail", mcpToolName: "bad name https://secret", id: "bad" },
          { source: "mcp", mcpServer: "gmail", mcpToolName: "b".repeat(90), id: "too-long" },
        ],
      },
    ],
    notices: [
      { id: "mcp-not-yet-connected", servers: ["slack"], message: "https://secret.invalid" },
    ],
  };

  const configuredOnly = createConnectorStatus(config);
  assert.equal(configuredOnly.find((row) => row.id === "gmail").catalogStatus, "not-requested");
  assert.equal(configuredOnly.find((row) => row.id === "github").catalogStatus, "not-configured");

  const projected = createConnectorStatus(config, catalog);
  const gmail = projected.find((row) => row.id === "gmail");
  const slack = projected.find((row) => row.id === "slack");
  const github = projected.find((row) => row.id === "github");
  assert.deepEqual(gmail.tools, ["search_threads", "send_email"]);
  assert.equal(gmail.catalogStatus, "listed");
  assert.equal(gmail.capabilityCount, 2);
  assert.equal(gmail.reachable, null);
  assert.equal(gmail.transport, "sse", "omitted remote transport uses the installed runtime fallback");
  assert.equal(gmail.auth, "none");
  assert.equal(gmail.status, "ready");
  assert.equal(slack.catalogStatus, "not-connected");
  assert.equal(slack.transport, "stdio");
  assert.equal(github.catalogStatus, "not-configured");
  assert.equal(projected.every((row) => row.reachable === null), true);
  assert.doesNotMatch(JSON.stringify(projected), /secret|Bearer|https:|launch|diagnostic/i);
});

test("observation runtime handlers expose bounded status, control, and recent rows", async () => {
  const calls = [];
  const engine = {
    state: { state: "idle", enabled: false, privateMode: false, ring: { frames: 0, bytes: 0 }, queue: { pending: 0 }, counters: {} },
    status() {
      return this.state;
    },
    async start() {
      calls.push("start");
      this.state = { ...this.state, enabled: true, state: "capturing" };
    },
    async stop() {
      calls.push("stop");
      this.state = { ...this.state, enabled: false, state: "stopped" };
    },
    async setPrivateMode(value) {
      calls.push(value ? "private-on" : "private-off");
      this.state = { ...this.state, privateMode: value, state: value ? "private" : "idle" };
    },
    recent({ limit }) {
      calls.push(["recent", limit]);
      return [{ id: 1, summary: "local summary" }];
    },
  };
  const handlers = createZeroUiRuntimeHandlers({ getObservationEngine: () => engine });
  const responses = [];
  const respond = (ok, payload, error) => responses.push({ ok, payload, error });

  await handlers[METHODS.observationStatus]({ params: {}, respond });
  assert.equal(responses[0].ok, true);
  assert.equal(responses[0].payload.state, "idle");

  await handlers[METHODS.observationControl]({ params: { action: "start" }, respond });
  assert.equal(responses[1].payload.enabled, true);
  await handlers[METHODS.observationControl]({ params: { action: "private-on" }, respond });
  assert.equal(responses[2].payload.privateMode, true);
  await handlers[METHODS.observationControl]({ params: { action: "private-off" }, respond });
  assert.equal(responses[3].payload.privateMode, false);
  await handlers[METHODS.observationControl]({ params: { action: "stop" }, respond });
  assert.equal(responses[4].payload.enabled, false);
  assert.deepEqual(calls, ["start", "private-on", "private-off", "stop"]);

  await handlers[METHODS.observationControl]({ params: { action: "erase" }, respond });
  assert.equal(responses.at(-1).ok, false);
  assert.match(responses.at(-1).error.message, /must be one of/);
  await handlers[METHODS.observationControl]({ params: { action: "start", extra: true }, respond });
  assert.equal(responses.at(-1).ok, false);
  assert.match(responses.at(-1).error.message, /rejected unexpected key/);

  await handlers[METHODS.observationRecent]({ params: { limit: 2 }, respond });
  assert.equal(responses.at(-1).ok, true);
  assert.deepEqual(responses.at(-1).payload.observations, [{ id: 1, summary: "local summary" }]);
  assert.deepEqual(calls.at(-1), ["recent", 2]);
  await handlers[METHODS.observationRecent]({ params: { limit: 0 }, respond });
  assert.equal(responses.at(-1).ok, false);
  await handlers[METHODS.observationRecent]({ params: { extra: true }, respond });
  assert.equal(responses.at(-1).ok, false);
});

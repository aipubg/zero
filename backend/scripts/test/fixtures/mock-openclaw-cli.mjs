// Test fixture: emulates `openclaw gateway call <method> --params <json>`.
// Never touches the network. Scenario is selected by MOCK_SCENARIO; when
// MOCK_CAPTURE is set, each received call is appended as one JSON line.

import { appendFileSync } from "node:fs";

const argv = process.argv.slice(2);
const method = argv[2];
const paramsIndex = argv.indexOf("--params");
let params = {};
try {
  params = JSON.parse(argv[paramsIndex + 1] ?? "{}");
} catch {
  params = {};
}
if (process.env.MOCK_CAPTURE) {
  appendFileSync(process.env.MOCK_CAPTURE, `${JSON.stringify({ method, params })}\n`);
}

const scenario = process.env.MOCK_SCENARIO ?? "ok";

if (argv[0] === "plugins" && argv[1] === "inspect") {
  if (scenario === "plugin-inspect-fail") {
    console.error("Plugin not found: zero-provider-manager");
    process.exit(1);
  }
  out({
    plugin: {
      id: "zero-provider-manager",
      enabled: true,
      activated: scenario !== "plugin-inactive",
      status: "loaded",
      activationSource: "explicit",
    },
  });
  process.exit(0);
}

if (argv[0] === "gateway" && argv[1] === "health") {
  if (scenario === "health-fail") {
    console.error("Gateway Health\nFAILED");
    process.exit(1);
  }
  console.log("Gateway Health\nOK (1ms)");
  process.exit(0);
}

function out(body) {
  console.log(JSON.stringify(body));
}

if (method === "config.get") {
  if (scenario === "config-fail") {
    console.error("Gateway call failed: config unavailable");
    process.exit(1);
  }
  out({
    hash: "hmac-sha256:v1:fixture-hash",
    configRevisionHash: "hmac-sha256:v1:fixture-rev",
    appliedConfigHash:
      scenario === "config-mismatch" ? "hmac-sha256:v1:fixture-other" : "hmac-sha256:v1:fixture-rev",
    config: {
      models: {
        providers: {
          "zero-gw": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            apiKey: { source: "env", provider: "default", id: "ZERO_GATEWAY_KEY" },
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b",
            fallbacks: [],
          },
        },
        entries: {
          operator: {
            model: {
              primary: "zero-gw/z-ai/glm-5.3-flash",
              fallbacks: ["zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b"],
            },
          },
        },
      },
    },
  });
  process.exit(0);
}

if (method === "zero.providers.discover") {
  if (scenario === "discover-fail") {
    console.error("Gateway call failed: discover unavailable");
    process.exit(1);
  }
  out({
    providerId: params.providerId,
    adapter: params.api,
    status: "ok",
    latencyMs: 5,
    count: 2,
    models: [{ id: "mock/model-a" }, { id: "mock/model-b" }],
  });
  process.exit(0);
}

if (method === "zero.providers.test") {
  if (scenario === "test-fail") {
    console.error("Gateway call failed: test unavailable");
    process.exit(1);
  }
  out({
    providerId: params.providerId,
    adapter: params.api,
    status: "ok",
    latencyMs: 5,
    count: 2,
    modelsSample: [{ id: "mock/model-a" }],
  });
  process.exit(0);
}

if (method === "zero.providers.capabilities") {
  if (
    scenario === "no-capabilities" ||
    scenario === "unregistered" ||
    scenario === "plugin-inactive"
  ) {
    console.error("Gateway call failed: unknown method: zero.providers.capabilities");
    process.exit(1);
  }
  if (scenario === "registered") {
    console.error(
      "Gateway call failed: providerId must match ^[a-z][a-z0-9_-]{0,63}$.",
    );
    process.exit(1);
  }
  if (scenario === "unknown-response") {
    console.error("Gateway call failed: unexpected upstream failure");
    process.exit(1);
  }
  const requested = Array.isArray(params.capabilities) && params.capabilities.length
    ? params.capabilities
    : ["text", "streaming", "tools", "image"];
  if (scenario === "capabilities-auth") {
    out({
      providerId: params.providerId,
      model: params.model,
      adapter: params.api,
      status: "auth",
      latencyMs: 3,
      capabilities: requested.map((id) => ({ id, status: "auth", error: "Authentication failed." })),
    });
    process.exit(0);
  }
  if (scenario === "capabilities-partial") {
    out({
      providerId: params.providerId,
      model: params.model,
      adapter: params.api,
      status: "partial",
      latencyMs: 7,
      capabilities: [
        { id: "text", status: "ok", latencyMs: 2 },
        { id: "image", status: "unsupported", error: "Provider rejected image input." },
      ],
    });
    process.exit(0);
  }
  out({
    providerId: params.providerId,
    model: params.model,
    adapter: params.api,
    status: "ok",
    latencyMs: 9,
    capabilities: requested.map((id) => ({
      id,
      status: "ok",
      latencyMs: 2,
    })),
  });
  process.exit(0);
}

console.error(`Gateway call failed: unknown method: ${method}`);
process.exit(1);

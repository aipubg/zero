import { buildJsonPluginConfigSchema, definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { OBSERVATION_CONFIG_SCHEMA } from "./observation/config.mjs";
import { registerZeroUiRuntime } from "./runtime-core.mjs";
import {
  POLICY_ID,
  CONFIG_JSON_SCHEMA as POLICY_JSON_SCHEMA,
  normalizeConfig as normalizePolicyConfig,
  createControlHandler,
  createState as createPolicyState,
  evaluateToolCall,
  registerLegacyChatRedirects,
  verifyManifestDeclaration,
} from "./policy/index.js";

const COMBINED_CONFIG_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...POLICY_JSON_SCHEMA.properties,
    ...OBSERVATION_CONFIG_SCHEMA.properties,
  },
};

/**
 * Unified Zero Plugin Entry.
 * Single canonical plugin providing:
 * 1. Computer hold policy (`zero-policy.computer-hold`) & control method (`zero.computer.control`)
 * 2. Control UI contribution (`dist/control-ui/...`)
 * 3. Screen observation engine & tool (`zero_screen_context`)
 * 4. Integrations status RPCs (`zero.integrations.cli.status`, `zero.integrations.connectors.status`)
 */
export default definePluginEntry({
  id: "zero-control-ui",
  name: "Zero",
  description: "Zero: unified private assistant over the local Gateway, with native Control UI, computer hold policy, and observation context.",
  configSchema: buildJsonPluginConfigSchema(COMBINED_CONFIG_SCHEMA),
  register(api) {
    // 1. Register Trusted Computer Hold Policy & Control Method
    const policyConfig = normalizePolicyConfig(api?.pluginConfig);
    const policyState = createPolicyState(policyConfig);

    verifyManifestDeclaration(api?.logger, api?.readManifest);

    if (typeof api?.registerTrustedToolPolicy === "function") {
      api.registerTrustedToolPolicy({
        id: POLICY_ID,
        description:
          "Refuses computer input while a human holds control, gates post-handover stale references, and enforces action budgets.",
        matcher: [...policyConfig.holdToolNames, ...policyConfig.codeModeToolNames],
        evaluate: (event, ctx) => evaluateToolCall(policyState, event, ctx),
      });
    }

    if (typeof api?.registerGatewayMethod === "function") {
      api.registerGatewayMethod(
        policyConfig.controlMethodName,
        createControlHandler(policyState, api?.logger),
        { scope: "operator.write" }
      );
    }

    const redirects = registerLegacyChatRedirects(api);

    // 2. Register Control UI & Observation Runtime
    const uiRuntime = registerZeroUiRuntime(api, { policyState });

    api?.logger?.info?.(
      `[zero-unified-plugin] registered: policy=${POLICY_ID} method=${policyConfig.controlMethodName} ` +
      `observeTools=${policyConfig.holdToolNames.join(",")} legacyRedirects=${redirects}`
    );

    return {
      state: {
        policy: policyState,
        ui: uiRuntime,
      },
    };
  },
});

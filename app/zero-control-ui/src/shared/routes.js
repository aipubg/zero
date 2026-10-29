import { agentRole } from "./sessions.js";

/**
 * Route policy for the single-product Zero shell.
 *
 * The host Control UI owns routing and the native screens. This module only
 * classifies the legacy/duplicate destinations that the Zero plugin must
 * re-target. Native destinations (Models, About, Plugins, Skills, Agents) are
 * never redirected: the plugin extends those screens in place.
 *
 * Everything here is pure so the policy is testable without a browser or
 * Gateway.
 */

/** The single canonical user-facing conversation. */
const ZERO_CHAT_PATH = "/chat/zero";

/** The one native provider-management destination. */
const NATIVE_PROVIDER_PATH = "/settings/model-providers";

/** The one native About destination. */
const NATIVE_ABOUT_PATH = "/settings/about";

/** The native Systems/Desktop destination that owns live view. */
const NATIVE_SYSTEMS_PATH = "/systems";

/** Native agent-configuration route prefix. */
const NATIVE_AGENT_SETTINGS_PATH = "/settings/agents";

/** Native agents roster (Zero only after the single-agent migration). */
const NATIVE_AGENTS_PATH = "/agents";

/** Host settings pages that are not part of the Zero product surface. */
const HIDDEN_HOST_ROUTES = new Set([
  "/debug",
  "/logs",
  "/settings/debug",
  "/settings/logs",
  "/settings/updates",
]);

/**
 * Legacy plugin pages registered by earlier Zero builds. They are no longer
 * registered; direct links are sent to the native destination instead.
 */
const LEGACY_PLUGIN_TARGETS = {
  team: "/chat/zero",
  models: NATIVE_PROVIDER_PATH,
  about: NATIVE_ABOUT_PATH,
};

/**
 * Upstream product/community destinations. The Gateway runtime keeps its own
 * links for diagnostics outside the product; the Zero shell blocks these.
 */
const UPSTREAM_EXTERNAL_PATHS = [
  "openclaw.ai",
  "www.openclaw.ai",
  "docs.openclaw.ai",
  "github.com/openclaw",
  "discord.gg/clawd",
  "x.com/openclaw",
  "reddit.com/r/openclaw",
  "www.reddit.com/r/openclaw",
];

/** Specialist agent ids that must never own a user-facing chat entry. */
const SPECIALIST_AGENT_IDS = ["operator", "researcher"];

function routePath(url) {
  const raw = String(url ?? "");
  try {
    return new URL(raw, "http://zero.local").pathname.toLowerCase().replace(/\/+$/, "");
  } catch {
    return raw.toLowerCase().split(/[?#]/)[0].replace(/\/+$/, "");
  }
}

function queryParams(url) {
  try {
    return new URL(String(url ?? ""), "http://zero.local").searchParams;
  } catch {
    return new URLSearchParams();
  }
}

/** Native provider route mounted in place by the plugin. */
function isNativeProviderRoute(url) {
  const path = routePath(url);
  return (
    path === NATIVE_PROVIDER_PATH ||
    path === "/settings/model-setup" ||
    path === "/settings/models" ||
    path === "/settings/providers" ||
    path === "/model-providers" ||
    path === "/model-setup" ||
    path === "/models" ||
    path === "/providers"
  );
}

/** The native About route, mounted in place by the plugin. */
function isAboutRoute(url) {
  return routePath(url) === NATIVE_ABOUT_PATH;
}

/** The native Systems route that owns the Desktop viewer. */
function isNativeSystemsRoute(url) {
  return routePath(url) === NATIVE_SYSTEMS_PATH;
}

function isHiddenHostRoute(url) {
  return HIDDEN_HOST_ROUTES.has(routePath(url));
}

/** Bare `/chat` is an alias for the one canonical Zero conversation. */
function isBareChatRoute(url) {
  return routePath(url) === "/chat";
}

/** The canonical chat route and its session-history subpaths. */
function isCanonicalChatRoute(url) {
  const path = routePath(url);
  return path === ZERO_CHAT_PATH || path.startsWith(`${ZERO_CHAT_PATH}/`);
}

/**
 * Normalize an agent reference from a path segment or query value. Handles
 * `operator`, `agent:operator`, and session-key forms such as
 * `agent:operator:main`.
 */
function specialistKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^agent:/, "")
    .split(/[:/]/)[0];
}

function matchesSpecialist(value, specialistIds) {
  const key = specialistKey(value);
  if (!key) return false;
  if (SPECIALIST_AGENT_IDS.includes(key)) return true;
  return (
    Array.isArray(specialistIds) &&
    specialistIds.some((id) => specialistKey(id) === key)
  );
}

/**
 * Resolve an old Zero plugin page URL to the native destination that replaced
 * it. Returns null for anything that is not a Zero legacy plugin page.
 */
function legacyPluginTarget(url) {
  if (routePath(url) !== "/plugin") return null;
  const params = queryParams(url);
  if (params.get("plugin") !== "zero-control-ui") return null;
  return LEGACY_PLUGIN_TARGETS[params.get("id")] ?? null;
}

/** Legacy provider alias used by older links. */
function isLegacyProviderAlias(url) {
  const path = routePath(url);
  return (
    path === "/model-providers" ||
    path === "/settings/model-setup" ||
    path === "/model-setup" ||
    path === "/models" ||
    path === "/providers"
  );
}

function isSpecialistChatRoute(url, specialistIds = SPECIALIST_AGENT_IDS) {
  const path = routePath(url);
  if (!path.startsWith("/chat/")) return false;
  const segment = decodeURIComponent(path.split("/")[2] ?? "");
  return matchesSpecialist(segment, specialistIds);
}

/**
 * A direct agent-configuration route for an internal specialist.
 *
 * These routes are retained for administrator configuration only. They are not
 * listed in any user-facing roster or switcher, and the specialist settings
 * screen must not expose a chat or new-conversation action.
 */
function isSpecialistConfigRoute(url, specialistIds = SPECIALIST_AGENT_IDS) {
  const path = routePath(url);
  if (!path.startsWith(`${NATIVE_AGENT_SETTINGS_PATH}/`)) return false;
  const segment = decodeURIComponent(
    path.slice(NATIVE_AGENT_SETTINGS_PATH.length + 1).split("/")[0] ?? "",
  );
  if (!segment) return false;
  return (
    SPECIALIST_AGENT_IDS.includes(segment) ||
    (Array.isArray(specialistIds) && specialistIds.includes(segment))
  );
}

/** A new-conversation link that targets a specialist instead of Zero. */
function isSpecialistNewRoute(url, specialistIds = SPECIALIST_AGENT_IDS) {
  if (routePath(url) !== "/new") return false;
  const agent = queryParams(url).get("agent") ?? "";
  return matchesSpecialist(agent, specialistIds);
}

/** Configured agents that are internal specialists (never the Lead assistant). */
function specialistAgentIds(agents) {
  return (Array.isArray(agents) ? agents : [])
    .filter((agent) => agentRole(agent) !== "Lead")
    .map((agent) => agent?.id)
    .filter((id) => typeof id === "string" && id.length > 0);
}

function isUpstreamExternalHref(href) {
  const raw = String(href ?? "");
  let parsed;
  try {
    parsed = new URL(raw, "http://zero.local");
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const hostPath = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  return UPSTREAM_EXTERNAL_PATHS.some(
    (target) => hostPath === target || hostPath.startsWith(`${target}/`),
  );
}

export {
  HIDDEN_HOST_ROUTES,
  LEGACY_PLUGIN_TARGETS,
  NATIVE_ABOUT_PATH,
  NATIVE_AGENT_SETTINGS_PATH,
  NATIVE_AGENTS_PATH,
  NATIVE_PROVIDER_PATH,
  NATIVE_SYSTEMS_PATH,
  SPECIALIST_AGENT_IDS,
  UPSTREAM_EXTERNAL_PATHS,
  ZERO_CHAT_PATH,
  isAboutRoute,
  isBareChatRoute,
  isCanonicalChatRoute,
  isHiddenHostRoute,
  isLegacyProviderAlias,
  isNativeProviderRoute,
  isNativeSystemsRoute,
  isSpecialistChatRoute,
  isSpecialistConfigRoute,
  isSpecialistNewRoute,
  isUpstreamExternalHref,
  legacyPluginTarget,
  routePath,
  specialistAgentIds,
};

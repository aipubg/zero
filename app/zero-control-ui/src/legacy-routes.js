import {
  NATIVE_AGENTS_PATH,
  ZERO_CHAT_PATH,
  isBareChatRoute,
  isHiddenHostRoute,
  isLegacyProviderAlias,
  isSpecialistChatRoute,
  isSpecialistConfigRoute,
  isSpecialistNewRoute,
  isUpstreamExternalHref,
  legacyPluginTarget,
  specialistAgentIds,
} from "./shared/routes.js";
import { surfaceHref } from "./shared/sessions.js";

/**
 * Single-product route policy for the native Zero shell.
 *
 * The host owns routing and every native screen. This interceptor only
 * re-targets destinations that would otherwise expose a second product
 * surface or a second conversation:
 *  - legacy Zero plugin pages -> their native destination
 *  - Debug / Logs / Updates -> the single Zero conversation
 *  - specialist chat and new-conversation routes -> the Zero conversation
 *  - upstream marketing/community links -> blocked (no external redirect)
 *
 * Native Models, About, Plugins, Skills and Agents routes are never touched:
 * the plugin extends those screens in place (see native-surfaces.js).
 *
 * It never renders a page, owns a route, or stores navigation state.
 */

const NATIVE_MODELS_PATH = "/settings/model-providers";

/**
 * Product-chrome containers that may render upstream links. Chat transcript
 * content is deliberately excluded: a model citation is not a Zero-owned
 * redirect and must remain clickable.
 */
const UPSTREAM_CHROME_SELECTORS = [
  ".sidebar-shell__invite",
  ".community-invite-card",
  "openclaw-about-page",
  ".about-hero",
  ".settings-sidebar",
  ".settings",
  ".appearance-page",
  "header",
  "footer",
  "nav",
];

function inUpstreamChrome(anchor) {
  if (typeof anchor?.closest !== "function") return false;
  return UPSTREAM_CHROME_SELECTORS.some((selector) => anchor.closest(selector) !== null);
}

function installLegacyRouteInterceptor(host) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const specialistIds = () => specialistAgentIds(host?.agents?.rows);

  const targetFor = (url) => {
    if (!url || typeof url !== "string") return null;
    const legacyPage = legacyPluginTarget(url);
    if (legacyPage) return legacyPage;
    if (isLegacyProviderAlias(url)) return NATIVE_MODELS_PATH;
    if (isBareChatRoute(url)) return ZERO_CHAT_PATH;
    if (isHiddenHostRoute(url)) return ZERO_CHAT_PATH;
    if (isSpecialistConfigRoute(url, specialistIds())) return NATIVE_AGENTS_PATH;
    if (isSpecialistChatRoute(url, specialistIds())) return ZERO_CHAT_PATH;
    if (isSpecialistNewRoute(url, specialistIds())) return ZERO_CHAT_PATH;
    return null;
  };

  const navigate = (target) => {
    try {
      const href = surfaceHref(host, target);
      // A history-only change leaves the host rendering the blocked screen
      // until the next reload (the host owns its own router state). Replace the
      // document instead so the native destination is the only rendered
      // surface and the blocked URL never stays in back/forward history.
      if (typeof window.location?.replace === "function") {
        window.location.replace(href);
      } else if (typeof window.location?.assign === "function") {
        window.location.assign(href);
      } else {
        window.history.replaceState(null, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } catch {
      // Navigation is best-effort; the page still renders safely.
    }
  };

  const applyRoutePolicy = () => {
    try {
      const current = `${window.location.pathname || ""}${window.location.search || ""}${window.location.hash || ""}`;
      const target = targetFor(current);
      if (target) navigate(target);
    } catch {
      // ignore
    }
  };

  const handleClick = (e) => {
    try {
      const anchor = e.target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (isUpstreamExternalHref(href) && inUpstreamChrome(anchor)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const target = targetFor(href);
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        navigate(target);
      }
    } catch {
      // ignore
    }
  };

  document.addEventListener("click", handleClick, true);
  window.addEventListener("popstate", applyRoutePolicy);
  window.addEventListener("hashchange", applyRoutePolicy);
  applyRoutePolicy();

  return () => {
    document.removeEventListener("click", handleClick, true);
    window.removeEventListener("popstate", applyRoutePolicy);
    window.removeEventListener("hashchange", applyRoutePolicy);
  };
}

export { ZERO_CHAT_PATH, installLegacyRouteInterceptor };

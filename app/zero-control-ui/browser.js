import "./index.css";
import "./src/shell/zero-shell.css";
import { installZeroShell } from "./src/shell/zero-shell.js";
import { PLUGIN_ID } from "./src/constants.js";
import { installLegacyRouteInterceptor } from "./src/legacy-routes.js";
import { installNativeSurfaces } from "./src/native-surfaces.js";
import { installDesktopSessionKeepAlive } from "./src/desktop-session.js";

/**
 * Native Zero Control UI.
 *
 * One app shell, Gateway-owned agents/sessions, built-in chat navigation. This
 * first-party module registers no replacement pages: it extends the native
 * Models and About routes in place and keeps Zero as the only chat identity.
 * Nothing here owns a transcript, model route, memory index, or second
 * application.
 *
 * Contract: Zero control-ui SDK (defineControlUiPlugin, ControlUiHost).
 */


function autoActivate() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__zero_browser_auto_activated) return;
  window.__zero_browser_auto_activated = true;
  const host = window.__ZERO_HOST__ || window.__zeroHost || null;
  try {
    const dispose = plugin.activate(host);
    if (typeof dispose === "function") window.__zero_active_plugin_dispose = dispose;
  } catch (e) {
    console.warn("[zero-control-ui] auto-activate failed", e);
  }
}

const plugin = {
  id: PLUGIN_ID,
  activate(host) {
    if (typeof window !== "undefined") {
      window.__zero_surfaces_installed = true;
      window.__zero_fallback_dispose?.();
      window.__zero_fallback_dispose = null;
      window.__zero_active_plugin_dispose?.();
      window.__zero_active_plugin_dispose = null;
    }
    if (typeof document !== 'undefined') document.getElementById?.("zero-permanent-top-actions")?.remove();
    const disposeRoutes = installLegacyRouteInterceptor(host);
    const disposeSurfaces = installNativeSurfaces(host);
    const disposeShell = installZeroShell(host);
    const disposeSession = installDesktopSessionKeepAlive();
    const disposeAll = () => {
      disposeSession?.();
      disposeShell?.();
      disposeSurfaces?.();
      disposeRoutes?.();
      if (typeof window !== "undefined" && window.__zero_active_plugin_dispose === disposeAll) {
        window.__zero_active_plugin_dispose = null;
      }
    };
    if (typeof window !== "undefined") {
      window.__zero_active_plugin_dispose = disposeAll;
    }
    return disposeAll;
  },
};

export default plugin;
if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoActivate, { once: true });
  else autoActivate();
}
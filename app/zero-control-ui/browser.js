import "./index.css";
import "./src/shell/zero-shell.css";
import { installZeroShell } from "./src/shell/zero-shell.js";
import { PLUGIN_ID } from "./src/constants.js";
import { installLegacyRouteInterceptor } from "./src/legacy-routes.js";
import { installNativeSurfaces } from "./src/native-surfaces.js";

/**
 * Native OpenClaw Control UI contribution.
 *
 * One app shell, Gateway-owned agents/sessions, built-in chat navigation. The
 * plugin registers no replacement pages: it extends the existing native
 * Models and About routes in place and keeps Zero as the only chat identity.
 * Nothing here owns a transcript, model route, memory index, or second
 * application.
 *
 * Contract: openclaw/plugin-sdk/control-ui (defineControlUiPlugin, ControlUiHost).
 */

export default {
  id: PLUGIN_ID,
  activate(host) {
    if (typeof window !== "undefined") {
      window.__zero_surfaces_installed = true;
      window.__zero_fallback_dispose?.();
      window.__zero_fallback_dispose = null;
    }
    if (typeof document !== 'undefined') document.getElementById?.("zero-permanent-top-actions")?.remove();
    const disposeRoutes = installLegacyRouteInterceptor(host);
    const disposeSurfaces = installNativeSurfaces(host);
    const disposeShell = installZeroShell(host);
    return () => {
      disposeShell?.();
      disposeSurfaces?.();
      disposeRoutes?.();
    };
  },
};

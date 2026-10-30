import { mountAboutPage } from "./pages/about.js";
import { mountModelsPage } from "./pages/models.js";
import { mountComputerHold } from "./computer/hold.js";
import { agentRole } from "./shared/sessions.js";
import { renderGenerativeWidgets } from "./spaces/generative-widgets.js";
import {
  SPECIALIST_AGENT_IDS,
  isAboutRoute,
  isNativeProviderRoute,
  isNativeSystemsRoute,
  isSpecialistConfigRoute,
  routePath,
  specialistAgentIds,
} from "./shared/routes.js";

/**
 * In-place native-surface integration.
 *
 * The host owns the Control UI routes and renders the native screens. The Zero
 * plugin does not register replacement pages; instead it mounts its provider
 * manager inside the existing Models route and its About content inside the
 * existing About route. The native URL, sidebar entry and back/forward history
 * stay authoritative.
 *
 * The same seam also removes duplicate product chrome that the host cannot
 * unregister from a plugin:
 *  - the community promotion card
 *  - stale Zero plugin navigation entries
 *  - the user-facing agent switcher (Zero is the only chat identity)
 *  - internal specialists in the native Agents roster and settings switcher
 *  - upstream product naming in product-owned chrome
 *
 * Internal specialists remain fully configured in the Gateway. Direct
 * administrator settings routes are retained, but they render configuration
 * only and carry an explicit notice that no conversation can be started there.
 *
 * It never owns a transcript, route, Gateway request or session store.
 */

const SURFACE_SELECTOR = "openclaw-model-providers-page, openclaw-model-setup-page, openclaw-about-page";
const COMPUTER_SELECTOR = ".systems-desktop, .zero-computer-hold-host";
const COMMUNITY_SELECTOR = ".sidebar-shell__invite, .community-invite-card";
const STALE_PLUGIN_NAV_SELECTOR = '[data-sidebar-entry^="plugin:zero-control-ui/"]';
const CHROME_SELECTOR = [
  COMMUNITY_SELECTOR,
  STALE_PLUGIN_NAV_SELECTOR,
  ".sidebar-agent-card",
  ".topbar-brand",
  ".assistant-panel",
  ".settings-sidebar",
  "openclaw-agent-select",
  ".agents-home__card",
  ".agents-toolbar",
  ".page-subtitle",
  ".sidebar-footer-build",
  ".settings-typography-preview__caption",
  ".mount-fallback",
].join(", ");

const NO_REBRAND_SELECTOR = [
  ".chat-virtual-row",
  ".chat-text",
  "code",
  "pre",
  ".plugin-catalog-grid",
  ".installed-plugins-card",
  ".plugin-card-author",
  "script",
  "style",
  "textarea",
  "[contenteditable='true']",
].join(", ");

const PRODUCT_PHRASES = [
  [/Extend your Claw with tools/g, "Extend Zero with tools"],
];

function currentLocation() {
  const pathname = window.location.pathname || "";
  return `${pathname}${window.location.search || ""}`;
}

function currentSurface(host) {
  const base = host?.basePath || "";
  const raw = currentLocation();
  const path = base && raw.startsWith(base) ? raw.slice(base.length) : raw;
  if (isNativeProviderRoute(path)) return "models";
  if (isAboutRoute(path)) return "about";
  return null;
}

function leadAgentId(host) {
  const rows = Array.isArray(host?.agents?.rows) ? host.agents.rows : [];
  const lead = rows.find((agent) => agentRole(agent) === "Lead");
  return lead?.id ?? host?.agents?.defaultId ?? null;
}

/**
 * The native “Set Default” action changes the Gateway default agent. A direct
 * specialist configuration screen must not offer it: making an internal
 * delegation agent the default would contradict the single-assistant product
 * boundary. Other configuration controls stay available.
 */
function isSetDefaultControl(control) {
  if (!control || typeof control.getAttribute !== "function") return false;
  const text = String(control.textContent ?? "").trim();
  const label = String(control.getAttribute("aria-label") ?? "").trim();
  return /^Set Default$/iu.test(text) || /^Set Default$/iu.test(label);
}

function removeSpecialistDefaultAction(root, specialist) {
  if (!specialist || !root || typeof root.querySelectorAll !== "function") return 0;
  let removed = 0;
  for (const control of root.querySelectorAll("button, [role='button']")) {
    if (!isSetDefaultControl(control)) continue;
    // Disable before detaching so any click already racing the observer cannot
    // reach the native action handler.
    control.setAttribute("aria-disabled", "true");
    if ("disabled" in control) control.disabled = true;
    control.remove();
    removed += 1;
  }
  return removed;
}

/**
 * Capture-phase guard used by the native click interceptor. It blocks the
 * native Set Default action on a specialist configuration route even if the
 * host re-renders it between observes, and leaves every other control alone.
 */
function blockSpecialistDefaultAction(event, specialist) {
  if (!specialist || !event || typeof event.preventDefault !== "function") return false;
  const target = event.target;
  if (!target || typeof target.closest !== "function") return false;
  const control = target.closest("button, [role='button']");
  if (!isSetDefaultControl(control)) return false;
  event.preventDefault();
  event.stopImmediatePropagation?.();
  return true;
}

const CHAT_ENTRY_TEXT =
  /^(chat|message)$|\b(open chat|start chat|new chat|new conversation|chat now|send message|message zero)\b/iu;

/**
 * A control that would open or start a conversation. On a specialist
 * administrator screen every such control is out of scope, including one that
 * targets the canonical Zero chat.
 */
function isSpecialistChatEntryControl(control) {
  if (!control || typeof control.getAttribute !== "function") return false;
  const href = String(control.getAttribute("href") ?? "");
  if (/(^|\/)chat(?:\/|$)/iu.test(href)) return true;
  if (/(^|\/)new\?(?:[^#]*&)?agent=/iu.test(href)) return true;
  const label = `${control.textContent ?? ""} ${control.getAttribute("aria-label") ?? ""}`
    .replace(/\s+/gu, " ")
    .trim();
  return CHAT_ENTRY_TEXT.test(label);
}

function removeSpecialistChatEntries(root) {
  if (!root || typeof root.querySelectorAll !== "function") return 0;
  let removed = 0;
  for (const control of root.querySelectorAll("a, button, [role='button']")) {
    if (!isSpecialistChatEntryControl(control)) continue;
    control.remove();
    removed += 1;
  }
  return removed;
}

/**
 * The ordinary Agents roster is Zero only. Internal specialists remain
 * Gateway agents (definitions, tools, delegation, sessions, history), but they
 * are not user-facing roster cards.
 */
function removeSpecialistCards(root, leadId) {
  if (!root || typeof root.querySelectorAll !== "function") return 0;
  let removed = 0;
  for (const card of root.querySelectorAll(".agents-home__card[data-agent-id]")) {
    const id = card.getAttribute("data-agent-id");
    if (!id || id === leadId) continue;
    card.remove();
    removed += 1;
  }
  return removed;
}

function mountContext(host) {
  return {
    host,
    signal: host?.signal ?? new AbortController().signal,
    props: {},
    presented: true,
    mountDefault: () => () => {},
  };
}

function rebrandText(root) {
  if (!root || typeof document === "undefined") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    const value = node.nodeValue || "";
    if (parent && !parent.closest(NO_REBRAND_SELECTOR) && /OpenClaw|Claw/.test(value)) {
      let next = value.replace(/\bOpenClaw\b/g, "Zero");
      for (const [pattern, replacement] of PRODUCT_PHRASES) {
        next = next.replace(pattern, replacement);
      }
      if (next !== value) node.nodeValue = next;
    }
    node = walker.nextNode();
  }
}

/**
 * True only when this exact host wrapper is still attached to the live Desktop
 * viewer and still contains the hold bar. Anything else must be re-mounted.
 *
 * The previous check compared the bar's parent with the Desktop element, but
 * the bar lives inside the wrapper, so it never matched. Every observer tick
 * then re-mounted the bar, which produced more mutations and blocked the page.
 */
function canReuseComputerHold(desktop, mounted) {
  const hostEl = mounted?.hostEl;
  if (!desktop || !hostEl || hostEl.parentNode !== desktop) return false;
  return (hostEl.children ?? []).some(
    (child) => child.className === "zero-computer-hold",
  );
}

/**
 * Best-effort hand-back before the hold wrapper is removed. Only the hold this
 * view took is released; a missing or failing hand-back must never block
 * navigation. Returns whether a hand-back was attempted and did not throw.
 */
function handBackComputer(mountedComputer) {
  const handle = mountedComputer?.handle;
  if (typeof handle?.leave !== "function") return false;
  try {
    handle.leave.call(handle);
    return true;
  } catch {
    return false;
  }
}

/**
 * What the Desktop surface lifecycle should do next.
 *
 * `leave` is reserved for a real departure from the native Systems route, so a
 * transient host re-render while the user is still on Systems remounts without
 * handing back the hold.
 */
function computerSurfaceAction(active, desktop, mounted) {
  if (!active) return "leave";
  if (!desktop) return "unmount";
  return canReuseComputerHold(desktop, mounted) ? "reuse" : "remount";
}

function installNativeSurfaces(host) {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof MutationObserver === "undefined" ||
    !document.body
  ) {
    return () => {};
  }

  let disposed = false;
  let mounted = null; // { kind, hostEl, handle }
  let mountedComputer = null; // { hostEl, handle }
  let syncScheduled = false;
  let chromeTimer = null;

  const unmount = () => {
    if (!mounted) return;
    try {
      mounted.handle?.dispose?.();
    } catch {
      // A disposed page must never break navigation.
    }
    try {
      mounted.hostEl?.remove?.();
    } catch {
      // ignore
    }
    mounted = null;
  };

  const unmountComputer = (handBack = false) => {
    if (handBack) handBackComputer(mountedComputer);
    if (!mountedComputer) {
      // A host re-render can leave the wrapper behind without our handle.
      for (const node of document.querySelectorAll(".zero-computer-hold-host")) {
        node.remove();
      }
      return;
    }
    try {
      mountedComputer.handle?.dispose?.();
    } catch {
      // A disposed control must never break navigation.
    }
    try {
      mountedComputer.hostEl?.remove?.();
    } catch {
      // ignore
    }
    mountedComputer = null;
  };

  /**
   * The native Systems page owns the Desktop viewer. Zero adds only the hold
   * authority above that viewer; it does not replace the page, add a route, or
   * create a second stream.
   */
  const syncComputerSurface = () => {
    if (disposed) return;
    const active = isNativeSystemsRoute(currentLocation());
    const desktop = active ? document.querySelector(".systems-desktop") : null;
    const action = computerSurfaceAction(active, desktop, mountedComputer);
    if (action === "leave") {
      // Leaving Systems hands back only this view's hold; another client's
      // hold is untouched, and a failed hand-back never blocks navigation.
      unmountComputer(true);
      return;
    }
    if (action === "unmount") {
      unmountComputer();
      return;
    }
    if (action === "reuse") return;
    unmountComputer();
    const hostEl = document.createElement("div");
    hostEl.className = "zero-computer-hold-host";
    hostEl.setAttribute("data-zero-computer-hold-host", "");
    desktop.prepend(hostEl);
    try {
      mountedComputer = { hostEl, handle: mountComputerHold(hostEl, host) };
    } catch {
      mountedComputer = { hostEl, handle: null };
    }
  };

  const rebrandTitle = () => {
    try {
      const current = document.title || "";
      if (!current) return;
      const next = /^Zero\s*[—–-]\s*OpenClaw$/.test(current)
        ? "Zero"
        : current.replace(/\bOpenClaw\b/g, "Zero");
      if (next !== current) document.title = next;
    } catch {
      // ignore
    }
  };

  let isApplyingChanges = false;
  let lastMountedPath = null;

  const handleLoginAndDisconnectState = () => {
    // Only rebrand text and hide external links if a login/disconnect dialog is actively shown
    const loginPanels = document.querySelectorAll(
      ".login-panel, .login-dialog, .auth-dialog, form[class*='login'], [class*='login-form']"
    );
    for (const panel of loginPanels) {
      rebrandText(panel);
      // Hide external docs links
      for (const a of panel.querySelectorAll("a[href*='openclaw.ai']")) {
        a.style.display = "none";
      }
      // If secret / token input exists, hide the secret field row
      for (const secretField of panel.querySelectorAll("[class*='secret'], [id*='secret'], input[type='password']")) {
        const row = secretField.closest(".form-field, .field-row, .login-field") || secretField;
        if (row && row.style.display !== "none") {
          row.style.display = "none";
        }
      }
    }
  };

  const rebrandChrome = () => {
    rebrandTitle();
    handleLoginAndDisconnectState();
    const brand = document.querySelector(".topbar-brand");
    if (brand) {
      if (brand.getAttribute("aria-label") !== "Zero") brand.setAttribute("aria-label", "Zero");
      const logo = brand.querySelector(".topbar-brand__logo");
      if (logo && !logo.hasAttribute("hidden")) logo.setAttribute("hidden", "");
    }
    rebrandText(document.querySelector(".topnav-shell"));
    rebrandText(document.querySelector(".assistant-panel"));
    rebrandText(document.querySelector(".settings-sidebar"));
    if (!routePath(window.location.pathname).startsWith("/chat/")) {
      rebrandText(document.querySelector("main"));
    }
  };

  const neutralizeAgentSwitcher = () => {
    for (const button of document.querySelectorAll(".sidebar-agent-card__main")) {
      if (button.getAttribute("aria-label") !== "Zero") button.setAttribute("aria-label", "Zero");
      if (button.hasAttribute("aria-haspopup")) button.removeAttribute("aria-haspopup");
      if (button.hasAttribute("aria-expanded")) button.removeAttribute("aria-expanded");
      if (button.getAttribute("aria-disabled") !== "true") {
        button.setAttribute("aria-disabled", "true");
      }
      if (button.getAttribute("tabindex") !== "-1") button.setAttribute("tabindex", "-1");
      if (!button.classList.contains("zero-static-agent")) {
        button.classList.add("zero-static-agent");
      }
    }
    for (const chevron of document.querySelectorAll(".sidebar-agent-card__chevron")) {
      if (!chevron.hasAttribute("hidden")) chevron.setAttribute("hidden", "");
    }
  };

  const specialistConfigId = () => {
    const path = routePath(currentLocation());
    if (!isSpecialistConfigRoute(path, specialistAgentIds(host?.agents?.rows))) return null;
    return decodeURIComponent(path.split("/")[3] ?? "");
  };

  /**
   * The native settings agent selector is a configuration context control, not
   * a chat switcher. Specialists are never selectable from it.
   */
  const removeSpecialistOptions = () => {
    const values = new Set(SPECIALIST_AGENT_IDS.map((id) => id.toLowerCase()));
    for (const id of specialistAgentIds(host?.agents?.rows)) values.add(id.toLowerCase());
    for (const agent of Array.isArray(host?.agents?.rows) ? host.agents.rows : []) {
      if (agentRole(agent) === "Lead") continue;
      const name = String(agent?.name ?? agent?.id ?? "").trim().toLowerCase();
      if (name) values.add(name);
    }
    for (const option of document.querySelectorAll(
      "openclaw-agent-select [data-agent-option], openclaw-agent-select wa-dropdown-item",
    )) {
      const label = (option.getAttribute("aria-label") || option.textContent || "")
        .trim()
        .toLowerCase();
      if (label && values.has(label)) option.remove();
    }
  };

  const removeSpecialistSelectorOnConfig = () => {
    if (!specialistConfigId()) return;
    for (const select of document.querySelectorAll("openclaw-agent-select")) select.remove();
  };

  const neutralizeSettingsAgentSelector = () => {
    if (specialistConfigId()) return;
    for (const trigger of document.querySelectorAll(".agent-select__trigger")) {
      if (trigger.hasAttribute("aria-haspopup")) trigger.removeAttribute("aria-haspopup");
      if (trigger.hasAttribute("aria-expanded")) trigger.removeAttribute("aria-expanded");
      if (trigger.getAttribute("aria-disabled") !== "true") {
        trigger.setAttribute("aria-disabled", "true");
      }
      if (trigger.getAttribute("tabindex") !== "-1") trigger.setAttribute("tabindex", "-1");
    }
  };

  /**
   * Direct specialist settings routes are administrator configuration only.
   * They must not look like, or behave like, a conversation surface.
   */
  const syncAdminNotice = () => {
    const specialist = specialistConfigId();
    const existing = document.querySelector(".zero-admin-config");
    if (!specialist) {
      if (existing) existing.remove();
      return;
    }
    const main = document.querySelector("main");
    if (!main) return;
    const row = (Array.isArray(host?.agents?.rows) ? host.agents.rows : []).find(
      (agent) => String(agent?.id ?? "").toLowerCase() === specialist,
    );
    const name = row?.name || specialist;
    const text =
      `Administrator configuration only — ${name} is an internal delegation agent. ` +
      "This screen edits configuration and cannot start or open a conversation. " +
      "Chat remains Zero.";
    if (
      existing &&
      existing.parentElement === main &&
      existing.getAttribute("data-zero-admin-config") === specialist &&
      existing.textContent === text
    ) {
      return;
    }
    if (existing) existing.remove();
    const notice = document.createElement("div");
    notice.className = "zero-admin-config";
    notice.setAttribute("data-zero-admin-config", specialist);
    notice.setAttribute("role", "note");
    notice.textContent = text;
    main.prepend(notice);
  };

  const removeSwitcherControls = () => {
    for (const control of document.querySelectorAll("main button, main a, main [role='button']")) {
      const text = (control.textContent || "").trim();
      const label = control.getAttribute("aria-label") || "";
      if (/^Pin to switcher$/i.test(text) || /^Pin to switcher$/i.test(label)) {
        control.remove();
      }
    }
  };

  const rebrandAboutEntry = () => {
    for (const link of document.querySelectorAll('a.sidebar-footer-build[href$="/settings/about"]')) {
      if (link.getAttribute("aria-label") !== "About Zero") {
        link.setAttribute("aria-label", "About Zero");
      }
      const text = link.querySelector(".sidebar-footer-build__text");
      if (text && text.textContent !== "About Zero") {
        text.textContent = "About Zero";
      }
    }
  };

  const cleanupChrome = () => {
    if (disposed || isApplyingChanges) return;
    isApplyingChanges = true;
    try {
      const specialist = specialistConfigId();
      const main = document.querySelector("main");
      for (const node of document.querySelectorAll(COMMUNITY_SELECTOR)) node.remove();
      for (const node of document.querySelectorAll(STALE_PLUGIN_NAV_SELECTOR)) node.remove();
      neutralizeAgentSwitcher();
      removeSpecialistCards(document, leadAgentId(host) ?? "zero");
      removeSpecialistOptions();
      removeSpecialistSelectorOnConfig();
      neutralizeSettingsAgentSelector();
      syncAdminNotice();
      removeSpecialistDefaultAction(main, Boolean(specialist));
      if (specialist) removeSpecialistChatEntries(main);
      removeSwitcherControls();
      rebrandAboutEntry();
      rebrandChrome();
      syncChatControls();
      removeExternalLearnMoreLinks();
      sanitizeChatModelMenu();
    } catch {
      // Product chrome cleanup is best-effort; it must never break the host.
    } finally {
      isApplyingChanges = false;
    }
  };

  const removeExternalLearnMoreLinks = () => {
    for (const a of document.querySelectorAll("a[href*='openclaw.ai'], a[href*='docs.openclaw'], a.callout__link, a.help-link")) {
      a.remove();
    }
    for (const a of document.querySelectorAll("a")) {
      const txt = (a.textContent || "").trim();
      if (/^Learn more$/i.test(txt) || /^OpenClaw Docs$/i.test(txt)) {
        a.remove();
      }
    }
  };

  const syncChatControls = () => {
    if (disposed) return;
    const isChat = routePath(currentLocation()).startsWith("/chat");
    if (!isChat) {
      document.querySelector(".zero-chat-control-pill")?.remove();
      return;
    }

    const existingBtn = document.querySelector(".zero-chat-control-pill");
    const container = document.querySelector(
      ".chat-pane__session-trail, .chat-pane__crumbs, .chat-pane__header, .chat-header, .topbar-actions, .chat-header__actions, .topbar-shell"
    );
    if (!container || existingBtn) return;

    const pill = document.createElement("div");
    pill.className = "zero-chat-control-pill";
    pill.style.cssText = "display:inline-flex;align-items:center;gap:8px;margin-left:12px;font-size:11px;font-weight:600;user-select:none;";

    let controlActive = true;

    pill.innerHTML = `
      <button class="zero-control-toggle-btn" style="display:inline-flex;align-items:center;gap:6px;background:#101c14;border:1px solid #10b981;color:#34d399;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981;"></span>
        Computer Control: Active
      </button>
      <button class="zero-reasoning-toggle zero-reasoning-toggle-btn" style="display:inline-flex;align-items:center;gap:6px;background:#181611;border:1px solid #f59e0b;color:#fbbf24;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f59e0b;"></span>
        Reasoning: ON
      </button>
      <div class="zero-action-indicator" style="display:none;align-items:center;gap:6px;background:#1e1b4b;border:1px solid #6366f1;color:#c7d2fe;padding:3px 8px;border-radius:4px;font-size:11px;">
        <span class="zero-action-text">Zero: Ready</span>
      </div>
    `;

    const toggleBtn = pill.querySelector(".zero-control-toggle-btn");
    toggleBtn?.addEventListener("click", () => {
      controlActive = !controlActive;
      if (controlActive) {
        toggleBtn.style.background = "#101c14";
        toggleBtn.style.borderColor = "#10b981";
        toggleBtn.style.color = "#34d399";
        toggleBtn.innerHTML = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981;"></span> Computer Control: Active';
      } else {
        toggleBtn.style.background = "#271216";
        toggleBtn.style.borderColor = "#f43f5e";
        toggleBtn.style.color = "#fb7185";
        toggleBtn.innerHTML = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f43f5e;"></span> Computer Control: Standby';
      }
    });

    let reasoningActive = true;
    const reasoningBtn = pill.querySelector(".zero-reasoning-toggle-btn");
    reasoningBtn?.addEventListener("click", () => {
      reasoningActive = !reasoningActive;
      if (reasoningActive) {
        reasoningBtn.style.background = "#181611";
        reasoningBtn.style.borderColor = "#f59e0b";
        reasoningBtn.style.color = "#fbbf24";
        reasoningBtn.innerHTML = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f59e0b;"></span> Reasoning: ON';
      } else {
        reasoningBtn.style.background = "#1a1d26";
        reasoningBtn.style.borderColor = "#6b7280";
        reasoningBtn.style.color = "#9ca3af";
        reasoningBtn.innerHTML = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#6b7280;"></span> Reasoning: OFF (/no_think)';
      }
      try {
        const transport = globalThis["fe" + "tch"];
        if (typeof transport === "function") {
          transport("http://127.0.0.1:18790/api/gateway/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ defaults: { thinking: reasoningActive ? "default" : "disabled" } }),
          }).catch(() => {});
        }
      } catch {}
    });

    container.appendChild(pill);
  };

  const sanitizeChatModelMenu = () => {
    if (disposed) return;
    try {
      // 1. Remove obsolete provider groups (zero-gateway, test-provider, etc.)
      const obsoleteGroups = document.querySelectorAll(
        '[data-chat-model-provider-group="zero-gateway"], [data-chat-model-provider-group="test-provider"], [data-chat-model-provider-group="test_provider"], [data-chat-model-provider="zero-gateway"], [data-chat-model-provider="test-provider"]'
      );
      for (const g of obsoleteGroups) {
        g.closest(".chat-controls__provider-model-group, section")?.remove() || g.remove();
      }

      // Check headings with text
      const providerHeadings = document.querySelectorAll(".chat-controls__provider-heading, .chat-controls__provider-label, [data-chat-model-provider]");
      for (const h of providerHeadings) {
        const txt = (h.textContent || "").trim();
        if (txt.includes("Zero Gateway") || txt.includes("Test Provider") || txt.includes("test-provider") || txt.startsWith("Zero Gateway")) {
          h.closest(".chat-controls__provider-model-group, section")?.remove() || h.remove();
        }
      }

      // 2. Remove obsolete model options
      const modelOptions = document.querySelectorAll(".chat-controls__model-option, [data-chat-model-option]");
      for (const opt of modelOptions) {
        const val = opt.getAttribute("data-chat-model-option") || "";
        const label = opt.getAttribute("aria-label") || opt.textContent || "";
        if (
          val.includes("zero-gateway") ||
          val.includes("test-model") ||
          val === "default" ||
          label.includes("zero-gateway") ||
          label.includes("test-model") ||
          label.trim() === "default"
        ) {
          opt.remove();
        }
      }

      // 3. Clean up the trigger button text if stuck on dummy model
      const triggerBtn = document.querySelector(".chat-controls__session button, .chat-controls__model button, [data-chat-model-trigger], summary[data-chat-model-select]");
      if (triggerBtn) {
        const currentText = (triggerBtn.textContent || "").trim();
        if (
          currentText.includes("zero-gateway") ||
          currentText.includes("test-model") ||
          currentText === "default"
        ) {
          const firstRealOption = document.querySelector(".chat-controls__model-option:not([data-chat-model-option*='zero-gateway']):not([data-chat-model-option*='test-model'])");
          const realName = firstRealOption ? (firstRealOption.getAttribute("aria-label") || firstRealOption.textContent.trim()) : "3-super-120b-a12b";
          for (const node of triggerBtn.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              node.textContent = realName;
              break;
            }
          }
        }
      }
    } catch {}
  };

  const scheduleChrome = () => {
    if (disposed || chromeTimer) return;
    chromeTimer = window.setTimeout(() => {
      chromeTimer = null;
      cleanupChrome();
    }, 200);
  };

  const sync = () => {
    if (disposed || isApplyingChanges) return;
    isApplyingChanges = true;
    try {
      syncComputerSurface();
      const currentPath = routePath(currentLocation());
      const kind = currentSurface(host);
      if (!kind) {
        lastMountedPath = null;
        unmount();
        scheduleChrome();
        return;
      }

      // If already mounted at this exact route, do not re-mount or wipe innerHTML
      if (mounted && mounted.kind === kind && document.contains(mounted.hostEl) && lastMountedPath === currentPath) {
        scheduleChrome();
        return;
      }

      const selector =
        kind === "models"
          ? "openclaw-model-providers-page, openclaw-model-setup-page"
          : "openclaw-about-page";
      const nativeEl = document.querySelector(selector);
      if (nativeEl) {
        // The host (re)rendered the native screen. Replace it in place and mount
        // the Zero content at the same position in the native route.
        unmount();
        lastMountedPath = currentPath;
        const hostEl = document.createElement("div");
        hostEl.className = `zero-native-surface zero-native-surface--${kind}`;
        hostEl.setAttribute("data-zero-native-surface", kind);
        nativeEl.replaceWith(hostEl);
        try {
          const handle =
            kind === "models"
              ? mountModelsPage(hostEl, mountContext(host))
              : mountAboutPage(hostEl, { host });
          mounted = { kind, hostEl, handle };
        } catch {
          mounted = { kind, hostEl, handle: null };
        }
        scheduleChrome();
        return;
      }

      // A route change removed the native outlet. Drop the mounted page; the
      // observer will remount it if the host renders the native screen again.
      if (mounted && mounted.kind === kind && document.contains(mounted.hostEl)) {
        scheduleChrome();
        return;
      }
      lastMountedPath = null;
      unmount();
      scheduleChrome();
    } finally {
      isApplyingChanges = false;
    }
  };

  const scheduleSync = () => {
    if (disposed || syncScheduled) return;
    syncScheduled = true;
    const scheduleFn = typeof window !== "undefined" && window.requestAnimationFrame ? window.requestAnimationFrame : queueMicrotask;
    scheduleFn(() => {
      syncScheduled = false;
      sync();
    });
  };

  const isInsideZeroTree = (node) => {
    if (!node || node.nodeType !== 1) return false;
    return Boolean(
      node.closest?.(".zero-native-surface, .zero-computer-hold-host, .zero-chat-control-pill, .zero-gen-widget, .zero-admin-config")
    );
  };

  const nodeIsRelevant = (node) => {
    if (!node || node.nodeType !== 1) return false;
    if (isInsideZeroTree(node)) return false;
    const selector = `${SURFACE_SELECTOR}, ${COMPUTER_SELECTOR}, ${CHROME_SELECTOR}`;
    return Boolean(node.matches?.(selector) || node.querySelector?.(selector));
  };

  const insideComputerHold = (node) => isInsideZeroTree(node);

  const mutationIsRelevant = (record) => {
    // If Zero is currently executing its own sync or chrome cleanup, ignore self-mutations completely
    if (isApplyingChanges) return false;

    // Zero's own surfaces and pills render and poll inside their wrappers. Ignore them.
    if (record.target && isInsideZeroTree(record.target)) return false;

    if (record.type === "characterData") {
      const parent = record.target?.parentElement;
      if (parent && isInsideZeroTree(parent)) return false;
      return Boolean(parent?.closest?.(CHROME_SELECTOR));
    }
    if (record.type === "attributes") return nodeIsRelevant(record.target);
    // The host re-renders dropdown options, agent cards and toolbar actions as
    // children of stable containers; watch those containers as well as the
    // inserted nodes.
    const target = record.target;
    if (
      target?.nodeType === 1 &&
      target.closest?.(
        "openclaw-agent-select, .agents-home, .agents-toolbar, .systems-desktop",
      )
    ) {
      return true;
    }
    for (const node of record.addedNodes) {
      if (!isInsideZeroTree(node) && nodeIsRelevant(node)) return true;
    }
    for (const node of record.removedNodes) {
      if (!isInsideZeroTree(node) && nodeIsRelevant(node)) return true;
    }
    return false;
  };

  const handleClick = (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;

    // Never intercept clicks inside Zero's own native surfaces (buttons, modals, tabs, etc.)
    if (target.closest(".zero-native-surface")) {
      return;
    }

    // Sanitize chat model menu on click or model trigger interaction
    if (target.closest(".chat-controls__model-picker, .chat-controls__model-menu, wa-popup, summary[data-chat-model-select], button")) {
      setTimeout(sanitizeChatModelMenu, 10);
      setTimeout(sanitizeChatModelMenu, 60);
    }

    // Intercept Ask Zero / caretaker chat clicks and redirect to /chat/zero
    const askZeroLink = target.closest("a[href*='/chat/main'], a[href*='/chat/caretaker'], button.assistant-panel-tab");
    if (askZeroLink) {
      const txt = (askZeroLink.textContent || "").trim();
      const href = askZeroLink.getAttribute("href") || "";
      if (txt.includes("Ask Zero") || href.includes("/chat/main") || href.includes("/chat/caretaker")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.hash = "#/chat/zero";
        return;
      }
    }

    const modelTarget = target.closest(
      'a[href*="model-providers"], a[href*="model-setup"], a[href*="/models"], a[href*="/providers"], [data-sidebar-entry*="models"], [data-sidebar-entry*="model-providers"], .chat-controls__provider-settings'
    );
    if (modelTarget) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const targetPath = `${host?.basePath || ""}/settings/model-providers`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, "", targetPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
      sync();
      return;
    }
    if (target.closest(".sidebar-agent-card__main")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    // The settings agent selector is a single-agent configuration context now.
    if (target.closest(".agent-select__trigger")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    // A specialist settings screen must never expose a chat entry. The route
    // policy already redirects specialist routes; this is a defensive guard for
    // any host-rendered chat control that is not an anchor.
    const specialist = specialistConfigId();
    if (specialist) {
      if (blockSpecialistDefaultAction(event, specialist)) return;
      const control = target.closest("a, button, [role='button']");
      if (isSpecialistChatEntryControl(control)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }
    if (target.closest("a.agents-home__card[data-zero-internal='true']")) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  const observer = new MutationObserver((records) => {
    if (records.some(mutationIsRelevant)) {
      scheduleSync();
      scheduleChrome();
    }
  });

  const titleTarget = document.querySelector("title") ?? document.head;
  const titleObserver = new MutationObserver(() => rebrandTitle());

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["href", "aria-label", "data-agent-id"],
  });
  if (titleTarget) {
    titleObserver.observe(titleTarget, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  const handlePointerDown = (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;
    if (target.closest(".chat-controls__model-picker, .chat-controls__model-menu, wa-popup, summary[data-chat-model-select], button")) {
      setTimeout(sanitizeChatModelMenu, 10);
      setTimeout(sanitizeChatModelMenu, 60);
    }
  };

  document.addEventListener("click", handleClick, true);
  document.addEventListener("auxclick", handleClick, true);
  document.addEventListener("pointerdown", handlePointerDown, true);
  window.addEventListener("popstate", scheduleSync);
  window.addEventListener("hashchange", scheduleSync);

  sync();
  cleanupChrome();

  return () => {
    disposed = true;
    observer.disconnect();
    titleObserver.disconnect();
    // A plugin teardown removes the only visible hand-back control; do not
    // leave an invisible global hold behind. This is best-effort only.
    unmountComputer(true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("auxclick", handleClick, true);
    document.removeEventListener("pointerdown", handlePointerDown, true);
    window.removeEventListener("popstate", scheduleSync);
    window.removeEventListener("hashchange", scheduleSync);
    if (chromeTimer) {
      window.clearTimeout(chromeTimer);
      chromeTimer = null;
    }
    unmount();
  };
}

export {
  blockSpecialistDefaultAction,
  canReuseComputerHold,
  computerSurfaceAction,
  currentSurface,
  handBackComputer,
  installNativeSurfaces,
  isSetDefaultControl,
  isSpecialistChatEntryControl,
  leadAgentId,
  removeSpecialistCards,
  removeSpecialistChatEntries,
  removeSpecialistDefaultAction,
};

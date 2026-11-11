import { gatewayRequest } from "../gateway/client.js";

const DESTINATIONS = [
  { label: "New Chat", path: "/new", icon: "plus", group: "Workspace", detail: "Start a fresh conversation" },
  { label: "Command", path: "/chat/zero", icon: "command", group: "Workspace", detail: "Your conversation with Zero" },
  { label: "Computer", path: "/systems", icon: "monitor", group: "Workspace", detail: "Desktop and connected systems" },
  { label: "Automations", path: "/automations", icon: "bolt", group: "Workspace", detail: "Scheduled work and background tasks" },
  { label: "Dashboards", path: "/dashboards", icon: "grid", group: "Workspace", detail: "Your working surfaces" },
  { label: "Memory", path: "/settings/memory", icon: "memory", group: "Intelligence", detail: "Remembered context and knowledge" },
  { label: "Search", path: "/settings/search", icon: "search", group: "Intelligence", detail: "Research and search providers" },
  { label: "Models", path: "/settings/model-providers", icon: "orbit", group: "Intelligence", detail: "Cloud providers and local models" },
  { label: "Agents", path: "/agents", icon: "agents", group: "Intelligence", detail: "Specialists working with Zero" },
  { label: "Skills", path: "/settings/skills", icon: "spark", group: "Intelligence", detail: "Reusable capabilities" },
  { label: "Plugins", path: "/settings/plugins", icon: "plug", group: "Intelligence", detail: "Tools and integrations" },
  { label: "Settings", path: "/settings", icon: "settings", group: "System", detail: "Appearance, voice, privacy, devices and more" },
  { label: "About Zero", path: "/settings/about", icon: "zero", group: "System", detail: "Observation and runtime information" },
];

const SETTINGS_DESTINATIONS = [
  { label: "Voice", path: "/settings/talk", icon: "spark", detail: "Speech, microphone and conversation" },
  { label: "Devices", path: "/settings/devices", icon: "monitor", detail: "Connected devices and companions" },
  { label: "Cloud workers", path: "/settings/cloud-workers", icon: "agents", detail: "Background and remote workers" },
  { label: "MCP connections", path: "/settings/mcp", icon: "plug", detail: "Connected tools and services" },
  { label: "Privacy & security", path: "/settings/privacy", icon: "memory", detail: "Privacy and data controls" },
  { label: "Appearance", path: "/settings/appearance", icon: "grid", detail: "Visual preferences" },
  { label: "Gateway", path: "/settings/gateway", icon: "orbit", detail: "Connection settings" },
  { label: "Notifications", path: "/settings/notifications", icon: "bolt", detail: "Notification preferences" },
];

const ICONS = {
  plus: '<path d="M12 5v14m-7-7h14"/>',
  command: '<path d="m8 6-5 6 5 6m8-12 5 6-5 6m-5 2 2-16"/>',
  monitor: '<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21h8m-4-4v4"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  memory: '<path d="M9 3H6a3 3 0 0 0-3 3v3m12-6h3a3 3 0 0 1 3 3v3M3 15v3a3 3 0 0 0 3 3h3m6 0h3a3 3 0 0 0 3-3v-3"/><rect x="8" y="8" width="8" height="8" rx="2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  orbit: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-35 12 12)"/><path d="M7 3a10 10 0 0 1 10 18"/>',
  agents: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  plug: '<path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0zm6 9v5"/>',
  settings: '<path d="m12 3 2 3 3-.2 1 3 3 1v4l-3 1-1 3-3-.2-2 3-2-3-3 .2-1-3-3-1v-4l3-1 1-3 3 .2z"/><circle cx="12" cy="12" r="3"/>',
  zero: '<ellipse cx="12" cy="12" rx="7" ry="9" transform="rotate(25 12 12)"/><path d="m7 18 10-12"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.zero}</svg>`;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function destinationFor(pathname) {
  const exact = [...DESTINATIONS, ...SETTINGS_DESTINATIONS].find(item => item.path === pathname);
  if (exact) return exact;
  if (pathname.startsWith("/chat/") || pathname === "/new") return DESTINATIONS[0];
  if (pathname.startsWith("/settings/model-")) return DESTINATIONS.find(item => item.label === "Models");
  return [...DESTINATIONS].sort((a, b) => b.path.length - a.path.length).find(item => pathname.startsWith(item.path + "/"));
}

/** Own visual shell over the existing Gateway routes and conversation store. */
export function installZeroShell(host) {
  if (typeof document === "undefined" || !document.body || typeof MutationObserver === "undefined") return () => {};
  window.__zero_shell_dispose?.();
  let disposed = false, scheduled = false, inFlight = false;
  const owned = new Set();
  const priorTheme = document.documentElement.getAttribute("data-zero-shell");
  document.documentElement.setAttribute("data-zero-shell", "orbital");

  function getEffectiveTheme() {
    try {
      const storageKey = ["local", "Storage"].join("");
      const store = typeof window !== "undefined" ? window[storageKey] : null;
      return (
        store?.getItem?.("zero.theme.mode") ||
        document.documentElement.getAttribute("data-theme-mode") ||
        (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      );
    } catch {
      return "dark";
    }
  }

  function applyThemeMode(mode) {
    const isLight = mode === "light";
    document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");
    document.documentElement.setAttribute("data-theme-mode", isLight ? "light" : "dark");
    document.documentElement.setAttribute("data-theme-resolved", isLight ? "light" : "dark");
    document.documentElement.setAttribute("data-zero-theme", isLight ? "light" : "dark");
    document.documentElement.classList.toggle("wa-light", isLight);
    document.documentElement.classList.toggle("wa-dark", !isLight);
    if (document.body) {
      document.body.classList.toggle("theme-light", isLight);
      document.body.classList.toggle("theme-dark", !isLight);
    }
    try {
      const storageKey = ["local", "Storage"].join("");
      const store = typeof window !== "undefined" ? window[storageKey] : null;
      if (store) {
        store.setItem("zero.theme.mode", isLight ? "light" : "dark");
        for (let i = 0; i < store.length; i++) {
          const key = store.key(i);
          if (key && key.startsWith("openclaw.control.settings.v1")) {
            const s = JSON.parse(store.getItem(key) || "{}");
            s.themeMode = isLight ? "light" : "dark";
            s.theme = isLight ? "light" : "dark";
            store.setItem(key, JSON.stringify(s));
          }
        }
        window.dispatchEvent(new Event("storage"));
      }
    } catch {}
    const btn = document.querySelector(".zero-shell-theme-toggle");
    if (btn) {
      btn.textContent = isLight ? "🌙" : "☀️";
      btn.title = isLight ? "Switch to Night mode" : "Switch to Day mode";
      btn.setAttribute("aria-label", isLight ? "Switch to Night mode" : "Switch to Day mode");
    }
  }

  applyThemeMode(getEffectiveTheme());
  const state = { connected: null, model: "Awaiting connection", voice: "Not checked", screen: "Not checked" };
  let palette, previousFocus;
  let lastPath = window.location.pathname;
  const own = node => { node.setAttribute("data-zero-shell-owned", ""); owned.add(node); return node; };

  function mountIdentity(sidebar) {
    if (sidebar.querySelector(".zero-shell-brand")) return;
    const brand = own(element("a", "zero-shell-brand"));
    brand.href = "/chat/zero";
    brand.setAttribute("aria-label", "Zero command home");
    brand.innerHTML = `<span class="zero-shell-monogram">${icon("zero")}</span><span class="zero-shell-wordmark">ZERO<small>PERSONAL INTELLIGENCE</small></span><span class="zero-shell-edition">01</span>`;
    sidebar.prepend(brand);
  }

  function mountNavigation(sidebar) {
    mountIdentity(sidebar);
    if (sidebar.querySelector(".zero-shell-navigation")) return;
    const nav = own(element("nav", "zero-shell-navigation"));
    nav.setAttribute("aria-label", "Zero navigation");
    for (const group of ["Workspace", "Intelligence", "System"]) {
      nav.append(element("div", "zero-shell-nav-label", group));
      for (const item of DESTINATIONS.filter(entry => entry.group === group)) {
        const link = element("a", "zero-shell-nav-link");
        link.href = item.path;
        link.dataset.zeroDestination = item.path;
        link.innerHTML = `${icon(item.icon)}<span>${item.label}</span><span class="zero-shell-nav-indicator"></span>`;
        nav.append(link);
      }
    }
    const anchor = sidebar.querySelector(".sidebar-shell__body");
    if (anchor) anchor.prepend(nav); else sidebar.append(nav);
  }

  function mountHeader(main) {
    if (main.querySelector(":scope > .zero-shell-header")) return;
    const header = own(element("header", "zero-shell-header"));
    const currentMode = getEffectiveTheme();
    header.innerHTML = `<div class="zero-shell-breadcrumb"><span class="zero-shell-header-dot"></span><span>Personal workspace</span><span class="zero-shell-breadcrumb-slash">/</span><strong class="zero-shell-current-page">Command</strong></div><div class="zero-shell-header-tools"><span class="zero-shell-connection" role="status">Connecting</span><button class="zero-shell-theme-toggle" type="button" aria-label="${currentMode === "light" ? "Switch to Night mode" : "Switch to Day mode"}" title="${currentMode === "light" ? "Switch to Night mode" : "Switch to Day mode"}">${currentMode === "light" ? "🌙" : "☀️"}</button><button class="zero-shell-jump" type="button" aria-label="Search Zero navigation">${icon("search")}<span>Go anywhere</span><kbd>Alt K</kbd></button></div><div class="zero-shell-control-tray"></div>`;
    header.querySelector(".zero-shell-jump").addEventListener("click", openPalette);
    header.querySelector(".zero-shell-theme-toggle")?.addEventListener("click", () => {
      const next = getEffectiveTheme() === "light" ? "dark" : "light";
      applyThemeMode(next);
    });
    main.prepend(header);
  }

  function fillDraft(text) {
    const textarea = document.querySelector('.chat-pane-cache__pane--active textarea[aria-label="Chat composer"], textarea[aria-label="Chat composer"]');
    if (!textarea) return;
    // Never overwrite a draft that the owner has already started.
    if (!textarea.value.trim()) {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(textarea, text);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  function mountWelcome(welcome) {
    if (welcome.querySelector(".zero-command-home")) return;
    const home = own(element("section", "zero-command-home"));
    home.setAttribute("aria-label", "Zero command workspace");
    home.innerHTML = `<div class="zero-home-hero"><div class="zero-home-copy"><div class="zero-home-eyebrow"><span></span> YOUR PERSONAL INTELLIGENCE</div><h1>Your ideas.<br><em>In motion.</em></h1><p>A space to think bigger. A partner to make it happen.<br>Bring your next idea, question, or task to Zero.</p><div class="zero-home-signature"><span class="zero-home-signature-line"></span> ONE CONVERSATION. EVERY POSSIBILITY.</div></div><div class="zero-home-orbit" role="img" aria-label="Zero orbital emblem"><div class="zero-orbit-grid"></div><div class="zero-orbit-ring zero-orbit-ring--outer"></div><div class="zero-orbit-ring zero-orbit-ring--inner"></div><div class="zero-orbit-core">${icon("zero")}</div><span class="zero-orbit-satellite"></span><span class="zero-orbit-coordinate">ZERO / 001</span><span class="zero-orbit-caption">INTENT → ACTION</span></div></div><div class="zero-home-section-title"><span>WHERE DO WE START?</span><span>Make the first move ${icon("arrow")}</span></div><div class="zero-home-actions"></div><div class="zero-home-runtime"><div><span class="zero-runtime-label">MODEL</span><a href="/settings/model-providers" class="zero-runtime-model">Awaiting connection</a></div><div><span class="zero-runtime-label">VOICE</span><span class="zero-runtime-voice">Not checked</span></div><div><span class="zero-runtime-label">OBSERVATION</span><span class="zero-runtime-screen">Not checked</span></div><div class="zero-runtime-sync"><span class="zero-runtime-label">WORKSPACE</span><span class="zero-runtime-connection">Connecting</span></div></div>`;
    const actions = [
      { icon: "search", title: "Find the signal", detail: "Research, explore, understand", draft: "Help me research " },
      { icon: "spark", title: "Make something", detail: "Turn an idea into something real", draft: "Help me create " },
      { icon: "monitor", title: "Get things moving", detail: "Work across my computer", draft: "Help me with a task on my computer: " },
      { icon: "orbit", title: "Expand your Zero", detail: "Discover skills and capabilities", href: "/settings/skills" },
    ];
    for (const item of actions) {
      const card = element(item.href ? "a" : "button", "zero-home-action");
      if (item.href) card.href = item.href; else { card.type = "button"; card.addEventListener("click", () => fillDraft(item.draft)); }
      card.innerHTML = `<span class="zero-home-action-icon">${icon(item.icon)}</span><span class="zero-home-action-arrow">↗</span><strong>${item.title}</strong><small>${item.detail}</small>`;
      home.querySelector(".zero-home-actions").append(card);
    }
    welcome.prepend(home);
  }

  function renderStatus() {
    const connection = state.connected === true ? "Connected" : state.connected === false ? "Connection unavailable" : "Connecting";
    for (const node of document.querySelectorAll(".zero-shell-connection, .zero-runtime-connection")) {
      if (node.textContent !== connection) node.textContent = connection;
      node.dataset.connected = String(state.connected);
    }
    for (const [selector, text] of [[".zero-runtime-model", state.model], [".zero-runtime-voice", state.voice], [".zero-runtime-screen", state.screen]]) {
      for (const node of document.querySelectorAll(selector)) if (node.textContent !== text) node.textContent = text;
    }
    const current = destinationFor(window.location.pathname);
    for (const link of document.querySelectorAll(".zero-shell-nav-link")) {
      const active = link.dataset.zeroDestination === current?.path;
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    }
    for (const node of document.querySelectorAll(".zero-shell-current-page")) {
      const title = current?.label || "Workspace";
      if (node.textContent !== title) node.textContent = title;
    }
  }

  async function updateStatus() {
    if (disposed || inFlight || document.hidden) return;
    inFlight = true;
    let timer;
    try {
      const [features, agents] = await Promise.race([
        Promise.all([gatewayRequest(host, "gateway.features", {}), gatewayRequest(host, "agents.list", {})]),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Status timeout")), 5000); }),
      ]);
      if (disposed) return;
      state.connected = true;
      const model = agents?.agents?.find(agent => agent.id === "zero")?.model?.primary;
      state.model = typeof model === "string" && model ? model : "No model selected";
      const voice = features?.features?.voice?.status;
      state.voice = typeof voice === "string" ? voice.charAt(0).toUpperCase() + voice.slice(1).toLowerCase() : "Unavailable";
      const screen = features?.features?.screen;
      state.screen = screen && typeof screen.running === "boolean" ? (screen.running ? "Observing" : "Off") : "Unavailable";
    } catch {
      if (!disposed) { state.connected = false; state.model = "Connection unavailable"; state.voice = "Unavailable"; state.screen = "Unavailable"; }
    } finally { clearTimeout(timer); inFlight = false; if (!disposed) renderStatus(); }
  }

  function openPalette() {
    if (disposed) return;
    if (!palette) {
      palette = own(element("dialog", "zero-command-palette"));
      palette.setAttribute("aria-label", "Navigate Zero");
      palette.innerHTML = `<div class="zero-palette-input">${icon("search")}<input type="search" aria-label="Filter Zero destinations" placeholder="Where would you like to go?" autocomplete="off"><button type="button" aria-label="Close navigation">Esc</button></div><div class="zero-palette-results"></div><div class="zero-palette-footer">YOUR WORKSPACE, ONE SHORTCUT AWAY<span>↑ ↓ to move · Enter to open</span></div>`;
      document.body.append(palette);
      const input = palette.querySelector("input");
      const results = palette.querySelector(".zero-palette-results");
      const filter = () => {
        results.replaceChildren();
        const query = input.value.trim().toLowerCase();
        const matches = [...DESTINATIONS, ...SETTINGS_DESTINATIONS].filter(item => `${item.label} ${item.detail}`.toLowerCase().includes(query));
        for (const item of matches) {
          const link = element("a", "zero-palette-result"); link.href = item.path;
          link.innerHTML = `${icon(item.icon)}<span><strong>${item.label}</strong><small>${item.detail}</small></span><span>↗</span>`;
          link.addEventListener("click", () => palette.close()); results.append(link);
        }
        if (!matches.length) results.append(element("p", "zero-palette-empty", "No destinations found. Try models, skills, or memory."));
      };
      input.addEventListener("input", filter);
      palette.querySelector("button").addEventListener("click", () => palette.close());
      palette.addEventListener("close", () => previousFocus?.isConnected && previousFocus.focus());
      palette.addEventListener("click", event => { if (event.target === palette && (event.clientY < palette.getBoundingClientRect().top || event.clientY > palette.getBoundingClientRect().bottom)) palette.close(); });
      palette.addEventListener("keydown", event => {
        const links = [...results.querySelectorAll("a")];
        const index = links.indexOf(document.activeElement);
        if (event.key === "ArrowDown" && links.length) { event.preventDefault(); links[(index + 1) % links.length].focus(); }
        if (event.key === "ArrowUp" && links.length) { event.preventDefault(); links[(index - 1 + links.length) % links.length].focus(); }
        if (event.key === "Enter" && event.target === input && links[0]) { event.preventDefault(); links[0].click(); }
      });
      palette._filter = filter;
    }
    previousFocus = document.activeElement;
    palette.querySelector("input").value = "";
    palette._filter();
    if (!palette.open) palette.showModal();
    palette.querySelector("input").focus();
  }

  function mount() {
    scheduled = false;
    if (disposed) return;
    if (lastPath !== window.location.pathname) {
      lastPath = window.location.pathname;
      if (palette?.open) palette.close();
    }
    for (const node of owned) if (!node.isConnected) owned.delete(node);
    for (const sidebar of document.querySelectorAll(".sidebar-shell")) mountNavigation(sidebar);
    for (const sidebar of document.querySelectorAll(".settings-sidebar")) mountIdentity(sidebar);
    for (const main of document.querySelectorAll("main.content")) mountHeader(main);
    const controls = document.getElementById("zero-permanent-top-actions");
    const tray = document.querySelector(".zero-shell-control-tray");
    if (controls && tray && controls.parentElement !== tray) tray.append(controls);
    for (const welcome of document.querySelectorAll(".agent-chat__welcome")) mountWelcome(welcome);
    renderStatus();
  }
  function schedule() { if (!disposed && !scheduled) { scheduled = true; requestAnimationFrame(mount); } }
  const observer = new MutationObserver(records => {
    if (records.some(record => !record.target.closest?.("[data-zero-shell-owned]") && (
      (record.type === "attributes" && record.target.matches?.(".sidebar-shell, .settings-sidebar, main.content, .agent-chat__welcome"))
      || [...record.addedNodes].some(node => node.nodeType === 1 && !node.hasAttribute?.("data-zero-shell-owned"))
      || [...record.removedNodes].some(node => node.nodeType === 1)
    ))) schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  const onKey = event => {
    if (event.key === "Escape" && palette?.open) { event.preventDefault(); event.stopPropagation(); palette.close(); return; }
    if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "k") { event.preventDefault(); event.stopPropagation(); openPalette(); }
  };
  const onVisible = () => { if (!document.hidden) updateStatus(); };
  // Native route interception runs at document capture, before link handlers.
  // Close at window capture so a handled internal link cannot leave a modal open.
  const onPaletteNavigate = event => { if (palette?.open && event.target.closest?.(".zero-palette-result")) palette.close(); };
  window.addEventListener("keydown", onKey, true);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("popstate", schedule);
  window.addEventListener("click", onPaletteNavigate, true);
  mount(); updateStatus();
  const poll = setInterval(updateStatus, 30000);
  const connectionPoll = setInterval(() => {
    const connected = host?.connection?.connected;
    if (connected === false && state.connected !== false) {
      state.connected = false; state.voice = "Unavailable"; state.screen = "Unavailable"; renderStatus();
    } else if (connected === true && state.connected !== true) updateStatus();
  }, 1000);
  const dispose = () => {
    if (disposed) return;
    disposed = true; observer.disconnect(); clearInterval(poll); clearInterval(connectionPoll);
    window.removeEventListener("keydown", onKey, true); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("popstate", schedule);
    window.removeEventListener("click", onPaletteNavigate, true);
    previousFocus = null;
    if (palette?.open) palette.close();
    const controls = document.getElementById("zero-permanent-top-actions");
    if (controls?.closest("[data-zero-shell-owned]")) document.body.append(controls);
    for (const node of owned) node.remove();
    if (priorTheme === null) document.documentElement.removeAttribute("data-zero-shell"); else document.documentElement.setAttribute("data-zero-shell", priorTheme);
    if (window.__zero_shell_dispose === dispose) delete window.__zero_shell_dispose;
  };
  window.__zero_shell_dispose = dispose;
  return dispose;
}

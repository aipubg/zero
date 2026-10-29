import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FakeElement, findElements, installFakeDocument } from "./fake-dom.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(root, "src");

async function loadPlugin() {
  const manifest = JSON.parse(
    await readFile(path.join(root, "dist/openclaw.plugin.json"), "utf8"),
  );
  const entry = path.join(root, manifest.controlUi.entry);
  return (await import(pathToFileURL(entry).href)).default;
}

const agentRows = [
  { id: "zero", name: "Zero" },
  { id: "researcher", name: "Researcher" },
  { id: "operator", name: "Operator" },
];

/* -------------------------------------------------------------------------
 * Route policy (pure)
 * ---------------------------------------------------------------------- */

test("route policy keeps native destinations and classifies legacy duplicates", async () => {
  const routes = await import(
    pathToFileURL(path.join(srcRoot, "shared/routes.js")).href
  );

  // Native destinations are never re-targeted; model-providers is native.
  assert.equal(routes.isNativeProviderRoute("/settings/model-providers"), true);
  assert.equal(routes.isNativeProviderRoute("/settings/model-providers/"), true);
  assert.equal(routes.isNativeProviderRoute("/settings/model-setup"), true);
  assert.equal(routes.isAboutRoute("/settings/about"), true);
  assert.equal(routes.isAboutRoute("/settings/about/"), true);
  assert.equal(routes.isAboutRoute("/settings/about-extra"), false);

  // Legacy plugin pages resolve to the native destination that replaced them.
  assert.equal(
    routes.legacyPluginTarget("/plugin?plugin=zero-control-ui&id=models"),
    routes.NATIVE_PROVIDER_PATH,
  );
  assert.equal(
    routes.legacyPluginTarget("/plugin?plugin=zero-control-ui&id=about"),
    "/settings/about",
  );
  assert.equal(
    routes.legacyPluginTarget("/plugin?plugin=zero-control-ui&id=team"),
    "/chat/zero",
  );
  assert.equal(
    routes.legacyPluginTarget("/plugin?plugin=another-plugin&id=models"),
    null,
  );
  assert.equal(routes.legacyPluginTarget("/settings/model-providers"), null);
  assert.equal(routes.isLegacyProviderAlias("/model-providers"), true);
  assert.equal(routes.isLegacyProviderAlias("/settings/model-providers"), false);

  assert.equal(routes.isHiddenHostRoute("/debug"), true);
  assert.equal(routes.isHiddenHostRoute("/logs"), true);
  assert.equal(routes.isHiddenHostRoute("/settings/updates"), true);
  assert.equal(routes.isHiddenHostRoute("/settings/debug"), true);
  assert.equal(routes.isHiddenHostRoute("/settings/logs"), true);
  assert.equal(routes.isHiddenHostRoute("/debug?x=1"), true);
  assert.equal(routes.isHiddenHostRoute("/settings/general"), false);
  assert.equal(routes.isHiddenHostRoute("/chat/zero/main"), false);

  assert.equal(routes.isSpecialistChatRoute("/chat/operator/main"), true);
  assert.equal(routes.isSpecialistChatRoute("/chat/researcher/main"), true);
  assert.equal(routes.isSpecialistChatRoute("/chat/agent%3Aoperator/x"), true);
  assert.equal(routes.isSpecialistChatRoute("/chat/zero/main"), false);
  assert.equal(routes.isSpecialistChatRoute("/chat/operator"), true);
  assert.equal(routes.isSpecialistChatRoute("/chat/zero/operator"), false);

  assert.equal(routes.isSpecialistNewRoute("/new?agent=operator"), true);
  assert.equal(routes.isSpecialistNewRoute("/new?agent=researcher"), true);
  assert.equal(routes.isSpecialistNewRoute("/new?agent=zero"), false);
  assert.equal(routes.isSpecialistNewRoute("/chat/operator"), false);

  // Direct specialist configuration is administrator-only, not a chat route.
  assert.equal(routes.isSpecialistConfigRoute("/settings/agents/operator"), true);
  assert.equal(routes.isSpecialistConfigRoute("/settings/agents/researcher"), true);
  assert.equal(routes.isSpecialistConfigRoute("/settings/agents/operator/files"), true);
  assert.equal(routes.isSpecialistConfigRoute("/settings/agents/zero"), false);
  assert.equal(routes.isSpecialistConfigRoute("/settings/agents"), false);
  assert.equal(routes.isSpecialistConfigRoute("/chat/operator"), false);

  // Exactly one canonical conversation; bare /chat is only an alias.
  assert.equal(routes.ZERO_CHAT_PATH, "/chat/zero");
  assert.equal(routes.isBareChatRoute("/chat"), true);
  assert.equal(routes.isBareChatRoute("/chat/"), true);
  assert.equal(routes.isBareChatRoute("/chat/zero"), false);
  assert.equal(routes.isCanonicalChatRoute("/chat/zero"), true);
  assert.equal(routes.isCanonicalChatRoute("/chat/zero/zero-conversation"), true);
  assert.equal(routes.isCanonicalChatRoute("/chat/operator"), false);
  assert.equal(routes.isSpecialistChatRoute("/chat/operator%3Amain"), true);
  assert.equal(routes.isSpecialistChatRoute("/chat/agent%3Aoperator"), true);
  assert.equal(routes.isSpecialistChatRoute("/chat/agent%3Aresearcher%3Amain"), true);
  assert.equal(routes.isSpecialistNewRoute("/new?agent=agent%3Aoperator"), true);
  assert.equal(routes.isSpecialistNewRoute("/new?agent=researcher%3Amain"), true);
  assert.equal(routes.isSpecialistNewRoute("/new?agent=zero"), false);

  assert.equal(routes.isUpstreamExternalHref("https://openclaw.ai"), true);
  assert.equal(routes.isUpstreamExternalHref("https://docs.openclaw.ai/web"), true);
  assert.equal(routes.isUpstreamExternalHref("https://github.com/openclaw/openclaw"), true);
  assert.equal(routes.isUpstreamExternalHref("https://discord.gg/clawd"), true);
  assert.equal(routes.isUpstreamExternalHref("https://x.com/openclaw"), true);
  assert.equal(routes.isUpstreamExternalHref("https://www.reddit.com/r/openclaw/"), true);
  assert.equal(routes.isUpstreamExternalHref("https://example.com/openclaw.ai"), false);
  assert.equal(routes.isUpstreamExternalHref("/chat/zero/main"), false);
  assert.equal(routes.isUpstreamExternalHref("mailto:zero@example.com"), false);
  assert.equal(routes.isUpstreamExternalHref(null), false);

  assert.deepEqual(routes.specialistAgentIds(agentRows), ["researcher", "operator"]);
  assert.deepEqual(routes.specialistAgentIds([{ id: "zero", name: "Zero" }]), []);
  assert.deepEqual(routes.specialistAgentIds(null), []);
});

/* -------------------------------------------------------------------------
 * Specialist configuration actions (pure)
 * ---------------------------------------------------------------------- */

test("specialist config pages cannot expose or invoke Set Default", async () => {
  const surfaces = await import(
    pathToFileURL(path.join(root, "src/native-surfaces.js")).href
  );
  const routes = await import(
    pathToFileURL(path.join(srcRoot, "shared/routes.js")).href
  );

  const makeControl = (text, label = "") => {
    const button = new FakeElement("button");
    button.textContent = text;
    if (label) button.setAttribute("aria-label", label);
    const parent = new FakeElement("div");
    parent.append(button);
    return button;
  };

  const clickEvent = (control) => ({
    target: {
      closest: (selector) => (selector.includes("button") ? control : null),
    },
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopImmediatePropagation() {
      this.propagationStopped = true;
    },
  });

  const invoke = (control, specialist) => {
    const native = [];
    control.addEventListener("click", () => native.push("native"));
    const event = clickEvent(control);
    const blocked = surfaces.blockSpecialistDefaultAction(event, specialist);
    if (!blocked) control.dispatch("click", event);
    return { blocked, event, native };
  };

  // Both specialist configuration routes block the native default action by
  // text or aria-label, before the native handler can run.
  for (const specialist of ["operator", "researcher"]) {
    assert.equal(routes.isSpecialistConfigRoute(`/settings/agents/${specialist}`), true);

    const textResult = invoke(makeControl("Set Default"), specialist);
    assert.equal(textResult.blocked, true);
    assert.equal(textResult.event.defaultPrevented, true);
    assert.equal(textResult.event.propagationStopped, true);
    assert.equal(textResult.native.length, 0);

    const labelResult = invoke(makeControl("", "Set Default"), specialist);
    assert.equal(labelResult.blocked, true);
    assert.equal(labelResult.event.defaultPrevented, true);
    assert.equal(labelResult.native.length, 0);

    // Other administrator configuration actions still reach the native handler.
    const saveResult = invoke(makeControl("Save"), specialist);
    assert.equal(saveResult.blocked, false);
    assert.equal(saveResult.native.length, 1);
    assert.equal(saveResult.event.defaultPrevented, false);

    // "Default" is a state label, not the Set Default action.
    assert.equal(
      surfaces.blockSpecialistDefaultAction(clickEvent(makeControl("Default")), specialist),
      false,
    );
  }

  // Zero's own settings keep the native Set Default action.
  const zeroResult = invoke(makeControl("Set Default"), null);
  assert.equal(zeroResult.blocked, false);
  assert.equal(zeroResult.native.length, 1);

  const setDefault = makeControl("Set Default");
  const labelledDefault = makeControl("", "Set Default");
  const newAgent = makeControl("New agent");
  const copyId = makeControl("Copy ID");
  const refresh = makeControl("Refresh");
  const zeroDefault = makeControl("Default");
  const controls = [setDefault, labelledDefault, newAgent, copyId, refresh, zeroDefault];
  const main = {
    querySelectorAll: (selector) =>
      selector.includes("button") ? controls.filter((control) => control.parentNode) : [],
  };

  assert.equal(surfaces.isSetDefaultControl(setDefault), true);
  assert.equal(surfaces.isSetDefaultControl(labelledDefault), true);
  assert.equal(surfaces.isSetDefaultControl(newAgent), false);
  assert.equal(surfaces.isSetDefaultControl(zeroDefault), false);

  // Zero's own settings keep the native default action.
  assert.equal(surfaces.removeSpecialistDefaultAction(main, false), 0);
  assert.ok(setDefault.parentNode);

  // A direct specialist configuration page removes the action but preserves
  // every other administrator configuration control.
  assert.equal(surfaces.removeSpecialistDefaultAction(main, true), 2);
  assert.equal(setDefault.parentNode, null);
  assert.equal(labelledDefault.parentNode, null);
  assert.equal(setDefault.disabled, true);
  assert.equal(setDefault.getAttribute("aria-disabled"), "true");
  assert.ok(newAgent.parentNode);
  assert.ok(copyId.parentNode);
  assert.ok(refresh.parentNode);
  assert.ok(zeroDefault.parentNode);
  assert.deepEqual(
    main.querySelectorAll("button, [role='button']").filter(surfaces.isSetDefaultControl),
    [],
  );
});

/* -------------------------------------------------------------------------
 * Single-chat surface inventory
 * ---------------------------------------------------------------------- */

test("specialist roster cards and admin pages expose no second chat entry", async () => {
  const surfaces = await import(
    pathToFileURL(path.join(srcRoot, "native-surfaces.js")).href
  );

  const makeCard = (id, text, href) => {
    const card = new FakeElement("a");
    card.className = "agents-home__card";
    card.setAttribute("data-agent-id", id);
    if (href) card.setAttribute("href", href);
    card.textContent = text;
    return card;
  };

  const zeroCard = makeCard("zero", "Open chat", "/chat/zero");
  const operatorCard = makeCard("operator", "Open chat", "/chat/operator");
  const researcherCard = makeCard("researcher", "Open chat", "/chat/researcher");
  const roster = new FakeElement("div");
  roster.querySelectorAll = (selector) =>
    selector.includes("agents-home__card")
      ? [zeroCard, operatorCard, researcherCard].filter((card) => card.parentNode)
      : [];
  roster.append(zeroCard, operatorCard, researcherCard);

  assert.equal(surfaces.removeSpecialistCards(roster, "zero"), 2);
  assert.equal(zeroCard.parentNode, roster, "Zero keeps the canonical Open chat card");
  assert.equal(operatorCard.parentNode, null);
  assert.equal(researcherCard.parentNode, null);

  const makeControl = (tag, text, href, label = "") => {
    const control = new FakeElement(tag);
    control.textContent = text;
    if (href) control.setAttribute("href", href);
    if (label) control.setAttribute("aria-label", label);
    return control;
  };

  const openChat = makeControl("button", "Open chat");
  const startChat = makeControl("button", "Start chat");
  const chatLink = makeControl("a", "Home", "/chat/zero");
  const newChat = makeControl("a", "", "/new?agent=operator", "New conversation");
  const save = makeControl("button", "Save");
  const copyId = makeControl("button", "Copy ID");
  const defaults = makeControl(
    "button",
    "Agent defaults Defaults every agent inherits unless overridden.",
  );
  const controls = [openChat, startChat, chatLink, newChat, save, copyId, defaults];
  const main = new FakeElement("div");
  main.querySelectorAll = (selector) =>
    selector.includes("[role='button']")
      ? controls.filter((control) => control.parentNode)
      : [];
  main.append(...controls);

  assert.equal(surfaces.isSpecialistChatEntryControl(openChat), true);
  assert.equal(surfaces.isSpecialistChatEntryControl(startChat), true);
  assert.equal(surfaces.isSpecialistChatEntryControl(chatLink), true);
  assert.equal(surfaces.isSpecialistChatEntryControl(newChat), true);
  assert.equal(surfaces.isSpecialistChatEntryControl(save), false);
  assert.equal(surfaces.isSpecialistChatEntryControl(copyId), false);
  assert.equal(surfaces.isSpecialistChatEntryControl(defaults), false);

  assert.equal(surfaces.removeSpecialistChatEntries(main), 4);
  for (const control of [openChat, startChat, chatLink, newChat]) {
    assert.equal(control.parentNode, null);
  }
  for (const control of [save, copyId, defaults]) {
    assert.equal(control.parentNode, main, "configuration controls must remain");
  }
});

test("owned source converges on one canonical chat route", async () => {
  const collect = async (dir) => {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...(await collect(target)));
      else if (entry.name.endsWith(".js")) out.push(target);
    }
    return out;
  };
  const files = [
    path.join(root, "browser.js"),
    path.join(root, "index.js"),
    ...(await collect(srcRoot)),
  ];
  const source = (
    await Promise.all(files.map((file) => readFile(file, "utf8")))
  ).join("\n");

  assert.match(source, /const ZERO_CHAT_PATH = "\/chat\/zero"/);
  assert.doesNotMatch(source, /\/chat\/(?:operator|researcher)/iu);
  assert.doesNotMatch(source, /["'`]Open chat["'`]/iu);
  assert.doesNotMatch(source, /\/new\?agent=/iu);

  // Consolidation is DOM/policy only: it must not mutate worker definitions,
  // sessions, config, or credentials.
  const surfaces = await readFile(path.join(srcRoot, "native-surfaces.js"), "utf8");
  assert.doesNotMatch(surfaces, /config\.patch|secrets\.store|sessions\.(?:delete|archive)|agents\.(?:delete|remove)/iu);
  const routes = await import(
    pathToFileURL(path.join(srcRoot, "shared/routes.js")).href
  );
  assert.equal(routes.isSpecialistConfigRoute("/settings/agents/operator"), true);
  assert.equal(routes.isSpecialistConfigRoute("/settings/agents/researcher"), true);
});

/* -------------------------------------------------------------------------
 * Interceptor (stubbed browser)
 * ---------------------------------------------------------------------- */

function installBrowserStub() {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const navigations = [];
  const location = {
    pathname: "/",
    search: "",
    hash: "",
    replace(href) {
      navigations.push(["replace", href]);
      applyHref(href);
    },
    assign(href) {
      navigations.push(["assign", href]);
      applyHref(href);
    },
  };

  const applyHref = (href) => {
    const parsed = new URL(href, "http://zero.local");
    location.pathname = parsed.pathname;
    location.search = parsed.search;
    location.hash = parsed.hash;
  };

  globalThis.PopStateEvent = class PopStateEvent {
    constructor(type) {
      this.type = type;
    }
  };
  globalThis.document = {
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    },
    removeEventListener(type) {
      documentListeners.delete(type);
    },
  };
  globalThis.window = {
    location,
    history: {
      replaceState(_state, _title, href) {
        navigations.push(["replace", href]);
        applyHref(href);
      },
      pushState(_state, _title, href) {
        navigations.push(["push", href]);
        applyHref(href);
      },
    },
    addEventListener(type, listener) {
      windowListeners.set(type, listener);
    },
    removeEventListener(type) {
      windowListeners.delete(type);
    },
    dispatchEvent(event) {
      windowListeners.get(event.type)?.(event);
    },
  };

  return {
    location,
    navigations,
    documentListeners,
    windowListeners,
    visit(pathname) {
      applyHref(pathname);
    },
    click(href, inChrome = true) {
      const anchor = {
        getAttribute: () => href,
        closest: (selector) => {
          if (selector === "a") return anchor;
          return inChrome ? anchor : null;
        },
      };
      const event = {
        target: anchor,
        defaultPrevented: false,
        propagationStopped: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
        stopPropagation() {
          this.propagationStopped = true;
        },
      };
      documentListeners.get("click")?.(event);
      return event;
    },
  };
}

function clearBrowserStub() {
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.PopStateEvent;
}

test("interceptor keeps native routes and re-targets duplicate destinations", async () => {
  const { installLegacyRouteInterceptor, ZERO_CHAT_PATH } = await import(
    pathToFileURL(path.join(srcRoot, "legacy-routes.js")).href
  );
  const browser = installBrowserStub();
  const host = { basePath: "", agents: { rows: agentRows } };

  try {
    // Model providers route remains on the native provider destination.
    browser.visit("/settings/model-providers");
    const dispose = installLegacyRouteInterceptor(host);
    assert.equal(browser.location.pathname, "/settings/model-providers");

    browser.visit("/settings/about");
    browser.windowListeners.get("popstate")();
    assert.equal(browser.location.pathname, "/settings/about");

    // Hidden host routes go to the single Zero conversation.
    browser.visit("/debug");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    browser.visit("/settings/updates");
    browser.windowListeners.get("hashchange")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    // Bare /chat is only an alias and never a second conversation surface.
    browser.visit("/chat");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    // Specialist chat and new-conversation routes never open a second chat.
    browser.visit("/chat/operator/main");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    browser.visit("/chat/researcher/main");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    browser.visit("/chat/agent%3Aoperator%3Amain");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    browser.visit("/new?agent=operator");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    browser.visit("/new?agent=agent%3Aresearcher");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    // Legacy plugin pages land on the native destination, not a plugin page.
    browser.visit("/plugin?plugin=zero-control-ui&id=models");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", "/settings/model-providers"]);

    browser.visit("/plugin?plugin=zero-control-ui&id=about");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", "/settings/about"]);

    browser.visit("/plugin?plugin=zero-control-ui&id=team");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    browser.visit("/model-providers");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", "/settings/model-providers"]);

    // The lead chat is the one product surface and must never be re-targeted.
    const before = browser.navigations.length;
    browser.visit("/chat/zero/main");
    browser.windowListeners.get("popstate")();
    assert.equal(browser.navigations.length, before);
    assert.equal(browser.location.pathname, "/chat/zero/main");

    // Native Zero new-chat remains native; removed specialist settings redirect to the roster.
    browser.visit("/new?agent=zero");
    browser.windowListeners.get("popstate")();
    assert.equal(browser.navigations.length, before);
    assert.equal(browser.location.pathname, "/new");
    assert.equal(browser.location.search, "?agent=zero");

    browser.visit("/settings/agents/operator");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", "/agents"]);

    browser.visit("/settings/agents/researcher/files");
    browser.windowListeners.get("popstate")();
    assert.deepEqual(browser.navigations.at(-1), ["replace", "/agents"]);

    const logsClick = browser.click("/logs");
    assert.equal(logsClick.defaultPrevented, true);
    assert.equal(logsClick.propagationStopped, true);
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    const specialistClick = browser.click("/chat/operator/main");
    assert.equal(specialistClick.defaultPrevented, true);
    assert.deepEqual(browser.navigations.at(-1), ["replace", ZERO_CHAT_PATH]);

    const nativeClick = browser.click("/settings/model-providers");
    assert.equal(nativeClick.defaultPrevented, false);

    for (const href of [
      "https://openclaw.ai",
      "https://docs.openclaw.ai/web/control-ui",
      "https://github.com/openclaw/openclaw",
      "https://discord.gg/clawd",
      "https://x.com/openclaw",
      "https://www.reddit.com/r/openclaw/",
    ]) {
      const count = browser.navigations.length;
      const click = browser.click(href);
      assert.equal(click.defaultPrevented, true, `${href} must be blocked in product chrome`);
      assert.equal(click.propagationStopped, true);
      assert.equal(browser.navigations.length, count, `${href} must not navigate`);
    }

    // A model citation inside chat content is not a Zero-owned redirect.
    const contentClick = browser.click("https://openclaw.ai/docs", false);
    assert.equal(contentClick.defaultPrevented, false);
    assert.equal(contentClick.propagationStopped, false);

    const ordinary = browser.click("/chat/zero/main");
    assert.equal(ordinary.defaultPrevented, false);

    dispose();
    assert.equal(browser.documentListeners.size, 0);
    assert.equal(browser.windowListeners.size, 0);
  } finally {
    clearBrowserStub();
  }
});

/* -------------------------------------------------------------------------
 * In-place native About content
 * ---------------------------------------------------------------------- */

test("native About content states the Zero identity with no external links", async () => {
  installFakeDocument();
  const { mountAboutPage } = await import(
    pathToFileURL(path.join(srcRoot, "pages/about.js")).href
  );
  const container = new FakeElement("div");
  const handle = mountAboutPage(container);

  const text = container.textContent;
  assert.match(text, /About Zero/);
  assert.match(text, /Private assistant for local Gateway-backed work/);
  assert.match(text, /Native Control UI/);
  assert.match(text, /Canonical Gateway sessions/);
  assert.match(text, /Zero only/);
  assert.match(text, /Local integrations/);
  assert.match(text, /no analytics, telemetry, remote feeds, or upstream update checks/);
  assert.match(text, /app\/NOTICE/);
  assert.match(text, /THIRD_PARTY_NOTICES\.md/);

  assert.doesNotMatch(text, /https?:\/\//i);
  assert.doesNotMatch(text, /discord|reddit|github\.com|x\.com|changelog/i);
  assert.doesNotMatch(text, /2026\.10\.6|fe06181/);

  const anchors = findElements(container, (node) => node.tagName === "a");
  assert.equal(anchors.length, 0, "the About content must not render external anchors");

  assert.equal(typeof handle.update, "function");
  assert.equal(typeof handle.dispose, "function");
  handle.dispose();
  assert.equal(container.textContent, "");
});

test("native About local integrations report CLI/MCP status without secrets or links", async () => {
  installFakeDocument();
  const { mountAboutPage } = await import(
    pathToFileURL(path.join(srcRoot, "pages/about.js")).href
  );
  const container = new FakeElement("div");
  const calls = [];
  const host = {
    request: async (method, params) => {
      calls.push([method, params]);
      if (method === "zero.integrations.cli.status") {
        return {
          adapters: [
            {
              id: "claude",
              label: "Claude Code",
              available: true,
              version: "1.2.3",
              nativeDispatch: true,
            },
            { id: "codex", label: "Codex CLI", available: false, error: "not-found" },
          ],
        };
      }
      if (method === "zero.integrations.connectors.status") {
        return {
          connectors: [
            { id: "gmail", label: "Gmail", configured: true },
            { id: "slack", label: "Slack", configured: false },
          ],
          settingsPath: "/settings/mcp",
        };
      }
      if (method === "zero.observation.status") {
        return {
          state: "idle",
          enabled: false,
          privateMode: false,
          sourceAvailable: true,
          ring: { frames: 0, bytes: 0 },
          queue: { pending: 0 },
          counters: { processed: 0 },
        };
      }
      if (method === "tools.effective") {
        assert.deepEqual(params, { sessionKey: "agent:zero:main" });
        return {
          groups: [
            {
              id: "mcp",
              source: "mcp",
              tools: [
                { source: "mcp", mcpServer: "gmail", mcpToolName: "search_threads" },
                { source: "mcp", mcpServer: "gmail", mcpToolName: "send_email" },
              ],
            },
          ],
          notices: [],
        };
      }
      throw new Error("unexpected method");
    },
    sessions: { selectedKey: "agent:zero:main" },
  };
  const handle = mountAboutPage(container, { host });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const text = container.textContent;
  assert.match(text, /Claude Code: available \(1\.2\.3\)/);
  assert.match(text, /Codex CLI: not found on PATH/);
  assert.match(text, /Gmail: configured; 2 cached MCP capabilities: search_threads, send_email/);
  assert.match(text, /Slack: setup required/);
  assert.match(text, /do not prove live reachability/);
  assert.match(text, /Claude Code: available \(1\.2\.3\); native CLI backend ready/);
  assert.deepEqual(
    calls.map(([method]) => method).sort(),
    [
      "zero.integrations.cli.status",
      "zero.integrations.connectors.status",
      "zero.observation.status",
      "tools.effective",
    ].sort(),
  );
  assert.match(text, /Screen observation/);
  assert.match(text, /Observation is off/);
  const buttons = findElements(container, (node) => node.tagName === "button");
  assert.ok(buttons.some((node) => node.textContent === "Enable observation"));
  assert.ok(buttons.some((node) => node.textContent === "Private Mode"));
  assert.doesNotMatch(text, /Bearer|secret=value|C:\\private|https?:\/\//i);
  const links = findElements(container, (node) => node.tagName === "a");
  assert.equal(links.length, 1);
  assert.equal(links[0].getAttribute("href"), "/settings/mcp");
  handle.dispose();
});

test("native About Private Mode toggles through the existing observation control and shows cleared state", async () => {
  installFakeDocument();
  const { mountAboutPage } = await import(
    pathToFileURL(path.join(srcRoot, "pages/about.js")).href
  );
  const container = new FakeElement("div");
  const calls = [];
  const host = {
    request: async (method, params) => {
      calls.push([method, params]);
      if (method === "zero.integrations.cli.status") return { adapters: [] };
      if (method === "zero.integrations.connectors.status") return { connectors: [] };
      if (method === "zero.observation.status") {
        return {
          state: "idle",
          enabled: false,
          privateMode: false,
          sourceAvailable: true,
          ring: { frames: 0, bytes: 0 },
          queue: { pending: 0 },
          counters: {},
        };
      }
      if (method === "zero.observation.control") {
        assert.deepEqual(params, { action: "private-on" });
        return {
          state: "private",
          enabled: false,
          privateMode: true,
          sourceAvailable: true,
          ring: { frames: 0, bytes: 0 },
          queue: { pending: 0 },
          counters: { privateClears: 1 },
        };
      }
      throw new Error("unexpected method");
    },
  };
  const handle = mountAboutPage(container, { host });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const privateButton = findElements(
    container,
    (node) => node.tagName === "button" && node.textContent === "Private Mode",
  )[0];
  assert.ok(privateButton, "Private Mode control must exist");
  privateButton.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(container.textContent, /Private Mode is on/);
  assert.ok(
    findElements(container, (node) => node.tagName === "button" && node.textContent === "Exit Private Mode").length === 1,
  );
  assert.ok(calls.some(([method]) => method === "zero.observation.control"));
  handle.dispose();
});

test("native About shows an explicit start failure without claiming capture and keeps controls", async () => {
  installFakeDocument();
  const { mountAboutPage } = await import(
    pathToFileURL(path.join(srcRoot, "pages/about.js")).href
  );
  const container = new FakeElement("div");
  const calls = [];
  const failure = {
    ok: false,
    state: "unavailable",
    enabled: false,
    privateMode: false,
    sourceAvailable: false,
    preferenceEnabled: true,
    captureRunning: false,
    startFailed: true,
    startFailure: {
      origin: "explicit",
      reason: "unavailable",
      state: "unavailable",
      message: "Capture source is unavailable; no capture was started.",
    },
    safeError: "capture-start-unavailable",
    lastError: "CUA_DRIVER_UNAVAILABLE: Bearer should-not-leak",
    ring: { frames: 0, bytes: 0 },
    queue: { pending: 0 },
    counters: {},
  };
  const host = {
    request: async (method, params) => {
      calls.push([method, params]);
      if (method === "zero.integrations.cli.status") return { adapters: [] };
      if (method === "zero.integrations.connectors.status") return { connectors: [] };
      if (method === "zero.observation.status") {
        return {
          state: "idle",
          enabled: false,
          privateMode: false,
          sourceAvailable: true,
          ring: { frames: 0, bytes: 0 },
          queue: { pending: 0 },
          counters: {},
        };
      }
      if (method === "zero.observation.control") {
        assert.deepEqual(params, { action: "start" });
        return failure;
      }
      throw new Error("unexpected method");
    },
  };
  const handle = mountAboutPage(container, { host });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const enable = findElements(
    container,
    (node) => node.tagName === "button" && node.textContent === "Enable observation",
  )[0];
  assert.ok(enable, "Enable control must exist");
  enable.click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const text = container.textContent;
  assert.match(text, /Private Mode is off/);
  assert.match(text, /Capture source unavailable/);
  assert.match(text, /No capture was started/);
  assert.match(text, /owner preference remains enabled/);
  assert.doesNotMatch(text, /should-not-leak|Bearer/);
  const buttons = findElements(container, (node) => node.tagName === "button");
  assert.ok(buttons.some((node) => node.textContent === "Disable observation"));
  assert.ok(buttons.some((node) => node.textContent === "Private Mode"));
  assert.equal(buttons.some((node) => node.textContent === "Stop observation"), false);
  handle.dispose();
});

test("native About reports Private Mode exit failure without unsafe capture", async () => {
  installFakeDocument();
  const { mountAboutPage } = await import(
    pathToFileURL(path.join(srcRoot, "pages/about.js")).href
  );
  const container = new FakeElement("div");
  const calls = [];
  const host = {
    request: async (method, params) => {
      calls.push([method, params]);
      if (method === "zero.integrations.cli.status") return { adapters: [] };
      if (method === "zero.integrations.connectors.status") return { connectors: [] };
      if (method === "zero.observation.status") {
        return {
          state: "private",
          enabled: false,
          privateMode: true,
          sourceAvailable: false,
          preferenceEnabled: true,
          captureRunning: false,
          ring: { frames: 0, bytes: 0 },
          queue: { pending: 0 },
          counters: {},
        };
      }
      if (method === "zero.observation.control") {
        assert.deepEqual(params, { action: "private-off" });
        return {
          ok: false,
          state: "unavailable",
          enabled: false,
          privateMode: false,
          sourceAvailable: false,
          preferenceEnabled: true,
          captureRunning: false,
          startFailed: true,
          startFailure: {
            origin: "private-off",
            reason: "unavailable",
            state: "unavailable",
            message: "Capture source is unavailable; no capture was started.",
          },
          safeError: "capture-start-unavailable",
          lastError: "CUA_DRIVER_UNAVAILABLE: token=should-not-leak",
          ring: { frames: 0, bytes: 0 },
          queue: { pending: 0 },
          counters: {},
        };
      }
      throw new Error("unexpected method");
    },
  };
  const handle = mountAboutPage(container, { host });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(container.textContent, /Private Mode is on/);
  assert.match(container.textContent, /capture source is also unavailable/i);
  const exit = findElements(
    container,
    (node) => node.tagName === "button" && node.textContent === "Exit Private Mode",
  )[0];
  assert.ok(exit, "Exit Private Mode control must exist when the source is unavailable");
  exit.click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const text = container.textContent;
  assert.match(text, /Private Mode is off/);
  assert.match(text, /Capture source unavailable/);
  assert.match(text, /owner preference remains enabled/);
  assert.doesNotMatch(text, /should-not-leak|token=/);
  const buttons = findElements(container, (node) => node.tagName === "button");
  assert.ok(buttons.some((node) => node.textContent === "Private Mode"));
  assert.equal(buttons.some((node) => node.textContent === "Exit Private Mode"), false);
  assert.ok(buttons.some((node) => node.textContent === "Disable observation"));
  handle.dispose();
});

test("native About prevents duplicate observation start clicks while the request is pending", async () => {
  installFakeDocument();
  const { mountAboutPage } = await import(
    pathToFileURL(path.join(srcRoot, "pages/about.js")).href
  );
  const container = new FakeElement("div");
  let controlCalls = 0;
  let resolveControl;
  const controlPromise = new Promise((resolve) => {
    resolveControl = resolve;
  });
  const host = {
    request: async (method) => {
      if (method === "zero.integrations.cli.status") return { adapters: [] };
      if (method === "zero.integrations.connectors.status") return { connectors: [] };
      if (method === "zero.observation.status") {
        return {
          state: "idle",
          enabled: false,
          privateMode: false,
          sourceAvailable: true,
          ring: { frames: 0, bytes: 0 },
          queue: { pending: 0 },
          counters: {},
        };
      }
      if (method === "zero.observation.control") {
        controlCalls += 1;
        return controlPromise;
      }
      throw new Error("unexpected method");
    },
  };
  const handle = mountAboutPage(container, { host });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const enable = findElements(
    container,
    (node) => node.tagName === "button" && node.textContent === "Enable observation",
  )[0];
  assert.ok(enable);
  enable.click();
  enable.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(controlCalls, 1, "a duplicate start click is ignored while pending");
  assert.match(container.textContent, /request is pending/);
  const pendingButtons = findElements(container, (node) => node.tagName === "button");
  assert.ok(pendingButtons.length > 0);
  assert.equal(pendingButtons.every((button) => button.disabled === true), true);

  resolveControl({
    state: "capturing",
    enabled: true,
    privateMode: false,
    sourceAvailable: true,
    preferenceEnabled: true,
    captureRunning: true,
    ring: { frames: 1, bytes: 4 },
    queue: { pending: 0 },
    counters: { processed: 1 },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(controlCalls, 1);
  assert.match(container.textContent, /Capturing locally/);
  const stop = findElements(
    container,
    (node) => node.tagName === "button" && node.textContent === "Stop observation",
  )[0];
  assert.ok(stop);
  assert.equal(stop.disabled, false);
  handle.dispose();
});

test("native About reconciles a late control completion after its UI timeout", async () => {
  installFakeDocument();
  const { mountAboutPage } = await import(
    pathToFileURL(path.join(srcRoot, "pages/about.js")).href
  );
  const container = new FakeElement("div");
  let statusCalls = 0;
  let controlCalls = 0;
  let resolveControl;
  const controlPromise = new Promise((resolve) => {
    resolveControl = resolve;
  });
  const host = {
    request: async (method) => {
      if (method === "zero.integrations.cli.status") return { adapters: [] };
      if (method === "zero.integrations.connectors.status") return { connectors: [] };
      if (method === "zero.observation.status") {
        statusCalls += 1;
        return {
          state: "idle",
          enabled: false,
          privateMode: false,
          sourceAvailable: true,
          ring: { frames: 0, bytes: 0 },
          queue: { pending: 0 },
          counters: {},
        };
      }
      if (method === "zero.observation.control") {
        controlCalls += 1;
        return controlPromise;
      }
      throw new Error("unexpected method");
    },
  };
  const handle = mountAboutPage(container, { host, observationControlTimeoutMs: 10 });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const enable = findElements(
    container,
    (node) => node.tagName === "button" && node.textContent === "Enable observation",
  )[0];
  assert.ok(enable);
  enable.click();
  await new Promise((resolve) => setTimeout(resolve, 35));

  const pendingText = container.textContent;
  assert.match(pendingText, /still unresolved or its result is unknown/);
  assert.match(pendingText, /not canceled or repeated/);
  assert.doesNotMatch(
    pendingText,
    /Observation is off|No screen frames are being captured|not active on this Gateway yet/,
  );
  assert.ok(statusCalls >= 2, "status is refreshed after the UI timeout");
  assert.equal(controlCalls, 1, "the timed-out control action is not repeated");
  const pendingButtons = findElements(container, (node) => node.tagName === "button");
  assert.ok(pendingButtons.length > 0);
  assert.equal(pendingButtons.every((button) => button.disabled === true), true);

  resolveControl({
    state: "capturing",
    enabled: true,
    privateMode: false,
    sourceAvailable: true,
    preferenceEnabled: true,
    captureRunning: true,
    ring: { frames: 2, bytes: 8 },
    queue: { pending: 0 },
    counters: { processed: 2 },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(container.textContent, /Capturing locally/);
  assert.equal(controlCalls, 1);
  assert.ok(
    findElements(
      container,
      (node) => node.tagName === "button" && node.textContent === "Stop observation",
    ).length === 1,
  );
  handle.dispose();
});

test("observation error sanitizer keeps safe categories and removes credential shapes", async () => {
  const { sanitizeObservationError } = await import(
    pathToFileURL(path.join(srcRoot, "shared/observation-errors.js")).href
  );
  const raw =
    "CUA_CAPTURE_ERROR: capture failed Bearer abcdefghijklmnop token=xyz12345 password: hunter2 " +
    "secret=shh sk-live-1234567890 ghp_1234567890abcdef AKIAABCDEFGHIJKL1234 " +
    "https://user:pass@example.test/path";
  const clean = sanitizeObservationError(raw);
  assert.match(clean, /CUA_CAPTURE_ERROR/);
  assert.match(clean, /capture failed/);
  assert.doesNotMatch(clean, /abcdefghijklmnop|xyz12345|hunter2|shh|sk-live|ghp_|AKIA|user:pass/);
  assert.match(clean, /Bearer \[redacted\]/);
  assert.match(clean, /token: \[redacted\]/);
  assert.match(clean, /password: \[redacted\]/);
  assert.match(clean, /https:\/\/\[redacted\]@example\.test/);

  installFakeDocument();
  const { mountAboutPage } = await import(
    pathToFileURL(path.join(srcRoot, "pages/about.js")).href
  );
  const container = new FakeElement("div");
  const host = {
    request: async (method) => {
      if (method === "zero.integrations.cli.status") return { adapters: [] };
      if (method === "zero.integrations.connectors.status") return { connectors: [] };
      if (method === "zero.observation.status") {
        return {
          state: "error",
          enabled: true,
          privateMode: false,
          sourceAvailable: true,
          running: false,
          ring: { frames: 0, bytes: 0 },
          queue: { pending: 0 },
          counters: { errors: 3 },
          lastError: raw,
        };
      }
      throw new Error("unexpected method");
    },
  };
  const handle = mountAboutPage(container, { host });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const text = container.textContent;
  assert.match(text, /CUA_CAPTURE_ERROR/);
  assert.match(text, /Capture stopped after an error/);
  assert.doesNotMatch(text, /abcdefghijklmnop|xyz12345|hunter2|shh|sk-live|ghp_|AKIA|user:pass/);
  handle.dispose();
});

test("native About integration status fails closed on timeout and malformed responses", async () => {
  installFakeDocument();
  const { mountAboutPage } = await import(
    pathToFileURL(path.join(srcRoot, "pages/about.js")).href
  );

  const timeoutContainer = new FakeElement("div");
  const timeoutHandle = mountAboutPage(timeoutContainer, {
    host: { request: () => new Promise(() => {}) },
    statusTimeoutMs: 5,
  });
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.match(timeoutContainer.textContent, /not active on this Gateway yet/);
  timeoutHandle.dispose();

  const malformedContainer = new FakeElement("div");
  const malformedHandle = mountAboutPage(malformedContainer, {
    host: { request: async () => ({}) },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(malformedContainer.textContent, /CLI adapter status is unavailable/);
  assert.match(malformedContainer.textContent, /Connected-app status is unavailable/);
  malformedHandle.dispose();
});

/* -------------------------------------------------------------------------
 * Plugin activation: native surfaces only, no replacement pages
 * ---------------------------------------------------------------------- */

test("plugin activation registers no duplicate pages or navigation", async () => {
  installFakeDocument();
  const plugin = await loadPlugin();
  assert.equal(plugin.id, "zero-control-ui");
  assert.equal(typeof plugin.activate, "function");

  const pages = [];
  const navigation = [];
  const dispose = plugin.activate({
    basePath: "",
    agents: { rows: agentRows, defaultId: "zero" },
    ui: {
      registerPage: (value) => {
        pages.push(value);
        return () => {};
      },
      registerNavigation: (value) => {
        navigation.push(value);
        return () => {};
      },
    },
  });

  assert.deepEqual(pages, [], "no plugin page may duplicate a native screen");
  assert.deepEqual(navigation, [], "no plugin navigation may duplicate native navigation");
  assert.equal(typeof dispose, "function");
  dispose();
});

/* -------------------------------------------------------------------------
 * Product-surface audit (built bundle + source + CSS)
 * ---------------------------------------------------------------------- */

test("built bundle integrates native surfaces and has no duplicate product backend", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "dist/openclaw.plugin.json"), "utf8"),
  );
  const bundle = await readFile(path.join(root, manifest.controlUi.entry), "utf8");
  const styles = await readFile(path.join(root, manifest.controlUi.styles[0]), "utf8");

  assert.doesNotMatch(bundle, /copilotkit|@ag-ui|intelligence\/threads|Failed to fetch threads/i);
  assert.doesNotMatch(bundle, /\/api\/copilotkit\/threads/);
  assert.doesNotMatch(bundle, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new WebSocket|EventSource/);
  assert.doesNotMatch(bundle, /localStorage|sessionStorage/);
  assert.doesNotMatch(bundle, /window\.open\(|target:\s*"_blank"|target="_blank"/);
  assert.doesNotMatch(bundle, /gateway-link|pairing-store|pairing-keys|zero-types/);

  // No replacement page registration survives in the product bundle.
  assert.doesNotMatch(bundle, /registerPage|registerNavigation/);
  assert.doesNotMatch(bundle, /plugin\?plugin=zero-control-ui&id=/);
  assert.doesNotMatch(bundle, /Zero Team page/);

  // The in-place integration and single-chat policy survive minification.
  assert.match(bundle, /openclaw-model-providers-page/);
  assert.match(bundle, /openclaw-about-page/);
  assert.match(bundle, /Administrator configuration only/);
  assert.match(bundle, /zero-admin-config/);
  assert.match(bundle, /Set Default/);
  assert.match(bundle, /agents-toolbar/);
  assert.doesNotMatch(bundle, /Internal specialist/);
  assert.match(bundle, /agents-home__card/);
  assert.match(bundle, /openclaw-agent-select/);
  assert.match(bundle, /zero-about__heading/);
  assert.match(bundle, /Private assistant for local Gateway-backed work/);
  assert.match(bundle, /sidebar-agent-card__main/);
  assert.match(bundle, /community-invite-card/);

  for (const selector of [
    '.settings-sidebar .settings-sidebar__item[href="/debug"]',
    '.settings-sidebar .settings-sidebar__item[href="/logs"]',
    '.settings-sidebar .settings-sidebar__item[href="/settings/debug"]',
    '.settings-sidebar .settings-sidebar__item[href="/settings/logs"]',
    '.settings-sidebar .settings-sidebar__item[href="/settings/updates"]',
    ".sidebar-footer-build",
    ".sidebar-agent-card__chevron",
    ".agent-select__chevron",
    ".sidebar-shell__invite",
    ".community-invite-card",
    ".topbar-brand__logo",
    ".zero-admin-config",
    '[href^="https://openclaw.ai"]',
    '[href^="https://discord.gg/clawd"]',
    '[href^="https://x.com/openclaw"]',
  ]) {
    assert.ok(styles.includes(selector), `expected CSS support for ${selector}`);
  }

  // Native About and model-providers entries stay visible.
  assert.doesNotMatch(styles, /model-providers[^}]*display:\s*none/i);
  assert.doesNotMatch(styles, /href="\/settings\/about"\]\s*\{[^}]*display:\s*none/s);

  assert.match(styles, /\.zero-about__heading/);
  assert.match(styles, /\.zero-about__facts/);
  assert.match(styles, /\.zero-native-surface/);
  assert.match(styles, /\.zero-models-view/);
});

test("no duplicate Zero page module remains in the product source", async () => {
  const entries = await readdir(srcRoot, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));

  assert.ok(files.length > 0);
  assert.equal(
    files.some((file) => file.endsWith(path.join("pages", "team.js"))),
    false,
    "the duplicate Team page module must be removed",
  );

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(root, file);
    assert.doesNotMatch(
      source,
      /\bfetch\s*\(|new WebSocket|XMLHttpRequest|sendBeacon|EventSource/,
      `${relative} must use host.request, not a direct network call`,
    );
    assert.doesNotMatch(
      source,
      /\/plugin\?plugin=zero-control-ui&id=/,
      `${relative} must link to native routes, not legacy plugin pages`,
    );
  }
});

test("owned manifests describe Zero, not the upstream product", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "openclaw.plugin.json"), "utf8"),
  );
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));

  assert.equal(manifest.name, "Zero");
  assert.match(manifest.description, /^Zero:/);
  assert.match(manifest.description, /private assistant/i);
  assert.deepEqual(manifest.uiCapabilities, []);
  assert.match(pkg.description, /Zero/);
  assert.match(pkg.description, /Gateway/);
});

/* -------------------------------------------------------------------------
 * Small pure helpers added by the module split
 * ---------------------------------------------------------------------- */

test("roster, gateway and computer helpers keep explicit state", async () => {
  const roster = await import(
    pathToFileURL(path.join(srcRoot, "state/roster.js")).href
  );
  const gateway = await import(
    pathToFileURL(path.join(srcRoot, "gateway/client.js")).href
  );
  const computer = await import(
    pathToFileURL(path.join(srcRoot, "computer/presentation.js")).href
  );

  assert.deepEqual(roster.EMPTY_ROSTER, { loading: true, error: null, sessions: [] });
  assert.deepEqual(
    roster.applySessionSnapshot(roster.EMPTY_ROSTER, {
      loading: false,
      error: null,
      result: { sessions: [{ key: "a" }] },
    }),
    { loading: false, error: null, sessions: [{ key: "a" }] },
  );
  assert.deepEqual(
    roster.applySessionSnapshot(roster.EMPTY_ROSTER, { loading: false, result: null }),
    { loading: false, error: null, sessions: [] },
  );

  await assert.rejects(() => gateway.gatewayRequest(null, "x", {}), /unavailable/i);
  assert.deepEqual(gateway.connectionState({}), {
    connected: false,
    canRead: false,
    canWrite: false,
  });
  assert.deepEqual(
    gateway.connectionState({ connection: { connected: true, canRead: true } }),
    { connected: true, canRead: true, canWrite: false },
  );

  assert.equal(computer.isComputerHeldByZero({ held: true, owned: true, controlLeaseId: "l" }), true);
  assert.equal(computer.isComputerHeldByZero({ held: true, owned: false, controlLeaseId: "l" }), false);
  assert.equal(computer.isHoldConflict(new Error("already-held")), true);
  assert.equal(computer.isHoldConflict(new Error("lease-invalid")), true);
  assert.equal(computer.isHoldConflict(new Error("offline")), false);
  assert.equal(computer.computerScopeLabel(null), "Global hold · all sessions");
  assert.equal(computer.computerScopeLabel({ scope: "session" }), "Session hold");
});

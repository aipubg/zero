/**
 * "Screen Share (Online)" section of the provider form.
 *
 * Shown only for a Gemini provider (base URL on
 * generativelanguage.googleapis.com). With it enabled, Zero shares the screen
 * with Gemini Live while online and keeps its local screen share for offline.
 * The API key is never handled here: the check runs on the Zero host.
 */

const GEMINI_HOST = "generativelanguage.googleapis.com";

export const isGeminiBaseUrl = value => {
  try { return new URL(String(value || "")).hostname === GEMINI_HOST; } catch { return false; }
};

/**
 * @param {object} options
 * @param {(tag: string, className?: string|null, text?: string) => HTMLElement} options.element
 * @param {(method: string, params?: object) => Promise<any>} options.call  Gateway RPC
 * @param {() => string} options.baseUrl     Current base URL in the form
 * @param {() => string} options.typedKey    Key typed into the form (may be empty or redacted)
 * @param {object|null} options.provider     Saved provider, if editing
 * @returns {{ root: HTMLElement, value: () => object|undefined, refresh: () => void }}
 */
export function createScreenShareSection({ element, call, baseUrl, typedKey, provider }) {
  const saved = provider?.screenShare || {};
  const root = element("div", "zero-modal__field zero-screen-share-settings");
  root.style.cssText = "margin-top:14px;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;";

  const title = element("label", "zero-modal__label", "Screen Share (Online, Gemini)");
  const explain = element("div", "zero-modal__hint",
    "When on, Zero shares your screen with Gemini Live while online, so it can see what you are doing, answer and help. "
    + "Your screen is sent to Google. Offline, Zero keeps using its local screen share.");
  explain.style.cssText = "font-size:12px;opacity:0.75;margin:4px 0 10px;";

  const row = (labelText, control) => {
    const wrap = element("div", "zero-modal__field");
    wrap.style.marginBottom = "8px";
    wrap.append(element("label", "zero-modal__label", labelText), control);
    return wrap;
  };
  const checkbox = (checked) => { const input = element("input"); input.type = "checkbox"; input.checked = Boolean(checked); return input; };
  const select = (options, current) => {
    const el = element("select", "zero-modal__select");
    for (const [value, label] of options) {
      const opt = element("option", null, label); opt.value = value; if (value === current) opt.selected = true; el.append(opt);
    }
    return el;
  };
  const modelSelect = (current) => {
    const el = element("select", "zero-modal__select");
    const opt = element("option", null, current); opt.value = current; opt.selected = true; el.append(opt);
    return el;
  };
  const fillModels = (el, ids) => {
    const current = el.value;
    el.replaceChildren();
    const list = ids.includes(current) ? ids : [current, ...ids];
    for (const id of list) { const opt = element("option", null, id); opt.value = id; if (id === current) opt.selected = true; el.append(opt); }
  };

  const enabled = checkbox(saved.enabled);
  const enabledRow = element("label", null);
  enabledRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;";
  enabledRow.append(enabled, element("span", null, "Turn on online screen share"));

  const liveModel = modelSelect(saved.liveModel || "gemini-3.8-live");
  const cuModel = modelSelect(saved.computerUseModel || "gemini-3.5-flash-lite");
  const cuEnvironment = select([["browser", "browser (works on this key)"], ["desktop", "desktop (refused on Free Tier in tests)"]], saved.computerUseEnvironment || "browser");
  const frameMode = select([["on-change", "Keep watching — send only when the screen changes (max 1/second)"], ["on-demand", "Only when Zero needs to look"]], saved.frameMode || "on-change");
  const voice = checkbox(saved.voiceReplies);
  const voiceRow = element("label", null);
  voiceRow.style.cssText = "display:flex;align-items:center;gap:8px;margin:4px 0 8px;cursor:pointer;";
  voiceRow.append(voice, element("span", null, "Speak replies aloud (otherwise text in chat only)"));
  const excluded = element("input", "zero-modal__input");
  excluded.value = (saved.excludedApps || ["KeePass", "KeePassXC", "1Password", "Bitwarden", "LastPass", "Windows Security"]).join(", ");
  const minutes = element("input", "zero-modal__input");
  minutes.type = "number"; minutes.min = "1"; minutes.max = "60"; minutes.value = String(saved.maxMinutesPerHour || 60);

  const status = element("div", "zero-screen-share-check-status");
  status.style.cssText = "font-size:12px;margin-top:6px;white-space:pre-line;";
  const checkBtn = element("button", "zero-models-btn", "Check connection");
  checkBtn.type = "button";

  const value = () => {
    if (!isGeminiBaseUrl(baseUrl())) return undefined;
    const apps = excluded.value.split(",").map(app => app.trim()).filter(Boolean);
    const perHour = Math.min(60, Math.max(1, Number.parseInt(minutes.value, 10) || 60));
    return {
      enabled: enabled.checked,
      liveModel: liveModel.value,
      computerUseModel: cuModel.value,
      computerUseEnvironment: cuEnvironment.value,
      frameMode: frameMode.value,
      voiceReplies: voice.checked,
      excludedApps: apps,
      maxMinutesPerHour: perHour,
    };
  };

  checkBtn.addEventListener("click", async () => {
    checkBtn.disabled = true;
    status.style.color = "";
    status.textContent = "Checking… (Computer Use can take up to a minute)";
    try {
      const key = typedKey();
      const result = await call("zero.screenShare.check", {
        providerId: provider?.id,
        ...(key && key !== "[REDACTED]" && !key.startsWith("env:") ? { apiKey: key } : {}),
        config: value(),
      });
      if (result?.models?.live?.length) fillModels(liveModel, result.models.live);
      if (result?.models?.computerUse?.length) fillModels(cuModel, result.models.computerUse);
      const live = result?.live;
      const cu = result?.computerUse;
      const lines = [];
      if (result?.error) lines.push(`✖ ${result.error}`);
      if (live) lines.push(live.ok ? `✔ Live (${live.model}): connected in ${live.ms} ms` : `✖ Live (${live.model}): ${live.error}`);
      if (cu) lines.push(cu.ok ? `✔ Computer Use (${cu.model}, ${cu.environment}): working (${Math.round(cu.ms / 1000)} s)` : `⚠ Computer Use (${cu.model}): ${cu.error} — screen share still works; clicking falls back to Zero's own hands.`);
      status.textContent = lines.join("\n");
      status.style.color = result?.ok ? "#34d399" : "#fb7185";
      if (!result?.ok) enabled.checked = false;
    } catch (error) {
      status.textContent = `✖ ${error.message}`;
      status.style.color = "#fb7185";
    } finally {
      checkBtn.disabled = false;
    }
  });

  // Turning it on without a passing check is allowed only if a check passed
  // before for this provider; otherwise run the check first.
  enabled.addEventListener("change", () => {
    if (enabled.checked && !/✔ Live/.test(status.textContent) && !saved.enabled) {
      status.textContent = "Run “Check connection” first; it turns on once Live connects.";
      status.style.color = "#fbbf24";
      enabled.checked = false;
    }
  });

  root.append(
    title, explain, enabledRow,
    row("Live model (sees the screen, talks)", liveModel),
    row("Computer Use model (finds where to click)", cuModel),
    row("Computer Use environment", cuEnvironment),
    row("How Zero watches", frameMode),
    voiceRow,
    row("Never send the screen while these apps are in front (comma-separated)", excluded),
    row("Online minutes per hour (limit)", minutes),
    checkBtn, status,
  );

  const refresh = () => { root.style.display = isGeminiBaseUrl(baseUrl()) ? "" : "none"; };
  refresh();
  return { root, value, refresh };
}

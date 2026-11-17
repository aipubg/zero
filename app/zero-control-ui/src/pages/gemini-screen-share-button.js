/**
 * "Gemini Live Screen Share" button for the Models page header.
 *
 * One click opens a box with a single field: the Gemini API key. Saving it
 * lets the Zero host check the key, pick the models, test the Live
 * connection and turn online screen share on. Advanced settings stay in the
 * provider's edit form.
 */

const STYLE_ID = "zero-gemini-screen-share-style";
const CSS = `
.zero-gss-btn{position:relative;display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;color:#e0e7ff;
  background:linear-gradient(#0f1424,#0f1424) padding-box,linear-gradient(135deg,#4285f4,#9b72cb,#d96570) border-box;border:1.5px solid transparent;transition:transform .12s ease,box-shadow .12s ease}
.zero-gss-btn:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(155,114,203,.35)}
.zero-gss-btn__spark{width:16px;height:16px;flex:none}
.zero-gss-btn__state{font-size:10px;font-weight:700;letter-spacing:.04em;padding:2px 6px;border-radius:999px;background:#1f2937;color:#9ca3af;text-transform:uppercase}
.zero-gss-btn__state--on{background:rgba(52,211,153,.15);color:#34d399}
.zero-gss-btn__state--paused{background:rgba(245,158,11,.15);color:#fbbf24}
.zero-gss-box{max-width:520px}
.zero-gss-box__lead{font-size:13px;line-height:1.5;opacity:.85;margin:0 0 14px}
.zero-gss-box__row{display:flex;gap:8px;align-items:center}
.zero-gss-box__row input{flex:1}
.zero-gss-box__note{font-size:12px;opacity:.65;margin-top:6px}
.zero-gss-box__status{font-size:12.5px;margin-top:12px;white-space:pre-line;min-height:18px}
.zero-gss-box__status--ok{color:#34d399}.zero-gss-box__status--err{color:#fb7185}.zero-gss-box__status--busy{color:#93c5fd}
.zero-gss-box__actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
`;

const SPARK = '<svg class="zero-gss-btn__spark" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="zgss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4285f4"/><stop offset=".55" stop-color="#9b72cb"/><stop offset="1" stop-color="#d96570"/></linearGradient></defs><path fill="url(#zgss)" d="M12 2c.6 5.3 4.7 9.4 10 10-5.3.6-9.4 4.7-10 10-.6-5.3-4.7-9.4-10-10 5.3-.6 9.4-4.7 10-10z"/></svg>';

const unwrap = response => response?.result ?? response;

/**
 * @param {object} options
 * @param {Function} options.element      DOM helper (tag, className, text)
 * @param {(method: string, params?: object) => Promise<any>} options.call
 * @param {HTMLElement} options.modalOverlay  the page's shared modal overlay
 * @param {() => void} [options.onChange]   reload the page data after a change
 */
export function createGeminiScreenShareButton({ element, call, modalOverlay, onChange }) {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.append(style);
  }

  const button = element("button", "zero-gss-btn");
  button.type = "button";
  button.innerHTML = `${SPARK}<span>Gemini Live Screen Share</span><span class="zero-gss-btn__state">Off</span>`;
  button.title = "Let Zero see and help with your screen through Gemini Live";
  const badge = button.querySelector(".zero-gss-btn__state");

  let current = null;
  const paint = status => {
    current = status;
    const on = status?.mode === "online" && !status.paused;
    badge.className = "zero-gss-btn__state" + (on ? " zero-gss-btn__state--on" : status?.paused || status?.mode === "connecting" ? " zero-gss-btn__state--paused" : "");
    badge.textContent = on ? "On" : status?.paused ? "Paused" : status?.mode === "connecting" ? "Connecting" : status?.configured ? "Off" : "Set up";
  };
  const refresh = () => call("zero.screenShare.status", {}).then(r => paint(unwrap(r))).catch(() => paint(null));
  void refresh();

  const close = () => {
    modalOverlay.classList.remove("active");
    modalOverlay.style.display = "none";
    modalOverlay.replaceChildren();
  };

  const open = () => {
    modalOverlay.replaceChildren();
    modalOverlay.classList.add("active");
    modalOverlay.style.display = "flex";

    const configured = Boolean(current?.configured);
    const isOn = current?.mode === "online" || current?.mode === "connecting";
    const modal = element("div", "zero-modal-content zero-modal zero-gss-box");
    const head = element("div", "zero-modal__header");
    const title = element("h2", "zero-modal__title");
    title.innerHTML = `${SPARK} Gemini Live Screen Share`;
    title.style.cssText = "display:flex;align-items:center;gap:8px;";
    const x = element("button", "zero-modal__close", "×");
    x.onclick = close;
    head.append(title, x);

    const body = element("div", "zero-modal__body");
    const lead = element("p", "zero-gss-box__lead",
      "Paste your Gemini API key. Zero checks it, picks the right models and turns on screen share: it can then see your screen, understand what you are working on and help. Your screen is sent to Google while this is on; offline, Zero keeps its local screen share.");
    const label = element("label", "zero-modal__label", "Gemini API key");
    const row = element("div", "zero-gss-box__row");
    const input = element("input", "zero-modal__input");
    input.type = "password";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = configured ? "Key saved — paste a new one only to replace it" : "AIza…";
    const show = element("button", "zero-providers-btn zero-providers-btn--subtle", "Show");
    show.type = "button";
    show.onclick = () => { input.type = input.type === "password" ? "text" : "password"; show.textContent = input.type === "password" ? "Show" : "Hide"; };
    row.append(input, show);
    const note = element("div", "zero-gss-box__note", "Get a key at aistudio.google.com → Get API key. The key is kept on this computer only.");
    const status = element("div", "zero-gss-box__status");
    if (current?.mode === "online") {
      status.className = "zero-gss-box__status zero-gss-box__status--ok";
      status.textContent = `On — Live model: ${current.liveModel}${current.paused ? `\nPaused: ${current.reason}` : ""}`;
    } else if (configured && current?.reason) {
      status.textContent = current.reason;
    }
    body.append(lead, label, row, note, status);

    const actions = element("div", "zero-gss-box__actions");
    const cancel = element("button", "zero-models-btn", "Close");
    cancel.type = "button";
    cancel.onclick = close;
    const off = element("button", "zero-models-btn", "Turn off");
    off.type = "button";
    off.style.display = configured && isOn ? "" : "none";
    const save = element("button", "zero-models-btn zero-btn-save-defaults", "Save & turn on");
    save.type = "button";

    const busy = (text) => { status.className = "zero-gss-box__status zero-gss-box__status--busy"; status.textContent = text; };
    const fail = (text) => { status.className = "zero-gss-box__status zero-gss-box__status--err"; status.textContent = `✖ ${text}`; };

    save.onclick = async () => {
      const key = input.value.trim();
      if (!key && !configured) { fail("Paste your Gemini API key first."); input.focus(); return; }
      save.disabled = true; off.disabled = true;
      busy("Checking the key and connecting to Gemini Live… (up to a minute)");
      try {
        const result = unwrap(await call("zero.screenShare.setup", key ? { apiKey: key } : {}));
        if (!result?.ok) { fail(result?.error || "Setup failed"); return; }
        input.value = "";
        const cu = result.check?.computerUse;
        status.className = "zero-gss-box__status zero-gss-box__status--ok";
        status.textContent = [
          "✔ Screen share is on.",
          `Sees and talks: ${result.liveModel}`,
          cu?.ok ? `Finds where to click: ${result.computerUseModel}` : `Finds where to click: ${result.computerUseModel} (not reachable right now — Zero uses its own hands meanwhile)`,
        ].join("\n");
        paint(result.status ? { ...result.status, configured: true } : current);
        off.style.display = "";
        onChange?.();
      } catch (error) {
        fail(error.message);
      } finally {
        save.disabled = false; off.disabled = false;
      }
    };

    off.onclick = async () => {
      off.disabled = true; save.disabled = true;
      busy("Turning off…");
      try {
        const result = unwrap(await call("zero.screenShare.setup", { enabled: false }));
        paint({ ...result, configured: true });
        status.className = "zero-gss-box__status";
        status.textContent = "Off. Zero uses its local (offline) screen share.";
        off.style.display = "none";
        onChange?.();
      } catch (error) {
        fail(error.message);
      } finally {
        off.disabled = false; save.disabled = false;
      }
    };

    input.addEventListener("keydown", event => { if (event.key === "Enter") save.click(); });
    actions.append(cancel, off, save);
    modal.append(head, body, actions);
    modalOverlay.append(modal);
    setTimeout(() => input.focus(), 50);
  };

  button.addEventListener("click", open);
  return { button, refresh };
}

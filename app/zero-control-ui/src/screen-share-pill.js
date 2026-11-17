/**
 * Top-bar "Screen Share" pill: shows offline (local) and online (Gemini)
 * screen share in one place, and lets the owner pick Auto or Offline only.
 */

const STYLES = {
  online: { bg: "#0b2547", border: "#3b82f6", fg: "#93c5fd", dot: "#60a5fa" },
  paused: { bg: "#2a1f06", border: "#f59e0b", fg: "#fbbf24", dot: "#f59e0b" },
  connecting: { bg: "#1e1b4b", border: "#6366f1", fg: "#c7d2fe", dot: "#818cf8" },
  offline: { bg: "#064e3b", border: "#059669", fg: "#6ee7b7", dot: "#34d399" },
  stopped: { bg: "#1a1d26", border: "#6b7280", fg: "#9ca3af", dot: "#6b7280" },
};

/** Text, colour key and tooltip for the current state. */
export function describeScreenShare(online, offline) {
  const localRunning = Boolean(offline?.observer?.running ?? offline?.running);
  if (online?.mode === "online" && online.paused) {
    return { key: "paused", text: "Screen Share: Online paused", title: `Gemini is not being sent the screen: ${online.reason}` };
  }
  if (online?.mode === "online") {
    return { key: "online", text: "Screen Share: Online · Gemini", title: `Gemini Live (${online.liveModel}) can see your screen. ${online.minutesUsedThisHour ?? 0} of ${online.minutesPerHourLimit ?? "?"} min used this hour.` };
  }
  if (online?.mode === "connecting") {
    return { key: "connecting", text: "Screen Share: Connecting…", title: online.reason || "Connecting to Gemini Live" };
  }
  if (localRunning) {
    return { key: "offline", text: "Screen Share: Offline · Local", title: online?.reason ? `Local screen share. ${online.reason}` : "Local screen share (nothing leaves this computer)." };
  }
  return { key: "stopped", text: "Screen Share: Stopped", title: "Local screen capture is stopped." };
}

export function paintScreenSharePill(button, state) {
  const style = STYLES[state.key] || STYLES.stopped;
  button.style.background = style.bg;
  button.style.borderColor = style.border;
  button.style.color = style.fg;
  button.title = state.title;
  const dot = button.querySelector(".zero-screen-dot");
  if (dot) dot.style.background = style.dot;
  const text = button.querySelector(".zero-screen-text");
  if (text) text.textContent = state.text;
}

/**
 * Keep the pill current. Returns a stop function.
 * @param {HTMLElement} button
 * @param {{ request: (method: string, params?: object) => Promise<any> }} host
 */
export function watchScreenSharePill(button, host, { intervalMs = 5000 } = {}) {
  let stopped = false;
  const unwrap = response => response?.result ?? response;
  const update = async () => {
    if (stopped || !button.isConnected) return;
    const [online, offline] = await Promise.all([
      host.request("zero.screenShare.status", {}).then(unwrap).catch(() => null),
      host.request("zero.observation.status", {}).then(unwrap).catch(() => null),
    ]);
    if (!stopped && button.isConnected) paintScreenSharePill(button, describeScreenShare(online, offline));
  };
  void update();
  const timer = setInterval(() => { if (!button.isConnected) { clearInterval(timer); return; } void update(); }, intervalMs);
  return { update, stop: () => { stopped = true; clearInterval(timer); } };
}

/** "Auto / Offline only" switch for the preview window header. */
export function createModeSwitch(host, onChange) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "zero-screen-mode-switch";
  button.style.cssText = "background:transparent;border:1px solid #30363d;color:#c9d1d9;border-radius:4px;padding:1px 6px;font-size:11px;cursor:pointer;margin-right:8px;";
  let preference = "auto";
  const paint = () => {
    button.textContent = preference === "offline" ? "Mode: Offline only" : "Mode: Auto (online when possible)";
    button.title = preference === "offline" ? "Click to allow online (Gemini) screen share" : "Click to keep the screen on this computer only";
  };
  host.request("zero.screenShare.status", {}).then(r => { preference = (r?.result ?? r)?.preference || "auto"; paint(); }).catch(paint);
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const next = preference === "offline" ? "auto" : "offline";
      const r = await host.request("zero.screenShare.setMode", { preference: next });
      preference = (r?.result ?? r)?.preference || next;
      paint();
      onChange?.();
    } catch (error) {
      button.textContent = `Mode: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  });
  paint();
  return button;
}

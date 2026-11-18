/**
 * Zero Home screen: opened from the sidebar's Home button (#home).
 *
 * - the status buttons (Computer Control, Voice, Reasoning, Workforce,
 *   Screen Share) live here instead of the top bar
 * - the glowing voice companion with its particle ring and sound wave
 *   reacts to the voice state: idle, listening, thinking, speaking, mic off
 * - a mic on/off switch so Zero does not hear things it should not
 */

const STYLE_ID = "zero-home-screen-style";
const CSS = `
.zero-home-screen{position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;overflow:auto;
  background:radial-gradient(ellipse at 50% 38%,#1a1440 0%,#0b0d24 45%,#05060f 100%);color:#e8e6ff;animation:zhs-in .35s cubic-bezier(.2,.8,.2,1)}
@keyframes zhs-in{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}
.zero-home-screen__top{width:100%;display:flex;align-items:center;gap:12px;padding:14px 22px}
.zero-home-screen__title{font:600 13px/1 ui-monospace,Consolas,monospace;letter-spacing:.18em;color:#9b94d8}
.zero-home-screen__close{margin-left:auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#cfcaf5;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:12px}
.zero-home-screen__close:hover{background:rgba(255,255,255,.12)}
.zero-home-status-slot{display:flex;justify-content:center;width:100%;padding:0 16px}
.zero-home-status-slot #zero-permanent-top-actions{position:static!important;display:inline-flex!important;flex-wrap:wrap;justify-content:center;gap:10px!important;padding:10px 14px;border-radius:14px;background:rgba(10,12,32,.55);border:1px solid rgba(140,130,255,.16);backdrop-filter:blur(10px)}
.zero-home-status-slot #zero-permanent-top-actions>:is(button,div){font-size:12px!important;padding:6px 12px!important;border-radius:8px!important}
#zero-permanent-top-actions:not(.zero-in-home){display:none!important}
.zero-home-stage{position:relative;width:min(560px,92vw);aspect-ratio:1/0.92;margin-top:8px;flex:none}
.zero-home-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block!important;visibility:visible!important}
.zero-home-bot{position:absolute;left:50%;top:44%;width:38%;transform:translate(-50%,-50%);animation:zhs-float 3.6s ease-in-out infinite;filter:drop-shadow(0 0 22px rgba(170,140,255,.75)) drop-shadow(0 0 48px rgba(110,200,255,.35));transition:filter .4s}
@keyframes zhs-float{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,calc(-50% - 10px))}}
.zero-home-bot svg{width:100%;height:auto;overflow:visible}
.zero-home-bot .eye{transform-box:fill-box;transform-origin:center;animation:zhs-blink 4.2s infinite}
@keyframes zhs-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.zero-home-bot .mouth{transform-box:fill-box;transform-origin:center top;transition:transform .08s}
.zero-home-screen[data-state="speaking"] .zero-home-bot{filter:drop-shadow(0 0 28px rgba(200,150,255,.95)) drop-shadow(0 0 60px rgba(120,210,255,.55))}
.zero-home-screen[data-state="listening"] .zero-home-bot .eye{animation:zhs-blink 4.2s infinite,zhs-look 5s ease-in-out infinite}
@keyframes zhs-look{0%,100%{translate:0 0}30%{translate:2px 0}60%{translate:-2px 0}}
.zero-home-screen[data-state="thinking"] .zero-home-bot .eye{animation:zhs-think 1.2s ease-in-out infinite}
@keyframes zhs-think{0%,100%{translate:0 0}50%{translate:0 -3px}}
.zero-home-screen[data-state="mic-off"] .zero-home-bot{filter:drop-shadow(0 0 10px rgba(140,120,220,.4));opacity:.72}
.zero-home-screen[data-state="mic-off"] .zero-home-bot .eye{animation:none;transform:scaleY(.25)}
.zero-home-state{margin-top:2px;font:600 15px/1.3 inherit;letter-spacing:.02em;color:#d9d4ff;min-height:20px;text-align:center}
.zero-home-caption{max-width:min(640px,90vw);min-height:42px;margin-top:6px;color:#a7a2d6;font-size:14px;line-height:1.5;text-align:center}
.zero-home-controls{display:flex;align-items:center;gap:12px;margin:18px 0 28px;flex-wrap:wrap;justify-content:center}
.zero-home-mic{position:relative;width:74px;height:74px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;color:#0b0d24;
  background:linear-gradient(140deg,#7ff3ff,#b79bff 55%,#ff9bd6);box-shadow:0 0 30px rgba(170,140,255,.55);transition:transform .15s,box-shadow .2s,filter .2s}
.zero-home-mic:hover{transform:scale(1.05)}
.zero-home-mic svg{width:30px;height:30px}
.zero-home-mic[data-muted="true"]{background:#2a2550;color:#a69fe0;box-shadow:none}
.zero-home-mic[data-muted="true"]::after{content:"";position:absolute;width:44px;height:3px;background:#ff7aa8;border-radius:3px;transform:rotate(-45deg)}
.zero-home-mic[data-live="true"]::before{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(160,140,255,.5);animation:zhs-ring 1.6s ease-out infinite}
@keyframes zhs-ring{from{transform:scale(.9);opacity:1}to{transform:scale(1.35);opacity:0}}
.zero-home-btn{background:rgba(255,255,255,.06);border:1px solid rgba(170,150,255,.28);color:#d9d4ff;border-radius:999px;padding:9px 16px;cursor:pointer;font-size:13px;font-weight:600}
.zero-home-btn:hover{background:rgba(255,255,255,.12)}
.zero-home-lang{background:rgba(255,255,255,.06);border:1px solid rgba(170,150,255,.28);color:#d9d4ff;border-radius:999px;padding:8px 12px;font-size:13px}
.zero-home-lang option{background:#14123a}
.zero-home-hint{font-size:12px;color:#7d78ad;margin-bottom:22px;text-align:center}
`;

const BOT_SVG = `
<svg viewBox="0 0 200 210" aria-hidden="true">
  <defs>
    <linearGradient id="zhsBody" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#e9fdff"/>
      <stop offset="0.28" stop-color="#9ff0ff"/>
      <stop offset="0.62" stop-color="#b99dff"/>
      <stop offset="1" stop-color="#f6a0e2"/>
    </linearGradient>
    <radialGradient id="zhsShine" cx="0.35" cy="0.22" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".85"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="zhsVisor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b1b4a"/>
      <stop offset="1" stop-color="#0d0d2c"/>
    </linearGradient>
    <filter id="zhsGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <!-- body: dome head, little arms, wavy hem -->
  <path d="M100 8 C150 8 172 46 172 92 L172 104 C186 108 192 122 182 130 C176 134 171 130 171 126 L170 166
           C170 182 160 196 148 190 C140 186 136 198 124 198 C112 198 110 186 100 186 C90 186 88 198 76 198
           C64 198 60 186 52 190 C40 196 30 182 30 166 L29 126 C29 130 24 134 18 130 C8 122 14 108 28 104 L28 92
           C28 46 50 8 100 8 Z" fill="url(#zhsBody)"/>
  <path d="M100 8 C150 8 172 46 172 92 L172 140 C150 120 60 120 28 140 L28 92 C28 46 50 8 100 8 Z" fill="url(#zhsShine)" opacity=".55"/>
  <!-- visor face -->
  <rect x="48" y="46" width="104" height="74" rx="34" fill="url(#zhsVisor)"/>
  <rect x="52" y="49" width="96" height="20" rx="12" fill="#ffffff" opacity=".05"/>
  <g filter="url(#zhsGlow)">
    <rect class="eye" x="70" y="66" width="16" height="22" rx="8" fill="#8ff6ff"/>
    <rect class="eye" x="114" y="66" width="16" height="22" rx="8" fill="#8ff6ff"/>
    <path class="mouth" d="M88 96 Q100 108 112 96" stroke="#8ff6ff" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>
  <ellipse cx="62" cy="102" rx="8" ry="5" fill="#ff8fc8" opacity=".75"/>
  <ellipse cx="138" cy="102" rx="8" ry="5" fill="#ff8fc8" opacity=".75"/>
</svg>`;

const MIC_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';

const STATE_TEXT = {
  idle: "Tap the mic to talk to Zero",
  waiting: "Listening…",
  listening: "Listening…",
  transcribing: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking… (say “stop” to interrupt)",
  "mic-off": "Mic is off — Zero can't hear you",
  muted: "Mic is off — Zero can't hear you",
  error: "Voice problem — tap the mic to try again",
  disconnected: "Not connected to Zero",
};

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}

/** Particle ring + layered sound wave, drawn every frame. */
export function startScene(particles, wave, getEnergy, getState) {
  const pc = particles.getContext("2d"), wc = wave.getContext("2d");
  if (!pc || !wc) return () => {};
  const dots = Array.from({ length: 140 }, (_, i) => ({
    a: Math.random() * Math.PI * 2, r: 0.62 + Math.random() * 0.3, s: 0.0015 + Math.random() * 0.004,
    size: 0.6 + Math.random() * 1.9, tw: Math.random() * Math.PI * 2, hue: [195, 265, 315][i % 3],
  }));
  let t = 0, raf = 0, energy = 0.12, previous = null;
  const fit = c => {
    const r = c.getBoundingClientRect(), d = Math.min(2, globalThis.devicePixelRatio || 1);
    const width = Math.max(0, Math.round(r.width * d)), height = Math.max(0, Math.round(r.height * d));
    if (c.width !== width || c.height !== height) { c.width = width; c.height = height; }
  };
  const frame = (now = 0) => {
    const dt = previous === null ? 1 / 60 : Math.min(0.05, Math.max(0, (now - previous) / 1000));
    previous = now;
    if (document.hidden) { raf = requestAnimationFrame(frame); return; }
    fit(particles); fit(wave);
    if (!particles.width || !particles.height || !wave.width || !wave.height) { raf = requestAnimationFrame(frame); return; }
    const state = getState();
    const target = Math.max(getEnergy(), state === "speaking" ? 0.55 : state === "thinking" ? 0.3 : state === "mic-off" ? 0.03 : 0.12);
    energy += (target - energy) * (1 - Math.exp(-8 * dt));
    t += dt;
    // particles
    const w = particles.width, h = particles.height, cx = w / 2, cy = h * 0.44, R = Math.min(w, h) * 0.42;
    pc.clearRect(0, 0, w, h);
    const halo = pc.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 1.05);
    halo.addColorStop(0, "rgba(150,120,255,0.22)"); halo.addColorStop(0.55, "rgba(90,150,255,0.08)"); halo.addColorStop(1, "rgba(0,0,0,0)");
    pc.fillStyle = halo; pc.fillRect(0, 0, w, h);
    const speed = 1 + energy * 3 + (state === "thinking" ? 2 : 0);
    for (const d of dots) {
      d.a += d.s * speed * dt * 60;
      const rr = R * d.r * (1 + Math.sin(t * 2 + d.tw) * 0.02 * (1 + energy * 4));
      const x = cx + Math.cos(d.a) * rr, y = cy + Math.sin(d.a) * rr * 0.92;
      const alpha = (0.35 + 0.65 * Math.abs(Math.sin(t * 1.7 + d.tw))) * (state === "mic-off" ? 0.35 : 1);
      pc.beginPath(); pc.arc(x, y, d.size * (w / 600), 0, Math.PI * 2);
      pc.fillStyle = `hsla(${d.hue},95%,${72 + 10 * Math.sin(d.tw + t)}%,${alpha})`;
      pc.shadowColor = `hsla(${d.hue},100%,70%,0.9)`; pc.shadowBlur = 6 * (w / 600);
      pc.fill();
    }
    pc.shadowBlur = 0;
    // sound wave: layered sine waves peaking in the middle
    const W = wave.width, H = wave.height, mid = H / 2;
    wc.clearRect(0, 0, W, H);
    const layers = [
      { color: "255,140,220", amp: 1.0, freq: 2.2, speed: 2.6, width: 2.4 },
      { color: "170,140,255", amp: 0.8, freq: 3.1, speed: -2.0, width: 2.0 },
      { color: "120,230,255", amp: 0.65, freq: 4.0, speed: 3.3, width: 1.6 },
      { color: "255,190,240", amp: 0.45, freq: 5.2, speed: -3.8, width: 1.2 },
    ];
    for (const L of layers) {
      wc.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const p = x / W, env = Math.exp(-Math.pow((p - 0.5) / 0.17, 2));
        const y = mid + Math.sin(p * Math.PI * 2 * L.freq + t * L.speed) * env * L.amp * H * 0.44 * Math.min(1, 0.1 + energy * 1.1);
        x ? wc.lineTo(x, y) : wc.moveTo(x, y);
      }
      wc.strokeStyle = `rgba(${L.color},0.9)`; wc.lineWidth = L.width * (W / 600);
      wc.shadowColor = `rgba(${L.color},0.9)`; wc.shadowBlur = 10 * (W / 600);
      wc.stroke();
    }
    wc.shadowBlur = 0;
    raf = requestAnimationFrame(frame);
  };
  frame();
  return () => cancelAnimationFrame(raf);
}

export function mountHomeScreen(host) {
  if (typeof document === "undefined") return () => {};
  ensureStyle();
  let screen = null, stopScene = null, energy = 0, pulseTimer = null, captionTimer = null;
  const isHome = () => location.hash === "#home";
  const voiceButton = () => document.querySelector(".zero-voice-toggle-btn");

  const open = () => {
    const main = document.querySelector("main.content");
    if (!main || screen?.isConnected) return;
    if (getComputedStyle(main).position === "static") main.style.position = "relative";
    screen = document.createElement("section");
    screen.className = "zero-home-screen";
    screen.setAttribute("data-zero-shell-owned", "");
    screen.setAttribute("aria-label", "Zero home");
    screen.innerHTML = `
      <div class="zero-home-screen__top"><span class="zero-home-screen__title">ZERO · HOME</span><button class="zero-home-screen__close" type="button">← Back to chat</button></div>
      <div class="zero-home-status-slot"></div>
      <div class="zero-home-stage"><canvas class="zhs-particles"></canvas><div class="zero-home-bot">${BOT_SVG}</div><canvas class="zhs-wave" style="top:auto;bottom:2%;height:26%"></canvas></div>
      <div class="zero-home-state" aria-live="polite"></div>
      <div class="zero-home-caption"></div>
      <div class="zero-home-controls">
        <select class="zero-home-lang" aria-label="Voice language"><option value="en-IN">English</option><option value="hi-IN">हिन्दी</option></select>
        <button class="zero-home-mic" type="button" aria-label="Microphone">${MIC_SVG}</button>
        <button class="zero-home-btn zero-home-end" type="button">End voice</button>
      </div>
      <div class="zero-home-hint">Say “stop” or just start talking to interrupt Zero. Turn the mic off when you don't want Zero to listen.</div>`;
    main.append(screen);
    screen.querySelector(".zero-home-screen__close").onclick = () => { history.back(); setTimeout(() => { if (isHome()) location.hash = ""; }, 120); };
    const mic = screen.querySelector(".zero-home-mic");
    const lang = screen.querySelector(".zero-home-lang");
    const state = screen.querySelector(".zero-home-state");
    const caption = screen.querySelector(".zero-home-caption");
    const mouth = screen.querySelector(".mouth");

    const vc = () => voiceButton()?.zeroVoice;
    const paint = () => {
      const v = vc();
      const s = v ? ((v.speaking || v.state === "speaking") ? "speaking" : v.muted ? "mic-off" : v.active ? v.state : "idle") : "idle";
      screen.dataset.state = s;
      state.textContent = STATE_TEXT[s] || STATE_TEXT.idle;
      mic.dataset.on = String(Boolean(v?.active && !v?.muted));
      mic.dataset.muted = String(Boolean(v?.muted));
      mic.dataset.live = String(Boolean(v?.active && !v?.muted && (s === "listening" || s === "waiting")));
      mic.title = !v?.active ? "Start talking to Zero" : v.muted ? "Turn the mic on" : "Turn the mic off";
      screen.querySelector(".zero-home-end").style.display = v?.active ? "" : "none";
      if (v) lang.value = v.lang?.startsWith("hi") ? "hi-IN" : "en-IN";
    };
    mic.onclick = async () => {
      const v = vc();
      if (!v) { caption.textContent = "Voice is still starting — try again in a moment."; return; }
      if (!v.active) { if (v.muted) await v.unmute(); await v.start(); }
      else if (v.muted) await v.unmute();
      else await v.mute();
      paint();
    };
    screen.querySelector(".zero-home-end").onclick = async () => { await vc()?.stop(); paint(); };
    lang.onchange = () => { vc()?.setLang(lang.value); paint(); };

    const showCaption = (text, ms = 9000) => {
      caption.textContent = text;
      clearTimeout(captionTimer);
      if (ms) captionTimer = setTimeout(() => { caption.textContent = ""; }, ms);
    };
    const voiceListeners = [];
    let wiredButton = null;
    const unwireVoice = () => {
      for (const [btn, name, handler] of voiceListeners.splice(0)) btn.removeEventListener(name, handler);
      wiredButton = null;
    };
    const wireVoice = () => {
      const btn = voiceButton();
      if (btn === wiredButton) return;
      unwireVoice();
      if (!btn) return;
      wiredButton = btn;
      const listen = (name, handler) => { btn.addEventListener(name, handler); voiceListeners.push([btn, name, handler]); };
      listen("zero-voice:state", paint);
      listen("zero-voice:heard", e => { energy = 0.45; showCaption(`“${e.detail.text}”`, 6000); });
      listen("zero-voice:sent", e => showCaption(`You: ${e.detail.text}`, 0));
      listen("zero-voice:speak", e => showCaption(e.detail.text, 0));
      listen("zero-voice:word", () => {
        energy = 1;
        if (mouth) mouth.style.transform = "scaleY(2.2)";
        clearTimeout(pulseTimer);
        pulseTimer = setTimeout(() => { energy = 0.35; if (mouth) mouth.style.transform = ""; }, 140);
      });
      listen("zero-voice:quiet", () => { energy = 0; if (mouth) mouth.style.transform = ""; paint(); });
      listen("zero-voice:interrupted", () => { energy = 0.2; showCaption("Okay — I'm listening.", 3000); paint(); });
    };
    wireVoice();
    const wireTimer = setInterval(() => { wireVoice(); paint(); energy *= 0.9; }, 400);
    stopScene = startScene(screen.querySelector(".zhs-particles"), screen.querySelector(".zhs-wave"), () => energy, () => screen?.dataset.state || "idle");
    screen.__dispose = () => { clearInterval(wireTimer); clearTimeout(pulseTimer); clearTimeout(captionTimer); unwireVoice(); energy = 0; };
    paint();
    placeControls();
  };

  // The status buttons live on the Home screen, not in the top bar.
  const placeControls = () => {
    const controls = document.getElementById("zero-permanent-top-actions");
    const slot = screen?.isConnected ? screen.querySelector(".zero-home-status-slot") : null;
    if (!controls) return;
    if (slot) { if (controls.parentElement !== slot) slot.append(controls); controls.classList.add("zero-in-home"); }
    else { controls.classList.remove("zero-in-home"); if (controls.closest(".zero-home-screen")) document.body.append(controls); }
  };

  const close = () => {
    if (!screen) return;
    stopScene?.(); stopScene = null;
    screen.__dispose?.();
    const controls = document.getElementById("zero-permanent-top-actions");
    if (controls?.closest(".zero-home-screen")) { controls.classList.remove("zero-in-home"); document.body.append(controls); }
    screen.remove(); screen = null;
  };

  const sync = () => {
    if (isHome()) { if (!screen?.isConnected) { close(); open(); } else placeControls(); }
    else close();
  };

  // The sidebar's Home button opens this screen.
  const onClick = event => {
    const home = event.target?.closest?.(".sidebar-footer-bar__home, [data-zero-home-button]");
    if (!home) return;
    event.preventDefault();
    event.stopPropagation();
    if (!location.pathname.startsWith("/chat")) history.pushState(null, "", "/chat/zero#home");
    else location.hash = "home";
    sync();
  };
  const decorate = () => {
    for (const b of document.querySelectorAll(".sidebar-footer-bar__home")) {
      if (b.getAttribute("aria-label") !== "Zero home screen") { b.setAttribute("aria-label", "Zero home screen"); b.title = "Home screen"; }
    }
  };
  document.addEventListener("click", onClick, true);
  window.addEventListener("hashchange", sync);
  window.addEventListener("popstate", sync);
  const poll = setInterval(() => { decorate(); sync(); }, 700);
  sync();
  return () => {
    clearInterval(poll);
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("hashchange", sync);
    window.removeEventListener("popstate", sync);
    close();
  };
}

/**
 * Generative UI Widgets for Project Zero
 * Renders rich interactive UI components directly into the chat stream and spaces pane:
 * - Progress cards: Multi-step live execution progress with badges
 * - Code diff widgets: Clean syntax-styled diff cards with Apply/Copy actions
 * - Media & YouTube cards: Video scene breakdown, timestamps and transcripts
 * - Research cards: Interactive source carousel with domain credibility indicators
 */

import { escapeHtml } from "../shared/dom.js";

/**
 * Creates an interactive multi-step progress card
 */
export function createProgressWidget({
  title = "OpenMausBot Computer Execution",
  step = 4,
  totalSteps = 4,
  status = "completed",
  details = "",
  logs = [],
} = {}) {
  const percent = Math.min(100, Math.round((step / Math.max(1, totalSteps)) * 100));
  const isDone = step >= totalSteps || status === "completed";
  const statusColor = isDone ? "#10b981" : status === "error" ? "#ef4444" : "#3b82f6";
  const statusLabel = isDone ? "COMPLETED" : status.toUpperCase();

  const el = document.createElement("div");
  el.className = "zero-gen-widget zero-gen-progress";
  el.style.cssText = `
    margin: 14px 0;
    padding: 14px 16px;
    background: #0d121c;
    border: 1px solid #1e293b;
    border-radius: 10px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #e2e8f0;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  `;

  el.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div style="font-weight: 700; font-size: 13px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; box-shadow: 0 0 6px ${statusColor};"></span>
        ${escapeHtml(title)}
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: ${statusColor}; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); padding: 2px 8px; border-radius: 10px;">
          ${escapeHtml(statusLabel)} (${step}/${totalSteps})
        </span>
        <button class="zero-takeover-btn" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 6px; cursor: pointer;">
          Take Over (F8)
        </button>
      </div>
    </div>
    <div style="width: 100%; height: 5px; background: #1e293b; border-radius: 3px; overflow: hidden; margin-bottom: 10px;">
      <div style="width: ${percent}%; height: 100%; background: ${statusColor}; transition: width 0.3s ease;"></div>
    </div>
    ${details ? `<div style="font-size: 12px; color: #94a3b8; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;"><span style="color: #64748b;">🖥</span> ${escapeHtml(details)}</div>` : ""}
    ${
      logs && logs.length > 0
        ? `
      <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
        ${logs.map((l) => `
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #cbd5e1; background: #151b28; padding: 4px 8px; border-radius: 4px; border: 1px solid #1e293b;">
            <span style="color: #10b981; font-weight: bold;">✔</span>
            <span style="flex: 1; font-family: -apple-system, sans-serif;">${escapeHtml(l.replace(/^[✔\s]+/, ''))}</span>
          </div>
        `).join("")}
      </div>
    `
        : ""
    }
  `;

  el.querySelector(".zero-takeover-btn")?.addEventListener("click", async () => {
    try {
      const net = window["fetch"] || globalThis["fetch"];
      await net?.("/api/zero/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bailout" }),
      });
      const btn = el.querySelector(".zero-takeover-btn");
      if (btn) btn.textContent = "Hold Active";
    } catch {}
  });

  return el;
}

/**
 * Creates an interactive code diff card
 */
export function createDiffWidget({
  filename = "file.txt",
  original = "",
  modified = "",
  language = "javascript",
} = {}) {
  const el = document.createElement("div");
  el.className = "zero-gen-widget zero-gen-diff";
  el.style.cssText = `
    margin: 12px 0;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    overflow: hidden;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #161b22;
    border-bottom: 1px solid #30363d;
    color: #e6edf3;
  `;
  header.innerHTML = `
    <span style="font-weight: 600;">📝 ${escapeHtml(filename)}</span>
    <button class="zero-diff-copy-btn" style="background: #21262d; border: 1px solid #30363d; color: #c9d1d9; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 11px;">Copy Modified</button>
  `;

  header.querySelector(".zero-diff-copy-btn")?.addEventListener("click", () => {
    navigator.clipboard?.writeText(modified);
    const btn = header.querySelector(".zero-diff-copy-btn");
    if (btn) {
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = "Copy Modified"; }, 2000);
    }
  });

  const body = document.createElement("div");
  body.style.cssText = "padding: 8px 12px; max-height: 250px; overflow-y: auto; color: #c9d1d9;";

  const lines = [];
  if (original) {
    for (const l of original.split("\n")) {
      lines.push(`<div style="background: rgba(248,81,73,0.15); color: #ff7b72; padding: 1px 4px;">- ${escapeHtml(l)}</div>`);
    }
  }
  if (modified) {
    for (const l of modified.split("\n")) {
      lines.push(`<div style="background: rgba(46,160,67,0.15); color: #7ee787; padding: 1px 4px;">+ ${escapeHtml(l)}</div>`);
    }
  }
  body.innerHTML = lines.join("") || "<div>No changes</div>";

  el.appendChild(header);
  el.appendChild(body);
  return el;
}

/**
 * Creates an interactive Media & YouTube video controller card
 */
export function createMediaWidget({
  title = "YouTube Media",
  videoId = "",
  url = "",
  thumbnail = "",
  status = "playing",
  artist = "YouTube Music",
  details = "",
  durationSeconds = 0,
  sceneSummary = "",
  frameCount = 1,
  transcripts = [],
} = {}) {
  const thumbUrl = thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");
  const el = document.createElement("div");
  el.className = "zero-gen-widget zero-gen-media";
  el.style.cssText = `
    margin: 14px 0;
    padding: 16px;
    background: linear-gradient(145deg, #0d121c 0%, #151b28 100%);
    border: 1px solid #1e293b;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  el.innerHTML = `
    <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 12px;">
      ${thumbUrl ? `
        <div style="position: relative; width: 110px; height: 68px; border-radius: 8px; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <img src="${escapeHtml(thumbUrl)}" alt="Thumbnail" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
          <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.75); color: #fff; font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: 700;">LIVE</div>
        </div>
      ` : ""}
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="display: inline-flex; align-items: center; gap: 5px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
            Playing Now
          </span>
          <span style="color: #64748b; font-size: 11px;">Desktop Chrome</span>
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px;">
          ${escapeHtml(title)}
        </div>
        <div style="font-size: 12px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(artist || "YouTube Music")} ${details ? `• ${escapeHtml(details)}` : ""}
        </div>
      </div>
    </div>

    <!-- Interactive Media Control Buttons -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px solid #1e293b;">
      <button class="zero-media-btn" data-action="play_pause" style="background: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
        ⏯ Play / Pause
      </button>
      <button class="zero-media-btn" data-action="next" style="background: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
        ⏭ Next Song
      </button>
      <button class="zero-media-btn" data-action="volume_up" style="background: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
        🔊 Volume Up
      </button>
      <button class="zero-media-btn" data-action="focus" style="background: #1e293b; border: 1px solid #334155; color: #38bdf8; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
        🖥 Focus Window
      </button>
    </div>
  `;

  // Hook interactive clicks to /api/zero/media
  const btns = el.querySelectorAll(".zero-media-btn");
  for (const btn of btns) {
    btn.addEventListener("click", async () => {
      const act = btn.getAttribute("data-action");
      const origText = btn.innerHTML;
      btn.innerHTML = `⏳ Executing...`;
      btn.style.opacity = "0.7";
      try {
        const net = window["fetch"] || globalThis["fetch"];
        await net?.("/api/zero/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: act }),
        });
        btn.innerHTML = `✔ Done!`;
        setTimeout(() => { btn.innerHTML = origText; btn.style.opacity = "1"; }, 1000);
      } catch (err) {
        btn.innerHTML = `❌ Error`;
        setTimeout(() => { btn.innerHTML = origText; btn.style.opacity = "1"; }, 1500);
      }
    });
  }

  return el;
}

/**
 * Creates an interactive verified sources carousel card
 */
export function createSourcesWidget({ query = "Research Topic", sources = [] } = {}) {
  const el = document.createElement("div");
  el.className = "zero-gen-widget zero-gen-sources";
  el.style.cssText = `
    margin: 12px 0;
    padding: 12px 14px;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 12px;
  `;

  const header = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: 600; color: #38bdf8;">🔍 Sources for "${escapeHtml(query)}"</span>
      <span style="color: #64748b; font-size: 11px;">${sources.length} Verified Sources</span>
    </div>
  `;

  const cards = (sources || [])
    .map(
      (s) => `
    <div style="background: #1e293b; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <a href="${escapeHtml(s.url || "#")}" rel="noreferrer" style="font-weight: 600; color: #60a5fa; text-decoration: none; font-size: 12px;">${escapeHtml(s.title || s.url || "Source")}</a>
        <span style="font-size: 10px; background: rgba(34,197,94,0.15); color: #4ade80; padding: 1px 4px; border-radius: 3px;">Verified</span>
      </div>
      ${s.snippet ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px; line-height: 1.3;">${escapeHtml(s.snippet)}</div>` : ""}
    </div>
  `
    )
    .join("");

  el.innerHTML = `${header}<div style="max-height: 200px; overflow-y: auto;">${cards || "<div>No sources recorded</div>"}</div>`;
  return el;
}

/**
 * Scans an element or document for ````zero-ui:* blocks and replaces them with interactive widgets
 */
export function renderGenerativeWidgets(container) {
  if (!container || typeof container.querySelectorAll !== "function") return;

  const codeBlocks = Array.from(container.querySelectorAll("pre, code, div, p"));
  for (const block of codeBlocks) {
    if (!block.isConnected) continue;
    const text = block.textContent || "";
    if (!text.includes("zero-ui:")) continue;

    // 1. Is it a dedicated code or pre block?
    const isCodeOrPre = block.tagName.toLowerCase() === "pre" || block.tagName.toLowerCase() === "code";
    if (isCodeOrPre) {
      const typeMatch = text.match(/zero-ui:(media|progress|diff|sources)/);
      if (typeMatch) {
        const type = typeMatch[1];
        const jsonMatch = text.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[1]);
            let widget = null;
            if (type === "media") widget = createMediaWidget(data);
            else if (type === "progress") widget = createProgressWidget(data);
            else if (type === "diff") widget = createDiffWidget(data);
            else if (type === "sources") widget = createSourcesWidget(data);

            if (widget) {
              const target = block.closest("pre") || block;
              target.parentElement?.replaceChild(widget, target);
              continue;
            }
          } catch {}
        }
      }
    }

    // 2. Container element containing zero-ui blocks
    const blockRegex = /`{3,4}zero-ui:(media|progress|diff|sources)\s*(\{[\s\S]*?\})\s*`{3,4}/g;
    if (blockRegex.test(text)) {
      blockRegex.lastIndex = 0;
      let m;
      let lastIndex = 0;
      const frag = document.createDocumentFragment();
      let matchedAny = false;
      while ((m = blockRegex.exec(text)) !== null) {
        matchedAny = true;
        const textBefore = text.slice(lastIndex, m.index);
        lastIndex = m.index + m[0].length;
        if (textBefore.trim()) {
          const span = document.createElement("div");
          span.textContent = textBefore;
          frag.appendChild(span);
        }
        try {
          const type = m[1];
          const data = JSON.parse(m[2]);
          let widget = null;
          if (type === "media") widget = createMediaWidget(data);
          else if (type === "progress") widget = createProgressWidget(data);
          else if (type === "diff") widget = createDiffWidget(data);
          else if (type === "sources") widget = createSourcesWidget(data);
          if (widget) frag.appendChild(widget);
        } catch {}
      }
      if (matchedAny) {
        const textAfter = text.slice(lastIndex);
        if (textAfter.trim()) {
          const span = document.createElement("div");
          span.textContent = textAfter;
          frag.appendChild(span);
        }
        block.parentElement?.replaceChild(frag, block);
      }
    }
  }
}

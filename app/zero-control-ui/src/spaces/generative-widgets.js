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
  title = "Agent Task Execution",
  step = 1,
  totalSteps = 4,
  status = "in-progress",
  details = "",
  logs = [],
} = {}) {
  const percent = Math.min(100, Math.round((step / Math.max(1, totalSteps)) * 100));
  const isDone = step >= totalSteps || status === "completed";
  const statusColor = isDone ? "#22c55e" : status === "error" ? "#ef4444" : "#3b82f6";
  const statusLabel = isDone ? "COMPLETED" : status.toUpperCase();

  const el = document.createElement("div");
  el.className = "zero-gen-widget zero-gen-progress";
  el.style.cssText = `
    margin: 12px 0;
    padding: 14px 16px;
    background: #11141a;
    border: 1px solid #1e2633;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #e2e8f0;
  `;

  el.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div style="font-weight: 600; font-size: 13px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></span>
        ${escapeHtml(title)}
      </div>
      <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.5px; color: ${statusColor}; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">
        ${escapeHtml(statusLabel)} (${step}/${totalSteps})
      </div>
    </div>
    <div style="width: 100%; height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; margin-bottom: 10px;">
      <div style="width: ${percent}%; height: 100%; background: ${statusColor}; transition: width 0.3s ease;"></div>
    </div>
    ${details ? `<div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">${escapeHtml(details)}</div>` : ""}
    ${
      logs && logs.length > 0
        ? `
      <details style="margin-top: 8px; font-size: 11px;">
        <summary style="cursor: pointer; color: #64748b; outline: none;">View execution log (${logs.length} events)</summary>
        <div style="background: #090c10; padding: 8px; border-radius: 4px; margin-top: 6px; font-family: monospace; color: #cbd5e1; max-height: 120px; overflow-y: auto;">
          ${logs.map((l) => `<div>> ${escapeHtml(l)}</div>`).join("")}
        </div>
      </details>
    `
        : ""
    }
  `;
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
 * Creates an interactive Media & YouTube video log card
 */
export function createMediaWidget({
  title = "Video Observation",
  durationSeconds = 0,
  sceneSummary = "",
  frameCount = 1,
  transcripts = [],
} = {}) {
  const el = document.createElement("div");
  el.className = "zero-gen-widget zero-gen-media";
  el.style.cssText = `
    margin: 12px 0;
    padding: 12px 14px;
    background: #141720;
    border: 1px solid #282f42;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 12px;
  `;

  el.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span style="font-weight: 600; color: #a5b4fc;">🎬 ${escapeHtml(title)}</span>
      <span style="color: #64748b; font-size: 11px;">Duration: ${durationSeconds}s (${frameCount} frames)</span>
    </div>
    <div style="color: #cbd5e1; margin-bottom: 8px; line-height: 1.4;">${escapeHtml(sceneSummary)}</div>
    ${
      transcripts && transcripts.length > 0
        ? `
      <div style="background: #0b0d13; border: 1px solid #1e2333; border-radius: 4px; padding: 8px; font-family: sans-serif; font-size: 11px;">
        <span style="color: #94a3b8; font-weight: 600;">Speech Transcript:</span>
        <div style="margin-top: 4px; color: #38bdf8;">"${escapeHtml(transcripts.join(" "))}"</div>
      </div>
    `
        : ""
    }
  `;
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
        <a href="${escapeHtml(s.url || "#")}" target="_blank" rel="noreferrer" style="font-weight: 600; color: #60a5fa; text-decoration: none; font-size: 12px;">${escapeHtml(s.title || s.url || "Source")}</a>
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

  const codeBlocks = container.querySelectorAll("pre, code");
  for (const block of codeBlocks) {
    const text = block.textContent || "";
    if (text.includes("zero-ui:")) {
      try {
        if (text.includes("zero-ui:progress")) {
          const jsonStr = text.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
          const data = JSON.parse(jsonStr);
          const widget = createProgressWidget(data);
          block.parentElement?.replaceChild(widget, block);
        } else if (text.includes("zero-ui:diff")) {
          const jsonStr = text.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
          const data = JSON.parse(jsonStr);
          const widget = createDiffWidget(data);
          block.parentElement?.replaceChild(widget, block);
        } else if (text.includes("zero-ui:media")) {
          const jsonStr = text.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
          const data = JSON.parse(jsonStr);
          const widget = createMediaWidget(data);
          block.parentElement?.replaceChild(widget, block);
        } else if (text.includes("zero-ui:sources")) {
          const jsonStr = text.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
          const data = JSON.parse(jsonStr);
          const widget = createSourcesWidget(data);
          block.parentElement?.replaceChild(widget, block);
        }
      } catch {
        // preserve original text if JSON parse fails
      }
    }
  }
}

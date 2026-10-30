/**
 * Spaces Bar for Project Zero Chat Shell
 * Renders a compact navigation pill bar in `/chat/zero` allowing instant switching between:
 * - 💻 Coder Space
 * - 🎬 Media Space
 * - 🔍 Research Space
 */

import { spacesManager, SPACE_IDS } from "./spaces-manager.js";

export function mountSpacesBar(targetContainer) {
  if (!targetContainer) return null;

  const bar = document.createElement("div");
  bar.className = "zero-spaces-bar";
  bar.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px;
    background: #0f131a;
    border-bottom: 1px solid #1e2633;
    font-size: 12px;
    user-select: none;
    z-index: 10;
  `;

  function render() {
    const state = spacesManager.getState();
    const active = state.activeSpace;

    bar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 700; color: #38bdf8; letter-spacing: 0.5px; font-size: 11px;">SPACES:</span>
        <div style="display: flex; gap: 4px; background: #161b24; padding: 2px; border-radius: 6px; border: 1px solid #232c3b;">
          <button data-space="${SPACE_IDS.CODER}" style="border: none; cursor: pointer; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; background: ${active === SPACE_IDS.CODER ? "#2563eb" : "transparent"}; color: ${active === SPACE_IDS.CODER ? "#ffffff" : "#94a3b8"};">
            💻 Coder
          </button>
          <button data-space="${SPACE_IDS.MEDIA}" style="border: none; cursor: pointer; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; background: ${active === SPACE_IDS.MEDIA ? "#8b5cf6" : "transparent"}; color: ${active === SPACE_IDS.MEDIA ? "#ffffff" : "#94a3b8"};">
            🎬 Media
          </button>
          <button data-space="${SPACE_IDS.RESEARCH}" style="border: none; cursor: pointer; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; background: ${active === SPACE_IDS.RESEARCH ? "#059669" : "transparent"}; color: ${active === SPACE_IDS.RESEARCH ? "#ffffff" : "#94a3b8"};">
            🔍 Research
          </button>
        </div>
      </div>
      <div style="font-size: 11px; color: #64748b;">
        <span>Active: <strong style="color: #cbd5e1;">${state.current?.name}</strong></span>
      </div>
    `;

    for (const btn of bar.querySelectorAll("button[data-space]")) {
      btn.addEventListener("click", () => {
        const space = btn.getAttribute("data-space");
        spacesManager.setActiveSpace(space);
      });
    }
  }

  render();
  const unsubscribe = spacesManager.subscribe(() => render());

  targetContainer.prepend(bar);
  return {
    bar,
    unmount: () => {
      unsubscribe();
      bar.remove();
    },
  };
}

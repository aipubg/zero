/**
 * Session row lifecycle actions.
 *
 * Kept outside the in-place surface observer so that DOM consolidation and
 * session mutation remain separate responsibilities. The host/Gateway stays the
 * authority for what a session is; this module only exposes the existing
 * lifecycle operations through the sidebar row controls.
 */

const PIN_SVG = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;
const PIN_FILLED_SVG = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M16 3a1 1 0 0 1 .1 1.93L15 5.08V9.5l2.4 2.4a1 1 0 0 1 .28.85l-.2 1.4a1 1 0 0 1-.98.85H13v5.5a1 1 0 0 1-2 0V15H7.5a1 1 0 0 1-.98-.85l-.2-1.4a1 1 0 0 1 .28-.85L9 9.5V5.08l-1.1-.15A1 1 0 0 1 8 3h8z"></path></svg>`;
const ARCHIVE_SVG = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path></svg>`;
const DELETE_SVG = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

function isCurrentSession(key) {
  return window.location.pathname.includes(key) || window.location.search.includes(key);
}

function returnToCommand() {
  if (typeof window.location.replace === "function") window.location.replace("/chat/zero");
}

function addButton(actions, className, label, html, onClick) {
  const button = document.createElement("button");
  button.className = `zero-session-action-btn ${className}`;
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = html;
  button.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    await onClick(button);
  });
  actions.appendChild(button);
  return button;
}

/**
 * Build (or return) the lifecycle controls for one sidebar/session row.
 * `item` is the native row element; `key` is its canonical Gateway key.
 */
export function createSessionActions(item, key, host) {
  const actions = document.createElement("span");
  actions.className = "zero-session-actions";

  let isPinned = item.classList.contains("is-pinned") || item.getAttribute("data-pinned") === "true";
  if (isPinned) actions.classList.add("has-pinned");

  const pinBtn = addButton(
    actions,
    "zero-session-pin",
    isPinned ? "Unpin conversation" : "Pin conversation",
    isPinned ? PIN_FILLED_SVG : PIN_SVG,
    async () => {
      isPinned = !isPinned;
      pinBtn.classList.toggle("is-pinned", isPinned);
      actions.classList.toggle("has-pinned", isPinned);
      item.classList.toggle("is-pinned", isPinned);
      item.setAttribute("data-pinned", isPinned ? "true" : "false");
      pinBtn.title = isPinned ? "Unpin conversation" : "Pin conversation";
      pinBtn.setAttribute("aria-label", pinBtn.title);
      pinBtn.innerHTML = isPinned ? PIN_FILLED_SVG : PIN_SVG;
      try {
        if (typeof host?.request === "function") {
          await host.request("sessions.pin", { key, pinned: isPinned });
        }
      } catch (err) {
        console.warn("Failed to pin session:", err);
      }
    },
  );
  pinBtn.classList.toggle("is-pinned", isPinned);

  addButton(actions, "zero-session-archive", "Archive conversation", ARCHIVE_SVG, async () => {
    try {
      if (typeof host?.request === "function") {
        await host.request("sessions.archive", { key });
        await host.request("sessions.patch", { key, archived: true }).catch(() => {});
      }
      item.remove();
      if (isCurrentSession(key)) returnToCommand();
    } catch (err) {
      console.warn("Failed to archive session:", err);
    }
  });

  addButton(actions, "zero-session-delete", "Delete conversation", DELETE_SVG, async () => {
    if (typeof window.confirm === "function" && !window.confirm("Are you sure you want to delete this conversation?")) {
      return;
    }
    try {
      if (typeof host?.request === "function") {
        await host.request("sessions.delete", { key });
      }
      item.remove();
      if (isCurrentSession(key)) returnToCommand();
    } catch (err) {
      console.warn("Failed to delete session:", err);
    }
  });

  return actions;
}

/** Minimal DOM helpers shared by the native Zero pages. */

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (tag.toLowerCase() === "button") {
    node.type = "button";
  }
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}


function setAttribute(node, name, value) {
  if (typeof node?.setAttribute === "function") node.setAttribute(name, value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export { element, setAttribute, escapeHtml };

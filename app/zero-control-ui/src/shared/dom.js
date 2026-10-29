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


export { element, setAttribute };

/**
 * Minimal fake DOM for the native Zero Control UI tests.
 *
 * The plugin renders plain DOM nodes, so a tiny in-memory element tree is
 * enough to mount pages and assert on rendered text, links, and handlers. No
 * browser, framework, or jsdom dependency is involved.
 */

export class FakeText {
  constructor(text) {
    this.text = String(text);
    this.parentNode = null;
  }
  get textContent() {
    return this.text;
  }
}

export class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.parentNode = null;
    this.className = "";
    this.listeners = new Map();
    this.disabled = false;
    this.type = "";
    this.href = "";
    this.value = "";
    this.checked = false;
    this.title = "";
    this.placeholder = "";
    this.style = {};
    this.attributes = {};
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  getAttribute(name) {
    return this.attributes[name] ?? null;
  }
  removeAttribute(name) {
    delete this.attributes[name];
  }
  scrollIntoView() {}
  get classList() {
    const self = this;
    return {
      add(...classes) {
        const set = new Set((self.className || "").split(/\s+/).filter(Boolean));
        for (const c of classes) set.add(c);
        self.className = [...set].join(" ");
      },
      remove(...classes) {
        const set = new Set((self.className || "").split(/\s+/).filter(Boolean));
        for (const c of classes) set.delete(c);
        self.className = [...set].join(" ");
      },
      contains(c) {
        return (self.className || "").split(/\s+/).includes(c);
      },
    };
  }
  querySelectorAll() {
    return [];
  }
  append(...nodes) {
    for (const value of nodes) {
      const node = typeof value === "string" ? new FakeText(value) : value;
      node.parentNode = this;
      this.children.push(node);
    }
  }
  replaceChildren(...nodes) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.append(...nodes);
  }
  addEventListener(type, listener) {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }
  dispatch(type, event = {}) {
    event.target = event.target || this;
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
  focus() {
    this.focused = true;
  }
  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }
  click() {
    this.dispatch("click", { target: this });
  }
  remove() {
    if (this.parentNode) {
      const index = this.parentNode.children.indexOf(this);
      if (index >= 0) this.parentNode.children.splice(index, 1);
    }
    this.parentNode = null;
  }
  get textContent() {
    return this.children.map((child) => child.textContent).join("");
  }
  set textContent(value) {
    this.children = [new FakeText(value)];
  }
}

export function installFakeDocument() {
  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName),
    createTextNode: (text) => new FakeText(text),
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

export function* walk(node) {
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
}

export function findElements(container, predicate) {
  return [...walk(container)].filter(
    (node) => node instanceof FakeElement && predicate(node),
  );
}

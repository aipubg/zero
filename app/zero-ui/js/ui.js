// Small DOM helpers shared by every page.

// Pages build content with conditionals (`cond ? node : null`). Let append and
// replaceChildren skip null/false and flatten arrays, as h() does, instead of
// printing "null".
for (const name of ['append', 'replaceChildren']) {
  const original = Element.prototype[name];
  Element.prototype[name] = function (...children) {
    return original.apply(this, children.flat(Infinity).filter(child => child !== null && child !== undefined && child !== false));
  };
}

/** h('div.card#id', {onclick, ...attrs}, ...children) */
export function h(tag, attrs, ...children) {
  if (attrs === null || typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs)) {
    children.unshift(attrs);
    attrs = {};
  }
  const [name, ...rest] = tag.split(/(?=[.#])/);
  const el = document.createElement(name || 'div');
  for (const part of rest) {
    if (part[0] === '.') el.classList.add(part.slice(1));
    else if (part[0] === '#') el.id = part.slice(1);
  }
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key === 'class') el.className += ' ' + value;
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key === 'html') el.innerHTML = value;
    else if (key in el && typeof value !== 'string') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function icon(name, size = 18) {
  const span = h('span.icon', { 'aria-hidden': 'true' });
  span.innerHTML = ICONS[name] || ICONS.dot;
  span.style.width = span.style.height = size + 'px';
  return span;
}

const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const ICONS = {
  home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  chat: svg('<path d="M4 5h16v11H8l-4 4z"/>'),
  computer: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  terminal: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>'),
  tasks: svg('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  memory: svg('<path d="M12 3a7 7 0 0 0-7 7c0 3 2 4 2 7h10c0-3 2-4 2-7a7 7 0 0 0-7-7z"/><path d="M9 21h6"/>'),
  agents: svg('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 1.5 6 4"/>'),
  skills: svg('<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  model: svg('<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 12l9-5M12 12v10M12 12L3 7"/>'),
  screen: svg('<rect x="2" y="4" width="20" height="13" rx="2"/><circle cx="12" cy="10.5" r="2.5"/><path d="M8 21h8"/>'),
  palette: svg('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>'),
  voice: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  status: svg('<path d="M3 12h4l3-8 4 16 3-8h4"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  send: svg('<path d="M4 12l16-8-6 16-2-7z"/>'),
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  refresh: svg('<path d="M20 11a8 8 0 0 0-14-5l-2 2M4 13a8 8 0 0 0 14 5l2-2"/><path d="M4 4v4h4M20 20v-4h-4"/>'),
  play: svg('<path d="M7 4l13 8-13 8z"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  check: svg('<path d="M5 12l5 5 9-10"/>'),
  speaker: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6"/>'),
  hand: svg('<path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V3.5a1.5 1.5 0 0 1 3 0V10M13 10V5a1.5 1.5 0 0 1 3 0v6M16 9a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-3-5a1.5 1.5 0 0 1 2.5-1.5L7 14"/>'),
  key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>'),
  dot: svg('<circle cx="12" cy="12" r="4"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  spark: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c.6 5.3 4.7 9.4 10 10-5.3.6-9.4 4.7-10 10-.6-5.3-4.7-9.4-10-10 5.3-.6 9.4-4.7 10-10z"/></svg>',
};

export function button(label, onClick, { kind = '', iconName, title, disabled } = {}) {
  return h('button.btn' + (kind ? '.' + kind : ''), { type: 'button', onclick: onClick, title, disabled },
    iconName ? icon(iconName, 16) : null, label ? h('span', label) : null);
}

export function toast(message, kind = 'info') {
  const host = document.getElementById('toasts');
  const el = h('div.toast.' + kind, message);
  host.append(el);
  setTimeout(() => el.classList.add('out'), 4200);
  setTimeout(() => el.remove(), 4700);
}

/** Opens a dialog; body is a node. Returns {close, el}. */
export function modal(title, body, { actions = [], wide = false } = {}) {
  const dialog = h('dialog.modal' + (wide ? '.wide' : ''));
  const close = () => { dialog.close(); dialog.remove(); };
  dialog.append(
    h('header', h('h2', title), h('button.iconbtn', { type: 'button', 'aria-label': 'Close', onclick: close }, icon('close'))),
    h('div.modal-body', body),
    actions.length ? h('footer', actions) : null,
  );
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  document.body.append(dialog);
  dialog.showModal();
  return { close, el: dialog };
}

export function confirmBox(title, text, okLabel = 'Confirm', danger = false) {
  return new Promise(resolve => {
    let done = false;
    const finish = value => { if (!done) { done = true; resolve(value); box.close(); } };
    const box = modal(title, h('p', text), {
      actions: [button('Cancel', () => finish(false)), button(okLabel, () => finish(true), { kind: danger ? 'danger' : 'primary' })],
    });
    box.el.addEventListener('close', () => finish(false));
  });
}

/** Simple form dialog. fields: [{name,label,type,value,options,placeholder,required}] */
export function formBox(title, fields, okLabel = 'Save') {
  return new Promise(resolve => {
    const inputs = {};
    const body = h('form.form', { onsubmit: event => { event.preventDefault(); submit(); } },
      fields.map(field => {
        let input;
        if (field.type === 'select') input = h('select', field.options.map(o => h('option', { value: o.value ?? o, selected: (o.value ?? o) === field.value }, o.label ?? o)));
        else if (field.type === 'textarea') input = h('textarea', { rows: field.rows || 4, placeholder: field.placeholder || '' }, field.value || '');
        else if (field.type === 'checkbox') input = h('input', { type: 'checkbox', checked: Boolean(field.value) });
        else input = h('input', { type: field.type || 'text', value: field.value ?? '', placeholder: field.placeholder || '', autocomplete: 'off' });
        if (field.required) input.required = true;
        inputs[field.name] = input;
        return h('label.field' + (field.type === 'checkbox' ? '.inline' : ''), h('span', field.label), input, field.hint ? h('small', field.hint) : null);
      }),
      h('button', { type: 'submit', hidden: true }),
    );
    let done = false;
    const submit = () => {
      if (!body.reportValidity()) return;
      const values = {};
      for (const [name, input] of Object.entries(inputs)) values[name] = input.type === 'checkbox' ? input.checked : input.value;
      done = true; box.close(); resolve(values);
    };
    const box = modal(title, body, { actions: [button('Cancel', () => box.close()), button(okLabel, submit, { kind: 'primary' })] });
    box.el.addEventListener('close', () => { if (!done) resolve(null); });
    setTimeout(() => body.querySelector('input,textarea,select')?.focus(), 30);
  });
}

export function timeAgo(value) {
  const t = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(t)) return '';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  return new Date(t).toLocaleDateString();
}

export function bytes(n) {
  if (!Number.isFinite(n)) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return n.toFixed(n < 10 && i ? 1 : 0) + ' ' + units[i];
}

/** Safe, small markdown: code blocks, inline code, bold, italics, links, lists, headings. */
export function markdown(text) {
  const blocks = [];
  let src = String(text ?? '').replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(`<pre class="code"><code>${esc(code.replace(/\n$/, ''))}</code></pre>`);
    return `\u0000${blocks.length - 1}\u0000`;
  });
  src = esc(src)
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  const lines = src.split('\n');
  let html = '', list = null;
  for (const line of lines) {
    const bullet = line.match(/^\s*[-*•]\s+(.*)/), num = line.match(/^\s*\d+[.)]\s+(.*)/), head = line.match(/^(#{1,4})\s+(.*)/);
    const kind = bullet ? 'ul' : num ? 'ol' : null;
    if (list && kind !== list) { html += `</${list}>`; list = null; }
    if (kind) { if (!list) { html += `<${kind}>`; list = kind; } html += `<li>${(bullet || num)[1]}</li>`; continue; }
    if (head) { html += `<h${head[1].length + 2}>${head[2]}</h${head[1].length + 2}>`; continue; }
    html += line.trim() ? `<p>${line}</p>` : '';
  }
  if (list) html += `</${list}>`;
  return html.replace(/<p>\u0000(\d+)\u0000<\/p>|\u0000(\d+)\u0000/g, (_, a, b) => blocks[a ?? b]);
}

export function empty(text, iconName = 'dot') {
  return h('div.empty', icon(iconName, 28), h('p', text));
}

export function badge(text, kind = '') {
  return h('span.badge' + (kind ? '.' + kind : ''), text);
}

export function loading(text = 'Loading…') {
  return h('div.loading', h('span.spinner'), text);
}

export function errorBox(error, retry) {
  return h('div.callout.danger', h('strong', 'Something went wrong. '), h('span', error?.message || String(error)),
    retry ? button('Try again', retry, { kind: 'ghost' }) : null);
}

// Connection to the Zero host over WebSocket (JSON-RPC 2.0).
// Reconnects by itself, queues calls while offline and fans out host events.

const listeners = new Map(); // event name -> Set<fn>
const pending = new Map();   // id -> {resolve, reject, timer}
let socket = null;
let nextId = 1;
let ready = null;            // Promise resolved after the handshake
let readyResolve = null;
let retryMs = 800;
let methods = new Set();

export const connection = { state: 'connecting', session: null };

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);
}

function emit(event, payload) {
  for (const fn of listeners.get(event) || []) {
    try { fn(payload); } catch (error) { console.error('[zero-ui] listener failed', event, error); }
  }
  for (const fn of listeners.get('*') || []) {
    try { fn(event, payload); } catch {}
  }
}

function setState(state) {
  connection.state = state;
  emit('connection', state);
}

function resetReady() {
  ready = new Promise(resolve => { readyResolve = resolve; });
}
resetReady();

function rawSend(method, params, timeoutMs) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = timeoutMs ? setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} took too long`));
    }, timeoutMs) : null;
    pending.set(id, { resolve, reject, timer, method });
    socket.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
  });
}

function connect() {
  setState('connecting');
  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/`;
  socket = new WebSocket(url);
  socket.onopen = async () => {
    try {
      const hello = await rawSend('connect', {
        protocol: 4,
        clientId: 'zero-ui',
        deviceLabel: 'Zero UI',
        requestedRole: 'operator',
        requestedScopes: ['operator.admin', 'operator.read', 'operator.write', 'operator.approvals', 'computer.control'],
      }, 10000);
      connection.session = hello.session;
      methods = new Set(hello.methods || []);
      retryMs = 800;
      setState('online');
      readyResolve();
    } catch (error) {
      console.error('[zero-ui] handshake failed', error);
      socket.close();
    }
  };
  socket.onmessage = event => {
    let frame;
    try { frame = JSON.parse(event.data); } catch { return; }
    if (frame.id !== undefined && frame.id !== null && pending.has(frame.id)) {
      const call = pending.get(frame.id);
      pending.delete(frame.id);
      clearTimeout(call.timer);
      if (frame.error) {
        const error = new Error(frame.error.message || 'Request failed');
        error.code = frame.error.code;
        error.data = frame.error.data;
        call.reject(error);
      } else {
        call.resolve(frame.result);
      }
      return;
    }
    if (frame.method) emit(frame.method, frame.params || {});
    else if (frame.type === 'event' && frame.event) emit(frame.event, frame.payload || {});
  };
  socket.onclose = () => {
    for (const [, call] of pending) { clearTimeout(call.timer); call.reject(new Error('Connection to Zero was lost')); }
    pending.clear();
    if (connection.state !== 'offline') setState('offline');
    resetReady();
    setTimeout(connect, retryMs);
    retryMs = Math.min(retryMs * 1.7, 10000);
  };
  socket.onerror = () => {};
}

/** Call a host method. Waits for the connection; rejects with the host's message. */
export async function call(method, params = {}, { timeoutMs = 120000 } = {}) {
  await ready;
  return rawSend(method, params, timeoutMs);
}

/** Run one assistant tool directly (same path the model uses). */
export async function tool(name, args = {}, options) {
  const response = await call('tools.call', { name, arguments: args }, options);
  return response?.result ?? response;
}

export const has = method => methods.has(method);
export const whenReady = () => ready;

connect();

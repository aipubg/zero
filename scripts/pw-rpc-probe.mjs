import WebSocket from '../backend/node_modules/ws/wrapper.mjs';

const WS = 'ws://127.0.0.1:18789/ws';
const methods = [
  ['environments.list', { includeDesktopSetup: true }],
  ['node.list', {}],
  ['backup.status', {}],
  ['cron.list', { agentId: 'zero', includeDisabled: true, compact: true, limit: 50, offset: 0, enabled: 'all', sortBy: 'nextRunAtMs', sortDir: 'asc' }],
  ['cron.status', {}],
  ['usage.summary', {}],
  ['profile.get', {}],
  ['users.self', {}],
  ['gateway.ping', {}],
  ['gateway.activity', {}],
  ['devices.list', {}],
  ['device.pair.list', {}],
  ['approvals.list', {}],
  ['secrets.list', {}],
  ['dashboards.list', {}],
  ['plugins.list', {}],
  ['plugins.catalog.categories', {}],
  ['agents.list', {}],
  ['system-presence', {}],
  ['system.info', { fresh: true }],
];

const ws = new WebSocket(WS);
let id = 0;
const pending = new Map();
function req(method, params = {}) {
  const rid = `p${++id}`;
  return new Promise((resolve, reject) => {
    pending.set(rid, { resolve, reject, method });
    ws.send(JSON.stringify({ type: 'req', id: rid, method, params }));
    setTimeout(() => { if (pending.has(rid)) { pending.delete(rid); reject(new Error('timeout')); } }, 8000);
  });
}
ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.type === 'res' && pending.has(msg.id)) {
    const p = pending.get(msg.id); pending.delete(msg.id);
    p.resolve(msg);
  }
});
ws.on('open', async () => {
  try {
    const hello = await req('connect', {
      minProtocol: 4, maxProtocol: 4,
      client: { id: 'zero-probe', version: '1.0.0', platform: process.platform, mode: 'cli', instanceId: 'probe-' + Date.now() },
      role: 'operator',
      scopes: ['operator.admin', 'operator.read', 'operator.write', 'operator.approvals', 'operator.pairing'],
    });
    console.log('CONNECT', hello.ok, hello.error?.message || '');
    for (const [method, params] of methods) {
      try {
        const res = await req(method, params);
        const text = JSON.stringify(res.payload ?? res.error);
        console.log(`\n### ${method} ok=${res.ok} ${text.slice(0, 1400)}`);
      } catch (e) {
        console.log(`\n### ${method} FAILED ${e.message}`);
      }
    }
  } finally {
    ws.close();
    process.exit(0);
  }
});
ws.on('error', e => { console.error('WS ERROR', e.message); process.exit(1); });

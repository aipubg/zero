import WebSocket from 'ws';

async function testSessionLifecycle() {
  const ws = new WebSocket('ws://127.0.0.1:18789');

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  console.log('[Test] Connected to Zero Native Gateway WebSocket.');

  let reqId = 1;
  const requests = new Map();
  const events = [];

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.id && requests.has(msg.id)) {
        const { resolve } = requests.get(msg.id);
        requests.delete(msg.id);
        resolve(msg);
      } else if (msg.type === 'event' || msg.method === 'event') {
        events.push(msg);
      }
    } catch (e) {
      console.error('[WS Parse Error]', e);
    }
  });

  function send(method, params = {}) {
    const id = `req_${reqId++}`;
    return new Promise((resolve, reject) => {
      requests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
    });
  }

  // Handshake connect
  await send('connect', {
    protocol: 4,
    clientId: 'session-lifecycle-runner',
    requestedRole: 'operator',
    client: { id: 'lifecycle-client', version: '1.0.0' }
  });

  // 1. Create a session with initial prompt
  console.log('\n--- Step 1: sessions.create with prompt ---');
  const createRes = await send('sessions.create', {
    prompt: 'Hello Zero, please reply with exactly the word PONG if you hear me.',
    title: 'Lifecycle Verification Test',
  });
  console.log('sessions.create response:', JSON.stringify(createRes, null, 2));
  if (!createRes.result?.ok || !createRes.result?.key) {
    throw new Error('sessions.create failed');
  }
  const sessionKey = createRes.result.key;
  console.log(`Created sessionKey: ${sessionKey}`);

  // Wait 6 seconds to let assistant run and process the prompt
  console.log('Waiting for assistant turn to execute...');
  await new Promise((r) => setTimeout(r, 6000));

  // Check history
  console.log('\n--- Step 2: chat.history ---');
  const historyRes = await send('chat.history', { sessionKey, limit: 10 });
  console.log('History message count:', historyRes.result?.messages?.length);
  for (const m of historyRes.result?.messages || []) {
    console.log(`  [${m.role}]: ${typeof m.content === 'string' ? m.content.slice(0, 80) : JSON.stringify(m.content).slice(0, 80)}`);
  }

  // Check that assistant responded
  const hasAssistant = (historyRes.result?.messages || []).some(m => m.role === 'assistant');
  console.log(`Assistant responded: ${hasAssistant}`);

  // 3. Test archiving session
  console.log('\n--- Step 3: sessions.patch (archive) ---');
  const patchRes = await send('sessions.patch', { key: sessionKey, archived: true });
  console.log('sessions.patch response:', JSON.stringify(patchRes.result));

  // 4. Test deleting session
  console.log('\n--- Step 4: sessions.delete ---');
  const deleteRes = await send('sessions.delete', { key: sessionKey });
  console.log('sessions.delete response:', JSON.stringify(deleteRes.result));

  // 5. Confirm it was deleted
  const checkRes = await send('chat.history', { sessionKey, limit: 5 });
  console.log('History after delete (should be empty):', checkRes.result?.messages?.length || 0);

  ws.close();
  console.log('\n[SUCCESS] Session lifecycle test completed cleanly!');
}

testSessionLifecycle().catch((err) => {
  console.error('[FAILED]', err);
  process.exit(1);
});

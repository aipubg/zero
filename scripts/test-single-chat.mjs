import WebSocket from 'ws';

async function testSingleChat() {
  console.log('Connecting to Zero Native Gateway on ws://127.0.0.1:18789 ...');
  const ws = new WebSocket('ws://127.0.0.1:18789');

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  let reqId = 1;
  function request(method, params = {}, timeoutMs = 45000) {
    const id = `req_${Date.now()}_${reqId++}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${method}`)), timeoutMs);
      const onMessage = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            clearTimeout(timer);
            ws.off('message', onMessage);
            if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            else resolve(msg.result);
          }
        } catch {}
      };
      ws.on('message', onMessage);
      ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
    });
  }

  // Handshake
  console.log('Performing operator handshake...');
  const connRes = await request('connect', {
    protocol: 4,
    clientId: 'test-runner',
    requestedRole: 'operator',
    client: { id: 'test-client', version: '1.0.0' }
  });
  console.log('Connected role:', connRes.role || 'operator');

  // Verify default model
  const modelsRes = await request('models.list', {});
  console.log('Default model configured:', modelsRes.defaultModel);

  // Create session
  const sessionRes = await request('sessions.create', { title: 'JARVIS Single Chat Test' });
  const sessionKey = sessionRes.sessionKey || sessionRes.key;
  console.log('Created session:', sessionKey);

  // Listen for tool calls and deltas
  const toolCalls = [];
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event === 'chat.tool' || msg.method === 'zero.tool.start') {
        const payload = msg.payload || msg.params;
        toolCalls.push(payload);
        console.log(`\n⚡ [TOOL CALL]:`, JSON.stringify(payload));
      } else if (msg.event === 'chat.delta') {
        process.stdout.write(msg.payload.delta || '');
      } else if (msg.method === 'zero.stream.delta') {
        process.stdout.write(msg.params.delta || '');
      }
    } catch {}
  });

  const prompt = 'Inspect what is currently displayed on my desktop screen using see_screen and tell me what the active window is.';
  console.log(`\nSending prompt: "${prompt}"...`);
  const startTime = Date.now();
  const chatRes = await request('chat.send', {
    sessionKey,
    message: prompt,
  });

  const elapsed = Date.now() - startTime;
  console.log(`\n\n✅ chat.send completed in ${elapsed}ms!`);
  console.log('Response content:\n', chatRes.content || chatRes.text || JSON.stringify(chatRes));
  console.log('Total tool calls dispatched:', toolCalls.length);

  ws.close();
}

testSingleChat().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});

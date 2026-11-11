import WebSocket from 'ws';

async function testBrowserChat() {
  const ws = new WebSocket('ws://127.0.0.1:18789');
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  let reqId = 1;
  function request(method, params = {}, timeoutMs = 60000) {
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

  await request('connect', {
    protocol: 4,
    clientId: 'browser-test-runner',
    requestedRole: 'operator',
    client: { id: 'test-client', version: '1.0.0' }
  });

  const sessionRes = await request('sessions.create', { title: 'JARVIS Browser Navigation Test' });
  const sessionKey = sessionRes.sessionKey || sessionRes.key;

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

  const prompt = "Use your browser control capability to open https://www.google.com and search for 'Open Source AI Agent'.";
  console.log(`\nSending prompt: "${prompt}"...`);
  const startTime = Date.now();
  const chatRes = await request('chat.send', {
    sessionKey,
    message: prompt,
  });

  const elapsed = Date.now() - startTime;
  console.log(`\n\n✅ Browser chat.send completed in ${elapsed}ms!`);
  console.log('Response content:\n', chatRes.content || chatRes.text || JSON.stringify(chatRes));
  console.log('Tool calls count:', toolCalls.length);

  ws.close();
}

testBrowserChat().catch(err => {
  console.error('\n❌ Browser test failed:', err);
  process.exit(1);
});

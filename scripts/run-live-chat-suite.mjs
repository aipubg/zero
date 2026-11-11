import WebSocket from 'ws';

export async function sendChatPrompt(promptText, sessionKey = 'agent:zero:main', timeoutMs = 180000) {
  const ws = new WebSocket('ws://127.0.0.1:18789');

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  const toolCalls = [];
  const deltas = [];
  let chatEvent = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event) {
        if (msg.event === 'chat.tool') {
          toolCalls.push(msg.payload);
          console.log(`  [Tool Call]: ${msg.payload.tool} -> action: ${msg.payload.action}`);
        } else if (msg.event === 'chat.delta') {
          deltas.push(msg.payload.delta);
          process.stdout.write(msg.payload.delta);
        } else if (msg.event === 'chat') {
          chatEvent = msg.payload;
        }
      }
    } catch {}
  });

  let reqId = 1;
  function request(method, params = {}) {
    const id = `req_${Date.now()}_${reqId++}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timeout (${timeoutMs}ms) waiting for ${method}`)), timeoutMs);
      const onMessage = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            clearTimeout(timeout);
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

  // Reference wire client handshake
  await request('connect', {
    protocol: 4,
    clientId: 'test-suite-runner',
    requestedRole: 'operator',
    client: { id: 'web-client', version: '1.0.0' }
  });

  console.log(`\n================================================================`);
  console.log(`PROMPT: "${promptText}"`);
  console.log(`================================================================\n`);

  const startTime = Date.now();
  let result;
  try {
    result = await request('chat.send', {
      sessionKey,
      message: promptText,
    });
  } catch (err) {
    ws.close();
    throw err;
  }

  const durationMs = Date.now() - startTime;
  ws.close();

  console.log(`\n\n----------------------------------------------------------------`);
  console.log(`TURN FINISHED in ${durationMs}ms. Status: ${result?.status || 'ok'}`);
  console.log(`Tool Calls Executed: ${toolCalls.length}`);
  console.log(`----------------------------------------------------------------\n`);

  return {
    promptText,
    durationMs,
    result,
    toolCalls,
    chatEvent,
  };
}

if (process.argv[1] && process.argv[1].endsWith('run-live-chat-suite.mjs')) {
  const prompt = process.argv[2] || 'List all open windows on my desktop';
  sendChatPrompt(prompt)
    .then((r) => {
      console.log('Final Assistant Reply:\n', r.result?.content);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test Failed:', err);
      process.exit(1);
    });
}

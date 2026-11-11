import WebSocket from 'ws';
import http from 'node:http';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks)
      }));
    }).on('error', reject);
  });
}

async function sendSingleChatPrompt(promptText, timeoutMs = 180000) {
  const ws = new WebSocket('ws://127.0.0.1:18789');

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  const toolCalls = [];
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

  // Connect handshake
  await request('connect', {
    protocol: 4,
    clientId: 'jarvis-autonomy-runner',
    requestedRole: 'operator',
    client: { id: 'jarvis-client', version: '1.0.0' }
  });

  // Create clean session
  const sessRes = await request('sessions.create', {
    title: `Jarvis Autonomy: ${promptText.slice(0, 30)}...`
  });
  const sessionKey = sessRes.sessionKey || sessRes.key;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event === 'chat.tool' || (msg.method === 'zero.tool.start' && msg.params)) {
        const payload = msg.payload || msg.params;
        toolCalls.push(payload);
        console.log(`    ⚡ [Tool Called]: ${payload.tool} (action: ${payload.action || 'default'})`);
      }
    } catch {}
  });

  const finalResult = await request('chat.send', {
    sessionKey,
    message: promptText,
  });

  ws.close();
  return {
    sessionKey,
    tools: toolCalls,
    reply: typeof finalResult?.content === 'string'
      ? finalResult.content
      : (Array.isArray(finalResult?.content) ? (finalResult.content[0]?.text || '') : JSON.stringify(finalResult)),
  };
}

async function runAutonomyTests() {
  console.log('========================================================================');
  console.log('       ZERO FULL AUTONOMOUS JARVIS SUITE - VERIFICATION');
  console.log('========================================================================\n');

  // Test 1: Desktop Seeing & Live Screen Capture HTTP endpoint
  console.log('[TEST 1/5]: Live Desktop Seeing Endpoint (HTTP /desktop/screenshot)');
  const res = await httpGet('http://127.0.0.1:18789/desktop/screenshot');
  console.log(`  HTTP Status: ${res.statusCode}`);
  console.log(`  Content-Type: ${res.headers['content-type']}`);
  console.log(`  Bytes Received: ${res.body.length}`);
  if (res.statusCode !== 200 || !res.headers['content-type']?.includes('image') || res.body.length < 1000) {
    throw new Error('Desktop screenshot endpoint failed');
  }
  console.log('  >> Result: ✅ PASSED\n');

  // Test 2: Live Screen Stream WebSocket endpoint
  console.log('[TEST 2/5]: Live Screen Stream WebSocket (/desktop/stream)');
  const streamWs = new WebSocket('ws://127.0.0.1:18789/desktop/stream');
  const streamFrame = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Timeout waiting for stream frame')), 10000);
    streamWs.on('message', (d) => {
      try {
        const parsed = JSON.parse(d.toString());
        if (parsed.type === 'desktop.frame') {
          clearTimeout(t);
          streamWs.close();
          resolve(parsed);
        }
      } catch {}
    });
    streamWs.on('error', (e) => { clearTimeout(t); reject(e); });
  });
  console.log(`  Received frame type: ${streamFrame.type}`);
  console.log(`  Active window: ${streamFrame.windowTitle}`);
  console.log(`  Image payload length: ${streamFrame.image?.length}`);
  console.log('  >> Result: ✅ PASSED\n');

  // Test 3: Autonomous Real-Time Perception via Chat (see_screen)
  console.log('[TEST 3/5]: Screen Perception via Chat (see_screen)');
  const test3 = await sendSingleChatPrompt("Use see_screen to inspect what is on my screen right now and tell me the active window and screen dimensions.");
  console.log(`  Tools called: ${test3.tools.map(t => `${t.tool}:${t.action}`).join(', ')}`);
  console.log(`  Reply excerpt: ${test3.reply.slice(0, 160).replace(/\n/g, ' ')}...`);
  if (!test3.tools.some(t => t.tool === 'see_screen')) {
    throw new Error('Test 3 did not call see_screen');
  }
  console.log('  >> Result: ✅ PASSED\n');

  // Test 4: Autonomous Browser Form Filling & Navigation
  console.log('[TEST 4/5]: Autonomous Browser Navigation & Form Filling');
  const test4 = await sendSingleChatPrompt("Open Chrome, navigate to https://www.google.com, and search for 'OpenAI agents vs Anthropic computer use'.");
  console.log(`  Tools called: ${test4.tools.map(t => `${t.tool}:${t.action}`).join(', ')}`);
  console.log(`  Reply excerpt: ${test4.reply.slice(0, 160).replace(/\n/g, ' ')}...`);
  if (!test4.tools.some(t => t.tool === 'browser' || t.tool === 'open_app')) {
    throw new Error('Test 4 did not call browser or open_app');
  }
  console.log('  >> Result: ✅ PASSED\n');

  // Test 5: Autonomous Spotify Song Playback
  console.log('[TEST 5/5]: Autonomous Spotify Song Playback (Single Command)');
  const test5 = await sendSingleChatPrompt("Play 'Kesariya' on Spotify at 35% volume.");
  console.log(`  Tools called: ${test5.tools.map(t => `${t.tool}:${t.action}`).join(', ')}`);
  console.log(`  Reply excerpt: ${test5.reply.slice(0, 160).replace(/\n/g, ' ')}...`);
  if (!test5.tools.some(t => t.tool === 'spotify_control' || t.tool === 'open_app')) {
    throw new Error('Test 5 did not call spotify_control');
  }
  console.log('  >> Result: ✅ PASSED\n');

  console.log('========================================================================');
  console.log('                  ALL 5 JARVIS AUTONOMY TESTS PASSED!                   ');
  console.log('========================================================================');
}

runAutonomyTests().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});

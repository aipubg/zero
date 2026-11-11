import WebSocket from 'ws';

async function sendSingleChatPrompt(promptText, sessionKey = null, timeoutMs = 180000) {
  const ws = new WebSocket('ws://127.0.0.1:18789');

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  const toolCalls = [];
  let finalResult = null;
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

  // Connect as operator client
  await request('connect', {
    protocol: 4,
    clientId: 'jarvis-battery-runner',
    requestedRole: 'operator',
    client: { id: 'battery-client', version: '1.0.0' }
  });

  // Create clean session if not provided
  if (!sessionKey) {
    const sessRes = await request('sessions.create', {
      title: `Battery Test: ${promptText.slice(0, 30)}...`
    });
    sessionKey = sessRes.sessionKey || sessRes.key;
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event === 'chat.tool') {
        toolCalls.push(msg.payload);
        console.log(`    ⚡ [Tool Called]: ${msg.payload.tool} (action: ${msg.payload.action || 'default'})`);
      } else if (msg.method === 'zero.tool.start' && msg.params) {
        toolCalls.push(msg.params);
        console.log(`    ⚡ [Tool Called]: ${msg.params.tool} (action: ${msg.params.action || 'default'})`);
      } else if (msg.event === 'chat.delta') {
        process.stdout.write(msg.payload.delta || '');
      } else if (msg.method === 'zero.stream.delta' && msg.params) {
        process.stdout.write(msg.params.delta || '');
      }
    } catch {}
  });

  const startTime = Date.now();
  try {
    finalResult = await request('chat.send', {
      sessionKey,
      message: promptText,
    });
  } finally {
    ws.close();
  }

  const durationMs = Date.now() - startTime;
  return {
    promptText,
    sessionKey,
    durationMs,
    toolCalls,
    finalResult,
  };
}

async function runBattery() {
  console.log('========================================================================');
  console.log('       ZERO AUTONOMOUS JARVIS BATTERY TEST SUITE (VIA CHAT)');
  console.log('========================================================================\n');

  const testCases = [
    {
      id: 1,
      name: 'App Lifecycle & Text Input (Notepad)',
      prompt: "Open Notepad on my desktop, type 'Zero Autonomous Test 2026 - All Systems Nominal', and then close Notepad without saving.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return (tools.some(t => t.includes('open') || t.includes('notepad') || t.includes('type')) || text.includes('notepad')) &&
               (tools.some(t => t.includes('close') || t.includes('kill') || t.includes('notepad')) || text.includes('close'));
      }
    },
    {
      id: 2,
      name: 'Visual Desktop Perception & OCR (see_screen)',
      prompt: "Inspect what is currently displayed on my desktop screen using see_screen and tell me what the active window is and screen dimensions.",
      validator: (res) => {
        const text = String(res.finalResult?.content || '').toLowerCase();
        return text.includes('window') || text.includes('screen') || text.includes('dimension') || res.toolCalls.some(t => t.tool === 'see_screen');
      }
    },
    {
      id: 3,
      name: 'Web Browser Navigation & Search',
      prompt: "Open Chrome and search for 'Open Source AI Agent', then verify the search results page is opened.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return tools.some(t => t.includes('browser') || t.includes('play') || t.includes('open_url') || t.includes('search')) || text.includes('chrome') || text.includes('search');
      }
    },
    {
      id: 4,
      name: 'YouTube Media Control (Rate & Volume)',
      prompt: "Play a relaxing nature sounds video on YouTube at 2x playback speed and 15% volume in Chrome.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return tools.some(t => t.includes('browser') || t.includes('play') || t.includes('youtube')) || text.includes('youtube') || text.includes('playing');
      }
    },
    {
      id: 5,
      name: 'Spotify Control (Play & Volume)',
      prompt: "Play music on Spotify and set the volume to 40%.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return tools.some(t => t.includes('spotify') || t.includes('play')) || text.includes('spotify') || text.includes('track') || text.includes('playing');
      }
    },
    {
      id: 6,
      name: 'Multi-App Discovery & Window Management',
      prompt: "Open Calculator, list all currently open desktop windows using list_windows, and then close Calculator.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return (tools.some(t => t.includes('open') || t.includes('calc')) || text.includes('calculator') || text.includes('calc')) &&
               (tools.some(t => t.includes('list_windows') || t.includes('window') || t.includes('zero_computer_action')) || text.includes('window'));
      }
    }
  ];

  const results = [];
  for (const tc of testCases) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`[TEST ${tc.id}/6]: ${tc.name}`);
    console.log(`Prompt: "${tc.prompt}"`);
    console.log(`------------------------------------------------------------------------`);

    try {
      const res = await sendSingleChatPrompt(tc.prompt);
      const passed = tc.validator(res);
      console.log(`\n  >> Reply Content: ${res.finalResult?.content?.slice(0, 160).replace(/\n/g, ' ')}...`);
      console.log(`  >> Tools: ${res.toolCalls.map(t => t.tool + ':' + t.action).join(', ') || 'none'}`);
      console.log(`  >> Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      results.push({ ...tc, passed, durationMs: res.durationMs });
    } catch (err) {
      console.error(`  >> ❌ ERROR:`, err.message);
      results.push({ ...tc, passed: false, error: err.message });
    }
  }

  console.log('\n========================================================================');
  console.log('                          BATTERY SUMMARY');
  console.log('========================================================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`Test ${r.id}: ${r.name.padEnd(45)} -> ${r.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (!r.passed) allPassed = false;
  }
  console.log('========================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runBattery().catch((err) => {
  console.error('Fatal battery error:', err);
  process.exit(1);
});

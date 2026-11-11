import WebSocket from 'ws';

async function sendChatPrompt(promptText, timeoutMs = 120000) {
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
      const timer = setTimeout(() => reject(new Error(`Timeout (${timeoutMs}ms) waiting for ${method}`)), timeoutMs);
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

  // Connect as operator client
  await request('connect', {
    protocol: 4,
    clientId: 'stress-tester',
    requestedRole: 'operator',
    client: { id: 'stress-client', version: '1.0.0' }
  });

  // Create clean session
  const sessionRes = await request('sessions.create', {
    title: `Stress Test: ${promptText.slice(0, 30)}...`
  });
  const sessionKey = sessionRes.sessionKey || sessionRes.key;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event === 'chat.tool' && msg.payload) {
        toolCalls.push(msg.payload);
        console.log(`    ⚡ [Tool Called]: ${msg.payload.tool} (action: ${msg.payload.action || 'default'}, args: ${JSON.stringify(msg.payload.args || {})})`);
      } else if (msg.method === 'zero.tool.start' && msg.params) {
        toolCalls.push(msg.params);
        console.log(`    ⚡ [Tool Called]: ${msg.params.tool} (action: ${msg.params.action || 'default'}, args: ${JSON.stringify(msg.params.args || {})})`);
      } else if (msg.event === 'chat.delta') {
        process.stdout.write(msg.payload.delta || '');
      } else if (msg.method === 'zero.stream.delta') {
        process.stdout.write(msg.params.delta || '');
      }
    } catch {}
  });

  const startTime = Date.now();
  let finalResult;
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

async function runStressSuite() {
  console.log('========================================================================');
  console.log('     ZERO EXTENSIVE MULTI-DOMAIN AUTONOMOUS STRESS BATTERY (CHAT)');
  console.log('========================================================================\n');

  const testCases = [
    {
      id: 1,
      name: 'Web Form Filling Live (Online Form)',
      prompt: "Use your browser control to fill out a registration form at 'https://example.com/register' with username='john_doe_99', email='john@example.com', and full_name='John Doe'.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return (tools.some(t => t.includes('fill_form') || t.includes('browser') || t.includes('type')) || text.includes('form') || text.includes('filled')) &&
               (text.includes('john') || text.includes('example.com') || text.includes('success'));
      }
    },
    {
      id: 2,
      name: 'Software Lifecycle - MS Paint (mspaint)',
      prompt: "Launch Paint (mspaint) on my computer, inspect what is on my desktop screen using see_screen, and then close Paint.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return (tools.some(t => t.includes('paint') || t.includes('open') || t.includes('launch')) || text.includes('paint')) &&
               (tools.some(t => t.includes('see_screen') || t.includes('close') || t.includes('kill')) || text.includes('screen') || text.includes('closed'));
      }
    },
    {
      id: 3,
      name: 'Interactive App Work - Windows Calculator',
      prompt: "Open Calculator, type '98765' into it, and then close Calculator.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return (tools.some(t => t.includes('calc') || t.includes('open') || t.includes('type')) || text.includes('calculator') || text.includes('calc')) &&
               (tools.some(t => t.includes('close') || t.includes('kill')) || text.includes('closed'));
      }
    },
    {
      id: 4,
      name: 'Interactive Note Creation - Notepad Lifecycle',
      prompt: "Open Notepad, type 'System Verification PASSED: Full Autonomous Control Verified', and close Notepad without saving.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return (tools.some(t => t.includes('notepad') || t.includes('open') || t.includes('type')) || text.includes('notepad')) &&
               (tools.some(t => t.includes('close') || t.includes('kill')) || text.includes('closed'));
      }
    },
    {
      id: 5,
      name: 'Screen Share Reading & Window Inventory (see_screen)',
      prompt: "Read my screen right now using see_screen. Tell me the active window, screen resolution, and what UI elements or windows are currently visible.",
      validator: (res) => {
        const text = String(res.finalResult?.content || '').toLowerCase();
        return text.includes('window') || text.includes('screen') || text.includes('resolution') || text.includes('dimension') || res.toolCalls.some(t => t.tool === 'see_screen');
      }
    },
    {
      id: 6,
      name: 'Browser Search & Web Scraping (get_content)',
      prompt: "Open Google in Chrome, search for 'DeepSeek AI Agent', and extract the content of the search results page.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return (tools.some(t => t.includes('search') || t.includes('browser') || t.includes('open_url')) || text.includes('deepseek') || text.includes('search')) &&
               (tools.some(t => t.includes('get_content') || t.includes('scrape') || t.includes('browser')) || text.includes('result'));
      }
    },
    {
      id: 7,
      name: 'Autonomous Spotify Song Playback',
      prompt: "Play 'Shape of You by Ed Sheeran' on Spotify right now.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return tools.some(t => t.includes('spotify') || t.includes('play')) || text.includes('spotify') || text.includes('playing') || text.includes('shape of you');
      }
    },
    {
      id: 8,
      name: 'YouTube Media Player Control (Speed & Volume)',
      prompt: "Play a classical piano music video on YouTube in the browser at 1.5x speed and 20% volume.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return tools.some(t => t.includes('browser') || t.includes('play') || t.includes('youtube')) || text.includes('youtube') || text.includes('piano') || text.includes('playing');
      }
    },
    {
      id: 9,
      name: 'Web Account Login Automation',
      prompt: "Navigate to 'https://example.com/signin' in the browser and log in with username 'super_agent' and password 'SecretPass123'.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return tools.some(t => t.includes('login') || t.includes('fill_form') || t.includes('browser')) || text.includes('logged') || text.includes('super_agent') || text.includes('login');
      }
    },
    {
      id: 10,
      name: 'Multi-App Parallel Discovery & Cleanup',
      prompt: "List all open desktop windows using list_windows, launch Command Prompt (cmd), and close Command Prompt.",
      validator: (res) => {
        const tools = res.toolCalls.map(t => (t.action || t.tool || '').toLowerCase());
        const text = String(res.finalResult?.content || '').toLowerCase();
        return (tools.some(t => t.includes('list_windows') || t.includes('window')) || text.includes('window')) &&
               (tools.some(t => t.includes('open') || t.includes('cmd') || t.includes('launch')) || text.includes('cmd') || text.includes('command')) &&
               (tools.some(t => t.includes('close') || t.includes('kill')) || text.includes('closed'));
      }
    }
  ];

  const results = [];
  for (const tc of testCases) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`[TEST ${tc.id}/10]: ${tc.name}`);
    console.log(`Prompt: "${tc.prompt}"`);
    console.log(`------------------------------------------------------------------------`);

    try {
      const res = await sendChatPrompt(tc.prompt);
      const passed = tc.validator(res);
      console.log(`\n  >> Reply: ${res.finalResult?.content?.slice(0, 160).replace(/\n/g, ' ')}...`);
      console.log(`  >> Tools: ${res.toolCalls.map(t => t.tool + ':' + (t.action || 'call')).join(', ') || 'none'}`);
      console.log(`  >> Duration: ${(res.durationMs / 1000).toFixed(1)}s`);
      console.log(`  >> Verdict: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      results.push({ ...tc, passed, durationMs: res.durationMs });
    } catch (err) {
      console.error(`  >> ❌ ERROR:`, err.message);
      results.push({ ...tc, passed: false, error: err.message });
    }
  }

  console.log('\n========================================================================');
  console.log('                   COMPREHENSIVE STRESS SUMMARY');
  console.log('========================================================================');
  let passCount = 0;
  for (const r of results) {
    console.log(`Test ${String(r.id).padStart(2, '0')}: ${r.name.padEnd(48)} -> ${r.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (r.passed) passCount++;
  }
  console.log(`\nTOTAL PASSED: ${passCount} / ${results.length} (${Math.round((passCount / results.length) * 100)}%)`);
  console.log('========================================================================\n');

  if (passCount !== results.length) {
    process.exit(1);
  }
}

runStressSuite().catch((err) => {
  console.error('Fatal stress suite error:', err);
  process.exit(1);
});

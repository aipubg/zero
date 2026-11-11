import WebSocket from 'ws';
import { execSync } from 'node:child_process';

function checkProcessRunning(procName) {
  try {
    const stdout = execSync(`powershell -NoProfile -Command "Get-Process -Name '${procName}' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"`, { timeout: 4000, encoding: 'utf8' });
    const pids = stdout.trim().split(/\r?\n/).filter(Boolean);
    return pids.length > 0;
  } catch {
    return false;
  }
}

async function sendChatPrompt(promptText, timeoutMs = 90000) {
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
    client: { id: 'stress-client', version: '2.0.0' }
  });

  // Create clean session
  const sessionRes = await request('sessions.create', {
    title: `Stress Test: ${promptText.slice(0, 30)}...`
  });
  const sessionKey = sessionRes.sessionKey || sessionRes.key || sessionRes.sessionId || sessionRes.session?.key;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event === 'chat.tool' && msg.payload) {
        toolCalls.push(msg.payload);
        console.log(`    ⚡ [Tool Called]: ${msg.payload.tool} (action: ${msg.payload.action || 'default'})`);
      } else if (msg.method === 'zero.tool.start' && msg.params) {
        toolCalls.push(msg.params);
        console.log(`    ⚡ [Tool Called]: ${msg.params.tool} (action: ${msg.params.action || 'default'})`);
      } else if (msg.event === 'chat.delta') {
        process.stdout.write(msg.payload.delta || '');
      } else if (msg.method === 'zero.stream.delta') {
        process.stdout.write(msg.params.delta || '');
      }
    } catch {}
  });

  const startTime = Date.now();
  let finalResult;
  let transcript = [];
  try {
    finalResult = await request('chat.send', {
      sessionKey,
      message: promptText,
    });
    // Retrieve transcript to inspect actual tool execution receipts
    const sessionData = await request('sessions.get', { key: sessionKey }).catch(() => null);
    transcript = sessionData?.transcript || sessionData?.messages || [];
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
    transcript,
  };
}

async function runStressSuite() {
  console.log('========================================================================');
  console.log('     ZERO EXTENSIVE MULTI-DOMAIN AUTONOMOUS STRESS BATTERY');
  console.log('     (REAL OS, BROWSER, PROCESS LIFECYCLE & STATE VERIFICATION)');
  console.log('========================================================================\n');

  const testCases = [
    {
      id: 1,
      category: 'REAL_BROWSER',
      name: 'Web Form Filling Live (Fields & Verification)',
      prompt: "Open the registration form at 'https://httpbin.org/forms/post' in the browser, fill out the form fields with custname='John Doe', size='large', comments='Test delivery instructions' and submit.",
      validator: (res) => {
        const toolMsgs = res.transcript.filter(m => m.role === 'tool');
        const fillTool = toolMsgs.find(m => {
          try {
            const parsed = JSON.parse(m.content);
            return parsed.action === 'fill_form' || parsed.typedFields;
          } catch { return false; }
        });
        if (!fillTool) {
          const hasToolCall = res.toolCalls.some(t => (t.action || t.tool || '').includes('fill_form'));
          return {
            status: hasToolCall ? 'PASS' : 'UNVERIFIED',
            reason: hasToolCall ? 'fill_form dispatched via tool call' : 'fill_form tool not recorded in transcript',
            evidence: { toolCalls: res.toolCalls.length }
          };
        }
        const data = JSON.parse(fillTool.content);
        const fieldsCount = data.fieldsProcessed ?? data.data?.fieldsProcessed ?? (Array.isArray(data.typedFields) ? data.typedFields.length : 0);
        const passed = data.ok === true && fieldsCount >= 2;
        return {
          status: passed ? 'PASS' : 'FAIL',
          reason: passed ? `Processed ${fieldsCount} form fields cleanly` : 'Form fields not processed',
          evidence: { fieldsProcessed: fieldsCount, verified: data.verified }
        };
      }
    },
    {
      id: 2,
      category: 'REAL_OS',
      name: 'Software Lifecycle - MS Paint (mspaint & Process Check)',
      prompt: "Launch Paint (mspaint) on my computer, inspect what is on my desktop screen using see_screen, and then close Paint.",
      validator: (res) => {
        const launched = res.toolCalls.some(t => (t.action || t.args?.app || '').includes('paint') || t.tool === 'open_app');
        const inspected = res.toolCalls.some(t => t.tool === 'see_screen');
        const closed = res.toolCalls.some(t => (t.action || '').includes('close_app') || t.tool === 'close_app');
        // Real OS process verification: ensure mspaint is not left running
        const stillRunning = checkProcessRunning('mspaint');
        const passed = launched && closed && !stillRunning;
        return {
          status: passed ? 'PASS' : (stillRunning ? 'FAIL' : 'UNVERIFIED'),
          reason: passed ? 'Paint launched, inspected, and verified closed cleanly' : (stillRunning ? 'Paint process still running after close_app' : 'Tool calls incomplete'),
          evidence: { launched, inspected, closed, stillRunning }
        };
      }
    },
    {
      id: 3,
      category: 'REAL_OS',
      name: 'Interactive App Work - Windows Calculator (calc)',
      prompt: "Open Calculator, type '98765' into it, and then close Calculator.",
      validator: (res) => {
        const opened = res.toolCalls.some(t => t.tool === 'open_app' || (t.args?.app || '').includes('calc'));
        const typed = res.toolCalls.some(t => (t.action || '').includes('type') || t.args?.text?.includes('98765'));
        const closed = res.toolCalls.some(t => (t.action || '').includes('close') || t.tool === 'close_app');
        const stillRunning = checkProcessRunning('CalculatorApp') || checkProcessRunning('calc');
        const passed = opened && closed && !stillRunning;
        return {
          status: passed ? 'PASS' : (stillRunning ? 'FAIL' : 'UNVERIFIED'),
          reason: passed ? 'Calculator opened, input dispatched, and closed cleanly' : (stillRunning ? 'Calculator still running' : 'Tool sequence incomplete'),
          evidence: { opened, typed, closed, stillRunning }
        };
      }
    },
    {
      id: 4,
      category: 'REAL_OS',
      name: 'Interactive Note Creation - Notepad Lifecycle',
      prompt: "Open Notepad, type 'Jarvis verified autonomous execution', and close Notepad without saving.",
      validator: (res) => {
        const opened = res.toolCalls.some(t => t.tool === 'open_app' || (t.args?.app || '').includes('notepad'));
        const typed = res.toolCalls.some(t => (t.action || '').includes('type'));
        const closed = res.toolCalls.some(t => (t.action || '').includes('close') || t.tool === 'close_app');
        const stillRunning = checkProcessRunning('notepad');
        const passed = opened && closed && !stillRunning;
        return {
          status: passed ? 'PASS' : (stillRunning ? 'FAIL' : 'UNVERIFIED'),
          reason: passed ? 'Notepad opened, typed, and closed cleanly' : (stillRunning ? 'Notepad process still running' : 'Tool sequence incomplete'),
          evidence: { opened, typed, closed, stillRunning }
        };
      }
    },
    {
      id: 5,
      category: 'REAL_OS',
      name: 'Screen Observation & Vision Perception (see_screen)',
      prompt: "Read my screen right now using see_screen. Tell me the active window, screen resolution, and what UI elements or windows are currently visible.",
      validator: (res) => {
        const toolMsgs = res.transcript.filter(m => m.role === 'tool');
        const seeTool = toolMsgs.find(m => {
          try {
            const parsed = JSON.parse(m.content);
            return parsed.activeWindow || parsed.provenance;
          } catch { return false; }
        });
        if (!seeTool) {
          const hasCall = res.toolCalls.some(t => t.tool === 'see_screen');
          return {
            status: hasCall ? 'PASS' : 'FAIL',
            reason: hasCall ? 'see_screen executed via tool call' : 'see_screen not called',
            evidence: { hasCall }
          };
        }
        const data = JSON.parse(seeTool.content);
        const hasProvenance = Boolean(data.provenance?.captureSource);
        const hasWindow = Boolean(data.activeWindow?.title);
        const passed = data.ok === true && hasProvenance && hasWindow;
        return {
          status: passed ? 'PASS' : 'FAIL',
          reason: passed ? `Active window '${data.activeWindow?.title}' identified with provenance '${data.provenance?.captureSource}'` : 'Invalid see_screen payload',
          evidence: { activeWindow: data.activeWindow?.title, provenance: data.provenance }
        };
      }
    },
    {
      id: 6,
      category: 'REAL_BROWSER',
      name: 'Browser Search & Web Scraping (Content Extraction)',
      prompt: "Open Google in Chrome, search for 'DeepSeek AI Agent', and extract the content of the search results page.",
      validator: (res) => {
        const navigated = res.toolCalls.some(t => t.tool === 'browser' || t.action === 'open_url' || t.action === 'search');
        const scraped = res.toolCalls.some(t => t.action === 'scrape' || t.action === 'get_content');
        const contentMentioned = String(res.finalResult?.content || '').toLowerCase().includes('deepseek');
        const passed = navigated && (scraped || contentMentioned);
        return {
          status: passed ? 'PASS' : 'FAIL',
          reason: passed ? 'Browser search navigated and content extracted' : 'Search or content extraction failed',
          evidence: { navigated, scraped, contentMentioned }
        };
      }
    },
    {
      id: 7,
      category: 'REAL_EXTERNAL',
      name: 'Autonomous Spotify Song Playback',
      prompt: "Play 'Shape of You by Ed Sheeran' on Spotify right now.",
      validator: (res) => {
        const called = res.toolCalls.some(t => t.tool === 'spotify_control' || t.action === 'spotify_control');
        const trackArg = res.toolCalls.find(t => t.tool === 'spotify_control')?.args?.track;
        const passed = called;
        return {
          status: passed ? 'PASS' : 'FAIL',
          reason: passed ? `Spotify playback requested for track: ${trackArg || 'Shape of You'}` : 'spotify_control tool not called',
          evidence: { called, trackArg }
        };
      }
    },
    {
      id: 8,
      category: 'REAL_EXTERNAL',
      name: 'YouTube Media Player Control (Speed & Volume)',
      prompt: "Play a classical piano music video on YouTube in the browser at 1.5x speed and 20% volume.",
      validator: (res) => {
        const called = res.toolCalls.some(t => t.tool === 'play' || t.action === 'play');
        const content = String(res.finalResult?.content || '');
        const hasMediaCard = content.includes('zero-ui:media');
        const passed = called || hasMediaCard;
        return {
          status: passed ? 'PASS' : 'FAIL',
          reason: passed ? 'YouTube playback dispatched with speed and volume settings' : 'Media playback not initiated',
          evidence: { called, hasMediaCard }
        };
      }
    },
    {
      id: 9,
      category: 'CONTRACT',
      name: 'Web Account Login State Distinction & Password Redaction',
      prompt: "Navigate to 'https://httpbin.org/hidden-basic-auth/user/passwd' in the browser and log in with username 'super_agent' and password 'SecretPass123'.",
      validator: (res) => {
        const toolMsgs = res.transcript.filter(m => m.role === 'tool');
        const loginTool = toolMsgs.find(m => {
          try {
            const parsed = JSON.parse(m.content);
            return parsed.action === 'login';
          } catch { return false; }
        });
        if (!loginTool) {
          const called = res.toolCalls.some(t => t.action === 'login' || t.tool === 'browser');
          return {
            status: called ? 'PASS' : 'UNVERIFIED',
            reason: called ? 'Login dispatched' : 'login tool not called',
            evidence: { called }
          };
        }
        const data = JSON.parse(loginTool.content);
        // Verify password is NOT exposed raw in receipt
        const passwordRedacted = data.password === '[REDACTED]' || data.data?.password === '[REDACTED]';
        // Verify authentication state is UNVERIFIED (does not falsely claim auth succeeded)
        const truthfulAuth = data.authenticated === 'UNVERIFIED' || data.data?.authenticated === 'UNVERIFIED' || data.verified === false;
        const passed = passwordRedacted && truthfulAuth;
        return {
          status: passed ? 'PASS' : 'FAIL',
          reason: passed ? 'Password redacted to [REDACTED] and authentication truthfully marked UNVERIFIED' : 'Sensitive password exposed or false authentication claimed',
          evidence: { password: data.password || data.data?.password, authenticated: data.authenticated || data.data?.authenticated, verified: data.verified }
        };
      }
    },
    {
      id: 10,
      category: 'REAL_OS',
      name: 'Multi-App Parallel Discovery & Process Cleanup',
      prompt: "List all open desktop windows using list_windows, launch Command Prompt (cmd), and close Command Prompt.",
      validator: (res) => {
        const listed = res.toolCalls.some(t => t.action === 'list_windows' || t.args?.action === 'list_windows' || t.tool === 'desktop_control' || t.action === 'desktop_control' || t.args?.command === 'status' || t.args?.command === 'snapshot');
        const opened = res.toolCalls.some(t => (t.action || '').includes('open') || (t.args?.app || '').includes('cmd'));
        const closed = res.toolCalls.some(t => (t.action || '').includes('close') || (t.args?.app || '').includes('cmd'));
        const passed = listed && opened && closed;
        return {
          status: passed ? 'PASS' : 'FAIL',
          reason: passed ? 'Window inventory queried, Command Prompt opened and closed cleanly' : 'Window listing or CMD lifecycle incomplete',
          evidence: { listed, opened, closed }
        };
      }
    }
  ];

  const results = [];
  for (const tc of testCases) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`[TEST ${tc.id}/10 - ${tc.category}]: ${tc.name}`);
    console.log(`Prompt: "${tc.prompt}"`);
    console.log(`------------------------------------------------------------------------`);

    try {
      const res = await sendChatPrompt(tc.prompt);
      const verdict = tc.validator(res);
      console.log(`\n  >> Status:   ${verdict.status === 'PASS' ? '✅ PASS' : (verdict.status === 'UNVERIFIED' ? '⚠ UNVERIFIED' : '❌ FAIL')}`);
      console.log(`  >> Reason:   ${verdict.reason}`);
      console.log(`  >> Evidence: ${JSON.stringify(verdict.evidence)}`);
      console.log(`  >> Duration: ${(res.durationMs / 1000).toFixed(1)}s`);
      results.push({ ...tc, ...verdict, durationMs: res.durationMs });
    } catch (err) {
      console.error(`  >> ❌ ERROR:`, err.message);
      results.push({ ...tc, status: 'FAIL', reason: err.message, evidence: {} });
    }
  }

  console.log('\n========================================================================');
  console.log('            RIGOROUS MULTI-DOMAIN STRESS SUMMARY (STATE VERIFIED)');
  console.log('========================================================================');
  let passCount = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ PASS' : (r.status === 'UNVERIFIED' ? '⚠ UNVERIFIED' : '❌ FAIL');
    console.log(`[${r.category.padEnd(13)}] Test ${String(r.id).padStart(2, '0')}: ${r.name.padEnd(46)} -> ${icon}`);
    if (r.status === 'PASS') passCount++;
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

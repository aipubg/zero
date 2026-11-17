// Safety rule: in an assistant turn, keyboard input is only sent to a window
// that was named, or one Zero opened or focused in the same request. It is
// never sent to whatever window happens to be in front.
//
// The model here is a local fixture. The keys it asks for are harmless on
// purpose, in case this rule is ever removed and the test then really types.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

test('[SAFETY] keyboard input without a destination window is refused', { timeout: 60000 }, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-keyboard-rule-'));
  const calls = [
    { name: 'zero_computer_action', args: { action: 'type_text', text: '.' } },
    { name: 'zero_computer_action', args: { action: 'hotkey', key: 'right' } },
    { name: 'zero_computer_action', args: { action: 'focus_window' } },
  ];
  const toolResults = [];
  let step = 0;
  const upstream = http.createServer(async (req, res) => {
    const body = []; for await (const chunk of req) body.push(chunk);
    const request = JSON.parse(Buffer.concat(body).toString('utf8'));
    const last = request.messages[request.messages.length - 1];
    if (last.role === 'tool') toolResults.push(JSON.parse(typeof last.content === 'string' ? last.content : last.content[0].text));
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    const call = calls[step++];
    const delta = call
      ? { tool_calls: [{ index: 0, id: `call_${step}`, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.args) } }] }
      : { content: 'DONE' };
    res.end(`data: ${JSON.stringify({ choices: [{ delta, finish_reason: call ? 'tool_calls' : 'stop' }] })}\n\ndata: [DONE]\n\n`);
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const reservation = net.createServer(); await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const providersPath = path.join(root, 'providers.json'); const agentBindingsPath = path.join(root, 'bindings.json');
  fs.writeFileSync(providersPath, JSON.stringify([{ id: 'fixture', baseUrl: `http://127.0.0.1:${upstream.address().port}/v1`, apiKey: 'local-only', models: ['m'] }]));
  fs.writeFileSync(agentBindingsPath, JSON.stringify({ agentBindings: { zero: { model: 'fixture/m' } } }));
  const host = new ZeroNativeHost({ port, dataDir: path.join(root, 'data'), prefsPath: path.join(root, 'prefs.json'), skillsDir: path.join(root, 'skills'), providersPath, agentBindingsPath });
  t.after(async () => {
    await host.close(); upstream.closeAllConnections(); await new Promise(resolve => upstream.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  });
  await host.start();

  await host._runAssistantRequest({ sessionKey: 'keyboard-rule', runId: 'keyboard-rule', userContent: 'Type something', source: 'contract' });

  const [typed, hotkey, focus] = toolResults;
  assert.equal(typed?.ok, false);
  assert.equal(typed?.error, 'keyboard-target-required', 'type_text with no window must be refused');
  assert.equal(hotkey?.ok, false);
  assert.equal(hotkey?.error, 'keyboard-target-required', 'hotkey with no window must be refused');
  assert.equal(focus?.ok, false, 'focus_window with no target must be refused');
});

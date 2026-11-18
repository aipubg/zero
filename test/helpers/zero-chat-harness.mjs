// A real Zero host wired to a scripted, local OpenAI-compatible model server.
// Each model request is passed to `reply(request, index)`, which returns either
// { text } or { toolCalls: [{ name, args }] }. Every request body is recorded.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { ZeroNativeHost } from '../../services/host/native-gateway.mjs';

export async function startChatHarness(t, { reply, hostOptions = {}, prefix = 'zero-harness-' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const requests = [];
  let callId = 0;
  const upstream = http.createServer(async (req, res) => {
    const body = []; for await (const chunk of req) body.push(chunk);
    const request = JSON.parse(Buffer.concat(body).toString('utf8') || '{}');
    requests.push(request);
    const out = (await reply(request, requests.length - 1)) || { text: 'ok' };
    const stream = request.stream !== false;
    const toolCalls = (out.toolCalls || []).map((call, index) => ({ index, id: `call-${++callId}`, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.args || {}) } }));
    if (!stream) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ index: 0, message: { role: 'assistant', content: out.text ?? null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) }, finish_reason: toolCalls.length ? 'tool_calls' : 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 5 } }));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    const delta = toolCalls.length ? { tool_calls: toolCalls } : { content: out.text ?? '' };
    res.end(`data: ${JSON.stringify({ choices: [{ delta, finish_reason: toolCalls.length ? 'tool_calls' : 'stop' }] })}\n\ndata: [DONE]\n\n`);
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const reservation = net.createServer(); await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const providersPath = path.join(root, 'providers.json');
  const agentBindingsPath = path.join(root, 'bindings.json');
  fs.writeFileSync(providersPath, JSON.stringify([{ id: 'fixture', baseUrl: `http://127.0.0.1:${upstream.address().port}/v1`, apiKey: 'local-harness-only', models: ['harness-model'] }]));
  fs.writeFileSync(agentBindingsPath, JSON.stringify({ agentBindings: { zero: { model: 'fixture/harness-model' } } }));
  const skillsDir = path.join(root, 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });
  const host = new ZeroNativeHost({ port, dataDir: path.join(root, 'data'), prefsPath: path.join(root, 'prefs.json'), skillsDir, providersPath, agentBindingsPath, localVision: false, ...hostOptions });
  t.after(async () => {
    await host.close();
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  });
  await host.start();
  const ask = (sessionKey, userContent, extra = {}) => host._runAssistantRequest({ sessionKey, runId: `${sessionKey}-${Date.now()}`, userContent, source: 'chat', ...extra });
  return { host, requests, ask, root, skillsDir };
}

export const systemText = request => (request.messages || []).filter(m => m.role === 'system').map(m => String(m.content)).join('\n---\n');

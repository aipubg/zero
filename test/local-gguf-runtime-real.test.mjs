import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import http from 'node:http';
import { LocalGgufEngineService } from '../backend/gateway/server/local-gguf-service.ts';
import { LocalInferenceRuntime } from '../packages/model-fabric/local-runtime.mjs';
import { LocalChatTransport } from '../packages/model-fabric/local-chat-transport.mjs';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { assignZeroModel, importModelSettings } from '../services/host/model-settings.mjs';

test('[REAL_OS] pinned GGUF loads, generates native token IDs, preserves prior history and unloads', { skip: process.platform !== 'win32' ? 'Windows native binary required' : false, timeout: 30000 }, async () => {
  const directory = path.resolve('artifacts/local-gguf-runtime', String(Date.now())); fs.mkdirSync(directory, { recursive: true });
  const modelsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-real-gguf-'));
  const service = new LocalGgufEngineService({ modelsDir });
  const source = new LocalInferenceRuntime().model;
  const checksum = async () => { const hash = createHash('sha256'); for await (const chunk of fs.createReadStream(source)) hash.update(chunk); return hash.digest('hex'); };
  const report = { classification: ['REAL_OS', 'INTEGRATION'], status: 'RUNNING', startedAt: new Date().toISOString(), directory, scope: 'Selected pinned model load/token-generation/history-preservation/unload; not semantic readiness, local chat routing or arbitrary architectures' };
  try {
    const originalHash = await checksum();
    await service.saveManifest({ id: 'real-smol', name: 'Pinned real model', filename: path.basename(source), modelPath: source, zeroCopy: true, parameters: { num_ctx: 512 } });
    await service.loadModel('real-smol');
    assert.equal(service.getMemoryStatus().isLoaded, true);
    const history = [{ type: 'user', text: 'Earlier conversation preserved for this verification' }, { type: 'model', response: ['Previous owner context'] }];
    service.activeSession.setChatHistory(history);
    const before = structuredClone(service.activeSession.getChatHistory());
    const result = await service.runSelfTest('real-smol');
    assert.equal(result.passed, true, JSON.stringify(result));
    assert.ok(result.tokensGenerated > 0 && result.tokensGenerated <= 12);
    assert.ok(result.sampleOutput.trim()); assert.match(result.tokenAccounting, /Native generated token IDs/);
    assert.deepEqual(service.activeSession.getChatHistory(), before);
    const stored = await service.loadManifest('real-smol'); assert.equal(stored.lastSelfTest.passed, true);
    const server = http.createServer(async (req, res) => {
      try { await service.executeChat('real-smol', [{ role: 'user', content: req.url.endsWith('-stop') ? 'Hi, please confirm you are ready by saying READY.' : 'Count from one to one hundred and explain each number in detail.' }], { stream: req.url.startsWith('/stream'), maxTokens: req.url.endsWith('-stop') ? 64 : 1, ...(req.url.endsWith('-stop') ? { stop: ['a'] } : {}), temperature: 0, keep_alive: -1 }, res); }
      catch (error) { if (!res.headersSent) { res.statusCode = 500; res.end(JSON.stringify({ error: error.message })); } else res.destroy(error); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const chatResponses = [];
    try {
      for (const route of ['/json', '/stream', '/json-stop', '/stream-stop']) {
        const response = await fetch(`http://127.0.0.1:${server.address().port}${route}`);
        const body = await response.text(); assert.equal(response.status, 200, body);
        const completion = route.startsWith('/json') ? JSON.parse(body) : body.split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6))).find(chunk => chunk.usage);
        assert.equal(completion.choices[0].finish_reason, route.endsWith('-stop') ? 'stop' : 'length', body);
        if (!route.endsWith('-stop')) assert.equal(completion.usage.completion_tokens, 1);
        assert.ok(completion.usage.prompt_tokens >= 0);
        assert.equal(completion.usage.total_tokens, completion.usage.prompt_tokens + completion.usage.completion_tokens);
        assert.match(completion.usageAccounting, /Native evaluated input/);
        chatResponses.push({ route, finishReason: completion.choices[0].finish_reason, usage: completion.usage, nativeStopReason: completion.nativeStopReason || completion.telemetry.nativeStopReason });
      }
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    const localChat = new LocalChatTransport(service);
    await localChat.refresh();
    const bindingsPath = path.join(modelsDir, 'isolated-bindings.json');
    const configPath = path.join(modelsDir, 'isolated-providers.json');
    fs.writeFileSync(configPath, '[]');
    const fabric = new ModelFabric({ providers: [], configPath, localChat, agentBindingsPath: bindingsPath });
    assert.equal(fabric.resolveModel('local-gguf/real-smol').provider.local, true);
    assert.equal(fabric.resolveModel('local-gguf/missing'), null);
    const catalogEntry = fabric.listModels().find(model => model.id === 'local-gguf/real-smol');
    assert.equal(catalogEntry.contextWindow, 512);
    assert.equal(catalogEntry.contextWindowSource, 'native-allocation');
    assert.deepEqual(catalogEntry.input, ['text']);
    const oversizedBudget = fabric.calculateContextBudget('local-gguf/real-smol', [{ role: 'user', content: 'x'.repeat(4000) }]);
    assert.equal(oversizedBudget.contextWindow, 512);
    assert.equal(oversizedBudget.withinBudget, false);
    assert.equal(oversizedBudget.maxCompletionTokens, 0);
    assignZeroModel(fabric, { modelId: 'local-gguf/real-smol' });
    const reopened = new ModelFabric({ providers: [], localChat, agentBindingsPath: bindingsPath });
    assert.equal(reopened.resolveAgentModel('zero').canonicalModelId, 'local-gguf/real-smol');
    importModelSettings(fabric, { providers: [], defaults: { primary: 'local-gguf/real-smol' }, agentBindings: { coder: { model: 'local-gguf/real-smol' } } });
    assert.equal(fabric.resolveAgentModel('coder').canonicalModelId, 'local-gguf/real-smol');
    const beforeInvalidImport = [fs.readFileSync(configPath), fs.readFileSync(bindingsPath)];
    assert.throws(() => importModelSettings(fabric, { providers: [], defaults: { primary: 'local-gguf/missing' } }), /unavailable/);
    assert.deepEqual([fs.readFileSync(configPath), fs.readFileSync(bindingsPath)], beforeInvalidImport);
    const localPayload = { model: 'local-gguf/real-smol', messages: [{ role: 'user', content: 'Count to one hundred in detail.' }], max_tokens: 1, temperature: 0, keep_alive: -1 };
    const direct = await fabric.executeChat(localPayload);
    assert.equal(direct.data.choices[0].finish_reason, 'length');
    assert.equal(direct.data.usage.completion_tokens, 1);
    const stream = [];
    for await (const chunk of fabric.streamChat(localPayload)) stream.push(chunk);
    assert.equal(stream.at(-1).finish_reason, 'length');
    assert.equal(stream.at(-1).done, true);
    await assert.rejects(fabric.executeChat({ ...localPayload, model: 'local-gguf/missing' }), /unavailable/);
    assert.equal(fabric.upstreamRequestCount, 0);
    await assert.rejects(fabric.executeChat({ ...localPayload, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } }] }] }), /text messages only/);
    const simultaneous = await Promise.all([fabric.executeChat(localPayload), fabric.executeChat(localPayload)]);
    assert.ok(simultaneous.every(result => result.data.usage.completion_tokens === 1));
    const cancelled = new AbortController(); cancelled.abort();
    await assert.rejects(fabric.executeChat(localPayload, { signal: cancelled.signal }), { name: 'AbortError' });
    assert.equal((await fabric.executeChat(localPayload)).data.usage.completion_tokens, 1);
    const interruptedStream = await fabric.executeChat({ ...localPayload, stream: true, max_tokens: 512 });
    const interruptedReader = interruptedStream.stream.getReader();
    const firstGenerated = await interruptedReader.read();
    assert.equal(firstGenerated.done, false);
    await interruptedReader.cancel();
    await localChat.tail.catch(() => {});
    assert.equal((await fabric.executeChat(localPayload)).data.usage.completion_tokens, 1);
    report.localStreamCancellation = { actualNativeStreamStarted: true, readerCancelled: true, nativeQueueSettled: true, nextActualGenerationSucceeded: true };
    await assert.rejects(fabric.executeChat({ ...localPayload, max_tokens: 512 }, { timeoutMs: 1 }), { name: 'TimeoutError' });
    await localChat.tail.catch(() => {});
    assert.equal((await fabric.executeChat(localPayload)).data.usage.completion_tokens, 1);
    report.localDeadline = { actualNativeRequestTimedOut: true, nextActualGenerationSucceeded: true };
    await fabric.executeChat({ ...localPayload, messages: [{ role: 'user', content: 'Earlier user' }, { role: 'assistant', content: 'OLD_CONTEXT' }, { role: 'user', content: 'First request' }] });
    await fabric.executeChat({ ...localPayload, messages: [{ role: 'user', content: 'Earlier user' }, { role: 'assistant', content: 'NEW_CONTEXT' }, { role: 'user', content: 'Additional history turn' }, { role: 'user', content: 'Second request' }] });
    const currentHistory = service.activeSession.getChatHistory();
    assert.ok(currentHistory.some(turn => turn.type === 'model' && turn.response.includes('NEW_CONTEXT')), 'Authoritative changed assistant history must replace old cached model response');
    assert.ok(currentHistory.some(turn => turn.type === 'user' && turn.text.includes('Additional history turn')), 'New history suffix must not be dropped by cache reuse');
    assert.equal(currentHistory.some(turn => turn.type === 'model' && turn.response.includes('OLD_CONTEXT')), false);
    report.authoritativeHistoryReplacement = true;
    report.modelFabricLocal = { actualJson: true, actualStream: true, cloudRequests: fabric.upstreamRequestCount, missingModelRejected: true };
    await service.unloadModel(true); assert.equal(service.getMemoryStatus().isLoaded, false);
    assert.equal(await checksum(), originalHash);
    Object.assign(report, { status: 'PASS', result, chatResponses, priorHistoryPreserved: true, persistedSelfTest: true, actualUnload: true, originalSourceSha256: originalHash });
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    await service.unloadModel(true);
    report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(fs.realpathSync(path.dirname(modelsDir)), fs.realpathSync(os.tmpdir())); fs.rmSync(modelsDir, { recursive: true, force: true });
  }
});

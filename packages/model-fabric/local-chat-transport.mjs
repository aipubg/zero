import { PassThrough, Readable } from 'node:stream';

// Serialize access to the engine's single mutable native context. No cloud
// request or credential lookup belongs on this transport.
export class LocalChatTransport {
  constructor(engine) { this.engine = engine; this.models = []; this.tail = Promise.resolve(); }
  async refresh() { this.models = await this.engine.scanModels(); return this.models; }
  listModels() {
    const status = this.engine.getMemoryStatus();
    return this.models.map(model => {
      const allocated = status.loadedModelId === model.id ? status.contextSize : null;
      const configured = Math.max(512, Math.min(model.contextLength || 2048, 4096));
      return { id: `local-gguf/${model.id}`, name: model.name, provider: 'local-gguf', reasoning: !!model.capabilities?.reasoning,
        input: ['text'], contextWindow: allocated || configured, maxTokens: allocated || configured,
        contextWindowSource: allocated ? 'native-allocation' : 'configured-runtime-cap; allocation may be smaller' };
    });
  }
  resolve(id) {
    const model = this.models.find(model => id === `local-gguf/${model.id}`);
    if (!model) return null;
    return { provider: { id: 'local-gguf', models: this.listModels(), local: true }, canonicalModelId: `local-gguf/${model.id}`, capabilities: { reasoning: !!model.capabilities?.reasoning, image: false, tools: true }, localModelId: model.id };
  }
  async execute(payload, options = {}) {
    if (!Array.isArray(payload.messages) || payload.messages.some(message =>
      Array.isArray(message.content) && message.content.some(part => typeof part !== 'string' && (part?.type !== 'text' || typeof part.text !== 'string')))) {
      throw new Error('Local chat transport supports text messages only; use the vision runtime for images');
    }
    await this.refresh();
    const resolution = this.resolve(payload.model);
    if (!resolution) throw new Error(`Local model unavailable: ${payload.model}`);
    const output = new PassThrough();
    const cancelled = new AbortController();
    const signal = options.signal ? AbortSignal.any([options.signal, cancelled.signal]) : cancelled.signal;
    const deadline = setTimeout(() => cancelled.abort(new DOMException('Local inference timed out', 'TimeoutError')), options.timeoutMs ?? 60000);
    deadline.unref();
    const onAbort = () => output.destroy(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    output.on('close', () => { if (!output.writableFinished) cancelled.abort(); });
    // ServerResponse-compatible writable surface consumed by the engine.
    output.setHeader = () => output;
    output.writeHead = status => { output.statusCode = status; output.headersSent = true; return output; };
    output.statusCode = 200;
    const run = this.tail.catch(() => {}).then(async () => {
      signal.throwIfAborted();
      await this.engine.executeChat(resolution.localModelId, payload.messages, {
        ...payload, maxTokens: payload.max_tokens, responseFormat: payload.response_format,
        toolChoice: payload.tool_choice, signal,
      }, output);
    });
    this.tail = run;
    const cleanup = () => { clearTimeout(deadline); signal.removeEventListener('abort', onAbort); };
    run.then(cleanup, cleanup);
    run.catch(error => output.destroy(error));
    if (payload.stream) return { stream: Readable.toWeb(output), status: 200, headers: new Headers({ 'Content-Type': 'text/event-stream' }) };
    const chunks = []; let size = 0;
    for await (const chunk of output) { size += chunk.length; if (size > 8 * 1024 * 1024) { output.destroy(); throw new Error('Local completion exceeded 8 MiB'); } chunks.push(chunk); }
    await run;
    if (output.statusCode !== 200) throw new Error(`Local completion failed with status ${output.statusCode}`);
    return { data: JSON.parse(Buffer.concat(chunks).toString('utf8')), status: output.statusCode };
  }
}

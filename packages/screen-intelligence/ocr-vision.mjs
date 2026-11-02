/** Native OCR is available independently of a local vision model. */
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('./winrt-ocr.ps1', import.meta.url));
export const LOCAL_VISION_STATUS = Object.freeze({
  available: false, status: 'unavailable', reason: 'No local vision model configured', confidence: null,
});

export class LocalVisionExtractor {
  constructor(options = {}) {
    this.language = options.language ?? null;
    this.timeoutMs = options.ocrTimeoutMs ?? 15_000;
    this.maxInputBytes = options.maxFrameBytes ?? 8 * 1024 * 1024;
    this.localRuntime = options.localVisionRuntime ?? null;
  }

  computeImageHash(imageBuffer) {
    return imageBuffer?.length ? crypto.createHash('sha256').update(imageBuffer).digest('hex') : '';
  }

  getStatus() { return this.localRuntime?.getStatus() ?? { ...LOCAL_VISION_STATUS }; }

  async extractText(imageBuffer, { signal } = {}) {
    const unavailable = reason => ({ ok: false, status: 'unavailable', text: '', confidence: null, engine: 'windows-winrt-ocr', reason });
    if (process.platform !== 'win32') return unavailable('unsupported-platform');
    if (!imageBuffer?.length || imageBuffer.length > this.maxInputBytes) return unavailable('ocr-input-size-rejected');
    if (signal?.aborted) return unavailable('aborted');
    try {
      const result = await new Promise((resolve, reject) => {
        const child = execFile('powershell.exe', [
          '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath,
        ], { windowsHide: true, timeout: this.timeoutMs, maxBuffer: 256 * 1024, encoding: 'utf8', signal }, (error, stdout) => {
          if (error) reject(error);
          else {
            try { resolve(JSON.parse(stdout.trim().replace(/^\uFEFF/u, ''))); }
            catch { reject(new Error('invalid-ocr-response')); }
          }
        });
        child.stdin.on('error', () => {});
        child.stdin.end(JSON.stringify({ dataBase64: Buffer.from(imageBuffer).toString('base64'), language: this.language }));
      });
      if (result.ok !== true || typeof result.text !== 'string') return unavailable(result.reason || 'ocr-failed');
      // WinRT exposes no recognition confidence. Empty recognized text is valid.
      return { ok: true, status: 'available', text: result.text.slice(0, 12000), confidence: null,
        engine: 'windows-winrt-ocr', language: result.language ?? null };
    } catch (error) {
      return unavailable(signal?.aborted ? 'aborted' : error.killed ? 'ocr-timeout' : error.message);
    }
  }

  /** Factual metadata/text summary, never a claim of visual model inference. */
  summarizeFrame(metadata = {}) {
    const context = `Application: ${metadata.appName || 'unknown'}; window: ${JSON.stringify(metadata.windowTitle || '')}; event: ${metadata.reason || 'observation'}`;
    return `${context}${metadata.ocrText ? `; OCR: ${metadata.ocrText.slice(0, 2000)}` : ''}; ${this.localRuntime?.enabled ? 'local vision results are appended separately when available' : 'local vision unavailable'}.`;
  }
}

/** Capture pixels and retain provenance dropped by the UI driver's convenience wrapper. */
import { getCuaDriver, runNativeWinAction, getWindowState } from '../../app/zero-control-ui/src/computer/windows-driver.js';
import { LocalVisionExtractor, LOCAL_VISION_STATUS } from './ocr-vision.mjs';
import { crc32 } from 'node:zlib';

const extractor = new LocalVisionExtractor();
const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');

export function pngDimensions(data) {
  if (data.length < 45 || !data.subarray(0, 8).equals(PNG_SIGNATURE) ||
      data.readUInt32BE(8) !== 13 || data.toString('ascii', 12, 16) !== 'IHDR' ||
      data.toString('ascii', data.length - 8, data.length - 4) !== 'IEND') {
    throw new Error('invalid-or-unsupported-capture-image');
  }
  const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
  if (!width || !height || width * height > 32_000_000) throw new Error('capture-dimensions-rejected');
  let offset = 8, sawPixels = false, ended = false;
  while (offset < data.length) {
    if (offset + 12 > data.length) throw new Error('truncated-png-chunk');
    const size = data.readUInt32BE(offset), end = offset + 12 + size;
    if (end > data.length) throw new Error('truncated-png-chunk');
    const type = data.toString('ascii', offset + 4, offset + 8);
    if (crc32(data.subarray(offset + 4, end - 4)) !== data.readUInt32BE(end - 4)) throw new Error('corrupt-png-chunk');
    if (type === 'IDAT' && size > 0) sawPixels = true;
    if (type === 'IEND') { ended = size === 0 && end === data.length; break; }
    offset = end;
  }
  if (!sawPixels || !ended) throw new Error('incomplete-png-capture');
  return { width, height };
}

export async function captureDriverDesktop({ signal } = {}) {
  signal?.throwIfAborted();
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const result = await driver.callTool('get_desktop_state', '{}');
      signal?.throwIfAborted();
      const img = result?.images?.[0];
      if (!result?.isError && img?.dataBase64) {
        return { ok: true, base64: img.dataBase64, mimeType: img.mimeType,
          captureSource: 'cua-driver', displayId: null };
      }
    } catch (error) { if (signal?.aborted) throw error; }
  }
  // The unwrapped native response retains livePixels=false on GDI failure.
  const native = await runNativeWinAction('screenshot', {}, signal);
  if (native?.ok !== true || native.livePixels !== true) {
    throw new Error(native?.error || 'native-capture-has-no-live-pixels');
  }
  return { ...native, captureSource: 'windows-gdi', displayId: 'primary' };
}

export async function captureRealDesktopFrame(options = {}) {
  const startedAt = Date.now();
  const { signal } = options;
  try {
    signal?.throwIfAborted();
    const screen = await (options.captureScreen ?? captureDriverDesktop)({ signal });
    signal?.throwIfAborted();
    if (screen?.ok !== true || screen.livePixels === false) throw new Error(screen?.error || screen?.notice || 'capture-failed');
    const maxBytes = options.maxFrameBytes ?? 8 * 1024 * 1024;
    const base64 = typeof screen.base64 === 'string' ? screen.base64.replace(/^data:[^;]+;base64,/u, '') : '';
    if (base64.length > Math.ceil(maxBytes / 3) * 4 || (screen.buffer?.byteLength ?? 0) > maxBytes) throw new Error('capture-size-exceeded');
    const data = screen.buffer ? Buffer.from(screen.buffer) : Buffer.from(base64, 'base64');
    if (!data.length) throw new Error('capture-returned-no-pixels');
    if (data.length > maxBytes) throw new Error('capture-size-exceeded');
    const dimensions = pngDimensions(data);
    const timestamp = Date.now();
    let win = null, metadataError = null;
    try {
      win = await (options.getWindowState ?? getWindowState)(signal);
      if (!win || win.ok !== true || win.raw || (!win.process && !win.process_name && !win.title && !win.pid)) throw new Error(win?.error || 'foreground-metadata-unavailable');
    } catch (error) { win = null; metadataError = error.message; }
    const metadataTimestamp = Date.now();
    signal?.throwIfAborted();
    let ocr;
    try { ocr = await (options.visionExtractor ?? extractor).extractText(data, { signal }); }
    catch (error) { ocr = { ok: false, status: 'unavailable', text: '', engine: 'windows-winrt-ocr', confidence: null, reason: error.message }; }
    signal?.throwIfAborted();
    return { ok: true, data, ...dimensions, mimeType: 'image/png', timestamp,
      captureStartedAt: startedAt, captureDurationMs: Date.now() - startedAt,
      captureSource: screen.captureSource ?? 'injected-capture', displayId: screen.displayId ?? null,
      metadataTimestamp, metadataStatus: win ? 'available' : 'unavailable', metadataError,
      appName: win?.process ?? win?.process_name ?? null, windowTitle: win?.title ?? null,
      pid: win?.pid ?? null, hwnd: win?.hwnd ?? null, bounds: win?.bounds ?? null,
      ocrText: ocr.ok === true ? ocr.text : '', ocr, localVision: { ...((options.visionExtractor ?? extractor).getStatus?.() ?? LOCAL_VISION_STATUS), frameInference: 'not-sampled' } };
  } catch (error) {
    return { ok: false, error: error.message, aborted: signal?.aborted === true,
      timestamp: Date.now(), captureDurationMs: Date.now() - startedAt };
  }
}

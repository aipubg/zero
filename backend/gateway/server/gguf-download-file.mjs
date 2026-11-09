import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Publishes only complete, hash-checked bytes. Existing files are never replaced.
export async function downloadVerifiedGguf({ url, destination, sizeBytes, sha256, signal, onProgress }) {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 4 || !/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Expected GGUF size and SHA-256 required');
  if (fs.existsSync(destination)) throw new Error('Destination already exists');
  const temporary = `${destination}.${crypto.randomUUID()}.download`;
  const stalled = new AbortController();
  let timer;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => stalled.abort(new Error('GGUF transfer made no progress for 30 seconds')), 30000);
    timer.unref?.();
  };
  const transferSignal = signal ? AbortSignal.any([signal, stalled.signal]) : stalled.signal;
  let handle;
  try {
    transferSignal.throwIfAborted();
    handle = await fs.promises.open(temporary, 'wx');
    arm();
    const response = await fetch(url, { signal: transferSignal });
    if (!response.ok || !response.body) throw new Error(`GGUF download HTTP ${response.status}`);
    const hash = crypto.createHash('sha256');
    let bytes = 0;
    let magic = Buffer.alloc(0);
    for await (const chunk of response.body) {
      transferSignal.throwIfAborted();
      arm();
      bytes += chunk.length;
      if (bytes > sizeBytes) throw new Error('GGUF download exceeds expected size');
      if (magic.length < 4) magic = Buffer.concat([magic, chunk]).subarray(0, 4);
      hash.update(chunk);
      // FileHandle.write may legally write fewer bytes than requested.
      let offset = 0;
      while (offset < chunk.length) {
        const result = await handle.write(chunk, offset, chunk.length - offset);
        if (!result.bytesWritten) throw new Error('GGUF write made no progress');
        offset += result.bytesWritten;
      }
      onProgress?.(bytes);
    }
    if (bytes !== sizeBytes) throw new Error('GGUF download size mismatch');
    if (magic.toString('ascii') !== 'GGUF') throw new Error('Downloaded file is not GGUF');
    const actualSha256 = hash.digest('hex');
    if (actualSha256 !== sha256) throw new Error('GGUF download SHA-256 mismatch');
    clearTimeout(timer);
    transferSignal.throwIfAborted();
    await handle.sync();
    await handle.close(); handle = null;
    // Same-directory hard link publishes all verified bytes atomically, refuses
    // existing names and prevents scans from observing a partially copied GGUF.
    await fs.promises.link(temporary, destination);
    return { filename: path.basename(destination), sizeBytes: bytes, sha256: actualSha256, verified: true };
  } finally {
    clearTimeout(timer);
    try { await handle?.close(); }
    finally { await fs.promises.rm(temporary, { force: true }); }
  }
}

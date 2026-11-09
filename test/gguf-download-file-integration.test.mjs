import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { downloadVerifiedFile, downloadVerifiedGguf } from '../backend/gateway/server/gguf-download-file.mjs';

test('[INTEGRATION] download streams actual HTTP bytes, rejects corrupt/truncated content and preserves existing files', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'zero-download-'));
  // Controlled transfer fixture is not a loadable model or external-service proof.
  const bytes = Buffer.concat([Buffer.from('GGUF'), crypto.randomBytes(65536)]);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const server = http.createServer((request, response) => {
    if (request.url === '/other') response.end('OTHERBIN');
    else if (request.url === '/short') response.end(bytes.subarray(0, 8));
    else if (request.url === '/slow') { response.write(bytes.subarray(0, 4)); }
    else response.end(bytes);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const destination = path.join(directory, 'model.gguf');
  const options = { url: base, destination, sizeBytes: bytes.length, sha256 };
  try {
    let observed = 0;
    assert.equal((await downloadVerifiedGguf({ ...options, onProgress: count => observed = count })).verified, true);
    assert.equal(observed, bytes.length);
    assert.deepEqual(await fs.readFile(destination), bytes);
    await assert.rejects(downloadVerifiedGguf(options), /already exists/);
    assert.deepEqual(await fs.readFile(destination), bytes);
    await fs.unlink(destination);
    await assert.rejects(downloadVerifiedGguf({ ...options, sha256: '0'.repeat(64) }), /SHA-256 mismatch/);
    await assert.rejects(downloadVerifiedGguf({ ...options, url: `${base}/short` }), /size mismatch/);
    await assert.rejects(downloadVerifiedGguf({ ...options, sizeBytes: 8 }), /exceeds expected/);
    // Generic binary transfer may accept any pinned bytes; the model wrapper
    // must still enforce GGUF even when a caller supplies a different header.
    const other = { ...options, url: `${base}/other`, sizeBytes: 8, sha256: crypto.createHash('sha256').update('OTHERBIN').digest('hex') };
    await downloadVerifiedFile(other);
    assert.equal(await fs.readFile(destination, 'utf8'), 'OTHERBIN');
    await fs.unlink(destination);
    await assert.rejects(downloadVerifiedGguf({ ...other, header: Buffer.from('OTHER') }), /header mismatch/);
    await assert.rejects(downloadVerifiedGguf({ ...options, url: `${base}/slow`, signal: AbortSignal.timeout(100) }), /abort|timeout/i);
    assert.deepEqual(await fs.readdir(directory), []);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    // Only this test-created, resolved directory is removed.
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('zero-download-'));
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('[INTEGRATION] actual stalled HTTP body times out and leaves no published or temporary file', { timeout: 40000 }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'zero-download-'));
  const server = http.createServer((request, response) => { response.write('GGUF'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await assert.rejects(downloadVerifiedGguf({
      url: `http://127.0.0.1:${server.address().port}`,
      destination: path.join(directory, 'stalled.gguf'), sizeBytes: 8, sha256: '0'.repeat(64),
    }), /30 seconds/);
    assert.deepEqual(await fs.readdir(directory), []);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('zero-download-'));
    await fs.rm(directory, { recursive: true, force: true });
  }
});

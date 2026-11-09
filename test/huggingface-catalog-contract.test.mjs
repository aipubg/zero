import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHuggingFaceRepo, retrieveGgufCatalog } from '../backend/gateway/server/local-gguf-catalog.mjs';

test('[CONTRACT] Hugging Face catalog accepts repository identity and rejects arbitrary URL/path input', async () => {
  assert.equal(normalizeHuggingFaceRepo(' Qwen/Qwen2.5-0.5B-Instruct-GGUF '), 'Qwen/Qwen2.5-0.5B-Instruct-GGUF');
  assert.equal(normalizeHuggingFaceRepo('https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/'), 'Qwen/Qwen2.5-0.5B-Instruct-GGUF');
  for (const invalid of [null, '', '../escape', 'owner/repo/extra', 'https://example.invalid/owner/repo', 'https://huggingface.co/owner/repo?token=private', 'https://name:secret@huggingface.co/owner/repo', 'owner/repo\\file', 'https://huggingface.co:444/owner/repo']) {
    await assert.rejects(retrieveGgufCatalog(invalid), /repository|owner\/repository|official/);
  }
});

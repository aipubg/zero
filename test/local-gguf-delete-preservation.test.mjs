import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { LocalGgufEngineService } from '../backend/gateway/server/local-gguf-service.ts';
import { LocalInferenceRuntime } from '../packages/model-fabric/local-runtime.mjs';

test('[INTEGRATION] actual GGUF removal preserves outside source, unrelated data and same-prefix guides', { timeout: 15000 }, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-gguf-preserve-'));
  t.after(() => {
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-gguf-preserve-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const modelsDir = path.join(root, 'models'); fs.mkdirSync(modelsDir);
  const source = new LocalInferenceRuntime().model;
  if (!fs.existsSync(source)) { t.skip('BLOCKED: installed local GGUF source required for preservation test'); return; }
  const sourceSize = fs.statSync(source).size;
  const hashFile = async file => { const hash = createHash('sha256'); for await (const bytes of fs.createReadStream(file)) hash.update(bytes); return hash.digest('hex'); };
  const sourceHash = await hashFile(source);
  fs.copyFileSync(source, path.join(modelsDir, 'owned.gguf'));
  const retained = ['owned.txt', 'owned.json', 'owned.notes.txt', 'user-settings.json', 'notes.txt', 'gateway-defaults.json'];
  for (const name of retained) fs.writeFileSync(path.join(modelsDir, name), `KEEP:${name}`);
  const outside = path.join(root, 'outside.txt'); fs.writeFileSync(outside, 'OUTSIDE');
  const service = new LocalGgufEngineService({ modelsDir });
  const providers = JSON.stringify([{ id: 'gguf', apiKey: 'retained-test-key' }, { id: 'remote', enabled: true }]);
  fs.writeFileSync(path.join(modelsDir, 'gateway-providers.json'), providers);
  await service.saveManifest({ id: 'external', name: 'External original', filename: path.basename(source), modelPath: source, zeroCopy: true, parameters: {} });
  const catalog = await service.scanModels();
  assert.ok(catalog.some(model => model.id === 'owned')); assert.ok(catalog.some(model => model.id === 'external'));
  const externalManifest = path.join(modelsDir, 'external.manifest.json');
  const originalManifest = fs.readFileSync(externalManifest, 'utf8');
  for (const invalid of [{ contextLength: -1 }, { name: '' }, { capabilities: { image: 'yes' } }, { parameters: { num_ctx: NaN } }]) {
    await assert.rejects(service.updateModelSettings('external', invalid));
    assert.equal(fs.readFileSync(externalManifest, 'utf8'), originalManifest);
  }
  await service.updateModelSettings('external', { name: 'Renamed external', contextLength: 4096, capabilities: { reasoning: false } });
  const reopened = new LocalGgufEngineService({ modelsDir });
  const saved = await reopened.loadManifest('external');
  assert.equal(saved.name, 'Renamed external'); assert.equal(saved.parameters.num_ctx, 4096);
  assert.equal(saved.modelPath, source); assert.equal(saved.zeroCopy, true);
  const manifestBackup = fs.readdirSync(modelsDir).find(name => name.startsWith('external.manifest.json.before-manifest-change-'));
  assert.equal(fs.readFileSync(path.join(modelsDir, manifestBackup), 'utf8'), originalManifest);
  for (const id of ['../outside.txt', '..\\outside.txt', outside, 'owned/../outside']) await assert.rejects(service.deleteModel(id), /Invalid local model identifier/);
  await assert.rejects(service.saveManifest({ id: '../escape', modelPath: source }), /Invalid local model identifier/);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'OUTSIDE');
  await service.deleteAllModels();
  assert.equal(fs.existsSync(path.join(modelsDir, 'owned.gguf')), false);
  assert.equal(fs.existsSync(path.join(modelsDir, 'external.manifest.json')), false);
  assert.equal(fs.statSync(source).size, sourceSize);
  assert.equal(await hashFile(source), sourceHash);
  for (const name of retained) assert.equal(fs.readFileSync(path.join(modelsDir, name), 'utf8'), `KEEP:${name}`);
  const backups = fs.readdirSync(modelsDir).filter(name => name.startsWith('gateway-providers.json.before-gguf-removal-'));
  assert.equal(backups.length, 1); assert.equal(fs.readFileSync(path.join(modelsDir, backups[0]), 'utf8'), providers);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(modelsDir, 'gateway-providers.json'))), [{ id: 'remote', enabled: true }]);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'OUTSIDE');
  await assert.rejects(service.deleteModel('user-settings.json'), /not found/);
  assert.equal(fs.readFileSync(path.join(modelsDir, 'user-settings.json'), 'utf8'), 'KEEP:user-settings.json');
});

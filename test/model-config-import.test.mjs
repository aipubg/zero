import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { commitModelImport, recoverModelImport } from '../packages/model-fabric/config-transaction.mjs';
import { importModelSettings, modelSettings } from '../services/host/model-settings.mjs';

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-model-import-'));
  t.after(() => { const resolved = fs.realpathSync.native(directory); assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir())); assert.ok(["zero-model-import-"].some(prefix => path.basename(resolved).startsWith(prefix))); fs.rmSync(resolved, { recursive: true, force: true }); });
  const providers = path.join(directory, 'providers.json'); const bindings = path.join(directory, 'bindings.json');
  const originalProviders = JSON.stringify([{ id: 'original', baseUrl: 'https://example.invalid/v1', apiKey: 'private-original-key', models: ['one'], retained: 123 }]);
  const originalBindings = JSON.stringify({ retained: true, defaults: { thinking: 'default' }, agentBindings: { zero: { model: 'original/one', privateToken: 'private-original-token' } } });
  fs.writeFileSync(providers, originalProviders); fs.writeFileSync(bindings, originalBindings);
  const fabric = new ModelFabric({ configPath: providers, agentBindingsPath: bindings });
  return { directory, providers, bindings, originalProviders, originalBindings, fabric };
}

test('[INTEGRATION] imports merge providers, preserve private round-trip data and validate the entire batch before writing', t => {
  const f = fixture(t);
  const result = importModelSettings(f.fabric, { providers: [{ id: 'second', baseUrl: 'https://example.invalid/v1', models: ['two'] }], agentBindings: { specialist: { model: 'second/two' } } });
  assert.equal(result.importedProviders, 1); assert.equal(result.providers.length, 2); assert.equal(result.backupPaths.length, 2);
  assert.equal(JSON.parse(fs.readFileSync(f.providers))[0].apiKey, 'private-original-key');
  assert.equal(JSON.parse(fs.readFileSync(f.bindings)).agentBindings.zero.privateToken, 'private-original-token');
  const publicCopy = modelSettings(f.fabric); assert.ok(!JSON.stringify(publicCopy).includes('private-original'));
  importModelSettings(f.fabric, publicCopy);
  assert.equal(JSON.parse(fs.readFileSync(f.bindings)).agentBindings.zero.privateToken, 'private-original-token');
  const providersBefore = fs.readFileSync(f.providers, 'utf8'); const bindingsBefore = fs.readFileSync(f.bindings, 'utf8');
  assert.throws(() => importModelSettings(f.fabric, { providers: [{ id: 'third', baseUrl: 'https://example.invalid/v1' }, { id: 'invalid', baseUrl: 'file:///no' }] }), /HTTP/);
  assert.equal(fs.readFileSync(f.providers, 'utf8'), providersBefore); assert.equal(fs.readFileSync(f.bindings, 'utf8'), bindingsBefore);
  assert.throws(() => importModelSettings(f.fabric, { providers: [], agentBindings: { zero: { model: 'missing/provider' } } }), /unavailable/);
});

test('[INTEGRATION] interrupted two-file write rolls back exact originals and leaves recoverable backups', t => {
  const f = fixture(t);
  assert.throws(() => commitModelImport(f.providers, f.bindings, [], {}, { onProgress: () => { throw new Error('Interrupted write'); } }), /Interrupted/);
  assert.equal(fs.readFileSync(f.providers, 'utf8'), f.originalProviders); assert.equal(fs.readFileSync(f.bindings, 'utf8'), f.originalBindings);
  assert.equal(fs.existsSync(f.providers + '.pending-model-import.json'), false);
  const backups = fs.readdirSync(f.directory).filter(name => name.includes('.before-model-import-'));
  assert.equal(backups.length, 2);
  for (const name of backups) assert.equal(fs.readFileSync(path.join(f.directory, name), 'utf8'), name.startsWith('providers.json.') ? f.originalProviders : f.originalBindings);
});

test('[INTEGRATION] killed writer blocks model resolution until fresh-process rollback restores both files', t => {
  const f = fixture(t); const moduleUrl = pathToFileURL(path.resolve('packages/model-fabric/config-transaction.mjs')).href;
  const writer = path.join(f.directory, 'writer.mjs');
  fs.writeFileSync(writer, `import fs from 'node:fs';import {commitModelImport} from ${JSON.stringify(moduleUrl)}; commitModelImport(${JSON.stringify(f.providers)},${JSON.stringify(f.bindings)},[],{}, {onProgress:()=>{fs.writeSync(1,'IMPORT_WRITE_REACHED');process.kill(process.pid,'SIGKILL');fs.writeSync(1,'UNREACHABLE');}});`);
  const terminated = spawnSync(process.execPath, [writer], { windowsHide: true, encoding: 'utf8', timeout: 10000 });
  assert.equal(terminated.error, undefined);
  assert.equal(terminated.stdout, 'IMPORT_WRITE_REACHED');
  if (process.platform === 'win32') assert.equal(terminated.status, 1);
  else assert.equal(terminated.signal, 'SIGKILL');
  assert.equal(fs.readFileSync(f.providers, 'utf8').trim(), '[]'); assert.equal(fs.readFileSync(f.bindings, 'utf8'), f.originalBindings);
  assert.throws(() => f.fabric.resolveAgentModel('zero'), /startup recovery/);
  const recovery = path.join(f.directory, 'recover.mjs');
  fs.writeFileSync(recovery, `import {recoverModelImport} from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(recoverModelImport(${JSON.stringify(f.providers)},${JSON.stringify(f.bindings)})));`);
  const recovered = JSON.parse(execFileSync(process.execPath, [recovery], { windowsHide: true, encoding: 'utf8', timeout: 10000 }));
  assert.equal(recovered.recovered, true); assert.equal(fs.readFileSync(f.providers, 'utf8'), f.originalProviders); assert.equal(fs.readFileSync(f.bindings, 'utf8'), f.originalBindings);
  assert.equal(recoverModelImport(f.providers, f.bindings).recovered, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { PluginManager } from '../packages/plugin-sdk/index.mjs';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { restoreUserState } from '../scripts/restore-user-state.mjs';

test('[INTEGRATION] restored managed plugin executes after original bundle path becomes unavailable', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-plugin-restore-'));
  const state = path.join(root, 'state'); const source = path.join(root, 'source'); const skills = path.join(root, 'skills');
  fs.mkdirSync(state); fs.mkdirSync(source); fs.mkdirSync(skills);
  fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ name: 'restore-plugin', version: '1.0.0', type: 'module', main: 'index.mjs', zeroPlugin: { id: 'restore-plugin', name: 'Restore proof', version: '1.0.0', capabilities: ['restore_effect'], config: { factor: 3 } } }));
  fs.writeFileSync(path.join(source, 'index.mjs'), `import fs from 'node:fs/promises';import path from 'node:path';export default {async onLoad(context){this.context=context;},handlers:{restore_effect:async function({value}){const result=value*this.context.config.factor;const output=path.join(this.context.dataDir,'effect.json');await fs.writeFile(output,JSON.stringify({result}));return {result,output};}}};`);
  const open = directory => {
    const engine = new CapabilityEngine({ operator: {}, logger: { warn() {} } });
    const manager = new PluginManager({ dbPath: path.join(directory, 'zero-plugins.sqlite'), capabilityEngine: engine });
    return { engine, manager };
  };
  let original; let restored;
  try {
    original = open(state);
    await original.manager.installPlugin({ path: source });
    const first = await original.engine.execute({ toolName: 'restore_effect', args: { value: 7 } });
    assert.equal(first.result, 21);
    await original.manager.close(); original = null;
    const output = execFileSync(process.execPath, ['scripts/backup-user-state.mjs', '--state-dir', state, '--skills-dir', skills], { encoding: 'utf8', windowsHide: true });
    const backup = JSON.parse(output.trim()).backupDirectory;
    const restoredRoot = path.join(root, 'restored');
    const result = await restoreUserState(backup, restoredRoot);
    assert.deepEqual(result.relocatedPluginSources, ['restore-plugin']);
    const restoredPriorData = path.join(restoredRoot, '.zero-data', path.relative(state, first.output));
    assert.equal(JSON.parse(fs.readFileSync(restoredPriorData)).result, 21, 'Existing plugin data must survive before any restored handler runs');
    // Test-created managed storage is retained under a different name so an
    // accidental fallback to its original absolute path cannot pass this check.
    const oldBundles = path.join(state, 'plugin-sdk');
    const retained = path.join(root, 'original-bundles-retained');
    assert.equal(path.dirname(oldBundles), state); assert.equal(path.dirname(retained), root);
    fs.renameSync(oldBundles, retained);
    restored = open(path.join(restoredRoot, '.zero-data'));
    const ready = await restored.manager.initialize();
    assert.deepEqual(ready.unavailable, []);
    const effect = await restored.engine.execute({ toolName: 'restore_effect', args: { value: 11 } });
    assert.equal(effect.result, 33);
    assert.equal(JSON.parse(fs.readFileSync(effect.output)).result, 33);
    assert.ok(effect.output.startsWith(path.join(restoredRoot, '.zero-data', 'plugin-sdk') + path.sep));
    const evidence = path.resolve('artifacts/restore-plugin', String(Date.now())); fs.mkdirSync(evidence, { recursive: true });
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify({ classification: ['INTEGRATION'], status: 'PASS', backup, relocatedPluginSources: result.relocatedPluginSources, originalPluginDataPreservedBeforeExecution: true, oldAbsoluteBundlePathUnavailable: true, actualRegisteredHandlerResult: effect.result, actualRestoredDataFileReadback: true, scope: 'Controlled actual executable plugin package; external/npm/MCP portability not established' }, null, 2));
  } finally {
    await original?.manager.close(); await restored?.manager.close();
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-plugin-restore-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { PluginManager, ZeroPlugin } from '../packages/plugin-sdk/index.mjs';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { handlePluginsUi, PLUGINS_UI_METHODS } from '../services/host/plugins-ui.mjs';

const runFile = promisify(execFile);
const quiet = { warn() {} };
const sdkUrl = new URL('../packages/plugin-sdk/index.mjs', import.meta.url).href;
const engineUrl = new URL('../packages/capability-engine/index.mjs', import.meta.url).href;

async function sandbox(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'zero-plugin-test-'));
  const managers = [];
  t.after(async () => {
    for (const manager of managers) await manager.close();
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('zero-plugin-test-'));
    await fs.rm(root, { recursive: true, force: true });
  });
  const dbPath = path.join(root, 'plugins.sqlite');
  const pluginsDir = path.join(root, 'managed');
  const open = () => {
    const engine = new CapabilityEngine({ operator: {}, logger: quiet });
    const manager = new PluginManager({ dbPath, pluginsDir, capabilityEngine: engine, logger: quiet });
    managers.push(manager);
    return { manager, engine };
  };
  return { root, dbPath, pluginsDir, open };
}

async function fixture(root, { id = 'actual-math', version = '1.0.0', factor = 1,
  capability = 'actual_dot', failEnable = false, failLoad = false, missing = false } = {}) {
  const directory = path.join(root, `source-${id.replaceAll('/', '-')}-${version}`);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'package.json'), JSON.stringify({
    name: id, version, type: 'module', main: 'index.mjs',
    scripts: { postinstall: "node -e \"require('fs').writeFileSync('POSTINSTALL_RAN','bad')\"" },
    zeroPlugin: { id, name: 'Actual Math', version, capabilities: [capability], config: { factor: 2 } },
  }));
  await fs.writeFile(path.join(directory, 'math.mjs'), `let calls = 0; export function dot(a,b) { calls++; return { value: a.reduce((n,x,i)=>n+x*b[i],0) * ${factor}, calls }; }`);
  await fs.writeFile(path.join(directory, 'index.mjs'), `
import fs from 'node:fs/promises';
import path from 'node:path';
import { dot } from './math.mjs';
export default {
  async onLoad(context) { this.context = context; await fs.appendFile(path.join(context.dataDir,'hooks.log'),'load\\n'); ${failLoad ? "throw new Error('load-boom');" : ''} },
  async onEnable() { await fs.appendFile(path.join(this.context.dataDir,'hooks.log'),'enable\\n'); ${failEnable ? "throw new Error('enable-boom');" : ''} },
  async onDisable() { await fs.appendFile(path.join(this.context.dataDir,'hooks.log'),'disable\\n'); },
  async onDestroy() { await fs.appendFile(path.join(this.context.dataDir,'hooks.log'),'destroy\\n'); },
  handlers: { ${missing ? '' : `${JSON.stringify(capability)}: async function ({a,b}) {
    const result = dot(a,b); result.value *= this.context.config.factor;
    const output = path.join(this.context.dataDir,'result.json');
    await fs.writeFile(output,JSON.stringify(result)); return {ok:true,...result,output};
  }`} }
};`);
  return directory;
}

const execute = (engine, args = { a: [2, 3], b: [4, 5] }, toolName = 'actual_dot') => engine.execute({ toolName, args });

test('directory install executes real output, gates handlers, restarts dependency state, updates and removes without deleting data', async (t) => {
  const box = await sandbox(t);
  const source = await fixture(box.root);
  const { manager, engine } = box.open();
  const installed = await manager.installPlugin(JSON.parse(JSON.stringify({ path: source, config: { factor: 3 } })));
  assert.equal(installed.runtimeStatus, 'active');
  const first = await execute(engine);
  assert.equal(first.value, 69);
  assert.deepEqual(JSON.parse(await fs.readFile(first.output, 'utf8')), { value: 69, calls: 1 });
  assert.equal(first.verified, false);
  assert.equal(first.completed, false);
  assert.equal(first.outcome, 'UNVERIFIED');
  const stale = engine.customCapabilities.get('actual_dot').handler;
  const disabled = await manager.disablePlugin(installed.id);
  assert.equal(disabled.status, 'disabled');
  assert.equal((await execute(engine)).error, 'capability-disabled');
  await assert.rejects(stale({ a: [1], b: [2] }), /capability-disabled/);
  await manager.enablePlugin(installed.id);
  assert.equal((await execute(engine)).value, 69);
  await manager.restartPlugin(installed.id);
  assert.equal((await execute(engine)).calls, 1, 'restart reloads relative dependencies as well as entry');
  await assert.rejects(stale({ a: [1], b: [2] }), /capability-disabled/);
  const v2 = await fixture(box.root, { version: '2.0.0', factor: 10, capability: 'actual_dot_v2' });
  const updated = await manager.updatePlugin(installed.id, { path: v2 });
  assert.equal(updated.version, '2.0.0');
  assert.deepEqual(updated.config, { factor: 3 });
  assert.equal(updated.installedAt, installed.installedAt);
  assert.equal(engine.customCapabilities.has('actual_dot'), false);
  assert.equal((await execute(engine, undefined, 'actual_dot_v2')).value, 690);
  await manager.removePlugin(installed.id);
  assert.equal(manager.getPlugin(installed.id), null);
  assert.equal(engine.getPlugin(installed.id), null);
  assert.equal(engine.customCapabilities.has('actual_dot_v2'), false);
  assert.equal(JSON.parse(await fs.readFile(first.output, 'utf8')).value, 690, 'data survives removal');
  assert.ok((await fs.readFile(path.join(path.dirname(first.output), 'hooks.log'), 'utf8')).includes('disable\ndestroy\n'));
  assert.ok(await fs.stat(path.join(source, 'index.mjs')), 'source directory untouched');
  assert.deepEqual(await fs.readdir(path.join(box.pluginsDir, 'releases')), []);
});

test('enabled and disabled installs restore in a genuinely fresh Node process without original sources', async (t) => {
  const box = await sandbox(t);
  const source = await fixture(box.root);
  const disabledSource = await fixture(box.root, { id: 'sleeping', capability: 'sleep_dot' });
  const { manager, engine } = box.open();
  const installed = await manager.installPlugin({ path: source, config: { factor: 4 } });
  const disabled = await manager.installPlugin({ path: disabledSource });
  await manager.disablePlugin(disabled.id);
  const output = (await execute(engine)).output;
  await manager.close();
  // Rename user sources inside our sandbox; persistence must use installed copies.
  await fs.rename(source, `${source}-offline`);
  await fs.rename(disabledSource, `${disabledSource}-offline`);
  const script = `
import {PluginManager} from ${JSON.stringify(sdkUrl)};
import {CapabilityEngine} from ${JSON.stringify(engineUrl)};
const ce = new CapabilityEngine({operator:{}});
const manager = new PluginManager({dbPath:process.argv[1],pluginsDir:process.argv[2],capabilityEngine:ce});
const ready = await manager.ready;
const result = await ce.execute({toolName:'actual_dot',args:{a:[7,2],b:[3,4]}});
const disabled = await ce.execute({toolName:'sleep_dot',args:{a:[1],b:[1]}});
console.log(JSON.stringify({ready,result,disabled,plugins:manager.listPlugins()}));
await manager.close();`;
  const child = await runFile(process.execPath, ['--input-type=module', '-e', script, box.dbPath, box.pluginsDir], { windowsHide: true });
  const result = JSON.parse(child.stdout.trim());
  assert.deepEqual(result.ready.unavailable, []);
  assert.equal(result.result.value, 116);
  assert.equal(result.disabled.error, 'capability-disabled');
  assert.equal(result.plugins.find((plugin) => plugin.id === installed.id).runtimeStatus, 'active');
  assert.equal(result.plugins.find((plugin) => plugin.id === disabled.id).status, 'disabled');
  assert.equal(JSON.parse(await fs.readFile(output, 'utf8')).value, 116);
  const again = box.open();
  await again.manager.ready;
  assert.equal((await execute(again.engine)).calls, 1, 'same-process reopen also reloads dependencies');
});

test('npm tarball installation executes code, ignores install scripts and persists offline', async (t) => {
  const box = await sandbox(t);
  const source = await fixture(box.root, { id: 'zero-test-packed-plugin' });
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const packed = await runFile(process.execPath, [npmCli, 'pack', '--ignore-scripts', '--json', '--pack-destination', box.root, source], { cwd: box.root, windowsHide: true });
  const archive = path.join(box.root, JSON.parse(packed.stdout)[0].filename);
  const { manager, engine } = box.open();
  const installed = await manager.installFromPackage(archive);
  assert.equal(installed.source.kind, 'package');
  const result = await execute(engine);
  assert.equal(result.value, 46);
  await assert.rejects(fs.access(path.join(installed.source.root, installed.source.packageRoot, 'POSTINSTALL_RAN')));
  await manager.close();
  await fs.rename(archive, `${archive}-offline`);
  const restored = box.open();
  await restored.manager.ready;
  assert.equal((await execute(restored.engine)).value, 46);
});

test('missing handlers, duplicate installs, ownership conflicts and failed hooks leave no phantom registration', async (t) => {
  const box = await sandbox(t);
  const { manager, engine } = box.open();
  await assert.rejects(manager.installPlugin({ id: 'json-only', capabilities: ['missing'] }, {}), /missing executable handler/);
  assert.equal(engine.getPlugin('json-only'), null);
  assert.equal(engine.customCapabilities.size, 0);
  const source = await fixture(box.root);
  await manager.installPlugin({ path: source });
  await assert.rejects(manager.installPlugin({ path: source }), /already installed/);
  const conflict = await fixture(box.root, { id: 'conflict' });
  await assert.rejects(manager.installPlugin({ path: conflict }), /owned by plugin/);
  const failing = await fixture(box.root, { id: 'broken', capability: 'broken_cap', failEnable: true });
  await assert.rejects(manager.installPlugin({ path: failing }), /enable-boom/);
  assert.equal(manager.getPlugin('broken'), null);
  assert.equal(engine.getPlugin('broken'), null);
  assert.equal(engine.customCapabilities.has('broken_cap'), false);
  assert.equal((await execute(engine)).value, 46);
  assert.equal((await fs.readdir(path.join(box.pluginsDir, 'releases'))).length, 1);
});

test('failed update rolls back working handlers and metadata; disabled update stays disabled', async (t) => {
  const box = await sandbox(t);
  const { manager, engine } = box.open();
  const source = await fixture(box.root);
  const installed = await manager.installPlugin({ path: source, config: { factor: 5 } });
  const failing = await fixture(box.root, { version: '2.0.0', factor: 100, failEnable: true });
  await assert.rejects(manager.updatePlugin(installed.id, { path: failing }), /enable-boom/);
  assert.equal(manager.getPlugin(installed.id).version, '1.0.0');
  assert.equal((await execute(engine)).value, 115);
  await manager.disablePlugin(installed.id);
  const v3 = await fixture(box.root, { version: '3.0.0', factor: 3 });
  const updated = await manager.updatePlugin(installed.id, { path: v3 });
  assert.equal(updated.status, 'disabled');
  assert.equal((await execute(engine)).error, 'capability-disabled');
  await manager.enablePlugin(installed.id);
  assert.equal((await execute(engine)).value, 345);
});

test('legacy metadata is preserved and honestly marked unavailable instead of fabricated as active', async (t) => {
  const box = await sandbox(t);
  const db = new DatabaseSync(box.dbPath);
  db.exec(`CREATE TABLE zero_installed_plugins (id TEXT PRIMARY KEY, name TEXT NOT NULL, version TEXT NOT NULL,
    description TEXT, status TEXT NOT NULL, config TEXT, permissions TEXT, capabilities TEXT,
    installed_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);`);
  db.prepare('INSERT INTO zero_installed_plugins VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run('legacy', 'User Plugin', '0.5', 'keep me', 'enabled', '{"secret":"retained"}', '["files"]', '["old_cap"]', 123, 456);
  db.close();
  const { manager, engine } = box.open();
  const report = await manager.ready;
  assert.equal(report.unavailable.length, 1);
  assert.deepEqual(manager.getPlugin('legacy').config, { secret: 'retained' });
  assert.equal(manager.getPlugin('legacy').installedAt, 123);
  assert.equal(manager.getPlugin('legacy').status, 'enabled', 'persisted intent is retained');
  assert.equal(manager.getDiagnostics().activePlugins, 0);
  assert.equal(manager.getDiagnostics().ok, false);
  assert.match(manager.getPlugin('legacy').error, /Executable source unavailable/);
  assert.equal(engine.customCapabilities.has('old_cap'), false);
});

test('disable waits for running handlers and prevents new calls; lifecycle requests serialize', async (t) => {
  const box = await sandbox(t);
  const { manager, engine } = box.open();
  let release;
  let entered;
  const started = new Promise((resolve) => { entered = resolve; });
  const wait = new Promise((resolve) => { release = resolve; });
  const instance = new ZeroPlugin();
  let disabled = false;
  instance.onDisable = async () => { disabled = true; };
  await manager.installPlugin({ id: 'pending', capabilities: ['pending_cap'] }, { pending_cap: async () => { entered(); await wait; return { value: 9 }; } }, instance);
  const execution = execute(engine, {}, 'pending_cap');
  await started;
  const disabling = manager.disablePlugin('pending');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(disabled, false);
  assert.equal((await execute(engine, {}, 'pending_cap')).error, 'capability-disabled');
  release();
  assert.equal((await execution).value, 9);
  await disabling;
  assert.equal(disabled, true);
  await Promise.all([manager.enablePlugin('pending'), manager.disablePlugin('pending')]);
  assert.equal(manager.getPlugin('pending').status, 'disabled');
  await manager.close();
  await assert.rejects(manager.enablePlugin('pending'), /closed/);
});

test('capability engine rejects missing handlers atomically and never treats mere return as verification', async () => {
  const engine = new CapabilityEngine({ operator: {} });
  assert.throws(() => engine.registerPlugin({ id: 'bad', capabilities: ['first', 'missing'] }, { first: async () => 1 }), /missing executable handler/);
  assert.equal(engine.customCapabilities.size, 0);
  assert.equal(engine.getPlugin('bad'), null);
  for (const [name, value] of Object.entries({
    plain: { answer: 42 }, failure: { ok: false, error: 'actual-failure' },
    claim: { verified: true }, proven: { verified: true, evidence: { file: 'verified-by-plugin' } },
  })) engine.registerCapability({ name, handler: async () => value });
  assert.equal((await execute(engine, {}, 'plain')).outcome, 'UNVERIFIED');
  const failure = await execute(engine, {}, 'failure');
  assert.equal(failure.ok, false);
  assert.equal(failure.error, 'actual-failure');
  assert.equal(failure.completed, false);
  assert.equal((await execute(engine, {}, 'claim')).verified, false);
  assert.equal((await execute(engine, {}, 'proven')).verified, true);
});

test('native UI adapter uses one real manager and native list/actions/inspect contracts', async (t) => {
  const box = await sandbox(t);
  const source = await fixture(box.root);
  const { manager, engine } = box.open();
  const rpc = (method, params = {}, options) => handlePluginsUi(method, JSON.parse(JSON.stringify(params)), manager, options);
  assert.ok(PLUGINS_UI_METHODS.includes('plugins.setEnabled'));
  assert.equal(await rpc('unrelated.method'), undefined);
  const installed = await rpc('plugins.install', { source: 'path', path: source, config: { factor: 6, secret: 'not-for-diagnostics' } });
  assert.equal(installed.plugin.installed, true);
  assert.equal(installed.plugin.enabled, true);
  assert.equal(installed.plugin.removable, true);
  assert.equal(installed.plugin.state, 'enabled');
  const list = await rpc('plugins.list');
  assert.equal(list.mutationAllowed, true);
  assert.equal(list.plugins.filter((plugin) => plugin.installed).length, 1, 'native UI installed filter finds real plugin');
  assert.equal(list.plugins[0].config, undefined);
  assert.equal(JSON.stringify(list).includes('not-for-diagnostics'), false);
  assert.equal((await execute(engine)).value, 138);
  const inspection = await rpc('plugins.inspect', { pluginId: 'actual-math' });
  assert.deepEqual(inspection.declared.tools, ['actual_dot']);
  assert.deepEqual(inspection.components.skills, []);
  const disabled = await rpc('plugins.setEnabled', { pluginId: 'actual-math', enabled: false });
  assert.equal(disabled.plugin.state, 'disabled');
  assert.ok(disabled.generation > list.generation);
  assert.equal((await execute(engine)).error, 'capability-disabled');
  await assert.rejects(rpc('plugins.setEnabled', { pluginId: 'actual-math', enabled: 'false' }), /boolean enabled/);
  await assert.rejects(rpc('plugins.setEnabled', { pluginId: 'actual-math', enabled: true }, { mutationAllowed: false }), /disabled/);
  await rpc('plugins.setEnabled', { pluginId: 'actual-math', enabled: true });
  const catalog = await rpc('plugins.catalog.browse', { intent: 'all' });
  assert.equal(catalog.items[0].local.installed, true);
  assert.match(catalog.remoteError, /unavailable/);
  assert.deepEqual((await rpc('plugins.catalog.get', { id: 'actual-math' })).detail.contracts.tools, ['actual_dot']);
  await assert.rejects(rpc('plugins.install', { source: 'clawhub', packageName: 'example' }), /unavailable/);
  const result = await execute(engine);
  const removed = await rpc('plugins.uninstall', { pluginId: 'actual-math' });
  assert.equal(removed.plugin.installed, false);
  assert.equal(removed.plugin.state, 'not-installed');
  assert.equal((await rpc('plugins.list')).plugins.length, 0);
  assert.equal(JSON.parse(await fs.readFile(result.output, 'utf8')).value, 138);
});

test('SQLite failures roll back install and update registrations without changing persisted config', async (t) => {
  const box = await sandbox(t);
  const { manager, engine } = box.open();
  await manager.ready;
  const source = await fixture(box.root);
  manager.db.exec("CREATE TRIGGER reject_install BEFORE INSERT ON zero_installed_plugins BEGIN SELECT RAISE(ABORT, 'db-install-boom'); END;");
  await assert.rejects(manager.installPlugin({ path: source }), /db-install-boom/);
  assert.equal(manager.listPlugins().length, 0);
  assert.equal(engine.customCapabilities.size, 0);
  assert.equal(engine.getPlugin('actual-math'), null);
  manager.db.exec('DROP TRIGGER reject_install');
  await manager.installPlugin({ path: source, config: { factor: 7 } });
  const updated = await fixture(box.root, { version: '2.0.0', factor: 10 });
  manager.db.exec("CREATE TRIGGER reject_update BEFORE UPDATE ON zero_installed_plugins BEGIN SELECT RAISE(ABORT, 'db-update-boom'); END;");
  await assert.rejects(manager.updatePlugin('actual-math', { path: updated }), /db-update-boom/);
  assert.equal(manager.getPlugin('actual-math').version, '1.0.0');
  assert.deepEqual(manager.getPlugin('actual-math').config, { factor: 7 });
  assert.equal((await execute(engine)).value, 161);
});

test('broken saved sources stay installed with explicit errors and do not prevent healthy restoration', async (t) => {
  const box = await sandbox(t);
  const { manager } = box.open();
  const brokenSource = await fixture(box.root, { id: 'broken-source', capability: 'broken_dot' });
  const healthySource = await fixture(box.root);
  const broken = await manager.installPlugin({ path: brokenSource });
  await manager.installPlugin({ path: healthySource });
  await manager.close();
  await fs.rename(path.join(broken.source.root, 'index.mjs'), path.join(broken.source.root, 'entry-offline.mjs'));
  const restored = box.open();
  const report = await restored.manager.ready;
  assert.equal(report.unavailable[0].id, 'broken-source');
  assert.equal(restored.manager.getPlugin('broken-source').runtimeStatus, 'unavailable');
  assert.equal(restored.manager.getPlugin('broken-source').status, 'enabled');
  assert.equal(restored.manager.getDiagnostics().activePlugins, 1);
  assert.equal((await execute(restored.engine)).value, 46);
  assert.equal(restored.engine.customCapabilities.has('broken_dot'), false);
});

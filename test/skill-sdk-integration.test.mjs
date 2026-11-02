import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { SkillLoader } from '../packages/skill-sdk/index.mjs';
import { TaskStateMachine } from '../packages/agent-runtime/index.mjs';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { handleSkillsUi, SKILLS_UI_METHODS } from '../services/host/skills-ui.mjs';

function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-skill-sdk-integration-'));
  t.sdkCleanup = [];
  t.after(async () => {
    for (const cleanup of [...t.sdkCleanup].reverse()) await cleanup();
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('zero-skill-sdk-integration-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return root;
}

function manifest(name = 'external-report', body = 'Use write_report to create the requested report and return the observed output.', extra = '') {
  return `---\nname: '${name}'\ndescription: >-\n  Produce a verified report\n  using available tools.\nversion: '1.0.0'\nallowed-tools: [write_report]\ntriggers:\n  - 'make report'\n${extra}---\n\n# Report\n\n${body}\n\n## Capabilities\n1. **Write a report**\n`;
}

function sourceAt(root, content = manifest(), folder = 'source') {
  const directory = path.join(root, folder);
  fs.mkdirSync(path.join(directory, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'SKILL.md'), content);
  fs.writeFileSync(path.join(directory, 'scripts', 'helper.txt'), 'supporting asset');
  return directory;
}

function runtime(t, root) {
  const stateMachine = new TaskStateMachine({ dbPath: path.join(root, 'tasks.sqlite') });
  t.sdkCleanup.push(() => stateMachine.close());
  const capabilityEngine = new CapabilityEngine({ operator: {} });
  return { stateMachine, capabilityEngine };
}

async function modelServer(t, handler) {
  const requests = [];
  const server = http.createServer(async (request, response) => {
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const payload = JSON.parse(Buffer.concat(chunks));
      requests.push(payload);
      const message = await handler(payload, requests.length);
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ choices: [{ message: { role: 'assistant', ...message }, finish_reason: message.tool_calls?.length ? 'tool_calls' : 'stop' }] }));
    } catch (error) { response.writeHead(500); response.end(JSON.stringify({ error: { message: error.message } })); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.sdkCleanup.push(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const modelFabric = new ModelFabric({ providers: [{ id: 'fixture', baseUrl: `http://127.0.0.1:${server.address().port}/v1`,
    apiKey: 'fixture-only', models: [{ id: 'fixture-model', tools: true }] }], aliases: { 'zero-lead': 'fixture-model' } });
  return { modelFabric, requests };
}

const call = (id, name, args) => ({ id, type: 'function', function: { name, arguments: JSON.stringify(args) } });

test('local install copies an external bundle; state, update, and uninstall survive fresh loaders', async t => {
  const root = temporary(t);
  const skillsDir = path.join(root, 'library');
  const source = sourceAt(root);
  const loader = new SkillLoader({ skillsDir });
  const installed = await loader.installSkill(path.join(source, 'SKILL.md'), { config: { format: 'text' } });
  assert.equal(installed.skill.description, 'Produce a verified report using available tools.');
  assert.deepEqual(installed.skill.capabilities, ['Write a report']);
  assert.equal(fs.readFileSync(path.join(skillsDir, 'external-report/scripts/helper.txt'), 'utf8'), 'supporting asset');
  assert.equal(loader.matchSkill('make report').skill.name, 'external-report');
  loader.disableSkill('external-report');
  loader.configureSkill('external-report', { destination: 'reports', env: { EXAMPLE_TOKEN: 'secret' } });
  const restarted = new SkillLoader({ skillsDir });
  assert.equal(restarted.getSkill('external-report').enabled, false);
  assert.equal(restarted.matchSkill('make report'), null);
  assert.deepEqual(restarted.getSkillConfig('external-report'), { format: 'text', destination: 'reports', env: { EXAMPLE_TOKEN: 'secret' } });
  fs.writeFileSync(path.join(source, 'SKILL.md'), manifest().replace("version: '1.0.0'", "version: '2.0.0'"));
  fs.writeFileSync(path.join(source, 'scripts/helper.txt'), 'updated asset');
  const updated = await restarted.updateSkill('external-report');
  assert.equal(updated.skill.version, '2.0.0');
  assert.equal(updated.skill.enabled, false);
  assert.equal(updated.skill.config.destination, 'reports');
  assert.equal(fs.readFileSync(path.join(updated.archivePath, 'bundle/scripts/helper.txt'), 'utf8'), 'supporting asset');
  assert.match(fs.readFileSync(path.join(updated.archivePath, 'bundle/SKILL.md'), 'utf8'), /version: '1.0.0'/);
  const prior = JSON.parse(fs.readFileSync(path.join(updated.archivePath, 'record.json')));
  assert.equal(prior.record.enabled, false);
  assert.equal(prior.record.config.env.EXAMPLE_TOKEN, 'secret');
  assert.equal(fs.readFileSync(path.join(skillsDir, 'external-report/scripts/helper.txt'), 'utf8'), 'updated asset');
  restarted.enableSkill('external-report');
  assert.equal(new SkillLoader({ skillsDir }).getSkill('external-report').enabled, true);
  await assert.rejects(loader.installSkill(source), /already installed/);
  const removed = restarted.uninstallSkill('external-report');
  assert.equal(fs.readFileSync(path.join(removed.archivePath, 'bundle/scripts/helper.txt'), 'utf8'), 'updated asset');
  assert.equal(fs.readFileSync(path.join(removed.archivePath, 'bundle/SKILL.md'), 'utf8'), fs.readFileSync(path.join(source, 'SKILL.md'), 'utf8'));
  const archived = JSON.parse(fs.readFileSync(path.join(removed.archivePath, 'record.json')));
  assert.equal(archived.name, 'external-report');
  assert.equal(archived.record.config.env.EXAMPLE_TOKEN, 'secret');
  assert.equal(archived.record.enabled, true);
  assert.equal(new SkillLoader({ skillsDir }).getSkill('external-report'), null);
  assert.ok(fs.existsSync(path.join(source, 'SKILL.md')), 'uninstall must preserve the original source');
  assert.equal(fs.existsSync(path.join(skillsDir, 'external-report')), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(loader.statePath)).skills, {});
});

test('GitHub tree and raw-file URLs clone actual git bundles and update recorded revisions, offline', async t => {
  const root = temporary(t);
  const repository = path.join(root, 'repository');
  fs.mkdirSync(repository);
  const git = args => execFileSync('git', args, { cwd: repository, windowsHide: true, stdio: 'pipe' }).toString().trim();
  git(['init', '-b', 'main']);
  const source = sourceAt(repository, manifest(), 'skills/report');
  const fixtureCommit = message => {
    git(['add', '.']);
    git(['-c', 'user.name=SDK fixture', '-c', 'user.email=sdk-fixture@example.invalid', 'commit', '-m', message]);
    return git(['rev-parse', 'HEAD']);
  };
  const firstRevision = fixtureCommit('temporary fixture v1');
  const count = Number(process.env.GIT_CONFIG_COUNT || 0);
  const changes = { GIT_CONFIG_COUNT: String(count + 1), [`GIT_CONFIG_KEY_${count}`]: `url.${pathToFileURL(repository).href}.insteadOf`,
    [`GIT_CONFIG_VALUE_${count}`]: 'https://github.com/sdk-fixture/report.git', GIT_ALLOW_PROTOCOL: 'file' };
  const saved = Object.fromEntries(Object.keys(changes).map(key => [key, process.env[key]]));
  Object.assign(process.env, changes);
  t.after(() => { for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const loader = new SkillLoader({ skillsDir: path.join(root, 'library') });
  const installed = await loader.installSkill('https://github.com/sdk-fixture/report/tree/main/skills/report');
  assert.equal(installed.skill.source.revision, firstRevision);
  assert.equal(installed.skill.source.subpath, 'skills/report');
  assert.equal(fs.existsSync(path.join(path.dirname(installed.path), '.git')), false);
  fs.writeFileSync(path.join(source, 'SKILL.md'), manifest().replace("version: '1.0.0'", "version: '2.0.0'"));
  const nextRevision = fixtureCommit('temporary fixture v2');
  const updated = await new SkillLoader({ skillsDir: loader.skillsDir }).updateSkill('external-report');
  assert.equal(updated.skill.source.revision, nextRevision);
  assert.equal(updated.skill.version, '2.0.0');
  loader.uninstallSkill('external-report');
  const raw = await loader.installSkill('https://raw.githubusercontent.com/sdk-fixture/report/main/skills/report/SKILL.md');
  assert.equal(raw.skill.source.revision, nextRevision);
  loader.uninstallSkill('external-report');
  const pinned = await loader.installSkill(`https://github.com/sdk-fixture/report/tree/${firstRevision}/skills/report`);
  assert.equal(pinned.skill.version, '1.0.0');
  assert.equal(pinned.skill.source.revision, firstRevision);
  await assert.rejects(loader.installSkill('https://github.com/sdk-fixture/report/tree/main/skills/report', { subpath: '../escape' }), /inside/);
});

test('failed and malicious updates preserve installed files/config and reject symlink escape', async t => {
  const root = temporary(t);
  const source = sourceAt(root);
  const loader = new SkillLoader({ skillsDir: path.join(root, 'library') });
  await loader.installSkill(source, { config: { preserve: true } });
  const original = loader.readSkillBundle('external-report');
  fs.writeFileSync(path.join(source, 'SKILL.md'), manifest('../escape'));
  await assert.rejects(loader.updateSkill('external-report'), /safe package name/);
  assert.equal(loader.readSkillBundle('external-report').revision, original.revision);
  fs.writeFileSync(path.join(source, 'SKILL.md'), manifest('different-name'));
  await assert.rejects(loader.updateSkill('external-report'), /cannot change its name/);
  fs.writeFileSync(path.join(source, 'SKILL.md'), manifest().replace('1.0.0', '2.0.0'));
  const save = loader._saveState;
  loader._saveState = () => { throw new Error('simulated registry write failure'); };
  await assert.rejects(loader.updateSkill('external-report'), /registry write failure/);
  assert.throws(() => loader.uninstallSkill('external-report'), /registry write failure/);
  loader._saveState = save;
  assert.equal(loader.readSkillBundle('external-report').revision, original.revision);
  assert.deepEqual(loader.getSkillConfig('external-report'), { preserve: true });
  const outside = path.join(root, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'preserved.txt'), 'user state');
  fs.symlinkSync(outside, path.join(source, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(loader.updateSkill('external-report'), /symbolic links/);
  assert.equal(fs.readFileSync(path.join(outside, 'preserved.txt'), 'utf8'), 'user state');
  assert.equal(loader.getSkill('external-report').version, '1.0.0');
});

test('actual ModelFabric HTTP loop dispatches a registered capability, produces an artifact, and persists a completed task', async t => {
  const root = temporary(t);
  const loader = new SkillLoader({ skillsDir: path.join(root, 'library') });
  await loader.installSkill(sourceAt(root), { config: { reportFormat: 'plain text', apiKey: 'private-fixture-secret', env: { PRIVATE_VALUE: 'private-env-secret' } } });
  const context = runtime(t, root);
  const outputPath = path.join(root, 'actual-report.txt');
  context.capabilityEngine.registerCapability({ name: 'write_report', description: 'Write a report artifact',
    parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
    handler: async ({ text }) => {
      fs.writeFileSync(outputPath, text);
      const readback = fs.readFileSync(outputPath, 'utf8');
      return { ok: readback === text, verified: readback === text,
        evidence: { path: outputPath, readback }, path: outputPath, bytes: Buffer.byteLength(readback) };
    } });
  const { modelFabric, requests } = await modelServer(t, (payload, turn) => {
    if (turn === 1) return { content: null, tool_calls: [call('write-1', 'write_report', { text: 'Observed report output' })] };
    const observation = JSON.parse(payload.messages.at(-1).content);
    assert.equal(payload.messages.at(-1).tool_call_id, 'write-1');
    assert.equal(observation.path, outputPath);
    return { content: `Wrote ${observation.bytes} bytes to ${observation.path}.` };
  });
  const result = await loader.executeSkill('external-report', { prompt: 'Create the report' }, { ...context, modelFabric });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.completed, true);
  assert.equal(fs.readFileSync(outputPath, 'utf8'), 'Observed report output');
  assert.match(result.output, /Wrote 22 bytes/);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].model, 'fixture-model');
  assert.deepEqual(requests[0].tools.map(tool => tool.function.name), ['write_report']);
  assert.match(requests[0].messages[0].content, /plain text/);
  assert.ok(!JSON.stringify(requests).includes('private-fixture-secret'));
  assert.ok(!JSON.stringify(requests).includes('private-env-secret'));
  assert.equal(context.capabilityEngine.getAuditLog().at(-1).decision, 'COMPLETED');
  assert.equal(context.stateMachine.getTask(result.taskId).status, 'COMPLETED');
  assert.equal(context.stateMachine.getTask(result.taskId).result.output, result.output);
  assert.deepEqual(context.stateMachine.getTaskSteps(result.taskId).map(step => step.toolName), ['model', 'write_report', 'model']);
  const reopened = new TaskStateMachine({ dbPath: context.stateMachine.dbPath });
  assert.equal(reopened.getTask(result.taskId).result.output, result.output);
  reopened.close();
});

test('execution propagates tool refusal, missing model, malformed arguments, and no-output failures', async t => {
  const root = temporary(t);
  const loader = new SkillLoader({ skillsDir: path.join(root, 'library') });
  await loader.installSkill(sourceAt(root));
  const context = runtime(t, root);
  context.capabilityEngine.registerCapability({ name: 'write_report', handler: async () => ({ ok: false, error: 'permission denied' }) });
  const refused = await loader.executeSkill('external-report', { toolName: 'write_report' }, context);
  assert.equal(refused.ok, false);
  assert.equal(refused.output, null);
  assert.match(refused.error, /permission denied/);
  assert.equal(context.stateMachine.getTask(refused.taskId).status, 'FAILED');
  const unavailable = await loader.executeSkill('external-report', { prompt: 'make report' }, context);
  assert.equal(unavailable.completed, false);
  assert.match(unavailable.error, /ModelFabric/);
  const { modelFabric } = await modelServer(t, () => ({ tool_calls: [{ ...call('bad-json', 'write_report', {}), function: { name: 'write_report', arguments: '{oops' } }] }));
  const malformed = await loader.executeSkill('external-report', {}, { ...context, modelFabric });
  assert.equal(malformed.ok, false);
  assert.match(malformed.error, /malformed tool arguments/);
  const emptyModel = await modelServer(t, () => ({ content: '' }));
  const empty = await loader.executeSkill('external-report', {}, { ...context, modelFabric: emptyModel.modelFabric });
  assert.equal(empty.ok, false);
  assert.match(empty.error, /no deliverable/);
  loader.disableSkill('external-report');
  await assert.rejects(loader.executeSkill('external-report', {}, context), /disabled/);
});

test('cancellation and task cancellation stop the loop and never mark work complete', async t => {
  const root = temporary(t);
  const loader = new SkillLoader({ skillsDir: path.join(root, 'library') });
  await loader.installSkill(sourceAt(root));
  const context = runtime(t, root);
  context.capabilityEngine.registerCapability({ name: 'write_report', handler: async () => { throw new Error('cancelled model must not invoke this capability'); } });
  const controller = new AbortController();
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  const modelFabric = { executeChat: (_payload, options) => { assert.ok(options.signal); entered(); return new Promise(() => {}); } };
  const pending = loader.executeSkill('external-report', {}, { ...context, modelFabric, signal: controller.signal });
  await started;
  controller.abort(new Error('caller cancelled'));
  const result = await pending;
  assert.equal(result.status, 'cancelled');
  assert.equal(result.completed, false);
  assert.equal(context.stateMachine.getTask(result.taskId).status, 'CANCELLED');
  const second = loader.executeSkill('external-report', {}, { ...context, modelFabric });
  const running = context.stateMachine.listTasks({ status: 'RUNNING' })[0];
  context.stateMachine.cancelTask(running.id, 'host cancelled');
  const hostCancelled = await second;
  assert.equal(hostCancelled.taskId, running.id);
  assert.equal(hostCancelled.status, 'cancelled');
});

test('native UI status/config/library/import use real persisted loader state and guarded bundle revisions', async t => {
  const root = temporary(t);
  const loader = new SkillLoader({ skillsDir: path.join(root, 'library') });
  const source = sourceAt(root, manifest('external-report', 'Produce the report.', `metadata:\n  openclaw:\n    emoji: '📋'\n    primaryEnv: SDK_FIXTURE_TOKEN\n    requires:\n      env: [SDK_FIXTURE_TOKEN]\n`));
  const installed = await handleSkillsUi('skills.install', { source: 'local', path: source }, loader);
  assert.equal(installed.code, 0);
  const before = await handleSkillsUi('skills.status', { agentId: 'zero' }, loader);
  assert.equal(before.agentId, 'zero');
  assert.equal(before.skills[0].skillKey, 'external-report');
  assert.equal(before.skills[0].eligible, false);
  assert.deepEqual(before.skills[0].missing.env, ['SDK_FIXTURE_TOKEN']);
  const update = await handleSkillsUi('skills.update', { skillKey: 'external-report', enabled: false, apiKey: 'private-fixture-key', env: { EXAMPLE: 'private-env' } }, loader);
  assert.equal(update.config.enabled, false);
  assert.equal(update.config.apiKey, '__OPENCLAW_REDACTED__');
  assert.ok(!JSON.stringify(update).includes('private-'));
  const restarted = new SkillLoader({ skillsDir: loader.skillsDir });
  assert.equal(restarted.getSkillConfig('external-report').apiKey, 'private-fixture-key');
  await handleSkillsUi('skills.update', { skillKey: 'external-report', enabled: true }, restarted);
  const after = await handleSkillsUi('skills.status', {}, restarted);
  assert.equal(after.skills[0].eligible, true);
  assert.deepEqual(after.skills[0].missing, { bins: [], anyBins: [], env: [], config: [], os: [] });
  assert.ok(!JSON.stringify(after).includes('private-fixture-key'));
  const listing = await handleSkillsUi('skills.library.list', { scope: 'all' }, restarted);
  assert.equal(listing.entries[0].enabled, true);
  const read = await handleSkillsUi('skills.library.read', { skillId: 'external-report' }, restarted);
  assert.equal(read.entry.revision, listing.entries[0].revision);
  const saved = await handleSkillsUi('skills.library.save', { skillId: 'external-report', expectedRevision: read.entry.revision,
    content: read.content + '\nUpdated workflow.', files: [], retainFiles: ['scripts/helper.txt'] }, restarted);
  assert.notEqual(saved.entry.revision, read.entry.revision);
  assert.equal(restarted.getSkill('external-report').source.type, 'local', 'saving edits must preserve the update source');
  assert.equal(restarted.readSkillBundle('external-report').files[0].content, 'supporting asset');
  await assert.rejects(handleSkillsUi('skills.library.save', { skillId: 'external-report', expectedRevision: read.entry.revision, content: read.content }, restarted), /revision conflict/);
  await assert.rejects(handleSkillsUi('skills.import', { content: manifest('traversal'), files: [{ path: '../escape', content: 'no' }] }, restarted), /relative paths/);
  const imported = await handleSkillsUi('skills.library.import', { content: manifest('second-report'), files: [{ path: 'assets/example.txt', content: 'example', encoding: 'utf8' }] }, restarted);
  assert.equal(imported.state, 'imported');
  assert.ok(restarted.getSkill('second-report'));
  const removed = await handleSkillsUi('skills.library.mutate', { skillId: 'second-report', expectedRevision: imported.entry.revision, action: 'remove' }, restarted);
  assert.equal(removed.entry.removed, true);
  assert.equal(new SkillLoader({ skillsDir: loader.skillsDir }).getSkill('second-report'), null);
  assert.equal(await handleSkillsUi('not.a.skill.method', {}, loader), undefined);
  assert.ok(SKILLS_UI_METHODS.includes('skills.library.save'));
  await assert.rejects(handleSkillsUi('skills.install', { source: 'clawhub', slug: 'some-skill' }, loader), /not available/);
});

test('turn limits, unregistered tools, echoed instructions, and deadlines cannot produce completed tasks', async t => {
  const root = temporary(t);
  const loader = new SkillLoader({ skillsDir: path.join(root, 'library') });
  await loader.installSkill(sourceAt(root));
  const context = runtime(t, root);
  let executed = 0;
  context.capabilityEngine.registerCapability({ name: 'write_report', handler: async () => {
    executed++;
    return { ok: true, verified: true, evidence: { computed: 2 }, value: 2 };
  } });
  const response = message => ({ data: { choices: [{ message: { role: 'assistant', ...message }, finish_reason: 'stop' }] } });
  let calls = 0;
  const looping = { executeChat: async () => response({ tool_calls: [call(`loop-${++calls}`, 'write_report', {})] }) };
  const exhausted = await loader.executeSkill('external-report', {}, { ...context, modelFabric: looping, maxTurns: 2 });
  assert.equal(exhausted.ok, false);
  assert.match(exhausted.error, /exceeded 2 model turns/);
  assert.equal(executed, 2);
  const unauthorized = { executeChat: async () => response({ tool_calls: [call('unregistered', 'unregistered_tool', {})] }) };
  const blocked = await loader.executeSkill('external-report', {}, { ...context, modelFabric: unauthorized });
  assert.equal(blocked.ok, false);
  assert.match(blocked.error, /not available/);
  assert.equal(executed, 2);
  const echo = { executeChat: async () => response({ content: loader.getSkill('external-report').content }) };
  const echoed = await loader.executeSkill('external-report', {}, { ...context, modelFabric: echo });
  assert.equal(echoed.ok, false);
  assert.match(echoed.error, /no deliverable/);
  const ignoresSignal = { executeChat: () => new Promise(() => {}) };
  const [timedOut] = await Promise.all([
    loader.executeSkill('external-report', {}, { ...context, modelFabric: ignoresSignal, timeoutMs: 15 }),
    new Promise(resolve => setTimeout(resolve, 30)),
  ]);
  assert.equal(timedOut.completed, false);
  assert.equal(timedOut.status, 'cancelled');
  assert.equal(context.stateMachine.listTasks({ status: 'COMPLETED' }).length, 0);
});

test('custom creation stays in skillsDir and corrupt registry data is never silently overwritten', async t => {
  const root = temporary(t);
  const loader = new SkillLoader({ skillsDir: path.join(root, 'library') });
  const created = loader.createCustomSkill({ name: 'Temp Created', description: 'A local workflow', triggers: ['custom trigger'], workflowSteps: ['Return a computed value'] });
  assert.equal(path.dirname(path.dirname(created.path)), loader.skillsDir);
  assert.equal(loader.matchSkill('custom trigger').skill.name, 'temp-created');
  loader.createCustomSkill({ name: 'temp-created', description: 'Updated description', overwrite: true });
  assert.equal(loader.getSkill('temp-created').description, 'Updated description');
  fs.writeFileSync(loader.statePath, 'invalid JSON');
  assert.throws(() => new SkillLoader({ skillsDir: loader.skillsDir }), /JSON/);
  assert.equal(fs.readFileSync(loader.statePath, 'utf8'), 'invalid JSON');
});

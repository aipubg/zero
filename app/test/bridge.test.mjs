import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(appRoot, '..');
const configUrl = pathToFileURL(path.join(appRoot, 'src/bridge/config.ts')).href;

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function readJson(target) {
  return JSON.parse(await readFile(target, 'utf8'));
}

async function walkSource(dir, files = []) {
  const { readdir } = await import('node:fs/promises');
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'test') continue;
      await walkSource(full, files);
    } else if (/\.(?:m?js|tsx?|json)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

test('Gateway bridge configuration validates required settings without secrets', async () => {
  const { loadConfig } = await import(configUrl);
  const stateDir = await mkdtemp(path.join(tmpdir(), 'zero-bridge-config-'));
  try {
    const config = loadConfig({
      GATEWAY_URL: 'ws://127.0.0.1:18789',
      ZERO_STATE_DIR: stateDir,
      ZERO_AGENT_RUN_TIMEOUT_MS: '0',
    });
    assert.equal(config.gatewayUrl, 'ws://127.0.0.1:18789');
    assert.equal(config.stateDir, stateDir);
    assert.equal(config.minProtocol, 4);
    assert.equal(config.maxProtocol, 4);
    assert.equal(config.role, 'operator');
    assert.equal(config.agentRunTimeoutMs, 0);
    assert.deepEqual(config.scopes, ['operator.read', 'operator.write', 'operator.approvals']);
    assert.equal(
      Object.keys(config).some((key) => /token|secret|key/i.test(key)),
      false,
      'bridge configuration must never expose credential fields',
    );

    assert.throws(() => loadConfig({ ZERO_STATE_DIR: stateDir }), /GATEWAY_URL/);
    assert.throws(
      () => loadConfig({ GATEWAY_URL: 'http://127.0.0.1:18789', ZERO_STATE_DIR: stateDir }),
      /ws:\/\/ or wss:\/\//,
    );
    assert.throws(
      () =>
        loadConfig({
          GATEWAY_URL: 'ws://127.0.0.1:18789',
          ZERO_STATE_DIR: stateDir,
          ZERO_AGENT_RUN_TIMEOUT_MS: 'soon',
        }),
      /ZERO_AGENT_RUN_TIMEOUT_MS/,
    );
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

test('legacy CopilotKit product path and its 403 route are absent', async () => {
  assert.equal(
    await exists(path.join(appRoot, 'src/server/runtime-scope.ts')),
    false,
    'the Intelligence route scope guard must not remain in the product tree',
  );
  assert.equal(
    await exists(path.join(appRoot, 'src/server/zero-runtime.ts')),
    false,
    'the CopilotKit Hono runtime must not remain in the product tree',
  );
  assert.equal(
    await exists(path.join(appRoot, 'src/client')),
    false,
    'the legacy React/CopilotKit client must not remain in the product tree',
  );

  const pkg = await readJson(path.join(appRoot, 'package.json'));
  const dependencies = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  for (const name of Object.keys(dependencies)) {
    assert.equal(
      /^(@copilotkit\/|@ag-ui\/)/.test(name),
      false,
      `legacy CopilotKit/AG-UI dependency must be removed: ${name}`,
    );
  }

  const files = [
    ...(await walkSource(path.join(appRoot, 'src'))),
    ...(await walkSource(path.join(appRoot, 'zero-control-ui'))),
  ];
  const forbidden = /@copilotkit|@ag-ui|api\/copilotkit|useCopilotKit|CopilotKitProvider/;
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    assert.equal(
      forbidden.test(text),
      false,
      `CopilotKit/AG-UI product-path reference found in ${path.relative(repoRoot, file)}`,
    );
  }
});

test('native plugin remains the single Zero UI surface', async () => {
  const manifest = await readJson(path.join(appRoot, 'zero-control-ui/openclaw.plugin.json'));
  assert.equal(manifest.id, 'zero-control-ui');
  // The plugin registers no SDK pages or navigation: the native screens are
  // extended in place, so there is no plugin-owned UI capability to advertise.
  assert.deepEqual(manifest.uiCapabilities, []);
  assert.equal(typeof manifest.controlUi?.entry, 'string');
  assert.ok(manifest.controlUi.entry.startsWith('dist/control-ui/'));
  assert.equal(manifest.controlUi.styles.length, 1);

  const browser = await readFile(path.join(appRoot, 'zero-control-ui/browser.js'), 'utf8');
  assert.doesNotMatch(browser, /registerPage|registerNavigation/);
  assert.match(browser, /installNativeSurfaces/);
  assert.match(browser, /installLegacyRouteInterceptor/);

  // The duplicate Team page is gone; its responsibilities moved into the
  // native chat and native Agents screen.
  await assert.rejects(
    () => readFile(path.join(appRoot, 'zero-control-ui/src/pages/team.js'), 'utf8'),
    /ENOENT/,
  );

  const nativeSources = [
    ...(await walkSource(path.join(appRoot, 'zero-control-ui/src'))),
  ];
  for (const file of nativeSources) {
    const text = await readFile(file, 'utf8');
    assert.doesNotMatch(
      text,
      new RegExp("threads\\.json|zero-thread-|sessions\\.create\\(\\{\\s*sdkThreadId"),
      `legacy thread store reference found in ${path.relative(repoRoot, file)}`,
    );
  }
});

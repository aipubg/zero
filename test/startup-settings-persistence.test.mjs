import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventAutomationEngine } from '../packages/automation/event-automation.mjs';
import { WorkspaceManager } from '../packages/workspaces/index.mjs';

test('[INTEGRATION] startup defaults preserve owner connector config and worker definitions across database reopen', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-owner-settings-'));
  const eventsPath = path.join(directory, 'events.sqlite');
  const workersPath = path.join(directory, 'workers.sqlite');
  let events = new EventAutomationEngine({ dbPath: eventsPath });
  let workers = new WorkspaceManager({ dbPath: workersPath, baseStorageDir: path.join(directory, 'workspaces') });
  try {
    events.registerConnector({ id: 'webhook_system', name: 'Owner custom webhook', type: 'webhook', config: { url: 'http://127.0.0.1:12345/owner', customSetting: 'preserve' } });
    events.registerConnector({ id: 'cli_terminal', name: 'Owner CLI', type: 'cli', config: { binary: 'owner-cli.exe' } });
    workers.registerWorker({ id: 'worker_local_primary', name: 'Owner local machine', capabilities: ['local_process', 'owner_description'] });
    const beforeConnectors = events.listConnectors();
    const beforeWorker = workers.getWorker('worker_local_primary');
    events.close(); await workers.close();
    events = new EventAutomationEngine({ dbPath: eventsPath });
    workers = new WorkspaceManager({ dbPath: workersPath, baseStorageDir: path.join(directory, 'workspaces') });
    assert.deepEqual(events.listConnectors(), beforeConnectors);
    assert.deepEqual(events.connectors.get('webhook_system'), beforeConnectors.find(connector => connector.id === 'webhook_system'));
    const afterWorker = workers.getWorker('worker_local_primary');
    const { lastHeartbeat: beforeTime, ...beforeDefinition } = beforeWorker;
    const { lastHeartbeat: afterTime, ...afterDefinition } = afterWorker;
    assert.deepEqual(afterDefinition, beforeDefinition);
    assert.ok(afterTime >= beforeTime);
  } finally {
    events.close(); await workers.close();
    assert.equal(fs.realpathSync(path.dirname(directory)), fs.realpathSync(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

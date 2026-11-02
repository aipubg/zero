/** REAL_OS/REAL_BROWSER: captured window transition invokes an actual native action. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from '../backend/node_modules/playwright-core/index.mjs';
import { createScreenObserver } from '../packages/screen-intelligence/index.mjs';
import { EventAutomationEngine } from '../packages/automation/event-automation.mjs';
import { canonicalCapabilityEngine } from '../packages/capability-engine/index.mjs';
import { connectScreenAutomation } from '../services/host/screen-automation.mjs';
import { stopDaemon } from '../app/zero-control-ui/src/computer/windows-driver.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'artifacts/screen-automation', String(Date.now()));
fs.mkdirSync(directory, { recursive: true });
const marker = `ZeroAutomationTransition${Date.now()}`;
const report = { classification: ['REAL_OS', 'REAL_BROWSER', 'INTEGRATION'], status: 'RUNNING', startedAt: new Date().toISOString(),
  scope: 'Actual Windows captured title transition through rule matching to native screen-size output; not every OS event source or UI rule configuration' };
const actions = [];
const automation = new EventAutomationEngine({ dbPath: path.join(directory, 'rules.sqlite'), executor: async (action, params) => {
  const result = await canonicalCapabilityEngine.execute({ agentId: 'zero', toolName: 'zero_computer_action', args: { ...params, action } });
  actions.push({ action, source: params.triggerEvent?.source, observationId: params.triggerEvent?.observationId, result });
  return result;
} });
const observer = createScreenObserver({ dataDir: directory, captureIntervalMs: 60000 });
const bridge = connectScreenAutomation(observer, automation);
let browser;
try {
  automation.registerRule({ id: 'actual-window-transition', eventType: 'screen:window_changed', condition: { field: 'windowTitle', contains: marker }, targetAction: 'get_screen_size' });
  browser = await chromium.launch({ channel: 'chrome', headless: false });
  const page = await browser.newPage();
  await page.setContent('<title>Zero Automation Baseline</title><h1>Controlled automation acceptance window</h1>');
  await page.bringToFront();
  observer.start(); await observer.captureTick();
  assert.match(observer.store.getLatestContext().window_context, /Zero Automation Baseline/);
  assert.equal(actions.length, 0);
  await page.evaluate(title => { document.title = title; }, marker);
  const titleDeadline = Date.now() + 10000;
  do {
    await new Promise(resolve => setTimeout(resolve, 100));
    await observer.captureTick();
    if (observer.store.getLatestContext().window_context.includes(marker)) break;
  } while (Date.now() < titleDeadline);
  assert.ok(observer.store.getLatestContext().window_context.includes(marker), 'The OS capture must actually observe the new browser title');
  const deadline = Date.now() + 10000;
  while (!actions.length && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(actions.length, 1);
  const observed = actions[0];
  assert.equal(observed.source, 'native-screen-observer');
  assert.ok(observed.observationId); assert.equal(observed.result.executed, true);
  assert.ok(observed.result.data.width > 0 && observed.result.data.height > 0);
  await observer.captureTick(); await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(actions.length, 1, 'The same window must not retrigger merely because another frame arrived');
  report.bridge = bridge.status();
  report.action = { name: observed.action, observationId: observed.observationId, width: observed.result.data.width, height: observed.result.data.height, independentlyVerified: false };
  report.captures = observer.stats.totalFramesIngested; report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.message; report.bridge = bridge.status(); report.captures = observer.stats.totalFramesIngested; process.exitCode = 1; }
finally {
  await observer.stop(); await bridge.close(); await observer.destroy(); automation.close();
  await browser?.close(); stopDaemon(); report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, directory }, null, 2));
}

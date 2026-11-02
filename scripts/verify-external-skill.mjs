/** REAL_EXTERNAL + REAL_BROWSER: install a pinned community skill and verify its actual artifact. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { SkillLoader } from '../packages/skill-sdk/index.mjs';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { registerLocalTools } from '../packages/capability-engine/local-tools.mjs';
import { TaskStateMachine } from '../packages/agent-runtime/index.mjs';
import { chromium } from '../backend/node_modules/playwright-core/index.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
process.loadEnvFile(path.join(repo, '.env'));
const resume = process.argv[2] === '--resume-directory' ? process.argv[3] : null;
if (process.argv.length > 2 && (!resume || process.argv.length !== 4)) throw new Error('Usage: node scripts/verify-external-skill.mjs [--resume-directory DIR]');
const directory = resume ? path.resolve(resume) : fs.mkdtempSync(path.join(os.tmpdir(), 'zero-external-skill-'));
const evidence = path.join(repo, 'artifacts/external-skill', String(Date.now()));
fs.mkdirSync(evidence, { recursive: true });
const output = path.join(directory, 'community-skill-counter.html');
const report = { classification: ['REAL_EXTERNAL', 'REAL_BROWSER'], startedAt: new Date().toISOString(), status: 'RUNNING', directory, evidence };
let tasks, browser;
try {
  const loader = new SkillLoader({ skillsDir: path.join(directory, 'skills') });
  const source = 'https://github.com/anthropics/skills/tree/ca45fc496a3436251f191354091d557da31c15b5/skills/frontend-design';
  const installed = resume ? { skill: loader.getSkill('frontend-design') } : await loader.installSkill(source);
  report.source = installed.skill.source;
  assert.equal(report.source.revision, 'ca45fc496a3436251f191354091d557da31c15b5');
  const engine = new CapabilityEngine({ operator: {} });
  registerLocalTools(engine, { cwd: directory });
  tasks = new TaskStateMachine({ dbPath: path.join(directory, 'tasks.sqlite') });
  const modelFabric = new ModelFabric();
  const expectedModel = modelFabric.resolveAgentModel('zero')?.canonicalModelId;
  const result = resume ? tasks.listTasks({ status: 'COMPLETED' }).find(task => task.result?.skillName === 'frontend-design')?.result : await loader.executeSkill('frontend-design', {
    goal: `Create a polished, self-contained HTML counter as a small functional artifact. It must display an integer initially 0 in an element with id="count" and one button labelled "Increment" that increases the integer by one on each click. Save the HTML at ${output} using write_file. No remote scripts, network dependencies or frameworks. Use the installed design skill. Verify the file with read_file and return its exact path.`,
  }, { stateMachine: tasks, capabilityEngine: engine, modelFabric, timeoutMs: 120000 });
  assert.ok(result, 'No completed execution found to verify');
  report.reusedPersistedExecution = Boolean(resume);
  report.execution = { ok: result.ok, status: result.status, taskId: result.taskId, error: result.error, output: result.output,
    steps: result.executedSteps.map(step => ({ capability: step.capability, status: step.status })) };
  assert.equal(result.ok, true, result.error);
  assert.equal(tasks.getTask(result.taskId).status, 'COMPLETED');
  if (!resume) {
    assert.equal(result.model, expectedModel);
    const modelSteps = tasks.getTaskSteps(result.taskId).filter(step => step.toolName === 'model');
    assert.ok(modelSteps.length > 0);
    for (const step of modelSteps) assert.equal(step.toolArgs.model, expectedModel);
    report.modelAssignment = { agentId: 'zero', expectedModel, recordedModel: result.model, modelRounds: modelSteps.length };
  }
  assert.ok(result.executedSteps.some(step => step.capability === 'write_file'));
  const content = fs.readFileSync(output);
  report.artifact = { bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') };
  fs.copyFileSync(output, path.join(evidence, 'community-skill-counter.html'));
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL(`file:///${output.replaceAll('\\', '/')}`).href);
  assert.equal((await page.locator('#count').innerText()).trim(), '0');
  await page.locator('button').filter({ hasText: /^Increment$/ }).click();
  assert.equal((await page.locator('#count').innerText()).trim(), '1');
  await page.locator('button').filter({ hasText: /^Increment$/ }).click();
  assert.equal((await page.locator('#count').innerText()).trim(), '2');
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(evidence, 'counter-after-clicks.png') });
  report.independentVerification = { initial: 0, afterTwoClicks: 2, browserErrors: errors };
  const freshLoader = new SkillLoader({ skillsDir: loader.skillsDir });
  assert.equal(freshLoader.getSkill('frontend-design').source.revision, report.source.revision);
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.message; process.exitCode = 1; }
finally {
  await browser?.close();
  tasks?.close();
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

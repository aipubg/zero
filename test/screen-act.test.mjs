// screen_act against a local fake of the Gemini Interactions API.
// No real screen, key or desktop input is used: hands, capture and the
// foreground window are recorded fakes.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createScreenAct } from '../packages/capability-engine/screen-act.mjs';

const settings = { apiKey: 'test-key', config: { computerUseModel: 'fake-cu', computerUseEnvironment: 'browser', excludedApps: ['KeePass'] } };

async function fakeGemini(t, replies) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    requests.push({ body, key: req.headers['x-goog-api-key'] });
    const reply = replies.shift() || { status: 200, json: { id: 'end', steps: [{ type: 'model_output', content: [{ type: 'text', text: 'Done.' }] }] } };
    res.writeHead(reply.status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(reply.json));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  return { url: `http://127.0.0.1:${server.address().port}/v1beta/interactions`, requests };
}

function fakes({ front = { title: 'Untitled - Notepad', process: 'Notepad' } } = {}) {
  const acts = [];
  const state = { front };
  return {
    acts, state,
    deps: {
      act: async (action, args) => { acts.push({ action, args }); return { ok: true }; },
      openApp: async app => { acts.push({ action: 'open_app', args: { app } }); return { ok: true, window: { title: `${app} window` } }; },
      capture: async () => ({ base64: 'SU1BR0U=', mimeType: 'image/jpeg' }),
      screenSize: async () => ({ width: 1920, height: 1080 }),
      foreground: async () => state.front,
    },
  };
}

const call = (id, name, args) => ({ type: 'function_call', id, name, arguments: { intent: name, ...args } });

test('screen_act is unavailable when online screen share is off', async () => {
  const { deps } = fakes();
  const screenAct = createScreenAct({ ...deps, getSettings: () => null });
  const result = await screenAct({ goal: 'x' });
  assert.equal(result.error, 'screen-share-offline');
});

test('screen_act scales 0-999 coordinates, types only into the clicked window and finishes', async t => {
  const gemini = await fakeGemini(t, [
    { status: 200, json: { id: 'i1', steps: [call('c1', 'click', { x: 500, y: 500 }), call('c2', 'type', { text: 'hello', press_enter: true })] } },
    { status: 200, json: { id: 'i2', steps: [{ type: 'model_output', content: [{ type: 'text', text: 'Typed hello.' }] }] } },
  ]);
  const { deps, acts } = fakes();
  const screenAct = createScreenAct({ ...deps, getSettings: () => settings, interactionsUrl: gemini.url });
  const result = await screenAct({ goal: 'type hello in notepad' });

  assert.equal(result.outcome, 'COMPLETED');
  assert.equal(result.summary, 'Typed hello.');
  assert.deepEqual(acts, [
    { action: 'left_click', args: { x: 960, y: 540 } },
    { action: 'type_text', args: { text: 'hello', target: 'Untitled - Notepad' } },
    { action: 'press_key', args: { key: 'enter', target: 'Untitled - Notepad' } },
  ]);
  const [first, second] = gemini.requests;
  assert.equal(first.key, 'test-key');
  assert.equal(first.body.model, 'fake-cu');
  assert.deepEqual(first.body.tools[0].excluded_predefined_functions, ['navigate', 'go_back', 'go_forward']);
  assert.equal(first.body.input[1].type, 'image');
  assert.equal(second.body.previous_interaction_id, 'i1');
  assert.deepEqual(second.body.input.map(r => r.call_id), ['c1', 'c2']);
  assert.equal(second.body.input[0].result.length, 1, 'only the last result carries the screenshot');
  assert.equal(second.body.input[1].result[1].type, 'image');
});

test('keys are refused until something was clicked in this run', async t => {
  const gemini = await fakeGemini(t, [
    { status: 200, json: { id: 'i1', steps: [call('c1', 'hotkey', { keys: ['Control', 's'] })] } },
  ]);
  const { deps, acts } = fakes();
  const screenAct = createScreenAct({ ...deps, getSettings: () => settings, interactionsUrl: gemini.url });
  const result = await screenAct({ goal: 'save' });
  assert.equal(result.outcome, 'COMPLETED');
  assert.deepEqual(acts, [], 'no keystroke was sent');
  assert.match(JSON.parse(gemini.requests[1].body.input[0].result[0].text).error, /Click the field or window first/);
});

test('an action that needs confirmation waits for the owner, then continues', async t => {
  const gemini = await fakeGemini(t, [
    { status: 200, json: { id: 'i1', steps: [call('c1', 'click', { x: 100, y: 200, safety_decision: { decision: 'require_confirmation', explanation: 'Sends a message' } })] } },
    { status: 200, json: { id: 'i2', steps: [{ type: 'model_output', content: [{ type: 'text', text: 'Sent.' }] }] } },
  ]);
  const { deps, acts } = fakes();
  const screenAct = createScreenAct({ ...deps, getSettings: () => settings, interactionsUrl: gemini.url });

  const paused = await screenAct({ goal: 'send it' });
  assert.equal(paused.outcome, 'BLOCKED');
  assert.equal(paused.needsConfirmation, true);
  assert.equal(paused.explanation, 'Sends a message');
  assert.deepEqual(acts, [], 'nothing was clicked before the owner confirmed');

  const resumed = await screenAct({ confirm_token: paused.confirm_token });
  assert.equal(resumed.outcome, 'COMPLETED');
  assert.deepEqual(acts, [{ action: 'left_click', args: { x: 192, y: 216 } }]);
  const sent = JSON.parse(gemini.requests[1].body.input[0].result[0].text);
  assert.equal(sent.safety_acknowledgement, true);
  assert.equal(gemini.requests[1].body.previous_interaction_id, 'i1');

  const reused = await screenAct({ confirm_token: paused.confirm_token });
  assert.equal(reused.error, 'confirm-token-expired', 'a token works once');
});

test('nothing is sent while an excluded app is in front', async t => {
  const gemini = await fakeGemini(t, []);
  const { deps, acts } = fakes({ front: { title: 'Database.kdbx - KeePass', process: 'KeePass' } });
  const screenAct = createScreenAct({ ...deps, getSettings: () => settings, interactionsUrl: gemini.url });
  const result = await screenAct({ goal: 'anything' });
  assert.equal(result.error, 'excluded-app-in-front');
  assert.equal(gemini.requests.length, 0);
  assert.deepEqual(acts, []);
});

test('the transient "safety violations" refusal is retried', async t => {
  const gemini = await fakeGemini(t, [
    { status: 400, json: { error: { message: 'Request blocked due to safety violations (harmful content).' } } },
    { status: 200, json: { id: 'i1', steps: [{ type: 'model_output', content: [{ type: 'text', text: 'Nothing to do.' }] }] } },
  ]);
  const { deps } = fakes();
  const screenAct = createScreenAct({ ...deps, getSettings: () => settings, interactionsUrl: gemini.url, retryDelaysMs: [1, 1] });
  const result = await screenAct({ goal: 'look' });
  assert.equal(result.outcome, 'COMPLETED');
  assert.equal(gemini.requests.length, 2);
});

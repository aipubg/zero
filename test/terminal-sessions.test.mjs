import test from 'node:test';
import assert from 'node:assert/strict';
import { TerminalManager } from '../packages/capability-engine/terminal-sessions.mjs';

test('terminal sessions keep state, report exit status and never show the marker', { skip: process.platform !== 'win32' && 'Windows shells only' }, async t => {
  const m = new TerminalManager({ defaultCwd: process.cwd() });
  t.after(() => m.closeAll());
  let live = '';
  m.on('output', e => { live += e.data; });

  const ps = m.open({ shell: 'powershell', owner: 'zero' });
  const first = await m.run(ps.id, 'Set-Location test; (Get-Location).Path', { timeoutMs: 30000 });
  assert.equal(first.ok, true);
  assert.equal(first.exitCode, 0);
  assert.match(first.output, /test\s*$/m);

  const second = await m.run(ps.id, '(Get-Location).Path', { timeoutMs: 30000 });
  assert.match(second.output, /test\s*$/m, 'the working folder persists between commands');

  const failed = await m.run(ps.id, 'Get-Item does-not-exist-zero', { timeoutMs: 30000 });
  assert.equal(failed.ok, false);
  assert.equal(failed.exitCode, 1);

  const cmd = m.open({ shell: 'cmd' });
  const echoed = await m.run(cmd.id, 'echo hello-cmd', { timeoutMs: 30000 });
  assert.match(echoed.output, /hello-cmd/);

  assert.equal(live.includes('__ZERO_DONE_'), false, 'the completion marker is hidden from viewers');
  assert.equal(m.list().length, 2);
  m.close(cmd.id);
  assert.equal(m.list().length, 1);
  assert.throws(() => m.open({ shell: 'bash' }), /Unknown shell/);
});

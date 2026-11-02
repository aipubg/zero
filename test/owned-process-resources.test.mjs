import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { sampleOwnedProcessTree } from '../packages/screen-intelligence/process-tree-resources.mjs';

test('[REAL_OS] resource window includes actual owned allocation and excludes its sampler', { skip: process.platform !== 'win32', timeout: 15000 }, async () => {
  const child = spawn(process.execPath, ['-e', "global.allocated=Buffer.alloc(64*1024*1024,123);process.stdout.write('ready');setInterval(()=>{},1000)"], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    await once(child.stdout, 'data');
    const sample = await sampleOwnedProcessTree();
    assert.equal(sample.status, 'measured');
    const owned = sample.processes.find(row => row.pid === child.pid);
    assert.ok(owned && owned.workingSetBytes > 64 * 1024 * 1024);
    assert.ok(sample.processes.some(row => row.pid === process.pid));
    assert.ok(!sample.processes.some(row => row.pid === sample.excludedSamplerPid));
    assert.equal(sample.sampledWorkingSetBytes, sample.processes.reduce((sum, row) => sum + row.workingSetBytes, 0));
    assert.equal(sample.sampledPrivateMemoryBytes, sample.processes.reduce((sum, row) => sum + row.privateMemoryBytes, 0));
    assert.ok(Date.parse(sample.completedAt) >= Date.parse(sample.startedAt));
    const exited = once(child, 'exit'); child.kill(); await exited;
    const after = await sampleOwnedProcessTree();
    assert.ok(!after.processes.some(row => row.pid === child.pid));
  } finally { if (child.exitCode === null && child.signalCode === null) { const closed = once(child, 'exit'); child.kill(); await closed; } }
});

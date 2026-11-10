import test from 'node:test';
import assert from 'node:assert/strict';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';

test('[CONTRACT] supplied operator failure cannot become success from executed/verified flags', async () => {
  const engine = new CapabilityEngine({ operator: {
    evaluateSafety: () => ({ allowed: true }),
    execute: async () => ({ ok: false, executed: true, verified: true, outcome: 'COMPLETED', error: 'Readback failed' }),
  } });
  const result = await engine.execute({ toolName: 'zero_computer_action', args: { action: 'desktop', command: 'click' } });
  assert.equal(result.executed, true);
  assert.equal(result.ok, false); assert.equal(result.verified, false); assert.equal(result.completed, false);
  assert.equal(result.outcome, 'FAILED');
});

test('[CONTRACT] cancellation dominates a late successful native completion', async () => {
  const controller = new AbortController();
  const engine = new CapabilityEngine({ operator: {
    evaluateSafety: () => ({ allowed: true }),
    execute: async () => { controller.abort(); return { ok: true, executed: true, verified: true, outcome: 'COMPLETED' }; },
  } });
  const result = await engine.execute({ toolName: 'zero_computer_action', args: { action: 'desktop', command: 'click' }, signal: controller.signal });
  assert.equal(result.ok, false); assert.equal(result.verified, false); assert.equal(result.completed, false);
  assert.equal(result.outcome, 'CANCELLED');
});

test('[CONTRACT] browser open/search aliases reach the supported operator with original arguments', async () => {
  const calls=[];
  const engine=new CapabilityEngine({operator:{evaluateSafety:()=>({allowed:true}),execute:async(action,args)=>{calls.push({action,args});return {ok:true,executed:true,verified:false,outcome:'UNVERIFIED'};}}});
  const opened=await engine.execute({toolName:'browser',args:{action:'open',url:'https://example.com'}});
  assert.equal(opened.ok,true);assert.equal(opened.verified,false);assert.equal(calls[0].action,'open_url');assert.equal(calls[0].args.url,'https://example.com');
  const searched=await engine.execute({toolName:'browser',args:{action:'search',query:'original exact query'}});
  assert.equal(searched.ok,true);assert.equal(searched.verified,false);assert.equal(calls[1].action,'web_search');assert.equal(calls[1].args.query,'original exact query');
  const refused=await engine.execute({toolName:'browser',args:{action:'made_up'}});
  assert.equal(refused.ok,false);assert.equal(calls.length,2);
});

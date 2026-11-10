/** REAL_BROWSER + INTEGRATION: real cookie expiry/renewal and authenticated RPC effects, no endurance claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '../backend/node_modules/playwright-core/index.mjs';
import {ZeroNativeHost} from '../services/host/native-gateway.mjs';

async function fixture(t, maxAgeMs) {
  const root=fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(),'zero-session-browser-')));
  for(const [file,text] of [['config.json','{}'],['providers.json','[]'],['bindings.json','{}']])fs.writeFileSync(path.join(root,file),text);
  const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
  const options={port,dataDir:path.join(root,'data'),prefsPath:path.join(root,'prefs.json'),skillsDir:path.join(root,'skills'),localModelsDir:path.join(root,'models'),configPath:path.join(root,'config.json'),providersPath:path.join(root,'providers.json'),agentBindingsPath:path.join(root,'bindings.json'),desktopSessionMaxAgeMs:maxAgeMs};
  let host=new ZeroNativeHost(options),browser;
  t.after(async()=>{await browser?.close();await host.close();const resolved=fs.realpathSync.native(root);assert.equal(path.dirname(resolved),fs.realpathSync.native(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('zero-session-browser-'));fs.rmSync(resolved,{recursive:true,force:true});});
  await host.start();
  const executablePath=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
  assert.ok(executablePath,'Installed browser prerequisite');browser=await chromium.launch({executablePath,headless:true});
  const context=await browser.newContext(),page=await context.newPage(),base=`http://127.0.0.1:${port}`;
  await page.goto(base+'/chat/zero');await page.locator('.zero-shell-connection[data-connected="true"]').waitFor();
  return {root,page,context,base,get host(){return host;},async restart(){await host.close();host=new ZeroNativeHost(options);await host.start();}};
}

async function eventually(predicate, timeout=10000) {
  const end=Date.now()+timeout;
  while(Date.now()<end){if(await predicate())return;await delay(80);}
  assert.fail('Actual outcome did not arrive before deadline');
}

async function remember(page, content) {
  return page.evaluate(content=>new Promise((resolve,reject)=>{
    const socket=new WebSocket(location.origin.replace('http:','ws:'));
    const timer=setTimeout(()=>{socket.close();reject(Error('Authenticated effect timed out'));},5000);
    socket.onerror=()=>{clearTimeout(timer);reject(Error('Socket failed'));};
    socket.onopen=()=>socket.send(JSON.stringify({type:'req',id:'connect',method:'connect',params:{minProtocol:4}}));
    socket.onmessage=event=>{const frame=JSON.parse(event.data);if(!frame.id)return;if(!frame.ok){clearTimeout(timer);socket.close();reject(Error('RPC refused'));return;}if(frame.id==='connect')socket.send(JSON.stringify({type:'req',id:'write',method:'memory.remember',params:{content,layer:'semantic'}}));else if(frame.id==='write'){clearTimeout(timer);socket.close();resolve(frame.payload);}};
  }),content);
}

test('native UI renews its same HttpOnly session past original expiry and recovers after host restart', {timeout:45000}, async t=>{
  const f=await fixture(t,4000);
  const cookie=(await f.context.cookies()).find(c=>c.name==='zero_session');
  assert.ok(cookie?.httpOnly);assert.equal(cookie.sameSite,'Strict');
  const original=f.host.localDesktopSessions.get(cookie.value);assert.ok(original);
  await eventually(()=>Date.now()>original.expiresAt+100,7000);
  const renewed=f.host.localDesktopSessions.get(cookie.value);assert.ok(renewed,'Same bearer must remain live after its original real-time expiry');assert.ok(renewed.expiresAt>original.expiresAt);
  assert.equal(f.host.localDesktopSessions.sessions.size,1);
  assert.equal((await f.context.cookies()).find(c=>c.name==='zero_session').value,cookie.value);
  assert.ok(!fs.readFileSync(f.host.localDesktopSessions.filePath,'utf8').includes(cookie.value));
  await remember(f.page,'SESSION_RENEWAL_REAL_EFFECT');
  assert.ok(f.host.unifiedMemory.recall('SESSION_RENEWAL_REAL_EFFECT').length>0);
  const persisted=f.host.localDesktopSessions.get(cookie.value);
  await f.restart();
  if(Date.now()<persisted.expiresAt)assert.ok(f.host.localDesktopSessions.get(cookie.value),'Fresh host restores still-valid renewed metadata');
  else assert.equal(f.host.localDesktopSessions.get(cookie.value),null,'Real downtime exceeding the deliberately short TTL must not resurrect an expired bearer');
  await eventually(async()=>{const current=(await f.context.cookies()).find(c=>c.name==='zero_session');return current&&f.host.localDesktopSessions.has(current.value);});
  assert.ok(f.host.unifiedMemory.recall('SESSION_RENEWAL_REAL_EFFECT').length>0,'Original persisted memory survives the stopped/restarted host');
  await remember(f.page,'SESSION_RESTART_REAL_EFFECT');
  assert.ok(f.host.unifiedMemory.recall('SESSION_RESTART_REAL_EFFECT').length>0);
});

test('real expired browser cookie recovers after injected transport loss and explicit logout is respected', {timeout:25000}, async t=>{
  const f=await fixture(t,3000);
  const original=(await f.context.cookies()).find(c=>c.name==='zero_session');assert.ok(original);
  await f.page.route('**/api/auth/session**',route=>route.abort('connectionfailed'));
  await eventually(()=>!f.host.localDesktopSessions.get(original.value),6000);
  assert.equal((await f.context.cookies()).some(c=>c.name==='zero_session'),false);
  await f.page.unroute('**/api/auth/session**');
  // Supplied online event wakes the real keeper; HTTP/cookies/time remain real.
  await f.page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await eventually(async()=>{const cookie=(await f.context.cookies()).find(c=>c.name==='zero_session');return cookie&&cookie.value!==original.value&&f.host.localDesktopSessions.has(cookie.value);});
  await remember(f.page,'SESSION_EXPIRED_RECOVERY_EFFECT');
  assert.ok(f.host.unifiedMemory.recall('SESSION_EXPIRED_RECOVERY_EFFECT').length>0);
  await f.page.evaluate(()=>fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}));
  await f.page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await delay(3500);
  assert.equal((await f.context.cookies()).some(c=>c.name==='zero_session'),false,'Keeper must not undo explicit sign-out');
  assert.equal(f.host.localDesktopSessions.sessions.size,0);
});

test('actual renewal HTTP route preserves narrow scopes and refuses absent cookies or cross-origin requests', {timeout:15000}, async t=>{
  const f=await fixture(t,60000);
  const session=f.host.localDesktopSessions.create({role:'operator',scopes:['operator.read'],expiresAt:Date.now()+1000});
  const response=await fetch(f.base+'/api/auth/session/renew',{method:'POST',headers:{Cookie:`zero_session=${session.id}`,'Content-Type':'application/json'},body:JSON.stringify({role:'admin',scopes:['operator.admin']})});
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const result=await response.json();assert.deepEqual(result.session.scopes,['operator.read']);assert.equal(result.session.role,'operator');assert.ok(result.session.expiresAt>session.expiresAt);
  assert.equal(JSON.stringify(result).includes(session.id),false,'Renewal JSON must not reveal bearer tokens');
  assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  assert.equal((await fetch(f.base+'/api/auth/session/renew',{method:'POST'})).status,401);
  assert.equal((await fetch(f.base+'/api/auth/session/renew')).status,405);
  assert.equal((await fetch(f.base+'/api/auth/session/renew',{method:'POST',headers:{Cookie:`zero_session=${session.id}`,Origin:'https://untrusted.invalid'}})).status,403);
  assert.deepEqual(f.host.localDesktopSessions.get(session.id).scopes,['operator.read']);
});

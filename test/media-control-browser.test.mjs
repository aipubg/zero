/** REAL_BROWSER + INTEGRATION: real visible browser, actual decoded local WAV and independent media-state readbacks. */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { MediaController } from '../packages/media-control/index.mjs';
import { ComputerOperator } from '../app/zero-control-ui/src/computer/operator.js';

test('visible controlled media playback and idempotent controls affect the same real player', { timeout: 45000 }, async t => {
  // Actual decodable silent PCM avoids an unsolicited audible tone. This proves
  // browser playback and control, not physical speaker audibility or speech.
  const samples = 8000 * 30, wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8,4); wav.write('WAVEfmt ',8); wav.writeUInt32LE(16,16);
  wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);
  wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
  const server=http.createServer((req,res)=>{
    if(req.url==='/sound.wav'){res.writeHead(200,{'Content-Type':'audio/wav','Content-Length':wav.length});res.end(wav);return;}
    res.writeHead(200,{'Content-Type':'text/html'});
    res.end(req.url==='/empty' ? '<title>No player</title>' : '<title>ZERO controlled media test</title><audio controls src="/sound.wav"></audio>');
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const controller=new MediaController(),operator=new ComputerOperator({mediaController:controller});
  t.after(async()=>{await controller.close();server.closeAllConnections();await new Promise(r=>server.close(r));});
  const url=`http://127.0.0.1:${server.address().port}/`;
  const started=await operator.execute('play',{url});
  assert.equal(started.verified,true,JSON.stringify(started));assert.equal(started.clockAdvanced,true);assert.equal(started.audioAudible,'UNVERIFIED');
  const page=controller.page,media=page.locator('audio');
  for(const command of ['pause','pause','play','play','mute','mute','unmute','unmute','volume_down','volume_up','play_pause','play_pause']){
    const result=await operator.execute('media_control',{command});assert.equal(result.verified,true,JSON.stringify(result));
    assert.equal(controller.page,page,'Controls must never launch a separate verification page');
    const actual=await media.evaluate(e=>({paused:e.paused,muted:e.muted,volume:e.volume}));
    if(command==='pause')assert.equal(actual.paused,true);
    if(command==='play')assert.equal(actual.paused,false);
    if(command==='mute')assert.equal(actual.muted,true);
    if(command==='unmute')assert.equal(actual.muted,false);
    assert.equal(actual.volume,result.after.volume);
  }
  const invalid=await operator.execute('media_control',{command:'invented'});assert.equal(invalid.ok,false);assert.equal(invalid.executed,false);
  const unsupported=await operator.execute('media_control',{command:'next'});assert.equal(unsupported.ok,false);assert.equal(unsupported.executed,false);
  const focused=await operator.execute('media_control',{command:'focus'});assert.equal(focused.executed,true);assert.equal(focused.verified,false);
  const fullscreen=await operator.execute('media_control',{command:'fullscreen'});assert.equal(fullscreen.verified,true,JSON.stringify(fullscreen));
  await controller.close();
  const unavailable=await operator.execute('media_control',{command:'pause'});assert.equal(unavailable.ok,false);assert.equal(unavailable.verified,false);
  const abort=new AbortController();abort.abort(new Error('Explicit media cancellation'));
  await assert.rejects(operator.execute('play',{url},abort.signal),/Explicit media cancellation/);
  assert.equal(controller.browser,null);
});

test('in-flight media cancellation closes its actual browser and cannot report completed playback', { timeout: 20000 }, async t => {
  let received;
  const request = new Promise(resolve => { received = resolve; });
  const server = http.createServer(() => received());
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const controller = new MediaController(), abort = new AbortController();
  t.after(async()=>{await controller.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
  const operation = controller.play({url:`http://127.0.0.1:${server.address().port}/stalled`},abort.signal);
  await Promise.race([request,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Actual media request missing')),10000);timer.unref();})]);
  const browser = controller.browser, page = controller.page;
  assert.equal(browser.isConnected(),true);
  const concurrent=await controller.control('pause');assert.equal(concurrent.outcome,'BLOCKED');assert.equal(concurrent.executed,false);
  abort.abort(new Error('Cancel real media navigation'));
  const result=await operation;
  assert.equal(result.outcome,'CANCELLED');assert.equal(result.executed,true);assert.equal(result.completed,false);assert.equal(result.verified,false);
  assert.equal(page.isClosed(),true);assert.equal(browser.isConnected(),false);assert.equal(controller.browser,null);
});

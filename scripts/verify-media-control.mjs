/** REAL_BROWSER + REAL_EXTERNAL + REAL_OS + INTEGRATION: explicit visible media/model acceptance. */
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {ZeroNativeHost} from '../services/host/native-gateway.mjs';
import {canonicalCapabilityEngine} from '../packages/capability-engine/index.mjs';
import {chromium} from '../backend/node_modules/playwright-core/index.mjs';
const flags=process.argv.slice(2);
if(flags.includes('--help')) { console.log('Usage: node scripts/verify-media-control.mjs --external --visible-media\nRuns actual configured model inference and opens a visible media browser. No speaker audibility claim.'); process.exit(0); }
if(flags.length!==2 || !flags.includes('--external') || !flags.includes('--visible-media')) { console.log(JSON.stringify({status:'BLOCKED',execution:'NOT_RUN',reason:'Explicit --external --visible-media required; configured provider and installed browser prerequisites apply'})); process.exit(2); }
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
fs.mkdirSync('artifacts/ui-design',{recursive:true});
const evidence=path.resolve('artifacts/media-control',String(Date.now()));fs.mkdirSync(evidence,{recursive:true});
const executablePath=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(candidate=>fs.existsSync(candidate));
if(!executablePath){console.log(JSON.stringify({status:'BLOCKED',execution:'NOT_RUN',reason:'Installed Chrome or Edge required'}));process.exit(2);}
if(fs.existsSync('.env'))process.loadEnvFile('.env');
const root=fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(),'zero-media-model-')));
const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
const host=new ZeroNativeHost({port,dataDir:path.join(root,'data'),prefsPath:path.join(root,'prefs.json'),skillsDir:path.join(root,'skills'),localModelsDir:path.join(root,'models'),
 providersPath:path.resolve('models/gateway-providers.json'),agentBindingsPath:path.resolve('models/gateway-defaults.json'),configPath:path.join(root,'config.json')});
let browser,page;const receipt={status:'RUNNING',evidence,scope:'Actual external model chat through UI, visible controlled external video, production media widget and actual pause-button effect; no acoustic verification'};
try {
 await host.start();
 browser=await chromium.launch({executablePath,headless:true});
 page=await browser.newPage({viewport:{width:1500,height:1000}});
 await page.goto(`http://127.0.0.1:${port}/chat/zero`);await page.locator('.zero-shell-connection[data-connected="true"]').waitFor();
 const composer=page.getByRole('textbox',{name:'Chat composer',exact:true});
 await composer.fill('Use zero_computer_action with action="play" and url="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" to play that exact video. Do not substitute browser navigation or use query. Wait for the actual tool result and answer briefly. Do not claim speaker audibility.');
 await composer.press('Enter');
 const until=Date.now()+90000;let mediaPage;
 while(Date.now()<until){mediaPage=canonicalCapabilityEngine.operator.mediaController.page;if(mediaPage&&!mediaPage.isClosed()&&await mediaPage.locator('video').count()){const state=await mediaPage.locator('video').evaluate(e=>({paused:e.paused,time:e.currentTime}));if(!state.paused&&state.time>0.1)break;}await delay(200);}
 assert.ok(mediaPage&&!mediaPage.isClosed(),'Model must create an actual controlled media page');
 // Playback starts before the model's final response. The card arrives only
 // after that real upstream response; do not confuse a ten-second model wait
 // with a renderer failure.
 await page.locator('.zero-gen-media').waitFor({timeout:90000});
 const pause=page.locator('.zero-gen-media [data-action="play_pause"]').last();
 await pause.click();await page.getByRole('button',{name:'Verified',exact:true}).waitFor({timeout:10000});
 assert.equal(await mediaPage.locator('video').evaluate(e=>e.paused),true,'Production widget must pause the actual original media element');
  assert.equal(await page.locator('.zero-gen-media [data-zero-media-status]').last().innerText(),'PAUSED');
 receipt.status='PASS';receipt.modelCreatedVisibleMedia=true;receipt.uiWidgetPausedSamePlayer=true;
 receipt.actualPageUrl=mediaPage.url();receipt.audioAudible='UNVERIFIED';
 console.log(JSON.stringify(receipt));
}catch(error){receipt.status='FAIL';receipt.error=error.message;if(page){fs.writeFileSync(path.join(evidence,'page.html'),await page.content());await page.screenshot({path:path.join(evidence,'failed.png'),fullPage:true});}console.log(JSON.stringify(receipt));process.exitCode=1;}
finally {
 fs.writeFileSync(path.join(evidence,'report.json'),JSON.stringify(receipt,null,2)+'\n');
 await browser?.close();await host.close();
 const resolved=fs.realpathSync.native(root);assert.equal(path.dirname(resolved),fs.realpathSync.native(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('zero-media-model-'));fs.rmSync(resolved,{recursive:true,force:true});
}

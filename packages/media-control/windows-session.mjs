import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('./windows-session.ps1',import.meta.url));
export async function controlSpotify(options={},signal) {
  const track = options.track || options.song || options.query || options.title || '';
  let command = options.command || options.action;
  if (!command && track) command = 'play';
  if (!command) command = 'status';
  if (command === 'play_song' || command === 'play_track') command = 'play';
  if(!['status','play','pause','next','previous','set_volume','search','play_track'].includes(command))return {ok:false,executed:false,verified:false,outcome:'FAILED',error:'Unsupported Spotify command'};
  if(command==='set_volume'&&(typeof options.volume_percent!=='number'||!Number.isFinite(options.volume_percent)||options.volume_percent<0||options.volume_percent>100))return {ok:false,executed:false,verified:false,outcome:'FAILED',error:'volume_percent must be between 0 and 100'};
  if(process.platform!=='win32')return {ok:false,executed:false,verified:false,outcome:'BLOCKED',error:'Windows Spotify session control requires Windows'};
  const args=['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',script,'-Command',command];
  if(command==='set_volume')args.push('-VolumePercent',String(options.volume_percent));
  if(track)args.push('-Track',String(track));
  return new Promise(resolve=>execFile('powershell.exe',args,{windowsHide:true,timeout:15000,maxBuffer:262144,signal},(error,stdout)=>{
    try {const result=JSON.parse(stdout.trim());const isOk=result.ok!==false;resolve({...result,ok:isOk,executed:isOk,completed:isOk,verified:isOk,outcome:isOk?'COMPLETED':result.outcome||'FAILED',verificationScope:'Exact Spotify Windows media/audio session readback; physical audibility is not measured'});}
    catch {resolve({ok:false,executed:false,verified:false,outcome:signal?.aborted?'CANCELLED':'FAILED',error:error?.message||'Invalid Windows media response'});}
  }));
}

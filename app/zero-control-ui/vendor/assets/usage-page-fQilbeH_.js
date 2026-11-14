import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{A as t,Gs as n,Gu as r,Ic as i,Ii as a,Ji as o,Js as s,Lc as c,Nu as l,Pu as u,R as d,V as f,W as p,Wu as m,Yi as h,Zi as g,_u as _,j as v,ju as y,vu as b,xu as x,yu as S,zu as C}from"./control-ui-core-DCNBgr3X.js";import{Aa as w,Ai as T,Ba as E,Fi as D,ca as O,ki as ee,sa as te,za as k}from"./control-ui-core-DwX5Mpz4.js";import{G as A,J as j,W as M,X as N,Z as P,_ as ne,at as F,c as I,l as L,rt as R,y as re}from"./lit-runtime-B40xFCK_.js";import{It as z,La as ie,Y as ae,zt as oe}from"./control-ui-boot-shared-BX8huZUb.js";import{Bi as B,Ga as V,Ni as se,Ti as H,Ur as U,Wr as ce,Zr as W,ci as le,jo as G,so as ue,yi as de}from"./ui-AaV6iNVa.js";import{$n as fe,G as pe,I as K,Ir as me,K as he,Mi as ge,Pr as _e,X as ve,Y as ye,an as be,c as xe,er as Se,ir as Ce,l as we,n as Te,nr as Ee,on as De,rr as Oe,s as ke,t as Ae,tr as je,u as Me}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ml as Ne,Nl as Pe,fu as Fe,su as Ie}from"./control-ui-boot-shared-CzJHozXQ.js";import{i as Le,n as Re,r as ze}from"./usage-BQd4o5lO.js";import{n as Be,r as Ve}from"./usage-2X-a5fq_.js";import{n as He,t as Ue}from"./provider-usage-BWloZvo9.js";import{a as We,c as Ge,i as Ke,l as qe,n as Je,o as Ye,r as Xe,s as q,t as Ze}from"./request-usage-snapshot-CKlKyYHs.js";function Qe(e,t){return[e,t].some(e=>e&&e.status!==`fresh`)}function $e(e){let t=e.cacheRefresh!==`complete`&&!e.totals?.totalTokens&&!e.totals?.totalCost&&!e.sessions.some(e=>e.usage?.computedAt!==void 0||e.usage?.totalTokens||e.usage?.totalCost)&&!e.costDaily.some(e=>e.totalTokens||e.totalCost);return{hasOverviewData:!t&&!!(e.totals||e.sessions.length||e.costDaily.length),loadingOverview:e.loading||t&&e.cacheRefresh===`retrying`}}function et(e,t){let n=0,r=0,i=[];for(let a of t?[e&&Object.hasOwn(e,t)?e[t]:void 0]:Object.values(e??{}))a&&(n=Math.max(n,a.usageUpdatedAt),r=Math.max(r,a.committedAt),a.usageRefreshFailed&&i.push(a));return{updatedAt:n,committedAt:r,failures:i}}function tt(e,t){let n=null,r=(t,r)=>{if(n===t){n=null;try{r()}catch{}finally{e.requestUpdate()}}};return{get pending(){return n!==null},cancel:()=>{let t=n;n=null,t?.abort(),e.requestUpdate()},async run(i){let a=n,o=new AbortController;n=o,a?.abort(),e.requestUpdate();let s;try{s=await t.task(i,{signal:o.signal})}catch(e){r(o,()=>t.onError(e));return}r(o,()=>t.onComplete(s))}}}function nt(e,t){return e?.key===t.key&&e.agentId===t.agentId&&e.sessionId===t.sessionId}function rt(e,t,n,r,i,a){let c=null,l=je(),u=null,d=0,f=tt(e,{task:async([e,t],{signal:r})=>({target:t,data:await n(e,{key:t.key,...!ue(t.key.trim())&&t.agentId?{agentId:t.agentId}:{}},r,t.sessionId)}),onComplete:e=>{u=null,c=e,l=Se()},onError:e=>{u=null;let n=g(e);l=Ee(n?je():l,e,t.snapshot),n&&c&&delete c.data,n&&l.error&&(l={...l,error:o(`usage details`)})}}),p=()=>{u&&t.snapshot&&!s(t.snapshot)&&(l=Ee(l,void 0,t.snapshot)),u=null,d+=1,f.cancel()},m=e=>{c=e?{target:e}:null,l=je(),a?.()};return{get data(){return c?.data??null},get status(){return l},get loading(){return u!==null},async recover(e,n=!1){let i=d,a=r(e);await u,i===d&&nt(a,r(e))&&t.snapshot&&s(t.snapshot)&&(l.awaitingGateway||l.error!==null||n&&!l.hasLoaded)&&this.load(e)},load(e,n=!0){let a=t.client;if(!a||!t.connected)return Promise.resolve();let o=!!e&&i?.(e)!==!1,s=r(e),h=nt(c?.target,s);return(!h||!o)&&m(o?s:void 0),o?!n&&h?u??Promise.resolve():(l=fe(l),d+=1,u=f.run([a,s])):(p(),Promise.resolve())},cancel:p,clear(){m(),p()}}}var it;function at(){return(at=e((()=>{V(),Oe(),u(),n(),h(),it=class{constructor(e,t,n,r,i){let a=e=>{let t=r().find(t=>t.key===e),i=t?.agentId??n().agentId;return{key:e,...i?{agentId:i}:{},sessionId:t?.sessionId}};this.timeSeries=rt(e,t,Le,a,void 0,i),this.sessionLogs=rt(e,t,async(e,t)=>{let n=await ze(e,t);return Array.isArray(n.logs)?n.logs:null},a),this.contextWeight=rt(e,t,async(e,t,r,i)=>{let a=(await Re(e,{...n(),agentId:t.agentId},{key:t.key,includeContextWeight:!0,signal:r})).sessions[0];if(i!==void 0&&a?.sessionId!==void 0&&a.sessionId!==i)throw Error(C(`usage.details.contextOutOfDate`));return a?.contextWeight},a,e=>r().some(t=>t.key===e&&t.hasContextWeight))}load(e,t=!0){this.timeSeries.load(e,t),this.sessionLogs.load(e,t),this.contextWeight.load(e)}cancel(){this.timeSeries.cancel(),this.sessionLogs.cancel(),this.contextWeight.cancel()}clear(){this.timeSeries.clear(),this.sessionLogs.clear(),this.contextWeight.clear()}}})))()}var ot,st;function ct(){return(ct=e((()=>{r(),ot={usage:{presets:{today:`Today`,last7d:`7d`,last30d:`30d`,last90d:`90d`,last1y:`1y`,all:`All`},scope:{instance:`Current instance`,instanceHint:`Show only the active session id for each logical session.`,family:`Historical lineage`,familyHint:`Roll up known rotated transcript-backed session ids.`,familyIncluded:`Historical lineage includes {count} session instances.`},filters:{rangeTitle:`Reporting range`,rangeHint:`Choose the dates to include in every chart and total.`,title:`Filters`,to:`to`,startDate:`Start date`,endDate:`End date`,timeZone:`Time zone`,timeZoneLocal:`Local`,timeZoneUtc:`UTC`,pin:`Pin`,pinned:`Pinned`,selectAll:`Select All`,clear:`Clear`,clearAll:`Clear All`,remove:`Remove filter`,removeDays:`Remove days filter`,removeHours:`Remove hours filter`,removeSession:`Remove session filter`,all:`All`,days:`Days`,hours:`Hours`,session:`Session`,agent:`Agent`,channel:`Channel`,provider:`Provider`,model:`Model`,tool:`Tool`,daysCount:`{count} days`,hoursCount:`{count} hours`,sessionsCount:`{count} sessions`},query:{placeholder:`Filter sessions (e.g. key:agent:main:cron* model:gpt-4o has:errors minTokens:2000)`,apply:`Filter (client-side)`,matching:`{shown} of {total} sessions match`,inRange:`{total} sessions in range`,tip:`Tip: use filters or click bars to refine days.`},export:{label:`Export`,changed:`Session context changed while preparing the export. Refresh usage and try again.`,sessionsCsv:`Sessions CSV`,dailyCsv:`Daily CSV`,json:`JSON`},cacheStatus:{warning:`Usage data may be incomplete. Checking for updated totals automatically.`,paused:`Usage data may be incomplete. Automatic checks paused; select Refresh to check again.`},creators:{title:`Started by`,description:`Usage grouped by who started each session. This is session attribution, not per-turn billing.`,all:`All identities`,select:`Filter by session creator`,selected:`Selected identity`,identity:`Identity`,unattributed:`Unattributed`,system:`System`,empty:`No usage for these dates and filters.`,more:`Show {count} more identities`},empty:{title:`No usage in this date range`,subtitle:`Try a wider date range or another identity to explore more history.`,hint:`Choose a wider date range or another identity.`,noData:`No data`},daily:{title:`Daily Usage`,total:`Total`,byType:`By Type`,tokensTitle:`Daily Token Usage`,costTitle:`Daily Cost`,compressedScaleHint:`Square-root scale keeps low-usage days visible.`},costWindows:{title:`Cost Windows`,subtitle:`Calendar windows ending {date}`,selectedRange:`Selected Range`,lastDays:`Last {count} days`,perDay:`/ day`},overview:{messages:`Messages`,messagesHint:`Total user and assistant messages in range.`,messagesAbbrev:`msgs`,user:`user`,assistant:`assistant`,toolCalls:`Tool Calls`,toolCallsHint:`Total tool call count across sessions.`,toolsUsed:`tools used`,errors:`Errors`,errorsHint:`Total message and tool errors in range.`,toolResults:`tool results`,avgTokens:`Avg Tokens / Msg`,avgTokensHint:`Average tokens per message in this range.`,avgCost:`Avg Cost / Msg`,avgCostHint:`Average cost per message when providers report costs.`,avgCostHintMissing:`Average cost per message when providers report costs. Cost data is missing for some or all sessions in this range.`,acrossMessages:`Across {count} messages`,sessions:`Sessions`,sessionsHint:`Distinct sessions in the range.`,sessionsInRange:`of {count} in range`,throughput:`Throughput`,throughputHint:`Throughput shows tokens per minute over active time. Higher is better.`,tokensPerMinute:`tok/min`,perMinute:`/ min`,errorRate:`Error Rate`,errorHint:`Error rate = errors / total messages. Lower is better.`,avgSession:`avg session`,cacheHitRate:`Cache Hit Rate`,cacheHint:`Cache hit rate = cache read / (input + cache read + cache write). Higher is better.`,cached:`cached`,prompt:`prompt`,calls:`calls`,costShare:`{percent}% of cost`,topModels:`Top Models`,topProviders:`Top Providers`,topTools:`Top Tools`,topAgents:`Top Agents`,topChannels:`Top Channels`,peakErrorDays:`Peak Error Days`,peakErrorHours:`Peak Error Hours`,noModelData:`No model data`,noProviderData:`No provider data`,noToolCalls:`No tool calls`,noAgentData:`No agent data`,noChannelData:`No channel data`,noErrorData:`No error data`},sessions:{title:`Sessions`,shown:`{count} shown`,total:`{count} total`,avg:`avg`,all:`All`,recent:`Recently viewed`,recentShort:`Recent`,sort:`Sort`,ascending:`Ascending`,descending:`Descending`,clearSelection:`Clear Selection`,noRecent:`No recent sessions`,noneInRange:`No sessions in range`,more:`+{count} more`,selected:`Selected ({count})`,copy:`Copy`,limitReached:`Showing first 1,000 sessions. Narrow date range for complete results.`},mosaic:{title:`Activity by Time`,subtitleEmpty:`Estimates require session timestamps.`,subtitle:`Estimated from session spans (first/last activity). Time zone: {zone}.`,noTimelineData:`No timeline data yet.`,dayOfWeek:`Day of Week`,midnight:`Midnight`,fourAm:`4am`,eightAm:`8am`,noon:`Noon`,fourPm:`4pm`,eightPm:`8pm`,legend:`Low → High token density`,sun:`Sun`,mon:`Mon`,tue:`Tue`,wed:`Wed`,thu:`Thu`,fri:`Fri`,sat:`Sat`}}},st=Object.assign(()=>{let{overview:e,...t}=ot.usage;Object.assign(m.usage,t),Object.assign(m.usage.overview,e)},{catalog:ot})})))()}function lt({agentId:e,key:t,sessionId:n}){return JSON.stringify([e,t,n])}function ut(e,t,n){return tt(e,{task:async(e,{signal:r})=>{let i=t.capture();if(!i)throw Error(C(`common.offline`));let a=`zero-usage-${Ye(new Date)}.json`,o=new Map;if(e.sessions.some(e=>e.hasContextWeight)){let t=await Re(i.client,n(),{includeContextWeight:!0,signal:r});if(o=new Map(t.sessions.map(e=>[lt(e),e.contextWeight])),e.sessions.some(e=>e.hasContextWeight&&!o.get(lt(e))))throw Error(C(`usage.export.changed`))}return{connection:i,filename:a,data:{...e,sessions:e.sessions.map(e=>({...e,contextWeight:o.get(lt(e))??null}))}}},onComplete:({connection:e,filename:n,data:r})=>{t.isCurrent(e)&&ae(n,JSON.stringify(r,null,2),`application/json;charset=utf-8`)},onError:e=>{b({message:`${C(`usage.export.label`)}: ${S(e,`request failed`)}`})}})}function dt(){return(dt=e((()=>{u(),ct(),x(),_(),q(),st()})))()}function ft(e,t,n){let r=t?.sessions.map(e=>e.agentId).filter(e=>!!e?.trim())??[];return j`
    ${he({title:E(`usage`),subtitle:k(`usage`),actions:Te({agents:e.agents.state.agentsList?.agents??[],additionalAgentIds:r,selection:e.agentSelection})})}
    ${Me(n)}
  `}function pt(e){return j`
    <span class="settings-status settings-status--accent">
      <span class="usage-loading-spinner" aria-hidden="true"></span>
      ${e}
    </span>
  `}function mt(e){return j`
    <section class="settings-group usage-panel usage-empty-state">
      <div class="usage-empty-state__title">${C(`usage.empty.title`)}</div>
      <div class="card-sub usage-empty-state__subtitle">${C(`usage.empty.subtitle`)}</div>
      <div class="usage-empty-state__actions">
        <button class="btn primary" @click=${e}>${C(`common.refresh`)}</button>
      </div>
    </section>
  `}function ht(e,t,n){return Ce({status:e,errorMessage:e.error?C(`usage.details.loadFailed`,{detail:G(C(t)),error:e.error}):void 0,className:`usage-callout usage-detail-error--${n}`})}function gt(){return(gt=e((()=>{M(),w(),Ae(),Oe(),K(),we(),u()})))()}function _t(){return{input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,totalCost:0,inputCost:0,outputCost:0,cacheReadCost:0,cacheWriteCost:0,missingCostEntries:0}}function vt(e,t){if(e.input+=t.input,e.output+=t.output,e.cacheRead+=t.cacheRead,e.cacheWrite+=t.cacheWrite,e.totalTokens+=t.totalTokens,e.totalCost+=t.totalCost,e.inputCost+=t.inputCost,e.outputCost+=t.outputCost,e.cacheReadCost+=t.cacheReadCost,e.cacheWriteCost+=t.cacheWriteCost,e.missingCostEntries+=t.missingCostEntries,t.missingCostByModel){e.missingCostByModel??={};for(let[n,r]of Object.entries(t.missingCostByModel))e.missingCostByModel[n]=(e.missingCostByModel[n]??0)+r}}function yt(e,t){return JSON.stringify([e??`unknown`,t??`unknown`])}function bt(e,t,n){return JSON.stringify([e,t??`unknown`,n??`unknown`])}function xt(){return{count:0,sum:0,min:1/0,max:0,p95Max:0}}function St(e,t){e.count+=t.count,e.sum+=t.avgMs*t.count,e.min=Math.min(e.min,t.minMs),e.max=Math.max(e.max,t.maxMs),e.p95Max=Math.max(e.p95Max,t.p95Ms)}function Ct(e){return{count:e.count,avgMs:e.count?e.sum/e.count:0,minMs:e.min===1/0?0:e.min,maxMs:e.max,p95Ms:e.p95Max}}function wt(e,t,n,r){let i=e.get(t)??{provider:n.provider,model:r,count:0,totals:_t()};i.count+=n.count,vt(i.totals,n.totals),e.set(t,i)}function Tt(e,t,n){if(!t)return;let r=e.get(t)??_t();vt(r,n),e.set(t,r)}function Et(e,t){return t.totals.totalCost-e.totals.totalCost||t.totals.totalTokens-e.totals.totalTokens}function Dt(){let e=_t(),t={total:0,user:0,assistant:0,toolCalls:0,toolResults:0,errors:0},n=new Map,r=new Map,i=new Map,a=new Map,o=new Map,s=new Map,c=new Map,l=new Map,u=new Map,d=new Map,f=xt(),p=0,m=0;function h(e){let t=c.get(e);return t||(t={date:e,tokens:0,cost:0,messages:0,toolCalls:0,errors:0},c.set(e,t)),t}function g({usage:c,agentId:g,channel:_,createdActor:v,creatorKey:y=Ot}){if(!c)return;vt(e,c),m=Math.max(m,c.durationMs??0);let b=c.firstActivity!==void 0||(c.messageCounts?.total??0)>0;b&&(p+=1),c.messageCounts&&(t.total+=c.messageCounts.total,t.user+=c.messageCounts.user,t.assistant+=c.messageCounts.assistant,t.toolCalls+=c.messageCounts.toolCalls,t.toolResults+=c.messageCounts.toolResults,t.errors+=c.messageCounts.errors);for(let e of c.toolUsage?.tools??[])n.set(e.name,(n.get(e.name)??0)+e.count);for(let e of c.modelUsage??[])wt(r,yt(e.provider,e.model),e,e.model),wt(i,e.provider??`unknown`,e,void 0);Tt(a,g,c),Tt(o,_,c);let x=s.get(y)??{key:y,...v?{actor:v}:{},totals:_t(),sessionCount:0,daily:new Map,sessionActivity:new Map};if(vt(x.totals,c),b){x.sessionCount+=1;let e=[...new Set([...c.activityDates??[],...c.dailyBreakdown?.map(({date:e})=>e)??[],...c.dailyMessageCounts?.map(({date:e})=>e)??[]])].toSorted(),t=JSON.stringify(e),n=x.sessionActivity.get(t)??{dates:e,sessionCount:0};n.sessionCount+=1,x.sessionActivity.set(t,n)}s.set(y,x),c.latency&&c.latency.count>0&&St(f,c.latency);for(let e of c.dailyLatency??[]){let t=u.get(e.date)??xt();St(t,e),u.set(e.date,t)}for(let e of c.dailyBreakdown??[]){let t=h(e.date);t.tokens+=e.tokens,t.cost+=e.cost,Tt(l,e.date,e),Tt(x.daily,e.date,e)}for(let e of c.dailyMessageCounts??[]){let t=h(e.date);t.messages+=e.total,t.toolCalls+=e.toolCalls,t.errors+=e.errors}for(let e of c.dailyModelUsage??[]){let t=bt(e.date,e.provider,e.model),n=d.get(t)??{date:e.date,provider:e.provider,model:e.model,tokens:0,cost:0,count:0};n.tokens+=e.tokens,n.cost+=e.cost,n.count+=e.count,d.set(t,n)}}function _(){let e=Array.from(n,([e,t])=>({name:e,count:t})).toSorted((e,t)=>t.count-e.count);return{sessionCount:p,...m>0?{longestSessionDurationMs:m}:{},messages:t,tools:{totalCalls:e.reduce((e,{count:t})=>e+t,0),uniqueTools:n.size,tools:e},byModel:Array.from(r.values()).toSorted(Et),byProvider:Array.from(i.values()).toSorted(Et),byAgent:Array.from(a,([e,t])=>({agentId:e,totals:t})).toSorted((e,t)=>t.totals.totalCost-e.totals.totalCost),byChannel:Array.from(o,([e,t])=>({channel:e,totals:t})).toSorted((e,t)=>t.totals.totalCost-e.totals.totalCost),byCreator:Array.from(s.values(),({daily:e,sessionActivity:t,...n})=>({...n,daily:Array.from(e,([e,t])=>({date:e,...t})).toSorted((e,t)=>e.date.localeCompare(t.date)),sessionActivity:Array.from(t.values()).toSorted((e,t)=>e.dates.join(`,`).localeCompare(t.dates.join(`,`)))})).toSorted((e,t)=>t.totals.totalCost-e.totals.totalCost||t.totals.totalTokens-e.totals.totalTokens||e.key.localeCompare(t.key)),costDaily:Array.from(l,([e,t])=>({date:e,...t})).toSorted((e,t)=>e.date.localeCompare(t.date)),latency:f.count>0?Ct(f):void 0,dailyLatency:Array.from(u,([e,t])=>({date:e,...Ct(t)})).toSorted((e,t)=>e.date.localeCompare(t.date)),modelDaily:Array.from(d.values()).toSorted((e,t)=>e.date.localeCompare(t.date)||t.cost-e.cost),daily:Array.from(c.values()).toSorted((e,t)=>e.date.localeCompare(t.date))}}return{totals:e,add:g,finish:_}}var Ot;function kt(){return(kt=e((()=>{Ot=`["unknown"]`})))()}function At(e){return Math.round(e/Xt)}function J(e){return v(e,{thousandsSuffix:`K`,trimTrailingZero:!1})}function jt(e,t=2){return`$${e.toFixed(t)}`}function Y(e){let t=Math.abs(e);return jt(e,t===0||t>=.01?2:t>=1e-4?4:6)}function Mt(e){return new Date(Date.UTC(1970,0,1,e)).toLocaleTimeString(void 0,{hour:`numeric`,timeZone:`UTC`})}function Nt(e,t,n){let r=e.usage?.firstActivity??e.updatedAt,i=e.usage?.lastActivity??e.updatedAt;if(!r||!i)return!1;let a=Math.min(r,i),o=Math.max(r,i),s=o-a,c=a;for(;c<=o;){let e=new Date(c);if(n.kind===`inclusive`){if(!n.visit(Ft(e,t))||c===o)break;c=Math.min(Bt(e,t),o)}else{let r=c===o?c:Math.min(Bt(e,t),o);if(n.visit({hour:Ft(e,t),weekday:It(e,t),share:a===o?1:(r-c)/s}),r===o)break;c=r}}return!0}function Pt(e,t){let n=Array.from({length:24},()=>0),r=Array.from({length:24},()=>0);for(let i of e){let e=i.usage;if(!e?.messageCounts||e.messageCounts.total===0)continue;let a=e.messageCounts;if(e.utcQuarterHourMessageCounts&&e.utcQuarterHourMessageCounts.length>0){let i=Rt();for(let a of e.utcQuarterHourMessageCounts){let e=zt(a.date,a.quarterIndex,t,i);e&&(n[e.hour]=(n[e.hour]??0)+a.errors,r[e.hour]=(r[e.hour]??0)+a.total)}continue}Nt(i,t,{kind:`weighted`,visit:({hour:e,share:t})=>{n[e]=(n[e]??0)+(a.errors??0)*t,r[e]=(r[e]??0)+a.total*t}})}return r.map((e,t)=>{let r=n[t]??0;return{hour:t,rate:e>0?r/e:0,errors:r,msgs:e}}).filter(e=>e.msgs>0&&e.errors>0).toSorted((e,t)=>t.rate-e.rate).slice(0,5).map(e=>({label:Mt(e.hour),value:`${(e.rate*100).toFixed(2)}%`,sub:`${Math.round(e.errors)} ${G(C(`usage.overview.errors`))} · ${Math.round(e.msgs)} ${C(`usage.overview.messagesAbbrev`)}`}))}function Ft(e,t){return t===`utc`?e.getUTCHours():e.getHours()}function It(e,t){return t===`utc`?e.getUTCDay():e.getDay()}function Lt(e,t=`local`){let n=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!n)return null;let[,r,i,a]=n,o=Number(r),s=Number(i)-1,c=Number(a),l=t===`utc`?new Date(Date.UTC(o,s,c)):new Date(o,s,c),[u,d,f]=t===`utc`?[l.getUTCFullYear(),l.getUTCMonth(),l.getUTCDate()]:[l.getFullYear(),l.getMonth(),l.getDate()];return u===o&&d===s&&f===c?l:null}function Rt(){return{utcDateKey:void 0,utcWeekday:null,utcStartMs:0}}function zt(e,t,n,r){if(!Number.isInteger(t)||t<0||t>95)return null;if(e!==r.utcDateKey){r.utcDateKey=e;let t=Lt(e,`utc`);r.utcWeekday=t?t.getUTCDay():null,r.utcStartMs=t?t.getTime():0}if(r.utcWeekday===null)return null;let i=n===`local`?new Date(r.utcStartMs+t*9e5):null;return{hour:i?Ft(i,n):Math.floor((t+0)/4),weekday:i?It(i,n):r.utcWeekday}}function Bt(e,t){let n=e.getTime(),r=t===`utc`?e.getUTCMinutes():e.getMinutes(),i=t===`utc`?e.getUTCSeconds():e.getSeconds(),a=n+(60-r)*6e4-i*1e3-e.getMilliseconds();if(t===`utc`||new Date(a-1).getTimezoneOffset()===e.getTimezoneOffset())return a;let o=e.getTimezoneOffset(),s=n+1,c=a-1;for(;s<c;){let e=s+Math.floor((c-s)/2);new Date(e).getTimezoneOffset()===o?s=e+1:c=e}return s}function Vt(e,t,n){let r=e.usage?.utcQuarterHourTokenUsage;if(!r||r.length===0)return!1;let i=!1,a=Rt();for(let e of r){if(e.totalTokens<=0)continue;let r=zt(e.date,e.quarterIndex,t,a);if(r&&(i=!0,n({hour:r.hour,weekday:r.weekday,tokens:e.totalTokens})===!1))break}return i}function Ht(e,t,n){if(t.length===0)return!0;let r=!1;return Vt(e,n,({hour:e})=>(r=t.includes(e),!r))||Nt(e,n,{kind:`inclusive`,visit:e=>(r=t.includes(e),!r)}),r}function Ut(e,t){let n=Array.from({length:24},()=>0),r=Array.from({length:7},()=>0),i=0,a=!1;for(let o of e){let e=o.usage;if(!(!e||!e.totalTokens||e.totalTokens<=0)){if(i+=e.totalTokens,Vt(o,t,({hour:e,weekday:t,tokens:i})=>{n[e]=(n[e]??0)+i,r[t]=(r[t]??0)+i})){a=!0;continue}Nt(o,t,{kind:`weighted`,visit:({hour:t,weekday:i,share:a})=>{n[t]=(n[t]??0)+e.totalTokens*a,r[i]=(r[i]??0)+e.totalTokens*a}})&&(a=!0)}}let o=[`sun`,`mon`,`tue`,`wed`,`thu`,`fri`,`sat`].map((e,t)=>({label:C(`usage.mosaic.${e}`),tokens:r[t]??0}));return{hasData:a,totalTokens:i,hourTotals:n,weekdayTotals:o}}function Wt(e,t,n,r){let i=Ut(e,t),a=Math.max(...i.hourTotals,1),o=Math.max(...i.weekdayTotals.map(e=>e.tokens),1);return ye({title:C(`usage.mosaic.title`),description:i.hasData?C(`usage.mosaic.subtitle`,{zone:C(t===`utc`?`usage.filters.timeZoneUtc`:`usage.filters.timeZoneLocal`)}):C(`usage.mosaic.subtitleEmpty`),actions:j`
        <div class="usage-mosaic-total">
          ${J(i.hasData?i.totalTokens:0)}
          ${G(C(`usage.metrics.tokens`))}
        </div>
      `},j`
      <div class="usage-panel usage-mosaic">
        ${i.hasData?j`
                <div class="usage-mosaic-grid">
                  <div class="usage-mosaic-section">
                    <div class="usage-mosaic-section-title">${C(`usage.mosaic.dayOfWeek`)}</div>
                    <div class="usage-daypart-grid">
                      ${i.weekdayTotals.map(e=>{let t=Math.min(e.tokens/o,1),n=e.tokens>0?`color-mix(in srgb, var(--accent) ${(12+t*60).toFixed(1)}%, transparent)`:`transparent`;return j`
                          <div class="usage-daypart-cell" style="background: ${n};">
                            <div class="usage-daypart-label">${e.label}</div>
                            <div class="usage-daypart-value">${J(e.tokens)}</div>
                          </div>
                        `})}
                    </div>
                  </div>
                  <div class="usage-mosaic-section">
                    <div class="usage-mosaic-section-title">
                      <span>${C(`usage.filters.hours`)}</span>
                      <span class="usage-mosaic-sub">0 → 23</span>
                    </div>
                    <div class="usage-hour-grid">
                      ${i.hourTotals.map((e,t)=>{let i=Math.min(e/a,1),o=e>0?`color-mix(in srgb, var(--accent) ${(8+i*70).toFixed(1)}%, transparent)`:`transparent`,s=`${t}:00 · ${J(e)} ${G(C(`usage.metrics.tokens`))}`,c=i>.7?`color-mix(in srgb, var(--accent) 60%, transparent)`:`color-mix(in srgb, var(--accent) 24%, transparent)`,l=n.includes(t);return j`
                          <button
                            type="button"
                            class="usage-hour-cell ${l?`selected`:``}"
                            style="background: ${o}; border-color: ${c};"
                            title="${s}"
                            aria-label=${s}
                            aria-pressed=${l?`true`:`false`}
                            @click=${e=>r(t,e.shiftKey)}
                          ></button>
                        `})}
                    </div>
                    <div class="usage-hour-labels">
                      <span>${C(`usage.mosaic.midnight`)}</span>
                      <span>${C(`usage.mosaic.fourAm`)}</span>
                      <span>${C(`usage.mosaic.eightAm`)}</span>
                      <span>${C(`usage.mosaic.noon`)}</span>
                      <span>${C(`usage.mosaic.fourPm`)}</span>
                      <span>${C(`usage.mosaic.eightPm`)}</span>
                    </div>
                    <div class="usage-hour-legend">
                      <span></span>
                      ${C(`usage.mosaic.legend`)}
                    </div>
                  </div>
                </div>
              `:j`<div class="usage-empty-block usage-empty-block--compact">
                ${C(`usage.mosaic.noTimelineData`)}
              </div>`}
      </div>
    `)}function Gt(e){let t=Lt(e,`utc`);return t?t.getTime()/Zt:null}function Kt(e){return Jt(e,{month:`short`,day:`numeric`})}function qt(e){return Jt(e,{month:`long`,day:`numeric`,year:`numeric`})}function Jt(e,t){let n=Lt(e);return n?n.toLocaleDateString(void 0,t):e}function Yt(e,t,n){let r=Gt(t),i=Gt(n);if(r===null||i===null||r>i)return[];let a=i-r+1;return[a,...[1,7,30,90].filter(e=>e<a)].map(t=>{let r=i-t+1,a=_t();for(let t of e){let e=Gt(t.date);e!==null&&e>=r&&e<=i&&vt(a,t)}return{days:t,endDate:n,totals:a}})}var Xt,Zt,Qt,$t;function X(){return(X=e((()=>{M(),kt(),K(),u(),ct(),p(),st(),Xt=4,Zt=864e5,Qt=(e,t)=>{if(e.length===0)return t??{messages:{total:0,user:0,assistant:0,toolCalls:0,toolResults:0,errors:0},tools:{totalCalls:0,uniqueTools:0,tools:[]},byModel:[],byProvider:[],byAgent:[],byChannel:[],daily:[]};let n=Dt();for(let t of e)n.add(t);return n.finish()},$t=(e,t,n)=>{let r=0,i=0;for(let t of e){let e=t.usage?.durationMs??0;e>0&&(r+=e,i+=1)}let a=i?r/i:0,o=t&&r>0?t.totalTokens/(r/6e4):void 0,s=t&&r>0?t.totalCost/(r/6e4):void 0,c=n.messages.total?n.messages.errors/n.messages.total:0;return{durationCount:i,avgDurationMs:a,throughputTokensPerMin:o,throughputCostPerMin:s,errorRate:c}}})))()}function en(e,t=!0){let n=t&&/^[ \t\r\n]*[=+\-@\uFF0B\uFF0D\uFF1D\uFF20]/u.test(e)?`'${e}`:e;return/[",\r\n]/.test(n)?`"${n.replaceAll(`"`,`""`)}"`:n}function tn(e){return e.map(e=>e==null?``:en(String(e),typeof e==`string`)).join(`,`)}function nn(e,t){let n=Object.values(t);return[tn(Object.keys(t)),...e.map(e=>tn(n.map(t=>t(e))))].join(`
`)}function rn(e,t,n,r=12){for(let i of t){if(e.length>=r)break;let t=n(i);t&&!e.includes(t)&&e.push(t)}}function an(e,t){let n={agent:[],channel:[],provider:[],model:[],tool:[]};return rn(n.agent,e,e=>e.agentId,6),rn(n.channel,e,e=>e.channel),rn(n.provider,e,e=>e.modelProvider),rn(n.provider,e,e=>e.providerOverride),rn(n.provider,t?.byProvider??[],e=>e.provider),rn(n.model,e,e=>e.model),rn(n.model,t?.byModel??[],e=>e.model),rn(n.tool,t?.tools.tools??[],e=>e.name),n}var on,sn,cn,ln,un,dn;function fn(){return(fn=e((()=>{de(),q(),on=e=>nn(e,{key:e=>e.key,label:e=>e.label,agentId:e=>e.agentId,channel:e=>e.channel,provider:e=>e.modelProvider??e.providerOverride,model:e=>e.model??e.modelOverride,updatedAt:e=>H(e.updatedAt),durationMs:e=>e.usage?.durationMs,messages:e=>e.usage?.messageCounts?.total,errors:e=>e.usage?.messageCounts?.errors,toolCalls:e=>e.usage?.messageCounts?.toolCalls,inputTokens:e=>e.usage?.input,outputTokens:e=>e.usage?.output,cacheReadTokens:e=>e.usage?.cacheRead,cacheWriteTokens:e=>e.usage?.cacheWrite,totalTokens:e=>e.usage?.totalTokens,totalCost:e=>e.usage?.totalCost}),sn=e=>nn(e,{date:e=>e.date,inputTokens:e=>e.input,outputTokens:e=>e.output,cacheReadTokens:e=>e.cacheRead,cacheWriteTokens:e=>e.cacheWrite,totalTokens:e=>e.totalTokens,inputCost:e=>e.inputCost,outputCost:e=>e.outputCost,cacheReadCost:e=>e.cacheReadCost,cacheWriteCost:e=>e.cacheWriteCost,totalCost:e=>e.totalCost}),cn=(e,t)=>{let n=e.trim();if(!n)return[];let r=Ke(n).map(e=>e.raw).at(-1)??``,[i,a]=r.includes(`:`)?[r.slice(0,r.indexOf(`:`)),r.slice(r.indexOf(`:`)+1)]:[``,``],o=G(i),s=G(a);if(!o)return[`agent:`,`channel:`,`provider:`,`model:`,`tool:`,`has:errors`,`has:tools`,`minTokens:`,`maxCost:`].map(e=>({label:e,value:e}));let c;switch(o){case`agent`:case`channel`:case`provider`:case`model`:case`tool`:c=t[o].slice(0,6);break;case`has`:c=[`errors`,`tools`,`context`,`usage`,`model`,`provider`];break;default:return[]}return c.filter(e=>!s||G(e).includes(s)).map(e=>({label:`${o}:${e}`,value:`${o}:${e}`}))},ln=(e,t)=>{let n=e.trim();if(!n)return`${t} `;let r=Ke(n).map(e=>e.raw);return r[r.length-1]=t,`${r.join(` `)} `},un=(e,t)=>{let n=Ke(e).map(e=>e.raw).filter(e=>e!==t);return n.length?`${n.join(` `)} `:``},dn=(e,t,n)=>{let r=G(t),i=new Map(n.map(e=>[G(e),e])),a=[];for(let t of Ke(e))(G(t.key??``)!==r||i.delete(G(t.value)))&&a.push(t.raw);let o=[...a,...Array.from(i.values(),e=>`${t}:${e}`)];return o.length?`${o.join(` `)} `:``}})))()}function pn(e,t,n){return{key:e,className:`usage-token-${e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}`,labelKey:`usage.breakdown.${e}`,hintKey:t,short:n}}function mn(e,t){let n=Date.parse(t.startDate),r=(Date.parse(t.endDate)-n)/864e5+1;if(!t.complete||!Number.isInteger(r)||r<1||r>366)return e.toSorted((e,t)=>e.date.localeCompare(t.date));let i=new Map(e.map(e=>[e.date,e]));return Array.from({length:r},(e,t)=>{let r=new Date(n+t*864e5).toISOString().slice(0,10);return i.get(r)??{..._t(),date:r}})}function hn(e,t,n,r,i,a,o){let s=mn(e,o);if(!s.length)return j`
      <div class="daily-chart-compact">
        <div class="card-title usage-section-title">${C(`usage.daily.title`)}</div>
        <div class="usage-empty-block">${C(`usage.empty.noData`)}</div>
      </div>
    `;let c=s.map(e=>e.date),l=n===`tokens`,u=r===`by-type`,d=s.map(e=>l?e.totalTokens:e.totalCost),f=Math.max(...d,0),p=f>0?f:l?1:1e-4,m=d.filter(e=>e>0),h=p/(m.length>0?Math.min(...m):p)>50,g=s.length>30?12:s.length>20?18:s.length>14?24:32,_=s.length<=14,v=new Set(t);return j`
    <div class="daily-chart-compact">
      <div class="daily-chart-header">
        ${ve({mode:`buttons`,variant:`accent`,className:`small sessions-toggle`,value:r,onChange:i,onReselect:i,options:[{value:`total`,label:C(`usage.daily.total`)},{value:`by-type`,label:C(`usage.daily.byType`)}]})}
        <div class="card-title">
          ${C(l?`usage.daily.tokensTitle`:`usage.daily.costTitle`)}
          <div class="card-sub daily-chart-range">
            ${qt(o.startDate)} – ${qt(o.endDate)}
          </div>
          ${h?j`<span
                  class="daily-chart-scale-badge"
                  title=${C(`usage.daily.compressedScaleHint`)}
                  aria-label=${C(`usage.daily.compressedScaleHint`)}
                  >√</span
                >`:A}
        </div>
      </div>
      <div class="daily-chart">
        <div class="daily-chart-plot">
          <div class="daily-chart-scale" aria-hidden="true">
            ${(f>0?[f,f/(h?4:2),0]:[0]).map(e=>j`<span
                  >${l?J(e):e===0?jt(0):Y(e)}</span
                >`)}
          </div>
          <div class="daily-chart-bars" style="--bar-max-width: ${g}px">
            ${s.map((e,t)=>{let n=l?e.totalTokens:e.totalCost,i=h?Math.sqrt(n/p):n/p,o=n<=0?0:Math.max(6,i*200),d=v.has(e.date),f=s.length<=14||t%Math.ceil(s.length/6)===0||t===s.length-1?`daily-bar-label`:`daily-bar-label daily-bar-label--hidden`,m=u?Z.map(({key:t,className:n,labelKey:r})=>({value:l?e[t]:e[`${t}Cost`]??0,className:n,labelKey:r})):[],g=m.map(({value:e,labelKey:t})=>`${C(t)} ${l?J(e):Y(e)}`),y=l?J(e.totalTokens):Y(e.totalCost),b=qt(e.date),x=`${J(e.totalTokens)} ${G(C(`usage.metrics.tokens`))}`.trim(),S=Y(e.totalCost),w=m.reduce((e,t)=>e+t.value,0)||1;return j`
                <zero-tooltip
                  .content=${[b,x,S,...g].join(`
`)}
                >
                  <div
                    class="daily-bar-wrapper ${d?`selected`:``}"
                    role="button"
                    tabindex="0"
                    aria-pressed=${d?`true`:`false`}
                    aria-label=${`${b}: ${x}, ${S}`}
                    @keydown=${t=>{(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),a(e.date,t.shiftKey,c))}}
                    @click=${t=>a(e.date,t.shiftKey,c)}
                  >
                    ${L(r,j`
                        <div
                          class="daily-bar ${u?`daily-bar--stacked `:``}${o===0?`daily-bar--empty`:``}"
                          style="height: ${o.toFixed(0)}px${u?`;`:``}"
                        >
                          ${m.map(({className:e,value:t})=>j`
                              <div
                                class="cost-segment ${e}"
                                style="height: ${t/w*100}%"
                              ></div>
                            `)}
                        </div>
                      `)}
                    ${_?j`<div class="daily-bar-total">${y}</div>`:j`<div
                            class="daily-bar-total daily-bar-total--placeholder"
                            aria-hidden="true"
                          ></div>`}
                    <div class="${f}">${Kt(e.date)}</div>
                  </div>
                </zero-tooltip>
              `})}
          </div>
        </div>
      </div>
    </div>
  `}function gn(e,t){let n=t===`tokens`,r=n?e.totalTokens||1:e.totalCost||0,i=Z.map(({key:t,className:i,labelKey:a})=>{let o=n?e[t]:e[`${t}Cost`]||0;return{className:i,labelKey:a,percentage:r===0?0:o/r*100,formatted:n?J(o):Y(o)}});return j`
    <div class="cost-breakdown cost-breakdown-compact">
      <div class="cost-breakdown-header">
        ${C(n?`usage.breakdown.tokensByType`:`usage.breakdown.costByType`)}
      </div>
      <div class="cost-breakdown-bar">
        ${i.map(({className:e,labelKey:t,percentage:n,formatted:r})=>j`
            <div
              class="cost-segment ${e}"
              style="width: ${n.toFixed(1)}%"
              title="${C(t)}: ${r}"
            ></div>
          `)}
      </div>
      <div class="cost-breakdown-legend">
        ${i.map(({className:e,labelKey:t,formatted:n})=>j`
            <span class="legend-item"
              ><span class="legend-dot ${e}"></span>${C(t)} ${n}</span
            >
          `)}
      </div>
      <div class="cost-breakdown-total">
        ${C(`usage.breakdown.total`)}:
        ${n?J(e.totalTokens):Y(e.totalCost)}
      </div>
    </div>
  `}var Z;function _n(){return(_n=e((()=>{M(),I(),K(),u(),D(),X(),Z=[pn(`output`,`usage.details.assistantOutputTokens`,`Out`),pn(`input`,`usage.details.userToolInputTokens`,`In`),pn(`cacheWrite`,`usage.details.tokensWrittenToCache`,`CW`),pn(`cacheRead`,`usage.details.tokensReadFromCache`,`CR`)]})))()}function vn({actor:e}){if(!e)return C(`usage.creators.unattributed`);let t=e.label?.trim()||e.identity?.id||e.id||C(e.type===`system`?`usage.creators.system`:`usage.common.unknown`);return e.identity?.type===`profile`?Fe({id:e.identity.id,name:t}):t}function yn(e){let t=e.options.toSorted((e,t)=>vn(e).localeCompare(vn(t))).map(e=>({key:e.key,label:vn(e)}));return e.selectedKey!==null&&!t.some(t=>t.key===e.selectedKey)&&t.push({key:e.selectedKey,label:C(`usage.creators.selected`)}),j`
    <select
      class="usage-select usage-creator-filter"
      aria-label=${C(`usage.creators.select`)}
      @change=${t=>{let n=t.currentTarget.value;e.onSelect(n||null)}}
    >
      <option value="" .selected=${e.selectedKey===null}>${C(`usage.creators.all`)}</option>
      ${t.map(t=>j`
          <option value=${t.key} .selected=${t.key===e.selectedKey}>
            ${t.label}
          </option>
        `)}
    </select>
  `}function bn(e){let t=t=>e.mode===`tokens`?t.totals.totalTokens:t.totals.totalCost,n=e.groups.toSorted((e,n)=>t(n)-t(e)||vn(e).localeCompare(vn(n))),r=n.reduce((e,n)=>e+t(n),0),i=n=>j`
    <table class="usage-creators-table">
      <thead>
        <tr>
          <th scope="col">${C(`usage.creators.identity`)}</th>
          <th scope="col">${C(`usage.metrics.tokens`)}</th>
          <th scope="col">${C(`usage.metrics.cost`)}</th>
          <th scope="col">${C(`usage.metrics.sessions`)}</th>
        </tr>
      </thead>
      <tbody>
        ${n.map(n=>j`
            <tr class=${n.key===e.selectedKey?`selected`:``}>
              <th scope="row">
                <button
                  type="button"
                  class="usage-creator-select"
                  aria-pressed=${n.key===e.selectedKey}
                  @click=${()=>e.onSelect(n.key)}
                >
                  <span class="usage-creator-name">
                    <span aria-hidden="true">${me(n.actor,`row`)}</span>
                    <span>${vn(n)}</span>
                  </span>
                  <span class="usage-creator-track" aria-hidden="true">
                    <span style=${`width: ${r>0?t(n)/r*100:0}%`}></span>
                  </span>
                </button>
              </th>
              <td class=${e.mode===`tokens`?`usage-creator-primary`:``}>
                ${J(n.totals.totalTokens)}
              </td>
              <td class=${e.mode===`cost`?`usage-creator-primary`:``}>
                ${jt(n.totals.totalCost)}
              </td>
              <td>${n.sessionCount}</td>
            </tr>
          `)}
      </tbody>
    </table>
  `;return ye({title:C(`usage.creators.title`),description:C(`usage.creators.description`)},j`
      <div class="usage-panel usage-creators">
        ${n.length>0?i(n.slice(0,8)):j`<div class="usage-empty-block usage-empty-block--compact">
                ${C(`usage.creators.empty`)}
              </div>`}
        ${n.length>8?j`
                <details class="usage-creators-more">
                  <summary>
                    ${C(`usage.creators.more`,{count:String(n.length-8)})}
                  </summary>
                  ${i(n.slice(8))}
                </details>
              `:A}
      </div>
    `)}function xn(){return(xn=e((()=>{M(),_e(),K(),u(),Ie(),X()})))()}function Sn(e){let{sessionKey:t,displayLabel:n,meta:r,agentId:i,valueLabel:a,isSelected:o,onSelect:s}=e;return j`
    <div
      class="session-bar-row ${o?`selected`:``}"
      @click=${e=>{e.target instanceof Element&&e.target.closest(`button`)||s(e)}}
      title="${t}"
    >
      <button
        type="button"
        class="session-bar-selection"
        aria-label=${n}
        aria-pressed=${o?`true`:`false`}
        @click=${s}
      >
        <span class="session-bar-label">
          <span class="session-bar-title">${n}</span>
          ${i?xe(i):A}
          ${r.length>0?j`<span class="session-bar-meta">${r.join(` · `)}</span>`:A}
        </span>
      </button>
      <div class="session-bar-actions">
        ${L(n,j`<button
            type="button"
            class="btn btn--sm btn--ghost"
            @click=${e=>{e.stopPropagation(),be(e,n,C(`usage.sessions.copy`))}}
          >
            <span data-copy-label>${C(`usage.sessions.copy`)}</span>
          </button>`)}
        <div class="session-bar-value">${a}</div>
      </div>
    </div>
  `}function Cn(){return(Cn=e((()=>{M(),I(),ke(),De(),u()})))()}function wn(e,{filters:t,callbacks:n}){let{selectedDays:r,selectedHours:i,selectedSessions:a}=t,{onClearDays:o,onClearHours:s,onClearSessions:c,onClearFilters:l}=n.filters;if(!(r.length>0||i.length>0||a.length>0))return A;let u=a.at(0)??``,d=a.length===1?e.find(e=>e.key===u):null,f=d?B(d.label||d.key,20)+((d.label||d.key).length>20?`…`:``):a.length===1?B(u,8)+`…`:C(`usage.filters.sessionsCount`,{count:String(a.length)}),p=d?d.label||d.key:a.length===1?u:a.join(`, `),m=r.length===1?r[0]:C(`usage.filters.daysCount`,{count:String(r.length)}),h=i.length===1?`${i[0]}:00`:C(`usage.filters.hoursCount`,{count:String(i.length)}),g=[{active:r.length>0,labelKey:`usage.filters.days`,value:m,removeKey:`usage.filters.removeDays`,onClear:o},{active:i.length>0,labelKey:`usage.filters.hours`,value:h,removeKey:`usage.filters.removeHours`,onClear:s},{active:a.length>0,labelKey:`usage.filters.session`,value:f,removeKey:`usage.filters.removeSession`,onClear:c,title:p}];return j`
    <div class="active-filters">
      ${g.filter(({active:e})=>e).map(({labelKey:e,value:t,removeKey:n,onClear:r,title:i})=>j`
            <div class="filter-chip" title=${re(i)}>
              <span class="filter-chip-label">${C(e)}: ${t}</span>
              <zero-tooltip .content=${C(`usage.filters.remove`)}>
                <button class="filter-chip-remove" @click=${r} aria-label=${C(n)}>
                  ${te.x}
                </button>
              </zero-tooltip>
            </div>
          `)}
      ${(r.length>0||i.length>0)&&a.length>0?j`
              <button class="btn btn--sm" @click=${l}>
                ${C(`usage.filters.clearAll`)}
              </button>
            `:A}
    </div>
  `}function Tn(e,t,n,r){let[i,...a]=Yt(e,t,n);if(!i||e.length===0)return A;let o=Ye(new Date,r),s=(e,t)=>e===1?t===o?C(`usage.presets.today`):Kt(t):C(`usage.costWindows.lastDays`,{count:String(e)}),c=[{label:C(`usage.costWindows.selectedRange`),summary:i,range:!0},...a.map(e=>({label:s(e.days,e.endDate),summary:e,range:!1}))];return j`
    <section class="cost-window-analysis">
      <div class="cost-window-header">
        <div>
          <div class="card-title usage-section-title">${C(`usage.costWindows.title`)}</div>
          <div class="card-sub">
            ${C(`usage.costWindows.subtitle`,{date:qt(n)})}
          </div>
        </div>
        <div class="cost-window-range-label">
          ${Kt(t)} – ${Kt(n)}
        </div>
      </div>
      <div class="cost-window-grid">
        ${c.map(({label:e,summary:t,range:n})=>{let r=t.totals.totalCost/t.days;return j`
            <div class="cost-window-card ${n?`cost-window-card--range`:``}">
              <div class="cost-window-card__label">${e}</div>
              <div class="cost-window-card__value">
                ${Y(t.totals.totalCost)}
              </div>
              <div class="cost-window-card__meta">
                ${J(t.totals.totalTokens)} ${C(`usage.metrics.tokens`)} ·
                ${Y(r)} ${C(`usage.costWindows.perDay`)}
              </div>
            </div>
          `})}
      </div>
    </section>
  `}function En(e,t,n,r){let i=[`usage-insight-card`,r?.className].filter(Boolean).join(` `),a=[r?.error?`usage-error-list`:`usage-list`,r?.listClassName].filter(Boolean).join(` `);return j`
    <div class=${i}>
      <div class="usage-insight-title">${e}</div>
      ${t.length===0?j`<div class="muted">${n}</div>`:j`
              <div class=${a}>
                ${t.map(e=>r?.error?j`
                        <div class="usage-error-row">
                          <div class="usage-error-date">${e.label}</div>
                          <div class="usage-error-rate">${e.value}</div>
                          ${e.sub?j`<div class="usage-error-sub">${e.sub}</div>`:A}
                        </div>
                      `:j`
                        <div class="usage-list-item">
                          <span
                            >${e.agentId?xe(e.agentId):e.label}</span
                          >
                          <span class="usage-list-value">
                            <span>${e.value}</span>
                            ${e.sub?j`<span class="usage-list-sub">${e.sub}</span>`:A}
                          </span>
                        </div>
                      `)}
              </div>
            `}
    </div>
  `}function Dn(e){let t=e.currentTarget;t instanceof HTMLElement&&t.focus()}function Q(e){let t=`usage-summary-hint-${e.hintId}`,n=C(`usage.overview.${e.metric}`),r=[`stat`,`usage-summary-card`,e.className,e.tone?`usage-summary-card--${e.tone}`:``].filter(Boolean).join(` `),i=[`stat-value`,`usage-summary-value`,e.tone??``,e.compactValue?`usage-summary-value--compact`:``].filter(Boolean).join(` `);return j`
    <div class=${r}>
      <div class="usage-summary-title">
        ${n}
        <zero-tooltip open-on-click>
          <button
            id=${t}
            type="button"
            class="usage-summary-hint"
            aria-label=${n}
            @click=${Dn}
          >
            ?
          </button>
          <!-- Shared tooltips dismiss pointer activation so action buttons never
               strand one open. This hint exists only to be read, so it opts in to
               click-to-open; the click handler still normalizes browsers that do
               not focus buttons on pointer activation. -->
          <span slot="content">${e.hint??C(`usage.overview.${e.metric}Hint`)}</span>
        </zero-tooltip>
      </div>
      <div class=${i}>${e.value}</div>
      <div class="usage-summary-sub">${e.sub}</div>
    </div>
  `}function On(e,t,n,r,i,a,o,s){if(!e)return A;let c=t.messages.total?Math.round(e.totalTokens/t.messages.total):0,l=t.messages.total?e.totalCost/t.messages.total:0,u=e.input+e.cacheRead+e.cacheWrite,d=u>0?e.cacheRead/u:0,f=u>0?`${(d*100).toFixed(1)}%`:C(`usage.common.emptyValue`),p=n.errorRate*100,m=n.throughputTokensPerMin===void 0?C(`usage.common.emptyValue`):`${J(Math.round(n.throughputTokensPerMin))} ${C(`usage.overview.tokensPerMinute`)}`,h=n.throughputCostPerMin===void 0?C(`usage.common.emptyValue`):`${Y(n.throughputCostPerMin)} ${C(`usage.overview.perMinute`)}`,g=n.durationCount>0?z(n.avgDurationMs)??C(`usage.common.emptyValue`):C(`usage.common.emptyValue`),_=t.daily.filter(e=>e.messages>0&&e.errors>0).map(e=>{let t=e.errors/e.messages;return{label:Kt(e.date),value:`${(t*100).toFixed(2)}%`,sub:`${e.errors} ${G(C(`usage.overview.errors`))} · ${e.messages} ${C(`usage.overview.messagesAbbrev`)} · ${J(e.tokens)}`,rate:t}}).toSorted((e,t)=>t.rate-e.rate).slice(0,5).map(({rate:e,...t})=>t),v=(t,{totals:n,count:r},a=!1)=>({label:t,...a?{agentId:t}:{},value:Y(n.totalCost),sub:[i&&e.totalCost>0?C(`usage.overview.costShare`,{percent:(n.totalCost/e.totalCost*100).toFixed(1)}):null,J(n.totalTokens),r===void 0?null:`${r} ${C(`usage.overview.messagesAbbrev`)}`].filter(e=>e!==null).join(` · `)}),y=t.byModel.slice(0,5).map(e=>v(e.model??C(`usage.common.unknown`),e)),b=t.byProvider.slice(0,5).map(e=>v(e.provider??C(`usage.common.unknown`),e)),x=t.tools.tools.slice(0,6).map(e=>({label:e.name,value:`${e.count}`,sub:C(`usage.overview.calls`)})),S=t.byAgent.slice(0,5).map(e=>v(e.agentId,e,!0)),w=t.byChannel.slice(0,5).map(e=>v(e.channel,e)),T=[[`usage.overview.topModels`,y,`usage.overview.noModelData`],[`usage.overview.topProviders`,b,`usage.overview.noProviderData`],[`usage.overview.topTools`,x,`usage.overview.noToolCalls`],[`usage.overview.topAgents`,S,`usage.overview.noAgentData`],[`usage.overview.topChannels`,w,`usage.overview.noChannelData`]];return ye({title:C(`usage.overview.title`)},j`
      <section class="usage-panel usage-overview-card">
        <div class="usage-overview-layout">
          <div class="usage-summary-grid">
            ${Q({hintId:`messages`,metric:`messages`,value:t.messages.total,sub:`${t.messages.user} ${G(C(`usage.overview.user`))} · ${t.messages.assistant} ${G(C(`usage.overview.assistant`))}`,className:`usage-summary-card--hero`})}
            ${Q({hintId:`throughput`,metric:`throughput`,value:m,sub:h,className:`usage-summary-card--hero usage-summary-card--throughput`,compactValue:!0})}
            ${Q({hintId:`tool-calls`,metric:`toolCalls`,value:t.tools.totalCalls,sub:`${t.tools.uniqueTools} ${C(`usage.overview.toolsUsed`)}`,className:`usage-summary-card--half`})}
            ${Q({hintId:`average-tokens`,metric:`avgTokens`,value:J(c),sub:C(`usage.overview.acrossMessages`,{count:String(t.messages.total||0)}),className:`usage-summary-card--half`})}
            ${Q({hintId:`cache-hit-rate`,metric:`cacheHitRate`,hint:C(`usage.overview.cacheHint`),value:f,sub:`${J(e.cacheRead)} ${C(`usage.overview.cached`)} · ${J(u)} ${C(`usage.overview.prompt`)}`,tone:d>.6?`good`:d>.3?`warn`:`bad`,className:`usage-summary-card--medium`})}
            ${Q({hintId:`error-rate`,metric:`errorRate`,hint:C(`usage.overview.errorHint`),value:`${p.toFixed(2)}%`,sub:`${t.messages.errors} ${G(C(`usage.overview.errors`))} · ${g} ${C(`usage.overview.avgSession`)}`,tone:p>5?`bad`:p>1?`warn`:`good`,className:`usage-summary-card--medium`})}
            ${Q({hintId:`average-cost`,metric:`avgCost`,hint:C(r?`usage.overview.avgCostHintMissing`:`usage.overview.avgCostHint`),value:Y(l),sub:`${Y(e.totalCost)} ${G(C(`usage.breakdown.total`))}`,className:`usage-summary-card--compact`})}
            ${Q({hintId:`sessions`,metric:`sessions`,value:o,sub:C(`usage.overview.sessionsInRange`,{count:String(s)}),className:`usage-summary-card--compact`})}
            ${Q({hintId:`errors`,metric:`errors`,value:t.messages.errors,sub:`${t.messages.toolResults} ${C(`usage.overview.toolResults`)}`,className:`usage-summary-card--compact`})}
          </div>
          <div class="usage-insights-grid">
            ${T.map(([e,t,n])=>En(C(e),t,C(n)))}
            ${En(C(`usage.overview.peakErrorDays`),_,C(`usage.overview.noErrorData`),{error:!0})}
            ${En(C(`usage.overview.peakErrorHours`),a,C(`usage.overview.noErrorData`),{error:!0,className:`usage-insight-card--wide`,listClassName:`usage-error-list--hours`})}
          </div>
        </div>
      </section>
    `)}function kn(e,{filters:t,display:n,callbacks:r},i){let{selectedSessions:a,selectedDays:o}=t,{sessionSort:s,sessionSortDir:c,recentSessions:l,sessionsTab:u}=n,{onSelectSession:d}=r.details,{onSessionSortChange:f,onSessionSortDirChange:p,onSessionsTabChange:m}=r.display,{onClearSessions:h}=r.filters,g=n.chartMode===`tokens`,_=C(c===`desc`?`usage.sessions.descending`:`usage.sessions.ascending`),v=e=>[e.channel&&`channel:${e.channel}`,(e.modelProvider||e.providerOverride)&&`provider:${e.modelProvider??e.providerOverride}`,e.model&&`model:${e.model}`,e.usage?.messageCounts&&`msgs:${e.usage.messageCounts.total}`,e.usage?.toolUsage&&`tools:${e.usage.toolUsage.totalCalls}`,e.usage?.messageCounts&&`errors:${e.usage.messageCounts.errors}`,e.usage?.durationMs&&`dur:${z(e.usage.durationMs)??`—`}`].filter(e=>typeof e==`string`&&e.length>0),y=new Set(o),b=e.map(e=>{let t=e.usage,n=t?.totalTokens??0,r=t?.totalCost??0,i=y.size>0?t?.dailyBreakdown:void 0;if(i?.length){n=0,r=0;for(let e of i)y.has(e.date)&&(n+=e.tokens,r+=e.cost)}let a=e.label||e.key;return{session:e,displayLabel:a.startsWith(`agent:`)&&a.includes(`?token=`)?a.slice(0,a.indexOf(`?token=`)):a,value:g?n:r,sortValue:{recent:e.updatedAt??0,messages:t?.messageCounts?.total??0,errors:t?.messageCounts?.errors??0,cost:r,tokens:n}[s]}}).toSorted((e,t)=>{let n=t.sortValue-e.sortValue;if(n!==0)return n;let r=(t.session.updatedAt??0)-(e.session.updatedAt??0);return r===0?e.displayLabel.localeCompare(t.displayLabel):r}),x=c===`asc`?b.toReversed():b,S=x.reduce((e,t)=>e+t.value,0),w=x.length?S/x.length:0,T=x.reduce((e,t)=>e+(t.session.usage?.messageCounts?.errors??0),0),E=new Set(a),D=x.filter(e=>E.has(e.session.key)),O=D.length,ee=new Map(x.map(e=>[e.session.key,e])),te=l.map(e=>ee.get(e)).filter(e=>e!==void 0),k=u===`recent`?te:x.slice(0,50),M=e=>{let t=e.map(e=>e.session.key);return e.map(e=>Sn({sessionKey:e.session.key,displayLabel:e.displayLabel,meta:v(e.session),agentId:e.session.agentId,valueLabel:g?J(e.value):Y(e.value),isSelected:E.has(e.session.key),onSelect:n=>d(e.session.key,n.shiftKey,t)}))};return ye({title:C(`usage.sessions.title`)},j`
      <div class="usage-panel sessions-card">
        <div class="sessions-card-header">
          <div class="sessions-card-count">
            ${C(`usage.sessions.shown`,{count:String(k.length)})}
            ${i===k.length?``:` · ${C(`usage.sessions.total`,{count:String(i)})}`}
          </div>
        </div>
        <div class="sessions-card-meta">
          <div class="sessions-card-stats">
            <span>
              ${g?J(w):Y(w)}
              ${C(`usage.sessions.avg`)}
            </span>
            <span
              >${T} ${G(C(`usage.overview.errors`))}</span
            >
          </div>
          ${ve({mode:`buttons`,variant:`accent`,ariaPressed:!1,className:`small`,value:u,onChange:m,onReselect:m,options:[{value:`all`,label:C(`usage.sessions.all`)},{value:`recent`,label:C(`usage.sessions.recent`)}]})}
          <label class="sessions-sort">
            <span>${C(`usage.sessions.sort`)}</span>
            <select
              class="settings-select"
              @change=${e=>f(e.target.value)}
            >
              ${Object.entries({cost:`usage.metrics.cost`,errors:`usage.overview.errors`,messages:`usage.overview.messages`,recent:`usage.sessions.recentShort`,tokens:`usage.metrics.tokens`}).map(([e,t])=>j`<option value=${e} ?selected=${s===e}>
                    ${C(t)}
                  </option>`)}
            </select>
          </label>
          <zero-tooltip .content=${_}>
            <button
              class="btn btn--sm"
              aria-label=${_}
              @click=${()=>p(c===`desc`?`asc`:`desc`)}
            >
              ${c===`desc`?`↓`:`↑`}
            </button>
          </zero-tooltip>
          ${O>0?j`
                  <button class="btn btn--sm" @click=${h}>
                    ${C(`usage.sessions.clearSelection`)}
                  </button>
                `:A}
        </div>
        ${k.length===0?j`<div class="usage-empty-block">
                ${C(u===`recent`?`usage.sessions.noRecent`:`usage.sessions.noneInRange`)}
              </div>`:j`
                <div
                  class=${u===`recent`?`session-bars session-bars--recent`:`session-bars`}
                >
                  ${M(k)}
                  ${u===`all`&&e.length>k.length?j`
                          <div class="usage-more-sessions">
                            ${C(`usage.sessions.more`,{count:String(e.length-k.length)})}
                          </div>
                        `:A}
                </div>
              `}
        ${O>1?j`
                <div class="sessions-selected-group">
                  <div class="sessions-card-count">
                    ${C(`usage.sessions.selected`,{count:String(O)})}
                  </div>
                  <div class="session-bars session-bars--selected">
                    ${M(D)}
                  </div>
                </div>
              `:A}
      </div>
    `)}function An(){return(An=e((()=>{M(),ne(),ke(),O(),K(),u(),D(),oe(),q(),X(),Cn()})))()}function jn(e,t,n){let r=t||e.usage;if(!r)return j` <div class="usage-empty-block">${C(`usage.details.noUsageData`)}</div> `;let i=e=>e?d(e):C(`usage.common.emptyValue`),a=n!==void 0,o=n?.filter(e=>e.timestamp>0),s=a?o?.length?o.reduce((e,{role:t})=>((t===`user`||t===`assistant`)&&(e[t]+=1,e.total+=1),e),{total:0,user:0,assistant:0}):void 0:r.messageCounts,c=[e.channel&&`channel:${e.channel}`,e.agentId&&`agent:${e.agentId}`,(e.modelProvider||e.providerOverride)&&`provider:${e.modelProvider??e.providerOverride}`,e.model&&`model:${e.model}`].filter(Boolean),l=r.toolUsage?.tools.slice(0,6)??[],u;if(o?.length){u=new Map;for(let e of o.filter(({role:e})=>e===`assistant`))for(let[t,n]of Ge(e.content).tools)u.set(t,(u.get(t)??0)+n)}let f=l.map(e=>({label:e.name,value:`${u?u.get(e.name)??0:a?C(`usage.common.emptyValue`):e.count}`,sub:C(`usage.overview.calls`)})),p=u?[...u.values()].reduce((e,t)=>e+t,0):a?C(`usage.common.emptyValue`):r.toolUsage?.totalCalls??0,m=u?u.size:a?C(`usage.common.emptyValue`):r.toolUsage?.uniqueTools??0,h=r.modelUsage?.slice(0,6).map(e=>({label:e.model??C(`usage.common.unknown`),value:jt(e.totals.totalCost),sub:J(e.totals.totalTokens)}))??[],g=[{labelKey:`usage.overview.messages`,value:s?.total??(a?C(`usage.common.emptyValue`):0),meta:j`${a&&!s?C(`usage.common.emptyValue`):j`${s?.user??0}
            ${G(C(`usage.overview.user`))} ·
            ${s?.assistant??0}
            ${G(C(`usage.overview.assistant`))}`}${a?j`<br />${C(`usage.details.loadedIntervalMessages`)}`:A}`},{labelKey:`usage.overview.toolCalls`,value:p,meta:j`${m} ${C(`usage.overview.toolsUsed`)}`},{labelKey:`usage.overview.errors`,value:a?C(`usage.common.emptyValue`):r.messageCounts?.errors??0,meta:j`${a?C(`usage.common.emptyValue`):r.messageCounts?.toolResults??0}
      ${C(`usage.overview.toolResults`)}`},{labelKey:`usage.details.duration`,value:z(r.durationMs)??C(`usage.common.emptyValue`),meta:j`${i(r.firstActivity)} → ${i(r.lastActivity)}`}];return j`
    ${c.length>0?j`<div class="usage-badges">
            ${c.map(e=>j`<span class="settings-row__value">${e}</span>`)}
          </div>`:A}
    <div class="session-summary-grid">
      ${g.map(({labelKey:e,value:t,meta:n})=>j`
          <div class="stat session-summary-card">
            <div class="session-summary-title">${C(e)}</div>
            <div class="stat-value session-summary-value">${t}</div>
            <div class="session-summary-meta">${n}</div>
          </div>
        `)}
    </div>
    <div class="usage-insights-grid usage-insights-grid--tight">
      ${En(C(`usage.overview.topTools`),f,C(`usage.overview.noToolCalls`))}
      ${En(C(`usage.details.modelMix`),h,C(`usage.overview.noModelData`))}
    </div>
  `}function Mn(){return(Mn=e((()=>{M(),u(),oe(),p(),q(),X(),An()})))()}function Nn(e,t,n){let r=Number(e.slice(0,4)),i=Number(e.slice(5,7))-1,a=Number(e.slice(8,10))+n;return t===`utc`?Date.UTC(r,i,a):new Date(r,i,a).getTime()}function Pn(e,n,{startDate:r,endDate:i,selectedDays:a,timeZone:o}){let{timeSeries:s,timeSeriesLoading:c,timeSeriesStatus:l,timeSeriesMode:u,timeSeriesBreakdownMode:d,timeSeriesCursorStart:p,timeSeriesCursorEnd:m}=e;if((c||l.awaitingGateway)&&!l.hasLoaded)return j`
      <div class="session-timeseries-compact">
        <div class="usage-empty-block">${C(`usage.loading.badge`)}</div>
      </div>
    `;let h=ht(l,`usage.details.usageOverTime`,`timeline`);if(l.error&&!l.hasLoaded)return j`
      <div class="session-timeseries-compact">
        <div class="card-title usage-section-title">${C(`usage.details.usageOverTime`)}</div>
        ${h}
      </div>
    `;let g=e=>j`
    <div class="session-timeseries-compact">
      ${h}
      <div class="usage-empty-block">${C(e)}</div>
    </div>
  `;if(!s||s.points.length<2)return g(`usage.details.noTimeline`);let _=s.points;if(r||i||a.length>0){let e=r?Nn(r,o,0):0,t=i?Nn(i,o,1):1/0,n=a.length?new Set(a):void 0;_=s.points.filter(r=>r.timestamp<e||r.timestamp>=t?!1:!n||n.has(Ye(new Date(r.timestamp),o)))}if(_.length<2)return g(`usage.details.noDataInRange`);let v=0,y=0,b=u===`cumulative`,x=u===`per-turn`&&d===`by-type`,S=_.map(e=>(v+=e.totalTokens,y+=e.cost,{timestamp:e.timestamp,input:e.input,output:e.output,cacheRead:e.cacheRead,cacheWrite:e.cacheWrite,cost:e.cost,value:b?v:x?e.input+e.output+e.cacheRead+e.cacheWrite:e.totalTokens})),w=p!=null&&m!=null,T=w?Math.min(p,m):0,E=w?Math.max(p,m):1/0,D=0,O=S.length;if(w){D=S.findIndex(e=>e.timestamp>=T),D===-1&&(D=S.length);let e=S.findIndex(e=>e.timestamp>E);O=e===-1?S.length:e}let ee=w?S.slice(D,O):S,te={output:0,input:0,cacheRead:0,cacheWrite:0};for(let e of ee)for(let{key:t}of Z)te[t]+=e[t];let k={top:8,right:4,bottom:14,left:30},M=400-k.left-k.right,P=100-k.top-k.bottom,ne=o===`utc`?{timeZone:`UTC`}:{},F=t({month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`,...ne},``),I=e=>f(e,{hour:`2-digit`,minute:`2-digit`,...ne},``),L=Object.values(te).reduce((e,t)=>e+t,0),R=Math.max(...S.map(e=>e.value),1),re=M/S.length,z=Math.min(In,Math.max(1,re*Fn)),ie=re-z,ae=k.left+D*(z+ie),oe=k.left+(Math.min(O,S.length)-1)*(z+ie)+z,B=se(S[0],`time series first point`).timestamp,V=se(S.at(-1),`time series last point`).timestamp,H=Math.max(B,Math.min(V,T)),U=Math.max(B,Math.min(V,E)),ce=(e,t)=>{n.onTimeSeriesCursorRangeChange(e===`left`?Math.max(B,Math.min(t,U)):H,e===`right`?Math.min(V,Math.max(t,H)):U)},W=(e,t)=>{let n=t===`left`?H:U,r=t===`left`?B:H,i=t===`left`?U:V,a;switch(e.key){case`ArrowLeft`:case`ArrowDown`:a=S.findLast(e=>e.timestamp<n)?.timestamp??r;break;case`ArrowRight`:case`ArrowUp`:a=S.find(e=>e.timestamp>n)?.timestamp??i;break;case`Home`:a=r;break;case`End`:a=i;break;default:return}e.preventDefault(),ce(t,a)},le=e=>t=>{if(!(t.currentTarget instanceof HTMLElement))return;t.preventDefault(),t.stopPropagation();let n=t.currentTarget.closest(`.timeseries-chart-wrapper`)?.querySelector(`svg`);if(!n)return;let r=n.getBoundingClientRect(),i=r.width,a=k.left/400*i,o=(400-k.right)/400*i-a,s=e=>{let t=Math.max(0,Math.min(1,(e-r.left-a)/o));return Math.min(Math.floor(t*S.length),S.length-1)},c=e===`left`?ae:oe,l=r.left+c/400*i,u=t.clientX-l;document.body.style.cursor=`col-resize`;let d=t=>{let n=t.clientX-u,r=s(n),i=S[r];i&&ce(e,i.timestamp)},f=()=>{document.body.style.cursor=``,document.removeEventListener(`mousemove`,d),document.removeEventListener(`mouseup`,f)};document.addEventListener(`mousemove`,d),document.addEventListener(`mouseup`,f)};return j`
    <div class="session-timeseries-compact">
      <div class="timeseries-header-row">
        <div class="card-title usage-section-title">${C(`usage.details.usageOverTime`)}</div>
        <div class="timeseries-controls">
          ${w?j`
                  <div class="settings-segmented settings-segmented--accent small">
                    <button
                      class="btn btn--sm settings-segmented__btn settings-segmented__btn--active"
                      @click=${()=>n.onTimeSeriesCursorRangeChange(null,null)}
                    >
                      ${C(`usage.details.reset`)}
                    </button>
                  </div>
                `:A}
          ${ve({mode:`buttons`,variant:`accent`,className:`small`,value:u,onChange:n.onTimeSeriesModeChange,onReselect:n.onTimeSeriesModeChange,options:[{value:`per-turn`,label:C(`usage.details.perTurn`)},{value:`cumulative`,label:C(`usage.details.cumulative`)}]})}
          ${b?A:ve({mode:`buttons`,variant:`accent`,className:`small`,value:d,onChange:n.onTimeSeriesBreakdownChange,onReselect:n.onTimeSeriesBreakdownChange,options:[{value:`total`,label:C(`usage.daily.total`)},{value:`by-type`,label:C(`usage.daily.byType`)}]})}
        </div>
      </div>
      ${h}
      <div class="timeseries-chart-wrapper">
        <svg viewBox="0 0 ${400} ${118}" class="timeseries-svg">
          ${[{x1:k.left,y1:k.top,x2:k.left,y2:k.top+P},{x1:k.left,y1:k.top+P,x2:400-k.right,y2:k.top+P}].map(({x1:e,y1:t,x2:n,y2:r})=>N`<line x1="${e}" y1="${t}" x2="${n}" y2="${r}" stroke="var(--border)" />`)}
          ${[{y:k.top+5,text:J(R)},{y:k.top+P,text:`0`}].map(({y:e,text:t})=>N`<text x="${k.left-4}" y="${e}" text-anchor="end" class="ts-axis-label">${t}</text>`)}
          ${N`
            <text x="${k.left}" y="${k.top+P+10}" text-anchor="start" class="ts-axis-label">${I(B)}</text>
            <text x="${400-k.right}" y="${k.top+P+10}" text-anchor="end" class="ts-axis-label">${I(V)}</text>
          `}
          ${S.map((e,t)=>{let n=e.value,r=k.left+t*(z+ie),i=n/R*P,a=k.top+P-i,o=[F(e.timestamp),`${J(n)} ${G(C(`usage.metrics.tokens`))}`];x&&o.push(...Z.map(({key:t,short:n})=>`${n} ${J(e[t])}`));let s=o.join(` · `),c=w&&(t<D||t>=O);if(!x)return N`<rect x="${r}" y="${a}" width="${z}" height="${i}" class="ts-bar${c?` dimmed`:``}" rx="1" role="img" data-tooltip=${s} aria-label=${s}></rect>`;let l=k.top+P,u=c?` dimmed`:``;return N`
              ${Z.map(({key:t,className:a})=>{let o=e[t];if(o<=0||n<=0)return A;let c=o/n*i;return l-=c,N`<rect x="${r}" y="${l}" width="${z}" height="${c}" class="ts-bar ${a}${u}" rx="1" role="img" data-tooltip=${s} aria-label=${s}></rect>`})}
            `})}
          <!-- Selection highlight overlay (always visible between handles) -->
          ${N`
            <rect
              x="${ae}"
              y="${k.top}"
              width="${Math.max(1,oe-ae)}"
              height="${P}"
              fill="var(--accent)"
              opacity="${Ln}"
              pointer-events="none"
            />
          `}
          ${[ae,oe].map(e=>N`
              <line x1="${e}" y1="${k.top}" x2="${e}" y2="${k.top+P}" stroke="var(--accent)" stroke-width="0.8" opacity="0.7" />
              <rect x="${e-Rn/2}" y="${k.top+P/2-zn/2}" width="${Rn}" height="${zn}" rx="1.5" fill="var(--accent)" class="cursor-handle" />
              ${[-.7,Bn].map(t=>N`<line x1="${e+t}" y1="${k.top+P/2-zn/5}" x2="${e+t}" y2="${k.top+P/2+zn/5}" stroke="var(--bg)" stroke-width="0.4" pointer-events="none" />`)}
            `)}
        </svg>
        <!-- Handle drag zones (only on handles, not full chart) -->
        ${[`left`,`right`].map(e=>{let t=e===`left`?ae:oe;return j`<div
            class="chart-handle-zone chart-handle-${e}"
            role="slider"
            tabindex="0"
            aria-label=${C(e===`left`?`usage.details.rangeStart`:`usage.details.rangeEnd`)}
            aria-valuemin=${e===`left`?B:H}
            aria-valuemax=${e===`left`?U:V}
            aria-valuenow=${e===`left`?H:U}
            aria-valuetext=${F(e===`left`?H:U)}
            style="left: ${(t/400*100).toFixed(1)}%;"
            @mousedown=${le(e)}
            @keydown=${t=>W(t,e)}
          ></div>`})}
      </div>
      <div class="timeseries-summary">
        ${w?j`
                <span class="timeseries-summary__range">
                  ${C(`usage.details.turnRange`,{start:String(D+1),end:String(O),total:String(S.length)})}
                </span>
                · ${I(T)}–${I(E)} ·
                ${J(L)} ·
                ${jt(ee.reduce((e,t)=>e+(t.cost||0),0))}
              `:j`${S.length} ${C(`usage.overview.messagesAbbrev`)} ·
              ${J(v)} · ${jt(y)}`}
      </div>
      ${x?j`
              <div class="timeseries-breakdown">
                <div class="card-title usage-section-title">
                  ${C(`usage.breakdown.tokensByType`)}
                </div>
                <div class="cost-breakdown-bar cost-breakdown-bar--compact">
                  ${Z.map(({key:e,className:t})=>j`
                      <div
                        class="cost-segment ${t}"
                        style="width: ${(L>0?te[e]/L*100:0).toFixed(1)}%"
                      ></div>
                    `)}
                </div>
                <div class="cost-breakdown-legend">
                  ${Z.map(({key:e,className:t,labelKey:n,hintKey:r})=>j`
                      <div class="legend-item" title=${C(r)}>
                        <span class="legend-dot ${t}"></span>${C(n)}
                        ${J(te[e])}
                      </div>
                    `)}
                </div>
                <div class="cost-breakdown-total">
                  ${C(`usage.breakdown.total`)}: ${J(L)}
                </div>
              </div>
            `:A}
    </div>
  `}var Fn,In,Ln,Rn,zn,Bn;function Vn(){return(Vn=e((()=>{le(),M(),K(),u(),p(),q(),X(),gt(),_n(),Fn=.75,In=8,Ln=.06,Rn=5,zn=12,Bn=.7})))()}function Hn(e,t){return t>0?e/t*100:0}function Un(e,t,n){if(!(e.timestamp>0))return!0;let r=e.timestamp,i=r<0xe8d4a51000?r*1e3:r;return i>=Math.min(t,n)&&i<=Math.max(t,n)}function Wn(e,t,n,r){let i=Math.min(n,r),a=Math.max(n,r),o=t.filter(e=>e.timestamp>=i&&e.timestamp<=a);if(o.length===0)return;let s=0,c=0,l={output:0,input:0,cacheWrite:0,cacheRead:0};for(let e of o){s+=e.totalTokens||0,c+=e.cost||0;for(let{key:t}of Z)l[t]+=e[t]||0}let u=se(o[0],`filtered usage first point`),d=se(o.at(-1),`filtered usage last point`);return{...e,...l,totalTokens:s,totalCost:c,durationMs:d.timestamp-u.timestamp,firstActivity:u.timestamp,lastActivity:d.timestamp,messageCounts:void 0}}function Gn(e,t,n,r,i,a){let o=e.label||e.key,s=o.length>50?B(o,50)+`…`:o,c=e.usage,{timeSeriesCursorStart:l,timeSeriesCursorEnd:u}=t,d=l!==null&&u!==null,f=d&&t.timeSeries?.points&&c?Wn(c,t.timeSeries.points,l,u):void 0,p=f?{totalTokens:f.totalTokens,totalCost:f.totalCost}:{totalTokens:c?.totalTokens??0,totalCost:c?.totalCost??0},m=f?C(`usage.details.filtered`):``;return j`
    <div class="settings-group usage-panel session-detail-panel">
      <div class="session-detail-header">
        <div class="session-detail-header-left">
          <div class="session-detail-title">
            ${s}
            ${m?j`<span class="session-detail-indicator">${m}</span>`:A}
          </div>
        </div>
        <div class="session-detail-stats">
          ${c?j`
                  <span
                    ><strong>${J(p.totalTokens)}</strong>
                    ${G(C(`usage.metrics.tokens`))}${m}</span
                  >
                  <span
                    ><strong>${jt(p.totalCost)}</strong
                    >${m}</span
                  >
                `:A}
        </div>
        <zero-tooltip .content=${C(`usage.details.close`)}>
          <button
            class="btn btn--sm btn--ghost session-detail-close"
            @click=${a}
            aria-label=${C(`usage.details.close`)}
          >
            ${te.x}
          </button>
        </zero-tooltip>
      </div>
      ${e.scope===`family`&&e.includedSessionIds?.length?j`
              <div class="usage-lineage-note">
                ${C(`usage.scope.familyIncluded`,{count:String(e.includedSessionIds.length)})}
              </div>
            `:A}
      <div class="session-detail-content">
        ${jn(e,f,d?t.sessionLogsStatus.hasLoaded&&t.sessionLogs?t.sessionLogs.filter(e=>Un(e,l,u)):null:void 0)}
        <div class="session-detail-row">${Pn(t,n,r)}</div>
        <div class="session-detail-bottom">
          ${Jn(t,n)}
          ${Kn(t.context,c,i,n.onToggleContextExpanded)}
        </div>
      </div>
    </div>
  `}function Kn({weight:e,loading:t,status:n},r,i,a){let o=ht(n,`usage.details.systemPromptBreakdown`,`context`);if(!e)return j`
      <div class="context-details-panel">
        ${o}
        ${n.error?A:j`<div class="usage-empty-block">
                ${C(t||n.awaitingGateway?`usage.loading.badge`:`usage.details.noContextData`)}
              </div>`}
      </div>
    `;let s=[{className:`skills`,labelKey:`usage.details.skills`,tokens:At(e.skills.promptChars),entries:e.skills.entries.map(({name:e,blockChars:t})=>({name:e,chars:t}))},{className:`tools`,labelKey:`usage.details.tools`,tokens:At(e.tools.listChars+e.tools.schemaChars),entries:e.tools.entries.map(({name:e,summaryChars:t,schemaChars:n})=>({name:e,chars:t+n}))},{className:`files`,labelKey:`usage.details.files`,tokens:At(e.injectedWorkspaceFiles.reduce((e,t)=>t.injectionStatus===`native_unverified`?e:e+t.injectedChars,0)),entries:e.injectedWorkspaceFiles.map(({name:e,injectedChars:t})=>({name:e,chars:t}))}].map(({className:e,labelKey:t,tokens:n,entries:r})=>({className:e,labelKey:t,tokens:n,entries:r.toSorted((e,t)=>e.chars===null?t.chars===null?0:1:t.chars===null?-1:t.chars-e.chars)})),c=[{className:`system`,labelKey:`usage.details.system`,tokens:At(e.systemPrompt.chars)},...s],l=c.reduce((e,{tokens:t})=>e+t,0),u=r&&r.totalTokens>0?r.input+r.cacheRead:0,d=u>0?`~${Math.min(l/u*100,100).toFixed(0)}% ${C(`usage.details.ofInput`)}`:C(`usage.details.baseContextPerMessage`),f=s.some(({entries:e})=>e.length>4);return j`
    <div class="context-details-panel">
      ${o}
      <div class="context-breakdown-header">
        <div class="card-title usage-section-title">
          ${C(`usage.details.systemPromptBreakdown`)}
        </div>
        ${f?j`<button class="btn btn--sm" @click=${a}>
                ${C(i?`usage.details.collapse`:`usage.details.expandAll`)}
              </button>`:A}
      </div>
      <p class="context-weight-desc">${d}</p>
      <div class="context-stacked-bar">
        ${c.map(({className:e,labelKey:t,tokens:n})=>j`
            <div
              class="context-segment ${e}"
              style="width: ${Hn(n,l).toFixed(1)}%"
              title="${C(t)}: ~${J(n)}"
            ></div>
          `)}
      </div>
      <div class="context-legend">
        ${c.map(({className:e,labelKey:t,tokens:n})=>j`
            <span class="legend-item"
              ><span class="legend-dot ${e}"></span>${C(e===`system`?`usage.details.systemShort`:t)}
              ~${J(n)}</span
            >
          `)}
      </div>
      <div class="context-total">
        ${C(`usage.breakdown.total`)}: ~${J(l)}
      </div>
      <div class="context-breakdown-grid">
        ${s.filter(({entries:e})=>e.length>0).map(({labelKey:e,entries:t})=>{let n=i?t:t.slice(0,4),r=t.length-n.length;return j`
              <div class="context-breakdown-card">
                <div class="context-breakdown-title">${C(e)} (${t.length})</div>
                <div class="context-breakdown-list">
                  ${n.map(({name:e,chars:t})=>j`
                      <div class="context-breakdown-item">
                        <span class="mono" title=${e}>${e}</span>
                        <span class="muted"
                          >${t===null?C(`usage.common.unknown`):`~${J(At(t))}`}</span
                        >
                      </div>
                    `)}
                </div>
                ${r>0?j`
                        <div class="context-breakdown-more">
                          ${C(`usage.sessions.more`,{count:String(r)})}
                        </div>
                      `:A}
              </div>
            `})}
      </div>
    </div>
  `}function qn(e){let t=e.target.selectedOptions;return Array.from(t,e=>e.value)}function Jn(e,n){let{sessionLogs:r,sessionLogsLoading:i,sessionLogsStatus:a,sessionLogsExpanded:o,logFilters:s,timeSeriesCursorStart:c,timeSeriesCursorEnd:l}=e,u=(i||a.awaitingGateway)&&!a.hasLoaded,d=a.error&&!a.hasLoaded,f=u?A:ht(a,`usage.details.conversation`,`conversation`);if(u||d||!r?.length){let e=u?`usage.loading.badge`:`usage.details.noMessages`;return j`
      <div class="session-logs-compact">
        <div class="session-logs-header">${C(`usage.details.conversation`)}</div>
        ${f}
        ${u||!d?j`<div class="usage-empty-block">${C(e)}</div>`:A}
      </div>
    `}let p=t(),m=G(s.query),h=r.map(e=>{let t=Ge(e.content);return{log:e,toolInfo:t,cleanContent:t.cleanContent||e.content}}),g=Array.from(new Set(h.flatMap(e=>e.toolInfo.tools.map(([e])=>e)))).toSorted((e,t)=>e.localeCompare(t)),_=c!=null&&l!=null,v=h.filter(e=>(!_||Un(e.log,c,l))&&(s.roles.length===0||s.roles.includes(e.log.role))&&(!s.hasTools||e.toolInfo.tools.length>0)&&(s.tools.length===0||e.toolInfo.tools.some(([e])=>s.tools.includes(e)))&&(!m||G(e.cleanContent).includes(m))),y=s.roles.length>0||s.tools.length>0||s.hasTools||m||_?`${v.length} ${C(`usage.details.of`)} ${r.length}${_?` (${C(`usage.details.timelineFiltered`)})`:``}`:`${r.length}`,b=new Set(s.roles),x=new Set(s.tools);return j`
    <div class="session-logs-compact">
      <div class="session-logs-header">
        <span>
          ${C(`usage.details.conversation`)}
          <span class="session-logs-header-count">
            (${y} ${G(C(`usage.overview.messages`))})
          </span>
        </span>
        <button class="btn btn--sm" @click=${n.onToggleSessionLogsExpanded}>
          ${C(o?`usage.details.collapseAll`:`usage.details.expandAll`)}
        </button>
      </div>
      ${f}
      <div class="usage-filters-inline session-log-filters">
        <select
          multiple
          size="4"
          aria-label=${C(`usage.details.filterByRole`)}
          @change=${e=>n.onLogFilterRolesChange(qn(e))}
        >
          ${[[`user`,`usage.overview.user`],[`assistant`,`usage.overview.assistant`],[`tool`,`usage.details.tool`],[`toolResult`,`usage.details.toolResult`]].map(([e,t])=>j`<option value=${e} ?selected=${b.has(e)}>
                ${C(t)}
              </option>`)}
        </select>
        <select
          multiple
          size="4"
          aria-label=${C(`usage.details.filterByTool`)}
          @change=${e=>n.onLogFilterToolsChange(qn(e))}
        >
          ${g.map(e=>j`<option value=${e} ?selected=${x.has(e)}>${e}</option>`)}
        </select>
        <label class="usage-filters-inline session-log-has-tools">
          <input
            type="checkbox"
            .checked=${s.hasTools}
            @change=${e=>n.onLogFilterHasToolsChange(e.target.checked)}
          />
          ${C(`usage.details.hasTools`)}
        </label>
        <input
          type="text"
          placeholder=${C(`usage.details.searchConversation`)}
          aria-label=${C(`usage.details.searchConversation`)}
          .value=${s.query}
          @input=${e=>n.onLogFilterQueryChange(e.target.value)}
        />
        <button class="btn btn--sm" @click=${n.onLogFilterClear}>
          ${C(`usage.filters.clear`)}
        </button>
      </div>
      <div class="session-logs-list">
        ${v.map(e=>{let{log:t,toolInfo:n,cleanContent:r}=e,i=t.role===`user`?`user`:`assistant`,a=t.role===`user`?C(`usage.details.you`):t.role===`assistant`?C(`usage.overview.assistant`):C(`usage.details.tool`);return j`
            <div class="session-log-entry ${i}">
              <div class="session-log-meta">
                <span class="session-log-role">${a}</span>
                <span>${p(t.timestamp)}</span>
                ${t.tokens?j`<span>${J(t.tokens)}</span>`:A}
              </div>
              <div class="session-log-content">${r}</div>
              ${n.tools.length>0?j`
                      <details class="session-log-tools" ?open=${o}>
                        <summary>${n.summary}</summary>
                        <div class="session-log-tools-list">
                          ${n.tools.map(([e,t])=>j`
                              <span class="session-log-tools-pill">${e} × ${t}</span>
                            `)}
                        </div>
                      </details>
                    `:A}
            </div>
          `})}
        ${v.length===0?j`
                <div class="usage-empty-block usage-empty-block--compact">
                  ${C(`usage.details.noMessagesMatch`)}
                </div>
              `:A}
      </div>
    </div>
  `}function Yn(){return(Yn=e((()=>{le(),M(),O(),u(),D(),p(),q(),X(),gt(),_n(),Mn(),Vn()})))()}function Xn(e){return new Date(`${e}T12:00:00Z`).getTime()}function Zn(e){let t=e.toSorted((e,t)=>e-t),n=e=>t[Math.min(t.length-1,Math.floor(t.length*e))]??0;return[n(.25),n(.5),n(.75)]}function Qn(e,t){return e<=0?0:e<t[0]?1:e<t[1]?2:e<t[2]?3:4}function $n(e,t,n,r){let i=Xn(n),a=Math.max(Xn(t),i-363*er),o=new Map(e.map(e=>[e.date,e.totalTokens])),s=Zn(e.filter(e=>{let t=Xn(e.date);return e.totalTokens>0&&t>=a&&t<=i}).map(e=>e.totalTokens)),c=a-new Date(a).getUTCDay()*er,l=new Intl.DateTimeFormat(r,{month:`short`,timeZone:`UTC`}),u=[],d=[],f=-1;for(let e=c;e<=i;e+=7*er){let t=[];for(let n=0;n<7;n+=1){let r=e+n*er;if(r<a||r>i){t.push(null);continue}let c=new Date(r).toISOString().slice(0,10),l=o.get(c)??0;t.push({date:c,tokens:l,level:Qn(l,s)})}u.push({days:t});let r=Xn(t.find(e=>e!==null)?.date??n),c=new Date(r).getUTCMonth();d.push(c===f?``:l.format(new Date(r))),f=c}return{weeks:u,monthLabels:d}}var er;function tr(){return(tr=e((()=>{er=864e5})))()}function nr(e){let t=or+e.weeks.length*ar,n=new Intl.NumberFormat(void 0,{maximumFractionDigits:0}),r=new Intl.DateTimeFormat(void 0,{weekday:`short`,timeZone:`UTC`});return j`
    <svg
      class="usage-heatmap__svg"
      viewBox="0 0 ${t} ${116}"
      style="--usage-heatmap-width: ${t}px"
      role="group"
      aria-label=${C(`usage.heatmap.title`)}
    >
      ${e.monthLabels.map((e,t)=>e?N`<text class="usage-heatmap__month" x=${or+t*ar} y="10">${e}</text>`:A)}
      ${cr.map(({row:e,utcDay:t})=>N`<text class="usage-heatmap__weekday" x=${24} y=${sr+e*ar+ir-2}>${r.format(new Date(t))}</text>`)}
      ${e.weeks.map((e,t)=>e.days.map((e,r)=>{if(!e)return A;let i=`${qt(e.date)} · ${C(`usage.heatmap.cellTokens`,{tokens:n.format(e.tokens)})}`;return N`
            <rect
              class="usage-heatmap__cell usage-heatmap__cell--l${e.level}"
              x=${or+t*ar}
              y=${sr+r*ar}
              width=${ir}
              height=${ir}
              rx="2.5"
              role="img"
              data-tooltip=${i}
              aria-label=${i}
            ></rect>
          `}))}
    </svg>
  `}function rr(e,t,n){if(e.length===0)return A;let r=$n(e,t,n),i=j`
    <div class="usage-heatmap__legend" aria-hidden="true">
      <span>${C(`usage.heatmap.less`)}</span>
      ${[0,1,2,3,4].map(e=>j`<span class="usage-heatmap__swatch usage-heatmap__cell--l${e}"></span>`)}
      <span>${C(`usage.heatmap.more`)}</span>
    </div>
  `;return ye({title:C(`usage.heatmap.title`),description:C(`usage.heatmap.subtitle`),actions:i},j`<div class="usage-panel usage-heatmap">${nr(r)}</div>`)}var ir,ar,or,sr,cr;function lr(){return(lr=e((()=>{M(),K(),u(),tr(),X(),ir=11,ar=14,or=30,sr=18,cr=[{row:1,utcDay:Date.UTC(2024,0,1)},{row:3,utcDay:Date.UTC(2024,0,3)},{row:5,utcDay:Date.UTC(2024,0,5)}]})))()}function ur(e,t,n,r,i){if(n.length===0)return A;let a=G(e),o=Ke(r).filter(e=>G(e.key??``)===a).map(e=>e.value).filter(Boolean),s=new Set(o.map(e=>G(e))),c=n.every(e=>s.has(G(e))),l=o.length;return j`
    <wa-dropdown
      class="usage-filter-select"
      placement="bottom-start"
      @wa-select=${t=>{t.preventDefault();let a=t.detail.item.value;if(a===`command:select-all`){i(dn(r,e,n));return}if(a===`command:clear`){i(dn(r,e,[]));return}if(a?.startsWith(`option:`)){let n=decodeURIComponent(a.slice(7));i(dn(r,e,t.detail.item.checked?[...o,n]:o.filter(e=>G(e)!==G(n))))}}}
    >
      <button slot="trigger" type="button" class="usage-filter-trigger">
        <span>${t}</span>
        <span class="settings-count"
          >${l>0?l:C(`usage.filters.all`)}</span
        >
      </button>
      <wa-dropdown-item value="command:select-all" ?disabled=${c}>
        ${C(`usage.filters.selectAll`)}
      </wa-dropdown-item>
      <wa-dropdown-item value="command:clear" ?disabled=${l===0}>
        ${C(`usage.filters.clear`)}
      </wa-dropdown-item>
      <div class="session-menu__separator" role="separator"></div>
      ${n.map(e=>{let t=s.has(G(e));return j`
          <wa-dropdown-item
            class="usage-filter-option"
            type="checkbox"
            value=${`option:${encodeURIComponent(e)}`}
            .checked=${t}
          >
            ${e}
          </wa-dropdown-item>
        `})}
    </wa-dropdown>
  `}function dr(){return(dr=e((()=>{M(),u(),q(),fn()})))()}function fr(e,t,n){return j`
    <input
      class="usage-date-input"
      type="date"
      .value=${e}
      title=${t}
      aria-label=${t}
      @change=${n}
    />
  `}function pr(e,t,n){let r=n||t?j`<div class="callout warning usage-callout">
          ${C(n?`usage.providerUsage.stalled`:`usage.providerUsage.unavailable`)}
        </div>`:A;return e.length===0?r:ye({title:C(`usage.providerUsage.title`),count:e.length,description:C(`usage.providerUsage.subtitle`)},j`
      ${r}
      <div class="usage-panel provider-usage-section">
        <div class="provider-usage-grid">
          ${e.map(e=>j`
              <article class="provider-usage-card">
                <div class="provider-usage-card__header">
                  <div>
                    <div class="provider-usage-card__name">${e.displayName}</div>
                    <div class="provider-usage-card__id">${e.provider}</div>
                  </div>
                  ${e.plan?j`<span class="provider-usage-plan">${e.plan}</span>`:A}
                </div>
                ${He(e)}
              </article>
            `)}
        </div>
      </div>
    `)}function mr(e){let{data:t,filters:n,display:r,detail:i,callbacks:a}=e,o=a.filters,s=a.display,c=a.details,{hasOverviewData:l,loadingOverview:u}=$e(t),d=r.chartMode===`tokens`,f=n.query.trim().length>0,p=n.queryDraft.trim().length>0,m=new Set(n.selectedDays),h=new Set(n.selectedSessions),g=t.sessions.toSorted((e,t)=>{let n=d?e.usage?.totalTokens??0:e.usage?.totalCost??0;return(d?t.usage?.totalTokens??0:t.usage?.totalCost??0)-n}),_=n.selectedHours.length>0?g.filter(e=>Ht(e,n.selectedHours,n.timeZone)):g,v=We(_,n.query),y=e=>m.size===0?!0:e.usage?.activityDates?.length?e.usage.activityDates.some(e=>m.has(e)):!!(e.updatedAt&&m.has(Ye(new Date(e.updatedAt),n.timeZone))),b=v.sessions.filter(y),x=v.warnings,S=an(g,t.aggregates),w=cn(n.queryDraft,S),T=Ke(n.queryDraft),E=n.selectedSessions.length===1?t.sessions.find(e=>e.key===n.selectedSessions[0]):null,D=h.size?v.sessions.filter(e=>h.has(e.key)):v.sessions,O=D.filter(y),ee=h.size>0||f||n.selectedHours.length>0,k=ee||m.size>0,M=e=>{let t=_t();for(let n of e)n&&vt(t,n);return t},N=t.costDaily;if(ee){let e=new Map;for(let t of D)for(let n of t.usage?.dailyBreakdown??[]){let t=e.get(n.date)??_t();vt(t,n),e.set(n.date,t)}N=Array.from(e,([e,t])=>({date:e,...t})).toSorted((e,t)=>e.date.localeCompare(t.date))}let P=l?m.size?M(N.filter(e=>m.has(e.date))):ee?M(O.map(e=>e.usage)):t.totals:null,ne=t.aggregates?.sessionCount??g.length,F=k?Qt(O):Qt([],t.aggregates),I=ee?void 0:t.aggregates?.byCreator;m.size>0&&(F.byCreator=(I??F.byCreator??[]).flatMap(e=>{let t=e.daily.filter(e=>m.has(e.date)),n=e.sessionActivity.flatMap(e=>{let t=e.dates.filter(e=>m.has(e));return t.length?[{dates:t,sessionCount:e.sessionCount}]:[]}),r=n.reduce((e,t)=>e+t.sessionCount,0),i=M(t);return r||i.totalTokens||i.totalCost?[{...e,totals:i,sessionCount:r,daily:t,sessionActivity:n}]:[]}));let L=m.size>0&&I?(F.byCreator??[]).reduce((e,t)=>e+t.sessionCount,0):k?O.length:t.aggregates?.sessionCount??O.length;m.size>0&&I&&(F.sessionCount=L);let R=t.sessionsLimitReached&&!k,re=R?M(O.map(e=>e.usage)):P,z=R?Qt(O):F,ie=k?A:Tn(t.costDaily,n.startDate,n.endDate,n.timeZone),oe=$t(O,re,z),B=t.cacheRefresh===`complete`&&t.totals!==null&&!t.loading&&!t.error&&t.sessions.length===0&&(t.totals?.totalTokens??0)===0,V=(P?.missingCostEntries??0)>0,se=[{label:C(`usage.presets.today`),days:1},{label:C(`usage.presets.last7d`),days:7},{label:C(`usage.presets.last30d`),days:30},{label:C(`usage.presets.last90d`),days:90},{label:C(`usage.presets.last1y`),days:365}],H=e=>{let t=new Date,r=new Date(t);return n.timeZone===`utc`?r.setUTCDate(r.getUTCDate()-(e-1)):r.setDate(r.getDate()-(e-1)),{start:Ye(r,n.timeZone),end:Ye(t,n.timeZone)}},U=e=>{let t=H(e);return n.startDate===t.start&&n.endDate===t.end},ce=e=>{let t=H(e);o.onStartDateChange(t.start),o.onEndDateChange(t.end)},W=()=>{o.onStartDateChange(`1970-01-01`),o.onEndDateChange(Ye(new Date,n.timeZone))},le=Ye(new Date);return pe(j`
      <div class="usage-page">
        <section class="settings-section">
          <div class="settings-section__header">
            <h2 class="settings-section__heading">${C(`usage.filters.rangeTitle`)}</h2>
            <div class="settings-section__actions">
              ${u?pt(C(`usage.loading.badge`)):A}
              ${B?j`<span class="usage-query-hint">${C(`usage.empty.hint`)}</span>`:A}
            </div>
          </div>
          <div
            class="settings-group usage-panel usage-header ${r.headerPinned?`pinned`:``}"
          >
            <div class="usage-header-row">
              <div class="usage-controls">
                ${wn(t.sessions,e)}
                <div class="usage-presets">
                  ${se.map(e=>j`
                      <button
                        class="btn btn--sm ${U(e.days)?`active`:``}"
                        aria-pressed=${U(e.days)}
                        @click=${()=>ce(e.days)}
                      >
                        ${e.label}
                      </button>
                    `)}
                  <button
                    class="btn btn--sm ${n.startDate===`1970-01-01`?`active`:``}"
                    aria-pressed=${n.startDate===`1970-01-01`}
                    @click=${W}
                  >
                    ${C(`usage.presets.all`)}
                  </button>
                </div>
                <div class="usage-date-range">
                  ${fr(n.startDate,C(`usage.filters.startDate`),e=>o.onStartDateChange(e.target.value))}
                  <span class="usage-separator">${C(`usage.filters.to`)}</span>
                  ${fr(n.endDate,C(`usage.filters.endDate`),e=>o.onEndDateChange(e.target.value))}
                </div>
                <select
                  class="usage-select"
                  title=${C(`usage.filters.timeZone`)}
                  aria-label=${C(`usage.filters.timeZone`)}
                  .value=${n.timeZone}
                  @change=${e=>o.onTimeZoneChange(e.target.value)}
                >
                  <option value="local">${C(`usage.filters.timeZoneLocal`)}</option>
                  <option value="utc">${C(`usage.filters.timeZoneUtc`)}</option>
                </select>
              </div>
              <div class="usage-view-options">
                ${yn({options:t.creatorOptions,selectedKey:n.creatorKey,onSelect:o.onCreatorChange})}
                ${ve({mode:`buttons`,variant:`accent`,value:n.scope,onChange:o.onScopeChange,onReselect:o.onScopeChange,options:[{value:`instance`,label:C(`usage.scope.instance`),title:C(`usage.scope.instanceHint`)},{value:`family`,label:C(`usage.scope.family`),title:C(`usage.scope.familyHint`)}]})}
                ${ve({mode:`buttons`,variant:`accent`,value:d?`tokens`:`cost`,onChange:s.onChartModeChange,onReselect:s.onChartModeChange,options:[{value:`tokens`,label:C(`usage.metrics.tokens`)},{value:`cost`,label:C(`usage.metrics.cost`)}]})}
                <button
                  class="btn btn--sm primary"
                  @click=${o.onRefresh}
                  ?disabled=${t.loading}
                >
                  ${C(`common.refresh`)}
                </button>
              </div>
            </div>

            <div class="usage-header-row">
              <div class="usage-header-metrics">
                ${P?[[J(P.totalTokens),C(`usage.metrics.tokens`)],[jt(P.totalCost),C(`usage.metrics.cost`)],[L,C(L===1?`usage.metrics.session`:`usage.metrics.sessions`)]].map(([e,t])=>j`
                          <span class="usage-metric-badge"><strong>${e}</strong> ${t}</span>
                        `):A}
                <button
                  class="btn btn--sm usage-pin-btn ${r.headerPinned?`active`:``}"
                  @click=${o.onToggleHeaderPinned}
                >
                  ${r.headerPinned?C(`usage.filters.pinned`):C(`usage.filters.pin`)}
                </button>
                <wa-dropdown
                  class="usage-export-menu"
                  placement="bottom-end"
                  @wa-select=${e=>{let t=e.detail.item.value;switch(t){case`sessions-csv`:case`daily-csv`:ae(`zero-usage-${t===`sessions-csv`?`sessions`:`daily`}-${le}.csv`,t===`sessions-csv`?on(O):sn(N),`text/csv;charset=utf-8`);break;case`json`:s.onExportJson({totals:P,sessions:O,daily:N,aggregates:F});break;case void 0:}}}
                >
                  <button
                    slot="trigger"
                    type="button"
                    class="btn btn--sm"
                    aria-busy=${t.exporting}
                  >
                    ${t.exporting?C(`common.loading`):C(`usage.export.label`)} ▾
                  </button>
                  <wa-dropdown-item
                    value="sessions-csv"
                    ?disabled=${O.length===0}
                  >
                    ${C(`usage.export.sessionsCsv`)}
                  </wa-dropdown-item>
                  <wa-dropdown-item value="daily-csv" ?disabled=${N.length===0}>
                    ${C(`usage.export.dailyCsv`)}
                  </wa-dropdown-item>
                  <wa-dropdown-item
                    value="json"
                    ?disabled=${t.exporting||t.loading||O.length===0&&N.length===0}
                  >
                    ${C(`usage.export.json`)}
                  </wa-dropdown-item>
                </wa-dropdown>
              </div>
            </div>

            <div class="usage-query-section">
              <div class="usage-query-bar">
                <input
                  class="usage-query-input"
                  type="text"
                  .value=${n.queryDraft}
                  aria-label=${C(`usage.query.placeholder`)}
                  placeholder=${C(`usage.query.placeholder`)}
                  @input=${e=>o.onQueryDraftChange(e.target.value)}
                  @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),o.onApplyQuery())}}
                />
                <div class="usage-query-actions">
                  <button
                    class="btn btn--sm"
                    @click=${o.onApplyQuery}
                    ?disabled=${t.loading||!p&&!f}
                  >
                    ${C(`usage.query.apply`)}
                  </button>
                  ${p||f?j`
                          <button class="btn btn--sm" @click=${o.onClearQuery}>
                            ${C(`usage.filters.clear`)}
                          </button>
                        `:A}
                  <span class="usage-query-hint">
                    ${l?f?C(`usage.query.matching`,{shown:String(b.length),total:String(ne)}):C(`usage.query.inRange`,{total:String(ne)}):A}
                  </span>
                </div>
              </div>
              <div class="usage-filter-row">
                ${ur(`channel`,C(`usage.filters.channel`),S.channel,n.queryDraft,o.onQueryDraftChange)}
                ${ur(`provider`,C(`usage.filters.provider`),S.provider,n.queryDraft,o.onQueryDraftChange)}
                ${ur(`model`,C(`usage.filters.model`),S.model,n.queryDraft,o.onQueryDraftChange)}
                ${ur(`tool`,C(`usage.filters.tool`),S.tool,n.queryDraft,o.onQueryDraftChange)}
                <span class="usage-query-hint">${C(`usage.query.tip`)}</span>
              </div>
              ${T.length>0?j`
                      <div class="usage-query-chips">
                        ${T.map(e=>{let t=e.raw;return j`
                            <span class="usage-query-chip">
                              ${t}
                              <zero-tooltip .content=${C(`usage.filters.remove`)}>
                                <button
                                  aria-label=${C(`usage.filters.remove`)}
                                  @click=${()=>o.onQueryDraftChange(un(n.queryDraft,t))}
                                >
                                  ${te.x}
                                </button>
                              </zero-tooltip>
                            </span>
                          `})}
                      </div>
                    `:A}
              ${w.length>0?j`
                      <div class="usage-query-suggestions">
                        ${w.map(e=>j`
                            <button
                              class="usage-query-suggestion"
                              @click=${()=>o.onQueryDraftChange(ln(n.queryDraft,e.value))}
                            >
                              ${e.label}
                            </button>
                          `)}
                      </div>
                    `:A}
              ${x.length>0?j`
                      <div class="callout warning usage-callout usage-callout--tight">
                        ${x.join(` · `)}
                      </div>
                    `:A}
            </div>

            ${t.error?j`<div class="callout danger usage-callout">${t.error}</div>`:A}
            ${t.cacheRefresh===`complete`?A:j`
                    <div
                      class="callout ${t.cacheRefresh===`failed`?`warning`:``} usage-callout usage-cache-warning"
                      role="status"
                      aria-live="polite"
                    >
                      ${C(t.cacheRefresh===`failed`?`usage.cacheStatus.paused`:`usage.cacheStatus.warning`)}
                    </div>
                  `}
            ${t.sessionsLimitReached?j`
                    <div class="callout warning usage-callout">
                      ${C(`usage.sessions.limitReached`)}
                    </div>
                  `:A}
          </div>
        </section>

        ${l?B?mt(o.onRefresh):j`
                  <div class="settings-group usage-panel usage-left-card usage-trend-section">
                    ${hn(N,n.selectedDays,r.chartMode,r.dailyChartMode,s.onDailyChartModeChange,o.onSelectDay,{startDate:n.startDate,endDate:n.endDate,complete:t.cacheRefresh===`complete`})}
                    ${P?gn(P,r.chartMode):A}
                  </div>
                  ${bn({groups:F.byCreator??[],selectedKey:n.creatorKey,mode:r.chartMode,onSelect:o.onCreatorChange})}
                  ${On(re,z,oe,V,n.selectedDays.length===0,Pt(O,n.timeZone),L,ne)}
                  ${ie}
                  ${rr(N,n.startDate,n.endDate)}
                  ${Wt(O,n.timeZone,n.selectedHours,o.onSelectHour)}

                  <div class="usage-grid">
                    <div class="usage-grid-column">
                      ${kn(b,e,ne)}
                    </div>
                    ${E?j`<div class="usage-grid-column">
                            ${Gn(E,i,c,n,r.contextExpanded,o.onClearSessions)}
                          </div>`:A}
                  </div>
                `:u?j`<div class="usage-panel usage-loading-card">
                  <div class="usage-loading-grid">
                    <div class="skeleton usage-skeleton-block usage-skeleton-block--tall"></div>
                    <div class="skeleton usage-skeleton-block"></div>
                    <div class="skeleton usage-skeleton-block"></div>
                  </div>
                </div>`:A}
        ${pr(t.providerUsage,t.providerUsageUnavailable,t.providerUsageStalled)}
      </div>
    `,{wide:!0})}function hr(){return(hr=e((()=>{M(),O(),Ue(),K(),D(),ge(),u(),q(),X(),gt(),fn(),_n(),xn(),Yn(),lr(),An(),dr()})))()}var $,gr;function _r(){return(_r=e((()=>{ce(),M(),P(),T(),a(),x(),h(),Pe(),l(),c(),at(),dt(),q(),gt(),Ve(),Ze(),hr(),$=class extends y{constructor(...e){super(...e),this.usageSnapshot=null,this.providerUsageSummary=null,this.providerUsageUnavailable=!1,this.providerUsageIncomplete=!1,this.usageError=null,this.initialDateRange=Xe(),this.usageStartDate=this.initialDateRange.startDate,this.usageEndDate=this.initialDateRange.endDate,this.usageScope=`family`,this.usageAgentId=null,this.usageCreatorKey=null,this.usageSelectedSessions=[],this.usageSelectedDays=[],this.usageSelectedHours=[],this.usageChartMode=`tokens`,this.usageDailyChartMode=`by-type`,this.usageTimeSeriesMode=`per-turn`,this.usageTimeSeriesBreakdownMode=`by-type`,this.usageTimeSeriesCursorStart=null,this.usageTimeSeriesCursorEnd=null,this.usageSessionLogsExpanded=!1,this.usageQuery=``,this.usageQueryDraft=``,this.usageSessionSort=`recent`,this.usageSessionSortDir=`desc`,this.usageRecentSessions=[],this.usageTimeZone=`local`,this.usageContextExpanded=!1,this.usageHeaderPinned=!1,this.usageSessionsTab=`all`,this.usageLogFilterRoles=[],this.usageLogFilterTools=[],this.usageLogFilterHasTools=!1,this.usageLogFilterQuery=``,this.dateDebounceTimer=null,this.queryDebounceTimer=null,this.connectionEpoch={},this.usageUpdatedAt=0,this.acknowledgedUsageFailures=new WeakSet,this.routeDataInitialized=!1,this.routeDataEnabled=!0,this.refreshPolicy=new Be({isLoading:()=>this.usageLoading,reload:e=>{e===`manual`&&(this.usageUpdatedAt=this.usagePublication.updatedAt),this.clearDebounce(`dateDebounceTimer`);let t=e===`manual`&&this.usageSelectedSessions.length===1?this.usageSelectedSessions[0]:void 0;return this.loadUsage(t)},onIncompleteUsageExhausted:()=>this.requestUpdate()}),this.gateway=new Ne(this,{getGateway:()=>this.context?.gateway,onIdentityChange:()=>this.resetForClientChange(),invalidateRequests:e=>{e.snapshot.phase!==`connected`&&(this.refreshPolicy.interrupt(),this.usageRequest.cancel(),this.details.cancel(),this.usageExportRequest.cancel())},onSnapshot:e=>this.handleGatewaySnapshot(e),onPageActivation:()=>this.refreshPolicy.request(`focus`)}),this.observeAgentScope=ie(e=>{this.routeDataInitialized&&this.usageAgentId!==e&&(this.usageAgentId=e,this.usageCreatorKey=null,this.clearSelectionsAndDetails(),this.refreshPolicy.request(`manual`)),this.requestUpdate()}),this.usageRequest=tt(this,{task:async([e,t],{signal:n})=>{this.refreshPolicy.beginLoad();let r=this.connectionEpoch,i=this.currentQuery;return{epoch:r,query:i,refreshSessionKey:t,snapshot:await Je(e,i,n)}},onComplete:e=>{let t=e.snapshot,n=this.isCurrentQuery(e.query);if(n&&t.ok){this.usageSnapshot={query:e.query,result:t.value.result,costSummary:t.value.costSummary},this.usageError=null;let n=this.usageSelectedSessions.length===1?this.usageSelectedSessions[0]:void 0;n&&this.details.load(n,e.refreshSessionKey===n)}else n&&!t.ok&&this.applyUsageError(t.error.cause);this.applyUsageLoadState(t.ok?t.value.providerUsage:t.error.providerUsage,e.epoch,n&&t.ok?void 0:null),this.refreshPolicy.flushPending()},onError:e=>{this.applyUsageError(e),this.applyUsageLoadState({state:`pending`},this.connectionEpoch,null),this.refreshPolicy.flushPending()}}),this.usageExportRequest=ut(this,this.gateway,()=>this.currentQuery),this.details=new it(this,this.gateway,()=>this.currentQuery,()=>this.usageResult?.sessions??[],()=>{this.usageTimeSeriesCursorStart=null,this.usageTimeSeriesCursorEnd=null}),this.subscriptions=new i(this).effect(()=>this.context?.agentSelection,e=>this.observeAgentScope(e)).watchStore(()=>this.context?.agents)}willUpdate(e){e.has(`routeData`)&&(this.applyRouteData(),this.ensureInitialData())}disconnectedCallback(){this.subscriptions.clear(),this.clearDebounce(`dateDebounceTimer`),this.clearDebounce(`queryDebounceTimer`),this.refreshPolicy.dispose(),this.usageRequest.cancel(),this.details.cancel(),this.usageExportRequest.cancel(),super.disconnectedCallback()}applyRouteData(){let e=this.routeData;if(!e||(this.routeDataInitialized=!0,!this.routeDataEnabled))return;if(!this.gateway.isRouteDataCurrent(e)){this.routeDataEnabled=!1;return}let t=this.context.agentSelection.state.scopeId;if(e.query.agentId!==t){this.usageAgentId=t,this.clearSelectionsAndDetails(),this.resetProviderUsage(),this.refreshPolicy.request(`manual`);return}this.usageStartDate=e.query.startDate,this.usageEndDate=e.query.endDate,this.usageScope=e.query.scope,this.usageTimeZone=e.query.timeZone,this.usageAgentId=e.query.agentId,this.usageCreatorKey=e.query.creatorKey??null,this.usageSnapshot={query:this.currentQuery,result:e.result,costSummary:e.costSummary},this.applyUsageLoadState(e.providerUsage,this.connectionEpoch,e.loadedAtMs),this.usageError=e.error;let n=et(e.gatewaySnapshot.usagePublications,this.currentQuery.agentId).updatedAt;this.usagePublication.committedAt>n&&this.refreshPolicy.request(`publication`),this.refreshPolicy.flushPending()}ensureInitialData(){!this.routeDataEnabled&&this.routeDataInitialized&&this.gateway.client&&this.gateway.connected&&!this.usageLoading&&this.loadUsage()}resetForClientChange(){this.clearDebounce(`dateDebounceTimer`),this.usageRequest.cancel(),this.routeDataInitialized&&(this.routeDataEnabled=!1),this.usageSnapshot=null,this.resetProviderUsage(),this.usageError=null,this.usageAgentId=this.context.agentSelection.state.scopeId,this.usageCreatorKey=null,this.clearSelectionsAndDetails()}resetProviderUsage(){this.providerUsageSummary=null,this.providerUsageUnavailable=!1,this.providerUsageIncomplete=!1,this.refreshPolicy.resetPayload()}applyUsageLoadState(e,t,n=Date.now()){if(e.state===`settled`){let t=e.result;this.providerUsageUnavailable=!t.ok,this.providerUsageIncomplete=!t.ok||t.value.refreshing===!0,t.ok&&!this.providerUsageIncomplete&&(this.providerUsageSummary=t.value)}this.refreshPolicy.setLastLoadedAtMs(e.state===`pending`||this.usageCacheIncomplete?null:n,{incomplete:this.providerUsageIncomplete,connection:t})}get usagePublication(){return et(this.gateway.snapshot?.usagePublications,this.currentQuery.agentId)}get usageRefreshFailed(){return this.usagePublication.failures.some(e=>!this.acknowledgedUsageFailures.has(e))}get usageCacheIncomplete(){return Qe(this.usageResult?.cacheStatus,this.usageCostSummary?.cacheStatus)}get currentQuery(){return{startDate:this.usageStartDate,endDate:this.usageEndDate,scope:this.usageScope,timeZone:this.usageTimeZone,agentId:G(this.usageAgentId??``)||void 0,creatorKey:this.usageCreatorKey??void 0}}isCurrentQuery(e){let t=this.currentQuery;return e.startDate===t.startDate&&e.endDate===t.endDate&&e.scope===t.scope&&e.timeZone===t.timeZone&&e.agentId===t.agentId&&e.creatorKey===t.creatorKey}get usageResult(){return this.usageSnapshot&&this.isCurrentQuery(this.usageSnapshot.query)?this.usageSnapshot.result:null}get usageCostSummary(){return this.usageSnapshot&&this.isCurrentQuery(this.usageSnapshot.query)?this.usageSnapshot.costSummary:null}get usageCreatorOptions(){return this.usageSnapshot?.query.agentId===this.currentQuery.agentId?this.usageSnapshot?.result?.creatorOptions??[]:[]}get providerUsageStalled(){return this.providerUsageIncomplete&&this.refreshPolicy.incompleteUsageExhausted}applyUsageError(e){let t=g(e);this.usageError=t?o(`usage`):S(e,`request failed`),t&&(this.usageSnapshot=null)}get usageLoading(){return!this.routeDataInitialized||this.dateDebounceTimer!==null||this.usageRequest.pending}loadUsage(e){let t=this.gateway.client;return!t||!this.gateway.connected?(this.refreshPolicy.markLoadDeferred(),Promise.resolve()):(this.routeDataEnabled=!1,this.usageError=null,this.usageRequest.run([t,e]))}clearSelectionsAndDetails(){this.usageExportRequest.cancel(),this.usageSelectedDays=[],this.usageSelectedHours=[],this.usageSelectedSessions=[],this.details.clear()}clearDebounce(e){this[e]!==null&&(window.clearTimeout(this[e]),this[e]=null)}scheduleUsageLoad(){this.clearSelectionsAndDetails(),this.clearDebounce(`dateDebounceTimer`),this.usageRequest.cancel(),this.usageError=null,this.refreshPolicy.resetPayload(),this.routeDataEnabled=!1,this.dateDebounceTimer=window.setTimeout(()=>{this.dateDebounceTimer=null,this.refreshPolicy.request(`manual`)},400)}handleGatewaySnapshot(e){if(!this.gateway.connected||!this.gateway.client)return;this.context.agents.ensureList();let t=this.usagePublication,n=t.committedAt>this.usageUpdatedAt;this.usageUpdatedAt=t.updatedAt,e.identityChanged||e.becameConnected?(this.connectionEpoch={},this.routeDataInitialized&&this.refreshPolicy.request(`reconnect`)):n&&this.routeDataInitialized&&this.refreshPolicy.request(`publication`);let r=this.usageSelectedSessions.length===1?this.usageSelectedSessions[0]:void 0;if(e.becameAvailable&&r)for(let e of[this.details.timeSeries,this.details.sessionLogs,this.details.contextWeight])e.recover(r,e===this.details.contextWeight)}selectSession(e,t,n){if(this.details.clear(),this.usageRecentSessions=[e,...this.usageRecentSessions.filter(t=>t!==e)].slice(0,8),this.usageSelectedSessions=qe(this.usageSelectedSessions,e,n,t,`replace`),this.usageSelectedSessions.length===1){let e=this.usageSelectedSessions[0];e&&this.details.load(e)}}render(){let e=this.details.timeSeries.data,t={data:{loading:this.usageLoading,exporting:this.usageExportRequest.pending,error:this.usageError,sessions:this.usageResult?.sessions??[],creatorOptions:this.usageCreatorOptions,sessionsLimitReached:(this.usageResult?.sessions.length??0)>=1e3,totals:this.usageResult?.totals??null,aggregates:this.usageResult?.aggregates??null,costDaily:this.usageCostSummary?.daily??[],cacheRefresh:this.usageCacheIncomplete?this.usageRefreshFailed?`failed`:`retrying`:`complete`,providerUsage:this.providerUsageSummary?.providers??[],providerUsageStalled:this.providerUsageStalled,providerUsageUnavailable:this.providerUsageUnavailable},filters:{startDate:this.usageStartDate,endDate:this.usageEndDate,scope:this.usageScope,selectedSessions:this.usageSelectedSessions,selectedDays:this.usageSelectedDays,selectedHours:this.usageSelectedHours,creatorKey:this.usageCreatorKey,query:this.usageQuery,queryDraft:this.usageQueryDraft,timeZone:this.usageTimeZone},display:{chartMode:this.usageChartMode,dailyChartMode:this.usageDailyChartMode,sessionSort:this.usageSessionSort,sessionSortDir:this.usageSessionSortDir,recentSessions:this.usageRecentSessions,sessionsTab:this.usageSessionsTab,contextExpanded:this.usageContextExpanded,headerPinned:this.usageHeaderPinned},detail:{context:{weight:this.details.contextWeight.data,loading:this.details.contextWeight.loading,status:this.details.contextWeight.status},timeSeriesMode:this.usageTimeSeriesMode,timeSeriesBreakdownMode:this.usageTimeSeriesBreakdownMode,timeSeries:e,timeSeriesLoading:this.details.timeSeries.loading,timeSeriesStatus:this.details.timeSeries.status,timeSeriesCursorStart:this.usageTimeSeriesCursorStart,timeSeriesCursorEnd:this.usageTimeSeriesCursorEnd,sessionLogs:this.details.sessionLogs.data,sessionLogsLoading:this.details.sessionLogs.loading,sessionLogsStatus:this.details.sessionLogs.status,sessionLogsExpanded:this.usageSessionLogsExpanded,logFilters:{roles:this.usageLogFilterRoles,tools:this.usageLogFilterTools,hasTools:this.usageLogFilterHasTools,query:this.usageLogFilterQuery}},callbacks:{filters:{onStartDateChange:e=>{this.usageStartDate=e,this.scheduleUsageLoad()},onEndDateChange:e=>{this.usageEndDate=e,this.scheduleUsageLoad()},onScopeChange:e=>{this.usageScope=e,this.clearSelectionsAndDetails(),this.refreshPolicy.request(`manual`)},onCreatorChange:e=>{this.usageCreatorKey=e,this.clearSelectionsAndDetails(),this.refreshPolicy.request(`manual`)},onRefresh:()=>{for(let e of this.usagePublication.failures)this.acknowledgedUsageFailures.add(e);this.refreshPolicy.request(`manual`)},onTimeZoneChange:e=>{this.usageTimeZone=e,this.clearSelectionsAndDetails(),this.refreshPolicy.request(`manual`)},onToggleHeaderPinned:()=>this.usageHeaderPinned=!this.usageHeaderPinned,onSelectHour:(e,t)=>{this.usageSelectedHours=qe(this.usageSelectedHours,e,Array.from({length:24},(e,t)=>t),t,`append`)},onQueryDraftChange:e=>{this.usageQueryDraft=e,this.clearDebounce(`queryDebounceTimer`),this.queryDebounceTimer=window.setTimeout(()=>{this.usageQuery=this.usageQueryDraft,this.queryDebounceTimer=null},250)},onApplyQuery:()=>{this.clearDebounce(`queryDebounceTimer`),this.usageQuery=this.usageQueryDraft},onClearQuery:()=>{this.clearDebounce(`queryDebounceTimer`),this.usageQueryDraft=``,this.usageQuery=``},onSelectDay:(e,t,n)=>{this.usageSelectedDays=qe(this.usageSelectedDays,e,n,t,`toggle`)},onClearDays:()=>this.usageSelectedDays=[],onClearHours:()=>this.usageSelectedHours=[],onClearSessions:()=>{this.usageSelectedSessions=[],this.details.clear()},onClearFilters:()=>this.clearSelectionsAndDetails()},display:{onExportJson:e=>{this.usageExportRequest.run(e)},onChartModeChange:e=>this.usageChartMode=e,onDailyChartModeChange:e=>this.usageDailyChartMode=e,onSessionSortChange:e=>this.usageSessionSort=e,onSessionSortDirChange:e=>this.usageSessionSortDir=e,onSessionsTabChange:e=>this.usageSessionsTab=e},details:{onToggleContextExpanded:()=>this.usageContextExpanded=!this.usageContextExpanded,onToggleSessionLogsExpanded:()=>this.usageSessionLogsExpanded=!this.usageSessionLogsExpanded,onLogFilterRolesChange:e=>{this.usageLogFilterRoles=e},onLogFilterToolsChange:e=>{this.usageLogFilterTools=e},onLogFilterHasToolsChange:e=>{this.usageLogFilterHasTools=e},onLogFilterQueryChange:e=>{this.usageLogFilterQuery=e},onLogFilterClear:()=>{this.usageLogFilterRoles=[],this.usageLogFilterTools=[],this.usageLogFilterHasTools=!1,this.usageLogFilterQuery=``},onSelectSession:(e,t,n)=>this.selectSession(e,t,n),onTimeSeriesModeChange:e=>{this.usageTimeSeriesMode=e},onTimeSeriesBreakdownChange:e=>{this.usageTimeSeriesBreakdownMode=e},onTimeSeriesCursorRangeChange:(t,n)=>{this.details.timeSeries.data===e&&(this.usageTimeSeriesCursorStart=t,this.usageTimeSeriesCursorEnd=n)}}}};return ft(this.context,this.usageResult,mr(t))}},W([U({context:ee,subscribe:!0})],$.prototype,`context`,void 0),W([F({attribute:!1})],$.prototype,`routeData`,void 0),W([R()],$.prototype,`usageSnapshot`,void 0),W([R()],$.prototype,`providerUsageSummary`,void 0),W([R()],$.prototype,`providerUsageUnavailable`,void 0),W([R()],$.prototype,`providerUsageIncomplete`,void 0),W([R()],$.prototype,`usageError`,void 0),W([R()],$.prototype,`usageStartDate`,void 0),W([R()],$.prototype,`usageEndDate`,void 0),W([R()],$.prototype,`usageScope`,void 0),W([R()],$.prototype,`usageAgentId`,void 0),W([R()],$.prototype,`usageCreatorKey`,void 0),W([R()],$.prototype,`usageSelectedSessions`,void 0),W([R()],$.prototype,`usageSelectedDays`,void 0),W([R()],$.prototype,`usageSelectedHours`,void 0),W([R()],$.prototype,`usageChartMode`,void 0),W([R()],$.prototype,`usageDailyChartMode`,void 0),W([R()],$.prototype,`usageTimeSeriesMode`,void 0),W([R()],$.prototype,`usageTimeSeriesBreakdownMode`,void 0),W([R()],$.prototype,`usageTimeSeriesCursorStart`,void 0),W([R()],$.prototype,`usageTimeSeriesCursorEnd`,void 0),W([R()],$.prototype,`usageSessionLogsExpanded`,void 0),W([R()],$.prototype,`usageQuery`,void 0),W([R()],$.prototype,`usageQueryDraft`,void 0),W([R()],$.prototype,`usageSessionSort`,void 0),W([R()],$.prototype,`usageSessionSortDir`,void 0),W([R()],$.prototype,`usageRecentSessions`,void 0),W([R()],$.prototype,`usageTimeZone`,void 0),W([R()],$.prototype,`usageContextExpanded`,void 0),W([R()],$.prototype,`usageHeaderPinned`,void 0),W([R()],$.prototype,`usageSessionsTab`,void 0),W([R()],$.prototype,`usageLogFilterRoles`,void 0),W([R()],$.prototype,`usageLogFilterTools`,void 0),W([R()],$.prototype,`usageLogFilterHasTools`,void 0),W([R()],$.prototype,`usageLogFilterQuery`,void 0),customElements.get(`zero-usage-page`)||customElements.define(`zero-usage-page`,$),gr={header:!0,render:e=>j`<zero-usage-page .routeData=${e}></zero-usage-page>`}})))()}_r();export{gr as usagePageComponent};
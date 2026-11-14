import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{A as t,Ao as n,Au as r,B as i,Cr as a,Eo as o,Fr as s,Gc as c,Gl as l,Gu as u,Ho as d,Hs as f,Ic as p,Io as m,Ir as h,It as g,Jc as _,K as ee,Lc as v,Lo as te,Lt as ne,Mr as re,No as ie,Nu as y,Oo as ae,Pl as oe,Po as se,Pr as ce,Pu as b,Ql as le,Ro as ue,Rt as de,Su as fe,U as pe,Ul as me,W as he,Wc as ge,Wl as _e,Wu as ve,Xc as ye,Yi as be,Zi as xe,ac as Se,jo as Ce,jr as we,ju as Te,kl as x,nc as Ee,qc as De,wr as Oe,wu as ke,z as Ae,zl as je,zo as Me,zt as Ne,zu as S}from"./control-ui-core-DCNBgr3X.js";import{$n as Pe,Aa as Fe,Ai as Ie,At as Le,Ba as Re,Er as ze,Et as Be,Nt as Ve,Ot as He,Pt as Ue,Zt as We,ca as C,en as Ge,er as Ke,fo as qe,go as w,hi as Je,ki as Ye,mi as Xe,no as Ze,or as Qe,po as $e,sa as T,sr as et,wo as tt}from"./control-ui-core-DwX5Mpz4.js";import{E as nt,G as E,J as D,W as O,Z as rt,at as k,c as it,f as at,g as ot,k as st,l as ct,n as lt,p as A,rt as j,t as ut}from"./lit-runtime-B40xFCK_.js";import{c as dt,d as ft,l as pt}from"./gateway-runtime-JSfC8ThO.js";import{It as mt,zt as ht}from"./control-ui-boot-shared-BX8huZUb.js";import{Eo as gt,Fo as M,H as _t,I as vt,L as N,Mo as P,N as yt,Po as F,Sr as bt,U as xt,Ur as St,Wr as Ct,Zr as I,go as wt,jo as Tt,uo as Et,va as L,xa as Dt,xr as Ot,ya as kt}from"./ui-AaV6iNVa.js";import{$ as At,I as jt,Rr as Mt,X as Nt,Z as Pt,c as Ft,ct as It,l as Lt,lt as Rt,m as zt,p as Bt,s as Vt,u as Ht,ut as Ut}from"./control-ui-boot-shared-ZuP0LiFD.js";import{I as Wt,Js as Gt,Ks as Kt,Lc as qt,Oc as Jt,Us as Yt,cu as Xt,du as Zt,fu as Qt,hu as $t,kc as en,ns as tn,rs as nn,su as rn,z as an,zc as on}from"./control-ui-boot-shared-CzJHozXQ.js";import{O as sn,k as cn}from"./control-ui-boot-shared-D2GHitQ4.js";import{n as ln,t as un}from"./stream-auto-follow-controller-BZ0UzGsg.js";import{M as dn,N as fn,j as pn}from"./control-ui-boot-chat-B3rfqCeq.js";import{$ as mn,tt as hn}from"./control-ui-boot-chat-zkzP5WWm.js";var gn,R;function z(){return(z=e((()=>{u(),gn={activity:{images:{failed:`Couldn't load images`,older:`Older images`,incomplete:`Images too large to preview here`},pulse:{sessions:`sessions`,started:`started`,people:`people`,running:`running now`,bucket:`{period} · {count} sessions`,description:`{window}: {count} sessions; busiest {period}`},git:{pullRequest:`{repository} pull request #{number}: {title} ({state})`,branchDiff:`{branch}: changes against the default branch, including uncommitted work`,stale:`Git status may be out of date`,open:`Open`,draft:`Draft`,merged:`Merged`,closed:`Closed`},title:`Activity`,visibleCount:`{visible} of {total}`,search:`Search`,searchPlaceholder:`Filter by activity, summary, run, session`,filters:`Filters`,toolFilter:`Tool`,allTools:`All tools`,statusFilters:`Status filters`,autoFollow:`Auto-follow`,expandAll:`Expand all`,collapseAll:`Collapse all`,clear:`Clear`,empty:`No activity yet. Only activity received while this view is open appears here.`,emptyFiltered:`No activity matches these filters.`,argumentHiddenOne:`1 argument hidden`,argumentsHidden:`{count} arguments hidden`,streamLabel:`Agent activity entries`,toolCallId:`Tool call`,runId:`Run`,session:`Session`,outputTruncated:`Preview redacted and truncated.`,noOutputPreview:`No output preview.`,currentWork:{title:`Active sessions`,loading:`Loading active sessions…`,empty:`No active sessions.`,disconnected:`Connect to the Gateway to load active sessions.`,loadFailed:`Could not load active sessions.`,queued:`Queued`,limit:`Showing {count} of {total} active sessions.`},answerCandidate:{title:`Answer candidate`,itemId:`Item`,candidate:`Candidate answer`,superseded:`Superseded answer`,selected:`Selected answer`},status:{running:`Running`,done:`Done`,error:`Error`},runInspector:{activityView:`Activity view`,liveMode:`Live activity`,mode:`Run inspector`,intro:`Durable Gateway-backed identity evidence for one run. Reloading this page queries the Gateway again.`,bestEffortWarning:`Best-effort audit warning: this view is for operational diagnostics, not a lossless compliance record. Absence of evidence does not prove that an action or run did not occur.`,evidenceStateLabel:`Evidence state: {state}`,evidenceState:{present:`Present`,absent:`Absent`,unknown:`Unknown`,unsupported:`Unsupported`},coverageStatusLabel:`Inspection coverage: {state}`,coverage:{enforced:{label:`Enforced`,description:`A decision receipt proves identity-aware evaluation; it does not by itself mean the action was allowed.`},attributionOnly:{label:`Attribution only`,description:`Identity facts were recorded, but no identity-aware policy or grant evaluation is proven.`},unattributed:{label:`Unattributed`,description:`The supported path was observed without a usable invoker principal.`},unknown:{label:`Unknown`,description:`Expected evidence is missing, corrupt, expired unexpectedly, or unreadable.`},unsupported:{label:`Unsupported`,description:`This path has no Phase 0 identity evidence contract.`}},facts:{trustDomain:`Trust domain`,ingress:`Ingress`,invoker:`Invoker`,representedSubject:`Represented subject`,sponsor:`Sponsor`,agentPrincipal:`Agent principal`,agentDefinition:`Agent definition`,runtimeInstance:`Runtime instance`,applicableGrants:`Applicable grants`,applicableGrant:`Applicable grant {index}`,assuranceEvidence:`Assurance evidence`,assuranceEvidenceItem:`Assurance evidence {index}`,lineage:`Lineage`},values:{label:`Label`,kind:`Kind`,operation:`Operation`,principalReference:`Principal reference`,domainReference:`Domain reference`,owningBoundary:`Owning boundary`,sourceReference:`Source reference`,relationshipReference:`Relationship reference`,definitionReference:`Definition reference`,revisionReference:`Revision reference`,runtimeReference:`Runtime reference`,grantReference:`Grant reference`,strength:`Strength`,evidenceReference:`Evidence reference`,depth:`Depth`,parentRunReference:`Parent run reference`,parentExecutionReference:`Parent execution reference`,parentContextReference:`Parent context reference`,delegationReference:`Delegation reference`},reasons:{absent:`No {label} was recorded at the owning boundary.`,unknown:`The {label} was expected, but its evidence is unavailable or unreadable.`,unsupported:`This execution path does not provide {label} evidence.`,invokerAbsent:`The supported ingress boundary recorded no usable invoker principal.`,noGrants:`No applicable grants were recorded for this run.`,noAssurance:`No assurance evidence was recorded for this run.`,noLineage:`No parent or subagent lineage was recorded for this run.`},identityHeading:`Identity and authority`,missingEvidenceHeading:`Missing evidence`,noMissingEvidence:`No missing evidence was reported for this projection.`,nextStepsHeading:`Next steps`,decisions:{heading:`Decision receipts`,none:`No decision receipts were returned for this bounded page.`,returned:`Showing {count} retained decision receipts.`,listLabel:`Decision receipt list`,inspectLabel:`{summary}. Outcome: {outcome}. Evidence classification: {classification}.`,detailHeading:`Receipt detail`,requestedHeading:`What was requested`,outcomeHeading:`What happened`,outcomeLabel:`Outcome`,classificationLabel:`Evidence classification`,reasonLabel:`Recorded reason`,occurredAtLabel:`Recorded at`,ownerHeading:`Display provenance`,durableOwnerLabel:`Verified producer`,boundaryLabel:`Decision boundary`,ownerNote:`The Gateway exposes explanations only from a verified owning call path. Receipt-controlled explanations and next steps are hidden; the Control UI does not infer trust from receipt metadata.`,evidenceHeading:`Evidence limits`,contextFieldsLabel:`Context fields used`,noContextFields:`No context fields were recorded as used.`,policyCountLabel:`Policy references used`,grantCountLabel:`Grant references used`,notFoundTitle:`Receipt not found on this page`,notFoundDescription:`The selected receipt is not present in this retained page. Return to the first page or use a current receipt link.`,readOnly:`Decision receipts are read-only. This view cannot approve, edit, or repeat an action.`,more:`Additional decision receipts are available.`,loadMore:`Load more receipts`,loadingMore:`Loading receipts…`,loadMoreError:`More receipts could not be loaded. The receipts already shown remain unchanged.`,bounded:`Decision inspection is bounded to at most 50 records per request.`,outcomes:{allowed:`Allowed`,denied:`Denied`,notApplicable:`Not applicable`,unknown:`Unknown`}},diagnosticReason:`Diagnostic reason:`,diagnostic:{notFound:{title:`Run not found`,description:`No retained run or identity record matched this reference. Missing best-effort evidence does not prove that the run never occurred.`},expired:{title:`Identity evidence expired`,description:`The Gateway found the run, but its identity context is outside the 30-day retention window.`},corrupt:{title:`Identity evidence is corrupt`,description:`The Gateway found evidence for this run but could not validate the stored identity context.`},ambiguous:{title:`Multiple executions match this run`,description:`A run reference can correlate more than one execution. The inspector will not guess which execution you meant.`},unsupported:{title:`Identity evidence unsupported`,description:`The run is known, but this execution path did not retain a supported identity context.`},unknown:{title:`Identity evidence unknown`,description:`The path promises evidence, but the expected record is missing, unreadable, or otherwise unavailable.`}},candidates:{listLabel:`Matching executions`,recorded:`Recorded {date}`,executionReference:`Inspect execution`,more:`More matching executions exist beyond this bounded page.`,loadMore:`Load more executions`,loadingMore:`Loading executions…`,loadMoreError:`More executions could not be loaded. Try again.`},panels:{empty:{title:`No run selected`,description:`Open a link shaped like /activity?view=run&run=<run-id> to inspect durable identity evidence.`},waiting:{title:`Waiting for the Gateway`,description:`The durable projection will load when this browser reconnects.`},loading:{title:`Loading run inspection`,description:`Reading the Gateway's retained identity projection…`},disconnected:{title:`Gateway disconnected`,description:`Run identity is durable on the Gateway, but it cannot be read while this browser is disconnected.`},unauthorized:{title:`Operator read access required`,description:`This connection does not have operator.read, so retained run identity cannot be loaded.`},unsupported:{title:`Run inspection unsupported`,description:`This Gateway does not offer audit.run.inspect. Upgrade the Gateway, enable execution identity collection, and record a new run.`},error:{title:`Run inspection failed`,description:`The Gateway could not return this diagnostic projection. No identity facts were inferred from Live activity.`}},restart:`Restart inspection`,retry:`Retry inspection`}}},R=Object.assign(()=>{ve.activity=gn.activity},{catalog:gn})})))()}function B(e){let t=_e({},e.key,e.agentId??void 0),n=e.agentId??t.agentId;return JSON.stringify([n?Et(n):null,t.sessionKey,e.sessionId??null])}function _n(e){let t=se(e),n=t?.[0],r=Array.isArray(t?.[1].ancestorSessions)&&t?.[1].session?e:void 0;return!n?.sessionId||!r&&n.hasActiveRun===null&&n.activeRunIds===void 0&&n.status===null&&n.reason!==`delete`?null:{...n,parentKeys:[t?.[2].spawnedBy,t?.[2].controlOwnerSessionKey,t?.[2].parentSessionKey].filter(e=>typeof e==`string`&&!!e),...typeof t?.[1].ts==`number`&&Number.isFinite(t[1].ts)?{eventTs:t[1].ts}:{},...r?{snapshot:r}:{}}}function vn(e){let t=ue(e);return t.flatMap(e=>{let n=_n(e);return n?.snapshot&&(n.ancestorSnapshots=t),n?[n]:[]})}function yn(e,t){return e.updatedAt!==null&&(t.updatedAt??0)>e.updatedAt||e.snapshotAt!==void 0&&(t.snapshotAt??0)>e.snapshotAt}function bn(e,t,r,i,a=!1){if(a)for(let[t,{retiredAt:n}]of r)typeof n==`number`&&n>e.ts?r.set(t,{retiredAt:n}):r.delete(t);let o=new Map(e.sessions.map(e=>[B(e),{row:e,requiresRefresh:!1}]));for(let[t,{row:n}]of o){let i=r.get(t)?.retiredAt;i!==void 0&&(i===null||(n.snapshotAt??e.ts)<=i)&&o.delete(t)}let s=i||r.size>=1e3,c=!1,l=(e,t,n)=>{if(!r.has(e)&&r.size>=1e3){s=!0;return}let i=r.get(e)??{};if(t===`authority`)i.authority=!0;else{let e=i[t];i[t]=e===null||n===null?null:Math.max(e??0,n),t===`retiredAt`&&n!==null&&typeof i.observedAt==`number`&&n>=i.observedAt&&delete i.observedAt}r.set(e,i),s||=r.size>=xn};for(let i of t){let t=B(i),a=o.get(t),u=a?.row??e.sessions.find(e=>B(e)===t);(!u||!yn(i,u))&&(c||=!n(e.sessions,i.key,[u?.spawnedBy,u?.controlOwnerSessionKey,u?.parentSessionKey,...i.parentKeys],i.ancestorSnapshots));let d=i.status===`running`||i.status===`queued`?i.status:void 0,f=i.hasActiveRun===!0||i.hasActiveRun!==!1&&d!==void 0,p=i.reason===`delete`||i.hasActiveRun===!1&&(i.snapshot!==void 0||i.activeRunIds!==void 0||!i.runId),m=i.hasActiveRun===!1||i.status!==null,h=i.snapshotAt??i.eventTs??i.updatedAt;if(!a){let n=r.get(t),a=n?.retiredAt;if(typeof a==`number`&&h!==null&&(h<a||h===a&&!i.snapshot&&!f&&!p&&m))continue;if([...o.values()].some(({row:e})=>ie(e,i.key,i.agentId))){l(t,`authority`,null),p&&l(t,`retiredAt`,h);continue}if(i.isAncestorReference||cn(i.key)||i.snapshot&&se(i.snapshot)?.[2].isDock===!0||i.snapshot&&i.hasActiveRun===!0&&i.snapshotAt!==void 0&&!e.hasMore&&i.snapshotAt<e.ts)continue;if(i.snapshot&&i.reason!==`delete`&&i.hasActiveRun===!0&&i.snapshotAt!==void 0&&!s&&a!==null&&n?.observedAt!==null&&!n?.authority&&i.snapshotAt>Math.max(e.ts,a??0,n?.observedAt??0)&&!e.hasMore&&o.size<(e.limitApplied??100)){let e=te(void 0,i.snapshot,{archivedFilter:`all`,admitSnapshot:!0}).admittedRow;if(e?.hasActiveRun===!0){o.set(t,{row:e,requiresRefresh:!1}),r.delete(t);continue}}p?l(t,`retiredAt`,h):(f||m)&&l(t,`observedAt`,h);continue}let{row:g}=a;if(yn(i,g))continue;if(i.snapshot){let e=te(g,i.snapshot,{archivedFilter:`all`});e.admittedRow?(a.row=e.admittedRow,a.requiresRefresh=!1,e.admittedRow.hasActiveRun!==!0&&(l(t,`retiredAt`,h),o.delete(t))):e.deletedKey?(o.delete(t),l(t,`retiredAt`,h)):a.requiresRefresh=!0;continue}let _={...g,updatedAt:i.updatedAt??g.updatedAt};if(i.reason===`delete`)_.hasActiveRun=!1,_.activeRunIds=[];else if(f)_.hasActiveRun=!0,_.status=d??(g.status===`queued`?`queued`:`running`),i.activeRunIds===void 0?i.runId&&!g.activeRunIds?.includes(i.runId)&&(_.activeRunIds=void 0):_.activeRunIds=i.activeRunIds??void 0;else{if(m&&g.hasActiveRun===!0&&i.runId&&!g.activeRunIds?.includes(i.runId)){a.requiresRefresh=!0;continue}if(p||i.activeRunIds?.length===0)_.hasActiveRun=!1,_.activeRunIds=[];else if(m){let e=i.activeRunIds??g.activeRunIds;if(!i.runId||!e?.includes(i.runId)){a.requiresRefresh=g.hasActiveRun===!0;continue}_.activeRunIds=e.filter(e=>e!==i.runId),_.hasActiveRun=_.activeRunIds.length>0}else i.activeRunIds!==void 0&&(_.activeRunIds=i.activeRunIds??void 0)}if(_.hasActiveRun!==!0){l(t,`retiredAt`,h),o.delete(t);continue}a.row=_,a.requiresRefresh=!1}let u=[...o.values()].filter(({row:e})=>e.hasActiveRun===!0),d=u.map(({row:e})=>e).toSorted(Me),f=!u.some(e=>e.requiresRefresh),p=s||c||!f||[...r.values()].some(e=>e.authority||e.observedAt!==void 0)||e.hasMore===!0&&d.length<e.sessions.length;return{result:{...e,count:d.length,...e.hasMore?{}:{totalCount:d.length},sessions:d},requiresRefresh:p,canPublish:f,retirementOverflowed:s}}var xn;function Sn(){return(Sn=e((()=>{sn(),d(),x(),Ce(),xn=1e3})))()}function Cn(e,t){let n=D`<span class="activity-current-work__copy">
      <span class="activity-current-work__title">${Se(t.key,t)}</span>
      <span class="activity-current-work__agent"
        >${t.agentId?S(`activityFeed.agentLabel`,{value:t.agentId}):t.key}</span
      >
    </span>
    ${Pt({kind:`warn`,label:t.status===`queued`?S(`activity.currentWork.queued`):S(`activity.status.running`)})}`,r=_(t),i=c(t.key,e.globalScope)?ye({face:r,sessionKey:t.key,basePath:e.basePath,fallbackAgentId:t.agentId??e.fallbackAgentId,mainKey:e.mainKey,row:t}):null,a=i?A`a`:A`div`;return ot`<${a}
    class="activity-current-work__row"
    data-session-key=${t.key}
    data-agent-id=${t.agentId??E}
    href=${i?.href??E}
    @click=${i?t=>{f(t)&&(t.preventDefault(),e.navigate(r,i.options))}:E}
  >
    ${n}
  </${a}>`}function wn(e){let t=e.connected&&!e.error?e.result?.sessions??[]:[],n=e.connected?e.error?S(`activity.currentWork.loadFailed`):!e.result||t.length===0&&e.incomplete?S(`activity.currentWork.loading`):t.length===0?S(`activity.currentWork.empty`):null:S(`activity.currentWork.disconnected`);return D`<section
    class="activity-current-work"
    aria-label=${S(`activity.currentWork.title`)}
    aria-busy=${e.loading}
  >
    <div class="settings-section__header">
      <h2 class="settings-section__heading">${S(`activity.currentWork.title`)}</h2>
    </div>
    <div class="settings-group activity-current-work__rows">
      ${n?D`<div class="activity-current-work__feedback" role="status">
              <span>${n}</span>
              ${e.error?D`<button type="button" class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRetry}>${S(`common.retry`)}</button>`:E}
            </div>`:lt(t,B,t=>Cn(e,t))}
      ${e.result?.hasMore&&!n?D`<div class="activity-current-work__feedback">${S(`activity.currentWork.limit`,{count:String(t.length),total:String(e.result.totalCount??t.length)})}</div>`:E}
    </div>
  </section>`}function Tn(){return(Tn=e((()=>{O(),ut(),at(),jt(),b(),z(),Ee(),ge(),Sn(),R()})))()}function En(e,t=Date.now()){let n=L(e),r=P(n?.runId),i=L(n?.data),a=n?.stream===`tool`,o=n?.stream===`item`&&P(i?.kind)===`answer_candidate`;if(!n||!a&&!o||!r||!i)return null;let s=P(n.sessionKey),c=P(n.agentId);return{stream:a?`tool`:`item`,runId:r,ts:typeof n.ts==`number`?n.ts:t,receivedAt:t,...s?{sessionKey:s}:{},...c?{agentId:c}:{},data:i}}function Dn(e){if(typeof e==`string`)return e;if(typeof e==`number`||typeof e==`boolean`)return String(e);let t=L(e);if(!t)return null;if(typeof t.text==`string`)return t.text;let n=t.content;if(!Array.isArray(n))return null;let r=n.map(e=>{let t=L(e);return t?.type===`text`&&typeof t.text==`string`?t.text:null}).filter(e=>!!e);return r.length>0?r.join(`
`):null}function On(e){let t=Dn(e);if(t!==null)return t;if(e==null)return null;try{return JSON.stringify(e,null,2)}catch{return pe(e)}}function kn(e){let t=On(e);if(!t)return{truncated:!1};let n=ke(t),r=ee(n,Ln);return{text:Array.from(r.text).join(``),truncated:r.truncated}}function An(e){if(e==null)return 0;if(Array.isArray(e))return e.length;let t=L(e);return t?Object.keys(t).length:1}function jn(e){return e?.isError===!0||e?.is_error===!0}function Mn(e){if(P(e.phase)!==`result`)return`running`;let t=L(e.result);if(jn(e)||jn(t))return`error`;let n=P(e.status)??P(t?.status);if(n&&/error|fail|failed|failure/i.test(n))return`error`;let r=Number(t?.exitCode??e.exitCode);return Number.isFinite(r)&&r!==0?`error`:`done`}function Nn(e,t,n){let r=`${n} argument${n===1?``:`s`} hidden`;return`${e} ${Rn[t]}; ${r}`}function Pn(e,t){let n=t.data,r=t.stream===`item`,i=P(r?n.itemId:n.toolCallId),a=r?Fn(n.status):null;if(!i||r&&!a)return e;let o=r?`answer_candidate`:P(n.name)??`tool`,s=r?`${t.runId}:answer_candidate:${i}`:`${t.runId}:${i}`,c=e.find(e=>e.id===s),l=t.receivedAt,u=c?.startedAt??t.ts,d=r?a===`candidate`?`running`:`done`:Mn(n),f=kn(r?n.progressText:n.phase===`update`?n.partialResult:n.phase===`result`?n.result:null),p=r?0:n.args===void 0?c?.hiddenArgumentCount??0:An(n.args),m=r?f.text:f.text??c?.outputPreview,h={id:s,toolCallId:i,runId:t.runId,...t.sessionKey?{sessionKey:t.sessionKey}:{},toolName:o,entryKind:r?`answer_candidate`:`tool`,...a?{itemId:i,candidateStatus:a}:{},status:d,startedAt:u,updatedAt:l,durationMs:Math.max(0,l-u),outputTruncated:f.truncated||c?.outputTruncated===!0,summary:r?`answer_candidate.${a}`:Nn(o,d,p),hiddenArgumentCount:p,...m?{outputPreview:m}:{}},g=c?e.map(e=>e.id===s?h:e):[...e,h];return g.length>In?g.slice(-100):g}function Fn(e){return e===`candidate`||e===`superseded`||e===`selected`?e:null}var In,Ln,Rn;function zn(){return(zn=e((()=>{fe(),he(),In=100,Ln=2e3,Rn={running:`running`,done:`completed`,error:`failed`}})))()}function Bn(e,t){let n=[],r={entries:n,revision:0,error:null},i=new Map,a=e.eventLogRevision,o=!1,s=[],c=e.snapshot.client,l=document.visibilityState!==`hidden`,u=new Map,d=r=>{let a=u.get(r);u.delete(r),i.delete(r)&&h(n);let o=c;a?.then(n=>t.unsubscribeMessages(n).catch(()=>{e.snapshot.client===o&&e.snapshot.phase===`connected`&&e.connect()}),()=>void 0)},f=()=>{let r=e.snapshot.phase===`connected`;r||(s=[]);let a=new Map((l&&r&&!o?s.slice(0,100):[]).map(e=>[B({key:e.key,agentId:e.agentId}),e]));for(let t of u.keys())(!a.has(t)||c!==e.snapshot.client)&&d(t);c=e.snapshot.client;for(let[e,r]of a)if(!u.has(e)){let a=t.subscribeMessages(r.key,{agentId:je(r.key)?void 0:r.agentId});u.set(e,a),a.catch(t=>{u.get(e)===a&&(i.set(e,t instanceof Error?t.message:String(t)),h(n))})}},p=e=>{l=e.type!==`pagehide`&&document.visibilityState!==`hidden`,f()};document.addEventListener(`visibilitychange`,p),globalThis.addEventListener(`pagehide`,p),globalThis.addEventListener(`pageshow`,p);let m=new Set,h=(e,t=!1)=>{let a=i.values().next().value??null;(e!==n||t||r.error!==a)&&(n=e,r={entries:n,revision:r.revision+ +!!t,error:a},Ue(m,r,`activity`,e=>!o&&e===r))},g=()=>{let t=e.eventLogRevision;t!==a&&(a=t,s=[],f(),h([],!0))},_=e.subscribe(()=>{o||(g(),f())}),ee=e.subscribeEvents(t=>{if(o||t.event!==`agent`&&t.event!==`session.tool`)return;let r=e.snapshot.client,i=e.eventLogRevision;if(g(),o||r!==e.snapshot.client||i!==e.eventLogRevision)return;let a=En(t.payload,Date.now());a?.sessionKey&&u.has(B({key:a.sessionKey,agentId:a.agentId}))&&h(Pn(n,a))});return{get snapshot(){return r},subscribe(e){return m.add(e),()=>m.delete(e)},syncSessions(e){s!==e&&(s=e,f())},retry(){for(let e of i.keys())d(e);f()},clear(){h([],!0)},dispose(){o=!0,f(),document.removeEventListener(`visibilitychange`,p),globalThis.removeEventListener(`pagehide`,p),globalThis.removeEventListener(`pageshow`,p),_(),ee(),n=[],r={entries:n,revision:r.revision+1,error:null},m.clear()}}}function Vn(){return(Vn=e((()=>{Ve(),x(),Sn(),zn()})))()}function Hn(e,t){let n=new URLSearchParams(e),r=n.get(`time`);return{personId:t??F(n.get(`person`))??null,query:n.get(`q`)?.trim()??``,time:Qn.find(e=>e===r)??$n}}function Un(e,t=``,n){let r=new URLSearchParams;e.time!==$n&&r.set(`time`,e.time),e.query&&r.set(`q`,e.query);let i=r.toString(),a=i?`?${i}`:``;return{pathname:e.personId?$e(e.personId,t,n).pathname:tt(`activity`,t),search:a}}function Wn(e,t,n,r){let i=new URLSearchParams(e.search),a=qe(e.pathname,r),o=(a??i.get(`person`))?.replaceAll(`-`,``),s=o&&/^[0-9a-f]{8,32}$/.test(o)&&t.replaceAll(`-`,``).startsWith(o)?o.length:32,c=a&&!n?e.pathname:$e(t,r,n,s).pathname;i.delete(Ze);let l=i.toString(),u=l?`?${l}`:``;return c===e.pathname&&u===e.search?null:{pathname:c,search:u,hash:e.hash}}function Gn(e,t){return N(t)-N(e)||(e.key<t.key?-1:+(e.key>t.key))}function Kn(e,t,n,r){let i=new Map((t?.sessions??[]).flatMap(e=>{let t=n.identity(e);return t?[[t,e]]:[]})),a=!1,o=e.sessions.map(e=>{let t=n.identity(e),o=t?i.get(t):void 0;n.observeReadRow(e,r,e.agentId,o?[o]:[]),t&&i.delete(t);let s=o?n.mergeRow(o,e,e.agentId):e;return a||=N(s)!==N(e),s});return{result:{...e,sessions:a?o.toSorted(Gn):o},requiresRefresh:[...i.values()].some(t=>{let i=n.fieldObservation(t,`updatedAt`).source.snapshotAt;return(i===void 0?n.hasNewerFacts(t,r):i>e.ts)&&!e.sessions.some(e=>ie(e,t.key,n.owner(t)))})}}function qn(e,t,n,r){let i=e,a=!1;for(let e of t){if(!e.snapshot||!we(i,e.snapshot,{archivedFilter:`all`,limit:100,excludeSubagents:!0,excludeDock:!0},`activity`)){a=!0;continue}let t=ae(i,e.snapshot,{archivedFilter:`all`},(e,t,i,a)=>(n.inheritRow(e,t),n.observeFields(e,(a.isAncestorReference?n.fieldNames(t):i).filter(e=>e!==`activitySummary`||a.hasActivitySummary),s(r,a.updatedAt,void 0,a.snapshotAt),a.agentId),n.mergeRow(t,e,a.agentId))).result;t&&(i={...t,sessions:t.sessions.toSorted(Gn)})}return{result:i,requiresRefresh:a}}function Jn(e){let t=e.owner?.actor??e.createdActor,n=F(e.agentId),{resourceBasePath:r}=de();return{id:F(t?.id)??n??`system`,name:F(t?.label)??n,avatarUrl:t?F(t.avatarUrl):n?_t(`agentAvatar`,r,n):void 0,watchedSessions:[]}}function Yn(e){let t=new Date(e),n=String(t.getMonth()+1).padStart(2,`0`),r=String(t.getDate()).padStart(2,`0`);return`${t.getFullYear()}-${n}-${r}`}function Xn(e){let t=e?.sessions??[],n=(e?.people??[]).map(e=>({id:e.identity.id,name:e.label,avatarUrl:e.avatarUrl,watchedSessions:[],count:e.sessionCount})),r=new Map;for(let e of t){let t=N(e),n=t>0?Yn(t):`unknown`,i=r.get(n);i?i.push(e):r.set(n,[e])}return{days:[...r.entries()].map(([e,t])=>({key:e,timestamp:e===`unknown`?null:new Date(N(t[0])).setHours(0,0,0,0),sessions:t})),matchedCount:e?.totalCount??t.length,people:n,sessions:t,timeCount:e?.peopleSessionCount??t.length}}function Zn(e,t){let n=new Set(e.watchedSessions);return t.filter(e=>n.has(e.key)).toSorted(Gn)}var Qn,V,$n;function H(){return(H=e((()=>{xt(),vt(),w(),ne(),o(),re(),h(),Ce(),Qn=[`24h`,`7d`,`30d`,`all`],V={"24h":`activityFeed.time24h`,"7d":`activityFeed.time7d`,"30d":`activityFeed.time30d`,all:`activityFeed.timeAll`},$n=`7d`})))()}function er(e,t){let n=`?view=run&${e.kind}=${encodeURIComponent(e.id)}`;return t&&(n+=`&receipt=${encodeURIComponent(t.id)}`,t.decisionCursor&&(n+=`&decision=${encodeURIComponent(t.decisionCursor)}`)),n}function U(e,t,n){return`${tt(`activity`,t)}${er(e,n)}`}function tr(e,t){return U({kind:`run`,id:e},t)}function nr(e,t){let n=new URLSearchParams(e);if(n.get(`view`)===`live`)return{mode:`live`,selector:null};if(n.get(`view`)!==`run`)return{mode:`sessions`,filters:Hn(e,t),selector:null};let r=n.get(`execution`),i=n.get(`run`),a=n.get(`receipt`)?.trim()||null,o=a&&n.get(`decision`)?.trim()||null;return{mode:`run`,selector:r?.trim()?{kind:`execution`,id:r}:i?.trim()?{kind:`run`,id:i}:null,selectorId:a,decisionCursor:o}}function rr(e,t){return new Map(e.map(e=>[e.selectorId,t]))}function ir(e,t){if(e.identity.state!==`present`||t.identity.state!==`present`||e.run.executionId!==t.run.executionId||e.identity.context.contextId!==t.identity.context.contextId)return null;let n=new Map(e.decisionDisplays.map(e=>[e.selectorId,e]));for(let e of t.decisionDisplays)n.set(e.selectorId,e);return{...t,decisionDisplays:[...n.values()]}}function ar(e){let t=e.identity;return t.state===`present`||t.state===`ambiguous`?t.state:t.reasonCode===`run_not_found`||t.reasonCode===`execution_not_found`?`not-found`:t.reasonCode===`identity_context_corrupt`?`corrupt`:t.state===`unsupported`&&t.remediation.some(e=>e.code===`run_again_after_expiry`)?`expired`:t.state}function W(){return(W=e((()=>{w(),H()})))()}function or(e){return e===`attribution-only`?`attributionOnly`:e}function sr(e){return S(`activity.runInspector.coverage.${or(e)}.label`)}function G(e,t=!1,n){let r=D`<bdi
    class=${t?`run-inspector__ref mono`:`run-inspector__ref`}
    dir="ltr"
    >${e}</bdi
  >`;return n?D`<a href=${n}>${r}</a>`:r}function K(e,t){return D`<dl class="run-inspector__values">
    ${t.map(([t,n])=>D`
        <div>
          <dt>${S(`activity.runInspector.${e}.${t}`)}</dt>
          <dd>${n}</dd>
        </div>
      `)}
  </dl>`}function cr(e,t,n){return n===6?D`<h6 id=${t}>${e}</h6>`:D`<h3 id=${t}>${e}</h3>`}function lr(e,t={}){let n=t.headingId??`run-inspector-missing-heading`;return D`
    <section class="run-inspector__section" aria-labelledby=${n}>
      ${cr(S(`activity.runInspector.missingEvidenceHeading`),n,t.headingLevel??3)}
      ${e.length===0?D`<p>${S(`activity.runInspector.noMissingEvidence`)}</p>`:D`<ul class="run-inspector__code-list">
              ${e.map(e=>D`<li>${G(e,!0)}</li>`)}
            </ul>`}
    </section>
  `}function ur(e,t={}){if(e.length===0)return E;let n=t.headingId??`run-inspector-remediation-heading`;return D`
    <section class="run-inspector__section" aria-labelledby=${n}>
      ${cr(S(`activity.runInspector.nextStepsHeading`),n,t.headingLevel??3)}
      <ul class="run-inspector__remediation-list">
        ${e.map(e=>D`<li>
            <span>${e.text}</span> ${G(e.code,!0)}
          </li>`)}
      </ul>
    </section>
  `}function dr(e){return S(`activity.runInspector.decisions.outcomes.${e===`not-applicable`?`notApplicable`:e}`)}function fr(e,t=!1){return[[e.decision.outcome,dr(e.decision.outcome),`outcomeLabel`],[e.enforcement.coverageState,sr(e.enforcement.coverageState),`classificationLabel`]].map(([e,n,r])=>D`<span
      class="run-inspector__receipt-badge run-inspector__receipt-badge--${e}"
      role=${t?`img`:E}
      aria-label=${t?`${S(`activity.runInspector.decisions.${r}`)}: ${n}`:E}
      >${n}</span
    >`)}function pr(e,t){return e.length===0?D`<p class="run-inspector__reason">${t}</p>`:D`<ul class="run-inspector__code-list">
        ${e.map(e=>D`<li>${G(e,!0)}</li>`)}
      </ul>`}function mr(e,t,n){return D`<div class="run-inspector__pagination">
    <span>${S(`activity.runInspector.${e}.more`)}</span>
    <button type="button" class="btn" ?disabled=${t===`loading`} @click=${n}>
      ${S(`activity.runInspector.${e}.${t===`loading`?`loadingMore`:`loadMore`}`)}
    </button>
    ${t===`error`?D`<span role="alert">${S(`activity.runInspector.${e}.loadMoreError`)}</span>`:E}
  </div>`}function hr(e){let t=e.enforcement.coverageState;return D`
    <article
      class="run-inspector__receipt-detail"
      data-receipt-selector-id=${e.selectorId}
      aria-labelledby="run-inspector-receipt-detail"
    >
      <h4 id="run-inspector-receipt-detail">
        ${S(`activity.runInspector.decisions.detailHeading`)}
      </h4>
      <section aria-labelledby="run-inspector-receipt-requested">
        <h5 id="run-inspector-receipt-requested">
          ${S(`activity.runInspector.decisions.requestedHeading`)}
        </h5>
        ${e.action.summary?D`<p>${e.action.summary}</p>`:E}
        ${K(`values`,[[`kind`,G(e.action.family)],[`operation`,G(e.action.operation)]])}
      </section>
      <section aria-labelledby="run-inspector-receipt-outcome">
        <h5 id="run-inspector-receipt-outcome">
          ${S(`activity.runInspector.decisions.outcomeHeading`)}
        </h5>
        <div class="run-inspector__receipt-badges">${fr(e,!0)}</div>
        <p class="run-inspector__reason">
          ${S(`activity.runInspector.coverage.${or(t)}.description`)}
        </p>
        ${K(`decisions`,[[`reasonLabel`,G(e.decision.reasonCode,!0)],[`occurredAtLabel`,new Date(e.occurredAt).toLocaleString()]])}
      </section>
      <section aria-labelledby="run-inspector-receipt-owner">
        <h5 id="run-inspector-receipt-owner">
          ${S(`activity.runInspector.decisions.ownerHeading`)}
        </h5>
        ${e.provenance.state===`verified`?K(`decisions`,[[`durableOwnerLabel`,G(e.provenance.producer)]]):E}
        <p class="run-inspector__reason">${S(`activity.runInspector.decisions.ownerNote`)}</p>
      </section>
      <section aria-labelledby="run-inspector-receipt-evidence">
        <h5 id="run-inspector-receipt-evidence">
          ${S(`activity.runInspector.decisions.evidenceHeading`)}
        </h5>
        ${K(`decisions`,[[`policyCountLabel`,e.enforcement.policyCount],[`grantCountLabel`,e.enforcement.grantCount]])}
        <h6>${S(`activity.runInspector.decisions.contextFieldsLabel`)}</h6>
        ${pr(e.enforcement.contextFieldsUsed,S(`activity.runInspector.decisions.noContextFields`))}
        ${lr(e.missingEvidence,{headingId:`run-inspector-receipt-missing-heading`,headingLevel:6})}
      </section>
      ${ur(e.remediation,{headingId:`run-inspector-receipt-remediation-heading`,headingLevel:6})}
    </article>
  `}function gr(e,t,n,r,i){let a=e.result,o=n?a.decisionDisplays.find(e=>e.selectorId===n):a.decisionDisplays[0];return D`
    <section class="run-inspector__section" aria-labelledby="run-inspector-decisions-heading">
      <h3 id="run-inspector-decisions-heading">${S(`activity.runInspector.decisions.heading`)}</h3>
      ${a.decisionDisplays.length===0?D`<p>${S(`activity.runInspector.decisions.none`)}</p>`:D`<p>
              ${S(`activity.runInspector.decisions.returned`,{count:String(a.decisionDisplays.length)})}
            </p>`}
      <div class="run-inspector__warning" role="note">
        ${S(`activity.runInspector.decisions.readOnly`)}
      </div>
      ${a.decisionDisplays.length>0&&t?D`<ol
              class="run-inspector__receipt-list"
              aria-label=${S(`activity.runInspector.decisions.listLabel`)}
            >
              ${a.decisionDisplays.map(n=>{let i=o?.selectorId===n.selectorId,a=n.action.summary??`${n.action.family} · ${n.action.operation}`;return D`<li>
                  <a
                    href=${U(t,r,{id:n.selectorId,decisionCursor:e.receiptPageCursors.get(n.selectorId)})}
                    aria-current=${i?`true`:E}
                    aria-label=${S(`activity.runInspector.decisions.inspectLabel`,{summary:a,outcome:dr(n.decision.outcome),classification:sr(n.enforcement.coverageState)})}
                  >
                    <span>${a}</span>
                    <span class="run-inspector__receipt-badges" aria-hidden="true">
                      ${fr(n)}
                    </span>
                  </a>
                </li>`})}
            </ol>`:E}
      ${a.nextDecisionCursor?mr(`decisions`,e.decisionPageStatus,i):D`<div class="run-inspector__pagination" role="note">
              ${S(`activity.runInspector.decisions.bounded`)}
            </div>`}
      ${n&&!o?D`<div class="run-inspector__result-state" role="status">
              <h4>${S(`activity.runInspector.decisions.notFoundTitle`)}</h4>
              <p>${S(`activity.runInspector.decisions.notFoundDescription`)}</p>
              ${t?D`<a href=${U(t,r)}>
                      ${S(`activity.runInspector.decisions.heading`)}
                    </a>`:E}
            </div>`:o?hr(o):E}
    </section>
  `}function _r(){return(_r=e((()=>{O(),b(),W()})))()}function q(e){return e?[...J(`label`,e.displayLabel,!1),[`kind`,e.kind],[`principalReference`,e.principalRef,!0],[`domainReference`,e.domainRef,!0]]:[]}function J(e,t,n=!0,r){return t?[[e,t,n,r]]:[]}function vr(e){let t=e.values??[],n=S(`activity.runInspector.evidenceState.${e.state}`),r=e.reason??(e.state===`present`?void 0:S(`activity.runInspector.reasons.${e.state}`,{label:e.label.toLowerCase()}));return D`
    <div class="run-inspector__fact" data-state=${e.state}>
      <dt>
        <span>${e.label}</span>
        <span
          class="run-inspector__state run-inspector__state--${e.state}"
          role="img"
          aria-label=${S(`activity.runInspector.evidenceStateLabel`,{state:n})}
        >
          ${n}
        </span>
      </dt>
      <dd>
        ${t.length>0?K(`values`,t.map(([e,t,n,r])=>[e,G(t,n,r)])):E}
        ${r?D`<p class="run-inspector__reason">${r}</p>`:E}
      </dd>
    </div>
  `}function yr(e,t){let n=e.representedSubject,r=e.sponsor,i=e.lineage;return[{label:S(`activity.runInspector.facts.trustDomain`),state:e.trustDomain.state,values:[[`kind`,e.trustDomain.kind],[`domainReference`,e.trustDomain.domainRef,!0]]},{label:S(`activity.runInspector.facts.ingress`),state:e.ingress.state,values:[[`kind`,e.ingress.kind],[`owningBoundary`,e.ingress.boundary,!0],...J(`sourceReference`,e.ingress.sourceRef)]},{label:S(`activity.runInspector.facts.invoker`),state:e.invoker.state,values:q(e.invoker.principal),reason:e.invoker.state===`absent`?S(`activity.runInspector.reasons.invokerAbsent`):void 0},{label:S(`activity.runInspector.facts.representedSubject`),state:n?.state??`absent`,values:q(n?.principal)},{label:S(`activity.runInspector.facts.sponsor`),state:r?.state??`absent`,values:[...q(r?.principal),...J(`relationshipReference`,r?.relationshipRef)]},{label:S(`activity.runInspector.facts.agentDefinition`),state:e.agentDefinition.state,values:[[`definitionReference`,e.agentDefinition.definitionRef,!0],...J(`revisionReference`,e.agentDefinition.revisionRef)]},{label:S(`activity.runInspector.facts.agentPrincipal`),state:`present`,values:q(e.agentPrincipal)},{label:S(`activity.runInspector.facts.runtimeInstance`),state:e.runtimeInstance.state,values:[[`kind`,e.runtimeInstance.kind],[`runtimeReference`,e.runtimeInstance.runtimeRef,!0]]},...e.applicableGrants.length===0?[{label:S(`activity.runInspector.facts.applicableGrants`),state:`absent`,reason:S(`activity.runInspector.reasons.noGrants`)}]:e.applicableGrants.map((e,t)=>({label:S(`activity.runInspector.facts.applicableGrant`,{index:String(t+1)}),state:e.state,values:[[`grantReference`,e.grantRef,!0]]})),...e.assurance.length===0?[{label:S(`activity.runInspector.facts.assuranceEvidence`),state:`absent`,reason:S(`activity.runInspector.reasons.noAssurance`)}]:e.assurance.map((e,t)=>({label:S(`activity.runInspector.facts.assuranceEvidenceItem`,{index:String(t+1)}),state:`present`,values:[[`kind`,e.kind],[`strength`,e.strength],[`evidenceReference`,e.evidenceRef,!0]]})),{label:S(`activity.runInspector.facts.lineage`),state:i?`present`:`absent`,values:i?[[`depth`,i.depth],...J(`parentRunReference`,i.parentRunId,!0,i.parentRunId?U({kind:`run`,id:i.parentRunId},t):void 0),...J(`parentExecutionReference`,i.parentExecutionId),...J(`parentContextReference`,i.parentContextId),...J(`delegationReference`,i.delegationRef),...q(i.parentAgentPrincipal)]:[],reason:i?void 0:S(`activity.runInspector.reasons.noLineage`)}]}function br(e,t,n,r){if(e.identity.state===`present`)return E;let i=ar(e),a=i===`not-found`?`notFound`:i,o=S(`activity.runInspector.diagnostic.${a}.title`),s=e.identity;return D`
    <div class="run-inspector__result-state" role="status" aria-label=${o}>
      <h3>${o}</h3>
      <p>${S(`activity.runInspector.diagnostic.${a}.description`)}</p>
      <p>
        ${S(`activity.runInspector.diagnosticReason`)}
        ${G(s.reasonCode,!0)}
      </p>
    </div>
    ${s.state===`ambiguous`?D`
            <ol
              class="run-inspector__candidate-list"
              aria-label=${S(`activity.runInspector.candidates.listLabel`)}
            >
              ${s.candidates.map(e=>D`
                  <li>
                    <span
                      >${S(`activity.runInspector.candidates.recorded`,{date:new Date(e.createdAt).toLocaleString()})}</span
                    >
                    <a
                      href=${U({kind:`execution`,id:e.executionId},t)}
                    >
                      ${S(`activity.runInspector.candidates.executionReference`)}
                      ${G(e.executionId,!0)}
                    </a>
                  </li>
                `)}
            </ol>
            ${e.nextExecutionCursor?mr(`candidates`,n,r):E}
          `:E}
    ${lr(s.missingEvidence)}
    ${ur(s.remediation)}
  `}function xr(e,t){let{basePath:n,selector:r,selectorId:i,onLoadMoreDecisions:a,onLoadMoreExecutions:o}=e,s=t.result,c=sr(s.coverage.state);return D`
    <div
      class="run-inspector__coverage run-inspector__coverage--${s.coverage.state}"
      role="status"
      aria-label=${S(`activity.runInspector.coverageStatusLabel`,{state:c})}
    >
      <strong>${c}</strong>
      <span>
        ${S(`activity.runInspector.coverage.${or(s.coverage.state)}.description`)}
      </span>
    </div>
    ${s.identity.state===`present`?D`
            <section
              class="run-inspector__section"
              aria-labelledby="run-inspector-identity-heading"
            >
              <h3 id="run-inspector-identity-heading">
                ${S(`activity.runInspector.identityHeading`)}
              </h3>
              <dl class="run-inspector__facts">
                ${yr(s.identity.context,n).map(vr)}
              </dl>
            </section>
            ${lr(s.coverage.missingEvidence)}
            ${gr(t,r,i,n,a)}
          `:br(s,n,t.executionPageStatus,o)}
  `}function Sr(e,t){let n=t.status===`loading`&&t.waitingForGateway?`waiting`:t.status,r=t.status===`error`?t.recovery===`restart`?{label:S(`activity.runInspector.restart`),onClick:e.onRestart}:{label:S(`activity.runInspector.retry`),onClick:e.onRetry}:void 0;return D`
    <div
      class="run-inspector__panel"
      role=${t.status===`error`||t.status===`unauthorized`?`alert`:`status`}
    >
      <h3>${S(`activity.runInspector.panels.${n}.title`)}</h3>
      <p>${S(`activity.runInspector.panels.${n}.description`)}</p>
      ${r?D`<button type="button" class="btn" @click=${r.onClick}>
              ${r.label}
            </button>`:E}
    </div>
  `}function Cr(e){let t=e.state,n=t.status===`ready`&&t.result.identity.state===`present`?t.result.identity.context:null,r=t.status===`ready`?xr(e,t):Sr(e,t);return D`
    <section
      id="activity-run-panel"
      class="run-inspector"
      data-run-id=${n?.runId??E}
      data-execution-id=${n?.executionId??E}
      aria-label=${S(`activity.runInspector.mode`)}
    >
      <div class="settings-section__header">
        <div>
          <h2 class="settings-section__heading">${S(`activity.runInspector.mode`)}</h2>
          <p class="run-inspector__intro">${S(`activity.runInspector.intro`)}</p>
        </div>
      </div>
      <div class="run-inspector__warning" role="note">
        ${S(`activity.runInspector.bestEffortWarning`)}
      </div>
      ${r}
    </section>
  `}function wr(){return(wr=e((()=>{O(),b(),z(),_r(),W(),R()})))()}function Tr(e,t,n){let r=new Date(t);return e===`24h`?t-r.getMinutes()*6e4-r.getSeconds()*1e3-r.getMilliseconds()+n*36e5:e===`all`?new Date(r.getFullYear(),r.getMonth()+n,1).getTime():new Date(r.getFullYear(),r.getMonth(),r.getDate()+n).getTime()}function Er(e,t){let n={"24h":25,"7d":8,"30d":31,all:12}[e],r=e===`24h`?t-864e5:Tr(e,t,1-n);return Array.from({length:n+1},(t,n)=>Tr(e,r,n))}function Dr(e,t){return!(!e?.snapshot||e.isAncestorReference||e.reason===`delete`||e.hasActiveRun!==!0||B(e)!==t)}function Y(e){return JSON.stringify([e.agentId??je(e.key)?.agentId,e.key])}function Or(e){return JSON.stringify([e.sessionId,e.updatedAt,e.lastActivityAt,e.activitySummary?.updatedAt])}var kr,Ar,jr;function Mr(){return(Mr=e((()=>{bt(),w(),Oe(),x(),h(),Sn(),H(),kr=`sessions.activitySummary.ensure`,Ar=20,jr=class{get loading(){return this.requestState!==`idle`||this.incomplete}get retrying(){return this.requestState===`retrying`}constructor(e){this.host=e,this.incomplete=!1,this.requestState=`idle`,this.client=null,this.summaryAttempts=new Map,this.summaryRetries=new Set,this.canEnsureSummaries=!1,this.filters=null,this.pendingChanges=[],this.changesOverflowed=!1,this.currentWorkFences=new Map,this.retirementOverflowed=!1,this.historyRows=ce(),this.historyRevision=0,this.normalizedLocation=``,this.observesPageLifecycle=typeof document<`u`&&typeof globalThis.addEventListener==`function`,this.pageActive=!this.observesPageLifecycle||document.visibilityState!==`hidden`,this.eventRefresh=a({active:this.pageActive,refresh:()=>this.load(this.client,this.filters,`refresh`)}),this.handlePageLifecycle=e=>{let t=e.type===`pagehide`,n=this.pending!==void 0||this.summaryPending!==void 0;this.pageActive=!t&&document.visibilityState!==`hidden`,this.pageActive||this.resetSummaries(),this.eventRefresh.setActive(this.pageActive,t||n)},e.addController(this)}hostConnected(){this.updatePageLifecycleListeners(!0),this.observesPageLifecycle&&this.handlePageLifecycle(new Event(`pageshow`))}hostDisconnected(){this.updatePageLifecycleListeners(!1),this.resetQuery()}resetSummaries(){this.summaryPending?.abort(),this.summaryPending=void 0,this.summaryAttempts.clear(),this.summaryRetries.clear()}applySummaryBatch(e,t,n,r){this.result={...e,sessions:e.sessions.map(e=>{if(!t.includes(e)||r&&!r.has(Y(e)))return e;let i=r?r.get(Y(e)):{...e.activitySummary,state:`unavailable`},a=this.historyRows.inheritRow({...e,activitySummary:i},e);return this.historyRows.observeFields(a,[`activitySummary`],s(++this.historyRevision,null,n),e.agentId),a})}}resetQuery(){clearTimeout(this.bucketRollover),this.bucketRollover=void 0,this.eventRefresh.reset(),this.pending?.controller.abort(),this.pending=void 0,this.resetSummaries(),this.requestState=`idle`,this.incomplete=!1,this.error=void 0,this.client=null,this.queryKey=void 0,this.result=void 0,this.filters=null,this.pendingChanges.length=0,this.changesOverflowed=!1,this.currentWorkFences.clear(),this.retirementOverflowed=!1,this.historyRows.reset(),this.normalizedLocation=``}retrySummary(e){this.canEnsureSummaries&&e.activitySummary?.canEnsure===!0&&this.result?.sessions.includes(e)&&(this.summaryAttempts.delete(Y(e)),this.summaryRetries.add(Y(e)),this.ensureSummaries())}needsSummary(e){let t=Y(e);return e.activitySummary?.canEnsure===!0&&(this.summaryRetries.has(t)||e.activitySummary.state===`stale`)&&this.summaryAttempts.get(t)!==Or(e)}async ensureSummaries(){let e=this.client,t=this.queryKey;if(!e||!this.result||!this.canEnsureSummaries||this.filters===`current`||this.summaryPending)return;if(!this.pageActive){this.eventRefresh.schedule();return}let n=new Set(this.result.sessions.filter(e=>e.activitySummary?.canEnsure===!0).map(Y));for(let e of new Set([...this.summaryAttempts.keys(),...this.summaryRetries]))n.has(e)||(this.summaryAttempts.delete(e),this.summaryRetries.delete(e));let r=this.result.sessions.filter(e=>this.needsSummary(e));if(r.length===0)return;let i=new AbortController;this.summaryPending=i;let a=()=>this.summaryPending===i&&this.client===e&&this.queryKey===t&&this.canEnsureSummaries&&!i.signal.aborted;try{for(let t=0;t<r.length&&a();t+=Ar){let n=new Map(this.result.sessions.map(e=>[Y(e),e])),o=r.slice(t,t+Ar).flatMap(e=>{let t=n.get(Y(e));return t&&t.sessionId===e.sessionId&&this.needsSummary(t)?[t]:[]});if(o.length===0)continue;for(let e of o){let t=Y(e);this.summaryAttempts.set(t,Or(e)),this.summaryRetries.delete(t)}let s=++this.historyRevision;try{let t=await e.request(kr,{sessions:o.map(e=>({key:e.key,...e.agentId?{agentId:e.agentId}:{}}))},{signal:i.signal});if(!a()||!this.result)return;let n=new Map(t.sessions.map(e=>[Y(e),e.activitySummary]));this.applySummaryBatch(this.result,o,s,n)}catch{if(!a()||!this.result)return;this.applySummaryBatch(this.result,o,s,null)}this.host.requestUpdate()}}finally{this.summaryPending===i&&(this.summaryPending=void 0,this.host.requestUpdate(),this.ensureSummaries())}}personLabel(e,t){return this.result?.people?.find(t=>t.identity.id===e)?.label??t.find(t=>t.identity?.id===e)?.name}canonicalLocation(e,t,n){if(!this.filters||this.filters===`current`||!this.filters.personId||!this.result?.involvingProfileId||this.loading)return null;let r=this.result.involvingProfileId,i=Wn(e,r,this.personLabel(r,n),t);if(!i)return this.normalizedLocation=``,null;let a=`${e.pathname}${e.search}${e.hash}`;return this.normalizedLocation===a?null:(this.normalizedLocation=a,i)}locationForFilters(e,t,n,r){let i=Un(e,n,e.personId?this.personLabel(e.personId,r):void 0),a=this.result?.involvingProfileId??(this.filters===`current`?void 0:this.filters?.personId);return e.personId&&e.personId===a&&(i.pathname=qe(t.pathname,n)?t.pathname:$e(e.personId,n,this.personLabel(e.personId,r),32).pathname),i}updatePageLifecycleListeners(e){if(!this.observesPageLifecycle)return;let t=e?`addEventListener`:`removeEventListener`;document[t](`visibilitychange`,this.handlePageLifecycle),globalThis[t](`pagehide`,this.handlePageLifecycle),globalThis[t](`pageshow`,this.handlePageLifecycle)}invalidate(e){if(this.client&&this.filters){let t=this.filters===`current`?vn(e):[_n(e)].filter(e=>e!==null);if(t.length){let e=this.filters!==`current`||!this.pending;if(this.result){let n=this.filters===`current`?this.reconcileCurrentWork(this.result,t):!this.filters.personId&&!this.filters.query?qn(this.result,t,this.historyRows,++this.historyRevision):void 0;n&&(this.result=n.result,e=n.requiresRefresh,this.incomplete||=this.filters===`current`&&e,this.host.requestUpdate())}if(this.pending&&this.filters===`current`)for(let e of t){if(e.snapshot){let t=B(e);if(this.pendingChanges.some(n=>B(n)===t&&yn(e,n)))continue;if(Dr(e,t)&&Dr(this.pendingChanges.at(-1),t)&&Dr(this.pendingChanges.at(-2),t)){this.pendingChanges[this.pendingChanges.length-1]=e;continue}}this.pendingChanges.length<1e3?this.pendingChanges.push(e):this.changesOverflowed=!0}if(!e&&!this.incomplete&&!this.changesOverflowed){this.eventRefresh.scheduleFallback();return}}this.eventRefresh.schedule()}}reconcileCurrentWork(e,t,n=!1){let r=bn(e,t,this.currentWorkFences,this.retirementOverflowed,n);return this.retirementOverflowed=r.retirementOverflowed,r}load(e,t,n=`query`,r=this.canEnsureSummaries){if(this.canEnsureSummaries=r,r||this.resetSummaries(),!e||!t)return this.resetQuery(),this.host.requestUpdate(),Promise.resolve();let i=new Date,a=t===`current`?void 0:Er(t.time,i.getTime());if(clearTimeout(this.bucketRollover),this.bucketRollover=void 0,a&&typeof setTimeout==`function`){let e=new Date(i.getFullYear(),i.getMonth(),i.getDate()+1).getTime(),t=Math.min(a.at(-1),e);this.bucketRollover=setTimeout(()=>this.eventRefresh.schedule(),t-i.getTime()+1e3)}let o={source:`activity`,excludeDock:!0,rowMode:`compact`,archived:`all`,includeGlobal:!0,includeUnknown:!0,includeDerivedTitles:!0,limit:100,...t===`current`?{activeOnly:!0}:{includePeople:!0,activityPulseBoundaries:a,excludeSubagents:!0,includeActivitySummary:!0,sortBy:`activity`,...t.personId?{involvingProfileId:t.personId}:{},...t.query?{search:t.query}:{},...t.time===`all`?{}:{activeMinutes:t.time===`24h`?1440:t.time===`7d`?10080:43200}}},s=JSON.stringify(o),c=this.client===e&&this.queryKey===s;if(c&&this.pending&&n!==`retry`)return n===`refresh`&&this.eventRefresh.schedule(),this.pending.completion.promise;if(n===`query`&&c)return this.ensureSummaries(),Promise.resolve();this.pending?.controller.abort(),this.eventRefresh.absorb();let l={controller:new AbortController,completion:Ot()};this.pending=l,this.client=e,this.queryKey=s,this.filters=t,this.pendingChanges.length=0,this.changesOverflowed=!1,this.requestState=n===`retry`?`retrying`:`loading`,this.error=void 0,c||(this.currentWorkFences.clear(),this.retirementOverflowed=!1,this.historyRows.reset(),this.resetSummaries(),this.result=void 0,this.incomplete=!1);let u=++this.historyRevision;return this.host.requestUpdate(),e.request(`sessions.list`,o,{signal:l.controller.signal}).then(e=>{if(this.pending===l){if(t===`current`){this.changesOverflowed||(this.retirementOverflowed=!1);let t=this.reconcileCurrentWork(e,this.pendingChanges,!0);this.incomplete=this.changesOverflowed||t.requiresRefresh,this.incomplete&&this.eventRefresh.schedule(),!this.changesOverflowed&&t.canPublish&&(this.result=t.result)}else{let t=Kn(e,this.result,this.historyRows,u);t.requiresRefresh&&this.eventRefresh.schedule(),this.result=t.result,this.ensureSummaries()}}}).catch(e=>{this.pending===l&&!l.controller.signal.aborted&&(t===`current`&&(this.result=void 0,this.incomplete=!1),this.error=e instanceof Error?e.message:String(e))}).finally(()=>{this.pending===l&&(this.pending=void 0,this.pendingChanges.length=0,this.requestState=`idle`,this.host.requestUpdate()),l.completion.resolve()}),l.completion.promise}}})))()}function Nr(e){let t=Dt(e);if(t?.found!==!0)return{status:`absent`};let n=Dt(t.attribution),r=M(n?.text),i=M(n?.url),a=M(t.city),o=M(t.region),s=M(t.country),c={...a?{city:a}:{},...o?{region:o}:{},...s?{country:s}:{},...r&&i?{attribution:{text:r,url:i}}:{}};return Object.keys(c).length>0?{status:`located`,location:c}:{status:`absent`}}async function Pr(e){let{origin:t}=de();try{let n=await g(`${t??``}/plugins/geolocation/lookup?ip=${encodeURIComponent(e)}`,Ir);return n.ok?Nr(await n.json()):{status:`unavailable`}}catch{return{status:`unavailable`}}}function Fr(e){let t=X.get(e);if(t)return t;let n=Pr(e).then(t=>(t.status===`unavailable`&&X.get(e)===n&&X.delete(e),t));return yt(X,255),X.set(e,n),n}var Ir,X;function Lr(){return(Lr=e((()=>{ne(),Ir=15e3,X=new Map,Ne(()=>X.clear())})))()}var Rr,zr;function Br(){return(Br=e((()=>{O(),rt(),Lr(),y(),C(),Rr=[5e3,15e3,45e3],zr=class extends r{constructor(...e){super(...e),this.location=null,this.generation=0,this.retryAttempt=0}connectedCallback(){super.connectedCallback(),this.requestUpdate()}disconnectedCallback(){super.disconnectedCallback(),this.clearRetry(),this.generation+=1,this.requestedIp=void 0,this.location=null}willUpdate(){let e=this.ip?.trim();this.isConnected&&e!==this.requestedIp&&(this.clearRetry(),this.generation+=1,this.requestedIp=e,this.retryAttempt=0,this.location=null,e&&this.resolve(e))}clearRetry(){this.retryTimer!==void 0&&(clearTimeout(this.retryTimer),this.retryTimer=void 0)}resolve(e){let t=this.generation,n=()=>this.isConnected&&this.requestedIp===e&&this.generation===t;Fr(e).then(t=>{if(!n())return;if(t.status===`located`){this.location=t.location;return}if(t.status===`absent`)return;let r=Rr[this.retryAttempt];r!==void 0&&(this.retryAttempt+=1,this.retryTimer=setTimeout(()=>{this.retryTimer=void 0,n()&&this.resolve(e)},r))})}render(){let e=[this.location?.city,this.location?.region??this.location?.country].filter(Boolean).join(`, `);if(!e)return E;let t=this.location?.attribution;return D`<span class="activity-feed__device-location"
      >${e}${t?D`<a
              class="activity-feed__device-attribution"
              href=${t.url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label=${t.text}
              title=${t.text}
              >${T.info}</a
            >`:E}</span
    >`}},I([k({attribute:!1})],zr.prototype,`ip`,void 0),I([j()],zr.prototype,`location`,void 0),globalThis.customElements&&(customElements.get(`zero-ip-location`)||customElements.define(`zero-ip-location`,zr))})))()}function Vr(e){return D`${e.additions===void 0?E:D`<span class="activity-feed__additions">+${e.additions.toLocaleString()}</span>`}${e.deletions===void 0?E:D`<span class="activity-feed__deletions">−${e.deletions.toLocaleString()}</span>`}`}function Hr(e){return{url:e.url,title:e.title,subtitle:e.owner+`/`+e.repo+` #`+e.number,badge:{label:S(`activity.git.`+e.state),tone:e.state===`merged`?`accent`:e.state===`open`?`positive`:e.state===`closed`?`negative`:`neutral`},author:e.author?.login,authorUrl:e.author?.login?`https://github.com/`+encodeURIComponent(e.author.login):void 0,metadata:[...e.additions===void 0?[]:[{label:``,value:`+`+e.additions,tone:`positive`}],...e.deletions===void 0?[]:[{label:``,value:`−`+e.deletions,tone:`negative`}]]}}function Ur(e){let t={open:T.gitPullRequest,draft:T.gitPullRequestDraft,merged:T.gitMerge,closed:T.gitPullRequestClosed}[e.state];return D`<a
    class="activity-feed__pr"
    data-state=${e.state}
    href=${e.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label=${S(`activity.git.pullRequest`,{repository:`${e.owner}/${e.repo}`,number:String(e.number),title:e.title,state:S(`activity.git.${e.state}`)})}
  >
    <span class="activity-feed__git-icon" aria-hidden="true">${t}</span>
    <span class="activity-feed__git-label">${e.repo}#${e.number}</span>
    ${Vr(e)}
  </a>`}var Z;function Wr(){return(Wr=e((()=>{O(),rt(),ze(),He(),C(),b(),z(),qt(),y(),v(),R(),Z=class extends Te{constructor(...e){super(...e),this.sessionKey=``,this.agentId=``,this.subscriptions=new p(this).effect(()=>this.context?.gateway,e=>{let t=on(e),n=t.subscribe(()=>this.requestUpdate()),r=e.subscribe(()=>this.requestUpdate());return()=>{t.unwatch(this),n(),r()}})}willUpdate(){this.isConnected&&on(this.context.gateway).watch(this,[this.sessionKey],{foreground:!0})}disconnectedCallback(){this.subscriptions.clear(),super.disconnectedCallback()}render(){let e=this.context.gateway,t=on(e).get(this.sessionKey);if(!t)return E;let n=t.pullRequests.some(e=>e.state===`open`||e.state===`draft`)?void 0:t.branch;if(!n&&t.pullRequests.length===0)return E;let r=t.status!==`ready`||e.snapshot.phase!==`connected`;return D`<zero-link-reader-hovercard-provider
      .client=${e.snapshot.phase===`connected`?e.snapshot.client:null}
      .readers=${Be(e.snapshot)}
      .agentId=${this.agentId}
      .previewSeeds=${t.pullRequests.map(Hr)}
    >
      <div class="activity-feed__git">
        ${n?D`<span
                class="activity-feed__branch"
                title=${S(`activity.git.branchDiff`,{branch:n.branch})}
              >
                <span class="activity-feed__git-icon" aria-hidden="true">${T.gitBranch}</span>
                <span class="activity-feed__git-label">${n.branch}</span>
                ${Vr(n)}
              </span>`:E}
        ${t.pullRequests.map(Ur)}
        ${r?D`<span
                class="activity-feed__git-stale"
                role="img"
                aria-label=${S(`activity.git.stale`)}
                title=${S(`activity.git.stale`)}
                >${T.alertTriangle}</span
              >`:E}
      </div>
    </zero-link-reader-hovercard-provider>`}},I([k({attribute:!1})],Z.prototype,`context`,void 0),I([k()],Z.prototype,`sessionKey`,void 0),I([k()],Z.prototype,`agentId`,void 0),customElements.get(`zero-activity-session-git`)||customElements.define(`zero-activity-session-git`,Z)})))()}function Gr(e,t){let n=qr.get(e);return(!n||n.hello!==t)&&(n={hello:t,epoch:++Jr,entries:new Map,running:0,queue:[]},qr.set(e,n)),n}async function Kr(e,t,n){if(e.running>=2){let n=await new Promise(n=>{let r=e.queue.findIndex(e=>e.key===t),i=e.queue[r];i?(e.queue[r]={key:t,admit:n},i.admit(`superseded`)):e.queue.length<128?e.queue.push({key:t,admit:n}):n(`full`)});if(n!==`run`)return n}else e.running++;try{return await n(),`run`}finally{let t=e.queue.shift();t?t.admit(`run`):e.running--}}var qr,Jr,Q;function Yr(){return(Yr=e((()=>{O(),rt(),mn(),We(),b(),z(),y(),v(),Wt(),tn(),Kt(),R(),qr=new WeakMap,Jr=0,Q=class extends Te{constructor(...e){super(...e),this.sessionKey=``,this.agentId=``,this.revision=0,this.visible=!1,this.displayedImages=[],this.key=``,this.boundImageIdentity=``,this.lightbox=null,this.imageRequest=0,this.refresh=()=>this.requestUpdate(),this.subscriptions=new p(this).watchStore(()=>this.context?.gateway),this.closeImage=()=>{this.imageRequest++,this.lightbox?.release?.(),this.lightbox=null,this.requestUpdate()},this.load=(e=this.entry)=>{let t=this.context.gateway,{client:n,hello:r}=t.snapshot,i=this.owner,a=this.imageIdentity,o=this.sessionKey,s=this.agentId;if(!n||!i||!e||e.pending)return;let c=()=>this.isConnected&&this.visible&&this.owner===i&&this.imageIdentity===a&&(this.entry===e||this.settledEntry===e)&&t.snapshot.client===n&&t.snapshot.hello===r&&t.snapshot.phase===`connected`;e.error&&(e.cursor=void 0,e.images=[]),e.error=!1,e.pending=Kr(i,JSON.stringify([s,o,e===this.settledEntry]),async()=>{try{for(let t=0;t<3&&e.images.length<4&&c();t++){let t=await n.request(`artifacts.list`,{sessionKey:o,agentId:s,type:`image`,limit:4-e.images.length,...e.cursor?{cursor:e.cursor}:{}});if(!c())return;e.loaded=!0,e.cursor=t.nextCursor,e.omitted||=t.omittedOversized;for(let n of t.artifacts){let t=n.image?.url?{url:n.image.url,artifactId:n.source===`session-transcript-preview`?void 0:n.id,alt:n.title}:n.type===`image`&&n.download.mode!==`unsupported`?{artifactId:n.id,alt:n.title}:void 0;t&&!e.images.some(e=>(e.url??e.artifactId)===(t.url??t.artifactId))&&e.images.push(t)}if(!e.cursor)break}}catch{c()&&(e.loaded=!0,e.error=!0)}}).then(t=>{t!==`run`&&c()&&(e.loaded=!0,e.error=t===`full`)}).finally(()=>{e.pending=void 0,this.requestUpdate()}),this.requestUpdate()}}connectedCallback(){super.connectedCallback(),typeof IntersectionObserver<`u`&&(this.observer=new IntersectionObserver(e=>{this.visible=e.some(e=>e.isIntersecting),this.requestUpdate()},{rootMargin:`200px`}),this.observer.observe(this))}disconnectedCallback(){this.observer?.disconnect(),this.visible=!1,this.subscriptions.clear(),this.closeImage(),Gt(this.refresh),super.disconnectedCallback()}get imageIdentity(){return JSON.stringify([this.agentId,this.sessionKey,this.session?.sessionId,Yt(this.session)])}willUpdate(){let{client:e,hello:t,phase:n}=this.context.gateway.snapshot,r=e&&n===`connected`?Gr(e,t):void 0,i=this.imageIdentity,a=JSON.stringify([i,this.revision]);if((r!==this.owner||i!==this.boundImageIdentity)&&(this.settledEntry=void 0,this.displayedImages=[],this.closeImage(),Gt(this.refresh),this.boundImageIdentity=i),(r!==this.owner||a!==this.key)&&(this.owner=r,this.key=a,this.entry=void 0,r&&(this.entry=r.entries.get(a),!this.entry&&(this.entry={images:[],loaded:!1},r.entries.set(a,this.entry),r.entries.size>128)))){let e=r.entries.keys().next().value;e&&r.entries.delete(e)}this.visible&&this.entry&&!this.entry.loaded&&!this.entry.pending&&this.load(),this.entry?.pending&&this.observedPending!==this.entry.pending&&(this.observedPending=this.entry.pending,this.observedPending.then(this.refresh)),this.entry?.loaded&&!this.entry.pending&&(this.settledEntry=this.entry);let o=this.settledEntry;o&&!o.pending&&(!o.error||this.displayedImages.length===0)&&(this.displayedImages=o.images.slice(0,4))}render(){let e=this.settledEntry??this.entry,t=this.owner,n=this.context.gateway,{client:r,hello:i}=n.snapshot;if(!e||!t||!r)return E;let a=()=>n.snapshot.client===r&&n.snapshot.hello===i&&n.snapshot.phase===`connected`,o=t=>D`<button
      class="activity-feed__note-action"
      ?disabled=${!!e.pending}
      @click=${()=>this.load(e)}
    >
      ${t}
    </button>`,s=this.displayedImages.length>0,c=e.cursor&&e.images.length<4&&!e.error?[o(S(e.pending?`common.loading`:`activity.images.older`))]:[],l=!!(e.error||e.omitted)||!s&&!!e.cursor,u=D`${e.omitted?D`<span>${S(`activity.images.incomplete`)}</span>`:E}${e.error?D`<span role="status">${S(`activity.images.failed`)}</span
            >${o(S(`common.retry`))}`:s?E:c}`,d=this.imageIdentity,f=this.agentId;return D`
      ${s||l?D`<div class="activity-feed__media">
              ${s?nn(this.displayedImages,{sessionKey:this.sessionKey,agentId:this.agentId,connectionEpoch:t.epoch,policyKey:Yt(this.session),resourceBasePath:this.context.resourceBasePath,authToken:Ge({hello:i,settings:{token:n.connection.token},password:n.connection.password}),onRequestUpdate:this.refresh,onRequestOpenImage:()=>++this.imageRequest,onOpenImage:(e,n)=>{if(!this.isConnected||this.owner!==t||this.imageIdentity!==d||!a()||n!==this.imageRequest){e.release?.();return}this.lightbox?.release?.(),this.lightbox=e,this.requestUpdate()},resolveArtifactDownload:(e,t)=>hn({get client(){return n.snapshot.client},get connected(){return a()},resourceBasePath:this.context.resourceBasePath},{...e,agentId:f},t)},c):E}
              ${l?D`<div class="activity-feed__note">${u}</div>`:E}
            </div>`:E}
      ${an(this.lightbox,this.closeImage)}
    `}},I([k({attribute:!1})],Q.prototype,`context`,void 0),I([k()],Q.prototype,`sessionKey`,void 0),I([k()],Q.prototype,`agentId`,void 0),I([k({type:Number})],Q.prototype,`revision`,void 0),I([k({attribute:!1})],Q.prototype,`session`,void 0),customElements.get(`zero-activity-session-media`)||customElements.define(`zero-activity-session-media`,Q)})))()}function Xr(e,t,n){let r=new Intl.DateTimeFormat(void 0,{"24h":{hour:`numeric`},"7d":{month:`short`,day:`numeric`},"30d":{month:`short`,day:`numeric`},all:{month:`short`}}[t]),i=n=>r.format(Tr(t,e.since,n)),a=S(V[t]),o=Math.max(...e.buckets),s=e.buckets.length>12?4:2,c=new Set(Array.from({length:s+1},(t,n)=>Math.round(n*(e.buckets.length-1)/s))),l=[[`sessions`,e.sessions],[`started`,e.started],[`people`,e.people],[`running`,e.running]];return D`<section class="activity-pulse">
    <div class="activity-pulse__header">
      <div class="activity-pulse__heading">${T.activity}<strong>${a}</strong></div>
      <div class="activity-pulse__stats">
        ${l.filter(([,e])=>e!==void 0).map(([t,r],i)=>D`
              ${i?` · `:E}<span
                title=${t===`people`&&n.peopleIncomplete?S(`activityFeed.partialHistory`):E}
                >${t===`running`&&e.running>0?D`<i class="activity-pulse__running" aria-hidden="true"></i>`:E}<b
                  >${t===`people`&&n.peopleIncomplete?`${r}+`:r}</b
                >
                ${S(`activity.pulse.${t}`)}</span
              >
            `)}
      </div>
    </div>
    <div
      class="activity-pulse__bars"
      role="img"
      aria-label=${S(`activity.pulse.description`,{window:a,count:String(e.sessions),period:i(e.buckets.indexOf(o))})}
    >
      ${e.buckets.map((t,n)=>D`<span
          class="activity-pulse__bar"
          data-bucket=${n===e.buckets.length-1?`current`:`past`}
          style=${`height: max(2px, ${o>0?t/o*100:0}%)`}
          title=${S(`activity.pulse.bucket`,{period:i(n),count:String(t)})}
        ></span>`)}
    </div>
    <div class="activity-pulse__axis" aria-hidden="true">
      ${e.buckets.map((e,t)=>D`<span>${c.has(t)?D`<span>${i(t)}</span>`:E}</span>`)}
    </div>
  </section>`}function Zr(){return(Zr=e((()=>{O(),C(),b(),z(),H(),R()})))()}function Qr(e,t){let n=e.activitySummary,r=n?.state===`current`&&!n.text?`missing`:n?.state??`missing`,i=r===`updating`,a=r===`stale`?S(n?.text?`activityFeed.recapStale`:`activityFeed.recapMissing`):r===`unavailable`?S(n?.text?`activityFeed.recapRefreshFailed`:`activityFeed.recapUnavailable`):r===`missing`?S(`activityFeed.recapMissing`):``;return D`<div
    class="activity-feed__recap"
    data-activity-recap=${e.key}
    data-state=${r}
    role="group"
    aria-busy=${String(i)}
    aria-label=${S(`activityFeed.recap`)}
    title=${n?.updatedAt?S(`activityFeed.recapUpdated`,{time:Ae(n.updatedAt,{fallback:``})}):E}
  >
    ${n?.text?D`<p class="activity-feed__recap-text">${n.text}</p>`:i?D`<div class="activity-feed__recap-skeleton" aria-hidden="true">
              <div class="skeleton skeleton-line skeleton-line--long"></div>
              <div class="skeleton skeleton-line skeleton-line--medium"></div>
            </div>`:E}
    ${i?D`<span class="sr-only" role="status">${S(`activityFeed.recapUpdating`)}</span>`:E}
    ${a?D`<div class="activity-feed__note">
            <span>${a}</span>
            ${t&&n?.canEnsure===!0&&(r===`unavailable`||r===`stale`)?D`<button class="activity-feed__note-action" @click=${()=>t(e)}>
                    ${S(`activityFeed.recapRetry`)}
                  </button>`:E}
          </div>`:E}
  </div>`}function $r(){return($r=e((()=>{O(),b(),he()})))()}function ei(e){return!e.name&&!e.email&&Qt(e)===e.id}function ti(e){return ei(e)&&e.id.length>8?`${e.id.slice(0,8)}…`:Qt(e)}function ni(e,t=!1){return!e||ei(e)?D`<span
      class="viewer-avatar viewer-avatar--overflow activity-feed__unknown-avatar"
      aria-hidden="true"
      >${T.users}</span
    >`:D`<span class="activity-feed__person-avatar">
    <zero-viewer-avatar
      .identity=${{type:`profile`,id:e.id}}
      .user=${e}
      .markAsViewer=${!1}
      variant="footer"
    ></zero-viewer-avatar>
    ${t&&(e.entries?.length??0)>0?D`<span
            class="activity-feed__presence-dot"
            data-presence-activity=${Zt(e)}
            role="img"
            aria-label=${Xt(Zt(e))}
          ></span>`:E}
  </span>`}function ri(e,t,n){e.currentTarget instanceof Element&&e.currentTarget.closest(`wa-popover`)?.removeAttribute(`open`),t.onFiltersChange({...t.filters,personId:n})}function ii(e,t){e.currentTarget instanceof Element&&e.currentTarget.parentElement?.querySelector(`.activity-feed__people-trigger`)?.setAttribute(`aria-expanded`,String(t))}function ai(e,t,n=e?.count){let r=e?.id??null;return D`<button
    type="button"
    class="session-menu__item activity-feed__people-row"
    data-activity-person=${r??``}
    aria-pressed=${String(t.filters.personId===r)}
    @click=${e=>ri(e,t,r)}
  >
    ${ni(e,!0)}
    <span class="activity-feed__people-copy">
      <span class="activity-feed__people-name"
        >${e?ti(e):S(`activityFeed.everyone`)}</span
      >
    </span>
    <span class="activity-feed__people-count">${n}</span>
  </button>`}function oi(e,t,n,r){let i=t.slice(0,3),a=t.length-i.length,o=t.filter(e=>!ei(e)),s=t.filter(ei);return D`<div class="activity-feed__people-control">
    <button
      id="activity-feed-people-trigger"
      type="button"
      class="btn btn--sm activity-feed__people-trigger"
      aria-label=${S(`activityFeed.peopleButtonLabel`)}
      aria-haspopup="dialog"
      aria-expanded="false"
    >
      ${n?D`${ni(n)}<span class="activity-feed__selected-person"
                >${ti(n)}</span
              >`:D`<span class="activity-feed__facepile" aria-hidden="true">
              ${i.length>0?i.map(e=>ni(e)):D`<span
                      class="viewer-avatar viewer-avatar--overflow activity-feed__unknown-avatar"
                      >${T.users}</span
                    >`}
              ${a>0?D`<span class="viewer-avatar viewer-avatar--overflow">+${a}</span>`:E}
            </span>`}
    </button>
    ${n?D`<button
            type="button"
            class="btn btn--sm activity-feed__people-clear"
            aria-label=${S(`activityFeed.clearPersonFilter`)}
            @click=${()=>e.onFiltersChange({...e.filters,personId:null})}
          >
            ${T.x}
          </button>`:E}
    <wa-popover
      ${st(Ut)}
      class="activity-feed__people-popover"
      for="activity-feed-people-trigger"
      aria-label=${S(`activityFeed.peopleButtonLabel`)}
      placement="bottom-end"
      without-arrow
      @wa-show=${e=>ii(e,!0)}
      @wa-hide=${e=>ii(e,!1)}
    >
      <div class="activity-feed__people-panel">
        ${ai(null,e,r)}
        ${o.map(t=>ai(t,e))}
        ${s.length>0?D`<div class="session-menu__separator" role="separator"></div>
                <div class="activity-feed__people-group-label">
                  ${S(`activityFeed.unresolvedIdentities`)}
                </div>
                <div data-activity-unresolved>
                  ${s.map(t=>ai(t,e))}
                </div>`:E}
        ${e.result?.peopleIncomplete?D`<p class="activity-feed__footer" role="status">${S(`activityFeed.partialHistory`)}</p>`:E}
      </div>
    </wa-popover>
  </div>`}function si(e,t=Date.now()){if(e===null)return S(`activityFeed.unknownDate`);let n=new Date(t),r=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),i=new Date(r);return i.setDate(i.getDate()-1),e===r?S(`activityFeed.today`):e===i.getTime()?S(`activityFeed.yesterday`):new Intl.DateTimeFormat(void 0,{day:`numeric`,month:`long`,year:`numeric`}).format(e)}function ci(e,t,n){let r=je(t.key)?.agentId??t.agentId??De(e),i={agentsList:e.agents.state.agentsList,hello:e.gateway.snapshot.hello},a=_(t),o=c(t.key,oe(i))?ye({face:a,sessionKey:t.key,fallbackAgentId:t.key===`global`?r:De(e),basePath:e.basePath,row:t,mainKey:me(i)}):null,s=o?A`a`:A`div`,l=Jn(t),u=Qt(l),d=N(t),p=t.observerDigest?.runId,m=t.hasActiveRun===!0&&p&&t.activeRunIds?.includes(p)?p:void 0,h=m?t.observerDigest?.headline.trim():``,g=t.channel?S(`activityFeed.channelLabel`,{value:t.channel}):null,ee=t.kind!==`global`||!!t.agentId,v=t.createdVia===`cron`?S(`activityFeed.automation`):null;return ot`<div
    class="activity-feed__session-row${o?` activity-feed__session-row--link`:``}"
  >
    <${s}
      class="activity-feed__session"
      data-activity-session=${t.key}
      href=${o?.href??E}
      @click=${t=>{o&&f(t)&&(t.preventDefault(),e.navigate(a,o.options))}}
    >
      <span class="activity-feed__session-avatar">
        ${t.hasActiveRun===!0?D`<span
                class="activity-feed__presence-dot activity-feed__run-dot"
                aria-hidden="true"
              ></span>`:E}
        <zero-viewer-avatar
          .identity=${t.owner?.actor.identity??t.createdActor?.identity}
          .user=${l}
          .markAsViewer=${!1}
          variant="footer"
        ></zero-viewer-avatar>
      </span>
      <span class="activity-feed__session-main">
        <span class="activity-feed__session-title">${Se(t.key,t)}</span>
        <span class="activity-feed__session-meta">
          ${h?D`<span
                  class="activity-feed__session-headline"
                  data-health=${t.observerDigest?.health??E}
                  >${h}</span
                >`:D`<span>${u}</span>`}${v?D`<span class="activity-feed__session-source" data-activity-created-via="cron"
                  >· ${v}${g||ee?` ·`:``}</span
                >`:E}${ee?D`<span class="activity-feed__session-scope"
                  >${Ft(r)}</span
                >`:E}${g?D`<span class="activity-feed__session-scope">${g}</span>`:E}
        </span>
      </span>
      <span class="activity-feed__session-time">
        ${h?D`<span class="activity-feed__session-owner">${u}</span>`:E}
        ${d>0?D`<span>${Ae(d,{fallback:``})}</span>`:E}
      </span>
    </${s}>
    ${Qr(t,n)}
    <zero-activity-session-git
      .context=${e}
      .sessionKey=${le(t.key,r)}
      .agentId=${r}
    ></zero-activity-session-git>
    <zero-activity-session-media
      .context=${e}
      .sessionKey=${le(t.key,r)}
      .agentId=${r}
      .revision=${t.updatedAt??0}
      .session=${t}
    ></zero-activity-session-media>
    ${m?D`<a
            class="activity-feed__inspect-run"
            href=${tr(m,e.basePath)}
            >${S(`activityFeed.inspectRun`)}</a
          >`:E}
  </div>`}function li(e,t){let n=t=>ci(e.context,t,e.onSummaryRetry),r=e.filters.query||e.filters.personId?[]:t.sessions.filter(e=>e.hasAutomation===!0);if(r.length<2)return t.sessions.map(n);let i=e.expandedAutomationDays.has(t.key);return D`
    ${t.sessions.filter(e=>e.hasAutomation!==!0).map(n)}
    <button
      type="button"
      class="activity-feed__session activity-feed__automation-group"
      data-activity-automation-group=${t.key}
      aria-expanded=${String(i)}
      @click=${()=>e.onAutomationDayToggle(t.key)}
    >
      <span class="activity-feed__automation-group-icon" aria-hidden="true">${T.clock}</span>
      <span>${S(`activityFeed.automationGroup`,{count:String(r.length)})}</span>
      <span class="activity-feed__automation-group-chevron" aria-hidden="true"
        >${T.chevronRight}</span
      >
    </button>
    ${i?r.map(n):E}
  `}function ui(e,t,n){let r=(t.entries?.length??0)>0,a=Zt(t),o=r?Xt(a):S(`activityFeed.offline`),s=t.entries??[],c=fn(s),l=Zn(t,n);return D`
    <section class="activity-feed__identity" data-activity-identity=${t.id}>
      <div class="activity-feed__identity-main">
        <zero-viewer-avatar
          .identity=${{type:`profile`,id:t.id}}
          .user=${t}
          .markAsViewer=${!1}
          variant="profile"
        ></zero-viewer-avatar>
        <div class="activity-feed__identity-copy">
          <h2>${Qt(t)}</h2>
          ${t.email?D`<p>${t.email}</p>`:E}
        </div>
        ${Pt({kind:r&&a!==`unknown`?a===`idle`?`warn`:`ok`:`muted`,label:o})}
      </div>
      ${c.length?D`<div class="activity-feed__connection-summary">${c.map(e=>D`<span>${e}</span>`)}</div>`:E}
      <div class="activity-feed__viewing">
        <h3>${S(`activityFeed.viewingNow`)}</h3>
        ${l.length>0?D`<div class="activity-feed__viewing-list">
                ${l.map(t=>ci(e,t))}
              </div>`:D`<p class="activity-feed__empty-note">${S(`activityFeed.notViewing`)}</p>`}
      </div>
      ${s.length?D`<details class="activity-feed__connection-details">
              <summary>
                ${S(`activityFeed.connectionDetails`,{count:String(s.length)})}
              </summary>
              <div class="activity-feed__connections">
                ${pn(s).map(({description:e,entry:t,count:n})=>D`<div class="activity-feed__connection">
                    <strong
                      >${e||t.host||S(`activityFeed.unknownConnection`)}</strong
                    >
                    <span
                      >${S(n===1?`activityFeed.connectionOne`:`activityFeed.connectionMany`,{count:String(n)})}</span
                    >
                    <span
                      >${[t.host,t.platform,t.ip,t.timeZone].filter(Boolean).join(` · `)}</span
                    >
                    ${t.ip?D`<zero-ip-location .ip=${t.ip}></zero-ip-location>`:E}
                    ${t.lastInputSeconds===void 0?E:D`<span>${S(`activityFeed.lastInput`,{time:i(t.lastInputSeconds*1e3,{suffix:!1})})}</span>`}
                  </div>`)}
              </div>
            </details>`:E}
    </section>
  `}function di(){return D`<section class="activity-feed__loading" aria-busy="true">
    <span class="sr-only" role="status">${S(`common.loading`)}</span>
    <div class="skeleton activity-pulse activity-pulse--loading" aria-hidden="true"></div>
    <div class="activity-feed__sessions" aria-hidden="true">
      ${Array.from({length:4},()=>D`
          <div class="activity-feed__session-row">
            <div class="activity-feed__session">
              <span class="skeleton activity-feed__loading-avatar"></span>
              <div class="activity-feed__session-main">
                <div class="skeleton skeleton-line skeleton-line--medium"></div>
                <div class="skeleton skeleton-line activity-feed__loading-meta"></div>
              </div>
            </div>
            <div class="activity-feed__recap activity-feed__recap-skeleton">
              <div class="skeleton skeleton-line skeleton-line--long"></div>
              <div class="skeleton skeleton-line skeleton-line--medium"></div>
            </div>
          </div>
        `)}
    </div>
  </section>`}function fi(e){let t=Xn(e.result),n=new Map(e.presenceViewers.flatMap(e=>e.identity?[[e.identity.id,e]]:[])),r=e.filters.personId?n.get(e.filters.personId)??t.people.find(t=>t.id===e.filters.personId)??null:null,i=t.people.map(e=>{let t=n.get(e.id);return t?{...e,...t,count:e.count}:e}),a=e.filters.personId?i.find(t=>t.id===e.filters.personId)??r:null;return D`
    <div class="activity-feed">
      <div class="activity-feed__toolbar">
        <label class="data-table-search activity-feed__search">
          ${T.search}
          <input
            type="search"
            aria-label=${S(`activityFeed.searchPlaceholder`)}
            .value=${e.filters.query}
            placeholder=${S(`activityFeed.searchPlaceholder`)}
            @input=${t=>{t.currentTarget instanceof HTMLInputElement&&e.onFiltersChange({...e.filters,query:t.currentTarget.value})}}
          />
        </label>
        ${Nt({mode:`buttons`,className:`activity-feed__time-filter`,value:e.filters.time,ariaLabel:S(`activityFeed.time`),options:Qn.map(e=>({value:e,label:S(V[e]),ariaLabel:S(V[e]),compactLabel:e===`all`?S(V[e]):e})),onChange:t=>e.onFiltersChange({...e.filters,time:t}),onReselect:t=>e.onFiltersChange({...e.filters,time:t})})}
        ${oi(e,i,a,t.timeCount)}
      </div>
      <div class="activity-feed__feedback">
        <span role=${e.error?`alert`:`status`} title=${e.error??E}>
          ${e.error??(e.retrying?S(`common.refreshing`):E)}
        </span>
        ${e.error||e.retrying?D`<button class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRetry}>
                ${S(`common.retry`)}
              </button>`:E}
      </div>
      <div class="activity-feed__main">
        ${e.loading&&!e.result?di():E}
        ${e.result?.activityPulse?Xr(e.result.activityPulse,e.filters.time,{peopleIncomplete:e.result.peopleIncomplete}):E}
        ${e.result&&e.filters.personId?r?ct(r.id,ui(e.context,r,t.sessions)):D`<section class="activity-feed__not-found" role="status">
                  <h2>${S(`activityFeed.notFoundTitle`)}</h2>
                  <p>${S(`activityFeed.notFoundDescription`)}</p>
                </section>`:E}
        ${e.result&&(!e.filters.personId||r)?D`
                ${t.days.length>0?t.days.map(t=>D`<section class="activity-feed__day">
                          <h3>${si(t.timestamp)}</h3>
                          <div class="activity-feed__sessions">
                            ${li(e,t)}
                          </div>
                        </section>`):D`<section class="activity-feed__empty" role="status">
                        ${S(`activityFeed.noSessions`)}
                      </section>`}
                ${t.matchedCount>t.sessions.length?D`<p class="activity-feed__footer">${S(`activityFeed.showing`,{shown:String(t.sessions.length),total:String(t.matchedCount)})}</p>`:E}
              `:E}
      </div>
    </div>
  `}function pi(){return(pi=e((()=>{O(),it(),nt(),at(),vt(),Vt(),C(),Br(),Mt(),jt(),It(),b(),he(),dn(),rn(),Ee(),ge(),x(),Wr(),Yr(),W(),Zr(),$r(),H()})))()}function mi(e){return!Number.isFinite(e)||e<0?S(`common.na`):mt(e)??`0ms`}function hi(e){return e===1?S(`activity.argumentHiddenOne`):S(`activity.argumentsHidden`,{count:String(e)})}function gi(e){return e.entryKind===`answer_candidate`?S(`activity.answerCandidate.${e.candidateStatus??`candidate`}`):hi(e.hiddenArgumentCount)}function _i(e){return e.entryKind===`answer_candidate`?S(`activity.answerCandidate.title`):e.toolName}function vi(e,t){return!t||Tt([e.toolName,_i(e),e.candidateStatus,e.status,e.summary,gi(e),e.outputPreview,e.runId,e.toolCallId,e.sessionKey].filter(Boolean).join(` `)).includes(t)}function yi(e,t){return D`
    <label class="activity-status-filter">
      <input
        type="checkbox"
        .checked=${e.statusFilters[t]}
        @change=${n=>e.onStatusToggle(t,n.target.checked)}
      />
      <span>${S(`activity.status.${t}`)}</span>
    </label>
  `}function bi(e,t){let n=!!e.toolFilter;return D`
    <button
      id="activity-live-filter-trigger"
      type="button"
      class="btn btn--sm activity-live-filter-trigger ${n?`active`:``}"
      title=${S(`activity.filters`)}
      aria-label=${S(`activity.filters`)}
      aria-haspopup="dialog"
      aria-expanded="false"
    >
      ${T.listFilter}
    </button>
    <wa-popover
      ${st(Ut)}
      class="activity-live-filter-popover"
      for="activity-live-filter-trigger"
      aria-label=${S(`activity.filters`)}
      placement="bottom-end"
      without-arrow
      @wa-show=${Rt}
      @wa-hide=${Rt}
    >
      <div class="activity-live-filter-popover__panel">
        <label class="field">
          <span>${S(`activity.toolFilter`)}</span>
          <select
            class="settings-select"
            aria-label=${S(`activity.toolFilter`)}
            .value=${e.toolFilter}
            @change=${t=>{t.currentTarget instanceof HTMLSelectElement&&e.onToolFilterChange(t.currentTarget.value)}}
          >
            <option value="" .selected=${e.toolFilter===``}>${S(`activity.allTools`)}</option>
            ${t.map(t=>D`<option value=${t} .selected=${t===e.toolFilter}>${t}</option>`)}
          </select>
        </label>
      </div>
    </wa-popover>
  `}function xi(e,t){return D`
    <div class="activity-live-toolbar">
      <div class="activity-feed__search activity-live-search">
        <span aria-hidden="true">${T.search}</span>
        <input
          class="settings-input"
          type="search"
          aria-label=${S(`activity.search`)}
          .value=${e.filterText}
          placeholder=${S(`activity.searchPlaceholder`)}
          @input=${t=>{t.currentTarget instanceof HTMLInputElement&&e.onFilterTextChange(t.currentTarget.value)}}
        />
      </div>
      <span role="group" aria-label=${S(`activity.statusFilters`)} class="activity-status-filters">
        ${wi.map(t=>yi(e,t))}
      </span>
      <span class="activity-live-autofollow">
        <span>${S(`activity.autoFollow`)}</span>
        ${At({checked:e.autoFollow,ariaLabel:S(`activity.autoFollow`),onChange:t=>e.onToggleAutoFollow(t)})}
      </span>
      ${bi(e,t)}
    </div>
  `}function Si(e,t,n){let r=e.expandedIds.has(t.id);return D`
    <details
      class="activity-entry activity-entry--${t.status}"
      .open=${r}
      @toggle=${n=>e.onEntryToggle(t.id,n.currentTarget.open)}
    >
      <summary class="activity-entry__summary">
        <span class="activity-entry__chevron" aria-hidden="true">${T.chevronRight}</span>
        <span class="activity-entry__main">
          <span class="activity-entry__title">
            ${Pt({kind:Ti[t.status],label:S(`activity.status.${t.status}`)})}
            <span class="activity-entry__tool mono">${_i(t)}</span>
          </span>
          <span class="activity-entry__text">${gi(t)}</span>
        </span>
        <span class="activity-entry__meta">
          <span>${n(t.updatedAt)}</span>
          <span>${mi(t.durationMs)}</span>
        </span>
      </summary>
      <div class="activity-entry__body">
        <div class="activity-entry__facts">
          ${t.entryKind===`answer_candidate`?D`<span class="mono"
                  >${S(`activity.answerCandidate.itemId`)}: ${t.itemId}</span
                >`:D`
                  <span>${hi(t.hiddenArgumentCount)}</span>
                  <span class="mono">${S(`activity.toolCallId`)}: ${t.toolCallId}</span>
                `}
          <a
            class="activity-entry__run-link mono"
            href=${tr(t.runId,e.basePath)}
            >${S(`activity.runId`)}: ${t.runId}</a
          >
          ${t.sessionKey?D`<span class="mono">${S(`activity.session`)}: ${t.sessionKey}</span>`:E}
        </div>
        ${t.outputPreview?D`
                <pre class="activity-entry__preview">${t.outputPreview}</pre>
                ${t.outputTruncated?D`<div class="activity-entry__note">${S(`activity.outputTruncated`)}</div>`:E}
              `:D`<div class="activity-entry__note">${S(`activity.noOutputPreview`)}</div>`}
      </div>
    </details>
  `}function Ci(e){let n=t({hour:`numeric`,minute:`2-digit`,second:`2-digit`},``),r=gt(e.entries.map(e=>e.toolName)),i=Tt(e.filterText),a=e.entries.filter(t=>e.statusFilters[t.status]&&(!e.toolFilter||t.toolName===e.toolFilter)&&vi(t,i));return D`
    <section class="activity-page" aria-label=${S(`activity.title`)}>
      <div class="settings-section__header">
        <h2 class="settings-section__heading">${S(`activity.title`)}</h2>
        <div class="settings-section__actions">
          <span class="activity-count" aria-live="polite">
            ${S(`activity.visibleCount`,{visible:String(a.length),total:String(e.entries.length)})}
          </span>
          ${[{action:`expandAll`,disabled:a.length===0,onClick:e.onExpandAll},{action:`collapseAll`,disabled:e.expandedIds.size===0,onClick:e.onCollapseAll},{action:`clear`,disabled:e.entries.length===0,onClick:e.onClear}].map(({action:e,disabled:t,onClick:n})=>D`<button
              type="button"
              class=${e===`clear`?`btn btn--sm danger`:`btn btn--sm`}
              ?disabled=${t}
              @click=${n}
            >
              ${S(`activity.${e}`)}
            </button>`)}
        </div>
      </div>
      <div class="settings-group activity-group">
        ${xi(e,r)}
        <div
          class="activity-stream"
          role="group"
          aria-label=${S(`activity.streamLabel`)}
          @scroll=${e.onScroll}
        >
          ${a.length===0?D`
                  <div class="activity-empty">
                    ${e.entries.length===0?S(`activity.empty`):S(`activity.emptyFiltered`)}
                  </div>
                `:a.map(t=>Si(e,t,n))}
        </div>
      </div>
    </section>
  `}var wi,Ti;function Ei(){return(Ei=e((()=>{wt(),O(),nt(),C(),jt(),It(),b(),z(),ht(),he(),W(),R(),wi=[`running`,`done`,`error`],Ti={running:`warn`,done:`ok`,error:`danger`}})))()}function Di(e){return e?.mode!==`run`||!e.selector?null:`${e.selector.kind}:${e.selector.id}:${e.decisionCursor??``}`}function Oi(e){let t=kt(e);return(t?.gatewayCode===`INVALID_REQUEST`||t?.code===`INVALID_REQUEST`)&&t.retryable!==!0}function ki(e,t,n){let r=new Set(e);return n??!r.has(t)?r.add(t):r.delete(t),r}var $,Ai;function ji(){return(ji=e((()=>{Ct(),O(),rt(),Ke(),Fe(),w(),Ie(),Qe(),Bt(),C(),Xe(),jt(),Lt(),b(),be(),pt(),rn(),o(),x(),y(),en(),ln(),v(),Tn(),Vn(),W(),wr(),Mr(),pi(),Ei(),$=class extends Te{constructor(...e){super(...e),this.entries=[],this.filterText=``,this.statusFilters={running:!0,done:!0,error:!0},this.toolFilter=``,this.expandedIds=new Set,this.expandedAutomationDays=new Set,this.autoFollow=!0,this.runInspector={status:`empty`},this.activityExpiry=Jt(this,()=>$t(this.presencePayload).users),this.liveActivity=null,this.liveActivityRevision=-1,this.sessionActivity=new jr(this),this.sessionActivityRevision=-1,this.inspectorAbort=null,this.inspectorClient=null,this.inspectorEpoch=0,this.inspectorSelectorKey=null,this.presenceClient=null,this.streamFollow=new un(this,{selector:`.activity-stream`,isEnabled:()=>this.autoFollow}),this.subscriptions=new p(this).watchStore(()=>this.context?.agents).effect(()=>this.context?.gateway,e=>{let t=Bn(e,this.context.sessions);this.liveActivity=t,this.entries=[],this.expandedIds=new Set;let n=t.subscribe(e=>{this.entries=e.entries,this.requestUpdate(),e.revision!==this.liveActivityRevision&&(this.liveActivityRevision=e.revision,this.expandedIds=new Set,this.streamFollow.atBottom=!0)});this.applyGatewaySnapshot(e,e.snapshot,!0);let r=e.subscribeEvents(t=>{this.applyGatewayEvent(e,t)}),i=e.subscribe(t=>this.applyGatewaySnapshot(e,t,!1));return()=>{n(),t.dispose(),this.liveActivity=null,i(),r()}})}willUpdate(e){this.activityExpiry.sync(),e.has(`routeLocation`)&&(this.routeData=this.routeLocation?nr(this.routeLocation.search,qe(this.routeLocation.pathname,this.context?.basePath)):void 0,this.routeLocation&&this.routeData&&(this.presentedRoute={location:this.routeLocation,data:this.routeData}),this.syncSessionActivity())}updated(e){this.liveActivity?.syncSessions(this.routeData?.mode===`live`?this.sessionActivity.result?.sessions??[]:[]),e.has(`routeLocation`)&&this.bindInspectorRoute();let t=this.routeLocation?this.sessionActivity.canonicalLocation(this.routeLocation,this.context.basePath,$t(this.presencePayload).users):null;t&&this.context.replace(`activity`,t);let n=this.autoFollow&&e.has(`autoFollow`);(n||this.autoFollow&&this.streamFollow.atBottom&&e.has(`entries`))&&this.streamFollow.schedule(n)}disconnectedCallback(){this.subscriptions.clear(),this.cancelInspectorRequest(),this.presentedRoute=void 0,super.disconnectedCallback()}applyGatewaySnapshot(e,t,n){if((n||e.eventLogRevision!==this.sessionActivityRevision)&&(this.sessionActivityRevision=e.eventLogRevision,this.presentedRoute=void 0,this.sessionActivity.load(null,null)),n||t.client!==this.presenceClient){this.presenceClient=t.client;let e=t.phase===`connected`?Le(t.hello?.snapshot):void 0;this.presencePayload=e?{presence:e}:void 0}else t.phase!==`connected`&&this.presencePayload&&(this.presencePayload=void 0);this.syncRunInspector(e,t,n),this.syncSessionActivity()}syncSessionActivity(e=`query`){let t=this.context?.gateway.snapshot;this.sessionActivity.load(t?.phase===`connected`?t.client:null,this.routeData?.mode===`sessions`?this.routeData.filters:this.routeData?.mode===`live`?`current`:null,e,dt(t,kr,`operator.write`,{requireAdvertisement:!1}))}bindInspectorRoute(){let e=this.routeData,t=e?.mode===`run`?e.selector:null,n=Di(e);(n!==this.inspectorSelectorKey||e?.mode!==`run`)&&(this.inspectorSelectorKey=n,this.cancelInspectorRequest(),this.inspectorClient=null,this.runInspector=t?{status:`loading`,waitingForGateway:!0}:{status:`empty`},e?.mode===`run`&&this.syncRunInspector(this.context.gateway,this.context.gateway.snapshot,!0))}cancelInspectorRequest(){this.inspectorEpoch+=1,this.inspectorAbort?.abort(),this.inspectorAbort=null}syncRunInspector(e,t,n=!1){let r=this.routeData;if(r?.mode!==`run`)return;let i=r.selector;if(!i){this.runInspector={status:`empty`};return}if(this.inspectorSelectorKey=Di(r),t.phase!==`connected`||!t.client){this.cancelInspectorRequest(),this.inspectorClient=null,this.runInspector={status:`disconnected`};return}let a=ft(t,`audit.run.inspect`)===!1?`unsupported`:dt(t,`audit.run.inspect`,`operator.read`)?null:`unauthorized`;if(a){this.cancelInspectorRequest(),this.inspectorClient=t.client,this.runInspector={status:a};return}(n||this.inspectorClient!==t.client||this.runInspector.status!==`loading`&&this.runInspector.status!==`ready`)&&this.loadRunInspector(e,t.client,i)}isUnknownInspectMethod(e){return e instanceof Pe&&e.gatewayCode===`INVALID_REQUEST`&&(e.message===`unknown method: audit.run.inspect`||e.message===`missing scope: operator.admin`)}async loadRunInspector(e,t,n,r,i=`executions`){this.cancelInspectorRequest();let a=this.inspectorEpoch,o=new AbortController;this.inspectorAbort=o,this.inspectorClient=t;let s=i===`decisions`?`decisionPageStatus`:`executionPageStatus`;this.runInspector=r?{...r,[s]:`loading`}:{status:`loading`,waitingForGateway:!1};let c=Di(this.routeData),l=()=>this.inspectorEpoch===a&&this.context.gateway===e&&e.snapshot.client===t&&e.snapshot.phase===`connected`&&this.routeData?.mode===`run`&&Di(this.routeData)===c,u=i===`decisions`?r?.result.nextDecisionCursor:this.routeData?.mode===`run`?this.routeData.decisionCursor:null;try{let e={...n.kind===`run`?{runId:n.id,executionLimit:50,...i===`executions`&&r?.result.nextExecutionCursor?{executionCursor:r.result.nextExecutionCursor}:{}}:{executionId:n.id},decisionLimit:50,...u?{decisionCursor:u}:{}},a=await t.request(`audit.run.inspect`,e,{signal:o.signal});if(!l())return;let s;if(r&&i===`decisions`){let e=ir(r.result,a);if(!e){this.runInspector={...r,decisionPageStatus:`error`};return}s=new Map([...r.receiptPageCursors,...rr(a.decisionDisplays,u??void 0)]),a=e}else if(r?.result.identity.state===`ambiguous`&&a.identity.state===`ambiguous`){let e=new Map([...r.result.identity.candidates,...a.identity.candidates].map(e=>[e.executionId,e]));a={...a,identity:{...a.identity,candidates:[...e.values()]}},s=r.receiptPageCursors}else s=rr(a.decisionDisplays,u??void 0);this.runInspector={status:`ready`,result:a,receiptPageCursors:s}}catch(e){if(!l()||o.signal.aborted)return;this.runInspector=xe(e)?{status:`unauthorized`}:this.isUnknownInspectMethod(e)?{status:`unsupported`}:r?{...r,[s]:`error`}:{status:`error`,recovery:u&&Oi(e)?`restart`:`retry`}}finally{this.inspectorAbort===o&&(this.inspectorAbort=null)}}loadMoreInspectorPage(e){let t=this.routeData,n=this.context.gateway,r=n.snapshot,i=this.runInspector;t?.mode===`run`&&t.selector&&r.phase===`connected`&&r.client&&i.status===`ready`&&(e===`executions`?t.selector.kind===`run`&&i.executionPageStatus!==`loading`&&i.result.identity.state===`ambiguous`&&i.result.nextExecutionCursor:i.decisionPageStatus!==`loading`&&i.result.identity.state===`present`&&i.result.nextDecisionCursor)&&this.loadRunInspector(n,r.client,t.selector,i,e)}restartRunInspector(){let e=this.routeData;e?.mode===`run`&&e.selector&&this.context.navigate(`activity`,{search:er(e.selector)})}applyGatewayEvent(e,t){if(this.context.gateway!==e)return;let n=t.event===`session.message`?m(t.payload):null,r=n&&(n.hasActiveRun===!1||n.status!==null&&n.status!==`running`&&n.status!==`queued`);if((t.event===`sessions.changed`||this.routeData?.mode===`live`&&r)&&this.sessionActivity.invalidate(t.payload),t.event===`presence`){let e=Le(t.payload);this.presencePayload=e?{presence:e}:void 0}}renderMode(e,t,n){if(n&&e.mode===`run`)return Je();if(e.mode===`sessions`){let r=$t(this.presencePayload).users;return fi({context:this.context,expandedAutomationDays:this.expandedAutomationDays,filters:{...e.filters,personId:this.sessionActivity.result?.involvingProfileId??e.filters.personId},presenceViewers:r,result:this.sessionActivity.result,loading:n||this.sessionActivity.loading,retrying:this.sessionActivity.retrying,error:this.sessionActivity.error,onRetry:()=>this.syncSessionActivity(`retry`),onSummaryRetry:dt(this.context.gateway.snapshot,`sessions.activitySummary.ensure`,`operator.write`,{requireAdvertisement:!1})?e=>this.sessionActivity.retrySummary(e):void 0,onAutomationDayToggle:e=>{this.expandedAutomationDays=ki(this.expandedAutomationDays,e)},onFiltersChange:e=>this.context.navigate(`activity`,this.sessionActivity.locationForFilters(e,t,this.context.basePath,r))})}if(e.mode===`run`)return D`<a
          class="activity-run-inspector-back"
          href=${tt(`activity`,this.context.basePath)}
          >${T.arrowLeft}${S(`activityFeed.backToSessions`)}</a
        >
        ${Cr({basePath:this.context.basePath,state:this.runInspector,onLoadMoreExecutions:()=>this.loadMoreInspectorPage(`executions`),onLoadMoreDecisions:()=>this.loadMoreInspectorPage(`decisions`),selectorId:e.selectorId,selector:e.selector,onRestart:()=>this.restartRunInspector(),onRetry:()=>this.syncRunInspector(this.context.gateway,this.context.gateway.snapshot,!0)})}`;let r={agentsList:this.context.agents.state.agentsList,hello:this.context.gateway.snapshot.hello};return D`<div id="activity-live-panel">
      ${wn({basePath:this.context.basePath,fallbackAgentId:l(r),mainKey:me(r),globalScope:oe(r),navigate:this.context.navigate,connected:this.context.gateway.snapshot.phase===`connected`,result:this.sessionActivity.result,loading:n||this.sessionActivity.loading,incomplete:this.sessionActivity.incomplete,error:this.sessionActivity.error,onRetry:()=>this.syncSessionActivity(`retry`)})}
      ${this.liveActivity?.snapshot.error?D`<div role="alert">
              ${Pt({kind:`danger`,label:this.liveActivity.snapshot.error})}
              <button type="button" class="btn btn--sm" @click=${()=>this.liveActivity?.retry()}>
                ${S(`common.retry`)}
              </button>
            </div>`:E}
      ${Ci({basePath:this.context.basePath,entries:this.entries,filterText:this.filterText,statusFilters:this.statusFilters,toolFilter:this.toolFilter,expandedIds:this.expandedIds,autoFollow:this.autoFollow,onFilterTextChange:e=>this.filterText=e,onToolFilterChange:e=>this.toolFilter=e,onStatusToggle:(e,t)=>{this.statusFilters={...this.statusFilters,[e]:t}},onToggleAutoFollow:e=>this.autoFollow=e,onClear:()=>this.liveActivity?.clear(),onExpandAll:()=>{this.expandedIds=new Set(this.entries.map(e=>e.id))},onCollapseAll:()=>{this.expandedIds=new Set},onEntryToggle:(e,t)=>{this.expandedIds=ki(this.expandedIds,e,t)},onScroll:e=>this.streamFollow.handleScroll(e)})}
    </div>`}render(){let e=!this.routeData||!this.routeLocation,t=this.routeData??this.presentedRoute?.data,n=this.routeLocation??this.presentedRoute?.location;if(!t||!n)return Je();let r=t.mode,i=D`
      ${r===`run`?E:zt({id:`activity-mode`,active:r,tabs:[{value:`sessions`,label:S(`activityFeed.sessionsMode`)},{value:`live`,label:S(`activity.runInspector.liveMode`)}],ariaLabel:S(`activity.runInspector.activityView`),panelId:`activity-mode-panel`,className:`activity-mode-tabs`,variant:`sub`,onSelect:e=>this.context.navigate(`activity`,{search:e===`live`?`?view=live`:``})})}
      <div
        id="activity-mode-panel"
        role=${r===`run`?E:`tabpanel`}
        aria-labelledby=${r===`run`?E:`activity-mode-tab-${r}`}
      >
        ${this.renderMode(t,n,e)}
      </div>
    `;return D`
      <section class="content-header" ${et({toolbarHeader:!0})}>
        <div>
          <div class="page-title">${Re(`activity`)}</div>
          ${r===`live`?E:D`<div class="page-sub">${S(`subtitles.activity`)}</div>`}
        </div>
      </section>
      ${Ht(i,{fillHeight:!0})}
    `}},I([St({context:Ye,subscribe:!0})],$.prototype,`context`,void 0),I([k({attribute:!1})],$.prototype,`routeLocation`,void 0),I([j()],$.prototype,`entries`,void 0),I([j()],$.prototype,`filterText`,void 0),I([j()],$.prototype,`statusFilters`,void 0),I([j()],$.prototype,`toolFilter`,void 0),I([j()],$.prototype,`expandedIds`,void 0),I([j()],$.prototype,`expandedAutomationDays`,void 0),I([j()],$.prototype,`autoFollow`,void 0),I([j()],$.prototype,`runInspector`,void 0),I([j()],$.prototype,`presencePayload`,void 0),Ai={header:!0,render:e=>D`<zero-activity-page
      .routeLocation=${e}
      ${et({activityPage:!0})}
    ></zero-activity-page>`},customElements.get(`zero-activity-page`)||customElements.define(`zero-activity-page`,$)})))()}ji();export{Ai as activityPageComponent};
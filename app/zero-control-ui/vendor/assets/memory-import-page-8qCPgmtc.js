import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Pu as i,bu as a,dl as o,ju as s,ll as c,ul as l,xu as u,yu as d,zu as f}from"./control-ui-core-DCNBgr3X.js";import{Aa as ee,Ai as p,Ba as m,ca as h,ki as g,qr as te,sa as _,wr as ne,yr as v,za as y}from"./control-ui-core-DwX5Mpz4.js";import{G as b,J as x,W as S,Z as C,rt as w}from"./lit-runtime-B40xFCK_.js";import{d as re,l as ie}from"./gateway-runtime-JSfC8ThO.js";import{Mt as ae,Ur as oe,Wr as se,Zr as T,jt as ce}from"./ui-AaV6iNVa.js";import{F as E,M as le,N as ue,j as D}from"./control-ui-boot-shared-E4pYPcWx.js";import{B as O,G as k,I as A,K as j,R as M,Si as N,Ti as P,Y as F,Z as I,et as L,ki as R,l as z,q as B,tt as V,u as H}from"./control-ui-boot-shared-ZuP0LiFD.js";import{n as de,t as fe}from"./en-memory-import-CPK3EHm3.js";function U(e,t){let n=e.details?.[t];return typeof n==`string`&&n.trim()?n:void 0}function pe(e){let t=new Map;for(let n of e){let e=U(n,`collectionId`)??n.id,r=U(n,`collectionLabel`)??U(n,`sourceLabel`)??f(`memoryImport.unknownCollection`),i=t.get(e)??{label:r,items:[]};i.items.push(n),t.set(e,i)}return[...t.values()].toSorted((e,t)=>e.label.localeCompare(t.label))}function W(e){return e.providerId===`claude`?f(`memoryImport.claudeCode`):e.label}function G(e){return f(e===1?`memoryImport.fileCountOne`:`memoryImport.fileCount`,{count:String(e)})}function me(e){return f(e===1?`memoryImport.backfill.processedDayCountOne`:`memoryImport.backfill.processedDayCount`,{count:String(e)})}function K(e){let t=U(e,`relativePath`);if(t)return t;let n=e.target??e.source??e.id;return n.split(/[\\/]/u).at(-1)??n}function he(e,t,n,r,i){let a=t.items.filter(e=>e.status===`planned`).map(e=>e.id),o=a.length>0&&a.every(e=>n.has(e)),s=t.items.filter(e=>e.status===`conflict`).length;return x`
    <div class="settings-row settings-row--stacked memory-import__collection">
      <div class="memory-import__collection-header">
        <label class="memory-import__collection-choice">
          <input
            type="checkbox"
            .checked=${o}
            ?disabled=${a.length===0||i}
            @change=${t=>r(e.providerId,a,t.currentTarget.checked)}
          />
          <span>
            <strong>${t.label}</strong>
            <small>${G(t.items.length)}</small>
          </span>
        </label>
        ${s>0?I({kind:`warn`,label:f(`memoryImport.alreadyImported`,{count:String(s)})}):b}
      </div>
      <details ?open=${t.items.length<=4}>
        <summary>${f(`memoryImport.reviewFiles`)}</summary>
        <ul class="memory-import__files">
          ${t.items.map(e=>x`
              <li>
                <span class="memory-import__file-icon" aria-hidden="true">${_.fileText}</span>
                <code title=${e.source??K(e)}>${K(e)}</code>
                <span class="memory-import__file-status memory-import__file-status--${e.status}">
                  ${e.status===`planned`?f(`memoryImport.ready`):e.status===`conflict`?f(`memoryImport.existing`):e.status}
                </span>
              </li>
            `)}
        </ul>
      </details>
    </div>
  `}function ge(e){if(!e)return b;let t=e.summary.errors>0||e.summary.conflicts>0,n=e.items.filter(e=>e.status===`error`||e.status===`conflict`||U(e,`recoveryRecordPath`)!==void 0);return x`
    <div
      class="settings-row settings-row--stacked memory-import__result ${t?`memory-import__result--incomplete`:``}"
      role=${t?`alert`:`status`}
    >
      <span aria-hidden="true">${t?_.alertTriangle:_.check}</span>
      <div>
        <strong>
          ${f(t?`memoryImport.importIncomplete`:`memoryImport.importComplete`)}
        </strong>
        <span>
          ${t?f(`memoryImport.importedWithIssues`,{conflicts:String(e.summary.conflicts),errors:String(e.summary.errors),migrated:String(e.summary.migrated)}):f(`memoryImport.importedCount`,{count:String(e.summary.migrated)})}
        </span>
        ${e.reportDir?x`<span class="memory-import__result-path">
                ${f(`memoryImport.reportSaved`)}:
                <code title=${e.reportDir}>${e.reportDir}</code>
              </span>`:b}
        ${n.length>0?x`<ul class="memory-import__result-issues">
                ${n.map(e=>{let t=[[`memoryImport.recoveryFile`,`recoveryPath`],[`memoryImport.recoveryJournal`,`recoveryRecordPath`],[`memoryImport.itemBackup`,`backupPath`]].map(([t,n])=>({label:f(t),path:U(e,n)})).filter(e=>!!e.path);return x`<li>
                    <strong>${K(e)}</strong>
                    <span>${a(e.reason??e.message,e.status)}</span>
                    ${t.map(e=>x`<span class="memory-import__result-artifact">
                        <span>${e.label}</span>
                        <code title=${e.path}>${e.path}</code>
                      </span>`)}
                  </li>`})}
              </ul>`:b}
      </div>
    </div>
  `}function _e(e,t){let n=new Set(e.selectedByProvider[t.providerId]??[]),r=pe(t.items),i=e.applyingProviderId===t.providerId,o=e.loading||e.applyingProviderId!==null||e.error!==null||e.backfillBusy===`apply`||e.backfillBusy===`rollback`||e.backfillRollbackPending,s=t.error?x`<div class="callout danger" role="alert">${a(t.error)}</div>`:t.found?x`
          ${[[`memoryImport.source`,t.source],[`memoryImport.destination`,t.target&&`${t.target}/memory/imports/`]].map(([e,t])=>t?B({title:f(e),control:V(t,{mono:!0})}):b)}
          ${r.map(r=>he(t,r,n,e.onToggleCollection,o))}
          ${B({title:n.size>0?f(`memoryImport.selectedCount`,{count:String(n.size)}):f(`memoryImport.selectAtLeastOne`),control:x`
              <button
                class="btn primary"
                data-test-id="memory-import-provider-button"
                ?disabled=${n.size===0||o}
                @click=${()=>e.onRequestImport(t.providerId)}
              >
                ${f(i?`common.importing`:`memoryImport.importSelected`)}
              </button>
            `})}
        `:O(t.message??f(`memoryImport.noMemoryFound`));return x`
    <div data-provider-id=${t.providerId}>
      ${F({title:x`<span class="memory-import__provider-title">
            ${P(t.providerId,{className:`memory-import__provider-icon`})}
            ${W(t)}
          </span>`,description:f(t.providerId===`codex`?`memoryImport.codexDescription`:t.providerId===`claude`?`memoryImport.claudeDescription`:`memoryImport.providerFallback`),actions:I({kind:t.found?`ok`:`muted`,label:t.found?G(t.items.length):f(`memoryImport.notFound`)})},x`${s}${ge(e.lastResults[t.providerId])}`)}
    </div>
  `}function q(e,t=!1){let n=t?void 0:e.plan?.providers.find(t=>t.providerId===e.pendingProviderId);if(t?!e.backfillRollbackPending:!n)return b;let r=n?f(`memoryImport.confirmTitle`,{provider:W(n)}):f(`memoryImport.backfill.rollbackConfirmTitle`),i=n?f(`memoryImport.confirmDescription`,{count:String(e.selectedByProvider[n.providerId]?.length??0)}):f(`memoryImport.backfill.rollbackConfirmDescription`),a=e.applyingProviderId!==null||t&&e.backfillBusy!==null,o=t?e.onBackfillRollbackCancel:e.onCancelImport;return x`
    <zero-modal-dialog
      label=${r}
      description=${i}
      @modal-cancel=${t?o:()=>{e.applyingProviderId===null&&o()}}
    >
      <div class="exec-approval-card memory-import__confirm">
        <div class="exec-approval-header">
          <div>
            <div class="exec-approval-title">${r}</div>
            <div class="exec-approval-sub">${i}</div>
          </div>
        </div>
        <div class="callout ${t||e.replaceExisting?`warn`:``}">
          ${f(t?`memoryImport.backfill.rollbackWarning`:e.replaceExisting?`memoryImport.confirmReplace`:`memoryImport.confirmBackup`)}
        </div>
        <div class="exec-approval-actions">
          <button
            class="btn ${t?`danger`:`primary`}"
            data-test-id=${t?`memory-backfill-rollback-confirm`:`memory-import-confirm`}
            ?disabled=${a}
            @click=${t?e.onBackfillRollbackConfirm:e.onConfirmImport}
          >
            ${f(t?`memoryImport.backfill.rollback`:`memoryImport.confirmImport`)}
          </button>
          <button class="btn" ?disabled=${a} @click=${o}>${f(`common.cancel`)}</button>
        </div>
      </div>
    </zero-modal-dialog>
  `}function ve(e){let t=e.loading||e.applyingProviderId!==null||e.backfillBusy!==null;return F({title:f(`memoryImport.title`),description:f(`memoryImport.subtitle`),actions:x`
        <button class="btn btn--sm" ?disabled=${t} @click=${e.onRefresh}>
          ${e.loading?f(`common.refreshing`):f(`common.refresh`)}
        </button>
      `},x`
      ${e.agents.length>1?B({title:f(`memoryImport.agent`),control:x`
                <zero-agent-select
                  class="agent-select--settings"
                  name="memory-import-agent"
                  .options=${e.agents.map(e=>({value:e.id,label:o(e),agent:e}))}
                  .value=${e.selectedAgentId??``}
                  .accessibleLabel=${f(`memoryImport.agent`)}
                  .disabled=${t}
                  .onSelect=${e.onSelectAgent}
                ></zero-agent-select>
              `}):b}
      ${L({title:f(`memoryImport.replaceExisting`),description:f(`memoryImport.replaceHint`),checked:e.replaceExisting,disabled:t,onChange:t=>e.onReplaceExisting(t)})}
    `)}function J(e){let t=e.backfillBusy!==null||e.applyingProviderId!==null,n=e.backfillPreview,r=(e,n,r)=>x`<label>
    <span>${e}</span>
    <input
      class="input"
      type="date"
      .value=${n}
      ?disabled=${t}
      @input=${e=>r(e.currentTarget.value)}
    />
  </label>`,i=(e,n,r,i)=>x`<button
    class=${n}
    data-test-id=${`memory-backfill-${e}`}
    ?disabled=${t}
    @click=${i}
  >
    ${r}
  </button>`;return x`
    <div data-test-id="memory-session-backfill">
      ${F({title:f(`memoryImport.backfill.title`),description:f(`memoryImport.backfill.subtitle`)},x`
          ${e.backfillAvailable?x`
                  ${B({title:f(`memoryImport.backfill.dateRange`),description:f(`memoryImport.backfill.dateRangeHint`),control:x`<div class="memory-import__backfill-dates">
                      ${r(f(`memoryImport.backfill.from`),e.backfillFrom,e.onBackfillFromChange)}
                      ${r(f(`memoryImport.backfill.to`),e.backfillTo,e.onBackfillToChange)}
                    </div>`})}
                  ${B({title:f(`memoryImport.backfill.actions`),control:x`<div class="memory-import__backfill-actions">
                      ${i(`preview`,`btn`,f(e.backfillBusy===`preview`?`memoryImport.backfill.previewing`:`memoryImport.backfill.preview`),e.onBackfillPreview)}
                      ${i(`apply`,`btn primary`,f(e.backfillBusy===`apply`?`memoryImport.backfill.applying`:`memoryImport.backfill.apply`),e.onBackfillApply)}
                      ${i(`rollback`,`btn danger`,f(`memoryImport.backfill.rollback`),e.onBackfillRollbackRequest)}
                    </div>`})}
                  ${e.backfillError?x`<div class="callout danger" role="alert">${e.backfillError}</div>`:b}
                  ${n?x`<div
                          class="settings-row settings-row--stacked memory-import__backfill-preview"
                        >
                          <strong role="status">
                            ${f(`memoryImport.backfill.previewSummary`,{candidates:String(n.candidates),days:String(n.days)})}
                          </strong>
                          ${n.perDay.length>0?x`<ul>
                                  ${n.perDay.map(e=>x`<li>
                                      <div>
                                        <strong>${e.day}</strong>
                                        <span>
                                          ${f(`memoryImport.backfill.candidateCount`,{count:String(e.candidateCount)})}
                                        </span>
                                      </div>
                                      ${e.sample.length>0?x`<ul>
                                              ${e.sample.map(e=>x`<li>${e}</li>`)}
                                            </ul>`:b}
                                    </li>`)}
                                </ul>`:x`<span>${f(`memoryImport.backfill.noCandidates`)}</span>`}
                          ${n.truncated?x`<div class="callout warn">
                                  ${f(`memoryImport.backfill.previewTruncated`)}
                                </div>`:b}
                        </div>`:b}
                  ${e.backfillProgress?x`<div
                          class="settings-row settings-row--stacked memory-import__backfill-progress"
                          role="status"
                        >
                          <strong>
                            ${e.backfillProgress.complete?f(`memoryImport.backfill.complete`,{count:String(e.backfillProgress.staged)}):f(`memoryImport.backfill.progress`,{days:String(e.backfillProgress.days),staged:String(e.backfillProgress.staged)})}
                          </strong>
                          <span>
                            ${f(`memoryImport.backfill.processedCandidates`,{count:String(e.backfillProgress.candidates)})}
                            · ${me(e.backfillProgress.days)}
                          </span>
                        </div>`:b}
                  ${e.backfillRollbackResult?x`<div class="settings-row settings-row--stacked" role="status">
                          <strong>${f(`memoryImport.backfill.rollbackComplete`)}</strong>
                          <span>
                            ${f(`memoryImport.backfill.rollbackCounts`,{diary:String(e.backfillRollbackResult.removedDiaryEntries),staged:String(e.backfillRollbackResult.removedStagedEntries)})}
                          </span>
                        </div>`:b}
                `:O(f(`memoryImport.backfill.unavailable`))}
        `)}
      ${q(e,!0)}
    </div>
  `}function ye(e){return e.connected?e.canAdmin?x`
    <div class="memory-import" data-test-id="memory-import-page">
      ${k(x`
        ${ve(e)} ${J(e)}
        ${[e.error,e.applyError].map(e=>e?x`<div class="callout danger" role="alert">${e}</div>`:b)}
        ${e.loading&&!e.plan?x`<div class="settings-group memory-import__loading" aria-busy="true">
                <div class="skeleton memory-import__skeleton"></div>
                <div class="skeleton memory-import__skeleton"></div>
              </div>`:(e.plan?.providers??[]).map(t=>_e(e,t))}
        ${q(e)}
      `)}
    </div>
  `:k(O(f(`memoryImport.adminRequired`))):k(O(f(`memoryImport.disconnected`)))}function Y(){return(Y=e((()=>{S(),R(),te(),h(),N(),A(),i(),fe(),c(),u(),de()})))()}var X,Z,Q;function $(){return($=e((()=>{se(),D(),S(),C(),ee(),p(),ne(),A(),z(),c(),u(),ie(),ae(),r(),n(),Y(),X=14,Z=`http://127.0.0.1:18789/install/migrating`,Q=class extends s{constructor(...e){super(...e),this.replaceExisting=!1,this.selectedByProvider={},this.applyingProviderId=null,this.pendingImport=null,this.applyError=null,this.lastResults={},this.backfillFrom=``,this.backfillTo=``,this.backfillBusy=null,this.backfillError=null,this.backfillPreview=null,this.backfillProgress=null,this.backfillRollbackResult=null,this.backfillRollbackPending=!1,this.applyEpoch=0,this.backfillEpoch=0,this.lastPlanValue=null,this.subscriptions=new t(this).watchStore(()=>this.context?.gateway).watchStore(()=>this.context?.agents).watchStore(()=>this.context?.agentSelection),this.planTask=new le(this,{args:()=>{let e=this.context?.gateway.snapshot;return[this.isConnected&&e?.phase===`connected`?e.client??null:null,e?v(e.hello?.auth??null):!1,this.currentAgentId(),this.replaceExisting]},task:async([e,t,n,r],{signal:i})=>!e||!t||!n?ue:{client:e,agentId:n,overwrite:r,plan:await e.request(`migrations.memory.plan`,{agentId:n,overwrite:r},{signal:i})},onComplete:e=>{let t=this.lastPlanValue;t&&(t.client!==e.client||t.agentId!==e.agentId||t.overwrite!==e.overwrite)&&(this.resetMutationState({preserveAttemptedImport:t.client!==e.client}),(t.client!==e.client||t.agentId!==e.agentId)&&this.resetBackfillState()),this.lastPlanValue=e;let{plan:n}=e;this.selectedByProvider=Object.fromEntries(n.providers.map(e=>[e.providerId,e.items.filter(e=>e.status===`planned`).map(e=>e.id)]))}})}disconnectedCallback(){this.planTask.run([null,!1,null,this.replaceExisting]),this.applyEpoch+=1,this.backfillEpoch+=1,this.subscriptions.clear(),super.disconnectedCallback()}updated(){let e=this.context.gateway.snapshot;this.pendingImport&&(e.phase!==`connected`||e.client!==(this.planTask.value??this.lastPlanValue)?.client||this.currentAgentId()!==this.pendingImport.agentId)&&this.resetMutationState({preserveAttemptedImport:!0}),e.phase!==`connected`&&(this.backfillBusy!==null||this.backfillRollbackPending)&&this.resetBackfillState()}currentAgentId(){let e=this.context.agents.state.agentsList;if(!e)return null;let t=l(e.agents),n=this.context.agentSelection.state.selectedId;return n&&t.some(e=>e.id===n)?n:t.some(t=>t.id===e.defaultId)?e.defaultId:t[0]?.id??null}get plan(){let e=this.planTask.value??this.lastPlanValue,t=this.context.gateway.snapshot,n=this.currentAgentId();return e&&t.phase===`connected`&&e.client===t.client&&e.agentId===n&&e.overwrite===this.replaceExisting?e.plan:null}get loading(){return this.planTask.status===E.PENDING}get error(){return this.planTask.status===E.ERROR?d(this.planTask.error,`request failed`):null}get canAdmin(){return v(this.context.gateway.snapshot.hello?.auth??null)}resetMutationState(e={}){let t=e.preserveAttemptedImport&&this.pendingImport?.attempted?this.pendingImport:null;this.applyEpoch+=1,this.selectedByProvider={},this.applyingProviderId=null,this.pendingImport=t,this.applyError=null,this.lastResults={}}refresh(){return this.currentAgentId()?this.planTask.run():this.context.agents.ensureList().then(()=>void 0)}toggleCollection(e,t,n){let r=new Set(this.selectedByProvider[e]??[]);for(let e of t)n?r.add(e):r.delete(e);this.selectedByProvider={...this.selectedByProvider,[e]:[...r]}}requestImport(e){if(!this.canAdmin)return;let t=this.currentAgentId(),n=this.plan?.providers.find(t=>t.providerId===e)?.planFingerprint,r=this.selectedByProvider[e]??[];!this.loading&&this.error===null&&this.applyingProviderId===null&&this.backfillBusy!==`apply`&&this.backfillBusy!==`rollback`&&!this.backfillRollbackPending&&t&&this.plan?.agentId===t&&n&&r.length!==0&&(this.applyError=null,this.pendingImport={providerId:e,agentId:t,planFingerprint:n,itemIds:[...r],overwrite:this.replaceExisting,idempotencyKey:ce(),attempted:!1})}async confirmImport(){if(!this.canAdmin||this.applyingProviderId!==null||this.backfillBusy===`apply`||this.backfillBusy===`rollback`||this.backfillRollbackPending)return;let e=this.pendingImport,t=this.context.gateway.snapshot;if(!e||!t.client||this.currentAgentId()!==e.agentId||this.plan?.agentId!==e.agentId)return;let n={...e,attempted:!0},r=t.client;this.pendingImport=n;let i=++this.applyEpoch;this.applyingProviderId=n.providerId,this.applyError=null;try{let e=await r.request(`migrations.memory.apply`,{idempotencyKey:n.idempotencyKey,agentId:n.agentId,providerId:n.providerId,planFingerprint:n.planFingerprint,itemIds:n.itemIds,overwrite:n.overwrite});if(i!==this.applyEpoch||this.context.gateway.snapshot.phase!==`connected`||this.context.gateway.snapshot.client!==r||this.currentAgentId()!==n.agentId)return;this.lastResults={...this.lastResults,[n.providerId]:e},this.pendingImport=null,await this.refresh()}catch(e){i===this.applyEpoch&&(this.applyError=d(e,`request failed`))}finally{i===this.applyEpoch&&(this.applyingProviderId=null)}}resetBackfillState(){this.backfillEpoch+=1,this.backfillFrom=``,this.backfillTo=``,this.backfillBusy=null,this.backfillError=null,this.clearBackfillResults(),this.backfillRollbackPending=!1}clearBackfillResults(){this.backfillPreview=null,this.backfillProgress=null,this.backfillRollbackResult=null}setBackfillDate(e,t){this[e]=t,this.clearBackfillResults(),this.backfillError=null}async runBackfill(e){let t=this.context.gateway.snapshot.client,n=this.currentAgentId();if(!this.canAdmin||!t||!n||this.backfillBusy!==null||this.applyingProviderId!==null||e===`rollback`&&!this.backfillRollbackPending)return;let r=++this.backfillEpoch,i=()=>r===this.backfillEpoch&&this.context.gateway.snapshot.phase===`connected`&&this.context.gateway.snapshot.client===t&&this.currentAgentId()===n;this.backfillBusy=e,this.backfillError=null,e!==`rollback`&&this.clearBackfillResults();let a=e=>t.request(`memory.sessionBackfill.${e}`,{agentId:n,...this.backfillFrom?{from:this.backfillFrom}:{},...this.backfillTo?{to:this.backfillTo}:{},limitDays:X});try{if(e===`rollback`){let e=await t.request(`memory.sessionBackfill.rollback`,{agentId:n});i()&&(this.backfillRollbackResult=e,this.backfillPreview=null,this.backfillProgress=null,this.backfillRollbackPending=!1)}else if(e===`preview`){let e=await a(`preview`);i()&&(this.backfillPreview=e)}else{let e={days:0,candidates:0,staged:0,complete:!1};this.backfillProgress=e;let t=new Set;for(;;){let n=await a(`apply`);if(!i())return;if(n.candidates>0&&n.cursor?.advanced!==!0)throw Error(`Session backfill stopped because the server cursor did not advance.`);if(n.candidates===0&&n.cursor?.exhausted!==!0)throw Error(`Session backfill stopped because the server cursor was not exhausted.`);for(let e of n.perDay)t.add(e.day);if(e={days:t.size,candidates:e.candidates+n.candidates,staged:e.staged+n.staged,complete:n.candidates===0},this.backfillProgress=e,n.candidates===0)break}}}catch(e){i()&&(this.backfillError=d(e,`request failed`))}finally{i()&&(this.backfillBusy=null)}}render(){let e=this.context.gateway.snapshot,t=this.context.agents.state.agentsList,n=this.currentAgentId(),r=ye({connected:e.phase===`connected`,canAdmin:this.canAdmin,agents:l(t?.agents??[]),selectedAgentId:n,plan:this.plan,loading:this.loading||this.context.agents.state.agentsLoading,error:(n?null:this.context.agents.state.agentsError)??this.error,applyError:this.applyError,replaceExisting:this.replaceExisting,selectedByProvider:this.selectedByProvider,applyingProviderId:this.applyingProviderId,pendingProviderId:this.pendingImport?.agentId===n?this.pendingImport.providerId:null,lastResults:this.lastResults,backfillAvailable:re(e,`memory.sessionBackfill.preview`)!==!1,backfillFrom:this.backfillFrom,backfillTo:this.backfillTo,backfillBusy:this.backfillBusy,backfillError:this.backfillError,backfillPreview:this.backfillPreview,backfillProgress:this.backfillProgress,backfillRollbackResult:this.backfillRollbackResult,backfillRollbackPending:this.backfillRollbackPending,onSelectAgent:e=>{this.context.agentSelection.set(e),this.resetMutationState(),this.resetBackfillState()},onReplaceExisting:e=>{this.replaceExisting=e,this.resetMutationState()},onRefresh:()=>void this.refresh(),onToggleCollection:(e,t,n)=>this.toggleCollection(e,t,n),onRequestImport:e=>this.requestImport(e),onConfirmImport:()=>void this.confirmImport(),onCancelImport:()=>{this.applyingProviderId===null&&(this.pendingImport=null,this.applyError=null)},onBackfillFromChange:e=>this.setBackfillDate(`backfillFrom`,e),onBackfillToChange:e=>this.setBackfillDate(`backfillTo`,e),onBackfillPreview:()=>void this.runBackfill(`preview`),onBackfillApply:()=>void this.runBackfill(`apply`),onBackfillRollbackRequest:()=>{this.backfillBusy===null&&(this.backfillRollbackPending=!0,this.backfillError=null)},onBackfillRollbackConfirm:()=>void this.runBackfill(`rollback`),onBackfillRollbackCancel:()=>{this.backfillBusy===null&&(this.backfillRollbackPending=!1)}});return x`
      ${j({title:m(`memory-import`),subtitle:x`${y(`memory-import`)}
        ${M(Z)}`})}
      ${H(r)}
    `}},T([oe({context:g,subscribe:!0})],Q.prototype,`context`,void 0),T([w()],Q.prototype,`replaceExisting`,void 0),T([w()],Q.prototype,`selectedByProvider`,void 0),T([w()],Q.prototype,`applyingProviderId`,void 0),T([w()],Q.prototype,`pendingImport`,void 0),T([w()],Q.prototype,`applyError`,void 0),T([w()],Q.prototype,`lastResults`,void 0),T([w()],Q.prototype,`backfillFrom`,void 0),T([w()],Q.prototype,`backfillTo`,void 0),T([w()],Q.prototype,`backfillBusy`,void 0),T([w()],Q.prototype,`backfillError`,void 0),T([w()],Q.prototype,`backfillPreview`,void 0),T([w()],Q.prototype,`backfillProgress`,void 0),T([w()],Q.prototype,`backfillRollbackResult`,void 0),T([w()],Q.prototype,`backfillRollbackPending`,void 0),customElements.get(`zero-memory-import-page`)||customElements.define(`zero-memory-import-page`,Q)})))()}$();
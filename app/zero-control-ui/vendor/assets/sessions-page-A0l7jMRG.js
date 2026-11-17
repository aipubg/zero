const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./input-dialog-D-ZiT4FK.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-core-DI-Q_yCI.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Bl as t,Bo as n,El as r,Hr as i,Hs as a,Ic as o,Ii as s,Jc as c,Jo as l,Ku as u,Lc as d,Ml as f,Nu as p,Pu as m,Ql as h,R as g,So as _,Tl as ee,Ul as v,Vr as y,W as b,Wc as x,Xc as S,Yc as C,_u as w,br as T,dn as te,ic as E,j as ne,ju as re,kl as D,nc as ie,qc as O,un as ae,vu as k,wl as oe,wo as se,xu as A,yu as j,z as ce,zl as M,zu as N}from"./control-ui-core-DCNBgr3X.js";import{Aa as le,Ai as ue,Ba as de,Ei as fe,Fi as pe,Ti as me,ca as he,ki as ge,sa as P,za as _e}from"./control-ui-core-DwX5Mpz4.js";import{E as ve,G as F,J as I,W as L,Z as ye,at as be,c as xe,k as Se,l as Ce,rt as R}from"./lit-runtime-B40xFCK_.js";import{S as we,y as z}from"./control-ui-boot-chat-BVLkkfEk.js";import{c as Te,d as Ee,l as De}from"./gateway-runtime-JSfC8ThO.js";import{Bn as Oe,It as ke,La as Ae,Nn as je,Pn as Me,Vn as Ne,_ as Pe,aa as Fe,b as Ie,ia as Le,v as Re,x as ze,zt as Be}from"./control-ui-boot-shared-BX8huZUb.js";import{Ao as Ve,Ar as He,Po as B,Si as V,Sr as Ue,Ur as We,Wr as Ge,Zr as H,jo as Ke,kr as qe,ma as Je,mt as U,pa as Ye,ro as Xe,xr as Ze,yi as Qe}from"./ui-AaV6iNVa.js";import{M as $e,N as et,j as tt}from"./control-ui-boot-shared-E4pYPcWx.js";import{Ar as nt,G as rt,I as W,Jn as it,Mi as at,On as ot,R as st,X as ct,Y as lt,Yn as ut,Z as G,at as dt,c as ft,ct as pt,it as mt,kn as ht,l as gt,lt as _t,n as vt,na as yt,s as bt,t as xt,ta as St,u as Ct,ut as wt}from"./control-ui-boot-shared-ZuP0LiFD.js";import{a as Tt,n as Et,o as Dt,r as Ot,t as kt}from"./session-workspace-recovery.runtime-DXM4sTvL.js";import{$c as At,Ca as jt,Gc as Mt,Gl as Nt,Lc as Pt,Ml as Ft,Nl as It,Qc as Lt,Wc as Rt,Wl as K,Zc as zt,_l as q,bl as Bt,ca as Vt,d as Ht,fl as Ut,fu as Wt,gn as Gt,hl as Kt,la as qt,ml as Jt,sa as Yt,su as Xt,u as Zt,wa as Qt,xa as $t,zc as en}from"./control-ui-boot-shared-CzJHozXQ.js";import{ct as tn,st as nn}from"./control-ui-boot-shared-D2GHitQ4.js";import{G as rn,W as an}from"./control-ui-boot-chat-B3rfqCeq.js";import{n as on,t as sn}from"./transcript-search-B_Iblt1R.js";import{n as cn,t as ln}from"./cloud-worker-stop.runtime-DVAcr10j.js";import{n as un,t as dn}from"./capacity-meter-WCr6-wfe.js";import{n as fn,t as pn}from"./sessions-hub-header-Demx7KXQ.js";function mn(e){return[...new Set((e?.sessions??[]).map(e=>M(e.key)?.agentId).filter(e=>!!e))]}function hn(e,t){return Object.fromEntries(mn(e).map(e=>[e,t(e)]).filter(e=>!!e[1]))}function gn(e,t){if(!e||!t)return;let n=mn(t).filter(t=>!e.get(t));n.length!==0&&e.ensure(n)}function _n(){return(_n=e((()=>{D()})))()}function vn(e,{key:t,sessionId:n,pinned:r},i){let a=e.captureConnectionScope();return a?o=>{e.isConnectionScopeCurrent(a)&&o.entry.sessionId===n&&k({message:N(`sessionsView.sessionArchived`),actionLabel:N(`common.undo`),onAction:()=>{e.isConnectionScopeCurrent(a)&&e.patch(t,{archived:!1,...r===!0?{pinned:!0}:{}},{agentId:i,expectedSessionId:n}).catch(t=>{e.isConnectionScopeCurrent(a)&&k({message:j(t)})})}})}:null}function yn(){return(yn=e((()=>{m(),A(),w()})))()}function bn(e,t){return[...new Set(Jt(t,e?.sessions??[]))]}async function xn(e){if(e.knownCategories.includes(e.name))return`completed`;try{return await e.sessions.groupsPut([...e.sessions.state.groups??[],e.name])===`completed`&&e.isCurrent()?`completed`:`stale`}catch(t){return e.isCurrent()?(e.onError(j(t)),`failed`):`stale`}}function Sn(){return(Sn=e((()=>{A(),q()})))()}function Cn(e,t){let n=t.deepLinkSessionKey?.trim()||null,r=M(n)?.agentId??e.agentSelection.state.scopeId?.trim(),i=!n&&t.statusFilter===`active`?t.activeMinutes:void 0;return{source:`sessions-page`,excludeDock:!n,rowMode:`compact`,limit:n?50:t.limit,...i?{activeMinutes:i}:{},...n||t.search?.trim()?{search:n??t.search.trim()}:{},includeGlobal:n?!0:t.includeGlobal,includeUnknown:n?!0:t.includeUnknown,includeDerivedTitles:!1,includeLastMessage:!1,archivedFilter:t.statusFilter,...r?{agentId:r}:{}}}function wn(){return(wn=e((()=>{T(),D()})))()}var Tn;function En(){return(En=e((()=>{A(),Je(),Tn=class{constructor(e){this.onError=e,this.lifecycle=null}abort(){this.lifecycle?.abort()}async open(e){let t=this.lifecycle,n=t??new AbortController;this.lifecycle=n;try{let t;try{({showInputDialog:t}=await Ye(()=>import(`./input-dialog-D-ZiT4FK.js`).then(e=>(e.t(),e.n)),__vite__mapDeps([0,1,2]),import.meta.url))}catch(e){return this.onError(j(e)),null}let r=e();return await t({...r,signal:r.signal?AbortSignal.any([n.signal,r.signal]):n.signal})??null}finally{!t&&this.lifecycle===n&&(this.lifecycle=null)}}}})))()}function Dn(){return Bt(u()?.getItem(J))}function On(e){try{u()?.setItem(J,e)}catch{}}var J;function kn(){return(kn=e((()=>{q(),J=`zero:sessions:group-by`})))()}function An(e,t,n){let r=new Map(t.map(e=>[e.key,e])),i=new Map(e);for(let[e,t]of i){let a=r.get(e);(a?t.sessionId?.trim()&&a.sessionId===t.sessionId:n(t))||i.delete(e)}return i.size===e.size?e:i}function jn(e,t,n,r){let i=new Map(e);for(let e of n)if(r===`deselect`||r===`toggle`&&i.has(e))i.delete(e);else{let n=t.find(t=>t.key===e);n&&i.set(e,{...n})}return i}var Mn;function Nn(){return(Nn=e((()=>{A(),Mn=class{constructor(e,t){this.host=e,this.options=t,this.loading=!1,this.error=null,e.addController(this)}hostDisconnected(){this.reset()}reset(){this.binding?.dispose(),this.binding=void 0,this.loading=!1,this.error=null}synchronize(){if(this.binding?.matches())return;this.reset();let e=this.options.row(),t=this.options.captureScope();if(!e||!t)return;let{key:n,sessionId:r}=e,i=this.options.agentId(e,t),a=null,o={matches:()=>{let e=this.options.row();return this.options.isCurrent(t)&&a?.isCurrent()!==!1&&e?.key===n&&e.sessionId===r},dispose:()=>a?.dispose()},s=()=>this.binding===o&&o.matches(),c=async()=>{if(!this.loading&&s()){this.loading=!0,this.error=null,this.host.requestUpdate();try{for(;s()&&a?.isCurrent();){let e=a.captureReconcile(),{session:r}=await t.sessions.describe({key:n,agentId:i});if(!s()||e(r??void 0).status!==`invalidated`)break}}catch(e){s()&&(this.error=j(e))}finally{s()&&(this.loading=!1,this.host.requestUpdate())}}};this.binding=o,a=t.sessions.observeRow({key:n,agentId:i},()=>{s()&&this.host.requestUpdate()},{onInvalidate:()=>void c()}),e.rowMode===`compact`&&c()}}})))()}function Pn(e){let{context:t,row:n}=e,i=t.gateway.snapshot,a=v({agentsList:t.agents.state.agentsList,hello:i.hello}),o=ee(n,a),s=r([n],a),c=ut(n.placement),l=!(!c||c.blocksActiveRun&&n.hasActiveRun===!0||Ee(i,c.method)!==!0),u=f(n);return I`
    <zero-session-menu
      .session=${{label:B(n.label)??n.key,sessionId:B(n.sessionId)??null,pinned:n.pinned===!0,pinnable:u,snoozedUntil:n.snoozedUntil??null,unread:n.unread===!0,hiddenFromInvolvingMe:n.hiddenFromInvolvingMe,archived:n.archived===!0,archiving:t.sessions.archiveVisibility(n.key)===`pending`,category:B(n.category)??null,icon:B(n.icon)??null,color:B(n.color)??null,categoryClearReturnsToGroups:!1}}
      .anchor=${e.menu}
      .trigger=${e.trigger}
      .disabled=${e.disabled}
      .navigationAllowed=${!0}
      .copyMarkdownAllowed=${$t(i)}
      .splitAllowed=${!1}
      .actionDisabledReasons=${dt({snapshot:i,session:{...n,pinnable:u},cloudWorkerStopAction:c})}
      .forkDisabled=${n.modelSelectionLocked===!0}
      .forkFromLastCompleted=${n.hasActiveRun===!0}
      .archiveAllowed=${o}
      .deleteAllowed=${s}
      .cloudWorkerStopAllowed=${l}
      .groups=${e.groups}
      .currentOwner=${n.owner?.actor??null}
      .work=${e.work}
      .pluginActions=${Vt(t.plugins,n)}
      .onClose=${e.onClose}
      .onAction=${t=>{t.kind!==`snooze`&&t.kind!==`wake`&&e.onAction(t)}}
    ></zero-session-menu>
  `}function Fn(){return(Fn=e((()=>{L(),it(),mt(),De(),D(),jt(),Yt()})))()}function In(e,t){let n=B(e.category)??``,r=[...t.knownCategories];return n&&!r.includes(n)&&r.push(n),I`
    <td>
      <select
        ?disabled=${t.loading||!!t.groupWriteDisabledReason}
        title=${t.groupWriteDisabledReason??F}
        aria-label=${N(`sessionsView.moveToGroup`)}
        class="session-group-select"
        @change=${r=>{if(t.groupWriteDisabledReason)return;let i=r.currentTarget;if(i instanceof HTMLSelectElement){if(i.options[i.selectedIndex]?.dataset.action===`create`){i.value=n,t.onRequestNewCategory(e.key);return}t.onAssignCategory(e.key,i.value||null)}}}
      >
        <option value="" ?selected=${!n}>${N(`sessionsView.ungrouped`)}</option>
        ${r.map(e=>I`<option value=${e} ?selected=${n===e}>${e}</option>`)}
        <option data-action="create">${N(`sessionsView.newGroup`)}</option>
      </select>
    </td>
  `}function Ln(){return(Ln=e((()=>{L(),m()})))()}function Rn(e){let t=U(e),n=e.hasActiveRun===!1&&(!e.status||e.status===`running`),r=N(e.status===`queued`?`sessionsView.statusQueued`:t?`sessionsView.statusLive`:n?`sessionsView.statusIdle`:e.status&&zn[e.status]||`sessionsView.statusUnknown`),i=e.status===`queued`?`warn`:t||e.status===`done`?`ok`:n||!e.status||e.status===`interrupted`?`muted`:`danger`,a=`${N(`sessionsView.status`)}: ${r}`;return I`
    <zero-tooltip .content=${a}>
      ${G({kind:i,label:r})}
    </zero-tooltip>
  `}var zn;function Bn(){return(Bn=e((()=>{L(),W(),m(),zn={queued:`sessionsView.statusQueued`,running:`sessionsView.statusRunning`,done:`sessionsView.statusDone`,failed:`sessionsView.statusFailed`,interrupted:`sessionsView.statusInterrupted`,killed:`sessionsView.statusKilled`,timeout:`sessionsView.statusTimeout`}})))()}function Vn(e){let t=[[`activeMinutes`,`minutes`,N(`sessionsView.active`),N(`sessionsView.activeTooltip`,{count:e.activeMinutes.trim()}),N(`sessionsView.minutesPlaceholder`),e.statusFilter!==`active`],[`limit`,`limit`,N(`sessionsView.limit`),N(`sessionsView.limitTooltip`),F,!1]],n=[[`includeGlobal`,N(`sessionsView.global`),N(`sessionsView.globalTooltip`)],[`includeUnknown`,N(`sessionsView.unknown`),N(`sessionsView.unknownTooltip`)]],{activeMinutes:r,limit:i,includeGlobal:a,includeUnknown:o}=e,s=(t,n)=>e.onFiltersChange({activeMinutes:r,limit:i,includeGlobal:a,includeUnknown:o,[t]:n}),c=r.trim()!==``||i.trim()!==`50`||!a||o||e.groupBy!==`none`;return I`
    <button
      id="sessions-filter-popover-trigger"
      type="button"
      class="btn btn--sm sessions-filter-popover__trigger ${c?`active`:``}"
      title=${N(`sessionsView.filters`)}
      aria-label=${N(`sessionsView.filters`)}
      aria-haspopup="dialog"
      aria-expanded="false"
    >
      ${P.listFilter}
    </button>
    <wa-popover
      ${Se(wt)}
      class="sessions-filter-popover"
      for="sessions-filter-popover-trigger"
      placement="bottom-end"
      without-arrow
      @wa-show=${_t}
      @wa-hide=${_t}
    >
      <div class="sessions-filter-popover__panel">
        <div class="sessions-filter-popover__fields">
          ${t.map(([t,n,r,i,a,o])=>I`
              <zero-tooltip .content=${i}>
                <label class="session-filter-field">
                  <span class="session-filter-label">${r}</span>
                  <input
                    class="session-filter-input session-filter-input--${n}"
                    placeholder=${a}
                    .value=${e[t]}
                    ?disabled=${o}
                    @input=${e=>{e.currentTarget instanceof HTMLInputElement&&s(t,e.currentTarget.value)}}
                  />
                </label>
              </zero-tooltip>
            `)}
        </div>
        <div
          class="session-filter-toggle-group"
          role="group"
          aria-label=${N(`sessionsView.sourceFilters`)}
        >
          ${n.map(([t,n,r])=>I`
              <zero-tooltip .content=${r}>
                <label
                  class=${`session-filter-check session-filter-toggle${e[t]?` session-filter-check--active`:``}`}
                >
                  <input
                    name=${t}
                    class="session-filter-check__input"
                    type="checkbox"
                    .checked=${e[t]}
                    @change=${e=>{e.currentTarget instanceof HTMLInputElement&&s(t,e.currentTarget.checked)}}
                  />
                  <span class="session-filter-check__mark" aria-hidden="true">${P.check}</span>
                  <span class="session-filter-check__label">${n}</span>
                </label>
              </zero-tooltip>
            `)}
        </div>
        <label class="session-groupby">
          <span class="session-groupby__label">${N(`sessionsView.groupBy`)}</span>
          <select
            class="session-groupby__select"
            @change=${t=>{t.currentTarget instanceof HTMLSelectElement&&e.onGroupByChange(Bt(t.currentTarget.value))}}
          >
            ${Ut.filter(t=>t!==`person`||e.personGroupingAvailable).map(t=>I`
                <option value=${t} ?selected=${e.groupBy===t}>
                  ${N(Hn[t])}
                </option>
              `)}
          </select>
        </label>
        ${e.groupBy===`category`?I`
                <button
                  class="btn btn--sm"
                  ?disabled=${!!e.groupWriteDisabledReason}
                  title=${e.groupWriteDisabledReason??F}
                  @click=${()=>e.onRequestNewCategory()}
                >
                  ${P.plus} ${N(`sessionsView.newGroup`)}
                </button>
              `:F}
      </div>
    </wa-popover>
  `}var Hn;function Un(){return(Un=e((()=>{L(),ve(),he(),pe(),pt(),m(),q(),_(),Hn={none:`sessionsView.groupByNone`,category:`sessionsView.groupByCategory`,person:`sessionsView.groupByPerson`,channel:`sessionsView.groupByChannel`,kind:`sessionsView.groupByKind`,agent:`sessionsView.groupByAgent`,date:`sessionsView.groupByDate`}})))()}function Wn(e){let t=e.transcriptSearchQuery.trim().length>0,n=e.transcriptSearch,r=n.status===`results`?n.results:[],i=n.status===`results`?n.sessions:[],a=n.status===`loading`,o=n.status===`error`?I`${N(`sessionsView.transcriptSearchError`)}: ${n.message}`:n.status===`results`&&n.indexing?N(`sessionsView.transcriptSearchIndexing`):null;return I`
    <section
      class="sessions-transcript-search"
      aria-label=${N(`sessionsView.transcriptSearchTitle`)}
    >
      <form
        class="sessions-transcript-search__form"
        role="search"
        aria-label=${N(`sessionsView.transcriptSearchTitle`)}
        @submit=${n=>{n.preventDefault(),e.transcriptSearchAvailable&&t&&!a&&e.onTranscriptSearch()}}
      >
        <div class="data-table-search sessions-transcript-search__input">
          <input
            type="search"
            maxlength="4096"
            aria-label=${N(`sessionsView.transcriptSearchInputLabel`)}
            placeholder=${N(`sessionsView.transcriptSearchPlaceholder`)}
            .value=${e.transcriptSearchQuery}
            ?disabled=${!e.transcriptSearchAvailable}
            @input=${t=>{t.currentTarget instanceof HTMLInputElement&&e.onTranscriptSearchChange(t.currentTarget.value)}}
          />
        </div>
        <button
          class="btn primary"
          type="submit"
          ?disabled=${!e.transcriptSearchAvailable||!t||a}
        >
          ${N(a?`sessionsView.transcriptSearchSearching`:`sessionsView.transcriptSearchAction`)}
        </button>
        ${t?I`
                <button class="btn" type="button" @click=${e.onClearTranscriptSearch}>
                  ${N(`sessionsView.transcriptSearchClear`)}
                </button>
              `:F}
      </form>
      ${e.transcriptSearchAvailable?F:I`
              <div class="muted" role="status">
                ${N(`sessionsView.transcriptSearchUnavailable`)}
              </div>
            `}
      <div
        class="sessions-transcript-search__status"
        aria-live="polite"
        aria-busy=${a?`true`:`false`}
      >
        ${a?I`<span class="muted">${N(`sessionsView.transcriptSearchSearching`)}</span>`:F}
        ${o===null?F:Ce(n.status,I`
                  <div
                    class=${n.status===`error`?`sessions-transcript-search__notice sessions-transcript-search__notice--danger`:`sessions-transcript-search__notice`}
                  >
                    <span>${o}</span>
                    <button class="btn btn--sm" type="button" @click=${e.onTranscriptSearch}>
                      ${N(`sessionsView.transcriptSearchRetry`)}
                    </button>
                  </div>
                `)}
        ${n.status===`results`&&n.archivedTranscriptsExcluded>0?I`<div class="sessions-transcript-search__notice">
                ${N(`sessionsView.transcriptSearchArchivedExcluded`,{count:String(n.archivedTranscriptsExcluded)})}
              </div>`:F}
        ${n.status===`results`&&r.length===0&&!n.indexing?I`
                <div class="sessions-transcript-search__empty" role="status">
                  ${N(`sessionsView.transcriptSearchEmpty`)}
                </div>
              `:F}
        ${r.length>0?I`
                <div class="sessions-transcript-search__results">
                  <div class="sessions-transcript-search__summary">
                    <strong
                      >${N(`sessionsView.transcriptSearchMatches`,{count:String(r.length)})}</strong
                    >
                    ${n.status===`results`&&n.truncated?I`<span class="muted"
                            >${N(`sessionsView.transcriptSearchTruncated`)}</span
                          >`:F}
                  </div>
                  <div class="sessions-transcript-search__list">
                    ${r.map(t=>{let n=i.find(e=>e.key===t.sessionKey),r=B(n?.label)??B(n?.displayName)??t.sessionKey,a=t.timestamp>0?ce(t.timestamp):N(`common.na`),o=t.timestamp>0?g(t.timestamp):a;return I`
                        <button
                          class="sessions-transcript-search__result"
                          type="button"
                          @click=${()=>e.onNavigateToChat(t.sessionKey)}
                        >
                          <span class="sessions-transcript-search__result-header">
                            <strong>${r}</strong>
                            <span class="muted" title=${o}>
                              ${N(`sessionsView.${t.role}`)} · ${a}
                            </span>
                          </span>
                          <span class="sessions-transcript-search__snippet">${t.snippet}</span>
                          <span class="sessions-transcript-search__key">${t.sessionKey}</span>
                        </button>
                      `})}
                  </div>
                </div>
              `:F}
      </div>
    </section>
  `}function Gn(){return(Gn=e((()=>{L(),xe(),m(),Le(),b(),Fe()})))()}function Kn(e,t){return Object.hasOwn(e,t)?e[t]??null:null}function Y(e,t=!1){return e.map(e=>({value:e,label:N(e===``?`sessionsView.inherit`:t&&e===`off`?`sessionsView.offExplicit`:`sessionsView.${e}`)}))}function qn(e){let t=E(e);return I`
    <span class="session-avatar session-avatar--${t}" aria-hidden="true">
      ${Q[t]??P.circle}
      ${U(e)?I`<span class="session-avatar__status"></span>`:F}
    </span>
  `}function Jn(e){let t=e.totalTokens;if(typeof t!=`number`||!Number.isFinite(t))return I`<span class="muted">${N(`common.na`)}</span>`;let n=e.totalTokensFresh!==!1,r=`${n?``:`~`}${ne(t)}`,i=Gt(e),a=i.tokens>0?i.tokens:null;if(!a)return I`<span class="session-tokens__value">${r}</span>`;let o=Math.min(100,Math.round(t/a*100)),s=n?o>=fr?`danger`:o>=dr?`warn`:`ok`:`stale`,c=i.fromLastPrompt?`promptBudgetUsage`:`contextUsage`,l=N(`sessionsView.${c}${n?``:`Approx`}`,{percent:String(o),used:t.toLocaleString(),context:a.toLocaleString()});return I`
    <zero-tooltip .content=${l}>
      <div class="session-tokens">
        <span class="session-tokens__value"
          >${r} / ${ne(a)}</span
        >
        ${un({mode:`continuous`,percent:o,tone:s,label:l})}
      </div>
    </zero-tooltip>
  `}function Yn(e,t,n){let r=e.filter(e=>e.unread===!0&&e.archived!==!0).length,i=e.filter(e=>e.archived===!0).length,a=[[String(t),N(`sessionsView.statusLive`),t>0],[String(r),N(`sessionsView.unread`),r>0]];return n!==`active`&&a.push([String(i),N(`sessionsView.archived`),!1]),I`
    <span class="sessions-heading-facts">
      ${a.map(([e,t,n],r)=>I`
          ${r>0?I`<span class="sessions-heading-fact__separator" aria-hidden="true">·</span>`:F}
          <span
            class=${n?`sessions-heading-fact sessions-heading-fact--active`:`sessions-heading-fact`}
          >
            <strong>${e}</strong> ${t}
          </span>
        `)}
    </span>
  `}function Xn(e){return Array.from({length:pr},(t,n)=>I`
      <tr class="session-skeleton-row" aria-hidden="true">
        ${Array.from({length:e},(e,t)=>t===0?I`<td class="data-table-checkbox-col"></td>`:I`<td>
                <span
                  class="session-skeleton ${t===1?`session-skeleton--key`:``}"
                  style=${`animation-delay: ${n*120}ms`}
                ></span>
              </td>`)}
      </tr>
    `)}function Zn(e){return typeof e!=`number`||!Number.isFinite(e)||e<0?null:ke(e)??`0ms`}function Qn(e){if(!e)return F;let t=e.status===`active`||e.status===`complete`?`ok`:`warn`,n=z(e);return I`
    <zero-tooltip .content=${n}>
      <span tabindex="0" aria-label=${n}>
        ${G({kind:t,label:we(e)})}
      </span>
    </zero-tooltip>
  `}function $n(e,t){let n=[{label:N(`sessionsView.key`),value:e.key},{label:N(`sessionsView.kind`),value:E(e)},{label:N(`sessionsView.updated`),value:t},{label:N(`sessionsView.tokens`),value:Zt(e)}],r=(e,t)=>{let r=B(t);r&&n.push({label:e,value:r})};r(N(`sessionsView.group`),e.category),r(N(`sessionsView.status`),e.status),e.goal&&n.push({label:N(`sessionsView.goal`),value:z(e.goal)}),r(N(`sessionsView.goalNote`),e.goal?.lastStatusNote),r(N(`sessionsView.model`),e.model),r(N(`sessionsView.provider`),e.modelProvider),r(N(`sessionsView.runtime`),qe(e.agentRuntime)),r(N(`sessionsView.runDuration`),Zn(e.runtimeMs)),r(N(`sessionsView.surface`),e.surface),r(N(`sessionsView.subject`),e.subject),r(N(`sessionsView.room`),e.room),r(N(`sessionsView.space`),e.space),r(N(`sessionsView.sessionId`),e.sessionId),e.archiveReason&&n.push({label:N(`sessionsView.archiveReason`),value:an(e.archiveReason)});for(let[t,r]of[[N(`sessionsView.activeRun`),e.hasActiveRun],[N(`sessionsView.archived`),e.archived],[N(`sessionsView.pinned`),e.pinned]])typeof r==`boolean`&&n.push({label:t,value:N(r?`common.yes`:`common.no`)});return n}function X(e){return e.groupBy===`category`?8:7}function er(e,t){let{id:n}=e;if(t.groupBy===`date`)return N({today:`sessionsView.dateToday`,yesterday:`sessionsView.dateYesterday`,week:`sessionsView.dateThisWeek`,older:`sessionsView.dateOlder`}[n]??`sessionsView.dateNoActivity`);if(n===``)return N(`sessionsView.ungrouped`);if(t.groupBy===`agent`){let e=Kn(t.agentIdentityById,n),r=B(e?.name);if(r){let t=B(e?.emoji);return t?`${t} ${r}`:r}}if(t.groupBy===`person`){let t=e.rows[0]?.owner?.actor;return t?.identity?.type===`profile`?Wt({id:t.identity.id,name:t.label?.trim()||n}):t?.label?.trim()||n}return n}function Z(e,t){e.currentTarget?.classList.toggle(`session-drop-target--active`,t)}function tr(e,t){if(e.groupBy!==`category`||e.groupWriteDisabledReason)return{dragover:F,dragleave:F,drop:F};let n=e=>e.dataTransfer?.types.includes(K)===!0;return{dragover:e=>{n(e)&&(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect=`move`),Z(e,!0))},dragleave:e=>Z(e,!1),drop:r=>{if(!n(r))return;r.preventDefault(),Z(r,!1);let i=r.dataTransfer?.getData(K);i&&e.onAssignCategory(i,t)}}}function nr(e,t){let n=er(e,t),r=N(e.rows.length===1?`sessionsView.groupRowCountOne`:`sessionsView.groupRowCount`,{count:String(e.rows.length)}),i=tr(t,e.id===``?null:e.id);return I`
    <tr
      class="session-group-row"
      @dragover=${i.dragover}
      @dragleave=${i.dragleave}
      @drop=${i.drop}
    >
      <td colspan=${X(t)}>
        <div class="session-group-row__header">
          <span class="session-group-row__icon" aria-hidden="true">${P.folder}</span>
          <span class="session-group-row__label">${n}</span>
          <span class="session-group-row__count">${r}</span>
        </div>
      </td>
    </tr>
  `}function rr(e){return e instanceof Element&&!!e.closest(`a, button, input, label, select, textarea`)}function ir(e){let t=e.result?.sessions??[],n=t.filter(U).length,r=t.filter(e=>e.archived===!0).length,i=I`
    ${N(`sessionsView.title`)}
    ${e.result?I`
            <zero-tooltip .content=${N(`sessionsView.store`,{path:e.result.path})}>
              <span class="settings-count">${t.length}</span>
            </zero-tooltip>
          `:F}
    ${e.result?Yn(t,n,e.statusFilter):F}
  `,a=I`
    ${e.statusFilter===`archived`?I`
            <button
              class="btn danger"
              ?disabled=${e.loading||r===0||!!e.deleteArchivedDisabledReason}
              title=${e.deleteArchivedDisabledReason??F}
              @click=${e.onDeleteAllArchived}
            >
              ${P.trash} ${N(`sessionsView.deleteAllArchived`)}
            </button>
          `:F}
    <button class="btn" ?disabled=${e.refreshing} @click=${e.onRefresh}>
      ${e.refreshing?N(`common.loading`):N(`common.refresh`)}
    </button>
  `,o=[e.error?I`<div class="sessions-error" role="alert">${e.error}</div>`:F,lt({title:N(`sessionsView.transcriptSearchTitle`)},Wn(e)),lt({title:i,actions:a},ar(e))];return rt(o,{wide:!0})}function ar(e){let t=e.result?.sessions??[],n=e.sortDir===`asc`?1:-1,r=t.toSorted((t,r)=>{let i=(r.pinnedAt??0)-(t.pinnedAt??0);return i===0?(e.sortColumn===`kind`?E(t).localeCompare(E(r)):e.sortColumn===`key`?t.key.localeCompare(r.key):e.sortColumn===`updated`?(t.updatedAt??0)-(r.updatedAt??0):(t.totalTokens??t.inputTokens??t.outputTokens??0)-(r.totalTokens??r.inputTokens??r.outputTokens??0))*n:i}),i=r.length,a=Math.max(1,Math.ceil(i/e.pageSize)),o=Math.min(e.page,a-1),s=e.groupBy===`none`?null:Kt({rows:r,mode:e.groupBy,knownCategories:e.knownCategories}),c=(s?s.flatMap(e=>e.rows):r).slice(o*e.pageSize,(o+1)*e.pageSize),l=t.length===0&&(Ke(e.searchQuery).length>0||V(e.activeMinutes)!==void 0||!e.includeGlobal),u=N(l?`sessionsView.noSessionsMatchFilters`:e.statusFilter===`archived`?`sessionsView.noArchivedSessions`:e.statusFilter===`active`?`sessionsView.noActiveSessions`:`sessionsView.noSessions`),d=(t,n,r=``)=>{let i=e.sortColumn===t,a=!i||e.sortDir===`asc`?`desc`:`asc`;return I`
      <th
        class=${r}
        data-sortable
        data-sort-dir=${i?e.sortDir:``}
        aria-sort=${i?e.sortDir===`asc`?`ascending`:`descending`:F}
        @click=${()=>e.onSortChange(t,a)}
      >
        <button class="data-table-sort-button" type="button">
          ${n}
          <span class="data-table-sort-icon" aria-hidden="true">${P.arrowUpDown}</span>
        </button>
      </th>
    `},f=s?new Set(c.map(e=>e.key)):null;return I`
    <div
      class="sessions-toolbar sessions-filter-bar"
      role="group"
      aria-label=${N(`sessionsView.filterControls`)}
    >
      <div class="data-table-search sessions-toolbar__search">
        ${P.search}
        <input
          type="text"
          aria-label=${N(`sessionsView.searchPlaceholder`)}
          placeholder=${N(`sessionsView.searchPlaceholder`)}
          .value=${e.searchQuery}
          @input=${t=>e.onSearchChange(t.target.value)}
        />
      </div>
      ${ct({value:e.statusFilter,ariaLabel:N(`sessionsView.sessionState`),className:`sessions-view-segment`,options:[{value:`active`,label:N(`common.active`)},{value:`archived`,label:N(`sessionsView.archived`),title:N(`sessionsView.archivedOnlyTooltip`)},{value:`all`,label:N(`sessionsView.all`)}],onChange:t=>e.onStatusFilterChange(t)})}
      ${Vn(e)}
    </div>

    ${e.selectedKeys.size>0?I`
            <div class="data-table-bulk-bar">
              <span>${N(`sessionsView.selected`,{count:String(e.selectedKeys.size)})}</span>
              <button class="btn btn--sm" @click=${e.onDeselectAll}>
                ${N(`common.unselect`)}
              </button>
              <button
                class="btn btn--sm danger"
                ?disabled=${e.loading||!!e.deleteSelectedDisabledReason}
                title=${e.deleteSelectedDisabledReason??F}
                @click=${e.onDeleteSelected}
              >
                ${P.trash} ${N(`sessionsView.deleteSelected`)}
              </button>
            </div>
          `:F}

    <div class="data-table-container">
      <table class="data-table sessions-table">
        <thead>
          <tr>
            <th class="data-table-checkbox-col">
              ${c.length>0?I`<input
                      type="checkbox"
                      .checked=${c.every(t=>e.selectedKeys.has(t.key))}
                      .indeterminate=${c.some(t=>e.selectedKeys.has(t.key))&&!c.every(t=>e.selectedKeys.has(t.key))}
                      @change=${()=>{(c.every(t=>e.selectedKeys.has(t.key))?e.onDeselectPage:e.onSelectPage)(c.map(e=>e.key))}}
                      aria-label=${N(`sessionsView.selectAllOnPage`)}
                    />`:F}
            </th>
            ${d(`key`,N(`sessionsView.key`),`data-table-key-col`)}
            ${e.groupBy===`category`?I`<th>${N(`sessionsView.group`)}</th>`:F}
            ${d(`kind`,N(`sessionsView.kind`))}
            <th class="session-status-col">${N(`sessionsView.status`)}</th>
            ${d(`updated`,N(`sessionsView.updated`))}
            ${d(`tokens`,N(`sessionsView.tokens`))}
            <th class="session-actions-col">
              <span class="sr-only">${N(`sessionsView.actions`)}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          ${e.loading&&!e.result?Xn(X(e)):c.length===0&&(e.loading||e.error||!e.result)?F:c.length===0?I`
                      <tr>
                        <td
                          colspan=${X(e)}
                          class="data-table-empty-cell"
                        >
                          <div class="data-table-empty-state" role="status" aria-live="polite">
                            <div class="data-table-empty-state__message">
                              ${l?P.search:P.messageSquare}
                              <span>${u}</span>
                            </div>
                            ${l?I`
                                    <button class="btn btn--sm" @click=${e.onClearFilters}>
                                      ${N(`sessionsView.showAll`)}
                                    </button>
                                  `:F}
                          </div>
                        </td>
                      </tr>
                    `:s?s.flatMap(t=>{let n=t.rows.filter(e=>f?.has(e.key));if(n.length===0&&t.rows.length>0)return[];let r=n.flatMap(t=>or(t,e));return r.unshift(nr(t,e)),r}):c.flatMap(t=>or(t,e))}
        </tbody>
      </table>
    </div>

    ${i>0?I`
            <div class="data-table-pagination">
              <div class="data-table-pagination__info">
                ${N(`sessionsView.pagination`,{start:String(o*e.pageSize+1),end:String(Math.min((o+1)*e.pageSize,i)),total:String(i)})}
              </div>
              <div class="data-table-pagination__controls">
                <select
                  class="data-table-pagination__size"
                  aria-label=${N(`sessionsView.pageSize`)}
                  .value=${String(e.pageSize)}
                  @change=${t=>e.onPageSizeChange(Number(t.target.value))}
                >
                  ${ur.map(t=>I`<option value=${t} ?selected=${t===e.pageSize}>
                        ${N(`sessionsView.rowsPerPage`,{count:String(t)})}
                      </option>`)}
                </select>
                ${e.result?.hasMore&&e.result.nextOffset!=null?I` <button ?disabled=${e.loading} @click=${e.onLoadMore}>
                        ${N(`chat.selectors.loadMoreRosterSessions`)}
                      </button>`:F}
                <button ?disabled=${o<=0} @click=${()=>e.onPageChange(o-1)}>
                  ${N(`common.previous`)}
                </button>
                <button
                  ?disabled=${o>=a-1}
                  @click=${()=>e.onPageChange(o+1)}
                >
                  ${N(`common.next`)}
                </button>
              </div>
            </div>
          `:F}
  `}function or(e,n){let r=e.updatedAt?ce(e.updatedAt):N(`common.na`),i=n.expandedSessionKey===e.key,o=`session-details-${encodeURIComponent(e.key)}`,s=B(e.displayName)??null,l=B(e.label)??``,u=!!(s&&s!==e.key&&s!==l),d=t(e.key),f=d?Kn(n.agentIdentityById,d.agentId):null,p=B(f?.emoji)??``,m=B(f?.name)??``,h=m&&d?`${p?`${p} `:``}${m} (${d.channel})`:null,g=h??e.key,_=e.kind!==`global`,ee=_?S({face:c(e),sessionKey:e.key,fallbackAgentId:n.agentId,basePath:n.basePath,row:e,mainKey:n.mainKey}).href:null,v=E(e),y=`session-kind session-kind--${v}`,b=[`session-data-row`,`session-data-row--expandable`,n.statusFilter===`all`&&e.archived===!0?`session-data-row--archived`:``,i?`session-data-row--expanded`:``,n.sessionMenu?.key===e.key?`session-data-row--menu-open`:``].filter(Boolean).join(` `),x=N(i?`sessionsView.hideSessionDetails`:`sessionsView.showSessionDetails`,{count:g}),C=n.groupBy===`category`,w=tr(n,B(e.category)??null),T=t=>Oe(t,t instanceof KeyboardEvent?t.currentTarget.querySelector(`button[aria-haspopup="menu"]`):null,(t,r,i)=>n.onOpenSessionMenu(e,{x:r,y:i},t));return[I`<tr
      class=${b}
      tabindex="0"
      aria-controls=${i?o:F}
      draggable=${C?`true`:F}
      aria-description=${C?N(`sessionsView.dragSessionHint`):F}
      @dragstart=${C?t=>{t.dataTransfer?.setData(K,e.key),t.dataTransfer&&(t.dataTransfer.effectAllowed=`move`)}:F}
      @dragover=${w.dragover}
      @dragleave=${w.dragleave}
      @drop=${w.drop}
      @contextmenu=${T}
      @click=${t=>{rr(t.target)||n.onToggleDetails(e.key)}}
      @keydown=${t=>{T(t),!(t.defaultPrevented||rr(t.target))&&(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),n.onToggleDetails(e.key))}}
    >
      <td class="data-table-checkbox-col">
        <input
          type="checkbox"
          .checked=${n.selectedKeys.has(e.key)}
          @change=${()=>n.onToggleSelect(e.key)}
          aria-label=${`${N(`sessionsView.selectSession`)}: ${e.key}`}
        />
      </td>
      <td class="data-table-key-col">
        <zero-tooltip .content=${g}>
          <div class=${h?`session-key-cell`:`mono session-key-cell`}>
            ${qn(e)}
            <div class="session-key-cell__text">
              <span class="session-key-cell__primary">
                ${e.unread===!0?I`<span
                        class="session-unread-dot"
                        role="img"
                        aria-label=${N(`sessionsView.unread`)}
                      ></span>`:F}
                ${_?I`<a
                        href=${ee}
                        class="session-link"
                        @click=${t=>{a(t)&&(t.preventDefault(),n.onNavigateToChat(e.key))}}
                        >${h??e.key}</a
                      >`:I`<span>${h??e.key}</span>`}
                ${l?I`<span class="session-label-chip" title=${l}
                        >${l}</span
                      >`:F}
              </span>
              ${e.kind===`global`&&!e.agentId?F:ft(M(e.key)?.agentId??e.agentId)}
              ${u?I`<span class="muted session-key-display-name">${s}</span>`:F}
            </div>
          </div>
        </zero-tooltip>
      </td>
      ${C?In(e,n):F}
      <td>
        <span class=${y}>${v}</span>
      </td>
      <td class="session-status-col">
        <div class="session-status-stack">
          ${Rn(e)} ${Qn(e.goal)}
          ${n.statusFilter===`all`&&e.archived===!0?G({kind:`muted`,label:N(`sessionsView.archived`)}):F}
        </div>
      </td>
      <td>${r}</td>
      <td class="session-token-cell">${Jn(e)}</td>
      <td class="session-actions-cell">
        <div class="session-actions">
          <button
            class="session-details-toggle"
            type="button"
            aria-expanded=${String(i)}
            aria-controls=${i?o:F}
            aria-label=${x}
            @click=${t=>{t.stopPropagation(),n.onToggleDetails(e.key)}}
          >
            ${P.chevronDown}
          </button>
          <button
            class="icon-btn"
            type="button"
            title=${N(`chat.sidebar.openSessionMenu`)}
            aria-label=${N(`chat.sidebar.openSessionMenu`)}
            aria-haspopup="menu"
            aria-expanded=${String(n.sessionMenu?.key===e.key)}
            @click=${t=>{t.stopPropagation();let r=t.currentTarget,i=r.getBoundingClientRect();n.onOpenSessionMenu(e,{x:i.right,y:i.bottom+4},r)}}
          >
            ${P.moreHorizontal}
          </button>
        </div>
      </td>
    </tr>`,...i?[te()]:[]];function te(){let t=n.labelDisabledReason?.(e),i=e.thinkingLevel??``,a=i?Ie(i):``,c=e.fastMode===void 0?``:nn(e.fastMode),l=ze({catalog:[],session:e,defaults:n.result?.defaults,sessionKey:e.key,sessionsResult:null}),d=[{label:N(`sessionsView.thinking`),current:a,options:[{value:``,label:l.inherited.displayLabel},...l.options],onChange:t=>n.onPatch(e.key,{thinkingLevel:t||null})},{label:N(`sessionsView.fast`),current:c,options:Y(cr),onChange:t=>n.onPatch(e.key,{fastMode:Ve(t)??null})},{label:N(`sessionsView.verbose`),current:e.verboseLevel??``,options:Y(sr,!0),onChange:t=>n.onPatch(e.key,{verboseLevel:t||null})},{label:N(`sessionsView.reasoning`),current:e.reasoningLevel??``,options:Y(lr),onChange:t=>n.onPatch(e.key,{reasoningLevel:t||null})}];return I`<tr id=${o} class="session-details-row">
      <td colspan=${X(n)}>
        <div class="session-details-panel">
          <div class="session-details-panel__hero">
            <div>
              <div class="session-details-panel__eyebrow">${N(`sessionsView.sessionDetails`)}</div>
              <div class="session-details-panel__title">${h??e.key}</div>
              ${u?I`<div class="muted session-details-panel__subtitle">${s}</div>`:F}
            </div>
            <div class="session-details-panel__badges">
              ${Rn(e)} ${Qn(e.goal)}
              <span class=${y}>${E(e)}</span>
            </div>
          </div>

          <div class="session-details-section">
            <div class="session-details-panel__eyebrow">${N(`sessionsView.overrides`)}</div>
            <div class="session-overrides-grid">
              <label class="session-override-field">
                <span class="session-override-field__label">${N(`sessionsView.label`)}</span>
                <input
                  class="settings-input"
                  .value=${e.label??``}
                  ?disabled=${n.loading||!!t}
                  title=${t??F}
                  placeholder=${N(`sessionsView.optionalPlaceholder`)}
                  @change=${t=>{let r=B(t.target.value)??null;n.onPatch(e.key,{label:r},{sessionScope:!0})}}
                />
              </label>
              ${d.map(({label:e,current:t,options:r,onChange:i})=>{let a=!t||r.some(e=>e.value===t)?r:[...r,{value:t,label:Pe(t)}];return I`
                  <label class="session-override-field">
                    <span class="session-override-field__label">${e}</span>
                    <select
                      class="settings-select"
                      ?disabled=${n.loading||!!n.patchAdminDisabledReason}
                      title=${n.patchAdminDisabledReason??F}
                      @change=${e=>i(e.target.value)}
                    >
                      ${a.map(e=>I`
                          <option value=${e.value} ?selected=${t===e.value}>
                            ${e.label}
                          </option>
                        `)}
                    </select>
                  </label>
                `})}
            </div>
          </div>

          <div class="session-details-grid">
            ${$n(e,r).map(e=>I`
                <div class="session-detail-stat">
                  <div class="session-detail-stat__label">${e.label}</div>
                  <zero-tooltip .content=${e.value}>
                    <div class="session-detail-stat__value">${e.value}</div>
                  </zero-tooltip>
                </div>
              `)}
          </div>
        </div>
      </td>
    </tr>`}}var sr,cr,lr,ur,Q,dr,fr,pr;function mr(){return(mr=e((()=>{Qe(),L(),He(),tn(),bt(),dn(),he(),W(),m(),pe(),at(),Re(),Be(),b(),Ne(),Xt(),Ht(),ie(),Nt(),q(),x(),rn(),D(),Ln(),Bn(),Un(),Gn(),sr=[``,`off`,`on`,`full`],cr=[``,`auto`,`on`,`off`],lr=[``,`off`,`on`,`stream`],ur=[10,25,50,100],Q={cron:P.clock,direct:P.messageSquare,group:P.users,global:P.globe,unknown:P.circle},dr=65,fr=85,pr=4})))()}var hr,gr,$;function _r(){return(_r=e((()=>{Ge(),tt(),Qe(),L(),ye(),Ue(),le(),me(),ue(),xt(),ln(),it(),St(),ht(),nt(),Et(),pn(),W(),gt(),m(),s(),je(),A(),De(),ae(),y(),Pt(),zt(),T(),Mt(),x(),D(),jt(),_(),sn(),Dt(),It(),p(),d(),Yt(),_n(),yn(),Sn(),wn(),En(),kn(),Nn(),Fn(),mr(),hr=`http://127.0.0.1:18789/concepts/session`,gr=200,$=class extends re{constructor(...e){super(...e),this.result=null,this.loading=!1,this.refreshing=!1,this.error=null,this.activeMinutes=``,this.limit=`50`,this.includeGlobal=!0,this.includeUnknown=!1,this.statusFilter=`active`,this.searchQuery=``,this.transcriptSearchQuery=``,this.submittedTranscriptSearchQuery=``,this.sortColumn=`updated`,this.sortDir=`desc`,this.groupBy=Dn(),this.page=0,this.pageSize=25,this.selectedSessions=new Map,this.sessionMenu=null,this.sessionMenuWork=null,this.expandedSessionKey=null,this.deepLinkSessionKey=null,this.pageEpoch=0,this.pluginActionLifetime=new AbortController,this.routeDataEnabled=!0,this.sessionMutationPending=!1,this.sessionMenuTrigger=null,this.details=new Mn(this,{captureScope:()=>this.captureRequestScope(),isCurrent:e=>this.isRequestScopeCurrent(e),row:()=>this.result?.sessions.find(e=>e.key===this.expandedSessionKey),agentId:(e,t)=>e.agentId??this.sessionPathAgentId(e.key,t.context)}),this.inputDialog=new Tn(e=>{this.error=e}),this.observeAgentScope=Ae(()=>{this.retirePageOperations(),this.resetTranscriptSearchState(this.transcriptSearchQuery),this.deepLinkSessionKey||(this.page=0,this.selectedSessions=new Map,this.routeDataEnabled=!1,this.clearSearchTimer(),this.bindSessionList()),this.requestUpdate()}),this.subscriptions=new o(this).watchStore(()=>this.context?.agentIdentity).effect(()=>this.context?.agentSelection,e=>this.observeAgentScope(e)).watchStore(()=>this.context?.runtimeConfig).watchStore(()=>this.context?.plugins),this.gatewayLifecycle=new Ft(this,{getGateway:()=>this.context?.gateway,onIdentityChange:()=>{let e=this.listBinding?.sessions.listSnapshot(this.listBinding.query).result;this.resetProviderState(),this.appliedListResult=e},invalidateRequests:()=>this.invalidatePageWork()}),this.transcriptSearchTask=new $e(this,{args:()=>{let e=this.context,t=e?.gateway.snapshot;return[t?.phase===`connected`?t.client??null:null,this.submittedTranscriptSearchQuery,e??null,e?.agentSelection.state.scopeId??null]},task:async([e,t,n,r],{signal:i})=>{if(!e||!t||!n)return et;let{sessions:a,results:o,indexing:s=!1,truncated:c=!1,archivedTranscriptsExcluded:l=0}=await on({client:e,query:t,listOptions:this.sessionListOptions(n,``),isCurrent:()=>!i.aborted});return{sessions:a,results:o,indexing:s,truncated:c,archivedTranscriptsExcluded:l}}})}willUpdate(e){let t=this.context?.sessions;t&&this.listBinding&&this.listBinding.sessions!==t&&(this.unsubscribeList?.(),this.unsubscribeList=void 0,this.listBinding=void 0,this.invalidatePageWork(),this.resetProviderState()),(e.has(`routeData`)||e.has(`context`))&&this.applyRouteData(),this.bindSessionList(),this.details.synchronize()}disconnectedCallback(){this.unsubscribeList?.(),this.unsubscribeList=void 0,this.listBinding=void 0,this.subscriptions.clear(),this.invalidatePageWork(),this.inputDialog.abort(),super.disconnectedCallback()}retirePageOperations(){this.details.reset(),this.pluginActionLifetime.abort(),this.pluginActionLifetime=new AbortController,this.pageEpoch+=1,this.sessionMutationPending=!1,this.closeSessionMenu()}invalidatePageWork(){this.retirePageOperations(),this.clearSearchTimer(),this.listRequest=void 0,this.resetTranscriptSearchState(this.transcriptSearchQuery),this.loading=!1,this.refreshing=!1}resetProviderState(){this.result=null,this.error=null,this.loading=!1,this.refreshing=!1,this.resetTranscriptSearchState(``),this.selectedSessions=new Map,this.expandedSessionKey=null,this.deepLinkSessionKey=null,this.appliedListResult=void 0}captureRequestScope(){let e=this.context;if(!this.isConnected||!e)return null;let t=e.gateway,n=this.gatewayLifecycle.gateway===t?this.gatewayLifecycle.client:null;return!this.gatewayLifecycle.connected||!n?null:{epoch:this.pageEpoch,context:e,gateway:t,sessions:e.sessions,client:n}}isRequestScopeCurrent(e){let t=this.context,n=t?.gateway;return this.isConnected&&this.pageEpoch===e.epoch&&t===e.context&&n===e.gateway&&t.sessions===e.sessions&&n.snapshot.phase===`connected`&&n.snapshot.client===e.client}publishRequestError(e,t){return this.isRequestScopeCurrent(e)?(this.error=j(t),`failed`):`stale`}mutationDisabledReason(e){let t=i(this.context?.gateway.snapshot,e);return t.allowed?void 0:t.reason}requireMutationAccess(e,t){let n=i(e.gateway.snapshot,t);return n.allowed?!0:(this.error=n.reason,!1)}selectedDeleteDisabledReason(){for(let e of this.selectedSessions.values()){let t=this.mutationDisabledReason({method:`sessions.delete`,params:{key:e.key,...e.archived===!0?{archivedOnly:!0}:{}}});if(t)return t}}applyRouteData(){let e=this.routeData,t=this.context;e&&t&&(e!==this.appliedRouteData&&(this.appliedRouteData=e,this.routeDataEnabled=!0),this.routeDataEnabled&&(this.statusFilter=e.statusFilter,this.activeMinutes=``,this.limit=`50`,this.includeGlobal=!0,this.includeUnknown=!!e.expandedSessionKey,e.expandedSessionKey&&(this.searchQuery=``,this.page=0,this.selectedSessions=new Map),this.expandedSessionKey=e.expandedSessionKey,this.deepLinkSessionKey=e.expandedSessionKey))}sessionAgentId(e,t=this.context){if(!t)return;let{agentId:n}=l({assistantAgentId:t.agentSelection.state.selectedId,hello:t.gateway.snapshot.hello},e);return n}sessionPathAgentId(e,t){return this.sessionAgentId(e,t)??O(t)}sessionListOptions(e,t=this.searchQuery){return Cn(e,{activeMinutes:V(this.activeMinutes),limit:V(this.limit)??50,includeGlobal:this.includeGlobal,includeUnknown:this.includeUnknown,statusFilter:this.statusFilter,deepLinkSessionKey:this.deepLinkSessionKey,search:t})}bindSessionList(e=!0){let t=this.context;if(!t||!this.isConnected)return;let n=t.sessions,r=this.sessionListOptions(t),i=JSON.stringify(r),a=this.listBinding,o=JSON.stringify(this.sessionListOptions(t,``));(a?.sessions!==n||a.key!==i)&&(a?.sessions===n&&n.listSnapshot(a.query).loading&&this.loadSessionList(a),this.unsubscribeList?.(),this.unsubscribeList=void 0,(a?.sessions!==n||a.transcriptKey!==o)&&this.resetTranscriptSearchState(this.transcriptSearchQuery),this.result=null,this.error=null,this.selectedSessions=new Map,this.page=0,this.listBinding={sessions:n,query:r,key:i,transcriptKey:o},this.appliedListResult=void 0);let s=this.listBinding;if(this.unsubscribeList||(this.loading=t.gateway.snapshot.phase===`connected`,!this.captureRequestScope()||this.searchTimer!==void 0||this.listRequest))return s;let c=e=>{this.applyListSnapshot(s,e)};this.unsubscribeList=n.subscribeList(r,c);let l=n.listSnapshot(r);return c(l),e&&(!l.result||l.loading)&&this.loadSessionList(s),s}applyListSnapshot(e,t){if(this.listBinding!==e||this.context?.sessions!==e.sessions)return;this.loading=t.loading,this.error=t.error;let r=t.result;r&&(r!==this.appliedListResult&&(this.appliedListResult=r,this.result=n(r,{archivedFilter:this.statusFilter}),gn(this.context?.agentIdentity,this.result)),!t.loading&&!t.error&&this.result&&this.selectedSessions.size>0&&(this.selectedSessions=An(this.selectedSessions,this.result.sessions,t=>e.sessions.deletionState(t.key,this.sessionAgentId(t.key),t.sessionId)===`pending`||e.sessions.archiveVisibility(t.key)===`pending`)))}async refreshSessionList(e=this.captureRequestScope()){if(!e)return;this.routeDataEnabled=!1,this.clearSearchTimer();let t=this.bindSessionList(!1);t&&t.sessions===e.sessions&&this.isRequestScopeCurrent(e)&&(await this.loadSessionList(t,{force:!0}),this.isRequestScopeCurrent(e)&&this.listBinding===t&&this.applyListSnapshot(t,t.sessions.listSnapshot(t.query)))}loadSessionList(e,t={}){if(this.listRequest)return t.force&&this.unsubscribeList&&e.sessions.refreshList({...e.query,...t}),this.listRequest;if(!this.captureRequestScope())return Promise.resolve();let n=Ze(),r=n.promise.finally(()=>{this.listRequest===r&&(this.listRequest=void 0,this.refreshing=!1,this.bindSessionList())});return this.listRequest=r,this.refreshing=!0,n.resolve(e.sessions.refreshList({...e.query,...t})),r}clearSearchTimer(){clearTimeout(this.searchTimer),this.searchTimer=void 0}resetTranscriptSearchState(e){this.transcriptSearchQuery=e,this.submittedTranscriptSearchQuery=``,this.transcriptSearchTask.run()}updateTranscriptSearchQuery(e){e!==this.transcriptSearchQuery&&this.resetTranscriptSearchState(e)}async runTranscriptSearch(){let e=this.transcriptSearchQuery.trim();if(!e){this.resetTranscriptSearchState(``);return}this.captureRequestScope()&&(this.transcriptSearchQuery=e,this.submittedTranscriptSearchQuery=e,await this.transcriptSearchTask.run())}updateFilters(e){this.activeMinutes=e.activeMinutes,this.limit=e.limit,this.includeGlobal=e.includeGlobal,this.includeUnknown=e.includeUnknown,this.page=0,this.selectedSessions=new Map,this.deepLinkSessionKey=null,this.refreshSessionList()}updateStatusFilter(e){let t=this.context;e!==this.statusFilter&&t&&(this.statusFilter=e,this.clearSearchTimer(),this.page=0,this.selectedSessions=new Map,this.deepLinkSessionKey=null,this.loading=!0,this.error=null,t.navigate(`sessions`,e===`active`?void 0:{search:`?status=${e}`}))}updateSelection(e,t){this.selectedSessions=jn(this.selectedSessions,this.result?.sessions??[],e,t)}async deleteSelected(){let e=[...this.selectedSessions.values()];if(e.length===0||this.loading||this.sessionMutationPending)return;let t=this.captureRequestScope();if(!t)return;let n=N(e.length===1?`sessionsView.deleteSelectedConfirmOne`:`sessionsView.deleteSelectedConfirm`,{count:String(e.length)});await this.confirmMutation(n)&&this.isRequestScopeCurrent(t)&&await this.deleteSessions(e.filter(e=>this.selectedSessions.get(e.key)===e))}confirmMutation(e,t={}){return yt({message:e,confirmLabel:N(`common.delete`),danger:!0,signal:this.pluginActionLifetime.signal,...t})}async deleteSessions(e,t={}){if(e.length===0||this.loading||this.sessionMutationPending)return;let n=this.captureRequestScope();if(!n)return;let r=e.map(e=>({key:e.key,agentId:this.sessionAgentId(e.key,n.context),...t,...e.sessionId?{expectedSessionId:e.sessionId}:{},...e.archived===!0?{archivedOnly:!0}:{}}));for(let e of r)if(!this.requireMutationAccess(n,{method:`sessions.delete`,params:e}))return;await this.runSessionMutation(n,async()=>{let t=async()=>{let t=await n.sessions.deleteMany(r);if(e.length===1&&t.errors.length>0)throw t.errors[0].error;return t},i=e[0],a=e.length===1?await Ot({action:`delete`,session:{...i,label:i.label||i.displayName||i.key,agentId:r[0].agentId},scope:{...n,signal:this.pluginActionLifetime.signal},isCurrent:()=>this.isRequestScopeCurrent(n),request:t}):await t();if(this.isRequestScopeCurrent(n)&&a){if(a.preservedWorktrees.length>0&&window.alert(Tt(a.preservedWorktrees)),a.deleted.length>0){let e=new Set(a.deleted),t=new Map(this.selectedSessions);for(let e of a.deleted)t.delete(e);this.selectedSessions=t,this.expandedSessionKey&&e.has(this.expandedSessionKey)&&(this.expandedSessionKey=null),this.deepLinkSessionKey&&e.has(this.deepLinkSessionKey)&&(this.deepLinkSessionKey=null);let r=a.deleted.find(e=>oe(e,n.gateway.snapshot.sessionKey));if(r){let e=M(r)?.agentId??n.context.agentSelection.state.selectedId??`main`;fe({selection:n.context.agentSelection,gateway:n.gateway,agentId:e,sessionKey:Xe({agentId:e,mainKey:v({agentsList:n.context.agents.state.agentsList,hello:n.gateway.snapshot.hello})})})}}return await this.refreshSessionList(n),a.errors.length>0?a.errors.map(({error:e})=>kt(e)).join(`; `):void 0}})}async deleteAllArchived(){let e=this.captureRequestScope(),t=this.pluginActionLifetime.signal;if(!e||this.loading||this.sessionMutationPending)return;let n;try{let{search:t,agentId:r,...i}=this.sessionListOptions(e.context),a=e.context.agentSelection.state.scopeId?.trim(),o={...i,...a?{agentId:a}:{}},s=await Rt({list:t=>e.sessions.list({...o,limit:1e3,offset:t}),isCurrent:()=>this.isRequestScopeCurrent(e),missingResultError:e.sessions.state.error??`archived session enumeration returned no result`,stalledPaginationError:`archived session enumeration did not advance`,incompletePaginationError:`archived session enumeration was incomplete`});if(!s)return;n=s}catch(t){this.publishRequestError(e,t);return}let r=n.filter(e=>e.archived===!0);r.length!==0&&await this.confirmMutation(N(`sessionsView.deleteAllArchivedConfirm`,{count:String(r.length)}),{signal:t})&&this.isRequestScopeCurrent(e)&&await this.deleteSessions(r,{deleteTranscript:!0})}async deleteSessionFromMenu(e){let t=B(e.label)??e.key,n=this.captureRequestScope();n&&await this.confirmMutation(N(`sessionsView.deleteSessionConfirm`,{session:t}))&&this.isRequestScopeCurrent(n)&&await this.deleteSessions([e])}async stopCloudWorker(e){let t=B(e.label)??e.key,n=ut(e.placement);if(!n||n.blocksActiveRun&&e.hasActiveRun===!0)return;let r=this.captureRequestScope();r&&await this.confirmMutation(N(`sessionsView.stopCloudWorkerConfirm`,{session:t}),{confirmLabel:N(`sessionsView.stopCloudWorkerConfirmAction`)})&&this.isRequestScopeCurrent(r)&&this.requireMutationAccess(r,n)&&await this.runSessionMutation(r,async()=>{let t=M(e.key)?.agentId;await cn(r.client,{key:e.key,...t?{agentId:t}:{}},r.context.placementStartup),this.isRequestScopeCurrent(r)&&await this.refreshSessionList(r)})}async runSessionMutation(e,t){this.sessionMutationPending=!0;let n;try{n=await t()}catch(t){this.isRequestScopeCurrent(e)&&(n=j(t))}finally{if(this.isRequestScopeCurrent(e)){this.sessionMutationPending=!1;let e=this.listBinding;e&&this.applyListSnapshot(e,e.sessions.listSnapshot(e.query)),n&&(this.error=n)}}}knownCategories(){return bn(this.result,this.context?.sessions.state.groups??[])}async rememberCustomGroup(e,t=this.captureRequestScope()){return t?this.requireMutationAccess(t,{method:`sessions.groups.put`,requiredScope:`operator.write`})?xn({name:e,knownCategories:this.knownCategories(),sessions:t.sessions,isCurrent:()=>this.isRequestScopeCurrent(t),onError:e=>{this.error=e}}):`failed`:`stale`}assignCategory(e,t){let n=this.result?.sessions.find(t=>t.key===e);n&&(n.category?.trim()||null)!==t&&(t&&this.rememberCustomGroup(t),this.patchSession(e,{category:t}))}async requestNewCategory(e){let t=this.result?.sessions.find(t=>t.key===e);if(e&&!t?.sessionId){this.error=N(`common.refresh`);return}await this.inputDialog.open(()=>({title:N(`sessionsView.newGroupTitle`),label:N(`sessionsView.newGroupPrompt`),submitLabel:N(`sessionsView.newGroupCreate`),requireValue:!0,submit:e=>this.writeNewCategory(e,t)}))}async writeNewCategory(e,t){this.error=null;let n=this.captureRequestScope();if(!n)return N(`sessionsView.newGroupFailed`);let r=await this.rememberCustomGroup(e,n);if(r!==`completed`)return r===`failed`?this.error??N(`sessionsView.newGroupFailed`):N(`sessionsView.newGroupStale`);if(!t)return null;let i=await this.patchSession(t.key,{category:e},n,t.sessionId);return i===`failed`?this.error??N(`sessionsView.newGroupFailed`):i===`stale`?N(`sessionsView.newGroupStale`):null}async renameSession(e){let t=this.captureRequestScope();if(!t){this.error=N(`sessionsView.actionRequiresConnection`);return}let n=At(e),r=this.pluginActionLifetime.signal,i=await this.inputDialog.open(()=>({signal:r,title:N(`sessionsView.renameSessionPrompt`),defaultValue:n}));if(i===null||!this.isRequestScopeCurrent(t))return;let a=Lt(i,n,e.label);a&&await this.patchSession(e.key,a,t,e.sessionId,{sessionScope:!0})}async patchSession(e,t,n=this.captureRequestScope(),r,i={}){if(!n)return this.error=N(`sessionsView.actionRequiresConnection`),`failed`;if(typeof t.archived==`boolean`&&!r?.trim())return this.error=`Session lifecycle action requires a durable session identity.`,`failed`;let a=this.sessionAgentId(e,n.context),o=this.result?.sessions.find(t=>t.key===e);if(!this.requireMutationAccess(n,{method:`sessions.patch`,sessionScope:i.sessionScope,session:o,params:{key:e,...t,...a?{agentId:a}:{}}}))return`failed`;try{let s=()=>n.sessions.patch(e,t,{agentId:a,...r?{expectedSessionId:r}:{}}),c=t.archived===!0?await Ot({action:`archive`,session:{key:e,sessionId:r,label:o?.label||o?.displayName||e,agentId:a},scope:{...n,signal:this.pluginActionLifetime.signal},isCurrent:()=>this.isRequestScopeCurrent(n),request:s}):await s();if(c&&i.onConfirmed?.(c),!this.isRequestScopeCurrent(n))return`stale`;if(!c)return this.error=n.sessions.state.error,`failed`;if(await this.refreshSessionList(n),!this.isRequestScopeCurrent(n))return`stale`;let l=new Map(this.selectedSessions);return l.delete(e),this.selectedSessions=l,`completed`}catch(e){return this.publishRequestError(n,e)}}async archiveSessionWithUndo(e){let t=this.captureRequestScope();if(!t)return;let n=vn(t.sessions,e,this.sessionAgentId(e.key,t.context));if(!n)return;let r=t.sessions.beginArchive(e.key,e.sessionId);if(r)try{await this.patchSession(e.key,{archived:!0},t,e.sessionId,{onConfirmed:n,sessionScope:!0})}finally{r()}}async forkSession(e,t=!1){let n=this.captureRequestScope();if(!n)return;let r=this.sessionAgentId(e,n.context),i={parentSessionKey:e,fork:!0,...t?{forkFrom:`last-completed`}:{},...r?{agentId:r}:{}};if(this.requireMutationAccess(n,{method:`sessions.create`,params:i}))try{let e=await n.sessions.create(i);if(!this.isRequestScopeCurrent(n))return;e?n.context.navigate(`chat`,{...S({context:n.context,face:`chat`,sessionKey:e,agentId:r??this.sessionPathAgentId(e,n.context)}).options,hash:``}):n.sessions.state.error&&(this.error=n.sessions.state.error)}catch(e){this.publishRequestError(n,e)}}openSessionMenu(e,t,n){if(this.sessionMenu?.key===e.key&&this.sessionMenu.sessionId===e.sessionId&&n){this.closeSessionMenu();return}this.sessionMenu={key:e.key,sessionId:e.sessionId,...t},this.sessionMenuTrigger=n,this.loadSessionMenuWork(e)}closeSessionMenu(){this.context&&en(this.context.gateway).unwatch(this),this.sessionMenu=null,this.sessionMenuTrigger=null,this.sessionMenuWork=null}loadSessionMenuWork(e){let t=this.sessionMenu;if(!e.worktree){this.sessionMenuWork=null;return}this.sessionMenuWork={loading:!0,pullRequestUrl:null,worktreePath:null};let n=this.captureRequestScope();if(!n){this.sessionMenuWork={loading:!1,pullRequestUrl:null,worktreePath:null};return}let r=en(n.context.gateway),i=h(e.key,this.sessionAgentId(e.key,n.context));ot({client:n.client,loadPullRequests:Te(n.context.gateway.snapshot,`controlUi.sessionPullRequests.subscribe`,`operator.read`)?()=>r.load(this,i):void 0,worktreeId:e.worktree.id,execNode:e.execNode}).then(e=>{this.sessionMenu===t&&(this.sessionMenuWork={loading:!1,...e})})}renderSessionMenu(){let e=this.sessionMenu,t=this.context,n=e?this.result?.sessions.find(t=>t.key===e.key&&t.sessionId===e.sessionId):null;return!e||!t||!n?F:Pn({context:t,row:n,menu:e,trigger:this.sessionMenuTrigger,disabled:this.loading,groups:this.knownCategories(),work:this.sessionMenuWork,onClose:()=>this.closeSessionMenu(),onAction:r=>{switch(r.kind){case`open-pr`:te(r.url);break;case`open-in`:Me(r.editor,r.path);break;case`copy-session-id`:case`copy-session-link`:case`copy-session-preview-link`:case`copy-markdown`:case`open-new-tab`:case`open-new-window`:case`split-right`:case`split-below`:Qt(r.kind,{context:t,session:n,agentId:n.agentId,isCurrent:()=>this.isConnected&&this.context===t});break;case`toggle-pin`:this.patchSession(n.key,{pinned:n.pinned!==!0},void 0,void 0,{sessionScope:!0});break;case`toggle-involving-me`:{let e=this.captureRequestScope();if(!e||!n.sessionId){this.error=N(`sessionsView.actionRequiresConnection`);break}se(e.client,{key:n.key,expectedSessionId:n.sessionId,agentId:n.agentId??this.sessionAgentId(n.key,e.context),hidden:!n.hiddenFromInvolvingMe}).then(async()=>{this.isRequestScopeCurrent(e)&&await this.refreshSessionList(e)}).catch(t=>this.publishRequestError(e,t));break}case`toggle-unread`:this.patchSession(n.key,{unread:n.unread!==!0});break;case`rename`:this.renameSession(n);break;case`set-color`:this.patchSession(n.key,{color:r.color});break;case`set-icon`:this.patchSession(n.key,{icon:r.icon});break;case`reset-appearance`:this.patchSession(n.key,{icon:null,color:null});break;case`fork`:this.forkSession(n.key,n.hasActiveRun===!0);break;case`plugin`:this.runPluginAction(r.id,e);break;case`move-to-group`:this.assignCategory(n.key,r.category);break;case`new-group`:this.requestNewCategory(n.key);break;case`toggle-archived`:n.archived===!0?this.patchSession(n.key,{archived:!1},void 0,n.sessionId,{sessionScope:!0}):this.archiveSessionWithUndo(n);break;case`assign-owner`:{let e=this.captureRequestScope();if(!e){this.error=N(`sessionsView.actionRequiresConnection`);break}if(!this.requireMutationAccess(e,{method:`sessions.assignOwner`,params:{key:n.key,owner:r.owner},requiredScope:`operator.write`}))break;this.runSessionMutation(e,async()=>await e.sessions.assignOwner(n.key,r.owner)||!this.isRequestScopeCurrent(e)?void 0:e.sessions.state.error??void 0);break}case`stop-cloud-worker`:this.stopCloudWorker(n);break;case`delete`:this.deleteSessionFromMenu(n)}}})}render(){let e=this.context,t=(this.result?.owners?.length??0)>1;return e?I`
      ${fn({active:`sessions`,title:de(`sessions`),subtitle:I`${_e(`sessions`)} ${st(hr)}`,actions:vt({agents:e.agents.state.agentsList?.agents??[],selection:e.agentSelection}),onSelect:t=>{t!==`sessions`&&e.navigate(t)}})}
      ${Ct(ir({loading:this.loading||this.details.loading,refreshing:this.refreshing,result:this.result,error:this.details.error??this.error,activeMinutes:this.activeMinutes,limit:this.limit,includeGlobal:this.includeGlobal,includeUnknown:this.includeUnknown,statusFilter:this.statusFilter,basePath:e.basePath,agentId:O(e),mainKey:v({agentsList:e.agents.state.agentsList,hello:e.gateway.snapshot.hello}),searchQuery:this.searchQuery,transcriptSearchAvailable:e.gateway.snapshot.phase===`connected`,transcriptSearchQuery:this.transcriptSearchQuery,transcriptSearch:this.transcriptSearchTask.render({initial:()=>({status:`idle`}),pending:()=>({status:`loading`}),complete:e=>({status:`results`,...e}),error:e=>({status:`error`,message:j(e)})}),agentIdentityById:hn(this.result,t=>e.agentIdentity.get(t)??void 0),sortColumn:this.sortColumn,sortDir:this.sortDir,groupBy:t||this.groupBy!==`person`?this.groupBy:`none`,personGroupingAvailable:t,knownCategories:this.knownCategories(),page:this.page,pageSize:this.pageSize,selectedKeys:new Set(this.selectedSessions.keys()),sessionMenu:this.sessionMenu,expandedSessionKey:this.expandedSessionKey,labelDisabledReason:e=>this.mutationDisabledReason({method:`sessions.patch`,params:{key:e.key,label:null},sessionScope:!0,session:e}),patchAdminDisabledReason:this.mutationDisabledReason({method:`sessions.patch`,params:{key:``,thinkingLevel:null}}),groupWriteDisabledReason:this.mutationDisabledReason({method:`sessions.groups.put`,requiredScope:`operator.write`}),deleteArchivedDisabledReason:this.mutationDisabledReason({method:`sessions.delete`,params:{key:``,archivedOnly:!0,deleteTranscript:!0}}),deleteSelectedDisabledReason:this.selectedDeleteDisabledReason(),onFiltersChange:e=>this.updateFilters(e),onClearFilters:()=>{this.searchQuery=``,this.updateFilters({activeMinutes:``,limit:`50`,includeGlobal:!0,includeUnknown:!1})},onSearchChange:e=>{this.routeDataEnabled=!1,this.deepLinkSessionKey=null,this.searchQuery=e,this.page=0,this.selectedSessions=new Map,this.clearSearchTimer(),this.captureRequestScope()&&(this.searchTimer=setTimeout(()=>{this.searchTimer=void 0,this.bindSessionList()},gr)),this.bindSessionList()},onTranscriptSearchChange:e=>this.updateTranscriptSearchQuery(e),onTranscriptSearch:()=>void this.runTranscriptSearch(),onClearTranscriptSearch:()=>this.resetTranscriptSearchState(``),onSortChange:(e,t)=>{this.sortColumn=e,this.sortDir=t,this.page=0},onGroupByChange:e=>{this.groupBy=e,this.page=0,On(e)},onAssignCategory:(e,t)=>this.assignCategory(e,t),onRequestNewCategory:e=>void this.requestNewCategory(e),onLoadMore:()=>{let e=this.listBinding,t=this.result?.nextOffset;e&&this.result?.hasMore&&t!=null&&!this.loading&&this.loadSessionList(e,{offset:t,append:!0})},onPageChange:e=>{this.page=e},onPageSizeChange:e=>{this.pageSize=e,this.page=0},onRefresh:()=>void this.refreshSessionList(),onStatusFilterChange:e=>this.updateStatusFilter(e),onDeleteAllArchived:()=>void this.deleteAllArchived(),onPatch:(e,t,n)=>void this.patchSession(e,t,void 0,void 0,n),onToggleSelect:e=>this.updateSelection([e],`toggle`),onSelectPage:e=>this.updateSelection(e,`select`),onDeselectPage:e=>this.updateSelection(e,`deselect`),onDeselectAll:()=>{this.selectedSessions=new Map},onDeleteSelected:()=>void this.deleteSelected(),onNavigateToChat:t=>{let n=C(e,t),r=S({context:e,face:n,sessionKey:t,agentId:this.sessionPathAgentId(t,e),preferenceDerivedFace:!0});e.navigate(n,r.options)},onOpenSessionMenu:(e,t,n)=>this.openSessionMenu(e,t,n),onToggleDetails:e=>{this.expandedSessionKey=this.expandedSessionKey===e?null:e,this.deepLinkSessionKey!==null&&(this.deepLinkSessionKey=null,this.refreshSessionList())}}),{id:`sessions-hub-panel`})}
      ${this.renderSessionMenu()}
    `:I``}async runPluginAction(e,t){let n=this.captureRequestScope();if(n)try{await qt({runtime:n.context.plugins,id:e,placement:`session`,sessionKey:t.key,session:this.result?.sessions.find(e=>e.key===t.key&&e.sessionId===t.sessionId),signal:this.pluginActionLifetime.signal})}catch(e){this.publishRequestError(n,e)}}},H([We({context:ge,subscribe:!0})],$.prototype,`context`,void 0),H([be({attribute:!1})],$.prototype,`routeData`,void 0),H([R()],$.prototype,`result`,void 0),H([R()],$.prototype,`loading`,void 0),H([R()],$.prototype,`refreshing`,void 0),H([R()],$.prototype,`error`,void 0),H([R()],$.prototype,`activeMinutes`,void 0),H([R()],$.prototype,`limit`,void 0),H([R()],$.prototype,`includeGlobal`,void 0),H([R()],$.prototype,`includeUnknown`,void 0),H([R()],$.prototype,`statusFilter`,void 0),H([R()],$.prototype,`searchQuery`,void 0),H([R()],$.prototype,`transcriptSearchQuery`,void 0),H([R()],$.prototype,`submittedTranscriptSearchQuery`,void 0),H([R()],$.prototype,`sortColumn`,void 0),H([R()],$.prototype,`sortDir`,void 0),H([R()],$.prototype,`groupBy`,void 0),H([R()],$.prototype,`page`,void 0),H([R()],$.prototype,`pageSize`,void 0),H([R()],$.prototype,`selectedSessions`,void 0),H([R()],$.prototype,`sessionMenu`,void 0),H([R()],$.prototype,`sessionMenuWork`,void 0),H([R()],$.prototype,`expandedSessionKey`,void 0),customElements.get(`zero-sessions-page`)||customElements.define(`zero-sessions-page`,$)})))()}_r();
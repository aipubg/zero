import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Ou as i,Pu as a,Tu as o,V as s,W as ee,ju as te,xu as ne,yu as c,zu as l}from"./control-ui-core-DCNBgr3X.js";import{Aa as u,Ai as d,Ba as f,Ja as p,aa as m,ki as re,or as h,qa as g,ra as ie,sr as ae,ta as oe}from"./control-ui-core-DwX5Mpz4.js";import{G as _,J as v,W as y,Z as b,n as x,rt as S,t as C}from"./lit-runtime-B40xFCK_.js";import{Ur as w,Wr as T,Zr as E}from"./ui-AaV6iNVa.js";import{B as D,D as O,F as k,M as A,N as j,T as M,V as N,j as P}from"./control-ui-boot-shared-E4pYPcWx.js";import{B as F,G as I,Gt as L,I as R,Kt as z,Y as B,Z as V,l as H,q as U,u as W}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ml as G,Nl as K,_ as q,c as se,cl as ce,d as le,g as ue,sl as de}from"./control-ui-boot-shared-CzJHozXQ.js";import{a as fe,i as pe,n as me,t as he}from"./lane-table-CRBXtqX0.js";function J(e,t,n){return v`<pre class="code-block" role="group" aria-label=${e} tabindex="0">
${N([t],()=>O(L(n())))}</pre>`}function ge(e){let t=(e.status&&typeof e.status==`object`?e.status.securityAudit:null)?.summary??null;if(!t)return _;let n=t.critical??0,r=t.warn??0,i=t.info??0,a=n>0?`danger`:r>0?`warn`:`ok`,o=n>0?l(`debug.security.critical`,{count:String(n)}):r>0?l(`debug.security.warnings`,{count:String(r)}):l(`debug.security.noCriticalIssues`),s=i>0?` · ${l(`debug.security.info`,{count:String(i)})}`:``;return U({title:l(`debug.security.audit`),description:v`
      ${l(`debug.security.runPrefix`)}
      <span class="mono">zero security audit --deep</span>
      ${l(`debug.security.runSuffix`)}
    `,control:V({kind:a,label:`${o}${s}`})})}function _e(e){return e?v`
    <div class="settings-row" role="alert">
      <div class="settings-row__text">
        <span class="settings-row__title">
          ${V({kind:`danger`,label:l(`common.failed`)})}
        </span>
        <span class="settings-row__desc">${e}</span>
      </div>
    </div>
  `:_}function Y(e){return U({title:e.event,description:s(e.ts,void 0,``),stacked:!0,control:J(e.event,e.payload,()=>se(e.payload))})}function ve(e){let t=e.connected&&e.loading,n=B({title:l(`debug.snapshotsTitle`),description:l(`debug.snapshotsSubtitle`),actions:v`
        <button
          class="btn"
          ?disabled=${!e.connected||e.loading}
          @click=${e.onRefresh}
        >
          ${l(t?`common.refreshing`:`common.refresh`)}
        </button>
      `},v`
      ${!e.connected&&e.offlineStable?U({title:V({kind:`muted`,label:l(`common.offline`)}),description:l(`debug.offlineSnapshots`)}):_}
      ${_e(e.diagnosticsError)} ${ge(e)}
      ${[`status`,`health`,`heartbeat`].map(t=>{let n=l(t===`heartbeat`?`debug.lastHeartbeat`:`debug.${t}`),r=e[t];return U({title:n,stacked:!0,control:J(n,r,()=>JSON.stringify(r??{},null,2))})})}
    `),r=B({title:l(`debug.lanes.title`),description:l(`debug.lanes.subtitle`),actions:v`
        <button class="btn" @click=${e.onOpenOverlay}>
          ${p()?l(`debug.overlay.open`):m(l(`debug.overlay.openWithShortcut`,{shortcut:`{shortcut}`}),ie(o.debugOverlay,{inline:!0}))}
        </button>
      `},v`
      <div class="data-table-container command-lanes-table-wrap">
        <table class="data-table command-lanes-table settings-table--stacked" role="table">
          <thead>
            <tr>
              <th scope="col">${l(`debug.lanes.lane`)}</th>
              <th scope="col">${l(`debug.lanes.active`)}</th>
              <th scope="col">${l(`debug.lanes.queued`)}</th>
              <th scope="col">${l(`debug.lanes.group`)}</th>
              <th scope="col">${l(`debug.lanes.blocked`)}</th>
            </tr>
          </thead>
          <tbody>
            ${me({lanes:e.lanes,dynamic:e.dynamic})}
          </tbody>
        </table>
      </div>
    `),i=B({title:l(`debug.manualRpcTitle`),description:l(`debug.manualRpcSubtitle`)},v`
      ${U({title:l(`debug.method`),control:v`
          <select
            class="settings-select"
            aria-label=${l(`debug.method`)}
            .value=${e.callMethod}
            @change=${t=>e.onCallMethodChange(t.target.value)}
          >
            ${e.callMethod?_:v` <option value="" disabled>${l(`debug.selectMethod`)}</option> `}
            ${e.methods.map(e=>v`<option value=${e}>${e}</option>`)}
          </select>
        `})}
      ${U({title:l(`debug.paramsJson`),stacked:!0,control:v`
          <textarea
            class="settings-input"
            aria-label=${l(`debug.paramsJson`)}
            .value=${e.callParams}
            @input=${t=>e.onCallParamsChange(t.target.value)}
            rows="6"
          ></textarea>
        `})}
      ${U({title:l(`common.call`),control:v`
          <button class="btn primary" @click=${e.onCall}>${l(`common.call`)}</button>
        `})}
      ${e.callError?v`
              <div class="settings-row settings-row--stacked" role="alert">
                ${V({kind:`danger`,label:l(`debug.callFailed`)})}
                <pre
                  class="code-block"
                  role="group"
                  aria-label=${l(`debug.callFailed`)}
                  tabindex="0"
                >
${e.callError}</pre>
              </div>
            `:_}
      ${e.callResult?v`
              <div class="settings-row settings-row--stacked">
                ${V({kind:`ok`,label:l(`common.ok`)})}
                ${J(`${e.callMethod}: ${l(`common.ok`)}`,e.callResult,()=>e.callResult)}
              </div>
            `:_}
    `),a=B({title:l(`debug.modelsTitle`),description:l(`debug.modelsSubtitle`)},v`
      <div class="settings-row settings-row--stacked">
        ${J(l(`debug.modelsTitle`),e.models,()=>JSON.stringify(e.models??[],null,2))}
      </div>
    `),s=B({title:l(`debug.eventLogTitle`),description:l(`debug.eventLogSubtitle`)},e.eventLog.length===0?F(l(`debug.noEvents`)):x(e.eventLog,e=>e,Y));return I(v`${n} ${r} ${i} ${a} ${s}`,{wide:!0})}function X(){return(X=e((()=>{y(),D(),C(),M(),g(),oe(),z(),R(),a(),ee(),i(),le(),he()})))()}var Z,Q;function $(){return($=e((()=>{T(),P(),y(),b(),u(),d(),h(),H(),ne(),K(),r(),ce(),n(),ue(),X(),Z=3e3,Q=class extends te{constructor(...e){super(...e),this.debugStatus=null,this.debugHealth=null,this.debugModels=[],this.debugHeartbeat=null,this.debugLanes=[],this.debugDynamic=null,this.debugCallMethod=``,this.debugCallParams=`{}`,this.debugCallResult=null,this.debugCallError=null,this.debugDiagnosticsError=null,this.debugLiveError=null,this.polling=new de(this,Z,()=>{this.loadLiveDiagnostics()},!1,`visible`),this.callEpoch=0,this.diagnosticsTaskActiveClient=null,this.diagnosticsAgentId=null,this.diagnosticsNeedsRefresh=!0,this.diagnosticsTask=new A(this,{autoRun:!1,args:()=>[this.gateway.connected?this.gateway.client:null,this.context?.settingsAgentSelection.state.selectedId??null],task:([e,t],{signal:n})=>e?fe(e,t,n):j,onComplete:e=>{this.diagnosticsTaskActiveClient=null,this.debugDiagnosticsError=null,this.debugLiveError=null,this.debugStatus=e.status,this.debugHealth=e.health,this.debugModels=e.models,this.debugHeartbeat=e.heartbeat,this.debugLanes=e.lanes,this.debugDynamic=e.dynamic},onError:e=>{this.diagnosticsTaskActiveClient=null,this.debugDiagnosticsError=c(e)}}),this.liveTask=new A(this,{autoRun:!1,task:async([e],{signal:t})=>{if(!e)return j;let[n,r]=await Promise.all([e.request(`last-heartbeat`,{},{signal:t}),pe(e,t)]);return{heartbeat:n,...r}},onComplete:e=>{this.debugHeartbeat=e.heartbeat,this.debugLanes=e.lanes,this.debugDynamic=e.dynamic,this.debugLiveError=null},onError:e=>{this.debugLiveError=c(e)}}),this.gateway=new G(this,{getGateway:()=>this.context?.gateway,onIdentityChange:()=>{this.debugStatus=null,this.debugHealth=null,this.debugModels=[],this.debugHeartbeat=null,this.debugLanes=[],this.debugDynamic=null,this.debugCallResult=null,this.debugCallError=null,this.debugDiagnosticsError=null,this.debugLiveError=null},invalidateRequests:()=>{this.invalidateDiagnostics(),this.liveTask.run([null]),this.callEpoch+=1},onSnapshot:()=>{this.gateway.connected&&this.gateway.client?this.polling.start():this.polling.stop(),this.diagnosticsNeedsRefresh&&this.loadDiagnostics()}}),this.subscriptions=new t(this).watch(()=>this.context?.gateway,(e,t)=>e.subscribeEventLog(t)).watchStore(()=>this.context?.settingsAgentSelection,e=>{let t=e.state.selectedId;t!==this.diagnosticsAgentId&&(this.diagnosticsAgentId=t,this.debugModels=[],this.invalidateDiagnostics(),this.loadDiagnostics())})}disconnectedCallback(){this.subscriptions.clear(),this.invalidateDiagnostics(),this.liveTask.run([null]),this.diagnosticsAgentId=null,this.callEpoch+=1,super.disconnectedCallback()}invalidateDiagnostics(){this.diagnosticsTask.run([null,null]),this.diagnosticsTaskActiveClient=null,this.diagnosticsNeedsRefresh=!0}loadDiagnostics(){let e=this.gateway.connected?this.gateway.client:null;return!e||this.diagnosticsTaskActiveClient?Promise.resolve():(this.liveTask.run([null]),this.diagnosticsTaskActiveClient=e,this.diagnosticsNeedsRefresh=!1,this.diagnosticsAgentId=this.context.settingsAgentSelection.state.selectedId,this.diagnosticsTask.run([e,this.context.settingsAgentSelection.state.selectedId]))}loadLiveDiagnostics(){let e=this.gateway.connected?this.gateway.client:null;return!e||this.diagnosticsTaskActiveClient||this.liveTask.status===k.PENDING?Promise.resolve():this.liveTask.run([e])}async callDebugMethod(){let e=this.gateway.connected?this.gateway.client:null;if(!e)return;this.debugCallError=null,this.debugCallResult=null;let t=this.gateway.gateway,n=++this.callEpoch,r=()=>this.gateway.connected&&this.gateway.client===e&&this.gateway.gateway===t&&this.context.gateway===t&&this.callEpoch===n;try{let t=this.debugCallParams.trim()?JSON.parse(this.debugCallParams):{},n=await e.request(this.debugCallMethod.trim(),t);r()&&(this.debugCallResult=JSON.stringify(n,null,2))}catch(e){r()&&(this.debugCallError=c(e))}}render(){let e=ve({connected:this.gateway.connected,offlineStable:this.gateway.snapshot?.offlineStable??!1,loading:this.diagnosticsTask.status===k.PENDING,status:this.debugStatus,health:this.debugHealth,models:this.debugModels,heartbeat:this.debugHeartbeat,lanes:this.debugLanes,dynamic:this.debugDynamic,diagnosticsError:this.debugDiagnosticsError??this.debugLiveError,eventLog:this.context.gateway.eventLog,methods:(this.context.gateway.snapshot.hello?.features?.methods??[]).toSorted(),callMethod:this.debugCallMethod,callParams:this.debugCallParams,callResult:this.debugCallResult,callError:this.debugCallError,onCallMethodChange:e=>this.debugCallMethod=e,onCallParamsChange:e=>this.debugCallParams=e,onRefresh:()=>void this.loadDiagnostics(),onOpenOverlay:q,onCall:()=>void this.callDebugMethod()});return v`
      <section class="content-header" ${ae({toolbarHeader:!0})}>
        <div>
          <div class="page-title">${f(`debug`)}</div>
        </div>
      </section>
      ${W(e)}
    `}},E([w({context:re,subscribe:!0})],Q.prototype,`context`,void 0),E([S()],Q.prototype,`debugStatus`,void 0),E([S()],Q.prototype,`debugHealth`,void 0),E([S()],Q.prototype,`debugModels`,void 0),E([S()],Q.prototype,`debugHeartbeat`,void 0),E([S()],Q.prototype,`debugLanes`,void 0),E([S()],Q.prototype,`debugDynamic`,void 0),E([S()],Q.prototype,`debugCallMethod`,void 0),E([S()],Q.prototype,`debugCallParams`,void 0),E([S()],Q.prototype,`debugCallResult`,void 0),E([S()],Q.prototype,`debugCallError`,void 0),E([S()],Q.prototype,`debugDiagnosticsError`,void 0),E([S()],Q.prototype,`debugLiveError`,void 0),customElements.get(`zero-debug-page`)||customElements.define(`zero-debug-page`,Q)})))()}$();
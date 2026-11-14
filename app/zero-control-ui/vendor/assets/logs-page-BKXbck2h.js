import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{A as t,Gu as n,Ji as r,Nu as i,Pu as a,W as o,Wu as s,Yi as c,Zi as ee,ju as l,zu as u}from"./control-ui-core-DCNBgr3X.js";import{Aa as d,Ai as te,Ba as ne,hi as f,ki as re,mi as ie,or as ae,sr as oe}from"./control-ui-core-DwX5Mpz4.js";import{G as p,J as m,W as h,Z as se,rt as g}from"./lit-runtime-B40xFCK_.js";import{d as _,f as v}from"./control-ui-boot-shared-BRtBCr5s.js";import{Y as ce}from"./control-ui-boot-shared-BX8huZUb.js";import{No as le,Ur as ue,Wr as de,Zr as y,jo as b,wa as x}from"./ui-AaV6iNVa.js";import{F as S,M as fe,N as C,j as w}from"./control-ui-boot-shared-E4pYPcWx.js";import{$ as T,$n as E,B as D,I as O,Z as k,er as A,ir as j,l as M,nr as N,q as P,rr as F,tr as I,u as L}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ml as R,Nl as z,cl as B,sl as V}from"./control-ui-boot-shared-CzJHozXQ.js";import{n as pe,t as me}from"./stream-auto-follow-controller-BZ0UzGsg.js";function he(e){let t=[];for(let n of Object.keys(e)){if(!/^\d+$/.test(n))continue;let r=e[n];typeof r==`string`?t.push(r):r!=null&&t.push(JSON.stringify(r))}return t.join(` `)}function H(e){if(typeof e!=`string`||!e.trimStart().startsWith(`{`))return{};try{let t=JSON.parse(e);return{subsystem:typeof t.subsystem==`string`?t.subsystem:void 0,module:typeof t.module==`string`?t.module:void 0,plugin:typeof t.plugin==`string`?t.plugin:void 0}}catch{return{}}}function ge(e,t){let n=H(t?.name);if(t?.name===e[0])return n;let r=H(e[0]);return{subsystem:n.subsystem??r.subsystem,module:n.module??r.module,plugin:n.plugin??r.plugin}}function _e(e){try{let t=JSON.parse(e);if(!x(t))return null;let n=x(t._meta)?t._meta:void 0,r=ge(t,n),i=typeof n?.logLevelName==`string`?n.logLevelName:t.level;return{time:typeof t.time==`string`?t.time:typeof n?.date==`string`?n.date:void 0,level:le(i),subsystem:r.subsystem??(typeof t.subsystem==`string`?t.subsystem:void 0),module:r.module,plugin:r.plugin,message:typeof t.message==`string`?t.message:he(t),raw:e}}catch{return null}}function U(){return(U=e((()=>{})))()}function ve(e){let t=_e(e);if(!t)return{raw:e,message:v(e)};let n=t.subsystem??t.module;return{raw:t.raw,time:t.time??null,level:W.find(e=>e===t.level)??null,subsystem:n?v(n):null,message:v(t.message)}}var W,G;function K(){return(K=e((()=>{_(),U(),W=[`trace`,`debug`,`info`,`warn`,`error`,`fatal`],G={trace:!0,debug:!0,info:!0,warn:!0,error:!0,fatal:!0}})))()}var q,J;function Y(){return(Y=e((()=>{n(),q={gatewayLogs:{title:`Logs`,subtitle:`Gateway file logs (JSONL).`,exportButton:`Export {label}`,exportLabels:{filtered:`filtered`,visible:`visible`},filter:`Filter`,searchPlaceholder:`Search logs`,autoFollow:`Auto-follow`,file:`File: {file}`,truncated:`Log output truncated; showing latest chunk.`,empty:`No log entries.`}},J=Object.assign(()=>Object.assign(s.gatewayLogs,q.gatewayLogs),{catalog:q})})))()}function ye(e,t){if(!e)return``;let n=new Date(e);return Number.isNaN(n.getTime())?e:t(n.getTime())}function be(e){let n=t({timeStyle:`short`}),r=b(e.filterText),i=W.some(t=>!e.levelFilters[t]),a=e.entries.filter(t=>t.level&&!e.levelFilters[t.level]?!1:!r||b([t.message,t.subsystem,t.raw].filter(Boolean).join(` `)).includes(r)),o=r||i?`filtered`:`visible`,s=u(`gatewayLogs.exportLabels.${o}`),c=e.status.hasLoaded?a.length===0?D(u(`gatewayLogs.empty`)):a.map(e=>m`
            <div class="log-row">
              <div class="log-time mono">${ye(e.time,n)}</div>
              <div class="log-level ${e.level??``}">${e.level??``}</div>
              <div class="log-subsystem mono">${e.subsystem??``}</div>
              <div class="log-message mono">${e.message??e.raw}</div>
            </div>
          `):e.loading?f():p;return m`
    <div class="settings-section__header">
      <h2 class="settings-section__heading">${u(`gatewayLogs.title`)}</h2>
      <div class="settings-section__actions">
        <button class="btn" ?disabled=${e.refreshDisabled} @click=${e.onRefresh}>
          ${e.loading?u(`common.loading`):u(`common.refresh`)}
        </button>
        <button
          class="btn"
          ?disabled=${a.length===0}
          @click=${()=>e.onExport(a.map(e=>e.raw),o)}
        >
          ${u(`gatewayLogs.exportButton`,{label:s})}
        </button>
      </div>
    </div>
    <p class="settings-section__desc">${u(`gatewayLogs.subtitle`)}</p>
    ${j({status:e.status,className:`logs-refresh-status`})}
    <div class="settings-group logs-card">
      ${P({title:u(`gatewayLogs.filter`),description:e.file?u(`gatewayLogs.file`,{file:e.file}):void 0,control:m`
          <input
            class="settings-input"
            aria-label=${u(`gatewayLogs.filter`)}
            .value=${e.filterText}
            @input=${t=>e.onFilterTextChange(t.target.value)}
            placeholder=${u(`gatewayLogs.searchPlaceholder`)}
          />
        `})}
      <div class="settings-row">
        <div class="chip-row">
          ${W.map(t=>m`
              <label class="chip log-chip ${t}">
                <input
                  type="checkbox"
                  .checked=${e.levelFilters[t]}
                  @change=${n=>e.onLevelToggle(t,n.target.checked)}
                />
                <span>${t}</span>
              </label>
            `)}
        </div>
        <div class="settings-row__control">
          ${T({checked:e.autoFollow,ariaLabel:u(`gatewayLogs.autoFollow`),onChange:e.onToggleAutoFollow})}
          <span class="settings-row__value">${u(`gatewayLogs.autoFollow`)}</span>
        </div>
      </div>
      ${e.truncated?m`
              <div class="settings-row">
                ${k({kind:`warn`,label:u(`gatewayLogs.truncated`)})}
              </div>
            `:p}
      <div
        class="log-stream"
        role="region"
        aria-label=${u(`gatewayLogs.title`)}
        tabindex="0"
        @scroll=${e.onScroll}
      >
        ${c}
      </div>
    </div>
  `}function X(){return(X=e((()=>{h(),ie(),F(),O(),a(),Y(),o(),K(),J()})))()}var Z,Q;function $(){return($=e((()=>{de(),w(),h(),se(),d(),te(),ae(),F(),M(),c(),z(),i(),B(),pe(),K(),X(),Z=2e3,Q=class extends l{constructor(...e){super(...e),this.logsStatus=I(),this.logsFile=null,this.logsEntries=[],this.logsFilterText=``,this.logsLevelFilters={...G},this.logsAutoFollow=!0,this.logsTruncated=!1,this.logsCursor=null,this.logsLimit=500,this.logsMaxBytes=25e4,this.polling=new V(this,Z,()=>{this.loadLogs({quiet:!0})},!1,`visible`),this.contentScrollFrame=null,this.logsTaskQuiet=!1,this.logsTask=new fe(this,{autoRun:!1,args:()=>this.logsTaskArgs(),task:async([e,t,n,r,i,a],{signal:o})=>{if(!e||!t)return C;try{let e=e=>t.request(`logs.tail`,{cursor:e,limit:this.logsLimit,maxBytes:this.logsMaxBytes},{signal:o}),s=await e(i?void 0:n??void 0),c=!i&&r!==null&&s.file!==void 0&&s.file!==r;return c&&(s=await e()),{ok:!0,payload:s,cursor:n,reset:i||c,bootId:a}}catch(e){return{ok:!1,error:e}}},onComplete:e=>{if(!e.ok){ee(e.error)?(this.logsEntries=[],this.logsStatus=N(I(),e.error,this.gateway.snapshot),this.logsStatus.error&&(this.logsStatus={...this.logsStatus,error:r(`logs`)})):this.logsStatus=N(this.logsStatus,e.error,this.gateway.snapshot);return}let t=(Array.isArray(e.payload.lines)?e.payload.lines.filter(e=>typeof e==`string`):[]).map(ve),n=e.reset||e.payload.reset||e.cursor==null;this.logsEntries=n?t:[...this.logsEntries,...t].slice(-2e3),typeof e.payload.cursor==`number`&&(this.logsCursor=e.payload.cursor,this.logsCursorBootId=e.bootId),this.logsFile=typeof e.payload.file==`string`?e.payload.file:this.logsFile,this.logsTruncated=!!e.payload.truncated,this.logsStatus=A()}}),this.gateway=new R(this,{getGateway:()=>this.context?.gateway,onIdentityChange:()=>{this.logsStatus=I(),this.logsFile=null,this.logsEntries=[],this.logsTruncated=!1,this.logsCursor=null,this.logsCursorBootId=void 0,this.streamFollow.atBottom=!0},invalidateRequests:()=>{this.logsTaskQuiet=!1,this.logsTask.run([null,null,null,null,!1,void 0])},onSnapshot:()=>{this.gateway.connected&&this.gateway.client?this.polling.start():this.polling.stop()},ensureInitialData:()=>{let e=this.logsStatus.hasLoaded;this.loadLogs({reset:!e||this.logsCursor===null,quiet:e}).then(t=>{t&&!e&&this.streamFollow.schedule(!0)})}}),this.streamFollow=new me(this,{selector:`.log-stream`,isEnabled:()=>this.logsAutoFollow,captureCurrent:()=>{let e=this.gateway.gateway,t=this.gateway.epoch;return()=>this.isConnected&&this.gateway.connected&&e!==null&&this.gateway.gateway===e&&this.context.gateway===e&&this.gateway.epoch===t}})}logsTaskArgs(e){let t=this.gateway.snapshot?.hello?.server?.bootId,n=e?.reset===!0||t!==this.logsCursorBootId;return[this.gateway.connected?this.gateway.gateway:null,this.gateway.connected?this.gateway.client:null,n?null:this.logsCursor,this.logsFile,n,t]}firstUpdated(){this.resetContentScroll(),this.contentScrollFrame=requestAnimationFrame(()=>{this.contentScrollFrame=null,this.resetContentScroll()})}updated(e){let t=this.logsAutoFollow&&e.has(`logsAutoFollow`);(t||this.logsAutoFollow&&this.streamFollow.atBottom&&e.has(`logsEntries`))&&this.streamFollow.schedule(t)}disconnectedCallback(){this.logsTaskQuiet=!1,this.logsTask.run([null,null,null,null,!1,void 0]),this.contentScrollFrame!==null&&(cancelAnimationFrame(this.contentScrollFrame),this.contentScrollFrame=null),super.disconnectedCallback()}resetContentScroll(){let e=this.closest(`.content`);e&&(e.scrollTop=0,e.scrollLeft=0)}async loadLogs(e){let t=e?.quiet===!0,n=this.gateway.gateway,r=this.logsTaskArgs(e);if(!n||!this.gateway.client||!this.gateway.connected||this.context.gateway!==n||this.logsTask.status===S.PENDING&&!r[4])return!1;this.logsTaskQuiet=t,this.logsStatus=E(this.logsStatus,{clearError:!t});let i=this.gateway.epoch;return await this.logsTask.run(r),this.gateway.epoch===i&&this.logsTask.status===S.COMPLETE}render(){let e=be({loading:this.logsTask.status===S.PENDING&&!this.logsTaskQuiet,refreshDisabled:!this.gateway.connected||this.logsTask.status===S.PENDING,status:this.logsStatus,file:this.logsFile,entries:this.logsEntries,filterText:this.logsFilterText,levelFilters:this.logsLevelFilters,autoFollow:this.logsAutoFollow,truncated:this.logsTruncated,onFilterTextChange:e=>this.logsFilterText=e,onLevelToggle:(e,t)=>{this.logsLevelFilters={...this.logsLevelFilters,[e]:t}},onToggleAutoFollow:e=>this.logsAutoFollow=e,onRefresh:()=>void this.loadLogs({reset:!0}).then(e=>{e&&this.streamFollow.schedule(!0)}),onExport:(e,t)=>{let n=new Date().toISOString().slice(0,19).replace(/[:T]/g,`-`);ce(`zero-logs-${t}-${n}.log`,`${e.join(`
`)}\n`)},onScroll:e=>this.streamFollow.handleScroll(e)});return m`
      <section class="content-header" ${oe({toolbarHeader:!0})}>
        <div>
          <div class="page-title">${ne(`logs`)}</div>
        </div>
      </section>
      ${L(e,{fillHeight:!0})}
    `}},y([ue({context:re,subscribe:!0})],Q.prototype,`context`,void 0),y([g()],Q.prototype,`logsStatus`,void 0),y([g()],Q.prototype,`logsFile`,void 0),y([g()],Q.prototype,`logsEntries`,void 0),y([g()],Q.prototype,`logsFilterText`,void 0),y([g()],Q.prototype,`logsLevelFilters`,void 0),y([g()],Q.prototype,`logsAutoFollow`,void 0),y([g()],Q.prototype,`logsTruncated`,void 0),customElements.get(`zero-logs-page`)||customElements.define(`zero-logs-page`,Q)})))()}$();
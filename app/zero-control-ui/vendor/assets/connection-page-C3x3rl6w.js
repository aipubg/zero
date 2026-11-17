import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Nu as t,Pu as n,Us as r,Ws as i,Yi as a,Zi as o,cl as s,ju as c,ll as l,zu as u}from"./control-ui-core-DCNBgr3X.js";import{Aa as d,Ai as f,Ba as p,Tn as m,_n as ee,hn as h,ki as g,or as _,sr as te,za as ne}from"./control-ui-core-DwX5Mpz4.js";import{G as v,J as y,W as b,Z as x,rt as S}from"./lit-runtime-B40xFCK_.js";import{Lt as re,zt as ie}from"./control-ui-boot-shared-BX8huZUb.js";import{Ur as ae,Wr as oe,Zr as C,rn as w}from"./ui-AaV6iNVa.js";import{G as se,I as T,J as ce,R as le,Y as E,Z as D,l as O,na as k,q as A,ta as j,u as M}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ml as N,Nl as P,cl as F,fa as I,ha as L,ma as R,pa as z,sl as B}from"./control-ui-boot-shared-CzJHozXQ.js";import{n as V,t as H}from"./en-settings-6vMW9YZk.js";import{n as U,o as W}from"./settings-targets-C_s4rJ3N.js";import{i as ue,r as de}from"./login-runtime-vOuJkdwM.js";import{n as fe,t as pe}from"./system-info-QR1vWruo.js";import{a as me,n as he}from"./gateway-vitals-BufdkdND.js";function ge(e){if(e.length===0)return null;let t=e.toSorted((e,t)=>e-t),n=e=>t[Math.ceil(t.length*e)-1];return{count:e.length,averageMs:e.reduce((e,t)=>e+t,0)/e.length,p50Ms:n(.5),p95Ms:n(.95),p99Ms:n(.99)}}function G(){return(G=e((()=>{})))()}function _e(e,t){let n=Math.min(Math.max(t,0),1),r=Math.round(n*100),i=n>=.92?`critical`:n>=.75?`warn`:`ok`;return y`
    <div
      class="config-host__meter"
      role="meter"
      aria-label=${u(`quickSettings.system.usage`,{label:e})}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${r}
    >
      <div
        class="config-host__meter-fill config-host__meter-fill--${i}"
        style="--config-host-meter-fill: ${r}%"
      ></div>
    </div>
  `}function ve(e){let t=e.path?`${e.label} ${e.path}`:e.label;return y`
    <div class="config-host__stat" title=${e.title??v}>
      <div class="config-host__stat-label">
        ${e.label}${e.path?y` <span class="config-host__stat-path">${e.path}</span>`:v}
      </div>
      <div class="config-host__stat-value">
        ${e.value}${e.unit?y` <span class="config-host__stat-unit">${e.unit}</span>`:v}
      </div>
      ${e.usedFraction==null?v:_e(t,e.usedFraction)}
      ${e.detail?y`<div class="config-host__stat-detail">${e.detail}</div>`:v}
    </div>
  `}function ye(e){return`${Math.round(Math.min(Math.max(e,0),1)*100)}%`}function K(e,t,n,r){let i=t==null||n==null||t<=0?void 0:(t-n)/t;return{label:u(`quickSettings.system.${e}`),value:i==null?`—`:ye(i),unit:i==null?void 0:u(`quickSettings.system.used`),detail:u(`quickSettings.system.freeOf`,{free:s(n),total:s(t)}),usedFraction:i,path:r}}function be(e){let t=e.loadAverage?.[0],n=e.loadAverage?u(`quickSettings.system.loadAverage`,{values:e.loadAverage.map(e=>e.toFixed(1)).join(` · `)}):void 0,r=[e.cpuModel,n].filter(Boolean).join(` · `)||void 0,i=u(e.cpuCount===1?`quickSettings.system.core`:`quickSettings.system.cores`,{count:String(e.cpuCount)}),a=[t==null?{label:u(`quickSettings.system.cpu`),value:i,detail:e.cpuModel}:{label:u(`quickSettings.system.cpu`),value:t.toFixed(1),unit:u(`quickSettings.system.load`),detail:i,usedFraction:e.cpuCount>0?t/e.cpuCount:void 0,title:r},K(`memory`,e.memoryTotalBytes,e.memoryFreeBytes)];for(let t of e.disks??[]){let e=K(`disk`,t.totalBytes,t.availableBytes,t.path);e.usedFraction!=null&&a.push(e)}return a}function xe(e){if(e.systemInfoUnavailable)return v;let t=e.systemInfo,n=e.systemInfoLoading?y`<span class="skeleton config-host__placeholder" aria-hidden="true"></span>`:`—`,r=t&&t.hostname!==t.machineName?t.hostname:void 0,i=t?.lanAddress?`${t.lanAddress}${t.port==null?``:`:${t.port}`}`:void 0,a=t?be(t):[`cpu`,`memory`,`disk`].map(e=>({label:u(`quickSettings.system.${e}`),value:n})),o={title:u(`quickSettings.system.gatewayHost`),actions:t?D({kind:`ok`,label:u(`quickSettings.system.up`,{duration:re(t.uptimeMs)})}):void 0};return y`
    <div id=${U.host} aria-busy=${!!e.systemInfoLoading}>
      ${E(o,y`
          <div class="config-host">
            <div class="config-host__identity">
              <div class="config-host__name" title=${r??``}>
                ${t?.machineName??n}
              </div>
              <div class="config-host__meta">
                ${t?`${t.osLabel} · ${t.arch}`:n}
              </div>
              <div class="config-host__meta">
                ${t?u(`quickSettings.system.runtime`,{version:t.nodeVersion,pid:String(t.pid)}):n}
              </div>
              ${i?y`<code class="config-host__address">${i}</code>`:v}
            </div>
            <div class="config-host__stats">${a.map(ve)}</div>
          </div>
        `)}
    </div>
  `}function q(){return(q=e((()=>{b(),T(),n(),l(),ie(),W()})))()}function Se(e){return e?`${(e/1e3).toFixed(e%1e3==0?0:1)}s`:null}function Ce(e,t){let n=t===`password`?`connection.access.passwordHint`:t===`token`?`connection.access.tokenHint`:`connection.access.secretHint`;return A({title:u(`connection.access.secret`),description:u(n),control:y`<div class="settings-input-with-hint">
      ${ce({ariaLabel:u(`connection.access.secret`),value:e.secret,placeholder:u(`connection.access.secretPlaceholder`),visible:e.showGatewaySecret,showLabel:u(`connection.access.showSecret`),hideLabel:u(`connection.access.hideSecret`),toggleLabel:u(`connection.access.toggleSecretVisibility`),onInput:e.onSecretChange,onToggle:e.onToggleGatewaySecretVisibility})}
      ${de(e.secret)===`setup-code`?y`<p class="settings-row__desc" role="status">
              ${u(`connection.access.setupCodeHint`)}
            </p>`:v}
    </div>`,stackedOnNarrow:!0})}function we(e){return`${e.toFixed(1)} ${u(`connection.ping.unit`)}`}function Te(e){let t=[{key:`average`,value:e.ping?.averageMs},{key:`p50`,value:e.ping?.p50Ms},{key:`p95`,value:e.ping?.p95Ms},{key:`p99`,value:e.ping?.p99Ms}];return y`<div class="settings-row connection-ping">
    <dl class="connection-ping__stats" aria-label=${u(`connection.ping.title`)}>
      ${t.map(({key:e,value:t})=>y`<div title=${u(`connection.ping.${e}Hint`)}>
          <dt>${u(`connection.ping.${e}`)}</dt>
          <dd>
            ${t===void 0?`—`:y`${t.toFixed(1)} <span>${u(`connection.ping.unit`)}</span>`}
          </dd>
        </div>`)}
    </dl>
    <zero-sparkline
      class="gateway-vital connection-ping__trend"
      .label=${u(`connection.ping.latest`)}
      .samples=${e.pingSamples}
      .format=${we}
      .floorMax=${100}
    ></zero-sparkline>
    <p class="settings-row__desc">
      ${e.ping?u(`connection.ping.samples`,{count:String(e.ping.count)}):e.pingFailed?v:u(`connection.ping.measuring`)}
      ${e.pingFailed?y`<span class="connection-ping__error" role="status">
              ${u(`connection.ping.failed`)}
            </span>`:v}
    </p>
  </div>`}function J(e){let t=e.hello?.snapshot,n=e.phase===`connected`,i=[`connecting`,`starting`,`reconnecting`].includes(e.phase),a=i&&!e.dirty,o=e.phase===`reload-required`,s=t?.authMode,c=w(e.settings.gatewayUrl)===w(e.liveGatewayUrl)?s:void 0,l=c===`trusted-proxy`,d=n?`connected`:e.phase===`stopped`?`offline`:e.phase,f=u(a?e.phase===`reconnecting`?`connection.access.status.reconnecting`:`connection.access.status.connecting`:n||i?`connection.access.applyReconnect`:e.lastError?`connection.access.retry`:`common.connect`),p=Se(e.hello?.policy?.tickIntervalMs),m=y`
    ${n?Te(e):v}
    ${A({title:u(`connection.access.gatewayUrl`),description:u(`connection.access.gatewayUrlHint`),control:y`
        <input
          class="settings-input"
          aria-label=${u(`connection.access.gatewayUrl`)}
          inputmode="url"
          autocapitalize="none"
          autocorrect="off"
          autocomplete="off"
          spellcheck="false"
          .value=${e.settings.gatewayUrl}
          @input=${t=>{e.onConnectionChange({gatewayUrl:t.target.value})}}
          placeholder="wss://gateway.example:443"
        />
      `})}
    ${l?A({title:u(`connection.access.secret`),description:u(`connection.access.trustedProxy`),control:D({kind:`ok`,label:u(`connection.access.trustedProxyStatus`)})}):Ce(e,c)}
    ${!n&&e.lastError?A({title:D({kind:`danger`,label:u(`connection.access.lastError`)}),description:e.lastError}):v}
    ${(!n||e.dirty)&&!o?y`<div class="settings-row connection-actions">
            <div class="settings-row__text">
              <span class="settings-row__desc" role="status">
                ${e.dirty?u(`connection.access.unsavedHint`):v}
              </span>
            </div>
            <div class="settings-row__control connection-actions__buttons">
              ${e.dirty?y`<button class="btn" @click=${e.onDiscardConnection}>
                      ${u(`connection.access.discard`)}
                    </button>`:v}
              <button class="btn primary" ?disabled=${a} @click=${e.onConnect}>
                ${a?y`<span class="btn__spinner" aria-hidden="true"></span>`:v}
                ${f}
              </button>
            </div>
          </div>`:v}
    <details class="connection-details">
      <summary>${u(`connection.access.details`)}</summary>
      <div class="connection-details__body">
        ${n&&(s||p)?y`<p class="settings-row__desc">
                ${[s?u(Y[s]):null,p?u(`connection.access.tick`,{tick:p}):null].filter(Boolean).join(` · `)}
              </p>`:v}
        <p class="settings-row__desc">${u(`connection.access.reconnectHint`)}</p>
        <button class="btn" ?disabled=${!n||e.dirty} @click=${e.onReconnect}>
          ${u(`connection.access.reconnect`)}
        </button>
      </div>
    </details>
  `;return se([E({title:u(`connection.access.title`),description:n?u(`connection.access.connectedTo`,{host:r(e.liveGatewayUrl)}):u(i||o?`connection.access.status.${d}`:`connection.access.descriptionOffline`),actions:D({kind:n?`ok`:`warn`,label:u(`connection.access.status.${d}`)})},m),E({title:u(`connection.activity.title`),description:u(`connection.activity.description`)},y`<div class="settings-row connection-activity">
        ${me(e.statusHistory.at(-1)?.status??{},e.statusHistory)}
        ${e.statusFailed?y`<p class="settings-row__desc" role="status">
                ${u(`connection.activity.failed`)}
              </p>`:n?e.statusHistory.length===0?y`<p class="settings-row__desc" role="status">${u(`common.loading`)}</p>`:v:y`<p class="settings-row__desc">${u(`connection.activity.offline`)}</p>`}
      </div>`),E({title:u(`connection.access.sessionTitle`),description:u(`connection.access.sessionDescription`,{host:r(e.liveGatewayUrl)})},y`
        ${A({title:u(`connection.access.sessionKey`),description:u(`connection.access.sessionKeyHint`),control:y`
            <input
              class="settings-input"
              aria-label=${u(`connection.access.sessionKey`)}
              .value=${e.settings.sessionKey}
              @input=${t=>e.onSessionKeyChange(t.target.value)}
            />
          `})}
        ${e.sessionDirty?y`<div class="settings-row">
                <div class="settings-row__text"></div>
                <div class="settings-row__control connection-actions__buttons">
                  <button class="btn" @click=${e.onDiscardSession}>
                    ${u(`connection.access.discard`)}
                  </button>
                  <button
                    class="btn primary"
                    ?disabled=${!e.settings.sessionKey.trim()}
                    @click=${e.onSaveSession}
                  >
                    ${u(`common.save`)}
                  </button>
                </div>
              </div>`:e.sessionSaved?y`<div class="settings-row" role="status">${u(`connection.access.saved`)}</div>`:v}
      `),xe(e),e.canForgetDevice?E({title:u(`connection.browser.title`)},A({title:u(`connection.browser.savedSignIn`),control:y`<button class="btn" @click=${e.onForgetDevice}>
              ${u(`connection.browser.forgetDevice`)}
            </button>`})):v])}var Y;function X(){return(X=e((()=>{b(),he(),T(),n(),H(),i(),ue(),q(),V(),Y={none:`connection.access.auth.none`,token:`connection.access.auth.token`,password:`connection.access.auth.password`,"trusted-proxy":`connection.access.auth.trustedProxy`}})))()}var Z,Q;function $(){return($=e((()=>{oe(),b(),x(),d(),f(),h(),_(),j(),T(),O(),n(),a(),i(),R(),P(),t(),F(),G(),pe(),X(),Z=`http://127.0.0.1:18789/gateway/remote`,Q=class extends c{constructor(...e){super(...e),this.settings=ee(),this.password=``,this.gatewaySecretVisible=!1,this.systemInfo=null,this.systemInfoUnavailable=!1,this.ping=null,this.pingFailed=!1,this.pingSamples=[],this.pingRequest=null,this.statusHistory=[],this.statusFailed=!1,this.systemInfoRequest=null,this.sessionKeyBaseline=``,this.sessionGatewayUrl=``,this.sessionSaved=!1,this.diagnosticsPolling=new B(this,I,()=>this.refreshDiagnostics(),!1),this.gateway=new N(this,{getGateway:()=>this.context?.gateway,invalidateRequests:()=>this.resetDiagnostics(),onSnapshot:e=>this.handleGatewaySnapshot(e),onPageActivation:()=>this.syncDiagnosticsPolling()})}disconnectedCallback(){this.resetDiagnostics(),this.gatewaySecretVisible=!1,super.disconnectedCallback()}handleGatewaySnapshot({snapshot:e,initial:t,sourceChanged:n,clientChanged:r}){let i=this.systemInfoUnavailable;t||n||r?(this.resetDiagnostics(),this.resetConnectionDraft(),(t||n||this.sessionGatewayUrl!==this.context.gateway.connection.gatewayUrl)&&this.resetSessionDraft(),this.systemInfo=null,this.systemInfoUnavailable=!1):e.phase!==`connected`&&(this.gatewaySecretVisible=!1,this.systemInfo=null),e.phase===`connected`&&e.hello&&(this.systemInfoUnavailable=!z(e),this.systemInfoUnavailable&&(this.gateway.invalidate(),this.systemInfoRequest?.abort(),this.systemInfoRequest=null,this.systemInfo=null,this.statusFailed=!0)),this.settings.sessionKey===this.sessionKeyBaseline&&(this.settings={...this.settings,sessionKey:e.sessionKey}),this.sessionKeyBaseline=e.sessionKey,this.syncDiagnosticsPolling(),i&&!this.systemInfoUnavailable&&this.loadDiagnostic(`system-info`)}stopDiagnosticsPolling(){this.diagnosticsPolling.stop(),this.pingRequest?.abort(),this.pingRequest=null,this.systemInfoRequest?.abort(),this.systemInfoRequest=null}resetDiagnostics(){this.stopDiagnosticsPolling(),this.pingSamples=[],this.ping=null,this.pingFailed=!1,this.statusHistory=[],this.statusFailed=!1}syncDiagnosticsPolling(){let e=this.context.gateway.snapshot;if(!this.isConnected||document.visibilityState===`hidden`||e.phase!==`connected`||!e.client){this.stopDiagnosticsPolling();return}this.diagnosticsPolling.start()&&this.refreshDiagnostics()}refreshDiagnostics(){this.loadDiagnostic(`ping`),this.loadDiagnostic(`system-info`)}async loadDiagnostic(e){let t=this.gateway.gateway,n=this.gateway.capture(),r=e===`ping`,i=r?`pingRequest`:`systemInfoRequest`;if(!t||t!==this.context.gateway||!n||!r&&this.systemInfoUnavailable||this[i]||document.visibilityState===`hidden`)return;let a=new AbortController;this[i]=a;let s=()=>this[i]===a&&this.isConnected&&document.visibilityState!==`hidden`&&this.context.gateway===t&&this.gateway.isCurrent(n),c=r?performance.now():0;try{if(r){if(await n.client.request(`last-heartbeat`,{},{timeoutMs:I,signal:a.signal}),!s())return;this.pingSamples=[...this.pingSamples.slice(-99),{at:Date.now(),value:performance.now()-c}],this.ping=ge(this.pingSamples.map(e=>e.value)),this.pingFailed=!1}else{let e=await L(t,a.signal);if(!s())return;this.systemInfo=e.value,this.diagnosticsPolling.stop(),this.diagnosticsPolling.start(),this.statusHistory.at(-1)?.at!==e.at&&(this.statusHistory=[...this.statusHistory.slice(-99),{at:e.at,status:{eventLoop:e.value.eventLoop,processMemory:e.value.processMemory}}]),this.statusFailed=!1}}catch(e){if(!s())return;r?this.pingFailed=!0:(this.statusFailed=!0,(o(e)||fe(e))&&(this.systemInfo=null,this.systemInfoUnavailable=!0))}finally{this[i]===a&&(this[i]=null)}}resetConnectionDraft(){let{gatewayUrl:e,token:t,password:n}=this.context.gateway.connection;this.settings={...this.settings,gatewayUrl:e,token:t},this.password=n,this.gatewaySecretVisible=!1}resetSessionDraft(){this.sessionGatewayUrl=this.context.gateway.connection.gatewayUrl,this.sessionKeyBaseline=this.context.gateway.snapshot.sessionKey,this.settings={...this.settings,sessionKey:this.sessionKeyBaseline},this.sessionSaved=!1}saveSession(){this.context.gateway.setSessionKey(this.settings.sessionKey),this.resetSessionDraft(),this.sessionSaved=!0}async forgetDevice(){let e=this.context.gateway,t=e.connection.gatewayUrl;await k({title:u(`connection.browser.confirmTitle`),message:u(`connection.browser.confirmMessage`,{gateway:r(t)}),confirmLabel:u(`connection.browser.confirmLabel`),danger:!0})&&this.isConnected&&this.context.gateway===e&&e.connection.gatewayUrl===t&&(e.forgetDeviceToken?.(),this.requestUpdate())}updateConnection(e){if(e.gatewayUrl!==void 0){let t=m(this.settings.gatewayUrl,e.gatewayUrl,{token:this.settings.token,password:this.password});this.password=t.password,this.settings={...this.settings,...e,token:t.token};return}this.settings={...this.settings,...e}}render(){let e=this.context.gateway.snapshot,t=this.context.gateway.connection,n=this.settings.gatewayUrl!==t.gatewayUrl||this.settings.token!==t.token||this.password!==t.password,r=J({phase:e.phase,hello:e.hello,settings:this.settings,liveGatewayUrl:t.gatewayUrl,secret:this.settings.token||this.password,lastError:e.lastError,systemInfo:this.systemInfo,systemInfoLoading:this.systemInfoRequest!==null,systemInfoUnavailable:this.systemInfoUnavailable,ping:this.ping,pingFailed:this.pingFailed,pingSamples:this.pingSamples,statusHistory:this.statusHistory,statusFailed:this.statusFailed,dirty:n,sessionDirty:this.settings.sessionKey.trim()!==e.sessionKey,sessionSaved:this.sessionSaved,showGatewaySecret:this.gatewaySecretVisible,canForgetDevice:this.context.gateway.hasStoredDeviceToken?.()??!1,onForgetDevice:()=>void this.forgetDevice(),onConnectionChange:e=>this.updateConnection(e),onSecretChange:e=>{this.password=``,this.updateConnection({token:e})},onSessionKeyChange:e=>{this.sessionSaved=!1,this.settings={...this.settings,sessionKey:e}},onToggleGatewaySecretVisibility:()=>{this.gatewaySecretVisible=!this.gatewaySecretVisible},onConnect:()=>this.context.gateway.connect({gatewayUrl:this.settings.gatewayUrl,token:this.settings.token,password:this.password}),onDiscardConnection:()=>this.resetConnectionDraft(),onReconnect:()=>this.context.gateway.connect(),onSaveSession:()=>this.saveSession(),onDiscardSession:()=>this.resetSessionDraft()});return y`
      <section class="content-header" ${te({toolbarHeader:!0})}>
        <div>
          <h1 class="page-title">${p(`connection`)}</h1>
          <div class="page-subtitle">
            ${ne(`connection`)} ${le(Z)}
          </div>
        </div>
      </section>
      ${M(r)}
    `}},C([ae({context:g,subscribe:!0})],Q.prototype,`context`,void 0),C([S()],Q.prototype,`settings`,void 0),C([S()],Q.prototype,`password`,void 0),C([S()],Q.prototype,`gatewaySecretVisible`,void 0),C([S()],Q.prototype,`systemInfo`,void 0),C([S()],Q.prototype,`systemInfoUnavailable`,void 0),C([S()],Q.prototype,`ping`,void 0),C([S()],Q.prototype,`pingFailed`,void 0),C([S()],Q.prototype,`statusHistory`,void 0),C([S()],Q.prototype,`statusFailed`,void 0),C([S()],Q.prototype,`systemInfoRequest`,void 0),C([S()],Q.prototype,`sessionSaved`,void 0),customElements.get(`zero-connection-page`)||customElements.define(`zero-connection-page`,Q)})))()}$();
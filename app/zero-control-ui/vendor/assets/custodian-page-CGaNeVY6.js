import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ai as t,Di as n,Ic as r,Lc as i,Nu as a,Pu as o,W as s,ju as c,z as l,zu as u}from"./control-ui-core-DCNBgr3X.js";import{Ai as d,ki as f}from"./control-ui-core-DwX5Mpz4.js";import{G as p,J as m,W as h,Z as g,at as _,rt as v}from"./lit-runtime-B40xFCK_.js";import{d as y,l as b}from"./gateway-runtime-JSfC8ThO.js";import{Ur as x,Wr as S,Zr as C}from"./ui-AaV6iNVa.js";import{I as w,U as T,ot as E}from"./control-ui-boot-shared-ZuP0LiFD.js";import{i as D,r as O,t as k}from"./chat/zero-surface-uGYwC5Bd.js";import"./control-ui-boot-shared-styles-BXPMRytW.js";function A(e){return m`
    <article class="custodian__change-card ${e.invalid?`is-invalid`:``}">
      <div class="custodian__change-meta">
        <span class="custodian__change-source">${u(M[e.source])}</span>
        <time datetime=${new Date(e.at).toISOString()}
          >${l(e.at)}</time
        >
      </div>
      <div class="custodian__change-summary">${e.summary}</div>
      ${e.invalid?m`<div class="custodian__change-warning">${u(`custodian.history.invalidEdit`)}</div>`:p}
      ${e.opaqueChange?m`<div class="custodian__change-note">${u(`custodian.history.opaqueChange`)}</div>`:p}
      ${e.changedPaths?.length?m`<details class="custodian__change-paths">
              <summary>
                ${u(`custodian.history.changedPaths`,{count:String(e.changedPaths.length)})}
              </summary>
              <ul>
                ${e.changedPaths.map(e=>m`<li><code>${e}</code></li>`)}
              </ul>
            </details>`:p}
    </article>
  `}function j(e){return m`
    <section class="custodian__history" aria-label=${u(`custodian.history.title`)}>
      <div class="custodian__history-heading">
        <strong>${u(`custodian.history.title`)}</strong>
        <span>${u(`custodian.history.description`)}</span>
      </div>
      ${e.error?m`<div class="custodian__history-error" role="alert">
              <span>${e.error}</span>
              <button class="btn btn--sm" type="button" @click=${()=>e.onLoad(!0)}>
                ${u(`common.retry`)}
              </button>
            </div>`:p}
      ${e.loading&&e.entries.length===0?T({label:u(`custodian.history.loading`)}):m`<div class="custodian__change-list">
              ${e.entries.map(A)}
              ${e.loading?m`<div
                      class="custodian__history-state"
                      role="status"
                      aria-label=${u(`custodian.history.loading`)}
                    >
                      <span class="custodian__history-spinner" aria-hidden="true"></span>
                    </div>`:e.loaded&&e.entries.length===0&&!e.error?m`<div class="custodian__history-state" role="status">
                        ${u(`custodian.history.empty`)}
                      </div>`:p}
            </div>`}
      ${e.nextCursor?m`<button
              class="btn btn--ghost custodian__history-more"
              type="button"
              ?disabled=${e.loadingMore}
              @click=${()=>e.onLoad(!1)}
            >
              ${u(e.loadingMore?`custodian.history.loadingMore`:`custodian.history.loadMore`)}
            </button>`:p}
    </section>
  `}var M;function N(){return(N=e((()=>{h(),w(),o(),s(),M={"system-agent":`custodian.history.sources.systemAgent`,doctor:`custodian.history.sources.doctor`,"config-rpc":`custodian.history.sources.settings`,external:`custodian.history.sources.manualEdit`,cli:`custodian.history.sources.cli`,"plugin-install":`custodian.history.sources.pluginInstall`,unknown:`custodian.history.sources.unknown`}})))()}function P(e){return m`
    <zero-custodian-page
      .onboarding=${e?.onboarding===!0}
      .newAgentIntent=${e?.intent===`new-agent`}
    ></zero-custodian-page>
  `}var F,I;function L(){return(L=e((()=>{S(),h(),g(),d(),E(),o(),t(),b(),a(),i(),N(),D(),k(),F=50,I=class extends c{constructor(){super(),this.onboarding=!1,this.newAgentIntent=!1,this.store=O,this.historyAvailable=!1,this.historyOpen=!1,this.historyEntries=[],this.historyNextCursor=null,this.historyLoad=`idle`,this.historyError=null,this.historyLoaded=!1,this.historyClient=null,this.historyRequestEpoch=0,this.channelsSource=null,new r(this).watch(()=>this.store,(e,t)=>{let n=e.subscribe(t);return e.refreshTranscriptIfIdle(),n}).effect(()=>this.context?.channels,e=>{this.channelsSource=e;let t=e.subscribe(()=>{this.ensureOnboardingChannelStatus(),this.requestUpdate()});return this.ensureOnboardingChannelStatus(),()=>{t(),this.channelsSource===e&&(this.channelsSource=null)}})}async getUpdateComplete(){let e=await super.getUpdateComplete();return await this.querySelector(`zero-custodian-surface`)?.updateComplete,e}willUpdate(){this.synchronizeHistoryClient(),this.ensureOnboardingChannelStatus()}ensureOnboardingChannelStatus(){let e=this.channelsSource;if(!this.onboarding||this.store.channelOnboardingNudgeClosed||!e)return;let t=e.state;!t.connected||t.channelsSnapshot||t.channelsLoading||t.channelsError||e.refresh(!1)}synchronizeHistoryClient(){let e=this.context.gateway.snapshot,t=e.phase===`connected`?e.client:null,n=t!==null&&y(e,`zero.changes.list`)===!0;(t!==this.historyClient||n!==this.historyAvailable)&&(this.historyClient=t,this.historyAvailable=n,this.historyOpen=!1,this.resetHistory())}resetHistory(){this.historyRequestEpoch+=1,this.historyEntries=[],this.historyNextCursor=null,this.historyLoad=`idle`,this.historyError=null,this.historyLoaded=!1}toggleHistory(){this.historyOpen=!this.historyOpen,this.historyOpen&&this.historyLoad===`idle`&&this.loadHistory(!0)}async loadHistory(e){let t=this.historyClient,n=e?void 0:this.historyNextCursor??void 0;if(!t||!this.historyAvailable||this.historyLoad!==`idle`||!e&&!n)return;let r=++this.historyRequestEpoch;this.historyLoad=e?`initial`:`more`,this.historyError=null;let i=()=>this.isConnected&&this.historyClient===t&&this.historyRequestEpoch===r&&this.historyAvailable;try{let r=await t.request(`zero.changes.list`,{limit:F,...n?{beforeCursor:n}:{}});if(!i())return;this.historyEntries=e?r.entries:[...this.historyEntries,...r.entries],this.historyNextCursor=r.nextCursor??null}catch{i()&&(this.historyError=u(`custodian.history.requestFailed`))}finally{i()&&(this.historyLoad=`idle`,this.historyLoaded=!0)}}render(){let e=this.channelsSource?.state,t=e?.channelsSnapshot??null,r=this.onboarding&&!this.store.channelOnboardingNudgeClosed&&e?.connected?e?.channelsError??null:null,i=this.onboarding&&!this.store.channelOnboardingNudgeClosed&&e?.connected&&!e.channelsLoading&&r===null&&t!==null&&t.partial!==!0&&!n(t),a=this.historyOpen&&this.historyAvailable?j({entries:this.historyEntries,error:this.historyError,loaded:this.historyLoaded,loading:this.historyLoad===`initial`,loadingMore:this.historyLoad===`more`,nextCursor:this.historyNextCursor,onLoad:e=>void this.loadHistory(e)}):p;return m`
      <section
        class="custodian custodian--page ${this.store.setupRequired?`custodian--setup-required`:``}"
      >
        <header
          class="custodian__header custodian__column ${this.onboarding?`custodian__header--minimal`:``}"
        >
          ${this.onboarding?p:m`<div class="custodian__identity">
                  <div class="custodian__mark" aria-hidden="true">
                    <zero-mascot
                      .mood=${this.store.sending?`thinking`:`idle`}
                      .size=${38}
                    ></zero-mascot>
                  </div>
                  <div>
                    <h1>${u(`custodian.title`)}</h1>
                    <p>${u(`custodian.subtitleCaretaker`)}</p>
                  </div>
                </div>`}
          <div class="custodian__header-actions">
            ${this.onboarding?m`<zero-sidebar-attention></zero-sidebar-attention>`:p}
            ${this.historyAvailable?m`<button
                    class="btn btn--ghost custodian__history-toggle"
                    type="button"
                    aria-expanded=${this.historyOpen?`true`:`false`}
                    @click=${()=>this.toggleHistory()}
                  >
                    ${u(`custodian.history.button`)}
                  </button>`:p}
            ${this.onboarding?m`<button
                    class="btn btn--ghost"
                    type="button"
                    @click=${()=>this.store.exitSetup()}
                  >
                    ${u(`custodian.exitSetup`)}
                  </button>`:p}
          </div>
        </header>

        <zero-custodian-surface
          class="custodian__column"
          .store=${this.store}
          .onboarding=${this.onboarding}
          .newAgentIntent=${this.newAgentIntent}
          .showChannelOnboardingNudge=${i}
          .channelOnboardingError=${r}
          .channelOnboardingRetrying=${e?.channelsLoading??!1}
          .onRetryChannelOnboarding=${()=>void this.channelsSource?.refresh(!1)}
          .historyContent=${a}
        ></zero-custodian-surface>
      </section>
    `}},C([x({context:f,subscribe:!0})],I.prototype,`context`,void 0),C([_({attribute:!1})],I.prototype,`onboarding`,void 0),C([_({attribute:!1})],I.prototype,`newAgentIntent`,void 0),C([_({attribute:!1})],I.prototype,`store`,void 0),C([v()],I.prototype,`historyAvailable`,void 0),C([v()],I.prototype,`historyOpen`,void 0),C([v()],I.prototype,`historyEntries`,void 0),C([v()],I.prototype,`historyNextCursor`,void 0),C([v()],I.prototype,`historyLoad`,void 0),C([v()],I.prototype,`historyError`,void 0),customElements.get(`zero-custodian-page`)||customElements.define(`zero-custodian-page`,I)})))()}L();export{P as renderCustodianRoute};
const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./board-view-DLE27QW_.js","./gateway-runtime-JSfC8ThO.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-boot-shared-ZuP0LiFD.js","./control-ui-boot-shared-CZXdmeIi.js","./control-ui-boot-shared-BRtBCr5s.js","./control-ui-boot-shared-4Y4EIRNw.js","./control-ui-boot-shared-E4pYPcWx.js","./plugin-contracts-runtime-BO_sRtcl.js","./control-ui-boot-shared-D2GHitQ4.js","./config-runtime-BecGLziM.js","./markdown-runtime-ORQpioyT.js","./control-ui-boot-shared-BX8huZUb.js","./control-ui-boot-shared-CzJHozXQ.js","./control-ui-boot-shared-styles-BXPMRytW.js","./sidebar-update-runtime-B2P2sMaT.js","./control-ui-boot-chat-B3rfqCeq.js","./control-ui-boot-chat-BVLkkfEk.js","./control-ui-boot-chat-zkzP5WWm.js","./control-ui-boot-chat-Cx6CBnJr.js","./chat-transcript-styles-BN-TorbW.js","./control-ui-boot-chat-styles-BcslGtWC.js","./control-ui-disabled-uxxPH1xo.js","./near-viewport-observer-WgGck829.js","./widget-sandbox-host-DmaxFipY.js","./mcp-app-confirm-B_IXP1_0.js","./sandbox-host-Dm6XHU23.js","./control-ui-core-DI-Q_yCI.css","./control-ui-boot-shared-styles-DUf4zEvn.css","./control-ui-boot-shared-DIWJGbGi.css","./sidebar-update-runtime-Bpn2ByHA.css","./chat-transcript-styles-B0IJwY9P.css","./control-ui-boot-chat-styles-SRk09zDG.css","./control-ui-boot-chat-C2DT0d4M.css","./board-view-CCkz6swN.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Nu as t,Pu as n,ju as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{Bi as a,Vi as o,ca as s,sa as c}from"./control-ui-core-DwX5Mpz4.js";import{G as l,J as u,W as d,Z as f,at as p,rt as m}from"./lit-runtime-B40xFCK_.js";import{Zr as h,ma as g,pa as _}from"./ui-AaV6iNVa.js";import{F as v,I as y,P as b,R as x}from"./control-ui-boot-chat-D02HpoEK.js";var S;function C(){return(C=e((()=>{d(),f(),o(),s(),n(),x(),t(),g(),S=class extends r{constructor(...e){super(...e),this.session=null,this.client=null,this.connected=!1,this.canMutate=!1,this.canGrant=!1,this.presented=!0,this.provider=null,this.expanded=!1,this.activeTabId=``,this.viewError=null,this.viewLoad=null,this.lease=null,this.unsubscribeSnapshot=null,this.expansionInitialized=!1}connectedCallback(){super.connectedCallback(),this.requestUpdate()}updated(){this.viewLoad??=a(`zero-board-view`,()=>_(()=>import(`./board-view-DLE27QW_.js`).then(e=>(e.n(),e.t)),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34]),import.meta.url)).catch(e=>{this.viewError=e instanceof Error?e.message:String(e)}),this.synchronizeProvider()}disconnectedCallback(){this.releaseProvider(),super.disconnectedCallback()}synchronizeProvider(){let e=this.session,t=this.client;if(!this.isConnected||!e?.sessionKey.trim()||!t){this.releaseProvider();return}let n=y(e);if(this.lease?.client===t&&this.lease.cacheKey===n){(this.lease.session.sessionKey!==e.sessionKey||this.lease.session.agentId!==e.agentId)&&(this.lease.session={...e},this.requestUpdate()),this.lease.update(t,this.connected,{canPinWidgets:!1,canPinMcpApps:!1,canMutate:this.canMutate,canGrant:this.canGrant});return}this.releaseProvider(),this.expansionInitialized=!1,this.activeTabId=``;let r=b(e,t,this.connected,!1,!1,this.canMutate,this.canGrant);this.lease={...r,client:t,cacheKey:n,session:{...e}},this.provider=r.provider,this.unsubscribeSnapshot=r.provider.snapshot$.subscribe(()=>{this.reconcileSnapshot(r.provider),this.requestUpdate()}),this.reconcileSnapshot(r.provider),this.requestUpdate()}releaseProvider(){this.unsubscribeSnapshot?.(),this.unsubscribeSnapshot=null,this.lease?.release(),this.lease=null,this.provider=null}reconcileSnapshot(e){let t=e.snapshot$.value,n=t.tabs[0]?.tabId??``;t.tabs.some(e=>e.tabId===this.activeTabId)||(this.activeTabId=n),!this.expansionInitialized&&e.hasLoadedSnapshot&&(this.expansionInitialized=!0,this.expanded=v(t))}render(){let e=this.provider,t=e?.snapshot$.value,n=this.lease?.session,r=!!(t&&v(t)),a=e?{appViewGeneration:e.appViewGeneration,applyOps:t=>e.applyOps(t),grant:(t,n)=>e.grant(t,n),selectTab:e=>{this.activeTabId=e},frameLoadFailed:t=>e.refreshWidgetFrame(t),widgetAppView:(t,n)=>e.widgetAppView(t,n),refreshWidgetAppView:(t,n)=>e.refreshWidgetAppView(t,n)}:null;return u`
      <section class="plugin-session-dashboard">
        <button
          type="button"
          class="plugin-session-dashboard__toggle"
          aria-expanded=${this.expanded?`true`:`false`}
          @click=${()=>{this.expansionInitialized=!0,this.expanded=!this.expanded}}
        >
          <span class="plugin-session-dashboard__title">
            ${c.kanban}<span>${i(`pluginUi.dashboardTitle`)}</span>
          </span>
          <span class="plugin-session-dashboard__chevron" aria-hidden="true"
            >${c.arrowDown}</span
          >
        </button>
        <div class="plugin-session-dashboard__body" ?hidden=${!this.expanded}>
          ${this.viewError?u`<p role="alert">${this.viewError}</p>
                  <button
                    type="button"
                    @click=${()=>{this.viewLoad=null,this.viewError=null}}
                  >
                    ${i(`common.retry`)}
                  </button>`:r&&e&&t&&n&&a?u`
                    <zero-board-view
                      .active=${this.expanded&&this.presented}
                      .session=${n}
                      .snapshot=${t}
                      .activeTabId=${this.activeTabId}
                      .widgetFrameUrl=${(t,n)=>e.widgetFrameUrl(t,n)}
                      .callbacks=${a}
                      .sessions=${[]}
                      .canMutate=${this.canMutate}
                      .canGrant=${this.canGrant}
                    ></zero-board-view>
                  `:u`<p class="plugin-session-dashboard__empty">
                    ${i(`pluginUi.dashboardEmpty`)}
                  </p>`}
        </div>
        ${!this.expanded&&this.expansionInitialized&&!r?u`<p class="plugin-session-dashboard__collapsed-empty">
                ${i(`pluginUi.dashboardEmpty`)}
              </p>`:l}
      </section>
    `}},h([p({attribute:!1})],S.prototype,`session`,void 0),h([p({attribute:!1})],S.prototype,`client`,void 0),h([p({attribute:!1})],S.prototype,`connected`,void 0),h([p({attribute:!1})],S.prototype,`canMutate`,void 0),h([p({attribute:!1})],S.prototype,`canGrant`,void 0),h([p({attribute:!1})],S.prototype,`presented`,void 0),h([m()],S.prototype,`provider`,void 0),h([m()],S.prototype,`expanded`,void 0),h([m()],S.prototype,`activeTabId`,void 0),h([m()],S.prototype,`viewError`,void 0),customElements.get(`zero-plugin-session-dashboard`)||customElements.define(`zero-plugin-session-dashboard`,S)})))()}C();
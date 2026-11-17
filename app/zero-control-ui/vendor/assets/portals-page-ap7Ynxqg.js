import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gu as t,Ic as n,Lc as r,Nu as i,Pu as a,Ti as o,Wu as s,ju as c,xu as l,yu as u,zu as d}from"./control-ui-core-DCNBgr3X.js";import{Aa as f,Ai as p,Ba as m,ca as h,ki as g,oa as _,or as v,sr as y}from"./control-ui-core-DwX5Mpz4.js";import{E as b,G as x,J as S,W as C,Z as w,at as T,c as E,k as D,l as O,rt as k}from"./lit-runtime-B40xFCK_.js";import{c as A,d as j,l as M}from"./gateway-runtime-JSfC8ThO.js";import{Ur as N,Wr as P,Zr as F}from"./ui-AaV6iNVa.js";import{Ml as I,Nl as L,cl as R,sl as z}from"./control-ui-boot-shared-CzJHozXQ.js";var B,V;function H(){return(H=e((()=>{t(),B={portalsPage:{listLabel:`Active portals`,portLabel:`Port {port}`,openNewTab:`Open in new tab`,closePortal:`Close {title}`,previewTitle:`{title} portal preview`,loading:`Loading portals…`,emptyHint:`Ask the agent to start a portal:`,unavailable:`This portal is no longer available. Ask the agent to reopen the application.`,environmentStarting:`Starting your machine…`,waitingForApp:`Machine ready. Waiting for your application…`,environmentUnavailable:`The machine could not start. Ask the agent to check it or try again.`,promptShow:`Show me in a portal.`,promptStart:`Start the application in a portal.`,promptMakeAvailable:`Make the server available in a portal.`,unsupported:`This gateway does not support portals.`,loadFailed:`Could not load portals: {error}`,closeFailed:`Could not close the portal: {error}`,unreachableTitle:`Portal not reachable from this browser`,unreachableBody:`Check the portal URL's DNS, TLS, and network access. For private Tailscale Serve, allow its HTTPS port in your tailnet policy. For a reverse proxy, check the dedicated portal ingress route, then retry.`,newTabRequiredTitle:`Open this HTTP portal in a new tab`,newTabRequiredBody:`This portal uses HTTP with a different hostname or scheme from the Control UI. Open the link in a new tab so its authentication cookies work, or use an HTTPS portal for an embedded preview.`,ingressRequiredTitle:`Remote portal ingress required`,ingressRequiredBody:`This Gateway returned a loopback URL, which points to this browser's machine. Use a browser on the Gateway host, enable managed private Tailscale Serve, or configure gateway.portals.ingress with a separate private HTTPS wildcard proxy. Forwarding only the Gateway port is not enough.`,writeAccessRequiredTitle:`Write access required`,writeAccessRequiredBody:`This portal requires an operator with write access.`,retry:`Retry`}},V=Object.assign(()=>{s.portalsPage=B.portalsPage},{catalog:B})})))()}async function U(e){let t=URL.parse(e);if(!t)return`unreachable`;let n=!1,r=e=>{URL.parse(e.blockedURI)?.origin===t.origin&&(n=!0)},i=typeof document>`u`?void 0:document;i?.addEventListener(`securitypolicyviolation`,r);try{return await fetch(e,{mode:`no-cors`,signal:AbortSignal.timeout(W)}),`reachable`}catch{return await new Promise(e=>{setTimeout(e,0)}),n?`blocked`:`unreachable`}finally{i?.removeEventListener(`securitypolicyviolation`,r)}}var W;function G(){return(G=e((()=>{W=4e3})))()}function K(e,t){let n=new URL(e),r=new URL(t);return n.protocol===`http:`&&(r.protocol!==n.protocol||r.hostname!==n.hostname)}function q(e,t){return o(new URL(e).hostname)&&!o(new URL(t).hostname)}function J(){return(J=e((()=>{})))()}var Y,X;function Z(){return(Z=e((()=>{P(),C(),w(),E(),b(),f(),p(),v(),h(),a(),H(),l(),M(),L(),i(),R(),r(),G(),J(),V(),Y=`allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts`,X=class extends c{constructor(...e){super(...e),this.embedded=!1,this.presented=!0,this.requestedPortalId=null,this.requestedEnvironmentId=null,this.portals=[],this.selectedPortalId=null,this.loading=!1,this.loaded=!1,this.error=null,this.closingPortalId=null,this.portalProbeState=null,this.pendingEnvironment=null,this.environmentFailure=null,this.environmentRequestGeneration=0,this.environmentLoading=!1,this.environmentPoll=new z(this,2e3,()=>void this.loadPendingEnvironment(),!1),this.requestGeneration=0,this.portalSetRevision=0,this.portalProbeGeneration=0,this.portalProbeCache=new Map,this.gateway=new I(this,{getGateway:()=>this.context?.gateway,invalidateRequests:()=>this.resetGatewayState(),ensureInitialData:()=>void this.loadPresentation()}),this.subscriptions=new n(this).effect(()=>this.context?.gateway,e=>e.subscribeEvents(t=>{this.gateway.gateway===e&&this.context.gateway===e&&this.gateway.connected&&t.event===`portal.changed`&&this.loadPresentation()}))}disconnectedCallback(){this.environmentRequestGeneration+=1,this.portalProbeGeneration+=1,this.subscriptions.clear(),super.disconnectedCallback()}updated(e){[`requestedPortalId`,`requestedEnvironmentId`].some(t=>e.has(t)&&e.get(t)!==void 0)?(this.requestGeneration+=1,this.resetPendingEnvironment(),this.loading=!1,this.portalProbeGeneration+=1,this.portalProbeState=null,this.applyPortalSet(this.portals),this.loadPresentation()):e.has(`presented`)&&e.get(`presented`)!==void 0&&this.presented?this.loadPresentation():e.has(`presented`)&&!this.presented&&(this.environmentPoll.stop(),this.environmentRequestGeneration+=1,this.environmentLoading=!1)}handleToggleRequest(e){let t=e instanceof CustomEvent?e.detail:null;if(t?.open!==!1){if(t?.portalId&&(t.portalId!==this.requestedPortalId||this.requestedEnvironmentId!==null)){this.requestedPortalId=t.portalId,this.requestedEnvironmentId=null;return}if(t?.environmentId&&(t.environmentId!==this.requestedEnvironmentId||this.requestedPortalId!==null)){this.requestedEnvironmentId=t.environmentId,this.requestedPortalId=null;return}this.loadPresentation()}}get pendingEnvironmentId(){return this.requestedPortalId?null:this.requestedEnvironmentId}loadPresentation(){return this.pendingEnvironmentId?this.loadPendingEnvironment():this.loadPortals()}async loadPendingEnvironment(){let e=this.pendingEnvironmentId,t=this.gateway.capture();if(!e||!t||!this.canReadPortalState||this.environmentLoading||this.embedded&&!this.presented)return;let n=++this.environmentRequestGeneration,r=()=>this.gateway.isCurrent(t)&&n===this.environmentRequestGeneration&&this.pendingEnvironmentId===e;this.environmentLoading=!0,this.environmentFailure=null;try{let n=await t.client.request(`environments.status`,{environmentId:e});if(!r())return;if(n.id!==e)throw Error(`Environment status returned a different target`);this.pendingEnvironment=n,n.status===`starting`?this.environmentPoll.start():this.environmentPoll.stop()}catch(t){r()&&(this.environmentFailure={environmentId:e,message:u(t)},this.environmentPoll.stop())}finally{r()&&(this.environmentLoading=!1)}}get portalListSupported(){return j(this.gateway.snapshot??{},`portal.list`)!==!1}get canReadPortalState(){return A(this.gateway.snapshot,this.pendingEnvironmentId?`environments.status`:`portal.list`,`operator.read`,{requireAdvertisement:!1})}get canClosePortal(){return A(this.gateway.snapshot,`portal.close`,`operator.write`)}resetPendingEnvironment(){this.environmentRequestGeneration+=1,this.environmentLoading=!1,this.pendingEnvironment=null,this.environmentFailure=null,this.environmentPoll.stop()}resetGatewayState(){this.resetPendingEnvironment(),this.requestGeneration+=1,this.portalSetRevision+=1,this.portals=[],this.selectedPortalId=null,this.loading=!1,this.loaded=!1,this.error=null,this.closingPortalId=null,this.portalProbeGeneration+=1,this.portalProbeCache.clear(),this.portalProbeState=null}applyPortalSet(e){this.portalSetRevision+=1,this.portals=[...e];let t=this.selectedPortalId,n=this.pendingEnvironmentId?null:this.requestedPortalId??(e.some(e=>e.id===t)?this.selectedPortalId:e[0]?.id??null);this.selectedPortalId=n,this.loaded=!0,this.error=null;let r=e.find(e=>e.id===n);r?this.ensurePortalProbe(r,n!==t):(this.portalProbeGeneration+=1,this.portalProbeState=null)}ensurePortalProbe(e,t=!1){if(!e.tokenQuery||!e.url){this.portalProbeGeneration+=1,this.portalProbeState=null;return}let n=e.url,r=`${e.id}\u0000${n}`;if(!t&&this.portalProbeState?.key===r)return;if(q(n,this.context.gateway.connection.gatewayUrl)){this.portalProbeGeneration+=1,this.portalProbeState={key:r,status:`ingress-required`};return}if(K(n,location.href)){this.portalProbeGeneration+=1,this.portalProbeState={key:r,status:`new-tab-required`};return}let i=t?void 0:this.portalProbeCache.get(r);if(i!==void 0){this.portalProbeState={key:r,status:i};return}let a=++this.portalProbeGeneration;this.portalProbeState={key:r,status:`probing`},U(n).then(e=>{a===this.portalProbeGeneration&&this.portalProbeState?.key===r&&(this.portalProbeCache.set(r,e),this.portalProbeState={key:r,status:e})})}selectPortal(e){e.id!==this.selectedPortalId&&(this.selectedPortalId=e.id,this.ensurePortalProbe(e,!0))}async loadPortals(){if(this.pendingEnvironmentId||!this.canReadPortalState||!this.portalListSupported||this.loading||this.embedded&&!this.presented)return;let e=this.gateway.capture();if(!e)return;let t=++this.requestGeneration,n=this.portalSetRevision,r=()=>t===this.requestGeneration&&this.gateway.isCurrent(e);this.loading=!0,this.error=null;try{let t=await e.client.request(`portal.list`,{});r()&&n===this.portalSetRevision&&this.applyPortalSet(t.portals)}catch(e){r()&&this.portalListSupported&&(this.error=d(`portalsPage.loadFailed`,{error:u(e)}),this.loaded=!0)}finally{r()&&(this.loading=!1)}}async closePortal(e){if(!this.canClosePortal||this.closingPortalId)return;let t=this.gateway.capture();if(t){this.closingPortalId=e.id,this.error=null;try{await t.client.request(`portal.close`,{id:e.id}),this.gateway.isCurrent(t)&&this.loadPortals()}catch(e){this.gateway.isCurrent(t)&&(this.error=d(`portalsPage.closeFailed`,{error:u(e)}))}finally{this.gateway.isCurrent(t)&&this.closingPortalId===e.id&&(this.closingPortalId=null)}}}renderEmptyState(){let e=!this.portalListSupported;return this.gateway.connected&&!this.canReadPortalState?S`<section class="portals-empty" role="status" aria-live="polite">
        <div class="portals-empty__note">
          ${d(`sessionsView.actionRequiresScope`,{scope:`operator.read`})}
        </div>
      </section>`:S`
      <section class="portals-empty" role="status" aria-live="polite">
        ${this.loading&&!this.loaded?S`<div class="portals-empty__title">${d(`portalsPage.loading`)}</div>`:S`
                <div class="portals-empty__title">
                  ${d(this.requestedPortalId?`portalsPage.unavailable`:`portalsPage.emptyHint`)}
                </div>
                ${this.requestedPortalId?x:S`<div class="portals-empty__prompts">
                        <span>${d(`portalsPage.promptShow`)}</span>
                        <span>${d(`portalsPage.promptStart`)}</span>
                        <span>${d(`portalsPage.promptMakeAvailable`)}</span>
                      </div>`}
              `}
        ${e?S`<div class="portals-empty__note">${d(`portalsPage.unsupported`)}</div>`:x}
        ${this.error?S`<div class="callout danger">${this.error}</div>`:x}
      </section>
    `}renderPortal(e){if(!e.tokenQuery||!e.url)return S`
        <section class="portals-preview">
          <div class="portals-preview__notice" role="status">
            <div class="portals-preview__notice-title">
              ${d(`portalsPage.writeAccessRequiredTitle`)}
            </div>
            <p>${d(`portalsPage.writeAccessRequiredBody`)}</p>
          </div>
        </section>
      `;let t=e.url,n=new URL(t);n.search=``;let r=`${e.id}\u0000${t}`,i=this.portalProbeState?.key===r?this.portalProbeState.status:`probing`,a=i===`new-tab-required`?`newTabRequired`:i===`ingress-required`?`ingressRequired`:`unreachable`;return S`
      <section class="portals-preview">
        <header class="portals-preview__header">
          <a
            class="portals-preview__url"
            href=${t}
            target="_blank"
            rel="noopener noreferrer"
            title=${n.href}
          >
            <span>${n.href}</span>
            ${_(`externalLink`)}
            <span class="sr-only">${d(`portalsPage.openNewTab`)}</span>
          </a>
          <button
            class="btn btn--icon btn--ghost portals-preview__close"
            type="button"
            title=${d(`portalsPage.closePortal`,{title:e.title})}
            aria-label=${d(`portalsPage.closePortal`,{title:e.title})}
            ?disabled=${!this.canClosePortal||this.closingPortalId===e.id}
            @click=${()=>void this.closePortal(e)}
          >
            ${_(`x`)}
          </button>
        </header>
        ${this.error?S`<div class="callout danger portals-preview__error" role="alert">
                ${this.error}
              </div>`:x}
        ${i===`probing`?S`
                <div class="portals-empty portals-preview__state" role="status" aria-live="polite">
                  <div class="portals-empty__title">${d(`portalsPage.loading`)}</div>
                </div>
              `:i===`unreachable`||i===`ingress-required`||i===`new-tab-required`?S`
                  <div class="portals-preview__notice" role="status">
                    <div class="portals-preview__notice-title">
                      ${d(`portalsPage.${a}Title`)}
                    </div>
                    <p>${d(`portalsPage.${a}Body`)}</p>
                    <a
                      class="portals-preview__notice-url"
                      href=${t}
                      target="_blank"
                      rel="noopener noreferrer"
                      >${n.href}</a
                    >
                    <button
                      class="btn"
                      type="button"
                      @click=${()=>this.ensurePortalProbe(e,!0)}
                    >
                      ${d(`portalsPage.retry`)}
                    </button>
                  </div>
                `:O(r,S`<iframe
                    ${D(e=>{e instanceof HTMLIFrameElement&&!e.hasAttribute(`src`)&&e.setAttribute(`src`,t)})}
                    class="portals-preview__frame"
                    title=${d(`portalsPage.previewTitle`,{title:e.title})}
                    referrerpolicy="no-referrer"
                    sandbox=${Y}
                  ></iframe>`)}
      </section>
    `}render(){if(this.pendingEnvironmentId&&(!this.gateway.connected||this.canReadPortalState)){let e=this.pendingEnvironment?.id===this.pendingEnvironmentId?this.pendingEnvironment:null,t=this.environmentFailure?.environmentId===this.pendingEnvironmentId?this.environmentFailure.message:null,n=t||e&&e.status!==`starting`&&e.status!==`available`;return S`<section class="portals-empty" role="status" aria-live="polite">
        <div class="portals-empty__title">
          ${d(n?`portalsPage.environmentUnavailable`:e?.status===`available`?`portalsPage.waitingForApp`:`portalsPage.environmentStarting`)}
        </div>
        ${t||e?.worker?.error?S`<p>${t??e?.worker?.error}</p>`:x}
        ${n?S`<button class="btn" type="button" @click=${()=>void this.loadPendingEnvironment()}>${d(`portalsPage.retry`)}</button>`:x}
      </section>`}let e=this.portals.find(e=>e.id===(this.requestedPortalId??this.selectedPortalId));return this.embedded?S`<div class="portals-embedded">
        ${e?this.renderPortal(e):this.renderEmptyState()}
      </div>`:S`
      <section
        class="content-header content-header--page"
        ${y({toolbarHeader:!0})}
      >
        <div>
          <h1 class="page-title">${m(`portals`)}</h1>
        </div>
      </section>
      ${e?S`
              <section class="portals-layout">
                <aside class="portals-rail" aria-label=${d(`portalsPage.listLabel`)}>
                  ${this.portals.map(t=>S`
                      <button
                        class="portals-rail__item ${t.id===e.id?`active`:``}"
                        type="button"
                        aria-current=${t.id===e.id?`true`:x}
                        @click=${()=>this.selectPortal(t)}
                      >
                        <span class="portals-rail__title">${t.title}</span>
                        <span class="portals-rail__port"
                          >${d(`portalsPage.portLabel`,{port:String(t.port)})}</span
                        >
                        ${t.description?S`<span class="portals-rail__description"
                                >${t.description}</span
                              >`:x}
                      </button>
                    `)}
                </aside>
                ${this.renderPortal(e)}
              </section>
            `:this.renderEmptyState()}
    `}},F([T({type:Boolean,reflect:!0})],X.prototype,`embedded`,void 0),F([T({type:Boolean})],X.prototype,`presented`,void 0),F([T({attribute:!1})],X.prototype,`requestedPortalId`,void 0),F([T({attribute:!1})],X.prototype,`requestedEnvironmentId`,void 0),F([N({context:g,subscribe:!0})],X.prototype,`context`,void 0),F([k()],X.prototype,`portals`,void 0),F([k()],X.prototype,`selectedPortalId`,void 0),F([k()],X.prototype,`loading`,void 0),F([k()],X.prototype,`loaded`,void 0),F([k()],X.prototype,`error`,void 0),F([k()],X.prototype,`closingPortalId`,void 0),F([k()],X.prototype,`portalProbeState`,void 0),F([k()],X.prototype,`pendingEnvironment`,void 0),F([k()],X.prototype,`environmentFailure`,void 0),customElements.get(`zero-portals-page`)||customElements.define(`zero-portals-page`,X)})))()}Z();
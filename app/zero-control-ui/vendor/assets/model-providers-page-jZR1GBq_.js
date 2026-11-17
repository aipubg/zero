const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./model-setup-page-B-F9-7wj.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-boot-shared-CZXdmeIi.js","./control-ui-boot-shared-4Y4EIRNw.js","./plugin-contracts-runtime-BO_sRtcl.js","./config-runtime-BecGLziM.js","./markdown-runtime-ORQpioyT.js","./control-ui-boot-shared-styles-BXPMRytW.js","./sidebar-update-runtime-B2P2sMaT.js","./state-BajZM06-.js","./control-ui-boot-chat-Cx6CBnJr.js","./control-ui-boot-chat-D02HpoEK.js","./control-ui-boot-chat-zkzP5WWm.js","./control-ui-boot-chat-B3rfqCeq.js","./chat-transcript-styles-BN-TorbW.js","./control-ui-boot-chat-styles-BcslGtWC.js","./wizard-login-controller-tM2ShtC6.js","./wizard-step-controls-TPQ3zrjY.js","./first-run-activation-receipt-CYoUeBg2.js","./control-ui-core-DI-Q_yCI.css","./control-ui-boot-shared-styles-DUf4zEvn.css","./control-ui-boot-shared-DIWJGbGi.css","./sidebar-update-runtime-Bpn2ByHA.css","./chat-transcript-styles-B0IJwY9P.css","./control-ui-boot-chat-styles-SRk09zDG.css","./control-ui-boot-chat-C2DT0d4M.css","./wizard-step-controls-CYe5XwZR.css","./wizard-login-controller-CisCH8bF.css","./view-status-CPVPeI0Y.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ct as t,Ic as n,Lc as r,N as i,Nu as a,Pu as o,V as s,W as c,bl as l,bu as u,dl as d,ds as f,j as p,ju as m,kl as h,ll as g,lt as _,ss as ee,ul as te,ut as v,wt as ne,xl as y,xu as re,yu as ie,zu as b}from"./control-ui-core-DCNBgr3X.js";import{Aa as ae,Ai as oe,Ba as se,ca as x,ki as ce,sa as S,wr as le,yr as ue}from"./control-ui-core-DwX5Mpz4.js";import{G as C,J as w,W as T,Z as de,at as fe,rt as E}from"./lit-runtime-B40xFCK_.js";import{Dt as pe,Ot as me}from"./control-ui-boot-shared-BRtBCr5s.js";import{q as he}from"./control-ui-boot-chat-BVLkkfEk.js";import{c as ge,d as _e,l as ve}from"./gateway-runtime-JSfC8ThO.js";import{_ as ye,v as be}from"./control-ui-boot-shared-BX8huZUb.js";import{Ir as xe,Ur as Se,Wr as Ce,Zr as D,ma as we,pa as Te,uo as Ee,ya as O}from"./ui-AaV6iNVa.js";import{F as De,M as k,N as A,j}from"./control-ui-boot-shared-E4pYPcWx.js";import{B as M,G as Oe,I as N,K as ke,R as Ae,Si as je,Ti as Me,U as Ne,V as P,X as Pe,Y as F,Z as I,a as Fe,et as Ie,l as Le,na as Re,o as L,q as R,ta as ze,tt as Be,u as Ve,xi as He}from"./control-ui-boot-shared-ZuP0LiFD.js";import{An as Ue,C as We,Cl as Ge,Cn as Ke,El as qe,Ml as Je,Nl as Ye,S as Xe,Sn as Ze,Tn as Qe,b as $e,kn as et,wl as tt,x as nt,xn as rt}from"./control-ui-boot-shared-CzJHozXQ.js";import{ct as it,st as at}from"./control-ui-boot-shared-D2GHitQ4.js";import{n as ot,t as st}from"./en-settings-6vMW9YZk.js";import{n as ct,t as lt}from"./decision-model-picker-C4xt5xf0.js";import{i as ut,n as z,r as dt,t as ft}from"./load-DwmwnouB.js";import{n as pt,r as mt}from"./usage-2X-a5fq_.js";import{A as B,C as ht,D as gt,E as _t,M as vt,N as yt,O as V,P as bt,S as xt,T as H,_ as St,a as U,b as W,c as Ct,d as wt,f as Tt,g as Et,h as Dt,i as Ot,j as kt,k as G,m as At,n as jt,o as Mt,p as K,r as Nt,s as Pt,t as Ft,u as It,v as Lt,w as Rt,x as zt,y as Bt}from"./view-status-D9yLNP6D.js";import{n as Vt,t as Ht}from"./provider-usage-BWloZvo9.js";import{n as Ut,t as Wt}from"./provider-usage-request-CXF1PfLE.js";var Gt;function Kt(){return(Kt=e((()=>{j(),o(),re(),t(),rt(),z(),Gt=class{constructor(e,t){this.host=e,this.options=t,this.active=!1,this.publicationPending=!1,this.catalogRequest=null,this.catalogError=null,this.catalogGeneration=0,this.task=new k(e,{autoRun:!1,task:([e],{signal:t})=>e?ut(e.client,{agentId:e.agentId,...e.reason===`forced`?{refresh:!0}:{},signal:t}).then(t=>({...e,data:t})):A,onComplete:e=>{this.settle(),this.options.onComplete(e)},onError:()=>this.settle()})}get loading(){return this.active}get catalogLoading(){return this.catalogRequest!==null}resetCatalog(){let e=this.catalogRequest;this.catalogRequest=null,this.catalogError=null,e?.abort(),this.host.requestUpdate()}async discoverCatalog(e,t,n){if(this.catalogRequest)return;let r=new AbortController,i=()=>this.catalogRequest===r&&n();this.catalogRequest=r,this.catalogGeneration+=1,this.catalogError=null,this.host.requestUpdate();try{let n=await Ze(e,{agentId:t,refresh:!0,signal:r.signal});i()&&(this.catalogError=Ke(n,b(`modelProviders.defaults.discoverFailed`)),this.options.onCatalogComplete(n))}catch(e){i()&&(this.catalogError=ie(e,`request failed`))}finally{this.catalogRequest===r&&(this.catalogRequest=null,this.host.requestUpdate(),this.flushPublication())}}refresh(e,t,n){return n===`publication`&&(this.active||this.catalogLoading)?(this.publicationPending=!0,Promise.resolve()):(n===`publication`&&(this.publicationPending&&ne(e,{agentId:t}),this.publicationPending=!1),this.active=!0,n!==`publication`&&this.resetCatalog(),this.options.onStart(n),this.task.run([{client:e,agentId:t,reason:n}]))}invalidate(){this.resetCatalog(),this.publicationPending=!1,this.active=!1,this.task.run([null])}settle(){this.active=!1,this.flushPublication()}flushPublication(){queueMicrotask(()=>{this.publicationPending&&!this.active&&!this.catalogLoading&&this.options.refreshPublication()})}}})))()}var qt;function Jt(){return(Jt=e((()=>{T(),o(),Dt(),we(),Et(),qt=class{constructor(e,t){this.host=e,this.options=t,this.state=`closed`,this.generation=0,this.owner=null,e.addController(this)}get busy(){return this.state!==`closed`}reset(){this.generation+=1,this.state=`closed`,this.owner=null,this.host.requestUpdate()}hostUpdated(){let e=this.owner;if(!e)return;let t=this.options.getOwner();(this.state===`loading`&&!this.options.isCurrent(e)||t.selectionIntentRevision!==e.selectionIntentRevision||!t.selectionPending&&t.agentId!==e.agentId)&&this.reset()}cancelLoading(){this.state===`loading`&&this.reset()}hostDisconnected(){this.reset()}async open(){if(!this.options.canOpen()||this.busy)return;let e=this.options.getOwner();if(!e.client)return;let t=this.generation,n=()=>t===this.generation&&this.state===`loading`&&this.options.isCurrent(e);this.owner=e,this.state=`loading`,this.host.requestUpdate();try{await Te(()=>import(`./model-setup-page-B-F9-7wj.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28]),import.meta.url),n()&&(this.state=`ready`,this.host.requestUpdate())}catch(e){n()&&(this.reset(),this.options.onError(e))}}render(e){if(this.state===`closed`)return C;let t=this.generation,n=(e=!1)=>{t===this.generation&&(this.reset(),e&&this.options.onClose())};return this.state===`loading`?w`<zero-modal-dialog
        label=${b(`modelSetup.discovery.title`)}
        @modal-cancel=${()=>n()}
      >
        <div class="model-setup-wizard">
          <div class="model-setup-wizard__body" role="status">${b(`common.loading`)}</div>
          <div class="model-setup-wizard__footer">
            <button class="btn" @click=${()=>n()}>${b(`common.cancel`)}</button>
          </div>
        </div>
      </zero-modal-dialog>`:w`<zero-model-setup-page
      .routeData=${{firstRun:!1}}
      .embedded=${!0}
      .credentialChoices=${e.credentialChoices}
      .agentLabel=${e.agentLabel}
      .onClose=${()=>n(!0)}
    ></zero-model-setup-page>`}}})))()}var q,Yt,Xt;function Zt(){return(Zt=e((()=>{j(),T(),x(),je(),N(),o(),y(),ve(),H(),q=`acpx.agents.list`,Yt={installed:{kind:`muted`,labelKey:`modelProviders.installedAgents.status.installed`},missing:{kind:`muted`,labelKey:`modelProviders.installedAgents.status.missing`},unverified:{kind:`warn`,labelKey:`modelProviders.installedAgents.status.unverified`}},Xt=class{constructor(e,t){this.host=e,this.options=t,this.agents=null,this.pending=new Map,this.messages=new Map,this.list=new k(e,{args:()=>[t.gateway.connected&&this.available()?t.gateway.client:null,t.gateway.epoch],task:async([e],{signal:t})=>e?(await e.request(q,{},{signal:t})).agents:A,onComplete:e=>{this.agents=e}})}get loading(){return this.list.status===De.PENDING}get error(){return this.list.status===De.ERROR?B(this.list.error):null}subscribe(e){return e.subscribeEvents(e=>{e.event===`config.changed`&&this.agents!==null&&this.pending.size===0&&this.list.run()})}reset(e={}){this.list.run([null,this.options.gateway.epoch]),this.pending.clear(),this.messages.clear(),e.preserveVisibleData||(this.agents=null)}filterProviders(e){return e.filter(e=>!this.agents?.some(t=>t.runtimeId===e.id))}available(){return ge(this.options.getContext().gateway.snapshot,q,`operator.read`)}blockedReason(){return G(this.options.getContext())}setEnabled(e,t){let n=this.options.gateway.capture();if(!n||this.blockedReason()||V(this.options.getContext())||this.pending.has(e.id))return!1;this.pending.set(e.id,t);let r=()=>this.options.gateway.isCurrent(n);return bt({runtimeConfig:this.options.getContext().runtimeConfig,isCurrentClient:r,isCurrentAgent:()=>!0,setBusy:t=>{t||this.pending.delete(e.id),this.host.requestUpdate()},setMessage:t=>{t?this.messages.set(e.id,t):this.messages.delete(e.id),this.host.requestUpdate()}},{raw:{plugins:{entries:{acpx:{config:{nativeAgents:{[e.id]:t}}}}}},note:b(`modelProviders.installedAgents.note`)}).then(()=>{r()&&this.list.run()}),!0}renderAgent(e,t,n,r){let i=this.pending.get(e.id),a=i??(typeof n==`boolean`?n:e.enabled),o=Yt[e.installation],s=``;e.installation===`missing`?s=b(`modelProviders.installedAgents.installHint`,{name:e.name}):e.installation===`unverified`?s=b(`modelProviders.installedAgents.unverifiedHint`):a?r?.catalogStatus===`auth-rejected`?(o={kind:`danger`,labelKey:`modelProviders.installedAgents.status.signIn`},s=b(`modelProviders.installedAgents.signInHint`,{name:e.name})):r?.catalogStatus===`unavailable`?(o={kind:`warn`,labelKey:`modelProviders.status.modelsUnavailable`},s=b(`modelProviders.installedAgents.discoveryHint`,{name:e.name})):r?.checkingModels?o={kind:`muted`,labelKey:`modelProviders.installedAgents.status.discovering`}:r&&r.availableModelCount>0?o={kind:`ok`,labelKey:`modelProviders.installedAgents.status.modelsAvailable`}:s=b(`modelProviders.installedAgents.signInHint`,{name:e.name}):s=b(`modelProviders.installedAgents.disabledHint`);let c=this.messages.get(e.id);return w`
      <div class="model-providers__installed-agent" data-installed-agent=${e.id}>
        ${Ie({icon:He(e.id)?Me(e.id,{className:`model-providers__icon`}):w`<span
                class="model-providers__icon model-providers__agent-icon"
                aria-hidden="true"
                >${S.terminal}</span
              >`,title:e.name,ariaLabel:b(`modelProviders.installedAgents.toggle`,{name:e.name}),description:i===void 0?w`${I({kind:o.kind,label:b(o.labelKey)})}${s?w`<br />${s}`:C}`:I({kind:`muted`,label:b(`modelProviders.saving`)}),checked:a,disabled:t||i!==void 0,onChange:t=>this.setEnabled(e,t)})}
        ${c?w`<div
                class="callout ${c.kind} model-providers__installed-agent-message"
                role=${c.kind===`error`?`alert`:`status`}
              >
                ${c.text}
              </div>`:C}
      </div>
    `}render(e,t){if(!this.available())return C;let n=this.blockedReason(),r=n!==null||V(this.options.getContext()),i=l(this.options.getContext().runtimeConfig.state),a=O(O(i?.plugins)?.entries),o=O(O(a?.acpx)?.config),s=O(o?.nativeAgents),c=this.error?w`<div class="settings-row">
          <div class="settings-row__text">
            <span class="settings-row__desc provider-usage-error" role="alert">${this.error}</span>
          </div>
          <div class="settings-row__control">
            <button
              class="btn btn--sm"
              ?disabled=${this.loading}
              @click=${()=>void this.list.run()}
            >
              ${b(`common.retry`)}
            </button>
          </div>
        </div>`:C,u=this.agents===null?this.error?c:Ne({rows:4}):w`${c}${this.agents.length===0?M(b(`modelProviders.installedAgents.empty`)):this.agents.map(t=>this.renderAgent(t,r,s?.[t.id],e.find(e=>e.id===t.runtimeId)))}`,d=this.loading?b(`modelProviders.installedAgents.checking`):b(`modelProviders.installedAgents.check`);return w`
      <div class="model-providers__installed-agents">
        ${F({title:b(`modelProviders.installedAgents.title`),description:w`${b(`modelProviders.installedAgents.description`)}${n?w`<br />${n}`:C}`,actions:w`
              <zero-tooltip .content=${d}>
                <button
                  type="button"
                  class="btn btn--icon btn--ghost btn--xs model-providers__refresh-button"
                  aria-label=${d}
                  ?disabled=${this.loading||this.pending.size>0}
                  @click=${()=>{this.list.run(),t()}}
                >
                  ${S.refresh}
                </button>
              </zero-tooltip>
            `},u)}
      </div>
    `}}})))()}function J(e,t,n){let r={...e};return n===null?delete r[t]:r[t]=n,r}var Qt;function $t(){return($t=e((()=>{_(),H(),wt(),Qt=class{constructor(e){this.options=e,this.probeEpochs=new Map,this.pendingOrders=new Map,this.activeOrderProviders=new Set}resetProbes(){this.probeEpochs=new Map}clearProbe(e){this.probeEpochs.set(e,(this.probeEpochs.get(e)??0)+1),this.options.setBusy(`probe:`+e,!1),this.options.setProbeResult(e,null)}async probe(e,t){let n=this.options.getClient(),r=`probe:${e}`;if(!n||!this.options.canMutate()||this.options.isBusy(r))return;let{agentId:i,isCurrent:a}=this.captureScope(n),o=(this.probeEpochs.get(e)??0)+1;this.probeEpochs.set(e,o);let s=()=>a()&&this.probeEpochs.get(e)===o;this.options.setBusy(r,!0),this.options.clearMessage(e);try{let r=[];for(let e of t){if(!s())return;r.push(await n.request(`models.probe`,{provider:e,agentId:i}))}s()&&this.options.setProbeResult(e,_t(e,r))}catch(t){if(!s())return;this.options.setProbeError(e,B(t))}finally{s()&&this.options.setBusy(r,!1)}}resetOrders(){this.pendingOrders.clear(),this.options.setOrders({})}setOrder(e,t,n){let r=this.options.getData()?.authStatus?.providers.find(e=>e.provider===t),i=n??r?.profiles.map(e=>e.profileId)??[];this.options.setOrders({...this.options.getOrders(),[t]:i}),this.pendingOrders.set(t,{profileIds:n,optimisticOrder:i}),this.options.clearMessage(e),this.flushOrder(t)}flushPendingOrders(){if(this.options.canMutate())for(let e of this.pendingOrders.keys())this.flushOrder(e)}async logout(e,t){let n=this.options.getClient(),r=`logout:${e}`;if(!n||!this.options.canMutate()||this.options.isBusy(r))return;let{agentId:i,isCurrent:a}=this.captureScope(n);this.clearProbe(e),this.options.setBusy(r,!0),this.options.clearMessage(e);try{let e=await this.options.getConfig().runExternalMutation(async e=>{let n=await e.request(`models.authLogout`,{...t,agentId:i});return v(e),n},{canDispatch:()=>a()&&this.options.canMutate()});if(!a())return;if(!e.ok){await this.options.refresh(),a()&&K(e.error);return}let n=await kt(e,async()=>(await this.options.refresh(),this.options.getData()?.error));a()&&At(n||void 0)}catch(e){a()&&K(e)}finally{a()&&this.options.setBusy(r,!1)}}async flushOrder(e){if(!this.activeOrderProviders.has(e)){this.activeOrderProviders.add(e);try{for(;;){let t=this.pendingOrders.get(e);if(!t)return;let n=this.options.getClient();if(!n||!this.options.canMutate())return;this.pendingOrders.delete(e);let{agentId:r,isCurrent:i}=this.captureScope(n);try{let a=await n.request(`models.authOrderSet`,{provider:e,...t.profileIds?{profileIds:t.profileIds}:{},agentId:r});if(v(n),!i())return;if(t.profileIds&&!a.warning)this.options.cancelRefresh(),this.applyOrder(e,t.profileIds),this.options.refresh();else if(await this.options.refresh(),!i())return;this.clearOptimisticOrder(e,t.optimisticOrder)&&a.warning&&K(a.warning)}catch(n){if(!i())return;this.clearOptimisticOrder(e,t.optimisticOrder)&&K(n)}}}finally{this.activeOrderProviders.delete(e),this.pendingOrders.has(e)&&this.options.canMutate()&&this.flushOrder(e)}}}captureScope(e){let t=this.options.getClientEpoch(),n=this.options.getAgentId(),r=this.options.getAgentEpoch();return{agentId:n,isCurrent:()=>this.options.isCurrentClient(e,t)&&this.options.getAgentEpoch()===r&&this.options.getAgentId()===n}}clearOptimisticOrder(e,t){let n=this.options.getOrders();return n[e]===t&&(this.options.setOrders(J(n,e,null)),!0)}applyOrder(e,t){let n=this.options.getData(),r=n?.authStatus;if(!n||!r)return;let i=r.providers.map(n=>(n.authProvider??n.provider)===e?{...n,profileOrder:[...t],profileOrderStored:!0}:n);this.options.setData({...n,authStatus:{...r,providers:i}})}}})))()}var en;function tn(){return(tn=e((()=>{j(),Wt(),z(),en=class{constructor(e,t){this.options=t,this.pending=new Set,this.usageTask=this.createTask(e,`usage`,(e,t)=>Ut(e,{signal:t}),e=>({providerUsage:e}),(e,t)=>this.options.refreshPolicy.markProviderUsage(e,Date.now(),t)),this.costTask=this.createTask(e,`cost`,dt,e=>({costByProvider:e}))}get loading(){return this.pending.size>0}get usageLoading(){return this.pending.has(`usage`)}adoptCoreData(e,t,n={}){let r=e===this.options.getDataClient()?this.options.getData():null;this.options.setData({...t,...n.preserveCatalogDiagnostics&&r?{providerOutcomes:r.providerOutcomes,catalogError:r.catalogError}:{},providerUsage:r?.providerUsage??t.providerUsage,costByProvider:r?.costByProvider??t.costByProvider}),this.options.setDataClient(e),t.providerUsage!==null&&this.options.refreshPolicy.markProviderUsage(t.providerUsage,t.updatedAt,this.options.getGateway().epoch),e&&!this.options.isCoreLoading()&&!this.loading&&t.providerUsage===null&&t.costByProvider===null&&this.loadRequests(e,!0)}invalidate(){this.options.refreshPolicy.interrupt(),this.cancelGeneration()}beginCoreRefresh(e){this.cancelGeneration(),e&&this.options.refreshPolicy.resetPayload()}cancelGeneration(){this.pending.clear();let e=this.options.getGateway().epoch;this.usageTask.run([null,e]),this.costTask.run([null,e])}loadUsage(){return this.loadRequests(void 0,!1)}async loadRequests(e,t){let n=this.options.getGateway(),r=e??n.client;if(!n.connected||!r){this.options.refreshPolicy.markLoadDeferred();return}this.options.refreshPolicy.beginLoad(),this.pending.add(`usage`);let i=this.usageTask.run([r,n.epoch]);if(!t){await i;return}this.pending.add(`cost`),await Promise.all([i,this.costTask.run([r,n.epoch])])}createTask(e,t,n,r,i){return new k(e,{autoRun:!1,task:([e,t],{signal:r})=>e?n(e,r).then(n=>({client:e,data:n,epoch:t})):A,onComplete:({client:e,data:n,epoch:a})=>{this.pending.delete(t);let o=this.options.getData();o&&e===this.options.getDataClient()&&this.options.getGateway().isCurrent({client:e,epoch:a})&&(this.options.setData({...o,...r(n)}),i?.(n,a)),this.options.refreshPolicy.flushPending()},onError:()=>{this.pending.delete(t),this.options.refreshPolicy.flushPending()}})}}})))()}function nn(e,t){let n=W(e),r=t.get(Ge(e.provider)),i=r?Xe(r,{authProfileId:xe(n).profile,projection:`available-credentials`}):void 0;return{value:n,label:e.name||n,...i?{detail:[i.label,i.detail].filter(Boolean).join(` · `)}:{},...e.available===!1?{disabled:!0}:{},...e.provider?{provider:e.provider}:{}}}function rn(e){return w`
    <span class="model-providers__label-with-help">
      <span>${e.title}</span>
      <span class="settings-section__docs">
        <zero-tooltip open-on-click>
          <button
            id=${e.triggerId}
            type="button"
            class="settings-section__help-button model-providers__help-button"
            aria-label=${e.label}
            @keydown=${e=>{e.key===`Escape`&&e.stopPropagation()}}
          >
            ${S.info}
          </button>
          <div slot="content" class="settings-section__help-panel">
            ${e.paragraphs.map(e=>w`<p>${e}</p>`)}
          </div>
        </zero-tooltip>
      </span>
    </span>
  `}function an(e,t){return R({title:rn({title:b(`quickSettings.model.${e}`),label:b(`modelProviders.defaults.${e}HelpLabel`),triggerId:e===`thinking`?dn:fn,paragraphs:[b(`modelProviders.defaults.${e}Help`),b(`modelProviders.defaults.${e}DefaultHelp`)]}),control:t})}function on(e){return e===`auto`||e===`ultrafast`?e:e===`on`}function sn(e){return w`
    ${e.catalogDiscovering?w`
            <div class="model-providers__catalog-progress" role="status" aria-live="polite">
              <span class="btn__spinner" aria-hidden="true"></span>
              <span>${b(`modelProviders.defaults.discoveringMore`)}</span>
            </div>
          `:C}
    ${e.catalogDiscoveryError?w`
            <div class="model-providers__catalog-progress" role="alert" aria-live="polite">
              <span>${b(`modelProviders.defaults.discoverFailed`)}</span>
              <button class="btn btn--sm" type="button" @click=${e.onCatalogRetry}>
                ${b(`modelProviders.defaults.retryDiscover`)}
              </button>
            </div>
          `:C}
  `}function cn(e){let t=!e.canMutate||e.models.length===0,n=!e.canMutate,r=!!e.busy.defaults,i=e.mutationBlockedReason??``,a=e.thinkingLevel&&!Z.has(e.thinkingLevel)?[...X,e.thinkingLevel]:X,o=e.fastMode===void 0?``:at(e.fastMode),s=e.selection.fallbacks[0]??``,c=new Map(qe(e.authStatus?.providers??[]).map(e=>[e.provider,e])),l=he(e.models,W).map(e=>nn(e,c)),u=e.automaticUtilityModel,d=e.selection.utilityModel??Y,f=$e(e.utilityRuntime),p=(e,t)=>e===d&&f?[t,f.label].filter(Boolean).join(` · `):t,m=u?xe(u).model:``,h=e.models.find(e=>W(e)===m),g=u?nn({...h??{id:m,name:m,provider:m.split(`/`,1)[0]??``},selectionRef:u},c):void 0,_=w`
    <div class="model-providers__defaults">
      ${!e.loading&&e.models.length===0?w`<div class="callout warning">${b(`modelProviders.defaults.noModels`)}</div>`:C}
      ${R({title:b(`modelProviders.defaults.primary`),control:L({label:b(`modelProviders.defaults.primary`),value:e.selection.primary,options:[{value:``,label:b(`modelProviders.defaults.selectModel`),disabled:!e.canMutate||!!e.selection.primary},...e.canMutate?l:l.map(e=>({...e,disabled:!0}))],disabled:e.models.length===0||r,title:i,showSelectedDetail:!0,onChange:e.onPrimaryChange})})}
      ${R({title:rn({title:b(`modelProviders.defaults.utility`),label:b(`modelProviders.defaults.utilityHelpLabel`),triggerId:un,paragraphs:[b(`modelProviders.defaults.utilityHelpPurpose`),b(`modelProviders.defaults.utilityHelpAutomatic`)]}),control:L({id:ln,label:b(`modelProviders.defaults.utility`),value:d,options:[{value:Y,label:e.automaticUtilityModel?`${b(`quickSettings.model.fastModes.auto`)} · ${g?.label??e.automaticUtilityModel}`:b(`quickSettings.model.fastModes.auto`),provider:g?.provider,detail:u===null?b(`modelProviders.defaults.automaticUnavailable`):p(Y,g?.detail)},{value:``,label:b(`modelProviders.defaults.disabled`)},...l.map(e=>{let t=p(e.value,e.detail);return t===e.detail?e:{...e,detail:t}})],disabled:t||r,title:i||f?.detail||``,showSelectedDetail:!0,onChange:t=>e.onUtilityChange(t===Y?null:t)})})}
      ${R({title:b(`chat.modelControls.decisionLabel`),description:b(`chat.modelControls.decisionHelp`),control:ct({id:`model-providers-decision-model`,models:e.decisionModels,value:e.selection.decisionModel,disabled:!e.canMutate||r,title:i,onChange:e.onDecisionChange})})}
      ${R({title:b(`modelProviders.defaults.fallback`),control:L({label:b(`modelProviders.defaults.fallback`),value:s,options:[{value:``,label:b(`modelProviders.defaults.noFallback`)},...l.filter(t=>t.value!==e.selection.primary)],disabled:t||r||!e.selection.primary,title:i,showSelectedDetail:!0,onChange:t=>e.onFallbackChange(t||null)})})}
      ${an(`thinking`,w`
          ${Pe({value:e.thinkingLevel??``,ariaLabel:b(`quickSettings.model.thinking`),options:[{value:``,label:b(`quickSettings.model.default`)},...a.map(e=>({value:e,label:Z.has(e)?b(`quickSettings.model.thinkingLevels.${e}`):ye(e)}))],disabled:r||n,onChange:t=>t===``?e.onThinkingReset():e.onThinkingChange(t),onReselect:t=>{t===``&&e.thinkingOverridden&&e.onThinkingReset()}})}
        `)}
      ${an(`fastMode`,w`
          ${Pe({value:o,ariaLabel:b(`quickSettings.model.fastMode`),options:[{value:``,label:b(`quickSettings.model.default`)},{value:`auto`,label:b(`quickSettings.model.fastModes.auto`)},{value:`on`,label:b(`quickSettings.model.fastModes.on`)},{value:`off`,label:b(`quickSettings.model.fastModes.off`)}],disabled:r||n,onChange:t=>{t===``?e.onFastModeReset():t!==o&&e.onFastModeChange(on(t))},onReselect:t=>{t===``&&e.fastModeOverridden&&e.onFastModeReset()}})}
        `)}
      ${sn(e)}
      ${e.canMutate?U(e.message):C}
    </div>
  `;return F({title:b(`modelProviders.defaults.title`),description:b(`modelProviders.defaults.subtitle`)},_)}var Y,ln,un,dn,fn,X,Z;function pn(){return(pn=e((()=>{T(),me(),it(),lt(),x(),Fe(),N(),o(),be(),tt(),We(),nt(),Bt(),Nt(),Y=`__zero_automatic_utility__`,ln=`model-providers-utility-model`,un=`model-providers-utility-help`,dn=`model-providers-thinking-help`,fn=`model-providers-fast-mode-help`,X=pe.filter(e=>e!==`minimal`),Z=new Set(X)})))()}function Q(e){return!e.canMutate||e.configBusy}function mn(e){return e.modelCount===0?null:e.availableModelCount<e.modelCount?b(`modelProviders.modelsAvailable`,{available:String(e.availableModelCount),count:String(e.modelCount)}):e.modelCount===1?b(`modelProviders.modelOne`):b(`modelProviders.models`,{count:String(e.modelCount)})}function hn(e){let t=e.localCost;return!t||t.totalTokens===0&&t.totalCost===0?C:w`
    <div class="model-providers__local-cost">
      <div class="provider-usage-billing-row">
        <span>${b(`modelProviders.localCost`,{days:`30`})}</span>
        <strong>${i(t.totalCost)}</strong>
      </div>
      <div class="model-providers__local-cost-detail">
        ${b(`modelProviders.localCostDetail`,{tokens:p(t.totalTokens),messages:String(t.messageCount)})}
      </div>
    </div>
  `}function gn(e,t){let n=e.profiles.filter(e=>e.type===`oauth`).length,r=e.profiles.filter(e=>e.type===`token`).length,i=e.profiles.filter(e=>e.type===`api_key`).length,a=[];n>0&&a.push(b(`modelProviders.credentials.oauth`,{count:String(n)})),r>0&&a.push(b(`modelProviders.credentials.tokenProfiles`,{count:String(r)}));let o=It(e);return o===void 0?i>0&&a.push(b(`modelProviders.credentials.profileKey`,{count:String(i)})):a.push(o),w`
    <div class="model-providers__credentials">
      <span>${b(`modelProviders.credentials.label`,{agent:t})}</span>
      <strong
        >${a.length>0?a.join(` · `):b(`modelProviders.credentials.none`)}</strong
      >
    </div>
  `}function _n(e){if(!e)return C;let t=e.status===`ok`&&e.results.some(e=>e.status!==`ok`),n=t?`warning`:e.status===`ok`?`success`:`error`;return w`
    <div class="model-providers__probe model-providers__probe--${n}" role="status">
      <div class="model-providers__probe-summary">
        <strong
          >${b(t?`modelProviders.probe.status.partial`:`modelProviders.probe.status.${e.status}`)}</strong
        >
        ${e.latencyMs===void 0?C:w`<span
                >${b(`modelProviders.probe.latency`,{ms:String(e.latencyMs)})}</span
              >`}
      </div>
      ${e.error?w`<div>${u(e.error)}</div>`:C}
      ${e.results.map(e=>w`
          <div class="model-providers__probe-target">
            <span>${e.label}</span>
            <span>
              ${b(`modelProviders.probe.status.${e.status}`)}${e.latencyMs===void 0?``:` · ${b(`modelProviders.probe.latency`,{ms:String(e.latencyMs)})}`}
            </span>
            ${e.error?w`<small>${u(e.error)}</small>`:C}
          </div>
        `)}
    </div>
  `}function vn(e,t,n,r=!1){return w`<label class="field">
    <span>${b(`modelProviders.apiKey.label`)}</span>
    <input
      type="password"
      autocomplete="off"
      placeholder=${b(r?`modelProviders.apiKey.replacePlaceholder`:`modelProviders.apiKey.placeholder`)}
      .value=${e}
      ?disabled=${t}
      @input=${e=>n(e.target.value)}
    />
  </label>`}function yn(e,t){if(t.keyEditorProvider!==e.id)return C;let n=!!t.busy[`key:${e.id}`],r=e.apiKeySupported===!1||!!(e.configAuthMode&&e.configAuthMode!==`api-key`),i=Q(t);return w`
    <div class="model-providers__inline-form">
      ${vn(t.keyDraft,n||i||r,t.onKeyDraftChange,e.apiKey?.source===`config`)}
      <div class="model-providers__form-actions">
        <button
          class="btn primary btn--sm"
          ?disabled=${n||i||r||!t.keyDraft.trim()}
          @click=${()=>t.onSaveKey(e.id,e.configKey??e.id)}
        >
          ${b(n?`modelProviders.saving`:`common.save`)}
        </button>
        <button class="btn btn--sm" ?disabled=${n} @click=${()=>t.onCloseKeyEditor()}>
          ${b(`common.cancel`)}
        </button>
      </div>
    </div>
  `}function bn(e,t){let n=e.credentialProviderIds.length?e.credentialProviderIds:[e.id],r=!!t.busy[`probe:${e.id}`],i=!!t.busy[`key:${e.id}`],a=t.mutationBlockedReason??``,o=!!(e.configAuthMode&&e.configAuthMode!==`api-key`),s=e.apiKeySupported===!1,c=Q(t),l=o?b(`modelProviders.apiKey.authModeBlocked`,{mode:e.configAuthMode??``}):a,u=[{visible:t.canConnect(e)&&e.profiles.length===0,disabled:c||t.loginBusy,connectProvider:e.id,label:b(`modelProviders.login.action`),onClick:()=>t.onConnect(e)},{visible:Ft(e),disabled:r||!t.canMutate||!t.probeAvailable,title:t.probeAvailable?a:b(`modelProviders.probe.unavailable`),label:b(r?`modelProviders.probe.testing`:`modelProviders.probe.test`),onClick:()=>t.onProbe(e.id,n)},{visible:!s,disabled:i||c||o,title:l,label:b(`modelProviders.apiKey.set`),onClick:()=>t.onOpenKeyEditor(e.id)},{visible:e.hasConfigApiKey||e.profiles.some(e=>e.type===`api_key`&&e.logoutSupported),disabled:i||c||o,title:l,danger:!0,label:b(`modelProviders.apiKey.remove`),onClick:()=>t.onRemoveKey(e.id,e.configKey??e.id)}];return w`
    <div class="model-providers__card-actions">
      ${u.map(e=>e.visible?w`<button
              class=${e.danger?`btn btn--sm danger`:`btn btn--sm`}
              data-models-connect-provider=${e.connectProvider??C}
              ?disabled=${e.disabled}
              title=${e.title??C}
              @click=${e.onClick}
            >
              ${e.label}
            </button>`:C)}
    </div>
  `}function xn(e,t){let n=mn(e),r=t.messages[`key:${e.id}`]??t.messages[e.id];return w`
    <div
      class="settings-row settings-row--stacked model-providers__row"
      data-provider-id=${e.id}
    >
      <div class="model-providers__head">
        <div class="model-providers__identity">
          ${Me(e.id,{className:`model-providers__icon`})}
          <div class="settings-row__text">
            <span class="settings-row__title">${e.displayName}</span>
            <span class="settings-row__desc"
              >${e.id}${n?w` · ${n}`:C}</span
            >
          </div>
        </div>
        <div class="settings-row__control">
          ${e.usage?.plan?Be(e.usage.plan):C}
          ${Mt(e)}
        </div>
      </div>
      ${e.profiles.length>0&&t.canViewProfiles?Tt(e,{...t,canMutate:t.canMutate&&!t.configBusy,onAddAccount:t.canConnect(e)?()=>t.onConnect(e):void 0,addAccountDisabled:t.loginBusy||Q(t)}):gn(e,t.credentialAgentLabel)}
      <div
        class="model-providers__global-metrics"
        aria-busy=${t.supplementalLoading?`true`:`false`}
      >
        <div class="model-providers__global-metrics-title">${b(`modelProviders.globalUsage`)}</div>
        ${e.usage?Vt(e.usage):w`<div class="model-providers__no-stats">
                ${b(t.supplementalLoading?`common.loading`:`modelProviders.noStats`)}
              </div>`}
        ${hn(e)}
      </div>
      ${bn(e,t)} ${yn(e,t)}
      ${_n(t.probeResults[e.id])} ${U(r)}
    </div>
  `}function Sn(e){if(!e.addProviderOpen)return C;let t=!!e.busy.add,n=Q(e)||t,r=e.unconfiguredProviders.find(t=>t.id===e.addProviderId);return w`
    <zero-modal-dialog
      label=${b(`modelProviders.add.title`)}
      @modal-cancel=${n=>{n.preventDefault(),t||e.onAddProviderToggle()}}
    >
      <div class="model-setup-wizard" data-models-key-dialog>
        <div class="model-setup-wizard__header">
          <h2>${r?.displayName??e.addProviderId}</h2>
        </div>
        <div class="model-setup-wizard__body">
          <p>${b(`modelProviders.credentials.label`,{agent:e.credentialAgentLabel})}</p>
          ${vn(e.addProviderKey,n,e.onAddProviderKeyChange)}
          ${U(e.messages.add)}
        </div>
        <div class="model-setup-wizard__footer">
          <button class="btn" ?disabled=${t} @click=${e.onAddProviderToggle}>
            ${b(`common.cancel`)}
          </button>
          <button
            class="btn primary"
            ?disabled=${n||!e.addProviderId||!e.addProviderKey.trim()}
            @click=${e.onAddProvider}
          >
            ${b(t?`modelProviders.saving`:`modelProviders.add.save`)}
          </button>
        </div>
      </div>
    </zero-modal-dialog>
  `}function Cn(e){let t=e.cards.some(jt);return w`
    <div class="model-providers__setup" data-model-readiness="model-required">
      ${F({title:b(`modelProviders.readiness.title`)},R({title:b(`modelProviders.readiness.heading`),description:b(t?`modelProviders.readiness.signedInNoModels`:`modelProviders.readiness.notConfigured`),control:w`
            ${I({kind:`warn`,label:b(t?`modelProviders.readiness.noModels`:`modelProviders.readiness.modelRequired`)})}
            <button
              class="btn primary"
              ?disabled=${Q(e)||e.loginBusy}
              title=${e.mutationBlockedReason??``}
              @click=${e.onConnectProvider}
            >
              ${b(`modelProviders.login.action`)}
            </button>
          `}))}
    </div>
  `}function wn(e){return w`
    <div class="settings-row">
      <div class="settings-row__text">
        <span class="settings-row__desc provider-usage-error">${e}</span>
      </div>
    </div>
  `}function Tn(e){if(!e.connected)return Oe(P(M(b(`modelProviders.disconnected`))));let t=(e.providerQuery??``).trim().toLocaleLowerCase(),n=e.cards.filter(e=>[e.id,e.displayName,...e.credentialProviderIds].some(e=>e.toLocaleLowerCase().includes(t))),r=w`
    <label class="field model-providers__search">
      <input
        type="search"
        aria-label=${b(`modelProviders.search`)}
        placeholder=${b(`modelProviders.search`)}
        .value=${e.providerQuery??``}
        @input=${t=>e.onProviderQueryChange?.(t.currentTarget.value)}
      />
    </label>
    <div class="model-providers__provider-list">
      ${e.error?P(wn(e.error)):C}
      ${e.providerUsageFailed?P(wn(b(`usage.providerUsage.unavailable`))):C}
      ${e.cards.length===0?P(M(w`<strong>${b(`modelProviders.emptyTitle`)}</strong><br />${b(`modelProviders.emptySubtitle`)}`)):n.map(t=>P(xn(t,e)))}
      ${e.cards.length>0&&n.length===0?M(b(`modelProviders.noMatches`)):C}
    </div>
  `,i=!e.loading&&!e.configuredModels.some(e=>e.available!==!1);return w`${Oe(w`
    ${i?Cn(e):C}
    <div id=${ee.behavior}>
      ${cn({...e,models:e.configuredModels,selection:e.defaultModels,canMutate:e.defaultsMutationBlockedReason===null&&!e.configBusy,mutationBlockedReason:e.defaultsMutationBlockedReason,message:e.messages.defaults})}
    </div>
    ${e.installedAgents}
    ${F({title:b(`modelProviders.accessTitle`),description:b(`modelProviders.accessDescription`),count:e.cards.length,actions:w`
          ${e.providerScope}
          ${e.updatedAt?w`<span class="model-providers__updated"
                  >${b(`modelProviders.updated`,{time:s(e.updatedAt,{hour:`numeric`,minute:`2-digit`})})}</span
                >`:C}
          <zero-tooltip
            .content=${e.refreshing?b(`modelProviders.refreshing`):b(`common.refresh`)}
          >
            <button
              type="button"
              class="btn btn--icon btn--ghost btn--xs model-providers__refresh-button"
              aria-label=${e.refreshing?b(`modelProviders.refreshing`):b(`common.refresh`)}
              ?disabled=${e.refreshing}
              @click=${()=>e.onRefresh()}
            >
              ${S.refresh}
            </button>
          </zero-tooltip>
        `},w`${e.accountRecovery}${e.loading?P(Ne()):e.cards.length===0&&e.installedAgents!==C&&!e.error&&!e.providerUsageFailed?C:r}`)}
    ${e.providerUsageStalled?w`<div class="callout warning" role="status">${b(`usage.providerUsage.stalled`)}</div>`:C}
  `)}${Sn(e)}`}function En(e){return w`
    <span class="muted" data-models-provider-agent
      >${b(`agentScope.label`)}: ${e.agentLabel}</span
    >
    ${Ot(e)}
  `}function Dn(e){return w`
    ${ke({title:se(`model-providers`),subtitle:w`${b(`modelProviders.subtitle`)}
      ${Ae(`http://127.0.0.1:18789/concepts/model-providers`)}`})}
    ${Ve(w`${U(e.loginMessage)}${e.body}`)}
    ${e.login}
  `}function On(){return(On=e((()=>{T(),ae(),x(),je(),Ht(),N(),Le(),o(),st(),re(),c(),f(),pn(),z(),wt(),Nt(),ot()})))()}var $;function kn(){return(kn=e((()=>{Ce(),T(),de(),oe(),le(),ze(),o(),g(),y(),ve(),tt(),rt(),h(),Ye(),a(),r(),mt(),H(),Kt(),Bt(),Jt(),Zt(),z(),Ct(),$t(),tn(),On(),$=class extends m{constructor(...e){super(...e),this.mutationBlockedReason=()=>G(this.context)??(this.selectedAgentId?null:b(`agents.noAgents`)),this.canMutate=()=>this.mutationBlockedReason()===null&&!V(this.context),this.loaderPending=!1,this.data=null,this.busy={},this.messages={},this.probeResults={},this.keyEditorProvider=null,this.keyDraft=``,this.logoutConfirmation=null,this.profileOrders={},this.providerQuery=``,this.pendingConnection=!1,this.addProviderOpen=!1,this.addProviderId=``,this.addProviderKey=``,this.defaultsDraft=null,this.selectedAgentId=``,this.dataClient=null,this.routeDataObserved=!1,this.agentEpoch=0,this.coreCatalogGeneration=0,this.core=new Gt(this,{onStart:e=>{this.coreCatalogGeneration=this.core.catalogGeneration,this.supplemental.beginCoreRefresh(e===`forced`),e===`forced`&&this.querySelectorAll(`zero-model-account-usage`).forEach(e=>e.refreshUsage())},onComplete:({client:e,data:t})=>{let n=this.data!==null&&this.core.catalogGeneration!==this.coreCatalogGeneration;n||this.core.resetCatalog(),this.supplemental.adoptCoreData(e,t,{preserveCatalogDiagnostics:n})},onCatalogComplete:e=>{this.data&&={...this.data,providerOutcomes:e.providerOutcomes??[],catalogError:null}},refreshPublication:()=>void this.refresh(`publication`)}),this.refreshPolicy=new pt({isLoading:()=>this.loaderPending||!this.routeDataObserved||this.core.loading||this.supplemental.usageLoading,reload:()=>this.supplemental.loadUsage(),onIncompleteUsageExhausted:()=>this.requestUpdate()}),this.supplemental=new en(this,{isCoreLoading:()=>this.loaderPending,getGateway:()=>this.gateway,getData:()=>this.data,getDataClient:()=>this.dataClient,setData:e=>this.data=e,setDataClient:e=>this.dataClient=e,refreshPolicy:this.refreshPolicy}),this.gateway=new Je(this,{getGateway:()=>this.context?.gateway,onIdentityChange:()=>this.resetConnectionState(),invalidateRequests:()=>this.invalidateRequests(),ensureInitialData:()=>this.ensureInitialData(),onSnapshot:e=>{e.initial?this.resetConnectionState():e.connectionChanged&&!e.identityChanged&&this.resetConnectionState({preserveVisibleData:!0}),e.becameConnected&&!e.initial&&this.routeDataObserved&&!this.loaderPending&&this.refresh(`replacement`)},onPageActivation:()=>this.refreshPolicy.request(`focus`)}),this.installedAgents=new Xt(this,{gateway:this.gateway,getContext:()=>this.context}),this.profileActions=new Qt({getAgentEpoch:()=>this.agentEpoch,getAgentId:()=>this.selectedAgentId,getClient:()=>this.context.gateway.snapshot.client,getClientEpoch:()=>this.gateway.epoch,getData:()=>this.data,getOrders:()=>this.profileOrders,setData:e=>this.data=e,setOrders:e=>this.profileOrders=e,clearMessage:e=>this.setMessage(e,null),canMutate:()=>this.canMutate(),cancelRefresh:()=>this.core.invalidate(),refresh:()=>this.refresh(`forced`),isCurrentClient:(e,t)=>this.gateway.isCurrent({client:e,epoch:t}),isBusy:e=>!!this.busy[e],setBusy:(e,t)=>this.setBusy(e,t),setProbeResult:(e,t)=>this.probeResults=J(this.probeResults,e,t),setProbeError:(e,t)=>this.setMessage(e,{kind:`error`,text:t}),getConfig:()=>this.context.runtimeConfig}),this.discovery=new qt(this,{canOpen:()=>this.canMutate(),getOwner:()=>({client:this.gateway.client,epoch:this.gateway.epoch,agentEpoch:this.agentEpoch,agentId:this.context.settingsAgentSelection.state.selectedId,selectionIntentRevision:this.context.settingsAgentSelection.intentRevision,selectionPending:this.context.settingsAgentSelection.state.selectedId===null&&this.context.agents.state.agentsList===null}),isCurrent:e=>!!(this.isConnected&&e.client&&this.gateway.isCurrent({client:e.client,epoch:e.epoch})&&this.agentEpoch===e.agentEpoch),onClose:()=>void this.refresh(`replacement`),onError:e=>this.setMessage(`connection`,{kind:`error`,text:B(e)})}),this.login=new Pt(this,{getScope:()=>({context:this.context,agentId:this.selectedAgentId,authStatus:this.data?.authStatus??null}),canStart:()=>this.canMutate(),onDiscover:()=>{this.setMessage(`connection`,null),this.discovery.open()},onApiKey:e=>{this.addProviderId=e,this.addProviderKey=``,this.addProviderOpen=!0,this.setMessage(`add`,null)},canContinue:()=>this.mutationBlockedReason()===null,refresh:()=>this.refresh(`replacement`)}),this.subscriptions=new n(this).effect(()=>this.context?.gateway,e=>Ue(e,()=>void this.refresh(`publication`))).effect(()=>this.context?.gateway,e=>this.installedAgents.subscribe(e)).watch(()=>this.context?.gateway.snapshot.client,et).watchStore(()=>this.context?.runtimeConfig,e=>{!e.state.configSnapshot&&!e.state.configLoading&&e.ensureLoaded().catch(()=>void 0),this.profileActions.flushPendingOrders()}).watchStore(()=>this.context?.overlays,()=>this.profileActions.flushPendingOrders()).watchStore(()=>this.context?.agents,()=>this.syncSelectedAgent()).effect(()=>this.context?.settingsAgentSelection,e=>e.subscribe(()=>this.syncSelectedAgent())),this.setBusy=(e,t)=>this.busy=J(this.busy,e,t?!0:null),this.setMessage=(e,t)=>this.messages=J(this.messages,e,t)}disconnectedCallback(){this.profileActions.resetOrders(),this.subscriptions.clear(),this.refreshPolicy.dispose(),super.disconnectedCallback()}willUpdate(e){let t=this.routeData,n=e.get(`routeData`);(e.has(`routeData`)||e.has(`loaderPending`))&&t&&(t.connect&&!n?.connect&&(this.pendingConnection=!0),e.has(`routeData`)&&t.provider!==n?.provider&&(this.providerQuery=Ge(t.provider??``)),this.core.invalidate(),this.routeDataObserved=!0,this.setSelectedAgent(this.context.settingsAgentSelection.state.selectedId??``),(t.agentId??``)===this.selectedAgentId&&t.selectionIntentRevision===this.context.settingsAgentSelection.intentRevision&&this.gateway.isRouteDataCurrent(t)?this.supplemental.adoptCoreData(t.client,t.data):(this.data=null,this.dataClient=null,this.refreshPolicy.resetPayload()),this.ensureInitialData())}updated(){this.isConnected&&this.pendingConnection&&this.data&&this.canMutate()&&!this.core.loading&&(this.pendingConnection=!1,this.login.open())}ensureInitialData(){!this.context.agents.state.agentsList&&!this.context.agents.state.agentsLoading&&!this.context.agents.state.agentsError&&this.context.agents.ensureList();let e=this.gateway.client;this.routeDataObserved&&!this.loaderPending&&this.gateway.connected&&e&&this.selectedAgentId&&!this.core.loading&&(this.data===null||this.data.updatedAt===null||e!==this.dataClient)&&this.refresh(`replacement`)}retryCatalog(){let{client:e,epoch:t}=this.gateway,n=this.selectedAgentId,r=this.agentEpoch;this.gateway.connected&&e&&n&&this.core.discoverCatalog(e,n,()=>this.gateway.isCurrent({client:e,epoch:t})&&this.selectedAgentId===n&&this.agentEpoch===r)}invalidateRequests(){this.logoutConfirmation?.abort(),this.core.invalidate(),this.supplemental.invalidate()}resetConnectionState(e={}){e.preserveVisibleData||(this.data=null,this.dataClient=null),this.refreshPolicy.resetPayload(),this.discovery.cancelLoading(),this.installedAgents.reset(e),this.resetAgentScopeState(),this.profileActions.resetProbes(),this.defaultsDraft=null}resetAgentScopeState(){this.login.reset(),this.busy={},this.messages={},this.probeResults={},this.closeKeyEditor(),this.logoutConfirmation?.abort(),this.profileActions.resetOrders(),this.addProviderOpen=!1,this.addProviderId=``,this.addProviderKey=``}setSelectedAgent(e){return e!==this.selectedAgentId&&(this.selectedAgentId=e,this.agentEpoch+=1,this.resetAgentScopeState(),!0)}syncSelectedAgent(){this.setSelectedAgent(this.context.settingsAgentSelection.state.selectedId??``)&&(this.invalidateRequests(),this.data=null,this.dataClient=null,this.refreshPolicy.resetPayload(),this.requestUpdate(),this.ensureInitialData())}refresh(e){if(!this.selectedAgentId)return Promise.resolve();let t=this.gateway.client;return!this.gateway.connected||!t?(this.refreshPolicy.markLoadDeferred(),Promise.resolve()):this.core.refresh(t,this.selectedAgentId,e)}closeKeyEditor(){this.keyEditorProvider=null,this.keyDraft=``}async mutateApiKey(e,t,n,r=`edit`){let i=this.gateway.client,a=r===`add`?`add`:`key:${e}`;if(!i||!this.canMutate()||this.busy[a]||n===``)return;let o=this.gateway.epoch,s=this.agentEpoch,c=()=>this.gateway.isCurrent({client:i,epoch:o})&&this.agentEpoch===s;this.profileActions.clearProbe(e);let l=await yt({runtimeConfig:this.context.runtimeConfig,isCurrentClient:c,isCurrentAgent:c,canMutate:()=>this.canMutate(),refreshProviders:async()=>{let e=this.data;if(await this.refresh(`replacement`),c()&&this.data?.error){let t=this.data.error;return this.data=e,t}return this.data?.error??this.data?.catalogError??null},setBusy:e=>this.setBusy(a,e),setMessage:t=>{this.setMessage(e,t),r===`add`&&this.setMessage(`add`,t)}},{client:i,agentId:this.selectedAgentId,provider:t,apiKey:n,success:b(r===`add`?`modelProviders.add.saved`:n===null?`modelProviders.apiKey.removed`:`modelProviders.apiKey.saved`,{provider:e})});l.ok&&c()&&(r===`add`?this.addProviderId===e&&this.addProviderKey.trim()===n&&(this.addProviderOpen=!!l.warning,l.warning||(this.addProviderId=``),this.addProviderKey=``):this.keyEditorProvider===e&&this.keyDraft.trim()===n&&this.closeKeyEditor())}async requestLogout(e){if(this.logoutConfirmation||!this.canMutate()||this.busy[`logout:${e.cardId}`])return;let t=new AbortController;this.logoutConfirmation=t,await Re({title:b(`modelProviders.logout.actionFor`,{account:e.label}),message:b(`modelProviders.logout.confirm`,{provider:e.label}),confirmLabel:b(`modelProviders.logout.action`),danger:!0,signal:t.signal}).finally(()=>{this.logoutConfirmation=null})&&!t.signal.aborted&&this.canMutate()&&await this.profileActions.logout(e.cardId,e.target)}async saveDefaults(){let e=this.defaultsDraft;if(!e)return;let t=this.context.gateway.snapshot.client,n;if(t&&!G(this.context)&&!V(this.context)&&!this.busy.defaults){let r=this.gateway.epoch,i=this.agentEpoch;n=bt({runtimeConfig:this.context.runtimeConfig,isCurrentClient:()=>this.gateway.isCurrent({client:t,epoch:r}),isCurrentAgent:()=>this.agentEpoch===i,setBusy:e=>this.setBusy(`defaults`,e),setMessage:e=>this.setMessage(`defaults`,e)},{raw:Rt(e),note:b(`modelProviders.notes.defaultModel`),replacePaths:ht})}await n,this.defaultsDraft===e&&(this.defaultsDraft=null)}render(){let e=this.context.gateway.snapshot,t=e.hello?.auth,n=this.context.agents.state,r=n.agentsList?.agents??[],i=n.agentsList!==null&&te(r).length===0,a=n.agentsList?null:n.agentsError,o=r.find(e=>Ee(e.id)===this.selectedAgentId),s=this.data??ft,c=l(this.context.runtimeConfig.state),u=zt(c),f=Qe(e.client,this.selectedAgentId),p={...u.defaults,...vt(O(O(c?.agents)?.defaults))},{defaults:m,configuredModels:h}=xt(f,p,this.defaultsDraft),g=e=>{this.defaultsDraft={...this.defaultsDraft??p,...e},this.setMessage(`defaults`,null),this.saveDefaults()},_=St({...s,models:f?.models??null,providerOutcomes:f.hasSnapshot?f.providerOutcomes??[]:s.providerOutcomes,pendingProviders:f?.pendingProviders,providerUsage:s.providerUsage?.ok?s.providerUsage.value:null,configProviders:u.providers}),ee=new Set([...u.providers.map(({key:e})=>e),...s.authStatus?.providers.filter(e=>!!e.apiKey||e.profiles.length>0).map(e=>e.provider)??[]]),v=_e(e,`models.probe`),ne=_e(e,`codex.accountUsage`),y=this.login.pageActions;return Dn({body:Tn({accountRecovery:this.login.renderRecovery(),providerScope:En({agentLabel:o?d(o):this.selectedAgentId,...y,connectDisabled:y.connectDisabled||this.discovery.busy||this.addProviderOpen}),providerQuery:this.providerQuery,onProviderQueryChange:e=>this.providerQuery=e,onConnectProvider:()=>void this.login.open(),usageClient:!this.mutationBlockedReason()&&ne?e.client:null,usageAgentId:this.selectedAgentId,connected:e.phase===`connected`,loading:e.phase===`connected`&&this.data===null&&!a&&!i,refreshing:this.core.loading,error:a??(i?b(`agents.noAgents`):s.error),providerUsageFailed:s.providerUsage?.ok===!1,supplementalLoading:this.loaderPending||this.supplemental.loading,updatedAt:s.updatedAt,credentialAgentLabel:o?d(o):this.selectedAgentId,cards:i?[]:this.installedAgents.filterProviders(_),configuredModels:h,decisionModels:f?.decisionModels??[],defaultModels:m,authStatus:s.authStatus,automaticUtilityModel:f?.defaultModels?.automaticUtilityModel,utilityRuntime:f?.defaultModels?.utilityRuntime,thinkingLevel:m.thinkingLevel,thinkingOverridden:m.thinkingOverridden,fastMode:m.fastMode,fastModeOverridden:m.fastModeOverridden,catalogDiscovering:this.core.catalogLoading||!!f?.pendingProviders?.length,catalogDiscoveryError:this.core.catalogLoading?null:this.core.catalogError??s.catalogError,configBusy:V(this.context),unconfiguredProviders:Lt(s.authStatus?.providerCapabilities,ee),canViewProfiles:e.phase===`connected`&&t?.scopes!==void 0&&ue(t),mutationBlockedReason:this.mutationBlockedReason(),defaultsMutationBlockedReason:G(this.context),providerUsageStalled:this.refreshPolicy.incompleteUsageExhausted,probeAvailable:v!==!1,busy:this.busy,messages:this.messages,probeResults:this.probeResults,keyEditorProvider:this.keyEditorProvider,keyDraft:this.keyDraft,profileOrders:this.profileOrders,addProviderOpen:this.addProviderOpen,addProviderId:this.addProviderId,addProviderKey:this.addProviderKey,installedAgents:this.installedAgents.render(_,()=>this.retryCatalog()),onRefresh:()=>void(a?this.context.agents.refreshList():Promise.all([this.context.runtimeConfig.refresh({background:!0}),this.refresh(`forced`)])),onOpenKeyEditor:e=>{this.keyEditorProvider=e,this.keyDraft=``,this.setMessage(e,null)},onCloseKeyEditor:()=>this.closeKeyEditor(),onKeyDraftChange:e=>this.keyDraft=e,onSaveKey:(e,t)=>void this.mutateApiKey(e,t,this.keyDraft.trim()),onRemoveKey:(e,t)=>void this.mutateApiKey(e,t,null),onProbe:(e,t)=>void this.profileActions.probe(e,t),onRequestLogout:e=>void this.requestLogout(e),onProfileOrderChange:(e,t,n)=>this.profileActions.setOrder(e,t,n),onAddProviderToggle:()=>{this.addProviderOpen=!this.addProviderOpen,this.addProviderKey=``,this.setMessage(`add`,null)},onAddProviderKeyChange:e=>this.addProviderKey=e,onAddProvider:()=>{let e=this.addProviderId;e&&this.mutateApiKey(e,e,this.addProviderKey.trim(),`add`)},...gt(()=>this.defaultsDraft??p,g),onCatalogRetry:()=>this.retryCatalog(),...this.login.providerActions}),loginMessage:this.messages.connection??y.loginMessage,login:w`${y.login}${this.discovery.render({agentLabel:o?d(o):this.selectedAgentId,credentialChoices:s.authStatus?.providerCapabilities?.flatMap(e=>e.loginOptions?.map(e=>e.id)??[])??[]})}`})}},D([Se({context:ce,subscribe:!0})],$.prototype,`context`,void 0),D([fe({attribute:!1})],$.prototype,`routeData`,void 0),D([fe({attribute:!1})],$.prototype,`loaderPending`,void 0),D([E()],$.prototype,`data`,void 0),D([E()],$.prototype,`busy`,void 0),D([E()],$.prototype,`messages`,void 0),D([E()],$.prototype,`probeResults`,void 0),D([E()],$.prototype,`keyEditorProvider`,void 0),D([E()],$.prototype,`keyDraft`,void 0),D([E()],$.prototype,`profileOrders`,void 0),D([E()],$.prototype,`providerQuery`,void 0),D([E()],$.prototype,`addProviderOpen`,void 0),D([E()],$.prototype,`addProviderId`,void 0),D([E()],$.prototype,`addProviderKey`,void 0),D([E()],$.prototype,`defaultsDraft`,void 0),D([E()],$.prototype,`selectedAgentId`,void 0),customElements.get(`zero-model-providers-page`)||customElements.define(`zero-model-providers-page`,$)})))()}kn();
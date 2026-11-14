import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{I as t,Ic as n,Lc as r,Nu as i,Pu as a,Vl as o,W as s,bu as c,ju as l,kl as u,xu as d,yu as ee,zu as f}from"./control-ui-core-DCNBgr3X.js";import{Aa as te,Ai as ne,Ba as re,ca as p,ki as ie,or as ae,qr as oe,sa as m,sr as se,wr as h,yr as g,za as ce}from"./control-ui-core-DwX5Mpz4.js";import{B as _,E as le,G as v,H as y,I as ue,J as b,K as de,L as fe,M as pe,N as me,P as he,R as ge,U as _e,W as x,Y as ve,Z as ye,at as S,k as be,rt as C,z as xe}from"./lit-runtime-B40xFCK_.js";import{d as w,l as Se}from"./gateway-runtime-JSfC8ThO.js";import{$ as Ce,Z as we}from"./control-ui-boot-shared-BX8huZUb.js";import{Ur as Te,Wr as Ee,Zr as T}from"./ui-AaV6iNVa.js";import{M as E,N as D,j as De}from"./control-ui-boot-shared-E4pYPcWx.js";import{Ci as O,Ei as Oe,I as ke,Mi as Ae,Ni as je,R as Me,Si as k,Ti as A,a as Ne,l as Pe,o as Fe,u as Ie,wi as j,xi as M}from"./control-ui-boot-shared-ZuP0LiFD.js";import{An as Le,Cn as Re,Ls as ze,Sn as Be,js as Ve,wn as He,xn as Ue}from"./control-ui-boot-shared-CzJHozXQ.js";import{c as We,d as Ge,i as N,l as Ke,n as qe,o as P,r as Je,u as Ye}from"./state-BajZM06-.js";import{_ as Xe,g as Ze,v as Qe}from"./control-ui-boot-chat-Cx6CBnJr.js";import{a as $e,i as et,o as tt,s as nt}from"./wizard-login-controller-tM2ShtC6.js";import{a as rt,c as it,g as F,h as I,i as at,r as ot,s as st}from"./view-status-D9yLNP6D.js";import{a as L,i as ct,n as lt,o as R,s as ut,t as z}from"./first-run-activation-receipt-CYoUeBg2.js";function B(e){return ee(e,f(`modelSetup.errors.requestFailed`))}async function V(e,t){try{return{client:e,value:await t()}}catch(t){return{client:e,error:t}}}function H(){return(H=e((()=>{a(),d()})))()}function U(e,t){return t?e.agentSelection:e.settingsAgentSelection}function dt(e,t,n=null){let r=e.gateway.snapshot,i=U(e,t);return{client:r.client,hello:r.hello,agentId:i.state.selectedId,selectionIntentRevision:t?0:i.intentRevision,selectionPending:!t&&i.state.selectedId===null&&e.agents.state.agentsList===null,connected:r.phase===`connected`,firstRun:t,connectionRevision:e.gateway.connectionRevision,recoveryScope:r.phase===`connected`?r.hello?.auth?.recoveryScope??null:n}}function ft(e,t){let n=e&&(!t.recoveryScope||t.recoveryScope!==e.recoveryScope);return{authenticatedOwnerLost:n,ownerChanged:e&&(t.agentId!==e.agentId||t.selectionIntentRevision!==e.selectionIntentRevision||t.firstRun!==e.firstRun||t.connectionRevision!==e.connectionRevision||n)}}function pt(e,t){return e&&t.selectionPending&&t.selectionIntentRevision===e.selectionIntentRevision&&t.firstRun===e.firstRun&&t.connectionRevision===e.connectionRevision&&(!t.connected||t.recoveryScope&&t.recoveryScope===e.recoveryScope&&g(t.hello?.auth??null))?{kind:e.selectionPending?`unchanged`:`pending`,connection:{...e,selectionPending:!0}}:{kind:e&&t.client===e.client&&t.hello===e.hello&&t.agentId===e.agentId&&t.connected===e.connected&&t.firstRun===e.firstRun&&t.connectionRevision===e.connectionRevision&&t.recoveryScope===e.recoveryScope&&t.selectionIntentRevision===e.selectionIntentRevision&&t.selectionPending===e.selectionPending?`unchanged`:`changed`,connection:t}}var mt;function ht(){return(ht=e((()=>{h(),a(),s(),ct(),H(),P(),mt=class{constructor(e){this.host=e,this.generation=0,this.started=!1,this.readyConnection=null,this.pending=null}subscribe(e){return ut(t=>{let n=this.pending;n?.receipt&&JSON.stringify(n.receipt)===t&&(this.pending=null,n.outcome===`pending`&&this.host.closeWizard(),n.outcome===`verified`&&this.host.setActivationState({phase:`idle`}),this.host.setVerifyState({phase:`idle`}),e())})}setReadyConnection(e){this.readyConnection=e}routeChanged(){let e=this.pending?.receipt??null;this.reset(),this.readyConnection=null,this.pending=null,this.host.routeData()?.firstRun===!1&&z(e)}connectionChanged(e){if(this.reset(),this.readyConnection=null,this.pending&&(!this.pending.owner.recoveryScope||e.agentId!==this.pending.owner.agentId||this.host.context().gateway.connectionRevision!==this.pending.owner.connectionRevision||this.host.context().gateway.snapshot.phase===`connected`&&(e.hello?.auth?.recoveryScope??null)!==this.pending.owner.recoveryScope)){let e=this.pending.receipt;this.pending=null,z(e)}}reconnectActivation(e){let t=this.pending;if(!t)return;let n=this.host.context();t.owner.recoveryScope&&t.owner.connectionRevision===n.gateway.connectionRevision&&t.owner.recoveryScope===(e.hello?.auth?.recoveryScope??null)&&t.owner.agentId===e.agentId&&t.owner.firstRun===this.host.routeData()?.firstRun&&(t.owner=this.owner(t.owner.firstRun))}retryDetection(){if(this.host.actionsDisabled())return!1;if(this.pending?.outcome===`missing`)return!0;if(this.pending&&Date.now()<this.pending.deadlineMs)return this.host.setRefreshWarning(f(`modelSetup.recovery.wait`,{time:t(this.pending.deadlineMs)})),!0;if(this.host.routeData()?.firstRun){let e=this.host.pageState(),t=this.pending&&e.phase===`ready`&&this.configuredActivationModel(e.result);this.pending=null,z(),this.host.setRefreshWarning(null),this.reset(),this.started=!!t}return!0}wizardMissing(){this.pending&&this.ownsActivation()&&(this.pending.outcome=`missing`)}reconcileMissingWizard(e){let t=this.pending;t?.outcome===`missing`&&this.ownsActivation(t)&&(this.host.setRefreshWarning(null),this.configuredActivationModel(e)||(this.pending=null,z(t.receipt)))}dispose(){this.reset(),this.readyConnection=null,this.pending=null}visiblePageState(e){let t=this.host.pageState();return this.host.routeData()?.firstRun&&t.phase===`ready`&&t.result.setupComplete&&t.result.configuredModel&&!e?{...t,result:{...t.result,setupComplete:!1}}:t}start(){let e=this.host.routeData(),t=this.host.context(),n=t.gateway.snapshot,r=this.host.pageState(),i=this.readyConnection;if(!e?.firstRun||this.started||r.phase!==`ready`||!i||i.client!==n.client||i.hello!==n.hello||i.agentId!==t.agentSelection.state.selectedId||this.host.actionsDisabled()||!this.host.canUseSetup(n.client))return;let a=R(t);this.pending?.receipt&&a?.owner!==this.pending.receipt.owner&&(this.pending=null);let o=a??this.pending;if(o&&(this.pending={owner:this.owner(e.firstRun),modelRef:o.modelRef,...o.modelTarget?{modelTarget:o.modelTarget}:{},kind:o.kind,deadlineMs:o.deadlineMs,receipt:a,outcome:`pending`}),this.started=!0,!this.pending)return;let s=this.configuredActivationModel(r.result);if(!this.pending.modelRef&&a?.wizard){this.host.resumeWizard(a.wizard,this.observeActivation(this.pending));return}if(!s||!this.pending.modelRef){this.showUnresolved();return}if(!this.host.canVerify(n.client)){this.host.setVerifyState({phase:`failed`,status:`unknown`,error:`${f(`modelSetup.access.gatewayTooOld`)}. ${f(`updates.confirm.action`)}. ${f(`desktop.reconnect`)}.`});return}this.verifyRestoredModel(this.owner(e.firstRun),s)}beginActivation(e){let t=this.host.routeData();if(!t?.firstRun)return null;let n=this.owner(t.firstRun),r=L(this.host.context(),e);return this.pending={owner:n,kind:e.kind,modelRef:e.modelRef??null,...e.modelTarget?{modelTarget:e.modelTarget}:{},receipt:r,outcome:`pending`,deadlineMs:r?.deadlineMs??lt(e.kind)},this.started=!0,this.pending}recordActivation(e,t){if(!e)return;if(t.status===`cancelled`||t.status===`not-admitted`||t.status===`error`&&t.activationRejection?.disposition===`rejected-before-promotion`){this.ownsActivation(e)&&(e.outcome=`rejected`),z(e.receipt),this.pending===e&&(this.pending=null);return}let n=t.status===`done`?t.modelActivation:void 0;n?.modelRef&&this.pending===e&&this.ownsActivation(e)&&(e.modelRef=n.modelRef,e.modelTarget=n.modelTarget,e.outcome=`verified`,e.receipt=L(this.host.context(),e))}observeActivation(e){return t=>(this.recordActivation(e,t),this.host.notify(),()=>this.ownsActivation(e))}finishActivation(e,t,n){this.pending&&this.ownsActivation()&&e.ok&&e.modelRef&&(e.gatewayRestartRequired?(this.host.setActivationState({phase:`testing`,targetId:t}),this.host.setRefreshWarning(n??f(`updates.dialog.restarting`))):n||this.completeNavigation())}get unresolved(){return this.pending!==null}get canUseCurrentModel(){let e=this.host.pageState();return this.pending!==null&&e.phase===`ready`&&!!this.configuredActivationModel(e.result)}async useCurrentModel(){let e=this.host.pageState(),t=this.pending,n=e.phase===`ready`?this.configuredActivationModel(e.result):void 0;if(!t||!n||this.host.actionsDisabled())return;let r=this.owner(t.owner.firstRun),i=await this.verify();!this.owns(r)||this.pending!==t||!i||`error`in i||(i.value.ok&&i.value.modelRef===n&&i.value.modelTarget===t.modelTarget?this.completeNavigation():i.value.ok&&this.showUnresolved())}owner(e){return{...dt(this.host.context(),e),generation:this.generation}}ownsActivation(e=this.pending){return e?this.owns(e.owner)?e.outcome===`rejected`?this.pending===null:this.pending===e&&(!e.receipt||R(this.host.context(),e.receipt)!==null)&&Date.now()<e.deadlineMs:!1:!this.host.routeData()?.firstRun}async verify(){let e=this.host.routeData();if(!e)return;let t=this.owner(e.firstRun),n=this.pending,r=await this.host.verify(n?.modelTarget);if(this.owns(t)&&r){if(this.pending!==n||n&&!this.ownsActivation(n)){this.host.setVerifyState({phase:`idle`});return}return this.host.setVerifyState(`error`in r?{phase:`failed`,status:`unknown`,error:B(r.error)}:Ke(r.value)),r}}continueSetup(e){if(this.pending)this.pending.outcome===`verified`&&this.ownsActivation()&&this.completeNavigation();else{let t=this.host.pageState(),n=this.host.activationState();e===`utility`||n.phase===`success`&&n.modelTarget===`utility`||t.phase===`ready`&&t.result.setupModel?this.host.context().navigate(`custodian`,t.phase===`ready`&&!t.result.configuredModel?{search:`?onboarding=1`}:{}):this.host.context().navigate(`chat`)}}completeNavigation(){this.pending=null,z(),this.host.setRefreshWarning(null),this.host.context().navigate(`custodian`,{search:`?onboarding=1`})}showUnresolved(){this.host.setRefreshWarning(null),this.host.setVerifyState({phase:`failed`,status:`unknown`,error:`${f(`modelSetup.errors.activationFailed`)} ${this.pending?.modelRef??``}`.trim()})}reset(){this.generation+=1,this.started=!1}owns(e){let t=this.host.context(),n=t.gateway.snapshot;return e.generation===this.generation&&e.connectionRevision===t.gateway.connectionRevision&&e.recoveryScope===(n.hello?.auth?.recoveryScope??null)&&e.firstRun===this.host.routeData()?.firstRun&&n.phase===`connected`&&n.client===e.client&&n.hello===e.hello&&U(t,e.firstRun).state.selectedId===e.agentId}async verifyRestoredModel(e,t){if(this.pending&&t!==this.pending.modelRef){this.showUnresolved();return}let n=await this.verify();if(!this.owns(e)||!n||`error`in n||!n.value.ok)return;let{modelRef:r,modelTarget:i}=n.value;this.pending?this.pending.modelRef===r&&this.pending.modelTarget===i?this.completeNavigation():this.showUnresolved():this.host.context().navigate(`chat`)}configuredActivationModel(e){return this.pending?.modelTarget===`utility`?e.utilityModel??e.setupModel:e.setupComplete?e.configuredModel:void 0}}})))()}function gt(e){return e.brandId&&M(e.brandId)?e.brandId:null}function W(e,t,n=``){let r=gt(t),i=`model-setup__icon ${n}`.trim();if(r)return A(r,{className:i});let a=t.icon?e.iconUrls[t.icon]:void 0;return a?b`<img
    class=${i}
    src=${a}
    alt=${t.label}
    width="24"
    height="24"
    @error=${()=>e.onIconError(t.icon)}
  />`:Oe(t.label,{className:i})}function _t(e,t,n){function r(){let e=t();if(e.phase!==`ready`)return new Set;let n=e.result;return new Set([...n.candidates,...n.manualProviders,...n.authOptions??[],...n.prepareOptions??[],...n.recommendedInstalls??[]].flatMap(e=>e.icon&&!gt(e)?[e.icon]:[]))}let i=new Ze({getFetchContext:()=>Qe(e()),isConnected:t=>e().gateway.snapshot.phase===`connected`&&r().has(t),fetchIcon:(e,t,n)=>Ve({iconUrl:e,...t,signal:n}),timeoutError:()=>new DOMException(`catalog icon fetch timed out`,`TimeoutError`),onUrlsChange:n});return{reconcile(){let e=r();i.reconcileKeys(e);for(let t of e)i.load(t)},invalidate:e=>i.handleError(e),reset:()=>i.reset()}}function G(){return(G=e((()=>{x(),k(),ze(),Xe()})))()}function vt(e){return b`
    <section class="settings-section" data-native-model-setup>
      <div class="settings-section__header"><h2>${f(`modelSetup.nativeModels.title`)}</h2></div>
      <p class="muted">${f(`modelSetup.nativeModels.body`)}</p>
      ${e}
    </section>
  `}function yt(){return vt(b`
    <div class="model-picker"><span class="picker-select__trigger skeleton"></span></div>
    <span class="btn skeleton">${`\xA0`}</span>
  `)}var bt;function K(){return(K=e((()=>{x(),Ne(),k(),a(),Ce(),Ue(),u(),H(),bt=class{constructor(e,t){this.host=e,this.options=t,this.nativeModels=[],this.nativeModel=``,this.nativeModelError=null,this.nativeCatalogError=null,this.saving=!1,this.generation=0,this.nativeModelsAbort=null,this.nativeModelsUnsubscribe=null,this.nativeModelsStatus=`idle`}get count(){return this.nativeModels.length}reset(){this.generation+=1,this.nativeModels=[],this.nativeModel=``,this.nativeModelError=null,this.nativeCatalogError=null,this.saving=!1,this.nativeModelsAbort?.abort(),this.nativeModelsAbort=null,this.nativeModelsUnsubscribe?.(),this.nativeModelsUnsubscribe=null,this.nativeModelsStatus=`idle`}async useNativeModel(){let e=this.options.getConnection(),t=this.generation,n=()=>this.generation===t&&this.options.getConnection()===e,r=this.options.getContext(),i=r.gateway.snapshot.client,a=e?.agentId??o(r.gateway.snapshot)?.defaultAgentId,s=this.nativeModels.find(e=>`${e.provider}/${e.id}`===this.nativeModel);if(!this.options.canUseSetup(i)||!a||s?.available!==!0||this.saving||this.options.blocked())return;this.saving=!0,this.host.requestUpdate(),this.nativeModelError=null;let c=`${s.provider}/${s.id}`;try{let e=await r.runtimeConfig.runExternalMutation(e=>e.request(`agents.update`,{agentId:a,model:c,agentRuntime:s.agentRuntime?.id}),{canDispatch:()=>n()&&this.options.canUseSetup(i)});if(!n())return;let t=e.ok?e.refresh:e;if(!t.ok){this.nativeModelError=t.error;return}await r.agents.refreshList(),n()&&this.options.onSelected()}catch(e){n()&&(this.nativeModelError=B(e))}finally{n()&&(this.saving=!1,this.host.requestUpdate())}}applyNativeCatalog(e){this.nativeModels=e.models.filter(e=>e.agentRuntime&&e.agentRuntime.id!==`zero`),this.nativeModelsStatus=e.pendingProviders?.length?`loading`:`ready`,this.nativeCatalogError=Re(e),this.nativeModels.some(e=>`${e.provider}/${e.id}`===this.nativeModel)||(this.nativeModel=``)}async loadNativeModels(e){let t=this.options.getConnection(),n=this.options.getContext(),r=n.gateway.snapshot.client;if(!r||!this.options.canUseSetup(r))return;let i={view:`all`,agentId:t?.agentId??void 0},a=He(r,i,{allowStale:!0});a&&this.applyNativeCatalog(a),this.nativeModelsUnsubscribe??=Le(n.gateway,()=>void this.loadNativeModels(!1),i),this.nativeModelsAbort?.abort();let o=new AbortController;this.nativeModelsAbort=o,e&&(this.nativeCatalogError=null),this.nativeModelsStatus=`loading`,this.host.requestUpdate();try{let n=await Be(r,{...i,refresh:e,signal:o.signal});if(this.options.getConnection()!==t||o.signal.aborted)return;this.applyNativeCatalog(n)}catch(e){this.options.getConnection()===t&&!o.signal.aborted&&(this.nativeModelsStatus=`ready`,this.nativeCatalogError=B(e))}finally{this.nativeModelsAbort===o&&(this.nativeModelsAbort=null,this.host.requestUpdate())}}render(){let e=this.nativeModels,t=e.find(e=>`${e.provider}/${e.id}`===this.nativeModel);return vt(b`
      ${this.nativeModelsStatus===`loading`?b`<p role="status">${f(`modelSetup.nativeModels.loading`)}</p>`:v}
      ${this.nativeModelsStatus===`ready`&&e.length===0&&!this.nativeCatalogError?b`<p role="status">${f(`modelSetup.nativeModels.empty`)}</p>`:v}
      ${Fe({label:f(`modelSetup.nativeModels.choose`),value:this.nativeModel,options:e.map(e=>({value:`${e.provider}/${e.id}`,label:e.name,provider:e.provider,detail:e.available===!0?O(e.provider):we(e.unavailableReason)??(this.nativeModelsStatus===`loading`&&e.available===void 0?f(`modelSetup.nativeModels.loading`):e.available===!1?f(`chat.modelControls.modelsUnavailable`):f(`modelSetup.nativeModels.unconfirmed`)),disabled:e.available!==!0})),disabled:this.options.blocked()||this.saving,onChange:e=>{this.nativeModel=e,this.host.requestUpdate()},onOpen:()=>{this.nativeModelsAbort||this.loadNativeModels(this.nativeModelsStatus===`idle`)}})}
      <button
        class="btn primary"
        ?disabled=${this.options.blocked()||this.saving||t?.available!==!0}
        @click=${()=>void this.useNativeModel()}
      >
        ${f(this.saving?`modelSetup.nativeModels.saving`:`modelSetup.nativeModels.use`)}
      </button>
      ${this.nativeModelError?b`<div class="callout danger" role="alert">${this.nativeModelError}</div>`:v}
      ${this.nativeCatalogError?b`
              <div class="callout danger" role="alert">
                ${this.nativeCatalogError}
                <button
                  class="btn btn--sm"
                  type="button"
                  ?disabled=${this.options.blocked()||this.saving||this.nativeModelsAbort!==null}
                  @click=${()=>void this.loadNativeModels(!0)}
                >
                  ${f(`common.retry`)}
                </button>
              </div>
            `:v}
    `)}}})))()}function xt({kind:e,modelRef:t,modelTarget:n}){return{kind:e,modelRef:t,...n?{modelTarget:n}:{}}}function q(e){return`provider-auto:${encodeURIComponent(e)}`}function St(e,t){return{kind:q(e.id),modelRef:t,...e.modelTarget?{modelTarget:e.modelTarget}:{}}}function Ct(e){return(e.prepareOptions??[]).filter(t=>!e.candidates.some(e=>e.credentials!==!1&&(e.kind===q(t.id)||e.modelRef.startsWith(`${t.brandId??t.id}/`))))}function wt(e,t){return e.candidates.find(e=>e.kind===q(t)&&e.credentials!==!1)}function Tt(e,t,n){let r=e.find(e=>e.id===t),i=n.trim();return r&&i?{kind:`api-key`,authChoice:r.id,apiKey:i,...r.modelTarget?{modelTarget:r.modelTarget}:{}}:null}function Et(e){let t=e.querySelector(`.model-setup__manual input[type="password"]`);e.querySelector(`zero-modal-dialog`)?.setReturnFocusTarget(t),t?.scrollIntoView?.({block:`nearest`,behavior:`auto`})}function Dt(e){e.addEventListener(`wa-after-hide`,()=>e.querySelector(`[slot="trigger"]`)?.focus({preventScroll:!0}),{once:!0})}function Ot(e){let t=e.currentTarget;if(!(!t.open||e.key!==`Tab`&&e.key!==`Escape`)){if(e.preventDefault(),e.key===`Tab`){e.stopPropagation();let n=e.shiftKey?t.querySelector(`[slot="trigger"]`):t.closest(`.model-setup__manual`)?.querySelector(`input[type="password"]`);t.addEventListener(`wa-after-hide`,()=>n?.focus({preventScroll:!0}),{once:!0}),t.open=!1}else Dt(t)}}function kt(e,t,n){let r=e.detail.item,i=e.currentTarget,a=r.value??r.getAttribute(`value`);if(a){if(a!==t){Dt(i),n(a);return}e.preventDefault(),r.checked=!0,i.querySelector(`[slot="trigger"]`)?.focus({preventScroll:!0}),i.open=!1}}function J(e){return e.groupLabel?.trim()||e.label}function At(e){let t=e.label.trim();return t===J(e)?void 0:t}function jt(e,t,n){let r=n?At(n):void 0,i=n?[J(n),r].filter(Boolean).join(`, `):f(`modelSetup.manual.selectProvider`);return b`
    <wa-dropdown
      class="model-setup-provider-select"
      placement="bottom-start"
      aria-label=${f(`modelSetup.manual.provider`)}
      @wa-select=${t=>kt(t,e.manualProviderId,e.onManualProviderChange)}
      @keydown=${Ot}
    >
      <button
        slot="trigger"
        type="button"
        class="model-setup-provider-select__trigger"
        aria-label=${`${f(`modelSetup.manual.provider`)}: ${i}`}
        ?disabled=${e.actionsDisabled||t.manualProviders.length===0}
      >
        ${n?W(e,n,`model-setup__icon--picker`):b`<span class="model-setup-provider-select__placeholder-icon" aria-hidden="true">
                ${m.key}
              </span>`}
        <span class="model-setup-provider-select__copy">
          <strong>
            ${n?J(n):f(`modelSetup.manual.selectProvider`)}
          </strong>
          ${n?r?b`<span>${r}</span>`:v:b`<span>${f(`modelSetup.manual.selectProviderHint`)}</span>`}
        </span>
        <span class="model-setup-provider-select__chevron" aria-hidden="true">
          ${m.chevronDown}
        </span>
      </button>
      ${t.manualProviders.toSorted((e,t)=>J(e).localeCompare(J(t))).map(t=>{let n=t.id===e.manualProviderId,r=At(t),i=[J(t),r,t.hint].filter(Boolean).join(`, `);return b`
            <wa-dropdown-item
              class="model-setup-provider-select__option"
              data-manual-provider=${t.id}
              ?data-selected=${n}
              aria-label=${i}
              .value=${t.id}
              type="checkbox"
              .checked=${n}
              ?disabled=${e.actionsDisabled}
              ?autofocus=${n&&!e.actionsDisabled}
              ${be(e=>je(e,n))}
            >
              <span slot="icon">
                ${W(e,t,`model-setup__icon--picker`)}
              </span>
              <span class="model-setup-provider-select__copy">
                <strong>${J(t)}</strong>
                ${r?b`<span>${r}</span>`:v}
                ${t.hint?b`<small>${t.hint}</small>`:v}
              </span>
            </wa-dropdown-item>
          `})}
    </wa-dropdown>
  `}function Y(){return(Y=e((()=>{x(),le(),p(),Ae(),a(),G()})))()}function Mt(e,t){return new E(e,{autoRun:!1,task:async([e,n,r],{signal:i})=>{if(!e||!r)return D;let a=t.getHello();return{...await V(e,()=>e.request(`zero.setup.detect`,n?{agentId:n}:{},{timeoutMs:qe,signal:i})),agentId:n,hello:a,token:r}},onComplete:t.onComplete})}function Nt(e){return new E(e,{autoRun:!1,task:async([e,t,n],{signal:r})=>e?V(e,()=>e.request(`zero.setup.verify`,{...t?{agentId:t}:{},...n?{modelTarget:n}:{}},{timeoutMs:Je,signal:r})):D})}function Pt(){return(Pt=e((()=>{De(),H(),P()})))()}var X,Ft;function It(){return(It=e((()=>{ve(),he(),ge(),X=e=>fe(e)?e._$litType$.h:e.strings,Ft=pe(class extends me{constructor(e){super(e),this.et=new WeakMap}render(e){return[e]}update(e,[t]){let n=_(this.it)?X(this.it):null,r=_(t)?X(t):null;if(n!==null&&(r===null||n!==r)){let t=ue(e).pop(),r=this.et.get(n);if(r===void 0){let e=document.createDocumentFragment();r=de(v,e),r.setConnected(!1),this.et.set(n,r)}y(r,[t]),_e(r,void 0,t)}if(r!==null){if(n===null||n!==r){let t=this.et.get(r);if(t!==void 0){let n=ue(t).pop();xe(e),_e(e,void 0,n),y(e,[n])}}this.it=t}else this.it=void 0;return this.render(t)}})})))()}function Lt(){return(Lt=e((()=>{It()})))()}function Rt(e){if(e.modelTarget===`utility`)return f(`modelSetup.utility.role`);let t=e.kind.startsWith(`saved-auth:`)?`detected`:e.recommended?`recommended`:e.credentials===void 0?`detected`:e.credentials?`credentialsReady`:`signInNeeded`;return f(`modelSetup.candidates.${t}`)}function zt(e,t){let n=t.candidates.filter(e=>e.kind.startsWith(`saved-auth:`)||(e.modelTarget!==`utility`||e.modelRef!==(t.utilityModel??t.setupModel))&&(!t.configuredModel||e.kind!==`existing-model`&&e.modelRef!==t.configuredModel));return n.length===0?v:b`
    <section class="settings-section">
      <div class="settings-section__header">
        <h2>${f(`modelSetup.candidates.title`)}</h2>
      </div>
      <div class="model-setup__rows">
        ${n.toSorted((e,t)=>e.label.localeCompare(t.label)).map(n=>{let r=(e.activation.phase===`testing`||e.activation.phase===`failure`)&&e.activation.targetId===N(n.kind,n.modelRef),i=r&&e.activation.phase===`testing`,a=r&&e.activation.phase===`failure`;return b`
              <div class="model-setup__row" data-candidate-kind=${n.kind}>
                <div class="model-setup__row-main">
                  <div class="model-setup__row-title">
                    ${W(e,n)}
                    <strong>${n.label}</strong>
                    <span class="model-setup__chip">${Rt(n)}</span>
                  </div>
                  <div class="muted">
                    ${n.modelRef} · ${c(n.detail)}
                  </div>
                  ${n.modelTarget===`utility`?b`<div class="muted">${f(`modelSetup.utility.hint`)}</div>`:v}
                </div>
                <div class="model-setup__row-actions">
                  <button
                    type="button"
                    class=${`btn ${a?``:`primary`}`}
                    ?disabled=${e.actionsDisabled||e.detecting}
                    @click=${()=>e.onActivateCandidate(n)}
                  >
                    <span>
                      ${f(i?`modelSetup.candidates.testingButton`:a?`modelSetup.candidates.retry`:n.modelTarget===`utility`?t.configuredModel?`modelSetup.utility.useUtility`:`modelSetup.utility.useSetup`:e.embedded?`modelSetup.discovery.useForAgent`:`modelSetup.candidates.testAndUse`)}
                    </span>
                  </button>
                </div>
              </div>
            `})}
      </div>
    </section>
  `}function Bt(){return(Bt=e((()=>{x(),a(),I(),d(),G(),P(),F()})))()}function Vt(e){let t=e.result.utilityModel??e.result.setupModel;if(!t)return v;let n=e.canRepair?e.result.candidates.find(e=>e.modelTarget===`utility`&&e.modelRef===t&&e.kind.startsWith(`provider-auto:`)):void 0,r=n&&e.activation.phase===`testing`&&e.activation.targetId===N(n.kind,n.modelRef);return b`<section class="settings-section model-setup__utility">
    <div class="settings-section__header"><h2>${f(`modelSetup.utility.configured`)}</h2></div>
    <div class="model-setup__row">
      <div class="model-setup__row-main">
        <strong>${t}</strong>
        <div class="muted">
          ${f(e.result.configuredModel?`modelSetup.utility.primaryReady`:`modelSetup.utility.choosePrimary`)}
        </div>
      </div>
      <div class="model-setup__row-actions">
        ${n?b`<button
                type="button"
                class="btn"
                ?disabled=${e.actionsDisabled}
                @click=${()=>e.onActivateCandidate(n)}
              >
                ${f(r?`modelSetup.candidates.testingButton`:`modelSetup.utility.repair`)}
              </button>`:v}
        <button
          type="button"
          class="btn primary"
          ?disabled=${e.actionsDisabled}
          @click=${e.onOpenAssistant}
        >
          ${f(`modelSetup.utility.openAssistant`)}
        </button>
      </div>
    </div>
  </section>`}function Z(e,t){let n=Wt[e]??`unknown`;return b`
    <div class="model-setup__failure" role="alert">
      <span class="model-setup__failure-icon" aria-hidden="true">${m.alertTriangle}</span>
      <span
        ><strong>${f(`modelSetup.failure.${n}`)}.</strong> ${t}
        ${n===`unavailable`?v:f(`modelSetup.failureGuidance.${n}`)}</span
      >
    </div>
  `}function Ht(e){let t=e.result.configuredModel,n=e.verify.phase===`ok`?e.verify.modelRef:t,r=j(n),i=n===t?e.result.candidates.find(e=>e.modelRef===t&&!e.kind.startsWith(`saved-auth:`)):void 0,a=r?O(r):n,o=n.slice(n.indexOf(`/`)+1),s=i?.detail.trim(),c=!s||i?.kind===`existing-model`?o:s.toLowerCase().includes(o.toLowerCase())?s:`${o} · ${s}`;return b`
    <section class="settings-section model-setup__current" data-verify-phase=${e.verify.phase}>
      <div class="settings-section__header">
        <h2>${f(`modelSetup.verify.title`)}</h2>
      </div>
      <div class="model-setup__row">
        <div class="model-setup__provider-copy">
          ${r?A(r,{className:`model-setup__icon`}):v}
          <div class="model-setup__current-copy">
            <strong>${a}</strong>
            <div class="muted">${c}</div>
            ${e.verify.phase===`checking`?b`<div class="model-setup__testing" role="status">
                    ${f(`modelSetup.verify.checking`,{modelRef:t})}
                  </div>`:e.verify.phase===`ok`?b`<div class="model-setup__verified" role="status">
                      ${e.verify.latencyMs===void 0?f(`modelSetup.verify.ready`):f(`modelSetup.verify.readyIn`,{latencyMs:String(e.verify.latencyMs)})}
                    </div>`:e.verify.phase===`failed`?Z(e.verify.status,e.verify.error):v}
          </div>
        </div>
        <div class="model-setup__row-actions">
          ${e.canVerify?b`<button
                  type="button"
                  class="btn"
                  ?disabled=${e.actionsDisabled}
                  @click=${e.onVerify}
                >
                  ${f(Gt[e.verify.phase])}
                </button>`:v}
          ${e.onContinue?b`<button type="button" class="btn primary" @click=${e.onContinue}>
                  ${m.messageSquare} ${f(`modelSetup.success.continueSetup`)}
                </button>`:v}
        </div>
      </div>
    </section>
  `}function Ut(e){return e.phase===`testing`?b`<div class="model-setup__testing" role="status">${f(`modelSetup.testing`)}</div>`:e.phase===`failure`?Z(e.status,e.error):v}var Wt,Gt;function Kt(){return(Kt=e((()=>{x(),p(),k(),a(),I(),P(),F(),Wt={auth:`auth`,rate_limit:`rateLimit`,billing:`billing`,timeout:`timeout`,format:`format`,unavailable:`unavailable`,unknown:`unknown`},Gt={checking:`modelSetup.verify.checkingButton`,failed:`modelSetup.verify.retry`,ok:`modelSetup.verify.checkAgain`,idle:`modelSetup.verify.button`}})))()}function Q(e,t={}){return b`
    <section class=${`settings-section ${t.className??``}`.trim()}>
      <div class="settings-section__header"><h2>${e}</h2></div>
      ${t.intro?b`<p class="muted model-setup__loading-intro">${t.intro}</p>`:v}
      <div class="model-setup__rows">
        ${Array.from({length:t.rows??1},(e,n)=>b`
            <div class="model-setup__row model-setup__loading-row">
              <span class="model-setup__loading-icon skeleton"></span>
              <span class="model-setup__loading-copy">
                ${n===0&&t.status?b`<span class="model-setup__loading-status">${t.status}</span>`:b`<span class="skeleton skeleton-line skeleton-line--medium"></span>`}
                <span class="skeleton skeleton-line skeleton-line--long"></span>
              </span>
              <span class="model-setup__loading-action skeleton"></span>
            </div>
          `)}
      </div>
    </section>
  `}function qt(e){return b`
    <div
      class="model-setup__loading"
      role="status"
      aria-busy="true"
      aria-label=${f(`modelSetup.loading`)}
    >
      <div class="model-setup__loading-sections" aria-hidden="true">
        ${e?Q(f(`modelSetup.verify.title`),{className:`model-setup__loading-section--selected`,status:f(`modelSetup.loading`)}):v}
        ${yt()}
        ${Q(f(`modelSetup.candidates.title`),{className:`model-setup__loading-section--candidates`,status:e?void 0:f(`modelSetup.loading`)})}
        ${Q(f(`modelSetup.prepare.title`),{intro:f(`modelSetup.prepare.intro`),rows:2})}
        ${Q(f(`modelSetup.signIn.title`),{className:`model-setup__loading-section--sign-in`})}
        ${Q(f(`modelSetup.manual.title`))}
      </div>
    </div>
  `}function Jt(){return(Jt=e((()=>{x(),a(),I(),K(),F()})))()}function Yt(e,t,n,r,i=!1){let a=j(e.modelRef),o=a&&M(a)?a:null,s=e.modelTarget===`utility`,c=f(s?`modelSetup.utility.ready`:`modelSetup.success.title`),l=e.warning??f(s?`modelSetup.utility.verified`:`modelSetup.success.body`,{modelRef:e.modelRef}),u=s?f(`modelSetup.utility.openAssistant`):i?f(`modelSetup.discovery.returnToModels`):r?f(`modelSetup.success.continueSetup`):e.warning?f(`tabs.chat`):f(`modelSetup.success.openChat`);return b`
    <zero-modal-dialog label=${c} description=${l} @modal-cancel=${n}>
      <section class="model-setup-success" role="status">
        <div
          class=${`model-setup-success__icon${o?` model-setup-success__icon--provider`:``}`}
          aria-hidden="true"
        >
          ${o?b`
                  ${A(o,{className:`model-setup-success__provider-icon`})}
                  <span class="model-setup-success__status-badge">${m.check}</span>
                `:m.shieldCheck}
        </div>
        <div class="model-setup-success__copy">
          <h2>${c}</h2>
          ${e.warning?v:b`<p>${l}</p>`}
        </div>
        ${e.warning?b`<div class="model-setup-success__warning">${e.warning}</div>`:v}
        <div class="model-setup-success__summary">
          <span>${f(s?`modelSetup.utility.model`:`modelSetup.success.activeModel`)}</span>
          <strong>${e.modelRef}</strong>
          ${e.latencyMs===void 0?v:b`<span>
                  ${f(`modelSetup.success.latency`,{latencyMs:String(e.latencyMs)})}
                </span>`}
        </div>
        <footer class="model-setup-success__actions">
          ${i&&!s?v:b`<button type="button" class="btn" @click=${n}>
                  ${f(`modelSetup.success.stayHere`)}
                </button>`}
          <button type="button" class="btn primary" autofocus @click=${t}>
            ${i&&!s?v:m.messageSquare} ${u}
          </button>
        </footer>
      </section>
    </zero-modal-dialog>
  `}function Xt(){return(Xt=e((()=>{x(),p(),oe(),k(),a(),I(),F()})))()}function Zt(e,t){let n=t.recommendedInstalls??[];return e.nativeModels?.count||t.candidates.length>0||(t.authOptions?.length??0)>0||n.length===0?v:b`
    <section class="settings-section model-setup__empty">
      <div class="settings-section__header">
        <h2>${f(`modelSetup.empty.title`)}</h2>
      </div>
      <p class="muted">${f(`modelSetup.empty.intro`)}</p>
      <div class="model-setup__recommendations">
        ${n.map(t=>b`
            <div class="model-setup__recommendation" data-recommended-install=${t.id}>
              ${W(e,t,`model-setup__icon--recommendation`)}
              <div class="model-setup__row-main">
                <strong>${t.label}</strong>
                <div class="muted">${t.hint}</div>
                <a href=${t.website} target="_blank" rel="noopener">${t.website}</a>
              </div>
            </div>
          `)}
      </div>
    </section>
  `}function Qt(e,t){let n=`kind`in t,r=n?t.groupLabel:void 0;return b`
    <div
      class="model-setup__row"
      data-auth-choice=${n?t.id:v}
      data-prepare-choice=${n?v:t.id}
    >
      <div class="model-setup__provider-copy">
        ${W(e,t)}
        <div>
          <strong>${t.label}</strong>
          ${r?b`<div class="muted">${r}</div>`:v}
          ${t.hint?b`<div class="muted">${t.hint}</div>`:v}
        </div>
      </div>
      <button
        type="button"
        class="btn"
        ?disabled=${e.actionsDisabled||e.detecting}
        @click=${()=>n?e.onStartAuth(t):e.onStartPrepare(t)}
      >
        ${n?f(t.kind===`install`?`modelSetup.signIn.install`:t.kind===`custom`?`modelSetup.signIn.custom`:`modelSetup.signIn.verify`):t.actionLabel??f(`modelSetup.prepare.ollamaButton`)}
      </button>
    </div>
  `}function $t(e,t){let n=(t.authOptions??[]).filter(t=>!e.embedded||!e.credentialChoices?.includes(t.id)).toSorted((e,t)=>e.label.localeCompare(t.label));if(n.length===0)return v;let r=n.filter(e=>e.featured||e.kind===`install`||e.kind===`custom`),i=n.filter(e=>!r.includes(e)),a=t=>Qt(e,t);return b`
    <section class="settings-section">
      <div class="settings-section__header">
        <h2>${f(`modelSetup.signIn.title`)}</h2>
        <p>${f(`modelSetup.signIn.description`)}</p>
      </div>
      <div class="model-setup__rows">${r.map(a)}</div>
      ${i.length?b`<details
              class="model-setup__more"
              .open=${e.moreSignInOpen}
              @toggle=${t=>e.onMoreSignInToggle(t.currentTarget.open)}
            >
              <summary>${f(`modelSetup.signIn.more`)}</summary>
              <div class="model-setup__rows">${i.map(a)}</div>
            </details>`:v}
    </section>
  `}function en(e,t){if(!e.canPrepare)return v;let n=Ct(t);return n.length===0?v:b`
    <section class="settings-section">
      <div class="settings-section__header">
        <h2>${f(`modelSetup.prepare.title`)}</h2>
      </div>
      <p class="muted">${f(`modelSetup.prepare.intro`)}</p>
      <div class="model-setup__rows">
        ${n.map(t=>Qt(e,t))}
      </div>
    </section>
  `}function tn(e,t){let n=e.embedded?t.manualProviders.filter(t=>!e.credentialChoices?.includes(t.id)):t.manualProviders;if(n.length===0&&e.embedded)return v;let r=n.find(t=>t.id===e.manualProviderId),i=`manual:${e.manualProviderId}`,a=e.embedded?`model-discovery-manual`:`model-setup-manual`,o=e.activation.phase===`testing`&&e.activation.targetId===i;return b`
    <section class="settings-section">
      <div class="settings-section__header">
        <h2>${f(`modelSetup.manual.title`)}</h2>
      </div>
      <div class="model-setup__manual">
        <div class="field">
          <span>${f(`modelSetup.manual.provider`)}</span>
          ${jt(e,{manualProviders:n},r)}
        </div>
        <label class="field">
          <span>
            ${r?f(`modelSetup.manual.accessValueFor`,{provider:J(r)}):f(`modelSetup.manual.accessValue`)}
          </span>
          <input
            class="input"
            type="password"
            autocomplete="off"
            required
            aria-invalid=${e.manualError?`true`:v}
            aria-describedby=${`${a}-help${e.manualError?` ${a}-error`:``}`}
            .value=${e.manualApiKey}
            ?disabled=${e.actionsDisabled}
            placeholder=${f(`modelSetup.manual.accessValuePlaceholder`)}
            @input=${t=>e.onManualApiKeyChange(t.currentTarget.value)}
          />
        </label>
        <div id=${`${a}-help`} class="model-setup__manual-help">
          ${m.shieldCheck}
          <span>${f(`modelSetup.manual.verifyHint`)}</span>
        </div>
        ${e.manualError?b`<div id=${`${a}-error`} class="callout danger" role="alert">
                ${e.manualError}
              </div>`:v}
        <button
          type="button"
          class="btn primary"
          ?disabled=${e.actionsDisabled||e.detecting||!e.manualProviderId}
          @click=${e.onManualConnect}
        >
          ${f(o?`modelSetup.candidates.testingButton`:e.embedded?`modelSetup.discovery.connectForAgent`:`modelSetup.manual.connectAndVerify`)}
        </button>
      </div>
    </section>
  `}function nn(e){e.querySelector(`.model-setup > .model-setup__testing, .model-setup > .model-setup__failure`)?.scrollIntoView?.({block:`nearest`,behavior:`auto`})}function rn(e,t){return t.nativeSessionCatalogPreferenceRequired!==!0||!t.nativeSessionCatalogs?.length?v:b`
    <section class="settings-section model-setup__native-discovery">
      <div class="settings-section__header"><h2>${f(`modelSetup.nativeDiscovery.title`)}</h2></div>
      <p class="muted">${f(`modelSetup.nativeDiscovery.body`)}</p>
      <p>${t.nativeSessionCatalogs.map(e=>e.label).join(`, `)}</p>
      <label>
        <input
          type="checkbox"
          .checked=${e.nativeSessionCatalogsEnabled===!0}
          ?disabled=${e.actionsDisabled}
          @change=${t=>{let n=t.currentTarget;e.onNativeSessionCatalogsChange?.(n.checked)}}
        />
        ${f(`modelSetup.nativeDiscovery.enable`)}
      </label>
      <p class="muted">${f(`modelSetup.nativeDiscovery.decline`)}</p>
    </section>
  `}function an(e){return b`<div class="callout warning" role="note">
    ${f(e?`modelSetup.access.gatewayTooOld`:`modelSetup.access.adminRequired`)}
  </div>`}function on(e,t){let n=e.firstRun&&t.setupComplete&&e.activation.phase!==`success`?e.onOpenChat:void 0,r=!e.embedded&&t.configuredModel?Ht({result:t,verify:e.verify.phase===`ok`&&e.verify.modelTarget===`utility`?{phase:`idle`}:e.verify,canVerify:e.canVerify,actionsDisabled:e.actionsDisabled||e.detecting===!0,onVerify:e.onVerify,onContinue:n}):v,i=b`${r}${Vt({result:t,activation:e.activation,canRepair:e.canAdmin&&!e.gatewayTooOld,actionsDisabled:e.actionsDisabled||e.detecting===!0,onOpenAssistant:e.onOpenSetupAssistant??e.onOpenChat,onActivateCandidate:e.onActivateCandidate})}`;return!e.canAdmin||e.gatewayTooOld?b`${i}${an(e.canAdmin)}`:b`
    ${i} ${rn(e,t)} ${Zt(e,t)}
    ${e.nativeModels?.render()} ${zt(e,t)}
    ${en(e,t)} ${$t(e,t)} ${tn(e,t)}
  `}function sn(e){let t;e.page.phase===`ready`?t=on({...e,actionsDisabled:e.actionsDisabled||e.activationUnresolved===!0},e.page.result):!e.canAdmin||e.gatewayTooOld?t=an(e.canAdmin):e.page.phase===`loading`?t=e.embedded?b`<div class="model-setup__loading" role="status">${f(`modelSetup.loading`)}</div>`:qt(e.modelConfigured===!0):e.page.phase===`detect-error`&&(t=b`
      <div class="callout danger" role="alert">${e.page.message}</div>
      <button type="button" class="btn" ?disabled=${e.detecting} @click=${e.onDetect}>
        ${f(`modelSetup.retry`)}
      </button>
    `);let n=b`
    <div
      class="model-setup"
      aria-busy=${e.detecting||e.page.phase===`loading`?`true`:`false`}
    >
      <div class="model-setup__intro">
        <div>
          ${e.embedded?b`<h2>${f(`modelSetup.discovery.title`)}</h2>
                  <p>
                    ${f(`modelSetup.discovery.description`,{agent:e.agentLabel??``})}
                  </p>`:b`<h1>${f(`modelSetup.heading`)}</h1>
                  <p>${f(`modelSetup.intro`)}</p>`}
        </div>
        ${e.connection?at(e.connection,!0):v}
        ${e.page.phase===`ready`&&(e.embedded||!e.page.result.configuredModel)&&e.activation.phase!==`success`&&e.canAdmin&&!e.gatewayTooOld?b`<button
                type="button"
                class="btn"
                ?disabled=${e.actionsDisabled||e.detecting}
                @click=${e.onDetect}
              >
                ${e.detecting?f(`modelSetup.verify.checkingButton`):f(`modelSetup.checkAgain`)}
              </button>`:v}
      </div>
      ${e.canAdmin&&!e.gatewayTooOld?Ut(e.activation):v}
      ${e.refreshWarning?b`<div class="callout warning" role="alert">${e.refreshWarning}</div>`:v}
      ${e.activationUnresolved&&!e.actionsDisabled&&e.activation.phase!==`success`?b`<div class="model-setup__recovery">
              <p>${f(`modelSetup.recovery.unknown`)}</p>
              ${e.page.phase===`ready`&&(e.page.result.configuredModel||e.page.result.setupModel)&&e.canVerify&&e.onUseCurrentModel?b`<button
                      type="button"
                      class="btn primary"
                      @click=${e.onUseCurrentModel}
                    >
                      ${f(`modelSetup.recovery.useCurrent`)}
                    </button>`:v}
              <button type="button" class="btn" @click=${e.onDetect}>
                ${f(`modelSetup.checkAgain`)}
              </button>
            </div>`:v}
      ${rt(e.connection?.loginMessage)}
      ${e.detectionError?b`<div class="callout warning" role="alert">${e.detectionError}</div>`:v}
      ${e.detecting&&e.page.phase===`ready`?b`<div class="muted" role="status">${f(`modelSetup.loading`)}</div>`:v}
      ${t}
    </div>
  `,r=b`
    ${e.connection?.login}
    <div @modal-cancel=${e=>e.preventDefault()}>
      ${$e({mode:e.wizardMode,state:e.wizard,refreshWarning:e.refreshWarning,cancellationNotice:e.cancellationNotice,value:e.wizardValue,onValueChange:e.onWizardValueChange,onAnswer:e.onWizardAnswer,onCancel:e.onWizardCancel,onClose:e.onWizardClose})}
    </div>
    ${e.activation.phase===`success`?Yt(e.activation,e.activation.modelTarget===`utility`?e.onOpenSetupAssistant??e.onOpenChat:e.onOpenChat,e.onSuccessClose,e.firstRun,e.embedded):v}
  `;if(e.embedded){let t=e.wizard.phase!==`idle`||e.activation.phase===`success`;return b`
      ${Ft(t?v:b`<zero-modal-dialog
              label=${f(`modelSetup.discovery.title`)}
              @modal-cancel=${()=>e.onClose?.()}
              @wa-after-show=${t=>t.target===t.currentTarget?e.onDiscoveryShown?.():void 0}
            >
              <div class="model-setup-wizard model-setup-discovery">
                <div class="model-setup-wizard__body">${n}</div>
                <div class="model-setup-wizard__footer">
                  <button class="btn" @click=${()=>e.onClose?.()}>
                    ${f(`common.close`)}
                  </button>
                </div>
              </div>
            </zero-modal-dialog>`)}
      ${r}
    `}return b`
    <section class="content-header" ${se({toolbarHeader:!0})}>
      <div>
        <div class="page-title">${re(`model-setup`)}</div>
        <div class="page-subtitle">
          ${ce(`model-setup`)} ${Me(cn)}
        </div>
      </div>
    </section>
    ${Ie(n)} ${r}
  `}var cn;function ln(){return(ln=e((()=>{x(),Lt(),te(),ae(),p(),ke(),Pe(),a(),I(),ot(),Bt(),Kt(),Jt(),G(),Y(),Xt(),et(),F(),cn=`http://127.0.0.1:18789/concepts/model-providers`})))()}var $;function un(){return(un=e((()=>{Ee(),ye(),ne(),h(),a(),Se(),u(),i(),r(),it(),ht(),G(),H(),K(),Y(),Pt(),P(),ln(),nt(),$=class extends l{constructor(...e){super(...e),this.actionsDisabled=()=>this.login.busy||this.nativeModels.saving||this.activationState.phase===`testing`||this.verifyState.phase===`checking`||this.wizardMutationActive||this.wizardState.phase!==`idle`&&this.wizardState.phase!==`error`&&this.wizardState.phase!==`cancelled`,this.embedded=!1,this.agentLabel=``,this.credentialChoices=[],this.pageState={phase:`loading`},this.activationState={phase:`idle`},this.verifyState={phase:`idle`},this.wizardState={phase:`idle`},this.wizardMode=`auth`,this.wizardDraft={stepId:null,value:void 0},this.manualProviderId=``,this.manualApiKey=``,this.manualError=null,this.moreSignInOpen=!1,this.nativeSessionCatalogsEnabled=!1,this.iconUrls={},this.setupRefreshWarning=null,this.detectionError=null,this.detectionRequest=null,this.cancellationNotice=null,this.observedConnection=null,this.pendingPrepareOption=null,this.wizardMutationGeneration=0,this.wizardMutationActive=!1,this.wizardReturnFocus=null,this.firstRun=new mt({context:()=>this.context,routeData:()=>this.routeData,pageState:()=>this.pageState,activationState:()=>this.activationState,actionsDisabled:()=>this.actionsDisabled()||this.detectionRequest!==null,canUseSetup:e=>this.canUseSetup(e),canVerify:e=>this.canVerify(e),verify:e=>this.verifyConnection(e).then(()=>this.verifyTask.value),setVerifyState:e=>this.verifyState=e,setActivationState:e=>this.activationState=e,setRefreshWarning:e=>this.setupRefreshWarning=e,resumeWizard:(e,t)=>{this.wizard.restore(e,t),this.runWizardMutation(()=>this.wizard.resume())},closeWizard:()=>this.closeWizard(),notify:()=>this.requestUpdate()}),this.nativeModels=new bt(this,{getContext:()=>this.context,getConnection:()=>this.observedConnection,canUseSetup:e=>this.canUseSetup(e),blocked:()=>this.activationBlocked,onSelected:()=>this.embedded?this.onClose?.():this.context.navigate(`chat`)}),this.iconLoader=_t(()=>this.context,()=>this.pageState,e=>this.iconUrls=e),this.login=new st(this,{getScope:()=>({context:this.context,agentId:this.agentSelection.state.selectedId}),getManualProviders:()=>this.pageState.phase===`ready`?this.pageState.result.manualProviders:[],onManualProvider:e=>{this.selectManualProvider(e),Et(this.renderRoot)},canStart:()=>this.canUseSetup(this.context.gateway.snapshot.client)&&!this.firstRun.unresolved&&!this.actionsDisabled(),canContinue:()=>this.canUseSetup(this.context.gateway.snapshot.client)&&!this.firstRun.unresolved,refresh:()=>this.detect()}),this.subscriptions=new n(this).watchStore(()=>this.context?.gateway,e=>this.synchronizeGateway(e.snapshot)).watchStore(()=>this.context&&this.agentSelection,()=>this.synchronizeGateway(this.context.gateway.snapshot)).watchStore(()=>this.firstRun),this.wizard=new tt({getClient:()=>this.context?.gateway.snapshot.client??null,getAgentId:()=>this.agentSelection.state.selectedId??null,onChange:e=>{e.phase!==`starting`&&e.phase!==`done`&&(this.activationState={phase:`idle`}),this.wizardState=e.phase===`step`&&this.wizardMutationActive?{...e,busy:!0}:e,this.wizardDraft=Ge(this.wizardDraft,e),e.phase===`idle`&&(this.cancellationNotice=null)},onStart:(e,t)=>e===`zero.setup.prepare.start`?void 0:this.firstRun.observeActivation(this.firstRun.beginActivation(t??{kind:`provider-auth`})),onBackgroundCompletion:e=>this.runWizardMutation(()=>Promise.resolve(e),!0),onSessionMissing:()=>{this.firstRun.wizardMissing(),this.detect()},requestFailedMessage:()=>f(`modelSetup.errors.requestFailed`),cancelledMessage:()=>f(`modelSetup.wizard.cancelled`),sessionExpiredMessage:()=>f(`modelSetup.wizard.sessionExpired`),gatewayNotRespondingMessage:()=>f(`modelSetup.wizard.gatewayNotResponding`)}),this.detectTask=Mt(this,{getHello:()=>this.context.gateway.snapshot.hello,onComplete:e=>{if(this.detectionRequest===e.token&&this.context.gateway.snapshot.client===e.client&&this.context.gateway.snapshot.hello===e.hello&&this.agentSelection.state.selectedId===e.agentId){if(this.detectionRequest=null,`error`in e){let t=B(e.error);this.pageState.phase===`ready`?this.detectionError=t:(this.firstRun.setReadyConnection(null),this.pageState={phase:`detect-error`,message:t});return}this.detectionError=null,this.firstRun.setReadyConnection({client:e.client,hello:e.hello,agentId:e.agentId}),this.pageState={phase:`ready`,result:e.value},this.firstRun.reconcileMissingWizard(e.value),e.value.manualProviders.some(e=>e.id===this.manualProviderId)||(this.manualProviderId=``)}}}),this.verifyTask=Nt(this)}get agentSelection(){return U(this.context,this.routeData?.firstRun===!0)}disconnectedCallback(){this.firstRun.dispose(),this.resetActivity(),this.observedConnection=null,this.nativeModels.reset(),this.subscriptions.clear(),super.disconnectedCallback()}willUpdate(){this.synchronizeGateway(this.context.gateway.snapshot)}updated(e){this.isConnected&&(e.has(`activationState`)&&this.activationState.phase!==`idle`&&nn(this.renderRoot),this.wizardState.phase!==`idle`&&this.querySelector(`zero-modal-dialog`)?.setReturnFocusTarget(this.wizardReturnFocus),this.iconLoader.reconcile(),this.firstRun.start())}synchronizeGateway(e){let t=this.routeData;if(!this.isConnected||!t)return;let n=this.observedConnection,r=pt(n,dt(this.context,t.firstRun,n?.recoveryScope));if(r.kind===`unchanged`)return;let i=r.connection;this.observedConnection=i,this.nativeModels.reset();let a=e.phase!==`connected`&&this.wizardMode===`auth`?f(`modelSetup.wizard.gatewayReconnecting`):void 0;if(r.kind===`pending`){this.wizard.hasAdmittedSession||(this.pageState={phase:`loading`}),this.wizard.suspend(a);return}let{authenticatedOwnerLost:o,ownerChanged:s}=ft(n,i),c=i.connected&&!g(e.hello?.auth??null);if((o||c)&&this.wizard.close({retireOwner:!0}),s&&(this.nativeSessionCatalogsEnabled=!1,this.manualProviderId=``,this.manualApiKey=``,this.manualError=null),n&&i.recoveryScope&&!s&&this.wizard.hasAdmittedSession){this.retireWizardMutation(),this.wizard.suspend(a),this.canUseSetup(i.client)&&(this.firstRun.reconnectActivation(i),this.runWizardMutation(()=>this.wizard.resume()));return}i.firstRun===n?.firstRun?this.firstRun.connectionChanged(i):this.firstRun.routeChanged(),this.resetActivity(),this.pageState={phase:`loading`},this.canUseSetup(i.client)&&this.detect()}resetActivity(){this.login.reset(),this.detectionRequest=null,this.detectionError=null,this.retireWizardMutation(),this.detectTask.run([null,null,null]),this.activationState={phase:`idle`},this.resetVerify(),this.iconLoader.reset(),this.pendingPrepareOption=null,this.wizard.cancel()}canUseSetup(e){let t=this.context.gateway.snapshot;return!(!e||this.routeData?.firstRun!==!0&&this.agentSelection.state.selectedId===null||t.phase!==`connected`||!g(t.hello?.auth??null)||w(t,`zero.setup.detect`)!==!0)}async detect(){let e=this.context.gateway.snapshot.client;if(!this.canUseSetup(e)||this.detectionRequest)return null;this.resetVerify(),this.detectionError=null,this.pageState.phase!==`ready`&&(this.pageState={phase:`loading`});let t={};this.detectionRequest=t,await this.detectTask.run([e,this.agentSelection.state.selectedId,t]);let n=this.detectTask.value;return n?.token===t&&`value`in n?n.value:null}canVerify(e){return this.canUseSetup(e)&&w(this.context.gateway.snapshot,`zero.setup.verify`)===!0}resetVerify(){this.verifyState={phase:`idle`},this.verifyTask.run([null,null,void 0])}async verifyConnection(e){let t=this.context.gateway.snapshot.client;!this.canVerify(t)||this.actionsDisabled()||this.detectionRequest||(this.verifyState={phase:`checking`},await this.verifyTask.run([t,this.agentSelection.state.selectedId,e]))}get activationBlocked(){return this.actionsDisabled()||this.detectionRequest!==null||this.firstRun.unresolved}async activate(e,t){let n=this.context.gateway.snapshot.client;this.canUseSetup(n)&&!this.activationBlocked&&(this.manualError=null,this.activationState={phase:`testing`,targetId:t},this.pendingPrepareOption=null,this.wizardMode=`activate`,await this.runWizardMutation(()=>this.wizard.activate({...e,...this.nativeSessionCatalogPreference()},t)))}nativeSessionCatalogPreference(){return this.pageState.phase===`ready`&&this.pageState.result.nativeSessionCatalogPreferenceRequired===!0?{nativeSessionCatalogsEnabled:this.nativeSessionCatalogsEnabled}:{}}connectManual(){let e=Tt(this.pageState.phase===`ready`?this.pageState.result.manualProviders:[],this.manualProviderId,this.manualApiKey);if(!e){this.manualError=f(`modelSetup.manual.required`);return}this.activate(e,`manual:${this.manualProviderId}`)}selectManualProvider(e){e!==this.manualProviderId&&(this.manualApiKey=``),this.manualProviderId=e,this.manualError=null}async handleWizardDone({startMethod:e,preparedModelRef:t,activationTargetId:n,modelActivation:r,isCurrent:i}){let a=e===`zero.setup.prepare.start`?this.pendingPrepareOption:null,o=this.nativeSessionCatalogPreference();if(this.pendingPrepareOption=null,e!==`zero.setup.prepare.start`){if(i?.()===!1){this.wizard.close();return}if(!r){this.wizard.fail(f(e===`zero.setup.activate.start`?`modelSetup.errors.activationFailed`:`modelSetup.wizard.notComplete`));return}this.wizard.close();let t={ok:!0,...r},a=n??`provider-auth`;this.activationState=We({result:t,targetId:a,fallbackError:f(`modelSetup.errors.activationFailed`),restartWarning:f(`labsPage.restartRequired`),refreshWarning:this.setupRefreshWarning}),this.activationState.phase===`success`&&(this.manualApiKey=``),this.firstRun.finishActivation(t,a,this.setupRefreshWarning);return}let s;if(a&&t)s=St(a,t);else{let e=await this.detect();if(!e){this.wizard.fail(f(`modelSetup.errors.requestFailed`));return}if(a){this.pageState=Ye(e,a.modelTarget);let t=wt(e,a.id);if(!t){this.wizard.fail(f(`modelSetup.prepare.providerNotReady`,{provider:a.label}));return}s=xt(t)}}this.wizard.close(),s&&this.activate({...s,...o},N(s.kind,s.modelRef))}retireWizardMutation(){this.wizardMutationGeneration+=1,this.wizardMutationActive=!1}closeWizard(){this.retireWizardMutation(),this.pendingPrepareOption=null,this.wizard.close()}async runWizardMutation(e,t=!1){let n=this.context.gateway.snapshot.client;if((this.wizardMutationActive||this.detectionRequest!==null)&&!t||!this.canUseSetup(n)||this.wizard.state.phase===`idle`&&this.firstRun.unresolved)return;if(this.wizard.state.phase===`idle`){let e=this.ownerDocument.activeElement;this.wizardReturnFocus=e instanceof HTMLElement&&this.contains(e)?e:null}let r=++this.wizardMutationGeneration;this.wizardMutationActive=!0,this.requestUpdate();try{let t=await this.context.runtimeConfig.runExternalMutation(async t=>{if(t!==n)throw Error(`Connection changed before model setup continued.`);return await e()},{canDispatch:()=>r===this.wizardMutationGeneration&&this.context.gateway.snapshot.client===n&&this.canUseSetup(n),dispatchError:f(`modelSetup.errors.requestFailed`)});if(r!==this.wizardMutationGeneration){t.ok&&!t.refresh.ok&&this.isConnected&&(this.setupRefreshWarning=t.refresh.error),this.isConnected&&this.canUseSetup(this.context.gateway.snapshot.client)&&this.detect();return}if(!t.ok){this.wizard.fail(t.error);return}this.setupRefreshWarning=t.refresh.ok?null:t.refresh.error;let i=t.value;i?(this.wizardMutationActive=!1,await this.handleWizardDone(i)):this.wizardState.phase===`step`&&this.wizardState.busy&&(this.wizardState={...this.wizardState,busy:!1})}catch(e){r===this.wizardMutationGeneration&&this.wizard.fail(B(e))}finally{r===this.wizardMutationGeneration&&(this.wizardMutationActive=!1,this.requestUpdate())}}async cancelWizard(){let e=this.wizardMutationGeneration;this.cancellationNotice=null;try{let t=await this.wizard.requestCancellation();if(e!==this.wizardMutationGeneration)return;if(t===`running`){this.cancellationNotice=f(`modelSetup.wizard.finishingStep`);return}if(t!==`cancelled`)return;this.retireWizardMutation(),this.pendingPrepareOption=null,this.activationState={phase:`idle`}}catch(t){e===this.wizardMutationGeneration&&(this.wizardState.phase===`starting`||this.wizardState.phase===`step`)&&(this.cancellationNotice=f(`modelSetup.wizard.cancelFailed`,{error:B(t)}))}}render(){let e=this.context.gateway.snapshot,t=g(e.hello?.auth??null),n=e.phase===`connected`&&w(e,`zero.setup.detect`)!==!0;return sn({detecting:this.detectionRequest!==null,detectionError:this.detectionError,embedded:this.embedded,agentLabel:this.agentLabel,credentialChoices:this.credentialChoices,onClose:this.onClose,onDiscoveryShown:()=>{this.wizardState.phase===`idle`&&(this.wizardReturnFocus?.focus({preventScroll:!0}),this.wizardReturnFocus=null)},page:this.firstRun.visiblePageState(this.verifyState.phase===`ok`&&this.verifyState.modelTarget!==`utility`),activation:this.activationState,verify:this.verifyState,connection:this.embedded?void 0:this.login.pageActions,wizard:this.wizardState,wizardMode:this.wizardMode,wizardValue:this.wizardDraft.value,canAdmin:t,canVerify:this.canVerify(e.client),canPrepare:this.canUseSetup(e.client)&&w(e,`zero.setup.prepare.start`)===!0,modelConfigured:o(e)?.modelConfigured===!0,gatewayTooOld:n,refreshWarning:this.setupRefreshWarning,cancellationNotice:this.cancellationNotice,activationUnresolved:this.firstRun.unresolved,onUseCurrentModel:this.firstRun.canUseCurrentModel?()=>void this.firstRun.useCurrentModel():void 0,actionsDisabled:this.actionsDisabled(),manualProviderId:this.manualProviderId,manualApiKey:this.manualApiKey,manualError:this.manualError,moreSignInOpen:this.moreSignInOpen,nativeSessionCatalogsEnabled:this.nativeSessionCatalogsEnabled,nativeModels:this.nativeModels,onNativeSessionCatalogsChange:e=>this.nativeSessionCatalogsEnabled=e,firstRun:this.routeData?.firstRun===!0,iconUrls:this.iconUrls,onDetect:()=>{!this.detectionRequest&&this.firstRun.retryDetection()&&this.detect()},onVerify:()=>void this.firstRun.verify(),onActivateCandidate:e=>void this.activate(xt(e),N(e.kind,e.modelRef)),onStartAuth:e=>{this.wizard.prepareSignIn(e.kind,e.label),this.pendingPrepareOption=null,this.wizardMode=`auth`,this.runWizardMutation(()=>this.wizard.start(e.id,`zero.setup.auth.start`,this.nativeSessionCatalogPreference(),e.modelTarget))},onStartPrepare:e=>{this.pendingPrepareOption=e,this.wizardMode=`prepare`,this.runWizardMutation(()=>this.wizard.start(e.id,`zero.setup.prepare.start`))},onManualProviderChange:e=>this.selectManualProvider(e),onManualApiKeyChange:e=>{this.manualApiKey=e,this.manualError=null},onManualConnect:()=>this.connectManual(),onMoreSignInToggle:e=>this.moreSignInOpen=e,onIconError:e=>this.iconLoader.invalidate(e),onOpenChat:()=>this.embedded?this.onClose?.():this.firstRun.continueSetup(),onOpenSetupAssistant:()=>this.firstRun.continueSetup(`utility`),onSuccessClose:()=>{if(this.embedded){this.onClose?.();return}this.activationState={phase:`idle`},this.detect()},onWizardValueChange:e=>this.wizardDraft={...this.wizardDraft,value:e},onWizardAnswer:(e,t)=>void this.runWizardMutation(()=>this.wizard.answer(e,t)),onWizardCancel:()=>void this.cancelWizard(),onWizardClose:()=>this.closeWizard()})}},T([Te({context:ie,subscribe:!0})],$.prototype,`context`,void 0),T([S({attribute:!1})],$.prototype,`routeData`,void 0),T([S({type:Boolean})],$.prototype,`embedded`,void 0),T([S()],$.prototype,`agentLabel`,void 0),T([S({attribute:!1})],$.prototype,`credentialChoices`,void 0),T([S({attribute:!1})],$.prototype,`onClose`,void 0),T([C()],$.prototype,`pageState`,void 0),T([C()],$.prototype,`activationState`,void 0),T([C()],$.prototype,`verifyState`,void 0),T([C()],$.prototype,`wizardState`,void 0),T([C()],$.prototype,`wizardMode`,void 0),T([C()],$.prototype,`wizardDraft`,void 0),T([C()],$.prototype,`manualProviderId`,void 0),T([C()],$.prototype,`manualApiKey`,void 0),T([C()],$.prototype,`manualError`,void 0),T([C()],$.prototype,`moreSignInOpen`,void 0),T([C()],$.prototype,`nativeSessionCatalogsEnabled`,void 0),T([C()],$.prototype,`iconUrls`,void 0),T([C()],$.prototype,`setupRefreshWarning`,void 0),T([C()],$.prototype,`detectionError`,void 0),T([C()],$.prototype,`detectionRequest`,void 0),T([C()],$.prototype,`cancellationNotice`,void 0),customElements.get(`zero-model-setup-page`)||customElements.define(`zero-model-setup-page`,$)})))()}un();export{$ as ModelSetupPage};
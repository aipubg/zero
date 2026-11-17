import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Cc as t,Dc as n,Gs as r,Ic as i,Js as a,Ku as o,Lc as s,Nu as c,Oc as l,Pu as u,Ul as d,Wc as f,Xc as p,bu as m,ju as ee,kc as te,kl as ne,qc as re,xu as ie,yu as ae,zu as h}from"./control-ui-core-DCNBgr3X.js";import{$n as oe,Ai as se,Ct as ce,Ei as le,No as ue,St as de,Ti as fe,ca as g,d as pe,ei as me,er as he,go as ge,ho as _e,ki as ve,l as ye,sa as _,u as be,ui as xe}from"./control-ui-core-DwX5Mpz4.js";import{G as v,J as y,W as b,Z as x,at as S,rt as Se}from"./lit-runtime-B40xFCK_.js";import{Sr as Ce,xr as we}from"./control-ui-boot-shared-BRtBCr5s.js";import{c as C,d as w,l as T,u as Te}from"./gateway-runtime-JSfC8ThO.js";import{Dt as Ee,Lr as De,Ot as Oe,bt as ke,wt as Ae,zr as je}from"./control-ui-boot-shared-BX8huZUb.js";import{Mo as E,Mt as Me,Ur as Ne,Wr as Pe,Zr as D,da as Fe,jt as Ie,ro as Le,uo as O,wa as k,ya as A}from"./ui-AaV6iNVa.js";import{$n as Re,Et as ze,Kt as Be,Tt as Ve,Ut as He,er as Ue,ir as We,nr as Ge,ot as Ke,rr as j,tr as M}from"./control-ui-boot-shared-ZuP0LiFD.js";import{i as qe,n as N,o as Je,r as P,t as Ye}from"./plugin-help-K2l4F8vd.js";import{Co as Xe,wo as Ze,xo as F,yo as Qe}from"./control-ui-boot-shared-CzJHozXQ.js";import{E as $e,T as et}from"./control-ui-boot-shared-D2GHitQ4.js";import"./control-ui-boot-shared-styles-BXPMRytW.js";import{r as tt,t as I}from"./chat/zero-alert-store-DMTYYmJp.js";import{o as nt,s as rt}from"./state-BajZM06-.js";import{dt as it,ft as at}from"./control-ui-boot-chat-D02HpoEK.js";import{r as ot,t as st}from"./wizard-step-controls-TPQ3zrjY.js";import{$n as ct,Cr as lt,Qn as ut,Sr as dt}from"./control-ui-boot-chat-DzIjAmFi.js";import{nt as ft,rt as pt}from"./control-ui-boot-chat-zkzP5WWm.js";import"./control-ui-boot-chat-Cx6CBnJr.js";import"./chat-transcript-styles-BN-TorbW.js";function mt(e){if(!k(e))return;let t=e.code;return t===L.INFERENCE_UNAVAILABLE?{code:t}:void 0}function ht(e){if(!k(e))return;let t=e.code;return t===L.SESSION_INVALIDATED?{code:t}:void 0}var L;function R(){return(R=e((()=>{L={INFERENCE_UNAVAILABLE:`system_agent_inference_unavailable`,SESSION_INVALIDATED:`system_agent_session_invalidated`}})))()}var z;function B(){return(B=e((()=>{t(),P(),z=class{constructor(){this.ordinary={value:``},this.sensitive={value:``},this.context=null,this.cleanup=null}connect(e,t){this.cleanup?.(),this.context=e,this.cleanup=n(e,t)}resetPrompt(e,t){this.sensitive={value:``},[e.wizardValue,e.wizardSecretVisible]=[void 0,!1],e.sensitive=t}get pluginReference(){return this.context?N(this.context):void 0}reconcile(e){if(!this.context||e.sensitive||e.wizardInputPending||e.hasUnresolvedQuestion())return;let t=Je(this.context);t&&(this.ordinary={value:[this.ordinary.value,t].filter(Boolean).join(`

`)})}}})))()}function gt(e,t,n){t===`chat`&&n===`utility`?e?.navigate(`model-setup`,{search:`?firstRun=1`}):e?.navigate(t)}async function _t(e){let{context:t}=e,n=t.gateway.snapshot.sessionKey?.trim();if(e.agentId){let r=await t.agents.refreshList();if(!e.isCurrent())return`stale`;n=Le({agentId:e.agentId,mainKey:r?.mainKey}),le({selection:t.agentSelection,gateway:t.gateway,sessionKey:n,agentId:e.agentId})}if(!n)return`exit-setup`;let r=p({face:`chat`,sessionKey:n,fallbackAgentId:re(t),basePath:t.basePath,mainKey:d({agentsList:t.agents.state.agentsList,hello:t.gateway.snapshot.hello}),focusComposer:!e.hatchDraft});return t.navigate(`chat`,{pathname:r.options.pathname,...e.hatchDraft?{search:`?draft=${encodeURIComponent(h(`custodian.hatchDraft`))}`}:r.options.search?{search:r.options.search}:{}}),window.dispatchEvent(new CustomEvent(me,{detail:{open:!1}})),`navigated`}function V(){return(V=e((()=>{fe(),xe(),u(),f(),ne()})))()}function H(){return`control-ui-onboarding-${Ie()}`}function vt(e){try{o()?.setItem(U,e)}catch{}}function yt(){let e=null;try{e=o()?.getItem(U)??null}catch{}if(e!==null&&e.length<=512&&e.trim().length>0)return{sessionId:e,restored:!0};let t=H();return vt(t),{sessionId:t,restored:!1}}var U;function bt(){return(bt=e((()=>{Me(),U=`zero.custodian.session.v1`})))()}function xt(e){if(!e||e.gateway.snapshot.phase!==`connected`)return`unresolved`;let t=e.agents.state.agentsList;if(!t)return`unresolved`;let n=O(e.gateway.snapshot.assistantAgentId??t.defaultId??``),r=t.agents.find(e=>O(e.id)===n);return r?r.model?.primary?.trim()?`ready`:r.utilityModel?.trim()?`utility`:`required`:`unresolved`}function St(){return(St=e((()=>{ne()})))()}function Ct(e,t){if(e.type===`note`||e.type===`action`||e.type===`progress`)return{answer:{stepId:e.id},display:h(`common.continue`)};let n={stepId:e.id,value:t};if(e.type===`text`)return typeof t==`string`?{answer:n,display:t}:null;if(e.type===`confirm`)return typeof t==`boolean`?{answer:n,display:h(t?`common.yes`:`common.no`)}:null;let r=t=>e.options?.find(e=>Object.is(e.value,t));if(e.type===`select`){let e=r(t);return e?{answer:n,display:e.label}:null}if(!Array.isArray(t))return null;let i=t.map(e=>r(e)?.label);return i.every(e=>e!==void 0)?{answer:t.length?n:{...n,value:[]},display:i.length?i.join(`, `):h(`common.none`)}:null}function wt(e){return Te(e?.gateway.snapshot??{},we.SYSTEM_AGENT_WIZARD_CANCEL)??!1}function Tt(){return(Tt=e((()=>{Ce(),u(),T()})))()}async function Et(e,t){let n=e.eventNudge;if(!n||e.sensitive||e.hasUnresolvedQuestion())return;e.eventNudgePending=n,t();let r=await e.send(n.message);if(e.eventNudgePending===n){e.eventNudgePending=null;let i=r!==`rejected`&&e.eventNudge!==null&&e.eventNudge.severity===n.severity&&e.eventNudge.message===n.message;[e.eventNudgeClosed,e.eventNudge]=[i,i?null:e.eventNudge],t()}}function Dt(e,t){return t===`received`?`sent`:e instanceof oe||t===`unsent`?`rejected`:`unknown`}function Ot(e,t){return t===`sent`?!1:t===`unknown`||e}function kt(e){if(e.kind===`config-reload`)return h(`custodian.nudge.configReload`);let t=e.channelLabel??h(`custodian.nudge.channelFallback`);return e.kind===`channel-auth`?h(`custodian.nudge.channelAuth`,{channel:t}):e.kind===`channel-disconnected`?h(`custodian.nudge.channelDisconnected`,{channel:t}):h(`custodian.nudge.channelDegraded`,{channel:t})}function At(e,t){return y`<button
    class="custodian__nudge-dismiss"
    type="button"
    aria-label=${h(e)}
    @click=${t}
  >
    ${_.x}
  </button>`}function jt(e){return y`<div class="custodian__nudge" role="status">
    <button
      class="custodian__nudge-action"
      type="button"
      ?disabled=${e.disabled}
      @click=${e.onSend}
    >
      ${kt(e.nudge)}
    </button>
    ${At(`custodian.nudge.dismiss`,e.onDismiss)}
  </div>`}function Mt(e){return y`<div
    class="custodian__nudge custodian__nudge--channel-onboarding"
    role=${e.error?`alert`:`status`}
  >
    <div class="custodian__nudge-copy">
      <strong
        >${h(e.error?`custodian.nudge.channelStatusErrorTitle`:`custodian.nudge.channelSetupTitle`)}</strong
      >
      <span
        >${h(e.error?`custodian.nudge.channelStatusErrorBody`:`custodian.nudge.channelSetupBody`)}</span
      >
    </div>
    <button
      class="btn btn--sm primary custodian__nudge-cta"
      type="button"
      ?disabled=${e.error&&e.retrying}
      @click=${e.onAction}
    >
      ${h(e.error?e.retrying?`common.loading`:`common.retry`:`custodian.nudge.channelSetupAction`)}
    </button>
    ${At(`custodian.nudge.channelSetupDismiss`,e.onDismiss)}
  </div>`}function Nt(e,t,n){if(n.configured===!1||n.enabled===!1)return null;let r=e.toLowerCase();if(It.some(e=>n[e]===`configured_unavailable`))return{severity:3,kind:`channel-auth`,channelLabel:t,message:`what happened with ${r} authentication?`};let i={severity:3,kind:`channel-degraded`,channelLabel:t,message:`what happened with ${r}?`},a=typeof n.healthState==`string`?n.healthState.trim().toLowerCase():void 0;if(a===`terminal-disconnect`||A(n.probe)?.ok===!1)return i;if(a===`not-running`&&n.running===!1){let e=typeof n.reconnectAttempts==`number`?n.reconnectAttempts:0,t=typeof n.lastStartAt==`number`?n.lastStartAt:void 0,r=typeof n.lastStopAt==`number`?n.lastStopAt:void 0;if(n.restartPending===!1&&r!==void 0&&(t===void 0||r>=t)&&e<10)return null}return n.connected!==!0&&a!==`healthy`&&typeof n.lastError==`string`&&n.lastError.trim()?i:n.connected===!1&&n.running===!0?{...i,severity:2,kind:`channel-disconnected`}:a&&Ft.has(a)?{...i,severity:1}:null}function Pt(e){let t=A(e);if(!t)return null;if(A(t.configReload)?.hotReloadStatus===`disabled`)return{severity:3,kind:`config-reload`,message:`what happened with configuration reload?`};let n=A(t.channels);if(!n)return null;let r=A(t.channelLabels),i=null;for(let[e,t]of Object.entries(n)){let n=A(t);if(!n)continue;let a=typeof r?.[e]==`string`?r[e]:e,o=A(n.accounts),s=o?Object.values(o).map(A).filter(e=>e!==null):[],c=s.length>0?s:[n];for(let t of c){let n=Nt(e,a,t);n&&(!i||n.severity>i.severity)&&(i=n)}}return i}var Ft,It;function W(){return(W=e((()=>{b(),he(),g(),u(),Ft=new Set([`disconnected`,`stale-socket`,`stuck`,`terminal-disconnect`]),It=[`tokenStatus`,`botTokenStatus`,`appTokenStatus`,`signingSecretStatus`,`userTokenStatus`]})))()}function Lt(e,t){return e?`onboarding`:t?`new-agent`:`caretaker`}function Rt(e,t,n){let r=e===`caretaker`?{}:{welcomeVariant:e};if(t===void 0)return r;let i=window.location.pathname,a=ue(i,_e(i));return{...r,message:t,...a?{context:{page:a,...n?{plugin:n}:{}}}:{}}}function G(e){return e.message!==void 0||e.wizardAnswer!==void 0||e.wizardCancel!==void 0}function zt(e){let t=e&&typeof e==`object`?e.details:void 0;return{inferenceUnavailable:mt(t)!==void 0,sessionInvalidated:ht(t)!==void 0}}function K(){return(K=e((()=>{R(),ge()})))()}function Bt(){return(Bt=e((()=>{ut()})))()}var q;function Vt(){return(Vt=e((()=>{b(),x(),u(),q=class extends Fe{constructor(...e){super(...e),this.selectedValue=``,this.requestKey=``,this.focusPreselection=!1}createRenderRoot(){return this}willUpdate(){let e=this.props,t=e?JSON.stringify([e.header??``,e.question,e.options.map(e=>[e.value,e.label,e.recommended===!0])]):``;t!==this.requestKey&&(this.requestKey=t,this.selectedValue=e?.options.slice(0,4).find(e=>e.recommended)?.value??``,this.focusPreselection=!!this.selectedValue)}updated(){if(!this.focusPreselection||this.props?.disabled)return;this.focusPreselection=!1;let e=this.ownerDocument.activeElement;(!e||e===this.ownerDocument.body||this.contains(e))&&[...this.querySelectorAll(`.option-card__choice`)].find(e=>e.dataset.optionValue===this.selectedValue)?.focus({preventScroll:!0})}select(e){this.props?.disabled||(this.selectedValue=e,this.props?.onSelect?.(e),this.dispatchEvent(new CustomEvent(`option-select`,{bubbles:!0,composed:!0,detail:{value:e}})))}skip(){this.props?.disabled||(this.props?.onSkip?.(),this.dispatchEvent(new CustomEvent(`option-skip`,{bubbles:!0,composed:!0})))}render(){let e=this.props;if(!e)return v;let t=e.options.slice(0,4),n=t.findIndex(e=>e.recommended===!0);return y`
      <section class="option-card" role="group" aria-label=${e.question}>
        ${e.header?y`<div class="option-card__chip">${e.header}</div>`:v}
        <div class="option-card__question">${e.question}</div>
        <div class="option-card__choices" role="radiogroup">
          ${t.map((t,r)=>{let i=r===n,a=t.value===this.selectedValue;return y`
              <button
                class=${`option-card__choice ${i?`option-card__choice--recommended`:``} ${a?`option-card__choice--selected`:``}`}
                type="button"
                role="radio"
                aria-checked=${a?`true`:`false`}
                data-option-value=${t.value}
                ?disabled=${e.disabled}
                @click=${()=>this.select(t.value)}
              >
                <span class="option-card__choice-copy">
                  <strong>${t.label}</strong>
                  ${t.description?y`<span class="option-card__description">${t.description}</span>`:v}
                </span>
                ${i?y`<span class="option-card__recommended">
                        ${h(`optionCard.recommended`)}
                      </span>`:v}
              </button>
            `})}
        </div>
        <button
          class="option-card__skip"
          type="button"
          ?disabled=${e.disabled}
          @click=${()=>this.skip()}
        >
          ${h(`optionCard.skip`)}
        </button>
      </section>
    `}},D([S({attribute:!1})],q.prototype,`props`,void 0),D([Se()],q.prototype,`selectedValue`,void 0),customElements.get(`zero-option-card`)||customElements.define(`zero-option-card`,q)})))()}function Ht(e){if(!e||typeof e!=`object`)return null;let[t,n,r]=[e.id,e.header,e.question].map(E);if(!t||!n||!r||!Array.isArray(e.options)||e.options.length<2||e.options.length>4)return null;let i=[];for(let t of e.options){let e=E(t?.label);if(!e)return null;let[n,r]=[t.description,t.reply].map(E);i.push({label:e,...n?{description:n}:{},...t.recommended===!0?{recommended:!0}:{},...r?{reply:r}:{}})}return new Set(i.map(e=>e.label.toLocaleLowerCase())).size!==i.length||i.filter(e=>e.recommended).length>1?null:{id:t,header:n,question:r,options:i,isOther:e.isOther===!0,...e.skipAction===`exit`?{skipAction:`exit`}:{}}}function Ut(){return(Ut=e((()=>{})))()}function Wt(e,t,n,r=null,i=null){return{id:e,role:t,text:n,at:Date.now(),question:r,step:i}}function Gt(e,t){let n=t.step??null,r=n?null:Ht(t.question),i=Y.test(t.reply);return i&&!r&&!n?null:{...Wt(e,`assistant`,i?``:t.reply,r,n),optionalWelcome:t.optionalWelcome===!0}}function Kt(e,t,n,r,i){return r||i||e.some(e=>e.question!==null&&e.question.id!==`system-agent-quick-actions`&&!t.has(`${e.id}:${e.question.id}`)&&!n.has(`${e.id}:${e.question.id}`))}function qt(e,t){let n=new Set(t);for(let t of e)t.question&&n.add(`${t.id}:${t.question.id}`);return n}function J(e){return ae(e,h(`custodian.requestFailed`))}function Jt(e){let t=`msg-${e.id}`,n={role:e.role,content:e.text},r=je(n),i=Ae(n,r);return{kind:`group`,key:t,role:e.role,messages:[{message:n,key:t,hasVisibleContent:i===`non-text`||!!Oe(n,r).trim()}],visibleContent:i,timestamp:e.at,isStreaming:!1}}async function Yt(e){try{return{ok:!0,turns:(await e.request(`zero.chat.history`,{},{timeoutMs:Zt})).turns}}catch(e){return{ok:!1,error:e}}}function Xt(e){let t=e.message.question,n=e.message.step;return y`
    ${e.message.text?ct(Jt(e.message),{showReasoning:!1,showToolCalls:!1,assistantName:h(`custodian.title`),agentId:et}):v}
    ${e.message.id===e.boundaryAfterId?lt({kind:`divider`,key:`custodian-earlier`,label:h(`custodian.earlier`),timestamp:e.message.at}):v}
    ${e.showQuestion&&t?y`<div class="custodian__option-card">
            <zero-option-card
              .props=${{header:t.header,question:t.question,options:t.options.map(e=>({value:e.label,label:e.label,description:e.description,recommended:e.recommended})),disabled:e.questionDisabled,onSelect:e.onSelect,onSkip:e.onSkip}}
            ></zero-option-card>
          </div>`:v}
    ${e.showWizardStep&&n?y`<section
            class="custodian__wizard-step"
            aria-label=${m(n.title??n.message,`Setup`)}
          >
            ${n.title?y`<strong class="custodian__wizard-title"
                    >${m(n.title)}</strong
                  >`:v}
            ${ot({step:n,value:e.wizardValue,busy:e.wizardDisabled,inputId:`custodian-wizard-input-${e.message.id}`,sensitiveRevealed:e.wizardSecretVisible,onValueChange:e.onWizardValueChange,onAnswer:e.onWizardAnswer,leadingAction:e.showWizardCancel?y`<button
                    class="btn btn--ghost custodian__wizard-cancel"
                    type="button"
                    ?disabled=${e.wizardDisabled}
                    @click=${e.onWizardCancel}
                  >
                    ${h(`custodian.cancel`)}
                  </button>`:void 0,onToggleSensitiveVisibility:e.onToggleWizardSecretVisibility})}
          </section>`:v}
  `}var Zt,Y,Qt,$t;function X(){return(X=e((()=>{b(),$e(),j(),st(),u(),Ee(),De(),ke(),ie(),r(),T(),dt(),Bt(),Vt(),Ut(),Zt=15e3,Y=/^\s*NO_REPLY\s*$/,Qt=class{constructor(e,t){this.onStatusChange=e,this.getGatewaySnapshot=t,this.status=M(),this.generation=0,this.recoveryPending=!1,this.inFlight=null}get refreshing(){return this.inFlight!==null}get available(){let e=this.getGatewaySnapshot();return e!==void 0&&w(e,`zero.chat.history`)===!0}deferRecovery(){this.recoveryPending=!0}clearRecovery(){this.recoveryPending=!1}settleRecovery(e,t){this.recoveryPending&&!e&&(this.clearRecovery(),t())}watchAvailability(e){let t=this.getGatewaySnapshot();return()=>{let n=this.getGatewaySnapshot(),r=n&&a(n)&&(!t||!a(t));t=n,r&&this.recover(e)}}async recover(e){let t=this.generation;await this.inFlight?.promise;let n=this.getGatewaySnapshot();t===this.generation&&n&&a(n)&&(this.status.awaitingGateway||this.status.error!==null)&&e()}invalidate(){this.generation+=1,this.inFlight=null}reset(){this.clearRecovery(),this.invalidate(),this.status=M()}async read(e,t,n){let r=this.inFlight;if(r&&r.client===e&&r.epoch===t)return await r.promise,null;let i=++this.generation;this.status=Re(this.status,{clearError:!1});let a=Yt(e);this.inFlight={client:e,epoch:t,promise:a},this.onStatusChange();try{let e=await a;return!n()||i!==this.generation?null:(this.status=e.ok?Ue():Ge(this.status,e.error,this.getGatewaySnapshot()),e)}finally{this.inFlight?.promise===a&&(this.inFlight=null,this.onStatusChange())}}async loadMessages(e,t,n,r){this.clearRecovery();let i=await this.read(e,t,r);if(!i?.ok||!r())return null;let a=n;return{messages:i.turns.map(e=>({id:a++,role:e.role,text:e.role===`user`&&e.text===$t?h(`custodian.sensitiveReply`):e.text,at:e.at,question:null,step:null})),nextMessageId:a}}},$t=`<redacted secret>`})))()}var en,tn,Z;function Q(){return(Q=e((()=>{u(),T(),nt(),B(),V(),bt(),te(),St(),Tt(),W(),K(),X(),en=19e4,tn=class{constructor(){this.messages=[],this.sending=!1,this.sensitive=!1,this.wizardInputPending=!1,this.wizardSecretVisible=!1,this.questionReplyUncertain=!1,this.error=null,this.transcript=new Qt(()=>this.emit(),()=>this.context?.gateway.snapshot),this.dismissedQuestions=new Set,this.answeredQuestions=new Set,this.activeClient=null,this.chatAvailable=!1,this.eventNudge=null,this.eventNudgePending=null,this.eventNudgeClosed=!1,this.channelOnboardingNudgeClosed=!1,this.earlierBoundaryAfterId=null,this.abandonedTurnOutcomeUnknown=!1,this.inferenceState=`unverified`,this.inputDrafts=new z,this.context=null,this.variant=`caretaker`,this.sessionVariant=null,this.restoredIdentity=yt(),this.sessionId=this.restoredIdentity.sessionId,this.rejoinBarrierPending=this.restoredIdentity.restored,this.requestEpoch=0,this.requestAbort=null,this.nextMessageId=1,this.retryParams=null,this.sessionClient=null,this.sessionOwnershipKey=null,this.sessionOwner=new l,this.sessionStarted=!1,this.configuredInferenceState=`unresolved`,this.gatewayCleanup=null,this.agentCleanup=null,this.eventCleanup=null,this.listeners=new Set}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}connect(e,t){let n=this.context!==e;if(n||this.variant!==t){if(n){this.gatewayCleanup?.(),this.agentCleanup?.(),this.eventCleanup?.(),this.context=e,this.inputDrafts.connect(e,()=>this.emit());let t=this.transcript.watchAvailability(()=>void this.refreshTranscriptIfIdle());this.gatewayCleanup=e.gateway.subscribe(()=>{t(),this.synchronizeClient(),this.emit()}),this.agentCleanup=e.agents.subscribe(()=>{this.synchronizeClient(),this.emit()}),this.eventCleanup=e.gateway.subscribeEvents(e=>{this.variant!==`caretaker`||this.eventNudgeClosed||(e.event===`health`&&(this.eventNudge=Pt(e.payload)),this.emit())})}this.variant=t,this.synchronizeClient(),this.emit()}}get input(){return this.inputDrafts[this.sensitive?`sensitive`:`ordinary`].value}set input(e){this.inputDrafts[this.sensitive?`sensitive`:`ordinary`]={value:e}}setInput(e){this.input=e,this.emit()}setWizardValue(e){this.wizardValue=e,this.emit()}toggleWizardSecretVisibility(){this.wizardSecretVisible=!this.wizardSecretVisible,this.emit()}hasRealUserTurn(){return this.messages.some(e=>e.role===`user`)}get activeVariant(){return this.variant}hasUnresolvedQuestion(){return Kt(this.messages,this.dismissedQuestions,this.answeredQuestions,this.wizardInputPending,this.questionReplyUncertain)}get transcriptBlocked(){return this.sending||this.hasUnresolvedQuestion()||this.transcript.refreshing}async refreshTranscriptIfIdle(){let e=this.activeClient;if(e&&this.sessionStarted&&this.chatAvailable){if(this.transcriptBlocked){(this.transcript.status.awaitingGateway||this.transcript.status.error!==null)&&this.transcript.deferRecovery();return}await this.refreshTranscriptHistory(e,this.requestEpoch)&&this.abandonedTurnOutcomeUnknown&&(this.abandonedTurnOutcomeUnknown=!1,this.emit())}}canRetry(){return this.retryParams!==null&&!G(this.retryParams)}get setupRequired(){return this.configuredInferenceState===`required`}get canSend(){return this.activeClient!==null&&this.chatAvailable&&!this.sending&&(this.configuredInferenceState===`ready`||this.configuredInferenceState===`utility`)&&this.inferenceState===`ready`}get wizardCancelAvailable(){return wt(this.context)}retry(){let e=this.activeClient,t=this.retryParams;e&&t&&!G(t)&&this.chatAvailable&&!this.sending&&this.initializeSession(e,t,!1)}async send(e,t,n=this.hasUnresolvedQuestion(),r){let i=e??this.input,a=this.sensitive?i:i.trim(),o=this.activeClient;if(!a.trim()||!o||!this.canSend)return this.emit(),`rejected`;let s=this.sensitive?h(`custodian.sensitiveReply`):t??a,c={sessionId:this.sessionId,...Rt(this.variant,a,this.inputDrafts.pluginReference)};return await this.sendUserTurn(o,c,s,n,()=>r&&(!r.isCurrent()||!r.admit())?!1:(e===void 0&&(this.input=``),!0))}async sendUserTurn(e,t,n,r,i){let a=[this.answeredQuestions,this.questionReplyUncertain],o,s=await this.requestReply(e,t,()=>{let e=this.inputDrafts.ordinary;if(i&&!i())return!1;let t=this.inputDrafts.ordinary;this.inputDrafts.resetPrompt(this,this.sensitive),o=this.requestEpoch,r&&(this.questionReplyUncertain=!0),this.abandonedTurnOutcomeUnknown=!1,this.answeredQuestions=qt(this.messages,this.answeredQuestions);let s=Wt(this.nextMessageId++,`user`,n);return this.messages=[...this.messages,s],()=>{this.messages=this.messages.filter(e=>e!==s),this.answeredQuestions=a[0],e!==t&&this.inputDrafts.ordinary===t&&(this.inputDrafts.ordinary=e)}});return r&&this.requestEpoch===o&&(this.questionReplyUncertain=Ot(a[1],s),s===`rejected`&&(this.answeredQuestions=a[0]),this.emit()),s}sendEventNudge(){return Et(this,()=>this.emit())}dismissEventNudge(){[this.eventNudge,this.eventNudgeClosed]=[null,!0],this.emit()}dismissChannelOnboardingNudge(){this.channelOnboardingNudgeClosed=!0,this.emit(),this.context?.replace(`custodian`)}openChannelsFromOnboarding(){this.channelOnboardingNudgeClosed=!0,this.revokeNavigationAuthority(),this.emit(),this.context?.navigate(`channels`)}async dismissQuestion(e){let t=e.question;if(t){if(t.skipAction===`exit`){this.exitSetup();return}await this.send(t.isOther?h(`optionCard.skip`):`cancel`,h(`optionCard.skip`),!0)!==`rejected`&&this.messages.includes(e)&&(this.dismissedQuestions=new Set(this.dismissedQuestions).add(`${e.id}:${t.id}`),this.emit())}}answerQuestion(e,t){let n=e.question;if(!n)return;let r=n.options.find(e=>e.label===t);this.send(r?.reply??t,t,!0)}answerWizardStep(e,t){if(!e.step||!this.wizardInputPending)return;let n=Ct(e.step,t),r=this.activeClient;if(!n||!r||!this.canSend){this.emit();return}let i=e.step.sensitive?h(`custodian.sensitiveReply`):n.display;this.sendUserTurn(r,{sessionId:this.sessionId,wizardAnswer:n.answer},i,!0)}cancelWizardStep(e){let t=e.step,n=this.activeClient;if(!t||!this.wizardInputPending||!n||!this.canSend||!this.wizardCancelAvailable){this.emit();return}this.sendUserTurn(n,{sessionId:this.sessionId,wizardCancel:{stepId:t.id}},h(`custodian.cancel`),!0)}exitSetup(e=`chat`){this.revokeNavigationAuthority(),gt(this.context,e,this.configuredInferenceState)}revokeNavigationAuthority(){this.requestAbort?.abort(),this.requestAbort=null,this.transcript.clearRecovery(),this.advanceRequestEpoch(),this.sending=!1,this.questionReplyUncertain=!1,this.retryParams=null,this.error=null}advanceRequestEpoch(){return this.transcript.invalidate(),++this.requestEpoch}emit(){this.inputDrafts.reconcile(this),this.transcript.settleRecovery(this.transcriptBlocked,()=>void this.refreshTranscriptIfIdle());for(let e of this.listeners)e()}startSession(e,t){this.sessionVariant=this.variant,this.sessionClient=e,this.sessionOwnershipKey=this.sessionOwner.key(this.context?.gateway??null),this.sessionStarted=!0,this.initializeSession(e,this.initialChatParams(),t)}initialChatParams(){return{sessionId:this.sessionId,...Rt(this.variant)}}replaceSessionId(e){e===void 0&&(this.rejoinBarrierPending=!1),this.sessionId=e??H(),vt(this.sessionId)}abandonPendingUserTurn(e){e&&G(e)&&(this.retryParams=null,this.abandonedTurnOutcomeUnknown=!0)}restartVolatileSession(e){this.replaceSessionId(),this.answeredQuestions=qt(this.messages,this.answeredQuestions),this.inputDrafts.resetPrompt(this,!1),this.wizardInputPending=this.questionReplyUncertain=!1,this.earlierBoundaryAfterId=this.messages.at(-1)?.id??null,this.startSession(e,!1)}synchronizeClient(){let e=this.context;if(!e)return;let t=e.gateway.snapshot,n=t.phase===`connected`?t.client:null,r=n!==null&&C(t,`zero.chat`,`operator.admin`),i=w(t,`zero.chat`)===!1,a=xt(this.context),o=a!==this.configuredInferenceState;this.configuredInferenceState=a;let s=this.sessionStarted&&this.sessionVariant!==this.variant,c=this.sessionOwner.key(e.gateway),l=this.sessionStarted&&n!==null&&this.activeClient===null,u=this.sessionStarted&&n!==null&&n!==this.sessionClient,d=this.sessionOwnershipKey!==null&&c!==this.sessionOwnershipKey;if(n===this.activeClient&&!s&&!u&&!d&&this.chatAvailable===(r&&a!==`unresolved`)&&!o)return;let f=this.sending&&this.retryParams!==null,p=f?this.retryParams:null;if((n!==this.activeClient||d)&&this.transcript.clearRecovery(),this.activeClient=n,this.advanceRequestEpoch(),this.sending=!1,this.chatAvailable=!1,s||d)d&&this.replaceSessionId(),[this.eventNudge,this.eventNudgePending]=[null,null],this.eventNudgeClosed=!1,this.abandonedTurnOutcomeUnknown=!1,this.sessionStarted=!1,this.clearConversation();else if(n&&(u||l)){if(!r){this.sessionStarted=!1,this.abandonPendingUserTurn(p),this.error=i?h(`custodian.unsupportedGateway`):null;return}this.chatAvailable=!0,this.abandonPendingUserTurn(p),this.requestAbort?.abort(),this.requestAbort=null,this.sessionClient=n,this.sessionOwnershipKey=c,this.questionReplyUncertain||this.abandonedTurnOutcomeUnknown?(this.questionReplyUncertain=!1,this.wizardInputPending=!1,this.abandonedTurnOutcomeUnknown=!1,this.rejoinBarrierPending=!0,this.initializeSession(n,this.initialChatParams())):this.refreshTranscriptIfIdle();return}else f&&(p?.message===void 0&&(this.error=h(`custodian.connectionChanged`)),this.abandonPendingUserTurn(p));if(n){if(!r){this.error=i?h(`custodian.unsupportedGateway`):null;return}if(a!==`unresolved`){if(this.chatAvailable=!0,a===`required`){this.sessionStarted=!1,this.clearConversation();return}if(this.sessionStarted){this.retryParams||(this.error=f?this.error:null);return}this.clearConversation(!0),this.startSession(n,!0)}}}async initializeSession(e,t,n=!0){let r=this.advanceRequestEpoch();this.sending=!0,this.inferenceState=`unverified`,this.error=null,this.retryParams=t,this.emit(),n&&await this.refreshTranscriptHistory(e,r),r===this.requestEpoch&&e===this.activeClient&&await this.requestReply(e,t)}async refreshTranscriptHistory(e,t){if(!this.transcript.available)return!1;let n=await this.transcript.loadMessages(e,t,this.nextMessageId,()=>t===this.requestEpoch&&e===this.activeClient);return n?([this.messages,this.nextMessageId]=[n.messages,n.nextMessageId],this.earlierBoundaryAfterId=this.messages.at(-1)?.id??null,this.emit(),!0):!1}clearConversation(e=!1){this.messages=[],this.dismissedQuestions=new Set,this.answeredQuestions=new Set,this.retryParams=null,this.error=null,this.transcript.reset(),this.inferenceState=`unverified`,e||(this.inputDrafts.ordinary={value:``}),this.inputDrafts.resetPrompt(this,!1),this.wizardInputPending=this.questionReplyUncertain=!1,this.earlierBoundaryAfterId=null}async requestReply(e,t,n){let r=this.context;if(!r)return`rejected`;let i=()=>e===this.activeClient&&r.gateway.snapshot.client===e&&C(r.gateway.snapshot,`zero.chat`,`operator.admin`);if(!i())return`rejected`;this.requestAbort?.abort();let a=new AbortController;this.requestAbort=a;let o=this.advanceRequestEpoch(),s=`unsent`,c;this.sending=!0,this.error=null,this.retryParams=t,this.emit();try{if(o!==this.requestEpoch||!i()||(c=n?.())===!1)return this.retryParams===t&&(this.retryParams=null),`rejected`;let l=e.request(`zero.chat`,t,{timeoutMs:en,onSent:()=>{s=`sent`},signal:a.signal});this.emit();let u=await l;if(s=`received`,o!==this.requestEpoch||e!==this.activeClient||(this.replaceSessionId(u.sessionId),this.inputDrafts.resetPrompt(this,u.sensitive===!0),this.wizardInputPending=u.wizardInputPending===!0,this.retryParams=null,this.inferenceState=`ready`,this.rejoinBarrierPending&&!G(t)&&(this.rejoinBarrierPending=!1,await this.refreshTranscriptHistory(e,o),o!==this.requestEpoch||e!==this.activeClient)))return`sent`;this.wizardValue=u.step?rt(u.step):void 0;let d=Gt(this.nextMessageId,u);return d&&(this.nextMessageId+=1,this.messages=[...this.messages,d]),u.handoff?.kind===`model-accounts`?this.exitSetup(`profile`):u.action===`open-agent`?await _t({context:r,...u.agentId?{agentId:u.agentId}:{},hatchDraft:u.agentDraft===`hatch`,isCurrent:()=>o===this.requestEpoch&&e===this.activeClient})===`exit-setup`&&this.exitSetup():u.action===`exit`&&this.exitSetup(),`sent`}catch(n){if(o===this.requestEpoch&&e===this.activeClient){s===`unsent`&&c&&c(),this.error=J(n);let{inferenceUnavailable:r,sessionInvalidated:i}=zt(n);r&&(this.inferenceState=`unverified`,this.retryParams=this.initialChatParams()),i&&G(t)?(this.restartVolatileSession(e),this.error=h(`custodian.sessionRestarted`,{error:J(n)})):i&&(this.replaceSessionId(),this.retryParams={...t,sessionId:this.sessionId},this.error=h(`custodian.sessionRestarted`,{error:J(n)}))}return G(t)&&this.retryParams===t&&(this.retryParams=null),Dt(n,s)}finally{this.requestAbort===a&&(this.requestAbort=null),o===this.requestEpoch&&(this.sending=!1),this.emit()}}},Z=new tn})))()}function nn(){return(nn=e((()=>{})))()}function rn(e){let{action:t}=e.alert,n=C(e.context.gateway.snapshot,`update.run`,`operator.admin`),r=t?.target.kind===`update`&&!n;return y`<article class="custodian__nudge custodian__alert-card" role="status">
    <div class="custodian__alert-heading">
      <strong>${e.alert.title}</strong>
      <button
        class="custodian__nudge-dismiss"
        type="button"
        aria-label=${h(`common.dismiss`)}
        @click=${e.onDismiss}
      >
        ${_.x}
      </button>
    </div>
    <ul class="custodian__alert-facts">
      ${e.alert.facts.map(e=>y`<li>${e}</li>`)}
    </ul>
    ${t?y`<button
            class="btn btn--sm primary custodian__alert-action"
            type="button"
            title=${r?h(`updates.adminRequired`):v}
            ?disabled=${r}
            @click=${()=>{let{target:r}=t,{context:i}=e;r.kind===`navigate`?i.navigate(r.routeId):n&&ye({startGatewayUpdate:()=>void i.overlays.runUpdate(),watchUpdateProgress:be(i),onAcknowledge:()=>i.overlays.acknowledgeUpdateRun(),onCheckStatus:()=>i.overlays.refreshUpdateStatus(),onReviewUpdate:()=>i.navigate(`updates`),updateAvailable:i.overlays.snapshot.updateAvailable,updateSchedule:i.overlays.snapshot.updateSchedule,viaNativeApp:de()})}}
          >
            ${t.label}
          </button>`:v}
  </article>`}function an(){return(an=e((()=>{b(),ce(),pe(),g(),u(),T()})))()}var $;function on(){return(on=e((()=>{Pe(),b(),x(),se(),g(),ft(),Be(),ze(),j(),Ke(),u(),it(),c(),s(),Xe(),an(),tt(),Q(),W(),P(),K(),X(),at(),$=class extends ee{constructor(){super(),this.store=Z,this.onboarding=!1,this.newAgentIntent=!1,this.showChannelOnboardingNudge=!1,this.channelOnboardingError=null,this.channelOnboardingRetrying=!1,this.onRetryChannelOnboarding=()=>void 0,this.compact=!1,this.historyContent=v,this.composerTextarea=null,this.lastMessageId=null,this.lastPluginHelpFocus=0,new i(this).watchStore(()=>this.store).watchStore(()=>I)}async getUpdateComplete(){let e=await super.getUpdateComplete();return await Promise.all(Array.from(this.querySelectorAll(`zero-option-card`)).map(e=>e.updateComplete)),e}willUpdate(){this.store.connect(this.context,Lt(this.onboarding,this.newAgentIntent))}disconnectedCallback(){this.composerTextarea&&=(F(this.composerTextarea),null),super.disconnectedCallback()}updated(){let e=this.store,t=this.querySelector(`textarea`);this.composerTextarea&&this.composerTextarea!==t&&F(this.composerTextarea),this.composerTextarea=t,t&&(Ze(t),Qe(t)),e.canSend&&!e.sensitive&&!e.hasUnresolvedQuestion()&&I.askIfReady((t,n,r)=>void e.send(t,r,!1,n));let n=qe(this.context);n>0&&n!==this.lastPluginHelpFocus&&!e.sensitive&&!e.wizardInputPending&&e.chatAvailable&&(this.lastPluginHelpFocus=n,t?.focus());let r=this.querySelector(`.custodian__messages`),i=this.store.messages.at(-1)?.id??null;if(i!==this.lastMessageId){this.lastMessageId=i;let e=r?.lastElementChild;e instanceof HTMLElement&&e.scrollIntoView?.({block:`nearest`})}}handleComposerKeydown(e){e.key!==`Enter`||e.shiftKey||e.isComposing||(e.preventDefault(),this.store.send())}render(){let e=this.store,t=N(this.context),n=t?h(`custodian.pluginPlaceholder`,{plugin:t.name}):h(`custodian.placeholder`),r=I.alert?rn({alert:I.alert,context:this.context,onDismiss:()=>I.dismiss()}):v;if(e.setupRequired)return y`
        <section
          class="custodian-surface custodian-surface--setup-required ${this.compact?`custodian-surface--panel`:``}"
        >
          ${r}
          <div class="custodian__setup-state" role="alert">
            <zero-mascot mood="idle" .size=${this.compact?72:96}></zero-mascot>
            <h2>${h(`modelSetup.required.title`)}</h2>
            <p>${h(`modelSetup.required.body`)}</p>
            <div class="custodian__setup-actions">
              <button
                class="btn primary"
                type="button"
                @click=${()=>e.exitSetup(`model-setup`)}
              >
                ${h(`modelSetup.required.action`)}
              </button>
            </div>
          </div>
        </section>
      `;let i=e.messages.length===0&&e.error!==null&&!e.sending,a=e.wizardInputPending?e.messages.findLast(e=>e.step!==null):void 0,o=t&&e.activeVariant===`caretaker`&&!e.sensitive&&!e.hasUnresolvedQuestion(),s=o&&!e.hasRealUserTurn(),c=s?Ye(this.context,t):void 0;return y`
      <section
        class="custodian-surface ${this.compact?`custodian-surface--panel`:``} ${i?`custodian-surface--empty-error`:``}"
      >
        <div
          class="custodian__messages"
          ${pt()}
          aria-live="polite"
          @click=${e=>{He(e),Ve(e)}}
        >
          ${r}
          ${this.channelOnboardingError||this.showChannelOnboardingNudge?Mt({error:!!this.channelOnboardingError,retrying:this.channelOnboardingRetrying,onAction:this.channelOnboardingError?this.onRetryChannelOnboarding:()=>e.openChannelsFromOnboarding(),onDismiss:()=>e.dismissChannelOnboardingNudge()}):v}
          ${!this.onboarding&&e.eventNudge&&!e.eventNudgePending?jt({nudge:e.eventNudge,disabled:!e.canSend||e.sensitive||e.hasUnresolvedQuestion(),onSend:()=>void e.sendEventNudge(),onDismiss:()=>e.dismissEventNudge()}):v}
          ${s?y`<div class="custodian__plugin-intro">
                  <h2>${h(`custodian.pluginIntroTitle`,{plugin:t.name})}</h2>
                  <div class="custodian__plugin-starters">
                    ${[[`custodian.pluginStarterPurpose`,`custodian.pluginPromptPurpose`],[`custodian.pluginStarterTools`,`custodian.pluginPromptTools`],[`custodian.pluginStarterSetup`,`custodian.pluginPromptSetup`]].map(([e,n])=>{let r=h(e),i=h(n,{plugin:t.name});return y`<button
                        class="btn"
                        type="button"
                        @click=${()=>void c?.({question:i})}
                      >
                        ${r}
                      </button>`})}
                  </div>
                </div>`:v}
          ${e.messages.filter(e=>!o||!e.optionalWelcome).map(t=>{let n=t.question?`${t.id}:${t.question.id}`:``,r=t.question!==null&&!e.dismissedQuestions.has(n);return Xt({message:t,boundaryAfterId:e.earlierBoundaryAfterId,showQuestion:r,questionDisabled:!e.canSend||e.answeredQuestions.has(n),onSelect:n=>e.answerQuestion(t,n),onSkip:()=>void e.dismissQuestion(t),showWizardStep:t===a,wizardValue:e.wizardValue,wizardDisabled:!e.canSend,wizardSecretVisible:e.wizardSecretVisible,onWizardValueChange:t=>e.setWizardValue(t),onWizardAnswer:n=>e.answerWizardStep(t,n),showWizardCancel:e.wizardCancelAvailable,onWizardCancel:()=>e.cancelWizardStep(t),onToggleWizardSecretVisibility:()=>e.toggleWizardSecretVisibility()})})}
          ${e.sending?y`<div class="chat-group assistant custodian__thinking-row" role="status">
                  <div class="chat-avatar assistant custodian__mascot-avatar" aria-hidden="true">
                    <zero-mascot mood="thinking" .size=${26}></zero-mascot>
                  </div>
                  <div class="chat-group-messages custodian__thinking">
                    <span></span><span></span><span></span>
                    <span class="sr-only">${h(`custodian.thinking`)}</span>
                  </div>
                </div>`:v}
          ${e.abandonedTurnOutcomeUnknown?y`<div class="custodian__error" role="alert">
                  <span>${h(`custodian.connectionChanged`)}</span>
                </div>`:v}
          ${We({status:e.transcript.status,className:`custodian__transcript-status`})}
          ${e.error&&!(e.abandonedTurnOutcomeUnknown&&e.error===h(`custodian.connectionChanged`))?y`<div class="custodian__error" role="alert">
                  <span>${e.error}</span>
                  ${e.activeClient&&e.chatAvailable&&e.canRetry()?y`<button
                          class="btn btn--sm"
                          type="button"
                          @click=${()=>e.retry()}
                        >
                          ${h(`common.retry`)}
                        </button>`:v}
                </div>`:v}
        </div>

        ${this.historyContent}
        ${a?v:y`<div class="agent-chat__composer-shell">
                <div class="agent-chat__input">
                  <div class="agent-chat__composer-input-row">
                    <div class="agent-chat__composer-combobox">
                      ${e.sensitive?y`<input
                              type="password"
                              .value=${e.input}
                              autocomplete="off"
                              placeholder=${h(`custodian.sensitivePlaceholder`)}
                              aria-label=${h(`custodian.sensitivePlaceholder`)}
                              ?disabled=${!e.canSend}
                              @input=${t=>e.setInput(t.target.value)}
                              @keydown=${e=>this.handleComposerKeydown(e)}
                            />`:y`<textarea
                              rows="1"
                              .value=${e.input}
                              autocomplete="on"
                              placeholder=${n}
                              aria-label=${n}
                              ?disabled=${!e.chatAvailable}
                              @input=${t=>e.setInput(t.target.value)}
                              @keydown=${e=>this.handleComposerKeydown(e)}
                            ></textarea>`}
                      <span class="agent-chat__composer-placeholder" aria-hidden="true"
                        >${e.sensitive?h(`custodian.sensitivePlaceholder`):n}</span
                      >
                    </div>
                    <div class="agent-chat__composer-actions">
                      <button
                        class="chat-send-btn"
                        type="button"
                        aria-label=${h(`custodian.send`)}
                        ?disabled=${!e.input.trim()||!e.canSend}
                        @click=${()=>void e.send()}
                      >
                        ${_.arrowUp}
                        <span class="agent-chat__control-label">${h(`custodian.send`)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>`}
      </section>
    `}},D([Ne({context:ve,subscribe:!0})],$.prototype,`context`,void 0),D([S({attribute:!1})],$.prototype,`store`,void 0),D([S({attribute:!1})],$.prototype,`onboarding`,void 0),D([S({attribute:!1})],$.prototype,`newAgentIntent`,void 0),D([S({attribute:!1})],$.prototype,`showChannelOnboardingNudge`,void 0),D([S({attribute:!1})],$.prototype,`channelOnboardingError`,void 0),D([S({attribute:!1})],$.prototype,`channelOnboardingRetrying`,void 0),D([S({attribute:!1})],$.prototype,`onRetryChannelOnboarding`,void 0),D([S({attribute:!1})],$.prototype,`compact`,void 0),D([S({attribute:!1})],$.prototype,`historyContent`,void 0),customElements.get(`zero-custodian-surface`)||customElements.define(`zero-custodian-surface`,$)})))()}export{Q as i,nn as n,Z as r,on as t};
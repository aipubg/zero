const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./mcp-app-view-registration-DIo7IVeR.js","./gateway-runtime-JSfC8ThO.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-boot-shared-CZXdmeIi.js","./control-ui-boot-shared-4Y4EIRNw.js","./control-ui-boot-shared-E4pYPcWx.js","./plugin-contracts-runtime-BO_sRtcl.js","./control-ui-boot-shared-D2GHitQ4.js","./config-runtime-BecGLziM.js","./markdown-runtime-ORQpioyT.js","./control-ui-boot-shared-ZuP0LiFD.js","./control-ui-boot-shared-styles-BXPMRytW.js","./sidebar-update-runtime-B2P2sMaT.js","./mcp-app-routing-BSRGUs87.js","./control-ui-boot-chat-zkzP5WWm.js","./control-ui-boot-chat-BVLkkfEk.js","./control-ui-boot-chat-B3rfqCeq.js","./control-ui-boot-chat-D02HpoEK.js","./control-ui-boot-chat-Cx6CBnJr.js","./chat-transcript-styles-BN-TorbW.js","./control-ui-boot-chat-styles-BcslGtWC.js","./mcp-app-confirm-B_IXP1_0.js","./sandbox-host-Dm6XHU23.js","./control-ui-core-DI-Q_yCI.css","./control-ui-boot-shared-styles-DUf4zEvn.css","./control-ui-boot-shared-DIWJGbGi.css","./sidebar-update-runtime-Bpn2ByHA.css","./chat-transcript-styles-B0IJwY9P.css","./control-ui-boot-chat-styles-SRk09zDG.css","./control-ui-boot-chat-C2DT0d4M.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Pu as i,Si as a,W as o,ju as s,m as c,p as l,xu as u,yu as d,z as f,zu as p}from"./control-ui-core-DCNBgr3X.js";import{Ai as m,ca as h,dr as g,ki as _,sa as v,ur as y}from"./control-ui-core-DwX5Mpz4.js";import{G as b,J as x,W as S,Z as C,_ as w,at as T,rt as E,y as D}from"./lit-runtime-B40xFCK_.js";import{Wn as O}from"./control-ui-boot-shared-BRtBCr5s.js";import{At as k,jt as A,kt as j}from"./control-ui-boot-shared-BX8huZUb.js";import{Ur as M,Wr as N,Zr as P,ma as F,pa as I}from"./ui-AaV6iNVa.js";import{$r as L,Co as R,Xr as z,ei as B,wo as V,xo as H,yo as U}from"./control-ui-boot-shared-CzJHozXQ.js";import{dr as W,fr as G,lr as K,mr as q,pr as J,ur as Y}from"./control-ui-boot-chat-DzIjAmFi.js";var X;function Z(){return(Z=e((()=>{N(),S(),C(),w(),m(),g(),i(),u(),c(),r(),n(),L(),F(),X=class extends s{constructor(){super(),this.requestId=``,this.sessionKey=``,this.selected=new Set,this.disabled=!1,this.busy=!1,this.error=``,this.uploaded=[],this.preview=null,this.generation=0,this.identity=``,new t(this).watchStore(()=>this.context?.gateway)}key(){return JSON.stringify([this.requestId,this.question?.questionId,this.question?.resource?.viewId,this.sessionKey,this.agentId,this.context?y(this.context.gateway).key:-1])}willUpdate(){let e=this.key();(e!==this.identity||this.disabled)&&(this.operationAbort?.abort(),this.generation++,e!==this.identity&&(this.uploaded=[]),this.identity=e,this.busy=!1,this.error=``,this.preview=null)}disconnectedCallback(){this.operationAbort?.abort(),this.generation++,super.disconnectedCallback()}async operation(e){let t=this.context,n=t?.gateway.snapshot.client,r=this.question;if(!t||t.gateway.snapshot.phase!==`connected`||!n||!r?.resource?.viewId||this.disabled||this.busy||!this.sessionKey)return;let i=++this.generation,a=new AbortController;this.operationAbort=a;let o=y(t.gateway).key,s=this.key(),c=()=>this.isConnected&&!this.disabled&&i===this.generation&&s===this.key()&&t.gateway.snapshot.client===n&&y(t.gateway).key===o;this.busy=!0,this.error=``;try{let t=await e(c);if(!c())return;let i=await n.request(`mcp.app.formResource`,{sessionKey:this.sessionKey,agentId:this.agentId,viewId:r.resource.viewId,requestId:this.requestId,questionId:r.questionId,...t},{signal:a.signal});if(!c())return;if(`resources`in i){if(!Array.isArray(i.resources)||i.resources.length>64||!i.resources.every(e=>typeof e.uri==`string`&&e.uri.length<=2048&&typeof e.name==`string`))throw Error(`Invalid resource upload result`);let e=new Map([...this.uploaded,...i.resources].map(e=>[e.uri,e]));if(e.size>64||!r.multiSelect&&i.resources.length!==1)throw Error(`Invalid resource upload count`);this.uploaded=[...e.values()];let t=r.multiSelect?new Set(this.selected):new Set;for(let e of i.resources)t.add(e.uri);this.dispatchEvent(new CustomEvent(`resource-selection`,{detail:{values:[...t]},bubbles:!0,composed:!0}))}else if(`preview`in i){if(i.preview.viewId){if(await I(()=>import(`./mcp-app-view-registration-DIo7IVeR.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29]),import.meta.url),!c())return;this.preview={viewId:i.preview.viewId}}else{let e=i.preview.contents?.map(e=>e.text??``).join(`
`)??``,t=i.preview.contents?.flatMap(e=>{let t=e.blob&&e.mimeType?`data:${e.mimeType};base64,${e.blob}`:void 0;return O(t)?[t]:[]}).slice(0,4);this.preview={text:e.slice(0,65536),images:t}}}}catch(e){c()&&(this.error=d(e))}finally{c()&&(this.busy=!1,this.operationAbort=void 0)}}async upload(e){let t=Array.from(e.files??[]);e.value=``,t.length&&await this.operation(async e=>{l(this.context?.config);let n=B(this.context?.gateway.snapshot.hello?.policy);if(!n||t.length+this.uploaded.length>64||z(t,n,0).length!==t.length)throw Error(p(`chat.questions.resourceUploadTooLarge`));let r=[];for(let n of t){let t=new Uint8Array(await n.arrayBuffer());if(!e())throw Error(`Resource upload cancelled`);l(this.context?.config),r.push({name:n.name,mimeType:n.type||`application/octet-stream`,content:a(t),...n.webkitRelativePath?{relativePath:n.webkitRelativePath}:{}})}return{action:`upload`,files:r}})}render(){let e=this.question,t=e?.resource;return!e||!t?.viewId?b:x`
      <div class="chat-question-panel__resource-actions">
        ${e.options.map((e,n)=>e.preview&&(t.selection!==`implicit`||this.selected.has(e.value??e.label))?x`<button class="btn btn--sm" type="button" ?disabled=${this.disabled||this.busy} @click=${()=>this.operation(async()=>({action:`preview`,optionIndex:n}))}>${p(`chat.questions.resourcePreview`)}: ${e.label}</button>`:b)}
        ${t.userOptions?x`<label class="field"
                ><span>${e.header}</span
                ><input
                  type="file"
                  aria-label=${e.header}
                  ?multiple=${e.multiSelect||t.userOptions.kind===`directory`}
                  accept=${D(t.userOptions.accept?.join(`,`))}
                  ?webkitdirectory=${t.userOptions.kind===`directory`}
                  ?disabled=${this.disabled||this.busy}
                  @change=${e=>{e.currentTarget instanceof HTMLInputElement&&this.upload(e.currentTarget)}}
              /></label>`:b}
        ${this.uploaded.filter(e=>this.selected.has(e.uri)).map(e=>x`<div>${e.name}<button class="btn btn--sm" type="button" ?disabled=${this.disabled||this.busy} @click=${()=>this.dispatchEvent(new CustomEvent(`resource-selection`,{detail:{values:[...this.selected].filter(t=>t!==e.uri)},bubbles:!0,composed:!0}))}>${p(`common.remove`)}</button></div>`)}
        ${this.busy?x`<div role="status">${p(`common.loading`)}</div>`:b}
        ${this.error?x`<div role="alert">${this.error}</div>`:b}
        ${this.preview?.viewId?x`<mcp-app-view
                .sessionKey=${this.sessionKey}
                .viewId=${this.preview.viewId}
              ></mcp-app-view>`:this.preview?x`${this.preview.images?.map(t=>x`<img class="chat-question-panel__resource-image" src=${t} alt=${e.header} />`)}
                  <pre class="chat-question-panel__resource-preview">${this.preview.text}</pre>`:b}
      </div>
    `}},P([M({context:_,subscribe:!0})],X.prototype,`context`,void 0),P([T({attribute:!1})],X.prototype,`question`,void 0),P([T({attribute:!1})],X.prototype,`requestId`,void 0),P([T({attribute:!1})],X.prototype,`sessionKey`,void 0),P([T({attribute:!1})],X.prototype,`agentId`,void 0),P([T({attribute:!1})],X.prototype,`selected`,void 0),P([T({type:Boolean})],X.prototype,`disabled`,void 0),P([E()],X.prototype,`busy`,void 0),P([E()],X.prototype,`error`,void 0),P([E()],X.prototype,`uploaded`,void 0),P([E()],X.prototype,`preview`,void 0),customElements.get(`zero-chat-question-resource`)||customElements.define(`zero-chat-question-resource`,X)})))()}var Q;function $(){return($=e((()=>{S(),C(),h(),i(),A(),o(),r(),R(),K(),Z(),Q=class extends s{constructor(...e){super(...e),this.currentQuestionIndex=0,this.pendingAction=null,this.requestKey=null,this.collapsed=!1,this.focusAfterUpdate=!1,this.answerTextarea=null,this.measuredAnswer=null}setCollapsed(e){if(this.props?.onCollapsedChange){this.props.onCollapsedChange(e);return}this.collapsed=e,this.focusAfterUpdate=!e,this.requestUpdate()}willUpdate(){let e=this.props?.model,t=e?.requestKey??null,n=e?.collapsed??!1;t===this.requestKey?this.props?.onCollapsedChange&&(this.collapsed&&!n&&(this.focusAfterUpdate=!0),this.collapsed=n):(this.requestKey=t,e&&Y(e.questions,e.drafts),this.currentQuestionIndex=0,this.pendingAction=null,this.collapsed=n,this.focusAfterUpdate=!n&&e?.autoFocus!==!1)}disconnectedCallback(){super.disconnectedCallback(),this.answerTextarea&&=(H(this.answerTextarea),null)}updated(){let e=this.querySelector(`.chat-question-panel__textarea`);this.answerTextarea!==e&&(this.answerTextarea&&H(this.answerTextarea),this.answerTextarea=e,this.measuredAnswer=null,e&&V(e)),e&&this.measuredAnswer!==e.value&&(U(e),this.measuredAnswer=e.value),this.focusAfterUpdate&&!this.collapsed&&(this.focusAfterUpdate=!1,this.querySelector(`.chat-question-panel`)?.focus({preventScroll:!0}))}answerValues(e,t){return W(e.drafts.get(t.questionId),t)}buildAnswers(e){return Object.fromEntries(e.questions.map(t=>[t.questionId,this.answerValues(e,t)]))}updateDraft(e,t,n){e.drafts.set(t.questionId,n),this.requestUpdate(),this.props?.onChange?.()}focusPanel(){this.updateComplete.then(()=>this.querySelector(`.chat-question-panel`)?.focus({preventScroll:!0}))}toggleOption(e,t,n,r=!0){let i=e.drafts.get(t.questionId),a=new Set(t.multiSelect?i?.selected:[]);t.multiSelect&&a.has(n)?a.delete(n):a.add(n),this.updateDraft(e,t,{selected:a,freeText:t.multiSelect?i?.freeText??``:``}),r&&!t.multiSelect&&this.currentQuestionIndex<e.questions.length-1&&(this.currentQuestionIndex+=1,this.focusPanel())}setFreeText(e,t,n){let r=e.drafts.get(t.questionId);this.updateDraft(e,t,{selected:!t.multiSelect&&(G(t)?n:n.trim())?new Set:r?.selected??new Set,freeText:n})}async resolve(e,t){if(e.disabled||e.submitting||this.pendingAction)return;let n;if(t===`submit`){let t=this.props?.onSubmit;if(!t||!e.questions.every(t=>t.allowEmpty||this.answerValues(e,t).length>0))return;n=()=>t(this.buildAnswers(e))}else{let e=this.props?.onSkip;if(!e)return;n=e}let r={kind:t};this.pendingAction=r;try{await n()}catch{}finally{this.pendingAction===r&&(this.pendingAction=null)}}advanceOrSubmit(e,t){if(t.allowEmpty||this.answerValues(e,t).length!==0){if(this.currentQuestionIndex<e.questions.length-1){this.currentQuestionIndex+=1,this.focusPanel();return}this.resolve(e,`submit`)}}goBack(){this.currentQuestionIndex!==0&&(--this.currentQuestionIndex,this.focusPanel())}handleKeyDown(e,t,n,r){if(r||e.isComposing||e.keyCode===229)return;if(e.target instanceof HTMLTextAreaElement){e.key===`Enter`&&(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&(n.allowEmpty||this.answerValues(t,n).length>0)&&(e.preventDefault(),this.advanceOrSubmit(t,n));return}if(e.metaKey||e.ctrlKey||e.altKey||e.target instanceof HTMLAnchorElement)return;if(e.key===`Enter`&&!(e.target instanceof HTMLButtonElement)){(n.allowEmpty||this.answerValues(t,n).length>0)&&(e.preventDefault(),this.advanceOrSubmit(t,n));return}if(e.target instanceof HTMLInputElement)return;if(e.target instanceof HTMLButtonElement&&e.target.getAttribute(`role`)===`radio`&&[`ArrowDown`,`ArrowLeft`,`ArrowRight`,`ArrowUp`,`End`,`Home`].includes(e.key)){e.preventDefault();let r=Number(e.target.dataset.optionIndex??`0`),i=n.options.length-1,a=e.key===`Home`?0:e.key===`End`?i:e.key===`ArrowLeft`||e.key===`ArrowUp`?(r-1+n.options.length)%n.options.length:(r+1)%n.options.length,o=n.options[a];if(!o)return;this.toggleOption(t,n,o.value??o.label,!1),this.updateComplete.then(()=>this.querySelector(`.chat-question-panel__option[data-option-index="${a}"]`)?.focus({preventScroll:!0}));return}let i=Number(e.key)-1,a=this.querySelector(`.chat-question-panel__option[data-option-index="${i}"]`);if(i>=0&&i<9&&a){e.preventDefault(),a.click();return}n.options.length>0&&n.options.length<9&&!n.resource&&n.isOther&&i===n.options.length&&(e.preventDefault(),this.querySelector(`.chat-question-panel__other`)?.focus({preventScroll:!0}))}render(){let e=this.props;if(!e)return b;let{model:t}=e,n=t.questions[this.currentQuestionIndex];if(!n)return b;let r=t.disabled||t.submitting||this.pendingAction!==null,i=this.currentQuestionIndex===t.questions.length-1,a=n.allowEmpty||this.answerValues(t,n).length>0,o=t.drafts.get(n.questionId),s=`${this.currentQuestionIndex+1}/${t.questions.length}`,c=t.requestPosition?`${t.requestPosition.current}/${t.requestPosition.total}`:null,l=c?x`<div class="chat-question-panel__request-nav">
          <button
            type="button"
            aria-label=${p(`common.previous`)}
            @click=${e.onPreviousRequest}
          >
            ${v.chevronLeft}
          </button>
          <span>${c}</span>
          <button type="button" aria-label=${p(`common.next`)} @click=${e.onNextRequest}>
            ${v.chevronRight}
          </button>
        </div>`:b,u=(e,t,n,i=!1)=>x`<button
      class="btn btn--sm ${e===`advance`?`primary `:``}chat-question-panel__${e}"
      type="button"
      ?disabled=${r||i}
      @click=${n}
    >
      ${t}
    </button>`;return this.collapsed?x`
        <section
          class="chat-question-panel chat-question-panel--collapsed"
          aria-label=${t.title}
        >
          <button
            class="chat-question-panel__collapsed-button"
            type="button"
            @click=${()=>this.setCollapsed(!1)}
            aria-label=${p(`chat.questions.expand`)}
            aria-expanded="false"
          >
            <span
              >${t.nonBlocking?b:x`<strong>${t.title}</strong> ·`}
              ${t.collapsedLabel?x`${t.collapsedLabel} · ${n.question}`:n.header}</span
            >
            ${t.collapsedLabel?b:x`<span class="chat-question-panel__progress">${s}</span>`}
            <span class="chat-question-panel__chevron">${v.chevronDown}</span>
          </button>
          ${l}
        </section>
      `:x`
      <section
        class="chat-question-panel"
        role="group"
        aria-label=${t.title}
        tabindex="0"
        @keydown=${e=>this.handleKeyDown(e,t,n,r)}
      >
        <div
          class="chat-question-panel__topline ${t.nonBlocking?`chat-question-panel__topline--prompt`:``}"
        >
          ${t.nonBlocking?x`<span class="chat-question-panel__prompt">${n.question}</span>`:x`<div class="chat-question-panel__title">${t.title}</div>`}
          ${l}
          <span class="chat-question-panel__progress">${s}</span>
          <button
            class="chat-question-panel__collapse"
            type="button"
            @click=${()=>this.setCollapsed(!0)}
            aria-label=${p(`chat.questions.collapse`)}
            aria-expanded="true"
          >
            ${v.chevronDown}
          </button>
        </div>

        ${t.nonBlocking?b:x`<div class="chat-question-panel__heading">
                <span class="chat-question-panel__prompt">${n.question}</span>
              </div>`}
        ${n.url?x`<div class="chat-question-panel__external">
                <a
                  class="btn btn--sm"
                  href=${n.url}
                  target=${j}
                  rel=${k()}
                >
                  ${v.externalLink} ${p(`chat.questions.openLink`)}
                </a>
                <span class="muted">${p(`chat.questions.externalStepHint`)}</span>
              </div>`:b}
        ${q({question:n,selected:o?.selected??new Set,disabled:r,onSelect:e=>this.toggleOption(t,n,e)})}
        ${n.secretStore?x`
                <div class="chat-question-panel__store">
                  <div class="chat-question-panel__store-requester">
                    ${p(`chat.questions.storeRequestedBy`,{agent:t.agentId??p(`common.unknown`),session:t.sessionKey??p(`common.unknown`)})}
                  </div>
                  <div class="chat-question-panel__store-entry">
                    ${p(`chat.questions.storeEntry`,{name:n.secretStore.name,kind:n.secretStore.kind===`secret`?p(`secretsStore.protectedSecret`):p(`secretsStore.agentReadable`)})}
                  </div>
                  ${n.secretStore.reason?x`<div class="chat-question-panel__store-reason">
                          ${n.secretStore.reason}
                        </div>`:b}
                  ${n.secretStoreExisting?x`<div class="chat-question-panel__store-replacement">
                          ${n.secretStoreExisting.updatedBy?p(`chat.questions.storeReplacementBy`,{name:n.secretStore.name,updated:f(n.secretStoreExisting.updatedAtMs),updatedBy:n.secretStoreExisting.updatedBy}):p(`chat.questions.storeReplacement`,{name:n.secretStore.name,updated:f(n.secretStoreExisting.updatedAtMs)})}
                        </div>`:b}
                  ${n.secretStore.kind===`secret`?x`<label class="chat-question-panel__store-hosts">
                          <span>${p(`secretsStore.allowedHosts`)}</span>
                          <input
                            class="chat-question-panel__other chat-question-panel__hosts"
                            type="text"
                            autocomplete="off"
                            placeholder=${p(`secretsStore.allowedHostsPlaceholder`)}
                            .value=${t.secretStoreAllowedHostsDraft??n.secretStore.allowedHosts?.join(`, `)??``}
                            ?disabled=${r}
                            @input=${t=>{let n=t.target;n instanceof HTMLInputElement&&e.onSecretStoreAllowedHostsChange?.(n.value)}}
                          />
                        </label>`:b}
                </div>
              `:b}
        ${J({question:n,value:o?.freeText??``,selected:!!(G(n)?o?.freeText:o?.freeText.trim()),disabled:r,onInput:e=>this.setFreeText(t,n,e)})}
        ${n.resource?x`<zero-chat-question-resource
                .question=${n}
                .requestId=${t.requestKey}
                .sessionKey=${t.sessionKey??``}
                .agentId=${t.agentId}
                .selected=${o?.selected??new Set}
                .disabled=${r}
                @resource-selection=${e=>this.updateDraft(t,n,{selected:new Set(e.detail.values),freeText:``})}
              ></zero-chat-question-resource>`:b}

        <div class="chat-question-panel__footer">
          ${t.notice?x`<span class="chat-question-panel__error" role="status">${t.notice}</span>`:b}
          ${t.error?x`<span class="chat-question-panel__error" role="status">
                  ${p(`chat.questions.submitFailed`,{error:t.error})}
                  ${e.onDismissError?x`<button
                          type="button"
                          class="chat-question-panel__error-dismiss"
                          aria-label=${p(`chat.actions.dismissError`)}
                          @click=${e.onDismissError}
                        >
                          ${v.x}
                        </button>`:b}
                </span>`:b}
          ${this.currentQuestionIndex>0?u(`back`,p(`chat.questions.back`),()=>this.goBack()):b}
          ${e.onSkip?u(`skip`,this.pendingAction?.kind===`skip`?p(t.nonBlocking?`chat.asyncQuestions.dismissing`:`chat.questions.skipping`):p(t.nonBlocking?`chat.asyncQuestions.dismiss`:`chat.questions.skip`),()=>void this.resolve(t,`skip`)):b}
          ${u(`advance`,this.pendingAction?.kind===`submit`||t.submitting?p(`chat.questions.submitting`):p(i?`chat.questions.submit`:`chat.questions.next`),()=>this.advanceOrSubmit(t,n),!a||!e.onSubmit)}
        </div>
      </section>
    `}},P([T({attribute:!1})],Q.prototype,`props`,void 0),P([E()],Q.prototype,`currentQuestionIndex`,void 0),P([E()],Q.prototype,`pendingAction`,void 0),customElements.get(`zero-chat-question-panel`)||customElements.define(`zero-chat-question-panel`,Q)})))()}$();export{Q as ChatQuestionPanel};
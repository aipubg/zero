import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Pu as i,V as a,W as o,ju as s,zu as c}from"./control-ui-core-DCNBgr3X.js";import{ca as l,sa as u}from"./control-ui-core-DwX5Mpz4.js";import{E as d,G as f,J as p,W as m,Z as h,at as g,k as _}from"./lit-runtime-B40xFCK_.js";import{Zr as v}from"./ui-AaV6iNVa.js";import{Kt as y,Ut as b}from"./control-ui-boot-shared-ZuP0LiFD.js";import{$o as x,Co as S,Fr as C,Ir as w,Lr as T,Rr as E,Zo as D,ko as O,wo as k,xo as A,yo as j,zr as M}from"./control-ui-boot-shared-CzJHozXQ.js";import{F as N}from"./control-ui-boot-chat-DzIjAmFi.js";import{H as P,U as F,nt as I,rt as L}from"./control-ui-boot-chat-zkzP5WWm.js";import{_t as R,gt as z,vt as B,yt as V}from"./control-ui-boot-new-5_2Ky4dv.js";import{n as H,t as U}from"./panel-empty-state-anOYDn4d.js";function W(e){return e.draft.trim()||(e.attachments?.some(e=>e.mimeType.startsWith(`image/`))?c(`chat.rail.askImageQuestion`):``)}function G(e){let t=null,n=e=>{let n=e instanceof HTMLTextAreaElement?e:null;t&&t!==n&&A(t),t=n,n&&(k(n),O(n))};return{ref:n,dispose(){n()},syncDraft(e){t?.isConnected&&t.value!==e&&O(t)},handleKeydown:t=>{if(B(t))return;let n=e.sendShortcut()===`enter`||t.metaKey||t.ctrlKey;t.key===`Enter`&&!t.shiftKey&&n&&(t.preventDefault(),t.repeat||e.submit())},handleInput:t=>{let n=t.currentTarget;n instanceof HTMLTextAreaElement&&(j(n),e.onDraftChange(n.value))}}}function K(e){let{companion:t,connected:n,pending:r,sendShortcut:i,composer:a,attachmentProps:o,submit:s}=e,l=c(`chat.rail.askPlaceholder`);return p`
    <form
      class="agent-chat__input chat-session-rail__composer"
      @submit=${e=>{e.preventDefault(),s()}}
    >
      ${E(o)}
      ${M(o.attachmentReads?.pendingReads??0)}
      <div class="agent-chat__composer-input-row">
        <label class="agent-chat__composer-combobox chat-session-rail__prompt">
          <textarea
            class="chat-session-rail__input"
            rows="1"
            maxlength="400"
            autocomplete="off"
            aria-label=${c(`chat.rail.askLabel`)}
            aria-keyshortcuts=${i===`enter`?`Enter`:`Control+Enter Meta+Enter`}
            .value=${t.draft}
            placeholder=${l}
            ?disabled=${!n}
            @paste=${e=>{n&&(w(e,o,{imagesOnly:!0}),e.defaultPrevented&&e.stopPropagation())}}
            @keydown=${a.handleKeydown}
            @compositionend=${V}
            @keyup=${z}
            @blur=${z}
            @input=${a.handleInput}
            ${_(a.ref)}
          ></textarea>
          <span class="agent-chat__composer-placeholder" aria-hidden="true">${l}</span>
        </label>
      </div>
      <div class="agent-chat__composer-footer">
        <div class="agent-chat__composer-trail">
          <div class="agent-chat__composer-actions">
            <button
              class="chat-send-btn"
              type="submit"
              aria-label=${c(`chat.rail.askSubmit`)}
              ?disabled=${!n||r||!!o.attachmentReads?.pendingReads||!W(t)}
            >
              ${u.arrowUp}
            </button>
          </div>
        </div>
      </div>
    </form>
  `}function q(){return(q=e((()=>{m(),d(),l(),i(),R(),T(),S()})))()}function J(e){let t=e.checks;return t?t.state===`passing`?c(`chat.rail.checksPassing`,{count:String(t.passed)}):t.state===`failing`?c(`chat.rail.checksFailing`,{count:String(t.failed)}):c(`chat.rail.checksPending`,{count:String(t.running)}):null}var Y,X,Z;function Q(){return(Q=e((()=>{N(),m(),h(),d(),l(),I(),y(),U(),P(),i(),o(),r(),n(),T(),D(),q(),Y=[`changed`,`stopped`,`remaining`],X={busy:`chat.rail.askBusy`,"history-unavailable":`chat.rail.askHistoryUnavailable`,missing:`chat.rail.askMissing`,"model-unavailable":`chat.rail.askModelUnavailable`,"image-unsupported":`chat.rail.askImageUnsupported`,"rate-limited":`chat.rail.askRateLimited`,unavailable:`chat.rail.askUnavailable`},Z=class extends s{constructor(){super(),this.sessionKey=``,this.digest=null,this.running=!1,this.activeRunId=null,this.pullRequests=[],this.companion={turns:[],loading:!1,draft:``},this.connected=!1,this.sendShortcut=`enter`,this.presented=!1,this.composer=G({submit:()=>this.submit(),onDraftChange:e=>this.onDraftChange?.(e),sendShortcut:()=>this.sendShortcut}),new t(this).watchStore(()=>this.uploadConfig)}disconnectedCallback(){this.composer.dispose(),super.disconnectedCallback()}updated(e){let t=e.has(`focusRequest`)?this.focusRequest?.():void 0;this.presented&&t&&this.querySelector(`.chat-session-rail__input:not(:disabled)`)?.focus({preventScroll:!0})}submit(){let e=W(this.companion);e&&this.connected&&!this.companion.attachmentReads?.pendingReads&&!this.companion.turns.some(e=>e.status===`pending`)&&this.onSubmit?.(e)}renderPullRequests(){let e=this.pullRequests.slice(0,2);return e.length===0?f:p`
      <div class="chat-session-rail__prs" aria-label=${c(`chat.rail.pullRequests`)}>
        ${e.map(e=>{let t=J(e);return p`
            <a
              class="chat-session-rail__pr"
              href=${e.url}
              target="_blank"
              rel="noopener noreferrer"
              title=${e.title}
            >
              <span>#${e.number}</span>
              <span>${c(`chat.pullRequests.${e.state}`)}</span>
              ${t?p`<span class="chat-session-rail__pr-checks">${t}</span>`:f}
            </a>
          `})}
      </div>
    `}renderStarters(){return p`
      <div class="chat-session-rail__starters">
        ${Y.map(e=>{let t=c(`chat.rail.starters.${e}`);return p`
            <button
              class="chip chat-session-rail__starter"
              type="button"
              ?disabled=${!this.connected}
              @click=${()=>this.onSubmit?.(t)}
            >
              ${u.spark}<span>${t}</span>
            </button>
          `})}
      </div>
    `}renderThread(e){let{turns:t}=this.companion,n=JSON.stringify(t.map(e=>[e.question,e.status]));return p`
      <div
        class="chat-session-rail__thread"
        aria-live="polite"
        @click=${b}
        ${L()}
        ${_(e=>{e instanceof HTMLElement&&e.dataset.railScrollKey!==n&&(e.dataset.railScrollKey=n,e.scrollTop=e.scrollHeight)})}
      >
        ${this.companion.loading&&t.length===0?F(`chat`,c(`chat.thread.loading`)):f}
        ${!this.companion.loading&&t.length===0?H({icon:u.bot,heading:c(`chat.sidePanel.companion`),description:c(`chat.rail.empty`)}):f}
        ${t.map(t=>p`
            <article
              class="chat-session-rail__exchange ${t.status===`pending`?`chat-session-rail__exchange--pending`:t.status===`failed`?`chat-session-rail__exchange--error`:``}"
            >
              <div class="chat-group user chat-session-rail__message">
                <div class="chat-bubble chat-session-rail__question">
                  ${x(t.question,t.question,{role:`user`,isStreaming:!1},{codeBlockChrome:`none`,codeBlockInteraction:`static`})}
                </div>
              </div>
              ${t.status===`answered`?p`
                      <div class="chat-group assistant chat-session-rail__message">
                        <div class="chat-bubble chat-session-rail__answer">
                          ${x(t.answer,String(t.ts),{role:`assistant`,isStreaming:!1},{codeBlockInteraction:`interactive`})}
                        </div>
                      </div>
                      <time
                        class="chat-session-rail__timestamp"
                        datetime=${new Date(t.ts).toISOString()}
                      >
                        ${c(`chat.rail.asOf`,{time:a(t.ts,{hour:`numeric`,minute:`2-digit`},``)})}
                      </time>
                    `:p`
                      <div class="chat-session-rail__hint">
                        ${c(t.status===`pending`?`chat.rail.askPending`:X[t.hint])}
                      </div>
                      ${t.status===`failed`&&t.retryable&&this.connected&&this.onSubmit?p`<button
                              class="btn btn--secondary chat-session-rail__retry"
                              type="button"
                              ?disabled=${e}
                              @click=${()=>this.onSubmit?.(t)}
                            >
                              ${c(`chat.rail.askRetry`)}
                            </button>`:f}
                    `}
            </article>
          `)}
      </div>
    `}render(){this.composer.syncDraft(this.companion.draft);let e=this.companion,t=e.attachmentReads,n=t?.readSignal,r={uploadConfig:this.uploadConfig,attachments:e.attachments,getAttachments:()=>e.attachments??[],attachmentReads:t,readSignal:n,attachmentLimits:this.attachmentLimits,selectionContextOnly:!0,imagesOnly:!0,disabled:!this.connected,onAttachmentsChange:this.onAttachmentsChange,onPendingReadsChange:e=>{n&&t?.updatePending(n,e)}},i=C({...r,canCompose:this.connected}),a=this.companion.turns.some(e=>e.status===`pending`),o=this.digest&&(!this.running||this.activeRunId&&this.digest.runId===this.activeRunId);return p`
      <section
        class="chat-session-rail chat-session-rail--expanded chat-session-rail--embedded"
        role="region"
        aria-label=${c(`chat.rail.title`)}
        tabindex="-1"
        @dragenter=${i.onDragenter}
        @dragleave=${i.onDragleave}
        @dragover=${i.onDragover}
        @drop=${i.onDrop}
      >
        ${o?this.renderPullRequests():f} ${this.renderThread(a)}
        ${this.companion.turns.some(e=>e.status!==`failed`)?f:this.renderStarters()}
        <zero-chat-comment-controller
          .paneId=${`side-chat:${this.sessionKey}`}
          .props=${r}
          .disabled=${r.disabled}
          .sessionKey=${this.sessionKey}
          .presented=${this.presented}
        ></zero-chat-comment-controller>
        ${K({companion:e,connected:this.connected,pending:a,sendShortcut:this.sendShortcut,composer:this.composer,attachmentProps:r,submit:()=>this.submit()})}
      </section>
    `}},v([g({attribute:!1})],Z.prototype,`sessionKey`,void 0),v([g({attribute:!1})],Z.prototype,`digest`,void 0),v([g({attribute:!1})],Z.prototype,`running`,void 0),v([g({attribute:!1})],Z.prototype,`activeRunId`,void 0),v([g({attribute:!1})],Z.prototype,`pullRequests`,void 0),v([g({attribute:!1})],Z.prototype,`companion`,void 0),v([g({attribute:!1})],Z.prototype,`connected`,void 0),v([g({attribute:!1})],Z.prototype,`sendShortcut`,void 0),v([g({attribute:!1})],Z.prototype,`onSubmit`,void 0),v([g({attribute:!1})],Z.prototype,`onDraftChange`,void 0),v([g({attribute:!1})],Z.prototype,`onAttachmentsChange`,void 0),v([g({attribute:!1})],Z.prototype,`attachmentLimits`,void 0),v([g({attribute:!1})],Z.prototype,`uploadConfig`,void 0),v([g({type:Boolean})],Z.prototype,`presented`,void 0),v([g({attribute:!1})],Z.prototype,`focusRequest`,void 0),customElements.get(`zero-chat-session-rail`)||customElements.define(`zero-chat-session-rail`,Z)})))()}Q();export{Z as ChatSessionRailElement};
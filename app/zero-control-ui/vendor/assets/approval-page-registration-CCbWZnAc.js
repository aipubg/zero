import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{I as t,Nu as n,Pu as r,W as i,ju as a,zu as o}from"./control-ui-core-DCNBgr3X.js";import{$n as s,Ai as c,Ha as l,Tr as u,Wa as d,er as f,ki as p,wr as m}from"./control-ui-core-DwX5Mpz4.js";import{G as h,J as g,W as _,Z as v,at as y,rt as b}from"./lit-runtime-B40xFCK_.js";import{_n as x,hn as S,mn as C}from"./control-ui-boot-shared-BRtBCr5s.js";import{Ur as w,Wr as T,Zr as E,wa as D}from"./ui-AaV6iNVa.js";import{Hn as O,Un as k}from"./control-ui-boot-shared-ZuP0LiFD.js";import"./approval-t2xr4qDL.js";function A(e,t){return t?g`<div class="approval-page__meta-row">
        <dt>${e}</dt>
        <dd title=${t}><bdi dir="ltr">${t}</bdi></dd>
      </div>`:h}function j(e){let t=e.kind!==`system-agent`&&e.scope?k(e.scope):null,n=t?g`<div class="approval-page__warning" role="note">${t}</div>`:h;return e.kind===`exec`?g`
      ${n}
      ${e.warningText?g`<div class="approval-page__warning" role="note">${e.warningText}</div>`:h}
      ${e.commandPreview?g`
              <div class="approval-page__preview-label">${o(`approvalPage.summaryLabel`)}</div>
              <div class="approval-page__summary mono" dir="ltr">
                ${e.commandPreview}
              </div>
            `:h}
      <div class="approval-page__preview-label">${o(`approvalPage.commandLabel`)}</div>
      <pre class="approval-page__preview mono" dir="ltr">${e.commandText}</pre>
      <dl class="approval-page__meta">
        ${A(o(`execApproval.labels.host`),e.host)}
        ${A(o(`approvalPage.nodeLabel`),e.nodeId)}
      </dl>
    `:g`
    ${n}
    <div class="approval-page__preview-label">${o(`approvalPage.requestLabel`)}</div>
    <div class=${`approval-page__preview approval-page__preview--prose`}>${e.description}</div>
    ${e.kind===`plugin`&&e.detail?g`<pre class="approval-page__preview mono" dir="ltr">${e.detail}</pre>`:h}
  `}function M(){return(M=e((()=>{_(),O(),r()})))()}function N(e){return e instanceof s?(D(e.details)?e.details.reason:void 0)===`APPROVAL_NOT_FOUND`||e.gatewayCode===`APPROVAL_NOT_FOUND`||e.gatewayCode===`INVALID_REQUEST`:!1}function P(e){return o({"allow-once":`execApproval.allowOnce`,"allow-always":`execApproval.alwaysAllow`,deny:`execApproval.deny`}[e])}function F(e,t){return e.applied?t===`deny`?e.approval.status===`denied`:e.approval.status===`allowed`&&e.approval.decision===t:!0}function I(e,t){let n=t?.trim();return n?g`<span class="approval-page__chip mono" data-approval-chip=${e}>${n}</span>`:h}function L(e,t){return t===`elsewhere`&&(e.status===`allowed`||e.status===`denied`)?o(`approvalPage.resolvedElsewhere`):t===`here`&&e.status===`allowed`?o(`approvalPage.approvedHere`):t===`here`&&e.status===`denied`?o(`approvalPage.deniedHere`):o({allowed:`approvalPage.approved`,denied:`approvalPage.denied`,expired:`approvalPage.expired`,cancelled:`approvalPage.cancelled`,pending:`approvalPage.pending`}[e.status])}function R(e,t){return t===`elsewhere`&&(e.status===`allowed`||e.status===`denied`)?o(`approvalPage.resolvedElsewhereDescription`):e.status===`allowed`?o(e.decision===`allow-always`?`approvalPage.allowedAlwaysDescription`:`approvalPage.allowedOnceDescription`):o({denied:`approvalPage.deniedDescription`,expired:`approvalPage.expiredDescription`,cancelled:`approvalPage.cancelledDescription`,pending:`approvalPage.pendingDescription`}[e.status])}function z(e,t){return e.status===`pending`?e.presentation.kind===`plugin`?e.presentation.title:o(`approvalPage.execTitle`):L(e,t)}var B,V,H,U;function W(){return(W=e((()=>{T(),_(),v(),C(),f(),c(),m(),d(),r(),i(),n(),M(),B=2e3,V=250,H=`operator.approvals`,U=class extends a{constructor(...e){super(...e),this.approvalId=``,this.approval=null,this.connected=!1,this.approvalsAccess=!0,this.approvalGrantAccess=!1,this.loading=!0,this.resolvingDecision=null,this.requestError=null,this.resolutionOrigin=`observed`,this.client=null,this.operationGeneration=0,this.handleVisibilityChange=()=>{if(document.visibilityState!==`visible`){this.clearPollTimer();return}this.approval?.status===`pending`&&this.hasGatewayConnection&&this.hasApprovalAccess&&this.resolvingDecision===null&&this.loadApproval({background:!0})}}connectedCallback(){this.replaceChildren(),super.connectedCallback(),document.addEventListener(`visibilitychange`,this.handleVisibilityChange),this.previousDocumentTitle=document.title,this.bindApprovalId(!0),this.stopGateway=this.context.gateway.subscribe(e=>this.applyGatewaySnapshot(e)),this.applyGatewaySnapshot(this.context.gateway.snapshot)}disconnectedCallback(){document.removeEventListener(`visibilitychange`,this.handleVisibilityChange),this.stopGateway?.(),this.stopGateway=void 0,this.operationGeneration+=1,this.clearPollTimer(),this.client=null,this.connected=!1,this.previousDocumentTitle!==void 0&&(!this.activeDocumentTitle||document.title===this.activeDocumentTitle)&&(document.title=this.previousDocumentTitle),this.previousDocumentTitle=void 0,this.activeDocumentTitle=void 0,super.disconnectedCallback()}updated(e){e.has(`approvalId`)&&this.bindApprovalId(),this.updateDocumentTitle()}bindApprovalId(e=!1){(e||this.boundApprovalId!==this.approvalId)&&(this.boundApprovalId=this.approvalId,this.operationGeneration+=1,this.clearPollTimer(),this.approval=null,this.loading=!!this.approvalId,this.resolvingDecision=null,this.requestError=this.approvalId?null:`unavailable`,this.resolutionOrigin=`observed`,this.approvalId&&this.connected&&this.client&&this.hasApprovalAccess&&this.loadApproval())}applyGatewaySnapshot(e){let t=e.client!==this.client,n=e.phase===`connected`!==this.connected,r=u(e),i=r.canReviewApprovals!==this.approvalsAccess,a=r.canGrantApprovals!==this.approvalGrantAccess;if(this.client=e.client,this.connected=e.phase===`connected`,this.approvalsAccess=r.canReviewApprovals,this.approvalGrantAccess=r.canGrantApprovals,(t||n||i||a)&&(this.operationGeneration+=1,this.clearPollTimer(),this.resolvingDecision=null),this.approvalsAccess||(this.approval=null),e.phase!==`connected`||!e.client){this.approvalId&&(this.loading=!1,this.requestError=!this.approval||this.approval.status===`pending`?`connection`:null);return}if(!this.approvalsAccess){this.loading=!1,this.requestError=null;return}if(!this.approvalId){this.loading=!1,this.requestError=`unavailable`;return}if(t||n||i||!this.approval){this.loadApproval();return}this.schedulePoll()}isCurrentOperation(e){return this.hasGatewayConnection&&this.hasApprovalAccess&&this.client===e.client&&this.approvalId===e.id&&this.operationGeneration===e.generation}get hasGatewayConnection(){return this.connected&&!!this.client}get hasApprovalAccess(){return this.approvalsAccess&&u(this.context.gateway.snapshot).canReviewApprovals}get hasApprovalGrantAccess(){return this.approvalGrantAccess&&u(this.context.gateway.snapshot).canGrantApprovals}async loadApproval(e={}){let t=this.client,n=this.approvalId;if(!t||!this.connected||!n||!this.hasApprovalAccess)return;let r=++this.operationGeneration,i=this.approval?.status,a=!1;this.clearPollTimer(),e.background||(this.loading=!0);try{let e=await t.request(`approval.get`,{id:n});if(!this.isCurrentOperation({client:t,generation:r,id:n}))return;if(!S(e)||e.approval.id!==n){this.approval=null,this.requestError=`unavailable`;return}this.requestError=null,this.approval=e.approval,e.approval.status===`pending`?this.resolutionOrigin=`observed`:i===`pending`&&this.resolutionOrigin===`observed`&&(this.resolutionOrigin=`elsewhere`,a=!0)}catch(e){if(!this.isCurrentOperation({client:t,generation:r,id:n}))return;N(e)?(this.approval=null,this.requestError=`unavailable`):this.requestError=`connection`}finally{this.isCurrentOperation({client:t,generation:r,id:n})&&(this.loading=!1,this.schedulePoll())}a&&this.isCurrentOperation({client:t,generation:r,id:n})&&await this.focusTerminalState()}async resolveApproval(e){let t=this.approval,n=this.client,r=this.approvalId;if(!n||!this.connected||!this.hasApprovalGrantAccess||!r||t?.status!==`pending`||!Array.prototype.includes.call(t.presentation.allowedDecisions,e)||this.resolvingDecision!==null)return;let i=t.presentation.kind,a=++this.operationGeneration,o=()=>this.isCurrentOperation({client:n,generation:a,id:r})&&this.hasApprovalGrantAccess,s=!1,c=!1;this.clearPollTimer(),this.resolvingDecision=e,this.requestError=null;try{let t=await n.request(`approval.resolve`,{id:r,kind:i,decision:e});if(!o())return;!x(t)||t.approval.id!==r||t.approval.presentation.kind!==i||!F(t,e)?(this.requestError=`connection`,c=!0):(this.approval=t.approval,this.resolutionOrigin=t.applied?`here`:`elsewhere`,s=!0)}catch(e){if(!o())return;this.requestError=N(e)?`unavailable`:`connection`}finally{o()&&(this.resolvingDecision=null,this.schedulePoll())}if(c&&o()){await this.loadApproval({background:!0});return}s&&o()&&await this.focusTerminalState()}async focusTerminalState(){if(await this.updateComplete,this.approval?.status===`pending`)return;let e=this.querySelector(`#approval-page-title`);e?.focus({preventScroll:!0}),typeof e?.scrollIntoView==`function`&&e.scrollIntoView({behavior:`auto`,block:`center`,inline:`nearest`})}clearPollTimer(){globalThis.clearTimeout(this.pollTimer),this.pollTimer=void 0}schedulePoll(){this.clearPollTimer();let e=this.approval;if(!this.hasGatewayConnection||!this.hasApprovalAccess||this.resolvingDecision!==null||this.requestError===`unavailable`||e?.status!==`pending`||document.visibilityState!==`visible`)return;let t=e.expiresAtMs-Date.now(),n=Math.max(V,Math.min(B,t+V));this.pollTimer=globalThis.setTimeout(()=>{this.pollTimer=void 0,this.loadApproval({background:!0})},n)}renderHeader(){return g`
      <header class="approval-page__brand">
        <img
          class="approval-page__logo"
          src=${l(`apple-touch-icon.png`,this.context.resourceBasePath)}
          alt=""
        />
        <div>
          <div class="approval-page__eyebrow">${o(`approvalPage.eyebrow`)}</div>
          <div class="approval-page__brand-name">${o(`approvalPage.brandName`)}</div>
        </div>
      </header>
    `}renderState(e){let t={loading:`approvalPage.loadingTitle`,unavailable:`approvalPage.unavailableTitle`,"missing-scope":`common.disabled`,connection:`approvalPage.connectionErrorTitle`}[e];return g`
      <div
        class="approval-page__state approval-page__state--${e===`missing-scope`?`unavailable`:e}"
        role=${e===`loading`?`status`:`alert`}
      >
        ${e===`loading`?g`<div class="approval-page__spinner" aria-hidden="true"></div>`:g`<div class="approval-page__state-mark" aria-hidden="true">!</div>`}
        <h1 id="approval-page-title">${o(t)}</h1>
        <p>
          ${e===`missing-scope`?g`<code>${H}</code>`:o({loading:`approvalPage.loadingDescription`,unavailable:`approvalPage.unavailableDescription`,connection:`approvalPage.connectionErrorDescription`}[e])}
        </p>
        ${e===`connection`?this.renderRetry(`btn`):h}
      </div>
    `}renderRetry(e){return g`<button
      type="button"
      class=${e}
      ?disabled=${!this.hasGatewayConnection||!this.hasApprovalAccess||this.loading}
      @click=${()=>void this.loadApproval()}
    >
      ${o(`approvalPage.retry`)}
    </button>`}renderConnectionError(){return g`
      <div class="approval-page__callout" role="alert">
        <div>
          <strong>${o(`approvalPage.connectionErrorTitle`)}</strong>
          <span>${o(`approvalPage.connectionErrorDescription`)}</span>
        </div>
        ${this.renderRetry(`btn btn--sm`)}
      </div>
    `}renderApproval(e){let n=e.status===`pending`,r=e.presentation,i=this.hasApprovalGrantAccess,a=z(e,this.resolutionOrigin),s=n?o(i?`approvalPage.pendingDescription`:`execApproval.reviewOnly`):R(e,this.resolutionOrigin);return g`
      <div class="approval-page__status" aria-live="polite" aria-atomic="true">
        <span
          class="approval-page__status-dot approval-page__status-dot--${e.status}"
          aria-hidden="true"
        ></span>
        ${n?o(`approvalPage.pending`):L(e,this.resolutionOrigin)}
      </div>
      <div class="approval-page__heading">
        <h1 id="approval-page-title" tabindex=${n?h:-1}>${a}</h1>
        <div class="approval-page__chips">
          ${r.kind===`plugin`?g`${I(`plugin`,r.pluginId)}
                ${I(`tool`,r.toolName)}`:h}
          ${I(`agent`,r.agentId)}
        </div>
        <p>${s}</p>
      </div>
      ${j(r)}
      <div class="approval-page__timing">
        <span>${o(n?`approvalPage.expiresLabel`:`approvalPage.resolvedLabel`)}</span>
        <time
          datetime=${new Date(n?e.expiresAtMs:e.resolvedAtMs).toISOString()}
        >
          ${t(n?e.expiresAtMs:e.resolvedAtMs,{dateStyle:`medium`,timeStyle:`short`})}
        </time>
      </div>
      ${this.requestError===`connection`?this.renderConnectionError():h}
      ${n?g`
              <div
                class="approval-page__actions"
                role="group"
                aria-label=${o(`approvalPage.actionsLabel`)}
              >
                ${r.allowedDecisions.map(e=>g`
                    <button
                      type="button"
                      class="btn approval-page__action approval-page__action--${e}"
                      data-decision=${e}
                      ?disabled=${this.resolvingDecision!==null||!this.hasGatewayConnection||!i||this.requestError!==null}
                      @click=${()=>void this.resolveApproval(e)}
                    >
                      ${this.resolvingDecision===e?o(`approvalPage.resolvingDecision`,{decision:P(e)}):P(e)}
                    </button>
                  `)}
              </div>
            `:g`
              <div class="approval-page__terminal" role="status">
                ${o(`approvalPage.safeToClose`)}
              </div>
            `}
    `}render(){let e=this.connected&&!this.approvalsAccess,t=this.requestError===`unavailable`,n=this.requestError===`connection`&&!this.approval,r=e?`missing-scope`:t?`unavailable`:n?`connection-error`:this.approval?.status??`loading`,i=this.approval?.presentation,a=i?.kind===`plugin`?i.severity?.trim().toLowerCase():null,s=i?.kind===`exec`||a===`warning`||a===`warn`?`warning`:a===`danger`||a===`critical`||a===`error`?`danger`:`info`;return g`
      <main class="approval-page" data-state=${r}>
        <div class="approval-page__backdrop" aria-hidden="true"></div>
        <section
          class="approval-page__card approval-page__card--severity-${s}"
          aria-labelledby="approval-page-title"
          aria-busy=${this.loading||this.resolvingDecision!==null?`true`:`false`}
        >
          ${this.renderHeader()}
          <div class="approval-page__content">
            ${e?this.renderState(`missing-scope`):this.loading&&!this.approval?this.renderState(`loading`):n?this.renderState(`connection`):t||!this.approval?this.renderState(`unavailable`):this.renderApproval(this.approval)}
          </div>
        </section>
        <a class="approval-page__back-link" href=${`${this.context.basePath}/chat`}>
          ${o(`approvalPage.openControlUi`)}
        </a>
      </main>
    `}updateDocumentTitle(){let e=`${this.connected&&!this.approvalsAccess?o(`common.disabled`):this.requestError===`unavailable`?o(`approvalPage.unavailableTitle`):this.requestError===`connection`&&!this.approval?o(`approvalPage.connectionErrorTitle`):this.approval?z(this.approval,this.resolutionOrigin):o(`approvalPage.loadingTitle`)} — ${o(`approvalPage.brandName`)}`;document.title=e,this.activeDocumentTitle=e}},E([w({context:p,subscribe:!1})],U.prototype,`context`,void 0),E([y({attribute:`approval-id`})],U.prototype,`approvalId`,void 0),E([b()],U.prototype,`approval`,void 0),E([b()],U.prototype,`connected`,void 0),E([b()],U.prototype,`approvalsAccess`,void 0),E([b()],U.prototype,`approvalGrantAccess`,void 0),E([b()],U.prototype,`loading`,void 0),E([b()],U.prototype,`resolvingDecision`,void 0),E([b()],U.prototype,`requestError`,void 0),E([b()],U.prototype,`resolutionOrigin`,void 0)})))()}function G(){return(G=e((()=>{W(),customElements.get(`zero-approval-page`)||customElements.define(`zero-approval-page`,U)})))()}G();
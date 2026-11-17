import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Au as t,Nu as n,Ou as r,Pu as i,Tu as a,ku as o,zu as s}from"./control-ui-core-DCNBgr3X.js";import{qr as c}from"./control-ui-core-DwX5Mpz4.js";import{G as l,J as u,W as d,Z as f,at as p,et as m,rt as h}from"./lit-runtime-B40xFCK_.js";import{Zr as g}from"./ui-AaV6iNVa.js";import{C as _,Hn as v,S as y,Vn as b,b as x,x as S,y as C}from"./control-ui-boot-shared-ZuP0LiFD.js";function w(e){let t=e.queue.filter(t=>t.id!==e.activeId);return t.length===0?l:u`
    <div class="exec-approval-list" aria-label=${s(`execApproval.otherPending`)}>
      <div class="exec-approval-list__heading">${s(`execApproval.otherPending`)}</div>
      ${t.map(t=>{let n=b(t.request.command),r=t.request.agentId?.trim()||`—`;return u`
          <button
            class="exec-approval-list__item"
            type="button"
            aria-label=${s(`execApproval.reviewRequest`,{agent:r,command:n})}
            @click=${()=>e.onSelect(t.id)}
          >
            <span class="exec-approval-list__agent">${r}</span>
            <span class="exec-approval-list__command mono">${n}</span>
            <zero-approval-countdown
              class="exec-approval-list__expiry"
              aria-hidden="true"
              .expiresAtMs=${t.expiresAtMs}
              .compact=${!0}
            ></zero-approval-countdown>
          </button>
        `})}
    </div>
  `}function T(e){return e.composedPath().some(e=>e instanceof Element&&e.closest(`input, textarea, [contenteditable]:not([contenteditable='false'])`)!==null)}function E(e){return T(e)?null:o(a.approveAlways,e)?`allow-always`:o(a.modifiedEnter,e)?`allow-once`:o(a.denyApproval,e)?`deny`:null}var D;function O(){return(O=e((()=>{d(),f(),v(),i(),r(),n(),S(),c(),D=class extends t{constructor(...e){super(...e),this.selectedApprovalId=null,this.explicitlyOpen=!1}show(){this.props?.queue.length&&(this.explicitlyOpen=!0,this.updateComplete.then(()=>this.dialog?.show()))}get dialogOpen(){return this.explicitlyOpen&&(this.props?.queue.length??0)>0}handleKeydown(e,t){if(e.defaultPrevented||e.repeat||this.props?.busy||!this.props?.canGrant)return;let n=E(e);n&&_(t).includes(n)&&(e.preventDefault(),this.props?.onDecision(t.id,n))}willUpdate(e){if(e.get(`props`)?.queue.length&&!this.props?.queue.length){this.explicitlyOpen=!1,this.selectedApprovalId=null;return}let t=this.props?.queue??[];t.some(e=>e.id===this.selectedApprovalId)||(this.selectedApprovalId=t.at(0)?.id??null)}render(){let e=this.props,t=e?.queue??[],n=t.find(e=>e.id===this.selectedApprovalId)??t.at(0);return!e||!this.explicitlyOpen||!n?l:u`
      <zero-modal-dialog
        label=${x(n)}
        description=${C(n.expiresAtMs,Date.now())}
        @keydown=${e=>this.handleKeydown(e,n)}
        @modal-cancel=${t=>{if(e.busy){t.preventDefault();return}this.explicitlyOpen=!1}}
      >
        <div class="exec-approval-modal-stack">
          ${y({approval:n,busy:e.busy,canGrant:e.canGrant,error:e.errors.get(n.id)??null,variant:`modal`,queueCount:t.length,onDecision:e.onDecision})}
          ${w({queue:t,activeId:n.id,onSelect:e=>{this.selectedApprovalId=e}})}
        </div>
      </zero-modal-dialog>
    `}},g([p({attribute:!1})],D.prototype,`props`,void 0),g([m(`zero-modal-dialog`)],D.prototype,`dialog`,void 0),g([h()],D.prototype,`selectedApprovalId`,void 0),g([h()],D.prototype,`explicitlyOpen`,void 0),customElements.get(`zero-exec-approval`)||customElements.define(`zero-exec-approval`,D)})))()}O();
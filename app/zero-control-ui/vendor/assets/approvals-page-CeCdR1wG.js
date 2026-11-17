import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gu as t,I as n,Ic as r,Lc as i,Nu as a,Pu as o,W as ee,Wu as s,ju as c,xu as l,yu as u,zu as d}from"./control-ui-core-DCNBgr3X.js";import{Aa as f,Ai as p,Ba as m,Tr as h,bt as g,ki as _,wr as v,yt as y}from"./control-ui-core-DwX5Mpz4.js";import{G as b,J as x,W as S,Z as C,rt as w}from"./lit-runtime-B40xFCK_.js";import{gn as T,mn as te}from"./control-ui-boot-shared-BRtBCr5s.js";import{Ur as ne,Wr as re,Zr as E}from"./ui-AaV6iNVa.js";import{G as D,I as O,K as k,R as A,U as j,Y as M,l as N,u as P}from"./control-ui-boot-shared-ZuP0LiFD.js";var F,I;function L(){return(L=e((()=>{t(),F={standingGrants:{title:`Standing grants`,description:`Allow-always on an automation approval mints a standing grant for that exact command. Revoking one makes the next occurrence ask again.`,historyTitle:`Approval history`,empty:`No standing grants. Answer an automation approval with Always allow to mint one.`,stateUntilRevoked:`Until revoked`,stateExpiresIn:`Expires in {count}d`,stateExpired:`Expired`,stateRevoked:`Revoked`,revoke:`Revoke`,revoking:`Revoking…`,columns:{automation:`Automation`,command:`Command`,uses:`Uses`,state:`State`}},approvalHistory:{description:`Terminal exec, plugin, and system-agent approvals recorded by this gateway, newest first.`,loading:`Loading approval history…`,loadingMore:`Loading…`,loadMore:`Load more`,empty:`No resolved approvals in the rolling 30-day window.`,retention:`Approval history is a rolling 30-day window.`,offline:`Connect to the gateway to load approval history.`,invalidResponse:`The gateway returned an invalid approval history response.`,unknown:`Unknown`,notApplicable:`N/A`,columns:{resolved:`Resolved`,kind:`Kind`,request:`Request`,decision:`Decision`,reason:`Resolution reason`,source:`Source agent / session`,resolver:`Resolver`},kinds:{exec:`Exec`,plugin:`Plugin`,systemAgent:`System agent`},statuses:{allowed:`Allowed`,denied:`Denied`,expired:`Expired`,cancelled:`Cancelled`},decisions:{allowOnce:`Allow once`,allowAlways:`Always allow`,deny:`Deny`},reasons:{user:`User decision`,timeout:`Timed out`,malformedVerdict:`Malformed verdict`,noRoute:`No route`,runAborted:`Run aborted`,gatewayRestart:`Gateway restart`,storageCorrupt:`Storage corrupt`}}},I=Object.assign(()=>{Object.assign(s.standingGrants,F.standingGrants),Object.assign(s.approvalHistory,F.approvalHistory)},{catalog:F})})))()}function R(e,t){if(e.revokedAtMs!==null)return d(`standingGrants.stateRevoked`);if(e.expiresAtMs!==null&&e.expiresAtMs<=t)return d(`standingGrants.stateExpired`);if(e.expiresAtMs!==null){let n=Math.max(1,Math.ceil((e.expiresAtMs-t)/864e5));return d(`standingGrants.stateExpiresIn`,{count:String(n)})}return d(`standingGrants.stateUntilRevoked`)}function z(e,t){return e.revokedAtMs===null&&(e.expiresAtMs===null||e.expiresAtMs>t)}function B(e){let t=e.presentation;return(t.kind===`exec`?t.commandText:t.title)||d(`approvalHistory.unknown`)}function V(e){let t=[e.source?.agentId,e.source?.sessionKey].filter(e=>!!e);return t.length>0?t.join(` · `):d(`approvalHistory.unknown`)}function H(e){return e.resolver?e.resolver.id?`${e.resolver.kind} · ${e.resolver.id}`:e.resolver.kind:d(`approvalHistory.unknown`)}function U(e,t){return x`<tr>
    <td colspan=${e} class="data-table-empty-cell">
      <div class="data-table-empty-state" role="status" aria-live="polite">${t}</div>
    </td>
  </tr>`}function W(e,t,n=!1){return x`<td class=${n?`mono`:b} data-label=${d(e)}>${t}</td>`}var G,K,q,J,Y,X,Z,Q;function $(){return($=e((()=>{re(),S(),C(),te(),f(),p(),y(),v(),O(),N(),o(),L(),l(),ee(),a(),i(),I(),G=50,K=`operator.approvals`,q=`http://127.0.0.1:18789/tools/exec-approvals`,J={exec:`approvalHistory.kinds.exec`,plugin:`approvalHistory.kinds.plugin`,"system-agent":`approvalHistory.kinds.systemAgent`},Y={allowed:`approvalHistory.statuses.allowed`,denied:`approvalHistory.statuses.denied`,expired:`approvalHistory.statuses.expired`,cancelled:`approvalHistory.statuses.cancelled`},X={"allow-once":`approvalHistory.decisions.allowOnce`,"allow-always":`approvalHistory.decisions.allowAlways`,deny:`approvalHistory.decisions.deny`},Z={user:`approvalHistory.reasons.user`,timeout:`approvalHistory.reasons.timeout`,"malformed-verdict":`approvalHistory.reasons.malformedVerdict`,"no-route":`approvalHistory.reasons.noRoute`,"run-aborted":`approvalHistory.reasons.runAborted`,"gateway-restart":`approvalHistory.reasons.gatewayRestart`,"storage-corrupt":`approvalHistory.reasons.storageCorrupt`},Q=class extends c{constructor(...e){super(...e),this.items=[],this.grants=[],this.grantsError=null,this.revokingGrantId=null,this.nextCursor=null,this.loadKind=null,this.error=null,this.connected=!1,this.approvalsAccess=!0,this.client=null,this.gatewaySource=null,this.requestGeneration=0,this.hasLoaded=!1,this.historyRefreshPending=!1,this.subscriptions=new r(this).effect(()=>this.context?.gateway,e=>{this.gatewaySource!==e&&this.resetHistory(!0),this.gatewaySource=e,this.applyGatewaySnapshot(e.snapshot);let t=e.subscribe(t=>{this.gatewaySource===e&&this.context.gateway===e&&this.applyGatewaySnapshot(t)}),n=e.subscribeEvents(t=>{this.gatewaySource===e&&this.context.gateway===e&&this.approvalsAccess&&h(e.snapshot).canReviewApprovals&&g(t.event,t.payload)&&(this.historyRefreshPending=!0,this.loadKind===null&&this.loadPage(!0))});return()=>{t(),n()}})}disconnectedCallback(){this.subscriptions.clear(),this.resetHistory(!1),this.gatewaySource=null,super.disconnectedCallback()}resetHistory(e){this.requestGeneration+=1,this.loadKind=null,this.historyRefreshPending=!1,this.revokingGrantId=null,e&&(this.grants=[],this.grantsError=null,this.hasLoaded=!1,this.items=[],this.nextCursor=null,this.error=null)}applyGatewaySnapshot(e){let t=e.client!==this.client,n=e.phase===`connected`!==this.connected,r=h(e).canReviewApprovals,i=r!==this.approvalsAccess;this.connected=e.phase===`connected`,this.approvalsAccess=r,t||i?(this.client=e.client,this.resetHistory(!0)):n&&(this.resetHistory(!1),e.phase===`connected`&&(this.hasLoaded=!1)),e.phase===`connected`&&e.client&&this.approvalsAccess&&!this.hasLoaded&&this.loadKind!==`reset`&&this.loadPage(!0)}async loadPage(e){let t=this.client,n=this.gatewaySource;if(!t||!n||!this.connected||!this.approvalsAccess||!h(n.snapshot).canReviewApprovals||this.loadKind!==null)return;let r=this.requestGeneration,i=e?void 0:this.nextCursor??void 0;if(!e&&!i)return;e&&(this.historyRefreshPending=!1),this.loadKind=e?`reset`:`more`,this.error=null;let a=()=>this.isCurrentRequest(t,n,r);try{let n=await t.request(`approval.history`,{...i?{cursor:i}:{},limit:G});if(!T(n))throw Error(d(`approvalHistory.invalidResponse`));if(!a())return;this.items=e?n.items:[...this.items,...n.items],this.nextCursor=n.nextCursor??null,this.hasLoaded=!0,e&&this.loadGrants(t,a)}catch(e){a()&&(this.error=u(e),this.hasLoaded=!0)}finally{a()&&(this.loadKind=null,this.historyRefreshPending&&this.loadPage(!0))}}async loadGrants(e,t){try{let n=await e.request(`exec.approval.grants.list`,{});if(!t())return;this.grants=Array.isArray(n.grants)?n.grants:[],this.grantsError=null}catch(e){t()&&(this.grantsError=u(e))}}isCurrentRequest(e,t,n){return this.isConnected&&this.connected&&this.approvalsAccess&&this.gatewaySource===t&&this.context.gateway===t&&t.snapshot.phase===`connected`&&h(t.snapshot).canReviewApprovals&&this.client===e&&this.requestGeneration===n}async revokeGrant(e){let t=this.client,n=this.gatewaySource,r=this.requestGeneration;if(!t||!n||this.revokingGrantId!==null||!this.isCurrentRequest(t,n,r))return;let i=()=>this.isCurrentRequest(t,n,r);this.revokingGrantId=e;try{if(await t.request(`exec.approval.grants.revoke`,{grantId:e}),!i())return;let n=Date.now();this.grants=this.grants.map(t=>t.grantId===e?{...t,revokedAtMs:n}:t),this.grantsError=null}catch(e){i()&&(this.grantsError=u(e))}finally{i()&&(this.revokingGrantId=null)}}renderGrants(){let e=Date.now();return M({title:x`<span id="standing-grants-title">${d(`standingGrants.title`)}</span>`,description:d(`standingGrants.description`),notice:this.grantsError?x`<div class="callout danger" role="alert">${this.grantsError}</div>`:b},x`
        <div class="data-table-container">
          <table
            class="data-table standing-grants-table settings-table--stacked"
            role="table"
            aria-labelledby="standing-grants-title"
          >
            <thead>
              <tr>
                <th scope="col">${d(`standingGrants.columns.automation`)}</th>
                <th scope="col">${d(`standingGrants.columns.command`)}</th>
                <th scope="col">${d(`standingGrants.columns.uses`)}</th>
                <th scope="col">${d(`standingGrants.columns.state`)}</th>
                <th scope="col"><span class="sr-only">${d(`standingGrants.revoke`)}</span></th>
              </tr>
            </thead>
            <tbody>
              ${this.grants.length===0?U(5,d(`standingGrants.empty`)):this.grants.map(t=>{let n=d(this.revokingGrantId===t.grantId?`standingGrants.revoking`:`standingGrants.revoke`);return x`
                        <tr>
                          ${W(`standingGrants.columns.automation`,t.cronJobName??t.cronJobId)}
                          ${W(`standingGrants.columns.command`,t.command,!0)}
                          ${W(`standingGrants.columns.uses`,t.useCount)}
                          <td data-label=${d(`standingGrants.columns.state`)} aria-live="polite">
                            ${R(t,e)}
                          </td>
                          <td>
                            ${z(t,e)?x`
                                    <button
                                      class="btn btn--sm"
                                      aria-label=${`${n}: ${t.cronJobName??t.cronJobId} — ${t.command}`}
                                      ?disabled=${this.revokingGrantId!==null}
                                      @click=${()=>void this.revokeGrant(t.grantId)}
                                    >
                                      ${n}
                                    </button>
                                  `:b}
                          </td>
                        </tr>
                      `})}
            </tbody>
          </table>
        </div>
      `)}renderTable(){return this.loadKind===`reset`&&this.items.length===0?j({label:d(`approvalHistory.loading`)}):x`
      <div class="data-table-container">
        <table
          class="data-table approval-history-table settings-table--stacked"
          role="table"
          aria-labelledby="approval-history-title"
          aria-busy=${this.loadKind===null?`false`:`true`}
        >
          <thead>
            <tr>
              <th scope="col">${d(`approvalHistory.columns.resolved`)}</th>
              <th scope="col">${d(`approvalHistory.columns.kind`)}</th>
              <th scope="col">${d(`approvalHistory.columns.request`)}</th>
              <th scope="col">${d(`approvalHistory.columns.decision`)}</th>
              <th scope="col">${d(`approvalHistory.columns.reason`)}</th>
              <th scope="col">${d(`approvalHistory.columns.source`)}</th>
              <th scope="col">${d(`approvalHistory.columns.resolver`)}</th>
            </tr>
          </thead>
          <tbody>
            ${this.items.length===0?U(7,d(this.error||!this.hasLoaded?`approvalHistory.unknown`:`approvalHistory.empty`)):this.items.map(e=>x`
                      <tr>
                        ${W(`approvalHistory.columns.resolved`,n(e.resolvedAtMs,{dateStyle:`medium`,timeStyle:`short`}))}
                        ${W(`approvalHistory.columns.kind`,d(J[e.presentation.kind]))}
                        ${W(`approvalHistory.columns.request`,B(e),!0)}
                        ${W(`approvalHistory.columns.decision`,x`${d(Y[e.status])} ·
                          ${d(`decision`in e&&e.decision?X[e.decision]:`approvalHistory.notApplicable`)}`)}
                        ${W(`approvalHistory.columns.reason`,d(Z[e.reason]))}
                        ${W(`approvalHistory.columns.source`,V(e),!0)}
                        ${W(`approvalHistory.columns.resolver`,H(e),!0)}
                      </tr>
                    `)}
          </tbody>
        </table>
      </div>
      <div class="data-table-pagination">
        <div class="data-table-pagination__info">${d(`approvalHistory.retention`)}</div>
        <div class="data-table-pagination__controls">
          ${this.nextCursor?x`
                  <button
                    ?disabled=${this.loadKind===`more`}
                    @click=${()=>void this.loadPage(!1)}
                  >
                    ${this.loadKind===`more`?d(`approvalHistory.loadingMore`):d(`approvalHistory.loadMore`)}
                  </button>
                `:b}
        </div>
      </div>
    `}render(){let e=D(x`
        ${this.connected?b:x`<div class="callout warn" role="status">${d(`approvalHistory.offline`)}</div>`}
        ${this.connected&&!this.approvalsAccess?x`
                <div class="callout warn" role="status">
                  ${d(`common.disabled`)} · <code>${K}</code>
                </div>
              `:b}
        ${this.approvalsAccess&&this.error?x`
                <div class="callout danger" role="alert">
                  ${this.error}
                  <button class="btn btn--sm" @click=${()=>void this.loadPage(!0)}>
                    ${d(`common.retry`)}
                  </button>
                </div>
              `:b}
        ${this.approvalsAccess?this.renderGrants():b}
        ${this.approvalsAccess?M({title:x`<span id="approval-history-title">
                    ${d(`standingGrants.historyTitle`)}
                  </span>`},this.renderTable()):b}
      `,{wide:!0});return x`
      ${k({title:m(`approvals`),subtitle:x`${d(`approvalHistory.description`)}
        ${A(q)}`})}
      ${P(e)}
    `}},E([ne({context:_,subscribe:!0})],Q.prototype,`context`,void 0),E([w()],Q.prototype,`items`,void 0),E([w()],Q.prototype,`grants`,void 0),E([w()],Q.prototype,`grantsError`,void 0),E([w()],Q.prototype,`revokingGrantId`,void 0),E([w()],Q.prototype,`nextCursor`,void 0),E([w()],Q.prototype,`loadKind`,void 0),E([w()],Q.prototype,`error`,void 0),E([w()],Q.prototype,`connected`,void 0),E([w()],Q.prototype,`approvalsAccess`,void 0),customElements.get(`zero-approvals-page`)||customElements.define(`zero-approvals-page`,Q)})))()}$();
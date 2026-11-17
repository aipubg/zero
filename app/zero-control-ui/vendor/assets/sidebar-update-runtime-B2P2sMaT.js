import{n as e,r as t}from"./rolldown-runtime-8BhlS34s.js";import{Au as n,Nu as r,Pu as i,zu as a}from"./control-ui-core-DCNBgr3X.js";import{Ct as o,Fi as s,St as c,ca as l,d as u,dt as d,ft as f,gt as p,ht as m,l as h,sa as g,xt as _}from"./control-ui-core-DwX5Mpz4.js";import{G as v,J as y,W as b,Z as x,at as S,rt as C}from"./lit-runtime-B40xFCK_.js";import{En as w,Tn as T}from"./control-ui-boot-shared-BX8huZUb.js";import{Zr as E}from"./ui-AaV6iNVa.js";import{Er as D,Tr as O,d as k,f as A,ia as j,oa as M,ra as N,sa as P}from"./control-ui-boot-shared-ZuP0LiFD.js";import{cl as F,sl as I}from"./control-ui-boot-shared-CzJHozXQ.js";var L=t({}),R;function z(){return(z=e((()=>{b(),x(),o(),u(),N(),m(),i(),T(),r(),F(),l(),O(),k(),s(),M(),w(),R=class extends n{constructor(...e){super(...e),this.compact=!1,this.updateSchedule=null,this.heldUpdateCampaignId=null,this.updateBusy=!1,this.updateRun=null,this.updateRunAcknowledged=!1,this.connected=!0,this.onCheckStatus=void 0,this.onAcknowledge=void 0,this.statusBanner=null,this.watchUpdateProgress=void 0,this.canUpdate=!1,this.canHoldUpdate=!1,this.onUpdate=()=>void 0,this.refreshRequired=!1,this.onRefresh=async()=>!1,this.onHoldUpdate=async()=>!1,this.onReviewUpdate=()=>void 0,this.onDismiss=void 0,this.holdingCampaignId=null,this.nativeUpdateAvailable=c(),this.refreshInFlight=!1,this.refreshFailed=!1,this.refreshAttempt=0,this.countdownPolling=new I(this,1e3,()=>this.requestUpdate(),!1),this.handleNativeUpdateAvailabilityChanged=()=>{this.nativeUpdateAvailable=c()},this.openRun=()=>{this.updateRun&&this.confirmUpdate(this.updateRun)},this.startUpdate=()=>{let e=this.updateSchedule?.campaign;!this.updateBusy&&e?.state!==`applying`&&this.canUpdate&&this.confirmUpdate()},this.holdUpdate=async e=>{this.holdingCampaignId=e,await this.onHoldUpdate(),this.holdingCampaignId=null},this.refreshControlUi=async()=>{if(this.refreshInFlight)return;this.refreshInFlight=!0,this.refreshFailed=!1;let e=++this.refreshAttempt,t=!1;try{t=await this.onRefresh()}catch{}e===this.refreshAttempt&&this.refreshRequired&&(t||(this.refreshInFlight=!1,this.refreshFailed=!0))}}connectedCallback(){super.connectedCallback(),this.nativeUpdateAvailable=c(),window.addEventListener(_,this.handleNativeUpdateAvailabilityChanged)}disconnectedCallback(){window.removeEventListener(_,this.handleNativeUpdateAvailabilityChanged),super.disconnectedCallback()}willUpdate(e){super.willUpdate(e),e.has(`refreshRequired`)&&!this.refreshRequired&&(this.refreshAttempt+=1,this.refreshInFlight=!1,this.refreshFailed=!1)}updated(e){if(super.updated(e),e.has(`updateSchedule`)){let e=this.updateSchedule?.campaign?.state;e===`countdown`||e===`waiting-for-idle`?this.countdownPolling.start():this.countdownPolling.stop()}}renderStatus(){let e=this.updateRun?null:this.statusBanner;return e?y`<div
          class="sidebar-update-card__status sidebar-update-card__status--${e.tone}"
          role="alert"
        >
          ${e.text}
        </div>`:v}confirmUpdate(e){h({existingRun:e,startGatewayUpdate:()=>this.onUpdate(),onCheckStatus:this.onCheckStatus,onReviewUpdate:this.onReviewUpdate,onAcknowledge:this.onAcknowledge,watchUpdateProgress:this.watchUpdateProgress,updateAvailable:null,updateSchedule:this.updateSchedule,viaNativeApp:c()})}compactSummary(){if(this.refreshRequired)return{detail:a(`chat.sidebar.serverUpdatedRefresh`),icon:g.refresh,severity:`warning`,title:a(`chat.sidebar.serverUpdatedTitle`)};if(D(this.updateRun,this.updateRunAcknowledged)&&this.updateRun){let e=j(this.updateRun,this.connected);return{title:e.headline,detail:e.compactLabel,timestampMs:this.updateRun.status===`running`?this.updateRun.createdAtMs:this.updateRun.finishedAtMs,icon:this.updateRun.status===`running`?g.refresh:this.updateRun.status===`succeeded`?g.check:g.alertTriangle,severity:this.updateRun.status===`failed`?`error`:`warning`,critical:!1}}let e=this.updateSchedule?.campaign,t=this.updateBusy||e?.state===`applying`,n=this.updateRun?null:this.statusBanner;if(!n&&!p(null,this.updateSchedule,t))return null;let r=f(this.updateSchedule,null),i=d(this.updateSchedule),o=n&&n.tone!==`info`,s=n?.text.trim()||a(`updates.sidebar.blockedSummary`);return{timestampMs:e?.announcedAtMs,detail:o?e?.state===`waiting-for-idle`&&r?a(`updates.sidebar.blockedWaiting`,{target:r}):r?`${r} · ${s}`:s:i&&r?a(`updates.sidebar.campaignTarget`,{status:i,target:r}):i??r??n?.text??a(`updates.sidebar.availableSummary`),icon:n?g.alertTriangle:t?g.refresh:g.download,critical:!!o,severity:n?.tone===`danger`?`error`:`warning`,title:a(o?`updates.sidebar.blockedTitle`:t?`updates.sidebar.updating`:`updates.sidebar.availableTitle`)}}renderCompact(){let e=this.compactSummary();return e?A({...e,onDismiss:this.onDismiss,body:this.renderCompactDetails(),bodyClass:`sidebar-update-issue__body`}):v}renderCompactDetails(){let e=this.updateRun?null:this.statusBanner;return e?y`<div class="sidebar-update-card sidebar-update-card--compact-details">
      <p class="sidebar-update-card__compact-reason" title=${e.text}>
        ${e.text}
      </p>
      <div class="sidebar-update-card__compact-actions">
        <button
          class="sidebar-update-card__review sidebar-update-card__review--primary"
          type="button"
          @click=${this.onReviewUpdate}
        >
          ${a(`updates.reviewUpdate`)}
        </button>
        ${this.renderHoldUpdate()}
      </div>
    </div>`:this.renderCard()}renderHoldUpdate(){let e=this.updateSchedule?.campaign;return!e||e.state===`applying`||!this.canUpdate||!this.canHoldUpdate||this.updateBusy||e.holdUntilMs!==void 0&&e.holdUntilMs>Date.now()||this.heldUpdateCampaignId===e.id?v:y`<button
      class="sidebar-update-card__hold"
      type="button"
      ?disabled=${this.holdingCampaignId===e.id}
      @click=${()=>this.holdUpdate(e.id)}
    >
      ${a(`updates.holdOneHour`)}
    </button>`}renderCard(){if(this.refreshRequired)return y`
        <div class="sidebar-update-card" role="status" aria-live="polite">
          ${this.renderStatus()}
          ${this.refreshFailed?y`<div
                  class="sidebar-update-card__status sidebar-update-card__status--warn"
                  role="alert"
                >
                  ${a(`connection.actionsUnavailable`)}
                </div>`:v}
          <button
            class="sidebar-update-card__action ${this.refreshInFlight?`sidebar-update-card__action--busy`:``}"
            type="button"
            ?disabled=${this.refreshInFlight}
            aria-busy=${this.refreshInFlight?`true`:`false`}
            @click=${this.refreshControlUi}
          >
            <span class="sidebar-update-card__icon" aria-hidden="true">${g.refresh}</span>
            <span class="sidebar-update-card__text sidebar-update-card__text--stacked">
              <span class="sidebar-update-card__title"
                >${a(`chat.sidebar.serverUpdatedTitle`)}</span
              >
              <span class="sidebar-update-card__subtitle"
                >${this.refreshInFlight?a(`lazyView.reloading`):this.refreshFailed?a(`connection.retryNow`):a(`chat.sidebar.serverUpdatedRefresh`)}</span
              >
            </span>
          </button>
        </div>
      `;if(D(this.updateRun,this.updateRunAcknowledged)&&this.updateRun){let e=j(this.updateRun,this.connected);return y`<div class="sidebar-update-card" role="status" aria-live="polite">
        <button class="sidebar-update-card__action" type="button" @click=${this.openRun}>
          <span class="sidebar-update-card__icon" aria-hidden="true"
            >${this.updateRun.status===`running`?g.refresh:this.updateRun.status===`succeeded`?g.check:g.alertTriangle}</span
          >
          <span class="sidebar-update-card__text sidebar-update-card__text--stacked">
            <span class="sidebar-update-card__title">${e.headline}</span>
            ${e.compactLabel?y`<span class="sidebar-update-card__subtitle">${e.compactLabel}</span>`:v}
          </span>
        </button>
      </div>`}let e=null,t=this.updateSchedule?.campaign,n=this.updateBusy||t?.state===`applying`,r=this.updateRun?null:this.statusBanner,i=p(e,this.updateSchedule,n);if(!r&&!i)return v;let o=this.nativeUpdateAvailable?a(`chat.sidebar.updateMacAndGateway`):a(`chat.sidebar.updateGateway`),s=e?.channel===`beta`?` (beta)`:``,c=d(this.updateSchedule),l=f(this.updateSchedule,e),u=c?l?a(`updates.sidebar.campaignTarget`,{status:c,target:l}):c:n?a(`updates.sidebar.updating`):l?`${o} · ${l}${s}`:o,m=t?.state===`countdown`||t?.state===`waiting-for-idle`,h=y`<button
      class="sidebar-update-card__action ${n?`sidebar-update-card__action--busy`:``}"
      type="button"
      aria-disabled=${this.canUpdate?v:`true`}
      ?disabled=${n}
      @click=${this.startUpdate}
    >
      <span class="sidebar-update-card__icon" aria-hidden="true"
        >${n?g.refresh:g.download}</span
      >
      <span
        class="sidebar-update-card__text"
        role=${m?`timer`:v}
        aria-live=${m?`off`:v}
        >${u}</span
      >
    </button>`;return y`
      <div
        class="sidebar-update-card"
        role=${t?v:`status`}
        aria-live=${t?v:`polite`}
      >
        ${this.renderStatus()}
        ${i?y`<div class="sidebar-update-card__actions">
                ${this.canUpdate?h:y`<zero-tooltip open-on-click .content=${a(`updates.adminRequired`)}>
                        ${h}
                      </zero-tooltip>`}
                ${this.renderHoldUpdate()}
              </div>`:v}
        ${r?y`<button
                class="sidebar-update-card__review"
                type="button"
                @click=${this.onReviewUpdate}
              >
                ${a(`updates.reviewUpdate`)}
              </button>`:v}
        ${i&&!n?P(this.updateSchedule,null):v}
      </div>
    `}render(){return this.compact?this.renderCompact():this.renderCard()}},E([S({attribute:!1})],R.prototype,`compact`,void 0),E([S({attribute:!1})],R.prototype,`updateAvailable`,void 0),E([S({attribute:!1})],R.prototype,`updateSchedule`,void 0),E([S({attribute:!1})],R.prototype,`heldUpdateCampaignId`,void 0),E([S({attribute:!1})],R.prototype,`updateBusy`,void 0),E([S({attribute:!1})],R.prototype,`updateRun`,void 0),E([S({attribute:!1})],R.prototype,`updateRunAcknowledged`,void 0),E([S({attribute:!1})],R.prototype,`connected`,void 0),E([S({attribute:!1})],R.prototype,`onCheckStatus`,void 0),E([S({attribute:!1})],R.prototype,`onAcknowledge`,void 0),E([S({attribute:!1})],R.prototype,`statusBanner`,void 0),E([S({attribute:!1})],R.prototype,`watchUpdateProgress`,void 0),E([S({attribute:!1})],R.prototype,`canUpdate`,void 0),E([S({attribute:!1})],R.prototype,`canHoldUpdate`,void 0),E([S({attribute:!1})],R.prototype,`onUpdate`,void 0),E([S({attribute:!1})],R.prototype,`refreshRequired`,void 0),E([S({attribute:!1})],R.prototype,`onRefresh`,void 0),E([S({attribute:!1})],R.prototype,`onHoldUpdate`,void 0),E([S({attribute:!1})],R.prototype,`onReviewUpdate`,void 0),E([S({attribute:!1})],R.prototype,`onDismiss`,void 0),E([C()],R.prototype,`holdingCampaignId`,void 0),E([C()],R.prototype,`nativeUpdateAvailable`,void 0),E([C()],R.prototype,`refreshInFlight`,void 0),E([C()],R.prototype,`refreshFailed`,void 0),customElements.get(`zero-sidebar-update-card`)||customElements.define(`zero-sidebar-update-card`,R)})))()}export{L as n,z as t};
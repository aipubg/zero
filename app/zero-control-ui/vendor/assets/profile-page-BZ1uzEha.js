const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./user-prefs-request-a2YjsduW.js","./gateway-runtime-JSfC8ThO.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-core-DI-Q_yCI.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Au as t,Gu as n,Ic as r,Lc as i,Nu as a,Pu as o,Si as s,Wu as c,bl as l,dt as u,fu as d,g as f,hl as p,ju as m,ll as ee,lt as te,m as ne,ot as re,p as ie,st as ae,uu as oe,xl as se,xu as h,yu as g,zu as _}from"./control-ui-core-DCNBgr3X.js";import{Aa as ce,Ai as v,Ba as le,Cr as y,Ft as ue,It as de,Lt as fe,Sr as b,bo as pe,go as me,ha as he,jt as ge,ki as x,ma as _e,or as ve,sr as ye,wr as S,yr as be,za as xe}from"./control-ui-core-DwX5Mpz4.js";import{G as C,J as w,W as T,Z as E,at as D,rt as O}from"./lit-runtime-B40xFCK_.js";import{er as Se,nr as Ce,rr as we,tr as Te}from"./control-ui-boot-shared-BRtBCr5s.js";import{At as Ee,Ca as De,Sa as Oe,jt as ke,kt as Ae,o as k,s as A}from"./control-ui-boot-shared-BX8huZUb.js";import{Ur as j,Wr as M,Zr as N,ma as je,pa as Me,xa as Ne}from"./ui-AaV6iNVa.js";import{B as P,Ci as Pe,Fi as Fe,G as Ie,I as F,Li as Le,R as Re,Rr as ze,Si as Be,Ti as Ve,U as He,V as I,W as Ue,X as We,Y as L,Z as R,dn as Ge,et as Ke,fn as qe,l as Je,q as z,tt as B,u as Ye}from"./control-ui-boot-shared-ZuP0LiFD.js";import{r as Xe,t as Ze}from"./wizard-step-controls-TPQ3zrjY.js";import{o as V,r as H}from"./settings-targets-C_s4rJ3N.js";import{a as Qe,c as $e,d as et,i as tt,l as nt,n as rt,r as it,s as at,t as ot,u as st}from"./github-identity-view-yg2qfM06.js";var U,W,G;function K(){return(K=e((()=>{n(),U=c.profilePage.identity,W={profilePage:{access:{title:`Your access`,admin:`You have permission to manage this server.`,write:`You have permission to send messages and make changes.`,read:`You have permission to view server information.`,sessionWrite:`You have permission to work in your own sessions.`,sessionRead:`You have permission to view your own sessions.`,limited:`This connection has a limited set of permissions.`,limits:`Sessions, browsers, and tools may have additional restrictions.`,help:`Missing something you need?`,nextStep:`Ask your server administrator to review your access. Reconnect after they make changes.`,reconnect:`Reconnect`,connecting:`Connecting… Your access will appear when the connection is ready.`,details:`Technical details`,description:`These permissions were granted when you connected. A role can limit them, but does not grant extra permissions.`,scopes:`Granted scopes`,unknown:`Your permissions could not be confirmed.`,none:`This connection has no permissions.`},identity:{title:U.title,menuLabel:U.menuLabel,menuButtonLabel:U.menuButtonLabel,description:U.description,loading:`Loading your identity…`,profileUnavailable:`Your identity profile could not be loaded.`,unidentified:`This connection has no personal profile; sign in through Cloudflare Access, Tailscale Serve, or a trusted proxy to set a name and avatar.`,writeRequired:`Your current access does not allow profile editing.`,avatar:U.avatar,avatarDescription:`PNG, JPEG, or WebP. Images are resized to 256 × 256 or smaller.`,chooseAvatar:U.chooseAvatar,processingAvatar:`Processing…`,displayName:U.displayName,displayNameDescription:`Shown to other people using this gateway.`,linkedEmails:U.linkedEmails,linkedEmailsDescription:`Email addresses connected to this profile.`,githubAccount:`GitHub account`,githubAccountDescription:`Verified sign-in identity, not permission to publish. Manage publishing access under GitHub connections below.`,githubVerified:`Verified from your GitHub-backed sign-in`,githubUnavailable:`Unavailable`,githubUnavailableDescription:`GitHub-backed sign-in is unavailable. Refresh to retry.`,ownerGithubDescription:`GitHub-backed sign-in through Cloudflare Access or Tailscale Serve provides this identity.`,gitCoauthor:`Git co-author credit`,gitCoauthorDescription:`Adds this account's public GitHub noreply address to commits created from shared sessions. Turning it off affects future commits only.`,gitCoauthorUnavailable:`Available after your GitHub-backed sign-in is verified. Refresh to retry.`,ownerGitCoauthorDescription:`Requires GitHub-backed sign-in through Cloudflare Access or Tailscale Serve.`,avatarErrors:{invalid:`That image could not be processed.`,sourceTooLarge:`Choose an image that is 10 MB or smaller.`,tooLarge:`The processed avatar is larger than 512 KB.`}}}},G=Object.assign(()=>{c.profilePage.access=W.profilePage.access,Object.assign(c.profilePage.identity,W.profilePage.identity)},{catalog:W})})))()}var q;function ct(){return(ct=e((()=>{M(),T(),E(),me(),v(),S(),F(),o(),st(),se(),a(),V(),nt(),ot(),q=class extends m{constructor(...e){super(...e),this.purpose=`personal`,this.setupOpen=!1,this.snapshot=null,this.revision=0,this.canRead=!1,this.canAdmin=!1,this.profileId=null,this.subscriptions=[],this.personal=new $e({requestUpdate:()=>this.requestUpdate(),authorizationSucceeded:()=>{this.setupOpen=!1}}),this.system=new $e({requestUpdate:()=>this.requestUpdate(),authorizationSucceeded:()=>{this.setupOpen=!1},runExternalMutation:(e,t)=>this.context.runtimeConfig.runExternalMutation(e,t)})}connectedCallback(){super.connectedCallback(),this.subscriptions=[this.context.gateway.subscribe(e=>this.applySnapshot(e)),this.context.agents.subscribe(()=>this.syncControllers()),this.context.settingsAgentSelection.subscribe(()=>this.syncControllers()),this.context.runtimeConfig.subscribe(()=>this.syncControllers())],this.applySnapshot(this.context.gateway.snapshot)}disconnectedCallback(){for(let e of this.subscriptions)e();this.subscriptions=[],this.personal.dispose(),this.system.dispose(),this.snapshot=null,this.revision+=1,super.disconnectedCallback()}applySnapshot(e){let t=this.snapshot,n=!t||t.client!==e.client||t.phase!==e.phase||t.hello!==e.hello||this.profileId!==(e.selfUser?.id??null);this.snapshot=e,this.profileId=e.phase===`connected`?e.selfUser?.id??null:null,this.canRead=e.phase===`connected`&&!!e.hello?.auth&&b(e.hello?.auth??null),this.canAdmin=this.canRead&&be(e.hello?.auth??null),n&&(this.revision+=1,this.setupOpen=!1,this.purpose=this.profileId?`personal`:`system`),this.syncControllers(),this.canAdmin&&this.context.runtimeConfig.ensureLoaded()}syncControllers(){let e=this.snapshot;if(!e)return;let t={client:e.client,connected:e.phase===`connected`,clientRevision:this.revision};this.personal.sync({...t,target:this.profileId?{kind:`personal`,profileId:this.profileId}:null,statusReadable:this.canRead&&this.profileId!==null,authorizable:this.canRead&&this.profileId!==null,configurable:!1});let n=this.context.settingsAgentSelection.state.selectedId;this.system.sync({...t,target:n?{kind:`shared`,scope:`system`,agentId:n,config:l(this.context.runtimeConfig.state)}:null,statusReadable:this.canAdmin,authorizable:this.canAdmin,configurable:this.canAdmin}),this.personal.statusReadable&&!this.personal.personal&&!this.personal.loading&&!this.personal.error&&this.personal.verify(),n&&this.canAdmin&&!this.system.status&&!this.system.loading&&!this.system.error&&this.system.verify(),this.requestUpdate()}get locked(){return this.personal.loading||this.system.loading||this.personal.authorizationActive||this.system.authorizationActive||this.personal.busy||this.system.busy}openSetup(e){this.locked||(e===`personal`?!this.profileId||!this.canRead:!this.canAdmin)||(this.purpose=e,this.setupOpen=!0)}render(){let e=this.personal.personal,t=this.system.status?.selected.identity??this.personal.system,n=this.context.settingsAgentSelection.state.selectedId,r=this.context.agents.state.agentsList?.agents?.find(e=>e.id===n),i=this.system.status?.effective??null,a=this.purpose===`personal`?this.personal:this.system,o=this.setupOpen||this.personal.authorizationActive||this.system.authorizationActive,s=e?.state===`connected`,c=e?.state===`unavailable`||e?.refreshState===`expired`||e?.refreshState===`failed`,l=this.profileId?_(c?`githubConnections.reconnectRequired`:s?`githubConnections.connected`:`githubConnections.disconnected`):_(`githubConnections.signInRequired`);return w`<div id=${H.githubConnections}>
      ${L({title:_(`githubConnections.title`),description:_(`githubConnections.description`),actions:this.canRead&&(this.profileId||this.canAdmin)?w`<button
                    class="btn btn--sm"
                    ?disabled=${this.locked||!this.profileId&&!this.system.status}
                    @click=${()=>this.openSetup(this.profileId?`personal`:`system`)}
                  >
                    ${_(`githubConnections.manage`)}
                  </button>
                  <button
                    class="btn btn--sm"
                    ?disabled=${this.locked}
                    @click=${()=>{this.personal.verify(),this.system.verify()}}
                  >
                    ${_(`agentTools.githubVerify`)}
                  </button>`:void 0},w`
          <div data-github-connection="personal">
            ${z({title:_(`githubConnections.mine`),description:this.profileId?w`${e?.account?`@${e.account.login} · `:``}${_(`githubConnections.personalDescription`)}`:_(`githubConnections.unboundDescription`),control:w`${this.profileId&&!e?at(this.personal):R({kind:c?`warn`:s?`ok`:`muted`,label:l})}
              ${this.profileId&&this.canRead&&e?w`<button
                      class="btn btn--sm"
                      ?disabled=${this.locked}
                      @click=${()=>this.openSetup(`personal`)}
                    >
                      ${_(s?`githubConnections.changeMine`:`githubConnections.connectMine`)}
                    </button>`:C}`})}
          </div>
          <div data-github-connection="system">
            ${z({title:_(`githubConnections.system`),description:w`${t?.account?`@${t.account.login} · `:``}${_(`githubConnections.systemDescription`)}`,control:w`${Qe(t,{loading:this.system.loading||this.personal.loading,error:this.system.error??this.personal.error})}${this.canAdmin?w`<button
                      class="btn btn--sm"
                      ?disabled=${this.locked||!this.system.status}
                      @click=${()=>this.openSetup(`system`)}
                    >
                      ${_(`githubConnections.changeSystem`)}
                    </button>`:B(_(`githubConnections.adminManaged`))}`})}
          </div>
          ${this.canAdmin&&n?w`<div data-github-connection="agent">
                  ${z({title:_(`githubConnections.agentFor`,{agent:r?.identity?.name??r?.name??n}),description:w`${i?.account?`@${i.account.login} · `:``}${i?_(i.source===`agent-override`?`githubConnections.agentOverride`:`githubConnections.system`):``}<br />${_(`githubConnections.agentDescription`)}`,control:w`${Qe(i,this.system)}<button
                        class="btn btn--sm"
                        @click=${()=>this.context.navigate(`agents`,{pathname:pe(n,`tools`,this.context.basePath)})}
                      >
                        ${_(`githubConnections.viewAgent`)}
                      </button>`})}
                </div>`:C}
          ${rt(this.personal.error??this.system.error,w`<button
              class="btn btn--sm"
              ?disabled=${this.locked}
              @click=${()=>{this.personal.verify(),this.system.verify()}}
            >
              ${_(`common.retry`)}
            </button>`)}
          ${o?w`<div class="settings-subrows" data-github-setup>
                  ${z({title:_(`githubConnections.purpose`),control:this.profileId&&this.canAdmin&&this.system.status?We({value:this.purpose,options:[{value:`personal`,label:_(`githubConnections.forMe`)},{value:`system`,label:_(`githubConnections.forSystem`)}],disabled:this.locked,ariaLabel:_(`githubConnections.purpose`),onChange:e=>this.openSetup(e)}):B(this.purpose===`personal`?_(`githubConnections.forMe`):_(`githubConnections.forSystem`))})}
                  ${it(a)}
                  ${this.locked?C:z({title:_(`githubConnections.purposeHint`),control:w`<button
                            class="btn btn--sm"
                            @click=${()=>{this.setupOpen=!1,a.hidePatFallback()}}
                          >
                            ${_(`common.close`)}
                          </button>`})}
                </div>`:C}
          <details class="settings-row settings-row--stacked">
            <summary class="settings-row__title">${_(`githubConnections.usage`)}</summary>
            <div class="settings-row__desc">${_(`githubConnections.usageDescription`)}</div>
            ${tt(t)}
          </details>
          ${this.canAdmin&&this.system.status?.selected.configured?z({title:_(`agentTools.githubUseNativeNewRuns`),description:_(`agentTools.githubSystemMutationHint`),control:w`<button
                    class="btn btn--sm"
                    ?disabled=${this.locked}
                    @click=${()=>void this.system.inherit()}
                  >
                    ${_(`agentTools.githubUseNativeNewRuns`)}
                  </button>`}):C}
        `)}
      ${this.profileId&&this.canRead&&e&&e.state!==`disconnected`?L({danger:!0},z({title:_(`githubConnections.disconnectMine`),description:_(`githubConnections.disconnectDescription`),control:w`<button
                  class="btn btn--sm"
                  ?disabled=${this.locked}
                  @click=${()=>void this.personal.disconnect()}
                >
                  ${_(`githubConnections.disconnectMine`)}
                </button>`})):C}
    </div>`}},N([j({context:x,subscribe:!1})],q.prototype,`context`,void 0),N([O()],q.prototype,`purpose`,void 0),N([O()],q.prototype,`setupOpen`,void 0),customElements.get(`zero-github-connections`)||customElements.define(`zero-github-connections`,q),et()})))()}function lt(e,t,n){return new Promise(r=>{e.toBlob(r,t,n)})}async function ut(e){if(![`image/png`,`image/jpeg`,`image/webp`].includes(e.type))throw new Y(`invalid-image`);if(e.size>ft)throw new Y(`source-too-large`);let t=URL.createObjectURL(e),n;try{n=new Image,n.decoding=`async`,n.src=t,await n.decode()}catch{throw new Y(`invalid-image`)}finally{URL.revokeObjectURL(t)}let{naturalWidth:r,naturalHeight:i}=n;if(!Number.isFinite(r)||!Number.isFinite(i)||r<=0||i<=0)throw new Y(`invalid-image`);let a=Math.min(r,i),o=Math.min(1,dt/a),c=Math.max(1,Math.round(a*o)),l=document.createElement(`canvas`);l.width=c,l.height=c;let u=l.getContext(`2d`);if(!u)throw new Y(`invalid-image`);u.drawImage(n,Math.max(0,Math.round((r-a)/2)),Math.max(0,Math.round((i-a)/2)),a,a,0,0,c,c);let d=e.type===`image/webp`?`image/webp`:`image/png`,f=await lt(l,d,d===`image/webp`?.9:void 0);if((!f||f.type!==d||f.size>J)&&(d=`image/webp`,f=await lt(l,d,.82)),!f||f.type!==d)throw new Y(`invalid-image`);if(f.size>J)throw new Y(`too-large`);let p=new Uint8Array(await f.arrayBuffer());return{mime:d,avatarBase64:s(p),byteLength:p.byteLength}}var dt,J,ft,Y;function pt(){return(pt=e((()=>{dt=512,J=524288,ft=10485760,Y=class extends Error{constructor(e){super(e),this.code=e,this.name=`ProfileAvatarError`}}})))()}function mt(e){let t=URL.parse(e);return t?`${t.origin}${t.pathname}`:_(`profilePage.modelAccounts.gatewayUnavailable`)}function ht(e,t){return e.some(e=>e.authProfileId!==t.authProfileId&&e.provider===t.provider&&e.label===t.label)?w` <code>${t.authProfileId}</code>`:``}function gt(e,t){let n=t.kind===`linked`,r=t.kind===`linked`?t.link:t.account,i=t.kind===`linked`?e.accounts.find(e=>e.authProfileId===t.link.authProfileId):t.account,a=t.kind===`linked`?i?.label??_(`profilePage.modelAccounts.gatewayAccount`):t.account.label,o=Pe(r.provider),s=_(n?`profilePage.modelAccounts.unlinkAction`:`profilePage.modelAccounts.selectAction`);return z({title:w`
      <span class="model-accounts__id">${a}</span>
      <span class="model-accounts__provider">${o}</span>
    `,description:w`${t.kind===`linked`?_(`profilePage.modelAccounts.linkedDescription`):_(`profilePage.modelAccounts.authTypes.${t.account.authType}`)}${i?ht(e.accounts,i):``}`,control:w`
      ${n?R({kind:`ok`,label:_(`profilePage.modelAccounts.linkedStatus`)}):C}
      <button
        type="button"
        class="btn btn--sm ${n?`profile-auth-link-unlink`:`profile-auth-account-select`}"
        data-auth-profile-id=${n?C:r.authProfileId}
        aria-label=${n?`${s}: ${o} · ${i?.label??r.authProfileId}`:`${s}: ${o} · ${a} (${r.authProfileId})`}
        ?disabled=${e.busy}
        @click=${()=>n?e.onUnlink(r.provider):e.onSelectAccount(r.authProfileId)}
      >
        ${s}
      </button>
    `})}function _t(e){let t=e.signIn;if(!t)return``;let n=t.providers.find(e=>e.id===t.provider),r=e.connectFlow,i=r?.step,a=w`<button
    type="button"
    class="btn btn--sm profile-auth-connect-cancel"
    ?disabled=${e.cancelBusy}
    @click=${r?e.onConnectCancel:e.onCloseSignIn}
  >
    ${_(`profilePage.modelAccounts.cancelAction`)}
  </button>`;return z({title:r?r.step?.title??n?.label??_(`profilePage.modelAccounts.connectAction`):_(`profilePage.modelAccounts.addAccount`),stacked:!0,control:r?w`<div class="model-accounts-flow">
          ${i?Xe({step:i,value:e.stepValue,busy:e.busy,inputId:`profile-account-auth-answer`,leadingAction:a,onValueChange:t=>e.onStepValueChange(i.id,t),onAnswer:t=>e.onStepAnswer(i.id,t)}):w`<span role="status">${_(`common.loading`)}</span>${a}`}
          ${e.statusUnavailable?w`<button
                  type="button"
                  class="btn btn--sm profile-auth-connect-check"
                  ?disabled=${e.cancelBusy}
                  @click=${e.onConnectCheck}
                >
                  ${_(`profilePage.modelAccounts.checkStatusAction`)}
                </button>`:``}
        </div>`:w`<div class="model-accounts-choice">
          ${qe({label:_(`profilePage.modelAccounts.provider`),className:`profile-auth-provider`,value:t.provider||null,options:t.providers.map(e=>({value:e.id,label:e.label})),disabled:e.busy,renderLeading:e=>Ve(e.value),onChange:e.onProviderChange})}
          ${n?qe({label:_(`profilePage.modelAccounts.method`),className:`profile-auth-method`,value:t.method||null,options:n.methods.map(e=>({value:e.id,label:e.label,description:e.hint})),disabled:e.busy,onChange:e.onMethodChange}):``}
          ${!e.busy&&!e.error&&t.providers.length===0?w`<span>${_(`profilePage.modelAccounts.noMethods`)}</span>`:``}
          <div class="wizard-step__actions">
            ${a}
            <button
              type="button"
              class="btn btn--sm primary profile-auth-connect-start"
              ?disabled=${e.busy||!t.method}
              @click=${e.onConnectStart}
            >
              ${_(`profilePage.modelAccounts.connectAction`)}
            </button>
          </div>
        </div>`})}function vt(e){return z({title:_(`profilePage.modelAccounts.inputLabel`),description:_(`profilePage.modelAccounts.inputDescription`),stackedOnNarrow:!0,control:w`
      <form
        class="model-accounts-form"
        @submit=${t=>{t.preventDefault(),e.onLink()}}
      >
        <input
          class="settings-input profile-auth-link-input"
          type="text"
          aria-label=${_(`profilePage.modelAccounts.inputLabel`)}
          .value=${e.linkDraft}
          placeholder=${_(`profilePage.modelAccounts.inputPlaceholder`)}
          ?disabled=${e.busy}
          @input=${t=>e.onLinkDraftInput(t.target.value)}
        />
        <button
          type="submit"
          class="btn btn--sm profile-auth-link-submit"
          ?disabled=${e.busy||!e.linkDraft.trim()}
        >
          ${_(`profilePage.modelAccounts.linkAction`)}
        </button>
      </form>
    `})}function yt(e){return w`
    ${e.links.length===0?P(_(`profilePage.modelAccounts.empty`)):e.links.map(t=>gt(e,{kind:`linked`,link:t}))}
    ${e.accounts.filter(e=>!e.selected).map(t=>gt(e,{kind:`saved`,account:t}))}
    ${e.hasMore?z({title:_(`profilePage.modelAccounts.savedAccounts`),control:w`<button
              type="button"
              class="btn btn--sm profile-auth-accounts-more"
              ?disabled=${e.busy}
              @click=${e.onLoadMore}
            >
              ${_(`profilePage.modelAccounts.loadMore`)}
            </button>`}):``}
    ${_t(e)} ${e.showManualLink?vt(e):``}
    ${[`notice`,`error`].map(t=>e[t]?w`<div
            class="settings-row model-accounts-${t}"
            role=${t===`notice`?`status`:`alert`}
          >
            <span class="settings-row__desc">${e[t]}</span>
          </div>`:``)}
    ${e.inventoryError?w`<div class="settings-row model-accounts-error" role="alert">
            ${_(`profilePage.modelAccounts.inventoryFailed`)} ${e.inventoryError}
          </div>`:``}
  `}function bt(e,t){let n=w`
    ${z({title:_(`profilePage.modelAccounts.gateway`),stackedOnNarrow:!0,control:B(mt(e.gatewayUrl),{mono:!0})})}
    ${z({title:_(`profilePage.modelAccounts.person`),stackedOnNarrow:!0,control:B(e.personLabel??_(`profilePage.modelAccounts.noPerson`))})}
    ${z({title:_(`profilePage.modelAccounts.scope`),description:_(`profilePage.modelAccounts.personalDescription`),control:B(_(`profilePage.modelAccounts.personal`))})}
    ${t?yt(t):z({title:_(`profilePage.modelAccounts.signInUnavailable`),description:_(`profilePage.modelAccounts.unavailable.${e.unavailableReason}`),stacked:!0,control:w`
              <button type="button" class="btn btn--sm" @click=${e.onConnectionSettings}>
                ${_(`profilePage.modelAccounts.connectionSettings`)}
              </button>
              ${Re(`http://127.0.0.1:18789/concepts/multi-user#per-person-model-accounts`)}
            `})}
  `;return L({title:_(`profilePage.modelAccounts.title`),description:_(`profilePage.modelAccounts.description`),actions:t?w`${t.signIn?``:w`<button
                    type="button"
                    class="btn btn--sm primary profile-auth-add-account"
                    ?disabled=${t.busy}
                    @click=${t.onAddAccount}
                  >
                    ${_(`profilePage.modelAccounts.addAccount`)}
                  </button>`}<button
              type="button"
              class="btn btn--sm profile-auth-accounts-refresh"
              ?disabled=${t.inventoryLoading}
              @click=${t.onRefresh}
            >
              ${_(`common.refresh`)}
            </button>`:void 0},n)}function xt(){return(xt=e((()=>{T(),Be(),Ge(),F(),Ze(),o(),k(),A()})))()}var X;function St(){return(St=e((()=>{M(),T(),E(),v(),S(),o(),k(),h(),te(),a(),xt(),A(),X=class extends t{constructor(...e){super(...e),this.identityId=null,this.profileId=null,this.personLabel=null,this.links=[],this.accounts=[],this.inventoryLoading=!1,this.inventoryError=null,this.action=null,this.error=null,this.notice=null,this.linkDraft=``,this.signIn=null,this.connectFlow=null,this.statusUnavailable=!1,this.target=null,this.generation=0,this.inventoryRequest=0,this.unsubscribe=null,this.unsubscribeEvents=null,this.pollTimer=null}connectedCallback(){super.connectedCallback(),this.unsubscribe=this.context.gateway.subscribe(e=>{this.applySnapshot(e),this.requestUpdate()}),this.unsubscribeEvents=this.context.gateway.subscribeEvents(e=>{u(e)&&this.loadAccounts()}),this.applySnapshot(this.context.gateway.snapshot)}disconnectedCallback(){this.unsubscribe?.(),this.unsubscribe=null,this.unsubscribeEvents?.(),this.unsubscribeEvents=null,this.generation+=1,this.target=null,this.stopPoll(),super.disconnectedCallback()}willUpdate(e){(e.has(`profileId`)||e.has(`identityId`))&&this.isConnected&&this.applySnapshot(this.context.gateway.snapshot)}applySnapshot(e){let t=e.phase===`connected`&&y(e.hello?.auth??null),n=t?e.client:null,r=e.selfUser?.id??null,i=n&&r===this.identityId?this.profileId:null,a=t&&be(e.hello?.auth??null);(this.target?.client!==n||this.target?.identityId!==r||this.target?.profileId!==i||this.target?.canAdmin!==a)&&(this.generation+=1,this.stopPoll(),this.target=n&&r&&i?{client:n,identityId:r,profileId:i,canAdmin:a}:null,this.links=[],this.accounts=[],this.nextCursor=void 0,this.inventoryRequest+=1,this.inventoryLoading=!1,this.inventoryError=null,this.action=null,this.error=null,this.notice=null,this.linkDraft=``,this.signIn=null,this.connectFlow=null,this.stepValue=void 0,this.statusUnavailable=!1,this.target&&this.loadAccounts())}applyLinks(e){this.links=e,this.accounts=this.accounts.map(t=>({...t,selected:e.some(e=>e.authProfileId===t.authProfileId)}))}async loadAccounts(e){let t=this.target;if(!t)return;let n=++this.inventoryRequest,r=()=>this.isConnected&&this.target===t&&n===this.inventoryRequest;this.inventoryLoading=!0,this.inventoryError=null;try{let n=await t.client.request(`users.listModelAccounts`,{profileId:t.profileId,...e?{cursor:e}:{}});r()&&(this.accounts=e?[...this.accounts,...n.accounts]:n.accounts,this.nextCursor=n.nextCursor,this.applyLinks(n.links))}catch(e){r()&&(this.inventoryError=g(e))}finally{r()&&(this.inventoryLoading=!1)}}isCurrent(e,t){return this.isConnected&&this.target===e&&this.generation===t}async runAction(e,t,n){let r=this.target;if(!r||this.action&&(e!==`cancel`||this.action!==`answer`))return;let i=++this.generation;this.stopPoll(),this.action=e,this.error=null,this.notice=null,this.statusUnavailable=!1;try{let e=await t(r);this.isCurrent(r,i)&&n(e)}catch(e){this.isCurrent(r,i)&&(this.error=g(e,_(`profilePage.modelAccounts.actionFailed`)))}finally{this.isCurrent(r,i)&&(this.action=null,this.schedulePoll(this.connectFlow?.step?2e3:0))}}updateAccount(e,t){if(e===`link`&&(!t||!this.target?.canAdmin))return;let n={link:`users.linkAuthProfile`,unlink:`users.unlinkAuthProfile`,select:`users.selectModelAccount`};this.runAction(`request`,r=>r.client.request(n[e],{profileId:r.profileId,...e===`unlink`?{provider:t}:{authProfileId:t}}),t=>{this.applyLinks(t.links),e!==`select`&&(this.linkDraft=``),this.notice=e===`unlink`?`cleared`:`selected`,this.loadAccounts()})}openSignIn(){this.signIn={providers:[],provider:``,method:``},this.runAction(`request`,e=>e.client.request(`users.authConnect.catalog`,{profileId:e.profileId}),e=>{this.signIn={providers:e.providers,provider:``,method:``}})}selectProvider(e){let t=this.signIn,n=t?.providers.find(t=>t.id===e);t&&n&&!this.action&&!this.connectFlow&&(this.signIn={...t,provider:e,method:n.methods.length===1?n.methods[0]?.id??``:``})}startConnect(){let e=this.signIn;e?.providers.some(t=>t.id===e.provider&&t.methods.some(t=>t.id===e.method))&&this.runAction(`request`,t=>t.client.request(`users.authConnect.start`,{profileId:t.profileId,provider:e.provider,method:e.method}),e=>{this.connectFlow=e,this.stepValue=void 0})}applyConnectStatus(e){if(e.status===`pending`){e.error&&(this.error=g(e.error)),this.connectFlow&&=(this.connectFlow.step?.id!==e.step?.id&&(this.stepValue=e.step?.sensitive?void 0:e.step?.initialValue),{...this.connectFlow,step:e.step});return}if(this.error=null,this.statusUnavailable=!1,this.stopPoll(),this.signIn=null,this.connectFlow=null,this.stepValue=void 0,e.status===`failed`){this.error=_(`profilePage.modelAccounts.connectErrors.${e.reason}`);return}e.status===`connected`&&(this.applyLinks(e.links),this.loadAccounts()),this.notice=e.status}connectStatus(e){let t=this.connectFlow;t&&this.runAction(e===`status`?`request`:e,n=>n.client.request(`users.authConnect.${e}`,{profileId:n.profileId,connectId:t.connectId}),e=>this.applyConnectStatus(e))}answerStep(e,t){let n=this.connectFlow,r=n?.step;n&&r&&r.id===e&&r.type!==`progress`&&(r.sensitive&&(this.stepValue=void 0),this.runAction(`answer`,e=>e.client.request(`users.authConnect.answer`,{profileId:e.profileId,connectId:n.connectId,stepId:r.id,...t===void 0?{}:{value:t}}),e=>this.applyConnectStatus(e)))}stopPoll(){this.pollTimer!==null&&(clearTimeout(this.pollTimer),this.pollTimer=null)}schedulePoll(e=2e3){this.stopPoll();let t=this.connectFlow;if(!t||!this.target||this.action)return;let n=Math.max(0,Math.min(e,t.expiresAtMs-Date.now()));this.pollTimer=setTimeout(()=>{this.pollTimer=null,this.pollStatus()},n)}async pollStatus(){let e=this.target,t=this.connectFlow,n=this.generation;if(e&&t&&!this.action)try{let r=await e.client.request(`users.authConnect.status`,{profileId:e.profileId,connectId:t.connectId});if(!this.isCurrent(e,n)||this.connectFlow?.connectId!==t.connectId)return;this.applyConnectStatus(r),this.connectFlow&&(Date.now()>=t.expiresAtMs?(this.statusUnavailable=!0,this.error=_(`profilePage.modelAccounts.statusTimedOut`)):this.schedulePoll())}catch(t){this.isCurrent(e,n)&&(this.statusUnavailable=!0,this.error=g(t,_(`profilePage.modelAccounts.statusFailed`)))}}render(){let e=this.context.gateway.snapshot;if(e.phase!==`connected`||!e.client)return C;let t=e.selfUser?.id===this.identityId?e.selfUser:null;return bt({gatewayUrl:(this.target?.client??e.client).gatewayUrl,personLabel:t?this.personLabel||t.name||t.email||_(`profilePage.modelAccounts.currentPerson`):null,unavailableReason:t?y(e.hello?.auth??null)?`profile`:`write`:`identity`,onConnectionSettings:()=>this.context.navigate(`connection`)},this.target?{links:this.links,accounts:this.accounts,hasMore:!!this.nextCursor,inventoryLoading:this.inventoryLoading,inventoryError:this.inventoryError,showManualLink:this.target.canAdmin,busy:this.inventoryLoading||this.action!==null,cancelBusy:this.action!==null&&this.action!==`answer`,error:this.error,notice:this.notice?_(`profilePage.modelAccounts.notices.${this.notice}`):null,statusUnavailable:this.statusUnavailable,linkDraft:this.linkDraft,signIn:this.signIn,connectFlow:this.connectFlow,stepValue:this.stepValue,onLinkDraftInput:e=>{this.linkDraft=e},onLink:()=>this.updateAccount(`link`,this.linkDraft.trim()),onUnlink:e=>this.updateAccount(`unlink`,e),onSelectAccount:e=>this.updateAccount(`select`,e),onLoadMore:()=>void this.loadAccounts(this.nextCursor),onRefresh:()=>void this.loadAccounts(),onAddAccount:()=>this.openSignIn(),onProviderChange:e=>this.selectProvider(e),onMethodChange:e=>{this.signIn&&!this.action&&!this.connectFlow&&(this.signIn={...this.signIn,method:e})},onCloseSignIn:()=>{!this.action&&!this.connectFlow&&(this.signIn=null,this.error=null)},onConnectStart:()=>this.startConnect(),onStepValueChange:(e,t)=>{this.connectFlow?.step?.id===e&&(this.stepValue=t)},onStepAnswer:(e,t)=>this.answerStep(e,t),onConnectCancel:()=>this.connectStatus(`cancel`),onConnectCheck:()=>this.connectStatus(`status`)}:null)}},N([j({context:x,subscribe:!1})],X.prototype,`context`,void 0),N([D({attribute:!1})],X.prototype,`identityId`,void 0),N([D({attribute:!1})],X.prototype,`profileId`,void 0),N([D({attribute:!1})],X.prototype,`personLabel`,void 0),N([O()],X.prototype,`links`,void 0),N([O()],X.prototype,`accounts`,void 0),N([O()],X.prototype,`nextCursor`,void 0),N([O()],X.prototype,`inventoryLoading`,void 0),N([O()],X.prototype,`inventoryError`,void 0),N([O()],X.prototype,`action`,void 0),N([O()],X.prototype,`error`,void 0),N([O()],X.prototype,`notice`,void 0),N([O()],X.prototype,`linkDraft`,void 0),N([O()],X.prototype,`signIn`,void 0),N([O()],X.prototype,`connectFlow`,void 0),N([O()],X.prototype,`stepValue`,void 0),N([O()],X.prototype,`statusUnavailable`,void 0),customElements.get(`zero-model-accounts`)||customElements.define(`zero-model-accounts`,X)})))()}var Z,Ct;function wt(){return(wt=e((()=>{n(),Z={profilePage:{personalInstructions:{signIn:`Sign in with your personal profile to edit your instructions. This requires operator.read access.`,noAgents:`No agents are available on this connection.`,guidance:`{count} / 4,000 characters. Keep it brief: preferences, context, and working style.`,missing:`Your personal file will be created when you save.`,tooLong:`Shorten your instructions to 4,000 characters before saving.`,reload:`Reload`,dirty:`Unsaved changes`,saved:`Saved`,discard:`Discard your unsaved instructions and load the saved file?`,failureHint:`Your draft is unchanged. If the file changed elsewhere, copy your draft, then reload before saving again.`,contextChanged:`The returned file does not match this profile and agent. Reload before trying again.`}}},Ct=Object.assign(()=>{Object.assign(c.profilePage.personalInstructions,Z.profilePage.personalInstructions)},{catalog:Z})})))()}var Q;function Tt(){return(Tt=e((()=>{M(),T(),E(),v(),S(),F(),o(),wt(),h(),a(),V(),Ct(),Q=class extends m{constructor(...e){super(...e),this.agentId=``,this.file=null,this.draft=``,this.busy=null,this.error=null,this.saved=!1,this.client=null,this.profileId=null,this.connectionId=null,this.gatewayUrl=null,this.available=!1,this.multipleProfiles=!1,this.generation=0,this.subscriptions=[],this.drafts=new Map}connectedCallback(){super.connectedCallback(),this.subscriptions=[this.context.gateway.subscribe(()=>this.syncContext()),this.context.agents.subscribe(()=>this.syncContext()),this.context.settingsAgentSelection.subscribe(()=>this.syncContext())],this.syncContext(),this.context.agents.ensureList()}disconnectedCallback(){this.subscriptions.forEach(e=>e()),this.subscriptions=[],this.generation+=1,this.client=null,this.available=!1,super.disconnectedCallback()}get agents(){return this.context.agents.state?.agentsList?.agents??[]}get dirty(){return this.file!==null&&this.draft!==this.file.content}syncContext(){let e=this.context.gateway.snapshot,t=e.phase===`connected`,n=e.selfUser?.id??this.profileId,r=this.context.gateway.connection.gatewayUrl,i=e.hello?.server?.connId??null;this.multipleProfiles=e.hello?.policy?.hasMultipleSessionSharingIdentities===!0;let a=t&&this.multipleProfiles&&!!e.selfUser?.id&&b(e.hello?.auth??null),o=n!==this.profileId||r!==this.gatewayUrl,s=o||e.client!==this.client||i!==this.connectionId||a!==this.available;s&&(this.client=e.client,this.connectionId=i,this.gatewayUrl=r,this.profileId=n,this.available=a,o&&(this.file=null,this.draft=``,this.agentId=``,this.drafts.clear()));let c=this.context.settingsAgentSelection.state.selectedId,l=this.agents.some(e=>e.id===c)?c:``,u=l!==this.agentId;if(u){this.dirty&&this.file?this.drafts.set(this.agentId,{file:this.file,content:this.draft}):this.drafts.delete(this.agentId),this.agentId=l;let e=this.drafts.get(l);this.drafts.delete(l),this.file=e?.file??null,this.draft=e?.content??``}(s||u)&&(this.generation+=1,this.busy=null,this.error=null,this.saved=!1),this.available&&this.agentId&&!this.dirty&&(s||u)&&this.load(),this.requestUpdate()}async load(){let e=this.client,t=this.agentId,n=this.profileId;e&&this.available&&t&&!this.busy&&await this.requestFile(`load`,{agentId:t,profileId:n},()=>e.request(`users.personalFile.get`,{agentId:t}))}async save(){let e=this.client,t=this.file;if(!e||!t||!this.available||this.busy||!this.dirty||t.agentId!==this.agentId||this.draft.length>4e3||!this.agents.some(e=>e.id===t.agentId))return;let n=this.draft;await this.requestFile(`save`,t,()=>e.request(`users.personalFile.set`,{agentId:t.agentId,content:n,expectedHash:t.hash}))}async requestFile(e,t,n){let r=++this.generation;this.busy=e,this.error=null,this.saved=!1;try{let i=await n();if(r!==this.generation)return;if(i.agentId!==t.agentId||i.profileId!==t.profileId)throw Error(_(`profilePage.personalInstructions.contextChanged`));this.file=i,this.draft=i.content,this.drafts.delete(i.agentId),this.saved=e===`save`}catch(e){r===this.generation&&(this.error=g(e))}finally{r===this.generation&&(this.busy=null)}}reload(){(!this.dirty||window.confirm(_(`profilePage.personalInstructions.discard`)))&&this.load()}render(){return this.multipleProfiles?w`<div id=${H.personalInstructions}>
      ${L({title:_(`profilePage.personalInstructions.title`),description:_(`profilePage.personalInstructions.description`)},this.available?this.agents.length?w`
                <div class="personal-instructions">
                  ${this.file?w`
                          <textarea
                            id="personal-instructions-content"
                            class="settings-input personal-instructions__editor"
                            rows="7"
                            .value=${this.draft}
                            ?disabled=${this.busy!==null}
                            aria-label=${_(`profilePage.personalInstructions.title`)}
                            aria-describedby="personal-instructions-guidance"
                            @input=${e=>{e.currentTarget instanceof HTMLTextAreaElement&&(this.draft=e.currentTarget.value,this.saved=!1)}}
                          ></textarea>
                          <div id="personal-instructions-guidance" class="settings-row__desc">
                            ${_(`profilePage.personalInstructions.guidance`,{count:String(this.draft.length)})}
                            ${this.file.missing?_(`profilePage.personalInstructions.missing`):C}
                          </div>
                          ${this.draft.length>4e3?w`<div role="alert">${_(`profilePage.personalInstructions.tooLong`)}</div>`:C}
                        `:C}
                  ${this.error?w`<div class="personal-instructions__error" role="alert">${this.error} ${_(`profilePage.personalInstructions.failureHint`)}</div>`:C}
                  <div class="personal-instructions__actions">
                    <button
                      class="btn"
                      ?disabled=${!this.file||!this.dirty||this.busy!==null||this.draft.length>4e3||!this.agents.some(e=>e.id===this.agentId)}
                      @click=${()=>void this.save()}
                    >
                      ${this.busy===`save`?_(`common.saving`):_(`common.save`)}
                    </button>
                    ${this.error?w`<button
                            class="btn"
                            ?disabled=${this.busy!==null}
                            @click=${()=>this.reload()}
                          >
                            ${_(`profilePage.personalInstructions.reload`)}
                          </button>`:C}
                    <span class="settings-row__desc" role="status"
                      >${this.dirty?_(`profilePage.personalInstructions.dirty`):this.saved?_(`profilePage.personalInstructions.saved`):C}</span
                    >
                  </div>
                </div>
              `:P(_(`profilePage.personalInstructions.noAgents`)):P(_(`profilePage.personalInstructions.signIn`)))}
    </div>`:C}},N([j({context:x,subscribe:!1})],Q.prototype,`context`,void 0),N([O()],Q.prototype,`agentId`,void 0),N([O()],Q.prototype,`file`,void 0),N([O()],Q.prototype,`draft`,void 0),N([O()],Q.prototype,`busy`,void 0),N([O()],Q.prototype,`error`,void 0),N([O()],Q.prototype,`saved`,void 0),customElements.get(`zero-personal-instructions`)||customElements.define(`zero-personal-instructions`,Q)})))()}function Et(e){let t=e.canWrite!==!1,n=e.profile.displayName??``,r=e.displayName.trim()!==n,i=e.profile.emails.join(`, `),a=e.profile.githubIdentity,o=e.profile.id===Se;return w`<div id=${H.identity}>
    ${L({title:_(`profilePage.identity.title`),description:_(`profilePage.identity.description`)},w`
        ${t?C:z({title:_(`profilePage.identity.writeRequired`)})}
        ${z({title:_(`profilePage.identity.avatar`),description:_(`profilePage.identity.avatarDescription`),control:w`
            <span class="identity-avatar-control">
              <zero-viewer-avatar
                .user=${{id:e.profile.id,name:e.profile.displayName??void 0,email:e.profile.emails[0],avatarUrl:e.avatarUrl??void 0,watchedSessions:[]}}
                variant="profile"
              ></zero-viewer-avatar>
              ${t&&f(e.config)?w`<button
                        type="button"
                        class="btn btn--sm"
                        ?disabled=${e.busy!==null}
                        @click=${n=>{let r=n.currentTarget,i=r instanceof HTMLButtonElement?r.nextElementSibling:null;t&&f(e.config)&&i instanceof HTMLInputElement&&i.click()}}
                      >
                        ${e.busy===`avatar`?_(`profilePage.identity.processingAvatar`):_(`profilePage.identity.chooseAvatar`)}
                      </button>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        hidden
                        ?disabled=${e.busy!==null}
                        @change=${n=>{let r=n.currentTarget,i=r.files?.[0];r.value=``,i&&t&&f(e.config)&&e.onAvatarSelect(i)}}
                      />`:C}
            </span>
          `})}
        ${z({title:_(`profilePage.identity.displayName`),description:_(`profilePage.identity.displayNameDescription`),control:w`
            <form
              class="identity-name-control"
              @submit=${t=>{t.preventDefault(),e.onSaveDisplayName()}}
            >
              <input
                class="settings-input"
                type="text"
                maxlength="256"
                aria-label=${_(`profilePage.identity.displayName`)}
                .value=${e.displayName}
                ?disabled=${!t||e.busy!==null}
                @input=${t=>e.onDisplayNameInput(t.currentTarget.value)}
              />
              <button
                type="submit"
                class="btn btn--sm"
                ?disabled=${!t||e.busy!==null||!r}
              >
                ${e.busy===`display-name`?_(`common.saving`):_(`common.save`)}
              </button>
            </form>
          `})}
        ${o?C:z({title:_(`profilePage.identity.linkedEmails`),description:_(`profilePage.identity.linkedEmailsDescription`),control:i?B(i):C})}
        ${z({title:_(`profilePage.identity.githubAccount`),description:_(o?`profilePage.identity.ownerGithubDescription`:a?`profilePage.identity.githubAccountDescription`:`profilePage.identity.githubUnavailableDescription`),control:a?w`
                <a
                  class="settings-account"
                  href=${a.profileUrl}
                  target=${Ae}
                  rel=${Ee()}
                >
                  <img class="settings-account__avatar" src=${a.avatarUrl} alt="" />
                  <span class="settings-row__value settings-row__value--mono"
                    >@${a.login}</span
                  >
                </a>
                ${R({kind:`ok`,label:_(`profilePage.identity.githubVerified`)})}
              `:R({kind:`muted`,label:_(`profilePage.identity.githubUnavailable`)})})}
        ${Ke({title:_(`profilePage.identity.gitCoauthor`),description:_(o?`profilePage.identity.ownerGitCoauthorDescription`:a?`profilePage.identity.gitCoauthorDescription`:`profilePage.identity.gitCoauthorUnavailable`),checked:!!(a&&e.gitCoauthorEnabled),disabled:!t||e.busy!==null||!a,onChange:e.onGitCoauthorChange})}
        ${e.error?w`<div class="settings-row identity-error" role="alert">
                <span class="settings-row__desc">${e.error}</span>
              </div>`:C}
      `)}
  </div>`}function Dt(){return(Dt=e((()=>{T(),Ce(),F(),o(),K(),ke(),ze(),ne(),V(),G()})))()}function Ot(e){let t=e.user?e.user.name?.trim()||e.user.email||_(`nav.owner`):e.identity?.name?.trim()||e.row.identity?.name?.trim()||e.row.name?.trim()||e.row.id,n=e.user?e.user.email:`@${e.row.id}`,r=e.user?null:d(e.row,e.identity),i=e.user?w`<zero-viewer-avatar
        .user=${{...e.user,name:t,watchedSessions:[]}}
        variant="profile"
      ></zero-viewer-avatar>`:Le({id:e.row.id,name:t,avatar:r?e.avatarLoader.resolve(r):null,textAvatar:p(e.row,e.identity)},``,r?e.avatarLoader.imageErrorHandler(r):void 0);return I(w`
    <section class="profile-hero">
      <div class="profile-hero__avatar">${i}</div>
      <div class="profile-hero__name">${t}</div>
      <div class="profile-hero__handle">
        ${n?w`<span class="profile-hero__email">${n}</span>`:C}
        <span class="profile-hero__badge">${_e().brandName}</span>
      </div>
    </section>
  `)}function kt(){return(kt=e((()=>{T(),he(),Fe(),F(),o(),ee(),oe(),ze()})))()}var At,$;function jt(){return(jt=e((()=>{M(),T(),E(),Ce(),ce(),v(),S(),ve(),ue(),F(),Je(),o(),k(),K(),h(),De(),ne(),a(),i(),V(),ct(),pt(),St(),Tt(),Dt(),re(),kt(),je(),A(),G(),At=`http://127.0.0.1:18789/concepts/user-model`,$=class extends m{constructor(){super(),this.selfUser=null,this.ownProfile=null,this.displayName=``,this.gitCoauthorEnabled=!0,this.identityLoading=!1,this.identityBusy=null,this.identityError=null,this.client=null,this.connected=!1,this.connecting=!1,this.canWrite=!1,this.connectionScopes=null,this.heroAvatarLoader=new Oe(this),this.identityRequestId=0,this.subscriptions=[],new r(this).watchStore(()=>this.context?.config).watchStore(()=>this.context?.theme)}connectedCallback(){super.connectedCallback(),this.subscriptions=[this.context.gateway.subscribe(e=>this.applyGatewaySnapshot(e)),this.context.gateway.subscribeEvents(e=>{!this.identityBusy&&e.event===`sessions.changed`&&Ne(e.payload)?.reason===`profile-identity`&&(this.identityRequestId+=1,this.identityLoading=!1,this.loadIdentity())}),this.context.agents.subscribe(()=>this.requestUpdate()),this.context.agentIdentity.subscribe(()=>this.requestUpdate())],this.applyGatewaySnapshot(this.context.gateway.snapshot)}disconnectedCallback(){for(let e of this.subscriptions)e();this.subscriptions=[],this.identityRequestId+=1,this.client=null,this.connected=!1,this.connecting=!1,this.canWrite=!1,this.connectionScopes=null,super.disconnectedCallback()}applyGatewaySnapshot(e){let t=e.client!==this.client,n=e.phase===`connected`,r=n&&y(e.hello?.auth??null),i=r!==this.canWrite,a=n!==this.connected,o=n?ge({snapshotUser:e.selfUser}):null,s=o?.id!==this.selfUser?.id||o?.identity?.id!==this.selfUser?.identity?.id,c=t||a||s||i;this.client=e.client,this.connected=n,this.connecting=e.phase===`connecting`||e.phase===`reconnecting`,this.canWrite=r,this.connectionScopes=n?e.hello?.auth?.scopes??null:null,this.selfUser=o,this.requestUpdate(),c&&(this.identityRequestId+=1,this.ownProfile=null,this.displayName=``,this.gitCoauthorEnabled=!0,this.identityLoading=!1,this.identityBusy=null,this.identityError=null),n&&e.client&&(c&&this.loadIdentity(),this.context.agents.ensureList().then(e=>{e&&this.context.agentIdentity.ensure([e.defaultId])}))}async loadIdentity(){let e=this.client;if(!e||!this.connected||this.identityLoading)return;let t=++this.identityRequestId,n=this.ownProfile,r=this.displayName,i=n!==null&&r.trim()!==(n.displayName??``);this.identityLoading=!0,this.identityError=null;try{let n=await this.context.gateway.loadSelfProfile();if(t!==this.identityRequestId||(this.ownProfile=n,!n))return;if(this.displayName=i?r:n.displayName??``,this.gitCoauthorEnabled=!0,n.githubIdentity){let{loadUserPreferences:r}=await Me(async()=>{let{loadUserPreferences:e}=await import(`./user-prefs-request-a2YjsduW.js`).then(e=>(e.t(),e.r));return{loadUserPreferences:e}},__vite__mapDeps([0,1,2,3]),import.meta.url);if(t!==this.identityRequestId)return;let i=await r(e,n.id,{keys:[Te]});if(t!==this.identityRequestId)return;this.gitCoauthorEnabled=i.status===`ok`&&we(i.entries[`git.coauthor.enabled`])}}catch(e){t===this.identityRequestId&&(this.identityError=g(e,_(`profilePage.identity.profileUnavailable`)))}finally{t===this.identityRequestId&&(this.identityLoading=!1)}}async saveIdentity(e){let t=this.client,n=this.ownProfile;if(!t||!n||!this.canWrite||this.identityBusy||this.identityLoading||e.kind===`git-coauthor`&&!n.githubIdentity)return;this.identityBusy=e.kind,this.identityError=null;let r=this.identityRequestId,i=()=>t===this.client&&r===this.identityRequestId;try{switch(e.kind){case`display-name`:{let e=await t.request(`users.setDisplayName`,{profileId:n.id,displayName:this.displayName.trim()||null});if(!i())return;this.ownProfile=e.profile,this.displayName=e.profile.displayName??``,this.context.gateway.updateSelfUser?.({name:e.profile.displayName??void 0});break}case`avatar`:{ie(this.context.config);let r=this.displayName,a=r.trim()!==(n.displayName??``),o=this.selfUser?.id===n.id?this.selfUser.avatarUrl:void 0,s=await ut(e.file);if(!i())return;ie(this.context.config);let c=await t.request(`users.setAvatar`,{profileId:n.id,mime:s.mime,avatarBase64:s.avatarBase64});if(!i())return;this.ownProfile=c.profile,this.displayName=a?r:c.profile.displayName??``;let l=ae(this.context.gateway.connection.gatewayUrl,c.profile.id,c.avatarRevision,this.context.resourceBasePath),u=this.selfUser?.id===c.profile.id&&this.selfUser.avatarUrl!==o;l&&!u&&this.context.gateway.updateSelfUser?.({avatarUrl:l});break}case`git-coauthor`:{let n=await fe(t,{entries:{[Te]:e.enabled}});if(!i())return;if(n.status!==`ok`)throw Error(_(`profilePage.identity.profileUnavailable`));this.gitCoauthorEnabled=e.enabled;return}}}catch(t){i()&&(this.identityError=e.kind===`avatar`&&t instanceof Y?_(t.code===`too-large`?`profilePage.identity.avatarErrors.tooLarge`:t.code===`source-too-large`?`profilePage.identity.avatarErrors.sourceTooLarge`:`profilePage.identity.avatarErrors.invalid`):g(t,_(`profilePage.identity.profileUnavailable`)));return}finally{i()&&this.identityBusy===e.kind&&(this.identityBusy=null)}i()&&this.loadIdentity()}renderIdentity(){if(!this.selfUser||!this.ownProfile)return w`<div id=${H.identity}>
        ${L({title:_(`profilePage.identity.title`)},this.identityLoading?He({label:_(`profilePage.identity.loading`),rows:2}):P(this.identityError??_(this.selfUser?`profilePage.identity.profileUnavailable`:`profilePage.identity.unidentified`)))}
      </div>`;let e=this.selfUser?.id===this.ownProfile.id&&this.selfUser.avatarUrl?this.selfUser.avatarUrl:ae(this.context.gateway.connection.gatewayUrl,this.ownProfile.id,this.ownProfile.updatedAt,this.context.resourceBasePath);return Et({config:this.context.config,profile:this.ownProfile,canWrite:this.canWrite,avatarUrl:e,displayName:this.displayName,gitCoauthorEnabled:this.gitCoauthorEnabled,busy:this.identityLoading?`loading`:this.identityBusy,error:this.identityError,onDisplayNameInput:e=>{this.displayName=e},onSaveDisplayName:()=>void this.saveIdentity({kind:`display-name`}),onAvatarSelect:e=>void this.saveIdentity({kind:`avatar`,file:e}),onGitCoauthorChange:e=>void this.saveIdentity({kind:`git-coauthor`,enabled:e})})}renderConnectionAccess(){let e=this.connectionScopes,t=e===null?`unknown`:e.length===0?`none`:[[`operator.admin`,`admin`],[`operator.write`,`write`],[`operator.sessions.write`,`sessionWrite`],[`operator.read`,`read`],[`operator.sessions.read`,`sessionRead`]].find(([t])=>e.includes(t))?.[1]??`limited`;return w`<div id="settings-profile-access">
      ${L({title:_(`profilePage.access.title`)},w`
          ${z({title:_(`profilePage.access.${t}`),description:_(`profilePage.access.limits`)})}
          ${z({title:_(`profilePage.access.help`),description:_(`profilePage.access.nextStep`),stackedOnNarrow:!0,control:w`<button
              type="button"
              class="btn"
              ?disabled=${this.identityBusy!==null}
              @click=${()=>this.context.gateway.connect()}
            >
              ${_(`profilePage.access.reconnect`)}
            </button>`})}
          <details class="settings-row settings-row--stacked">
            <summary>${_(`profilePage.access.details`)}</summary>
            ${z({title:_(`profilePage.access.scopes`),description:_(`profilePage.access.description`),stacked:!0,control:B(e===null?_(`profilePage.access.unknown`):e.length===0?_(`profilePage.access.none`):e.join(`, `),{mono:e!==null&&e.length>0})})}
          </details>
        `)}
    </div>`}refreshManually(){this.connected&&!this.identityBusy&&!this.identityLoading&&(this.client&&de(this.client),this.loadIdentity())}renderHero(){let e=this.context.agents.state.agentsList,t=e?.defaultId??`main`;return Ot({row:e?.agents.find(e=>e.id===t)??{id:t},user:this.selfUser,identity:this.context.agentIdentity.get(t),avatarLoader:this.heroAvatarLoader})}renderBody(){let e=this.connected&&this.client!==null,t=this.context.gateway.snapshot.hello?.policy?.hasMultipleSessionSharingIdentities===!0;return Ie(w`
      ${e?w`${this.renderHero()} ${this.renderConnectionAccess()} ${this.renderIdentity()}`:I(this.connecting?w`<div role="status">
                    ${P(_(`profilePage.access.connecting`))}
                  </div>`:P(_(`profilePage.offline`)))}
      <zero-personal-instructions
        ?hidden=${!e||!t}
      ></zero-personal-instructions>
      ${e?w`
              <zero-model-accounts
                .identityId=${this.selfUser?.id??null}
                .profileId=${this.ownProfile?.id??null}
                .personLabel=${this.ownProfile?this.ownProfile.displayName?.trim()||this.ownProfile.emails[0]||_(`profilePage.modelAccounts.currentPerson`):null}
              ></zero-model-accounts>
              <zero-github-connections></zero-github-connections>
              ${I(Ue({title:_(`profilePage.usageStatistics`),description:_(`profilePage.usageStatisticsDescription`),onClick:()=>this.context.navigate(`usage`)}))}
            `:C}
    `)}render(){return this.heroAvatarLoader.withActiveRoutes(()=>w`
        <section class="content-header" ${ye({toolbarHeader:!0})}>
          <div>
            <h1 class="page-title">${le(`profile`)}</h1>
            <div class="page-subtitle">
              ${xe(`profile`)} ${Re(At)}
            </div>
          </div>
          ${this.connected?w`<button
                  class="btn profile-refresh"
                  ?disabled=${this.identityLoading||this.identityBusy!==null}
                  @click=${()=>this.refreshManually()}
                >
                  ${this.identityLoading?_(`common.refreshing`):_(`common.refresh`)}
                </button>`:C}
        </section>
        ${Ye(this.renderBody())}
      `)}},N([j({context:x,subscribe:!1})],$.prototype,`context`,void 0),N([O()],$.prototype,`selfUser`,void 0),N([O()],$.prototype,`ownProfile`,void 0),N([O()],$.prototype,`displayName`,void 0),N([O()],$.prototype,`gitCoauthorEnabled`,void 0),N([O()],$.prototype,`identityLoading`,void 0),N([O()],$.prototype,`identityBusy`,void 0),N([O()],$.prototype,`identityError`,void 0),customElements.get(`zero-profile-page`)||customElements.define(`zero-profile-page`,$)})))()}jt();
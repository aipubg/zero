const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./channel-avatar-DWkGVoXS.js","./gateway-runtime-JSfC8ThO.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-boot-chat-D02HpoEK.js","./control-ui-boot-shared-CZXdmeIi.js","./control-ui-boot-shared-BRtBCr5s.js","./control-ui-boot-shared-4Y4EIRNw.js","./control-ui-boot-shared-E4pYPcWx.js","./plugin-contracts-runtime-BO_sRtcl.js","./control-ui-boot-shared-D2GHitQ4.js","./config-runtime-BecGLziM.js","./markdown-runtime-ORQpioyT.js","./control-ui-boot-chat-BVLkkfEk.js","./control-ui-boot-shared-BX8huZUb.js","./control-ui-boot-shared-styles-BXPMRytW.js","./sidebar-update-runtime-B2P2sMaT.js","./control-ui-boot-chat-Cx6CBnJr.js","./chat-transcript-styles-BN-TorbW.js","./control-ui-boot-chat-styles-BcslGtWC.js","./control-ui-core-DI-Q_yCI.css","./control-ui-boot-shared-styles-DUf4zEvn.css","./control-ui-boot-shared-DIWJGbGi.css","./sidebar-update-runtime-Bpn2ByHA.css","./chat-transcript-styles-B0IJwY9P.css","./control-ui-boot-chat-styles-SRk09zDG.css","./control-ui-boot-chat-C2DT0d4M.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Hs as t,Lu as n,Pu as r,Ql as i,Ul as a,kl as o,wl as s,zl as c,zu as l}from"./control-ui-core-DCNBgr3X.js";import{Di as u,Fi as d,Oi as f,Zt as p,ca as m,dr as h,go as g,sa as _,tn as v,ur as y,wo as ee}from"./control-ui-core-DwX5Mpz4.js";import{G as b,J as x,K as S,W as C,ct as te}from"./lit-runtime-B40xFCK_.js";import{Fo as w,N as ne,ci as re,ki as ie,ma as ae,pa as oe,wa as se}from"./ui-AaV6iNVa.js";import{Br as ce,Fn as T,Hr as le,In as E,Ln as ue,Lr as de,Mt as fe,Pn as D,Pr as pe,Pt as me,Rn as O,Rr as he,Ur as k,Vr as ge,_i as _e,fr as ve,kt as ye,ur as be,vi as xe,zr as A}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Lc as Se,zc as Ce}from"./control-ui-boot-shared-CzJHozXQ.js";import{h as we,p as Te}from"./control-ui-boot-chat-B3rfqCeq.js";import{b as Ee,y as De}from"./control-ui-boot-chat-DzIjAmFi.js";import{M as Oe,_ as ke,at as Ae,g as je,h as Me,j as Ne,ot as Pe,st as Fe}from"./control-ui-boot-chat-zkzP5WWm.js";function j(e,t,n,r=b){return x`<div class="session-hovercard__context-row" aria-label=${n} title=${r}>
    <span class="session-hovercard__context-icon" aria-hidden="true">${e}</span>
    <span class="session-hovercard__context-value session-hovercard__context-text">${t}</span>
  </div>`}function Ie(e){if(!e)return b;let t=l(e.status===`in_progress`?`sessionProgressCard.status.inProgress`:e.status===`paused`?`sessionProgressCard.status.paused`:`sessionProgressCard.status.pending`);return x`<div
    class="session-hovercard__context-row session-hovercard__plan-row"
    aria-label=${l(`sessionProgressCard.stepLabel`,{status:t,step:e.step})}
    title=${e.step}
  >
    <span class="session-hovercard__context-icon" aria-hidden="true"
      >${e.status===`in_progress`?x`<span class="session-run-spinner"></span>`:_.clock}</span
    >
    <span class="session-hovercard__context-value session-hovercard__plan-step"
      >${e.step}</span
    >
    <span class="session-hovercard__plan-count">${e.completed}/${e.total}</span>
  </div>`}function Le({row:e,automationLink:n},r){let i=e?.workContext,a=l(i?.kind===`project`?`sessionHovercard.projectLabel`:`sessionHovercard.workspaceLabel`),o=i?.kind===`project`?i.cwd:i?.path,s=o??i?.path,c=e?.placementProviderId&&e.placementProfileId?{label:`${e.placementProviderId} · ${e.placementProfileId}`,title:l(`sessionHovercard.runsOn`,{providerId:e.placementProviderId,profileId:e.placementProfileId})}:void 0,u=xe(e?.placementMachine),d=u.filter(Boolean).join(` · `);return x`<div class="session-hovercard__context">
    ${i?j(_.folder,i.name,`${a}: ${i.name}`,s?`${a}: ${s}`:b):b}
    ${i?.kind===`project`&&i.branch?j(_.gitBranch,i.branch,`${l(`sessionHovercard.branchLabel`)}: ${i.branch}`,o??b):b}
    ${c?j(_.server,c.label,c.title,c.title):b}
    ${c&&d?x`<div
            class="session-hovercard__machine"
            aria-label=${`${l(`sessionHovercard.machineLabel`)}: ${d}`}
          >
            ${u.map((e,t)=>e?x`<span class=${t===1?`session-hovercard__machine-class`:b}
                    >${e}</span
                  >`:b)}
          </div>`:b}
    ${e?.boardFace===`dashboard`?j(_.layoutDashboard,l(`sessionsView.opensAsDashboard`),l(`sessionsView.opensAsDashboard`)):b}
    ${e?.hasAutomation&&n?x`<a
            class="session-hovercard__context-row session-hovercard__automation-link"
            href=${n.href}
            @click=${e=>{t(e)&&(e.preventDefault(),n.navigate())}}
          >
            <span class="session-hovercard__context-icon" aria-hidden="true">${_.clock}</span>
            <span class="session-hovercard__context-value session-hovercard__context-text"
              >${l(`sessionsView.automationAttached`)}</span
            >
            <span class="session-hovercard__context-icon" aria-hidden="true"
              >${_.chevronRight}</span
            >
          </a>`:b}
    ${Ie(r)}
  </div>`}function M(){return(M=e((()=>{C(),r(),m(),_e()})))()}function N(e){return e.label?.trim()||e.identity.id}function Re(e,t,n){return e.identity.type===`profile`&&e.identity.id===n||JSON.stringify(e.identity)===JSON.stringify(t?.identity)}function P(e){return e.additions===void 0&&e.deletions===void 0?b:x`<span class="session-hovercard__diff">
    ${e.additions===void 0?b:x`<span class="session-hovercard__additions"
            >+${e.additions.toLocaleString()}</span
          >`}
    ${e.deletions===void 0?b:x`<span class="session-hovercard__deletions"
            >−${e.deletions.toLocaleString()}</span
          >`}
  </span>`}function ze(e){let t=Math.abs(e)/864e5;return t>=365?{value:Math.round(t/365),unit:`year`}:t>=28?{value:Math.round(t/30),unit:`month`}:t>=7?{value:Math.round(t/7),unit:`week`}:t>=1?{value:Math.round(t),unit:`day`}:ie(Math.abs(e))}function F(e,t){if(typeof e!=`number`||!Number.isFinite(e))return``;let r=e-Date.now(),{value:i,unit:a}=ze(r);return t?a===`second`&&r<=0?l(`common.justNow`):new Intl.RelativeTimeFormat(n.getLocale(),{numeric:`always`,style:`narrow`}).format(r<=0?-i:i,a):n.getLocale().toLowerCase().startsWith(`en`)?`${i}${{second:`s`,minute:`m`,hour:`h`,day:`d`,week:`w`,month:`mo`,year:`y`}[a]}`:new Intl.NumberFormat(n.getLocale(),{style:`unit`,unit:a,unitDisplay:`short`,maximumFractionDigits:0}).format(i)}function Be(e,t){let n=e.createdActor,r=n?.label?.trim()||n?.id?.trim(),i=new Set,a=0,o=(e.expandedParticipants??e.participants??[]).filter(e=>{let r=JSON.stringify(e.identity);return!i.has(r)&&(i.add(r),!Re(e,n,t)||(a+=1,!1))}),s=Math.max(o.length,(e.participantCount??0)-a);if(n&&r)return{creator:n,primaryIdentity:n.identity,primaryLabel:r,participants:o,otherCount:s};let c=o[0];if(c)return{primaryIdentity:c.identity,primaryLabel:N(c),participants:o,otherCount:Math.max(0,s-1)}}function Ve(e,t,n){let r=Math.max(0,t-e.length);return x`<div
    slot="content"
    class="session-hovercard__participant-menu"
    role="list"
    style="min-width: 150px; max-height: min(280px, 60vh); overflow-y: auto;"
    aria-label=${l(`sessionHovercard.moreParticipantsLabel`,{count:String(t)})}
  >
    ${e.map(e=>{let t=N(e),r=e.identity.type===`profile`?ce(e.identity.id,n,t):null;return x`<div role="listitem">
        ${k(t,r,`session-menu__item learn-more-link session-hovercard__participant-link`)}
      </div>`})}
    ${r>0?x`<div class="session-hovercard__more" role="listitem">
            ${l(`sessionHovercard.moreParticipantsLabel`,{count:String(r)})}
          </div>`:b}
  </div>`}function I({row:e,selfUserId:t,avatarAuth:n,personActivity:r}){if(!e)return b;let i=Be(e,t);if(!i)return b;let{creator:a,primaryIdentity:o,primaryLabel:s,participants:c,otherCount:u}=i,d=a?void 0:c[0],f=a??(d?{...d,id:d.identity.id}:void 0),p=o?.type===`profile`?ce(o.id,r,s):null,m=a?de(a):``,h=m?x`<span class="session-hovercard__creator-avatar-fallback" aria-hidden="true"
        >${m}</span
      >`:b;a&&e.channelAvatarUrl&&(qe??=oe(()=>import(`./channel-avatar-DWkGVoXS.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]),import.meta.url));let g=a&&e.channelAvatarUrl?x`<zero-channel-avatar
          class="session-hovercard__creator-avatar"
          .routeUrl=${e.channelAvatarUrl}
          .authTokens=${n?.authTokens??[]}
          .authReady=${n?.authReady??!1}
          .fallback=${h}
          aria-hidden="true"
        ></zero-channel-avatar>`:f?x`<zero-viewer-avatar
            class="session-hovercard__creator-avatar"
            .user=${{id:f.id,name:f.label,avatarUrl:f.avatarUrl,watchedSessions:[]}}
            .markAsViewer=${!1}
            .identity=${f.identity}
            variant="session"
            aria-hidden="true"
          ></zero-viewer-avatar>`:b,_=a?c:c.slice(1),v=[s,u>0?l(`sessionHovercard.moreParticipantsLabel`,{count:String(u)}):``].filter(Boolean).join(`, `),y=u>0?l(u===1?`sessionHovercard.attributionOther`:`sessionHovercard.attributionOthers`,{count:String(u)}):``;return x`<div class="session-hovercard__attribution" aria-label=${v}>
    <span class="session-hovercard__attribution-copy">
      ${k(s,p,`session-hovercard__attribution-name`)}
      ${u>0?_.length>0?x`<zero-tooltip
                class="session-hovercard__participants-tooltip"
                .describe=${!1}
                open-on-click
              >
                <button
                  type="button"
                  class="session-hovercard__attribution-others"
                  style="padding: 1px 3px; border: 0; border-radius: var(--radius-sm); background: transparent; font: inherit;"
                  aria-label=${l(`sessionHovercard.moreParticipantsLabel`,{count:String(u)})}
                >
                  ${y}
                </button>
                ${Ve(_,u,r)}
              </zero-tooltip>`:x`<span class="session-hovercard__attribution-others">${y}</span>`:b}
    </span>
    <span class="session-hovercard__attribution-avatars">
      ${le(g,p)}
      ${_.length>0?x`<zero-viewer-facepile
              .staticParticipants=${_}
              .totalCount=${u}
              .maxVisible=${Math.min(_.length,L)}
              .personActivity=${r}
            ></zero-viewer-facepile>`:b}
    </span>
  </div>`}function He(e){let t=e.row,n=t.channelPresentation,r=n?[...new Set([n.conversation,n.address].filter(e=>e&&e!==t.label))]:[],i=F(t.createdAt,!0),a=F(t.createdAt,!1);return x`<header class="session-hovercard__header">
    <span class="session-hovercard__heading">
      ${n?x`<span class="session-hovercard__channel"
              ><span aria-hidden="true">${_.link}</span
              >${l(`sessionHovercard.linkedChannel`,{channel:n.channelLabel})}</span
            >`:b}
      <span class="session-hovercard__title">${Oe(t.color)}${t.label}</span>
      ${n?x`<span class="session-hovercard__conversation">
              ${n.kind?x`<span>${n.topicId?l(`sessionHovercard.topicNumber`,{id:n.topicId}):l(`sessionHovercard.chatKinds.${n.kind}`)}</span>`:b}
              ${r.map(e=>x`<span>${e}</span>`)}
              ${n.account?x`<span>${l(`sessionHovercard.viaAccount`,{account:n.account})}</span>`:b}
            </span>`:I(e)}
    </span>
    ${a?x`<span class="session-hovercard__created-age" title=${i}>${a}</span>`:b}
  </header>`}function Ue(e){return e?.markdown?.trim()?x`<section
    class="session-hovercard__section session-hovercard__notepad"
    aria-label=${l(`sessionHovercard.agentNotepad`)}
  >
    <div class="session-hovercard__notepad-title">${l(`sessionHovercard.agentNotepad`)}</div>
    ${ke(e.markdown,{promoteProgress:!0})}
  </section>`:b}function We(e){let t=l(`sessionHovercard.states.${e.state}`),n=e.checks?l(`sessionHovercard.checks.${e.checks.state}`):null,r=[e.title,n,e.additions===void 0?null:`+${e.additions.toLocaleString()}`,e.deletions===void 0?null:`−${e.deletions.toLocaleString()}`].filter(e=>!!e);return x`<a
    class="session-hovercard__pr-row"
    data-state=${e.state}
    href=${e.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label=${`${l(`sessionHovercard.pullRequestLabel`,{number:String(e.number),state:t})}${r.length>0?`, ${r.join(`, `)}`:``}`}
  >
    <span
      class="session-hovercard__pr-state-icon"
      role="img"
      data-checks=${e.checks?.state??b}
      aria-label=${n?`${t} · ${n}`:t}
      title=${n?`${t} · ${n}`:t}
      >${R[e.state]}</span
    >
    <span class="session-hovercard__pr-title">${e.title}</span>
    ${P(e)}
  </a>`}function Ge(e){if(!e)return b;if(e.pullRequests.length>0){let t=e.pullRequests.slice(0,1),n=e.pullRequests.length-t.length;return x`<div class="session-hovercard__pr-list">
      ${t.map(We)}
      ${n>0?x`<span class="session-hovercard__more"
              >${l(`sessionHovercard.more`,{count:String(n)})}</span
            >`:b}
    </div>`}let t=e.branch;if(!t)return b;let n=l(`chat.pullRequests.createPr`),r=l(`chat.pullRequests.createPrLabel`,{branch:t.branch});return x`<div class="session-hovercard__branch-row">
    <span class="session-hovercard__branch-icon" aria-hidden="true">${_.gitBranch}</span>
    ${t.createUrl?x`<a
            class="session-hovercard__branch-action"
            href=${t.createUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label=${r}
            title=${r}
            >${n}</a
          >`:x`<span class="session-hovercard__branch-label">${l(`chat.sessionDiff.title`)}</span>`}
    ${P(t)}
  </div>`}function Ke(e){let t=e.row?.channelPresentation?I(e):b,n=je(e.progressCard,e.row?.status,e.row?.startedAt,e.row?.hasActiveRun??!1),r=!!(e.pullRequests&&(e.pullRequests.pullRequests.length>0||e.pullRequests.branch||e.pullRequests.status!==`ready`)),i=!!(e.row?.workContext||e.row?.placementProviderId&&e.row.placementProfileId||e.row?.boardFace===`dashboard`||e.row?.hasAutomation&&e.automationLink||n),a=e.progressCard?void 0:e.row?.lastMessagePreview?.trim()||void 0;return!e.row&&!r&&!e.progressCard?b:x`<div class="session-hovercard">
    ${e.row?x`<section class="session-hovercard__section session-hovercard__section--header">
            ${He(e)}
          </section>`:b}
    ${i?x`<section class="session-hovercard__section session-hovercard__section--metadata">
            ${Le(e,n)}
          </section>`:b}
    ${r?x`<section class="session-hovercard__section session-hovercard__section--prs">
            ${Ge(e.pullRequests)}
            ${e.pullRequests?.status===`ready`?b:x`<div class="session-hovercard__more" role="status">
                    ${l(e.pullRequests?.status===`rate-limited`?`chat.pullRequests.rateLimited`:`chat.pullRequests.unavailable`)}
                  </div>`}
          </section>`:b}
    ${a?x`<section class="session-hovercard__section session-hovercard__section--optional">
            <div class="session-hovercard__excerpt">${a}</div>
          </section>`:b}
    ${e.row?.attention?.kind===`error`?x`<section class="session-hovercard__section session-hovercard__error">
            <span class="session-hovercard__error-icon" aria-hidden="true"
              >${_.alertTriangle}</span
            >
            <span>${ve(e.row.attention)}</span>
          </section>`:b}
    ${Ue(e.progressCard)}
    ${t===b?b:x`<section
            class="session-hovercard__section session-hovercard__section--attribution"
            aria-label=${l(`sessionHovercard.sessionParticipants`)}
          >
            <div class="session-hovercard__attribution-label">
              ${l(`sessionHovercard.sessionParticipants`)}
            </div>
            ${t}
          </section>`}
  </div>`}var L,qe,R;function z(){return(z=e((()=>{re(),C(),r(),m(),A(),be(),Ne(),M(),pe(),Me(),d(),he(),ae(),L=4,R={open:_.gitPullRequest,draft:_.gitPullRequestDraft,merged:_.gitMerge,closed:_.gitPullRequestClosed}})))()}function Je(e){if(!se(e)||e.status!==`ok`)throw Error(`Session title unavailable`);let t=w(e.sessionKey),n=w(e.agentId);if(!t||!n)throw Error(`Session title response was incomplete`);return{sessionKey:t,agentId:n,namespace:`chat`,title:w(e.title)??w(e.derivedTitle)}}var B,V,H,U;function W(){return(W=e((()=>{u(),h(),o(),Ee(),ye(),E(),B=3e5,V=3e4,H=100,U=class{constructor(e){this.host=e,this.currentClient=null,this.currentContext=null,this.cache=new Map,this.scope={},this.titledAnchors=new WeakMap,this.observer=new MutationObserver(e=>{for(let t of e.flatMap(e=>[...e.addedNodes]))t instanceof HTMLElement&&this.refresh(t)})}get client(){return this.currentClient}set client(e){e!==this.currentClient&&(this.currentClient=e,this.retireTitles())}get context(){return this.currentContext}set context(e){e!==this.currentContext&&(this.currentContext=e,this.retireTitles())}retireTitles(){this.cache.clear(),this.scope={}}currentScope(){let e=this.context?y(this.context.gateway).key:void 0;return e!==this.presentationScope&&(this.presentationScope=e,this.retireTitles()),this.scope}connect(){this.observer.observe(this.host,{childList:!0,subtree:!0}),this.refresh()}refresh(e=this.host){let t=new Map;e.matches(T)&&this.decorate(e,!1,t);for(let n of e.querySelectorAll(T))this.decorate(n,!1,t)}disconnect(){this.observer.disconnect()}async decorate(e,t=!1,n){let r=this.currentScope(),i=this.targetForAnchor(e,n),a=e instanceof HTMLAnchorElement||e.hasAttribute(`data-session-title-only`)?e:document.createElement(`a`);e!==a&&e.classList.contains(`markdown-session-link`)&&(a.dataset.sessionHref=e.dataset.sessionHref,a.setAttribute(`href`,e.getAttribute(`href`)??``),a.className=`markdown-session-link`,e.classList.remove(`markdown-session-link`),e.removeAttribute(`href`),e.removeAttribute(`data-session-href`),e.replaceWith(a),a.append(e));let o=this.titledAnchors.get(a);if(o&&o.scope!==r){let e=a.querySelector(`:scope > .session-label`);e?.textContent===o.title&&(a.classList.remove(`markdown-session-link--titled`),a.removeAttribute(`title`),e.textContent=o.key),this.titledAnchors.delete(a)}if(!i)return;let s=this.cachedOrSeededEntry(i);if(this.stampAnchor(a,i,s?.value),t&&!s?.value)try{let e=await this.loadTitle(i);this.currentScope()===r&&this.stampAnchor(a,i,e)}catch{}}mainKey(){return a({agentsList:this.context?.agents.state.agentsList,hello:this.context?.gateway.snapshot.hello})}targetForAnchor(e,t){let n=e.dataset.sessionKey?.trim();if(n&&!e.dataset.sessionHref){let e=c(n);return e?{sessionKey:n,agentId:e.agentId,namespace:`chat`}:null}let r=me(e.dataset.sessionHref??e.getAttribute(`href`)??``,{basePath:this.context?.basePath,mainKey:this.mainKey(),publicOrigin:fe(this.context)});if(!r)return null;let i=`${r.url.pathname}${r.url.search}${r.url.hash}`;e.getAttribute(`href`)!==i&&e.setAttribute(`href`,i),e.classList.contains(`markdown-session-link`)||e.classList.add(`markdown-session-link`),e.removeAttribute(`target`),e.removeAttribute(`rel`);let a=t?.get(r.url.pathname);if(a===void 0){let e=De(this.context?.sessions.state.result?.sessions??[],r.target,this.mainKey());a=e?{sessionKey:e.key,agentId:r.target.agentId,namespace:r.target.namespace}:null,t?.set(r.url.pathname,a)}return a||e.removeAttribute(`data-session-key`),a}setCacheEntry(e,t){this.cache.delete(e),this.cache.set(e,t),ne(this.cache,H)}cachedOrSeededEntry(e){let t=Date.now(),n=this.cache.get(e.sessionKey);if(n&&n.expiresAt>t)return this.setCacheEntry(e.sessionKey,n),n;this.cache.delete(e.sessionKey);let r=this.context?.sessions.state.result?.sessions.find(t=>s(t.key,e.sessionKey));if(!r)return;let i={...e,sessionKey:r.key,agentId:r.agentId??c(r.key)?.agentId??e.agentId,title:r.displayName??r.derivedTitle},a={expiresAt:t+B,promise:Promise.resolve(i),value:i};return this.setCacheEntry(e.sessionKey,a),a}loadTitle(e){let t=this.cachedOrSeededEntry(e);if(t)return t.promise;let n=this.client,r={expiresAt:Date.now()+B,promise:Promise.resolve().then(async()=>{if(!n)throw Error(`Session title requires a connected Gateway`);return{...Je(await n.request(`controlUi.sessionPreview`,{sessionKey:e.sessionKey})),namespace:e.namespace}})};return r.promise=r.promise.then(e=>(r.value=e,e),e=>{throw r.expiresAt=Date.now()+V,e}),this.setCacheEntry(e.sessionKey,r),r.promise}stampAnchor(e,t,n){let r=n?.title,i=f(t.namespace,t.agentId,t.sessionKey,this.context?.basePath,{displayName:r,exactKey:!0,mainKey:this.mainKey()});if(e.dataset.sessionKey!==t.sessionKey&&(e.dataset.sessionKey=t.sessionKey),e.hasAttribute(`data-session-title-only`)||(e.classList.contains(`markdown-session-link`)||e.classList.add(`markdown-session-link`),!e.dataset.sessionHref&&i&&e.getAttribute(`href`)!==i&&e.setAttribute(`href`,i)),!r||e.classList.contains(`markdown-session-link--titled`))return;e.classList.add(`markdown-session-link--titled`),this.titledAnchors.set(e,{scope:this.scope,key:t.sessionKey,title:r});let a=e.querySelector(`:scope > .session-label`)??document.createElement(`span`);a.className=`session-label`,a.textContent=r,e.replaceChildren(a),e.title=t.sessionKey}}})))()}function G(e){return e.querySelector(`zero-session-menu, zero-catalog-session-menu`)!==null}var K,q,J,Y,X,Z,Q;function $(){return($=e((()=>{C(),g(),p(),r(),Te(),Se(),o(),A(),Fe(),z(),W(),E(),K=450,q=80,J=300,Y=100,X=100,Z=0,Q=class extends te{constructor(...e){super(...e),this.applicationClient=null,this.applicationContext=null,this.applicationGateway=null,this.progressCards=null,this.stopProgressCardUpdates=null,this.stopContextUpdates=null,this.pullRequests=null,this.stopPullRequestUpdates=null,this.activeTarget=null,this.activeTrigger=null,this.activeSession=null,this.open=!1,this.delayed=!0,this.animateNextOpen=!0,this.skipDelayTimer=null,this.lastProgressCard=null,this.hovercard=new Ae(()=>this.close(!0),Y,()=>this.close()),this.sessionLinkTitler=new U(this),this.loadGeneration=0,this.activeTargetObserver=new MutationObserver(()=>{if(this.activeTarget&&(!this.contains(this.activeTarget)||G(this))){this.close();return}this.open&&this.showCurrent()}),this.handleSessionUpdate=()=>{this.sessionLinkTitler.refresh(),this.handleCardUpdate()},this.handleCardUpdate=()=>{this.open&&this.hovercard.held&&this.showCurrent()},this.handlePointerOver=e=>{if(e.pointerType===`touch`||!globalThis.matchMedia?.(`(hover: hover)`).matches)return;let t=O(e);if(!t||G(this))return;let n=this.delayed;this.activate(t,t,n?K:q,n),this.hovercard.pointerInside=!0},this.handlePointerOut=e=>{let t=O(e);t&&t===this.activeTarget&&(e.relatedTarget instanceof Node&&t.contains(e.relatedTarget)||this.hovercard.schedulePointerExit())},this.handleFocusIn=e=>{if(this.hovercard.restoringFocus)return;let t=O(e),n=e.target instanceof HTMLElement?e.target:null,r=t?.matches(`.sidebar-recent-session`)?n?.closest(`a.sidebar-recent-session__link`):n;t&&r&&!G(this)&&(this.activate(t,r,0,!1),this.hovercard.focusInside=!0)},this.handleFocusOut=e=>{this.activeTarget&&(e.relatedTarget instanceof Node&&this.activeTarget.contains(e.relatedTarget)||(this.hovercard.focusInside=!1,this.hovercard.scheduleClose()))},this.handleClick=e=>{O(e)&&this.close()},this.handleSessionMenuOpen=()=>{this.close()}}static{this.properties={client:{attribute:!1,noAccessor:!0},context:{attribute:!1,noAccessor:!0},gateway:{attribute:!1,noAccessor:!0}}}get activeArtifactKey(){return this.activeSession?i(this.activeSession.sessionKey,this.activeSession.agentId):null}get client(){return this.applicationClient}set client(e){e!==this.applicationClient&&(this.applicationClient=e,this.sessionLinkTitler.client=e,this.isConnected&&this.sessionLinkTitler.refresh())}get context(){return this.applicationContext}set context(e){this.stopContextUpdates?.(),this.stopContextUpdates=null,this.applicationContext=e,this.sessionLinkTitler.context=e,this.isConnected&&(this.sessionLinkTitler.refresh(),this.connectStore())}get gateway(){return this.applicationGateway}set gateway(e){e!==this.applicationGateway&&(this.disconnectStore(),this.applicationGateway=e,this.close(),this.isConnected&&this.connectStore())}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.style.display=`contents`,this.addEventListener(`pointerover`,this.handlePointerOver),this.addEventListener(`pointerout`,this.handlePointerOut),this.addEventListener(`focusin`,this.handleFocusIn),this.addEventListener(`focusout`,this.handleFocusOut),this.addEventListener(`keydown`,this.hovercard.handleTriggerKeyDown),this.addEventListener(`click`,this.handleClick),this.addEventListener(D,this.handleSessionMenuOpen),this.sessionLinkTitler.connect(),this.connectStore()}disconnectedCallback(){this.removeEventListener(`pointerover`,this.handlePointerOver),this.removeEventListener(`pointerout`,this.handlePointerOut),this.removeEventListener(`focusin`,this.handleFocusIn),this.removeEventListener(`focusout`,this.handleFocusOut),this.removeEventListener(`keydown`,this.hovercard.handleTriggerKeyDown),this.removeEventListener(`click`,this.handleClick),this.removeEventListener(D,this.handleSessionMenuOpen),this.sessionLinkTitler.disconnect(),this.disconnectStore(),this.close(),this.clearSkipDelayTimer(),super.disconnectedCallback()}connectStore(){if(this.applicationContext&&!this.stopContextUpdates){let e=this.applicationContext.sessions.subscribe(this.handleSessionUpdate),t=this.applicationContext.agentSelection.subscribe(()=>this.close());this.stopContextUpdates=()=>{e(),t()}}this.applicationGateway&&!this.progressCards&&(this.progressCards=we(this.applicationGateway),this.stopProgressCardUpdates=this.progressCards.subscribe(this.handleCardUpdate))}disconnectStore(){this.progressCards?.unwatch(this),this.stopProgressCardUpdates?.(),this.stopProgressCardUpdates=null,this.stopContextUpdates?.(),this.stopContextUpdates=null,this.progressCards=null,this.releasePullRequestStore()}activate(e,t,n,r){let a=e.dataset.sessionKey;if(!a)return;let o=c(a)?.agentId??e.closest(`zero-app-sidebar`)?.expandedAgentId();if(!o)return;let s=i(a,o);if(e===this.activeTarget&&a===this.activeSession?.sessionKey&&s===this.activeArtifactKey){if(t!==this.activeTrigger){if(this.hovercard.reset(),this.activeTrigger=t,this.hovercard.markTrigger(t),this.open)this.showCurrent();else{this.animateNextOpen=r;let e=++this.loadGeneration;this.hovercard.scheduleOpen(n,()=>void this.loadAndShow(a,e))}}return}this.close(n>0),this.activeTarget=e,this.activeTrigger=t,this.activeSession={sessionKey:a,agentId:o},this.open=!1,this.animateNextOpen=r,this.lastProgressCard=null,this.progressCards?.watch(this,[this.activeSession]),this.hovercard.markTrigger(t),this.activeTargetObserver.observe(this,{attributes:!0,attributeFilter:[`aria-expanded`],childList:!0,subtree:!0});let l=++this.loadGeneration;this.hovercard.scheduleOpen(n,()=>void this.loadAndShow(a,l))}async loadAndShow(e,t){let n=this.activeTarget,r=this.activeArtifactKey,i=this.activeSession;if(n instanceof HTMLAnchorElement&&n.dataset.sessionKey===e&&this.sessionLinkTitler.decorate(n,!0),t===this.loadGeneration&&i?.sessionKey===e&&r&&i&&n&&!G(this)&&this.hovercard.held){this.open=!0,this.delayed=!1,this.clearSkipDelayTimer(),this.watchPullRequests(r),this.showCurrent();try{await this.progressCards?.load(i)}catch{}t===this.loadGeneration&&this.activeSession?.sessionKey===e&&this.hovercard.held&&this.showCurrent()}}watchPullRequests(e){let t=this.applicationGateway;t&&(this.releasePullRequestStore(),this.pullRequests=Ce(t),this.stopPullRequestUpdates=this.pullRequests.subscribe(this.handleCardUpdate),this.pullRequests.watch(this,[e],{foreground:!0}))}releasePullRequestStore(){this.pullRequests?.unwatch(this),this.stopPullRequestUpdates?.(),this.stopPullRequestUpdates=null,this.pullRequests=null}showCurrent(){let e=this.activeTarget,t=this.activeSession,n=t?.sessionKey,r=this.activeArtifactKey;if(!e||!t||!n||!r||!this.open)return;let i=this.querySelector(`zero-app-sidebar`)?.findSidebarHovercardRowByKey(n),a=this.pullRequests?.get(r),o=this.progressCards?.get(t);o!==void 0&&(this.lastProgressCard=o);let s=this.applicationGateway,c=v({hello:s?.snapshot.hello,settings:s?.connection,password:s?.connection.password}),u=JSON.stringify({progress:this.lastProgressCard?.revision??null,pullRequests:a?{branch:a.branch,pullRequests:a.pullRequests,status:a.status}:null,row:i?{label:i.label,color:i.color,attention:i.attention,boardFace:i.boardFace,hasAutomation:i.hasAutomation,hasActiveRun:i.hasActiveRun,channelAvatarUrl:i.channelAvatarUrl,channelPresentation:i.channelPresentation,lastMessagePreview:i.lastMessagePreview,createdActor:i.createdActor,participants:i.participants,expandedParticipants:i.expandedParticipants,participantCount:i.participantCount,workContext:i.workContext,placementMachine:i.placementMachine,createdAt:i.createdAt,startedAt:i.startedAt,updatedAt:i.updatedAt,status:i.status,endedAt:i.endedAt}:null});if(this.hovercard.card?.dataset.revision===u)return;let d=this.hovercard.card,f=d?.contains(document.activeElement)&&document.activeElement instanceof HTMLElement?document.activeElement:null,p=f?this.hovercard.focusables().indexOf(f):-1,m=f instanceof HTMLAnchorElement?f.href:null,h=!d&&this.animateNextOpen,g=d;if(g||(Z+=1,g=Pe(`zero-session-progress-hovercard-${Z}`,`session-progress-hovercard`),this.animateNextOpen=!1,h?g.dataset.open=`false`:g.dataset.instant=`true`),g.dataset.revision=u,g.setAttribute(`aria-label`,l(`sessionHovercard.ariaLabel`)),S(Ke({row:i,selfUserId:this.applicationContext?.gateway.snapshot.selfUser?.id,avatarAuth:c,personActivity:this.personActivity(),automationLink:this.applicationContext?{href:`${ee(`cron`,this.applicationContext.basePath)}?${new URLSearchParams({session:n,agent:t.agentId})}`,navigate:()=>{let e=this.applicationContext;this.close(),e?.navigate(`cron`,{search:`?${new URLSearchParams({session:n,agent:t.agentId})}`})}}:void 0,pullRequests:a,progressCard:this.lastProgressCard}),g),!g.firstElementChild){this.hovercard.clearCard(),this.hovercard.pointerOverCard=!1,this.hovercard.cardFocusInside=!1;return}if(d){if(f&&!g.contains(document.activeElement)){let e=this.hovercard.focusables(),t=(m?e.find(e=>e instanceof HTMLAnchorElement&&e.href===m):void 0)??e[p];t?t.focus({preventScroll:!0}):(this.hovercard.cardFocusInside=!1,this.hovercard.returnFocus(this.activeTrigger),this.hovercard.focusInside=document.activeElement===this.activeTrigger)}this.hovercard.position();return}g.addEventListener(`pointerleave`,this.hovercard.handleCardPointerLeave),this.hovercard.mount(e,g,ue(e),!1,()=>S(b,g)),h&&(g.offsetWidth,window.setTimeout(()=>{this.hovercard.card===g&&this.open&&(g.dataset.open=`true`)},0))}personActivity(){let e=this.applicationContext;return e?ge(e,()=>this.close()):void 0}close(e=!1){let t=this.open;this.hovercard.reset(e?X:0),this.loadGeneration+=1,this.open=!1,this.animateNextOpen=!0,this.lastProgressCard=null,this.activeTargetObserver.disconnect(),this.progressCards?.unwatch(this),this.releasePullRequestStore(),this.activeTarget=null,this.activeTrigger=null,this.activeSession=null,t&&(this.clearSkipDelayTimer(),this.skipDelayTimer=window.setTimeout(()=>{this.skipDelayTimer=null,this.delayed=!0},J))}clearSkipDelayTimer(){this.skipDelayTimer!==null&&(window.clearTimeout(this.skipDelayTimer),this.skipDelayTimer=null)}}})))()}$();export{Q as SessionProgressHovercardProvider};
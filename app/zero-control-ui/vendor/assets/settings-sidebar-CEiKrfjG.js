import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Hs as t,Pu as n,di as r,dl as i,hs as a,ii as o,kl as s,ll as c,ps as l,ul as u,zu as d}from"./control-ui-core-DCNBgr3X.js";import{Aa as f,Ba as p,Ca as m,Da as h,Fa as g,Pa as _,Sa as ee,Va as v,c as te,ca as y,ga as ne,go as b,ha as x,ma as re,na as ie,s as ae,sa as S,ta as oe,wo as C,xo as se,za as ce}from"./control-ui-core-DwX5Mpz4.js";import{G as w,J as T,W as E,Z as le,at as ue,rt as de}from"./lit-runtime-B40xFCK_.js";import{Zr as D,da as fe,jo as O,uo as k,wa as pe}from"./ui-AaV6iNVa.js";import{Xi as A,Yi as j,h as me,ki as he}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ac as M,Mc as N}from"./control-ui-boot-shared-CzJHozXQ.js";import"./control-ui-boot-shared-styles-BXPMRytW.js";import{n as P,t as F}from"./en-settings-6vMW9YZk.js";import{_t as I,vt as L}from"./control-ui-boot-new-5_2Ky4dv.js";import{i as R,n as z,r as ge,t as B}from"./settings-navigation-B_wF8pF5.js";import{a as _e,o as ve}from"./settings-targets-C_s4rJ3N.js";import{i as ye,n as be,r as xe,t as Se}from"./config-form.tiers-B9QpQUK9.js";import{n as Ce,o as we,r as Te}from"./config-form.search-DBYkS-qK.js";import{c as Ee,i as V,o as De,r as Oe}from"./setup-schema-Cl7oXplG.js";function ke(e,t){let n=d(e.labelKey),r=t?Object.entries(e.nativeSearchKeys??{}).filter(([,e])=>e(t)).map(([e])=>e):[];return{routeId:e.routeId,...e.search===void 0?{}:{search:e.search},hash:e.hash,label:n,searchText:[n,...[...e.searchKeys,...r].filter(e=>re().lobsterdex||e!==`configView.appearance.tabIcon.lobsterdex`).map(e=>d(e)),e.aliases??``].join(` `)}}function Ae(e,t){let n=U[e],r=t.properties;if(!n||!r)return t;let i=new Set(n);return{...t,properties:Object.fromEntries(Object.entries(r).filter(([e])=>i.has(e)))}}function je(e){if(!e.query.trim())return[];let t=we(e.query),n=t.tags.length===0&&t.text?H.filter(t=>(e.identityAvailable||!t.requiresIdentity)&&(e.multipleProfiles||!t.requiresMultipleProfiles)&&(e.nativeDeviceSettings||!t.requiresNativeDeviceSettings)&&_(t.routeId,e.canAdmin!==!1,e.nativeDeviceSettings)).map(t=>ke(t,e.nativeDeviceSettings?.snapshot??null)).filter(e=>R(e.searchText,t.text)):[],i=pe(e.schema)?e.schema:null;if(!i||r(i)!==`object`||!i.properties)return n;let a=W.get(i);(!a||a.hints!==e.uiHints)&&(a={hints:e.uiHints,sections:new Map},W.set(i,a));let o=e.value??{};for(let[t,r]of Object.entries(i.properties)){let i=l(t);if(!_(i,e.canAdmin!==!1,e.nativeDeviceSettings))continue;let s=a.sections.get(t);if(!s){let n=t===`wizard`?V(r):Ae(i,r);s={schema:n,tiers:be({schema:n,path:[t],hints:e.uiHints})},a.sections.set(t,s)}let{schema:c,tiers:u}=s,d=xe[t],f=n=>!!(n&&Te({key:t,schema:n,value:o[t],hints:e.uiHints,query:e.query,label:d?.label,description:d?.description,textMatcher:R})),p=f(u.common),m=f(u.advanced);if(!p&&!m)continue;let h=encodeURIComponent(t),g=`#config-section-${h}`;n.push({routeId:i,label:d?.label??c.title??t,...i===`memory`?{pathname:se(`settings`,e.basePath),hash:g}:i===`plugin-settings`?{search:`?tab=advanced`,hash:`#plugin-settings-advanced`}:{search:`?section=${h}${m||t===`wizard`?`&advanced=1`:``}`,hash:g}})}return n}var H,U,W;function G(){return(G=e((()=>{f(),b(),x(),ye(),Ce(),Se(),n(),F(),o(),B(),a(),Ee(),ve(),Oe(),P(),H=Object.values(_e),U={memory:De,"plugin-settings":[`enabled`,`allow`,`deny`,`load`,`slots`],updates:[`channel`,`checkOnStart`,`auto`]},W=new WeakMap})))()}function K(e,t){return T`<button
    class="btn btn--xs settings-save-indicator__action"
    type="button"
    @click=${t}
  >
    ${e}
  </button>`}var q,J;function Y(){return(Y=e((()=>{E(),le(),x(),n(),y(),j(),q=2e3,J=class extends fe{constructor(...e){super(...e),this.savedVisible=!1}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.stopBranding=ne(()=>this.requestUpdate())}willUpdate(){let e=this.props?.status;this.previousStatus===`saving`&&e===`saved`?(this.clearSavedTimer(),this.savedVisible=!0,this.savedTimer=globalThis.setTimeout(()=>{this.savedTimer=void 0,this.savedVisible=!1},q)):e!==`saved`&&(this.clearSavedTimer(),this.savedVisible=!1),this.previousStatus=e}disconnectedCallback(){this.clearSavedTimer(),this.stopBranding?.(),this.stopBranding=void 0,super.disconnectedCallback()}clearSavedTimer(){globalThis.clearTimeout(this.savedTimer),this.savedTimer=void 0}renderClaw(e){return T`<span class="settings-save-indicator__claw ${e}" aria-hidden="true"
      >${A(S.claw)}</span
    >`}render(){let e=this.props;if(!e)return w;let t,n=``,r=``,i=``;if(e.applying)t=T` <span class="settings-save-indicator__spinner" aria-hidden="true"
          >${S.loader}</span
        >
        <span>${d(`configView.applying`)}</span>`;else if(e.status===`saving`)t=T` ${this.renderClaw(`settings-save-indicator__claw--saving`)}
        <span>${d(`configView.autoSaveSaving`)}</span>`;else if(e.status===`recovery`)n=` settings-save-indicator--danger settings-save-indicator--recovery`,t=T`<span>${e.lastError}</span>
        ${K(d(`configView.recoveryReload`),e.onReload)}`;else if(e.status===`rejected`)n=` settings-save-indicator--rejected`,t=T`<span>${d(`configView.autoSaveRejected`)}</span>
        <span>${d(`configView.autoSaveRejectedHint`)}</span>
        ${e.lastError?T`<details>
                <summary>${d(`configView.rejectionDetails`)}</summary>
                <span>${e.lastError}</span>
              </details>`:w}
        ${K(d(`configView.retry`),e.onRetry)}
        ${K(d(`configView.recoveryReload`),e.onReload)}`;else if(e.status===`error`)i=e.lastError?.trim()??``,r=i?`${d(`configView.autoSaveFailed`)}: ${i}`:``,n=` settings-save-indicator--danger`,t=T` <span>${d(`configView.autoSaveFailed`)}</span>
        ${K(d(`configView.retry`),e.onRetry)}`;else if(e.status===`paused`)t=T` <span>${d(`configView.autoSavePaused`)}</span>
        ${K(d(`configView.saveNow`),e.onSave)}`;else if(e.status===`conflict`)n=` settings-save-indicator--danger`,t=T` <span>${d(`configView.autoSaveConflict`)}</span>
        ${K(d(`common.reload`),e.onReload)}`;else if(this.savedVisible)n=` settings-save-indicator--saved`,t=T` ${this.renderClaw(`settings-save-indicator__claw--saved`)}
        <span class="settings-save-indicator__check" aria-hidden="true">${S.check}</span>
        <span>${d(`configView.autoSaveSaved`)}</span>`;else if(e.needsApply)t=T` <button
        class="btn btn--xs settings-save-indicator__apply"
        type="button"
        ?disabled=${e.applyDisabled}
        @click=${e.onApply}
      >
        ${d(`configView.applyChanges`)}
      </button>`;else return w;return T`<div
      class="settings-save-indicator${n}"
      role="status"
      aria-live="polite"
      aria-label=${r||w}
      title=${i||w}
    >
      ${t}
    </div>`}},D([ue({attribute:!1})],J.prototype,`props`,void 0),D([de()],J.prototype,`savedVisible`,void 0),customElements.get(`zero-settings-save-indicator`)||customElements.define(`zero-settings-save-indicator`,J)})))()}function Me(e,t){if(t.pathname)return!1;let n=O(t.label);return[z(e),p(e)].some(e=>O(e)===n)}function Ne(e,t,n,r){let i=v(n,r),a=t.filter(e=>_(e.routeId,n,r)),o=O(e);if(!o)return i.map(e=>({labelKey:e.labelKey,items:e.routes.map(e=>({routeId:e,blocks:[]}))}));let s=i.flatMap(e=>e.routes),c=[...new Set([...s,...h.filter(e=>_(e,n,r)),...a.map(e=>e.routeId)])],l=c.filter(e=>[z(e),p(e),ce(e)].some(e=>R(e,o))),u=new Set(l),f=i.flatMap(e=>e.labelKey&&R(d(e.labelKey),o)?e.routes.filter(e=>!u.has(e)&&(u.add(e),!0)):[]),m=new Map,g=new Set;for(let e of a){let t=`${e.routeId}\u0000${e.pathname??``}\u0000${e.search??``}\u0000${e.hash}`;if(g.has(t))continue;g.add(t);let n=m.get(e.routeId)??[];n.push(e),m.set(e.routeId,n)}return[{labelKey:null,items:[...l,...f].map(e=>({routeId:e,blocks:(m.get(e)??[]).filter(t=>!Me(e,t))}))},...c.filter(e=>!u.has(e)&&m.has(e)).map(e=>({labelKey:null,items:[{routeId:e,blocks:m.get(e)??[]}]}))].filter(e=>e.items.length>0)}function Pe(e,n){let r=ge(e.activeRouteId)===n;return T`
    <a
      href=${C(n,e.basePath)}
      class="settings-sidebar__item ${r?`settings-sidebar__item--active`:``}"
      aria-current=${r?`page`:w}
      @focus=${t=>N(e.preloadTimers,n,t,e.onPreload,r)}
      @blur=${t=>M(e.preloadTimers,t)}
      @pointerenter=${t=>N(e.preloadTimers,n,t,e.onPreload,r)}
      @pointerleave=${t=>M(e.preloadTimers,t)}
      @touchstart=${{handleEvent:t=>N(e.preloadTimers,n,t,e.onPreload,r,!0),passive:!0}}
      @click=${r=>{t(r)&&(r.preventDefault(),e.onNavigate(n))}}
    >
      <span class="settings-sidebar__item-icon" aria-hidden="true"
        >${n===`custodian`?A():S[g(n)]}</span
      >
      <span class="settings-sidebar__item-label"
        >${z(n,e.nativeDeviceSettings?.snapshot)}</span
      >
      ${e.presentation===`embed-list`?T`<span class="settings-row__chevron" aria-hidden="true">${S.chevronRight}</span>`:w}
    </a>
  `}function Fe(e,n){let r=(n.pathname??C(n.routeId,e.basePath))+(n.search??``)+n.hash,i=e.activeRouteId===n.routeId&&(n.pathname===void 0||e.activePathname===n.pathname)&&e.activeHash===n.hash&&(n.search===void 0||e.activeSearch===n.search);return T`
    <a
      href=${r}
      class="settings-sidebar__subitem ${i?`settings-sidebar__subitem--active`:``}"
      aria-current=${i?`location`:w}
      @click=${r=>{t(r)&&(r.preventDefault(),e.onNavigate(n.routeId,{...n.pathname?{pathname:n.pathname}:{},...n.search?{search:n.search}:{},hash:n.hash}))}}
    >
      <span class="settings-sidebar__subitem-label">${n.label}</span>
    </a>
  `}function Ie(e){e.closest(`.settings-sidebar`)?.querySelector(`.settings-sidebar__search`)?.classList.toggle(`settings-sidebar__search--scrolled`,e.scrollTop>0)}function Le(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=[];for(let i of e){let e=i.creatorAgentId;if(e&&e!==i.id&&t.has(e)){let t=n.get(e)??[];t.push(i),n.set(e,t)}else r.push(i)}let i=[],a=new Set,o=(e,t)=>{if(!a.has(e.id)){a.add(e.id),i.push({agent:e,...t>0&&e.creatorAgentId?{creatorAgentId:e.creatorAgentId}:{}});for(let r of n.get(e.id)??[])o(r,t+1)}};return r.forEach(e=>o(e,0)),e.forEach(e=>o(e,0)),i}function X(e){let t=u(e.agents).map(e=>Object.assign({},e,{id:k(e.id),creatorAgentId:e.creatorAgentId?k(e.creatorAgentId):e.creatorAgentId})),n=Le(t).map(({agent:e,creatorAgentId:t})=>({value:e.id,label:i(e),agent:e,description:t?d(`agents.createdBy`,{id:t}):void 0}));return T`<div class="settings-sidebar__agent">
    <zero-agent-select
      .options=${n}
      .identityById=${Object.fromEntries(e.agentIdentity.entries().map(e=>[e.agentId,e]))}
      .value=${e.settingsAgentSelection.state.selectedId??``}
      .accessibleLabel=${d(`agentScope.label`)}
      .menuLabel=${d(`agentScope.label`)}
      .disabled=${n.length<=1}
      .onSelect=${t=>e.settingsAgentSelection.set(t)}
      @wa-show=${()=>void e.agentIdentity.ensure(t.map(e=>e.id))}
    ></zero-agent-select>
  </div>`}function Z(e){return e.connectionStatus===null?T`<zero-settings-save-indicator
        .props=${e.saveIndicator}
      ></zero-settings-save-indicator>`:te({kind:e.connectionStatus,lastError:e.lastError,onRetry:e.onRetryConnect})}function Q(e){return T`<header class="native-embed-header">
    ${e.presentation===`embed-page`?T`<button
            class="native-embed-header__back btn btn--ghost"
            type="button"
            aria-label=${d(`common.back`)}
            @click=${e.onExit}
          >
            <span aria-hidden="true">${S.chevronLeft}</span>${d(`common.back`)}
          </button>`:w}
    <h1 class="page-title">
      ${e.presentation===`embed-list`?d(`nav.settings`):z(e.activeRouteId,e.nativeDeviceSettings?.snapshot)}
    </h1>
    ${Z(e)}
  </header>`}function Re(e){if(e.presentation===`embed-page`)return T`${Q(e)} ${X(e)}`;let t=e.searchBlockMatches??(e.searchParams?je(e.searchParams):[]),n=Ne(e.searchQuery,t,e.canAdmin!==!1,e.nativeDeviceSettings??null),r=T` <nav
    class="settings-sidebar__nav"
    aria-label=${d(`common.settingsSections`)}
    @scroll=${e=>Ie(e.currentTarget)}
  >
    ${n.length===0?T`<p class="settings-sidebar__empty" role="status">
            ${d(`nav.settingsSearchNoResults`)}
          </p>`:n.map(t=>T`
              <div class="settings-sidebar__group">
                ${t.labelKey?T`<div class="settings-sidebar__group-label">${d(t.labelKey)}</div>`:w}
                ${t.items.map(t=>T`
                    ${Pe(e,t.routeId)}
                    ${t.blocks.map(t=>Fe(e,t))}
                  `)}
              </div>
            `)}
  </nav>`;return e.presentation===`embed-list`?T`<section class="settings-embed-list">
      ${Q(e)} ${X(e)} ${r}
    </section>`:T`
    <aside class="settings-sidebar">
      <header class="settings-sidebar__header" @mousedown=${ee}>
        <button type="button" class="settings-sidebar__back" @click=${()=>e.onExit()}>
          <span class="settings-sidebar__back-icon" aria-hidden="true">${S.arrowLeft}</span>
          ${d(`nav.exitSettings`)}
          ${ie(`esc`,{className:`settings-sidebar__esc`,ariaHidden:!0})}
        </button>
        <h1 class="settings-sidebar__title">${d(`nav.settings`)}</h1>
      </header>
      ${X(e)}
      <div class="settings-sidebar__search" role="search">
        <span class="settings-sidebar__search-icon" aria-hidden="true">${S.search}</span>
        <input
          class="settings-sidebar__search-input"
          type="search"
          autocomplete="off"
          spellcheck="false"
          aria-label=${d(`nav.settingsSearchLabel`)}
          placeholder=${d(`nav.settingsSearchPlaceholder`)}
          .value=${e.searchQuery}
          @input=${t=>e.onSearchQueryChange(t.currentTarget.value)}
          @keydown=${t=>{if(!(t.key!==`Escape`||L(t))){if(t.preventDefault(),e.searchQuery){e.onSearchQueryChange(``);return}e.onExit()}}}
        />
        ${e.searchQuery?T`
                <button
                  type="button"
                  class="settings-sidebar__search-clear"
                  aria-label=${d(`nav.settingsSearchClear`)}
                  @click=${t=>{let n=t.currentTarget.parentElement?.querySelector(`input`);e.onSearchQueryChange(``),n?.focus()}}
                >
                  ${S.x}
                </button>
              `:w}
      </div>
      ${r}
      <footer class="settings-sidebar__footer">
        ${Z(e)}
        <zero-sidebar-build-chip
          .basePath=${e.basePath}
          .gatewayVersion=${e.gatewayVersion||null}
          .variant=${`settings`}
          .onNavigate=${()=>e.onNavigate(`about`)}
        ></zero-sidebar-build-chip>
      </footer>
    </aside>
  `}function $(){return($=e((()=>{E(),f(),b(),m(),n(),c(),I(),s(),B(),G(),ae(),y(),oe(),j(),he(),Y(),me()})))()}$();export{Re as renderSettingsSidebar};
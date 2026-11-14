import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gc as t,Hs as n,Ic as r,Lc as i,Nu as a,Pu as o,So as s,W as c,Wc as l,Xc as u,_o as d,ac as f,go as p,ju as m,nc as h,xo as g,xu as ee,yu as te,z as _,zu as v}from"./control-ui-core-DCNBgr3X.js";import{Aa as y,Ai as b,Ba as x,Bi as S,Ri as C,Vi as w,ca as T,ki as E,or as ne,sa as D,sr as re}from"./control-ui-core-DwX5Mpz4.js";import{G as O,J as k,W as A,Z as j,at as M,f as N,g as P,n as F,p as I,rt as L,t as R}from"./lit-runtime-B40xFCK_.js";import{Ur as z,Wr as B,Zr as V}from"./ui-AaV6iNVa.js";import{ir as H,l as U,rr as W,u as G}from"./control-ui-boot-shared-ZuP0LiFD.js";import{n as K,t as q}from"./near-viewport-observer-WgGck829.js";var J;function Y(){return(Y=e((()=>{A(),j(),K(),o(),a(),J=class extends m{constructor(...e){super(...e),this.sessionKey=``,this.error=null,this.visibility=new q(200,()=>this.requestUpdate()),this.observationFrame=0}connectedCallback(){super.connectedCallback(),window.cancelAnimationFrame(this.observationFrame),this.observationFrame=window.requestAnimationFrame(()=>this.visibility.observe(this))}disconnectedCallback(){window.cancelAnimationFrame(this.observationFrame),this.visibility.disconnect(),super.disconnectedCallback()}render(){return this.visibility.nearVisible?this.error?k`<div class="dashboard-preview__error">
          ${v(`dashboardDocument.loadFailed`,{error:this.error})}
        </div>`:k`<zero-board-document
          .passive=${!0}
          .gatewaySnapshot=${this.gatewaySnapshot}
          .preparedSession=${{sessionKey:this.sessionKey,agentId:this.agentId}}
        ></zero-board-document>`:O}},V([M({attribute:!1})],J.prototype,`gatewaySnapshot`,void 0),V([M({attribute:!1})],J.prototype,`sessionKey`,void 0),V([M({attribute:!1})],J.prototype,`agentId`,void 0),V([M({attribute:!1})],J.prototype,`error`,void 0),customElements.get(`zero-dashboard-preview`)||customElements.define(`zero-dashboard-preview`,J)})))()}function X(e,t){let n=e.createdActor??e.owner?.actor,r=n?.id?.trim()||e.agentId?.trim()||t;return{id:r,label:n?.label?.trim()||r}}function ie(e,t){let n=t.query.trim().toLocaleLowerCase();return(e.result?.sessions??[]).filter(r=>{let i=X(r,e.fallbackAgentId);return t.ownerId&&i.id!==t.ownerId?!1:!n||[f(r.key,r),i.label,r.lastMessagePreview,r.key].filter(e=>typeof e==`string`).some(e=>e.toLocaleLowerCase().includes(n))}).toSorted((e,n)=>t.sort===`title`?f(e.key,e).localeCompare(f(n.key,n)):(n.updatedAt??0)-(e.updatedAt??0))}function ae(e,r,i,a,o){let s=t(r.key,e.globalScope)?u({face:`dashboard`,sessionKey:r.key,fallbackAgentId:r.key===`global`&&r.agentId?.trim()||e.fallbackAgentId,basePath:e.basePath,row:r,mainKey:e.mainKey}):null,c=s?I`a`:I`div`,l=X(r,e.fallbackAgentId),d=f(r.key,r),p=l.label.trim().charAt(0).toLocaleUpperCase()||`?`;return P`<article class="dashboard-card" data-dashboard-session=${r.key}>
    <${c}
      class="dashboard-card__main"
      href=${s?.href??O}
      aria-label=${s?d:O}
      @click=${e=>{s&&i.onNavigate&&n(e)&&(e.preventDefault(),i.onNavigate(`dashboard`,s.options))}}
    >
      ${k`<div class="dashboard-preview" aria-hidden="true" inert>
        <zero-dashboard-preview
          .gatewaySnapshot=${a}
          .sessionKey=${r.key}
          .agentId=${r.agentId}
          .error=${o}
        ></zero-dashboard-preview>
      </div>`}
      <div class="dashboard-card__body">
        <div class="dashboard-card__heading">
          <h2>${d}</h2>
          ${r.status===`running`?k`<span class="dashboard-card__live"><i></i>${v(`dashboardsPage.live`)}</span>`:O}
        </div>
        <div class="dashboard-card__author">
          <span class="dashboard-card__avatar" aria-hidden="true">${p}</span>
          <span>${v(`dashboardsPage.byAuthor`,{author:l.label})}</span>
        </div>
      </div>
      <footer class="dashboard-card__footer">
        <span>
          ${r.updatedAt?v(`dashboardsPage.updated`,{time:_(r.updatedAt)}):v(`dashboardsPage.updatedUnknown`)}
        </span>
        ${s?k`<span class="dashboard-card__open" aria-hidden="true">${D.arrowUpRight}</span>`:O}
      </footer>
    </${c}>
  </article>`}function oe(e,t,n,r,i){let a=e.result?.sessions??[];if(e.error&&!e.result)return O;if(a.length===0)return k`<section class="card stack" data-dashboards-empty role="status">
      <div class="list-title">${v(`dashboardsPage.emptyTitle`)}</div>
      <div class="card-sub">${v(`dashboardsPage.emptyDescription`)}</div>
    </section>`;let o=Array.from(new Map(a.map(t=>{let n=X(t,e.fallbackAgentId);return[n.id,n]})).values()).toSorted((e,t)=>e.label.localeCompare(t.label)),s=ie(e,t);return k`<section class="dashboards-gallery" aria-label=${x(`dashboards`)}>
    <div class="dashboards-toolbar">
      <label class="dashboards-search">
        <span aria-hidden="true">${D.search}</span>
        <span class="sr-only">${v(`dashboardsPage.searchLabel`)}</span>
        <input
          type="search"
          .value=${t.query}
          placeholder=${v(`dashboardsPage.searchPlaceholder`)}
          @input=${e=>{e.currentTarget instanceof HTMLInputElement&&n.onFilterChange({query:e.currentTarget.value})}}
        />
      </label>
      <label class="dashboards-select">
        <span>${v(`dashboardsPage.authorFilter`)}</span>
        <select
          .value=${t.ownerId}
          @change=${e=>{e.currentTarget instanceof HTMLSelectElement&&n.onFilterChange({ownerId:e.currentTarget.value})}}
        >
          <option value="">${v(`dashboardsPage.allAuthors`)}</option>
          ${o.map(e=>k`<option value=${e.id}>${e.label}</option>`)}
        </select>
      </label>
      <label class="dashboards-select">
        <span>${v(`dashboardsPage.sortLabel`)}</span>
        <select
          .value=${t.sort}
          @change=${e=>{e.currentTarget instanceof HTMLSelectElement&&(e.currentTarget.value===`updated`||e.currentTarget.value===`title`)&&n.onFilterChange({sort:e.currentTarget.value})}}
        >
          <option value="updated">${v(`dashboardsPage.sortUpdated`)}</option>
          <option value="title">${v(`dashboardsPage.sortTitle`)}</option>
        </select>
      </label>
    </div>
    <div class="dashboards-results" role="status">
      ${v(`dashboardsPage.resultCount`,{count:String(s.length)})}
    </div>
    ${s.length===0?k`<div class="dashboards-no-results" data-dashboards-no-results>
            <span aria-hidden="true">${D.search}</span>
            <strong>${v(`dashboardsPage.noResultsTitle`)}</strong>
            <span>${v(`dashboardsPage.noResultsDescription`)}</span>
          </div>`:k`<div class="dashboards-grid">
            ${F(s,e=>e.key,t=>ae(e,t,n,r,i))}
          </div>`}
  </section>`}function se(){return k`<section class="dashboards-gallery" aria-busy="true">
    <span class="sr-only" role="status">${v(`common.loading`)}</span>
    <div class="dashboards-loading" aria-hidden="true" inert>
      <div class="dashboards-toolbar">
        <div class="dashboards-search skeleton dashboards-loading__control"></div>
        ${[0,1].map(()=>k`<div class="dashboards-select dashboards-loading__select">
            <div class="skeleton skeleton-line dashboards-loading__label"></div>
            <div class="skeleton dashboards-loading__control"></div>
          </div>`)}
      </div>
      <div class="dashboards-results">
        <div class="skeleton skeleton-line dashboards-loading__label"></div>
      </div>
      <div class="dashboards-grid">
        ${Array.from({length:6},()=>k`<div class="dashboard-card">
            <div class="dashboard-preview skeleton"></div>
            <div class="dashboard-card__body">
              <div
                class="skeleton skeleton-line skeleton-line--long dashboards-loading__title"
              ></div>
              <div class="dashboard-card__author">
                <div class="dashboard-card__avatar skeleton"></div>
                <div class="skeleton skeleton-line skeleton-line--medium"></div>
              </div>
            </div>
            <div class="dashboard-card__footer">
              <div class="skeleton skeleton-line skeleton-line--medium"></div>
            </div>
          </div>`)}
      </div>
    </div>
  </section>`}function ce(e,t,n,r,i=null){let a=e&&(e.result||e.error)?k`
          ${H({status:{error:e.error,hasLoaded:e.result!==null,stale:e.result!==null&&e.error!==null,awaitingGateway:!1},errorMessage:e.error?v(`dashboardsPage.loadError`,{error:e.error}):void 0})}
          ${oe(e,t,n,r,i)}
        `:se();return k`
    <section class="content-header dashboards-header" ${re({toolbarHeader:!0})}>
      <div>
        <h1 class="page-title">${x(`dashboards`)}</h1>
        <div class="page-subtitle">${v(`subtitles.dashboards`)}</div>
      </div>
      ${e?.result?k`<div class="dashboards-header__count">
              <strong>${e.result.sessions.length}</strong>
              <span>${v(`dashboardsPage.totalLabel`)}</span>
            </div>`:O}
    </section>
    ${G(a)}
  `}function Z(){return(Z=e((()=>{A(),R(),N(),y(),ne(),T(),W(),U(),o(),c(),h(),l(),Y()})))()}var Q;function $(){return($=e((()=>{B(),j(),b(),w(),ee(),s(),a(),i(),d(),Z(),Q=class extends m{constructor(...e){super(...e),this.filters={query:``,ownerId:``,sort:`updated`},this.previewError=null,this.subscriptions=new r(this).effect(()=>this.context?.agentSelection,e=>(this.bindList(),e.subscribe(()=>this.bindList())))}connectedCallback(){super.connectedCallback(),S(C.tagName,C.loadModule).then(()=>this.requestUpdate()).catch(e=>{this.previewError=te(e)})}disconnectedCallback(){this.unsubscribeList?.(),this.unsubscribeList=void 0,this.observedSessions=void 0,this.observedScopeId=void 0,this.subscriptions.clear(),super.disconnectedCallback()}willUpdate(e){e.has(`routeData`)&&(this.data=this.routeData),this.bindList()}bindList(){let e=this.context;if(!e)return;let t=e.sessions,n=e.agentSelection.state.scopeId?.trim()||null;if(t===this.observedSessions&&n===this.observedScopeId)return;this.unsubscribeList?.(),this.observedSessions=t,this.observedScopeId=n;let r=g(e.agentSelection.state.scopeId),i=i=>{this.context!==e||this.observedSessions!==t||this.observedScopeId!==n||!i.result&&!i.error&&this.data?.result||(this.data=p(e,i),this.requestUpdate(),i.result?.hasMore&&!i.loading&&!i.error&&t.refreshList({...r,append:!0,offset:i.result.nextOffset??i.result.sessions.length}))};this.unsubscribeList=t.subscribeList(r,i);let a=t.listSnapshot(r);i(a),!a.result&&!a.loading&&e.gateway.snapshot.phase===`connected`&&t.refreshList(r)}render(){return ce(this.data,this.filters,{onFilterChange:e=>{this.filters={...this.filters,...e}},onNavigate:this.context?.navigate},this.context?.gateway.snapshot,this.previewError)}},V([z({context:E,subscribe:!0})],Q.prototype,`context`,void 0),V([M({attribute:!1})],Q.prototype,`routeData`,void 0),V([L()],Q.prototype,`filters`,void 0),V([L()],Q.prototype,`previewError`,void 0),customElements.get(`zero-dashboards-page`)||customElements.define(`zero-dashboards-page`,Q)})))()}$();
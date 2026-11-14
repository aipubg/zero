import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Hs as t,Pu as n,W as r,z as i,zu as a}from"./control-ui-core-DCNBgr3X.js";import{Aa as o,Ba as s,go as c,wo as l,za as u}from"./control-ui-core-DwX5Mpz4.js";import{G as d,J as f,W as p,n as m,t as h}from"./lit-runtime-B40xFCK_.js";import{c as g,l as _}from"./gateway-runtime-JSfC8ThO.js";import{Fi as v,I as y,K as b,Li as x}from"./control-ui-boot-shared-ZuP0LiFD.js";import{a as S,n as C,o as w,t as T}from"./roster-element-DasuvTln.js";function E(e){let{context:n}=e,r=(e,r,i)=>{t(e)&&(e.preventDefault(),n.navigate(r,i))},o=f`<a
    class="btn"
    href=${l(`agents`,n.basePath)}
    @click=${e=>r(e,`agents`)}
    >${a(`agentsHome.manage`)}</a
  >`;return f` <div class="agents-home__header">
      ${b({title:s(`agents-home`),subtitle:u(`agents-home`),actions:f`${o}
          <a
            class="btn primary"
            href=${e.canCreate?`${l(`custodian`,n.basePath)}?intent=new-agent`:l(`agents`,n.basePath)}
            @click=${t=>r(t,e.canCreate?`custodian`:`agents`,e.canCreate?{search:`?intent=new-agent`}:void 0)}
            >${a(`agentsHome.create`)}</a
          >`})}
    </div>
    <section class="agents-home" aria-label=${s(`agents-home`)}>
      ${e.connected?d:f`<div class="callout warn" role="status">${a(`agentsHome.disconnected`)}</div>`}
      ${e.connected&&e.error?f`<div class="callout danger" role="alert">
              ${e.error}
              <button class="btn btn--sm" @click=${e.onRetry}>${a(`common.retry`)}</button>
            </div>`:d}
      ${e.connected&&e.loading&&e.cards.length===0?f` <div
              role="status"
              aria-label=${a(`agentsHome.loading`)}
              class="agents-home__grid"
            >
              ${[0,1,2,3].map(()=>f`<div class="agents-home__skeleton" aria-hidden="true"></div>`)}
            </div>`:d}
      ${e.connected&&!e.loading&&!e.error&&e.cards.length===0?f` <div class="agents-home__empty">
              <p>${a(`agentsHome.empty`)}</p>
              ${o}
            </div>`:d}
      <div class="agents-home__grid">
        ${m(e.cards,e=>e.id,e=>f` <a
            class="agents-home__card"
            data-agent-id=${e.id}
            href=${e.target.href}
            @click=${t=>r(t,`chat`,e.target.options)}
          >
            <div class="agents-home__identity">
              <div class="agents-home__avatar" aria-hidden="true">
                ${x(e)}
              </div>
              <div class="agents-home__name">
                <h2>${e.name}</h2>
                ${e.role?f`<p>${e.role}</p>`:d}
              </div>
            </div>
            ${e.model?f`<span class="agents-home__model" title=${e.model}>${e.model}</span>`:d}
            <div class="agents-home__activity">
              ${e.activeNow?f`<span class="agents-home__working">${a(`agentsHome.working`)}</span>`:e.lastActiveAt?a(`agentsHome.lastActive`,{time:i(e.lastActiveAt)}):a(`agentsHome.neverActive`)}
            </div>
            <p class="agents-home__preview" title=${e.preview??``}>
              ${e.preview||a(`agentsHome.noMessage`)}
            </p>
            <span class="btn primary agents-home__open">${a(`agentsHome.openChat`)}</span>
          </a>`)}
      </div>
    </section>`}function D(){return(D=e((()=>{p(),h(),o(),c(),v(),y(),n(),S(),r(),w()})))()}var O,k,A;function j(){return(j=e((()=>{p(),C(),_(),D(),O=class extends T{render(){return this.avatars.withActiveRoutes(()=>E({cards:this.cards().toSorted((e,t)=>Number(t.activeNow)-Number(e.activeNow)||t.lastActiveAt-e.lastActiveAt||Number(t.id===this.context.agents.state.agentsList?.defaultId)-Number(e.id===this.context.agents.state.agentsList?.defaultId)||e.id.localeCompare(t.id)),context:this.context,connected:this.connected,loading:this.roster.loading,error:this.roster.error??this.roster.subscriptionError,onRetry:()=>void this.refresh(),canCreate:g(this.context.gateway.snapshot,`zero.chat`,`operator.admin`)}))}},k=!0,A=()=>f`<zero-agents-home-page></zero-agents-home-page>`,customElements.get(`zero-agents-home-page`)||customElements.define(`zero-agents-home-page`,O)})))()}j();export{O as AgentsHomePage,k as header,A as render};
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Hs as t,Ic as n,Jr as r,Lc as i,Lu as a,Nu as o,Pu as s,Yr as c,ju as l,zu as u}from"./control-ui-core-DCNBgr3X.js";import{Aa as d,Ai as f,Ba as p,ca as m,go as h,ki as g,or as _,sa as v,sr as y,wo as b}from"./control-ui-core-DwX5Mpz4.js";import{G as x,J as S,W as C,Z as w,rt as T}from"./lit-runtime-B40xFCK_.js";import{Ur as E,Wr as D,Zr as O}from"./ui-AaV6iNVa.js";import{l as k,u as A}from"./control-ui-boot-shared-ZuP0LiFD.js";import{C as j,S as M,_ as N,b as P,d as F,g as I,h as L,m as R,p as z,v as B,y as V}from"./control-ui-boot-new-5_2Ky4dv.js";function H(e){return new Date(e).toLocaleDateString(a.getLocale())}function U(e,t={}){let n=I.filter(t=>e.has(t.id)).length,r=n===I.length,i=u(`quickSettings.appearance.lobsterdexSeen`,{seen:String(n),total:String(I.length)});return S`
    <section class="lobsterdex-page">
      <header
        class="lobsterdex-page__header ${r?`lobsterdex-page__header--complete`:``}"
      >
        <div>
          <h2>${u(`tabs.lobsterdex`)}</h2>
          <p>${u(`subtitles.lobsterdex`)}</p>
        </div>
        <span class="lobsterdex-page__count">${i}</span>
      </header>
      <span class="sr-only" role="status">
        ${t.copyFeedback?.status===`copied`?u(`common.copied`):x}
      </span>
      ${t.copyFeedback?.status===`error`?S`<div class="callout danger" role="alert">${u(`common.copyFailed`)}</div>`:x}
      <section class="lobsterdex-page__grid" aria-label=${i}>
        ${I.map(n=>{let r=F(n),i=e.get(n.id),a=i!==void 0,o=a?i.name??P(n.id):`?`,s=B[n.id],c=a&&i.firstSeenAt!==null?u(`quickSettings.appearance.lobsterdexCardFirstVisited`,{date:H(i.firstSeenAt)}):null,l=i?.shinySeenAt==null?null:u(`quickSettings.appearance.lobsterdexCardShinySeen`,{date:H(i.shinySeenAt)});return S`
            <article
              id="lobsterdex-${n.id}"
              class="lobsterdex-page__card ${a?``:`lobsterdex-page__card--unseen`}"
            >
              <button
                type="button"
                class="lobsterdex-page__copy-link"
                aria-label=${u(`quickSettings.appearance.lobsterdexCardCopyLink`)}
                @click=${()=>t.onCopyLink?.(n.id)}
              >
                <span aria-hidden="true"
                  >${t.copyFeedback?.status===`copied`&&t.copyFeedback.paletteId===n.id?v.check:v.link}</span
                >
              </button>
              <div
                class="lobsterdex-page__sprite lobster-pet lobster-pet--palette-${n.id} ${a?``:`lobsterdex__mini--unseen`}"
                style=${R(r)}
              >
                ${L(r,{standalone:!0})}
                ${i?.shinySeenAt==null?x:S`<span
                        class="lobsterdex__mini-star lobsterdex-page__star"
                        aria-hidden="true"
                        >✦</span
                      >`}
              </div>
              <h3>${o}</h3>
              <p class="lobsterdex-page__lore">${a?s.flavor:s.hint}</p>
              <div class="lobsterdex-page__dates">
                ${[c,l].map(e=>e?S`<p class="lobsterdex-page__date"><time>${e}</time></p>`:x)}
              </div>
            </article>
          `})}
      </section>
    </section>
  `}function W(){return(W=e((()=>{C(),m(),z(),V(),N(),s()})))()}var G;function K(){return(K=e((()=>{D(),C(),w(),d(),h(),f(),_(),j(),N(),k(),s(),c(),o(),i(),W(),G=class extends l{constructor(...e){super(...e),this.subscriptions=new n(this).watchStore(()=>this.context?.theme),this.copyFeedback=null,this.copyAttempt=0,this.copyResetTimer=null,this.copyLink=async e=>{let t=++this.copyAttempt;this.copyFeedback=null,window.clearTimeout(this.copyResetTimer??void 0),this.copyResetTimer=null;let n=`${location.origin}${location.pathname}#lobsterdex-${e}`,i=await r(n,()=>this.isConnected&&t===this.copyAttempt);this.isConnected&&t===this.copyAttempt&&(this.copyFeedback={paletteId:e,status:i?`copied`:`error`},this.copyResetTimer=window.setTimeout(()=>{this.copyFeedback=null,this.copyResetTimer=null},1500))}}disconnectedCallback(){this.subscriptions.clear(),this.copyAttempt+=1,this.copyFeedback=null,window.clearTimeout(this.copyResetTimer??void 0),this.copyResetTimer=null,super.disconnectedCallback()}firstUpdated(){if(!location.hash.startsWith(`#lobsterdex-`))return;let e=I.find(e=>e.id===location.hash.slice(12));if(!e)return;let t=this.querySelector(`#lobsterdex-${e.id}`);if(!t)return;let n=e=>{e.target===t&&e.animationName===`lobsterdex-card-highlight`&&(t.classList.remove(`lobsterdex-page__card--highlight`),t.removeEventListener(`animationend`,n))};t.addEventListener(`animationend`,n),t.classList.add(`lobsterdex-page__card--highlight`),requestAnimationFrame(()=>{requestAnimationFrame(()=>t.scrollIntoView({block:`center`}))})}render(){return S`
      <section class="content-header" ${y({toolbarHeader:!0})}>
        <h1 class="page-title">${p(`lobsterdex`)}</h1>
      </section>
      ${A(this.context.theme.branding.lobsterdex?U(M(),{copyFeedback:this.copyFeedback,onCopyLink:e=>void this.copyLink(e)}):S`<section class="settings-section" role="status">
              <p>${u(`quickSettings.appearance.lobsterdexThemeHidden`)}</p>
              <a
                class="btn btn--sm"
                href=${b(`appearance`,this.context.basePath)}
                @click=${e=>{t(e)&&(e.preventDefault(),this.context.navigate(`appearance`))}}
                >${p(`appearance`)}</a
              >
            </section>`)}
    `}},O([E({context:g,subscribe:!0})],G.prototype,`context`,void 0),O([T()],G.prototype,`copyFeedback`,void 0),customElements.get(`zero-lobsterdex-page`)||customElements.define(`zero-lobsterdex-page`,G)})))()}K();
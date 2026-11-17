import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{F as t,I as n,Ic as r,Jr as i,Lc as a,Nu as ee,Pu as te,W as o,Yr as s,ju as c,z as l,zu as u}from"./control-ui-core-DCNBgr3X.js";import{Aa as d,Ai as f,Ba as p,Fi as m,Qi as h,ca as ne,ea as re,fa as ie,ki as ae,ma as g,or as oe,sa as _,sr as se}from"./control-ui-core-DwX5Mpz4.js";import{G as v,J as y,W as b,Z as x,rt as S}from"./lit-runtime-B40xFCK_.js";import{At as C,jt as w,kt as T}from"./control-ui-boot-shared-BX8huZUb.js";import{Ni as E,Ur as D,Wr as O,Zr as k,ci as A}from"./ui-AaV6iNVa.js";import{Bn as j,G as M,I as N,Xi as P,Y as F,Yi as I,l as L,q as ce,tt as R,u as z,zn as B}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Fc as V,Pc as H}from"./control-ui-boot-shared-CzJHozXQ.js";import{_ as U,d as W,g as G,h as le,m as ue,p as de}from"./control-ui-boot-new-5_2Ky4dv.js";function K(){return y`<span class="muted">${u(`aboutPage.unavailable`)}</span>`}function fe(e){if(!e)return v;let t=Date.parse(e);if(!Number.isFinite(t))return v;let r=n(t,{dateStyle:`medium`,timeStyle:`short`});return y`
    <time class="about-commit__age" dir="auto" datetime=${e} title=${r}
      >${l(t,{fallback:``})}</time
    >
  `}function pe(e){let t=e.buildInfo.commit;if(!t)return K();let n=u({idle:`aboutPage.copyCommit`,copying:`aboutPage.copyingCommit`,copied:`aboutPage.copiedCommit`,error:`aboutPage.copyCommitFailed`}[e.copyState]);return y`
    <span class="about-commit">
      <code dir="ltr" title=${t}>${t.slice(0,q)}</code>
      ${fe(e.buildInfo.commitAt)}
      <zero-tooltip .content=${n}>
        <button
          type="button"
          class="about-commit__copy"
          aria-label=${n}
          aria-busy=${e.copyState===`copying`?`true`:v}
          ?disabled=${e.copyState===`copying`}
          @click=${e.onCopyCommit}
        >
          <span aria-hidden="true">${e.copyState===`copied`?_.check:_.copy}</span>
        </button>
      </zero-tooltip>
      <span class="sr-only" role="status" aria-live="polite"
        >${e.copyState===`copied`||e.copyState===`error`?n:``}</span
      >
    </span>
  `}function me(e){let t=G.find(e=>e.id===`crimson`)??E(G[0],`about lobster palette`),n=W(t);return y`
    <section class="about-hero">
      ${g().brandIcon===`claw`?y`<button
              type="button"
              class="about-hero__clawd ${e.clawdWaving?`about-hero__clawd--wave`:``}"
              style=${ue(n)}
              aria-label=${u(`aboutPage.waveHello`)}
              @click=${e.onPokeClawd}
            >
              ${le(n)}
            </button>`:y`<span class="about-hero__mark--neutral" aria-hidden="true"
              >${P()}</span
            >`}
      <h2 class="about-hero__name">${g().brandName}</h2>
      <p class="about-hero__tagline">${u(`aboutPage.tagline`)}</p>
      ${e.buildInfo.version?y`<code class="about-hero__version" dir="ltr">v${e.buildInfo.version}</code>`:v}
      <nav class="about-hero__links" aria-label=${u(`aboutPage.linksLabel`)}>
        ${(g().communityLinks?J:[]).map(e=>y`
            <a
              class="about-hero__link"
              href=${e.href}
              target=${T}
              rel=${C()}
            >
              <span class="about-hero__link-icon" aria-hidden="true">${e.icon}</span>
              <span>${u(e.labelKey)}</span>
            </a>
          `)}
      </nav>
    </section>
  `}function he(e){let n=t(Date.parse(e.buildInfo.builtAt??``),{dateStyle:`medium`,timeZone:`UTC`},``),r=y`
    <dl class="settings-kv about-build-grid" aria-label=${u(`aboutPage.artifactDetails`)}>
      <dt>${u(`aboutPage.version`)}</dt>
      <dd>
        ${e.buildInfo.version?y`<code dir="ltr" title=${e.buildInfo.version}
                >${e.buildInfo.version}</code
              >`:K()}
      </dd>
      <dt>${u(`aboutPage.commit`)}</dt>
      <dd>${pe(e)}</dd>
      ${e.buildInfo.branch?y`
              <dt>${u(`aboutPage.branch`)}</dt>
              <dd>
                <code dir="ltr" title=${e.buildInfo.branch}
                  >${e.buildInfo.branch}${e.buildInfo.dirty===!0?`*`:``}</code
                >
              </dd>
            `:v}
      <dt>${u(`aboutPage.built`)}</dt>
      <dd>
        ${n&&e.buildInfo.builtAt?y`<time
                dir="auto"
                datetime=${e.buildInfo.builtAt}
                title=${e.buildInfo.builtAt}
                >${n}</time
              >`:K()}
      </dd>
    </dl>
  `;return M([me(e),F({title:u(`aboutPage.artifactTitle`),description:u(`aboutPage.artifactSubtitle`)},r),F({},ce({title:u(`aboutPage.gatewayVersion`),description:u(`aboutPage.gatewayVersionHint`),control:e.gatewayVersion?R(y`<code dir="ltr" title=${e.gatewayVersion}>${e.gatewayVersion}</code>`,{mono:!0}):R(u(`aboutPage.unavailable`))})),y`<p class="about-footer">${u(`aboutPage.license`)}</p>`])}var q,J;function Y(){return(Y=e((()=>{A(),b(),j(),ne(),de(),U(),ie(),N(),m(),I(),te(),w(),o(),V(),q=12,J=[]})))()}var X,Z,Q;function $(){return($=e((()=>{O(),b(),x(),d(),f(),oe(),re(),L(),s(),ee(),a(),Y(),X=1800,Z=1400,Q=class extends c{constructor(...e){super(...e),this.copyState=`idle`,this.clawdWaving=!1,this.copyResetTimer=null,this.waveResetTimer=null,this.subscriptions=new r(this).watchStore(()=>this.context?.gateway).watchStore(()=>this.context?.theme)}disconnectedCallback(){this.subscriptions.clear(),globalThis.clearTimeout(this.copyResetTimer??void 0),this.copyResetTimer=null,globalThis.clearTimeout(this.waveResetTimer??void 0),this.waveResetTimer=null,super.disconnectedCallback()}pokeClawd(){this.clawdWaving||(this.clawdWaving=!0,this.waveResetTimer=globalThis.setTimeout(()=>{this.waveResetTimer=null,this.clawdWaving=!1},Z))}async copyCommit(){let e=h.commit;if(!e||this.copyState===`copying`)return;globalThis.clearTimeout(this.copyResetTimer??void 0),this.copyResetTimer=null,this.copyState=`copying`;let t=await i(e);this.isConnected&&(this.copyState=t?`copied`:`error`,this.copyResetTimer=globalThis.setTimeout(()=>{this.copyResetTimer=null,this.copyState=`idle`},X))}render(){let e=this.context.gateway.snapshot,t=e.phase===`connected`&&e.hello?.server?.version?.trim()||null,n=he({buildInfo:h,gatewayVersion:t,copyState:this.copyState,onCopyCommit:()=>void this.copyCommit(),clawdWaving:this.clawdWaving,onPokeClawd:()=>this.pokeClawd()});return y`
      <section class="content-header" ${se({toolbarHeader:!0})}>
        <div>
          <h1 class="page-title">${p(`about`)}</h1>
        </div>
      </section>
      ${z(n)}
    `}},k([D({context:ae,subscribe:!0})],Q.prototype,`context`,void 0),k([S()],Q.prototype,`copyState`,void 0),k([S()],Q.prototype,`clawdWaving`,void 0),customElements.get(`zero-about-page`)||customElements.define(`zero-about-page`,Q)})))()}$();
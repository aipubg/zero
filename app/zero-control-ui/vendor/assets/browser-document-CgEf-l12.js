import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Au as t,Nu as n,Pu as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{Zt as a,_i as o,at as s,en as c,gi as l,st as u}from"./control-ui-core-DwX5Mpz4.js";import{G as d,J as f,W as p,Z as m,at as h}from"./lit-runtime-B40xFCK_.js";import{Zr as g}from"./ui-AaV6iNVa.js";import{_a as _,ga as v}from"./control-ui-boot-shared-ZuP0LiFD.js";import{n as y}from"./browser-panel-Ds4TuZgB.js";var b;function x(){return(x=e((()=>{p(),m(),a(),s(),r(),n(),l(),y(),v(),b=class extends t{constructor(...e){super(...e),this.props=null}render(){if(!this.props)return d;let{context:e,target:t,renderEscape:n}=this.props,r=e.gateway.snapshot,a=r.phase===`connected`,s=r.phase===`starting`?i(`common.gatewayStarting`):void 0,l=_(t.tab),p=!!(l&&u(r));return f`
      <zero-browser-panel
        embedded
        style=${p?`height: 100dvh;`:`display: none;`}
        .client=${a?r.client:null}
        .available=${p}
        .remoteAvailable=${p}
        .presented=${!0}
        .sessionKey=${t.sessionKey}
        .fixedTab=${l}
        .resourceBasePath=${e.resourceBasePath}
        .authToken=${c({hello:r.hello,settings:{token:e.gateway.connection.token},password:e.gateway.connection.password})}
      ></zero-browser-panel>
      ${!a&&r.lastError===null?o(s):d}
      ${!p&&(a||r.lastError)?f`<main class="connect-splash" role="status">
              <div class="stack">
                <span>${i(l?`browser.unavailable`:`focus.unsupported`)}</span>
                ${n(i(`common.back`))}
              </div>
            </main>`:d}
    `}},g([h({attribute:!1})],b.prototype,`props`,void 0),customElements.get(`zero-browser-document`)||customElements.define(`zero-browser-document`,b)})))()}x();
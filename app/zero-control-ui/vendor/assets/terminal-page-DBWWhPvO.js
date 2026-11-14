import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{$c as t,Ic as n,Is as r,Lc as i,Ls as a,Nu as o,Pu as s,el as c,ju as l,kl as u,nl as d,zu as f}from"./control-ui-core-DCNBgr3X.js";import{Ai as p,Io as m,Mo as h,ca as g,go as _,ki as v,sa as y,uo as b}from"./control-ui-core-DwX5Mpz4.js";import{G as x,J as S,W as C,Z as w,at as T,c as E,l as D}from"./lit-runtime-B40xFCK_.js";import{Ur as O,Wr as k,Zr as A,uo as j}from"./ui-AaV6iNVa.js";import{n as M,t as N}from"./panel-empty-state-anOYDn4d.js";import{t as P}from"./terminal-panel-registration-BkODrgwW.js";function F(e,t=``){let n=h(e,b),r=m(n.pathname,t);if(r)return{sessionId:r};let i=c(n.search);return i?{catalog:i}:null}function I(){return(I=e((()=>{_(),d()})))()}var L;function R(){return(R=e((()=>{k(),C(),w(),E(),p(),g(),N(),P(),s(),d(),u(),r(),o(),i(),I(),L=class extends l{constructor(){super(),this.location=null,new n(this).watchStore(()=>this.context?.gateway).watchStore(()=>this.context?.config).watchStore(()=>this.context?.theme).watchStore(()=>this.context?.agentSelection)}render(){let e=this.context,n=e.gateway.snapshot,r=a(n,e.config.current.terminalEnabled??!1),i=e.agentSelection.state.selectedId??n.assistantAgentId,o=this.location?F(this.location,e.basePath):null,s=o?`sessionId`in o?o.sessionId:t(o.catalog):``;return D(s,S`<zero-terminal-panel
          ?hidden=${!r}
          embedded
          fullscreen
          .page=${!0}
          .routeTarget=${o}
          .client=${n.phase===`connected`?n.client:null}
          .available=${r}
          .agentId=${i?j(i):null}
          .basePath=${e.basePath}
          .themeMode=${e.theme.resolvedMode}
        ></zero-terminal-panel>
        ${r?x:M({icon:y.terminal,heading:f(`terminal.title`),description:f(`terminal.unavailable`),action:S`<button class="btn" @click=${()=>e.navigate(`new-session`)}>
                  ${f(`newSession.title`)}
                </button>`})}`)}},A([O({context:v,subscribe:!0})],L.prototype,`context`,void 0),A([T({attribute:!1})],L.prototype,`location`,void 0),customElements.define(`zero-terminal-page`,L)})))()}R();
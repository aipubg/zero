import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Au as t,Nu as n}from"./control-ui-core-DCNBgr3X.js";import{G as r,J as i,W as a,Z as o,at as s,rt as c}from"./lit-runtime-B40xFCK_.js";import{Zr as l}from"./ui-AaV6iNVa.js";import{i as u,r as d}from"./control-ui-boot-chat-D02HpoEK.js";var f;function p(){return(p=e((()=>{a(),o(),u(),n(),f=class extends t{constructor(...e){super(...e),this.routeUrl=null,this.authTokens=[],this.authReady=!1,this.fallback=r,this.undecodableRouteUrl=null,this.loader=new d(this)}render(){return this.loader.withActiveRoutes(()=>this.renderContent())}renderContent(){let e=this.routeUrl,t=e&&this.authReady&&this.undecodableRouteUrl!==e?this.loader.resolve(e,this.authTokens):null;return t?i`<img
      class="channel-avatar"
      src=${t}
      alt=""
      aria-hidden="true"
      decoding="async"
      @error=${()=>{this.undecodableRouteUrl=e}}
    />`:this.fallback}},l([s({attribute:!1})],f.prototype,`routeUrl`,void 0),l([s({attribute:!1})],f.prototype,`authTokens`,void 0),l([s({attribute:!1})],f.prototype,`authReady`,void 0),l([s({attribute:!1})],f.prototype,`fallback`,void 0),l([c()],f.prototype,`undecodableRouteUrl`,void 0),customElements.get(`zero-channel-avatar`)||customElements.define(`zero-channel-avatar`,f)})))()}p();
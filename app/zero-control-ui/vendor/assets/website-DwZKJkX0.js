import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gu as t,Nu as n,Pu as r,Wu as i,ju as a,zu as o}from"./control-ui-core-DCNBgr3X.js";import{Ai as s,ca as c,ki as l,sa as u}from"./control-ui-core-DwX5Mpz4.js";import{G as d,J as f,W as p,Z as m,at as h}from"./lit-runtime-B40xFCK_.js";import{Ur as g,Wr as _,Zr as v}from"./ui-AaV6iNVa.js";import{N as y,O as b,_ as x,k as S}from"./config-runtime-BecGLziM.js";import{a as C,c as w}from"./control-ui-boot-chat-zkzP5WWm.js";import{n as T}from"./sandbox-host-Dm6XHU23.js";import{n as E,r as D}from"./board-layout-BmeSfx17.js";function O(e){let t=k.safeParse(e);if(!t.success)throw new E(`invalid_operation`,`Website props must contain only a valid HTTPS url of at most 2048 characters`);let n=new URL(t.data.url);if(n.username||n.password)throw new E(`invalid_operation`,`Website URLs must not contain embedded credentials`);return t.data}var k;function A(){return(A=e((()=>{x(),D(),k=b({url:S().max(2048).pipe(y({protocol:/^https$/,normalize:!0}).max(2048))})})))()}var j,M;function N(){return(N=e((()=>{t(),j={board:{widget:{websiteOpen:`Open website`,websiteEmbedHint:`If this site does not load here, open it in a new tab.`,websiteSameOrigin:`Open this website in a new tab. Gateway and Control UI pages cannot be embedded in a website widget.`}}},M=Object.assign(()=>Object.assign(i.board.widget,j.board.widget),{catalog:j})})))()}var P;function F(){return(F=e((()=>{_(),p(),m(),A(),s(),C(),c(),r(),N(),n(),M(),P=class extends a{constructor(...e){super(...e),this.active=!0,this.activated=!1}willUpdate(){this.activated||=this.active}render(){if(!this.activated)return d;let e;try{e=new URL(O(this.widget?.props).url)}catch(e){return w(e)}let t=T(this.context?.gateway.connection.gatewayUrl??``,window.location.origin),n=new URL(t).hostname,r=e.hostname===window.location.hostname||e.hostname===n;return f`<div class="board-website">
      ${r?f`<p class="board-website__notice" role="alert">
              ${o(`board.widget.websiteSameOrigin`)}
            </p>`:f`<iframe
              class="board-website__frame"
              title=${this.widget?.title||o(`board.widget.kindWebsite`)}
              src=${e.href}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerpolicy="no-referrer"
            ></iframe>`}
      <div class="board-website__footer">
        <span class="board-website__origin">${e.host}</span>
        <a
          href=${e.href}
          target="_blank"
          rel="noopener noreferrer"
          title=${o(`board.widget.websiteEmbedHint`)}
        >
          ${o(`board.widget.websiteOpen`)}${u.externalLink}
        </a>
      </div>
    </div>`}},v([g({context:l,subscribe:!0})],P.prototype,`context`,void 0),v([h({attribute:!1})],P.prototype,`widget`,void 0),v([h({type:Boolean})],P.prototype,`active`,void 0),customElements.get(`zero-website-widget`)||customElements.define(`zero-website-widget`,P)})))()}F();
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Jr as t,Mu as n,Nu as r,Pu as i,Yr as a,zu as o}from"./control-ui-core-DCNBgr3X.js";import{ca as s,sa as c}from"./control-ui-core-DwX5Mpz4.js";import{G as l,J as u,W as d,Z as f,at as p,lt as m,rt as h}from"./lit-runtime-B40xFCK_.js";import{N as g,Sa as _,Zr as v}from"./ui-AaV6iNVa.js";import{Mi as y,v as b}from"./control-ui-boot-shared-ZuP0LiFD.js";import{M as x,j as S}from"./markdown-runtime-ORQpioyT.js";import{n as C}from"./theme-color-DAo4KRoc.js";var w;function T(){return(T=e((()=>{w=new URL(`frame-BoCsE8xn.js`,import.meta.url).href})))()}var E;function D(){return(D=e((()=>{E=new URL(`mermaid.min-RZ6v1efX.js`,import.meta.url).href})))()}var O;function k(){return(k=e((()=>{D(),O=E})))()}function A(e,t){if(e.length>I)throw Error(`Mermaid diagram output is too large.`);let n=x(window).sanitize(e,{ALLOWED_TAGS:V,ALLOWED_ATTR:H,ALLOW_DATA_ATTR:!1,ALLOW_ARIA_ATTR:!0,RETURN_DOM_FRAGMENT:!0}),r=n.firstElementChild;if(n.childElementCount!==1||!(r instanceof SVGSVGElement))throw Error(`Mermaid returned an invalid diagram.`);let i=[r,...r.querySelectorAll(`*`)];if(i.length>L)throw Error(`Mermaid diagram contains too many elements.`);let a=document.createElement(`canvas`).getContext(`2d`);if(!a)throw new N(`Mermaid diagram colors could not be prepared.`);for(let e of i){for(let t of[`marker-start`,`marker-mid`,`marker-end`,`clip-path`,`mask`]){let n=e.getAttribute(t);n&&n!==`none`&&!B.test(n)&&e.removeAttribute(t)}for(let t of[`fill`,`stroke`,`stop-color`]){let n=e.getAttribute(t);n&&n!==`none`&&!B.test(n)&&(a.fillStyle=`#000000`,a.fillStyle=n,e.setAttribute(t,a.fillStyle))}}r.setAttribute(`xmlns`,z);let o=document.createElementNS(z,`rect`),s=r.viewBox.baseVal;return o.setAttribute(`x`,String(s.x)),o.setAttribute(`y`,String(s.y)),o.setAttribute(`width`,`100%`),o.setAttribute(`height`,`100%`),a.fillStyle=t,o.setAttribute(`fill`,a.fillStyle),r.prepend(o),new XMLSerializer().serializeToString(r)}function j(){if(!O)throw new N(`The Mermaid classic script URL was not injected.`);let e=document.createElement(`iframe`),t=new MessageChannel,n,r,i=new Promise((e,t)=>{n=e,r=t}),a,o=0,s=!1,c=!1,l=!1,u,d={frame:e,ready:i,dispose(n){l||(l=!0,window.clearTimeout(u),t.port1.close(),t.port2.close(),e.remove(),r(n),a?.reject(n),a=void 0,U===d&&(U=void 0))},render(n,r){return l||!e.isConnected?Promise.reject(new N(`Mermaid renderer is unavailable.`)):new Promise((e,i)=>{let s=++o;a={id:s,resolve:e,reject:i},u=window.setTimeout(()=>d.dispose(new N(`Mermaid diagram rendering timed out.`)),R),t.port1.postMessage({id:s,source:n,config:r,maxSvgLength:I,maxSvgElements:L})})}};t.port1.addEventListener(`message`,t=>{if(l||!e.isConnected)return;let r=_(t.data);if(!s&&r.type===`ready`){s=!0,window.clearTimeout(u),n();return}let i=a;s&&i&&r.id===i.id&&(a=void 0,window.clearTimeout(u),typeof r.error==`string`?i.reject(Error(r.error)):typeof r.svg==`string`&&r.svg.length<=I?i.resolve(r.svg):i.reject(Error(`Mermaid returned an invalid diagram.`)))}),t.port1.start(),e.addEventListener(`load`,()=>{if(c){d.dispose(new N(`Mermaid renderer navigated unexpectedly.`));return}c=!0,e.contentWindow?.postMessage({type:`zero:mermaid-init`},`*`,[t.port2])}),e.setAttribute(`sandbox`,`allow-scripts`),e.setAttribute(`aria-hidden`,`true`),e.tabIndex=-1,e.inert=!0,e.referrerPolicy=`no-referrer`,e.style.cssText=`position:fixed;left:-10000px;top:0;width:1024px;height:768px;border:0;visibility:hidden;pointer-events:none`;let f=[O,w].map(e=>new URL(e,location.href).href),p=`default-src 'none'; script-src ${f.join(` `)}; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'`,m=document.implementation.createHTMLDocument(``),h=m.createElement(`meta`);h.httpEquiv=`Content-Security-Policy`,h.content=p,m.head.append(h);for(let e of f){let t=m.createElement(`script`);t.src=e,m.head.append(t)}return e.srcdoc=`<!doctype html>${m.documentElement.outerHTML}`,u=window.setTimeout(()=>d.dispose(new N(`Mermaid renderer could not be loaded.`)),R),document.body.append(e),d}function M(e,t){if(!e.trim()||e.length>P)return Promise.reject(Error(`Mermaid diagrams must contain 1–${P} characters.`));let n=W.then(async()=>{U&&!U.frame.isConnected&&U.dispose(new N(`Mermaid renderer was removed.`)),U??=j();let n=U;try{await n.ready;let r={startOnLoad:!1,securityLevel:`strict`,secure:[`dompurifyConfig`],htmlLabels:!1,suppressErrorRendering:!0,maxTextSize:P,maxEdges:F,arrowMarkerAbsolute:!1,theme:`base`,look:`classic`,flowchart:{layout:`dagre`},state:{layout:`dagre`},class:{layout:`dagre`},er:{layout:`dagre`},requirement:{layout:`dagre`},themeCSS:``,fontFamily:t.fontFamily,themeVariables:{darkMode:t.darkMode,background:t.background,primaryColor:t.background,primaryTextColor:t.foreground,primaryBorderColor:t.border,lineColor:t.muted,secondaryColor:t.accent,tertiaryColor:t.background,textColor:t.foreground,edgeLabelBackground:t.background}};return A(await n.render(e,r),t.background)}catch(e){throw n.dispose(e instanceof Error?e:Error(String(e))),e}});return W=n.then(()=>{},()=>{}),n}var N,P,F,I,L,R,z,B,V,H,U,W;function G(){return(G=e((()=>{S(),T(),k(),N=class extends Error{},P=2e4,F=200,I=1e6,L=5e3,R=15e3,z=`http://www.w3.org/2000/svg`,B=/^url\(["']?(#[^\s"'()]+)["']?\)$/u,V=[`svg`,`g`,`defs`,`marker`,`path`,`rect`,`circle`,`ellipse`,`polygon`,`polyline`,`line`,`text`,`tspan`,`title`,`desc`,`clipPath`,`mask`,`linearGradient`,`radialGradient`,`stop`,`pattern`],H=`id.xmlns.viewBox.width.height.x.y.dx.dy.x1.y1.x2.y2.cx.cy.r.rx.ry.d.points.transform.preserveAspectRatio.fill.fill-opacity.fill-rule.stroke.stroke-width.stroke-opacity.stroke-linecap.stroke-linejoin.stroke-dasharray.stroke-dashoffset.opacity.font-family.font-size.font-weight.font-style.text-anchor.dominant-baseline.alignment-baseline.baseline-shift.text-decoration.letter-spacing.word-spacing.visibility.display.markerWidth.markerHeight.refX.refY.orient.markerUnits.marker-start.marker-mid.marker-end.clip-path.mask.gradientUnits.gradientTransform.offset.stop-color.stop-opacity.patternUnits.patternContentUnits.patternTransform.role`.split(`.`),W=Promise.resolve(),window.addEventListener(`pagehide`,()=>U?.dispose(new N(`Mermaid renderer closed.`)))})))()}function K(){let e=document.documentElement,t=getComputedStyle(e),n=e.dataset.themeMode===`dark`;return{background:C(t,`--card`)||(n?`#181818`:`#ffffff`),foreground:C(t,`--text`)||(n?`#eeeeee`:`#171717`),muted:C(t,`--muted`)||`#888888`,border:C(t,`--border-hover`)||`#888888`,accent:C(t,`--accent`)||`#888888`,fontFamily:t.getPropertyValue(`--font-body`).trim()||`system-ui, sans-serif`,darkMode:n}}function q(e,t,n){let r=X.get(e);return r?X.delete(e):(r=M(t,n),r.catch(()=>{X.get(e)===r&&X.delete(e)})),X.set(e,r),g(X,Y),r}function J(e){let t=!1,n=e.matches(`.markdown-mermaid`)?[e]:e.querySelectorAll(`.markdown-mermaid`);for(let e of n){let n=e.querySelector(`pre code`);if(!n)continue;let r=document.createElement(`zero-mermaid`);r.source=n.textContent??``,e.replaceChildren(r),t=!0}return t}var Y,X,Z;function Q(){return(Q=e((()=>{G(),d(),f(),i(),a(),r(),s(),b(),y(),Y=16,X=new Map,Z=class extends n{constructor(...e){super(...e),this.source=``,this.imageUrl=``,this.showSource=!1,this.expanded=!1,this.renderKey=``,this.generation=0,this.copyAttempt=0,this.themeObserver=new MutationObserver(()=>void this.renderDiagram())}static{this.styles=m`
    :host {
      display: block;
      position: relative;
      min-width: 0;
      margin: 12px 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-md, 10px);
      overflow: hidden;
      background: var(--card);
      color: var(--text);
      font-family: var(--font-body);
    }
    .actions {
      position: absolute;
      inset-block-start: 6px;
      inset-inline-end: 6px;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: var(--radius-sm, 6px);
      background: transparent;
      color: var(--muted);
      font: inherit;
      cursor: default;
    }
    button:hover,
    button[aria-expanded="true"] {
      background: var(--bg-hover);
      color: var(--text);
    }
    button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -2px;
    }
    button svg {
      width: 15px;
      height: 15px;
    }
    .copy-button {
      opacity: 0;
      pointer-events: none;
    }
    :host(:hover) .copy-button,
    :host(:focus-within) .copy-button {
      opacity: 1;
      pointer-events: auto;
    }
    .copy-feedback {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    wa-dropdown::part(menu) {
      min-width: 160px;
      padding: var(--menu-padding);
      border: 1px solid var(--overlay-border);
      border-radius: var(--menu-radius);
      background: var(--bg-elevated);
      box-shadow: var(--overlay-shadow);
    }
    wa-dropdown-item {
      min-height: var(--menu-item-height);
      padding: 0 8px;
      border-radius: var(--menu-item-radius);
      color: var(--text);
      font: 12px var(--font-body);
      cursor: default;
    }
    wa-dropdown-item:hover,
    wa-dropdown-item:focus-visible {
      background: var(--bg-hover);
    }
    .preview {
      padding: 36px 16px 16px;
      overflow: auto;
    }
    img {
      display: block;
      width: 100%;
      max-height: 480px;
      object-fit: contain;
    }
    pre {
      margin: 0;
      padding: 36px 16px 16px;
      overflow: auto;
      max-height: 480px;
      font: 12px/1.6 var(--mono);
      tab-size: 2;
    }
    .status {
      margin: 0;
      padding: 36px 16px 12px;
      font-size: 12px;
      color: var(--muted);
    }
    @media (hover: none), (pointer: coarse) {
      button {
        width: 36px;
        height: 36px;
      }
      .copy-button {
        opacity: 1;
        pointer-events: auto;
      }
      .preview,
      pre,
      .status {
        padding-top: 44px;
      }
    }
  `}connectedCallback(){super.connectedCallback(),this.themeObserver.observe(document.documentElement,{attributes:!0,attributeFilter:[`data-theme`,`data-theme-mode`,`style`]}),this.hasUpdated&&this.renderDiagram()}disconnectedCallback(){this.themeObserver.disconnect(),this.generation+=1,this.copyAttempt+=1,this.renderKey=``,this.expanded=!1,this.releaseImage(),super.disconnectedCallback()}updated(e){e.has(`source`)&&(this.copyResult=void 0,this.copyAttempt+=1,this.releaseImage(),this.renderDiagram())}releaseImage(){this.imageUrl&&=(URL.revokeObjectURL(this.imageUrl),``)}async renderDiagram(){let e=K(),t=JSON.stringify([this.source,e]);if(!this.isConnected||t===this.renderKey)return;this.renderKey=t;let n=++this.generation;this.renderStatus=`rendering`;try{let r=await q(t,this.source,e);if(!this.isConnected||n!==this.generation)return;this.releaseImage(),this.imageUrl=URL.createObjectURL(new Blob([r],{type:`image/svg+xml`})),this.renderStatus=void 0}catch(e){this.isConnected&&n===this.generation&&(this.releaseImage(),this.renderStatus=e instanceof N?`rendererError`:`error`)}}async copySource(){let e=++this.copyAttempt,n=()=>this.isConnected&&e===this.copyAttempt,r=await t(this.source,n);n()&&(this.copyResult=r)}render(){let e=this.renderStatus!==void 0&&this.renderStatus!==`rendering`,t=this.showSource||e,n=o(this.copyResult===void 0?`chat.mermaid.copySource`:this.copyResult?`common.copied`:`common.copyFailed`);return u`
      <div class="actions">
        <button
          class="copy-button"
          type="button"
          aria-label=${n}
          title=${n}
          @click=${()=>void this.copySource()}
        >
          <span aria-hidden="true"
            >${this.copyResult===void 0?c.copy:this.copyResult?c.check:c.x}</span
          >
        </button>
        <wa-dropdown
          placement="bottom-end"
          size="s"
          .distance=${4}
          aria-label=${o(`chat.mermaid.options`)}
          @wa-select=${e=>{let t=e.detail.item.value;t===`expand`?this.expanded=!0:(t===`source`||t===`diagram`)&&(this.showSource=t===`source`)}}
        >
          <button
            slot="trigger"
            type="button"
            aria-label=${o(`chat.mermaid.options`)}
            title=${o(`chat.mermaid.options`)}
          >
            <span aria-hidden="true">${c.moreHorizontal}</span>
          </button>
          <wa-dropdown-item
            value=${t?`diagram`:`source`}
            ?disabled=${t&&!this.imageUrl}
            >${o(t?`chat.mermaid.diagram`:`chat.mermaid.source`)}</wa-dropdown-item
          >
          <wa-dropdown-item value="expand" ?disabled=${!this.imageUrl}
            >${o(`chat.mermaid.expand`)}</wa-dropdown-item
          >
        </wa-dropdown>
      </div>
      <span class="copy-feedback" aria-live="polite"
        >${this.copyResult===void 0?l:n}</span
      >
      ${this.renderStatus&&(e||!this.imageUrl)?u`<p class="status" role="status">${o(`chat.mermaid.${this.renderStatus}`)}</p>`:l}
      ${t?u`<pre><code>${this.source}</code></pre>`:this.imageUrl?u`<div class="preview">
                <img
                  src=${this.imageUrl}
                  alt=${o(`chat.mermaid.title`)}
                  @error=${()=>{this.renderStatus=`imageError`,this.releaseImage()}}
                />
              </div>`:l}
      ${this.expanded&&this.imageUrl?u`<zero-image-lightbox
              src=${this.imageUrl}
              .imageTitle=${o(`chat.mermaid.title`)}
              @image-lightbox-close=${()=>{this.expanded=!1}}
            ></zero-image-lightbox>`:l}
    `}},v([p({attribute:!1})],Z.prototype,`source`,void 0),v([h()],Z.prototype,`imageUrl`,void 0),v([h()],Z.prototype,`showSource`,void 0),v([h()],Z.prototype,`expanded`,void 0),v([h()],Z.prototype,`renderStatus`,void 0),v([h()],Z.prototype,`copyResult`,void 0),customElements.get(`zero-mermaid`)||customElements.define(`zero-mermaid`,Z)})))()}Q();export{J as mountMermaidBlocks};
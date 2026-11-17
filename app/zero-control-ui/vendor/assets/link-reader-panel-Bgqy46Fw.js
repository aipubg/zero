import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Lu as t,Mu as n,Nu as r,Pu as i,zu as a}from"./control-ui-core-DCNBgr3X.js";import{Ci as o,Fr as s,Nr as c,Or as l,Si as u,bi as d,ca as f,ii as p,jr as ee,sa as m,ui as te,yi as ne}from"./control-ui-core-DwX5Mpz4.js";import{G as h,J as g,W as _,Z as re,at as v,lt as y,n as ie,rt as b,t as ae}from"./lit-runtime-B40xFCK_.js";import{L as oe,U as se}from"./control-ui-boot-shared-BRtBCr5s.js";import{Zr as x,wa as ce}from"./ui-AaV6iNVa.js";import{B as le,V as ue}from"./control-ui-boot-shared-E4pYPcWx.js";import{n as de,t as fe}from"./control-ui-boot-shared-4Y4EIRNw.js";import{Ct as pe,St as me,en as he,tn as ge}from"./control-ui-boot-shared-ZuP0LiFD.js";import{v as S}from"./control-ui-boot-shared-D2GHitQ4.js";import{M as _e,j as ve}from"./markdown-runtime-ORQpioyT.js";import{i as ye,n as C,r as be,t as xe}from"./panel-icon-button-CTZmNHun.js";import{a as Se,i as Ce,n as we,r as Te,t as w}from"./panel-tab-strip-jMGzTL7I.js";import{a as Ee,i as De,n as Oe,o as T,r as ke,s as E,t as D}from"./link-reader-response-CckeCMTB.js";var O,k,A,j,M;function N(){return(N=e((()=>{O=32,k=4,A=2796268,j=8388608,M=class{constructor(e,t,n){this.client=e,this.method=t,this.isCurrent=n,this.abort=new AbortController,this.cache=new Map,this.queue=[],this.active=0,this.bytes=0,this.load=e=>{let t=this.cache.get(e);if(t)return t;if(this.abort.signal.aborted||!this.isCurrent())return Promise.reject(Error(`Reader image is unavailable`));if(this.cache.size>=O)return Promise.resolve(e);let n=new Promise((t,n)=>{this.queue.push(()=>{this.request(e).then(t,()=>{!this.abort.signal.aborted&&this.isCurrent()?t(e):n(Error(`Reader image is unavailable`))}).finally(()=>{this.active--,this.drain()})})});return this.cache.set(e,n),this.drain(),n}}dispose(){this.abort.abort(),this.cache.clear(),this.drain()}drain(){for(;this.active<k&&this.queue.length;)this.active++,this.queue.shift()()}async request(e){if(this.abort.signal.aborted||!this.isCurrent())throw Error(`Reader image is unavailable`);let t=await this.client.request(this.method,{url:e},{signal:this.abort.signal});if(this.abort.signal.aborted||!this.isCurrent()||t?.url!==e||typeof t.dataUrl!=`string`||t.dataUrl.length>A||this.bytes+t.dataUrl.length>j||!/^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/u.test(t.dataUrl))throw Error(`Reader image is unavailable`);return this.bytes+=t.dataUrl.length,t.dataUrl}}})))()}var P;function F(){return(F=e((()=>{_(),P=y`
  .lr-document {
    max-width: 920px;
    margin-inline: auto;
    min-width: 0;
  }
  .lr-eyebrow {
    color: var(--muted);
    font-size: 12px;
    font-weight: 500;
  }
  .lr-metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 14px 24px;
    margin: 16px 0 0;
    padding: 12px 0 16px;
    border-top: 1px solid var(--border);
  }
  .lr-metric {
    min-width: 0;
  }
  .lr-metric dt {
    color: var(--muted);
    font-size: 11px;
    margin-bottom: 2px;
  }
  .lr-metric dd {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .lr-metric--positive dd {
    color: var(--ok);
  }
  .lr-metric--negative dd {
    color: var(--danger);
  }
  .lr-section-nav {
    position: sticky;
    /* Offset the reader padding so the bar sticks flush with its scrollport. */
    top: -24px;
    z-index: 1;
    display: flex;
    gap: 4px;
    overflow-x: auto;
    padding: 8px 0;
    margin-bottom: 16px;
    background: var(--bg);
    border-block: 1px solid var(--border);
  }
  .lr-section-nav button {
    display: inline-flex;
    flex: none;
    white-space: nowrap;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--muted);
    padding: 6px 9px;
    font: inherit;
    font-size: 12px;
    font-weight: 550;
    cursor: default;
  }
  .lr-section-nav button:hover {
    color: var(--text);
    background: color-mix(in srgb, var(--text) 6%, transparent);
  }
  .lr-count {
    display: inline-block;
    border-radius: 5px;
    padding: 0 5px;
    color: var(--muted);
    background: color-mix(in srgb, var(--text) 7%, transparent);
    font-size: 11px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .lr-document section > h2 {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  [data-reader-section],
  .lr-comment {
    scroll-margin-top: 64px;
  }
  [data-reader-section]:focus {
    outline: none;
  }
  .lr-checks {
    --check-color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    margin: 20px 0 24px;
    background: color-mix(in srgb, var(--check-color) 3%, transparent);
  }
  .lr-checks--success,
  .lr-check--success {
    --check-color: var(--ok);
  }
  .lr-checks--failure,
  .lr-check--failure {
    --check-color: var(--danger);
  }
  .lr-checks--pending,
  .lr-check--pending {
    --check-color: var(--warn);
  }
  .lr-check--neutral {
    --check-color: var(--muted);
  }
  .lr-checks > summary {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) 16px;
    align-items: center;
    column-gap: 12px;
    padding: 16px;
    list-style: none;
    cursor: default;
  }
  .lr-checks > summary::-webkit-details-marker {
    display: none;
  }
  .lr-checks-icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: var(--check-color);
    background: color-mix(in srgb, var(--check-color) 12%, transparent);
  }
  .lr-checks-icon svg {
    width: 17px;
    height: 17px;
  }
  .lr-checks-heading {
    display: grid;
    gap: 2px;
  }
  .lr-checks-heading strong {
    font-size: 13px;
    font-weight: 650;
  }
  .lr-checks-chevron {
    display: flex;
    color: var(--muted);
  }
  .lr-checks-chevron svg,
  .lr-check-symbol svg {
    width: 16px;
    height: 16px;
  }
  .lr-checks[open] .lr-checks-chevron {
    transform: rotate(180deg);
  }
  .lr-checks-meter {
    display: flex;
    gap: 3px;
    grid-column: 2;
    margin-top: 10px;
    height: 4px;
    overflow: hidden;
    border-radius: 2px;
  }
  .lr-check-segment {
    flex: 1;
    background: var(--muted);
  }
  .lr-check-segment--success {
    background: var(--ok);
  }
  .lr-check-segment--failure {
    background: var(--danger);
  }
  .lr-check-segment--pending {
    background: var(--warn);
  }
  .lr-check-list {
    max-height: 360px;
    overflow: auto;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .lr-check {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-top: 1px solid var(--border);
  }
  .lr-check-symbol {
    display: flex;
    color: var(--check-color);
  }
  .lr-check-copy {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-width: 0;
    flex: 1;
    gap: 4px 12px;
  }
  .lr-check-copy > a {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: var(--text);
    text-decoration: none;
  }
  .lr-check-copy > a:hover {
    text-decoration: underline;
  }
  .lr-check-copy > a svg {
    flex: none;
    width: 12px;
    height: 12px;
    color: var(--muted);
  }
  .lr-checks-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-top: 1px solid var(--border);
    padding: 12px 16px;
    font-size: 11px;
    color: var(--muted);
  }
  .lr-checks-footer a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--muted);
  }
  .lr-checks-footer svg {
    width: 12px;
    height: 12px;
  }
  .lr-checks-footer code {
    font-family: var(--mono);
  }
  @media (max-width: 768px) {
    .lr-section-nav {
      top: -16px;
      gap: 0;
    }
    .lr-section-nav button {
      padding-inline: 7px;
    }
  }
  .lr-image {
    display: block;
    margin: 12px 0;
    max-width: 100%;
  }
  .lr-image img {
    display: block;
    max-width: 100%;
    max-height: 480px;
    height: auto;
    object-fit: contain;
    border-radius: 6px;
  }
  .lr-image img[hidden] {
    display: none;
  }
  .lr-image-caption {
    display: block;
    margin-top: 5px;
    color: var(--muted);
    font-size: 11px;
    overflow-wrap: anywhere;
  }
  .lr-image > a {
    display: inline-block;
    max-width: 100%;
  }
  .lr-comment-kind {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0 7px;
    font-size: 11px;
  }
  .lr-review-location {
    margin: 8px 0;
    color: var(--muted);
    font-size: 11px;
  }
  .lr-review-location a {
    font-family: var(--mono);
  }
  .lr-review-diff {
    margin-top: 8px;
  }
`})))()}function Ae(e,t){return e[t].content}function je(e,t,n,r,i){let a=e.utils.arrayReplaceAt,o=e.utils.lib.ucmicro,s=new RegExp([o.Z.source,o.P.source,o.Cc.source].join(`|`));function c(e,r,a){let o=0,c=[];if(e.replace(i,function(r,i,l){let u;if(Object.prototype.hasOwnProperty.call(n,r)){if(u=n[r],i>0&&!s.test(l[i-1])||i+r.length<l.length&&!s.test(l[i+r.length]))return}else u=r.slice(1,-1);if(i>o){let t=new a(`text`,``,0);t.content=e.slice(o,i),c.push(t)}let d=new a(`emoji`,``,0);d.markup=u,d.content=t[u],c.push(d),o=i+r.length}),o<e.length){let t=new a(`text`,``,0);t.content=e.slice(o),c.push(t)}return c}return function(e){let t,n=e.tokens,i=0;for(let o=0,s=n.length;o<s;o++){if(n[o].type!==`inline`)continue;let s=n[o].children;for(let l=s.length-1;l>=0;l--)t=s[l],(t.type===`link_open`||t.type===`link_close`)&&t.info===`auto`&&(i-=t.nesting),t.type===`text`&&i===0&&r.test(t.content)&&(n[o].children=s=a(s,l,c(t.content,t.level,e.Token)))}}}function Me(e){return e.replace(/[.?*+^$[\]\\(){}|-]/g,`\\$&`)}function Ne(e){let t=e.defs;e.enabled.length&&(t=Object.keys(t).reduce((n,r)=>(e.enabled.indexOf(r)>=0&&(n[r]=t[r]),n),{}));let n=Object.keys(e.shortcuts).reduce((n,r)=>t[r]?Array.isArray(e.shortcuts[r])?(e.shortcuts[r].forEach(e=>{n[e]=r}),n):(n[e.shortcuts[r]]=r,n):n,{}),r=Object.keys(t),i;i=r.length===0?`^$`:r.map(e=>`:${e}:`).concat(Object.keys(n)).sort().reverse().map(e=>Me(e)).join(`|`);let a=RegExp(i),o=RegExp(i,`g`);return{defs:t,shortcuts:n,scanRE:a,replaceRE:o}}function I(){return(I=e((()=>{})))()}function Pe(e,t){let n=Ne(Object.assign({},{defs:{},shortcuts:{},enabled:[]},t||{}));e.renderer.rules.emoji=Ae,e.core.ruler.after(`linkify`,`emoji`,je(e,n.defs,n.shortcuts,n.scanRE,n.replaceRE))}function L(){return(L=e((()=>{I()})))()}var Fe;function R(){return(R=e((()=>{Fe={angry:[`>:(`,`>:-(`],blush:[`:")`,`:-")`],broken_heart:[`</3`,`<\\3`],confused:[`:/`,`:-/`],cry:[`:'(`,`:'-(`,`:,(`,`:,-(`],frowning:[`:(`,`:-(`],heart:[`<3`],imp:[`]:(`,`]:-(`],innocent:[`o:)`,`O:)`,`o:-)`,`O:-)`,`0:)`,`0:-)`],joy:[`:')`,`:'-)`,`:,)`,`:,-)`,`:'D`,`:'-D`,`:,D`,`:,-D`],kissing:[`:*`,`:-*`],laughing:[`x-)`,`X-)`],neutral_face:[`:|`,`:-|`],open_mouth:[`:o`,`:-o`,`:O`,`:-O`],rage:[`:@`,`:-@`],smile:[`:D`,`:-D`],smiley:[`:)`,`:-)`],smiling_imp:[`]:)`,`]:-)`],sob:[`:,'(`,`:,'-(`,`;(`,`;-(`],stuck_out_tongue:[`:P`,`:-P`],sunglasses:[`8-)`,`B-)`],sweat:[`,:(`,`,:-(`],sweat_smile:[`,:)`,`,:-)`],unamused:[`:s`,`:-S`,`:z`,`:-Z`,`:$`,`:-$`],wink:[`;)`,`;-)`]}})))()}function Ie(e,t){Pe(e,Object.assign({},{defs:fe,shortcuts:Fe,enabled:[]},t||{}))}function z(){return(z=e((()=>{de(),R(),L()})))()}function B(e,t){if(!e.trim())return null;let n=URL.parse(e,t);return n&&[`https:`,`http:`,`mailto:`].includes(n.protocol)&&!n.username&&!n.password?n:null}function V(e,t){let n=document.createElement(`a`);return n.href=e,n.textContent=t,n.target=`_blank`,n.rel=`noopener noreferrer`,n.referrerPolicy=`no-referrer`,n.dataset.linkReaderExternal=``,n}function Le(e,t,n){let r=B(e.getAttribute(`src`)??``,t),i=e.alt.trim()||a(`linkReader.image`),o=document.createElement(`span`);o.className=`lr-image`;let s=document.createElement(`span`);s.className=`lr-image-caption`;let c=document.createElement(`span`);c.textContent=i,s.append(c);let l=e.closest(`a`),u=r?.hostname.replace(/\.+$/u,``)??``,d=!u.includes(`.`)||/(?:^|\.)(?:localhost|local|internal|localdomain)$/u.test(u),f=r?.protocol===`https:`&&r.origin!==window.location.origin&&!d&&!se(u);if(r&&[`https:`,`http:`].includes(r.protocol)&&s.append(` · `,V(r.href,a(`linkReader.openImage`))),f&&r){let e=document.createElement(`img`);e.alt=i,e.crossOrigin=`anonymous`,e.referrerPolicy=`no-referrer`,e.loading=`lazy`,e.decoding=`async`;let t=()=>{e.hidden=!0,c.textContent=a(`linkReader.imageUnavailable`,{title:i}),c.setAttribute(`role`,`status`)};if(e.addEventListener(`error`,t,{once:!0}),l)o.append(e);else{let t=V(r.href,``);t.setAttribute(`aria-label`,a(`linkReader.openImageTitle`,{title:i})),t.append(e),o.append(t)}n?n(r.href).then(t=>{e.isConnected&&(e.src=t)},t):e.src=r.href}else c.textContent=a(`linkReader.imageUnavailable`,{title:i});e.replaceWith(o),l?l.after(s):o.append(s)}function H(e,n,r){return ue([e,n,r,t.getLocale()],()=>{let t;try{t=J.render(e,q)}catch{t=`<pre>`+S(e)+`</pre>`}let i=We.sanitize(t,{RETURN_DOM_FRAGMENT:!0,ALLOWED_TAGS:Ge,ALLOWED_ATTR:[`href`,`src`,`alt`,`title`,`class`,`open`,`start`,`type`,`checked`,`disabled`],ALLOW_DATA_ATTR:!1,ALLOW_ARIA_ATTR:!1});for(let e of i.querySelectorAll(`a`)){let t=B(e.getAttribute(`href`)??``,n);t?(e.href=t.href,e.target=`_blank`,e.rel=`noopener noreferrer`,e.referrerPolicy=`no-referrer`):e.removeAttribute(`href`)}for(let e of i.querySelectorAll(`input`))e.type=`checkbox`,e.disabled=!0;for(let e of i.querySelectorAll(`img`))Le(e,n,r);return i})}function U(e){if(!e)return h;let t=new Date(e);return g`<time datetime=${e} title=${e}
    >${Number.isNaN(t.getTime())?e:t.toLocaleString()}</time
  >`}function W(e,t){return g`<pre
    class="lr-diff"
    tabindex="0"
    aria-label=${a(`linkReader.diffLabel`,{filename:t})}
  ><code>${e.split(`
`).map(e=>{let t=e.startsWith(`+`)?`add`:e.startsWith(`-`)?`delete`:e.startsWith(`@@`)?`hunk`:`context`;return g`<span class=${`lr-diff-line lr-diff-line--`+t}>${e}</span>`})}</code></pre>`}function G(e,t){return e?g`<p class="lr-note">${a(t)}</p>`:h}function Re(e,t){return g`<details class="lr-file" ?open=${t}>
    <summary>
      <span class="lr-filename">${e.path}</span
      ><span class="lr-stats"
        ><span class="lr-add">+${e.additions}</span>
        <span class="lr-delete">−${e.deletions}</span></span
      >
    </summary>
    ${e.previousPath?g`<p class="lr-meta">
            ${a(`linkReader.renamedFrom`,{filename:e.previousPath})}
          </p>`:h}
    ${e.patch?W(e.patch,e.path):g`<p class="lr-note">${a(`linkReader.patchUnavailable`)}</p>`}
    ${G(e.patchTruncated,`linkReader.patchTruncated`)}
  </details>`}function ze(e,t,n){let r=e.context,i=[r?.path,r?.lineLabel].filter(Boolean).join(`:`),o=B(e.url,t)?.href,s=r?.replyUrl?B(r.replyUrl,t)?.href:void 0;return g`<article class="lr-comment" id=${e.id}>
    <header class="lr-meta">
      <strong>${e.author}</strong>
      <a
        href=${o??h}
        target="_blank"
        rel="noopener noreferrer"
        referrerpolicy="no-referrer"
        title=${a(`linkReader.commentPermalink`)}
        >${e.createdAt?U(e.createdAt):a(`linkReader.commentPermalink`)}</a
      >
      ${e.label?g`<span class="lr-comment-kind">${e.label}</span>`:h}
    </header>
    ${i||r?.label?g`<p class="lr-review-location">
            <a
              href=${o??h}
              target="_blank"
              rel="noopener noreferrer"
              referrerpolicy="no-referrer"
              >${i}</a
            >
            ${r?.label}
          </p>`:h}
    ${s?g`<a
            class="lr-meta"
            href=${s}
            target="_blank"
            rel="noopener noreferrer"
            referrerpolicy="no-referrer"
            >${r?.replyLabel??a(`linkReader.replyContext`)}</a
          >`:h}
    ${r?.diff?g`<details class="lr-file lr-review-diff">
            <summary>${a(`linkReader.reviewContext`)}</summary>
            ${W(r.diff,r.path??``)}${G(r.diffTruncated,`linkReader.patchTruncated`)}
          </details>`:h}
    <div class="lr-markdown">${H(e.body,t,n)}</div>
    ${G(e.bodyTruncated,`linkReader.bodyTruncated`)}
  </article>`}function Be(e){switch(e){case`success`:return m.check;case`failure`:return m.circleX;case`pending`:return m.clock;case`unavailable`:return m.circleQuestionMark;default:return m.circle}}function Ve(e){return a({success:`linkReader.checkSuccess`,failure:`linkReader.checkFailure`,pending:`linkReader.checkPending`,neutral:`linkReader.checkNeutral`}[e])}function He(e,t){let n={success:`linkReader.checksSuccess`,failure:`linkReader.checksFailure`,pending:`linkReader.checksPending`,neutral:`linkReader.checksNeutral`,unavailable:`linkReader.checksUnavailable`},r=e.url?B(e.url,t)?.href:void 0;return g`<details
    class=${`lr-checks lr-checks--`+e.state}
    data-reader-section="checks"
    tabindex="-1"
    ?open=${e.state===`failure`}
  >
    <summary>
      <span class="lr-checks-icon" aria-hidden="true">${Be(e.state)}</span>
      <span class="lr-checks-heading"
        ><strong>${a(n[e.state])}</strong
        ><span class="lr-meta">${e.summary}</span></span
      >
      <span class="lr-checks-chevron" aria-hidden="true">${m.chevronDown}</span>
      ${!e.truncated&&e.state!==`unavailable`&&e.items.length===e.total&&e.total>0?g`<span class="lr-checks-meter" aria-hidden="true"
              >${e.items.map(e=>g`<span class=${`lr-check-segment lr-check-segment--`+e.state}></span>`)}</span
            >`:h}
    </summary>
    <ul class="lr-check-list">
      ${e.items.map(e=>{let n=e.url?B(e.url,t)?.href:void 0;return g`<li class=${`lr-check lr-check--`+e.state}>
          <span class="lr-check-symbol" role="img" aria-label=${Ve(e.state)}
            >${Be(e.state)}</span
          >
          <span class="lr-check-copy"
            >${n?g`<a
                    href=${n}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerpolicy="no-referrer"
                    data-link-reader-external
                    >${e.name}${m.externalLink}</a
                  >`:g`<span>${e.name}</span>`}
            <span class="lr-meta">${e.detail??Ve(e.state)}</span>
          </span>
        </li>`})}
    </ul>
    ${G(e.truncated,`linkReader.checksTruncated`)}
    <footer class="lr-checks-footer">
      ${e.commit?g`<code title=${a(`linkReader.checksCommit`,{commit:e.commit})}>${e.commit.slice(0,7)}</code>`:h}
      ${r?g`<a href=${r} target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" data-link-reader-external>${a(`linkReader.checksSource`)}${m.externalLink}</a>`:h}
    </footer>
  </details>`}function K(e,t,n){return g`<button
    type="button"
    @click=${t=>{let n=t.currentTarget;if(!(n instanceof HTMLButtonElement))return;let r=n.closest(`.lr-document`)?.querySelector(`[data-reader-section="${e}"]`);r instanceof HTMLDetailsElement&&(r.open=!0),r?.focus({preventScroll:!0}),r?.scrollIntoView({block:`start`})}}
  >
    ${t}${n===void 0?h:g`<span class="lr-count">${n}</span>`}
  </button>`}function Ue(e,t,n){let r=Oe(e.authorUrl,e.url),i=e.coAuthors??[],o=Math.max(i.length,e.coAuthorCount??0)-i.length,s=i.map(e=>e.name).join(`, `)+(o?` +`+o:``);return g`<article class="lr-document">
    <header class="lr-document-header">
      <div class="lr-eyebrow">${e.subtitle??t.reader.label}</div>
      <h1>${e.title}</h1>
      <div class="lr-meta lr-item-meta">
        ${e.badge?g`<span class=${`lr-state lr-state--`+e.badge.tone}
                >${e.badge.label}</span
              >`:h}
        ${e.author?r?g`<a
                  href=${r}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-link-reader-external
                  >${a(`linkReader.byAuthor`,{author:e.author})}</a
                >`:g`<span>${a(`linkReader.byAuthor`,{author:e.author})}</span>`:h}
        ${s.trim()?g`<span class="lr-coauthors">${a(`linkReader.coAuthors`,{authors:s.trim()})}</span>`:h}
        ${U(e.badge?.timestamp??e.createdAt)}
      </div>
      ${e.metadata?.length?g`<dl class="lr-metadata">
              ${e.metadata.map(({label:e,value:t,tone:n})=>g`<div class=${`lr-metric lr-metric--`+(n??`neutral`)}>
                    <dt>${e}</dt>
                    <dd>${t}</dd>
                  </div>`)}
            </dl>`:h}
    </header>
    <nav class="lr-section-nav" aria-label=${a(`linkReader.navigation`)}>
      ${K(`overview`,a(`linkReader.overview`))}
      ${e.checks?K(`checks`,a(`linkReader.checks`),e.checks.total):h}
      ${e.files?K(`files`,a(`linkReader.filesShort`),e.filesTotal??e.files.length):h}
      ${e.comments?K(`comments`,a(`linkReader.discussion`),e.commentsTotal??e.comments.length):h}
    </nav>
    ${e.checks?He(e.checks,e.url):h}
    ${e.partial?g`<p class="lr-note" role="status">${a(`linkReader.partial`)}</p>`:h}
    <section
      aria-label=${a(`linkReader.description`)}
      class="lr-description"
      data-reader-section="overview"
      tabindex="-1"
    >
      <div class="lr-markdown">
        ${e.body?H(e.body,e.url,n):g`<p class="lr-meta">${a(`linkReader.noDescription`)}</p>`}
      </div>
      ${G(e.bodyTruncated,`linkReader.bodyTruncated`)}
    </section>
    ${e.files?g`<section
            aria-label=${a(`linkReader.files`)}
            class="lr-files"
            id="files"
            data-reader-section="files"
            tabindex="-1"
          >
            <h2>
              ${a(`linkReader.files`)}
              <span class="lr-count"
                >${e.files.length}${e.filesTotal!==void 0&&e.filesTotal!==e.files.length?` / `+e.filesTotal:``}</span
              >
            </h2>
            ${e.files.map(t=>Re(t,e.filesExpanded===!0))}
            ${G(e.filesTruncated,`linkReader.filesTruncated`)}
            ${e.files.length===0&&!e.filesTruncated?g`<p class="lr-meta">${a(`linkReader.noFiles`)}</p>`:h}
          </section>`:h}
    ${e.comments?g`<section
            aria-label=${a(`linkReader.comments`)}
            class="lr-comments"
            data-reader-section="comments"
            tabindex="-1"
          >
            <h2>
              ${a(`linkReader.comments`)}
              <span class="lr-count"
                >${e.comments.length}${e.commentsTotal!==void 0&&e.commentsTotal!==e.comments.length?` / `+e.commentsTotal:``}</span
              >
            </h2>
            ${e.comments.map(t=>ze(t,e.url,n))}
            ${G(e.commentsTruncated,`linkReader.commentsTruncated`)}
            ${e.comments.length===0&&!e.commentsTruncated?g`<p class="lr-meta">${a(`linkReader.noComments`)}</p>`:h}
          </section>`:h}
  </article>`}var q,J,We,Ge;function Ke(){return(Ke=e((()=>{oe(),ve(),_(),le(),z(),i(),T(),f(),D(),pe(),he(),E(),q=ge({mode:`document`,codeBlockChrome:`none`,fileLinks:!1,interactiveImages:!1,assistantTranscriptRoleHeaders:!1}),J=me(),J.use(Ie,{shortcuts:{}});for(let e of[`html_inline`,`html_block`]){let t=J.renderer.rules[e];J.renderer.rules[e]=(e,n,r,i,a)=>{let o=e[n]?.content??``;return o.trimStart().startsWith(`<!--`)?S(o.replace(/<!--[\s\S]*?(?:-->|$)/gu,``)):/^<img\s[^<>]*>\s*$/iu.test(o)?o:t(e,n,r,i,a)}}We=_e(window),Ge=`a.b.blockquote.br.code.del.details.div.em.h1.h2.h3.h4.h5.h6.hr.i.img.input.li.ol.p.pre.s.span.strong.summary.table.tbody.td.th.thead.tr.ul`.split(`.`)})))()}var qe;function Je(){return(Je=e((()=>{_(),qe=y`
  .bp--right {
    top: var(--shell-topbar-height, 0);
    right: calc(
      var(--oc-terminal-reserve-right, 0px) + var(--oc-browser-reserve-right, 0px) +
        var(--oc-desktop-reserve-right, 0px)
    );
    bottom: calc(
      var(--oc-terminal-reserve-bottom, 0px) + var(--oc-browser-reserve-bottom, 0px) +
        var(--oc-desktop-reserve-bottom, 0px)
    );
    max-width: 100vw;
  }
  .bp-header {
    flex: none;
  }
  .bp--embedded {
    position: relative;
    inset: auto;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    flex: 1;
  }
  .bp-icon {
    cursor: default;
    flex: none;
    text-decoration: none;
  }
  .bp-icon svg,
  .lr-external svg {
    width: 15px;
    height: 15px;
  }
  .bp-icon:disabled,
  .lr-retry:disabled {
    opacity: 0.4;
    cursor: default;
  }
  :is(button, a, summary, pre):focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .lr-tab-header .tabstrip {
    flex: 1;
  }
  .tabstrip-tab__label {
    max-width: 150px;
  }
  .lr-toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-bottom: 1px solid var(--border);
  }
  .lr-url {
    flex: 1;
    min-width: 0;
    height: 30px;
    box-sizing: border-box;
    border: 1px solid transparent;
    border-radius: 14px;
    padding: 3px 10px;
    color: var(--text);
    background: color-mix(in srgb, var(--text) 8%, transparent);
    font: inherit;
    font-size: 12px;
  }
  .lr-url:focus {
    border-color: var(--accent);
    outline: none;
  }
  .lr-external {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 5px;
    padding: 4px;
    color: var(--text);
    font-size: 12px;
    text-decoration: none;
    white-space: nowrap;
  }
  .lr-external:hover {
    text-decoration: underline;
  }
  .lr-panels {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .lr-content[hidden] {
    display: none;
  }
  .lr-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 24px;
    font-size: 13px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
  .lr-content:focus {
    outline: none;
  }
  h1 {
    margin: 10px 0 16px;
    font-size: 25px;
    line-height: 1.25;
    font-weight: 650;
    letter-spacing: -0.025em;
  }
  h2 {
    margin: 24px 0 12px;
    font-size: 14px;
    font-weight: 650;
  }
  a {
    color: var(--accent);
  }
  .lr-meta {
    color: var(--muted);
    font-size: 12px;
  }
  .lr-item-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lr-state {
    padding: 2px 9px;
    border-radius: 12px;
    background: color-mix(in srgb, currentColor 12%, transparent);
    font-weight: 600;
  }
  .lr-state--positive {
    color: var(--ok);
  }
  .lr-state--accent {
    color: var(--pr-merged);
  }
  .lr-state--negative {
    color: var(--danger);
  }
  .lr-state--attention {
    color: var(--warn);
  }
  .lr-description {
    margin-top: 24px;
  }
  .lr-note {
    padding: 9px 12px;
    border-left: 2px solid var(--warn);
    background: color-mix(in srgb, var(--warn) 8%, transparent);
    font-size: 12px;
  }
  .lr-comment {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 12px;
  }
  .lr-comment header {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lr-comment strong {
    color: var(--text);
  }
  .lr-file {
    border: 1px solid var(--border);
    border-radius: 9px;
    margin-bottom: 8px;
    overflow: hidden;
  }
  .lr-file summary {
    cursor: default;
    padding: 12px;
    background: color-mix(in srgb, var(--text) 4%, transparent);
  }
  .lr-filename {
    font-family: var(--mono);
    font-size: 12px;
  }
  .lr-stats {
    white-space: nowrap;
    margin-left: 10px;
    font-size: 11px;
  }
  .lr-add {
    color: var(--ok);
  }
  .lr-delete {
    color: var(--danger);
  }
  .lr-file > p {
    margin: 10px;
  }
  .lr-diff {
    margin: 0;
    overflow: auto;
    font-family: var(--mono);
    font-size: 11px;
    line-height: 1.7;
    tab-size: 2;
  }
  .lr-diff code {
    display: block;
    min-width: max-content;
  }
  .lr-diff-line {
    display: block;
    min-height: 1.7em;
    padding: 0 10px;
    white-space: pre;
  }
  .lr-diff-line--add {
    background: color-mix(in srgb, var(--ok) 14%, transparent);
  }
  .lr-diff-line--delete {
    background: color-mix(in srgb, var(--danger) 14%, transparent);
  }
  .lr-diff-line--hunk {
    color: var(--muted);
    background: color-mix(in srgb, var(--accent) 9%, transparent);
  }
  .lr-status {
    padding: 24px 0;
    color: var(--muted);
  }
  .lr-status h2 {
    color: var(--text);
  }
  .lr-status a {
    margin-left: 12px;
  }
  .lr-retry {
    font: inherit;
    color: var(--text);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 12px;
    cursor: default;
  }
  .lr-markdown :first-child {
    margin-top: 10px;
  }
  .lr-markdown p {
    margin: 10px 0;
  }
  .lr-markdown pre {
    white-space: pre;
    overflow: auto;
    padding: 10px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--text) 5%, transparent);
  }
  .lr-markdown code {
    font-family: var(--mono);
    font-size: 0.9em;
  }
  .lr-markdown :not(pre) > code {
    padding: 2px 4px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--text) 7%, transparent);
  }
  .lr-markdown blockquote {
    margin: 10px 0;
    padding-left: 12px;
    border-left: 3px solid var(--border);
    color: var(--muted);
  }
  .lr-markdown table {
    display: block;
    overflow: auto;
    border-collapse: collapse;
  }
  .lr-markdown :is(td, th) {
    border: 1px solid var(--border);
    padding: 5px 9px;
  }
  .lr-markdown img {
    max-width: 100%;
  }
  @media (max-width: 768px) {
    .bp--right {
      inset: 0;
      width: 100% !important;
      max-width: none;
      border: 0;
    }
    .bp-resizer {
      display: none;
    }
    .bp-header {
      min-height: 44px;
      padding: env(safe-area-inset-top, 0px) 6px 0;
    }
    .bp-icon {
      width: 34px;
      height: 34px;
    }
    .lr-toolbar {
      flex-wrap: wrap;
    }
    .lr-url {
      order: -1;
      flex-basis: 100%;
      font-size: 16px;
      height: 36px;
    }
    .lr-external {
      margin-left: auto;
    }
    .lr-content {
      padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
    }
  }
`})))()}function Ye(e){return Object.entries(m).find(([t])=>t===e)?.[1]??m.link}function Y(e){return e?.history[e.index]??null}function X(e){if(e.view.status===`ready`)return e.view.detail.title;let t=Y(e);return t?t.reader.label+` · `+new URL(t.href).pathname:a(`linkReader.newTab`)}function Xe(e,t,n){let r=Y(e);return r?!t||e.view.status===`error`?g`<div class="lr-status" role="alert">
      <h2>${a(`linkReader.unavailableTitle`)}</h2>
      <p>
        ${t?e.view.status===`error`?e.view.message:a(`linkReader.unavailable`):a(`linkReader.disconnected`)}
      </p>
      <button class="lr-retry" type="button" ?disabled=${!t} @click=${n}>
        ${a(`linkReader.retry`)}</button
      ><a href=${r.href} target="_blank" rel="noopener noreferrer" data-link-reader-external
        >${a(`linkReader.openExternal`,{provider:r.reader.label})}</a
      >
    </div>`:e.view.status===`ready`?Ue(e.view.detail,r,e.view.images?.load):g`<p class="lr-status" role="status">${a(`linkReader.loadingPreview`)}</p>`:g`<p class="lr-status">${a(`linkReader.urlPlaceholder`)}</p>`}var Ze,Qe;function $e(){return($e=e((()=>{_(),i(),d(),ye(),f(),F(),Ke(),Je(),w(),Ze=ne({storageKey:`zero.link-reader.panel.v1`,minHeight:240,minWidth:300,defaultDock:`right`,supportedDocks:[`right`],defaultHeight:420,defaultWidth:560}),Qe=[we,be,qe,P]})))()}var Z,Q;function $(){return($=e((()=>{_(),re(),ae(),i(),T(),r(),o(),f(),De(),N(),$e(),D(),ee(),Se(),xe(),w(),te(),E(),Z=10,Q=class extends n{constructor(...e){super(...e),this.client=null,this.available=!1,this.readers=l,this.suppressed=!1,this.embedded=!1,this.presented=!1,this.tabsInHeader=!1,this.sessionKey=``,this.hostedSignature=``,this.urlDraft=``,this.invalidUrl=!1,this.tabLimitUrl=null,this.tabs=[],this.activeId=null,this.nextTabId=0,this.requestAbort=null,this.returnFocus=null,this.scrollContent=!1,this.focusAddress=!1,this.refreshRequested=!1,this.dockLayout=new u(this,{layout:Ze,reservationPrefix:`link-reader`,isAvailable:()=>this.tabs.length>0&&!this.suppressed&&!this.embedded,isFullscreen:()=>this.embedded}),this.handleToggleRequest=e=>{let t=e instanceof CustomEvent?e.detail:void 0,n=ce(t)?t:null;if(n?.open===!1){this.closePanel();return}let r=typeof n?.url==`string`?s(n.url,this.readers):null;if(this.isConnected&&this.available&&this.client&&!this.suppressed&&(!this.embedded||this.presented)&&this.readers.length&&(n?.url===void 0||r)){if(e.preventDefault(),!this.panelPresented||this.embedded&&!this.returnFocus){let e=document.activeElement;this.returnFocus=n?.trigger instanceof HTMLElement?n.trigger:e instanceof HTMLElement&&e!==this?e:null}if(!r&&n?.newTab){this.createTab();return}if(r){let e=n?.newTab===!1?void 0:this.tabs.find(e=>{let t=Y(e);return t&&c(t)===c(r)});e?(this.selectHostedTab(e.id),this.navigate(r)):n?.newTab===!1||this.activeTab&&!this.target?this.navigate(r):this.createTab(r)}else this.activeTab||this.createTab();this.embedded?this.requestUpdate():this.dockLayout.setOpen(!0)}}}get hostedTabs(){return this.tabs.map(e=>({id:e.id,label:X(e),url:Y(e)?.href,title:Y(e)?.href,icon:Ye(Y(e)?.reader.icon),className:e.view.status===`loading`?`is-connecting`:``}))}get activeHostedTabId(){return this.activeId}get hostedActions(){return C({className:`rail-header__action bp-icon`,label:a(`linkReader.newTab`),icon:m.plus,onClick:()=>this.createTab(),disabled:this.tabs.length>=Z||!this.available||!this.readers.length})}async closeHostedTab(e){this.closeTab(e),await this.updateComplete}static{this.styles=Qe}get activeTab(){return this.tabs.find(e=>e.id===this.activeId)}get target(){return Y(this.activeTab)}get panelPresented(){return!this.suppressed&&(this.embedded?this.presented:this.dockLayout.open)}connectedCallback(){super.connectedCallback(),this.embedded||(window.addEventListener(p,this.handleToggleRequest),this.dockLayout.setSuppressed(this.suppressed))}disconnectedCallback(){this.resetTabViews(),this.tabs=[],this.activeId=null,this.returnFocus=null,window.removeEventListener(p,this.handleToggleRequest),super.disconnectedCallback()}willUpdate(e){e.has(`embedded`)&&(window.removeEventListener(p,this.handleToggleRequest),!this.embedded&&this.isConnected&&window.addEventListener(p,this.handleToggleRequest)),e.has(`sessionKey`)&&e.get(`sessionKey`)!==void 0&&(this.resetTabViews(),this.tabs=[],this.activeId=null,this.urlDraft=``,this.invalidUrl=!1,this.tabLimitUrl=null,this.returnFocus=null,this.focusAddress=!1,this.scrollContent=!1),this.embedded&&!this.presented&&this.abortRequest();let t=e.get(`readers`),n=e.has(`readers`)&&(!t||t.length!==this.readers.length||t.some((e,t)=>e!==this.readers[t]));(e.has(`client`)||e.has(`available`)||e.has(`agentId`)||n)&&this.resetTabViews(),n&&this.available&&(this.tabs=this.tabs.flatMap(e=>{let t=Y(e);return t?s(t.href,this.readers)?(e.history=e.history.flatMap(e=>{let t=s(e.href,this.readers);return t?[t]:[]}),e.index=e.history.findIndex(e=>e.href===t.href),[e]):[]:this.readers.length>0?[e]:[]}),this.tabs.some(e=>e.id===this.activeId)||(this.activeId=this.tabs[0]?.id??null),this.urlDraft=this.target?.href??``,this.tabs.length===0&&t?.length&&this.closePanel()),e.has(`suppressed`)&&this.abortRequest(),this.embedded||(this.dockLayout.setSuppressed(this.suppressed),this.dockLayout.restoreOpenState(),this.dockLayout.syncReservation()),this.embedded&&this.panelPresented&&this.tabs.length===0&&this.available&&this.readers.length>0&&[`embedded`,`presented`,`sessionKey`,`available`].some(t=>e.has(t))&&(this.createTab(),this.focusAddress=!1),this.isConnected&&this.panelPresented&&this.activeTab?.view.status===`idle`&&this.loadDetail()}updated(){let e=JSON.stringify([this.activeId,this.available,this.readers.length,this.tabs.map(e=>[e.id,X(e),Y(e)?.href,Y(e)?.reader.icon,e.view.status])]);if(e!==this.hostedSignature&&(this.hostedSignature=e,this.dispatchEvent(new Event(Ce,{bubbles:!0,composed:!0}))),!this.panelPresented)return;this.focusAddress&&(this.focusAddress=!1,this.renderRoot.querySelector(`.lr-url`)?.focus());let t=this.renderRoot.querySelector(`.lr-content:not([hidden])`);if(this.scrollContent&&t&&this.activeTab?.view.status===`ready`){this.scrollContent=!1,t.scrollTop=0;let e=this.target?new URL(this.target.href).hash.slice(1):``;[...t.querySelectorAll(`[id]`)].find(t=>t.id===e)?.scrollIntoView?.({block:`start`})}}abortRequest(){this.requestAbort?.abort(),this.requestAbort=null,this.activeTab?.view.status===`loading`&&(this.activeTab.view={status:`idle`}),this.refreshRequested=!1}setTabView(e,t){e.view.status===`ready`&&e.view.images?.dispose(),e.view=t}resetTabViews(){this.abortRequest();for(let e of this.tabs)this.setTabView(e,{status:`idle`})}selectHostedTab(e){e!==this.activeId&&this.tabs.some(t=>t.id===e)&&(this.abortRequest(),this.activeId=e,this.urlDraft=this.target?.href??``,this.invalidUrl=!1,this.tabLimitUrl=null,this.scrollContent=!1,this.requestUpdate())}createTab(e){if(this.tabs.length>=Z){this.tabLimitUrl=e?.href??null;return}this.abortRequest();let t={id:`link-reader-tab-`+ ++this.nextTabId,history:e?[e]:[],index:e?0:-1,view:{status:`idle`}};this.tabs.push(t),this.activeId=t.id,this.urlDraft=e?.href??``,this.invalidUrl=!1,this.tabLimitUrl=null,this.focusAddress=!e,this.scrollContent=!!e,this.embedded?this.requestUpdate():this.dockLayout.setOpen(!0)}closeTab(e){let t=this.tabs.findIndex(t=>t.id===e);if(t<0)return;let n=e===this.activeId;if(n&&this.abortRequest(),this.setTabView(this.tabs[t],{status:`idle`}),this.tabs.splice(t,1),this.tabLimitUrl=null,this.tabs.length===0){this.activeId=null,this.closePanel();return}if(n){this.activeId=null;let e=this.tabs[Math.min(t,this.tabs.length-1)];e&&this.selectHostedTab(e.id)}this.requestUpdate()}navigate(e){let t=this.activeTab;if(!t){this.createTab(e);return}let n=Y(t);n?.href!==e.href&&(this.abortRequest(),t.history=[...t.history.slice(0,t.index+1),e].slice(-30),t.index=t.history.length-1,(!n||c(n)!==c(e))&&this.setTabView(t,{status:`idle`})),this.urlDraft=e.href,this.invalidUrl=!1,this.focusAddress=!1,this.scrollContent=!0,this.requestUpdate()}closePanel(){this.abortRequest(),this.embedded?(this.onClose?.(),this.requestUpdate()):this.dockLayout.setOpen(!1),this.scrollContent=!1,this.focusAddress=!1,this.returnFocus?.isConnected&&this.returnFocus.focus({preventScroll:!0}),this.returnFocus=null}refresh(){this.abortRequest(),this.activeTab&&this.setTabView(this.activeTab,{status:`idle`}),this.refreshRequested=!0,this.requestUpdate()}goHistory(e){let t=this.activeTab;!t||t.index+e<0||t.index+e>=t.history.length||(this.abortRequest(),t.index+=e,this.setTabView(t,{status:`idle`}),this.urlDraft=this.target?.href??``,this.invalidUrl=!1,this.scrollContent=!0,this.requestUpdate())}commitUrl(e){e.preventDefault();let t=this.urlDraft.trim(),n=s(/^[a-z][a-z0-9+.-]*:/iu.test(t)?t:`https://`+t,this.readers);this.invalidUrl=!n,n&&this.navigate(n)}async loadDetail(){let e=this.target,t=this.activeTab,n=this.client,r=this.agentId,i=this.sessionKey,a=n?.connectionGeneration,o=n?.recoveryScope;if(!e||!t||!n||!this.available||!this.panelPresented)return;let s=new AbortController;this.requestAbort=s,t.view={status:`loading`};let c=()=>this.requestAbort===s&&!s.signal.aborted&&this.isConnected&&this.client===n&&this.agentId===r&&this.sessionKey===i&&n.connectionGeneration===a&&n.recoveryScope===o&&this.available&&this.panelPresented&&this.activeTab===t&&this.target?.href===e.href&&this.readers.includes(e.reader),l={url:e.href,...r?{agentId:r}:{},...this.refreshRequested?{refresh:!0}:{}};this.refreshRequested=!1,this.requestUpdate();try{let u=await n.request(e.reader.linkReader.detailMethod,l,{signal:s.signal});if(c()){if(!u||!ke(e,u.url))throw Error(`Link document does not match the requested target`);let s=e.reader.linkReader.imageMethod,c=s?new M(n,s,()=>this.isConnected&&this.available&&this.client===n&&this.agentId===r&&this.sessionKey===i&&n.connectionGeneration===a&&n.recoveryScope===o&&this.tabs.includes(t)&&this.readers.includes(e.reader)&&t.view.status===`ready`&&t.view.detail===u):void 0;this.setTabView(t,{status:`ready`,detail:u,images:c}),this.requestUpdate()}}catch(e){c()&&(t.view={status:`error`,message:Ee(e)},this.requestUpdate())}}render(){let e=this.activeTab,t=this.target;return!e||this.suppressed||!this.embedded&&!this.dockLayout.open?h:g`<section
      class="bp bp--${this.embedded?`embedded`:`right`} link-reader-panel"
      style=${this.embedded?h:`width:${this.dockLayout.width}px`}
      aria-label=${a(`linkReader.title`)}
      @keydown=${e=>{e.key===`Escape`&&!e.defaultPrevented&&(e.preventDefault(),e.stopPropagation(),this.closePanel())}}
    >
      ${this.embedded?h:this.dockLayout.renderResizer(`bp`,a(`linkReader.resize`))}
      ${this.embedded&&this.tabsInHeader?h:g`<header class="rail-header bp-header lr-tab-header">
              ${Te({tabs:this.hostedTabs.map(e=>({...e,domId:e.id+`-label`,closeLabel:a(`linkReader.closeTab`,{title:e.label})})),activeId:this.activeId,ariaControls:`link-reader-tab-panel`,onSelect:e=>this.selectHostedTab(e),onClose:e=>this.closeTab(e),onNew:()=>this.createTab(),newLabel:a(`linkReader.newTab`),newDisabled:this.tabs.length>=Z})}
              ${this.embedded?h:C({className:`rail-header__action bp-icon`,label:a(`linkReader.close`),icon:m.x,onClick:()=>this.closePanel()})}
            </header>`}
      <form class="lr-toolbar" @submit=${e=>this.commitUrl(e)}>
        ${C({className:`rail-header__action bp-icon`,label:a(`linkReader.back`),icon:m.chevronLeft,onClick:()=>this.goHistory(-1),disabled:e.index<=0})}
        ${C({className:`rail-header__action bp-icon`,label:a(`linkReader.forward`),icon:m.chevronRight,onClick:()=>this.goHistory(1),disabled:e.index>=e.history.length-1})}
        ${C({className:`rail-header__action bp-icon`,label:a(`linkReader.refresh`),icon:m.refresh,onClick:()=>this.refresh(),disabled:!t||!this.available||!this.client||e.view.status===`loading`})}
        <input
          class="lr-url"
          type="text"
          spellcheck="false"
          autocomplete="off"
          .value=${this.urlDraft}
          placeholder=${a(`linkReader.urlPlaceholder`)}
          aria-label=${a(`linkReader.urlPlaceholder`)}
          aria-invalid=${this.invalidUrl}
          @input=${e=>{e.currentTarget instanceof HTMLInputElement&&(this.urlDraft=e.currentTarget.value,this.invalidUrl=!1)}}
          @keydown=${e=>{e.key===`Escape`&&(e.preventDefault(),this.urlDraft=t?.href??``,this.invalidUrl=!1)}}
        />
        <button
          class="rail-header__action bp-icon lr-go"
          type="submit"
          title=${a(`linkReader.openUrl`)}
          aria-label=${a(`linkReader.openUrl`)}
        >
          ${m.chevronRight}
        </button>
        ${t?g`<a
                class="lr-external"
                href=${t.href}
                target="_blank"
                rel="noopener noreferrer"
                data-link-reader-external
                >${m.externalLink}<span
                  >${a(`linkReader.openExternal`,{provider:t.reader.label})}</span
                ></a
              >`:h}
      </form>
      ${this.invalidUrl?g`<p class="lr-note" role="alert">${a(`linkReader.invalidUrl`)}</p>`:h}
      ${this.tabLimitUrl?g`<p class="lr-note" role="alert">
              ${a(`linkReader.tabLimit`)}
              <a
                href=${this.tabLimitUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-link-reader-external
                >${a(`linkReader.openOriginal`)}</a
              >
            </p>`:h}
      <div
        id="link-reader-tab-panel"
        class="lr-panels"
        role="tabpanel"
        aria-labelledby=${this.embedded&&this.tabsInHeader?h:e.id+`-label`}
        aria-label=${this.embedded&&this.tabsInHeader?X(e):h}
      >
        ${ie(this.tabs,e=>e.id,e=>g`<div
              class="lr-content"
              tabindex="-1"
              ?hidden=${e.id!==this.activeId}
              aria-busy=${e.view.status===`loading`}
            >
              ${Xe(e,this.available&&!!this.client,()=>this.refresh())}
            </div>`)}
      </div>
    </section>`}},x([v({attribute:!1})],Q.prototype,`client`,void 0),x([v({type:Boolean})],Q.prototype,`available`,void 0),x([v()],Q.prototype,`agentId`,void 0),x([v({attribute:!1})],Q.prototype,`readers`,void 0),x([v({type:Boolean})],Q.prototype,`suppressed`,void 0),x([v({type:Boolean,reflect:!0})],Q.prototype,`embedded`,void 0),x([v({type:Boolean})],Q.prototype,`presented`,void 0),x([v({type:Boolean})],Q.prototype,`tabsInHeader`,void 0),x([v({attribute:!1})],Q.prototype,`sessionKey`,void 0),x([v({attribute:!1})],Q.prototype,`onClose`,void 0),x([b()],Q.prototype,`urlDraft`,void 0),x([b()],Q.prototype,`invalidUrl`,void 0),x([b()],Q.prototype,`tabLimitUrl`,void 0),customElements.get(`zero-link-reader-panel`)||customElements.define(`zero-link-reader-panel`,Q)})))()}$();
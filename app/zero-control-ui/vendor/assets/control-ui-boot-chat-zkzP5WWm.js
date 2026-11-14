const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./markdown-mermaid-1JxH8Zzl.js","./gateway-runtime-JSfC8ThO.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-boot-shared-CZXdmeIi.js","./control-ui-boot-shared-4Y4EIRNw.js","./plugin-contracts-runtime-BO_sRtcl.js","./control-ui-boot-shared-D2GHitQ4.js","./config-runtime-BecGLziM.js","./markdown-runtime-ORQpioyT.js","./sidebar-update-runtime-B2P2sMaT.js","./theme-color-DAo4KRoc.js","./control-ui-core-DI-Q_yCI.css","./control-ui-boot-shared-styles-DUf4zEvn.css","./control-ui-boot-shared-DIWJGbGi.css","./sidebar-update-runtime-Bpn2ByHA.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Au as t,Dl as n,Gl as r,Hs as i,Ic as a,Jc as o,Lc as s,Lu as c,Mu as l,Nu as u,Pl as d,Pu as f,Ul as p,W as m,Wc as h,Xc as ee,ac as te,ju as g,kl as _,nc as ne,o as re,s as ie,xu as v,yu as ae,z as oe,zl as se,zs as ce,zu as y}from"./control-ui-core-DCNBgr3X.js";import{$n as le,Ai as ue,Dr as b,Ei as de,Er as fe,Fr as pe,Jt as me,Mr as he,Nr as ge,T as _e,Ti as ve,Tr as ye,Yt as be,ca as x,dr as xe,er as Se,go as Ce,jr as we,ki as Te,nn as Ee,rn as De,sa as S,ur as Oe,w as ke,wr as Ae}from"./control-ui-core-DwX5Mpz4.js";import{A as je,G as C,J as w,K as Me,M as T,N as Ne,P as E,W as D,Z as O,at as k,c as Pe,l as Fe,lt as Ie,n as Le,rt as A,s as Re,t as ze}from"./lit-runtime-B40xFCK_.js";import{An as Be,jn as Ve}from"./control-ui-boot-shared-BRtBCr5s.js";import{R as He,z as Ue}from"./control-ui-boot-chat-BVLkkfEk.js";import{An as We,Dn as Ge,G as Ke,Hn as qe,On as Je,Un as Ye,W as Xe,kn as Ze,yr as Qe}from"./control-ui-boot-shared-BX8huZUb.js";import{Bi as $e,J as et,Jr as tt,K as nt,Lo as rt,N as it,Ra as at,Ur as ot,Wr as st,Zr as j,fi as ct,ma as lt,pa as ut,pi as M,qr as dt,uo as ft,wa as pt,xa as mt,ya as N,yi as ht}from"./ui-AaV6iNVa.js";import{D as gt,T as _t}from"./control-ui-boot-shared-E4pYPcWx.js";import{Br as vt,Dn as yt,En as bt,Et as xt,Fi as St,Jt as Ct,Kt as wt,Ot as Tt,Pi as Et,Ri as Dt,Rr as Ot,Vr as kt,_a as At,bt as jt,ei as Mt,ga as Nt,gn as Pt,lr as Ft,mn as It,mt as Lt,pt as Rt,ti as zt,vt as Bt,wt as Vt,zi as Ht,zr as Ut}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ao as Wt,Ml as Gt,Nl as Kt,No as qt,Oc as Jt,al as Yt,du as Xt,hu as Zt,il as Qt,kc as $t,lu as en,ol as tn,pu as nn,su as rn,uu as an}from"./control-ui-boot-shared-CzJHozXQ.js";import"./control-ui-boot-shared-styles-BXPMRytW.js";import{C as on,E as sn,M as cn,N as ln,S as un,T as dn,U as fn,h as pn,p as mn,w as hn,x as gn}from"./control-ui-boot-chat-B3rfqCeq.js";import{$ as _n,et as vn,i as yn,r as bn}from"./control-ui-boot-chat-D02HpoEK.js";import"./control-ui-boot-chat-Cx6CBnJr.js";var xn;function Sn(){return(Sn=e((()=>{xn=String.raw`function zeroInspectBrowserElement(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const label = el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("title") || "";
  const text = (el.textContent || "").replace(/\s+/g, " ").trim();
  const nameSource = label || text;
  const nameLimit = 120;
  // This serialized page function cannot call imported helpers; back up only when the cap splits a surrogate pair.
  const nameEnd = (nameSource.codePointAt(nameLimit - 1) || 0) > 0xffff ? nameLimit - 1 : nameLimit;
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || "",
    classes: Array.from(el.classList).slice(0, 6),
    role: el.getAttribute("role") || "",
    name: nameSource.slice(0, nameEnd),
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    focusable: typeof el.tabIndex === "number" && el.tabIndex >= 0,
  };
}`})))()}async function Cn(e,t,n=`open`){let r=N(await e.request(t.sessionScoped?`browser.dashboard.request`:`browser.request`,{...t.sessionScoped?{sessionKey:t.sessionKey,...t.agentId?{agentId:t.agentId}:{},dashboard:{name:t.name,instanceId:t.instanceId}}:{target:`host`},method:n===`stop`?`DELETE`:n===`inspect`?`GET`:`POST`,path:`/dashboard`,...n===`inspect`?{query:t.sessionScoped?{}:t}:{body:{...t.sessionScoped?{}:t,...n===`resume`?{resume:!0}:{}}},timeoutMs:12e4},{timeoutMs:15e4})),i=At(r?.browserTab);if(typeof r?.sessionKey!=`string`||!r.sessionKey||r.name!==t.name||r.instanceId!==t.instanceId||typeof r.revision!=`number`||!Number.isSafeInteger(r.revision)||typeof r.paused!=`boolean`||typeof r.stopping!=`boolean`||r.stopping&&!r.paused||typeof r.url!=`string`||!r.paused&&!i&&n!==`inspect`)throw Error(y(`browser.dashboardInvalidReply`));return{sessionKey:r.sessionKey,name:t.name,instanceId:t.instanceId,revision:r.revision,paused:r.paused,stopping:r.stopping,url:r.url,...i?{browserTab:i}:{}}}function wn(e){let t={...N(e)};for(let e of[`target`,`targetId`,`node`,`profile`])delete t[e];return t}function Tn(e){return e.slice(-64)}function En(e,t,n=()=>!0,r,i){return{async request(a,o,s){if(!n())throw new DOMException(`Browser request scope ended`,`AbortError`);let c=N(o),l=r?.sessionScoped?r:void 0,u=!r&&a===L?i?.():void 0,d=l?`browser.dashboard.request`:a,f=l?{method:c?.method,path:c?.path,...c?.timeoutMs===void 0?{}:{timeoutMs:c.timeoutMs},...c?.query?{query:wn(c.query)}:{},...c?.body?{body:wn(c.body)}:{},sessionKey:l.sessionKey,...l.agentId?{agentId:l.agentId}:{},dashboard:{name:l.name,instanceId:l.instanceId}}:t||r||u?{...c,...t?{target:t.target,...t.target===`node`?{node:t.node}:{},query:{...N(c?.query),profile:t.profile}}:{},...r?{dashboard:r}:{},...u?{tabScope:{sessionKey:u.sessionKey,...c?.method===`GET`&&c.path===`/tabs`?{referencedTabs:Tn(u.referencedTabs)}:{}}}:{}}:o;return s?await e.request(d,f,s):await e.request(d,f)}}}function P(e,t,n){return n?e.request(L,t,n):e.request(L,t)}function F(e,t){return P(e,{method:`POST`,path:`/act`,body:t})}function I(e){return rt(e)??``}function Dn(e){let t=N(e),n=I(t?.targetId);return n?{kind:`remote`,id:I(t?.tabId)||n,targetId:n,title:I(t?.title),url:I(t?.url),...t?.urlUnavailableReason===`navigation_blocked`||t?.urlUnavailableReason===`navigation_check_failed`?{urlUnavailableReason:t.urlUnavailableReason}:{}}:null}async function On(e){let t=N(await P(e,{method:`GET`,path:`/tabs`})),n=Array.isArray(t?.tabs)?t.tabs.flatMap(e=>Dn(e)??[]):[];return{running:t?.running===!0,tabs:n}}async function kn(e){await P(e,{method:`POST`,path:`/start`,body:{}})}async function An(e,t){return Dn(await P(e,{method:`POST`,path:`/tabs/open`,body:{url:t}}))}async function jn(e,t){await P(e,{method:`POST`,path:`/tabs/focus`,body:{targetId:t}})}async function Mn(e,t){await P(e,{method:`DELETE`,path:`/tabs/${encodeURIComponent(t)}`})}async function Nn(e,t,n,r){let i=N(await e.request(L,{method:`POST`,path:`/download`,body:{targetId:t,currentDocument:!0,expectedUrl:n,timeoutMs:12e4},timeoutMs:15e4},{signal:r,timeoutMs:15e4})),a=N(i?.download),o=I(a?.path),s=I(a?.suggestedFilename);if(!o||!s)throw Error(y(`browser.errors.downloadEmpty`));return{path:o,filename:s}}async function Pn(e,t){let n=N(await P(e,{method:`POST`,path:`/navigate`,body:t}));return{targetId:I(n?.targetId)||t.targetId||``,url:I(n?.url)||t.url}}async function Fn(e,t,n){let r=N(await P(e,{method:`POST`,path:`/screencast`,body:t},n)),i=I(r?.token),a=I(r?.wsPath);if(!i||!a)throw Error(`browser screencast response is malformed`);return{token:i,wsPath:a,targetId:I(r?.targetId),url:I(r?.url)}}function In(e){let t=N(e),n=N(t?.details);return n?.code===`SCREENCAST_UNSUPPORTED`||N(n?.body)?.code===`SCREENCAST_UNSUPPORTED`||N(t?.body)?.code===`SCREENCAST_UNSUPPORTED`}async function Ln(e,t){let n=N(await P(e,{method:`POST`,path:`/screenshot`,body:{targetId:t,type:`png`}})),r=I(n?.path);if(!r)throw Error(y(`browser.errors.screenshotPathMissing`));return{path:r,targetId:I(n?.targetId)||t,url:I(n?.url)}}async function Rn(e,t){await F(e,{kind:`clickCoords`,targetId:t.targetId,x:Math.max(0,Math.round(t.x)),y:Math.max(0,Math.round(t.y))})}async function zn(e,t){await F(e,{kind:`press`,targetId:t.targetId,key:t.key})}async function Bn(e,t){try{await F(e,{kind:`insertText`,...t})}catch{throw Error(y(`browser.errors.pasteFailed`))}}async function Vn(e,t){await F(e,{kind:`resize`,targetId:t.targetId,width:Math.round(t.width),height:Math.round(t.height)})}async function Hn(e,t){return N(await F(e,{kind:`evaluate`,targetId:t.targetId,fn:t.fn}))?.result??null}function Un(e){return e instanceof le&&N(e.details)?.reason===`navigation_blocked`}function Wn(e){if(!(e instanceof Error))return!1;let t=e instanceof le?N(e.details):null,n=t?.code;return n===void 0&&t?.unrecognizedCode!==!0?e.message.includes(`evaluateEnabled=false`):n===`ACT_EVALUATE_DISABLED`}async function Gn(e,t){let n=Math.round(t.deltaX),r=Math.round(t.deltaY);await Hn(e,{targetId:t.targetId,fn:`() => { window.scrollBy(${n}, ${r}); return true; }`})}async function Kn(e,t){await Hn(e,{targetId:t.targetId,fn:`() => { history.go(${t.delta}); return true; }`})}async function qn(e,t){let n=N(await Hn(e,{targetId:t,fn:`() => ({ cssWidth: window.innerWidth, cssHeight: window.innerHeight, title: document.title, url: location.href })`})),r=M(n?.cssWidth),i=M(n?.cssHeight);return!r||!i||r<=0||i<=0?null:{cssWidth:r,cssHeight:i,title:I(n?.title),url:I(n?.url)}}async function Jn(e,t){let n=Math.max(0,Math.round(t.x)),r=Math.max(0,Math.round(t.y));return Yn(await Hn(e,{targetId:t.targetId,fn:`() => { ${xn}\nreturn zeroInspectBrowserElement(${n}, ${r}); }`}))}function Yn(e){let t=N(e);if(!t)return null;let n=N(t.rect);return{tag:I(t.tag),id:I(t.id),classes:Array.isArray(t.classes)?t.classes.filter(e=>typeof e==`string`):[],role:I(t.role),name:I(t.name),rect:{x:M(n?.x)??0,y:M(n?.y)??0,width:M(n?.width)??0,height:M(n?.height)??0},focusable:t.focusable===!0}}async function Xn(e){let t=new Headers({Accept:`image/*`});e.authToken&&t.set(`Authorization`,`Bearer ${e.authToken}`);let n=new AbortController,r=setTimeout(()=>n.abort(new DOMException(y(`browser.errors.screenshotFetchTimedOut`),`TimeoutError`)),Zn),i;try{let r=await fetch(Rt(e.path,e.resourceBasePath),{method:`GET`,headers:t,credentials:`same-origin`,signal:n.signal});if(!r.ok)throw r.body?.cancel().catch(()=>void 0),Error(y(`browser.errors.screenshotFetchFailed`,{status:String(r.status)}));i=await r.blob()}finally{clearTimeout(r)}return Qe(i,{readError:()=>y(`browser.errors.screenshotReadFailed`),invalidResultError:()=>y(`browser.errors.screenshotReadFailed`)})}var L,Zn;function Qn(){return(Qn=e((()=>{ht(),Se(),Lt(),f(),_n(),Sn(),Nt(),vn(),L=`browser.request`,Zn=3e4})))()}function $n(e,t){let n=t-cr,r=(z.get(e)??[]).filter(e=>e>n);return z.has(e)||it(z,99),r.length>=lr?(z.set(e,r),!1):(r.push(t),z.set(e,r),!0)}function R(e){if(!e.isConnected||!(typeof e.checkVisibility==`function`?e.checkVisibility():e.getClientRects().length>0))return!1;let t=e.ownerDocument.activeElement;for(;t?.shadowRoot?.activeElement;)t=t.shadowRoot.activeElement;return t===e}async function er(e,t,n,r,i){let a=typeof t==`string`?t.trim():``;return!a||a.length>sr||a.startsWith(`/`)||a.startsWith(`!`)||!R(e)||!$n(n,Date.now())||r&&!await r(a)||i?.()===!1||!R(e)?!1:(e.dispatchEvent(new CustomEvent(ar,{bubbles:!0,composed:!0,detail:{text:a}})),!0)}function tr(e,t=!1,n=!1,r={}){return{openLinks:{},serverTools:{},sandbox:{csp:e??{}},...t?{serverResources:{},message:{text:{},image:{},resource:{},resourceLink:{}}}:{},...n?{updateModelContext:{text:{},...r.richModelContext?{image:{},resource:{},resourceLink:{},structuredContent:{}}:{}}}:{},experimental:{...r.richModelContext?{"openai/modelContext":{}}:{},...t?{"openai/message":{}}:{},...r.fileResources?{"openai/resource":{}}:{},...r.openFiles?{"openai/files":{}}:{}}}}function nr(e){switch(e.type){case`text`:return typeof e.text==`string`&&e.text.trim().length>0;case`image`:return typeof e.data==`string`&&!!e.mimeType;case`resource_link`:return typeof e.uri==`string`&&!!e.uri&&typeof e.name==`string`&&!!e.name;case`resource`:return!!e.resource&&typeof e.resource.uri==`string`&&(`text`in e.resource&&typeof e.resource.text==`string`||`blob`in e.resource&&typeof e.resource.blob==`string`);default:return!1}}async function rr(e,t,n,r,i){let a=n._meta?.[`openai/message`],o=mt(a);return a!==void 0&&!o||n.role!==`user`||!n.content.length||n.content.some(e=>!nr(e))||o?.target!==void 0&&o.target!==`active`&&o.target!==`new`||o?.send!==void 0&&o.send!==!0||JSON.stringify(n.content).length>8388608||!R(e)||!$n(t.sessionKey+`\0`+t.viewId,Date.now())||/^[!/]/u.test(fn(n.content).trimStart())||!await r(n.content.map(e=>{let t=e._meta?.[`openai/title`];return typeof t==`string`&&t.trim()?t:e.type===`text`?e.text:e.type===`resource_link`?e.title??e.name:e.type===`resource`?e.resource.uri:e.type}).join(`

`))||i?.()===!1||!R(e)?!1:new Promise(r=>{e.dispatchEvent(new CustomEvent(`zero-mcp-app-message`,{bubbles:!0,composed:!0,cancelable:!0,detail:{...t,content:n.content,target:o?.target===`new`?`new`:`active`,respond:r}}))&&r(!1)})}function ir(e,t){let n=e?.availableDisplayModes??(e?.preferredDisplayMode?[e.preferredDisplayMode]:t),r=[`inline`,`fullscreen`].filter(e=>(!n||n.includes(e))&&(!t||t.includes(e)));if(!r.length)throw Error(`MCP App supports no available host display mode`);return{available:r,initial:e?.preferredDisplayMode&&r.includes(e.preferredDisplayMode)?e.preferredDisplayMode:r[0]}}var ar,or,sr,cr,lr,z,ur,dr,fr;function pr(){return(pr=e((()=>{Ze(),We(),ar=`zero-widget-prompt`,or=`zero-mcp-app-view-expired`,sr=4e3,cr=6e4,lr=10,z=new Map,ur=`zero-mcp-app-message`,dr=`zero-mcp-app-context`,fr=`zero-mcp-app-file-open`})))()}function mr(e){let t=new Map;for(let n of e.sessionData?.sessionsResult?.sessions??[]){let r=se(n.key)?.agentId??n.agentId??e.watchAgentId,i=B(n.key,r,e);t.has(i)||t.set(i,{row:n,agentId:r})}return t}function B(e,t,r){let i=se(e)?.agentId??ft(t);return`${i}\u0000${n({agentsList:{defaultId:i,mainKey:r.mainKey,scope:r.globalScope?`global`:`agent`}},se(e)||e.toLowerCase()===`global`?e:`agent:${i}:${e}`)}`}function hr(e,t=`compact`){let n=new Date(e);return w`<time
    datetime=${n.toISOString()}
    title=${n.toLocaleString(c.getLocale())}
    aria-label=${t===`minute-compact`?C:n.toLocaleString(c.getLocale())}
    ><zero-elapsed-time
      .startMs=${e}
      .minimumUnit=${t===`minute-compact`?`minute`:`second`}
      .singleUnit=${t===`single-unit`}
    ></zero-elapsed-time
  ></time>`}function gr(e,t,n){if(!n&&e.length===0)return C;let r=y(n?`presence.card.recentSessions`:`presence.card.viewingNow`);return w`<section class="person-activity-card__section">
    <h3>${r}</h3>
    ${e.length?w`<div class="person-activity-card__sessions">
            ${Le(e.slice(0,3),({row:e,agentId:n})=>B(e.key,n,t),({row:e,agentId:r})=>{let a=te(e.key,e),s=n?Ye(a,`person-activity-card__session-name`,{delay:250,speed:80}):w`<span
                      class="person-activity-card__session-name person-activity-card__session-name--multiline"
                      >${a}</span
                    >`,c=ee({face:o(e),sessionKey:e.key,fallbackAgentId:r,basePath:t.routing.basePath,row:e,mainKey:t.mainKey});return w`<a
                  class="person-activity-card__session session-row-host"
                  href=${c.href}
                  @click=${n=>{i(n)&&(n.preventDefault(),t.openSession(e,r))}}
                  ><span class="person-activity-card__session-icon" aria-hidden="true"
                    >${S.messageSquare}</span
                  >
                  <span class="person-activity-card__session-copy"
                    >${n?Fe(a,s):s}
                    ${e.updatedAt==null?C:w`<span class="person-activity-card__session-age"
                            >${hr(e.updatedAt,`single-unit`)}</span
                          >`}</span
                  >
                </a>`})}
          </div>`:w`<p class="person-activity-card__muted">${y(`presence.card.noRecentSessions`)}</p>`}
  </section>`}var _r,vr;function yr(){return(yr=e((()=>{D(),E(),Pe(),ze(),f(),qe(),cn(),rn(),ne(),h(),_(),x(),Ut(),Ft(),Ot(),_r=class extends Ne{render(e){let{user:t}=e,n=an(t,y(`presence.card.person`)),r=vt(t.identity?.id,e.routing,n.name),i=t.entries!==void 0,a=t.entries?.length===0,o=t.entries??[],s=o.flatMap(e=>e.onlineSince===void 0?[]:[e.onlineSince]),c=s.length?Math.min(...s):void 0,l=nn(t),u=Xt(t),d=ln(o),f=[...new Set(o.flatMap(e=>e.timeZone?.trim()?[e.timeZone.trim()]:[]))].toSorted(),p=new Set(t.watchedSessions.map(t=>B(t,e.watchAgentId,e))),m=mr(e),h=(t,n)=>(n.row.updatedAt??0)-(t.row.updatedAt??0)||B(t.row.key,t.agentId,e).localeCompare(B(n.row.key,n.agentId,e)),ee=[...p].flatMap(e=>m.get(e)??[]).toSorted(h),{sessionData:te}=e,g=(this.recentSessionKeys?.flatMap(e=>m.get(e)??[])??[...m.values()]).filter(({row:n,agentId:r})=>!p.has(B(n.key,r,e))&&[n.owner?.actor,n.createdActor].some(e=>en(t,e?.identity)));return this.recentSessionKeys||g.sort(h),(this.recentSessionKeys||te?.sessionsResult)&&(this.recentSessionKeys=g.slice(0,3).map(({row:t,agentId:n})=>B(t.key,n,e))),w`<div class="person-activity-card">
      <header class="person-activity-card__header">
        <zero-viewer-avatar
          .user=${t}
          .markAsViewer=${!1}
          variant="footer"
          aria-hidden="true"
        ></zero-viewer-avatar>
        <div>
          <h2>${n.name}</h2>
          ${i?w` <span
                  class="person-activity-card__status ${a?`person-activity-card__status--offline`:`person-activity-card__status--${u}`}"
                  ><span aria-hidden="true"></span>${a?y(`presence.offline`):c===void 0?y(`presence.rosterTitle`):[y(`presence.card.onlineFor`),` `,hr(c,`minute-compact`)]}${!a&&u!==`unknown`?w` · ${y(u===`active`?`presence.active`:`presence.idle`)}`:C}</span
                >`:C}
        </div>
      </header>
      ${n.isSharedOwner?w`<p class="person-activity-card__hint person-activity-card__muted">${y(`presence.sharedOwner.hint`)}</p>`:C}
      ${!i||a?C:w`<dl class="person-activity-card__facts">
              ${d.length||f.length?w`<div>
                      <dt>${y(`presence.card.where`)}</dt>
                      <dd>
                        ${d.map(e=>w`<span>${e}</span>`)}${f.map(e=>w`<small>${y(`presence.card.reportedTimeZone`,{zone:e})}</small>`)}
                      </dd>
                    </div>`:C}
              <div>
                <dt>${y(`presence.card.lastActivity`)}</dt>
                <dd>
                  ${l===void 0?y(`presence.card.notObserved`):w`<span>${hr(l)} ${y(`presence.card.ago`)}</span>`}
                </dd>
              </div>
            </dl>`}
      ${gr(ee,e,!1)}${gr(this.recentSessionKeys?g:[],e,!0)}
      ${r?w`<footer>
              <a href=${r.href} @click=${r.open}
                >${y(`presence.card.viewActivity`)}<span aria-hidden="true"
                  >${S.chevronRight}</span
                ></a
              >
            </footer>`:C}
    </div>`}},vr=T(_r)})))()}function br(e){e?.removeAttribute(`aria-controls`),e?.removeAttribute(`aria-expanded`),e?.removeAttribute(`aria-haspopup`)}function xr(e,t){let n=document.createElement(`div`);return n.id=e,n.className=t,n.dataset.open=`true`,n.setAttribute(`role`,`dialog`),n}function Sr(e,t,n){let r=e.getBoundingClientRect(),i=t.offsetWidth,a=t.offsetHeight,o=Math.max(H,innerWidth-i-H),s=Math.max(H,innerHeight-a-H),c=r.bottom+V+a+H<=innerHeight;if(n===`horizontal`){let e=r.right+V+i+H<=innerWidth,n=r.left-V-i>=H,l=r.top-V-a>=H;if(e||n||!c&&!l){let n=e?r.right+V:r.left-i-V;t.dataset.side=e?`right`:`left`,t.style.left=`${Math.min(Math.max(H,n),o)}px`,t.style.top=`${Math.min(Math.max(H,r.top),s)}px`;return}}let l=c?`bottom`:`top`,u=c?r.bottom+V:r.top-a-V;t.dataset.side=l,t.style.left=`${Math.min(Math.max(H,r.left),o)}px`,t.style.top=`${Math.min(Math.max(H,u),s)}px`}var V,H,Cr;function wr(){return(wr=e((()=>{Mt(),V=10,H=12,Cr=class{constructor(e,t=120,n=e){this.close=e,this.closeDelayMs=t,this.dismiss=n,this.card=null,this.pointerInside=!1,this.pointerOverCard=!1,this.focusInside=!1,this.cardFocusInside=!1,this.explicitHold=!1,this.restoringFocus=!1,this.closeTimer=null,this.exitCleanup=null,this.anchor=null,this.openTimer=null,this.placement=`vertical`,this.stopPositioning=null,this.trigger=null,this.triggerAncestors=[],this.presentationObserver=new MutationObserver(()=>{this.checkPresentation()&&this.observePresentation()}),this.unmountContents=null,this.handleCardPointerEnter=e=>{e.currentTarget===this.card&&(this.pointerOverCard=!0,this.clearClose())},this.handleCardFocusIn=e=>{e.currentTarget===this.card&&(this.cardFocusInside=!0,this.clearClose())},this.handleCardFocusOut=e=>{let t=this.card;t&&e.currentTarget===this.card&&(e.relatedTarget instanceof Node&&t.contains(e.relatedTarget)||(this.cardFocusInside=!1,this.scheduleClose()))},this.handleCardPointerLeave=()=>{this.pointerOverCard=!1,this.scheduleClose()},this.handleTriggerKeyDown=e=>{if(e.key===`Escape`){this.dismiss();return}if(e.key!==`Tab`||e.shiftKey||e.composedPath()[0]!==this.trigger)return;let t=this.focusables()[0];t&&(e.preventDefault(),t.focus())},this.handleCardKeyDown=e=>{if(e.key!==`Escape`&&e.key!==`Tab`)return;let t=this.focusables(),n=e.shiftKey?t[0]:t.at(-1);if(e.key===`Tab`&&document.activeElement!==n)return;e.preventDefault();let r=this.trigger;this.dismiss(),this.returnFocus(r)}}renderContents(e,t){let n=e.contains(document.activeElement)?document.activeElement:null;if(t(),n&&!e.contains(document.activeElement)){let e=n instanceof HTMLAnchorElement?this.focusables().find(e=>e instanceof HTMLAnchorElement&&e.href===n.href):void 0;e?e.focus({preventScroll:!0}):(this.returnFocus(this.trigger),this.focusInside=document.activeElement===this.trigger)}}returnFocus(e){this.restoringFocus=!0,e?.focus({preventScroll:!0}),this.restoringFocus=!1}get held(){return this.explicitHold||this.pointerInside||this.pointerOverCard||this.focusInside||this.cardFocusInside}schedulePointerExit(e=220){this.pointerInside=!1,this.scheduleClose(e)}focusables(){return[...this.card?.querySelectorAll(`a[href]:not([tabindex="-1"])`)??[]]}scheduleOpen(e,t,n=this.trigger){this.trigger=n,this.observePresentation(),this.openTimer=window.setTimeout(()=>{this.openTimer=null,this.checkPresentation()&&t()},e)}clearClose(){this.closeTimer!==null&&(window.clearTimeout(this.closeTimer),this.closeTimer=null)}scheduleClose(e=this.closeDelayMs){if(this.clearClose(),!this.held){if(!this.card){this.close();return}this.closeTimer=window.setTimeout(()=>{this.closeTimer=null,this.held||this.close()},e)}}markTrigger(e){this.trigger!==e&&br(this.trigger),this.trigger=e,e.setAttribute(`aria-haspopup`,`dialog`),e.setAttribute(`aria-expanded`,`false`),this.observePresentation()}presentationAncestors(){let e=[],t=this.trigger;for(;t;)e.push(t),t=t instanceof Element&&t.assignedSlot?t.assignedSlot:t instanceof ShadowRoot?t.host:t.parentNode;return e}checkPresentation(){return this.trigger&&(!this.trigger.isConnected||this.presentationAncestors().some(e=>e instanceof Element&&(e.hasAttribute(`inert`)||e.hasAttribute(`hidden`)||e.getAttribute(`aria-hidden`)===`true`)))?(this.dismiss(),!1):!0}observePresentation(){let e=this.presentationAncestors();if(!(e.length===this.triggerAncestors.length&&e.every((e,t)=>e===this.triggerAncestors[t]))){this.presentationObserver.disconnect(),this.triggerAncestors=e;for(let t of e)this.presentationObserver.observe(t,{childList:!0,attributes:!0,attributeFilter:[`inert`,`hidden`,`aria-hidden`,`slot`,`name`]})}}mount(e,t,n,r=!0,i){if(!this.checkPresentation()){i?.(),t.remove();return}this.clearCard(),this.anchor=e,this.card=t,t.addEventListener(`keydown`,this.handleCardKeyDown),t.addEventListener(`pointerenter`,this.handleCardPointerEnter),t.addEventListener(`focusin`,this.handleCardFocusIn),t.addEventListener(`focusout`,this.handleCardFocusOut),this.placement=n,this.unmountContents=i??null;let a=this.trigger??e,o=document.body;for(let t=e;t;t=ce(t))if(t.localName===`zero-modal-dialog`){o=t;break}o.append(t),zt(t),a.setAttribute(`aria-controls`,t.id),a.setAttribute(`aria-expanded`,`true`);let s=()=>Sr(e,t,n),c=null,l=()=>{c===null&&(c=requestAnimationFrame(()=>{c=null,s()}))},u=t=>{let n=t.composedPath()[0];if(n===window||n===document){l();return}for(let t=e;t;t=ce(t))if(t===n){l();return}};window.addEventListener(`resize`,l),window.addEventListener(`scroll`,u,!0),r&&(window.visualViewport?.addEventListener(`resize`,l),window.visualViewport?.addEventListener(`scroll`,l)),s(),this.stopPositioning=()=>{c!==null&&cancelAnimationFrame(c),window.removeEventListener(`resize`,l),window.removeEventListener(`scroll`,u,!0),window.visualViewport?.removeEventListener(`resize`,l),window.visualViewport?.removeEventListener(`scroll`,l)}}clearCard(e=0){this.stopPositioning?.(),this.stopPositioning=null,this.exitCleanup?.(),this.exitCleanup=null;let t=this.card,n=this.unmountContents;if(this.card=null,this.unmountContents=null,!t)return;if(e<=0||!t.isConnected||globalThis.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches){n?.(),t.remove();return}t.dataset.open=`false`,t.style.pointerEvents=`none`;let r=null,i=()=>{r!==null&&(window.clearTimeout(r),r=null),t.removeEventListener(`transitionend`,a),n?.(),t.remove(),this.exitCleanup===i&&(this.exitCleanup=null)},a=e=>{e.target===t&&e.propertyName===`opacity`&&i()};t.addEventListener(`transitionend`,a),r=window.setTimeout(i,e+50),this.exitCleanup=i}position(){this.anchor&&this.card&&Sr(this.anchor,this.card,this.placement)}reset(e=0){this.presentationObserver.disconnect(),this.triggerAncestors=[],this.openTimer!==null&&(window.clearTimeout(this.openTimer),this.openTimer=null),this.clearClose(),this.pointerInside=!1,this.pointerOverCard=!1,this.focusInside=!1,this.cardFocusInside=!1,this.explicitHold=!1,br(this.trigger),this.clearCard(e),this.anchor=null,this.trigger=null}}})))()}var Tr,Er;function Dr(){return(Dr=e((()=>{dt(),D(),O(),et(),ve(),ue(),f(),rn(),Qt(),h(),_(),Kt(),u(),$t(),St(),yr(),bt(),Ut(),wr(),Tr=0,Er=class e extends t{constructor(...t){super(...t),this.profileId=``,this.label=``,this.context=new tt(this,{context:Te,subscribe:!0}),this.connection=new Gt(this,{getGateway:()=>this.context.value?.gateway,invalidateRequests:()=>this.close()}),this.portal=new Cr(()=>this.close()),this.activityExpiry=Jt(this,()=>Zt(this.activity?.data?.presencePayload).users.filter(e=>en(e,this.person?.identity)),()=>this.renderCard()),this.close=()=>{e.active.get(this.ownerDocument)===this&&e.active.delete(this.ownerDocument),this.activity?.dispose(),this.activity=void 0,this.activityExpiry.sync(),this.stopRoute?.(),this.stopRoute=void 0,document.removeEventListener(`pointerdown`,this.outside,!0),document.removeEventListener(`focusin`,this.outside,!0),document.removeEventListener(`keydown`,this.escape,!0),this.portal.reset(),this.person=void 0,this.trigger?.setAttribute(`aria-expanded`,`false`),this.trigger?.setAttribute(`aria-haspopup`,`dialog`)},this.outside=e=>{e.composedPath().some(e=>e===this||e===this.portal.card)||this.close()},this.escape=e=>{if(e.key!==`Escape`)return;e.preventDefault(),e.stopPropagation();let t=this.portal.card?.contains(document.activeElement),n=this.trigger;this.close(),t&&this.portal.returnFocus(n)}}static{this.active=new WeakMap}createRenderRoot(){return this.replaceChildren(),super.createRenderRoot()}disconnectedCallback(){this.close(),super.disconnectedCallback()}willUpdate(e){e.has(`profileId`)&&this.close()}updated(){for(let e of this.trigger?.childNodes??[])e.nodeType===Node.TEXT_NODE&&e.textContent&&!e.textContent.trim()&&(e.textContent=``);this.portal.card&&this.renderCard()}get trigger(){return this.querySelector(`button`)}open(){let t=this.trigger;if(!t||!this.profileId||this.portal.card)return;e.active.get(this.ownerDocument)?.close(),e.active.set(this.ownerDocument,this);let n=xr(`zero-person-reference-`+ ++Tr,`session-progress-hovercard person-activity-hovercard`);this.portal.markTrigger(t),n.addEventListener(`pointerleave`,this.portal.handleCardPointerLeave),this.portal.mount(t,n,`vertical`,!0,()=>Me(C,n)),document.addEventListener(`pointerdown`,this.outside,!0),document.addEventListener(`focusin`,this.outside,!0),document.addEventListener(`keydown`,this.escape,!0);let r=this.context.value;this.stopRoute=r?.router.subscribe(()=>this.close()),r&&(this.activity=yt(r,()=>this.renderCard())),this.person=this.connection.capture()?void 0:null,this.renderCard(),this.loadPerson(n)}async loadPerson(e){let t=this.connection.capture(),n=this.context.value,r=this.profileId;if(!t||!n)return;let i=null;try{let{profiles:e}=await t.client.request(`users.list`,{}),n=new Map(e.map(e=>[e.id,e])),a=new Set,o=n.get(r);for(;o?.mergedInto&&!a.has(o.id);)a.add(o.id),o=n.get(o.mergedInto);o&&!o.mergedInto&&(i={id:o.id,identity:{type:`profile`,id:o.id},name:o.displayName?.trim()||o.githubIdentity?.login||y(`presence.card.person`),avatarUrl:o.hasAvatar?nt(o.id,o.updatedAt):void 0,watchedSessions:[]})}catch{}this.portal.card===e&&this.profileId===r&&this.context.value===n&&this.connection.isCurrent(t)&&(this.person=i,this.renderCard())}renderCard(){this.activityExpiry.sync();let e=this.portal.card,t=this.context.value;if(!e)return;e.setAttribute(`aria-label`,y(`presence.card.ariaLabel`,{name:this.person?.name??this.label}));let n=this.activity?.data,i=Zt(n?.presencePayload).users.find(e=>en(e,this.person?.identity)),a=this.person&&{...this.person,name:i?.name??this.person.name,avatarUrl:i?.avatarUrl??this.person.avatarUrl,watchedSessions:i?.watchedSessions??[],entries:i?.entries??(n?.presencePayload?[]:void 0)},s={agentsList:t?.agents.state.agentsList,hello:t?.gateway.snapshot.hello},c=this.connection.capture(),l=t?.router.getState().location;this.portal.renderContents(e,()=>Me(a&&t?vr({user:a,sessionData:n,watchAgentId:r(s),mainKey:p(s),globalScope:d(s),routing:kt(t,this.close),openSession:(e,n)=>{let r=o(e),i=ee({face:r,sessionKey:e.key,row:e,fallbackAgentId:n,basePath:t.basePath,mainKey:p(s)});this.close(),tn(this,{agentId:n,face:r,sessionKey:e.key,commit:()=>!c||this.context.value!==t||t.router.getState().location!==l||!this.connection.isCurrent(c)?!1:(Yt(t.gateway,i.options.pathname,e.key),t.navigate(r,i.options),de({selection:t.agentSelection,gateway:t.gateway,sessionKey:e.key,agentId:n}),!0)})}}):w`<div class="person-reference__status" role="status">
              ${this.person===void 0?y(`common.loading`):y(`chat.mentions.unavailable`)}
            </div>`,e)),this.portal.position()}render(){let e=Ht({id:this.profileId,identity:{type:`profile`,id:this.profileId},name:this.label.replace(/^@/u,``)}),t=w`<span
      class=${Et(`markdown-person-reference__avatar`,e)}
      aria-hidden="true"
      data-initials=${e.fallback.initials}
      >${Dt({view:e,fallbackSelector:`.markdown-person-reference__avatar`,ariaHidden:!0})}</span
    >`,n=this.label.startsWith(`@`)?w`<span class="markdown-person-reference__prefix" aria-hidden="true">@</span
          >${this.label.slice(1)}`:this.label;return w`<button
      type="button"
      class="markdown-person-reference"
      aria-haspopup="dialog"
      aria-expanded="false"
      aria-label=${y(`presence.card.ariaLabel`,{name:this.label})}
      @pointerenter=${e=>{e.pointerType!==`touch`&&(this.portal.pointerInside=!0,this.portal.clearClose(),this.portal.scheduleOpen(250,()=>{this.portal.held&&this.open()}))}}
      @pointerleave=${()=>this.portal.schedulePointerExit()}
      @pointercancel=${this.close}
      @contextmenu=${this.close}
      @focus=${()=>{this.portal.restoringFocus||(this.portal.focusInside=!0,this.portal.clearClose(),this.open())}}
      @blur=${()=>{this.portal.focusInside=!1,this.portal.scheduleClose()}}
      @keydown=${this.portal.handleTriggerKeyDown}
      @click=${()=>{if(this.portal.explicitHold){this.close();return}this.portal.explicitHold=!0,this.open()}}
    >
      ${t}${n}
    </button>`}},j([k({attribute:`profile-id`})],Er.prototype,`profileId`,void 0),j([k()],Er.prototype,`label`,void 0),customElements.get(`zero-person-reference`)||customElements.define(`zero-person-reference`,Er)})))()}var Or,kr,Ar,jr;function Mr(){return(Mr=e((()=>{D(),E(),f(),ie(),wt(),xt(),lt(),Or=0,kr=`.code-block-wrapper, .markdown-mermaid`,Ar=class extends re{constructor(...e){super(...e),this.scanPending=!1,this.active=!0,this.pendingBlocks=new Set,this.observedNodes=new Set,this.resizeObserver=typeof ResizeObserver>`u`?null:new ResizeObserver(e=>{if(!this.active||!this.isConnected)return;let t=new Set(e.map(({target:e})=>e.closest(`.code-block-wrapper`)));for(let e of t)e&&Ct(e)}),this.mutationObserver=new MutationObserver(e=>{this.collectMutations(e),this.pendingBlocks.size&&this.scheduleScan()})}presentationChanged(e){e?.isPresented()===!1&&(this.active=!1,this.release())}collectMutations(e){for(let t of e){let e=(t.target instanceof Element?t.target:t.target.parentElement)?.closest(kr);e&&this.pendingBlocks.add(e);for(let e of t.addedNodes)e instanceof HTMLElement&&this.collectBlocks(e);for(let e of t.removedNodes){if(!(e instanceof HTMLElement)||this.root?.contains(e))continue;let t=[e,...e.querySelectorAll(`.code-block-viewport, code`)];for(let e of t)this.observedNodes.delete(e)&&this.resizeObserver?.unobserve(e)}}}render(e=!0){return C}update(e,[t=!0]){this.updatePresentation(t);let n=e.element instanceof HTMLElement?e.element:void 0;return n!==this.root&&(this.release(),this.root=n),this.active=typeof t==`boolean`?t:t.isPresented(),this.active?this.scheduleScan():this.release(),C}disconnected(){super.disconnected(),this.release()}release(){this.mutationObserver.disconnect(),this.observedRoot=void 0,this.pendingBlocks.clear(),this.resizeObserver?.disconnect(),this.observedNodes.clear(),this.root&&Tt(this.root)}reconnected(){super.reconnected(),this.scheduleScan()}scheduleScan(){!this.scanPending&&this.active&&this.isConnected&&(this.scanPending=!0,queueMicrotask(()=>{this.scanPending=!1,this.active&&this.isConnected&&this.root?.isConnected&&this.scan(this.root)}))}scan(e){Vt(e),this.observedRoot!==e&&(this.collectBlocks(e),this.mutationObserver.observe(e,{childList:!0,subtree:!0,characterData:!this.resizeObserver}),this.observedRoot=e),this.collectMutations(this.mutationObserver.takeRecords());let t=[...this.pendingBlocks];this.pendingBlocks.clear();for(let n of t){if(!e.contains(n))continue;if(n.matches(`.markdown-mermaid`)){if(n.querySelector(`pre code`)){let t=()=>this.active&&this.isConnected&&this.root===e&&e.isConnected&&e.contains(n);ut(async()=>{let{mountMermaidBlocks:e}=await import(`./markdown-mermaid-1JxH8Zzl.js`);return{mountMermaidBlocks:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]),import.meta.url).then(({mountMermaidBlocks:e})=>{t()&&e(n)},()=>{t()&&n.matches(`.markdown-mermaid`)&&(n.classList.remove(`markdown-mermaid`),n.prepend(y(`chat.mermaid.rendererError`)))})}continue}let t=n.querySelector(`.code-block-viewport`),r=t?.querySelector(`code`);if(!t||!r)continue;let i=n.querySelector(`.code-block-expand`);i&&(t.id||=`code-block-${++Or}`,i.getAttribute(`aria-controls`)!==t.id&&i.setAttribute(`aria-controls`,t.id));for(let e of[t,r])this.observedNodes.has(e)||(this.observedNodes.add(e),this.resizeObserver?.observe(e));this.resizeObserver||Ct(n)}}collectBlocks(e){e.matches(kr)&&this.pendingBlocks.add(e);for(let t of e.querySelectorAll(kr))this.pendingBlocks.add(t)}},jr=T(Ar)})))()}function Nr(e,t=``){try{let n=new URL(e,globalThis.location.origin),r=`${at(t)}${He}`;return n.origin===globalThis.location.origin&&n.pathname.startsWith(r)&&/^[^/]+\/[^/]+$/u.test(n.pathname.slice(r.length))}catch{return!1}}async function Pr(e,{variant:t,...n},r,i){let{client:a,connectionEpoch:o,resourceBasePath:s}=e;if(!e.connected||!a)return null;let c=!/^artifact_managed_(?:image|media)_/u.test(n.artifactId)&&globalThis.location?.protocol===`https:`&&be(a.gatewayUrl),l=()=>!r?.aborted&&e.connected&&e.client===a&&e.connectionEpoch===o,u=async e=>{if(!l())return null;let t=await a.request(`artifacts.download`,{...n,...e?{transport:`http`}:{}},{timeoutMs:3e4});return l()?t:null},d=await u(c);if(!d)return null;let f=d.url?.trim();if(!c||!f?.startsWith(`/api/artifacts/download/`))return d;let p={...d,url:`${at(s??``)}${f}${t===`thumbnail`?`?variant=thumbnail`:``}`},m=d.artifact.mimeType?.split(`;`,1)[0]?.trim().toLowerCase()??``;if(!i?.readBinary&&!/^(?:image\/|text\/|application\/json$)/u.test(m))return p;try{if(!Nr(p.url,s))throw Error(`Invalid artifact download URL`);let e=AbortSignal.timeout(3e4),n=await Ee(p.url,{credentials:`same-origin`,redirect:`error`,signal:r?AbortSignal.any([r,e]):e});if(!n.ok)throw Error(`Artifact download failed (${n.status})`);if(n.headers.get(`content-disposition`)?.split(`;`,1)[0]?.trim().toLowerCase()!==`attachment`)throw Error(`Artifact download returned an unexpected content disposition`);let i=await n.blob(),a=i.type.split(`;`,1)[0]?.trim().toLowerCase();if(a!==(m||`application/octet-stream`)&&(t!==`thumbnail`||d.artifact.type!==`image`||a!==`image/png`))throw Error(`Artifact download returned an unexpected content type`);return l()?{...p,blob:i}:null}catch{return await u(!1)}}async function Fr(e,t,n){let r=await Pr(e,t,n);if(r?.blob&&(r.artifact.type!==`image`||!Ir.test(r.blob.type.split(`;`,1)[0]?.trim().toLowerCase()??``)))return null;if(r?.encoding===`base64`&&r.artifact.type===`image`&&Ir.test(r.artifact.mimeType??``)&&r.data)return{url:`data:${r.artifact.mimeType};base64,${r.data}`};let i=r?.url?.trim();if(!i)return null;let a=r?.expiresAt?.trim();return{url:i,...a?{expiresAt:a}:{},...r?.blob?{blob:r.blob}:{}}}var Ir;function Lr(){return(Lr=e((()=>{Ue(),Ce(),De(),me(),Ir=/^image\/(?:png|jpeg|gif|webp|avif)$/u})))()}function Rr(e){let t=new CustomEvent(Jr,{detail:e,cancelable:!0});return window.dispatchEvent(t),t.defaultPrevented?`accepted`:t.rejection?`rejected`:`unhandled`}function U(e){return Math.min(1,Math.max(0,e))}function zr(e){if(e.points.length===0)return null;let t=1,n=1,r=0,i=0;for(let a of e.points)t=Math.min(t,U(a.x)),n=Math.min(n,U(a.y)),r=Math.max(r,U(a.x)),i=Math.max(i,U(a.y));return{x:t,y:n,width:r-t,height:i-n}}function Br(e){return String(Math.round(U(e)*100))}function W(e,t){return $e(e.replace(/\s+/g,` `).trim(),t)}function Vr(e){let t=W(e,Xr),n=URL.parse(t);return n?!n.username&&!n.password?t:(n.username=``,n.password=``,$e(n.href,Xr)):t.replace(/^([a-z][a-z\d+.-]*:\/\/)[^/?#\s]*@/i,`$1`)}function Hr(e){let t=URL.parse(e)?.hostname;return t?W(t,Zr):$e(e,Zr)}function Ur(e){return e.replace(/[^\w-]/g,``).slice(0,40)}function Wr(e){let t=e.classes.slice(0,3).map(e=>Ur(e)).filter(e=>e.length>0).map(e=>`.${e}`).join(``),n=Ur(e.tag)||`element`,r=Ur(e.id),i=`${n}${r?`#${r}`:``}${t}`,a=W(e.name,Yr);return`${i}${a?` "${a}"`:``}${e.role?` (role=${W(e.role,40)})`:``}`}function Gr(e){let t=Vr(e.url),n=W(e.title,Yr),r=Hr(t),i=e.strokes.flatMap(e=>zr(e)??[]),a=e.element?{descriptor:Wr(e.element),width:String(Math.round(e.element.rect.width)),height:String(Math.round(e.element.rect.height)),x:String(Math.round(e.element.rect.x)),y:String(Math.round(e.element.rect.y))}:null,o=[n?y(`browser.annotatePrompt.introTitled`,{url:t,title:n}):y(`browser.annotatePrompt.introUntitled`,{url:t})];return e.browserTab&&o.push(y(`browser.annotatePrompt.browserTarget`,{target:JSON.stringify(e.browserTab)})),i.slice(0,Qr).forEach((e,t)=>{o.push(y(`browser.annotatePrompt.region`,{index:String(t+1),x:Br(e.x+e.width/2),y:Br(e.y+e.height/2),width:Br(e.width),height:Br(e.height)}))}),i.length>Qr&&o.push(y(`browser.annotatePrompt.moreRegions`,{count:String(i.length-Qr)})),a&&o.push(y(`browser.annotatePrompt.elementDetail`,a)),o.push(y(`browser.annotatePrompt.outro`)),{modelContext:o.join(`
`),card:{title:n||$e(r,Yr),displayUrl:r,markedRegionCount:i.length,inspectedElement:a!==null}}}function Kr(e,t){e.lineCap=`round`,e.lineJoin=`round`,e.strokeStyle=$r,e.lineWidth=Math.max(4,Math.round(t.width*.005));for(let n of t.strokes)if(n.points.length!==0){if(e.beginPath(),n.points.forEach((n,r)=>{let i=U(n.x)*t.width,a=U(n.y)*t.height;r===0?e.moveTo(i,a):e.lineTo(i,a)}),n.points.length===1){let r=n.points[0];r&&e.lineTo(U(r.x)*t.width+.1,U(r.y)*t.height)}e.stroke()}if(t.highlight){let{x:n,y:r,width:i,height:a}=t.highlight;e.strokeRect(U(n)*t.width,U(r)*t.height,Math.max(2,i*t.width),Math.max(2,a*t.height))}}function qr(e){let t=document.createElement(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);if(!n)throw Error(y(`browser.errors.canvasUnavailable`));return n.drawImage(e.image,0,0,e.width,e.height),Kr(n,e),t.toDataURL(`image/png`)}var Jr,Yr,Xr,Zr,Qr,$r;function ei(){return(ei=e((()=>{f(),_n(),vn(),Jr=`zero:browser-annotation`,Yr=80,Xr=500,Zr=160,Qr=8,$r=`#e0442d`})))()}var ti,G;function ni(){return(ni=e((()=>{st(),D(),O(),ue(),xe(),f(),Ze(),v(),Je(),u(),x(),We(),ti=`zero-mcp-app-resource-mention`,G=class extends g{constructor(...e){super(...e),this.sessionKey=``,this.agentId=``,this.expanded=!1,this.serverName=``,this.query=``,this.resources=[],this.busy=!1,this.searched=!1,this.error=null,this.generation=0,this.scope=-1,this.catalog=new Ge(this,()=>this.context,()=>({sessionKey:this.sessionKey,agentId:this.agentId}))}willUpdate(e){let t=this.context?Oe(this.context.gateway).key:-1;(e.has(`sessionKey`)||e.has(`agentId`)||t!==this.scope)&&(this.scope=t,this.generation++,this.resources=[],this.error=null,this.searched=!1,this.busy=!1)}async search(){let e=this.context?.gateway.snapshot.client;if(!e||!this.serverName)return;let t=++this.generation,n=this.scope,{sessionKey:r,agentId:i,serverName:a}=this,o=()=>this.isConnected&&this.generation===t&&this.context?.gateway.snapshot.client===e&&this.scope===n;this.busy=!0,this.error=null,this.resources=[];try{let t=await e.request(`mcp.app.mention`,{sessionKey:r,agentId:i,serverName:a,query:this.query});o()&&(this.resources=t.resources,this.searched=!0)}catch(e){o()&&(this.error=mt(mt(e)?.details)?.code===`MCP_APP_UNSUPPORTED_MENTION_RESULT`?y(`mcpApp.errors.unsupportedResources`):ae(e))}finally{o()&&(this.busy=!1)}}attach(e){this.context?.gateway.snapshot.phase===`connected`&&this.resources.includes(e)&&(this.dispatchEvent(new CustomEvent(`zero-mcp-app-resource-mention`,{bubbles:!0,composed:!0,cancelable:!0,detail:{sessionKey:this.sessionKey,agentId:this.agentId,serverName:this.serverName,resource:e}}))?this.error=y(`mcpApp.errors.mountUnavailable`):this.expanded=!1)}disconnectedCallback(){this.generation++,super.disconnectedCallback()}render(){let e=this.catalog.servers.filter(e=>e.mentionTool);return e.length?(e.some(e=>e.serverName===this.serverName)||(this.serverName=e[0].serverName),w`<section class="mcp-app-resources">
      <button
        type="button"
        class="btn btn--sm"
        aria-expanded=${String(this.expanded)}
        @click=${()=>{this.expanded=!this.expanded}}
      >
        ${S.link} ${y(`mcpApp.resources`)}
      </button>
      ${this.expanded?w`<p class="muted">${y(`mcpApp.resourceDescription`)}</p>
              <form
                class="mcp-app-resources__search"
                @submit=${e=>{e.preventDefault(),this.search()}}
              >
                <select
                  aria-label=${y(`mcpApp.title`)}
                  .value=${this.serverName}
                  ?disabled=${this.busy}
                  @change=${e=>{e.currentTarget instanceof HTMLSelectElement&&(this.serverName=e.currentTarget.value,this.generation++,this.resources=[],this.searched=!1)}}
                >
                  ${e.map(e=>w`<option value=${e.serverName}>${e.label}</option>`)}
                </select>
                <input
                  type="search"
                  aria-label=${y(`mcpApp.resourceSearch`)}
                  placeholder=${y(`mcpApp.resourceQuery`)}
                  .value=${this.query}
                  @input=${e=>{e.currentTarget instanceof HTMLInputElement&&(this.query=e.currentTarget.value,this.generation++,this.busy=!1,this.resources=[],this.searched=!1)}}
                />
                <button class="btn" type="submit" ?disabled=${this.busy}>
                  ${y(`mcpApp.resourceSearch`)}
                </button>
              </form>
              <div class="mcp-app-resources__results">
                ${this.resources.map(e=>w`<button type="button" class="btn mcp-app-resources__result" ?disabled=${this.busy} @click=${()=>this.attach(e)}><span>${e.title||e.name}</span><small>${e.description||e.uri}</small></button>`)}
              </div>
              ${this.searched&&!this.resources.length?w`<p role="status">${y(`mcpApp.noResources`)}</p>`:C} `:C}
      ${this.error?w`<p role="alert">${this.error}</p>`:C}
    </section>`):C}},j([ot({context:Te,subscribe:!0})],G.prototype,`context`,void 0),j([k({attribute:!1})],G.prototype,`sessionKey`,void 0),j([k({attribute:!1})],G.prototype,`agentId`,void 0),j([A()],G.prototype,`expanded`,void 0),j([A()],G.prototype,`serverName`,void 0),j([A()],G.prototype,`query`,void 0),j([A()],G.prototype,`resources`,void 0),j([A()],G.prototype,`busy`,void 0),j([A()],G.prototype,`searched`,void 0),j([A()],G.prototype,`error`,void 0),customElements.get(`zero-mcp-app-resources`)||customElements.define(`zero-mcp-app-resources`,G)})))()}function ri(e,t,n=!1,r=!1){return w`
    <zero-panel-loading-skeleton
      .variant=${e}
      .label=${t}
      ?compact=${n}
      ?overlay=${r}
      role="status"
      aria-busy="true"
      aria-label=${t}
    ></zero-panel-loading-skeleton>
  `}var K;function ii(){return(ii=e((()=>{D(),O(),u(),K=class extends l{constructor(...e){super(...e),this.variant=`files`,this.compact=!1,this.overlay=!1,this.label=``}static{this.styles=Ie`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      min-height: 100%;
      padding: 14px;
      color: var(--muted);
    }

    :host([compact]) {
      min-height: 0;
      padding: 8px;
    }

    :host([data-panel-skeleton="desktop"]) {
      display: flex;
      flex: 1;
      min-height: 0;
      align-items: center;
      justify-content: center;
    }

    .desktop-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
      font-size: 13px;
    }

    .desktop-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-top-color: var(--muted);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    :host([overlay]) {
      position: absolute;
      inset: 0;
      z-index: 2;
      min-height: 0;
      background: color-mix(in srgb, var(--bg, #0e1015) 92%, transparent);
      pointer-events: none;
    }

    :host([compact]) .viewport,
    :host([compact]) .terminal,
    :host([compact]) .discussion-frame {
      min-height: 72px;
    }

    * {
      box-sizing: border-box;
    }

    /* Terminal/desktop/browser hosts use shadow roots, so base.css's .skeleton
       and global reduced-motion gate cannot reach here. Keep this primitive
       declaration-identical to base.css; the unit test guards against drift. */
    .skeleton {
      position: relative;
      overflow: hidden;
      background: var(--skeleton-base, var(--bg-muted));
      border-radius: var(--radius-md);
    }

    .skeleton::after {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 25%,
        var(--skeleton-highlight, var(--bg-hover)) 50%,
        transparent 75%
      );
      content: "";
      transform: translateX(-100%);
      animation: shimmer var(--skeleton-duration, 1.5s) ease-in-out infinite;
      will-change: transform;
    }

    .line {
      height: 10px;
    }

    .short {
      width: 36%;
    }

    .medium {
      width: 62%;
    }

    .long {
      width: 88%;
    }

    .row,
    .toolbar,
    .bubble,
    .summary {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .rows,
    .conversation,
    .code {
      display: grid;
      gap: 12px;
    }

    .toolbar {
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 14px;
    }

    .icon {
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      border-radius: 5px;
    }

    .copy {
      display: grid;
      flex: 1;
      gap: 6px;
    }

    .meta {
      height: 7px;
      width: 28%;
    }

    .viewport {
      min-height: 220px;
      border-radius: 8px;
    }

    .address {
      height: 28px;
      flex: 1;
      border-radius: 7px;
    }

    .button {
      width: 28px;
      height: 28px;
      flex: 0 0 auto;
    }

    .summary {
      margin-bottom: 16px;
    }

    .pill {
      width: 64px;
      height: 24px;
      border-radius: 999px;
    }

    .file-heading {
      height: 30px;
      margin-bottom: 14px;
    }

    .code .line {
      height: 9px;
      border-radius: 3px;
    }

    .terminal {
      display: grid;
      gap: 11px;
      padding: 12px;
      min-height: 220px;
      align-content: start;
      border-radius: 8px;
      background: color-mix(in srgb, var(--bg) 76%, transparent);
    }

    .bubble {
      width: 82%;
      min-height: 58px;
      padding: 12px;
      align-items: flex-start;
      border-radius: 12px;
      background: color-mix(in srgb, var(--bg-muted) 76%, transparent);
    }

    .bubble.user {
      width: 58%;
      margin-left: auto;
    }

    .discussion-frame {
      min-height: 280px;
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    /* Mirrors board.css: a 38px tab strip over a 12-column grid with 56px rows,
       so the placeholder occupies the same footprint as the widgets it precedes. */
    .board-tabs {
      display: flex;
      gap: 14px;
      align-items: center;
      min-height: 38px;
      margin-bottom: 12px;
      padding: 0 13px;
      border-bottom: 1px solid var(--border);
    }

    .tab {
      width: 64px;
      height: 10px;
      border-radius: 5px;
    }

    .board-grid {
      container-type: inline-size;
      display: grid;
      gap: 12px;
      grid-auto-rows: 56px;
      grid-template-columns: repeat(12, minmax(0, 1fr));
    }

    .widget {
      display: grid;
      grid-template-rows: 38px minmax(0, 1fr);
      min-height: 0;
      min-width: 0;
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: 12px;
    }

    @container (max-width: 560px) {
      .widget {
        grid-column: 1 / -1 !important;
      }
    }

    .widget-bar {
      display: flex;
      gap: 7px;
      align-items: center;
      padding: 0 12px;
      border-bottom: 1px solid var(--border);
    }

    .widget-body {
      display: grid;
      gap: 10px;
      align-content: start;
      padding: 12px;
    }

    @keyframes shimmer {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(100%);
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .desktop-spinner,
      .skeleton::after {
        animation: none;
      }
    }
  `}line(e=`long`){return w`<div class="skeleton line ${e}"></div>`}rows(){return Array.from({length:5},(e,t)=>w`
        <div class="row">
          <div class="skeleton icon"></div>
          <div class="copy">
            ${this.line(t%2==0?`long`:`medium`)}
            <div class="skeleton meta"></div>
          </div>
        </div>
      `)}widget(e,t,n){return w`
      <div class="widget" style=${`grid-column: span ${e}; grid-row: span ${t}`}>
        <div class="widget-bar">
          <div class="skeleton icon"></div>
          ${this.line(`short`)}
        </div>
        <div class="widget-body">${n.map(e=>this.line(e))}</div>
      </div>
    `}render(){switch(this.variant){case`board`:return w`
          <div class="board-tabs">
            <div class="skeleton tab"></div>
            <div class="skeleton tab"></div>
          </div>
          <div class="board-grid">
            ${this.widget(6,4,[`long`,`medium`,`short`])}
            ${this.widget(6,4,[`medium`,`long`])} ${this.widget(4,3,[`medium`,`short`])}
            ${this.widget(8,3,[`long`,`medium`,`long`])}
          </div>
        `;case`browser`:return w`
          <div class="toolbar">
            <div class="skeleton button"></div>
            <div class="skeleton button"></div>
            <div class="skeleton address"></div>
          </div>
          <div class="skeleton viewport"></div>
        `;case`chat`:return w`
          <div class="conversation">
            <div class="bubble"><div class="copy">${this.line()}${this.line(`medium`)}</div></div>
            <div class="bubble user"><div class="copy">${this.line(`medium`)}</div></div>
            <div class="bubble"><div class="copy">${this.line()}${this.line(`short`)}</div></div>
          </div>
        `;case`desktop`:return w`
          <div class="desktop-loading">
            <span class="desktop-spinner" aria-hidden="true"></span>
            <span>${this.label}</span>
          </div>
        `;case`discussion`:return w`
          <div class="discussion-frame">
            <div class="conversation">
              ${this.line(`medium`)} ${this.line()} ${this.line(`long`)} ${this.line(`short`)}
            </div>
          </div>
        `;case`file-list`:return w`<div class="rows">${this.rows()}</div>`;case`document`:return w`
          <div class="skeleton file-heading medium"></div>
          <div class="code">
            ${this.line()} ${this.line()} ${this.line(`medium`)} ${this.line()}
            ${this.line(`short`)}
          </div>
        `;case`review`:return w`
          <div class="summary">
            <div class="skeleton pill"></div>
            <div class="skeleton pill"></div>
          </div>
          <div class="skeleton file-heading"></div>
          <div class="code">
            ${this.line()} ${this.line(`long`)} ${this.line(`medium`)} ${this.line()}
            ${this.line(`short`)}
          </div>
        `;case`terminal`:return w`
          <div class="toolbar">
            <div class="skeleton pill"></div>
            <div class="skeleton pill"></div>
          </div>
          <div class="terminal">
            ${this.line(`medium`)} ${this.line()} ${this.line(`short`)} ${this.line(`long`)}
          </div>
        `;default:return w`
          <div class="toolbar">
            <div class="skeleton address"></div>
            <div class="skeleton button"></div>
          </div>
          <div class="rows">${this.rows()}</div>
        `}}},j([k({reflect:!0,attribute:`data-panel-skeleton`})],K.prototype,`variant`,void 0),j([k({type:Boolean,reflect:!0})],K.prototype,`compact`,void 0),j([k({type:Boolean,reflect:!0})],K.prototype,`overlay`,void 0),j([k()],K.prototype,`label`,void 0),customElements.get(`zero-panel-loading-skeleton`)||customElements.define(`zero-panel-loading-skeleton`,K)})))()}async function ai(e,t){if(t===null)return[];if(t!==void 0)try{return[await e.request(`environments.status`,{environmentId:t})]}catch(e){if(e instanceof le&&e.code===`INVALID_REQUEST`&&e.message===`unknown environmentId`)return[];throw e}return(await e.request(`environments.list`,{})).environments}async function oi(e,t){let n=await t.target;if(!t.isCurrent())return;let r=await ai(e,n);if(!t.isCurrent())return;let i=r.find(e=>e.id===n);if(i?.status===`starting`)return{environments:[i],selectedSource:void 0,pendingSource:i.id};if(i?.status===`error`||!t.recoverToPicker&&i&&i.status!==`available`)throw Error(i.worker?.error??`Desktop environment is unavailable`);if(t.recoverToPicker&&n!==void 0&&!r.some(e=>e.id===n&&e.desktop)&&(r=await ai(e,void 0),!t.isCurrent()))return;let a=r.find(e=>e.id===n&&e.status===`available`&&e.desktop===!0)?.id,o;if(!t.recoverToPicker&&n===`gateway`&&a===void 0&&i?.status===`available`){let n=await e.request(`environments.list`,{includeDesktopSetup:!0}).catch(()=>void 0);if(!t.isCurrent())return;o=n?.environments.find(e=>e.id===`gateway`&&e.desktopSetup)}return{selectedSource:a,environments:r.filter(e=>e.desktop===!0),...o?{hostSetup:o}:{}}}function si(e){return e.id===`gateway`?{kind:`host`}:e.id.startsWith(`node:`)&&e.id.length>5?{kind:`node`,nodeId:e.id.slice(5)}:{kind:`environment`,environmentId:e.id}}function ci(){return(ci=e((()=>{Se()})))()}var li;function ui(){return(ui=e((()=>{mn(),li=class{constructor(e,t){this.host=e,this.options=t,this.connected=!1,this.store=null,this.stopUpdates=null,this.client=null,this.hello=null,this.retry=()=>{this.target?.sessionKey&&this.store?.load(this.target).catch(()=>void 0)},this.refresh=e=>{this.connected&&(this.synchronize(),this.target&&this.store?.refresh(this.target,e))},this.dismiss=e=>this.target?this.store?.dismiss(this.target,e)??Promise.resolve(!1):Promise.resolve(!1),this.handleStoreUpdate=()=>{let e=this.presentation,t=this.readPresentation();this.presentation=t,t&&(!e||t.card!==e.card||t.error!==e.error||t.refreshState!==e.refreshState||t.client!==e.client||t.hello!==e.hello||t.phase!==e.phase)&&this.host.requestUpdate()},e.addController(this)}get card(){return this.target?this.store?.get(this.target)??null:null}get lifetime(){return this.target?this.store?.getLifetime(this.target):void 0}get loading(){return!this.target||this.store?.get(this.target)===void 0}get error(){return this.target?this.store?.getError(this.target):void 0}get refreshState(){return this.target?this.store?.getRefreshState(this.target):void 0}hostConnected(){this.connected=!0,this.synchronize()}hostUpdate(){this.connected&&this.synchronize()}hostDisconnected(){this.connected=!1,this.release()}readPresentation(){let e=this.options.gateway()?.snapshot;return this.target?{card:this.store?.get(this.target),error:this.error,refreshState:this.refreshState,client:e?.client,hello:e?.hello,phase:e?.phase}:void 0}synchronize(){let e=this.options.gateway()??null,t=this.options.target()??void 0,n=e?.snapshot.client??null,r=e?.snapshot.hello??null,i=e?pn(e):null;i!==this.store&&(this.release(),this.store=i,this.stopUpdates=i?.subscribe(this.handleStoreUpdate)??null),(t?.sessionKey!==this.target?.sessionKey||t?.agentId!==this.target?.agentId||t&&(n!==this.client||r!==this.hello))&&(this.target=t,this.client=n,this.hello=r,this.store?.watch(this,t?[t]:[],{admitAutomaticRead:()=>{let i=this.options.target();return this.connected&&this.options.gateway()===e&&e?.snapshot.client===n&&e?.snapshot.hello===r&&i?.sessionKey===t?.sessionKey&&i?.agentId===t?.agentId}}),this.presentation=this.readPresentation())}release(){this.store?.unwatch(this),this.stopUpdates?.(),this.stopUpdates=null,this.store=null,this.target=void 0,this.client=null,this.hello=null,this.presentation=void 0}}})))()}function di(e){let t=e.busy||e.disabled===!0;return w`
    <form class="mcp-server-form" @submit=${t=>{t.preventDefault();let n=t.currentTarget,r=new FormData(n),i=r.get(`mcp-name`),a=r.get(`mcp-transport`),o=r.get(`mcp-target`);e.onSubmit({name:typeof i==`string`?i.trim():``,transport:a===`sse`||a===`stdio`?a:`streamable-http`,target:typeof o==`string`?o.trim():``})}}>
      <label>
        <span>${y(`mcpServers.nameLabel`)}</span>
        <input
          name="mcp-name"
          class="settings-input"
          type="text"
          required
          placeholder="context7"
          autocomplete="off"
          ?autofocus=${e.autofocus??!1}
          title=${e.blockedReason??``}
          ?disabled=${t}
        />
      </label>
      <label>
        <span>${y(`mcpServers.transportLabel`)}</span>
        <select
          name="mcp-transport"
          class="settings-select"
          title=${e.blockedReason??``}
          ?disabled=${t}
        >
          <option value="streamable-http">${y(`mcpServers.transportStreamableHttp`)}</option>
          <option value="sse">${y(`mcpServers.transportSse`)}</option>
          <option value="stdio">${y(`mcpServers.transportStdio`)}</option>
        </select>
      </label>
      <label class="mcp-server-form__target">
        <span>${y(`mcpServers.targetLabel`)}</span>
        <input
          name="mcp-target"
          class="settings-input"
          type="text"
          required
          placeholder="https://mcp.example.com/mcp  ·  npx some-mcp-server"
          autocomplete="off"
          title=${e.blockedReason??``}
          ?disabled=${t}
        />
      </label>
      <div class="mcp-server-form__actions">
        <button
          type="submit"
          class="btn btn--sm"
          title=${e.blockedReason??``}
          ?disabled=${t}
        >
          ${e.busy?y(`mcpServers.adding`):y(`mcpServers.add`)}
        </button>
        <button type="button" class="btn btn--sm" ?disabled=${e.busy} @click=${e.onCancel}>
          ${y(`common.cancel`)}
        </button>
      </div>
    </form>
  `}function fi(){return(fi=e((()=>{D(),f(),Xe(),Ke()})))()}async function pi(e,t){switch(t.kind){case`device-pairing`:{let t=e.gateway.snapshot;return t.phase!==`connected`||!ye(t).canAdmin?!1:e.overlays.openDevicePairSetup()}default:return t.kind,!1}}function mi(){return(mi=e((()=>{Ae()})))()}function hi(e){let t=Ve(e??``);return t?w`<span
        class="session-color-dot"
        style=${`--session-color: var(--session-color-${t})`}
        role="img"
        aria-label=${y(`sessionsView.sessionColor`,{color:y(`sessionsView.colors.${t}`)})}
      ></span>`:C}function gi(){return(gi=e((()=>{D(),Be(),f()})))()}var q;function _i(){return(_i=e((()=>{D(),O(),yn(),u(),x(),q=class extends t{constructor(...e){super(...e),this.routeUrl=null,this.authTokens=[],this.authReady=!1,this.undecodableRouteUrl=null,this.loader=new bn(this,{retryUnavailable:!0})}render(){return this.loader.withActiveRoutes(()=>this.renderContent())}renderContent(){let e=this.routeUrl,t=e&&this.authReady&&this.undecodableRouteUrl!==e?this.loader.resolve(e,this.authTokens,this.connectionId):null;return t?w`<img
      class="workspace-icon"
      src=${t}
      alt=""
      aria-hidden="true"
      decoding="async"
      @error=${()=>{this.undecodableRouteUrl=e}}
    />`:w`<span class="workspace-icon-fallback" aria-hidden="true">${S.folder}</span>`}},j([k({attribute:!1})],q.prototype,`routeUrl`,void 0),j([k({attribute:!1})],q.prototype,`authTokens`,void 0),j([k({attribute:!1})],q.prototype,`authReady`,void 0),j([k({attribute:!1})],q.prototype,`connectionId`,void 0),j([A()],q.prototype,`undecodableRouteUrl`,void 0),customElements.get(`zero-workspace-icon`)||customElements.define(`zero-workspace-icon`,q)})))()}function vi(e){let t=e.getRootNode();return t instanceof ShadowRoot?t.activeElement??document.activeElement:document.activeElement}function yi(e){e instanceof HTMLElement&&e.isConnected&&e.focus()}function bi(e,t){try{e.dispose()}catch{}finally{t.remove()}}async function xi(e,t,n,r){if(r.aborted)return!1;let i=e.controller,a=e.host,o=vi(a),s=a.contains(o),c=a.cloneNode();c.style.display=`block`,c.style.visibility=`hidden`,c.inert=!0,a.before(c);let l,u=()=>{c.contains(vi(c))&&yi(o),l?bi(l,c):c.remove()};try{if(l=await t(c,{readOnly:!0}),r.aborted||(n&&l.write(Si.encode(n)),await new Promise(e=>{setTimeout(e,0)}),r.aborted))return u(),!1}catch(e){throw u(),e}let d=vi(a),f=null;return a.contains(d)?f=c:c.contains(d)&&(f=s?c:o),c.inert=!1,l.setReadOnly(i.readOnly),c.style.display=a.style.display,c.style.visibility=a.style.visibility,e.controller=l,e.host=c,bi(i,a),yi(f),!0}var Si;function Ci(){return(Ci=e((()=>{Si=new TextEncoder})))()}function J(e){return typeof e==`string`&&e.length>0}function wi(e){return pt(e)&&J(e.catalogId)&&J(e.hostId)&&J(e.threadId)?{catalogId:e.catalogId,hostId:e.hostId,threadId:e.threadId,...J(e.sourceHomeId)?{sourceHomeId:e.sourceHomeId}:{}}:null}function Ti(e){if(!pt(e))return null;if(e.kind===`attach`)return J(e.sessionId)&&typeof e.agentOwned==`boolean`?{kind:`attach`,sessionId:e.sessionId,agentOwned:e.agentOwned}:null;let t=e.agentId;if(t!==null&&!J(t))return null;if(e.kind===`restore`||e.kind===`open`)return{kind:e.kind,agentId:t};if(e.kind===`catalog`){let n=wi(e.catalog);return n?{kind:`catalog`,agentId:t,catalog:n}:null}return null}function Ei(e){try{let t=globalThis.sessionStorage?.getItem(e),n=t?JSON.parse(t):null;return Array.isArray(n)?n:[]}catch{return[]}}function Di(e=``){return Ei(ji+e).filter(J)}function Oi(e,t=``){try{globalThis.sessionStorage?.setItem(ji+t,JSON.stringify(e))}catch{}}function ki(){return Ei(Mi).flatMap(e=>Ti(e)??[])}function Ai(e){try{if(e.length===0){globalThis.sessionStorage?.removeItem(Mi);return}globalThis.sessionStorage?.setItem(Mi,JSON.stringify(e))}catch{}}var ji,Mi;function Ni(){return(Ni=e((()=>{ji=`zero.terminal.sessions.v1`,Mi=`zero.terminal.actions.v1`})))()}function Pi(e,t){let n=e instanceof CustomEvent&&typeof e.detail==`object`&&e.detail!==null?e.detail:null;if(!n||n.open===!1)return null;let r=n.agentId?.trim()||t;return n.newSession===!0?{kind:`open`,agentId:r}:n.terminalSessionId?{kind:`attach`,sessionId:n.terminalSessionId,agentOwned:n.agentOwned??!0}:n.open===!0?{kind:`restore`,agentId:r}:null}var Fi,Ii;function Li(){return(Li=e((()=>{Ci(),Ni(),lt(),Fi=class{constructor(e=!0){this.persistent=e,this.actions=[],this.refreshPending=!1,this.refreshTimedOut=!1,this.refreshTimer=null,this.drainScheduled=!1,this.hosts=[],this.fenceHost=null,this.fenceGeneration=0,this.timeoutHost=null,this.rehydrate()}rehydrate(){if(!this.persistent||this.actions.some(e=>e.kind===`handoff`))return;let e=ki(),t=e.some(e=>e.kind!==`restore`)?e.filter(e=>e.kind!==`restore`):e;this.actions=t,t.length!==e.length&&this.persist()}persist(){this.persistent&&Ai(this.actions.flatMap(e=>{if(e.kind!==`handoff`)return[e];let t=e.tab;return t.status===`exited`?[]:[{kind:`attach`,sessionId:t.gatewaySessionId,agentOwned:t.agentOwned??!1}]}))}get host(){return this.hosts.at(-1)??null}bindHost(e){this.hosts.length===0&&this.rehydrate(),this.hosts=[...this.hosts.filter(t=>t!==e),e],this.drain()}releaseHost(e){this.hosts=this.hosts.filter(t=>t!==e),this.fenceHost===e&&this.resetLifecycle(e),this.hosts.length===0&&(this.clearRefreshTimer(),this.refreshTimedOut=!1,this.timeoutHost=null,this.rehydrate())}get hasActions(){return this.actions.length>0}get fenced(){return this.refreshPending}get waitingForRefresh(){return this.refreshPending&&!this.refreshTimedOut&&this.actions.length>0}refreshBeforeReconnect(e,t,n){let r=e.currentGeneration();this.beginRefreshFence(e,r),n?.();let i=()=>{r===e.currentGeneration()&&t()&&this.releaseRefreshFence(e)};ut(async()=>{let{refreshControlUiServiceWorker:e}=await import(`./control-ui-boot-shared-ZuP0LiFD.js`).then(e=>(e.ca(),e.la));return{refreshControlUiServiceWorker:e}},__vite__mapDeps([1,2,3,4,5,6,7,8,9,11,12,13,14]),import.meta.url).then(({refreshControlUiServiceWorker:e})=>e()).then(e=>{e||i()},i)}beginRefreshFence(e,t){this.refreshPending=!0,this.fenceHost=e,this.fenceGeneration=t,this.clearRefreshFailure(),this.clearRefreshTimer(),this.armRefreshTimer()}releaseRefreshFence(e){this.fenceHost===e&&(this.resetLifecycle(e),this.drain())}resetLifecycle(e){(this.fenceHost===null||this.fenceHost===e)&&(this.clearRefreshTimer(),this.refreshPending=!1,this.fenceHost=null,this.clearRefreshFailure())}canHandoff(e){return!e.booting&&!this.fenced&&!this.hasActions&&!e.tabs.some(e=>e.status===`connecting`)}queueHandoff(e,t){let n=e.tabs.toSorted((t,n)=>Number(t.id===e.activeId)-Number(n.id===e.activeId));return this.discardRestoreActions(),this.actions.push(...n.map((r,i)=>({kind:`handoff`,tab:r,client:t,error:i===n.length-1?e.error:null}))),this.persist(),e.tabs.filter(e=>e.status!==`exited`)}async queue(e,t={}){let n=e.kind!==`restore`&&this.discardRestoreActions(),r=this.actions.some(e=>e.kind!==`restore`),i=JSON.stringify(e);if(!(e.kind===`restore`&&r)&&!this.actions.some(e=>e.kind!==`handoff`&&JSON.stringify(e)===i)&&(this.actions.push(e),n=!0),n&&this.persist(),t.deferUntilHostChange)return;this.armRefreshTimer();let a=this.host;this.refreshPending?a?.requestUpdate():a&&!a.hasTabs()&&a.setBooting(!0),await this.drain()}async drain(){let e=this.host;if(!this.drainScheduled&&this.actions.length!==0&&e&&this.canRun(e)){this.drainScheduled=!0;try{await e.bootQueue.enqueue(async t=>{let n=this.actions[0];if(!n||!t()||!this.canRun(e))return;let r=await this.execute(e,n,()=>this.retireAction(n));r&&t()&&(this.retireAction(n),r===`cancelled-restore`&&this.host===e&&e.cancelledRestoreCompleted())})}finally{this.drainScheduled=!1;let e=this.host;e?.requestUpdate(),this.actions.length>0&&e&&this.canRun(e)?this.drain():this.actions.length===0&&e&&!e.hasTabs()&&e.setBooting(!1)}}}retireAction(e){let t=this.actions.indexOf(e);t!==-1&&(this.actions.splice(t,1),this.persist())}discardRestoreActions(){let e=this.actions.length;return this.actions=this.actions.filter(e=>e.kind!==`restore`),e!==this.actions.length}cancel(e){if(this.host===e){for(let e of this.actions.splice(0))e.kind===`handoff`&&e.tab.status===`exited`&&bi(e.tab.controller,e.tab.host);this.persist(),e.setBooting(!1),this.clearRefreshFailure()}}canRun(e){return!this.refreshPending&&e.canRun()}async execute(e,t,n){if(t.kind===`handoff`){let{tab:r,client:i,error:a}=t;if(i!==e.client())return r.status===`exited`&&bi(r.controller,r.host),!0;let o=e.currentGeneration();if(r.status===`exited`)this.retireAction(t),e.present(r);else if(!await e.attach(r.gatewaySessionId,r.agentOwned??!1,n))return!1;return a&&this.canRun(e)&&o===e.currentGeneration()&&e.showError(a.text),!0}if(t.kind===`attach`)return e.attach(t.sessionId,t.agentOwned,n);if(t.kind===`open`)return e.open(void 0,t.agentId,n);let r=await e.reattach(t.kind===`restore`?n:void 0);return this.canRun(e)?t.kind===`catalog`?e.open(t.catalog,t.agentId,n):r?`cancelled-restore`:e.ensureInitial(t.agentId,n):!1}clearRefreshTimer(){this.refreshTimer!==null&&(globalThis.clearTimeout(this.refreshTimer),this.refreshTimer=null)}clearRefreshFailure(){this.refreshTimedOut&&=(this.timeoutHost?.clearTimeout(),this.timeoutHost=null,!1)}armRefreshTimer(){let e=this.fenceHost;if(!this.refreshPending||!e||this.refreshTimer!==null||this.actions.length===0)return;let t=this.fenceGeneration;this.refreshTimer=globalThis.setTimeout(()=>{this.refreshTimer=null,this.fenceHost===e&&t===e.currentGeneration()&&this.refreshPending&&this.actions.length!==0&&(this.refreshTimedOut=!0,this.timeoutHost=e,e.showTimeout(),e.setBooting(!1))},e.timeoutMs())}},Ii=new Fi})))()}var Y;function Ri(){return(Ri=e((()=>{st(),D(),O(),ue(),xe(),f(),Ze(),v(),gn(),u(),s(),x(),We(),Y=class extends g{constructor(...e){super(...e),this.sessionKey=``,this.agentId=``,this.error=null,this.pending=new Set,this.subscriptions=new a(this).watch(()=>this.context?.gateway,(e,t)=>{let n=new Map,r=e.subscribe(t),i=e.subscribeEvents(t=>{if(t.event!==`mcp.app.hostContextChanged`)return;let r=t.payload;if(!r||typeof r!=`object`||!(`viewId`in r)||typeof r.viewId!=`string`)return;let i=e.snapshot.client,a=dn(i,this.sessionKey,this.agentId).find(e=>e.viewId===r.viewId);if(!i||!a)return;if(`modelContext`in r&&r.modelContext===null){if(!(`updateId`in r)||r.updateId!==a.state?.updateId)return;n.set(a.viewId,(n.get(a.viewId)??0)+1),hn(i,{...a,state:null});return}let o=(n.get(a.viewId)??0)+1;n.set(a.viewId,o);let s=t=>{this.isConnected&&e.snapshot.client===i&&n.get(a.viewId)===o&&hn(i,{...a,state:t})};i.request(`mcp.app.modelContext`,{sessionKey:a.sessionKey,agentId:a.agentId,viewId:a.viewId}).then(e=>s(e.state)).catch(()=>s(null))});return()=>{r(),i(),n.clear()}}).watch(()=>this.context?.gateway.snapshot.client,(e,t)=>sn(e,t))}async removeItem(e,t){let n=this.context,r=n?.gateway.snapshot.client,i=e.state;if(!n||!r||!i||n.gateway.snapshot.phase!==`connected`)return;let a=Oe(n.gateway).key,o=this.sessionKey;this.pending=new Set([...this.pending,e.viewId]),this.error=null;try{let s=await r.request(`mcp.app.removeModelContext`,{sessionKey:e.sessionKey,agentId:e.agentId,viewId:e.viewId,updateId:i.updateId,...t===void 0?{}:{index:t}});this.isConnected&&n.gateway.snapshot.client===r&&Oe(n.gateway).key===a&&o===this.sessionKey&&dn(r,o,this.agentId).find(t=>t.viewId===e.viewId)?.state?.updateId===i.updateId&&hn(r,{...e,state:s.state})}catch(e){this.isConnected&&n.gateway.snapshot.client===r&&o===this.sessionKey&&(this.error=ae(e))}finally{this.pending=new Set([...this.pending].filter(t=>t!==e.viewId))}}disconnectedCallback(){this.subscriptions.clear(),super.disconnectedCallback()}render(){let e=dn(this.context?.gateway.snapshot.client??null,this.sessionKey,this.agentId);return e.length?w`<section class="mcp-app-context" aria-label=${y(`mcpApp.contextTitle`)}>
      <div class="mcp-app-context__header" title=${y(`mcpApp.contextDescription`)}>
        ${S.puzzle} ${y(`mcpApp.contextTitle`)}
      </div>
      ${e.map(e=>w`<div class="mcp-app-context__items">
            ${(e.state?.content??[]).map((t,n)=>{let r=t.type===`image`?`mcpApp.imageContent`:t.type===`text`?`mcpApp.textContent`:`mcpApp.resourceContent`,i=un(t,`${e.title} · ${y(r)}`),a=on(t);return w`<div class="mcp-app-context__item">
                ${a?w`<img src=${a} alt=${i} referrerpolicy="no-referrer" loading="lazy" />`:S.fileText}<span
                  class="mcp-app-context__label"
                  title=${i}
                  >${i}</span
                ><button
                  type="button"
                  ?disabled=${this.pending.has(e.viewId)}
                  aria-label=${y(`mcpApp.removeContext`,{title:i})}
                  @click=${()=>void this.removeItem(e,n)}
                >
                  ${S.x}
                </button>
              </div>`})}${e.state?.structuredContent?w`<div class="mcp-app-context__item"><span>${e.title}</span><button type="button" ?disabled=${this.pending.has(e.viewId)} aria-label=${y(`mcpApp.removeContext`,{title:e.title})} @click=${()=>void this.removeItem(e)}>${S.x}</button></div>`:C}
          </div>`)}
      ${this.error?w`<p role="alert">${this.error}</p>`:C}
    </section>`:C}},j([ot({context:Te,subscribe:!0})],Y.prototype,`context`,void 0),j([k({attribute:!1})],Y.prototype,`sessionKey`,void 0),j([k({attribute:!1})],Y.prototype,`agentId`,void 0),j([A()],Y.prototype,`error`,void 0),j([A()],Y.prototype,`pending`,void 0),customElements.get(`zero-mcp-app-context-strip`)||customElements.define(`zero-mcp-app-context-strip`,Y)})))()}function zi(e,t){let n=e??Bi;switch(t.type){case`mount`:return{...Bi,open:t.manualOpen===void 0?t.open:!!t.manualOpen,manualOpen:t.manualOpen,readingHistory:t.readingHistory};case`history`:return{...n,readingHistory:t.readingHistory,gestures:t.readingHistory?n.gestures:0,distancePx:t.readingHistory?n.distancePx:0};case`gesture`:return{...n,gestures:n.gestures+1,distancePx:n.distancePx+t.distancePx};case`settle`:{if(!n.readingHistory)return{...n,gestures:0,distancePx:0};let e=n.manualReopens>0;return!n.open||n.manualOpen===!1||n.manualReopens>=X.pinnedAfterReopens||n.gestures<(e?X.reopenedGestures:X.gestures)||n.distancePx<(e?X.reopenedDistancePx:X.distancePx)?n:{...n,open:!1,manualOpen:void 0,gestures:0,distancePx:0}}case`takeover`:return{...n,gestures:0,distancePx:0};case`extent`:case`click`:{let e=t.type===`click`?t.open:t.extent>0,r=t.type===`click`?t.open:t.extent!==0&&t.extent;return{...n,open:e,manualOpen:r,manualReopens:n.manualReopens+Number(!n.open&&e),gestures:0,distancePx:0}}case`clamp`:return typeof n.manualOpen==`number`&&n.manualOpen>t.limit?{...n,manualOpen:t.limit,open:t.limit>0}:n}return t}var X,Bi;function Vi(){return(Vi=e((()=>{X={gestures:2,distancePx:320,reopenedGestures:3,reopenedDistancePx:640,pinnedAfterReopens:2,gesturePauseMs:200,touchGesturePx:24,scrollSettleMs:300},Bi={open:!1,manualOpen:void 0,manualReopens:0,readingHistory:!1,gestures:0,distancePx:0}})))()}var Hi,Ui,Wi,Gi;function Ki(){return(Ki=e((()=>{D(),Re(),E(),ke(),Wt(),Vi(),Hi=new WeakMap,Ui=class{constructor(e,t){this.element=e,this.transcript=null,this.disposed=!1,this.scrollSettled=!1,this.suppressClick=!1,this.touching=!1,this.scrolling=!1,this.scheduleCollapse=()=>{clearTimeout(this.settleTimer),this.scrollSettled=!1,this.settleTimer=setTimeout(()=>{this.settleTimer=void 0,this.scrollSettled=!0,this.settleDisclosure()},X.scrollSettleMs)},this.handleTranscriptScroll=e=>{if(e.type!==`input`&&e.type!==`offset`)return;if(this.touching=e.touching,e.type===`offset`){this.scrolling=e.scrolling,e.programmatic&&this.gesture?.distancePx===0&&(this.gesture=void 0),!e.programmatic&&e.delta!==0&&(this.gesture&&(this.gesture.distancePx+=Math.max(0,-e.delta)),this.scheduleCollapse()),!this.scrolling&&this.scrollSettled&&this.settleDisclosure();return}let{event:t}=e;if(t instanceof WheelEvent){if(t.ctrlKey)return;let e=performance.now();(this.gesture?.kind!==`wheel`||this.lastWheelAt===void 0||e-this.lastWheelAt>X.gesturePauseMs)&&(this.flushGesture(),this.scrollSettled=!1,this.gesture={kind:`wheel`,valid:!0,distancePx:0}),this.lastWheelAt=e,this.scheduleCollapse()}else typeof TouchEvent<`u`&&t instanceof TouchEvent?(t.type===`touchstart`&&t.touches.length===1&&(this.flushGesture(),this.scrollSettled=!1,this.gesture={kind:`touch`,valid:!0,distancePx:0}),this.gesture?.kind===`touch`&&(t.touches.length>1||t.type===`touchcancel`||t.type===`touchend`&&t.touches.length>0)&&(this.gesture.valid=!1),!this.touching&&this.scrollSettled&&this.settleDisclosure()):this.flushGesture()},this.clampExtent=()=>{typeof this.state.manualOpen==`number`&&this.state.manualOpen>this.limit()&&(this.dispatch({type:`clamp`,limit:this.limit()}),this.cancelDrag()),this.apply()},this.click=e=>{if(e.defaultPrevented||this.isControl(e)||!(e.target instanceof Element)||e.target.closest(`summary`)?.parentElement!==this.element)return;if(e.preventDefault(),this.suppressClick&&e.detail!==0){this.suppressClick=!1;return}this.cancelDrag();let t=this.chosen(),n=typeof t==`boolean`&&this.element.open||typeof t==`number`&&t>0&&(t>=this.limit()||!!(this.body&&this.body.clientHeight>0&&this.body.scrollHeight<=this.body.clientHeight+1));this.resetScrollInput(),this.dispatch({type:`click`,open:!n}),this.apply()},this.wheel=e=>{if(e.defaultPrevented||this.isControl(e)||this.drag||e.ctrlKey||e.metaKey||e.shiftKey||!Number.isFinite(e.deltaY)||!Number.isFinite(e.deltaX)||!e.deltaY||Math.abs(e.deltaX)>=Math.abs(e.deltaY))return;let t=e.deltaMode===WheelEvent.DOM_DELTA_LINE?Number.parseFloat(getComputedStyle(this.summary).lineHeight)||18:e.deltaMode===WheelEvent.DOM_DELTA_PAGE?this.limit():1,n=this.extent()-e.deltaY*t;e.preventDefault(),this.move(n)},this.pointerDown=e=>{!e.isPrimary||e.button!==0||this.isControl(e)||e.defaultPrevented||(this.suppressClick=!1,this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,extent:this.extent(),active:!1},this.summary?.setPointerCapture(e.pointerId))},this.pointerMove=e=>{let t=this.drag;if(!t||t.id!==e.pointerId)return;let n=e.clientX-t.x,r=e.clientY-t.y;if(!t.active){if(Math.max(Math.abs(n),Math.abs(r))<3)return;if(Math.abs(n)>=Math.abs(r)){this.cancelDrag();return}this.takeover(),t.active=!0,this.suppressClick=!0}e.preventDefault();let i=t.extent-r;this.move(i),(i<0||i>this.limit())&&(t.extent=this.extent(),t.y=e.clientY)},this.otherPointer=e=>{this.drag&&e.pointerId!==this.drag.id&&this.cancelDrag()},this.pointerEnd=e=>{e.pointerId===this.drag?.id&&this.cancelDrag()},this.cancelDrag=()=>{let e=this.drag;this.drag=void 0,e&&this.summary?.hasPointerCapture(e.id)&&this.summary.releasePointerCapture(e.id)},this.sessionKey=t[0],this.gatewayScope=t[2]?.gatewayScope,this.cardLifetime=t[2]?.cardLifetime,this.state=this.mount(t),this.element.addEventListener(`click`,this.click)}mount([,e,t]){return this.resetScrollInput(),this.cancelDrag(),this.rememberedChoice=this.cardLifetime?Hi.get(this.cardLifetime):void 0,zi(void 0,{type:`mount`,open:e&&!_e(),manualOpen:this.rememberedChoice?.choice,readingHistory:t?.readingHistory===!0})}update(e){let[t,,n]=e;this.lifecycle=n,(t!==this.sessionKey||n?.gatewayScope!==this.gatewayScope||n?.cardLifetime!==this.cardLifetime)&&(this.sessionKey=t,this.gatewayScope=n?.gatewayScope,this.cardLifetime=n?.cardLifetime,this.state=this.mount(e));let r=n?.readingHistory===!0;r!==this.state.readingHistory&&(r||this.resetScrollInput(),this.dispatch({type:`history`,readingHistory:r})),n?.presented===!1&&(this.takeover(),this.disconnectHeader()),this.connectHeader(),this.apply(),queueMicrotask(()=>{this.disposed||(this.connectHeader(),this.connectTranscript(),this.apply())})}dispatch(e){let t=this.state;if(this.state=zi(t,e),!this.cardLifetime)return;let n=e.type===`click`||e.type===`extent`||e.type===`clamp`,r=e.type===`settle`&&t.open&&!this.state.open;(n||r&&Hi.get(this.cardLifetime)===this.rememberedChoice)&&(this.rememberedChoice={choice:this.state.manualOpen??this.state.open},Hi.set(this.cardLifetime,this.rememberedChoice))}resetScrollInput(){clearTimeout(this.settleTimer),this.settleTimer=void 0,this.scrollSettled=!1,this.lastWheelAt=void 0,this.gesture=void 0,this.touching=!1,this.scrolling=!1}flushGesture(){let e=this.gesture;this.gesture=void 0,e?.valid&&e.distancePx>0&&(e.kind===`wheel`||e.distancePx>X.touchGesturePx)&&this.dispatch({type:`gesture`,distancePx:e.distancePx})}settleDisclosure(){this.touching||this.scrolling||((!this.gesture?.valid||this.gesture.distancePx>0)&&this.flushGesture(),this.state.distancePx>0&&(this.dispatch({type:`settle`}),this.apply()))}connectTranscript(){if(this.disposed)return;let e=this.lifecycle?.presented===!1?null:this.element.closest(`.chat-main`)?.querySelector(`.chat-thread`)??null;e!==this.transcript&&(this.resetScrollInput(),this.unsubscribeTranscript?.(),this.transcript=e,this.unsubscribeTranscript=e?qt(e,this.handleTranscriptScroll):void 0)}connectHeader(){if(this.disposed||this.lifecycle?.presented===!1||(this.summary??=this.element.querySelector(`summary`)??void 0,this.body??=this.element.querySelector(`.session-progress-card__body`)??void 0,!this.summary||this.listeners))return;this.listeners=new AbortController;let e=this.listeners.signal;this.summary.addEventListener(`wheel`,this.wheel,{passive:!1,signal:e}),this.summary.addEventListener(`pointerdown`,this.pointerDown,{signal:e}),this.summary.addEventListener(`pointermove`,this.pointerMove,{signal:e}),this.summary.addEventListener(`pointerup`,this.pointerEnd,{signal:e}),this.summary.addEventListener(`pointercancel`,this.pointerEnd,{signal:e}),this.summary.addEventListener(`lostpointercapture`,this.pointerEnd,{signal:e}),this.summary.ownerDocument.addEventListener(`pointerdown`,this.otherPointer,{capture:!0,signal:e}),this.summary.ownerDocument.defaultView?.addEventListener(`blur`,this.cancelDrag,{signal:e}),this.summary.ownerDocument.defaultView?.addEventListener(`resize`,this.clampExtent,{signal:e}),typeof ResizeObserver<`u`&&this.body&&(this.resizeObserver=new ResizeObserver(this.clampExtent),this.resizeObserver.observe(this.body))}disconnectHeader(){this.cancelDrag(),this.listeners?.abort(),this.listeners=void 0,this.resizeObserver?.disconnect(),this.resizeObserver=void 0}chosen(){return this.state.manualOpen??this.state.open}limit(){return this.body&&Number.parseFloat(getComputedStyle(this.body).maxHeight)||300}extent(){let e=this.chosen();return typeof e==`number`?Math.min(e,this.limit()):e?this.body?.getBoundingClientRect().height??0:0}apply(){this.body??=this.element.querySelector(`.session-progress-card__body`)??void 0;let e=this.chosen(),t=typeof e==`number`,n=t?Math.min(e,this.limit()):0;this.element.open=t?n>0:e,this.body&&(this.body.style.height=t?n+`px`:``,this.body.style.minHeight=t?n+`px`:``),this.element.dataset.reveal=t?`partial`:e?`open`:`closed`}isControl(e){return e.target instanceof Element&&!!e.target.closest(`button, a, input, select, textarea`)}move(e){this.takeover(),this.dispatch({type:`extent`,extent:Math.max(0,Math.min(this.limit(),e))}),this.lifecycle?.onManipulate?.(),this.apply()}takeover(){this.resetScrollInput(),this.dispatch({type:`takeover`})}dispose(){this.disposed=!0,this.unsubscribeTranscript?.(),this.unsubscribeTranscript=void 0,this.element.removeEventListener(`click`,this.click),this.disconnectHeader(),this.resetScrollInput()}},Wi=class extends je{render(...e){return C}update(e,t){return e.element instanceof HTMLDetailsElement&&(this.element=e.element,this.input=t,this.isConnected&&this.reconnected()),C}disconnected(){this.controller?.dispose(),this.controller=void 0}reconnected(){this.element&&this.input&&(this.controller??=new Ui(this.element,this.input),this.controller.update(this.input))}},Gi=T(Wi)})))()}function qi(e,t){if(!t)return C;let n=t.state===`pending`,r=t.state===`failed`||t.state===`timeout`,i=y(n?`sessionProgressCard.refresh.pending`:r?`sessionProgressCard.refresh.retry`:`sessionProgressCard.refresh.label`);return w`<button
    class="session-progress-card__refresh"
    type="button"
    data-state=${t.state??`idle`}
    aria-label=${i}
    title=${r&&t.state?y(oa[t.state]):i}
    aria-busy=${String(n)}
    ?disabled=${n}
    @click=${r=>{r.preventDefault(),r.stopPropagation(),n||t.onRefresh(e)}}
  >
    ${n?S.loader:t.state===`updated`?S.check:S.refresh}
  </button>`}function Ji(e){if(e.length>ca)return jt(e,{progressBars:!0});let t=`${c.getLocale()}\0${e}`,n=Z.get(t);if(n!==void 0)return Z.delete(t),Z.set(t,n),n;let r=jt(e,{progressBars:!0});return Z.set(t,r),it(Z,sa),r}function Yi(e){let t=e.steps;return t?.length?{completed:t.filter(e=>e.status===`completed`).length,total:t.length}:null}function Xi(e){return e.find(e=>e.status===`in_progress`)??e.find(e=>e.status===`pending`)}function Zi(e,t){let n=ct(t),r=ct(e.updatedAt);return n!==void 0&&r!==void 0&&r<n}function Qi(e,t,n,r=!0){let i=e?Zi(e,n):!1;if(t&&Q[t]&&!i)return null;let a=e?Yi(e):null;if(!a||!e?.steps)return null;let o=Xi(e.steps);if(!o)return null;let s=o.status===`in_progress`&&(i||!r)?`paused`:o.status;return{...a,status:s,step:o.step}}function $i(e){return Xi(e)??e.findLast(e=>e.status===`completed`)}function ea(e,t){let n=t&&Q[t];if(e===`in_progress`&&n)return n===`completed`?S.check:S.circleX;switch(e){case`completed`:return S.check;case`in_progress`:return w`<span class="session-run-spinner"></span>`;case`paused`:case`pending`:return S.clock}return e}function ta(e){let t=document.createElement(`template`);t.innerHTML=e;let n=t.content.querySelector(`progress`);if(!n)return e;let r=n.getAttribute(`value`)?.trim(),i=n.getAttribute(`max`)?.trim(),a=n.getAttribute(`aria-label`)?.trim()||(r&&i?`${y(`sessionProgressCard.title`)} · ${r}/${i}`:y(`sessionProgressCard.title`));n.setAttribute(`aria-label`,a);let o=n.parentElement,s=document.createElement(`div`);s.className=`session-progress-card__progress`;let c=document.createElement(`span`);return c.className=`session-progress-card__progress-label`,c.textContent=a,s.append(c,n),o?.tagName===`P`&&o.children.length===0&&!o.textContent?.trim()&&o.remove(),t.content.prepend(s),t.innerHTML}function na(e,t={}){if(!e)return C;let n=Ji(e);return w`<div class="session-progress-card__markdown sidebar-markdown">
    ${gt(t.promoteProgress?ta(n):n)}
  </div>`}function ra(e,t,n){let r=e.steps;return r?.length?w`<ol class="session-progress-card__steps">
    ${r.map(e=>{let r=e.status===`in_progress`&&n?Q[n]:void 0,i=e.status===`in_progress`&&!t&&!r?`paused`:e.status,a=y(r?`sessionProgressCard.status.${r}`:i===`paused`?`sessionProgressCard.status.paused`:la[i]);return w`<li
        class="session-progress-card__step session-progress-card__step--${i}"
        aria-label=${y(`sessionProgressCard.stepLabel`,{status:a,step:e.step})}
      >
        <span
          class="session-progress-card__step-marker"
          data-status=${i}
          data-outcome=${r?n:C}
          aria-hidden="true"
          >${ea(i,n)}</span
        >
        <span class="session-progress-card__step-text">${e.step}</span>
      </li>`})}
  </ol>`:C}function ia(e,t,n){if(!n)return C;let r=y(t===`dismiss`?`sessionProgressCard.dismiss`:`sessionProgressCard.clearSaved`);return w`<button
    class="rail-header__action session-progress-card__${t}"
    type="button"
    aria-label=${r}
    title=${r}
    @click=${t=>{t.preventDefault(),t.stopPropagation(),n(e)}}
  >
    ${t===`dismiss`?S.x:S.trash}
  </button>`}function aa(e,t,n,r,i,a,o=!0,s=!1,c,l,u){if(!e)return C;let d=Yi(e),f=d?y(`sessionProgressCard.countLabel`,{completed:String(d.completed),total:String(d.total)}):y(`sessionProgressCard.noteLabel`),p=ct(i),m=ct(a),h=ct(e.updatedAt),ee=p!==void 0&&m!==void 0&&m>=p&&h!==void 0&&h>=p&&h<=m,te=o&&!Zi(e,i)&&(h===void 0||r!==`queued`&&(p!==void 0||r===void 0)),g=r&&Q[r]&&ee?m:void 0,_=r&&Q[r]&&!g?void 0:r,ne=g??h??Date.now(),re=g?`sessionProgressCard.activity.${Q[r]}`:`sessionProgressCard.activity.updated`,ie=da(ne,re),v=ia(e,`dismiss`,n),ae=ia(e,`clear-saved`,u);if(t===`composer`){let t=e.steps??[],n=$i(t),r=Math.max(1,n?t.indexOf(n)+1:0),i=t.length>0&&t.every(e=>e.status===`completed`),a=n?.step??y(`sessionProgressCard.noteLabel`),o=_?Q[_]:void 0,u=o?y(`sessionProgressCard.outcome.${o}`):null,p=`${a}. ${u??f}`,m=d?y(`sessionProgressCard.shortCount`,{completed:String(r),total:String(d.total)}):C,h=n?.status===`in_progress`&&!te&&!o?`paused`:n?.status,ee=o?o===`completed`?S.check:S.circleX:i?S.check:n?.status===`in_progress`?ea(h??`pending`):S.clock;return w`<details
      class="session-progress-card session-progress-card--composer"
      data-progress-card-placement="composer"
      data-complete=${String(i)}
      ${Gi(c?.sessionIdentity??e.sessionKey,!s,c)}
    >
      <summary class="session-progress-card__summary" aria-label=${p}>
        <span
          class="session-progress-card__summary-indicator session-progress-card__current-marker${i||_===`done`?` session-progress-card__summary-indicator--complete`:``}"
          data-status=${h??`pending`}
          data-outcome=${_??C}
          aria-hidden="true"
        >
          ${ee}
        </span>
        <span class="session-progress-card__summary-collapsed">
          <span class="session-progress-card__current">${a}</span>
        </span>
        ${d?w`<span
                class="session-progress-card__summary-count session-progress-card__summary-count--collapsed"
                data-outcome=${_??C}
                >${u??`${r}/${d.total}`}</span
              >`:C}
        <span class="session-progress-card__summary-expanded">
          <span class="session-progress-card__summary-title"
            >${y(`sessionProgressCard.composerTitle`)}</span
          >
          <span class="session-progress-card__heading-actions"
            ><span>${ie}${d?w` · ${m}`:C}</span></span
          >
        </span>
        <span class="session-progress-card__summary-controls">
          ${qi(e,l)} ${ae} ${v}
          <span
            class="session-progress-card__summary-chevron session-progress-card__chevron"
            aria-hidden="true"
            >${S.chevronDown}</span
          >
        </span>
        ${l?.state?w`<span
                class="session-progress-card__refresh-status"
                data-state=${l.state}
                role="status"
                >${y(oa[l.state])}</span
              >`:C}
      </summary>
      <div
        class="session-progress-card__body"
        role="region"
        aria-label=${f}
        ${Pt()}
      >
        ${na(e.markdown)}
        ${ra(e,te,_)}
      </div>
    </details>`}return w`<section
    class="session-progress-card session-progress-card--${t}"
    data-progress-card-placement=${t}
    aria-label=${f}
  >
    <div class="session-progress-card__heading">
      <span>${y(`sessionProgressCard.title`)}</span>
      <span class="session-progress-card__heading-actions">
        <span
          >${ie}${d?w` · ${d.completed}/${d.total}`:C}</span
        >${v}
      </span>
    </div>
    <div class="session-progress-card__body">
      ${na(e.markdown)}
      ${ra(e,te,_)}
    </div>
  </section>`}var oa,sa,ca,Z,la,Q,ua,da;function fa(){return(fa=e((()=>{ht(),D(),Re(),E(),_t(),f(),m(),x(),Bt(),It(),Ki(),oa={pending:`sessionProgressCard.refresh.pending`,failed:`sessionProgressCard.refresh.failed`,timeout:`sessionProgressCard.refresh.timeout`,updated:`sessionProgressCard.refresh.updated`},sa=16,ca=14e4,Z=new Map,la={completed:`sessionProgressCard.status.completed`,in_progress:`sessionProgressCard.status.inProgress`,pending:`sessionProgressCard.status.pending`},Q={done:`completed`,failed:`failed`,killed:`stopped`,timeout:`failed`},ua=class extends je{constructor(...e){super(...e),this.timestamp=0,this.labelKey=`sessionProgressCard.activity.updated`}render(e,t){return this.timestamp=e,this.labelKey=t,this.isConnected&&this.startTimer(),this.renderTime()}disconnected(){this.timer&&=(clearInterval(this.timer),void 0)}reconnected(){this.setValue(this.renderTime()),this.startTimer()}startTimer(){this.timer||=setInterval(()=>this.setValue(this.renderTime()),3e4)}renderTime(){let e=y(this.labelKey,{time:oe(this.timestamp)});return w`<time
      datetime=${new Date(this.timestamp).toISOString()}
      aria-label=${e}
      title=${e}
      >${e}</time
    >`}},da=T(ua)})))()}function pa(e){let{widget:t}=e,n=t.declared?.netOrigins??[],r=t.declared?.tools??[];return w`
    <div class="board-widget__grant board-widget__grant--pending" data-test-id="board-pending">
      <div class="board-widget__grant-mark" aria-hidden="true">!</div>
      <strong>${y(`board.widget.needsApproval`)}</strong>
      ${n.length>0||r.length>0?w`<div class="board-widget__grant-groups">
              ${[[`board.widget.networkAccess`,n],[`board.widget.hostTools`,r]].map(([e,t])=>t.length>0?w`<section>
                      <strong>${y(e)}</strong>
                      <ul class="board-widget__grant-summary">
                        ${t.map(e=>w`<li>${e}</li>`)}
                      </ul>
                    </section>`:C)}
            </div>`:t.declaredSummary?.length?w`<ul class="board-widget__grant-summary">
                ${t.declaredSummary.map(e=>w`<li>${e}</li>`)}
              </ul>`:w`<span>${y(`board.widget.needsApprovalDetail`)}</span>`}
      <div class="board-widget__grant-actions">
        <button
          class="btn btn--small btn--primary"
          type="button"
          data-test-id="board-grant-allow"
          ?disabled=${e.disabled}
          @click=${()=>e.onGrant(`granted`)}
        >
          ${y(`board.widget.allow`)}
        </button>
        <button
          class="btn btn--small"
          type="button"
          data-test-id="board-grant-reject"
          ?disabled=${e.disabled}
          @click=${()=>e.onGrant(`rejected`)}
        >
          ${y(`board.widget.reject`)}
        </button>
      </div>
      ${e.error??C}
    </div>
  `}function ma(e,t=`tooltip`){if(e.grantState!==`granted`||!e.declared)return C;let n=[...(e.declared.netOrigins??[]).map(e=>y(`board.widget.networkCapability`,{capability:e})),...(e.declared.tools??[]).map(e=>y(`board.widget.toolCapability`,{capability:e}))];return n.length===0?C:t===`details`?w`<div
      class="board-widget__menu-capabilities"
      role="note"
      aria-label=${y(`board.widget.activeCapabilities`)}
    >
      <strong>${y(`board.widget.activeCapabilities`)}</strong>
      <ul>
        ${n.map(e=>w`<li>${e}</li>`)}
      </ul>
    </div>`:w`
    <zero-tooltip
      .content=${`${y(`board.widget.activeCapabilities`)}\n${n.join(`
`)}`}
    >
      <span class="board-widget__capabilities" data-test-id="board-capabilities-granted">
        ${y(`board.widget.granted`)}
      </span>
    </zero-tooltip>
  `}function ha(){return(ha=e((()=>{D(),f()})))()}function ga(e){let t=e.querySelector(`.board-widget__menu`);t&&(t.open=!1)}function _a(e){let{onSelect:t}=e;return w`
    <wa-dropdown class="board-widget__menu" placement="bottom-end" @wa-select=${t}>
      <button
        class="board-widget__menu-trigger"
        slot="trigger"
        type="button"
        aria-label=${y(`board.widget.menuLabel`)}
        title=${y(`board.widget.menuLabel`)}
      >
        ⋮
      </button>
      ${va(e)}
    </wa-dropdown>
  `}function va(e){let{widget:t,tabs:n,disabled:r,prefix:i=``}=e,a=n.filter(e=>e.tabId!==t.tabId);return w`
    <div class="board-widget__menu-heading">${y(`board.widget.moveToTab`)}</div>
    ${a.length>0?a.map(e=>w`
              <wa-dropdown-item value=${`${i}move:${e.tabId}`} ?disabled=${r}>
                ${e.title}
              </wa-dropdown-item>
            `):w`<span class="board-widget__menu-empty">${y(`board.widget.noOtherTabs`)}</span>`}
    <div class="board-widget__menu-heading">${y(`board.widget.resize`)}</div>
    ${Object.entries(Ca).map(([e,t])=>w`
        <wa-dropdown-item
          class="board-widget__preset"
          value=${`${i}resize:${e}`}
          ?disabled=${r}
        >
          ${e.toUpperCase()}
          <span slot="details">${t.w}×${t.h}</span>
        </wa-dropdown-item>
      `)}
    ${t.contentKind===`html`?w`<wa-dropdown-item
            class="board-widget__preset"
            type="checkbox"
            value=${`${i}height:auto`}
            ?checked=${t.heightMode!==`fixed`}
            ?disabled=${r}
          >
            ${y(`board.widget.autoHeight`)}
          </wa-dropdown-item>`:C}
    <div class="board-widget__menu-separator" role="separator"></div>
    <wa-dropdown-item
      class="board-widget__menu-danger"
      value=${`${i}remove`}
      ?disabled=${r}
    >
      <span slot="icon" class="board-widget__menu-icon" aria-hidden="true">${S.trash}</span>
      ${y(`board.widget.remove`)}
    </wa-dropdown-item>
  `}function ya(e){return w`
    <div class="board-widget__grant board-widget__grant--rejected" data-test-id="board-rejected">
      <strong>${y(`board.widget.rejected`)}</strong>
      <span>${y(`board.widget.rejectedDetail`)}</span>
      <button
        class="btn btn--small"
        type="button"
        ?disabled=${e.disabled}
        @click=${e.onRemove}
      >
        ${y(`board.widget.remove`)}
      </button>
    </div>
  `}function ba(e){return w`
    <div class="board-widget__disabled-plugin" data-test-id="board-disabled-plugin">
      ${e.content??w`<strong>${y(`board.widget.disabledPlugin`,{pluginId:e.pluginId})}</strong>`}
      <button
        class="btn btn--small"
        type="button"
        ?disabled=${e.disabled}
        @click=${e.onRemove}
      >
        ${y(`board.widget.remove`)}
      </button>
    </div>
  `}function xa(e,t){let n=ae(e);return w`
    <div class="board-widget__error" role="alert" data-test-id="board-widget-error">
      <strong>${y(`board.widget.errorTitle`)}</strong>
      <span>${y(`board.widget.errorDetail`)}</span>
      <details>
        <summary>${y(`board.widget.errorShow`)}</summary>
        <code>${n}</code>
      </details>
      ${t?w`<button class="btn btn--small" type="button" @click=${t}>
              ${y(`board.widget.retry`)}
            </button>`:C}
    </div>
  `}function Sa(e,t=!1){return w`
    <div
      class=${`board-widget__error ${t?`board-widget__error--inline`:``}`}
      role="alert"
      data-test-id="board-widget-action-error"
    >
      <strong>${y(`board.widget.actionErrorTitle`)}</strong>
      <span>${y(`board.widget.actionErrorDetail`)}</span>
      <details>
        <summary>${y(`board.widget.errorShow`)}</summary>
        <code>${e}</code>
      </details>
    </div>
  `}var Ca;function wa(){return(wa=e((()=>{D(),f(),v(),x(),Ca={sm:{w:3,h:3},md:{w:6,h:4},lg:{w:8,h:6},xl:{w:12,h:8}}})))()}function Ta(e,t){let n=pe(e,t);return n?.reader.linkReader.previewMethod?n:null}function Ea(e,t=b.providerFor(e),n=Ta){let r=t?.client&&t.readers?n(e.href,t.readers):null;return r&&he(e)?r:null}async function Da(e,t){let n=Ea(e),r=b.providerFor(e);if(!n||!r?.client?.connected||t.aborted)return;let{client:i,agentId:a,readers:o}=r;await b.define();let s=b.providerFor(e);await s?.updateComplete,!(t.aborted||!e.isConnected||e.href!==n.href||document.hidden||s!==r||s.client!==i||s.agentId!==a||s.readers!==o)&&await s.prefetch(n,t)}function Oa(){return(Oa=e((()=>{fe(),we()})))()}var $,ka,Aa,ja,Ma;function Na(){return(Na=e((()=>{D(),E(),ie(),fe(),Oa(),we(),$=8,ka=150,Aa=500,ja=class extends re{constructor(...e){super(...e),this.provider=null,this.handleCapabilities=()=>{this.release(),this.attempted.clear(),this.scheduleScan()},this.active=!1,this.observer=null,this.mutations=null,this.scope=new AbortController,this.observed=new Map,this.attempted=new Set,this.claims=new Map,this.resolveClaim=(e,t)=>{t!==this.claimReaders&&(this.claims.clear(),this.claimReaders=t);let n=this.claims.get(e);return n===void 0&&(n=Ta(e,t),this.claims.set(e,n)),n},this.handleVisibilityChange=()=>{this.active&&!document.hidden?this.mutations||this.scheduleScan():this.release()}}presentationChanged(e){e?.isPresented()===!1&&(this.active=!1,this.release())}render(e,t,n=!0){return C}update(e,[t,n,r=!0]){this.updatePresentation(n),(t!==this.sessionKey||!r)&&(this.release(),this.attempted.clear(),this.sessionKey=t),this.root=e.element instanceof HTMLElement?e.element:void 0;let i=this.root?.closest(`zero-link-reader-hovercard-provider`)??null;return i!==this.provider&&(this.provider?.removeEventListener(`link-reader-capabilities-changed`,this.handleCapabilities),this.provider=i,this.provider?.addEventListener(`link-reader-capabilities-changed`,this.handleCapabilities),this.release(),this.attempted.clear()),this.active=r&&(typeof n==`boolean`?n:n.isPresented()),document.addEventListener(`visibilitychange`,this.handleVisibilityChange),this.handleVisibilityChange(),C}disconnected(){super.disconnected(),this.provider?.removeEventListener(`link-reader-capabilities-changed`,this.handleCapabilities),document.removeEventListener(`visibilitychange`,this.handleVisibilityChange),this.release()}reconnected(){super.reconnected(),this.provider?.addEventListener(`link-reader-capabilities-changed`,this.handleCapabilities),document.addEventListener(`visibilitychange`,this.handleVisibilityChange),this.handleVisibilityChange()}release(){this.cancelScan?.(),this.cancelScan=void 0,this.observer?.disconnect(),this.observer=null,this.mutations?.disconnect(),this.mutations=null,this.observed.clear(),this.claims.clear(),this.claimReaders=void 0,clearTimeout(this.timer),this.timer=void 0,this.scope.abort(),this.scope=new AbortController,this.pendingKey&&this.attempted.delete(this.pendingKey),this.pendingKey=void 0}canPrefetch(){return this.active&&this.isConnected&&!!this.root?.isConnected&&!document.hidden}scheduleScan(){if(this.cancelScan||this.attempted.size>=$)return;let e=()=>{this.cancelScan=void 0,this.canPrefetch()&&this.attempted.size<$&&this.scan()};if(typeof requestIdleCallback==`function`){let t=requestIdleCallback(e,{timeout:Aa});this.cancelScan=()=>cancelIdleCallback(t)}else{let t=setTimeout(e,Aa);this.cancelScan=()=>clearTimeout(t)}}scan(){let e=this.root;if(e&&typeof IntersectionObserver<`u`){if(!this.observer){let t=new IntersectionObserver(e=>{if(this.observer===t&&this.canPrefetch()){for(let t of e){if(!(t.target instanceof HTMLAnchorElement))continue;let e=this.observed.get(t.target);e&&(e.visible=t.isIntersecting)}this.schedulePrefetch()}});this.observer=t,this.mutations=new MutationObserver(()=>this.scheduleScan()),this.mutations.observe(e,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[`href`]})}for(let[t,{key:n}]of this.observed){let r=Ea(t,b.providerFor(t),this.resolveClaim);(!e.contains(t)||!r||ge(r)!==n)&&(this.observer.unobserve(t),this.observed.delete(t))}for(let t of e.querySelectorAll(`a[href]`)){if(this.observed.has(t))continue;let e=Ea(t,b.providerFor(t),this.resolveClaim);if(!e)continue;let n=ge(e);this.attempted.has(n)||(this.observed.set(t,{key:n,visible:!1}),this.observer.observe(t))}}}schedulePrefetch(){this.timer!==void 0||this.pendingKey!==void 0||!this.canPrefetch()||this.attempted.size>=$||(this.timer=setTimeout(()=>{this.timer=void 0,this.prefetchNext()},ka))}async prefetchNext(){if(this.canPrefetch())for(let[e,{key:t,visible:n}]of this.observed){if(!n||!this.root?.contains(e)||this.attempted.has(t))continue;this.attempted.add(t);let r=this.scope;this.pendingKey=t;try{await Da(e,r.signal)}catch{}finally{r===this.scope&&(this.pendingKey=void 0,this.attempted.size>=$?this.release():this.schedulePrefetch())}return}}},Ma=T(ja)})))()}export{Lr as $,_i as A,Kn as At,ci as B,zn as Bt,Pi as C,Tn as Ct,bi as D,Nn as Dt,Oi as E,Mn as Et,fi as F,Un as Ft,ni as G,Vn as Gt,ii as H,qn as Ht,di as I,In as It,qr as J,Jr as K,Gn as Kt,li as L,On as Lt,hi as M,Bn as Mt,pi as N,Jn as Nt,Ci as O,Xn as Ot,mi as P,Wn as Pt,Pr as Q,ui as R,Pn as Rt,Ii as S,En as St,Di as T,Rn as Tt,ri as U,Cn as Ut,oi as V,Yn as Vt,ti as W,Fn as Wt,ei as X,Rr as Y,Kr as Z,na as _,rr as _t,wa as a,Cr as at,Fi as b,R as bt,xa as c,yr as ct,ya as d,fr as dt,Nr as et,ha as f,ur as ft,Qi as g,tr as gt,fa as h,$n as ht,ga as i,Dr as it,gi as j,Qn as jt,xi as k,jn as kt,_a as l,vr as lt,pa as m,ar as mt,Ma as n,Mr as nt,ba as o,xr as ot,ma as p,or as pt,Gr as q,kn as qt,Ca as r,jr as rt,Sa as s,wr as st,Na as t,Fr as tt,va as u,dr as ut,aa as v,er as vt,Ni as w,Ln as wt,Li as x,ir as xt,Ri as y,pr as yt,si as z,An as zt};
const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./chat-html-preview-element-vFjVfgdC.js","./gateway-runtime-JSfC8ThO.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-boot-shared-BRtBCr5s.js","./control-ui-boot-shared-CZXdmeIi.js","./control-ui-boot-shared-4Y4EIRNw.js","./config-runtime-BecGLziM.js","./plugin-contracts-runtime-BO_sRtcl.js","./markdown-runtime-ORQpioyT.js","./control-ui-boot-chat-BVLkkfEk.js","./sidebar-update-runtime-B2P2sMaT.js","./control-ui-boot-chat-B3rfqCeq.js","./control-ui-boot-chat-Cx6CBnJr.js","./chat-transcript-styles-BN-TorbW.js","./control-ui-boot-chat-styles-BcslGtWC.js","./widget-sandbox-host-DmaxFipY.js","./sandbox-host-Dm6XHU23.js","./control-ui-core-DI-Q_yCI.css","./control-ui-boot-shared-styles-DUf4zEvn.css","./control-ui-boot-shared-DIWJGbGi.css","./sidebar-update-runtime-Bpn2ByHA.css","./chat-transcript-styles-B0IJwY9P.css","./control-ui-boot-chat-styles-SRk09zDG.css","./control-ui-boot-chat-C2DT0d4M.css","./mcp-app-view-registration-DIo7IVeR.js","./mcp-app-routing-BSRGUs87.js","./mcp-app-confirm-B_IXP1_0.js","./file-editor-view-BnD1Sr5H.js","./dist-BVfGhkDR.js","./code-language-ClU8CeFb.js"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Au as t,Hs as n,Ic as r,Jr as i,Ku as a,Lc as o,Nu as s,Pu as c,Yr as l,cl as u,ju as d,ll as ee,xu as f,yu as p,zu as m}from"./control-ui-core-DCNBgr3X.js";import{Ai as te,Fi as ne,Ji as re,Ki as h,Ui as g,Vi as ie,ca as _,di as ae,dr as oe,fi as v,ki as se,n as ce,qi as le,r as ue,sa as y,ur as de,zi as fe}from"./control-ui-core-DwX5Mpz4.js";import{C as pe,G as b,J as x,T as me,W as S,Z as C,_ as he,at as w,c as T,i as ge,l as E,o as D,rt as O,y as k}from"./lit-runtime-B40xFCK_.js";import{An as _e,J as ve,Mn as ye,Nn as A,Pn as be,_r as xe,hr as Se,jn as Ce,kn as we}from"./control-ui-boot-shared-BX8huZUb.js";import{Li as Te,Ur as Ee,Wr as De,Zr as j,ci as Oe,ma as M,pa as N}from"./ui-AaV6iNVa.js";import{D as ke,F as Ae,M as je,T as Me,j as Ne}from"./control-ui-boot-shared-E4pYPcWx.js";import{An as Pe,At as Fe,Bt as Ie,Ht as Le,Kt as Re,Mi as ze,Mn as Be,Nn as Ve,Ut as He,Vt as Ue,bt as We,ci as Ge,cn as Ke,ei as qe,jt as Je,kt as Ye,li as Xe,on as Ze,ti as Qe,vt as $e}from"./control-ui-boot-shared-ZuP0LiFD.js";import{$s as et,Cs as tt,I as nt,Js as P,Ks as rt,Qp as F,Qs as it,R as at,Sc as ot,Ss as I,Ts as L,Xs as st,Zp as ct,Zs as R,_s as lt,bs as ut,ec as dt,gs as ft,ms as pt,ps as mt,vs as ht,ws as z,xc as gt,xs as _t,ys as vt}from"./control-ui-boot-shared-CzJHozXQ.js";import{p as yt}from"./control-ui-boot-shared-D2GHitQ4.js";import"./control-ui-boot-shared-styles-BXPMRytW.js";import{T as B,at as bt,it as xt,nt as St,w as V}from"./control-ui-boot-chat-D02HpoEK.js";import{Cn as Ct,Dn as H,En as wt,Sn as Tt,Tn as Et,_r as Dt,bn as Ot,gr as kt,hr as At,vr as jt,wn as Mt,xn as Nt,yn as Pt,yr as Ft}from"./control-ui-boot-chat-DzIjAmFi.js";import{H as It,U as Lt,nt as Rt,rt as zt}from"./control-ui-boot-chat-zkzP5WWm.js";var Bt;function Vt(){return(Vt=e((()=>{c(),f(),Bt=class{constructor(e,t,n){this.host=e,this.content=t,this.runtime=n,this.error=null,this.request=null,this.onDownload=async()=>{let e=this.content();if(e?.kind!==`attachment`||!e.download||this.request)return;let t=new AbortController,{connectionEpoch:n,sessionKey:r,agentId:i}=this.runtime();this.request=t,this.error=null,this.host.requestUpdate();let a=()=>{let a=this.runtime();return this.host.isConnected&&this.content()===e&&this.request===t&&a.connectionEpoch===n&&a.sessionKey===r&&a.agentId===i&&!t.signal.aborted};try{let n=await e.download(t.signal);if(!a())return;if(!n)throw Error(m(`chat.attachments.unavailable`));ve(e.title,n)}catch(e){a()&&(this.error=p(e))}finally{this.request===t&&(this.request=null,this.host.requestUpdate())}}}get pending(){return this.request!==null}cancel(){(this.request||this.error!==null)&&(this.request?.abort(),this.request=null,this.error=null,this.host.requestUpdate())}}})))()}var Ht;function Ut(){return(Ut=e((()=>{l(),Ht=class{constructor(e,t){this.host=e,this.content=t,this.feedback={},this.attempts=new Map,this.timers=new Map,this.copy=e=>{let t=this.content();if(t?.kind!==`file`)return;let n=(this.attempts.get(e)??0)+1;this.attempts.set(e,n);let r=()=>this.attempts.get(e)===n&&this.content()===t&&this.host.isConnected;i(e===`path`?t.path:t.content,r).then(t=>{r()&&(this.feedback={...this.feedback,[e]:t?`copied`:`failed`},this.host.requestUpdate(),globalThis.clearTimeout(this.timers.get(e)),this.timers.set(e,globalThis.setTimeout(()=>{this.timers.delete(e),this.feedback={...this.feedback,[e]:void 0},this.host.requestUpdate()},t?1500:2e3)))})},e.addController(this)}reset(){for(let e of this.timers.values())globalThis.clearTimeout(e);this.timers.clear();for(let[e,t]of this.attempts)this.attempts.set(e,t+1);this.feedback={},this.host.isConnected&&this.host.requestUpdate()}hostConnected(){this.reset()}hostDisconnected(){this.reset()}}})))()}function Wt(e,t){return e.split(`;`,1)[0]?.trim().toLowerCase()===`text/html`||/\.html?$/i.test(t)}function Gt(e,t,n,r,i,a){e.requestWhileActive(U,!0);let o=e.visibleState;return x`
    ${o?.status===`error`?v({error:o.error,stale:o.stale,onRetry:()=>e.retry()}):o?x`<div role="status">${m(`common.loading`)}</div>`:b}
    <zero-chat-html-preview
      .html=${t}
      .sourceIdentity=${n}
      .title=${r}
      .embedSandboxMode=${i}
      .sessionFileSource=${a}
    ></zero-chat-html-preview>
  `}var U,Kt;function W(){return(W=e((()=>{S(),ie(),g(),ae(),c(),V(),M(),B(),U={tagName:`zero-chat-html-preview`,get label(){return m(`chat.detailPanel.renderPreview`)},loadModule:()=>N(()=>import(`./chat-html-preview-element-vFjVfgdC.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]),import.meta.url)},Kt=class{constructor(e,t,n){this.host=e,this.content=t,this.text=n,this.source=!1,this.preview=null,this.loader=new fe(e),e.addController(this)}get file(){let e=this.content();return e?.kind===`file`&&Wt(e.mimeType??``,e.name)?e:null}get showing(){return this.file!==null&&!this.source}reset(e,t){this.source=t;let n=this.file;this.preview=n&&!t?e??n.content:null}showSource(){this.source||(this.source=!0,this.host.requestUpdate())}toggle(){this.source&&(this.preview=this.text()),this.source=!this.source,this.host.requestUpdate()}discard(e){this.preview!==null&&(this.preview=e,this.host.requestUpdate())}hostDisconnected(){this.loader.requestWhileActive(U,!1)}controls(e){let t=this.file;if(t)return{source:this.source,onToggle:e.onToggle,presentation:this.preview===null?b:Gt(this.loader,this.preview,t.draftKey??[e.runtime.sessionKey??``,e.runtime.agentId??``,t.root??``,t.path].join(`\0`),t.name,e.mode,t.sessionFileSource),sourceFallback:e.error?x`
            ${v({error:e.error,stale:h(e.error),onRetry:e.onRetry})}
            <pre class="sidebar-attachment-preview__text">${this.text()}</pre>
          `:void 0}}}})))()}function qt(e){let{settings:t,values:n}=e,r=()=>Object.entries(n).some(([e,n])=>t.values[e]!==n),i=r=>{let i=t.schema.properties[r];if(!i)return b;let a=t.schema.required?.includes(r)??!1,o=n[r];return x`<label class="mcp-app-settings__field"
      ><span>${i.title}</span
      >${i.description?x`<small class="muted">${i.description}</small>`:b}
      ${i.type===`boolean`?x`<input
              type="checkbox"
              .checked=${D(o===!0)}
              ?disabled=${e.busy}
              @change=${t=>{t.currentTarget instanceof HTMLInputElement&&e.onChange(r,t.currentTarget.checked)}}
            />`:i.type===`string`&&i.enum?x`<select
                .value=${D(String(o??``))}
                ?required=${a}
                ?disabled=${e.busy}
                @change=${t=>{t.currentTarget instanceof HTMLSelectElement&&e.onChange(r,t.currentTarget.value)}}
              >
                ${i.enum.map(e=>x`<option .value=${e} .selected=${e===o}>${e}</option>`)}
              </select>`:i.type===`string`?x`<input
                  type="text"
                  .value=${D(String(o??``))}
                  ?required=${a}
                  ?disabled=${e.busy}
                  minlength=${k(i.minLength)}
                  maxlength=${k(i.maxLength)}
                  pattern=${k(i.pattern)}
                  @input=${t=>{t.currentTarget instanceof HTMLInputElement&&e.onChange(r,t.currentTarget.value)}}
                />`:x`<input
                  type="number"
                  .value=${D(String(o??``))}
                  ?required=${a}
                  ?disabled=${e.busy}
                  min=${k(i.minimum)}
                  max=${k(i.maximum)}
                  step=${i.multipleOf??(i.type===`integer`?1:`any`)}
                  @input=${t=>{let n=t.currentTarget;n instanceof HTMLInputElement&&Number.isFinite(n.valueAsNumber)&&e.onChange(r,n.valueAsNumber)}}
                />`}
    </label>`},a=new Set(t.layout?.flatMap(e=>e.items.flatMap(e=>e.kind===`property`?[e.property]:[])));return x`<form
    class="mcp-app-settings"
    @submit=${t=>{t.preventDefault(),r()&&t.currentTarget instanceof HTMLFormElement&&t.currentTarget.reportValidity()&&e.onSave()}}
  >
    <p class="muted">${m(`mcpApp.settingsDescription`)}</p>
    ${t.layout?.map(t=>x`<fieldset ?disabled=${e.busy}>
          <legend>${t.title}</legend>
          ${t.items.map(t=>t.kind===`property`?i(t.property):x`<div class="mcp-app-settings__field"><button type="button" class="btn" @click=${()=>e.onTool(t.tool)}>${t.title}</button>${t.description?x`<small>${t.description}</small>`:b}</div>`)}
        </fieldset>`)}
    ${Object.keys(t.schema.properties).filter(e=>!a.has(e)).map(i)}
    <button type="submit" class="btn primary" ?disabled=${e.busy||!r()}>
      ${m(`mcpApp.save`)}
    </button>
  </form>`}function Jt(){return(Jt=e((()=>{S(),he(),ge(),c(),we(),_e()})))()}var G;function Yt(){return(Yt=e((()=>{De(),S(),C(),T(),te(),oe(),c(),we(),f(),s(),o(),Jt(),ue(),M(),_e(),G=class extends d{constructor(...e){super(...e),this.viewId=``,this.busy=!1,this.error=null,this.notice=``,this.settings=null,this.values={},this.generation=0,this.ownerScope=-1,this.launchIdentity=``,this.unmount=new ce(this),this.subscriptions=new r(this).watch(()=>this.context?.gateway,(e,t)=>e.subscribe(t))}currentLaunchIdentity(){let e=this.launch;return JSON.stringify([e?.sessionKey,e?.agentId,e?.serverName,e?.entrypoint.toolName,e?.filePath,e?.settings,e?.quickAction])}willUpdate(e){let t=this.context?de(this.context.gateway).key:-1,n=this.currentLaunchIdentity();(e.has(`launch`)&&n!==this.launchIdentity||t!==this.ownerScope)&&(this.launchIdentity=n,this.ownerScope=t,this.generation++,this.viewId=``,this.settings=null,this.busy=!1,this.error=null,this.launch&&this.context&&this.launch.owner===this.context.gateway.snapshot.client&&this.open())}async operation(e,t){let n=this.context,r=this.launch,i=n?.gateway.snapshot.client;if(!n||!r||!i||i!==r.owner||n.gateway.snapshot.phase!==`connected`){this.error=m(`mcpApp.disconnected`);return}let a=++this.generation,o=this.currentLaunchIdentity(),s=de(n.gateway).key,c=()=>this.isConnected&&a===this.generation&&this.currentLaunchIdentity()===o&&n.gateway.snapshot.client===i&&de(n.gateway).key===s;this.busy=!0,this.error=null,this.notice=``;try{let n=await e(i,r);c()&&t(n)}catch(e){c()&&(this.error=p(e))}finally{c()&&(this.busy=!1)}}async open(){if(this.launch?.settings){await this.readSettings();return}await this.operation(async(e,t)=>{if((await N(()=>import(`./mcp-app-view-registration-DIo7IVeR.js`),__vite__mapDeps([24,1,2,4,3,5,7,6,8,10,25,9,11,12,13,14,26,16,17,18,19,20,21,22,23]),import.meta.url)).registerMcpAppView(),this.launch?.sessionKey!==t.sessionKey||this.launch?.serverName!==t.serverName||this.launch?.entrypoint.toolName!==t.entrypoint.toolName||e!==this.context?.gateway.snapshot.client||!this.isConnected)throw Error(m(`mcpApp.disconnected`));return await e.request(`mcp.app.launch`,{sessionKey:t.sessionKey,agentId:t.agentId,serverName:t.serverName,toolName:t.entrypoint.toolName,entrypointType:t.entrypoint.entrypoint.type,...t.quickAction?{quickAction:!0}:{},...t.filePath?{filePath:t.filePath}:{},...t.deepLink?{deepLink:t.deepLink}:{}})},e=>{if(e.toolResult?.isError||!e.viewId&&!e.toolResult)throw Error(m(`mcpApp.errors.requestFailed`));e.viewId?this.viewId=e.viewId:this.notice=m(`mcpApp.actionComplete`)})}params(e){return{sessionKey:this.launch.sessionKey,agentId:this.launch.agentId,serverName:this.launch.serverName,action:e}}async readSettings(){await this.operation(e=>e.request(`mcp.app.settings`,this.params(`read`)),e=>{this.settings=e,this.values={...e.values}})}async saveSettings(){let e=Object.fromEntries(Object.entries(this.values).filter(([e,t])=>this.settings?.values[e]!==t));Object.keys(e).length&&await this.operation(async t=>{if((await t.request(`mcp.app.settings`,{...this.params(`update`),arguments:{set:e}})).toolResult?.isError)throw Error(m(`mcpApp.errors.requestFailed`));return await t.request(`mcp.app.settings`,this.params(`read`))},e=>{this.settings=e,this.values={...e.values},this.notice=m(`mcpApp.settingsSaved`)})}async runTool(e){await this.operation(async(t,n)=>{if((await N(()=>import(`./mcp-app-view-registration-DIo7IVeR.js`),__vite__mapDeps([24,1,2,4,3,5,7,6,8,10,25,9,11,12,13,14,26,16,17,18,19,20,21,22,23]),import.meta.url)).registerMcpAppView(),this.launch!==n||this.context?.gateway.snapshot.client!==t||!this.isConnected)throw Error(m(`mcpApp.disconnected`));return t.request(`mcp.app.settings`,{...this.params(`tool`),toolName:e})},e=>{if(e.toolResult?.isError){this.error=m(`mcpApp.errors.requestFailed`);return}e.viewId?(this.settings=null,this.viewId=e.viewId):this.notice=m(`mcpApp.actionComplete`)})}disconnectedCallback(){this.generation++,this.subscriptions.clear(),super.disconnectedCallback()}render(){let e=this.launch;return e?x`<section class="mcp-app-panel">
      <div class="mcp-app-panel__toolbar">
        <strong>${e.entrypoint.title}</strong><span class="muted">${e.serverName}</span>
        ${e.settings&&!this.settings?x`<button
                class="btn btn--sm"
                ?disabled=${this.busy}
                @click=${()=>{this.viewId=``,this.readSettings()}}
              >
                ${m(`mcpApp.settings`)}
              </button>`:b}
      </div>
      ${this.busy?x`<p role="status">${m(`mcpApp.loading`)}</p>`:b}
      ${this.error?x`<p role="alert">${this.error}</p>
              <button class="btn" @click=${()=>void this.open()}>${m(`mcpApp.retry`)}</button>`:b}
      ${this.notice?x`<p role="status">${this.notice}</p>`:b}
      ${this.settings?qt({settings:this.settings,values:this.values,busy:this.busy,onChange:(e,t)=>{this.values={...this.values,[e]:t}},onSave:()=>void this.saveSettings(),onTool:e=>void this.runTool(e)}):b}
      ${this.unmount.render(this.viewId,()=>this.viewId?E(this.viewId,x`<mcp-app-view
                  .sessionKey=${e.sessionKey}
                  .agentId=${e.agentId??``}
                  .viewId=${this.viewId}
                  .title=${e.entrypoint.title}
                  .deepLink=${e.deepLink}
                  .onRelaunch=${()=>void this.open()}
                  .relaunching=${this.busy}
                ></mcp-app-view>`):b,()=>[this])}
    </section>`:b}},j([Ee({context:se,subscribe:!0})],G.prototype,`context`,void 0),j([w({attribute:!1})],G.prototype,`launch`,void 0),j([O()],G.prototype,`viewId`,void 0),j([O()],G.prototype,`busy`,void 0),j([O()],G.prototype,`error`,void 0),j([O()],G.prototype,`notice`,void 0),j([O()],G.prototype,`settings`,void 0),j([O()],G.prototype,`values`,void 0),customElements.get(`zero-mcp-app-panel`)||customElements.define(`zero-mcp-app-panel`,G)})))()}function Xt(e,t){let n=e.split(`;`,1)[0]?.trim().toLowerCase()??``;return n===`application/pdf`||(!n||n===`application/octet-stream`)&&/\.pdf$/i.test(t)}var K,Zt,q;function Qt(){return(Qt=e((()=>{S(),C(),c(),s(),I(),st(),ut(),K=16777216,Zt=1e4,q=class extends t{constructor(...e){super(...e),this.src=``,this.sourceIdentity=``,this.label=``,this.mimeType=``,this.status=`loading`,this.previewUrl=null}connectedCallback(){super.connectedCallback(),this.requestUpdate(`src`)}disconnectedCallback(){this.cancelLoad(),this.revokePreviewUrl(),super.disconnectedCallback()}willUpdate(e){(e.has(`src`)||e.has(`sourceIdentity`)||e.has(`sizeBytes`))&&(this.cancelLoad(),(!this.src||!this.previewUrl||!this.sourceIdentity||e.has(`sourceIdentity`)||e.has(`sizeBytes`))&&(this.revokePreviewUrl(),this.status=`loading`),this.src&&this.loadPdf())}cancelLoad(){this.abortController?.abort(),this.abortController=void 0}revokePreviewUrl(){this.previewUrl&&URL.revokeObjectURL(this.previewUrl),this.previewUrl=null,this.previewBytes=void 0}async loadPdf(){if(this.sizeBytes!==void 0&&this.sizeBytes>K){this.status=`error`;return}let e=new AbortController;this.abortController=e;let t=setTimeout(()=>e.abort(),Zt);try{let t=await fetch(this.src,{credentials:`same-origin`,redirect:`error`,signal:e.signal});if(!t.ok)throw await t.body?.cancel().catch(()=>void 0),Error(`PDF attachment unavailable`);let n=await _t(t,K);if(!n)throw Error(`PDF attachment exceeds preview limit`);if(this.abortController!==e||!this.isConnected)return;let r=new Uint8Array(n);if(this.previewBytes?.length===r.length&&this.previewBytes.every((e,t)=>e===r[t]))return;this.revokePreviewUrl(),this.previewBytes=r,this.previewUrl=URL.createObjectURL(new Blob([n],{type:`application/pdf`})),this.status=`ready`}catch{this.abortController===e&&this.isConnected&&(this.revokePreviewUrl(),this.status=`error`)}finally{clearTimeout(t),this.abortController===e&&(this.abortController=void 0)}}render(){let e=it(this.src);return x`
      <div class="sidebar-pdf-preview" aria-label=${this.label}>
        <div class="sidebar-pdf-preview__surface">
          ${this.status===`loading`?z():this.status===`error`||!this.previewUrl?x`<div class="sidebar-attachment-preview__unavailable" role="alert">
                    ${m(`chat.attachments.previewUnavailable`)}
                    ${L({kind:`document`,label:this.label,mimeType:this.mimeType,sizeBytes:this.sizeBytes,downloadHref:e??void 0})}
                  </div>`:x`<iframe
                    class="sidebar-pdf-preview__frame"
                    title=${this.label}
                    src=${this.previewUrl}
                    referrerpolicy="no-referrer"
                  ></iframe>`}
        </div>
      </div>
    `}},j([w()],q.prototype,`src`,void 0),j([w()],q.prototype,`sourceIdentity`,void 0),j([w()],q.prototype,`label`,void 0),j([w()],q.prototype,`mimeType`,void 0),j([w({type:Number})],q.prototype,`sizeBytes`,void 0),j([O()],q.prototype,`status`,void 0),j([O()],q.prototype,`previewUrl`,void 0),customElements.get(`zero-chat-pdf-preview`)||customElements.define(`zero-chat-pdf-preview`,q)})))()}function $t(e,t){let n=e.split(`;`,1)[0]?.trim().toLowerCase()??``;return n.startsWith(`text/`)||/^application\/(?:(?:[\w.-]+\+)?(?:json|xml)|javascript|x-javascript|yaml|x-yaml)$/.test(n)?!0:(!n||n===`application/octet-stream`)&&/\.(?:txt|md|markdown|html?|log|csv|tsv|json|jsonl|xml|yaml|yml)$/i.test(t)}var J;function en(){return(en=e((()=>{S(),C(),T(),Me(),ie(),Ze(),_(),Rt(),$e(),c(),V(),ee(),ot(),s(),I(),mt(),W(),B(),J=class extends t{constructor(...e){super(...e),this.plainText=!1,this.actions=b,this.embedSandboxMode=`scripts`,this.src=``,this.sourceIdentity=``,this.label=``,this.mimeType=``,this.text=null,this.failed=!1,this.source=!1,this.htmlPreviewLoader=new fe(this),this.loadVersion=0}connectedCallback(){super.connectedCallback(),this.requestUpdate(`src`)}disconnectedCallback(){this.cancelLoad(),this.htmlPreviewLoader.requestWhileActive(U,!1),super.disconnectedCallback()}get htmlDocument(){return!this.plainText&&Wt(this.mimeType,this.label)}willUpdate(e){e.has(`sourceIdentity`)&&(this.source=!1);let t=e.has(`plainText`)||e.has(`mimeType`)||e.has(`label`);(t||e.has(`src`)||e.has(`sourceIdentity`)||e.has(`sizeBytes`))&&(this.cancelLoad(),(t||!this.src||!this.sourceIdentity||e.has(`sourceIdentity`)||e.has(`sizeBytes`))&&(this.text=null),this.failed=!1,this.src&&this.loadText())}cancelLoad(){this.loadVersion+=1,this.abortController?.abort(),this.abortController=void 0}async loadText(){let e=this.loadVersion,t=new AbortController;this.abortController=t;try{let n=await pt(this.src,this.sizeBytes,t.signal,this.htmlDocument?`html`:`full`);e===this.loadVersion&&this.isConnected&&(this.text=n)}catch{e===this.loadVersion&&this.isConnected&&(this.text=null,this.failed=!0)}finally{this.abortController===t&&(this.abortController=void 0)}}retry(){this.cancelLoad(),this.text=null,this.failed=!1,this.loadText()}render(){let e=this.htmlDocument,t=this.mimeType.split(`;`,1)[0]?.trim().toLowerCase(),n=!this.plainText&&(t===`text/markdown`||t===`text/x-markdown`||/\.(?:md|markdown)$/i.test(this.label)),r=x`<pre
      class="sidebar-attachment-preview__text"
      tabindex="0"
      aria-label=${this.label}
      ?hidden=${e&&!this.source}
    >
${this.text}</pre>`,i=this.text===null?z():x`${E(this.sourceIdentity||this.loadVersion,x`${E(this.text,e?x`<div class="chat-html-preview" ?hidden=${this.source}>
                      ${Gt(this.htmlPreviewLoader,this.text,this.sourceIdentity||this.src,this.label,this.embedSandboxMode)}
                    </div>
                    ${r}`:n&&!this.source?x`<article
                      class="sidebar-attachment-preview__markdown sidebar-markdown-reader sidebar-markdown"
                      dir=${gt(this.text)}
                      aria-label=${this.label}
                      ${zt()}
                    >
                      ${ke(We(this.text,{mode:`document`,remoteImages:!1,codeBlockInteraction:`interactive`}))}
                    </article>`:r)}`)}`;return x`
      <div class="sidebar-file-toolbar">
        <span class="sidebar-file-toolbar__type" title=${this.mimeType}
          >${this.mimeType||this.label.split(`.`).at(-1)}</span
        >
        ${this.sizeBytes===void 0?b:x`<span>${u(this.sizeBytes)}</span>`}
        <span class="sidebar-file-toolbar__actions">
          ${this.text!==null&&!this.failed?E(this.loadVersion,Ke(this.text,m(`common.copy`))):b}
          ${this.actions}
          ${this.failed?x`<button class="btn btn--sm" type="button" @click=${()=>this.retry()}>${m(`common.retry`)}</button>`:b}
          ${(n||e)&&this.text!==null?x`<button
                  class="btn btn--sm"
                  type="button"
                  aria-pressed=${String(this.source)}
                  @click=${()=>{this.source=!this.source}}
                >
                  ${this.source?m(`chat.workspaceFiles.preview`):m(e?`chat.detailPanel.viewSource`:`chat.detailPanel.viewRawText`)}
                </button>`:b}
          <a
            class="rail-header__action"
            href=${this.src||b}
            download=${this.label}
            target="_blank"
            rel="noreferrer"
            aria-label=${m(`chat.mediaPlayer.download`,{filename:this.label})}
            >${y.download}</a
          >
        </span>
      </div>
      ${this.failed?x`<p class="muted" role="status">
              ${m(e?`chat.attachments.htmlPreviewUnavailable`:`chat.attachments.textPreviewUnavailable`)}
            </p>`:i}
    `}},j([w({type:Boolean})],J.prototype,`plainText`,void 0),j([w({attribute:!1})],J.prototype,`actions`,void 0),j([w()],J.prototype,`embedSandboxMode`,void 0),j([w()],J.prototype,`src`,void 0),j([w()],J.prototype,`sourceIdentity`,void 0),j([w()],J.prototype,`label`,void 0),j([w()],J.prototype,`mimeType`,void 0),j([w({type:Number})],J.prototype,`sizeBytes`,void 0),j([O()],J.prototype,`text`,void 0),j([O()],J.prototype,`failed`,void 0),j([O()],J.prototype,`source`,void 0),customElements.get(`zero-chat-text-attachment`)||customElements.define(`zero-chat-text-attachment`,J)})))()}function tn(e,t){return e.every(e=>e.kind!==`add`&&e.kind!==`ctx`||e.lineNo===void 0||t[e.lineNo-1]===e.text)}function nn(e,t,n){return Array.from({length:n},(n,r)=>({kind:`ctx`,lineNo:t+r,text:e[t+r-1]}))}function rn(e,t,n,r,i){let a=e.findIndex(e=>e.kind===`skip`&&e.gap===t),o=t.newStart+t.count-1;if(a<0||t.newStart<1||t.count<1||o>n.length||!tn(e,n))return null;let s=r===`all`||t.count<=on?t.count:Math.min(an,t.count),c=t.count-s,l=nn(n,r===`up`?t.newStart+c:t.newStart,s);return c>0&&l.splice(r===`up`?0:l.length,0,{kind:`skip`,text:i(c),gap:r===`up`?{...t,count:c}:{oldStart:t.oldStart+s,newStart:t.newStart+s,count:c}}),[...e.slice(0,a),...l,...e.slice(a+1)]}var an,on;function sn(){return(sn=e((()=>{Se(),an=20,on=25})))()}function cn(e,t){let n=[],r=!1,i=!1,a=0,o=0,s,c,l=e.replace(/\r\n/g,`
`).split(`
`);l.at(-1)===``&&l.pop();for(let e of l){let l=/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(e);if(l){let e=Number.parseInt(l[1]??``,10),r=Number.parseInt(l[2]??``,10),u=s===void 0?e-1:e-s;u>0&&n.push({kind:`skip`,text:t(u),gap:{oldStart:s??e-u,newStart:c??r-u,count:u}}),a=e,o=r,i=!0;continue}if(!i||e.startsWith(`\\`))continue;if(n.length>=ln){r=!0;break}let u=e.startsWith(`+`)?`add`:e.startsWith(`-`)?`del`:`ctx`;n.push({kind:u,lineNo:u===`del`?a:o,text:e.slice(1)}),u!==`add`&&(a+=1),u!==`del`&&(o+=1),s=a,c=o}return{lines:n,truncated:r}}var ln;function un(){return(un=e((()=>{ln=600})))()}var Y;function dn(){return(dn=e((()=>{S(),C(),Ze(),Xe(),_(),qe(),ze(),c(),A(),s(),Y=class extends d{constructor(...e){super(...e),this.menu=null,this.onAction=()=>{},this.onClose=()=>{},this.menuLifecycle=new Ge(this,{getTrigger:()=>this.menu?.trigger??null,onClose:()=>this.onClose()}),this.handleSelect=e=>{e.preventDefault();let t=e.detail.item.value;if(!t)return;let n={"collapse-all":{kind:`collapse-all`},"expand-all":{kind:`expand-all`},"toggle-split":{kind:`toggle-split`},"toggle-wrap":{kind:`toggle-wrap`},"scope:all":{kind:`scope`,value:{scope:`all`}},"scope:uncommitted":{kind:`scope`,value:{scope:`uncommitted`}}},r=this.menu?.kind===`file`?this.menu:null;if(r&&(t===`open-file`||t===`reveal-file`)){this.run({kind:t,path:r.path});return}let i=n[t];if(i){this.run(i);return}if(t.startsWith(`open-editor:`)){let e=t.slice(12);if(Ce.includes(e)){let t=this.menu?.kind===`file`?this.menu.absolutePath:void 0;t&&this.run({kind:`open-editor`,editor:e,path:t})}return}t.startsWith(`scope:commit:`)&&this.run({kind:`scope`,value:{scope:`commit`,commit:t.slice(13)}})},this.handleAfterHide=e=>{e.currentTarget instanceof Node&&e.currentTarget.isConnected&&this.onClose()}}connectedCallback(){super.connectedCallback(),Qe(this)}run(e){this.onClose(),this.onAction(e)}renderFileMenu(e){return x`
      ${this.renderCopyRow(e.path,m(`chat.sessionDiff.copyPath`))}
      <wa-dropdown-item class="session-menu__item" value="open-file" ?disabled=${!e.canOpenFile}>
        <span slot="icon" class="session-menu__icon" aria-hidden="true">${y.fileText}</span>
        <span class="session-menu__text">${m(`chat.sessionDiff.openFile`)}</span>
      </wa-dropdown-item>
      ${e.canReveal?x`<wa-dropdown-item class="session-menu__item" value="reveal-file">
              <span slot="icon" class="session-menu__icon" aria-hidden="true">${y.folder}</span>
              <span class="session-menu__text">${m(`chat.sessionDiff.revealInFileTree`)}</span>
            </wa-dropdown-item>`:b}
      ${e.absolutePath?x`<wa-dropdown-item class="session-menu__item">
              <span slot="icon" class="session-menu__icon" aria-hidden="true"
                >${y.externalLink}</span
              >
              <span class="session-menu__text">${m(`chat.sessionDiff.openInEditor`)}</span>
              ${Ce.map(e=>x`<wa-dropdown-item
                  slot="submenu"
                  class="session-menu__item"
                  value=${`open-editor:${e}`}
                >
                  <span class="session-menu__text">${ye[e]}</span>
                </wa-dropdown-item>`)}
            </wa-dropdown-item>`:b}
    `}renderViewMenu(e){return x`
      ${this.renderMenuItem(`collapse-all`,m(`chat.sessionDiff.collapseAll`))}
      ${this.renderMenuItem(`expand-all`,m(`chat.sessionDiff.expandAll`))}
      <div class="session-menu__separator" role="separator"></div>
      ${this.renderMenuItem(`toggle-wrap`,m(e.wrap?`chat.sessionDiff.disableWrapping`:`chat.sessionDiff.enableWrapping`))}
      ${this.renderMenuItem(`toggle-split`,m(e.split?`chat.sessionDiff.switchUnified`:`chat.sessionDiff.switchSplit`))}
    `}renderScopeMenu(e){let t=e.active.scope===`commit`?e.active.commit:null;return x`
      ${this.renderMenuItem(`scope:all`,m(`chat.sessionDiff.allChanges`),e.active.scope===`all`)}
      ${this.renderMenuItem(`scope:uncommitted`,m(`chat.sessionDiff.uncommitted`),e.active.scope===`uncommitted`)}
      ${e.result.commits?.length?x`<div class="session-menu__separator" role="separator"></div>
              ${e.result.commits.map((e,n)=>this.renderMenuItem(`scope:commit:${e.sha}`,x`<span class="session-diff-menu__sha">${e.sha}</span>
                    <span class="session-diff-menu__subject">${e.subject}</span>
                    ${n===0?x`<span class="session-diff-menu__head"
                            >${m(`chat.sessionDiff.head`)}</span
                          >`:b}`,t===e.sha))}`:b}
      ${e.result.mergeBase?x`<div class="session-menu__separator" role="separator"></div>
              <div class="session-diff-menu__merge-base">
                <span>${m(`chat.sessionDiff.mergeBase`)}</span>
                <span class="session-diff-menu__sha">${e.result.mergeBase.sha}</span>
                <span class="session-diff-menu__subject">${e.result.mergeBase.subject}</span>
              </div>`:b}
    `}renderMenuItem(e,t,n){return x`<wa-dropdown-item
      class=${n===void 0?`session-menu__item`:`session-menu__item session-diff-menu__scope-item`}
      value=${e}
      role=${n===void 0?b:`menuitemradio`}
      aria-checked=${n===void 0?b:String(n)}
    >
      <span class="session-menu__text">${t}</span>
      ${n?x`<span slot="details" class="session-menu__check" aria-hidden="true"
              >${y.check}</span
            >`:b}
    </wa-dropdown-item>`}renderSyncMenu(e){return x`<div class="session-diff-menu__sync">
      <strong>${m(`chat.sessionDiff.syncLocally`)}</strong>
      <p>${m(`chat.sessionDiff.syncDescription`)}</p>
      ${this.renderCopyRow(e.command,m(`chat.sessionDiff.copyCommand`),!0)}
      ${this.renderCopyRow(e.root,m(`chat.sessionDiff.checkoutPath`))}
      ${this.renderCopyRow(e.branch,m(`chat.sessionDiff.branchName`))}
      <p class="session-diff-menu__note">${m(`chat.sessionDiff.uncommittedStay`)}</p>
    </div>`}renderCopyRow(e,t,n=!1){return x`<div class="session-diff-menu__copy-row ${n?`is-command`:``}">
      <span class="session-diff-menu__copy-label">${t}</span>
      <code title=${e}>${e}</code>
      ${Ke(e,t)}
    </div>`}render(){let e=this.menu;if(!e)return b;let t=e.kind===`scope`?e.placement??`top-start`:`bottom-end`,n=e.kind===`sync`?360:e.kind===`scope`?340:240,r=e.kind===`file`?m(`chat.sessionDiff.fileActions`,{path:e.path}):e.kind===`scope`?m(`chat.sessionDiff.scopeMenu`):e.kind===`sync`?m(`chat.sessionDiff.syncLocally`):m(`chat.sessionDiff.viewOptions`),i=Math.max(8,Math.min(e.anchor.x,window.innerWidth-8)),a=Math.max(8,Math.min(e.anchor.y,window.innerHeight-8));return x`<wa-dropdown
      class="session-menu session-diff-menu session-diff-menu--${e.kind}"
      style=${`--session-diff-menu-width:${n}px`}
      .open=${!0}
      placement=${t}
      .distance=${4}
      aria-label=${r}
      @wa-select=${this.handleSelect}
      @wa-after-hide=${this.handleAfterHide}
    >
      <button
        slot="trigger"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        style="position:fixed;left:${i}px;top:${a}px;width:1px;height:1px;opacity:0;pointer-events:none"
      ></button>
      ${e.kind===`file`?this.renderFileMenu(e):e.kind===`scope`?this.renderScopeMenu(e):e.kind===`sync`?this.renderSyncMenu(e):this.renderViewMenu(e)}
    </wa-dropdown>`}},j([w({attribute:!1})],Y.prototype,`menu`,void 0),j([w({attribute:!1})],Y.prototype,`onAction`,void 0),j([w({attribute:!1})],Y.prototype,`onClose`,void 0),customElements.get(`zero-session-diff-menu`)||customElements.define(`zero-session-diff-menu`,Y)})))()}function fn(e){let t=[];for(let n=0;n<e.length;){let r=e[n];if(!r)break;if(r.kind!==`add`&&r.kind!==`del`){t.push({kind:`span`,line:r}),n+=1;continue}let i=[],a=[];for(;n<e.length;){let t=e[n];if(t?.kind===`del`)i.push(t);else if(t?.kind===`add`)a.push(t);else break;n+=1}let o=Math.max(i.length,a.length);for(let e=0;e<o;e+=1)t.push({kind:`pair`,...i[e]?{left:i[e]}:{},...a[e]?{right:a[e]}:{}})}return t}function pn(e,t,n){let r=t===`left`?`-`:`+`;return x`<div
    class="session-diff-split__side session-diff-split__side--${t} ${e?`session-diff-split__side--filled`:``}"
  >
    <span class="session-diff-split__gutter">${e?.lineNo??``}</span>
    <span class="session-diff-split__sign">${e?r:``}</span>
    <span class="session-diff-split__text">${e?n(e):``}</span>
  </div>`}function mn(e,t,n){let r=fn(e);return Ft(e,n,e=>x`<div
      class="session-diff-split code-highlight"
      role="figure"
      aria-label=${m(`chat.toolCards.fileChanges`)}
    >
      ${r.map(n=>n.kind===`pair`?x`<div class="session-diff-split__row session-diff-split__row--pair">
            ${pn(n.left,`left`,e)}
            ${pn(n.right,`right`,e)}
          </div>`:n.line.kind===`skip`?x`<div class="session-diff-split__row session-diff-split__row--skip">
            ${(t(n.line)??n.line.text)||`⋯`}
          </div>`:x`<div class="session-diff-split__row session-diff-split__row--context">
          <span class="session-diff-split__gutter">${n.line.lineNo??``}</span>
          <span class="session-diff-split__sign"></span>
          <span class="session-diff-split__text">${e(n.line)}</span>
        </div>`)}
    </div>`)}function hn(){return(hn=e((()=>{S(),c(),jt()})))()}function gn(){try{let e=JSON.parse(a()?.getItem(X)??`null`);return{split:e?.split===!0,wrap:e?.wrap===!0}}catch{return{split:!1,wrap:!1}}}function _n(e){try{a()?.setItem(X,JSON.stringify(e))}catch{}}function vn(e){let t=Math.min(e.additions,e.deletions);return{added:e.additions-t,removed:e.deletions-t,modified:t}}function yn(e){return e.reduce((e,t)=>{let n=vn(t);return e.added+=n.added,e.removed+=n.removed,e.modified+=n.modified,e},{added:0,removed:0,modified:0})}function bn(e){let t=e.replaceAll(`\\`,`/`),n=t.lastIndexOf(`/`);return n<0?{directory:``,name:t}:{directory:t.slice(0,n),name:t.slice(n+1)}}function xn(e){return/^[A-Za-z0-9_./:@+-]+$/.test(e)?e:`'${e.replaceAll(`'`,`'\\''`)}'`}var X,Z,Q;function Sn(){return(Sn=e((()=>{Ne(),S(),C(),T(),Pe(),_(),It(),c(),ne(),sn(),un(),A(),f(),s(),At(),dn(),hn(),X=`zero.control.sessionDiff.v1`,Z={added:[`A`,`chat.sessionDiff.statusAdded`],deleted:[`D`,`chat.sessionDiff.statusDeleted`],renamed:[`R`,`chat.sessionDiff.statusRenamed`],modified:[`M`,`chat.sessionDiff.statusModified`]},Q=class extends d{constructor(){super(),this.owner=null,this.execNode=null,this.loader=null,this.loadFileText=null,this.openFile=null,this.revealFile=null,this.collapsedPaths=new Set,this.menu=null,this.scope={scope:`all`},this.split=gn().split,this.wrap=gn().wrap,this.fileTextCache=new WeakMap,this.unavailableFileText=new WeakSet,this.prefetchedDiffResult=null,this.diffTask=new je(this,{args:()=>[this.loader,this.owner,this.scope],task:async([e,t,n])=>{if(!e)return null;let r=this.prefetchedDiffResult??await e(n);return this.prefetchedDiffResult=null,{owner:t,scope:n,result:r,views:r.files.map(e=>({file:e,parsed:e.patch?cn(e.patch,e=>m(`chat.sessionDiff.unmodifiedLines`,{count:String(e)})):null}))}},onComplete:e=>{let t=new Set(e?.views.map(e=>e.file.path)??[]);this.collapsedPaths=new Set([...this.collapsedPaths].filter(e=>t.has(e)))}}),Ve(this,()=>{this.menu=null})}get loading(){return this.loader!==null&&this.diffTask.status===Ae.PENDING}toggleFile(e){let t=new Set(this.collapsedPaths);t.has(e)?t.delete(e):t.add(e),this.collapsedPaths=t}openAnchoredMenu(e,t,n=`bottom-end`){e.stopPropagation();let r=e.currentTarget;if(!(r instanceof HTMLElement))return;let i=r.getBoundingClientRect();this.menu={...t,...t.kind===`scope`&&n!==`bottom-end`?{placement:n}:{},anchor:{x:n.endsWith(`start`)?i.left:i.right,y:n.startsWith(`top`)?i.top:i.bottom},trigger:r}}handleMenuAction(e){switch(e.kind){case`collapse-all`:{let e=this.diffTask.value?.views??[];this.collapsedPaths=new Set(e.map(e=>e.file.path));return}case`expand-all`:this.collapsedPaths=new Set;return;case`toggle-wrap`:case`toggle-split`:{let t=e.kind===`toggle-wrap`?`wrap`:`split`;this[t]=!this[t],_n({split:this.split,wrap:this.wrap});return}case`scope`:JSON.stringify(e.value)!==JSON.stringify(this.scope)&&(this.scope=e.value);return;case`open-file`:this.openFile?.(e.path);return;case`reveal-file`:this.revealFile?.(e.path);return;case`open-editor`:be(e.editor,e.path)}}renderSummary(e){let t=e.baseRef&&e.branch&&e.baseRef!==e.branch?`${e.baseRef} → ${e.branch}`:e.branch??e.baseRef??``,n=e.root&&e.branch?`git fetch ${xn(e.root)} ${xn(e.branch)} && git checkout FETCH_HEAD`:null;return x`
      <div class="session-diff__summary">
        <span
          class="session-diff__branch"
          title=${[t,e.root].filter(Boolean).join(`
`)}
        >
          ${y.gitBranch}
          <span class="session-diff__branch-label">${t}</span>
        </span>
        ${e.unavailableReason===`workspace_stopped`?b:Dt(yn(e.files))}
        <span class="session-diff__summary-spacer"></span>
        ${n&&e.root&&e.branch?x`<button
                class="btn btn--ghost btn--sm session-diff__toolbar-button"
                type="button"
                @click=${t=>this.openAnchoredMenu(t,{kind:`sync`,command:n,root:e.root,branch:e.branch})}
              >
                ${m(`chat.sessionDiff.sync`)} ${y.chevronDown}
              </button>`:b}
        <zero-tooltip .content=${m(`chat.sessionDiff.viewOptions`)}>
          <button
            class="btn btn--ghost btn--icon session-diff__toolbar-icon"
            type="button"
            aria-label=${m(`chat.sessionDiff.viewOptions`)}
            @click=${e=>this.openAnchoredMenu(e,{kind:`view`,split:this.split,wrap:this.wrap})}
          >
            ${y.moreHorizontal}
          </button>
        </zero-tooltip>
        <zero-tooltip .content=${m(`chat.sessionDiff.refresh`)}>
          <button
            class="btn btn--ghost btn--icon session-diff__refresh"
            type="button"
            aria-label=${m(`chat.sessionDiff.refresh`)}
            ?disabled=${this.loading}
            @click=${()=>void this.diffTask.run()}
          >
            ${y.refresh}
          </button>
        </zero-tooltip>
      </div>
    `}canExpandGaps(e){return this.scope.scope!==`commit`&&!!this.loadFileText&&e.file.binary!==!0&&e.parsed!==null&&!e.parsed.truncated&&!this.unavailableFileText.has(e)}loadFileLines(e){let t=this.fileTextCache.get(e);if(t)return t;let n=this.loadFileText,r=n?n(e.file.path).then(e=>e===null?null:xe(e)).catch(()=>null):Promise.resolve(null);return this.fileTextCache.set(e,r),r}async expandGap(e,t,n){let r=e.parsed,i=this.loader;if(!r||!t.gap||!i||!this.canExpandGaps(e))return;let a=this.scope,o;try{o=await i(a)}catch{return}if(this.loader!==i||this.scope!==a||!this.diffTask.value?.views.includes(e))return;let s=o.files.find(t=>t.path===e.file.path);if(!s||s.patch!==e.file.patch){this.fileTextCache.delete(e),this.prefetchedDiffResult=o,await this.diffTask.run();return}let c=await this.loadFileLines(e),l=c&&this.diffTask.value?.views.includes(e)?rn(r.lines,t.gap,c,n,e=>m(`chat.sessionDiff.unmodifiedLines`,{count:String(e)})):null;l?r.lines=l:this.unavailableFileText.add(e),this.requestUpdate()}renderGap(e,t){let n=t.gap;if(!n||!this.canExpandGaps(e))return t.text;let r=n.count<=25?n.count:20;return x`<span class="session-diff__gap-controls">
      ${[[`up`,`expandPreviousLines`,y.chevronUp],[`all`,`expandAllLines`,t.text],[`down`,`expandNextLines`,y.chevronDown]].map(([i,a,o])=>x`<button
          class=${i===`all`?`session-diff__gap-count`:b}
          type="button"
          aria-label=${m(`chat.sessionDiff.${a}`,{count:String(i===`all`?n.count:r)})}
          @click=${()=>void this.expandGap(e,t,i)}
        >
          ${o}
        </button>`)}
    </span>`}renderFileBody(e,t){let{file:n,parsed:r}=e;if(n.binary===!0||!r)return x`<div class="session-diff__note">
        ${m(n.binary===!0?`chat.sessionDiff.binaryFile`:t.unavailableReason===`workspace_stopped`?`chat.sessionDiff.workspaceStoppedFile`:`chat.sessionDiff.previewUnavailable`)}
      </div>`;let i=t=>this.renderGap(e,t);return x`
      ${this.split?mn(r.lines,i,n):kt(r.lines,`succeeded`,i,n)}
      ${r.truncated?x`<div class="session-diff__note">${m(`chat.sessionDiff.truncatedFile`)}</div>`:b}
    `}renderFile(e,t){let{file:n}=e,r=this.collapsedPaths.has(n.path),{directory:i,name:a}=bn(n.path),o=t.root?Be({root:t.root,path:n.path},this.execNode)??void 0:void 0,s=n.oldPath?`${n.oldPath} → ${n.path}`:n.path,[c,l]=Z[n.status]??Z.modified;return x`
      <section class="session-diff__file" data-status=${n.status}>
        <div class="session-diff__file-header">
          <button
            class="session-diff__file-toggle"
            type="button"
            aria-expanded=${String(!r)}
            title=${s}
            @click=${()=>this.toggleFile(n.path)}
          >
            <span class="session-diff__chevron ${r?``:`session-diff__chevron--open`}">
              ${y.chevronRight}
            </span>
            <span
              class="session-diff__status session-diff__status--${n.status}"
              title=${m(l)}
              >${c}</span
            >
            <span class="session-diff__path">
              ${n.oldPath?x`<span class="session-diff__old-path">${n.oldPath} →</span>`:b}
              <span class="session-diff__filename">${a}</span>
              ${i?x`<span class="session-diff__directory">${i}</span>`:b}
            </span>
            ${n.untracked===!0?x`<span class="session-diff__badge">${m(`chat.sessionDiff.untracked`)}</span>`:b}
            ${t.unavailableReason===`workspace_stopped`?b:Dt(vn(n))}
          </button>
          <button
            class="btn btn--ghost btn--icon session-diff__file-menu"
            type="button"
            aria-label=${m(`chat.sessionDiff.fileActions`,{path:n.path})}
            @click=${e=>this.openAnchoredMenu(e,{kind:`file`,path:n.path,...o?{absolutePath:o}:{},canOpenFile:!!this.openFile,canReveal:!!this.revealFile})}
          >
            ${y.moreHorizontal}
          </button>
        </div>
        ${r?b:x`<div
                class="session-diff__file-body"
                style=${`contain-intrinsic-size:auto ${Math.max(80,Math.min(12e3,(e.parsed?.lines.length??2)*19))}px`}
              >
                ${this.renderFileBody(e,t)}
              </div>`}
      </section>
    `}scopeTitle(e){let t=this.scope;if(t.scope===`uncommitted`)return m(`chat.sessionDiff.uncommitted`);if(t.scope===`commit`){let n=e.commits?.find(e=>e.sha===t.commit);return n?`${n.sha} ${n.subject}`:t.commit}return m(`chat.sessionDiff.allChanges`)}renderFooter(e){let t=e.branch??e.baseRef??m(`chat.sessionDiff.allChanges`),n=e.aheadCount&&e.baseRef?m(`chat.sessionDiff.commitsAhead`,{count:String(e.aheadCount),base:e.baseRef}):t;return x`<button
      class="session-diff__footer"
      type="button"
      aria-label=${m(`chat.sessionDiff.scopeMenu`)}
      @click=${t=>this.openAnchoredMenu(t,{kind:`scope`,active:this.scope,result:e},`top-start`)}
    >
      <span>${n}</span>${y.chevronUp}
    </button>`}renderBody(){if(this.diffTask.status===Ae.ERROR){let e=this.diffTask.error;return x`<div class="callout danger">${p(e)}</div>`}let e=this.diffTask.value;if(this.loading&&(!e||e.owner!==this.owner||e.scope!==this.scope))return Lt(`review`,m(`chat.sessionDiff.loading`));if(!e)return b;let{result:t,views:n}=e;return t.unavailableReason===`not_git`?x`<div class="session-diff__note">${m(`chat.sessionDiff.notGit`)}</div>`:t.unavailableReason===`unknown_session`?x`<div class="session-diff__note">${m(`chat.sessionDiff.unknownSession`)}</div>`:x`
      ${this.renderSummary(t)}
      ${t.unavailableReason===`workspace_stopped`?x`<div class="session-diff__note">${m(`chat.sessionDiff.workspaceStopped`)}</div>`:b}
      <button
        class="session-diff__section-title"
        type="button"
        aria-label=${m(`chat.sessionDiff.scopeMenu`)}
        @click=${e=>this.openAnchoredMenu(e,{kind:`scope`,active:this.scope,result:t},`bottom-start`)}
      >
        <span>${this.scopeTitle(t)}</span>${y.chevronDown}
      </button>
      <div class="session-diff__files">
        ${t.unavailableReason===`unknown_commit`?x`<div class="session-diff__note">${m(`chat.sessionDiff.unknownCommit`)}</div>`:t.files.length===0?t.unavailableReason===`workspace_stopped`||t.truncated===!0?b:x`<div class="session-diff__note">${m(`chat.sessionDiff.empty`)}</div>`:n.map(e=>this.renderFile(e,t))}
        ${t.truncated===!0?x`<div class="session-diff__note">${m(`chat.sessionDiff.truncatedResult`)}</div>`:b}
      </div>
      ${this.renderFooter(t)}
    `}render(){return x`
      <div
        class="session-diff ${this.wrap?`session-diff--wrap`:``}"
        aria-busy=${String(this.loading)}
      >
        ${this.renderBody()}
        ${this.menu?E(this.menu,x`<zero-session-diff-menu
                  .menu=${this.menu}
                  .onAction=${e=>this.handleMenuAction(e)}
                  .onClose=${()=>{this.menu=null}}
                ></zero-session-diff-menu>`):b}
      </div>
    `}},j([w({attribute:!1})],Q.prototype,`owner`,void 0),j([w({attribute:!1})],Q.prototype,`execNode`,void 0),j([w({attribute:!1})],Q.prototype,`loader`,void 0),j([w({attribute:!1})],Q.prototype,`loadFileText`,void 0),j([w({attribute:!1})],Q.prototype,`openFile`,void 0),j([w({attribute:!1})],Q.prototype,`revealFile`,void 0),j([O()],Q.prototype,`collapsedPaths`,void 0),j([O()],Q.prototype,`menu`,void 0),j([O()],Q.prototype,`scope`,void 0),j([O()],Q.prototype,`split`,void 0),j([O()],Q.prototype,`wrap`,void 0),customElements.get(`zero-session-diff`)||customElements.define(`zero-session-diff`,Q)})))()}function Cn(e,t,n,r,i){if(e.download&&i)return x`${L({kind:`document`,label:e.title,mimeType:e.mimeType??void 0,sizeBytes:e.sizeBytes,onDownload:i.onDownload,downloadPending:i.pending})}${i.error?x`<div role="alert">${i.error}</div>`:b}`;let a=e.resolveSource?.(t,n),o=a?a.status===`ready`?a:null:e,s=e.mimeType?.split(`;`,1)[0]?.trim().toLowerCase()??``,c=e.attachmentKind===`video`||s.startsWith(`video/`)?`video`:e.attachmentKind===`audio`||s.startsWith(`audio/`)?`audio`:e.attachmentKind===`image`||s.startsWith(`image/`)?`image`:`document`,l=(e.plainText?dt:c===`audio`||c===`video`?et:it)(o?.src??``),u=o?.authToken??null,d=a?.status===`pending`,ee=(s===`image/svg+xml`||(!s||s===`application/octet-stream`)&&(F(e.sourceIdentity??``,void 0)||F(l??``,void 0)||F(e.title,void 0)))&&R(l??``),f=(l||d)&&!ee&&c===`image`;if((l||d)&&c===`document`&&Xt(s,e.title)&&!R(l??``))return x`<zero-chat-pdf-preview
      .src=${l??``}
      .sourceIdentity=${[n.connectionEpoch??``,n.agentId??``,n.sessionKey??``,e.sourceIdentity??l??``].join(`\0`)}
      .label=${e.title}
      .mimeType=${e.mimeType??``}
      .sizeBytes=${o?.sizeBytes??e.sizeBytes}
    ></zero-chat-pdf-preview>`;if((l||d)&&$t(s,e.title)&&!R(l??``))return x`<zero-chat-text-attachment
      .plainText=${e.plainText??!1}
      .actions=${e.renderActions?.()??b}
      .embedSandboxMode=${r}
      .src=${l??``}
      .sourceIdentity=${[n.connectionEpoch??``,n.agentId??``,n.sessionKey??``,e.sourceIdentity??l??``].join(`\0`)}
      .label=${e.title}
      .mimeType=${e.mimeType??``}
      .sizeBytes=${o?.sizeBytes??e.sizeBytes}
    ></zero-chat-text-attachment>`;if(c===`video`&&(l||d))return x`<zero-chat-video-player
      .src=${l??``}
      .preview=${!0}
      .sourceIdentity=${e.sourceIdentity??e.src??l??``}
      .label=${e.title}
      .mimeType=${e.mimeType??``}
      .playback=${o?.playback??e.playback??`native`}
      .authToken=${u}
      .sizeBytes=${o?.sizeBytes??e.sizeBytes}
      .mediaWidth=${o?.width??e.width}
      .mediaHeight=${o?.height??e.height}
    ></zero-chat-video-player>`;if(!l||f){let t=o?.width??e.width,n=o?.height??e.height;return x`
      <div
        class="chat-assistant-attachment-card chat-assistant-attachment-card--${c} sidebar-attachment-preview__state-card"
        aria-busy=${d?`true`:b}
      >
        ${tt({kind:c,label:e.title,mimeType:e.mimeType??void 0,sizeBytes:o?.sizeBytes??e.sizeBytes,downloadHref:l??void 0,downloadPending:d,visualMode:`preview-with-favicon`})}
        <div
          class="sidebar-attachment-preview__state"
          style=${me({"--preview-ratio":t&&n?`${t} / ${n}`:void 0})}
        >
          ${d||f?z():b}
          ${f&&l?E(l,x`<img
                    class="sidebar-attachment-preview__image"
                    src=${l}
                    alt=${e.title}
                    .onload=${function(){this.dataset.preview=`ready`}}
                    .onerror=${function(){this.dataset.preview=`error`}}
                  />`):b}
          ${d?b:x`<div class="sidebar-attachment-preview__unavailable">
                  ${m(`chat.attachments.previewUnavailable`)}
                  ${a?.status===`error`?x`<span>${a.reason}</span>`:b}
                  ${(a?.status===`error`||a?.status===`unavailable`)&&a.onRetry?x`<button class="btn btn--sm" type="button" @click=${a.onRetry}>
                          ${m(`common.retry`)}
                        </button>`:b}
                </div>`}
        </div>
      </div>
    `}return c===`audio`?x`<zero-chat-audio-player
      .src=${l}
      .sourceIdentity=${e.sourceIdentity??e.src??l}
      .label=${e.title}
      .mimeType=${e.mimeType??``}
      .playback=${o?.playback??e.playback??`native`}
      .authToken=${u}
      .sizeBytes=${o?.sizeBytes??e.sizeBytes}
      .serverDurationMs=${o?.durationMs??e.durationMs}
      .voiceNote=${e.voiceNote===!0}
    ></zero-chat-audio-player>`:L({kind:e.attachmentKind??`document`,label:e.title,mimeType:e.mimeType??void 0,sizeBytes:o?.sizeBytes??e.sizeBytes,downloadHref:l})}function wn(e){if(!e)return null;let t=e.kind===`markdown`||e.kind===`file`,n=e.rawText??(t?e.content:``);return!t&&!n.trim()?null:{kind:`markdown`,content:yt(n,e.kind===`file`?e.language:t?void 0:`json`),rawText:n,...t?{fileLinkSessionKey:e.kind===`file`?e.sessionFileSource?.sessionKey:e.fileLinkSessionKey}:{}}}function Tn(e){let t=e.content,n=(t=`btn`,n)=>x`<button
    @click=${e.onViewRawText}
    class=${t}
    type="button"
    style=${n??b}
  >
    ${m(`chat.detailPanel.viewRawText`)}
  </button>`,r=t?.kind===`markdown`&&t.content.trim()?We(t.content,{codeBlockInteraction:`interactive`,fileLinks:!0,githubRepo:e.githubRepo??null,githubRepositories:e.githubRepositories,interactiveImages:e.onOpenImage!==void 0,sessionLinks:!0}):``,i=t?.kind===`canvas`?bt(e.embedSandboxMode??`scripts`,t.sandbox):``,a=t?.kind===`canvas`?xt(t.entryUrl,e.canvasPluginSurfaceUrl,e.allowExternalEmbedUrls??!1):null,o=t?.kind===`mcp-app`?t.title:t?.kind===`canvas`?t.title?.trim()||m(`chat.detailPanel.renderPreview`):t?.kind===`image`?t.title.trim()||m(`chat.detailPanel.imagePreview`):t?.kind===`attachment`?t.title.trim()||m(`chat.detailPanel.file`):t?.kind===`file`?t.name.trim()||m(`chat.detailPanel.file`):t?.kind===`session-diff`?m(`chat.sessionDiff.title`):t?.kind===`markdown`?m(e.showingRawText?`chat.detailPanel.viewSource`:`chat.detailPanel.markdownPreview`):m(`chat.detailPanel.toolDetails`);return x`
    <div
      class="sidebar-panel"
      data-file-session-key=${t?.kind===`markdown`?t.fileLinkSessionKey??b:t?.kind===`file`?t.sessionFileSource?.sessionKey??b:b}
    >
      ${e.embedded?b:x`<div class="sidebar-header">
              <div class="sidebar-title">${o}</div>
              <div class="sidebar-header__actions">
                <zero-tooltip .content=${m(`chat.detailPanel.close`)}>
                  <button
                    @click=${e.onClose}
                    class="btn"
                    type="button"
                    aria-label=${m(`chat.detailPanel.close`)}
                  >
                    ${y.x}
                  </button>
                </zero-tooltip>
              </div>
            </div> `}
      <div class="sidebar-content">
        ${e.error?x`
                ${v({error:e.error,stale:h(e.error),onRetry:e.onRetry})}
                ${t?.kind===`file`||t?.rawText?.trim()?n(`btn`,`margin-top: 12px;`):b}
              `:t?t.kind===`mcp-app`?x`<zero-mcp-app-panel .launch=${t.launch}></zero-mcp-app-panel>`:t.kind===`file`?Tt(t,e.onViewRawText,e.fileView,e.attachmentRuntime):t.kind===`session-diff`?x`<zero-session-diff
                        .owner=${t.owner}
                        .loader=${t.load}
                        .loadFileText=${t.loadFileText??null}
                        .execNode=${e.fileView?.execNode??null}
                        .openFile=${t.openFile??null}
                        .revealFile=${e.fileView?.onReveal??null}
                      ></zero-session-diff>`:t.kind===`canvas`||t.kind===`image`?E(t.kind,x`
                            <div class="chat-tool-card__preview" data-kind=${t.kind}>
                              <div class="chat-tool-card__preview-panel" data-side="front">
                                ${t.kind===`canvas`?E(`${i}\u0000${a??``}\u0000${t.preferredHeight??``}`,x`<iframe
                                          class="chat-tool-card__preview-frame"
                                          title=${o}
                                          sandbox=${i}
                                          src=${a??b}
                                          style=${t.preferredHeight?`height:${t.preferredHeight}px`:``}
                                        ></iframe>`):x`<button
                                        type="button"
                                        class="chat-tool-card__preview-image-button"
                                        aria-label=${m(`chat.imageLightbox.open`,{title:o})}
                                        @click=${()=>lt(e.onOpenImage,t.src,o)}
                                      >
                                        <img
                                          class="chat-tool-card__preview-image"
                                          src=${t.src}
                                          alt=${o}
                                          style="display:block;max-width:100%;height:auto;border-radius:8px;"
                                        />
                                      </button>`}
                              </div>
                              ${t.rawText?.trim()?x`
                                      <div style="margin-top: 12px;">${n()}</div>
                                    `:b}
                            </div>
                          `):t.kind===`attachment`?x`<div class="sidebar-attachment-preview">
                            ${Cn(t,e.onAttachmentUpdate,e.attachmentRuntime,e.embedSandboxMode??`scripts`,e.attachmentDownload)}
                          </div>`:x`
                            <section class="sidebar-markdown-shell">
                              <div class="sidebar-markdown-shell__toolbar">
                                <div class="sidebar-markdown-shell__intro">
                                  <div class="sidebar-markdown-shell__eyebrow">
                                    ${y.scrollText}
                                    <span
                                      >${m(e.showingRawText?`chat.detailPanel.viewSource`:`chat.detailPanel.renderedMarkdown`)}</span
                                    >
                                  </div>
                                  ${e.showingRawText?b:x`
                                          <div class="sidebar-markdown-shell__hint">
                                            ${m(`chat.detailPanel.renderedMarkdownHint`)}
                                          </div>
                                        `}
                                </div>
                                ${e.showingRawText?b:n(`btn btn--sm`)}
                              </div>
                              ${r?x`
                                      <article
                                        class="sidebar-markdown-reader sidebar-markdown"
                                        dir=${gt(t.content)}
                                      >
                                        ${ke(r)}
                                      </article>
                                    `:x`
                                      <div class="sidebar-markdown-empty">
                                        ${m(`chat.detailPanel.noPreviewableMarkdown`)}
                                      </div>
                                    `}
                            </section>
                          `:x` <div class="muted">${m(`chat.detailPanel.noContent`)}</div> `}
      </div>
    </div>
  `}function En(e){let t=e.content?.kind===`file`||e.content?.kind===`markdown`||e.content?.kind===`attachment`||e.content?.kind===`session-diff`;return x`
    <div
      class=${t?`sidebar-panel-host--fill`:``}
      ${e.content?.kind===`attachment`?b:zt()}
      @click=${e.onClick}
      @keydown=${e.onKeydown}
    >
      ${Tn(e)}
    </div>
  `}function Dn(e,t){if(at(e,t.onOpenImage??void 0))return;He(e);let r=Ue(e);if(r){t.onOpenWorkspaceFile?.(r);return}let i=Fe(e,t.basePath);i&&n(e)&&(e.preventDefault(),t.onOpenSessionLink?.(i))}function On(e,t){let n=Le(e);if(n){t.onOpenWorkspaceFile?.(n);return}let r=Je(e,t.basePath);r&&t.onOpenSessionLink?.(r)}function kn(){return(kn=e((()=>{S(),T(),pe(),Me(),g(),_(),ae(),Rt(),Re(),Ie(),Ye(),$e(),ne(),c(),V(),St(),ct(),ot(),I(),st(),nt(),vt(),Yt(),ht(),ft(),Qt(),Ot(),en(),Sn(),B()})))()}var $;function An(){return(An=e((()=>{Oe(),C(),Pe(),g(),c(),V(),A(),f(),s(),Vt(),Ut(),Et(),W(),rt(),kn(),Ot(),M(),B(),$=class extends d{constructor(){super(),this.content=null,this.fileNavigation=null,this.execNode=null,this.attachmentRuntime={},this.basePath=``,this.canvasPluginSurfaceUrl=null,this.embedSandboxMode=`scripts`,this.allowExternalEmbedUrls=!1,this.githubContext={},this.embedded=!1,this.onOpenWorkspaceFile=null,this.onOpenSessionLink=null,this.onRevealInWorkspace=null,this.onOpenImage=null,this.visibleContent=null,this.error=null,this.fileSearchOpen=!1,this.fileWrap=Nt(),this.fileSearchQuery=``,this.fileSearchMatchIndex=0,this.fileEditorMenuOpen=!1,this.fileCopy=new Ht(this,()=>this.visibleContent),this.fileEditorLoading=!1,this.fileEditing=!1,this.fileDirty=!1,this.fileReloading=!1,this.fileSaving=!1,this.fileSaveNotice=null,this.htmlPreview=new Kt(this,()=>this.visibleContent,()=>this.currentFileText()),this.fileOperationVersion=0,this.rawView=null,this.fileEditor=null,this.fileEditorLoad=null,this.fileDraftContent=null,this.fileSavedContent=``,this.fileHash=``,this.requestAttachmentUpdate=()=>this.requestUpdate(),this.attachmentDownload=new Bt(this,()=>this.content===this.visibleContent?this.content:null,()=>this.attachmentRuntime),this.toggleHtmlSource=()=>{this.fileSearchOpen=!1,this.htmlPreview.toggle()},this.retryFileEditor=()=>{let e=this.error,t=this.fileOperationVersion;h(e)?le({canReload:()=>this.isConnected&&this.error===e&&t===this.fileOperationVersion}):this.error=null},this.handleDocumentPointerDown=e=>{if(!this.fileEditorMenuOpen)return;let t=this.querySelector(`.sidebar-file-view__editor`);(!t||!e.composedPath().includes(t))&&(this.fileEditorMenuOpen=!1)},this.toggleFileWrap=()=>{this.fileWrap=!this.fileWrap,Ct(this.fileWrap)},this.toggleFileSearch=()=>{if(this.htmlPreview.showSource(),this.fileSearchOpen=!this.fileSearchOpen,this.fileEditorMenuOpen=!1,!this.fileSearchOpen){this.fileSearchQuery=``,this.fileSearchMatchIndex=0;return}this.updateComplete.then(()=>{this.querySelector(`.file-view__search input`)?.focus()})},this.updateFileSearch=e=>{this.fileSearchQuery=e,this.fileSearchMatchIndex=0,this.scrollToCurrentFileMatch()},this.handleFileSearchKeydown=e=>{if(e.key===`Escape`){e.preventDefault(),e.stopPropagation(),this.toggleFileSearch(),this.querySelector(`.sidebar-file-view__search-toggle`)?.focus({preventScroll:!0});return}e.key===`Enter`&&e.target instanceof HTMLInputElement&&(e.preventDefault(),this.moveFileSearch(e.shiftKey?-1:1))},this.openInEditor=e=>{let t=this.visibleContent;if(t?.kind!==`file`)return;let n=Be(t,this.execNode);n&&(this.fileEditorMenuOpen=!1,be(e,n,this.fileNavigation?.line??t.line))},this.editFile=async()=>{let e=this.visibleContent;if(e?.kind===`file`&&e.edit&&(this.htmlPreview.showSource(),await this.updateComplete,await this.ensureFileEditor(),this.visibleContent===e&&this.fileEditor)){if(this.fileEditing){this.fileEditor.focus();return}this.fileSavedContent=e.content,this.fileHash=e.edit.hash,this.fileDirty=!1,this.fileSaveNotice=null,this.fileSearchOpen=!1,this.fileSearchQuery=``,this.fileSearchMatchIndex=0,this.fileEditorMenuOpen=!1,this.fileEditing=!0,this.fileEditor.setEditable(!0),this.updateComplete.then(()=>this.fileEditor?.focus())}},this.discardFileEdits=()=>{if(!this.fileEditing||this.fileSaving)return;this.fileEditor?.setContent(this.fileSavedContent),this.fileDraftContent=null,this.htmlPreview.discard(this.fileSavedContent);let e=this.visibleContent;e?.kind===`file`&&(H(e,null),this.fileHash=e.edit?.hash??``),this.fileDirty=!1,this.fileSaveNotice=null,this.fileEditing=!1,this.fileEditor?.setEditable(!1)},this.saveFile=()=>{let e=this.visibleContent;if(e?.kind!==`file`||!e.edit||!this.fileEditing||!this.fileDirty||this.fileSaving)return;let t=this.fileOperationVersion;this.fileSaving=!0,this.fileSaveNotice=null,this.trackFileOperation(this.saveFileContent(e,this.currentFileText(),this.fileHash,t),t)},this.reloadFile=()=>this.startLatestFileOperation(`reload`),this.overwriteFile=()=>this.startLatestFileOperation(`overwrite`),this.close=()=>{this.dispatchEvent(new CustomEvent(`chat-detail-panel-close`,{bubbles:!0}))},this.showRawText=()=>{if(this.htmlPreview.file){this.htmlPreview.showSource();return}let e=wn(this.visibleContent);e&&(this.rawView={file:this.visibleContent?.kind===`file`?this.visibleContent:null},this.destroyFileEditor(),this.visibleContent=e,this.error=null)},this.handlePanelClick=e=>{Dn(e,this)},this.handlePanelKeyDown=e=>{On(e,this)},Ve(this)}connectedCallback(){super.connectedCallback(),document.addEventListener(`pointerdown`,this.handleDocumentPointerDown)}disconnectedCallback(){this.attachmentDownload.cancel(),document.removeEventListener(`pointerdown`,this.handleDocumentPointerDown),this.fileDirty&&(this.fileDraftContent=this.currentFileText()),this.destroyFileEditor(),P(this.requestAttachmentUpdate),super.disconnectedCallback()}willUpdate(e){let t=e.get(`attachmentRuntime`);if(t&&typeof t==`object`&&`connectionEpoch`in t&&t.connectionEpoch!==this.attachmentRuntime.connectionEpoch&&(P(this.requestAttachmentUpdate),this.attachmentDownload.cancel()),e.has(`fileNavigation`)&&this.fileNavigation&&this.content?.kind===`file`&&this.htmlPreview.showSource(),!e.has(`content`)){if(e.has(`fileNavigation`)&&this.fileNavigation&&this.content?.kind===`file`&&this.rawView){let e=this.rawView.file??this.content;this.rawView=null,this.visibleContent=e}return}P(this.requestAttachmentUpdate),this.attachmentDownload.cancel(),this.visibleContent=this.content,this.error=null,this.rawView=null,this.fileSearchOpen=!1,this.fileSearchQuery=``,this.fileSearchMatchIndex=0,this.fileEditorMenuOpen=!1,this.fileCopy.reset(),this.fileOperationVersion+=1,this.fileReloading=!1,this.fileSaving=!1,this.fileSaveNotice=null;let n=this.content?.kind===`file`&&this.content.edit?wt(this.content):void 0,r=this.content?.kind===`file`&&n?.content!==this.content.content?n:void 0;n&&!r&&this.content?.kind===`file`&&H(this.content,null),this.fileDraftContent=r?.content??null,this.fileSavedContent=this.content?.kind===`file`?this.content.content:``,this.fileHash=r?.expectedHash??(this.content?.kind===`file`?this.content.edit?.hash??``:``),this.fileEditing=!!r,this.fileDirty=!!r,this.htmlPreview.reset(this.fileDraftContent,!!(this.fileNavigation||this.content?.kind===`file`&&this.content.line!=null)),this.fileEditorLoading=this.content?.kind===`file`&&!this.htmlPreview.showing,this.destroyFileEditor()}updated(e){let t=this.visibleContent;t?.kind===`file`&&!this.rawView&&!this.htmlPreview.showing&&!this.error&&this.ensureFileEditor().then(()=>{this.syncFileEditor(),(e.has(`content`)||e.has(`fileNavigation`))&&(this.fileNavigation?.line??t.line)!=null&&this.scrollToFileLine(t)})}currentFileText(){return this.fileEditor?.getContent()??this.fileDraftContent??(this.visibleContent?.kind===`file`?this.visibleContent.content:``)}scrollToFileLine(e){let t=this.fileNavigation?.line??e.line;this.visibleContent===e&&!this.rawView&&t!=null&&this.fileEditor?.scrollToLine(t,!0)}destroyFileEditor(){this.fileOperationVersion+=1,this.fileEditor?.destroy(),this.fileEditor=null,this.fileEditorLoad=null}ensureFileEditor(){if(this.fileEditor)return Promise.resolve();if(this.fileEditorLoad)return this.fileEditorLoad;let e=this.visibleContent,t=this.querySelector(`.file-view__mount`);if(e?.kind!==`file`||!t||this.htmlPreview.showing)return Promise.resolve();let n=this.fileOperationVersion;return this.fileEditorLoading=!0,this.fileEditorLoad=N(async()=>{let{createFileEditorView:e}=await import(`./file-editor-view-BnD1Sr5H.js`);return{createFileEditorView:e}},__vite__mapDeps([27,28,29,1,2,17]),import.meta.url).then(async({createFileEditorView:e})=>{let r=this.visibleContent;if(n!==this.fileOperationVersion||r?.kind!==`file`)return;let i=await e({parent:t,content:this.fileDraftContent??r.content,name:r.name,editable:this.fileEditing,wrap:this.fileWrap,onSave:this.saveFile});if(n!==this.fileOperationVersion||!this.isConnected||this.visibleContent?.kind!==`file`){i.destroy();return}i.setContent(this.currentFileText()),this.fileEditor=i,this.fileDraftContent=null,i.onDocChanged(e=>{let t=Mt(r,{editing:this.fileEditing&&!this.fileReloading,content:e,dirty:!i.contentEquals(this.fileSavedContent),expectedHash:this.fileHash});t&&(this.fileDirty=t.dirty,this.fileHash=t.expectedHash,this.fileSaveNotice?.kind===`error`&&(this.fileSaveNotice=null))})}).catch(e=>{n===this.fileOperationVersion&&this.isConnected&&(this.error=Te(e,m(`lazyView.errorTitle`)),h(this.error)&&re())}).finally(()=>{n===this.fileOperationVersion&&(this.fileEditorLoad=null,this.fileEditorLoading=!1)}),this.fileEditorLoad}syncFileEditor(){let e=this.visibleContent,t=this.fileEditor;if(e?.kind!==`file`||!t)return;this.fileEditing||t.setContent(e.content),t.setEditable(this.fileEditing&&!this.fileReloading),t.setLineWrapping(this.fileWrap);let n=this.fileSearchMatches();t.setDecorations({targetLine:this.fileNavigation?.line??e.line,matches:n,currentMatch:n[this.fileSearchMatchIndex]??null})}fileSearchMatches(){let e=this.visibleContent;return e?.kind===`file`?Pt(e.content,this.fileSearchQuery):[]}async scrollToCurrentFileMatch(){await this.updateComplete;let e=this.fileSearchMatches()[this.fileSearchMatchIndex];e!=null&&this.fileEditor?.scrollToLine(e,!0)}moveFileSearch(e){let t=this.fileSearchMatches();t.length!==0&&(this.fileSearchMatchIndex=(this.fileSearchMatchIndex+e+t.length)%t.length,this.scrollToCurrentFileMatch())}updateSavedFile(e,t,n){let r=this.currentFileText();this.fileSavedContent=t,this.fileHash=n,this.fileDirty=!(this.fileEditor?.contentEquals(t)??r===t),this.fileDraftContent=!this.fileEditor&&this.fileDirty?r:null,H(e,this.fileDirty?{content:r,expectedHash:n}:null),this.fileSaveNotice=null,e.content=t,e.rawText=t,e.edit&&(e.edit.hash=n)}async saveFileContent(e,t,n,r){if(!e.edit)return;let i=await e.edit.save({content:t,expectedHash:n});r===this.fileOperationVersion&&this.visibleContent?.kind===`file`&&(i.ok?this.updateSavedFile(this.visibleContent,t,i.hash):this.fileSaveNotice=i.code===`conflict`?{kind:`conflict`}:{kind:`error`,message:i.message})}startLatestFileOperation(e){let t=this.visibleContent;if(t?.kind!==`file`||!t.edit||this.fileSaving)return;let n=this.fileOperationVersion,r;if(e===`reload`)this.fileSaving=!0,this.fileReloading=!0,this.fileEditor?.setEditable(!1),r=e=>{if(n===this.fileOperationVersion&&this.visibleContent?.kind===`file`){if(!e){this.fileSaveNotice={kind:`error`,message:m(`chat.detailPanel.reloadFailed`)};return}if(this.fileEditor?.setContent(e.content),this.fileDraftContent=this.fileEditor?null:e.content,this.htmlPreview.discard(e.content),this.updateSavedFile(this.visibleContent,e.content,e.hash),!e.editable&&this.visibleContent?.kind===`file`){H(this.visibleContent,null),this.fileEditing=!1,this.fileDirty=!1;let{edit:e,...t}=this.visibleContent;this.visibleContent=t}}};else{let e=this.currentFileText();this.fileSaving=!0,r=async r=>{if(n===this.fileOperationVersion){if(!r){this.fileSaveNotice={kind:`error`,message:m(`chat.detailPanel.overwriteLoadFailed`)};return}await this.saveFileContent(t,e,r.hash,n)}}}this.trackFileOperation(t.edit.fetchLatest().then(r),n)}trackFileOperation(e,t){e.catch(e=>{t===this.fileOperationVersion&&(this.fileSaveNotice={kind:`error`,message:p(e)})}).finally(()=>{t===this.fileOperationVersion&&(this.fileSaving=!1,this.fileReloading&&(this.fileReloading=!1,this.fileEditor?.setEditable(this.fileEditing)))})}render(){let e=this.htmlPreview.file,t=this.fileSearchMatches(),n=t.length?Math.min(this.fileSearchMatchIndex,t.length-1):0;return En({content:this.visibleContent,showingRawText:!!this.rawView,error:e?null:this.error,onRetry:this.retryFileEditor,fileView:{htmlPreview:this.htmlPreview.controls({error:this.error,onRetry:this.retryFileEditor,onToggle:this.toggleHtmlSource,runtime:this.attachmentRuntime,mode:this.embedSandboxMode}),copyFeedback:this.fileCopy.feedback,currentMatchIndex:n,dirty:this.fileDirty,execNode:this.execNode,editorMenuOpen:this.fileEditorMenuOpen,editing:this.fileEditing,loadingEditor:this.fileEditorLoading,mountKey:this.fileOperationVersion,matches:t,query:this.fileSearchQuery,saveNotice:this.fileSaveNotice,saving:this.fileSaving,searchOpen:this.fileSearchOpen,wrap:this.fileWrap,onCopy:this.fileCopy.copy,onDiscard:this.discardFileEdits,onEdit:()=>void this.editFile(),onNextMatch:()=>this.moveFileSearch(1),onOpenEditor:this.openInEditor,onOverwrite:this.overwriteFile,onPreviousMatch:()=>this.moveFileSearch(-1),onReload:this.reloadFile,onReveal:this.onRevealInWorkspace??void 0,onSave:this.saveFile,onSearchInput:this.updateFileSearch,onSearchKeydown:this.handleFileSearchKeydown,onEditorMenuOpenChange:e=>{this.fileEditorMenuOpen=e},onToggleSearch:this.toggleFileSearch,onToggleWrap:this.toggleFileWrap},canvasPluginSurfaceUrl:this.canvasPluginSurfaceUrl,embedSandboxMode:this.embedSandboxMode,allowExternalEmbedUrls:this.allowExternalEmbedUrls,...this.githubContext,embedded:this.embedded,onClose:this.close,onOpenImage:this.onOpenImage??void 0,onViewRawText:this.showRawText,onClick:this.handlePanelClick,onKeydown:this.handlePanelKeyDown,onAttachmentUpdate:this.requestAttachmentUpdate,attachmentRuntime:this.attachmentRuntime,attachmentDownload:this.attachmentDownload})}},j([w({attribute:!1})],$.prototype,`content`,void 0),j([w({attribute:!1})],$.prototype,`fileNavigation`,void 0),j([w({attribute:!1})],$.prototype,`execNode`,void 0),j([w({attribute:!1})],$.prototype,`attachmentRuntime`,void 0),j([w()],$.prototype,`basePath`,void 0),j([w()],$.prototype,`canvasPluginSurfaceUrl`,void 0),j([w()],$.prototype,`embedSandboxMode`,void 0),j([w({type:Boolean})],$.prototype,`allowExternalEmbedUrls`,void 0),j([w({attribute:!1})],$.prototype,`githubContext`,void 0),j([w({type:Boolean})],$.prototype,`embedded`,void 0),j([w({attribute:!1})],$.prototype,`onOpenWorkspaceFile`,void 0),j([w({attribute:!1})],$.prototype,`onOpenSessionLink`,void 0),j([w({attribute:!1})],$.prototype,`onRevealInWorkspace`,void 0),j([w({attribute:!1})],$.prototype,`onOpenImage`,void 0),j([O()],$.prototype,`visibleContent`,void 0),j([O()],$.prototype,`error`,void 0),j([O()],$.prototype,`fileSearchOpen`,void 0),j([O()],$.prototype,`fileWrap`,void 0),j([O()],$.prototype,`fileSearchQuery`,void 0),j([O()],$.prototype,`fileSearchMatchIndex`,void 0),j([O()],$.prototype,`fileEditorMenuOpen`,void 0),j([O()],$.prototype,`fileEditorLoading`,void 0),j([O()],$.prototype,`fileEditing`,void 0),j([O()],$.prototype,`fileDirty`,void 0),j([O()],$.prototype,`fileReloading`,void 0),j([O()],$.prototype,`fileSaving`,void 0),j([O()],$.prototype,`fileSaveNotice`,void 0),customElements.get(`zero-chat-detail-panel`)||customElements.define(`zero-chat-detail-panel`,$)})))()}An();
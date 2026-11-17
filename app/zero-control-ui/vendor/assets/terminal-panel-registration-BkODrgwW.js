const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./browser-CcXA-FQa.js","./gateway-runtime-JSfC8ThO.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-core-DI-Q_yCI.css","./ghostty-web-BxM4JSE8.js"])))=>i.map(i=>d[i]);
import{n as e,r as t}from"./rolldown-runtime-8BhlS34s.js";import{Ic as n,Lc as r,Mu as i,Nu as a,Pu as o,Si as s,_u as c,bu as l,dn as u,g as d,h as f,il as p,m as ee,nl as te,un as ne,vu as re,xu as m,yu as h,zu as g}from"./control-ui-core-DCNBgr3X.js";import{Ai as ie,Ci as ae,Fi as oe,In as se,Nn as ce,Rn as le,Si as ue,Ua as de,Wa as fe,bi as pe,ca as _,ci as v,jn as me,ki as he,sa as y,si as b,ui as ge,xi as _e}from"./control-ui-core-DwX5Mpz4.js";import{D as ve,E as ye,G as x,J as S,W as C,X as be,Z as xe,at as w,k as Se,lt as T,rt as E}from"./lit-runtime-B40xFCK_.js";import{Ga as Ce,Ur as we,Wr as Te,Ya as Ee,Zr as D,go as De,ho as Oe,ma as O,pa as k,xa as ke}from"./ui-AaV6iNVa.js";import{F as Ae,M as je,N as Me,j as Ne}from"./control-ui-boot-shared-E4pYPcWx.js";import{D as A,E as Pe,H as j,O as M,S as Fe,T as Ie,U as N,b as Le,k as Re,w as ze,x as Be}from"./control-ui-boot-chat-zkzP5WWm.js";import{n as Ve,t as He}from"./scrollbar-styles-B8m1yec1.js";import{i as Ue,n as P,r as We,t as Ge}from"./panel-icon-button-CTZmNHun.js";import{a as Ke,i as qe,n as Je,r as Ye,t as F}from"./panel-tab-strip-jMGzTL7I.js";import{n as Xe,t as Ze}from"./dock-destination-controls-BdEr9ixY.js";import{n as Qe,t as $e}from"./panel-empty-state-anOYDn4d.js";import{n as I}from"./theme-color-DAo4KRoc.js";import{a as L,c as et,i as tt,l as nt,n as rt,o as R,r as it,s as z}from"./catalog-terminal-start-Dto_ldUX.js";var B,at;function V(){return(V=e((()=>{B=16777216,at=864e5,Math.ceil(B/3)*4})))()}function ot(e,t){let n=e?.trim();return!t&&n&&!p(n)?n:void 0}function st(e){return e.split(/[\\/]/).pop()?.trim()||`shell`}function H(e){let t=e.terminal;t.renderer&&t.wasmTerm&&t.renderer.render(t.wasmTerm,!0,t.viewportY,t,0)}var U;function W(){return(W=e((()=>{te(),U=new TextEncoder})))()}function ct(e,t){let n=!1,r=()=>{n||(e.terminal.renderer?.remeasureFont(),t&&e.fit(),H(e))},i=ce(`jetbrains-mono`);return i?.addEventListener(`load`,r),document.fonts.addEventListener(`loadingdone`,r),G||(G=new FontFace(`Zero Nerd Symbols`,`url("${de(`fonts/symbols-nerd-font-mono.woff2`)}")`,{display:`swap`}),document.fonts.add(G)),G.load().then(r,r),()=>{n=!0,i?.removeEventListener(`load`,r),document.fonts.removeEventListener(`loadingdone`,r)}}function lt(e,t){let n=e.terminal;n.options.fontFamily!==t&&(n.options.fontFamily=t,e.fit(),H(e))}var G;function K(){return(K=e((()=>{fe(),me(),W()})))()}async function ut(e,t,n,r){let i={sessionId:t,...n};return await(r?e.request(`terminal.upload`,i,{signal:r}):e.request(`terminal.upload`,i))}async function dt(e){if(e.size>16777216)throw Error(g(`terminal.uploadTooLarge`,{file:e.name}));return s(new Uint8Array(await e.arrayBuffer()))}function ft(e){return/^[A-Za-z0-9_@%+=:,./-]+$/u.test(e)?e:`'${e.replaceAll(`'`,`'\\''`)}'`}function pt(e,t,n){if(n===`native`){if(Oe(e))throw Error(g(`terminal.uploadInvalidNativePath`));if(/^(?:[a-z]:[\\/]|\\\\)/iu.test(e)){if(e.includes(`"`))throw Error(g(`terminal.uploadInvalidNativePath`));return`"${e}"`}if(!e.startsWith(`/`))throw Error(g(`terminal.uploadInvalidNativePath`));return`"${e.replace(/[\\"$`]/gu,`\\$&`)}"`}let r=t.split(/[\\/]/u).pop()?.toLowerCase()??``;if(/^(?:pwsh|powershell)(?:\.exe)?$/u.test(r))return`'${e.replaceAll(`'`,`''`)}'`;if(/^cmd(?:\.exe)?$/u.test(r)){if(/[%!]/u.test(e))throw Error(g(`terminal.uploadUnsafeCmdPath`));return`"${e.replaceAll(`"`,`""`)}"`}if(!/^(?:(?:ba|da|a|k|z)?sh|fish)(?:\.exe)?$/u.test(r))throw Error(g(`terminal.uploadUnsupportedShell`,{shell:r||t}));return ft(e)}function mt(){return(mt=e((()=>{De(),V(),o()})))()}function ht(e){if(typeof e==`object`&&e&&`retryable`in e){let t=e;return t.gatewayCode===`UNAVAILABLE`||t.code===`UNAVAILABLE`||t.retryable===!0}return!0}function gt(e){return S`<div class="rail-header__actions tp-actions">
    ${e.upload.uploadsEnabled()?P({className:`rail-header__action tp-icon tp-upload`,label:g(`terminal.addFiles`),icon:y.paperclip,disabled:e.upload.hasPendingBatch()||!e.upload.hasActiveTab(),onClick:e.upload.chooseFiles}):x}
    ${e.fullscreen?x:S`${e.sessionPicker}${e.embedded?P({className:`rail-header__action tp-icon`,label:g(`terminal.dockBottom`),icon:y.panelBottomOpen,disabled:e.dockDisabled,onClick:()=>e.onDock(`bottom`)}):S`${Xe({current:e.dock,disabled:e.dockDisabled,groupClass:`tp-dock-modes`,groupLabel:g(`terminal.dockMode`),destinations:[{dock:`bottom`,label:g(`terminal.dockBottom`),icon:y.panelBottomOpen,className:`tp-icon`},{dock:`right`,label:g(`terminal.dockRight`),icon:y.panelRightOpen,className:`tp-icon`},{dock:`main`,label:g(`terminal.dockMain`),icon:y.columns2,className:`tp-icon`}],onSelect:e.onDock})}
                ${P({className:`rail-header__action tp-icon tp-open-fullscreen`,label:g(`terminal.openWindow`),icon:y.maximize,newTab:!0,onClick:e.onOpenFullscreen})}
                ${P({className:`rail-header__action tp-icon`,label:g(`terminal.hide`),icon:y.x,onClick:e.onHide})}`}`}
  </div>`}function _t(e){let t=e.progress,n=t&&(t.state===`failed`?g(`terminal.uploadFailed`):g(`terminal.uploadProgress`,{current:String(t.current),total:String(t.total)}));return S`${e.dragActive?S`<div class="tp-drop-overlay">${g(`terminal.dropFiles`)}</div>`:x}
  ${t?S`<div
          class="tp-upload-card ${t.state===`failed`?`tp-upload-card--failed`:``}"
          role=${t.state===`failed`?`alert`:`status`}
          aria-live=${t.state===`failed`?`assertive`:`polite`}
        >
          <div class="tp-upload-card__header">
            <div class="tp-upload-card__copy">
              <div class="tp-upload-card__title">${n}</div>
              <div class="tp-upload-card__file">${t.fileName}</div>
            </div>
            <div class="tp-upload-card__actions">
              ${t.state===`failed`&&t.retryable?S`<button
                      class="tp-upload-card__action tp-upload-retry"
                      type="button"
                      @click=${e.retry}
                    >
                      ${g(`terminal.retryUpload`)}
                    </button>`:x}
              <button
                class="tp-upload-card__action tp-upload-cancel"
                type="button"
                @click=${e.cancel}
              >
                ${g(`common.cancel`)}
              </button>
            </div>
          </div>
          <div
            class="tp-upload-progress"
            role="progressbar"
            aria-label=${n}
            aria-valuemin="0"
            aria-valuemax=${String(t.total)}
            aria-valuenow=${String(t.completed)}
          >
            <span
              class="tp-upload-progress__fill"
              style=${`width:${t.completed/t.total*100}%`}
            ></span>
            ${t.state===`uploading`?S`<span class="tp-upload-progress__activity"></span>`:x}
          </div>
          ${t.error?S`<div class="tp-upload-card__error">${t.error}</div>`:x}
          ${t.state===`failed`&&t.canInsert?S`<div class="tp-upload-card__recovery">
                  <button
                    class="tp-upload-card__action tp-upload-insert"
                    type="button"
                    @click=${e.insertCompleted}
                  >
                    ${g(`terminal.insertUploadedPaths`)}
                  </button>
                </div>`:x}
        </div>`:x}`}var vt;function q(){return(q=e((()=>{C(),V(),o(),m(),ee(),Ze(),_(),Ge(),mt(),vt=class{constructor(e){this.host=e,this.dragActive=!1,this.batch=null,this.dragDepth=0,this.chooseFiles=()=>{this.admitUpload()&&this.host.fileInput()?.click()},this.handleFileSelection=e=>{let t=e.currentTarget;if(!this.admitUpload()){t.value=``;return}let n=Array.from(t.files??[]);t.value=``,this.uploadFiles(n)},this.handleDragEnter=e=>{this.admitDraggedFiles(e)&&(e.preventDefault(),this.dragDepth+=1,this.dragActive=!0,this.host.requestUpdate())},this.handleDragOver=e=>{this.admitDraggedFiles(e)&&(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect=`copy`))},this.handleDragLeave=e=>{this.hasDraggedFiles(e)&&(this.dragDepth=Math.max(0,this.dragDepth-1),this.dragDepth===0&&(this.dragActive=!1,this.host.requestUpdate()))},this.handleDrop=e=>{this.hasDraggedFiles(e)&&(e.preventDefault(),this.dragDepth=0,this.dragActive=!1,this.host.requestUpdate(),!this.hasPendingBatch()&&this.uploadFiles(Array.from(e.dataTransfer?.files??[])))},this.insertCompleted=()=>{let e=this.batch;e?.state===`failed`&&e.paths.length>0&&this.insertPaths(e)},this.retry=()=>{if(!this.admitUpload())return;let e=this.batch;if(e&&e.state===`failed`&&e.retryable){if(!this.host.isCurrent(e.tab)||!this.host.client()){this.cancelBatch(e);return}this.ensureUploadsRetained(e)&&(e.state=`uploading`,e.error=null,e.retryable=!1,e.abortController=new AbortController,this.host.requestUpdate(),this.runBatch(e))}},this.cancel=()=>{let e=this.batch;e&&this.cancelBatch(e)}}uploadsEnabled(){return d(this.host.config?.())}syncPolicy(){this.uploadsEnabled()||(this.cancel(),this.dragActive=!1,this.dragDepth=0)}admitUpload(){return this.uploadsEnabled()?!0:(this.host.setError(f()),this.syncPolicy(),!1)}hasActiveTab(){return!!this.host.activeTab()}hasPendingBatch(){return this.batch!==null}get progress(){let e=this.batch;if(!e)return null;let t=e.files.length,n=Math.min(e.nextIndex,t-1);return{completed:e.nextIndex,canInsert:e.paths.length>0&&(e.expiresAtMs===null||Date.now()<e.expiresAtMs),current:n+1,error:e.error,fileName:e.files[n]?.name??``,retryable:e.retryable,state:e.state,total:t}}hasDraggedFiles(e){return Array.from(e.dataTransfer?.types??[]).includes(`Files`)}admitDraggedFiles(e){return this.hasDraggedFiles(e)?this.uploadsEnabled()?this.hasActiveTab()&&!this.hasPendingBatch():(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect=`none`),!1):!1}uploadFiles(e){if(!this.admitUpload())return;let t=this.host.activeTab();if(e.length===0||!t||!this.host.client()||this.hasPendingBatch())return;this.host.setError(null);let n={tab:t,files:e,paths:[],expiresAtMs:null,nextIndex:0,state:`uploading`,error:null,retryable:!1,abortController:new AbortController};this.batch=n,this.host.requestUpdate(),this.runBatch(n)}isActive(e){return this.batch===e&&!e.abortController.signal.aborted}ensureCurrent(e){return this.isActive(e)?this.uploadsEnabled()?this.host.isCurrent(e.tab)?!0:(this.cancelBatch(e),!1):(this.host.setError(f()),this.cancelBatch(e),!1):!1}failBatch(e,t,n){this.ensureCurrent(e)&&(e.state=`failed`,e.error=h(t),e.retryable=n,this.host.requestUpdate())}ensureUploadsRetained(e){return e.expiresAtMs!==null&&Date.now()>=e.expiresAtMs?(this.failBatch(e,Error(g(`terminal.uploadExpired`)),!1),!1):!0}async runBatch(e){let t=this.host.client();if(!t||!this.ensureCurrent(e)){this.cancelBatch(e);return}for(;e.nextIndex<e.files.length;){let n=e.files[e.nextIndex];if(!n||!this.ensureCurrent(e)||!this.ensureUploadsRetained(e))return;this.host.requestUpdate();let r;try{r=await dt(n)}catch(t){this.failBatch(e,t,!1);return}if(!this.ensureCurrent(e))return;let i,a=Date.now();try{if(i=await ut(t,e.tab.gatewaySessionId,{name:n.name,contentBase64:r},e.abortController.signal),!this.ensureCurrent(e))return}catch(t){this.failBatch(e,t,ht(t));return}let o;try{o=pt(i.path,e.tab.shell,i.uploadPathStyle)}catch(t){this.failBatch(e,t,!1);return}e.paths.push(o),e.expiresAtMs??=a+at,e.nextIndex+=1,this.host.requestUpdate()}this.insertPaths(e)}insertPaths(e){this.ensureCurrent(e)&&this.ensureUploadsRetained(e)&&(e.tab.controller.terminal.paste(e.paths.join(` `)),e.tab.controller.terminal.focus(),this.batch=null,this.host.requestUpdate())}cancelForTab(e){let t=this.batch;t?.tab===e&&this.cancelBatch(t)}cancelBatch(e){this.batch===e&&(this.dispose(),this.host.requestUpdate())}dispose(){this.batch?.abortController.abort(),this.batch=null,this.dragActive=!1,this.dragDepth=0}}})))()}function yt({activeId:e,tabsInHeader:t=!1,connecting:n,error:r,uploadController:i}){return S`
    ${r?S`<div class="tp-error" role="alert">
            <span>${r.text}</span>
            ${r.retry?S`<button class="btn btn--sm" type="button" @click=${r.retry}>
                    ${g(`common.retry`)}
                  </button>`:x}
          </div>`:x}
    <wa-tab-panel
      id="terminal-tab-panel"
      class="tp-viewport"
      name=${e??`terminal`}
      active
      aria-labelledby=${e&&!t?`terminal-tab-${e}`:x}
      aria-label=${t?g(`terminal.title`):x}
      @dragenter=${i.handleDragEnter}
      @dragover=${i.handleDragOver}
      @dragleave=${i.handleDragLeave}
      @drop=${i.handleDrop}
    >
      ${n?N(`terminal`,g(`terminal.connecting`),!1,!0):x}
      ${!e&&!n&&!r?Qe({icon:y.terminal,heading:g(`chat.sidePanel.terminal`),description:g(`chat.sidePanel.terminalEmpty`)}):x}
      ${i.uploadsEnabled()?S`<input
              class="tp-file-input"
              type="file"
              multiple
              aria-hidden="true"
              tabindex="-1"
              @change=${i.handleFileSelection}
            />`:x}
      ${_t(i)}
    </wa-tab-panel>
  `}function bt(e){return e instanceof L?g(`terminal.connectionTimedOut`):e instanceof R?g(`terminal.unusableSession`,{field:e.field}):h(e)}function J(){return(J=e((()=>{C(),o(),m(),_(),$e(),j(),z(),q()})))()}function xt(e,t){let n=new et(St,{mode:`latch`},e=>e.length);return{buffer:n,onData:r=>{let i=Ct.decode(r),a=t();a?e.input(a,i):n.push(i)},onResize:({columns:n,rows:r})=>{let i=t();i&&e.resize(i,n,r)}}}var St,Ct;function wt(){return(wt=e((()=>{nt(),St=8192,Ct=new TextDecoder})))()}function Tt(){let e=getComputedStyle(document.documentElement);return{background:I(e,`--bg`),cursor:I(e,`--accent`),foreground:I(e,`--text`)}}function Et(e){let t=Tt();return{...e===`light`?Ot:Dt,...t,cursorAccent:t.background,selectionBackground:`${t.cursor}${e===`light`?`4d`:`52`}`}}var Dt,Ot;function Y(){return(Y=e((()=>{Dt={black:`#1b1e26`,red:`#ff6b6b`,green:`#4ec9a8`,yellow:`#e5c07b`,blue:`#5aa2ff`,magenta:`#c586c0`,cyan:`#56b6c2`,white:`#d7dae0`,brightBlack:`#5c6370`,brightRed:`#ff8787`,brightGreen:`#6fd7bd`,brightYellow:`#f0d197`,brightBlue:`#7cb7ff`,brightMagenta:`#d7a3d4`,brightCyan:`#7bd3dd`,brightWhite:`#ffffff`},Ot={black:`#3a3f4b`,red:`#c62f3d`,green:`#177a5e`,yellow:`#8f6400`,blue:`#1e66d0`,magenta:`#94439c`,cyan:`#0f7487`,white:`#1b1e26`,brightBlack:`#5c6370`,brightRed:`#a3242f`,brightGreen:`#0f664e`,brightYellow:`#755200`,brightBlue:`#1a55ab`,brightMagenta:`#7c3382`,brightCyan:`#0c6070`,brightWhite:`#0a0c10`}})))()}async function kt(e){let{panel:t,connection:n}=e,r=document.createElement(`div`);if(r.className=`tp-host`,await t.updateComplete,!e.isCurrent())throw Error(`terminal operation cancelled`);let i=t.findTerminalPanelViewport();if(!i)throw Error(`terminal viewport unavailable`);i.append(r);let a={},o=xt(n,()=>a.current?.status===`exited`?void 0:a.current?.gatewaySessionId),{createTerminalDefaultColorQueryResponder:s}=await k(async()=>{let{createTerminalDefaultColorQueryResponder:e}=await import(`./browser-CcXA-FQa.js`);return{createTerminalDefaultColorQueryResponder:e}},__vite__mapDeps([0,1,2,3]),import.meta.url),c=s({getColors:Tt,reply:e=>o.onData(U.encode(e))}),l=(e,n)=>t.createTerminalController({parent:e,readOnly:n?.readOnly??!1,terminalOptions:{fontSize:11,fontFamily:t.terminalFontFamily,cursorBlink:!0,theme:Et(t.themeMode),scrollback:5e3},onData:o.onData,onResize:o.onResize}),u;try{u=await l(r)}catch(e){throw r.remove(),e}if(!e.isCurrent())throw A(u,r),Error(`terminal operation cancelled`);let d={id:`tab-${e.sequence}`,sequence:e.sequence,gatewaySessionId:``,pendingInput:o.buffer,defaultColorQueries:c,shellName:null,shell:``,agentId:null,cwd:null,agentOwned:!1,controller:u,host:r,status:`connecting`,awaitFirstOutput:e.awaitFirstOutput,readyTimer:null};return a.current=d,{tab:d,connection:n,cols:u.terminal.cols||80,rows:u.terminal.rows||24,sink:{onData:t=>{d.cancelled||(d.defaultColorQueries.observe(t),d.controller.write(U.encode(t)),t.length>0&&e.onReady(d))},onReplay:({data:n,newlyObservedFrom:r,mode:i,signal:a})=>{if(!(d.cancelled||a.aborted)){if(d.defaultColorQueries.primeFromReplay(n.slice(0,r)),d.defaultColorQueries.observe(n.slice(r)),i===`recovery`)return Re(d,l,n,a).then(r=>{r&&!d.cancelled&&!a.aborted&&(lt(d.controller,t.terminalFontFamily),n&&e.onReady(d))});n&&(d.controller.write(U.encode(n)),e.onReady(d))}},onExit:t=>e.onExit(d,t)}}}function At(){return(At=e((()=>{M(),K(),W(),wt(),Y(),O()})))()}async function jt(e,t){await t,e&&(e.controller.fit(),H(e.controller),e.controller.terminal.focus())}function Mt(e,t){let n;for(let r of e){let e=r.controller.terminal;e.renderer&&e.wasmTerm&&(e.renderer.setTheme(n??=Et(t)),H(r.controller))}}function Nt(e,t,n){if(!n)return;for(let t of e)t.host.parentElement!==n&&n.append(t.host);let r=e.find(e=>e.id===t);r&&(r.controller.fit(),H(r.controller))}function X(){return(X=e((()=>{W(),Y()})))()}var Pt;function Z(){return(Z=e((()=>{Pt=class{constructor(e){this.options=e}markReady(e){this.stop(e),e.status===`connecting`&&(e.status=`live`,this.options.onReady(e))}arm(e){!e.readyTimer&&e.status===`connecting`&&e.awaitFirstOutput&&(e.readyTimer=setTimeout(()=>{e.readyTimer=null,this.options.isCurrent(e)&&e.status===`connecting`&&e.awaitFirstOutput&&(e.awaitFirstOutput=!1,this.options.onTimeout(e))},this.options.timeoutMs()))}stop(e){e.readyTimer&&=(clearTimeout(e.readyTimer),null),e.awaitFirstOutput=!1}}})))()}var Ft;function It(){return(It=e((()=>{Ft=class{constructor(){this.tail=Promise.resolve(),this.generation=0}enqueue(e){let t=this.generation,n=()=>t===this.generation,r=()=>n()?e(n):Promise.resolve(),i=this.tail.then(r,r);return this.tail=i.catch(()=>{}),i}reset(){this.generation+=1}}})))()}var Lt;function Rt(){return(Rt=e((()=>{o(),m(),rt(),z(),M(),J(),At(),X(),W(),Be(),ze(),Z(),It(),Lt=class{constructor(e){this.host=e,this.tabs=[],this.activeId=null,this.booting=!1,this.error=null,this.connection=null,this.activeClient=null,this.activeAvailable=!1,this.hadClient=!1,this.hadAvailable=!1,this.lifecycleGeneration=0,this.lifecycleAbortController=new AbortController,this.lifecycleSyncToken=0,this.tabSequence=0,this.pendingRestore=null,this.intentQueue=Fe,this.bootQueue=new Ft;let t=null;this.intentHost={bootQueue:this.bootQueue,currentGeneration:()=>this.lifecycleGeneration,canRun:()=>this.host.client!==null&&this.host.client===this.activeClient&&this.host.available&&this.host.terminalPanelOpen&&this.host.isConnected,attach:(e,t,n)=>this.attachSessionNow(e,t,n),client:()=>this.activeClient,showError:e=>this.setError(e),present:e=>{e.id=`tab-${++this.tabSequence}`,this.updateControllerState({tabs:[...this.tabs,e],booting:!1}),this.switchTo(e.id)},open:(e,t,n)=>this.openSessionNow(e,t,n),reattach:e=>this.reattachPersistedSessions(e),cancelledRestoreCompleted:()=>{this.error||this.closeEmptyPanel()},ensureInitial:async(e,t)=>{if(this.tabs.length===0){let n=this.host.page?this.host.routeTarget:null;return n&&`sessionId`in n?this.attachSessionNow(n.sessionId,!1,t):this.openSessionNow(n?.catalog,e,t)}return this.intentHost.canRun()},hasTabs:()=>this.tabs.length>0,requestUpdate:()=>this.host.requestUpdate(),setBooting:e=>this.updateControllerState({booting:e}),timeoutMs:()=>this.host.catalogReadyTimeoutMs,showTimeout:()=>{t=this.setError(g(`terminal.refreshRequired`))},clearTimeout:()=>{t&&this.error===t&&this.setError(null),t=null}},this.readiness=new Pt({timeoutMs:()=>this.host.catalogReadyTimeoutMs,isCurrent:e=>this.tabs.includes(e),onReady:e=>{delete e.pendingOpen,this.updateControllerState({tabs:[...this.tabs]}),this.persistSessions()},onTimeout:e=>{this.setError(g(`terminal.connectionTimedOut`),e.pendingOpen),this.connection?.close(e.gatewaySessionId),this.removeTab(e),this.persistSessions()}})}updateControllerState(e){Object.assign(this,e),this.host.requestUpdate()}setError(e,t){return this.updateControllerState({error:e?{text:e,retryAction:t}:null}),this.error}retryOpen(){let e=this.error?.retryAction;e&&(this.setError(null),this.intentQueue.queue(e))}connectHost(){this.host.page&&(this.intentQueue=new Le(!1)),this.activeClient=this.host.client,this.activeAvailable=this.host.available,this.hadClient=this.host.client!==null,this.hadAvailable=this.host.available,this.activateHost(),this.updateControllerState({booting:this.intentQueue.hasActions})}activateHost(){this.intentQueue.bindHost(this.intentHost)}get canHandoffSessions(){return this.intentQueue.canHandoff(this)}handoffSessions(){return this.canHandoffSessions?(this.tabs=this.intentQueue.queueHandoff(this,this.activeClient),this.disposeAllTabs(),!0):!1}disconnectHost(){this.intentQueue.releaseHost(this.intentHost),this.disposeAllTabs(),this.activeClient=null,this.activeAvailable=!1}scheduleLifecycleSync(){let e=++this.lifecycleSyncToken,t=this.lifecycleGeneration;queueMicrotask(()=>{e===this.lifecycleSyncToken&&t===this.lifecycleGeneration&&this.host.isConnected&&this.synchronizeLifecycle()})}synchronizeLifecycle(){let e=this.host.client!==this.activeClient,t=this.host.available!==this.activeAvailable;if(!e&&!t)return;let n=t&&this.host.available&&this.hadAvailable,r=e&&this.hadClient||n,i=this.host.client!==null&&r;e&&(this.activeClient=this.host.client,this.hadClient||=this.host.client!==null),this.activeAvailable=this.host.available,this.hadAvailable||=this.host.available;let a=t&&!this.host.available;(e||a)&&this.disposeAllTabs();let o=e&&this.host.available&&this.host.terminalPanelOpen;t&&(this.host.available?this.host.restoreTerminalPanelOpenState()&&(o=!0):this.host.hideTerminalPanelForUnavailableSurface()),i?this.intentQueue.refreshBeforeReconnect(this.intentHost,()=>this.host.isConnected,o?()=>void this.restoreSessions():void 0):o?this.restoreSessions():this.intentQueue.drain()}restoreSessions(){return this.intentQueue.queue({kind:`restore`,agentId:this.host.agentId?.trim()||null})}cancelPendingActions(){this.intentQueue.cancel(this.intentHost)}get waitingForRefresh(){return this.intentQueue.waitingForRefresh}async reattachPersistedSessions(e){let t=this.captureTerminalOperation();if(!t||this.tabs.length>0)return!1;let n=Ie(this.storageScope);if(n.length===0)return!1;let r={operation:t,pending:new Map(n.map(e=>[e,void 0])),userClosedTab:!1,cancelIntent:e};this.pendingRestore=r,this.updateControllerState({booting:!0});try{let e=await this.connectionFor(t).list();if(!this.isTerminalOperationCurrent(t,r))return!1;let n=new Map(e.map(e=>[e.sessionId,e]));for(let e of r.pending.keys()){let i=n.get(e);if(i?await this.attachSession(e,t,i.owner?.startsWith(`agent:`)===!0,r):await this.restoreExitedSession(e,r),!this.isTerminalOperationCurrent(t,r))return!1;r.pending.delete(e),this.persistSessions()}}catch{}finally{this.isTerminalOperationCurrent(t,r)&&(this.pendingRestore=null,this.updateControllerState({booting:!1}),this.persistSessions())}return this.isTerminalOperationCurrent(t)&&r.userClosedTab}get storageScope(){return this.host.page?`:page:${JSON.stringify(this.host.routeTarget)}`:``}async listSessions(){let e=this.captureTerminalOperation();if(!e)return null;let t=await this.connectionFor(e).list().catch(()=>[]);return this.isTerminalOperationCurrent(e)?t:null}attachSessionById(e,t=!1){return this.intentQueue.queue({kind:`attach`,sessionId:e,agentOwned:t})}async attachSessionNow(e,t,n){let r=this.tabs.find(t=>t.gatewaySessionId===e&&t.status!==`exited`);if(r)return this.switchTo(r.id),!0;let i=this.captureTerminalOperation(n);if(!i)return!1;this.updateControllerState({booting:!0,error:null});try{let n=await this.attachSession(e,i,t);return n&&this.activeId&&this.switchTo(this.activeId),n||this.isTerminalOperationCurrent(i)}finally{this.isTerminalOperationCurrent(i)&&this.updateControllerState({booting:!1})}}async bootTab(e,t={}){let n=await kt({panel:this.host,connection:this.connectionFor(e),sequence:++this.tabSequence,awaitFirstOutput:t.awaitFirstOutput===!0,isCurrent:()=>this.isTerminalOperationCurrent(e,t.restore?.batch),onReady:e=>this.readiness.markReady(e),onExit:(e,t)=>this.handleExit(e.id,t)});if(!this.isTerminalOperationCurrent(e,t.restore?.batch))throw A(n.tab.controller,n.tab.host),Error(`terminal operation cancelled`);return t.restore?.batch.pending.set(t.restore.sessionId,n.tab),n.tab.cancelPendingIntent=e.cancelIntent,this.updateControllerState({tabs:[...this.tabs,n.tab],activeId:n.tab.id}),n}adoptSession(e,t,n=!1){this.retireRestoredTab(e),delete e.cancelPendingIntent,e.gatewaySessionId=t.sessionId,e.shellName=t.title??st(t.shell),e.shell=t.shell,e.agentId=t.agentId,e.cwd=t.cwd,e.agentOwned=t.owner===void 0?n:t.owner.startsWith(`agent:`);let r=e.pendingInput.drain();if(e.status!==`exited`){let{cols:n,rows:i}=e.controller.terminal;this.connection?.resize(t.sessionId,n||80,i||24);for(let e of r)this.connection?.input(t.sessionId,e)}e.status===`connecting`&&(e.awaitFirstOutput?this.readiness.arm(e):this.readiness.markReady(e)),this.updateControllerState({tabs:[...this.tabs]}),this.persistSessions()}removeTab(e){this.disposeTab(e);let t=this.tabs.filter(t=>t.id!==e.id);this.updateControllerState({tabs:t,activeId:this.activeId===e.id?t.at(-1)?.id??null:this.activeId})}openSession(){return this.intentQueue.queue({kind:`open`,agentId:this.host.agentId?.trim()||null})}async openSessionNow(e,t,n){let r=this.captureTerminalOperation(n);if(!r)return!1;this.updateControllerState({booting:!0,error:null});let i=e?{kind:`catalog`,agentId:t,catalog:e}:{kind:`open`,agentId:t},a=ot(this.host.sessionKey,e),o;try{let n=await this.bootTab(r,{awaitFirstOutput:!!e});o=n.tab,n.tab.pendingOpen=i;let s=await n.connection.open({agentId:t??void 0,...a?{sessionKey:a}:{},cols:n.cols,rows:n.rows,...e?{catalog:e}:{}},n.sink);if(!this.isTerminalOperationCurrent(r)||n.tab.cancelled){let e=n.tab.cancelled===`close`;return n.connection.close(s.sessionId),this.discardCancelledTab(n.tab),e}return this.adoptSession(n.tab,s,a!==void 0),n.tab.controller.terminal.focus(),!0}catch(e){return o&&!o.gatewaySessionId&&this.tabs.includes(o)&&this.removeTab(o),this.isTerminalOperationCurrent(r)?(o?.cancelled!==`close`&&this.setError(bt(e),e instanceof L||e instanceof R?i:void 0),!0):!1}finally{this.isTerminalOperationCurrent(r)&&this.updateControllerState({booting:!1})}}async attachSession(e,t,n=!1,r){let i,a,o=this.host.page?it(e,t.client):null;try{o&&(this.connection?.dispose(),this.connection=o.connection);let s=await this.bootTab(t,{awaitFirstOutput:o!==null,restore:r&&{batch:r,sessionId:e}});i=s.tab,a=s.connection,o&&o.bind(s.sink);let c=o?.result??await s.connection.attach(e,s.sink);return!this.isTerminalOperationCurrent(t,r)||s.tab.cancelled?(s.tab.cancelled===`close`&&s.connection.close(c.sessionId),this.discardCancelledTab(s.tab),!1):(this.adoptSession(s.tab,c,n),!0)}catch(n){if(o&&o.connection.close(o.result.sessionId),!this.isTerminalOperationCurrent(t,r,i))return!1;let s=r&&a?await a.list().catch(()=>null):null;return this.isTerminalOperationCurrent(t,r,i)?(i&&!i.gatewaySessionId&&this.tabs.includes(i)&&(s&&!s.some(t=>t.sessionId===e)?this.markRestoredSessionExited(i,e):this.removeTab(i)),r||this.setError(`${g(`terminal.attachFailed`)}: ${h(n)}`),!1):!1}}async restoreExitedSession(e,t){let n=await this.bootTab(t.operation,{restore:{batch:t,sessionId:e}});if(!this.isTerminalOperationCurrent(t.operation,t)||n.tab.cancelled){this.discardCancelledTab(n.tab);return}this.markRestoredSessionExited(n.tab,e)}discardCancelledTab(e){this.tabs.includes(e)&&(e.cancelled=`lifecycle`,this.removeTab(e))}markRestoredSessionExited(e,t){e.gatewaySessionId=t,this.handleExit(e.id,{reason:`disconnected`,exitCode:null})}handleExit(e,t){let n=this.tabs.find(t=>t.id===e);if(n){if(n.status=`exited`,n.exitReason=t.reason,n.exitCode=t.exitCode,n.exitSignal=t.signal,t.reason===`process_exit`&&t.exitCode===0&&!t.signal&&!t.error?.trim()&&!this.error){this.closeTab(e);return}this.retireRestoredTab(n),this.readiness.stop(n),n.controller.setReadOnly(!0),delete n.pendingOpen,t.error?.trim()&&this.setError(l(t.error)),this.updateControllerState({tabs:[...this.tabs]}),this.persistSessions()}}closeTab(e){let t=this.tabs.find(t=>t.id===e);t&&(t.cancelled=`close`,t.cancelPendingIntent?.(),this.retireRestoredTab(t),this.host.terminalPanelUploadController.cancelForTab(t),t.gatewaySessionId&&t.status!==`exited`&&this.connection?.close(t.gatewaySessionId),this.removeTab(t),this.persistSessions(),this.closeEmptyPanel())}closeEmptyPanel(){this.tabs.length===0&&!this.host.fullscreen&&!this.intentQueue.hasActions&&this.host.closeTerminalPanel()}switchTo(e){this.updateControllerState({activeId:e}),jt(this.tabs.find(t=>t.id===e),this.host.updateComplete)}retireRestoredTab(e){let t=this.pendingRestore;if(t&&this.isTerminalOperationCurrent(t.operation,t)){for(let[n,r]of t.pending)if(r===e){t.userClosedTab||=e.cancelled===`close`,t.pending.delete(n),e.cancelled===`close`&&t.pending.size===0&&t.cancelIntent?.();break}}}persistSessions(){let e=this.pendingRestore;if(e&&!this.isTerminalOperationCurrent(e.operation,e))return;let t=new Set(this.tabs.filter(e=>e.status===`live`&&e.gatewaySessionId).map(e=>e.gatewaySessionId));for(let n of e?.pending.keys()??[])t.add(n);Pe([...t],this.storageScope)}captureTerminalOperation(e){let t=this.host.client;return this.intentQueue.fenced||!t||t!==this.activeClient||!this.host.available||!this.host.isConnected?null:{generation:this.lifecycleGeneration,client:t,signal:this.lifecycleAbortController.signal,cancelIntent:e}}isTerminalOperationCurrent(e,t,n){return this.host.isConnected&&this.host.available&&this.host.client===e.client&&this.activeClient===e.client&&this.lifecycleGeneration===e.generation&&(!t||this.pendingRestore===t)&&n?.cancelled!==`close`&&!e.signal.aborted}connectionFor(e){if(!this.isTerminalOperationCurrent(e))throw Error(`terminal operation cancelled`);return this.connection??=new tt(e.client),this.connection}disposeTab(e){this.readiness.stop(e),A(e.controller,e.host)}disposeAllTabs(){this.lifecycleGeneration+=1,this.pendingRestore=null,this.intentQueue.resetLifecycle(this.intentHost),this.lifecycleAbortController.abort(),this.lifecycleAbortController=new AbortController,this.bootQueue.reset(),this.error?.retryAction&&this.setError(this.error.text),this.updateControllerState({booting:!1}),this.host.terminalPanelUploadController.dispose();for(let e of this.tabs)e.cancelled=`lifecycle`,this.disposeTab(e);this.updateControllerState({tabs:[],activeId:null}),this.host.resetTerminalSessionPicker(),this.connection?.dispose(),this.connection=null}}})))()}var zt;function Bt(){return(Bt=e((()=>{C(),zt=T`
  .tp--bottom {
    left: var(--shell-nav-width, 0);
    right: 0;
    bottom: 0;
    --tp-session-menu-max-height: calc(var(--tp-panel-height) - 44px);
  }
  .tp--right {
    top: var(--shell-topbar-height, 0);
    right: 0;
    bottom: 0;
    --tp-session-menu-max-height: calc(100dvh - var(--shell-topbar-height, 0px) - 44px);
  }
  .tp--main {
    /* Main mode owns the content region; later sibling docks may overlay it. */
    top: var(--shell-topbar-height, 0);
    left: var(--shell-nav-width, 0);
    right: 0;
    bottom: 0;
    --tp-session-menu-max-height: calc(100dvh - var(--shell-topbar-height, 0px) - 44px);
  }
  .tp--fullscreen {
    inset: 0;
  }
  .tp--embedded {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .tp-header .tabstrip-tab__icon {
    color: var(--muted, #8a919e);
  }
  /* Same glyph system as the side panel rail. Positioned so the session
     menu anchors to the header, not its mid-toolbar trigger: a
     trigger-anchored menu wider than the icons spills past the panel's
     left edge, and header anchoring makes 100% mean "panel width". */
  .tp-header {
    --rail-header-action-glyph-size: 15px;

    position: relative;
  }
  .tp-header .tabstrip-tab__icon svg,
  .tp-header .tp-icon svg {
    width: 15px;
    height: 15px;
    stroke-width: 1.6px;
  }
  .tp-dock-modes {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .tp-session-picker {
    position: static;
  }
  .tp-session-menu {
    position: absolute;
    z-index: 4;
    top: calc(100% + 3px);
    left: 8px;
    right: 8px;
    width: auto;
    max-width: 360px;
    /* Both edges are pinned, so the menu can never reach past the panel; the
       auto margin keeps it right-aligned under its trigger while it fits. */
    margin-left: auto;
    max-height: min(420px, var(--tp-session-menu-max-height));
    overflow-y: auto;
    padding: var(--menu-padding);
    border: 1px solid var(--overlay-border);
    border-radius: var(--menu-radius);
    background: var(--bg-elevated);
    box-shadow: var(--overlay-shadow);
  }
  .tp-session-menu--hosted {
    --tp-session-menu-max-height: calc(100% - 8px);

    top: 4px;
  }
  .tp-session-menu__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px 7px;
    color: var(--text, #d7dae0);
    font-size: 12px;
    font-weight: 600;
  }
  /* Refreshing the list is not destructive, so it reads as a plain action. */
  .tp-session-refresh {
    border: 0;
    background: transparent;
    color: var(--muted, #8a919e);
    font: inherit;
    font-weight: 500;
    padding: 2px 4px;
  }
  .tp-session-refresh:hover,
  .tp-session-refresh:focus-visible {
    color: var(--text, #d7dae0);
  }
  .tp-session {
    display: grid;
    grid-template-columns: minmax(70px, auto) minmax(100px, 1fr) auto;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: 0;
    min-height: var(--menu-item-height);
    border-radius: var(--menu-item-radius);
    background: transparent;
    color: var(--text, #d7dae0);
    padding: 7px 8px;
    text-align: left;
  }
  .tp-session:not(:disabled):hover,
  .tp-session:not(:disabled):focus-visible {
    background: var(--bg-hover);
  }
  .tp-session:disabled {
    opacity: 0.55;
  }
  .tp-session__agent {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    font-weight: 600;
  }
  .tp-session__cwd {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--muted, #8a919e);
    font:
      11px ui-monospace,
      SFMono-Regular,
      "SF Mono",
      Menlo,
      Consolas,
      "Liberation Mono",
      monospace;
  }
  .tp-session__state {
    color: var(--muted, #8a919e);
    font-size: 11px;
    white-space: nowrap;
  }
  .tp-session-empty {
    padding: 10px 8px;
    color: var(--muted, #8a919e);
    font-size: 12px;
  }
  .tp-viewport {
    position: relative;
    flex: 1;
    min-height: 0;
    background: var(--bg, #0e1015);
  }
  .tp-host {
    position: absolute;
    inset: 0;
    z-index: 0;
    padding: 6px 8px;
    caret-color: transparent;
  }
  .tp-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    font-size: 12px;
    color: var(--danger, #ff6b6b);
  }
  .tp-error .btn {
    flex: 0 0 auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-elevated);
    color: var(--text);
    padding: 6px 10px;
    font: inherit;
  }
`})))()}function Vt(e){return e.status===`connecting`?g(`terminal.connecting`):e.status===`exited`?e.exitReason===`detached`?g(`terminal.detached`):typeof e.exitSignal==`number`&&e.exitSignal>0?g(`terminal.exitedSignal`,{signal:String(e.exitSignal)}):e.exitReason===`process_exit`&&typeof e.exitCode==`number`?g(`terminal.exitedCode`,{code:String(e.exitCode)}):g(`terminal.exited`):null}function Ht(e){return e.map(e=>({id:e.id,label:e.shellName??g(`terminal.tabLabel`,{n:String(e.sequence)}),title:e.agentId===null||e.cwd===null?null:g(`terminal.tabHint`,{agent:e.agentId,cwd:e.cwd}),icon:Wt,statusLabel:Vt(e),badge:e.agentOwned?g(`terminal.agentOwnedBadge`):null,className:`is-${e.status}`}))}function Ut(e){let t=Ht(e.tabs).map(e=>Object.assign(e,{domId:`terminal-tab-${e.id}`,closeLabel:`${g(`terminal.closeSession`)}: ${e.label}`}));return Ye({tabs:t,activeId:e.activeId,ariaControls:`terminal-tab-panel`,onSelect:e.onSelect,onClose:e.onClose,onNew:e.onNew,newLabel:g(`terminal.newSession`),newDisabled:e.booting})}var Wt;function Gt(){return(Gt=e((()=>{C(),o(),F(),Wt=be`<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4l3 3-3 3M8 11h5" /></svg>`})))()}var Kt;function qt(){return(qt=e((()=>{C(),Kt=T`
  .rail-header__action:disabled {
    pointer-events: none;
  }
  .tp-file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .tp-drop-overlay {
    position: absolute;
    z-index: 4;
    inset: 8px;
    display: grid;
    place-items: center;
    border: 1px dashed var(--accent, #ff5c5c);
    background: color-mix(in srgb, var(--bg, #0e1015) 88%, var(--accent, #ff5c5c));
    color: var(--text, #d7dae0);
    font-size: 13px;
    pointer-events: none;
  }
  .tp-upload-card {
    position: absolute;
    z-index: 5;
    right: 10px;
    bottom: 10px;
    width: min(300px, calc(100% - 20px));
    box-sizing: border-box;
    padding: 9px 10px 10px;
    border: 1px solid var(--border, #262b34);
    border-radius: 7px;
    background: color-mix(in srgb, var(--bg, #0e1015) 94%, var(--text, #d7dae0));
    box-shadow: var(--overlay-shadow);
    color: var(--text, #d7dae0);
    font-size: 11px;
  }
  .tp-upload-card--failed {
    border-color: color-mix(in srgb, var(--danger, #ff6b6b) 55%, var(--border, #262b34));
  }
  .tp-upload-card__header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .tp-upload-card__copy {
    flex: 1;
    min-width: 0;
  }
  .tp-upload-card__title {
    color: var(--text, #d7dae0);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .tp-upload-card--failed .tp-upload-card__title,
  .tp-upload-card__error {
    color: var(--danger, #ff6b6b);
  }
  .tp-upload-card__file {
    margin-top: 2px;
    overflow: hidden;
    color: var(--muted, #8a919e);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tp-upload-card__error {
    margin-top: 6px;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .tp-upload-card__actions {
    display: flex;
    gap: 4px;
  }
  .tp-upload-card__recovery {
    margin-top: 8px;
  }
  .tp-upload-card__action {
    margin: -3px 0;
    padding: 3px 5px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: var(--muted, #8a919e);
    font: inherit;
    cursor: var(--cursor-action);
  }
  .tp-upload-card__action:hover {
    background: color-mix(in srgb, var(--text, #d7dae0) 10%, transparent);
    color: var(--text, #d7dae0);
  }
  .tp-upload-card__action:focus-visible {
    outline: 1px solid var(--accent, #ff5c5c);
    outline-offset: 1px;
  }
  .tp-upload-retry {
    color: var(--accent, #ff5c5c);
  }
  .tp-upload-progress {
    position: relative;
    height: 3px;
    margin-top: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--border, #262b34) 72%, transparent);
  }
  .tp-upload-progress__fill,
  .tp-upload-progress__activity {
    position: absolute;
    inset-block: 0;
    left: 0;
    border-radius: inherit;
    background: var(--accent, #ff5c5c);
  }
  .tp-upload-progress__fill {
    transition: width 180ms ease-out;
  }
  .tp-upload-progress__activity {
    width: 26%;
    opacity: 0.7;
    animation: tp-upload-progress 1.15s ease-in-out infinite;
  }
  .tp-upload-card--failed .tp-upload-progress__fill {
    background: var(--danger, #ff6b6b);
  }
  @keyframes tp-upload-progress {
    from {
      transform: translateX(-110%);
    }
    to {
      transform: translateX(385%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tp-upload-progress__activity {
      animation: none;
      transform: none;
    }
  }
`})))()}function Jt(e){return typeof e==`function`}async function Yt(e){let[{createGhosttyTerminal:t,loadGhosttyRuntime:n},r]=await Promise.all([k(()=>import(`./browser-CcXA-FQa.js`),__vite__mapDeps([0,1,2,3]),import.meta.url),k(()=>import(`./ghostty-web-BxM4JSE8.js`),__vite__mapDeps([4,1,2,3]),import.meta.url)]),i=await n({module:r}),a=!1,o=await t({...e,runtime:i,autoFit:!1,terminalOptions:{...e.terminalOptions,onCopy:()=>{a||e.signal?.aborted||!e.parent.checkVisibility()||re({message:g(`terminal.copiedToClipboard`),anchor:e.parent,durationMs:2e3})}}}),s=o.dispose.bind(o),c=o.terminal,l=new i.FitAddon;l.activate(c);let u;c.attachCustomKeyEventHandler(e=>e.defaultPrevented);let d=ke(c)?.handleMouseUp,f=Jt(d)?d:void 0,p;return o.fit=()=>{if(a)return;let e=l.proposeDimensions();e&&(e.cols!==c.cols||e.rows!==c.rows)&&o.resize({columns:e.cols,rows:e.rows})},o.dispose=()=>{a||(a=!0,u?.disconnect(),p?.(),l.dispose(),f&&=(document.removeEventListener(`mouseup`,f),void 0),s())},e.signal?.aborted?o.dispose():e.autoFit!==!1&&(u=new ResizeObserver(()=>o.fit()),u.observe(e.parent),e.size||o.fit()),a||(p=ct(o,e.autoFit!==!1&&!e.size)),o}function Xt(){return(Xt=e((()=>{o(),c(),K(),O()})))()}function Zt(e){return S`<button
    ${Se(e.triggerRef)}
    class=${e.hosted?`rail-header__action`:`rail-header__action tp-icon`}
    type="button"
    title=${e.hosted?x:g(`terminal.sessions`)}
    aria-label=${g(`terminal.sessions`)}
    aria-expanded=${e.open?`true`:`false`}
    aria-haspopup="dialog"
    aria-controls=${e.hosted?x:Q}
    @click=${e.onToggle}
    @focusout=${e.onFocusOut}
  >
    ${y.server}
  </button>`}function Qt(e){return S`
    ${e.open?S`<div
            id=${Q}
            class="tp-session-menu ${e.hosted?`tp-session-menu--hosted`:``}"
            @focusout=${e.onFocusOut}
            role="dialog"
            aria-label=${g(`terminal.sessions`)}
            @keydown=${t=>{t.key===`Escape`&&(t.preventDefault(),t.stopPropagation(),e.onDismiss(!0))}}
          >
            <div class="tp-session-menu__header">
              <span>${g(`terminal.sessions`)}</span>
              <button class="tp-session-refresh" type="button" @click=${e.onRefresh}>
                ${g(`terminal.refreshSessions`)}
              </button>
            </div>
            ${e.loading?N(`terminal`,g(`terminal.loadingSessions`),!0):e.sessions.length===0?S`<div class="tp-session-empty">${g(`terminal.noSessions`)}</div>`:e.sessions.map(t=>{let n=e.currentSessionIds.has(t.sessionId),r=`${t.owner?.startsWith(`agent:`)===!0?`${g(`terminal.agentOwnedBadge`)} · `:``}${n?g(`terminal.currentSession`):t.attached?g(`terminal.sessionAttached`):g(`terminal.detached`)}`;return S`<button
                        class="tp-session"
                        type="button"
                        ?disabled=${n}
                        title=${n?r:g(`terminal.attachSession`)}
                        @click=${()=>e.onAttach(t.sessionId,t.owner)}
                      >
                        <span class="tp-session__agent">${t.agentId}</span>
                        <span class="tp-session__cwd">${t.cwd}</span>
                        <span class="tp-session__state">${r}</span>
                      </button>`})}
          </div>`:x}
  `}var Q;function $t(){return($t=e((()=>{C(),ye(),o(),_(),j(),Q=`terminal-session-picker-dialog`})))()}var en,$;function tn(){return(tn=e((()=>{Te(),Ne(),Ce(),C(),xe(),ye(),ie(),se(),o(),ne(),a(),He(),r(),ae(),pe(),Ue(),_(),Ke(),oe(),F(),ge(),K(),J(),Rt(),X(),Bt(),Gt(),qt(),q(),Xt(),$t(),en=3e4,$=class extends i{constructor(){super(),this.client=null,this.agentId=null,this.sessionKey=null,this.available=!1,this.suppressed=!1,this.themeMode=`dark`,this.basePath=``,this.fullscreen=!1,this.embedded=!1,this.tabsInHeader=!1,this.page=!1,this.routeTarget=null,this.sessionPickerOpen=!1,this.pickerSessions=[],this.sessionPickerTrigger=ve(),this.sessionPickerTask=new je(this,{autoRun:!1,args:()=>[this.available?this.client:null],task:([e])=>e?this.terminalSessions.listSessions():Me,onComplete:e=>{e!==null&&(this.pickerSessions=e)}}),this.terminalPanelUploadController=new vt({activeTab:()=>this.terminalSessions.tabs.find(e=>e.id===this.terminalSessions.activeId&&e.status===`live`&&e.gatewaySessionId),client:()=>this.client,config:()=>this.context?.config,isCurrent:e=>this.terminalSessions.tabs.includes(e)&&e.status===`live`,fileInput:()=>this.renderRoot.querySelector(`.tp-file-input`),setError:e=>this.terminalSessions.setError(e),requestUpdate:()=>this.requestUpdate()}),this.createTerminalController=Yt,this.catalogReadyTimeoutMs=en,this.terminalSessions=new Lt(this),this.dockLayout=new ue(this,{layout:_e,reservationPrefix:`terminal`,isAvailable:()=>this.isDockLayoutAvailable(),isFullscreen:()=>this.fullscreen,onResize:()=>this.terminalSessions.tabs.find(e=>e.id===this.terminalSessions.activeId)?.controller.fit()}),this.themeObserver=null,this.handleToggleRequest=e=>{let t=e instanceof CustomEvent&&typeof e.detail==`object`&&e.detail!==null?e.detail:null,n=t?.dock===`right`||t?.dock===`bottom`?t.dock:null;if(t?.agentId!==void 0&&(this.agentId=t.agentId),n&&this.dockLayout.setDock(n,!1),t?.open===!1){this.closeTerminalPanel();return}if(t?.terminalSessionId||t?.open===!0||t?.newSession===!0){if(!this.available)return;this.dockLayout.setOpen(!0),this.activateTerminalHost(),t.newSession===!0?this.terminalSessions.openSession():t.terminalSessionId?this.terminalSessions.attachSessionById(t.terminalSessionId,!0):this.terminalSessions.restoreSessions();return}this.toggle()},this.handleDocumentPointerDown=e=>{if(!this.sessionPickerOpen)return;let t=this.renderRoot.querySelector(`.tp-session-menu`),n=e.composedPath(),r=this.sessionPickerTrigger.value;!(r&&n.includes(r))&&!(t&&n.includes(t))&&this.closeSessionPicker(!1)},new n(this).watchStore(()=>this.context?.config,()=>this.terminalPanelUploadController.syncPolicy()).watchStore(()=>this.context?.theme)}get terminalFontFamily(){return le(this.context?.theme.settings.terminalFontFamily)}get sessionBottomOnly(){return!this.embedded&&this.sessionKey!==null}connectedCallback(){super.connectedCallback(),this.terminalSessions.connectHost(),this.dockLayout.setSuppressed(this.suppressed),!this.fullscreen&&!this.embedded&&!this.sessionBottomOnly&&window.addEventListener(v,this.handleToggleRequest),!this.fullscreen&&!this.embedded&&window.addEventListener(b,this.handleToggleRequest),document.addEventListener(`pointerdown`,this.handleDocumentPointerDown,!0),typeof MutationObserver<`u`&&(this.themeObserver=new MutationObserver(()=>Mt(this.terminalSessions.tabs,this.themeMode)),this.themeObserver.observe(document.documentElement,{attributes:!0,attributeFilter:[`data-theme`,`data-theme-mode`,`style`]})),this.dockLayout.open&&this.terminalSessions.restoreSessions()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener(v,this.handleToggleRequest),window.removeEventListener(b,this.handleToggleRequest),document.removeEventListener(`pointerdown`,this.handleDocumentPointerDown,!0),this.themeObserver?.disconnect(),this.themeObserver=null,this.terminalSessions.disconnectHost()}updated(e){(e.has(`embedded`)||e.has(`sessionKey`))&&!this.fullscreen&&(this.embedded||this.sessionBottomOnly?window.removeEventListener(v,this.handleToggleRequest):window.addEventListener(v,this.handleToggleRequest),this.embedded?window.removeEventListener(b,this.handleToggleRequest):window.addEventListener(b,this.handleToggleRequest)),e.has(`suppressed`)&&this.dockLayout.setSuppressed(this.suppressed)&&this.terminalSessions.restoreSessions(),(e.has(`client`)||e.has(`available`))&&this.terminalSessions.scheduleLifecycleSync();for(let e of this.terminalSessions.tabs)lt(e.controller,this.terminalFontFamily);e.has(`themeMode`)&&Mt(this.terminalSessions.tabs,this.themeMode),e.has(`embedded`)&&this.embedded&&this.terminalSessions.restoreSessions(),(this.embedded||this.dockLayout.open)&&Nt(this.terminalSessions.tabs,this.terminalSessions.activeId,this.findTerminalPanelViewport()),this.dockLayout.syncReservation();let t=JSON.stringify([this.embedded&&this.tabsInHeader,this.terminalSessions.activeId,this.hostedTabs.map(({id:e,label:t,statusLabel:n,badge:r,className:i})=>[e,t,n,r,i]),this.terminalSessions.booting,this.terminalSessions.canHandoffSessions,this.sessionPickerOpen,this.sessionPickerTask.status,this.pickerSessions.map(e=>e.sessionId),this.terminalPanelUploadController.uploadsEnabled(),this.terminalPanelUploadController.hasPendingBatch(),this.terminalPanelUploadController.hasActiveTab()]);t!==this.lastHostedTabsChangeKey&&(this.lastHostedTabsChangeKey=t,this.dispatchEvent(new CustomEvent(qe,{bubbles:!0,composed:!0})))}get hostedTabs(){return Ht(this.terminalSessions.tabs)}get activeHostedTabId(){return this.terminalSessions.activeId}selectHostedTab(e){this.terminalSessions.switchTo(e)}async closeHostedTab(e){this.terminalSessions.closeTab(e),await this.updateComplete}get hostedActions(){if(!this.embedded||!this.tabsInHeader)return x;let e=this.terminalPanelUploadController;return S`
      <zero-tooltip .content=${g(`terminal.sessions`)}>
        ${Zt(this.sessionPickerProps)}
      </zero-tooltip>
      ${e.uploadsEnabled()?S`<zero-tooltip .content=${g(`terminal.addFiles`)}>
              <button
                class="rail-header__action"
                type="button"
                aria-label=${g(`terminal.addFiles`)}
                ?disabled=${!e.hasActiveTab()||e.hasPendingBatch()}
                @click=${e.chooseFiles}
              >
                ${y.paperclip}
              </button>
            </zero-tooltip>`:x}
      <zero-tooltip .content=${g(`terminal.dockBottom`)}>
        <button
          class="rail-header__action"
          type="button"
          aria-label=${g(`terminal.dockBottom`)}
          ?disabled=${!this.terminalSessions.canHandoffSessions}
          @click=${()=>this.setDock(`bottom`)}
        >
          ${y.panelBottomOpen}
        </button>
      </zero-tooltip>
    `}activateTerminalHost(){this.terminalSessions.activateHost()}toggle(){this.available&&(this.dockLayout.open?this.closeTerminalPanel():(this.dockLayout.setOpen(!0),this.activateTerminalHost(),this.terminalSessions.restoreSessions()))}closeTerminalPanel(){this.closeSessionPicker(!1),this.terminalSessions.cancelPendingActions(),this.embedded?this.onClose?.():this.dockLayout.setOpen(!1)}get terminalPanelOpen(){return this.embedded?this.available:this.dockLayout.open&&this.isDockLayoutAvailable()}hideTerminalPanelForUnavailableSurface(){this.dockLayout.hideWithoutPersisting()}restoreTerminalPanelOpenState(){return this.dockLayout.restoreOpenState()}isDockLayoutAvailable(){return this.available&&(!this.sessionBottomOnly||this.dockLayout.dock===`bottom`)}toggleSessionPicker(){if(this.sessionPickerOpen){this.closeSessionPicker(!0);return}this.sessionPickerOpen=!0,this.sessionPickerTask.run(),this.updateComplete.then(()=>{this.sessionPickerOpen&&this.renderRoot.querySelector(`.tp-session-refresh`)?.focus()})}closeSessionPicker(e){this.sessionPickerOpen&&(this.sessionPickerOpen=!1,e&&this.updateComplete.then(()=>{this.sessionPickerTrigger.value?.focus()}))}handleSessionPickerFocusOut(e){let t=e=>e instanceof Node&&(e===this.sessionPickerTrigger.value||this.renderRoot.querySelector(`.tp-session-menu`)?.contains(e));t(e.relatedTarget)||queueMicrotask(()=>{!t(this.shadowRoot?.activeElement??document.activeElement)&&this.sessionPickerOpen&&this.closeSessionPicker(!1)})}async attachPickedSession(e,t){this.sessionPickerOpen=!1,await this.terminalSessions.attachSessionById(e,t?.startsWith(`agent:`)===!0)}setDock(e){let t=this.sessionBottomOnly&&e===`right`;if(this.embedded&&e===`bottom`||t){if(!this.terminalSessions.handoffSessions())return;t&&this.dockLayout.setOpen(!1),window.dispatchEvent(new CustomEvent(t?v:b,{detail:{agentId:this.agentId,dock:e,open:!0}}));return}this.dockLayout.setDock(e),this.updateComplete.then(()=>{for(let e of this.terminalSessions.tabs)e.controller.fit()})}openFullscreen(){let e=Ee({kind:`terminal`},this.basePath);e&&u(e)}resetTerminalSessionPicker(){this.closeSessionPicker(!1),this.sessionPickerTask.run([null]),this.pickerSessions=[]}findTerminalPanelViewport(){return this.renderRoot.querySelector(`.tp-viewport`)}get sessionPickerProps(){return{hosted:this.embedded&&this.tabsInHeader,triggerRef:this.sessionPickerTrigger,open:this.sessionPickerOpen,loading:this.sessionPickerTask.status===Ae.PENDING,sessions:this.pickerSessions,currentSessionIds:new Set(this.terminalSessions.tabs.map(e=>e.gatewaySessionId).filter(e=>e.length>0)),onToggle:()=>this.toggleSessionPicker(),onDismiss:e=>this.closeSessionPicker(e),onFocusOut:e=>this.handleSessionPickerFocusOut(e),onRefresh:()=>void this.sessionPickerTask.run(),onAttach:(e,t)=>void this.attachPickedSession(e,t)}}render(){if(!this.terminalPanelOpen)return x;let e=this.embedded?`embedded`:this.fullscreen?`fullscreen`:this.dockLayout.dock,t=this.embedded||this.fullscreen||this.dockLayout.dock===`main`?x:this.dockLayout.dock===`bottom`?`height:${this.dockLayout.height}px;--tp-panel-height:${this.dockLayout.height}px`:`width:${this.dockLayout.width}px`,n=this.terminalSessions.tabs.find(e=>e.id===this.terminalSessions.activeId),r=this.terminalSessions.waitingForRefresh||this.terminalSessions.booting&&this.terminalSessions.tabs.length===0||n?.status===`connecting`,i=this.terminalSessions.error?{text:this.terminalSessions.error.text,retry:this.terminalSessions.error.retryAction?()=>this.terminalSessions.retryOpen():void 0}:null,a=this.embedded&&this.tabsInHeader,o=this.sessionPickerProps,s=S`<div class="tp-session-picker">
      ${Zt(o)} ${Qt(o)}
    </div>`,c=gt({fullscreen:this.fullscreen,embedded:this.embedded,dock:this.dockLayout.dock,dockDisabled:(this.embedded||this.sessionBottomOnly)&&!this.terminalSessions.canHandoffSessions,upload:this.terminalPanelUploadController,sessionPicker:s,onDock:e=>this.setDock(e),onOpenFullscreen:()=>this.openFullscreen(),onHide:()=>this.closeTerminalPanel()});return S`
      <section class="tp tp--${e}" style=${t} aria-label=${g(`terminal.title`)}>
        ${this.embedded?x:this.dockLayout.renderResizer(`tp`,g(`terminal.resize`))}
        ${a?Qt(o):S`<header class="rail-header tp-header">
                ${Ut({tabs:this.terminalSessions.tabs,activeId:this.terminalSessions.activeId,booting:this.terminalSessions.booting,onSelect:e=>this.terminalSessions.switchTo(e),onClose:e=>this.closeHostedTab(e),onNew:()=>void this.terminalSessions.openSession()})}
                ${c}
              </header>`}
        ${yt({activeId:this.terminalSessions.activeId,tabsInHeader:a,connecting:r,error:i,uploadController:this.terminalPanelUploadController})}
      </section>
    `}willUpdate(){for(let e of this.terminalSessions.tabs)e.host.style.display=e.id===this.terminalSessions.activeId?`block`:`none`}static{this.styles=[Je,We,zt,Kt,Ve]}},D([we({context:he,subscribe:!0})],$.prototype,`context`,void 0),D([w({attribute:!1})],$.prototype,`client`,void 0),D([w({attribute:!1})],$.prototype,`agentId`,void 0),D([w({attribute:!1})],$.prototype,`sessionKey`,void 0),D([w({type:Boolean})],$.prototype,`available`,void 0),D([w({type:Boolean})],$.prototype,`suppressed`,void 0),D([w({attribute:!1})],$.prototype,`themeMode`,void 0),D([w({attribute:!1})],$.prototype,`basePath`,void 0),D([w({type:Boolean})],$.prototype,`fullscreen`,void 0),D([w({type:Boolean})],$.prototype,`embedded`,void 0),D([w({attribute:!1})],$.prototype,`onClose`,void 0),D([w({type:Boolean})],$.prototype,`tabsInHeader`,void 0),D([w({type:Boolean})],$.prototype,`page`,void 0),D([w({attribute:!1})],$.prototype,`routeTarget`,void 0),D([E()],$.prototype,`sessionPickerOpen`,void 0),D([E()],$.prototype,`pickerSessions`,void 0)})))()}var nn=t({});function rn(){return(rn=e((()=>{tn(),customElements.get(`zero-terminal-panel`)||customElements.define(`zero-terminal-panel`,$)})))()}export{nn as n,rn as t};
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Au as t,Ba as n,F as r,Fa as i,H as a,Hs as o,Ic as s,La as c,Lc as l,Mu as u,Nu as d,Pu as f,Ra as p,W as m,bu as h,ci as g,di as _,ju as v,ni as y,xu as b,yu as x,za as S,zu as C}from"./control-ui-core-DCNBgr3X.js";import{$n as ee,$t as te,Ai as ne,Co as re,Do as ie,Ii as ae,Li as oe,Oo as se,Qr as ce,So as le,Zr as ue,Zt as de,an as fe,ca as w,er as pe,go as me,ki as he,la as ge,na as _e,on as ve,qr as ye,sa as T,ta as be,ua as E,wo as D,wr as xe,yr as Se}from"./control-ui-core-DwX5Mpz4.js";import{E as Ce,G as O,J as k,W as A,X as j,Z as we,at as M,et as Te,k as Ee,lt as De,n as Oe,rt as N,t as ke}from"./lit-runtime-B40xFCK_.js";import{Cn as Ae,Sn as je,xn as Me}from"./control-ui-boot-shared-BRtBCr5s.js";import{c as Ne,d as Pe,l as Fe}from"./gateway-runtime-JSfC8ThO.js";import{Mt as Ie,Ur as Le,Wr as Re,Xt as ze,Zr as P,Zt as Be,jt as Ve,xa as He}from"./ui-AaV6iNVa.js";import{D as Ue,F as We,M as Ge,N as Ke,O as qe,T as Je,j as Ye,st as Xe}from"./control-ui-boot-shared-E4pYPcWx.js";import{m as Ze,y as Qe}from"./control-ui-boot-shared-4Y4EIRNw.js";import{B as $e,Ft as et,G as F,I as tt,It as nt,K as rt,Kt as it,Mi as at,U as ot,Ut as st,Y as ct,_n as lt,bt as ut,cn as dt,l as ft,m as pt,na as mt,on as ht,p as gt,q as _t,ta as vt,u as yt,vn as bt,vt as xt}from"./control-ui-boot-shared-ZuP0LiFD.js";import{a as St,i as Ct,o as wt,r as Tt,t as Et}from"./plugin-contracts-runtime-BO_sRtcl.js";import{a as Dt,r as Ot,t as kt}from"./plugin-help-K2l4F8vd.js";import{Dc as At,Ml as jt,Nl as Mt,qo as Nt,wc as Pt}from"./control-ui-boot-shared-CzJHozXQ.js";import{T as Ft,dt as It,ft as Lt,w as Rt}from"./control-ui-boot-chat-D02HpoEK.js";import{H as zt,U as Bt}from"./control-ui-boot-chat-zkzP5WWm.js";import{C as Vt,S as Ht,_ as Ut,b as Wt,g as Gt,v as Kt,x as qt,y as Jt}from"./control-ui-boot-chat-Cx6CBnJr.js";import{_t as Yt,vt as Xt}from"./control-ui-boot-new-5_2Ky4dv.js";import"./control-ui-boot-chat-styles-BcslGtWC.js";import{n as Zt,t as Qt}from"./control-ui-disabled-uxxPH1xo.js";import{n as $t,t as en}from"./panel-empty-state-anOYDn4d.js";import{n as tn,t as nn}from"./reasoned-disabled-control-DN3lFs3n.js";import{n as rn,r as an,t as on}from"./consent-dialog-C_JHSl91.js";import{i as sn,n as cn,s as ln}from"./config-form.search-DBYkS-qK.js";import{c as un,d as dn,f as fn,g as pn,h as mn,m as hn,n as gn,p as _n,t as vn}from"./config-form-D1wuzImG.js";import{H as yn,V as bn,a as xn,s as Sn,z as Cn}from"./config-form.node.shared-Biqvmvhi.js";import{n as wn,t as Tn}from"./wizard-login-controller-tM2ShtC6.js";import{a as En,i as Dn,n as On,r as kn,t as An}from"./settings-model-BZj8p_X9.js";import{i as jn,n as Mn,r as Nn,t as Pn}from"./plugins-hub-header-CUwTrGbx.js";import{n as Fn,t as In}from"./credential-editor-cQ_Bghy1.js";function Ln(e){return e===`#configuration`?`configuration`:`readme`}function Rn(e,t){let n=new URLSearchParams(e?.search);return t?n.set(`view`,`settings`):n.delete(`view`),{pathname:e?.pathname,search:n.size?`?${n}`:``,hash:``}}function zn(e,t,n){if(n){let r=e.catalog.categoryRanks?.[n]??2**53-1,i=t.catalog.categoryRanks?.[n]??2**53-1;if(r!==i)return r-i}let r=(t.catalog.downloads??0)-(e.catalog.downloads??0),i=e.catalog.packageName??e.id,a=t.catalog.packageName??t.id;return r||(i<a?-1:+(i>a))}function Bn(e,t){let n=`${t}Rank`;return e.filter(e=>e.catalog[t]).toSorted((e,t)=>(e.catalog[n]??2**53-1)-(t.catalog[n]??2**53-1)).slice(0,Hn)}var Vn,Hn,Un;function Wn(){return(Wn=e((()=>{Ye(),b(),Vn=100,Hn=8,Un=class{constructor(e,t){this.host=e,this.gateway=t,this.result=null,this.overview=null,this.resultSelection=null,this.error=null,this.remoteError=null,this.categories=[],this.categoriesError=null,this.categoriesReady=!1,this.categoriesStarted=!1,this.featured=[],this.trending=[],this.loadMoreError=null,this.intent=`all`,this.category=null,this.query=``,this.committedQuery=``,this.searchTimer=null,this.categoriesTask=new Ge(e,{autoRun:!1,task:([e],{signal:t})=>e?e.request(`plugins.catalog.categories`,{},{signal:t}):Ke,onComplete:({categories:e})=>{this.categories=e,this.categoriesReady=!0,this.categoriesError=null},onError:e=>{this.categoriesError=x(e)}}),this.browseTask=new Ge(e,{autoRun:!1,task:([e,t,n,r,i],{signal:a})=>e?this.fetchAvailablePage({client:e,intent:t,category:n,query:r,manual:i,signal:a}):Ke,onComplete:e=>this.applyPage(e),onError:e=>{this.error=x(e)}}),this.loadMoreTask=new Ge(e,{autoRun:!1,task:([e,t,n,r,i],{signal:a})=>e&&i?this.fetchAvailablePage({client:e,intent:t,category:n,query:r,cursor:i,signal:a}):Ke,onComplete:e=>{if(!this.result||this.result.nextCursor!==e.requestedCursor)return;let t=new Map(this.result.items.map(e=>[e.id,e]));for(let n of e.items)t.set(n.id,n);let n=[...t.values()];this.result={items:this.intent===`all`&&!this.committedQuery?n.toSorted((e,t)=>zn(e,t,this.category)):n,...e.nextCursor?{nextCursor:e.nextCursor}:{}},this.loadMoreError=e.remoteError??null},onError:e=>{this.loadMoreError=x(e)}})}applyPage(e){this.result={items:e.items,...e.nextCursor?{nextCursor:e.nextCursor}:{}},this.resultSelection=e.selection,this.remoteError=e.remoteError??null,e.overview&&(this.overview=e.remoteError?null:e,e.categories&&(this.categoriesTask.run([null]),this.categories=e.categories,this.categoriesReady=!0,this.categoriesError=null),this.featured=Bn(e.items,`featured`),this.trending=Bn(e.items,`trending`))}get loading(){return this.gateway.isConnected()&&(this.query.trim()!==this.committedQuery||this.browseTask.status===We.PENDING&&(!this.result||this.resultSelection?.intent!==this.intent||this.resultSelection.category!==this.category||this.resultSelection.query!==this.committedQuery))}get categoriesLoading(){return this.gateway.isConnected()&&this.categoriesStarted&&!this.categoriesReady&&this.categoriesTask.status===We.PENDING}async ensureCategories(e=!1){let t=this.gateway.getClient();t&&this.gateway.isConnected()&&!this.categoriesReady&&(!this.categoriesStarted||this.categoriesTask.status!==We.PENDING&&e)&&(this.categoriesError=null,this.categoriesStarted=!0,await this.categoriesTask.run([t]))}get loadingMore(){return this.gateway.isConnected()&&this.loadMoreTask.status===We.PENDING}async fetchAvailablePage(e){let t=!e.cursor&&this.isGroupedOverview(e.intent,e.category,e.query),n=await e.client.request(`plugins.catalog.browse`,{intent:e.intent,...e.category?{category:e.category}:{},...e.query?{query:e.query}:{},...e.manual?{searchSource:`zero-control-ui`}:{},...e.cursor?{cursor:e.cursor}:{},pageSize:Vn},{signal:e.signal});return{items:e.intent===`all`&&!e.query?n.items.toSorted((t,n)=>zn(t,n,e.category)):n.items,overview:t,selection:{intent:e.intent,category:e.category,query:e.query},...n.categories?{categories:n.categories}:{},...n.nextCursor&&!e.query?{nextCursor:n.nextCursor}:{},...n.remoteError?{remoteError:n.remoteError}:{},...e.cursor?{requestedCursor:e.cursor}:{}}}isGroupedOverview(e=this.intent,t=this.category,n=this.committedQuery){return e===`all`&&t===null&&!n}invalidate(){this.disconnect(),this.committedQuery=this.query.trim(),this.result=null,this.resultSelection=null,this.categories=[],this.categoriesReady=!1,this.categoriesError=null,this.error=null,this.remoteError=null,this.featured=[],this.trending=[],this.loadMoreError=null}disconnect(){this.overview=null,this.browseTask.run([null,this.intent,this.category,this.committedQuery,!1]),this.categoriesStarted=!1,this.categoriesTask.run([null]),this.searchTimer&&=(clearTimeout(this.searchTimer),null),this.loadMoreTask.run([null,this.intent,this.category,this.committedQuery,null])}async refresh(){this.overview=null,await this.loadSelection()}async loadSelection(e=!1){let t=this.gateway.getClient();if(t&&this.gateway.isConnected()){if(this.error=null,this.remoteError=null,this.loadMoreError=null,this.loadMoreTask.run([null,this.intent,this.category,this.committedQuery,null]),this.isGroupedOverview()&&this.overview){this.browseTask.run([null,this.intent,this.category,this.committedQuery,!1]),this.applyPage(this.overview),this.host.requestUpdate();return}await this.browseTask.run([t,this.intent,this.category,this.committedQuery,e])}}async loadMore(){let e=this.gateway.getClient(),t=this.result?.nextCursor;e&&this.gateway.isConnected()&&t&&!this.committedQuery&&!this.isGroupedOverview()&&(this.loadMoreError=null,await this.loadMoreTask.run([e,this.intent,this.category,this.committedQuery,t]))}selectIntent(e){this.intent=e,this.category=null,this.loadSelection()}selectCategory(e){this.intent=`all`,this.category=e,this.loadSelection()}updateQuery(e){let t=this.query.trim(),n=e.trim(),r=!!n&&(this.intent!==`all`||this.category!==null);if(this.query=e,n&&(this.intent=`all`,this.category=null),this.host.requestUpdate(),this.searchTimer&&=(clearTimeout(this.searchTimer),null),n!==this.committedQuery||r||n!==t&&(this.resultSelection?.intent!==this.intent||this.resultSelection.category!==this.category)){if(!n){this.committedQuery=``,this.loadSelection();return}this.searchTimer=setTimeout(()=>{this.searchTimer=null;let e=n!==this.committedQuery&&n.length>=2;this.committedQuery=n,this.loadSelection(e)},250)}}}})))()}var Gn;function Kn(){return(Kn=e((()=>{yn(),Fe(),Ot(),Gn=class{constructor(e){e.addController(this)}get available(){return this.plugin!==void 0}update(e){let t=e.context;t!==this.context&&(this.release?.(),this.context=t);let n=e.result?.plugins.find(t=>t.installed&&t.id===e.detail?.pluginId),r=e.detail?.catalog??e.catalogDetail?.result,i=r?.plugin.local.pluginId??r?.detail.packageName,a=r?{tools:r.detail.contracts?.tools,providers:r.detail.providers,channels:r.detail.channels,contracts:r.detail.contracts?Object.entries(r.detail.contracts).filter(([e])=>e!==`tools`).flatMap(([e,t])=>t.map(t=>`${e}: ${t}`)):void 0,skills:r.detail.skills.map(e=>e.name),mcpServers:r.detail.mcpServers}:void 0;if(this.plugin=e.connected&&Ne(t.gateway.snapshot,`zero.chat`,`operator.admin`)?n?{id:n.id,name:n.name,declared:e.detail?.inspection?.declared??(n.catalogId===r?.plugin.id?a:void 0)}:r&&i?{id:i,name:r.plugin.catalog.name,declared:a}:void 0:void 0,!this.plugin){this.release?.(),this.release=void 0;return}this.release=Dt(t,this,this.plugin,{installed:!!n,overview:!n||e.installedDetailTab!==`configuration`})}get ask(){if(!this.context||!this.plugin)return async()=>{};let e=kt(this.context,this.plugin);return t=>{let n=t?.value===void 0?t?.schema.default:t.value;return e(t?{path:t.path,label:t.label,value:n,sensitive:bn(n,t.path,t.hints)}:void 0)}}hostDisconnected(){this.release?.(),this.release=void 0,this.plugin=void 0}}})))()}var qn;function Jn(){return(Jn=e((()=>{wn(),f(),qn=class{constructor(e,t,n){this.gateway=t,this.options=n,this.selection=null,this.dialog=new Tn(e,{getClient:()=>t.client,getAgentId:()=>null,requestFailedMessage:()=>C(`pluginsPage.auth.requestFailed`),sessionExpiredMessage:()=>C(`pluginsPage.auth.sessionExpired`),onClose:()=>{let e=this.selection?.pluginId;this.reset(),e&&n.getDetail()?.pluginId===e&&n.refresh(e)},onAnswer:(e,t)=>{let n=this.selection;this.dialog.runner.answer(e,t).then(e=>{n===this.selection&&this.complete(e)})},onBackgroundCompletion:e=>this.complete(e)})}get busy(){return this.dialog.runner.state.phase!==`idle`}select(e){this.selection&&this.selection.pluginId!==e&&this.reset()}reset(){this.selection=null,this.dialog.reset()}render(){return this.dialog.render()}async start(e){let t=this.gateway.capture(),n=this.options.getDetail();if(!t||!n||!this.options.canSignIn()||this.busy||!n.inspection?.mcpAuth?.some(t=>t.serverName===e&&t.state!==`authorized`))return;let r={pluginId:n.pluginId,scope:t};this.selection=r,this.dialog.runner.prepareSignIn(`oauth`,this.options.getName(n.pluginId)??e);let i=await this.dialog.runner.startMcpLogin(e);r===this.selection&&await this.complete(i)}async complete(e){let t=this.selection;e&&e.isCurrent?.()!==!1&&t&&this.gateway.isCurrent(t.scope)&&this.options.getDetail()?.pluginId===t.pluginId&&(this.reset(),await this.options.refresh(t.pluginId))}}})))()}function I(e){return`plugin:${e}`}function Yn(e,t={}){return e?k`<div
    class="plugins-row-message plugins-row-message--${e.kind} oc-banner ${e.kind===`error`?`oc-banner-error`:`oc-banner-warning`}"
    role=${e.kind===`error`||e.installPolicyWarning?`alert`:`status`}
  >
    <div>
      ${e.text}
      ${e.installPolicyWarning?k`
              <p>${C(`pluginConsent.installPolicy.policyScope`)}</p>
              ${e.installPolicyWarning.details.findings?.map(e=>k`<div class="plugins-policy-review__finding">
                  <strong>${C(`pluginConsent.installPolicy.severity.${e.severity}`)}</strong>
                  <p>${h(e.message)}</p>
                  <details>
                    <summary>${C(`pluginConsent.installPolicy.technicalDetails`)}</summary>
                    <code>${e.ruleId}</code>
                    ${e.file?k`<code>${e.file}${e.line?`:${e.line}`:``}</code>`:O}
                    ${e.evidence?k`<p>${h(e.evidence)}</p>`:O}
                  </details>
                </div>`)}
              ${t.onContinue?k`<button
                      class="btn btn--sm oc-action oc-action-secondary"
                      type="button"
                      ?disabled=${t.busy}
                      @click=${()=>{t.busy||t.onContinue?.({...e.installPolicyWarning.request,acknowledgeInstallPolicyWarning:!0})}}
                    >
                      ${C(`pluginsPage.continueInstall`)}
                    </button>`:O}
            `:O}
    </div>
  </div>`:O}function Xn(){return(Xn=e((()=>{A(),f(),b()})))()}var Zn;function Qn(){return(Qn=e((()=>{In(),Zn=class{constructor(e){this.options=e,this.patch=(e,t)=>{if(!this.options.canEdit())return!1;this.options.onEdit();let n=this.options.getContext().runtimeConfig;return t===void 0?n.removeFormValue(e):n.patchForm(e,t),this.options.getDetail()&&this.options.isSettings()&&(this.write=n.flushFormChanges()),!0},this.render=e=>{let t=this.options.getDetail(),n=t?.inspection?.credentials?.find(t=>t.path.length===e.path.length&&t.path.every((t,n)=>t===e.path[n]));if(!t||!n)return;let r=this.options.getContext().runtimeConfig;return Fn(e,n,{pluginId:t.pluginId,baseHash:r.state.configSnapshot?.hash??null,gateway:this.options.gateway,canInspect:this.options.canInspect(),saveError:r.state.lastError,onDiscard:()=>r.discardFormValue(e.path),onCommit:async(t,n)=>{let r=this.write;return e.onPatch(t,n)!==!1&&this.write&&this.write!==r?this.write:!1}})}}}})))()}function $n(e,t){return e.request(`plugins.inspect`,{pluginId:t})}function er(e){if(e instanceof ee)return wt(e.details)}function tr(){return(tr=e((()=>{St(),pe()})))()}async function nr(e,t,n){let r,i=n?e.addEventListener(e=>{e.event===`plugins.install.progress`&&Qe(Et,e.payload)&&e.payload.requestId===r&&n(e.payload)}):void 0;try{return await e.request(`plugins.install`,t,{onSent:e=>{r=e}})}finally{i?.()}}function rr(){return(rr=e((()=>{Ze(),Me()})))()}function ir(e){if(e instanceof ee)return Ct(e.details)}function ar(){return(ar=e((()=>{Tt(),pe()})))()}function or(e,t){let n=[...(e.warnings??[]).map(e=>h(e)),t?C(`pluginsPage.configRefreshFailed`,{error:t}):null].filter(Boolean);return n.length?{kind:`warning`,text:n.join(`
`)}:null}function sr(e,t){let n=He(e?.runtimeAttempt)?.phase??He(e?.runtime)?.phase;return typeof n==`string`?[t,C(`pluginsPage.runtimeFailurePhase`,{phase:h(n)})].filter(Boolean).join(`
`):t}var cr;function lr(){return(lr=e((()=>{ze(),pe(),f(),b(),tr(),i(),rr(),ar(),Xn(),cr=class{constructor(e){this.host=e,this.consent=null,this.inspection=null,this.inspectionLoading=!1,this.inspectionError=null,this.installProgress=new Map,this.mutationToken=0,this.mutationTokens=new Map,this.installPolicyScopes=new Map}getActiveInstall(e){let t=this.installProgress.get(e);if(t&&t.finishedAt===void 0)return t;let n=this.host.getResult()?.plugins.find(t=>I(t.id)===e),r=n?.catalogId?this.installProgress.get(`install:${n.catalogId}`):void 0;return r?.finishedAt===void 0?r:void 0}reset(){this.close(),this.mutationTokens.clear(),this.installProgress.clear(),this.installPolicyScopes.clear()}reconcileInstallMessages(e){let t={...this.host.getMessages()},n=this.host.getResult();for(let[r,i]of Object.entries(t)){let a=i.savedInstall;if(!a)continue;let o=e?.plugins.some(e=>e.id===a&&e.installed);(o||e&&n?.plugins.some(e=>e.id===a&&e.installed))&&(this.installProgress.get(r)?.finishedAt!==void 0&&this.installProgress.delete(r),(!o||r!==I(a))&&delete t[r])}return t}async runMutation(e,t,n,r,i=t=>{this.host.setMessage(e,{kind:`error`,text:x(t)})}){let a=this.host.gateway.capture(),o=()=>this.host.canMutate()&&!this.getActiveInstall(e);if(!a||!o()||this.host.isBusy(e)||r.confirm&&(!await r.confirm()||!this.host.gateway.isCurrent(a)||!o()||this.host.isBusy(e)))return;this.host.clearPageNotice();let s=++this.mutationToken;this.mutationTokens.set(e,s);let c=()=>this.host.gateway.isCurrent(a)&&this.mutationTokens.get(e)===s,l=()=>c()&&this.mutationToken===s;this.host.setBusy(e,r.action),r.preserveMessageWhilePending||this.host.setMessage(e,null);try{let e=await p(this.host.getContext().runtimeConfig,a.client,t,{canDispatch:()=>c()&&o()});c()&&await n(e.value,e.refreshError,a.client,l)}catch(e){c()&&await i(e,a,c)}finally{this.mutationTokens.get(e)===s&&(this.mutationTokens.delete(e),this.host.setBusy(e,null))}}open(e,t,n){if(!this.host.canMutate())return;let r=this.host.getResult()?.plugins.find(e=>e.id===t);this.host.closeDetails(),this.inspection=null,this.inspectionError=null,this.inspectionLoading=!0,this.consent={intent:e,pluginId:t,fallback:{name:r?.name??t,...r?.version?{version:r.version}:{},...r?.origin===`official`?{official:!0}:{}},...n?{details:n}:{}},this.host.requestUpdate(),this.inspect()}close(){this.consent=null,this.inspection=null,this.inspectionLoading=!1,this.inspectionError=null,this.host.requestUpdate()}async inspect(){let e=this.consent,t=this.host.gateway.capture();if(e?.pluginId&&t){this.inspectionLoading=!0,this.inspectionError=null,this.host.requestUpdate();try{let n=await $n(t.client,e.pluginId);this.host.gateway.isCurrent(t)&&this.consent===e&&(this.inspection=n)}catch(n){this.host.gateway.isCurrent(t)&&this.consent===e&&(this.inspectionError=x(n))}finally{this.host.gateway.isCurrent(t)&&this.consent===e&&(this.inspectionLoading=!1,this.host.requestUpdate())}}}confirm(){let e=this.consent?.intent,t=this.inspection?.reviewToken;e&&!this.inspectionLoading&&!this.inspectionError&&t&&(this.close(),this.mutateInstalledPlugin(e.pluginId,e.kind,e.rowKey,{acknowledgeCapabilities:{reviewToken:t}}))}async install(e,t){let n=this.host.getResult()?.plugins.find(t=>t.installed&&(e.source===`official`||e.source===`bundled`?t.id===e.pluginId:e.source===`clawhub`?t.packageName===e.packageName:`expectedPluginId`in e&&t.id===e.expectedPluginId)),r=this.host.getMessages();if((r[t]??(n?r[I(n.id)]:void 0))?.savedInstall)return;let i=this.installPolicyScopes.get(t);if(this.installPolicyScopes.delete(t),e.acknowledgeInstallPolicyWarning&&(!i||!this.host.gateway.isCurrent(i))){this.host.setMessage(t,{kind:`error`,text:C(`pluginsPage.installDestinationChanged`)});return}await this.runMutation(t,async n=>{let r=this.host.gateway.capture(),i={startedAt:Date.now(),activities:[]};this.installProgress.set(t,i),this.host.requestUpdate();let a=()=>r&&this.host.gateway.isCurrent(r)&&this.installProgress.get(t)===i,o=await nr(n,e,e=>{if(!a())return;let n=i.activities.findIndex(t=>t.activityId===e.activityId);i={...i,activities:n<0?[...i.activities,e]:i.activities.map((t,r)=>r===n?e:t)},this.installProgress.set(t,i),this.host.requestUpdate()});return a()&&(this.installProgress.delete(t),this.host.applyMutationResult(o)),o},async(e,n,r)=>{let i=I(e.plugin.id);i!==t&&this.host.setMessage(t,null),this.host.setMessage(i,or(e,n)),await this.host.refreshCatalogAfterMutation(r)},{action:`install`,preserveMessageWhilePending:e.acknowledgeInstallPolicyWarning===!0},async(n,r,i)=>{let a=n instanceof ee?He(n.details):void 0,o=He(a?.persistence),s=ir(n),c=Be(n)&&!o&&!s,l=o?.operation===`install`&&typeof o.pluginId==`string`&&o.pluginId.trim()?o.pluginId:void 0,u=l?`saved`:a?.pluginInstallRejected===!0?`rejected`:c?`retry`:`unknown`,d={title:C(`pluginsPage.installProgress.${u}.title`),recovery:C(`pluginsPage.installProgress.${u}.recovery`),detail:x(n)},f=this.installProgress.get(t);if(f&&(this.installProgress.set(t,{...f,finishedAt:Date.now(),canRetry:c,...!s||l?{failure:d}:{}}),this.host.requestUpdate()),l){let e=l,o=I(e),s=He(a?.runtime),c={kind:`error`,savedInstall:e,text:sr(a,C(s?.committed===!1?`pluginsPage.installSavedNotApplied`:`pluginsPage.installSaved`,{name:e,error:x(n)}))};await this.reconcileCommittedFailure([t,o],c,r.client,i);return}if(s){this.installPolicyScopes.set(t,r),this.host.setMessage(t,{kind:`warning`,text:s.reason,installPolicyWarning:{details:s,request:e}});return}this.host.setMessage(t,{kind:`error`,text:`${d.recovery}\n${d.detail}`})})}async reconcileCommittedFailure(e,t,n,r){for(let n of e)this.host.setMessage(n,t);let i=this.host.getContext().runtimeConfig.refresh(),[a]=await Promise.allSettled([i,r()?this.host.refreshCatalogAfterMutation(n):Promise.resolve()]);if(r()&&a.status===`rejected`)for(let n of new Set(e))this.host.getMessages()[n]===t&&this.host.setMessage(n,{...t,text:`${t.text}\n${C(`pluginsPage.configRefreshFailed`,{error:x(a.reason)})}`})}async mutateInstalledPlugin(e,t,n=I(e),r={}){await this.runMutation(n,n=>S(n,e,t===`enable`,r),async(e,t,r)=>{this.host.applyMutationResult(e),this.host.setMessage(n,or(e,t)),await this.host.refreshCatalogAfterMutation(r)},{action:t},async(r,i,a)=>{let o=r instanceof ee?He(r.details):void 0,s=He(o?.runtime),c=er(r);if(t!==`disable`&&s?.committed!==!0&&c&&this.host.canMutate()){this.open({kind:t,pluginId:e,rowKey:n},c.pluginId,c);return}let l=this.host.getMessages()[n]?.savedInstall,u={kind:`error`,...l?{savedInstall:l}:{},text:sr(o,x(r))};s?.committed===!0?await this.reconcileCommittedFailure([n],u,i.client,a):this.host.setMessage(n,u)})}}})))()}async function ur(e){let{pluginId:t,plugin:n,catalog:r,gateway:i}=e,a=e.getDetail(),o=a?.pluginId===t?a:null,s=t?{...o,pluginId:t,inspection:o?.inspection??null,catalog:o?.catalog??(r&&r.plugin.id===n?.catalogId?r:void 0),error:null}:null;e.onChange(s);let l=i.capture();if(!n?.installed||!s||!l||!e.canInspect)return;let u=s,{client:d}=l,f=()=>i.isCurrent(l)&&e.getDetail()===u,p=t=>{f()&&(u=t,e.onChange(t))},m=Pe({hello:i.snapshot?.hello},`tools.catalog`)===!0?d.request(`tools.catalog`,{includePlugins:!0}).catch(()=>void 0):Promise.resolve(void 0);try{let e=await $n(d,n.id);if(!f()||(p({...u,inspection:e,tools:void 0,catalog:e.catalog??u.catalog,catalogLoading:!(!n.catalogId||e.catalog||u.catalog)}),m.then(t=>{if(!t)return;let r=new Map(e.declared.tools.map(e=>[e,{name:e}]));for(let e of t.groups.filter(e=>e.pluginId===n.id))for(let t of e.tools)r.set(t.id,{name:t.id,description:t.fullDescription??t.description,parameters:t.parameters});p({...u,tools:[...r.values()]})}),!n.catalogId))return;try{let e=await c(d,n.catalogId,void 0,n.version);p({...u,catalog:e,catalogLoading:!1})}catch{p({...u,catalogLoading:!1})}}catch(e){p({...u,error:x(e)})}}async function dr(e){let{id:t,gateway:n,context:r,location:i,inventory:a}=e,o=e.getDetail();if(e.uninstalling&&o?.id===t)return;let s=o?.id===t?o.result:null;if(s?.detail.origin===`local`&&s.plugin.local.installed&&a&&!a.plugins.some(e=>e.id===s.plugin.local.pluginId)){e.onChange(null),e.showInstalled(null),r.replace(`plugins`,{pathname:D(`plugins`,r.basePath)});return}let l=t?{id:t,result:s,error:null}:null;o?.id!==t&&e.showInstalled(null),e.onChange(l);let u=n.capture();if(!l||!u)return;let d=a?.plugins.find(e=>e.installed&&e.catalogId===t),f=()=>{new URLSearchParams(i?.search).get(`action`)===`install`&&r.replace(`plugins`,{pathname:i?.pathname,search:``})};if(d){f(),await e.showInstalled(d.id);return}e.showInstalled(null);try{let t=await c(u.client,l.id);n.isCurrent(u)&&e.getDetail()===l&&(e.onChange({...l,result:t}),e.showInstalled(t.plugin.local.installed?t.plugin.local.pluginId??null:null),f())}catch(t){n.isCurrent(u)&&e.getDetail()===l&&e.onChange({...l,error:x(t)})}}function fr(){return(fr=e((()=>{me(),b(),Fe(),tr(),i()})))()}function pr(e){return new Set(Array.from(e.querySelectorAll(`[data-plugin-icon-id]`),e=>e.dataset.pluginIconId??``).filter(Boolean))}var mr;function hr(){return(hr=e((()=>{de(),Ut(),mr=class{constructor(e){this.authCandidates=[];let t={getFetchContext:()=>Kt(e.getContext()),isConnected:e.isConnected,onLoadingChange:e.onLoadingChange};this.installed=new Gt({...t,onUrlsChange:e.onInstalledUrlsChange}),this.catalog=new Gt({kind:`catalog`,...t,onUrlsChange:e.onCatalogUrlsChange})}updateAuth(e){let t=te(e),n=t.length!==this.authCandidates.length||t.some((e,t)=>e!==this.authCandidates[t]);return this.authCandidates=t,n}syncInstalled(e,t){this.installed.sync(e,pr(t))}syncCatalog(e,t,n){let r=pr(t);this.catalog.syncCatalog([...e.result?.items??[],...e.featured,...e.trending,...n?[n.plugin]:[]],n?.detail.author?.imageUrl?[n.detail.author.imageUrl]:[],r)}reset(){this.installed.reset(),this.catalog.reset()}}})))()}function gr(e,t){if(!e)return e;let n=e.plugins.findIndex(e=>e.id===t.id),r=[...e.plugins];return n>=0?r[n]=t:r.push(t),{...e,plugins:r}}function _r(e){return e.connected?e.hasAdminAccess?e.mutationAllowed===!1?C(`pluginsPage.changesDisabled`):null:C(`pluginsPage.adminRequired`):C(`pluginsPage.connectToChange`)}function vr(e){if(e.plugin.local.installed||e.plugin.local.action!==`install`)return null;if(e.plugin.local.install)return e.plugin.local.install;let t=e.detail.packageName?.trim();return t?{source:`clawhub`,packageName:t}:null}function yr(){return(yr=e((()=>{f(),It(),Lt()})))()}var L;function br(){return(br=e((()=>{qe(),A(),we(),bt(),w(),f(),It(),m(),Ie(),d(),Lt(),L=class extends v{constructor(...e){super(...e),this.busy=!1,this.disabled=!1,this.pluginName=``,this.buttonClass=``,this.primary=!1,this.onInstall=()=>{},this.open=!1,this.now=Date.now(),this.pinned=!1,this.hovering=!1,this.progressId=`plugin-install-progress-${Ve()}`,this.handleEscape=e=>{e.key===`Escape`&&this.open&&(this.dismiss(),e.stopPropagation())}}connectedCallback(){super.connectedCallback(),document.addEventListener(`keydown`,this.handleEscape)}disconnectedCallback(){clearInterval(this.timer),document.removeEventListener(`keydown`,this.handleEscape),super.disconnectedCallback()}updated(e){(e.has(`progress`)||e.has(`busy`))&&(this.configurePopup(),clearInterval(this.timer),this.timer=void 0,this.progress&&this.progress.finishedAt===void 0&&(this.timer=setInterval(()=>{this.now=Date.now()},1e3)),!this.progress&&!this.busy&&this.dismiss()),this.toggleAttribute(`open`,this.open&&!!this.progress)}dismiss(){this.pinned=!1,this.open=!1}configurePopup(){let e=this.querySelector(`wa-popup`),t=this.querySelector(`button`);e instanceof Xe&&t&&(lt(e,t,`bottom`),e.distance=16,e.hoverBridge=!0)}render(){let e=this.progress,t=e?.finishedAt!==void 0,n=!!e||this.busy,r=!n||e?.canRetry===!0&&!this.busy,i=e?Math.max(0,Math.floor(((e.finishedAt??this.now)-e.startedAt)/1e3)):0;return k`<span
      class="plugin-install-action"
      @mouseenter=${()=>{this.hovering=!0,this.open=!0}}
      @mouseleave=${()=>{this.hovering=!1,!this.pinned&&!this.contains(document.activeElement)&&(this.open=!1)}}
      @focusin=${()=>{this.open=!0}}
      @focusout=${e=>{!this.pinned&&!this.hovering&&!(e.relatedTarget instanceof Node&&this.contains(e.relatedTarget))&&(this.open=!1)}}
    >
      <button
        type="button"
        class=${`${this.buttonClass} plugin-install-action__button ${this.primary&&!t?`primary oc-action-primary`:`oc-action-secondary`} ${t?`plugin-install-action__button--failed`:``}`}
        ?disabled=${this.disabled&&r}
        aria-label=${this.pluginName&&(r||t)?C(r?t?`pluginsPage.retryInstallNamed`:`pluginsPage.installNamed`:`pluginsPage.viewInstallStatusNamed`,{name:this.pluginName}):O}
        aria-busy=${n&&!t?`true`:O}
        aria-expanded=${e?String(this.open):O}
        aria-controls=${e?this.progressId:O}
        @click=${e=>{e.preventDefault(),e.stopPropagation(),r?this.disabled||this.onInstall():(this.pinned=!this.pinned,this.open=this.pinned)}}
      >
        ${n&&!t?k`<span class="btn__spinner" aria-hidden="true"></span>`:O}
        ${C(r?t?`pluginsPage.retryInstall`:`pluginsPage.install`:t?`pluginsPage.installProgress.viewStatus`:`pluginsPage.installing`)}
        ${e?T.chevronDown:O}
      </button>
      ${e?k`<wa-popup class="plugin-install-action__popup" ?active=${this.open}>
              <section
                class="plugin-install-progress"
                id=${this.progressId}
                role="status"
                aria-label=${C(`pluginsPage.installProgress.title`)}
              >
                <div class="plugin-install-progress__header">
                  <strong
                    >${e.failure?.title??C(t?`pluginsPage.installProgress.stopped`:`pluginsPage.installProgress.title`)}</strong
                  ><span aria-hidden="true"
                    >${a({value:i,unit:`second`})}</span
                  >
                </div>
                ${e.failure&&!e.canRetry?k`<p class="plugin-install-progress__recovery">${e.failure.recovery}</p>`:O}
                <ol class="plugin-install-progress__activities">
                  ${e.activities.map(e=>k`<li
                      class=${`plugin-install-progress__activity plugin-install-progress__activity--${e.status}`}
                    >
                      <span class="plugin-install-progress__icon" aria-hidden="true"
                        >${e.status===`completed`?T.check:e.status===`failed`?`!`:O}</span
                      >
                      <span
                        >${C(`pluginsPage.installProgress.${e.stage}.${e.status}`)}</span
                      >
                    </li>`)}
                  ${t&&!e.activities.some(e=>e.status===`failed`)?k`<li class="plugin-install-progress__activity plugin-install-progress__activity--failed"><span class="plugin-install-progress__icon" aria-hidden="true">!</span><span>${C(`pluginsPage.installProgress.failure`)}</span></li>`:O}
                </ol>
                ${e.failure?k`<details class="plugin-install-progress__failure">
                        <summary>${C(`pluginsPage.installProgress.details`)}</summary>
                        <p>${e.failure.detail}</p>
                      </details>`:O}
              </section>
            </wa-popup>`:O}
    </span>`}},P([M({attribute:!1})],L.prototype,`progress`,void 0),P([M({attribute:!1})],L.prototype,`busy`,void 0),P([M({attribute:!1})],L.prototype,`disabled`,void 0),P([M({attribute:!1})],L.prototype,`pluginName`,void 0),P([M({attribute:!1})],L.prototype,`buttonClass`,void 0),P([M({attribute:!1})],L.prototype,`primary`,void 0),P([M({attribute:!1})],L.prototype,`onInstall`,void 0),P([N()],L.prototype,`open`,void 0),P([N()],L.prototype,`now`,void 0),customElements.get(`zero-plugin-install-action`)||customElements.define(`zero-plugin-install-action`,L)})))()}function xr(e){return k`<nav class="plugins-settings-breadcrumb" aria-label=${C(`pluginsPage.breadcrumb`)}>
    <a
      class="plugins-settings-breadcrumb__parent"
      href=${e.backHref}
      @click=${t=>{o(t)&&(t.preventDefault(),e.onBack())}}
      >${e.backLabel}</a
    >
    <span class="plugins-settings-breadcrumb__chevron" aria-hidden="true"
      >${T.chevronRight}</span
    >
    <span class="plugins-settings-breadcrumb__current" aria-current="page">${e.name}</span>
  </nav>`}function Sr(e){let t=`${e.id}-title`;return k`<section
    class="plugin-catalog-detail ${e.sidebar?``:`plugin-catalog-detail--no-sidebar`}"
    aria-labelledby=${t}
  >
    ${xr(e)}
    <div class="plugin-catalog-detail__hero">
      ${e.icon?k`<div class="plugin-catalog-detail__icon" aria-hidden="true">${e.icon}</div>`:O}
      <div class="plugin-catalog-detail__heading">
        <div class="plugin-catalog-detail__title-row">
          <h1 id=${t}>${e.name}</h1>
        </div>
        ${e.identity}
        ${e.summary?k`<p class="plugin-catalog-detail__summary">${e.summary}</p>`:O}
        <div class="plugin-catalog-detail__actions">${e.titleAction??O}</div>
      </div>
    </div>
    <div class="plugin-catalog-detail__content">
      <div class="plugin-catalog-detail__main">
        <section class="plugin-catalog-detail__panel">${e.panel}</section>
        ${e.readme?k`<section class="plugin-catalog-detail__readme-section">
                <h2>${C(`pluginsPage.detailTabs.readme`)}</h2>
                ${e.readme}
              </section>`:O}
      </div>
      ${e.sidebar?k`<aside class="plugin-catalog-detail__sidebar">${e.sidebar}</aside>`:O}
    </div>
  </section>`}function Cr(){return(Cr=e((()=>{A(),w(),f(),It(),Lt()})))()}function wr(e){return k`<div
    class="plugin-catalog-grid plugin-catalog-grid--skeleton"
    role="status"
    aria-busy="true"
    aria-label=${e.label??C(`common.loading`)}
  >
    ${Array.from({length:e.cards},()=>k`<div
        class="plugin-catalog-card oc-card plugin-catalog-card--skeleton"
        aria-hidden="true"
      >
        <div class="plugin-catalog-card__head">
          <div class="installed-plugins-card__head">
            <span class="skeleton plugin-catalog-card__skeleton-art"></span>
            <div class="installed-plugins-card__identity">
              <span class="skeleton plugin-catalog-card__skeleton-title"></span>
            </div>
          </div>
          <div class="plugin-catalog-card__action">
            <span class="skeleton plugin-catalog-card__skeleton-action"></span>
          </div>
        </div>
        <span class="plugin-catalog-card__skeleton-summary">
          <span class="skeleton plugin-catalog-card__skeleton-line"></span>
          <span class="skeleton plugin-catalog-card__skeleton-line"></span>
        </span>
      </div>`)}
  </div>`}var Tr;function Er(){return(Er=e((()=>{A(),we(),f(),d(),Tr=class extends t{constructor(...e){super(...e),this.label=``,this.cards=8,this.frame=0,this.scheduleMeasure=()=>{cancelAnimationFrame(this.frame),this.frame=requestAnimationFrame(this.measure)},this.measure=()=>{let e=this.querySelector(`.plugin-catalog-grid`),t=e?.firstElementChild;if(!e||!t)return;let n=t.getBoundingClientRect().height;if(!n)return;let r=getComputedStyle(e),i=r.gridTemplateColumns.split(` `).length,a=Number.parseFloat(r.rowGap)||0,o=innerHeight-Math.max(0,e.getBoundingClientRect().top);this.cards=Math.max(1,Math.ceil((o+a)/(n+a)))*i}}connectedCallback(){super.connectedCallback(),window.addEventListener(`resize`,this.scheduleMeasure),typeof ResizeObserver<`u`&&(this.observer=new ResizeObserver(this.scheduleMeasure),this.observer.observe(this.closest(`.plugin-catalog-results`)??this))}disconnectedCallback(){this.observer?.disconnect(),cancelAnimationFrame(this.frame),window.removeEventListener(`resize`,this.scheduleMeasure),super.disconnectedCallback()}render(){return wr({label:this.label,cards:this.cards})}},P([M({attribute:!1})],Tr.prototype,`label`,void 0),P([N()],Tr.prototype,`cards`,void 0),customElements.get(`zero-plugin-catalog-skeleton`)||customElements.define(`zero-plugin-catalog-skeleton`,Tr)})))()}function Dr(e){return e&&Object.hasOwn(Vr,e)&&Vr[e]||T.box}function Or(e,t){let n=At({pluginId:e.local.pluginId,imageUrl:e.catalog.imageUrl},t);return rn(e.local.pluginId??e.id,e.catalog.name,{iconUrl:n??void 0,whiteBackground:e.catalog.official&&!!n,loading:!!(e.local.pluginId&&t.pluginIconLoading?.(e.local.pluginId)||e.catalog.imageUrl&&t.iconLoading?.(e.catalog.imageUrl))})}function kr(e){if(e<1e3)return new Intl.NumberFormat().format(e);let t=e<1e6?1e3:1e6,n=e/t;return`${n>=100?Math.round(n):Number(n.toFixed(1))}${t===1e3?`k`:`m`}`}function Ar(e,t){let n=e.local.state===`not-installed`?null:e.local.state,r=t.installProgress?.get(`install:${e.id}`),i=!!(r&&r.finishedAt===void 0),a=e.local.installed&&n!==null&&!i,s=!!t.busy?.[`install:${e.id}`],c=t.canInstall&&e.local.action===`install`&&!s&&!t.messages?.[`install:${e.id}`]?.savedInstall;return k`<article
    class="plugin-catalog-card oc-card oc-card-interactive"
    data-plugin-id=${e.id}
  >
    <a
      class="plugin-catalog-card__primary-link"
      href=${t.entryHref(e.id)}
      aria-label=${e.catalog.name}
      @click=${n=>{o(n)&&(n.preventDefault(),t.onOpenEntry(e.id))}}
    ></a>
    <div class="plugin-catalog-card__head">
      <div class="installed-plugins-card__head">
        <span
          class="installed-plugins-card__art plugin-catalog-card__art"
          aria-hidden="true"
          data-plugin-icon-id=${e.local.pluginId??O}
        >
          ${Or(e,t)}
        </span>
        <div class="installed-plugins-card__identity">
          <div class="plugin-card-title-row">
            <h3>${e.catalog.name}</h3>
            ${e.catalog.official?Ht():O}
          </div>
          ${Wt(e.catalog.author,{linked:!0})}
        </div>
      </div>
      <div class="plugin-catalog-card__action">
        ${a?Vt(n,`plugin-catalog-card__status`):k`<zero-plugin-install-action
                .buttonClass=${`btn btn--sm plugin-catalog-card__install oc-action oc-action-secondary`}
                .pluginName=${e.catalog.name}
                .busy=${s}
                .disabled=${!c}
                .progress=${r}
                .onInstall=${()=>t.onInstall(e.id)}
              ></zero-plugin-install-action>`}
      </div>
    </div>
    ${qt(e.catalog.summary||C(`pluginsPage.optionalCapability`))}
    ${Yn(t.messages?.[`install:${e.id}`],{busy:s,onContinue:t.canInstall&&t.onContinueInstall?n=>t.onContinueInstall?.(e.id,n):void 0})}
  </article>`}function jr(e,t,n=!1){return k`<div
    class=${n?`callout warning oc-banner`:`callout danger oc-banner oc-banner-error`}
    role=${n?`status`:`alert`}
  >
    <span>${h(e)}</span>
    <button
      type="button"
      class="btn btn--sm oc-action oc-action-secondary oc-banner-action"
      @click=${t}
    >
      ${C(`pluginsPage.tryAgain`)}
    </button>
  </div>`}function Mr(e){return!e.loading&&e.items.length===0?O:k`<section
    class="plugin-catalog-section ${e.onViewAll?`plugin-catalog-section--expandable`:``}"
    data-catalog-section=${e.id}
  >
    <header class="plugin-catalog-section__header">
      <h2>${e.title}</h2>
      ${e.onViewAll?k`<button
              type="button"
              class="btn btn--sm plugin-catalog-section__view-all oc-action oc-action-ghost"
              @click=${e.onViewAll}
            >
              ${C(`pluginsPage.viewAllInstalledPlugins`)}
            </button>`:O}
    </header>
    ${e.loading?wr({cards:Rr}):k`<div class="plugin-catalog-grid">
            ${Oe(e.onViewAll?e.items.slice(0,Rr):e.items,e=>e.id,t=>Ar(t,e.props))}
          </div>`}
  </section>`}function Nr(e){return k`<div
    class="plugin-catalog-chips"
    role="group"
    aria-label=${C(`pluginsPage.categoriesLabel`)}
  >
    ${[[`all`,`pluginsPage.intentAll`,T.layoutGrid],...Br].map(([t,n,r])=>{let i=e.intent===t&&(t!==`all`||e.category===null);return k`<button
          type="button"
          class="plugin-catalog-chip ${i?`is-active`:``}"
          aria-pressed=${i}
          @click=${()=>e.onIntentChange(t)}
        >
          <span aria-hidden="true">${r}</span>${C(n)}
        </button>`})}
    ${e.categoriesLoading?k`<span class="sr-only" role="status">${C(`pluginsPage.loadingCategories`)}</span>
            ${Array.from({length:zr},()=>k`<span
                class="skeleton plugin-catalog-chip--skeleton"
                aria-hidden="true"
              ></span>`)} `:O}
    ${Oe(e.categories.filter(e=>e.slug!==`other`).toSorted((e,t)=>e.order-t.order),e=>e.slug,t=>k`<button
        type="button"
        class="plugin-catalog-chip ${e.category===t.slug?`is-active`:``}"
        aria-pressed=${e.category===t.slug}
        @click=${()=>e.onCategoryChange(t.slug)}
      >
        <span aria-hidden="true">${Dr(t.icon)}</span>${t.label}
      </button>`)}
  </div>`}function Pr(){return $t({icon:T.search,heading:C(`pluginsPage.noDiscoveryResults`),description:C(`pluginsPage.noDiscoveryResultsHint`)})}function Fr(e){let t=e.result?.items??[];if(e.loading)return k`<zero-plugin-catalog-skeleton
      .label=${C(`pluginsPage.loadingDiscovery`)}
    ></zero-plugin-catalog-skeleton>`;if(e.error)return jr(e.error,e.onRetry);if(!e.connected)return k`<p class="plugin-catalog-results__empty">${C(`pluginsPage.discoveryOffline`)}</p>`;if(t.length===0)return Pr();let n=t.filter(e=>e.catalog.official),r=t.filter(e=>!e.catalog.official);return k`
    ${e.query.trim()&&n.length>0&&r.length>0?k`
            ${[[`official`,n],[`community`,r]].map(([t,n])=>Mr({id:t,title:C(`pluginsPage.${t}`),items:n,props:e}))}
          `:k`<div class="plugin-catalog-grid plugin-catalog-grid--results">
            ${Oe(t,e=>e.id,t=>Ar(t,e))}
          </div>`}
    ${e.loadMoreError?jr(e.loadMoreError,e.onLoadMore):O}
    ${e.result?.nextCursor?k`<div class="plugin-catalog-load-more">
            <button
              type="button"
              class="btn btn--sm oc-action oc-action-secondary"
              ?disabled=${e.loadingMore}
              @click=${e.onLoadMore}
            >
              ${C(e.loadingMore?`pluginsPage.loadingMore`:`pluginsPage.loadMore`)}
            </button>
          </div>`:O}
  `}function Ir(e){let t=e.result?.items??[],n=e.categories.filter(e=>e.slug!==`other`).toSorted((e,t)=>e.order-t.order);return!(e.featured.length>0||e.trending.length>0||t.some(e=>n.some(t=>e.catalog.categories.includes(t.slug))))&&!e.loading&&!e.error&&!e.remoteError?Pr():k`
    ${e.error?jr(e.error,e.onRetry):O}
    ${Br.map(([t,n])=>Mr({id:t,title:C(n),items:e[t],loading:e.loading,onViewAll:()=>e.onIntentChange(t),props:e}))}
    ${Oe(n,e=>e.slug,n=>Mr({id:n.slug,title:n.label,items:t.filter(e=>e.catalog.categories.includes(n.slug)).toSorted((e,t)=>zn(e,t,n.slug)),onViewAll:()=>e.onCategoryChange(n.slug),props:e}))}
  `}function Lr(e){let t=!e.query.trim()&&e.intent===`all`&&e.category===null;return k`<section class="plugin-catalog-results" aria-label=${C(`pluginsPage.exploreTitle`)}>
    <label class="plugin-catalog-search">
      <span aria-hidden="true">${T.search}</span>
      <input
        type="search"
        class="oc-input"
        autofocus
        aria-label=${C(`pluginsPage.searchPlugins`)}
        placeholder=${C(`pluginsPage.searchPlugins`)}
        .value=${e.query}
        ${Ee(e=>{e instanceof HTMLInputElement&&!e.dataset.autofocused&&(e.dataset.autofocused=`true`,e.focus(),requestAnimationFrame(()=>requestAnimationFrame(()=>{e.isConnected&&e.focus()})))})}
        @input=${t=>{t.currentTarget instanceof HTMLInputElement&&e.onQueryChange(t.currentTarget.value)}}
      />
    </label>
    ${Nr(e)}
    ${e.categoriesError?jr(e.categoriesError,e.onRetryCategories):O}
    ${e.remoteError?jr(e.remoteError,e.onRetry,!0):O}
    <div class="plugin-catalog-results__body">
      ${t?Ir(e):Fr(e)}
    </div>
  </section>`}var Rr,zr,Br,Vr;function Hr(){return(Hr=e((()=>{A(),Ce(),br(),ke(),ge(),w(),en(),f(),b(),Er(),on(),Jt(),Xn(),Pt(),Rr=8,zr=22,Br=[[`featured`,`pluginsPage.featuredTitle`,T.star],[`trending`,`pluginsPage.intentTrending`,T.barChart]],Vr={activity:T.activity,"book-open":T.book,brain:T.brain,bot:T.bot,database:E(j` <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
    <path d="M3 12A9 3 0 0 0 21 12" />`),"git-branch":T.gitPullRequest,globe:T.globe,"message-circle":T.messageSquare,"message-square":T.messageSquare,mic:T.mic,monitor:T.monitor,package:T.box,palette:T.palette,shield:T.shield,wrench:T.settings,plug:T.plug,"code-xml":E(j` <path d="m18 16 4-4-4-4" />
    <path d="m6 8-4 4 4 4" />
    <path d="m14.5 4-5 16" />`),server:T.server,files:E(j` <path d="M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
    <path d="M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z" />
    <path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1" />`),inbox:T.inbox,"list-todo":E(j` <path d="M13 5h8" />
    <path d="M13 12h8" />
    <path d="M13 19h8" />
    <path d="m3 17 2 2 4-4" />
    <rect x="3" y="4" width="6" height="6" rx="1" />`),"calendar-days":E(j` <path d="M8 2v3" />
    <path d="M16 2v3" />
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 13h.01" />
    <path d="M12 13h.01" />
    <path d="M16 13h.01" />
    <path d="M8 17h.01" />
    <path d="M12 17h.01" />
    <path d="M16 17h.01" />`),"wallet-cards":E(j` <path d="M3 11h3.75a2 2 0 0 1 1.6.8l.45.6a4 4 0 0 0 6.4 0l.45-.6a2 2 0 0 1 1.6-.8H21" />
    <path d="M3 7h18" />
    <rect x="3" y="3" width="18" height="18" rx="2" />`),megaphone:E(j` <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
    <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
    <path d="M8 6v8" />`),"chart-no-axes-combined":E(j` <path d="M12 16v5" />
    <path d="M16 14.639V21" />
    <path d="M20 10.656V21" />
    <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
    <path d="M4 18.463V21" />
    <path d="M8 14.656V21" />`),workflow:E(j` <rect width="8" height="8" x="3" y="3" rx="2" />
    <path d="M7 11v4a2 2 0 0 0 2 2h4" />
    <rect width="8" height="8" x="13" y="13" rx="2" />`),search:T.search}})))()}function Ur(e){return/^(?:clean|pass|safe|benign|cleared)$/iu.test(e)?`pass`:/^(?:suspicious|warning|review)$/iu.test(e)?`warning`:/^(?:blocked|danger|fail|malicious)$/iu.test(e)?`danger`:`unknown`}function Wr(e,t){let n=Ur(e),r={pass:3,warning:2,danger:1,unknown:0}[n];return k`<a
    class="plugin-catalog-detail__security plugin-catalog-detail__security--${n}"
    href=${t??O}
    target="_blank"
    rel="noopener noreferrer"
  >
    <h2>
      ${C(`pluginsPage.detailSecurity`)}
      <span title=${C(`pluginsPage.detailSecurityAudit`)}>${T.info}</span>
    </h2>
    <div class="plugin-catalog-detail__security-score">
      <strong>${n===`pass`?`Clean`:n===`warning`?`Review`:e}</strong>
      ${[0,1,2].map(e=>k`<span class=${e<r?`is-filled`:``} aria-hidden="true"></span>`)}
    </div>
  </a>`}function Gr(){return(Gr=e((()=>{A(),w(),f(),It(),Lt()})))()}function Kr(e){let t=e?URL.parse(e):null;return t&&/^https?:$/u.test(t.protocol)&&!t.username&&!t.password?t:null}function qr(e){if(!e)return null;let t=Kr(/^[\w.-]+\/[\w.-]+$/u.test(e)?`https://github.com/${e}`:e.replace(/^git\+/u,``));if(!t)return null;let n=t.hostname===`github.com`,[r,i]=t.pathname.split(`/`).filter(Boolean);if(n&&r&&i){let e=`${r}/${i.replace(/\.git$/u,``)}`;return{href:`https://github.com/${e}`,name:e,github:n}}return{href:t.href,name:t.hostname+t.pathname.replace(/\/$/u,``),github:n}}function Jr(e,t){let n=e?.detail.author,r=n?.handle??e?.plugin.catalog.author,i=n?.displayName??t;return!i&&!r?O:k`<div class="plugin-catalog-detail__publisher">
    <span class="plugin-catalog-detail__publisher-name">
      ${i?k`<strong>${i}</strong>`:Wt(r,{linked:!0})}
      ${n?.official===!0?Ht():O}
    </span>
    ${i?Wt(r,{linked:!0}):O}
  </div>`}function Yr(e,t,n,i=!1){let a=e?.detail,o=e?.plugin.catalog,s=qr(n?.repositoryUrl??a?.repositoryUrl??a?.verification?.sourceRepo),c=Kr(n?.documentationUrl??a?.documentationUrl),l=[[C(`pluginsPage.catalogDownloadsColumn`),o?.downloads===void 0?void 0:kr(o.downloads)],[C(`pluginsPage.detailPublished`),a?.createdAt===void 0?void 0:r(a.createdAt,{dateStyle:`medium`})],[C(t?`pluginsPage.detailInstalledVersion`:`pluginsPage.version`),t??o?.latestVersion],[C(`pluginsPage.detailUpdated`),a?.updatedAt===void 0?void 0:r(a.updatedAt,{dateStyle:`medium`})]],u=o?.categories??[],d=k`<span
    class="plugin-metadata__placeholder skeleton"
    aria-hidden="true"
  ></span>`;return k`
    ${i?k`<section class="plugin-metadata__loading" role="status" aria-label=${C(`pluginsPage.detailLoading`)}><span class="plugin-metadata__placeholder skeleton" aria-hidden="true"></span>${d}</section>`:O}
    ${a?.security?Wr(a.security.verdict??`unknown`,a.security.auditUrl):O}
    ${i||l.some(([,e])=>e!==void 0)?k`<dl class="plugin-metadata__facts">
            ${l.filter(([,e])=>i||e!==void 0).map(([e,t])=>k`<div>
                    <dt>${e}</dt>
                    <dd>${t??d}</dd>
                  </div>`)}
          </dl>`:O}
    ${u.length?k`<section class="plugin-metadata__section">
            <h2>${C(`pluginsPage.detailCategories`)}</h2>
            <div class="plugin-metadata__categories">
              ${u.map(e=>k`<span class="chip">${e}</span>`)}
            </div>
          </section>`:O}
    ${s?k`<section class="plugin-metadata__section">
            <h2>${C(`pluginsPage.detailRepository`)}</h2>
            <a
              class="plugin-metadata__repository"
              href=${s.href}
              target="_blank"
              rel="noopener noreferrer"
              >${s.github?T.github:T.externalLink}<span
                >${s.name}</span
              ></a
            >
          </section>`:O}
    ${c?k`<section class="plugin-metadata__section">
            <h2>${C(`pluginsPage.detailDocumentation`)}</h2>
            <a href=${c.href} target="_blank" rel="noopener noreferrer"
              >${C(`pluginsPage.detailDocumentation`)} ${T.arrowUpRight}</a
            >
          </section>`:O}
  `}function R(e,t,n){return k`${t.length?k`<section class="plugin-capabilities">
          <h2>${e}<span>${t.length}</span></h2>
          <div>
            ${t.map(e=>{let t=e.onOpen,r=k`<span class="plugin-capability__icon" aria-hidden="true"
                  >${n}</span
                ><span class="plugin-capability__copy"
                  ><strong>${e.name}</strong
                  >${e.description?k`<span>${e.description}</span>`:O}</span
                >${e.trailing?k`<span class="plugin-capability__trailing">${e.trailing}</span>`:O}${t||e.details?k`<span class="plugin-capability__chevron" aria-hidden="true">${T.chevronRight}</span>`:O}`;return k`<div class="plugin-capability">
                ${e.details?k`<details class="plugin-capability__disclosure">
                        <summary>${r}</summary>
                        <div class="plugin-capability__details">${e.details}</div>
                      </details>`:t?k`<button type="button" @click=${t}>${r}</button>`:k`<div class="plugin-capability__static">${r}</div>`}
              </div>`})}
          </div>
        </section>`:O}`}function Xr(e,t=[]){return R(C(e.length===1?`pluginsPage.detailMcpServer`:`pluginsPage.detailMcpServers`),e.map(e=>{let n=t.find(t=>t.name===e),r=[[C(`pluginsPage.mcpDetails.endpoint`),n?.endpointRedacted?C(`pluginsPage.mcpDetails.endpointRedacted`):n?.url],[C(`pluginsPage.mcpDetails.transport`),n?.transport],[C(`pluginsPage.mcpDetails.authentication`),n?.auth?C(`pluginsPage.mcpDetails.auth.${n.auth}`):void 0],[C(`pluginsPage.mcpDetails.scope`),n?.scope]].filter(([,e])=>e);return{name:e,details:k`
          ${r.length?k`<dl class="plugin-mcp-details">
                  ${r.map(([e,t])=>k`<dt>${e}</dt>
                        <dd>${t}</dd>`)}
                </dl>`:O}
          ${n?.setup?k`<p>${n.setup}</p>`:O}
          ${!r.length&&!n?.setup?k`<p>${C(`pluginsPage.mcpDetails.unavailable`)}</p>`:O}
        `}}),T.plug)}function Zr(e,t){return R(C(`pluginsPage.detailCapabilities`),[...$r.filter(t=>e?.[t]?.length).map(e=>`capabilityFamilies.${e}`),...je.filter(e=>t?.includes(e)).map(e=>`uiCapabilities.${e}`)].map(e=>({name:C(`pluginsPage.${e}.name`),description:C(`pluginsPage.${e}.description`)})),T.layers)}function Qr(e,t=!0){return e?k`<button
        type="button"
        class="btn oc-action ${t?`primary oc-action-primary`:`oc-action-secondary`}"
        @click=${e}
      >
        ${ue()}
      </button>`:O}var $r;function ei(){return(ei=e((()=>{A(),Ae(),w(),ce(),f(),m(),Hr(),Jt(),Gr(),$r=[`speechProviders`,`realtimeTranscriptionProviders`,`realtimeVoiceProviders`,`mediaUnderstandingProviders`,`imageGenerationProviders`,`videoGenerationProviders`,`musicGenerationProviders`,`embeddingProviders`,`webSearchProviders`,`webFetchProviders`,`webContentExtractors`,`documentExtractors`,`transcriptSourceProviders`,`migrationProviders`]})))()}function ti(e){let t=e?ut(e,{mode:`document`}).replaceAll(`<h1`,`<h2`).replaceAll(`</h1>`,`</h2>`):null;return e?k`<article
        class="plugin-catalog-detail__readme sidebar-markdown"
        @click=${st}
      >
        ${Ue(t)}
      </article>`:k`<p class="plugin-catalog-detail__empty">${C(`pluginsPage.detailNoReadme`)}</p>`}function ni(e,t){let{plugin:n,detail:r}=e,i=!!(t.installProgress&&t.installProgress.finishedAt===void 0),a=n.catalog.imageUrl?t.iconUrls[n.catalog.imageUrl]:void 0,o=r.author?.imageUrl?t.iconUrls[r.author.imageUrl]:void 0;return Sr({id:`plugin-catalog-detail`,name:n.catalog.name,summary:n.catalog.summary,backHref:t.backHref,backLabel:C(`tabs.plugins`),onBack:t.onBack,icon:rn(n.id,n.catalog.name,{iconUrl:a,authorIconUrl:o,whiteBackground:n.catalog.official&&!!a,loading:!!(n.catalog.imageUrl&&t.iconLoading?.(n.catalog.imageUrl)||r.author?.imageUrl&&t.iconLoading?.(r.author.imageUrl))}),titleAction:k`${n.local.action===`install`||i?tn(t.installBlockedReason,k`<zero-plugin-install-action
              .buttonClass=${`btn oc-action plugin-catalog-detail__install`}
              .primary=${!0}
              .disabled=${!t.canInstall}
              .busy=${!!t.busy}
              .progress=${t.installProgress}
              .onInstall=${t.onInstall}
            ></zero-plugin-install-action>`):O}${Qr(t.onAskPlugin,n.local.action!==`install`&&!i)}`,identity:Jr(e),sidebar:Yr(e),panel:k`${Yn(t.message,{busy:t.busy,onContinue:t.canInstall?t.onContinueInstall:void 0})}
    ${Zr(r.contracts,r.uiCapabilities)}
    ${t.skillsSection??R(C(`pluginsPage.detailTabs.skills`),r.skills,T.bookOpenText)}
    ${R(C(`pluginsPage.detailTools`),(r.contracts?.tools??[]).map(e=>({name:e})),T.wrench)}
    ${Xr(r.mcpServers,r.mcpServerDetails)}`,readme:r.readme?ti(r.readme):void 0})}function ri(e){return F(e.error?k`<div class="callout danger oc-banner oc-banner-error" role="alert">
          <span>${h(e.error)}</span>
          <button type="button" class="btn btn--sm" @click=${e.onRetry}>
            ${C(`pluginsPage.tryAgain`)}
          </button>
        </div>`:e.connected?e.result?ni(e.result,e):k`<section
              class="plugin-catalog-detail plugin-catalog-detail--loading"
              aria-label=${C(`pluginsPage.detailLoading`)}
            >
              <div class="plugin-catalog-detail__back skeleton"></div>
              <div class="plugin-catalog-detail__hero">
                <div class="plugin-catalog-detail__icon skeleton"></div>
                <div>
                  <div class="plugin-catalog-detail__loading-title skeleton"></div>
                  <div class="plugin-catalog-detail__loading-publisher skeleton"></div>
                  <div class="plugin-catalog-detail__loading-summary skeleton"></div>
                </div>
              </div>
              <div class="plugin-catalog-detail__content">
                <div class="plugin-catalog-detail__main" aria-hidden="true">
                  <div class="plugin-catalog-detail__loading-card skeleton"></div>
                  <div class="plugin-catalog-detail__loading-card skeleton"></div>
                </div>
                <aside class="plugin-catalog-detail__sidebar">
                  ${Yr(void 0,void 0,void 0,!0)}
                </aside>
              </div>
            </section>`:k`<p class="plugin-catalog-detail__empty">${C(`pluginsPage.discoveryOffline`)}</p>`,{wide:!0,carapace:!0})}function ii(){return(ii=e((()=>{br(),A(),Je(),w(),it(),xt(),nn(),tt(),f(),b(),on(),Cr(),ei(),Xn()})))()}var ai;function oi(){return(oi=e((()=>{Re(),A(),we(),ne(),tt(),f(),d(),l(),Qt(),ai=class extends t{constructor(){super(),this.reloading=!1,this.reloadError=``,new s(this).watchStore(()=>this.context?.plugins)}render(){let e=this.context?.plugins;if(!e)return O;let t=e.registrations(`replacements`);if(!t.length&&!e.errors.length&&!(e.hasPlugins&&e.canReload))return O;let n=[...new Set(t.map(e=>e.value.surface))];return ct({title:C(`pluginUi.customize`),carapace:!0},k`
        ${_t({title:C(`pluginUi.selectionScope`),carapace:!0,stackedOnNarrow:!0,control:k`
            ${e.canReload?k`<button
                    class="btn btn--sm oc-action oc-action-secondary"
                    type="button"
                    ?disabled=${this.reloading}
                    @click=${async()=>{this.reloading=!0,this.reloadError=``;try{await e.reload()}catch(e){this.reloadError=e instanceof Error?e.message:String(e)}finally{this.reloading=!1}}}
                  >
                    ${C(`pluginUi.reload`)}
                  </button>`:O}
            <button
              class="btn btn--sm oc-action oc-action-secondary"
              type="button"
              @click=${()=>void e.refresh()}
            >
              ${C(`common.retry`)}
            </button>
          `})}
        ${n.map(n=>_t({title:C(`pluginUi.surface.${n}`),carapace:!0,stackedOnNarrow:!0,control:k`<select
              class="settings-select oc-select"
              aria-label=${C(`pluginUi.surface.${n}`)}
              @change=${t=>e.selectReplacement(n,t.currentTarget.value||null)}
            >
              <option value="" .selected=${!e.selectedReplacement(n)}>
                ${C(`pluginUi.builtin`)}
              </option>
              ${t.filter(e=>e.value.surface===n).map(t=>k`<option
                    value=${t.key}
                    .selected=${e.selectedReplacement(n)?.key===t.key}
                  >
                    ${t.value.label} (${t.pluginId})
                  </option>`)}
            </select>`}))}
        ${e.errors.map(e=>{let t=Zt(this.context,e.pluginId);return _t({title:e.pluginId,carapace:!0,stacked:!0,role:t?`status`:`alert`,control:t??k`<span>${e.message}</span>`})})}
        ${this.reloadError?_t({title:this.reloadError,role:`alert`,carapace:!0}):O}
      `)}},P([Le({context:he,subscribe:!0})],ai.prototype,`context`,void 0),P([N()],ai.prototype,`reloading`,void 0),P([N()],ai.prototype,`reloadError`,void 0),customElements.get(`zero-plugin-manager`)||customElements.define(`zero-plugin-manager`,ai)})))()}function si(e){return{hints:e.configHints,unsupported:new Set(e.configUnsupportedPaths),disabled:!e.connected||!e.canEditConfig||e.configBusy,compact:!0,commitOnBlur:!0,showLabel:!1,maskSensitive:!0,rawAvailable:!1,onPatch:e.onConfigPatch,onRemove:e.onConfigRemove}}function ci(e,t,n=[]){let{label:r,help:i}=ln(e.path,e.schema,e.hints),a=[...n,r],o=pn(e);return _(e.schema)===`object`&&e.schema.properties&&Object.keys(e.schema.properties).length>0&&e.schema.additionalProperties===!1&&!e.schema.anyOf&&!e.schema.oneOf&&!e.schema.enum&&!Sn(e.value)&&!e.unsupported.has(g(e.path))&&o===void 0?fn(e).fields.flatMap(e=>ci(e,t,a)):[{...e,property:t,label:a.join(`: `),help:i}]}function li(e,t,n){return k`<section
    class="plugin-editor__section"
    id=${n??O}
    tabindex=${n===void 0?O:`-1`}
  >
    ${e?k`<h2>${e}</h2>`:O}
    <div class="plugin-editor__group">${t}</div>
  </section>`}var ui;function di(){return(di=e((()=>{A(),we(),ke(),mn(),_n(),dn(),xn(),cn(),yn(),vn(),w(),tt(),f(),at(),It(),d(),Cr(),An(),Lt(),ui=class extends v{constructor(...e){super(...e),this.query=``}willUpdate(e){e.has(`model`)&&e.get(`model`)?.pluginId!==this.model?.pluginId&&(this.query=``)}renderField(e){let{label:t,help:n,path:r,disabled:i}=e,a=this.onAskSetting,o=e.value===void 0?e.effectiveValue??e.schema.default:e.value,s=!y(r,e.hints)?.placeholder&&_(e.schema)===`boolean`&&!e.schema.enum&&!e.schema.anyOf&&!e.schema.oneOf,c=Cn(r,`plugin-help`),l={...e,value:e.value===void 0?e.effectiveValue:e.value,descriptionId:n?c:void 0},u=this.renderCredential?.(l)??un({...l,showLabel:!1,hints:{...e.hints,[g(r)]:{...y(r,e.hints),label:t}}});return k`<div
      class="plugin-editor__row"
      data-setting=${r.slice(r[3]===`config`?4:3).join(`.`)}
      @click=${t=>{if(!s||i||getSelection()?.toString())return;let n=t.target;n instanceof Element&&!n.closest(`button,a,input,select,textarea,label,wa-switch,wa-checkbox,wa-dropdown,summary,[contenteditable]`)&&e.onPatch(r,!o)}}
    >
      <div class="plugin-editor__menu">
        <wa-dropdown
          placement="bottom-start"
          @wa-select=${t=>{t.detail.item.value===`reset`&&!i&&e.onPatch(r,e.isRequired?structuredClone(e.schema.default):void 0),t.detail.item.value===`ask`&&a?.({...e,value:o})}}
        >
          <button
            slot="trigger"
            type="button"
            class="btn btn--icon btn--ghost"
            aria-label=${C(`pluginsPage.editor.actions`,{name:t})}
          >
            ${T.moreHorizontal}
          </button>
          <wa-dropdown-item
            value="reset"
            ?disabled=${i||e.value===void 0||e.isRequired&&e.schema.default===void 0}
            >${C(`pluginsPage.editor.reset`)}</wa-dropdown-item
          >
          ${a?k`<wa-dropdown-item value="ask">${C(`pluginsPage.editor.ask`)}</wa-dropdown-item>`:O}
        </wa-dropdown>
      </div>
      <div class="plugin-editor__copy">
        <span class="plugin-editor__title">${t}</span
        >${n?k`<p id=${c}>${n}</p>`:O}
      </div>
      <div class="plugin-editor__control">${u}</div>
    </div>`}renderFields(e){return k`${Oe(e,e=>JSON.stringify(e.path),e=>this.renderField(e))}`}renderPermissions(){if(!this.permissions)return O;let e=this.query.trim().toLocaleLowerCase(),t=this.permissions.fields.filter(t=>!e||`${C(`pluginsPage.editor.permissions`)} ${t.label} ${t.help??``}`.toLocaleLowerCase().includes(e)||sn({...t,criteria:{text:e,tags:[]}}));return this.permissions.loading&&!e?ot({rows:3,carapace:!0}):t.length?this.renderFields(t):O}renderGroups(e,t){let n=t!==O,r=_(e.schema)!==`object`||e.schema.anyOf||e.schema.oneOf||e.schema.enum||e.unsupported.has(g(e.path))?{fields:[e],additional:void 0}:fn(e),i=(y(e.path,e.hints)?.groups??[]).toSorted((e,t)=>(e.order??0)-(t.order??0)),a=this.query.trim().toLocaleLowerCase(),o=r.fields.flatMap(e=>ci(e,String(e.path.at(-1)))).filter(e=>!a||sn({...e,criteria:{text:a,tags:[]}})||[e.path.slice(4).join(`.`),e.label,e.help,i.find(t=>t.properties.includes(e.property))?.title].join(` `).toLocaleLowerCase().includes(a)),s=i.map(e=>({id:e.id,title:e.title,fields:e.properties.flatMap(e=>o.filter(t=>t.property===e))}));s.push({id:`__ungrouped`,title:i.length?C(`pluginsPage.editor.other`):``,fields:o.filter(e=>!i.some(t=>t.properties.includes(e.property)))});let c=r.additional?hn({...r.additional,searchCriteria:a?{text:a,tags:[]}:void 0},un):O,l=t=>Cn([...e.path,t],`section`),u=s.filter(e=>e.fields.length&&e.title);return n&&u.push({id:`__permissions`,title:C(`pluginsPage.editor.permissions`),fields:[]}),k`<div class="plugin-editor__layout">
      ${i.length?k`<nav class="plugin-editor__nav" aria-label=${C(`pluginsPage.editor.navigation`)}>
              ${u.map(e=>k`<a
                    href=${`#${l(e.id)}`}
                    @click=${t=>{t.preventDefault();let n=this.querySelector(`#${CSS.escape(l(e.id))}`);n?.scrollIntoView({block:`start`,behavior:Nt()}),n?.focus({preventScroll:!0})}}
                    >${e.title}</a
                  >`)}
            </nav>`:O}
      <div class="plugin-editor__sections">
        ${s.map(e=>e.fields.length?li(e.title,this.renderFields(e.fields),l(e.id)):O)}
        ${c===O?O:li(``,c)}
        ${n?li(C(`pluginsPage.editor.permissions`),k`${t}`,l(`__permissions`)):O}
        ${!o.length&&c===O&&!n?k`<p class="plugin-editor__empty">${C(a?`pluginsPage.editor.noMatches`:`pluginsPage.editor.empty`)}</p>`:O}
      </div>
    </div>`}render(){let e=this.model;if(!e)return O;let t=e.result?.plugins.find(t=>t.id===e.pluginId),n=this.renderPermissions(),r=e.configSchema?{schema:e.configSchema,value:Dn(e.configValue,e.pluginId).config,path:[`plugins`,`entries`,e.pluginId,`config`],...si(e)}:null,i=r?pn(r):void 0,a=r&&i!==void 0?k`<zero-config-form-structured-draft
            .props=${{identity:JSON.stringify(r.path),sourceIdentity:r.value,initialValue:i,params:r,renderNode:e=>this.renderGroups(e,n)}}
          ></zero-config-form-structured-draft>`:r?this.renderGroups(r,n):O;return k`<section class="plugin-editor">
      <header class="plugin-editor__header">
        ${xr({name:C(`pluginsPage.detailSettings`),backHref:e.backHref,backLabel:t?.name??e.pluginId,onBack:e.onBack})}
      </header>
      <label class="plugin-editor__search"
        >${T.search}<input
          type="search"
          class="settings-input"
          aria-label=${C(`pluginsPage.editor.search`)}
          placeholder=${C(`pluginsPage.editor.search`)}
          .value=${this.query}
          @input=${e=>{this.query=e.currentTarget.value}}
      /></label>
      ${e.configError?k`<div class="callout danger" role="alert">${e.configError}<button class="btn btn--sm" @click=${e.configValue&&e.configSchema?e.onConfigWriteRetry:e.onConfigReadRetry}>${C(`common.retry`)}</button></div>`:O}
      ${e.configSchemaLoading||!e.configValue?ot({rows:2,carapace:!0}):a}
      ${n!==O&&!r?li(C(`pluginsPage.editor.permissions`),k`${n}`):O}
    </section>`}},P([M({attribute:!1})],ui.prototype,`model`,void 0),P([M({attribute:!1})],ui.prototype,`permissions`,void 0),P([M({attribute:!1})],ui.prototype,`onAskSetting`,void 0),P([M({attribute:!1})],ui.prototype,`renderCredential`,void 0),P([N()],ui.prototype,`query`,void 0),customElements.define(`zero-plugin-settings-editor`,ui)})))()}function fi(e,t){let n=I(t.id),r=e.busy[n],i=!!r,a=r===`enable`||r===`disable`?r:t.enabled?`disable`:`enable`,s=(e,n,a,o,s,c)=>tn(o,k`<button
        type="button"
        class=${`btn oc-action ${a}`}
        ?disabled=${!o&&(!s||i)}
        aria-disabled=${!s||i?`true`:O}
        aria-label=${`${n} ${t.name}`}
        aria-busy=${r===e?`true`:O}
        @click=${()=>{s&&!i&&c()}}
      >
        ${r===e?k`<span class="btn__spinner" aria-hidden="true"></span>`:O}${n}
      </button>`),c=Qr(e.onAskPlugin,t.enabled);return k`
    ${t.enabled?c:O}
    ${s(a,C(a===`disable`?`pluginsPage.detailDisable`:`pluginsPage.detailEnable`),t.enabled?`oc-action-secondary`:`primary oc-action-primary`,e.mutationBlockedReason??(t.state===`needs-setup`?C(`pluginsPage.setupRequiredNotice`):null),e.canMutate&&t.state!==`needs-setup`,()=>e.onSetEnabled(t.id,!t.enabled,n))}
    ${t.enabled?O:c}
    ${t.removable?s(`uninstall`,C(`pluginsPage.uninstall`),`oc-action-secondary`,e.mutationBlockedReason,e.canMutate,()=>e.onUninstall(t.id,n)):O}
    <a
      class="btn btn--icon oc-action oc-action-icon oc-action-secondary"
      href=${e.settingsHref}
      aria-label=${C(`pluginsPage.detailSettings`)}
      @click=${t=>{o(t)&&(t.preventDefault(),e.onSettings())}}
      >${T.settings}</a
    >
  `}function pi(){return(pi=e((()=>{A(),w(),nn(),f(),ei(),Xn()})))()}function mi(e,t){return k`<div
    class="callout danger plugins-settings-error oc-banner oc-banner-error"
    role="alert"
  >
    <span>${e}</span>
    <button type="button" class="btn btn--sm oc-action oc-action-secondary" @click=${t}>
      ${C(`pluginsPage.tryAgain`)}
    </button>
  </div>`}function hi(e,t){return e?k`<span class="plugin-connection-status" role="status"> ${T.check} ${C(t)} </span>`:O}function gi(e){if(!e.connected)return $e(C(`pluginsPage.connectToManage`),{carapace:!0});if(e.loading)return ot({rows:4,carapace:!0});if(e.error&&!e.result)return mi(e.error,e.onRefresh);let t=e.error?mi(e.error,e.onRefresh):O,n=e.query.trim().toLocaleLowerCase(),r=(e.result?.plugins??[]).filter(e=>e.installed&&(!n||[e.name,e.id,e.description,e.packageName].some(e=>e?.toLocaleLowerCase().includes(n)))).toSorted((e,t)=>e.name.localeCompare(t.name));return r.length===0?k`${t}${$e(e.query?C(`pluginsPage.noSettingsMatches`):C(`pluginsPage.noInstalled`),{carapace:!0})}`:k`${t}${Oe(r,e=>e.id,t=>k`
      <article
        class="settings-row settings-row--nav plugins-settings-row oc-settings-row"
        data-plugin-id=${t.id}
        @click=${n=>{let r=n.target;(!(r instanceof Element)||!r.closest(`button, a`))&&e.onOpenPlugin(t.id)}}
      >
        ${rn(t.id,t.name,{iconUrl:e.iconUrls[t.id],onIconError:()=>e.onIconError(t.id),loading:e.iconLoading?.(t.id)})}
        <a
          class="settings-row__text plugins-settings-row__link oc-settings-row-content"
          href=${e.pluginHref(t.id)}
          @click=${n=>{o(n)&&(n.preventDefault(),e.onOpenPlugin(t.id))}}
        >
          <span class="settings-row__title oc-settings-row-title">${t.name}</span>
          <span class="settings-row__desc oc-settings-row-description"
            >${t.description||C(`pluginsPage.optionalCapability`)}</span
          >
        </a>
        <div class="settings-row__control oc-settings-row-control">
          ${t.state===`not-installed`?O:Vt(t.state,`plugins-settings-row__status`)}
          <span class="settings-row__chevron" aria-hidden="true">${T.chevronRight}</span>
        </div>
        ${Yn(e.messages[I(t.id)])}
      </article>
    `)}`}function _i(e){return e.connected?!e.advancedSchema||!e.configValue?e.configError?mi(e.configError,e.onConfigReadRetry):e.configSchemaLoading||!e.configValue?ot({rows:4,carapace:!0}):$e(C(`pluginsPage.schemaUnavailable`),{carapace:!0}):k`
    ${un({rawAvailable:!1,maskSensitive:!0,schema:e.advancedSchema,value:e.configValue.plugins??{},path:[`plugins`],hints:e.configHints,unsupported:new Set(e.configUnsupportedPaths),disabled:!e.canEditConfig||e.configBusy,showLabel:!1,onPatch:e.onConfigPatch,onRemove:e.onConfigRemove})}
    ${e.configError?mi(e.configError,e.onConfigWriteRetry):O}
  `:$e(C(`pluginsPage.connectToManage`),{carapace:!0})}function vi(e){let t=e.tab===`installed`?k`
          <label class="plugins-settings-search">
            <span class="settings-control__sr-label">${C(`pluginsPage.searchInstalled`)}</span>
            <span aria-hidden="true">${T.search}</span>
            <input
              class="settings-input oc-input"
              type="search"
              aria-label=${C(`pluginsPage.searchInstalled`)}
              placeholder=${C(`pluginsPage.searchInstalled`)}
              .value=${e.query}
              @input=${t=>{e.onQueryChange(t.currentTarget.value)}}
            />
          </label>
          <div class="settings-group oc-settings-group">${gi(e)}</div>
        `:k`<div id="plugin-settings-advanced" class="settings-stack">
          <zero-plugin-manager></zero-plugin-manager>
          ${ct({title:C(`pluginsPage.advanced`),description:C(`pluginsPage.advancedDescription`),actions:k`<button
                type="button"
                class="btn btn--xs btn--icon oc-action oc-action-icon oc-action-secondary"
                aria-label=${C(`common.reload`)}
                ?disabled=${e.configBusy||e.configSchemaLoading}
                @click=${e.onConfigReload}
              >
                ${T.refresh}
              </button>`,carapace:!0},_i(e))}
        </div>`;return F(k`
      ${rt({title:C(`tabs.plugins`),subtitle:C(`pluginsPage.settingsDescription`)})}
      <div class="plugins-settings-content">
        ${pt({id:`plugin-settings`,active:e.tab,tabs:[{value:`installed`,label:C(`pluginsPage.settingsInstalled`)},{value:`advanced`,label:C(`pluginsPage.advanced`)}],ariaLabel:C(`pluginsPage.settingsTabs`),panelId:`plugin-settings-panel`,variant:`sub`,className:`plugins-settings-tabs`,carapace:!0,onSelect:e.onTabChange})}
        <wa-tab-panel
          id="plugin-settings-panel"
          name=${e.tab}
          active
          aria-labelledby=${`plugin-settings-tab-${e.tab}`}
        >
          ${t}
        </wa-tab-panel>
      </div>
    `,{carapace:!0})}function yi(e){if(!e.inspection)return{fields:[],loading:!0};let t=e.hostControlsSchema&&e.configValue?fn({schema:e.hostControlsSchema,value:Dn(e.configValue,e.pluginId),path:[`plugins`,`entries`,e.pluginId],...si(e)}).fields.flatMap(e=>ci(e,String(e.path.at(-1)))):[];for(let n of t){let t=n.path[4];if(n.path[3]!==`hooks`||n.path.length!==5||t!==`allowPromptInjection`&&t!==`allowConversationAccess`)continue;let r=t===`allowPromptInjection`?`promptContextAccess`:`conversationAccess`;n.label=C(`pluginsPage.${r}`),n.help=C(`pluginsPage.${r}Description`),n.effectiveValue=e.inspection.grants.hooks[t].effective}return{fields:t}}function bi(e){let t=e.result?.plugins.find(t=>t.id===e.pluginId);if(!e.connected)return F($e(C(`pluginsPage.connectToManage`),{carapace:!0}),{carapace:!0});if(e.error&&!e.result)return F(mi(e.error,e.onRefresh),{carapace:!0});if(!e.result)return F(ot({rows:5,carapace:!0}),{carapace:!0});if(!t?.installed)return F(k`
        <a
          class="btn btn--sm oc-action oc-action-secondary"
          href=${e.backHref}
          @click=${t=>{t.preventDefault(),e.onBack()}}
        >
          ${T.chevronLeft} ${e.backLabel}
        </a>
        ${$e(C(`pluginsPage.pluginNotFound`),{carapace:!0})}
      `,{carapace:!0});let n=e.catalog??e.inspection?.catalog,r=e.inspection?.components,i=k`${e.error?mi(e.error,e.onRefresh):O}
  ${e.inspectionError?mi(e.inspectionError,e.onRetryInspection):O}
  ${t.error?k`<div class="callout danger oc-banner oc-banner-error" role="alert">${h(t.error)}</div>`:O}
  ${Yn(e.messages[I(t.id)])}`;if(e.tab===`configuration`)return F(k`
        ${i}
        <zero-plugin-settings-editor
          .model=${e}
          .renderCredential=${e.renderCredential}
          .onAskSetting=${e.onAskSetting}
          .permissions=${yi(e)}
        ></zero-plugin-settings-editor>
      `,{wide:!0,carapace:!0});let a=e=>(e??[]).map(e=>({name:e})),o=(r?.skills??[]).map(e=>({name:e,description:n?.detail.skills.find(t=>t.name===e)?.description})),s=e.tools??a(e.inspection?.declared.tools??n?.detail.contracts?.tools);return F(Sr({id:`plugin-installed-detail`,name:t.name,summary:t.description||n?.plugin.catalog.summary,backHref:e.backHref,backLabel:e.backLabel,onBack:e.onBack,icon:rn(t.id,t.name,{iconUrl:e.iconUrls[t.id]??(n?.plugin.catalog.imageUrl?e.catalogIconUrls?.[n.plugin.catalog.imageUrl]:void 0),onIconError:()=>e.onIconError(t.id),authorIconUrl:n?.detail.author?.imageUrl?e.catalogIconUrls?.[n.detail.author.imageUrl]:void 0,loading:!!(e.iconLoading?.(t.id)||e.catalogLoading||n?.plugin.catalog.imageUrl&&e.catalogIconLoading?.(n.plugin.catalog.imageUrl)||n?.detail.author?.imageUrl&&e.catalogIconLoading?.(n.detail.author.imageUrl))}),identity:Jr(n,e.inspection?.overview?.publisherName),titleAction:e.installProgress?k`<zero-plugin-install-action
              .buttonClass=${`btn oc-action plugin-catalog-detail__install`}
              .primary=${!0}
              .progress=${e.installProgress}
            ></zero-plugin-install-action
            >${Qr(e.onAskPlugin,!1)}`:fi({...e,settingsHref:e.settingsHref??`#configuration`,onSettings:()=>e.onTabChange(`configuration`)},t),sidebar:n||t.version||e.inspection?.overview||e.catalogLoading?Yr(n,t.version,e.inspection?.overview,e.catalogLoading):void 0,panel:k`${i}
      ${!e.inspection&&!n&&!e.inspectionError?ot({rows:2,carapace:!0}):O}
      ${R(C(`pluginsPage.auth.accounts`),(e.inspection?.mcpAuth??[]).map(t=>({name:t.serverName,trailing:k`${hi(t.state===`authorized`,`pluginsPage.auth.connected`)}
            <button
              type="button"
              class="btn btn--sm oc-action oc-action-secondary"
              aria-label=${C(t.state===`authorized`?`pluginsPage.auth.editAccount`:`pluginsPage.auth.connectAccount`,{name:t.serverName})}
              ?disabled=${t.state===`authorized`?!e.onEditMcp:!e.canMcpLogin||e.mcpLoginBusy||!e.onMcpLogin}
              @click=${()=>t.state===`authorized`?e.onEditMcp?.():e.onMcpLogin?.(t.serverName)}
            >
              ${C(t.state===`authorized`?`pluginsPage.auth.edit`:`pluginsPage.auth.connect`)}
            </button>`})),T.circleUser)}
      ${R(C(`pluginsPage.auth.credentials`),(e.inspection?.credentials??[]).map(t=>({name:t.envVars.join(` / `)||t.label,trailing:k`${hi(t.status===`configured`,`pluginsPage.auth.configured`)}
            <button
              type="button"
              class="btn btn--sm oc-action oc-action-secondary"
              aria-label=${C(t.status===`configured`?`pluginsPage.auth.editCredential`:`pluginsPage.auth.configureCredential`,{name:t.label})}
              @click=${()=>e.onTabChange(`configuration`)}
            >
              ${C(t.status===`configured`?`pluginsPage.auth.edit`:`pluginsPage.auth.configure`)}
            </button>`})),T.key)}
      ${Zr(e.inspection?.overview?.capabilities?.contracts,e.inspection?.overview?.capabilities?.ui)}
      ${e.skillsSection??R(C(`pluginsPage.detailTabs.skills`),o,T.bookOpenText)}
      ${R(C(`pluginsPage.detailTools`),s.map(({name:t,description:n,parameters:r})=>({name:t,description:n,onOpen:(n?.trim()||r?.length)&&e.onOpenTool?()=>e.onOpenTool?.(t):void 0})),T.wrench)}
      ${Xr(r?.mcpServers??n?.detail.mcpServers??[],n?.detail.mcpServerDetails)}`,readme:e.inspection?.overview?.readme||n?.detail.readme?ti(e.inspection?.overview?.readme??n?.detail.readme):void 0}),{wide:!0,carapace:!0})}function xi(){return(xi=e((()=>{A(),ke(),dn(),vn(),gt(),w(),tt(),f(),b(),oi(),ii(),on(),Cr(),ei(),Jt(),Xn(),di(),pi(),An()})))()}function z(e){if(e&&typeof e==`object`)switch(e[H]){case V:case Ei:return!0}return!1}function B(e){if(e&&typeof e==`object`)switch(e[H]){case Si:case V:case Ti:case Ei:return!0}return!1}var Si,Ci,V,wi,Ti,Ei,H,Di,Oi,ki,U,W,Ai,ji;function G(){return(G=e((()=>{Si=Symbol.for(`yaml.alias`),Ci=Symbol.for(`yaml.document`),V=Symbol.for(`yaml.map`),wi=Symbol.for(`yaml.pair`),Ti=Symbol.for(`yaml.scalar`),Ei=Symbol.for(`yaml.seq`),H=Symbol.for(`yaml.node.type`),Di=e=>!!e&&typeof e==`object`&&e[H]===Si,Oi=e=>!!e&&typeof e==`object`&&e[H]===Ci,ki=e=>!!e&&typeof e==`object`&&e[H]===V,U=e=>!!e&&typeof e==`object`&&e[H]===wi,W=e=>!!e&&typeof e==`object`&&e[H]===Ti,Ai=e=>!!e&&typeof e==`object`&&e[H]===Ei,ji=e=>(W(e)||z(e))&&!!e.anchor})))()}function Mi(e,t){let n=Pi(t);Oi(e)?Ni(null,e.contents,n,Object.freeze([e]))===Ri&&(e.contents=null):Ni(null,e,n,Object.freeze([]))}function Ni(e,t,n,r){let i=Fi(e,t,n,r);if(B(i)||U(i))return Ii(e,r,i),Ni(e,i,n,r);if(typeof i!=`symbol`){if(z(t)){r=Object.freeze(r.concat(t));for(let e=0;e<t.items.length;++e){let i=Ni(e,t.items[e],n,r);if(typeof i==`number`)e=i-1;else if(i===K)return K;else i===Ri&&(t.items.splice(e,1),--e)}}else if(U(t)){r=Object.freeze(r.concat(t));let e=Ni(`key`,t.key,n,r);if(e===K)return K;e===Ri&&(t.key=null);let i=Ni(`value`,t.value,n,r);if(i===K)return K;i===Ri&&(t.value=null)}}return i}function Pi(e){return typeof e==`object`&&(e.Collection||e.Node||e.Value)?Object.assign({Alias:e.Node,Map:e.Node,Scalar:e.Node,Seq:e.Node},e.Value&&{Map:e.Value,Scalar:e.Value,Seq:e.Value},e.Collection&&{Map:e.Collection,Seq:e.Collection},e):e}function Fi(e,t,n,r){if(typeof n==`function`)return n(e,t,r);if(ki(t))return n.Map?.(e,t,r);if(Ai(t))return n.Seq?.(e,t,r);if(U(t))return n.Pair?.(e,t,r);if(W(t))return n.Scalar?.(e,t,r);if(Di(t))return n.Alias?.(e,t,r)}function Ii(e,t,n){let r=t[t.length-1];if(z(r))r.items[e]=n;else if(U(r))e===`key`?r.key=n:r.value=n;else if(Oi(r))r.contents=n;else{let e=Di(r)?`alias`:`scalar`;throw Error(`Cannot replace node with ${e} parent`)}}var K,Li,Ri;function zi(){return(zi=e((()=>{G(),K=Symbol(`break visit`),Li=Symbol(`skip children`),Ri=Symbol(`remove node`),Mi.BREAK=K,Mi.SKIP=Li,Mi.REMOVE=Ri})))()}var Bi,Vi,Hi;function Ui(){return(Ui=e((()=>{G(),zi(),Bi={"!":`%21`,",":`%2C`,"[":`%5B`,"]":`%5D`,"{":`%7B`,"}":`%7D`},Vi=e=>e.replace(/[!,[\]{}]/g,e=>Bi[e]),Hi=class e{constructor(t,n){this.docStart=null,this.docEnd=!1,this.yaml=Object.assign({},e.defaultYaml,t),this.tags=Object.assign({},e.defaultTags,n)}clone(){let t=new e(this.yaml,this.tags);return t.docStart=this.docStart,t}atDocument(){let t=new e(this.yaml,this.tags);switch(this.yaml.version){case`1.1`:this.atNextDocument=!0;break;case`1.2`:this.atNextDocument=!1,this.yaml={explicit:e.defaultYaml.explicit,version:`1.2`},this.tags=Object.assign({},e.defaultTags)}return t}add(t,n){this.atNextDocument&&=(this.yaml={explicit:e.defaultYaml.explicit,version:`1.1`},this.tags=Object.assign({},e.defaultTags),!1);let r=t.trim().split(/[ \t]+/),i=r.shift();switch(i){case`%TAG`:{if(r.length!==2&&(n(0,`%TAG directive should contain exactly two parts`),r.length<2))return!1;let[e,t]=r;return this.tags[e]=t,!0}case`%YAML`:{if(this.yaml.explicit=!0,r.length!==1)return n(0,`%YAML directive should contain exactly one part`),!1;let[e]=r;if(e===`1.1`||e===`1.2`)return this.yaml.version=e,!0;{let t=/^\d+\.\d+$/.test(e);return n(6,`Unsupported YAML version ${e}`,t),!1}}default:return n(0,`Unknown directive ${i}`,!0),!1}}tagName(e,t){if(e===`!`)return`!`;if(e[0]!==`!`)return t(`Not a valid tag: ${e}`),null;if(e[1]===`<`){let n=e.slice(2,-1);return n===`!`||n===`!!`?(t(`Verbatim tags aren't resolved, so ${e} is invalid.`),null):(e[e.length-1]!==`>`&&t(`Verbatim tags must end with a >`),n)}let[,n,r]=e.match(/^(.*!)([^!]*)$/s);r||t(`The ${e} tag has no suffix`);let i=this.tags[n];if(i)try{return i+decodeURIComponent(r)}catch(e){return t(String(e)),null}return n===`!`?e:(t(`Could not resolve tag: ${e}`),null)}tagString(e){for(let[t,n]of Object.entries(this.tags))if(e.startsWith(n))return t+Vi(e.substring(n.length));return e[0]===`!`?e:`!<${e}>`}toString(e){let t=this.yaml.explicit?[`%YAML ${this.yaml.version||`1.2`}`]:[],n=Object.entries(this.tags),r;if(e&&n.length>0&&B(e.contents)){let t={};Mi(e.contents,(e,n)=>{B(n)&&n.tag&&(t[n.tag]=!0)}),r=Object.keys(t)}else r=[];for(let[i,a]of n)(i!==`!!`||a!==`tag:yaml.org,2002:`)&&(!e||r.some(e=>e.startsWith(a)))&&t.push(`%TAG ${i} ${a}`);return t.join(`
`)}},Hi.defaultYaml={explicit:!1,version:`1.2`},Hi.defaultTags={"!!":`tag:yaml.org,2002:`}})))()}function Wi(e){if(/[\x00-\x19\s,[\]{}]/.test(e)){let t=`Anchor must not contain whitespace or control characters: ${JSON.stringify(e)}`;throw Error(t)}return!0}function Gi(){return(Gi=e((()=>{zi()})))()}function Ki(e,t,n,r){if(r&&typeof r==`object`){if(Array.isArray(r))for(let t=0,n=r.length;t<n;++t){let n=r[t],i=Ki(e,r,String(t),n);i===void 0?delete r[t]:i!==n&&(r[t]=i)}else if(r instanceof Map)for(let t of Array.from(r.keys())){let n=r.get(t),i=Ki(e,r,t,n);i===void 0?r.delete(t):i!==n&&r.set(t,i)}else if(r instanceof Set)for(let t of Array.from(r)){let n=Ki(e,r,t,t);n===void 0?r.delete(t):n!==t&&(r.delete(t),r.add(n))}else for(let[t,n]of Object.entries(r)){let i=Ki(e,r,t,n);i===void 0?delete r[t]:i!==n&&(r[t]=i)}}return e.call(t,n,r)}function q(e,t,n){if(Array.isArray(e))return e.map((e,t)=>q(e,String(t),n));if(e&&typeof e.toJSON==`function`){if(!n||!ji(e))return e.toJSON(t,n);let r={aliasCount:0,count:1,res:void 0};n.anchors.set(e,r),n.onCreate=e=>{r.res=e,delete n.onCreate};let i=e.toJSON(t,n);return n.onCreate&&n.onCreate(i),i}return typeof e==`bigint`&&!n?.keep?Number(e):e}function qi(){return(qi=e((()=>{G()})))()}var Ji;function Yi(){return(Yi=e((()=>{G(),qi(),Ji=class{constructor(e){Object.defineProperty(this,H,{value:e})}clone(){let e=Object.create(Object.getPrototypeOf(this),Object.getOwnPropertyDescriptors(this));return this.range&&(e.range=this.range.slice()),e}toJS(e,{mapAsMap:t,maxAliasCount:n,onAnchor:r,reviver:i}={}){if(!Oi(e))throw TypeError(`A document argument is required`);let a={anchors:new Map,doc:e,keep:!0,mapAsMap:t===!0,mapKeyWarned:!1,maxAliasCount:typeof n==`number`?n:100},o=q(this,``,a);if(typeof r==`function`)for(let{count:e,res:t}of a.anchors.values())r(t,e);return typeof i==`function`?Ki(i,{"":o},``,o):o}}})))()}function Xi(e,t,n){if(Di(t)){let r=t.resolve(e),i=n&&r&&n.get(r);return i?i.count*i.aliasCount:0}if(z(t)){let r=0;for(let i of t.items){let t=Xi(e,i,n);t>r&&(r=t)}return r}if(U(t)){let r=Xi(e,t.key,n),i=Xi(e,t.value,n);return Math.max(r,i)}return 1}var Zi;function Qi(){return(Qi=e((()=>{Gi(),zi(),G(),Yi(),qi(),Zi=class extends Ji{constructor(e){super(Si),this.source=e,Object.defineProperty(this,"tag",{set(){throw Error(`Alias nodes cannot have tags`)}})}resolve(e,t){if(t?.maxAliasCount===0)throw ReferenceError(`Alias resolution is disabled`);let n;t?.aliasResolveCache?n=t.aliasResolveCache:(n=[],Mi(e,{Node:(e,t)=>{(Di(t)||ji(t))&&n.push(t)}}),t&&(t.aliasResolveCache=n));let r;for(let e of n){if(e===this)break;e.anchor===this.source&&(r=e)}if(r&&t){let{anchors:e,doc:n,maxAliasCount:i}=t,a=e.get(r);if(a||=(q(r,null,t),e.get(r)),a?.res===void 0)throw ReferenceError(`This should not happen: Alias anchor was not resolved?`);if(i>=0&&(a.count+=1,a.aliasCount===0&&(a.aliasCount=Xi(n,r,e)),a.count*a.aliasCount>i))throw ReferenceError(`Excessive alias count indicates a resource exhaustion attack`)}return r}toJSON(e,t){if(!t)return{source:this.source};let n=this.resolve(t.doc,t);if(!n){let e=`Unresolved alias (the anchor must be set before the alias): ${this.source}`;throw ReferenceError(e)}return t.anchors.get(n).res}toString(e,t,n){let r=`*${this.source}`;if(e){if(Wi(this.source),e.options.verifyAliasOrder&&!e.anchors.has(this.source)){let e=`Unresolved alias (the anchor must be set before the alias): ${this.source}`;throw Error(e)}if(e.implicitKey)return`${r} `}return r}}})))()}var $i,J;function Y(){return(Y=e((()=>{G(),Yi(),qi(),$i=e=>!e||typeof e!=`function`&&typeof e!=`object`,J=class extends Ji{constructor(e){super(Ti),this.value=e}toJSON(e,t){return t?.keep?this.value:q(this.value,e,t)}toString(){return String(this.value)}},J.BLOCK_FOLDED=`BLOCK_FOLDED`,J.BLOCK_LITERAL=`BLOCK_LITERAL`,J.PLAIN=`PLAIN`,J.QUOTE_DOUBLE=`QUOTE_DOUBLE`,J.QUOTE_SINGLE=`QUOTE_SINGLE`})))()}function ea(e,t,n){if(t){let e=n.filter(e=>e.tag===t),r=e.find(e=>!e.format)??e[0];if(!r)throw Error(`Tag ${t} not found`);return r}return n.find(t=>t.identify?.(e)&&!t.format)}function ta(e,t,n){if(Oi(e)&&(e=e.contents),B(e))return e;if(U(e)){let t=n.schema[V].createNode?.(n.schema,null,n);return t.items.push(e),t}(e instanceof String||e instanceof Number||e instanceof Boolean||typeof BigInt<`u`&&e instanceof BigInt)&&(e=e.valueOf());let{aliasDuplicateObjects:r,onAnchor:i,onTagObj:a,schema:o,sourceObjects:s}=n,c;if(r&&e&&typeof e==`object`){if(c=s.get(e),c)return c.anchor??(c.anchor=i(e)),new Zi(c.anchor);c={anchor:null,node:null},s.set(e,c)}t?.startsWith(`!!`)&&(t=na+t.slice(2));let l=ea(e,t,o.tags);if(!l){if(e&&typeof e.toJSON==`function`&&(e=e.toJSON()),!e||typeof e!=`object`){let t=new J(e);return c&&(c.node=t),t}l=e instanceof Map?o[V]:Symbol.iterator in Object(e)?o[Ei]:o[V]}a&&(a(l),delete n.onTagObj);let u=l?.createNode?l.createNode(n.schema,e,n):typeof l?.nodeClass?.from==`function`?l.nodeClass.from(n.schema,e,n):new J(e);return t?u.tag=t:l.default||(u.tag=l.tag),c&&(c.node=u),u}var na;function ra(){return(ra=e((()=>{Qi(),G(),Y(),na=`tag:yaml.org,2002:`})))()}function ia(e,t,n){let r=n;for(let e=t.length-1;e>=0;--e){let n=t[e];if(typeof n==`number`&&Number.isInteger(n)&&n>=0){let e=[];e[n]=r,r=e}else r=new Map([[n,r]])}return ta(r,void 0,{aliasDuplicateObjects:!1,keepUndefined:!1,onAnchor:()=>{throw Error(`This should not happen, please report a bug.`)},schema:e,sourceObjects:new Map})}var aa,oa;function sa(){return(sa=e((()=>{ra(),G(),Yi(),aa=e=>e==null||typeof e==`object`&&!!e[Symbol.iterator]().next().done,oa=class extends Ji{constructor(e,t){super(e),Object.defineProperty(this,"schema",{value:t,configurable:!0,enumerable:!1,writable:!0})}clone(e){let t=Object.create(Object.getPrototypeOf(this),Object.getOwnPropertyDescriptors(this));return e&&(t.schema=e),t.items=t.items.map(t=>B(t)||U(t)?t.clone(e):t),this.range&&(t.range=this.range.slice()),t}addIn(e,t){if(aa(e))this.add(t);else{let[n,...r]=e,i=this.get(n,!0);if(z(i))i.addIn(r,t);else if(i===void 0&&this.schema)this.set(n,ia(this.schema,r,t));else throw Error(`Expected YAML collection at ${n}. Remaining path: ${r}`)}}deleteIn(e){let[t,...n]=e;if(n.length===0)return this.delete(t);let r=this.get(t,!0);if(z(r))return r.deleteIn(n);throw Error(`Expected YAML collection at ${t}. Remaining path: ${n}`)}getIn(e,t){let[n,...r]=e,i=this.get(n,!0);return r.length===0?!t&&W(i)?i.value:i:z(i)?i.getIn(r,t):void 0}hasAllNullValues(e){return this.items.every(t=>{if(!U(t))return!1;let n=t.value;return n==null||e&&W(n)&&n.value==null&&!n.commentBefore&&!n.comment&&!n.tag})}hasIn(e){let[t,...n]=e;if(n.length===0)return this.has(t);let r=this.get(t,!0);return z(r)?r.hasIn(n):!1}setIn(e,t){let[n,...r]=e;if(r.length===0)this.set(n,t);else{let e=this.get(n,!0);if(z(e))e.setIn(r,t);else if(e===void 0&&this.schema)this.set(n,ia(this.schema,r,t));else throw Error(`Expected YAML collection at ${n}. Remaining path: ${r}`)}}}})))()}function ca(e,t){return/^\n+$/.test(e)?e.substring(1):t?e.replace(/^(?! *$)/gm,t):e}var la,ua;function da(){return(da=e((()=>{la=e=>e.replace(/^(?!$)(?: $)?/gm,`#`),ua=(e,t,n)=>e.endsWith(`
`)?ca(n,t):n.includes(`
`)?`
`+ca(n,t):(e.endsWith(` `)?``:` `)+n})))()}function fa(e,t,n=`flow`,{indentAtStart:r,lineWidth:i=80,minContentWidth:a=20,onFold:o,onOverflow:s}={}){if(!i||i<0)return e;i<a&&(a=0);let c=Math.max(1+a,1+i-t.length);if(e.length<=c)return e;let l=[],u={},d=i-t.length;typeof r==`number`&&(r>i-Math.max(2,a)?l.push(0):d=i-r);let f,p,m=!1,h=-1,g=-1,_=-1;n===`block`&&(h=pa(e,h,t.length),h!==-1&&(d=h+c));for(let r;r=e[h+=1];){if(n===`quoted`&&r===`\\`){switch(g=h,e[h+1]){case`x`:h+=3;break;case`u`:h+=5;break;case`U`:h+=9;break;default:h+=1}_=h}if(r===`
`)n===`block`&&(h=pa(e,h,t.length)),d=h+t.length+c,f=void 0;else{if(r===` `&&p&&p!==` `&&p!==`
`&&p!==`	`){let t=e[h+1];t&&t!==` `&&t!==`
`&&t!==`	`&&(f=h)}if(h>=d){if(f)l.push(f),d=f+c,f=void 0;else if(n===`quoted`){for(;p===` `||p===`	`;)p=r,r=e[h+=1],m=!0;let t=h>_+1?h-2:g-1;if(u[t])return e;l.push(t),u[t]=!0,d=t+c,f=void 0}else m=!0}}p=r}if(m&&s&&s(),l.length===0)return e;o&&o();let v=e.slice(0,l[0]);for(let r=0;r<l.length;++r){let i=l[r],a=l[r+1]||e.length;i===0?v=`\n${t}${e.slice(0,a)}`:(n===`quoted`&&u[i]&&(v+=`${e[i]}\\`),v+=`\n${t}${e.slice(i+1,a)}`)}return v}function pa(e,t,n){let r=t,i=t+1,a=e[i];for(;a===` `||a===`	`;)if(t<i+n)a=e[++t];else{do a=e[++t];while(a&&a!==`
`);r=t,i=t+1,a=e[i]}return r}var ma,ha,ga;function _a(){return(_a=e((()=>{ma=`flow`,ha=`block`,ga=`quoted`})))()}function va(e,t,n){if(!t||t<0)return!1;let r=t-n,i=e.length;if(i<=r)return!1;for(let t=0,n=0;t<i;++t)if(e[t]===`
`){if(t-n>r)return!0;if(n=t+1,i-n<=r)return!1}return!0}function ya(e,t){let n=JSON.stringify(e);if(t.options.doubleQuotedAsJSON)return n;let{implicitKey:r}=t,i=t.options.doubleQuotedMinMultiLineLength,a=t.indent||(Ea(e)?`  `:``),o=``,s=0;for(let e=0,t=n[e];t;t=n[++e])if(t===` `&&n[e+1]===`\\`&&n[e+2]===`n`&&(o+=n.slice(s,e)+`\\ `,e+=1,s=e,t=`\\`),t===`\\`)switch(n[e+1]){case`u`:{o+=n.slice(s,e);let t=n.substr(e+2,4);switch(t){case`0000`:o+=`\\0`;break;case`0007`:o+=`\\a`;break;case`000b`:o+=`\\v`;break;case`001b`:o+=`\\e`;break;case`0085`:o+=`\\N`;break;case`00a0`:o+=`\\_`;break;case`2028`:o+=`\\L`;break;case`2029`:o+=`\\P`;break;default:t.substr(0,2)===`00`?o+=`\\x`+t.substr(2):o+=n.substr(e,6)}e+=5,s=e+1}break;case`n`:if(r||n[e+2]===`"`||n.length<i)e+=1;else{for(o+=n.slice(s,e)+`

`;n[e+2]===`\\`&&n[e+3]===`n`&&n[e+4]!==`"`;)o+=`
`,e+=2;o+=a,n[e+2]===` `&&(o+=`\\`),e+=1,s=e+1}break;default:e+=1}return o=s?o+n.slice(s):n,r?o:fa(o,a,ga,Ta(t,!1))}function ba(e,t){if(t.options.singleQuote===!1||t.implicitKey&&e.includes(`
`)||/[ \t]\n|\n[ \t]/.test(e))return ya(e,t);let n=t.indent||(Ea(e)?`  `:``),r=`'`+e.replace(/'/g,`''`).replace(/\n+/g,`$&\n${n}`)+`'`;return t.implicitKey?r:fa(r,n,ma,Ta(t,!1))}function xa(e,t){let{singleQuote:n}=t.options,r;if(n===!1)r=ya;else{let t=e.includes(`"`),i=e.includes(`'`);r=t&&!i?ba:i&&!t?ya:n?ba:ya}return r(e,t)}function Sa({comment:e,type:t,value:n},r,i,a){let{blockQuote:o,commentString:s,lineWidth:c}=r.options;if(!o||/\n[\t ]+$/.test(n))return xa(n,r);let l=r.indent||(r.forceBlockIndent||Ea(n)?`  `:``),u=o===`literal`?!0:o===`folded`||t===J.BLOCK_FOLDED?!1:t===J.BLOCK_LITERAL||!va(n,c,l.length);if(!n)return u?`|
`:`>
`;let d,f;for(f=n.length;f>0;--f){let e=n[f-1];if(e!==`
`&&e!==`	`&&e!==` `)break}let p=n.substring(f),m=p.indexOf(`
`);m===-1?d=`-`:n===p||m!==p.length-1?(d=`+`,a&&a()):d=``,p&&=(n=n.slice(0,-p.length),p[p.length-1]===`
`&&(p=p.slice(0,-1)),p.replace(Da,`$&${l}`));let h=!1,g,_=-1;for(g=0;g<n.length;++g){let e=n[g];if(e===` `)h=!0;else if(e===`
`)_=g;else break}let v=n.substring(0,_<g?_+1:g);v&&=(n=n.substring(v.length),v.replace(/\n+/g,`$&${l}`));let y=(h?l?`2`:`1`:``)+d;if(e&&(y+=` `+s(e.replace(/ ?[\r\n]+/g,` `)),i&&i()),!u){let e=n.replace(/\n+/g,`
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g,`$1$2`).replace(/\n+/g,`$&${l}`),i=!1,a=Ta(r,!0);o!==`folded`&&t!==J.BLOCK_FOLDED&&(a.onOverflow=()=>{i=!0});let s=fa(`${v}${e}${p}`,l,ha,a);if(!i)return`>${y}\n${l}${s}`}return n=n.replace(/\n+/g,`$&${l}`),`|${y}\n${l}${v}${n}${p}`}function Ca(e,t,n,r){let{type:i,value:a}=e,{actualString:o,implicitKey:s,indent:c,indentStep:l,inFlow:u}=t;if(s&&a.includes(`
`)||u&&/[[\]{},]/.test(a))return xa(a,t);if(/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(a))return s||u||!a.includes(`
`)?xa(a,t):Sa(e,t,n,r);if(!s&&!u&&i!==J.PLAIN&&a.includes(`
`))return Sa(e,t,n,r);if(Ea(a)){if(c===``)return t.forceBlockIndent=!0,Sa(e,t,n,r);if(s&&c===l)return xa(a,t)}let d=a.replace(/\n+/g,`$&\n${c}`);if(o){let e=e=>e.default&&e.tag!==`tag:yaml.org,2002:str`&&e.test?.test(d),{compat:n,tags:r}=t.doc.schema;if(r.some(e)||n?.some(e))return xa(a,t)}return s?d:fa(d,c,ma,Ta(t,!1))}function wa(e,t,n,r){let{implicitKey:i,inFlow:a}=t,o=typeof e.value==`string`?e:Object.assign({},e,{value:String(e.value)}),{type:s}=e;s!==J.QUOTE_DOUBLE&&/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(o.value)&&(s=J.QUOTE_DOUBLE);let c=e=>{switch(e){case J.BLOCK_FOLDED:case J.BLOCK_LITERAL:return i||a?xa(o.value,t):Sa(o,t,n,r);case J.QUOTE_DOUBLE:return ya(o.value,t);case J.QUOTE_SINGLE:return ba(o.value,t);case J.PLAIN:return Ca(o,t,n,r);default:return null}},l=c(s);if(l===null){let{defaultKeyType:e,defaultStringType:n}=t.options,r=i&&e||n;if(l=c(r),l===null)throw Error(`Unsupported default string type ${r}`)}return l}var Ta,Ea,Da;function Oa(){return(Oa=e((()=>{Y(),_a(),Ta=(e,t)=>({indentAtStart:t?e.indent.length:e.indentAtStart,lineWidth:e.options.lineWidth,minContentWidth:e.options.minContentWidth}),Ea=e=>/^(%|---|\.\.\.)/m.test(e);try{Da=RegExp(`(^|(?<!
))
+(?!
|$)`,`g`)}catch{Da=/\n+(?!\n|$)/g}})))()}function ka(e,t){let n=Object.assign({blockQuote:!0,commentString:la,defaultKeyType:null,defaultStringType:`PLAIN`,directives:null,doubleQuotedAsJSON:!1,doubleQuotedMinMultiLineLength:40,falseStr:`false`,flowCollectionPadding:!0,indentSeq:!0,lineWidth:80,minContentWidth:20,nullStr:`null`,simpleKeys:!1,singleQuote:null,trailingComma:!1,trueStr:`true`,verifyAliasOrder:!0},e.schema.toStringOptions,t),r;switch(n.collectionStyle){case`block`:r=!1;break;case`flow`:r=!0;break;default:r=null}return{anchors:new Set,doc:e,flowCollectionPadding:n.flowCollectionPadding?` `:``,indent:``,indentStep:typeof n.indent==`number`?` `.repeat(n.indent):`  `,inFlow:r,options:n}}function Aa(e,t){if(t.tag){let n=e.filter(e=>e.tag===t.tag);if(n.length>0)return n.find(e=>e.format===t.format)??n[0]}let n,r;if(W(t)){r=t.value;let i=e.filter(e=>e.identify?.(r));if(i.length>1){let e=i.filter(e=>e.test);e.length>0&&(i=e)}n=i.find(e=>e.format===t.format)??i.find(e=>!e.format)}else r=t,n=e.find(e=>e.nodeClass&&r instanceof e.nodeClass);if(!n){let e=r?.constructor?.name??(r===null?`null`:typeof r);throw Error(`Tag not resolved for ${e} value`)}return n}function ja(e,t,{anchors:n,doc:r}){if(!r.directives)return``;let i=[],a=(W(e)||z(e))&&e.anchor;a&&Wi(a)&&(n.add(a),i.push(`&${a}`));let o=e.tag??(t.default?null:t.tag);return o&&i.push(r.directives.tagString(o)),i.join(` `)}function Ma(e,t,n,r){if(U(e))return e.toString(t,n,r);if(Di(e)){if(t.doc.directives)return e.toString(t);if(t.resolvedAliases?.has(e))throw TypeError(`Cannot stringify circular structure without alias nodes`);t.resolvedAliases?t.resolvedAliases.add(e):t.resolvedAliases=new Set([e]),e=e.resolve(t.doc)}let i,a=B(e)?e:t.doc.createNode(e,{onTagObj:e=>i=e});i??=Aa(t.doc.schema.tags,a);let o=ja(a,i,t);o.length>0&&(t.indentAtStart=(t.indentAtStart??0)+o.length+1);let s=typeof i.stringify==`function`?i.stringify(a,t,n,r):W(a)?wa(a,t,n,r):a.toString(t,n,r);return o?W(a)||s[0]===`{`||s[0]===`[`?`${o} ${s}`:`${o}\n${t.indent}${s}`:s}function Na(){return(Na=e((()=>{Gi(),G(),da(),Oa()})))()}function Pa({key:e,value:t},n,r,i){let{allNullValues:a,doc:o,indent:s,indentStep:c,options:{commentString:l,indentSeq:u,simpleKeys:d}}=n,f=B(e)&&e.comment||null;if(d){if(f)throw Error(`With simple keys, key nodes cannot have comments`);if(z(e)||!B(e)&&typeof e==`object`)throw Error(`With simple keys, collection cannot be used as a key value`)}let p=!d&&(!e||f&&t==null&&!n.inFlow||z(e)||(W(e)?e.type===J.BLOCK_FOLDED||e.type===J.BLOCK_LITERAL:typeof e==`object`));n=Object.assign({},n,{allNullValues:!1,implicitKey:!p&&(d||!a),indent:s+c});let m=!1,h=!1,g=Ma(e,n,()=>m=!0,()=>h=!0);if(!p&&!n.inFlow&&g.length>1024){if(d)throw Error(`With simple keys, single line scalar must not span more than 1024 characters`);p=!0}if(n.inFlow){if(a||t==null)return m&&r&&r(),g===``?`?`:p?`? ${g}`:g}else if(a&&!d||t==null&&p)return g=`? ${g}`,f&&!m?g+=ua(g,n.indent,l(f)):h&&i&&i(),g;m&&(f=null),p?(f&&(g+=ua(g,n.indent,l(f))),g=`? ${g}\n${s}:`):(g=`${g}:`,f&&(g+=ua(g,n.indent,l(f))));let _,v,y;B(t)?(_=!!t.spaceBefore,v=t.commentBefore,y=t.comment):(_=!1,v=null,y=null,t&&typeof t==`object`&&(t=o.createNode(t))),n.implicitKey=!1,!p&&!f&&W(t)&&(n.indentAtStart=g.length+1),h=!1,!u&&c.length>=2&&!n.inFlow&&!p&&Ai(t)&&!t.flow&&!t.tag&&!t.anchor&&(n.indent=n.indent.substring(2));let b=!1,x=Ma(t,n,()=>b=!0,()=>h=!0),S=` `;if(f||_||v){if(S=_?`
`:``,v){let e=l(v);S+=`\n${ca(e,n.indent)}`}x===``&&!n.inFlow?S===`
`&&y&&(S=`

`):S+=`\n${n.indent}`}else if(!p&&z(t)){let e=x[0],r=x.indexOf(`
`),i=r!==-1,a=n.inFlow??t.flow??t.items.length===0;if(i||!a){let t=!1;if(i&&(e===`&`||e===`!`)){let n=x.indexOf(` `);e===`&`&&n!==-1&&n<r&&x[n+1]===`!`&&(n=x.indexOf(` `,n+1)),(n===-1||r<n)&&(t=!0)}t||(S=`\n${n.indent}`)}}else(x===``||x[0]===`
`)&&(S=``);return g+=S+x,n.inFlow?b&&r&&r():y&&!b?g+=ua(g,n.indent,l(y)):h&&i&&i(),g}function Fa(){return(Fa=e((()=>{G(),Y(),Na(),da()})))()}function Ia(e,t){(e===`debug`||e===`warn`)&&console.warn(t)}function La(e,t,n){let r=za(e,n);if(Ai(r))for(let n of r.items)Ra(e,t,n);else if(Array.isArray(r))for(let n of r)Ra(e,t,n);else Ra(e,t,r)}function Ra(e,t,n){let r=za(e,n);if(!ki(r))throw Error(`Merge sources must be maps or map aliases`);let i=r.toJSON(null,e,Map);for(let[e,n]of i)t instanceof Map?t.has(e)||t.set(e,n):t instanceof Set?t.add(e):Object.prototype.hasOwnProperty.call(t,e)||Object.defineProperty(t,e,{value:n,writable:!0,enumerable:!0,configurable:!0});return t}function za(e,t){return e&&Di(t)?t.resolve(e.doc,e):t}var Ba,Va,Ha;function Ua(){return(Ua=e((()=>{G(),Y(),Ba=`<<`,Va={identify:e=>e===Ba||typeof e==`symbol`&&e.description===Ba,default:`key`,tag:`tag:yaml.org,2002:merge`,test:/^<<$/,resolve:()=>Object.assign(new J(Symbol(Ba)),{addToJSMap:La}),stringify:()=>Ba},Ha=(e,t)=>(Va.identify(t)||W(t)&&(!t.type||t.type===J.PLAIN)&&Va.identify(t.value))&&e?.doc.schema.tags.some(e=>e.tag===Va.tag&&e.default)})))()}function Wa(e,t,{key:n,value:r}){if(B(n)&&n.addToJSMap)n.addToJSMap(e,t,r);else if(Ha(e,n))La(e,t,r);else{let i=q(n,``,e);if(t instanceof Map)t.set(i,q(r,i,e));else if(t instanceof Set)t.add(i);else{let a=Ga(n,i,e),o=q(r,a,e);a in t?Object.defineProperty(t,a,{value:o,writable:!0,enumerable:!0,configurable:!0}):t[a]=o}}return t}function Ga(e,t,n){if(t===null)return``;if(typeof t!=`object`)return String(t);if(B(e)&&n?.doc){let t=ka(n.doc,{});t.anchors=new Set;for(let e of n.anchors.keys())t.anchors.add(e.anchor);t.inFlow=!0,t.inStringifyKey=!0;let r=e.toString(t);if(!n.mapKeyWarned){let e=JSON.stringify(r);e.length>40&&(e=e.substring(0,36)+`..."`),Ia(n.doc.options.logLevel,`Keys with collection values will be stringified due to JS Object restrictions: ${e}. Set mapAsMap: true to use object keys.`),n.mapKeyWarned=!0}return r}return JSON.stringify(t)}function Ka(){return(Ka=e((()=>{Ua(),Na(),G(),qi()})))()}function qa(e,t,n){let r=ta(e,void 0,n),i=ta(t,void 0,n);return new Ja(r,i)}var Ja;function X(){return(X=e((()=>{ra(),Fa(),Ka(),G(),Ja=class e{constructor(e,t=null){Object.defineProperty(this,H,{value:wi}),this.key=e,this.value=t}clone(t){let{key:n,value:r}=this;return B(n)&&(n=n.clone(t)),B(r)&&(r=r.clone(t)),new e(n,r)}toJSON(e,t){return Wa(t,t?.mapAsMap?new Map:{},this)}toString(e,t,n){return e?.doc?Pa(this,e,t,n):JSON.stringify(this)}}})))()}function Ya(e,t,n){return(t.inFlow??e.flow?Za:Xa)(e,t,n)}function Xa({comment:e,items:t},n,{blockItemPrefix:r,flowChars:i,itemIndent:a,onChompKeep:o,onComment:s}){let{indent:c,options:{commentString:l}}=n,u=Object.assign({},n,{indent:a,type:null}),d=!1,f=[];for(let e=0;e<t.length;++e){let i=t[e],o=null;if(B(i))!d&&i.spaceBefore&&f.push(``),Qa(n,f,i.commentBefore,d),i.comment&&(o=i.comment);else if(U(i)){let e=B(i.key)?i.key:null;e&&(!d&&e.spaceBefore&&f.push(``),Qa(n,f,e.commentBefore,d))}d=!1;let s=Ma(i,u,()=>o=null,()=>d=!0);o&&(s+=ua(s,a,l(o))),d&&o&&(d=!1),f.push(r+s)}let p;if(f.length===0)p=i.start+i.end;else{p=f[0];for(let e=1;e<f.length;++e){let t=f[e];p+=t?`\n${c}${t}`:`
`}}return e?(p+=`
`+ca(l(e),c),s&&s()):d&&o&&o(),p}function Za({items:e},t,{flowChars:n,itemIndent:r}){let{indent:i,indentStep:a,flowCollectionPadding:o,options:{commentString:s}}=t;r+=a;let c=Object.assign({},t,{indent:r,inFlow:!0,type:null}),l=!1,u=0,d=[];for(let n=0;n<e.length;++n){let i=e[n],a=null;if(B(i))i.spaceBefore&&d.push(``),Qa(t,d,i.commentBefore,!1),i.comment&&(a=i.comment);else if(U(i)){let e=B(i.key)?i.key:null;e&&(e.spaceBefore&&d.push(``),Qa(t,d,e.commentBefore,!1),e.comment&&(l=!0));let n=B(i.value)?i.value:null;n?(n.comment&&(a=n.comment),n.commentBefore&&(l=!0)):i.value==null&&e?.comment&&(a=e.comment)}a&&(l=!0);let o=Ma(i,c,()=>a=null);l||=d.length>u||o.includes(`
`),n<e.length-1?o+=`,`:t.options.trailingComma&&(t.options.lineWidth>0&&(l||=d.reduce((e,t)=>e+t.length+2,2)+(o.length+2)>t.options.lineWidth),l&&(o+=`,`)),a&&(o+=ua(o,r,s(a))),d.push(o),u=d.length}let{start:f,end:p}=n;if(d.length===0)return f+p;if(!l){let e=d.reduce((e,t)=>e+t.length+2,2);l=t.options.lineWidth>0&&e>t.options.lineWidth}if(l){let e=f;for(let t of d)e+=t?`\n${a}${i}${t}`:`
`;return`${e}\n${i}${p}`}return`${f}${o}${d.join(` `)}${o}${p}`}function Qa({indent:e,options:{commentString:t}},n,r,i){if(r&&i&&(r=r.replace(/^\n+/,``)),r){let i=ca(t(r),e);n.push(i.trimStart())}}function $a(){return($a=e((()=>{G(),Na(),da()})))()}function eo(e,t){let n=W(t)?t.value:t;for(let r of e)if(U(r)&&(r.key===t||r.key===n||W(r.key)&&r.key.value===n))return r}var Z;function to(){return(to=e((()=>{$a(),Ka(),sa(),G(),X(),Y(),Z=class extends oa{static get tagName(){return`tag:yaml.org,2002:map`}constructor(e){super(V,e),this.items=[]}static from(e,t,n){let{keepUndefined:r,replacer:i}=n,a=new this(e),o=(e,o)=>{if(typeof i==`function`)o=i.call(t,e,o);else if(Array.isArray(i)&&!i.includes(e))return;(o!==void 0||r)&&a.items.push(qa(e,o,n))};if(t instanceof Map)for(let[e,n]of t)o(e,n);else if(t&&typeof t==`object`)for(let e of Object.keys(t))o(e,t[e]);return typeof e.sortMapEntries==`function`&&a.items.sort(e.sortMapEntries),a}add(e,t){let n;n=U(e)?e:!e||typeof e!=`object`||!(`key`in e)?new Ja(e,e?.value):new Ja(e.key,e.value);let r=eo(this.items,n.key),i=this.schema?.sortMapEntries;if(r){if(!t)throw Error(`Key ${n.key} already set`);W(r.value)&&$i(n.value)?r.value.value=n.value:r.value=n.value}else if(i){let e=this.items.findIndex(e=>i(n,e)<0);e===-1?this.items.push(n):this.items.splice(e,0,n)}else this.items.push(n)}delete(e){let t=eo(this.items,e);return t?this.items.splice(this.items.indexOf(t),1).length>0:!1}get(e,t){let n=eo(this.items,e)?.value;return(!t&&W(n)?n.value:n)??void 0}has(e){return!!eo(this.items,e)}set(e,t){this.add(new Ja(e,t),!0)}toJSON(e,t,n){let r=n?new n:t?.mapAsMap?new Map:{};t?.onCreate&&t.onCreate(r);for(let e of this.items)Wa(t,r,e);return r}toString(e,t,n){if(!e)return JSON.stringify(this);for(let e of this.items)if(!U(e))throw Error(`Map items must all be pairs; found ${JSON.stringify(e)} instead`);return!e.allNullValues&&this.hasAllNullValues(!1)&&(e=Object.assign({},e,{allNullValues:!0})),Ya(this,e,{blockItemPrefix:``,flowChars:{start:`{`,end:`}`},itemIndent:e.indent||``,onChompKeep:n,onComment:t})}}})))()}var no;function ro(){return(ro=e((()=>{G(),to(),no={collection:`map`,default:!0,nodeClass:Z,tag:`tag:yaml.org,2002:map`,resolve(e,t){return ki(e)||t(`Expected a mapping for this tag`),e},createNode:(e,t,n)=>Z.from(e,t,n)}})))()}function io(e){let t=W(e)?e.value:e;return t&&typeof t==`string`&&(t=Number(t)),typeof t==`number`&&Number.isInteger(t)&&t>=0?t:null}var ao;function oo(){return(oo=e((()=>{ra(),$a(),sa(),G(),Y(),qi(),ao=class extends oa{static get tagName(){return`tag:yaml.org,2002:seq`}constructor(e){super(Ei,e),this.items=[]}add(e){this.items.push(e)}delete(e){let t=io(e);return typeof t==`number`&&this.items.splice(t,1).length>0}get(e,t){let n=io(e);if(typeof n!=`number`)return;let r=this.items[n];return!t&&W(r)?r.value:r}has(e){let t=io(e);return typeof t==`number`&&t<this.items.length}set(e,t){let n=io(e);if(typeof n!=`number`)throw Error(`Expected a valid index, not ${e}.`);let r=this.items[n];W(r)&&$i(t)?r.value=t:this.items[n]=t}toJSON(e,t){let n=[];t?.onCreate&&t.onCreate(n);let r=0;for(let e of this.items)n.push(q(e,String(r++),t));return n}toString(e,t,n){return e?Ya(this,e,{blockItemPrefix:`- `,flowChars:{start:`[`,end:`]`},itemIndent:(e.indent||``)+`  `,onChompKeep:n,onComment:t}):JSON.stringify(this)}static from(e,t,n){let{replacer:r}=n,i=new this(e);if(t&&Symbol.iterator in Object(t)){let e=0;for(let a of t){if(typeof r==`function`){let n=t instanceof Set?a:String(e++);a=r.call(t,n,a)}i.items.push(ta(a,void 0,n))}}return i}}})))()}var so;function co(){return(co=e((()=>{G(),oo(),so={collection:`seq`,default:!0,nodeClass:ao,tag:`tag:yaml.org,2002:seq`,resolve(e,t){return Ai(e)||t(`Expected a sequence for this tag`),e},createNode:(e,t,n)=>ao.from(e,t,n)}})))()}function lo(){return(lo=e((()=>{Oa()})))()}function uo(){return(uo=e((()=>{Y()})))()}function fo(){return(fo=e((()=>{Y()})))()}function po(){return(po=e((()=>{Y()})))()}function mo(){return(mo=e((()=>{ro(),uo(),co(),lo(),fo(),po()})))()}function ho(e){return typeof e==`bigint`||Number.isInteger(e)}var go,_o;function vo(){return(vo=e((()=>{Y(),ro(),co(),go=({value:e})=>JSON.stringify(e),_o=[{identify:e=>typeof e==`string`,default:!0,tag:`tag:yaml.org,2002:str`,resolve:e=>e,stringify:go},{identify:e=>e==null,createNode:()=>new J(null),default:!0,tag:`tag:yaml.org,2002:null`,test:/^null$/,resolve:()=>null,stringify:go},{identify:e=>typeof e==`boolean`,default:!0,tag:`tag:yaml.org,2002:bool`,test:/^true$|^false$/,resolve:e=>e===`true`,stringify:go},{identify:ho,default:!0,tag:`tag:yaml.org,2002:int`,test:/^-?(?:0|[1-9][0-9]*)$/,resolve:(e,t,{intAsBigInt:n})=>n?BigInt(e):parseInt(e,10),stringify:({value:e})=>ho(e)?e.toString():JSON.stringify(e)},{identify:e=>typeof e==`number`,default:!0,tag:`tag:yaml.org,2002:float`,test:/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,resolve:e=>parseFloat(e),stringify:go}],[no,so].concat(_o,{default:!0,tag:``,test:/^/,resolve(e,t){return t(`Unresolved plain scalar ${JSON.stringify(e)}`),e}})})))()}function yo(){return(yo=e((()=>{Y(),Oa()})))()}function bo(e,t,n){let{replacer:r}=n,i=new ao(e);i.tag=`tag:yaml.org,2002:pairs`;let a=0;if(t&&Symbol.iterator in Object(t))for(let e of t){typeof r==`function`&&(e=r.call(t,String(a++),e));let o,s;if(Array.isArray(e)){if(e.length===2)o=e[0],s=e[1];else throw TypeError(`Expected [key, value] tuple: ${e}`)}else if(e&&e instanceof Object){let t=Object.keys(e);if(t.length===1)o=t[0],s=e[o];else throw TypeError(`Expected tuple with one key, not ${t.length} keys`)}else o=e;i.items.push(qa(o,s,n))}return i}function xo(){return(xo=e((()=>{X(),Y(),oo()})))()}var So;function Co(){return(Co=e((()=>{G(),qi(),to(),oo(),xo(),So=class e extends ao{constructor(){super(),this.add=Z.prototype.add.bind(this),this.delete=Z.prototype.delete.bind(this),this.get=Z.prototype.get.bind(this),this.has=Z.prototype.has.bind(this),this.set=Z.prototype.set.bind(this),this.tag=e.tag}toJSON(e,t){if(!t)return super.toJSON(e);let n=new Map;t?.onCreate&&t.onCreate(n);for(let e of this.items){let r,i;if(U(e)?(r=q(e.key,``,t),i=q(e.value,r,t)):r=q(e,``,t),n.has(r))throw Error(`Ordered maps must not include duplicate keys`);n.set(r,i)}return n}static from(e,t,n){let r=bo(e,t,n),i=new this;return i.items=r.items,i}},So.tag=`tag:yaml.org,2002:omap`})))()}function wo(){return(wo=e((()=>{Y()})))()}function To(){return(To=e((()=>{Y()})))()}var Eo;function Do(){return(Do=e((()=>{G(),X(),to(),Eo=class e extends Z{constructor(t){super(t),this.tag=e.tag}add(e){let t;t=U(e)?e:e&&typeof e==`object`&&`key`in e&&`value`in e&&e.value===null?new Ja(e.key,null):new Ja(e,null),eo(this.items,t.key)||this.items.push(t)}get(e,t){let n=eo(this.items,e);return!t&&U(n)?W(n.key)?n.key.value:n.key:n}set(e,t){if(typeof t!=`boolean`)throw Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof t}`);let n=eo(this.items,e);n&&!t?this.items.splice(this.items.indexOf(n),1):!n&&t&&this.items.push(new Ja(e))}toJSON(e,t){return super.toJSON(e,t,Set)}toString(e,t,n){if(!e)return JSON.stringify(this);if(this.hasAllNullValues(!0))return super.toString(Object.assign({},e,{allNullValues:!0}),t,n);throw Error(`Set items must all have null values`)}static from(e,t,n){let{replacer:r}=n,i=new this(e);if(t&&Symbol.iterator in Object(t))for(let e of t)typeof r==`function`&&(e=r.call(t,e,e)),i.items.push(qa(e,null,n));return i}},Eo.tag=`tag:yaml.org,2002:set`})))()}function Oo(){return(Oo=e((()=>{ro(),uo(),co(),lo(),yo(),wo(),To(),Ua(),Co(),xo(),Do()})))()}function ko(){return(ko=e((()=>{ro(),uo(),co(),lo(),fo(),po(),mo(),vo(),yo(),Ua(),Co(),xo(),Oo(),Do()})))()}function Ao(){return(Ao=e((()=>{ro(),co(),lo(),ko()})))()}function jo(){return(jo=e((()=>{Na()})))()}function Mo(){return(Mo=e((()=>{Qi(),sa(),X(),Ao(),jo(),Gi(),ra(),Ui()})))()}function No(){return(No=e((()=>{X(),to()})))()}function Po(){return(Po=e((()=>{oo()})))()}function Fo(){return(Fo=e((()=>{X(),to(),oo()})))()}function Io(){return(Io=e((()=>{Y(),to(),oo(),No(),Po(),Fo()})))()}function Lo(){return(Lo=e((()=>{Y()})))()}function Ro(){return(Ro=e((()=>{Y()})))()}function zo(){return(zo=e((()=>{Y(),Lo(),Ro()})))()}function Bo(){return(Bo=e((()=>{Qi(),Io(),zo()})))()}function Vo(){return(Vo=e((()=>{Mo(),Bo()})))()}function Ho(){return(Ho=e((()=>{Ui(),Mo(),Vo()})))()}function Uo(){return(Uo=e((()=>{Lo(),Ro(),Oa()})))()}function Wo(e,t){`type`in e&&e.type===`document`&&(e={start:e.start,value:e.value}),Go(Object.freeze([]),e,t)}function Go(e,t,n){let r=n(t,e);if(typeof r==`symbol`)return r;for(let i of[`key`,`value`]){let a=t[i];if(a&&`items`in a){for(let t=0;t<a.items.length;++t){let r=Go(Object.freeze(e.concat([[i,t]])),a.items[t],n);if(typeof r==`number`)t=r-1;else if(r===Ko)return Ko;else r===Jo&&(a.items.splice(t,1),--t)}typeof r==`function`&&i===`key`&&(r=r(t,e))}}return typeof r==`function`?r(t,e):r}var Ko,qo,Jo;function Yo(){return(Yo=e((()=>{Ko=Symbol(`break visit`),qo=Symbol(`skip children`),Jo=Symbol(`remove item`),Wo.BREAK=Ko,Wo.SKIP=qo,Wo.REMOVE=Jo,Wo.itemAtPath=(e,t)=>{let n=e;for(let[e,r]of t){let t=n?.[e];if(t&&`items`in t)n=t.items[r];else return}return n},Wo.parentCollection=(e,t)=>{let n=Wo.itemAtPath(e,t.slice(0,-1)),r=t[t.length-1][0],i=n?.[r];if(i&&`items`in i)return i;throw Error(`Parent collection not found`)}})))()}function Xo(){return(Xo=e((()=>{Uo(),Yo()})))()}function Zo(){return(Zo=e((()=>{Xo()})))()}function Qo(){return(Qo=e((()=>{Xo(),Zo()})))()}function $o(){return($o=e((()=>{Ho(),Mo(),Qo()})))()}function es(){return(es=e((()=>{Ho(),Mo(),Ao(),Qi(),X(),Y(),to(),oo(),Xo(),Zo(),Qo(),$o(),zi()})))()}function ts(){return(ts=e((()=>{es()})))()}function ns(e){return e.replace(/^\uFEFF/,``).replace(/\r\n/g,`
`).replace(/\r/g,`
`)}function rs(e){let t=os.exec(e);if(!t)return;let n=t[0].length,r=e.slice(n),i=as.exec(r);if(i)return{block:r.slice(0,i.index),body:r.slice(i.index+i[0].length)}}function is(e){let t=ns(e);return(rs(t)?.body??t).trim()}var as,os;function ss(){return(ss=e((()=>{ts(),as=/(?:^|\n)---[^\S\n]*(?:\n|(?![\s\S]))/,os=/^---[^\S\n]*\n/})))()}var cs;function ls(){return(ls=e((()=>{A(),cs=De`
  :host {
    display: contents;
  }

  .modal {
    width: 100%;
    height: min(780px, 86vh);
    background: var(--bg);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
  }

  .heading {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 16px;
    overflow-wrap: anywhere;
  }
  .close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--muted);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: var(--cursor-action);
  }
  .close-button:hover {
    color: var(--text-strong);
    background: var(--bg-elevated);
  }
  .close-button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .close-button svg {
    width: 18px;
    height: 18px;
  }
  .body.tree {
    grid-template-columns: minmax(180px, 260px) minmax(0, 1fr);
  }
  .tree .item {
    grid-template-columns: 16px minmax(0, 1fr);
  }
  .folder > summary {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 9px 10px;
    color: var(--muted);
    font-size: 12px;
  }
  .folder > summary svg {
    width: 16px;
    height: 16px;
  }
  .folder > div {
    padding-left: 12px;
  }
  .folder .item {
    width: 100%;
    padding: 9px 10px;
    gap: 8px;
  }
  .notice {
    margin: 0;
    padding: 12px 20px;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
  }
  .markdown {
    font-size: 14px;
    line-height: 1.65;
    overflow-wrap: anywhere;
  }
  .markdown > :first-child {
    margin-top: 0;
  }
  .markdown h1 {
    font-size: 24px;
  }
  .markdown h2 {
    font-size: 20px;
  }
  .markdown h3 {
    font-size: 16px;
  }
  .markdown pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    background: var(--bg-elevated);
    padding: 12px;
    border-radius: var(--radius-md);
  }
  .markdown code {
    font-family: var(--mono);
  }
  .markdown a {
    color: var(--accent);
  }
  .markdown table {
    display: block;
    overflow: auto;
    max-width: 100%;
  }
  .markdown th,
  .markdown td {
    padding: 8px;
    border: 1px solid var(--border);
  }
  .search-icon {
    color: var(--muted);
    font-size: 18px;
  }

  .search {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-strong);
    font: inherit;
    font-size: 18px;
    font-weight: 400;
    padding: 4px 0;
  }

  .search:focus,
  .search:focus-visible {
    outline: none;
    border: none;
    box-shadow: none;
  }

  .search::placeholder {
    color: var(--muted);
  }

  .state {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--muted);
    padding: 5px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-elevated);
  }

  .body {
    flex: 1;
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    min-height: 0;
  }

  .list {
    border-right: 1px solid var(--border);
    padding: 14px 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .list-section {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    padding: 4px 12px 8px;
  }

  .item {
    display: grid;
    grid-template-columns: 16px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border-radius: var(--radius-md);
    border: none;
    background: transparent;
    color: var(--text);
    font: inherit;
    outline: none;
    text-align: left;
  }

  .item:focus-visible {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 55%, transparent);
  }

  .item:hover {
    background: var(--bg-elevated);
  }

  .item.is-active {
    background: var(--accent-subtle);
  }

  .item.is-active .item-name {
    color: var(--text-strong);
  }

  .item-icon {
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    opacity: 0.85;
  }

  .item.is-active .item-icon {
    color: var(--accent);
    opacity: 1;
  }

  .item-icon svg,
  .chat-copy-btn svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.5px;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .item-name {
    font-family: var(--mono);
    font-size: 14px;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-meta {
    color: var(--muted);
    font-size: 12px;
  }

  .empty-list {
    color: var(--muted);
    font-size: 13px;
    padding: 12px;
  }

  .detail {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }

  .detail.empty {
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
  }

  .detail-head {
    padding: 20px 24px 14px;
    border-bottom: 1px solid var(--border);
  }

  .detail-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  .title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-family: var(--mono);
    font-size: 22px;
    color: var(--text-strong);
    font-weight: 700;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chat-copy-btn {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-elevated);
    color: var(--muted);
  }

  .chat-copy-btn:hover {
    border-color: var(--border-strong);
    color: var(--text-strong);
  }

  .chat-copy-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .chat-copy-btn__icon {
    display: inline-flex;
    width: 16px;
    height: 16px;
    position: relative;
  }

  .chat-copy-btn__icon-copy,
  .chat-copy-btn__icon-check {
    position: absolute;
    inset: 0;
    transition: opacity 150ms ease;
  }

  .chat-copy-btn__icon-check,
  .chat-copy-btn[data-copy-state="copied"] .chat-copy-btn__icon-copy {
    opacity: 0;
  }

  .chat-copy-btn[data-copy-state="copied"] .chat-copy-btn__icon-check {
    opacity: 1;
  }

  .chat-copy-btn[data-copy-state="copying"] {
    opacity: 0;
    pointer-events: none;
  }

  .chat-copy-btn[data-copy-state="error"] {
    border-color: var(--danger-subtle);
    background: var(--danger-subtle);
    color: var(--danger);
  }

  .chat-copy-btn[data-copy-state="copied"] {
    border-color: var(--ok-subtle);
    background: var(--ok-subtle);
    color: var(--ok);
  }

  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11.5px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--muted);
  }

  .chip.accent {
    background: var(--accent-subtle);
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    color: var(--accent);
  }

  .chip.ok {
    background: color-mix(in srgb, var(--ok) 12%, transparent);
    border-color: color-mix(in srgb, var(--ok) 30%, transparent);
    color: var(--ok);
  }

  .detail-body {
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 20px 24px 24px;
  }

  .code-content {
    min-width: 0;
  }

  .code-chunk {
    margin: 0;
    min-width: 0;
    font-family: var(--mono);
    font-size: 13px;
    line-height: 1.7;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
    content-visibility: auto;
    contain-intrinsic-block-size: auto 1414px;
  }

  .foot {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg);
    font-size: 12px;
    color: var(--muted);
  }

  .foot-group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .kbd {
    font-family: var(--mono);
    font-size: 10.5px;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg-elevated);
    color: var(--text);
  }

  .spacer {
    flex: 1;
  }

  .button {
    height: 36px;
    padding: 0 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text);
    font-weight: 600;
  }

  .button:hover {
    border-color: var(--border-strong);
    color: var(--text-strong);
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-strong);
    margin: 0 0 8px;
  }

  .empty-subtitle {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
    max-width: 380px;
  }

  @media (max-width: 640px) {
    .head {
      padding: 12px;
    }

    .body,
    .body.tree {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, min(180px, 30dvh)) minmax(0, 1fr);
    }

    .list {
      min-width: 0;
      border-right: 0;
      border-bottom: 1px solid var(--border);
      padding: 10px 8px;
    }

    .item {
      min-width: 0;
    }

    .foot {
      gap: 8px;
      padding: 10px 12px;
    }
  }
`})))()}function us(e){let t=e.split(`
`),n=[];for(let e=0;e<t.length;e+=fs)n.push(t.slice(e,e+fs).join(`
`));return n}function ds(e){let t=e.split(`.`).pop()?.toLowerCase()??``,n={md:`Markdown`,txt:C(`filePreview.kind.text`),json:`JSON`,yaml:`YAML`,yml:`YAML`,ts:`TypeScript`,js:`JavaScript`,py:`Python`,sh:C(`filePreview.kind.shell`)};return Object.hasOwn(n,t)?n[t]:t?t.toUpperCase():C(`filePreview.kind.file`)}var Q,fs,ps;function ms(){return(ms=e((()=>{A(),we(),Je(),ss(),f(),Rt(),d(),ht(),nt(),ls(),w(),ae(),be(),xt(),zt(),ye(),Ft(),Q=class extends u{constructor(...e){super(...e),this.files=[],this.activePath=``,this.query=``,this.label=``,this.listLabel=``,this.searchPlaceholder=``,this.contextLabel=``,this.emptyTitle=``,this.emptySubtitle=``,this.copyLabel=``,this.layout=`files`,this.directories=[],this.loading=!1,this.fileLoading=!1,this.error=``,this.notice=``,this.filteredFiles=[],this.derivedInputsReady=!1,this.codeChunks=[],this.resetScrollAfterUpdate=!0,this.focusAfterUpdate=!1,this.handleDocumentLink=e=>{let t=e.target.closest(`a[href]`)?.getAttribute(`href`);if(!t||/^[a-z][a-z0-9+.-]*:|^\/\//iu.test(t))return;e.preventDefault();let n=new URL(this.activeFile?.path??`SKILL.md`,`https://skill.invalid/`),r=new URL(t,n),i;try{i=decodeURIComponent(r.pathname.slice(1))}catch{return}let a=this.files.find(e=>e.path===i);a&&this.emitSelect(a.path)},this.handleQueryInput=e=>{let t=e.target.value;this.dispatchEvent(new CustomEvent(`file-preview-query-change`,{bubbles:!0,composed:!0,detail:t}))},this.preventItemPointerFocus=e=>{this.layout===`files`&&e.preventDefault()},this.handleKeydown=e=>{switch(e.key){case`Escape`:e.preventDefault(),e.stopPropagation(),this.emitClose();return;case`ArrowDown`:this.moveSelection(1,e);return;case`ArrowUp`:this.moveSelection(-1,e)}},this.emitClose=()=>{this.dispatchEvent(new CustomEvent(`file-preview-close`,{bubbles:!0,composed:!0}))}}static{this.styles=[cs,oe]}willUpdate(e){if(!(!this.derivedInputsReady||e.has(`activePath`)||e.has(`query`)||e.has(`files`)||e.has(`layout`)))return;this.derivedInputsReady=!0,this.filteredFiles=this.filterFiles();let t=this.resolveActiveFile(this.filteredFiles);this.resetScrollAfterUpdate||=e.has(`layout`)||e.has(`query`)||this.activeFile?.path!==t?.path||this.activeFile?.contents!==t?.contents||this.activeFile?.message!==t?.message,this.activeFile=t;let n=t?.contents;n!==this.codeSource&&(this.codeSource=n,this.codeChunks=n===void 0?[]:us(n))}render(){let e=this.filteredFiles,t=this.activeFile,n=e.length===this.files.length?C(`filePreview.fileCount`,{count:String(this.files.length)}):C(`filePreview.filteredFileCount`,{count:String(e.length),total:String(this.files.length)}),r=this.label||C(`filePreview.label`),i=this.listLabel||C(`filePreview.listLabel`),a=this.searchPlaceholder||C(`filePreview.searchPlaceholder`);return k`
      <zero-modal-dialog
        label=${r}
        style="--zero-modal-width: min(1100px, 92vw); --zero-modal-max-height: 86vh;"
        @modal-cancel=${this.emitClose}
        @keydown=${this.handleKeydown}
      >
        <div class="modal">
          <header class="head">
            ${this.layout===`document`?k`<h1 class="heading">${r}</h1>
                    <button
                      class="close-button"
                      type="button"
                      aria-label=${C(`common.close`)}
                      @click=${this.emitClose}
                    >
                      ${T.x}
                    </button>`:k`<span class="search-icon">⌕</span
                    ><input
                      class="search"
                      placeholder=${a}
                      .value=${this.query}
                      @input=${this.handleQueryInput}
                    /><span class="state">${n}</span>`}
          </header>
          ${this.notice?k`<p class="notice" role="status">${this.notice}</p>`:``}
          <div
            class="body ${this.layout===`document`?`tree`:``}"
            aria-busy=${this.loading||this.fileLoading}
          >
            <aside class="list">
              ${this.layout===`files`?k`<div class="list-section">${i} · ${e.length}</div>`:``}
              ${this.loading&&!this.error?Bt(`file-list`,C(`common.loading`),!0):e.length===0?this.error?``:k`<div class="empty-list">${C(`filePreview.noMatches`)}</div>`:this.layout===`document`?this.renderFolder(``):e.map(e=>this.renderItem(e))}
            </aside>
            ${this.error?k`<section class="detail empty">
                    <p role="alert">${this.error}</p>
                    <button
                      class="button"
                      @click=${()=>this.dispatchEvent(new CustomEvent(`file-preview-retry`,{bubbles:!0,composed:!0}))}
                    >
                      ${C(`common.retry`)}
                    </button>
                  </section>`:this.loading||this.fileLoading?k`<section class="detail">
                      <div class="detail-body">
                        ${Bt(`document`,C(`common.loading`),!0)}
                      </div>
                    </section>`:t?this.renderFile(t):this.renderEmpty()}
          </div>
          ${this.layout===`files`?k`<footer class="foot">
                  <span class="foot-group"
                    >${_e([`↑`,`↓`],{className:`kbd`})}
                    ${C(`filePreview.navigate`)}</span
                  >
                  <span class="spacer"></span>
                  <button class="button" @click=${this.emitClose}>
                    ${C(`common.close`)} ${_e(`esc`,{className:`kbd`})}
                  </button>
                </footer>`:``}
        </div>
      </zero-modal-dialog>
    `}renderItem(e){return k`<button
      class="item ${e.path===this.activeFile?.path?`is-active`:``}"
      data-path=${e.path}
      aria-current=${e.path===this.activeFile?.path?`true`:`false`}
      @pointerdown=${this.preventItemPointerFocus}
      @mousedown=${this.preventItemPointerFocus}
      @click=${()=>this.emitSelect(e.path)}
    >
      <span class="item-icon">${ps[et(e.path)]}</span
      ><span class="item-name" title=${e.path}
        >${this.layout===`document`?e.path.split(`/`).pop():e.path}</span
      >${this.layout===`files`?k`<span class="item-meta">${e.size}</span>`:``}
    </button>`}renderFolder(e){let t=this.filteredFiles.filter(t=>t.path.startsWith(e)),n=t.filter(t=>!t.path.slice(e.length).includes(`/`)),r=new Set([...t.map(e=>e.path),...this.directories.map(e=>`${e}/`)].filter(t=>t.startsWith(e)&&t.slice(e.length).includes(`/`)).map(t=>t.slice(e.length).split(`/`)[0]));return k`${n.map(e=>this.renderItem(e))}${[...r].toSorted().map(t=>k`<details class="folder" open>
          <summary>${T.folder}<span>${t}</span></summary>
          <div>${this.renderFolder(`${e}${t}/`)}</div>
        </details>`)}`}renderFile(e){return k`
      <section class="detail">
        ${this.layout===`files`?k`<div class="detail-head">
                <div class="detail-title-row">
                  <h2 class="title">${e.path}</h2>
                  ${e.contents?dt(e.contents,this.copyLabel||C(`filePreview.copyFile`)):``}
                </div>
                <div class="chips">
                  <span class="chip accent">${ds(e.path)}</span>
                  <span class="chip">${e.size}</span>
                  <span class="chip">${C(`filePreview.readOnly`)}</span>
                  ${this.contextLabel?k`<span class="chip ok">${this.contextLabel}</span>`:``}
                </div>
              </div>`:``}
        <div class="detail-body">
          ${e.message?k`<p role="status">${e.message}</p>`:this.layout===`document`&&/\.md$/iu.test(e.path)?k`<article class="markdown" @click=${this.handleDocumentLink}>${Ue(ut(is(e.contents),{mode:`document`,remoteImages:!1,codeBlockChrome:`none`,fileLinks:!1}))}</article>`:k`<div class="code-content">${this.codeChunks.map((e,t)=>k`<pre class="code-chunk" data-chunk=${t}>${e}</pre>`)}</div>`}
        </div>
      </section>
    `}renderEmpty(){return k`
      <section class="detail empty">
        <p class="empty-title">${this.emptyTitle||C(`filePreview.emptyTitle`)}</p>
        <p class="empty-subtitle">${this.emptySubtitle||C(`filePreview.emptySubtitle`)}</p>
      </section>
    `}filterFiles(){let e=this.layout===`files`?this.query.trim().toLowerCase():``;return e?this.files.filter(t=>`${t.path}\n${t.contents}`.toLowerCase().includes(e)):this.files}resolveActiveFile(e){return e.find(e=>e.path===this.activePath)??e[0]}connectedCallback(){super.connectedCallback(),this.resetScrollAfterUpdate=!0,this.focusAfterUpdate=!0,this.requestUpdate()}updated(e){if(this.resetScrollAfterUpdate){this.resetScrollAfterUpdate=!1;let e=this.detailBody;e&&(e.scrollTop=0,e.scrollLeft=0)}(e.has(`activePath`)||e.has(`query`)||e.has(`files`))&&(this.scrollActiveFileIntoView(),this.layout===`document`&&e.has(`activePath`)&&this.focusModal()),this.focusAfterUpdate&&this.isConnected&&(this.focusAfterUpdate=!1,this.focusModal())}focusModal(){(this.searchInput??this.shadowRoot?.querySelector(`.item.is-active, .button`)??this.shadowRoot?.querySelector(`.close-button`))?.focus({preventScroll:!0})}moveSelection(e,t){t.preventDefault(),t.stopPropagation();let n=this.layout===`document`?[...this.shadowRoot?.querySelectorAll(`.item`)??[]].filter(e=>!e.closest(`details:not([open])`)).flatMap(e=>this.filteredFiles.filter(t=>t.path===e.dataset.path)):this.filterFiles();if(n.length===0)return;let r=this.resolveActiveFile(n),i=r?n.findIndex(e=>e.path===r.path):-1,a=n[Math.max(0,Math.min(n.length-1,i+e))];a&&a.path!==r?.path&&this.emitSelect(a.path)}scrollActiveFileIntoView(){this.updateComplete.then(()=>{this.isConnected&&this.shadowRoot?.querySelector(`.item.is-active`)?.scrollIntoView({block:`nearest`})}).catch(()=>{})}emitSelect(e){this.dispatchEvent(new CustomEvent(`file-preview-select`,{bubbles:!0,composed:!0,detail:e})),this.layout===`files`&&this.focusModal()}},P([M({attribute:!1})],Q.prototype,`files`,void 0),P([M()],Q.prototype,`activePath`,void 0),P([M()],Q.prototype,`query`,void 0),P([M()],Q.prototype,`label`,void 0),P([M()],Q.prototype,`listLabel`,void 0),P([M()],Q.prototype,`searchPlaceholder`,void 0),P([M()],Q.prototype,`contextLabel`,void 0),P([M()],Q.prototype,`emptyTitle`,void 0),P([M()],Q.prototype,`emptySubtitle`,void 0),P([M()],Q.prototype,`copyLabel`,void 0),P([M()],Q.prototype,`layout`,void 0),P([M({attribute:!1})],Q.prototype,`directories`,void 0),P([M({type:Boolean})],Q.prototype,`loading`,void 0),P([M({type:Boolean})],Q.prototype,`fileLoading`,void 0),P([M()],Q.prototype,`error`,void 0),P([M()],Q.prototype,`notice`,void 0),P([Te(`.search`)],Q.prototype,`searchInput`,void 0),P([Te(`.detail-body`)],Q.prototype,`detailBody`,void 0),fs=64,ps={code:T.fileCode,component:T.layoutGrid,data:T.braces,file:T.fileText,image:T.image,markdown:T.book,package:T.box,shell:T.terminal,skill:T.pencilSparkles}})))()}function hs(){return(hs=e((()=>{ms(),customElements.get(`zero-file-preview-modal`)||customElements.define(`zero-file-preview-modal`,Q)})))()}function gs(e,t){return!e.description?.trim()&&!e.parameters?.length?Promise.resolve():ve({signal:t,value:void 0},({render:t,finish:n})=>{t(()=>k`<zero-modal-dialog
        class="plugin-tool-dialog"
        label=${e.name}
        @modal-cancel=${()=>n(void 0)}
      >
        <article class="plugin-tool-preview">
          <header>
            <h2>${e.name}</h2>
            <button
              class="btn btn--icon"
              type="button"
              aria-label=${C(`common.close`)}
              @click=${()=>n(void 0)}
            >
              ${T.x}
            </button>
          </header>
          <div class="plugin-tool-preview__body">
            ${e.parameters?.length?k`<section class="plugin-tool-preview__parameters">
                    <h3>${C(`pluginsPage.detailToolInputs`)}</h3>
                    <dl>
                      ${e.parameters.map(e=>k`<div>
                          <dt>
                            <code>${e.name}</code>
                            <span
                              >${C(e.required?`pluginsPage.detailRequired`:`pluginsPage.detailOptional`)}</span
                            >
                            ${e.type?k`<span>${e.type}</span>`:``}
                          </dt>
                          ${e.description?k`<dd>${e.description}</dd>`:``}
                        </div>`)}
                    </dl>
                  </section>`:``}
            ${e.description?.trim()?k`<p>${e.description}</p>`:``}
          </div>
        </article>
      </zero-modal-dialog>`)})}function _s(){return(_s=e((()=>{A(),w(),fe(),f()})))()}function vs(e){let t=e.state;if(!t)return O;let n=t.result?.files.map(e=>({path:e.path,size:``,contents:e.content??``,...e.status!==`ready`&&e.status!==`deferred`?{message:C(`filePreview.bundle.${e.status}`)}:{}}))??[],r=t.result?.files.find(e=>e.path===t.activePath),i=t.fileErrors.get(t.activePath)??(r?.status===`unavailable`?C(`filePreview.bundle.unavailable`):``),a=t.result&&(!t.result.inventoryComplete||t.result.files.some(e=>e.status===`unavailable`||e.status===`too-large`));return k`<zero-file-preview-modal
    .label=${t.request.skillName}
    .files=${n}
    .directories=${t.result?.directories??[]}
    .activePath=${t.activePath}
    layout="document"
    .loading=${t.loading}
    .fileLoading=${t.pendingPaths.has(t.activePath)}
    .error=${t.error??(t.pendingPaths.has(t.activePath)?``:i)}
    .notice=${a?C(`filePreview.bundle.incomplete`):``}
    @file-preview-select=${t=>e.select(t.detail)}
    @file-preview-retry=${()=>e.retry()}
    @file-preview-close=${()=>e.close()}
  ></zero-file-preview-modal>`}function ys(e,t){return k`<div class="plugin-skills-section">
    ${R(C(`pluginsPage.detailTabs.skills`),e.map(e=>({...e,onOpen:()=>t(e.name)})),T.bookOpenText)}
  </div>`}var bs;function xs(){return(xs=e((()=>{A(),w(),hs(),f(),Rt(),It(),b(),ei(),_s(),Ft(),Lt(),bs=class{constructor(e,t){this.host=e,this.gateway=t,this.state=null,this.toolAbort=new AbortController}async open(e){this.close();let t=this.gateway.capture(),n={request:{...e},loading:!!t,error:t?null:C(`pluginsPage.connectToManage`),result:null,activePath:`SKILL.md`,pendingPaths:new Set,fileErrors:new Map};if(this.state=n,this.host.requestUpdate(),!t)return;let r=()=>this.state===n&&this.gateway.isCurrent(t);try{let i=await t.client.request(`plugins.skills.read`,e);r()&&(n.result=i,n.activePath=i.entryPath,i.version&&(n.request={...n.request,version:i.version}))}catch(e){r()&&(n.error=x(e))}finally{r()&&(n.loading=!1,this.host.requestUpdate())}}openTool(e){this.close(),gs(e,this.toolAbort.signal)}retry(){this.state?.result?this.select(this.state.activePath):this.state&&this.open(this.state.request)}async select(e){let t=this.state,n=t?.result?.files.find(t=>t.path===e);if(!t||!n||(t.activePath=e,this.host.requestUpdate(),t.pendingPaths.has(e)||n.status!==`deferred`&&n.status!==`unavailable`))return;let r=this.gateway.capture();if(!r){t.fileErrors.set(e,C(`pluginsPage.connectToManage`));return}let i=()=>this.state===t&&this.gateway.isCurrent(r);t.pendingPaths.add(e),t.fileErrors.delete(e);try{let n=await r.client.request(`plugins.skills.read`,{...t.request,path:e});if(!i()||!t.result)return;let a=n.files.find(t=>t.path===e);if(n.version!==t.result.version||n.rootPath!==t.result.rootPath||!a||a.status===`deferred`)throw Error(C(`filePreview.bundle.unavailable`));t.result={...t.result,files:t.result.files.map(t=>t.path===e?a:t)}}catch(n){i()&&t.fileErrors.set(e,x(n))}finally{i()&&(t.pendingPaths.delete(e),this.host.requestUpdate())}}close(){this.toolAbort.abort(),this.toolAbort=new AbortController,this.state=null,this.host.requestUpdate()}}})))()}function Ss(e){e.help?.update(e);let t=e.help?.available?e.help.ask:void 0,n=t?()=>void t():void 0,{actions:r,catalogDetail:i,consentController:a,context:o,detail:s,discovery:c}=e,l=o.runtimeConfig.state,u=gn(l.configSchema),d=i?.result,f=d?.plugin.catalog.latestVersion,p=d&&f&&d.detail.skills.length?ys(d.detail.skills,e=>r.openSkill({source:`catalog`,catalogId:d.plugin.id,version:f,skillName:e})):void 0,m=s?.pluginId??null,h=i?a.getActiveInstall(`install:${i.id}`):void 0,g=new URLSearchParams(e.routeData?.location.search??``).get(`from`)===`plugins`?`plugins`:`plugin-settings`,_={connected:e.connected,loading:e.loading,result:e.result,error:e.error,busy:e.busy,messages:e.messages,iconUrls:e.iconUrls,iconLoading:e.iconLoading,canMutate:e.canMutate,mutationBlockedReason:e.mutationBlockedReason,configBusy:l.configLoading,configError:l.lastError,canEditConfig:e.canEditConfig,configValue:l.configForm,configHints:l.configUiHints,configSchemaLoading:l.configSchemaLoading,configUnsupportedPaths:u.unsupportedPaths,onIconError:r.handlePluginIconError,onSetEnabled:r.updateEnabled,onUninstall:r.uninstall,onConfigPatch:r.patchConfig,onConfigRemove:r.removeConfig,onConfigReload:r.reloadConfig,onConfigReadRetry:r.retryConfigRead,onConfigWriteRetry:r.retryConfigWrite,onRefresh:r.refreshCatalog,onAskPlugin:n,onAskSetting:t},v=t=>{let n=s?.inspection?.components,i=n?.skillDetails??n?.skills.map(e=>({name:e}))??[],c=e.routeData?.location,l=e.installedDetailTab===`configuration`,d=Rn(c,!0),f=Rn(c,!1);return bi({..._,pluginId:t,installProgress:a.getActiveInstall(I(t)),inspection:s?.inspection??null,mcpLoginBusy:e.mcpLoginBusy,canMcpLogin:e.canMcpLogin,onMcpLogin:r.startMcpLogin,onEditMcp:()=>e.context.navigate(`mcp`),catalog:s?.catalog,inspectionError:s?.error??null,catalogLoading:s?.catalogLoading,catalogIconUrls:e.catalogIconUrls,catalogIconLoading:e.catalogIconLoading,renderCredential:e.renderCredential,tools:s?.tools,onOpenTool:r.openTool,skillsSection:i.length?ys(i,e=>r.openSkill({source:`installed`,pluginId:t,skillName:e})):n?void 0:p,settingsHref:`${d.pathname??``}${d.search}`,configSchema:kn(u.schema,t),hostControlsSchema:En(u.schema,t),backHref:l?`${f.pathname??``}${f.search}`:D(e.surface===`discovery`?`plugins`:g,o.basePath),backLabel:e.surface===`discovery`||g===`plugins`?C(`tabs.plugins`):C(`nav.settings`),tab:e.installedDetailTab,onBack:l?()=>r.selectInstalledDetailTab(`readme`):e.surface===`discovery`?r.closeCatalogDetail:()=>r.closeSettingsDetail(g),onRetryInspection:()=>r.retrySettingsDetail(t),onTabChange:r.selectInstalledDetailTab})};return k`
    ${e.surface===`discovery`&&!i?Mn({active:`plugins`,onSelect:r.selectHubTab,secondaryAction:{label:C(`pluginsPage.pluginSettings`),icon:T.settings,onClick:()=>r.openPluginSettings(null)}}):O}
    ${yt(k`
      ${Yn(e.pageNotice??void 0)}
      ${e.surface===`discovery`?k`<wa-tab-panel
              id=${Nn}
              name="plugins"
              active
              aria-labelledby="plugins-tab-plugins"
              >${i?m&&!h?v(m):ri({onAskPlugin:n,connected:e.connected,skillsSection:p,result:i.result,error:i.error,backHref:D(`plugins`,o.basePath),onBack:r.closeCatalogDetail,onRetry:r.retryCatalogDetail,canInstall:e.canMutate&&!e.messages[`install:${i.id}`]?.savedInstall&&!!(i.result&&vr(i.result)),installBlockedReason:e.mutationBlockedReason,onInstall:()=>r.installCatalogEntry(i.id),busy:!!e.busy[`install:${i.id}`],installProgress:a.installProgress.get(`install:${i.id}`),message:e.messages[`install:${i.id}`],onContinueInstall:e=>void a.install(e,`install:${i.id}`),iconUrls:e.catalogIconUrls,iconLoading:e.catalogIconLoading}):F(Lr({connected:e.connected,loading:c.loading,result:c.result,error:c.error??e.error,remoteError:c.remoteError,categories:c.categories,categoriesLoading:c.categoriesLoading,categoriesError:c.categoriesError,onRetryCategories:()=>void c.ensureCategories(!0),featured:c.featured,trending:c.trending,loadingMore:c.loadingMore,loadMoreError:c.loadMoreError,intent:c.intent,category:c.category,query:c.query,iconUrls:e.catalogIconUrls,pluginIconUrls:e.iconUrls,iconLoading:e.catalogIconLoading,pluginIconLoading:e.iconLoading,canInstall:e.canMutate,installProgress:a.installProgress,entryHref:e=>le(e,o.basePath),onIntentChange:e=>c.selectIntent(e),onCategoryChange:e=>c.selectCategory(e),onQueryChange:e=>c.updateQuery(e),onOpenEntry:e=>o.navigate(`plugins`,{pathname:le(e,o.basePath)}),onInstall:r.installCatalogEntry,busy:e.busy,messages:e.messages,onContinueInstall:(e,t)=>void a.install(t,`install:${e}`),onLoadMore:()=>void c.loadMore(),onRetry:()=>void c.refresh()}),{wide:!0,carapace:!0})}</wa-tab-panel
            >`:m?v(m):vi({..._,tab:e.settingsTab,query:e.query,advancedSchema:On(u.schema),onTabChange:r.selectSettingsTab,onQueryChange:r.setQuery,pluginHref:e=>re(e,o.basePath),onOpenPlugin:e=>r.openPluginSettings(e)})}
    `)}
    ${vs(e.skillPreview)} ${e.mcpLogin}
    ${a.consent?an({consent:a.consent,inspection:a.inspection,loading:a.inspectionLoading,error:a.inspectionError,iconUrl:a.consent.pluginId?e.iconUrls[a.consent.pluginId]:void 0,iconLoading:!!(a.consent.pluginId&&e.iconLoading?.(a.consent.pluginId)),canMutate:e.canMutate,mutationBlockedReason:e.mutationBlockedReason,busy:Object.values(e.busy).some(Boolean),onCancel:()=>a.close(),onConfirm:()=>a.confirm(),onRetry:()=>void a.inspect()}):O}
  `}function Cs(){return(Cs=e((()=>{A(),me(),vn(),w(),tt(),ft(),f(),ii(),Hr(),on(),Xn(),Pn(),jn(),yr(),An(),xi(),xs()})))()}var $;function ws(){return(ws=e((()=>{Re(),Ye(),we(),me(),ne(),xe(),vt(),f(),b(),Fe(),Yt(),i(),Mt(),d(),l(),Wn(),Kn(),Jn(),Xn(),Qn(),lr(),fr(),hr(),yr(),Cs(),xs(),$=class extends v{constructor(...e){super(...e),this.surface=`settings`,this.result=null,this.error=null,this.query=``,this.settingsTab=`installed`,this.busy={},this.messages={},this.detail=null,this.iconUrls={},this.catalogIconUrls={},this.pageNotice=null,this.catalogDetail=null,this.installedDetailTab=`readme`,this.installRequestGeneration=0,this.help=new Gn(this),this.configAutoSaveStatus=this.context?.runtimeConfig.state.configAutoSaveStatus??`idle`,this.pluginConfigEditPending=!1,this.routeDataConsumed=!1,this.icons=new mr({getContext:()=>this.context,isConnected:()=>this.isConnected,onInstalledUrlsChange:e=>{this.iconUrls=e},onCatalogUrlsChange:e=>{this.catalogIconUrls=e},onLoadingChange:()=>this.requestUpdate()}),this.gateway=new jt(this,{getGateway:()=>this.context?.gateway,onIdentityChange:()=>{this.result=null,this.error=null,this.messages={},this.pageNotice=null},invalidateRequests:e=>this.invalidateRequests(e.identityChanged||e.snapshot.phase!==`connected`||!e.snapshot.client),onSnapshot:e=>this.handleGatewaySnapshot(e)}),this.skillPreview=new bs(this,this.gateway),this.mcpLogin=new qn(this,this.gateway,{getDetail:()=>this.detail,getName:e=>this.result?.plugins.find(t=>t.id===e)?.name,canSignIn:()=>Ne(this.gateway.snapshot,`mcp.authLogin`,`operator.admin`),refresh:e=>this.showDetails(e)}),this.discovery=new Un(this,{getClient:()=>this.gateway.client,isConnected:()=>this.gateway.connected}),this.settings=new Zn({gateway:this.gateway,getContext:()=>this.context,getDetail:()=>this.detail,canInspect:()=>Se(this.context.gateway.snapshot.hello?.auth??null),canEdit:()=>this.canEditConfig(),onEdit:()=>{this.pluginConfigEditPending=!0},isSettings:()=>this.installedDetailTab===`configuration`}),this.consentController=new cr({gateway:this.gateway,getContext:()=>this.context,getResult:()=>this.result,canMutate:()=>this.canMutate(),isBusy:e=>!!this.busy[e],setBusy:(e,t)=>this.setBusy(e,t),setMessage:(e,t)=>this.setMessage(e,t),getMessages:()=>this.messages,clearPageNotice:()=>{this.pageNotice=null},closeDetails:()=>this.skillPreview.close(),applyMutationResult:e=>this.applyMutationResult(e),refreshCatalogAfterMutation:e=>this.refreshCatalog(e),requestUpdate:()=>this.requestUpdate()}),this.catalogTask=new Ge(this,{autoRun:!1,task:([e],{signal:t})=>e?e.request(`plugins.list`,{},{signal:t}):Ke,onComplete:e=>{this.replaceResult(e),this.surface===`settings`&&this.showDetails(this.activeRoutePluginId)},onError:e=>{this.error=x(e)}}),this.subscriptions=new s(this).effect(()=>this.context?.runtimeConfig,e=>(this.configAutoSaveStatus=e.state.configAutoSaveStatus,e.subscribe(()=>{let t=e.state.configAutoSaveStatus,n=this.configAutoSaveStatus===`saving`&&t===`saved`;this.configAutoSaveStatus=t,this.requestUpdate(),n&&this.pluginConfigEditPending&&(this.pluginConfigEditPending=!1,this.refreshCatalog())}))),this.handleDocumentKeydown=e=>{if(e.key!==`Escape`||Xt(e)||document.querySelector(`.shell-nav[aria-modal='true']`)||e.target instanceof Element&&e.target.closest(`wa-dropdown[open]`)||e.target instanceof Node&&e.target!==document&&e.target!==document.body&&!this.contains(e.target))return;let t=this.querySelector(`zero-plugin-install-action[open]`);if(t){t.dismiss(),e.stopPropagation();return}if(this.consentController.consent){this.consentController.close(),e.stopPropagation();return}if(!(this.skillPreview.state||document.querySelector(`zero-modal-dialog`))){if(this.querySelector(`:focus`)?.blur(),this.catalogDetail){this.closeCatalogDetail(),e.stopPropagation();return}this.detail&&(this.detail=null,this.surface===`settings`&&this.context.replace(`plugin-settings`,{pathname:D(`plugin-settings`,this.context.basePath)}),e.stopPropagation())}}}willUpdate(e){e.has(`routeData`)&&(this.skillPreview.close(),e.get(`routeData`)?.location.pathname!==this.routeData?.location.pathname&&(this.installRequestGeneration+=1,this.mcpLogin.reset()),this.applyRouteData())}updated(){this.icons.syncInstalled(this.result,this),this.icons.syncCatalog(this.discovery,this,this.detail?.catalog??this.catalogDetail?.result)}connectedCallback(){super.connectedCallback(),document.addEventListener(`keydown`,this.handleDocumentKeydown,!0)}disconnectedCallback(){this.mcpLogin.reset(),document.removeEventListener(`keydown`,this.handleDocumentKeydown,!0),this.skillPreview.close(),this.discovery.disconnect(),this.subscriptions.clear(),this.icons.reset(),super.disconnectedCallback()}handleGatewaySnapshot(e){let t=e.snapshot,n=t.pluginCapabilities?.generation,r=n!==void 0&&n!==this.pluginGeneration;this.pluginGeneration=n,!e.initial&&r&&this.skillPreview.close();let i=this.icons.updateAuth({hello:t.hello,settings:{token:this.context.gateway.connection.token},password:this.context.gateway.connection.password}),a=!e.initial&&(e.identityChanged||e.connectionChanged||i||r)&&t.phase===`connected`&&this.routeDataConsumed;!e.initial&&i&&!e.identityChanged&&!e.connectionChanged&&(this.gateway.invalidate(),this.invalidateRequests(t.phase!==`connected`||!t.client)),!e.initial&&(e.identityChanged||e.connectionChanged||i)&&(this.icons.reset(),this.busy={}),a&&this.refreshCatalog(),this.ensureInitialData()}applyRouteData(){let e=this.routeData;if(!e)return;this.routeDataConsumed=!0;let t=this.surface===`settings`?this.activeRoutePluginId:null,n=this.surface===`discovery`?this.activeRoutePluginId:null;this.surface===`settings`&&!t&&(this.settingsTab=new URLSearchParams(e.location.search).get(`tab`)===`advanced`?`advanced`:`installed`),(t||n)&&(this.installedDetailTab=new URLSearchParams(e.location.search).get(`view`)===`settings`?`configuration`:Ln(e.location.hash)),this.gateway.isRouteDataCurrent(e)&&(this.pluginGeneration!==void 0&&(e.result?.generation??-1)<this.pluginGeneration?this.refreshCatalog():(this.replaceResult(e.result),this.error=e.error)),this.surface===`settings`&&t!==this.detail?.pluginId&&this.showDetails(t),n!==this.catalogDetail?.id&&this.showCatalogDetail(n),this.ensureInitialData()}invalidateRequests(e){this.mcpLogin.reset(),e&&(this.catalogTask.run([null]),this.discovery.invalidate()),this.skillPreview.close(),this.detail=null,this.catalogDetail=null,this.installRequestGeneration+=1,this.consentController.reset()}replaceResult(e){this.uninstallingSelection||(this.detail&&e&&!e.plugins.some(e=>e.id===this.detail?.pluginId&&e.installed)&&(this.pageNotice=this.messages[I(this.detail.pluginId)]??this.pageNotice),this.result?.generation===e?.generation?this.icons.installed.reconcile(e):this.icons.installed.reset(),this.messages=this.consentController.reconcileInstallMessages(e),this.result=e,e&&this.surface===`discovery`&&this.refreshDiscovery())}get loading(){return this.gateway.connected&&(!this.routeDataConsumed||this.catalogTask.status===We.PENDING)}get activeRoutePluginId(){let e=this.routeData?.location.pathname??``;return this.surface===`settings`?se(e,this.context.basePath):ie(e,this.context.basePath)}get uninstallingSelection(){return!!(this.detail&&this.busy[I(this.detail.pluginId)]===`uninstall`&&this.activeRoutePluginId===(this.surface===`settings`?this.detail.pluginId:this.catalogDetail?.id))}ensureInitialData(){this.surface===`discovery`&&!this.activeRoutePluginId&&this.discovery.ensureCategories(),this.routeDataConsumed&&this.gateway.connected&&this.gateway.client&&((this.surface===`settings`||this.activeRoutePluginId&&this.installedDetailTab===`configuration`)&&(this.context.runtimeConfig.ensureLoaded(),this.context.runtimeConfig.ensureSchemaLoaded()),!this.loading&&!this.result&&!this.error&&this.refreshCatalog())}async refreshCatalog(e=this.gateway.connected?this.gateway.client:null){e&&(this.error=null,await this.catalogTask.run([e]))}async refreshDiscovery(){if(this.surface!==`discovery`)return;let e=this.activeRoutePluginId;return e?this.showCatalogDetail(e):this.discovery.refresh()}selectHubTab(e){(e!==`plugins`||this.surface!==`discovery`)&&this.context.navigate(e)}accessBlockedReason(e,t=this.gateway.connected){return _r({connected:t,hasAdminAccess:Se(this.context.gateway.snapshot.hello?.auth??null),mutationAllowed:e})}canMutate(){return this.result?.mutationAllowed===!0&&this.accessBlockedReason()===null}canEditConfig(){let e=this.context.runtimeConfig;return this.accessBlockedReason(e.canSet,e.state.connected)===null}setBusy(e,t){let n=t===`uninstall`||this.busy[e]===`uninstall`,r={...this.busy};t?r[e]=t:delete r[e],this.busy=r,n&&this.detail&&e===I(this.detail.pluginId)&&(t===`uninstall`?(this.catalogDetail=this.catalogDetail?{...this.catalogDetail}:null,this.showDetails(this.detail.pluginId)):this.refreshCatalog())}setMessage(e,t){let n={...this.messages};t?n[e]=t:delete n[e],this.messages=n}applyMutationResult(e){this.icons.installed.invalidate(e.plugin.id),this.replaceResult(gr(this.result,e.plugin))}showDetails(e){return this.mcpLogin.select(e),ur({pluginId:e,plugin:this.result?.plugins.find(t=>t.id===e),catalog:this.catalogDetail?.result,gateway:this.gateway,canInspect:!e||this.busy[I(e)]!==`uninstall`,getDetail:()=>this.detail,onChange:e=>{this.detail=e}})}async showCatalogDetail(e){if(this.surface!==`discovery`){this.catalogDetail=null;return}return dr({id:e,gateway:this.gateway,context:this.context,location:this.routeData?.location,inventory:this.result,uninstalling:this.uninstallingSelection,getDetail:()=>this.catalogDetail,onChange:e=>{this.catalogDetail=e},showInstalled:e=>this.showDetails(e)})}async installCatalogEntry(e){let t=this.gateway.capture(),n=`install:${e}`;if(!t||!this.canMutate()||this.busy[n])return;let r=++this.installRequestGeneration;this.setBusy(n,`install`);try{let i=this.catalogDetail?.result?.plugin.id===e?this.catalogDetail.result:await c(t.client,e);if(!this.gateway.isCurrent(t)||r!==this.installRequestGeneration)return;let a=vr(i);this.setBusy(n,null),a?await this.consentController.install(a,n):this.setMessage(n,{kind:`warning`,text:C(`pluginsPage.installAvailabilityChanged`)})}catch(e){this.gateway.isCurrent(t)&&r===this.installRequestGeneration&&this.setMessage(n,{kind:`error`,text:x(e)})}finally{this.gateway.isCurrent(t)&&this.setBusy(n,null)}}closeCatalogDetail(){this.catalogDetail=null,this.detail=null,this.context.navigate(`plugins`,{pathname:D(`plugins`,this.context.basePath)})}async uninstall(e,t){let r=this.result?.plugins.find(t=>t.id===e)?.name??e;await this.consentController.runMutation(t,t=>n(t,e),async(t,n,r,i)=>{this.detail?.pluginId===e&&(this.detail=null),i()&&(this.pageNotice=or(t,n),this.activeRoutePluginId===e&&this.context.replace(`plugin-settings`,{pathname:D(`plugin-settings`,this.context.basePath)})),await this.refreshCatalog(r)},{action:`uninstall`,confirm:()=>mt({title:C(`pluginsPage.removeConfirmTitle`,{name:r}),message:C(`pluginsPage.removeConfirmMessage`),confirmLabel:C(`pluginsPage.remove`),danger:!0})})}render(){let e=this.accessBlockedReason(this.result?.mutationAllowed);return Ss({mcpLogin:this.mcpLogin.render(),mcpLoginBusy:this.mcpLogin.busy,canMcpLogin:Ne(this.gateway.snapshot,`mcp.authLogin`,`operator.admin`),help:this.help,context:this.context,routeData:this.routeData,surface:this.surface,connected:this.gateway.connected,loading:this.loading,result:this.result,error:this.error,query:this.query,settingsTab:this.settingsTab,busy:this.busy,messages:this.messages,detail:this.detail,pageNotice:this.pageNotice,iconUrls:this.iconUrls,catalogIconUrls:this.catalogIconUrls,iconLoading:this.icons.installed.isLoading,catalogIconLoading:this.icons.catalog.isLoading,catalogDetail:this.catalogDetail,installedDetailTab:this.installedDetailTab,canMutate:this.canMutate(),mutationBlockedReason:e,canEditConfig:this.canEditConfig(),discovery:this.discovery,consentController:this.consentController,renderCredential:this.settings.render,skillPreview:this.skillPreview,actions:{startMcpLogin:e=>void this.mcpLogin.start(e),selectHubTab:e=>this.selectHubTab(e),closeCatalogDetail:()=>this.closeCatalogDetail(),retryCatalogDetail:()=>void this.showCatalogDetail(this.catalogDetail?.id??null),installCatalogEntry:e=>void this.installCatalogEntry(e),openSkill:e=>void this.skillPreview.open(e),openTool:e=>this.skillPreview.openTool(this.detail?.tools?.find(t=>t.name===e)??{name:e}),setQuery:e=>{this.query=e},refreshCatalog:()=>void this.refreshCatalog(),openPluginSettings:e=>{this.context.navigate(`plugin-settings`,{pathname:e?re(e,this.context.basePath):D(`plugin-settings`,this.context.basePath),search:``})},handlePluginIconError:e=>this.icons.installed.handleError(e),updateEnabled:(e,t,n)=>void this.consentController.mutateInstalledPlugin(e,t?`enable`:`disable`,n),uninstall:(e,t)=>void this.uninstall(e,t),patchConfig:(e,t)=>this.settings.patch(e,t),removeConfig:e=>this.settings.patch(e,void 0),reloadConfig:()=>{this.pluginConfigEditPending=!1;let e=this.context.runtimeConfig;e.discardDraft({reloadOnly:!0}).then(()=>e.ensureSchemaLoaded())},retryConfigRead:()=>{this.context.runtimeConfig.refresh(),this.context.runtimeConfig.refreshSchema()},retryConfigWrite:()=>{this.context.runtimeConfig.retry()},closeSettingsDetail:e=>{this.detail=null,this.installedDetailTab=`readme`,this.context.navigate(e,{pathname:D(e,this.context.basePath)})},retrySettingsDetail:e=>void this.showDetails(e),selectInstalledDetailTab:e=>{this.installedDetailTab=e,this.context.navigate(this.surface===`discovery`?`plugins`:`plugin-settings`,Rn(this.routeData?.location,e===`configuration`))},selectSettingsTab:e=>{this.settingsTab=e,this.context.replace(`plugin-settings`,{pathname:D(`plugin-settings`,this.context.basePath),search:e===`advanced`?`?tab=advanced`:``})}}})}},P([Le({context:he,subscribe:!0})],$.prototype,`context`,void 0),P([M({attribute:!1})],$.prototype,`routeData`,void 0),P([M({attribute:!1})],$.prototype,`surface`,void 0),P([N()],$.prototype,`result`,void 0),P([N()],$.prototype,`error`,void 0),P([N()],$.prototype,`query`,void 0),P([N()],$.prototype,`settingsTab`,void 0),P([N()],$.prototype,`busy`,void 0),P([N()],$.prototype,`messages`,void 0),P([N()],$.prototype,`detail`,void 0),P([N()],$.prototype,`iconUrls`,void 0),P([N()],$.prototype,`catalogIconUrls`,void 0),P([N()],$.prototype,`pageNotice`,void 0),P([N()],$.prototype,`catalogDetail`,void 0),P([N()],$.prototype,`installedDetailTab`,void 0),customElements.get(`zero-plugins-page`)||customElements.define(`zero-plugins-page`,$)})))()}ws();
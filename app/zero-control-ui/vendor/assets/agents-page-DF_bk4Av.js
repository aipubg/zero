import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ai as t,Bi as n,Gs as r,Gu as i,Ic as a,Ii as o,Js as s,Ki as c,Lc as l,Li as u,Ni as d,Nu as f,Pu as p,Qu as m,Ri as h,Ui as g,W as _,Wu as ee,_l as te,al as v,ba as ne,bl as y,bu as b,cl as x,fu as re,g as S,gl as ie,h as ae,hl as oe,ju as C,kl as w,lc as T,ll as E,m as D,ml as O,ol as se,p as k,pl as ce,qi as A,sl as le,uu as ue,vl as de,xl as j,xu as M,yl as fe,yu as N,z as pe,zi as me,zl as he,zu as P}from"./control-ui-core-DCNBgr3X.js";import{$n as ge,Aa as _e,Ai as ve,Ba as ye,Fi as be,Kr as xe,bo as Se,ca as Ce,dn as we,er as Te,fn as Ee,go as De,ki as Oe,la as ke,or as Ae,qr as je,sa as F,sr as Me,ua as Ne,wo as Pe,za as Fe}from"./control-ui-core-DwX5Mpz4.js";import{A as Ie,E as Le,G as I,J as L,M as Re,P as ze,W as R,X as Be,Z as Ve,at as z,c as He,i as Ue,k as We,l as Ge,o as Ke,q as qe,rt as B,s as Je}from"./lit-runtime-B40xFCK_.js";import{c as Ye,l as Xe}from"./gateway-runtime-JSfC8ThO.js";import{Ca as Ze,Jt as Qe,Qt as $e,Sa as et,Xt as tt,tn as nt,un as rt,yn as it}from"./control-ui-boot-shared-BX8huZUb.js";import{Do as at,Er as ot,Mt as st,Ni as ct,Nr as lt,Pr as ut,Ur as dt,Wr as ft,Zr as V,ci as pt,go as mt,jo as ht,jt as gt,wa as _t,xo as vt,yo as yt}from"./ui-AaV6iNVa.js";import{D as bt,O as xt,T as St,st as Ct,u as wt}from"./control-ui-boot-shared-E4pYPcWx.js";import{n as Tt,t as Et}from"./control-ui-boot-shared-4Y4EIRNw.js";import{$ as Dt,$n as Ot,B as H,Fi as kt,I as U,Li as At,R as jt,Si as Mt,Ti as Nt,U as Pt,W as Ft,Y as W,Z as It,_n as Lt,a as Rt,an as zt,bt as Bt,ct as Vt,er as Ht,hn as Ut,i as Wt,ir as Gt,l as Kt,m as qt,mn as Jt,nr as Yt,o as Xt,on as Zt,p as Qt,q as G,r as $t,rr as en,tr as tn,tt as nn,u as rn,ut as an,vn as on,vt as sn}from"./control-ui-boot-shared-ZuP0LiFD.js";import{An as cn,Cn as ln,Ml as un,Nl as dn,Sn as fn,Tn as pn,a as mn,d as hn,kn as gn,l as _n,o as vn,qo as yn,s as bn,xn}from"./control-ui-boot-shared-CzJHozXQ.js";import{it as Sn}from"./control-ui-boot-shared-D2GHitQ4.js";import{n as Cn,t as wn}from"./en-settings-6vMW9YZk.js";import"./control-ui-boot-chat-styles-BcslGtWC.js";import{c as Tn,l as En,o as Dn,t as On}from"./github-identity-view-yg2qfM06.js";import{a as kn,c as An,i as jn,n as Mn,r as Nn,s as Pn,t as Fn}from"./skills-grouping-BnmPZrfV.js";import{a as In,c as Ln,i as Rn,n as zn,o as Bn,r as Vn,s as Hn}from"./tool-catalog-beZkVDiX.js";import{n as Un,t as Wn}from"./decision-model-picker-C4xt5xf0.js";function Gn(e){e.agentFilesList=null,e.agentFilesError=null,e.agentFileActive=null,e.agentFileEditors={},e.agentFileConflict=null,e.agentFileWriteRevisions.clear(),e.agentFilesLoading=!1,e.agentFileSaving=!1}function Kn(e,t){let n=e.agentFileEditors[t];return!!(n&&(Object.hasOwn(n,`content`)||Object.hasOwn(n,`draft`)))}function qn(e){let t=Object.entries(e.agentFileEditors).filter(([t,n])=>Object.hasOwn(n,`draft`)&&(n.draft!==n.content||e.agentFileConflict===t));return t.length===0?null:{editors:Object.fromEntries(t.map(([e,{draft:t,version:n}])=>[e,{draft:t,version:n}])),active:e.agentFileActive,conflict:e.agentFileConflict}}async function K(e,t,n,r){let i=r.kind===`write`,a=i?`agentFileSaving`:`agentFilesLoading`,o=e.client,s=e.agents;if(!o||!e.connected||e[a]||i&&!Kn(e,n))return!1;if(r.kind===`read`&&!r.force&&Object.hasOwn(e.agentFileEditors[n]??{},`content`))return!0;let c=e.requestGeneration,l=()=>e.client===o&&e.agents===s&&e.connected&&e.requestGeneration===c,u=()=>{e.agentFileWriteRevisions.set(n,(e.agentFileWriteRevisions.get(n)??0)+1)};i&&u();let d=e.agentFileWriteRevisions.get(n),f=()=>l()&&(i||e.agentFileWriteRevisions.get(n)===d),p=e.agentFileEditors[n]?.version,m=r.kind===`read`?r.resolution:void 0;e[a]=!0,e.agentFilesError=null;try{let a=await o.request(i?`agents.files.set`:`agents.files.get`,{agentId:t,name:n,...r.kind===`write`?{content:r.content,...p&&(`hash`in p?{expectedHash:p.hash}:{expectedMissing:!0})}:{}});if(a?.file&&f()){let t=r.kind===`write`?r.content:a.file.content??``,o=e.agentFileEditors[n]??{},c=a.file.missing?{missing:!0}:a.file.hash?{hash:a.file.hash}:void 0,l=m===`draft`||!Object.hasOwn(o,`draft`)||o.draft===t||!i&&o.draft===o.content,u=i||m!==void 0||l;return e.agentFileEditors={...e.agentFileEditors,[n]:{content:t,draft:l?t:o.draft,baseVersion:c,version:u?c:o.version}},u&&e.agentFileConflict===n&&(e.agentFileConflict=null),e.agentFilesError=null,s.recordFile(a),!0}}catch(t){return f()&&(e.agentFilesError=N(t),t instanceof ge&&_t(t.details)&&t.details.type===`agent_file_conflict`&&(e.agentFileConflict=n)),!1}finally{l()&&(i&&u(),e[a]=!1)}return!1}function Jn(e,t,n,r){return K(e,t,n,{kind:`read`,force:r?.force})}function Yn(e,t,n,r){return K(e,t,n,{kind:`write`,content:r})}function Xn(e,t){let n=e.agentFileEditors[t];n&&Object.hasOwn(n,`content`)&&(e.agentFileEditors={...e.agentFileEditors,[t]:{...n,draft:n.content??``,version:n.baseVersion}},e.agentFileConflict===t&&(e.agentFileConflict=null,e.agentFilesError=null))}function Zn(e,t,n){return K(e,t,n,{kind:`read`,force:!0,resolution:`draft`})}async function Qn(e,t,n,r){let i=e.client,a=e.agents,o=e.requestGeneration;return!await K(e,t,n,{kind:`read`,force:!0,resolution:`hash`})||!e.connected||e.client!==i||e.agents!==a||e.requestGeneration!==o?!1:await K(e,t,n,{kind:`write`,content:r})}function $n(){return($n=e((()=>{Te(),M()})))()}function er(e){return e?e.length<=or?{ok:!0,dataUrl:e}:lr:cr}function tr(e,t){return k(t),new Promise(t=>{let n=new FileReader;n.addEventListener(`load`,()=>t(er(typeof n.result==`string`?n.result:null))),n.addEventListener(`error`,()=>t(cr)),n.readAsDataURL(e)})}function nr(e,t){return e.startsWith(`data:${t}`)&&e.length<=or}function rr(e,t,n){let{data:r}=e.getImageData(0,0,t,n);for(let e=3;e<r.length;e+=4)if(r[e]!==255)return!1;return!0}async function ir(e,t){if(k(t),!e.type.startsWith(`image/`)||e.size>2097152)return cr;try{let n=await createImageBitmap(e);try{let r=document.createElement(`canvas`),i=r.getContext(`2d`);if(!i)return await tr(e,t);let a=e=>{let t=Math.min(1,e/Math.max(n.width,n.height));r.width=Math.max(1,Math.round(n.width*t)),r.height=Math.max(1,Math.round(n.height*t)),i.clearRect(0,0,r.width,r.height),i.drawImage(n,0,0,r.width,r.height)};a(ar);let o=r.toDataURL(`image/webp`,.8);if(o.startsWith(`data:image/webp`))return er(o);if(rr(i,r.width,r.height)){let e=r.toDataURL(`image/jpeg`,.85);if(nr(e,`image/jpeg`))return{ok:!0,dataUrl:e}}for(let e of sr){a(e);let t=r.toDataURL(`image/png`);if(nr(t,`image/png`))return{ok:!0,dataUrl:t}}return lr}finally{n.close()}}catch{return tr(e,t)}}var ar,or,sr,cr,lr;function ur(){return(ur=e((()=>{ot(),D(),ar=96,or=16e3,sr=[ar,64,48],cr={ok:!1,reason:`unusable`},lr={ok:!1,reason:`too-detailed`}})))()}function dr(e){q.delete(e),e.identityDraft={name:null,emoji:null,avatar:null},e.identitySaving=!1,e.identityError=null}function fr(e,t,n){e.identityDraft={...e.identityDraft,[t]:n},e.identityError=null}function pr(e,t,n){let r=Symbol(`avatar-selection`);if(q.set(e,r),!S(n)){e.identityError=ae();return}ir(t,n).then(t=>{if(q.get(e)===r){if(!S(n)){e.identityError=ae();return}t.ok?(e.identityDraft={...e.identityDraft,avatar:t.dataUrl},e.identityError=null):e.identityError=P(hr[t.reason])}}).catch(t=>{q.get(e)===r&&(e.identityError=N(t))})}async function mr(e){let{host:t,expectedClient:r,agentId:i,agents:a,agentIdentity:o,runtimeConfig:s}=e,c=t.identityDraft,l=c.name?.trim(),u=c.emoji?.trim(),d=c.avatar??void 0;if(!(c.name!==null&&!l||c.emoji!==null&&!u)){if(!l&&!u&&!d){dr(t);return}t.identitySaving=!0,t.identityError=null;try{d&&k(e.config);let c=await s.runExternalMutation(t=>{if(t!==r)throw Error(`Connection changed before the agent identity update started.`);return d&&k(e.config),n(t,{agentId:i,name:l,emoji:u,avatar:d})},{canDispatch:e.canDispatch,dispatchError:`Access changed before the agent identity update started.`});if(!c.ok)throw Error(c.error);let f=c.refresh.ok?[]:[c.refresh.error];o.invalidate([i]);for(let[e,t]of[[()=>a.refreshList(),`agent list`],[()=>o.ensure([i]),`identity`]])try{await e()}catch(e){f.push(`Agent identity was saved, but the ${t} refresh failed: ${N(e)}`)}e.isCurrent()&&(dr(t),e.onSaved(),t.identityError=f.length>0?f.join(` `):null)}catch(n){e.isCurrent()&&(t.identityError=N(n))}finally{e.isCurrent()&&(t.identitySaving=!1)}}}var hr,q;function gr(){return(gr=e((()=>{p(),o(),M(),D(),ur(),hr={unusable:`agents.identity.imageUnusable`,"too-detailed":`agents.identity.imageTooDetailed`},q=new WeakMap})))()}function _r(e){return{onModelChange:(t,n)=>{if(e.canUpdate(t)){let r=e.getRuntimeConfig(),i=r.agentEntry(t,{ensure:!!n});i&&vr(r,[...i.path,`model`],n,yr(i.entry.model).fallbacks),e.onPrimaryChanged()}},onDecisionModelChange:(t,n)=>{if(e.canUpdate(t)){let r=e.getRuntimeConfig(),i=r.agentEntry(t,{ensure:n!==null});if(i){let e=[...i.path,`decisionModel`];n===null?r.removeFormValue(e):r.patchForm(e,n)}}},onModelFallbacksChange:(t,n)=>{if(e.canUpdate(t)){let r=e.getRuntimeConfig(),i=r.agentEntry(t,{ensure:!0});i&&vr(r,[...i.path,`model`],yr(i.entry.model).primary,vt(n))}}}}function vr(e,t,n,r){!n&&!r?e.removeFormValue(t):e.patchForm(t,n&&r?{primary:n,fallbacks:r}:n||{fallbacks:r})}function yr(e){if(typeof e==`string`)return{primary:e.trim()||null,fallbacks:null};if(e&&typeof e==`object`){let t=e;return{primary:typeof t.primary==`string`&&t.primary.trim()||null,fallbacks:Array.isArray(t.fallbacks)?t.fallbacks:null}}return{primary:null,fallbacks:null}}function br(){return(br=e((()=>{mt()})))()}function xr(e,t,n){let r=t?.canonicalLocation;if(!r)return``;let i=`${t.location.pathname}${t.location.search}${t.location.hash}`;return n!==i&&e.replace(`agents`,r),i}function Sr(e,t,n,r){n!==t&&e.navigate(`agents`,{pathname:Se(t,r===`overview`?null:r,e.basePath)})}function Cr(e,t,n,r){t&&r!==n&&e.navigate(`agents`,{pathname:Se(t,r,e.basePath)})}function wr(){return(wr=e((()=>{De(),m()})))()}var Tr;function Er(){return(Er=e((()=>{$n(),gr(),Tr=class{constructor(e,t){this.host=e,this.resetSelection=t,this.files=new Map,this.profileId=null,this.identity=null}observeGateway(e){if(e.phase!==`connected`)return;let t=e.selfUser?.id??null;t!==this.profileId&&(this.identity=null,dr(this.host),this.profileId=t)}select(e){let{host:t}=this,{selectedId:n,intentRevision:r,awaitingRoster:i,profileId:a}=e;if(this.identity?.intentRevision!==r&&(this.identity=null),n===t.agentsSelectedId)return;if(t.agentsSelectedId){let e=qn(t);e&&this.files.set(t.agentsSelectedId,e),this.identity=!n&&i&&Object.values(t.identityDraft).some(e=>e!==null)?{agentId:t.agentsSelectedId,profileId:this.profileId,intentRevision:r,draft:t.identityDraft}:null}if(t.agentsSelectedId=n,this.resetSelection(),n){let e=this.identity;this.identity=null,e?.agentId===n&&e.profileId===a&&(t.identityDraft=e.draft)}let o=n?this.files.get(n):void 0;o&&n&&(this.files.delete(n),t.agentFileEditors=o.editors,t.agentFileActive=o.active,t.agentFileConflict=o.conflict)}clear(){this.files.clear(),this.identity=null}}})))()}async function Dr(e,t){let n=e.client;if(!n||!e.connected||e.agentSkillsLoading)return;let r=e.requestGeneration,i=()=>e.client===n&&e.connected&&e.requestGeneration===r;e.agentSkillsLoading=!0,e.agentSkillsError=null;try{let r=await ne(n,t);r&&i()&&(e.agentSkillsReport=r,e.agentSkillsAgentId=t)}catch(t){i()&&(e.agentSkillsError=N(t))}finally{i()&&(e.agentSkillsLoading=!1)}}function Or(e){let t=new Set(e.configured??e.report?.agentSkillFilter??e.report?.skills.filter(e=>e.name&&!Pn(e)).map(e=>e.name)??[]);return e.enabled?t.add(e.skillName):t.delete(e.skillName),[...t]}async function kr(e,t,n=()=>!0){let r=e.agentEntry(t);if(!r||!Array.isArray(r.entry.skills)||!n())return!1;let i=r.path[2];return typeof i==`string`&&e.patch({raw:{agents:{entries:{[i]:{skills:null}}}},note:`Reset agent skills to inherited defaults`,replacePaths:[`agents.entries.${i}.skills`],canDispatch:n})}function Ar(e){return{onToggle:(t,n,r)=>{if(!e.canUpdate(t))return;let i=e.getRuntimeConfig().agentEntry(t,{ensure:!0});i&&n.trim()&&e.getRuntimeConfig().patchForm([...i.path,`skills`],Or({configured:O(y(e.getRuntimeConfig().state),t),report:e.getReport(),skillName:n.trim(),enabled:r}))},onDisableAll:t=>{if(!e.canUpdate(t))return;let n=e.getRuntimeConfig().agentEntry(t,{ensure:!0});n&&e.getRuntimeConfig().patchForm([...n.path,`skills`],[])}}}function jr(){return(jr=e((()=>{E(),j(),M(),kn()})))()}function Mr(e){let t=(t,n,r)=>{if(!e.canUpdate(t))return;let i=e.getRuntimeConfig(),a=i.agentEntry(t,{ensure:r});if(a)for(let[e,t]of Object.entries(n)){let n=[...a.path,`tools`,e];t===void 0?i.removeFormValue(n):i.patchForm(n,t)}};return{onProfileChange:(e,n,r)=>t(e,{profile:n||void 0,...r?{allow:void 0}:{}},!!(n||r)),onOverridesChange:(e,n,r)=>t(e,{alsoAllow:n.length?n:void 0,deny:r.length?r:void 0},n.length>0||r.length>0)}}function Nr(e,t){if(!(e instanceof HTMLElement))return;let n=P(t?`agents.files.collapsePreview`:`agents.files.expandPreview`);e.classList.toggle(`is-fullscreen`,t),e.setAttribute(`aria-pressed`,String(t)),e.setAttribute(`aria-label`,n),e.closest(`zero-tooltip`)?.setAttribute(`content`,n)}function Pr(e){e.querySelector(`.md-preview-dialog__panel`)?.classList.remove(`fullscreen`),Nr(e.querySelector(`.md-preview-expand-btn`),!1),e.classList.remove(`fullscreen`)}function Fr(){return(Fr=e((()=>{p()})))()}var Ir,Lr;function Rr(){return(Rr=e((()=>{R(),Je(),ze(),je(),Ir=class extends Ie{constructor(...e){super(...e),this.show=e=>{e.target===this.modal&&this.isConnected&&this.content&&this.setValue(this.content())}}render(e,t){return qe}update(e,[t,n]){if(!this.modal){let t=e.parentNode;if(!(t instanceof xe))throw Error(`Agent file preview must be a modal child`);this.modal=t,t.addEventListener(`wa-show`,this.show)}let r=!this.scope||t.some((e,t)=>e!==this.scope?.[t]);return this.scope=t,this.content=n,r||this.modal.isConnected&&this.modal.open?n():qe}disconnected(){this.modal?.removeEventListener(`wa-show`,this.show)}reconnected(){this.modal?.addEventListener(`wa-show`,this.show)}},Lr=Re(Ir)})))()}function zr(e){let t=e.conflictName;return t?L`<div class="callout danger">
    <span>${e.error??P(`agents.files.conflictHint`)}</span>
    <div class="agent-file-actions">
      <button
        class="btn btn--sm"
        type="button"
        ?disabled=${e.busy}
        @click=${()=>e.onReload(t)}
      >
        ${P(`common.reload`)}
      </button>
      <button
        class="btn btn--sm"
        type="button"
        ?disabled=${e.busy||!e.canWrite}
        @click=${()=>e.onOverwrite(t)}
      >
        ${P(`agents.files.overwrite`)}
      </button>
    </div>
  </div>`:e.error?L`<div class="callout danger">${e.error}</div>`:I}function Br(){return(Br=e((()=>{R(),p()})))()}function J(e,t,n){return L`
    <button class="btn btn--sm" ?disabled=${t} @click=${n}>${e}</button>
  `}function Vr(e){return L`<dl class="settings-kv">
    ${e.map(e=>e?L`<dt>${P(e[0])}</dt>
            <dd>${e[1]}</dd>`:I)}
  </dl>`}function Y(){return(Y=e((()=>{R(),p()})))()}function Hr(e){let t=e.split(`.`).pop()?.trim().toLowerCase();return t===`md`||t===`markdown`?P(`agents.files.markdownPreview`):t?P(`agents.files.extensionPreview`,{ext:t.toUpperCase()}):P(`agents.files.preview`)}function Ur(e,t){let n=e.trim(),r=t?.trim();return n?r&&n===r?`.`:r&&n.startsWith(`${r}/`)?n.slice(r.length+1)||`.`:T(n):``}function Wr(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`preview`}function Gr(e,t,n=!1){return L`
    <div class="md-preview-dialog__chip" data-priority=${n?`secondary`:`essential`}>
      <strong>${e}</strong>
      <span>${t}</span>
    </div>
  `}function Kr(e,t=!1){let n=e.currentTarget;if(!(n instanceof HTMLElement))return;let r=n.closest(`zero-modal-dialog`);if(r){if(t){let e=r.closest(`.settings-group`)?.querySelector(`.agent-file-textarea`);r.setReturnFocusTarget(e??null)}r.hide(),Pr(r)}}function qr(e){let t=e.agentFilesList?.agentId===e.agentId?e.agentFilesList:null,n=t?.files??[],r=e.agentFileActive??null,i=e=>e.missing&&e.expectedAbsent===!0&&e.name!==r,a=n.filter(e=>!i(e)),o=n.filter(i),s=r?n.find(e=>e.name===r)??null:null,c=r&&e.agentFileConflict===r?r:null,l=s?.missing&&!c,u=r?Kn(e,r):!1,d=r?e.agentFileEditors[r]:void 0,f=!!(d&&Object.hasOwn(d,`content`)),p=d?.content??``,m=d?.draft??p,h=u&&(!f||m!==p);return L`
    ${zr({error:e.agentFilesError,conflictName:c,busy:e.agentFilesLoading||e.agentFileSaving,canWrite:e.canWrite,onReload:e.onFileReload,onOverwrite:e.onFileOverwrite})}
    ${W({title:P(`agents.files.coreFilesTitle`),description:t?L`${P(`agents.files.coreFilesSubtitle`)} ${P(`agents.files.workspace`)}:
              <code>${t.workspace}</code>`:P(`agents.files.coreFilesSubtitle`),actions:L`
          ${J(e.agentFilesLoading?P(`common.loading`):P(`common.refresh`),e.agentFilesLoading,()=>e.onLoadFiles(e.agentId))}
        `},t?n.length===0?H(P(`agents.files.empty`)):L`
              <div class="agents-panel-body">
                <div class="agent-file-tabs">
                  ${qt({id:`agent-files`,active:r,tabs:a.map(t=>({value:t.name,label:t.name.replace(/\.md$/i,``),badge:t.missing&&t.expectedAbsent!==!0&&t.name!==c?P(`agents.files.missing`):void 0,disabled:e.agentFilesLoading})),ariaLabel:P(`agents.files.coreFilesTitle`),panelId:`agent-file-panel`,variant:`sub`,onSelect:e.onSelectFile})}
                  ${o.length===0?I:L`
                          <select
                            class="agent-tab-add"
                            aria-label=${P(`agents.files.addFile`)}
                            .value=${``}
                            ?disabled=${e.agentFilesLoading}
                            @change=${t=>{let n=t.currentTarget;if(!(n instanceof HTMLSelectElement))return;let r=n.value;n.value=``,r&&e.onSelectFile(r)}}
                          >
                            <option value="">${P(`agents.files.addFile`)}</option>
                            ${o.map(e=>L`<option value=${e.name}>
                                  ${e.name.replace(/\.md$/i,``)}
                                </option>`)}
                          </select>
                        `}
                </div>
                <div
                  id="agent-file-panel"
                  role="tabpanel"
                  aria-labelledby=${r?`agent-files-tab-${r}`:I}
                >
                  ${s?L`
                          <div class="agent-file-header">
                            <div>
                              <div class="agent-file-sub mono">${s.path}</div>
                            </div>
                            <div class="agent-file-actions">
                              <button
                                class="btn btn--sm"
                                ?disabled=${!u}
                                @click=${e=>{let t=e.currentTarget;t instanceof HTMLElement&&t.closest(`.settings-group`)?.querySelector(`zero-modal-dialog`)?.show()}}
                              >
                                ${F.eye} ${P(`agents.files.preview`)}
                              </button>
                              ${J(P(`common.reset`),!e.canWrite||!f||!h,()=>e.onFileReset(s.name))}
                              <button
                                class="btn btn--sm primary"
                                ?disabled=${!e.canWrite||!u||e.agentFileSaving||!h}
                                @click=${()=>e.onFileSave(s.name)}
                              >
                                ${e.agentFileSaving?P(`common.saving`):P(`common.save`)}
                              </button>
                            </div>
                          </div>
                          ${l?L`<div class="callout info">
                                  ${s.expectedAbsent===!0?P(`agents.files.createHint`):P(`agents.files.missingHint`)}
                                </div>`:I}
                          <label class="field agent-file-field">
                            <span>${P(`agents.files.content`)}</span>
                            <textarea
                              class="agent-file-textarea"
                              ?disabled=${!e.canWrite||!u}
                              placeholder=${u?I:e.agentFilesLoading?P(`common.loading`):P(`agents.files.loadHint`)}
                              .value=${m}
                              @input=${t=>{t.currentTarget instanceof HTMLTextAreaElement&&e.onFileDraftChange(s.name,t.currentTarget.value)}}
                            ></textarea>
                          </label>
                          <zero-modal-dialog
                            class="agent-file-preview"
                            manual
                            label=${s.name}
                            style="--zero-modal-width: min(1040px, calc(100vw - 32px));"
                            @modal-cancel=${e=>{e.currentTarget instanceof HTMLElement&&Pr(e.currentTarget)}}
                          >
                            ${Lr([e.agentId,s.name,u],()=>{let e=Bt(m,{codeBlockChrome:`none`,mode:`document`}),n=x(new TextEncoder().encode(m).length),r=m.trim(),i=r?r.split(/\s+/).length:0,a=m.length===0?0:m.split(/\r?\n/).length,o=i<=0?P(`agents.files.emptyDraft`):P(`agents.files.minRead`,{count:String(Math.max(1,Math.round(i/220)))}),u=Ur(s.path,t?.workspace),d=`agent-file-preview-title-${Wr(s.name)}`,[f,p]=l?[P(`agents.files.willCreateOnSave`),`is-missing`]:h||c?[P(`agents.files.liveDraftPreview`),`is-dirty`]:[P(`agents.files.savedPreview`),`is-synced`],g=s?.updatedAtMs?P(`agents.files.updated`,{time:pe(s.updatedAtMs)}):P(l?`agents.files.notCreatedYet`:`agents.files.updatedUnknown`);return L`<div class="md-preview-dialog__panel">
                                  <div class="md-preview-dialog__header">
                                    <div class="md-preview-dialog__header-main">
                                      <div class="md-preview-dialog__eyebrow">
                                        ${F.scrollText}
                                        <span>${Hr(s.name)}</span>
                                      </div>
                                      <div class="md-preview-dialog__title-wrap">
                                        <div
                                          id=${d}
                                          class="md-preview-dialog__title"
                                          translate="no"
                                        >
                                          ${s.name}
                                        </div>
                                        <div class="md-preview-dialog__path mono" translate="no">
                                          ${u}
                                        </div>
                                      </div>
                                    </div>
                                    <div class="md-preview-dialog__actions">
                                      <zero-tooltip .content=${P(`agents.files.expandPreview`)}>
                                        <button
                                          type="button"
                                          class="btn btn--sm md-preview-icon-btn md-preview-expand-btn"
                                          aria-label=${P(`agents.files.expandPreview`)}
                                          aria-pressed="false"
                                          @click=${e=>{let t=e.currentTarget;if(!(t instanceof HTMLElement))return;let n=t.closest(`.md-preview-dialog__panel`);if(!n)return;let r=n.classList.toggle(`fullscreen`);t.closest(`zero-modal-dialog`)?.classList.toggle(`fullscreen`,r),Nr(t,r)}}
                                        >
                                          <span class="when-normal" aria-hidden="true"
                                            >${F.maximize}</span
                                          ><span class="when-fullscreen" aria-hidden="true"
                                            >${F.minimize}</span
                                          >
                                        </button>
                                      </zero-tooltip>
                                      ${[[`editFile`,F.edit,!0],[`closePreview`,F.x,!1]].map(([e,t,n])=>L`
                                          <zero-tooltip .content=${P(`agents.files.${e}`)}>
                                            <button
                                              type="button"
                                              class="btn btn--sm md-preview-icon-btn"
                                              aria-label=${P(`agents.files.${e}`)}
                                              @click=${e=>Kr(e,n)}
                                            >
                                              <span aria-hidden="true">${t}</span>
                                            </button>
                                          </zero-tooltip>
                                        `)}
                                    </div>
                                  </div>
                                  <div class="md-preview-dialog__meta">
                                    <div
                                      class="md-preview-dialog__chip ${p}"
                                      data-priority="essential"
                                    >
                                      <strong>${f}</strong>
                                    </div>
                                    ${Gr(o,P(`agents.files.words`,{count:String(i)}))}
                                    ${Gr(a,P(`agents.files.lines`),!0)}
                                    ${Gr(n,g)}
                                  </div>
                                  <div class="md-preview-dialog__body">
                                    <article class="md-preview-dialog__reader sidebar-markdown">
                                      ${bt(e)}
                                    </article>
                                  </div>
                                </div> `})}
                          </zero-modal-dialog>
                        `:L`<div class="muted">${P(`agents.files.selectFile`)}</div>`}
                </div>
              </div>
            `:H(P(`agents.files.loadHint`)))}
  `}function Jr(){return(Jr=e((()=>{R(),St(),Qt(),Ce(),sn(),je(),be(),U(),p(),E(),_(),Fr(),Rr(),Br(),$n(),Y()})))()}var Yr,Xr,Zr,X;function Qr(){return(Qr=e((()=>{wt(),R(),Ve(),Le(),Tt(),p(),st(),f(),ke(),Vt(),Yr=[`🦞`,`🚀`,`✨`,`🐬`,`🦊`,`🤖`,`🌻`,`🧠`,`🎨`,`📚`,`🌍`,`⚡`,`🔥`,`🌈`,`🦉`,`🐙`,`🌙`,`🎯`,`💡`,`🧪`,`🎵`,`💜`,`🌟`,`🐱`],Xr=Object.entries(Et).map(([e,t])=>({name:e,emoji:t})),Zr=Yr.map(e=>Xr.find(t=>t.emoji===e)??{name:e,emoji:e}),X=class extends C{constructor(...e){super(...e),this.value=``,this.disabled=!1,this.onSelect=()=>void 0,this.query=``,this.triggerId=`agent-emoji-trigger-${gt()}`}select(e){!this.disabled&&e.trim()&&(this.onSelect(e.trim()),this.querySelector(`wa-popover`)?.hide())}render(){let e=this.query.trim().toLowerCase().replaceAll(` `,`_`),t=e?Xr.filter(({name:t,emoji:n})=>t.includes(e)||n===e).slice(0,96):Zr,n=new Set,r=t.filter(({emoji:e})=>!n.has(e)&&n.add(e));return L`
      <button
        id=${this.triggerId}
        type="button"
        class="agent-emoji-picker__trigger"
        aria-label=${P(`agents.identity.chooseEmoji`)}
        ?disabled=${this.disabled}
      >
        <span class="agent-emoji-picker__icon" aria-hidden="true"
          >${Ne(Be`<circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01M15 9h.01" />`)}</span
        >
      </button>
      <wa-popover
        ${We(an)}
        class="agent-emoji-picker__popover"
        for=${this.triggerId}
        placement="bottom-end"
        without-arrow
        @wa-hide=${e=>{e.target===e.currentTarget&&(this.query=``)}}
      >
        <div class="agent-emoji-picker__panel">
          <input
            class="agent-emoji-picker__search"
            type="search"
            autofocus
            aria-label=${P(`agents.identity.searchEmoji`)}
            placeholder=${P(`agents.identity.searchEmoji`)}
            .value=${this.query}
            @input=${e=>{e.currentTarget instanceof HTMLInputElement&&(this.query=e.currentTarget.value)}}
          />
          <div
            class="agent-emoji-picker__grid"
            role="group"
            aria-label=${P(`agents.identity.emoji`)}
          >
            ${r.length?r.map(({emoji:e,name:t})=>L`<button
                      type="button"
                      class="agent-emoji-picker__choice"
                      aria-label=${t.replaceAll(`_`,` `)}
                      aria-pressed=${String(this.value===e)}
                      title=${t.replaceAll(`_`,` `)}
                      @click=${()=>this.select(e)}
                    >
                      ${e}
                    </button>`):L`<span class="agent-emoji-picker__empty"
                    >${P(`agents.identity.noEmojiMatches`)}</span
                  >`}
          </div>
        </div>
      </wa-popover>
    `}},V([z()],X.prototype,`value`,void 0),V([z({type:Boolean})],X.prototype,`disabled`,void 0),V([z({attribute:!1})],X.prototype,`onSelect`,void 0),V([B()],X.prototype,`query`,void 0),customElements.get(`zero-agent-emoji-picker`)||customElements.define(`zero-agent-emoji-picker`,X)})))()}function $r(){return ti+=1,`zero-multi-select-${ti}`}function ei(e){let t=e.indexOf(`/`);return t>0?e.slice(0,t):void 0}var ti,ni,Z;function ri(){return(ri=e((()=>{xt(),pt(),mt(),R(),Ve(),Ue(),Le(),p(),f(),on(),Ce(),Mt(),Jt(),ti=0,ni=e=>e.preventDefault(),Z=class extends C{constructor(...e){super(...e),this.options=[],this.value=[],this.isExcluded=()=>!1,this.getValueKey=e=>e,this.placeholder=``,this.accessibleLabel=``,this.allowCustom=!1,this.disabled=!1,this.onChange=()=>{},this.onOpen=()=>{},this.open=!1,this.query=``,this.activeIndex=0,this.listboxId=$r(),this.field=null,this.input=null,this.setField=e=>{this.field=e instanceof HTMLElement?e:null},this.setInput=e=>{this.input=e instanceof HTMLInputElement?e:null},this.configurePopup=e=>{e instanceof Ct&&this.field&&(Lt(e,this.field,`bottom`),e.sync=`width`)},this.handleFieldClick=e=>{this.disabled||e.target instanceof Element&&e.target.closest(`button`)||(this.input?.focus(),this.openMenu())},this.handleInput=e=>{e.currentTarget instanceof HTMLInputElement&&(this.query=e.currentTarget.value,this.activeIndex=0,this.openMenu())},this.handleKeydown=e=>{if(!(this.disabled||e.isComposing))switch(e.key){case`ArrowDown`:case`ArrowUp`:{if(e.preventDefault(),!this.open){this.openMenu();return}let t=this.rows(),n=t.flatMap((e,t)=>e.disabled?[]:[t]);if(n.length>0){let r=n.indexOf(this.activeRowIndex(t)),i=e.key===`ArrowDown`?1:n.length-1;this.activeIndex=ct(n[(r+i)%n.length],`selectable option index`)}return}case`Enter`:{if(!this.open)return;let t=this.rows(),n=t[this.activeRowIndex(t)];n&&(e.preventDefault(),this.selectRow(n));return}case`,`:this.allowCustom&&(e.preventDefault(),this.commitTypedQuery());return;case`Escape`:this.open&&(e.preventDefault(),e.stopPropagation(),this.closeMenu());return;case`Backspace`:!this.query&&this.value.length>0&&(e.preventDefault(),this.removeAt(this.value.length-1))}},this.handleFocusOut=e=>{let t=e.relatedTarget;t instanceof Node&&this.contains(t)||this.closeMenu()}}willUpdate(e){e.has(`disabled`)&&this.disabled&&this.open&&this.closeMenu(),this.open&&(e.has(`options`)||e.has(`value`)||e.has(`isExcluded`)||e.has(`getValueKey`))&&(this.activeIndex=Math.min(this.activeIndex,Math.max(0,this.rows().length-1)))}updated(e){if(!this.open||![`open`,`query`,`activeIndex`,`options`,`value`,`isExcluded`,`getValueKey`].some(t=>e.has(t)))return;let t=this.querySelector(`.multi-select__menu`),n=t?.querySelector(`[aria-selected="true"]`);t&&n&&Ut(t,n)}optionFor(e){let t=this.getValueKey(e);return this.options.find(e=>this.getValueKey(e.value)===t)}rows(){let e=new Set(this.value.map(e=>this.getValueKey(e))),t=this.query.trim(),n=this.getValueKey(t),r=t.toLowerCase(),i=[],a=null;for(let t of this.options){let o=this.getValueKey(t.value);if(e.has(o)||this.isExcluded(t.value))continue;if(o===n){a=t;continue}let s=[t.label,t.value,t.provider,t.detail];(!r||s.some(e=>e?.toLowerCase().includes(r)))&&i.push(t)}return a?i.unshift(a):this.allowCustom&&t&&!e.has(n)&&!this.isExcluded(t)&&i.push({value:t,label:t,provider:ei(t),custom:!0}),i}openMenu(){this.disabled||this.open||(this.open=!0,this.activeIndex=0,this.onOpen())}activeRowIndex(e){let t=e[this.activeIndex];return t&&!t.disabled?this.activeIndex:e.findIndex(e=>!e.disabled)}closeMenu(){this.open=!1,this.query=``,this.activeIndex=0}commit(e){if(this.disabled)return;let t=new Set(this.value.map(e=>this.getValueKey(e))),n=[];for(let r of e){let e=r.trim(),i=this.getValueKey(e);e&&!t.has(i)&&!this.isExcluded(e)&&!this.optionFor(e)?.disabled&&(t.add(i),n.push(e))}n.length>0&&this.onChange([...this.value,...n]),this.query=``,this.activeIndex=0}commitTypedQuery(){this.commit(yt(this.query))}selectRow(e){e.disabled||(e.custom?this.commitTypedQuery():this.commit([e.value]))}removeAt(e){this.disabled||(this.onChange(this.value.filter((t,n)=>n!==e)),this.input?.focus())}renderChip(e,t){let n=this.optionFor(e),r=n?.provider??ei(e),i=n?.label??e;return L`
      <span class="chip multi-select__chip" data-value=${e} title=${e}>
        ${r?Nt(r,{className:`multi-select__chip-icon`}):I}
        <span class="multi-select__chip-label">${i}</span>
        <button
          type="button"
          class="chip-remove"
          aria-label=${P(`common.multiSelect.remove`,{value:i})}
          ?disabled=${this.disabled}
          @click=${()=>this.removeAt(t)}
        >
          ${F.x}
        </button>
      </span>
    `}render(){let e=this.open?this.rows():[],t=this.activeRowIndex(e),n=this.accessibleLabel||this.placeholder;return L`
      <div
        class=${this.open?`multi-select multi-select--open`:`multi-select`}
        ?data-disabled=${this.disabled}
        @click=${this.handleFieldClick}
        @focusout=${this.handleFocusOut}
        ${We(this.setField)}
      >
        ${this.value.map((e,t)=>this.renderChip(e,t))}
        <input
          ${We(this.setInput)}
          class="multi-select__input"
          type="text"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          aria-label=${n}
          aria-expanded=${this.open?`true`:`false`}
          aria-controls=${this.listboxId}
          aria-autocomplete="list"
          aria-activedescendant=${t>=0?`${this.listboxId}-${t}`:I}
          placeholder=${this.value.length===0?this.placeholder:``}
          .value=${Ke(this.query)}
          ?disabled=${this.disabled}
          @input=${this.handleInput}
          @keydown=${this.handleKeydown}
        />
        <span class="multi-select__chevron" aria-hidden="true">${F.chevronDown}</span>
      </div>
      <wa-popup class="multi-select__popup" ?active=${this.open} ${We(this.configurePopup)}>
        <div class="multi-select__menu" role="listbox" id=${this.listboxId} aria-label=${n}>
          ${e.map((e,n)=>L`
              <div
                class="multi-select__option"
                role="option"
                id=${`${this.listboxId}-${n}`}
                aria-selected=${n===t?`true`:`false`}
                aria-disabled=${e.disabled?`true`:`false`}
                data-value=${e.value}
                ?data-custom=${!!e.custom}
                @mousedown=${ni}
                @mousemove=${()=>{!e.disabled&&this.activeIndex!==n&&(this.activeIndex=n)}}
                @click=${()=>this.selectRow(e)}
              >
                ${e.provider?Nt(e.provider,{className:`multi-select__option-icon`}):I}
                <span class="picker-select__copy">
                  <span class="picker-select__label">
                    ${e.custom?P(`common.multiSelect.addCustom`,{value:e.value}):e.label}
                  </span>
                  ${e.detail?L`<span class="picker-select__description">${e.detail}</span>`:I}
                </span>
              </div>
            `)}
          ${e.length===0?L`<div class="multi-select__empty">${P(`common.multiSelect.noMatches`)}</div>`:I}
        </div>
      </wa-popup>
    `}},V([z({attribute:!1})],Z.prototype,`options`,void 0),V([z({attribute:!1})],Z.prototype,`value`,void 0),V([z({attribute:!1})],Z.prototype,`isExcluded`,void 0),V([z({attribute:!1})],Z.prototype,`getValueKey`,void 0),V([z({attribute:!1})],Z.prototype,`placeholder`,void 0),V([z({attribute:!1})],Z.prototype,`accessibleLabel`,void 0),V([z({attribute:!1})],Z.prototype,`allowCustom`,void 0),V([z({attribute:!1})],Z.prototype,`disabled`,void 0),V([z({attribute:!1})],Z.prototype,`onChange`,void 0),V([z({attribute:!1})],Z.prototype,`onOpen`,void 0),V([B()],Z.prototype,`open`,void 0),V([B()],Z.prototype,`query`,void 0),V([B()],Z.prototype,`activeIndex`,void 0)})))()}function ii(){return(ii=e((()=>{ri(),customElements.get(`zero-multi-select`)||customElements.define(`zero-multi-select`,Z)})))()}function ai(e,t=I,n){return[!1,!0].map(r=>L`
      ${r?t:I}
      <button
        type=${n??I}
        class=${r?`btn btn--sm primary`:`btn btn--sm`}
        ?disabled=${r?!e.canUpdateConfig||e.configSaving||!e.configDirty:e.configLoading}
        @click=${r?e.onConfigSave:e.onConfigReload}
      >
        ${P(r?e.configSaving?`common.saving`:`common.save`:`common.reloadConfig`)}
      </button>
    `)}function oi(){return(oi=e((()=>{R(),p()})))()}function si(e){let{agent:t,configForm:n,agentFilesList:r,configLoading:i,configSaving:a,configDirty:o,onModelChange:s,onModelFallbacksChange:c,onSelectPanel:l}=e,u=e.modelCatalogRetired||e.modelSelectionPolicy?.restricted,d=u?null:n,f=u?{...t,model:e.modelSelectionPolicy?.defaultModel?{primary:e.modelSelectionPolicy.defaultModel}:void 0}:t,p=v(f,d,r,e.defaultId,e.agentIdentity),m=p.isDefault,h=P(`agents.overview.primaryModel${m?`Default`:``}`),g=ce(d,t.id),_=f.model,ee=de(g.entry?.model),ne=de(g.defaults?.model??_),y=de(g.defaults?.model)||(ne===`-`?null:ne)||(d?null:de(_)),b=ee??y??null,x=m?b:ee,ae=ie(g.entry?.model,g.defaults?.model)??(d?null:te(_))??[],C=!e.canUpdateConfig||!d||i||a,w=t.thinkingDefault??`-`,T=e.identityDraft,E=T.name??e.agentIdentity?.name??t.identity?.name??t.name??``,D=T.emoji??e.agentIdentity?.emoji??t.identity?.emoji??``,O=T.avatar?null:re(t,e.agentIdentity),k=T.avatar??(O?e.identityAvatarLoader.resolve(O):null),A=T.name!==null||T.emoji!==null||T.avatar!==null,ue=T.name!==null&&!T.name.trim()||T.emoji!==null&&!T.emoji.trim(),j=e.identitySaving||!e.canUpdateIdentity,M=e=>{let t=``;for(let{segment:n}of new Intl.Segmenter(void 0,{granularity:`grapheme`}).segment(e)){if(t&&t.length+n.length>8)break;if(!t&&n.length>8)return n;t+=n}return t},fe=t=>{let n=t.target,r=n.files?.[0];n.value=``,r&&S(e.applicationConfig)&&e.onIdentityAvatarSelect(r)},N=se(d,null,e.modelCatalog,t.id),pe=le(d,b,t.id);return L`
    ${W({title:P(`agents.identity.title`),description:P(`agents.identity.subtitle`)},L`
        <div class="settings-row settings-row--stacked">
          <div class="agent-identity-editor">
            <span class="agent-identity-editor__avatar" aria-hidden="true">
              ${At({id:t.id,avatar:k,textAvatar:T.emoji??oe(t,e.agentIdentity)},``,O?e.identityAvatarLoader.imageErrorHandler(O):void 0)}
            </span>
            <div class="agent-identity-editor__content">
              <div class="agent-identity-editor__fields">
                <label class="field">
                  <span>${P(`agents.identity.name`)}</span>
                  <input
                    type="text"
                    maxlength="64"
                    .value=${E}
                    placeholder=${P(`agents.identity.namePlaceholder`)}
                    ?disabled=${j}
                    @input=${t=>e.onIdentityFieldChange(`name`,t.target.value)}
                  />
                </label>
                <div class="field agent-identity-editor__emoji">
                  <span>${P(`agents.identity.emoji`)}</span>
                  <div class="agent-identity-editor__emoji-control">
                    <input
                      type="text"
                      maxlength="64"
                      aria-label=${P(`agents.identity.emoji`)}
                      .value=${D}
                      ?disabled=${j}
                      @input=${t=>{if(t.currentTarget instanceof HTMLInputElement){let n=M(t.currentTarget.value);t.currentTarget.value=n,e.onIdentityFieldChange(`emoji`,n)}}}
                    />
                    <zero-agent-emoji-picker
                      .value=${D}
                      .disabled=${j}
                      .onSelect=${t=>e.onIdentityFieldChange(`emoji`,M(t))}
                    ></zero-agent-emoji-picker>
                  </div>
                </div>
              </div>
              ${e.identityError?L`<div class="settings-row__desc" role="alert" style="color: var(--danger);">
                      ${e.identityError}
                    </div>`:I}
              <div class="agent-identity-editor__actions">
                ${S(e.applicationConfig)?L`<button
                          type="button"
                          class="btn btn--sm"
                          ?disabled=${j}
                          @click=${t=>{let n=t.currentTarget,r=n instanceof HTMLButtonElement?n.nextElementSibling:null;S(e.applicationConfig)&&r instanceof HTMLInputElement&&r.click()}}
                        >
                          ${P(k?`agents.identity.replaceImage`:`agents.identity.chooseImage`)}
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          ?disabled=${j}
                          @change=${fe}
                        />`:I}
                <button
                  type="button"
                  class="btn btn--sm primary"
                  ?disabled=${j||!A||ue||T.avatar!==null&&!S(e.applicationConfig)}
                  @click=${()=>e.onIdentitySave()}
                >
                  ${e.identitySaving?P(`common.saving`):P(`common.save`)}
                </button>
              </div>
              <div class="settings-row__desc agent-identity-editor__hint">
                ${S(e.applicationConfig)?P(`agents.identity.fileHint`):I}
              </div>
            </div>
          </div>
        </div>
      `)}
    ${W({title:P(`agents.overview.title`),description:P(`agents.overview.subtitle`)},Vr([[`agents.context.workspace`,L`
            <zero-tooltip .content=${P(`agents.context.openFilesTab`)}>
              <button
                type="button"
                class="workspace-link mono"
                @click=${()=>l(`files`)}
                aria-label=${P(`agents.context.openFilesTab`)}
              >
                ${p.workspace}
              </button>
            </zero-tooltip>
          `],[`agents.context.primaryModel`,L`<code>${p.model}</code>`],[`agents.context.runtime`,L`<code>${p.runtime}</code>`],[`agents.context.thinkingDefault`,L`<code>${w}</code>`],[`agents.context.skillsFilter`,p.skillsLabel]]))}
    ${o?L`<div class="callout warn">${P(`agents.overview.unsavedConfig`)}</div>`:I}
    ${W({title:P(`agents.overview.modelSelection`),notice:Gt({status:e.modelCatalogStatus}),actions:L` ${ai(e,I,`button`)} `},L`
        ${G({title:h,control:Xt({label:h,value:x??``,options:[{value:``,label:m?P(`agents.overview.notSet`):y?P(`agents.overview.inheritDefaultModel`,{model:y}):P(`agents.overview.inheritDefault`)},...se(d,b??void 0,e.modelCatalog,t.id)],disabled:C,onChange:e=>s(t.id,e||null),onOpen:e.onModelCatalogOpen})})}
        ${G({title:P(`chat.modelControls.decisionLabel`),description:P(`chat.modelControls.decisionAgentHelp`),control:Un({id:`agent-decision-model`,models:e.decisionModels,value:typeof g.entry?.decisionModel==`string`?g.entry.decisionModel:void 0,inherit:{model:typeof g.defaults?.decisionModel==`string`?g.defaults.decisionModel:void 0},disabled:C,onChange:n=>e.onDecisionModelChange(t.id,n),onOpen:e.onModelCatalogOpen})})}
        ${G({title:P(`agents.overview.fallbacks`),stacked:!0,control:L`
            <zero-multi-select
              class="agent-fallbacks"
              .options=${N}
              .value=${ae}
              .isExcluded=${pe}
              .getValueKey=${ut}
              .placeholder=${P(`agents.overview.addFallback`)}
              .accessibleLabel=${P(`agents.overview.fallbacks`)}
              .allowCustom=${!u}
              .disabled=${C}
              .onChange=${e=>c(t.id,e)}
              .onOpen=${e.onModelCatalogOpen}
            ></zero-multi-select>
          `})}
      `)}
  `}function ci(e,t,n){return W({title:P(`agents.context.title`),description:t},Vr([[`agents.context.workspace`,L`
          <button type="button" class="workspace-link mono" @click=${()=>n(`files`)}>
            ${e.workspace}
          </button>
        `],[`agents.context.primaryModel`,L`<code>${e.model}</code>`],[`agents.context.runtime`,L`<code>${e.runtime}</code>`],[`agents.context.identityName`,e.identityName],[`agents.context.identityAvatar`,e.identityAvatar],[`agents.context.skillsFilter`,e.skillsLabel],[`agents.context.default`,P(e.isDefault?`common.yes`:`common.no`)]]))}function li(){return(li=e((()=>{R(),lt(),Qr(),Wn(),kt(),ii(),Rt(),en(),be(),U(),p(),E(),ue(),D(),oi(),Y()})))()}function ui(e){let t=!!e.configForm&&!e.configLoading&&!e.configSaving,n=e.canUpdateConfig&&t,r=ce(e.configForm,e.agentId),i=Array.isArray(r.entry?.skills),a=O(e.configForm,e.agentId),o=new Set(a??[]),s=a!==void 0,c=!i&&s,l=e.canPatchConfig&&i&&t,u=!!(e.report&&e.activeAgentId===e.agentId),d=u?e.report?.skills??[]:[],f=ht(e.filter),p=f?d.filter(e=>ht([e.name,e.description,e.source].join(` `)).includes(f)):d,m=Fn(p),h=s?d.filter(e=>Pn(e)||o.has(e.name)).length:d.length,g=d.length;return L`
    ${e.configForm?I:L`<div class="callout info">${P(`agents.skillsPanel.loadConfig`)}</div>`}
    <div class="callout info">
      ${P(s?c?`agents.skillsPanel.inheritedAllowlist`:`agents.skillsPanel.customAllowlist`:`agents.skillsPanel.allEnabled`)}
    </div>
    ${!u&&!e.loading?L`<div class="callout info">${P(`agents.skillsPanel.loadAgent`)}</div>`:I}
    ${e.error?L`<div class="callout danger">${e.error}</div>`:I}
    ${W({title:P(`agents.skillsPanel.title`),description:L`${P(`agents.skillsPanel.subtitle`)}
        ${g>0?L`<span class="mono">${h}/${g}</span>`:I}`,actions:L`
          ${J(P(`agentTools.disableAll`),!n,()=>e.onDisableAll(e.agentId))}
          ${J(P(`common.reset`),!l,()=>e.onClear(e.agentId))}
          ${ai(e,L`
              ${J(e.loading?P(`common.loading`):P(`common.refresh`),e.loading,e.onRefresh)}
            `)}
        `},L`
        ${G({title:P(`agents.skillsPanel.filter`),description:P(`agents.skillsPanel.shown`,{count:String(p.length)}),control:L`
            <input
              class="settings-input"
              aria-label=${P(`agents.skillsPanel.filter`)}
              .value=${e.filter}
              @input=${t=>{let n=t.currentTarget;n instanceof HTMLInputElement&&e.onFilterChange(n.value)}}
              placeholder=${P(`agents.skillsPanel.searchPlaceholder`)}
              autocomplete="off"
              name="agent-skills-filter"
            />
          `})}
        ${p.length===0?H(P(`agents.skillsPanel.empty`)):L`
                <div class="agents-panel-body agent-skills-groups">
                  ${m.map(t=>L`
                      <details
                        class="agent-skills-group"
                        ?open=${!!f||t.id!==`workspace`&&t.id!==`built-in`}
                      >
                        <summary class="agent-skills-header">
                          <span>${t.label}</span>
                          <span class="muted">${t.skills.length}</span>
                        </summary>
                        <div class="list skills-grid">
                          ${t.skills.map(t=>{let r=Pn(t),i=r||!s||o.has(t.name),a=Nn(t),c=jn(t);return L`
                              <div class="settings-row agent-skill-row">
                                <div class="settings-row__text">
                                  <span class="settings-row__title"
                                    >${t.emoji?`${t.emoji} `:``}${t.name}</span
                                  >
                                  <span class="settings-row__desc">${t.description}</span>
                                  ${An({skill:t})}
                                  ${[[`agents.skillsPanel.missing`,a],[`agents.skillsPanel.reason`,c]].map(([e,t])=>t.length>0?L`<span class="settings-row__desc">
                                          ${P(e,{items:t.join(`, `)})}
                                        </span>`:I)}
                                  ${r?L`<span class="settings-row__desc">
                                          ${P(`agents.skillsPanel.learnedAlwaysOn`)}
                                        </span>`:I}
                                </div>
                                <div class="settings-row__control">
                                  ${Dt({checked:i,disabled:r||!n,ariaLabel:t.name,onChange:n=>e.onToggle(e.agentId,t.name,n)})}
                                </div>
                              </div>
                            `})}
                        </div>
                      </details>
                    `)}
                </div>
              `}
      `)}
  `}function di(){return(di=e((()=>{R(),U(),p(),wn(),E(),Mn(),kn(),oi(),Y(),Cn()})))()}function fi(e){if(!e)return[];let t=new Set([...e.channelOrder??[],...(e.channelMeta??[]).map(e=>e.id),...Object.keys(e.channelAccounts??{})]);return Array.from(t,t=>({id:t,label:e.channelMeta?.find(e=>e.id===t)?.label||(e.channelLabels?.[t]??t),accounts:e.channelAccounts?.[t]??[]}))}function pi(e){let t=0,n=0,r=0;for(let i of e){let e=i.probe&&typeof i.probe==`object`&&`ok`in i.probe?!!i.probe.ok:!1,a=typeof i.connected==`boolean`||typeof i.running==`boolean`;(i.connected===!0||i.running===!0||!a&&e)&&(t+=1),i.configured&&(n+=1),i.enabled&&(r+=1)}return{total:e.length,connected:t,configured:n,enabled:r}}function mi(e){let t=fi(e.snapshot),n=e.lastSuccess?pe(e.lastSuccess):P(`common.never`);return L`
    ${ci(e.context,P(`agents.context.configurationSubtitle`),e.onSelectPanel)}
    ${e.error?L`<div class="callout danger">${e.error}</div>`:I}
    ${e.snapshot?I:L`<div class="callout info">${P(`agents.channels.loadHint`)}</div>`}
    ${W({title:P(`agents.channels.title`),description:L`${P(`agents.channels.subtitle`)}
        ${P(`agents.channels.lastRefresh`,{time:n})}`,actions:L`
          ${J(e.loading?P(`common.refreshing`):P(`common.refresh`),e.loading,e.onRefresh)}
        `},t.length===0?H(P(`agents.channels.empty`)):t.map(t=>{let n=pi(t.accounts),r=n.total?P(`agents.channels.connectedCount`,{connected:String(n.connected),total:String(n.total)}):P(`agents.channels.noAccounts`),i=n.configured?P(`agents.channels.configuredCount`,{count:String(n.configured)}):P(`agents.channels.notConfigured`),a=n.total?P(`agents.channels.enabledCount`,{count:String(n.enabled)}):P(`common.disabled`),o=d({configForm:e.configForm,channelId:t.id,fields:gi}),s=[t.id,i,a,...o.map(e=>`${e.label}: ${e.value}`)];return G({title:t.label,description:s.join(` · `),control:L`
                ${n.configured===0?L`
                        <a
                          class="settings-row__value"
                          href="http://127.0.0.1:18789/channels"
                          target="_blank"
                          rel="noopener"
                          >${P(`agents.channels.setupGuide`)}</a
                        >
                      `:I}
                ${It({kind:n.connected>0?`ok`:n.total?`warn`:`muted`,label:r})}
              `})}))}
  `}function hi(e){return L`
    ${ci(e.context,P(`agents.context.schedulingSubtitle`),e.onSelectPanel)}
    ${e.error?L`<div class="callout danger">${e.error}</div>`:I}
    ${W({title:P(`agents.cronPanel.schedulerTitle`),description:P(`agents.cronPanel.schedulerSubtitle`),actions:L`
          ${J(e.loading?P(`common.refreshing`):P(`common.refresh`),e.loading,e.onRefresh)}
        `},L`
        ${[[P(`common.enabled`),e.status?e.status.enabled?P(`common.yes`):P(`common.no`):P(`common.na`)],[P(`agents.cronPanel.jobs`),e.scopedTotal??P(`common.na`)],[P(`agents.cronPanel.nextWake`),_n(e.status?.enabled===!1?null:e.scopedNextWakeAtMs)]].map(([e,t])=>G({title:e,control:nn(t)}))}
      `)}
    ${W({title:P(`agents.cronPanel.agentJobsTitle`),description:P(`agents.cronPanel.agentJobsSubtitle`)},e.jobs.length===0?H(P(`agents.cronPanel.noJobs`)):L`
            ${e.jobs.map(t=>{let n=[t.description,vn(t),t.sessionTarget,bn(t),mn(t)].filter(Boolean);return G({title:t.name,description:n.join(` · `),control:L`
                  ${It({kind:t.enabled?`ok`:`warn`,label:t.enabled?P(`common.enabled`):P(`common.disabled`)})}
                  <a
                    class="btn btn--sm"
                    href=${`${Pe(`cron`,e.basePath)}?job=${encodeURIComponent(t.id)}`}
                    aria-label=${P(`agents.cronPanel.editJob`,{name:t.name})}
                  >
                    ${P(`agents.cronPanel.edit`)}
                  </a>
                  ${J(P(`agents.cronPanel.runNow`),!e.canRunNow,()=>e.onRunNow(t.id))}
                `})})}
            ${Wt({jobsShown:e.jobs.length,jobsTotal:e.jobsTotal,hasMore:e.jobsHasMore,loading:e.loading,loadingMore:e.jobsLoadingMore,onLoadMore:e.onLoadMore})}
          `)}
  `}var gi;function _i(){return(_i=e((()=>{R(),De(),$t(),U(),p(),t(),_(),hn(),Y(),li(),gi=[`groupPolicy`,`streamMode`,`dmPolicy`]})))()}function vi(e){let t=e.normalize(e.raw);return t===`*`?{kind:`all`}:t.includes(`*`)?{kind:`regex`,value:RegExp(`^${Sn(t).replaceAll(`\\*`,`.*`)}$`)}:{kind:`exact`,value:t}}function yi(e){return Array.isArray(e.raw)?e.raw.map(t=>vi({raw:t,normalize:e.normalize})).filter(e=>e.kind!==`exact`||e.value):[]}function bi(e,t){for(let n of t)if(n.kind===`all`||n.kind===`exact`&&e===n.value||n.kind===`regex`&&n.value.test(e))return!0;return!1}function xi(){return(xi=e((()=>{})))()}function Si(e){return e[Ei]}function Q(e){let t=ht(e);return Ti.get(t)??t}function Ci(e){return e?e.map(Q).filter(Boolean):[]}function wi(e){let t=Ci(e),n=[];for(let e of t){let t=Object.hasOwn(Di,e)?Di[e]:void 0;if(t){n.push(...t);continue}n.push(e)}return at(n)}var Ti,Ei,Di;function Oi(){return(Oi=e((()=>{mt(),Bn(),Ti=new Map([[`bash`,`exec`],[`apply-patch`,`apply_patch`],[`cron`,`automations`]]),Ei=Symbol.for(`zero.toolAllowlistIntersection`),Di={...In}})))()}function ki(e,t=!0){if(!e)return()=>!0;let n=e.allow&&Si(e.allow);if(n){let r=n.map(n=>n.length>0?ki({...e,allow:n},t):()=>!1);return e=>r.every(t=>t(e))}let r=yi({raw:wi(e.deny??[]),normalize:Q}),i=yi({raw:wi(e.allow??[]),normalize:Q});return e=>{let n=Q(e);return!bi(n,r)&&!!(i.length===0||bi(n,i)||n===`skills_read`&&bi(`read`,i)&&!bi(`read`,r)||t&&n===`apply_patch`&&bi(`write`,i))}}function Ai(e,t=!0){let n=(e===void 0?[]:Si(e)??[[...e]]).map(e=>e.length>0?ki({allow:e},t):()=>!1);return e=>n.every(t=>t(e))}function ji(){return(ji=e((()=>{xi(),Oi()})))()}var Mi,Ni;function Pi(){return(Pi=e((()=>{i(),Mi={agentTools:{off:`Off`,unverified:`Unverified`,sessionRestricted:`Denied by this session’s tool restrictions.`,allowedByConfig:`Allowed by configuration`,unsavedAvailability:`Save your changes to refresh the preview.`,checked:`Based on`,checkedLive:`Session preview`,checkedLocal:`Local configuration`,policySources:`Policy sources`,profileInheritance:`Profile inheritance`,profileGlobal:`Global`,profileAgent:`Agent`,profileAgentOverride:`Agent override`,profileGlobalProvider:`Global provider`,profileAgentProvider:`Agent provider`,profileAgentProviderOverride:`Agent provider override`,activeProfile:`Active`}},Ni=Object.assign(()=>Object.assign(ee.agentTools,Mi.agentTools),{catalog:Mi})})))()}function Fi(e){let t=e.filter(e=>e.source===`tools.profile`||e.source.endsWith(`.tools.profile`)),n=e.filter(e=>!t.includes(e)),r=(e,t)=>L`
    <div class="agent-profile-tree__label">${t}</div>
    <div class="agent-profile-tree__details">
      <div class="agent-profile-tree__value">
        <code>${e.profile}</code>
        ${e.active?L`<span class="chip">${P(`agentTools.activeProfile`)}</span>`:I}
      </div>
      <div class="agent-profile-tree__source">
        <code
          >${e.source.split(`.`).map((e,t)=>L`${t>0?L`.<wbr />`:I}${e}`)}</code
        >
      </div>
    </div>
  `;return L`
    <ul class="agent-profile-tree" role="list">
      ${[t,n].map((e,t)=>{let n=e.find(e=>e.source.startsWith(`tools.`)),i=e.find(e=>!e.source.startsWith(`tools.`)),a=n??i;if(!a)return I;let o=t===0?``:`Provider`,s=P(`agentTools.profileGlobal${o}`),c=P(`agentTools.profileAgent${o}`),l=P(`agentTools.profileAgent${o}Override`);return L`
          <li class=${n&&i?`agent-profile-tree__branch`:``}>
            ${r(a,n?s:c)}
            ${n&&i?L`<ul role="list">
                    <li>${r(i,l)}</li>
                  </ul>`:I}
          </li>
        `})}
    </ul>
  `}function Ii(e,t,n,r){return{summary:r||P(n?`agentTools.unverified`:t?.deniedBySession?`agentTools.off`:(e&&Ri.get(e.status))??(t?`agentTools.inPreview`:`agentTools.notListed`)),reason:r?void 0:n??(t?.deniedBySession?P(`agentTools.sessionRestricted`):e?.reasons.map(e=>b(e.label)).join(` · `))}}function Li(e,t){return!e||!t?I:L`
    <div class="agent-tool-policy">
      ${Vr([[`agentTools.checked`,P(t.checked===`live-session`?`agentTools.checkedLive`:`agentTools.checkedLocal`)],e.reasons.length>0?[`agentTools.policySources`,L`${e.reasons.map(e=>L`
                  <div>
                    ${b(e.label)}${e.source?L` · <code>${e.source}</code>`:I}
                  </div>
                `)}`]:null,t.profiles.length>0?[`agentTools.profileInheritance`,Fi(t.profiles)]:null])}
    </div>
  `}var Ri;function zi(){return(zi=e((()=>{R(),p(),Pi(),M(),Y(),Ri=new Map([[`excluded`,`agentTools.off`],[`allowed`,`agentTools.allowedByConfig`],[`unavailable`,`agentTools.notListed`],[`available`,`agentTools.inPreview`]]),Ni()})))()}function Bi(e){return e.length===0?I:L`
    <div class="agent-tool-badges">
      ${e.map(e=>L`<span class="settings-row__value">${e}</span>`)}
    </div>
  `}function Vi(e,t,n){let r=t.source??e.source,i=t.pluginId??e.pluginId,a=r===`plugin`&&i?P(`agentTools.plugin`,{id:i}):P(`agentTools.builtIn`),o=[];return n&&!n.deniedBySession&&o.push(P(`agentTools.inPreview`)),(r===`core`||r===`plugin`&&i)&&o.push(a),t.optional&&o.push(P(`agentTools.optional`)),{badges:o,sourceLabel:a}}function Hi(e){let[t,n]=e.denied?[`agentTools.disabledByOverride`,`agentTools.overrideOff`]:e.allowed?e.baseAllowed?[`agentTools.enabledByProfile`,`agentTools.enabled`]:[`agentTools.enabledByOverride`,`agentTools.overrideOn`]:[`agentTools.notIncluded`,`agentTools.profileOff`];return{state:P(t),summary:P(n)}}function Ui(e){return`agent-tool-${Q(e).replace(/[^a-z0-9_-]+/g,`-`)}`}function Wi(e){let t=e.currentTarget;if(t instanceof HTMLDetailsElement&&!t.open)for(let e of t.querySelectorAll(`.agent-tool-card[open]`))e.open=!1}function Gi(e,t){let n=document.getElementById(t);if(!(n instanceof HTMLDetailsElement))return;e.preventDefault();let r=n.closest(`.agent-tools-group`);r&&(r.open=!0),n.open=!0;let i=new URL(window.location.href);i.hash=t,window.history.replaceState(null,``,i),requestAnimationFrame(()=>{n.scrollIntoView?.({block:`center`,behavior:yn()}),n.querySelector(`summary`)?.focus()})}function Ki(e){let t=e?.notices??[];return t.length===0?I:L`
    <div class="agent-tools-notices">
      ${t.map(e=>L`
          <div
            class="callout ${e.severity===`warning`?`warning`:`info`}"
            style="margin-top: 12px"
          >
            ${b(e.message)}
          </div>
        `)}
    </div>
  `}function qi(e){return e.source===`plugin`?e.pluginId?P(`agentTools.plugin`,{id:e.pluginId}):P(`agentTools.pluginSource`):e.source===`channel`?e.channelId?P(`agentTools.channelSource`,{id:e.channelId}):P(`agentTools.channel`):e.source===`mcp`?`MCP`:P(`agentTools.builtIn`)}function Ji(e){let t=ce(e.configForm,e.agentId),n=t.entry?.tools??{},r=t.globalTools??{},i=n.profile??r.profile??`full`,a=Vn(e.toolsCatalogResult),o=Rn(e.toolsCatalogResult),s=n.profile?P(`agentTools.profileSourceAgent`):r.profile?P(`agentTools.profileSourceGlobal`):P(`agentTools.profileSourceDefault`),c=Array.isArray(n.allow)&&n.allow.length>0,l=Array.isArray(r.allow)&&r.allow.length>0,u=e.toolsCatalogLoading&&!e.toolsCatalogResult&&!e.toolsCatalogError,d=e.canUpdateConfig&&!!e.configForm&&!e.configLoading&&!e.configSaving&&!c&&!u,f=c?[]:Array.isArray(n.alsoAllow)?n.alsoAllow:[],p=Array.isArray(n.deny)?n.deny:[],m=c?[]:p,h=c?{allow:n.allow??[],deny:p}:Hn(i),g=o.flatMap(e=>e.tools.map(e=>e.id)),_=ki(h),ee=Ai(f),te=Ai(m,!1),v=e=>{let t=_(e),n=ee(e),r=te(e);return{allowed:(t||n)&&!r,baseAllowed:t,denied:r}},ne=g.filter(e=>v(e).allowed).length,y=e.runtimeSessionMatchesSelectedAgent?e.toolsEffectiveLoading?{status:`previewLoading`,empty:`loadingPreview`}:e.toolsEffectiveError?{status:`previewUnavailable`,empty:`previewError`}:e.toolsEffectiveResult?null:{status:`previewNotLoaded`,empty:`previewNotLoaded`}:{status:`otherAgent`,empty:`switchAgent`},b=y?P(`agentTools.${y.status}`):null,x=b?null:e.toolsEffectiveResult,re=b??(e.configDirty?P(`agentTools.unsavedAvailability`):null),S=re?null:x?.toolAccess??null,ie=new Map(S?.tools.map(e=>[Q(e.id),e])),ae=(x?.groups??[]).flatMap(e=>e.tools),oe=new Map,C=new Map;for(let e of ae){let t=Q(e.id);oe.set(t,e),e.deniedBySession||C.set(t,e)}let w=[...C.values()],T=w.slice(0,Yi),E=w.length-T.length,D=e=>e.toSorted((e,t)=>Number(C.has(Q(t.id)))-Number(C.has(Q(e.id)))||Number(v(t.id).allowed)-Number(v(e.id).allowed)||e.label.localeCompare(t.label)),O=(t,n)=>{let r=new Set(Ci(f)),i=new Set(Ci(m));for(let e of t){let t=v(e).baseAllowed,a=Q(e);n?(i.delete(a),t||r.add(a)):(r.delete(a),i.add(a))}e.onOverridesChange(e.agentId,[...r],[...i])},se=y?y.status===`previewLoading`?Pt({label:P(`agentTools.${y.empty}`),rows:2}):H(P(`agentTools.${y.empty}`)):w.length===0?H(P(`agentTools.emptyPreview`)):L`
          <div class="agents-panel-body">
            <div class="agent-tools-runtime">
              ${T.map(e=>{let t=Ui(e.id);return L`
                  <a
                    class="agent-tools-runtime-chip"
                    href="#${t}"
                    @click=${e=>Gi(e,t)}
                  >
                    <span class="mono" translate="no">${e.label}</span>
                    <span class="agent-tools-runtime-chip__meta"
                      >${qi(e)}</span
                    >
                  </a>
                `})}
              ${E>0?L`
                      <span
                        class="agent-tools-runtime-chip agent-tools-runtime-chip--more"
                        title=${P(`agentTools.morePreviewTitle`,{count:String(E)})}
                      >
                        ${P(`agentTools.morePreview`,{count:String(E)})}
                      </span>
                    `:I}
            </div>
          </div>
        `;return L`
    ${[[!e.configForm,`agentTools.loadConfig`],[c,`agentTools.explicitAllowlist`],[l,`agentTools.globalAllowlist`],[e.toolsCatalogError,`agentTools.catalogFallback`]].map(([e,t])=>e?L`<div class="callout info">${P(t)}</div>`:I)}
    ${W({title:P(`agentTools.title`),description:L`${P(`agentTools.subtitle`)}
          <span class="mono"
            >${P(`agentTools.enabledSummary`,{enabled:String(ne),total:String(g.length)})}</span
          >`,actions:L`
          ${[!0,!1].map(e=>J(P(e?`agentTools.enableAll`:`agentTools.disableAll`),!d,()=>O(g,e)))}
          ${ai(e)}
        `},L`
        ${Vr([[`agentTools.profile`,L`<code>${i}</code>`],[`agentTools.source`,s],[`agentTools.enabled`,L`<code>${ne}/${g.length}</code>`],[`agentTools.listed`,L`<code>${b??w.length}</code>`],[`agentTools.status`,P(e.configSaving?`agentTools.statusSaving`:e.configDirty?`agentTools.statusUnsaved`:`agentTools.statusSaved`)]])}
        ${G({title:P(`agentTools.quickPresets`),stacked:!0,control:L`
            <div class="agent-tools-buttons">
              ${a.map(t=>L`
                  <button
                    class="btn btn--sm ${i===t.id?`active`:``}"
                    ?disabled=${!d}
                    @click=${()=>e.onProfileChange(e.agentId,t.id,!0)}
                  >
                    ${t.label}
                  </button>
                `)}
              ${J(P(`agentTools.inherit`),!d,()=>e.onProfileChange(e.agentId,null,!1))}
            </div>
          `})}
      `)}
    ${W({title:P(`agentTools.previewTitle`),description:L`${P(`agentTools.previewSubtitle`)}
          <span class="mono">${e.runtimeSessionKey||P(`agentTools.noSession`)}</span>`},L`${Ki(x)}${se}`)}
    ${Dn(e.githubIdentity,e.onOpenGitHubConnections)}
    ${W({title:P(`agentTools.catalogTitle`)},L`
        ${u?Pt({label:P(`agentTools.loadingCatalog`)}):I}
        <div class="agents-panel-body agent-tools-grid" ?hidden=${u}>
          ${o.map(e=>{let t=D(e.tools),n=e.tools.filter(e=>v(e.id).allowed).length,r=e.tools.filter(e=>C.has(Q(e.id))).length,i=t.slice(0,4),a=t.length-i.length;return L`
              <details class="agent-tools-group" @toggle=${Wi}>
                <summary class="agent-tools-group__summary">
                  <span class="agent-tools-group__summary-main">
                    <span class="agent-tools-group__title">
                      ${e.label}
                      ${e.source===`plugin`&&e.pluginId?L`<span class="settings-row__value"
                              >${P(`agentTools.plugin`,{id:e.pluginId})}</span
                            >`:I}
                    </span>
                    <span
                      class="agent-tools-group__preview"
                      aria-label=${P(`agentTools.toolPreview`)}
                    >
                      ${i.map(e=>L`<span class="mono" translate="no" title=${e.label}
                            >${e.label}</span
                          >`)}
                      ${a>0?L`<span
                              >${P(`agentTools.more`,{count:String(a)})}</span
                            >`:I}
                    </span>
                  </span>
                  <span class="agent-tools-group__counts">
                    ${[[`tools`,e.tools.length],[`enabledTools`,n],[`listedTools`,r]].map(([e,t])=>e===`listedTools`&&t===0?I:L`<span
                            >${P(`agentTools.${e}${t===1?`One`:``}`,{count:String(t)})}</span
                          >`)}
                  </span>
                </summary>
                <div class="agent-tools-list">
                  ${t.map(t=>{let n=Ui(t.id),r=v(t.id),i=oe.get(Q(t.id))??null,a=t.defaultProfiles??[],{badges:o,sourceLabel:s}=Vi(e,t,i),c=Hi(r),l=ie.get(Q(t.id))??null,{summary:u,reason:f}=Ii(l,i,re,b);return L`
                      <details class="agent-tool-card" id=${n}>
                        <summary class="agent-tool-summary">
                          <div class="agent-tool-summary__main">
                            <div class="agent-tool-summary__title-row">
                              <span class="agent-tool-title mono" translate="no"
                                >${t.label}</span
                              >
                            </div>
                            <div class="agent-tool-sub">${t.description}</div>
                          </div>
                          <dl class="agent-tool-summary__facts">
                            <div class="agent-tool-summary__fact">
                              <dt class="label">${P(`agentTools.access`)}</dt>
                              <dd>${c.summary}</dd>
                            </div>
                            <div class="agent-tool-summary__fact">
                              <dt class="label">${P(`agentTools.previewTitle`)}</dt>
                              <dd>
                                ${u}
                                ${f?L`<div class="muted">${f}</div>`:I}
                              </dd>
                            </div>
                          </dl>
                          <div class="agent-tool-summary__badges">
                            ${Bi(o)}
                          </div>
                          <span
                            class="agent-tool-toggle"
                            @click=${e=>e.stopPropagation()}
                            @keydown=${e=>e.stopPropagation()}
                          >
                            ${Dt({checked:r.allowed,disabled:!d,ariaLabel:P(r.allowed?`agentTools.disableNamed`:`agentTools.enableNamed`,{name:t.label}),onChange:e=>O([t.id],e)})}
                          </span>
                        </summary>
                        <div class="agent-tool-details">
                          <div class="agent-tool-details-strip">
                            <div class="agent-tool-detail agent-tool-detail--inline">
                              <div class="label">${P(`agentTools.access`)}</div>
                              <div>${c.state}</div>
                            </div>
                            <div class="agent-tool-detail agent-tool-detail--inline">
                              <div class="label">${P(`agentTools.source`)}</div>
                              <div>${s}</div>
                            </div>
                            ${a.length>0?L`
                                    <div class="agent-tool-detail agent-tool-detail--inline">
                                      <div class="label">${P(`agentTools.defaultPresets`)}</div>
                                      ${Bi(a)}
                                    </div>
                                  `:I}
                            <div class="agent-tool-detail agent-tool-detail--inline">
                              <div class="label">${P(`agentTools.previewTitle`)}</div>
                              <div>
                                ${re??(i?.deniedBySession?P(`agentTools.sessionRestricted`):i?P(`agentTools.previewVia`,{source:qi(i)}):f||u)}
                              </div>
                            </div>
                            <a class="agent-tool-jump" href="#${n}">
                              ${P(`agentTools.linkTool`)}
                            </a>
                          </div>
                          ${Li(l,S)}
                        </div>
                      </details>
                    `})}
                </div>
              </details>
            `})}
        </div>
      `)}
  `}var Yi;function Xi(){return(Xi=e((()=>{R(),ji(),Oi(),U(),On(),p(),wn(),E(),zn(),M(),oi(),Y(),zi(),Cn(),Yi=12})))()}function Zi(){return L`
    <section class="content-header" ${Me({toolbarHeader:!0})}>
      <div>
        <div class="page-title">${ye(`agents`)}</div>
        <div class="page-subtitle">
          ${Fe(`agents`)} ${jt($i)}
        </div>
      </div>
    </section>
  `}function Qi(e){let t=y(e.config),n=e.agentsList?.agents??[],r=e.agentsList?.selectionRequired?null:e.agentsList?.defaultId??null,i=e.selectedAgentId,a=i?n.find(e=>e.id===i)??null:null,o=i&&e.agentSkills.activeAgentId===i?e.agentSkills.report?.skills?.length??null:null,s=e.channels.snapshot?Object.keys(e.channels.snapshot.channelAccounts??{}).length:null,c=i?e.cron.jobsTotal:null,l={files:e.agentFiles.agentFilesList?.files?.length??null,skills:o,channels:s,cron:c||null};return L`
    <div class="agents-layout">
      <section class="agents-toolbar">
        <div class="agents-toolbar-row">
          <div class="agents-toolbar-actions">
            ${e.access.canCreateAgent?L`
                    <button
                      class="btn btn--sm btn--ghost agents-create-btn"
                      ?disabled=${e.loading}
                      @click=${e.onCreateAgent}
                    >
                      ${P(`custodian.newAgent`)}
                    </button>
                  `:I}
            ${a?L`
                    ${Ge(a.id,L`
                        <button
                          type="button"
                          class="btn btn--sm btn--ghost"
                          @click=${e=>void zt(e,a.id,P(`agents.copyId`))}
                        >
                          <span data-copy-label>${P(`agents.copyId`)}</span>
                        </button>
                      `)}
                    <button
                      type="button"
                      class="btn btn--sm btn--ghost"
                      ?disabled=${!e.access.canUpdateConfig||!!(r&&a.id===r)}
                      @click=${()=>e.onSetDefault(a.id)}
                    >
                      ${r&&a.id===r?P(`agents.default`):P(`agents.setDefault`)}
                    </button>
                    <button
                      type="button"
                      class="btn btn--sm btn--ghost"
                      @click=${()=>e.onTogglePinnedAgent(a.id)}
                    >
                      ${e.pinnedAgentIds.includes(a.id)?P(`agents.unpinFromSwitcher`):P(`agents.pinToSwitcher`)}
                    </button>
                  `:I}
            <button
              class="btn btn--sm agents-refresh-btn"
              ?disabled=${e.loading}
              @click=${e.onRefresh}
            >
              ${e.loading?P(`common.loading`):P(`common.refresh`)}
            </button>
          </div>
        </div>
        ${e.error?L`<div class="callout danger" style="margin-top: 8px;">${e.error}</div>`:I}
      </section>
      <section class="agents-main">
        <div class="settings-group">
          ${Ft({title:P(`agents.defaults.title`),description:P(`agents.defaults.description`),onClick:e.onOpenAgentDefaults})}
        </div>
        ${a?L`
                ${qt({id:`agents`,active:e.activePanel,tabs:[[`overview`,`agents.tabs.overview`],[`files`,`agents.tabs.files`],[`tools`,`agents.tabs.tools`],[`skills`,`agents.tabs.skills`],[`channels`,`agents.tabs.channels`],[`cron`,`agents.tabs.cronJobs`],[`memory`,`agents.tabs.memory`]].map(([e,t])=>({value:e,label:P(t),count:l[e]})),ariaLabel:P(`tabs.agents`),panelId:`agent-panel`,onSelect:e.onSelectPanel})}
                <div
                  id="agent-panel"
                  class="settings-stack"
                  role="tabpanel"
                  aria-labelledby=${`agents-tab-${e.activePanel}`}
                >
                  ${e.config.lastError?L`<div class="callout danger" role="alert">
                          ${e.config.lastError}
                        </div>`:I}
                  ${(n=>{let i={configForm:t,configLoading:e.config.configLoading,configSaving:e.config.configSaving,configDirty:e.config.configFormDirty,canUpdateConfig:e.access.canUpdateConfig,onConfigReload:e.onConfigReload,onConfigSave:e.onConfigSave};switch(e.activePanel){case`overview`:return Ge(n.id,si({...e.overview,...i,agent:n,defaultId:r,agentFilesList:e.agentFiles.agentFilesList,agentIdentity:e.agentIdentityById[n.id]??null,canUpdateIdentity:e.access.canUpdateIdentity,onSelectPanel:e.onSelectPanel}));case`files`:return qr({...e.agentFiles,agentId:n.id,canWrite:e.access.canWriteFiles});case`tools`:return Ji({...e.tools,...i,agentId:n.id});case`skills`:return ui({...e.agentSkills,...i,agentId:n.id,canPatchConfig:e.access.canPatchConfig});case`channels`:case`cron`:{let i=v(n,t,e.agentFiles.agentFilesList,r,e.agentIdentityById[n.id]??null);return e.activePanel===`channels`?mi({...e.channels,context:i,configForm:t,onSelectPanel:e.onSelectPanel}):hi({...e.cron,basePath:e.basePath,context:i,canRunNow:e.access.canRunCron,onSelectPanel:e.onSelectPanel})}case`memory`:return L`
          <div class="settings-group agent-memory-import-row">
            ${Ft({title:P(`tabs.memory`),description:P(`subtitles.memory`),onClick:()=>e.onOpenMemorySettings?.()})}
            ${Ft({title:P(`tabs.memoryImport`),description:P(`subtitles.memoryImport`),onClick:()=>e.onOpenMemoryImport?.()})}
          </div>
          <zero-agent-memory-panel .agentId=${n.id}></zero-agent-memory-panel>
        `}return I})(a)}
                </div>
              `:W({title:P(`agents.selectTitle`)},H(P(`agents.selectSubtitle`)))}
      </section>
    </div>
  `}var $i;function ea(){return(ea=e((()=>{R(),He(),_e(),Ae(),Zt(),Qt(),U(),Ln(),p(),E(),j(),Jr(),li(),di(),_i(),Xi(),$i=`http://127.0.0.1:18789/concepts/multi-agent`})))()}var $,ta,na;function ra(){return(ra=e((()=>{ft(),R(),Ve(),De(),we(),ve(),en(),Kt(),En(),p(),E(),o(),m(),j(),tt(),r(),Xe(),Ze(),xn(),w(),dn(),f(),l(),$n(),gr(),br(),wr(),Er(),jr(),ea(),$=class extends C{constructor(...e){super(...e),this.agentsList=null,this.agentsSelectedId=null,this.toolsCatalogLoading=!1,this.toolsCatalogLoadingAgentId=null,this.toolsCatalogError=null,this.toolsCatalogResult=null,this.toolsEffectiveLoading=!1,this.toolsEffectiveLoadingKey=null,this.toolsEffectiveResultKey=null,this.toolsEffectiveError=null,this.toolsEffectiveResult=null,this.chatModelCatalogStatus=tn(),this.chatModelCatalogPending=null,this.chatModelCatalogRequest=null,this.agentFilesLoading=!1,this.agentFilesError=null,this.agentFilesList=null,this.agentFileEditors={},this.agentFileConflict=null,this.agentFileActive=null,this.agentFileSaving=!1,this.agentFileWriteRevisions=new Map,this.agentIdentityLoading=!1,this.identityDraft={name:null,emoji:null,avatar:null},this.selectionDrafts=new Tr(this,()=>this.resetSelectionState()),this.identityAvatarLoader=new et(this),this.identitySaving=!1,this.identityError=null,this.agentSkillsLoading=!1,this.agentSkillsError=null,this.agentSkillsReport=null,this.agentSkillsAgentId=null,this.skillsFilter=``,this.cron=Qe(),this.routeDataInitialized=!1,this.applyingRouteSelection=!1,this.routeSelectionSuperseded=!1,this.boundSources=new Set,this.chatModelCatalogSubscription=null,this.normalizedLocation=``,this.githubProfileId=null,this.configEditor={getRuntimeConfig:()=>this.context.runtimeConfig,canUpdate:e=>e===this.agentsSelectedId&&this.canCall(`config.set`,`operator.admin`)},this.githubIdentity=new Tn({requestUpdate:()=>this.requestUpdate(),runExternalMutation:(e,t)=>this.context.runtimeConfig.runExternalMutation(e,t)}),this.gateway=new un(this,{getGateway:()=>this.context?.gateway,onIdentityChange:()=>this.resetForSourceChange(),invalidateRequests:e=>{e.identityChanged||(this.invalidateTransientRequests(),this.resetModelCatalog())},onSnapshot:({snapshot:e,becameAvailable:t,becameConnected:n})=>{if(this.selectionDrafts.observeGateway(e),this.syncGatewayState(),t&&!n){let e=this.chatModelCatalogSubscription;Promise.resolve(this.chatModelCatalogPending).then(()=>{let t=this.gateway.snapshot,n=this.chatModelCatalogStatus;e?.isCurrent()&&t&&s(t)&&(n.awaitingGateway||n.error!==null)&&this.ensureModelCatalog({refresh:!0})})}},ensureInitialData:()=>this.ensureInitialData()}),this.subscriptions=new a(this).watchStore(()=>this.context?.config).watch(()=>this.client,gn).effect(()=>this.context?.settingsAgentSelection,e=>(this.syncSettingsSelection(),e.subscribe(()=>{if(this.context.settingsAgentSelection!==e)return;let t=this.agentsSelectedId;this.syncSettingsSelection();let n=this.agentsSelectedId,r=this.context.router.getState();!this.applyingRouteSelection&&this.routeDataInitialized&&this.routeData&&n&&r.matches[0]?.routeId===`agents`&&(!r.pendingMatches.length||r.pendingMatches[0]?.routeId===`agents`)&&Sr(this.context,n,t,this.agentsPanel),this.loadActivePanelData(),this.requestUpdate()}))).effect(()=>this.context?.agents,this.observeSource(`agents`,(e,t)=>{t&&this.resetForSourceChange(),this.syncAgentState(e),this.ensureInitialData()},e=>{this.syncAgentState(e),this.ensureAgentIdentities(),this.loadActivePanelData()})).effect(()=>this.context?.agentIdentity,this.observeSource(`agentIdentity`,(e,t)=>{t&&this.invalidateTransientRequests(),this.ensureAgentIdentities(),this.ensureInitialData()})).watchStore(()=>this.context?.channels).watchStore(()=>this.context?.navigation).watchStore(()=>this.context?.runtimeConfig).effect(()=>this.context?.sessions,this.observeSource(`sessions`,(e,t)=>{t&&(this.invalidateTransientRequests(),A(this),this.loadActivePanelData())},()=>{c(this)}))}get modelCatalog(){return pn(this.connected?this.client:null,this.agentsSelectedId)}observeSource(e,t,n){return r=>{let i=this.boundSources.has(e);this.boundSources.add(e),t(r,i);let a=!0,o=r.subscribe(()=>{a&&this.context[e]===r&&(n?.(r),this.requestUpdate())});return()=>{o(),a=!1}}}get sessions(){return this.context.sessions}get agents(){return this.context.agents}get client(){return this.gateway.client}get connected(){return this.gateway.connected}get requestGeneration(){return this.gateway.epoch}get sessionsResult(){return this.context.sessions.state.result}get sessionKey(){return this.context.gateway.snapshot.sessionKey}get agentsPanel(){return this.routeData?.panel??`overview`}disconnectedCallback(){this.githubIdentity.dispose(),this.subscriptions.clear(),super.disconnectedCallback()}willUpdate(e){e.has(`routeData`)&&(this.applyRouteData(),this.syncCanonicalLocation(),this.ensureInitialData())}syncGatewayState(){(this.cron.client!==this.client||this.cron.connected!==this.connected)&&(this.cron={...this.cron,client:this.client,connected:this.connected})}canCall(e,t){return Ye(this.context?.gateway?.snapshot,e,t)}syncAgentState(e=this.context.agents){let t=e.state;this.agentsList=t.agentsList?fe(t.agentsList):null,this.syncSettingsSelection(),this.syncCurrentAgentFiles(e)}syncSettingsSelection(){let e=this.context.settingsAgentSelection;this.selectionDrafts.select({selectedId:e.state.selectedId,intentRevision:e.intentRevision,awaitingRoster:!e.state.selectedId&&!this.context.agents.state.agentsList,profileId:this.context.gateway.snapshot.selfUser?.id??null})}syncCurrentAgentFiles(e=this.context.agents){let t=this.agentsSelectedId;if(!t||this.agentsPanel!==`files`)return;let n=e.files(t);n.list&&(this.agentFilesList=n.list,this.selectDefaultAgentFile(t))}async selectDefaultAgentFile(e,t=!1){let n=this.agentFilesList?.files??[];(!this.agentFileActive||!n.some(e=>e.name===this.agentFileActive))&&(this.agentFileActive=n.find(e=>e.name===`AGENTS.md`)?.name??null),this.agentFileActive&&await Jn(this,e,this.agentFileActive,{force:t})}resetForSourceChange(){this.selectionDrafts.clear(),this.agentsList=null,this.agentsSelectedId=null,this.resetSelectionState()}invalidateTransientRequests(){this.gateway.invalidate(),this.agentFilesLoading=!1,this.agentFileSaving=!1,this.identitySaving=!1,this.agentIdentityLoading=!1,this.agentSkillsLoading=!1,this.toolsCatalogLoading=!1,this.toolsCatalogLoadingAgentId=null,A(this),this.cron={...this.cron,cronLoading:!1,cronJobsLoadingMore:!1,cronJobsReloadPending:!1,cronJobsReloadPendingTableFilters:!1,cronRunsLoadingMore:!1,cronBusy:!1}}applyRouteData(){let e=this.routeData;if(!e){this.routeDataInitialized=!1;return}this.routeDataInitialized=!0,this.gateway.isRouteDataCurrent(e)&&e.agentsList&&(this.agentsList=e.agentsList);let t=this.context.settingsAgentSelection,n=e.settingsAgentSelection===t&&e.selectionIntentRevision===t.intentRevision;if(this.routeSelectionSuperseded=!n,e.requestedAgentId&&n){this.applyingRouteSelection=!0;try{t.set(e.requestedAgentId)}finally{this.applyingRouteSelection=!1}}this.syncSettingsSelection(),!n&&e.requestedAgentId&&this.agentsSelectedId&&this.context.replace(`agents`,{...e.canonicalLocation??e.location,pathname:Se(this.agentsSelectedId,e.panel===`overview`?null:e.panel,this.context.basePath)})}syncCanonicalLocation(){this.routeSelectionSuperseded||(this.normalizedLocation=xr(this.context,this.routeData,this.normalizedLocation))}chatAgentId(){return he(this.sessionKey)?.agentId??this.context.gateway.snapshot.assistantAgentId??this.agentsList?.defaultId??`main`}ensureInitialData(){if(this.connected&&this.client&&this.routeDataInitialized&&this.routeData){if(!this.context.runtimeConfig.state.configSnapshot&&!this.context.runtimeConfig.state.configLoading&&this.context.runtimeConfig.ensureLoaded(),!this.agentsList&&!this.context.agents.state.agentsLoading){this.refreshAgents(`ensure`);return}this.ensureAgentIdentities(),this.loadActivePanelData()}}isCurrentRequest(e,t,n,r){return this.client===e&&this.connected&&this.requestGeneration===t&&(!r.agents||this.context.agents===r.agents)&&(!r.agentIdentity||this.context.agentIdentity===r.agentIdentity)&&(!n||this.agentsSelectedId===n)}ensureAgentIdentities(){let e=this.client,t=this.context.agentIdentity,n=this.agentsList?.agents.map(e=>e.id).filter(e=>!t.get(e))??[];if(!e||!this.connected||n.length===0||this.agentIdentityLoading)return;let r=this.requestGeneration;this.agentIdentityLoading=!0,t.ensure(n).catch(()=>void 0).finally(()=>{this.isCurrentRequest(e,r,void 0,{agentIdentity:t})&&(this.agentIdentityLoading=!1)})}loadActivePanelData(){if(!this.routeData)return;let e=this.agentsSelectedId;if(e){if(this.agentsPanel===`overview`){this.ensureModelCatalog();return}if(this.agentsPanel===`files`&&this.agentFilesList?.agentId!==e){this.loadAgentFiles(e);return}if(this.agentsPanel===`skills`&&this.agentSkillsAgentId!==e){Dr(this,e);return}if(this.agentsPanel===`tools`){this.syncGitHubIdentity(e),this.toolsCatalogResult?.agentId!==e&&!this.toolsCatalogLoading&&u(this,e),this.loadEffectiveToolsForAgent(e),this.githubIdentity.statusReadable&&!this.githubIdentity.status&&!this.githubIdentity.loading&&!this.githubIdentity.error&&this.githubIdentity.verify();return}if(this.agentsPanel===`channels`&&!this.context.channels.state.channelsSnapshot){this.context.channels.refresh(!1);return}this.agentsPanel===`cron`&&(this.cron.cronAgentId!==e&&(this.cron=Qe({client:this.client,connected:this.connected}),this.cron.cronAgentId=e),!this.cron.cronLoading&&!this.cron.cronStatus&&this.refreshCron())}}syncGitHubIdentity(e){let t=this.context.gateway.snapshot,n=t.selfUser?.id??null;n!==this.githubProfileId&&(this.githubIdentity.dispose(),this.githubProfileId=n);let r=(e,n)=>Ye(t,e,n,{requireAdvertisement:!1});this.githubIdentity.sync({client:this.client,connected:this.connected,target:e?{kind:`shared`,scope:`agent`,agentId:e,config:y(this.context.runtimeConfig.state)}:null,statusReadable:r(`tools.github.status`,`operator.read`),configurable:r(`tools.github.configure`,`operator.admin`),authorizable:[`tools.github.authorize.start`,`tools.github.authorize.poll`,`tools.github.authorize.cancel`].every(e=>r(e,`operator.admin`)),clientRevision:this.requestGeneration})}resetModelCatalog(){this.chatModelCatalogRequest?.abort(),this.chatModelCatalogRequest=null,this.chatModelCatalogSubscription?.unsubscribe(),this.chatModelCatalogSubscription=null,this.chatModelCatalogStatus=tn(),this.chatModelCatalogPending=null}ensureModelCatalog(e={}){let t=this.client,n=this.agentsSelectedId;if(!t||!this.connected||!n)return;if(!this.chatModelCatalogSubscription?.isCurrent()){this.resetModelCatalog();let e=this.requestGeneration,r=this.context?.gateway,i=this.context?.agents,a={isCurrent:()=>this.chatModelCatalogSubscription===a&&this.context?.gateway===r&&this.isCurrentRequest(t,e,n,{agents:i}),unsubscribe:cn(this.context.gateway,()=>{a.isCurrent()&&(this.chatModelCatalogRequest?.abort(),this.chatModelCatalogRequest=null,this.chatModelCatalogPending=null,this.ensureModelCatalog({refresh:!0}))})};this.chatModelCatalogSubscription=a}if(this.chatModelCatalogPending||!e.refresh&&this.chatModelCatalogStatus.hasLoaded)return;let r=this.chatModelCatalogSubscription,i=new AbortController;this.chatModelCatalogRequest=i;let a=()=>r?.isCurrent()&&this.chatModelCatalogRequest===i;this.chatModelCatalogStatus=Ot(this.chatModelCatalogStatus);let o=fn(t,{agentId:n,signal:i.signal}).then(e=>{if(!a())return;let t=ln(e);this.chatModelCatalogStatus=t?Yt(Ht(),Error(t),this.gateway.snapshot):Ht()},e=>{a()&&(this.chatModelCatalogStatus=Yt(this.chatModelCatalogStatus,e,this.gateway.snapshot))}).finally(()=>{this.chatModelCatalogPending===o&&(this.chatModelCatalogPending=null,this.chatModelCatalogRequest=null)});this.chatModelCatalogPending=o}async loadAgentFiles(e,t=!1){let n=this.client,r=this.context.agents;if(!n||!this.connected||this.agentFilesLoading)return;if(r.files(e).list&&!t){this.syncCurrentAgentFiles(r);return}let i=this.requestGeneration;this.agentFilesLoading=!0,this.agentFilesError=null;try{let a=t?await r.refreshFiles(e):await r.ensureFiles(e);if(!this.isCurrentRequest(n,i,e,{agents:r}))return;this.agentFilesList=a??r.files(e).list}finally{this.isCurrentRequest(n,i,e,{agents:r})&&(this.agentFilesLoading=!1)}this.isCurrentRequest(n,i,e,{agents:r})&&await this.selectDefaultAgentFile(e,t)}async refreshCron(){let e=this.cron;e.connected&&e.client&&!e.cronLoading&&await Promise.all([this.runCronTask($e),this.runCronTask(rt),this.runCronTask(e=>it(e,{tableFilters:!0}))])}async runCronTask(e){let t=this.cron;try{let n=e(t);return this.cron===t&&this.requestUpdate(),await n}finally{this.cron===t&&this.requestUpdate()}}saveIdentityDraft(){if(!this.canCall(`agents.update`,`operator.admin`))return;let e=this.client,t=this.agentsSelectedId;if(!e||!t||this.identitySaving)return;let n=this.requestGeneration,r=this.context.agents,i=this.context.agentIdentity;mr({host:this,config:this.context.config,expectedClient:e,agentId:t,agents:r,agentIdentity:i,runtimeConfig:this.context.runtimeConfig,canDispatch:()=>this.canCall(`agents.update`,`operator.admin`)&&this.isCurrentRequest(e,n,t,{agents:r,agentIdentity:i}),isCurrent:()=>this.isCurrentRequest(e,n,t,{agents:r,agentIdentity:i}),onSaved:()=>this.syncAgentState(r)})}resetSelectionState(){this.gateway.invalidate(),this.resetModelCatalog(),Gn(this),this.agentSkillsReport=null,this.agentSkillsLoading=!1,this.agentSkillsError=null,this.agentSkillsAgentId=null,this.agentIdentityLoading=!1,dr(this),this.toolsCatalogResult=null,this.toolsCatalogError=null,this.toolsCatalogLoading=!1,this.toolsCatalogLoadingAgentId=null,A(this),this.cron=Qe({client:this.client,connected:this.connected})}loadEffectiveToolsForAgent(e){if(e!==this.chatAgentId()){A(this);return}let t=g(this,{agentId:e,sessionKey:this.sessionKey});(this.toolsEffectiveResultKey!==t||this.toolsEffectiveError)&&h(this,{agentId:e,sessionKey:this.sessionKey})}async refreshAgents(e=`refresh`){let t=this.client;if(e===`save`&&(!t||!this.canCall(`config.set`,`operator.admin`)))return;let n=this.requestGeneration,r=this.context.agents;t&&(e!==`save`||await this.context.runtimeConfig.save())&&(await(e===`ensure`?r.ensureList():r.refreshList()),this.isCurrentRequest(t,n,void 0,{agents:r})&&(e===`save`&&A(this),this.syncAgentState(r),e!==`refresh`&&this.ensureAgentIdentities(),this.loadActivePanelData()))}async setDefaultAgent(e){if(!this.canCall(`config.set`,`operator.admin`))return;let t=this.client,n=this.requestGeneration,r=this.context.agents,i=this.context.runtimeConfig;if(!t)return;let a=()=>this.context.runtimeConfig===i&&this.isCurrentRequest(t,n,void 0,{agents:r})&&this.canCall(`config.set`,`operator.admin`);await i.ensureLoaded(),a()&&await me(i,e,()=>r.refreshList(),a)}saveSelectedAgentFile(e,t,n=Yn){e===this.agentsSelectedId&&this.canCall(`agents.files.set`,`operator.admin`)&&n(this,e,t,this.agentFileEditors[t]?.draft??this.agentFileEditors[t]?.content??``)}clearAgentSkills(e){if(!this.canCall(`config.patch`,`operator.admin`))return;let t=this.client,n=this.requestGeneration,r=this.context.agents,i=this.context.runtimeConfig;if(!t)return;let a=()=>this.context.runtimeConfig===i&&this.isCurrentRequest(t,n,e,{agents:r})&&this.canCall(`config.patch`,`operator.admin`);kr(i,e,a).then(t=>{if(a()){if(!t){this.agentSkillsError=i.state.lastError??P(`agents.skillsPanel.updateError`);return}this.agentSkillsError=null,Dr(this,e)}})}runCronJobNow(e){this.canCall(`cron.run`,`operator.admin`)&&this.cron.cronJobs.some(t=>t.id===e)&&this.runCronTask(t=>nt(t,e,`force`))}render(){let e=this.context.runtimeConfig.state,t=this.context.channels.state,n=this.context.agents.state,r=this.agentsSelectedId,i=()=>r===this.agentsSelectedId&&this.canCall(`agents.update`,`operator.admin`),a={canCreateAgent:this.canCall(`zero.chat`,`operator.admin`),canPatchConfig:this.canCall(`config.patch`,`operator.admin`),canUpdateConfig:this.canCall(`config.set`,`operator.admin`),canUpdateIdentity:this.canCall(`agents.update`,`operator.admin`),canWriteFiles:this.canCall(`agents.files.set`,`operator.admin`),canRunCron:this.canCall(`cron.run`,`operator.admin`)};this.syncGitHubIdentity(r);let o=this.context.agents.files(r).error,s=this.modelCatalog;return L`
      ${Zi()}
      ${rn(this.identityAvatarLoader.withActiveRoutes(()=>Qi({access:a,basePath:this.context.basePath,loading:n.agentsLoading,error:n.agentsError,agentsList:this.agentsList,selectedAgentId:r,activePanel:this.agentsPanel,config:e,channels:{snapshot:t.channelsSnapshot,loading:t.channelsLoading,error:t.channelsError,lastSuccess:t.channelsLastSuccess,onRefresh:()=>void this.context.channels.refresh(!1)},cron:{jobs:this.cron.cronJobs,jobsTotal:this.cron.cronJobsTotal,jobsHasMore:this.cron.cronJobsHasMore,jobsLoadingMore:this.cron.cronJobsLoadingMore,status:this.cron.cronStatus,scopedTotal:this.cron.cronScopedTotal,scopedNextWakeAtMs:this.cron.cronScopedNextWakeAtMs,loading:this.cron.cronLoading,error:this.cron.cronError,onRefresh:()=>void this.refreshCron(),onLoadMore:()=>void this.runCronTask(e=>it(e,{append:!0,tableFilters:!0})),onRunNow:e=>this.runCronJobNow(e)},agentFiles:{agentFilesList:this.agentFilesList,agentFilesLoading:this.agentFilesLoading,agentFilesError:this.agentFilesError??o,agentFileActive:this.agentFileActive,agentFileEditors:this.agentFileEditors,agentFileSaving:this.agentFileSaving,agentFileConflict:this.agentFileConflict,onLoadFiles:e=>void this.loadAgentFiles(e,!0),onSelectFile:e=>{this.agentFileActive=e,r&&Jn(this,r,e)},onFileDraftChange:(e,t)=>{r===this.agentsSelectedId&&(this.agentFileEditors={...this.agentFileEditors,[e]:{...this.agentFileEditors[e],draft:t}})},onFileReset:e=>{r===this.agentsSelectedId&&Xn(this,e)},onFileSave:e=>{r&&this.saveSelectedAgentFile(r,e)},onFileReload:e=>{r&&Zn(this,r,e)},onFileOverwrite:e=>{r&&this.saveSelectedAgentFile(r,e,Qn)}},agentIdentityById:Object.fromEntries(this.context.agentIdentity.entries().map(e=>[e.agentId,e])),overview:{applicationConfig:this.context.config,identityDraft:this.identityDraft,identityAvatarLoader:this.identityAvatarLoader,identitySaving:this.identitySaving,identityError:this.identityError,modelCatalog:s.models,decisionModels:s.decisionModels??[],modelSelectionPolicy:s.modelSelectionPolicy,modelCatalogRetired:s.retired,modelCatalogStatus:this.chatModelCatalogStatus,onIdentityFieldChange:(e,t)=>{i()&&fr(this,e,t)},onIdentityAvatarSelect:e=>{i()&&pr(this,e,this.context.config)},onIdentitySave:()=>this.saveIdentityDraft(),..._r({...this.configEditor,onPrimaryChanged:()=>void c(this)}),onModelCatalogOpen:()=>this.ensureModelCatalog({refresh:!0})},agentSkills:{report:this.agentSkillsReport,loading:this.agentSkillsLoading,error:this.agentSkillsError,activeAgentId:this.agentSkillsAgentId,filter:this.skillsFilter,onFilterChange:e=>this.skillsFilter=e,onRefresh:()=>{r&&Dr(this,r)},...Ar({...this.configEditor,getReport:()=>this.agentSkillsReport}),onClear:e=>this.clearAgentSkills(e)},tools:{toolsCatalogLoading:this.toolsCatalogLoading,toolsCatalogError:this.toolsCatalogError,toolsCatalogResult:this.toolsCatalogResult,toolsEffectiveLoading:this.toolsEffectiveLoading,toolsEffectiveError:this.toolsEffectiveError,toolsEffectiveResult:this.toolsEffectiveResult,githubIdentity:this.githubIdentity,onOpenGitHubConnections:()=>this.context.navigate(`profile`,{hash:`#settings-profile-github-connections`}),runtimeSessionKey:this.sessionKey,runtimeSessionMatchesSelectedAgent:r===this.chatAgentId(),...Mr(this.configEditor)},pinnedAgentIds:this.context.navigation.snapshot.pinnedAgentIds,onTogglePinnedAgent:e=>Ee(this.context.navigation,e),onRefresh:()=>void this.refreshAgents(),onCreateAgent:()=>{this.canCall(`zero.chat`,`operator.admin`)&&this.context.navigate(`custodian`,{search:`?intent=new-agent`})},onSelectPanel:e=>Cr(this.context,r,this.agentsPanel,e),onConfigReload:()=>void this.context.runtimeConfig.discardDraft({reloadOnly:!0}),onConfigSave:()=>void this.refreshAgents(`save`),onOpenMemoryImport:()=>this.context.navigate(`memory-import`),onOpenMemorySettings:()=>this.context.navigate(`memory`),onOpenAgentDefaults:()=>this.context.navigate(`ai-agents`),onSetDefault:e=>void this.setDefaultAgent(e)})))}
    `}},V([dt({context:Oe,subscribe:!0})],$.prototype,`context`,void 0),V([z({attribute:!1})],$.prototype,`routeData`,void 0),V([B()],$.prototype,`agentsList`,void 0),V([B()],$.prototype,`agentsSelectedId`,void 0),V([B()],$.prototype,`toolsCatalogLoading`,void 0),V([B()],$.prototype,`toolsCatalogLoadingAgentId`,void 0),V([B()],$.prototype,`toolsCatalogError`,void 0),V([B()],$.prototype,`toolsCatalogResult`,void 0),V([B()],$.prototype,`toolsEffectiveLoading`,void 0),V([B()],$.prototype,`toolsEffectiveLoadingKey`,void 0),V([B()],$.prototype,`toolsEffectiveResultKey`,void 0),V([B()],$.prototype,`toolsEffectiveError`,void 0),V([B()],$.prototype,`toolsEffectiveResult`,void 0),V([B()],$.prototype,`chatModelCatalogStatus`,void 0),V([B()],$.prototype,`agentFilesLoading`,void 0),V([B()],$.prototype,`agentFilesError`,void 0),V([B()],$.prototype,`agentFilesList`,void 0),V([B()],$.prototype,`agentFileEditors`,void 0),V([B()],$.prototype,`agentFileConflict`,void 0),V([B()],$.prototype,`agentFileActive`,void 0),V([B()],$.prototype,`agentFileSaving`,void 0),V([B()],$.prototype,`agentIdentityLoading`,void 0),V([B()],$.prototype,`identityDraft`,void 0),V([B()],$.prototype,`identitySaving`,void 0),V([B()],$.prototype,`identityError`,void 0),V([B()],$.prototype,`agentSkillsLoading`,void 0),V([B()],$.prototype,`agentSkillsError`,void 0),V([B()],$.prototype,`agentSkillsReport`,void 0),V([B()],$.prototype,`agentSkillsAgentId`,void 0),V([B()],$.prototype,`skillsFilter`,void 0),V([B()],$.prototype,`cron`,void 0),ta=!0,na=e=>L`<zero-agents-page .routeData=${e}></zero-agents-page>`,customElements.get(`zero-agents-page`)||customElements.define(`zero-agents-page`,$)})))()}ra();export{ta as header,na as render};
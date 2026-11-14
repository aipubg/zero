import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Pu as i,Va as a,W as o,ba as s,bu as c,g as l,h as u,ju as d,k as ee,m as f,p,pn as te,un as ne,xu as m,yu as h,zu as g}from"./control-ui-core-DCNBgr3X.js";import{$n as re,Aa as ie,Ai as ae,Ba as oe,ca as _,er as se,ki as ce,qr as le,sa as v,za as ue}from"./control-ui-core-DwX5Mpz4.js";import{E as de,G as y,J as b,W as x,Z as fe,at as pe,i as me,k as he,n as S,o as ge,rt as C,t as w}from"./lit-runtime-B40xFCK_.js";import{c as T,l as _e}from"./gateway-runtime-JSfC8ThO.js";import{F as ve,P as ye,c as E,l as D}from"./control-ui-boot-shared-BX8huZUb.js";import{Fo as be,Ur as xe,Wr as Se,Zr as O,jo as k,wa as Ce,ya as we}from"./ui-AaV6iNVa.js";import{D as A,F as j,M as Te,N as Ee,T as De,j as Oe}from"./control-ui-boot-shared-E4pYPcWx.js";import{$ as ke,B as M,G as Ae,I as N,K as je,Kt as Me,Ut as Ne,X as Pe,Y as Fe,Z as P,bt as Ie,l as Le,m as Re,p as ze,u as Be,vt as Ve}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ml as He,Nl as Ue}from"./control-ui-boot-shared-CzJHozXQ.js";import{_ as We,a as Ge,c as Ke,f as F,g as qe,i as Je,l as Ye,r as Xe,s as Ze,u as Qe,v as $e,x as et,y as tt}from"./control-ui-boot-chat-Cx6CBnJr.js";import"./control-ui-boot-chat-styles-BcslGtWC.js";import{a as nt,c as rt,i as it,n as at,o as I,r as ot,t as st}from"./skills-grouping-BnmPZrfV.js";import{i as ct,n as lt,r as ut,t as dt}from"./plugins-hub-header-CUwTrGbx.js";function ft(e){return e===L.SECURITY_UNAVAILABLE||e===L.DOWNLOAD_BLOCKED}function pt(e){if(e.code||e.version||e.warning)return{...e.code?{clawhubTrustCode:e.code}:{},...e.version?{version:e.version}:{},...e.warning?{warning:e.warning}:{}}}function mt(e){if(Ce(e))return pt({code:ft(e.clawhubTrustCode)?e.clawhubTrustCode:void 0,version:be(e.version),warning:be(e.warning)})}var L;function ht(){return(ht=e((()=>{L={SECURITY_UNAVAILABLE:`clawhub_security_unavailable`,DOWNLOAD_BLOCKED:`clawhub_download_blocked`}})))()}async function gt(e,t,n){return(await e.request(`skills.search`,{query:t.trim()||void 0,limit:20},{signal:n}))?.results??[]}function R(e,t,n){return e.connected&&e.client===t&&e.skillOperation===n}function _t(e,t){e.skillOperation===t&&(e.skillOperation=null)}function vt(e,t,n){t.trim()&&(e.skillMessages={...e.skillMessages,[t]:n})}function yt(e){if(e&&typeof e==`object`&&`details`in e)return mt(e.details)}function bt(e){return`${e.registry}\0${e.ownerHandle??``}\0${e.slug}\0${e.version}`}function xt(e){return!!(e&&e.status===`linked`&&e.valid)}function St(e){if(!e.skillCard?.present)return;let t=xt(e.clawhub)?e.clawhub.installedVersion:``;return`${e.skillCard.path}\0${e.skillCard.sizeBytes}\0${t}`}function z(e,t){let n=e.skillsReport?.skills.find(e=>e.skillKey===t);return n?St(n):void 0}function B(e){let t=e.skillsAgentId?.trim();return t?{agentId:t}:{}}function V(e){let{skillsAgentId:t,skillsAgentRevision:n}=e;return()=>e.skillsAgentId===t&&e.skillsAgentRevision===n}function H(e,t){let n=t?.trim()||null;e.skillsAgentId!==n&&(e.skillsAgentId=n,e.skillsAgentRevision++,e.skillsLoading=!1,e.skillsReport=null,e.skillsError=null,e.skillEdits={},e.skillMessages={},e.clawhubInstallMessage=null,e.clawhubVerdicts={},e.clawhubVerdictsLoading=!1,e.clawhubVerdictsError=null,e.skillCardContents={},e.skillCardContentKeys={},e.skillCardLoadingKey=null,e.skillCardErrors={})}function Ct(e,t){t&&H(e,t.agents.some(t=>t.id===e.skillsAgentId)?e.skillsAgentId:t.agents.some(e=>e.id===t.defaultId)?t.defaultId:null)}async function U(e,t){let n=e.client,r=e.skillsAgentId?.trim();if(!n||!r||!e.connected||e.skillsLoading||e.skillOperation&&e.skillOperation!==t?.operation)return;t?.clearMessages&&Object.keys(e.skillMessages).length>0&&(e.skillMessages={});let i=V(e),a=()=>e.client===n&&i()&&(!t?.operation||e.skillOperation===t.operation),o=()=>e.connected&&a();e.skillsLoading=!0,e.skillsError=null;try{let t=await s(n,r);if(!o())return;t&&Array.isArray(t.skills)&&(e.skillsReport=t,Et(e,t),Ot(e,t))}catch(t){if(!o())return;e.skillsError=h(t)}finally{a()&&(e.skillsLoading=!1)}}async function wt(e,t,n,r=!1){let i=r;for(;R(e,t,n);){let r=V(e);if(await U(e,{clearMessages:i,operation:n}),i=!1,!R(e,t,n)||r())return}}async function Tt(e,t){let n=e.client;if(!n||!e.connected||e.skillsLoading||e.skillOperation)return;let r={kind:`refresh`};e.skillOperation=r;try{if(await t(),!R(e,n,r))return;await wt(e,n,r,!0)}finally{_t(e,r)}}function Et(e,t){let n=new Map(t.skills.map(e=>[e.skillKey,St(e)]).filter(e=>e[1]!==void 0));e.skillCardContents=Object.fromEntries(Object.entries(e.skillCardContents).filter(([t])=>e.skillCardContentKeys[t]===n.get(t))),e.skillCardContentKeys=Object.fromEntries(Object.entries(e.skillCardContentKeys).filter(([e,t])=>t===n.get(e))),e.skillCardErrors=Object.fromEntries(Object.entries(e.skillCardErrors).filter(([e])=>n.has(e))),e.skillCardLoadingKey&&!n.has(e.skillCardLoadingKey)&&(e.skillCardLoadingKey=null)}async function Dt(e,t){if(!e.client||!e.connected||e.skillCardLoadingKey===t||e.skillCardContents[t]!==void 0&&e.skillCardContentKeys[t]===z(e,t))return;let n=z(e,t);if(!n)return;let r=V(e),i={...B(e),skillKey:t};e.skillCardLoadingKey=t;let{[t]:a,...o}=e.skillCardErrors;e.skillCardErrors=o;try{let a=await e.client.request(`skills.skillCard`,i);r()&&a?.skillKey===t&&typeof a.content==`string`&&z(e,t)===n&&(e.skillCardContents={...e.skillCardContents,[t]:a.content},e.skillCardContentKeys={...e.skillCardContentKeys,[t]:n})}catch(n){r()&&(e.skillCardErrors={...e.skillCardErrors,[t]:h(n)})}finally{r()&&e.skillCardLoadingKey===t&&(e.skillCardLoadingKey=null)}}async function Ot(e,t){let n=e.client,r=V(e);if(!n||!e.connected||!t.skills.some(e=>xt(e.clawhub))){e.clawhubVerdicts={},e.clawhubVerdictsLoading=!1,e.clawhubVerdictsError=null;return}e.clawhubVerdictsLoading=!0,e.clawhubVerdictsError=null;try{let t=await n.request(`skills.securityVerdicts`,B(e));if(!r())return;e.clawhubVerdicts=Object.fromEntries((t?.items??[]).map(e=>[bt({registry:e.registry,slug:e.requestedSlug,ownerHandle:e.requestedOwnerHandle,version:e.requestedVersion}),e]))}catch(t){if(!r())return;e.clawhubVerdicts={},e.clawhubVerdictsError=h(t)}finally{r()&&(e.clawhubVerdictsLoading=!1)}}function kt(e,t,n){e.skillOperation||e.skillsLoading||(e.skillEdits={...e.skillEdits,[t]:n})}async function W(e,t,n){let r=e.client;if(!r||!e.connected||e.skillsLoading||e.skillOperation)return;let i=V(e),a=()=>R(e,r,t)&&i();e.skillOperation=t,t.kind===`skill`?e.skillsError=null:e.clawhubInstallMessage=null;try{let i=await n(r);if(!a()||(await U(e,{operation:t}),!a()))return;t.kind===`skill`?vt(e,t.skillKey,i):e.clawhubInstallMessage={kind:i.kind,text:i.message}}catch(n){if(!a())return;let r=h(n);if(t.kind===`skill`)e.skillsError=r,vt(e,t.skillKey,{kind:`error`,message:r});else{let t=yt(n);e.clawhubInstallMessage={kind:`error`,text:G(r,t?.warning)}}}finally{R(e,r,t)&&!i()&&await wt(e,r,t),_t(e,t)}}async function At(e,t,n,r=()=>!0){await jt(e,t,{enabled:n},n?`Skill enabled`:`Skill disabled`,r)}async function jt(e,t,n,r,i){await W(e,{kind:`skill`,skillKey:t},async a=>{let o={skillKey:t,...n},{refreshError:s}=await Lt(e.runtimeConfig,a,e=>e.request(`skills.update`,o),{canDispatch:i,dispatchError:`Access changed before the skill update started.`});return{kind:`success`,message:s?`${r}\n${s}`:r}})}async function Mt(e,t,n=()=>!0){let r=e.skillEdits[t]?.trim();r&&await jt(e,t,{apiKey:r},`API key saved — stored in zero.json (skills.entries.${t})`,n)}async function Nt(e,t,n,r,i=!1){await W(e,{kind:`skill`,skillKey:t},async t=>{let a=await t.request(`skills.install`,{...B(e),name:n,installId:r,dangerouslyForceUnsafeInstall:i});return{kind:`success`,message:c(a?.message,`Installed`)}})}async function Pt(e,t){if(!e.client||!e.connected)return;let n=e.client,r=V(e);e.clawhubDetailRef=t,e.clawhubDetailLoading=!0,e.clawhubDetailError=null,e.clawhubDetail=null;let i=()=>e.connected&&e.client===n&&t===e.clawhubDetailRef&&r();try{let r=await n.request(`skills.detail`,{slug:t});if(!i())return;e.clawhubDetail=r??null}catch(t){if(!i())return;e.clawhubDetailError=h(t)}e.clawhubDetailLoading=!1}function Ft(e){e.clawhubDetailRef=null,e.clawhubDetail=null,e.clawhubDetailError=null,e.clawhubDetailLoading=!1}async function It(e,t,n){await W(e,{kind:`clawhub`,ref:t},async r=>{let i=await r.request(`skills.install`,{...B(e),source:`clawhub`,slug:t,...n?{version:n}:{}});return{kind:`success`,message:G(c(i?.message,`Installed ${t}`),i?.warning?c(i.warning):void 0)}})}var Lt,G;function K(){return(K=e((()=>{ht(),m(),Lt=a(`Connection changed before the skill update started.`),G=(e,t)=>t?`${e}\n\n${t}`:e})))()}function Rt(e,t){return{connection:e,entry:t?t.entry:null,slug:t?t.entry.slug:``,content:t?t.content:``,files:t?t.files:[],baseFiles:t?t.files.map(e=>({...e})):[],revisions:t?t.revisions:[],selectedFile:`SKILL.md`,rollbackRevision:``,dirty:!1}}var zt;function Bt(){return(Bt=e((()=>{se(),i(),m(),_e(),f(),Ze(),zt=class{constructor(e,t,n=()=>void 0){this.host=e,this.gateway=t,this.config=n,this.list=null,this.view=null,this.loading=!1,this.busy=!1,this.error=null,this.notice=null,this.draft=null,this.importVisible=!1,this.importSlug=``,this.importSource=null,this.importSelection=[],this.newFilePath=``,this.query=``,this.readSequence=0}changed(){this.host.requestUpdate()}clearFeedback(){this.error=null,this.notice=null}get importOpen(){return this.importVisible}set importOpen(e){this.clearFeedback(),this.importVisible=e,e||(this.importSlug=``,this.importSource=null,this.importSelection=[])}reset(){this.readSequence++,this.list=null,this.view=null,this.loading=!1,this.busy=!1,this.draft=null,this.importOpen=!1,this.newFilePath=``,this.query=``}get showWorkspace(){return this.view===null||this.view===`workspace`}get uploadsEnabled(){return l(this.config())}get canWrite(){return T(this.gateway.snapshot,`skills.library.save`,`operator.write`,{requireAdvertisement:!1})}get canTransfer(){return T(this.gateway.snapshot,`skills.library.mutate`,`operator.admin`,{requireAdvertisement:!1})}get canCreate(){return!this.loading&&!!this.list?.profileId&&this.canWrite}get canEdit(){return this.canWrite&&(this.draft?.entry?.canEdit??!0)}async load(){let e=this.gateway.capture();if(e&&!this.loading){this.loading=!0,this.error=null,this.changed();try{let t=await e.client.request(`skills.library.list`,{scope:`all`});if(!this.gateway.isCurrent(e))return;this.list=t,this.view??=t.defaultTarget===`personal`?`mine`:`workspace`}catch(t){this.gateway.isCurrent(e)&&(this.error=h(t))}finally{this.gateway.isCurrent(e)&&(this.loading=!1,this.changed())}}}create(){let e=this.gateway.capture();e&&this.canCreate&&(this.draft=Rt(e),this.clearFeedback(),this.newFilePath=``,this.changed())}close(){this.busy||this.draft?.dirty&&!window.confirm(g(`skillLibrary.discard`))||(this.readSequence++,this.draft=null,this.importOpen=!1,this.newFilePath=``,this.changed())}async open(e){if(this.draft?.dirty&&!window.confirm(g(`skillLibrary.discard`)))return;let t=this.gateway.capture();if(!t||this.busy)return;let n=++this.readSequence;await this.perform(async()=>{let r=await t.client.request(`skills.library.read`,{skillId:e});this.gateway.isCurrent(t)&&n===this.readSequence&&(this.draft=Rt(t,r))})}async perform(e){if(this.busy||this.loading)return;let t=this.gateway.capture();if(!t){this.error=g(`skillLibrary.connectionChanged`),this.changed();return}this.busy=!0,this.clearFeedback(),this.changed();try{await e()}catch(e){if(this.gateway.isCurrent(t)){let t=e instanceof re?we(e.details)?.code:void 0;this.error=t===`SKILL_LIBRARY_CONFLICT`?g(`skillLibrary.conflict`):t===`SKILL_LIBRARY_IDENTITY_REQUIRED`?g(`skillLibrary.signIn`):h(e)}}finally{this.gateway.isCurrent(t)&&(this.busy=!1,this.changed())}}async receipt(e){this.notice=g(`skillLibrary.receipt.${e.state}`,{slug:e.entry.slug,target:e.target,owner:e.entry.ownerLabel})+` `+e.nextAction,await this.load()}async save(){let e=this.draft;e&&this.canEdit&&await this.perform(async()=>{if(!this.gateway.isCurrent(e.connection))throw Error(g(`skillLibrary.connectionChanged`));e.importedFiles&&p(this.config());let t=e.connection.client,n=e.files.map(e=>({...e})),r=new Map(e.baseFiles.map(e=>[e.path,e])),i=[],a=n.filter(t=>{let n=e.entry?r.get(t.path):void 0;return n&&n.content===t.content&&n.encoding===t.encoding&&n.executable===t.executable?(i.push(t.path),!1):!0});a.length&&p(this.config());let o=await t.request(`skills.library.save`,{...e.entry?{skillId:e.entry.skillId}:{},expectedRevision:e.entry?.revision??null,slug:e.slug,content:e.content,files:a,...i.length?{retainFiles:i}:{}});this.gateway.isCurrent(e.connection)&&(e.entry=o.entry,e.baseFiles=n,e.importedFiles=!1,e.dirty=!1,e.revisions=[{revision:o.entry.revision,createdAt:o.entry.updatedAt},...e.revisions.filter(e=>e.revision!==o.entry.revision)],await this.receipt(o))})}async mutate(e){let t=this.draft,n=t?.entry;t&&n&&this.canEdit&&!t.dirty&&(e!==`remove`&&e!==`transfer`||window.confirm(g(`skillLibrary.confirm.${e}`,{slug:t.slug})))&&await this.perform(async()=>{if(!this.gateway.isCurrent(t.connection))throw Error(g(`skillLibrary.connectionChanged`));let r=await t.connection.client.request(`skills.library.mutate`,{skillId:n.skillId,expectedRevision:n.revision,action:e,...e===`rollback`?{revision:t.rollbackRevision}:{}});if(this.gateway.isCurrent(t.connection)&&(e===`remove`&&(this.draft=null),await this.receipt(r),this.gateway.isCurrent(t.connection)&&e!==`remove`)){if(e===`rollback`){let e=await t.connection.client.request(`skills.library.read`,{skillId:r.entry.skillId,revision:r.entry.revision});if(!this.gateway.isCurrent(t.connection))return;t.content=e.content,t.files=e.files,t.baseFiles=e.files.map(e=>({...e})),t.revisions=e.revisions,t.selectedFile=`SKILL.md`,t.rollbackRevision=``}t.entry=r.entry}})}async importFiles(e){if(!e.length)return;let t=this.gateway.capture();t&&await this.perform(async()=>{p(this.config());let[n]=e;if(n&&e.length===1&&n.name.toLowerCase().endsWith(`.zip`)){if(!this.list?.profileId)throw Error(g(`skillLibrary.signIn`));let e=await Qe(t.client,n,this.importSlug,()=>this.gateway.isCurrent(t),this.config());this.gateway.isCurrent(t)&&(this.importOpen=!1,await this.receipt(e));return}let r=await Ye(e,this.config());p(this.config()),this.gateway.isCurrent(t)&&(this.create(),this.draft&&(Object.assign(this.draft,r,{slug:this.importSlug,dirty:!0,importedFiles:!0}),this.importOpen=!1))})}async importClawHub(e,t,n){let r=this.gateway.capture();r&&this.list?.profileId&&this.canWrite&&await this.perform(async()=>{let i=await r.client.request(`skills.library.import`,{slug:e,source:{kind:`clawhub`,slug:t,...n?{version:n}:{}}});this.gateway.isCurrent(r)&&(this.importOpen=!1,await this.receipt(i))})}}})))()}function Vt(e,t){let n=e.list,r=[];(n?.multipleProfiles||n?.entries.length||n?.defaultTarget===`personal`)&&(n?.profileId&&r.push({value:`mine`,label:g(`skillLibrary.mine`)}),(n?.multipleProfiles||n?.entries.some(e=>e.shared||e.ownerProfileId===null))&&r.push({value:`team`,label:g(`skillLibrary.team`)}),r.push({value:`all`,label:g(`skillLibrary.all`)},{value:`workspace`,label:g(`skillLibrary.inventory`)}));let i=(e,t,n)=>b`<button
    type="button"
    class="btn"
    ?disabled=${t}
    @click=${n}
  >
    ${g(e)}
  </button>`;return b`
    <div class="plugins-toolbar">
      ${t}
      ${i(`skillLibrary.create`,!e.canCreate||e.busy,()=>e.create())}
      ${e.uploadsEnabled?i(`skillLibrary.import`,!e.canCreate||e.busy,()=>{e.uploadsEnabled&&(e.importOpen=!0,e.importSource=null,e.changed())}):y}
    </div>
    ${r.length>0||!e.showWorkspace?b`<div class="plugins-toolbar">
            ${r.length>0?Pe({value:e.view??`workspace`,ariaLabel:g(`skillLibrary.library`),options:r,onChange:t=>{e.view=t,e.changed()}}):y}
            ${e.showWorkspace?y:i(`common.refresh`,e.loading||e.busy,()=>void e.load())}
          </div>`:y}
  `}function Ht(){return(Ht=e((()=>{x(),N(),i()})))()}function Ut(e){return P({kind:e?`ok`:`muted`,label:g(e?`skillsPage.enabled`:`skillsPage.disabled`)})}function q(e,t){let n=e.clawhub;return n?.valid?t[bt({registry:n.registry,slug:n.slug,ownerHandle:n.ownerHandle,version:n.installedVersion})]??null:null}function Wt(e,t){let n=`clawhub`in e&&e.clawhub?.status===`invalid`?e.clawhub.reason:null,r=`eligible`in e?I(e):!e.disabled,i=t&&(!t.ok||t.decision!==`pass`),a=i&&t.securityStatus===`malicious`,o=n||a?`danger`:i?`warn`:e.disabled?`muted`:r?`ok`:`warn`,s=g(i?a?`skillsPage.verdict.blocked`:`skillsPage.verdict.review`:n?`skillsPage.invalidLink`:e.disabled?`skillsPage.tabs.disabled`:r?`eligible`in e?`skillsPage.tabs.ready`:`skillsPage.enabled`:`skillsPage.tabs.needsSetup`),c=`missing`in e?[...it(e),...ot(e)]:[g(`skillDiscovery.libraryStatus`)],l=[s,n,...i?t.reasons??[]:[],...c].filter(Boolean).join(` · `);return b`<span
    class="plugin-catalog-card__status settings-status settings-status--${o}"
    role="img"
    tabindex="0"
    aria-label=${l}
    title=${l}
  >
    <span class="settings-status__dot" aria-hidden="true"></span>
  </span>`}function J(){return(J=e((()=>{x(),N(),i(),E(),nt(),K(),D()})))()}function Gt(e,t){let n=e.list,r=e.query.toLowerCase().trim(),i=(n?.entries??[]).filter(t=>(e.view===`mine`?t.ownerProfileId===n?.profileId:e.view!==`team`||t.shared||t.ownerProfileId===null)&&(!r||`${t.slug} ${t.name} ${t.description} ${t.ownerLabel}`.toLowerCase().includes(r)));return b`
    ${Vt(e,t)}
    ${n?.defaultTarget===`unavailable`?b`<p class="muted">${g(`skillLibrary.signIn`)}</p>`:y}
    ${Kt(e)}
    ${n&&!e.showWorkspace?b`<p class="muted">
              ${g(`skillLibrary.defaultLimit`,{count:String(n.defaultSelectionLimit)})}
            </p>
            ${n.defaultSelectionNotice?b`<p class="callout" role="status">${n.defaultSelectionNotice}</p>`:y}`:y}
    ${e.showWorkspace?y:b`
            <label class="field"
              ><span>${g(`common.search`)}</span
              ><input
                class="settings-input"
                name="library-search"
                .value=${e.query}
                placeholder=${g(`skillLibrary.search`)}
                @input=${t=>{e.query=F(t,HTMLInputElement).value,e.changed()}}
            /></label>
            ${e.loading?b`<p role="status">${g(`common.loading`)}</p>`:Fe({title:g(`skillLibrary.${e.view}`),count:i.length},i.length===0?M(g(`skillLibrary.empty`)):S(i,e=>e.skillId,t=>b` <div class="settings-row">
                            <button
                              type="button"
                              class="settings-row__text plugins-item__detail-button"
                              ?disabled=${e.loading||e.busy}
                              @click=${()=>void e.open(t.skillId)}
                            >
                              <span class="settings-row__title">${t.slug}</span>
                              <span class="settings-row__desc">${t.description}</span>
                              <span class="settings-row__desc"
                                >${t.ownerLabel} ·
                                ${t.shared?g(`skillLibrary.shared`):g(`skillLibrary.private`)}
                                · ${t.revision.slice(0,8)}</span
                              >
                            </button>
                            <div class="settings-row__control">
                              ${Ut(t.enabled)}
                            </div>
                          </div>`))}
          `}
    ${X(e)}
  `}function Y(e,t=null){return b`
    ${e?b`<div class="callout danger" role="alert">${e}</div>`:y}
    ${t?b`<div class="callout success" role="status">${t}</div>`:y}
  `}function Kt(e){return Y(!e.draft&&!e.importOpen?e.error:null,e.draft?null:e.notice)}function qt(e,t,n){let r=n?.title??g(`skillLibrary.import`);return b`<zero-modal-dialog
    label=${r}
    style=${n?`--zero-modal-width: 960px;`:y}
    @modal-cancel=${t=>{t.preventDefault(),e.close()}}
  >
    <form
      class="exec-approval-card skill-reader-dialog"
      @submit=${t=>{t.preventDefault();let r=e.importSource;n?e.save():r?e.importClawHub(e.importSlug,r.slug,r.version):e.importFiles(e.importSelection)}}
      @keydown=${n?e=>{(e.ctrlKey||e.metaKey)&&e.key===`Enter`&&!n?.disabled&&(e.preventDefault(),F(e,HTMLFormElement).requestSubmit())}:void 0}
    >
      ${Je(r,()=>e.close(),e.busy)}
      <div
        class=${`skill-reader-dialog__body${n?``:` skill-library-import`}`}
        style=${n?`display: grid; gap: var(--space-4); min-width: 0;`:y}
      >
        ${t}
      </div>
    </form>
  </zero-modal-dialog>`}function Jt(e){let t=e.draft;if(!t)return y;let n=!e.canEdit||e.busy||e.loading,r=t.importedFiles&&!e.uploadsEnabled,i=t.files.find(e=>e.path===t.selectedFile),a=t.selectedFile===`SKILL.md`?t.content:i?Ke(i):null,o=r=>{n||(t.selectedFile===`SKILL.md`?t.content=r:t.files=t.files.map(e=>e.path===t.selectedFile?{...e,content:r,encoding:`utf8`}:e),t.dirty=!0,e.changed())},s=n||t.dirty,c=(t,n=s)=>b`<button
      type="button"
      class=${t===`remove`?`btn danger`:`btn`}
      ?disabled=${n}
      @click=${()=>void e.mutate(t)}
    >
      ${g(`skillLibrary.${t}`)}
    </button>`;return qt(e,b`
      <p class="muted">
        ${t.entry?g(`skillLibrary.ownerRevision`,{owner:t.entry.ownerLabel,revision:t.entry.revision.slice(0,8)}):g(`skillLibrary.personalTarget`)}
      </p>
      ${t.entry?Ge(t.entry):y}
      ${e.canEdit?y:b`<p role="status">${g(`skillLibrary.readOnly`)}</p>`}
      <label class="field"
        ><span>${g(`skillLibrary.slug`)}</span
        ><input
          class="settings-input"
          name="library-slug"
          title=${g(`skillLibrary.slugHelp`)}
          required
          pattern="[a-z0-9][a-z0-9\\-]{0,62}"
          maxlength="63"
          ?disabled=${n}
          .value=${ge(t.slug)}
          @input=${n=>{t.slug=F(n,HTMLInputElement).value,t.dirty=!0,e.changed()}}
      /></label>

      <div class="plugins-toolbar">
        <label class="field" style="min-width: 0; flex: 1;"
          ><span>${g(`skillLibrary.file`)}</span
          ><select
            class="settings-select"
            aria-label=${g(`skillLibrary.file`)}
            .value=${t.selectedFile}
            @change=${n=>{t.selectedFile=F(n,HTMLSelectElement).value,e.changed()}}
          >
            <option value="SKILL.md" ?selected=${t.selectedFile===`SKILL.md`}>
              SKILL.md
            </option>
            ${t.files.map(e=>b`<option value=${e.path} ?selected=${t.selectedFile===e.path}>
                  ${e.path}${e.executable?` *`:``}
                </option>`)}
          </select></label
        >
        ${i&&e.canEdit?b`<button
                type="button"
                class="btn"
                ?disabled=${n}
                @click=${()=>{window.confirm(g(`skillLibrary.deleteFileConfirm`,{path:i.path}))&&(t.files=t.files.filter(e=>e.path!==i.path),t.selectedFile=`SKILL.md`,t.dirty=!0,e.changed())}}
              >
                ${g(`skillLibrary.deleteFile`)}
              </button>`:y}
      </div>
      ${i&&e.canEdit?b`<label class="field checkbox"
              ><input
                type="checkbox"
                name="library-file-executable"
                ?disabled=${n}
                .checked=${i.executable===!0}
                @change=${n=>{let r=F(n,HTMLInputElement).checked;t.files=t.files.map(e=>e.path===i.path?{...e,executable:r}:e),t.dirty=!0,e.changed()}}
              /><span>${g(`skillLibrary.executable`)}</span></label
            >`:y}
      ${a===null?b`<p class="muted">${g(`skillLibrary.binary`)}</p>`:b`<label class="field"
              ><span>${t.selectedFile}</span
              ><textarea
                name="library-content"
                class="settings-input"
                spellcheck="false"
                rows="18"
                style="font-family: var(--mono); min-width: 0; max-width: 100%; box-sizing: border-box; resize: vertical;"
                ?readonly=${n}
                .value=${ge(a)}
                @input=${e=>o(F(e,HTMLTextAreaElement).value)}
              ></textarea>
            </label>`}
      ${n?y:b`<div class="plugins-toolbar">
              <label class="field" style="flex: 1; min-width: 0;"
                ><span>${g(`skillLibrary.newFile`)}</span
                ><input
                  class="settings-input"
                  name="library-file-path"
                  .value=${e.newFilePath}
                  @input=${t=>{e.newFilePath=F(t,HTMLInputElement).value,e.changed()}} /></label
              ><button
                type="button"
                class="btn"
                ?disabled=${!e.newFilePath.trim()}
                @click=${()=>{let n=e.newFilePath.trim();n===`SKILL.md`||t.files.some(e=>e.path===n)?e.error=g(`skillLibrary.fileExists`):(t.files=[...t.files,{path:n,content:``,encoding:`utf8`}],t.selectedFile=n,t.dirty=!0,e.newFilePath=``),e.changed()}}
              >
                ${g(`skillLibrary.addFile`)}
              </button>
            </div>`}
      ${Y(e.error,e.notice)}
      <div class="plugins-toolbar">
        ${e.canEdit?b`<button
                type="submit"
                class="btn primary"
                ?disabled=${n||r||!t.dirty||!t.content.trim()}
              >
                ${e.busy?g(`common.loading`):g(`skillLibrary.save`)}
              </button>`:y}
        ${e.canEdit&&t.entry?b`
                ${c(t.entry.enabled?`disable`:`enable`)}
                ${t.entry.ownerProfileId?c(t.entry.shared?`unshare`:`share`):y}
              `:y}
      </div>
      ${e.canEdit&&t.entry&&t.revisions.length>1?b`<div class="plugins-toolbar">
              <label class="field" style="flex: 1; min-width: 0;"
                ><span>${g(`skillLibrary.revision`)}</span
                ><select
                  class="settings-select"
                  aria-label=${g(`skillLibrary.revision`)}
                  .value=${t.rollbackRevision}
                  ?disabled=${s}
                  @change=${n=>{t.rollbackRevision=F(n,HTMLSelectElement).value,e.changed()}}
                >
                  <option value="" ?selected=${t.rollbackRevision===``}>
                    ${g(`skillLibrary.selectRevision`)}
                  </option>
                  ${t.revisions.filter(e=>e.revision!==t.entry?.revision).map(e=>b`<option
                          value=${e.revision}
                          ?selected=${t.rollbackRevision===e.revision}
                        >
                          ${new Date(e.createdAt).toLocaleString()} ·
                          ${e.revision.slice(0,8)}
                        </option>`)}
                </select></label
              >${c(`rollback`,s||!t.rollbackRevision)}
            </div>`:y}
      ${e.canEdit&&t.entry?b`<div
              class="plugins-toolbar"
              style="border-top: 1px solid var(--border); padding-top: var(--space-4);"
            >
              ${e.canTransfer&&t.entry.ownerProfileId?c(`transfer`):y}
              ${c(`remove`)}
            </div>`:y}
    `,{title:t.entry?.slug??g(`skillLibrary.create`),disabled:n})}function Yt(e){if(!e.importOpen)return y;let t=e.importSelection,n=t.length?g(t.length===1?`skillLibrary.selectedFile`:`skillLibrary.selectedFiles`,{count:String(t.length),names:t.slice(0,2).map(e=>e.webkitRelativePath||e.name).join(`, `)+(t.length>2?`, …`:``)}):g(`skillLibrary.noFilesSelected`);return qt(e,b`
      ${!e.importSource&&!e.uploadsEnabled?b`<p role="status">${u()}</p>`:y}
      <p class="muted">
        ${e.importSource?g(`skillLibrary.importClawHub`,{source:e.importSource.slug}):g(`skillLibrary.importHelp`)}
      </p>
      <label class="field"
        ><span>${g(`skillLibrary.slug`)}</span
        ><input
          class="settings-input"
          required
          name="library-import-slug"
          title=${g(`skillLibrary.slugHelp`)}
          pattern="[a-z0-9][a-z0-9\\-]{0,62}"
          .value=${e.importSlug}
          ?disabled=${e.busy}
          @input=${t=>{e.importSlug=F(t,HTMLInputElement).value,e.changed()}}
      /></label>
      ${!e.importSource&&e.uploadsEnabled?b`<div class="field" role="group" aria-labelledby="library-import-files-label">
              <span id="library-import-files-label">${g(`skillLibrary.files`)}</span>
              <small id="library-import-files-help" class="settings-row__desc">
                ${g(`skillLibrary.filesHelp`)}
              </small>
              <div class="plugins-toolbar skill-library-import__pickers">
                ${[!1,!0].map(t=>b`
                    <button
                      type="button"
                      class="btn"
                      aria-describedby="library-import-files-help library-import-selection"
                      ?disabled=${e.busy}
                      @click=${t=>{if(!e.uploadsEnabled)return;let n=F(t,HTMLButtonElement).nextElementSibling;n instanceof HTMLInputElement&&n.click()}}
                    >
                      ${g(t?`skillLibrary.chooseFolderButton`:`skillLibrary.chooseFilesButton`)}
                    </button>
                    <input
                      type="file"
                      hidden
                      ?webkitdirectory=${t}
                      multiple
                      name=${t?`library-import-directory`:`library-import-files`}
                      ?disabled=${e.busy}
                      @change=${t=>{let n=F(t,HTMLInputElement);e.importSelection=e.uploadsEnabled?Array.from(n.files??[]):[],n.value=``,e.changed()}}
                    />
                  `)}
              </div>
              <div class="plugins-toolbar">
                <small id="library-import-selection" class="settings-row__desc" aria-live="polite">
                  ${n}
                </small>
                ${t.length?b`<button
                        type="button"
                        class="btn btn--sm btn--ghost"
                        ?disabled=${e.busy}
                        @click=${()=>{e.importSelection=[],e.changed()}}
                      >
                        ${g(`skillLibrary.clearSelection`)}
                      </button>`:y}
              </div>
            </div>`:y}
      ${Y(e.error)}
      <button
        type="submit"
        class="btn primary"
        ?disabled=${e.busy||!e.importSource&&(!e.uploadsEnabled||t.length===0)}
      >
        ${e.busy?g(`common.loading`):g(`skillLibrary.import`)}
      </button>
    `)}var X;function Xt(){return(Xt=e((()=>{x(),me(),w(),N(),le(),i(),f(),Xe(),Ze(),Ht(),J(),X=e=>b`${Jt(e)} ${Yt(e)}`})))()}function Zt(e){let t=e.clawhub;return t?.valid?t.requestedReference??(t.ownerHandle?`@${t.ownerHandle}/${t.slug}`:null):null}function Qt(e){let t=e.libraries.filter(e=>!e.removed).map(t=>({id:`library:${t.skillId}`,name:t.slug,description:t.description,attribution:t.ownerLabel,library:t,skill:e.skills.find(e=>e.source===`zero-library`&&e.name===t.name)})),n=new Set(e.libraries.map(e=>e.name));for(let r of e.skills)r.source===`zero-library`&&n.has(r.name)||t.push({id:`local:${r.skillKey}`,name:r.name,description:r.description,attribution:Zt(r)??r.source,skill:r});let r=new Set;for(let n of e.results){let e=n.installRef,i=`${n.registry}\n${e}`;if(r.has(i))continue;r.add(i);let a=t.find(t=>t.skill?.clawhub?.valid&&t.skill.clawhub.registry===n.registry&&Zt(t.skill)===e);a?a.remote=n:t.push({id:`remote:${e}`,name:n.displayName,description:n.summary??``,attribution:e,remote:n})}let i=e.query.trim().toLowerCase();return t.filter(e=>e.remote||!i||`${e.name} ${e.description} ${e.attribution}`.toLowerCase().includes(i))}function $t(e,t){let{state:n}=t,r=e.remote,i=r?.installRef??``,a=!!(e.skill||e.library),o=a||!r?.installOnly,s=r?.icon?n.clawhubIconUrls?.[r.icon]:void 0,c=n.skillOperation?.kind===`clawhub`&&n.skillOperation.ref===i;return b`<article
    class="plugin-catalog-card oc-card oc-card-interactive"
    data-skill-id=${e.id}
  >
    ${o?b`<button
            type="button"
            class="plugin-catalog-card__primary-link skill-discovery-card__open"
            aria-label=${g(`skillsPage.openDetails`,{name:e.name})}
            @click=${()=>e.library?t.onLibraryOpen?.(e.library.skillId):e.skill?t.onDetailOpen(e.skill.skillKey):t.onClawHubDetailOpen(i)}
          ></button>`:y}
    <div class="plugin-catalog-card__head">
      <div class="installed-plugins-card__head">
        <span class="installed-plugins-card__art plugin-catalog-card__art" aria-hidden="true">
          ${s?b`<img src=${s} alt="" loading="lazy" />`:e.skill?.emoji??v.bookOpenText}
        </span>
        <div class="installed-plugins-card__identity">
          <div class="plugin-card-title-row"><h2>${e.name}</h2></div>
          <span class="plugin-card-author">${e.attribution}</span>
        </div>
      </div>
      <div class="plugin-catalog-card__action">
        ${a?Wt(e.skill??{disabled:!e.library.enabled},e.skill?q(e.skill,n.clawhubVerdicts):null):b`<button
                type="button"
                class="btn btn--sm plugin-catalog-card__install oc-action oc-action-secondary"
                ?disabled=${!n.connected||!t.canInstall||t.loading||n.skillOperation!==null}
                aria-label=${g(`skillsPage.installNamed`,{name:e.name})}
                @click=${()=>t.onClawHubInstall(i)}
              >
                ${g(c?`skillsPage.installing`:`skillsPage.install`)}
              </button>`}
      </div>
    </div>
    ${et(e.description)}
    ${r?.trustState?b`<span class="muted skill-discovery-card__notice">${g(`skillsPage.notScannedByClawHub`)}</span>`:y}
  </article>`}function en(e){let{state:t}=e,n=Qt({skills:t.skillsReport?.skills??[],libraries:e.libraryEntries??[],results:t.clawhubSearchResults??[],query:t.clawhubSearchQuery});return b`<section
    class="plugin-catalog-results skill-discovery"
    aria-label=${g(`skillsPage.title`)}
  >
    <label class="plugin-catalog-search">
      <span aria-hidden="true">${v.search}</span>
      <input
        type="search"
        class="settings-input"
        name="skills-search"
        autocomplete="off"
        autofocus
        aria-label=${g(`skillDiscovery.search`)}
        placeholder=${g(`skillDiscovery.search`)}
        .value=${t.clawhubSearchQuery}
        @input=${t=>{e.onClawHubQueryChange(t.currentTarget.value)}}
        ${he(e=>{e instanceof HTMLInputElement&&!e.dataset.autofocused&&(e.dataset.autofocused=`true`,queueMicrotask(()=>{e.isConnected&&e.focus({preventScroll:!0})}))})}
      />
    </label>
    ${e.error?b`<div class="callout danger" role="alert">${e.error}</div>`:y}
    ${t.connected?y:b`<p role="status" class="muted">${g(`skillsPage.disconnected`)}</p>`}
    ${t.clawhubSearchError?b`<div class="callout danger" role="alert">
            ${t.clawhubSearchError}
            <button
              type="button"
              class="btn btn--sm"
              @click=${()=>e.onClawHubQueryChange(t.clawhubSearchQuery)}
            >
              ${g(`common.retry`)}
            </button>
          </div>`:y}
    ${t.clawhubInstallMessage?b`<div
            role=${t.clawhubInstallMessage.kind===`error`?`alert`:`status`}
            class="callout ${t.clawhubInstallMessage.kind===`error`?`danger`:`success`}"
          >
            ${t.clawhubInstallMessage.text}
          </div>`:y}
    <div
      class="plugin-catalog-grid plugin-catalog-grid--results"
      aria-busy=${e.loading||t.clawhubSearchLoading}
    >
      ${S(n,e=>e.id,t=>$t(t,e))}
    </div>
    ${n.length===0&&!e.loading&&!t.clawhubSearchLoading&&t.connected&&!t.clawhubSearchError?b`<p class="muted" role="status">${g(`skillsPage.empty`)}</p>`:y}
  </section>`}function tn(){return(tn=e((()=>{x(),de(),w(),_(),i(),E(),tt(),J(),D()})))()}function nn(e){return e.disabled?`disabled`:I(e)?`ready`:`needs-setup`}function rn(e,t){if(!e)return t?{label:g(`skillsPage.refreshing`),kind:`muted`,chipClass:`chip`}:{label:g(`skillsPage.verdict.unavailable`),kind:`warn`,chipClass:`chip-warn`};let n=e.securityStatus?.trim()||null;return e.ok&&e.decision===`pass`?{label:n===`clean`||!n?g(`skillsPage.verdict.clean`):n,kind:`ok`,chipClass:`chip-ok`}:n===`pending`||n===`not-run`?{label:g(`skillsPage.verdict.pending`),kind:`muted`,chipClass:`chip`}:{label:g(n===`malicious`?`skillsPage.verdict.blocked`:n===`suspicious`?`skillsPage.verdict.review`:`skillsPage.verdict.unavailable`),kind:`warn`,chipClass:`chip-warn`}}function Z(e){return e.loading||e.state.skillOperation!==null}function an(e){return Z(e)||!e.canInstall}function on(e){let{state:t}=e,n=t.skillsReport?.skills??[],r={all:n.length,ready:0,"needs-setup":0,disabled:0};for(let e of n)r[nn(e)]++;let i=t.skillsStatusFilter===`all`?n:n.filter(e=>nn(e)===t.skillsStatusFilter),a=k(t.skillsFilter),o=a?i.filter(e=>k([e.name,e.description,e.source].join(` `)).includes(a)):i,s=st(o),c=t.skillsDetailKey?n.find(e=>e.skillKey===t.skillsDetailKey)??null:null;return b`
    ${Ae(e.surface===`discovery`?b` ${en(e)} ${e.library??y} `:b`
            ${e.library??y}
            ${e.showInventory===!1?y:cn(e,r,o.length)}
            ${e.error?b`<div class="callout danger" role="alert">${e.error}</div>`:y}
            ${e.showInventory===!1?y:o.length===0?M(!t.connected&&!t.skillsReport?g(`skillsPage.disconnected`):g(`skillsPage.empty`)):S(s,e=>e.id,t=>sn(t,e))}
          `,{wide:!0,carapace:e.surface===`discovery`})}
    ${c?dn(c,e):y}
    ${t.clawhubDetailRef?ln(e):y}
  `}function sn(e,t){return b`
    <details class="settings-section skills-group" open>
      <summary class="settings-section__header skills-group__summary">
        <h2 class="settings-section__heading">
          ${e.label} <span class="settings-count">${e.skills.length}</span>
        </h2>
        <span class="skills-group__chevron" aria-hidden="true">${v.chevronRight}</span>
      </summary>
      <div class="settings-group">
        ${S(e.skills,e=>e.skillKey,e=>un(e,t))}
      </div>
    </details>
  `}function cn(e,t,n){return b` <div class="plugins-toolbar plugins-toolbar--fields">
    ${Pe({value:e.state.skillsStatusFilter,ariaLabel:g(`skillsPage.title`),options:mn.map(e=>({value:e.id,label:b`${g(e.labelKey)} <span class="settings-count">${t[e.id]}</span>`})),onChange:e.onStatusFilterChange})}
    <label class="plugins-field skills-toolbar__search">
      <span>${g(`common.search`)}</span>
      <input
        class="settings-input"
        .value=${e.state.skillsFilter}
        @input=${t=>e.onFilterChange(t.target.value)}
        placeholder=${g(`skillsPage.filterPlaceholder`)}
        autocomplete="off"
        name="skills-filter"
      />
    </label>
    <span class="plugins-toolbar__hint"
      >${g(`skillsPage.shown`,{count:String(n)})}</span
    >
    <button
      type="button"
      class="btn"
      ?disabled=${Z(e)||!e.state.connected}
      @click=${e.onRefresh}
    >
      ${e.loading?g(`common.loading`):g(`common.refresh`)}
    </button>
  </div>`}function Q(e,t,n,r){return b`<zero-modal-dialog
    label=${e}
    style="--zero-modal-width: min(1040px, calc(100vw - 32px));"
    @modal-cancel=${t}
  >
    <div class="exec-approval-card skill-reader-dialog">
      <div class="exec-approval-header">
        ${n}
        <button
          type="button"
          class="btn btn--icon btn--ghost"
          aria-label=${g(`skillsPage.close`)}
          @click=${t}
        >
          ${v.x}
        </button>
      </div>
      ${r}
    </div>
  </zero-modal-dialog>`}function ln(e){let{state:t}=e,n=t.clawhubDetail,r=n?.skill?.icon?t.clawhubIconUrls?.[n.skill.icon]:void 0,i=r||!n?.owner?.image?void 0:t.clawhubIconUrls?.[n.owner.image],a=r??i;return Q(n?.skill?.displayName??t.clawhubDetailRef??g(`skillsPage.notFound`),e.onClawHubDetailClose,b`<div class="clawhub-skill-detail__identity">
      ${a?b`<img
              class="clawhub-skill-icon clawhub-skill-icon--detail ${i?`clawhub-skill-icon--profile`:``}"
              src=${a}
              alt=""
            />`:y}
      <div class="exec-approval-title">${n?.skill?.displayName??t.clawhubDetailRef}</div>
    </div>`,b`<div class="skill-reader-dialog__body clawhub-skill-detail__body">
      ${t.clawhubDetailLoading?b`<div class="muted" role="status">${g(`common.loading`)}</div>`:t.clawhubDetailError?b`<div class="callout danger skill-reader-dialog__error" role="alert">
                <span aria-hidden="true">${v.alertTriangle}</span>
                <span>${t.clawhubDetailError}</span>
              </div>`:n?.skill?b`
                  <div>${n.skill.summary??``}</div>
                  ${n.owner?.displayName||n.latestVersion?b`<div
                          class="clawhub-skill-detail__meta muted"
                          style="letter-spacing: normal;"
                        >
                          ${n.owner?.displayName?b`${g(`skillsPage.by`)}
                                ${n.owner.displayName}${n.owner.handle?b` (@${n.owner.handle})`:y}`:y}
                          ${n.owner?.displayName&&n.latestVersion?` · `:y}
                          ${n.latestVersion?g(`skillsPage.latest`,{version:n.latestVersion.version}):y}
                        </div>`:y}
                  ${n.latestVersion?.changelog?b`<article class="clawhub-skill-detail__changelog sidebar-markdown">
                          ${A(Ie(n.latestVersion.changelog,{codeBlockChrome:`none`,mode:`document`}))}
                        </article>`:y}
                  ${n.metadata?.os?b`<div class="clawhub-skill-detail__meta muted">
                          ${g(`skillsPage.platforms`,{platforms:n.metadata.os.join(`, `)})}
                        </div>`:y}
                  <div class="exec-approval-actions" style="margin-top: 0;">
                    <button
                      class="btn primary"
                      ?disabled=${an(e)}
                      @click=${()=>{t.clawhubDetailRef&&e.onClawHubInstall(t.clawhubDetailRef)}}
                    >
                      ${t.skillOperation?.kind===`clawhub`&&t.skillOperation.ref===(t.clawhubDetailRef??``)?g(`skillsPage.installing`):e.showInventory===!1?g(`skillLibrary.import`):g(`skillsPage.installNamed`,{name:n.skill.displayName})}
                    </button>
                  </div>
                `:b`<div class="muted" role="status">${g(`skillsPage.notFound`)}</div>`}
    </div>`)}function un(e,t){let n=q(e,t.state.clawhubVerdicts);return b`
    <div class="settings-row plugins-item plugins-item--clickable">
      <button
        type="button"
        class="settings-row__text plugins-item__detail-button"
        aria-label=${g(`skillsPage.openDetails`,{name:e.name})}
        @click=${()=>t.onDetailOpen(e.skillKey)}
      >
        <span class="settings-row__title">
          ${e.emoji?b`<span>${e.emoji}</span> `:y}${e.name}
        </span>
        <span class="settings-row__desc">${ee(e.description,140)}</span>
      </button>
      <div class="settings-row__control">
        ${Wt(e,n)}
        ${e.clawhub?.status===`linked`?P(rn(n,t.state.clawhubVerdictsLoading)):e.clawhub?.status===`invalid`?P({kind:`warn`,label:g(`skillsPage.invalidLink`)}):y}
      </div>
    </div>
  `}function dn(e,t){let{state:n}=t,r=Z(t)||!t.canUpdate,i=an(t),a=n.skillOperation?.kind===`skill`&&n.skillOperation.skillKey===e.skillKey,o=te(e.homepage??``,window.location.href),s=n.skillEdits[e.skillKey]??``,l=n.skillMessages[e.skillKey]??null,u=new Set([...e.missing.bins,...e.missing.anyBins]),d=e.install.find(e=>e.bins.some(e=>u.has(e))),ee=e.bundled&&e.source!==`zero-bundled`,f=ot(e),p=it(e),ne=q(e,n.clawhubVerdicts),m=n.skillsDetailTab===`card`&&e.skillCard?.present?`card`:`overview`;return Q(e.name,t.onDetailClose,b`<div class="exec-approval-title" style="display: flex; align-items: center; gap: 8px;">
      <span
        class="statusDot ${e.disabled?`muted`:I(e)?`ok`:`warn`}"
      ></span>
      ${e.emoji?b`<span style="font-size: 18px;">${e.emoji}</span>`:y}
      <span>${e.name}</span>
    </div>`,b`<div class="skill-reader-dialog__body" style="display: grid; gap: var(--space-4);">
      <div>
        <div style="font-size: 14px; line-height: 1.5; color: var(--text);">
          ${e.description}
        </div>
        ${rt({skill:e,showBundledBadge:ee})}
      </div>

      ${e.clawhub||e.skillCard?.present?b`
              ${Re({id:`skill-detail`,active:m,tabs:[{value:`overview`,label:g(`skillsPage.overview`)},...e.skillCard?.present?[{value:`card`,label:g(`skillsPage.skillCard`)}]:[]],ariaLabel:e.name,panelId:`skill-detail-panel`,variant:`sub`,onSelect:t.onDetailTabChange})}
            `:y}
      <div
        id="skill-detail-panel"
        role=${e.clawhub||e.skillCard?.present?`tabpanel`:y}
        aria-labelledby=${e.clawhub||e.skillCard?.present?`skill-detail-tab-${m}`:y}
      >
        ${m===`overview`?fn(e,t,ne):pn(e,t)}
      </div>
      ${f.length>0?b`
              <div
                class="callout"
                style="border-color: var(--warn-subtle); background: var(--warn-subtle); color: var(--warn);"
              >
                <div style="font-weight: 600; margin-bottom: 4px;">
                  ${g(`skillsPage.missingRequirements`)}
                </div>
                <div>${f.join(`, `)}</div>
              </div>
            `:y}
      ${p.length>0?b`
              <div class="muted" style="font-size: 13px;">
                ${g(`skillsPage.reason`,{reasons:p.join(`, `)})}
              </div>
            `:y}

      <div style="display: flex; align-items: center; gap: 12px;">
        ${ke({checked:!e.disabled,disabled:r,ariaLabel:e.name,onChange:()=>t.onToggle(e.skillKey,e.disabled)})}
        <span style="font-size: 13px; font-weight: 500;">
          ${e.disabled?g(`skillsPage.disabled`):g(`skillsPage.enabled`)}
        </span>
        ${d?b`<button
                class="btn"
                ?disabled=${i}
                @click=${()=>t.onInstall(e.skillKey,e.name,d.id)}
              >
                ${a?g(`skillsPage.installing`):d.label}
              </button>`:y}
      </div>

      ${l?b`<div
              class="callout ${l.kind===`error`?`danger`:`success`}"
              role=${l.kind===`error`?`alert`:`status`}
            >
              ${c(l.message)}
            </div>`:y}
      ${e.primaryEnv?b`
              <div style="display: grid; gap: 8px;">
                <label class="field">
                  <span
                    >${g(`skillsPage.apiKey`)}
                    <span class="muted" style="font-weight: normal; font-size: 0.88em;"
                      >(${e.primaryEnv})</span
                    ></span
                  >
                  <input
                    type="password"
                    required
                    ?disabled=${r}
                    .value=${s}
                    @input=${n=>t.onEdit(e.skillKey,n.target.value)}
                  />
                </label>
                ${o?b`<div class="muted" style="font-size: 13px;">
                        ${g(`skillsPage.getKey`)}
                        <a href="${o}" target="_blank" rel="noopener noreferrer"
                          >${e.homepage}</a
                        >
                      </div>`:y}
                <button
                  class="btn primary"
                  ?disabled=${r||!s.trim()}
                  @click=${()=>t.onSaveKey(e.skillKey)}
                >
                  ${g(`skillsPage.saveKey`)}
                </button>
              </div>
            `:y}

      <div
        style="border-top: 1px solid var(--border); padding-top: 12px; display: grid; gap: 6px; font-size: 12px; color: var(--muted);"
      >
        <div><span style="font-weight: 600;">${g(`skillsPage.source`)}</span> ${e.source}</div>
        <div style="font-family: var(--mono); word-break: break-all;">${e.filePath}</div>
        ${o?b`<div>
                <a href="${o}" target="_blank" rel="noopener noreferrer"
                  >${e.homepage}</a
                >
              </div>`:y}
      </div>
    </div>`)}function fn(e,t,n){let r=e.clawhub;if(!r)return y;if(r.status===`invalid`)return b`<div class="callout danger">
      <div style="font-weight: 600; margin-bottom: 4px;">${g(`skillsPage.invalidLink`)}</div>
      <div>${c(r.reason)}</div>
    </div>`;let i=te(n?.securityAuditUrl??``,window.location.href),a=n?.reasons?.length?c(n.reasons.join(`, `)):null,o=t.state.clawhubVerdictsError||a,s=rn(n,t.state.clawhubVerdictsLoading),l=`${r.ownerHandle?`@${r.ownerHandle}/`:``}${r.slug}@${r.installedVersion}`;return b`
    <div
      class="callout"
      style="display: grid; gap: 8px; border-color: var(--border); background: var(--panel-strong);"
    >
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span class="chip ${s.chipClass}">${s.label}</span>
        <span class="muted" style="font-size: 12px;">${l}</span>
        ${t.state.clawhubVerdictsLoading&&n?b`<span class="muted">${g(`skillsPage.refreshing`)}</span>`:y}
      </div>
      ${o?b`<div class="muted" style="font-size: 13px;">${o}</div>`:y}
      ${i?b`<div style="font-size: 13px;">
              <a href="${i}" target="_blank" rel="noopener noreferrer"
                >${g(`skillsPage.fullSecurityReport`)}</a
              >
            </div>`:y}
    </div>
  `}function pn(e,t){if(!e.skillCard?.present)return y;let n=t.state.skillCardContents[e.skillKey];if(n===void 0){let n=t.state.skillCardErrors[e.skillKey];return n?b`<div class="callout danger" role="alert">${n}</div>`:b`<div class="muted" role="status" style="font-size: 13px;">
      ${t.state.skillCardLoadingKey===e.skillKey?g(`skillsPage.loadingSkillCard`):g(`skillsPage.skillCardNotLoaded`)}
    </div>`}return b`
    <article
      class="sidebar-markdown"
      style="max-width: 100%; overflow-wrap: anywhere;"
      @click=${Ne}
    >
      ${A(Ie(n))}
    </article>
  `}var mn;function hn(){return(hn=e((()=>{x(),w(),De(),ze(),_(),Me(),le(),Ve(),N(),i(),ye(),E(),m(),o(),ne(),at(),nt(),tn(),J(),D(),ve(),mn=[{id:`all`,labelKey:`skillsPage.tabs.all`},{id:`ready`,labelKey:`skillsPage.tabs.ready`},{id:`needs-setup`,labelKey:`skillsPage.tabs.needsSetup`},{id:`disabled`,labelKey:`skillsPage.tabs.disabled`}]})))()}var $;function gn(){return(gn=e((()=>{Se(),Oe(),x(),fe(),ie(),ae(),_(),N(),Le(),i(),m(),_e(),K(),Ue(),r(),n(),We(),dt(),ct(),Bt(),Xt(),hn(),$=class extends d{constructor(...e){super(...e),this.surface=`settings`,this.skillsAgentId=null,this.skillsAgentRevision=0,this.skillsLoading=!1,this.skillsReport=null,this.skillsError=null,this.skillOperation=null,this.skillsFilter=``,this.skillsStatusFilter=`all`,this.skillEdits={},this.skillMessages={},this.skillsDetailKey=null,this.skillsDetailTab=`overview`,this.clawhubSearchQuery=``,this.clawhubDetail=null,this.clawhubDetailRef=null,this.clawhubDetailLoading=!1,this.clawhubDetailError=null,this.clawhubInstallMessage=null,this.clawhubVerdicts={},this.clawhubVerdictsLoading=!1,this.clawhubVerdictsError=null,this.skillCardContents={},this.skillCardContentKeys={},this.skillCardLoadingKey=null,this.skillCardErrors={},this.clawhubIconUrls={},this.clawhubSearchTimer=null,this.routeDataInitialized=!1,this.routeDataEnabled=!0,this.debouncedClawHubSearchQuery=``,this.gateway=new He(this,{getGateway:()=>this.context?.gateway,invalidateRequests:()=>this.resetLoadedSkillState(),ensureInitialData:()=>this.ensureInitialData()}),this.clawhubIcons=new qe({kind:`catalog`,getFetchContext:()=>$e(this.context),isConnected:()=>this.gateway.connected,onUrlsChange:e=>{this.clawhubIconUrls=e}}),this.library=new zt(this,this.gateway,()=>this.context?.config),this.clawhubSearchTask=new Te(this,{args:()=>[this.gateway.connected&&!this.clawhubSearchTimer&&this.surface===`discovery`?this.gateway.client:null,this.debouncedClawHubSearchQuery,this.gateway.epoch],task:([e,t],{signal:n})=>e?gt(e,t,n):Ee}),this.subscriptions=new t(this).watchStore(()=>this.context?.config).effect(()=>this.context?.agents,e=>{let t=e.subscribe(()=>{this.reconcileAgentState(),this.ensureInitialData(),this.requestUpdate()});return this.reconcileAgentState(),this.ensureInitialData(),t}).watchStore(()=>this.context&&this.agentSelection,()=>{let e=this.skillsAgentId;this.reconcileAgentState(),this.routeDataInitialized&&e!==this.skillsAgentId&&(this.routeDataEnabled=!1,this.ensureInitialData())})}get runtimeConfig(){return this.context.runtimeConfig}get client(){return this.gateway.client}get connected(){return this.gateway.connected}willUpdate(e){e.has(`routeData`)&&(this.applyRouteData(),this.ensureInitialData())}updated(){this.clawhubIcons.syncCatalog([],[...(this.clawhubSearchResults??[]).flatMap(e=>e.icon?[e.icon]:[]),...this.clawhubDetail?.skill?.icon?[this.clawhubDetail.skill.icon]:[],...this.clawhubDetail?.owner?.image?[this.clawhubDetail.owner.image]:[]])}disconnectedCallback(){this.subscriptions.clear(),this.clearClawHubSearchTimer(),this.clawhubIcons.reset(),super.disconnectedCallback()}get agentSelection(){return this.surface===`settings`?this.context.settingsAgentSelection:this.context.agentSelection}reconcileAgentState(){let e=this.context.agents.state,t=this.skillsAgentId;H(this,this.agentSelection.state.selectedId),this.surface===`discovery`&&e.agentsList&&Ct(this,e.agentsList),t!==this.skillsAgentId&&(this.skillsDetailKey=null,this.skillsDetailTab=`overview`,Ft(this))}resetLoadedSkillState(){this.library.reset(),this.clawhubSearchTask.abort(),this.clearClawHubSearchTimer(),this.routeDataInitialized&&(this.routeDataEnabled=!1),this.skillsAgentId=null,this.skillsAgentRevision++,this.skillsLoading=!1,this.skillsReport=null,this.skillsError=null,this.skillOperation=null,this.skillEdits={},this.skillMessages={},this.skillsDetailKey=null,this.skillsDetailTab=`overview`,this.debouncedClawHubSearchQuery=this.clawhubSearchQuery.trim(),this.clawhubDetail=null,this.clawhubDetailRef=null,this.clawhubDetailLoading=!1,this.clawhubDetailError=null,this.clawhubInstallMessage=null,this.clawhubVerdicts={},this.clawhubVerdictsLoading=!1,this.clawhubVerdictsError=null,this.skillCardContents={},this.skillCardContentKeys={},this.skillCardLoadingKey=null,this.skillCardErrors={},this.clawhubIcons.reset()}applyRouteData(){let e=this.routeData;if(!e)return;if(this.routeDataInitialized=!0,this.routeDataEnabled=!0,!this.gateway.isRouteDataCurrent(e)||e.agents!==this.context.agents){this.routeDataEnabled=!1;return}let t=this.agentSelection.state;if(this.agentSelection.intentRevision!==e.selectionIntentRevision){this.routeDataEnabled=!1,this.reconcileAgentState();return}if(H(this,e.selectedAgentId),e.selectedAgentId&&t.selectedId!==e.selectedAgentId&&this.agentSelection.set(e.selectedAgentId),this.reconcileAgentState(),this.skillsAgentId!==e.selectedAgentId){this.routeDataEnabled=!1;return}this.routeDataEnabled=!0,this.skillsLoading=!1,this.skillsReport=e.report,this.skillsError=e.error,e.report&&Ot(this,e.report),e.clawhubRef&&e.clawhubRef!==this.clawhubDetailRef&&Pt(this,e.clawhubRef)}ensureInitialData(){if(this.library&&!this.library.list&&!this.library.loading&&!this.library.error&&this.library.load(),this.routeDataEnabled||!this.routeDataInitialized||!this.gateway.connected||!this.gateway.client)return;let e=this.context.agents.state;if(!e.agentsList){e.agentsLoading||this.loadAgents();return}this.reconcileAgentState(),!this.skillsReport&&!this.skillsLoading&&U(this)}async loadAgents(){if(!this.gateway.client||!this.gateway.connected)return;let e=this.context.agents;e.state.agentsList||await e.ensureList(),this.context.agents===e&&(this.reconcileAgentState(),this.ensureInitialData())}async refreshPage(){await Promise.all([Tt(this,()=>this.loadAgents()),this.library.load()])}changeClawHubQuery(e){this.clawhubSearchQuery=e,this.clawhubInstallMessage=null,this.clearClawHubSearchTimer(),this.clawhubSearchTimer=setTimeout(()=>{this.clawhubSearchTimer=null,this.debouncedClawHubSearchQuery=e.trim(),this.requestUpdate()},300),this.requestUpdate()}clearClawHubSearchTimer(){this.clawhubSearchTimer&&=(clearTimeout(this.clawhubSearchTimer),null)}get clawhubSearchResults(){return this.clawhubSearchTask.status===j.COMPLETE&&this.debouncedClawHubSearchQuery===this.clawhubSearchQuery.trim()?this.clawhubSearchTask.value??null:null}get clawhubSearchLoading(){return this.clawhubSearchTimer!==null||this.clawhubSearchTask.status===j.PENDING}get clawhubSearchError(){if(this.clawhubSearchTask.status!==j.ERROR||this.debouncedClawHubSearchQuery!==this.clawhubSearchQuery.trim())return null;let e=this.clawhubSearchTask.error;return h(e)}changeDetailTab(e){this.skillsDetailTab=e,e===`card`&&this.skillsDetailKey&&Dt(this,this.skillsDetailKey)}canUpdateSkills(){return T(this.context?.gateway?.snapshot,`skills.update`,`operator.admin`)}canInstallSkills(){return T(this.context?.gateway?.snapshot,`skills.install`,`operator.admin`)}canInstallFromClawHub(){return this.library.list!==null&&!this.library.loading&&(this.library.showWorkspace?this.canInstallSkills():this.library.canWrite&&!!this.library.list.profileId)}navigateSkills(e){this.context.navigate(e,{search:this.skillsAgentId?`?agent=${encodeURIComponent(this.skillsAgentId)}`:``})}render(){let e=this.context.agents.state,t=this.skillsError??e.agentsError;return b`
      ${this.surface===`discovery`?lt({active:`skills`,onSelect:e=>{e!==`skills`&&this.context.navigate(e)},secondaryAction:{label:g(`skillDiscovery.settings`),icon:v.settings,onClick:()=>this.navigateSkills(`skill-settings`)}}):je({title:oe(`skill-settings`),subtitle:ue(`skill-settings`)})}
      ${Be(b`
        <div
          id=${this.surface===`discovery`?ut:y}
          role=${this.surface===`discovery`?`tabpanel`:y}
          aria-labelledby=${this.surface===`discovery`?`plugins-tab-skills`:y}
        >
          ${on({state:this,surface:this.surface,libraryEntries:this.library.list?.entries??[],onLibraryOpen:e=>void this.library.open(e),library:this.surface===`discovery`?b`
                    ${Kt(this.library)}
                    ${X(this.library)}
                  `:Gt(this.library,b`
                      <button
                        type="button"
                        class="btn"
                        @click=${()=>this.navigateSkills(`skills`)}
                      >
                        ${v.search} ${g(`skillDiscovery.search`)}
                      </button>
                      <button
                        type="button"
                        class="btn"
                        @click=${()=>this.context.navigate(`skill-workshop`)}
                      >
                        ${g(`pluginsPage.workshopTab`)}
                      </button>
                    `),showInventory:this.library.showWorkspace,canUpdate:this.canUpdateSkills(),canInstall:this.canInstallFromClawHub(),loading:this.skillsLoading||e.agentsLoading||this.library.busy,error:t,onFilterChange:e=>this.skillsFilter=e,onStatusFilterChange:e=>this.skillsStatusFilter=e,onRefresh:()=>void this.refreshPage(),onToggle:(e,t)=>{this.canUpdateSkills()&&At(this,e,t,()=>this.canUpdateSkills())},onEdit:(e,t)=>{this.canUpdateSkills()&&kt(this,e,t)},onSaveKey:e=>{this.canUpdateSkills()&&Mt(this,e,()=>this.canUpdateSkills())},onInstall:(e,t,n)=>{this.canInstallSkills()&&Nt(this,e,t,n)},onDetailOpen:e=>{this.skillsDetailKey=e,this.skillsDetailTab=`overview`},onDetailClose:()=>this.skillsDetailKey=null,onDetailTabChange:e=>this.changeDetailTab(e),onClawHubQueryChange:e=>this.changeClawHubQuery(e),onClawHubDetailOpen:e=>void Pt(this,e),onClawHubDetailClose:()=>Ft(this),onClawHubInstall:(e,t)=>{this.canInstallFromClawHub()&&(this.library.showWorkspace?It(this,e,t):(this.clawhubDetailRef=null,this.library.importSource={slug:e,version:t},this.library.importSlug=``,this.library.importOpen=!0,this.requestUpdate()))}})}
        </div>
      `)}
    `}},O([xe({context:ce,subscribe:!0})],$.prototype,`context`,void 0),O([pe({attribute:!1})],$.prototype,`routeData`,void 0),O([pe({attribute:!1})],$.prototype,`surface`,void 0),O([C()],$.prototype,`skillsAgentId`,void 0),O([C()],$.prototype,`skillsAgentRevision`,void 0),O([C()],$.prototype,`skillsLoading`,void 0),O([C()],$.prototype,`skillsReport`,void 0),O([C()],$.prototype,`skillsError`,void 0),O([C()],$.prototype,`skillOperation`,void 0),O([C()],$.prototype,`skillsFilter`,void 0),O([C()],$.prototype,`skillsStatusFilter`,void 0),O([C()],$.prototype,`skillEdits`,void 0),O([C()],$.prototype,`skillMessages`,void 0),O([C()],$.prototype,`skillsDetailKey`,void 0),O([C()],$.prototype,`skillsDetailTab`,void 0),O([C()],$.prototype,`clawhubSearchQuery`,void 0),O([C()],$.prototype,`clawhubDetail`,void 0),O([C()],$.prototype,`clawhubDetailRef`,void 0),O([C()],$.prototype,`clawhubDetailLoading`,void 0),O([C()],$.prototype,`clawhubDetailError`,void 0),O([C()],$.prototype,`clawhubInstallMessage`,void 0),O([C()],$.prototype,`clawhubVerdicts`,void 0),O([C()],$.prototype,`clawhubVerdictsLoading`,void 0),O([C()],$.prototype,`clawhubVerdictsError`,void 0),O([C()],$.prototype,`skillCardContents`,void 0),O([C()],$.prototype,`skillCardContentKeys`,void 0),O([C()],$.prototype,`skillCardLoadingKey`,void 0),O([C()],$.prototype,`skillCardErrors`,void 0),O([C()],$.prototype,`clawhubIconUrls`,void 0),customElements.get(`zero-skills-page`)||customElements.define(`zero-skills-page`,$)})))()}gn();
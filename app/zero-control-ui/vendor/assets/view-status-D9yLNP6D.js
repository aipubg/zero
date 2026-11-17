import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gu as t,Nu as n,Pu as r,Wu as i,_u as a,bl as o,ju as s,ll as c,lt as l,pl as u,ut as d,vl as f,vu as p,xl as m,xu as h,yu as g,zu as _}from"./control-ui-core-DCNBgr3X.js";import{ca as v,la as ee,sa as y,ua as b}from"./control-ui-core-DwX5Mpz4.js";import{D as x,E as te,G as S,J as C,W as w,X as ne,Z as re,at as T,k as E,n as ie,rt as ae,t as oe}from"./lit-runtime-B40xFCK_.js";import{At as se,Lt as ce,Vt as le,ct as ue,jt as de,kt as fe,st as pe,zt as me}from"./control-ui-boot-shared-BX8huZUb.js";import{Hr as D,Ir as he,Vr as ge,Zr as O,ya as k}from"./ui-AaV6iNVa.js";import{F as _e,M as ve,N as ye,j as be}from"./control-ui-boot-shared-E4pYPcWx.js";import{Ci as A,I as j,Si as M,Ti as N,Z as P}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Cl as F,Dl as xe,El as Se,Tl as Ce,wl as I}from"./control-ui-boot-shared-CzJHozXQ.js";import{n as L,t as R}from"./en-settings-6vMW9YZk.js";import{n as we,t as Te}from"./wizard-login-controller-tM2ShtC6.js";import{n as Ee,t as De}from"./provider-usage-BWloZvo9.js";function Oe(e,t){return{onPrimaryChange:n=>{t({primary:n,fallbacks:e().fallbacks.filter(e=>e!==n)})},onFallbackChange:n=>{t({fallbacks:n?[n,...e().fallbacks.slice(1).filter(e=>e!==n)]:[]})},onUtilityChange:e=>t({utilityModel:e}),onDecisionChange:e=>t({decisionModel:e}),onThinkingChange:e=>t({thinkingLevel:e,thinkingOverridden:!0}),onThinkingReset:()=>t({thinkingLevel:void 0,thinkingOverridden:!1}),onFastModeChange:e=>t({fastMode:e,fastModeOverridden:!0}),onFastModeReset:()=>t({fastMode:void 0,fastModeOverridden:!1})}}function ke(e){let t=e?.thinkingDefault,n=e?.fastModeDefault;return{thinkingLevel:typeof t==`string`?t:void 0,thinkingOverridden:e!==null&&Object.hasOwn(e,`thinkingDefault`),fastMode:n===`auto`||n===`ultrafast`||typeof n==`boolean`?n:void 0,fastModeOverridden:e!==null&&Object.hasOwn(e,`fastModeDefault`)}}function Ae(e){return{agents:{defaults:{...e.primary?{model:e.fallbacks.length>0?{primary:e.primary,fallbacks:[...e.fallbacks]}:e.primary}:{},utilityModel:e.utilityModel,...e.decisionModel===void 0?{}:{decisionModel:e.decisionModel},thinkingDefault:e.thinkingOverridden&&e.thinkingLevel?e.thinkingLevel:null,fastModeDefault:e.fastModeOverridden&&e.fastMode!==void 0?e.fastMode:null}}}}function je(e,t){if(t.length===1)return t[0];let n=t.some(e=>e.status===`ok`)?`ok`:H.find(e=>t.some(t=>t.status===e))??`unknown`,r=t.find(e=>e.status===n)?.error;return{provider:e,status:n,...r?{error:r}:{},results:t.flatMap(e=>e.results.map(t=>({...t,label:`${e.provider}: ${t.label}`})))}}function Me(e){let t=e.runtimeConfig.state,n=e.overlays.snapshot;return t.configLoading||t.configSaving||t.configApplying||n.updateRunning||n.updateReconciliationPending}function Ne(e){let t=e.gateway.snapshot;if(t.phase!==`connected`)return _(`modelProviders.readOnly.disconnected`);if(e.runtimeConfig.canPatch!==!0)return _(`modelProviders.readOnly.adminRequired`);let n=e.runtimeConfig.state;return!t.client||n.client!==t.client||!o(n)?_(`modelProviders.configUnavailable`):null}function z(e){return g(e,_(`modelProviders.requestFailed`))}async function B(e,t){let n=e.value.warning?[e.value.warning]:[];if(!e.refresh.ok)n.push(e.refresh.error);else try{let e=await t();e&&n.push(e)}catch(e){n.push(z(e))}return n.length?n.join(` `):null}async function Pe(e,t){let{runtimeConfig:n}=e;e.setBusy(!0),e.setMessage(null);try{if(await n.ensureLoaded(),!e.isCurrentClient())return;let r=await n.patch({raw:t.raw,note:t.note,...t.replacePaths?{replacePaths:t.replacePaths}:{}});if(!e.isCurrentClient())return;!r&&e.isCurrentAgent()&&e.setMessage({kind:`error`,text:n.state.lastError??_(`modelProviders.configUnavailable`)})}catch(t){e.isCurrentClient()&&e.isCurrentAgent()&&e.setMessage({kind:`error`,text:z(t)})}finally{e.isCurrentClient()&&e.isCurrentAgent()&&e.setBusy(!1)}}async function Fe(e,t){let n=()=>e.isCurrentClient()&&e.isCurrentAgent();e.setBusy(!0),e.setMessage(null);try{let r=await e.runtimeConfig.runExternalMutation(async e=>{if(e!==t.client)throw Error(_(`modelProviders.requestFailed`));let n={provider:t.provider,agentId:t.agentId},r=await(t.apiKey===null?e.request(`models.authLogout`,{...n,credentialType:`api_key`}):e.request(`models.authSetApiKey`,{...n,apiKey:t.apiKey}));return d(e),r},{canDispatch:()=>n()&&e.canMutate()});if(!n())return{ok:!1};if(!r.ok)return e.setMessage({kind:`error`,text:r.error}),{ok:!1};let i=await B(r,()=>e.refreshProviders());return n()?(e.setMessage({kind:`success`,text:t.success,...i?{warning:i}:{}}),{ok:!0,warning:i}):{ok:!1}}finally{n()&&e.setBusy(!1)}}var V,H;function U(){return(U=e((()=>{r(),m(),h(),l(),V=[`agents.defaults.model.fallbacks`],H=[`auth`,`billing`,`rate_limit`,`timeout`,`format`,`no_model`,`unknown`]})))()}function W(e,t){return e.find(e=>t.some(t=>e.ids.has(t)))}function Ie(e,t,n){let r=W(e,[t]);if(r)return r;let i={ids:new Set([t]),card:{id:t,displayName:n,profiles:[],profileProviderIds:{},profileOrders:{},profileOrderExplicitProviders:[],profileOrderStoredProviders:[],profileOrderLocks:{},credentialProviderIds:[],logoutTargets:[],hasConfigApiKey:!1,modelCount:0,availableModelCount:0},hasModelAuth:!1};return e.push(i),i}function Le(e,t){let n=D(t);n&&!e.some(e=>D(e)===n)&&e.push(t)}function Re(e,t,n){if(n.length===0)return;let r=D(t),i=e.find(e=>D(e.provider)===r);if(!i){e.push({provider:t,profileIds:[...new Set(n)]});return}i.profileIds=[...new Set([...i.profileIds,...n])]}function ze(e){let t=[],n=(e,n)=>{let r=F(e);return r?Ie(t,r,n||A(r)):void 0},r=new Map,i=new Map,a=new Set;for(let t of e.authStatus?.providerCapabilities??[]){let e=F(t.provider);e&&r.set(e,r.get(e)===!0||t.apiKeySupported)}for(let t of e.configProviders??[]){let e=n(t.key)?.card;e&&(e.configKey??=t.key,t.hasApiKey&&(e.configKey=t.key,e.hasConfigApiKey=!0,Le(e.credentialProviderIds,t.key)),t.authMode!==void 0&&(e.configAuthMode=t.authMode))}for(let t of e.pendingProviders??[]){let e=n(t);e&&(e.card.checkingModels=!0)}for(let t of e.providerOutcomes??[]){let e=n(t.provider);if(!e)continue;let r=e.catalogOutcome,i=t.profileId===void 0,a=We[i?`provider`:`profile`];(!r||(i===(r.profileId===void 0)?a.indexOf(t.status)<a.indexOf(r.status):i))&&(e.catalogOutcome=t)}for(let t of e.models??[]){let e=n(t.provider);e&&(e.card.modelCount+=1,t.available===!0&&(e.card.availableModelCount+=1))}for(let n of e.authStatus?.providers??[]){let e=F(n.provider);if(!e)continue;let o=n.usage?F(n.usage.providerId):e,s=[...new Set([e,o])],c=W(t,s)??Ie(t,o,A(o));for(let e of s)c.ids.add(e);if(c.card.displayName=n.displayName||c.card.displayName,c.card.profiles.push(...n.profiles),n.profiles.length>0){let e=n.authProvider||n.provider;for(let t of n.profiles)c.card.profileProviderIds[t.profileId]=e;n.profileOrder!==void 0&&a.add(e);let t=n.profileOrder??n.profiles.map(e=>e.profileId);i.set(e,[...new Set([...i.get(e)??[],...t])]),c.card.profileOrders[e]=t,n.profileOrderStored===!0&&!c.card.profileOrderStoredProviders.includes(e)&&c.card.profileOrderStoredProviders.push(e),n.profileOrderLocked!==void 0&&(c.card.profileOrderLocks[e]??=n.profileOrderLocked)}(n.apiKey||n.profiles.length>0)&&Le(c.card.credentialProviderIds,n.provider),Re(c.card.logoutTargets,n.provider,n.profiles.filter(e=>e.logoutSupported===!0).map(e=>e.profileId)),c.card.apiKey??=n.apiKey,c.hasModelAuth||=Ce(n)||r.has(e);let l=n.usage;l&&!c.card.usage&&(c.card.usage={provider:l.providerId,displayName:n.displayName,windows:l.windows,...l.summary?{summary:l.summary}:{},...l.plan?{plan:l.plan}:{},...l.billing?.length?{billing:l.billing}:{}})}for(let e of t){e.card.profileOrderExplicitProviders=Object.keys(e.card.profileOrders).filter(e=>a.has(e));for(let t of Object.keys(e.card.profileOrders)){let n=i.get(t);n&&(e.card.profileOrders[t]=n)}}for(let n of Se(e.authStatus?.providers??[])){let e=W(t,[F(n.provider)]);e&&(e.card.auth={kind:n.status===`static`?`api-key`:n.status,...n.expiry?.label?{expiryLabel:n.expiry.label}:{}})}for(let t of e.providerUsage?.providers??[]){let e=n(t.provider,t.displayName);e&&(e.card.usage=t)}for(let t of e.costByProvider??[]){let e=n(t.provider??``);if(!e)continue;let r=e.card.localCost??={totalCost:0,totalTokens:0,messageCount:0};r.totalCost+=t.totals.totalCost,r.totalTokens+=t.totals.totalTokens,r.messageCount+=t.count}return t.filter(t=>t.hasModelAuth||(e.configProviders??[]).some(({key:e})=>F(e)===t.card.id)||!!t.card.usage||t.card.modelCount>0||!!t.catalogOutcome||t.card.checkingModels||(t.card.localCost?.totalTokens??0)>0).map(e=>{let t=r.get(e.card.id);return Object.assign({},e.card,e.catalogOutcome?{catalogStatus:e.catalogOutcome.status}:{},t===void 0?{}:{apiKeySupported:t})}).toSorted((e,t)=>e.displayName.localeCompare(t.displayName))}function Be(e,t,n){if(e.retired||e.modelSelectionPolicy?.restricted)return{defaults:{...t,primary:e.modelSelectionPolicy?.defaultModel??``,fallbacks:[],utilityModel:null,decisionModel:null},configuredModels:e.models.filter(e=>e.manualSelectionAllowed!==!1)};let r=n??t;return{defaults:r,configuredModels:Ve(e.hasSnapshot?e.models:null,r)}}function G(e){return e.selectionRef===void 0?e.id.startsWith(`${e.provider}/`)?e.id:`${e.provider}/${e.id}`:e.selectionRef}function Ve(e,t){let n=new Set([t.primary,...t.fallbacks,t.utilityModel].filter(e=>typeof e==`string`&&e.length>0)),r=(e??[]).filter(e=>e.available!==!1||n.has(G(e))),i=new Set(r.map(G)),a=e===null?{}:{available:!1};for(let t of n){if(i.has(t))continue;let{model:n,profile:o}=he(t);if(o){let i=(e??[]).find(e=>G(e)===n);if(i){r.push({...i,selectionRef:t});continue}}let s=t.indexOf(`/`);if(s<=0||s===t.length-1){let n=t.trim().toLowerCase(),i=(e??[]).find(e=>e.alias?.trim().toLowerCase()===n||e.id.trim()===t.trim());r.push({...i??{provider:``,id:t,name:t,...a},selectionRef:t});continue}r.push({provider:t.slice(0,s),id:t.slice(s+1),name:t,...a})}return r}function He(e){let t=k(e?.models),n=k(t?.providers),r=k(e?.agents),i=k(r?.defaults),a=i?.model,o=k(a),s=typeof a==`string`?a:typeof o?.primary==`string`?o.primary:``,c=Array.isArray(o?.fallbacks)?o.fallbacks.filter(e=>typeof e==`string`):[];return{providers:Object.entries(n??{}).map(([e,t])=>{let n=k(t),r={key:e,hasApiKey:n?Object.hasOwn(n,`apiKey`)&&n.apiKey!=null:!1};return typeof n?.auth==`string`&&(r.authMode=n.auth),r}),defaults:{primary:s,fallbacks:c,utilityModel:typeof i?.utilityModel==`string`?i.utilityModel:null,...typeof i?.decisionModel==`string`?{decisionModel:i.decisionModel}:{}}}}function Ue(e,t){let n=new Set(Array.from(t,F)),r=new Map;for(let t of e??[]){let e=F(t.provider);t.quickApiKeySetup&&e&&!n.has(e)&&!r.has(e)&&r.set(e,{id:e,displayName:A(e)})}return[...r.values()].toSorted((e,t)=>e.displayName.localeCompare(t.displayName))}var We;function K(){return(K=e((()=>{ge(),M(),I(),We={provider:[`auth-rejected`,`unavailable`,`ready`],profile:[`ready`,`auth-rejected`,`unavailable`]}})))()}var q,Ge;function Ke(){return(Ke=e((()=>{t(),q={modelSetup:{discovery:{title:`On this Gateway`,description:`Find existing connections or prepare a local model for {agent}. Using a model here changes this agent, not the global defaults.`,useForAgent:`Test & use for this agent`,connectForAgent:`Connect & use for this agent`,connectProvider:`Connect provider`,returnToModels:`Return to Models`,otherSoftware:`Other detected software`},verify:{title:`Selected model`,button:`Check model`,retry:`Try again`,checkAgain:`Check again`,checkingButton:`Checking…`,checking:`Checking — asking {modelRef} for a quick reply…`,ready:`Ready`,readyIn:`Ready · {latencyMs} ms`,providerUnavailable:`{provider} isn’t responding.`},nativeDiscovery:{title:`Discover existing conversations`,body:`Show native assistant conversations from this Gateway host in Zero. This is discovery, not an import or copy.`,enable:`Show existing native conversations`,decline:`Leave unchecked to keep native session catalogs off when you connect your AI provider. Existing installations are not changed.`},success:{title:`Connection verified`,body:`Zero received a real reply from {modelRef}. You can start chatting now.`,activeModel:`Active model`,latency:`Verified in {latencyMs} ms`,openChat:`Start chatting`,continueSetup:`Continue setup`,stayHere:`Stay in settings`,configuredModel:`Configured model`},utility:{role:`Setup & utility`,hint:`Helps set up Zero and handles lightweight tasks. Regular chats need a primary model.`,useSetup:`Use for setup`,useUtility:`Use as utility`,ready:`Setup & utility model ready`,configured:`Setup & utility model`,verified:`Zero received a real reply from {modelRef}. This model is ready for setup and lightweight tasks.`,model:`Utility model`,choosePrimary:`Choose a primary model below for regular chats. Your setup assistant remains available.`,primaryReady:`This model handles setup and lightweight tasks. Regular chats use your primary model.`,openAssistant:`Open setup assistant`,repair:`Recheck & repair`}}},Ge=Object.assign(()=>{Object.assign(i.modelSetup,q.modelSetup)},{catalog:q})})))()}function qe({providers:e,authStatus:t,allowQuickApiKey:n,manualProviders:r}){let i=new Map,a=new Set,o=(e,t)=>{let n=i.get(e)??{id:e,label:``,choices:[],authProviders:[]};return n.authProviders.includes(t)||n.authProviders.push(t),i.set(e,n),n};for(let r of t?.providerCapabilities??[])if(!e||e.includes(r.provider)){for(let e of r.loginOptions??[]){let t=o(e.brandId,r.provider);t.label||=e.groupLabel?.trim()??``,a.has(e.id)||(a.add(e.id),t.choices.push(e))}if(r.quickApiKeySetup&&n){let e=r.loginOptions?.length?r.loginOptions.map(e=>e.brandId):[r.provider];for(let t of new Set(e)){let e=o(t,r.provider);e.apiKeyProvider??=r.provider}}}for(let t of r??[]){let n=t.brandId??t.id;if(a.has(t.id)||e&&!e.includes(n))continue;let r=o(n,n);r.label||=t.groupLabel?.trim()||t.label;let i=r.choices.some(e=>e.label===t.label);r.choices.push({...t,brandId:n,kind:`setup-secret`,featured:!1,...i?{label:_(`modelSetup.manual.accessValueFor`,{provider:t.label}),hint:_(`modelSetup.manual.accessValuePlaceholder`)}:{}}),a.add(t.id)}for(let e of i.values())e.label||=A(e.id);return[...i.values()].toSorted((e,t)=>e.label.localeCompare(t.label)||e.id.localeCompare(t.id))}function Je(){return(Je=e((()=>{M(),r()})))()}var J;function Ye(){return(Ye=e((()=>{be(),w(),re(),v(),De(),r(),h(),n(),J=class extends s{constructor(...e){super(...e),this.client=null,this.agentId=``,this.profileId=``,this.refresh=0,this.usage=new ve(this,{args:()=>[this.client,this.agentId,this.profileId,this.refresh],task:([e,t,n],{signal:r})=>e&&t&&n?e.request(`codex.accountUsage`,{agentId:t,profileId:n},{signal:r,timeoutMs:3e4}):ye})}refreshUsage(){this.refresh+=1}render(){return this.client?C`
      <div class="model-providers__account-usage">
        <button
          class="model-providers__account-refresh"
          type="button"
          aria-label=${_(`common.refresh`)}
          title=${_(`common.refresh`)}
          ?disabled=${this.usage.status===_e.PENDING}
          @click=${()=>this.refreshUsage()}
        >
          ${y.refresh}
        </button>
        ${this.usage.render({pending:()=>C`<span>${_(`common.loading`)}</span>`,complete:e=>e.providers.length===0?C`<span>${_(`modelProviders.noStats`)}</span>`:e.providers.map(e=>C`
                    ${e.plan?C`<strong>${e.plan}</strong>`:S}
                    <div>
                      ${e.windows.length||e.billing?.length?Ee(e,{groupWindows:!0}):_(`modelProviders.noStats`)}
                    </div>
                  `),error:e=>C`<span class="provider-usage-error">${g(e)}</span>`})}
      </div>
    `:S}},O([T({attribute:!1})],J.prototype,`client`,void 0),O([T()],J.prototype,`agentId`,void 0),O([T()],J.prototype,`profileId`,void 0),O([ae()],J.prototype,`refresh`,void 0),customElements.get(`zero-model-account-usage`)||customElements.define(`zero-model-account-usage`,J)})))()}function Xe(e){p({placement:`bottom`,message:z(e),icon:y.alertTriangle,durationMs:12e3})}function Ze(e){p({placement:`bottom`,message:[_(`modelProviders.logout.done`),e].filter(Boolean).join(` `),icon:y.check})}function Y(e){if(e.apiKey?.source===`config`)return _(`modelProviders.credentials.configKey`);if(e.apiKey?.source===`env`)return e.apiKey.envVar?_(`modelProviders.credentials.envKeyNamed`,{name:e.apiKey.envVar}):_(`modelProviders.credentials.envKey`)}function Qe(e){let t=[],n=ct.get(e.source??``),r=e.source===`external`?e.displayName||_(`modelProviders.profiles.sourceExternal`):n?_(n):void 0;return r&&e.source!==`saved`&&t.push(r),e.email&&e.displayName&&e.displayName!==r&&t.push(e.displayName),e.lastUsedAt&&t.push(_(`modelProviders.profiles.lastUsed`,{time:ce(Date.now()-e.lastUsedAt)})),t.join(` · `)}function $e(e){let t=(e.split(`@`)[0]??``).split(/[^a-z0-9]+/iu).filter(Boolean);return(t.length>1?`${t[0]?.[0]??``}${t.at(-1)?.[0]??``}`:t[0]?.slice(0,2)??``).toLocaleUpperCase()||`?`}function et(e,t){switch(e.externallyManaged&&(e.status===`expired`||e.status===`expiring`)?`ok`:e.status){case`ok`:return P({kind:t?`muted`:`ok`,label:_(t?`modelProviders.status.configured`:`modelProviders.status.ok`)});case`static`:return P({kind:`ok`,label:_(`modelProviders.status.configured`)});case`expiring`:return P({kind:`warn`,label:_(`modelProviders.status.expiring`)});case`expired`:return P({kind:`danger`,label:_(`modelProviders.status.expired`)});default:return P({kind:`muted`,label:_(`modelProviders.status.missing`)})}}function tt(e,t){return[...new Set(e.profiles.map(t=>e.profileProviderIds[t.profileId]??e.id))].map(n=>{let r=e.profiles.filter(t=>(e.profileProviderIds[t.profileId]??e.id)===n),i=t[n]??e.profileOrders[n]??[],a=new Map(r.map(e=>[e.profileId,e])),o=i.flatMap(e=>{let t=a.get(e);return a.delete(e),t?[t]:[]}),s=i.length===r.length&&o.length===r.length,c=e.profileOrderLocks[n],l=e.profileOrderStoredProviders.includes(n);return{provider:n,order:i,lock:c,complete:s,stored:l,explicit:t[n]!==void 0||e.profileOrderExplicitProviders.includes(n),explanation:c?_(c===`auth-config`?`modelProviders.profiles.priorityManagedByAuth`:`modelProviders.profiles.priorityManagedByProvider`):s?void 0:_(l?`modelProviders.profiles.partialStoredOrder`:`modelProviders.profiles.partialOrder`),profiles:[...o,...a.values()]}})}function nt(e){if(!e.canMove||e.event.button!==0)return;let t=e.event.currentTarget;if(!(t instanceof HTMLElement))return;let n=t.closest(`.model-providers__profile`),r=t.closest(`.model-providers__profiles`);if(!n||!r)return;let i=r.getBoundingClientRect().top,a=[...r.querySelectorAll(`.model-providers__profile`)].filter(t=>t.dataset.profileProvider===e.provider).map(e=>({element:e,bounds:e.getBoundingClientRect()})),o=a.find(e=>e.element===n);if(!o)return;let s=a.filter(e=>e!==o),c,l=`before`;e.event.preventDefault(),r.classList.add(Z),n.classList.add(X);try{t.setPointerCapture?.(e.event.pointerId)}catch{}let u=t=>{if(t.pointerId!==e.event.pointerId)return;let u=i-r.getBoundingClientRect().top,d=t.clientY-e.event.clientY+u;n.style.translate=`${t.clientX-e.event.clientX}px ${d}px`;let f=document.elementFromPoint(t.clientX,t.clientY),p=f?.closest(`.model-providers__profile`),m=t.clientY+u,h=f&&r.contains(f)&&(!p||p.dataset.profileProvider===e.provider)&&a.some(({bounds:e})=>t.clientX>=e.left&&t.clientX<=e.right&&m>=e.top&&m<=e.bottom),g=(d>0?o.bounds.bottom:o.bounds.top)+d;c=h?s.find(({bounds:e})=>g<e.top+e.height/2):void 0,l=c?`before`:`after`,h&&!c&&(c=s.at(-1));let _=c?le(a,o,c,l):a;_.indexOf(o)===a.indexOf(o)&&(c=void 0);let v=a[0]?.bounds.top??0;for(let e of _)e!==o&&(e.element.style.translate=`0px ${v-e.bounds.top}px`),v+=e.bounds.height},d=(n,i)=>{if(n.pointerId!==e.event.pointerId)return;u(n);let a=c?.element.dataset.profileId;r.classList.remove(Z);for(let e of r.querySelectorAll(`.model-providers__profile`))e.classList.remove(X),e.style.removeProperty(`translate`);t.removeEventListener(`pointermove`,u),t.removeEventListener(`pointerup`,f),t.removeEventListener(`pointercancel`,p),t.removeEventListener(`lostpointercapture`,p),document.removeEventListener(`keydown`,m,!0);try{t.releasePointerCapture?.(e.event.pointerId)}catch{}i&&a&&e.move(a,l)},f=e=>d(e,!0),p=e=>d(e,!1),m=t=>{t.key===`Escape`&&(t.preventDefault(),t.stopPropagation(),d(e.event,!1))};t.addEventListener(`pointermove`,u),t.addEventListener(`pointerup`,f),t.addEventListener(`pointercancel`,p),t.addEventListener(`lostpointercapture`,p),document.addEventListener(`keydown`,m,!0)}function rt(e,t){return e.email||e.displayName||_(`modelProviders.profiles.account`,{number:String(t+1)})}function it(e,t,n){let r=Qe(e);return C`
    <span class="model-providers__profile-avatar" aria-hidden="true"
      >${$e(t)}</span
    >
    <div class="model-providers__profile-copy">
      <strong>${t}</strong>
      ${r?C`<span>${r}</span>`:S}
      ${n?C`<details>
              <summary>${_(`modelProviders.profiles.details`)}</summary>
              <div>${e.profileId}</div>
              ${e.expiry?C`<span>${_(`modelProviders.expiresIn`,{time:e.expiry.label})}</span>`:S}
            </details>`:S}
    </div>
  `}function at(e,t){let n=e.flatMap(e=>e.profiles.map(n=>({profile:n,authRejected:e.catalogStatus===`auth-rejected`,canUse:e.profileProviderIds[n.profileId]===t?.authProvider&&(n.source===`saved`||n.source===`inherited`)}))),r=[...new Set(e.map(Y).filter(Boolean))];return C`
    <section
      class="model-provider-login__accounts"
      aria-label=${_(`modelProviders.login.accounts`)}
    >
      <h3>${_(`modelProviders.login.accounts`)}</h3>
      ${n.length?C`
              <div role="list">
                ${n.map(({profile:e,authRejected:n,canUse:r},i)=>C`
                    <div
                      class="model-provider-login__account"
                      role="listitem"
                      data-profile-id=${e.profileId}
                    >
                      ${it(e,rt(e,i),!1)}
                      ${et(e,n)}
                      ${r&&t?C`<button
                              class="btn"
                              data-models-use-account
                              ?disabled=${t.disabled}
                              @click=${()=>t.onUse(e.profileId)}
                            >
                              ${_(`modelProviders.login.useAccount`)}
                            </button>`:S}
                    </div>
                  `)}
              </div>
            `:S}
      ${r.map(e=>C`<p class="muted">${e}</p>`)}
      ${!n.length&&!r.length?C`<p class="muted">${_(`modelProviders.login.noAccounts`)}</p>`:S}
    </section>
  `}function ot(e,t){if(e.profiles.length===0)return S;let n=tt(e,t.profileOrders),r=new Map(e.profiles.map((e,t)=>[e.profileId,rt(e,t)])),i=n.flatMap(e=>e.profiles.map(t=>({group:e,profile:t}))),a=n.some(e=>!e.lock&&e.complete&&e.order.length>1),o=[...new Set(n.flatMap(e=>e.explanation?[e.explanation]:[]))],s=Y(e);return C`
    <section
      class="model-providers__profiles"
      aria-label=${`${_(`modelProviders.profiles.title`)}: ${e.displayName}`}
    >
      <div class="model-providers__profiles-heading">
        <div class="model-providers__profiles-heading-copy">
          <strong>${_(`modelProviders.profiles.title`)}</strong>
          <span
            >${_(i.length===1?`modelProviders.profiles.accountOne`:`modelProviders.profiles.accounts`,{count:String(i.length)})}${s?` · ${s}`:``}</span
          >
          ${a?C`<span>${_(`modelProviders.profiles.reorderHint`)}</span>`:S}
          ${o.map(e=>C`<span>${e}</span>`)}
        </div>
        <div class="model-providers__profiles-heading-actions">
          ${e.profileOrderStoredProviders.map(n=>C`<button
              type="button"
              class="btn btn--sm btn--ghost"
              ?disabled=${!t.canMutate}
              title=${t.canMutate?_(`modelProviders.profiles.resetOrderHint`):t.mutationBlockedReason??``}
              @click=${()=>t.onProfileOrderChange(e.id,n,null)}
            >
              ${_(`modelProviders.profiles.resetOrder`)}
            </button>`)}
          ${t.onAddAccount?C`<button
                  type="button"
                  class="btn btn--sm"
                  ?disabled=${t.addAccountDisabled}
                  @click=${t.onAddAccount}
                >
                  ${_(`modelProviders.profiles.addAccount`)}
                </button>`:S}
        </div>
      </div>
      <div class="model-providers__profile-list" role="list">
        ${ie(i,({profile:e})=>e.profileId,({profile:n,group:i})=>{let{provider:a,order:o,complete:s,lock:c,stored:l,explicit:u}=i,d=o.indexOf(n.profileId),f=t.canMutate&&!c&&s&&o.length>1&&d>=0,p=!c&&(s||l)&&o.length>1,m=r.get(n.profileId),h=e.logoutTargets.find(e=>e.profileIds.includes(n.profileId))?.provider,g=_(`modelProviders.logout.actionFor`,{account:m}),v=t.canMutate?g:t.mutationBlockedReason??``,ee=t.canMutate?i.explanation??``:t.mutationBlockedReason??``,b=(r,i)=>{f&&t.onProfileOrderChange(e.id,a,le(o,n.profileId,r,i))},x=(e,t)=>{let n=o[d+t];if(!f||!n)return;let r=e.currentTarget,i=r instanceof HTMLButtonElement&&document.activeElement===r;b(n,t<0?`before`:`after`),i&&queueMicrotask(()=>{r.isConnected&&document.activeElement===document.body&&r.focus({preventScroll:!0})})};return C`
              <div
                class="model-providers__profile"
                role="listitem"
                data-profile-id=${n.profileId}
                data-profile-provider=${a}
              >
                <span class="model-providers__profile-order">
                  ${p?C`<button
                          type="button"
                          class="model-providers__profile-grip"
                          ?disabled=${!f}
                          aria-label=${_(`modelProviders.profiles.reorder`,{account:m,position:String(d+1)})}
                          aria-keyshortcuts=${f?`ArrowUp ArrowDown`:S}
                          title=${ee||_(`modelProviders.profiles.reorderHint`)}
                          @pointerdown=${e=>nt({event:e,canMove:f,provider:a,move:b})}
                          @keydown=${e=>{(e.key===`ArrowUp`||e.key===`ArrowDown`)&&(e.preventDefault(),x(e,e.key===`ArrowUp`?-1:1))}}
                        >
                          ${y.gripVertical}
                        </button>`:C`<span aria-hidden="true"></span>`}
                  ${u&&s&&d>=0?C`<span
                          class="model-providers__profile-position"
                          aria-label=${_(`modelProviders.profiles.priority`,{position:String(d+1)})}
                          title=${_(`modelProviders.profiles.priority`,{position:String(d+1)})}
                          >${d+1}</span
                        >`:S}
                </span>
                ${it(n,m,!0)}
                ${a===`openai`&&n.type!==`api_key`?C`<zero-model-account-usage
                        .client=${t.usageClient??null}
                        .agentId=${t.usageAgentId??``}
                        .profileId=${n.profileId}
                      ></zero-model-account-usage>`:S}
                <span class="model-providers__profile-status"
                  >${et(n,e.catalogStatus===`auth-rejected`)}</span
                >
                <span class="model-providers__profile-actions">
                  ${n.logoutSupported===!0&&h?C`<button
                          type="button"
                          class="model-providers__profile-logout"
                          aria-label=${g}
                          title=${v}
                          ?disabled=${!t.canMutate||t.busy[`logout:${e.id}`]}
                          @click=${()=>t.onRequestLogout({cardId:e.id,label:m,target:{provider:h,profileIds:[n.profileId]}})}
                        >
                          ${st}
                        </button>`:S}
                </span>
              </div>
            `})}
      </div>
    </section>
  `}var X,Z,st,ct;function Q(){return(Q=e((()=>{w(),Ye(),oe(),ee(),v(),j(),r(),R(),me(),a(),U(),L(),X=`model-providers__profile--dragging`,Z=`model-providers__profiles--sorting`,st=b(ne` <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  <polyline points="16 17 21 12 16 7" />
  <line x1="21" x2="9" y1="12" y2="12" />`),ct=new Map([[`config`,`modelProviders.profiles.sourceConfig`],[`inherited`,`modelProviders.profiles.sourceInherited`],[`saved`,`modelProviders.profiles.sourceSaved`]])})))()}function lt(){return(lt=e((()=>{})))()}var ut;function dt(){return(dt=e((()=>{ge(),w(),te(),M(),we(),r(),R(),c(),m(),de(),h(),l(),I(),K(),Je(),Q(),L(),ut=class{constructor(e,t){this.host=e,this.options=t,this.picker=null,this.searchInput=x(),this.methodChoices=x(),this.focusPicker=null,this.generation=0,this.mutationActive=!1,this.refreshWarning=null,this.mode=`auth`,e.addController(this),this.wizard=new Te(e,{getClient:()=>t.getScope().context.gateway.snapshot.client,getAgentId:()=>t.getScope().agentId,onClose:()=>this.reset(),onAnswer:(e,t)=>void this.run(()=>this.runner.answer(e,t)),onBackgroundCompletion:e=>this.run(()=>Promise.resolve(e),!0),requestFailedMessage:()=>_(`modelProviders.requestFailed`),sessionExpiredMessage:()=>_(`modelProviders.login.sessionExpired`)}),this.runner=this.wizard.runner}get busy(){return this.picker!==null||this.mutationActive||this.wizard.cancelling||this.runner.state.phase!==`idle`}get providerActions(){return{canMutate:this.options.canStart(),loginBusy:this.busy,onConnect:e=>this.open([e.id,...e.credentialProviderIds]),canConnect:e=>this.loginProviders([e.id,...e.credentialProviderIds]).length>0}}get pageActions(){return{onConnect:()=>this.open(),connectDisabled:!this.options.canStart()||this.busy,login:this.render(),loginMessage:this.message}}selectedModel(){let{context:e,agentId:t}=this.options.getScope(),{entry:n,defaults:r}=u(o(e.runtimeConfig.state),t??``);return f(n?.model)??f(r?.model)}missingSelection(){let e=this.selectedModel(),{authStatus:t}=this.options.getScope();if(!e||!t?.ts||t.unavailable)return null;let{model:n,profile:r}=he(e),i=n.indexOf(`/`);if(!r||i<1||t.providers.some(e=>e.profiles.some(e=>e.profileId===r)))return null;let a=D(n.slice(0,i)),o=t.providers.find(e=>D(e.provider)===a)?.authProvider??a;return{model:n,provider:F(a),authProvider:o}}renderRecovery(){let e=this.missingSelection(),t=this.options.getScope().authStatus?.providerCapabilities?.filter(t=>F(t.provider)===e?.provider).map(e=>e.provider);return e?C`<div class="callout warning" role="status" data-models-account-recovery>
          <p>${_(`modelProviders.login.missingSelection`,{model:e.model})}</p>
          <button
            class="btn"
            data-models-recover-account
            ?disabled=${!this.options.canStart()||this.busy}
            @click=${()=>void this.open(t)}
          >
            ${_(`modelProviders.login.chooseAccount`)}
          </button>
        </div>`:S}async activateSavedProfile(e,t){let n=this.selectedModel();if(!this.options.canStart()||this.mutationActive||this.missingSelection()?.model!==t)return;this.picker=null,this.mode=`activate`,this.message=void 0,this.refreshWarning=null;let r=`saved-auth:${encodeURIComponent(e)}`;await this.run(()=>{if(this.selectedModel()!==n)throw Error(_(`modelProviders.login.selectionChanged`));return this.runner.activate({kind:r,modelRef:t},e)})}loginProviders(e,t=this.options.getScope().authStatus){return qe({providers:e,authStatus:t,allowQuickApiKey:!!this.options.onApiKey,manualProviders:this.options.onManualProvider?this.options.getManualProviders?.():void 0})}async open(e,t){if(!this.options.canStart()||this.busy)return;let n=this.options.getScope(),{client:r,hello:i}=n.context.gateway.snapshot;if(!r||!n.agentId)return;let a=++this.generation,o=new AbortController;this.inventoryRequest=o;let s=()=>{let e=this.options.getScope();return a===this.generation&&e.context.gateway.snapshot.client===r&&e.context.gateway.snapshot.hello===i&&e.agentId===n.agentId&&this.options.canContinue()},c={providers:e,providerId:``,query:``,isCurrent:s};this.picker={...c,phase:`loading`},this.focusPicker=null,this.message=void 0,this.host.requestUpdate();try{let i=n.authStatus??await xe(r,{agentId:n.agentId,signal:o.signal});if(s()){let r=this.loginProviders(e,i),a=t?r.find(e=>e.choices.some(e=>e.id===t)):e&&r.length===1?r[0]:void 0;this.picker={...c,phase:`ready`,authStatus:i,providerId:a?.id??``},n.authStatus||(this.focusPicker=a?`method`:`search`)}}catch(e){s()&&(this.picker={...c,phase:`error`,message:g(e,_(`modelProviders.requestFailed`))})}finally{a===this.generation&&(this.inventoryRequest=void 0,s()||(this.picker=null),this.host.requestUpdate())}}reset(){this.generation+=1,this.inventoryRequest?.abort(),this.inventoryRequest=void 0,this.picker=null,this.focusPicker=null,this.mutationActive=!1,this.refreshWarning=null,this.message=void 0,this.mode=`auth`,this.wizard.reset()}hostDisconnected(){this.reset()}hostUpdated(){if(!this.focusPicker||!this.picker)return;let e=this.methodChoices.value,t=this.focusPicker===`search`?this.searchInput.value:e?.querySelector(`button`)??e;this.focusPicker=null,t?.focus({preventScroll:!0})}render(){let e=this.picker;if(e){let t=()=>this.picker===e&&e.phase===`ready`&&e.isCurrent(),n=n=>C`<button
          type="button"
          class="btn model-provider-login__option"
          data-models-login-provider=${n.provider??S}
          ?data-models-login-api-key=${n.apiKey}
          ?disabled=${e.phase!==`ready`||!e.isCurrent()}
          @click=${()=>{t()&&n.onClick()}}
        >
          ${n.provider===void 0?S:N(n.provider,{className:`model-providers__icon`})}
          <span class="model-provider-login__copy">
            <strong>${n.label}</strong>
            ${n.hint===void 0?S:C`<span>${n.hint}</span>`}
          </span>
        </button>`,r=e.phase===`ready`?this.loginProviders(e.providers,e.authStatus):[],i=r.find(t=>t.id===e.providerId),a=i&&e.phase===`ready`?ze({authStatus:e.authStatus,models:null,providerUsage:null,costByProvider:null}).filter(e=>i.authProviders.some(t=>e.id===F(t))):[],o=i?.choices.find(e=>e.docsUrl)?.docsUrl??`http://127.0.0.1:18789/concepts/model-providers`,s=this.missingSelection(),c=s&&a.some(e=>e.id===s.provider)?s:null,l=e.query.trim().toLocaleLowerCase(),u=r.filter(e=>[e.id,e.label,...e.apiKeyProvider?[_(`modelProviders.status.apiKey`)]:[],...e.choices.flatMap(e=>[e.label,e.hint??``])].some(e=>e.toLocaleLowerCase().includes(l)));return C`
        <zero-modal-dialog
          label=${i?.label??_(`modelProviders.login.title`)}
          @modal-cancel=${()=>this.reset()}
        >
          <div class="model-setup-wizard model-provider-login">
            <div class="model-setup-wizard__header">
              <h2 class="model-provider-login__provider">
                ${i?C`${N(i.id,{className:`model-providers__icon`})} ${i.label}`:_(`modelProviders.login.title`)}
              </h2>
            </div>
            <div class="model-setup-wizard__body">
              <p>
                ${c?_(`modelProviders.login.useAccountDescription`,{model:c.model}):this.options.onManualProvider?_(`modelProviders.login.setupDescription`):_(`modelProviders.login.description`)}
              </p>
              ${e.phase===`loading`?C`<div role="status">${_(`common.loading`)}</div>`:e.phase===`error`?C`<div role="alert">${e.message}</div>`:i?C`
                          ${e.phase===`ready`&&e.authStatus.unavailable?C`<p role="status">${e.authStatus.unavailable.message}</p>`:at(a,c?{authProvider:c.authProvider,disabled:!e.isCurrent()||!this.options.canStart(),onUse:t=>{this.picker===e&&e.isCurrent()&&this.activateSavedProfile(t,c.model)}}:void 0)}
                          <section class="model-provider-login__methods" ${E(this.methodChoices)}>
                            <h3>${_(`modelProviders.login.connectAccount`)}</h3>
                            <div data-models-login-choice>
                              ${i.choices.map(e=>n({label:e.label,hint:e.hint||void 0,onClick:()=>{if(e.kind===`setup-secret`){this.reset(),this.options.onManualProvider?.(e.id);return}this.picker=null,this.mode=`auth`,this.refreshWarning=null,this.runner.prepareSignIn(e.kind,e.label),this.run(()=>this.runner.start(e.id,`models.authLogin`))}}))}
                            </div>
                            ${i.apiKeyProvider?n({label:_(`modelProviders.status.apiKey`),hint:_(`modelProviders.login.apiKeyHint`),apiKey:!0,onClick:()=>{i.apiKeyProvider&&(this.reset(),this.options.onApiKey?.(i.apiKeyProvider))}}):S}
                            <a
                              class="learn-more-link"
                              href=${o}
                              target=${fe}
                              rel=${se()}
                              >${_(`modelProviders.login.compareMethods`)}</a
                            >
                          </section>
                        `:C`
                          <label class="field">
                            <span>${_(`modelProviders.search`)}</span>
                            <input
                              type="search"
                              data-models-login-search
                              autofocus
                              autocomplete="off"
                              ${E(this.searchInput)}
                              .value=${e.query}
                              @input=${t=>{e.query=t.currentTarget.value,this.host.requestUpdate()}}
                            />
                          </label>
                          <ul
                            class="model-provider-login__providers"
                            aria-label=${_(`modelSetup.manual.provider`)}
                          >
                            ${u.map(t=>C`<li>
                                  ${n({provider:t.id,label:t.label,hint:[...t.choices.map(e=>e.label),...t.apiKeyProvider?[_(`modelProviders.status.apiKey`)]:[]].join(` · `),onClick:()=>{e.providerId=t.id,this.focusPicker=`method`,this.host.requestUpdate()}})}
                                </li>`)}
                          </ul>
                          ${u.length?S:C`
                                  <p class="muted" role="status">
                                    ${_(l?`modelProviders.noMatches`:`modelProviders.login.noProviders`)}
                                  </p>
                                `}
                        `}
            </div>
            <div class="model-setup-wizard__footer">
              ${i?C`
                      <button
                        class="btn model-provider-login__secondary"
                        data-models-login-back
                        @click=${()=>{t()&&(e.providers=void 0,e.providerId=``,this.focusPicker=`search`,this.host.requestUpdate())}}
                      >
                        ${_(`common.back`)}
                      </button>
                    `:!e.providers&&this.options.onDiscover?C`
                        <button
                          class="btn model-provider-login__secondary"
                          data-models-login-discover
                          ?disabled=${!e.isCurrent()}
                          @click=${()=>{this.picker===e&&e.isCurrent()&&(this.reset(),this.options.onDiscover?.())}}
                        >
                          ${_(`modelProviders.login.discover`)}
                        </button>
                      `:S}
              <button class="btn" @click=${()=>this.reset()}>${_(`common.cancel`)}</button>
            </div>
          </div>
        </zero-modal-dialog>
      `}return this.wizard.render({mode:this.mode,busy:this.mutationActive,refreshWarning:this.refreshWarning})}async complete(e){let t=e.startMethod===`zero.setup.activate.start`;if(t&&!e.modelActivation){this.runner.fail(_(`modelSetup.errors.activationFailed`));return}let n=this.runner.state.authLabel;this.runner.close(),this.message={kind:`success`,text:t?_(`modelProviders.login.activated`):[n,_(`modelProviders.login.done`)].filter(Boolean).join(`: `),warning:[e.modelActivation?.gatewayRestartRequired?_(`labsPage.restartRequired`):null,this.refreshWarning].filter(Boolean).join(`
`)||void 0},this.host.requestUpdate(),await this.options.refresh()}async run(e,t=!1){let n=this.options.getScope().context.gateway.snapshot.client;if(!n||this.mutationActive&&!t||!this.options.canContinue())return;let r=++this.generation;this.mutationActive=!0,this.host.requestUpdate();try{let t=await this.options.getScope().context.runtimeConfig.runExternalMutation(async t=>{if(t!==n)throw Error(_(`modelProviders.requestFailed`));let r=await e();return r&&d(t),r},{canDispatch:()=>r===this.generation&&this.options.getScope().context.gateway.snapshot.client===n&&this.options.canContinue(),dispatchError:_(`modelProviders.requestFailed`)});if(r!==this.generation)return;if(!t.ok){this.runner.fail(t.error);return}this.refreshWarning=t.refresh.ok?null:t.refresh.error,t.value&&t.value.isCurrent?.()!==!1&&await this.complete(t.value)}catch(e){r===this.generation&&this.runner.fail(g(e,_(`modelProviders.requestFailed`)))}finally{r===this.generation&&(this.mutationActive=!1,this.host.requestUpdate())}}}})))()}function ft(e){let t=e.auth;if(!t)return S;let n=$[t.kind],r=_(n.labelKey),i=t.expiryLabel?_(`modelProviders.expiresIn`,{time:t.expiryLabel}):void 0;return C`
    <span title=${i??r}> ${P({kind:n.kind,label:r})} </span>
  `}function pt(e){return e.hasConfigApiKey||!!e.apiKey||e.profiles.length>0}function mt(e){return e.auth?.kind===`expired`||e.auth?.kind===`missing`||e.auth?.kind===`expiring`}function ht(e){return e.catalogStatus===`ready`&&!mt(e)}function gt(e){if(e.checkingModels)return P({kind:`muted`,label:_(`chat.modelControls.checkingProviderModels`,{providers:e.displayName})});if(mt(e))return ft(e);if(e.catalogStatus===`auth-rejected`)return P({kind:`danger`,label:_(`modelProviders.status.denied`)});if(e.catalogStatus===`unavailable`)return P({kind:`warn`,label:_(`modelProviders.status.modelsUnavailable`)});if(!pt(e))return ft(e);let t=ht(e),n=t&&e.availableModelCount>0;return P({kind:n?`ok`:`muted`,label:_(n?`modelProviders.status.ready`:t?`modelProviders.status.ok`:`modelProviders.status.configured`)})}function _t(e){return e?C`
    <div class="callout ${e.kind}" role=${e.kind===`error`?`alert`:`status`}>
      ${e.text}
    </div>
    ${e.warning?C`<div class="callout warning" role="status">${e.warning}</div>`:S}
  `:S}function vt(e,t=!1){return C`<button
    class=${t?`btn primary`:`btn`}
    data-models-connect
    ?disabled=${e.connectDisabled}
    @click=${e.onConnect}
  >
    ${_(`modelProviders.login.action`)}
  </button>`}var $;function yt(){return(yt=e((()=>{w(),j(),r(),pe(),ue(),$={ok:{kind:`ok`,labelKey:`modelProviders.status.ok`},expiring:{kind:`warn`,labelKey:`modelProviders.status.expiring`},expired:{kind:`danger`,labelKey:`modelProviders.status.expired`},missing:{kind:`danger`,labelKey:`modelProviders.status.missing`},"api-key":{kind:`muted`,labelKey:`modelProviders.status.apiKey`}}})))()}export{z as A,V as C,Oe as D,je as E,ke as M,Fe as N,Me as O,Pe as P,Be as S,U as T,ze as _,_t as a,G as b,dt as c,Q as d,ot as f,Ge as g,Ke as h,vt as i,B as j,Ne as k,lt as l,Ze as m,ht as n,gt as o,Xe as p,yt as r,ut as s,pt as t,Y as u,Ue as v,Ae as w,He as x,K as y};
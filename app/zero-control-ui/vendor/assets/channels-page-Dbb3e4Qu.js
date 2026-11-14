import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{$i as t,Ai as n,Ei as r,Ic as i,Lc as a,Lu as o,Mi as s,Nu as c,Pi as l,Pu as u,W as d,Yi as f,bu as p,di as m,ji as h,ju as ee,ki as g,xu as _,yu as v,z as y,zu as b}from"./control-ui-core-DCNBgr3X.js";import{$t as te,Aa as ne,Ai as re,Ba as ie,Qt as ae,Xt as oe,Zt as se,_n as ce,ca as le,hn as ue,ki as de,or as fe,qr as pe,sa as x,sr as me,wn as he,wr as ge,xr as S,yr as _e,za as ve}from"./control-ui-core-DwX5Mpz4.js";import{G as C,J as w,W as T,Z as ye,f as be,g as xe,n as Se,p as Ce,rt as E,t as we}from"./lit-runtime-B40xFCK_.js";import{Lt as Te,zt as Ee}from"./control-ui-boot-shared-BX8huZUb.js";import{Gi as De,Ta as D,Ui as Oe,Ur as ke,Wr as Ae,Zr as O,wa as je,ya as k}from"./ui-AaV6iNVa.js";import{B as A,G as Me,I as j,R as Ne,U as Pe,Y as M,Z as N,bn as P,dn as Fe,fn as Ie,l as Le,ln as Re,na as ze,ot as Be,q as F,ta as Ve,u as He,un as Ue,xn as I}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ls as We,Ml as Ge,Nl as Ke,Ps as qe,cl as Je,qo as Ye,sl as Xe}from"./control-ui-boot-shared-CzJHozXQ.js";import"./control-ui-boot-shared-styles-BXPMRytW.js";import{n as L,r as Ze,t as Qe}from"./wizard-step-controls-TPQ3zrjY.js";import{_ as $e,v as et}from"./control-ui-boot-chat-Cx6CBnJr.js";import{c as tt,l as nt,n as rt,o as it,t as at,u as ot}from"./config-form-D1wuzImG.js";async function st(e,t,n,r=``){let i={method:t,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)},a=new AbortController,o=setTimeout(()=>a.abort(new DOMException(`Nostr profile request timed out after 30 seconds`,`TimeoutError`)),ft);try{let t=await oe(`/api/channels/nostr/${encodeURIComponent(e.accountId)}/profile${r}`,{...i,signal:a.signal},e.authCandidates,e.isCurrent);return await ae(t,a.signal)}finally{clearTimeout(o)}}function ct(e){if(!Array.isArray(e))return{};let t={};for(let n of e){if(typeof n!=`string`)continue;let[e,...r]=n.split(`:`);if(!e||r.length===0)continue;let i=e.trim(),a=r.join(`:`).trim();i&&a&&(t[i]=p(a))}return t}function lt(e){return st(e,`PUT`,e.values)}function ut(e){return je(e)&&[`name`,`displayName`,`about`,`picture`,`banner`,`website`,`nip05`,`lud16`].every(t=>e[t]===void 0||e[t]===null||typeof e[t]==`string`)}async function dt(e){let t=await st(e,`POST`,{autoMerge:!0},`/import`);return{...t,data:t.data&&{...t.data,ok:t.data.ok,saved:t.data.saved,imported:ut(t.data.imported)?t.data.imported:void 0,merged:ut(t.data.merged)?t.data.merged:void 0}}}var ft;function pt(){return(pt=e((()=>{se(),_(),ft=3e4})))()}function mt(e,t){return e.find(e=>e.hasIcon&&e.id===t)??e.find(e=>e.hasIcon&&e.channelIds?.includes(t))}var ht,gt;function _t(){return(_t=e((()=>{We(),$e(),ht=1e4,gt=class{constructor(e){this.hooks=e,this.catalog=null,this.iconUrls=new Map,this.request=null,this.pendingEnsureClient=null}get pluginCatalog(){return this.catalog}get pluginIconUrls(){if(!this.catalog)return{};let e=this.catalog.plugins;return Object.fromEntries(this.hooks.getChannelIds().flatMap(t=>{let n=mt(e,t),r=n?this.iconUrls.get(n.id):void 0;return r===void 0?[]:[[t,r]]}))}ensure(e){if(!e)return;if(this.request?.client===e){this.catalog&&(this.pendingEnsureClient=e);return}this.request?.controller.abort();let t=new AbortController,n={client:e,controller:t};if(this.request=n,this.catalog){this.loadIcons(this.catalog,n).finally(()=>this.finishRequest(n));return}e.request(`plugins.list`,{},{signal:t.signal}).then(async t=>{this.request===n&&this.hooks.getContext().gateway.snapshot.client===e&&(this.catalog=t,this.hooks.requestUpdate(),await this.loadIcons(t,n))}).catch(()=>{}).finally(()=>this.finishRequest(n))}async loadIcons(e,t){t.iconTimeout=setTimeout(()=>t.controller.abort(new DOMException(`plugin icon fetch timed out`,`TimeoutError`)),ht);let n=new Set;for(let t of this.hooks.getChannelIds()){let r=mt(e.plugins,t);r&&!this.iconUrls.has(r.id)&&n.add(r.id)}let r=(await Promise.all([...n].map(async e=>[e,await qe({pluginId:e,...et(this.hooks.getContext()),signal:t.controller.signal}).catch(()=>null)]))).filter(e=>e[1]!==null);if(this.request!==t||!this.hooks.isConnected()){for(let[,e]of r)URL.revokeObjectURL(e);return}for(let[e,t]of r)this.iconUrls.set(e,t);this.hooks.requestUpdate()}finishRequest(e){if(e.iconTimeout&&clearTimeout(e.iconTimeout),this.request!==e)return;this.request=null;let t=this.pendingEnsureClient;this.pendingEnsureClient=null,t&&this.hooks.isConnected()&&this.ensure(t)}reset(){this.request?.controller.abort(),this.request?.iconTimeout&&clearTimeout(this.request.iconTimeout),this.request=null,this.pendingEnsureClient=null;for(let e of this.iconUrls.values())URL.revokeObjectURL(e);this.catalog=null,this.iconUrls.clear(),this.hooks.requestUpdate()}}})))()}function vt(e){let{state:t,callbacks:n,accountId:r}=e,i=[...R,...z].some(([e])=>t.values[e]!==t.original[e]),a=([e,r,i,a,o])=>{let s=b(`channels.nostr.${r}`),c=b(`channels.nostr.${i}`),l=b(`channels.nostr.${a}`),u=t=>n.onFieldChange(e,t.target.value),d=t.values[e]??``,f=t.fieldErrors[e],p=`nostr-profile-${e}`,m=`${p}-help`,h=`${p}-error`,ee=[l?m:``,f?h:``].filter(Boolean).join(` `),g=o===`textarea`,_=g?Ce`textarea`:Ce`input`,v=xe`<${_}
      id=${p}
      class="settings-input"
      type=${g?C:o}
      .value=${d}
      placeholder=${c}
      maxlength=${g?`2000`:`256`}
      rows=${g?`3`:C}
      aria-describedby=${ee||C}
      aria-invalid=${f?`true`:C}
      @input=${u}
      ?disabled=${t.saving}
    ></${_}>`;return w`
      <div class="settings-row settings-row--stacked">
        <div class="settings-row__text">
          <label class="settings-row__title" for="${p}">${s}</label>
          ${l?w`<span id=${m} class="settings-row__desc">${l}</span>`:C}
          ${f?w`<span id=${h} class="settings-row__desc" style="color: var(--danger);"
                  >${f}</span
                >`:C}
        </div>
        <div class="settings-row__control">${v}</div>
      </div>
    `};return w`
    ${F({title:b(`channels.nostr.editProfile`),description:w`${b(`channels.nostr.account`)}: ${r}`})}
    ${t.error?F({role:`alert`,title:N({kind:`danger`,label:b(`channels.lastError`)}),description:t.error}):C}
    ${t.success?w`
            <div class="settings-row" role="status">
              <div class="settings-row__text">
                <span class="settings-row__desc">${t.success}</span>
              </div>
            </div>
          `:C}
    ${t.values.picture?F({title:b(`channels.nostr.profilePicturePreview`),control:w`<img
              src=${t.values.picture}
              alt=${b(`channels.nostr.profilePicturePreview`)}
              style="max-width: 80px; max-height: 80px; border-radius: 50%; object-fit: cover;"
              @error=${e=>{let t=e.target;t.style.display=`none`}}
              @load=${e=>{let t=e.target;t.style.display=`block`}}
            />`}):C}
    ${R.map(a)}
    ${t.showAdvanced?w`
            ${F({title:b(`channels.nostr.advanced`)})}
            ${z.map(a)}
          `:C}

    <div class="settings-row">
      <div class="settings-row__text">
        ${i?w`<span class="settings-row__desc">${b(`common.unsavedChanges`)}</span>`:C}
      </div>
      <div class="settings-row__control">
        <button
          class="btn primary"
          @click=${n.onSave}
          ?disabled=${t.saving||!i}
        >
          ${t.saving?b(`common.saving`):b(`common.saveAndPublish`)}
        </button>

        <button
          class="btn"
          @click=${n.onImport}
          ?disabled=${t.importing||t.saving}
        >
          ${t.importing?b(`common.importing`):b(`common.importFromRelays`)}
        </button>

        <button
          class="btn"
          aria-expanded=${String(t.showAdvanced)}
          @click=${n.onToggleAdvanced}
        >
          ${t.showAdvanced?b(`common.hideAdvanced`):b(`common.showAdvanced`)}
        </button>

        <button class="btn" @click=${n.onCancel} ?disabled=${t.saving}>
          ${b(`common.cancel`)}
        </button>
      </div>
    </div>
  `}function yt(e){let t=Object.fromEntries([...R,...z].map(([t])=>[t,e?.[t]??``]));return{values:t,original:{...t},saving:!1,importing:!1,error:null,success:null,fieldErrors:{},showAdvanced:!!(e?.banner||e?.website||e?.nip05||e?.lud16)}}var R,z;function bt(){return(bt=e((()=>{T(),be(),j(),u(),R=[[`name`,`username`,`placeholders.username`,`usernameHelp`,`text`],[`displayName`,`displayName`,`placeholders.displayName`,`displayNameHelp`,`text`],[`about`,`bio`,`bioPlaceholder`,`bioHelp`,`textarea`],[`picture`,`avatarUrl`,`placeholders.avatarUrl`,`avatarHelp`,`url`]],z=[[`banner`,`bannerUrl`,`placeholders.bannerUrl`,`bannerHelp`,`url`],[`website`,`website`,`placeholders.website`,`websiteHelp`,`url`],[`nip05`,`nip05Identifier`,`placeholders.nip05`,`nip05Help`,`text`],[`lud16`,`lightningAddress`,`placeholders.lightningAddress`,`lightningHelp`,`text`]]})))()}function xt(e){return`http://127.0.0.1:18789/channels/${encodeURIComponent(e)}`}function St(e,t){let n=e;for(let e of t){if(!n||m(n)!==`object`)return null;let t=n.additionalProperties;n=n.properties?.[e]||(t&&typeof t==`object`?t:null)}return n}function Ct(e){let t=Et.filter(t=>t in e);return t.length===0?null:w`
    <div>
      ${t.map(t=>w`
          <div class="settings-row__desc">${t}: ${g(e[t])}</div>
        `)}
    </div>
  `}function wt(e,t,n){let r=t.config,i=rt(r.configSchema),a=i.schema;if(!a)return w`<div class="settings-row__desc">${b(`channels.config.schemaUnavailable`)}</div>`;let o=St(a,[`channels`,e]);if(!o)return w`
      <div class="settings-row__desc">${b(`channels.config.channelSchemaUnavailable`)}</div>
    `;let c=s(r.configForm??{},e)??{},l=[`channels`,e],u=new Set(i.unsupportedPaths);return w`
    <div class="config-form">
      ${it({schema:o,path:l,hints:r.configUiHints,revealAdvanced:t.showAdvancedSettings,onShowAdvanced:()=>t.onShowAdvancedSettings(!0),onHideAdvanced:()=>t.onShowAdvancedSettings(!1),renderTier:e=>tt({schema:e,value:c,path:l,hints:r.configUiHints,unsupported:u,disabled:n,showLabel:!1,maskSensitive:!0,onPatch:t.onConfigPatch})})}
    </div>
    ${Ct(c)}
  `}function Tt(e){let{channelId:t,props:n}=e,r=n.config.configSaving||n.config.configSchemaLoading;return n.config.configSchemaLoading?Pe({label:b(`channels.config.loadingSchema`),rows:2}):w`
    <div class="settings-row settings-row--stacked">
      ${wt(t,n,r)}
      ${n.config.lastError?w`<div class="callout danger" role="alert">${n.config.lastError}</div>`:null}
      <div class="settings-row__control">
        <button
          class="btn primary"
          ?disabled=${r||!n.config.configFormDirty}
          @click=${()=>n.onConfigSave()}
        >
          ${n.config.configSaving?b(`common.saving`):b(`common.save`)}
        </button>
        <button class="btn" ?disabled=${r} @click=${()=>n.onConfigReload()}>
          ${b(`common.reload`)}
        </button>
      </div>
    </div>
  `}var Et;function B(){return(B=e((()=>{T(),at(),j(),u(),n(),Et=[`groupPolicy`,`streamMode`,`dmPolicy`]})))()}function V(e,t){let n=t.channels.channelsSnapshot,r=n?.channels,i=r&&Object.hasOwn(r,e)?k(r[e])??void 0:void 0,a=h(n?.channelAccounts,e),o=n?.channelDefaultAccountId,s=o&&Object.hasOwn(o,e)?o[e]:void 0,c=(s?a.find(e=>e.accountId===s):void 0)??a[0]??null;return{configured:typeof i?.configured==`boolean`?i.configured:typeof c?.configured==`boolean`?c.configured:null,running:typeof i?.running==`boolean`?i.running:null,connected:typeof i?.connected==`boolean`?i.connected:null,defaultAccount:c,status:i}}function H(e){return b(e==null?`common.na`:e?`common.yes`:`common.no`)}function U(e){return e===!0?`ok`:`muted`}function W(e){return w`
    <dl class="settings-kv">
      ${e.map(e=>w`
          <dt>${e.label}</dt>
          <dd>
            ${e.kind===void 0?e.value:N({kind:e.kind,label:e.value})}
          </dd>
        `)}
    </dl>
  `}function G(e){return F({title:N({kind:`danger`,label:b(`channels.lastError`)}),description:w`${v(e)}`})}function Dt(e){let t=p([e.status??``,e.error??``].filter(Boolean).join(` `));return F({title:N({kind:e.ok?`ok`:`danger`,label:e.ok?b(`common.probeOk`):b(`common.probeFailed`)}),description:t})}function K(e){return w`
    <div class="settings-row settings-row--actions">
      <div class="settings-row__control">${e}</div>
    </div>
  `}function Ot(e){let t=e.updatedAt?b(`channels.hub.updatedAgo`,{ago:y(e.updatedAt)}):b(`common.na`);return w`<zero-tooltip .content=${t}>
    <button
      type="button"
      class="btn btn--xs btn--icon"
      aria-label=${b(`common.refresh`)}
      ?disabled=${e.disabled}
      @click=${e.onRefresh}
    >
      ${x.refresh}
    </button>
  </zero-tooltip>`}function kt(e){let t=[e.accountId,...e.facts??[]].join(` · `);return w`
    <div class="settings-row">
      <div class="settings-row__text">
        <span class="settings-row__title">${e.title}</span>
        <span class="settings-row__desc">${t}</span>
        ${e.lastError?w`<span class="settings-row__desc"
                >${p(e.lastError)}</span
              >`:C}
      </div>
      <div class="settings-row__control">
        ${N(e.status)}
        <span class="settings-row__value"
          >${e.lastInboundAt?y(e.lastInboundAt):b(`common.na`)}</span
        >
      </div>
    </div>
  `}function At(e,t){let n=h(t,e).length;return n>=2?n:void 0}function q(){return(q=e((()=>{T(),le(),j(),u(),n(),_(),d()})))()}function jt(e){return e?e.length<=20?e:`${e.slice(0,8)}...${e.slice(-8)}`:b(`common.na`)}function Mt(e){let{props:t,nostr:n,nostrAccounts:r,accountCount:i,profileFormState:a,profileFormCallbacks:o,onEditProfile:s}=e,c=r[0],l=n?.configured??c?.configured??!1,u=n?.running??c?.running??!1,d=n?.publicKey??c?.publicKey,f=n?.lastStartAt??c?.lastStartAt??null,p=n?.lastError??c?.lastError??null,m=r.length>1,h=a!=null,ee=e=>{let t=e.publicKey,n=e.profile;return kt({title:n?.displayName??n?.name??e.name??e.accountId,accountId:e.accountId,facts:[`${b(`common.configured`)}: ${e.configured?b(`common.yes`):b(`common.no`)}`,`${b(`common.publicKey`)}: ${jt(t)}`],status:{kind:U(e.running),label:e.running?b(`common.running`):b(`common.no`)},lastInboundAt:e.lastInboundAt,lastError:e.lastError})},g=()=>{if(h&&o)return vt({state:a,callbacks:o,accountId:r[0]?.accountId??`default`});let{name:e,displayName:t,about:i,picture:u,nip05:d}=c?.profile??n?.profile??{},f=e||t||i||u||d;return w`
      ${F({title:b(`channels.nostr.profile`),description:f?void 0:w`${b(`channels.nostr.noProfile`)} ${b(`channels.nostr.noProfileHint`)}`,control:l?w`<button class="btn btn--sm" @click=${s}>
              ${b(`channels.nostr.editProfile`)}
            </button>`:C})}
      ${f?w`
              <dl class="settings-kv">
                ${u?w`
                        <dt>${b(`channels.nostr.profilePicture`)}</dt>
                        <dd>
                          <img
                            style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;"
                            src=${u}
                            alt=${b(`channels.nostr.profilePicture`)}
                            @error=${e=>{e.target.style.display=`none`}}
                          />
                        </dd>
                      `:C}
                ${[[b(`channels.nostr.name`),e],[b(`channels.nostr.displayName`),t],[b(`channels.nostr.about`),i],[`NIP-05`,d]].map(([e,t])=>t?w`<dt>${e}</dt>
                        <dd>${t}</dd>`:C)}
              </dl>
            `:C}
    `};return M({title:b(`channels.nostr.title`),description:b(`channels.nostr.subtitle`),...i===void 0?{}:{count:i}},w`
      ${m?r.map(e=>ee(e)):W([{label:b(`common.configured`),value:b(l?`common.yes`:`common.no`),kind:U(l)},{label:b(`common.running`),value:b(u?`common.yes`:`common.no`),kind:U(u)},{label:b(`common.publicKey`),value:w`<code title="${d??``}"
                  >${jt(d)}</code
                >`},{label:b(`common.lastStart`),value:f?y(f):b(`common.na`)}])}
      ${p?G(p):C}
      ${g()} ${Tt({channelId:`nostr`,props:t})}
      ${K(w`<button class="btn" @click=${()=>t.onRefresh(!1)}>
          ${b(`common.refresh`)}
        </button>`)}
    `)}function Nt(){return(Nt=e((()=>{T(),j(),u(),d(),B(),bt(),q()})))()}function J(e){return e.accountLabel||e.accountId}function Pt(e){let t=Date.parse(e);return Number.isFinite(t)?y(t):e}function Ft(e){let t=e.channels.pairingSnapshot?.accounts??[],n=Array.from(new Map(t.map(e=>[e.channel,e.channelLabel])).entries()).toSorted((e,t)=>e[1].localeCompare(t[1])),r=e.pairingChannelFilter?t.filter(t=>t.channel===e.pairingChannelFilter):t;return w`
    <div class="channels-pairing-filters">
      <label>
        <span>${b(`channels.pairing.channelFilter`)}</span>
        ${Ue({label:b(`channels.pairing.channelFilter`),value:e.pairingChannelFilter??``,options:[{value:``,label:b(`channels.pairing.allChannels`),kind:`neutral`},...n.map(([e,t])=>({value:e,label:t}))],onChange:t=>e.onPairingFilterChange(t||null,null)})}
      </label>
      <label>
        <span>${b(`channels.pairing.accountFilter`)}</span>
        ${Ie({label:b(`channels.pairing.accountFilter`),value:e.pairingAccountFilter??``,options:[{value:``,label:b(`channels.pairing.allAccounts`)},...r.map(e=>({value:e.accountId,label:J(e)}))],disabled:!e.pairingChannelFilter,onChange:t=>e.onPairingFilterChange(e.pairingChannelFilter,t||null)})}
      </label>
    </div>
  `}function It(e,t){let n=!!t.channels.pairingBusyRequestId,r=t.channels.pairingBusyRequestId===e.requestId,i=Object.entries(e.metadata??{});return w`
    <div class="settings-row settings-row--stacked channels-pairing-request">
      <div class="channels-pairing-request__main">
        <div class="settings-row__text">
          <span class="settings-row__title">${e.senderId}</span>
          <span class="settings-row__desc">
            ${e.senderLabel} · ${e.channelLabel} · ${J(e)}
            (${e.accountId})
          </span>
          <span class="settings-row__desc">
            ${b(`channels.pairing.requested`,{ago:Pt(e.createdAt)})} ·
            ${b(`channels.pairing.expires`,{ago:Pt(e.expiresAt)})}
          </span>
        </div>
        <div class="settings-row__control channels-pairing-request__actions">
          ${[[`approve`,t.onPairingApprove],[`dismiss`,t.onPairingDismiss]].map(([i,a])=>w`<button
              type="button"
              class=${i===`approve`?`btn btn--sm primary`:`btn btn--sm`}
              ?disabled=${n||!t.canManagePairing}
              aria-label=${b(`channels.pairing.${i}Aria`,{sender:e.senderId,channel:e.channelLabel,account:J(e)})}
              @click=${()=>a(e)}
            >
              ${b(i===`approve`&&r?`common.loading`:`channels.pairing.${i}`)}
            </button>`)}
        </div>
      </div>
      ${i.length>0?w`
              <details class="channels-pairing-request__details">
                <summary>${b(`channels.pairing.senderDetails`)}</summary>
                <dl class="settings-kv">
                  ${i.map(([e,t])=>w`<dt>${e}</dt>
                        <dd>${t}</dd>`)}
                </dl>
              </details>
            `:C}
    </div>
  `}function Lt(e){let t=e.canManagePairing?e.channels.pairingSnapshot:null,n=t?.accounts??[],r=(t?.requests??[]).filter(t=>(!e.pairingChannelFilter||t.channel===e.pairingChannelFilter)&&(!e.pairingAccountFilter||t.accountId===e.pairingAccountFilter)),i=!!(e.pairingChannelFilter||e.pairingAccountFilter),a=t?.requests.length??0;return w`
    <div id="channels-pairing-requests">
      ${M({title:b(`channels.pairing.title`),description:b(`channels.pairing.subtitle`),...a>0?{count:a}:{},actions:Ot({updatedAt:e.canManagePairing?e.channels.pairingLastSuccess:null,disabled:e.channels.pairingLoading||!e.canManagePairing,onRefresh:e.onPairingRefresh})},e.canManagePairing?w`
              ${[[e.channels.pairingError,`alert`,`danger`],[e.pairingNotice,`status`,`ok`]].map(([e,t,n])=>e?w` <div class="settings-row channels-pairing-feedback" role=${t}>
                      ${N({kind:n,label:e})}
                    </div>`:C)}
              ${t?Ft(e):C}
              ${e.channels.pairingLoading&&!t?Pe({rows:2}):n.length===0?A(b(`channels.pairing.noAccounts`)):r.length===0?A(b(i?`channels.pairing.noFilteredRequests`:`channels.pairing.noRequests`)):r.map(t=>It(t,e))}
              ${t?w`
                      <div class="channels-pairing-help">
                        ${b(`channels.pairing.limits`,{count:String(t.limits.pendingPerAccount),minutes:String(Math.round(t.limits.ttlMs/6e4))})}
                      </div>
                    `:C}
            `:w`
              <div class="settings-row channels-pairing-feedback">
                ${N({kind:`warn`,label:b(`channels.pairing.missingPermission`)})}
              </div>
            `)}
    </div>
  `}function Rt(e,t){if(!t.canManagePairing)return C;let n=(t.channels.pairingSnapshot?.accounts??[]).filter(t=>t.channel===e);if(n.length===0)return C;let r=t.channels.pairingSnapshot?.requests??[];return M({title:b(`channels.pairing.detailTitle`),description:b(`channels.pairing.detailSubtitle`)},n.map(e=>{let n=r.filter(t=>t.channel===e.channel&&t.accountId===e.accountId).length;return w`
        <div class="settings-row">
          <div class="settings-row__text">
            <span class="settings-row__title">${J(e)}</span>
            <span class="settings-row__desc">${e.accountId}</span>
          </div>
          <div class="settings-row__control">
            ${N({kind:n>0?`warn`:`muted`,label:n>0?b(`channels.pairing.pendingCount`,{count:String(n)}):b(`channels.pairing.noPending`)})}
            <button
              type="button"
              class="btn btn--sm"
              @click=${()=>t.onPairingReviewAccount(e.channel,e.accountId)}
            >
              ${b(`channels.pairing.review`)}
            </button>
          </div>
        </div>
      `}))}function zt(e){let t=e.pairingPrompt;if(!t||!e.canManagePairing)return C;let n=t.request,r=e.channels.pairingBusyRequestId===n.requestId,i=t.kind===`approve`,a=e.channels.pairingSnapshot?.commandOwnerConfigured===!1,o=b(`channels.pairing.${t.kind}DialogTitle`),s=(n,r)=>w`
    <label class="channels-pairing-dialog__option">
      <input
        type="checkbox"
        .checked=${t[n]}
        @change=${t=>e.onPairingPromptChange({[n]:t.currentTarget instanceof HTMLInputElement&&t.currentTarget.checked})}
      />
      <span>${r}</span>
    </label>
  `;return w`
    <zero-modal-dialog label=${o} @modal-cancel=${e.onPairingPromptCancel}>
      <div class="channels-pairing-dialog">
        <div class="settings-row__title">${o}</div>
        <div class="settings-row__desc">
          ${n.senderId} · ${n.channelLabel} · ${J(n)}
          (${n.accountId})
        </div>
        <div class="callout ${i?`info`:`warn`}">
          ${b(`channels.pairing.${t.kind}Explanation`)}
        </div>
        ${e.channels.pairingError?w`<div class="callout danger" role="alert">${e.channels.pairingError}</div>`:C}
        ${i&&n.notifySupported?s(`notify`,b(`channels.pairing.notifyRequester`)):C}
        ${i&&a&&e.canAdmin?w`
                ${s(`bootstrapCommandOwner`,b(`channels.pairing.makeCommandOwner`))}
                <div class="settings-row__desc">${b(`channels.pairing.commandOwnerHelp`)}</div>
              `:C}
        ${i&&a&&!e.canAdmin?w`<div class="callout warn">${b(`channels.pairing.commandOwnerNeedsAdmin`)}</div>`:C}
        <div class="channels-pairing-dialog__actions">
          <button
            type="button"
            class=${i?`btn primary`:`btn danger`}
            ?disabled=${r}
            @click=${e.onPairingPromptConfirm}
          >
            ${b(`channels.pairing.${t.kind}`)}
          </button>
          <button type="button" class="btn" ?disabled=${r} @click=${e.onPairingPromptCancel}>
            ${b(`common.cancel`)}
          </button>
        </div>
      </div>
    </zero-modal-dialog>
  `}function Y(){return(Y=e((()=>{T(),Re(),pe(),Fe(),j(),u(),d(),q()})))()}function Bt(e){let{props:t,whatsapp:n,accountCount:r}=e,{configured:i}=V(`whatsapp`,t),a=n?.linked===!0,s=t.channels.whatsappLoginQrDataUrl!=null,c=n?.self?.e164,l=c?nt(c,o.getLocale())??c:void 0,u=e=>({label:b(`common.${e}`),value:n?.[e]?b(`common.yes`):b(`common.no`),kind:U(n?.[e])});return M({title:b(`channels.whatsapp.title`),description:b(`channels.whatsapp.subtitle`),count:r},w`
      ${W([{label:b(`common.configured`),value:H(i),kind:U(i)},u(`linked`),...l?[{label:b(`channels.whatsapp.phoneNumber`),value:l}]:[],u(`running`),u(`connected`),...[[`lastConnect`,`lastConnectedAt`],[`lastMessage`,`lastMessageAt`]].map(([e,t])=>({label:b(`common.${e}`),value:n?.[t]?y(n[t]):b(`common.na`)})),{label:b(`common.authAge`),value:n?.authAgeMs==null?b(`common.na`):Te(n.authAgeMs)}])}
      ${n?.lastError?G(n.lastError):C}
      ${Tt({channelId:`whatsapp`,props:t})}
      ${t.channels.whatsappLoginMessage?w`
              <div class="settings-row" role="status">
                <div class="settings-row__text">
                  <span class="settings-row__desc">${t.channels.whatsappLoginMessage}</span>
                </div>
              </div>
            `:C}
      ${t.channels.whatsappLoginQrDataUrl?w`
              <div class="settings-row settings-row--stacked">
                <div class="qr-wrap">
                  <img
                    src=${t.channels.whatsappLoginQrDataUrl}
                    alt=${b(`channels.setup.whatsappQrAlt`)}
                  />
                </div>
              </div>
            `:C}
      ${K(w`
        <button
          class=${a?`btn`:`btn primary`}
          ?disabled=${t.channels.whatsappBusy}
          @click=${()=>t.onWhatsAppStart(a)}
        >
          ${b(a?`common.relink`:t.channels.whatsappBusy?`common.working`:`common.showQr`)}
        </button>
        ${s?w`<button
                class="btn"
                ?disabled=${t.channels.whatsappBusy}
                @click=${()=>t.onWhatsAppWait()}
              >
                ${b(`common.waitForScan`)}
              </button>`:C}
        <button
          class="btn danger"
          ?disabled=${t.channels.whatsappBusy}
          @click=${()=>t.onWhatsAppLogout()}
        >
          ${b(`common.logout`)}
        </button>
        <button class="btn" @click=${()=>t.onRefresh(!0)}>${b(`common.refresh`)}</button>
      `)}
    `)}function Vt(){return(Vt=e((()=>{ot(),T(),j(),u(),Ee(),d(),B(),q()})))()}function Ht(e){return Object.hasOwn(X,e)}function Ut(e,t,n){let r=Ht(e)?e:null,i=r?X[r]:null,a=t.channels.channelsSnapshot,o=r?a?.channels[r]:void 0,s=V(e,t),c=s.configured,l=h(a?.channelAccounts,e),u=r===`telegram`?l.length>1:!r&&l.length>0,d=r===`googlechat`?[{label:b(`common.credential`),value:o?.credentialSource??b(`common.na`)},{label:b(`common.audience`),value:o?.audienceType?`${o.audienceType}${o.audience?` · ${o.audience}`:``}`:b(`common.na`)}]:r===`signal`?[{label:b(`common.baseUrl`),value:o?.baseUrl??b(`common.na`)}]:r===`telegram`?[{label:b(`common.mode`),value:o?.mode??b(`common.na`)}]:[],f=[{label:b(`common.configured`),value:H(c),kind:U(c)},{label:b(`common.running`),value:r?r===`googlechat`&&!o?b(`common.na`):H(o?.running??!1):H(s.running),kind:U(r?o?.running:s.running)},...r?[...d,...[`lastStartAt`,`lastProbeAt`].map(e=>({label:b(e===`lastStartAt`?`common.lastStart`:`common.lastProbe`),value:o?.[e]?y(o[e]):b(`common.na`)}))]:[{label:b(`common.connected`),value:H(s.connected),kind:U(s.connected)}]],p=D(k(r?o:s.status),`lastError`);return M({title:i?b(`channels.${i}.title`):D(t.channels.channelsSnapshot?.channelLabels,e)??e,description:b(i?`channels.${i}.subtitle`:`channels.generic.subtitle`),...n===void 0?{}:{count:n}},w`
      ${u?l.map(e=>{let t=r===`telegram`?D(k(k(e.probe)?.bot),`username`):void 0;return kt({title:t?`@${t}`:e.name||e.accountId,accountId:e.accountId,...r===`telegram`?{facts:[`${b(`common.configured`)}: ${e.configured?b(`common.yes`):b(`common.no`)}`]}:{},status:{kind:U(r===`telegram`?e.running:e.running??e.configured),label:e.running?b(`common.running`):!r&&e.configured?b(`common.configured`):b(`common.no`)},lastInboundAt:e.lastInboundAt,lastError:e.lastError})}):W(f)}
      ${p?G(p):C}
      ${r&&o?.probe?Dt(o.probe):C}
      ${Tt({channelId:e,props:t})}
      ${r?K(w`
              <button
                class="btn"
                ?disabled=${t.channels.channelsLoading}
                aria-busy=${String(t.channels.channelsLoading)}
                @click=${()=>t.onRefresh(!0)}
              >
                ${b(t.channels.channelsLoading?`common.refreshing`:`common.probe`)}
              </button>
            `):C}
    `)}function Wt(e,t){let n=t.channels.channelsSnapshot,r=At(e,n?.channelAccounts);switch(e){case`whatsapp`:return Bt({props:t,whatsapp:n?.channels.whatsapp??void 0,accountCount:r});case`nostr`:{let e=h(n?.channelAccounts,`nostr`),i=e[0],a=i?.accountId??`default`,o=i?.profile??null,s=t.nostrProfileAccountId===a?t.nostrProfileFormState:null,c=s?{onFieldChange:t.onNostrProfileFieldChange,onSave:t.onNostrProfileSave,onImport:t.onNostrProfileImport,onCancel:t.onNostrProfileCancel,onToggleAdvanced:t.onNostrProfileToggleAdvanced}:null;return Mt({props:t,nostr:n?.channels.nostr??null,nostrAccounts:e,accountCount:r,profileFormState:s,profileFormCallbacks:c,onEditProfile:()=>t.onNostrProfileEdit(a,o)})}default:return Ut(e,t,r)}}function Gt(e){let t=Wt(e.channelId,e.props),n=e.props.channels.channelsSnapshot?.statusIssues?.filter(t=>t.channel===e.channelId);return w`
    <zero-modal-dialog label=${e.label} @modal-cancel=${()=>e.onClose()}>
      <div class="channels-detail">
        <div class="channels-detail__header">
          ${I(e.channelId,e.label,`cover`,{pluginIconUrl:e.pluginIconUrl})}
          <div class="channels-detail__header-actions">
            <a
              class="btn btn--sm"
              href=${xt(e.channelId)}
              target="_blank"
              rel="noreferrer"
            >
              ${b(`common.docs`)}
            </a>
            <button
              type="button"
              class="btn btn--sm"
              title=${e.props.canAdmin?``:b(`channels.hub.adminRequired`)}
              ?disabled=${!e.props.canAdmin}
              @click=${()=>e.onSetup()}
            >
              ${b(`channels.hub.runSetup`)}
            </button>
            <button
              type="button"
              class="btn channels-detail__close"
              aria-label=${b(`common.close`)}
              @click=${()=>e.onClose()}
            >
              ${x.x}
            </button>
          </div>
        </div>
        <div class="channels-detail__body">
          ${e.props.wizardHost.blockedByDirtyConfig&&e.props.config.configFormDirty?w`<div class="callout warn">${b(`channels.hub.saveBeforeSetup`)}</div>`:C}
          ${n?.map(e=>w`
              <div class="callout warn" role="note">
                <strong>
                  ${b(`channels.hub.stateAttention`)} · ${p(e.accountId)}
                </strong>
                <div>${p(e.message)}</div>
                ${e.fix?w`<div>${p(e.fix)}</div>`:C}
              </div>
            `)}
          ${Rt(e.channelId,e.props)} ${t}
        </div>
      </div>
    </zero-modal-dialog>
  `}var X;function Kt(){return(Kt=e((()=>{T(),P(),le(),j(),u(),pe(),n(),_(),d(),B(),Nt(),Y(),q(),Vt(),X={discord:`discord`,googlechat:`googleChat`,imessage:`imessage`,signal:`signal`,slack:`slack`,telegram:`telegram`}})))()}function Z(e,t,n=!1){return w`<button
    type="button"
    class=${n?`btn primary`:`btn`}
    @click=${()=>e.onClose()}
  >
    ${b(t)}
  </button>`}function qt(e,t){let{step:n,busy:r,validationError:i,channel:a}=e;if(n.type===`note`||n.type===`progress`||n.type===`action`){let e=n.message?.trim()??``,i=n.executor===`gateway`,a=e.includes(`{`)||e.includes(`  `),o=i?`channels-wizard__message`:`channels-wizard__output${a?` channels-wizard__output--code`:``}`;return w`
      ${n.title?w`<div class="channels-wizard__message">${n.title}</div>`:C}
      ${e?w`<div class=${o}>${e}</div>`:C}
      <div class="channels-wizard__footer">
        ${i?Z(t,`common.cancel`):C}
        ${i||r?L(i&&e||b(`channels.setup.working`)):w`<button type="button" class="btn primary" @click=${()=>t.onAnswer(null)}>
                ${b(`channels.setup.continue`)}
              </button>`}
      </div>
    `}return Ze({step:n,value:n.type===`multiselect`?t.multiselectValues:n.type===`text`?t.textValue:n.initialValue,busy:r,inputId:`channel-wizard-text-input`,validationErrorId:i?`channel-wizard-validation-error`:void 0,presentation:`channels`,channelSelect:a===null,answerLabel:b(`channels.setup.continue`),busyLabel:b(`channels.setup.working`),sensitiveRevealed:t.secretVisible,onValueChange:n.type===`text`?e=>t.onTextInput(typeof e==`string`?e:``):t.onToggleMultiselect,onAnswer:t.onAnswer,onToggleSensitiveVisibility:t.onToggleSecretVisibility})}function Jt(e){let t=e.whatsappConnected===!0;return w`
    <div class="channels-wizard__message" role="status">
      ${b(t?`channels.setup.whatsappLinked`:`channels.setup.whatsappScanTitle`)}
    </div>
    ${e.whatsappMessage?w`<div class="channels-wizard__note" role="status">${e.whatsappMessage}</div>`:C}
    ${t?C:w`
            <div class="channels-wizard__qr">
              ${e.whatsappQrDataUrl?w`<img
                      src=${e.whatsappQrDataUrl}
                      alt=${b(`channels.setup.whatsappQrAlt`)}
                    />`:e.whatsappBusy?C:w`<div class="channels-wizard__spinner">
                        ${b(`channels.setup.whatsappQrHint`)}
                      </div>`}
            </div>
            <div class="channels-wizard__note">${b(`channels.setup.whatsappScanHelp`)}</div>
          `}
    <div class="channels-wizard__footer">
      ${t?Z(e,`channels.setup.finish`,!0):w`
              ${e.whatsappBusy?L(b(`channels.setup.whatsappQrLoading`)):w`
                      <button type="button" class="btn" @click=${()=>e.onWhatsAppStart(!0)}>
                        ${e.whatsappQrDataUrl?b(`channels.setup.regenerateQr`):b(`common.showQr`)}
                      </button>
                      ${e.whatsappQrDataUrl?w`
                              <button
                                type="button"
                                class="btn primary"
                                @click=${()=>e.onWhatsAppWait()}
                              >
                                ${b(`common.waitForScan`)}
                              </button>
                            `:C}
                    `}
              ${Z(e,`channels.setup.linkLater`)}
            `}
    </div>
  `}function Yt(e,t){if(e.includes(`whatsapp`))return Jt(t);let n=e.length>0;return w`
    <div class="channels-wizard__message" role="status">
      ${b(n?`channels.setup.doneTitle`:`channels.setup.doneNoChangesTitle`)}
    </div>
    <div class="channels-wizard__note">
      ${b(n?`channels.setup.doneBody`:`channels.setup.doneNoChangesBody`)}
    </div>
    <div class="channels-wizard__footer">
      ${Z(t,n?`channels.setup.finish`:`common.close`,!0)}
    </div>
  `}function Xt(e){return e?.externalUrl?w`
    <div class="channels-wizard__links">
      <a
        class="channels-wizard__link"
        href=${e.externalUrl}
        target="_blank"
        rel="noreferrer noopener"
      >
        ${b(`channels.setup.openLink`)}
      </a>
    </div>
  `:C}function Zt(e){let t=e.wizard;if(t.phase===`idle`)return C;let n=t.channel,r=n?e.channelLabel(n):b(`channels.setup.genericTitle`),i=t.phase===`step`?t.step:null,a;return a=t.phase===`starting`?w`<div class="channels-wizard__footer">
      ${L(b(`channels.setup.starting`))}
    </div>`:t.phase===`error`?w`
      <div class="channels-wizard__error" role="alert">${t.message}</div>
      <div class="channels-wizard__footer">${Z(e,`common.close`)}</div>
    `:t.phase===`done`?Yt(t.channels,e):w`
      ${t.validationError?w`<div
              id="channel-wizard-validation-error"
              class="channels-wizard__error"
              role="alert"
            >
              ${t.validationError}
            </div>`:C}
      ${qt(t,e)}
    `,w`
    <zero-modal-dialog
      label=${b(`channels.setup.dialogLabel`,{channel:r})}
      @modal-cancel=${()=>e.onClose()}
    >
      <div class="channels-wizard">
        <div class="channels-wizard__header">
          ${n?I(n,r,`tile`,{pluginIconUrl:e.channelIconUrl?.(n)}):C}
          <div class="channels-wizard__heading">
            <h2>${b(`channels.setup.title`,{channel:r})}</h2>
            <div class="muted channels-wizard__subtitle">
              <span>${b(`channels.setup.subtitle`)}</span>
              ${n?w`<a
                      class="channels-wizard__link"
                      href=${xt(n)}
                      target="_blank"
                      rel="noreferrer noopener"
                      >${b(`channels.setup.viewDocs`)}</a
                    >`:C}
            </div>
          </div>
        </div>
        <div class="channels-wizard__body">${Xt(i)} ${a}</div>
      </div>
    </zero-modal-dialog>
  `}function Qt(){return(Qt=e((()=>{T(),P(),Qe(),u(),pe()})))()}function $t(e){let t=e.channels.channelsSnapshot,n=en(t),i=n.filter(e=>r(t,e)),a=n.filter(e=>!r(t,e)),o=!!(e.channels.channelsLoading&&e.channels.channelsSnapshot&&e.channels.channelsLastSuccess),s=e.channels.channelsSnapshot?.warnings?.filter(e=>e.trim()).map(e=>p(e))??[],c=e.selectedChannel;return w`
    ${Me(w`
      ${o?w`<div class="callout info">${b(`channels.refreshingStaleSnapshot`)}</div>`:C}
      ${e.channels.channelsSnapshot?.partial?w`
              <div class="callout warn">
                ${b(`channels.hub.partialSnapshot`)}
                ${s.length>0?s.slice(0,3).join(`; `):``}
              </div>
            `:C}
      ${e.channels.channelsError?w`<div class="callout danger">${e.channels.channelsError}</div>`:C}
      ${e.wizardHost.blockedByDirtyConfig&&e.config.configFormDirty?w`<div class="callout warn">${b(`channels.hub.saveBeforeSetup`)}</div>`:C}
      ${M({title:b(`channels.hub.connectedTitle`),...i.length>0?{count:i.length}:{},actions:Ot({updatedAt:e.channels.channelsLastSuccess,disabled:e.channels.channelsLoading,onRefresh:()=>e.onRefresh(!0)})},i.length===0?w`
              <div class="channels-empty">
                <!-- No configured transports is a true empty state, so Clawd rests here. -->
                <zero-mascot mood="sleepy" .size=${80}></zero-mascot>
                ${A(b(`channels.hub.noneConnected`))}
              </div>
            `:Se(i,e=>e,t=>sn(t,e)))}
      ${M({title:b(`channels.hub.addTitle`),description:b(`channels.hub.addSubtitle`)},w`
          ${e.canAdmin?w`${Se(a,e=>e,t=>cn(t,e))}
                ${ln(e)}`:w`<div class="callout info" role="note">${b(`channels.hub.adminRequired`)}</div>`}
        `)}
      ${Lt(e)}
    `)}
    ${c?Gt({channelId:c,label:Q(e,c),pluginIconUrl:e.presentation.pluginIconUrls[c],props:e,onClose:()=>e.onCloseDetail(),onSetup:()=>e.onStartSetup(c)}):C}
    ${e.canAdmin?Zt({wizard:e.wizardHost.state,channelLabel:t=>Q(e,t),channelIconUrl:t=>e.presentation.pluginIconUrls[t],multiselectValues:e.wizardHost.multiselect,onToggleMultiselect:t=>e.wizardHost.toggleMultiselect(t),textValue:e.wizardHost.textValue,secretVisible:e.wizardHost.secretVisible,onTextInput:t=>e.wizardHost.textValue=t,onToggleSecretVisibility:()=>e.wizardHost.toggleSecretVisibility(),onAnswer:t=>e.wizardHost.answer(t),onClose:()=>e.wizardHost.close(),whatsappQrDataUrl:e.channels.whatsappLoginQrDataUrl,whatsappMessage:e.channels.whatsappLoginMessage,whatsappConnected:e.channels.whatsappLoginConnected,whatsappBusy:e.channels.whatsappBusy,onWhatsAppStart:e.onWhatsAppStart,onWhatsAppWait:e.onWhatsAppWait}):C}
    ${zt(e)}
  `}function en(e){let t=e?.channelMeta?.length?e.channelMeta.map(e=>e.id):e?.channelOrder??[];return[...new Set([...t,...dn])]}function tn(e,t){return e.presentation.pluginCatalog?.plugins.find(e=>e.id===t)}function Q(e,t){let n=e.channels.channelsSnapshot,r=n?.channelLabels;return tn(e,t)?.name??n?.channelMeta?.find(e=>e.id===t)?.label??(r&&Object.hasOwn(r,t)?r[t]:void 0)??t}function nn(e,t){let n=e.channels.channelsSnapshot,r=n?.channelDetailLabels,i=n?.channelMeta?.find(e=>e.id===t)?.detailLabel??(r&&Object.hasOwn(r,t)?r[t]:null);return i&&i!==Q(e,t)?i:null}function rn(e,t){let n=V(e,t);return(typeof n.status?.lastError==`string`&&n.status.lastError.trim()?n.status.lastError:h(t.channels.channelsSnapshot?.channelAccounts,e).find(e=>e.lastError)?.lastError)?`attention`:n.running===!0||n.connected===!0?`running`:`configured`}function an(e){let{kind:t,labelKey:n}=un[e];return N({kind:t,label:b(n)})}function on(e,t){let n=h(t.channels.channelsSnapshot?.channelAccounts,e).reduce((e,t)=>Math.max(e,t.lastInboundAt??0),0);return n?b(`channels.hub.lastMessageAgo`,{ago:y(n)}):null}function sn(e,t){let n=Q(t,e),r=t.channels.channelsSnapshot?.statusIssues?.find(t=>t.channel===e),i=r?p(r.message):on(e,t)??nn(t,e)??b(`channels.hub.openDetails`);return w`
    <button
      type="button"
      class="settings-row settings-row--nav channels-item"
      @click=${()=>t.onShowDetail(e)}
    >
      ${I(e,n,`tile`,{pluginIconUrl:t.presentation.pluginIconUrls[e]})}
      <div class="settings-row__text">
        <span class="settings-row__title">${n}</span>
        <span class="settings-row__desc">${i}</span>
      </div>
      <div class="settings-row__control">
        ${an(r?`attention`:rn(e,t))}
        <span class="settings-row__chevron">${x.chevronRight}</span>
      </div>
    </button>
  `}function cn(e,t){let n=tn(t,e),r=Q(t,e),i=n?.description??nn(t,e)??b(`channels.hub.guidedSetup`);return w`
    <div class="settings-row channels-item">
      <button
        type="button"
        class="channels-item__detail"
        title=${b(`channels.hub.openDetails`)}
        @click=${()=>t.onShowDetail(e)}
      >
        ${I(e,r,`tile`,{pluginIconUrl:t.presentation.pluginIconUrls[e]})}
        <span class="settings-row__text">
          <span class="settings-row__title">${r}</span>
          <span class="settings-row__desc">${i}</span>
        </span>
      </button>
      <div class="settings-row__control">
        <button type="button" class="btn btn--sm" @click=${()=>t.onStartSetup(e)}>
          ${b(`channels.hub.setUp`)}
        </button>
      </div>
    </div>
  `}function ln(e){return w`
    <button
      type="button"
      class="settings-row settings-row--nav channels-item"
      @click=${()=>e.onStartSetup(null)}
    >
      <span
        class="channels-tile channels-tile--fallback"
        style="--channels-art-a:#64748b;--channels-art-b:#1e293b"
        aria-hidden="true"
      >
        <span>+</span>
      </span>
      <div class="settings-row__text">
        <span class="settings-row__title">${b(`channels.hub.browseAllTitle`)}</span>
        <span class="settings-row__desc">${b(`channels.hub.browseAllSubtitle`)}</span>
      </div>
      <div class="settings-row__control">
        <span class="settings-row__chevron">${x.chevronRight}</span>
      </div>
    </button>
  `}var un,dn;function fn(){return(fn=e((()=>{T(),we(),P(),le(),Be(),j(),u(),n(),_(),d(),Kt(),Y(),q(),Qt(),un={running:{kind:`ok`,labelKey:`channels.hub.stateRunning`},configured:{kind:`muted`,labelKey:`channels.hub.stateConfigured`},attention:{kind:`danger`,labelKey:`channels.hub.stateAttention`}},dn=[`whatsapp`,`telegram`,`discord`,`googlechat`,`slack`,`signal`,`imessage`,`nostr`]})))()}function pn(e,t){let n=e.state.channelsSnapshot,r=t??n?.channelDefaultAccountId.whatsapp??`default`,i=h(n?.channelAccounts,`whatsapp`).find(e=>e.accountId===r);return!i&&t!==void 0?null:{accountId:r,linked:i?.linked??(t===void 0?k(n?.channels.whatsapp)?.linked:void 0)}}async function mn(e){let t=pn(e.channels,e.getWizardAccountId());if(!t||!e.isCurrent()||!await ze({title:b(`channels.whatsapp.logoutConfirmTitle`,{accountId:t.accountId}),message:b(`channels.whatsapp.logoutConfirmMessage`,{accountId:t.accountId}),confirmLabel:b(`common.logout`),danger:!0})||!e.isCurrent())return;let n=pn(e.channels,e.getWizardAccountId());n&&n.accountId===t.accountId&&n.linked===t.linked&&await e.channels.logoutWhatsApp(t.accountId)}function hn(){return(hn=e((()=>{Ve(),u(),n()})))()}async function gn(e,t,n,r){let i=!1,a=e.request(t,n).then(e=>(i&&r?.(e),e));return await De(a,vn,()=>{throw i=!0,Error(`wizard request timed out: ${t}`)})}function _n(e,t){t.sessionId&&!t.done&&e.request(`wizard.cancel`,{sessionId:t.sessionId}).catch(()=>{})}var vn,yn;function bn(){return(bn=e((()=>{Oe(),_(),f(),vn=12e4,yn=class{constructor(e,t,n,r){this.getClient=e,this.onChange=t,this.isKnownChannel=n,this.sessionExpiredMessage=r,this.currentState={phase:`idle`},this.sessionId=null,this.channel=null,this.generation=0,this.abortController=null,this.pendingCancellation=null}get state(){return this.currentState}async start(e){let t=this.getClient();if(!t)return;let n=++this.generation;this.abortController?.abort(),this.abortController=new AbortController,this.sessionId=null,this.channel=e,this.setState({phase:`starting`,channel:e});try{let r=this.pendingCancellation;if(r?.client===t&&(await r.completion,this.generation!==n))return;let i=await gn(t,`wizard.start`,{flow:`channels`,...e?{channel:e}:{}},e=>_n(t,e));if(this.generation!==n){_n(t,i);return}this.sessionId=i.sessionId??null,this.applyResult(i)}catch(t){if(this.generation!==n)return;this.setState({phase:`error`,channel:e,message:v(t)})}}async answer(e){let t=this.currentState;if(!this.getClient()||!this.sessionId||t.phase!==`step`||t.busy)return;let n=this.generation;t.step.type===`select`&&typeof e==`string`&&this.isKnownChannel(e)&&(this.channel??=e),this.setState({...t,busy:!0,validationError:null}),await this.advance(n,{stepId:t.step.id,value:e})}async advance(e,n){let r=this.getClient(),i=this.sessionId;if(!r||!i||this.generation!==e)return;let a=this.abortController?.signal;if(n||a)try{let t={sessionId:i,...n?{answer:n}:{}},o=n?await gn(r,`wizard.next`,t):await r.request(`wizard.next`,t,{timeoutMs:null,...a?{signal:a}:{}});if(this.generation!==e)return;this.applyResult(o)}catch(n){if(this.generation!==e)return;if(t(n)){this.sessionId=null,this.abortController?.abort(),this.abortController=null,this.setState({phase:`error`,channel:this.channel,message:this.sessionExpiredMessage()});return}this.setState({phase:`error`,channel:this.channel,message:v(n)})}}async cancel(){let e=this.getClient(),t=this.sessionId;if(this.generation+=1,this.sessionId=null,this.abortController?.abort(),this.abortController=null,this.channel=null,this.setState({phase:`idle`}),e&&t){let n=Promise.resolve().then(()=>gn(e,`wizard.cancel`,{sessionId:t,closeInput:!0})).catch(()=>{});this.pendingCancellation={client:e,completion:n},await n,this.pendingCancellation?.completion===n&&(this.pendingCancellation=null)}}applyResult(e){if(!e.done&&e.step){let t=e.step.executor===`gateway`;this.setState({phase:`step`,channel:this.channel,step:e.step,busy:t,validationError:e.error?p(e.error):null}),t&&this.advance(this.generation);return}if(this.sessionId=null,this.abortController=null,e.status===`done`){let t=e.channels??[];this.setState({phase:`done`,channel:this.channel??t[0]??null,channels:t,accounts:e.accounts??[]});return}if(e.status===`cancelled`){this.channel=null,this.setState({phase:`idle`});return}this.setState({phase:`error`,channel:this.channel,message:p(e.error,`Wizard failed.`)})}setState(e){this.currentState=e,this.onChange()}}})))()}var xn;function Sn(){return(Sn=e((()=>{u(),bn(),xn=class{constructor(e){this.deps=e,this.multiselect=[],this.textValue=``,this.secretVisible=!1,this.blockedByDirtyConfig=!1,this.stepId=null,this.lastPhase=`idle`,this.controller=new yn(()=>e.getContext()?.gateway.snapshot.client??null,()=>this.handleControllerChange(),t=>e.getContext()?.channels.state.channelsSnapshot?.channelMeta?.some(e=>e.id===t)??!1,()=>b(`channels.setup.sessionExpired`))}get state(){return this.controller.state}startSetup(e){if(this.deps.getContext()?.runtimeConfig.state.configFormDirty){this.blockedByDirtyConfig=!0,this.deps.requestUpdate();return}this.blockedByDirtyConfig=!1,this.whatsappAccountId=void 0,this.deps.clearSelection(),this.controller.start(e)}close(){let e=this.controller.state.phase!==`idle`;this.controller.cancel(),e&&this.deps.getContext()?.channels.refresh(!0)}cancelOnDisconnect(){this.controller.cancel()}answer(e){this.controller.answer(e)}toggleMultiselect(e){this.multiselect=this.multiselect.includes(e)?this.multiselect.filter(t=>t!==e):[...this.multiselect,e],this.deps.requestUpdate()}toggleSecretVisibility(){this.secretVisible=!this.secretVisible,this.deps.requestUpdate()}handleControllerChange(){let e=this.controller.state,t=e.phase===`step`?e.step.id:null;t!==this.stepId&&(this.stepId=t,this.multiselect=e.phase===`step`&&Array.isArray(e.step.initialValue)?[...e.step.initialValue]:[],this.textValue=e.phase===`step`&&e.step.type===`text`&&typeof e.step.initialValue==`string`?e.step.initialValue:``,this.secretVisible=!1),e.phase===`done`&&this.lastPhase!==`done`&&this.handleCompleted(e),this.lastPhase=e.phase,this.deps.requestUpdate()}async handleCompleted(e){let t=this.deps.getContext();if(!t)return;let n=()=>this.controller.state===e&&this.deps.getContext()===t;if(await t.runtimeConfig.discardDraft({reloadOnly:!0}),!n()||(await t.channels.refresh(!0),!n()))return;let r=e.accounts.find(e=>e.channel===`whatsapp`);r&&(this.whatsappAccountId=r.accountId,await t.channels.startWhatsApp(!1,r.accountId))}}})))()}function Cn(e,t){return e instanceof DOMException&&e.name===`TimeoutError`?b(`channels.nostr.notices.timeout`):b(`channels.nostr.notices.operationFailed`,{prefix:t,error:v(e)})}var wn,Tn,$;function En(){return(En=e((()=>{Ae(),T(),ye(),ne(),re(),se(),ge(),ue(),fe(),j(),Le(),u(),n(),_(),Ke(),c(),Je(),a(),pt(),_t(),bt(),fn(),hn(),Sn(),wn=3e4,Tn=`http://127.0.0.1:18789/channels`,$=class extends ee{constructor(...e){super(...e),this.nostrProfileFormState=null,this.nostrProfileAccountId=null,this.selectedChannel=null,this.pairingChannelFilter=null,this.pairingAccountFilter=null,this.pairingPrompt=null,this.pairingNotice=null,this.pluginPresentation=new gt({getContext:()=>this.context,getChannelIds:()=>en(this.context.channels.state.channelsSnapshot),isConnected:()=>this.isConnected,requestUpdate:()=>this.requestUpdate()}),this.wizardHost=new xn({getContext:()=>this.context,requestUpdate:()=>this.requestUpdate(),clearSelection:()=>this.selectedChannel=null}),this.schemaLoadStarted=!1,this.gatewayPairingAuthSignature=null,this.gateway=new Ge(this,{getGateway:()=>this.context?.gateway,onIdentityChange:()=>this.clearNostrForm(),onSnapshot:e=>this.handleGatewaySnapshot(e)}),this.pairingPolling=new Xe(this,wn,()=>{let e=this.context?.gateway.snapshot;e?.phase===`connected`&&S(e.hello?.auth??null)&&this.context.channels.refreshPairing()},!1,`visible`),this.subscriptions=new i(this).effect(()=>this.context?.channels,e=>{let t=this.channelsSource!==void 0&&this.channelsSource!==e;this.channelsSource=e,t&&this.invalidateNostrForm();let n=()=>{this.channelsSource===e&&(this.reconcilePairingFilter(e.state.pairingSnapshot),this.pluginPresentation.ensure(this.context.gateway.snapshot.client),this.requestUpdate())};return n(),e.subscribe(n)}).effect(()=>this.context?.runtimeConfig,e=>{this.schemaLoadStarted=!1;let t=()=>{this.context.runtimeConfig===e&&(this.requestUpdate(),this.ensureInitialData())};t();let n=e.subscribe(t);return()=>{n(),this.schemaLoadStarted=!1}}).watchStore(()=>this.context?.theme)}handleGatewaySnapshot(e){let t=e.snapshot,n=S(t.hello?.auth??null),r=l(t),i=!e.initial&&this.gatewayPairingAuthSignature!==r;(e.identityChanged||t.phase!==`connected`)&&this.clearNostrForm(),(e.identityChanged||e.connectionChanged||t.phase!==`connected`)&&this.pluginPresentation.reset(),(e.identityChanged||i||t.phase!==`connected`||!n)&&(this.pairingPrompt=null,this.setPairingFilter(null,null),this.pairingNotice=null),this.gatewayPairingAuthSignature=r,this.syncPairingPolling(t),t.phase===`connected`&&t.client?(e.initial||this.ensureInitialData(),!e.initial&&(e.identityChanged||e.connectionChanged||i)&&n&&this.context.channels.refreshPairing()):this.schemaLoadStarted=!1}syncPairingPolling(e){if(e.phase===`connected`&&e.client&&S(e.hello?.auth??null)){this.pairingPolling.start();return}this.pairingPolling.stop()}ensureInitialData(){let e=this.context,t=e.gateway.snapshot,n=t.client;if(t.phase!==`connected`||!n)return;this.pluginPresentation.ensure(n);let r=e.channels.state,i=e.runtimeConfig.state;!r.channelsSnapshot&&!r.channelsLoading&&e.channels.refresh(!1),S(t.hello?.auth??null)&&!r.pairingSnapshot&&!r.pairingLoading&&e.channels.refreshPairing(),!i.configSnapshot&&!i.configLoading&&e.runtimeConfig.ensureLoaded(),!i.configSchema&&!i.configSchemaLoading&&!this.schemaLoadStarted&&(this.schemaLoadStarted=!0,e.runtimeConfig.ensureSchemaLoaded())}disconnectedCallback(){this.wizardHost.cancelOnDisconnect(),this.selectedChannel=null,this.channelsSource=void 0,this.gatewayPairingAuthSignature=null,this.pairingPrompt=null,this.setPairingFilter(null,null),this.pairingNotice=null,this.pairingPolling.stop(),this.pluginPresentation.reset(),this.invalidateNostrForm(),this.subscriptions.clear(),this.schemaLoadStarted=!1,super.disconnectedCallback()}setShowAdvancedSettings(e){he({showAdvancedSettings:e}),this.context.theme.refresh()}async saveChannelConfig(){this.context&&await this.context.runtimeConfig.save()&&await this.context.channels.refresh(!0)}async reloadChannelConfig(){let e=this.context;e&&(await e.runtimeConfig.discardDraft({reloadOnly:!0}),await e.channels.refresh(!0))}async confirmWhatsAppLogout(){let e=this.context,t=e.channels,n=this.gateway.capture();n&&this.channelsSource===t&&await mn({channels:t,getWizardAccountId:()=>this.wizardHost.whatsappAccountId,isCurrent:()=>this.gateway.isCurrent(n)&&this.context===e&&this.channelsSource===t})}clearNostrForm(){this.nostrProfileFormState=null,this.nostrProfileAccountId=null}invalidateNostrForm(){this.gateway.invalidate(),this.clearNostrForm()}beginNostrOperation(){let e=this.gateway.gateway,t=this.context.channels,n=this.gateway.capture();if(!e||!n||this.channelsSource!==t||this.context.gateway!==e||(this.gateway.invalidate(),n=this.gateway.capture(),!n))return null;let r=t.state.channelsSnapshot?.channelAccounts?.nostr??[];return{scope:n,gateway:e,channels:t,formAccountId:this.nostrProfileAccountId,accountId:this.nostrProfileAccountId??r[0]?.accountId??`default`,authCandidates:te({hello:e.snapshot.hello,settings:{token:e.connection.token},password:e.connection.password})}}currentNostrForm(e){let t=this.nostrProfileFormState;return!t||!this.gateway.isCurrent(e.scope)||this.nostrProfileAccountId!==e.formAccountId||this.context.gateway!==e.gateway||this.context.channels!==e.channels||e.gateway.snapshot.client!==e.scope.client?null:t}editNostrProfile(e,t){this.gateway.invalidate(),this.nostrProfileAccountId=e,this.nostrProfileFormState=yt(t??void 0)}editNostrForm(e){let t=this.nostrProfileFormState;t&&(this.nostrProfileFormState=e(t))}async updateNostrProfile(e){let t=this.nostrProfileFormState;if(!t||t.saving||t.importing)return;let n=this.beginNostrOperation();if(!n)return;let r=e===`save`?`saving`:`importing`;this.nostrProfileFormState={...t,[r]:!0,error:null,success:null,...e===`save`?{fieldErrors:{}}:{}};try{let i={accountId:n.accountId,authCandidates:n.authCandidates,isCurrent:()=>this.currentNostrForm(n)!==null},a=e===`save`?{action:e,...await lt({...i,values:t.values})}:{action:e,...await dt(i)},o=this.currentNostrForm(n);if(!o)return;let s={...o,[r]:!1,error:null,success:null};if(!a.response.ok||a.data?.ok===!1||!a.data){this.nostrProfileFormState={...s,error:a.errorMessage,...a.action===`save`?{fieldErrors:ct(a.data?.details)}:{}};return}if(a.action===`save`){if(!a.data.persisted){this.nostrProfileFormState={...s,error:b(`channels.nostr.notices.publishFailed`)};return}this.nostrProfileFormState={...s,success:b(`channels.nostr.notices.published`),fieldErrors:{},original:{...t.values}}}else{let e=a.data.merged??a.data.imported??null,t=e?{...o.values,...e}:o.values;this.nostrProfileFormState={...s,values:t,success:a.data.saved?b(`channels.nostr.notices.importedFromRelays`):b(`channels.nostr.notices.imported`),showAdvanced:!!(t.banner||t.website||t.nip05||t.lud16)}}(a.action===`save`||a.data.saved)&&await n.channels.refresh(!0)}catch(t){let i=this.currentNostrForm(n);if(!i)return;this.nostrProfileFormState={...i,[r]:!1,error:Cn(t,b(e===`save`?`channels.nostr.notices.updateFailed`:`channels.nostr.notices.importFailed`)),success:null}}}reconcilePairingFilter(e){if(!e||!this.pairingChannelFilter)return;let t=e.accounts.filter(e=>e.channel===this.pairingChannelFilter);if(t.length===0){this.setPairingFilter(null,null);return}this.pairingAccountFilter&&!t.some(e=>e.accountId===this.pairingAccountFilter)&&(this.pairingAccountFilter=null)}setPairingFilter(e,t){this.pairingChannelFilter=e,this.pairingAccountFilter=e?t:null}reviewPairingAccount(e,t){this.selectedChannel=null,this.setPairingFilter(e,t),this.updateComplete.then(()=>{this.renderRoot.querySelector(`#channels-pairing-requests`)?.scrollIntoView({behavior:Ye(),block:`start`})})}openPairingPrompt(e,t){this.context.channels.state.pairingBusyRequestId||(this.pairingNotice=null,this.pairingPrompt={kind:e,request:t,notify:!1,bootstrapCommandOwner:!1})}patchPairingPrompt(e){this.pairingPrompt&&={...this.pairingPrompt,...e}}async confirmPairingPrompt(){let e=this.pairingPrompt;if(!e)return;let t={channel:e.request.channel,accountId:e.request.accountId,requestId:e.request.requestId};if(e.kind===`dismiss`){await this.context.channels.dismissPairing(t)&&this.pairingPrompt===e&&(this.pairingPrompt=null,this.pairingNotice=b(`channels.pairing.dismissedNotice`));return}let n=await this.context.channels.approvePairing({...t,notify:e.notify,bootstrapCommandOwner:e.bootstrapCommandOwner});n&&this.pairingPrompt===e&&(this.pairingPrompt=null,this.pairingNotice=b(n.commandOwnerBootstrap===`unavailable`?n.notification===`failed`?`channels.pairing.approvedFollowupsFailedNotice`:`channels.pairing.approvedOwnerFailedNotice`:n.notification===`failed`?`channels.pairing.approvedNotificationFailedNotice`:n.commandOwnerBootstrap===`configured`?`channels.pairing.approvedOwnerNotice`:`channels.pairing.approvedNotice`))}render(){let e=this.context,t=e.channels.state,n=e.runtimeConfig.state,r=e.gateway.snapshot.hello?.auth??null,i=S(r),a=_e(r);return w`
      <section class="content-header" ${me({toolbarHeader:!0})}>
        <div>
          <div class="page-title">${ie(`channels`)}</div>
          <div class="page-subtitle">
            ${ve(`channels`)} ${Ne(Tn)}
          </div>
        </div>
      </section>
      ${He($t({channels:t,config:n,presentation:this.pluginPresentation,wizardHost:this.wizardHost,pairingChannelFilter:this.pairingChannelFilter,pairingAccountFilter:this.pairingAccountFilter,pairingPrompt:this.pairingPrompt,pairingNotice:this.pairingNotice,canManagePairing:i,canAdmin:a,showAdvancedSettings:ce().showAdvancedSettings===!0,nostrProfileFormState:this.nostrProfileFormState,nostrProfileAccountId:this.nostrProfileAccountId,selectedChannel:this.selectedChannel,onShowDetail:e=>{this.selectedChannel=e},onCloseDetail:()=>{this.selectedChannel=null},onStartSetup:e=>{a&&this.wizardHost.startSetup(e)},onRefresh:t=>void e.channels.refresh(t),onPairingRefresh:()=>void e.channels.refreshPairing(),onPairingFilterChange:(e,t)=>this.setPairingFilter(e,t),onPairingReviewAccount:(e,t)=>this.reviewPairingAccount(e,t),onPairingApprove:e=>this.openPairingPrompt(`approve`,e),onPairingDismiss:e=>this.openPairingPrompt(`dismiss`,e),onPairingPromptChange:e=>this.patchPairingPrompt(e),onPairingPromptCancel:()=>{this.pairingPrompt=null},onPairingPromptConfirm:()=>void this.confirmPairingPrompt(),onWhatsAppStart:t=>void e.channels.startWhatsApp(t,this.wizardHost.whatsappAccountId),onWhatsAppWait:()=>void e.channels.waitWhatsApp(this.wizardHost.whatsappAccountId),onWhatsAppLogout:()=>void this.confirmWhatsAppLogout(),onShowAdvancedSettings:e=>this.setShowAdvancedSettings(e),onConfigPatch:(t,n)=>e.runtimeConfig.patchForm(t,n),onConfigSave:()=>void this.saveChannelConfig(),onConfigReload:()=>void this.reloadChannelConfig(),onNostrProfileEdit:(e,t)=>this.editNostrProfile(e,t),onNostrProfileCancel:()=>this.invalidateNostrForm(),onNostrProfileFieldChange:(e,t)=>this.editNostrForm(n=>({...n,values:{...n.values,[e]:t},fieldErrors:{...n.fieldErrors,[e]:``}})),onNostrProfileSave:()=>void this.updateNostrProfile(`save`),onNostrProfileImport:()=>void this.updateNostrProfile(`import`),onNostrProfileToggleAdvanced:()=>this.editNostrForm(e=>({...e,showAdvanced:!e.showAdvanced}))}))}
    `}},O([ke({context:de,subscribe:!0})],$.prototype,`context`,void 0),O([E()],$.prototype,`nostrProfileFormState`,void 0),O([E()],$.prototype,`nostrProfileAccountId`,void 0),O([E()],$.prototype,`selectedChannel`,void 0),O([E()],$.prototype,`pairingChannelFilter`,void 0),O([E()],$.prototype,`pairingAccountFilter`,void 0),O([E()],$.prototype,`pairingPrompt`,void 0),O([E()],$.prototype,`pairingNotice`,void 0),customElements.get(`zero-channels-page`)||customElements.define(`zero-channels-page`,$)})))()}En();
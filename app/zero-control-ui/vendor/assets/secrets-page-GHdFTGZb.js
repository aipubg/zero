import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gu as t,Lu as n,Nu as r,Pu as i,W as a,Wu as o,ju as s,xu as c,yu as l,z as ee,zu as u}from"./control-ui-core-DCNBgr3X.js";import{Aa as d,Ai as f,Ba as p,ca as te,ki as ne,oa as m,qr as h}from"./control-ui-core-DwX5Mpz4.js";import{G as g,J as _,W as v,Z as y,n as b,rt as x,t as re}from"./lit-runtime-B40xFCK_.js";import{c as ie,l as ae}from"./gateway-runtime-JSfC8ThO.js";import{Ur as oe,Wr as se,Zr as S,ci as ce}from"./ui-AaV6iNVa.js";import{B as C,G as le,I as w,K as ue,L as de,Mi as fe,U as pe,Y as me,l as he,na as ge,ta as _e,u as T}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ml as E,Nl as D}from"./control-ui-boot-shared-CzJHozXQ.js";import{n as O,t as k}from"./ref-contract-CScW3KIp.js";function A(){return(A=e((()=>{ce(),O()})))()}function j(e){return M.test(e)}var M;function N(){return(N=e((()=>{M=/_?(API_KEY|TOKEN|PASSWORD|PRIVATE_KEY|SECRET)$/i})))()}function P(e){let t={},n=e.replace(/\r\n?/gu,`
`);F.lastIndex=0;let r;for(;(r=F.exec(n))!==null;){let e=r[1];if(!e)continue;let n=(r[2]??``).trim(),i=n[0];n=n.replace(/^(['"`])([\s\S]*)\1$/gmu,`$2`),i===`"`&&(n=n.replace(/\\n/gu,`
`).replace(/\\r/gu,`\r`)),t[e]=n}return t}var F;function I(){return(I=e((()=>{F=/^\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?$/gmu})))()}var L,R;function z(){return(z=e((()=>{t(),L={secretsStore:{name:`Name`,access:`Access`,accessMode:`Access mode`,value:`Value`,allowedHosts:o.secretsStore.allowedHosts,allowedHostsPlaceholder:o.secretsStore.allowedHostsPlaceholder,allowedHostsHint:`Exact hostnames only, one per line or comma-separated. No wildcards or ports.`,noAllowedHosts:`None`,updated:`Last updated`,by:`{time} by {name}`,actions:`Actions`,add:`Add`,edit:`Edit`,bulk:`Bulk Add`,protectedSecret:o.secretsStore.protectedSecret,protectedSecretHint:`Hidden after save and inert unless referenced by a SecretRef or used through enabled destination-bound Gateway egress. It is never directly readable.`,agentReadable:o.secretsStore.agentReadable,agentReadableHint:`High risk: visible to admins and plaintext to Gateway-hosted agent commands. The agent can print, transmit, or persist it. Applies from the next run.`,hint:o.secretsStore.hint,required:`Enter a value.`,detect:`Protect credential-like names automatically`,detected:`{count} protected secrets detected`,detectedOne:`{count} protected secret detected`,unavail:`Gateway/admin required.`,badName:`Use SERVICE_API_KEY.`,tooLarge:`Max 64 KiB.`,savedProtected:`Saved {name} as Protected secret. Add a SecretRef or enable destination-bound Gateway egress to use it.`,savedReadable:`Saved {name} as Agent-readable environment. It is available to Gateway-hosted agent commands from the next run.`,savedMany:`Saved {count} entries ({protected} protected, {readable} agent-readable). Protected secrets need a SecretRef or enabled destination-bound Gateway egress; agent-readable environment values reach Gateway-hosted agent commands from the next run.`,warnings:`{count} runtime warnings.`,partial:`{saved}/{total}: {error}`,confirmDelete:`Delete {name}?`,deleted:`Deleted {name}.`,deleteFailed:`The secret was not deleted. Reload the list and try again.`}},R=Object.assign(()=>{Object.assign(o.secretsStore,L.secretsStore)},{catalog:L})})))()}function B(e={}){return{client:e.client??null,connected:e.connected??!1,entries:[],loaded:!1,loading:!1,busy:!1,error:null}}async function V(e,t){let n=await t.request(`secrets.store.list`,{});return e.client!==t||!e.connected?!1:(e.entries=n.entries,e.loaded=!0,!0)}async function H(e){let t=e.client;if(!t||!e.connected||e.loading)return!1;e.loading=!0,e.error=null;try{return await V(e,t)}catch(n){return e.client===t&&(e.error=l(n)),!1}finally{e.client===t&&(e.loading=!1)}}async function U(e,t){let n=e.client,r=typeof t!=`function`;if(!n||!e.connected||e.busy||r&&t.entries.length===0)return null;e.busy=!0,e.error=null;let i=null,a=0,o=0,s;try{if(r)for(let r of t.entries){let t=await n.request(`secrets.store.set`,r);a+=1,o=Math.max(o,t.warningCount??0),await V(e,n)}else i=await t(n)}catch(e){s=r?Error(u(`secretsStore.partial`,{saved:String(a),total:String(t.entries.length),error:l(e)})):e}try{(!r||s)&&await V(e,n)}catch(e){s??=e}finally{e.client===n&&(e.busy=!1,e.error=s?l(s):null)}return s?null:r?{saved:a,warningCount:o}:i}function ve(e,t){return U(e,e=>e.request(`secrets.store.set`,{name:t.name,value:t.value,kind:t.kind,...t.kind===`secret`?{allowedHosts:t.allowedHosts.split(/[\s,]+/u).filter(Boolean)}:{}}))}function ye(e,t){return U(e,e=>e.request(`secrets.store.delete`,{name:t}))}function be(e,t){let n=P(e),r=Object.keys(n).filter(e=>!k.test(e));return{entries:Object.entries(n).map(([e,n])=>({name:e,value:n,kind:t&&j(e)?`secret`:`env`})),invalidNames:r}}function xe(e,t){return U(e,{entries:t})}function W(){return(W=e((()=>{A(),N(),I(),i(),z(),c(),R()})))()}function G(e,t){let[n,r,i]={value:[`value`,e.draft.value,e.onDraftValueChange],hosts:[`allowed-hosts`,e.draft.allowedHosts,e.onDraftAllowedHostsChange],bulk:[`bulk-values`,e.bulkRaw,e.onBulkRawChange]}[t];return _`<label class="secrets-store-field">
    <span>${u(t===`hosts`?`secretsStore.allowedHosts`:`secretsStore.value`)}</span>
    <textarea
      class="settings-input secrets-store-dialog__${t}${t===`hosts`?` mono`:``}"
      name=${n}
      autocomplete="off"
      spellcheck="false"
      ?autofocus=${t===`bulk`}
      placeholder=${t===`hosts`?u(`secretsStore.allowedHostsPlaceholder`):g}
      ?disabled=${e.busy}
      .value=${r}
      @input=${e=>i(e.currentTarget.value)}
    ></textarea>
    ${t===`hosts`?_`<small>${u(`secretsStore.allowedHostsHint`)}</small>`:g}
  </label>`}function Se(e){let t=ee(e.updatedAtMs,{fallback:u(`common.unknown`)});return e.updatedBy?u(`secretsStore.by`,{time:t,name:e.updatedBy}):t}function Ce(e,t){return!e.canSet&&!e.canDelete?_``:_`
    <wa-dropdown
      class="secrets-store__menu"
      placement="bottom-end"
      @wa-select=${n=>{n.detail.item.value===`edit`&&e.canSet?e.onOpenEdit(t):n.detail.item.value===`delete`&&e.canDelete&&e.onDelete(t)}}
    >
      <button
        slot="trigger"
        type="button"
        class="btn btn--sm btn--ghost secrets-store__menu-trigger"
        aria-label=${`${u(`secretsStore.actions`)}: ${t.name}`}
        title=${u(`secretsStore.actions`)}
        ?disabled=${e.busy}
      >
        ${m(`moreHorizontal`)}
      </button>
      ${e.canSet?_`<wa-dropdown-item value="edit">${u(`secretsStore.edit`)}</wa-dropdown-item>`:g}
      ${e.canDelete?_`<wa-dropdown-item value="delete" variant="danger"
              >${u(`common.delete`)}</wa-dropdown-item
            >`:g}
    </wa-dropdown>
  `}function we(e){return e.canList?e.loading&&!e.entries.length?pe():e.entries.length?_`
    <div class="secrets-store__table-wrap">
      <table class="secrets-store__table settings-table--stacked" role="table">
        <thead>
          <tr>
            <th scope="col">${u(`secretsStore.name`)}</th>
            <th scope="col">${u(`secretsStore.access`)}</th>
            <th scope="col">${u(`secretsStore.value`)}</th>
            <th scope="col">${u(`secretsStore.allowedHosts`)}</th>
            <th scope="col">${u(`secretsStore.updated`)}</th>
            <th scope="col" class="secrets-store__actions-heading">
              <span class="settings-control__sr-label">${u(`secretsStore.actions`)}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          ${b(e.entries,e=>e.name,t=>_`
              <tr tabindex="0" aria-label=${t.name}>
                <td data-label=${u(`secretsStore.name`)}>
                  <code class="secrets-store__name" title=${t.name}>${t.name}</code>
                </td>
                <td data-label=${u(`secretsStore.access`)}>
                  <span class="secrets-store__mode secrets-store__mode--${t.kind}"
                    >${u(t.kind===`secret`?`secretsStore.protectedSecret`:`secretsStore.agentReadable`)}</span
                  >
                </td>
                <td data-label=${u(`secretsStore.value`)}>
                  <span
                    class="secrets-store__value ${t.kind===`secret`?`secrets-store__value--secret`:``}"
                    title=${t.kind===`env`?t.value:g}
                    >${t.kind===`env`?t.value:Y}</span
                  >
                </td>
                <td data-label=${u(`secretsStore.allowedHosts`)}>
                  <span class="secrets-store__hosts">
                    ${t.kind===`secret`&&(t.allowedHosts?.length??0)>0?t.allowedHosts?.join(`, `):u(`secretsStore.noAllowedHosts`)}
                  </span>
                </td>
                <td data-label=${u(`secretsStore.updated`)}>
                  <time
                    class="secrets-store__updated"
                    datetime=${new Date(t.updatedAtMs).toISOString()}
                    title=${new Intl.DateTimeFormat(n.getLocale(),{dateStyle:`medium`,timeStyle:`short`}).format(new Date(t.updatedAtMs))}
                    >${Se(t)}</time
                  >
                </td>
                <td class="secrets-store__actions-cell" data-label=${u(`secretsStore.actions`)}>
                  ${Ce(e,t)}
                </td>
              </tr>
            `)}
        </tbody>
      </table>
    </div>
  `:_`
      <div class="secrets-store__empty">
        ${C(u(`tabs.secrets`))} ${de(J,u(`common.docs`))}
      </div>
    `:C(u(`secretsStore.unavail`))}function K(e,t,n=!1){let r=u(n?`secretsStore.bulk`:e.dialogMode===`edit`?`secretsStore.edit`:`secretsStore.add`),i=n?e.onCloseBulk:e.onCloseDialog,a=n&&(!e.bulkEntryCount||e.bulkInvalidNames.length>0);return _`<zero-modal-dialog
    label=${r}
    description=${n?g:u(`secretsStore.hint`)}
    @modal-cancel=${i}
  >
    <form
      class="secrets-store-dialog"
      aria-busy=${e.busy?`true`:`false`}
      @submit=${t=>{t.preventDefault(),e[n?`onSubmitBulk`:`onSubmitDraft`]()}}
    >
      <div class="secrets-store-dialog__header"><h2>${r}</h2></div>
      ${t}
      ${e.formError?_`<div class="callout danger" role="alert">${e.formError}</div>`:g}
      <div class="secrets-store-dialog__actions">
        <button class="btn primary" type="submit" ?disabled=${e.busy||a}>
          ${e.busy?u(`common.saving`):u(`common.save`)}
        </button>
        <button class="btn" type="button" ?disabled=${e.busy} @click=${i}>
          ${u(`common.cancel`)}
        </button>
      </div>
    </form>
  </zero-modal-dialog>`}function Te(e){if(!e.dialogMode)return g;let t=e.dialogMode===`edit`;return K(e,_`
      <label class="secrets-store-field">
        <span>${u(`secretsStore.name`)}</span>
        <input
          class="settings-input mono"
          name="name"
          autocomplete="off"
          spellcheck="false"
          autofocus
          ?readonly=${t}
          ?disabled=${e.busy}
          .value=${e.draft.name}
          @input=${t=>e.onDraftNameChange(t.currentTarget.value)}
        />
      </label>
      ${G(e,`value`)}
      <fieldset class="secrets-store-modes">
        <legend>${u(`secretsStore.accessMode`)}</legend>
        ${[`secret`,`env`].map(t=>{let n=t===`secret`?`secrets-store-mode--selected`:`secrets-store-mode--selected secrets-store-mode--risk`;return _`<label
            class="secrets-store-mode ${e.draft.kind===t?n:``}"
          >
            <input
              type="radio"
              name="access-mode"
              value=${t}
              .checked=${e.draft.kind===t}
              ?disabled=${e.busy}
              @change=${()=>e.onDraftKindChange(t)}
            />
            <span>
              <strong
                >${u(t===`secret`?`secretsStore.protectedSecret`:`secretsStore.agentReadable`)}</strong
              >
              <small
                >${u(t===`secret`?`secretsStore.protectedSecretHint`:`secretsStore.agentReadableHint`)}</small
              >
            </span>
          </label>`})}
      </fieldset>
      ${e.draft.kind===`secret`?G(e,`hosts`):g}
    `)}function Ee(e){return e.bulkOpen?K(e,_`
      ${G(e,`bulk`)}
      <div class="secrets-store-bulk__summary" aria-live="polite">
        ${u(e.bulkSecretCount===1?`secretsStore.detectedOne`:`secretsStore.detected`,{count:String(e.bulkSecretCount)})}
      </div>
      <label class="secrets-store-checkbox">
        <input
          type="checkbox"
          .checked=${e.bulkAutoDetect}
          ?disabled=${e.busy}
          @change=${t=>e.onBulkAutoDetectChange(t.currentTarget.checked)}
        />
        <span>
          <strong>${u(`secretsStore.detect`)}</strong>
        </span>
      </label>
      ${e.bulkInvalidNames.length?_`<div class="callout danger" role="alert">
              ${u(`secretsStore.badName`)} ${e.bulkInvalidNames.join(`, `)}
            </div>`:g}
    `,!0):g}function q(e){let t=e.canSet?_`
        <button
          class="btn btn--sm"
          type="button"
          ?disabled=${e.busy}
          @click=${e.onOpenBulk}
        >
          ${u(`secretsStore.bulk`)}
        </button>
        <button
          class="btn btn--sm primary"
          type="button"
          ?disabled=${e.busy}
          @click=${e.onOpenAdd}
        >
          ${m(`plus`)} ${u(`secretsStore.add`)}
        </button>
      `:void 0;return _`
    ${le(_`
        ${e.error?_`<div class="callout danger secrets-store__message" role="alert">
                <span>${e.error}</span>
                ${e.canList?_`<button class="btn btn--sm" type="button" @click=${e.onRefresh}>
                        ${u(`common.retry`)}
                      </button>`:g}
              </div>`:g}
        ${e.notice?_`<div
                class="callout success secrets-store__message"
                role="status"
                aria-live="polite"
              >
                ${e.notice}
              </div>`:g}
        ${me({title:u(`tabs.secrets`),actions:t,count:e.entries.length},we(e))}
      `,{wide:!0})}
    ${Te(e)} ${Ee(e)}
  `}var J,Y;function X(){return(X=e((()=>{v(),re(),te(),h(),w(),fe(),i(),z(),a(),R(),J=`http://127.0.0.1:18789/gateway/secrets#shared-secret-store`,Y=`••••••••`})))()}var Z,Q;function $(){return($=e((()=>{se(),v(),y(),A(),N(),d(),f(),_e(),w(),he(),i(),ae(),W(),D(),r(),X(),Z=65536,Q=class extends s{constructor(...e){super(...e),this.store=B(),this.dialogMode=null,this.draft={name:``,value:``,kind:`env`,allowedHosts:``},this.secretKindOverridden=!1,this.bulkOpen=!1,this.bulkRaw=``,this.bulkAutoDetect=!0,this.formError=null,this.notice=null,this.gateway=new E(this,{getGateway:()=>this.context?.gateway,invalidateRequests:e=>this.resetGatewayState(e.snapshot),onSnapshot:e=>{e.initial&&this.resetGatewayState(e.snapshot)},ensureInitialData:()=>this.ensureInitialData()})}resetGatewayState(e){this.store=B({client:e?.client??null,connected:e?.phase===`connected`}),this.dialogMode=null,this.bulkOpen=!1,this.formError=null,this.notice=null}canCall(e){return ie(this.gateway.snapshot,e,`operator.admin`)}ensureInitialData(){this.canCall(`secrets.store.list`)&&!this.store.loaded&&!this.store.loading&&this.runStoreTask(H)}async runStoreTask(e){let t=this.store;try{let n=e(t);this.requestUpdate(),await n}finally{this.store===t&&this.requestUpdate()}}openEntry(e){this.canCall(`secrets.store.set`)&&(this.notice=null,this.formError=null,this.secretKindOverridden=!!e,this.draft=e?{name:e.name,value:e.kind===`env`?e.value:``,kind:e.kind,allowedHosts:e.kind===`secret`?(e.allowedHosts??[]).join(`
`):``}:{name:``,value:``,kind:`env`,allowedHosts:``},this.dialogMode=e?`edit`:`add`)}closeDialog(e=!1){this.store.busy||(e?this.bulkOpen=!1:this.dialogMode=null,this.formError=null)}patchDraft(e){this.draft={...this.draft,...e},this.formError=null}changeDraftName(e){let t=e.toUpperCase();this.patchDraft({name:t,...this.secretKindOverridden?{}:{kind:j(t)?`secret`:`env`}})}validateValue(e,t){return t===`secret`&&e.length===0?u(`secretsStore.required`):new TextEncoder().encode(e).byteLength>Z?u(`secretsStore.tooLarge`):null}saveEntryTask(e,t){this.runStoreTask(async n=>{let r=await e(n);if(this.store!==n)return;if(!r){this.formError=n.error;return}let i=t(r);this.formError=null,this.notice=r.warningCount?`${i} ${u(`secretsStore.warnings`,{count:String(r.warningCount)})}`:i})}submitDraft(){if(!this.canCall(`secrets.store.set`)||!this.dialogMode)return;let e=k.test(this.draft.name)?this.validateValue(this.draft.value,this.draft.kind):u(`secretsStore.badName`);if(e){this.formError=e;return}let t={...this.draft};this.saveEntryTask(e=>ve(e,t),()=>(this.dialogMode=null,u(t.kind===`secret`?`secretsStore.savedProtected`:`secretsStore.savedReadable`,{name:t.name})))}openBulk(){this.canCall(`secrets.store.set`)&&(this.notice=null,this.formError=null,this.bulkRaw=``,this.bulkAutoDetect=!0,this.bulkOpen=!0)}get bulkParsed(){return be(this.bulkRaw,this.bulkAutoDetect)}submitBulk(){if(!this.canCall(`secrets.store.set`)||!this.bulkOpen)return;let e=this.bulkParsed;if(e.invalidNames.length>0){this.formError=`${u(`secretsStore.badName`)} ${e.invalidNames.join(`, `)}`;return}if(e.entries.length===0){this.formError=u(`secretsStore.required`);return}for(let t of e.entries){let e=this.validateValue(t.value,t.kind);if(e){this.formError=`${t.name}: ${e}`;return}}this.saveEntryTask(t=>xe(t,e.entries),t=>(this.bulkOpen=!1,u(`secretsStore.savedMany`,{count:String(t.saved),protected:String(e.entries.filter(e=>e.kind===`secret`).length),readable:String(e.entries.filter(e=>e.kind===`env`).length)})))}async removeEntry(e){let t=this.context.gateway,n=this.store.client;if(n&&this.canCall(`secrets.store.delete`)&&await ge({title:u(`common.delete`),message:u(`secretsStore.confirmDelete`,{name:e.name}),confirmLabel:u(`common.delete`),danger:!0})){if(this.notice=null,this.context.gateway!==t||this.store.client!==n||!this.canCall(`secrets.store.delete`)){this.store.error=u(`secretsStore.deleteFailed`),this.requestUpdate();return}await this.runStoreTask(async t=>{await ye(t,e.name)&&this.store===t&&(this.notice=u(`secretsStore.deleted`,{name:e.name}))})}}render(){let e=this.bulkParsed,t=q({entries:this.store.entries,loading:this.store.loading,busy:this.store.busy,error:this.store.error,notice:this.notice,canList:this.canCall(`secrets.store.list`),canSet:this.canCall(`secrets.store.set`),canDelete:this.canCall(`secrets.store.delete`),dialogMode:this.dialogMode,draft:this.draft,formError:this.formError,bulkOpen:this.bulkOpen,bulkRaw:this.bulkRaw,bulkAutoDetect:this.bulkAutoDetect,bulkSecretCount:e.entries.filter(e=>e.kind===`secret`).length,bulkEntryCount:e.entries.length,bulkInvalidNames:e.invalidNames,onRefresh:()=>{this.canCall(`secrets.store.list`)&&this.runStoreTask(H)},onOpenAdd:()=>this.openEntry(),onOpenEdit:e=>this.openEntry(e),onCloseDialog:()=>this.closeDialog(),onDraftNameChange:e=>this.changeDraftName(e),onDraftValueChange:e=>this.patchDraft({value:e}),onDraftAllowedHostsChange:e=>this.patchDraft({allowedHosts:e}),onDraftKindChange:e=>{this.secretKindOverridden=!0,this.patchDraft({kind:e})},onSubmitDraft:()=>this.submitDraft(),onOpenBulk:()=>this.openBulk(),onCloseBulk:()=>this.closeDialog(!0),onBulkRawChange:e=>{this.bulkRaw=e,this.formError=null},onBulkAutoDetectChange:e=>{this.bulkAutoDetect=e,this.formError=null},onSubmitBulk:()=>this.submitBulk(),onDelete:e=>void this.removeEntry(e)});return _`
      ${ue({title:p(`secrets`),subtitle:u(`secretsStore.hint`)})}
      ${T(t)}
    `}},S([oe({context:ne,subscribe:!0})],Q.prototype,`context`,void 0),S([x()],Q.prototype,`store`,void 0),S([x()],Q.prototype,`dialogMode`,void 0),S([x()],Q.prototype,`draft`,void 0),S([x()],Q.prototype,`secretKindOverridden`,void 0),S([x()],Q.prototype,`bulkOpen`,void 0),S([x()],Q.prototype,`bulkRaw`,void 0),S([x()],Q.prototype,`bulkAutoDetect`,void 0),S([x()],Q.prototype,`formError`,void 0),S([x()],Q.prototype,`notice`,void 0),customElements.get(`zero-secrets-page`)||customElements.define(`zero-secrets-page`,Q)})))()}$();
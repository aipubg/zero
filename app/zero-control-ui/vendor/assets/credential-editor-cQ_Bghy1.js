import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Nu as t,Pu as n,ii as r,ju as i,xu as a,yu as o,zu as s}from"./control-ui-core-DCNBgr3X.js";import{ca as c,qr as l,sa as u}from"./control-ui-core-DwX5Mpz4.js";import{G as d,J as f,W as p,Z as m,_ as h,at as g,rt as _,y as v}from"./lit-runtime-B40xFCK_.js";import{Zr as y}from"./ui-AaV6iNVa.js";import{dt as b,ft as x}from"./control-ui-boot-chat-D02HpoEK.js";import{i as S,n as C,r as w}from"./ref-contract-CScW3KIp.js";function T(e,t,n){return f`<zero-plugin-credential-editor
    .field=${e}
    .descriptor=${t}
    .context=${n}
  ></zero-plugin-credential-editor>`}var E,D;function O(){return(O=e((()=>{p(),m(),h(),C(),c(),l(),n(),b(),r(),a(),t(),x(),E=[`env`,`file`,`exec`,`store`],D=class extends i{constructor(...e){super(...e),this.inspection=null,this.loading=!1,this.error=``,this.dialogOpen=!1,this.reference={source:`env`,provider:`default`,id:``},this.literal=``,this.revealed=!1,this.saving=!1,this.cancelling=!1,this.referenceSubmitted=!1,this.generation=0,this.identity=``,this.fieldIdentity=``,this.connection=null}willUpdate(e){if(!this.context||!this.field||!this.descriptor)return;let t=JSON.stringify([this.context.pluginId,this.field.path,this.context.baseHash,this.context.gateway.epoch,this.context.canInspect]);if(t===this.identity&&this.binding===this.context.gateway)return;let n=JSON.stringify([this.context.pluginId,this.field.path]),r=this.binding!==this.context.gateway||this.fieldIdentity!==n||!this.context.canInspect||this.connection&&!this.context.gateway.isCurrent(this.connection),i=this.dialogOpen;if(this.identity=t,this.fieldIdentity=n,this.binding=this.context.gateway,this.revealed=!1,r&&(this.literal=``,this.dialogOpen=!1,this.saving=!1,this.cancelling=!1,this.referenceSubmitted=!1,this.reference={source:`env`,provider:`default`,id:``}),this.inspection=null,this.generation++,i&&!this.saving&&!r){this.error=s(`pluginsPage.credentials.stale`),this.loading=!1;return}this.inspect()}disconnectedCallback(){this.generation++,this.inspection=null,this.revealed=!1,this.literal=``,this.reference={source:`env`,provider:`default`,id:``},this.referenceSubmitted=!1,super.disconnectedCallback()}async inspect(e=!1){let{gateway:t,pluginId:n,baseHash:r,canInspect:i}=this.context,a=t.capture(),c=++this.generation;if(this.connection=a,this.error=``,this.loading=!1,i&&a&&r){this.loading=!0;try{let i=await a.client.request(`plugins.credentials.inspect`,{pluginId:n,path:this.field.path,baseHash:r,...e?{reveal:!0}:{}});if(c!==this.generation||!t.isCurrent(a))return;if(i.baseHash!==this.context.baseHash){this.error=s(`pluginsPage.credentials.stale`);return}this.inspection=i.credential.kind===`literal`&&!e?{kind:`literal`}:i.credential,this.revealed=e&&i.credential.kind===`literal`&&i.credential.value!==void 0,this.dialogOpen&&i.credential.kind===`reference`&&(this.reference={...i.credential.ref})}catch(e){c===this.generation&&t.isCurrent(a)&&(this.error=o(e))}finally{c===this.generation&&t.isCurrent(a)&&(this.loading=!1)}}}toggleReveal(){this.revealed?(this.revealed=!1,this.inspection?.kind===`literal`&&(this.inspection={kind:`literal`})):this.literal?this.revealed=!0:this.inspect(!0)}openReference(){this.referenceSubmitted=!1;let e=this.inspection;this.reference=e?.kind===`reference`?{...e.ref}:{source:`env`,provider:`default`,id:``},this.dialogOpen=!0}async patch(e){if(this.field.disabled||this.saving||!this.context.canInspect||!this.connection||!this.context.gateway.isCurrent(this.connection))return;let t=this.context.gateway,n=this.connection,r=JSON.stringify([this.context.pluginId,this.field.path]);return this.commitOrDiscardReference(()=>this.isConnected&&this.context.gateway===t&&t.isCurrent(n)&&JSON.stringify([this.context.pluginId,this.field.path])===r,e)}async cancelReference(){if(this.saving||this.cancelling)return;if(!this.referenceSubmitted){this.dialogOpen=!1;return}let e=this.context.gateway,t=this.connection,n=this.fieldIdentity;return this.commitOrDiscardReference(()=>this.isConnected&&this.context.gateway===e&&t!==null&&e.isCurrent(t)&&this.fieldIdentity===n,void 0)}async commitOrDiscardReference(e,t){let n=t===void 0?`cancelling`:`saving`;this[n]=!0,t!==void 0&&(this.referenceSubmitted||=this.dialogOpen,this.error=``);try{let n=await(t===void 0?this.context.onDiscard():this.context.onCommit(this.field.path,t));if(!e())return;n?(this.referenceSubmitted=!1,this.dialogOpen=!1,t!==void 0&&(this.literal=``),await this.inspect()):this.error=this.context.saveError||s(t===void 0?`configView.discardUnconfirmed`:`pluginsPage.credentials.saveFailed`)}catch(t){e()&&(this.error=o(t))}finally{e()&&(this[n]=!1)}}renderDialog(){if(!this.dialogOpen)return d;let e=this.inspection?.kind===`environment`?this.inspection.envVar:null,t=this.field.disabled||this.loading||this.saving||this.cancelling||!this.inspection,n=this.error||this.context.saveError;return f`<zero-modal-dialog
      .label=${`${s(`pluginsPage.credentials.referenceTitle`)}: ${this.descriptor.label}`}
      @modal-cancel=${e=>{e.preventDefault(),this.cancelReference()}}
    >
      <section class="plugin-credential__dialog">
        <h2>${s(`pluginsPage.credentials.referenceTitle`)}</h2>
        ${e?f`<p>${s(`pluginsPage.credentials.environmentHelp`,{name:e})}</p>`:f`
                <p>${s(`pluginsPage.credentials.referenceHelp`)}</p>
                <label
                  >${s(`pluginsPage.credentials.source`)}<select
                    autofocus
                    class="settings-input"
                    aria-label=${s(`pluginsPage.credentials.source`)}
                    .value=${this.reference.source}
                    ?disabled=${t}
                    @change=${e=>{if(e.currentTarget instanceof HTMLSelectElement){let t=e.currentTarget.value,n=E.find(e=>e===t);n&&(this.reference={...this.reference,source:n})}}}
                  >
                    ${E.map(e=>f`<option value=${e} ?selected=${e===this.reference.source}>${s(`pluginsPage.credentials.sources.${e}`)}</option>`)}
                  </select></label
                >
                ${[`provider`,`id`].map(e=>f`<label
                    >${s(`pluginsPage.credentials.${e===`id`?`identifier`:e}`)}<input
                      class="settings-input"
                      .value=${this.reference[e]}
                      ?disabled=${t}
                      @input=${t=>{t.currentTarget instanceof HTMLInputElement&&(this.reference={...this.reference,[e]:t.currentTarget.value})}}
                  /></label>`)}
                <p class="muted">${s(`pluginsPage.credentials.help.${this.reference.source}`)}</p>
                ${this.inspection?.kind===`reference`&&this.inspection.unresolved?f`<p class="callout warn">${s(`pluginsPage.credentials.unresolved`)}</p>`:d}
              `}
        ${n?f`<p role="alert" class="callout danger">${n}</p>`:d}
        <footer>
          <button
            class="btn"
            ?disabled=${this.saving||this.cancelling}
            @click=${()=>this.cancelReference()}
          >
            ${s(`common.cancel`)}
          </button>
          ${!this.inspection&&!this.loading?f`<button class="btn" @click=${()=>this.inspect()}>${s(`common.retry`)}</button>`:d}
          ${e?d:f`<button class="btn primary" ?disabled=${t||!S(this.reference)} @click=${()=>this.patch({...this.reference})}>${this.saving?s(`common.saving`):s(`common.save`)}</button>`}
        </footer>
      </section>
    </zero-modal-dialog>`}render(){if(!this.field||!this.descriptor||!this.context)return d;let e=this.inspection,t=this.field.value===`__ZERO_REDACTED__`||e?.kind===`literal`,n=e?.kind===`reference`||w(this.field.value),r=e?.kind===`environment`,i=this.field.disabled||this.saving||!this.context.canInspect||!this.context.gateway.connected||!this.context.baseHash;return f`<div class="plugin-credential">
      ${n||r?f`<div class="plugin-credential__reference">
              <span
                >${r?s(`pluginsPage.credentials.environment`,{name:e.envVar}):s(`pluginsPage.credentials.fromSource`,{source:e?.kind===`reference`?e.ref.source:w(this.field.value)?this.field.value.source:``})}</span
              >
              ${e?.kind===`reference`?f`<code>${e.ref.id}</code>`:d}
              <button
                class="btn btn--sm"
                aria-label=${`${s(r?`pluginsPage.credentials.viewSource`:`pluginsPage.credentials.editReference`)}: ${this.descriptor.label}`}
                aria-describedby=${v(this.field.descriptionId)}
                ?disabled=${this.loading||!e||!this.context.canInspect}
                @click=${()=>this.openReference()}
              >
                ${s(r?`pluginsPage.credentials.viewSource`:`pluginsPage.credentials.editReference`)}
              </button>
            </div>`:f`
              <div
                class="plugin-credential__input settings-secret"
                @focusout=${e=>{e.relatedTarget instanceof Element&&e.relatedTarget.closest(`.plugin-credential__input`)===e.currentTarget||this.literal&&this.patch(this.literal)}}
              >
                <input
                  class="settings-input"
                  aria-label=${this.descriptor.label}
                  aria-describedby=${v(this.field.descriptionId)}
                  autocomplete="off"
                  spellcheck="false"
                  type=${this.revealed?`text`:`password`}
                  .value=${this.literal||(this.revealed&&e?.kind===`literal`?e.value??``:``)}
                  placeholder=${t?s(`pluginsPage.credentials.stored`):this.descriptor.placeholder??``}
                  ?disabled=${i}
                  @input=${e=>{e.currentTarget instanceof HTMLInputElement&&(this.literal=e.currentTarget.value)}}
                  @keydown=${e=>{e.key===`Enter`&&this.literal&&(e.preventDefault(),this.patch(this.literal))}}
                />
                <button
                  class="settings-secret__toggle"
                  type="button"
                  aria-label=${`${s(this.revealed?`pluginsPage.credentials.hide`:`pluginsPage.credentials.reveal`)}: ${this.descriptor.label}`}
                  aria-pressed=${this.revealed}
                  ?disabled=${i||this.loading||!this.literal&&e?.kind!==`literal`}
                  @click=${()=>this.toggleReveal()}
                >
                  ${this.revealed?u.eyeOff:u.eye}
                </button>
              </div>
              <div class="plugin-credential__links">
                ${this.descriptor.signupUrl?f`<a href=${this.descriptor.signupUrl} target="_blank" rel="noopener noreferrer">${s(`pluginsPage.credentials.signup`)}${u.externalLink}</a>`:d}<button
                  class="btn btn--ghost btn--sm"
                  aria-label=${`${s(`pluginsPage.credentials.useReference`)}: ${this.descriptor.label}`}
                  aria-describedby=${v(this.field.descriptionId)}
                  ?disabled=${i||this.loading||!e||!this.context.canInspect}
                  @click=${()=>this.openReference()}
                >
                  ${s(`pluginsPage.credentials.useReference`)}
                </button>
              </div>
              ${t?f`<small>${s(`pluginsPage.credentials.replace`)}</small>`:d}
            `}
      ${this.loading?f`<span role="status" class="muted">${s(`common.loading`)}</span>`:d}
      ${e?.kind===`invalid`?f`<span role="alert">${s(`pluginsPage.credentials.invalidStored`)}</span>`:d}
      ${!this.dialogOpen&&(this.error||this.context.saveError)?f`<div role="alert">${this.error||this.context.saveError}<button class="btn btn--sm" @click=${()=>this.literal?this.patch(this.literal):this.inspect()}>${s(`common.retry`)}</button></div>`:d}
      ${this.renderDialog()}
    </div>`}},y([g({attribute:!1})],D.prototype,`field`,void 0),y([g({attribute:!1})],D.prototype,`descriptor`,void 0),y([g({attribute:!1})],D.prototype,`context`,void 0),y([_()],D.prototype,`inspection`,void 0),y([_()],D.prototype,`loading`,void 0),y([_()],D.prototype,`error`,void 0),y([_()],D.prototype,`dialogOpen`,void 0),y([_()],D.prototype,`reference`,void 0),y([_()],D.prototype,`literal`,void 0),y([_()],D.prototype,`revealed`,void 0),y([_()],D.prototype,`saving`,void 0),y([_()],D.prototype,`cancelling`,void 0),customElements.define(`zero-plugin-credential-editor`,D)})))()}export{T as n,O as t};
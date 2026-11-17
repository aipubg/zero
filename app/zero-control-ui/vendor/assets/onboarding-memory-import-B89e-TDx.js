import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Pu as i,bu as a,ju as o,xu as s,yu as c,zu as l}from"./control-ui-core-DCNBgr3X.js";import{qr as u,wr as d,yr as f}from"./control-ui-core-DwX5Mpz4.js";import{G as p,J as m,W as h,Z as g,at as _,rt as v}from"./lit-runtime-B40xFCK_.js";import{Mt as y,Zr as b,jt as x}from"./ui-AaV6iNVa.js";import{F as S,M as C,N as w,j as T}from"./control-ui-boot-shared-E4pYPcWx.js";function E(e){return e.items.filter(e=>e.status===`planned`)}function D(e){return e?.providers.filter(e=>e.found&&e.planFingerprint&&E(e).length>0)??[]}function O(){try{return globalThis.sessionStorage?.getItem(A)===`done`}catch{return!1}}function k(){try{globalThis.sessionStorage?.setItem(A,`done`)}catch{}}var A,j;function M(){return(M=e((()=>{T(),h(),g(),d(),i(),s(),y(),r(),n(),u(),A=`zero.onboarding.memory-import`,j=class extends o{constructor(...e){super(...e),this.active=!1,this.selectedByProvider={},this.applyingProviderId=null,this.results={},this.done=!1,this.closed=!1,this.subscriptions=new t(this).watchStore(()=>this.context?.gateway).watchStore(()=>this.context?.agents).watchStore(()=>this.context?.agentSelection),this.planTask=new C(this,{args:()=>{let e=this.context?.gateway.snapshot;return[this.active,this.closed,O(),this.isConnected&&e?.phase===`connected`?e.client??null:null,e?f(e.hello?.auth??null):!1,this.currentAgentId()]},task:async([e,t,n,r,i,a],{signal:o})=>{if(!e||t||n||!r||!i||!a||this.applyingProviderId!==null||this.done)return w;let s=await r.request(`migrations.memory.plan`,{agentId:a,overwrite:!1},{signal:o});return s.agentId!==a||D(s).length===0&&s.providers.some(e=>e.error)?w:{client:r,agentId:a,plan:s}},onComplete:({plan:e})=>{let t=D(e);if(t.length===0){e.providers.some(e=>e.error)||(k(),this.closed=!0);return}this.results={},this.done=!1,this.selectedByProvider=Object.fromEntries(t.map(e=>[e.providerId,!0]))}})}disconnectedCallback(){this.planTask.run([!1,!0,!0,null,!1,null]),this.subscriptions.clear(),super.disconnectedCallback()}updated(){if(this.context?.agents.state.agentsList)this.agentsListRequest=void 0;else if(this.context&&this.agentsListRequest!==this.context.agents){let e=this.context.agents;this.agentsListRequest=e,e.ensureList().catch(()=>null).then(()=>{this.context?.agents===e&&!e.state.agentsList&&(this.agentsListRequest=void 0)})}}currentAgentId(){let e=this.context?.agents.state.agentsList;if(!e)return null;let t=this.context?.agentSelection.state.selectedId;return t&&e.agents.some(e=>e.id===t)?t:e.defaultId??e.agents[0]?.id??null}get planBinding(){let e=this.planTask.value,t=this.context?.gateway.snapshot,n=this.currentAgentId();return this.planTask.status!==S.COMPLETE||!e?null:e.client===t?.client&&e.agentId===n?e:null}get plan(){return this.planBinding?.plan??null}toggleProvider(e,t){this.selectedByProvider={...this.selectedByProvider,[e]:t}}async importSelected(){let e=this.context,t=this.planBinding,n=t?.plan,r=t?.client,i=t?.agentId;if(!e||!r||!n||!i||this.applyingProviderId!==null||this.done)return;let a=D(n).filter(e=>this.selectedByProvider[e.providerId]);if(a.length!==0){for(let e of a){if(!this.isConnected||this.closed||this.context?.gateway.snapshot.client!==r||this.currentAgentId()!==i){this.results={...this.results,[e.providerId]:{kind:`error`,message:l(`onboarding.memoryImport.connectionChanged`)}};continue}let t=E(e).map(e=>e.id),n=e.planFingerprint;if(n&&t.length!==0){this.applyingProviderId=e.providerId;try{let a=await r.request(`migrations.memory.apply`,{idempotencyKey:x(),agentId:i,providerId:e.providerId,planFingerprint:n,itemIds:t,overwrite:!1});this.results={...this.results,[e.providerId]:{kind:a.summary.errors>0||a.summary.conflicts>0?`partial`:`success`,result:a}}}catch(t){this.results={...this.results,[e.providerId]:{kind:`error`,message:c(t,l(`onboarding.memoryImport.unknownError`))}}}}}this.applyingProviderId=null,this.done=this.context?.gateway.snapshot.client===r&&this.currentAgentId()===i,this.done||this.planTask.run()}}finish(){k(),this.closed=!0}reviewDetails(){this.finish(),this.context?.navigate(`memory-import`)}handleModalCancel(e){if(this.applyingProviderId!==null){e.preventDefault();return}this.finish()}renderProvider(e){let t=E(e).length,n=e.items.filter(e=>e.status===`conflict`).length,r=this.results[e.providerId],i=this.applyingProviderId===e.providerId;return m`
      <li class="onboarding-memory-import__provider" data-provider-id=${e.providerId}>
        <label>
          <input
            type="checkbox"
            .checked=${this.selectedByProvider[e.providerId]??!1}
            ?disabled=${this.applyingProviderId!==null||this.done}
            @change=${t=>this.toggleProvider(e.providerId,t.currentTarget.checked)}
          />
          <span class="onboarding-memory-import__provider-copy">
            <strong>${e.label}</strong>
            <code title=${e.source??``}
              >${e.source??l(`onboarding.memoryImport.sourceUnavailable`)}</code
            >
            <small>
              ${l(`onboarding.memoryImport.plannedCount`,{count:String(t)})}
              ${n>0?m`<span>
                      ${l(`onboarding.memoryImport.alreadyImported`,{count:String(n)})}
                    </span>`:p}
            </small>
          </span>
        </label>
        <div class="onboarding-memory-import__provider-status" aria-live="polite">
          ${i?l(`onboarding.memoryImport.importingProvider`):r?.kind===`success`?l(`onboarding.memoryImport.providerResult`,{migrated:String(r.result.summary.migrated),skipped:String(r.result.summary.skipped)}):r?.kind===`partial`?m`<span role="alert">
                      ${l(`onboarding.memoryImport.providerIncomplete`,{conflicts:String(r.result.summary.conflicts),errors:String(r.result.summary.errors),migrated:String(r.result.summary.migrated),skipped:String(r.result.summary.skipped)})}
                    </span>`:r?.kind===`error`?m`<span role="alert">
                        ${l(`onboarding.memoryImport.providerError`,{error:a(r.message)})}
                      </span>`:p}
        </div>
      </li>
    `}render(){let e=this.context,t=e?.gateway.snapshot,n=D(this.plan);if(!this.active||this.closed||O()||!e||t?.phase!==`connected`||!t.client||!f(t.hello?.auth??null)||n.length===0)return p;let r=n.filter(e=>this.selectedByProvider[e.providerId]).length,i=Object.values(this.results).filter(e=>e.kind!==`error`),a=i.reduce((e,t)=>e+t.result.summary.migrated,0),o=i.reduce((e,t)=>e+t.result.summary.skipped,0),s=l(`onboarding.memoryImport.title`),c=l(`onboarding.memoryImport.body`);return m`
      <zero-modal-dialog
        class="onboarding-memory-import-dialog"
        label=${s}
        description=${c}
        @modal-cancel=${e=>this.handleModalCancel(e)}
      >
        <section class="onboarding-memory-import">
          <header>
            <h2>${this.done?l(`onboarding.memoryImport.doneTitle`):s}</h2>
            <p>
              ${this.done?l(`onboarding.memoryImport.doneBody`,{migrated:String(a),skipped:String(o)}):c}
            </p>
          </header>
          <ul>
            ${n.map(e=>this.renderProvider(e))}
          </ul>
          <footer>
            ${this.done?m`<button
                    class="btn primary"
                    type="button"
                    data-test-id="onboarding-memory-import-continue"
                    @click=${()=>this.finish()}
                  >
                    ${l(`common.continue`)}
                  </button>`:m`
                    <button
                      class="btn primary"
                      type="button"
                      data-test-id="onboarding-memory-import-import"
                      ?disabled=${r===0||this.applyingProviderId!==null}
                      @click=${()=>void this.importSelected()}
                    >
                      ${this.applyingProviderId?l(`common.importing`):l(`onboarding.memoryImport.import`)}
                    </button>
                    <button
                      class="btn"
                      type="button"
                      data-test-id="onboarding-memory-import-skip"
                      ?disabled=${this.applyingProviderId!==null}
                      @click=${()=>this.finish()}
                    >
                      ${l(`onboarding.memoryImport.skip`)}
                    </button>
                    <button
                      class="btn btn--ghost onboarding-memory-import__review"
                      type="button"
                      ?disabled=${this.applyingProviderId!==null}
                      @click=${()=>this.reviewDetails()}
                    >
                      ${l(`onboarding.memoryImport.reviewDetails`)}
                    </button>
                  `}
          </footer>
        </section>
      </zero-modal-dialog>
    `}},b([_({attribute:!1})],j.prototype,`context`,void 0),b([_({type:Boolean})],j.prototype,`active`,void 0),b([v()],j.prototype,`selectedByProvider`,void 0),b([v()],j.prototype,`applyingProviderId`,void 0),b([v()],j.prototype,`results`,void 0),b([v()],j.prototype,`done`,void 0),b([v()],j.prototype,`closed`,void 0),customElements.get(`zero-onboarding-memory-import`)||customElements.define(`zero-onboarding-memory-import`,j)})))()}M();
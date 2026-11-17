import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gu as t,Pu as n,Wl as r,Wu as i,kl as a,xu as o,yu as s,zu as c}from"./control-ui-core-DCNBgr3X.js";import{ca as l,sa as u}from"./control-ui-core-DwX5Mpz4.js";import{G as d,J as f,W as p,Z as m,rt as h}from"./lit-runtime-B40xFCK_.js";import{Zr as g}from"./ui-AaV6iNVa.js";import{lr as _}from"./control-ui-boot-shared-ZuP0LiFD.js";import{n as v,r as y}from"./chat-session-panels-htX5AIg8.js";var b,x;function S(){return(S=e((()=>{t(),b={chat:{processesPanel:{back:`Back to Processes`,running:`Running ({count})`,finished:`Finished ({count})`,empty:`No background processes in this conversation.`,noRunning:`No running processes`,stop:`Stop {name}`,stopping:`Stopping…`,stopNotRequested:`The process could not be stopped. Refresh to check its current state.`,expired:`This process is no longer retained. Return to the process list.`,omitted:`This process is not included in the current limited list. Return to Processes or refresh.`,disconnected:`Connect to the Gateway to view processes.`,output:`Recent output`,noOutput:`No output recorded yet.`,exitCode:`Exit {code}`,retention:`Process output is retained temporarily. Viewing it does not consume the agent’s output.`,outputTruncated:`Earlier output is omitted from this retained tail.`,listTruncated:`Only a bounded process list is shown; running processes take priority.`,status:{running:`Running`,completed:`Completed`,failed:`Failed`,killed:`Stopped`}}}},x=Object.assign(()=>{Object.assign(i.chat.processesPanel,b.chat.processesPanel)},{catalog:b})})))()}var C,w;function T(){return(T=e((()=>{n(),S(),o(),a(),x(),C=5e3,w=class{constructor(e,t){this.context=e,this.changed=t,this.rows=[],this.loading=!1,this.hasResult=!1,this.truncated=!1,this.error=null,this.stopping=new Set,this.sessionId=null,this.input=null,this.scope=null,this.generation=0,this.disposed=!1,this.pending=null,this.timer=null,this.visibilityDocument=globalThis.document,this.visibilityChanged=()=>this.reconcile(),this.unsubscribe=e.gateway.subscribe(()=>this.reconcile()),this.visibilityDocument?.addEventListener(`visibilitychange`,this.visibilityChanged)}sync(e){(e.sessionKey!==this.input?.sessionKey||e.agentId!==this.input?.agentId)&&this.retire(),this.input=e,this.reconcile()}reconcile(){if(this.disposed)return;let e=this.input?.presented&&this.visibilityDocument?.visibilityState!==`hidden`?this.context.sessions.captureConnectionScope():null;if(!e||!this.input?.sessionKey){this.retire(),this.changed();return}this.scope&&!this.context.sessions.isConnectionScopeCurrent(this.scope)&&this.retire(),this.scope||(this.scope=e,this.refresh())}target(){let e=r({assistantAgentId:this.input.agentId,agentsList:this.context.agents.state.agentsList,hello:this.context.gateway.snapshot.hello},this.input.sessionKey,this.input.agentId);return{key:e.sessionKey,agentId:e.agentId}}refresh(){if(this.pending)return this.pending;let e=this.scope;if(!e||!this.input||!this.current(this.generation))return Promise.resolve();let t=this.generation;this.clearTimer(),this.loading=!0,this.error=null,this.changed();let n=e.client.request(`sessions.processes.list`,this.target()).then(e=>{if(this.current(t)){this.sessionId=e.sessionId,this.rows=e.processes,this.truncated=e.truncated,this.hasResult=!0;for(let e of this.stopping)this.rows.some(t=>t.instanceId===e&&t.status===`running`)||this.stopping.delete(e)}}).catch(e=>{this.current(t)&&(this.rows=[],this.sessionId=null,this.stopping.clear(),this.error=s(e))}).finally(()=>{this.pending===n&&(this.pending=null),this.current(t)&&(this.loading=!1,this.changed(),this.error||(this.timer=setTimeout(()=>void this.refresh(),C)))});return this.pending=n,n}async stop(e){let t=this.scope,n=this.sessionId,r=this.generation,i=this.rows.find(t=>t.processId===e.processId&&t.instanceId===e.instanceId);if(t&&n&&this.current(r)&&i?.canStop&&!this.stopping.has(e.instanceId)){this.clearTimer(),this.stopping.add(e.instanceId),this.error=null,this.changed();try{let i=await t.client.request(`sessions.processes.stop`,{...this.target(),sessionId:n,processId:e.processId,instanceId:e.instanceId});if(!this.current(r))return;if(!i.requested){this.stopping.delete(e.instanceId),this.error=c(`chat.processesPanel.stopNotRequested`),this.changed();return}await this.pending,this.current(r)&&await this.refresh()}catch(t){if(!this.current(r))return;this.stopping.delete(e.instanceId),this.error=s(t),this.changed()}}}current(e){return!this.disposed&&e===this.generation&&!!(this.scope&&this.context.sessions.isConnectionScopeCurrent(this.scope))}clearTimer(){this.timer!==null&&clearTimeout(this.timer),this.timer=null}retire(){this.generation+=1,this.clearTimer(),this.scope=null,this.pending=null,this.rows=[],this.sessionId=null,this.stopping.clear(),this.loading=!1,this.hasResult=!1,this.truncated=!1,this.error=null}dispose(){this.disposed=!0,this.retire(),this.unsubscribe(),this.visibilityDocument?.removeEventListener(`visibilitychange`,this.visibilityChanged)}}})))()}var E;function D(){return(D=e((()=>{p(),m(),l(),n(),T(),y(),_(),E=class extends v{constructor(...e){super(...e),this.selected=null,this.finishedOpen=!1,this.dataType=w}clearSelection(){this.selected=null}willUpdate(e){super.willUpdate(e),this.data?.error&&this.data.rows.length===0&&(this.selected=null)}status(e){return this.data?.stopping.has(e.instanceId)?c(`chat.processesPanel.stopping`):c(`chat.processesPanel.status.${e.status}`)}elapsed(e){return e.status!==`running`&&e.endedAt===void 0?d:f`<zero-elapsed-time
      .startMs=${e.startedAt}
      .endMs=${e.endedAt??null}
    ></zero-elapsed-time>`}stopButton(e,t=!1){let n=this.data?.stopping.has(e.instanceId);return e.status===`running`&&e.canStop?f`<button
          class="chat-processes__stop"
          type="button"
          aria-label=${c(`chat.processesPanel.stop`,{name:e.name})}
          title=${c(`chat.processesPanel.stop`,{name:e.name})}
          ?disabled=${n}
          @click=${()=>void this.data?.stop(e)}
        >
          ${u.square}${t?c(n?`chat.processesPanel.stopping`:`chat.runControls.stop`):d}
        </button>`:d}row(e){return f`<div class="chat-processes__item" role="listitem" data-process-id=${e.processId}>
      <div class="chat-processes__heading">
        <button
          class="chat-processes__open"
          type="button"
          title=${e.name}
          @click=${()=>{this.selected=e.instanceId}}
        >
          ${e.name}
        </button>
        ${this.stopButton(e)}
      </div>
      <div class="chat-processes__metadata">
        <span class=${e.status===`failed`?`chat-processes__failure`:``}
          >${this.status(e)}${e.exitCode==null?d:f` · ${c(`chat.processesPanel.exitCode`,{code:String(e.exitCode)})}`}</span
        >
        <span>${this.elapsed(e)}</span>
      </div>
    </div>`}render(){let e=this.data,t=e?.rows??[],n=t.find(e=>e.instanceId===this.selected),r=t.filter(e=>e.status===`running`),i=t.filter(e=>e.status!==`running`),a=e?.error?f`<div class="chat-processes__error" role="alert">
          ${e.error}<button class="btn btn--sm" type="button" @click=${()=>this.refresh()}>
            ${c(`common.retry`)}
          </button>
        </div>`:d;return this.selected?f`<div class="chat-processes__detail">
        <header class="chat-processes__detail-header">
          <button
            class="chat-processes__back"
            type="button"
            @click=${()=>{this.selected=null}}
          >
            ${u.arrowLeft}${c(`chat.processesPanel.back`)}
          </button>
          ${n?f`<div class="chat-processes__heading"><strong>${n.name}</strong>${this.stopButton(n,!0)}</div>`:d}
        </header>
        ${a}
        ${n?f`<div class="chat-processes__output">
                <div class="chat-processes__metadata">
                  <span>${this.status(n)}</span><span>${this.elapsed(n)}</span>
                </div>
                ${n.exitCode==null?d:f`<p class="chat-processes__note">${c(`chat.processesPanel.exitCode`,{code:String(n.exitCode)})}</p>`}
                ${n.exitReason?f`<p class="chat-processes__note">${n.exitReason}</p>`:d}
                <h3>${c(`chat.processesPanel.output`)}</h3>
                <pre>${n.tail||c(`chat.processesPanel.noOutput`)}</pre>
                <p class="chat-processes__note">${c(`chat.processesPanel.retention`)}</p>
                ${n.truncated?f`<p class="chat-processes__note">${c(`chat.processesPanel.outputTruncated`)}</p>`:d}
              </div>`:f`<div class="chat-processes__empty" role="status">
                ${c(e?.loading?`common.loading`:e?.hasResult?e.truncated?`chat.processesPanel.omitted`:`chat.processesPanel.expired`:`chat.processesPanel.disconnected`)}
              </div>`}
      </div>`:f`<div class="chat-processes__list" aria-busy=${e?.loading??!1}>
      ${a}
      ${t.length?this.renderGroups(`processes`,r,i,e=>e.instanceId,e=>this.row(e)):f`<div class="chat-processes__empty" role="status">
              ${e?.loading?c(`common.loading`):e?.hasResult&&!e.error?c(`chat.processesPanel.empty`):e?.error?d:c(`chat.processesPanel.disconnected`)}
            </div>`}
      ${e?.truncated?f`<p class="chat-processes__note">${c(`chat.processesPanel.listTruncated`)}</p>`:d}
    </div>`}},g([h()],E.prototype,`selected`,void 0),g([h()],E.prototype,`finishedOpen`,void 0),customElements.get(`zero-chat-processes-panel`)||customElements.define(`zero-chat-processes-panel`,E)})))()}D();
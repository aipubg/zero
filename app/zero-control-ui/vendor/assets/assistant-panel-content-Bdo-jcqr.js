import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Pu as i,ju as a,zu as o}from"./control-ui-core-DCNBgr3X.js";import{J as s,Y as c}from"./control-ui-boot-shared-CZXdmeIi.js";import{Ai as l,ca as u,ki as d,sa as f}from"./control-ui-core-DwX5Mpz4.js";import{G as p,J as m,W as h,Z as g,at as _,c as v,l as y,rt as b}from"./lit-runtime-B40xFCK_.js";import{Bi as x,Ur as S,Wr as C,Zr as w}from"./ui-AaV6iNVa.js";import{i as T,r as E,t as D}from"./chat/zero-surface-uGYwC5Bd.js";import"./control-ui-boot-shared-styles-BXPMRytW.js";import{H as O,U as k,V as A,n as j}from"./control-ui-boot-chat-B2JR-rGO.js";import{n as M}from"./control-ui-boot-chat-Cx6CBnJr.js";var N;function P(){return(P=e((()=>{C(),h(),g(),v(),c(),l(),i(),r(),j(),M(),u(),N=class extends a{constructor(...e){super(...e),this.sessionKey=``,this.agentId=``,this.workContext={page:`chat`},this.includeContext=!0,this.selection=``,this.selectionAvailable=!1,this.selectionScope=``,this.updateSelectionAvailability=()=>{let e=window.getSelection();this.selectionAvailable=!(!e||e.isCollapsed||!e.anchorNode||this.contains(e.anchorNode))},this.attachSelection=e=>{e.preventDefault();let t=window.getSelection();!t||t.isCollapsed||t.anchorNode&&this.contains(t.anchorNode)||(this.selection=x(t.toString(),640),this.includeContext=!0)}}connectedCallback(){super.connectedCallback(),document.addEventListener(`selectionchange`,this.updateSelectionAvailability),this.updateSelectionAvailability()}disconnectedCallback(){document.removeEventListener(`selectionchange`,this.updateSelectionAvailability),super.disconnectedCallback()}willUpdate(){let e=this.workContext,t=JSON.stringify([this.context.gateway.connection.gatewayUrl,this.sessionKey,this.agentId,e.page,e.detail,e.sessionKey,e.sessionId,e.agentId,e.file]);this.selectionScope&&this.selectionScope!==t&&(this.selection=``),this.selectionScope=t}render(){let e={...this.workContext,selection:this.selection||void 0},t=s(e),n=JSON.stringify([this.context.gateway.connection.gatewayUrl,this.agentId,this.sessionKey]);return m`
      <div class="assistant-panel-context">
        ${this.includeContext?m`
                <details>
                  <summary>
                    ${o(`assistantPanel.context`,{context:e.title||e.page})}
                  </summary>
                  <pre>${t}</pre>
                </details>
                <button
                  type="button"
                  class="rail-header__action"
                  aria-label=${o(`assistantPanel.removeContext`)}
                  @click=${()=>{this.includeContext=!1}}
                >
                  ${f.x}
                </button>
              `:m`<button
                type="button"
                class="btn btn--sm"
                @click=${()=>{this.includeContext=!0}}
              >
                ${o(`assistantPanel.includeContext`)}
              </button>`}
        <button
          type="button"
          class="rail-header__action"
          aria-label=${o(`assistantPanel.attachSelection`)}
          ?disabled=${!this.selectionAvailable}
          title=${o(`assistantPanel.attachSelection`)}
          @mousedown=${this.attachSelection}
          @click=${e=>{e.detail===0&&this.attachSelection(e)}}
        >
          ${f.messageSquare}
        </button>
        ${this.selection?m`<button
                type="button"
                class="btn btn--sm"
                aria-label=${o(`assistantPanel.removeSelection`)}
                @click=${()=>{this.selection=``}}
              >
                ${o(`assistantPanel.selection`)} ${f.x}
              </button>`:p}
      </div>
      ${y(n,m`<zero-chat-pane
          .paneId=${`home-dock:${n}`}
          .presentationId=${`home-dock:${n}`}
          .sessionKey=${this.sessionKey}
          .agentId=${this.agentId}
          .inputRegion=${`dock`}
          .active=${!0}
          .compact=${!0}
          .narrow=${!0}
          .workContext=${this.includeContext?e:void 0}
        ></zero-chat-pane>`)}
    `}},w([S({context:d,subscribe:!0})],N.prototype,`context`,void 0),w([_({attribute:!1})],N.prototype,`sessionKey`,void 0),w([_({attribute:!1})],N.prototype,`agentId`,void 0),w([_({attribute:!1})],N.prototype,`workContext`,void 0),w([b()],N.prototype,`includeContext`,void 0),w([b()],N.prototype,`selection`,void 0),w([b()],N.prototype,`selectionAvailable`,void 0),customElements.define(`zero-home-session`,N)})))()}var F;function I(){return(I=e((()=>{h(),g(),r(),n(),O(),T(),D(),P(),F=class extends a{constructor(){super(),this.active=!1,this.destination=`custodian`,this.sessionKey=``,this.agentId=``,this.pageRouteId=`chat`,this.pageSessionKey=``,this.pageAgentId=``,this.custodianVisible=!1,new t(this).watchStore(()=>this.store??E).watch(()=>this.context,(e,t)=>k(e,t)).watchStore(()=>this.context?.sessions).watchStore(()=>this.context?.agents).watchStore(()=>this.context?.gateway)}connectedCallback(){super.connectedCallback(),this.dispatchEvent(new CustomEvent(`assistant-custodian-store`,{detail:this.store??E,bubbles:!0}))}willUpdate(){let e=this.active&&this.destination===`custodian`;e&&!this.custodianVisible&&(this.store??E).refreshTranscriptIfIdle(),this.custodianVisible=e}render(){if(!this.active)return p;let e=this.store??E;return this.destination===`custodian`?m`<zero-custodian-surface
          .store=${e}
          .onboarding=${e.activeVariant===`onboarding`}
          .newAgentIntent=${e.activeVariant===`new-agent`}
          compact
        ></zero-custodian-surface>`:m`<zero-home-session
          .sessionKey=${this.sessionKey}
          .agentId=${this.agentId}
          .workContext=${this.sessionContext??(this.context?A(this.context,this.pageRouteId,this.pageSessionKey,this.pageAgentId):void 0)}
        ></zero-home-session>`}},w([_({type:Boolean})],F.prototype,`active`,void 0),w([_()],F.prototype,`destination`,void 0),w([_()],F.prototype,`sessionKey`,void 0),w([_()],F.prototype,`agentId`,void 0),w([_({attribute:!1})],F.prototype,`sessionContext`,void 0),w([_({attribute:!1})],F.prototype,`context`,void 0),w([_()],F.prototype,`pageRouteId`,void 0),w([_()],F.prototype,`pageSessionKey`,void 0),w([_()],F.prototype,`pageAgentId`,void 0),w([_({attribute:!1})],F.prototype,`store`,void 0),customElements.define(`zero-assistant-panel-content`,F)})))()}I();export{F as ZeroAssistantPanelContent};
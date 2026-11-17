import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Hs as t,Pu as n,kl as r,or as i,wl as a,zu as o}from"./control-ui-core-DCNBgr3X.js";import{_n as s,a as c,ca as l,go as u,hn as d,i as f,sa as p,vo as m,wn as h,wo as g}from"./control-ui-core-DwX5Mpz4.js";import{G as _,J as v,W as y,Z as b,at as x,n as S,rt as C,t as w}from"./lit-runtime-B40xFCK_.js";import{Zr as T}from"./ui-AaV6iNVa.js";import{Fi as E,Li as D,Qn as O,Sr as k,Xn as A,Zn as j,ar as M,cr as N,dr as P,hi as F,mi as I,or as L,sr as R,ur as z,xr as B}from"./control-ui-boot-shared-ZuP0LiFD.js";import{a as V,i as H,n as U,o as W,r as G,t as K}from"./roster-element-DasuvTln.js";function q(e){return v`<zero-sidebar-new-session-menu
    .host=${e}
    .active=${e.navigationVisible}
  ></zero-sidebar-new-session-menu>`}function J(e,t){let n=e.sessionNavigationAgentId(t),r=e.sessionDataContext?H(e.sessionDataContext).snapshot.cards.find(e=>e.id===n):void 0;return R({host:e,session:t,listItem:!1,icon:D(r??{id:n})})}function Y(e,t,n){return v`<zero-sidebar-agent-roster
    .host=${e}
    .active=${e.navigationVisible}
    .sections=${t}
    .empty=${n}
    .involvingMe=${e.sessionInvolvingMeFilterActive}
  ></zero-sidebar-agent-roster>`}var X,Z;function Q(){return(Q=e((()=>{y(),b(),w(),u(),d(),n(),V(),G(),U(),r(),B(),A(),M(),l(),E(),f(),z(),I(),W(),X=class extends K{constructor(...e){super(...e),this.sections=[],this.involvingMe=!1,this.empty=!1,this.collapsed=new Set,this.settingsScope=null,this.published=null}willUpdate(){let e=this.context.gateway.connection.gatewayUrl;this.settingsScope!==e&&(this.settingsScope=e,this.collapsed=new Set(s(e).sidebarCollapsedAgentIds??[]));let t=H(this.context);t.setInvolvingMe(this.involvingMe);let n=t.snapshot;(this.published?.snapshot!==n||this.published.collapsed!==this.collapsed)&&(this.published={snapshot:n,collapsed:this.collapsed},this.host.rosterSessionSource={result:n.result,agentIds:n.cards.map(e=>e.id),collapsedAgentIds:this.collapsed})}disconnectedCallback(){this.host.rosterSessionSource=null,H(this.context).setInvolvingMe(!1),super.disconnectedCallback()}toggleAgent(e){let t=new Set(this.collapsed);t.delete(e)||t.add(e),this.setCollapsedAgents(t)}setCollapsedAgents(e){h({gatewayUrl:this.context.gateway.connection.gatewayUrl,sidebarCollapsedAgentIds:[...e]},{selectGateway:!1}),this.collapsed=e}render(){return this.avatars.withActiveRoutes(()=>{let e=this.cards(),n=this.roster.error??this.roster.subscriptionError,r=this.host.readNewSessionAccess();return j(this.host,v`<div class="sidebar-agent-roster">
          ${n?v`<button class="sidebar-agent-roster__link" @click=${()=>void this.refresh()}>${o(`agentsHome.loadFailed`)}</button>`:_}
          ${this.roster.loading&&e.length===0?v`<span role="status" aria-label=${o(`common.loading`)} class="skeleton skeleton-line"></span>`:_}
          ${S(e,e=>e.id,n=>{let i=this.collapsed.has(n.id),s=this.sections.filter(e=>e.id.startsWith(`agent:${n.id}:`)),l=this.host.selectedAgentMainSessionKey(n.id),u=this.host.mainSessionRow(n.id),d=u?this.host.projectHomeSession(u,n.id):null,f=d?.childLoadParentKeys?.length?d.childLoadParentKeys:[u?.key??l],h=this.host.visibleHomeSession(n.id),g=s.some(e=>e.rows.length>0)||d?.loadingChildren||f.some(e=>this.host.sessionData.childSessionErrorsByParent.has(e))||d?.childLoadParentKeys?.some(e=>!this.host.sessionData.loadedChildSessionKeys.has(e)),y=m(this.host.activeRouteId)&&a(this.host.getRouteSessionKey(),l),b=[...h?[h]:[],...i?s.flatMap(e=>e.rows):[]],x=[b,i,i?s.reduce((e,t)=>e+t.rows.length,0):0,b.reduce((e,t)=>e+(t.workspaceConflictCount??0),0),F()];return v`<section
                class="sidebar-agent-roster__group"
                data-agent-group=${n.id}
                aria-label=${n.name}
              >
                <div class="sidebar-agent-roster__header session-row-host">
                  ${g?v`<button
                          type="button"
                          class="sidebar-agent-roster__action sidebar-agent-roster__chevron"
                          data-agent-collapse=${n.id}
                          aria-label=${o(i?`agentsHome.expandAgent`:`agentsHome.collapseAgent`,{agent:n.name})}
                          aria-expanded=${String(!i)}
                          @click=${()=>this.toggleAgent(n.id)}
                        >
                          <span class="sidebar-agent-roster__chevron" aria-hidden="true"
                            >${i?p.chevronRight:p.chevronDown}</span
                          >
                        </button>`:_}
                  <a
                    class="sidebar-agent-roster__row"
                    data-agent-id=${n.id}
                    href=${n.target.href}
                    aria-current=${y?`page`:_}
                    title=${o(`agentsHome.openChat`)}
                    @click=${e=>{t(e)&&(e.preventDefault(),this.host.openMainSession(n.id))}}
                  >
                    <span class="sidebar-agent-roster__avatar" aria-hidden="true">
                      ${D(n)}
                    </span>
                    <span class="sidebar-agent-roster__copy"><span>${n.name}</span></span>
                  </a>
                  <span class="sidebar-agent-roster__signals">
                    ${h?N(this.host,h,void 0,void 0,x).content:P(...x)}
                  </span>
                  <span
                    class="sidebar-agent-roster__actions"
                    @keydown=${e=>{e.key===` `&&e.target instanceof HTMLAnchorElement&&(e.preventDefault(),e.target.click())}}
                  >
                    ${c({basePath:this.host.basePath,agentId:n.id,className:`sidebar-agent-roster__action sidebar-agent-roster__new`,label:`${o(`agentChip.newConversation`)}: ${n.name}`,disabledReason:r.allowed?void 0:r.reason,onOpen:(e,t)=>this.host.requestOpenNewSession(e,t)})}
                    <wa-dropdown
                      class="sidebar-customize-menu sidebar-agent-roster__menu"
                      placement="bottom-end"
                      @wa-show=${()=>this.host.dismissTransientMenus()}
                      @wa-select=${t=>{switch(t.detail.item.value){case`main`:this.host.openMainSession(n.id);break;case`sessions`:this.context.agentSelection.setScope(n.id),this.host.onNavigate?.(`sessions`);break;case`collapse-others`:this.setCollapsedAgents(new Set(e.filter(e=>e.id!==n.id).map(e=>e.id)))}}}
                    >
                      <button
                        slot="trigger"
                        type="button"
                        class="sidebar-agent-roster__action"
                        aria-label=${o(`agentsHome.agentOptions`,{agent:n.name})}
                      >
                        ${p.moreHorizontal}
                      </button>
                      <wa-dropdown-item class="sidebar-customize-menu__item" value="main"
                        ><span slot="icon" class="nav-item__icon">${p.messageSquare}</span
                        >${o(`agentsHome.openMainChat`)}</wa-dropdown-item
                      >
                      <wa-dropdown-item class="sidebar-customize-menu__item" value="sessions"
                        ><span slot="icon" class="nav-item__icon">${p.listTree}</span
                        >${o(`agentsHome.allSessions`)}</wa-dropdown-item
                      >
                      <wa-dropdown-item class="sidebar-customize-menu__item" value="collapse-others"
                        ><span slot="icon" class="nav-item__icon">${p.foldVertical}</span
                        >${o(`agentsHome.collapseOthers`)}</wa-dropdown-item
                      >
                    </wa-dropdown>
                  </span>
                </div>
                ${i?_:v`${f.map(e=>L(this.host,e))}
                      ${s.map(e=>O({host:this.host,section:e,personHeaders:void 0}))}`}
              </section>`})}
          ${k(this.host,this.empty,this.connected&&this.roster.result!==null&&!this.roster.loading&&!n&&!this.roster.result.hasMore&&!this.host.sessionData.sessionMutationError)}
        </div>`)})}},T([x({attribute:!1,hasChanged:()=>!0})],X.prototype,`host`,void 0),T([x({attribute:!1})],X.prototype,`sections`,void 0),T([x({attribute:!1})],X.prototype,`involvingMe`,void 0),T([x({attribute:!1})],X.prototype,`empty`,void 0),T([C()],X.prototype,`collapsed`,void 0),customElements.define(`zero-sidebar-agent-roster`,X),Z=class extends K{render(){return this.avatars.withActiveRoutes(()=>{let e=this.host.readNewSessionAccess(),n=this.cards();return v`<wa-dropdown
        class="sidebar-new-session-menu"
        placement="bottom-end"
        aria-label=${o(`agentChip.agents`)}
        @wa-show=${()=>this.host.dismissTransientMenus()}
        @wa-select=${t=>{let r=t.detail.item;if(t.preventDefault(),r.dataset.nativeNavigation){delete r.dataset.nativeNavigation;return}let i=r.value;if(e.allowed&&i&&n.some(e=>e.id===i)){let e=this.querySelector(`wa-dropdown`);e&&(e.open=!1),this.host.requestOpenNewSession(i)}}}
      >
        <button
          slot="trigger"
          type="button"
          class="sidebar-brand__icon sidebar-brand__header-control sidebar-brand__new-thread"
          aria-label=${o(`agentChip.newConversation`)}
          title=${e.allowed?o(`agentChip.newConversation`):e.reason}
          ?disabled=${!e.allowed||n.length===0}
        >
          ${p.plus}
        </button>
        ${n.map(e=>v`<wa-dropdown-item
            value=${e.id}
            @click=${e=>{t(e)?e.preventDefault():e.currentTarget instanceof HTMLElement&&(e.currentTarget.dataset.nativeNavigation=`true`)}}
            ><a
              class="sidebar-agent-roster__link"
              href=${`${g(`new-session`,this.host.basePath)}${i(e.id)}`}
              tabindex="-1"
              ><span class="sidebar-agent-roster__avatar" aria-hidden="true">
                ${D(e)} </span
              ><span>${e.name}</span></a
            >
          </wa-dropdown-item>`)}
      </wa-dropdown>`})}},T([x({attribute:!1})],Z.prototype,`host`,void 0),customElements.define(`zero-sidebar-new-session-menu`,Z)})))()}Q();export{Y as renderSidebarAgentRoster,q as renderSidebarNewSessionMenu,J as renderSidebarPinnedSession};
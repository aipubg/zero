import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{$n as t,Nu as n,Pu as r,Qn as i,Xn as a,Zn as o,er as s,ju as c,zu as l}from"./control-ui-core-DCNBgr3X.js";import{$r as u,Ca as d,Fi as f,ca as p,ci as m,ii as h,n as g,r as _,ra as ee,sa as v,ta as y,ui as b,xa as x}from"./control-ui-core-DwX5Mpz4.js";import{G as S,J as C,K as w,W as T,Z as E,at as D,n as O,t as k}from"./lit-runtime-B40xFCK_.js";import{Zr as A}from"./ui-AaV6iNVa.js";import{As as j,ks as te}from"./control-ui-boot-shared-CzJHozXQ.js";import{c as ne,s as re}from"./control-ui-boot-chat-B2JR-rGO.js";import{D as ie,O as ae,Qt as M,tn as N}from"./control-ui-boot-chat-DzIjAmFi.js";import{H as P,U as F}from"./control-ui-boot-chat-zkzP5WWm.js";import{a as I,i as L,o as R,r as z,t as B}from"./panel-tab-strip-jMGzTL7I.js";import{n as V,t as H}from"./panel-empty-state-anOYDn4d.js";function U(){return W+=1,`chat-files-content-${W}`}var W,G;function K(){return(K=e((()=>{T(),E(),k(),p(),_(),I(),P(),B(),r(),n(),te(),W=0,G=class extends c{constructor(...e){super(...e),this.contentId=U(),this.appUnmount=new g(this),this.hostedTabsChangeKey=``,this.previews=[],this.activeId=null,this.tabsInHeader=!0,this.browser=S,this.renderDetail=null,this.onSelect=()=>{},this.onClose=()=>{}}get hostedTabs(){let e=this.previews.map(({id:e,label:t,content:n})=>({id:e,label:t,title:n.kind===`file`?n.path:t,icon:n.kind===`mcp-app`?v.puzzle:j({filename:t,mode:`preview-with-favicon`}),className:n.kind===`loading`?`is-connecting`:void 0}));return this.activeId===null&&e.length?[{id:`browse`,label:l(`chat.sidePanel.files`),icon:v.folder},...e]:e}get activeHostedTabId(){return this.activeId??(this.previews.length?`browse`:null)}get hostedActions(){return C`<button
      class="rail-header__action"
      type="button"
      aria-label=${l(`chat.sidePanel.files`)}
      title=${l(`chat.sidePanel.files`)}
      @click=${()=>this.onSelect(null)}
    >
      ${v.folder}
    </button>`}selectHostedTab(e){this.onSelect(e===`browse`?null:e)}async closeHostedTab(e){e===`browse`?this.onSelect(this.previews.at(-1)?.id??null):this.onClose(e)}updated(){let e=JSON.stringify([this.activeHostedTabId,l(`chat.sidePanel.files`),this.hostedTabs.map(({id:e,label:t,title:n,className:r})=>[e,t,n,r])]);e!==this.hostedTabsChangeKey&&(this.hostedTabsChangeKey=e,this.dispatchEvent(new CustomEvent(L,{bubbles:!0})))}render(){let e=new Set(this.previews.filter(e=>e.content.kind===`mcp-app`).map(e=>e.id));return this.appUnmount.render(JSON.stringify([...e]),()=>C`
        ${this.tabsInHeader?S:C`<header class="rail-header side-panel__header">
                <div class="side-panel__header-tabs">
                  ${z({tabs:this.hostedTabs.map(e=>({...e,domId:`${this.contentId}-tab-${e.id}`,closeLabel:`${l(`browser.closeTab`)}: ${e.label}`})),activeId:this.activeHostedTabId,ariaControls:this.contentId,onSelect:e=>this.selectHostedTab(e),onClose:e=>this.closeHostedTab(e),onNew:()=>this.onSelect(null),newLabel:l(`chat.sidePanel.files`),newControl:this.hostedActions})}
                </div>
              </header>`}
        <div id=${this.contentId} class="chat-files-panel__content">
          <div class="chat-files-panel__page" ?hidden=${this.activeId!==null}>
            ${this.browser}
          </div>
          ${O(this.previews,e=>e.id,e=>C`
              <div
                class="chat-files-panel__page"
                data-app-tab-id=${e.content.kind===`mcp-app`?e.id:S}
                ?hidden=${this.activeId!==e.id}
              >
                ${e.content.kind===`loading`?F(`files`,l(`common.loading`)):e.content.kind===`unavailable`?C`<div class="callout danger" role="alert">
                          ${e.content.message}
                        </div>`:this.renderDetail?.(e.content)}
              </div>
            `)}
        </div>
      `,()=>[...this.querySelectorAll(`[data-app-tab-id]`)].filter(t=>!e.has(t.dataset.appTabId??``)))}},A([D({attribute:!1})],G.prototype,`previews`,void 0),A([D({attribute:!1})],G.prototype,`activeId`,void 0),A([D({type:Boolean})],G.prototype,`tabsInHeader`,void 0),A([D({attribute:!1})],G.prototype,`browser`,void 0),A([D({attribute:!1})],G.prototype,`renderDetail`,void 0),A([D({attribute:!1})],G.prototype,`onSelect`,void 0),A([D({attribute:!1})],G.prototype,`onClose`,void 0),customElements.get(`zero-chat-files-panel`)||customElements.define(`zero-chat-files-panel`,G)})))()}function q(e){return C`<resizable-divider
    class=${e.className??S}
    .splitRatio=${e.splitRatio}
    .minRatio=${e.minRatio??.4}
    .maxRatio=${e.maxRatio??.7}
    .measureRatio=${e.measureRatio}
    .measureSize=${e.measureSize}
    .label=${e.label}
    .orientation=${e.orientation}
    @dragover=${e.onDragover??(()=>{})}
    @drop=${e.onDrop??(()=>{})}
    @resize=${e.onResize}
  ></resizable-divider>`}function J(){return(J=e((()=>{T()})))()}function Y(e,t){let n=e.find(e=>e.slot===t);if(!n)throw Error(`Missing sidebar panel definition for ${t}`);return n}function X(e,t=!1){return C`
    <span slot=${t?`icon`:S} class="side-panel-type-option__icon" aria-hidden="true"
      >${e.icon}</span
    >
    <span class="side-panel-type-option__label">${e.label}</span>
    ${e.shortcut?ee(e.shortcut,{slot:t?`details`:void 0,className:`side-panel-type-option__shortcut`}):S}
  `}var Z,Q;function $(){return($=e((()=>{K(),T(),E(),k(),d(),p(),y(),H(),I(),B(),b(),f(),r(),n(),re(),ie(),N(),J(),Z=[[`browser`,u,{open:!0,newTab:!0}],[`link-reader`,h,{open:!0,newTab:!0}],[`terminal`,m,{open:!0,newSession:!0}]],Q=class extends c{constructor(...e){super(...e),this.panelIdPrefix=``,this.layout={columns:[]},this.panelDefinitions=ne(),this.callbacks=null,this.narrow=!1,this.sideFocusLocked=!1,this.availableWidth=0,this.previousGeometry=``,this.geometryFrame=null,this.contentMounted=!1,this.focusedSurface=null,this.focusBeforeSideLock=null,this.refreshHostedTabs=()=>this.requestUpdate(),this.trackFocus=e=>{let t=e.composedPath().find(e=>e instanceof Element&&e.matches(`[data-region], [data-region-header]`));this.focusedSurface=t&&t.closest(`.sidebar-region`)===this.parentElement?t:null},this.closeFocusedPanel=e=>{if(e.defaultPrevented||!this.layout.open||this.layout.expanded&&!this.layout.expandedSide||!this.callbacks)return;let t=e instanceof CustomEvent?e.detail?.browserScope:void 0,n=typeof t==`string`?[...this.parentElement?.querySelectorAll(`[data-native-browser-scope]`)??[]].find(e=>e.dataset.nativeBrowserScope===t):void 0,r=document.activeElement instanceof HTMLIFrameElement?document.activeElement.closest(`[data-region]`):null,i=typeof t==`string`?n?.closest(`[data-region]`):r??this.focusedSurface,a=o(this.layout);if(!a||!i?.isConnected||i.closest(`.sidebar-region`)!==this.parentElement||!i.matches(`[data-region="side"], [data-region-header="side"]`)||i.closest(`[hidden], [inert], [aria-hidden="true"]`)||document.zeroModalLayers?.size||document.querySelector(`dialog[open], [aria-modal='true']`))return;e.preventDefault();let s=this.parentElement?.querySelector(`[data-region-header="side"]`)??null;this.focusedSurface=s;let c=()=>{this.layout.open&&this.focusedSurface===s&&s?.isConnected&&s.querySelector(`wa-tab[active]`)?.focus()},l=this.hostedTabsElement(a),u=l?.activeHostedTabId;if(l&&u&&l.hostedTabs.some(e=>e.id===u)){l.closeHostedTab(u).then(()=>this.updateComplete).then(c);return}this.callbacks.closeSlot(a.slot),this.requestUpdate(),this.updateComplete.then(c)}}connectedCallback(){super.connectedCallback(),this.nativeCloseListeners=new AbortController;let e={capture:!0,signal:this.nativeCloseListeners.signal};this.parentElement?.addEventListener(L,this.refreshHostedTabs,{signal:this.nativeCloseListeners.signal}),document.addEventListener(`pointerdown`,this.trackFocus,e),document.addEventListener(`focusin`,this.trackFocus,e),window.addEventListener(`zero:native-close-focused-panel`,this.closeFocusedPanel,e),this.requestUpdate()}disconnectedCallback(){this.nativeCloseListeners?.abort(),this.nativeCloseListeners=void 0,this.focusedSurface=null,this.geometryFrame!==null&&(cancelAnimationFrame(this.geometryFrame),this.geometryFrame=null),super.disconnectedCallback()}hostedTabsElement(e){return R(this.parentElement?.querySelector(`[data-panel-slot="${e.slot}"]`)?.firstElementChild)}deliverPanelEvent(e,t){let n=this.parentElement?.querySelector(`[data-panel-slot="${e}"]`)?.firstElementChild;return!(n instanceof HTMLElement)||typeof n.handleToggleRequest!=`function`?!1:(n.handleToggleRequest(t),!0)}panelTypes(){return this.panelDefinitions.filter(e=>e.available)}renderTypeMenu(){let e=new Set((this.layout.columns[0]?.panels??[]).map(e=>e.slot));return C`
      <wa-dropdown
        class="side-panel-type-menu"
        placement="bottom-start"
        @wa-select=${t=>{let n=t.detail.item.value;if(n){this.callbacks?.openSlot(n);let t=Z.find(([e])=>e===n);t&&e.has(n)&&this.deliverPanelEvent(n,new CustomEvent(t[1],{detail:{...t[2]}}))}}}
      >
        <button
          slot="trigger"
          class="rail-header__action side-panel-type-menu__trigger"
          type="button"
          aria-label=${l(`chat.sidePanel.addTab`)}
          title=${l(`chat.sidePanel.addTab`)}
        >
          ${v.plus}
        </button>
        ${this.panelTypes().filter(t=>Z.some(([e])=>e===t.slot)||!e.has(t.slot)).map(e=>C`
              <wa-dropdown-item
                class="side-panel-type-menu__item session-menu__item"
                .value=${e.slot}
              >
                ${X(e,!0)}
              </wa-dropdown-item>
            `)}
      </wa-dropdown>
    `}renderHostedTabIcon(e){if(e.favicon)return C`<img class="tabstrip-tab__favicon" src=${e.favicon} alt="" />`;let t=e.url?URL.parse(e.url)?.hostname:``,n=t&&this.fetchFavicon?ae(t,this.fetchFavicon,this.refreshHostedTabs):null;return n?C`<img class="tabstrip-tab__favicon" src=${n} alt="" />`:e.icon}renderHeader(e){let t=s(this.layout),n=t.flatMap(e=>{let t=this.hostedTabsElement(e);return t?[{panel:e,element:t,tabs:t.hostedTabs}]:[]}),r=e=>{for(let t of n){let n=`hosted:${t.panel.id}:`;if(e.startsWith(n)){let r=e.slice(n.length);if(t.tabs.some(e=>e.id===r))return{...t,tabId:r}}}return null},i=t.flatMap(t=>{let r=`${this.panelIdPrefix}-${encodeURIComponent(t.slot)}`,i=n.find(e=>e.panel.id===t.id);if(i?.tabs.length)return i.tabs.map(e=>({id:`hosted:${t.id}:${e.id}`,domId:`${this.panelIdPrefix}-tab-${encodeURIComponent(JSON.stringify([t.id,e.id]))}`,contentId:r,label:e.label,labelTooltip:e.label,title:e.title,icon:this.renderHostedTabIcon(e),statusLabel:e.statusLabel,badge:e.badge,className:e.className,closeLabel:`${l(`browser.closeTab`)}: ${e.label}`,group:t.id,draggable:!1,reorderId:t.id}));let a=Y(this.panelDefinitions,t.slot),o=t.slot===`conversation`&&this.conversationTab?.label?this.conversationTab:a;return[{id:t.id,domId:`${this.panelIdPrefix}-tab-${encodeURIComponent(t.id)}`,contentId:r,label:o.label,labelTooltip:t.slot===`dashboard`?l(this.layout.expanded&&this.layout.expandedSide&&e.activePanelId===t.id?`chat.sidePanel.restore`:`chat.sidePanel.expandPanel`,{panel:a.label}):o.label,onActivate:t.slot===`dashboard`?()=>this.callbacks?.togglePanelExpanded(t.id):void 0,icon:o.icon,closeLabel:l(`chat.sidebarColumns.close`,{panel:a.label})}]}),a=o(this.layout),c=n.find(e=>e.panel.id===a?.id),u=c?.tabs.some(e=>e.id===c.element.activeHostedTabId)?`hosted:${c.panel.id}:${c.element.activeHostedTabId}`:a?.id??null,d=e.panels.find(e=>e.id===a?.id),f=(d?Y(this.panelDefinitions,d.slot).headerAction:null)??null;return C`
      <header
        class="rail-header side-panel__header"
        data-region-header="side"
        @mousedown=${x}
      >
        <div class="side-panel__header-tabs">
          ${z({tabs:i,activeId:u,ariaControls:e=>e.contentId,onSelect:t=>{let n=r(t);n?(e.activePanelId!==n.panel.id&&this.callbacks?.activatePanel(n.panel.id),n.element.selectHostedTab(n.tabId)):this.callbacks?.activatePanel(t)},onClose:async t=>{let n=r(t);if(n){await n.element.closeHostedTab(n.tabId);return}let i=e.panels.find(e=>e.id===t);i&&this.callbacks?.closeSlot(i.slot)},onNew:()=>void 0,newLabel:l(`chat.sidePanel.addTab`),newControl:S,separateTabs:!0,onReorder:(e,t,n)=>this.callbacks?.reorderPanel(e,t,n)})}
          ${this.renderTypeMenu()}
        </div>
        ${this.renderHeaderActions(f,c?.element.hostedActions??S)}
      </header>
    `}renderHeaderActions(e,t){let n=o(this.layout),r=this.layout.expanded===!0&&this.layout.expandedSide===!0,i=r?l(`chat.sidePanel.restore`):l(`chat.sidePanel.expandPanel`,{panel:n?Y(this.panelDefinitions,n.slot).label:``});return C`<div class="rail-header__actions side-panel__actions">
      ${e||t!==S?C`<span class="side-panel__action-group side-panel__action-group--content">
              ${t} ${e}
            </span>`:S}
      <span class="side-panel__action-group side-panel__action-group--close">
        ${n&&!this.sideFocusLocked?C`<zero-tooltip .content=${i}>
                <button
                  class="rail-header__action side-panel__expand"
                  type="button"
                  aria-label=${i}
                  aria-pressed=${String(r)}
                  @click=${()=>this.callbacks?.togglePanelExpanded(n.id)}
                >
                  ${r?v.minimize:v.maximize}
                </button>
              </zero-tooltip>`:S}
        <zero-tooltip .content=${l(`common.close`)}>
          <button
            class="rail-header__action side-panel__minimize"
            type="button"
            aria-label=${l(`common.close`)}
            @click=${()=>this.callbacks?.setOpen(!1)}
          >
            ${v.x}
          </button>
        </zero-tooltip>
      </span>
    </div>`}renderEmpty(e){if(e){let t=Y(this.panelDefinitions,e.slot);return C`<div class="side-panel-empty side-panel-empty--type">
        ${V({icon:t.icon,heading:t.label,description:t.empty.description,action:t.empty.action})}
      </div>`}return C`<div class="side-panel-empty side-panel-empty--selector">
      <div class="side-panel-empty__types">
        ${this.panelTypes().map(e=>C`<button
            class="side-panel-empty__type"
            type="button"
            @click=${()=>this.callbacks?.openSlot(e.slot)}
          >
            ${X(e)}
          </button>`)}
      </div>
    </div>`}renderBody(e){return C`<div class="side-panel__body">
      ${O(this.panelDefinitions.flatMap(t=>(e?.panels??[]).filter(e=>e.slot===t.slot&&e.slot!==`conversation`)),e=>e.id,e=>C`<div
          id=${`${this.panelIdPrefix}-${encodeURIComponent(e.slot)}`}
          class="side-panel__panel"
          role="region"
          aria-label=${Y(this.panelDefinitions,e.slot).label}
          data-panel-slot=${e.slot}
          data-region=${e.id===this.layout.mainPanelId?`main`:`side`}
          ?hidden=${!a(this.layout,e.slot)}
        >
          ${Y(this.panelDefinitions,e.slot).content??this.renderEmpty(e)}
        </div>`)}
      ${s(this.layout).length===0?C`<div class="side-panel__empty-body" data-region="side">${this.renderEmpty()}</div>`:S}
    </div>`}renderDivider(e){let t=i(this.layout),n=t===`bottom`?`height`:`width`,r=()=>{let r=this.parentElement,i=r?.querySelector(`[data-region="main"]`),a=r?.querySelector(`[data-region="side"]:not([hidden])`),o=i?.getBoundingClientRect()[n]??0,s=a?.getBoundingClientRect()[n]??e[n];return{primarySize:o,panelSize:s,panelBeforeMain:t!==`bottom`&&t===`left`!=(getComputedStyle(r??this).direction===`rtl`),total:o+s}};return q({className:`sidebar-column__divider`,label:l(`chat.sidePanel.resize`),orientation:t===`bottom`?`horizontal`:`vertical`,splitRatio:.5,minRatio:.05,maxRatio:.95,measureRatio:()=>{let{primarySize:e,panelSize:t,panelBeforeMain:n,total:i}=r();return i>0?(n?t:e)/i:.5},measureSize:()=>r().total,onResize:i=>{let a=this.parentElement?.getBoundingClientRect(),o=n===`width`&&this.availableWidth>0?this.availableWidth:a?.[n]??0,s=r(),c=(s.total||o)*(s.panelBeforeMain?i.detail.splitRatio:1-i.detail.splitRatio),l=t===`bottom`?220:260,u=Math.max(l,o*.6);this.callbacks?.resizePanel(e.id,Math.max(l,Math.min(c,u)))}})}renderPanel(){let e=this.layout.columns[0];return e?(this.contentMounted||=this.layout.open===!0&&(!this.layout.expanded||this.layout.expandedSide===!0)||(t(this.layout)?.slot??`conversation`)!==`conversation`,C`${!this.narrow&&this.layout.open&&!this.layout.expanded?this.renderDivider(e):S}
      <div class="side-panel">
        ${s(this.layout).length>0?this.renderHeader(e):S}
        ${this.contentMounted?this.renderBody(e):S}
      </div>`):(this.contentMounted=!1,S)}updated(e){let t=this.parentElement?.querySelector(`.sidebar-region__right-runtime`);t&&(w(this.renderPanel(),t),this.scheduleGeometryCommit()),e.has(`sideFocusLocked`)&&this.moveFocusWithSideLock(t)}moveFocusWithSideLock(e){let t=this.parentElement,n=document.activeElement instanceof HTMLElement?document.activeElement:null,r=!!(n&&e?.contains(n));if(this.sideFocusLocked){let i=this.sideFocusOrigin?.()??null,a=n&&t?.contains(n)&&!r?n:i;a&&(this.focusBeforeSideLock=a,requestAnimationFrame(()=>{let t=document.activeElement,n=t instanceof HTMLElement&&t!==document.body&&t!==a;this.sideFocusLocked&&!n&&e?.querySelector(`[data-region-header="side"] wa-tab[active]`)?.focus()}));return}let i=this.focusBeforeSideLock;this.focusBeforeSideLock=null;let a=!n||n===document.body;i&&(a||r&&this.layout.open!==!0)&&(i.focus({preventScroll:!0}),document.activeElement!==i&&t?.querySelector(`:scope > .sidebar-region__header button:not([disabled])`)?.focus({preventScroll:!0}))}scheduleGeometryCommit(){this.geometryFrame===null&&(this.geometryFrame=requestAnimationFrame(()=>{this.geometryFrame=null;let e=this.parentElement;if(!this.isConnected||!e)return;let t=e.querySelector(`.sidebar-region__right-runtime > .side-panel`),n=Array.from(e.querySelectorAll(`.sidebar-region__primary, .side-panel__panel`),e=>`${e.dataset.panelSlot??`conversation`}:${e.getBoundingClientRect().width}`).join(`:`);t?.dispatchEvent(new CustomEvent(M,{bubbles:!0,detail:{widthChanged:n!==this.previousGeometry}})),this.previousGeometry=n}))}render(){return S}},A([D({attribute:!1})],Q.prototype,`panelIdPrefix`,void 0),A([D({attribute:!1})],Q.prototype,`conversationTab`,void 0),A([D({attribute:!1})],Q.prototype,`layout`,void 0),A([D({attribute:!1})],Q.prototype,`panelDefinitions`,void 0),A([D({attribute:!1})],Q.prototype,`fetchFavicon`,void 0),A([D({attribute:!1})],Q.prototype,`callbacks`,void 0),A([D({type:Boolean})],Q.prototype,`narrow`,void 0),A([D({type:Boolean})],Q.prototype,`sideFocusLocked`,void 0),A([D({attribute:!1})],Q.prototype,`sideFocusOrigin`,void 0),A([D({type:Number})],Q.prototype,`availableWidth`,void 0),customElements.get(`zero-chat-sidebar-region`)||customElements.define(`zero-chat-sidebar-region`,Q)})))()}$();
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Au as t,Eu as n,Nu as r,Ou as i,Pu as a,Tu as o,zu as s}from"./control-ui-core-DCNBgr3X.js";import{Ca as c,Fi as l,aa as u,ca as d,ia as f,na as p,sa as m,ta as h,xa as g}from"./control-ui-core-DwX5Mpz4.js";import{G as _,J as v,W as y,Z as b,at as x}from"./lit-runtime-B40xFCK_.js";import{Zr as S}from"./ui-AaV6iNVa.js";var C;function w(){return(w=e((()=>{y(),b(),c(),a(),i(),r(),d(),h(),l(),C=class extends t{constructor(...e){super(...e),this.navCollapsed=!1,this.historyOnly=!1,this.canGoBack=!1,this.canGoForward=!1}render(){let e=this.navCollapsed?s(`nav.expand`):s(`nav.collapse`);return v`
      <nav class="macos-titlebar-controls" @mousedown=${g}>
        ${this.historyOnly?_:this.renderButton({label:e,icon:this.navCollapsed?m.panelLeftOpen:m.panelLeftClose,ariaExpanded:!this.navCollapsed,onClick:this.onToggleSidebar,className:`macos-titlebar-controls__sidebar-toggle`})}
        ${this.renderButton({label:s(`nav.back`),icon:m.chevronLeft,disabled:!this.canGoBack,onClick:()=>globalThis.history.back(),className:`macos-titlebar-controls__back`})}
        ${this.renderButton({label:s(`nav.forward`),icon:m.chevronRight,disabled:!this.canGoForward,onClick:()=>globalThis.history.forward(),className:`macos-titlebar-controls__forward`})}
        ${this.historyOnly?_:v`
                ${this.renderButton({label:s(`chat.openCommandPalette`),tooltip:s(`chat.commandPaletteTitle`),tooltipTemplate:u(s(`chat.commandPaletteTitle`).replace(`⌘K`,`{shortcut}`),p([`⌘`,`K`],{inline:!0})),icon:m.search,onClick:this.onOpenPalette,className:`macos-titlebar-controls__search`})}
                ${this.navCollapsed?this.renderButton({label:s(`chat.runControls.newSession`),tooltip:this.newSessionDisabledReason??`${s(`chat.runControls.newSession`)} (${n(o.newSession)})`,tooltipTemplate:this.newSessionDisabledReason==null?f(s(`chat.runControls.newSession`),o.newSession):void 0,icon:m.plus,disabled:!!this.newSessionDisabledReason,onClick:this.onOpenNewSession,className:`macos-titlebar-controls__new-session`}):_}
              `}
      </nav>
    `}renderButton(e){return v`
      <zero-tooltip
        .content=${e.tooltip??e.label}
        .contentTemplate=${e.tooltipTemplate}
      >
        <button
          type="button"
          class="topbar-icon-btn macos-titlebar-controls__button ${e.className}"
          aria-label=${e.label}
          aria-expanded=${e.ariaExpanded===void 0?_:String(e.ariaExpanded)}
          ?disabled=${e.disabled||!e.onClick}
          @click=${e.onClick}
        >
          ${e.icon}
        </button>
      </zero-tooltip>
    `}},S([x({attribute:!1})],C.prototype,`navCollapsed`,void 0),S([x({attribute:!1})],C.prototype,`historyOnly`,void 0),S([x({attribute:!1})],C.prototype,`canGoBack`,void 0),S([x({attribute:!1})],C.prototype,`canGoForward`,void 0),S([x({attribute:!1})],C.prototype,`newSessionDisabledReason`,void 0),S([x({attribute:!1})],C.prototype,`onToggleSidebar`,void 0),S([x({attribute:!1})],C.prototype,`onOpenPalette`,void 0),S([x({attribute:!1})],C.prototype,`onOpenNewSession`,void 0),customElements.get(`zero-macos-titlebar-controls`)||customElements.define(`zero-macos-titlebar-controls`,C)})))()}w();
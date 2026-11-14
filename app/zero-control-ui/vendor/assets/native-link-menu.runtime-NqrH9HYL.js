import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Jr as t,Nu as n,Pu as r,Yr as i,ju as a,zu as o}from"./control-ui-core-DCNBgr3X.js";import{ca as s,sa as c}from"./control-ui-core-DwX5Mpz4.js";import{G as l,J as u,W as d,Z as f,at as p}from"./lit-runtime-B40xFCK_.js";import{Zr as m}from"./ui-AaV6iNVa.js";import{Mi as h,ci as g,ei as _,ii as v,li as y,ni as b,ri as x,ti as S}from"./control-ui-boot-shared-ZuP0LiFD.js";function C(e){let t=e.find(e=>e instanceof HTMLElement&&e.localName===`zero-modal-dialog`);if(t instanceof HTMLElement)return t;for(let t of e)if(t instanceof HTMLDialogElement&&t.open&&t.getRootNode()===document)return t;return document.body}function w(e){let n=C(e.path);if(!n.isConnected)return null;let r=document.createElement(`zero-native-link-menu`);return r.x=e.x,r.y=e.y,r.trigger=e.anchor,r.onClose=()=>e.close(r),r.onAction=n=>{n===`copy`?t(e.url.href):n===`inline`?e.openInline():e.openExternal()},n.append(r),S(r),r}var T;function E(){return(E=e((()=>{d(),f(),r(),i(),n(),y(),s(),x(),_(),h(),T=class extends a{constructor(...e){super(...e),this.x=0,this.y=0,this.trigger=null,this.onAction=()=>{},this.onClose=()=>{},this.menuLifecycle=new g(this,{getTrigger:()=>this.trigger,onClose:()=>this.onClose(),onKeydown:e=>b(this,e)})}runAction(e){this.onClose(),this.onAction(e)}render(){let e=Math.max(8,Math.min(this.x,window.innerWidth-264-8)),t=Math.max(8,Math.min(this.y,window.innerHeight-136-8));return u`
      <wa-dropdown
        class="session-menu native-link-menu"
        .open=${!0}
        placement="bottom-start"
        .distance=${0}
        aria-label=${o(`nativeLinkMenu.label`)}
        @wa-select=${e=>{e.preventDefault();let t=e.detail.item.value;t&&(this.trigger?.focus(),this.runAction(t))}}
        @wa-after-hide=${()=>{this.onClose()}}
      >
        <button
          slot="trigger"
          type="button"
          tabindex="-1"
          aria-hidden="true"
          aria-label=${o(`nativeLinkMenu.label`)}
          style="position: fixed; left: ${e}px; top: ${t}px; width: 1px; height: 1px; opacity: 0; pointer-events: none;"
        ></button>
        ${[[`inline`,`s`,`openInline`,c.panelRightOpen],[`external`,`b`,`openExternal`,c.externalLink],[`copy`,`c`,`copy`,c.copy]].map(([e,t,n,r])=>u`
            ${e===`copy`?u`<div class="session-menu__separator" role="separator"></div>`:l}
            <wa-dropdown-item
              class="session-menu__item"
              value=${e}
              ?data-new-tab-action=${e===`external`}
              data-shortcut=${t}
              aria-keyshortcuts=${t.toUpperCase()}
            >
              <span slot="icon" class="session-menu__icon" aria-hidden="true">${r}</span>
              <span class="session-menu__text">${o(`nativeLinkMenu.${n}`)}</span>
              ${v(t)}
            </wa-dropdown-item>
          `)}
      </wa-dropdown>
    `}},m([p({attribute:!1})],T.prototype,`x`,void 0),m([p({attribute:!1})],T.prototype,`y`,void 0),m([p({attribute:!1})],T.prototype,`trigger`,void 0),m([p({attribute:!1})],T.prototype,`onAction`,void 0),m([p({attribute:!1})],T.prototype,`onClose`,void 0),customElements.get(`zero-native-link-menu`)||customElements.define(`zero-native-link-menu`,T)})))()}E();export{w as mountNativeLinkMenu};
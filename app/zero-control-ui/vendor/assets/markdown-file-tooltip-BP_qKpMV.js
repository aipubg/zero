import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Pu as t,_u as n,vu as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{ca as a,sa as o}from"./control-ui-core-DwX5Mpz4.js";import{J as s,K as c,W as l}from"./lit-runtime-B40xFCK_.js";import{nn as u,rn as d}from"./control-ui-boot-shared-ZuP0LiFD.js";function f(e,t){e.replaceChildren();let n=i(`chat.workspaceFiles.copyPath`),a=e.closest(`zero-tooltip`);if(!a)throw Error(`File path content requires a tooltip owner`);let l=0,d=!1,f=p=>{p===!1&&!e.closest(`zero-tooltip[open]`)&&r({message:i(`common.copyFailed`)}),c(s`
        <span class="markdown-file-tooltip__path">${t}</span>
        <button
          type="button"
          aria-label=${n}
          @click=${n=>{let r=n.currentTarget;if(r instanceof HTMLButtonElement){let n=l,i=!1;u(r,t,()=>e.isConnected&&n===l&&a.anchor?.getAttribute(`data-file-path`)===t,e=>{d=!1;let t=a.anchor;e!==void 0&&i&&t instanceof HTMLElement&&a.ownerDocument.activeElement===a.ownerDocument.body&&a.focusTriggerWithoutOpening(t),(e===void 0||i||a.hasAttribute(`open`))&&f(e)},()=>(i=a.hasAttribute(`open`),d=i,i))}}}
        >
          ${p?o.check:o.copy}
        </button>
        <span class=${p===!1?``:`sr-only`} role="status">
          ${p===void 0?``:i(p?`common.copied`:`common.copyFailed`)}
        </span>
      `,e)};f();let p=new MutationObserver(e=>{e.some((t,n)=>{let r=e[n+1],i=r?r.oldValue:a.getAttribute(`open`);return t.oldValue!==null&&i===null})&&!d&&(l++,f())});return p.observe(a,{attributes:!0,attributeFilter:[`open`],attributeOldValue:!0}),()=>p.disconnect()}function p(){return(p=e((()=>{l(),t(),n(),a(),d()})))()}p();export{f as renderMarkdownFileTooltip};
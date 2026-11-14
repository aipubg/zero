import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Fi as t}from"./control-ui-core-DwX5Mpz4.js";import{G as n,J as r,W as i}from"./lit-runtime-B40xFCK_.js";function a(e){let t=e.destinations.filter(t=>t.dock!==e.current);return t.length===0?n:r`<span class=${e.groupClass} role="group" aria-label=${e.groupLabel}>
    ${t.map(t=>r`<zero-tooltip .content=${t.label}>
        <button
          class=${`rail-header__action ${t.className??``}`}
          type="button"
          aria-label=${t.label}
          ?disabled=${e.disabled}
          @click=${()=>e.onSelect(t.dock)}
        >
          ${t.icon}
        </button>
      </zero-tooltip>`)}
  </span>`}function o(){return(o=e((()=>{i(),t()})))()}export{a as n,o as t};
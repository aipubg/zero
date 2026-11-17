import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{J as t,W as n,i as r,o as i}from"./lit-runtime-B40xFCK_.js";import{I as a,q as o}from"./control-ui-boot-shared-ZuP0LiFD.js";function s(e){return o({title:e.title,description:e.description,control:t`
      <select
        class="settings-select"
        ?data-settings-send-shortcut=${e.setting===`send-shortcut`}
        ?data-settings-catalog-open-target=${e.setting===`catalog-open-target`}
        aria-label=${e.title}
        ?disabled=${e.disabled??!1}
        .value=${e.value}
        @change=${t=>e.onChange(t.currentTarget.value)}
      >
        ${e.options.map(n=>t`
            <option value=${n.value} .selected=${i(e.value===n.value)}>
              ${n.label}
            </option>
          `)}
      </select>
    `})}function c(){return(c=e((()=>{n(),r(),a()})))()}export{s as n,c as t};
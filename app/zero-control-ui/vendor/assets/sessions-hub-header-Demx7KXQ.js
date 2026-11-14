import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Pu as t,zu as n}from"./control-ui-core-DCNBgr3X.js";import{or as r,sr as i}from"./control-ui-core-DwX5Mpz4.js";import{G as a,J as o,W as s}from"./lit-runtime-B40xFCK_.js";import{m as c,p as l}from"./control-ui-boot-shared-ZuP0LiFD.js";function u(e){return o`
    <section
      class="content-header content-header--settings content-header--page hub-page-header sessions-hub-header"
      ${i({toolbarHeader:!0})}
    >
      <div class="hub-page-header__title">
        <div class="page-title">${e.title}</div>
        ${e.subtitle?o`<div class="page-subtitle">${e.subtitle}</div>`:a}
      </div>
      <div class="hub-page-header__tabs">
        ${c({id:`sessions`,active:e.active,tabs:[{value:`sessions`,label:n(`tabs.sessions`)},{value:`worktrees`,label:n(`tabs.worktrees`)}],ariaLabel:n(`sessionsPage.hubTablistLabel`),panelId:`sessions-hub-panel`,onSelect:e.onSelect})}
      </div>
      <div class="hub-page-header__actions">${e.actions??a}</div>
    </section>
  `}function d(){return(d=e((()=>{s(),r(),t(),l()})))()}export{u as n,d as t};
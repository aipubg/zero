import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Pu as t,lc as n,xu as r,yu as i,zu as a}from"./control-ui-core-DCNBgr3X.js";import{an as o,ca as s,on as c,sa as l}from"./control-ui-core-DwX5Mpz4.js";import{E as u,G as d,J as f,W as p,k as m}from"./lit-runtime-B40xFCK_.js";import{ga as h,ha as g}from"./control-ui-boot-shared-BX8huZUb.js";import{It as _,zt as v}from"./ui-AaV6iNVa.js";import{Mi as y,Ni as b,ct as x,ut as S}from"./control-ui-boot-shared-ZuP0LiFD.js";import{$ as C,et as w,nt as T,ot as E,rt as D,tt as O}from"./control-ui-boot-new-5_2Ky4dv.js";import"./control-ui-boot-new-styles-cChqenO3.js";function k(e){return A?Promise.resolve():(A=!0,c(void 0,({host:t,render:r,finish:o})=>{let s=e.defaults.cwd,c=!1,u=`checking`,p=0,h=!1,g=null,_=!1,y=new O(e.listDirectory,I),x=()=>{y.reset(),p+=1,o(),A=!1},C=async t=>{if(t.preventDefault(),!(h||u!==`git`&&u!==`not_git`)){h=!0,g=null,I();try{g=await e.submit({cwd:s.trim(),worktree:u===`git`&&c})}catch(e){g=i(e)}if(!g){x();return}h=!1,I()}},T=()=>{let e=t.querySelector(`wa-popover.session-group-defaults__folder-popover`);e&&(e.open=!1)},D=()=>{y.reset(),_=!1,I()},k=e=>{s=e.trim(),D(),T(),j(!1)},j=async t=>{let n=++p;u=`checking`,c=!1,g=null,I();try{let r=await e.inspectRepository(s.trim()||void 0);if(n!==p)return;u=r,c=r===`git`&&t&&e.defaults.worktree}catch(e){if(n!==p)return;c=!1,u=v(e)?`restricted`:`unavailable`}I()},M=e=>{c=e,g=null,I()},N=e=>{let t=e.detail.item.getAttribute(`value`);(t===`local`||t===`worktree`)&&M(t===`worktree`)},P=e=>{if(!(e.currentTarget instanceof HTMLElement))return;let t=e.currentTarget;e.key===`Escape`&&t.open&&(e.preventDefault(),e.stopPropagation(),t.open=!1,t.querySelector(`#session-group-defaults-mode-trigger`)?.focus({preventScroll:!0}))},F=()=>{_=!0,y.navigate(s||void 0,`initial`)};function I(){let t=s.trim(),i=t?n(t):a(`sessionsView.groupDefaultsCwdPlaceholder`),o=u===`checking`?`checking`:u===`git`?`git`:u===`restricted`?`restricted`:`local`,p=[{value:`local`,label:a(`sessionsView.groupDefaultsLocal`),description:a(`newSession.checkoutCurrentNote`),icon:l.monitor},{value:`worktree`,label:a(`sessionsView.groupDefaultsWorktree`),description:a(`sessionsView.groupDefaultsWorktreeHint`),icon:l.gitBranch}],v=p[+!!c];r(()=>f`
          <zero-modal-dialog
            label=${a(`sessionsView.groupDefaultsTitle`,{group:e.group})}
            @modal-cancel=${e=>{if(h){e.preventDefault();return}x()}}
          >
            <form class="exec-approval-card session-group-defaults" @submit=${C}>
              <div class="exec-approval-header">
                <div>
                  <div class="exec-approval-title">
                    ${a(`sessionsView.groupDefaultsTitle`,{group:e.group})}
                  </div>
                  <div class="exec-approval-sub">${a(`sessionsView.groupDefaultsDescription`)}</div>
                </div>
              </div>
              <div class="session-group-defaults__fields">
                <div class="field">
                  <span>${a(`sessionsView.groupDefaultsCwd`)}</span>
                  <button
                    id="session-group-defaults-folder-trigger"
                    type="button"
                    class="new-session-page__trigger session-group-defaults__folder"
                    aria-label="${a(`sessionsView.groupDefaultsCwd`)}: ${i}"
                    aria-haspopup="dialog"
                    ?disabled=${h}
                  >
                    <span class="new-session-page__target-icon" aria-hidden="true"
                      >${l.folder}</span
                    >
                    <span class="session-group-defaults__folder-copy">
                      <strong>${i}</strong>
                      <small title=${t||d}
                        >${t||a(`sessionsView.groupDefaultsCwdHint`)}</small
                      >
                    </span>
                    <span class="new-session-page__trigger-chevron" aria-hidden="true"
                      >${l.chevronDown}</span
                    >
                  </button>
                  <wa-popover
                    ${m(S)}
                    class="new-session-page__select new-session-page__project-popover new-session-page__picker-popover session-group-defaults__folder-popover"
                    for="session-group-defaults-folder-trigger"
                    placement="bottom-start"
                    without-arrow
                    @wa-hide=${D}
                  >
                    ${_?w({browser:y,id:`session-group-defaults-browser`,label:a(`newSession.gateway`),registerProjectPath:null,registeringProject:!1,onBack:D,onRegisterProject:()=>void 0,onClose:D,onApplyFolder:k}):f`
                            <div class="new-session-page__picker-root">
                              ${E({value:`agent-workspace`,label:a(`sessionsView.groupDefaultsCwdPlaceholder`),icon:l.folder,checked:!t,onSelect:()=>k(``)},h)}
                              <button
                                type="button"
                                class="session-menu__item"
                                data-value="browse"
                                aria-pressed="false"
                                ?disabled=${h}
                                @click=${F}
                              >
                                <span class="session-menu__check" aria-hidden="true"></span>
                                <span class="session-menu__text">${a(`newSession.browse`)}</span>
                                <span class="new-session-page__menu-chevron" aria-hidden="true"
                                  >${l.chevronRight}</span
                                >
                              </button>
                            </div>
                          `}
                  </wa-popover>
                </div>
                <div class="field">
                  <span>${a(`sessionsView.groupDefaultsMode`)}</span>
                  <div
                    class="session-group-defaults__environment"
                    data-session-group-environment=${o}
                    aria-live="polite"
                  >
                    ${u===`git`?f`
                            <wa-dropdown
                              class="session-group-defaults__mode-dropdown"
                              placement="bottom-start"
                              aria-label=${a(`sessionsView.groupDefaultsMode`)}
                              @wa-select=${N}
                              @keydown=${P}
                            >
                              <button
                                id="session-group-defaults-mode-trigger"
                                slot="trigger"
                                type="button"
                                class="session-group-defaults__resolved-mode session-group-defaults__mode-trigger"
                                data-value=${v.value}
                                aria-label=${`${a(`sessionsView.groupDefaultsMode`)}: ${v.label}`}
                                ?disabled=${h}
                              >
                                <span class="new-session-page__target-icon" aria-hidden="true"
                                  >${v.icon}</span
                                >
                                <span class="session-group-defaults__resolved-copy">
                                  <strong>${v.label}</strong>
                                  <small>${v.description}</small>
                                </span>
                                <span class="new-session-page__trigger-chevron" aria-hidden="true"
                                  >${l.chevronDown}</span
                                >
                              </button>
                              ${p.map(e=>{let t=e===v;return f`
                                  <wa-dropdown-item
                                    class="session-group-defaults__mode-option"
                                    data-environment-mode=${e.value}
                                    ?data-selected=${t}
                                    aria-label=${`${e.label}, ${e.description}`}
                                    value=${e.value}
                                    type="checkbox"
                                    .checked=${t}
                                    ?disabled=${h}
                                    ?autofocus=${t&&!h}
                                    ${m(e=>b(e,t))}
                                  >
                                    <span
                                      slot="icon"
                                      class="new-session-page__target-icon session-group-defaults__mode-option-icon"
                                      aria-hidden="true"
                                      >${e.icon}</span
                                    >
                                    <span class="session-group-defaults__resolved-copy">
                                      <strong>${e.label}</strong>
                                      <small>${e.description}</small>
                                    </span>
                                  </wa-dropdown-item>
                                `})}
                            </wa-dropdown>
                          `:f`
                            <div
                              class="session-group-defaults__resolved-mode"
                              role=${u===`checking`?`status`:d}
                            >
                              <span class="new-session-page__target-icon" aria-hidden="true"
                                >${u===`checking`?l.gitBranch:l.monitor}</span
                              >
                              <span class="session-group-defaults__resolved-copy">
                                <strong
                                  >${a(u===`checking`?`newSession.checkingGit`:`sessionsView.groupDefaultsLocal`)}</strong
                                >
                                ${u===`checking`?d:f`<small
                                        >${a(u===`restricted`?`sessionsView.groupDefaultsRequiresAdmin`:u===`unavailable`?`newSession.gitCheckUnavailable`:`newSession.checkoutCurrentNote`)}</small
                                      >`}
                              </span>
                            </div>
                          `}
                  </div>
                </div>
              </div>
              ${g?f`<div class="exec-approval-error" role="alert">${g}</div>`:d}
              <div class="exec-approval-actions">
                <button
                  type="submit"
                  class="btn primary"
                  ?disabled=${h||u===`checking`||u===`unavailable`||u===`restricted`}
                >
                  ${a(`common.save`)}
                </button>
                ${u===`unavailable`||u===`restricted`?f`
                        <button
                          type="button"
                          class="btn"
                          ?disabled=${h}
                          @click=${()=>void j(s.trim()===e.defaults.cwd.trim())}
                        >
                          ${a(`common.retry`)}
                        </button>
                      `:d}
                <button type="button" class="btn" ?disabled=${h} @click=${x}>
                  ${a(`common.cancel`)}
                </button>
              </div>
            </form>
          </zero-modal-dialog>
        `)}j(!0)}))}var A;function j(){return(j=e((()=>{_(),p(),u(),t(),g(),r(),D(),T(),C(),s(),o(),x(),y(),h(),A=!1})))()}j();export{k as showSessionGroupDefaultsDialog};
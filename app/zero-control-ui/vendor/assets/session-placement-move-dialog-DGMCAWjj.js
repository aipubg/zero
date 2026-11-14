import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Pu as t,xu as n,yu as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{an as a,ca as o,on as s,sa as c}from"./control-ui-core-DwX5Mpz4.js";import{G as l,J as u,W as d}from"./lit-runtime-B40xFCK_.js";import{ga as f,ha as p}from"./control-ui-boot-shared-BX8huZUb.js";import{Si as m,yi as h}from"./control-ui-boot-shared-ZuP0LiFD.js";import{J as g,at as _,it as v,ot as y,q as b,rt as x}from"./control-ui-boot-new-5_2Ky4dv.js";import"./control-ui-boot-new-styles-cChqenO3.js";function S(e){if(!e)return``;switch(e.kind){case`gateway`:return`gateway`;case`profile`:return`profile:${e.profileId}`;default:return`device:${e.deviceId}`}}function C(e){return w?Promise.resolve(null):(w=!0,s(void 0,({render:t,finish:n})=>{let a=!0,o=null,s={profiles:[],devices:[]},d=e.mode===`move`?{kind:`gateway`}:null,f=new b,p=e=>{n(e),w=!1},m=e=>{d=e,x()},g=e=>{if(e.preventDefault(),!d)return;if(d.kind!==`profile`){p(d);return}let t=f.resolve(d.profileId),n=f.resolveOs(d.profileId);p({...d,...t?{machineClass:t}:{},...n?{os:n}:{}})};function x(){let n=S(d),r=s.profiles.toSorted(h),b=e.mode===`restart`,C=e.mode===`dispatch`,w=i(`sessionsView.${e.mode}SessionTitle`),T=i(`sessionsView.${e.mode}SessionDescription`,{session:e.sessionLabel}),E=i(`sessionsView.${e.mode}SessionAction`);t(()=>u`
          <zero-modal-dialog label=${w} @modal-cancel=${()=>p(null)}>
            <form class="exec-approval-card" @submit=${g}>
              <div class="exec-approval-header">
                <div class="exec-approval-title">${w}</div>
                <div class="muted">${T}</div>
              </div>
              ${b?u`<div class="exec-approval-error" role="alert">
                      ${i(`sessionsView.restartSessionWarning`)}
                    </div>`:C?u`<div class="callout">${i(`sessionsView.dispatchSessionNotice`)}</div>`:e.activeRun?u`<div class="exec-approval-error" role="alert">
                          ${i(`sessionsView.moveSessionActiveRunWarning`)}
                        </div>`:u`<div class="callout">
                          ${i(`sessionsView.moveSessionNoReplayWarning`)}
                        </div>`}
              ${a?u`<div class="muted">${i(`common.loading`)}</div>`:o?u`<div class="exec-approval-error" role="alert">${o}</div>`:u`
                        <div class="new-session-page__picker-root">
                          ${C?l:y({value:`gateway`,label:i(`newSession.gateway`),icon:c.monitor,checked:n===`gateway`,disabled:!!e.gatewayDisabledReason,title:e.gatewayDisabledReason,onSelect:()=>m({kind:`gateway`})},!1)}
                          ${s.devices.length>0?u`
                                  <div class="new-session-page__menu-title">
                                    ${i(`newSession.yourDevices`)}
                                  </div>
                                  ${s.devices.map(t=>{let r=e.deviceDisabledReason??t.disabledReason;return y({value:`device:${t.deviceId}`,label:t.label,sub:t.subtitle,icon:c.monitor,facts:e.deviceDisabledReason?[e.deviceDisabledReason]:t.facts,checked:n===`device:${t.deviceId}`,disabled:!!e.deviceDisabledReason||!t.selectable,title:r,onSelect:()=>m({kind:`device`,deviceId:t.deviceId})},!1)})}
                                `:l}
                          ${s.profiles.length>0?u`
                                  <div class="new-session-page__menu-title">
                                    ${i(`newSession.cloud`)}
                                  </div>
                                  ${r.map(t=>{let n=d?.kind===`profile`&&d.profileId===t.id,r=f.machines(t),a=t.operatingSystems??[],o=f.resolve(t.id)||r.find(e=>e.default===!0)?.id||``;return u`
                                      ${_({profiles:[t],selectedId:n?t.id:``,submitting:!1,profileDisabledReason:e.profileDisabledReason,onSelect:e=>m({kind:`profile`,profileId:e})})}
                                      ${n&&a.length>=2?u`
                                              <div class="new-session-page__menu-title">
                                                ${i(`newSession.operatingSystem`)}
                                              </div>
                                              ${v({kind:`os`,choices:a,selectedId:f.selectedOs(t),submitting:!1,onSelect:e=>f.selectOs(t.id,e,s.profiles,!1,x)})}
                                            `:l}
                                      ${n&&r.length>0?u`
                                              <div class="new-session-page__menu-title">
                                                ${i(`newSession.machine`)}
                                              </div>
                                              ${v({kind:`machine`,choices:r,selectedId:o,submitting:!1,onSelect:e=>f.select(t.id,e,s.profiles,!1,x)})}
                                            `:l}
                                    `})}
                                `:l}
                        </div>
                      `}
              <div class="exec-approval-actions">
                <button
                  type="submit"
                  class="btn primary"
                  ?disabled=${a||!!o||!d}
                >
                  ${E}
                </button>
                <button type="button" class="btn" @click=${()=>p(null)}>
                  ${i(`common.cancel`)}
                </button>
              </div>
            </form>
          </zero-modal-dialog>
        `)}x(),e.loadCatalog().then(e=>{s=e}).catch(e=>{o=r(e,i(`sessionsView.moveSessionCatalogFailed`))}).finally(()=>{a=!1,x()})}))}var w;function T(){return(T=e((()=>{d(),t(),p(),n(),x(),g(),o(),a(),m(),f(),w=!1})))()}T();export{C as showSessionPlacementTargetDialog};
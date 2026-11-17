import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Pu as i,ju as a,zu as o}from"./control-ui-core-DCNBgr3X.js";import{Aa as s,Ai as c,Ba as l,ca as u,ki as d,sa as f}from"./control-ui-core-DwX5Mpz4.js";import{G as p,J as m,W as h}from"./lit-runtime-B40xFCK_.js";import{Ur as g,Wr as _,Zr as v}from"./ui-AaV6iNVa.js";import{B as y,G as b,I as x,K as S,R as C,X as w,Y as T,Z as E,et as D,l as O,q as k,u as A}from"./control-ui-boot-shared-ZuP0LiFD.js";import{n as j,t as M}from"./en-settings-6vMW9YZk.js";var N;function P(){return(P=e((()=>{_(),h(),s(),c(),u(),x(),O(),i(),M(),r(),n(),j(),N=class extends a{constructor(){super(),new t(this).watchStore(()=>this.context?.nativeDeviceSettings)}renderPermissions(e){let t=this.context.nativeDeviceSettings,{permissions:n}=e,r=n.location,i=r?.preciseEditable??e.device.platform===`macos`;return m`
      ${n.entries.length>0?T({title:o(`configPage.deviceSettings.systemAccess`)},n.entries.map(({id:n,status:r})=>{let i=o(`configPage.deviceSettings.permissions.${n}.title`),a=e.device.platform===`macos`&&(n===`screenRecording`||n===`accessibility`)&&r===`notDetermined`;return k({title:i,description:o(`configPage.deviceSettings.permissions.${n}.hint`),stackedOnNarrow:!0,control:m`
                    <div class="settings-permission-control">
                      ${E({kind:`muted`,dot:!1,label:m`${r===`granted`?m`<span class="settings-permission-check" aria-hidden="true">${f.check}</span>`:p}${o(`configPage.deviceSettings.permissionStatuses.${a?`notGranted`:r}`)}`})}
                      ${r===`notDetermined`?m`<button type="button" class="btn" aria-label=${`${o(`configPage.deviceSettings.grant`)}: ${i}`} @click=${()=>t?.requestPermission(n)}>${o(`configPage.deviceSettings.grant`)}</button>`:r===`denied`?m`<button type="button" class="btn" aria-label=${`${o(`configPage.deviceSettings.openSystemSettings`)}: ${i}`} @click=${()=>t?.openSystemSettings(n)}>${o(`configPage.deviceSettings.openSystemSettings`)}</button>`:p}
                      ${a?m`<button type="button" class="btn settings-permission-recovery" aria-label=${`${o(`configPage.deviceSettings.openSystemSettings`)}: ${i}`} @click=${()=>t?.openSystemSettings(n)}>${o(`configPage.deviceSettings.openSystemSettings`)}</button>`:p}
                    </div>
                  `})})):p}
      ${r?T({title:o(`configPage.deviceSettings.location`)},m`
                ${k({title:o(`configPage.deviceSettings.locationAccess`),description:o(`configPage.deviceSettings.locationHint`),stackedOnNarrow:!0,control:w({value:r.mode,ariaLabel:o(`configPage.deviceSettings.locationAccess`),options:[`off`,`whileUsing`,`always`].map(e=>({value:e,label:o(`configPage.deviceSettings.locationModes.${e}`)})),onChange:e=>t?.set(`permissions.location.mode`,e)})})}
                ${i?D({title:o(`configPage.deviceSettings.preciseLocation`),description:o(`configPage.deviceSettings.preciseLocationHint`),checked:r.precise,disabled:r.mode===`off`,onChange:e=>t?.set(`permissions.location.precise`,e)}):k({title:o(`configPage.deviceSettings.preciseLocation`),description:o(`configPage.deviceSettings.preciseLocationReadOnlyHint`),stackedOnNarrow:!0,control:m`
                          <div class="settings-permission-control">
                            ${E({kind:`muted`,dot:!1,label:o(r.precise?`configPage.deviceSettings.preciseLocationStatuses.enabled`:`configPage.deviceSettings.preciseLocationStatuses.disabled`)})}
                            <button
                              type="button"
                              class="btn"
                              aria-label=${`${o(`configPage.deviceSettings.openSettings`)}: ${o(`configPage.deviceSettings.preciseLocation`)}`}
                              @click=${()=>t?.openSystemSettings(`location`)}
                            >
                              ${o(`configPage.deviceSettings.openSettings`)}
                            </button>
                          </div>
                        `})}
              `):p}
      ${e.capabilities?.activeComputerPresenceEnabled===void 0?p:T({title:o(`configPage.deviceSettings.privacy`)},D({title:o(`configPage.deviceSettings.activePresence`),description:o(`configPage.deviceSettings.activePresenceHint`),checked:e.capabilities.activeComputerPresenceEnabled,onChange:e=>t?.set(`capabilities.activeComputerPresenceEnabled`,e)}))}
    `}render(){let e=this.context?.nativeDeviceSettings,t=e?.snapshot,n=e?t?this.renderPermissions(t):y(o(`configPage.deviceSettings.loading`)):y(o(`configPage.deviceSettings.appOnly`));return m`
      ${S({title:l(`device-permissions`),subtitle:m`${o(t?.device.platform===`macos`?`configPage.deviceSettings.permissionsIntro`:`configPage.deviceSettings.permissionsIntroIos`)}
        ${C(`http://127.0.0.1:18789/platforms/${t?.device.platform??`macos`}`)}`})}
      ${A(b(n))}
    `}},v([g({context:d,subscribe:!0})],N.prototype,`context`,void 0),customElements.get(`zero-device-permissions-page`)||customElements.define(`zero-device-permissions-page`,N)})))()}P();
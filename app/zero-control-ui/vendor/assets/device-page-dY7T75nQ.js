import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Pu as i,ju as a,zu as o}from"./control-ui-core-DCNBgr3X.js";import{Aa as s,Ai as c,ka as l,ki as u}from"./control-ui-core-DwX5Mpz4.js";import{G as d,J as f,W as p,Z as m,i as h,o as g,rt as _}from"./lit-runtime-B40xFCK_.js";import{Ur as v,Wr as y,Zr as b}from"./ui-AaV6iNVa.js";import{B as x,G as S,I as C,K as w,R as T,Y as E,Z as D,et as O,l as k,q as A,tt as j,u as M}from"./control-ui-boot-shared-ZuP0LiFD.js";import{n as N,t as P}from"./en-settings-6vMW9YZk.js";import{n as F,t as I}from"./en-apps-CqNuJ9Q_.js";import{t as L}from"./native-chrome-setup-E3VJtXoB.js";function R(e){let t=B.get(e);return t||(t={domains:null,targetProfile:null},B.set(e,t)),t}function z(e,t,n){let r=B.get(e);r&&r[t]===n&&(r[t]=null,r.domains===null&&r.targetProfile===null&&B.delete(e))}var B,V;function H(){return(H=e((()=>{y(),p(),m(),h(),s(),c(),C(),k(),i(),I(),P(),r(),n(),L(),F(),N(),B=new WeakMap,V=class extends a{constructor(...e){super(...e),this.newDomain=``,this.gatewayHostingEdit=null,this.targetProfileTimer=null,this.subscriptions=new t(this).watchStore(()=>this.context?.nativeDeviceSettings,e=>{this.targetProfileTimer&&this.targetProfileTimer.capability!==e&&this.flushTargetProfile()})}disconnectedCallback(){this.flushTargetProfile(),this.subscriptions.clear(),super.disconnectedCallback()}toggle(e,t,n,r,i=!1){return t===void 0?d:O({title:o(`configPage.deviceSettings.${n}`),description:r,checked:t,disabled:i,onChange:t=>this.context.nativeDeviceSettings?.set(e,t)})}renderGatewayHosting(e){let t=this.context.nativeDeviceSettings;if(e.keepGatewayRunning===void 0||!t)return d;let n=this.gatewayHostingEdit?.capability===t?this.gatewayHostingEdit:null;return O({title:o(`configPage.deviceSettings.keepGatewayRunning`),description:f`${o(`configPage.deviceSettings.keepGatewayRunningHint`)}
      ${n?.error?f`<br /><span role="alert">${o(`configPage.deviceSettings.keepGatewayRunningFailed`)} ${n.error.message}</span>`:d}`,checked:e.keepGatewayRunning,disabled:e.keepGatewayRunningAvailable!==!0||n?.pending===!0,onChange:e=>{let n={capability:t,pending:!0};this.gatewayHostingEdit=n,t.set(`app.keepGatewayRunning`,e,e=>{this.gatewayHostingEdit===n&&this.context.nativeDeviceSettings===t&&(this.gatewayHostingEdit={capability:t,pending:!1,error:e})})}})}select(e,t,n,r,i=!1,a=!0){let s=this.context.nativeDeviceSettings,c=o(`configPage.deviceSettings.${e.slice(e.indexOf(`.`)+1)}`);return A({title:c,description:r,control:f`<select
        class="settings-select"
        aria-label=${c}
        .value=${a?g(t):t}
        ?disabled=${i}
        @change=${t=>{s?.set(e,t.currentTarget.value)}}
      >
        ${n.map(e=>f`<option value=${e.id} ?selected=${e.id===t} ?disabled=${e.disabled}>${e.name}</option>`)}
      </select>`})}editTargetProfile(e){let t=this.context.nativeDeviceSettings;t&&(this.targetProfileTimer!==null&&clearTimeout(this.targetProfileTimer.timer),R(t).targetProfile={value:e,sent:!1},this.targetProfileTimer={capability:t,timer:setTimeout(()=>this.flushTargetProfile(),400)},this.requestUpdate())}flushTargetProfile(){let e=this.targetProfileTimer;if(!e)return;clearTimeout(e.timer),this.targetProfileTimer=null;let t=B.get(e.capability)?.targetProfile;t&&!t.sent&&(t.sent=!0,e.capability.set(`browser.cookieSync.targetProfile`,t.value,()=>{z(e.capability,`targetProfile`,t)}))}updateDomains(e){let t=this.context.nativeDeviceSettings;if(!t)return;let n=B.get(t)?.domains??t.snapshot?.browser?.cookieSync?.domains;if(!n)return;let r=[...new Set(e(n).map(e=>e.trim().toLowerCase()).filter(Boolean))];R(t).domains=r,this.requestUpdate(),t.set(`browser.cookieSync.domains`,r,()=>{z(t,`domains`,r)})}renderBrowser(e){let t=this.context.nativeDeviceSettings,n=e.cookieSync,r=t?B.get(t):void 0,i=r?.domains??n?.domains??[];return f`
      ${E({title:o(`configPage.deviceSettings.chromeExtension`)},A({title:o(`configPage.deviceSettings.chromeExtensionSetup`),stacked:!0,control:f`
            <div class="device-extension-setup">
              <zero-native-chrome-setup auto-inspect></zero-native-chrome-setup>
              <div class="device-extension-setup__actions">
                <a
                  href="http://127.0.0.1:18789/tools/chrome-extension"
                  target="_blank"
                  rel="noopener noreferrer"
                  >${o(`appsPage.ctaChromeWebStore`)}</a
                >
                ${T(`http://127.0.0.1:18789/tools/chrome-extension`)}
              </div>
            </div>
          `}))}
      ${e.importAvailable||n&&!n.available?E({title:o(`configPage.deviceSettings.browser`)},f`
                ${e.importAvailable?A({title:o(`configPage.deviceSettings.browserImport`),description:o(`configPage.deviceSettings.browserImportHint`),control:f`<button
                          type="button"
                          class="btn"
                          @click=${()=>t?.openPanel(`browser-import`)}
                        >
                          ${o(`configPage.deviceSettings.importBrowserLogins`)}
                        </button>`}):d}
                ${n&&!n.available?A({title:o(`configPage.deviceSettings.cookieSync`),description:o(`configPage.deviceSettings.cookieSyncUnavailable`)}):d}
              `):d}
      ${n?.available?E({title:o(e.importAvailable?`configPage.deviceSettings.cookieSync`:`configPage.deviceSettings.browser`),description:e.importAvailable?void 0:o(`configPage.deviceSettings.cookieSync`)},f`
                ${this.toggle(`browser.cookieSync.enabled`,n.enabled,`cookieSyncEnabled`,o(`configPage.deviceSettings.cookieSyncHint`))}
                ${A({title:o(`configPage.deviceSettings.domains`),description:o(`configPage.deviceSettings.domainsHint`),stacked:!0,control:f`<div class="device-domains">
                    ${i.map(e=>f`<div class="device-domain-entry">
                        ${j(e)}
                        <button
                          type="button"
                          class="btn small"
                          aria-label=${o(`configPage.deviceSettings.removeDomain`,{domain:e})}
                          @click=${()=>this.updateDomains(t=>t.filter(t=>t!==e))}
                        >
                          ${o(`common.remove`)}
                        </button>
                      </div>`)}
                    <form
                      class="device-domain-entry"
                      @submit=${e=>{e.preventDefault(),this.updateDomains(e=>[...e,this.newDomain]),this.newDomain=``}}
                    >
                      <input
                        type="text"
                        class="settings-input"
                        aria-label=${o(`configPage.deviceSettings.addDomain`)}
                        .value=${g(this.newDomain)}
                        @input=${e=>{this.newDomain=e.currentTarget.value}}
                      />
                      <button type="submit" class="btn" ?disabled=${!this.newDomain.trim()}>
                        ${o(`configPage.deviceSettings.addDomain`)}
                      </button>
                    </form>
                  </div>`})}
                ${A({title:o(`configPage.deviceSettings.targetProfile`),description:o(`configPage.deviceSettings.targetProfileHint`),control:f`<input
                    type="text"
                    class="settings-input"
                    aria-label=${o(`configPage.deviceSettings.targetProfile`)}
                    .value=${g(r?.targetProfile?.value??n.targetProfile)}
                    @input=${e=>{this.editTargetProfile(e.currentTarget.value)}}
                    @change=${()=>this.flushTargetProfile()}
                  />`})}
                ${A({title:o(`configPage.deviceSettings.syncStatus`),description:n.detail??void 0,control:D({kind:n.state===`error`?`danger`:n.state===`running`?`accent`:`muted`,label:o(`configPage.deviceSettings.syncStates.${n.state}`)})})}
              `):d}
    `}renderSettings(e){let{app:t,capabilities:n}=e,r=this.context.nativeDeviceSettings;return f`
      ${t?E({title:o(`configPage.deviceSettings.app`)},f`
                ${this.toggle(`app.nativeExperienceEnabled`,t.nativeExperienceEnabled,`nativeExperience`,o(`configPage.deviceSettings.nativeExperienceHint`))}
                ${t.appearance===void 0?d:this.select(`app.appearance`,t.appearance,[`system`,`light`,`dark`].map(e=>({id:e,name:o(`configPage.deviceSettings.appearanceModes.${e}`)})))}
                ${this.toggle(`app.notificationsEnabled`,t.notificationsEnabled,`notificationsEnabled`,o(`configPage.deviceSettings.notificationsEnabledHint`))}
                ${this.toggle(`app.showDockIcon`,t.showDockIcon,`showDockIcon`,o(`configPage.deviceSettings.showDockIconHint`))}
                ${t.iconStyle?this.select(`app.iconStyle`,t.iconStyle.selectedId,t.iconStyle.available,o(`configPage.deviceSettings.iconStyleHint`),t.iconStyle.available.length===0):d}
                ${this.toggle(`app.iconAnimationsEnabled`,t.iconAnimationsEnabled,`iconAnimations`,o(`configPage.deviceSettings.iconAnimationsHint`))}
                ${this.toggle(`app.launchAtLogin`,t.launchAtLogin,`launchAtLogin`,t.launchAtLoginAvailable===!1?o(`configPage.deviceSettings.launchAtLoginUnavailable`):void 0,t.launchAtLoginAvailable===!1)}
                ${this.renderGatewayHosting(t)}
                ${this.toggle(`app.quickChatEnabled`,t.quickChatEnabled,`quickChat`,o(`configPage.deviceSettings.quickChatHint`))}
                ${t.quickChatShortcut===void 0?d:A({title:o(`configPage.deviceSettings.quickChatShortcut`),control:f`
                          ${j(t.quickChatShortcut??o(`configPage.deviceSettings.notSet`))}
                          <button
                            type="button"
                            class="btn"
                            @click=${()=>r?.openPanel(`quick-chat-shortcut`)}
                          >
                            ${o(`configPage.deviceSettings.changeShortcut`)}
                          </button>
                        `})}
              `):d}
      ${n?E({title:o(`configPage.deviceSettings.capabilities`)},f`
                ${this.toggle(`capabilities.canvasEnabled`,n.canvasEnabled,`canvas`,o(`configPage.deviceSettings.canvasHint`))}
                ${this.toggle(`capabilities.cameraEnabled`,n.cameraEnabled,`camera`,o(`configPage.deviceSettings.cameraHint`))}
                ${this.toggle(`capabilities.keepAwakeEnabled`,n.keepAwakeEnabled,`keepAwake`,o(e.device.platform===`ios`?`configPage.deviceSettings.keepAwakeHint`:`configPage.deviceSettings.keepAwakeComputerHint`))}
                ${n.healthSummaryAvailable?this.toggle(`capabilities.healthSummaryEnabled`,n.healthSummaryEnabled,`healthSummary`,o(`configPage.deviceSettings.healthSummaryHint`)):d}
                ${this.toggle(`capabilities.computerControlEnabled`,n.computerControlEnabled,`computerControl`,o(`configPage.deviceSettings.computerControlHint`))}
                ${this.toggle(`capabilities.desktopSharingEnabled`,n.desktopSharingEnabled,`desktopSharing`,o(e.device.platform===`macos`?`configPage.deviceSettings.desktopSharingHint`:`configPage.deviceSettings.desktopSharingComputerHint`))}
                ${e.desktopSharing?A({title:o(`configPage.deviceSettings.desktopSharingStatus`),description:e.desktopSharing.detail,control:D({kind:e.desktopSharing.state===`error`?`danger`:e.desktopSharing.state===`running`?`ok`:`muted`,label:o(`configPage.deviceSettings.desktopSharingStates.${e.desktopSharing.state}`)})}):d}
                ${this.toggle(`capabilities.unattendedDesktopEnabled`,n.unattendedDesktopEnabled,`unattendedDesktop`,o(`configPage.deviceSettings.unattendedDesktopHint`))}
                ${e.desktopAvailability?A({title:o(`configPage.deviceSettings.desktopAvailability`),control:D({kind:e.desktopAvailability.state===`unlocked`?`ok`:`warn`,label:o(`configPage.deviceSettings.desktopStates.${e.desktopAvailability.state}`)})}):d}
                ${n.computerControlEnabled&&n.computerControlProvider!==void 0?this.select(`capabilities.computerControlProvider`,n.computerControlProvider,[{id:`peekaboo`,name:o(`configPage.deviceSettings.peekaboo`)},{id:`cua`,name:o(n.cuaDriverBundled?`configPage.deviceSettings.cua`:`configPage.deviceSettings.cuaUnavailable`),disabled:!n.cuaDriverBundled}],void 0,!1,!1):d}
                ${this.toggle(`capabilities.peekabooBridgeEnabled`,n.peekabooBridgeEnabled,`peekabooBridge`,o(`configPage.deviceSettings.peekabooBridgeHint`),!n.computerControlEnabled)}
              `):d}
      ${e.browser?this.renderBrowser(e.browser):d}
      ${t?.debugPaneEnabled===void 0?d:E({title:o(`configPage.deviceSettings.developer`)},f`
                ${this.toggle(`app.debugPaneEnabled`,t.debugPaneEnabled,`debugTools`)}
                ${t.debugPaneEnabled?A({title:o(`configPage.deviceSettings.debugWindow`),control:f`<button type="button" class="btn" @click=${()=>r?.openPanel(`debug`)}>${o(`configPage.deviceSettings.openDebug`)}</button>`}):d}
              `)}
      ${e.device.platform===`ios`?E({title:o(`configPage.deviceSettings.device`)},f`${[`diagnostics`,`licenses`,`about`,`watch`].map(e=>A({title:o(`configPage.deviceSettings.panels.${e}`),control:f`<button
                    type="button"
                    class="btn"
                    @click=${()=>r?.openPanel(e)}
                  >
                    ${o(`configPage.deviceSettings.openPanel`)}
                  </button>`}))}`):d}
    `}render(){let e=this.context?.nativeDeviceSettings,t=e?.snapshot,n=e?t?this.renderSettings(t):x(o(`configPage.deviceSettings.loading`)):x(o(`configPage.deviceSettings.appOnly`));return f`
      ${w({title:o(l(t)),subtitle:f`${o(t?.device.platform===`macos`?`configPage.deviceSettings.intro`:`configPage.deviceSettings.introIos`)}
        ${T(`http://127.0.0.1:18789/platforms/${t?.device.platform??`macos`}`)}`})}
      ${M(S(n))}
    `}},b([v({context:u,subscribe:!0})],V.prototype,`context`,void 0),b([_()],V.prototype,`newDomain`,void 0),b([_()],V.prototype,`gatewayHostingEdit`,void 0),customElements.get(`zero-device-page`)||customElements.define(`zero-device-page`,V)})))()}H();
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{P as t,Pu as n,W as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{ca as a,qr as o,sa as s}from"./control-ui-core-DwX5Mpz4.js";import{G as c,J as l,W as u,c as d,l as f}from"./lit-runtime-B40xFCK_.js";import{At as p,jt as m,kt as h}from"./control-ui-boot-shared-BX8huZUb.js";import{an as g,cn as _,on as v}from"./control-ui-boot-shared-ZuP0LiFD.js";import{n as y,t as b}from"./en-devices-B_lyWAH1.js";function x(e){return i(e===`limited`?`devices.pairing.limitedAccess`:e===`node`?`devices.pairing.nodeAccessSummary`:`devices.pairing.fullAccessSummary`)}function S(e,t){let n=e.lifecycle;if(n.phase!==`success`&&n.phase!==`delivery-uncertain`&&n.phase!==`expired`)return c;let r=n.phase===`success`,a=n.phase===`delivery-uncertain`,o=l`<button
    class="btn primary"
    type="button"
    @click=${r?e.onClose:e.onRefresh}
  >
    ${r?i(`devices.pairing.done`):l`${s.refresh} ${i(`devices.pairing.generateNewCode`)}`}
  </button>`;return f(n.phase,l`<div
      class="device-pair-setup__state"
      role=${a?`alert`:`status`}
      aria-live=${a?c:`polite`}
    >
      <div
        class=${r?`device-pair-setup__state-icon device-pair-setup__state-icon--success`:`device-pair-setup__state-icon`}
        aria-hidden="true"
      >
        ${r?s.badgeCheck:a?s.alertTriangle:s.refresh}
      </div>
      <h3>${r?n.deviceName??t:t}</h3>
      ${r?l`<p>
              ${n.deviceName?l`${t} <span aria-hidden="true">·</span> `:c}${x(n.access)}
            </p>`:a?l`<p>${i(`devices.pairing.deliveryUncertainHint`)}</p>`:c}
      ${a?l`<div class="device-pair-setup__actions">${o}</div>`:o}
    </div>`)}function C(e){if(!e.open)return c;let n=e.lifecycle,r=i(`devices.pairing.title`),a=n.phase===`success`?i(`devices.pairing.pairedTitle`):n.phase===`delivery-uncertain`?i(`devices.pairing.deliveryUncertainTitle`):n.phase===`expired`?i(`devices.pairing.expiredTitle`):i(`devices.pairing.subtitle`),o=i(`devices.pairing.copySetupCode`),u=n.phase===`waiting`?n.setup:null,d=u?.gatewayUrls??(u?[u.gatewayUrl]:[]),m=n.access===`node`,v=m?T:w,y=u?`zero node run --pair "zero-pair://${u.setupCode}"`:``,b=!!(u&&u.expiresAtMs<=e.nowMs),x=n.phase!==`success`&&n.phase!==`delivery-uncertain`&&n.phase!==`reconciling`&&(n.phase!==`error`||n.source!==`status`),C=n.phase===`selection`||n.phase===`error`&&n.source===`create`;return l`
    <zero-modal-dialog label=${r} description=${a} @modal-cancel=${e.onClose}>
      <section class="device-pair-setup">
        <header class="device-pair-setup__header">
          <div class="device-pair-setup__phone" aria-hidden="true">
            ${m?s.server:s.smartphone}
          </div>
          <div>
            <h2>${r}</h2>
            <p>${a}</p>
            ${n.phase!==`success`&&!m?l`<p class="device-pair-setup__get-apps">
                    ${i(`devices.pairing.noApp`)}
                    <button type="button" @click=${e.onGetApps}>
                      ${i(`devices.pairing.getApps`)}
                    </button>
                  </p>`:c}
          </div>
          <button
            class="btn btn--icon btn--ghost device-pair-setup__close"
            type="button"
            aria-label=${i(`common.dismiss`)}
            @click=${e.onClose}
          >
            ${s.x}
          </button>
        </header>

        <div class="device-pair-setup__body">
          ${x?l`<fieldset class="device-pair-setup__access" ?disabled=${!C}>
                  <legend>${i(`devices.pairing.accessTitle`)}</legend>
                  ${E.map(([t,r,a])=>l`<label>
                      <input
                        type="radio"
                        name="device-pair-access"
                        .checked=${n.access===t}
                        @change=${()=>e.onAccessChange(t)}
                      />
                      <span>
                        <strong>${i(r)}</strong>
                        <small>${i(a)}</small>
                      </span>
                    </label>`)}
                </fieldset>`:c}
          ${n.phase===`selection`?l`
                  <button class="btn primary" type="button" @click=${e.onRefresh}>
                    ${m?s.server:s.smartphone}
                    ${i(`devices.pairing.generateCode`)}
                  </button>
                `:c}
          ${n.phase===`loading`||n.phase===`reconciling`?l`
                  <div class="device-pair-setup__loading" role="status" aria-live="polite">
                    <span class="device-pair-setup__spinner" aria-hidden="true"></span>
                    <span
                      >${i(n.phase===`loading`?`devices.pairing.generating`:`common.loading`)}</span
                    >
                  </div>
                `:c}
          ${n.phase===`error`?l`
                  <div class="callout danger device-pair-setup__error" role="alert">
                    <strong
                      >${i(n.source===`status`?`devices.pairing.statusFailed`:`devices.pairing.failed`)}</strong
                    >
                    <span>${n.message}</span>
                  </div>
                  <button class="btn primary" type="button" @click=${e.onRefresh}>
                    ${s.refresh} ${i(`common.reload`)}
                  </button>
                `:c}
          ${u?l`
                  ${m?l`<div class="device-pair-setup__command">
                          ${b?c:l`<div class="login-gate__command">
                                  <code>${y}</code>
                                  ${_(y,i(`connection.help.copyCommand`))}
                                </div>`}
                          <p class="device-pair-setup__waiting" role="timer" aria-live="off">
                            ${b?i(`devices.pairing.nodeExpired`):i(`devices.pairing.nodeExpiresIn`,{time:t(u.expiresAtMs,e.nowMs)})}
                          </p>
                        </div>`:l`<div class="device-pair-setup__qr-frame">
                          ${u.qrDataUrl?l`<img
                                  class="device-pair-setup__qr"
                                  src=${u.qrDataUrl}
                                  alt=${i(`devices.pairing.qrAlt`)}
                                  width="360"
                                  height="360"
                                  draggable="false"
                                />`:l`<div class="device-pair-setup__qr-unavailable">
                                  ${i(`devices.pairing.qrUnavailable`)}
                                </div>`}
                        </div>`}

                  <div class="device-pair-setup__meta">
                    <span class="settings-status settings-status--accent">
                      <span class="settings-status__dot"></span>
                      ${u.auth}
                    </span>
                    <div class="device-pair-setup__gateways">
                      ${d.map(e=>l`
                          <span class="device-pair-setup__gateway" title=${e}
                            >${e}</span
                          >
                        `)}
                    </div>
                  </div>

                  ${u.accessDowngraded?l`
                          <div class="callout warn device-pair-setup__access-warning" role="status">
                            <strong>${i(`devices.pairing.transportLimitedTitle`)}</strong>
                            <span>${i(`devices.pairing.transportLimitedHint`)}</span>
                          </div>
                        `:c}

                  <div class="device-pair-setup__actions">
                    ${m?c:f(u.setupCode,l`<button
                              class="btn primary"
                              type="button"
                              @click=${e=>void g(e,u.setupCode,o)}
                            >
                              ${s.copy} <span data-copy-label>${o}</span>
                            </button>`)}
                    <button class="btn" type="button" @click=${e.onRefresh}>
                      ${s.refresh} ${i(`devices.pairing.newCode`)}
                    </button>
                  </div>

                  <details class="device-pair-setup__fallback">
                    <summary>${i(`devices.pairing.showSetupCode`)}</summary>
                    <code>${u.setupCode}</code>
                  </details>

                  ${e.pendingCount>0?l`
                          <div class="callout warn device-pair-setup__pending">
                            <span>
                              ${i(`devices.pairing.pending`,{count:String(e.pendingCount)})}
                            </span>
                            <button class="btn btn--sm" @click=${e.onManageDevices}>
                              ${i(`devices.pairing.review`)}
                            </button>
                          </div>
                        `:l`<p class="device-pair-setup__waiting">
                          ${i(m?`devices.pairing.nodeWaiting`:`devices.pairing.waiting`)}
                        </p>`}
                `:c}
          ${S(e,a)}
        </div>

        <footer class="device-pair-setup__footer">
          <a
            href=${v}
            target=${h}
            rel=${p()}
            aria-label=${i(`devices.pairing.helpNewTab`)}
          >
            <span>${i(`devices.pairing.help`)}</span>
            <span class="device-pair-setup__external-icon" aria-hidden="true"
              >${s.externalLink}</span
            >
          </a>
          <button class="btn btn--ghost" type="button" @click=${e.onManageDevices}>
            ${i(`devices.pairing.manageDevices`)}
          </button>
        </footer>
      </section>
    </zero-modal-dialog>
  `}var w,T,E;function D(){return(D=e((()=>{u(),d(),v(),a(),o(),n(),b(),m(),r(),y(),w=`http://127.0.0.1:18789/channels/pairing#pair-from-the-control-ui-recommended`,T=`http://127.0.0.1:18789/gateway/pairing#one-paste-node-pairing`,E=[[`full`,`devices.pairing.fullAccess`,`devices.pairing.fullAccessHint`],[`limited`,`devices.pairing.limitedAccess`,`devices.pairing.limitedAccessHint`],[`node`,`devices.pairing.nodeAccess`,`devices.pairing.nodeAccessHint`]]})))()}D();export{C as renderDevicePairSetup};
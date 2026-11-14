import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Hr as t,Mu as n,Nu as r,Ou as i,Pu as a,Tu as o,Vr as s,ku as c,zu as l}from"./control-ui-core-DCNBgr3X.js";import{F as u,I as d,Ii as f,Li as p,ca as m,qr as h,ra as g,sa as _,ta as v}from"./control-ui-core-DwX5Mpz4.js";import{G as y,J as b,W as x,Z as S,at as C,lt as w,rt as T}from"./lit-runtime-B40xFCK_.js";import{aa as E,ia as D}from"./control-ui-boot-shared-BX8huZUb.js";import{Zr as O}from"./ui-AaV6iNVa.js";function k(e,...t){return{id:e,label:`shortcutsOverlay.labels.${e}`,combos:t}}function A(e,t){return{id:e,label:`shortcutsOverlay.sections.${e}`,entries:t}}function j(e=`enter`){return e===`modifier-enter`?M.map(e=>A(e.id,e.entries.map(e=>N.has(e.id)?k(e.id,o.modifiedEnter):e))):M}var M,N;function P(){return(P=e((()=>{D(),i(),E(),M=[A(`general`,[k(`commandPalette`,o.commandPalette),k(`newSession`,o.newSession),k(`paletteStartSession`,o.modifiedEnter),k(`keyboardShortcuts`,o.keyboardShortcuts),k(`toggleSidebar`,o.toggleSidebar),k(`debugOverlay`,o.debugOverlay),k(`appearanceSettings`,o.appearanceSettings),k(`startNewSession`,o.sendMessage),k(`closeDialog`,o.escape)]),A(`chat`,[k(`archiveSession`,o.archiveSession),k(`sendMessage`,o.sendMessage),k(`newline`,o.newline),k(`steerImmediately`,o.modifiedEnter),k(`historyRecall`,o.historyPrevious,o.historyNext),k(`transcriptSearch`,o.transcriptSearch),k(`clearReply`,o.escape),k(`stopResponse`,o.escape),k(`cancelDictation`,o.escape),k(`saveQueuedMessage`,o.modifiedEnter)]),A(`panels`,[k(`terminalPanel`,o.terminalPanel),k(`homePanel`,o.homePanel),k(`workspaceFiles`,o.workspaceFiles),k(`sideChat`,o.sideChat),k(`browserPanel`,o.browserPanel),k(`desktopPanel`,o.desktopPanel),k(`discussionPanel`,o.discussionPanel),k(`dashboardPanel`,o.dashboardPanel),k(`reviewPanel`,o.reviewPanel)]),A(`sidebar`,[k(`toggleSessionSelect`,o.toggleSessionSelect),k(`extendSessionSelect`,o.extendSessionSelect)]),A(`imageViewer`,[k(`zoomIn`,o.zoomIn),k(`zoomOut`,o.zoomOut),k(`zoomReset`,o.zoomReset),k(`panImageHorizontal`,o.imagePanLeft,o.imagePanRight),k(`panImageVertical`,o.imagePanUp,o.imagePanDown)]),A(`approvals`,[k(`approveOnce`,o.modifiedEnter),k(`approveAlways`,o.approveAlways),k(`denyApproval`,o.denyApproval)])],N=new Set([`sendMessage`,`startNewSession`])})))()}var F;function I(){return(I=e((()=>{x(),S(),u(),a(),P(),i(),s(),r(),m(),f(),v(),h(),F=class extends n{constructor(...e){super(...e),this.sendShortcut=`enter`,this.open=!1,this.handleKeydown=async e=>{let n=e.currentTarget,r=document.zeroModalLayers;if(e.defaultPrevented||e.repeat||!this.open||!(n instanceof HTMLElement)||r?.size!==1||!r.has(n))return;let i=this.newSessionHost,a=i?.context,s=c(o.newSession,e)&&i&&!i.onboardingMode&&t(a?.gateway.snapshot,{method:`sessions.create`,params:{},sessionScope:!0}).allowed;(s||c(o.keyboardShortcuts,e))&&(e.preventDefault(),e.stopPropagation(),this.open=!1,await this.updateComplete,this.isConnected&&!this.open&&s&&i.isConnected&&i.context===a&&d(i,`shortcut`))}}static{this.styles=[p,w`
      :host {
        display: contents;
        --zero-modal-width: 560px;
      }

      .dialog {
        display: flex;
        max-height: min(720px, calc(100dvh - 64px));
        flex-direction: column;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--card);
        color: var(--text);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 22px 16px;
        border-bottom: 1px solid var(--border);
      }

      h2 {
        margin: 0;
        color: var(--text-strong);
        font-size: 16px;
        font-weight: 600;
      }

      .close {
        display: grid;
        width: 28px;
        height: 28px;
        place-items: center;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--muted);
      }

      .close span {
        display: flex;
      }

      .close svg {
        width: 16px;
        height: 16px;
      }

      .close:hover {
        background: var(--bg-hover);
        color: var(--text);
      }

      .body {
        overflow: auto;
        padding: 8px 22px 18px;
      }

      section + section {
        margin-top: 12px;
        border-top: 1px solid var(--border);
      }

      h3 {
        margin: 18px 0 8px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .shortcut-row {
        display: flex;
        min-height: 34px;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        font-size: 13px;
      }

      .combos {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .combo {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      kbd {
        min-width: 22px;
        padding: 3px 6px;
        border: 1px solid var(--border-strong);
        border-radius: 5px;
        background: var(--bg-muted);
        color: var(--text);
        font: inherit;
        font-size: 12px;
        text-align: center;
      }
    `]}get isOpen(){return this.open}toggle(){this.open=!this.open}render(){if(!this.open)return y;let e=e=>{e.preventDefault(),this.open=!1};return b`
      <zero-modal-dialog
        label=${l(`shortcutsOverlay.title`)}
        @modal-cancel=${e}
        @keydown=${this.handleKeydown}
      >
        <div class="dialog">
          <header class="header">
            <h2>${l(`shortcutsOverlay.title`)}</h2>
            <button class="close" type="button" aria-label=${l(`common.close`)} @click=${e}>
              <span aria-hidden="true">${_.x}</span>
            </button>
          </header>
          <div class="body">
            ${j(this.sendShortcut).map(e=>b`
                <section>
                  <h3>${l(e.label)}</h3>
                  ${e.entries.map(e=>b`
                      <div class="shortcut-row">
                        <span>${l(e.label)}</span>
                        <span class="combos">
                          ${e.combos.map(e=>b`
                              <span class="combo">
                                ${g(e,{separateKeys:!0})}
                              </span>
                            `)}
                        </span>
                      </div>
                    `)}
                </section>
              `)}
          </div>
        </div>
      </zero-modal-dialog>
    `}},O([C({attribute:!1})],F.prototype,`sendShortcut`,void 0),O([C({attribute:!1})],F.prototype,`newSessionHost`,void 0),O([T()],F.prototype,`open`,void 0),customElements.get(`zero-keyboard-shortcuts-dialog`)||customElements.define(`zero-keyboard-shortcuts-dialog`,F)})))()}I();
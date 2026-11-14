import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Pu as t,xu as n,yu as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{Ct as a,Tt as o,ft as s,ht as c,qr as l}from"./control-ui-core-DwX5Mpz4.js";import{G as u,J as d,K as f,W as p}from"./lit-runtime-B40xFCK_.js";import{f as m,p as h}from"./ui-AaV6iNVa.js";import{oa as g,sa as _}from"./control-ui-boot-shared-ZuP0LiFD.js";import{n as v,t as y}from"./en-update-actions-DHaS0Ac2.js";import{t as b}from"./update-run-view-CK_Qg8iE.js";function x(e,t){let n=e?.currentVersion?.trim(),r=n?i(`updates.target.version`,{version:n}):null,a=s(t,e);if(r&&a){let n=t?.install?.git,o=n?.status===`behind`||n?.status===`diverged`||t?.target?.kind===`git`||e?.commitsBehind!==void 0;return i(o?`updates.confirm.versionsBehind`:`updates.confirm.versions`,{available:a,installed:r})}return r??a??void 0}function S(e){return i(e?`updates.dialog.installing`:`updates.dialog.disconnected`)}async function C(e){if(E)return;let t=document.createElement(`div`);document.body.append(t),document.body.classList.add(T);let n=e.viaNativeApp?{confirmLabel:i(`updates.confirm.macAction`),message:i(`updates.confirm.macMessage`),title:i(`chat.sidebar.updateMacAndGateway`)}:{confirmLabel:i(`updates.confirm.action`),message:i(`updates.confirm.message`),title:i(`chat.sidebar.updateGateway`)},a=x(e.updateAvailable,e.updateSchedule);await new Promise(s=>{let c=e.existingRun?{kind:`run`,run:e.existingRun}:{kind:`confirm`},l=!1,p,m,g=!1,v,y=`idle`,b=()=>{l||(l=!0,p?.(),m!==void 0&&globalThis.clearTimeout(m),f(u,t),t.remove(),document.body.classList.remove(T),E=!1,s())},x=()=>{!l&&c.kind===`run`&&c.run.status!==`running`&&e.onAcknowledge?.(),b()},C=(e,t)=>{let n=e(e=>{if(!l){if(v=e,c.kind===`run`&&!e.run){b();return}t(e)}});l?n():p=n};E=!0;let D=()=>{if(l)return;let r=c,o=r.kind===`run`?r.run:null,s=r.kind===`run`?v?.readError:null,m=r.kind===`working`||o?.status===`running`,g=o!==null&&o.status!==`running`,b=r.kind===`failed`||o!==null&&h(o),C=y===`pending`,w=typeof y==`object`?y.error:null,T=b||!!s||y!==`idle`,E=v?.connected===!1,A=r.kind===`run`?s??``:r.kind===`failed`?r.message:r.kind===`working`?S(!E):`${n.message} ${i(`updates.confirm.impact`)}`;f(d`
          <zero-modal-dialog label=${n.title} description=${A} @modal-cancel=${x}>
            <div class="exec-approval-card update-run-dialog">
              <div class="exec-approval-header">
                <div>
                  <div class="exec-approval-title">${n.title}</div>
                  <div class="exec-approval-sub" style="white-space: pre-line">${A}</div>
                </div>
              </div>
              <div role="status" aria-live="polite" class="exec-approval-sub">
                ${E&&T?i(`updates.dialog.checkStatusDisconnected`):y===`success`&&!s?i(`updates.dialog.statusRefreshed`):u}
              </div>
              ${w?d`<div role="alert" class="exec-approval-sub">${w}</div>`:u}
              ${a&&r.kind===`confirm`?d`<div class="exec-approval-command mono update-confirmation-details">
                      <div>${a}</div>
                      ${_(e.updateSchedule,e.updateAvailable)}
                    </div>`:u}
              ${r.kind===`run`?d`<zero-update-run-view
                      .run=${r.run}
                      .connected=${!E}
                    ></zero-update-run-view>`:u}
              <div class="exec-approval-actions">
                ${g||T?d` ${T&&e.onCheckStatus?d`<button
                                type="button"
                                class="btn ${C?`btn--busy`:``}"
                                ?disabled=${C||E}
                                @click=${O}
                              >
                                ${C?d`<span class="btn__spinner" aria-hidden="true"></span>${i(`updates.dialog.checkingStatus`)}`:i(`updates.dialog.checkStatus`)}
                              </button>`:u}
                        ${b?d`<button
                                type="button"
                                class="btn primary"
                                ?disabled=${C||E}
                                @click=${()=>{c={kind:`confirm`},y=`idle`,p?.(),D()}}
                              >
                                ${i(`updates.dialog.retryUpdate`)}
                              </button>`:u}
                        ${b&&e.onReviewUpdate?d`<button
                                type="button"
                                class="btn"
                                @click=${()=>{x(),e.onReviewUpdate?.()}}
                              >
                                ${i(`updates.reviewUpdate`)}
                              </button>`:u}
                        <button type="button" class="btn" autofocus @click=${x}>
                          ${i(`common.close`)}
                        </button>`:d`
                        <button
                          type="button"
                          class="btn danger ${m?`btn--busy`:``}"
                          ?disabled=${m}
                          @click=${k}
                        >
                          ${m?d`<span class="btn__spinner" aria-hidden="true"></span>${i(`chat.updating`)}`:n.confirmLabel}
                        </button>
                        <button type="button" class="btn" autofocus @click=${x}>
                          ${i(m?`common.close`:`common.cancel`)}
                        </button>
                      `}
              </div>
            </div>
          </zero-modal-dialog>
        `,t)};async function O(){if(y!==`pending`&&v?.connected!==!1&&e.onCheckStatus){y=`pending`,D();try{y=await e.onCheckStatus()?`success`:v?.readError?`idle`:{error:i(`updates.dialog.statusNotRefreshed`)}}catch(e){y={error:r(e)}}finally{D()}}}function k(){if(c.kind!==`confirm`)return;if(e.viaNativeApp&&o()){x();return}let t=e.watchUpdateProgress;if(!t){e.startGatewayUpdate(),x();return}g=!1,m!==void 0&&globalThis.clearTimeout(m),c={kind:`working`},D(),e.startGatewayUpdate();let n=!0;C(t,e=>{let t=n;if(n=!1,c.kind===`confirm`)return;if(e.run&&(!t||e.run.status===`running`)){g=!0,c={kind:`run`,run:e.run},D();return}let r=e.failure&&e.readError?`${e.failure}\n${e.readError}`:e.failure??e.readError;if(r&&!t){c={kind:`failed`,message:r},D();return}g||=e.busy,c={kind:`working`},D()}),!l&&(m=globalThis.setTimeout(()=>{l||g||c.kind!==`working`||(c={kind:`failed`,message:i(`updates.dialog.notStarted`)},D())},w))}e.existingRun&&e.watchUpdateProgress&&C(e.watchUpdateProgress,e=>{e.run&&(c={kind:`run`,run:e.run},D())}),D()})}var w,T,E;function D(){return(D=e((()=>{p(),m(),g(),t(),y(),l(),b(),n(),a(),c(),v(),w=4e3,T=`update-dialog-open`,E=!1})))()}D();export{C as confirmAndStartUpdateRuntime};
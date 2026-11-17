import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{B as t,Hs as n,I as r,Ic as i,Jc as a,Lc as o,Nu as s,Pu as c,Sl as l,W as u,Wc as d,Xc as ee,ea as te,ju as f,xl as ne,xu as p,yu as m,zu as h}from"./control-ui-core-DCNBgr3X.js";import{Sr as g,at as re,ca as ie,dr as ae,lt as oe,ni as se,sa as _,ui as ce,ur as v,wr as le}from"./control-ui-core-DwX5Mpz4.js";import{E as ue,G as y,J as b,W as x,Z as S,at as C,c as de,k as fe,l as pe,n as me,t as he}from"./lit-runtime-B40xFCK_.js";import{Ai as w,Zr as T,ea as ge,wa as E}from"./ui-AaV6iNVa.js";import{Mi as _e,Ni as ve}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Bs as ye,cl as be,ha as D,ma as O,sl as xe,zs as Se}from"./control-ui-boot-shared-CzJHozXQ.js";import{a as k,i as Ce,n as we,o as A,r as Te,s as j}from"./desktop-panel-BOMiRzMj.js";import{t as Ee}from"./sparkline-tile-BPsmVwfI.js";function M(e,t){return t.enabled&&t.target===e.target&&(t.mode===`offsite`?e.kind===`archive`&&t.namespace===e.namespace:e.kind===`git`)}function De(e,n){let{latest:i,latestOk:a}=e,o=e.kind===`git`&&i.status===`ok`&&i.pushFailed===!0,s=i.status===`failed`||o,c=i.location??a?.location,l=n.locations.find(t=>t.name===(c?.name??(e.kind===`archive`?e.target:void 0))),u=n.schedules.filter(t=>M(e,t)).reduce((e,t)=>t.nextRunAtMs===void 0?e:Math.min(e??1/0,t.nextRunAtMs),void 0),d=a?.location?.storedBytes??a?.bytes;return b`<li class="systems-backup" data-status=${s?`failed`:`ok`}>
    <div class="systems-backup__heading">
      <strong>${c?.name??e.target}</strong>
      <span class="systems-backup__state"
        >${h(o?`systems.backups.pushFailed`:s?`systems.backups.failed`:`systems.backups.ok`)}</span
      >
    </div>
    <div class="systems-backup__meta">
      <span>${h(`systems.backups.kinds.`+e.kind)}</span>
      <span
        >${h(o?`systems.backups.lastLocalSuccess`:`systems.backups.lastSuccess`,{age:a?t(Math.max(0,Date.now()-a.createdAt)):h(`systems.backups.never`)})}</span
      >
      ${d===void 0?y:b`<span>${w(d,N)}</span>`}
      ${u===void 0?y:b`<span>${h(`systems.backups.nextRun`,{time:r(u,{dateStyle:`short`,timeStyle:`short`})})}</span>`}
    </div>
    <div class="systems-backup__destination">${l?.displayTarget??e.target}</div>
    ${e.namespace===void 0?y:b`<div class="systems-backup__meta">${h(`systems.backups.namespace`,{name:e.namespace})}</div>`}
    ${s?b`<p class="systems-backup__error">${i.error??h(o?`systems.backups.pushFailureHint`:`systems.backups.failureHint`)}</p>`:y}
  </li>`}function Oe(e){let t=e.backups;return b`<section
    class="systems-backups"
    aria-label=${h(`systems.backups.title`)}
    aria-busy=${e.backupsLoading}
  >
    <h2>${h(`systems.backups.title`)}</h2>
    ${e.backupsError?b`<p class="systems-backup__error" role="alert">
            ${e.backupsError}
            <button
              class="systems-backups__check"
              ?disabled=${e.backupsLoading||!e.connected}
              @click=${()=>void e.refreshBackups()}
            >
              ${h(`common.retry`)}
            </button>
          </p>`:y}
    ${!t&&!e.backupsError?b`<p class="systems-backups__hint" role="status">${h(e.connected?`systems.backups.loading`:`systems.offlineGateway`)}</p>`:y}
    ${t?b`
            ${t.targets.length?b`<ul class="systems-backups__targets">
                    ${t.targets.map(e=>De(e,t))}
                  </ul>`:b`<p class="systems-backups__hint">
                    ${h(`systems.backups.empty`)}
                    <code>zero backup enable --to &lt;location&gt;</code>
                  </p>`}
            ${t.schedules.filter(e=>e.enabled&&!t.targets.some(t=>M(t,e))).map(e=>b`<p class="systems-backups__hint">${h(`systems.backups.scheduled`,{target:e.target})} ${e.namespace===void 0?y:h(`systems.backups.namespace`,{name:e.namespace})} ${e.nextRunAtMs===void 0?y:h(`systems.backups.nextRun`,{time:r(e.nextRunAtMs,{dateStyle:`short`,timeStyle:`short`})})}</p>`)}
            ${t.locations.length?b`<h3>${h(`systems.backups.locations`)}</h3>
                    <ul class="systems-backups__locations">
                      ${t.locations.map(t=>{let n=e.storageProbes.get(t.name),r=e.storageProbeBusy(t.name);return b`<li class="systems-storage-location">
                          <div>
                            <strong>${t.name}</strong
                            ><span class="systems-backup__destination"
                              >${t.displayTarget??t.provider}</span
                            >
                          </div>
                          <button
                            class="systems-backups__check"
                            ?disabled=${r||!e.connected}
                            aria-label=${h(`systems.backups.checkLocation`,{name:t.name})}
                            @click=${()=>void e.probeStorage(t.name)}
                          >
                            ${h(r?`systems.backups.checking`:`systems.backups.check`)}
                          </button>
                          ${n?b`<p class=${n.state===`ok`?`systems-backups__hint`:`systems-backup__error`} role="status">${h(`systems.backups.probe.`+n.state)}${n.message?` · ${n.message}`:y}${n.freeBytes===void 0?y:` · ${h(`systems.backups.free`,{size:w(n.freeBytes,N)})}`}</p>`:y}
                        </li>`})}
                    </ul>`:y}
          `:y}
  </section>`}var N;function P(){return(P=e((()=>{x(),c(),u(),N={style:`legacy-binary`,separator:` `,maxUnit:`tera`,fractionDigits:0}})))()}async function ke(e,t){let n=e.snapshot.client;if(!n||!t.isCurrent()||t.signal?.aborted)return;let r={signal:t.signal},[i,a,o]=await Promise.allSettled([n.request(`environments.list`,{includeDesktopSetup:!0},r),n.request(`node.list`,{},r),D(e,t.signal,{fresh:t.fresh})]);if(t.isCurrent()&&!t.signal?.aborted&&!(o.status===`rejected`&&o.reason instanceof DOMException&&o.reason.name===`AbortError`)){if(i.status===`rejected`)throw i.reason;return{environments:i.value.environments,nodes:a.status===`fulfilled`?a.value.nodes:[],gatewaySystemInfo:o.status===`fulfilled`?o.value.value:null,gatewaySampledAtMs:o.status===`fulfilled`?o.value.at:null,errors:{...a.status===`rejected`?{nodes:m(a.reason)}:{},...o.status===`rejected`?{systemInfo:m(o.reason)}:{}}}}}function Ae(e,t){let n=new Map(e.nodes.map(e=>[`node:${e.nodeId}`,e])),r=new Map,i=(e,t,n)=>{let i=r.get(e)??[];i.push({kind:t,session:n}),r.set(e,i)};for(let e of t){let t=e.placement;if(t&&t.state!==`local`){if(t.state===`requested`)continue;t.environmentId&&i(t.environmentId,t.state===`reclaimed`||t.state===`failed`?`retained-placement`:`placement`,e),t.state===`active`&&t.runner?.deviceId&&i(`node:${t.runner.deviceId}`,`runner`,e);continue}let n=e.execNode?.trim();i(n?`node:${n}`:`gateway`,n?`exec-binding`:`gateway`,e)}return e.environments.filter(e=>e.type!==`worker`||e.worker?.state!==`destroyed`&&e.worker?.state!==`failed`).map(t=>({environment:t,node:t.type===`node`?n.get(t.id):void 0,gatewaySystemInfo:t.id===`gateway`?e.gatewaySystemInfo??void 0:void 0,sessions:r.get(t.id)??[]}))}function F(){return(F=e((()=>{p(),O()})))()}function I(e){return e.gatewaySystemInfo??e.node?.hostStats}var L,R;function z(){return(z=e((()=>{L=3e4,R=12e4})))()}var B;function V(){return(V=e((()=>{ae(),le(),re(),k(),c(),ne(),p(),O(),F(),z(),B=class{constructor(e){this.context=e,this.inventory=null,this.rows=[],this.selectedId=null,this.query=``,this.sortMode=`online-first`,this.statusFilter=`all`,this.showStats=!0,this.showDetails=!1,this.error=null,this.sampledAtMs=null,this.desktopSetupError=null,this.backups=null,this.backupsError=null,this.storageProbes=new Map,this.storageProbeRequests=new Map,this.telemetry=new Map,this.listeners=new Set,this.subscriptions=[],this.presented=!1,this.scope=v(e.gateway),this.lifecycle=te(e.gateway.snapshot)}get current(){return this.scope===v(this.context.gateway)}get connected(){return this.current&&this.context.gateway.snapshot.phase===`connected`}get needsInventoryRefresh(){return this.inventory===null||this.refreshQueued!==void 0}get loading(){return this.request!==void 0}get backupsLoading(){return this.backupsRequest!==void 0}get desktopAvailable(){return this.current&&oe(this.context.gateway.snapshot)}get selected(){return this.current?this.rows.find(e=>e.environment.id===this.selectedId):void 0}get hostDesktopEnabled(){let e=l(this.context.runtimeConfig.state.configSnapshot)?.desktop;return E(e)&&E(e.host)&&e.host.enabled===!0}get desktopSetupBusy(){return this.desktopSetupRequest!==void 0}storageProbeBusy(e){return this.storageProbeRequests.has(e)}cancelBackups(){this.backupsRequest?.abort(),this.backupsRequest=void 0;for(let e of this.storageProbeRequests.values())e.abort();this.storageProbeRequests.clear()}clearBackups(e=null){this.cancelBackups(),this.backups=null,this.backupsError=e,this.storageProbes.clear()}refreshBackups(){return this.readBackupState()}probeStorage(e){return this.readBackupState(e)}async readBackupState(e){let t=this.lifecycle.capture();if(!this.presented||!this.current||!t||(e===void 0?this.backupsRequest:this.storageProbeBusy(e))||e===void 0&&document.visibilityState===`hidden`||!g(this.context.gateway.snapshot.hello?.auth??null))return;let n=new AbortController;e===void 0?(this.backupsRequest=n,this.backupsError=null):(this.storageProbeRequests.set(e,n),this.storageProbes.delete(e));let r=()=>this.presented&&this.current&&(e===void 0?this.backupsRequest===n:this.storageProbeRequests.get(e)===n)&&this.lifecycle.isCurrent(t)&&g(this.context.gateway.snapshot.hello?.auth??null);this.notify();try{if(e===void 0){let e=await t.client.request(`backup.status`,{},{signal:n.signal});r()&&(this.backups=e)}else{let i=await t.client.request(`storage.locations.probe`,{name:e},{signal:n.signal});r()&&this.storageProbes.set(e,i)}}catch(t){if(r()){let n=m(t);e===void 0?this.backupsError=n:this.storageProbes.set(e,{state:`error`,message:n})}}finally{r()&&(e===void 0?this.backupsRequest=void 0:this.storageProbeRequests.delete(e),this.notify())}}resetDesktopSetup(){this.desktopSetupRequest=void 0,this.desktopSetupError=null}get canEnableHostDesktop(){let e=this.selected?.environment.desktopSetup;return this.presented&&this.connected&&this.selectedId===`gateway`&&(e?.state===`ready`||e?.state===`managed`)&&!this.hostDesktopEnabled&&this.context.runtimeConfig.canPatch===!0}async enableHostDesktop(){let e=this.lifecycle.capture(),t=this.context.runtimeConfig;if(!e||!this.canEnableHostDesktop||this.desktopSetupBusy)return;let n=Symbol(`desktop-setup`),r=()=>this.desktopSetupRequest===n&&this.presented&&this.current&&this.lifecycle.isCurrent(e)&&this.context.runtimeConfig===t;this.desktopSetupRequest=n,this.desktopSetupError=null,this.notify();try{let e=await Te(t,`systems: enable host desktop`,()=>r()&&this.canEnableHostDesktop);r()&&e===null?await this.refresh():r()&&e!==void 0&&(this.desktopSetupError=e)}catch(e){r()&&(this.desktopSetupError=m(e))}finally{r()&&(this.desktopSetupRequest=void 0,this.notify())}}telemetryHistory(e){return this.current?this.telemetry.get(e)??[]:[]}subscribe(e){return ge(this.listeners,e)}notify(){for(let e of this.listeners)e()}projectRows(){this.rows=this.inventory&&this.current?Ae(this.inventory,this.context.sessions.state.result?.sessions??[]):[]}recordTelemetry(e){let t=new Set(this.rows.map(e=>e.environment.id));for(let e of this.telemetry.keys())t.has(e)||this.telemetry.delete(e);for(let t of this.rows){let n=t.environment.id,r=I(t);if(!r){this.telemetry.delete(n);continue}let i=n===`gateway`;if(i&&!e)continue;let a=t.node?.hostStats?.updatedAtMs??this.sampledAtMs;if(a===null)continue;let o=this.telemetry.get(n)??[],s=o.at(-1);if(s&&a<=s.at)continue;let c=i?L:R,l=s&&a-s.at<=c?o:[];this.telemetry.set(n,[...l.slice(-119),{at:a,stats:r}])}}select(e){this.current&&e.trim()&&(this.telemetryRequest?.abort(),this.telemetryRequest=void 0,e!==this.selectedId&&this.resetDesktopSetup(),this.selectedId=e,this.notify())}updatePresentation(e){Object.assign(this,e),this.notify()}setPresented(e){if(this.presented!==e){if(this.presented=e,!e){for(let e of this.subscriptions)e();this.subscriptions=[],this.cancelRefresh(),this.cancelBackups(),this.resetDesktopSetup();return}this.subscriptions=[this.context.gateway.subscribe(e=>{let t=this.lifecycle.transition(e);this.current?t&&(this.cancelRefresh(),this.clearBackups(),this.resetDesktopSetup(),this.telemetry.clear(),e.phase===`connected`&&this.refresh()):this.clear(),g(e.hello?.auth??null)||this.clearBackups(h(`systems.backups.readAccessRequired`)),this.notify()}),this.context.gateway.subscribeEvents(e=>{e.event===`config.changed`&&(this.cancelBackups(),this.storageProbes.clear()),e.event===`presence`||e.event===`node.pair.resolved`||e.event===`node.runnerInventory.changed`||e.event===`config.changed`?this.refresh():e.event===`node.hostStats`&&E(e.payload)&&typeof e.payload.nodeId==`string`&&this.selectedId===`node:${e.payload.nodeId}`&&this.refreshTelemetry()}),this.context.sessions.subscribe(()=>{this.projectRows(),this.notify()}),this.context.runtimeConfig.subscribe(()=>this.notify())],this.lifecycle.transition(this.context.gateway.snapshot)&&this.telemetry.clear(),this.current?this.refresh():this.clear()}}cancelRefresh(){this.request?.abort(),this.telemetryRequest?.abort(),this.request=void 0,this.telemetryRequest=void 0,this.refreshQueued=void 0}clear(){this.cancelRefresh(),this.clearBackups(),this.inventory=null,this.rows=[],this.selectedId=null,this.error=null,this.sampledAtMs=null,this.telemetry.clear(),this.resetDesktopSetup(),this.query=``}async refresh(e=`automatic`){let t=this.context.gateway.snapshot;this.lifecycle.transition(t)&&this.telemetry.clear();let n=this.lifecycle.capture();if(!this.presented||!this.current||!n||!g(t.hello?.auth??null))return;let r=this.refreshQueued===`manual`?`manual`:e;if(this.loading||document.visibilityState===`hidden`){this.refreshQueued=r;return}this.cancelRefresh();let i=new AbortController;this.request=i;let a=()=>this.presented&&this.current&&this.request===i&&this.lifecycle.isCurrent(n);this.error=null,this.refreshBackups(),this.notify();try{let e=await ke(this.context.gateway,{signal:i.signal,isCurrent:a,fresh:r===`manual`});if(!e&&a()&&(this.refreshQueued=this.refreshQueued===`manual`?`manual`:r),!e||!a())return;let t=this.inventory===null;if(this.inventory=e,this.projectRows(),this.sampledAtMs=e.gatewaySampledAtMs,this.recordTelemetry(!0),t&&this.selectedId===null){let e=this.context.gateway.snapshot.sessionKey;this.selectedId=this.rows.find(t=>t.sessions.some(t=>t.session.key===e))?.environment.id??this.rows.find(e=>e.environment.id===`gateway`)?.environment.id??this.rows[0]?.environment.id??null}}catch(e){a()&&(this.error=m(e))}finally{a()&&(this.request=void 0,this.notify(),this.refreshQueued&&this.refresh())}}async refreshTelemetry(){let e=this.selected,t=this.inventory,n=this.lifecycle.capture();if(!this.presented||!this.current||!n||!e||!t||this.loading||this.telemetryRequest)return;let r=e.environment.id===`gateway`;if(!r&&e.environment.type!==`node`)return;let i=new AbortController;this.telemetryRequest=i;let a=()=>this.presented&&this.current&&this.lifecycle.isCurrent(n)&&this.telemetryRequest===i;try{if(r){let e=await D(this.context.gateway,i.signal);if(!a()||!this.inventory)return;let{systemInfo:t,...n}=this.inventory.errors;this.inventory={...this.inventory,gatewaySystemInfo:e.value,gatewaySampledAtMs:e.at,errors:n},this.sampledAtMs=e.at}else{let e=await n.client.request(`node.list`,{},{signal:i.signal});if(!a()||!this.inventory)return;let{nodes:t,...r}=this.inventory.errors;this.inventory={...this.inventory,nodes:e.nodes,errors:r}}this.projectRows(),this.recordTelemetry(r)}catch(e){if(e instanceof DOMException&&e.name===`AbortError`)return;a()&&this.inventory&&(this.inventory={...this.inventory,errors:{...this.inventory.errors,[r?`systemInfo`:`nodes`]:m(e)}})}finally{a()&&(this.telemetryRequest=void 0,this.notify())}}}})))()}function H(e,t,n){return b`<wa-dropdown-item
    class="sidebar-session-sort-menu__item"
    value=${e}
    role="menuitemradio"
    aria-checked=${String(n)}
    ${fe(e=>ve(e,n))}
  >
    <span class="session-menu__text">${h(t)}</span>
    <span slot="details" class="session-menu__check" aria-hidden="true"
      >${n?_.check:y}</span
    >
  </wa-dropdown-item>`}function U(e){let t=e.gatewaySystemInfo?.machineName??e.environment.label??e.node?.displayName;if(t)return t;if(e.environment.id===`gateway`)return h(`systems.host`);let n=e.environment.worker;if(n){let t=e.sessions.find(e=>e.kind===`placement`)?.session;if(t)return t.displayName??t.label??t.key;if(n.profileId)return`${n.providerId} · ${n.profileId}`}return e.environment.id}function je(e){return e.slice(e.lastIndexOf(`:`)+1,e.lastIndexOf(`:`)+7)}function W(e){return e.environment.id===`gateway`?`host`:e.environment.type===`node`?`node`:`worker`}function G(e){return h(e.environment.status===`available`?`systems.online`:e.environment.status===`unavailable`?`systems.offline`:`systems.statuses.`+e.environment.status)}function K(e){let t=e.gatewaySystemInfo?.osLabel??e.environment.platform??e.node?.platform;return t?ye(t,e.node?.deviceFamily):void 0}var q,J,Y;function Me(){return(Me=e((()=>{x(),S(),ue(),ie(),_e(),c(),A(),Se(),s(),o(),j(),q=[{value:`name`,labelKey:`systems.alphabetical`},{value:`online-first`,labelKey:`systems.onlineFirst`},{value:`offline-first`,labelKey:`systems.offlineFirst`}],J=[{value:`all`,labelKey:`systems.all`},{value:`online`,labelKey:`systems.online`},{value:`offline`,labelKey:`systems.offline`}],Y=class extends f{constructor(){super(),new i(this).watchStore(()=>this.controller)}render(){let e=this.controller;if(!e?.current)return y;let t=e.query.trim().toLocaleLowerCase(),n=e.rows.filter(n=>(e.statusFilter===`all`||n.environment.status===(e.statusFilter===`online`?`available`:`unavailable`))&&[U(n),n.environment.id,K(n)??``,n.environment.platform??n.node?.platform??``].some(e=>e.toLocaleLowerCase().includes(t))).toSorted((t,n)=>{if(e.sortMode!==`name`){let r=e.sortMode===`online-first`?`available`:`unavailable`,i=Number(n.environment.status===r)-Number(t.environment.status===r);if(i)return i}return U(t).localeCompare(U(n),void 0,{numeric:!0,sensitivity:`base`})||t.environment.id.localeCompare(n.environment.id)}),r=t=>{let n=t.environment.status===`available`,r=K(t),i=G(t);return b`<button
        class="systems-machine"
        type="button"
        data-status=${t.environment.status}
        aria-pressed=${t.environment.id===e.selectedId}
        aria-description=${r?`${i} · ${r}`:i}
        @click=${()=>e.select(t.environment.id)}
      >
        <i class="systems-machine__dot" aria-hidden="true"></i>
        <span class="systems-machine__name">${U(t)}</span>
        <span class="systems-machine__meta"
          >${n?t.environment.worker?je(t.environment.id):r??y:i}</span
        >
        ${t.environment.desktop?b`<span class="systems-machine__desktop"
                >${_.monitor}<span class="sr-only">${h(`systems.desktop`)}</span></span
              >`:y}
      </button>`};return b`<section class="systems-sidebar" aria-label=${h(`systems.inventory`)}>
      <div class="systems-filter">
        <span aria-hidden="true">${_.search}</span>
        <input
          type="search"
          aria-label=${h(`systems.search`)}
          placeholder=${h(`systems.search`)}
          .value=${e.query}
          @input=${t=>{t.currentTarget instanceof HTMLInputElement&&e.updatePresentation({query:t.currentTarget.value})}}
        />
        <wa-dropdown
          class="systems-filter-menu sidebar-session-sort-menu"
          placement="bottom-end"
          aria-label=${h(`systems.filterSort`)}
          @wa-select=${t=>{let n=t.detail.item.value,r=q.find(e=>n===`sort:${e.value}`),i=J.find(e=>n===`status:${e.value}`);r?e.updatePresentation({sortMode:r.value}):i&&e.updatePresentation({statusFilter:i.value})}}
        >
          <button
            slot="trigger"
            type="button"
            class="systems-filter__sort sidebar-session-sort ${e.statusFilter===`all`?``:`sidebar-session-sort--filtered`}"
            aria-label=${h(`systems.filterSort`)}
            title=${h(`systems.filterSort`)}
          >
            ${_.listFilter}
          </button>
          <div class="sidebar-session-sort-menu__title">${h(`systems.sortBy`)}</div>
          ${q.map(t=>H(`sort:${t.value}`,t.labelKey,e.sortMode===t.value))}
          <div class="session-menu__separator" role="separator"></div>
          <div class="sidebar-session-sort-menu__title">${h(`systems.status`)}</div>
          ${J.map(t=>H(`status:${t.value}`,t.labelKey,e.statusFilter===t.value))}
        </wa-dropdown>
        <button
          type="button"
          class="systems-filter__refresh"
          aria-label=${h(`systems.refresh`)}
          title=${h(`systems.refresh`)}
          ?disabled=${e.loading||!e.connected}
          @click=${()=>void e.refresh(`manual`)}
        >
          ${_.refresh}
        </button>
      </div>
      <div class="systems-sidebar__list" aria-busy=${e.loading}>
        ${e.loading&&!e.inventory?b`<p class="systems-sidebar__empty" role="status">${h(`systems.loading`)}</p>`:y}
        ${n.filter(e=>W(e)===`host`).map(r)}
        ${[`node`,`worker`].map(e=>{let t=n.filter(t=>W(t)===e);return t.length?b`<section class="systems-group">
                <h3>
                  <span>${h(e===`node`?`systems.nodes`:`systems.workers`)}</span>
                  <span class="systems-group__count">${t.length}</span>
                </h3>
                ${t.map(r)}
              </section>`:y})}
        ${!e.loading&&n.length===0?b`<p class="systems-sidebar__empty">${h(t||e.statusFilter!==`all`?`systems.noMatches`:`systems.empty`)}</p>`:y}
      </div>
    </section>`}},T([C({attribute:!1})],Y.prototype,`controller`,void 0),customElements.get(`zero-systems-sidebar`)||customElements.define(`zero-systems-sidebar`,Y)})))()}function X(e){return w(e,{style:`legacy-binary`,separator:` `,maxUnit:`tera`,fractionDigits:(e,t)=>+(t===`tera`||e<10)})}function Z(e,t){let n=[];for(let{at:r,stats:i}of e){let e=t(i);e===void 0||!Number.isFinite(e)?n.length=0:n.push({at:r,value:e})}return n}function Ne(e,n){let r=I(e);if(!r)return b`<p class="systems-no-telemetry">${h(`systems.noTelemetry`)}</p>`;let i=e.node?.hostStats?.updatedAtMs??n.sampledAtMs,a=e.environment.id===`gateway`,o=!n.connected||e.environment.status!==`available`||!!n.inventory?.errors[a?`systemInfo`:`nodes`]||i!==null&&Date.now()-i>(a?3e4:12e4),s=n.telemetryHistory(e.environment.id),c=s.length?s:[{at:i??0,stats:r}],l=(e,t)=>b`
    <zero-sparkline
      class="gateway-vital systems-vital systems-vital--disk"
      title=${e??y}
      .label=${e?`${h(`systems.disk`)} ${e}`:h(`systems.disk`)}
      .sub=${t===void 0?``:`/ ${X(t)}`}
      .samples=${Z(c,t=>e===void 0?t.disks===void 0?t.diskAvailableBytes:void 0:t.disks?.find(t=>t.path===e)?.availableBytes)}
      .format=${X}
      .autorange=${!0}
    ></zero-sparkline>
  `;return pe(e.environment.id,b`<div class="systems-metrics" data-stale=${o}>
      <div
        class="systems-vitals ${r.disks&&r.disks.length!==1?`systems-vitals--volumes`:``}"
      >
        <zero-sparkline
          class="gateway-vital systems-vital systems-vital--load"
          .label=${h(`systems.load`)}
          .sub=${h(`systems.cpuCount`,{count:String(r.cpuCount)})}
          .samples=${Z(c,e=>e.loadAverage?.[0])}
          .format=${e=>e.toFixed(2)}
          .floorMax=${r.cpuCount}
        ></zero-sparkline>
        <zero-sparkline
          class="gateway-vital systems-vital systems-vital--memory"
          .label=${h(`systems.memory`)}
          .sub=${`/ ${X(r.memoryTotalBytes)}`}
          .samples=${Z(c,e=>e.memoryTotalBytes-e.memoryFreeBytes)}
          .format=${X}
          .floorMax=${r.memoryTotalBytes}
        ></zero-sparkline>
        ${r.disks===void 0?l(void 0,r.diskTotalBytes):me(r.disks,e=>e.path,e=>l(e.path,e.totalBytes))}
      </div>
      <div class="systems-metrics-caption">
        ${!o&&c.length<2?b`<span>${h(`systems.collectingHistory`)}</span>`:y}
        ${i===null?y:b`<span class="systems-sample-time">${h(o?`systems.lastKnown`:`systems.sampled`,{time:t(Math.max(0,Date.now()-i))})}</span>`}
      </div>
    </div>`)}function Pe(e,t,n=!0){return e?b`<zero-systems-page
        .routeData=${e}
        .presented=${n}
      ></zero-systems-page>`:y}function Fe(e){return e?b`<zero-systems-sidebar .controller=${e.controller}></zero-systems-sidebar>`:y}function Ie(e){return{controller:new B(e)}}var Q;function $(){return($=e((()=>{x(),S(),de(),he(),k(),ie(),Ee(),ce(),we(),c(),A(),u(),d(),s(),be(),o(),P(),V(),Me(),z(),j(),Q=class extends f{constructor(){super(),this.presented=!0,this.poll=new xe(this,15e3,()=>{let e=this.routeData?.controller;this.presented&&e&&(e.needsInventoryRefresh?e.refresh():(e.showStats||e.showDetails)&&e.refreshTelemetry(),(!e.selected||e.selectedId===`gateway`)&&!e.needsInventoryRefresh&&e.refreshBackups())},!0,`visible`),this.handleDesktopToggle=e=>{let t=this.routeData?.controller;if(!this.presented||!t?.current||!(e instanceof CustomEvent))return;let n=E(e.detail)?e.detail:{},r=typeof n.environmentId==`string`?n.environmentId:void 0;if(e.preventDefault(),e.stopImmediatePropagation(),n?.open===!1){this.querySelector(`zero-desktop-panel`)?.handleToggleRequest(e);return}if(r&&r!==t.selectedId){t.select(r),t.rows.some(e=>e.environment.id===r)||t.refresh();return}r&&this.querySelector(`zero-desktop-panel`)?.handleToggleRequest(e)},this.poll,new i(this).watchStore(()=>this.routeData?.controller)}connectedCallback(){super.connectedCallback(),window.addEventListener(se,this.handleDesktopToggle)}disconnectedCallback(){window.removeEventListener(se,this.handleDesktopToggle),this.activeController?.setPresented(!1),this.activeController=void 0,super.disconnectedCallback()}updated(e){(e.has(`routeData`)||e.has(`presented`))&&(this.activeController!==this.routeData?.controller&&this.activeController?.setPresented(!1),this.activeController=this.routeData?.controller,this.activeController?.setPresented(this.presented))}renderDetails(e,t){let r=t.environment;return b`<aside class="systems-details" aria-label=${h(`systems.details`)}>
      <header>
        <h2>${h(`systems.details`)}</h2>
        <button
          class="systems-icon-button"
          aria-label=${h(`systems.closeDetails`)}
          @click=${()=>e.updatePresentation({showDetails:!e.showDetails})}
        >
          ${_.x}
        </button>
      </header>
      <dl>
        <dt>${h(`systems.identifier`)}</dt>
        <dd>${r.id}</dd>
        <dt>${h(`systems.status`)}</dt>
        <dd>${e.connected?G(t):h(`systems.offline`)}</dd>
        <dt>${h(`systems.platform`)}</dt>
        <dd>${K(t)??h(`systems.unknown`)}</dd>
      </dl>
      <h3>${h(`systems.telemetry`)}</h3>
      ${Ne(t,e)}
      <h3>${h(`systems.relatedSessions`)}</h3>
      <p class="systems-detail-hint">${h(`systems.relatedHint`)}</p>
      ${t.sessions.length?t.sessions.map(t=>{let r=t.session,i=a(r),o=ee({context:e.context,face:i,sessionKey:r.key,preferenceDerivedFace:!0});return b`<a
                class="systems-session-link"
                href=${o.href}
                @click=${t=>{n(t)&&(t.preventDefault(),e.context.navigate(i,o.options))}}
                ><strong class="systems-session-link__title"
                  >${r.displayName??r.label??r.key}</strong
                ><span>${h(`systems.relations.`+t.kind)}</span></a
              >`}):b`<p class="systems-detail-hint">${h(`systems.noRelatedSessions`)}</p>`}
      ${r.worker?.attachedSessionIds.length?b`<h3>${h(`systems.attachedSessions`)}</h3>
              <p class="systems-detail-hint">${h(`systems.attachedHint`)}</p>
              <ul>
                ${r.worker.attachedSessionIds.map(e=>b`<li>${e}</li>`)}
              </ul>`:y}
      <h3>${h(`systems.capabilities`)}</h3>
      <div class="systems-capabilities">
        ${(r.capabilities??[]).map(e=>b`<span>${e}</span>`)}
      </div>
    </aside>`}renderHostDesktopSetup(e,t){let n=t.environment.desktopSetup,r=e.hostDesktopEnabled,i=K(t)?.startsWith(`macOS`)===!0,a=n?.state===`ready`||n?.state===`managed`,o=Ce(n?.state,i,r);return b`<div class="systems-state" role="status">
      <span class="systems-state__icon" aria-hidden="true">${_.monitor}</span>
      <h2>${h(o.title)}</h2>
      <p>${h(o.hint)}</p>
      ${n?.state===`unsupported`&&n.detail?b`<p>${n.detail}</p>`:y}
      ${e.desktopSetupError?b`<p class="systems-callout--error" role="alert">${e.desktopSetupError}</p>`:y}
      ${!r&&a?b`
              <button
                class="btn primary systems-text-button"
                ?disabled=${!e.canEnableHostDesktop||e.desktopSetupBusy}
                @click=${()=>void e.enableHostDesktop()}
              >
                ${h(e.desktopSetupBusy?`systems.desktopSetupEnabling`:`systems.enableDesktopAccess`)}
              </button>
              <p>
                ${h(e.context.runtimeConfig.canPatch===!0?`systems.desktopSetupApplyHint`:`systems.desktopSetupAdminHint`)}
              </p>
            `:y}
      ${!r&&!a?b`<button class="systems-text-button" ?disabled=${e.loading||!e.connected} @click=${()=>void e.refresh(`manual`)}>${h(`systems.desktopSetupCheckAgain`)}</button>`:y}
    </div>`}render(){let e=this.routeData?.controller;if(!e?.current)return b`<p class="systems-state" role="status">${h(`systems.loading`)}</p>`;let t=e.selected,n=!!(t?.environment.desktop&&t.environment.status===`available`&&e.desktopAvailable&&this.presented),r=t?U(t):h(`systems.title`),i=Object.values(e.inventory?.errors??{}),a=e.connected?e.loading&&!e.inventory?h(`systems.loading`):e.selectedId&&!t?h(`systems.missingTitle`):t?t.environment.status===`available`?t.environment.desktop?h(`systems.accessTitle`):h(`systems.noDesktopTitle`):t.environment.status===`unavailable`?h(`systems.offlineTitle`):G(t):h(`systems.select`):h(`systems.offlineGateway`),o=e.selectedId&&!t?h(`systems.missingHint`):t?t.environment.status===`available`?t.environment.desktop?h(`systems.accessHint`):h(t.environment.id===`gateway`?`systems.noHostDesktopHint`:`systems.noDesktopHint`):h(`systems.offlineHint`):h(`systems.selectHint`);return b`<section class="systems-workspace" aria-label=${h(`systems.title`)}>
      <header class="systems-toolbar">
        <div class="systems-heading">
          <h1>${r}</h1>
          <span>${h(t?`systems.`+W(t):`systems.selectHint`)}</span>
        </div>
        <select
          class="systems-mobile-picker"
          aria-label=${h(`systems.select`)}
          @change=${t=>{t.currentTarget instanceof HTMLSelectElement&&e.select(t.currentTarget.value)}}
        >
          <option value="" disabled .selected=${!t}>${h(`systems.select`)}</option>
          ${e.rows.map(t=>b`<option value=${t.environment.id} .selected=${t.environment.id===e.selectedId}>${U(t)}</option>`)}
        </select>
        <button
          class="systems-icon-button"
          title=${h(e.showStats?`systems.hideStats`:`systems.stats`)}
          aria-label=${h(e.showStats?`systems.hideStats`:`systems.stats`)}
          aria-pressed=${e.showStats}
          @click=${()=>e.updatePresentation({showStats:!e.showStats})}
        >
          ${_.activity}
        </button>
        <button
          class="systems-icon-button"
          title=${h(`systems.details`)}
          aria-label=${h(`systems.details`)}
          aria-pressed=${e.showDetails}
          ?disabled=${!t}
          @click=${()=>e.updatePresentation({showDetails:!e.showDetails})}
        >
          ${_.panelRightOpen}
        </button>
      </header>
      ${e.error?b`<div class="systems-callout systems-callout--error" role="alert">${e.error}<button @click=${()=>void e.refresh(`manual`)} ?disabled=${e.loading}>${h(`common.retry`)}</button></div>`:y}
      ${e.connected?y:b`<div class="systems-callout" role="status">${h(`systems.offlineGateway`)}</div>`}
      ${i.length?b`<details class="systems-callout">
              <summary>${h(`systems.errors`)}</summary>
              ${i.map(e=>b`<p>${e}</p>`)}
            </details>`:y}
      ${e.showStats&&t?Ne(t,e):y}
      ${!t||t.environment.id===`gateway`?Oe(e):y}
      <div class="systems-body">
        <div class="systems-desktop">
          ${n&&t?b`<zero-desktop-panel
                  embedded
                  data-chat-autotype-exempt
                  .client=${e.context.gateway.snapshot.client}
                  .available=${e.desktopAvailable}
                  .presented=${this.presented}
                  .workspaceControls=${!0}
                  .suppliedEnvironments=${e.inventory?.environments??[]}
                  .requestedSource=${t.environment.id}
                  .basePath=${e.context.basePath}
                ></zero-desktop-panel>`:t?.environment.id===`gateway`&&e.connected&&t.environment.status===`available`&&(t.environment.desktopSetup||t.environment.desktop&&e.hostDesktopEnabled&&e.context.runtimeConfig.canPatch===!0)?this.renderHostDesktopSetup(e,t):b`<div class="systems-state" role="status">
                    <span class="systems-state__icon" aria-hidden="true">${_.monitor}</span>
                    <h2>${a}</h2>
                    <p>${o}</p>
                    ${t?b`<button class="systems-text-button" @click=${()=>e.updatePresentation({showDetails:!e.showDetails})}>${h(`systems.details`)}</button>`:y}
                  </div>`}
        </div>
        ${e.showDetails&&t?this.renderDetails(e,t):y}
      </div>
    </section>`}},T([C({attribute:!1})],Q.prototype,`routeData`,void 0),T([C({type:Boolean})],Q.prototype,`presented`,void 0),customElements.get(`zero-systems-page`)||customElements.define(`zero-systems-page`,Q)})))()}$();export{Ie as load,Pe as render,Fe as renderSidebar};
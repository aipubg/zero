import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{E as t,Ic as n,Lc as r,Nu as i,Pu as a,T as o,W as s,ju as c,w as l,z as ee,zu as u}from"./control-ui-core-DCNBgr3X.js";import{G as d,J as f,W as p,Z as m,at as h,n as g,rt as _,t as v}from"./lit-runtime-B40xFCK_.js";import{Lt as y,zt as b}from"./control-ui-boot-shared-BX8huZUb.js";import{Ai as x,Bi as te,Zr as S,ci as C}from"./ui-AaV6iNVa.js";import{Ml as w,Nl as T,cl as E,fa as D,ha as O,ma as k,pa as A,sl as j}from"./control-ui-boot-shared-CzJHozXQ.js";import{a as M,i as N,n as P,r as F,t as I}from"./gateway-vitals-BufdkdND.js";import{i as L,n as R,t as z}from"./lane-table-CRBXtqX0.js";function B(e){return{...e,render:(t,n)=>e.render(t,n)}}function V(e){return u(`debug.overlay.pingMs`,{value:String(Math.round(e))})}function H(e,t){return f`<div class="debug-overlay__widget">
    ${F(e,t)} ${N(e,t)}
    <zero-sparkline
      class="gateway-vital gateway-vital--ping"
      data-degraded=${e.pingMs>Y?``:d}
      title=${u(`debug.overlay.pingDescription`)}
      .label=${u(`debug.overlay.ping`)}
      .samples=${I(t,e=>e.pingMs)}
      .format=${V}
      .floorMax=${20}
    ></zero-sparkline>
  </div>`}function U(e){return f`
    <div class="debug-overlay__table-wrap">
      <table class="data-table command-lanes-table command-lanes-table--compact">
        <thead>
          <tr>
            <th>${u(`debug.lanes.lane`)}</th>
            <th>${u(`debug.lanes.active`)}</th>
            <th>${u(`debug.lanes.queued`)}</th>
            <th>${u(`debug.lanes.blocked`)}</th>
          </tr>
        </thead>
        <tbody>
          ${R(e,{compact:!0})}
        </tbody>
      </table>
    </div>
  `}function W(e){return u(`debug.overlay.freeShort`,{value:G(e)})}function G(e){return x(e,{style:`legacy-binary`,maxUnit:`tera`,separator:` `,fractionDigits:(e,t)=>t===`byte`?null:+(e<10)})}function K(e,t){return f`
    ${M(e,t)}
    ${e.disks?.length?f`<div class="gateway-vitals debug-overlay__disks">
            ${g(e.disks??[],e=>e.path,e=>f`<zero-sparkline
                class="gateway-vital gateway-vital--disk"
                title=${e.path}
                .label=${`${u(`debug.overlay.disk`)} ${e.path}`}
                .sub=${u(`debug.overlay.totalShort`,{value:G(e.totalBytes)})}
                .samples=${I(t,t=>t.disks?.find(t=>t.path===e.path)?.availableBytes)}
                .format=${W}
                autorange
              ></zero-sparkline>`)}
          </div>`:d}
    ${typeof e.uptimeMs==`number`?f`<div class="debug-overlay__vitals-footer mono">
            ${u(`debug.overlay.uptime`)} ${y(e.uptimeMs)}
          </div>`:d}
  `}function q({sessions:e,totalCount:t,hasMore:n}){return f`
    <div class="debug-overlay__count">
      ${u(`debug.overlay.activeRunsCount`,{count:String(t??e.length)})}
    </div>
    ${n?f`<div class="debug-overlay__count">${u(`activityFeed.showing`,{shown:String(e.length),total:String(t??e.length)})}</div>`:d}
    ${e.length>0?f`<ul class="debug-overlay__list">
            ${e.map(e=>{let t=e.sessionId??e.key;return f`<li class="mono" title=${t}>${te(t,32)}</li>`})}
          </ul>`:f`<div class="debug-overlay__empty">${u(`debug.overlay.noActiveRuns`)}</div>`}
  `}function J(e){let t=e.eventLog.slice(0,8);return t.length>0?f`<ul class="debug-overlay__list debug-overlay__events">
        ${t.map(e=>f`<li>
            <span class="mono">${e.event}</span>
            <time>${ee(e.ts)}</time>
          </li>`)}
      </ul>`:f`<div class="debug-overlay__empty">${u(`debug.noEvents`)}</div>`}var Y,X;function Z(){return(Z=e((()=>{C(),p(),v(),P(),a(),b(),s(),k(),o(),z(),Y=250,X=[B({...l.lanes,load:(e,t)=>L(e.client,t),render:U}),B({...l.status,load:async(e,t)=>{let n=await O(e.gateway,t);return{...n.value,pingMs:n.roundTripMs,sampledAt:n.at}},render:K}),B({...l[`active-runs`],load:(e,t)=>e.client.request(`sessions.list`,{activeOnly:!0,archived:`all`,includeGlobal:!0,includeUnknown:!0},{signal:t}),render:q}),B({...l.events,load:async e=>e.gateway,render:J})]})))()}var Q;function $(){return($=e((()=>{p(),m(),a(),k(),T(),i(),E(),r(),o(),Z(),Q=class extends c{constructor(...e){super(...e),this.minimized=!1,this.sections=new Map,this.requestControllers=new Map,this.requestGeneration=0,this.statusHistory=[],this.polling=new j(this,D,()=>void this.refreshSections(),!1,`visible`),this.gateway=new w(this,{getGateway:()=>this.context?.gateway,invalidateRequests:()=>this.resetSections(),ensureInitialData:()=>void this.refreshSections(),onSnapshot:()=>this.syncPolling(),onPageActivation:()=>this.syncPolling()}),this.subscriptions=new n(this).watch(()=>!this.minimized&&document.visibilityState!==`hidden`?this.context?.gateway:void 0,(e,t)=>e.subscribeEventLog(t))}connectedCallback(){super.connectedCallback(),this.syncPolling()}disconnectedCallback(){this.polling.stop(),this.subscriptions.clear(),this.resetSections(),super.disconnectedCallback()}updated(e){e.has(`minimized`)&&this.syncPolling()}resetSections(){this.requestGeneration+=1;for(let e of this.requestControllers.values())e.abort();this.requestControllers.clear(),this.statusHistory=[],this.sections=new Map(X.map(e=>[e.id,{status:this.gateway.connected?`loading`:`unavailable`}]))}syncPolling(){let e=A(this.gateway.snapshot);e||(this.requestControllers.get(`status`)?.abort(),this.statusHistory=[],this.updateSection(this.requestGeneration,`status`,{status:`unavailable`})),document.visibilityState===`hidden`||this.minimized&&!e?this.polling.stop():this.polling.start()&&this.refreshSections(),this.requestUpdate()}async refreshSections(){let e=this.gateway.gateway,t=this.gateway.connected?this.gateway.client:null;if(!this.isConnected||document.visibilityState===`hidden`)return;if(!e||!t){this.sections=new Map(X.map(e=>[e.id,{status:`unavailable`}]));return}let n=this.requestGeneration,r=(this.minimized?X.filter(e=>e.id===`status`):X).map(async r=>{if(this.requestControllers.has(r.id)||r.id===`status`&&!A(e.snapshot))return;let i=new AbortController;this.requestControllers.set(r.id,i);try{let a=await r.load({client:t,gateway:e},i.signal);this.updateSection(n,r.id,{status:`ready`,value:a})}catch{this.updateSection(n,r.id,{status:`unavailable`})}finally{this.requestControllers.get(r.id)===i&&this.requestControllers.delete(r.id)}});await Promise.allSettled(r)}updateSection(e,t,n){if(this.isConnected&&e===this.requestGeneration){if(t===`status`&&n.status===`ready`){this.polling.stop(),this.polling.start();let e=n.value;this.statusHistory.at(-1)?.at!==e.sampledAt&&(this.statusHistory=[...this.statusHistory.slice(-89),{at:e.sampledAt,status:e}])}this.sections=new Map(this.sections).set(t,n)}}renderSection(e){let n=this.sections.get(e.id)??{status:`loading`};return f`
      <section class="debug-overlay__section" aria-busy=${n.status===`loading`}>
        <h3>${u(e.titleKey)}</h3>
        ${n.status===`loading`?t(e.id):n.status===`unavailable`?f`<div class="debug-overlay__empty">${u(`debug.overlay.unavailable`)}</div>`:e.render(n.value,this.statusHistory)}
      </section>
    `}render(){if(this.minimized){let e=this.sections.get(`status`)??{status:`loading`};if(e.status!==`ready`)return f`<div class="debug-overlay__compact-loading" role="status">
          ${u(e.status===`loading`?`common.loading`:`debug.overlay.unavailable`)}
        </div>`;let t=e.value;return H(t,this.statusHistory)}return f`${X.map(e=>this.renderSection(e))}`}},S([h({attribute:!1})],Q.prototype,`context`,void 0),S([h({type:Boolean})],Q.prototype,`minimized`,void 0),S([_()],Q.prototype,`sections`,void 0),customElements.get(`zero-debug-overlay-content`)||customElements.define(`zero-debug-overlay-content`,Q)})))()}$();
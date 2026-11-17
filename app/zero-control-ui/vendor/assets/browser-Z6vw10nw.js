import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Ic as t,Lc as n,Nu as r,Pu as i,ju as a,xu as o,yu as s,zu as c}from"./control-ui-core-DCNBgr3X.js";import{Ai as l,Zt as u,at as d,en as f,ki as p,ot as m,st as h}from"./control-ui-core-DwX5Mpz4.js";import{G as g,J as _,W as v,Z as y,at as b,rt as x}from"./lit-runtime-B40xFCK_.js";import{Ur as S,Wr as C,Zr as w,ya as T}from"./ui-AaV6iNVa.js";import{$ as E,et as D}from"./control-ui-boot-chat-D02HpoEK.js";import{Ut as O,a as k,c as A,jt as j}from"./control-ui-boot-chat-zkzP5WWm.js";import{n as M}from"./browser-panel-Ds4TuZgB.js";var N;function P(){return(P=e((()=>{C(),v(),y(),l(),u(),d(),k(),j(),M(),i(),E(),r(),n(),o(),D(),N=class extends a{constructor(){super(),this.session={sessionKey:``},this.active=!0,this.pending=!1,this.generation=0,this.refreshNeeded=!1,new t(this).watch(()=>this.context?.gateway,(e,t)=>{let n=e.subscribe(t),r=e.subscribeEvents(e=>{let t=T(e.payload);e.event===`plugin.browser.dashboard_changed`&&t?.instanceId===this.widget?.instanceId&&t?.name===this.widget?.name&&(this.refreshNeeded=!0,this.active&&this.request(`inspect`))});return()=>{n(),r()}})}willUpdate(){let e=this.context?.gateway.snapshot.client??null,t=JSON.stringify([this.session,this.widget?.instanceId,this.widget?.name,this.widget?.props,this.context?.gateway.snapshot.hello?.auth]);(this.scope?.key!==t||this.scope.client!==e)&&(this.scope={key:t,client:e},this.generation+=1,this.dashboard=void 0,this.error=void 0,this.pending=!1,this.refreshNeeded=!1),this.active&&this.available&&!this.pending&&!this.error&&(this.refreshNeeded?this.request(`inspect`):(!this.dashboard||!this.dashboard.paused&&!this.dashboard.browserTab)&&this.request(`open`))}disconnectedCallback(){this.generation+=1,this.scope=void 0,super.disconnectedCallback()}get available(){return!!(this.context&&m(this.context.gateway.snapshot))}get sessionScoped(){return!(!this.context||h(this.context.gateway.snapshot))}async request(e){let t=this.context?.gateway.snapshot.client,n=this.widget?.instanceId;if(!t||!this.available||!this.widget||this.pending)return;if(!n){this.error=Error(c(`browser.dashboardMissingIdentity`));return}let r=++this.generation;e===`inspect`&&(this.refreshNeeded=!1),this.pending=!0,this.error=void 0;try{let i=await O(t,{...this.session,name:this.widget.name,instanceId:n,...this.sessionScoped?{sessionScoped:!0}:{}},e);this.isConnected&&r===this.generation&&t===this.scope?.client&&(this.dashboard=i)}catch(e){this.isConnected&&r===this.generation&&(this.error=e)}finally{this.isConnected&&r===this.generation&&(this.pending=!1,this.refreshNeeded&&this.active&&this.request(`inspect`))}}render(){let e=this.context?.gateway,t=this.dashboard;return!this.active&&!t?g:!e||!this.available?_`<p class="board-browser__notice">${c(`browser.dashboardUnavailable`)}</p>`:_`<div class="board-browser" data-chat-autotype-exempt>
      <div class="board-browser__content">
        ${t?.browserTab&&!t.paused?_`<zero-browser-panel
                embedded
                .client=${e.snapshot.client}
                .available=${this.available}
                .remoteAvailable=${this.available}
                .presented=${this.active}
                .sessionKey=${t.sessionKey}
                .fixedTab=${t.browserTab}
                .dashboardTarget=${{...this.session,name:t.name,instanceId:t.instanceId,...this.sessionScoped?{sessionScoped:!0}:{}}}
                .resourceBasePath=${this.context?.resourceBasePath??``}
                .authToken=${f({hello:e.snapshot.hello,password:e.connection.password,settings:{token:e.connection.token}})}
              ></zero-browser-panel>`:this.error?A(this.error,()=>void this.request(`open`)):_` <p class="board-browser__notice" role="status">
                  ${c(t?.stopping?`browser.dashboardStopping`:t?.paused?`browser.dashboardStopped`:`browser.loading`)}
                </p>`}
      </div>
      <div class="board-browser__footer">
        <span
          >${c(this.sessionScoped?`browser.dashboardSessionShared`:`browser.dashboardShared`)}</span
        >
        <div>
          <button
            type="button"
            class="btn btn--small"
            ?disabled=${this.pending}
            @click=${()=>void this.request(t?.stopping?`stop`:t?.paused?`resume`:`open`)}
          >
            ${c(t?.stopping?`browser.dashboardRetryStop`:t?.paused?`browser.dashboardResume`:`browser.dashboardReconnect`)}
          </button>
          ${t?.browserTab&&!t.paused?_`<button
                  type="button"
                  class="btn btn--small"
                  ?disabled=${this.pending}
                  @click=${()=>void this.request(`stop`)}
                >
                  ${c(`browser.dashboardStop`)}
                </button>`:g}
        </div>
      </div>
      ${this.error&&t?.browserTab?_`<p role="alert" class="board-browser__error">${s(this.error)}</p>`:g}
    </div>`}},w([S({context:p,subscribe:!0})],N.prototype,`context`,void 0),w([b({attribute:!1})],N.prototype,`widget`,void 0),w([b({attribute:!1})],N.prototype,`session`,void 0),w([b({type:Boolean})],N.prototype,`active`,void 0),w([x()],N.prototype,`dashboard`,void 0),w([x()],N.prototype,`error`,void 0),w([x()],N.prototype,`pending`,void 0),customElements.get(`zero-browser-dashboard-widget`)||customElements.define(`zero-browser-dashboard-widget`,N)})))()}P();
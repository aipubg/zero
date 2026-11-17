import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Nu as t,Pu as n,ju as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{Ai as a,ca as o,ki as s,sa as c}from"./control-ui-core-DwX5Mpz4.js";import{G as l,J as u,W as d,Z as f,_ as p,at as m,n as h,t as g,y as _}from"./lit-runtime-B40xFCK_.js";import{Ur as v,Wr as y,Zr as b}from"./ui-AaV6iNVa.js";var x;function S(){return(S=e((()=>{y(),d(),f(),p(),g(),a(),o(),n(),t(),x=class extends r{constructor(...e){super(...e),this.sessionKey=``,this.agentId=`main`,this.presented=!0,this.data=null,this.dataContext=null}disconnectedCallback(){this.data?.dispose(),this.data=null,super.disconnectedCallback()}willUpdate(e){let t=this.dataContext!==this.context,n=e.has(`sessionKey`)||e.has(`agentId`);(t||n)&&this.clearSelection(),t&&(this.data?.dispose(),this.data=null,this.dataContext=this.context);let r=this.context&&!this.data;r&&(this.data=new this.dataType(this.context,()=>this.requestUpdate())),(r||n||e.has(`presented`))&&this.data?.sync({sessionKey:this.sessionKey,agentId:this.agentId,presented:this.presented})}async refresh(){await this.data?.refresh()}renderGroups(e,t,n,r,a,o){let s=`chat-${e}`,d=e=>h(e,r,a);return u`
      <section class="${s}__running">
        <h3 class=${_(e===`subagents`?`${s}__section-title`:void 0)}>
          ${i(`chat.${e}Panel.running`,{count:String(t.length)})}
        </h3>
        <div role="list">${d(t)}</div>
        ${t.length?l:u`<div class="${s}__empty">${i(`chat.${e}Panel.noRunning`)}</div>`}
      </section>
      <section class="${s}__finished">
        <button
          class="${s}__finished-toggle"
          type="button"
          aria-expanded=${this.finishedOpen}
          aria-controls=${_(o)}
          @click=${()=>{this.finishedOpen=!this.finishedOpen}}
        >
          <span>${i(`chat.${e}Panel.finished`,{count:String(n.length)})}</span>
          ${this.finishedOpen?c.chevronDown:c.chevronRight}
        </button>
        <div id=${_(o)} role="list" ?hidden=${!this.finishedOpen}>
          ${this.finishedOpen?d(n):l}
        </div>
      </section>
    `}},b([v({context:s,subscribe:!0})],x.prototype,`context`,void 0),b([m({attribute:!1})],x.prototype,`sessionKey`,void 0),b([m({attribute:!1})],x.prototype,`agentId`,void 0),b([m({type:Boolean})],x.prototype,`presented`,void 0)})))()}function C(){return(C=e((()=>{})))()}export{x as n,S as r,C as t};
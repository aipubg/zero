import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Hs as t,Nu as n,Pu as r,W as i,Wc as a,Xc as o,Yc as s,ju as c,lc as l,xu as ee,yu as u,z as d,zu as f}from"./control-ui-core-DCNBgr3X.js";import{Aa as p,Ai as m,Ba as h,Tr as g,ki as _,wr as v,za as y}from"./control-ui-core-DwX5Mpz4.js";import{G as b,J as x,W as te,Z as S,rt as C}from"./lit-runtime-B40xFCK_.js";import{Ki as w,Ui as T,Ur as E,Wr as D,Zr as O}from"./ui-AaV6iNVa.js";import{F as k,M as A,N as j,j as M}from"./control-ui-boot-shared-E4pYPcWx.js";import{B as N,G as P,I as F,R as I,Y as L,Z as R,l as z,na as B,q as V,ta as H,u as U}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ml as W,Nl as G}from"./control-ui-boot-shared-CzJHozXQ.js";import{H as K}from"./control-ui-boot-new-5_2Ky4dv.js";import{n as q,t as J}from"./sessions-hub-header-Demx7KXQ.js";async function Y(e,t){if(!t())return;let n=await e.request(`worktrees.gc`,{}),r=n.jobId;for(;n.state===`queued`||n.state===`running`;){if(!t())return;if(!r)throw Error(f(`sessionsView.deletePreservedReasons.cleanup-failed`));if(await w(1e3),!t())return;n=await e.request(`worktrees.gc`,{jobId:r})}if(t()){if(n.state===`failed`||n.outcome===`partial`)throw Error(n.error||n.issues?.map(e=>e.reason).join(`; `)||f(`sessionsView.deletePreservedReasons.cleanup-failed`));return n}}function X(){return(X=e((()=>{T(),r()})))()}var Z,Q;function $(){return($=e((()=>{D(),M(),te(),S(),p(),m(),v(),H(),J(),F(),z(),r(),ee(),i(),a(),X(),G(),n(),Z=`http://127.0.0.1:18789/concepts/managed-worktrees`,Q=class extends c{constructor(...e){super(...e),this.records=[],this.error=null,this.operation=null,this.createOpen=!1,this.createRepoRoot=``,this.createName=``,this.createBaseRef=``,this.createBranches=[],this.listClient=null,this.gateway=new W(this,{getGateway:()=>this.context?.gateway,onIdentityChange:()=>{this.records=[],this.error=null},invalidateRequests:e=>{(e.snapshot.phase!==`connected`||!e.snapshot.client)&&(this.listClient=null,this.listTask.run([null])),this.branchesTask.run([null,``]),this.operation=null},ensureInitialData:()=>void this.load(),onSnapshot:e=>{g(e.snapshot).canAdmin||(this.createOpen=!1)}}),this.listTask=new A(this,{autoRun:!1,task:([e],{signal:t})=>e?e.request(`worktrees.list`,{},{signal:t}):j,onComplete:e=>{this.records=e.worktrees.toSorted((e,t)=>t.lastActiveAt-e.lastActiveAt)},onError:e=>{this.error=u(e)}}),this.branchesTask=new A(this,{autoRun:!1,task:([e,t],{signal:n})=>e&&t?e.request(`worktrees.branches`,{repoRoot:t},{signal:n}):j,onComplete:e=>{this.createBranches=e.branches.map(e=>e.name)},onError:()=>{this.createBranches=[]}})}disconnectedCallback(){this.listClient=null,this.listTask.run([null]),this.branchesTask.run([null,``]),super.disconnectedCallback()}get operationPending(){return this.loading||this.operation!==null}get loading(){return this.operation===`gc`||this.listTask.status===k.PENDING}get operatorAccess(){return g(this.context.gateway.snapshot)}async load(e={}){let t=this.gateway.client;t&&this.gateway.connected&&this.operation===null&&(this.listTask.status!==k.PENDING||this.listClient!==t)&&(this.listClient=t,e.preserveError||(this.error=null),await this.listTask.run([t]))}async runOperation(e,t){this.error=null;try{await t()}catch(t){this.gateway.isCurrent(e)&&(this.error=u(t))}finally{this.gateway.isCurrent(e)&&(this.operation=null,await this.load({preserveError:!0}))}}async removeWorktree(e){let t=this.gateway.capture();t&&this.operatorAccess.canAdmin&&!this.operationPending&&await B({message:f(`worktrees.confirmDelete`,{name:e.name}),confirmLabel:f(`common.delete`),danger:!0})&&this.gateway.isCurrent(t)&&this.operatorAccess.canAdmin&&!this.operationPending&&(this.operation=`row`,await this.runOperation(t,async()=>{let n=await t.client.request(`worktrees.remove`,{id:e.id});if(!this.gateway.isCurrent(t)||n.removed)return;let r=n.snapshotError??``,i=await B({message:f(`worktrees.confirmForceDelete`,{error:r}),confirmLabel:f(`common.delete`),danger:!0});if(!this.gateway.isCurrent(t)||!this.operatorAccess.canAdmin)return;if(!i){this.error=r||null;return}let a=await t.client.request(`worktrees.remove`,{id:e.id,force:!0});this.gateway.isCurrent(t)&&(this.error=a.snapshotError??null)}))}async restore(e){let t=this.gateway.capture();t&&this.operatorAccess.canAdmin&&!this.operationPending&&(this.operation=`row`,await this.runOperation(t,()=>t.client.request(`worktrees.restore`,{id:e.id})))}async gc(){let e=this.gateway.capture();e&&this.operatorAccess.canAdmin&&!this.operationPending&&(this.operation=`gc`,await this.runOperation(e,()=>Y(e.client,()=>this.gateway.isCurrent(e))))}toggleCreate(){if(this.operatorAccess.canAdmin&&this.operation!==`create`&&(this.createOpen=!this.createOpen,this.createOpen&&!this.createRepoRoot)){let e=this.context.agents.state.agentsList,t=e?.agents.find(t=>t.id===e.defaultId);this.createRepoRoot=t?.workspace??``,this.loadCreateBranches()}}loadCreateBranches(){let e=this.gateway.connected?this.gateway.client:null,t=this.createRepoRoot.trim();if(!e||!t||!this.operatorAccess.canWrite){this.createBranches=[],this.branchesTask.run([null,``]);return}this.branchesTask.run([e,t])}async createWorktree(){let e=this.gateway.capture(),t=this.createRepoRoot.trim();e&&this.operatorAccess.canAdmin&&t&&!this.operationPending&&(this.operation=`create`,await this.runOperation(e,async()=>{await K(e.client,{repoRoot:t,name:this.createName,baseRef:this.createBaseRef}),this.gateway.isCurrent(e)&&(this.createOpen=!1,this.createName=``)}))}renderOwner(e){if(e.ownerKind===`session`&&e.ownerId){let n=s(this.context,e.ownerId),r=o({context:this.context,face:n,sessionKey:e.ownerId,preferenceDerivedFace:!0});return x`<a
        href=${r.href}
        title=${e.ownerId}
        @click=${e=>{t(e)&&(e.preventDefault(),this.context.navigate(n,r.options))}}
        >${f(`worktrees.ownerSession`)}</a
      >`}return e.ownerKind===`workboard`?x`<span title=${e.ownerId??``}>${f(`worktrees.ownerWorkboard`)}</span>`:x`<span>${f(`worktrees.ownerManual`)}</span>`}renderCreateRows(){return this.createOpen?x`
      ${V({title:f(`worktrees.repo`),control:x`
          <input
            class="settings-input"
            type="text"
            aria-label=${f(`worktrees.repo`)}
            ?disabled=${this.operation===`create`}
            .value=${this.createRepoRoot}
            @change=${e=>{this.createRepoRoot=e.target.value,this.createBaseRef=``,this.loadCreateBranches()}}
          />
        `})}
      ${[[`createName`,`worktrees.name`,`worktrees.namePlaceholder`],[`createBaseRef`,`worktrees.baseBranch`,`worktrees.baseBranchPlaceholder`]].map(([e,t,n])=>V({title:f(t),control:x`
            <input
              class="settings-input"
              type="text"
              aria-label=${f(t)}
              ?disabled=${this.operation===`create`}
              placeholder=${f(n)}
              list=${e===`createBaseRef`?`worktrees-create-branches`:b}
              .value=${this[e]}
              @input=${t=>{this[e]=t.target.value}}
            />
            ${e===`createBaseRef`?x`<datalist id="worktrees-create-branches">
                    ${this.createBranches.map(e=>x`<option value=${e}></option>`)}
                  </datalist>`:b}
          `}))}
      ${V({title:f(`worktrees.newWorktree`),control:x`
          <button
            class="btn btn--sm"
            ?disabled=${this.operationPending||!this.createRepoRoot.trim()}
            @click=${()=>void this.createWorktree()}
          >
            ${this.operation===`create`?f(`common.loading`):f(`common.create`)}
          </button>
        `})}
    `:b}renderRecordRow(e){return V({title:e.name,description:x`
        <span title=${e.repoRoot}>${l(e.repoRoot)}</span> · ${e.branch}
        · ${this.renderOwner(e)} · ${d(e.lastActiveAt)}
      `,control:x`
        ${e.removedAt?R({kind:`muted`,label:f(`worktrees.restorable`)}):R({kind:`ok`,label:f(`common.active`)})}
        <button
          class=${e.removedAt?`btn btn--sm`:`btn btn--sm danger`}
          title=${this.operatorAccess.canAdmin?``:f(`worktrees.adminRequired`)}
          ?disabled=${!this.operatorAccess.canAdmin||this.operationPending}
          @click=${()=>void(e.removedAt?this.restore(e):this.removeWorktree(e))}
        >
          ${e.removedAt?f(`worktrees.restore`):f(`common.delete`)}
        </button>
      `})}render(){let e=x`
      <button
        class="btn"
        title=${this.operatorAccess.canAdmin?``:f(`worktrees.adminRequired`)}
        aria-expanded=${String(this.createOpen)}
        ?disabled=${!this.operatorAccess.canAdmin||this.operation===`create`}
        @click=${()=>this.toggleCreate()}
      >
        ${f(`worktrees.newWorktree`)}
      </button>
      <button
        class="btn"
        title=${this.operatorAccess.canAdmin?``:f(`worktrees.adminRequired`)}
        ?disabled=${!this.operatorAccess.canAdmin||this.operationPending}
        @click=${()=>void this.gc()}
      >
        ${this.loading?f(`common.loading`):f(`worktrees.cleanNow`)}
      </button>
    `,t=x`
      ${this.renderCreateRows()}
      ${this.records.length===0?N(f(`worktrees.empty`)):this.records.map(e=>this.renderRecordRow(e))}
    `,n=P(x`
        ${this.operatorAccess.canAdmin?b:x`<div class="callout info" role="note">${f(`worktrees.adminRequired`)}</div>`}
        ${this.error?x`<div class="callout danger" role="alert">${this.error}</div>`:b}
        ${L({title:f(`worktrees.title`),description:f(`worktrees.subtitle`),actions:e},t)}
      `,{wide:!0});return x`
      ${q({active:`worktrees`,title:h(`sessions`),subtitle:x`${y(`worktrees`)} ${I(Z)}`,onSelect:e=>{e!==`worktrees`&&this.context?.navigate(e)}})}
      ${U(n,{id:`sessions-hub-panel`})}
    `}},O([E({context:_,subscribe:!0})],Q.prototype,`context`,void 0),O([C()],Q.prototype,`records`,void 0),O([C()],Q.prototype,`error`,void 0),O([C()],Q.prototype,`operation`,void 0),O([C()],Q.prototype,`createOpen`,void 0),O([C()],Q.prototype,`createRepoRoot`,void 0),O([C()],Q.prototype,`createName`,void 0),O([C()],Q.prototype,`createBaseRef`,void 0),O([C()],Q.prototype,`createBranches`,void 0),customElements.get(`zero-worktrees-page`)||customElements.define(`zero-worktrees-page`,Q)})))()}$();
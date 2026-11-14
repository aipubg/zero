const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./input-dialog-D-ZiT4FK.js","./gateway-runtime-JSfC8ThO.js","./session-snapshot-database-C0tOYKTe.js","./control-ui-core-DI-Q_yCI.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{B as t,Ic as n,Jr as r,L as i,Lc as a,Nu as o,Pu as s,W as c,Yi as l,Yr as u,Zi as d,_u as ee,bl as f,ju as p,k as m,vu as te,xl as ne,xu as re,yu as ie,z as h,zu as g}from"./control-ui-core-DCNBgr3X.js";import{Aa as ae,Ai as oe,At as _,Ba as se,an as ce,at as le,ca as v,ki as ue,lt as de,on as fe,or as pe,sa as y,sr as me,wr as he,xr as ge,yr as _e,za as ve}from"./control-ui-core-DwX5Mpz4.js";import{G as b,J as x,W as S,Z as ye,at as be,i as xe,n as Se,o as C,rt as w,t as Ce}from"./lit-runtime-B40xFCK_.js";import{Fn as we,Pn as Te}from"./control-ui-boot-shared-BRtBCr5s.js";import{It as Ee,zt as De}from"./control-ui-boot-shared-BX8huZUb.js";import{Ai as Oe,Co as ke,Et as T,Mo as Ae,Ot as je,Po as E,Sa as Me,So as D,To as Ne,Tt as O,Ur as Pe,Wr as Fe,Zr as k,go as Ie,it as Le,jo as Re,ma as ze,ot as Be,pa as Ve,pi as A,wa as j,x as He,yi as Ue}from"./ui-AaV6iNVa.js";import{F as We,M,N,j as Ge}from"./control-ui-boot-shared-E4pYPcWx.js";import{A as Ke,C as P,_ as qe,w as Je}from"./config-runtime-BecGLziM.js";import{$ as Ye,B as Xe,G as Ze,I as F,Mi as Qe,R as $e,U as et,Y as I,Z as L,cn as tt,ki as nt,l as rt,na as it,on as at,q as R,ta as ot,tt as st,u as ct}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Bs as lt,Ml as ut,Nl as dt,cl as ft,ha as pt,ma as mt,pa as ht,sl as gt,zs as _t}from"./control-ui-boot-shared-CzJHozXQ.js";import{A as vt,M as yt,N as z,P as bt,j as xt}from"./control-ui-boot-new-5_2Ky4dv.js";import{n as St,t as Ct}from"./desktop-focus-window-CA-wXRF5.js";import{_ as wt,a as Tt,c as Et,d as Dt,f as Ot,g as kt,h as At,i as B,m as jt,n as Mt,o as V,p as Nt,r as Pt,s as Ft,t as It,u as Lt,v as Rt,y as zt}from"./page-operations-IReDrmyc.js";import{n as H,t as U}from"./en-devices-B_lyWAH1.js";import{n as Bt,t as Vt}from"./capacity-meter-WCr6-wfe.js";function Ht(e){return fe(void 0,({render:t,finish:n})=>{let r=!1,i=()=>n(),a=t=>{if(!e.secret){i();return}t.preventDefault(),!r&&(r=!0,s())},o=e.secret?`btn primary`:`btn secret-reveal__dismiss`,s=()=>{t(()=>x`
          <zero-modal-dialog
            label=${e.title}
            description=${e.message}
            @modal-cancel=${a}
          >
            <div class="exec-approval-card">
              <div class="secret-reveal__header">
                ${e.status===`success`?x`<span class="secret-reveal__status" aria-hidden="true"
                        >${y.check}</span
                      >`:b}
                <div class="exec-approval-title">${e.title}</div>
              </div>
              <div class="secret-reveal__body"><p>${e.message}</p></div>
              ${e.callout?x`<div class="callout info secret-reveal__callout">${e.callout}</div>`:b}
              ${e.secret?x`
                      <div class="secret-reveal__value">
                        <code class="secret-reveal__code">${e.secret}</code>
                        ${tt(e.secret,g(`common.copy`))}
                      </div>
                    `:b}
              ${r?x`<p class="secret-reveal__hint" role="status">${e.dismissHint}</p>`:b}
              ${e.note?x`<p class="secret-reveal__note">${e.note}</p>`:b}
              <div class="exec-approval-actions">
                <button type="button" class=${o} autofocus @click=${i}>
                  ${e.acknowledgeLabel}
                </button>
              </div>
            </div>
          </zero-modal-dialog>
        `)};s()})}function Ut(){return(Ut=e((()=>{S(),s(),at(),v(),ce()})))()}function Wt(e){if(!j(e))return;if(e.status===`missing`&&Object.keys(e).length===1)return{status:`missing`};let t=E(e.version);return e.status===`installed`&&t&&Object.keys(e).length===2?{status:`installed`,version:t}:void 0}function Gt(e){let t=E(e.nodeId);if(!t)return null;let n=E(e.approvalState);return{nodeId:t,displayName:E(e.displayName),platform:E(e.platform),deviceFamily:E(e.deviceFamily),version:E(e.version),coreVersion:E(e.coreVersion),uiVersion:E(e.uiVersion),modelIdentifier:E(e.modelIdentifier),clientId:E(e.clientId),clientMode:E(e.clientMode),remoteIp:E(e.remoteIp),caps:D(e.caps),commands:D(e.commands),approvalState:n&&an.has(n)?n:void 0,pendingRequestId:E(e.pendingRequestId),workerSlots:we(e.workerSlots)??void 0,workerBundle:Wt(e.workerBundle),hostStats:rn.safeParse(e.hostStats).data,connected:e.connected===!0,paired:e.paired===!0,connectedAtMs:A(e.connectedAtMs),lastSeenAtMs:A(e.lastSeenAtMs),approvedAtMs:A(e.approvedAtMs)}}function Kt(...e){let t;for(let n of e)n!==void 0&&(t===void 0||n>t)&&(t=n);return t}function qt(e,t,n,r){let i=t?Ne([...t.roles??[],t.role]):[];n?.paired&&!i.includes(`node`)&&i.push(`node`);let a=E(t?.operatorLabel),o=E(t?.displayName)??n?.displayName,s=E(t?.clientId)??n?.clientId;return{id:e,name:a??o??s??e,displayName:o,clientId:s,clientMode:E(t?.clientMode)??n?.clientMode,platform:E(r?.platform)??E(t?.platform)??n?.platform,deviceFamily:E(r?.deviceFamily)??E(t?.deviceFamily)??n?.deviceFamily,version:E(r?.version)??n?.version,modelIdentifier:E(r?.modelIdentifier)??n?.modelIdentifier,remoteIp:E(t?.remoteIp)??n?.remoteIp,roles:i,scopes:D(t?.scopes),connected:n?.connected===!0||t?.connected===!0,autoApproved:t?.approvedVia===`silent`||t?.approvedVia===`trusted-cidr`||t?.approvedVia===`ssh-verified`,lastSeenAtMs:Kt(t?.lastSeenAtMs,n?.lastSeenAtMs,n?.connectedAtMs,A(r?.ts)),approvedAtMs:Kt(t?.approvedAtMs,n?.approvedAtMs),presence:r,device:t,node:n}}function Jt(e){let t=e.displayName?.toLowerCase();if(t)return`name:${t}`;let n=e.clientId?.toLowerCase(),r=e.clientMode?.toLowerCase();return n||r?`client:${n??``}:${r??``}`:`id:${e.id}`}function Yt(e){return e.lastSeenAtMs??e.approvedAtMs??0}function Xt(e,t){let n=Number(t.connected)-Number(e.connected)||Yt(t)-Yt(e);return n===0?e.id.localeCompare(t.id):n}function Zt(e){let t=new Map;for(let n of e.nodes){let e=Gt(n);e&&t.set(e.nodeId,e)}let n=new Map;for(let t of e.presence??[])for(let e of[t.deviceId,t.instanceId]){let r=E(e)?.toLowerCase();r&&n.set(r,t)}let r=new Map;for(let i of e.paired){let e=E(i.deviceId);e&&!r.has(e)&&r.set(e,qt(e,i,t.get(e),n.get(e.toLowerCase())))}for(let[e,i]of t)r.has(e)||r.set(e,qt(e,void 0,i,n.get(e.toLowerCase())));let i=new Map;for(let e of r.values()){let t=Jt(e),n=i.get(t);n?n.push(e):i.set(t,[e])}return[...i].flatMap(([e,t])=>{let[n,...r]=t.toSorted(Xt);return n?[{key:e,name:n.name,primary:n,duplicates:r}]:[]}).toSorted((e,t)=>{let n=Xt(e.primary,t.primary);return n===0?e.name.localeCompare(t.name):n})}function Qt(e){return e.flatMap(e=>e.duplicates.filter(e=>!e.connected&&(e.autoApproved||e.device!==void 0&&e.device.approvedVia===void 0)))}function $t(e){return e.find(e=>E(e.mode)?.toLowerCase()===`gateway`)}function en(e,t){let n=new Set;for(let e of t)for(let t of[e.primary,...e.duplicates])n.add(t.id.toLowerCase());return e.filter(e=>{if(E(e.mode)?.toLowerCase()===`gateway`||E(e.reason)?.toLowerCase()===`disconnect`)return!1;let t=[e.deviceId,e.instanceId].map(e=>E(e)?.toLowerCase()).filter(e=>e!==void 0);return t.length===0&&!E(e.host)&&!E(e.mode)?!1:!t.some(e=>n.has(e))})}function tn(e){let t=e.roles.includes(`node`),n=e.roles.filter(e=>e!==`node`);return{removeNode:t||e.node?.paired===!0,removeDevice:!!e.device&&(n.length>0||e.roles.length===0)}}function nn(e){let t=new Map;for(let n of e){let e=(n.deviceId??n.instanceId)?.trim().toLowerCase();if(!e||n.mode?.trim().toLowerCase()===`gateway`)continue;let r=n.roles?.includes(`node`)?`${e}:node`:e;t.set(r,n.reason?.trim().toLowerCase()===`disconnect`?`offline`:`connected`)}return JSON.stringify([...t].toSorted(([e],[t])=>e.localeCompare(t)))}var rn,an;function W(){return(W=e((()=>{Ue(),Ie(),qe(),Te(),rn=Je({cpuCount:P().int().positive(),loadAverage:Ke([P().nonnegative(),P().nonnegative(),P().nonnegative()]).optional(),memoryTotalBytes:P().positive(),memoryFreeBytes:P().nonnegative(),diskTotalBytes:P().positive().optional(),diskAvailableBytes:P().nonnegative().optional(),updatedAtMs:P().nonnegative()}).refine(e=>e.memoryFreeBytes<=e.memoryTotalBytes&&(e.diskAvailableBytes===void 0||e.diskTotalBytes===void 0||e.diskAvailableBytes<=e.diskTotalBytes)),an=new Set([`approved`,`pending-approval`,`pending-reapproval`,`unapproved`])})))()}var on;function sn(){return(sn=e((()=>{ot(),s(),U(),re(),B(),ze(),H(),on=class{constructor(e){this.host=e,this.pending=null}cancel(){this.pending?.abort(),this.pending=null}async editAlias(e){if(!this.host.canManagePairing()||this.pending)return;let t=new AbortController;this.pending=t;try{let{showInputDialog:n}=await Ve(async()=>{let{showInputDialog:e}=await import(`./input-dialog-D-ZiT4FK.js`).then(e=>(e.t(),e.n));return{showInputDialog:e}},__vite__mapDeps([0,1,2,3]),import.meta.url);await n({signal:t.signal,title:g(`devices.inventory.renameTitle`,{name:e.name}),label:g(`devices.inventory.renamePrompt`),defaultValue:e.operatorLabel??``,requireValue:!0,requireChange:!0,submit:t=>this.host.canManagePairing()?this.host.runPageTask(n=>At(n,{deviceId:e.id,label:t})):Promise.resolve(g(`devices.readOnly.pairingRequired`))})}catch(e){this.host.setDevicesError(ie(e))}finally{this.pending===t&&(this.pending=null)}}confirmInventoryRemoval(e){return this.confirmDestructiveAction({confirmLabel:g(`devices.inventory.remove`),...e.kind===`entry`?{title:g(`devices.inventory.removePromptTitle`,{name:e.entry.name}),message:g(`devices.inventory.removePromptBody`),details:g(`devices.inventory.deviceId`,{id:e.entry.id})}:{title:g(e.entries.length===1?`devices.inventory.removeStalePromptTitleOne`:`devices.inventory.removeStalePromptTitle`,{count:String(e.entries.length)}),message:g(`devices.inventory.removeStalePromptBody`)}},e.kind===`entry`?t=>Nt(t,e.entry):t=>jt(t,e.entries))}confirmPairingReject(e,t){return this.confirmDestructiveAction({title:g(e===`device`?`devices.inventory.rejectDevicePromptTitle`:`devices.inventory.rejectNodePromptTitle`),message:g(`devices.inventory.rejectPromptBody`),confirmLabel:g(`devices.inventory.reject`)},n=>e===`device`?Lt(n,t):Dt(n,t))}confirmTokenRevoke(e,t){return this.confirmDestructiveAction({title:g(`devices.inventory.revokePromptTitle`,{role:t}),message:g(`devices.inventory.revokePromptBody`),details:g(`devices.inventory.deviceId`,{id:e}),confirmLabel:g(`devices.inventory.revoke`)},n=>kt(n,{deviceId:e,gatewayUrl:this.host.gatewayUrl(),role:t}))}async confirmExecApprovalsDiscard(){if(this.pending)return!1;let e=new AbortController;this.pending=e;let t=await it({title:g(`devices.execApprovals.discardPromptTitle`),message:g(`devices.execApprovals.discardPromptBody`),confirmLabel:g(`devices.execApprovals.discardConfirm`),danger:!0,signal:e.signal});return this.pending===e&&(this.pending=null),t&&!e.signal.aborted}async confirmDestructiveAction(e,t){if(!this.host.canManagePairing()||this.pending)return;let n=new AbortController;this.pending=n;let r=this.host.requestGeneration(),i=this.host.gatewayClient(),a=await it({...e,danger:!0,signal:n.signal});this.pending===n&&(this.pending=null),a&&!n.signal.aborted&&r===this.host.requestGeneration()&&i===this.host.gatewayClient()&&this.host.gatewayConnected()&&this.host.canManagePairing()&&await this.host.runPageTask(t)}}})))()}function cn(e){let t=Me(e);return Array.isArray(t.nodes)?t.nodes:[]}function ln(){return(ln=e((()=>{})))()}function un(e){return Re(e.normalize(`NFC`)).replace(/(?=\p{M})\p{Emoji_Component}/gu,``).replace(/(?<![\p{L}\p{M}\p{N}])\p{M}+/gu,``).replace(/[^\p{L}\p{M}\p{N}]+/gu,`-`).replace(/^-+/,``).replace(/-+$/,``)}function dn(e){let t=e.displayName||e.remoteIp||e.nodeId,n=[`node=${e.nodeId}`],r=E(e.clientId);return r&&n.push(`client=${r}`),`${t} [${n.join(`, `)}]`}function fn(e,t,n,r){let i=typeof e.displayName==`string`?e.displayName:``,a=i?un(i):``;return a&&a===n?2e3:r!==void 0&&a&&a.replace(/-/g,``)===r?1900:t.length>=6&&e.nodeId.startsWith(t)?1e3:0}function pn(e,t,n=!1){let r=t.trim();if(!r)throw Error(`node required`);let i=e.filter(e=>e.nodeId===r);if(i.length===0&&(i=e.filter(e=>e.remoteIp===r)),i.length===0){let t=un(r),a=n?t.replace(/-/g,``):void 0,o=0;e.forEach(e=>{let n=fn(e,r,t,a);n>o&&(o=n,i.length=0),n>0&&n===o&&i.push(e)})}if(i.length===0){let t=e.map(e=>e.displayName||e.remoteIp||e.nodeId).filter(Boolean).join(`, `);throw Error(`unknown node: ${r}${t?` (known: ${t})`:``}`)}let a=i.filter(e=>e.connected===!0),o=a.length>0?a:i;if(o.length===1)return o[0]?.nodeId??``;throw Error(`ambiguous node: ${r} (matches: ${o.map(dn).join(`, `)})`)}function mn(){return(mn=e((()=>{})))()}function hn(e){let t=j(e?.agents)?e.agents:null,n=j(t?.entries)?t.entries:{},r=j(t?.defaults)?t.defaults:null,i=j(r?.systemAgent)?r.systemAgent:null,a=E(i?.agentId),o=Object.keys(n).length===1?Object.keys(n)[0]:void 0,s=[];for(let[e,t]of Object.entries(n)){if(!j(t))continue;let n=E(t.name),r=e===(a??o);s.push({id:e,name:n,isDefault:r,record:t})}return s}function gn(e,t){let n=[];for(let r of e){let e=Array.isArray(r.commands)?r.commands:[],i=new Set(e.map(String));if(!t.every(e=>i.has(e)))continue;let a=E(r.nodeId)??``;if(!a)continue;let o=E(r.displayName)??a;n.push({id:a,label:o===a?a:`${o} · ${a}`})}return n.sort((e,t)=>e.label.localeCompare(t.label)),n}function _n(e){let t=e.platform?.trim().toLowerCase()??``,n=e.modelIdentifier?.trim()??``,r=e.clientId?.trim().toLowerCase()??``,i=e.clientMode?.trim().toLowerCase()??``;if(n.startsWith(`Watch`)||yn.test(t)||r===O.WATCHOS_APP)return z.watch;if(n.startsWith(`iPad`)||bn.test(t))return z.tablet;if(n.startsWith(`iPhone`)||xn.test(t)||Sn.has(r))return z.smartphone;if(Cn.has(r)||i===T.WEBCHAT)return z.browser;if(wn.has(i)||Tn.has(r))return z.terminal;if(i===`gateway`)return z.server;switch(yt(n)){case`laptop`:return z.laptop;case`mini`:return z.macMini;case`studio`:case`pro`:return z.pcCase;case`imac`:return z.allInOne;default:return y.monitor}}function G(e){return x`
    <div class="device-entry__tile" aria-hidden="true">
      <span class="device-entry__tile-icon">${e}</span>
    </div>
  `}function vn(e,t){return x`
    <dt class="settings-row__desc">${g(`devices.inventory.deviceIdLabel`)}</dt>
    <dd class="settings-row__value settings-row__value--mono" title=${e}>${e}</dd>
    ${t?x`<dt class="settings-row__desc">${g(`devices.inventory.remoteIpLabel`)}</dt>
            <dd class="settings-row__value settings-row__value--mono">${t}</dd>`:b}
  `}var yn,bn,xn,Sn,Cn,wn,Tn;function K(){return(K=e((()=>{S(),je(),bt(),v(),s(),vt(),yn=/\bwatchos\b/,bn=/\b(ipados|ipad)\b/,xn=/\b(ios|android|iphone)\b/,Sn=new Set([O.IOS_APP,O.ANDROID_APP]),Cn=new Set([O.CONTROL_UI,O.WEBCHAT_UI,O.WEBCHAT]),wn=new Set([T.CLI,T.BACKEND,T.PROBE,T.TEST]),Tn=new Set([O.CLI,O.TUI])})))()}function En(e){return J.find(t=>t.value===e)?.value??`deny`}function Dn(e){return Y.find(t=>t.value===e)?.value??`on-miss`}function On(e,t,n){let r=e?.defaults??{},i=n?e?.agents?.[`*`]??{}:{};return{security:En(i.security??r.security??t?.security),ask:Dn(i.ask??r.ask??t?.ask),askFallback:En(i.askFallback??r.askFallback??t?.askFallback??`deny`),autoAllowSkills:i.autoAllowSkills??r.autoAllowSkills??t?.autoAllowSkills??!1}}function kn(e,t){let n=new Map(hn(e).map(e=>[e.id,e]));for(let e of Object.keys(t?.agents??{}))n.has(e)||n.set(e,{id:e});let r=Array.from(n.values());return r.length===0&&r.push({id:`main`,isDefault:!0}),r.sort((e,t)=>{let n=e.name?.trim()?e.name:e.id,r=t.name?.trim()?t.name:t.id;return Number(!!t.isDefault)-Number(!!e.isDefault)||n.localeCompare(r)}),r}function An(e){let t=e.execApprovalsSnapshot,n=Tt(t)?t:null,r=t&&!Tt(t)?t:null,i=n?null:e.execApprovalsForm??r?.file??null,a=!!(i||n),o=kn(e.configForm,i),s=gn(e.nodes,[`system.execApprovals.get`,`system.execApprovals.set`]),c=e.execApprovalsTarget,l=c===`node`&&e.execApprovalsTargetNodeId?e.execApprovalsTargetNodeId:null;c===`node`&&l&&!s.some(e=>e.id===l)&&(l=null);let u=e.execApprovalsSelectedAgent,d=u&&o.some(e=>e.id===u)?u:q,ee=On(i,r?.resolvedDefaults,d!==q),f=d===q?null:i?.agents?.[d]??null,p=f?.allowlist;return{ready:a,disabled:!e.canAdmin||e.execApprovalsSaving||e.execApprovalsLoading,dirty:e.execApprovalsDirty,loading:e.execApprovalsLoading,saving:e.execApprovalsSaving,nativePolicy:n,defaults:ee,selectedScope:d,selectedAgent:f,agents:o,allowlist:Array.isArray(p)?p:[],target:c,targetNodeId:l,targetNodes:s,onSelectScope:e.onExecApprovalsSelectAgent,onSelectTarget:e.onExecApprovalsTargetChange,onPatch:e.onExecApprovalsPatch,onRemove:e.onExecApprovalsRemove,onLoad:e.onLoadExecApprovals,onSave:e.onSaveExecApprovals,canAdmin:e.canAdmin}}function jn(e){let t=e.ready,n=e.target!==`node`||!!e.targetNodeId,r=x`
    <button
      class="btn"
      ?disabled=${e.disabled||!e.dirty||!n||!!e.nativePolicy}
      @click=${e.onSave}
    >
      ${e.saving?g(`common.saving`):g(`common.save`)}
    </button>
  `,i=x`
    ${e.canAdmin?x`
            ${Nn(e)}
            ${t?e.nativePolicy?Mn(e.nativePolicy):x`${Pn(e)} ${Fn(e)}`:R({title:g(`devices.execApprovals.loadHint`),control:x`
                      <button
                        class="btn"
                        ?disabled=${e.loading||!n}
                        @click=${e.onLoad}
                      >
                        ${e.loading?g(`common.loading`):g(`common.loadApprovals`)}
                      </button>
                    `})}
          `:R({title:g(`devices.readOnly.adminRequired`)})}
  `;return x`
    ${I({title:g(`devices.execApprovals.title`),description:x`
          ${g(`devices.execApprovals.subtitlePrefix`)}
          <span class="mono">exec host=gateway/node</span>.
        `,actions:r},i)}
    ${e.canAdmin&&t&&!e.nativePolicy&&e.selectedScope!==q?In(e):b}
  `}function Mn(e){let t=e.enabled&&Array.isArray(e.rules)?e.rules:[],n=e.enabled?e.defaultAction:e.message??`unavailable`;return x`
    ${R({title:g(`devices.execApprovals.hostNativePolicy`),description:g(`devices.execApprovals.hostNativeHint`),control:st(g(`devices.execApprovals.native`))})}
    ${R({title:g(`devices.execApprovals.defaultAction`),description:n,control:st(g(t.length===1?`devices.execApprovals.rule`:`devices.execApprovals.rules`,{count:String(t.length)}))})}
    ${t.map(e=>R({title:e.pattern,description:x`
          ${e.action} · ${e.shells?.join(`, `)||g(`devices.execApprovals.allShells`)} ·
          ${e.enabled===!1?g(`devices.execApprovals.off`):g(`devices.execApprovals.on`)}
          ${e.description?x`<br />${m(e.description,120)}`:b}
        `}))}
  `}function Nn(e){let t=e.targetNodes.length>0,n=e.targetNodeId??``;return x`
    ${R({title:g(`devices.execApprovals.target`),description:g(`devices.execApprovals.targetHint`),control:x`
        <select
          class="settings-select"
          aria-label=${g(`devices.execApprovals.host`)}
          .value=${C(e.target)}
          ?disabled=${e.disabled}
          @change=${t=>{if(t.target.value===`node`){let t=e.targetNodes[0]?.id??null;e.onSelectTarget(`node`,n||t)}else e.onSelectTarget(`gateway`,null)}}
        >
          <option value="gateway" ?selected=${e.target===`gateway`}>
            ${g(`devices.execApprovals.gateway`)}
          </option>
          <option value="node" ?selected=${e.target===`node`}>
            ${g(`devices.execApprovals.node`)}
          </option>
        </select>
      `})}
    ${e.target===`node`?R({title:g(`devices.execApprovals.node`),description:t?void 0:g(`devices.execApprovals.noNodes`),control:x`
              <select
                class="settings-select"
                aria-label=${g(`devices.execApprovals.node`)}
                .value=${C(n)}
                ?disabled=${e.disabled||!t}
                @change=${t=>{let n=t.target.value.trim();e.onSelectTarget(`node`,n||null)}}
              >
                <option value="" ?selected=${n===``}>
                  ${g(`devices.execApprovals.selectNode`)}
                </option>
                ${e.targetNodes.map(e=>x`<option value=${e.id} ?selected=${n===e.id}>
                      ${e.label}
                    </option>`)}
              </select>
            `}):b}
  `}function Pn(e){let t=[{value:q,label:g(`devices.execApprovals.defaults`),icon:y.settings},...e.agents.map(e=>({value:e.id,label:e.name?.trim()?`${e.name} (${e.id})`:e.id,agent:{id:e.id,...e.name?{name:e.name}:{}},badge:e.isDefault?g(`agents.default`):void 0}))];return R({title:g(`devices.execApprovals.scope`),stacked:!0,control:x`
      <zero-agent-select
        class="agent-select--settings"
        .options=${t}
        .value=${e.selectedScope}
        .accessibleLabel=${g(`devices.execApprovals.scope`)}
        .disabled=${e.disabled}
        .onSelect=${e.onSelectScope}
      ></zero-agent-select>
    `})}function Fn(e){let t=e.selectedScope===q,n=e.defaults,r=e.selectedAgent??{},i=t?[`defaults`]:[`agents`,e.selectedScope],a=typeof r.autoAllowSkills==`boolean`?r.autoAllowSkills:void 0,o=a??n.autoAllowSkills,s=a==null;return x`
    ${[{key:`security`,descriptionKey:`devices.execApprovals.defaultSecurity`,ariaLabelKey:`devices.execApprovals.mode`,values:J},{key:`ask`,descriptionKey:`devices.execApprovals.defaultPrompt`,ariaLabelKey:`devices.execApprovals.mode`,values:Y},{key:`askFallback`,descriptionKey:`devices.execApprovals.promptUnavailable`,ariaLabelKey:`devices.execApprovals.fallback`,values:J}].map(({key:a,descriptionKey:o,ariaLabelKey:s,values:c})=>{let l=typeof r[a]==`string`?r[a]:void 0,u=t?n[a]:l??`__default__`;return R({title:g(`devices.execApprovals.${a}`),description:t?g(o):l===void 0?void 0:g(`devices.execApprovals.defaultValue`,{value:n[a]}),control:x`
          <select
            class="settings-select"
            aria-label=${g(s)}
            .value=${C(u)}
            ?disabled=${e.disabled}
            @change=${n=>{let r=n.target.value;!t&&r===`__default__`?e.onRemove([...i,a]):e.onPatch([...i,a],r)}}
          >
            ${t?b:x`<option value="__default__" ?selected=${u===`__default__`}>${g(`devices.execApprovals.useDefaultValue`,{value:n[a]})}</option>`}
            ${c.map(e=>x`<option value=${e.value} ?selected=${u===e.value}>${g(e.labelKey)}</option>`)}
          </select>
        `})})}
    ${R({title:g(`devices.execApprovals.autoAllowSkills`),description:t?g(`devices.execApprovals.autoAllowSkillsHint`):s?void 0:g(`devices.execApprovals.override`,{value:g(o?`devices.execApprovals.on`:`devices.execApprovals.off`)}),control:x`
        ${!t&&!s?x`<button
                class="btn btn--sm"
                ?disabled=${e.disabled}
                @click=${()=>e.onRemove([...i,`autoAllowSkills`])}
              >
                ${g(`devices.execApprovals.useDefault`)}
              </button>`:b}
        ${Ye({checked:o,disabled:e.disabled,ariaLabel:g(`devices.execApprovals.autoAllowSkills`),onChange:t=>e.onPatch([...i,`autoAllowSkills`],t)})}
      `})}
  `}function In(e){let t=[`agents`,e.selectedScope,`allowlist`],n=e.allowlist;return I({title:g(`devices.execApprovals.allowlist`),description:g(`devices.execApprovals.allowlistHint`),actions:x`
        <button
          class="btn btn--sm"
          ?disabled=${e.disabled}
          @click=${()=>e.onPatch(t,[...n,{pattern:``}])}
        >
          ${g(`devices.execApprovals.addPattern`)}
        </button>
      `},n.length===0?Xe(g(`devices.execApprovals.emptyAllowlist`)):n.map((n,r)=>{let i=n.lastUsedAt?h(n.lastUsedAt):g(`common.never`),a=n.lastUsedCommand?m(n.lastUsedCommand,120):null,o=n.lastResolvedPath?m(n.lastResolvedPath,120):null;return R({title:n.pattern?.trim()?n.pattern:g(`devices.execApprovals.newPattern`),description:x`
              ${g(`devices.execApprovals.lastUsed`,{time:i})}
              ${a?x`<br /><span class="mono">${a}</span>`:b}
              ${o?x`<br /><span class="mono">${o}</span>`:b}
            `,control:x`
              <input
                class="settings-input"
                type="text"
                aria-label=${g(`devices.execApprovals.pattern`)}
                .value=${n.pattern??``}
                ?disabled=${e.disabled}
                @input=${n=>{let i=n.target;e.onPatch([...t,r,`pattern`],i.value)}}
              />
              <button
                class="btn btn--sm danger"
                ?disabled=${e.disabled}
                @click=${()=>e.onRemove(e.allowlist.length<=1?t:[...t,r])}
              >
                ${g(`devices.execApprovals.remove`)}
              </button>
            `})}))}var q,J,Y;function Ln(){return(Ln=e((()=>{S(),xe(),nt(),v(),F(),s(),U(),c(),B(),K(),H(),q=`__defaults__`,J=[{value:`deny`,labelKey:`devices.execApprovals.options.deny`},{value:`allowlist`,labelKey:`devices.execApprovals.options.allowlist`},{value:`full`,labelKey:`devices.execApprovals.options.full`}],Y=[{value:`off`,labelKey:`devices.execApprovals.options.off`},{value:`on-miss`,labelKey:`devices.execApprovals.options.onMiss`},{value:`always`,labelKey:`devices.execApprovals.options.always`}]})))()}function Rn(e){let t=e.workerSlots;if(t){let n=e.unavailable?null:t.total-t.available,r=n===null?g(`capacityMeter.unavailable`):g(`capacityMeter.workerSlots`,{used:String(n),total:String(t.total)}),i=e.unavailable?`stale`:t.available===0?`warn`:`accent`;return{label:r,title:n===null?void 0:r,meter:Bt({mode:`discrete`,total:t.total,used:n,tone:i,label:r})}}if(!(e.capabilities?.some(e=>e===`codex.exec-server`||e===`codex.exec-server.stdio.v1`)||e.commands?.includes(`codex.exec-server.stdio.v1`)))return;let n=g(`capacityMeter.execHost`);return{label:n,title:n,meter:x`<span class="capacity-meter-exec" role="img" aria-label=${n}>
      <span aria-hidden="true">${y.terminal}</span>${n}
    </span>`}}function zn(){return(zn=e((()=>{S(),s(),Vt(),v()})))()}function Bn(e,t,n){return x`
    <span class="device-capability" role="listitem" title=${n}>
      <span class="device-capability__icon" aria-hidden="true">${e}</span>
      <span>${t}</span>
    </span>
  `}function Vn(e){if(e.length===0)return b;let t=[...new Set(e.map(e=>e===`codex-cli-session-source`?`codex-cli-sessions`:e))],n=t.filter(e=>X.has(e)),r=t.filter(e=>!X.has(e)),i=r.slice(0,Un-+(n.length>0)),a=r.length-i.length,o=g(n.length===1?`devices.capabilities.runtime`:`devices.capabilities.runtimes`,{count:String(n.length)}),s=n.join(`, `);return x`
    <div class="device-capabilities" role="list" aria-label=${g(`devices.inventory.capabilities`)}>
      ${n.length>0?Bn(y.squareTerminal,o,s):b}
      ${i.map(e=>{let t=Hn.get(e);return Bn(t?.icon??y.puzzle,t?g(`devices.capabilities.${t.key}.label`):e,t?g(`devices.capabilities.${t.key}.description`):e)})}
      ${a>0?x`<span
              class="device-capability device-capability--overflow"
              role="listitem"
              title=${g(`devices.capabilities.overflow`,{count:String(a)})}
              >+${a}</span
            >`:b}
    </div>
  `}var Hn,X,Un;function Wn(){return(Wn=e((()=>{S(),v(),s(),U(),H(),Hn=new Map(Object.entries({browser:{icon:y.globe,key:`browser`},canvas:{icon:y.panelsTopLeft,key:`canvas`},screen:{icon:y.monitor,key:`screen`},computer:{icon:y.monitorSmartphone,key:`computer`},file:{icon:y.folder,key:`file`},system:{icon:y.terminal,key:`system`},mcp:{icon:y.plug,key:`mcp`},"local-inference":{icon:y.cpu,key:`localInference`},camera:{icon:y.camera,key:`camera`},talk:{icon:y.mic,key:`talk`},location:{icon:y.target,key:`location`},notifications:{icon:y.bell,key:`notifications`},contacts:{icon:y.users,key:`contacts`},calendar:{icon:y.calendarClock,key:`calendar`},reminders:{icon:y.listChecks,key:`reminders`},device:{icon:y.smartphone,key:`device`},photos:{icon:y.image,key:`photos`},sms:{icon:y.messageSquare,key:`sms`},health:{icon:y.activity,key:`health`},motion:{icon:y.radio,key:`motion`}})),X=new Set([`claude-sessions`,`codex-cli-sessions`,`codex-app-server-threads`,`opencode-sessions`,`pi-sessions`]),Un=16})))()}function Gn(e,t){return e.desktopEnvironments?.find(e=>e.id===t&&e.desktop===!0)?.id}async function Kn(e){let t=await r(e);te({message:g(t?`devices.inventory.deviceIdCopied`:`common.copyFailed`)})}function Z(e,t){if(!t.deviceId&&!t.desktopEnvironment)return b;let n=[{value:`desktop`,labelKey:`devices.inventory.openDesktop`,visible:t.desktopEnvironment,pairing:!1,run:()=>t.desktopEnvironment&&St(e.basePath,t.desktopEnvironment)},{value:`approve`,labelKey:`devices.inventory.approve`,visible:t.pendingRequestId,pairing:!0,run:()=>t.pendingRequestId&&e.onNodeApprove(t.pendingRequestId)},{value:`reject`,labelKey:`devices.inventory.reject`,visible:t.pendingRequestId,pairing:!0,run:()=>t.pendingRequestId&&e.onNodeReject(t.pendingRequestId)},{value:`copy`,labelKey:`devices.inventory.copyDeviceId`,visible:t.deviceId,pairing:!1,run:()=>t.deviceId&&void Kn(t.deviceId)},{value:`editAlias`,labelKey:`devices.inventory.editAlias`,visible:t.onEditAlias,pairing:!0,run:()=>t.onEditAlias?.()},{value:`remove`,labelKey:`devices.inventory.removeAction`,visible:t.onRemove,pairing:!0,run:()=>t.onRemove?.()}];return x`
    <wa-dropdown
      placement="bottom-end"
      @wa-select=${t=>{let r=n.find(e=>e.value===t.detail.item.value);r&&(!r.pairing||e.canManagePairing)&&r.run()}}
    >
      <button
        slot="trigger"
        type="button"
        class="btn btn--sm btn--ghost device-entry__menu-trigger"
        aria-label=${g(`devices.inventory.actionsName`,{name:t.name})}
        title=${g(`devices.inventory.actions`)}
      >
        ${y.moreHorizontal}
      </button>
      ${n.map(t=>t.visible?x`
              <wa-dropdown-item
                value=${t.value}
                ?disabled=${t.pairing&&!e.canManagePairing}
                title=${t.pairing&&!e.canManagePairing?g(`devices.readOnly.pairingRequired`):b}
                variant=${t.value===`remove`?`danger`:b}
                >${g(t.labelKey)}</wa-dropdown-item
              >
            `:b)}
    </wa-dropdown>
  `}function qn(){return(qn=e((()=>{S(),Ct(),v(),Qe(),s(),U(),u(),ee(),H()})))()}function Q(e){return Oe(e,{style:`legacy-binary`,maxUnit:`tera`,separator:` `,fractionDigits:(e,t)=>+(t===`tera`||e<10)})}function Jn(e,t,n,r,i,a=80,o=90){let s=i===void 0?t<a?`ok`:t<o?`warn`:`danger`:`stale`,c=i===void 0?n:`${n} · ${i}`,l=i===void 0?r:`${r} · ${g(`devices.inventory.lastKnown`,{time:i})}`;return x`<span class="device-resource device-resource--${e}" title=${l}>
    <span class="device-resource__label">${c}</span>
    ${Bt({mode:`continuous`,percent:Math.min(100,Math.max(0,t)),tone:s,label:l})}
  </span>`}function Yn(e,n){if(!e)return b;let r=n===void 0?void 0:t(Math.max(0,Date.now()-n)),i=[];if(e.loadAverage&&e.cpuCount>0){let t=g(`devices.inventory.loadTitle`,{averages:e.loadAverage.map(e=>e.toFixed(2)).join(` / `),cores:String(e.cpuCount)});i.push(Jn(`load`,e.loadAverage[0]/e.cpuCount*100,g(`devices.inventory.loadLabel`,{load:e.loadAverage[0].toFixed(1)}),t,r,70,100))}if(e.memoryTotalBytes>0&&e.memoryFreeBytes>=0){let t=e.memoryTotalBytes-e.memoryFreeBytes,n=Q(t),a=Q(e.memoryTotalBytes),o=a.slice(a.lastIndexOf(` `)),s=n.endsWith(o)?n.slice(0,-o.length):n;i.push(Jn(`memory`,t/e.memoryTotalBytes*100,`${s} / ${a}`,g(`devices.inventory.memoryTitle`,{used:n,total:a}),r))}if(e.diskTotalBytes!=null&&e.diskTotalBytes>0&&e.diskAvailableBytes!=null){let t=Q(e.diskAvailableBytes),n=Q(e.diskTotalBytes);i.push(Jn(`disk`,(1-e.diskAvailableBytes/e.diskTotalBytes)*100,g(`devices.inventory.diskLabel`,{available:t}),g(`devices.inventory.diskTitle`,{available:t,total:n}),r))}return i.length?x`<div class="device-resources">${i}</div>`:b}function Xn(){return(Xn=e((()=>{S(),Vt(),s(),U(),c(),H()})))()}function Zn(...e){return[...new Set(e.flatMap(ke))].toSorted()}function Qn(e,t){let n=new Set(e);return t.every(e=>n.has(e))}function $n(e){return{roles:Zn(e.roles,e.role),scopes:Be(e.scopes)}}function er(e){let t=Zn(e.roles,e.role),n=Array.isArray(e.tokens)?e.tokens:e.tokens?Object.values(e.tokens):void 0;return{roles:n===void 0?t:Zn(n.filter(e=>!e.revokedAtMs).flatMap(e=>e.role??[])).filter(e=>t.includes(e)),scopes:Be(e.scopes)}}function tr(e,t){let n=$n(e),r=t?er(t):null;return r?Qn(r.roles,n.roles)?Qn(r.scopes,n.scopes)?{kind:`re-approval`,requested:n,approved:r}:{kind:`scope-upgrade`,requested:n,approved:r}:{kind:`role-upgrade`,requested:n,approved:r}:{kind:`new-pairing`,requested:n,approved:null}}function nr(){return(nr=e((()=>{Ie(),Le()})))()}function rr(e,t,n){let r=new Map(t.map(e=>[E(e.deviceId),e]).filter(e=>!!e[0]));return e.map(e=>or(e,n,ir(r,e)))}function ir(e,t){let n=e.get(E(t.deviceId)??``);if(!n)return;let r=E(t.publicKey),i=E(n.publicKey);if(!(r&&i&&r!==i))return n}function ar(e){return e?g(`devices.inventory.rolesAndScopes`,{roles:i(e.roles),scopes:i(e.scopes)}):g(`devices.inventory.none`)}function or(e,t,n){let r=E(e.displayName)||e.deviceId,i=typeof e.ts==`number`?h(e.ts):g(`common.na`),a=tr(e,n),o=e.isRepair?` · ${g(`devices.inventory.repair`)}`:``;return x`
    <div class="settings-row device-entry">
      ${G(y.monitorSmartphone)}
      <div class="device-entry__body">
        <div class="device-entry__heading">
          <span class="settings-row__title">${r}</span>
          <span class="device-entry__status"
            >${L({kind:`warn`,label:g(`devices.inventory.pendingApproval`)})}</span
          >
        </div>
        <span class="settings-row__desc">
          ${g(`devices.inventory.requestedAt`,{note:g(sr[a.kind]),time:i})}${o}
        </span>
      </div>
      <div class="settings-row__control">
        <button
          class="btn btn--sm"
          ?disabled=${!t.canManagePairing}
          @click=${()=>t.onDeviceApprove(e.requestId)}
        >
          ${g(`devices.inventory.approve`)}
        </button>
        <button
          class="btn btn--sm"
          ?disabled=${!t.canManagePairing}
          @click=${()=>t.onDeviceReject(e.requestId)}
        >
          ${g(`devices.inventory.reject`)}
        </button>
        ${Z(t,{name:r,deviceId:e.deviceId})}
      </div>
      <details class="device-entry__details">
        <summary>${g(`devices.inventory.details`)}</summary>
        <dl class="device-entry__facts">
          ${vn(e.deviceId,e.remoteIp)}
          <dt class="settings-row__desc">${g(`devices.inventory.requestedAccessLabel`)}</dt>
          <dd class="settings-row__value">${ar(a.requested)}</dd>
          ${a.approved?x`<dt class="settings-row__desc">
                    ${g(`devices.inventory.approvedAccessLabel`)}
                  </dt>
                  <dd class="settings-row__value">${ar(a.approved)}</dd>`:b}
        </dl>
      </details>
    </div>
  `}var sr;function cr(){return(cr=e((()=>{S(),nr(),v(),F(),s(),U(),c(),qn(),K(),H(),sr={"scope-upgrade":`devices.inventory.scopeUpgrade`,"role-upgrade":`devices.inventory.roleUpgrade`,"re-approval":`devices.inventory.reapproval`,"new-pairing":`devices.inventory.newPairing`}})))()}function lr(e){let t=tn(e);return{id:e.id,name:e.name,...t}}function ur(e,t,n){if(n&&e.length===0)return``;let r=e.filter(e=>e.primary.connected).length,i=[g(`devices.inventory.summaryConnected`,{connected:String(r),total:String(e.length)})];return t>0&&i.push(g(`devices.inventory.summaryPending`,{count:String(t)})),i.join(` · `)}function dr(e){let{pending:t,paired:n}=e.devicesList??{pending:[],paired:[]},r=Zt({paired:n,nodes:e.nodes,presence:e.presence}),i=$t(e.presence),a=en(e.presence,r),o=Qt(r),s=e.loading||e.devicesLoading,c=x`
    ${o.length>0?x`
            <button
              class="btn btn--sm danger"
              title=${e.canManagePairing?``:g(`devices.readOnly.pairingRequired`)}
              ?disabled=${!e.canManagePairing}
              @click=${()=>e.onInventoryCleanup(o.map(lr))}
            >
              ${y.trash} ${g(`devices.inventory.cleanupStale`,{count:String(o.length)})}
            </button>
          `:b}
    <button
      class="btn"
      title=${e.canPairDevice?``:g(`devices.pairing.adminRequired`)}
      ?disabled=${!e.canPairDevice}
      @click=${e.onDevicePairSetupOpen}
    >
      ${y.plus} ${g(`devices.pairing.button`)}
    </button>
  `,l=r.length===0&&!i,u=x`
    ${i?Cr({kind:`gateway`,entry:i},e):b}
    ${s&&r.length===0?et():l?Xe(g(`devices.inventory.empty`)):r.map(t=>fr(t,e))}
  `;return x`
    ${e.devicesError?x`<div class="callout danger">${e.devicesError}</div>`:b}
    ${e.lastError?x`<div class="callout danger">${e.lastError}</div>`:b}
    ${t.length>0?I({title:g(`devices.inventory.pendingApproval`),count:t.length},rr(t,n,e)):b}
    ${I({title:g(`devices.inventory.title`),description:ur(r,t.length,s),actions:c},u)}
    ${a.length>0?I({title:g(`devices.inventory.connectedWithoutPairing`)},a.map(t=>Cr({kind:`unpaired`,entry:t},e))):b}
  `}function fr(e,t){return e.duplicates.length===0?Sr(e.primary,t):x`
    ${Sr(e.primary,t)}
    <details class="device-group__dups">
      <summary>
        ${g(e.duplicates.length===1?`devices.inventory.olderPairing`:`devices.inventory.olderPairings`,{count:String(e.duplicates.length),name:e.name})}
      </summary>
      ${e.duplicates.map(e=>Sr(e,t))}
    </details>
  `}function pr(e){let t=E(e)?.toLowerCase();return t===`win32`||t===`windows`||t?.startsWith(`windows `)===!0}function mr(e){let t=e.node;return t?.paired?t.approvalState===void 0||t.approvalState===`approved`:!1}function hr(e){let t=E(e.node?.coreVersion);if(t)return t;if(E(e.node?.uiVersion))return;let n=E(e.node?.platform)?.toLowerCase();return n===`darwin`||n===`linux`||n===`win32`||n===`windows`?E(e.node?.version):void 0}function gr(e,t){let n=[],r=(e,t=g(`devices.inventory.${e}Title`))=>n.push(x`<span title=${t}>
        ${L({kind:`warn`,label:g(`devices.inventory.${e}`)})}
      </span>`),i=mr(e),a=hr(e);i&&a&&t&&a!==t&&r(`versionDrift`,g(`devices.inventory.versionDriftTitle`,{nodeVersion:a,gatewayVersion:t})),e.node?.workerBundle?.status===`missing`&&r(`workerMissing`),i&&e.node?.connected===!1&&pr(e.platform)&&r(`manualWake`);let o=e.node?.approvalState;return(o===`pending-approval`||o===`pending-reapproval`)&&n.push(L({kind:`warn`,label:g(`devices.inventory.approvalNeeded`)})),n}function _r(e){return g(`devices.inventory.inputAgo`,{time:t(e*1e3,{suffix:!1})})}function vr(e){let t=[];if(e.platform&&t.push(lt(e.platform,e.deviceFamily)),e.modelIdentifier){let n=xt(e.modelIdentifier);n&&t.push(n),t.push(e.modelIdentifier)}return e.version&&t.push(e.version),t}function yr(e){let t=vr(e);e.node?.workerBundle?.status===`installed`&&t.push(g(`devices.inventory.workerVersion`,{version:e.node.workerBundle.version})),e.connected&&e.presence?.lastInputSeconds!=null?t.push(_r(e.presence.lastInputSeconds)):!e.connected&&e.lastSeenAtMs?t.push(g(`devices.inventory.seen`,{time:h(e.lastSeenAtMs)})):!e.connected&&e.approvedAtMs&&t.push(g(`devices.inventory.approved`,{time:h(e.approvedAtMs)}));for(let n of e.roles)t.push(n);return e.autoApproved&&t.push(g(`devices.inventory.autoPaired`)),t.join(` · `)}function br(e){if(e.length===0)return b;let t=e.slice(0,Er),n=e.length-t.length,r=n>0?` +${n}`:``;return x`<dt class="settings-row__desc">${g(`devices.inventory.commands`)}</dt>
    <dd class="settings-row__value settings-row__value--mono">${i(t)}${r}</dd>`}function xr(e,t){let n=e.device?.tokens??[],r=e.node?.commands??[],i=e.scopes;return x`
    <details class="device-entry__details">
      <summary>${g(`devices.inventory.details`)}</summary>
      <dl class="device-entry__facts">
        ${vn(e.id,e.remoteIp)}
        ${i.length>0?x`<dt class="settings-row__desc">${g(`devices.inventory.scopesLabel`)}</dt>
                <dd class="device-entry__scopes">
                  ${i.map(e=>x`<span class="device-capability device-capability--scope"
                        >${e}</span
                      >`)}
                </dd>`:b}
        ${n.length>0?x`<dt class="settings-row__desc">${g(`devices.inventory.tokens`)}</dt>
                <dd class="device-entry__tokens">
                  <table
                    class="device-token-table settings-table--stacked"
                    role="table"
                    aria-label=${g(`devices.inventory.tokens`)}
                  >
                    <thead>
                      <tr>
                        <th scope="col">${g(`devices.inventory.tokenRole`)}</th>
                        <th scope="col">${g(`devices.inventory.tokenStatus`)}</th>
                        <th scope="col">${g(`devices.inventory.scopesLabel`)}</th>
                        <th scope="col">${g(`devices.inventory.tokenAge`)}</th>
                        <th scope="col">${g(`devices.inventory.actions`)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${n.map(n=>Tr({id:e.id,name:e.name},n,t))}
                    </tbody>
                  </table>
                </dd>`:b}
        ${br(r)}
      </dl>
    </details>
  `}function Sr(e,t){let n=Rn({workerSlots:e.node?.workerSlots,capabilities:e.node?.caps,commands:e.node?.commands,unavailable:e.node?.connected!==!0||!mr(e)}),r=e.node?.approvalState===`pending-approval`||e.node?.approvalState===`pending-reapproval`?e.node.pendingRequestId:void 0,i=Gn(t,`node:${e.id}`),a=e.node?.connected??e.connected,o=L({kind:a?`ok`:`muted`,label:g(a?`devices.inventory.connected`:`devices.inventory.offline`)});return x`
    <div class="settings-row device-entry" title=${n?.title??b}>
      ${G(_n(e))}
      <div class="device-entry__body">
        <div class="device-entry__heading">
          <span class="settings-row__title">${e.name}</span>
          <span class="device-entry__status">${o}</span>
        </div>
        <span class="settings-row__desc">${yr(e)}</span>
        ${Yn(e.node?.hostStats,a?void 0:e.node?.hostStats?.updatedAtMs)}
        ${Vn(e.node?.caps??[])}
      </div>
      <div class="settings-row__control">
        ${n?.meter??b} ${gr(e,t.gatewayVersion)}
        ${wr(t,i,e.node?.commands)}
        ${Z(t,{name:e.name,deviceId:e.id,desktopEnvironment:i,pendingRequestId:r,onEditAlias:e.device?()=>t.onDeviceRename({id:e.id,name:e.name,operatorLabel:e.device?.operatorLabel}):void 0,onRemove:()=>t.onInventoryRemove(lr(e))})}
      </div>
      ${xr(e,t)}
    </div>
  `}function Cr(e,t){let{entry:n}=e,r=e.kind===`gateway`,i=vr(n);n.lastInputSeconds!=null&&i.push(_r(n.lastInputSeconds)),r&&t.gatewaySystemInfo&&i.push(g(`devices.inventory.uptime`,{time:Ee(t.gatewaySystemInfo.uptimeMs)??``})),!r&&Array.isArray(n.roles)&&i.push(...n.roles.filter(Boolean));let a=r?y.server:_n({clientMode:n.mode??void 0,platform:n.platform??void 0,modelIdentifier:n.modelIdentifier??void 0}),o=r?n.host??g(`devices.execApprovals.gateway`):n.host??n.mode??g(`devices.inventory.unknownClient`),s=r?Gn(t,`gateway`):void 0;return x`
    <div class="settings-row device-entry">
      ${G(a)}
      <div class="device-entry__body">
        <div class="device-entry__heading">
          <span class="settings-row__title">${o}</span>
          <span class="device-entry__status">
            ${L({kind:r?`accent`:`muted`,label:g(r?`devices.inventory.gateway`:`devices.inventory.unpaired`)})}
          </span>
        </div>
        ${i.length>0?x`<span class="settings-row__desc">${i.join(` · `)}</span>`:b}
        ${r?Yn(t.gatewaySystemInfo):b}
      </div>
      <div class="settings-row__control">
        ${wr(t,s)}
        ${Z(t,{name:o,deviceId:n.deviceId,desktopEnvironment:s})}
      </div>
    </div>
  `}function wr(e,t,n){return t?x`<button
      class="btn btn--sm device-entry__desktop"
      title=${g(`devices.inventory.desktopOpenWindow`)}
      @click=${()=>St(e.basePath,t)}
    >
      ${y.monitor} ${g(`devices.inventory.desktop`)}
    </button>`:n?.includes(`desktop.stream`)?x`<span
        class="device-capability device-capability--disabled"
        aria-disabled="true"
        title=${g(`devices.inventory.desktopEnableHint`)}
        >${y.monitor} ${g(`devices.inventory.desktop`)}</span
      >`:b}function Tr(e,t,n){let r=t.revokedAtMs?g(`devices.inventory.revoked`):g(`devices.inventory.active`),a=i(t.scopes),o=h(t.rotatedAtMs??t.createdAtMs??t.lastUsedAtMs??null);return x`
    <tr>
      <td data-label=${g(`devices.inventory.tokenRole`)}>${t.role}</td>
      <td data-label=${g(`devices.inventory.tokenStatus`)}>${r}</td>
      <td data-label=${g(`devices.inventory.scopesLabel`)}>${a}</td>
      <td data-label=${g(`devices.inventory.tokenAge`)}>${o}</td>
      <td data-label=${g(`devices.inventory.actions`)}>
        <div class="device-entry__token-actions">
          <button
            class="btn btn--sm"
            ?disabled=${!n.canManagePairing}
            @click=${()=>n.onDeviceRotate(e,t.role,t.scopes)}
          >
            ${g(`devices.inventory.rotate`)}
          </button>
          ${t.revokedAtMs?b:x`
                  <button
                    class="btn btn--sm danger"
                    ?disabled=${!n.canManagePairing}
                    @click=${()=>n.onDeviceRevoke(e.id,t.role)}
                  >
                    ${g(`devices.inventory.revoke`)}
                  </button>
                `}
        </div>
      </td>
    </tr>
  `}var Er;function Dr(){return(Dr=e((()=>{S(),Ct(),v(),F(),zn(),s(),U(),De(),c(),vt(),W(),_t(),Wn(),qn(),Xn(),cr(),K(),H(),Er=16})))()}function Or(e){let t=kr(e),n=An(e);return Ze(x`
      ${!e.canManagePairing||!e.canAdmin?x`<div class="callout info" role="note">
              ${g(!e.canManagePairing&&!e.canAdmin?`devices.readOnly.pairingAndAdminRequired`:e.canManagePairing?`devices.readOnly.adminRequired`:`devices.readOnly.pairingRequired`)}
            </div>`:b}
      ${dr(e)} ${jn(n)}
      ${Ar(t)}
    `,{wide:!0})}function kr(e){return{...e,...Nr(e.configForm),ready:!!e.configForm,disabled:!e.canAdmin||e.configLoading||e.configSaving||e.configFormMode===`raw`,nodes:gn(e.nodes,[`system.run`]),inventory:cn({nodes:e.nodes})}}function Ar(e){let t=e.nodes.length>0,n=x`
    <button
      class="btn"
      ?disabled=${e.disabled||!e.configDirty}
      @click=${e.onSaveBindings}
    >
      ${e.configSaving?g(`common.saving`):g(`common.save`)}
    </button>
  `,r=x`
    ${e.canAdmin?b:R({title:g(`devices.readOnly.adminRequired`)})}
    ${e.configFormMode===`raw`?R({title:g(`devices.binding.formModeHint`)}):b}
    ${e.ready?x`
            ${R({title:g(`devices.binding.defaultBinding`),description:t?g(`devices.binding.defaultBindingHint`):x`${g(`devices.binding.defaultBindingHint`)} ${g(`devices.binding.noNodes`)}`,control:Mr(null,e)})}
            ${e.agents.map(t=>jr(t,e))}
          `:R({title:g(`devices.binding.loadConfigHint`),control:x`
              <button class="btn" ?disabled=${e.configLoading} @click=${e.onLoadConfig}>
                ${e.configLoading?g(`common.loading`):g(`common.loadConfig`)}
              </button>
            `})}
  `;return I({title:g(`devices.binding.execNodeBinding`),description:g(`devices.binding.execNodeBindingSubtitle`),actions:n},r)}function jr(e,t){let n=e.binding??`__default__`,r=e.name?.trim()?`${e.name} (${e.id})`:e.id;return R({title:r,description:x`
      ${e.isDefault?g(`devices.binding.defaultAgent`):g(`devices.binding.agent`)} ·
      ${n===`__default__`?g(`devices.binding.usesDefault`,{node:t.defaultBinding??g(`devices.binding.any`)}):g(`devices.binding.override`,{node:e.binding??``})}
    `,control:Mr(e,t)})}function Mr(e,t){let n=e===null,r=n?``:`__default__`,i=n?t.defaultBinding??``:e.binding??`__default__`,a;if(i!==r)try{a=pn(t.inventory,i)}catch{}let o=t.nodes.map(e=>({...e,id:e.id===a?i:e.id,disabled:!1}));return i!==r&&!o.some(e=>e.id===i)&&o.push({id:i,label:`${i} (${g(`devices.binding.unavailable`)})`,disabled:!0}),x`
    <select
      class="settings-select"
      aria-label=${g(n?`devices.binding.node`:`devices.binding.binding`)}
      .value=${C(i)}
      ?disabled=${t.disabled||t.nodes.length===0&&i===r}
      @change=${n=>{let r=n.target.value.trim();e===null?t.onBindDefault(r||null):t.onBindAgent(e.id,r===`__default__`?null:r)}}
    >
      <option value=${r} ?selected=${i===r}>
        ${g(n?`devices.binding.anyNode`:`devices.binding.useDefault`)}
      </option>
      ${Se(o,e=>e.id,e=>x`<option
            value=${e.id}
            ?selected=${i===e.id}
            ?disabled=${e.disabled}
          >
            ${e.label}
          </option>`)}
    </select>
  `}function Nr(e){let t={id:`main`,name:void 0,isDefault:!0,binding:null};if(!e)return{defaultBinding:null,agents:[t]};let n=(e.tools??{}).exec??{},r=Ae(n.node),i=hn(e).map(e=>{let t=(e.record.tools??{}).exec??{};return{id:e.id,name:e.name,isDefault:e.isDefault,binding:Ae(t.node)}});return{defaultBinding:r,agents:i.length===0?[t]:i}}function Pr(){return(Pr=e((()=>{S(),xe(),Ce(),ln(),mn(),F(),s(),U(),Ln(),Dr(),K(),H()})))()}var Fr,Ir,Lr,$;function Rr(){return(Rr=e((()=>{Fe(),Ge(),S(),ye(),He(),ae(),oe(),he(),le(),pe(),Ut(),F(),rt(),s(),U(),ne(),l(),W(),B(),mt(),dt(),o(),ft(),a(),sn(),Pr(),H(),Fr=`http://127.0.0.1:18789/nodes`,Ir=3e4,Lr=6e4,$=class extends p{constructor(...e){super(...e),this.presence=[],this.gatewaySystemInfo=null,this.desktopEnvironments=[],this.systemInfoUnavailable=!1,this.pageState=Pt(),this.canManagePairing=!1,this.canAdmin=!1,this.execApprovalsTarget=`gateway`,this.execApprovalsTargetNodeId=null,this.dialogs=new on({canManagePairing:()=>this.canManagePairing,gatewayConnected:()=>this.gateway.connected,requestGeneration:()=>this.requestGeneration,gatewayClient:()=>this.gateway.client,gatewayUrl:()=>this.context.gateway.connection.gatewayUrl,runPageTask:e=>this.runPageTask(e),setDevicesError:e=>{this.pageState.devicesError=e,this.requestUpdate()}}),this.routeDataInitialized=!1,this.gateway=new ut(this,{getGateway:()=>this.context?.gateway,onIdentityChange:e=>this.resetServerState(e.snapshot),invalidateRequests:e=>{this.pageState.requestGeneration=this.gateway.epoch,!e.identityChanged&&e.snapshot.phase!==`connected`&&this.resetServerState(e.snapshot),this.presenceTask.run([null,null])},onSnapshot:e=>this.handleGatewaySnapshot(e),ensureInitialData:()=>this.ensureInitialData()}),this.presenceTask=new M(this,{autoRun:!1,args:()=>[this.gateway.connected?this.gateway.gateway:null,this.gateway.connected?this.gateway.client:null],task:([e,t],{signal:n})=>e&&t?t.request(`system-presence`,{},{signal:n}):N,onComplete:e=>{Array.isArray(e)&&(this.presence=e)},onError:e=>{d(e)&&(this.presence=[])}}),this.systemInfoTask=new M(this,{args:()=>[this.gateway.gateway,this.canLoadSystemInfo?this.gateway.client:null],task:([e,t],{signal:n})=>e&&t?pt(e,n).then(e=>e.value):N,onComplete:e=>{this.gatewaySystemInfo=e,this.systemInfoPolling.stop(),this.systemInfoPolling.start()},onError:e=>{d(e)&&(this.gatewaySystemInfo=null,this.systemInfoUnavailable=!0,this.systemInfoPolling.stop())}}),this.environmentsTask=new M(this,{args:()=>[this.gateway.gateway,this.canLoadDesktopEnvironments?this.gateway.client:null],task:([e,t],{signal:n})=>e&&t?t.request(`environments.list`,{},{signal:n}):N,onComplete:e=>{this.desktopEnvironments=e.environments},onError:()=>{this.desktopEnvironments=[]}}),this.systemInfoPolling=new gt(this,Lr,()=>this.refreshSystemInfo(),!1,`visible`),this.polling=new gt(this,Ir,()=>{this.refreshNodeInventory(!0),this.canManagePairing&&this.runPageTask(e=>V(e,{quiet:!0}))},!1,`visible`),this.subscriptions=new n(this).watchStore(()=>this.context?.runtimeConfig).effect(()=>this.context?.gateway,e=>e.subscribeEvents(t=>{if(this.gateway.gateway!==e||this.context.gateway!==e)return;let n=t.event===`presence`?_(t.payload):null;if(n){let e=nn(n)!==nn(this.presence);this.presenceTask.run([null,null]),this.presence=n,e&&(this.canManagePairing&&this.runPageTask(e=>V(e,{quiet:!0})),this.refreshNodeInventory(!0))}(t.event===`device.pair.changed`||t.event===`device.pair.requested`||t.event===`device.pair.resolved`)&&this.canManagePairing&&this.runPageTask(e=>V(e,{quiet:!0})),(t.event===`node.pair.requested`||t.event===`node.pair.resolved`||t.event===`node.runnerInventory.changed`||t.event===`node.hostStats`)&&this.refreshNodeInventory(!0)}))}willUpdate(e){e.has(`routeData`)&&this.applyRouteData()}updated(e){e.has(`routeData`)&&this.ensureInitialData()}disconnectedCallback(){this.dialogs.cancel(),this.subscriptions.clear(),this.presenceTask.run([null,null]),this.resetInventoryDetails(),this.presence=[],this.canManagePairing=!1,this.canAdmin=!1,super.disconnectedCallback()}get requestGeneration(){return this.pageState.requestGeneration}handleGatewaySnapshot(e){let t=e.snapshot;this.pageState.client=t.client,this.pageState.connected=t.phase===`connected`,this.pageState.requestGeneration=this.gateway.epoch;let n=t.phase===`connected`,r=t.hello?.auth??null;if(this.canAdmin=n&&_e(r),this.canManagePairing=n&&(!r||ge(r)),this.canLoadSystemInfo||(this.systemInfoTask.run([null,null]),this.gatewaySystemInfo=null),this.canLoadDesktopEnvironments||(this.environmentsTask.run([null,null]),this.desktopEnvironments=[]),this.routeDataInitialized&&t.phase===`connected`&&t.client&&(e.identityChanged||e.connectionChanged)){let e=_(t.hello?.snapshot);this.presence=e??[],this.loadPresence()}this.syncPolling()}applyRouteData(){let e=this.routeData;if(!e)return;this.routeDataInitialized=!0;let t=this.context.gateway.snapshot;if(!this.gateway.isRouteDataCurrent(e)){this.resetServerState(t),this.presence=_(t.hello?.snapshot)??[],this.loadPresence(),this.ensureInitialData();return}this.pageState={...e.devices,client:t.client,connected:t.phase===`connected`,requestGeneration:this.gateway.epoch};let n=_(t.hello?.snapshot);n&&(this.presence=n),this.loadPresence()}resetServerState(e){this.dialogs.cancel(),this.pageState.requestGeneration+=1;let t=Pt({client:e.client,connected:e.phase===`connected`});t.requestGeneration=this.gateway.epoch,this.pageState=t,this.presenceTask.run([null,null]),this.presence=[],this.resetInventoryDetails()}async runPageTask(e){let t=this.pageState;try{let n=e(t);return this.pageState===t&&this.requestUpdate(),await n}finally{this.pageState===t&&this.requestUpdate()}}runAdminTask(e){this.canAdmin&&this.runPageTask(e)}bindNode(e,t){if(!this.canAdmin)return;let n=this.context.runtimeConfig,r=t===void 0?{path:[]}:n.agentEntry(t,{ensure:!!e});if(!r)return;let i=[...r.path,`tools`,`exec`,`node`];e?n.patchForm(i,e):n.removeFormValue(i)}ensureInitialData(){let e=this.pageState;if(!e.connected||!e.client||!this.routeDataInitialized)return;!e.nodes.length&&!e.nodesLoading&&this.refreshNodeInventory(),this.canManagePairing&&!e.devicesList&&!e.devicesLoading&&this.runPageTask(e=>V(e));let t=this.context.runtimeConfig.state;!t.configSnapshot&&!t.configLoading&&this.context.runtimeConfig.refresh(),this.canAdmin&&!e.execApprovalsSnapshot&&!e.execApprovalsLoading&&this.runPageTask(e=>Ft(e,this.resolveExecApprovalsTarget()))}syncPolling(){if(this.canLoadSystemInfo?this.systemInfoPolling.start():this.systemInfoPolling.stop(),this.gateway.connected&&this.gateway.client){this.polling.start();return}this.polling.stop()}get canLoadSystemInfo(){let e=this.gateway.snapshot;return this.isConnected&&!this.systemInfoUnavailable&&ht(e)}get canLoadDesktopEnvironments(){let e=this.gateway.snapshot;return this.isConnected&&!!(e&&de(e))}refreshSystemInfo(){this.canLoadSystemInfo&&this.systemInfoTask.status!==We.PENDING&&this.systemInfoTask.run()}refreshNodeInventory(e=!1){this.refreshSystemInfo(),this.canLoadDesktopEnvironments&&this.environmentsTask.status!==We.PENDING&&this.environmentsTask.run(),this.runPageTask(t=>Et(t,{quiet:e}))}resetInventoryDetails(){this.systemInfoTask.run([null,null]),this.environmentsTask.run([null,null]),this.systemInfoPolling.stop(),this.gatewaySystemInfo=null,this.desktopEnvironments=[],this.systemInfoUnavailable=!1}loadPresence(){let e=this.gateway.gateway,t=this.gateway.client;return!e||!this.gateway.connected||!t?Promise.resolve():this.presenceTask.run([e,t])}async reportRotationOutcome(e,t,n){if(!this.canManagePairing)return;let r=await this.runPageTask(r=>wt(r,{deviceId:e.id,gatewayUrl:this.context.gateway.connection.gatewayUrl,role:t,scopes:n}));r&&await(r.delivery===`in-band`?Ht({title:g(`devices.inventory.rotatePromptTitle`,{role:t}),message:g(`devices.inventory.rotatePromptBody`),secret:r.token,acknowledgeLabel:g(`devices.inventory.rotateAcknowledge`),dismissHint:g(`devices.inventory.rotateDismissHint`)}):Ht({title:g(`devices.inventory.rotateWithheldTitle`,{device:e.name}),status:`success`,message:g(`devices.inventory.rotateWithheldNext`),callout:g(`devices.inventory.rotateWithheldException`),acknowledgeLabel:g(`common.close`),note:g(`devices.inventory.rotateWithheldNote`)}))}async changeExecApprovalsTarget(e,t){let n=this.pageState;if(n.execApprovalsDirty&&!await this.dialogs.confirmExecApprovalsDiscard()){this.requestUpdate();return}this.pageState===n&&(this.execApprovalsTarget=e,this.execApprovalsTargetNodeId=t,n.execApprovalsSnapshot=null,n.execApprovalsForm=null,n.execApprovalsDirty=!1,n.execApprovalsSelectedAgent=null,this.requestUpdate())}resolveExecApprovalsTarget(){return this.execApprovalsTarget===`node`&&this.execApprovalsTargetNodeId?{kind:`node`,nodeId:this.execApprovalsTargetNodeId}:{kind:`gateway`}}render(){let e=this.pageState,t=this.context.runtimeConfig.state,n=this.context.gateway.snapshot,r=n.phase===`connected`&&n.hello?.server?.version?.trim()||null;return x`
      <section class="content-header" ${me({toolbarHeader:!0})}>
        <div>
          <div class="page-title">${se(`devices`)}</div>
          <div class="page-subtitle">
            ${ve(`devices`)} ${$e(Fr)}
          </div>
        </div>
      </section>
      ${ct(Or({loading:e.nodesLoading,nodes:e.nodes,presence:this.presence,gatewayVersion:r,basePath:this.context.basePath,gatewaySystemInfo:this.gatewaySystemInfo,desktopEnvironments:this.desktopEnvironments,lastError:e.lastError,devicesLoading:e.devicesLoading,devicesError:e.devicesError,devicesList:e.devicesList,canPairDevice:this.canAdmin,canManagePairing:this.canManagePairing,canAdmin:this.canAdmin,configForm:f(t),configLoading:t.configLoading,configSaving:t.configSaving,configDirty:t.configFormDirty,configFormMode:t.configFormMode,execApprovalsLoading:e.execApprovalsLoading,execApprovalsSaving:e.execApprovalsSaving,execApprovalsDirty:e.execApprovalsDirty,execApprovalsSnapshot:e.execApprovalsSnapshot,execApprovalsForm:e.execApprovalsForm,execApprovalsSelectedAgent:e.execApprovalsSelectedAgent,execApprovalsTarget:this.execApprovalsTarget,execApprovalsTargetNodeId:this.execApprovalsTargetNodeId,onDevicePairSetupOpen:()=>{this.canAdmin&&this.context.overlays.openDevicePairSetup()},onDeviceApprove:e=>{this.canManagePairing&&this.runPageTask(t=>It(t,e))},onDeviceReject:e=>void this.dialogs.confirmPairingReject(`device`,e),onNodeApprove:e=>{this.canManagePairing&&this.runPageTask(t=>Mt(t,e))},onNodeReject:e=>void this.dialogs.confirmPairingReject(`node`,e),onInventoryRemove:e=>void this.dialogs.confirmInventoryRemoval({kind:`entry`,entry:e}),onInventoryCleanup:e=>{e.length>0&&this.dialogs.confirmInventoryRemoval({kind:`stale`,entries:e})},onDeviceRotate:(e,t,n)=>void this.reportRotationOutcome(e,t,n),onDeviceRevoke:(e,t)=>void this.dialogs.confirmTokenRevoke(e,t),onDeviceRename:e=>void this.dialogs.editAlias(e),onLoadConfig:()=>void this.context.runtimeConfig.discardDraft({reloadOnly:!0}),onLoadExecApprovals:()=>this.runAdminTask(e=>Ft(e,this.resolveExecApprovalsTarget())),onBindDefault:e=>this.bindNode(e),onBindAgent:(e,t)=>this.bindNode(t,e),onSaveBindings:()=>{this.canAdmin&&this.context.runtimeConfig.save()},onExecApprovalsTargetChange:(e,t)=>void this.changeExecApprovalsTarget(e,t),onExecApprovalsSelectAgent:t=>{e.execApprovalsSelectedAgent=t,this.requestUpdate()},onExecApprovalsPatch:(e,t)=>this.runAdminTask(n=>zt(n,e,t)),onExecApprovalsRemove:e=>this.runAdminTask(t=>Ot(t,e)),onSaveExecApprovals:()=>this.runAdminTask(e=>Rt(e,this.resolveExecApprovalsTarget()))}))}
    `}},k([Pe({context:ue,subscribe:!0})],$.prototype,`context`,void 0),k([be({attribute:!1})],$.prototype,`routeData`,void 0),k([w()],$.prototype,`presence`,void 0),k([w()],$.prototype,`gatewaySystemInfo`,void 0),k([w()],$.prototype,`desktopEnvironments`,void 0),k([w()],$.prototype,`pageState`,void 0),k([w()],$.prototype,`canManagePairing`,void 0),k([w()],$.prototype,`canAdmin`,void 0),k([w()],$.prototype,`execApprovalsTarget`,void 0),k([w()],$.prototype,`execApprovalsTargetNodeId`,void 0),customElements.get(`zero-devices-page`)||customElements.define(`zero-devices-page`,$)})))()}Rr();
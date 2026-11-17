import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Pu as t,zu as n}from"./control-ui-core-DCNBgr3X.js";import{Fi as r}from"./control-ui-core-DwX5Mpz4.js";import{G as i,J as a,W as o}from"./lit-runtime-B40xFCK_.js";import{It as s,zt as c}from"./control-ui-boot-shared-BX8huZUb.js";import{n as l,t as u}from"./en-debug-e3KftVZv.js";import{t as d}from"./sparkline-tile-BPsmVwfI.js";function f(e,t){let n=[];for(let r of e){let e=t(r.status),i=typeof e==`number`?{value:e}:e;i&&Number.isFinite(i.value)?n.push({...i,at:r.at}):n.length=0}return n}function p(e){return`${Math.round(e*100)}%`}function m(e){return n(`debug.overlay.memoryMb`,{value:String(Math.round(e/1048576))})}function h(e){return s(e)??n(`common.na`)}function g(e,t){let r=e.eventLoop,o=r?.reasons??[],s=o.includes(`cpu`)||o.includes(`event_loop_utilization`),c=f(t,e=>{let t=e.eventLoop?.cpuCoreRatio;if(t===void 0)return;let r=e.eventLoop?.cpuBreakdown,i=[r?.mainThreadCoreRatio,r?.workerCoreRatio,r?.otherThreadsCoreRatio];return{value:t,secondary:n(`debug.overlay.hostShort`,{value:_(r?.hostUtilization)}),stack:i.every(e=>typeof e==`number`)?i:void 0}}),l=r?.cpuBreakdown;return a`
    <zero-tooltip class="gateway-cpu-tooltip" placement="top-start" open-on-click auto-size>
      <button
        type="button"
        class="gateway-cpu-trigger"
        aria-label=${n(`debug.overlay.cpuBreakdown`)}
      >
        <zero-sparkline
          class="gateway-vital gateway-vital--cpu"
          data-degraded=${s?``:i}
          .label=${n(`debug.overlay.cpu`)}
          .sub=${n(`debug.overlay.gatewayCpuScope`)}
          .samples=${c}
          .format=${p}
          .floorMax=${1}
          .stackColors=${[`var(--cpu-main)`,`var(--cpu-workers)`,`var(--cpu-other)`]}
        ></zero-sparkline>
      </button>
      <div slot="content" class="gateway-cpu-detail">
        <strong>${n(`debug.overlay.cpuBreakdownCurrent`)}</strong>
        <dl>
          <div class="gateway-cpu-detail__total">
            <dt>${n(`debug.overlay.gatewayCpuProcess`)}</dt>
            <dd>${_(r?.cpuCoreRatio)}</dd>
          </div>
          ${v(n(`debug.overlay.mainThreadCpu`),l?.mainThreadCoreRatio,`main`)}
          ${v(n(`debug.overlay.workerCpu`),l?.workerCoreRatio,`workers`)}
          ${v(n(`debug.overlay.otherThreadCpu`),l?.otherThreadsCoreRatio,`other`)}
          <div class="gateway-cpu-detail__host">
            <dt>
              ${l?.hostCpuCount==null?n(`debug.overlay.hostCpu`):n(`debug.overlay.hostCpuCount`,{count:String(l.hostCpuCount)})}
            </dt>
            <dd>${_(l?.hostUtilization)}</dd>
          </div>
          <div>
            <dt>${n(`debug.overlay.loopUtilization`)}</dt>
            <dd>${_(r?.utilization)}</dd>
          </div>
        </dl>
      </div>
    </zero-tooltip>
  `}function _(e){return typeof e==`number`?p(e):`—`}function v(e,t,n){return a`<div class="gateway-cpu-detail__thread">
    <dt>
      <span class="gateway-cpu-key gateway-cpu-key--${n}" aria-hidden="true"></span>${e}
    </dt>
    <dd>${n===`other`&&typeof t==`number`?`≈`:``}${_(t)}</dd>
  </div>`}function y(e,t){let r=typeof e.processMemory?.heapUsedBytes==`number`?n(`debug.overlay.heapShort`,{value:m(e.processMemory.heapUsedBytes)}):``;return a`<zero-sparkline
    class="gateway-vital gateway-vital--memory"
    .label=${n(`debug.overlay.memory`)}
    .sub=${r}
    .samples=${f(t,e=>e.processMemory?.rssBytes)}
    .format=${m}
    autorange
  ></zero-sparkline>`}function b(e,t){let r=e.eventLoop,o=r?.reasons?.includes(`event_loop_delay`),s=typeof r?.delayMaxMs==`number`?n(`debug.overlay.maxShort`,{value:h(r.delayMaxMs)}):``;return a`
    <div class="gateway-vitals">
      ${g(e,t)} ${y(e,t)}
      <zero-sparkline
        class="gateway-vital gateway-vital--delay"
        data-degraded=${o?``:i}
        .label=${n(`debug.overlay.delayP99`)}
        .sub=${s}
        .samples=${f(t,e=>e.eventLoop?.delayP99Ms)}
        .format=${h}
        .floorMax=${20}
      ></zero-sparkline>
    </div>
  `}function x(){return(x=e((()=>{o(),r(),t(),u(),c(),d(),l()})))()}export{b as a,y as i,x as n,g as r,f as t};
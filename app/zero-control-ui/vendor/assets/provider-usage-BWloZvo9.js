import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Pu as t,W as n,bu as r,j as i,xu as a,zu as o}from"./control-ui-core-DCNBgr3X.js";import{G as s,J as c,W as l}from"./lit-runtime-B40xFCK_.js";function u(e){return/\b\d+(?:m|h)\b/iu.test(e)&&!/\b168h\b/iu.test(e)?0:/\b(?:week|168h)\b/iu.test(e)?1:2}function d(e){let t=new Map;for(let n of e){let e=n.groupLabel??``,r=t.get(e)??[];r.push(n),t.set(e,r)}for(let e of t.values())e.sort((e,t)=>u(e.label)-u(t.label));return t}function f(e){let t=e.trim().toUpperCase();if([`USD`,`EUR`,`GBP`,`CNY`,`JPY`].includes(t)){let e=new Intl.NumberFormat(void 0,{style:`currency`,currency:t,maximumFractionDigits:t===`JPY`?0:2});return t=>e.format(t)}let n=new Intl.NumberFormat(void 0,{maximumFractionDigits:2});return t=>`${n.format(t)} ${e}`}function p(e){return!e||!Number.isFinite(e)?null:new Intl.DateTimeFormat(void 0,{month:`short`,day:`numeric`,hour:`numeric`,minute:`2-digit`}).format(new Date(e))}function m(e){return(e.billing??[]).map(e=>{let t=e.label??o(`usage.providerUsage.${e.type}`),n=f(e.unit),r=e.type===`budget`?`${n(e.used)} / ${n(e.limit)}`:n(e.amount);return c`
      <div class="provider-usage-billing-row">
        <span>${t}</span>
        <strong>${r}</strong>
      </div>
    `})}function h(e,t){let n=new Date,r=Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()),i=r-(Math.max(1,t)-1)*864e5;return e.daily.reduce((e,t)=>{let n=Date.parse(`${t.date}T00:00:00Z`);return Number.isFinite(n)&&n>=i&&n<=r?e+t.amount:e},0)}function g(e,t,n){return t.length>0?c`<div class="provider-cost-breakdown">
        <span class="provider-cost-breakdown__title">${e}</span>
        ${t.slice(0,3).map(e=>c`<div>
              <span>${e.name}</span><strong>${n(e)}</strong>
            </div>`)}
      </div>`:s}function _(e){let t=e.costHistory;if(!t||t.daily.length===0)return s;let n=0,r=0,a={requests:0,input:0,cache:0,output:0};for(let e of t.daily)n=Math.max(n,e.amount),r+=e.amount,a.requests+=e.requests??0,a.input+=e.inputTokens,a.cache=a.cache+e.cacheReadTokens+e.cacheWriteTokens,a.output+=e.outputTokens;let l=i(a.input),u=i(a.cache),d=i(a.output),p=[[o(`usage.providerUsage.today`),h(t,1)],[o(`usage.providerUsage.last7Days`),h(t,7)],[o(`usage.providerUsage.lastDays`,{count:String(t.periodDays)}),r]],m=f(t.unit);return c`
    <div class="provider-cost-history">
      <div class="provider-cost-windows">
        ${p.map(([e,t])=>c`
            <div class="provider-cost-window">
              <span>${e}</span>
              <strong>${m(t)}</strong>
            </div>
          `)}
      </div>
      <div
        class="provider-cost-chart"
        role="group"
        aria-label=${o(`usage.providerUsage.dailyCost`)}
      >
        ${t.daily.map(e=>{let t=e.amount>0&&n>0?Math.max(3,e.amount/n*100):0,r=`${e.date}: ${m(e.amount)}`;return c`<span
            role="img"
            style=${`height: ${t}%`}
            title=${r}
            aria-label=${r}
          ></span>`})}
      </div>
      <div class="provider-cost-tokens">
        ${a.requests>0?c`<span
                >${o(`usage.providerUsage.requests`,{count:new Intl.NumberFormat().format(a.requests)})}</span
              >`:s}
        <span>${o(`usage.providerUsage.inputTokens`,{count:l})}</span>
        <span>${o(`usage.providerUsage.cacheTokens`,{count:u})}</span>
        <span>${o(`usage.providerUsage.outputTokens`,{count:d})}</span>
      </div>
      ${t.models.length>0||t.categories.length>0?c`
              <div class="provider-cost-breakdowns">
                ${g(o(`usage.providerUsage.topModels`),t.models,e=>i(e.totalTokens))}
                ${g(o(`usage.providerUsage.costCategories`),t.categories,e=>m(e.amount))}
              </div>
            `:s}
    </div>
  `}function v(e){let t=Math.max(0,Math.min(100,e.usedPercent)),n=Math.max(0,100-t),r=n<=10?`danger`:n<=25?`warn`:`ok`,i=o(`usage.providerUsage.remaining`,{percent:n.toFixed(0)}),a=p(e.resetAt);return c`
    <div class="provider-usage-window">
      <div class="provider-usage-window__meta">
        <span>${e.label}</span>
        <strong>${i}</strong>
      </div>
      <div
        class=${`provider-usage-progress provider-usage-progress--${r}`}
        role="progressbar"
        aria-label=${e.label}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${n.toFixed(0)}
        aria-valuetext=${i}
      >
        <span style=${`width: ${n}%`}></span>
      </div>
      ${a?c`<div class="provider-usage-reset">
              ${o(`usage.providerUsage.resets`,{date:a})}
            </div>`:s}
    </div>
  `}function y(e,t={}){return e.error?c`<div class="provider-usage-error">${r(e.error)}</div>`:c`
    ${e.windows.length>0?t.groupWindows?c`
              <div class="provider-usage-windows provider-usage-windows--grouped">
                ${Array.from(d(e.windows),([e,t])=>c`
                    <div
                      class="provider-usage-window-group"
                      role="group"
                      aria-label=${e||s}
                    >
                      ${e?c`<div class="provider-usage-window-group__title">${e}</div>`:s}
                      <div class="provider-usage-window-group__windows">
                        ${t.map(e=>v(e))}
                      </div>
                    </div>
                  `)}
              </div>
            `:c`
              <div class="provider-usage-windows">
                ${e.windows.map(e=>v(e))}
              </div>
            `:s}
    ${e.billing&&e.billing.length>0?c`<div class="provider-usage-billing">${m(e)}</div>`:s}
    ${_(e)}
    ${e.summary?c`<div class="provider-usage-summary">${e.summary}</div>`:s}
  `}function b(){return(b=e((()=>{l(),t(),a(),n()})))()}export{y as n,b as t};
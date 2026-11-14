import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gu as t,Pu as n,V as r,W as i,Wu as a,bu as o,xu as s,zu as c}from"./control-ui-core-DCNBgr3X.js";import{ca as l,sa as u}from"./control-ui-core-DwX5Mpz4.js";import{G as d,J as f,W as p}from"./lit-runtime-B40xFCK_.js";import{It as m,zt as h}from"./control-ui-boot-shared-BX8huZUb.js";import{D as g,T as _}from"./control-ui-boot-shared-E4pYPcWx.js";import{bt as v,vt as y}from"./control-ui-boot-shared-ZuP0LiFD.js";import{a as b,c as x,d as S,f as C,i as w,n as T,o as E,r as D,s as O,t as k,u as A}from"./logbook-controller-DPWAbb1v.js";var j,M;function N(){return(N=e((()=>{t(),j={logbook:{nav:{previousDay:`Previous day`,nextDay:`Next day`,today:`Today`},status:{capturing:`Capturing every {seconds}s`,paused:`Capture paused`,disabled:`Capture off`,nodeHelp:`Device providing screen snapshots.`,pending:`{count} frames queued`,pendingHelp:`Snapshots waiting for the next analysis batch.`,analyzing:`Analyzing…`,captureError:`Capture error`,batchError:`Analysis error`,modelMissing:`No vision model`,modelMissingHelp:`Set plugins.entries.logbook.config.visionModel or configure tools.media models.`},actions:{pause:`Pause`,resume:`Resume`,analyzeNow:`Analyze now`},empty:{title:`Nothing on the timeline yet.`,subtitle:`Logbook is collecting snapshots; cards appear after the first analysis batch completes.`},card:{keyframeAlt:`Screen snapshot from this activity`,distractions:`Distractions`},stats:{title:`Day at a glance`,focus:`{pct}% focus`,tracked:`{duration} tracked`},standup:{title:`Daily standup`,generate:`Generate`,refresh:`Regenerate`,empty:`Turn today's timeline into a ready-to-paste standup update.`},ask:{title:`Ask your day`,placeholder:`When did I review the gateway PR?`,submit:`Ask`}}},M=Object.assign(()=>Object.assign(a.logbook,j.logbook),{catalog:j})})))()}function P(e,t){return r(e,{hour:`2-digit`,minute:`2-digit`,timeZone:t},``)}function F(e){let t=0;for(let n=0;n<e.length;n+=1)t=t*31+e.charCodeAt(n)|0;return Math.abs(t)%360}function I(e){let t=e.captureEnabled&&!e.capturePaused&&!e.lastCaptureError,n=e.capturePaused?c(`logbook.status.paused`):e.captureEnabled?c(`logbook.status.capturing`,{seconds:String(e.captureIntervalSeconds)}):c(`logbook.status.disabled`),r=(e,t=``,n)=>f`
    <span
      class=${`logbook__chip${t?` logbook__chip--${t}`:``}`}
      title=${n??d}
    >
      ${e}
    </span>
  `;return f`
    <div class="logbook__chips">
      <span class="logbook__chip ${t?`logbook__chip--ok`:`logbook__chip--warn`}">
        <span class="logbook__chip-dot"></span>
        ${n}
      </span>
      ${e.nodeName||e.nodeId?r(f`${u.monitor} ${e.nodeName??e.nodeId}`,``,c(`logbook.status.nodeHelp`)):d}
      ${e.pendingFrames>0?r(c(`logbook.status.pending`,{count:String(e.pendingFrames)}),``,c(`logbook.status.pendingHelp`)):d}
      ${e.analysisRunning?r(c(`logbook.status.analyzing`),`busy`):d}
      ${e.lastCaptureError?r(c(`logbook.status.captureError`),`error`,o(e.lastCaptureError)):d}
      ${e.lastBatch?.status===`error`?r(c(`logbook.status.batchError`),`error`,o(e.lastBatch.error)):d}
      ${e.visionModelSource===`missing`?r(c(`logbook.status.modelMissing`),`warn`,c(`logbook.status.modelMissingHelp`)):d}
    </div>
  `}function L(e,t,n,r){let i=e.expandedCardIds.has(n.id),a=F(n.category),s=n.keyframeId!==void 0&&!e.framePreviewFailed.has(n.keyframeId)?n.keyframeId:void 0,l=s===void 0?void 0:e.framePreviews.get(s);return i&&s!==void 0&&!l&&E(e,t,s),f`
    <article
      class="logbook-card ${i?`logbook-card--expanded`:``}"
      style="--logbook-hue: ${a}"
    >
      <button
        class="logbook-card__header"
        type="button"
        @click=${()=>{let t=new Set(e.expandedCardIds);i?t.delete(n.id):t.add(n.id),e.expandedCardIds=t,e.requestUpdate?.()}}
      >
        <span class="logbook-card__time">
          ${P(n.startMs,r)}<span class="logbook-card__time-sep">–</span
          >${P(n.endMs,r)}
        </span>
        <span class="logbook-card__stripe" aria-hidden="true"></span>
        <span class="logbook-card__heading">
          <span class="logbook-card__title">${n.title}</span>
          <span class="logbook-card__summary">${n.summary}</span>
        </span>
        <span class="logbook-card__meta">
          <span class="logbook-card__category">${n.category}</span>
          ${n.appPrimary?f`<span class="logbook-card__app">${n.appPrimary}</span>`:d}
          <span class="logbook-card__duration"
            >${m(n.endMs-n.startMs)??`0s`}</span
          >
        </span>
      </button>
      ${i?f`
              <div class="logbook-card__body">
                ${l?f`<img
                        class="logbook-card__keyframe"
                        src=${l}
                        alt=${c(`logbook.card.keyframeAlt`)}
                      />`:s===void 0?d:f`<div class="logbook-card__keyframe logbook-card__keyframe--loading">
                          ${c(`common.loading`)}
                        </div>`}
                ${n.detail?f`<p class="logbook-card__detail">${o(n.detail)}</p>`:d}
                ${n.distractions.length>0?f`
                        <div class="logbook-card__distractions">
                          <span class="logbook-card__distractions-label">
                            ${c(`logbook.card.distractions`)}
                          </span>
                          ${n.distractions.map(e=>f`
                              <span class="logbook-card__distraction">
                                ${P(e.startMs,r)} · ${e.title}
                              </span>
                            `)}
                        </div>
                      `:d}
              </div>
            `:d}
    </article>
  `}function R(e){let t=e.timeline?.stats;if(!t||t.trackedMs<=0)return d;let n=Math.max(0,t.trackedMs-t.distractionMs),r=Math.round(n/t.trackedMs*100),i=t.categories[0]?.ms??1;return f`
    <section class="card logbook-side__card">
      <div class="card-title">${c(`logbook.stats.title`)}</div>
      <div class="logbook-stats__focus">
        <div class="logbook-stats__focus-bar">
          <div class="logbook-stats__focus-fill" style="width: ${r}%"></div>
        </div>
        <div class="logbook-stats__focus-legend">
          <span>${c(`logbook.stats.focus`,{pct:String(r)})}</span>
          <span
            >${c(`logbook.stats.tracked`,{duration:m(t.trackedMs)??`0s`})}</span
          >
        </div>
      </div>
      <div class="logbook-stats__categories">
        ${t.categories.slice(0,6).map(e=>f`
            <div
              class="logbook-stats__category"
              style="--logbook-hue: ${F(e.category)}"
            >
              <span class="logbook-stats__category-name">${e.category}</span>
              <span class="logbook-stats__category-bar">
                <span
                  class="logbook-stats__category-fill"
                  style="width: ${Math.max(6,Math.round(e.ms/i*100))}%"
                ></span>
              </span>
              <span class="logbook-stats__category-time"
                >${m(e.ms)??`0s`}</span
              >
            </div>
          `)}
      </div>
      ${t.apps.length>0?f`
              <div class="logbook-stats__apps">
                ${t.apps.slice(0,5).map(e=>f`<span class="logbook-stats__app">${e.domain}</span>`)}
              </div>
            `:d}
    </section>
  `}function z(e,t){return f`
    <section class="card logbook-side__card">
      <div class="logbook-side__card-header">
        <div class="card-title">${c(`logbook.standup.title`)}</div>
        <button
          class="btn btn--small"
          type="button"
          ?disabled=${e.standupLoading}
          @click=${()=>void O(e,t,e.standup!==null)}
        >
          ${e.standupLoading?c(`common.loading`):e.standup?c(`logbook.standup.refresh`):c(`logbook.standup.generate`)}
        </button>
      </div>
      ${e.standup?f`<div class="logbook-standup__body markdown-body">
              ${g(v(e.standup.text))}
            </div>`:f`<div class="card-sub">${c(`logbook.standup.empty`)}</div>`}
    </section>
  `}function B(e,t){return f`
    <section class="card logbook-side__card">
      <div class="card-title">${c(`logbook.ask.title`)}</div>
      <form
        class="logbook-ask__form"
        @submit=${n=>{n.preventDefault(),k(e,t)}}
      >
        <input
          class="logbook-ask__input"
          type="text"
          .value=${e.askQuestion}
          placeholder=${c(`logbook.ask.placeholder`)}
          @input=${t=>{e.askQuestion=t.target.value}}
        />
        <button class="btn btn--small" type="submit" ?disabled=${e.askLoading}>
          ${e.askLoading?c(`common.loading`):c(`logbook.ask.submit`)}
        </button>
      </form>
      ${e.askAnswer?f`<p class="logbook-ask__answer">${e.askAnswer}</p>`:d}
    </section>
  `}function V(e){let t=D(e.host);t.requestUpdate=e.onRequestUpdate??null;let n=e.connected;T(t,n?e.client:null),n&&!t.timeline&&!t.loading&&!t.error&&b(t,e.client);let r=t.status?.today??x(),i=t.day===r,a=t.status,o=t.timeline?.cards??[],s=(e,t,n=!1,r)=>f`<button
    class="btn btn--small"
    type="button"
    aria-label=${r??d}
    ?disabled=${n}
    @click=${t}
  >
    ${e}
  </button>`;return f`
    <section class="logbook">
      <header class="logbook__header">
        <div class="logbook__daynav">
          ${s(`‹`,()=>void b(t,e.client,{day:C(t.day,-1)}),!1,c(`logbook.nav.previousDay`))}
          <span class="logbook__day">${t.day}</span>
          ${s(`›`,()=>void b(t,e.client,{day:C(t.day,1)}),i,c(`logbook.nav.nextDay`))}
          ${i?d:s(c(`logbook.nav.today`),()=>void b(t,e.client,{today:!0}))}
        </div>
        ${t.status?I(t.status):d}
        <div class="logbook__actions">
          ${t.status?s(c(t.status.capturePaused?`logbook.actions.resume`:`logbook.actions.pause`),()=>void S(t,e.client,!t.status?.capturePaused),t.actionPending||!t.status.captureEnabled):d}
          ${s(c(`logbook.actions.analyzeNow`),()=>void A(t,e.client),t.actionPending)}
          ${s(u.refresh,()=>void b(t,e.client),t.loading)}
        </div>
      </header>
      ${t.error?f`<div class="callout danger" role="alert">${t.error}</div>`:d}
      <div class="logbook__layout">
        <div class="logbook__timeline">
          ${t.loading&&o.length===0?f`<div class="card-sub">${c(`common.loading`)}</div>`:d}
          ${!t.loading&&o.length===0&&!t.error?f`
                  <div class="logbook__empty">
                    <div class="logbook__empty-title">${c(`logbook.empty.title`)}</div>
                    <div class="logbook__empty-sub">${c(`logbook.empty.subtitle`)}</div>
                  </div>
                `:d}
          ${a?o.map(n=>L(t,e.client,n,a.timeZone)):d}
        </div>
        <aside class="logbook__side">
          ${R(t)} ${z(t,e.client)}
          ${B(t,e.client)}
        </aside>
      </div>
    </section>
  `}function H(){return(H=e((()=>{p(),_(),l(),y(),n(),N(),h(),s(),i(),w(),M()})))()}H();export{V as renderLogbook};
import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gu as t,Hs as n,Nu as r,Pu as i,Wu as a,Xi as o,Yi as s,ju as c,xu as l,yu as u,zu as d}from"./control-ui-core-DCNBgr3X.js";import{Ai as ee,Cr as te,Sr as f,ca as ne,go as re,ki as ie,or as ae,sa as p,sr as oe,wo as m,wr as se}from"./control-ui-core-DwX5Mpz4.js";import{G as h,J as g,W as _,Z as ce,at as le,i as ue,n as v,o as y,rt as b,t as de}from"./lit-runtime-B40xFCK_.js";import{It as x,zt as fe}from"./control-ui-boot-shared-BX8huZUb.js";import{Mo as S,Ur as pe,Wr as me,Zr as C}from"./ui-AaV6iNVa.js";import{D as he,F as w,M as T,N as E,T as ge,j as _e}from"./control-ui-boot-shared-E4pYPcWx.js";import{bt as ve,m as D,p as O,vt as k}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ml as A,Nl as j,cl as M,sl as N}from"./control-ui-boot-shared-CzJHozXQ.js";import{N as P,P as F}from"./markdown-runtime-ORQpioyT.js";import{a as ye,o as be}from"./settings-targets-C_s4rJ3N.js";import{n as xe,t as Se}from"./en-transcripts-BTdTzFSZ.js";function I(e){let t=new URLSearchParams(e);return{limit:50,query:t.get(`query`)?.slice(0,256)||void 0,providerId:t.get(`providerId`)||void 0,accountId:t.get(`accountId`)||void 0,agentId:t.get(`agentId`)||void 0,startedAfter:L(t.get(`startedAfter`)),startedBefore:L(t.get(`startedBefore`)),cursor:t.get(`cursor`)||void 0}}function L(e){if(e)return/^\d{4}-\d{2}-\d{2}$/u.test(e)?`${e}T00:00:00.000Z`:e}function R(e,t){let n=new URLSearchParams(e);for(let[e,r]of Object.entries(t))r?n.set(e,r):n.delete(e);let r=n.toString();return r?`?${r}`:``}var z,B;function V(){return(V=e((()=>{z=[`providerId`,`accountId`,`agentId`,`startedAfter`,`startedBefore`],B=[`query`,...z]})))()}var H,U;function W(){return(W=e((()=>{t(),H={meetings:{emptyTitle:`Your meeting notes, together`,docs:`Set up meeting transcripts`,inProgress:`In progress`,activeNotes:`Summaries are generated about every 5 minutes when new speech is captured. Follow the Transcript tab for speech as it is saved.`,liveCapture:`Live capture`,liveHint:`Updates automatically every 3 seconds.`,liveSummaryHint:`Summary so far · Updates about every 5 minutes when there is new speech. Final notes are saved when capture ends.`,liveRetrying:`Updates are delayed. Retrying automatically.`,waitingForSpeech:`Waiting for speech…`,noSpeech:`No speech captured`,listLabel:`Meetings by day`,newestFirst:`Newest first · grouped by meeting date`,loadingMeetings:`Loading meetings…`,loadingSummary:`Loading summary…`,loadingTranscript:`Loading transcript…`,summaryPending:`Summary updates about every 5 minutes as new speech is captured.`,summaryUnavailable:`No saved summary preview is available.`,noResults:`No meetings match your search`}},U=Object.assign(()=>{Object.assign(a,H)},{catalog:H})})))()}function Ce(e){let t=e.split(/\r\n?|\n/),n=Y.parse(e,{}),r=[],i=0,a=!1;for(let[e,o]of n.entries()){if(o.type!==`heading_open`||o.level!==0||o.tag!==`h1`&&o.tag!==`h2`||!o.map)continue;let s=o.map[0];a&&=(i=s,!1),o.tag===`h2`&&n[e+1]?.content.trim()===`Transcript`&&(r.push(t.slice(i,s).join(`
`)),a=!0)}return a||r.push(t.slice(i).join(`
`)),r.join(`
`)}function G(e){return e?new Date(e).toLocaleString():d(`transcripts.unknown`)}function we(e){let t=d(`transcripts.sourceTime`,{time:G(e)});return g`<time datetime=${e??h} title=${t} aria-label=${t}
    >${e?new Date(e).toLocaleTimeString():d(`transcripts.unknown`)}</time
  >`}function Te(e){return[e.providerId,e.accountId,e.guildId,e.channelId,e.meetingUrl,e.threadTs,e.fileId].filter(Boolean).join(` · `)}function K(e,t){let n=o(e);return g`<div class="transcripts-notice" role="alert" tabindex="-1">
    <h2>${d(n?`transcripts.forbidden`:`transcripts.loadError`)}</h2>
    <p>${n?d(`transcripts.forbiddenHint`):u(e)}</p>
    <button class="btn" @click=${t}>${d(`common.retry`)}</button>
  </div>`}function q(e){return g`<div class="meetings-loading" role="status" aria-live="polite">
    <span class="btn__spinner" aria-hidden="true"></span>
    <span>${e}</span>
  </div>`}function J(e){let t=new URLSearchParams(e.search),n=z.some(e=>t.get(e)),r=(t,n,r=`search`)=>g`<label class="field">
    <span>${n}</span
    ><input
      name=${t}
      type=${r}
      aria-label=${n}
      maxlength=${256}
      .value=${y(e.drafts[t]??``)}
      @input=${n=>e.onDraft(t,n.target.value)}
    />
  </label>`;return g`<form
    class="transcripts-filters"
    aria-label=${d(`transcripts.filters`)}
    @submit=${t=>{t.preventDefault();let n=new FormData(t.currentTarget),r={cursor:null};for(let e of B)r[e]=S(n.get(e));e.onNavigate(r)}}
  >
    ${r(`query`,d(`transcripts.titleFilter`))}
    <details ?open=${n}>
      <summary>${d(`transcripts.advancedFilters`)}</summary>
      <div class="transcripts-filters__advanced">
        ${r(`providerId`,d(`transcripts.sourceFilter`))}
        ${r(`accountId`,d(`transcripts.accountFilter`))}
        ${r(`agentId`,d(`transcripts.agentFilter`))}
        ${r(`startedAfter`,d(`transcripts.afterFilter`),`date`)}
        ${r(`startedBefore`,d(`transcripts.beforeFilter`),`date`)}
      </div>
      <p class="transcripts-caption">${d(`transcripts.filterHint`)}</p>
    </details>
    <div class="transcripts-actions">
      <button type="submit" class="btn">${p.search}${d(`transcripts.filter`)}</button>
      <button
        type="button"
        class="btn"
        @click=${()=>e.onNavigate(Object.fromEntries([...B,`cursor`].map(e=>[e,null])))}
      >
        ${d(`transcripts.clearFilters`)}
      </button>
    </div>
  </form>`}function Ee(e,t){let r=new URLSearchParams(t.search).get(`selector`),i=!e.active&&e.utteranceCount===0,a=e.participants.slice(0,3).join(`, `),o=e.participants.length-3,s=e.stoppedAt?x(Math.max(0,Date.parse(e.stoppedAt)-Date.parse(e.startedAt))):null,c={selector:e.selector,find:null,tab:null};return g`<li>
    <a
      class="transcripts-list__entry meetings-row ${i?`meetings-row--silent`:``}"
      aria-current=${e.selector===r?`page`:h}
      href=${m(`meetings`,t.basePath)+R(t.search,c)}
      @click=${e=>{n(e)&&(e.preventDefault(),t.onNavigate(c))}}
    >
      <span class="meetings-row__title"
        >${e.title||e.providerName||e.providerId}</span
      >
      <span class="meetings-row__meta">
        ${e.providerName||e.providerId} ·
        <time datetime=${e.startedAt}
          >${new Date(e.startedAt).toLocaleTimeString(void 0,{hour:`2-digit`,minute:`2-digit`})}</time
        >
        ${e.active?g`<span class="meetings-live">${d(`meetings.inProgress`)}</span>`:s?g` · ${s}`:h}
      </span>
      ${a?g`<span class="meetings-row__meta meetings-row__participants">${a}${o>0?` +${o}`:``}</span>`:h}
      <span class="meetings-row__meta"
        >${d(`transcripts.savedCount`,{count:String(e.utteranceCount)})}</span
      >
      <span class="meetings-row__overview"
        >${e.utteranceCount===0?d(e.active?`meetings.waitingForSpeech`:`meetings.noSpeech`):e.overview||d(e.active?`meetings.summaryPending`:`meetings.summaryUnavailable`)}</span
      >
    </a>
  </li>`}function De(e){if(e.listError)return K(e.listError,e.onRefresh);if(!e.list)return q(d(`meetings.loadingMeetings`));let t=new Map;for(let n of e.list.sessions){let e=new Date(n.startedAt).toLocaleDateString(void 0,{year:`numeric`,month:`long`,day:`numeric`}),r=t.get(e)??[];r.push(n),t.set(e,r)}return g` ${t.size?g`<section class="meetings-timeline" aria-label=${d(`meetings.listLabel`)}>
            <p class="transcripts-caption">${d(`meetings.newestFirst`)}</p>
            ${v(t,([e])=>e,([t,n])=>g`<section class="meetings-day">
                <h2>${t}</h2>
                <ol class="transcripts-list">
                  ${v(n,e=>e.selector,t=>Ee(t,e))}
                </ol>
              </section>`)}
          </section>`:g`<div class="transcripts-notice" role="status">
            <h2>
              ${d(B.some(t=>new URLSearchParams(e.search).has(t))?`meetings.noResults`:`meetings.emptyTitle`)}
            </h2>
            <p>${d(`transcripts.emptyHint`)}</p>
            <a
              href="http://127.0.0.1:18789/cli/transcripts"
              target="_blank"
              rel="noopener noreferrer"
              >${d(`meetings.docs`)}</a
            >
          </div>`}
    <nav class="transcripts-actions" aria-label=${d(`transcripts.pagination`)}>
      ${new URLSearchParams(e.search).has(`cursor`)?g`<button class="btn" @click=${()=>e.onNavigate({cursor:null})}>
              ${d(`transcripts.firstPage`)}
            </button>`:h}
      ${e.list.nextCursor?g`<button
              class="btn"
              @click=${()=>e.onNavigate({cursor:e.list?.nextCursor??null})}
            >
              ${d(`transcripts.nextPage`)}${p.chevronRight}
            </button>`:h}
    </nav>`}function Oe(e,t){let n=e.summary,r=`# ${e.session.title||e.session.sessionId}\n`,i=Ce(n?n.markdown.startsWith(r)?n.markdown.slice(r.length):n.markdown:``);return g`<section class="transcripts-summary">
    ${n?g`${e.session.active?g`<p class="transcripts-caption" role="status">${d(`meetings.liveSummaryHint`)}</p>`:h}
            <p class="transcripts-caption">
              ${n.source?g`${d(n.source===`model`?`transcripts.modelNotes`:`transcripts.heuristicNotes`)}${n.model?` · ${n.model}`:h} · `:h}
              ${d(`transcripts.generatedAt`,{time:G(n.generatedAt)})}
            </p>
            <div class="meetings-notes markdown">
              ${he(ve(i,{mode:`document`,remoteImages:!1}))}
            </div>
            <p class="transcripts-caption">${d(`transcripts.summaryHint`)}</p>`:t.summaryGeneration?.kind===`loading`?q(d(`transcripts.generatingSummary`)):t.summaryGeneration?.kind===`error`?g`<div role="alert">
                <p>${d(`transcripts.summaryError`)} ${t.summaryGeneration.message}</p>
                <button class="btn" @click=${t.onSummaryRetry}>${d(`common.retry`)}</button>
              </div>`:g`<p role="status">
                ${d(e.session.utteranceCount===0?e.session.active?`meetings.waitingForSpeech`:`meetings.noSpeech`:`transcripts.noSummary`)}
              </p>`}
  </section>`}function ke(e){let t=new URLSearchParams(e.search),r=e.reader.pages.at(-1),i=e.reader.summary??r,a=e.readerTab===`summary`?e.reader.summary:r;return g`<article
    class="transcripts-reader"
    aria-label=${d(`transcripts.reader`)}
    aria-busy=${e.reader.loading}
  >
    <a
      class="transcripts-back"
      href=${m(`meetings`,e.basePath)+R(e.search,{selector:null,find:null,tab:null})}
      @click=${t=>{n(t)&&(t.preventDefault(),e.onNavigate({selector:null,find:null,tab:null}))}}
      >${p.arrowLeft}${d(`transcripts.back`)}</a
    >
    ${e.reader.error?K(e.reader.error,e.onReaderRetry):h}
    ${e.reader.loading&&!a?q(d(e.readerTab===`summary`?`meetings.loadingSummary`:`meetings.loadingTranscript`)):h}
    ${i?g`
            <header class="transcripts-reader__header">
              <h1 tabindex="-1">${i.session.title||i.session.sessionId}</h1>
              <p class="transcripts-caption">
                ${i.session.providerName||i.session.providerId} ·
                <time datetime=${i.session.startedAt}
                  >${G(i.session.startedAt)}</time
                >
                · ${d(`transcripts.savedCount`,{count:String(i.session.utteranceCount)})}
              </p>
              ${i.session.active?g`<div class="meetings-live-status" role="status">
                      <div class="meetings-live-status__heading">
                        <span class="meetings-live">${d(`meetings.liveCapture`)}</span>
                        <span class="meetings-live-status__elapsed" role="timer" aria-live="off"
                          >${x(Math.max(0,e.now-Date.parse(i.session.startedAt)))}</span
                        >
                      </div>
                      <p>
                        ${d(e.reader.error?`meetings.liveRetrying`:`meetings.liveHint`)}
                      </p>
                    </div>`:h}
              <details class="transcripts-source-details">
                <summary>${d(`transcripts.sourceDetails`)}</summary>
                <p class="transcripts-caption">${Te(i.session.source)}</p>
                <p class="transcripts-caption">
                  ${i.session.agentId??d(`transcripts.unattributed`)}
                </p>
                <p class="transcripts-caption">
                  ${d(`transcripts.lastUtterance`,{time:G(i.session.lastUtteranceAt)})}
                </p>
                <p class="transcripts-caption">
                  ${d(i.session.activeSubscription?`transcripts.armedHint`:`transcripts.inactiveHint`)}
                </p>
              </details>
              <div class="transcripts-actions">
                ${[`markdown`,`jsonl`].map(t=>g`<button
                      class="btn"
                      ?disabled=${e.exportState.kind===`loading`}
                      @click=${()=>e.onDownload(t)}
                    >
                      ${p.download}${d(`transcripts.download.${t}`)}
                    </button>`)}
              </div>
              ${e.exportState.kind===`error`?g`<p role="alert">
                      ${d(`transcripts.exportError`)} ${e.exportState.message}
                    </p>`:h}
              ${e.exportState.kind===`loading`||e.exportState.kind===`done`?g`<p role="status">
                      ${d(e.exportState.kind===`loading`?`transcripts.exporting`:`transcripts.downloadStarted`)}
                    </p>`:h}
            </header>
            ${D({id:`transcript-reader`,active:e.readerTab,tabs:[{value:`summary`,label:d(`transcripts.summary`)},{value:`text`,label:d(`transcripts.text`)}],ariaLabel:d(`transcripts.reader`),panelId:`transcript-reader-panel`,variant:`sub`,onSelect:e.onReaderTab})}
            <div
              id="transcript-reader-panel"
              role="tabpanel"
              aria-labelledby=${`transcript-reader-tab-${e.readerTab}`}
            >
              ${e.readerTab===`summary`?e.reader.summary?Oe(e.reader.summary,e):h:g`
                      <form
                        class="transcripts-search"
                        role="search"
                        @submit=${t=>{t.preventDefault();let n=S(new FormData(t.currentTarget).get(`find`));e.onNavigate({find:n,tab:`transcript`})}}
                      >
                        <label class="field">
                          <input
                            type="search"
                            name="find"
                            aria-label=${d(`transcripts.searchWithin`)}
                            placeholder=${d(`transcripts.searchWithin`)}
                            maxlength=${256}
                            .value=${y(e.drafts.find??``)}
                            @input=${t=>e.onDraft(`find`,t.target.value)}
                          />
                        </label>
                        <button class="btn" type="submit">
                          ${p.search}${d(`transcripts.search`)}
                        </button>
                        ${t.get(`find`)?g`<button
                                class="btn"
                                type="button"
                                @click=${()=>e.onNavigate({find:null})}
                              >
                                ${d(`transcripts.clearSearch`)}
                              </button>`:h}
                      </form>
                      ${t.get(`find`)?g`<p class="transcripts-caption" role="status">
                              ${d(`transcripts.searchResults`,{query:t.get(`find`)??``})}
                            </p>`:h}
                      <ol class="transcripts-utterances">
                        ${e.reader.pages.flatMap(e=>e.utterances??[]).map(e=>g`<li>
                              <div class="transcripts-utterance__byline">
                                <strong
                                  >${e.speakerLabel??e.speakerId??d(`transcripts.unknownSpeaker`)}</strong
                                >
                                ${we(e.startedAt??e.endedAt)}
                              </div>
                              <p>${e.text}</p>
                            </li>`)}
                      </ol>
                      ${r&&!e.reader.error&&!e.reader.pages.some(e=>e.utterances?.length)?g`<p role="status">
                              ${d(t.get(`find`)?`transcripts.noMatches`:i.session.active?`meetings.waitingForSpeech`:`transcripts.noUtterances`)}
                            </p>`:h}
                      ${e.reader.loading&&r?.nextCursor?q(d(`meetings.loadingTranscript`)):h}
                    `}
            </div>
          `:h}
  </article>`}function Ae(e){let t=!!new URLSearchParams(e.search).get(`selector`),n=ye.meetingCapture;return g`<section class="transcripts-workspace">
    <header
      class="content-header content-header--page"
      ${oe({toolbarHeader:!0})}
    >
      <div>
        <h1 class="page-title">${d(`tabs.meetings`)}</h1>
        <p class="page-sub">${d(`subtitles.meetings`)}</p>
      </div>
      <div class="transcripts-actions">
        <a
          class="btn"
          href=${m(n.routeId,e.basePath)+n.search+n.hash}
          >${p.settings}${d(`meetingCapture.title`)}</a
        >
        <button
          class="btn"
          ?disabled=${!e.connected||!e.allowed||e.listLoading}
          @click=${e.onRefresh}
        >
          ${p.refresh}${d(`common.refresh`)}
        </button>
      </div>
    </header>
    ${e.connected?e.allowed?g`<div class="transcripts-layout ${t?`transcripts-layout--selected`:``}">
              <section
                class="transcripts-library"
                aria-label=${d(`transcripts.library`)}
                aria-busy=${e.listLoading}
              >
                ${J(e)}${De(e)}
              </section>
              ${t?ke(e):h}
            </div>`:g`<div class="transcripts-notice" role="alert">
              <h2>${d(`transcripts.forbidden`)}</h2>
              <p>${d(`transcripts.forbiddenHint`)}</p>
            </div>`:g`<div class="transcripts-notice" role="status">${d(`transcripts.disconnected`)}</div>`}
  </section>`}var Y;function X(){return(X=e((()=>{_(),ue(),de(),ge(),F(),re(),ae(),O(),ne(),k(),i(),W(),Se(),fe(),l(),s(),be(),V(),xe(),U(),Y=new P(`commonmark`)})))()}var Z,Q;function $(){return($=e((()=>{me(),_e(),_(),ce(),ee(),se(),l(),s(),j(),r(),M(),V(),X(),Z=class extends c{constructor(){super(),this.routeSearch=``,this.drafts={},this.list=null,this.listDenial=null,this.readerDenial=null,this.accessGeneration=0,this.readerCursor=null,this.loadedReaderCursor=null,this.lastReaderRefresh=0,this.now=Date.now(),this.summary=null,this.summaryGeneration={kind:`idle`},this.summaryAbort=null,this.readerPages=[],this.exportState={kind:`idle`},this.exportAbort=null,this.focusSelection=!1,this.gateway=new A(this,{getGateway:()=>this.context?.gateway,invalidateRequests:()=>this.resetConnection(),onPageActivation:()=>this.refreshLive(!0),onSnapshot:({snapshot:{hello:e}})=>{(e!==this.connectionHello||e?.auth!==this.connectionAuth)&&(this.gateway.invalidate(),this.resetConnection()),this.connectionHello=e,this.connectionAuth=e?.auth}}),this.polling=new N(this,3e3,()=>this.refreshLive()),this.listTask=new T(this,{args:()=>[this.requestClient(),this.gateway.epoch,JSON.stringify(I(this.routeSearch)),this.selection.selector],task:async([e,,t,n],{signal:r})=>e?this.readArchive({client:e,method:`transcripts.list`,params:I(this.routeSearch),signal:r,current:()=>this.selection.selector===n&&JSON.stringify(I(this.routeSearch))===t,accept:e=>{this.listDenial=null,this.list=e}}):E}),this.summaryTask=new T(this,{args:()=>[this.requestClient(),this.gateway.epoch,this.selection.selector],task:async([e,,t],{signal:n})=>!e||!t?E:this.readArchive({client:e,method:`transcripts.get`,params:{selector:t},signal:n,current:()=>this.selection.selector===t,accept:e=>{this.readerDenial=null,this.summary=e,this.generateMissingSummary()}})}),this.readerTask=new T(this,{args:()=>[this.requestClient(),this.gateway.epoch,this.selection.selector,this.selection.query,this.readerCursor],task:async([e,,t,n,r],{signal:i})=>!e||!t?E:this.readArchive({client:e,method:`transcripts.get`,params:{selector:t,includeUtterances:!0,query:n||void 0,cursor:r??void 0,limit:50},signal:i,current:()=>this.selection.selector===t&&this.selection.query===n&&this.readerCursor===r,accept:e=>{this.readerDenial=null;let t=r?[...r===this.loadedReaderCursor?this.readerPages.slice(0,-1):this.readerPages,e]:[e];this.loadedReaderCursor=r,this.readerPages=t}})}),this.polling}requestClient(){let e=this.context?.gateway.snapshot;return this.isConnected&&e?.phase===`connected`&&f(e.hello?.auth??null)?e.client:null}get selection(){let e=new URLSearchParams(this.routeSearch);return{selector:e.get(`selector`)??``,query:(e.get(`find`)??``).slice(0,256)}}get readerTab(){let e=new URLSearchParams(this.routeSearch);return e.has(`tab`)?e.get(`tab`)===`transcript`?`text`:`summary`:this.selection.query?`text`:`summary`}captureArchiveRequest(e){let t=this.gateway.capture(),n=this.context.gateway,r=n.snapshot.hello,i=n.snapshot.hello?.auth,a=this.accessGeneration;return{scope:t,auth:i,isCurrent:()=>this.requestClient()===e&&this.context.gateway===n&&n.snapshot.hello===r&&n.snapshot.hello?.auth===i&&t!==null&&this.gateway.isCurrent(t)&&this.accessGeneration===a}}async readArchive(e){let t=this.captureArchiveRequest(e.client),n=()=>!e.signal.aborted&&t.isCurrent()&&e.current();try{let t=await e.client.request(e.method,e.params,{signal:e.signal});return n()?e.accept(t):E}catch(e){if(!n())return E;throw o(e)&&(this.accessGeneration++,this.cancelSummaryGeneration(),this.listDenial=e,this.readerDenial=e,this.list=null,this.summary=null,this.readerPages=[],this.cancelExport()),e}}willUpdate(e){if(e.has(`routeSearch`)){let t=new URLSearchParams(String(e.get(`routeSearch`)??``)),n=new URLSearchParams(this.routeSearch);t.get(`selector`)!==n.get(`selector`)&&(this.cancelSummaryGeneration(),this.summary=null,this.lastReaderRefresh=0),JSON.stringify(I(String(e.get(`routeSearch`)??``)))!==JSON.stringify(I(this.routeSearch))&&(this.list=null);for(let r of[...B,`find`])(t.get(r)!==n.get(r)||e.get(`routeSearch`)===void 0||r===`find`&&t.get(`selector`)!==n.get(`selector`))&&(this.drafts[r]=n.get(r)??``);(t.get(`selector`)!==(this.selection.selector||null)||t.get(`find`)!==(this.selection.query||null))&&(this.resetReader(),this.cancelExport(),this.focusSelection=e.get(`routeSearch`)!==void 0)}}updated(){let e=this.readerPages.at(-1)?.nextCursor;if(this.readerTask.status===w.COMPLETE&&document.visibilityState!==`hidden`&&!this.readerDenial&&e&&e!==this.readerCursor&&(this.readerCursor=e),!this.focusSelection)return;let t=this.selection.selector?this.querySelector(`.transcripts-reader h1, .transcripts-reader [role=alert]`):this.querySelector(`.transcripts-library input[name="query"]`);t&&(t.focus(),this.focusSelection=!1)}resetConnection(){this.cancelSummaryGeneration(),this.list=null,this.listDenial=null,this.readerDenial=null,this.summary=null,this.lastReaderRefresh=0,this.listTask.abort(),this.summaryTask.abort(),this.readerTask.abort(),this.cancelExport(),this.resetReader()}resetReader(){this.readerCursor=null,this.loadedReaderCursor=null,this.readerPages=[]}cancelExport(){this.exportAbort?.abort(),this.exportAbort=null,this.exportState={kind:`idle`}}cancelSummaryGeneration(){this.summaryAbort?.abort(),this.summaryAbort=null,this.summaryGeneration={kind:`idle`}}async generateMissingSummary(e=!1){let t=this.requestClient(),{selector:n}=this.selection,r=this.captureArchiveRequest(t);if(!t||!n||!r.scope||this.readerDenial||!te(r.auth??null)||!this.summary||this.summary.summary||this.summary.session.utteranceCount===0||this.summaryGeneration.kind===`loading`||!e&&this.summaryGeneration.kind!==`idle`)return;let i=new AbortController;this.summaryAbort=i,this.summaryGeneration={kind:`loading`};let a=()=>!i.signal.aborted&&this.summaryAbort===i&&r.isCurrent()&&this.selection.selector===n;try{let e=await t.request(`transcripts.summarize`,{selector:n},{signal:i.signal,timeoutMs:12e4});if(!a())return;this.summaryTask.abort(),this.summary=e,this.summaryGeneration={kind:`done`}}catch(e){a()&&(this.summaryGeneration={kind:`error`,message:u(e)})}finally{this.summaryAbort===i&&(this.summaryAbort=null)}}navigate(e){for(let[t,n]of Object.entries(e))this.drafts[t]=n??``;this.requestUpdate(),this.context.navigate(`meetings`,{search:R(this.routeSearch,e)})}refresh(){this.cancelExport(),this.summary=null,this.resetReader(),new URLSearchParams(this.routeSearch).has(`cursor`)?this.navigate({cursor:null}):this.listTask.run(),this.summaryTask.run(),this.readerTask.run()}refreshLive(e=!1){if(!this.requestClient()||document.visibilityState===`hidden`||this.listDenial||this.readerDenial||(this.now=Date.now(),this.listTask.status!==w.PENDING&&this.listTask.run(),!this.selection.selector))return;let t=this.summary?.session??this.readerPages.at(-1)?.session,n=this.summary?.summary,r=t?.stoppedAt&&n?.generatedAt&&Date.parse(n.generatedAt)<Date.parse(t.stoppedAt),i=t?.active||!n||r?3e3:15e3;if(!(!e&&this.now-this.lastReaderRefresh<i)){this.lastReaderRefresh=this.now;for(let e of[this.summaryTask,this.readerTask])e.status!==w.PENDING&&e.run()}}async download(e){let t=this.requestClient(),{selector:n}=this.selection;if(!t||!n||this.exportState.kind===`loading`)return;let r=new AbortController;this.exportAbort=r,this.exportState={kind:`loading`};try{await this.readArchive({client:t,method:`transcripts.export`,params:{selector:n,format:e},signal:r.signal,current:()=>this.selection.selector===n,accept:e=>{let t=Uint8Array.from(atob(e.data),e=>e.charCodeAt(0)),n=URL.createObjectURL(new Blob([t],{type:e.mimeType})),r=document.createElement(`a`);try{r.href=n,r.download=e.filename,document.body.append(r),r.click(),this.exportState={kind:`done`}}finally{r.remove(),window.setTimeout(()=>URL.revokeObjectURL(n),1e3)}}})}catch(e){this.exportAbort===r&&!r.signal.aborted&&(this.exportState={kind:`error`,message:u(e)})}finally{this.exportAbort===r&&(this.exportAbort=null)}}render(){let e=this.context.gateway.snapshot,t=this.requestClient(),n=this.readerTab===`summary`?this.summaryTask:this.readerTask,r={summary:this.summary,pages:this.readerPages,loading:n.status===w.PENDING,error:this.readerDenial??(n.status===w.ERROR?n.error:null)};return Ae({basePath:this.context.basePath,now:this.now,search:this.routeSearch,drafts:this.drafts,onDraft:(e,t)=>{this.drafts[e]=t},connected:e.phase===`connected`,allowed:f(e.hello?.auth??null),list:t?this.list:null,listLoading:!this.listDenial&&this.listTask.status===w.PENDING,listError:this.listDenial??(this.listTask.status===w.ERROR?this.listTask.error:null),reader:r,readerTab:this.readerTab,summaryGeneration:this.summaryGeneration,onSummaryRetry:()=>void this.generateMissingSummary(!0),exportState:this.exportState,onNavigate:e=>this.navigate(e),onRefresh:()=>this.refresh(),onReaderRetry:()=>{if(this.readerTab===`summary`){this.summaryTask.run();return}this.readerPages.length||this.resetReader(),this.summary||this.summaryTask.run(),this.readerTask.run()},onReaderTab:e=>{this.navigate({tab:e===`text`?`transcript`:`summary`})},onDownload:e=>void this.download(e)})}},C([pe({context:ie,subscribe:!0})],Z.prototype,`context`,void 0),C([le({attribute:!1})],Z.prototype,`routeSearch`,void 0),C([b()],Z.prototype,`list`,void 0),C([b()],Z.prototype,`listDenial`,void 0),C([b()],Z.prototype,`readerDenial`,void 0),C([b()],Z.prototype,`readerCursor`,void 0),C([b()],Z.prototype,`now`,void 0),C([b()],Z.prototype,`summary`,void 0),C([b()],Z.prototype,`summaryGeneration`,void 0),C([b()],Z.prototype,`readerPages`,void 0),C([b()],Z.prototype,`exportState`,void 0),Q={header:!0,render:e=>g`<zero-meetings-page
      .routeSearch=${typeof e==`string`?e:``}
    ></zero-meetings-page>`},customElements.get(`zero-meetings-page`)||customElements.define(`zero-meetings-page`,Z)})))()}$();export{Q as meetingsPageComponent};
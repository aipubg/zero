import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Bu as t,Gu as n,Ic as r,Jr as i,Lc as a,Lu as o,Nu as s,Pu as c,V as l,W as ee,Wu as te,Yr as ne,bl as re,ju as ie,lc as ae,xl as oe,xu as se,yu as u,zu as d}from"./control-ui-core-DCNBgr3X.js";import{Ai as ce,ki as le,or as ue,qr as f,sr as de}from"./control-ui-core-DwX5Mpz4.js";import{G as p,J as m,W as h,Z as fe,at as pe,rt as g}from"./lit-runtime-B40xFCK_.js";import{c as me,d as he,l as ge}from"./gateway-runtime-JSfC8ThO.js";import{Ni as _e,Po as _,Ur as ve,Wr as ye,Zr as v,ba as be,bi as y,ci as xe,va as Se,ya as b,yi as Ce}from"./ui-AaV6iNVa.js";import{D as we,T as Te}from"./control-ui-boot-shared-E4pYPcWx.js";import{I as Ee,bt as De,m as x,na as Oe,p as ke,ta as Ae,vt as je,z as Me}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ml as Ne,Nl as Pe}from"./control-ui-boot-shared-CzJHozXQ.js";import{n as Fe,t as Ie}from"./en-settings-6vMW9YZk.js";import{f as Le,h as Re,l as ze,p as Be,u as Ve}from"./control-ui-boot-new-5_2Ky4dv.js";import{n as He,r as Ue,t as We}from"./slots-B2j6xSex.js";var S,C;function w(){return(w=e((()=>{n(),S={dreaming:{tabs:{scene:`Scene`,diary:`Diary`,advanced:`Advanced`},header:{refresh:`Refresh`,refreshing:`Refreshing…`,on:`Dreaming On`,off:`Dreaming Off`,engineOff:`Memory engine is Off. Choose an engine in Settings to enable dreaming.`},toggleConfirmation:{subtitle:`Dreaming is a global setting; it is not scoped to this agent.`,enableTitle:`Turn On Dreaming for All Agents`,enableDetail:`The nightly dreaming sweep will run across every configured agent workspace, promoting short-term recalls into long-term memory. This applies right away.`,enableConfirm:`Turn On Dreaming`,disableTitle:`Turn Off Dreaming for All Agents`,disableDetail:`The nightly dreaming sweep will stop for every configured agent, not just this one. Memories already written stay; nothing new gets promoted. This applies right away.`,disableConfirm:`Turn Off Dreaming`,saving:`Saving…`,failed:`Could not apply change. Check your connection and try again.`},status:{active:`Dreaming Active`,idle:`Dreaming Idle`,promotedSuffix:`promoted`,nextSweepPrefix:`next sweep`},scene:{backfill:`Backfill`,dedupeDiary:`Dedupe Diary`,reset:`Reset`,clearGrounded:`Clear Replayed`,repairCache:`Repair Dream Cache`,working:`Working…`},phase:{light:`Light`,deep:`Deep`,rem:`Rem`,off:`off`},advanced:{eyebrow:`Review`,title:`Daily Log Review`,description:`Review what came from the daily log, what is waiting for promotion, and what was promoted recently.`,summaryFromDailyLog:`from daily log`,summaryWaiting:`waiting`,summaryPromotedToday:`promoted today`,stagedTitle:`From the Daily Log`,stagedDescription:`Replay candidates pulled from older daily log entries.`,shortTermTitle:`Waiting for Promotion`,shortTermDescription:`Current short-term candidates waiting to graduate into real memory.`,sortRecent:`Most recent`,sortSignals:`Strongest support`,originDailyLog:`replayed`,originLive:`live`,originMixed:`mixed`,promotedTitle:`Recent Promotions`,promotedDescription:`Items that already made it through promotion.`,emptyGrounded:`No staged grounded replay entries right now.`,emptyShortTerm:`No short-term entries to inspect.`,emptyPromoted:`No recent promotions to inspect.`,updatedPrefix:`updated`},stats:{grounded:`Grounded`,signals:`Signals`},diary:{title:`Dream Diary`,noDreamsYet:`No dreams yet`,noDreamsHint:`Dreams will appear here after the first dreaming cycle runs.`,waitingTitle:`The diary is waiting`,waitingHint:`Narrative entries will appear after the next dreaming cycle.`,reload:`Reload`,reloading:`Reloading…`},actions:{dedupeRemovedOneAndKept:`Removed {removed} duplicate dream entry and kept {kept}.`,dedupeRemovedManyAndKept:`Removed {removed} duplicate dream entries and kept {kept}.`,dedupeRemovedOne:`Removed {removed} duplicate dream entry.`,dedupeRemovedMany:`Removed {removed} duplicate dream entries.`,repairArchivedThreadCorpus:`archived session corpus`,repairArchivedIngestionState:`archived ingestion state`,repairArchivedDreamDiary:`archived dream diary`,repairNoChanges:`Dream cache repair finished with no changes.`,repairCompleteWithArchive:`Dream cache repair complete: {actions}. Archive: {archiveDir}`,repairComplete:`Dream cache repair complete: {actions}.`,backfillComplete:`Backfilled {count} dream diary entries.`,resetDiaryComplete:`Removed {count} backfilled dream diary entries.`,clearReplayedComplete:`Cleared {count} replayed short-term entries.`,complete:`Dream diary action complete.`,confirmRepairDescription:`This archives derived dream cache files and rebuilds them from clean inputs. Your dream diary stays untouched.`,confirmDedupeDescription:`This rewrites DREAMS.md and removes only exact duplicate diary entries.`,archivePathCopied:`Archive path copied.`,archivePathCopyFailed:`Could not copy archive path.`,updateFailed:`Could not update dreaming settings.`,unsupportedPlugin:`Selected memory plugin "{pluginId}" does not support dreaming settings.`,configHashMissing:`Config hash missing; refresh and retry.`},wiki:{previewFallbackTitle:`Wiki page`,close:`Close`,loadingPage:`Loading wiki page…`,dreamsTab:`Dreams`,insightsTab:`Imported Insights`,wikiTab:`Memory Wiki`,dreamsExplainer:`This is the raw dream diary the system writes while replaying and consolidating memory; use it to inspect what the memory system is noticing, and where it still looks noisy or thin.`,insightsExplainer:`These are imported insights clustered from external history; use them to review what imports surfaced before any of it graduates into durable memory.`,wikiExplainer:`This is the compiled memory wiki surface the system can search and reason over; use it to inspect actual memory pages, claims, open questions, and contradictions rather than raw imported source chats.`,copyArchivePath:`Copy archive path`,loadingInsights:`Loading imported insights…`,noInsights:`No imported insights yet`,noInsightsHint:`Run a ChatGPT import with apply to surface clustered imported insights here.`,candidateSignals:`Potentially useful signals`,corrections:`Corrections or revisions`,importDetails:`Import details`,startedWith:`Started with:`,endedOn:`Ended on:`,messages:`Messages:`,riskReasons:`Risk reasons:`,labels:`Labels:`,openSourcePage:`Open source page`,loadingWiki:`Loading memory wiki…`,emptyWiki:`Memory wiki is not populated yet`,emptyWikiHint:`Right now the wiki mostly has raw source imports and operational reports. This tab becomes useful once syntheses, entities, or concepts start getting written.`,claims:`Claims`,openQuestions:`Open questions`,contradictions:`Contradictions`,pageDetails:`Page details`,wikiPage:`Wiki page:`,id:`Id:`,openWikiPage:`Open wiki page`,unavailable:`Memory Wiki is not enabled`,unavailablePluginPrefix:`Imported Insights and Memory Wiki are provided by the bundled`,unavailablePluginSuffix:`plugin.`,enablePrefix:`Enable`,enableSuffix:`, then reload this tab.`,openConfig:`Open Config`,howToEnable:`How to enable`,pageTypes:{entity:`entity`,concept:`concept`,source:`source`,synthesis:`synthesis`,report:`report`},pageGroups:{sources:`Sources`,syntheses:`Syntheses`,reports:`Reports`,entities:`Entities`,concepts:`Concepts`},counts:{pageOne:`{count} page`,pages:`{count} pages`,claimRowOne:`{count} claim row`,claimRows:`{count} claim rows`,openQuestionOne:`{count} open question`,openQuestions:`{count} open questions`,contradictionOne:`{count} contradiction`,contradictions:`{count} contradictions`,chats:`{count} chats`,sensitive:`{count} sensitive`,signals:`{count} signals`,messages:`{count} messages`,userMessages:`{count} user`,assistantMessages:`{count} assistant`},pageGroupSummary:`{label} · {count}`,noPagesYet:`No pages yet`,sectionPageSummary:`{label}: {count}`,questionCountOnPages:`{questionCount} on {pageCount}`,risk:{needsReview:`needs review`,low:`low risk`,medium:`medium risk`,high:`high risk`,unknown:`unknown risk`},pageNotFound:`No wiki page found for {lookup}.`,previewTruncated:`Showing the first chunk of this page.`,previewTruncatedWithTotal:`Showing the first chunk of this page ({count} total lines).`,boundedResults:`Showing the newest {returned} of {total} items.`,importedClusterSummary:`Imported chats clustered around {label}.`,withheldDigestOne:`{count} digest was withheld pending review.`,withheldDigests:`{count} digests were withheld pending review.`,details:`Details`,hideDetails:`Hide details`,vault:`Vault`,fullVaultBreakdown:`Full vault breakdown: {breakdown}.`,selectedSection:`Selected section: {summary}.`,latestUpdate:`Latest update {date}.`,noContent:`No wiki content available.`},phrases:{consolidatingMemories:`consolidating memories…`,tidyingKnowledgeGraph:`tidying the knowledge graph…`,replayingConversations:`replaying today's conversations…`,weavingShortTerm:`weaving short-term into long-term…`,defragmentingMemoryLane:`defragmenting memory lane…`,filingLooseThoughts:`filing away loose thoughts…`,connectingDots:`connecting distant dots…`,compostingContext:`composting old context windows…`,alphabetizingSubconscious:`alphabetizing the subconscious…`,promotingHunches:`promoting promising hunches…`,forgettingNoise:`forgetting what doesn't matter…`,dreamingEmbeddings:`dreaming in embeddings…`,reorganizingAttic:`reorganizing the memory attic…`,indexingDay:`softly indexing the day…`,nurturingInsights:`nurturing fledgling insights…`,simmeringIdeas:`simmering half-formed ideas…`,whisperingVectorStore:`whispering to the vector store…`}}},C=Object.assign(()=>{te.dreaming=S.dreaming},{catalog:S})})))()}function T(e,t,n){let r=n?.enabledByDefault??!0,i=b(e?.config);if(!i)return r;let a=Se(i.plugins);if(a?.enabled===!1||(Array.isArray(a?.deny)&&a.deny.every(e=>typeof e==`string`)?a.deny:[]).includes(t))return!1;let o=Array.isArray(a?.allow)&&a.allow.every(e=>typeof e==`string`)?a.allow:[];if(o.length>0&&!o.includes(t))return!1;let s=Se(a?.entries),c=b(s?.[t])?.enabled;return typeof c==`boolean`?c:r}function E(){return(E=e((()=>{})))()}function D(e={}){return{client:e.client??null,connected:e.connected??!1,hello:e.hello??null,configSnapshot:e.configSnapshot??null,selectedAgentId:e.selectedAgentId??null,resourceRequests:{},dreamingStatusLoading:!1,dreamingStatusError:null,dreamingStatus:null,dreamingModeSaving:!1,dreamDiaryLoading:!1,dreamDiaryActionLoading:!1,dreamDiaryActionMessage:null,dreamDiaryActionArchivePath:null,dreamDiaryError:null,dreamDiaryPath:null,dreamDiaryContent:null,wikiImportInsightsLoading:!1,wikiImportInsightsError:null,wikiImportInsights:null,wikiOverviewLoading:!1,wikiOverviewError:null,wikiOverview:null,lastError:null}}function Ge(e,t){return he(e,t)??T(e.configSnapshot,P,{enabledByDefault:!1})}function O(e,t,n,r){return me({client:e.client,hello:e.hello,phase:e.connected?`connected`:`offline`},t,n,r)}function Ke(e,t){switch(e){case`doctor.memory.dedupeDreamDiary`:{let e=t?.dedupedEntries??t?.removedEntries??0,n=t?.keptEntries;return d(`dreaming.actions.dedupeRemoved${e===1?`One`:`Many`}${n===void 0?``:`AndKept`}`,{removed:String(e),...n===void 0?{}:{kept:String(n)}})}case`doctor.memory.repairDreamingArtifacts`:{let e=_(t?.archiveDir),n=[[t?.archivedSessionCorpus,`dreaming.actions.repairArchivedThreadCorpus`],[t?.archivedSessionIngestion,`dreaming.actions.repairArchivedIngestionState`],[t?.archivedDreamsDiary,`dreaming.actions.repairArchivedDreamDiary`]].filter(([e])=>e===!0).map(([,e])=>d(e));return n.length===0?d(`dreaming.actions.repairNoChanges`):e?d(`dreaming.actions.repairCompleteWithArchive`,{actions:n.join(`, `),archiveDir:e}):d(`dreaming.actions.repairComplete`,{actions:n.join(`, `)})}case`doctor.memory.backfillDreamDiary`:return d(`dreaming.actions.backfillComplete`,{count:String(t?.written??0)});case`doctor.memory.resetDreamDiary`:return d(`dreaming.actions.resetDiaryComplete`,{count:String(t?.removedEntries??0)});default:return d(`dreaming.actions.clearReplayedComplete`,{count:String(t?.removedShortTermEntries??0)})}}function k(e){return _(e.selectedAgentId)??null}function A(e){let t=b(e?.plugins),n=b(t?.slots),r=Ue(`memory`,n?.memory),i=r.kind===`off`?We(`memory`):r.pluginId,a=b(t?.entries),o=b(a?.[i]),s=b(o?.config),c=b(s?.dreaming),l=typeof c?.enabled==`boolean`;return{pluginId:i,enabled:r.kind!==`off`&&c?.enabled!==!1,overridden:l,engineOff:r.kind===`off`}}function j(e,t){return qe(e,t,F[t])}async function qe(e,t,n){let r=k(e),i=`${t}Loading`,a=`${t}Error`,o=`${t}AgentId`;if(!r)return;let s=e.client;if(!s||!e.connected)return;if(e[o]!==r&&n.clear(e),(t===`wikiImportInsights`||t===`wikiOverview`)&&!Ge(e,n.method)){delete e.resourceRequests[t],e[i]=!1,e[a]=null,n.clear(e);return}if(e.resourceRequests[t]?.agentId===r&&e[i])return;let c={agentId:r};e.resourceRequests[t]=c,e[i]=!0,e[a]=null;try{let i=await s.request(n.method,{agentId:r});if(e.resourceRequests[t]!==c||k(e)!==r)return;n.apply(e,i),e[o]=r}catch(n){e.resourceRequests[t]===c&&k(e)===r&&(e[a]=u(n))}finally{e.resourceRequests[t]===c&&(delete e.resourceRequests[t],e[i]=!1)}}async function M(e,t){let n=e.client,r=k(e);if(!n||!r||!O(e,t,`operator.write`)||e.dreamDiaryActionLoading)return!1;e.dreamDiaryActionLoading=!0,e.dreamingStatusError=null,e.dreamDiaryError=null,e.dreamDiaryActionMessage=null,e.dreamDiaryActionArchivePath=null;try{let i=await n.request(t,{agentId:r});return t!==`doctor.memory.resetGroundedShortTerm`&&t!==`doctor.memory.repairDreamingArtifacts`&&await j(e,`dreamDiary`),await j(e,`dreamingStatus`),e.dreamDiaryActionArchivePath=t===`doctor.memory.repairDreamingArtifacts`?_(i?.archiveDir)??null:null,e.dreamDiaryActionMessage={kind:`success`,text:Ke(t,i)},!0}catch(t){let n=u(t);return e.dreamingStatusError=n,e.lastError=n,e.dreamDiaryActionArchivePath=null,e.dreamDiaryActionMessage={kind:`error`,text:n},!1}finally{e.dreamDiaryActionLoading=!1}}async function Je(e){let t=e.dreamDiaryActionArchivePath;if(!t)return!1;let n=await i(t);return e.dreamDiaryActionMessage={kind:n?`success`:`error`,text:d(n?`dreaming.actions.archivePathCopied`:`dreaming.actions.archivePathCopyFailed`)},n}async function N(e,t){if(!e.state.client||!e.state.connected)return`unknown`;try{let n=b(await e.lookupSchemaPath(`plugins.entries.${t}.config`));return(Array.isArray(n?.children)?n.children:[]).some(e=>_(b(e)?.key)===`dreaming`)?`supported`:b(n?.schema)?.additionalProperties===!1?`unsupported`:`supported`}catch{return`unknown`}}async function Ye(e,t,n,r=()=>!0){if(e.dreamingModeSaving||!r())return!1;if(!t.state.configSnapshot?.hash)return e.dreamingStatusError=d(`dreaming.actions.configHashMissing`),!1;let{pluginId:i}=A(b(t.state.configSnapshot?.config)??null);if(await N(t,i)===`unsupported`){let t=d(`dreaming.actions.unsupportedPlugin`,{pluginId:i});return e.dreamingStatusError=t,e.lastError=t,!1}if(e.dreamingModeSaving||!r()||!O(e,`config.patch`,`operator.admin`))return!1;e.dreamingModeSaving=!0,e.dreamingStatusError=null;let a;try{a=await t.patch({raw:{plugins:{entries:{[i]:{config:{dreaming:{enabled:n}}}}}},note:`Dreaming settings updated from the Dreaming tab.`,canDispatch:r}),a||(e.dreamingStatusError=t.state.lastError??e.lastError??d(`dreaming.actions.updateFailed`))}finally{e.dreamingModeSaving=!1}return a&&e.dreamingStatus&&(e.dreamingStatus={...e.dreamingStatus,enabled:n}),a}var P,F;function I(){return(I=e((()=>{He(),c(),w(),ne(),se(),ge(),E(),C(),P=`memory-wiki`,F={dreamingStatus:{method:`doctor.memory.status`,clear:e=>{e.dreamingStatus=null},apply:(e,t)=>{e.dreamingStatus=t.dreaming??null}},dreamDiary:{method:`doctor.memory.dreamDiary`,clear:e=>{e.dreamDiaryPath=null,e.dreamDiaryContent=null},apply:(e,t)=>{e.dreamDiaryPath=t.path,e.dreamDiaryContent=t.found?t.content??``:null}},wikiImportInsights:{method:`wiki.importInsights`,clear:e=>{e.wikiImportInsights=null},apply:(e,t)=>{e.wikiImportInsights=t}},wikiOverview:{method:`wiki.overview`,clear:e=>{e.wikiOverview=null},apply:(e,t)=>{e.wikiOverview=t}}}})))()}function Xe(e){if(!e.open)return p;let t=e.enabling?`enable`:`disable`,n=d(`dreaming.toggleConfirmation.${t}Title`),r=d(`dreaming.toggleConfirmation.subtitle`),i=d(`dreaming.toggleConfirmation.${t}Detail`),a=d(`dreaming.toggleConfirmation.${t}Confirm`);return m`
    <zero-modal-dialog label=${n} description=${r} @modal-cancel=${()=>{e.loading||e.onCancel()}}>
      <div class="exec-approval-card">
        <div class="exec-approval-header">
          <div>
            <div id=${`dreaming-toggle-confirmation-title`} class="exec-approval-title">${n}</div>
            <div id=${`dreaming-toggle-confirmation-description`} class="exec-approval-sub">${r}</div>
          </div>
        </div>
        <div class="callout ${e.enabling?`info`:`warn`}" style="margin-top: 12px;">
          ${i}
        </div>
        ${e.hasError?m`<div class="exec-approval-error">
                ${d(`dreaming.toggleConfirmation.failed`)}
              </div>`:p}
        <div class="exec-approval-actions">
          <button
            class="btn ${e.enabling?`primary`:`danger`}"
            ?disabled=${e.loading}
            @click=${e.onConfirm}
          >
            ${e.loading?d(`dreaming.toggleConfirmation.saving`):a}
          </button>
          <button class="btn" ?disabled=${e.loading} @click=${e.onCancel}>
            ${d(`common.cancel`)}
          </button>
        </div>
      </div>
    </zero-modal-dialog>
  `}function Ze(){return(Ze=e((()=>{h(),c(),f(),w(),C()})))()}function Qe(e){let t=e,n=wt.exec(e),r=Tt.exec(e);n&&r&&r.index>n.index&&(t=e.slice(n.index+n[0].length,r.index));let i=[];for(let e of t.split(/\n---\n/)){let t=e.trim().split(`
`),n=``,r=[];for(let e of t){let t=e.trim();if(!n&&t.startsWith(`*`)&&t.endsWith(`*`)&&t.length>2){n=t.slice(1,-1);continue}t.startsWith(`#`)||t.startsWith(`<!--`)||t.length>0&&r.push(t)}r.length>0&&i.push({date:n,body:r.join(`
`)})}return i}function $e(e){let t=y(e);if(t===void 0)return e;let n=new Date(t);return`${n.getMonth()+1}/${n.getDate()}`}function et(){return{dreamIndex:Math.floor(Math.random()*W.length),dreamLastSwap:0,activeSubTab:`scene`,activeDiarySubTab:`dreams`,advancedWaitingSort:`recent`,expandedInsightCards:new Set,expandedWikiCards:new Set,diaryPage:0,wikiPreview:null}}function tt(e){let t=Date.now();return t-e.dreamLastSwap>Dt&&(e.dreamLastSwap=t,e.dreamIndex=(e.dreamIndex+1)%W.length),d(W[e.dreamIndex]??W[0])}function nt(e){let t=e.viewState,n=tt(t);return m`
    <div class="dreams-page">
      <div class="dreams__topbar">
        ${x({id:`dreams`,active:t.activeSubTab,tabs:[{value:`scene`,label:d(`dreaming.tabs.scene`)},{value:`diary`,label:d(`dreaming.tabs.diary`)},{value:`advanced`,label:d(`dreaming.tabs.advanced`)}],ariaLabel:d(`memoryPage.tabs.dreams`),panelId:`dreams-panel`,variant:`sub`,onSelect:n=>{t.activeSubTab=n,e.onViewStateChange()}})}
      </div>

      <div
        id="dreams-panel"
        class="dreams__panel"
        role="tabpanel"
        aria-labelledby=${`dreams-tab-${t.activeSubTab}`}
      >
        ${t.activeSubTab===`scene`?it(e,n):t.activeSubTab===`diary`?Ct(e):ht(e)}
      </div>
    </div>
  `}function rt(e){return e.split(`
`).map(e=>e.trim()).filter(e=>e.length>0&&e!==`What Happened`&&e!==`Reflections`&&e!==`Candidates`&&e!==`Possible Lasting Updates`).map(e=>e.replace(/\s*\[memory\/[^\]]+\]/g,``).replace(/^(?:\d+\.\s+|-\s+(?:\[[^\]]+\]\s+)?(?:[a-z_]+:\s+)?)/i,``).replace(/^(?:likely_durable|likely_situational|unclear):\s+/i,``).trim()).filter(e=>e.length>0)}function it(e,t){let n=Le(Ve(e.selectedAgentId)),r=`--lob-shell:${n.palette.shell};--lob-claw:${n.palette.claw}`;return m`
    <section class="dreams ${e.active?``:`dreams--idle`}">
      ${Ot.map(e=>m`
          <div
            class="dreams__star"
            style="
              top: ${e.top}%;
              left: ${e.left}%;
              width: ${e.size}px;
              height: ${e.size}px;
              background: ${e.hue===`accent`?`var(--accent-muted)`:`var(--text)`};
              animation-delay: ${e.delay}s;
            "
          ></div>
        `)}

      <div class="dreams__moon"></div>

      ${e.active?m`
              <div class="dreams__bubble">
                <span class="dreams__bubble-text">${t}</span>
              </div>
              <div
                class="dreams__bubble-dot"
                style="top: calc(50% - 160px); left: calc(50% - 120px); width: 12px; height: 12px; animation-delay: 0.2s;"
              ></div>
              <div
                class="dreams__bubble-dot"
                style="top: calc(50% - 120px); left: calc(50% - 90px); width: 8px; height: 8px; animation-delay: 0.4s;"
              ></div>
            `:p}

      <div class="dreams__glow"></div>
      <div class="dreams__lobster" style=${r}>
        ${Re(n,{sleeping:!0})}
      </div>
      <span class="dreams__z">z</span>
      <span class="dreams__z">z</span>
      <span class="dreams__z">Z</span>

      <div class="dreams__status">
        <span class="dreams__status-label"
          >${e.active?d(`dreaming.status.active`):d(`dreaming.status.idle`)}</span
        >
        <div class="dreams__status-detail">
          <div class="dreams__status-dot"></div>
          <span>
            ${e.promotedCount} ${d(`dreaming.status.promotedSuffix`)}
            ${e.nextCycle?m`· ${d(`dreaming.status.nextSweepPrefix`)} ${e.nextCycle}`:p}
            ${e.timezone?m`· ${e.timezone}`:p}
          </span>
        </div>
      </div>

      <div class="dreams__phases">
        ${Et.map(t=>{let n=e.phases?.[t],r=n!==void 0,i=n?.enabled===!0,a=n?.nextRunAtMs?new Date(n.nextRunAtMs).toLocaleTimeString([],{hour:`numeric`,minute:`2-digit`}):`—`,o=d(`dreaming.phase.${t}`),s=r?i?a:d(`dreaming.phase.off`):`—`;return m`
            <div class="dreams__phase ${r&&!i?`dreams__phase--off`:``}">
              <div class="dreams__phase-dot ${i?`dreams__phase-dot--on`:``}"></div>
              <span class="dreams__phase-name">${o}</span>
              <span class="dreams__phase-next">${s}</span>
            </div>
          `})}
      </div>

      ${e.statusError?m`<div class="dreams__controls-error">${e.statusError}</div>`:p}
    </section>
  `}function at(e,t,n){return t===n?`${e}:${t}`:`${e}:${t}-${n}`}function L(e){let t=y(e);return t===void 0?e:new Date(t).toLocaleString([],{month:`short`,day:`numeric`,hour:`numeric`,minute:`2-digit`})}function R(e,t){return d(`dreaming.wiki.counts.${e}${t===1?`One`:`s`}`,{count:String(t)})}function ot(e){let t=kt.map(([t,n])=>{let r=e[t];return r>0?d(`dreaming.wiki.pageGroupSummary`,{label:d(`dreaming.wiki.pageGroups.${n}`),count:R(`page`,r)}):null}).filter(e=>e!==null);return t.length>0?t.join(`; `):d(`dreaming.wiki.noPagesYet`)}function st(e){let t=[d(`dreaming.wiki.sectionPageSummary`,{label:e.label,count:R(`page`,e.itemCount)})];if(e.claimCount>0&&t.push(R(`claimRow`,e.claimCount)),e.questionCount>0){let n=e.items.filter(e=>e.questionCount>0).length,r=R(`openQuestion`,e.questionCount);t.push(n>0?d(`dreaming.wiki.questionCountOnPages`,{questionCount:r,pageCount:R(`page`,n)}):r)}return e.contradictionCount>0&&t.push(R(`contradiction`,e.contradictionCount)),t.join(` · `)}function ct(e,t,n){e.has(t)?e.delete(t):e.add(t),n()}async function lt(e,t){let n=t.viewState,r={page:{title:ae(e),path:e,content:``},loading:!0,error:null};n.wikiPreview=r,t.onViewStateChange();try{let i=await t.onOpenWikiPage(e);if(n.wikiPreview!==r)return;if(!i){r.error=d(`dreaming.wiki.pageNotFound`,{lookup:e});return}r.page={...i}}catch(e){n.wikiPreview===r&&(r.error=u(e))}finally{n.wikiPreview===r&&(r.loading=!1,t.onViewStateChange())}}function ut(e){e.viewState.wikiPreview=null,e.onViewStateChange()}function dt(e){let t=e.viewState.wikiPreview;if(!t)return p;let{page:n}=t;return m`
    <zero-modal-dialog
      .label=${n.title||d(`dreaming.wiki.previewFallbackTitle`)}
      style="--zero-modal-width: 1120px"
      @modal-cancel=${()=>ut(e)}
    >
      <div class="dreams-diary__preview-panel">
        <div class="dreams-diary__preview-header">
          <div>
            <div class="dreams-diary__preview-title">
              ${n.title||d(`dreaming.wiki.previewFallbackTitle`)}
            </div>
            <div class="dreams-diary__preview-meta">
              ${n.path} ${n.updatedAt?` · ${L(n.updatedAt)}`:``}
            </div>
          </div>
          <button
            type="button"
            class="btn btn--subtle btn--sm"
            @click=${()=>ut(e)}
          >
            ${d(`dreaming.wiki.close`)}
          </button>
        </div>
        <div class="dreams-diary__preview-body">
          ${t.loading?m`<div class="dreams-diary__empty-text">${d(`dreaming.wiki.loadingPage`)}</div>`:t.error?m`<div class="dreams-diary__error">${t.error}</div>`:m`
                    ${n.truncated===!0?m`
                            <div class="dreams-diary__preview-hint">
                              ${n.totalLines==null?d(`dreaming.wiki.previewTruncated`):d(`dreaming.wiki.previewTruncatedWithTotal`,{count:String(n.totalLines)})}
                            </div>
                          `:p}
                    <pre class="dreams-diary__preview-pre">${n.content}</pre>
                  `}
        </div>
      </div>
    </zero-modal-dialog>
  `}function ft(e,t){let n=y(e.lastRecalledAt)??-1/0,r=y(t.lastRecalledAt)??-1/0;return r===n?t.totalSignalCount===e.totalSignalCount?e.path.localeCompare(t.path):t.totalSignalCount-e.totalSignalCount:r-n}function pt(e,t){return t.totalSignalCount===e.totalSignalCount?t.phaseHitCount===e.phaseHitCount?ft(e,t):t.phaseHitCount-e.phaseHitCount:t.totalSignalCount-e.totalSignalCount}function mt(e){return d(e.groundedCount>0?e.recallCount>0||e.dailyCount>0?`dreaming.advanced.originMixed`:`dreaming.advanced.originDailyLog`:`dreaming.advanced.originLive`)}function z(e,t,n){return m`
    <button class="btn btn--subtle btn--sm" ?disabled=${t} @click=${n}>
      ${e}
    </button>
  `}function B(e){return m`
    <section class="dreams-advanced__section">
      <div class="dreams-advanced__section-header">
        <div class="dreams-advanced__section-copy">
          <span class="dreams-advanced__section-title">${d(e.titleKey)}</span>
          <p class="dreams-advanced__section-description">${d(e.descriptionKey)}</p>
        </div>
        <div class="dreams-advanced__section-toolbar">
          ${e.controls??p}
          <span class="dreams-advanced__section-count">${e.entries.length}</span>
        </div>
      </div>
      ${e.entries.length===0?m`<div class="dreams-advanced__empty">${d(e.emptyKey)}</div>`:m`
              <div class="dreams-advanced__list">
                ${e.entries.map(t=>{let n=e.badge?.(t);return m`
                    <article class="dreams-advanced__item" data-entry-key=${t.key}>
                      ${n?m`<span class="dreams-advanced__badge">${n}</span>`:p}
                      <div class="dreams-advanced__snippet">${t.snippet}</div>
                      <div class="dreams-advanced__source">
                        ${at(t.path,t.startLine,t.endLine)}
                      </div>
                      <div class="dreams-advanced__meta">
                        ${e.meta(t).filter(e=>e.length>0).join(` · `)}
                      </div>
                    </article>
                  `})}
              </div>
            `}
    </section>
  `}function ht(e){let t=e.viewState,n=e.shortTermEntries.filter(e=>e.groundedCount>0),r=e.shortTermEntries.toSorted(t.advancedWaitingSort===`signals`?pt:ft),i=d(`dreaming.advanced.description`),a=[`${n.length} ${d(`dreaming.advanced.summaryFromDailyLog`)}`,`${e.shortTermCount} ${d(`dreaming.advanced.summaryWaiting`)}`,`${e.promotedCount} ${d(`dreaming.advanced.summaryPromotedToday`)}`].join(` · `);return m`
    <section class="dreams-advanced">
      <div class="dreams-advanced__header">
        <div class="dreams-advanced__intro">
          <span class="dreams-advanced__eyebrow">${d(`dreaming.advanced.eyebrow`)}</span>
          <h2 class="dreams-advanced__title">${d(`dreaming.advanced.title`)}</h2>
          ${i?m`<p class="dreams-advanced__description">${i}</p>`:p}
          <div class="dreams-advanced__summary">${a}</div>
        </div>
        <div class="dreams-advanced__actions">
          ${[{label:d(`dreaming.scene.dedupeDiary`),onClick:e.onDedupeDreamDiary,allowed:e.access.canDedupeDreamDiary},{label:d(`dreaming.scene.repairCache`),onClick:e.onRepairDreamingArtifacts,allowed:e.access.canRepairDreamingArtifacts},{label:d(e.dreamDiaryActionLoading?`dreaming.scene.working`:`dreaming.scene.backfill`),onClick:e.onBackfillDiary,allowed:e.access.canBackfillDiary},{label:d(`dreaming.scene.reset`),onClick:e.onResetDiary,allowed:e.access.canResetDiary},{label:d(`dreaming.scene.clearGrounded`),onClick:e.onResetGroundedShortTerm,allowed:e.access.canResetGroundedShortTerm}].map(({label:t,onClick:n,allowed:r})=>z(t,!r||e.modeSaving||e.dreamDiaryActionLoading,()=>n()))}
        </div>
      </div>
      ${e.dreamDiaryActionMessage?m`
              <div
                class="callout ${e.dreamDiaryActionMessage.kind===`success`?`success`:`danger`}"
                role="status"
              >
                <div class="row wrap items-center gap-2">
                  <span>${e.dreamDiaryActionMessage.text}</span>
                  ${e.dreamDiaryActionArchivePath?z(d(`dreaming.wiki.copyArchivePath`),e.dreamDiaryActionLoading,()=>e.onCopyDreamingArchivePath()):p}
                </div>
              </div>
            `:p}

      <div class="dreams-advanced__sections">
        ${B({titleKey:`dreaming.advanced.stagedTitle`,descriptionKey:`dreaming.advanced.stagedDescription`,emptyKey:`dreaming.advanced.emptyGrounded`,entries:n,controls:z(d(`dreaming.scene.clearGrounded`),!e.access.canResetGroundedShortTerm||e.modeSaving||e.dreamDiaryActionLoading,()=>e.onResetGroundedShortTerm()),badge:()=>d(`dreaming.advanced.originDailyLog`),meta:e=>[e.groundedCount>0?`${e.groundedCount} ${d(`dreaming.stats.grounded`).toLowerCase()}`:``,e.recallCount>0?`${e.recallCount} recall`:``,e.dailyCount>0?`${e.dailyCount} daily`:``]})}
        ${B({titleKey:`dreaming.advanced.shortTermTitle`,descriptionKey:`dreaming.advanced.shortTermDescription`,emptyKey:`dreaming.advanced.emptyShortTerm`,entries:r,controls:m`
            <div class="dreams-advanced__sort">
              ${[[`recent`,`dreaming.advanced.sortRecent`],[`signals`,`dreaming.advanced.sortSignals`]].map(([n,r])=>m`
                  <button
                    class="dreams-advanced__sort-btn ${t.advancedWaitingSort===n?`dreams-advanced__sort-btn--active`:``}"
                    @click=${()=>{t.advancedWaitingSort=n,e.onViewStateChange()}}
                  >
                    ${d(r)}
                  </button>
                `)}
            </div>
          `,badge:mt,meta:e=>[`${e.totalSignalCount} ${d(`dreaming.stats.signals`).toLowerCase()}`,e.recallCount>0?`${e.recallCount} recall`:``,e.dailyCount>0?`${e.dailyCount} daily`:``,e.groundedCount>0?`${e.groundedCount} ${d(`dreaming.stats.grounded`).toLowerCase()}`:``,e.phaseHitCount>0?`${e.phaseHitCount} phase hit`:``]})}
        ${B({titleKey:`dreaming.advanced.promotedTitle`,descriptionKey:`dreaming.advanced.promotedDescription`,emptyKey:`dreaming.advanced.emptyPromoted`,entries:e.promotedEntries,badge:mt,meta:e=>[e.promotedAt?`${d(`dreaming.advanced.updatedPrefix`)} ${L(e.promotedAt)}`:``,e.groundedCount>0?`${e.groundedCount} ${d(`dreaming.stats.grounded`).toLowerCase()}`:``,e.totalSignalCount>0?`${e.totalSignalCount} ${d(`dreaming.stats.signals`).toLowerCase()}`:``]})}
      </div>

      ${e.statusError?m`<div class="dreams__controls-error">${e.statusError}</div>`:p}
    </section>
  `}function V(e,t){return t.length>0?m`
        <div class="dreams-diary__insight-list">
          <strong>${d(e)}</strong>
          ${t.map(e=>m`<p class="dreams-diary__insight-line">• ${e}</p>`)}
        </div>
      `:p}function H(e,t){return t?m`
        <p class="dreams-diary__insight-line">
          <strong>${d(e)}</strong>
          ${t}
        </p>
      `:p}function gt(e,t){if(e.kind===`import`){let n=e.item;return m`
      <p class="dreams-diary__insight-line">${n.summary}</p>
      ${V(`dreaming.wiki.candidateSignals`,n.candidateSignals)}
      ${V(`dreaming.wiki.corrections`,n.correctionSignals)}
      ${t?m`
              <div class="dreams-diary__insight-list">
                <strong>${d(`dreaming.wiki.importDetails`)}</strong>
                ${H(`dreaming.wiki.startedWith`,n.firstUserLine)}
                ${H(`dreaming.wiki.endedOn`,n.lastUserLine===n.firstUserLine?void 0:n.lastUserLine)}
                ${H(`dreaming.wiki.messages`,`${d(`dreaming.wiki.counts.userMessages`,{count:String(n.userMessageCount)})} · ${d(`dreaming.wiki.counts.assistantMessages`,{count:String(n.assistantMessageCount)})}`)}
                ${H(`dreaming.wiki.riskReasons`,n.riskReasons.join(`, `))}
                ${H(`dreaming.wiki.labels`,n.labels.join(`, `))}
              </div>
            `:p}
      ${n.preferenceSignals.length>0?m`
              <div class="dreams-diary__insight-signals">
                ${n.preferenceSignals.map(e=>m`<span class="dreams-diary__insight-signal">${e}</span>`)}
              </div>
            `:p}
    `}let n=e.item;return m`
    ${n.snippet?m`<p class="dreams-diary__insight-line">${n.snippet}</p>`:p}
    ${V(`dreaming.wiki.claims`,n.claims)}
    ${V(`dreaming.wiki.openQuestions`,n.questions)}
    ${V(`dreaming.wiki.contradictions`,n.contradictions)}
    ${t?m`
            <div class="dreams-diary__insight-list">
              <strong>${d(`dreaming.wiki.pageDetails`)}</strong>
              ${H(`dreaming.wiki.wikiPage`,n.pagePath)}
              ${H(`dreaming.wiki.id`,n.id)}
            </div>
          `:p}
  `}function _t(e,t){let n=e.viewState,r=t.item,i=t.kind===`import`?n.expandedInsightCards:n.expandedWikiCards,a=i.has(r.pagePath),o=t.kind===`import`?t.item.riskLevel:`wiki`,s=t.kind===`import`?d(t.item.digestStatus===`withheld`?`dreaming.wiki.risk.needsReview`:`dreaming.wiki.risk.${t.item.riskLevel}`):d(`dreaming.wiki.pageTypes.${t.item.kind}`),c=t.kind===`import`?t.item.activeBranchMessages>0?` · ${d(`dreaming.wiki.counts.messages`,{count:String(t.item.activeBranchMessages)})}`:``:` · ${r.pagePath}`;return m`
    <article
      class="dreams-diary__insight-card dreams-diary__insight-card--clickable"
      data-import-page=${t.kind===`import`?r.pagePath:p}
      data-wiki-page=${t.kind===`wiki`?r.pagePath:p}
      @click=${()=>{if(t.kind===`wiki`&&t.item.kind===`report`){lt(r.pagePath,e);return}ct(i,r.pagePath,e.onViewStateChange)}}
    >
      <div class="dreams-diary__insight-topline">
        <div class="dreams-diary__insight-title">${r.title}</div>
        <span class="dreams-diary__insight-badge dreams-diary__insight-badge--${o}">
          ${s}
        </span>
      </div>
      <div class="dreams-diary__insight-meta">
        ${r.updatedAt?L(r.updatedAt):ae(r.pagePath)}${c}
      </div>
      ${gt(t,a)}
      <div class="dreams-diary__insight-actions">
        ${z(d(a?`dreaming.wiki.hideDetails`:`dreaming.wiki.details`),!1,t=>{t.stopPropagation(),ct(i,r.pagePath,e.onViewStateChange)})}
        ${z(d(t.kind===`import`?`dreaming.wiki.openSourcePage`:`dreaming.wiki.openWikiPage`),!1,t=>{t.stopPropagation(),lt(r.pagePath,e)})}
      </div>
    </article>
  `}function vt(e,t,n){let r=e.viewState;return m`
    <div class="dreams-diary__daychips">
      ${t.map((t,i)=>m`
          <button
            class="dreams-diary__day-chip ${i===n?`dreams-diary__day-chip--active`:``}"
            @click=${()=>{r.diaryPage=i,e.onViewStateChange()}}
          >
            ${t}
          </button>
        `)}
    </div>
  `}function U(e,t,n=p){return m`
    <div class="dreams-diary__empty">
      ${n}
      <div class="dreams-diary__empty-text">${e}</div>
      ${t===void 0?p:m`<div class="dreams-diary__empty-hint">${t}</div>`}
    </div>
  `}function yt(e,t){let{clusters:n}=t;if(n.length===0)return U(d(t.loading?t.loadingKey:t.emptyKey),t.loading?void 0:d(t.emptyHintKey));let r=e.viewState,i=Math.max(0,Math.min(r.diaryPage,n.length-1)),a=_e(n[i],t.kind===`imports`?`selected imported insight cluster`:`selected memory overview cluster`),s=n.reduce((e,t)=>e+t.itemCount,0);return{navigation:vt(e,n.map(e=>e.label),i),content:m`
      <article class="dreams-diary__entry" key="${t.kind}-${a.key}">
        <div class="dreams-diary__accent"></div>
        <div class="dreams-diary__date">${t.date(a)}</div>
        ${t.truncated?m`<p class="dreams-diary__para dreams-diary__bounded-result">
                ${d(`dreaming.wiki.boundedResults`,{returned:s.toLocaleString(o.getLocale()),total:t.totalItems.toLocaleString(o.getLocale())})}
              </p>`:p}
        <div class="dreams-diary__prose">${t.prose(a)}</div>
        <div class="dreams-diary__insights">${a.items.map(t.renderItem)}</div>
      </article>
    `}}function bt(e){return yt(e,{kind:`imports`,clusters:e.wikiImportInsights?.clusters??[],totalItems:e.wikiImportInsights?.totalItems??0,truncated:e.wikiImportInsights?.truncated??!1,loading:e.wikiImportInsightsLoading,loadingKey:`dreaming.wiki.loadingInsights`,emptyKey:`dreaming.wiki.noInsights`,emptyHintKey:`dreaming.wiki.noInsightsHint`,date:e=>{let t=[d(`dreaming.wiki.counts.chats`,{count:String(e.itemCount)}),...e.highRiskCount>0?[d(`dreaming.wiki.counts.sensitive`,{count:String(e.highRiskCount)})]:[],...e.preferenceSignalCount>0?[d(`dreaming.wiki.counts.signals`,{count:String(e.preferenceSignalCount)})]:[]];return`${e.label} · ${t.join(` · `)}`},prose:e=>{let t=[d(`dreaming.wiki.importedClusterSummary`,{label:e.label.toLowerCase()}),...e.withheldCount>0?[d(e.withheldCount===1?`dreaming.wiki.withheldDigestOne`:`dreaming.wiki.withheldDigests`,{count:String(e.withheldCount)})]:[]];return m`<p class="dreams-diary__para">${t.join(` `)}</p>`},renderItem:t=>_t(e,{kind:`import`,item:t})})}function xt(e){let t=e.wikiOverview;return yt(e,{kind:`wiki`,clusters:t?.clusters??[],totalItems:t?.totalItems??0,truncated:t?.truncated??!1,loading:e.wikiOverviewLoading,loadingKey:`dreaming.wiki.loadingWiki`,emptyKey:`dreaming.wiki.emptyWiki`,emptyHintKey:`dreaming.wiki.emptyWikiHint`,date:()=>{let e=[[`page`,t?.totalPages??0],[`claimRow`,t?.totalClaims??0],[`openQuestion`,t?.totalQuestions??0],[`contradiction`,t?.totalContradictions??0]].filter(([e,t])=>e===`page`||t>0).map(([e,t])=>R(e,t));return`${d(`dreaming.wiki.vault`)} · ${e.join(` · `)}`},prose:e=>m`
      <p class="dreams-diary__para">
        ${d(`dreaming.wiki.fullVaultBreakdown`,{breakdown:t?ot(t.pageCounts):d(`dreaming.wiki.noPagesYet`)})}
      </p>
      <p class="dreams-diary__para">
        ${d(`dreaming.wiki.selectedSection`,{summary:st(e)})}
        ${e.updatedAt?` ${d(`dreaming.wiki.latestUpdate`,{date:L(e.updatedAt)})}`:``}
      </p>
    `,renderItem:t=>_t(e,{kind:`wiki`,item:t})})}function St(e){let t=e.viewState;if(typeof e.dreamDiaryContent!=`string`)return U(d(`dreaming.diary.noDreamsYet`),d(`dreaming.diary.noDreamsHint`),m`<div class="dreams-diary__empty-moon">
        <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
          <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="0.5" opacity="0.2" />
          <path d="M20 8a10 10 0 0 1 0 16 10 10 0 1 0 0-16z" fill="currentColor" opacity="0.08" />
        </svg>
      </div>`);let n=Qe(e.dreamDiaryContent);if(n.length===0)return U(d(`dreaming.diary.waitingTitle`),d(`dreaming.diary.waitingHint`));let r=n.toReversed(),i=Math.max(0,Math.min(t.diaryPage,r.length-1)),a=_e(r[i],`selected dreaming diary entry`);return{navigation:vt(e,r.map(e=>$e(e.date)),i),content:m`
      <article class="dreams-diary__entry" key="${i}">
        <div class="dreams-diary__accent"></div>
        ${a.date?m`<time class="dreams-diary__date">${a.date}</time>`:p}
        <div class="dreams-diary__prose">
          ${rt(a.body).map((e,t)=>m`<p class="dreams-diary__para" style="animation-delay: ${.3+t*.15}s;">
                ${we(De(e))}
              </p>`)}
        </div>
      </article>
    `}}function Ct(e){let t=e.viewState,n=t.activeDiarySubTab,r={dreams:{error:e.dreamDiaryError,loading:e.dreamDiaryLoading,refresh:e.onRefreshDiary,render:St,explainer:`dreaming.wiki.dreamsExplainer`},insights:{error:e.wikiImportInsightsError,loading:e.wikiImportInsightsLoading,refresh:e.onRefreshImports,render:bt,explainer:`dreaming.wiki.insightsExplainer`},wiki:{error:e.wikiOverviewError,loading:e.wikiOverviewLoading,refresh:e.onRefreshWikiOverview,render:xt,explainer:`dreaming.wiki.wikiExplainer`}}[n],i=n!==`dreams`&&!e.memoryWikiEnabled;if(r.error&&!i)return m`
      <section class="dreams-diary">
        <div class="dreams-diary__error">${r.error}</div>
      </section>
    `;let a=r.render(e),o=`navigation`in a?a.navigation:p,s=`content`in a?a.content:a;return m`
    <section class="dreams-diary">
      <div class="dreams-diary__chrome">
        <div class="dreams-diary__header">
          <span class="dreams-diary__title">${d(`dreaming.diary.title`)}</span>
          ${x({id:`dream-diary`,active:n,tabs:[{value:`dreams`,label:d(`dreaming.wiki.dreamsTab`)},{value:`insights`,label:d(`dreaming.wiki.insightsTab`)},{value:`wiki`,label:d(`dreaming.wiki.wikiTab`)}],ariaLabel:d(`dreaming.diary.title`),panelId:`dream-diary-panel`,variant:`sub`,onSelect:n=>{t.wikiPreview=null,t.activeDiarySubTab=n,t.diaryPage=0,e.onViewStateChange()}})}
          ${z(i?d(`dreaming.wiki.howToEnable`):n===`dreams`?d(r.loading?`dreaming.diary.reloading`:`dreaming.diary.reload`):r.loading?`Reloading…`:`Reload`,i?!e.access.canOpenConfig:e.modeSaving||r.loading,()=>{t.diaryPage=0,i?e.onOpenConfig():r.refresh()})}
        </div>
        <p class="dreams-diary__explainer">${d(r.explainer)}</p>
        ${i?p:o}
      </div>

      <div
        id="dream-diary-panel"
        role="tabpanel"
        aria-labelledby=${`dream-diary-tab-${n}`}
      >
        ${i?m`
                <div class="dreams-diary__empty">
                  <div class="dreams-diary__empty-text">${d(`dreaming.wiki.unavailable`)}</div>
                  <div class="dreams-diary__empty-hint">
                    ${d(`dreaming.wiki.unavailablePluginPrefix`)}
                    <code>memory-wiki</code> ${d(`dreaming.wiki.unavailablePluginSuffix`)}
                  </div>
                  <div class="dreams-diary__empty-hint">
                    ${d(`dreaming.wiki.enablePrefix`)}
                    <code>plugins.entries.memory-wiki.enabled = true</code>${d(`dreaming.wiki.enableSuffix`)}
                  </div>
                  <div class="dreams-diary__empty-actions">
                    ${z(d(`dreaming.wiki.openConfig`),!e.access.canOpenConfig,()=>e.onOpenConfig())}
                  </div>
                </div>
              `:s}
      </div>
      ${dt(e)}
    </section>
  `}var wt,Tt,W,Et,Dt,Ot,kt;function At(){return(At=e((()=>{xe(),Ce(),h(),Te(),ke(),ze(),Be(),je(),f(),c(),w(),Ie(),se(),Fe(),C(),wt=/<!--\s*zero:dreaming:diary:start\s*-->/,Tt=/<!--\s*zero:dreaming:diary:end\s*-->/,W=[`dreaming.phrases.consolidatingMemories`,`dreaming.phrases.tidyingKnowledgeGraph`,`dreaming.phrases.replayingConversations`,`dreaming.phrases.weavingShortTerm`,`dreaming.phrases.defragmentingMemoryLane`,`dreaming.phrases.filingLooseThoughts`,`dreaming.phrases.connectingDots`,`dreaming.phrases.compostingContext`,`dreaming.phrases.alphabetizingSubconscious`,`dreaming.phrases.promotingHunches`,`dreaming.phrases.forgettingNoise`,`dreaming.phrases.dreamingEmbeddings`,`dreaming.phrases.reorganizingAttic`,`dreaming.phrases.indexingDay`,`dreaming.phrases.nurturingInsights`,`dreaming.phrases.simmeringIdeas`,`dreaming.phrases.whisperingVectorStore`],Et=[`light`,`deep`,`rem`],Dt=6e3,Ot=[{top:8,left:15,size:3,delay:0,hue:`neutral`},{top:12,left:72,size:2,delay:1.4,hue:`neutral`},{top:22,left:35,size:3,delay:.6,hue:`accent`},{top:18,left:88,size:2,delay:2.1,hue:`neutral`},{top:35,left:8,size:2,delay:.9,hue:`neutral`},{top:45,left:92,size:2,delay:1.7,hue:`neutral`},{top:55,left:25,size:3,delay:2.5,hue:`accent`},{top:65,left:78,size:2,delay:.3,hue:`neutral`},{top:75,left:45,size:2,delay:1.1,hue:`neutral`},{top:82,left:60,size:3,delay:1.8,hue:`accent`},{top:30,left:55,size:2,delay:.4,hue:`neutral`},{top:88,left:18,size:2,delay:2.3,hue:`neutral`}],kt=[[`source`,`sources`],[`synthesis`,`syntheses`],[`report`,`reports`],[`entity`,`entities`],[`concept`,`concepts`]]})))()}function jt(e){let t=Object.values(e?.phases??{}).flatMap(e=>e.enabled&&typeof e.nextRunAtMs==`number`?[e.nextRunAtMs]:[]).toSorted((e,t)=>e-t)[0];return l(t,{hour:`numeric`,minute:`2-digit`},``)||null}var G;function Mt(){return(Mt=e((()=>{ye(),h(),fe(),ce(),ue(),Ae(),Ee(),c(),w(),oe(),ee(),E(),Pe(),s(),a(),I(),Ze(),At(),C(),G=class extends ie{constructor(...e){super(...e),this.agentId=``,this.dreaming=D(),this.toggleConfirmLoading=!1,this.pendingEnabled=null,this.viewState=et(),this.gateway=new Ne(this,{getGateway:()=>this.context?.gateway,onSnapshot:({snapshot:e,initial:t,sourceChanged:n})=>this.applyGatewaySnapshot(e,t?`initial`:n?`replacement`:void 0)}),this.selectedAgentId=null,this.subscriptions=new r(this).effect(()=>this.context?.runtimeConfig,e=>(this.syncConfigSnapshot(),e.subscribe(()=>{this.syncConfigSnapshot(),this.requestUpdate()})))}updated(e){e.has(`agentId`)&&this.applyAgentId()}disconnectedCallback(){this.subscriptions.clear(),this.resetTransientState(),this.dreaming=D(),super.disconnectedCallback()}captureTaskScope(){let e=this.gateway.gateway;return e?{gateway:e,epoch:this.gateway.epoch,state:this.dreaming}:null}isTaskScopeCurrent(e){return this.isConnected&&this.gateway.gateway===e.gateway&&this.gateway.epoch===e.epoch&&this.context.gateway===e.gateway&&this.dreaming===e.state}resetTransientState(){this.viewState.wikiPreview=null,this.toggleConfirmLoading=!1,this.pendingEnabled=null}createGatewayState(e=this.context.gateway.snapshot){return D({client:e.client,connected:e.phase===`connected`,hello:e.hello,configSnapshot:this.context.runtimeConfig.state.configSnapshot,selectedAgentId:this.selectedAgentId})}applyGatewaySnapshot(e,t){let n=this.dreaming.client!==e.client,r=this.dreaming.connected!==(e.phase===`connected`),i=t===`replacement`||n||r;i?(this.dreaming=this.createGatewayState(e),t!==`initial`&&this.resetTransientState()):(this.dreaming.connected=e.phase===`connected`,this.dreaming.hello=e.hello),e.phase===`connected`&&this.selectedAgentId&&i&&this.loadResources(),this.requestUpdate()}applyAgentId(){let e=this.agentId.trim()||null;this.selectedAgentId!==e&&(this.selectedAgentId=e,this.gateway.invalidate(),this.resetTransientState(),this.dreaming=this.createGatewayState(),e&&this.dreaming.connected&&this.loadResources())}syncConfigSnapshot(){this.dreaming.configSnapshot=this.context.runtimeConfig.state.configSnapshot}async runDreamingTask(e,t=this.captureTaskScope()){if(!t||!this.isTaskScopeCurrent(t))return;let n=e(t.state);this.requestUpdate();try{let e=await n;return this.isTaskScopeCurrent(t)?e:void 0}finally{this.isTaskScopeCurrent(t)&&this.requestUpdate()}}async confirmDreamingTask(e,t){let n=this.captureTaskScope();n&&await Oe(t)&&this.isTaskScopeCurrent(n)&&await this.runDreamingTask(t=>M(t,e),n)}runDiaryAction(e){return this.runDreamingTask(t=>M(t,e))}async loadResources(e=`all`,t=e!==`all`){let n=this.captureTaskScope();if(!n?.state.selectedAgentId||e===`all`&&(!n.state.client||!n.state.connected))return;let r=this.context.runtimeConfig;await(t?r.refresh():r.ensureLoaded()),this.isTaskScopeCurrent(n)&&this.context.runtimeConfig===r&&(this.syncConfigSnapshot(),e===`all`?await Promise.all([`dreamingStatus`,`dreamDiary`,`wikiImportInsights`,`wikiOverview`].map(e=>this.runDreamingTask(t=>j(t,e),n))):await this.runDreamingTask(t=>j(t,e),n))}setEnabled(e){!O(this.dreaming,`config.patch`,`operator.admin`)||this.dreaming.dreamingModeSaving||this.toggleConfirmLoading||this.pendingEnabled!==null||(this.pendingEnabled=e,this.dreaming.dreamingStatusError=null)}cancelToggle(){this.toggleConfirmLoading||(this.pendingEnabled=null,this.dreaming.dreamingStatusError=null)}async confirmToggle(){let e=this.pendingEnabled;if(e==null||this.toggleConfirmLoading||!O(this.dreaming,`config.patch`,`operator.admin`))return;this.toggleConfirmLoading=!0,this.dreaming.dreamingStatusError=null;let t=this.captureTaskScope(),n=this.context.runtimeConfig;if(!t){this.toggleConfirmLoading=!1;return}try{let r=()=>this.isTaskScopeCurrent(t)&&this.context.runtimeConfig===n&&O(t.state,`config.patch`,`operator.admin`),i=await this.runDreamingTask(t=>Ye(t,n,e,r),t);if(!this.isTaskScopeCurrent(t)||this.context.runtimeConfig!==n)return;if(!i){this.dreaming.dreamingStatusError??=d(`dreaming.toggleConfirmation.failed`);return}if(await n.refresh(),!this.isTaskScopeCurrent(t)||this.context.runtimeConfig!==n||(this.syncConfigSnapshot(),await this.runDreamingTask(e=>j(e,`dreamingStatus`),t),!this.isTaskScopeCurrent(t)))return;this.pendingEnabled=null}finally{this.isTaskScopeCurrent(t)&&(this.toggleConfirmLoading=!1)}}async openWikiPage(e){let t=this.captureTaskScope(),n=t?.state.client,r=t?.state.selectedAgentId;if(!t||!n||!t.state.connected||!r)return null;let i=await n.request(`wiki.get`,{lookup:e,fromLine:1,lineCount:5e3,agentId:r});if(!this.isTaskScopeCurrent(t)||t.state.selectedAgentId!==r)return null;let a=be(i),o=typeof a?.content==`string`&&a.content.length>0?a.content:d(`dreaming.wiki.noContent`),s=_(a?.updatedAt),c=typeof a?.totalLines==`number`&&Number.isFinite(a.totalLines)?Math.max(0,Math.floor(a.totalLines)):void 0;return{title:_(a?.title)??e,path:_(a?.path)??e,content:o,...c===void 0?{}:{totalLines:c},...a?.truncated===!0?{truncated:!0}:{},...s?{updatedAt:s}:{}}}render(){let e=this.dreaming,t=this.context.runtimeConfig.state,n=A(re(t)),r=n.engineOff?null:e.dreamingStatus,i=r?.enabled??n.enabled,a=e.dreamingStatusLoading||e.dreamingModeSaving,o=O(e,`config.patch`,`operator.admin`),s=t=>O(e,t,`operator.write`),c=e.dreamingStatusLoading||e.dreamDiaryLoading,l=e.selectedAgentId??``;return m`
      <section
        class="content-header content-header--page agent-memory-panel__header"
        ${de({toolbarHeader:!0})}
      >
        <div class="page-meta">
          <div class="dreaming-header-controls">
            <button
              class="btn btn--subtle btn--sm"
              ?disabled=${a||e.dreamDiaryLoading}
              @click=${()=>void this.loadResources(`all`,!0)}
            >
              ${d(c?`dreaming.header.refreshing`:`dreaming.header.refresh`)}
            </button>
            <span class="muted">
              ${n.engineOff?d(`dreaming.header.engineOff`):Me(d(`common.enabled`),n.overridden)}
            </span>
            <button
              class="dreams__phase-toggle ${i?`dreams__phase-toggle--on`:``}"
              ?disabled=${!o||a||n.engineOff}
              @click=${()=>this.setEnabled(!i)}
            >
              <span class="dreams__phase-toggle-dot"></span>
              <span class="dreams__phase-toggle-label">
                ${d(i?`dreaming.header.on`:`dreaming.header.off`)}
              </span>
            </button>
          </div>
        </div>
      </section>
      ${nt({access:{canOpenConfig:O(e,`config.openFile`,`operator.admin`,{requireAdvertisement:!1}),canBackfillDiary:s(`doctor.memory.backfillDreamDiary`),canDedupeDreamDiary:s(`doctor.memory.dedupeDreamDiary`),canResetDiary:s(`doctor.memory.resetDreamDiary`),canResetGroundedShortTerm:s(`doctor.memory.resetGroundedShortTerm`),canRepairDreamingArtifacts:s(`doctor.memory.repairDreamingArtifacts`)},viewState:this.viewState,active:i,selectedAgentId:l,shortTermCount:r?.shortTermCount??0,promotedCount:r?.promotedToday??0,phases:r?.phases??void 0,shortTermEntries:r?.shortTermEntries??[],promotedEntries:r?.promotedEntries??[],nextCycle:jt(r),timezone:r?.timezone??null,statusError:e.dreamingStatusError,modeSaving:e.dreamingModeSaving,dreamDiaryLoading:e.dreamDiaryLoading,dreamDiaryActionLoading:e.dreamDiaryActionLoading,dreamDiaryActionMessage:e.dreamDiaryActionMessage,dreamDiaryActionArchivePath:e.dreamDiaryActionArchivePath,dreamDiaryError:e.dreamDiaryError,dreamDiaryContent:e.dreamDiaryContent,memoryWikiEnabled:T(t.configSnapshot,`memory-wiki`,{enabledByDefault:!1}),wikiImportInsightsLoading:e.wikiImportInsightsLoading,wikiImportInsightsError:e.wikiImportInsightsError,wikiImportInsights:e.wikiImportInsights,wikiOverviewLoading:e.wikiOverviewLoading,wikiOverviewError:e.wikiOverviewError,wikiOverview:e.wikiOverview,onRefreshDiary:()=>void this.runDreamingTask(e=>j(e,`dreamDiary`)),onRefreshImports:()=>void this.loadResources(`wikiImportInsights`),onRefreshWikiOverview:()=>void this.loadResources(`wikiOverview`),onOpenConfig:()=>void this.context.runtimeConfig.openFile(),onOpenWikiPage:e=>this.openWikiPage(e),onBackfillDiary:()=>void this.runDiaryAction(`doctor.memory.backfillDreamDiary`),onCopyDreamingArchivePath:()=>void this.runDreamingTask(Je),onDedupeDreamDiary:()=>void this.confirmDreamingTask(`doctor.memory.dedupeDreamDiary`,{title:d(`dreaming.scene.dedupeDiary`),message:d(`dreaming.actions.confirmDedupeDescription`),confirmLabel:d(`dreaming.scene.dedupeDiary`),danger:!0}),onResetDiary:()=>void this.runDiaryAction(`doctor.memory.resetDreamDiary`),onResetGroundedShortTerm:()=>void this.runDiaryAction(`doctor.memory.resetGroundedShortTerm`),onRepairDreamingArtifacts:()=>void this.confirmDreamingTask(`doctor.memory.repairDreamingArtifacts`,{title:d(`dreaming.scene.repairCache`),message:d(`dreaming.actions.confirmRepairDescription`),confirmLabel:d(`dreaming.scene.repairCache`)}),onViewStateChange:()=>this.requestUpdate()})}
      ${Xe({open:this.pendingEnabled!==null,enabling:this.pendingEnabled===!0,loading:this.toggleConfirmLoading,onConfirm:()=>void this.confirmToggle(),onCancel:()=>this.cancelToggle(),hasError:!!e.dreamingStatusError})}
    `}},v([ve({context:le,subscribe:!0})],G.prototype,`context`,void 0),v([pe({attribute:!1})],G.prototype,`agentId`,void 0),v([g()],G.prototype,`dreaming`,void 0),v([g()],G.prototype,`toggleConfirmLoading`,void 0),v([g()],G.prototype,`pendingEnabled`,void 0),customElements.get(`zero-agent-memory-panel`)||customElements.define(`zero-agent-memory-panel`,G)})))()}var Nt,Pt,Ft,It,Lt,Rt,zt,Bt,Vt,Ht,Ut,Wt,Gt,Kt;function K(){return(K=e((()=>{Nt=`Run shell now.`,Pt=`Inspect/control exec sessions.`,Ft=`Schedule reminders, automations, wake events.`,It=`List visible sessions; filters/previews.`,Lt=`Read sanitized session history.`,Rt=`Search past session transcripts.`,zt=`Run same-Gateway session/agent.`,Bt=`Spawn hidden subagent (ephemeral) or visible work session (durable).`,Vt=`Wait for collector subagents.`,Ht=`Show session status/model/usage.`,Ut=`Ask the user and wait for an answer.`,Wt=`Suggest follow-up work for operator approval.`,Gt=`Withdraw a pending task suggestion.`,Kt=`Save, improve, archive, and restore your learned skills.`})))()}var qt;function q(){return(q=e((()=>{qt=`automations`})))()}function J(e,t,n){return n.map(([n,r,i])=>({id:n,description:r,sectionId:e,...t,...i}))}function Y(e){return X.filter(t=>t.profiles.includes(e)).map(e=>e.id)}function Jt(){let e=new Map;for(let t of X){if(t.includeInSectionGroup===!1)continue;let n=`group:${t.sectionId}`,r=e.get(n)??[];r.push(t.id),e.set(n,r)}return{"group:zero":X.filter(e=>e.includeInZeroGroup).map(e=>e.id),...Object.fromEntries(e.entries())}}function Yt(e){if(!e)return;let t=$t[e];if(t?.allow||t?.deny)return{allow:t.allow?[...t.allow]:void 0,deny:t.deny?[...t.deny]:void 0}}function Xt(e){let t=e?.swarmEnabled===!0;return Qt.map(n=>({id:n.id,label:n.label,tools:n.tools.filter(n=>(n.id!==`agents_wait`||t)&&(n.id!==`personal_instructions`||e?.personalInstructionsEnabled===!0)).map(e=>({id:e.id,label:e.id,description:e.description}))})).filter(e=>e.tools.length>0)}var Zt,X,Qt,$t,en;function Z(){return(Z=e((()=>{K(),q(),Zt=[{id:`fs`,label:`Files`},{id:`runtime`,label:`Runtime`},{id:`web`,label:`Web`},{id:`memory`,label:`Memory`},{id:`sessions`,label:`Sessions`},{id:`ui`,label:`UI`},{id:`messaging`,label:`Messaging`},{id:`automation`,label:`Automation`},{id:`nodes`,label:`Nodes`},{id:`agents`,label:`Agents`},{id:`media`,label:`Media`}],X=[...J(`agents`,{profiles:[`coding`,`messaging`],includeInZeroGroup:!0},[[`decision_evaluate`,`Evaluate explicit evidence with the agent's decision model`]]),...J(`fs`,{profiles:[`coding`],executionLocation:`placement`},[[`ls`,`List directory entries`],[`read`,`Read file contents`],[`write`,`Create or overwrite files`],[`edit`,`Make precise edits`],[`apply_patch`,`Patch files`]]),...J(`runtime`,{profiles:[`coding`]},[[`exec`,Nt,{executionLocation:`placement`}],[`process`,Pt,{executionLocation:`placement`}],[`code_execution`,`Run sandboxed remote analysis`,{includeInZeroGroup:!0}],[`secrets`,`Request and manage write-only credentials`,{profiles:[`coding`,`messaging`],includeInZeroGroup:!0}]]),...J(`web`,{profiles:[`coding`],includeInZeroGroup:!0},[[`web_search`,`Search the web`],[`web_fetch`,`Fetch web content`],[`x_search`,`Search X posts`]]),...J(`memory`,{profiles:[`coding`],includeInZeroGroup:!0},[[`memory_search`,`Semantic search`],[`memory_get`,`Read memory files`],[`personal_instructions`,`Edit the requesting user’s personal instructions`,{profiles:[`coding`,`messaging`]}]]),...J(`sessions`,{profiles:[`coding`,`messaging`],includeInZeroGroup:!0},[[`presence`,`Online people, connected devices, recent activity, and connection location`,{executionLocation:`gateway`,profiles:[`minimal`,`coding`,`messaging`]}],[`sessions`,`Session settings: label, pin, archive, groups`],[`sessions_list`,It],[`sessions_history`,Lt],[`sessions_search`,Rt],[`conversations_list`,`List exact external conversation addresses`],[`conversations_send`,`Send to an exact external conversation`],[`conversations_turn`,`Send and wait for a correlated external reply`],[`sessions_send`,zt,{executionLocation:`gateway`}],[`sessions_spawn`,Bt,{executionLocation:`gateway`}],[`github_identity_status`,`Inspect the effective GitHub identity and credential health`,{profiles:[`coding`]}],[`github_publish`,`Publish the reconciled session worktree as a draft GitHub pull request`,{profiles:[`coding`]}],[`agents_wait`,Vt,{profiles:[`coding`]}],[`sessions_yield`,`End turn to receive sub-agent results`],[`subagents`,`Background work: subagents, media gen, automation runs. list/cancel.`],[`session_status`,Ht,{profiles:[`minimal`,`coding`,`messaging`]}],[`suggest_task`,Wt,{profiles:[`coding`]}],[`dismiss_task`,Gt,{profiles:[`coding`]}]]),...J(`ui`,{profiles:[`coding`],includeInZeroGroup:!0},[[`browser`,`Control web browser`,{executionLocation:`placement`,profiles:[]}],[`screen`,`Drive operator web UI`],[`theme`,`List, select, and create appearance themes`,{profiles:[`coding`,`messaging`]}],[`dashboard`,`Read and arrange the session dashboard`],[`terminal`,`Use shared operator terminals with policy-governed input`],[`portal`,`Expose local web apps through the gateway`,{executionLocation:`gateway`}],[`canvas`,`Control node Canvas surfaces when the Canvas plugin is enabled`,{profiles:[],includeInZeroGroup:!1}],[`show_widget`,`Show an interactive widget on chat or an auto-fitting dashboard`,{profiles:[]}]]),...J(`messaging`,{profiles:[`messaging`],includeInZeroGroup:!0},[[`message`,`Send messages`]]),...J(`automation`,{profiles:[],includeInZeroGroup:!0},[[`heartbeat_respond`,`Accept heartbeat outcomes for post-turn handling`],[qt,Ft,{profiles:[`coding`]}],[`gateway`,`Update Zero; read Gateway config/schema when permitted`,{profiles:[`minimal`,`coding`,`messaging`]}],[`plugins`,`Manage and reload plugins`,{profiles:[`coding`]}],[`zero`,`Delegate Zero setup and repair`]]),...J(`nodes`,{profiles:[],includeInZeroGroup:!0},[[`nodes`,`Nodes + devices`],[`computer`,`Control the Gateway desktop or a paired computer`,{executionLocation:`placement`}],[`mobile_ui`,`Observe and control a paired Android app`]]),...J(`agents`,{profiles:[`coding`],includeInZeroGroup:!0},[[`agents_list`,`List agents`,{profiles:[]}],[`get_goal`,`Get current thread goal`],[`create_goal`,`Create a thread goal`],[`update_goal`,`Complete or block a thread goal`],[`progress_card`,`Maintain the session progress card`],[`ask_user`,Ut,{profiles:[`coding`,`messaging`]}],[`skill_workshop`,Kt,{executionLocation:`gateway`}],[`skills_search`,`Search installed eligible skills`],[`skills_read`,`Read complete installed skill instructions`]]),...J(`media`,{profiles:[`coding`],includeInZeroGroup:!0},[[`view_image`,`Image understanding`],[`image_generate`,`Image generation`],[`music_generate`,`Music generation`],[`video_generate`,`Video generation`],[`transcripts`,`Inspect and manage meeting transcript captures`,{profiles:[],includeInSectionGroup:!1,includeInZeroGroup:!1}],[`tts`,`Text-to-speech conversion`,{profiles:[]}],[`pdf`,`PDF reading and extraction`,{profiles:[]}]])],new Map(X.map(e=>[e.id,e])),Object.freeze(X.filter(e=>e.executionLocation).map(e=>e.id)),Qt=Zt.map(({id:e,label:t})=>({id:e,label:t,tools:X.filter(t=>t.sectionId===e)})),$t={minimal:{allow:Y(`minimal`)},coding:{allow:[...Y(`coding`),`bundle-mcp`]},messaging:{allow:[...Y(`messaging`),`bundle-mcp`]},full:{allow:[`*`]}},en=Jt()})))()}function tn(e){return e===`automations`?`cron`:e===`view_image`?`image`:e.replace(/_([a-z])/gu,(e,t)=>t.toUpperCase())}function nn(e){return e?.groups?.length?e.groups.map(e=>{let t=$.get(e.id);return{id:e.id,label:t?d(`agents.toolCatalog.groups.${t}`):e.label,source:e.source,pluginId:e.pluginId,tools:e.tools.map(e=>({id:e.id,label:e.label,description:e.description,source:e.source,pluginId:e.pluginId,optional:e.optional,defaultProfiles:[...e.defaultProfiles]}))}}):Xt().map(e=>({id:e.id,label:d(`agents.toolCatalog.groups.${$.get(e.id)}`),tools:e.tools.map(e=>({...e,description:t(`agents.toolCatalog.descriptions.${tn(e.id)}`)??e.description}))}))}function rn(e){return e?.profiles?.length?e.profiles.map(e=>{let t=an.get(e.id);return t?{id:e.id,label:d(t)}:e}):Q.map(e=>({id:e.id,label:d(e.labelKey)}))}var Q,$,an;function on(){return(on=e((()=>{Z(),q(),c(),Q=[{id:`minimal`,labelKey:`agents.toolCatalog.profiles.minimal`},{id:`coding`,labelKey:`agents.toolCatalog.profiles.coding`},{id:`messaging`,labelKey:`agents.toolCatalog.profiles.messaging`},{id:`full`,labelKey:`agents.toolCatalog.profiles.full`}],$=new Map(Xt().map(e=>[e.id,e.id===`fs`?`files`:e.id])),an=new Map(Q.map(e=>[e.id,e.labelKey]))})))()}export{en as a,Mt as c,N as d,nn as i,I as l,on as n,Z as o,rn as r,Yt as s,Q as t,A as u};
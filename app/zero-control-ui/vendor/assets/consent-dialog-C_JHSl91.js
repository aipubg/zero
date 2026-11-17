import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Gu as t,Pu as n,Wu as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{ca as a,qr as o,sa as s}from"./control-ui-core-DwX5Mpz4.js";import{G as c,J as l,W as u}from"./lit-runtime-B40xFCK_.js";import{In as d,Ln as f}from"./control-ui-boot-shared-BRtBCr5s.js";import{Cn as p,I as m,Sn as h,Y as g,Z as _,q as v}from"./control-ui-boot-shared-ZuP0LiFD.js";import{Ec as y,Tc as b,wc as x}from"./control-ui-boot-shared-CzJHozXQ.js";import{dt as S,ft as C}from"./control-ui-boot-chat-D02HpoEK.js";import{n as w,t as T}from"./reasoned-disabled-control-DN3lFs3n.js";var E,D;function O(){return(O=e((()=>{t(),E={pluginConsent:{widenedTitle:`What changed`,widenedDescription:`New since your last acceptance.`,previouslyAccepted:`Previously accepted {date}.`,declaredTitle:`Declared capabilities`,declaredDescription:`From the plugin manifest. Zero validates the plugin against these declarations when it loads.`,declaredEmpty:`No channels, providers, or tools declared in the manifest.`,contracts:`Contracts`,hooks:`Hooks`,runtimeHooks:`Code plugins may register hooks at runtime; their hook names are not declared in the manifest.`,mcpServers:`MCP servers`,cliCommands:`CLI commands`,cliBackends:`CLI backends`,skills:`Skills`,dangerousFlags:`Dangerous config flags`,grantsTitle:`Your grants`,grantsDescription:`Set per plugin in plugins.entries.{id}. Hooks outside these grants are blocked at load.`,promptInjection:`Prompt injection`,conversationAccess:`Conversation access`,allowed:`Allowed`,blocked:`Blocked`,on:`On`,off:`Off`,grantDefault:`(default)`,grantConfigured:`(set in config)`,externalAccessHint:`Off by default for external plugins.`,modelOverrides:`Model overrides`,subagentModelOverrides:`Subagent model overrides`,modelOverride:`Model override: {value}`,allowedModels:`Allowed models: {models}`,allowedCompletionModels:`Completion models: {models}`,authProfileOverride:`Auth profile override: {value}`,agentIdOverride:`Agent ID override: {value}`,noOverrides:`No overrides configured`,loading:`Loading capability details…`,fallback:`Capability details must be available before you can approve this plugin.`,verifiedClean:`Verified clean`,reviewRecommended:`Review recommended`,reviewRequired:`Review required`,trustBlocked:`Blocked`,scanDate:`Scanned {date}`,integrity:`Integrity`,sha256:`SHA-256`,commit:`Commit`,pinnedArtifact:`Pinned to the exact installed artifact.`,sourceClawHub:`ClawHub`,sourceNpm:`npm`,sourceGit:`Git`,sourcePath:`Local path`,sourceArchive:`Archive`,sourceMarketplace:`Marketplace`,community:`Community`,enableNamed:`Enable {name}`,installPolicy:{technicalDetails:`Technical details`,severity:{info:`Info`,warn:`Warning`,critical:`Critical`},policyScope:`Continuing approves every install-policy warning encountered during this install. Each warning is checked again before installation continues.`}}},D=Object.assign(()=>{r.pluginConsent=E.pluginConsent},{catalog:E})})))()}function k(e,t,n={}){let{iconUrl:r,onIconError:i,authorIconUrl:a,loading:o=!1,className:u=`plugins-tile`,whiteBackground:d=!1}=n,f=(n,r,a)=>{let f=n?a.loading:o;if(n||f)return l`<span
        class=${`${u}${d?` plugins-tile--white`:``}${f?` skeleton`:``}`}
        data-plugin-icon-id=${e}
        aria-hidden="true"
      >
        ${n?l`<img
                class="plugins-icon"
                src=${n}
                alt=""
                loading="eager"
                decoding="async"
                ?hidden=${f}
                @load=${a.onLoad}
                @error=${()=>{r(),i?.()}}
              />`:c}
      </span>`;let[p,m]=b(e),h=y(t);return l`<span
      class=${`${u} ${u}--fallback`}
      data-plugin-icon-id=${e}
      style=${`--plugins-art-a:${p};--plugins-art-b:${m}`}
      aria-hidden="true"
    >
      ${h?l`<span>${h}</span>`:s.plug}
    </span>`};return l`${h(r,(e,t,n)=>e?f(e,t,n):l`${h(a,f)}`)}`}function A(e,t,n=!1){return v({title:e,control:l`<span class=${n?`plugins-consent__row--warning`:``}>${t}</span>`,stackedOnNarrow:!0,carapace:!0})}function j(e){return l`<span class="plugins-consent__items">${e.join(`, `)}</span>`}function M(e,t=!1){return d.flatMap(n=>{let r=e[n];return r?.length&&(t||n!==`dangerousConfigFlags`)?[A(i(U[n]),j(r),t)]:[]})}function N(e){let t=M(e);return g({title:i(`pluginConsent.declaredTitle`),description:i(`pluginConsent.declaredDescription`),carapace:!0},l`${t.length?t:v({title:i(`pluginConsent.declaredEmpty`),carapace:!0})}
    ${e.hooks.length===0?A(i(`pluginConsent.hooks`),i(`pluginConsent.runtimeHooks`)):c}
    ${e.dangerousConfigFlags.length>0?A(i(`pluginConsent.dangerousFlags`),j(e.dangerousConfigFlags),!0):c}`)}function P(e){if(!e.widened)return c;let t=M(e.widened,!0);return t.length===0?c:l`
    <section class="plugins-consent__section oc-section">
      <h3>${i(`pluginConsent.widenedTitle`)}</h3>
      <p class="plugins-consent__description">
        ${i(`pluginConsent.widenedDescription`)}
        ${e.acceptedAt?i(`pluginConsent.previouslyAccepted`,{date:e.acceptedAt}):c}
      </p>
      <div class="plugins-consent__rows">${t}</div>
    </section>
  `}function F(e,t,n){return`${i(e.effective?t:n)} ${i(e.configured===void 0?`pluginConsent.grantDefault`:`pluginConsent.grantConfigured`)}`}function I(e,t){return t===void 0?void 0:i(e,{value:i(t?`pluginConsent.allowed`:`pluginConsent.blocked`)})}function L(e){return[I(`pluginConsent.modelOverride`,e.allowModelOverride),e.allowedModels?.length?i(`pluginConsent.allowedModels`,{models:e.allowedModels.join(`, `)}):void 0,`allowedCompletionModels`in e&&e.allowedCompletionModels?.length?i(`pluginConsent.allowedCompletionModels`,{models:e.allowedCompletionModels.join(`, `)}):void 0,`allowAuthProfileOverride`in e?I(`pluginConsent.authProfileOverride`,e.allowAuthProfileOverride):void 0,`allowAgentIdOverride`in e?I(`pluginConsent.agentIdOverride`,e.allowAgentIdOverride):void 0].filter(Boolean).join(` · `)||i(`pluginConsent.noOverrides`)}function R(e,t){let n=e.hooks.allowConversationAccess;return g({title:i(`pluginConsent.grantsTitle`),description:i(`pluginConsent.grantsDescription`),carapace:!0},l`
      ${A(i(`pluginConsent.promptInjection`),F(e.hooks.allowPromptInjection,`pluginConsent.allowed`,`pluginConsent.blocked`))}
      ${A(i(`pluginConsent.conversationAccess`),l`
          ${F(n,`pluginConsent.on`,`pluginConsent.off`)}
          ${!n.effective&&n.configured===void 0&&t!==`bundled`?l`<span class="plugins-consent__hint">
                  ${i(`pluginConsent.externalAccessHint`)}
                </span>`:c}
        `)}
      ${[`llm`,`subagent`].map(t=>{let n=e[t];return n?A(i(t===`llm`?`pluginConsent.modelOverrides`:`pluginConsent.subagentModelOverrides`),L(n)):c})}
    `)}function z(e,t){if(t)return i(`pluginsPage.official`);let n=e&&Object.hasOwn(G,e)?G[e]:void 0;return n?i(n):e??(t===!1?i(`pluginConsent.community`):null)}function B(e){if(!e)return c;let t=e.integrityKind===`sha256`?i(`pluginConsent.sha256`):e.integrityKind===`git-commit`?i(`pluginConsent.commit`):i(`pluginConsent.integrity`);return l`
    <div class="plugins-consent__provenance">
      <span
        >${[i(W[e.kind]),e.spec??e.packageName].filter(Boolean).join(` · `)}</span
      >
      ${e.integrity?l`<span title=${e.integrity}>
              ${t}: <code>${e.integrity.slice(0,20)}…</code>
            </span>`:c}
    </div>
    ${e.integrity?l`<p class="plugins-consent__hint">${i(`pluginConsent.pinnedArtifact`)}</p>`:c}
  `}function V(e){if(!e)return c;let t=i(e.disposition===`clean`?`pluginConsent.verifiedClean`:e.disposition===`review-recommended`?`pluginConsent.reviewRecommended`:e.disposition===`review-required`?`pluginConsent.reviewRequired`:`pluginConsent.trustBlocked`),n=e.disposition===`clean`?`ok`:e.disposition===`blocked`?`danger`:`warn`;return l`
    <section class="plugins-consent__trust">
      ${_({kind:n,label:t,carapace:!0})}
      ${e.reasons?.length?l`<ul>
              ${e.reasons.map(e=>l`<li>${e}</li>`)}
            </ul>`:c}
      ${e.checkedAt?l`<p class="plugins-consent__hint">
              ${i(`pluginConsent.scanDate`,{date:e.checkedAt})}
            </p>`:c}
    </section>
  `}function H(e){let{consent:t,inspection:n}=e,r=t.details,a=n?.plugin,o=t.fallback,s=n?.source?.packageName,u=t.pluginId,d=a?.name??o.name,f=a?.version??o.version,p=[z(a?.origin,o.official),s].filter(Boolean).join(` · `),m=e.busy?i(`pluginsPage.working`):i(`pluginConsent.enableNamed`,{name:d}),h=!e.canMutate||e.busy||e.loading||!!e.error||!n,g=l`
    <button
      type="button"
      class="btn primary oc-action oc-action-primary"
      ?disabled=${h&&!e.mutationBlockedReason}
      aria-disabled=${e.canMutate?c:`true`}
      @click=${()=>{h||e.onConfirm()}}
    >
      ${m}
    </button>
  `;return l`
    <zero-modal-dialog
      label=${d}
      style="--zero-modal-width: min(560px, calc(100vw - 32px));"
      @modal-cancel=${e.onCancel}
    >
      <section class="plugins-consent oc-card" data-plugin-consent=${t.intent.kind}>
        <header class="plugins-consent__header">
          ${k(u,d,{iconUrl:e.iconUrl,loading:e.iconLoading})}
          <div>
            <div class="plugins-detail__title">
              <h2>${d}</h2>
              ${f?l`<span class="plugins-version">${`v${f}`}</span>`:c}
            </div>
            ${p?l`<p class="plugins-consent__description">${p}</p>`:c}
          </div>
        </header>
        ${e.loading?l`<p class="plugins-consent__hint" role="status">${i(`pluginConsent.loading`)}</p>`:e.error?l`<div class="plugins-consent__error" role="alert">
                  <span>${e.error}</span>
                  <button
                    type="button"
                    class="btn btn--sm oc-action oc-action-secondary"
                    @click=${e.onRetry}
                  >
                    ${i(`pluginsPage.tryAgain`)}
                  </button>
                </div>`:n?l`
                    ${B(n.source)} ${V(n.trust)}
                    ${r?P(r):c}
                    ${N(n.declared)}
                    ${R(n.grants,a?.origin)}
                  `:l`<p class="plugins-consent__description">${i(`pluginConsent.fallback`)}</p>`}
        <footer class="plugins-consent__actions">
          <button type="button" class="btn oc-action oc-action-secondary" @click=${e.onCancel}>
            ${i(`pluginsPage.cancel`)}
          </button>
          ${w(e.mutationBlockedReason,g)}
        </footer>
      </section>
    </zero-modal-dialog>
  `}var U,W,G;function K(){return(K=e((()=>{u(),f(),a(),p(),o(),T(),m(),n(),O(),S(),x(),C(),D(),U={channels:`pluginsPage.categoryChannels`,providers:`pluginsPage.categoryProviders`,tools:`pluginsPage.categoryTools`,contracts:`pluginConsent.contracts`,hooks:`pluginConsent.hooks`,mcpServers:`pluginConsent.mcpServers`,cliCommands:`pluginConsent.cliCommands`,cliBackends:`pluginConsent.cliBackends`,skills:`pluginConsent.skills`,dangerousConfigFlags:`pluginConsent.dangerousFlags`},W={bundled:`pluginsPage.included`,"official-catalog":`pluginsPage.official`,clawhub:`pluginConsent.sourceClawHub`,npm:`pluginConsent.sourceNpm`,git:`pluginConsent.sourceGit`,path:`pluginConsent.sourcePath`,archive:`pluginConsent.sourceArchive`,marketplace:`pluginConsent.sourceMarketplace`},G={bundled:`pluginsPage.included`,global:`pluginsPage.global`,workspace:`pluginsPage.workspace`,config:`pluginsPage.config`,official:`pluginsPage.official`}})))()}export{k as n,H as r,K as t};
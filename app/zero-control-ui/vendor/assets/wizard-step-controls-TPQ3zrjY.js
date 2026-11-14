import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Pu as t,bu as n,xu as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{Fi as a,ca as o,sa as s}from"./control-ui-core-DwX5Mpz4.js";import{G as c,J as l,W as u,c as d,l as f}from"./lit-runtime-B40xFCK_.js";import{an as p,dn as m,fn as h,ln as g,on as _,un as v}from"./control-ui-boot-shared-ZuP0LiFD.js";function y(e){return`*`.repeat(Array.from(S.segment(e)).length)}function b(e){let t=e.closest(`[data-sensitive-input]`)?.querySelector(`[data-sensitive-mask-text]`);t&&(t.textContent=y(e.value),t.style.transform=`translateX(${-e.scrollLeft}px)`)}function x(e){let t=i(e.revealed?`configForm.hideValue`:`configForm.revealValue`),n=t=>{let n=t.currentTarget;b(n),e.onInput(n.value)},r=e=>{b(e.currentTarget)};return l`
    <span
      class="oc-sensitive-input"
      data-sensitive-input
      data-sensitive-mask-ready="true"
      data-revealed=${String(e.revealed)}
    >
      <span
        class="oc-sensitive-mask"
        aria-hidden="true"
        data-sensitive-mask
        ?hidden=${e.revealed}
      >
        <span
          data-sensitive-mask-text
          .textContent=${e.revealed?``:y(e.value)}
        ></span>
      </span>
      <input
        id=${e.id}
        class="input"
        name="wizard-text"
        type=${e.revealed?`text`:`password`}
        autocomplete="off"
        spellcheck="false"
        placeholder=${e.placeholder??``}
        .value=${e.value}
        ?disabled=${e.disabled}
        aria-invalid=${e.invalid?`true`:c}
        aria-describedby=${e.describedBy??c}
        aria-label=${e.label??c}
        data-sensitive-value
        @input=${n}
        @change=${r}
        @focus=${r}
        @scroll=${r}
      />
      <zero-tooltip .content=${t}>
        <button
          type="button"
          class="oc-sensitive-toggle"
          aria-label=${t}
          aria-controls=${e.id}
          aria-pressed=${String(e.revealed)}
          data-sensitive-icon=${e.revealed?`eye-off`:`eye`}
          ?disabled=${e.disabled}
          @click=${e.onToggle}
        >
          ${e.revealed?s.eyeOff:s.eye}
        </button>
      </zero-tooltip>
    </span>
  `}var S;function C(){return(C=e((()=>{u(),t(),o(),a(),S=new Intl.Segmenter(void 0,{granularity:`grapheme`})})))()}function w(e,t=i(`modelSetup.wizard.continue`)){return l`
    <button type="button" class="btn primary" disabled aria-busy="true" aria-label=${t}>
      <span class="btn__label">${t}</span>
      <span class="btn__spinner" aria-hidden="true"></span>
      <span class="sr-only" role="status" aria-live="polite">${e}</span>
    </button>
  `}function T(e,t){return`${e.presentation===`channels`?`channels-wizard`:`wizard-step`}__${t}`}function E(e){return e.message||e.title||i(`chat.questions.answer`)}function D(e){return e.step.message?l`<div class=${T(e,`message`)}>
        ${n(e.step.message)}
      </div>`:c}function O(e,t,n){return t===`channels`?l`
      <span class="channels-wizard__option-label">
        ${n===void 0?c:n?`☑ `:`☐ `}${e.label}
      </span>
      ${e.hint?l`<span class="channels-wizard__option-hint">${e.hint}</span>`:c}
    `:l`
    <span>
      <strong>${e.label}</strong>
      ${e.hint?l`<small>${e.hint}</small>`:c}
    </span>
  `}function k(e){let t=e.deviceCode,n=i(t?`modelSetup.wizard.copyCode`:`modelSetup.wizard.copyLink`),r=t?.code??e.externalUrl;return l`
    <div class="wizard-step__sign-in">
      <p class="muted">${t?.message??i(`modelSetup.wizard.browserInstructions`)}</p>
      ${t?l`<code class="wizard-step__sign-in-code">${t.code}</code>`:c}
      <div class="wizard-step__actions">
        ${e.externalUrl?l`<a class="btn primary wizard-step__external-link" data-link-reader-external href=${e.externalUrl} target="_blank" rel="noreferrer">${i(`modelSetup.wizard.openSignIn`)}</a>`:c}
        ${r?f(r,l`<button type="button" class="btn" @click=${e=>void p(e,r,n)}><span data-copy-label>${n}</span></button>`):c}
      </div>
      <div class="muted" role="status" aria-live="polite">${i(`modelSetup.wizard.waiting`)}</div>
      ${t?.expiresInMinutes?l`<div class="muted">${i(`modelSetup.wizard.expires`,{count:String(t.expiresInMinutes)})}</div>`:c}
      ${t?l`<p class="muted">${i(`modelSetup.wizard.deviceCodeWarning`)}</p>`:c}
    </div>
  `}function A(e,t){let n=E(e.step);if(e.presentation!==`channels`&&t.length<=2)return l`<div
      class="wizard-step__actions"
      role="group"
      aria-label=${n}
      aria-describedby=${e.validationErrorId??c}
    >
      ${t.map((t,n)=>l`<button type="button" class=${n===0?`btn primary`:`btn`} ?disabled=${e.busy} @click=${()=>e.onAnswer(t.value)}>${O(t)}</button>`)}
    </div>`;let r=t.findIndex(t=>Object.is(t.value,e.value)),i=e.presentation===`channels`&&e.channelSelect&&t.every(e=>typeof e.value==`string`);return(i?v:h)({label:n,value:r<0?null:String(i?t[r]?.value:r),options:t.map((e,t)=>({value:String(i?e.value:t),label:e.label,description:e.hint,kind:i?`channel`:`neutral`})),disabled:e.busy,invalid:!!e.validationErrorId,describedBy:e.validationErrorId,onChange:n=>e.onAnswer(i?n:t[Number(n)]?.value)})}function j(e,t,n,r=e.busy){let i=e.answerLabel??t;if(e.presentation===`channels`&&e.busy)return l`<div class="channels-wizard__footer">
      ${w(e.busyLabel??i)}
    </div>`;let a=l`
    <button
      type=${n?`button`:`submit`}
      class="btn primary"
      ?disabled=${r}
      @click=${n}
    >
      ${i}
    </button>
  `;return e.presentation===`channels`?l`<div class="channels-wizard__footer">${a}</div>`:e.leadingAction?l`<div class="wizard-step__actions wizard-step__actions--split">
        ${e.leadingAction}${a}
      </div>`:a}function M(e,t,n){let r=n.some(e=>Object.is(e,t.value));return e.presentation===`channels`?l`<button
      type="button"
      class="channels-wizard__option"
      aria-pressed=${r?`true`:`false`}
      ?disabled=${e.busy}
      aria-invalid=${e.validationErrorId?`true`:c}
      aria-describedby=${e.validationErrorId??c}
      @click=${()=>e.onValueChange(t.value)}
    >
      ${O(t,e.presentation,r)}
    </button>`:l`<label class="wizard-step__option">
    <input
      type="checkbox"
      .checked=${r}
      ?disabled=${e.busy}
      aria-invalid=${e.validationErrorId?`true`:c}
      aria-describedby=${e.validationErrorId??c}
      @change=${r=>{let i=r.currentTarget.checked?[...n,t.value]:n.filter(e=>!Object.is(e,t.value));e.onValueChange(i)}}
    />
    ${O(t)}
  </label>`}function N(e){return e.externalUrl||e.deviceCode?k(e):c}function P(e){return l`
    ${D(e)} ${N(e.step)}
    ${j(e,i(`modelSetup.wizard.continue`),()=>e.onAnswer(void 0))}
  `}function F(e){return l`
    ${e.step.externalUrl||e.step.deviceCode?c:l`<div class="wizard-step__progress" role="status" aria-live="polite">
            <span class="wizard-step__spinner" aria-hidden="true"></span>
            ${D(e)}
          </div>`}
    ${N(e.step)}
    ${e.leadingAction?l`<div class="wizard-step__actions wizard-step__actions--split">
            ${e.leadingAction}
          </div>`:c}
  `}function I(e){let t=e.step,r=typeof e.value==`string`?e.value:``,a=t.sensitive&&e.onToggleSensitiveVisibility?x({id:e.inputId,value:r,revealed:e.sensitiveRevealed===!0,placeholder:t.placeholder,disabled:e.busy,invalid:!!e.validationErrorId,describedBy:e.validationErrorId,label:t.message?void 0:E(t),onInput:e.onValueChange,onToggle:e.onToggleSensitiveVisibility}):l`<input
          id=${e.inputId}
          class="input"
          name="wizard-text"
          type=${t.sensitive?`password`:`text`}
          autocomplete=${t.sensitive?`off`:`on`}
          placeholder=${t.placeholder??``}
          .value=${r}
          ?disabled=${e.busy}
          aria-invalid=${e.validationErrorId?`true`:c}
          aria-describedby=${e.validationErrorId??c}
          aria-label=${t.message?c:E(t)}
          @input=${t=>e.presentation!==`channels`&&e.onValueChange(t.currentTarget.value)}
        />`,o=l`
    <form
      class="wizard-step__form"
      @submit=${t=>{t.preventDefault();let n=t.currentTarget.elements.namedItem(`wizard-text`);e.onAnswer(e.presentation===`channels`?n?.value??``:r)}}
    >
      ${t.message?l`<div class=${T(e,`message`)}>
              <label for=${e.inputId}>${n(t.message)}</label>
            </div>`:c}
      ${e.externalAuthInput?c:N(t)} ${a}
      ${j(e.externalAuthInput?{...e,leadingAction:void 0}:e,i(`modelSetup.wizard.submit`))}
    </form>
  `;return e.externalAuthInput?l`
        ${N(t)}
        <details class="wizard-step__manual-entry">
          <summary class="muted">${i(`modelSetup.wizard.manualEntry`)}</summary>
          ${o}
        </details>
        <div class="wizard-step__actions wizard-step__actions--split">
          ${e.leadingAction??c}
        </div>
      `:o}function L(e){let t=e.step.options??[];if(e.step.type!==`multiselect`)return l`
      ${D(e)} ${A(e,t)}
      ${e.presentation===`channels`?e.busy?j(e,i(`modelSetup.wizard.continue`),void 0,!0):c:e.leadingAction??c}
    `;let n=Array.isArray(e.value)?e.value:[],r=e.presentation===`channels`?[...n]:n;return l`
    ${D(e)}
    <div
      class=${T(e,`options`)}
      role="group"
      aria-label=${E(e.step)}
      aria-describedby=${e.validationErrorId??c}
    >
      ${t.map(t=>M(e,t,n))}
    </div>
    ${j(e,i(`modelSetup.wizard.continue`),()=>e.onAnswer(r),e.busy)}
  `}function R(e){let t=T(e,e.presentation===`channels`?`footer`:`actions`);return l`
    ${D(e)}
    <div
      class=${e.presentation!==`channels`&&e.leadingAction?`${t} wizard-step__actions--split`:t}
    >
      ${e.presentation===`channels`?c:e.leadingAction??c}
      ${e.presentation===`channels`&&e.busy?w(e.busyLabel??i(`common.loading`)):[!1,!0].map(t=>l`<button
                type="button"
                class=${t?`btn primary`:`btn`}
                ?disabled=${e.busy}
                @click=${()=>e.onAnswer(t)}
              >
                ${t?e.confirmAffirmativeLabel??i(`common.yes`):i(`common.no`)}
              </button>`)}
    </div>
  `}function z(e){switch(e.step.type){case`text`:return I(e);case`select`:case`multiselect`:return L(e);case`confirm`:return R(e);case`progress`:return e.step.executor===`gateway`?F(e):P(e);case`note`:return e.busy&&(e.step.externalUrl||e.step.deviceCode)?F(e):P(e);case`action`:return P(e)}return c}function B(){return(B=e((()=>{u(),d(),t(),r(),g(),_(),m(),C()})))()}export{w as n,z as r,B as t};
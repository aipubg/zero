import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Lu as t,Nu as n,Pu as r,ci as i,di as a,fi as o,ii as s,ju as c,li as l,ni as u,ri as d,si as f,ti as p,ui as m,zu as h}from"./control-ui-core-DCNBgr3X.js";import{Qn as g,Xn as _,Zn as v,ca as y,qn as b,sa as x}from"./control-ui-core-DwX5Mpz4.js";import{E as S,G as C,J as w,M as T,N as E,P as D,W as O,Z as k,at as A,k as j,n as ee,rt as M,t as te}from"./lit-runtime-B40xFCK_.js";import{En as N,Tn as P}from"./control-ui-boot-shared-BRtBCr5s.js";import{Zr as F,_a as I,wa as L}from"./ui-AaV6iNVa.js";import{$ as ne,B as re,G as R,H as z,I as B,R as ie,ct as ae,et as V,ut as oe}from"./control-ui-boot-shared-ZuP0LiFD.js";import{i as se,n as ce,r as le,t as ue}from"./config-form.tiers-B9QpQUK9.js";import{a as de,c as fe,f as pe,i as me,l as he,n as ge,o as _e,r as ve,s as ye,t as be,u as xe}from"./config-form.search-DBYkS-qK.js";import{A as Se,C as Ce,D as we,E as Te,F as Ee,H,I as De,L as Oe,M as ke,N as Ae,O as je,P as Me,R as Ne,S as U,T as Pe,_ as Fe,a as Ie,b as Le,c as Re,d as ze,f as W,g as Be,h as Ve,i as He,j as G,k as Ue,l as We,m as Ge,n as Ke,o as qe,p as Je,r as K,s as Ye,t as Xe,u as q,v as Ze,w as Qe,x as $e,y as et,z as J}from"./config-form.node.shared-Biqvmvhi.js";import{i as tt,n as nt,r as rt,t as it}from"./phone-runtime-DRt4IZ3-.js";function at(e,t,n,r){let i=t[n];if(i===void 0)return{ok:!1};let a=n===t.length-1;if(typeof i==`number`){if(e!=null&&!Array.isArray(e))return{ok:!1};let o=Array.isArray(e)?[...e]:[];if(a)return r===void 0?o.splice(i,1):o[i]=r,{ok:!0,value:o};let s=at(o[i],t,n+1,r);return s.ok?(o[i]=s.value,{ok:!0,value:o}):s}if(e!=null&&(typeof e!=`object`||Array.isArray(e)))return{ok:!1};let o=e?{...e}:{},s=a?{ok:!0,value:r}:at(Object.hasOwn(o,i)?o[i]:void 0,t,n+1,r);return s.ok?(a&&s.value===void 0?delete o[i]:Object.defineProperty(o,i,{value:s.value,enumerable:!0,configurable:!0,writable:!0}),{ok:!0,value:o}):s}function ot(e,t,n){return t.length===0?{ok:!0,value:n}:at(e,t,0,n)}function st(e){if(e.value!==void 0||e.isRequired===!0||e.structuredDraftOwner===!0)return;let t=a(e.schema);if(t!==`object`&&t!==`array`)return;let n=e.schema.default,r=t===`object`?{}:[];return(t===`object`&&L(n)||t===`array`&&Array.isArray(n))&&(r=structuredClone(n)),P(e.schema,r)?void 0:r}var ct;function lt(){return(lt=e((()=>{O(),k(),r(),n(),G(),H(),ct=class extends c{constructor(...e){super(...e),this.error=``}willUpdate(e){if(!e.has(`props`))return;let t=e.get(`props`),n=this.props;n&&(!t||t.identity!==n.identity||!Object.is(t.sourceIdentity,n.sourceIdentity))&&(this.draftValue=structuredClone(n.initialValue),this.error=``)}patchDraft(e,t){let n=this.props,r=this.draftValue;if(!n||!r)return!1;let i=n.params.path;if(e.length<i.length||!i.every((t,n)=>t===e[n]))return!1;let o=ot(r,e.slice(i.length),t);if(!o.ok)return!1;let s=o.value,c=a(n.params.schema);return c===`object`&&!L(s)||c===`array`&&!Array.isArray(s)?!1:(this.draftValue=s,this.error=``,!P(n.params.schema,s)||n.params.onPatch(i,s)!==!1||(this.error=h(`configForm.draftRejected`),!1))}render(){let e=this.props,t=this.draftValue;if(!e||!t)return C;let n=J(e.params.path,`structured-draft-error`);return w`
      ${e.renderNode({...e.params,value:t,sourceIdentity:t,controlIdentity:t,structuredDraftOwner:!0,onPatch:(e,t)=>this.patchDraft(e,t),onRemove:e=>this.patchDraft(e,void 0)})}
      ${this.error?w`
              <div class="settings-row settings-row--stacked cfg-structured-draft__error">
                <div class="settings-row__control">
                  <span id=${n} class="cfg-field__error" role="alert">${this.error}</span>
                </div>
              </div>
            `:C}
    `}},F([A({attribute:!1})],ct.prototype,`props`,void 0),F([M()],ct.prototype,`draftValue`,void 0),F([M()],ct.prototype,`error`,void 0),customElements.get(`zero-config-form-structured-draft`)||customElements.define(`zero-config-form-structured-draft`,ct)})))()}var ut;function dt(){return(dt=e((()=>{G(),ut=class{constructor(){this.identities=new WeakMap,this.previous=[]}read(e){let t=this.identities.get(e);if(t?.length===e.length)return this.previous=e,t;let n=this.identities.get(this.previous)??[],r=new Set(this.previous.flatMap((t,n)=>N(t,e[n])?[]:[n])),i=e.map((e,t)=>{let i=N(e,this.previous[t])?t:[...r].find(t=>N(e,this.previous[t]));return i===void 0?Symbol(`array-row`):(r.delete(i),n[i])});return this.identities.set(e,i),this.previous=e,i}patch(e,t,n){let r=this.previous;this.identities.set(e,t);let i=n(e)!==!1;return i||(this.identities.delete(e),this.previous=r),i}}})))()}function ft(e,t){let n=e.currentTarget;if(!(n instanceof HTMLElement))return;let r=n.closest(`.cfg-block`);Array.from(r?.getElementsByTagName(`zero-config-form-collection-draft`)??[]).find(e=>e.parentElement===r&&e.id===t)?.openDraft?.()}var Y;function pt(){return(pt=e((()=>{O(),k(),r(),n(),G(),_(),H(),Y=class extends c{constructor(...e){super(...e),this.draftOpen=!1,this.draftKey=``,this.draftValue=``,this.draftIsNull=!1,this.error=``,this.invalidTarget=null}willUpdate(e){let t=e.get(`props`),n=this.props;t&&(!n||t.identity!==n.identity||!Object.is(t.sourceIdentity,n.sourceIdentity)&&!N(t.sourceIdentity,n.sourceIdentity))&&this.closeDraft()}openDraft(){this.props?.disabled||(this.draftOpen=!0,this.updateComplete.then(()=>{this.querySelector(`[data-collection-draft-value]`)?.focus()}))}clearError(){this.error=``,this.invalidTarget=null}closeDraft(){this.draftOpen=!1,this.draftKey=``,this.draftValue=``,this.draftIsNull=!1,this.clearError()}fail(e,t){this.invalidTarget=e,this.error=t,this.updateComplete.then(()=>{this.querySelector(e===`key`?`[data-collection-draft-key]`:`[data-collection-draft-value]`)?.focus()})}parseValue(e){if(this.draftIsNull)return{ok:!0,value:null};let t=a(e),n=e.anyOf??e.oneOf??[],r=n.some(m)&&n.some(e=>[`number`,`integer`].includes(a(e)??``));if(t===`string`)return{ok:!0,value:this.draftValue};if(t===`number`||t===`integer`){let e=b(this.draftValue,t===`integer`);return typeof e==`number`?{ok:!0,value:e}:{ok:!1,message:h(`configForm.invalidNumber`)}}try{let t=JSON.parse(this.draftValue);if(typeof t==`number`){let t=b(this.draftValue,!1);return typeof t==`number`?{ok:!0,value:t}:r&&P(e,this.draftValue)?{ok:!0,value:this.draftValue}:{ok:!1,message:h(`configForm.invalidNumber`)}}return{ok:!0,value:t}}catch{return r&&P(e,this.draftValue)?{ok:!0,value:this.draftValue}:{ok:!1,message:h(`configForm.invalidJson`)}}}commit(){let e=this.props;if(!e||e.disabled)return;let t=this.parseValue(e.schema);if(!t.ok){this.fail(`value`,t.message);return}if(!P(e.schema,t.value)){this.fail(`value`,[`number`,`integer`].includes(a(e.schema)??``)?h(`configForm.invalidNumber`):h(`configForm.invalidString`));return}if(e.existingValues?.some(e=>N(e,t.value))||e.validateValue?.(t.value)===!1){this.fail(`value`,h(`configForm.invalidString`));return}let n=this.draftKey.trim();if(e.existingKeys&&(!n||e.existingKeys.includes(n)||e.validateKey?.(n)===!1)){this.fail(`key`,h(`configForm.invalidString`));return}this.dispatchEvent(new CustomEvent(`config-collection-draft-commit`,{bubbles:!0,composed:!0,cancelable:!0,detail:{...e.existingKeys?{key:n}:{},value:t.value}}))?this.closeDraft():this.fail(`value`,h(`configForm.invalidString`))}updated(){let e=this.querySelector(`[data-collection-draft-key]`),t=this.querySelector(`[data-collection-draft-value]`);e?.setCustomValidity(this.invalidTarget===`key`?this.error:``),t?.setCustomValidity(this.invalidTarget===`value`?this.error:``)}render(){let e=this.props;if(!e||!this.draftOpen||e.disabled)return C;let t=a(e.schema),n=P(e.schema,null),r=t===`string`||t===`number`||t===`integer`,i=`${this.id}-error`,o=`${h(`configForm.add`)}: ${e.label}`,s=r?w`
          <input
            data-collection-draft-value
            type=${t===`string`?`text`:`number`}
            class="settings-input"
            aria-label=${o}
            aria-describedby=${i}
            aria-invalid=${this.invalidTarget===`value`?`true`:`false`}
            .value=${this.draftValue}
            ?disabled=${this.draftIsNull}
            @input=${e=>{this.draftValue=e.currentTarget.value,this.clearError()}}
          />
        `:w`
          <textarea
            data-collection-draft-value
            class="settings-input"
            aria-label=${o}
            aria-describedby=${i}
            aria-invalid=${this.invalidTarget===`value`?`true`:`false`}
            placeholder=${h(`configForm.jsonValue`)}
            rows="2"
            .value=${this.draftValue}
            ?disabled=${this.draftIsNull}
            @input=${e=>{this.draftValue=e.currentTarget.value,this.clearError()}}
          ></textarea>
        `;return w`
      <div class="settings-row settings-row--stacked cfg-collection-draft">
        <div class="settings-row__control">
          <div class="cfg-collection-draft__controls">
            ${e.existingKeys?w`
                    <input
                      data-collection-draft-key
                      type="text"
                      class="settings-input"
                      aria-label=${h(`configForm.key`)}
                      aria-describedby=${i}
                      aria-invalid=${this.invalidTarget===`key`?`true`:`false`}
                      placeholder=${h(`configForm.key`)}
                      .value=${this.draftKey}
                      @input=${e=>{this.draftKey=e.currentTarget.value,this.clearError()}}
                    />
                  `:C}
            ${n?w`
                    <label class="field checkbox">
                      <input
                        data-collection-draft-null
                        type="checkbox"
                        .checked=${this.draftIsNull}
                        @change=${e=>{this.draftIsNull=e.currentTarget.checked,this.clearError()}}
                      />
                      <span>${h(`configForm.nullValue`)}</span>
                    </label>
                  `:C}
            ${s}
            <span id=${i} class="cfg-field__error" role="alert" ?hidden=${!this.error}
              >${this.error}</span
            >
            <div class="cfg-collection-draft__actions">
              <button type="button" class="btn btn--sm" @click=${()=>this.commit()}>
                ${e.existingKeys?h(`configForm.addEntry`):h(`configForm.add`)}
              </button>
              <button type="button" class="btn btn--sm" @click=${()=>this.closeDraft()}>
                ${h(`common.cancel`)}
              </button>
            </div>
          </div>
        </div>
      </div>
    `}},F([A({attribute:!1})],Y.prototype,`props`,void 0),F([M()],Y.prototype,`draftOpen`,void 0),F([M()],Y.prototype,`draftKey`,void 0),F([M()],Y.prototype,`draftValue`,void 0),F([M()],Y.prototype,`draftIsNull`,void 0),F([M()],Y.prototype,`error`,void 0),F([M()],Y.prototype,`invalidTarget`,void 0),customElements.get(`zero-config-form-collection-draft`)||customElements.define(`zero-config-form-collection-draft`,Y)})))()}function mt(e,t){let{schema:n,value:r,path:i,hints:a,disabled:o,reservedKeys:s,validateKey:c,onPatch:l,searchCriteria:u,revealSensitive:d,isSensitivePathRevealed:f,onToggleSensitivePath:m}=e,g=e.showLabel!==!1||s.size>0,_=qe(n),v=_?{}:Se(n),y=J(i,`map-draft`),b={schema:n,label:h(`configForm.customEntries`),disabled:o,identity:JSON.stringify(i.filter(e=>typeof e==`string`)),sourceIdentity:e.sourceIdentity??r,existingKeys:[...new Set([...Object.keys(r),...s])],validateKey:c},x=Object.entries(r).filter(([e])=>!s.has(e)),S=u&&be(u)?x.filter(([e,t])=>me({schema:n,value:t,path:[...i,e],hints:a,criteria:u})):x;return u&&be(u)&&S.length===0?C:w`
    <div class="cfg-block cfg-map">
      <div class="settings-row">
        ${g?w`<div class="settings-row__text">
                <span class="settings-row__title">${h(`configForm.customEntries`)}</span>
              </div>`:C}
        <div class="settings-row__control">
          <button
            type="button"
            class="btn btn--sm"
            aria-controls=${y}
            ?disabled=${o}
            @click=${e=>{if(v===Pe){ft(e,y);return}let t={...r},n=1,a=`custom-${n}`;for(;a in t;)n+=1,a=`custom-${n}`;t[a]=v,l(i,t)===!1&&ft(e,y)}}
          >
            ${h(`configForm.addEntry`)}
          </button>
        </div>
      </div>

      <zero-config-form-collection-draft
        id=${y}
        .props=${b}
        @config-collection-draft-commit=${e=>{let t=e.detail.key;(!t||Object.hasOwn(r,t)||s.has(t)||l(i,{...r,[t]:e.detail.value})===!1)&&e.preventDefault()}}
      ></zero-config-form-collection-draft>
      ${S.length===0?C:w`
              <div class="settings-subrows">
                ${S.map(([s,g])=>{let v=[...i,s],y=He({path:v,value:g,hints:a,revealSensitive:d??!1,isSensitivePathRevealed:f});return w`
                    <div class="settings-row">
                      <div class="settings-row__text">
                        <input
                          type="text"
                          class="settings-input"
                          placeholder=${h(`configForm.key`)}
                          aria-label=${`${h(`configForm.key`)}: ${s}`}
                          .value=${s}
                          ?disabled=${o}
                          @change=${e=>{let t=e.currentTarget;if(!(t instanceof HTMLInputElement))return;let n=t.value.trim();if(!n||n===s){t.value=s;return}let a=c(n)?p(r[s])?h(`configForm.renameRedactedBlocked`):``:h(`configForm.invalidString`);if(n in r||a){t.value=s,a&&(t.setCustomValidity(a),t.reportValidity(),t.setCustomValidity(``));return}let o={...r,[n]:r[s]};delete o[s],l(i,o)===!1&&(t.value=s)}}
                        />
                      </div>
                      <div class="settings-row__control">
                        ${We(h(`configForm.removeEntry`),o,()=>{let e={...r};return delete e[s],l(i,e)!==!1})}
                      </div>
                    </div>
                    ${_?q({label:s,showLabel:!1,stacked:!0,control:ze({schema:n,path:v,ariaLabel:`${s}: ${h(`configForm.jsonValue`)}`,sourceValue:g,fallback:Re(g),rows:2,sensitiveState:y,disabled:o,isRequired:!0,onToggleSensitivePath:m,onPatch:l})}):t({...Xe(e),schema:n,value:g,path:v,isRequired:!0,sourceIdentity:g,controlIdentity:r,searchCriteria:u,showLabel:!1,onPatch:l})}
                  `})}
              </div>
            `}
    </div>
  `}function ht(){return(ht=e((()=>{O(),r(),s(),pt(),G(),Ie(),ge(),H()})))()}function gt(e){let{schema:t,value:n,path:r,hints:i,onPatch:a,onRemove:s,searchCriteria:c}=e,d=c&&be(c)&&de({schema:t,path:r,hints:i,criteria:c})?void 0:c,f=n===void 0&&t.default!==void 0,p=f?t.default:n,m=p===void 0?xt:p,h=I(p),g=De(t).map(e=>[e,Oe(t,e)]).filter(e=>!!e[1]),_=Ne(t),v=g.toSorted((e,t)=>{let n=u([...r,e[0]],i)?.order??0,a=u([...r,t[0]],i)?.order??0;return n===a?e[0].localeCompare(t[0]):n-a}),y=new Set(g.map(([e])=>e)),b=Ee(t),x=!!b&&typeof b==`object`,S=(e,n)=>{if(e.length<r.length||!r.every((t,n)=>t===e[n]))return!1;let i,c=e.slice(r.length);if(c.length===0){if(!L(n))return!1;i=n}else{try{i=structuredClone(h)}catch{return!1}n===void 0?l(i,c):o(i,c,n)}return Ue(t,h,i)?f?a(r,i)!==!1:(n===void 0&&s?s(e):a(e,n))!==!1:!1};return{fields:v.map(([t,n])=>{let i=f&&Object.hasOwn(h,t);return Object.assign(Xe(e),{schema:i?{...n,default:h[t]}:n,value:f?void 0:h[t],path:[...r,t],isRequired:_.has(t),sourceIdentity:f?void 0:h[t],controlIdentity:e.controlIdentity??h,searchCriteria:d,onPatch:S})}),additional:x?{...e,schema:b,value:h,sourceIdentity:m,reservedKeys:y,validateKey:e=>ke(t,e),searchCriteria:d,onPatch:S}:null}}function _t(e,t){let{schema:n,path:r,hints:i}=e,{label:a,help:o}=ye(r,n,i),s=gt(e),c=w`
    ${s.fields.map(e=>t(e))}
    ${s.additional?mt(s.additional,t):C}
  `;return r.length===1||e.showLabel===!1?c:w`
    <details class="cfg-object cfg-block" ?open=${r.length<=2}>
      <summary class="settings-row cfg-object__summary">
        <div class="settings-row__text">
          <span class="settings-row__title">${a}</span>
          ${o?w`<span class="settings-row__desc">${o}</span>`:C}
        </div>
        <div class="settings-row__control">
          <span class="settings-row__chevron cfg-object__chevron">${x.chevronRight}</span>
        </div>
      </summary>
      <div class="settings-subrows">${c}</div>
    </details>
  `}function vt(e,t){return w`${Ct(e,t)}`}function yt(e,t,n){let{schema:r,value:i,path:a,hints:o,disabled:s,onPatch:c,searchCriteria:l}=e,u=e.showLabel??!0,d=e.showHeaderMeta??u,{label:f,help:p}=ye(a,r,o),m=l&&be(l)&&de({schema:r,path:a,hints:o,criteria:l})?void 0:l,g=Array.isArray(r.items)?r.items:void 0,_=Array.isArray(r.items)?r.items[0]??{}:r.items;if(!_)return q({label:f,showLabel:!0,control:C,error:h(`configForm.unsupportedArray`)});let v=i===void 0&&Array.isArray(r.default),y=Array.isArray(i)?i:Array.isArray(r.default)?r.default:void 0,b=y??[],S=y??bt,T=He({...e,value:b}).isRedacted?C:W(r,i),E=n.read(b),D=(e,t)=>n.patch(e,t,e=>c(a,e)),{minItems:O,maxItems:k,uniqueItems:A}=we(r),j=e=>fe(r,e)??(g?{}:_),M=Math.max(1,O-b.length),te=M>100?1:M,F=[];for(let e=0;e<te;e+=1){let t=Se(j(b.length+e));if(t===Pe){F.length=0;break}F.push(t)}let I=F.length===te?[...b,...F]:void 0,L=I!==void 0&&!A&&(k===void 0||I.length<=k)&&(I.length<O||P(r,I))?I:void 0,ne=P(r,b),R=Te(r).find(e=>P(r,e)&&(i===void 0||!ne||e.length>b.length&&b.every((t,n)=>N(t,e[n]))))??(i===void 0&&e.isRequired&&k===0&&P(r,[])?[]:void 0),z=R&&structuredClone(R),B=k===void 0||b.length<k,ie=z===void 0&&L===void 0,ae=j(b.length),V=J(a,`array-draft`),oe={schema:ae,label:f,disabled:s||!B,identity:JSON.stringify(a.filter(e=>typeof e==`string`)),sourceIdentity:S,existingValues:A?b:void 0,validateValue:e=>{let t=[...b,e];return(k===void 0||t.length<=k)&&(t.length<O||P(r,t))}},se=(e,t)=>{if(e.length<=a.length||!a.every((t,n)=>t===e[n]))return!1;let n=e.slice(a.length),i=n[0];if(typeof i!=`number`||i<0||i>=b.length)return!1;let o=[...b],s=n.slice(1);if(s.length===0){if(t===void 0)return!1;o[i]=t}else{let e=ot(b[i],s,t);if(!e.ok)return!1;o[i]=e.value}return je(r,b,o,A,!0)?D(o,E):!1};return w`
    <div class="cfg-block cfg-array">
      <div class="settings-row">
        <div class="settings-row__text">
          ${u?w`<span class="settings-row__title">${f}</span>`:C}
          ${d&&p?w`<span class="settings-row__desc">${p}</span>`:C}
          ${d&&T!==C?w`<span class="settings-row__desc">${T}</span>`:C}
        </div>
        <div class="settings-row__control">
          ${e.compact?C:w`
                  <span class="settings-row__value"
                    >${h(b.length===1?`configForm.itemCountOne`:`configForm.itemCount`,{count:String(b.length)})}</span
                  >
                `}
          <button
            type="button"
            class=${e.compact?`btn btn--sm btn--icon`:`btn btn--sm`}
            aria-label=${h(`configForm.add`)}
            aria-controls=${V}
            ?disabled=${s||!B&&z===void 0}
            @click=${e=>{if(z)c(a,z)===!1&&ft(e,V);else if(ie)ft(e,V);else if(L){let t=Array.from({length:L.length-b.length},()=>Symbol(`array-row`));D(L,[...E,...t])||ft(e,V)}}}
          >
            ${e.compact?x.plus:h(`configForm.add`)}
          </button>
        </div>
      </div>
      <zero-config-form-collection-draft
        id=${V}
        .props=${oe}
        @config-collection-draft-commit=${e=>{let t=[...b,e.detail.value],n=!(A&&b.some(t=>N(t,e.detail.value)))&&(k===void 0||b.length<k)&&P(ae,e.detail.value)&&(t.length<O||P(r,t)),i=!1;n&&(i=D(t,[...E,Symbol(`array-row`)])),i||e.preventDefault()}}
      ></zero-config-form-collection-draft>
      ${b.length===0?e.compact?C:re(h(`configForm.noItems`)):w`
              <div class="settings-subrows">
                ${ee(b,(e,t)=>E[t],(n,i)=>{let o=j(i),c=b.toSpliced(i,1),l=je(r,b,c,A,!1),u=We(h(`configForm.removeItem`),s||b.length<=O||!l,()=>l&&D(c,E.toSpliced(i,1))),d=t({...Xe(e),schema:v?{...o,default:n}:o,value:v?void 0:n,path:[...a,i],isRequired:!0,sourceIdentity:v?void 0:n,controlIdentity:b,searchCriteria:m,showLabel:!1,onPatch:se});return e.compact?w`<div class="cfg-array__item">
                        <div class="cfg-array__value">${d}</div>
                        ${u}
                      </div>`:w`
                      <div class="settings-row">
                        <div class="settings-row__text">
                          <span class="settings-row__title">#${i+1}</span>
                        </div>
                        <div class="settings-row__control">${u}</div>
                      </div>
                      ${d}
                    `})}
              </div>
            `}
    </div>
  `}var bt,xt,St,Ct;function wt(){return(wt=e((()=>{O(),D(),te(),y(),r(),s(),dt(),pt(),pe(),G(),ht(),Ie(),ge(),H(),B(),bt=Symbol(`unset-array-source`),xt=Symbol(`unset-map-source`),St=class extends E{constructor(...e){super(...e),this.rows=new ut,this.field=``}render(e,t){let n=JSON.stringify(e.path.filter(e=>typeof e==`string`));return n!==this.field&&(this.rows=new ut,this.field=n),yt(e,t,this.rows)}},Ct=T(St)})))()}function Tt(e){let{schema:t,value:n,path:r,disabled:i,onPatch:a}=e,o=Ve(e),s=Re(n===void 0?t.default:n),c=He(e),l=ze({schema:t,path:r,ariaLabel:o.label,descriptionId:o.helpId,sourceValue:e.sourceIdentity??n,fallback:s,rows:3,sensitiveState:c,disabled:i,isRequired:e.isRequired,onToggleSensitivePath:e.onToggleSensitivePath,onPatch:a});return q({...o,defaultDescription:c.isRedacted?C:W(t,n),stacked:!0,control:l})}function Et(){return(Et=e((()=>{O(),Ie()})))()}function Dt(e,t){let n=e.trim();if(n.startsWith(`+`))try{let e=nt(n,{extract:!1});if(!e?.isPossible())return;let r=e.formatInternational();return!e.country||Ot.has(e.countryCallingCode)?r:`${new Intl.DisplayNames(t?[t]:void 0,{type:`region`}).of(e.country)||e.country} · ${r}`}catch{return}}var Ot;function kt(){return(kt=e((()=>{it(),rt(),Ot=new Set(Object.entries(tt.country_calling_codes).filter(([,e])=>e.length>1).map(([e])=>e))})))()}function At(e,t,n,r){let i=e.trim(),o=t.anyOf??t.oneOf??[],s=P(t,e),c=r?r.branch:$e(n),l=i===`true`||i!==`false`&&void 0;if(l!==void 0&&P(t,l)){let e=!1,t=!1;for(let n of o)(a(n)===`boolean`||typeof n.const==`boolean`||n.enum?.some(e=>typeof e==`boolean`))&&P(n,l)&&(e=!0,t||=Object.is(n.const,l)||!!n.enum?.some(e=>Object.is(e,l)));if(e&&(c!==`string`||t||!s))return l}let u;for(let n of o){let r=a(n);if(r!==`number`&&r!==`integer`)continue;let i=b(e,r===`integer`);if(typeof i==`number`&&P(t,i)){u=i;break}}if(c===`number`){if(u!==void 0)return u;if(v(e))return s&&g(i)?e:void 0}return c===`string`&&s?e:u??e}function jt(e,t){return P(t,e)?``:h(`configForm.invalidNumber`)}function X(e,{schema:t,isRequired:n}){let r=e.value;if(r.trim()===``)return{message:e.validity.badInput||n===!0?h(`configForm.invalidNumber`):``};let i=b(r,a(t)===`integer`);return typeof i==`number`?{parsed:i,message:jt(i,t)}:{message:h(`configForm.invalidNumber`)}}function Mt(e,t,n){U(e,t.message)&&n(t.parsed)}function Nt({value:e,path:t,onPatch:n},r,i){let a=e;return(e,o,s=!1)=>s&&N(a,o)?!0:n(t,o)===!1?(e.value=r,i(e),!1):(a=o,!0)}function Pt(e){let{schema:n,value:r,path:i,hints:a,disabled:o,inputType:s}=e,c=u(i,a),l=Ve(e),{label:d,helpId:f}=l,p=J(i,`scalar-error`),m=He(e),g=Ye(r),_=e.rawAvailable??!0,v=m.isMasked,y=m.isRedacted&&!v||m.sentinelRedacted||g,b=y?g?h(_?`configForm.structuredSecretRaw`:`configForm.structuredSecretFile`):v?`••••••••`:h(`configForm.redactedPlaceholder`):c?.placeholder??(!v&&n.default!==void 0?h(`configForm.defaultValue`,{value:K(n.default)}):``),x=y?``:L(r)?Re(r):r??(e.compact?n.default:void 0)??``,S=r===void 0?n.default:r,T=$e(S),E=v?`password`:m.isSensitive&&!y?`text`:s,D=c?.presentation===`phone-number`,O=D&&!y&&!v&&typeof r==`string`?Dt(r,t.getLocale()):void 0,k=e.controlIdentity??e.sourceIdentity??r,A=e.sourceIdentity??r,ee=J(i.filter(e=>typeof e==`string`),`scalar-identity`),M=K(x),te=[y?`redacted`:`visible`,E,D?`phone`:`plain`,g?_?`secret-raw`:`secret-file`:`scalar`].join(`:`),N=(t,r)=>{let i=At(t,n,S,r),a=P(n,i),o=t===``&&!e.isRequired&&!a;return{candidate:o?void 0:i,message:a||o?``:h(`configForm.invalidString`)}},F=t=>{U(t,y?``:s===`number`?X(t,e).message:N(t.value,Le(t,T)).message)},I=Nt(e,M,F),ne=t=>{if(y)return;let n=e=>I(t,e,!0);if(s===`number`){Mt(t,X(t,e),n);return}let r=Fe(t,T),i=t.value,a=N(i,r),o=a;if(a.message||D){let e=i.trim();o=N(e,r),o.message||(t.value=e)}U(t,o.message?a.message:``),o.message||n(o.candidate),Ze(t)},re=w`
    <input
      ${j(e=>{Ce(e,ee,te),Qe(e,k,A,ee,te,M,F)})}
      type=${E}
      class="settings-input${y?` cfg-redacted`:``}"
      aria-label=${d}
      aria-describedby=${[f,p].filter(Boolean).join(` `)}
      aria-invalid="false"
      placeholder=${b}
      .value=${M}
      ?disabled=${o}
      ?readonly=${y}
      @click=${()=>{!v&&m.isRedacted&&!g&&e.onToggleSensitivePath&&e.onToggleSensitivePath(i)}}
      @input=${t=>{if(y)return;let n=t.target;if(e.commitOnBlur){Fe(n,T),F(n);return}if(s===`number`){Mt(n,X(n,e),e=>I(n,e));return}let r=N(n.value,Fe(n,T));U(n,r.message)&&I(n,r.candidate)}}
      @change=${t=>{!e.commitOnBlur&&s!==`number`&&ne(t.target)}}
      @blur=${t=>{let n=t.target;e.commitOnBlur&&n.value!==M&&ne(n),Ze(n)}}
    />
  `,R=g?C:Ge({path:i,state:m,disabled:o,onToggleSensitivePath:e.onToggleSensitivePath}),z=Be(re,R,m.isSensitiveField&&e.onToggleSensitivePath!==void 0),B=D?w`
        <span class="settings-phone-presentation">
          ${z}
          ${O?w`<span class="settings-phone-presentation__value">${O}</span>`:C}
        </span>
      `:z;return q({...l,defaultDescription:y||v?C:W(n,r),control:B,errorId:p})}function Ft(e){let{schema:t,value:n,path:r,hints:i,disabled:a,onPatch:o}=e,s=Ve(e),{label:c,helpId:l}=s,d=J(r,`scalar-error`),f=n??(e.compact?t.default:void 0)??``,p=n===void 0?t.default:n,m=Me(t),g=typeof m.step==`number`?m.step:1,_=e.controlIdentity??e.sourceIdentity??n,v=e.sourceIdentity??n,y=J(r.filter(e=>typeof e==`string`),`scalar-identity`),b=K(f),x=t=>{U(t,X(t,e).message)},S=Nt(e,b,x),T=(n,r)=>{let i=X(n,e);i.parsed!==void 0&&(i.parsed=Ae(i.parsed,t),i.message=jt(i.parsed,t),n.value=K(i.parsed)),U(n,i.message)&&(r||i.parsed!==void 0)&&S(n,i.parsed,!0)},E=e=>{if(a)return;let n=Number(p),i=Ae((Number.isFinite(n)?n:0)+e*g,t);P(t,i)&&o(r,i)},D=t=>e.compact?C:w` <button
          type="button"
          class="btn btn--sm btn--icon"
          aria-label=${`${c}: ${t<0?`-`:`+`}${g}`}
          ?disabled=${a}
          @click=${()=>E(t)}
        >
          ${t<0?`−`:`+`}
        </button>`,O=w`
    ${D(-1)}
    <input
      ${j(e=>Qe(e,_,v,y,`number`,b,x))}
      type="number"
      class="settings-input"
      aria-label=${c}
      aria-describedby=${[l,d].filter(Boolean).join(` `)}
      aria-invalid="false"
      placeholder=${u(r,i)?.placeholder??(t.default===void 0?C:h(`configForm.defaultValue`,{value:K(t.default)}))}
      min=${m.min??C}
      max=${m.max??C}
      step=${m.step}
      .value=${b}
      ?disabled=${a}
      @keydown=${t=>{!e.compact&&n===void 0&&p!==void 0&&(t.key===`ArrowUp`||t.key===`ArrowDown`)&&(t.preventDefault(),E(t.key===`ArrowUp`?1:-1))}}
      @input=${t=>{let n=t.target;if(e.commitOnBlur){x(n);return}Mt(n,X(n,e),e=>S(n,e))}}
      @change=${t=>{e.commitOnBlur||T(t.target,!1)}}
      @blur=${t=>{let n=t.target;e.commitOnBlur&&n.value!==b&&T(n,!0)}}
    />
    ${D(1)}
  `;return q({...s,defaultDescription:W(t,n),control:O,errorId:d})}function It(e){let{schema:t,value:n,path:r,hints:i,disabled:a,options:o,onPatch:s}=e,c=Ve(e),{label:l,helpId:d}=c,f=n===void 0&&t.default!==void 0,p=f?t.default:n,m=o.findIndex(e=>N(e,p)),g=`__unset__`,_=`__null__`,v=t.nullable&&t.enumIncludesNull,y=f?g:p===null&&v?_:m>=0?String(m):g,b=w`
    <select
      class="settings-select"
      aria-label=${l}
      aria-describedby=${d??C}
      ?disabled=${a}
      .value=${y}
      @change=${n=>{let i=n.target,a=i.value;if(a===g&&e.isRequired&&t.default===void 0){i.value=y;return}(a===g?e.isRequired&&t.default!==void 0?s(r,structuredClone(t.default)):e.onRemove?e.onRemove(r):s(r,void 0):s(r,a===_?null:o[Number(a)]))===!1&&(i.value=y)}}
    >
      <option
        value=${g}
        ?selected=${y===g}
        ?disabled=${e.isRequired&&t.default===void 0}
      >
        ${t.default===void 0?u(r,i)?.placeholder??h(`configForm.select`):h(`configForm.defaultValue`,{value:K(t.default)})}
      </option>
      ${v?w`
              <option value=${_} ?selected=${y===_}>
                ${h(`configForm.nullValue`)}
              </option>
            `:C}
      ${o.map((e,t)=>w`
          <option value=${String(t)} ?selected=${y===String(t)}>
            ${Ke(e,o)}
          </option>
        `)}
    </select>
  `;return q({...c,defaultDescription:W(t,n),control:b})}function Lt(){return(Lt=e((()=>{kt(),O(),S(),r(),G(),Ie(),_(),et(),H()})))()}function Z(e){let{schema:t,value:n,path:r,hints:o,unsupported:s,disabled:c,onPatch:l}=e,d=e.showLabel??!0,f=a(t),{label:p,help:m}=ye(r,t,o),g=i(r),_=e.searchCriteria;if(s.has(g)||[...s].some(e=>{if(!e.includes(`*`))return!1;let t=e.split(`.`);return t.length===r.length&&t.every((e,t)=>e===`*`||e===String(r[t]))}))return q({label:p,showLabel:!0,control:C,error:h(`configForm.unsupportedNode`)});if(_&&be(_)&&!me({schema:t,value:n,path:r,hints:o,criteria:_}))return C;let v=st(e);if(v!==void 0){let t={identity:JSON.stringify(r.filter(e=>typeof e==`string`)),sourceIdentity:e.sourceIdentity??n,initialValue:v,params:e,renderNode:Z};return w`
      <zero-config-form-structured-draft
        class="cfg-structured-draft"
        .props=${t}
      ></zero-config-form-structured-draft>
    `}let y=(i,a=!1)=>i.length>5||a?It({...e,options:i}):q({label:p,help:m,defaultDescription:W(t,n),showLabel:d,control:Je({options:i,resolvedValue:n===void 0?t.default:n,disabled:c,ariaLabel:p,descriptionId:e.descriptionId,onSelect:e=>l(r,e)})});if(t.anyOf||t.oneOf){let r=(t.anyOf??t.oneOf??[]).filter(e=>!(e.type===`null`||Array.isArray(e.type)&&e.type.includes(`null`)));if(r.length===1){let t=r[0];return t?Z({...e,schema:t}):C}let i=r.map(e=>e.const===void 0?e.enum?.length===1?e.enum[0]:void 0:e.const);if(i.every(e=>e!==void 0)&&i.length>0)return y(i);let o=new Set(r.flatMap(e=>{let t=a(e);return t?[t===`integer`?`number`:t]:[]}));if(e.maskSensitive===!0&&Array.isArray(t.type)&&o.size===2&&o.has(`string`)&&o.has(`object`)&&(n===void 0||typeof n==`string`||Ye(n)))return Pt({...e,inputType:`text`});if([...o].every(e=>[`string`,`number`,`boolean`].includes(e))){let n=o.has(`string`),r=o.has(`number`);if(o.has(`boolean`)&&o.size===1)return Z({...e,schema:{...t,type:`boolean`,anyOf:void 0,oneOf:void 0}});if(n||r)return Pt({...e,inputType:r&&!n?`number`:`text`})}return Tt(e)}if(t.enum)return y(t.enum,t.nullable&&t.enumIncludesNull);if(f===`object`)return _t(e,Z);if(f===`array`)return vt(e,Z);if(f===`boolean`){if(!e.isRequired&&u(r,o)?.placeholder)return It({...e,options:[!0,!1]});let i=typeof n==`boolean`?n:typeof t.default==`boolean`&&t.default,a=e=>l(r,e);if(e.compact)return q({label:p,help:m,showLabel:d,control:w`<input
          type="checkbox"
          aria-label=${p}
          aria-describedby=${e.descriptionId??C}
          .checked=${i}
          ?disabled=${c}
          @change=${e=>{let t=e.currentTarget;a(t.checked)===!1&&(t.checked=i)}}
        />`});if(!d)return q({label:p,help:m,showLabel:d,control:ne({checked:i,disabled:c,ariaLabel:p,onChange:a})});let s=m||t.default!==void 0?w`
            ${m??C} ${m&&t.default!==void 0?w`<br />`:C}
            ${W(t,n)}
          `:void 0;return V({title:p,description:s,checked:i,disabled:c,onChange:a})}return f===`number`||f===`integer`?Ft(e):f===`string`?Pt({...e,inputType:`text`}):qe(t)?Tt(e):q({label:p,showLabel:!0,control:C,error:h(`configForm.unsupportedType`,{type:String(f)})})}function Rt(){return(Rt=e((()=>{O(),r(),lt(),wt(),Et(),Lt(),Ie(),ge(),H(),B()})))()}function zt(e){let t=ce({schema:e.schema,path:e.path.map(String),hints:e.hints});return w`
    <div class="config-tier-groups">
      ${t.common||e.commonPrelude?w`<div class="settings-group">
              ${e.commonPrelude??C}${t.common?e.renderTier(t.common):C}
            </div>`:C}
      ${t.advanced?w`<details
              class="config-advanced-disclosure"
              ?open=${e.revealAdvanced}
              @toggle=${t=>{let n=t.currentTarget;n instanceof HTMLDetailsElement&&n.open!==e.revealAdvanced&&(n.open?e.onShowAdvanced():e.onHideAdvanced?e.onHideAdvanced():n.open=!0)}}
            >
              <summary class="settings-section__heading config-advanced-disclosure__summary">
                ${h(`configForm.advancedSettings`)}
              </summary>
              ${e.revealAdvanced?w`<div class="settings-group">${e.renderTier(t.advanced)}</div>`:C}
            </details>`:C}
    </div>
  `}function Bt(e){if(!e.schema)return w` <div class="muted">${h(`configForm.schemaUnavailable`)}</div> `;let t=e.schema,n=e.value??{};if(a(t)!==`object`||!t.properties)return w` <div class="callout danger">${h(`configForm.unsupportedSchema`)}</div> `;let r=new Set(e.unsupportedPaths??[]),i=t.properties,o=e.searchQuery??``,s=_e(o),c=e.activeSection,l=e.activeSubsection??null,p=Object.entries(i).toSorted((t,n)=>{let r=u([t[0]],e.uiHints)?.order??50,i=u([n[0]],e.uiHints)?.order??50;return r===i?t[0].localeCompare(n[0]):r-i}).filter(([t,r])=>!(c&&t!==c||o&&!ve({key:t,schema:r,value:n[t],hints:e.uiHints,query:o,label:le[t]?.label,description:le[t]?.description}))),m=null;if(c&&l&&p.length===1){let e=p[0]?.[1];e&&a(e)===`object`&&e.properties&&e.properties[l]&&(m={sectionKey:c,subsectionKey:l,schema:e.properties[l]})}if(p.length===0)return e.embedded&&!o?C:R(re(o?h(`configForm.noSettingsMatch`,{query:o}):h(`configForm.noSettingsInSection`)));let g=t=>{let n=u(t.path.slice(0,1),e.uiHints),i=e.showSectionDocs===!1?void 0:n?.docsUrl,a=`settings-section-help-${t.id}`,c=e.showAdvanced===!0||e.forceAdvancedSection===t.path[0]||!!o;return w`
      <section class="settings-section" id=${t.id}>
        <div class="settings-section__header">
          <h2 class="settings-section__heading">${t.label}</h2>
          ${e.sectionActions||i?w`<div class="settings-section__actions">
                  ${e.sectionActions??C}
                  ${i?w`
                          <span class="settings-section__docs">
                            ${z({id:a,label:h(`configForm.sectionHelp`,{section:t.label}),tooltip:h(`configForm.sectionHelp`,{section:t.label}),icon:`question`,popoverId:`settings-section-help-popover-${t.id}`})}
                            <wa-popover
                              ${j(oe)}
                              id=${`settings-section-help-popover-${t.id}`}
                              class="settings-section__help-popover"
                              for=${a}
                              placement="bottom-end"
                            >
                              <div class="settings-section__help-panel">
                                ${t.description?w`<p>${t.description}</p>`:C}
                                ${ie(i)}
                              </div>
                            </wa-popover>
                          </span>
                        `:C}
                </div>`:C}
        </div>
        ${t.description?w`<p class="settings-section__desc">${t.description}</p>`:C}
        ${zt({schema:t.node,path:t.path,hints:e.uiHints,revealAdvanced:c,onShowAdvanced:e.onShowAdvanced,onHideAdvanced:e.showAdvanced===!0&&e.forceAdvancedSection!==t.path[0]&&!o?e.onHideAdvanced:void 0,renderTier:n=>Z({schema:n,value:t.nodeValue,path:t.path,hints:e.uiHints,rawAvailable:e.rawAvailable??!0,unsupported:r,disabled:e.disabled??!1,showLabel:!1,showHeaderMeta:!0,searchCriteria:s,revealSensitive:e.revealSensitive??!1,maskSensitive:e.maskSensitive,isSensitivePathRevealed:e.isSensitivePathRevealed,onToggleSensitivePath:e.onToggleSensitivePath,onPatch:e.onPatch,onRemove:e.onRemove}),commonPrelude:e.sectionPrelude})}
      </section>
    `};return R(m?(()=>{let{sectionKey:t,subsectionKey:r,schema:i}=m,a=f([t,r],e.uiHints),o=a?.label??i.title??d(r),s=a?.help??i.description??``,c=n[t],l=c&&typeof c==`object`?c[r]:void 0;return g({id:`config-section-${t}-${r}`,label:o,description:s,node:i,nodeValue:l,path:[t,r]})})():p.map(([t,r])=>{let i=f([t],e.uiHints),a=le[t]??{label:i?.label??t.charAt(0).toUpperCase()+t.slice(1),description:i?.help??r.description??``};return g({id:`config-section-${t}`,label:a.label,description:a.description,node:r,nodeValue:n[t],path:[t]})}))}function Vt(){return(Vt=e((()=>{O(),S(),r(),se(),Rt(),ge(),H(),ue(),B(),ae()})))()}function Ht(e){return Object.keys(e??{}).every(e=>an.has(e))}function Ut(e){let t=e.filter(e=>e!=null),n=t.length!==e.length;return{enumValues:Wt(t),nullable:n}}function Wt(e){let t=[];for(let n of e)t.some(e=>Object.is(e,n))||t.push(n);return t}function Gt(e,t=new Set){if(t.has(e))return new Set;t.add(e);let n=new Set,r=Array.isArray(e.type)?e.type:e.type?[e.type]:[];for(let e of r)e!==`null`&&n.add(e);n.size===0&&(e.properties||e.additionalProperties)&&n.add(`object`);for(let r of e.allOf??[])for(let e of Gt(r,t))n.add(e);return t.delete(e),n}function Kt(e){if(e.size===1)return e.values().next().value;if(e.size>1&&[...e].every(e=>e===`number`||e===`integer`))return e.has(`integer`)?`integer`:`number`}function qt(e){return e.size>1&&Kt(e)===void 0}function Jt(e){return Kt(Gt(e))}function Yt(e){return!!(Jt(e)||e.items||e.enum||e.anyOf||e.oneOf||e.allOf)}function Xt(e){if(!Zt(e,sn))return!1;if(e.not===void 0)return!0;if(Jt(e)!==`object`||!L(e.not))return!1;let t=e.not.required;return Array.isArray(t)&&t.length>0&&t.every(e=>typeof e==`string`)&&Object.keys(e.not).every(e=>e===`required`||an.has(e))}function Zt(e,t){return Object.keys(e).every(n=>t.has(n)||n===`propertyNames`&&L(e.propertyNames)&&m(e.propertyNames)&&$({type:`string`,...e.propertyNames},[]).unsupportedPaths.length===0)}function Q(e,t=new Set){if(t.has(e))return!1;t.add(e);let n=Array.isArray(e.type)?e.type:e.type?[e.type]:[],r=e.nullable===!0||n.length===0||n.includes(`null`);return e.const!==void 0&&(r&&=e.const===null),e.enum&&(r&&=e.enum.some(e=>e===null)),e.allOf&&(r&&=e.allOf.every(e=>Q(e,t))),e.anyOf&&(r&&=e.anyOf.some(e=>Q(e,t))),e.oneOf&&(r&&=e.oneOf.filter(e=>Q(e,t)).length===1),t.delete(e),r}function Qt(e){let t=xe(e);if(t.length<=1)return!1;let n=new Set(t.flatMap(e=>Object.keys(e.properties??{})));return t.some(e=>{let t=e.additionalProperties;return!!t&&typeof t==`object`&&Object.keys(t).length>0&&[...n].some(t=>!Object.hasOwn(e.properties??{},t))})}function $t(e){return!e||typeof e!=`object`?{schema:null,unsupportedPaths:[`<root>`]}:$(e,[])}function $(e,t,n=!1,r,a){let o=e;if(!n&&!e.anyOf&&!e.oneOf&&!e.allOf&&Array.isArray(e.type)&&new Set(e.type.filter(e=>e!==`null`)).size>1&&(e.type.every(e=>e===`null`||cn.has(e))||e.type.every(e=>[`string`,`object`,`null`].includes(e)))){let t=e.type.includes(`object`)?[`string`,...e.type.filter(e=>e!==`string`)]:e.type;o={...e,type:t.includes(`object`)?t:void 0,anyOf:t.map(e=>({type:e}))}}let s=new Set,c=e=>{for(let t of e.unsupportedPaths)s.add(t);return e.schema},l={...o},u=i(t)||`<root>`;if(Xt(o)||s.add(u),o.anyOf||o.oneOf){let e=rn(o,t);return e?{schema:c(e),unsupportedPaths:Array.from(s)}:{schema:o,unsupportedPaths:[u]}}let d=Array.isArray(o.type)?o.type.filter(e=>e!==`null`):[],f=Gt(o),p=n&&!!r&&o.type===void 0&&f.size===0;p&&r&&f.add(r),n&&r&&f.size>0&&qt(new Set([...f,r]))&&s.add(u),(new Set(d).size>1||qt(f))&&s.add(u);let m=Kt(f),h=Q(o)&&(a===void 0||a);if(o.allOf){let e=[];for(let n of o.allOf){if(!n||typeof n!=`object`){s.add(u);continue}if(!Yt(n)){e.push(n),Zt(n,on)||s.add(u);continue}e.push(c($(n,t,!0,m,h)))}l.allOf=e}l.type=m??o.type,l.nullable=h;let g=o.properties!==void 0||o.additionalProperties!==void 0,_=o.items!==void 0||o.additionalItems!==void 0;if(l.enum){let{enumValues:e,nullable:t}=Ut(l.enum);l.enum=e,l.enumIncludesNull=t&&h,e.length===0&&s.add(u)}o.allOf&&h&&!l.enumIncludesNull&&s.add(u);let v=(e,t,r)=>n&&r!==void 0&&!Yt(e)?(Zt(e,on)||s.add(r),e):c($(e,t,n));if(m===`object`&&(!p||g)){let e=o.properties??{},n=new Set(De(o)),r=Ee(o);[...Ne(o)].some(e=>!n.has(e))&&!r&&s.add(u),Qt(o)&&s.add(u);let a={};for(let[n,r]of Object.entries(e)){let e=[...t,n];a[n]=v(r,e,i(e)||`<root>`)}if(l.properties=a,o.allOf)for(let e of De(o)){let n=Oe(o,e);n&&c($(n,[...t,e]))}o.additionalProperties===!0?l.additionalProperties={}:o.additionalProperties===!1?l.additionalProperties=!1:o.additionalProperties&&typeof o.additionalProperties==`object`&&(Ht(o.additionalProperties)||(l.additionalProperties=v(o.additionalProperties,[...t,`*`])))}else if(m===`array`&&(!p||_)){if(Array.isArray(o.items)){let e=[];for(let n=0;n<o.items.length;n+=1){let r=o.items[n];if(!r){s.add(u);continue}e.push(v(r,[...t,n],u))}l.items=e,l.additionalItems=o.additionalItems&&typeof o.additionalItems==`object`?v(o.additionalItems,[...t,`*`],u):o.additionalItems}else o.items?l.items=v(o.items,[...t,`*`],u):s.add(u);if(o.allOf)for(let e of he(o)){let n=fe(o,e);n&&c($(n,[...t,e]))}}else(!p||m!==`object`&&m!==`array`)&&m!==`string`&&m!==`number`&&m!==`integer`&&m!==`boolean`&&!l.enum&&!(n&&o.allOf)&&s.add(u);return{schema:l,unsupportedPaths:Array.from(s)}}function en(e){if(a(e)!==`object`)return!1;let t=e.properties?.source,n=e.properties?.provider,r=e.properties?.id;return!t||!n||!r?!1:typeof t.const==`string`&&a(n)===`string`&&a(r)===`string`}function tn(e){let t=e.oneOf??e.anyOf;return!!(t?.length&&t.every(en))}function nn(e){if(e.length!==2)return;let t=e.findIndex(e=>a(e)===`string`);if(!(t<0))return tn(e[1-t])?e[t]:void 0}function rn(e,t){if(e.allOf)return null;let n=e.anyOf??e.oneOf;if(!n)return null;let r=[],i=[],o=!1;for(let e of n){if(!e||typeof e!=`object`)return null;if(Array.isArray(e.enum)){let{enumValues:t,nullable:n}=Ut(e.enum);r.push(...t),o||=n;continue}if(`const`in e){if(e.const==null){o=!0;continue}r.push(e.const);continue}if(a(e)===`null`){o=!0;continue}i.push(e)}o&&=Q(e);let s=nn(i)??(r.length===0&&i.length===1?i[0]:void 0);if(s)return $({...e,...s,nullable:o||s.nullable,anyOf:void 0,oneOf:void 0,allOf:void 0},t);if(r.length>0&&i.length>0){let t=i.length===1?i[0]:void 0;if(t?.type!==`boolean`||Object.keys(t).length!==1||r.includes(`true`)||r.includes(`false`)||e.anyOf===void 0&&r.some(e=>typeof e==`boolean`))return i.every(e=>e.type===`string`)&&r.every(e=>typeof e==`string`||typeof e==`boolean`)&&!Q(e)?{schema:{...e,nullable:o},unsupportedPaths:[]}:null;i.pop(),r.unshift(!0,!1)}return r.length>0&&i.length===0?{schema:{...e,enum:Wt(r),nullable:o,enumIncludesNull:o,anyOf:void 0,oneOf:void 0,allOf:void 0},unsupportedPaths:[]}:i.length>0&&r.length===0&&i.every(e=>{let t=a(e);return!!t&&ln.has(String(t))})?{schema:{...e,nullable:o},unsupportedPaths:[]}:null}var an,on,sn,cn,ln;function un(){return(un=e((()=>{pe(),G(),H(),an=new Set([`$id`,`$schema`,`title`,`description`,`default`,`deprecated`,`nullable`,`enumIncludesNull`,`examples`,`readOnly`,`tags`,`writeOnly`,`x-tags`]),on=new Set([...an,`const`,`required`,`additionalProperties`,`minimum`,`maximum`,`exclusiveMinimum`,`exclusiveMaximum`,`multipleOf`,`minLength`,`maxLength`,`pattern`,`format`,`minItems`,`maxItems`,`uniqueItems`]),sn=new Set([...on,`type`,`properties`,`items`,`additionalItems`,`enum`,`anyOf`,`oneOf`,`allOf`,`not`]),cn=new Set([`string`,`number`,`integer`,`boolean`]),ln=new Set([...cn,`object`,`array`])})))()}function dn(){return(dn=e((()=>{Vt(),un(),Rt(),H()})))()}export{Bt as a,Z as c,wt as d,gt as f,st as g,lt as h,Vt as i,Dt as l,mt as m,$t as n,zt as o,ht as p,un as r,Rt as s,dn as t,kt as u};
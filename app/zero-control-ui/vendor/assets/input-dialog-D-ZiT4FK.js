import{n as e,r as t}from"./rolldown-runtime-8BhlS34s.js";import{Pu as n,xu as r,yu as i,zu as a}from"./control-ui-core-DCNBgr3X.js";import{an as o,on as s}from"./control-ui-core-DwX5Mpz4.js";import{G as c,J as l,W as u}from"./lit-runtime-B40xFCK_.js";var d=t({showInputDialog:()=>p});function f(e){return s({signal:e.signal,value:null},t=>{let{host:n,finish:r,render:o}=t,s=!1,u=null,d=t=>e.requireValue===!0?t.trim():t,f=t=>{let n=d(t);return e.requireValue===!0&&n.length===0||e.requireChange===!0&&n===(e.defaultValue??``)},p=f(e.defaultValue??``),m=()=>n.querySelector(`input[name="value"]`),h=e=>{let t=f(e.target.value);t!==p&&(p=t,y())};async function g(n){if(n.preventDefault(),s)return;let a=m()?.value;if(a===void 0||f(a))return;let o=d(a);if(!e.submit){r(o);return}s=!0,u=null,y();let c;try{c=await e.submit(o)}catch(e){c=i(e)}if(!t.settled){if(s=!1,c===null){r(o);return}u=c,y(),m()?.focus()}}function _(e){if(s){e.preventDefault();return}r(null)}let v=e.label??e.title;function y(){o(()=>l`
          <zero-modal-dialog
            label=${e.title}
            description=${v}
            @modal-cancel=${_}
          >
            <form class="exec-approval-card" @submit=${g}>
              <div class="exec-approval-header">
                <div class="exec-approval-title">${e.title}</div>
              </div>
              <label class="field input-dialog__field">
                <span>${v}</span>
                <input
                  name="value"
                  type="text"
                  autocomplete="off"
                  spellcheck="false"
                  .value=${e.defaultValue??``}
                  ?disabled=${s}
                  aria-invalid=${u?`true`:c}
                  @input=${h}
                  autofocus
                />
              </label>
              ${u?l`<div class="exec-approval-error" role="alert">${u}</div>`:c}
              <div class="exec-approval-actions">
                <button type="submit" class="btn primary" ?disabled=${s||p}>
                  ${e.submitLabel??a(`common.save`)}
                </button>
                <button
                  type="button"
                  class="btn"
                  ?disabled=${s}
                  @click=${()=>r(null)}
                >
                  ${e.cancelLabel??a(`common.cancel`)}
                </button>
              </div>
            </form>
          </zero-modal-dialog>
        `)}y()})}function p(e){return m?Promise.resolve(null):(m=!0,f(e).finally(()=>{m=!1}))}var m;function h(){return(h=e((()=>{u(),n(),r(),o(),m=!1})))()}export{d as n,p as r,h as t};
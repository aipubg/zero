import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Nu as t,Pu as n,ju as r,zu as i}from"./control-ui-core-DCNBgr3X.js";import{G as a,J as o,W as s,X as c,Z as l,at as u}from"./lit-runtime-B40xFCK_.js";import{Zr as d}from"./ui-AaV6iNVa.js";import{C as f,N as p,O as m,_ as h,b as g,c as _,f as v,h as y,k as b}from"./config-runtime-BecGLziM.js";import{a as x,c as S}from"./control-ui-boot-chat-zkzP5WWm.js";import{n as C,r as w}from"./board-layout-BmeSfx17.js";function T(e){if(new TextEncoder().encode(JSON.stringify(e)).byteLength>8192)throw new C(`invalid_operation`,`Report exceeds 8KB JSON budget`);let t=j.safeParse(e);if(!t.success){let e=t.error.issues[0];throw new C(`invalid_operation`,`Invalid report at ${e?.path.join(`.`)||`root`}: ${e?.message}`)}return t.data}var E,D,O,k,A,j;function M(){return(M=e((()=>{h(),w(),E=b().min(1).max(120).optional(),D=b().min(1).max(160),O=b().max(240).optional(),k=b().max(500),A=m({type:g(`table`),title:E,columns:v(D).min(1).max(8),rows:v(v(k).max(8)).max(40)}).refine(e=>e.rows.every(t=>t.length===e.columns.length),{message:`Every table row must match the columns`}),j=m({blocks:v(y(`type`,[m({type:g(`text`),title:E,text:b().min(1).max(4e3)}),m({type:g(`metrics`),items:v(m({label:D,value:b().min(1).max(80),detail:O})).min(1).max(8)}),A,m({type:g(`chart`),title:E,style:_([`bar`,`line`]).optional(),points:v(m({label:D,value:f().min(-(2**53-1)).max(2**53-1)})).min(1).max(40)}),m({type:g(`links`),title:E,items:v(m({label:D,url:p({protocol:/^https?$/,normalize:!0}).max(2048),detail:O})).min(1).max(20)})])).min(1).max(24)})})))()}function N(e){let t=e.points.map(e=>e.value),n=Math.min(0,...t),r=Math.max(0,...t)-n||1,i=e=>164-(e-n)/r*148,s=i(0),l=e.style===`line`,u=608/e.points.length,d=t.map((e,n)=>({x:l?t.length===1?320:16+n/(t.length-1)*608:16+(n+.5)*u,y:i(e)}));return o`<figure class="board-report__chart">
    ${e.title?o`<figcaption>${e.title}</figcaption>`:a}
    ${c`<svg viewBox="0 0 640 180" aria-hidden="true" focusable="false">
      <line class="board-report__axis" x1="16" x2="624" y1=${s} y2=${s}></line>
      ${l?c`<polyline class="board-report__line" points=${d.map(e=>`${e.x},${e.y}`).join(` `)}></polyline>
            ${d.map(e=>c`<circle class="board-report__point" cx=${e.x} cy=${e.y} r="3"></circle>`)}`:d.map(e=>c`<rect class="board-report__bar" x=${e.x-u*.35} y=${Math.min(e.y,s)} width=${u*.7} height=${Math.max(1,Math.abs(e.y-s))} rx="2"></rect>`)}
    </svg>`}
    <dl class="board-report__values">
      ${e.points.map(e=>o`<div>
            <dt>${e.label}</dt>
            <dd>${e.value}</dd>
          </div>`)}
    </dl>
  </figure>`}function P(e){switch(e.type){case`text`:return o`<section>
        ${e.title?o`<h3>${e.title}</h3>`:a}
        <p class="board-report__text">${e.text}</p>
      </section>`;case`metrics`:return o`<dl class="board-report__metrics">
        ${e.items.map(e=>o`<div>
              <dt>${e.label}</dt>
              <dd>${e.value}</dd>
              ${e.detail?o`<dd class="board-report__metric-detail">${e.detail}</dd>`:a}
            </div>`)}
      </dl>`;case`table`:return o`<div class="board-report__table">
        <table>
          ${e.title?o`<caption>
                  ${e.title}
                </caption>`:a}
          <thead>
            <tr>
              ${e.columns.map(e=>o`<th scope="col">${e}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${e.rows.map(e=>o`<tr>
                  ${e.map(e=>o`<td>${e}</td>`)}
                </tr>`)}
          </tbody>
        </table>
      </div>`;case`chart`:return N(e);case`links`:return o`<section>
        ${e.title?o`<h3>${e.title}</h3>`:a}
        <ul class="board-report__links">
          ${e.items.map(e=>o`<li>
              <a href=${e.url} target="_blank" rel="noopener noreferrer">${e.label}</a>
              ${e.detail?o`<span>${e.detail}</span>`:a}
            </li>`)}
        </ul>
      </section>`}return e}var F;function I(){return(I=e((()=>{s(),l(),M(),x(),n(),t(),F=class extends r{willUpdate(e){if(e.has(`widget`))try{this.content={report:T(this.widget?.props)}}catch(e){this.content={error:e}}}render(){let e=this.content;return e?`error`in e?S(e.error):o`<article
          class="board-report"
          aria-label=${this.widget?.title??i(`board.widget.kindReport`)}
        >
          ${e.report.blocks.map(P)}
        </article>`:a}},d([u({attribute:!1})],F.prototype,`widget`,void 0),customElements.get(`zero-report-widget`)||customElements.define(`zero-report-widget`,F)})))()}I();
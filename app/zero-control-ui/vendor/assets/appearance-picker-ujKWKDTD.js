import{n as e}from"./rolldown-runtime-8BhlS34s.js";import{Mu as t,Nu as n,ju as r}from"./control-ui-core-DCNBgr3X.js";import{J as i,W as a,Z as o,at as s,lt as c,rt as l}from"./lit-runtime-B40xFCK_.js";import{An as u,Mn as d}from"./control-ui-boot-shared-BRtBCr5s.js";import{Zr as f}from"./ui-AaV6iNVa.js";import{$r as p,Qr as m,Xr as h,Yr as g}from"./control-ui-boot-shared-ZuP0LiFD.js";import"./control-ui-boot-shared-styles-BXPMRytW.js";var _,v;function y(){return(y=e((()=>{a(),o(),u(),n(),m(),g(),_=class extends r{constructor(...e){super(...e),this.mode=`grid`,this.customIcon=``}select(e,t){this.props.disabled||this.props.onChange({icon:e,color:t})}showGrid(){this.mode=`grid`,this.customIcon=``,this.updateComplete.then(()=>{this.isConnected&&this.querySelector(`.session-menu__icon-choice--custom`)?.focus()})}render(){return h({inline:!0,clearable:this.props.clearable,mode:this.mode,currentIcon:this.props.icon,currentColor:this.props.color,disabled:this.props.disabled??!1,colorDisabled:this.props.disabled??!1,customIconValue:this.customIcon,onSelectColor:(e,t)=>this.select(this.props.icon,t),onSelect:(e,t)=>this.select(t,this.props.color),onReset:()=>this.select(null,null),onShowCustom:()=>{this.mode=`custom`,this.customIcon=``,this.updateComplete.then(()=>{this.isConnected&&this.querySelector(`.session-menu__icon-custom-input`)?.focus()})},onBack:()=>this.showGrid(),onInput:e=>{e.currentTarget instanceof HTMLTextAreaElement&&(this.customIcon=e.currentTarget.value)},onApply:()=>{let e=d(this.customIcon);e&&!this.props.disabled&&(this.select(e,this.props.color),this.showGrid())}})}},f([s({attribute:!1})],_.prototype,`props`,void 0),f([l()],_.prototype,`mode`,void 0),f([l()],_.prototype,`customIcon`,void 0),v=class extends t{static{this.styles=c`
    :host {
      color: var(--appearance-color, inherit);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1em;
    }
    svg,
    img {
      width: 100%;
      height: 100%;
    }
    img {
      object-fit: contain;
    }
  `}render(){let e=this.props.icon?.trim();return i`${e?p(e)??e:this.props.fallback}`}},f([s({attribute:!1})],v.prototype,`props`,void 0),customElements.get(`zero-appearance-picker`)||customElements.define(`zero-appearance-picker`,_),customElements.get(`zero-appearance-glyph`)||customElements.define(`zero-appearance-glyph`,v)})))()}y();export{v as AppearanceGlyph,_ as AppearancePicker};
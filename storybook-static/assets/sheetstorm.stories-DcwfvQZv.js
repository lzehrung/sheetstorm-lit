import{u as O,f as P,k as d,h as _}from"./lit-element-CwD9s8Pw.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const $=e=>(s,t)=>{t!==void 0?t.addInitializer(()=>{customElements.define(e,s)}):customElements.define(e,s)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const C={attribute:!0,type:String,converter:O,reflect:!1,hasChanged:P},k=(e=C,s,t)=>{const{kind:o,metadata:r}=t;let i=globalThis.litPropertyMetadata.get(r);if(i===void 0&&globalThis.litPropertyMetadata.set(r,i=new Map),i.set(t.name,e),o==="accessor"){const{name:a}=t;return{set(n){const p=s.get.call(this);s.set.call(this,n),this.requestUpdate(a,p,e)},init(n){return n!==void 0&&this.P(a,void 0,e),n}}}if(o==="setter"){const{name:a}=t;return function(n){const p=this[a];s.call(this,n),this.requestUpdate(a,p,e)}}throw Error("Unsupported decorator location: "+o)};function E(e){return(s,t)=>typeof t=="object"?k(e,s,t):((o,r,i)=>{const a=r.hasOwnProperty(i);return r.constructor.createProperty(i,a?{...o,wrapped:!0}:o),a?Object.getOwnPropertyDescriptor(r,i):void 0})(e,s,t)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function M(e){return E({...e,state:!0,attribute:!1})}var S=Object.defineProperty,D=Object.getOwnPropertyDescriptor,v=(e,s,t,o)=>{for(var r=o>1?void 0:o?D(s,t):s,i=e.length-1,a;i>=0;i--)(a=e[i])&&(r=(o?a(s,t,r):a(r))||r);return o&&r&&S(s,t,r),r};const q={title:"Sheetstorm Import",component:"sheetstorm-import"},y={name:{label:"Name",type:"string",validators:[e=>({isValid:e.trim().length>0,message:"Name is required"})]},email:{label:"Email",type:"string",validators:[e=>({isValid:e.trim().length>0,message:"Email is required"}),e=>({isValid:e.includes("@"),message:'Email must contain "@" symbol'})]}};let m=class extends _{constructor(){super(...arguments),this.open=!1}handleOpenClick(){this.open=!0}handleClose(){this.open=!1}handleBackdropClick(){this.open=!1}handleSuccess(e){console.log("Data imported successfully:",e.detail),this.open=!1}render(){return d`
      <button @click="${this.handleOpenClick}" style="margin-bottom: 16px;">
        Open Sheetstorm Modal
      </button>
      <sheetstorm-modal
        .open="${this.open}"
        .schema="${y}"
        @close="${this.handleClose}"
        @backdrop-click="${this.handleBackdropClick}"
        @data-import-success="${this.handleSuccess}"
      ></sheetstorm-modal>
    `}};v([M()],m.prototype,"open",2);m=v([$("with-modal-wrapper")],m);const l=()=>d`<sheetstorm-import .schema=${y}></sheetstorm-import>`,c=()=>d`<with-modal-wrapper></with-modal-wrapper>`;var h,u,f;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:"(): TemplateResult => html`<sheetstorm-import .schema=${schema}></sheetstorm-import>`",...(f=(u=l.parameters)==null?void 0:u.docs)==null?void 0:f.source}}};var g,w,b;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:"(): TemplateResult => html`<with-modal-wrapper></with-modal-wrapper>`",...(b=(w=c.parameters)==null?void 0:w.docs)==null?void 0:b.source}}};const x=["Default","WithModal"];export{l as Default,c as WithModal,x as __namedExportsOrder,q as default};

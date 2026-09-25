/* V43: independent darkness and thickness, preview and A3 print. */
(function(){
  'use strict';
  const prepare=window.preloadPrintImagesV14;
  const thicknessKey='sodb_signature_thickness_v704643';
  let thickness=0;
  const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;};
  function settings(){
    const darkness=clamp(document.getElementById('gtSignatureDarknessV704636')?.value??100,100,150,100);
    return {radius:(thickness*.005).toFixed(3),exponent:(1+(darkness-100)*.044).toFixed(2),original:darkness===100&&thickness===0};
  }
  function install(root,filterId){
    if(!root)return;
    const p=settings();
    root.style.setProperty('--sodb-ink-filter-v43',p.original?'none':`url("#${filterId}")`);
    let svg=root.querySelector('svg[data-signature-ink-v43]');
    if(p.original){svg?.remove();return;}
    if(!svg){
      svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('data-signature-ink-v43','');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');
      svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
      root.prepend(svg);
    }
    svg.innerHTML=`<defs><filter id="${filterId}" x="-5%" y="-10%" width="110%" height="120%" color-interpolation-filters="sRGB">
      <feFlood flood-color="white" result="paper"/>
      <feComposite in="SourceGraphic" in2="paper" operator="over" result="onPaper"/>
      <feMorphology in="onPaper" operator="erode" radius="${p.radius}" result="thickInk"/>
      <feComponentTransfer in="thickInk">
        <feFuncR type="gamma" amplitude="1" exponent="${p.exponent}" offset="0"/>
        <feFuncG type="gamma" amplitude="1" exponent="${p.exponent}" offset="0"/>
        <feFuncB type="gamma" amplitude="1" exponent="${p.exponent}" offset="0"/>
        <feFuncA type="identity"/>
      </feComponentTransfer>
    </filter></defs>`;
  }
  function preview(){install(document.getElementById('gtPrintPagesContainer'),'sodb-signature-preview-v43');}
  window.capNhatDoDayChuKyV704643=function(value){
    thickness=clamp(value,0,100,0);
    const slider=document.getElementById('gtSignatureThicknessV704643'),label=document.getElementById('gtSignatureThicknessValueV704643');
    if(slider)slider.value=String(thickness);if(label)label.textContent=thickness+'%';
    try{localStorage.setItem(thicknessKey,String(thickness));}catch(_e){}
    preview();
  };
  const setDarkness=window.capNhatDoDamChuKyV704636;
  window.capNhatDoDamChuKyV704636=function(value){setDarkness(value);preview();};
  window.datLaiChuKyV704643=function(){
    window.capNhatDoDamChuKyV704636(100);window.capNhatDoDayChuKyV704643(0);
  };
  window.preloadPrintImagesV14=async function(root){
    install(root,'sodb-signature-print-v43');return await prepare(root);
  };
  function init(){
    let saved=0;try{saved=localStorage.getItem(thicknessKey)??0;}catch(_e){}
    window.capNhatDoDayChuKyV704643(saved);
    const host=document.getElementById('gtPrintPagesContainer');
    if(host)new MutationObserver(records=>{
      if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.print-page-block,img')||n.querySelector?.('.print-page-block,img')))))preview();
    }).observe(host,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

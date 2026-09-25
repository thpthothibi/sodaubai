/* V70.4.6.47: darkness + common thickness + optional adaptive equalization.
   Chỉ tác động khi hiển thị/in; không sửa file chữ ký gốc. */
(function(){
  'use strict';
  const prepare=window.preloadPrintImagesV14;
  const thicknessKey='sodb_signature_thickness_v704643';
  const uniformKey='sodb_signature_uniform_v704647';
  const uniformTargetKey='sodb_signature_uniform_target_v704647';
  const analysisCache=new Map();
  let thickness=0, uniform=false, uniformTarget=100, runSeq=0, previewTimer=0;
  const selector='.sig-img-preview,.sig-gvcn-print,.sig-bgh-print';
  const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;};
  const median=a=>{const b=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!b.length)return null;const m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2;};
  function darknessValue(){return clamp(document.getElementById('gtSignatureDarknessV704636')?.value??100,100,150,100);}
  function exponent(){return (1+(darknessValue()-100)*.044).toFixed(2);}
  function baseRadius(){return thickness*.005;}
  function settings(){const d=darknessValue();return {radius:baseRadius().toFixed(3),exponent:exponent(),original:d===100&&thickness===0&&!uniform};}
  function clearPerImage(root){
    if(!root)return;
    root.querySelectorAll(selector).forEach(img=>{
      img.style.removeProperty('filter');img.style.removeProperty('-webkit-filter');
      delete img.dataset.sodbEqV47;
    });
    root.querySelectorAll('svg[data-signature-eq-v47]').forEach(n=>n.remove());
  }
  function installCommon(root,filterId){
    if(!root)return;
    clearPerImage(root);
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
    svg.innerHTML=`<defs><filter id="${filterId}" x="-8%" y="-15%" width="116%" height="130%" color-interpolation-filters="sRGB">
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
  function otsu(gray){
    const hist=new Array(256).fill(0);for(const g of gray)hist[g]++;
    const total=gray.length;let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];
    let sumB=0,wB=0,max=-1,thr=210;
    for(let t=0;t<256;t++){
      wB+=hist[t];if(!wB)continue;const wF=total-wB;if(!wF)break;
      sumB+=t*hist[t];const mB=sumB/wB,mF=(sum-sumB)/wF,between=wB*wF*(mB-mF)*(mB-mF);
      if(between>max){max=between;thr=t;}
    }
    return clamp(thr,70,242,210);
  }
  async function analyzeInk(img){
    const src=String(img.currentSrc||img.getAttribute('src')||'');if(!src||!img.naturalWidth)return null;
    if(analysisCache.has(src))return analysisCache.get(src);
    let result=null;
    try{
      const w=200,h=Math.max(24,Math.min(120,Math.round(w*(img.naturalHeight/Math.max(1,img.naturalWidth)))));
      const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});
      ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
      const data=ctx.getImageData(0,0,w,h).data,gray=[],alpha=[];let transparent=0;
      for(let i=0;i<data.length;i+=4){const a=data[i+3],g=Math.round(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]);gray.push(g);alpha.push(a);if(a<245)transparent++;}
      const hasAlpha=transparent>gray.length*.03,thr=hasAlpha?248:otsu(gray),mask=new Uint8Array(gray.length);
      let area=0;
      for(let i=0;i<gray.length;i++){const ink=hasAlpha?(alpha[i]>30&&gray[i]<thr):(gray[i]<thr);if(ink){mask[i]=1;area++;}}
      if(area<12||area>gray.length*.65)throw new Error('mask');
      let perimeter=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=y*w+x;if(!mask[i])continue;
        if(x===0||!mask[i-1])perimeter++;if(x===w-1||!mask[i+1])perimeter++;
        if(y===0||!mask[i-w])perimeter++;if(y===h-1||!mask[i+w])perimeter++;
      }
      const stroke=perimeter?2*area/perimeter:null;
      if(Number.isFinite(stroke)&&stroke>.08&&stroke<15)result={stroke};
    }catch(_e){result=null;}
    analysisCache.set(src,result);return result;
  }
  function groupKey(img){return img.matches('.sig-img-preview')?'lesson':'closing';}
  function displayWidth(img){const r=img.getBoundingClientRect?.();if(r&&r.width>4)return r.width;return img.matches('.sig-img-preview')?38:80;}
  function ensureEqSvg(root){
    let svg=root.querySelector('svg[data-signature-eq-v47]');
    if(!svg){svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('data-signature-eq-v47','');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';svg.innerHTML='<defs></defs>';root.prepend(svg);}return svg.querySelector('defs');
  }
  function addFilter(defs,id,signedRadius,exp){
    const op=signedRadius>=0?'erode':'dilate',radius=Math.abs(signedRadius).toFixed(3);
    const f=document.createElementNS('http://www.w3.org/2000/svg','filter');f.setAttribute('id',id);f.setAttribute('x','-10%');f.setAttribute('y','-18%');f.setAttribute('width','120%');f.setAttribute('height','136%');f.setAttribute('color-interpolation-filters','sRGB');
    f.innerHTML=`<feFlood flood-color="white" result="paper"/><feComposite in="SourceGraphic" in2="paper" operator="over" result="onPaper"/><feMorphology in="onPaper" operator="${op}" radius="${radius}" result="balancedInk"/><feComponentTransfer in="balancedInk"><feFuncR type="gamma" amplitude="1" exponent="${exp}" offset="0"/><feFuncG type="gamma" amplitude="1" exponent="${exp}" offset="0"/><feFuncB type="gamma" amplitude="1" exponent="${exp}" offset="0"/><feFuncA type="identity"/></feComponentTransfer>`;
    defs.appendChild(f);
  }
  async function installUniform(root,prefix){
    if(!root)return;
    clearPerImage(root);root.querySelector('svg[data-signature-ink-v43]')?.remove();root.style.setProperty('--sodb-ink-filter-v43','none');
    const imgs=[...root.querySelectorAll(selector)].filter(i=>i.getAttribute('src')&&!i.classList.contains('d-none'));
    if(!imgs.length)return;
    const analyses=await Promise.all(imgs.map(analyzeInk)),groups={lesson:[],closing:[]};
    analyses.forEach((a,i)=>{if(a)groups[groupKey(imgs[i])].push(a.stroke);});
    const target={lesson:median(groups.lesson),closing:median(groups.closing)};const defs=ensureEqSvg(root),exp=exponent(),base=baseRadius(),seq=++runSeq;
    imgs.forEach((img,i)=>{
      const a=analyses[i],g=groupKey(img),med=target[g];let adjust=0;
      if(a&&med){const wanted=med*(uniformTarget/100),deltaNorm=wanted-a.stroke;adjust=(deltaNorm*(displayWidth(img)/200))/2;adjust=clamp(adjust,-.65,.65,0);}
      const signed=clamp(base+adjust,-.65,1.1,base),id=`${prefix}-${seq}-${i}`;addFilter(defs,id,signed,exp);
      img.style.setProperty('filter',`url("#${id}")`,'important');img.style.setProperty('-webkit-filter',`url("#${id}")`,'important');img.dataset.sodbEqV47='1';
    });
  }
  async function apply(root,prefix){if(uniform)await installUniform(root,prefix);else installCommon(root,prefix);}
  function schedulePreview(){clearTimeout(previewTimer);previewTimer=setTimeout(()=>apply(document.getElementById('gtPrintPagesContainer'),'sodb-signature-preview-v47'),80);}
  window.capNhatDoDayChuKyV704643=function(value){
    thickness=clamp(value,0,100,0);const slider=document.getElementById('gtSignatureThicknessV704643'),label=document.getElementById('gtSignatureThicknessValueV704643');
    if(slider)slider.value=String(thickness);if(label)label.textContent=thickness+'%';try{localStorage.setItem(thicknessKey,String(thickness));}catch(_e){}schedulePreview();
  };
  const setDarkness=window.capNhatDoDamChuKyV704636;
  window.capNhatDoDamChuKyV704636=function(value){if(typeof setDarkness==='function')setDarkness(value);schedulePreview();};
  window.capNhatCanBangChuKyV704647=function(value){
    uniform=typeof value==='boolean'?value:!!document.getElementById('gtSignatureUniformV704647')?.checked;
    const box=document.getElementById('gtSignatureUniformV704647'),target=document.getElementById('gtSignatureUniformTargetWrapV704647');if(box)box.checked=uniform;if(target)target.classList.toggle('d-none',!uniform);
    try{localStorage.setItem(uniformKey,uniform?'1':'0');}catch(_e){}schedulePreview();
  };
  window.capNhatMucNetDongDeuV704647=function(value){
    uniformTarget=clamp(value,80,140,100);const slider=document.getElementById('gtSignatureUniformTargetV704647'),label=document.getElementById('gtSignatureUniformTargetValueV704647');if(slider)slider.value=String(uniformTarget);if(label)label.textContent=uniformTarget+'%';try{localStorage.setItem(uniformTargetKey,String(uniformTarget));}catch(_e){}schedulePreview();
  };
  window.datLaiChuKyV704643=function(){
    window.capNhatDoDamChuKyV704636(100);window.capNhatDoDayChuKyV704643(0);window.capNhatMucNetDongDeuV704647(100);window.capNhatCanBangChuKyV704647(false);
  };
  window.preloadPrintImagesV14=async function(root){
    if(typeof prepare==='function')await prepare(root);await apply(root,'sodb-signature-print-v47');
  };
  function init(){
    let savedT=0,savedU='0',savedTarget=100;try{savedT=localStorage.getItem(thicknessKey)??0;savedU=localStorage.getItem(uniformKey)??'0';savedTarget=localStorage.getItem(uniformTargetKey)??100;}catch(_e){}
    window.capNhatDoDayChuKyV704643(savedT);window.capNhatMucNetDongDeuV704647(savedTarget);window.capNhatCanBangChuKyV704647(savedU==='1');
    const host=document.getElementById('gtPrintPagesContainer');if(host){
      host.addEventListener('load',e=>{if(e.target?.matches?.(selector))schedulePreview();},true);
      new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.print-page-block,img')||n.querySelector?.('.print-page-block,img')))))schedulePreview();}).observe(host,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

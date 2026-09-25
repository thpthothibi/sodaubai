/* V70.4.6.41: shared by both A3 print buttons. No canvas/CORS conversion. */
(function(){
  'use strict';
  function waitImage(img, retry){
    return new Promise(resolve=>{
      let settled=false,timer;
      const done=ok=>{
        if(settled)return;settled=true;clearTimeout(timer);
        img.removeEventListener('load',loaded);img.removeEventListener('error',failed);
        resolve(ok);
      };
      const loaded=()=>{
        if(!img.naturalWidth)return done(false);
        if(typeof img.decode==='function')img.decode().then(()=>done(true),()=>done(false));
        else done(true);
      };
      const failed=()=>done(false);
      img.addEventListener('load',loaded);img.addEventListener('error',failed);
      timer=setTimeout(()=>done(false),15000);
      if(retry){
        const src=img.getAttribute('src');
        // Keep signed URL intact. Do not append cache-busting query parameters.
        img.removeAttribute('src');img.setAttribute('src',src);
      }
      if(img.complete){if(img.naturalWidth)loaded();else failed();}
    });
  }
  async function readyImage(img){
    const signature=img.matches('.sig-img-preview,.sig-gvcn-print,.sig-bgh-print');
    if(!img.getAttribute('src'))return !signature;
    // Print clone only: the old handler hides images permanently after one error.
    const handler=img.getAttribute('onerror');
    img.removeAttribute('onerror');
    img.loading='eager';img.decoding='sync';
    let ok=false;
    try{
      ok=await waitImage(img,false);
      if(!ok)ok=await waitImage(img,true);
      if(ok&&signature){
        img.classList.remove('d-none');
        img.style.removeProperty('display');
        img.closest('.sig-container')?.querySelectorAll('.sig-fallback-v682').forEach(n=>n.remove());
      }
      return ok||!signature;
    }finally{if(handler!==null)img.setAttribute('onerror',handler);}
  }
  window.preloadPrintImagesV14=async function(root){
    if(!root)return;
    const images=[...root.querySelectorAll('img')];
    const results=await Promise.all(images.map(readyImage));
    const missing=images.filter((_,i)=>!results[i]);
    if(missing.length){
      const names=[...new Set(missing.map(img=>img.closest('.sig-container')?.querySelector('.sig-name')?.textContent?.trim()||img.alt||'Chữ ký'))];
      throw new Error('Chưa tải được ảnh chữ ký: '+names.slice(0,8).join(', ')+(names.length>8?'…':'')+'. Vui lòng tải lại dữ liệu tuần rồi in lại.');
    }
    if(document.fonts){
      let timer;
      try{
        await Promise.race([document.fonts.ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Phông chữ chưa sẵn sàng. Vui lòng thử in lại.')),10000);})]);
      }finally{clearTimeout(timer);}
    }
  };
})();

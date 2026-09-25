/* V70.4.6.42: darken and gently thicken only the rendered A3 signature.
   White backing preserves opaque scans and transparent PNGs alike.
   No canvas readback, no upload, no change to stored signatures. */
(function(){
  'use strict';
  const prepare=window.preloadPrintImagesV14;
  function installPrintInk(root){
    if(!root)return;
    root.querySelector('#sodb-print-ink-defs-v42')?.remove();
    const value=Number(document.getElementById('gtSignatureDarknessV704636')?.value)||135;
    const level=Math.max(100,Math.min(150,value));
    const t=(level-100)/50;
    const radius=(.18+.17*t).toFixed(3);
    const exponent=(2+1.2*t).toFixed(2);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.id='sodb-print-ink-defs-v42';
    svg.setAttribute('width','0');svg.setAttribute('height','0');
    svg.setAttribute('aria-hidden','true');
    svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    svg.innerHTML=`<defs><filter id="sodb-print-signature-ink-v42" x="-5%" y="-10%" width="110%" height="120%" color-interpolation-filters="sRGB">
      <feFlood flood-color="white" result="paper"/>
      <feComposite in="SourceGraphic" in2="paper" operator="over" result="onPaper"/>
      <feMorphology in="onPaper" operator="erode" radius="${radius}" result="thickInk"/>
      <feComponentTransfer in="thickInk">
        <feFuncR type="gamma" amplitude="1" exponent="${exponent}" offset="0"/>
        <feFuncG type="gamma" amplitude="1" exponent="${exponent}" offset="0"/>
        <feFuncB type="gamma" amplitude="1" exponent="${exponent}" offset="0"/>
        <feFuncA type="identity"/>
      </feComponentTransfer>
    </filter></defs>`;
    root.prepend(svg);
  }
  window.preloadPrintImagesV14=async function(root){
    installPrintInk(root);
    return await prepare(root);
  };
})();

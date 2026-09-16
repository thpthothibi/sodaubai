/* ============================================================================
 * V69 REPORT EXPORT MODULE
 * - Tra cứu/Thống kê: Excel + PDF cho từng mục.
 * - Quản trị: Excel + PDF cho từng mục.
 * - KHBD: PDF cho Tải/Xem/KHBD của tôi/Duyệt KHBD.
 * Chỉ đọc dữ liệu đang hiển thị trên trình duyệt, không tạo thêm RPC Supabase.
 * ============================================================================ */
const REPORT_EXPORT_VERSION_V6851 = 'V68.5.1';
const HTML2CANVAS_URL_V6851='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
const JSPDF_URL_V6851='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
let pdfLibPromiseV6851=null;

function loadExternalScriptV6851(src,testFn){
  if(testFn&&testFn())return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const found=[...document.scripts].find(s=>s.src===src);
    if(found){
      if(testFn&&testFn())return resolve();
      found.addEventListener('load',()=>resolve(),{once:true});
      found.addEventListener('error',()=>reject(new Error('Không tải được thư viện xuất báo cáo.')),{once:true});
      return;
    }
    const s=document.createElement('script');s.src=src;s.async=true;
    s.onload=()=>resolve();s.onerror=()=>reject(new Error('Không tải được thư viện xuất báo cáo.'));
    document.head.appendChild(s);
  });
}
function ensurePdfLibV6851(){
  if(window.html2canvas&&window.jspdf&&window.jspdf.jsPDF)return Promise.resolve();
  if(pdfLibPromiseV6851)return pdfLibPromiseV6851;
  pdfLibPromiseV6851=loadExternalScriptV6851(HTML2CANVAS_URL_V6851,()=>!!window.html2canvas)
    .then(()=>loadExternalScriptV6851(JSPDF_URL_V6851,()=>!!(window.jspdf&&window.jspdf.jsPDF)))
    .catch(err=>{pdfLibPromiseV6851=null;throw err;});
  return pdfLibPromiseV6851;
}
function sanitizeReportFileNameV6851(s){
  return String(s||'Bao_cao').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,90)||'Bao_cao';
}
function reportNowLabelV6851(){
  try{return new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'medium'}).format(new Date());}catch(_e){return new Date().toLocaleString('vi-VN');}
}
function reportScopeTitleV6851(scope){
  if(!scope)return 'Báo cáo';
  const id=scope.id||'';
  const nav=document.querySelector(`[data-bs-target="#${CSS.escape(id)}"]`);
  if(nav&&nav.textContent.trim())return nav.textContent.replace(/\s+/g,' ').trim();
  const h=scope.querySelector('h1,h2,h3,h4,h5,h6,.section-title-v13,.card-header');
  return h&&h.textContent.trim()?h.textContent.replace(/\s+/g,' ').trim():'Báo cáo';
}
function visibleForReportV6851(el){
  if(!el)return false;
  if(el.closest('.d-none'))return false;
  const st=getComputedStyle(el);
  return st.display!=='none'&&st.visibility!=='hidden';
}
function controlLabelV6851(el){
  if(!el)return '';
  if(el.id){const l=document.querySelector(`label[for="${CSS.escape(el.id)}"]`);if(l)return l.textContent.replace(/\s+/g,' ').trim();}
  const wrap=el.closest('.col-md-2,.col-md-3,.col-md-4,.col-md-5,.col-md-6,.col-md-8,.col-12,.mb-2,.mb-3,.form-group');
  const l=wrap&&wrap.querySelector('label');return l?l.textContent.replace(/\s+/g,' ').trim():el.name||el.id||'Thông tin';
}
function controlValueV6851(el){
  if(!el)return '';
  if(el.type==='checkbox'||el.type==='radio')return el.checked?'Có':'Không';
  if(el.tagName==='SELECT')return el.selectedOptions&&el.selectedOptions[0]?el.selectedOptions[0].textContent.trim():el.value||'';
  if(el.type==='file')return el.files&&el.files[0]?el.files[0].name:'';
  return String(el.value||'').trim();
}
function collectFiltersV6851(scope){
  const rows=[];const seen=new Set();
  (scope?scope.querySelectorAll('input,select,textarea'):[]).forEach(el=>{
    if(!visibleForReportV6851(el)||el.type==='hidden'||el.type==='password'||el.type==='file')return;
    const label=controlLabelV6851(el),value=controlValueV6851(el);if(!label||!value)return;
    const k=label+'|'+value;if(seen.has(k))return;seen.add(k);rows.push([label,value]);
  });
  return rows;
}
function cleanCellTextV6851(cell){
  if(!cell)return '';
  const clone=cell.cloneNode(true);
  clone.querySelectorAll('button,input,select,textarea,.no-print,.report-export-toolbar-v6851').forEach(x=>x.remove());
  return clone.textContent.replace(/\s+/g,' ').trim();
}
function tableToAoaV6851(table){
  const rows=[];
  table.querySelectorAll('tr').forEach(tr=>{
    if(!visibleForReportV6851(tr))return;
    const cells=[...tr.children].filter(x=>/^(TH|TD)$/i.test(x.tagName));
    if(!cells.length)return;
    rows.push(cells.map(cleanCellTextV6851));
  });
  return rows;
}
function collectTablesV6851(scope){
  return [...(scope?scope.querySelectorAll('table'):[])].filter(t=>{
    if(!visibleForReportV6851(t))return false;
    const aoa=tableToAoaV6851(t);return aoa.length>0&&aoa.some(r=>r.some(v=>String(v).trim()));
  });
}
function collectStatusTextV6851(scope){
  if(!scope)return '';
  const selectors=['.alert:not(.d-none)','[id*="Status"]:not(.d-none)','[id*="Count"]:not(.d-none)','[id*="Preview"]:not(.d-none)','[id*="List"]:not(.d-none)'];
  const out=[];const seen=new Set();
  scope.querySelectorAll(selectors.join(',')).forEach(el=>{
    if(!visibleForReportV6851(el)||el.closest('table')||el.closest('.report-export-toolbar-v6851'))return;
    const txt=el.textContent.replace(/\s+/g,' ').trim();if(!txt||txt.length>2500||seen.has(txt))return;seen.add(txt);out.push(txt);
  });
  return out.join('\n');
}
function exportExcelScopeV6851(scopeId,customTitle){
  const scope=document.getElementById(scopeId);if(!scope){showToastV9('Không tìm thấy vùng dữ liệu cần xuất.','danger');return;}
  ensureXlsxV7().then(()=>{
    const title=customTitle||reportScopeTitleV6851(scope),wb=XLSX.utils.book_new();
    const filters=collectFiltersV6851(scope),tables=collectTablesV6851(scope);
    const info=[['TRƯỜNG THPT HỒ THỊ BI'],[title],['Thời điểm xuất',reportNowLabelV6851()],[]];
    if(filters.length){info.push(['BỘ LỌC / THÔNG TIN']);filters.forEach(r=>info.push(r));}
    const status=collectStatusTextV6851(scope);if(status){info.push([],['Ghi chú',status]);}
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(info),'Thông tin');
    tables.forEach((table,i)=>{
      const aoa=tableToAoaV6851(table);if(!aoa.length)return;
      const ws=XLSX.utils.aoa_to_sheet(aoa);
      const maxCols=Math.max(...aoa.map(r=>r.length),1);ws['!cols']=Array.from({length:maxCols},(_,c)=>({wch:Math.min(45,Math.max(10,...aoa.map(r=>String(r[c]||'').length+2)))}));
      XLSX.utils.book_append_sheet(wb,ws,('Du lieu '+(i+1)).slice(0,31));
    });
    XLSX.writeFile(wb,sanitizeReportFileNameV6851(title)+'_'+new Date().toISOString().slice(0,10)+'.xlsx');
  }).catch(err=>showToastV9('Không xuất được Excel: '+(err.message||err),'danger'));
}
function buildPdfReportDomV6851(scope,title){
  const wrap=document.createElement('div');
  wrap.style.cssText='position:fixed;left:-20000px;top:0;width:1120px;background:#fff;color:#111;padding:28px 34px;font-family:Arial,"Segoe UI",sans-serif;z-index:-1;';
  const header=document.createElement('div');header.innerHTML=`<div style="text-align:center;border-bottom:2px solid #222;padding-bottom:10px;margin-bottom:14px"><div style="font-size:14px;font-weight:700">SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HỒ CHÍ MINH</div><div style="font-size:15px;font-weight:800;margin-top:3px">TRƯỜNG THPT HỒ THỊ BI</div><div style="font-size:22px;font-weight:900;margin-top:12px">${escapeHtml(title)}</div><div style="font-size:11px;color:#555;margin-top:5px">Xuất lúc ${escapeHtml(reportNowLabelV6851())}</div></div>`;wrap.appendChild(header);
  const filters=collectFiltersV6851(scope);
  if(filters.length){const box=document.createElement('div');box.style.cssText='font-size:12px;margin:8px 0 14px;padding:8px 10px;background:#f5f7fa;border:1px solid #dde3ea;border-radius:5px;display:grid;grid-template-columns:repeat(3,1fr);gap:5px 12px';box.innerHTML=filters.map(r=>`<div><b>${escapeHtml(r[0])}:</b> ${escapeHtml(r[1])}</div>`).join('');wrap.appendChild(box);}
  const status=collectStatusTextV6851(scope);if(status){const p=document.createElement('div');p.style.cssText='font-size:11px;white-space:pre-wrap;margin:7px 0 12px;color:#444';p.textContent=status;wrap.appendChild(p);}
  const tables=collectTablesV6851(scope);
  if(tables.length){tables.forEach((table,i)=>{const clone=table.cloneNode(true);clone.querySelectorAll('button,input,select,textarea,.no-print').forEach(x=>x.remove());clone.removeAttribute('id');clone.style.cssText='width:100%;border-collapse:collapse;font-size:10px;margin:8px 0 18px;';clone.querySelectorAll('th,td').forEach(c=>c.style.cssText='border:1px solid #555;padding:4px 5px;vertical-align:top;');clone.querySelectorAll('th').forEach(c=>{c.style.background='#e9eef5';c.style.fontWeight='700';});wrap.appendChild(clone);});}
  else{
    const content=document.createElement('div');content.style.cssText='font-size:12px;line-height:1.5;white-space:pre-wrap;border:1px solid #ddd;padding:12px;';
    const clone=scope.cloneNode(true);clone.querySelectorAll('button,.nav,.report-export-toolbar-v6851,input[type=file],script,style').forEach(x=>x.remove());
    clone.querySelectorAll('input,select,textarea').forEach(el=>{const span=document.createElement('span');span.textContent=controlValueV6851(el);el.replaceWith(span);});
    content.textContent=clone.textContent.replace(/\n\s*\n+/g,'\n').replace(/[ \t]+/g,' ').trim();wrap.appendChild(content);
  }
  document.body.appendChild(wrap);return wrap;
}
async function exportPdfScopeV6851(scopeId,customTitle){
  const scope=document.getElementById(scopeId);if(!scope){showToastV9('Không tìm thấy vùng dữ liệu cần xuất.','danger');return;}
  const title=customTitle||reportScopeTitleV6851(scope);setBusyV13(true,'Đang tạo PDF...');let report=null;
  try{
    await ensurePdfLibV6851();report=buildPdfReportDomV6851(scope,title);
    const canvas=await html2canvas(report,{scale:1.45,useCORS:true,allowTaint:false,backgroundColor:'#ffffff',logging:false,windowWidth:1200});
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
    const pageW=297,pageH=210,margin=7,drawW=pageW-margin*2,drawH=pageH-margin*2;
    const pxPerMm=canvas.width/drawW,pageSlicePx=Math.max(1,Math.floor(drawH*pxPerMm));
    let offset=0,page=0;
    while(offset<canvas.height){
      const sliceH=Math.min(pageSlicePx,canvas.height-offset),slice=document.createElement('canvas');slice.width=canvas.width;slice.height=sliceH;
      slice.getContext('2d').drawImage(canvas,0,offset,canvas.width,sliceH,0,0,canvas.width,sliceH);
      if(page>0)pdf.addPage('a4','landscape');
      const hMm=sliceH/pxPerMm;pdf.addImage(slice.toDataURL('image/jpeg',0.92),'JPEG',margin,margin,drawW,hMm,undefined,'FAST');
      offset+=sliceH;page++;
    }
    pdf.save(sanitizeReportFileNameV6851(title)+'_'+new Date().toISOString().slice(0,10)+'.pdf');
    showToastV9('Đã tạo file PDF.','success');
  }catch(err){console.error('[EXPORT PDF V68.5.1]',err);showToastV9('Không xuất được PDF: '+(err&&err.message?err.message:err),'danger');}
  finally{if(report)report.remove();setBusyV13(false);}
}
function injectExportToolbarV6851(scopeId,mode,label){
  const scope=document.getElementById(scopeId);if(!scope||scope.querySelector(':scope > .report-export-toolbar-v6851'))return;
  const title=label||reportScopeTitleV6851(scope),bar=document.createElement('div');bar.className='report-export-toolbar-v6851 no-print';
  const labelEl=document.createElement('span');labelEl.className='report-export-label-v6851';labelEl.textContent='Xuất báo cáo · '+title;bar.appendChild(labelEl);
  if(mode==='BOTH'){
    const ex=document.createElement('button');ex.type='button';ex.className='btn btn-outline-success btn-sm';ex.textContent='Xuất Excel';ex.onclick=()=>exportExcelScopeV6851(scopeId,title);bar.appendChild(ex);
  }
  const pdf=document.createElement('button');pdf.type='button';pdf.className='btn btn-outline-danger btn-sm';pdf.textContent='Xuất PDF';pdf.onclick=()=>exportPdfScopeV6851(scopeId,title);bar.appendChild(pdf);
  scope.insertBefore(bar,scope.firstChild);
}
function setupExportReportsV6851(){
  const giamThi={
    'gt-pills-thongke':'Thống kê toàn khối',
    'gt-pills-tracuu':'Tra cứu tiết học chi tiết',
    'gt-pills-late':'Kiểm tra nhập trễ',
    'gt-pills-printa3':'In A3 theo tuần'
  };
  const admin={
    'gt-pills-khbd':'Đối soát bài dạy & tiến độ',
    'pills-check':'Kiểm dò trùng tiết',
    'pills-unlock':'Mở khóa tuần ký chốt',
    'pills-input-unlock-v683':'Mở khóa nhập tiết',
    'pills-classes':'Danh sách lớp',
    'pills-roster':'Danh sách học sinh',
    'pills-requests':'Yêu cầu chỉnh sửa',
    'pills-system':'Nhật ký / Sao lưu'
  };
  Object.entries(giamThi).forEach(([id,label])=>injectExportToolbarV6851(id,'BOTH',label));
  Object.entries(admin).forEach(([id,label])=>injectExportToolbarV6851(id,'BOTH',label));
  const khbd={
    'khbd-upload-pane-v38':'KHBD đang tải / xem trước',
    'khbd-view-pane-v38':'Kế hoạch bài dạy',
    'khbd-submitted-pane-v659':'KHBD tổ chuyên môn đã tải',
    'khbd-my-pane-v67':'KHBD của tôi',
    'khbd-approval-pane-v50':'Danh sách duyệt KHBD'
  };
  Object.entries(khbd).forEach(([id,label])=>injectExportToolbarV6851(id,'PDF',label));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setupExportReportsV6851,250));else setTimeout(setupExportReportsV6851,250);


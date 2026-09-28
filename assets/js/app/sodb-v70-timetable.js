/* V70.4.6.49.6.3.15 - Import TKB VietSchool: lớp chính + BC/CL/Chuyên đề trong cùng TKB. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const EXTERNAL_KEYS=new Set(['stem','avbn','kns','tanc','thqt','tinhocquocte']);
  let parsed=[],scheduleRows=[],scheduleFileName='';
  let embeddedCatalog=new Map(),supplementCatalog=new Map(),embeddedCatalogSource='',supplementCatalogSource='';
  let stats=emptyStats();

  function emptyStats(){return {total:0,mainCells:0,specialCells:0,excluded:0,imported:0,importedMain:0,importedSpecial:0,excludedBy:{},errors:[],parallelSlots:0,duplicateExact:0,catalogTotal:0,catalogSpecial:0,scheduledSpecialClasses:0,missingSpecialSchedule:[],catalogSource:''};}
  function esc(v){return typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function loose(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();}
  function classKey(v){return loose(v);}
  function cleanTeacher(v){return String(v??'').replace(/\s*\(\s*\d+\s*\)\s*$/,'').replace(/\s+/g,' ').trim();}
  function normalizeSession(v){const k=loose(v);if(k==='sang')return 'SANG';if(k==='chieu')return 'CHIEU';return '';}
  function isExternalSubject(v){return EXTERNAL_KEYS.has(loose(v));}
  function tomorrowIso(){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  function subjectForImport(v){const raw=String(v||'').trim();if(!raw)return '';try{return typeof canonicalSubjectV6955==='function'?canonicalSubjectV6955(raw):raw;}catch(_e){return raw;}}
  function mainClassName(v){return /^(10|11|12)A\d+$/i.test(String(v||'').trim());}
  function mainCatalogType(v){return loose(v).includes('lopchinh');}

  function resetPreview(msg='Chưa chọn file TKB.'){
    parsed=[];stats=emptyStats();
    const p=$('tkbPreviewV704650');if(p)p.innerHTML=`<div class="text-muted small">${esc(msg)}</div>`;
    const b=$('tkbImportBtnV704650');if(b)b.disabled=true;
  }

  function sheetRows(book,name){return XLSX.utils.sheet_to_json(book.Sheets[name],{header:1,defval:'',raw:false,blankrows:true});}
  function isScheduleRows(rows){const h1=Array.isArray(rows?.[0])?rows[0]:[],h2=Array.isArray(rows?.[1])?rows[1]:[];const first4=[h1[0],h1[1],h1[2],h1[3]].map(loose);if(!(first4[1].includes('lop')&&first4[2].includes('mabuoihoc')&&first4[3].includes('tiethoc')))return false;let pairs=0;for(let c=4;c+1<Math.max(h1.length,h2.length);c+=2){if(loose(h2[c]).includes('monhoc')&&loose(h2[c+1]).includes('giaovien'))pairs++;}return pairs===6;}
  function isCatalogRows(rows){const h=Array.isArray(rows?.[0])?rows[0].map(loose):[];return h.some(x=>x==='lop'||x.includes('tenlop'))&&h.some(x=>x==='khoi'||x.includes('khoilop'));}
  function findRows(book,predicate){for(const name of book.SheetNames||[]){const rows=sheetRows(book,name);if(predicate(rows))return {name,rows};}return null;}

  function parseCatalogRows(rows,source=''){
    const h=(rows?.[0]||[]).map(loose),find=(keys)=>h.findIndex(x=>keys.some(k=>x===k||x.includes(k)));
    const iLop=find(['lop','tenlop']),iKhoi=find(['khoi','khoilop']),iLoai=find(['loailop']),iLienQuan=find(['nhomhoclienquan','nhomlienquan']);
    if(iLop<0||iKhoi<0)throw new Error('File lớp/khối phải có tối thiểu 2 cột Lớp và Khối.');
    const map=new Map(),errors=[];
    for(let i=1;i<(rows||[]).length;i++){
      const r=rows[i]||[],lop=String(r[iLop]||'').trim();if(!lop)continue;
      const khoi=Number(r[iKhoi]||0),loai=String(iLoai>=0?r[iLoai]||'':'').trim(),related=String(iLienQuan>=0?r[iLienQuan]||'':'').trim();
      if(![10,11,12].includes(khoi)){errors.push(`Danh mục dòng ${i+1}: ${lop} chưa có Khối 10/11/12.`);continue;}
      map.set(classKey(lop),{lop,khoi,loaiLop:loai|| (mainClassName(lop)?'Lớp chính':'Nhóm riêng'),nhomHocLienQuan:related});
    }
    if(!map.size)throw new Error('File lớp/khối không có dữ liệu hợp lệ.');
    if(errors.length)throw new Error(errors.slice(0,8).join('\n'));
    return {map,source};
  }

  function activeCatalog(){const map=new Map(embeddedCatalog);for(const [k,v] of supplementCatalog)map.set(k,v);return map;}
  function activeCatalogSource(){return [embeddedCatalogSource,supplementCatalogSource].filter(Boolean).join(' + ');}

  function parseRows(rows,catalog){
    const h1=Array.isArray(rows?.[0])?rows[0]:[],h2=Array.isArray(rows?.[1])?rows[1]:[];
    const dayCols=[];for(let c=4;c+1<Math.max(h1.length,h2.length);c+=2){const subKey=loose(h2[c]),teacherKey=loose(h2[c+1]);if(subKey.includes('monhoc')&&teacherKey.includes('giaovien'))dayCols.push({thu:2+dayCols.length,subjectCol:c,teacherCol:c+1});}
    if(dayCols.length!==6)throw new Error('Không đúng mẫu VietSchool: phải có đủ 6 cặp cột Môn học/Giáo viên từ Thứ 2 đến Thứ 7.');

    const out=[],exactSeen=new Set(),slotCounts=new Map(),parallelKeys=new Set(),excludedBy={},errors=[],scheduledSpecial=new Set();
    let total=0,mainCells=0,specialCells=0,excluded=0,duplicateExact=0,importedSpecial=0;
    const missingCatalog=new Set();
    for(let ri=2;ri<(rows||[]).length;ri++){
      const r=rows[ri]||[],lop=String(r[1]||'').trim(),buoi=normalizeSession(r[2]),tiet=Number(r[3]||0);if(!lop&&!buoi&&!tiet)continue;
      const meta=catalog.get(classKey(lop)),nameGrade=Number(String(lop).match(/^(10|11|12)/)?.[1]||0),khoi=Number(meta?.khoi||nameGrade||0);
      const isSpecial=meta?!mainCatalogType(meta.loaiLop):!mainClassName(lop);
      if(isSpecial&&!meta){missingCatalog.add(lop);continue;}
      if(!lop||!buoi||![1,2,3,4].includes(tiet)||![10,11,12].includes(khoi)){errors.push(`Dòng ${ri+1}: ${lop||'(trống)'} có Lớp/Khối/Buổi/Tiết không hợp lệ.`);continue;}
      if(meta&&mainClassName(lop)&&Number(meta.khoi)!==nameGrade){errors.push(`Dòng ${ri+1}: ${lop} thuộc Khối ${nameGrade} nhưng danh mục ghi Khối ${meta.khoi}.`);continue;}
      let rowHasSpecial=false;
      for(const dc of dayCols){
        const monRaw=String(r[dc.subjectCol]||'').trim(),teacherRaw=String(r[dc.teacherCol]||'').trim();if(!monRaw)continue;
        total++;if(isSpecial){specialCells++;rowHasSpecial=true;}else mainCells++;
        if(isExternalSubject(monRaw)){excluded++;const k=monRaw.trim();excludedBy[k]=(excludedBy[k]||0)+1;continue;}
        const teacher=cleanTeacher(teacherRaw);if(!teacher){errors.push(`Dòng ${ri+1} · Thứ ${dc.thu}: ${lop} ${buoi} tiết ${tiet} có môn ${monRaw} nhưng thiếu giáo viên.`);continue;}
        const mon=subjectForImport(monRaw),slotKey=`${lop}|${dc.thu}|${buoi}|${tiet}`,exactKey=`${slotKey}|${loose(mon)}|${loose(teacher)}`;
        if(exactSeen.has(exactKey)){duplicateExact++;continue;}exactSeen.add(exactKey);
        const n=(slotCounts.get(slotKey)||0)+1;slotCounts.set(slotKey,n);if(n>1)parallelKeys.add(slotKey);
        out.push({lop,khoi,thu:dc.thu,buoi,tiet,mon,monGoc:monRaw,giaoVien:teacher,isSpecial,loaiLop:String(meta?.loaiLop||'Lớp chính'),nhomHocLienQuan:String(meta?.nhomHocLienQuan||'')});
        if(isSpecial)importedSpecial++;
      }
      if(isSpecial&&rowHasSpecial)scheduledSpecial.add(classKey(lop));
    }
    if(missingCatalog.size)for(const lop of [...missingCatalog].sort((a,b)=>a.localeCompare(b,'vi',{numeric:true})))errors.push(`Lớp nhóm ${lop} chưa có Khối trong file danh mục lớp/khối.`);
    const catalogValues=[...catalog.values()],catalogSpecial=catalogValues.filter(x=>!mainCatalogType(x.loaiLop));
    const missingSpecialSchedule=catalogSpecial.filter(x=>!scheduledSpecial.has(classKey(x.lop))).map(x=>x.lop).sort((a,b)=>a.localeCompare(b,'vi',{numeric:true}));
    return {rows:out,stats:{total,mainCells,specialCells,excluded,imported:out.length,importedMain:out.length-importedSpecial,importedSpecial,excludedBy,errors,parallelSlots:parallelKeys.size,duplicateExact,catalogTotal:catalog.size,catalogSpecial:catalogSpecial.length,scheduledSpecialClasses:scheduledSpecial.size,missingSpecialSchedule,catalogSource:activeCatalogSource()}};
  }

  function renderPreview(){
    const box=$('tkbPreviewV704650');if(!box)return;
    const ex=Object.entries(stats.excludedBy||{}).sort((a,b)=>a[0].localeCompare(b[0],'vi')).map(([k,v])=>`<span class="badge text-bg-light border me-1 mb-1">${esc(k)}: ${Number(v)}</span>`).join('');
    const errs=(stats.errors||[]).slice(0,10).map(x=>`<li>${esc(x)}</li>`).join('');
    const missing=(stats.missingSpecialSchedule||[]).map(x=>`<span class="badge text-bg-warning-subtle border me-1 mb-1">${esc(x)}</span>`).join('');
    box.innerHTML=`
      <div class="row g-2 small mb-2"><div class="col-md-5"><b>TKB:</b> ${esc(scheduleFileName||'')}</div><div class="col-md-4"><b>Danh mục lớp/khối:</b> ${esc(stats.catalogSource||'Chưa có')}</div><div class="col-md-3"><b>Hiệu lực:</b> ${esc(tomorrowIso())}</div></div>
      <div class="d-flex flex-wrap gap-3 small mb-2"><span>Sẽ import: <b>${stats.imported.toLocaleString('vi-VN')}</b></span><span>Lớp chính: <b>${stats.importedMain.toLocaleString('vi-VN')}</b></span><span>BC/CL/Chuyên đề: <b>${stats.importedSpecial.toLocaleString('vi-VN')}</b></span><span>Ô song song/tách nhóm: <b>${stats.parallelSlots.toLocaleString('vi-VN')}</b></span><span>Tự loại ngoài nhà trường: <b>${stats.excluded.toLocaleString('vi-VN')}</b></span><span>Lỗi: <b>${stats.errors.length}</b></span></div>
      <div class="small mb-2"><b>Danh mục:</b> ${stats.catalogTotal} lớp, trong đó ${stats.catalogSpecial} lớp/sổ riêng. Đã tìm thấy lịch cho <b>${stats.scheduledSpecialClasses}/${stats.catalogSpecial}</b> lớp/sổ riêng.</div>
      ${(stats.missingSpecialSchedule||[]).length?`<div class="small mb-2"><b>Có trong danh mục nhưng file TKB chưa có lịch:</b><div class="mt-1">${missing}</div><span class="text-muted">Không tự đoán Thứ/Buổi/Tiết; khi file TKB có dòng của các lớp này hệ thống sẽ import bình thường.</span></div>`:''}
      <div class="small mb-2"><b>Không import:</b><div class="mt-1">${ex||'<span class="text-muted">Không có môn ngoài nhà trường.</span>'}${stats.duplicateExact?`<span class="badge text-bg-light border me-1 mb-1">Trùng hoàn toàn tự bỏ: ${stats.duplicateExact}</span>`:''}</div></div>
      ${errs?`<div class="alert alert-warning py-2 small mb-0"><b>Cần sửa trước khi import:</b><ul class="mb-0 mt-1">${errs}</ul>${stats.errors.length>10?`<div>… còn ${stats.errors.length-10} lỗi.</div>`:''}</div>`:'<div class="alert alert-success py-2 small mb-0">File hợp lệ. TKB sẽ lưu đồng thời lớp chính và sổ riêng BC/CL/Chuyên đề. Các tiết Sổ đầu bài đã ghi vẫn được ưu tiên; GDTC lớp chính đã tách nhóm không tạo thẻ trùng với BC/CL.</div>'}`;
    const btn=$('tkbImportBtnV704650');if(btn)btn.disabled=!parsed.length||stats.errors.length>0;
  }

  function rebuildPreview(){
    if(!scheduleRows.length){resetPreview();return;}
    try{const p=parseRows(scheduleRows,activeCatalog());parsed=p.rows;stats=p.stats;renderPreview();}
    catch(e){parsed=[];stats=emptyStats();const box=$('tkbPreviewV704650');if(box)box.innerHTML=`<div class="alert alert-warning py-2 mb-0">${esc(e?.message||e)}</div>`;const btn=$('tkbImportBtnV704650');if(btn)btn.disabled=true;}
  }

  async function readBook(file){if(!window.XLSX)await ensureXlsxV7();const bytes=new Uint8Array(await file.arrayBuffer());return XLSX.read(bytes,{type:'array',cellDates:false});}

  async function readFile(ev){
    const file=ev?.target?.files?.[0];if(!file){scheduleRows=[];scheduleFileName='';embeddedCatalog=new Map();embeddedCatalogSource='';resetPreview();return;}
    resetPreview('Đang đọc file TKB...');
    try{
      const book=await readBook(file),schedule=findRows(book,isScheduleRows);if(!schedule)throw new Error('Không tìm thấy sheet TKB theo mẫu VietSchool.');
      scheduleRows=schedule.rows;scheduleFileName=file.name;
      const cat=findRows(book,isCatalogRows);embeddedCatalog=new Map();embeddedCatalogSource='';if(cat){const p=parseCatalogRows(cat.rows,`${file.name} / ${cat.name}`);embeddedCatalog=p.map;embeddedCatalogSource=p.source;}
      rebuildPreview();
    }catch(e){scheduleRows=[];scheduleFileName='';resetPreview('Không đọc được file.');if(typeof alertV13==='function')alertV13('❌ '+(e?.message||e));}
  }

  async function readClassMapFile(ev){
    const file=ev?.target?.files?.[0];if(!file){supplementCatalog=new Map();supplementCatalogSource='';rebuildPreview();return;}
    try{
      const book=await readBook(file),cat=findRows(book,isCatalogRows);if(!cat)throw new Error('Không tìm thấy sheet có cột Lớp và Khối.');
      const p=parseCatalogRows(cat.rows,`${file.name} / ${cat.name}`);supplementCatalog=p.map;supplementCatalogSource=p.source;rebuildPreview();
    }catch(e){supplementCatalog=new Map();supplementCatalogSource='';rebuildPreview();if(typeof alertV13==='function')alertV13('❌ '+(e?.message||e));}
  }

  async function importNow(){
    if(!parsed.length||stats.errors.length)return;
    const file=$('tkbFileV704650')?.files?.[0],mapFile=$('tkbClassMapFileV704650')?.files?.[0],btn=$('tkbImportBtnV704650');
    if(!adminDangNhapInfo?.sessionToken){if(typeof alertV13==='function')alertV13('Phiên Admin không hợp lệ.');return;}
    const ok=confirm(`Import ${stats.imported.toLocaleString('vi-VN')} tiết vào TKB?\n- Lớp chính: ${stats.importedMain.toLocaleString('vi-VN')}\n- BC/CL/Chuyên đề: ${stats.importedSpecial.toLocaleString('vi-VN')}\nHiệu lực từ ${tomorrowIso()}.\nCác tiết Sổ đầu bài đã nhập được giữ nguyên.`);if(!ok)return;
    const old=btn?.innerHTML||'';if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Đang import...';}
    try{
      const catalog=[...activeCatalog().values()];
      const res=await callSodbEdgeRpcV67('importTimetableV704650',[{sourceFile:file?.name||'',classMapFile:mapFile?.name||embeddedCatalogSource||'',totalCells:stats.total,excludedCells:stats.excluded,rows:parsed,classCatalog:catalog},{token:adminDangNhapInfo.sessionToken}],45000);
      if(!res?.success)throw new Error(res?.message||'Import TKB thất bại.');
      if(typeof showToastV9==='function')showToastV9(`Đã import ${Number(res.imported||0).toLocaleString('vi-VN')} tiết, gồm ${Number(res.specialImported||0).toLocaleString('vi-VN')} tiết BC/CL/Chuyên đề. Áp dụng từ ${res.effectiveFrom}.`,'success');
      await loadStatus(true);
    }catch(e){if(typeof alertV13==='function')alertV13('❌ '+(e?.message||e));}
    finally{if(btn){btn.disabled=false;btn.innerHTML=old||'Xác nhận import';}}
  }

  async function loadStatus(force=false){
    const mount=$('tkbStatusV704650');if(!mount||!adminDangNhapInfo?.sessionToken)return;if(!force&&mount.dataset.loaded==='1')return;mount.textContent='Đang tải lịch sử TKB...';
    try{
      const res=await callSodbEdgeRpcV67('timetableStatusV704650',[{token:adminDangNhapInfo.sessionToken}],20000);if(!res?.success)throw new Error(res?.message||'Không tải được trạng thái TKB.');
      mount.dataset.loaded='1';const rows=Array.isArray(res.versions)?res.versions:[];
      const active=res.active?`<div class="alert alert-primary py-2 mb-2 small"><b>TKB đang áp dụng:</b> từ ${esc(res.active.effectiveFrom)}${res.active.effectiveTo?` đến ${esc(res.active.effectiveTo)}`:''} · ${Number(res.active.importedCells||0).toLocaleString('vi-VN')} tiết.</div>`:'<div class="alert alert-light border py-2 mb-2 small">Chưa có TKB đang áp dụng.</div>';
      const trs=rows.map(v=>`<tr><td>${esc(v.effectiveFrom)}</td><td>${esc(v.effectiveTo||'Đang mở')}</td><td>${esc(v.sourceFile||'')}</td><td class="text-end">${Number(v.importedCells||0).toLocaleString('vi-VN')}</td><td>${esc(v.importedAt||'')}</td></tr>`).join('');
      mount.innerHTML=active+`<div class="table-responsive"><table class="table table-sm table-bordered mb-0"><thead class="table-light"><tr><th>Từ ngày</th><th>Đến ngày</th><th>File</th><th>Tiết</th><th>Import lúc</th></tr></thead><tbody>${trs||'<tr><td colspan="5" class="text-center text-muted">Chưa có lịch sử.</td></tr>'}</tbody></table></div>`;
    }catch(e){mount.textContent=e?.message||String(e);}
  }

  function init(){
    $('tkbFileV704650')?.addEventListener('change',readFile);
    $('tkbClassMapFileV704650')?.addEventListener('change',readClassMapFile);
    $('tkbImportBtnV704650')?.addEventListener('click',importNow);
    $('tkbRefreshV704650')?.addEventListener('click',()=>loadStatus(true));
    $('admin-teacher-lessons-tab-v704618')?.addEventListener('shown.bs.tab',()=>loadStatus(false));
    resetPreview();
  }
  window.tkbReadFileV704650=readFile;window.tkbReadClassMapV704650=readClassMapFile;window.tkbImportV704650=importNow;window.tkbLoadStatusV704650=loadStatus;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

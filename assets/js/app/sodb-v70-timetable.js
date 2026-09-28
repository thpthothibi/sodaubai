/* V70.4.6.49.6.3.12 - Import TKB VietSchool chính khóa. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const EXTERNAL_KEYS=new Set(['stem','avbn','kns','tanc','thqt','tinhocquocte']);
  let parsed=[];
  let stats={total:0,excluded:0,imported:0,excludedBy:{},errors:[]};

  function esc(v){return typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function loose(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();}
  function cleanTeacher(v){return String(v??'').replace(/\s*\(\s*\d+\s*\)\s*$/,'').replace(/\s+/g,' ').trim();}
  function normalizeSession(v){const k=loose(v);if(k==='sang')return 'SANG';if(k==='chieu')return 'CHIEU';return '';}
  function isExternalSubject(v){return EXTERNAL_KEYS.has(loose(v));}
  function tomorrowIso(){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  function dayNumber(v){const m=String(v||'').match(/(?:thứ|thu)\s*([2-7])/i);return m?Number(m[1]):0;}
  function subjectForImport(v){const raw=String(v||'').trim();if(!raw)return '';try{return typeof canonicalSubjectV6955==='function'?canonicalSubjectV6955(raw):raw;}catch(_e){return raw;}}

  function resetPreview(msg='Chưa chọn file TKB.'){
    parsed=[];stats={total:0,excluded:0,imported:0,excludedBy:{},errors:[]};
    const p=$('tkbPreviewV704650');if(p)p.innerHTML=`<div class="text-muted small">${esc(msg)}</div>`;
    const b=$('tkbImportBtnV704650');if(b)b.disabled=true;
  }

  function parseRows(rows){
    const h1=Array.isArray(rows?.[0])?rows[0]:[],h2=Array.isArray(rows?.[1])?rows[1]:[];
    const first4=[h1[0],h1[1],h1[2],h1[3]].map(loose);
    if(!(first4[1].includes('lop')&&first4[2].includes('mabuoihoc')&&first4[3].includes('tiethoc')))throw new Error('Không đúng mẫu VietSchool: thiếu các cột Lớp / Mã buổi học / Tiết học.');
    // Mẫu VietSchool dùng header Thứ 2...Thứ 7 dạng ô gộp 2 cột.
    // SheetJS có thể biểu diễn ô gộp khác nhau tùy file .xls/.xlsx, vì vậy nhận cặp cột
    // theo dòng 2 (Môn học | Giáo viên) thay vì phụ thuộc vị trí nhãn Thứ ở dòng 1.
    const dayCols=[];
    for(let c=4;c+1<Math.max(h1.length,h2.length);c+=2){
      const subKey=loose(h2[c]),teacherKey=loose(h2[c+1]);
      if(!subKey.includes('monhoc')||!teacherKey.includes('giaovien'))continue;
      dayCols.push({thu:2+dayCols.length,subjectCol:c,teacherCol:c+1});
    }
    if(dayCols.length!==6)throw new Error('Không đúng mẫu VietSchool: phải có đủ 6 cặp cột Môn học/Giáo viên từ Thứ 2 đến Thứ 7.');
    const out=[],seen=new Set(),excludedBy={},errors=[];let total=0,excluded=0;
    for(let ri=2;ri<(rows||[]).length;ri++){
      const r=rows[ri]||[],lop=String(r[1]||'').trim(),buoi=normalizeSession(r[2]),tiet=Number(r[3]||0),khoi=Number(String(lop).match(/^(10|11|12)/)?.[1]||0);
      if(!lop&&!buoi&&!tiet)continue;
      if(!lop||!buoi||![1,2,3,4].includes(tiet)||![10,11,12].includes(khoi)){errors.push(`Dòng ${ri+1}: Lớp/Buổi/Tiết không hợp lệ.`);continue;}
      for(const dc of dayCols){
        const monRaw=String(r[dc.subjectCol]||'').trim(),teacherRaw=String(r[dc.teacherCol]||'').trim();
        if(!monRaw)continue;total++;
        if(isExternalSubject(monRaw)){
          excluded++;const k=monRaw.trim();excludedBy[k]=(excludedBy[k]||0)+1;continue;
        }
        const teacher=cleanTeacher(teacherRaw);
        if(!teacher){errors.push(`Dòng ${ri+1} · Thứ ${dc.thu}: ${lop} ${buoi} tiết ${tiet} có môn ${monRaw} nhưng thiếu giáo viên.`);continue;}
        const key=`${lop}|${dc.thu}|${buoi}|${tiet}`;
        if(seen.has(key)){errors.push(`Trùng ô ${lop} · Thứ ${dc.thu} · ${buoi} · Tiết ${tiet}.`);continue;}
        seen.add(key);
        out.push({lop,khoi,thu:dc.thu,buoi,tiet,mon:subjectForImport(monRaw),monGoc:monRaw,giaoVien:teacher});
      }
    }
    return {rows:out,stats:{total,excluded,imported:out.length,excludedBy,errors}};
  }

  function renderPreview(fileName){
    const box=$('tkbPreviewV704650');if(!box)return;
    const ex=Object.entries(stats.excludedBy||{}).sort((a,b)=>a[0].localeCompare(b[0],'vi')).map(([k,v])=>`<span class="badge text-bg-light border me-1 mb-1">${esc(k)}: ${Number(v)}</span>`).join('');
    const errs=(stats.errors||[]).slice(0,8).map(x=>`<li>${esc(x)}</li>`).join('');
    box.innerHTML=`
      <div class="row g-2 small mb-2">
        <div class="col-md-5"><b>File:</b> ${esc(fileName||'')}</div>
        <div class="col-md-3"><b>Hiệu lực:</b> ${esc(tomorrowIso())}</div>
        <div class="col-md-4"><b>Tiết chính khóa sẽ import:</b> ${stats.imported.toLocaleString('vi-VN')}</div>
      </div>
      <div class="d-flex flex-wrap gap-3 small mb-2"><span>Tổng ô môn: <b>${stats.total.toLocaleString('vi-VN')}</b></span><span>Tự loại ngoài nhà trường: <b>${stats.excluded.toLocaleString('vi-VN')}</b></span><span>Lỗi/cảnh báo: <b>${stats.errors.length}</b></span></div>
      <div class="small mb-2"><b>Không import:</b><div class="mt-1">${ex||'<span class="text-muted">Không có.</span>'}</div></div>
      ${errs?`<div class="alert alert-warning py-2 small mb-0"><b>Cần kiểm tra:</b><ul class="mb-0 mt-1">${errs}</ul>${stats.errors.length>8?`<div>… còn ${stats.errors.length-8} cảnh báo.</div>`:''}</div>`:'<div class="alert alert-success py-2 small mb-0">File hợp lệ. TKB mới chỉ có hiệu lực từ ngày mai; Sổ đầu bài đã nhập không bị sửa.</div>'}`;
    const btn=$('tkbImportBtnV704650');if(btn)btn.disabled=!parsed.length||stats.errors.length>0;
  }

  async function readFile(ev){
    const input=ev?.target,file=input?.files?.[0];if(!file){resetPreview();return;}
    resetPreview('Đang đọc file...');
    try{
      if(!window.XLSX)await ensureXlsxV7();
      const bytes=new Uint8Array(await file.arrayBuffer()),wb=XLSX.read(bytes,{type:'array',cellDates:false}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false,blankrows:true});
      const p=parseRows(rows);parsed=p.rows;stats=p.stats;renderPreview(file.name);
    }catch(e){resetPreview('Không đọc được file.');if(typeof alertV13==='function')alertV13('❌ '+(e?.message||e));}
  }

  async function importNow(){
    if(!parsed.length||stats.errors.length)return;
    const file=$('tkbFileV704650')?.files?.[0],btn=$('tkbImportBtnV704650');
    if(!adminDangNhapInfo?.sessionToken){if(typeof alertV13==='function')alertV13('Phiên Admin không hợp lệ.');return;}
    const ok=confirm(`Import ${stats.imported.toLocaleString('vi-VN')} tiết chính khóa?\nTKB mới áp dụng từ ${tomorrowIso()}.\nCác tiết Sổ đầu bài đã nhập được giữ nguyên.`);if(!ok)return;
    const old=btn?.innerHTML||'';if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Đang import...';}
    try{
      const res=await callSodbEdgeRpcV67('importTimetableV704650',[{sourceFile:file?.name||'',totalCells:stats.total,excludedCells:stats.excluded,rows:parsed},{token:adminDangNhapInfo.sessionToken}],45000);
      if(!res?.success)throw new Error(res?.message||'Import TKB thất bại.');
      if(typeof showToastV9==='function')showToastV9(`Đã import ${Number(res.imported||0).toLocaleString('vi-VN')} tiết. Áp dụng từ ${res.effectiveFrom}.`,'success');
      await loadStatus(true);
    }catch(e){if(typeof alertV13==='function')alertV13('❌ '+(e?.message||e));}
    finally{if(btn){btn.disabled=false;btn.innerHTML=old||'Xác nhận import';}}
  }

  async function loadStatus(force=false){
    const mount=$('tkbStatusV704650');if(!mount||!adminDangNhapInfo?.sessionToken)return;
    if(!force&&mount.dataset.loaded==='1')return;mount.textContent='Đang tải lịch sử TKB...';
    try{
      const res=await callSodbEdgeRpcV67('timetableStatusV704650',[{token:adminDangNhapInfo.sessionToken}],20000);if(!res?.success)throw new Error(res?.message||'Không tải được trạng thái TKB.');
      mount.dataset.loaded='1';const rows=Array.isArray(res.versions)?res.versions:[];
      const active=res.active?`<div class="alert alert-primary py-2 mb-2 small"><b>TKB đang áp dụng:</b> từ ${esc(res.active.effectiveFrom)}${res.active.effectiveTo?` đến ${esc(res.active.effectiveTo)}`:''} · ${Number(res.active.importedCells||0).toLocaleString('vi-VN')} tiết.</div>`:'<div class="alert alert-light border py-2 mb-2 small">Chưa có TKB chính khóa đang áp dụng.</div>';
      const trs=rows.map(v=>`<tr><td>${esc(v.effectiveFrom)}</td><td>${esc(v.effectiveTo||'Đang mở')}</td><td>${esc(v.sourceFile||'')}</td><td class="text-end">${Number(v.importedCells||0).toLocaleString('vi-VN')}</td><td>${esc(v.importedAt||'')}</td></tr>`).join('');
      mount.innerHTML=active+`<div class="table-responsive"><table class="table table-sm table-bordered mb-0"><thead class="table-light"><tr><th>Từ ngày</th><th>Đến ngày</th><th>File</th><th>Tiết</th><th>Import lúc</th></tr></thead><tbody>${trs||'<tr><td colspan="5" class="text-center text-muted">Chưa có lịch sử.</td></tr>'}</tbody></table></div>`;
    }catch(e){mount.textContent=e?.message||String(e);}
  }

  function init(){
    $('tkbFileV704650')?.addEventListener('change',readFile);
    $('tkbImportBtnV704650')?.addEventListener('click',importNow);
    $('tkbRefreshV704650')?.addEventListener('click',()=>loadStatus(true));
    $('admin-teacher-lessons-tab-v704618')?.addEventListener('shown.bs.tab',()=>loadStatus(false));
    resetPreview();
  }
  window.tkbReadFileV704650=readFile;window.tkbImportV704650=importNow;window.tkbLoadStatusV704650=loadStatus;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

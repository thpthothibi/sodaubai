/* SODB V70.0 — SCHOOL YEAR LIFECYCLE */
let schoolYearLifecycleStateV700=null;
let schoolYearPreflightV700=null;

function getAdminAuthV700(){
  try{if(typeof getAdminAuthV69==='function')return getAdminAuthV69();}catch(_e){}
  const token=(window.adminDangNhapInfo&&adminDangNhapInfo.sessionToken)||(window.currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions&&currentUnifiedLoginV4.sessions.ADMIN&&currentUnifiedLoginV4.sessions.ADMIN.sessionToken)||'';
  return {token};
}
function v700Esc(v){try{return escapeHtml(String(v??''));}catch(_e){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}}
function v700Num(v){return Number(v||0).toLocaleString('vi-VN');}
function v700StatusBadge(s){const x=String(s||'').toUpperCase();if(x==='ACTIVE')return '<span class="badge text-bg-success">Đang hoạt động</span>';if(x==='ARCHIVED')return '<span class="badge text-bg-secondary">Archive chỉ đọc</span>';return '<span class="badge text-bg-warning">Bản nháp</span>';}
function v700NextYear(y){const m=String(y||'').match(/^(\d{4})-(\d{4})$/);if(!m)return '';const a=Number(m[1]),b=Number(m[2]);return b===a+1?`${b}-${b+1}`:'';}
function v700DefaultWeek1(next){const m=String(next||'').match(/^(\d{4})-/);if(!m)return '';const year=Number(m[1]);const d=new Date(year,7,17);const day=d.getDay();const diff=(day===0?-6:1-day);d.setDate(d.getDate()+diff);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

function renderSchoolYearLifecycleV700(res){
  schoolYearLifecycleStateV700=res||null;
  const current=String(res?.currentYear||''), next=String(res?.nextSuggested||v700NextYear(current));
  const c=document.getElementById('schoolYearCurrentV700');if(c)c.textContent=current||'—';
  const w=document.getElementById('schoolYearWeek1V700');if(w)w.textContent=String(res?.week1Start||'—');
  const n=document.getElementById('schoolYearNextV700');if(n&&!n.value)n.value=next;
  const nw=document.getElementById('schoolYearNextWeek1V700');if(nw&&!nw.value)nw.value=v700DefaultWeek1(next);
  const confirm=document.getElementById('schoolYearConfirmV700');if(confirm)confirm.placeholder=`Nhập ${current} để xác nhận`;
  renderSchoolYearPreflightV700(res?.preflight||{});
  const years=res?.years||[];
  const body=document.getElementById('schoolYearHistoryBodyV700');
  if(body){body.innerHTML=years.length?years.map(y=>`<tr><td class="fw-semibold">${v700Esc(y.schoolYear)}</td><td>${v700StatusBadge(y.status)}</td><td>${v700Esc(y.week1Start||'')}</td><td>${v700Esc(y.copiedFrom||'')}</td><td>${v700Esc(y.archivedAt||'')}</td><td class="small">${v700Esc(y.archivedBy||'')}</td><td class="small">${v700Esc(y.note||'')}</td></tr>`).join(''):'<tr><td colspan="7" class="text-center text-muted py-3">Chưa có lịch sử năm học.</td></tr>';}
  const sel=document.getElementById('archiveYearSelectV700');
  if(sel){const old=sel.value;sel.innerHTML='<option value="">-- Chọn năm đã archive --</option>'+years.filter(y=>String(y.status)==='ARCHIVED').map(y=>`<option value="${v700Esc(y.schoolYear)}">${v700Esc(y.schoolYear)}</option>`).join('');if([...sel.options].some(o=>o.value===old))sel.value=old;}
  const status=document.getElementById('schoolYearLifecycleStatusV700');if(status)status.textContent=`V70 đang quản lý năm học ${current}. Hồ sơ giáo viên/tài khoản/chữ ký/quyền được giữ toàn cục; KHBD không chuyển sang năm mới.`;
}

function renderSchoolYearPreflightV700(pf){
  schoolYearPreflightV700=pf||null;
  const m=pf?.metrics||{}, box=document.getElementById('schoolYearPreflightSummaryV700');
  if(box){const cards=[['Bản ghi SĐB',m.sodbRows],['Chưa chốt',m.unclosedClassWeeks],['Chưa BGH duyệt',m.unapprovedClassWeeks],['Điều hành tồn',m.pendingOperations],['Yêu cầu sửa',m.pendingEdits],['Mở khóa đang hiệu lực',m.activeUnlocks]];box.innerHTML=cards.map(([a,b])=>`<div class="col-6 col-lg-2"><div class="border rounded p-2 h-100 bg-light"><div class="small text-muted">${v700Esc(a)}</div><div class="fs-5 fw-bold">${v700Num(b)}</div></div></div>`).join('');}
  const list=document.getElementById('schoolYearPreflightListV700');if(list){const blockers=pf?.blockers||[],warnings=pf?.warnings||[];list.innerHTML=[...blockers.map(x=>`<div class="alert alert-danger py-2 mb-2"><b>Chặn đóng năm:</b> ${v700Esc(x.message||x.code)}</div>`),...warnings.map(x=>`<div class="alert alert-warning py-2 mb-2"><b>Cảnh báo:</b> ${v700Esc(x.message||x.code)}</div>`)].join('')||'<div class="alert alert-success py-2 mb-2"><b>Đạt điều kiện:</b> không còn mục chặn đóng năm học.</div>';}
  const btn=document.getElementById('btnTransitionSchoolYearV700');if(btn)btn.disabled=pf?.canClose!==true;
  const status=document.getElementById('schoolYearPreflightStatusV700');if(status)status.textContent=pf?.canClose===true?'Có thể đóng năm sau khi xác nhận thông tin năm mới.':'Chưa thể đóng năm. Cần xử lý hết các mục chặn ở trên.';
}

function loadSchoolYearLifecycleV700(force){
  if(!hasRoleV4('ADMIN'))return;
  const status=document.getElementById('schoolYearLifecycleStatusV700');if(status)status.textContent='Đang tải vòng đời năm học...';
  google.script.run.withSuccessHandler(function(res){
    if(!res||!res.success){if(status)status.textContent='Không tải được: '+(res?.message||'Lỗi');return;}renderSchoolYearLifecycleV700(res);
  }).withFailureHandler(function(err){if(status)status.textContent='Lỗi: '+((err&&err.message)||String(err||''));}).layVongDoiNamHocV700(getAdminAuthV700());
}

function preflightSchoolYearV700(){
  const current=String(schoolYearLifecycleStateV700?.currentYear||'');
  const st=document.getElementById('schoolYearPreflightStatusV700');if(st)st.textContent='Đang kiểm tra điều kiện đóng năm...';
  google.script.run.withSuccessHandler(function(res){if(!res||!res.success){if(st)st.textContent=res?.message||'Không kiểm tra được.';return;}renderSchoolYearPreflightV700(res);}).withFailureHandler(function(err){if(st)st.textContent=(err&&err.message)||String(err||'Lỗi');}).kiemTraDongNamHocV700(current,getAdminAuthV700());
}

async function transitionSchoolYearV700(){
  const current=String(schoolYearLifecycleStateV700?.currentYear||'').trim();
  const next=String(document.getElementById('schoolYearNextV700')?.value||'').trim();
  const week1=String(document.getElementById('schoolYearNextWeek1V700')?.value||'').trim();
  const confirmText=String(document.getElementById('schoolYearConfirmV700')?.value||'').trim();
  const copyClasses=!!document.getElementById('copyClassesV700')?.checked;
  const copyAssignments=!!document.getElementById('copyAssignmentsV700')?.checked;
  const copyGvcn=!!document.getElementById('copyGvcnV700')?.checked;
  const copyTeams=!!document.getElementById('copyTeamsV700')?.checked;
  if(next!==v700NextYear(current)){showToastV9(`Năm học mới phải là ${v700NextYear(current)}.`,'danger');return;}
  if(!week1){showToastV9('Vui lòng chọn ngày bắt đầu Tuần 1.','danger');return;}
  if(confirmText!==current){showToastV9(`Hãy nhập chính xác ${current} vào ô xác nhận.`,'danger');return;}
  if((copyAssignments||copyGvcn)&&!copyClasses){showToastV9('Muốn chuyển Phân công/GVCN phải chuyển Danh mục lớp.','danger');return;}
  if(!schoolYearPreflightV700?.canClose){showToastV9('Preflight chưa đạt. Hãy kiểm tra lại trước khi đóng năm.','danger');return;}
  const ok=await confirmV13(`Đóng năm ${current} sẽ archive dữ liệu chỉ đọc, snapshot KHBD/dữ liệu gốc, xóa KHBD làm việc hiện hành và kích hoạt ${next}. Tất cả tài khoản sẽ phải đăng nhập lại.`,{title:'Xác nhận chuyển năm học V70',confirmText:`Đóng ${current} và tạo ${next}`,danger:true});
  if(!ok)return;
  setBusyV13(true,'Đang archive và tạo năm học mới...');
  const payload={nextSchoolYear:next,week1Start:week1,confirmCurrentYear:confirmText,copyClasses,copyAssignments,copyGvcn,copyTeams};
  google.script.run.withSuccessHandler(function(res){
    setBusyV13(false);
    const st=document.getElementById('schoolYearLifecycleStatusV700');
    if(!res||!res.success){if(st)st.textContent='❌ '+(res?.message||'Không chuyển được năm học.');if(res?.preflight)renderSchoolYearPreflightV700(res.preflight);return;}
    if(st)st.innerHTML=`<span class="text-success fw-bold">Đã archive ${v700Esc(current)} và kích hoạt ${v700Esc(next)}.</span> Tất cả phiên cũ đã bị thu hồi; hãy đăng nhập lại.`;
    try{sessionStorage.clear();localStorage.removeItem('SODB_V6_BOOTSTRAP');}catch(_e){}
    showToastV9(`Đã tạo năm học ${next}. Hệ thống yêu cầu đăng nhập lại.`,'success');
    const b=document.getElementById('btnTransitionSchoolYearV700');if(b)b.disabled=true;
  }).withFailureHandler(function(err){setBusyV13(false);showToastV9((err&&err.message)||String(err||'Lỗi'),'danger');}).dongNamHocTaoNamMoiV700(payload,getAdminAuthV700());
}


let archivePageV702=1;
let archivePageSizeV702=50;
let archiveLastResultV702=null;

function archiveFilterV702(page){
  const year=String(document.getElementById('archiveYearSelectV700')?.value||'').trim();
  const lop=String(document.getElementById('archiveClassV700')?.value||'').trim();
  const tuan=Number(document.getElementById('archiveWeekV700')?.value||0);
  const pageSize=Math.max(25,Math.min(100,Number(document.getElementById('archivePageSizeV702')?.value||archivePageSizeV702||50)));
  return {schoolYear:year,lop,tuan,page:Math.max(1,Number(page||archivePageV702||1)),pageSize};
}
function archiveSetPrintEnabledV702(){
  const btn=document.getElementById('btnArchivePrintV702');if(!btn)return;
  const f=archiveFilterV702(1);btn.disabled=!(f.schoolYear&&f.lop&&f.tuan>0);
  btn.title=btn.disabled?'Chọn Năm học + Lớp + Tuần để in hồ sơ lưu trữ':'In hồ sơ lớp/tuần đã chọn';
}
function archiveChangeFilterV702(){archivePageV702=1;archiveSetPrintEnabledV702();}
function archiveChangePageSizeV702(){archivePageSizeV702=Number(document.getElementById('archivePageSizeV702')?.value||50);archivePageV702=1;loadArchiveSchoolYearV702(1);}
function archiveGoPageV702(delta){const pg=archiveLastResultV702?.pagination||{};let next=Math.max(1,Number(pg.page||archivePageV702||1)+Number(delta||0));if(pg.totalPages)next=Math.min(Number(pg.totalPages),next);if(next===Number(pg.page||1))return;loadArchiveSchoolYearV702(next);}

function renderArchiveRowsV702(rows,year){
  const body=document.getElementById('archiveRowsBodyV700');if(!body)return;
  if(!rows?.length){body.innerHTML='<tr><td colspan="11" class="text-center text-muted py-3">Không có dữ liệu trong phạm vi chọn.</td></tr>';return;}
  body.innerHTML=rows.map(r=>`<tr>
    <td>${v700Esc(r.lop)}</td><td>${v700Esc(r.tuan)}</td><td>${v700Esc(r.ngay)}</td><td>${v700Esc(r.buoi)} T${v700Esc(r.tiet)}</td>
    <td>${v700Esc(r.mon)}</td><td>${v700Esc(r.tietCT)}</td><td class="text-start">${v700Esc(r.hsVang||'')}</td><td class="text-start">${v700Esc(r.bai)}</td>
    <td>${v700Esc(r.giaoVien)}</td><td class="text-start">${v700Esc(r.nhanXet)}</td>
    <td class="text-center">${r.hasSignature?`<button type="button" class="btn btn-outline-primary btn-sm py-0 px-2" onclick="viewArchiveSignatureV702('${v700Esc(r.recordId)}','${v700Esc(year)}')">Xem</button>`:'<span class="text-muted">—</span>'}</td>
  </tr>`).join('');
}
function renderArchivePagerV702(res){
  const pg=res?.pagination||{};archivePageV702=Number(pg.page||1);archivePageSizeV702=Number(pg.pageSize||50);
  const info=document.getElementById('archivePageInfoV702');if(info)info.textContent=Number(pg.total||0)?`Dòng ${v700Num(pg.from)}–${v700Num(pg.to)} / ${v700Num(pg.total)} · Trang ${v700Num(pg.page)}/${v700Num(pg.totalPages)}`:'0 dòng';
  const prev=document.getElementById('archivePrevV702');if(prev)prev.disabled=!pg.hasPrev;
  const next=document.getElementById('archiveNextV702');if(next)next.disabled=!pg.hasNext;
  const size=document.getElementById('archivePageSizeV702');if(size)size.value=String(pg.pageSize||50);
}
function loadArchiveSchoolYearV700(){return loadArchiveSchoolYearV702(1);}
function loadArchiveSchoolYearV702(page){
  const f=archiveFilterV702(page),status=document.getElementById('archiveStatusV700'),body=document.getElementById('archiveRowsBodyV700');
  if(!f.schoolYear){if(status)status.textContent='Chọn một năm học đã archive.';return;}
  archivePageV702=f.page;archiveSetPrintEnabledV702();
  if(status)status.textContent='Đang tải dữ liệu lưu trữ chỉ đọc...';if(body)body.innerHTML='<tr><td colspan="11" class="text-center text-muted py-3">Đang tải...</td></tr>';
  google.script.run.withSuccessHandler(function(res){
    if(!res||!res.success){if(status)status.textContent=res?.message||'Không tải được lưu trữ.';return;}
    archiveLastResultV702=res;
    const pg=res.pagination||{};
    if(status)status.textContent=`${res.schoolYear} · Archive chỉ đọc · ${v700Num(pg.total||0)} bản ghi${res.archivedAt?' · Đóng '+res.archivedAt:''}.`;
    const cls=document.getElementById('archiveClassV700');if(cls){const old=cls.value;cls.innerHTML='<option value="">Tất cả lớp</option>'+(res.classes||[]).map(x=>`<option value="${v700Esc(x)}">${v700Esc(x)}</option>`).join('');if([...cls.options].some(o=>o.value===old))cls.value=old;}
    renderArchiveRowsV702(res.data||[],res.schoolYear);renderArchivePagerV702(res);archiveSetPrintEnabledV702();
  }).withFailureHandler(function(err){if(status)status.textContent=(err&&err.message)||String(err||'Lỗi');}).layLuuTruNamHocV702(f,getAdminAuthV700());
}

function viewArchiveSignatureV702(recordId,year){
  const modalEl=document.getElementById('modalChuKySoDetail');
  const name=document.getElementById('certTenGV'),email=document.getElementById('certEmail'),time=document.getElementById('certThoiGianKy'),img=document.getElementById('certSigImage');
  if(name)name.textContent='Đang tải...';if(email)email.textContent='Hồ sơ lưu trữ';if(time)time.textContent='—';if(img){img.classList.add('d-none');img.removeAttribute('src');}
  if(window.bootstrap&&bootstrap.Modal&&modalEl)bootstrap.Modal.getOrCreateInstance(modalEl).show();
  google.script.run.withSuccessHandler(function(res){
    if(!res||!res.success){if(name)name.textContent=res?.message||'Không tải được chữ ký';return;}
    if(name)name.textContent=res.tenGV||'---';if(email)email.textContent='—';if(time)time.textContent=res.thoiGianKy||'Đã xác thực';
    if(img&&res.urlChuKy){img.src=normalizeSignatureUrlV67_1(res.urlChuKy);img.classList.remove('d-none');}else if(name)name.textContent=(res.tenGV||'---')+' — không có ảnh chữ ký';
  }).withFailureHandler(function(err){if(name)name.textContent=(err&&err.message)||String(err||'Lỗi');}).layChuKyLuuTruV702({schoolYear:year,recordId},getAdminAuthV700());
}
function v702NormBuoi(v){const x=String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return x.includes('chi')?'Chieu':'Sang';}
function v702SigHtml(url,name,cls){return url?`<div class="sig"><img src="${v700Esc(normalizeSignatureUrlV67_1(url))}" alt="Chữ ký"><div>${v700Esc(name||'')}</div></div>`:`<div class="sig"><div class="nosig">Chưa có chữ ký</div><div>${v700Esc(name||'')}</div></div>`;}
function v702BuildArchivePrintHtml(res){
  const rows=res.rows||[],by=new Map();
  rows.forEach(r=>{const key=`${String(r.thu||'')}|${v702NormBuoi(r.buoi)}|${Number(r.tiet||0)}`;const a=by.get(key)||[];a.push(r);by.set(key,a);});
  const days=['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];let body='';
  days.forEach((day,di)=>{for(let i=0;i<10;i++){const buoi=i<5?'Sang':'Chieu',tiet=i<5?i+1:i-4,a=by.get(`${day}|${buoi}|${tiet}`)||[];
    const join=(field,sep='<br>')=>a.map(x=>v700Esc(teachingFieldV704649(x,field))).filter(Boolean).join(sep);
    const sig=a.map(x=>v702SigHtml(x.signatureUrl,x.giaoVien,'')).join('');
    body+=`<tr>${i===0?`<td rowspan="10" class="day">${v700Esc(day)}</td>`:''}<td>${buoi==='Sang'?'S':'C'}-${tiet}</td><td>${join('mon')}</td><td>${join('tietCT')}</td><td>${join('hsVang')}</td><td class="left">${join('bai')}</td><td class="left">${join('nhanXet')}</td><td>${join('hocTap')}</td><td>${join('kyLuat')}</td><td>${join('veSinh')}</td><td>${join('diemTB')}</td><td>${sig}</td></tr>`;
  }});
  const gvcn=res.chot||{},bgh=res.bgh||{},gvcnUrl=String(gvcn.chuKyGVCN||'').replace(/^IMAGE:/i,''),bghUrl=String(bgh.chuKyBGH||'').replace(/^IMAGE:/i,'');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Hồ sơ lưu trữ ${v700Esc(res.lop)} - Tuần ${v700Esc(res.tuan)}</title><style>
  @page{size:A3 landscape;margin:7mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0}.tools{margin:0 0 8px;text-align:right}.tools button{padding:7px 18px;font-weight:700}.head{text-align:center;line-height:1.2;margin-bottom:5px}.head h1{font-size:17px;margin:2px}.head div{font-size:11px}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:8px}th,td{border:1px solid #222;padding:2px;text-align:center;vertical-align:middle;overflow-wrap:anywhere}th{background:#eee;font-size:8px}.left{text-align:left}.day{font-weight:700;width:5%}.sig img{max-height:22px;max-width:75px;display:block;margin:auto}.sig div{font-size:6.5px}.nosig{color:#777}.footer{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:8px;margin-top:5px;font-size:9px}.box{border:1px solid #777;min-height:70px;padding:4px}.sign{text-align:center}.sign img{max-height:42px;max-width:130px;display:block;margin:2px auto}.archive{font-size:8px;color:#555}@media print{.tools{display:none}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body><div class="tools"><button onclick="window.print()">In A3</button></div><div class="head"><div>TRƯỜNG THPT HỒ THỊ BI</div><h1>SỔ ĐẦU BÀI — HỒ SƠ LƯU TRỮ</h1><div>Lớp: <b>${v700Esc(res.lop)}</b> · Tuần: <b>${v700Esc(res.tuan)}</b> · Năm học: <b>${v700Esc(res.schoolYear)}</b></div><div class="archive">Archive chỉ đọc · Đóng năm: ${v700Esc(res.archivedAt||'')}</div></div>
  <table><thead><tr><th style="width:5%">Thứ</th><th style="width:4%">Tiết</th><th style="width:6%">Môn</th><th style="width:4%">PPCT</th><th style="width:6%">HS vắng</th><th style="width:25%">Tên bài học</th><th style="width:20%">Nhận xét</th><th style="width:3%">HT</th><th style="width:3%">KL</th><th style="width:3%">VS</th><th style="width:4%">ĐTB</th><th style="width:17%">Chữ ký & họ tên GV</th></tr></thead><tbody>${body}</tbody></table>
  <div class="footer"><div class="box"><b>Tổng kết tuần:</b> ${v700Esc(res.summary?.rows||0)} bản ghi · Tổng lượt vắng: ${v700Esc(res.summary?.absent||0)} · ĐTB: ${v700Esc(res.summary?.avg||0)} · Chưa có ảnh chữ ký: ${v700Esc(res.summary?.missingSignatures||0)}<br><b>Ý kiến GVCN/GV phụ trách:</b> ${v700Esc(gvcn.ykien||'')}</div><div class="box sign"><b>GVCN / GV PHỤ TRÁCH</b>${gvcnUrl?`<img src="${v700Esc(normalizeSignatureUrlV67_1(gvcnUrl))}">`:'<div class="nosig">Chưa có ảnh chữ ký</div>'}<div><b>${v700Esc(gvcn.tenGVCN||'')}</b></div></div><div class="box sign" style="position:relative"><b>BAN GIÁM HIỆU</b>${stampHtmlV704649(bgh)}${bghUrl?`<img src="${v700Esc(normalizeSignatureUrlV67_1(bghUrl))}">`:'<div class="nosig">Chưa có ảnh chữ ký</div>'}<div><b>${v700Esc(bgh.tenBGH||'')}</b></div></div></div></body></html>`;
}
function printArchiveWeekV702(){
  const f=archiveFilterV702(1);if(!f.schoolYear||!f.lop||!f.tuan){showToastV9('Chọn đầy đủ Năm học, Lớp và Tuần để in hồ sơ lưu trữ.','warning');return;}
  const w=window.open('','_blank');if(!w){showToastV9('Trình duyệt đang chặn cửa sổ in. Hãy cho phép pop-up rồi thử lại.','warning');return;}w.document.write('<div style="font-family:Arial;padding:30px">Đang chuẩn bị hồ sơ lưu trữ và chữ ký...</div>');
  google.script.run.withSuccessHandler(function(res){if(!res||!res.success){w.document.body.innerHTML='<p style="font-family:Arial;color:#b00">'+v700Esc(res?.message||'Không tải được hồ sơ lưu trữ.')+'</p>';return;}w.document.open();w.document.write(v702BuildArchivePrintHtml(res));w.document.close();}).withFailureHandler(function(err){w.document.body.innerHTML='<p style="font-family:Arial;color:#b00">'+v700Esc((err&&err.message)||String(err||'Lỗi'))+'</p>';}).layHoSoInLuuTruV702({schoolYear:f.schoolYear,lop:f.lop,tuan:f.tuan},getAdminAuthV700());
}

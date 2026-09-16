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

function loadArchiveSchoolYearV700(){
  const year=String(document.getElementById('archiveYearSelectV700')?.value||'').trim(),lop=String(document.getElementById('archiveClassV700')?.value||'').trim(),tuan=Number(document.getElementById('archiveWeekV700')?.value||0);
  const status=document.getElementById('archiveStatusV700'),body=document.getElementById('archiveRowsBodyV700');
  if(!year){if(status)status.textContent='Chọn một năm học đã archive.';return;}
  if(status)status.textContent='Đang tải dữ liệu lưu trữ chỉ đọc...';if(body)body.innerHTML='<tr><td colspan="9" class="text-center text-muted py-3">Đang tải...</td></tr>';
  google.script.run.withSuccessHandler(function(res){
    if(!res||!res.success){if(status)status.textContent=res?.message||'Không tải được lưu trữ.';return;}
    if(status)status.textContent=`${res.schoolYear} · Archive chỉ đọc · ${v700Num(res.data?.length)} dòng đang hiển thị${res.archivedAt?' · Đóng '+res.archivedAt:''}.`;
    const cls=document.getElementById('archiveClassV700');if(cls){const old=cls.value;cls.innerHTML='<option value="">Tất cả lớp</option>'+(res.classes||[]).map(x=>`<option value="${v700Esc(x)}">${v700Esc(x)}</option>`).join('');if([...cls.options].some(o=>o.value===old))cls.value=old;}
    if(body){const rows=res.data||[];body.innerHTML=rows.length?rows.map(r=>`<tr><td>${v700Esc(r.lop)}</td><td>${v700Esc(r.tuan)}</td><td>${v700Esc(r.ngay)}</td><td>${v700Esc(r.buoi)} T${v700Esc(r.tiet)}</td><td>${v700Esc(r.mon)}</td><td>${v700Esc(r.tietCT)}</td><td>${v700Esc(r.bai)}</td><td>${v700Esc(r.giaoVien)}</td><td>${v700Esc(r.nhanXet)}</td></tr>`).join(''):'<tr><td colspan="9" class="text-center text-muted py-3">Không có dữ liệu trong phạm vi chọn.</td></tr>';}
  }).withFailureHandler(function(err){if(status)status.textContent=(err&&err.message)||String(err||'Lỗi');}).layLuuTruNamHocV700({schoolYear:year,lop,tuan,limit:500},getAdminAuthV700());
}

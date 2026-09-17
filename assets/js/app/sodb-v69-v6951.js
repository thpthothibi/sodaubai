/* SODB V70.1.3 - Điểm danh thống nhất lớp chính khóa + Chuyên đề + GDTC
 * - GDTC là lớp/nhóm độc lập (BC1, CL2...), không ghép nhiều lớp trong một SĐB.
 * - Điểm danh theo thành viên nhóm, giữ lớp chủ nhiệm để chiếu báo cáo.
 * - Một bản ghi SĐB/ma_tiet_tron chỉ tính một lần vào giờ dạy giáo viên.
 */
let groupRosterV6951=[];
let groupAbsentIdsV6951=new Set();
let groupRosterKeyV6951='';
let groupRosterModeV701='';
let parsedGroupRosterV6951=[];
let groupReportDataV6951=null;
let groupRosterRequestSeqV6951=0;
let attendanceRosterReadyV7013=false;
let attendanceClassTypeV7013='';
let attendanceRosterMessageV7013='';

function isGroupBookClassV6951(lop){
  const t=String(loaiSoTheoLopV22(lop)||'').toUpperCase();
  return t==='CHUYEN_DE'||t==='GDTC';
}
function groupTypeLabelV6951(lop){return String(loaiSoTheoLopV22(lop)).toUpperCase()==='GDTC'?'GDTC':'Chuyên đề';}
function getGroupAbsentStudentIdsV6951(){return groupRosterModeV701==='GROUP'?[...groupAbsentIdsV6951]:[];}
function getMainAbsentStudentIdsV701(){return groupRosterModeV701==='LOP_CHINH'?[...groupAbsentIdsV6951]:[];}
function isAttendanceCompleteV701(){return !!document.getElementById('attendanceCompleteV701')?.checked;}
function attendanceStudentLabelV701(x){
  const ma=String(x.maHS||''),home=String(x.lopChuNhiem||'').trim();
  return groupRosterModeV701==='GROUP'
    ? `${escapeHtml(ma)} · Lớp CN ${escapeHtml(home||'—')}`
    : escapeHtml(ma);
}
function syncAttendanceModeUiV7011(){
  const completeEl=document.getElementById('attendanceCompleteV701');
  const complete=!!completeEl?.checked;
  const tools=document.getElementById('attendanceAbsentToolsV7011');
  const listWrap=document.getElementById('attendanceAbsentListWrapV7011');
  if(completeEl){
    completeEl.disabled=!attendanceRosterReadyV7013;
    completeEl.title=attendanceRosterReadyV7013?'':'Chưa có danh sách điểm danh của lớp/nhóm này trên Supabase.';
  }
  if(tools)tools.classList.toggle('d-none',complete||!attendanceRosterReadyV7013);
  if(listWrap)listWrap.classList.toggle('d-none',complete||!attendanceRosterReadyV7013);
  const nameEl=document.getElementById('tenHSVang');
  if(nameEl&&!nameEl.value){
    nameEl.placeholder=!attendanceRosterReadyV7013
      ? 'Chưa có danh sách điểm danh'
      : (complete?'Điểm danh đủ — không có học sinh vắng':'Tích học sinh vắng trong danh sách phía trên');
  }
}
function clearAbsentSelectionV7011(){
  groupAbsentIdsV6951.clear();
  renderGroupAttendanceV6951();
}
function attendanceMissingRosterTextV7013(){
  const lop=String(document.getElementById('lop')?.value||'').trim();
  const type=String(attendanceClassTypeV7013||'').toUpperCase();
  if(!lop)return 'Chọn lớp để tải danh sách học sinh từ Supabase.';
  if(type==='GDTC')return `Lớp/nhóm GDTC ${lop} chưa có danh sách thành viên. Admin cần nhập danh sách nhóm GDTC trong Quản trị → Học sinh & phân nhóm.`;
  if(type==='CHUYEN_DE')return `Lớp Chuyên đề ${lop} chưa có danh sách thành viên. Admin cần nhập danh sách Chuyên đề trong Quản trị → Học sinh & phân nhóm.`;
  return `Lớp ${lop} chưa có danh sách học sinh chính khóa. Admin cần nhập danh sách học sinh vào Supabase.`;
}
function syncGroupAbsenceSummaryV6951(){
  const complete=isAttendanceCompleteV701();
  if(complete&&groupAbsentIdsV6951.size)groupAbsentIdsV6951.clear();
  const count=(attendanceRosterReadyV7013&&complete)?0:groupAbsentIdsV6951.size;
  const selected=(!attendanceRosterReadyV7013||complete)?[]:groupRosterV6951.filter(x=>groupAbsentIdsV6951.has(String(x.maHS||'')));
  const countEl=document.getElementById('hsVang'),nameEl=document.getElementById('tenHSVang'),badge=document.getElementById('groupAttendanceCountV6951');
  if(countEl){countEl.readOnly=true;countEl.value=String(count);}
  if(nameEl){nameEl.readOnly=true;nameEl.value=selected.map(x=>x.hoTen).join(', ');}
  if(badge){
    if(!attendanceRosterReadyV7013){badge.textContent='Chưa có DS điểm danh';badge.className='badge text-bg-danger';}
    else{badge.textContent=`${groupRosterV6951.length} học sinh · ${count} vắng`;badge.className='badge text-bg-primary';}
  }
}
function renderGroupAttendanceV6951(){
  const wrap=document.getElementById('groupAttendanceListV6951');if(!wrap)return;
  const complete=isAttendanceCompleteV701();
  syncAttendanceModeUiV7011();
  if(!attendanceRosterReadyV7013){
    wrap.innerHTML=`<div class="alert alert-warning py-2 mb-0"><strong>Chưa thể điểm danh.</strong> ${escapeHtml(attendanceRosterMessageV7013||attendanceMissingRosterTextV7013())}</div>`;
    syncGroupAbsenceSummaryV6951();return;
  }
  const q=normalizeTextKey(document.getElementById('attendanceSearchV7011')?.value||'');
  const rows=q?groupRosterV6951.filter(x=>normalizeTextKey(`${x.maHS||''} ${x.hoTen||''} ${x.lopChuNhiem||''}`).includes(q)):groupRosterV6951;
  wrap.innerHTML=rows.length?rows.map(x=>{
    const ma=String(x.maHS||''),checked=!complete&&groupAbsentIdsV6951.has(ma)?'checked':'',disabled=complete?'disabled':'';
    return `<div class="col-xl-3 col-lg-4 col-md-6"><label class="attendance-student-v7011 border rounded p-2 w-100 d-flex gap-2 align-items-start bg-white ${checked?'attendance-student-absent-v7011':''} ${complete?'opacity-75':''}" style="cursor:${complete?'default':'pointer'}"><input class="form-check-input mt-1" type="checkbox" ${checked} ${disabled} onchange="toggleGroupAbsentV6951('${encodeURIComponent(ma)}',this.checked)"><span><strong>${escapeHtml(x.hoTen||'')}</strong><br><span class="small text-muted">${attendanceStudentLabelV701(x)}</span></span></label></div>`;
  }).join(''):'<div class="text-center text-muted py-3">Không tìm thấy học sinh phù hợp.</div>';
  syncGroupAbsenceSummaryV6951();
}
function onAttendanceCompleteV701(checked){
  if(!attendanceRosterReadyV7013){
    const el=document.getElementById('attendanceCompleteV701');if(el)el.checked=false;
    showToastV9(attendanceRosterMessageV7013||attendanceMissingRosterTextV7013(),'warning');
    renderGroupAttendanceV6951();return;
  }
  if(checked){
    groupAbsentIdsV6951.clear();
    const search=document.getElementById('attendanceSearchV7011');if(search)search.value='';
  }
  renderGroupAttendanceV6951();
}
function toggleGroupAbsentV6951(encodedId,checked){
  const id=decodeURIComponent(String(encodedId||''));if(!id||isAttendanceCompleteV701()||!attendanceRosterReadyV7013)return;
  if(checked)groupAbsentIdsV6951.add(id);else groupAbsentIdsV6951.delete(id);
  renderGroupAttendanceV6951();
}
function validateAttendanceBeforeSaveV7013(){
  const lop=String(document.getElementById('lop')?.value||'').trim();
  if(!lop)return true;
  if(attendanceRosterReadyV7013&&groupRosterV6951.length>0)return true;
  showToastV9(attendanceRosterMessageV7013||attendanceMissingRosterTextV7013(),'danger');
  return false;
}
async function refreshGroupAttendanceV6951(preserveIds){
  const requestSeq=++groupRosterRequestSeqV6951;
  const panel=document.getElementById('groupAttendancePanelV6951'),metaEl=document.getElementById('groupAttendanceMetaV6951'),listEl=document.getElementById('groupAttendanceListV6951');
  const countEl=document.getElementById('hsVang'),nameEl=document.getElementById('tenHSVang'),completeEl=document.getElementById('attendanceCompleteV701');
  const lop=String(document.getElementById('lop')?.value||'').trim(),date=String(document.getElementById('ngayDay')?.value||'').trim();
  attendanceRosterReadyV7013=false;attendanceClassTypeV7013='';attendanceRosterMessageV7013='';
  if(!lop){
    if(panel)panel.classList.remove('d-none');groupRosterV6951=[];groupAbsentIdsV6951.clear();groupRosterKeyV6951='';groupRosterModeV701='';
    if(completeEl){completeEl.checked=false;completeEl.disabled=true;}
    if(countEl)countEl.value='0';if(nameEl){nameEl.value='';nameEl.placeholder='Chọn lớp để điểm danh';}
    if(metaEl)metaEl.textContent='Chọn lớp để tải danh sách học sinh từ Supabase.';renderGroupAttendanceV6951();return;
  }
  if(panel)panel.classList.remove('d-none');if(countEl)countEl.readOnly=true;if(nameEl)nameEl.readOnly=true;
  if(completeEl){completeEl.checked=false;completeEl.disabled=true;}
  if(!gvbmDangNhapInfo?.sessionToken){attendanceRosterMessageV7013='Cần phiên giáo viên bộ môn để tải danh sách học sinh.';if(metaEl)metaEl.textContent=attendanceRosterMessageV7013;renderGroupAttendanceV6951();return;}
  if(metaEl)metaEl.textContent='Đang xác định loại lớp và tải danh sách điểm danh từ Supabase...';
  if(listEl)listEl.innerHTML='<div class="text-center text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải danh sách...</div>';
  try{
    // V70.1.3: luôn gọi một RPC. Edge tự xác định Lớp chính / Chuyên đề / GDTC từ danh mục lớp Supabase.
    const r=await callSodbEdgeRpcV67('layDanhSachHocSinhLopV701',[lop,date,{token:gvbmDangNhapInfo.sessionToken}]);
    if(requestSeq!==groupRosterRequestSeqV6951)return;
    if(!r?.success)throw new Error(r?.message||'Không tải được danh sách học sinh.');
    const type=String(r.loaiNhom||'LOP_CHINH').toUpperCase();
    const isGroup=type==='CHUYEN_DE'||type==='GDTC';
    attendanceClassTypeV7013=type;
    groupRosterModeV701=isGroup?'GROUP':'LOP_CHINH';
    groupRosterV6951=Array.isArray(r.data)?r.data:[];
    const key=`${groupRosterModeV701}|${lop}|${isGroup?date:''}`;
    const preserveArray=Array.isArray(preserveIds)?preserveIds.map(String):null;
    const keep=preserveArray?new Set(preserveArray):(key===groupRosterKeyV6951?new Set(groupAbsentIdsV6951):new Set());
    groupRosterKeyV6951=key;
    const valid=new Set(groupRosterV6951.map(x=>String(x.maHS||'')));groupAbsentIdsV6951=new Set([...keep].filter(x=>valid.has(x)));
    attendanceRosterReadyV7013=groupRosterV6951.length>0;
    attendanceRosterMessageV7013=attendanceRosterReadyV7013?'':attendanceMissingRosterTextV7013();
    if(completeEl){
      completeEl.disabled=!attendanceRosterReadyV7013;
      completeEl.checked=attendanceRosterReadyV7013&&(preserveArray?preserveArray.length===0:true);
    }
    if(metaEl){
      if(type==='GDTC')metaEl.textContent=attendanceRosterReadyV7013?`GDTC ${lop}${r.subject?' · '+r.subject:''} · ${groupRosterV6951.length} học sinh · danh sách hiệu lực ngày ${date.split('-').reverse().join('/')}.`:attendanceRosterMessageV7013;
      else if(type==='CHUYEN_DE')metaEl.textContent=attendanceRosterReadyV7013?`Chuyên đề ${lop}${r.subject?' · '+r.subject:''} · ${groupRosterV6951.length} học sinh · danh sách hiệu lực ngày ${date.split('-').reverse().join('/')}.`:attendanceRosterMessageV7013;
      else metaEl.textContent=attendanceRosterReadyV7013?`Lớp chính khóa ${lop} · ${groupRosterV6951.length} học sinh · nguồn Supabase.`:attendanceRosterMessageV7013;
    }
    renderGroupAttendanceV6951();
  }catch(e){
    if(requestSeq!==groupRosterRequestSeqV6951)return;
    groupRosterV6951=[];groupAbsentIdsV6951.clear();groupRosterKeyV6951='';attendanceRosterReadyV7013=false;
    attendanceRosterMessageV7013=e?.message||String(e);if(metaEl)metaEl.textContent=attendanceRosterMessageV7013;renderGroupAttendanceV6951();
  }
}
function resetGroupAttendanceAfterSaveV6951(){
  groupAbsentIdsV6951.clear();const complete=document.getElementById('attendanceCompleteV701');if(complete)complete.checked=attendanceRosterReadyV7013;renderGroupAttendanceV6951();
}


function getGroupBookAuthV6951(){return gvbmDangNhapInfo&&gvbmDangNhapInfo.sessionToken?gvbmDangNhapInfo:null;}
function updateGroupFooterLabelsV6951(isGroup){
  const opinion=document.getElementById('printCloseOpinionLabelV6951'),title=document.getElementById('printCloseSignerTitleV6951');
  if(opinion)opinion.textContent=isGroup?'Ý kiến GV phụ trách nhóm:':'Ý kiến GVCN:';
  if(title)title.textContent=isGroup?'GIÁO VIÊN PHỤ TRÁCH NHÓM':'GIÁO VIÊN CHỦ NHIỆM';
}
function applyGroupBookUiV6951(payload,lop,tuan,bookMode){
  const isGroup=!!payload?.groupBook||['CHUYEN_DE','GDTC'].includes(String(bookMode||'').toUpperCase())||isGroupBookClassV6951(lop);
  updateGroupFooterLabelsV6951(isGroup);
  const panel=document.getElementById('groupWeekCloseV6951');if(!panel)return;
  if(!isGroup){panel.classList.add('d-none');return;}
  const auth=getGroupBookAuthV6951(),meta=getClassMetaClientV26(lop)||{},allowed=auth&&getAssignedClassesForSubjectV39(String(meta.subject||'')).includes(lop);
  panel.classList.toggle('d-none',!allowed);
  if(!allowed)return;
  const close=payload?.chot||{},state=document.getElementById('groupCloseStateV6951'),note=document.getElementById('groupCloseNoteV6951'),info=document.getElementById('groupCloseMetaV6951'),btn=document.getElementById('groupCloseBtnV6951');
  const done=!!close.success;if(state){state.textContent=done?'Đã chốt':'Chưa chốt';state.className='badge '+(done?'bg-success':'bg-secondary');}
  if(note)note.value=done?(close.ykien||''):'';
  if(info)info.textContent=done?`Đã ký bởi ${close.tenGVPhuTrach||close.tenGVCN||'GV phụ trách'}${close.time?' · '+close.time:''}`:'Sổ nhóm chỉ khóa sau khi GV phụ trách ký chốt; BGH duyệt sau bước này.';
  if(btn){btn.textContent=done?'Ký chốt lại':'Ký chốt tuần';btn.disabled=false;}
}
async function guiChotTuanNhomV6951(){
  const auth=getGroupBookAuthV6951();if(!auth?.sessionToken){showToastV9('Không có phiên GVBM.','danger');return;}
  const lop=String(document.getElementById('viewLop')?.value||'').trim(),tuan=Math.max(1,Math.min(52,parseInt(document.getElementById('viewTuan')?.value)||1)),ykien=String(document.getElementById('groupCloseNoteV6951')?.value||'').trim();
  if(!lop||!isGroupBookClassV6951(lop)){showToastV9('Chỉ ký chốt cho lớp/nhóm Chuyên đề hoặc GDTC.','warning');return;}
  if(!await confirmV13(`Xác nhận ký chốt sổ nhóm ${lop} - Tuần ${tuan}?`,{title:'Ký chốt sổ nhóm',confirmText:'Ký chốt'}))return;
  const btn=document.getElementById('groupCloseBtnV6951');if(btn){btn.disabled=true;btn.textContent='Đang ký...';}
  try{
    const r=await callSodbEdgeRpcV67('luuChotTuanNhomV6951',[{lop,tuan,ykien},{token:auth.sessionToken}]);if(!r?.success)throw new Error(r?.message||'Không ký chốt được.');
    showToastV9(r.message||'Đã ký chốt sổ nhóm.','success');[...sodbViewCacheV6.keys()].filter(k=>String(k).startsWith(`${lop}|${tuan}|`)).forEach(k=>sodbViewCacheV6.delete(k));if(typeof invalidateBghWorkflowCacheV701==='function')invalidateBghWorkflowCacheV701();await Promise.resolve(traCuuSoDauBaiTuanGop(true));
  }catch(e){showToastV9(e?.message||String(e),'danger');if(btn){btn.disabled=false;btn.textContent='Ký chốt tuần';}}
}

// V70.3.1.7: chuẩn hóa ngày Excel/chuỗi ngày trước khi gửi Supabase.
function normalizeGroupRosterDateV70317(value,allowEmpty=false){
  if(value===null||value===undefined||String(value).trim()==='')return allowEmpty?'':'';
  if(value instanceof Date&&!isNaN(value.getTime())){
    const y=value.getFullYear(),m=String(value.getMonth()+1).padStart(2,'0'),d=String(value.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  const text=String(value).trim();
  if(/^\d+(?:\.\d+)?$/.test(text)){
    const serial=Number(text);
    if(Number.isFinite(serial)&&serial>0&&serial<100000){
      const d=new Date(Math.round((serial-25569)*86400000));
      if(!isNaN(d.getTime()))return d.toISOString().slice(0,10);
    }
  }
  let m=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if(m){
    const y=Number(m[1]),mo=Number(m[2]),da=Number(m[3]),d=new Date(Date.UTC(y,mo-1,da));
    if(d.getUTCFullYear()===y&&d.getUTCMonth()===mo-1&&d.getUTCDate()===da)return `${String(y).padStart(4,'0')}-${String(mo).padStart(2,'0')}-${String(da).padStart(2,'0')}`;
  }
  m=text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if(m){
    const da=Number(m[1]),mo=Number(m[2]),y=Number(m[3]),d=new Date(Date.UTC(y,mo-1,da));
    if(d.getUTCFullYear()===y&&d.getUTCMonth()===mo-1&&d.getUTCDate()===da)return `${String(y).padStart(4,'0')}-${String(mo).padStart(2,'0')}-${String(da).padStart(2,'0')}`;
  }
  throw new Error(`Ngày "${text}" không hợp lệ. Dùng dd/mm/yyyy hoặc yyyy-mm-dd.`);
}
function normalizeGroupRosterRowsV70317(rows){
  return (rows||[]).map((row,idx)=>{
    const r=Array.isArray(row)?[...row]:row;
    try{
      if(Array.isArray(r)){
        r[4]=normalizeGroupRosterDateV70317(r[4],false);
        r[5]=normalizeGroupRosterDateV70317(r[5],true);
      }else if(r&&typeof r==='object'){
        r.tuNgay=normalizeGroupRosterDateV70317(r.tuNgay??r.tu_ngay,false);
        r.denNgay=normalizeGroupRosterDateV70317(r.denNgay??r.den_ngay,true);
      }
      return r;
    }catch(e){throw new Error(`Dòng ${idx+2}: ${e?.message||e}`);}
  });
}
function taiFileMauNhomV6951(){
  if(retryWithXlsxV7(()=>taiFileMauNhomV6951()))return;
  const rows=[['Nhóm/Lớp','Mã HS','Họ tên','Lớp chủ nhiệm','Từ ngày','Đến ngày'],['BC1','HS001','Nguyễn Văn A','10A01','2026-08-17',''],['CL2','HS002','Trần Thị B','10A02','2026-08-17','']];
  const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,'DanhSachNhom');XLSX.writeFile(wb,'FileMau_DanhSachNhom_ChuyenDe_GDTC.xlsx');
}
function docFileNhomV6951(event){
  if(!window.XLSX){const input=event?.target;ensureXlsxV7().then(()=>docFileNhomV6951({target:input})).catch(e=>alertV13('❌ '+(e.message||e)));return;}
  const f=event?.target?.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=e=>{try{const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});parsedGroupRosterV6951=normalizeGroupRosterRowsV70317((rows||[]).slice(1).filter(r=>r.some(v=>String(v).trim())));const groups=[...new Set(parsedGroupRosterV6951.map(r=>String(r[0]||'').trim()).filter(Boolean))];document.getElementById('groupRosterPreviewV6951').textContent=`Đã đọc ${parsedGroupRosterV6951.length} học sinh thuộc ${groups.length} nhóm: ${groups.join(', ')}`;}catch(err){parsedGroupRosterV6951=[];alertV13('❌ File danh sách nhóm không hợp lệ: '+(err.message||err));}};rd.readAsArrayBuffer(f);
}
async function uploadDanhSachNhomV6951(){
  if(!adminDangNhapInfo?.sessionToken){alertV13('❌ Cần quyền Admin.');return;}if(!parsedGroupRosterV6951.length){alertV13('⚠️ Chưa chọn file danh sách nhóm.');return;}
  const mode=document.getElementById('groupRosterModeV6951')?.value||'REPLACE_GROUP';
  try{const r=await callSodbEdgeRpcV67('luuDanhSachHocSinhNhomV6951',[normalizeGroupRosterRowsV70317(parsedGroupRosterV6951),mode,{token:adminDangNhapInfo.sessionToken}],60000);alertV13((r?.success?'✅ ':'❌ ')+(r?.message||''));if(r?.success){parsedGroupRosterV6951=[];const inp=document.getElementById('groupRosterFileV6951');if(inp)inp.value='';}}catch(e){alertV13('❌ '+(e?.message||e));}
}

function getGroupReportAuthV6951(){
  const s=currentUnifiedLoginV4?.sessions||{};return s.ADMIN||adminDangNhapInfo||null;
}
function initGroupReportDatesV6951(){
  const f=document.getElementById('groupReportFromV6951'),t=document.getElementById('groupReportToV6951');if(!f||!t)return;
  const today=new Date(),from=new Date(today);from.setDate(today.getDate()-30);const iso=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10);};if(!t.value)t.value=iso(today);if(!f.value)f.value=iso(from);
}
async function loadGroupReportV6951(){
  initGroupReportDatesV6951();const status=document.getElementById('groupReportStatusV6951');const roles=currentUnifiedLoginV4&&Array.isArray(currentUnifiedLoginV4.roles)?currentUnifiedLoginV4.roles:[];if(!roles.includes('ADMIN')){if(status)status.textContent='Báo cáo Chuyên đề/GDTC chỉ dành cho Quản trị hệ thống.';return;}const auth=getGroupReportAuthV6951();if(!auth?.sessionToken){if(status)status.textContent='Phiên Quản trị không hợp lệ.';return;}
  const f={from:document.getElementById('groupReportFromV6951')?.value||'',to:document.getElementById('groupReportToV6951')?.value||'',loaiNhom:document.getElementById('groupReportTypeV6951')?.value||'ALL',lop:document.getElementById('groupReportClassV6951')?.value||''};if(status)status.textContent='Đang tổng hợp...';
  try{const r=await callSodbEdgeRpcV67('baoCaoNhomHocV6951',[f,{token:auth.sessionToken}]);if(!r?.success)throw new Error(r?.message||'Không tổng hợp được báo cáo.');groupReportDataV6951=r;renderGroupReportV6951(r);if(status)status.textContent=`Năm học ${r.namHoc||''} · ${r.from||''} → ${r.to||''}. Một tiết vật lý chỉ tính một lần vào giờ dạy GV.`;}catch(e){if(status)status.textContent='Lỗi: '+(e?.message||e);}
}
function renderGroupReportV6951(r){
  const m=r.metrics||{},cards=document.getElementById('groupReportCardsV6951');if(cards)cards.innerHTML=[['Giờ dạy GV (không nhân)',m.teacherPeriods||0,'primary'],['Lượt tiết nhóm',m.groupPeriods||0,'success'],['Lượt HS vắng',m.absences||0,'danger'],['Số nhóm',m.groups||0,'secondary']].map(x=>`<div class="col-6 col-lg-3"><div class="card border-${x[2]}-subtle h-100"><div class="card-body py-2"><div class="small text-muted">${x[0]}</div><div class="fs-4 fw-bold">${x[1]}</div></div></div></div>`).join('');
  const bg=document.getElementById('groupReportByGroupV6951');if(bg)bg.innerHTML=(r.byGroup||[]).length?(r.byGroup||[]).map(x=>`<tr><td class="fw-bold">${escapeHtml(x.lopNhom||'')}</td><td>${escapeHtml(x.loaiNhom||'')}</td><td>${escapeHtml(x.mon||'')}</td><td class="text-center">${Number(x.soTiet||0)}</td><td class="text-center">${Number(x.soVang||0)}</td></tr>`).join(''):'<tr><td colspan="5" class="text-center text-muted">Không có dữ liệu.</td></tr>';
  const bh=document.getElementById('groupReportByHomeV6951');if(bh)bh.innerHTML=(r.byHomeroom||[]).length?(r.byHomeroom||[]).map(x=>`<tr><td class="fw-bold">${escapeHtml(x.lopChuNhiem||'')}</td><td class="text-center">${Number(x.soTietNhomLienQuan||0)}</td><td class="text-center">${Number(x.soLuotVang||0)}</td><td>${escapeHtml(x.nhom||'')}</td></tr>`).join(''):'<tr><td colspan="4" class="text-center text-muted">Không có dữ liệu.</td></tr>';
  const bt=document.getElementById('groupReportByTeacherV6951');if(bt)bt.innerHTML=(r.byTeacher||[]).length?(r.byTeacher||[]).map(x=>`<tr><td class="fw-bold">${escapeHtml(x.tenGV||'')}</td><td>${escapeHtml(x.taiKhoan||'')}</td><td class="text-center fw-bold">${Number(x.soTiet||0)}</td><td class="text-center">${Number(x.soNhom||0)}</td><td>${escapeHtml(x.nhom||'')}</td></tr>`).join(''):'<tr><td colspan="5" class="text-center text-muted">Không có dữ liệu.</td></tr>';
  const d=document.getElementById('groupReportDetailV6951');if(d)d.innerHTML=(r.details||[]).length?(r.details||[]).map(x=>`<tr><td>${escapeHtml(x.ngay||'')}</td><td>${escapeHtml(x.lopNhom||'')}</td><td>${escapeHtml(x.mon||'')}</td><td>${escapeHtml(x.tenGV||'')}</td><td>${escapeHtml(x.maHS||'')}</td><td>${escapeHtml(x.hoTen||'')}</td><td>${escapeHtml(x.lopChuNhiem||'')}</td></tr>`).join(''):'<tr><td colspan="7" class="text-center text-muted">Không có học sinh vắng.</td></tr>';
}
function exportGroupReportCsvV6951(){
  const d=groupReportDataV6951;if(!d){showToastV9('Hãy tổng hợp báo cáo trước.','warning');return;}
  const rows=[['Lớp chủ nhiệm','Số tiết nhóm liên quan','Lượt vắng','Nhóm tham gia']];(d.byHomeroom||[]).forEach(x=>rows.push([x.lopChuNhiem,x.soTietNhomLienQuan,x.soLuotVang,x.nhom]));rows.push([]);rows.push(['Ngày','Nhóm','Môn','Giáo viên','Mã HS','Họ tên','Lớp chủ nhiệm']);(d.details||[]).forEach(x=>rows.push([x.ngay,x.lopNhom,x.mon,x.tenGV,x.maHS,x.hoTen,x.lopChuNhiem]));downloadCsvV694(`Bao_cao_nhom_${d.from||''}_${d.to||''}.csv`,rows);
}

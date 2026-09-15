/* SODB V69.5.1 - Sổ nhóm Chuyên đề / GDTC
 * - GDTC là lớp/nhóm độc lập (BC1, CL2...), không ghép nhiều lớp trong một SĐB.
 * - Điểm danh theo thành viên nhóm, giữ lớp chủ nhiệm để chiếu báo cáo.
 * - Một bản ghi SĐB/ma_tiet_tron chỉ tính một lần vào giờ dạy giáo viên.
 */
let groupRosterV6951=[];
let groupAbsentIdsV6951=new Set();
let groupRosterKeyV6951='';
let parsedGroupRosterV6951=[];
let groupReportDataV6951=null;
let groupRosterRequestSeqV6951=0;

function isGroupBookClassV6951(lop){
  const t=String(loaiSoTheoLopV22(lop)||'').toUpperCase();
  return t==='CHUYEN_DE'||t==='GDTC';
}
function groupTypeLabelV6951(lop){return String(loaiSoTheoLopV22(lop)).toUpperCase()==='GDTC'?'GDTC':'Chuyên đề';}
function getGroupAbsentStudentIdsV6951(){return [...groupAbsentIdsV6951];}
function syncGroupAbsenceSummaryV6951(){
  const count=groupAbsentIdsV6951.size;
  const selected=groupRosterV6951.filter(x=>groupAbsentIdsV6951.has(String(x.maHS||'')));
  const countEl=document.getElementById('hsVang'),nameEl=document.getElementById('tenHSVang'),badge=document.getElementById('groupAttendanceCountV6951');
  if(countEl)countEl.value=String(count);
  if(nameEl)nameEl.value=selected.map(x=>x.hoTen).join(', ');
  if(badge)badge.textContent=`${groupRosterV6951.length} học sinh · ${count} vắng`;
}
function renderGroupAttendanceV6951(){
  const wrap=document.getElementById('groupAttendanceListV6951');if(!wrap)return;
  if(!groupRosterV6951.length){wrap.innerHTML='<div class="text-center text-danger py-3">Nhóm chưa có danh sách học sinh. Admin cần import danh sách nhóm trước khi ghi sổ.</div>';syncGroupAbsenceSummaryV6951();return;}
  wrap.innerHTML=groupRosterV6951.map((x,i)=>{
    const ma=String(x.maHS||''),checked=groupAbsentIdsV6951.has(ma)?'checked':'';
    return `<div class="col-xl-3 col-lg-4 col-md-6"><label class="border rounded p-2 w-100 d-flex gap-2 align-items-start bg-white" style="cursor:pointer"><input class="form-check-input mt-1" type="checkbox" ${checked} onchange="toggleGroupAbsentV6951('${encodeURIComponent(ma)}',this.checked)"><span><strong>${escapeHtml(x.hoTen||'')}</strong><br><span class="small text-muted">${escapeHtml(ma)} · Lớp CN ${escapeHtml(x.lopChuNhiem||'—')}</span></span></label></div>`;
  }).join('');
  syncGroupAbsenceSummaryV6951();
}
function toggleGroupAbsentV6951(encodedId,checked){
  const id=decodeURIComponent(String(encodedId||''));if(!id)return;
  if(checked)groupAbsentIdsV6951.add(id);else groupAbsentIdsV6951.delete(id);
  syncGroupAbsenceSummaryV6951();
}
async function refreshGroupAttendanceV6951(preserveIds){
  const requestSeq=++groupRosterRequestSeqV6951;
  const panel=document.getElementById('groupAttendancePanelV6951'),metaEl=document.getElementById('groupAttendanceMetaV6951');
  const countEl=document.getElementById('hsVang'),nameEl=document.getElementById('tenHSVang');
  const lop=String(document.getElementById('lop')?.value||'').trim(),date=String(document.getElementById('ngayDay')?.value||'').trim();
  if(!isGroupBookClassV6951(lop)){
    if(panel)panel.classList.add('d-none');
    if(countEl)countEl.readOnly=false;if(nameEl)nameEl.readOnly=false;
    groupRosterV6951=[];groupAbsentIdsV6951.clear();groupRosterKeyV6951='';return;
  }
  if(panel)panel.classList.remove('d-none');if(countEl)countEl.readOnly=true;if(nameEl)nameEl.readOnly=true;
  if(!gvbmDangNhapInfo?.sessionToken){if(metaEl)metaEl.textContent='Cần phiên giáo viên bộ môn để tải danh sách nhóm.';return;}
  if(!date){if(metaEl)metaEl.textContent='Chọn ngày dạy để tải đúng danh sách thành viên đang hiệu lực.';return;}
  const key=`${lop}|${date}`;
  const keep=Array.isArray(preserveIds)?new Set(preserveIds.map(String)):(key===groupRosterKeyV6951?new Set(groupAbsentIdsV6951):new Set());
  if(metaEl)metaEl.textContent='Đang tải danh sách học sinh nhóm...';
  try{
    const r=await callSodbEdgeRpcV67('layDanhSachHocSinhNhomV6951',[lop,date,{token:gvbmDangNhapInfo.sessionToken}]);
    if(requestSeq!==groupRosterRequestSeqV6951)return;
    if(!r?.success)throw new Error(r?.message||'Không tải được danh sách nhóm.');
    groupRosterV6951=Array.isArray(r.data)?r.data:[];groupRosterKeyV6951=key;
    const valid=new Set(groupRosterV6951.map(x=>String(x.maHS||'')));groupAbsentIdsV6951=new Set([...keep].filter(x=>valid.has(x)));
    if(metaEl)metaEl.textContent=`${r.loaiNhom==='GDTC'?'GDTC':'Chuyên đề'} ${lop}${r.subject?' · '+r.subject:''} · danh sách theo ngày ${date.split('-').reverse().join('/')}.`;
    renderGroupAttendanceV6951();
  }catch(e){if(requestSeq!==groupRosterRequestSeqV6951)return;groupRosterV6951=[];groupAbsentIdsV6951.clear();if(metaEl)metaEl.textContent=e?.message||String(e);renderGroupAttendanceV6951();}
}
function resetGroupAttendanceAfterSaveV6951(){groupAbsentIdsV6951.clear();if(isGroupBookClassV6951(document.getElementById('lop')?.value||''))renderGroupAttendanceV6951();}

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
    showToastV9(r.message||'Đã ký chốt sổ nhóm.','success');[...sodbViewCacheV6.keys()].filter(k=>String(k).startsWith(`${lop}|${tuan}|`)).forEach(k=>sodbViewCacheV6.delete(k));setTimeout(()=>traCuuSoDauBaiTuanGop(true),80);
  }catch(e){showToastV9(e?.message||String(e),'danger');if(btn){btn.disabled=false;btn.textContent='Ký chốt tuần';}}
}

function taiFileMauNhomV6951(){
  if(retryWithXlsxV7(()=>taiFileMauNhomV6951()))return;
  const rows=[['Nhóm/Lớp','Mã HS','Họ tên','Lớp chủ nhiệm','Từ ngày','Đến ngày'],['BC1','HS001','Nguyễn Văn A','10A01','2026-08-17',''],['CL2','HS002','Trần Thị B','10A02','2026-08-17','']];
  const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,'DanhSachNhom');XLSX.writeFile(wb,'FileMau_DanhSachNhom_ChuyenDe_GDTC.xlsx');
}
function docFileNhomV6951(event){
  if(!window.XLSX){const input=event?.target;ensureXlsxV7().then(()=>docFileNhomV6951({target:input})).catch(e=>alertV13('❌ '+(e.message||e)));return;}
  const f=event?.target?.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=e=>{try{const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});parsedGroupRosterV6951=(rows||[]).slice(1).filter(r=>r.some(v=>String(v).trim()));const groups=[...new Set(parsedGroupRosterV6951.map(r=>String(r[0]||'').trim()).filter(Boolean))];document.getElementById('groupRosterPreviewV6951').textContent=`Đã đọc ${parsedGroupRosterV6951.length} học sinh thuộc ${groups.length} nhóm: ${groups.join(', ')}`;}catch(err){parsedGroupRosterV6951=[];alertV13('❌ File danh sách nhóm không hợp lệ: '+(err.message||err));}};rd.readAsArrayBuffer(f);
}
async function uploadDanhSachNhomV6951(){
  if(!adminDangNhapInfo?.sessionToken){alertV13('❌ Cần quyền Admin.');return;}if(!parsedGroupRosterV6951.length){alertV13('⚠️ Chưa chọn file danh sách nhóm.');return;}
  const mode=document.getElementById('groupRosterModeV6951')?.value||'REPLACE_GROUP';
  try{const r=await callSodbEdgeRpcV67('luuDanhSachHocSinhNhomV6951',[parsedGroupRosterV6951,mode,{token:adminDangNhapInfo.sessionToken}]);alertV13((r?.success?'✅ ':'❌ ')+(r?.message||''));if(r?.success){parsedGroupRosterV6951=[];const inp=document.getElementById('groupRosterFileV6951');if(inp)inp.value='';}}catch(e){alertV13('❌ '+(e?.message||e));}
}

function getGroupReportAuthV6951(){
  const s=currentUnifiedLoginV4?.sessions||{};return s.BGH||s.GIAM_THI||s.TTCM||s.ADMIN||adminDangNhapInfo||null;
}
function initGroupReportDatesV6951(){
  const f=document.getElementById('groupReportFromV6951'),t=document.getElementById('groupReportToV6951');if(!f||!t)return;
  const today=new Date(),from=new Date(today);from.setDate(today.getDate()-30);const iso=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10);};if(!t.value)t.value=iso(today);if(!f.value)f.value=iso(from);
}
async function loadGroupReportV6951(){
  initGroupReportDatesV6951();const auth=getGroupReportAuthV6951(),status=document.getElementById('groupReportStatusV6951');if(!auth?.sessionToken){if(status)status.textContent='Tài khoản cần quyền TTCM/Giám thị/BGH/Admin.';return;}
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

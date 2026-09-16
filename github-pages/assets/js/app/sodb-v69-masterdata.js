/* ========================================================================
   SODB V69.6 - ADMIN MASTER DATA UI
   Giáo viên / Phân công dạy / GVCN / Tổ chuyên môn trực tiếp trên web.
   ======================================================================== */
let masterDataV696={teachers:[],assignments:[],gvcns:[],teams:[],classes:[],subjects:[],summary:{}};
let masterLoadedV696=false;

function escV696(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function masterAuthV696(){return adminDangNhapInfo?.sessionToken?{token:adminDangNhapInfo.sessionToken}:null;}
async function masterRpcV696(method,args=[]){
  const auth=masterAuthV696();if(!auth)throw new Error('Phiên Admin không hợp lệ.');
  return await callSodbEdgeRpcV67(method,[...args,auth]);
}
function masterTeacherNameV696(account){const t=masterDataV696.teachers.find(x=>x.taiKhoan===account);return t?.hoTen||account||'';}
function masterOptionsV696(rows,valueKey,labelFn,selected){return (rows||[]).map(r=>`<option value="${escV696(r[valueKey])}" ${String(r[valueKey])===String(selected||'')?'selected':''}>${escV696(labelFn(r))}</option>`).join('');}
function fillMasterDatalistsV696(){
  const dl=document.getElementById('masterSubjectListV696');if(dl)dl.innerHTML=(masterDataV696.subjects||[]).map(x=>`<option value="${escV696(x)}"></option>`).join('');
  const teacherSelects=['masterAssignTeacherV696','masterGvcnTeacherV696','masterTeamTeacherV696'];
  teacherSelects.forEach(id=>{const el=document.getElementById(id);if(el){const cur=el.value;el.innerHTML='<option value="">-- Chọn giáo viên --</option>'+masterOptionsV696(masterDataV696.teachers,'taiKhoan',r=>`${r.hoTen} · ${r.taiKhoan}`,cur);if(cur)el.value=cur;}});
  const classSelect=document.getElementById('masterGvcnClassV696');if(classSelect){const cur=classSelect.value;classSelect.innerHTML='<option value="">-- Chọn lớp --</option>'+masterOptionsV696(masterDataV696.classes,'tenLop',r=>`${r.tenLop}${r.nhomSo?' · '+r.nhomSo:''}`,cur);if(cur)classSelect.value=cur;}
  const multi=document.getElementById('masterAssignClassesV696');if(multi){const selected=[...multi.selectedOptions].map(o=>o.value);multi.innerHTML=masterOptionsV696(masterDataV696.classes,'tenLop',r=>`${r.tenLop}${r.nhomSo?' · '+r.nhomSo:''}`);[...multi.options].forEach(o=>o.selected=selected.includes(o.value));}
}
function renderMasterSummaryV696(){
  const s=masterDataV696.summary||{},box=document.getElementById('masterSummaryV696');if(!box)return;
  const warn=(Number(s.missingCredential||0)+Number(s.assignmentMissingTeacher||0)+Number(s.gvcnMissingTeacher||0)+Number(s.teamMissingTeacher||0)+(s.duplicateGvcnClasses||[]).length);
  box.innerHTML=`
    <div class="master-metric-v696"><span>Giáo viên</span><strong>${Number(s.teachers||0)}</strong></div>
    <div class="master-metric-v696"><span>Phân công dạy</span><strong>${Number(s.assignments||0)}</strong></div>
    <div class="master-metric-v696"><span>GVCN</span><strong>${Number(s.gvcns||0)}</strong></div>
    <div class="master-metric-v696"><span>Tổ/TTCM</span><strong>${Number(s.teams||0)}</strong></div>
    <div class="master-metric-v696 ${warn?'has-warning':''}"><span>Cần kiểm tra</span><strong>${warn}</strong></div>`;
  const w=document.getElementById('masterWarningV696');if(!w)return;
  const items=[];
  if(s.missingCredential)items.push(`${s.missingCredential} giáo viên chưa có credential đăng nhập`);
  if(s.assignmentMissingTeacher)items.push(`${s.assignmentMissingTeacher} phân công không khớp hồ sơ giáo viên`);
  if(s.gvcnMissingTeacher)items.push(`${s.gvcnMissingTeacher} GVCN không khớp hồ sơ giáo viên`);
  if(s.teamMissingTeacher)items.push(`${s.teamMissingTeacher} dòng tổ chuyên môn không khớp hồ sơ giáo viên`);
  if((s.duplicateGvcnClasses||[]).length)items.push(`Lớp trùng GVCN: ${(s.duplicateGvcnClasses||[]).join(', ')}`);
  w.classList.toggle('d-none',!items.length);w.innerHTML=items.length?'<b>Dữ liệu cần rà soát:</b> '+items.map(escV696).join(' · '):'';
}
function filterTextV696(id){return String(document.getElementById(id)?.value||'').trim().toLowerCase();}
function renderMasterTeachersV696(){
  const q=filterTextV696('masterTeacherSearchV696'),body=document.getElementById('masterTeacherBodyV696');if(!body)return;
  const rows=(masterDataV696.teachers||[]).filter(x=>!q||[x.taiKhoan,x.hoTen,x.cccd,x.email,x.chucVu,...(x.mon||[])].join(' ').toLowerCase().includes(q));
  body.innerHTML=rows.length?rows.map(x=>`<tr>
    <td class="text-nowrap"><b>${escV696(x.taiKhoan)}</b><div class="small ${x.coCredential?'text-success':'text-danger'}">${x.coCredential?'Có đăng nhập':'Thiếu credential'}</div></td>
    <td><b>${escV696(x.hoTen)}</b><div class="small text-muted">${escV696(x.email||'')}</div></td>
    <td>${escV696(x.cccd||'')}</td><td>${escV696(x.chucVu||'')}</td><td>${escV696((x.mon||[]).join(' · '))}</td>
    <td class="text-center">${x.coChuKy?'✅':'—'}</td><td class="text-center">${x.active?'✅':'⛔'}</td>
    <td class="text-nowrap"><button class="btn btn-sm btn-outline-primary" onclick="editMasterTeacherV696('${escV696(x.taiKhoan)}')">Sửa</button></td>
  </tr>`).join(''):'<tr><td colspan="8" class="text-center text-muted py-4">Không có dữ liệu phù hợp.</td></tr>';
}
function renderMasterAssignmentsV696(){
  const q=filterTextV696('masterAssignSearchV696'),body=document.getElementById('masterAssignBodyV696');if(!body)return;
  const rows=(masterDataV696.assignments||[]).filter(x=>!q||[x.taiKhoan,x.hoTen,x.mon,(x.lop||[]).join(' '),x.trangThai,x.ghiChu].join(' ').toLowerCase().includes(q));
  body.innerHTML=rows.length?rows.map(x=>`<tr><td><b>${escV696(x.hoTen||masterTeacherNameV696(x.taiKhoan))}</b><div class="small text-muted">${escV696(x.taiKhoan)}</div></td><td>${escV696(x.mon)}</td><td>${escV696((x.lop||[]).join(', '))}</td><td>${escV696(x.trangThai)}</td><td>${escV696(x.ghiChu||'')}</td><td class="text-nowrap"><button class="btn btn-sm btn-outline-primary" onclick="editMasterAssignmentV696('${escV696(x.id)}')">Sửa</button> <button class="btn btn-sm btn-outline-danger" onclick="deleteMasterAssignmentV696('${escV696(x.id)}')">Xóa</button></td></tr>`).join(''):'<tr><td colspan="6" class="text-center text-muted py-4">Chưa có phân công.</td></tr>';
}
function renderMasterGvcnV696(){
  const q=filterTextV696('masterGvcnSearchV696'),body=document.getElementById('masterGvcnBodyV696');if(!body)return;
  const rows=(masterDataV696.gvcns||[]).filter(x=>!q||[x.taiKhoan,x.hoTen,x.lop].join(' ').toLowerCase().includes(q));
  body.innerHTML=rows.length?rows.map(x=>`<tr><td><b>${escV696(x.lop)}</b></td><td><b>${escV696(x.hoTen||masterTeacherNameV696(x.taiKhoan))}</b><div class="small text-muted">${escV696(x.taiKhoan)}</div></td><td class="text-nowrap"><button class="btn btn-sm btn-outline-primary" onclick="editMasterGvcnV696('${escV696(x.id)}')">Sửa</button> <button class="btn btn-sm btn-outline-danger" onclick="deleteMasterGvcnV696('${escV696(x.id)}')">Xóa</button></td></tr>`).join(''):'<tr><td colspan="3" class="text-center text-muted py-4">Chưa có dữ liệu GVCN.</td></tr>';
}
function renderMasterTeamsV696(){
  const q=filterTextV696('masterTeamSearchV696'),body=document.getElementById('masterTeamBodyV696');if(!body)return;
  const rows=(masterDataV696.teams||[]).filter(x=>!q||[x.taiKhoan,x.hoTen,x.mon,x.chucVu].join(' ').toLowerCase().includes(q));
  body.innerHTML=rows.length?rows.map(x=>`<tr><td>${escV696(x.mon)}</td><td><b>${escV696(x.hoTen||masterTeacherNameV696(x.taiKhoan))}</b><div class="small text-muted">${escV696(x.taiKhoan)}</div></td><td>${escV696(x.chucVu||'')}</td><td class="text-nowrap"><button class="btn btn-sm btn-outline-primary" onclick="editMasterTeamV696('${escV696(x.id)}')">Sửa</button> <button class="btn btn-sm btn-outline-danger" onclick="deleteMasterTeamV696('${escV696(x.id)}')">Xóa</button></td></tr>`).join(''):'<tr><td colspan="4" class="text-center text-muted py-4">Chưa có dữ liệu tổ chuyên môn.</td></tr>';
}
function renderAdminMasterDataV696(){fillMasterDatalistsV696();renderMasterSummaryV696();renderMasterTeachersV696();renderMasterAssignmentsV696();renderMasterGvcnV696();renderMasterTeamsV696();}
async function taiDuLieuGocAdminV696(force=false){
  if(masterLoadedV696&&!force){renderAdminMasterDataV696();return;}
  const status=document.getElementById('masterStatusV696');if(status)status.textContent='Đang tải dữ liệu gốc từ Supabase...';
  try{setBusyV13(true,'Đang tải dữ liệu gốc...');const r=await masterRpcV696('layDuLieuGocAdminV696');if(!r?.success)throw new Error(r?.message||'Không tải được dữ liệu gốc.');masterDataV696=r;masterLoadedV696=true;renderAdminMasterDataV696();if(status)status.textContent=`Đã tải ${r.summary?.teachers||0} giáo viên · ${r.summary?.assignments||0} phân công · V69.6`;}
  catch(e){if(status)status.textContent='Lỗi: '+(e.message||e);showToastV9(e.message||String(e),'danger');}
  finally{setBusyV13(false);}
}
function clearMasterTeacherV696(){['masterTeacherAccountV696','masterTeacherPasswordV696','masterTeacherNameV696','masterTeacherCccdV696','masterTeacherEmailV696','masterTeacherTitleV696','masterTeacherMon1V696','masterTeacherMon2V696','masterTeacherMon3V696'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});const a=document.getElementById('masterTeacherAccountV696');if(a)a.readOnly=false;document.getElementById('masterTeacherModeV696').textContent='Thêm giáo viên';}
function editMasterTeacherV696(account){const x=masterDataV696.teachers.find(t=>t.taiKhoan===account);if(!x)return;document.getElementById('masterTeacherAccountV696').value=x.taiKhoan;document.getElementById('masterTeacherAccountV696').readOnly=true;document.getElementById('masterTeacherPasswordV696').value='';document.getElementById('masterTeacherNameV696').value=x.hoTen||'';document.getElementById('masterTeacherCccdV696').value=x.cccd||'';document.getElementById('masterTeacherEmailV696').value=x.email||'';document.getElementById('masterTeacherTitleV696').value=x.chucVu||'';document.getElementById('masterTeacherMon1V696').value=x.mon?.[0]||'';document.getElementById('masterTeacherMon2V696').value=x.mon?.[1]||'';document.getElementById('masterTeacherMon3V696').value=x.mon?.[2]||'';document.getElementById('masterTeacherModeV696').textContent='Sửa giáo viên';document.getElementById('masterTeacherEditorV696')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
async function saveMasterTeacherV696(){
  const p={taiKhoan:document.getElementById('masterTeacherAccountV696').value,matKhauMoi:document.getElementById('masterTeacherPasswordV696').value,hoTen:document.getElementById('masterTeacherNameV696').value,cccd:document.getElementById('masterTeacherCccdV696').value,email:document.getElementById('masterTeacherEmailV696').value,chucVu:document.getElementById('masterTeacherTitleV696').value,mon:[document.getElementById('masterTeacherMon1V696').value,document.getElementById('masterTeacherMon2V696').value,document.getElementById('masterTeacherMon3V696').value]};
  try{setBusyV13(true,'Đang lưu giáo viên...');const r=await masterRpcV696('luuGiaoVienAdminV696',[p]);if(!r?.success)throw new Error(r?.message||'Không lưu được.');showToastV9(r.message,'success');clearMasterTeacherV696();masterLoadedV696=false;await taiDuLieuGocAdminV696(true);}
  catch(e){alertV13('❌ '+(e.message||e));}finally{setBusyV13(false);}
}
function clearMasterAssignmentV696(){document.getElementById('masterAssignIdV696').value='';document.getElementById('masterAssignTeacherV696').value='';document.getElementById('masterAssignSubjectV696').value='';document.getElementById('masterAssignStatusV696').value='Đang dùng';document.getElementById('masterAssignNoteV696').value='';[...document.getElementById('masterAssignClassesV696').options].forEach(o=>o.selected=false);document.getElementById('masterAssignModeV696').textContent='Thêm phân công';}
function editMasterAssignmentV696(id){const x=masterDataV696.assignments.find(t=>t.id===id);if(!x)return;document.getElementById('masterAssignIdV696').value=x.id;document.getElementById('masterAssignTeacherV696').value=x.taiKhoan;document.getElementById('masterAssignSubjectV696').value=x.mon||'';document.getElementById('masterAssignStatusV696').value=x.trangThai||'Đang dùng';document.getElementById('masterAssignNoteV696').value=x.ghiChu||'';[...document.getElementById('masterAssignClassesV696').options].forEach(o=>o.selected=(x.lop||[]).includes(o.value));document.getElementById('masterAssignModeV696').textContent='Sửa phân công';document.getElementById('masterAssignEditorV696')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
async function saveMasterAssignmentV696(){const p={id:document.getElementById('masterAssignIdV696').value,taiKhoan:document.getElementById('masterAssignTeacherV696').value,mon:document.getElementById('masterAssignSubjectV696').value,lop:[...document.getElementById('masterAssignClassesV696').selectedOptions].map(o=>o.value),trangThai:document.getElementById('masterAssignStatusV696').value,ghiChu:document.getElementById('masterAssignNoteV696').value};try{setBusyV13(true,'Đang lưu phân công...');const r=await masterRpcV696('luuPhanCongDayAdminV696',[p]);if(!r?.success)throw new Error(r?.message||'Không lưu được.');showToastV9(r.message,'success');clearMasterAssignmentV696();masterLoadedV696=false;await taiDuLieuGocAdminV696(true);}catch(e){alertV13('❌ '+(e.message||e));}finally{setBusyV13(false);}}
async function deleteMasterAssignmentV696(id){if(!await confirmV13('Xóa phân công dạy hiện hành này? Dữ liệu Sổ đầu bài đã ghi trước đây không bị xóa.',{title:'Xóa phân công',confirmText:'Xóa'}))return;try{setBusyV13(true,'Đang xóa phân công...');const r=await masterRpcV696('xoaPhanCongDayAdminV696',[id]);if(!r?.success)throw new Error(r?.message||'Không xóa được.');showToastV9(r.message,'success');masterLoadedV696=false;await taiDuLieuGocAdminV696(true);}catch(e){alertV13('❌ '+(e.message||e));}finally{setBusyV13(false);}}
function clearMasterGvcnV696(){document.getElementById('masterGvcnIdV696').value='';document.getElementById('masterGvcnTeacherV696').value='';document.getElementById('masterGvcnClassV696').value='';document.getElementById('masterGvcnModeV696').textContent='Phân công GVCN';}
function editMasterGvcnV696(id){const x=masterDataV696.gvcns.find(t=>t.id===id);if(!x)return;document.getElementById('masterGvcnIdV696').value=x.id;document.getElementById('masterGvcnTeacherV696').value=x.taiKhoan;document.getElementById('masterGvcnClassV696').value=x.lop;document.getElementById('masterGvcnModeV696').textContent='Sửa GVCN';}
async function saveMasterGvcnV696(){const p={id:document.getElementById('masterGvcnIdV696').value,taiKhoan:document.getElementById('masterGvcnTeacherV696').value,lop:document.getElementById('masterGvcnClassV696').value};try{setBusyV13(true,'Đang lưu GVCN...');const r=await masterRpcV696('luuGvcnAdminV696',[p]);if(!r?.success)throw new Error(r?.message||'Không lưu được.');showToastV9(r.message,'success');clearMasterGvcnV696();masterLoadedV696=false;await taiDuLieuGocAdminV696(true);}catch(e){alertV13('❌ '+(e.message||e));}finally{setBusyV13(false);}}
async function deleteMasterGvcnV696(id){if(!await confirmV13('Xóa phân công GVCN hiện hành này?',{title:'Xóa GVCN',confirmText:'Xóa'}))return;try{setBusyV13(true,'Đang xóa GVCN...');const r=await masterRpcV696('xoaGvcnAdminV696',[id]);if(!r?.success)throw new Error(r?.message||'Không xóa được.');showToastV9(r.message,'success');masterLoadedV696=false;await taiDuLieuGocAdminV696(true);}catch(e){alertV13('❌ '+(e.message||e));}finally{setBusyV13(false);}}
function clearMasterTeamV696(){document.getElementById('masterTeamIdV696').value='';document.getElementById('masterTeamTeacherV696').value='';document.getElementById('masterTeamSubjectV696').value='';document.getElementById('masterTeamTitleV696').value='Tổ trưởng';document.getElementById('masterTeamModeV696').textContent='Thêm tổ/TTCM';}
function editMasterTeamV696(id){const x=masterDataV696.teams.find(t=>t.id===id);if(!x)return;document.getElementById('masterTeamIdV696').value=x.id;document.getElementById('masterTeamTeacherV696').value=x.taiKhoan;document.getElementById('masterTeamSubjectV696').value=x.mon;document.getElementById('masterTeamTitleV696').value=x.chucVu||'Tổ trưởng';document.getElementById('masterTeamModeV696').textContent='Sửa tổ/TTCM';}
async function saveMasterTeamV696(){const p={id:document.getElementById('masterTeamIdV696').value,taiKhoan:document.getElementById('masterTeamTeacherV696').value,mon:document.getElementById('masterTeamSubjectV696').value,chucVu:document.getElementById('masterTeamTitleV696').value};try{setBusyV13(true,'Đang lưu tổ chuyên môn...');const r=await masterRpcV696('luuToChuyenMonAdminV696',[p]);if(!r?.success)throw new Error(r?.message||'Không lưu được.');showToastV9(r.message,'success');clearMasterTeamV696();masterLoadedV696=false;await taiDuLieuGocAdminV696(true);}catch(e){alertV13('❌ '+(e.message||e));}finally{setBusyV13(false);}}
async function deleteMasterTeamV696(id){if(!await confirmV13('Xóa dòng tổ chuyên môn này? Tài khoản sẽ mất quyền TTCM tự động tương ứng sau khi đăng nhập lại.',{title:'Xóa tổ/TTCM',confirmText:'Xóa'}))return;try{setBusyV13(true,'Đang xóa tổ chuyên môn...');const r=await masterRpcV696('xoaToChuyenMonAdminV696',[id]);if(!r?.success)throw new Error(r?.message||'Không xóa được.');showToastV9(r.message,'success');masterLoadedV696=false;await taiDuLieuGocAdminV696(true);}catch(e){alertV13('❌ '+(e.message||e));}finally{setBusyV13(false);}}

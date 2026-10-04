/* ========================================================================
   SODB V69.3.2 STABLE - ĐIỀU HÀNH TIẾT DẠY & NHÂN SỰ
   ======================================================================== */
let externalStaffCacheV693=[];
let externalProgramsCacheV7044=[];
let currentExternalProgramPolicyV7044=null;
let operationalTeachersV693=[];
let teachingOpsCacheV693=[];
let teacherAbsenceCacheV693=[];
let myTeachingTasksCacheV693=[];
let currentInputOperationV693=null;
let operationalClassesV6953=[];
let operationalSubjectsV6953=[];
let controlCatalogLoadedV6953=false;
let controlCatalogLoadedAtV6954=0;
let controlTeachersLoadedAtV6954=0;
let controlDashboardSummaryCacheV6954={};
let controlDataLoadedAtV6954=0;
let externalStaffLoadedAtV6954=0;

function schoolTodayV693(){
  try{if(typeof schoolDateV20==='function')return schoolDateV20();}catch(_e){}
  const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;
}
function addDaysClientV693(date,days){const d=new Date(String(date)+'T00:00:00');d.setDate(d.getDate()+Number(days||0));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function splitScopeV693(v){return String(v||'').split(/[;,\n]+/).map(x=>x.trim()).filter(Boolean);}
function controlSessionV693(){
  const s=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};
  return s.ADMIN||s.BGH||s.GIAM_THI||null;
}
function controlAuthV693(){const s=controlSessionV693();return {token:s&&s.sessionToken||''};}
function controlRolesV693(){return currentUnifiedLoginV4&&Array.isArray(currentUnifiedLoginV4.roles)?currentUnifiedLoginV4.roles:[];}
function canApproveControlV693(){const r=controlRolesV693();return r.includes('ADMIN')||r.includes('BGH');}
function canManageExternalV693(){return canApproveControlV693();}
function teacherV693(account){return operationalTeachersV693.find(x=>String(x.taiKhoan||'')===String(account||''))||null;}
function syncTeacherNameV693(accountId,nameId){const a=document.getElementById(accountId)?.value||'',n=document.getElementById(nameId);if(!n)return;const t=teacherV693(a);if(t)n.value=t.hoTen||a;}
function renderTeacherDatalistV693(){const d=document.getElementById('teacherAccountsV693');if(!d)return;d.innerHTML=operationalTeachersV693.map(x=>`<option value="${escV693(x.taiKhoan)}">${escV693(x.hoTen||x.taiKhoan)} · ${escV693((x.mon||[]).join(', '))}</option>`).join('');}
function uniqTextV6953(values){const out=[],seen=new Set();(values||[]).forEach(v=>{v=String(v||'').trim();const k=typeof normalizeTextKey==='function'?normalizeTextKey(v):v.toLowerCase();if(v&&!seen.has(k)){seen.add(k);out.push(v);}});return out;}
function setSelectValueV6953(id,value){const el=document.getElementById(id);if(!el)return;setSelectValueV6953FromElement(el,value);}function setSelectValueV6953FromElement(el,value){if(!el)return;value=String(value||'').trim();if(value&&![...el.options].some(o=>String(o.value)===value))el.add(new Option(value,value));el.value=value;}
function fillSelectV6953(el,values,emptyLabel){if(!el)return;const current=String(el.value||''),label=emptyLabel||el.options?.[0]?.textContent||'-- Chọn --';el.innerHTML='';el.add(new Option(label,''));(values||[]).forEach(v=>el.add(new Option(v,v)));if(current&&[...el.options].some(o=>o.value===current))el.value=current;}
function updateOperationalSubjectsV6953(extra){const all=['Kỹ năng số','Tiếng Anh bản ngữ','Tin học quốc tế'];externalProgramsCacheV7044.filter(x=>x.trangThai==='DANG_HOAT_DONG').forEach(x=>all.push(x.tenMon));operationalTeachersV693.forEach(x=>(x.mon||[]).forEach(m=>all.push(m)));Object.values(classMetaV26||{}).forEach(x=>{if(x&&x.subject)all.push(x.subject);});(extra||[]).forEach(m=>all.push(m));operationalSubjectsV6953=(typeof canonicalSubjectListV6955==='function'?canonicalSubjectListV6955(all):uniqTextV6953(all)).sort((a,b)=>a.localeCompare(b,'vi'));populateControlCatalogSelectorsV6953();}
function scopePickerConfigV6953(inputId){const map={
  externalClassesV693:{menu:'externalClassesMenuV6953',summary:'externalClassesSummaryV6953',values:()=>operationalClassesV6953,all:'Tất cả lớp'},
  externalSubjectsV693:{menu:'externalSubjectsMenuV6953',summary:'externalSubjectsSummaryV6953',values:()=>operationalSubjectsV6953,all:'Tất cả môn'},
  proxyClassesV693:{menu:'proxyClassesMenuV6953',summary:'proxyClassesSummaryV6953',values:()=>operationalClassesV6953,all:'Tất cả lớp'},
  proxySubjectsV693:{menu:'proxySubjectsMenuV6953',summary:'proxySubjectsSummaryV6953',values:()=>operationalSubjectsV6953,all:'Tất cả môn'}
};return map[inputId]||null;}
function updateScopeSummaryV6953(inputId){const cfg=scopePickerConfigV6953(inputId),input=document.getElementById(inputId);if(!cfg||!input)return;const vals=splitScopeV693(input.value),sum=document.getElementById(cfg.summary);if(sum)sum.textContent=!vals.length?cfg.all:(vals.length<=2?vals.join(', '):`${vals.length} mục đã chọn`);}
function syncScopePickerV6953(inputId){const cfg=scopePickerConfigV6953(inputId),input=document.getElementById(inputId),menu=cfg&&document.getElementById(cfg.menu);if(!cfg||!input||!menu)return;const picked=[...menu.querySelectorAll('input[type="checkbox"][data-scope-value]:checked')].map(x=>x.dataset.scopeValue||'');input.value=picked.join('; ');updateScopeSummaryV6953(inputId);}
function renderScopePickerV6953(inputId){const cfg=scopePickerConfigV6953(inputId),input=document.getElementById(inputId),menu=cfg&&document.getElementById(cfg.menu);if(!cfg||!input||!menu)return;const selected=new Set(splitScopeV693(input.value));const values=cfg.values();menu.innerHTML=`<div class="d-flex justify-content-between align-items-center px-1 pb-2 mb-1 border-bottom"><span class="small fw-bold text-muted">Chọn ${cfg.all.toLowerCase().replace('tất cả ','')}</span><button type="button" class="btn btn-sm btn-link p-0 text-decoration-none" onclick="clearScopePickerV6953('${inputId}')">Bỏ chọn</button></div>`+values.map((v,i)=>`<label class="dropdown-item d-flex align-items-center gap-2 py-1 px-2 rounded"><input class="form-check-input mt-0" type="checkbox" data-scope-value="${escV693(v)}" ${selected.has(v)?'checked':''} onchange="syncScopePickerV6953('${inputId}')"><span>${escV693(v)}</span></label>`).join('');updateScopeSummaryV6953(inputId);}
function clearScopePickerV6953(inputId){const cfg=scopePickerConfigV6953(inputId),input=document.getElementById(inputId),menu=cfg&&document.getElementById(cfg.menu);if(input)input.value='';if(menu)menu.querySelectorAll('input[type="checkbox"]').forEach(x=>x.checked=false);updateScopeSummaryV6953(inputId);}
function setScopePickerValuesV6953(inputId,values){const input=document.getElementById(inputId);if(!input)return;input.value=uniqTextV6953(values||[]).join('; ');renderScopePickerV6953(inputId);}
function populateControlCatalogSelectorsV6953(){
  document.querySelectorAll('.control-class-select-v6953').forEach(el=>{const allLabel=el.id==='advReportClassV694'?'Tất cả lớp':el.id==='groupReportClassV6951'?'Tất cả lớp/nhóm':(el.id.startsWith('swap')?'-- Lớp --':'-- Chọn lớp --');fillSelectV6953(el,operationalClassesV6953,allLabel);});
  document.querySelectorAll('.control-subject-select-v6953').forEach(el=>{const allLabel=el.id==='advReportSubjectV694'?'Tất cả môn':(el.id.startsWith('swap')?'-- Môn --':'-- Chọn môn --');fillSelectV6953(el,operationalSubjectsV6953,allLabel);});
  document.querySelectorAll('#absencePeriodsV693 .absence-period-row-v693').forEach(row=>{const c=row.querySelector('.ap-class-v693'),m=row.querySelector('.ap-subject-v693');fillSelectV6953(c,operationalClassesV6953,'-- Chọn lớp --');fillSelectV6953(m,operationalSubjectsV6953,'-- Chọn môn --');});
  ['externalClassesV693','externalSubjectsV693','proxyClassesV693','proxySubjectsV693'].forEach(renderScopePickerV6953);
}
function taiDanhMucLopMonDieuHanhV6953(force=false){
  const now=Date.now();
  if(!force&&controlCatalogLoadedV6953&&(now-controlCatalogLoadedAtV6954)<600000){populateControlCatalogSelectorsV6953();if(typeof renderMaTranKhungTietV704633==='function')renderMaTranKhungTietV704633();return;}
  const fromBootstrap=[];
  try{['10','11','12'].forEach(k=>(dsLopTheoKhoi?.[k]||[]).forEach(x=>fromBootstrap.push(x)));}catch(_e){}
  if(fromBootstrap.length){
    operationalClassesV6953=uniqTextV6953(fromBootstrap).sort((a,b)=>a.localeCompare(b,'vi',{numeric:true}));
    controlCatalogLoadedV6953=true;controlCatalogLoadedAtV6954=now;
    updateOperationalSubjectsV6953([]);populateControlCatalogSelectorsV6953();if(typeof renderMaTranKhungTietV704633==='function')renderMaTranKhungTietV704633();
    return;
  }
  google.script.run.withSuccessHandler(res=>{if(res&&res.success){const all=[];Object.values(res.classes||{}).forEach(a=>(a||[]).forEach(x=>all.push(x)));operationalClassesV6953=uniqTextV6953(all).sort((a,b)=>a.localeCompare(b,'vi',{numeric:true}));if(res.classMeta)classMetaV26=Object.assign({},classMetaV26||{},typeof normalizeClassMetaV29==='function'?normalizeClassMetaV29(res.classMeta):res.classMeta);controlCatalogLoadedV6953=true;controlCatalogLoadedAtV6954=Date.now();updateOperationalSubjectsV6953([]);populateControlCatalogSelectorsV6953();if(typeof renderMaTranKhungTietV704633==='function')renderMaTranKhungTietV704633();}}).getDanhSachLopMoiV29(false);
}
function taiDanhMucGiaoVienV693(force=false){
  const auth=controlAuthV693();if(!auth.token)return;
  if(!force&&operationalTeachersV693.length&&(Date.now()-controlTeachersLoadedAtV6954)<600000){renderTeacherDatalistV693();updateOperationalSubjectsV6953([]);return;}
  google.script.run.withSuccessHandler(res=>{
    operationalTeachersV693=res&&res.success?res.data||[]:[];controlTeachersLoadedAtV6954=Date.now();renderTeacherDatalistV693();updateOperationalSubjectsV6953([]);
    if(!operationalSubjectsV6953.length&&(controlRolesV693().includes('ADMIN')||controlRolesV693().includes('BGH'))){google.script.run.withSuccessHandler(r=>{if(r&&r.success)updateOperationalSubjectsV6953(r.data||[]);}).getDanhSachMonAdminV7(controlAuthV693());}
  }).layDanhSachGiaoVienDieuHanhV693(auth);
}
function escV693(v){return typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function statusBadgeV693(v){const s=String(v||'');const map={CHO_DUYET:'warning',DA_DUYET:'primary',HOAN_THANH:'success',TU_CHOI:'danger',HUY:'secondary',DANG_HOAT_DONG:'success',TAM_DUNG:'warning',NGUNG_HOAT_DONG:'secondary'};return `<span class="badge text-bg-${map[s]||'secondary'}">${escV693(s.replaceAll('_',' '))}</span>`;}
function operationLabelV693(v){return ({DAY_THAY:'Dạy thay',DAY_BU:'Dạy bù',HOAN_DOI:'Hoán đổi',LIEN_KET:'Tiết liên kết'})[String(v||'')]||String(v||'');}
function slotLabelV693(r,prefix){const P=prefix||'';const d=r[P+'Date']||r[P+'ngay']||'',lop=r[P+'Class']||r[P+'lop']||'',buoi=r[P+'Session']||r[P+'buoi']||'',t=r[P+'Period']||r[P+'tiet']||'',mon=r[P+'Subject']||r[P+'mon']||'';return [d,lop,buoi&&t?`${buoi}-T${t}`:buoi||t,mon].filter(Boolean).join(' · ');}

function initControlDatesV693(){
  const t=schoolTodayV693();
  ['opOriginDateV693','opExecDateV693','swapADateV693','swapBDateV693','absenceFromV693','absenceToV693','externalFromV693','proxyFromV693','opFilterFromV693','opFilterToV693'].forEach(id=>{const x=document.getElementById(id);if(x&&!x.value)x.value=t;});
  const to=document.getElementById('proxyToV693');if(to&&!to.value)to.value=addDaysClientV693(t,30);
}
function initControlV693(force=false){
  initControlDatesV693();taiDanhMucLopMonDieuHanhV6953(force);taiDanhMucGiaoVienV693(force);doiLoaiDieuHanhV693();
  const proxyTab=document.querySelector('#tabControlV693 [data-bs-target="#control-proxy-v693"]');if(proxyTab?.closest('li'))proxyTab.closest('li').classList.toggle('d-none',!canApproveControlV693());
  const extPane=document.getElementById('control-external-v693'),extForm=extPane?.querySelector('.card');if(extForm)extForm.classList.toggle('d-none',!canManageExternalV693());
  const isAdmin=controlRolesV693().includes('ADMIN');document.querySelectorAll('#tabControlV693 .admin-only-control-v6953').forEach(x=>x.classList.toggle('d-none',!isAdmin));
  if(!document.querySelector('#absencePeriodsV693 .absence-period-row-v693'))themDongTietNghiV693();populateControlCatalogSelectorsV6953();
  const now=Date.now();
  if(force||(now-controlDataLoadedAtV6954)>30000){taiTongQuanDieuHanhV693();taiDieuHanhV693();controlDataLoadedAtV6954=now;}
  if(force||!externalProgramsCacheV7044.length){taiChuongTrinhNgoaiV7044(true);}
  if(force||!externalStaffCacheV693.length||(now-externalStaffLoadedAtV6954)>600000){taiNhanSuNgoaiV693(true);}
  try{apDungHienThiKyThayHangLoatV704645();}catch(_e){}
}
function taiTongQuanDieuHanhV693(){const auth=controlAuthV693();if(!auth.token)return;google.script.run.withSuccessHandler(res=>{if(!res||!res.success)return;const m=res.metrics||{};document.querySelectorAll('#controlSummaryV693 [data-metric]').forEach(x=>x.textContent=String(m[x.dataset.metric]??0));}).tongQuanDieuHanhV693(schoolTodayV693(),auth);}

function openControlTabV693(){const tab=document.getElementById('control-tab-v693');if(!tab)return;try{if(window.bootstrap)bootstrap.Tab.getOrCreateInstance(tab).show();else tab.click();}catch(_e){tab.click();}}
function refreshDashboardControlSummaryV693(force=false){
  const box=document.getElementById('overviewControlV693');if(!box)return;
  const allowed=controlRolesV693().some(r=>['GIAM_THI','BGH','ADMIN'].includes(r));
  box.classList.toggle('d-none',!allowed);if(!allowed)return;
  const auth=controlAuthV693();if(!auth.token)return;
  const date=document.getElementById('overviewDateV20')?.value||schoolTodayV693();
  const cached=controlDashboardSummaryCacheV6954[date];
  if(!force&&cached&&(Date.now()-cached.ts)<90000){const m=cached.metrics||{};document.querySelectorAll('#overviewControlMetricsV693 [data-metric]').forEach(x=>x.textContent=String(m[x.dataset.metric]??0));return;}
  google.script.run.withSuccessHandler(res=>{if(!res||!res.success)return;const m=res.metrics||{};controlDashboardSummaryCacheV6954[date]={ts:Date.now(),metrics:m};document.querySelectorAll('#overviewControlMetricsV693 [data-metric]').forEach(x=>x.textContent=String(m[x.dataset.metric]??0));}).tongQuanDieuHanhV693(date,auth);
}

function doiLoaiDieuHanhV693(){const type=String(document.getElementById('opTypeV693')?.value||'DAY_THAY');document.getElementById('opOriginSectionV7044')?.classList.toggle('d-none',type==='LIEN_KET');if(type==='HOAN_DOI'||type==='LIEN_KET'){const a=document.getElementById('opAbsenceIdV693');if(a)a.value='';}document.getElementById('opSingleV693')?.classList.toggle('d-none',type==='HOAN_DOI');document.getElementById('opSwapV693')?.classList.toggle('d-none',type!=='HOAN_DOI');if(type==='DAY_BU'){const b=document.getElementById('opExecSessionV693');if(b)b.value='Dạy bù';}}
function onOpExternalStaffChangeV693(){const id=document.getElementById('opExternalStaffV693')?.value||'';if(!id){const proxy=document.getElementById('opProxyAccountV693');if(proxy)proxy.disabled=false;return;}const r=externalStaffCacheV693.find(x=>x.id===id);const a=document.getElementById('opExecTeacherAccountV693'),n=document.getElementById('opExecTeacherNameV693');if(a)a.value='';if(n)n.value=r?.hoTen||'';const proxy=document.getElementById('opProxyAccountV693');if(proxy){proxy.disabled=r?.phuongThucKy==='SELF_SIGN';if(proxy.disabled)proxy.value='';}}
function collectSingleOperationV693(){
  const type=String(document.getElementById('opTypeV693').value||'DAY_THAY');
  return {loai:type,absenceId:document.getElementById('opAbsenceIdV693')?.value||'',ngayGoc:document.getElementById('opOriginDateV693').value,lopGoc:document.getElementById('opOriginClassV693').value,buoiGoc:document.getElementById('opOriginSessionV693').value,tietGoc:Number(document.getElementById('opOriginPeriodV693').value||0),monGoc:canonicalSubjectV6955(document.getElementById('opOriginSubjectV693').value),gvGocAccount:document.getElementById('opOriginTeacherAccountV693').value,gvGocName:document.getElementById('opOriginTeacherNameV693').value,ngayThucHien:document.getElementById('opExecDateV693').value,lopThucHien:document.getElementById('opExecClassV693').value,buoiThucHien:document.getElementById('opExecSessionV693').value,tietThucHien:Number(document.getElementById('opExecPeriodV693').value||0),monThucHien:canonicalSubjectV6955(document.getElementById('opExecSubjectV693').value),gvThucHienAccount:document.getElementById('opExecTeacherAccountV693').value,gvThucHienName:document.getElementById('opExecTeacherNameV693').value,externalStaffId:document.getElementById('opExternalStaffV693').value,proxySignerAccount:document.getElementById('opProxyAccountV693').value,proxySignerName:document.getElementById('opProxyNameV693').value,lyDo:document.getElementById('opReasonV693').value,choDuyetNgay:true};
}
function collectSwapSideV693(letter){return {ngay:document.getElementById(`swap${letter}DateV693`).value,lop:document.getElementById(`swap${letter}ClassV693`).value,buoi:document.getElementById(`swap${letter}SessionV693`).value,tiet:Number(document.getElementById(`swap${letter}PeriodV693`).value||0),mon:document.getElementById(`swap${letter}SubjectV693`).value,gvAccount:document.getElementById(`swap${letter}AccountV693`).value,gvName:document.getElementById(`swap${letter}NameV693`).value};}
function luuDieuHanhV693(){
  const type=String(document.getElementById('opTypeV693')?.value||'DAY_THAY');let payload;
  if(type==='HOAN_DOI')payload={loai:type,veA:collectSwapSideV693('A'),veB:collectSwapSideV693('B'),lyDo:document.getElementById('opReasonV693').value,choDuyetNgay:true};else payload=collectSingleOperationV693();
  if(!String(payload.lyDo||'').trim()){showToastV9('Vui lòng nhập lý do/căn cứ điều hành.','danger');return;}
  setBusyV13(true,'Đang lưu hồ sơ điều hành...');google.script.run.withSuccessHandler(res=>{setBusyV13(false);if(!res||!res.success){showToastV9(res&&res.message||'Không lưu được hồ sơ.','danger');return;}showToastV9(res.message||'Đã lưu.','success');taiDieuHanhV693();taiTongQuanDieuHanhV693();}).withFailureHandler(err=>{setBusyV13(false);showToastV9(err&&err.message||String(err),'danger');}).luuDieuHanhTietDayV693(payload,controlAuthV693());
}
function taiDieuHanhV693(){const body=document.getElementById('opBodyV693');if(!body)return;body.innerHTML='<tr><td colspan="8" class="text-center text-muted">Đang tải...</td></tr>';const filters={from:document.getElementById('opFilterFromV693')?.value||'',to:document.getElementById('opFilterToV693')?.value||'',loai:document.getElementById('opFilterTypeV693')?.value||'ALL',trangThai:document.getElementById('opFilterStatusV693')?.value||'ALL'};google.script.run.withSuccessHandler(res=>{if(!res||!res.success){body.innerHTML=`<tr><td colspan="8" class="text-center text-danger">${escV693(res&&res.message||'Lỗi')}</td></tr>`;return;}teachingOpsCacheV693=res.data||[];renderTeachingOpsV693();}).withFailureHandler(err=>body.innerHTML=`<tr><td colspan="8" class="text-center text-danger">${escV693(err&&err.message||String(err))}</td></tr>`).layDieuHanhTietDayV693(filters,controlAuthV693());}
function renderTeachingOpsV693(){const body=document.getElementById('opBodyV693');if(!body)return;const groups=new Map();teachingOpsCacheV693.forEach(r=>{const k=r.nhomId||r.id;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);});const rows=[...groups.values()];if(!rows.length){body.innerHTML='<tr><td colspan="8" class="text-center text-muted">Chưa có hồ sơ điều hành.</td></tr>';return;}body.innerHTML=rows.map(g=>{const r=g[0],swap=r.loai==='HOAN_DOI';const origin=swap?g.map(x=>`${escV693(x.ngayGoc)} ${escV693(x.lopGoc)} ${escV693(x.buoiGoc)}-T${x.tietGoc} ${escV693(x.monGoc)}`).join('<hr class="my-1">'):`${escV693(r.ngayGoc)} ${escV693(r.lopGoc)} ${escV693(r.buoiGoc)}-T${r.tietGoc} ${escV693(r.monGoc)}`;const exec=swap?g.map(x=>`${escV693(x.ngayThucHien)} ${escV693(x.lopThucHien)} ${escV693(x.buoiThucHien)}-T${x.tietThucHien} ${escV693(x.monThucHien)}`).join('<hr class="my-1">'):`${escV693(r.ngayThucHien)} ${escV693(r.lopThucHien)} ${escV693(r.buoiThucHien)}-T${r.tietThucHien} ${escV693(r.monThucHien)}`;const teacher=g.map(x=>escV693(x.gvThucHienName||x.gvThucHienAccount||'')).join('<hr class="my-1">');const complete=g.filter(x=>x.trangThai==='HOAN_THANH').length;const state=swap&&complete>0&&complete<g.length?`${statusBadgeV693('DA_DUYET')}<br><small>Đã thực hiện ${complete}/${g.length} vế</small>`:statusBadgeV693(r.trangThai);const actions=r.trangThai==='CHO_DUYET'&&canApproveControlV693()?`<button class="btn btn-sm btn-success me-1" onclick="duyetDieuHanhV693('${escV693(r.nhomId)}','DA_DUYET')">Duyệt</button><button class="btn btn-sm btn-outline-danger" onclick="duyetDieuHanhV693('${escV693(r.nhomId)}','TU_CHOI')">Từ chối</button>`:(r.trangThai==='DA_DUYET'&&canApproveControlV693()?`<button class="btn btn-sm btn-outline-secondary" onclick="duyetDieuHanhV693('${escV693(r.nhomId)}','HUY')">Hủy hồ sơ</button>`:'');return `<tr><td><strong>${escV693(r.maHoSo)}</strong></td><td>${escV693(operationLabelV693(r.loai))}</td><td>${origin}</td><td>${exec}</td><td>${teacher}</td><td>${state}</td><td>${escV693(r.lyDo)}</td><td>${actions||'—'}</td></tr>`;}).join('');}
function duyetDieuHanhV693(groupId,decision){const note=prompt(decision==='DA_DUYET'?'Ý kiến duyệt (có thể để trống):':'Lý do từ chối/hủy:','');if(note===null)return;google.script.run.withSuccessHandler(res=>{if(!res||!res.success){showToastV9(res&&res.message||'Không xử lý được.','danger');return;}showToastV9(res.message||'Đã xử lý.','success');taiDieuHanhV693();taiTongQuanDieuHanhV693();}).duyetDieuHanhTietDayV693(groupId,decision,note,controlAuthV693());}

function themDongTietNghiV693(data){const box=document.getElementById('absencePeriodsV693');if(!box)return;const d=data||{};const row=document.createElement('div');row.className='row g-2 align-items-end border rounded p-2 mt-2 absence-period-row-v693';row.innerHTML=`<div class="col-md-2"><label class="form-label small">Ngày</label><input type="date" class="form-control ap-date-v693" value="${escV693(d.ngayDay||document.getElementById('absenceFromV693')?.value||schoolTodayV693())}"></div><div class="col-md-2"><label class="form-label small">Lớp</label><select class="form-select ap-class-v693"><option value="">-- Chọn lớp --</option></select></div><div class="col-md-2"><label class="form-label small">Buổi</label><select class="form-select ap-session-v693"><option${d.buoi==='Sáng'?' selected':''}>Sáng</option><option${d.buoi==='Chiều'?' selected':''}>Chiều</option></select></div><div class="col-md-1"><label class="form-label small">Tiết</label><input type="number" min="1" max="15" class="form-control ap-period-v693" value="${Number(d.tiet||1)}"></div><div class="col-md-3"><label class="form-label small">Môn</label><select class="form-select ap-subject-v693"><option value="">-- Chọn môn --</option></select></div><div class="col-md-2"><button type="button" class="btn btn-outline-danger w-100" onclick="this.closest('.absence-period-row-v693').remove()">Xóa</button></div>`;box.appendChild(row);fillSelectV6953(row.querySelector('.ap-class-v693'),operationalClassesV6953,'-- Chọn lớp --');fillSelectV6953(row.querySelector('.ap-subject-v693'),operationalSubjectsV6953,'-- Chọn môn --');if(d.lop)setSelectValueV6953FromElement(row.querySelector('.ap-class-v693'),d.lop);if(d.mon)setSelectValueV6953FromElement(row.querySelector('.ap-subject-v693'),canonicalSubjectV6955(d.mon));}
function collectAbsencePeriodsV693(){return [...document.querySelectorAll('#absencePeriodsV693 .absence-period-row-v693')].map(r=>({ngayDay:r.querySelector('.ap-date-v693').value,lop:r.querySelector('.ap-class-v693').value,buoi:r.querySelector('.ap-session-v693').value,tiet:Number(r.querySelector('.ap-period-v693').value||0),mon:canonicalSubjectV6955(r.querySelector('.ap-subject-v693').value)})).filter(x=>x.ngayDay&&x.lop&&x.tiet);}
function luuHoSoNghiV693(){const payload={teacherAccount:document.getElementById('absenceAccountV693').value,teacherName:document.getElementById('absenceNameV693').value,tuNgay:document.getElementById('absenceFromV693').value,denNgay:document.getElementById('absenceToV693').value,phamVi:document.getElementById('absenceScopeV693').value,nhomLyDo:document.getElementById('absenceReasonTypeV693').value,lyDo:document.getElementById('absenceReasonV693').value,canDayThay:document.getElementById('absenceNeedSubV693').checked,canDayBu:document.getElementById('absenceNeedMakeupV693').checked,tietAnhHuong:collectAbsencePeriodsV693(),choDuyetNgay:true};if(!payload.teacherName.trim()||!payload.tuNgay||!payload.lyDo.trim()){showToastV9('Cần nhập giáo viên, ngày nghỉ và lý do.','danger');return;}google.script.run.withSuccessHandler(res=>{if(!res||!res.success){showToastV9(res&&res.message||'Không lưu được.','danger');return;}showToastV9(res.message||'Đã lưu hồ sơ nghỉ.','success');taiHoSoNghiV693();taiTongQuanDieuHanhV693();}).luuHoSoNghiGiaoVienV693(payload,controlAuthV693());}
function taiHoSoNghiV693(){const body=document.getElementById('absenceBodyV693');if(!body)return;body.innerHTML='<tr><td colspan="7" class="text-center text-muted">Đang tải...</td></tr>';google.script.run.withSuccessHandler(res=>{if(!res||!res.success){body.innerHTML=`<tr><td colspan="7" class="text-danger text-center">${escV693(res&&res.message||'Lỗi')}</td></tr>`;return;}teacherAbsenceCacheV693=res.data||[];body.innerHTML=teacherAbsenceCacheV693.length?teacherAbsenceCacheV693.map(r=>{let actions='—';if(r.trangThai==='CHO_DUYET'&&canApproveControlV693())actions=`<button class="btn btn-sm btn-success me-1" onclick="duyetHoSoNghiV693('${escV693(r.id)}','DA_DUYET')">Duyệt</button><button class="btn btn-sm btn-outline-danger" onclick="duyetHoSoNghiV693('${escV693(r.id)}','TU_CHOI')">Từ chối</button>`;else if(r.trangThai==='DA_DUYET'){const parts=[];if(r.canDayThay)parts.push(`<button class="btn btn-sm btn-outline-primary me-1 mb-1" onclick="boTriTuHoSoNghiV693('${escV693(r.id)}','DAY_THAY')">Bố trí thay</button>`);if(r.canDayBu)parts.push(`<button class="btn btn-sm btn-outline-info me-1 mb-1" onclick="boTriTuHoSoNghiV693('${escV693(r.id)}','DAY_BU')">Bố trí bù</button>`);if(canApproveControlV693())parts.push(`<button class="btn btn-sm btn-outline-secondary mb-1" onclick="duyetHoSoNghiV693('${escV693(r.id)}','HUY')">Hủy nghỉ</button>`);actions=parts.join('')||'—';}return `<tr><td><strong>${escV693(r.teacherName)}</strong><br><small>${escV693(r.teacherAccount)}</small></td><td>${escV693(r.tuNgay)} → ${escV693(r.denNgay)}</td><td>${escV693(r.phamVi)}</td><td>${escV693(r.lyDo)}${r.canDayBu?'<br><span class="badge text-bg-info">Cần dạy bù</span>':''}</td><td>${(r.tietAnhHuong||[]).length}</td><td>${statusBadgeV693(r.trangThai)}</td><td>${actions}</td></tr>`;}).join(''):'<tr><td colspan="7" class="text-center text-muted">Chưa có hồ sơ nghỉ.</td></tr>';}).layHoSoNghiGiaoVienV693({from:'',to:'',trangThai:'ALL'},controlAuthV693());}
function boTriTuHoSoNghiV693(id,type){const r=teacherAbsenceCacheV693.find(x=>x.id===id);if(!r)return;const periods=Array.isArray(r.tietAnhHuong)?r.tietAnhHuong:[];if(!periods.length){showToastV9('Hồ sơ nghỉ chưa khai báo tiết bị ảnh hưởng.','warning');return;}let idx=0;if(periods.length>1){const menu=periods.map((p,i)=>`${i+1}. ${p.ngayDay||''} · ${p.lop||''} · ${p.buoi||''} T${p.tiet||''} · ${p.mon||''}`).join('\n');const pick=prompt(`Chọn tiết cần bố trí (1-${periods.length}):\n${menu}`,'1');if(pick===null)return;idx=Math.max(0,Math.min(periods.length-1,Number(pick||1)-1));}const a=periods[idx]||{};const targetType=type==='DAY_BU'?'DAY_BU':'DAY_THAY';document.getElementById('opAbsenceIdV693').value=r.id;document.getElementById('opTypeV693').value=targetType;doiLoaiDieuHanhV693();document.getElementById('opOriginDateV693').value=a.ngayDay||r.tuNgay||'';setSelectValueV6953('opOriginClassV693',a.lop||'');document.getElementById('opOriginSessionV693').value=a.buoi||'Sáng';document.getElementById('opOriginPeriodV693').value=String(a.tiet||1);setSelectValueV6953('opOriginSubjectV693',canonicalSubjectV6955(a.mon||''));document.getElementById('opOriginTeacherAccountV693').value=r.teacherAccount||'';document.getElementById('opOriginTeacherNameV693').value=r.teacherName||'';setSelectValueV6953('opExecClassV693',a.lop||'');setSelectValueV6953('opExecSubjectV693',canonicalSubjectV6955(a.mon||''));document.getElementById('opExecDateV693').value=targetType==='DAY_THAY'?(a.ngayDay||r.tuNgay||''):schoolTodayV693();document.getElementById('opExecSessionV693').value=targetType==='DAY_BU'?'Dạy bù':(a.buoi||'Sáng');document.getElementById('opExecPeriodV693').value=String(targetType==='DAY_THAY'?(a.tiet||1):1);document.getElementById('opExecTeacherAccountV693').value=targetType==='DAY_BU'?(r.teacherAccount||''):'';document.getElementById('opExecTeacherNameV693').value=targetType==='DAY_BU'?(r.teacherName||''):'';document.getElementById('opExternalStaffV693').value='';document.getElementById('opProxyAccountV693').value='';document.getElementById('opProxyNameV693').value='';document.getElementById('opReasonV693').value=`${targetType==='DAY_THAY'?'Dạy thay':'Dạy bù'} theo hồ sơ nghỉ ${r.teacherName}: ${r.lyDo}`;const btn=document.querySelector('#tabControlV693 [data-bs-target="#control-ops-v693"]');try{if(btn&&window.bootstrap)bootstrap.Tab.getOrCreateInstance(btn).show();}catch(_e){if(btn)btn.click();}document.getElementById('opTypeV693')?.scrollIntoView({behavior:'smooth',block:'center'});showToastV9(targetType==='DAY_THAY'?'Đã nạp tiết nghỉ. Chọn giáo viên thực hiện rồi lưu hồ sơ dạy thay.':'Đã nạp tiết gốc. Kiểm tra ngày/tiết bù và giáo viên thực hiện trước khi lưu.','info');}
function duyetHoSoNghiV693(id,decision){const note=prompt(decision==='DA_DUYET'?'Ý kiến duyệt:':decision==='HUY'?'Lý do hủy hồ sơ nghỉ:':'Lý do từ chối:','');if(note===null)return;google.script.run.withSuccessHandler(res=>{if(!res||!res.success){showToastV9(res&&res.message||'Không xử lý được.','danger');return;}showToastV9(res.message||'Đã xử lý.','success');taiHoSoNghiV693();taiTongQuanDieuHanhV693();}).duyetHoSoNghiGiaoVienV693(id,decision,note,controlAuthV693());}

function khbdModeLabelV7044(v){return ({REQUIRED:'Bắt buộc KHBD',OPTIONAL:'KHBD tùy chọn',NONE:'Không dùng KHBD'})[String(v||'').toUpperCase()]||String(v||'');}
function lessonSourceLabelV7044(v){return ({KHBD_TRUONG:'KHBD trường',CHUONG_TRINH_DOI_TAC:'Chương trình đối tác',NHAP_THUC_TE:'Nhập thực tế'})[String(v||'').toUpperCase()]||String(v||'');}
function populateExternalProgramSelectV7044(){const el=document.getElementById('externalProgramSelectV7044');if(!el)return;const old=el.value;el.innerHTML='<option value="">-- Không gắn chương trình --</option>'+externalProgramsCacheV7044.map(x=>`<option value="${escV693(x.id)}">${escV693(x.tenChuongTrinh)} · ${escV693(x.tenMon)}${x.trangThai==='DANG_HOAT_DONG'?'':' (đã dừng)'}</option>`).join('');if([...el.options].some(o=>o.value===old))el.value=old;}
async function taiChuongTrinhNgoaiV7044(silent=false){const body=document.getElementById('externalProgramBodyV7044'),auth=controlAuthV693();if(!auth.token)return;if(body&&!silent)body.innerHTML='<tr><td colspan="7" class="text-center text-muted">Đang tải...</td></tr>';try{const res=await callSodbEdgeRpcV67('layChuongTrinhNgoaiTruongV7044',[{trangThai:'ALL'},auth]);if(!res?.success)throw new Error(res?.message||'Không tải được danh mục chương trình.');externalProgramsCacheV7044=res.data||[];populateExternalProgramSelectV7044();updateOperationalSubjectsV6953(externalProgramsCacheV7044.filter(x=>x.trangThai==='DANG_HOAT_DONG').map(x=>x.tenMon));if(body)body.innerHTML=externalProgramsCacheV7044.length?externalProgramsCacheV7044.map(r=>`<tr><td><strong>${escV693(r.tenChuongTrinh)}</strong><div class="small text-muted">${escV693(r.maChuongTrinh)}${r.donViMacDinh?' · '+escV693(r.donViMacDinh):''}</div></td><td>${escV693(r.tenMon)}</td><td>${escV693(khbdModeLabelV7044(r.khbdMode))}</td><td>${escV693(lessonSourceLabelV7044(r.lessonSource))}</td><td>${r.signingMode==='SELF_OR_PROXY'?'Tự ký / Ký thay có ủy quyền':'Ký thay có ủy quyền'}</td><td>${statusBadgeV693(r.trangThai)}</td><td>${canManageExternalV693()?`<button type="button" class="btn btn-sm btn-outline-primary" onclick="suaChuongTrinhNgoaiV7044('${escV693(r.id)}')">Sửa</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="7" class="text-center text-muted">Chưa có chương trình ngoài trường.</td></tr>';return res;}catch(e){if(body)body.innerHTML=`<tr><td colspan="7" class="text-center text-danger">${escV693(e?.message||e)}</td></tr>`;if(!silent)showToastV9(e?.message||String(e),'danger');return null;}}
function resetChuongTrinhNgoaiV7044(){['externalProgramIdV7044','externalProgramCodeV7044','externalProgramNameV7044','externalProgramSubjectV7044','externalProgramOrgV7044','externalProgramGradesV7044','externalProgramClassesV70442','externalProgramNoteV7044'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});const k=document.getElementById('externalProgramKhbdV7044'),src=document.getElementById('externalProgramSourceV7044'),sg=document.getElementById('externalProgramSigningV7044'),st=document.getElementById('externalProgramStatusV7044');if(k)k.value='OPTIONAL';if(src)src.value='KHBD_TRUONG';if(sg)sg.value='PROXY_SIGN';if(st)st.value='DANG_HOAT_DONG';}
function suaChuongTrinhNgoaiV7044(id){const r=externalProgramsCacheV7044.find(x=>x.id===id);if(!r)return;document.getElementById('externalProgramIdV7044').value=r.id;document.getElementById('externalProgramCodeV7044').value=r.maChuongTrinh||'';document.getElementById('externalProgramNameV7044').value=r.tenChuongTrinh||'';document.getElementById('externalProgramSubjectV7044').value=r.tenMon||'';document.getElementById('externalProgramOrgV7044').value=r.donViMacDinh||'';document.getElementById('externalProgramKhbdV7044').value=r.khbdMode||'OPTIONAL';document.getElementById('externalProgramSourceV7044').value=r.lessonSource||'KHBD_TRUONG';document.getElementById('externalProgramSigningV7044').value=r.signingMode||'PROXY_SIGN';document.getElementById('externalProgramGradesV7044').value=(r.phamViKhoi||[]).join('; ');document.getElementById('externalProgramClassesV70442').value=(r.phamViLop||[]).join('; ');document.getElementById('externalProgramStatusV7044').value=r.trangThai||'DANG_HOAT_DONG';document.getElementById('externalProgramNoteV7044').value=r.ghiChu||'';document.getElementById('externalProgramCardV7044')?.scrollIntoView({behavior:'smooth',block:'start'});}
async function luuChuongTrinhNgoaiV7044(){const auth=controlAuthV693();if(!auth.token)return;const payload={id:document.getElementById('externalProgramIdV7044')?.value||'',maChuongTrinh:document.getElementById('externalProgramCodeV7044')?.value||'',tenChuongTrinh:document.getElementById('externalProgramNameV7044')?.value||'',tenMon:document.getElementById('externalProgramSubjectV7044')?.value||'',donViMacDinh:document.getElementById('externalProgramOrgV7044')?.value||'',khbdMode:document.getElementById('externalProgramKhbdV7044')?.value||'OPTIONAL',lessonSource:document.getElementById('externalProgramSourceV7044')?.value||'KHBD_TRUONG',signingMode:document.getElementById('externalProgramSigningV7044').value,phamViLop:splitScopeV693(document.getElementById('externalProgramClassesV70442').value),phamViKhoi:splitScopeV693(document.getElementById('externalProgramGradesV7044')?.value||'').map(Number).filter(x=>[10,11,12].includes(x)),trangThai:document.getElementById('externalProgramStatusV7044')?.value||'DANG_HOAT_DONG',ghiChu:document.getElementById('externalProgramNoteV7044')?.value||''};if(!payload.tenChuongTrinh.trim()||!payload.tenMon.trim()){showToastV9('Vui lòng nhập tên chương trình và tên môn trên SĐB.','warning');return;}try{const r=await callSodbEdgeRpcV67('luuChuongTrinhNgoaiTruongV7044',[payload,auth]);if(!r?.success)throw new Error(r?.message||'Không lưu được chương trình.');showToastV9(r.message||'Đã lưu chương trình.','success');resetChuongTrinhNgoaiV7044();await taiChuongTrinhNgoaiV7044(true);taiNhanSuNgoaiV693(true);}catch(e){showToastV9(e?.message||String(e),'danger');}}
function onExternalProgramForStaffV7044(){const id=document.getElementById('externalProgramSelectV7044')?.value||'',r=externalProgramsCacheV7044.find(x=>x.id===id);if(!r)return;const sp=document.getElementById('externalSpecialtyV693'),org=document.getElementById('externalOrgV693');if(sp)sp.value=r.tenMon||'';if(org&&!org.value)org.value=r.donViMacDinh||'';setScopePickerValuesV6953('externalSubjectsV693',r.tenMon?[r.tenMon]:[]);}
function applyExternalProgramPolicyToInputV7044(option){const id=String(option?.dataset?.programId||''),p=externalProgramsCacheV7044.find(x=>x.id===id)||{id,khbdMode:option?.dataset?.khbdMode||'',lessonSource:option?.dataset?.lessonSource||'',tenChuongTrinh:option?.dataset?.programName||''};currentExternalProgramPolicyV7044=id?p:null;const n=document.getElementById('khbdWeekNotice');if(!n||!currentExternalProgramPolicyV7044)return;const mode=String(currentExternalProgramPolicyV7044.khbdMode||'OPTIONAL').toUpperCase();n.textContent=mode==='REQUIRED'?`${currentExternalProgramPolicyV7044.tenChuongTrinh||'Chương trình ngoài trường'}: bắt buộc chọn bài từ KHBD đã duyệt.`:mode==='NONE'?`${currentExternalProgramPolicyV7044.tenChuongTrinh||'Chương trình ngoài trường'}: không sử dụng KHBD; nhập nội dung thực tế.`:`${currentExternalProgramPolicyV7044.tenChuongTrinh||'Chương trình ngoài trường'}: KHBD tùy chọn; có thể chọn KHBD hoặc nhập nội dung thực tế.`;}

function populateExternalSelectsV693(){const opts=['<option value="">-- Không / Chọn --</option>'].concat(externalStaffCacheV693.filter(x=>x.trangThai==='DANG_HOAT_DONG').map(x=>`<option value="${escV693(x.id)}">${escV693(x.hoTen)} · ${escV693(x.donVi||x.maNhanSu)}</option>`)).join('');['opExternalStaffV693','proxyExternalV693'].forEach(id=>{const x=document.getElementById(id);if(x){const old=x.value;x.innerHTML=opts;if([...x.options].some(o=>o.value===old))x.value=old;}});}
function taiNhanSuNgoaiV693(silent){const body=document.getElementById('externalBodyV693');if(body&&!silent)body.innerHTML='<tr><td colspan="7" class="text-center text-muted">Đang tải...</td></tr>';google.script.run.withSuccessHandler(res=>{if(!res||!res.success){if(body)body.innerHTML=`<tr><td colspan="7" class="text-danger text-center">${escV693(res&&res.message||'Lỗi')}</td></tr>`;return;}externalStaffCacheV693=res.data||[];externalStaffLoadedAtV6954=Date.now();populateExternalSelectsV693();if(body)body.innerHTML=externalStaffCacheV693.length?externalStaffCacheV693.map(r=>`<tr><td>${escV693(r.maNhanSu)}</td><td><strong>${escV693(r.hoTen)}</strong><div class="small">${r.phuongThucKy==='SELF_SIGN'?'Tự ký · '+escV693(r.taiKhoanTuKy):'Ký thay có ủy quyền'}</div></td><td>${r.program?`<strong>${escV693(r.program.tenChuongTrinh||'')}</strong><br><small>${escV693(r.donVi||r.program.donViMacDinh||'')} · ${escV693(r.chuyenMon||r.program.tenMon||'')}</small>`:`${escV693(r.donVi)}<br><small>${escV693(r.chuyenMon)}</small>`}</td><td>${escV693(r.tuNgay)} → ${escV693(r.denNgay||'Không giới hạn')}</td><td><small>Lớp: ${escV693((r.phamViLop||[]).join(', ')||'Tất cả')}<br>Môn: ${escV693((r.phamViMon||[]).join(', ')||'Tất cả')}</small></td><td>${statusBadgeV693(r.trangThai)}</td><td>${canManageExternalV693()?`<button class="btn btn-sm btn-outline-primary me-1 mb-1" onclick="suaNhanSuNgoaiV693('${escV693(r.id)}')">Sửa</button><button class="btn btn-sm ${r.trangThai==='DANG_HOAT_DONG'?'btn-outline-warning':'btn-outline-success'} mb-1" onclick="doiTrangThaiNhanSuNgoaiV693('${escV693(r.id)}','${r.trangThai==='DANG_HOAT_DONG'?'TAM_DUNG':'DANG_HOAT_DONG'}')">${r.trangThai==='DANG_HOAT_DONG'?'Tạm dừng':'Kích hoạt'}</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="7" class="text-center text-muted">Chưa có nhân sự ngoài trường.</td></tr>';}).layNhanSuNgoaiTruongV693({trangThai:'ALL'},controlAuthV693());}
function doiTrangThaiNhanSuNgoaiV693(id,status){const label=status==='DANG_HOAT_DONG'?'kích hoạt':'tạm dừng';const reason=prompt(`Lý do ${label} nhân sự:`,status==='DANG_HOAT_DONG'?'Tiếp tục phân công':'Tạm dừng phân công');if(reason===null)return;google.script.run.withSuccessHandler(res=>{if(!res||!res.success){showToastV9(res&&res.message||'Không cập nhật được trạng thái.','danger');return;}showToastV9(res.message||'Đã cập nhật trạng thái.','success');taiNhanSuNgoaiV693();taiTongQuanDieuHanhV693();}).doiTrangThaiNhanSuNgoaiTruongV693(id,status,reason,controlAuthV693());}
function suaNhanSuNgoaiV693(id){const r=externalStaffCacheV693.find(x=>x.id===id);if(!r)return;document.getElementById('externalModeV7044').value=r.phuongThucKy||'PROXY_SIGN';document.getElementById('externalAccountV7044').value=r.taiKhoanTuKy||'';document.getElementById('externalIdV693').value=r.id;const pg=document.getElementById('externalProgramSelectV7044');if(pg)pg.value=r.programId||'';document.getElementById('externalNameV693').value=r.hoTen;document.getElementById('externalOrgV693').value=r.donVi;document.getElementById('externalTitleV693').value=r.chucDanh;document.getElementById('externalSpecialtyV693').value=canonicalSubjectV6955(r.chuyenMon);document.getElementById('externalPhoneV693').value=r.sdt;document.getElementById('externalFromV693').value=r.tuNgay;document.getElementById('externalToV693').value=r.denNgay;setScopePickerValuesV6953('externalClassesV693',r.phamViLop||[]);setScopePickerValuesV6953('externalSubjectsV693',r.phamViMon||[]);document.getElementById('externalStatusV693').value=r.trangThai;document.getElementById('externalNoteV693').value=r.ghiChu||'';}
function luuNhanSuNgoaiV693(){const payload={phuongThucKy:document.getElementById('externalModeV7044').value,taiKhoanTuKy:document.getElementById('externalAccountV7044').value,id:document.getElementById('externalIdV693').value,programId:document.getElementById('externalProgramSelectV7044')?.value||'',hoTen:document.getElementById('externalNameV693').value,donVi:document.getElementById('externalOrgV693').value,chucDanh:document.getElementById('externalTitleV693').value,chuyenMon:canonicalSubjectV6955(document.getElementById('externalSpecialtyV693').value),sdt:document.getElementById('externalPhoneV693').value,tuNgay:document.getElementById('externalFromV693').value,denNgay:document.getElementById('externalToV693').value,phamViLop:splitScopeV693(document.getElementById('externalClassesV693').value),phamViMon:canonicalSubjectListV6955(splitScopeV693(document.getElementById('externalSubjectsV693').value)),trangThai:document.getElementById('externalStatusV693').value,ghiChu:document.getElementById('externalNoteV693').value};google.script.run.withSuccessHandler(res=>{if(!res||!res.success){showToastV9(res&&res.message||'Không lưu được nhân sự.','danger');return;}showToastV9(res.message||'Đã lưu.','success');document.getElementById('externalIdV693').value=res.data?.id||'';taiNhanSuNgoaiV693();taiTongQuanDieuHanhV693();}).luuNhanSuNgoaiTruongV693(payload,controlAuthV693());}

function proxyAuthV693(){const s=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};return {token:(s.ADMIN||s.BGH||{}).sessionToken||''};}
function capQuyenKyThayV693(){
  const externalId=document.getElementById('proxyExternalV693').value;
  const batchSign=!!document.getElementById('proxyBatchSignV704645')?.checked;
  const batchCreate=!!document.getElementById('proxyBatchCreateV704645')?.checked;
  const payload={taiKhoan:document.getElementById('proxyAccountV693').value,quyen:'PROXY_SIGN',tuNgay:document.getElementById('proxyFromV693').value,denNgay:document.getElementById('proxyToV693').value,lyDo:document.getElementById('proxyReasonV693').value,kichHoat:true,phamVi:{external_staff_ids:externalId?[externalId]:[],subjects:canonicalSubjectListV6955(splitScopeV693(document.getElementById('proxySubjectsV693').value)),classes:splitScopeV693(document.getElementById('proxyClassesV693').value),batch_sign:batchSign,batch_create:batchCreate}};
  if(!payload.taiKhoan||!externalId){showToastV9('Phải chọn tài khoản ký và nhân sự ngoài trường.','danger');return;}
  google.script.run.withSuccessHandler(res=>{if(!res||!res.success){showToastV9(res&&res.message||'Không cấp được quyền.','danger');return;}showToastV9(batchSign?'Đã cấp quyền ký thay, bao gồm ký hàng loạt.':'Đã cấp quyền ký thay theo phạm vi.','success');taiQuyenKyThayV693();}).luuQuyenDacBietV69(payload,proxyAuthV693());
}
function taiQuyenKyThayV693(){const body=document.getElementById('proxyBodyV693');if(!body)return;if(!externalStaffCacheV693.length)taiNhanSuNgoaiV693(true);body.innerHTML='<tr><td colspan="7" class="text-center text-muted">Đang tải...</td></tr>';google.script.run.withSuccessHandler(res=>{if(!res||!res.success){body.innerHTML=`<tr><td colspan="7" class="text-danger text-center">${escV693(res&&res.message||'Lỗi')}</td></tr>`;return;}const rows=(res.data||[]).filter(r=>r.quyen==='PROXY_SIGN');body.innerHTML=rows.length?rows.map(r=>{const sc=r.pham_vi||{},ids=Array.isArray(sc.external_staff_ids)?sc.external_staff_ids:[],names=ids.map(id=>externalStaffCacheV693.find(x=>x.id===id)?.hoTen||id);const batchBadges=`${sc.batch_sign?'<span class="badge text-bg-primary mt-1 me-1">Ký hàng loạt</span>':''}${sc.batch_create?'<span class="badge text-bg-info mt-1">Tạo tiết + ký</span>':''}`;return `<tr><td><strong>${escV693(r.tai_khoan)}</strong></td><td>${escV693(names.join(', ')||'Legacy: chưa giới hạn')}${batchBadges?`<br>${batchBadges}`:''}</td><td>${escV693((sc.subjects||[]).join(', ')||'Tất cả')}</td><td>${escV693((sc.classes||[]).join(', ')||'Tất cả')}</td><td>${escV693(r.tu_ngay)} → ${escV693(r.den_ngay||'Không giới hạn')}</td><td>${escV693(r.ly_do||'')}</td><td>${r.kich_hoat!==false?`<button class="btn btn-sm btn-outline-danger" onclick="thuHoiQuyenKyThayV693('${escV693(r.id)}')">Thu hồi</button>`:'—'}</td></tr>`;}).join(''):'<tr><td colspan="7" class="text-center text-muted">Chưa có quyền ký thay.</td></tr>';}).layQuyenDacBietV69(proxyAuthV693());}
function thuHoiQuyenKyThayV693(id){const reason=prompt('Lý do thu hồi:','Hết phân công ký thay');if(reason===null)return;google.script.run.withSuccessHandler(res=>{if(!res||!res.success){showToastV9(res&&res.message||'Không thu hồi được.','danger');return;}showToastV9('Đã thu hồi quyền.','success');taiQuyenKyThayV693();}).thuHoiQuyenDacBietV69(id,reason,proxyAuthV693());}

// ----------------------------- NHẬP TIẾT V69.3 -----------------------------
function chonNhanSuKyThayV693(){const sel=document.getElementById('proxyTeacherNameV682'),hidden=document.getElementById('proxyExternalStaffIdV693'),opt=sel&&sel.selectedOptions[0];if(hidden)hidden.value=opt?.dataset.staffId||'';applyExternalProgramPolicyToInputV7044(opt);try{if(typeof loadDanhSachBaiDay==='function')loadDanhSachBaiDay(true);}catch(_e){}}
function loadProxyStaffOptionsV693(){const sel=document.getElementById('proxyTeacherNameV682');if(!sel||!gvbmDangNhapInfo?.sessionToken)return;const ctx={date:document.getElementById('ngayDay')?.value||schoolTodayV693(),lop:document.getElementById('lop')?.value||'',mon:(typeof getEffectiveMonHocV25==='function'?getEffectiveMonHocV25():document.getElementById('monHoc')?.value||'')};sel.innerHTML='<option value="">Đang tải danh sách...</option>';google.script.run.withSuccessHandler(res=>{const rows=res&&res.success?res.data||[]:[];sel.innerHTML='<option value="">-- Chọn nhân sự đã được phân quyền --</option>'+rows.map(r=>`<option value="${escV693(r.hoTen)}" data-staff-id="${escV693(r.id)}" data-program-id="${escV693(r.programId||'')}" data-program-name="${escV693(r.program?.tenChuongTrinh||'')}" data-khbd-mode="${escV693(r.program?.khbdMode||'')}" data-lesson-source="${escV693(r.program?.lessonSource||'')}">${escV693(r.hoTen)} · ${escV693(r.program?.tenChuongTrinh||r.donVi||r.maNhanSu)}</option>`).join('');const op=currentInputOperationV693;if(op&&op.externalStaffId){const opt=[...sel.options].find(o=>o.dataset.staffId===op.externalStaffId);if(opt){sel.value=opt.value;chonNhanSuKyThayV693();}}}).layNhanSuNgoaiTruongChoKyV693(ctx,{token:gvbmDangNhapInfo.sessionToken});}
const baseProxyToggleV693=window.onProxySigningToggleV682;
window.onProxySigningToggleV682=function(){if(typeof baseProxyToggleV693==='function')baseProxyToggleV693();const toggle=document.getElementById('proxySigningToggleV682');if(toggle?.checked)loadProxyStaffOptionsV693();else{const h=document.getElementById('proxyExternalStaffIdV693');if(h)h.value='';currentExternalProgramPolicyV7044=null;}};
function renderInputOperationBannerV693(op){const box=document.getElementById('inputOperationBannerV693');if(!box)return;if(!op){box.classList.add('d-none');box.innerHTML='';return;}const cls=op.loai==='DAY_THAY'?'alert-warning':op.loai==='DAY_BU'?'alert-info':'alert-primary',khbdNote=op.loai==='DAY_THAY'?`<br><span class="small fw-semibold">KHBD: dùng KHBD của GV gốc/lớp được thay; giáo viên dạy thay vẫn được chọn bài và điểm danh đúng tiết.</span>`:'';box.className=`alert ${cls} border py-2 mb-2`;box.innerHTML=`<strong>${escV693(operationLabelV693(op.loai))}</strong> · Hồ sơ <strong>${escV693(op.maHoSo)}</strong><br><span class="small">${escV693(op.ngayThucHien)} · ${escV693(op.lopThucHien)} · ${escV693(op.buoiThucHien)} - Tiết ${escV693(op.tietThucHien)} · ${escV693(op.monThucHien)}${op.gvGocName?` · GV gốc: ${escV693(op.gvGocName)}`:''}</span>${khbdNote}`;box.classList.remove('d-none');}
// V70.4.2: substitute flags are populated from the approved operation, never a manual switch.
let inputTeachingRequestV7042=0;
let inputTeachingLoadingV7042=false;
let inputTeachingFailedV7042=false;
let inputTeachingRefreshTimerV70469=null;
function scheduleTeachingOperationRefreshV70469(delay=180){
  if(inputTeachingRefreshTimerV70469)clearTimeout(inputTeachingRefreshTimerV70469);
  inputTeachingRefreshTimerV70469=setTimeout(()=>{inputTeachingRefreshTimerV70469=null;refreshTeachingOperationForInputV693();},delay);
}
function syncTeachingOperationFieldsV7042(op){
  const cb=document.getElementById('isDayThayV683');
  if(cb)cb.checked=!!(op?.id && op.loai==='DAY_THAY');
  const name=document.getElementById('gvDuocThayV683');
  if(name){name.value=op?.loai==='DAY_THAY'?(op.gvGocName||''):'';name.readOnly=true;}
}
function clearInputTeachingOperationV7042(){
  inputTeachingRequestV7042++;
  inputTeachingLoadingV7042=false;inputTeachingFailedV7042=false;
  currentInputOperationV693=null;syncTeachingOperationFieldsV7042(null);renderInputOperationBannerV693(null);
}
function inputTeachingContextV7042(){
  return {date:document.getElementById('ngayDay')?.value||'',lop:document.getElementById('lop')?.value||'',buoi:document.getElementById('buoiDay')?.value||'Sáng',tiet:Number(document.getElementById('tietDay')?.value||0),mon:(typeof getEffectiveMonHocV25==='function'?getEffectiveMonHocV25():document.getElementById('monHoc')?.value||'')};
}
function refreshTeachingOperationForInputV693(){
  const token=gvbmDangNhapInfo?.sessionToken,ctx=inputTeachingContextV7042();
  clearInputTeachingOperationV7042();
  if(!token||!ctx.date||!ctx.lop||!ctx.tiet||!ctx.mon)return;
  const request=inputTeachingRequestV7042,contextKey=JSON.stringify(ctx);
  inputTeachingLoadingV7042=true;
  const isCurrent=()=>request===inputTeachingRequestV7042 && token===gvbmDangNhapInfo?.sessionToken && contextKey===JSON.stringify(inputTeachingContextV7042());
  google.script.run.withSuccessHandler(res=>{
    if(!isCurrent())return;
    inputTeachingLoadingV7042=false;
    if(!res || res.success===false){inputTeachingFailedV7042=true;return;}
    currentInputOperationV693=res.found?res.operation:null;
    syncTeachingOperationFieldsV7042(currentInputOperationV693);
    renderInputOperationBannerV693(currentInputOperationV693);
    if(currentInputOperationV693?.externalStaffId){const t=document.getElementById('proxySigningToggleV682');if(t){t.checked=true;configureProxySigningUiV682();loadProxyStaffOptionsV693();}}
    // V70.4.6.28: roster có thể đã bị từ chối trước khi hồ sơ DẠY THAY tải xong; tải lại ngay sau khi xác thực điều hành.
    if(currentInputOperationV693?.id && currentInputOperationV693?.loai==='DAY_THAY'){try{if(typeof refreshGroupAttendanceV6951==='function')refreshGroupAttendanceV6951();}catch(_e){}}
  }).withFailureHandler(()=>{
    if(!isCurrent())return;
    inputTeachingLoadingV7042=false;inputTeachingFailedV7042=true;
  }).layDieuHanhTietCuaToiV693(ctx,{token});
}
function taiNhiemVuCuaToiV693(){const box=document.getElementById('myTeachingTasksV693');if(!box||!gvbmDangNhapInfo?.sessionToken)return;const today=schoolTodayV693(),from=addDaysClientV693(today,-60),to=addDaysClientV693(today,14);google.script.run.withSuccessHandler(res=>{myTeachingTasksCacheV693=res&&res.success?res.data||[]:[];try{if(typeof capNhatKhoiVaLopPhanCongV39==='function')capNhatKhoiVaLopPhanCongV39(true);}catch(_e){}if(!myTeachingTasksCacheV693.length){box.classList.add('d-none');box.innerHTML='';return;}box.innerHTML=`<div class="alert alert-light border py-2 mb-0"><div class="fw-bold mb-1">Nhiệm vụ điều hành đã duyệt / chưa hoàn thành</div><div class="d-flex flex-wrap gap-1">${myTeachingTasksCacheV693.map(r=>{const late=String(r.ngayThucHien||'')<today?' · QUÁ NGÀY':'';return `<button type="button" class="btn btn-sm ${late?'btn-outline-warning':'btn-outline-primary'}" onclick="apDungNhiemVuV693('${escV693(r.id)}')">${escV693(operationLabelV693(r.loai))} · ${escV693(r.ngayThucHien)} · ${escV693(r.lopThucHien)} T${escV693(r.tietThucHien)}${escV693(late)}</button>`;}).join('')}</div><div class="small text-muted mt-1">Hồ sơ DẠY THAY đã duyệt quá ngày vẫn được hiển thị để giáo viên hoàn tất đúng lớp/ngày/buổi/tiết đã được duyệt.</div></div>`;box.classList.remove('d-none');}).layNhiemVuDieuHanhCuaToiV693(from,to,{token:gvbmDangNhapInfo.sessionToken});}
function apDungNhiemVuV693(id){const r=myTeachingTasksCacheV693.find(x=>x.id===id);if(!r)return;clearInputTeachingOperationV7042();currentInputOperationV693=r;syncTeachingOperationFieldsV7042(r);renderInputOperationBannerV693(r);const grade=String(r.lopThucHien||'').match(/^(10|11|12)/)?.[1]||'';const k=document.getElementById('khoi'),lop=document.getElementById('lop');if(k&&grade){if(![...k.options].some(o=>o.value===grade))k.add(new Option('Khối '+grade,grade));k.value=grade;}if(r.loai==='DAY_THAY'){const cb=document.getElementById('isDayThayV683');if(cb){cb.checked=true;onDayThayToggleV683();}}if(lop&&![...lop.options].some(o=>o.value===r.lopThucHien))lop.add(new Option(r.lopThucHien,r.lopThucHien));if(lop)lop.value=r.lopThucHien;const ngay=document.getElementById('ngayDay');if(ngay)ngay.value=r.ngayThucHien;const b=document.getElementById('buoiDay');if(b&&[...b.options].some(o=>o.value===r.buoiThucHien))b.value=r.buoiThucHien;const t=document.getElementById('tietDay');if(t)t.value=String(r.tietThucHien);try{capNhatTuanVaThu();onInputClassChangedV26();}catch(_e){}const mon=document.getElementById('monHoc');if(mon){const cm=canonicalSubjectV6955(r.monThucHien);if(isGdtcDetailSubjectV25(cm)&&gvbmHasGdtcV25()){let base=[...mon.options].find(o=>isGdtcBaseSubjectV25(o.value));if(!base){base=new Option('GDTC','GDTC');base.dataset.operationV693='1';mon.add(base);}mon.value=base.value;configureGdtcInputV25();const gd=document.getElementById('gdtcTeachingSubjectV25');if(gd)gd.value=cm;}else{let opt=[...mon.options].find(o=>subjectKeyV6955(o.value)===subjectKeyV6955(cm));if(!opt){opt=new Option(cm,cm);opt.dataset.operationV693='1';mon.add(opt);}mon.value=opt.value;}}if(r.externalStaffId){const hidden=document.getElementById('proxyExternalStaffIdV693');if(hidden)hidden.value=r.externalStaffId;const toggle=document.getElementById('proxySigningToggleV682');if(toggle){toggle.checked=true;configureProxySigningUiV682();loadProxyStaffOptionsV693();}}try{loadDanhSachBaiDay(true);}catch(_e){}try{if(typeof refreshGroupAttendanceV6951==='function')refreshGroupAttendanceV6951();}catch(_e){}setTimeout(refreshTeachingOperationForInputV693,120);}

// Hook giao diện sau khi DOM sẵn sàng.
document.addEventListener('DOMContentLoaded',function(){
  initControlDatesV693();
  const tab=document.getElementById('control-tab-v693');if(tab)tab.addEventListener('shown.bs.tab',initControlV693);
  const dash=document.getElementById('dashboard-tab-v9');if(dash)dash.addEventListener('shown.bs.tab',()=>setTimeout(()=>refreshDashboardControlSummaryV693(false),180));
  const dashDate=document.getElementById('overviewDateV20');if(dashDate)dashDate.addEventListener('change',()=>setTimeout(()=>refreshDashboardControlSummaryV693(true),160));
  [['absenceAccountV693','absenceNameV693'],['opOriginTeacherAccountV693','opOriginTeacherNameV693'],['opExecTeacherAccountV693','opExecTeacherNameV693'],['opProxyAccountV693','opProxyNameV693'],['swapAAccountV693','swapANameV693'],['swapBAccountV693','swapBNameV693']].forEach(([a,n])=>{const x=document.getElementById(a);if(x)x.addEventListener('change',()=>syncTeacherNameV693(a,n));});
  ['ngayDay','lop','buoiDay','tietDay','monHoc','gdtcTeachingSubjectV25','technologyTeachingSubjectV657'].forEach(id=>{const x=document.getElementById(id);if(x)x.addEventListener('change',()=>{clearInputTeachingOperationV7042();scheduleTeachingOperationRefreshV70469(180);if(document.getElementById('proxySigningToggleV682')?.checked)setTimeout(loadProxyStaffOptionsV693,120);});});
  const inputTab=document.getElementById('input-tab');if(inputTab)inputTab.addEventListener('shown.bs.tab',()=>{setTimeout(()=>{taiNhiemVuCuaToiV693();refreshTeachingOperationForInputV693();},120);});
});

function newExternalStaffV7044(){for(const id of ['externalIdV693','externalNameV693','externalOrgV693','externalTitleV693','externalSpecialtyV693','externalPhoneV693','externalToV693','externalNoteV693','externalAccountV7044','externalProgramSelectV7044']){const e=document.getElementById(id);if(e)e.value='';}document.getElementById('externalModeV7044').value='PROXY_SIGN';document.getElementById('externalStatusV693').value='DANG_HOAT_DONG';setScopePickerValuesV6953('externalClassesV693',[]);setScopePickerValuesV6953('externalSubjectsV693',[]);}

/* ========================================================================
   V70.4.6.45 - KHUNG TIẾT CHƯƠNG TRÌNH LIÊN KẾT + KÝ THAY HÀNG LOẠT
   Không phụ thuộc TKB. Server luôn kiểm lại quyền/slot trước khi ký.
   ======================================================================== */
let batchCatalogV704645={programs:[],staff:[],canBatchSign:false,canBatchCreate:false,hasPin:false};
let batchPreviewV704645=[];
let extSlotsV704645=[];

function specialPermissionsClientV704645(){
  const b=currentUnifiedLoginV4?.bootstrap?.specialPermissions||[];
  const s=currentUnifiedLoginV4?.sessions||{};
  const more=Object.values(s).flatMap(x=>Array.isArray(x?.specialPermissions)?x.specialPermissions:[]);
  return [...new Set([...(Array.isArray(b)?b:[]),...more])];
}
function hasProxyPermissionClientV704645(){return specialPermissionsClientV704645().includes('PROXY_SIGN');}
function batchSessionV704645(){
  const s=currentUnifiedLoginV4?.sessions||{};
  return s.ADMIN||s.BGH||s.TTCM||s.GIAM_THI||s.GVBM||null;
}
function batchAuthV704645(){const s=batchSessionV704645();return {token:s?.sessionToken||''};}
function canManageSlotsV704645(){const r=controlRolesV693();return r.includes('ADMIN')||r.includes('BGH');}
function apDungHienThiKyThayHangLoatV704645(){
  const hasProxy=hasProxyPermissionClientV704645(),manager=canManageSlotsV704645(),roles=controlRolesV693(),canOps=manager||roles.includes('GIAM_THI');
  document.querySelectorAll('#tabControlV693 .manage-external-slot-v704645').forEach(x=>x.classList.toggle('d-none',!manager));
  document.querySelectorAll('#tabControlV693 .batch-sign-tab-v704645').forEach(x=>x.classList.toggle('d-none',!hasProxy));
  if(!canOps&&hasProxy){
    ['#controlSubTabsV6953 [data-bs-target="#control-ops-v693"]','#controlSubTabsV6953 [data-bs-target="#control-absence-v693"]','#controlSubTabsV6953 [data-bs-target="#control-external-v693"]','#controlSubTabsV6953 [data-bs-target="#control-proxy-v693"]','#controlSubTabsV6953 [data-bs-target="#control-alerts-v695"]','#controlSubTabsV6953 [data-bs-target="#control-report-v694"]','#controlSubTabsV6953 [data-bs-target="#group-report-v6951"]'].forEach(sel=>{const b=document.querySelector(sel);if(b?.closest('li'))b.closest('li').classList.add('d-none');});
    const btn=document.getElementById('control-batch-sign-tab-v704645');if(btn){setTimeout(()=>{try{window.bootstrap?bootstrap.Tab.getOrCreateInstance(btn).show():btn.click();}catch(_e){btn.click();}},60);}
  }
}
function initBatchDatesV704645(){
  const today=schoolTodayV693();
  const from=document.getElementById('extSlotFromV704645'),to=document.getElementById('extSlotToV704645');
  if(from&&!from.value)from.value=today;if(to&&!to.value)to.value=addDaysClientV693(today,120);
  const wk=document.getElementById('batchWeekV704645');const cur=Number(currentUnifiedLoginV4?.bootstrap?.currentWeek||currentUnifiedLoginV4?.bootstrap?.schoolYear?.currentWeek||0);if(wk&&(!wk.value||Number(wk.value)===1)&&cur>0)wk.value=String(cur);
}
function cauHinhOThuV704633(){
  const out=[];for(let thu=2;thu<=7;thu++)for(const buoi of ['Sáng','Chiều'])out.push({thu,buoi,key:`${thu}|${buoi}`});return out;
}
function tuyChonTietMaTranV704633(selected='2:1'){
  const opts=[['1:1','T1'],['2:1','T2'],['3:1','T3'],['4:1','T4'],['1:2','T1–2'],['2:2','T2–3'],['3:2','T3–4']];
  return opts.map(([v,t])=>`<option value="${v}" ${v===selected?'selected':''}>${t}</option>`).join('');
}
function cacLopKhoiMaTranV704633(){
  const grade=String(document.getElementById('extSlotGradeV704645')?.value||'10');
  return (operationalClassesV6953||[]).filter(c=>String(c).startsWith(grade)).sort((a,b)=>String(a).localeCompare(String(b),'vi',{numeric:true}));
}
function khungDangCoTrongOV704633(lop,thu,buoi){
  const pid=String(document.getElementById('extSlotProgramV704645')?.value||'');
  if(!pid)return '';
  const date=document.getElementById('extSlotFromV704645')?.value||new Date().toISOString().slice(0,10);
  const rows=(extSlotsV704645||[]).filter(r=>r.kichHoat&&(!r.tuNgay||r.tuNgay<=date)&&(!r.denNgay||r.denNgay>=date)&&String(r.programId||'')===pid&&String(r.lop||'')===String(lop)&&Number(r.thu||0)===Number(thu)&&String(r.buoi||'')===String(buoi));
  if(!rows.length)return '';
  const periods=[...new Set(rows.map(r=>Number(r.tiet||0)).filter(Boolean))].sort((a,b)=>a-b);
  return periods.length?`<div class="slot-existing" title="Khung đang có">Đang có: ${periods.map(x=>'T'+x).join(', ')}</div>`:'';
}
function renderMaTranKhungTietV704633(){
  const head=document.getElementById('extSlotMatrixHeadV704633'),body=document.getElementById('extSlotMatrixBodyV704633');if(!head||!body)return;
  const cols=cauHinhOThuV704633(),classes=cacLopKhoiMaTranV704633(),def=document.getElementById('extSlotMatrixDefaultV704633')?.value||'2:1';
  head.innerHTML='<th class="slot-class-col">Lớp</th>'+cols.map(c=>`<th><div>Thứ ${c.thu} · ${escV693(c.buoi)}</div><label class="small fw-normal mt-1"><input class="form-check-input me-1 ext-slot-matrix-col-v704633" type="checkbox" data-thu="${c.thu}" data-buoi="${escV693(c.buoi)}" onchange="chonCotMaTranKhungTietV704633(${c.thu},'${c.buoi}',this.checked)"> chọn cột</label></th>`).join('');
  if(!classes.length){body.innerHTML='<tr><td colspan="13" class="text-center text-muted py-4">Chưa tải được danh sách lớp của khối. Hãy đợi vài giây hoặc chọn lại Khối.</td></tr>';setTimeout(()=>{if(cacLopKhoiMaTranV704633().length)renderMaTranKhungTietV704633();},900);return;}
  body.innerHTML=classes.map(lop=>`<tr data-lop="${escV693(lop)}"><td class="slot-class-col"><label class="d-flex align-items-center gap-2 mb-0"><input class="form-check-input ext-slot-matrix-row-v704633" type="checkbox" onchange="chonDongMaTranKhungTietV704633('${escV693(lop)}',this.checked)"><span>${escV693(lop)}</span></label></td>${cols.map(c=>`<td class="slot-cell"><div class="slot-cell-box"><input class="form-check-input ext-slot-matrix-check-v704633" type="checkbox" data-lop="${escV693(lop)}" data-thu="${c.thu}" data-buoi="${escV693(c.buoi)}" onchange="doiTrangThaiOMaTranV704633(this)"><select class="form-select form-select-sm ext-slot-matrix-config-v704633" disabled onchange="capNhatTomTatMaTranV704633()">${tuyChonTietMaTranV704633(def)}</select></div>${khungDangCoTrongOV704633(lop,c.thu,c.buoi)}</td>`).join('')}</tr>`).join('');
  capNhatTomTatMaTranV704633();
}
function locLopKhungTietV704645(){renderMaTranKhungTietV704633();}
function datMacDinhChoOV704633(cb){const sel=cb?.closest('.slot-cell')?.querySelector('.ext-slot-matrix-config-v704633');if(!sel)return;sel.value=document.getElementById('extSlotMatrixDefaultV704633')?.value||'2:1';}
function doiTrangThaiOMaTranV704633(cb){const sel=cb?.closest('.slot-cell')?.querySelector('.ext-slot-matrix-config-v704633');if(sel){sel.disabled=!cb.checked;if(cb.checked)datMacDinhChoOV704633(cb);}capNhatTomTatMaTranV704633();}
function chonDongMaTranKhungTietV704633(lop,checked){[...document.querySelectorAll('.ext-slot-matrix-check-v704633')].filter(cb=>String(cb.dataset.lop||'')===String(lop)).forEach(cb=>{cb.checked=!!checked;const sel=cb.closest('.slot-cell')?.querySelector('.ext-slot-matrix-config-v704633');if(sel){sel.disabled=!checked;if(checked)datMacDinhChoOV704633(cb);}});capNhatTomTatMaTranV704633();}
function chonCotMaTranKhungTietV704633(thu,buoi,checked){[...document.querySelectorAll('.ext-slot-matrix-check-v704633')].filter(cb=>Number(cb.dataset.thu||0)===Number(thu)&&String(cb.dataset.buoi||'')===String(buoi)).forEach(cb=>{cb.checked=!!checked;const sel=cb.closest('.slot-cell')?.querySelector('.ext-slot-matrix-config-v704633');if(sel){sel.disabled=!checked;if(checked)datMacDinhChoOV704633(cb);}});capNhatTomTatMaTranV704633();}
function chonCaKhoiKhungTietV704645(){document.querySelectorAll('.ext-slot-matrix-check-v704633').forEach(cb=>{cb.checked=true;const sel=cb.closest('.slot-cell')?.querySelector('.ext-slot-matrix-config-v704633');if(sel){sel.disabled=false;datMacDinhChoOV704633(cb);}});capNhatTomTatMaTranV704633();}
function boChonMaTranKhungTietV704633(){document.querySelectorAll('.ext-slot-matrix-check-v704633,.ext-slot-matrix-row-v704633,.ext-slot-matrix-col-v704633').forEach(x=>x.checked=false);document.querySelectorAll('.ext-slot-matrix-config-v704633').forEach(x=>x.disabled=true);capNhatTomTatMaTranV704633();}
function capNhatTomTatMaTranV704633(){
  const selected=[...document.querySelectorAll('.ext-slot-matrix-check-v704633:checked')];let totalPeriods=0;const classes=new Set();selected.forEach(cb=>{classes.add(cb.dataset.lop||'');const sel=cb.closest('.slot-cell')?.querySelector('.ext-slot-matrix-config-v704633');const [,count='1']=String(sel?.value||'1:1').split(':');totalPeriods+=Number(count)||1;});
  const box=document.getElementById('extSlotMatrixSummaryV704633');if(box)box.innerHTML=selected.length?`Đã chọn <strong>${selected.length}</strong> ô · <strong>${classes.size}</strong> lớp · tổng <strong>${totalPeriods}</strong> tiết/chu kỳ tuần.`:'Chưa chọn ô nào.';
}
function capNhatLuaChonSoTietV704653(){capNhatTomTatMaTranV704633();}
function populateBatchCatalogV704645(){
  const pOpts=['<option value="">-- Chọn chương trình --</option>'].concat((batchCatalogV704645.programs||[]).map(p=>`<option value="${escV693(p.id)}">${escV693(p.tenChuongTrinh)} · ${escV693(p.tenMon)}</option>`)).join('');
  ['extSlotProgramV704645','batchProgramV704645'].forEach(id=>{const e=document.getElementById(id);if(!e)return;const old=e.value;e.innerHTML=pOpts;if([...e.options].some(o=>o.value===old))e.value=old;});
  doiChuongTrinhKhungTietV704645();locLopKhungTietV704645();
}
function doiChuongTrinhKhungTietV704645(){
  const pid=document.getElementById('extSlotProgramV704645')?.value||'',sel=document.getElementById('extSlotStaffV704645');if(!sel)return;
  const rows=(batchCatalogV704645.staff||[]).filter(x=>!pid||String(x.programId||'')===pid);
  sel.innerHTML='<option value="">-- Chọn nhân sự --</option>'+rows.map(x=>`<option value="${escV693(x.id)}">${escV693(x.hoTen)}${x.chucDanh?' · '+escV693(x.chucDanh):''}</option>`).join('');
}
function taiDanhMucBatchV704645(done){
  const auth=batchAuthV704645();if(!auth.token)return;
  google.script.run.withSuccessHandler(res=>{if(!res?.success){showToastV9(res?.message||'Không tải được danh mục ký thay.','danger');return;}batchCatalogV704645=res;populateBatchCatalogV704645();if(typeof done==='function')done(res);}).layDanhMucKyThayHangLoatV704645(auth);
}
function moKyThayHangLoatV704645(){initBatchDatesV704645();taiDanhMucLopMonDieuHanhV6953(false);taiDanhMucBatchV704645();if(batchPendingV33){batchMessageV33('Đang kiểm tra đợt ký trước. Không gửi ký lại.');checkBatchStatusV33();}}
function taiKhungTietLienKetV704645(){
  if(!canManageSlotsV704645())return;initBatchDatesV704645();taiDanhMucLopMonDieuHanhV6953(false);
  taiDanhMucBatchV704645(()=>{
    renderMaTranKhungTietV704633();
    const body=document.getElementById('extSlotBodyV704645');if(body)body.innerHTML='<tr><td colspan="7" class="text-center text-muted">Đang tải...</td></tr>';
    google.script.run.withSuccessHandler(res=>{if(!res?.success){if(body)body.innerHTML=`<tr><td colspan="7" class="text-center text-danger">${escV693(res?.message||'Lỗi')}</td></tr>`;return;}extSlotsV704645=res.data||[];renderMaTranKhungTietV704633();if(body)body.innerHTML=extSlotsV704645.length?extSlotsV704645.map(r=>`<tr><td><strong>${escV693(r.programName)}</strong><br><small>${escV693(r.subject)}</small></td><td>${escV693(r.staffName)}</td><td><strong>${escV693(r.lop)}</strong><br><small>Khối ${escV693(r.khoi)}</small></td><td>Thứ ${escV693(r.thu)} · ${escV693(r.buoi)} · Tiết ${escV693(r.tiet)}</td><td>${escV693(r.tuNgay)} → ${escV693(r.denNgay||'Không giới hạn')}</td><td>${!r.kichHoat?'<span class="badge text-bg-secondary">Đã ngừng</span>':r.denNgay&&r.denNgay<new Date().toISOString().slice(0,10)?'<span class="badge text-bg-secondary">Đã hết hiệu lực</span>':r.tuNgay>new Date().toISOString().slice(0,10)?'<span class="badge text-bg-info">Chờ áp dụng</span>':'<span class="badge text-bg-success">Đang dùng</span>'}</td><td>${r.kichHoat?`<button class="btn btn-sm btn-outline-danger" onclick="ngungKhungTietLienKetV704645('${escV693(r.id)}')">Ngừng</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="7" class="text-center text-muted">Chưa có khung tiết.</td></tr>';}).layKhungTietLienKetV704645({},batchAuthV704645());
  });
}
function goLuuNhomMaTranV704633(payload){return new Promise((resolve,reject)=>{google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).luuKhungTietLienKetV704645(payload,batchAuthV704645());});}
async function luuKhungTietLienKetV704645(){
  const programId=document.getElementById('extSlotProgramV704645')?.value||'',externalStaffId=document.getElementById('extSlotStaffV704645')?.value||'',hocKy=document.getElementById('extSlotSemesterV704645')?.value||'HK1',khoi=Number(document.getElementById('extSlotGradeV704645')?.value||0),tuNgay=document.getElementById('extSlotFromV704645')?.value||'',denNgay=document.getElementById('extSlotToV704645')?.value||'',ghiChu=document.getElementById('extSlotNoteV704645')?.value||'';
  const selected=[...document.querySelectorAll('.ext-slot-matrix-check-v704633:checked')];
  if(!programId||!externalStaffId||!selected.length||!tuNgay){showToastV9('Cần chọn chương trình, nhân sự, ít nhất một ô trong ma trận và ngày bắt đầu.','warning');return;}
  const groups=new Map();
  selected.forEach(cb=>{const sel=cb.closest('.slot-cell')?.querySelector('.ext-slot-matrix-config-v704633');const [tietRaw,countRaw]=String(sel?.value||'2:1').split(':'),tiet=Number(tietRaw||0),soTiet=Number(countRaw||1),thu=Number(cb.dataset.thu||0),buoi=String(cb.dataset.buoi||''),lop=String(cb.dataset.lop||'');const key=[thu,buoi,tiet,soTiet].join('|');if(!groups.has(key))groups.set(key,{thu,buoi,tiet,soTiet,classes:[]});groups.get(key).classes.push(lop);});
  const totalPeriods=[...groups.values()].reduce((n,g)=>n+g.classes.length*g.soTiet,0);if(!confirm(`Lưu ${selected.length} ô ma trận, tương ứng ${totalPeriods} tiết/chu kỳ tuần?`))return;
  const btn=[...document.querySelectorAll('button')].find(b=>b.getAttribute('onclick')==='luuKhungTietLienKetV704645()'&&b.textContent.includes('Lưu ma trận'));if(btn){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent='Đang lưu...';}
  let ok=0,fail=0;const errors=[];
  for(const g of groups.values()){
    const payload={programId,externalStaffId,hocKy,khoi,classes:[...new Set(g.classes)],thu:g.thu,buoi:g.buoi,tiet:g.tiet,soTiet:g.soTiet,tuNgay,denNgay,ghiChu};
    try{const res=await goLuuNhomMaTranV704633(payload);if(res?.success){ok+=Number(res.rows||0);}else{fail++;errors.push(`Thứ ${g.thu} ${g.buoi} ${g.tiet}/${g.soTiet} tiết: ${res?.message||'Không lưu được'}`);}}catch(err){fail++;errors.push(`Thứ ${g.thu} ${g.buoi}: ${err?.message||String(err)}`);}
  }
  if(btn){btn.disabled=false;btn.textContent=btn.dataset.oldText||'Lưu ma trận';}
  if(fail){showToastV9(`Đã lưu một phần (${ok} dòng). Có ${fail} nhóm chưa lưu; xem chi tiết bên dưới.`, 'warning');const box=document.getElementById('extSlotMatrixSummaryV704633');if(box)box.innerHTML=`<span class="text-warning"><strong>Đã lưu một phần.</strong> ${errors.map(escV693).join(' · ')}</span>`;}else{showToastV9(`Đã lưu ma trận thành công (${ok} dòng khung tiết).`,'success');boChonMaTranKhungTietV704633();}
  taiKhungTietLienKetV704645();
}
function ngungKhungTietLienKetV704645(id){const reason=prompt('Lý do ngừng khung tiết:','Thay đổi lịch chương trình liên kết');if(reason===null)return;google.script.run.withSuccessHandler(res=>{if(res?.success){showToastV9(res.message||'Đã ngừng khung tiết.','success');taiKhungTietLienKetV704645();}else showToastV9(res?.message||'Không ngừng được khung tiết.','danger');}).ngungKhungTietLienKetV704645(id,reason,batchAuthV704645());}
function batchGradesV704645(){return [...document.querySelectorAll('.batch-grade-v704645:checked')].map(x=>Number(x.value)).filter(x=>[10,11,12].includes(x));}
function batchStatusBadgeV704645(r){const m={READY:['success','Sẵn sàng ký'],READY_CREATE:['primary','Sẵn sàng tạo & ký'],READY_RESIGN:['warning','Cần ký lại'],ALREADY_SIGNED:['secondary','Đã ký'],BLOCKED:['danger','Không được ký'],SKIP:['warning','Bỏ qua']};const x=m[r.status]||['secondary',r.status||''];return `<span class="badge text-bg-${x[0]}">${escV693(x[1])}</span>${r.reason?`<div class="small text-muted mt-1">${escV693(r.reason)}</div>`:''}`;}
function renderBatchPreviewV704645(){
  const body=document.getElementById('batchPreviewBodyV704645'),summary=document.getElementById('batchSummaryV704645'),btn=document.getElementById('btnBatchSignV704645');if(!body)return;
  if(!batchPreviewV704645.length){body.innerHTML='<tr><td colspan="9" class="text-center text-muted py-4">Không có tiết phù hợp.</td></tr>';if(btn)btn.disabled=true;return;}
  body.innerHTML=batchPreviewV704645.map((r,i)=>{const selectable=['READY','READY_CREATE','READY_RESIGN'].includes(r.status);return `<tr data-batch-index="${i}"><td class="text-center"><input class="form-check-input batch-row-check-v704645" type="checkbox" ${selectable?'checked':'disabled'} onchange="capNhatBatchSummaryV704645()"></td><td><strong>${escV693(r.lop)}</strong><br><small>Khối ${escV693(r.khoi)}</small></td><td>${escV693(r.ngayDay)}<br><small>Thứ ${escV693(r.thu)} · ${escV693(r.buoi)} · Tiết ${escV693(r.tiet)}</small></td><td>${escV693(r.staffName)}<br><small>${escV693(r.staffTitle||'Nhân sự liên kết')}</small></td><td><input class="form-control form-control-sm batch-tietct-v704645" value="${escV693(r.tietCT||'')}" ${selectable?'':'disabled'}></td><td>${partnerPlanSelectV704636(r,selectable)}<input class="form-control form-control-sm batch-lesson-v704645" value="${escV693(r.lesson||(r.schoolPlanEnabled?'':document.getElementById('batchLessonDefaultV704645')?.value)||'')}" ${selectable?'':'disabled'}></td><td><strong>${escV693(r.rosterCount??'—')} / ${escV693(r.absentCount??0)}</strong>${r.exists?'<div class="small text-muted">Theo SĐB hiện có</div>':'<div class="small text-success">Mặc định điểm danh đủ</div>'}</td><td><input class="form-control form-control-sm batch-comment-v704645" value="${escV693(r.comment||document.getElementById('batchCommentV704645')?.value||'')}" ${selectable?'':'disabled'}></td><td>${batchStatusBadgeV704645(r)}</td></tr>`;}).join('');
  if(summary){summary.classList.remove('d-none');summary.innerHTML=`Tìm thấy <strong>${batchPreviewV704645.length}</strong> tiết theo khung đã đăng ký.`;}
  body.querySelectorAll('.batch-partner-plan-v704636').forEach(sel=>{if(sel.value)chonBaiDoiTacV704636(sel);});
  capNhatBatchSummaryV704645();
}
function capNhatBatchSummaryV704645(){
  const checks=[...document.querySelectorAll('.batch-row-check-v704645')],n=checks.filter(x=>x.checked&&!x.disabled).length,create=checks.filter(x=>x.checked&&!x.disabled&&batchPreviewV704645[Number(x.closest('tr')?.dataset.batchIndex||-1)]?.status==='READY_CREATE').length,resign=checks.filter(x=>x.checked&&!x.disabled&&batchPreviewV704645[Number(x.closest('tr')?.dataset.batchIndex||-1)]?.status==='READY_RESIGN').length;
  const btn=document.getElementById('btnBatchSignV704645');if(btn)btn.disabled=n===0||!!batchPendingV33;
  const sum=document.getElementById('batchSummaryV704645');if(sum&&!sum.classList.contains('d-none'))sum.innerHTML=`Đang chọn <strong>${n}</strong> tiết${create?` · <strong>${create}</strong> tiết chưa có SĐB sẽ được tạo và ký`:''}${resign?` · <strong>${resign}</strong> tiết đã thay đổi sẽ được ký lại`:''}.`;
}
function chonTatCaBatchV704645(v){document.querySelectorAll('.batch-row-check-v704645:not(:disabled)').forEach(x=>x.checked=!!v);capNhatBatchSummaryV704645();}
let batchPreviewRequestV704634=0,batchPreviewBusyV704634=false;
function xemTruocKyThayHangLoatV704645(){
  if(batchPreviewBusyV704634)return;
  const payload={tuan:Number(document.getElementById('batchWeekV704645')?.value||0),programId:document.getElementById('batchProgramV704645')?.value||'',grades:batchGradesV704645()};
  if(!payload.tuan||!payload.programId||!payload.grades.length){showToastV9('Vui lòng chọn tuần, chương trình và ít nhất một khối.','warning');return;}
  const request=++batchPreviewRequestV704634;
  batchPreviewBusyV704634=true;batchPreviewV704645=[];
  const body=document.getElementById('batchPreviewBodyV704645'),sign=document.getElementById('btnBatchSignV704645'),summary=document.getElementById('batchSummaryV704645');
  if(sign)sign.disabled=true;if(summary)summary.classList.add('d-none');
  const buttons=[...document.querySelectorAll('button[onclick="xemTruocKyThayHangLoatV704645()"]')];buttons.forEach(b=>b.disabled=true);
  if(body)body.innerHTML='<tr><td colspan="9" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải danh sách tiết…</td></tr>';
  let done=false;
  function finish(){if(done||request!==batchPreviewRequestV704634)return false;done=true;clearTimeout(timer);batchPreviewBusyV704634=false;buttons.forEach(b=>b.disabled=false);return true;}
  function fail(message){if(!finish())return;batchPreviewV704645=[];if(sign)sign.disabled=true;if(body)body.innerHTML='<tr><td colspan="9" class="text-center text-danger py-4">'+escV693(message)+'</td></tr>';showToastV9(message,'warning');}
  const timer=setTimeout(()=>fail('Tải danh sách quá lâu. Vui lòng thử lại hoặc chọn ít khối hơn.'),60000);
  try{google.script.run.withSuccessHandler(res=>{
    if(!res?.success){fail(res?.message||'Không tải được danh sách. Vui lòng thử lại.');return;}
    const current={tuan:Number(document.getElementById('batchWeekV704645')?.value||0),programId:document.getElementById('batchProgramV704645')?.value||'',grades:batchGradesV704645()};
    if(JSON.stringify(current)!==JSON.stringify(payload)){fail('Lựa chọn đã thay đổi. Vui lòng tạo lại danh sách.');return;}
    if(!finish())return;batchPreviewV704645=res.data||[];batchCatalogV704645.canBatchCreate=!!res.canBatchCreate;renderBatchPreviewV704645();
  }).withFailureHandler(()=>fail('Không tải được danh sách. Vui lòng thử lại.')).xemTruocKyThayHangLoatV704645(payload,batchAuthV704645());}
  catch(_err){fail('Không tải được danh sách. Vui lòng thử lại.');}
}

function selectedBatchItemsV704645(){
  const out=[];document.querySelectorAll('#batchPreviewBodyV704645 tr[data-batch-index]').forEach(tr=>{const cb=tr.querySelector('.batch-row-check-v704645');if(!cb?.checked||cb.disabled)return;const i=Number(tr.dataset.batchIndex||-1),r=batchPreviewV704645[i];if(!r)return;out.push({partnerPlanId:tr.querySelector('.batch-partner-plan-v704636')?.value||'',slotId:r.slotId,status:r.status,recordId:r.recordId||'',tietCT:tr.querySelector('.batch-tietct-v704645')?.value||'',lesson:tr.querySelector('.batch-lesson-v704645')?.value||'',comment:tr.querySelector('.batch-comment-v704645')?.value||''});});return out;
}
function moXacNhanKyThayHangLoatV704645(){
  if(batchPendingV33){checkBatchStatusV33();return;}
  const items=selectedBatchItemsV704645();if(!items.length)return;if(items.some(x=>batchPreviewV704645.find(r=>r.slotId===x.slotId)?.partnerPlanRequired&&!x.partnerPlanId)){showToastV9('Chọn bài KHBD cho các tiết bắt buộc trước khi ký.','warning');return;}const week=Number(document.getElementById('batchWeekV704645')?.value||0),p=batchCatalogV704645.programs.find(x=>x.id===document.getElementById('batchProgramV704645')?.value),create=items.filter(x=>x.status==='READY_CREATE').length,resign=items.filter(x=>x.status==='READY_RESIGN').length;
  const box=document.getElementById('batchConfirmTextV704645');if(box)box.innerHTML=`Xác nhận ký thay cho <strong>${items.length} tiết</strong> · ${escV693(p?.tenChuongTrinh||'Chương trình liên kết')} · Tuần <strong>${week}</strong> · Khối ${batchGradesV704645().join(', ')}.${create?`<br><strong>${create} tiết</strong> chưa có SĐB sẽ được tạo với điểm danh đủ.`:''}${resign?`<br><strong>${resign} tiết</strong> đã thay đổi sau lần ký trước và sẽ được ký xác nhận lại.`:''}`;
  const att=document.getElementById('batchAttendanceConfirmV704645');if(att){att.checked=create===0;att.disabled=create===0;}
  const pin=document.getElementById('batchPinV704645');if(pin)pin.value='';
  const modal=document.getElementById('modalBatchSignV704645');if(modal){try{bootstrap.Modal.getOrCreateInstance(modal).show();}catch(_e){}}
}
function doiPinKyThayV704645(){
  const a=prompt('Nhập PIN ký thay mới gồm đúng 6 chữ số:','');if(a===null)return;if(!/^\d{6}$/.test(a)){showToastV9('PIN phải gồm đúng 6 chữ số.','warning');return;}const b=prompt('Nhập lại PIN để xác nhận:','');if(b===null)return;if(a!==b){showToastV9('Hai lần nhập PIN không khớp.','danger');return;}
  google.script.run.withSuccessHandler(res=>{if(res?.success){batchCatalogV704645.hasPin=true;showToastV9('Đã thiết lập PIN ký thay.','success');}else showToastV9(res?.message||'Không lưu được PIN.','danger');}).datPinKyThayV704645(a,batchAuthV704645());
}
function readPendingBatchV33(){try{const p=JSON.parse(sessionStorage.getItem('sodb-pending-batch-v33')||'null');return p&&/^[0-9a-f-]{36}$/i.test(p.id)&&Number.isFinite(p.count)?{id:p.id,count:p.count,checks:0}:null;}catch(_e){return null;}}
function savePendingBatchV33(){try{if(batchPendingV33)sessionStorage.setItem('sodb-pending-batch-v33',JSON.stringify({id:batchPendingV33.id,count:batchPendingV33.count}));else sessionStorage.removeItem('sodb-pending-batch-v33');}catch(_e){}}
let batchPendingV33=readPendingBatchV33(),batchSendingV33=false,batchStatusTimerV33=null;
function lockBatchV33(){const btn=document.getElementById('btnBatchSignV704645');if(btn)btn.disabled=!!batchPendingV33;}
function batchMessageV33(message){const box=document.getElementById('batchResultV704645');if(box)box.innerHTML=`<div class="alert alert-info">${escV693(message)} <button type="button" class="btn btn-sm btn-outline-primary ms-2" onclick="checkBatchStatusV33()">Kiểm tra kết quả ký</button></div>`;const btn=document.getElementById('btnConfirmBatchSignV704645');if(btn){btn.disabled=batchSendingV33;btn.textContent=batchSendingV33?'Đang ký...':'Kiểm tra kết quả ký';}lockBatchV33();}
function completeBatchV33(res){batchPendingV33=null;savePendingBatchV33();clearTimeout(batchStatusTimerV33);const pin=document.getElementById('batchPinV704645');if(pin)pin.value='';const btn=document.getElementById('btnConfirmBatchSignV704645');if(btn){btn.disabled=false;btn.textContent='XÁC NHẬN & KÝ';}try{bootstrap.Modal.getInstance(document.getElementById('modalBatchSignV704645'))?.hide();}catch(_e){}const box=document.getElementById('batchResultV704645');if(box)box.innerHTML=`<div class="alert ${res.failedCount?'alert-warning':'alert-success'}"><strong>Đợt ${escV693(res.batchCode||'')}</strong>: ${escV693(res.successCount||0)} tiết thành công${res.failedCount?` · ${escV693(res.failedCount)} tiết chưa hoàn tất`:''}.</div>`+(res.items||[]).filter(x=>x.status==='FAILED').map(x=>`<div class="small text-danger">${escV693(x.lop)} · ${escV693(x.ngayDay)} · Tiết ${escV693(x.tiet)}: ${escV693(x.message)}</div>`).join('');showToastV9(res.failedCount?'Đã ký một phần; xem các dòng chưa hoàn tất.':'Đã nhận kết quả ký hàng loạt.',res.failedCount?'warning':'success');xemTruocKyThayHangLoatV704645();}
async function checkBatchStatusV33(){if(!batchPendingV33||batchSendingV33)return;clearTimeout(batchStatusTimerV33);const current=batchPendingV33;try{const r=await callSodbEdgeRpcV67('trangThaiKyThayHangLoatV70465333',[{requestId:current.id},batchAuthV704645()],15000);if(batchPendingV33!==current)return;if(r?.found&&!r.pending){completeBatchV33(r);return;}batchMessageV33(r?.found?`Máy chủ đang xử lý: ${r.processedCount||0}/${r.selectedCount||current.count} tiết. Không bấm ký lại.`:'Chưa xác định được kết quả đợt ký. Không bấm ký lại; dùng nút Kiểm tra kết quả ký.');}catch(_e){batchMessageV33('Chưa kết nối được để kiểm tra kết quả. Không bấm ký lại; dùng nút Kiểm tra kết quả ký khi mạng ổn định.');}if(batchPendingV33===current&&++current.checks<12)batchStatusTimerV33=setTimeout(checkBatchStatusV33,5000);}
async function thucHienKyThayHangLoatV704645(){
  if(batchSendingV33)return;if(batchPendingV33){await checkBatchStatusV33();return;}
  const items=selectedBatchItemsV704645(),pin=document.getElementById('batchPinV704645')?.value||'',needsCreate=items.some(x=>x.status==='READY_CREATE');
  if(!items.length)return;if(!/^\d{6}$/.test(pin)){showToastV9('Nhập PIN 6 chữ số để xác nhận.','warning');return;}if(needsCreate&&!document.getElementById('batchAttendanceConfirmV704645')?.checked){showToastV9('Cần xác nhận điểm danh đủ cho các tiết sẽ được tạo mới.','warning');return;}
  const id=crypto.randomUUID();batchPendingV33={id,count:items.length,checks:0};savePendingBatchV33();batchSendingV33=true;
  const payload={requestId:id,tuan:Number(document.getElementById('batchWeekV704645')?.value||0),programId:document.getElementById('batchProgramV704645')?.value||'',grades:batchGradesV704645(),pin,items,rating:document.getElementById('batchRatingV704645')?.value||'TOT',attendanceConfirmed:!needsCreate||!!document.getElementById('batchAttendanceConfirmV704645')?.checked};
  batchMessageV33(`Đang ký ${items.length} tiết. Vui lòng giữ trang này và chờ kết quả.`);
  const waiting=setTimeout(()=>{if(batchSendingV33)batchMessageV33('Đợt ký vẫn đang xử lý. Vui lòng giữ trang này; không bấm ký lại.');},20000);
  try{const res=await callSodbEdgeRpcV67('kyThayHangLoatV704645',[payload,batchAuthV704645()],180000);batchSendingV33=false;if(res?.pending){batchMessageV33('Máy chủ đang xử lý đợt ký. Đang kiểm tra kết quả.');await checkBatchStatusV33();return;}if(!res?.success){batchPendingV33=null;savePendingBatchV33();const btn=document.getElementById('btnConfirmBatchSignV704645');if(btn){btn.disabled=false;btn.textContent='XÁC NHẬN & KÝ';}showToastV9(res?.message||'Không thực hiện được đợt ký.','warning');xemTruocKyThayHangLoatV704645();return;}completeBatchV33(res);}catch(_e){batchSendingV33=false;batchMessageV33('Mất phản hồi từ máy chủ. Đang kiểm tra kết quả đợt ký; không gửi ký lại.');await checkBatchStatusV33();}finally{clearTimeout(waiting);}
}

document.addEventListener('DOMContentLoaded',()=>{initBatchDatesV704645();const g=document.getElementById('extSlotGradeV704645');if(g)g.addEventListener('change',locLopKhungTietV704645);setTimeout(renderMaTranKhungTietV704633,250);});

// KHBD đối tác: nhập bằng bảng Excel (các cột cách nhau bằng Tab).
async function quanLyKhbdDoiTacV704636(action='LIST',id=''){
 const programId=document.getElementById('extSlotProgramV704645')?.value||'',box=document.getElementById('partnerPlanListV704636');
 if(!programId){showToastV9('Chọn chương trình ở Khung tiết liên kết trước.','warning');return;}
 if(action==='DISABLE'&&!confirm('Ngừng bài này để không chọn cho các lần ký mới? Sổ đã ghi vẫn giữ nguyên.'))return;
 const payload={action,programId,id};
 if(action==='SAVE'){
  if(partnerUploadV704637){if(partnerUploadV704637.programId!==programId){showToastV9('Chương trình đã thay đổi. Hãy tải lại file cho chương trình đang chọn.','warning');return;}payload.rows=partnerUploadV704637.rows;}else{
  const lines=(document.getElementById('partnerPlanPasteV704636')?.value||'').trim().split(/\r?\n/).filter(x=>x.trim());
  if(!lines.length){showToastV9('Dán các dòng KHBD từ Excel trước.','warning');return;}
  payload.rows=[];
  for(let i=0;i<lines.length;i++){const c=lines[i].split('\t');if(c.length<5||c.length>6){showToastV9(`Dòng ${i+1}: cần 5 hoặc 6 cột, phân cách bằng Tab.`,'warning');return;}payload.rows.push({tuan:c[0],khoi:c[1],lop:c[2],tietCT:c[3],tenBai:c[4],yeuCau:c[5]||''});}
 }
 }
 const buttons=[...document.querySelectorAll('#partnerPlanManagerV704636 button')];buttons.forEach(x=>x.disabled=true);
 try{
  const res=await callSodbEdgeRpcV67('quanLyKhbdDoiTacV704636',[payload,batchAuthV704645()]);if(!res?.success)throw new Error(res?.message||'Không xử lý được KHBD đối tác.');
  if(action!=='LIST'){showToastV9(res.message,'success');if(action==='SAVE'){document.getElementById('partnerPlanPasteV704636').value='';clearPartnerUploadV704637();}await quanLyKhbdDoiTacV704636();return;}
  if(document.getElementById('extSlotProgramV704645')?.value!==programId)return;
  box.innerHTML=(res.data||[]).length?'<div class="table-responsive"><table class="table table-sm"><thead><tr><th>Tuần</th><th>Khối / Lớp</th><th>Tiết CT</th><th>Tên bài</th><th></th></tr></thead><tbody>'+(res.data||[]).map(x=>`<tr><td>${escV693(x.tuan)}</td><td>${escV693(x.khoi)} / ${escV693(x.lop)}</td><td>${escV693(x.tiet_ct)}</td><td>${escV693(x.ten_bai)}</td><td><button class="btn btn-sm btn-outline-secondary" onclick="quanLyKhbdDoiTacV704636('DISABLE','${escV693(x.id)}')">Ngừng</button></td></tr>`).join('')+'</tbody></table></div>':'Chưa có KHBD đối tác cho chương trình này.';
  const selectedProgram=(batchCatalogV704645.programs||[]).find(x=>x.id===programId);
  box.innerHTML=`<div class="alert alert-info py-2"><strong>KHBD đang xem: ${escV693(selectedProgram?.tenChuongTrinh||programId)}</strong> · Môn ${escV693(selectedProgram?.tenMon||'')}<br><button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="chonChuongTrinhKyThayV31()">Dùng chương trình này để ký thay</button></div>`+box.innerHTML;
 }catch(e){showToastV9(e?.message||'Không tải được KHBD đối tác.','warning');}
 finally{buttons.forEach(x=>x.disabled=false);}
}
function partnerPlanSelectV704636(r,selectable=true){
 const program=(typeof batchCatalogV704645!=='undefined'?batchCatalogV704645.programs:[])?.find(x=>x.id===r.programId);
 if(program?.lessonSource==='KHBD_TRUONG'&&program?.khbdMode!=='NONE'&&typeof r.schoolPlanEnabled==='undefined')return '<div class="small text-warning">Chưa nhận được KHBD nhà trường từ máy chủ. Kiểm tra đã deploy Edge Function bản .22 trở lên.</div>';
 if(!r.partnerPlanEnabled)return '';
 const label=r.schoolPlanEnabled?'nhà trường':'đối tác';
 const notice=r.planMessage?`<div class="small text-warning mb-1">${escV693(r.planMessage)}</div>`:'';
 if(!selectable){
  const plans=r.partnerPlans||[];
  return notice+(plans.length?`<div class="small border rounded p-2 mb-1"><strong>KHBD ${label} đã tải · ${plans.length} bài</strong><ul class="mb-1 ps-3">${plans.map(x=>`<li>PPCT ${escV693(x.tiet_ct)} · ${escV693(x.ten_bai)}</li>`).join('')}</ul><span class="text-muted">Danh sách tham khảo; tiết chưa đủ điều kiện ký. Chưa gán bài cho tiết.</span></div>`:(!notice?`<div class="small text-muted mb-1">Chưa có KHBD ${label} phù hợp với tuần/khối/lớp.</div>`:''));
 }
 return notice+`<select class="form-select form-select-sm mb-1 batch-partner-plan-v704636" aria-label="Chọn bài KHBD ${label}" onchange="chonBaiDoiTacV704636(this)"><option value="">${r.partnerPlanRequired?`— Chọn KHBD ${label} (bắt buộc) —`:`— Chọn KHBD ${label} / nhập thực tế —`}</option>`+(r.partnerPlans||[]).map(x=>`<option value="${escV693(x.id)}" ${r.externalKhbdId===x.id?'selected':''}>PPCT ${escV693(x.tiet_ct)} · ${escV693(x.ten_bai)}</option>`).join('')+'</select>';
}
function chonBaiDoiTacV704636(sel){const tr=sel.closest('tr'),r=batchPreviewV704645[Number(tr.dataset.batchIndex)],p=(r.partnerPlans||[]).find(x=>x.id===sel.value),ct=tr.querySelector('.batch-tietct-v704645'),lesson=tr.querySelector('.batch-lesson-v704645');if(p){ct.value=p.tiet_ct;lesson.value=p.ten_bai;}ct.readOnly=!!p;lesson.readOnly=!!p;}

let partnerUploadV704637=null,partnerUploadRequestV704637=0;
function clearPartnerUploadV704637(){partnerUploadRequestV704637++;partnerUploadV704637=null;const preview=document.getElementById('partnerUploadPreviewV704637');if(preview)preview.innerHTML='';const file=document.getElementById('partnerUploadFileV704637');if(file)file.value='';}
function normalizePartnerUploadV704637(matrix){
 const headers=['Tuần','Khối','Lớp','Tiết CT','Tên bài','Yêu cầu cần đạt'];
 const clean=v=>String(v??'').trim();
 if(!matrix.length||headers.some((h,i)=>clean(matrix[0]?.[i]).normalize('NFC')!==h))throw new Error('Tiêu đề không đúng mẫu. Hãy tải file mẫu và giữ nguyên 6 cột.');
 const rows=[],seen=new Set();
 for(let i=1;i<matrix.length;i++){
  const c=matrix[i]||[];if(!c.some(v=>clean(v)))continue;
  if(c.slice(6).some(v=>clean(v)))throw new Error(`Dòng ${i+1}: có dữ liệu ngoài 6 cột của mẫu.`);
  const row={tuan:Number(c[0]),khoi:Number(c[1]),lop:clean(c[2]),tietCT:clean(c[3]),tenBai:clean(c[4]),yeuCau:clean(c[5])};
  if(!Number.isInteger(row.tuan)||row.tuan<1||row.tuan>53)throw new Error(`Dòng ${i+1}: tuần phải là số nguyên 1–53.`);
  if(![10,11,12].includes(row.khoi))throw new Error(`Dòng ${i+1}: khối phải là 10, 11 hoặc 12.`);
  if(!row.lop||!row.tietCT||!row.tenBai)throw new Error(`Dòng ${i+1}: thiếu lớp, tiết CT hoặc tên bài. Dùng * nếu áp dụng chung cho khối.`);
  if(row.tietCT.length>100||row.tenBai.length>2000||row.yeuCau.length>4000)throw new Error(`Dòng ${i+1}: nội dung vượt giới hạn cho phép.`);
  const key=JSON.stringify([row.tuan,row.khoi,row.lop,row.tietCT]);if(seen.has(key))throw new Error(`Dòng ${i+1}: trùng tuần/khối/lớp/tiết CT.`);seen.add(key);rows.push(row);
 }
 if(!rows.length)throw new Error('Trang KHBD_DOI_TAC chưa có bài. Nhập dữ liệu từ dòng 2 rồi tải lại.');
 if(rows.length>300)throw new Error('Mỗi lần tải tối đa 300 bài. Hãy chia file thành nhiều đợt.');
 return rows;
}
async function docFileKhbdDoiTacV704637(event){
 const file=event?.target?.files?.[0],box=document.getElementById('partnerUploadPreviewV704637'),programId=document.getElementById('extSlotProgramV704645')?.value||'';
 const request=++partnerUploadRequestV704637;partnerUploadV704637=null;if(box)box.innerHTML='';
 // Clear older pasted data so a failed file cannot accidentally submit the previous source.
 const paste=document.getElementById('partnerPlanPasteV704636');if(paste)paste.value='';
 if(!file)return;
 try{
  if(!programId)throw new Error('Chọn chương trình ở phía trên trước khi tải file.');
  if(!/\.xlsx$/i.test(file.name))throw new Error('Vui lòng dùng file Excel .xlsx theo mẫu.');
  if(file.size>5*1024*1024)throw new Error('File vượt quá 5 MB. Hãy chia nhỏ file.');
  if(box)box.textContent='Đang đọc file…';
  if(!window.XLSX)await ensureXlsxV7();
  const bytes=await file.arrayBuffer();if(request!==partnerUploadRequestV704637)return;
  const wb=XLSX.read(new Uint8Array(bytes),{type:'array',cellFormula:true}),ws=wb.Sheets['KHBD_DOI_TAC'];
  if(!ws)throw new Error('Thiếu trang KHBD_DOI_TAC. Hãy dùng đúng file mẫu.');
  const range=XLSX.utils.decode_range(ws['!ref']||'A1');
  if(range.e.r>2000||range.e.c>30)throw new Error('Trang dữ liệu quá lớn. Hãy chuyển tối đa 300 bài sang file mẫu mới.');
  if(Object.keys(ws).some(k=>!k.startsWith('!')&&ws[k]?.f))throw new Error('File có công thức. Hãy dán thành giá trị trước khi tải.');
  const rows=normalizePartnerUploadV704637(XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true,blankrows:true}));
  if(request!==partnerUploadRequestV704637)return;
  if(programId!==document.getElementById('extSlotProgramV704645')?.value)throw new Error('Chương trình đã thay đổi. Hãy chọn lại file.');
  partnerUploadV704637={rows,programId};
  if(box)box.innerHTML=`<div class="alert alert-info py-2">Đã đọc <strong>${rows.length} bài</strong> từ ${escV693(file.name)}. Kiểm tra bên dưới rồi bấm <strong>Lưu danh sách bài</strong>. Chưa ghi vào hệ thống.</div><div class="table-responsive" style="max-height:320px;overflow:auto"><table class="table table-sm"><thead><tr><th>Tuần</th><th>Khối</th><th>Lớp</th><th>Tiết CT</th><th>Tên bài</th><th>Yêu cầu cần đạt</th></tr></thead><tbody>`+rows.map(x=>`<tr><td>${x.tuan}</td><td>${x.khoi}</td><td>${escV693(x.lop)}</td><td>${escV693(x.tietCT)}</td><td>${escV693(x.tenBai)}</td><td>${escV693(x.yeuCau)}</td></tr>`).join('')+'</tbody></table></div>';
 }catch(e){if(request!==partnerUploadRequestV704637)return;partnerUploadV704637=null;if(box)box.textContent=e?.message||'Không đọc được file.';showToastV9(e?.message||'Không đọc được file.','warning');}
}

function chonChuongTrinhKyThayV31(){
 const id=document.getElementById('extSlotProgramV704645')?.value||'',sel=document.getElementById('batchProgramV704645');
 if(!id||!sel)return;sel.value=id;batchPreviewV704645=[];renderBatchPreviewV704645();
 sel.dispatchEvent(new Event('change',{bubbles:true}));sel.scrollIntoView({behavior:'smooth',block:'center'});
 showToastV9('Đã chọn cùng chương trình. Bấm Xem trước ký thay để tải KHBD đúng tuần/khối.','info');
}

async function taiMonKhaiBaoNghiV70465332(btn){if(btn)btn.disabled=true;try{const res=await taiChuongTrinhNgoaiV7044(true);if(!res?.success)throw new Error(res?.message||'Không tải được môn chương trình nhà trường.');updateOperationalSubjectsV6953([]);showToastV9('Đã cập nhật môn chương trình nhà trường.','success');}catch(e){showToastV9(e?.message||String(e),'warning');}finally{if(btn)btn.disabled=false;}}

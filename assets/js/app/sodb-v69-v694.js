/* ========================================================================
   SODB V69.4 - MA TRẬN KHBD × LỚP + BÁO CÁO ĐIỀU HÀNH NÂNG CAO
   ======================================================================== */
let khbdMatrixScopesV694=[];
let khbdMatrixDataV694=null;
let advancedOpsReportV694=null;

function v694UnifiedSessions(){return currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};}
function v694Roles(){return currentUnifiedLoginV4&&Array.isArray(currentUnifiedLoginV4.roles)?currentUnifiedLoginV4.roles:[];}
function matrixAuthV694(){const s=v694UnifiedSessions();const x=s.ADMIN||s.BGH||s.TTCM||null;return {token:x&&x.sessionToken||''};}
function reportAuthV694(){const s=v694UnifiedSessions();const x=s.ADMIN||s.BGH||s.GIAM_THI||s.TTCM||null;return {token:x&&x.sessionToken||''};}
function escV694(v){return typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtPctV694(v){return `${Number(v||0).toFixed(1).replace('.0','')}%`;}
function v694Today(){return typeof schoolTodayV693==='function'?schoolTodayV693():new Date().toISOString().slice(0,10);}
function v694AddDays(d,n){return typeof addDaysClientV693==='function'?addDaysClientV693(d,n):new Date(Date.parse(d+'T00:00:00')+n*86400000).toISOString().slice(0,10);}
function csvEscapeV694(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
function downloadCsvV694(name,rows){const text='\ufeff'+rows.map(r=>r.map(csvEscapeV694).join(',')).join('\r\n');const blob=new Blob([text],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},50);}

// ----------------------------- MA TRẬN KHBD × LỚP -----------------------------
function syncKhbdMatrixSubjectOptionsV694(){
  const grade=Number(document.getElementById('khbdMatrixKhoiV694')?.value||10),sel=document.getElementById('khbdMatrixMonV694');if(!sel)return;
  const rows=khbdMatrixScopesV694.filter(x=>Number(x.khoi)===grade),current=sel.value;
  sel.innerHTML=rows.length?rows.map(x=>`<option value="${escV694(x.mon)}">${escV694(x.mon)}</option>`).join(''):'<option value="">-- Chưa có KHBD đã duyệt --</option>';
  if(rows.some(x=>subjectKeyV6955(x.mon)===subjectKeyV6955(current)))sel.value=(rows.find(x=>subjectKeyV6955(x.mon)===subjectKeyV6955(current))||{}).mon||current;
}
function loadKhbdMatrixScopesV694(force){
  const auth=matrixAuthV694();if(!auth.token)return;const nav=document.getElementById('khbd-matrix-nav-v694');if(nav)nav.classList.toggle('d-none',!v694Roles().some(r=>['TTCM','BGH','ADMIN'].includes(r)));if(khbdMatrixScopesV694.length&&!force){syncKhbdMatrixSubjectOptionsV694();return;}
  google.script.run.withSuccessHandler(res=>{khbdMatrixScopesV694=res&&res.success?res.data||[]:[];syncKhbdMatrixSubjectOptionsV694();}).layDanhMucMaTranKHBDV694(auth);
}
function loadKhbdMatrixV694(){
  const auth=matrixAuthV694(),body=document.getElementById('khbdMatrixBodyV694'),summary=document.getElementById('khbdMatrixSummaryV694');if(!auth.token||!body)return;
  const filter={khoi:Number(document.getElementById('khbdMatrixKhoiV694')?.value||0),mon:canonicalSubjectV6955(document.getElementById('khbdMatrixMonV694')?.value),tuan:Number(document.getElementById('khbdMatrixTuanV694')?.value||0)};
  body.innerHTML='<tr><td class="text-center py-4" colspan="99"><span class="spinner-border spinner-border-sm me-2"></span>Đang tổng hợp ma trận...</td></tr>';if(summary)summary.textContent='Đang tải...';
  google.script.run.withSuccessHandler(res=>{if(!res||!res.success){khbdMatrixDataV694=null;body.innerHTML=`<tr><td class="text-center text-danger py-4" colspan="99">${escV694(res&&res.message||'Không tải được ma trận.')}</td></tr>`;if(summary)summary.textContent='';return;}khbdMatrixDataV694=res;renderKhbdMatrixV694();}).layMaTranKHBDLopV694(filter,auth);
}
function renderKhbdMatrixV694(){
  const d=khbdMatrixDataV694,head=document.getElementById('khbdMatrixHeadV694'),body=document.getElementById('khbdMatrixBodyV694'),summary=document.getElementById('khbdMatrixSummaryV694'),cards=document.getElementById('khbdMatrixCardsV694');if(!d||!head||!body)return;
  const cls=d.classes||[],lessons=d.lessons||[],s=d.summary||{};
  if(summary)summary.textContent=`Khối ${d.khoi} · ${d.mon}${d.tuan?` · Tuần ${d.tuan}`:' · Tất cả tuần'} · ${s.classCount||0} lớp · ${s.lessonCount||0} tiết/bài KHBD`;
  if(cards)cards.innerHTML=[['Lớp đủ KHBD',s.completeClasses||0,'success'],['Lớp chưa đủ',s.incompleteClasses||0,'warning'],['Ô đã chọn',s.selectedCells||0,'primary'],['Ô còn thiếu',s.missingCells||0,'danger']].map(x=>`<div class="col-6 col-lg-3"><div class="card h-100 border-${x[2]}-subtle"><div class="card-body py-2"><div class="small text-muted">${x[0]}</div><div class="fs-4 fw-bold">${x[1]}</div></div></div></div>`).join('');
  head.innerHTML=`<tr><th class="v694-sticky-col v694-col-week">Tuần</th><th class="v694-sticky-col v694-col-ppct">PPCT</th><th class="v694-sticky-col v694-col-content">Nội dung bài dạy</th>${cls.map(c=>`<th class="text-center v694-class-head" title="${escV694((c.teachers||[]).map(t=>t.name+' ('+t.account+')').join(' · ')||'Chưa có phân công')}"><div>${escV694(c.lop)}</div><small>${fmtPctV694(c.coverage)}</small></th>`).join('')}</tr>`;
  if(!lessons.length){body.innerHTML=`<tr><td colspan="${3+cls.length}" class="text-center text-muted py-4">Không có dòng KHBD trong phạm vi đã chọn.</td></tr>`;return;}
  body.innerHTML=lessons.map(l=>`<tr><td class="text-center v694-sticky-col v694-col-week">${escV694(l.tuan)}</td><td class="text-center v694-sticky-col v694-col-ppct">${escV694(l.tietPPCT)}</td><td class="v694-sticky-col v694-col-content"><strong>${escV694(l.noiDung)}</strong>${l.yeuCauCanDat?`<div class="small text-muted text-truncate" style="max-width:360px" title="${escV694(l.yeuCauCanDat)}">${escV694(l.yeuCauCanDat)}</div>`:''}</td>${cls.map(c=>{const cell=c.cells&&c.cells[l.id]||{};if(!cell.assignedCount)return '<td class="text-center v694-cell-na" title="Chưa có phân công giáo viên">—</td>';return cell.selected?`<td class="text-center v694-cell-ok" title="Đã chọn${cell.selectedAccounts?.length?': '+escV694(cell.selectedAccounts.join(', ')):''}">✓</td>`:'<td class="text-center v694-cell-missing" title="Có phân công nhưng chưa tích tiết/bài này">!</td>';}).join('')}</tr>`).join('');
}
function exportKhbdMatrixCsvV694(){const d=khbdMatrixDataV694;if(!d)return;const cls=d.classes||[],rows=[['Tuần','Tiết PPCT','Nội dung bài dạy',...cls.map(c=>`${c.lop} (${fmtPctV694(c.coverage)})`)]];for(const l of d.lessons||[])rows.push([l.tuan,l.tietPPCT,l.noiDung,...cls.map(c=>{const cell=c.cells&&c.cells[l.id]||{};return !cell.assignedCount?'CHƯA PHÂN CÔNG':cell.selected?'ĐÃ CHỌN':'CHƯA CHỌN';})]);downloadCsvV694(`Ma_tran_KHBD_Khoi_${d.khoi}_${String(d.mon||'').replace(/\W+/g,'_')}.csv`,rows);}

// ----------------------------- BÁO CÁO ĐIỀU HÀNH NÂNG CAO -----------------------------
function initAdvancedReportDatesV694(){const t=v694Today(),from=document.getElementById('advReportFromV694'),to=document.getElementById('advReportToV694');if(from&&!from.value)from.value=v694AddDays(t,-30);if(to&&!to.value)to.value=t;}
function loadAdvancedOperationsReportV694(){
  const body=document.getElementById('advReportBodyV694');if(!v694Roles().includes('ADMIN')){if(body)body.innerHTML='<tr><td colspan="10" class="text-center text-muted py-4">Báo cáo này chỉ dành cho Quản trị hệ thống.</td></tr>';return;}const auth=reportAuthV694();if(!auth.token||!body)return;initAdvancedReportDatesV694();const f={from:document.getElementById('advReportFromV694')?.value||'',to:document.getElementById('advReportToV694')?.value||'',loai:document.getElementById('advReportTypeV694')?.value||'ALL',trangThai:document.getElementById('advReportStatusV694')?.value||'ALL',lop:document.getElementById('advReportClassV694')?.value||'',mon:canonicalSubjectV6955(document.getElementById('advReportSubjectV694')?.value),teacher:document.getElementById('advReportTeacherV694')?.value||''};body.innerHTML='<tr><td colspan="10" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Đang tổng hợp...</td></tr>';
  google.script.run.withSuccessHandler(res=>{if(!res||!res.success){advancedOpsReportV694=null;body.innerHTML=`<tr><td colspan="10" class="text-center text-danger py-4">${escV694(res&&res.message||'Không tải được báo cáo.')}</td></tr>`;return;}advancedOpsReportV694=res;renderAdvancedOperationsReportV694();}).baoCaoDieuHanhNangCaoV694(f,auth);
}
function renderAdvancedOperationsReportV694(){
  const d=advancedOpsReportV694,m=d&&d.metrics||{},cards=document.getElementById('advReportCardsV694'),body=document.getElementById('advReportBodyV694'),teachers=document.getElementById('advReportTeachersV694'),status=document.getElementById('advReportStatusTextV694');if(!d||!body)return;
  if(status)status.textContent=`Năm học ${d.namHoc} · ${d.from} → ${d.to} · ${m.tongHoSo||0} hồ sơ điều hành`;
  if(cards)cards.innerHTML=[['Tổng hồ sơ',m.tongHoSo,'secondary'],['Dạy thay',m.dayThay,'warning'],['Dạy bù',m.dayBu,'info'],['Hoán đổi',m.hoanDoi,'primary'],['Hoàn thành',m.hoanThanh,'success'],['Chờ duyệt',m.choDuyet,'warning'],['Quá hạn',m.quaHan,'danger'],['Tiết nghỉ chưa bố trí',m.tietNghiChuaBoTri,'danger']].map(x=>`<div class="col-6 col-md-3 col-xl-2"><div class="card h-100 border-${x[2]}-subtle"><div class="card-body py-2"><div class="small text-muted">${x[0]}</div><div class="fs-4 fw-bold">${Number(x[1]||0)}</div></div></div></div>`).join('');
  const groups=d.groups||[];body.innerHTML=groups.length?groups.map(g=>`<tr class="${g.quaHan?'table-danger':''}"><td><strong>${escV694(g.maHoSo)}</strong>${g.quaHan?'<div class="small text-danger fw-bold">QUÁ HẠN</div>':''}</td><td>${escV694(typeof operationLabelV693==='function'?operationLabelV693(g.loai):g.loai)}</td><td>${escV694(g.ngayTu)}${g.ngayDen&&g.ngayDen!==g.ngayTu?` → ${escV694(g.ngayDen)}`:''}</td><td>${escV694((g.lop||[]).join(', '))}</td><td>${escV694((g.mon||[]).join(', '))}</td><td>${escV694((g.gvGoc||[]).join(', ')||'—')}</td><td>${escV694((g.gvThucHien||[]).join(', ')||'—')}${g.external?'<div class="small text-primary">NS ngoài trường</div>':''}</td><td>${escV694(g.trangThai)}</td><td class="text-center">${g.completedRows}/${g.rowCount}<div class="small text-muted">${fmtPctV694(g.completionRate)}</div></td><td>${escV694(g.lyDo||'')}</td></tr>`).join(''):'<tr><td colspan="10" class="text-center text-muted py-4">Không có hồ sơ trong phạm vi lọc.</td></tr>';
  if(teachers){const rows=(d.teachers||[]).slice(0,20);teachers.innerHTML=rows.length?rows.map((t,i)=>`<tr><td>${i+1}</td><td><strong>${escV694(t.name)}</strong><div class="small text-muted">${escV694(t.account)}</div></td><td class="text-center">${t.total}</td><td class="text-center">${t.dayThay}</td><td class="text-center">${t.dayBu}</td><td class="text-center">${t.hoanDoi}</td><td class="text-center">${t.completed}</td></tr>`).join(''):'<tr><td colspan="7" class="text-center text-muted">Chưa có dữ liệu.</td></tr>';}
}
function exportAdvancedOperationsCsvV694(){const d=advancedOpsReportV694;if(!d)return;const rows=[['Hồ sơ','Loại','Trạng thái','Từ ngày','Đến ngày','Lớp','Môn','GV gốc','GV thực hiện','Hoàn thành','Ngoài trường','Lý do']];for(const g of d.groups||[])rows.push([g.maHoSo,g.loai,g.trangThai,g.ngayTu,g.ngayDen,(g.lop||[]).join('; '),(g.mon||[]).join('; '),(g.gvGoc||[]).join('; '),(g.gvThucHien||[]).join('; '),`${g.completedRows}/${g.rowCount}`,g.external?'Có':'Không',g.lyDo]);downloadCsvV694(`Bao_cao_dieu_hanh_${d.from}_${d.to}.csv`,rows);}

function initV694Ui(){
  const roles=v694Roles(),matrixAllowed=roles.some(r=>['TTCM','BGH','ADMIN'].includes(r)),matrixNav=document.getElementById('khbd-matrix-nav-v694');if(matrixNav)matrixNav.classList.toggle('d-none',!matrixAllowed);if(matrixAllowed)loadKhbdMatrixScopesV694(false);
  const reportNav=document.getElementById('control-report-tab-v694')?.closest('li');if(reportNav)reportNav.classList.toggle('d-none',!roles.includes('ADMIN'));
  initAdvancedReportDatesV694();
}
document.addEventListener('DOMContentLoaded',()=>{
  const matrixTab=document.getElementById('khbd-matrix-tab-v694');if(matrixTab)matrixTab.addEventListener('shown.bs.tab',()=>loadKhbdMatrixScopesV694(false));
  const reportTab=document.getElementById('control-report-tab-v694');if(reportTab)reportTab.addEventListener('shown.bs.tab',()=>{initAdvancedReportDatesV694();if(!advancedOpsReportV694)loadAdvancedOperationsReportV694();});
  const mainKhbd=document.getElementById('ttcm-tab');if(mainKhbd)mainKhbd.addEventListener('shown.bs.tab',()=>setTimeout(initV694Ui,80));
  const control=document.getElementById('control-tab-v693');if(control)control.addEventListener('shown.bs.tab',()=>setTimeout(initV694Ui,80));
});

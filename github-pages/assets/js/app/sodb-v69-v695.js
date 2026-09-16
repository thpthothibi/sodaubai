/* ========================================================================
   SODB V69.5.5.5 - CẢNH BÁO BGH/ADMIN, CHỐNG FLASH ROLE STALE
   ======================================================================== */
let automaticAlertsV695=null;
let automaticAlertsLoadedAtV695=0;

function alertRolesV695(){return currentUnifiedLoginV4&&Array.isArray(currentUnifiedLoginV4.roles)?currentUnifiedLoginV4.roles:[];}
function alertSessionTrustedV69555(){return window.sodbUnifiedSessionValidatedV69555===true;}
function alertAllowedV695(){return alertSessionTrustedV69555()&&alertRolesV695().some(r=>['BGH','ADMIN'].includes(r));}
function alertDashboardRoleV69555(){return String(document.getElementById('overviewRoleV20')?.value||'').trim().toUpperCase();}
function alertDashboardAllowedV69555(){return alertAllowedV695()&&['BGH','ADMIN'].includes(alertDashboardRoleV69555());}
function alertAuthV695(){
  const s=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};
  const x=s.ADMIN||s.BGH||null;
  return {token:x&&x.sessionToken||''};
}
function escV695(v){return typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function severityInfoV695(s){return s==='CRITICAL'?{label:'Khẩn cấp',cls:'danger',icon:'!'}:s==='WARNING'?{label:'Cần xử lý',cls:'warning',icon:'!'}:{label:'Theo dõi',cls:'info',icon:'i'};}
function alertTypeLabelV695(t){return ({OP_PENDING:'Hồ sơ chờ duyệt',OP_OVERDUE:'Hồ sơ quá hạn',ABSENCE_UNCOVERED:'Nghỉ GV chưa bố trí',KHBD_PENDING:'KHBD chờ duyệt',KHBD_RETURNED:'KHBD trả lại',KHBD_GAP:'KHBD theo lớp',WEEK_GVCN:'GVCN chưa chốt',WEEK_BGH:'BGH chưa duyệt',EXTERNAL_EXPIRING:'NS ngoài trường',PROXY_EXPIRING:'Quyền ký thay'})[t]||t;}
function alertDashboardDateV695(){return document.getElementById('overviewDateV20')?.value||(typeof schoolTodayV693==='function'?schoolTodayV693():new Date().toISOString().slice(0,10));}

function loadAutomaticAlertsV695(force=false){
  if(typeof syncAlertVisibilityV69553==='function')syncAlertVisibilityV69553();
  const dash=document.getElementById('overviewAlertsV695'),center=document.getElementById('alertCenterListV695');
  if(!alertAllowedV695()){clearAutomaticAlertsUiV69555(true);return;}
  const auth=alertAuthV695();if(!auth.token)return;
  const date=alertDashboardDateV695(),fresh=automaticAlertsV695&&automaticAlertsV695.date===date&&(Date.now()-automaticAlertsLoadedAtV695)<180000;
  if(fresh&&!force){renderAutomaticAlertsV695();return;}
  if(dash&&alertDashboardAllowedV69555()){dash.classList.remove('d-none');const l=document.getElementById('overviewAlertListV695');if(l)l.innerHTML='<div class="text-muted py-2"><span class="spinner-border spinner-border-sm me-2"></span>Đang rà soát cảnh báo...</div>';}
  if(center)center.innerHTML='<div class="text-muted py-3 text-center"><span class="spinner-border spinner-border-sm me-2"></span>Đang rà soát cảnh báo...</div>';
  google.script.run.withSuccessHandler(res=>{
    if(!res||!res.success){automaticAlertsV695=null;renderAutomaticAlertsErrorV695(res&&res.message||'Không tải được cảnh báo.');return;}
    automaticAlertsV695=res;automaticAlertsLoadedAtV695=Date.now();renderAutomaticAlertsV695();
  }).withFailureHandler(err=>renderAutomaticAlertsErrorV695(err&&err.message||String(err))).layCanhBaoTuDongV695({date,limit:200},auth);
}
function renderAutomaticAlertsErrorV695(msg){
  const safe=escV695(msg);const l=document.getElementById('overviewAlertListV695'),c=document.getElementById('alertCenterListV695');
  if(l)l.innerHTML=`<div class="text-danger py-2">${safe}</div>`;if(c)c.innerHTML=`<div class="alert alert-danger">${safe}</div>`;
}
function alertCardHtmlV695(a,compact=false){
  const sev=severityInfoV695(a.severity),btn=a.action?`<button type="button" class="btn btn-sm btn-outline-${sev.cls} flex-shrink-0" onclick="handleAlertActionV695('${escV695(a.id)}')">Xử lý</button>`:'';
  return `<div class="border rounded p-2 ${compact?'mb-2':'mb-2'} border-${sev.cls}-subtle bg-${sev.cls}-subtle bg-opacity-10"><div class="d-flex justify-content-between gap-2 align-items-start"><div class="min-w-0"><div class="d-flex flex-wrap gap-1 align-items-center"><span class="badge text-bg-${sev.cls}">${sev.label}</span><span class="badge text-bg-light border text-dark">${escV695(alertTypeLabelV695(a.type))}</span></div><div class="fw-bold mt-1">${escV695(a.title)}</div><div class="small text-muted">${escV695(a.message||'')}</div></div>${btn}</div></div>`;
}
function renderAutomaticAlertsV695(){
  const d=automaticAlertsV695;if(!d)return;const m=d.metrics||{},alerts=d.alerts||[];
  const dash=document.getElementById('overviewAlertsV695');if(dash)dash.classList.toggle('d-none',!alertDashboardAllowedV69555());
  document.querySelectorAll('#overviewAlertMetricsV695 [data-alert-metric]').forEach(x=>x.textContent=String(m[x.dataset.alertMetric]??0));
  const status=document.getElementById('overviewAlertStatusV695');if(status)status.textContent=`Tuần ${d.week} · Cập nhật ${d.updatedAt||''}`;
  const badge=document.getElementById('controlAlertBadgeV695');if(badge){badge.textContent=String((m.critical||0)+(m.warning||0));badge.classList.toggle('d-none',!((m.critical||0)+(m.warning||0)));}
  const list=document.getElementById('overviewAlertListV695');if(list){const top=alerts.slice(0,6);list.innerHTML=top.length?top.map(a=>alertCardHtmlV695(a,true)).join(''):'<div class="alert alert-success mb-0 py-2">Không có cảnh báo cần xử lý trong phạm vi hiện tại.</div>';}
  renderAlertCenterV695();
}
function renderAlertCenterV695(){
  const d=automaticAlertsV695;if(!d)return;const m=d.metrics||{},box=document.getElementById('alertCenterListV695');
  document.querySelectorAll('#alertCenterMetricsV695 [data-alert-metric]').forEach(x=>x.textContent=String(m[x.dataset.alertMetric]??0));
  const st=document.getElementById('alertCenterStatusV695');if(st)st.textContent=`Ngày ${d.date} · Tuần ${d.week} · ${m.total||0} cảnh báo${d.truncated?' (danh sách đã rút gọn)':''}`;
  if(!box)return;const sev=document.getElementById('alertSeverityV695')?.value||'ALL',type=document.getElementById('alertTypeV695')?.value||'ALL';let rows=(d.alerts||[]).filter(a=>(sev==='ALL'||a.severity===sev)&&(type==='ALL'||a.type===type));box.innerHTML=rows.length?rows.map(a=>alertCardHtmlV695(a,false)).join(''):'<div class="alert alert-success">Không có cảnh báo theo bộ lọc.</div>';
}
function filterAlertsV695(){renderAlertCenterV695();}
function findAlertV695(id){return (automaticAlertsV695?.alerts||[]).find(a=>String(a.id)===String(id));}
function showMainTabV695(id){const el=document.getElementById(id);if(!el)return;try{window.bootstrap?bootstrap.Tab.getOrCreateInstance(el).show():el.click();}catch(_e){el.click();}}
function showControlPaneV695(target){showMainTabV695('control-tab-v693');setTimeout(()=>{const b=document.querySelector(`#tabControlV693 [data-bs-target="${target}"]`);if(b){try{window.bootstrap?bootstrap.Tab.getOrCreateInstance(b).show():b.click();}catch(_e){b.click();}}},80);}
function openAlertCenterV695(){if(!alertAllowedV695())return;showControlPaneV695('#control-alerts-v695');setTimeout(()=>loadAutomaticAlertsV695(false),120);}
function openKhbdMatrixFromAlertV695(a){showMainTabV695('ttcm-tab');setTimeout(()=>{const b=document.getElementById('khbd-matrix-tab-v694');if(b){try{window.bootstrap?bootstrap.Tab.getOrCreateInstance(b).show():b.click();}catch(_e){b.click();}}const grade=document.getElementById('khbdMatrixKhoiV694'),week=document.getElementById('khbdMatrixTuanV694');if(grade&&a.meta?.khoi)grade.value=String(a.meta.khoi);if(week&&a.meta?.tuan)week.value=String(a.meta.tuan);if(typeof loadKhbdMatrixScopesV694==='function')loadKhbdMatrixScopesV694(true);setTimeout(()=>{const mon=document.getElementById('khbdMatrixMonV694');if(mon&&a.meta?.mon){const opt=[...mon.options].find(o=>subjectKeyV6955(o.value)===subjectKeyV6955(a.meta.mon));if(opt)mon.value=opt.value;}if(typeof loadKhbdMatrixV694==='function')loadKhbdMatrixV694();},260);},100);}
function handleAlertActionV695(id){
  const a=findAlertV695(id);if(!a)return;switch(a.action){
    case 'CONTROL_OP':showControlPaneV695('#control-ops-v693');break;
    case 'CONTROL_ABSENCE':showControlPaneV695('#control-absence-v693');break;
    case 'CONTROL_EXTERNAL':showControlPaneV695('#control-external-v693');break;
    case 'CONTROL_PROXY':showControlPaneV695('#control-proxy-v693');break;
    case 'KHBD_MATRIX':openKhbdMatrixFromAlertV695(a);break;
    case 'KHBD_APPROVAL':showMainTabV695('ttcm-tab');setTimeout(()=>{const isTtcm=alertRolesV695().includes('TTCM')&&!alertRolesV695().some(r=>['BGH','ADMIN'].includes(r));const b=document.getElementById(isTtcm?'khbd-submitted-tab-v659':'khbd-approval-tab-v50')||document.getElementById('khbd-submitted-tab-v659');if(b){try{window.bootstrap?bootstrap.Tab.getOrCreateInstance(b).show():b.click();}catch(_e){b.click();}}},100);break;
    case 'BGH_WORKFLOW':showMainTabV695('bgh-workflow-tab-v698');setTimeout(()=>{const w=document.getElementById('bghWorkflowWeekV698');if(w&&a.meta?.tuan)w.value=String(a.meta.tuan);if(typeof loadBghWorkflowV698==='function')loadBghWorkflowV698(true);},120);break;
    case 'VIEW_BOOK':showMainTabV695('view-tab');setTimeout(()=>{const w=document.getElementById('viewTuan');if(w&&a.meta?.tuan)w.value=String(a.meta.tuan);},100);break;
    default:openAlertCenterV695();
  }
}

document.addEventListener('DOMContentLoaded',function(){
  const dash=document.getElementById('dashboard-tab-v9');if(dash)dash.addEventListener('shown.bs.tab',()=>{if(alertDashboardAllowedV69555())setTimeout(()=>loadAutomaticAlertsV695(false),420);else syncAlertVisibilityV69553();});
  const date=document.getElementById('overviewDateV20');if(date)date.addEventListener('change',()=>{if(alertDashboardAllowedV69555())setTimeout(()=>loadAutomaticAlertsV695(true),260);});
  const tab=document.getElementById('control-alerts-tab-v695');if(tab)tab.addEventListener('shown.bs.tab',()=>loadAutomaticAlertsV695(false));
});


// V69.5.5.5: xóa sạch UI cảnh báo khi role chưa được backend xác thực hoặc Dashboard không phải BGH/Admin.
function clearAutomaticAlertsUiV69555(clearData=false){
  const dash=document.getElementById('overviewAlertsV695');if(dash)dash.classList.add('d-none');
  const list=document.getElementById('overviewAlertListV695');if(list)list.innerHTML='';
  const badge=document.getElementById('controlAlertBadgeV695');if(badge){badge.textContent='';badge.classList.add('d-none');}
  if(clearData){automaticAlertsV695=null;automaticAlertsLoadedAtV695=0;const c=document.getElementById('alertCenterListV695');if(c)c.innerHTML='';}
}
function syncAlertVisibilityV69553(){
  const allowed=alertAllowedV695();
  const dashAllowed=alertDashboardAllowedV69555();
  const dash=document.getElementById('overviewAlertsV695');
  if(dash)dash.classList.toggle('d-none',!dashAllowed);
  if(!dashAllowed){const list=document.getElementById('overviewAlertListV695');if(list)list.innerHTML='';}
  const btn=document.getElementById('control-alerts-tab-v695');
  const nav=btn&&btn.closest('li');
  if(nav)nav.classList.toggle('d-none',!allowed);
  const pane=document.getElementById('control-alerts-v695');
  if(pane&&!allowed)pane.classList.remove('show','active');
  if(!allowed)clearAutomaticAlertsUiV69555(true);
}
document.addEventListener('DOMContentLoaded',syncAlertVisibilityV69553);

/* ========================================================================
   SODB V70.4.6.9 - CẢNH BÁO BGH/ADMIN: NHẸ, PHÂN ĐOẠN, CÓ CACHE
   - Mở Dashboard: chỉ tải SUMMARY nhẹ, không quét ma trận KHBD toàn trường.
   - "Rà soát lại": chạy tuần tự CONTROL -> KHBD -> WEEK -> PEOPLE để tránh
     dồn compute vào một Edge invocation.
   - Giữ kết quả gần nhất trong localStorage 5 phút; lỗi 1 nhóm không làm sập
     toàn bộ Trung tâm cảnh báo.
   ======================================================================== */
let automaticAlertsV695=null;
let automaticAlertsLoadedAtV695=0;
let automaticAlertsLoadingV70469=false;
const ALERT_CACHE_TTL_V70469=5*60*1000;

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
function alertRpcSectionV70469(section,date,limit=120){
  const auth=alertAuthV695();
  return new Promise((resolve,reject)=>{
    google.script.run.withSuccessHandler(res=>res&&res.success?resolve(res):reject(new Error(res&&res.message||`Không tải được nhóm ${section}.`)))
      .withFailureHandler(err=>reject(new Error(err&&err.message||String(err))))
      .layCanhBaoTuDongV695({date,limit,section},auth);
  });
}
function mergeAlertSectionsV70469(parts,date,errors=[]){
  const ok=(parts||[]).filter(Boolean);if(!ok.length)return null;
  const seen=new Set(),alerts=[];for(const p of ok)for(const a of (p.alerts||[])){const k=String(a.id||`${a.type}|${a.title}|${JSON.stringify(a.meta||{})}`);if(seen.has(k))continue;seen.add(k);alerts.push(a);}
  alerts.sort((a,b)=>{const ra=a.severity==='CRITICAL'?0:a.severity==='WARNING'?1:2,rb=b.severity==='CRITICAL'?0:b.severity==='WARNING'?1:2;return ra-rb||String(a.title||'').localeCompare(String(b.title||''),'vi');});
  const num=k=>ok.reduce((n,p)=>n+Number(p.metrics?.[k]||0),0);
  const first=ok[0]||{};
  return {success:true,namHoc:first.namHoc||'',date:first.date||date,week:first.week||0,prevWeek:first.prevWeek||0,metrics:{total:alerts.length,critical:alerts.filter(x=>x.severity==='CRITICAL').length,warning:alerts.filter(x=>x.severity==='WARNING').length,info:alerts.filter(x=>x.severity==='INFO').length,uncoveredPeriods:num('uncoveredPeriods'),khbdGap:num('khbdGap'),pendingOperations:num('pendingOperations'),overdueOperations:num('overdueOperations')},alerts,truncated:ok.some(p=>p.truncated),updatedAt:first.updatedAt||'',scanMode:'FULL_STAGED',partialErrors:errors};
}
function setAlertLoadingV70469(text='Đang rà soát cảnh báo...'){
  const dash=document.getElementById('overviewAlertsV695'),center=document.getElementById('alertCenterListV695');
  if(dash&&alertDashboardAllowedV69555()){dash.classList.remove('d-none');const l=document.getElementById('overviewAlertListV695');if(l)l.innerHTML=`<div class="text-muted py-2"><span class="spinner-border spinner-border-sm me-2"></span>${escV695(text)}</div>`;}
  if(center)center.innerHTML=`<div class="text-muted py-3 text-center"><span class="spinner-border spinner-border-sm me-2"></span>${escV695(text)}</div>`;
}
async function loadAutomaticAlertsV695(force=false){
  if(typeof syncAlertVisibilityV69553==='function')syncAlertVisibilityV69553();
  if(!alertAllowedV695()){clearAutomaticAlertsUiV69555(true);return;}
  const auth=alertAuthV695();if(!auth.token)return;
  if(automaticAlertsLoadingV70469)return;
  const date=alertDashboardDateV695(),fresh=automaticAlertsV695&&automaticAlertsV695.date===date&&(Date.now()-automaticAlertsLoadedAtV695)<ALERT_CACHE_TTL_V70469;
  if(fresh&&!force){renderAutomaticAlertsV695();return;}
  automaticAlertsLoadingV70469=true;
  if(!force){
    setAlertLoadingV70469('Đang tải tóm tắt cảnh báo...');
    try{const res=await alertRpcSectionV70469('SUMMARY',date,80);automaticAlertsV695=res;automaticAlertsLoadedAtV695=Date.now();renderAutomaticAlertsV695();}
    catch(err){renderAutomaticAlertsErrorV695(err&&err.message||String(err));}
    finally{automaticAlertsLoadingV70469=false;}
    return;
  }
  setAlertLoadingV70469('Đang rà soát theo từng nhóm để giảm tải máy chủ...');
  const parts=[],errors=[];
  try{
    for(const section of ['CONTROL','KHBD','WEEK','PEOPLE']){
      try{parts.push(await alertRpcSectionV70469(section,date,120));}
      catch(err){errors.push({section,message:String(err&&err.message||err||'Lỗi')});}
    }
    const merged=mergeAlertSectionsV70469(parts,date,errors);
    if(!merged){renderAutomaticAlertsErrorV695(errors[0]?.message||'Không thể rà soát cảnh báo lúc này.');return;}
    automaticAlertsV695=merged;automaticAlertsLoadedAtV695=Date.now();renderAutomaticAlertsV695();
  }finally{automaticAlertsLoadingV70469=false;}
}
function renderAutomaticAlertsErrorV695(msg){
  try{console.warn('[SODB alerts]',msg);}catch(_e){}
  const cached=automaticAlertsV695;
  if(cached){automaticAlertsV695=cached;renderAutomaticAlertsV695();const st=document.getElementById('overviewAlertStatusV695');if(st)st.textContent='Chưa thể cập nhật cảnh báo mới · đang hiển thị kết quả gần nhất';const cs=document.getElementById('alertCenterStatusV695');if(cs)cs.textContent='Chưa thể cập nhật cảnh báo mới · đang hiển thị kết quả gần nhất';return;}
  const user='Chưa thể rà soát cảnh báo lúc này. Vui lòng thử lại sau; các chức năng khác vẫn sử dụng bình thường.';
  const l=document.getElementById('overviewAlertListV695'),c=document.getElementById('alertCenterListV695');if(l)l.innerHTML=`<div class="text-warning py-2">${user}</div>`;if(c)c.innerHTML=`<div class="alert alert-warning">${user}</div>`;
}
function alertCardHtmlV695(a,compact=false){
  const sev=severityInfoV695(a.severity),btn=a.action?`<button type="button" class="btn btn-sm btn-outline-${sev.cls} flex-shrink-0" onclick="handleAlertActionV695('${escV695(a.id)}')">Xử lý</button>`:'';
  return `<div class="border rounded p-2 ${compact?'mb-2':'mb-2'} border-${sev.cls}-subtle bg-${sev.cls}-subtle bg-opacity-10"><div class="d-flex justify-content-between gap-2 align-items-start"><div class="min-w-0"><div class="d-flex flex-wrap gap-1 align-items-center"><span class="badge text-bg-${sev.cls}">${sev.label}</span><span class="badge text-bg-light border text-dark">${escV695(alertTypeLabelV695(a.type))}</span></div><div class="fw-bold mt-1">${escV695(a.title)}</div><div class="small text-muted">${escV695(a.message||'')}</div></div>${btn}</div></div>`;
}
function renderAutomaticAlertsV695(){
  const d=automaticAlertsV695;if(!d)return;const m=d.metrics||{},alerts=d.alerts||[],partial=Array.isArray(d.partialErrors)&&d.partialErrors.length;
  const dash=document.getElementById('overviewAlertsV695');if(dash)dash.classList.toggle('d-none',!alertDashboardAllowedV69555());
  document.querySelectorAll('#overviewAlertMetricsV695 [data-alert-metric]').forEach(x=>x.textContent=String(m[x.dataset.alertMetric]??0));
  const status=document.getElementById('overviewAlertStatusV695');if(status)status.textContent=`Tuần ${d.week} · ${d.scanMode==='FULL_STAGED'?'Rà soát đầy đủ':'Tóm tắt nhẹ'} · Cập nhật ${d.updatedAt||''}${partial?' · một số nhóm chưa cập nhật':''}`;
  const badge=document.getElementById('controlAlertBadgeV695');if(badge){badge.textContent=String((m.critical||0)+(m.warning||0));badge.classList.toggle('d-none',!((m.critical||0)+(m.warning||0)));}
  const list=document.getElementById('overviewAlertListV695');if(list){const top=alerts.slice(0,6),warn=partial?'<div class="alert alert-warning py-2 mb-2 small">Một số nhóm cảnh báo chưa cập nhật; các kết quả còn lại vẫn được giữ.</div>':'';list.innerHTML=warn+(top.length?top.map(a=>alertCardHtmlV695(a,true)).join(''):'<div class="alert alert-success mb-0 py-2">Không có cảnh báo cần xử lý trong phạm vi hiện tại.</div>');}
  renderAlertCenterV695();
}
function renderAlertCenterV695(){
  const d=automaticAlertsV695;if(!d)return;const m=d.metrics||{},box=document.getElementById('alertCenterListV695'),partial=Array.isArray(d.partialErrors)&&d.partialErrors.length;
  document.querySelectorAll('#alertCenterMetricsV695 [data-alert-metric]').forEach(x=>x.textContent=String(m[x.dataset.alertMetric]??0));
  const st=document.getElementById('alertCenterStatusV695');if(st)st.textContent=`Ngày ${d.date} · Tuần ${d.week} · ${m.total||0} cảnh báo${d.scanMode==='FULL_STAGED'?' · rà soát đầy đủ':' · tóm tắt nhẹ'}${partial?' · có nhóm chưa cập nhật':''}${d.truncated?' (danh sách đã rút gọn)':''}`;
  if(!box)return;const sev=document.getElementById('alertSeverityV695')?.value||'ALL',type=document.getElementById('alertTypeV695')?.value||'ALL';let rows=(d.alerts||[]).filter(a=>(sev==='ALL'||a.severity===sev)&&(type==='ALL'||a.type===type));const warn=partial?'<div class="alert alert-warning py-2 small">Có nhóm rà soát tạm thời chưa phản hồi. Không ảnh hưởng các chức năng nhập/xem sổ.</div>':'';box.innerHTML=warn+(rows.length?rows.map(a=>alertCardHtmlV695(a,false)).join(''):'<div class="alert alert-success">Không có cảnh báo theo bộ lọc.</div>');
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
  const date=document.getElementById('overviewDateV20');if(date)date.addEventListener('change',()=>{automaticAlertsV695=null;automaticAlertsLoadedAtV695=0;if(alertDashboardAllowedV69555())setTimeout(()=>loadAutomaticAlertsV695(false),260);});
  const tab=document.getElementById('control-alerts-tab-v695');if(tab)tab.addEventListener('shown.bs.tab',()=>loadAutomaticAlertsV695(false));
});

function clearAutomaticAlertsUiV69555(hide=true){
  automaticAlertsV695=null;automaticAlertsLoadedAtV695=0;
  const dash=document.getElementById('overviewAlertsV695');if(dash){if(hide)dash.classList.add('d-none');const l=document.getElementById('overviewAlertListV695');if(l)l.innerHTML='';}
  const center=document.getElementById('alertCenterListV695');if(center)center.innerHTML='';
  const badge=document.getElementById('controlAlertBadgeV695');if(badge){badge.textContent='0';badge.classList.add('d-none');}
  document.querySelectorAll('#overviewAlertMetricsV695 [data-alert-metric],#alertCenterMetricsV695 [data-alert-metric]').forEach(x=>x.textContent='—');
}
function syncAlertVisibilityV69553(){
  const allowed=alertAllowedV695();const dash=document.getElementById('overviewAlertsV695');if(dash)dash.classList.toggle('d-none',!(allowed&&alertDashboardAllowedV69555()));
  const tab=document.getElementById('control-alerts-tab-v695');if(tab)tab.classList.toggle('d-none',!allowed);
  const pane=document.getElementById('control-alerts-v695');if(pane&&!allowed)pane.classList.remove('show','active');
  if(!allowed)clearAutomaticAlertsUiV69555(true);
}

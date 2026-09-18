function compareBghClassOrderV70441(a,b){const ga=Number(a?.khoi||0),gb=Number(b?.khoi||0),oa=Number.isFinite(Number(a?.thuTu))?Number(a.thuTu):9999,ob=Number.isFinite(Number(b?.thuTu))?Number(b.thuTu):9999,la=String(a?.lop||'').trim(),lb=String(b?.lop||'').trim();return ga-gb||oa-ob||la.localeCompare(lb,'vi',{numeric:true,sensitivity:'base'});}
/* SODB V70.1 - BGH WORKFLOW
 * - Hàng đợi duyệt tuần + ma trận lớp x tuần.
 * - Không dùng setTimeout cố định khi mở sổ.
 * - Đồng bộ Khối -> danh mục lớp Supabase -> Lớp -> Tuần -> tải sổ.
 * - Tự làm mới khi quay lại tab và đánh dấu dữ liệu thay đổi sau duyệt.
 */
let bghWorkflowCacheV698=null,bghMatrixCacheV698=null,bghWorkflowInitV698=false;
let bghWorkflowCacheInvalidatedAtV701=Date.now();

function bghWorkflowSessionV698(){const s=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};return s.BGH||s.ADMIN||null;}
function bghCanApproveV698(){const s=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};return !!(s.BGH&&s.BGH.sessionToken);}
function bghEscV698(v){return typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function bghCurrentWeekV698(){try{const p=String(START_DATE_WEEK1_STR||'').split('-').map(Number),start=new Date(p[0],p[1]-1,p[2],12),now=new Date();return Math.max(1,Math.min(53,Math.floor((now-start)/604800000)+1));}catch(_e){return 1;}}
function fillBghWeekSelectV698(id,value){const el=document.getElementById(id);if(!el)return;const old=Number(value||el.value||0);if(el.options.length!==53){el.innerHTML='';for(let i=1;i<=53;i++)el.add(new Option('Tuần '+i,String(i)));}if(old>=1&&old<=53)el.value=String(old);}

function invalidateBghWorkflowCacheV701(){
  bghLoadSeqV7044++;bghSelectedV7044.clear();updateBatchButtonV7044();
  bghWorkflowCacheV698=null;bghMatrixCacheV698=null;bghWorkflowCacheInvalidatedAtV701=Date.now();
}
function bghStatusBadgeV698(code,label){
  const map={DU_LIEU_DA_THAY_DOI:'dark',DA_DUYET:'success',SAN_SANG_DUYET:'warning',CHO_BGH_KIEM_TRA:'info',CAN_KIEM_TRA_LAI:'warning',CON_TIET_CHUA_KY:'danger',CHO_GVCN_CHOT:'info',CHUA_CO_DU_LIEU:'secondary'};
  return `<span class="badge text-bg-${map[code]||'secondary'}">${bghEscV698(label||code)}</span>`;
}
function renderBghWorkflowCardsV698(summary){
  const s=summary||{},cards=[['Tổng lớp',s.total||0,'primary'],['Cần duyệt lại',s.stale||0,'dark'],['Đã kiểm tra · có thể duyệt',s.ready||0,'success'],['Chờ kiểm tra',s.waitingReview||0,'info'],['Đã duyệt',s.approved||0,'success'],['Chờ GVCN',s.waitingGvcn||0,'info'],['Tiết chưa ký',s.unsignedPeriods||0,'danger'],['Chưa dữ liệu',s.noData||0,'secondary']];
  const el=document.getElementById('bghWorkflowCardsV698');if(el)el.innerHTML=cards.map(x=>`<div class="col-6 col-md-4 col-xl"><div class="bgh-metric-v698"><div class="small text-muted">${x[0]}</div><div class="fs-4 fw-bold text-${x[2]}">${Number(x[1]||0)}</div></div></div>`).join('');
}
function renderBghWorkflowV698(res){
  res={...res,data:[...(res.data||[])].sort(compareBghClassOrderV70441)};
  bghSelectedV7044.clear();updateBatchButtonV7044();
  bghWorkflowCacheV698=res;fillBghWeekSelectV698('bghWorkflowWeekV698',res.week);renderBghWorkflowCardsV698(res.summary);
  const body=document.getElementById('bghWorkflowBodyV698'),rows=Array.isArray(res.data)?res.data:[],canOpen=bghCanApproveV698();
  if(body)body.innerHTML=rows.length?rows.map((r,i)=>{
    const gv=r.gvcn||{},gvText=gv.hoTen?`<strong>${bghEscV698(gv.hoTen)}</strong>${gv.taiKhoan?`<div class="small text-muted">${bghEscV698(gv.taiKhoan)}</div>`:''}`:'<span class="text-danger">Chưa phân công</span>';
    const close=r.gvcnClosed?`<span class="text-success fw-semibold">✓ Đã chốt</span>${r.gvcnClosedAt?`<div class="small text-muted">${bghEscV698(r.gvcnClosedAt)}</div>`:''}`:'<span class="text-muted">Chưa chốt</span>';
    let approve='<span class="text-muted">Chưa duyệt</span>';
    if(r.bghDataChanged)approve=`<span class="text-danger fw-bold">⚠ Cần duyệt lại</span>${r.bghApprovedAt?`<div class="small text-muted">Lần duyệt: ${bghEscV698(r.bghApprovedAt)}</div>`:''}${r.bghDataChangedAt?`<div class="small text-danger">Dữ liệu đổi: ${bghEscV698(r.bghDataChangedAt)}</div>`:''}`;
    else if(r.bghApproved)approve=`<span class="text-success fw-semibold">✓ ${bghEscV698(r.bghName||'BGH')}</span>${r.bghApprovedAt?`<div class="small text-muted">${bghEscV698(r.bghApprovedAt)}</div>`:''}`;
    const review=r.review||{},reviewLabel=review.eligible?'BGH đã kiểm tra':review.needsReview?'Cần kiểm tra lại':review.reviewed?'Đã kiểm tra · '+(review.reason||''):review.reason||'Chưa kiểm tra';
    const select=canOpen?`<input type="checkbox" class="form-check-input" aria-label="Chọn ${bghEscV698(r.lop)}" ${review.eligible?'':'disabled'} onchange="selectReviewedV7044(${i},this)">`:String(i+1);
    const primary=r.status==='SAN_SANG_DUYET'||r.status==='DU_LIEU_DA_THAY_DOI';
    const label=r.status==='DU_LIEU_DA_THAY_DOI'?'Xem & duyệt lại':r.status==='SAN_SANG_DUYET'?'Xem & duyệt':'Mở sổ';
    const action=canOpen?`<button type="button" class="btn btn-sm ${primary?'btn-primary':'btn-outline-primary'} fw-semibold" onclick="openBghBookV698(decodeURIComponent('${encodeURIComponent(r.lop)}'),${Number(r.tuan||0)})">${label}</button>`:'<span class="small text-muted">Theo dõi</span>';
    return `<tr class="bgh-row-${bghEscV698(r.status).toLowerCase().replace(/_/g,'-')}-v698"><td>${select}</td><td class="fw-bold text-primary">${bghEscV698(r.lop)}</td><td>${Number(r.khoi||0)||''}</td><td>${gvText}</td><td class="text-center fw-semibold">${Number(r.periods||0)}</td><td class="text-center ${Number(r.unsignedPeriods||0)>0?'text-danger fw-bold':''}">${Number(r.unsignedPeriods||0)}</td><td>${close}</td><td>${approve}</td><td>${bghStatusBadgeV698(r.status,r.statusLabel)}<div class="small mt-1 ${review.eligible?'text-success':'text-muted'}">${bghEscV698(reviewLabel)}${review.reviewedAt?`<br>${bghEscV698(new Date(review.reviewedAt).toLocaleString('vi-VN'))}`:''}</div></td><td class="text-end">${action}</td></tr>`;
  }).join(''):`<tr><td colspan="10" class="text-center text-muted py-4">Không có lớp phù hợp bộ lọc.</td></tr>`;
  const st=document.getElementById('bghWorkflowStatusTextV698');if(st)st.textContent=`Năm học ${res.namHoc||''} · Tuần ${res.week||''} · ${rows.length}/${res.summary?.total||rows.length} lớp hiển thị · cập nhật ${res.updatedAt||''}`;
}
async function loadBghWorkflowV698(_force){
  const seq=++bghLoadSeqV7044;
  bghSelectedV7044.clear();updateBatchButtonV7044();
  const session=bghWorkflowSessionV698();if(!session?.sessionToken){showToastV9('Tài khoản không có quyền BGH/Admin.','danger');return;}
  const body=document.getElementById('bghWorkflowBodyV698');if(body)body.innerHTML='<tr><td colspan="10" class="text-center text-muted py-4"><span class="spinner-border spinner-border-sm me-2"></span>Đang tổng hợp trạng thái toàn trường...</td></tr>';
  const filter={tuan:Number(document.getElementById('bghWorkflowWeekV698')?.value||0),khoi:Number(document.getElementById('bghWorkflowGradeV698')?.value||0),trangThai:document.getElementById('bghWorkflowStatusV698')?.value||'ALL',timKiem:document.getElementById('bghWorkflowSearchV698')?.value||''};
  try{const r=await callSodbEdgeRpcV67('layTrungTamDuyetTuanBGHV698',[filter,{token:session.sessionToken}]);if(!r?.success)throw new Error(r?.message||'Không tải được trung tâm duyệt tuần.');if(seq===bghLoadSeqV7044)renderBghWorkflowV698(r);}
  catch(e){if(seq!==bghLoadSeqV7044)return;if(body)body.innerHTML=`<tr><td colspan="10" class="text-center text-danger py-4">${bghEscV698(e?.message||e)}</td></tr>`;showToastV9(e?.message||String(e),'danger');}
}

function showMainTabAndWaitV701(tab){
  return new Promise((resolve,reject)=>{
    if(!tab)return reject(new Error('Không tìm thấy tab Sổ đầu bài.'));
    if(tab.parentElement?.classList.contains('d-none'))return reject(new Error('Tài khoản hiện tại không có quyền mở Sổ đầu bài.'));
    const paneSelector=tab.getAttribute('data-bs-target'),pane=paneSelector?document.querySelector(paneSelector):null;
    if(tab.classList.contains('active')||(pane&&pane.classList.contains('active')))return resolve(true);
    let done=false;const finish=()=>{if(done)return;done=true;tab.removeEventListener('shown.bs.tab',finish);requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)));};
    tab.addEventListener('shown.bs.tab',finish,{once:true});
    try{window.bootstrap?bootstrap.Tab.getOrCreateInstance(tab).show():tab.click();}catch(e){tab.removeEventListener('shown.bs.tab',finish);reject(e);}
  });
}
async function ensureViewClassReadyV701(lop){
  const grade=String(typeof getClassGradeV39==='function'?getClassGradeV39(lop):String(lop||'').match(/^(10|11|12)/)?.[1]||'');
  if(!grade)throw new Error(`Không xác định được khối của lớp ${lop}. Kiểm tra danh mục lớp trên Supabase.`);
  const gradeEl=document.getElementById('viewKhoi'),classEl=document.getElementById('viewLop');
  if(!gradeEl||!classEl)throw new Error('Thiếu bộ lọc Khối/Lớp của Sổ đầu bài.');
  gradeEl.value=grade;if(typeof chonKhoiLopView==='function')chonKhoiLopView();
  let opt=[...classEl.options].find(o=>String(o.value).trim()===String(lop).trim());
  if(!opt){
    const res=await callSodbEdgeRpcV67('getDanhSachLopMoiV29',[]);
    if(!res?.success)throw new Error(res?.message||'Không làm mới được danh mục lớp Supabase.');
    if(typeof applyClassCatalogV23==='function')applyClassCatalogV23(res);
    gradeEl.value=grade;if(typeof chonKhoiLopView==='function')chonKhoiLopView();
    opt=[...classEl.options].find(o=>String(o.value).trim()===String(lop).trim());
  }
  if(!opt)throw new Error(`Lớp ${lop} không còn trong danh mục lớp đang dùng trên Supabase.`);
  classEl.value=opt.value;return true;
}
async function openBghBookV698(lop,tuan){
  if(!bghCanApproveV698()){showToastV9('Muốn mở và ký duyệt, tài khoản cần có vai trò BGH.','warning');return;}
  const tab=document.getElementById('view-tab');
  try{
    await showMainTabAndWaitV701(tab);
    const mode=document.getElementById('viewBookMode'),week=document.getElementById('viewTuan');
    if(mode){mode.disabled=false;mode.value='LOP_CHINH';}
    await ensureViewClassReadyV701(String(lop||'').trim());
    if(week)week.value=String(Number(tuan||1));
    if(typeof capNhatLoaiSoViewV24==='function')capNhatLoaiSoViewV24();
    if(typeof traCuuSoDauBaiTuanGop==='function')await Promise.resolve(traCuuSoDauBaiTuanGop(true));
  }catch(e){showToastV9(e?.message||String(e),'danger');}
}

function matrixCellV698(code,lop,week){
  const cfg={DU_LIEU_DA_THAY_DOI:['stale','↻','Dữ liệu thay đổi — cần duyệt lại'],DA_DUYET:['approved','✓','Đã duyệt'],SAN_SANG_DUYET:['ready','●','GVCN đã chốt — mở sổ để kiểm tra'],CHO_GVCN_CHOT:['pending','!','Chưa GVCN chốt'],CHUA_CO_DU_LIEU:['empty','—','Chưa có dữ liệu']}[code]||['empty','—',code];
  return `<button type="button" class="bgh-matrix-cell-v698 ${cfg[0]}" title="${bghEscV698(cfg[2])}" onclick="openBghBookV698(decodeURIComponent('${encodeURIComponent(lop)}'),${week})">${cfg[1]}</button>`;
}
function renderBghMatrixV698(res){
  bghMatrixCacheV698=res;fillBghWeekSelectV698('bghMatrixFromWeekV698',res.fromWeek);fillBghWeekSelectV698('bghMatrixToWeekV698',res.toWeek);
  const head=document.getElementById('bghMatrixHeadV698'),body=document.getElementById('bghMatrixBodyV698'),weeks=res.weeks||[],rows=[...(res.data||[])].sort(compareBghClassOrderV70441);
  if(head)head.innerHTML=`<tr><th class="sticky-col-v698">Lớp</th><th>Khối</th>${weeks.map(w=>`<th class="text-center">T${w}</th>`).join('')}</tr>`;
  if(body)body.innerHTML=rows.length?rows.map(r=>`<tr><td class="fw-bold sticky-col-v698">${bghEscV698(r.lop)}</td><td>${Number(r.khoi||0)}</td>${weeks.map(w=>`<td class="text-center">${matrixCellV698(r.cells?.[w],r.lop,w)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${weeks.length+2}" class="text-center text-muted py-4">Không có lớp phù hợp.</td></tr>`;
  const st=document.getElementById('bghMatrixStatusV698');if(st){const x=res.summary||{};st.textContent=`Năm học ${res.namHoc||''} · Tuần ${res.fromWeek}–${res.toWeek} · ${x.classes||0} lớp · cần duyệt lại ${x.DU_LIEU_DA_THAY_DOI||0}, đã duyệt ${x.DA_DUYET||0}, đã chốt ${x.SAN_SANG_DUYET||0}, chưa chốt ${x.CHO_GVCN_CHOT||0}, chưa dữ liệu ${x.CHUA_CO_DU_LIEU||0}.`;}
}
async function loadBghMatrixV698(_force){
  const session=bghWorkflowSessionV698();if(!session?.sessionToken){showToastV9('Tài khoản không có quyền BGH/Admin.','danger');return;}
  const from=Number(document.getElementById('bghMatrixFromWeekV698')?.value||0),to=Number(document.getElementById('bghMatrixToWeekV698')?.value||0);if(from&&to&&Math.abs(to-from)>11){showToastV9('Ma trận chỉ tải tối đa 12 tuần mỗi lần.','warning');return;}
  const body=document.getElementById('bghMatrixBodyV698');if(body)body.innerHTML='<tr><td colspan="14" class="text-center text-muted py-4"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải ma trận...</td></tr>';
  try{const r=await callSodbEdgeRpcV67('layMaTranDuyetTuanBGHV698',[{tuTuan:from,denTuan:to,khoi:Number(document.getElementById('bghMatrixGradeV698')?.value||0)},{token:session.sessionToken}]);if(!r?.success)throw new Error(r?.message||'Không tải được ma trận.');renderBghMatrixV698(r);}
  catch(e){if(body)body.innerHTML=`<tr><td colspan="14" class="text-center text-danger py-4">${bghEscV698(e?.message||e)}</td></tr>`;showToastV9(e?.message||String(e),'danger');}
}
function initBghWorkflowV698(){
  if(bghWorkflowInitV698)return;bghWorkflowInitV698=true;
  const current=bghCurrentWeekV698(),review=Math.max(1,current-1);fillBghWeekSelectV698('bghWorkflowWeekV698',review);fillBghWeekSelectV698('bghMatrixToWeekV698',review);fillBghWeekSelectV698('bghMatrixFromWeekV698',Math.max(1,review-5));
  const tab=document.getElementById('bgh-workflow-tab-v698');if(tab)tab.addEventListener('shown.bs.tab',()=>loadBghWorkflowV698(true));
  const matrix=document.getElementById('bgh-matrix-tab-v698');if(matrix)matrix.addEventListener('shown.bs.tab',()=>loadBghMatrixV698(true));
  const search=document.getElementById('bghWorkflowSearchV698');if(search)search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadBghWorkflowV698(true);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initBghWorkflowV698);else initBghWorkflowV698();

// V70.4.4: only selected, personally reviewed books; no select-all action.
let bghOpenedReviewV7044=null,bghSelectedV7044=new Map(),bghBatchBusyV7044=false,bghLoadSeqV7044=0;
function renderReviewV7044(review){
 bghOpenedReviewV7044=review;
 const bar=document.getElementById('bghReviewBarV7044'),approve=document.getElementById('bghApproveBtnV684');
 if(!bar)return;bar.hidden=!review||!bghCanApproveV698();if(bar.hidden){if(approve&&document.getElementById('viewBookMode')?.value==='LOP_CHINH')approve.disabled=true;return;}
 bar.replaceChildren();const text=document.createElement('span');
 text.textContent=review.eligible?'✓ BGH đã kiểm tra phiên bản sổ này. Có thể duyệt hoặc quay lại chọn duyệt nhiều sổ.':review.reason||'Hãy kiểm tra nội dung sổ rồi xác nhận đã kiểm tra.';bar.append(text);
 if(review.ready&&!review.reviewed&&review.receipt){const b=document.createElement('button');b.type='button';b.className='btn btn-primary btn-sm ms-2';b.textContent='Xác nhận đã kiểm tra';b.onclick=()=>markReviewV7044(b,review);bar.append(b);}
 if(approve)approve.disabled=!review.eligible;
}
async function markReviewV7044(btn,opened){
 btn.disabled=true;try{
  const res=await callSodbEdgeRpcV67('danhDauKiemTraBGHV7044',[{receipt:opened.receipt},{token:bghWorkflowSessionV698().sessionToken}]);
  if(!res?.success)throw new Error(res?.message||'Không lưu được xác nhận.');
  if(bghOpenedReviewV7044===opened)renderReviewV7044({...opened,...res.review});
  invalidateBghWorkflowCacheV701();showToastV9(res.message,'success');
 }catch(e){if(bghOpenedReviewV7044===opened)renderReviewV7044({...opened,ready:false,eligible:false,reason:e.message});showToastV9(e.message,'danger');}
}
function updateBatchButtonV7044(){const b=document.getElementById('bghBatchApproveV7044');if(b){b.disabled=bghBatchBusyV7044||!bghCanApproveV698()||!bghSelectedV7044.size;b.textContent=bghBatchBusyV7044?'Đang duyệt từng sổ…':`Duyệt các sổ đã kiểm tra (${bghSelectedV7044.size})`;}}
function selectReviewedV7044(index,box){
 const r=bghWorkflowCacheV698?.data?.[index];if(bghBatchBusyV7044||!r?.review?.eligible){box.checked=false;return;}
 const key=`${r.lop}|${r.tuan}`;
 if(box.checked){if(bghSelectedV7044.size>=20){box.checked=false;showToastV9('Tối đa 20 sổ/lần.','warning');return;}bghSelectedV7044.set(key,{lop:r.lop,tuan:r.tuan,revision:r.review.revision,requestId:crypto.randomUUID()});}else bghSelectedV7044.delete(key);
 updateBatchButtonV7044();
}
async function approveReviewedBooksV7044(){
 if(bghBatchBusyV7044||!bghCanApproveV698()||!bghSelectedV7044.size)return;
 const books=[...bghSelectedV7044.values()],year=bghWorkflowCacheV698.namHoc,auth={token:bghWorkflowSessionV698().sessionToken};
 bghBatchBusyV7044=true;updateBatchButtonV7044();
 try{
 const ok=await confirmV13(`Duyệt ${books.length} sổ đã kiểm tra: ${books.map(b=>b.lop+' (T'+b.tuan+')').join(', ')}? Mỗi sổ có mã duyệt, chữ ký và nhật ký riêng.`,{title:'Duyệt các sổ đã kiểm tra',confirmText:'Duyệt các sổ đã chọn',danger:false});if(!ok)return;
 const res=await callSodbEdgeRpcV67('duyetCacSoDaKiemTraV7044',[{year,books},auth],180000);if(!res?.success)throw new Error(res?.message||'Không nhận được kết quả duyệt.');
 const out=document.getElementById('bghBatchResultsV7044');out.replaceChildren();
 for(const r of res.results||[]){const line=document.createElement('p');line.className=r.success?'text-success small':'text-danger small';line.textContent=`${r.lop} · Tuần ${r.tuan}: ${r.success?'Đã duyệt':'Chưa duyệt'} — ${r.message||''}`;out.append(line);}
 bghSelectedV7044.clear();invalidateBghWorkflowCacheV701();await loadBghWorkflowV698(true);
 }catch(e){showToastV9(e.message+' Có thể thử lại các sổ đang chọn; mã yêu cầu được giữ để tránh duyệt trùng.','danger');}
 finally{bghBatchBusyV7044=false;updateBatchButtonV7044();}
}

async function uploadBghSignatureV7044(btn){
 if(!bghCanApproveV698()){showToastV9('Chỉ BGH được lưu chữ ký tại đây.','warning');return;}
 const file=document.getElementById('bghSignatureFileV7044').files[0];if(!file||!['image/png','image/jpeg'].includes(file.type)||file.size>2*1024*1024){showToastV9('Chọn ảnh PNG/JPG không quá 2 MB.','warning');return;}
 btn.disabled=true;try{const data=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(file);});const r=await callSodbEdgeRpcV67('luuChuKyGiaoVienV21',[data,{token:bghWorkflowSessionV698().sessionToken}]);if(!r?.success)throw new Error(r?.message||'Không lưu được chữ ký.');showToastV9('Đã lưu chữ ký cá nhân BGH.','success');}catch(e){showToastV9(e.message,'danger');}finally{btn.disabled=false;}
}

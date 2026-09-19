/* V70.4.6.8: "Tiết của tôi" - tách riêng khỏi Xem sổ đầu bài. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => (typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  let loadedWeek = 0;
  let rows = [];
  let rowById = new Map();
  let loading = false;

  function currentWeek(){
    try{
      const p=String(START_DATE_WEEK1_STR||'2026-08-17').split('-').map(Number);
      const start=new Date(p[0],p[1]-1,p[2],12), now=new Date();
      return Math.max(1,Math.min(53,Math.floor((now-start)/604800000)+1));
    }catch(_e){return 1;}
  }
  function viDate(v){
    const s=String(v||''); if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return s||'—';
    const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`;
  }
  function statusLabel(r){
    const st=String(r.trangThaiTiet||'HOC_BINH_THUONG').toUpperCase();
    if(r.mixed)return '<span class="badge text-bg-info">TRỘN</span>';
    if(r.dayThay)return '<span class="badge text-bg-warning">DẠY THAY</span>';
    if(st==='DAY_BU')return '<span class="badge text-bg-success">DẠY BÙ</span>';
    if(st==='HOAN_DOI')return '<span class="badge text-bg-primary">ĐỔI TIẾT</span>';
    return '<span class="badge text-bg-light border text-dark">Đã dạy</span>';
  }
  function filtered(){
    const cls=$('myLessonsClassV70468')?.value||'ALL', sub=$('myLessonsSubjectV70468')?.value||'ALL';
    return rows.filter(r=>(cls==='ALL'||r.lop===cls)&&(sub==='ALL'||r.mon===sub));
  }
  function fillSelect(id,values,label){
    const el=$(id); if(!el)return;
    const keep=el.value||'ALL';
    el.innerHTML=`<option value="ALL">${label}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if([...el.options].some(o=>o.value===keep))el.value=keep;
  }
  function renderMetrics(list){
    const classes=new Set(list.map(x=>x.lop).filter(Boolean));
    const subjects=new Set(list.map(x=>x.mon).filter(Boolean));
    const substitute=list.filter(x=>x.dayThay).length;
    const signed=list.filter(x=>x.signed).length;
    const data=[[list.length,'Tiết đã dạy'],[classes.size,'Lớp đã dạy'],[subjects.size,'Môn'],[signed,'Tiết đã ký']];
    $('myLessonsMetricsV70468').innerHTML=data.map(([v,l],i)=>`<div class="my-lessons-metric-v70468"><strong>${v}</strong><span>${l}</span>${i===0&&substitute?`<small>${substitute} tiết dạy thay</small>`:''}</div>`).join('');
  }
  function render(){
    const list=filtered(), body=$('myLessonsBodyV70468'); if(!body)return;
    renderMetrics(list);
    if(!list.length){body.innerHTML='<tr><td colspan="9" class="text-center text-muted py-4">Không có tiết phù hợp trong tuần/bộ lọc đang chọn.</td></tr>';return;}
    body.innerHTML=list.map(r=>`<tr>
      <td><strong>${esc(r.thu||'')}</strong><div class="small text-muted">${esc(viDate(r.ngay))}</div></td>
      <td>${esc(r.buoi||'')} · <strong>Tiết ${Number(r.tiet||0)}</strong></td>
      <td><strong>${esc(r.lop||'')}</strong></td>
      <td>${esc(r.mon||'')}</td>
      <td>${esc(r.tietCT||'—')}</td>
      <td><div class="my-lessons-title-v70468">${esc(r.tenBai||'—')}</div>${r.soHsVang?`<small class="text-danger">Vắng: ${Number(r.soHsVang)}</small>`:''}</td>
      <td>${statusLabel(r)}</td>
      <td>${r.signed?'<span class="badge text-bg-success">Đã ký</span>':'<span class="badge text-bg-danger">Chưa ký</span>'}</td>
      <td class="text-end"><button type="button" class="btn btn-sm btn-outline-primary" data-my-lesson-open="${esc(r.recordId)}">Mở Nhập tiết</button></td>
    </tr>`).join('');
  }
  async function load(force=false){
    const token=typeof gvbmDangNhapInfo!=='undefined'&&gvbmDangNhapInfo?.sessionToken;
    if(!token){$('myLessonsStatusV70468').textContent='Tài khoản hiện tại không có phiên Giáo viên bộ môn.';return;}
    const week=Math.max(1,Math.min(53,Number($('myLessonsWeekV70468')?.value||currentWeek())));
    if(!force && loading)return;
    loading=true; $('myLessonsWeekV70468').value=String(week);
    $('myLessonsStatusV70468').textContent='Đang tải các tiết do chính bạn đã dạy trong tuần...';
    $('myLessonsBodyV70468').innerHTML='<tr><td colspan="9" class="text-center text-muted py-4"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải...</td></tr>';
    try{
      const res=await callSodbEdgeRpcV67('layTietCuaToiTheoTuanV70468',[week,{token}],20000);
      if(!res?.success)throw new Error(res?.message||'Không tải được Tiết của tôi.');
      loadedWeek=week; rows=Array.isArray(res.data)?res.data:[]; rowById=new Map(rows.map(r=>[String(r.recordId||''),r]));
      fillSelect('myLessonsClassV70468',Array.isArray(res.classes)?res.classes:[], 'Tất cả lớp');
      fillSelect('myLessonsSubjectV70468',Array.isArray(res.subjects)?res.subjects:[], 'Tất cả môn');
      $('myLessonsRangeV70468').textContent=`Tuần ${week} · ${viDate(res.from)} – ${viDate(res.to)} · ${rows.length} tiết thực dạy`;
      $('myLessonsUpdatedV70468').textContent='Cập nhật '+new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(new Date());
      $('myLessonsStatusV70468').textContent=rows.length?'Chỉ hiển thị các tiết thuộc chính giáo viên đang đăng nhập; không gồm tiết ký thay cho nhân sự ngoài trường.':'Tuần này chưa có tiết nào của bạn trong Sổ đầu bài.';
      render();
    }catch(e){
      rows=[];rowById.clear();renderMetrics([]);
      $('myLessonsBodyV70468').innerHTML=`<tr><td colspan="9" class="text-center text-danger py-4">${esc(e?.message||e)}</td></tr>`;
      $('myLessonsStatusV70468').textContent='Không tải được dữ liệu. Vui lòng thử lại.';
    }finally{loading=false;}
  }
  function switchWeek(delta){
    const el=$('myLessonsWeekV70468'); if(!el)return;
    const next=delta==='today'?currentWeek():Math.max(1,Math.min(53,Number(el.value||currentWeek())+Number(delta||0)));
    el.value=String(next); load(true);
  }
  function openInput(recordId){
    const r=rowById.get(String(recordId||'')); if(!r)return;
    const tab=$('input-tab'); if(!tab)return;
    try{bootstrap.Tab.getOrCreateInstance(tab).show();}catch(_e){tab.click();}
    const doSet=()=>{
      const grade=Number(r.khoi||String(r.lop||'').match(/^(10|11|12)/)?.[1]||10),khoi=$('khoi'),lop=$('lop');
      if(khoi){khoi.value=String(grade);try{chonKhoiLopInput();}catch(_e){}}
      setTimeout(()=>{
        if(lop){const opt=[...lop.options].find(o=>String(o.value).trim()===String(r.lop||'').trim());if(opt)lop.value=opt.value;try{onInputClassChangedV26();}catch(_e){}}
        if($('ngayDay'))$('ngayDay').value=String(r.ngay||'');
        if($('buoiDay'))$('buoiDay').value=String(r.buoi||'Sáng');
        if($('tietDay'))$('tietDay').value=String(r.tiet||1);
        try{capNhatTuanVaThu();}catch(_e){}
        try{capNhatHanNhapTietV683();}catch(_e){}
        try{if(typeof refreshGroupAttendanceV6951==='function')refreshGroupAttendanceV6951();}catch(_e){}
        try{loadDanhSachBaiDay();}catch(_e){}
        $('sodbForm')?.scrollIntoView({behavior:'smooth',block:'start'});
        if(typeof showToastV9==='function')showToastV9(`Đã mở vị trí ${r.lop} · ${viDate(r.ngay)} · ${r.buoi} · Tiết ${r.tiet}. Bản ghi đã tồn tại; quyền sửa vẫn do hệ thống kiểm soát.`,'info');
      },100);
    };
    setTimeout(doSet,60);
  }
  function init(){
    const tab=$('my-lessons-tab-v70468'); if(!tab)return;
    $('myLessonsWeekV70468').value=String(currentWeek());
    tab.addEventListener('shown.bs.tab',()=>{const w=Number($('myLessonsWeekV70468').value||currentWeek());if(w!==loadedWeek||!rows.length)load(true);});
    $('myLessonsRefreshV70468')?.addEventListener('click',()=>load(true));
    $('myLessonsWeekV70468')?.addEventListener('change',()=>load(true));
    $('myLessonsClassV70468')?.addEventListener('change',render);
    $('myLessonsSubjectV70468')?.addEventListener('change',render);
    $('myLessonsPrevV70468')?.addEventListener('click',()=>switchWeek(-1));
    $('myLessonsCurrentV70468')?.addEventListener('click',()=>switchWeek('today'));
    $('myLessonsNextV70468')?.addEventListener('click',()=>switchWeek(1));
    $('myLessonsBodyV70468')?.addEventListener('click',e=>{const b=e.target.closest('[data-my-lesson-open]');if(b)openInput(b.dataset.myLessonOpen);});
  }
  window.taiTietCuaToiV70468=load;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

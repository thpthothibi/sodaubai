/* V70.4.6.11: "Tiết của tôi" - ma trận tuần giống Xem sổ đầu bài. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => (typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  let loadedWeek = 0;
  let rows = [];
  let rowById = new Map();
  let loading = false;
  let loadedFrom = '';
  let loadedTo = '';
  let requestSerialV50=0;
  let pendingV50=null;
  let loadedTokenV50='';
  let postSaveReadyUntilV50=0;
  const dayNames=['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'];

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
  function parseIso(v){
    const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12):null;
  }
  function isoDate(d){return d?[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'):'';}
  function weekStart(week){
    const p=String(START_DATE_WEEK1_STR||'2026-08-17').split('-').map(Number),d=new Date(p[0],p[1]-1,p[2],12);d.setDate(d.getDate()+(Number(week||1)-1)*7);return d;
  }
  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
  function statusLabel(r){
    const st=String(r.trangThaiTiet||'HOC_BINH_THUONG').toUpperCase();
    if(r.mixed)return '<span class="badge sodb-status-badge sodb-status-badge-mixed">TRỘN</span>';
    if(r.dayThay)return '<span class="badge sodb-status-badge sodb-status-badge-substitute">DẠY THAY</span>';
    if(st==='DAY_BU')return '<span class="badge sodb-status-badge sodb-status-badge-makeup">DẠY BÙ</span>';
    if(st==='HOAN_DOI')return '<span class="badge sodb-status-badge sodb-status-badge-swap">ĐỔI TIẾT</span>';
    return '';
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
    const mount=$('myLessonsMetricsV70468');if(!mount)return;
    mount.innerHTML=data.map(([v,l],i)=>`<div class="my-lessons-metric-v70468"><strong>${v}</strong><span>${l}</span>${i===0&&substitute?`<small>${substitute} tiết dạy thay</small>`:''}</div>`).join('');
  }
  function sessionKey(v){
    const s=String(v||'').toLowerCase();
    if(s.includes('chiều')||s.includes('chieu'))return 'CHIEU';
    if(s.includes('bù')||s.includes('bu'))return 'DAY_BU';
    return 'SANG';
  }
  function groupBySlot(list){
    const map=new Map();
    list.forEach(r=>{const key=`${String(r.ngay||'')}|${sessionKey(r.buoi)}|${Number(r.tiet||0)}`;if(!map.has(key))map.set(key,[]);map.get(key).push(r);});
    return map;
  }
  function lessonCard(r){
    const title=[r.lop,r.mon].filter(Boolean).join(' · ')||'Tiết đã dạy';
    const meta=[];if(r.tietCT)meta.push(`Tiết CT ${r.tietCT}`);if(r.tenBai)meta.push(r.tenBai);
    const absent=Number(r.soHsVang||0)>0?`<span class="my-lesson-absence-v704611">Vắng ${Number(r.soHsVang)}</span>`:'';
    return `<article class="workspace-lesson my-lesson-card-v704611" data-my-lesson-open="${esc(r.recordId)}" tabindex="0" role="button" aria-label="Mở nhập tiết ${esc(title)}">
      <button type="button" class="workspace-lesson-more" data-my-lesson-open="${esc(r.recordId)}" aria-label="Mở Nhập tiết" title="Mở Nhập tiết">⋯</button>
      <div class="workspace-lesson-entry"><strong>${esc(title)}</strong>${meta.length?`<span>${esc(meta.join(' · '))}</span>`:''}</div>
      <div class="workspace-lesson-badges">${statusLabel(r)}${r.signed?'<span class="badge text-bg-success">Đã ký</span>':'<span class="badge text-bg-danger">Chưa ký</span>'}${absent}</div>
    </article>`;
  }
  function renderSession(label,key,days,slotMap,list){
    const hasRows=list.some(r=>sessionKey(r.buoi)===key);
    if(key==='DAY_BU'&&!hasRows)return '';
    const icon=key==='SANG'?'☀':'☾';
    const header=days.map((d,i)=>`<th scope="col">${dayNames[i]}<small>${viDate(isoDate(d))}</small></th>`).join('');
    const trs=Array.from({length:5},(_,idx)=>{
      const period=idx+1;
      const cells=days.map(d=>{
        const date=isoDate(d),slot=slotMap.get(`${date}|${key}|${period}`)||[];
        if(!slot.length)return '<td class="workspace-empty"><span aria-label="Không có tiết">—</span></td>';
        return `<td><div class="my-lesson-slot-v704611">${slot.map(lessonCard).join('')}</div></td>`;
      }).join('');
      return `<tr><th scope="row"><strong>Tiết ${period}</strong></th>${cells}</tr>`;
    }).join('');
    return `<section class="workspace-session my-lessons-session-v704611"><h3><span class="my-lessons-session-icon-v704611" aria-hidden="true">${icon}</span> ${label} <small>Tiết 1 – 5</small></h3><div class="workspace-grid-scroll" tabindex="0" role="region" aria-label="${esc(label)}"><table class="workspace-grid my-lessons-week-table-v704611"><caption class="visually-hidden">Tiết của tôi · Tuần ${Number($('myLessonsWeekV70468')?.value||1)} · ${esc(label)}</caption><thead><tr><th scope="col">Tiết</th>${header}</tr></thead><tbody>${trs}</tbody></table></div></section>`;
  }
  function render(){
    const list=filtered(), mount=$('myLessonsGridV70468'); if(!mount)return;
    renderMetrics(list);
    const week=Number($('myLessonsWeekV70468')?.value||loadedWeek||currentWeek()),start=parseIso(loadedFrom)||weekStart(week);
    const allDays=Array.from({length:7},(_,i)=>addDays(start,i));
    const sundayIso=isoDate(allDays[6]),showSunday=list.some(r=>String(r.ngay||'')===sundayIso);
    const days=allDays.slice(0,showSunday?7:6),slotMap=groupBySlot(list);
    if(!list.length){
      mount.innerHTML=`${renderSession('Buổi sáng','SANG',days,slotMap,list)}${renderSession('Buổi chiều','CHIEU',days,slotMap,list)}`;
      return;
    }
    mount.innerHTML=[renderSession('Buổi sáng','SANG',days,slotMap,list),renderSession('Buổi chiều','CHIEU',days,slotMap,list),renderSession('Dạy bù','DAY_BU',days,slotMap,list)].join('');
  }
  function load(force=false,afterSave=false){
    const token=typeof gvbmDangNhapInfo!=='undefined'&&gvbmDangNhapInfo?.sessionToken;
    if(!token){
      ++requestSerialV50;pendingV50=null;loading=false;loadedWeek=0;loadedTokenV50='';rows=[];rowById.clear();renderMetrics([]);
      $('myLessonsGridV70468').innerHTML='';
      $('myLessonsStatusV70468').textContent='Tài khoản hiện tại không có phiên Giáo viên bộ môn.';return Promise.resolve();
    }
    const week=Math.max(1,Math.min(53,Number($('myLessonsWeekV70468')?.value||currentWeek())));
    if(pendingV50?.token===token&&pendingV50.week===week&&pendingV50.serial===requestSerialV50)return pendingV50.promise;
    const serial=++requestSerialV50;
    const isCurrent=()=>serial===requestSerialV50&&gvbmDangNhapInfo?.sessionToken===token&&Number($('myLessonsWeekV70468')?.value)===week;
    if(loadedTokenV50!==token){rows=[];rowById.clear();loadedWeek=0;renderMetrics([]);}
    loading=true; $('myLessonsWeekV70468').value=String(week);
    $('myLessonsStatusV70468').textContent='Đang tải ma trận các tiết do chính bạn đã dạy trong tuần...';
    $('myLessonsGridV70468').innerHTML='<div class="text-center text-muted py-5"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải...</div>';
    const promise=(async()=>{
    try{
      const res=await callSodbEdgeRpcV67('layTietCuaToiTheoTuanV70468',[week,{token}],20000);
      if(!isCurrent())return;
      if(!res?.success)throw new Error(res?.message||'Không tải được Tiết của tôi.');
      loadedTokenV50=token;
      postSaveReadyUntilV50=afterSave?Date.now()+3000:0;
      loadedWeek=week; loadedFrom=String(res.from||''); loadedTo=String(res.to||'');
      rows=Array.isArray(res.data)?res.data:[]; rowById=new Map(rows.map(r=>[String(r.recordId||''),r]));
      fillSelect('myLessonsClassV70468',Array.isArray(res.classes)?res.classes:[], 'Tất cả lớp');
      fillSelect('myLessonsSubjectV70468',Array.isArray(res.subjects)?res.subjects:[], 'Tất cả môn');
      $('myLessonsRangeV70468').textContent=`Tuần ${week} · ${viDate(res.from)} – ${viDate(res.to)} · ${rows.length} tiết thực dạy`;
      $('myLessonsUpdatedV70468').textContent='Cập nhật '+new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(new Date());
      $('myLessonsStatusV70468').textContent=rows.length?'Ma trận chỉ hiển thị các tiết của chính giáo viên đang đăng nhập. Bấm vào thẻ tiết để mở Nhập tiết.':'Tuần này chưa có tiết nào của bạn trong Sổ đầu bài.';
      render();
    }catch(e){
      if(!isCurrent())return;
      rows=[];rowById.clear();renderMetrics([]);
      $('myLessonsGridV70468').innerHTML=`<div class="text-center text-danger py-5">${esc(e?.message||e)}</div>`;
      $('myLessonsStatusV70468').textContent='Không tải được dữ liệu. Vui lòng thử lại.';
    }finally{if(serial===requestSerialV50){loading=false;pendingV50=null;}}
    })();
    pendingV50={token,week,serial,promise};
    return promise;
  }
  function afterSaveV50(event){
    ++requestSerialV50;pendingV50=null;loadedWeek=0;postSaveReadyUntilV50=0;
    const detail=event.detail||{};
    if(detail.week)$('myLessonsWeekV70468').value=String(detail.week);
    // A previous class/subject filter must not hide the newly saved lesson.
    for(const [id,value] of [['myLessonsClassV70468',detail.lop],['myLessonsSubjectV70468',detail.mon]]){
      const el=$(id);if(el&&el.value!=='ALL'&&el.value!==value)el.value='ALL';
    }
    load(true,true);
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
    tab.addEventListener('shown.bs.tab',()=>{
      const sameContext=loadedWeek===Number($('myLessonsWeekV70468').value)&&loadedTokenV50===gvbmDangNhapInfo?.sessionToken;
      if(sameContext&&postSaveReadyUntilV50>Date.now()){postSaveReadyUntilV50=0;render();return;}
      load(true);
    });
    window.addEventListener('sodb:lesson-saved',afterSaveV50);
    $('myLessonsRefreshV70468')?.addEventListener('click',()=>load(true));
    $('myLessonsWeekV70468')?.addEventListener('change',()=>load(true));
    $('myLessonsClassV70468')?.addEventListener('change',render);
    $('myLessonsSubjectV70468')?.addEventListener('change',render);
    $('myLessonsPrevV70468')?.addEventListener('click',()=>switchWeek(-1));
    $('myLessonsCurrentV70468')?.addEventListener('click',()=>switchWeek('today'));
    $('myLessonsNextV70468')?.addEventListener('click',()=>switchWeek(1));
    $('myLessonsGridV70468')?.addEventListener('click',e=>{const b=e.target.closest('[data-my-lesson-open]');if(b)openInput(b.dataset.myLessonOpen);});
    $('myLessonsGridV70468')?.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-my-lesson-open]')){e.preventDefault();openInput(e.target.dataset.myLessonOpen);}});
  }
  window.taiTietCuaToiV70468=load;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

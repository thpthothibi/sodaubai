/* V70.4.6.49.6.3.21: giữ lớp đang chọn; bỏ race mở tiết và response tuần cũ. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => (typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  let loadedWeek = 0;
  let rows = [];
  let rowById = new Map();
  let loading = false;
  let loadSerial = 0;
  let loadedFrom = '';
  let loadedTo = '';
  const dayNames=['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'];
  function teacherSessionToken(){return typeof gvbmDangNhapInfo!=='undefined'&&gvbmDangNhapInfo?.sessionToken?gvbmDangNhapInfo.sessionToken:'';}
  function bghSessionToken(){return (typeof currentUnifiedLoginV4!=='undefined'&&currentUnifiedLoginV4?.sessions?.BGH?.sessionToken)||'';}
  function myLessonsToken(){return teacherSessionToken()||bghSessionToken();}
  function canWriteLessons(){return !!teacherSessionToken();}

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
    const actual=list.filter(x=>!x.isTimetable), pending=list.filter(x=>x.isTimetable);
    const classes=new Set(list.map(x=>x.lop).filter(Boolean));
    const subjects=new Set(list.map(x=>x.mon).filter(Boolean));
    const substitute=actual.filter(x=>x.dayThay).length;
    const signed=actual.filter(x=>x.signed).length;
    const data=[[actual.length,'Đã ghi'],[pending.length,'Chưa ghi'],[classes.size,'Lớp'],[signed,'Đã ký']];
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
    const pending=!!r.isTimetable;
    const title=[r.lop,r.mon].filter(Boolean).join(' · ')||(pending?'Tiết theo TKB':'Tiết đã ghi');
    const meta=[];if(!pending&&r.tietCT)meta.push(`Tiết CT ${r.tietCT}`);if(!pending&&r.tenBai)meta.push(r.tenBai);
    const absent=!pending&&Number(r.soHsVang||0)>0?`<span class="my-lesson-absence-v704611">Vắng ${Number(r.soHsVang)}</span>`:'';
    const linkedGroupBadge=pending&&r.linkedSeparateBook
      ? `<span class="badge text-bg-info">${esc((Array.isArray(r.linkedGroups)&&r.linkedGroups.length)?('Sổ '+r.linkedGroups.join(' / ')):'Sổ GDTC/CĐ riêng')}</span>`
      : '';
    const badges=pending
      ? `<span class="badge text-bg-warning">Chưa ghi</span>${linkedGroupBadge}`
      : `<span class="badge text-bg-light">${esc(r.hinhThucDay||(typeof teachingModeFromDateV704649==='function'?teachingModeFromDateV704649(r.ngay||r.ngayDay||r.ngay_day):''))}</span>${statusLabel(r)}${r.signed?'<span class="badge text-bg-success">Đã ký</span>':'<span class="badge text-bg-danger">Chưa ký</span>'}${absent}`;
    return `<article class="workspace-lesson my-lesson-card-v704611${pending?' my-lesson-tkb-pending-v704650':''}" data-my-lesson-open="${esc(r.recordId)}" tabindex="0" role="button" aria-label="${pending?'Nhập':'Mở'} tiết ${esc(title)}">
      <button type="button" class="workspace-lesson-more" data-my-lesson-open="${esc(r.recordId)}" aria-label="Mở Nhập tiết" title="Mở Nhập tiết">⋯</button>
      <div class="workspace-lesson-entry"><strong>${esc(title)}</strong>${meta.length?`<span>${esc(meta.join(' · '))}</span>`:''}</div>
      <div class="workspace-lesson-badges">${badges}</div>
    </article>`;
  }
  function renderSession(label,key,days,slotMap,list){
    const hasRows=list.some(r=>sessionKey(r.buoi)===key);
    if(key==='DAY_BU'&&!hasRows)return '';
    const icon=key==='SANG'?'☀':'☾';
    const header=days.map((d,i)=>`<th scope="col">${dayNames[i]}<small>${viDate(isoDate(d))}</small></th>`).join('');
    const trs=Array.from({length:4},(_,idx)=>{
      const period=idx+1;
      const cells=days.map(d=>{
        const date=isoDate(d),slot=slotMap.get(`${date}|${key}|${period}`)||[];
        if(!slot.length)return `<td class="workspace-empty workspace-input-cell" data-my-empty-date="${esc(date)}" data-my-empty-session="${esc(key)}" data-my-empty-period="${period}" tabindex="0" role="button" title="Nhập tiết ${period}" aria-label="Nhập tiết ${period}, ${esc(viDate(date))}, ${esc(label)}"><span>+ Nhập tiết</span></td>`;
        return `<td ${slot.length===1?`data-my-lesson-open="${esc(slot[0].recordId)}"`:""}><div class="my-lesson-slot-v704611">${slot.map(lessonCard).join('')}</div></td>`;
      }).join('');
      return `<tr><th scope="row"><strong>Tiết ${period}</strong></th>${cells}</tr>`;
    }).join('');
    return `<section class="workspace-session my-lessons-session-v704611"><h3><span class="my-lessons-session-icon-v704611" aria-hidden="true">${icon}</span> ${label} <small>Tiết 1 – 4</small></h3><div class="workspace-grid-scroll" tabindex="0" role="region" aria-label="${esc(label)}"><table class="workspace-grid my-lessons-week-table-v704611"><caption class="visually-hidden">Tiết của tôi · Tuần ${Number($('myLessonsWeekV70468')?.value||1)} · ${esc(label)}</caption><thead><tr><th scope="col">Tiết</th>${header}</tr></thead><tbody>${trs}</tbody></table></div></section>`;
  }
  function render(){
    if(loading)return;
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
  async function load(force=false){
    const token=myLessonsToken();
    if(!token){$('myLessonsStatusV70468').textContent='Tài khoản hiện tại không có phiên Giáo viên/BGH phù hợp.';return;}
    const week=Math.max(1,Math.min(53,Number($('myLessonsWeekV70468')?.value||currentWeek())));
    if(!force && loading)return;
    const request=++loadSerial;
    const isCurrent=()=>request===loadSerial&&token===myLessonsToken()&&week===Number($('myLessonsWeekV70468')?.value);
    loading=true; rows=[];rowById.clear();
    $('myLessonsWeekV70468').value=String(week);
    $('myLessonsStatusV70468').textContent='Đang tải các tiết đã ghi và các tiết còn chờ theo TKB...';
    $('myLessonsGridV70468').innerHTML='<div class="text-center text-muted py-5"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải...</div>';
    try{
      const res=await callSodbEdgeRpcV67('layTietCuaToiTheoTuanV70468',[week,{token}],20000);
      if(!isCurrent())return;
      if(!res?.success)throw new Error(res?.message||'Không tải được Tiết của tôi.');
      loadedWeek=week; loadedFrom=String(res.from||''); loadedTo=String(res.to||'');
      rows=Array.isArray(res.data)?res.data:[]; rowById=new Map(rows.map(r=>[String(r.recordId||''),r]));
      fillSelect('myLessonsClassV70468',Array.isArray(res.classes)?res.classes:[], 'Tất cả lớp');
      fillSelect('myLessonsSubjectV70468',Array.isArray(res.subjects)?res.subjects:[], 'Tất cả môn');
      const actualCount=rows.filter(r=>!r.isTimetable).length,pendingCount=rows.filter(r=>r.isTimetable).length;
      $('myLessonsRangeV70468').textContent=`Tuần ${week} · ${viDate(res.from)} – ${viDate(res.to)} · ${actualCount} đã ghi${pendingCount?` · ${pendingCount} chưa ghi`:''}`;
      $('myLessonsUpdatedV70468').textContent='Cập nhật '+new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(new Date());
      const writeHint=canWriteLessons()?'Bấm ô “Chưa ghi” để mở Nhập tiết theo TKB; ô đã ghi mở lại dữ liệu Sổ đầu bài. Ô trống vẫn cho nhập thủ công.':'BGH đang xem lịch cá nhân ở chế độ chỉ xem; để nhập/sửa tiết cần có quyền GVBM.';
      $('myLessonsStatusV70468').textContent=rows.length?writeHint:'Tuần này chưa có tiết đã ghi hoặc TKB chính khóa của bạn.';
      loading=false;render();
    }catch(e){
      if(!isCurrent())return;
      rows=[];rowById.clear();renderMetrics([]);
      $('myLessonsGridV70468').innerHTML=`<div class="text-center text-danger py-5">${esc(e?.message||e)}</div>`;
      $('myLessonsStatusV70468').textContent='Không tải được dữ liệu. Vui lòng thử lại.';
    }finally{if(request===loadSerial)loading=false;}
  }
  function switchWeek(delta){
    const el=$('myLessonsWeekV70468'); if(!el)return;
    const next=delta==='today'?currentWeek():Math.max(1,Math.min(53,Number(el.value||currentWeek())+Number(delta||0)));
    el.value=String(next); load(true);
  }
  function openInput(recordId){
    if(loading)return;
    const r=typeof recordId==='object'?recordId:rowById.get(String(recordId||'')); if(!r)return;
    if(typeof isSodbSubmitting!=='undefined'&&isSodbSubmitting){
      if(typeof showToastV9==='function')showToastV9('Đang lưu tiết. Vui lòng chờ lưu xong trước khi chuyển lớp.','warning');
      return;
    }
    try{if(typeof invalidateInputDeadlineCheckV70465320==='function')invalidateInputDeadlineCheckV70465320();}catch(_e){}
    if(!canWriteLessons()){if(typeof showToastV9==='function')showToastV9('BGH đang xem “Tiết của tôi”. Tài khoản cần có thêm quyền GVBM mới được nhập/sửa tiết.','info');return;}
    if(r.linkedSeparateBook&&r.writeBlockedBySeparateBook&&!r.targetLop){
      const groups=Array.isArray(r.linkedGroups)?r.linkedGroups.filter(Boolean):[];
      if(typeof showToastV9==='function')showToastV9(groups.length?`Tiết ${r.lop} thuộc sổ riêng ${groups.join(' / ')}. Hãy mở đúng thẻ sổ nhóm để ghi tiết.`:'Tiết này thuộc sổ GDTC/Chuyên đề riêng nhưng chưa xác định được một sổ nhóm duy nhất. Không ghi trực tiếp vào lớp chính.','warning');
      return;
    }
    const writeLop=String(r.targetLop||r.lop||'').trim(),writeMon=String(r.targetMon||r.mon||'').trim();
    if(typeof editingRecordIdV4!=='undefined'&&editingRecordIdV4){if(!confirm('Đang chỉnh sửa một tiết. Chuyển sang vị trí vừa chọn?'))return;huyCheDoSuaV4();}
    const tab=$('input-tab'); if(!tab)return;
    if(typeof clearInputTeachingOperationV7042==='function')clearInputTeachingOperationV7042();
    if(writeMon){
      const mon=$('monHoc'),target=typeof canonicalSubjectV6955==='function'?canonicalSubjectV6955(writeMon):writeMon;
      if(mon){
        if(typeof isGdtcDetailSubjectV25==='function'&&isGdtcDetailSubjectV25(target)&&typeof gvbmHasGdtcV25==='function'&&gvbmHasGdtcV25()){
          let baseOpt=[...mon.options].find(o=>typeof isGdtcBaseSubjectV25==='function'&&isGdtcBaseSubjectV25(o.value));
          if(!baseOpt){baseOpt=new Option('GDTC','GDTC');baseOpt.dataset.tkbLinkedGroupV704652='1';mon.add(baseOpt);}
          mon.value=baseOpt.value;try{if(typeof configureGdtcInputV25==='function')configureGdtcInputV25();}catch(_e){}
          const detail=$('gdtcTeachingSubjectV25');if(detail)detail.value=target;
        }else{
          let opt=[...mon.options].find(o=>typeof subjectKeyV6955==='function'?subjectKeyV6955(o.value)===subjectKeyV6955(target):String(o.value)===String(target));
          if(opt)mon.value=opt.value;
          else if(typeof ensureTeacherSubjectOptionV26==='function')ensureTeacherSubjectOptionV26(target);
        }
      }
    }
    const grade=Number(r.khoi||String(writeLop||'').match(/^(10|11|12)/)?.[1]||$('khoi')?.value||10),khoi=$('khoi'),lop=$('lop');
    if(khoi){
      if(![...khoi.options].some(o=>o.value===String(grade)))khoi.add(new Option('Khối '+grade,String(grade)));
      khoi.value=String(grade);
    }
    // The class builder is synchronous; set the target immediately, without timers.
    try{chonKhoiLopInput(true);}catch(_e){}
    if(lop){
      let opt=[...lop.options].find(o=>String(o.value).trim()===writeLop);
      if(!opt&&writeLop){opt=new Option(writeLop,writeLop);opt.dataset.tkbLinkedGroupV704652='1';opt.dataset.tkbLinkedGradeV70465321=String(grade);lop.add(opt);}
      lop.value=opt?opt.value:'';
    }
    if($('ngayDay'))$('ngayDay').value=String(r.ngay||'');
    if($('buoiDay'))$('buoiDay').value=String(r.buoi||'Sáng');
    if($('tietDay'))$('tietDay').value=String(r.tiet||1);
    teachingLoadV704649(r);
    try{capNhatTuanVaThu();}catch(_e){}
    try{onInputClassChangedV26();}catch(_e){}
    try{capNhatHanNhapTietV683();}catch(_e){}
    try{if(typeof scheduleTeachingOperationRefreshV70469==='function')scheduleTeachingOperationRefreshV70469(0);}catch(_e){}
    // Tab listeners now see the selected class/date/subject, never the previous slot.
    try{bootstrap.Tab.getOrCreateInstance(tab).show();}catch(_e){tab.click();}
    $('sodbForm')?.scrollIntoView({behavior:'smooth',block:'start'});
    if(typeof showToastV9==='function')showToastV9(`Đã mở ${writeLop||'vị trí trống'} · ${viDate(r.ngay)} · ${r.buoi} · Tiết ${r.tiet}.${r.targetLop&&r.targetLop!==r.lop?` TKB lớp chính ${r.lop} được liên kết sang sổ ${r.targetLop}.`:''} ${r.isTimetable?'Theo TKB và chưa ghi; hãy chọn KHBD rồi lưu.':(r.isEmpty?'Chọn lớp/môn và nhập nội dung trước khi lưu.':'Bản ghi đã tồn tại; quyền sửa vẫn do hệ thống kiểm soát.')}`,'info');
  }

  function openEmpty(cell){
    if(loading)return;const lop=$('myLessonsClassV70468')?.value||'ALL',mon=$('myLessonsSubjectV70468')?.value||'ALL';
    openInput({isEmpty:true,lop:lop==='ALL'?'':lop,mon:mon==='ALL'?'':mon,ngay:cell.dataset.myEmptyDate,buoi:({SANG:'Sáng',CHIEU:'Chiều',DAY_BU:'Dạy bù'})[cell.dataset.myEmptySession]||'Sáng',tiet:Number(cell.dataset.myEmptyPeriod)});
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
    $('myLessonsGridV70468')?.addEventListener('click',e=>{const b=e.target.closest('[data-my-lesson-open]');if(b){openInput(b.dataset.myLessonOpen);return;}const empty=e.target.closest('[data-my-empty-date]');if(empty)openEmpty(empty);});
    $('myLessonsGridV70468')?.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-my-lesson-open], [data-my-empty-date]')){e.preventDefault();if(e.target.matches('[data-my-empty-date]'))openEmpty(e.target);else openInput(e.target.dataset.myLessonOpen);}});
  }
  window.taiTietCuaToiV70468=load;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

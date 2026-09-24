/* V70.4.4: presentation only. Existing sessions, RPCs, forms and A3 renderer remain authoritative. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => escapeHtml(String(value ?? ''));
  const icons = {
    book:'<path d="M4 3h13a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3V3Z"/><path d="M4 17h16M8 7h8M8 11h6"/>',
    home:'<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
    edit:'<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z"/>',
    users:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3"/>',
    chart:'<path d="M3 3v18h18M7 16l4-5 4 2 6-8"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
    settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
    print:'<path d="M6 8V2h12v6M6 18H3V8h18v10h-3M6 14h12v8H6zM17 11h1"/>',
    filter:'<path d="M3 3h18l-7 8v9l-4-2v-7L3 3Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
    moon:'<path d="M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13Z"/>',
    layers:'<path d="m12 2 10 6-10 6L2 8l10-6ZM2 12l10 6 10-6M2 16l10 6 10-6"/>',
    alert:'<path d="m12 2 10 19H2L12 2ZM12 8v6M12 17v1"/>'
  };
  const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
  const tabNames = {
    'dashboard-tab-v9':['Tổng quan','home'], 'view-tab':['Xem sổ đầu bài','book'], 'my-lessons-tab-v70468':['Tiết của tôi','calendar'], 'input-tab':['Nhập tiết học','edit'],
    'gvcn-tab':['Công tác chủ nhiệm','users'], 'giamthi-tab':['Tra cứu & thống kê','chart'], 'ttcm-tab':['Kế hoạch bài dạy','book'],
    'control-tab-v693':['Điều hành','calendar'], 'bgh-workflow-tab-v698':['Duyệt tuần BGH','shield'], 'admin-tab':['Quản trị hệ thống','settings']
  };
  let current = null, loading = false, printing = false, lastDetailTrigger = null;
  const days = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];
  const dayLabels = ['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'];
  const status = c => String(c?.trangThaiTiet || 'HOC_BINH_THUONG').toUpperCase();
  const entries = c => getCellEntries(c).filter(e => e.mon || e.tenBai || e.tenGV || e.kySo);
  const occupied = c => !!(c && (entries(c).length || c.operationId || status(c) !== 'HOC_BINH_THUONG'));
  // V70.4.6.13: nhiều entry do GDTC/Chuyên đề chiếu về lớp chủ nhiệm KHÔNG phải tiết TRỘN.
  // Chỉ bản ghi có ma_tiet_tron thật (backend đánh isTietTron/mixedMeta) mới mang nhãn TRỘN.
  const mixed = c => !!(c?.isTietTron || c?.mixedMeta);
  const needsReview = c => ['NGHI','GV_VANG','BO_TIET'].includes(status(c)) ||
    (mixed(c) && (c.mixedMeta ? !c.mixedMeta.complete : entries(c).some(e => !e.kySo || /chưa\s*(ký|xác nhận)/i.test(e.kySo)))) ||
    (status(c) === 'HOAN_DOI' && (!c.operationMeta?.counterpart?.completed || (c.operationMeta?.pairCount >= 2 && !c.operationMeta?.pairComplete)));
  const dateText = date => new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
  const dateAt = (date, offset) => {const d = new Date(date);d.setDate(d.getDate()+offset);return d;};
  function matches(c) {
    const filter = $('workspaceStatus').value;
    return occupied(c) && (filter === 'ALL' || (filter === 'REVIEW' ? needsReview(c) : filter === 'MIXED' ? mixed(c) : status(c) === filter));
  }
  function badges(c) {
    return renderPeriodStatusBadgeV683(c) + (mixed(c) ? `<span class="badge sodb-status-badge sodb-status-badge-mixed"${popoverAttrsV7032('Tiết trộn',mixedPopoverTextV7032(c))}>TRỘN</span>` : '');
  }
  function drawMetrics(matrix, ready = true) {
    const cells = Object.values(matrix || {}).filter(occupied);
    const n = cells.length;
    const metrics = [
      [n,'Tiết đã ghi','Theo ô buổi / tiết','book','blue'],
      [cells.filter(c=>c.operationId || c.operationMeta || ['DAY_THAY','DAY_BU','HOAN_DOI'].includes(status(c))).length,'Có điều hành','Dạy thay, bù, đổi tiết','check','green'],
      [cells.filter(mixed).length,'Tiết trộn','Nhiều môn / giáo viên','layers','blue'],
      [cells.filter(needsReview).length,'Cần rà soát','Nghỉ, vắng, chưa hoàn tất','alert','orange']
    ];
    $('workspaceMetrics').innerHTML = metrics.map(([value,label,detail,icon,color]) => `<div class="workspace-metric ${color}"><span class="workspace-metric-icon">${svg(icon)}</span><div><strong>${ready ? value : '—'}</strong><span>${label}</span><small>${detail}</small></div></div>`).join('');
  }
  function drawGrid() {
    if (!current) return;
    document.querySelectorAll('.sodb-status-popover-v7032').forEach(el=>el.remove());
    const {res,context} = current, matrix = res.matrix || {};
    const activeDays = days.slice(0,6);
    if (Object.keys(matrix).some(k=>k.startsWith('Chủ Nhật_') && occupied(matrix[k]))) activeDays.push('Chủ Nhật');
    const filter = $('workspaceStatus').value;
    let matchCount = 0;
    $('workspaceWeekGrid').innerHTML = ['Sang','Chieu'].map((session,si)=>{
      const header = activeDays.map((day,i)=>`<th scope="col">${dayLabels[i]}<small>${dateText(dateAt(context.mondayOfWeek,i))}</small></th>`).join('');
      const rows = Array.from({length:5},(_,i)=>{
        const period = i+1;
        return `<tr><th scope="row"><strong>Tiết ${period}</strong></th>${activeDays.map(day=>{
          const key = `${day}_${session}_${period}`, c = matrix[key];
          if (!occupied(c)) return `<td class="workspace-empty workspace-input-cell" data-input-cell="${esc(key)}" title="Nhập tiết ${period}"><span aria-label="Chưa có dữ liệu">—</span></td>`;
          const match = matches(c);if(match)matchCount++;
          if(!match) return `<td class="workspace-empty workspace-input-cell" data-input-cell="${esc(key)}" title="Mở nhập tiết ${period}"><span aria-label="Không thuộc trạng thái đang lọc">—</span></td>`;
          return `<td class="workspace-input-cell" data-input-cell="${esc(key)}" title="Mở nhập tiết ${period}"><article class="workspace-lesson${needsReview(c)?' needs-review':''}"><button type="button" class="workspace-lesson-more" data-cell="${esc(key)}" aria-label="Chi tiết ${esc(day)}, buổi ${si?'chiều':'sáng'}, tiết ${period}" title="Xem đầy đủ tiết học">⋯</button><div class="workspace-lesson-entries">${entries(c).map(e=>`<div class="workspace-lesson-entry"><strong>${esc(e.mon || 'Chưa có môn')}</strong>${e.tenGV ? `<span>${esc(e.tenGV)}</span>` : ''}</div>`).join('') || '<strong>Tiết có trạng thái</strong>'}</div><div class="workspace-lesson-badges">${badges(c)}</div>${c.studentExceptionNote?`<div class="small text-muted mt-1">${esc(c.studentExceptionNote)}</div>`:''}</article></td>`;
        }).join('')}</tr>`;
      }).join('');
      return `<section class="workspace-session"><h3>${svg(si?'moon':'sun')} Buổi ${si?'chiều':'sáng'} <small>Tiết 1 – 5</small></h3><div class="workspace-grid-scroll" tabindex="0" role="region" aria-label="Bảng buổi ${si?'chiều':'sáng'}, cuộn ngang để xem các ngày"><table class="workspace-grid"><caption class="visually-hidden">${esc(context.lop)} · Tuần ${context.tuan} · Buổi ${si?'chiều':'sáng'}</caption><thead><tr><th scope="col">Tiết</th>${header}</tr></thead><tbody>${rows}</tbody></table></div></section>`;
    }).join('');
    const total = Object.values(matrix).filter(occupied).length;
    $('workspaceBookStatus').textContent = !total ? `Chưa có dữ liệu lớp ${context.lop} – Tuần ${context.tuan}. Ô trống không có nghĩa là nghỉ học.` : filter === 'ALL' ? '' : `Có ${matchCount} ô tiết phù hợp với bộ lọc. Bản in A3 vẫn lấy đầy đủ dữ liệu tuần.`;
    $('workspaceBookStatus').hidden = !!total && filter === 'ALL';
  }
  function openInputCellV7067(key){
    if(!current||!key)return;
    if(!(typeof gvbmDangNhapInfo!=='undefined'&&gvbmDangNhapInfo&&gvbmDangNhapInfo.sessionToken)){if(typeof showToastV9==='function')showToastV9('Tài khoản hiện tại không có quyền nhập tiết.','warning');return;}
    const parts=String(key).split('_'),dayIndex=days.indexOf(parts[0]),session=parts[1]==='Chieu'?'Chiều':'Sáng',period=Number(parts[2]||1),date=dateAt(current.context.mondayOfWeek,dayIndex),iso=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'),lop=current.context.lop||'';
    const meta=(typeof classMetaV26!=='undefined'&&classMetaV26?.[normalizeTextKey(lop)])||{},grade=Number(meta.khoi||String(lop).match(/^(10|11|12)/)?.[1]||document.getElementById('viewKhoi')?.value||10);
    const tab=document.getElementById('input-tab');try{if(tab&&window.bootstrap)bootstrap.Tab.getOrCreateInstance(tab).show();else tab?.click();}catch(_e){tab?.click();}
    const set=()=>{
      const khoi=document.getElementById('khoi'),lopSel=document.getElementById('lop');if(khoi){khoi.value=String(grade);try{chonKhoiLopInput();}catch(_e){}}
      setTimeout(()=>{if(lopSel){const opt=[...lopSel.options].find(o=>String(o.value).trim()===lop);if(opt)lopSel.value=lop;try{onInputClassChangedV26();}catch(_e){}}const n=document.getElementById('ngayDay'),b=document.getElementById('buoiDay'),t=document.getElementById('tietDay');if(n)n.value=iso;if(b)b.value=session;if(t)t.value=String(period);try{capNhatTuanVaThu();}catch(_e){}try{capNhatHanNhapTietV683();}catch(_e){}try{if(typeof refreshGroupAttendanceV6951==='function')refreshGroupAttendanceV6951();}catch(_e){}try{loadDanhSachBaiDay();}catch(_e){}document.getElementById('sodbForm')?.scrollIntoView({behavior:'smooth',block:'start'});if(typeof showToastV9==='function')showToastV9(`Đã mở Nhập tiết: ${lop} · ${iso} · ${session} · Tiết ${period}`,'info');},80);
    };setTimeout(set,50);
  }

  function detail(key, trigger) {
    if (!current || loading) return;
    const c = current.res.matrix?.[key];if (!occupied(c)) return;
    lastDetailTrigger = trigger;
    const parts = key.split('_'), dayIndex = days.indexOf(parts[0]);
    $('workspaceDetailTitle').textContent = `${current.context.lop} · ${parts[0]} · ${parts[1] === 'Sang' ? 'Sáng' : 'Chiều'} · Tiết ${parts[2]}`;
    $('workspaceDetailBody').innerHTML = `<div class="workspace-detail-meta">${dateText(dateAt(current.context.mondayOfWeek,dayIndex))} · Tuần ${current.context.tuan}</div><div class="workspace-detail-badges">${badges(c)}</div>${c.studentExceptionNote?`<div class="alert alert-info py-2 mb-2"><b>Ngoại lệ học sinh:</b> ${esc(c.studentExceptionNote)}${Array.isArray(c.studentExceptions)&&c.studentExceptions.length?`<div class="small mt-1">${c.studentExceptions.map(x=>`${esc(x.hoTen||x.maHS)}${x.reason?' – '+esc(x.reason):''}`).join('<br>')}</div>`:''}</div>`:''}${entries(c).map(e=>`<section class="workspace-detail-lesson"><h3>${esc(e.mon || 'Chưa có môn')}</h3><dl><dt>Giáo viên</dt><dd>${esc(e.tenGV || 'Chưa có thông tin')}</dd><dt>Tiết chương trình</dt><dd>${esc(e.tietCT || '—')}</dd><dt>Nội dung bài dạy</dt><dd>${esc(e.tenBai || '—')}</dd></dl></section>`).join('')}<section class="workspace-detail-lesson"><dl><dt>Học sinh vắng</dt><dd>${esc(c.hsVang || 'Không có thông tin vắng trong bản ghi')}</dd><dt>Nhận xét</dt><dd>${esc(sodbNhanXetSafeV83(c) || '—')}</dd><dt>Điểm</dt><dd>Học tập: ${esc(c.diemHT ?? '—')} · Kỷ luật: ${esc(c.diemKL ?? '—')} · Vệ sinh: ${esc(c.diemNN ?? '—')} · Trung bình: ${esc(c.diemTB ?? '—')}</dd></dl></section><section class="workspace-detail-lesson"><h3>Chữ ký & họ tên giáo viên</h3>${renderSignatureCell(c,true) || '<p>Chưa có chữ ký.</p>'}</section>`;
    bootstrap.Modal.getOrCreateInstance($('workspaceDetail')).show();
  }
  function busy(isBusy) {
    loading = isBusy;
    $('workspaceWeekGrid').setAttribute('aria-busy',String(isBusy));
    $('workspacePrint').disabled = isBusy || !current;
  }
  window.sodbWorkspace = {
    loading() {
      if(typeof renderReviewV7044==='function')renderReviewV7044(null);
      current = null;busy(true);drawMetrics({},false);$('tabView').classList.remove('workspace-book-loaded');
      $('workspaceWeekGrid').innerHTML = '<div class="workspace-loading"><span class="spinner-border text-primary" role="status"></span><p>Đang tải sổ đầu bài…</p></div>';
      $('workspaceBookStatus').hidden=true;
      $('workspaceDataStamp').textContent='';
    },
    error() {
      if(typeof renderReviewV7044==='function')renderReviewV7044(null);
      current=null;busy(false);drawMetrics({},false);$('tabView').classList.remove('workspace-book-loaded');$('workspaceWeekGrid').innerHTML='';
      $('workspaceBookStatus').hidden=false;$('workspaceBookStatus').textContent='Không thể tải dữ liệu. Vui lòng bấm Xem sổ để thử lại.';
    },
    render(payload,context) {
      const res=payload?.sodb || payload;
      if(!res?.success){this.error();return;}
      current={res,context,payload};busy(false);$('tabView').classList.toggle('workspace-book-loaded',Object.values(res.matrix || {}).some(occupied));
      $('workspaceWeekRange').textContent=`${context.lop} · Tuần ${context.tuan} · ${dateText(context.mondayOfWeek)} – ${dateText(dateAt(context.mondayOfWeek,6))}`;
      $('workspaceDataStamp').textContent=`Đã tải lúc ${new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
      drawMetrics(res.matrix);drawGrid();
    },
    clear() {
      if(typeof renderReviewV7044==='function')renderReviewV7044(null);
      current=null;busy(false);drawMetrics({},false);$('tabView').classList.remove('workspace-book-loaded');$('workspaceWeekGrid').innerHTML='';
      $('workspaceWeekRange').textContent='Chọn lớp và tuần để xem sổ';$('workspaceDataStamp').textContent='';
      $('workspaceBookStatus').hidden=false;$('workspaceBookStatus').textContent='Bấm Xem sổ để tải lớp và tuần đã chọn.';
      bootstrap.Modal.getInstance($('workspaceDetail'))?.hide();
    }
  };
  async function loadWeek(step) {
    const input=$('viewTuan'), max=Number(input.max)||52;
    if (step === 'today') {
      const [y,m,d]=START_DATE_WEEK1_STR.split('-').map(Number);
      const today=new Date();today.setHours(0,0,0,0);
      input.value=Math.max(1,Math.min(max,Math.floor((today-new Date(y,m-1,d))/604800000)+1));
    } else input.value=Math.max(1,Math.min(max,(parseInt(input.value)||1)+Number(step)));
    try {await traCuuSoDauBaiTuanGop();}catch(_err){/* Existing loader displays the error. */}
  }
  async function printView() {
    if(!current || loading || printing) return;
    // Snapshot the loaded context so changing a filter cannot print another class/week.
    const {lop,tuan,bookMode}=current.context;
    printing=true;$('workspacePrint').disabled=true;
    setBusyV13(true,'Đang chuẩn bị bản in A3…');
    try {
      const html=await layHtmlOnePageA3GiamThi(lop,tuan,bookMode);
      if(!html)throw new Error('Không tải được dữ liệu bản in.');
      $('a3PrintRootV56')?.remove();
      const root=document.createElement('div');root.id='a3PrintRootV56';root.setAttribute('aria-hidden','true');root.innerHTML=html;
      document.body.appendChild(root);document.body.classList.add('a3-tracuu-v56');
      await preloadPrintImagesV14(root);
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      window.print();
    } catch(err) {
      $('a3PrintRootV56')?.remove();document.body.classList.remove('a3-tracuu-v56');
      showToastV9(err.message || 'Không chuẩn bị được bản in.','danger');
    } finally {printing=false;setBusyV13(false);$('workspacePrint').disabled=loading || !current;}
  }
  function menu(open) {
    $('appShellV4').classList.toggle('workspace-menu-open',open);
    $('workspaceMenu').setAttribute('aria-expanded',String(open));
    $('workspaceMenu').setAttribute('aria-label',open?'Ẩn menu điều hướng':'Mở menu điều hướng');
    document.body.classList.toggle('workspace-nav-open',open);
    if(open && window.matchMedia('(max-width: 991.98px)').matches) $('workspaceCloseMenu').focus();
  }
  function syncTitle() {
    const active=document.querySelector('#sodbTab .nav-link.active');
    const title=tabNames[active?.id]?.[0] || active?.textContent || 'Sổ đầu bài điện tử';
    $('workspaceTitle').textContent=active?.id==='view-tab'?'Sổ đầu bài điện tử':title;
    $('workspaceBreadcrumb').textContent=title;$('workspacePrint').hidden=active?.id!=='view-tab';
    const titleIcon=document.querySelector('.workspace-page-head > .workspace-title-icon');
    titleIcon.innerHTML=svg(tabNames[active?.id]?.[1] || 'book');
  }
  function init() {
    document.body.classList.add('workspace-v704');
    if(typeof capNhatLoiChaoTheoGioV48==='function')capNhatLoiChaoTheoGioV48();
    // Greeting text may wrap on mobile; reserve the actual fixed-header height.
    const topbar=document.querySelector('.app-userbar-v4');
    const syncHeaderHeight=()=>{
      const height=topbar?.getBoundingClientRect().height||0;
      if(height)$('appShellV4').style.setProperty('--ws-topbar-height',`${Math.ceil(height)}px`);
    };
    if(typeof ResizeObserver!=='undefined' && topbar)new ResizeObserver(syncHeaderHeight).observe(topbar);
    window.addEventListener('resize',syncHeaderHeight,{passive:true});
    syncHeaderHeight();
    document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=svg(el.dataset.icon));
    Object.entries(tabNames).forEach(([id,[label,icon]])=>{const btn=$(id);if(btn)btn.innerHTML=`${svg(icon)}<span>${label}</span>`;});
    const filter=$('tabView').querySelector(':scope > .card.no-print');
    if(filter){filter.classList.add('workspace-filters');$('workspaceFilterMount').appendChild(filter);}
    $('workspaceLegend').innerHTML='<strong>Chú thích trạng thái tiết học</strong><div>'+[
      ['NGHỈ','absence','Học sinh nghỉ học'],['GV VẮNG','absence','Giáo viên vắng mặt'],['BỎ TIẾT','absence','Không tổ chức dạy học'],['DẠY THAY','substitute','Có giáo viên dạy thay'],['DẠY BÙ','makeup','Dạy bù tiết học'],['ĐỔI TIẾT','swap','Đổi vị trí tiết học'],['TRỘN','mixed','Nhiều môn / giáo viên']
    ].map(([label,cls,desc])=>`<div><span class="badge sodb-status-badge sodb-status-badge-${cls}">${label}</span><small>${desc}</small></div>`).join('')+'</div>';
    document.body.insertAdjacentHTML('beforeend','<div class="modal fade workspace-detail-modal" id="workspaceDetail" tabindex="-1" aria-labelledby="workspaceDetailTitle" aria-hidden="true"><div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5" id="workspaceDetailTitle">Chi tiết tiết học</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button></div><div class="modal-body" id="workspaceDetailBody"></div><div class="modal-footer"><button type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">Đóng</button></div></div></div></div>');
    $('workspaceDetail').addEventListener('hidden.bs.modal',()=>lastDetailTrigger?.focus());
    // Avoid overlapping Bootstrap modals when opening the existing signature certificate.
    $('workspaceDetailBody').addEventListener('click',event=>{if(event.target.closest('.sig-container[role="button"]'))bootstrap.Modal.getInstance($('workspaceDetail'))?.hide();},true);
    $('workspaceMenu').addEventListener('click',()=>menu(!$('appShellV4').classList.contains('workspace-menu-open')));
    const closeMenu=()=>{menu(false);$('workspaceMenu').focus();};
    $('workspaceBackdrop').addEventListener('click',closeMenu);
    $('workspaceCloseMenu').addEventListener('click',closeMenu);
    $('workspaceSidebar').addEventListener('keydown',event=>{
      if(event.key!=='Tab' || !$('appShellV4').classList.contains('workspace-menu-open') || !window.matchMedia('(max-width: 991.98px)').matches)return;
      const focusable=[...$('workspaceSidebar').querySelectorAll('button:not([disabled])')].filter(el=>el.getClientRects().length);
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){const wasOpen=$('appShellV4').classList.contains('workspace-menu-open');menu(false);if(wasOpen)$('workspaceMenu').focus();document.querySelectorAll('[data-sodb-status-popover="1"]').forEach(el=>bootstrap.Popover.getInstance(el)?.hide());}
      if((event.key==='Enter'||event.key===' ') && event.target.matches('[data-sodb-status-popover="1"]')){event.preventDefault();event.target.click();}
    });
    $('sodbTab').addEventListener('shown.bs.tab',()=>{syncTitle();menu(false);});
    $('workspaceStatus').addEventListener('change',drawGrid);
    $('workspaceWeekGrid').addEventListener('click',event=>{const btn=event.target.closest('[data-cell]');if(btn){event.stopPropagation();detail(btn.dataset.cell,btn);return;}const cell=event.target.closest('[data-input-cell]');if(cell)openInputCellV7067(cell.dataset.inputCell);});
    document.querySelectorAll('[data-week-step]').forEach(btn=>btn.addEventListener('click',()=>loadWeek(btn.dataset.weekStep)));
    $('workspacePrint').addEventListener('click',printView);
    ['viewKhoi','viewLop','viewBookMode','viewTuan'].forEach(id=>$(id).addEventListener('change',()=>{
      // Cancel stale presentation results while preserving the existing loader and cache.
      sodbViewRequestV704++;window.sodbWorkspace.clear();
    }));
    let wasHidden=$('appShellV4').classList.contains('d-none');
    const observer=new MutationObserver(()=>{syncTitle();const hidden=$('appShellV4').classList.contains('d-none');if(hidden && !wasHidden){sodbViewRequestV704++;window.sodbWorkspace.clear();menu(false);}wasHidden=hidden;});
    observer.observe($('appShellV4'),{attributes:true,attributeFilter:['class']});
    drawMetrics({},false);syncTitle();$('workspacePrint').disabled=true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

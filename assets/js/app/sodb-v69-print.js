 /* ===== V45: TRA CỨU - IN / XUẤT A3 ĐA TUẦN ĐỒNG BỘ TAB XEM SỔ ===== */
function khoiTaoDanhSachLopGiamThi() {
  let selectLop = document.getElementById('gtDetailLop');
  let selectLopCompare = document.getElementById('gtCompareLop');
  let selectLopLate = document.getElementById('gtLateLop');

  if(selectLop) selectLop.innerHTML = '<option value="">-- Tất cả các Lớp --</option>';
  if(selectLopCompare) selectLopCompare.innerHTML = '<option value="">-- Tất cả Lớp --</option>';
  if(selectLopLate) selectLopLate.innerHTML = '<option value="">-- Tất cả các Lớp --</option>';

  Object.keys(dsLopTheoKhoi).forEach(k => {
    dsLopTheoKhoi[k].forEach(l => {
      if(selectLop) selectLop.add(new Option(l, l));
      if(selectLopCompare) selectLopCompare.add(new Option(l, l));
      if(selectLopLate) selectLopLate.add(new Option(l, l));
    });
  });

  capNhatDanhSachLopPrintA3GiamThi();
}

function capNhatDanhSachLopPrintA3GiamThi() {
  const khoi = document.getElementById('gtPrintKhoi')?.value || '10';
  const selectLopPrint = document.getElementById('gtPrintLop');
  if (!selectLopPrint) return;
  napLopVaoSelectV22(selectLopPrint, khoi, true);
  capNhatLoaiSoPrintA3GiamThiV45();
}

function laSoGop5TuanV57(){
  const bookMode=document.getElementById('gtPrintBookMode')?.value||'LOP_CHINH';
  return bookMode==='GDTC'||bookMode==='CHUYEN_DE';
}

function capNhatGhiChuInA3V57(){
  const note=document.getElementById('gtPrintBookNoteV45');
  if(!note)return;
  const bookMode=document.getElementById('gtPrintBookMode')?.value||'LOP_CHINH';
  const layout=document.getElementById('gtPrintLayoutV57')?.value||'ONE_WEEK';
  if(bookMode==='GDTC'){
    note.textContent=layout==='FIVE_WEEKS'
      ? 'Sổ GDTC chỉ hiển thị các tiết thực tế phát sinh; khi in sẽ gộp tối đa 5 tuần liên tiếp trên 1 trang A3 ngang.'
      : 'Sổ GDTC chỉ hiển thị các tiết thực tế phát sinh; mỗi tuần in trên 1 trang A3 ngang.';
  }else if(bookMode==='CHUYEN_DE'){
    note.textContent=layout==='FIVE_WEEKS'
      ? 'Sổ Chuyên đề chỉ hiển thị các tiết thực tế phát sinh; khi in sẽ gộp tối đa 5 tuần liên tiếp trên 1 trang A3 ngang.'
      : 'Sổ Chuyên đề chỉ hiển thị các tiết thực tế phát sinh; mỗi tuần in trên 1 trang A3 ngang.';
  }else{
    note.textContent='Sổ đầu bài lớp chính luôn giữ 1 tuần = 1 trang A3 ngang để bảo đảm đủ nội dung, tổng kết và chữ ký.';
  }
}

function capNhatLoaiSoPrintA3GiamThiV45(){
  const lop=document.getElementById('gtPrintLop')?.value||'';
  const sel=document.getElementById('gtPrintBookMode');
  const layoutWrap=document.getElementById('gtPrintLayoutWrapV57');
  const layoutSel=document.getElementById('gtPrintLayoutV57');
  if(!sel)return;

  let specialOpt=[...sel.options].find(o=>o.value==='CHUYEN_DE');
  if(!specialOpt){
    specialOpt=new Option('Sổ đầu bài Chuyên đề','CHUYEN_DE');
    sel.add(specialOpt);
  }

  const special=loaiSoTheoLopV22(lop)==='CHUYEN_DE';
  specialOpt.hidden=!special;
  sel.disabled=special;
  if(special){
    sel.value='CHUYEN_DE';
  }else if(sel.value==='CHUYEN_DE'){
    sel.value='LOP_CHINH';
  }

  const allowFiveWeeks=laSoGop5TuanV57();
  if(layoutWrap)layoutWrap.classList.toggle('d-none',!allowFiveWeeks);
  if(layoutSel&&!allowFiveWeeks)layoutSel.value='ONE_WEEK';
  capNhatGhiChuInA3V57();
}

function chuyenCheDoInGiamThi() {
  const mode = document.getElementById('gtPrintModeIn')?.value || 'SINGLE';
  const boxSingle = document.getElementById('gtBoxSingleTuan');
  const boxMulti = document.getElementById('gtBoxMultiTuan');
  if (!boxSingle || !boxMulti) return;
  if (mode === 'SINGLE') {
    boxSingle.classList.remove('d-none');
    boxMulti.classList.add('d-none');
  } else {
    boxSingle.classList.add('d-none');
    boxMulti.classList.remove('d-none');
  }
  capNhatGhiChuInA3V57();
}

/* Đóng gói 1 hoặc nhiều tuần; loại sổ giống tab Xem sổ đầu bài. */
function traCuuInSodbGiamThiHandler() {
  const mode = document.getElementById('gtPrintModeIn')?.value || 'SINGLE';
  const lop = document.getElementById('gtPrintLop')?.value || '';
  const bookMode = document.getElementById('gtPrintBookMode')?.value || 'LOP_CHINH';

  if (!lop) {
    alertV13('⚠️ Vui lòng chọn Lớp cần in!');
    return;
  }

  let dsTuanArr=[];
  if (mode === 'SINGLE') {
    const tuan = Math.max(1,Math.min(52,parseInt(document.getElementById('gtPrintTuan')?.value)||1));
    dsTuanArr=[tuan];
  } else {
    const tuTuan = Math.max(1,Math.min(52,parseInt(document.getElementById('gtPrintTuTuan')?.value)||1));
    const denTuan = Math.max(1,Math.min(52,parseInt(document.getElementById('gtPrintDenTuan')?.value)||18));
    if (tuTuan > denTuan) {
      alertV13("⚠️ 'Từ Tuần' không được lớn hơn 'Đến Tuần'!");
      return;
    }
    if(denTuan-tuTuan+1>30){
      alertV13('⚠️ Mỗi lần nên xuất tối đa 30 tuần để trình duyệt xử lý ổn định.');
      return;
    }
    for (let t = tuTuan; t <= denTuan; t++) dsTuanArr.push(t);
  }
  taiVaHienThiDanhSachTuanGiamThi(lop, dsTuanArr, bookMode);
}

function taoTrangBiaA3V684(lop,bookMode){
  const schoolYear=String(document.getElementById('printSchoolYearV20')?.textContent||'2026 - 2027').trim();
  const classLabel=String(lop||document.getElementById('gtPrintLop')?.value||'').trim();
  return `<div class="a3-cover-page-v684" data-cover="true" data-book-mode="${escapeHtml(bookMode||'LOP_CHINH')}">
    <div class="a3-cover-inner-v684">
      <div class="a3-cover-top-v684">
        <div>SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
        <div>THPT HỒ THỊ BI</div>
      </div>
      <div class="a3-cover-title-v684">SỔ GHI ĐẦU BÀI</div>
      <div class="a3-cover-bottom-v684">
        <div class="a3-cover-class-v684">LỚP: ${escapeHtml(classLabel)}</div>
        <div>THPT HỒ THỊ BI</div>
        <div>THÀNH PHỐ HỒ CHÍ MINH</div>
        <div class="a3-cover-year-v684">NĂM HỌC: ${escapeHtml(schoolYear)}</div>
      </div>
    </div>
  </div>`;
}
function capNhatTrangBiaPreviewV684(){
  const container=document.getElementById('gtPrintPagesContainer');if(!container)return;
  container.querySelectorAll('.a3-cover-page-v684').forEach(x=>x.remove());
  const checked=!!document.getElementById('gtPrintCoverV684')?.checked;
  if(!checked)return;
  const lop=document.getElementById('gtPrintLop')?.value||'';
  if(!lop)return;
  const mode=document.getElementById('gtPrintBookMode')?.value||'LOP_CHINH';
  container.insertAdjacentHTML('afterbegin',taoTrangBiaA3V684(lop,mode));
}

async function taiVaHienThiDanhSachTuanGiamThi(lop, dsTuan, bookMode) {
  const container = document.getElementById('gtPrintPagesContainer');
  const btn = document.getElementById('btnGtPrintSearch');
  if(!container||!btn)return;
  btn.disabled = true;
  const oldText=btn.innerText;
  const bookLabel={LOP_CHINH:'Sổ đầu bài lớp',GDTC:'Sổ đầu bài GDTC',CHUYEN_DE:'Sổ đầu bài Chuyên đề'}[bookMode]||'Sổ đầu bài';

  container.innerHTML = `<div class="text-center py-5 no-print"><div class="spinner-border text-info" role="status"></div><div class="mt-2 fw-bold">Đang đóng gói ${escapeHtml(bookLabel)} - ${dsTuan.length} tuần...</div></div>`;
  let htmlAllPages = '';
  let loaded=0;

  for (let idx = 0; idx < dsTuan.length; idx++) {
    const tuanNum = dsTuan[idx];
    btn.innerText = `⏳ Tuần ${tuanNum} (${idx + 1}/${dsTuan.length})...`;
    try {
      const pageHtml = await layHtmlOnePageA3GiamThi(lop, tuanNum, bookMode);
      if(pageHtml){htmlAllPages += pageHtml;loaded++;}
    } catch (err) {
      console.error('Lỗi tải tuần '+tuanNum, err);
    }
  }

  btn.disabled = false;
  btn.innerText = oldText || 'Tải bản in';

  if (htmlAllPages) {
    const coverHtml=document.getElementById('gtPrintCoverV684')?.checked?taoTrangBiaA3V684(lop,bookMode):'';
    container.innerHTML = coverHtml + htmlAllPages;
    if(typeof hydrateSignatureFallbackPlaceholdersV704637==='function'){
      try{ await hydrateSignatureFallbackPlaceholdersV704637(container,true); }catch(_e){}
    }
    const layout=(laSoGop5TuanV57()?document.getElementById('gtPrintLayoutV57')?.value:'ONE_WEEK')||'ONE_WEEK';
    const msg=layout==='FIVE_WEEKS'
      ? `Đã chuẩn bị ${loaded}/${dsTuan.length} tuần · khi in sẽ gộp tối đa 5 tuần / trang A3 - ${bookLabel}.`
      : `Đã chuẩn bị ${loaded}/${dsTuan.length} tuần · 1 tuần / trang A3 - ${bookLabel}.`;
    showToastV9(msg,'success');
  } else {
    container.innerHTML = `<div class="text-center py-5 text-warning fw-bold">⚠️ Không tìm thấy dữ liệu phù hợp cho lớp ${escapeHtml(lop)}!</div>`;
  }
}


/* ===== V70.4.6.10: A3 - đồng bộ dòng con của tiết TRỘN ===== */
function a3PrintEntriesV704610(cellData){
  const entries=(typeof getCellEntries==='function'?getCellEntries(cellData):[])||[];
  return entries.length?entries:[{mon:'',tietCT:'',tenBai:''}];
}
function a3PrintEntryCountV704610(cellData){
  return a3PrintEntriesV704610(cellData).length;
}
function a3PrintRowMultiClassV704610(cellData){
  const count=a3PrintEntryCountV704610(cellData);
  if(count<=1)return '';
  return ` a3-row-multi-v704610 a3-row-lines-${Math.min(count,3)}-v704610`;
}
function renderA3MixedStackV704610(cellData,fieldName,prefixHtml=''){
  const entries=a3PrintEntriesV704610(cellData);
  const count=entries.length;
  return `<div class="a3-sync-stack-v704610" style="--a3-sync-lines:${count}">${entries.map((entry,index)=>{
    const mixedBadge=(fieldName==='mon'&&count>1&&index===0)
      ? '<span class="badge sodb-status-badge sodb-status-badge-mixed mixed-badge me-1">TRỘN</span> '
      : '';
    const prefix=index===0?String(prefixHtml||''):'';
    return `<div class="a3-sync-line-v704610 a3-sync-${String(fieldName||'').toLowerCase()}-v704610">${prefix}${mixedBadge}${escapeHtml(teachingFieldV704649(entry,fieldName))}</div>`;
  }).join('')}</div>`;
}
function renderA3FieldV704610(cellData,fieldName,prefixHtml=''){
  if(a3PrintEntryCountV704610(cellData)>1){
    return renderA3MixedStackV704610(cellData,fieldName,prefixHtml);
  }
  const content=`${prefixHtml||''}${renderMixedField(cellData,fieldName)}`;
  if(fieldName==='mon')return `<div class="a3-cell-clamp-v56 a3-one-line-v56">${content}</div>`;
  if(fieldName==='tenBai')return `<div class="a3-cell-clamp-v56">${content}</div>`;
  return content;
}
function a3GuideContentWrapV704639(html,enabled){
  return html; // V704640: full-width row borders, including populated cells.
}

function taoRowsSoDacBietPrintA3V45(res,mondayOfWeek){
  const dayOrder={'Thứ 2':0,'Thứ 3':1,'Thứ 4':2,'Thứ 5':3,'Thứ 6':4,'Thứ 7':5,'Chủ Nhật':6};
  const rows=Object.entries(res.matrix||{}).map(([key,cell])=>{
    const p=key.split('_');
    return {thu:p[0]||'',buoi:p[1]||'',tiet:Number(p[2]||0),cell:cell||{}};
  }).filter(x=>{
    const c=x.cell||{};
    return !!(c.mon||c.tenBai||(Array.isArray(c.entries)&&c.entries.length));
  }).sort((a,b)=>{
    const da=dayOrder[a.thu]??99,db=dayOrder[b.thu]??99;
    if(da!==db)return da-db;
    const ba=a.buoi==='Sang'?0:1,bb=b.buoi==='Sang'?0:1;
    if(ba!==bb)return ba-bb;
    return a.tiet-b.tiet;
  });

  if(!rows.length)return '<tr><td colspan="12" class="text-warning py-3 text-center">Tuần này chưa có tiết phát sinh.</td></tr>';

  const grouped={};
  rows.forEach(r=>(grouped[r.thu]||(grouped[r.thu]=[])).push(r));
  let out='';
  Object.keys(grouped).sort((a,b)=>(dayOrder[a]??99)-(dayOrder[b]??99)).forEach((thu,dayIdx)=>{
    const dayRows=grouped[thu];
    const currentDate=new Date(mondayOfWeek);
    currentDate.setDate(mondayOfWeek.getDate()+(dayOrder[thu]??0));
    const dateFormatted=`${String(currentDate.getDate()).padStart(2,'0')}/${String(currentDate.getMonth()+1).padStart(2,'0')}`;

    dayRows.forEach((r,i)=>{
      const c=r.cell||{};
      const sigCell=renderSignatureCell(c,false);
      const buoiLabel=r.buoi==='Sang'?'S':'C';
      out+=`<tr class="${i===0&&dayIdx>0?'row-day-start':''}${a3PrintRowMultiClassV704610(c)}">`;
      if(i===0)out+=`<td rowspan="${dayRows.length}" class="compact-day-v29 text-center align-middle"><div>${escapeHtml(thu)}</div><div>${dateFormatted}</div></td>`;
      out+=`
        <td class="compact-slot-v29"><span class="badge ${r.buoi==='Sang'?'text-primary':'text-danger'} buoi-tag">${buoiLabel}</span> ${r.tiet}</td>
        <td class="text-left-cell">${renderA3FieldV704610(c,'mon',renderPeriodStatusBadgeV683(c))}</td>
        <td class="fw-bold text-primary">${renderA3FieldV704610(c,'tietCT')}</td>
        <td class="text-left-cell"><div class="a3-cell-clamp-v56 a3-one-line-v56">${escapeHtml(c.hsVang||'')}</div></td>
        <td class="text-left-cell">${renderA3FieldV704610(c,'tenBai')}</td>
        <td class="text-left-cell"><div class="a3-cell-clamp-v56">${escapeHtml(sodbNhanXetSafeV83(c))}</div></td>
        <td>${c.diemHT||''}</td><td>${c.diemKL||''}</td><td>${c.diemNN||''}</td>
        <td class="fw-bold">${c.diemTB||''}</td><td>${sigCell}</td>
      </tr>`;
    });
  });
  return out;
}

function layHtmlOnePageA3GiamThi(lop, tuan, bookMode) {
  return new Promise((resolve) => {
    const partsStart = START_DATE_WEEK1_STR.split('-');
    const startDateWeek1 = new Date(parseInt(partsStart[0]), parseInt(partsStart[1]) - 1, parseInt(partsStart[2]));
    const mondayOfWeek = new Date(startDateWeek1);
    mondayOfWeek.setDate(startDateWeek1.getDate() + (tuan - 1) * 7);

    google.script.run
      .withSuccessHandler(function(payload) {
        if (!payload || !payload.success) { resolve(''); return; }
        const res=payload.sodb||payload;
        if(!res||!res.success){resolve('');return;}
        const resolvedMode=payload.bookType||res.bookType||bookMode||'LOP_CHINH';
        const bookTitle=payload.bookTitle||res.bookTitle||tieuDeSoTheoLopV22(lop,resolvedMode);
        const isSpecial=!!(res.compactBook||resolvedMode==='GDTC'||resolvedMode==='CHUYEN_DE');

        let tableBodyHtml='';
        if(isSpecial){
          tableBodyHtml=taoRowsSoDacBietPrintA3V45(res,mondayOfWeek);
        }else{
          const thuArrFull = [
            { name: 'Thứ 2', offset: 0 }, { name: 'Thứ 3', offset: 1 },
            { name: 'Thứ 4', offset: 2 }, { name: 'Thứ 5', offset: 3 },
            { name: 'Thứ 6', offset: 4 }, { name: 'Thứ 7', offset: 5 }
          ];
          thuArrFull.forEach((thuObj, dayIdx) => {
            const currentDate = new Date(mondayOfWeek);
            currentDate.setDate(mondayOfWeek.getDate() + thuObj.offset);
            const dateFormatted = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            for (let i = 0; i < 10; i++) {
              const buoi = i < 5 ? 'Sang' : 'Chieu';
              const tiet = i < 5 ? i + 1 : i - 4;
              const key = thuObj.name + '_' + buoi + '_' + tiet;
              const cellData = res.matrix[key] || {};
              const sigCell = renderSignatureCell(cellData, false);
              const guideRow = (i > 0 && i < 5) || i > 5;
              let rowClass = '';
              if (i === 0 && dayIdx > 0) rowClass = 'row-day-start';
              else if (i === 5) rowClass = 'row-chieu-start';
              if (guideRow) rowClass += ' a3-guide-row-v704639';
              rowClass += a3PrintRowMultiClassV704610(cellData);
              tableBodyHtml += `<tr class="${rowClass.trim()}">`;
              if (i === 0) tableBodyHtml += `<td rowspan="10" class="fw-bold align-middle bg-light text-center"><div>${thuObj.name}</div><div class="text-dark" style="font-size:0.55rem;">${dateFormatted}</div></td>`;
              const monHtml = a3GuideContentWrapV704639(renderA3FieldV704610(cellData,'mon',renderPeriodStatusBadgeV683(cellData)), guideRow);
              const tietCtHtml = a3GuideContentWrapV704639(renderA3FieldV704610(cellData,'tietCT'), guideRow);
              const hsVangHtml = a3GuideContentWrapV704639(`<div class="a3-cell-clamp-v56 a3-one-line-v56">${escapeHtml(cellData.hsVang || '')}</div>`, guideRow);
              const tenBaiHtml = a3GuideContentWrapV704639(renderA3FieldV704610(cellData,'tenBai'), guideRow);
              const nhanXetHtml = a3GuideContentWrapV704639(`<div class="a3-cell-clamp-v56">${escapeHtml(sodbNhanXetSafeV83(cellData))}</div>`, guideRow);
              tableBodyHtml += `
                <td class="fw-bold"><span class="badge ${buoi === 'Sang' ? 'text-primary' : 'text-danger'} buoi-tag">${buoi === 'Sang' ? 'S' : 'C'}</span> ${tiet}</td>
                <td class="text-left-cell">${monHtml}</td>
                <td class="fw-bold text-primary">${tietCtHtml}</td>
                <td class="text-left-cell">${hsVangHtml}</td>
                <td class="text-left-cell">${tenBaiHtml}</td>
                <td class="text-left-cell">${nhanXetHtml}</td>
                <td>${cellData.diemHT || ''}</td><td>${cellData.diemKL || ''}</td><td>${cellData.diemNN || ''}</td>
                <td class="fw-bold">${cellData.diemTB || ''}</td><td>${sigCell}</td>
              </tr>`;
            }
          });
        }

        let ykienText = 'Chưa có ý kiến...';
        let gvcnNameText = '';
        let sigSpaceHtml = '<span class="text-muted" style="font-size: 0.55rem;">Chưa chốt ký</span>';
        const chotResData=payload.chot&&payload.chot.success?payload.chot:null;
        if (chotResData) {
          ykienText = chotResData.ykien || 'Không có ý kiến.';
          gvcnNameText = chotResData.tenGVCN || '';
          const gvcnSigRaw=String(chotResData.chuKyGVCN||chotResData.kySo||chotResData.signatureRef||'');
          const gvcnSigUrl=normalizeSignatureUrlV67_1(gvcnSigRaw);
          if (gvcnSigUrl) {
            sigSpaceHtml = `<img src="${escapeHtml(gvcnSigUrl)}" class="sig-gvcn-print" alt="Chữ ký GVCN">`;
          } else {
            sigSpaceHtml = '<span class="badge bg-success" style="font-size: 0.55rem;">✓ Đã ký chốt</span>';
          }
        }
        let bghNameText='';
        let bghSigSpaceHtml='<span class="text-muted" style="font-size:0.55rem;">Chưa duyệt</span>';
        const bghResData=payload.bghDuyet&&payload.bghDuyet.success?payload.bghDuyet:null;
        if(bghResData){
          bghNameText=bghResData.tenBGH||'';
          const bghSigRaw=String(bghResData.chuKyBGH||bghResData.kySo||bghResData.signatureRef||'');
          const bghSigUrl=normalizeSignatureUrlV67_1(bghSigRaw);
          bghSigSpaceHtml=bghSigUrl
            ? `<img src="${escapeHtml(bghSigUrl)}" class="sig-bgh-print" alt="Chữ ký BGH">`
            : '<span class="badge bg-primary" style="font-size:0.55rem;">✓ Đã duyệt</span>';
        }

        const dtbNum = parseFloat(res.summary?.dtbTuan) || 0;
        const xepLoaiText = dtbNum >= 8 ? 'Loại A' : (dtbNum >= 6.5 ? 'Loại B' : 'Loại C');
        const schoolYearText=document.getElementById('printSchoolYearV20')?.textContent||'2026 - 2027';
        const tableClass='table-sodb'+(isSpecial?' compact-special-book-v29':'');

        const fullPageHtml = `
        <div class="print-page-block a3-week-page-v56" data-book-mode="${escapeHtml(resolvedMode)}" data-week="${tuan}">
          <div class="so-header-print">
            <img src="${document.querySelector('#printPageSingle .school-logo')?.src||''}" alt="Logo" class="school-logo">
            <div class="text-uppercase fw-bold text-secondary" style="font-size: 0.65rem;">SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HỒ CHÍ MINH</div>
            <div class="fw-bold text-dark" style="font-size: 0.75rem;">TRƯỜNG THPT HỒ THỊ BI</div>
            <div class="so-title">${escapeHtml(bookTitle)}</div>
            <div class="so-subhead">Tuần: <strong>${tuan}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Năm học: ${escapeHtml(schoolYearText)}</div>
          </div>
          <table class="${tableClass}">
            <thead><tr>
              <th style="width:5%;">Thứ, ngày</th><th style="width:4%;">Buổi-Tiết</th><th style="width:6%;">Môn</th>
              <th style="width:4%;">Tiết CT</th><th style="width:6%;">HS vắng</th><th style="width:25.5%;">Tên bài học</th>
              <th style="width:22%;">Nhận xét</th><th style="width:2.5%;">HT</th><th style="width:2.5%;">KL</th>
              <th style="width:2.5%;">VS</th><th style="width:3.5%;">ĐTB</th><th style="width:16.5%;">Chữ ký &amp; họ tên GV</th>
            </tr></thead>
            <tbody>${tableBodyHtml}</tbody>
          </table>
          <div class="summary-box">
            <div class="summary-title">TỔNG KẾT TUẦN ${tuan}</div>
            <div class="row text-center mb-0">
              <div class="col-4"><strong>Vắng:</strong> <span>${res.summary?.vangP??0}</span> | <span>${res.summary?.vangKP??0}</span></div>
              <div class="col-4"><strong>Điểm TB tuần:</strong> <span class="text-primary fw-bold">${res.summary?.dtbTuan??'0.0'}</span> (<span class="text-success fw-bold">${xepLoaiText}</span>)</div>
              <div class="col-4"><strong>Chưa ký:</strong> <span class="text-danger">${res.summary?.soTietChuaKy??0}</span> tiết</div>
            </div>
            <div><strong>${isSpecial?'Ý kiến GV phụ trách nhóm:':'Ý kiến GVCN:'}</strong> <span class="fst-italic text-secondary">${escapeHtml(ykienText)}</span></div>
            <div class="signature-footer">
              <div class="signature-box"><div class="signature-title">${isSpecial?'GIÁO VIÊN PHỤ TRÁCH NHÓM':'GIÁO VIÊN CHỦ NHIỆM'}</div><div class="signature-space">${sigSpaceHtml}</div><div class="fw-bold" style="font-size:8pt;">${escapeHtml(gvcnNameText)}</div></div>
              <div class="signature-box"><div class="signature-title">${bghSignatureTitleHtmlV7046495(bghResData)}</div><div class="signature-space" style="position:relative">${bghSigSpaceHtml}${stampHtmlV704649(bghResData)}</div><div class="fw-bold" style="font-size:8pt;">${escapeHtml(bghNameText)}</div></div>
            </div>
          </div>
        </div>`;
        resolve(fullPageHtml);
      })
      .withFailureHandler(function(err){console.error('Không tải được trang A3 tuần '+tuan,err);resolve('');})
      .layTrangSoDauBaiV24(lop,tuan,bookMode,getAnyAuthV6());
  });
}

/* HÀM HIỂN THỊ CHI TIẾT XÁC NHẬN ĐIỆN TỬ */
function xemChiTietChuKySo(teacherLookup, thoiGianKy) {
  if (!teacherLookup) return;

  const modalEl=document.getElementById('modalChuKySoDetail');
  google.script.run
    .withSuccessHandler(function(res) {
      if (res && res.success) {
        document.getElementById('certTenGV').innerText = res.tenGV || "---";
        document.getElementById('certEmail').innerText = res.email || "---";
        document.getElementById('certThoiGianKy').innerText = res.thoiGianKy || thoiGianKy || "Đã xác thực";
        let imgCert = document.getElementById('certSigImage');
        if (res.urlChuKy) {
          imgCert.src = normalizeSignatureUrlV67_1(res.urlChuKy);
          imgCert.classList.remove('d-none');
        } else {
          imgCert.removeAttribute('src');
          imgCert.classList.add('d-none');
        }
        if (window.bootstrap && bootstrap.Modal) {
          bootstrap.Modal.getOrCreateInstance(modalEl).show();
        } else {
          alertV13('Họ và tên: '+(res.tenGV||'---')+'\nEmail công vụ: '+(res.email||'---')+'\nThời gian ký: '+(res.thoiGianKy||thoiGianKy||'Đã xác thực'));
        }
      } else {
        alertV13("⚠️ " + ((res&&res.message) || "Không tìm thấy thông tin giáo viên."));
      }
    })
    .withFailureHandler(function(err){
      alertV13('⚠️ Không thể tải thông tin xác nhận điện tử. '+(err&&err.message?err.message:''));
    })
    .layChiTietChuKySo(teacherLookup, thoiGianKy);
}



/* ===== V70.4.6.36: Độ đậm chữ ký hiển thị / in ===== */
const SIGNATURE_INK_STORAGE_V704636='sodb_signature_ink_v704643';

function signatureInkParamsV704636(levelRaw){
  const level=Math.max(100,Math.min(150,Number(levelRaw)||100));
  const t=(level-100)/50;
  // 100% giữ gần mức cũ; 150% làm đậm rõ nhưng vẫn giữ chi tiết nét.
  const contrast=Math.round(100+(100*t));
  const brightness=(1-(0.12*t)).toFixed(3);
  return {level,contrast,brightness};
}

function apDungDoDamChuKyV704636(levelRaw,persist=true){
  const p=signatureInkParamsV704636(levelRaw);
  document.documentElement.style.setProperty('--sodb-signature-contrast-v704636',`${p.contrast}%`);
  document.documentElement.style.setProperty('--sodb-signature-brightness-v704636',p.brightness);
  const input=document.getElementById('gtSignatureDarknessV704636');
  const label=document.getElementById('gtSignatureDarknessValueV704636');
  if(input&&Number(input.value)!==p.level)input.value=String(p.level);
  if(label)label.textContent=`${p.level}%`;
  if(persist){
    try{localStorage.setItem(SIGNATURE_INK_STORAGE_V704636,String(p.level));}catch(_e){}
  }
  return p;
}

function capNhatDoDamChuKyV704636(value){
  apDungDoDamChuKyV704636(value,true);
}

function datLaiDoDamChuKyV704636(){
  apDungDoDamChuKyV704636(100,true);
}

function khoiTaoDoDamChuKyV704636(){
  let saved=100;
  try{
    const raw=localStorage.getItem(SIGNATURE_INK_STORAGE_V704636);
    if(raw!==null&&raw!=='')saved=Number(raw)||100;
  }catch(_e){}
  apDungDoDamChuKyV704636(saved,false);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',khoiTaoDoDamChuKyV704636,{once:true});
}else{
  khoiTaoDoDamChuKyV704636();
}

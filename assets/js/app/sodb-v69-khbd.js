  /* V70.4.6.30: ĐỐI SOÁT KHBD ĐÚNG CHIỀU KHBD LỚP -> SĐB THỰC TẾ */
  window.__KHBD_COMPARE_V704630__ = null;

  function getAdminCompareAuthV51(){
    const token=(adminDangNhapInfo&&adminDangNhapInfo.sessionToken)||(currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions&&currentUnifiedLoginV4.sessions.ADMIN&&currentUnifiedLoginV4.sessions.ADMIN.sessionToken)||'';
    return {token:token};
  }

  function napTuanDoiSoatKhbdV704630(){
    const sel=document.getElementById('gtCompareWeeks');
    if(!sel||sel.options.length)return;
    const frag=document.createDocumentFragment();
    for(let w=1;w<=53;w++)frag.appendChild(new Option('Tuần '+w,String(w)));
    sel.appendChild(frag);
  }
  function boChonTuanKhbdV704630(){
    const sel=document.getElementById('gtCompareWeeks');if(!sel)return;
    Array.from(sel.options).forEach(o=>o.selected=false);
  }
  function layTuanDoiSoatKhbdV704630(){
    const sel=document.getElementById('gtCompareWeeks');
    return sel?Array.from(sel.selectedOptions).map(o=>Number(o.value)).filter(Boolean):[];
  }

  function loadDanhSachMonKHBDGiamThi() {
    napTuanDoiSoatKhbdV704630();
    google.script.run.withSuccessHandler(function(dsMon) {
      let selectMon = document.getElementById('gtCompareMon');
      selectMon.replaceChildren(new Option('-- Chọn Môn học --',''));
      if (dsMon && dsMon.length > 0) dsMon.forEach(m => selectMon.add(new Option(m, m)));
      else selectMon.replaceChildren(new Option('-- Chưa có Kế hoạch bài dạy --',''));
    }).getDanhSachMonKHBD(getAdminCompareAuthV51());
  }

  function loadDanhSachGVTheoMonGiamThi() {
    let mon = document.getElementById('gtCompareMon').value;
    let selectGV = document.getElementById('gtCompareGV');
    selectGV.replaceChildren(new Option('-- Đang tải danh sách GV... --',''));
    if (!mon) return;
    google.script.run.withSuccessHandler(function(dsGV) {
      selectGV.replaceChildren(new Option('Tất cả Giáo viên dạy môn ' + String(mon||''), 'ALL_GV'));
      if (dsGV && dsGV.length > 0) dsGV.forEach(gv => selectGV.add(new Option(gv.tenGV, gv.tenGV)));
    }).getDanhSachGVTheoMon(mon, getAdminCompareAuthV51());
  }

  function badgeKhbdCompareV704630(type){
    if(type==='NOT_DONE')return 'bg-secondary';
    if(type==='WARNING_PPCT')return 'bg-danger';
    if(type==='WARNING_MISMATCH'||type==='ACTUAL_ONLY')return 'bg-warning text-dark';
    if(type==='DAY_THAY')return 'bg-warning text-dark';
    if(type==='DAY_BU')return 'bg-success';
    if(type==='HOAN_DOI')return 'bg-primary';
    return 'bg-success';
  }

  // V70.4.6.34: các tiện ích chỉ phục vụ xem/kiểm tra, KHÔNG thay đổi Tiết CT khi nhập SĐB.
  function thongKeDoiSoatKhbdV704634(rows){
    const all=Array.isArray(rows)?rows:[];
    const assigned=all.filter(x=>String(x.statusType||'')!=='ACTUAL_ONLY');
    const notDone=assigned.filter(x=>String(x.statusType||'')==='NOT_DONE').length;
    const done=assigned.length-notDone;
    const mismatch=all.filter(x=>['WARNING_PPCT','WARNING_MISMATCH','ACTUAL_ONLY'].includes(String(x.statusType||''))).length;
    const substitute=all.filter(x=>String(x.statusType||'')==='DAY_THAY').length;
    return {assigned:assigned.length,done,notDone,mismatch,substitute};
  }

  function renderTongHopDoiSoatKhbdV704634(rows){
    const host=document.getElementById('gtCompareSummaryV704634');if(!host)return;
    const s=thongKeDoiSoatKhbdV704634(rows);
    const cards=[
      ['KHBD được giao',s.assigned,'primary','ALL'],
      ['Đã thực hiện',s.done,'success','DONE'],
      ['Chưa thực hiện',s.notDone,'secondary','NOT_DONE'],
      ['Chênh lệch',s.mismatch,'danger','WARNING'],
      ['Dạy thay',s.substitute,'warning','DAY_THAY']
    ];
    host.innerHTML=cards.map(([label,value,color,filter])=>`<div class="col-6 col-md"><button type="button" class="card border-0 shadow-sm w-100 text-start h-100" onclick="locDoiSoatKhbdV704634('${filter}',null)" style="min-height:82px;"><div class="card-body py-2"><div class="small text-muted fw-semibold">${escapeHtml(label)}</div><div class="fs-4 fw-bold text-${color}">${Number(value||0).toLocaleString('vi-VN')}</div></div></button></div>`).join('');
  }

  function khbdCompareMatchFilterV704634(item,filter){
    const t=String(item?.statusType||'');
    if(filter==='NOT_DONE')return t==='NOT_DONE';
    if(filter==='WARNING')return ['WARNING_PPCT','WARNING_MISMATCH','ACTUAL_ONLY'].includes(t);
    if(filter==='DAY_THAY')return t==='DAY_THAY';
    if(filter==='DONE')return t!=='NOT_DONE'&&t!=='ACTUAL_ONLY';
    return true;
  }

  function khbdCompareStatusTextV704634(item){
    const t=String(item?.statusType||''),ppct=String(item?.ppct||'—'),actual=String(item?.tietCT||'—');
    if(t==='WARNING_PPCT')return `⚠️ PPCT: KHBD ${ppct} → SĐB ${actual}`;
    if(t==='WARNING_MISMATCH'&&ppct!=='—'&&actual!=='—'&&ppct!==actual)
      return `⚠️ PPCT: KHBD ${ppct} → SĐB ${actual}; khác nội dung KHBD`;
    return String(item?.trangThaiAlert||'');
  }

  function renderBangDoiSoatKhbdV704634(filter){
    const state=window.__KHBD_COMPARE_V704630__,tbody=document.getElementById('gtCompareTableBody');
    if(!tbody||!state?.res)return;
    const rows=(state.res.results||[]).filter(x=>khbdCompareMatchFilterV704634(x,filter||'ALL'));
    tbody.innerHTML='';
    if(!rows.length){
      tbody.innerHTML='<tr><td colspan="13" class="py-4 text-muted fw-semibold">Không có dòng nào thuộc trạng thái đang lọc.</td></tr>';
    }else{
      rows.forEach(item=>{
        const badgeBg=badgeKhbdCompareV704630(item.statusType);
        const slot=item.ngayDay?`<span class="badge ${item.buoi === 'Sáng' ? 'bg-primary' : 'bg-danger'}">${escapeHtml(item.buoi||'')}</span> ${item.tiet?('Tiết '+escapeHtml(item.tiet)):'—'}`:'—';
        const idx=state.res.results.indexOf(item);
        const openBtn=item.recordId?`<button type="button" class="btn btn-outline-primary btn-sm py-1 px-2" onclick="moTietSodbTuDoiSoatV704634(${idx})">Xem tiết</button>`:'—';
        tbody.insertAdjacentHTML('beforeend',`<tr>
          <td class="fw-bold">${escapeHtml(item.tuan||'')}</td>
          <td class="fw-bold text-success fs-6">${escapeHtml(item.ppct||'—')}</td>
          <td class="fw-bold">${escapeHtml(item.ngayFormatted||'—')}</td>
          <td class="fw-bold text-primary">${escapeHtml(item.lop||'')}</td>
          <td>${slot}</td>
          <td>${escapeHtml(item.tietCT||'—')}</td>
          <td class="text-start bg-light">${escapeHtml(item.tenBaiChuan||'—')}</td>
          <td class="text-start">${escapeHtml(item.tenBaiThucTe||'—')}</td>
          <td class="text-start small">${escapeHtml(item.yeuCauCanDat||'')}</td>
          <td><span class="badge ${badgeBg} p-2 text-wrap" style="font-size:0.75rem;">${escapeHtml(khbdCompareStatusTextV704634(item))}</span></td>
          <td class="text-start">${escapeHtml(item.gvKhbd||'')}</td>
          <td class="text-start"><b>${escapeHtml(item.tenGV||'')}</b></td>
          <td>${openBtn}</td>
        </tr>`);
      });
    }
    const counter=document.getElementById('gtCompareFilterCountV704634');
    if(counter)counter.textContent=`Đang hiển thị ${rows.length}/${state.res.results?.length||0} dòng`;
    state.filter=filter||'ALL';
  }

  function locDoiSoatKhbdV704634(filter,btn){
    const f=filter||'ALL';
    document.querySelectorAll('.gt-compare-filter-v704634').forEach(b=>{
      const active=String(b.dataset.khbdFilter||'')===f;
      b.classList.toggle('btn-primary',active);
      b.classList.toggle('btn-outline-secondary',!active&&String(b.dataset.khbdFilter||'')==='NOT_DONE');
      b.classList.toggle('btn-outline-danger',!active&&String(b.dataset.khbdFilter||'')==='WARNING');
      b.classList.toggle('btn-outline-warning',!active&&String(b.dataset.khbdFilter||'')==='DAY_THAY');
      if(!active&&String(b.dataset.khbdFilter||'')==='ALL')b.classList.add('btn-outline-primary');
      else b.classList.toggle('btn-outline-primary',false);
    });
    renderBangDoiSoatKhbdV704634(f);
  }

  async function moTietSodbTuDoiSoatV704634(index){
    const state=window.__KHBD_COMPARE_V704630__,item=state?.res?.results?.[Number(index)];
    if(!item?.recordId){showToastV9('Dòng này chưa có tiết SĐB để mở.','warning');return;}
    const lop=String(item.lop||'').trim(),tuan=Number(item.tuan||0);
    try{
      const grade=String((String(lop).match(/^(10|11|12)/)||[])[1]||item.khoi||'');
      const gradeEl=document.getElementById('viewKhoi'),weekEl=document.getElementById('viewTuan'),classEl=document.getElementById('viewLop');
      if(gradeEl&&grade){gradeEl.value=grade;try{chonKhoiLopView();}catch(_e){}}
      if(classEl){
        let opt=[...classEl.options].find(o=>String(o.value).trim()===lop);
        if(!opt){classEl.add(new Option(lop,lop));opt=[...classEl.options].find(o=>String(o.value).trim()===lop);}
        if(opt)classEl.value=opt.value;
      }
      if(weekEl&&tuan)weekEl.value=String(tuan);
      try{if(typeof capNhatLoaiSoViewV24==='function')capNhatLoaiSoViewV24();}catch(_e){}
      if(typeof openTopTabV9==='function')openTopTabV9('view-tab');else document.getElementById('view-tab')?.click();
      await Promise.resolve(typeof traCuuSoDauBaiTuanGop==='function'?traCuuSoDauBaiTuanGop(true):null);
      setTimeout(()=>{
        const d=new Date(String(item.ngayDay||'')+'T00:00:00');
        const dayNames=['Chủ Nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
        const day=dayNames[d.getDay()]||'',session=String(item.buoi||'Sáng')==='Chiều'?'Chieu':'Sang';
        const key=`${day}_${session}_${Number(item.tiet||0)}`;
        const target=document.querySelector(`[data-cell="${key}"]`);
        if(target){target.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});target.click();}
        else showToastV9(`Đã mở sổ ${lop} · Tuần ${tuan}. Tiết cần xem: ${item.ngayFormatted||item.ngayDay} · ${item.buoi||''} · Tiết ${item.tiet||''}.`,'info');
      },250);
    }catch(e){showToastV9(e?.message||String(e),'danger');}
  }

  function thucHienDoiSoatKHBDGiamThi() {
    const mon = document.getElementById('gtCompareMon').value;
    const tenGV = document.getElementById('gtCompareGV').value;
    const lop = document.getElementById('gtCompareLop').value;
    const weeks = layTuanDoiSoatKhbdV704630();

    if (!mon || !tenGV) {
      showToastV9('Vui lòng chọn Môn học và Giáo viên/Tất cả giáo viên cần kiểm tra.','danger');
      return;
    }

    const tbody = document.getElementById('gtCompareTableBody');
    tbody.innerHTML = `<tr><td colspan="12" class="py-3 text-center">⏳ Đang lấy KHBD đã chọn của lớp và đối chiếu với Sổ đầu bài...</td></tr>`;
    document.getElementById('gtCompareResultSection').classList.remove('d-none');
    document.getElementById('gtComparePlaceholder').classList.add('d-none');

    google.script.run.withSuccessHandler(function(res) {
      if (!res || !res.success) {
        alertV13("❌ Lỗi đối soát: " + (res ? res.message : "Không phản hồi"));
        return;
      }
      window.__KHBD_COMPARE_V704630__={res,mon,tenGV,lop,weeks};

      document.getElementById('gtCompareCountMsg').innerText =
        `KHBD/đối soát: ${res.totalCount||0} dòng | ✅ Khớp/đã thực hiện: ${res.matchedCount||0} | ⏳ Chưa thực hiện: ${res.notDoneCount||0} | ⚠️ Chênh lệch: ${res.warningCount||0}`;

      if (!res.results || res.results.length === 0) {
        document.getElementById('gtCompareSummaryV704634').innerHTML='';
        tbody.innerHTML = `<tr><td colspan="13" class="py-4 text-warning fw-bold">⚠️ Không có KHBD đã được giáo viên chọn cho phạm vi đang kiểm tra.</td></tr>`;
        return;
      }
      renderTongHopDoiSoatKhbdV704634(res.results);
      locDoiSoatKhbdV704634('ALL',null);
    }).doiSoatKHBDGiamThi(mon, tenGV, lop, weeks, getAdminCompareAuthV51());
  }

  function xuatExcelDoiSoatGiamThi() {
    if (retryWithXlsxV7(() => xuatExcelDoiSoatGiamThi())) return;
    const state=window.__KHBD_COMPARE_V704630__;
    if(!state||!state.res||!Array.isArray(state.res.results)){
      showToastV9('Vui lòng chạy kiểm tra KHBD trước khi xuất Excel.','warning');return;
    }
    const r=state.res,rows=r.results;
    const weeks=state.weeks&&state.weeks.length?state.weeks.join(', '):'Tất cả';
    const summary=[
      ['TRƯỜNG THPT HỒ THỊ BI - HỒ SƠ ĐỐI SOÁT KHBD'],
      ['Môn',state.mon||''],
      ['Lớp',state.lop||'Tất cả lớp'],
      ['Giáo viên KHBD',state.tenGV==='ALL_GV'?'Tất cả giáo viên':state.tenGV],
      ['Tuần',weeks],
      ['Tổng dòng KHBD/đối soát',r.totalCount||0],
      ['Khớp/đã thực hiện',r.matchedCount||0],
      ['Chưa thực hiện',r.notDoneCount||0],
      ['Chênh lệch',r.warningCount||0],
      ['Nguyên tắc PPCT',r.ppctPolicy||'KHBD_PPCT_NATURAL_ASC']
    ];
    const detail=[['Tuần','PPCT KHBD','Ngày thực hiện','Lớp','Buổi','Tiết','Tiết CT trong SĐB','Nội dung KHBD','Nội dung thực tế','Yêu cầu cần đạt','Đánh giá','GV KHBD','GV thực dạy']];
    rows.forEach(x=>detail.push([x.tuan||'',x.ppct||'',x.ngayFormatted||'',x.lop||'',x.buoi||'',x.tiet||'',x.tietCT||'',x.tenBaiChuan||'',x.tenBaiThucTe||'',x.yeuCauCanDat||'',x.trangThaiAlert||'',x.gvKhbd||'',x.tenGV||'']));
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(summary),'TongHop');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(detail),'KHBD_DoiSoat');
    const clean=v=>String(v||'Tat_ca').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
    const weekPart=state.weeks&&state.weeks.length?('Tuan_'+state.weeks.join('-')):'Tat_ca_tuan';
    XLSX.writeFile(wb,`KHBD_${clean(state.lop||'Tat_ca_lop')}_${clean(state.mon)}_${weekPart}.xlsx`);
  }

  /* HÀM TỰ ĐỘNG XÓA NỀN TRẮNG CỦA ẢNH CHỮ KÝ */
  function xoaNenAnhChuKy(imgElement, callback) {
    let img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgElement.src;
    img.onload = function() {
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        if (r > 190 && g > 190 && b > 190) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      let processedBase64 = canvas.toDataURL("image/png");
      callback(processedBase64);
    };
  }
// 1. HÀM TỰ ĐỘNG LỌC BẢNG LỚP THEO KHỐI KHI CHỌN KHỐI TẠI SUB-TAB NHẬP TRỄ
function capNhatDanhSachLopLateGiamThi() {
  let khoi = document.getElementById('gtLateKhoi').value;
  let selectLopLate = document.getElementById('gtLateLop');
  selectLopLate.innerHTML = '<option value="">-- Tất cả các Lớp --</option>';

  if (khoi && dsLopTheoKhoi[khoi]) {
    dsLopTheoKhoi[khoi].forEach(l => {
      selectLopLate.add(new Option(l, l));
    });
  } else {
    // Nếu chọn "Tất cả Khối" thì load toàn bộ lớp
    Object.keys(dsLopTheoKhoi).forEach(k => {
      dsLopTheoKhoi[k].forEach(l => {
        selectLopLate.add(new Option(l, l));
      });
    });
  }
}

// 2. CẬP NHẬT HÀM THỰC HIỆN KIỂM TRA (LỌC THEO KHỐI VÀ LỚP, BỎ LỌC TÊN GV)
function thucHienKiemTraNhapTreGiamThi() {
  let tuNgay = document.getElementById('gtLateTuNgay').value;
  let denNgay = document.getElementById('gtLateDenNgay').value;
  let khoiSelect = document.getElementById('gtLateKhoi').value;
  let lopSelect = document.getElementById('gtLateLop').value;

  if (!tuNgay) {
    showToastV9('Vui lòng chọn khoảng thời gian cần kiểm tra.','danger');
    return;
  }

  let tbody = document.getElementById('gtLateTableBody');
  tbody.innerHTML = `<tr><td colspan="9" class="py-3 text-center">⏳ Hệ thống đang đối soát thời gian bấm lưu và ngày dạy...</td></tr>`;
  document.getElementById('gtLateResultSection').classList.remove('d-none');
  document.getElementById('gtLatePlaceholder').classList.add('d-none');

  // Truyền "" ở tham số tenGVFilter
  google.script.run.withSuccessHandler(function(res) {
    if (!res || !res.success) {
      alertV13("❌ Lỗi kiểm tra: " + (res ? res.message : "Không phản hồi"));
      return;
    }

    // Lọc thêm theo Khối nếu người dùng chọn Khối nhưng không chọn Lớp cụ thể
    let finalResults = res.results;
    if (khoiSelect && !lopSelect) {
      finalResults = finalResults.filter(item => {
        let match = item.lop.match(/^\d+/);
        return match && match[0] === khoiSelect;
      });
    }

    let lateCount = finalResults.filter(i => i.isLate).length;

    document.getElementById('gtLateCountMsg').innerText = `📊 TÌM THẤY ${finalResults.length} TIẾT HỌC | 🚨 PHÁT HIỆN ${lateCount} TIẾT NHẬP TRỄ SAU NGÀY DẠY`;
    tbody.innerHTML = "";

    if (finalResults.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="py-4 text-warning fw-bold fs-6">⚠️ Không tìm thấy tiết học nào phù hợp với Khối / Lớp đã chọn!</td></tr>`;
      return;
    }

    finalResults.forEach(item => {
      let badgeBg = item.isLate ? "bg-danger" : "bg-success";
      tbody.innerHTML += `<tr>
        <td class="fw-bold">${escapeHtml(item.ngayDayFormatted)}</td>
        <td class="small text-muted">${escapeHtml(item.timeSubmitFormatted)}</td>
        <td class="fw-bold text-primary fs-6">${escapeHtml(item.lop)}</td>
        <td><span class="badge ${item.buoi === 'Sáng' ? 'bg-primary' : 'bg-danger'}">${escapeHtml(item.buoi)}</span> Tiết ${escapeHtml(item.tiet)}</td>
        <td class="fw-semibold text-start">${escapeHtml(item.mon)} ${item.isTietTron ? '<span class="badge bg-warning text-dark">Tiết trộn</span>' : ''}</td>
        <td class="fw-bold text-success">${escapeHtml(item.tietCT)}</td>
        <td class="text-start">${escapeHtml(item.tenBai)}</td>
        <td><span class="badge ${badgeBg} p-2" style="font-size:0.75rem;">${escapeHtml(item.trangThai)}</span></td>
        <td class="text-start"><b>${escapeHtml(item.tenGV)}</b></td>
      </tr>`;
    });
  }).kiemTraNhapTreGiamThi(tuNgay, denNgay, "", lopSelect, {token: giamThiDangNhapInfo ? giamThiDangNhapInfo.sessionToken : ""});
}

function xuatExcelNhapTreGiamThi() {
  if (retryWithXlsxV7(() => xuatExcelNhapTreGiamThi())) return;
  let table = document.getElementById("gtLateTableExcel");
  let wb = XLSX.utils.table_to_book(table, { sheet: "NhatKy_NhapTre" });
  XLSX.writeFile(wb, `BaoCao_TietHoc_NhapTre.xlsx`);
}
  /* XỬ LÝ PHÍM ENTER */
  function xuLyEnterKey(event, actionFunction) {
    if (event.key === "Enter" || event.keyCode === 13) {
      event.preventDefault();
      actionFunction();
    }
  }

  function capNhatLoaiSoViewV24(){
    const lop=document.getElementById('viewLop')?.value||'';
    const sel=document.getElementById('viewBookMode');
    if(!sel)return;
    let specialOpt=[...sel.options].find(o=>o.value==='CHUYEN_DE');
    if(!specialOpt){
      specialOpt=new Option('Sổ đầu bài Chuyên đề','CHUYEN_DE');
      sel.add(specialOpt);
    }
    const type=loaiSoTheoLopV22(lop);
    const special=type==='CHUYEN_DE',gdtc=type==='GDTC';
    specialOpt.hidden=!special;
    sel.disabled=special||gdtc;
    if(special)sel.value='CHUYEN_DE';
    else if(gdtc)sel.value='GDTC';
    else if(sel.value==='CHUYEN_DE')sel.value='LOP_CHINH';
  }


  let classCatalogRefreshingV29=false;
  function refreshClassCatalogV29(force){
    if(force!==true && !bootstrapLoadedV6){taiBootstrapV6();return;}
    if(force!==true && Date.now()-classCatalogLoadedAtV47<CLASS_CATALOG_REFRESH_MS_V47)return;
    if(classCatalogRefreshingV29)return;
    classCatalogRefreshingV29=true;
    const oldViewLop=document.getElementById('viewLop')?.value||'';
    const oldInputLop=document.getElementById('lop')?.value||'';
    google.script.run
      .withSuccessHandler(function(res){
        classCatalogRefreshingV29=false;
        if(!res||!res.success)return;
        classCatalogLoadedAtV47=Date.now();
        applyClassCatalogV23(res);

        const restore=(id,value)=>{
          const el=document.getElementById(id);
          if(el&&value&&[...el.options].some(o=>o.value===value))el.value=value;
        };
        restore('viewLop',oldViewLop);
        restore('lop',oldInputLop);
        capNhatLoaiSoViewV24();
        onInputClassChangedV26();
      })
      .withFailureHandler(function(){classCatalogRefreshingV29=false;})
      .getDanhSachLopMoiV29(force===true);
  }

  function chonKhoiLopView() {
    const khoi=document.getElementById('viewKhoi').value;
    napLopVaoSelectV22(document.getElementById('viewLop'),khoi,true);
    capNhatLoaiSoViewV24();
  }

  function chonKhoiLopInput() {
    const khoi=document.getElementById('khoi').value;
    const lopSel=document.getElementById('lop');
    const isSub=!!document.getElementById('isDayThayV683')?.checked;
    const bulkAll=!!(bulkWeekUnlockStateV685.active&&bulkWeekUnlockStateV685.allowAllClasses&&Number(document.getElementById('tuanHoc')?.value||0)===Number(bulkWeekUnlockStateV685.week||0));
    if(isSub){
      napLopVaoSelectV22(lopSel,khoi,true);
      const note=document.getElementById('phanCongDayNoteV39');if(note){note.textContent='Chế độ dạy thay: được chọn lớp ngoài phân công thường xuyên; môn học vẫn phải thuộc chuyên môn của tài khoản đang đăng nhập.';note.className='small text-warning fw-semibold mb-2';}
    }else if(bulkAll){
      napLopVaoSelectV22(lopSel,khoi,true);
      const note=document.getElementById('phanCongDayNoteV39');if(note){note.textContent=`Admin đang mở khóa Tuần ${bulkWeekUnlockStateV685.fromWeek}–${bulkWeekUnlockStateV685.toWeek}: được chọn toàn bộ lớp; không đối chiếu lớp theo phân công hiện tại.`;note.className='small text-success fw-bold mb-2';}
    }else if(gvbmDangNhapInfo){
      const subject=document.getElementById('monHoc')?.value||'';
      napLopPhanCongV39(lopSel,khoi,subject);
      renderAssignmentNoteV39(subject,getAssignedClassesForSubjectV39(subject));
    }else napLopVaoSelectV22(lopSel,khoi,true);
    onInputClassChangedV26();capNhatHanNhapTietV683();
  }


  function chonKhoiLopAdmin() {
    const khoi=document.getElementById('adminKhoi').value;
    napLopVaoSelectV22(document.getElementById('adminLop'),khoi,true);
  }

  function normalizeTextKey(value) {
    return (value === null || value === undefined ? "" : String(value))
      .trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function escapeHtml(value) {
    return (value === null || value === undefined ? "" : String(value))
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function parseFlexibleDate(value) {
    if (!value && value !== 0) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return new Date(value.getTime());
    if (typeof value === "number" && window.XLSX && XLSX.SSF) {
      let parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
    let text = String(value).trim();
    let match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (match) {
      let year = Number(match[3]);
      if (year < 100) year += 2000;
      let first = Number(match[1]);
      let second = Number(match[2]);
      let day = first;
      let month = second;
      if (second > 12 && first <= 12) { month = first; day = second; }
      let parsed = new Date(year, month - 1, day);
      return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day ? parsed : null;
    }
    match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) {
      let year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
      let parsed = new Date(year, month - 1, day);
      return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day ? parsed : null;
    }
    let fallback = new Date(text);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  function formatDateVN(value) {
    let date = parseFlexibleDate(value);
    if (!date) return "";
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  }

  function formatDateIsoV658(value) {
    let date = parseFlexibleDate(value);
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function getWeekRangeClient(weekValue) {
    let week = Number(weekValue);
    if (!week || week < 1) return { from: "", to: "" };
    let parts = START_DATE_WEEK1_STR.split("-");
    let from = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    from.setDate(from.getDate() + (week - 1) * 7);
    let to = new Date(from.getTime());
    to.setDate(to.getDate() + 6);
    // V68.5.8: dữ liệu gửi Supabase phải là ISO yyyy-MM-dd, không phải dd/MM/yyyy.
    return { from: formatDateIsoV658(from), to: formatDateIsoV658(to) };
  }

  function calculateWeekClient(dateValue) {
    let date = parseFlexibleDate(dateValue);
    let start = parseFlexibleDate(START_DATE_WEEK1_STR);
    if (!date || !start) return "";
    date.setHours(12, 0, 0, 0);
    start.setHours(12, 0, 0, 0);
    return Math.max(1, Math.floor((date - start) / 604800000) + 1);
  }

  /* V68.5.8: FILE WORD/EXCEL KHBD + chuẩn hóa ngày ISO khi upload */
  const KHBD_WORD_UPLOAD_TEMPLATE_BASE64_V656 = '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';
  function taiFileMauWordUploadKHBDV656(){
    try{
      const binary=atob(KHBD_WORD_UPLOAD_TEMPLATE_BASE64_V656);
      const bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='Mau_KHBD_Upload_TheoKhoi_Mon_Tuan.docx';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
      showToastV9('Đã tải mẫu Word 6 cột để nhập KHBD lên hệ thống.','success');
    }catch(err){
      console.error('[KHBD WORD UPLOAD V68.5.8]',err);
      alertV13('❌ Không tạo được file mẫu Word upload: '+(err&&err.message?err.message:err));
    }
  }

  /* V68.5.4: TẢI FILE MẪU WORD KHBD - NHÚNG SẴN TRONG INDEX.HTML */

  /* HÀM TẢI FILE MẪU EXCEL KHBD */
  function taiFileMauKHBD() {
  if (retryWithXlsxV7(() => taiFileMauKHBD())) return;
  let sampleData = [
    ["Khối", "Môn học", "Tuần", "Tiết PPCT", "Nội dung bài dạy", "Yêu cầu cần đạt"],
    [10, "Toán", 1, 1, "Bài 1: Mệnh đề", "Nhận biết và vận dụng được khái niệm mệnh đề"],
    [10, "Toán", 1, 2, "Bài 2: Tập hợp", "Thực hiện được các phép toán cơ bản trên tập hợp"],
    [10, "Toán", 2, 3, "Bài 3: Các tập hợp số", "Mô tả và biểu diễn được các tập hợp số"]
  ];

  let ws = XLSX.utils.aoa_to_sheet(sampleData);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KeHoachBaiDay");
  ws['!cols'] = [
    { wch: 8 }, { wch: 18 }, { wch: 8 }, { wch: 12 }, { wch: 45 }, { wch: 60 }
  ];

  let guide = XLSX.utils.aoa_to_sheet([
    ["HƯỚNG DẪN"],
    ["Mỗi lần tải lên chọn một Khối và một Môn trên giao diện."],
    ["File chỉ cần khai báo Tuần; không cần cột Từ ngày/Đến ngày."],
    ["Tuần 1 bắt đầu ngày 17/08/2026; các tuần sau tự tăng mỗi 7 ngày."],
    ["Tiết PPCT có thể để trống nhưng nên nhập để thuận tiện đối soát tiến độ."],
    ["Có thể có nhiều dòng bài dạy trong cùng một tuần."]
  ]);
  guide['!cols'] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, guide, "HuongDan");

  XLSX.writeFile(wb, "FileMau_KeHoachBaiDay_TheoKhoi_Mon_Tuan.xlsx");
}

  /* V68.5.8: CHỌN FILE EXCEL HOẶC WORD */
  function docFileKHBDV656(event){
    const file=event&&event.target&&event.target.files?event.target.files[0]:null;
    if(!file)return;
    if(/\.docx$/i.test(file.name||'')){
      docFileWordKHBDV656(event);
      return;
    }
    docFileExcelKHBD(event);
  }

  function khbdCellTextFromDocxV656(cell,NS){
    const paragraphs=[...cell.getElementsByTagNameNS(NS,'p')];
    return paragraphs.map(p=>[...p.getElementsByTagNameNS(NS,'t')].map(t=>t.textContent||'').join('')).join(' ').replace(/\s+/g,' ').trim();
  }

  function xuLyRawKhbdWordV656(rawJson,inputEl){
    let scopeKhoi=document.getElementById('khbdUploadKhoi').value;
    let scopeMon=canonicalSubjectV6955(document.getElementById('khbdUploadMon').value);
    parsedKHBDData=[];
    const tbody=document.getElementById('khbdPreviewTableBody');
    tbody.innerHTML='';
    document.getElementById('khbdPreviewArea').classList.add('d-none');
    if(!rawJson||rawJson.length<2)throw new Error('File Word không có dòng dữ liệu.');

    const normalizedHeader=(rawJson[0]||[]).map(normalizeTextKey);
    const findColumn=(...aliases)=>normalizedHeader.findIndex(item=>aliases.map(normalizeTextKey).includes(item));
    const layout={
      khoi:findColumn('Khối','Khoi'),
      mon:findColumn('Môn học','Môn','Mon hoc'),
      tuan:findColumn('Tuần','Tuan','Tuần học'),
      tiet:findColumn('Tiết PPCT','Tiết CT','PPCT'),
      bai:findColumn('Nội dung bài dạy','Tên bài dạy','Tên bài','Nội dung'),
      yeuCau:findColumn('Yêu cầu cần đạt','YCCĐ','YCCD','Yêu cầu')
    };
    if(layout.khoi<0||layout.mon<0||layout.tuan<0||layout.bai<0||layout.yeuCau<0){
      throw new Error('Bảng Word phải giữ nguyên các cột: Khối, Môn học, Tuần, Tiết PPCT, Nội dung bài dạy, Yêu cầu cần đạt.');
    }

    const errors=[];
    for(let i=1;i<rawJson.length;i++){
      const row=rawJson[i]||[];
      if(row.every(v=>v===''||v===null||v===undefined))continue;
      const khoi=String(row[layout.khoi]||scopeKhoi).trim().match(/\d+/)?.[0]||'';
      const mon=canonicalSubjectV6955(row[layout.mon]||scopeMon);
      const weekMatch=String(row[layout.tuan]||'').match(/\d+/);
      const tuan=weekMatch?Number(weekMatch[0]):'';
      const tiet=layout.tiet>=0?String(row[layout.tiet]||'').trim():'';
      const bai=String(row[layout.bai]||'').trim();
      const yeuCau=String(row[layout.yeuCau]||'').trim();
      const range=tuan?getWeekRangeClient(tuan):{from:'',to:''};
      const rowNumber=i+1;
      if(khoi!==scopeKhoi)errors.push(`Dòng ${rowNumber}: Khối ${khoi||'trống'} khác Khối ${scopeKhoi}.`);
      if(subjectKeyV6955(mon)!==subjectKeyV6955(scopeMon))errors.push(`Dòng ${rowNumber}: Môn '${mon||'trống'}' khác '${scopeMon}'.`);
      if(!tuan||tuan<1||tuan>52)errors.push(`Dòng ${rowNumber}: Tuần không hợp lệ.`);
      if(!bai)errors.push(`Dòng ${rowNumber}: Thiếu Nội dung bài dạy.`);
      if(!yeuCau)errors.push(`Dòng ${rowNumber}: Thiếu Yêu cầu cần đạt.`);
      if(!errors.some(m=>m.startsWith(`Dòng ${rowNumber}:`))){
        parsedKHBDData.push([khoi,mon,tuan,range.from,range.to,tiet,bai,yeuCau]);
      }
    }
    if(errors.length){
      parsedKHBDData=[];
      throw new Error('File Word chưa hợp lệ:\n'+errors.slice(0,12).join('\n')+(errors.length>12?`\n... và ${errors.length-12} lỗi khác.`:''));
    }
    if(!parsedKHBDData.length)throw new Error('Không tìm thấy dòng kế hoạch hợp lệ trong file Word.');

    parsedKHBDData.forEach((row,index)=>{
      tbody.innerHTML+=`<tr><td>${index+1}</td><td class="fw-bold">${escapeHtml(row[0])}</td><td class="fw-bold text-primary">${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[5])}</td><td class="text-start">${escapeHtml(row[6])}</td><td class="text-start">${escapeHtml(row[7])}</td></tr>`;
    });
    document.getElementById('khbdPreviewArea').classList.remove('d-none');
    document.getElementById('khbdPreviewCount').innerText=`📄 ${parsedKHBDData.length} dòng từ Word — Khối ${scopeKhoi} — ${scopeMon}`;
  }

  async function docFileWordKHBDV656(event){
    const input=event&&event.target;
    const file=input&&input.files?input.files[0]:null;
    if(!file)return;
    const scopeKhoi=document.getElementById('khbdUploadKhoi').value;
    const scopeMon=canonicalSubjectV6955(document.getElementById('khbdUploadMon').value);
    if(!scopeKhoi||!scopeMon){
      showToastV9('Hãy chọn Khối và Môn học trước khi chọn file Word.','danger');
      input.value='';return;
    }
    try{
      await ensureJsZipV656();
      const zip=await JSZip.loadAsync(await file.arrayBuffer());
      const docEntry=zip.file('word/document.xml');
      if(!docEntry)throw new Error('Không tìm thấy nội dung Word. Hãy dùng file .docx đúng mẫu.');
      const xml=await docEntry.async('string');
      const docXml=new DOMParser().parseFromString(xml,'application/xml');
      if(docXml.getElementsByTagName('parsererror').length)throw new Error('Không đọc được cấu trúc file Word.');
      const NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
      const tables=[...docXml.getElementsByTagNameNS(NS,'tbl')];
      if(!tables.length)throw new Error('File Word không có bảng KHBD.');
      const rows=[...tables[0].getElementsByTagNameNS(NS,'tr')].map(tr=>
        [...tr.getElementsByTagNameNS(NS,'tc')].map(tc=>khbdCellTextFromDocxV656(tc,NS))
      );
      xuLyRawKhbdWordV656(rows,input);
    }catch(err){
      parsedKHBDData=[];
      if(input)input.value='';
      document.getElementById('khbdPreviewArea')?.classList.add('d-none');
      alertV13('❌ '+(err&&err.message?err.message:err));
    }
  }

  /* XỬ LÝ ĐỌC FILE EXCEL KẾ HOẠCH BÀI DẠY */
  function docFileExcelKHBD(event) {
  if (!window.XLSX) { const input = event && event.target; ensureXlsxV7().then(() => docFileExcelKHBD({target: input})).catch(err => alertV13('❌ ' + (err.message || err))); return; }
    let file = event.target.files[0];
    if (!file) return;

    let scopeKhoi = document.getElementById('khbdUploadKhoi').value;
    let scopeMon = canonicalSubjectV6955(document.getElementById('khbdUploadMon').value);
    if (!scopeKhoi || !scopeMon) {
      showToastV9('Hãy chọn Khối và nhập Môn học trước khi chọn file.','danger');
      event.target.value = "";
      return;
    }

    let reader = new FileReader();
    reader.onload = function(e) {
      try {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, { type: 'array', cellDates: true });
        let worksheet = workbook.Sheets[workbook.SheetNames[0]];
        let rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: true });
        parsedKHBDData = [];
        let tbody = document.getElementById('khbdPreviewTableBody');
        tbody.innerHTML = '';
        document.getElementById('khbdPreviewArea').classList.add('d-none');

        if (!rawJson || rawJson.length < 2) throw new Error("File không có dòng dữ liệu.");

        let normalizedHeader = rawJson[0].map(normalizeTextKey);
        let findColumn = (...aliases) => normalizedHeader.findIndex(item => aliases.map(normalizeTextKey).includes(item));
        let layout = {
          khoi: findColumn("Khối", "Khoi"),
          mon: findColumn("Môn học", "Môn", "Mon hoc"),
          tuan: findColumn("Tuần", "Tuan", "Tuần học"),
          tiet: findColumn("Tiết PPCT", "Tiết CT", "PPCT"),
          bai: findColumn("Nội dung bài dạy", "Tên bài dạy", "Tên bài", "Nội dung"),
          yeuCau: findColumn("Yêu cầu cần đạt", "YCCĐ", "YCCD", "Yêu cầu")
        };
        if (layout.khoi < 0 || layout.mon < 0 || layout.tuan < 0 || layout.bai < 0 || layout.yeuCau < 0) {
          throw new Error("Thiếu cột bắt buộc: Khối, Môn học, Tuần, Nội dung bài dạy hoặc Yêu cầu cần đạt.");
        }

        let errors = [];
        for (let i = 1; i < rawJson.length; i++) {
          let row = rawJson[i] || [];
          if (row.every(value => value === "" || value === null || value === undefined)) continue;

          let khoi = String(row[layout.khoi] || scopeKhoi).trim().match(/\d+/)?.[0] || "";
          let mon = canonicalSubjectV6955(row[layout.mon] || scopeMon);
          let weekMatch = String(row[layout.tuan] || "").match(/\d+/);
          let tuan = weekMatch ? Number(weekMatch[0]) : "";
          let tiet = layout.tiet >= 0 ? String(row[layout.tiet] || "").trim() : "";
          let bai = String(row[layout.bai] || "").trim();
          let yeuCau = String(row[layout.yeuCau] || "").trim();
          let range = tuan ? getWeekRangeClient(tuan) : {from:"",to:""};
          let tuNgay = range.from;
          let denNgay = range.to;

          let rowNumber = i + 1;
          if (khoi !== scopeKhoi) errors.push(`Dòng ${rowNumber}: Khối ${khoi || "trống"} khác Khối ${scopeKhoi}.`);
          if (subjectKeyV6955(mon) !== subjectKeyV6955(scopeMon)) errors.push(`Dòng ${rowNumber}: Môn '${mon || "trống"}' khác '${scopeMon}'.`);
          if (!tuan || tuan < 1 || tuan > 52) errors.push(`Dòng ${rowNumber}: Tuần không hợp lệ.`);
          if (!bai) errors.push(`Dòng ${rowNumber}: Thiếu Nội dung bài dạy.`);
          if (!yeuCau) errors.push(`Dòng ${rowNumber}: Thiếu Yêu cầu cần đạt.`);

          if (!errors.some(message => message.startsWith(`Dòng ${rowNumber}:`))) {
            parsedKHBDData.push([khoi, mon, tuan, tuNgay, denNgay, tiet, bai, yeuCau]);
          }
        }

        if (errors.length) {
          parsedKHBDData = [];
          throw new Error("File chưa hợp lệ:\n" + errors.slice(0, 12).join("\n") + (errors.length > 12 ? `\n... và ${errors.length - 12} lỗi khác.` : ""));
        }
        if (!parsedKHBDData.length) throw new Error("Không tìm thấy dòng kế hoạch hợp lệ.");

        parsedKHBDData.forEach((row, index) => {
          tbody.innerHTML += `<tr>
            <td>${index + 1}</td>
            <td class="fw-bold">${escapeHtml(row[0])}</td>
            <td class="fw-bold text-primary">${escapeHtml(row[1])}</td>
            <td>${escapeHtml(row[2])}</td>
            <td>${escapeHtml(row[5])}</td>
            <td class="text-start">${escapeHtml(row[6])}</td>
            <td class="text-start">${escapeHtml(row[7])}</td>
          </tr>`;
        });

        document.getElementById('khbdPreviewArea').classList.remove('d-none');
        document.getElementById('khbdPreviewCount').innerText = `📊 ${parsedKHBDData.length} dòng — Khối ${scopeKhoi} — ${scopeMon}`;
      } catch (err) {
        parsedKHBDData = [];
        event.target.value = "";
        alertV13("❌ " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }
  /* HÀM TẢI KHBD LÊN SHEET THEO TỪNG GÓI */
  async function thucHienUploadKHBD() {
    if (!ttcmDangNhapInfo || !ttcmDangNhapInfo.sessionToken) {
      alertV13("⚠️ Phiên TTCM chưa hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }
    if (!parsedKHBDData || parsedKHBDData.length === 0) {
      alertV13("⚠️ Vui lòng chọn File Excel hoặc Word Kế hoạch bài dạy trước!");
      return;
    }

    let scope = {
      khoi: document.getElementById('khbdUploadKhoi').value,
      mon: canonicalSubjectV6955(document.getElementById('khbdUploadMon').value)
    };
    if (!scope.khoi || !scope.mon) {
      alertV13("⚠️ Cần chọn Khối và nhập Môn học.");
      return;
    }

    let mode = document.getElementById('modeKHBD').value;
    let modeText = mode === "REPLACE_SCOPE" ? `THAY RIÊNG KHỐI ${scope.khoi} - MÔN ${scope.mon}` : "THÊM NỐI TIẾP";

    const okUploadV14 = await confirmV13(`Bạn có chắc chắn muốn [ ${modeText} ] với ${parsedKHBDData.length} bài dạy này?`,{
      title:'Xác nhận cập nhật kế hoạch bài dạy',
      confirmText:'Tiếp tục'
    });
    if(!okUploadV14)return;

    let btn = document.getElementById('btnUploadKHBD');
    btn.disabled = true;

    const CHUNK_SIZE = 100;
    let totalRows = parsedKHBDData.length;
    let totalChunks = Math.ceil(totalRows / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      let start = i * CHUNK_SIZE;
      let end = Math.min(start + CHUNK_SIZE, totalRows);
      let chunkData = parsedKHBDData.slice(start, end);
      
      let currentMode = (i === 0) ? mode : "APPEND";
      let percent = Math.round(((i + 1) / totalChunks) * 100);

      btn.innerText = `⏳ Đang lưu... ${percent}% (${end}/${totalRows} dòng)`;

      try {
        await new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler(res => {
              if (res && res.success) resolve(res);
              else reject(new Error(sodbErrorTextV658(res&&res.message ? res.message : res||'Không lưu được KHBD.')));
            })
            .withFailureHandler(err => reject(new Error(sodbErrorTextV658(err)||'Lỗi kết nối khi lưu KHBD.')))
            .capNhatKeHoachBaiDay(chunkData, currentMode, scope, { token: ttcmDangNhapInfo.sessionToken });
        });
      } catch (error) {
        const msg=sodbErrorTextV658(error)||'Không xác định được lỗi.';
        console.error('[KHBD UPLOAD V68.5.8]',error);
        alertV13("❌ Lỗi trong quá trình tải lên: " + msg);
        btn.disabled = false;
        btn.innerText = "💾 Lưu & Gửi Duyệt";
        return;
      }
    }

    alertV13(`✅ Đã tải ${totalRows} dòng KHBD cho Khối ${scope.khoi} - Môn ${scope.mon} và chuyển sang CHỜ DUYỆT của Phó Hiệu trưởng.`);
    btn.disabled = false;
    btn.innerText = "💾 Lưu & Gửi Duyệt";
    document.getElementById('excelFileKHBD').value = "";
    document.getElementById('khbdPreviewArea').classList.add('d-none');
    parsedKHBDData = [];
    lessonPlanCache = {};
    if (gvbmDangNhapInfo) loadDanhSachBaiDay();
    const summary=document.getElementById('khbdViewSummaryV36');
    if(summary && summary.dataset.loaded==='1') taiDanhSachKHBDTheoKhoiV36();
    if(hasRoleV4('TTCM'))setTimeout(()=>taiKhbdDaTaiTTCMV659(false),120);
  }

  function resetKhbdViewV38(){
    const body=document.getElementById('khbdViewBodyV36');
    const summary=document.getElementById('khbdViewSummaryV36');
    if(body)body.innerHTML='<tr><td colspan="6" class="text-center text-muted py-3">Chọn Khối, Môn và bấm “Xem KHBD”.</td></tr>';
    if(summary){summary.textContent='Chưa tải danh sách.';delete summary.dataset.loaded;}
    const approvalBox=document.getElementById('khbdApprovalBoxV50');if(approvalBox){approvalBox.classList.add('d-none');delete approvalBox.dataset.khoi;delete approvalBox.dataset.mon;}
  }

  function taiDanhSachKHBDTheoKhoiV36(){
    if(!ttcmDangNhapInfo||!ttcmDangNhapInfo.sessionToken){
      alertV13('Phiên Kế hoạch bài dạy không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }
    const khoi=document.getElementById('khbdViewKhoi').value;
    const mon=canonicalSubjectV6955(document.getElementById('khbdViewMon')?.value);
    const body=document.getElementById('khbdViewBodyV36');
    const summary=document.getElementById('khbdViewSummaryV36');
    if(!mon){
      showToastV9('Vui lòng chọn Môn cần xem.','danger');
      return;
    }
    body.innerHTML='<tr><td colspan="6" class="text-center py-3"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải KHBD...</td></tr>';
    summary.textContent=`Đang tải Khối ${khoi} — ${mon}...`;
    google.script.run
      .withSuccessHandler(function(res){
        if(!res||!res.success){
          body.innerHTML='<tr><td colspan="6" class="text-center text-danger py-3">Không tải được dữ liệu.</td></tr>';
          summary.textContent=res&&res.message?res.message:'Không tải được KHBD.';
          return;
        }
        const rows=res.data||[];
        summary.dataset.loaded='1';
        summary.textContent=`Khối ${khoi} — ${mon}: ${rows.length} dòng KHBD · Tuần 1 bắt đầu 17/08/2026.`;
        renderKhbdApprovalStateV50(res.approval||{},khoi,mon);
        body.innerHTML=rows.length?rows.map((r,i)=>`<tr>
          <td class="text-center">${i+1}</td>
          <td class="fw-semibold text-primary">${escapeHtml(r.mon||'')}</td>
          <td class="text-center">${escapeHtml(r.tuan||'')}</td>
          <td class="text-center">${escapeHtml(r.tietPPCT||'')}</td>
          <td>${escapeHtml(r.noiDung||'')}</td>
          <td>${escapeHtml(r.yeuCauCanDat||'')}</td>
        </tr>`).join(''):'<tr><td colspan="6" class="text-center text-muted py-3">Chưa có KHBD cho Khối và Môn đã chọn.</td></tr>';
      })
      .withFailureHandler(function(err){
        body.innerHTML='<tr><td colspan="6" class="text-center text-danger py-3">Lỗi kết nối khi tải KHBD.</td></tr>';
        summary.textContent='Lỗi kết nối: '+err;
      })
      .layDanhSachKHBDTheoKhoiV36(khoi,mon,{token:ttcmDangNhapInfo.sessionToken});
  }

  let khbdSubmittedRowsV659=[];
  function getKhbdTtcmAuthV659(){
    const sessions=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};
    return {token:(sessions.TTCM&&sessions.TTCM.sessionToken)||(ttcmDangNhapInfo&&ttcmDangNhapInfo.sessionToken)||''};
  }
  function taiKhbdDaTaiTTCMV659(showLoading=true){
    const sessions=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};
    if(!sessions.TTCM)return;
    const body=document.getElementById('khbdSubmittedBodyV659'),status=document.getElementById('khbdSubmittedStatusV659');
    if(showLoading&&body)body.innerHTML='<tr><td colspan="9" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải KHBD đã gửi...</td></tr>';
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){
        if(body)body.innerHTML=`<tr><td colspan="9" class="text-center text-danger py-4">${escapeHtml(res&&res.message||'Không tải được danh sách KHBD đã gửi.')}</td></tr>`;
        if(status)status.textContent=res&&res.message||'Không tải được dữ liệu.';
        return;
      }
      khbdSubmittedRowsV659=res.data||[];
      const pending=Number(res.pendingCount||0),returned=Number(res.returnedCount||0),approved=Number(res.approvedCount||0);
      const count=document.getElementById('khbdSubmittedCountV659');if(count)count.textContent=`${pending} chờ duyệt · ${returned} trả lại · ${approved} đã duyệt`;
      const badge=document.getElementById('khbdSubmittedBadgeV659');if(badge){badge.textContent=String(pending);badge.classList.toggle('d-none',pending<1);}
      if(status)status.textContent=`Có ${res.total||khbdSubmittedRowsV659.length} KHBD do tài khoản Tổ trưởng/Tổ phó này đã tải lên.`;
      renderKhbdDaTaiTTCMV659();
    }).withFailureHandler(function(err){
      if(body)body.innerHTML='<tr><td colspan="9" class="text-center text-danger py-4">Lỗi kết nối khi tải danh sách KHBD đã gửi.</td></tr>';
      if(status)status.textContent=String(err&&err.message||err||'Lỗi kết nối.');
    }).layKhbdDaTaiCuaTTCMV659(getKhbdTtcmAuthV659());
  }
  function renderKhbdDaTaiTTCMV659(){
    const body=document.getElementById('khbdSubmittedBodyV659');if(!body)return;
    const filter=document.getElementById('khbdSubmittedFilterV659')?.value||'CHO_DUYET';
    const want={CHO_DUYET:'cho duyet',TRA_LAI:'tra lai',DA_DUYET:'da duyet'}[filter]||'';
    const rows=(khbdSubmittedRowsV659||[]).filter(x=>filter==='ALL'||normalizeTextKey(x.status||'')===want);
    body.innerHTML=rows.length?rows.map(x=>{
      const meta=khbdStatusMetaV50(x.status);
      const weeks=x.minWeek?(x.minWeek===x.maxWeek?`Tuần ${x.minWeek}`:`Tuần ${x.minWeek}–${x.maxWeek}`):'—';
      const reviewer=x.reviewedBy?`${escapeHtml(x.reviewedBy)}${x.reviewedAt?' · '+escapeHtml(x.reviewedAt):''}`:'—';
      return `<tr><td class="text-center fw-bold">${escapeHtml(x.khoi||'')}</td><td class="fw-semibold">${escapeHtml(x.mon||'')}</td><td class="text-center">${escapeHtml(x.rowCount||0)}</td><td>${escapeHtml(weeks)}</td><td><span class="khbd-approval-status-v50 ${meta.cls}">${meta.icon} ${meta.label}</span></td><td>${escapeHtml(x.submittedAt||'—')}</td><td>${reviewer}</td><td>${x.note?`<span class="text-danger">${escapeHtml(x.note)}</span>`:'—'}</td><td class="text-end"><button type="button" class="btn btn-outline-primary btn-sm fw-bold" data-khbd-submitted-open="1" data-khoi="${escapeHtml(x.khoi||'')}" data-mon="${escapeHtml(x.mon||'')}">Xem</button></td></tr>`;
    }).join(''):'<tr><td colspan="9" class="text-center text-muted py-4">Không có KHBD ở trạng thái này.</td></tr>';
    body.querySelectorAll('[data-khbd-submitted-open="1"]').forEach(btn=>btn.addEventListener('click',()=>xemKhbdTuHangDoiV50(btn.dataset.khoi,btn.dataset.mon)));
  }

  let khbdApprovalQueueV50=[];
  function khbdStatusMetaV50(status){
    const k=normalizeTextKey(status||'');
    if(k==='da duyet')return {label:'ĐÃ DUYỆT',cls:'approved',icon:'✓'};
    if(k==='tra lai')return {label:'TRẢ LẠI',cls:'returned',icon:'↩'};
    return {label:'CHỜ DUYỆT',cls:'pending',icon:'⏳'};
  }
  function renderKhbdApprovalStateV50(ap,khoi,mon){
    const box=document.getElementById('khbdApprovalBoxV50');if(!box)return;
    box.dataset.khoi=String(khoi||'');box.dataset.mon=String(mon||'');box.classList.remove('d-none');
    const meta=khbdStatusMetaV50(ap&&ap.status);
    const status=document.getElementById('khbdApprovalStatusV50');
    if(status)status.innerHTML=`<span class="khbd-approval-status-v50 ${meta.cls}">${meta.icon} ${meta.label}</span>${ap&&ap.legacy?' <span class="small text-muted ms-2">(dữ liệu trước quy trình V50)</span>':''}`;
    const details=[];
    if(ap&&ap.submittedBy)details.push(`Người gửi: <strong>${escapeHtml(ap.submittedBy)}</strong>${ap.submittedAt?' · '+escapeHtml(ap.submittedAt):''}`);
    if(ap&&ap.reviewedBy)details.push(`Xử lý gần nhất: <strong>${escapeHtml(ap.reviewedBy)}</strong>${ap.reviewedAt?' · '+escapeHtml(ap.reviewedAt):''}`);
    if(ap&&ap.note)details.push(`<span class="text-danger">Ý kiến: ${escapeHtml(ap.note)}</span>`);
    const detail=document.getElementById('khbdApprovalDetailV50');if(detail)detail.innerHTML=details.join('<br>')||'Chưa có thông tin xử lý.';
    const actions=document.getElementById('khbdApprovalActionsV50');if(actions)actions.classList.toggle('d-none',!isKhbdApproverClientV50());
  }
  async function taiHangDoiDuyetKHBDV50(force){
    if(!isKhbdApproverClientV50())return;
    const body=document.getElementById('khbdApprovalQueueBodyV50');if(body)body.innerHTML='<tr><td colspan="9" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải danh sách...</td></tr>';
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){if(body)body.innerHTML=`<tr><td colspan="9" class="text-center text-danger py-4">${escapeHtml(res&&res.message||'Không tải được danh sách.')}</td></tr>`;return;}
      khbdApprovalQueueV50=res.data||[];
      const count=document.getElementById('khbdReviewCountV50');if(count)count.textContent=`${res.pendingCount||0} chờ duyệt · ${res.returnedCount||0} trả lại`;
      const badge=document.getElementById('khbdPendingBadgeV50');if(badge){badge.textContent=String(res.pendingCount||0);badge.classList.toggle('d-none',!(res.pendingCount>0));}
      renderHangDoiDuyetKHBDV50();
    }).withFailureHandler(function(err){if(body)body.innerHTML='<tr><td colspan="9" class="text-center text-danger py-4">Lỗi kết nối khi tải danh sách duyệt.</td></tr>';}).layDanhSachDuyetKHBDV50(getKhbdApprovalAuthV50());
  }
  function renderHangDoiDuyetKHBDV50(){
    const body=document.getElementById('khbdApprovalQueueBodyV50');if(!body)return;
    const filter=document.getElementById('khbdApprovalFilterV50')?.value||'CHO_DUYET';
    const want={CHO_DUYET:'cho duyet',TRA_LAI:'tra lai',DA_DUYET:'da duyet'}[filter]||'';
    const rows=(khbdApprovalQueueV50||[]).filter(x=>filter==='ALL'||normalizeTextKey(x.status||'')===want);
    body.innerHTML=rows.length?rows.map((x,i)=>{
      const meta=khbdStatusMetaV50(x.status);const weeks=x.minWeek?(x.minWeek===x.maxWeek?`Tuần ${x.minWeek}`:`Tuần ${x.minWeek}–${x.maxWeek}`):'—';
      return `<tr data-khbd-review-index="${i}"><td class="text-center fw-bold">${escapeHtml(x.khoi||'')}</td><td class="fw-semibold">${escapeHtml(x.mon||'')}</td><td class="text-center">${escapeHtml(x.rowCount||0)}</td><td>${escapeHtml(weeks)}</td><td><span class="khbd-approval-status-v50 ${meta.cls}">${meta.icon} ${meta.label}</span></td><td>${escapeHtml(x.submittedBy||'Dữ liệu cũ')}</td><td>${escapeHtml(x.submittedAt||'—')}</td><td>${x.note?`<span class="text-danger">${escapeHtml(x.note)}</span>`:'—'}</td><td class="text-end"><button type="button" class="btn btn-outline-primary btn-sm fw-bold" data-khbd-open="1" data-khoi="${escapeHtml(x.khoi||'')}" data-mon="${escapeHtml(x.mon||'')}">Xem</button></td></tr>`;
    }).join(''):'<tr><td colspan="9" class="text-center text-muted py-4">Không có KHBD ở trạng thái này.</td></tr>';
    body.querySelectorAll('[data-khbd-open="1"]').forEach(btn=>btn.addEventListener('click',()=>xemKhbdTuHangDoiV50(btn.dataset.khoi,btn.dataset.mon)));
  }
  function xemKhbdTuHangDoiV50(khoi,mon){
    const ks=document.getElementById('khbdViewKhoi'),ms=document.getElementById('khbdViewMon');if(ks)ks.value=String(khoi||'');
    if(ms){mon=canonicalSubjectV6955(mon);let opt=[...ms.options].find(o=>subjectKeyV6955(o.value)===subjectKeyV6955(mon));if(!opt){opt=new Option(mon,mon);ms.add(opt);}ms.value=opt.value;}
    const tab=document.getElementById('khbd-view-tab-v38');if(tab&&window.bootstrap)bootstrap.Tab.getOrCreateInstance(tab).show();
    setTimeout(taiDanhSachKHBDTheoKhoiV36,80);
  }
  async function xuLyDuyetKhbdUiV50(decision){
    if(!isKhbdApproverClientV50())return;
    const box=document.getElementById('khbdApprovalBoxV50'),khoi=box&&box.dataset.khoi||'',mon=box&&box.dataset.mon||'';if(!khoi||!mon){alertV13('Vui lòng mở một KHBD cần xử lý trước.');return;}
    let note='';
    if(decision==='TRA_LAI'){
      note=await promptV13('Nhập rõ nội dung cần Tổ trưởng/Tổ phó điều chỉnh trước khi gửi duyệt lại.',{title:'Trả lại KHBD',label:'Ý kiến điều chỉnh',placeholder:'Ví dụ: điều chỉnh tiến độ Tuần 5, bổ sung yêu cầu cần đạt...'});
      if(!note||!note.trim())return;
    }else{
      const ok=await confirmV13(`Xác nhận duyệt KHBD Khối ${khoi} - ${mon}? Sau khi duyệt, giáo viên sẽ sử dụng kế hoạch này để chọn bài dạy.`,{title:'Duyệt KHBD',confirmText:'Duyệt KHBD'});if(!ok)return;
    }
    setBusyV13(true,decision==='DUYET'?'Đang duyệt KHBD...':'Đang trả lại KHBD...');
    google.script.run.withSuccessHandler(function(res){
      setBusyV13(false);alertV13((res&&res.success?'✅ ':'❌ ')+(res&&res.message||'Không xử lý được KHBD.'));
      if(res&&res.success){taiDanhSachKHBDTheoKhoiV36();taiHangDoiDuyetKHBDV50(true);}
    }).withFailureHandler(function(err){setBusyV13(false);alertV13('❌ Lỗi xử lý duyệt KHBD: '+(err&&err.message?err.message:err));}).xuLyDuyetKHBDV50(khoi,mon,decision,note,getKhbdApprovalAuthV50());
  }


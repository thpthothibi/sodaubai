  /* ĐĂNG NHẬP TAB TỔ TRƯỞNG CHUYÊN MÔN */



  /* ĐĂNG NHẬP TAB NHẬP TIẾT HỌC */


  /* ĐĂNG NHẬP TAB GIÁM THỊ */


  /* ĐỔI MẬT KHẨU TAB NHẬP TIẾT HỌC */


  function traCuuGiamThi() {
    let khoi = document.getElementById('gtKhoi').value;
    let tuNgay = document.getElementById('gtTuNgay').value;
    let denNgay = document.getElementById('gtDenNgay').value;

    if (!tuNgay) {
      alertV13("⚠️ Vui lòng chọn ngày tra cứu!");
      return;
    }

    let tbody = document.getElementById('gtTableBody');
    tbody.innerHTML = `<tr><td colspan="6" class="py-3 text-center">⏳ Đang tải thống kê...</td></tr>`;
    document.getElementById('gtResultSection').classList.remove('d-none');
    document.getElementById('gtPlaceholder').classList.add('d-none');

    google.script.run.withSuccessHandler(function(res) {
      if (!res || !res.success) {
        alertV13("⚠️ Không thể tải dữ liệu thống kê khối.");
        return;
      }
      tbody.innerHTML = "";
      res.dataLop.forEach(item => {
        tbody.innerHTML += `<tr>
          <td><b>${escapeHtml(item.lop)}</b></td>
          <td class="fw-bold text-primary fs-5">${escapeHtml(item.dtbChung)}</td>
          <td class="fw-bold ${item.tongVang > 0 ? 'text-danger' : 'text-dark'} fs-5">${escapeHtml(item.tongVang)}</td>
          <td class="text-start small ${item.tenHSVang ? 'text-danger' : 'text-muted'}">${escapeHtml(item.tenHSVang || '---')}</td>
          <td class="fw-bold">${item.soTietThucTe || 0}</td>
          <td class="fw-bold ${item.tongLuotMonGV > item.soTietThucTe ? 'text-success' : ''}">${item.tongLuotMonGV || 0}</td>
        </tr>`;
      });
    }).traCuuThongKeTheoKhoiNgay(khoi, tuNgay, denNgay, {token: giamThiDangNhapInfo ? giamThiDangNhapInfo.sessionToken : ""});
  }

  function xuatExcelGiamThi() {
  if (retryWithXlsxV7(() => xuatExcelGiamThi())) return;
    let khoi = document.getElementById('gtKhoi').value;
    let tuNgay = document.getElementById('gtTuNgay').value;
    let denNgay = document.getElementById('gtDenNgay').value;
    
    let table = document.getElementById("gtTableExcel");
    let wb = XLSX.utils.table_to_book(table, { sheet: "Thống Kê Giám Thị" });
    
    let fileName = `ThongKe_GiamThi_Khoi${khoi}_${tuNgay}_den_${denNgay}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /* TRA CỨU CHI TIẾT TIẾT HỌC GIÁM THỊ */
  function traCuuChitTietGiamThi() {
    let tuNgay = document.getElementById('gtDetailTuNgay').value;
    let denNgay = document.getElementById('gtDetailDenNgay').value;
    let tenGV = document.getElementById('gtDetailTenGV').value.trim();
    let lopSelect = document.getElementById('gtDetailLop').value;

    if (!tuNgay) {
      alertV13("⚠️ Vui lòng chọn khoảng thời gian cần tra cứu!");
      return;
    }

    let tbody = document.getElementById('gtDetailTableBody');
    tbody.innerHTML = `<tr><td colspan="10" class="py-3 text-center">⏳ Đang tìm kiếm lịch dạy chi tiết...</td></tr>`;
    document.getElementById('gtDetailResultSection').classList.remove('d-none');
    document.getElementById('gtDetailPlaceholder').classList.add('d-none');

    google.script.run.withSuccessHandler(function(res) {
      if (!res || !res.success) {
        alertV13("❌ " + (res ? res.message : "Lỗi tra cứu"));
        return;
      }

      document.getElementById('gtDetailCountMsg').innerText = `📊 TÌM THẤY ${res.totalCount} TIẾT HỌC THỎA MÃN ĐIỀU KIỆN!`;
      tbody.innerHTML = "";

      if (res.results.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="py-4 text-warning fw-bold fs-6">⚠️ Không tìm thấy tiết học nào phù hợp với từ khóa!</td></tr>`;
        return;
      }

      res.results.forEach(item => {
        tbody.innerHTML += `<tr>
          <td class="fw-bold">${escapeHtml(item.ngayFormatted)}</td>
          <td><span class="badge ${item.buoi === 'Sáng' ? 'bg-primary' : 'bg-danger'}">${escapeHtml(item.buoi)}</span> <br>Tiết ${escapeHtml(item.tiet)}</td>
          <td class="fw-bold text-primary fs-6">${escapeHtml(item.lop)}</td>
          <td class="fw-semibold text-start">${escapeHtml(item.mon)} ${item.isTietTron ? '<span class="badge bg-warning text-dark">Tiết trộn</span>' : ''}</td>
          <td class="fw-bold text-success">${escapeHtml(item.tietCT)}</td>
          <td class="text-start">${escapeHtml(item.tenBai)}</td>
          <td class="text-start small text-danger">${escapeHtml(item.hsVang || "---")}</td>
          <td class="text-start small text-muted">${escapeHtml(item.nhanXet || "---")}</td>
          <td class="fw-bold">${escapeHtml(item.diemTB)}</td>
          <td class="text-start"><b>${escapeHtml(item.tenGV)}</b></td>
        </tr>`;
      });
    }).traCuuChiTietGiamThi(tuNgay, denNgay, tenGV, lopSelect, {token: giamThiDangNhapInfo ? giamThiDangNhapInfo.sessionToken : ""});
  }

  function xuatExcelChiTietGiamThi() {
  if (retryWithXlsxV7(() => xuatExcelChiTietGiamThi())) return;
    let tuNgay = document.getElementById('gtDetailTuNgay').value;
    let denNgay = document.getElementById('gtDetailDenNgay').value;
    
    let table = document.getElementById("gtDetailTableExcel");
    let wb = XLSX.utils.table_to_book(table, { sheet: "LichDayChiTiet" });
    
    let fileName = `LichDay_ChiTiet_GiamThi_${tuNgay}_den_${denNgay}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  function xacNhanMatKhauAdmin() {
  let pw=document.getElementById('adminPasswordInput').value;
  if(!pw){alertV13("⚠️ Nhập mật khẩu Admin.");return;}
  google.script.run.withSuccessHandler(function(res){
    if(!res||!res.success){alertV13("❌ "+(res?res.message:"Không đăng nhập được."));return;}
    adminDangNhapInfo=res;
    document.getElementById('adminAuthBox')?.classList.add('d-none');
    document.getElementById('adminMainContent')?.classList.remove('d-none');
    setTimeout(()=>{if(typeof focusAdminContentTopV69553==='function')focusAdminContentTopV69553();},120);
    alertV13("🔓 Đăng nhập Admin thành công.");
  }).dangNhapAdminV4(pw);
}


  /* KIỂM DÒ TRÙNG TIẾT ADMIN */
  function kiamDoTrungTietAdmin() {
    let tuNgay = document.getElementById('adminTuNgay').value;
    let denNgay = document.getElementById('adminDenNgay').value;
    let checkType = document.getElementById('adminCheckType').value;

    if (!tuNgay) {
      showToastV9('Vui lòng chọn khoảng thời gian cần kiểm dò.','danger');
      return;
    }

    let tbody = document.getElementById('adminCheckTableBody');
    tbody.innerHTML = `<tr><td colspan="6" class="py-3 text-center">⏳ Hệ thống đang rà soát toàn bộ Sổ Đầu Bài...</td></tr>`;
    document.getElementById('adminCheckResultSection').classList.remove('d-none');

    google.script.run.withSuccessHandler(function(res) {
      if (!res || !res.success) {
        alertV13("❌ Lỗi kiểm dò: " + (res ? res.message : "Không phản hồi"));
        return;
      }

      let typeLabel = checkType === "TRUNG_GV" ? "TRÙNG GV" : "TRÙNG TIẾT TRONG CÙNG LỚP";
      document.getElementById('adminCheckCountMsg').innerText = `🚨 PHÁT HIỆN ${res.totalConflicts} TRƯỜNG HỢP ${typeLabel}!`;
      tbody.innerHTML = "";

      if (res.conflicts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-success fw-bold fs-5">✅ Tuyệt vời! Không phát hiện trường hợp nào bị ${typeLabel}!</td></tr>`;
        return;
      }

      res.conflicts.forEach(item => {
        tbody.innerHTML += `<tr>
          <td class="text-start"><b>${escapeHtml(item.tenGV)}</b><br><small class="text-muted">CCCD/SĐT: ${escapeHtml(item.cccd)}</small></td>
          <td class="fw-bold">${escapeHtml(item.ngayFormatted)}</td>
          <td><span class="badge bg-warning text-dark">${escapeHtml(item.buoi)}</span> <strong class="text-danger">Tiết ${escapeHtml(item.tiet)}</strong></td>
          <td class="text-start bg-light">
            <b>Lớp / Nhập 1: ${escapeHtml(item.lop1)}</b> (${escapeHtml(item.mon1)})<br>
            <small class="text-muted">Bài: ${escapeHtml(item.bai1)}</small>
          </td>
          <td class="text-start bg-light">
            <b>Lớp / Nhập 2: ${escapeHtml(item.lop2)}</b> (${escapeHtml(item.mon2)})<br>
            <small class="text-muted">Bài: ${escapeHtml(item.bai2)}</small>
          </td>
          <td class="small text-secondary">${escapeHtml(item.sheet1)}<br>${escapeHtml(item.sheet2)}</td>
        </tr>`;
      });
    }).kiemTraTrungTietAdmin(tuNgay, denNgay, checkType, {token: adminDangNhapInfo ? adminDangNhapInfo.sessionToken : ""});
  }

  function xuatExcelTrungTietAdmin() {
  if (retryWithXlsxV7(() => xuatExcelTrungTietAdmin())) return;
    let tuNgay = document.getElementById('adminTuNgay').value;
    let denNgay = document.getElementById('adminDenNgay').value;
    
    let table = document.getElementById("adminTableExcel");
    let wb = XLSX.utils.table_to_book(table, { sheet: "Danh Sach Trung Tiet" });
    
    let fileName = `CanhBao_TrungTiet_Admin_${tuNgay}_den_${denNgay}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }




  // V69: các hàm GVCN cũ đã được loại bỏ; chỉ dùng implementation Supabase ở cuối file.

  function thucHienMoKhoaAdmin() {
  if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken){alertV13("⚠️ Phiên Admin không hợp lệ.");return;}
  let reason=document.getElementById('adminUnlockReasonV4').value.trim();
  if(!reason){alertV13("⚠️ Bắt buộc nhập lý do mở khóa.");return;}
  google.script.run.withSuccessHandler(function(res){
    if(res&&res.success){alertV13("✅ "+res.message);document.getElementById('adminUnlockReasonV4').value="";}
    else alertV13("❌ "+(res?res.message:"Không mở khóa được"));
  }).adminMoKhoaTuan(document.getElementById('adminLop').value,document.getElementById('adminTuan').value,reason,{token:adminDangNhapInfo.sessionToken},24);
}


  function getCellEntries(cellData) {
    if (cellData && Array.isArray(cellData.entries) && cellData.entries.length) return cellData.entries;
    if (!cellData) return [];
    return [{
      ...teachingPublicClientV704649(cellData),
      mon: cellData.mon || "",
      tietCT: cellData.tietCT || "",
      tenBai: cellData.tenBai || "",
      tenGV: cellData.tenGV || "",
      cccd: cellData.cccd || "",
      teacherLookup: cellData.teacherLookup || cellData.cccd || cellData.tenGV || "",
      kySo: cellData.kySo || "",
      signatureUrl: cellData.signatureUrl || "",
      thoiGianKy: cellData.thoiGianKy || "",
      trangThaiTiet: cellData.trangThaiTiet || "HOC_BINH_THUONG",
      laDayThay: !!cellData.laDayThay,
      gvDuocThay: cellData.gvDuocThay || "",
      lyDoTrangThai: cellData.lyDoTrangThai || "",
      operationId: cellData.operationId || "",
      operationMeta: cellData.operationMeta || null,
      externalStaffId: cellData.externalStaffId || "",
      proxySignerAccount: cellData.proxySignerAccount || "",
      partnerEvidence: cellData.partnerEvidence || null,proxySignerName: cellData.proxySignerName || ""
    }];
  }

  function formatStatusDateV7032(value) {
    const s=String(value||'').slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const [y,m,d]=s.split('-');
    return `${d}/${m}/${y}`;
  }

  function operationStateTextV7032(value) {
    const s=String(value||'').toUpperCase();
    return ({CHO_DUYET:'Chờ duyệt',DA_DUYET:'Đã duyệt',HOAN_THANH:'Hoàn thành',TU_CHOI:'Từ chối',HUY:'Đã hủy'})[s] || String(value||'');
  }

  function operationSideTextV7032(side) {
    if(!side) return '';
    const parts=[];
    if(side.mon) parts.push(side.mon);
    if(side.ngay) parts.push(formatStatusDateV7032(side.ngay));
    if(side.buoi) parts.push(side.buoi);
    if(side.tiet) parts.push(`Tiết ${side.tiet}`);
    if(side.lop) parts.push(`Lớp ${side.lop}`);
    return parts.join(' · ');
  }

  function statusPopoverTextV7032(cellData, status) {
    const meta=cellData&&cellData.operationMeta||null;
    const lines=[];
    if(status==='DAY_THAY'){
      const performed=String(meta?.gvThucHienName||cellData?.tenGV||'').trim();
      const replaced=String(meta?.gvGocName||cellData?.gvDuocThay||'').trim();
      if(performed) lines.push(`GV thực hiện: ${performed}`);
      if(replaced) lines.push(`Dạy thay cho: ${replaced}`);
      if(meta?.maHoSo) lines.push(`Hồ sơ: ${meta.maHoSo}`);
      if(meta?.trangThai) lines.push(`Trạng thái: ${operationStateTextV7032(meta.trangThai)}`);
      if(meta?.lyDo) lines.push(`Lý do: ${meta.lyDo}`);
    }else if(status==='DAY_BU'){
      if(meta?.origin) lines.push(`Tiết gốc: ${operationSideTextV7032(meta.origin)}`);
      if(meta?.execution) lines.push(`Dạy bù: ${operationSideTextV7032(meta.execution)}`);
      if(meta?.gvThucHienName||cellData?.tenGV) lines.push(`Giáo viên: ${meta?.gvThucHienName||cellData?.tenGV}`);
      if(meta?.maHoSo) lines.push(`Hồ sơ: ${meta.maHoSo}`);
      if(meta?.lyDo) lines.push(`Lý do: ${meta.lyDo}`);
    }else if(status==='HOAN_DOI'){
      if(meta?.execution) lines.push(`Tiết này: ${operationSideTextV7032(meta.execution)}`);
      const cp=meta?.counterpart;
      if(cp){
        lines.push(`Đổi với: ${operationSideTextV7032(cp)}`);
        if(cp.giaoVien) lines.push(`GV đối ứng: ${cp.giaoVien}`);
        lines.push(`Đối ứng: ${cp.completed?'✓ Đã ghi sổ':'⏳ Chưa ghi SĐB'}`);
      }else lines.push('⚠ Chưa tìm thấy vế đối ứng');
      if(meta?.pairCount>=2) lines.push(`Hai vế: ${meta.pairComplete?'✓ Đã hoàn thành':'⏳ Chưa hoàn tất'}`);
      if(meta?.maHoSo) lines.push(`Hồ sơ: ${meta.maHoSo}`);
    }else if(status==='NGHI'||status==='GV_VANG'||status==='BO_TIET'){
      const teacher=String(cellData?.gvDuocThay||cellData?.tenGV||'').trim();
      if(teacher) lines.push(`Giáo viên: ${teacher}`);
      if(cellData?.lyDoTrangThai||cellData?.nhanXet) lines.push(`Lý do: ${cellData.lyDoTrangThai||cellData.nhanXet}`);
      if(cellData?.canDayBu) lines.push('Cần bố trí dạy bù');
    }
    return lines.join('\n');
  }

  function mixedPopoverTextV7032(cellData){
    const entries=getCellEntries(cellData);
    const lines=entries.map((entry,index)=>{
      const signed=!!String(entry.kySo||'').trim()&&!/chưa\s*(ký|xác nhận)/i.test(String(entry.kySo||''));
      return `${entry.mon||`Môn ${index+1}`} — ${entry.tenGV||'Chưa xác định GV'} — ${signed?'✓ đã ký':'⏳ chưa ký'}`;
    });
    const meta=cellData&&cellData.mixedMeta;
    if(meta) lines.push(`Trạng thái: ${meta.complete?'✓ Đủ giáo viên/chữ ký':'⏳ Tiết trộn chưa hoàn tất'}`);
    return lines.join('\n');
  }

  function popoverAttrsV7032(title, content){
    const text=String(content||'').trim();
    if(!text) return '';
    return ` data-sodb-status-popover="1" data-bs-title="${escapeHtml(title||'Chi tiết')}" data-bs-content="${escapeHtml(text)}" tabindex="0" role="button" aria-label="${escapeHtml((title||'Chi tiết')+': '+text.replace(/\n/g,'. '))}"`;
  }

  function initSodbStatusPopoversV7032(){
    if(window.__sodbStatusPopoverV7032||!window.bootstrap||!bootstrap.Popover)return;
    window.__sodbStatusPopoverV7032=new bootstrap.Popover(document.body,{selector:'[data-sodb-status-popover="1"]',container:'body',trigger:'hover focus click',placement:'auto',html:false,sanitize:true,customClass:'sodb-status-popover-v7032'});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initSodbStatusPopoversV7032,{once:true});else setTimeout(initSodbStatusPopoversV7032,0);

  function renderMixedField(cellData, fieldName) {
    let entries = getCellEntries(cellData);
    return entries.map((entry, index) => {
      let badge = '';
      if(fieldName === "mon" && cellData && cellData.isTietTron && entries.length > 1 && index === 0){
        badge = `<span class="badge sodb-status-badge sodb-status-badge-mixed mixed-badge me-1"${popoverAttrsV7032('Tiết trộn',mixedPopoverTextV7032(cellData))}>TRỘN</span> `;
      }
      return `<div class="mixed-entry">${badge}${escapeHtml(teachingFieldV704649(entry,fieldName))}</div>`;
    }).join("");
  }

  function renderPeriodStatusBadgeV683(cellData){
    const status=String(cellData&&cellData.trangThaiTiet||'HOC_BINH_THUONG').toUpperCase();
    const meta=cellData&&cellData.operationMeta||null;
    const attrs=popoverAttrsV7032(status==='HOAN_DOI'?'Đổi tiết':status==='DAY_THAY'?'Dạy thay':status==='DAY_BU'?'Dạy bù':status==='GV_VANG'?'Giáo viên vắng':status==='BO_TIET'?'Bỏ tiết':'Nghỉ',statusPopoverTextV7032(cellData,status));
    if(status==='DAY_THAY'){
      const teacher=String(meta?.gvThucHienName||cellData?.tenGV||'').trim();
      return `<span class="badge sodb-status-badge sodb-status-badge-substitute me-1"${attrs}>DẠY THAY${teacher?`<span class="status-badge-detail-v7032">: ${escapeHtml(teacher)}</span>`:''}</span>`;
    }
    if(status==='NGHI')return `<span class="badge sodb-status-badge sodb-status-badge-absence me-1"${attrs}>NGHỈ</span>`;
    if(status==='GV_VANG')return `<span class="badge sodb-status-badge sodb-status-badge-absence me-1"${attrs}>GV VẮNG</span>`;
    if(status==='BO_TIET')return `<span class="badge sodb-status-badge sodb-status-badge-absence me-1"${attrs}>BỎ TIẾT</span>`;
    if(status==='DAY_BU')return `<span class="badge sodb-status-badge sodb-status-badge-makeup me-1"${attrs}>DẠY BÙ</span>`;
    if(status==='HOAN_DOI')return `<span class="badge sodb-status-badge sodb-status-badge-swap me-1"${attrs}>ĐỔI TIẾT</span>`;
    return '';
  }

  // V704640: signatures arrive with the authorized book response.
  function hydrateSignatureFallbackPlaceholdersV704637(){return Promise.resolve([]);}
  function renderSignatureCell(cellData, clickable = true) {
    /* V8.2: ô trống phải thực sự trống; không dùng chữ mặc định "Giáo viên". */
    const entries=getCellEntries(cellData).filter(entry=>{
      const name=String(entry&&entry.tenGV||'').trim();
      const kySo=String(entry&&entry.kySo||'').trim();
      const sigUrl=normalizeSignatureUrlV67_1(entry&&entry.signatureUrl||(kySo.indexOf('IMAGE:')===0?kySo.replace('IMAGE:',''):''));
      return !!(name || sigUrl);
    });
    if(!entries.length) return '';

    return `<div class="sig-stack${entries.length>1?' sig-stack-mixed-v14':''}">${entries.map(entry=>{
      const name=String(entry.tenGV||'').trim();
      const lookup=String(entry.teacherLookup||entry.cccd||name||'').trim();
      const time=entry.thoiGianKy||'';
      const encodedLookup=encodeURIComponent(lookup).replace(/'/g,'%27');
      const encodedTime=encodeURIComponent(time).replace(/'/g,'%27');
      const clickAttr=clickable&&lookup?` onclick="xemChiTietChuKySo(decodeURIComponent('${encodedLookup}'), decodeURIComponent('${encodedTime}'))" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}" style="cursor:pointer;" title="Bấm xem thông tin xác nhận điện tử"`:'';
      const kySo=String(entry.kySo||'');
      const sigUrl=normalizeSignatureUrlV67_1(entry.signatureUrl||(kySo.indexOf('IMAGE:')===0?kySo.replace('IMAGE:',''):''));
      const proxySigner=String(entry.proxySignerName||'').trim();
      const isExternal=!!String(entry.externalStaffId||'').trim();
      const evidence=entry.partnerEvidence||{},program=String(evidence.program||'');
      const nameHtml=name?`<div class="sig-name">${escapeHtml(name)}</div>${isExternal?'<div class="small fw-semibold external-staff-badge-v7044">Nhân sự ngoài trường</div>':''}${program?`<div class="small text-muted">${escapeHtml(program)}</div>`:''}${proxySigner?`<div class="small text-muted proxy-signer-v693">Ký xác nhận thay: ${escapeHtml(proxySigner)}</div>`:''}`:'';
      if(sigUrl){
        const altText=name?`Chữ ký ${name}`:'Chữ ký giáo viên';
        const rawSig=entry.signatureUrl||entry.kySo||'';
        const candidates=buildSignatureUrlCandidatesV682(normalizeSignatureUrlV67_1(rawSig));
        const firstSig=candidates[0]||sigUrl;
        return `<div class="sig-container mixed-entry"${clickAttr}><img src="${escapeHtml(firstSig)}" class="sig-img-preview" loading="eager" decoding="async" alt="${escapeHtml(altText)}" data-sig-candidates='${escapeHtml(JSON.stringify(candidates))}' data-sig-index="0" onerror="handleSignatureImageErrorV682(this)">${nameHtml}</div>`;
      }
      return name?`<div class="sig-container mixed-entry"${clickAttr}>${nameHtml}</div>`:'';
    }).join('')}</div>`;
  }



  function sodbNhanXetSafeV83(cellData){
    if(!cellData) return '';
    const normalize=v=>String(v||'').trim().toLocaleLowerCase('vi');
    const bad=new Set();
    (cellData.entries||[]).forEach(e=>{
      if(e.tenGV) bad.add(normalize(e.tenGV));
      if(e.cccd) bad.add(String(e.cccd).trim());
      if(e.teacherLookup) bad.add(String(e.teacherLookup).trim());
    });
    const clean=value=>{
      value=String(value||'').trim();if(!value)return '';
      const vnorm=normalize(value);
      if(bad.has(vnorm)||bad.has(value))return '';
      if(/^IMAGE:/i.test(value)||/^https?:\/\//i.test(value))return '';
      return value;
    };
    const entryNotes=[];
    (cellData.entries||[]).forEach(e=>{const v=clean(teachingFieldV704649(e,'nhanXet'));if(v&&!entryNotes.some(x=>normalize(x)===normalize(v)))entryNotes.push(v);});
    if(entryNotes.length)return entryNotes.join(' / ');
    return clean(teachingFieldV704649(cellData,'nhanXet'));
  }


  function renderCompactSpecialBookV29(res,mondayOfWeek){
    const tbody=document.getElementById('sodbTableBody');
    const table=tbody?.closest('table');
    if(table)table.classList.add('compact-special-book-v29');

    const dayOrder={'Thứ 2':0,'Thứ 3':1,'Thứ 4':2,'Thứ 5':3,'Thứ 6':4,'Thứ 7':5,'Chủ Nhật':6};
    const rows=Object.entries(res.matrix||{}).map(([key,cell])=>{
      const p=key.split('_');
      return {key,thu:p[0]||'',buoi:p[1]||'',tiet:Number(p[2]||0),cell};
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

    if(!rows.length){
      tbody.innerHTML='<tr><td colspan="12" class="text-warning py-3 text-center">Tuần này chưa có tiết phát sinh.</td></tr>';
      return;
    }

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
        const sigCell=renderSignatureCell(c,true);
        const buoiLabel=r.buoi==='Sang'?'S':'C';
        out+=`<tr class="${i===0&&dayIdx>0?'row-day-start':''}">`;
        if(i===0){
          out+=`<td rowspan="${dayRows.length}" class="compact-day-v29 text-center align-middle"><div>${escapeHtml(thu)}</div><div>${dateFormatted}</div></td>`;
        }
        out+=`
          <td class="compact-slot-v29"><span class="badge ${r.buoi==='Sang'?'text-primary':'text-danger'} buoi-tag">${buoiLabel}</span> ${r.tiet}</td>
          <td class="text-left-cell"><div class="a3-cell-clamp-v56 a3-one-line-v56">${renderPeriodStatusBadgeV683(c)}${renderMixedField(c,'mon')}</div></td>
          <td class="fw-bold text-primary">${renderMixedField(c,'tietCT')}</td>
          <td class="text-left-cell"><div class="a3-cell-clamp-v56 a3-one-line-v56">${escapeHtml(c.hsVang||'')}</div></td>
          <td class="text-left-cell"><div class="a3-cell-clamp-v56">${renderMixedField(c,'tenBai')}</div></td>
          <td class="text-left-cell"><div class="a3-cell-clamp-v56">${escapeHtml(sodbNhanXetSafeV83(c))}</div></td>
          <td>${c.diemHT||''}</td>
          <td>${c.diemKL||''}</td>
          <td>${c.diemNN||''}</td>
          <td class="fw-bold">${c.diemTB||''}</td>
          <td>${sigCell}</td>
        </tr>`;
      });
    });
    tbody.innerHTML=out;
    hydrateSignatureFallbackPlaceholdersV704637(tbody,false);
  }

  function getBghSessionV684(){
    return currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions?currentUnifiedLoginV4.sessions.BGH:null;
  }
  function applyBghApprovalV684(approval,chot){
    const space=document.getElementById('printBGHSigSpace'),name=document.getElementById('printBGHName'),title=document.getElementById('printBGHTitle'),panel=document.getElementById('bghWeekApprovalV684'),state=document.getElementById('bghApprovalStateV684'),note=document.getElementById('bghApprovalNoteV684'),meta=document.getElementById('bghApprovalMetaV684'),hint=document.getElementById('bghApprovalHintV684'),btn=document.getElementById('bghApproveBtnV684');
    const priorApproval=!!(approval&&approval.success),stale=priorApproval&&!!approval.dataChanged,hasApproval=priorApproval&&!stale;
    if(title)title.innerHTML=(approval&&approval.success)?bghSignatureTitleHtmlV7046495(approval):'HIỆU TRƯỞNG';
    if(space&&name){
      if(hasApproval){
        const sigRaw=String(approval.chuKyBGH||approval.kySo||approval.signatureRef||''),sigUrl=normalizeSignatureUrlV67_1(sigRaw);
        if(sigUrl)space.innerHTML=`<img src="${escapeHtml(sigUrl)}" class="sig-bgh-print" alt="Chữ ký BGH" onerror="handleSignatureImageErrorV682(this)">`;
        else space.innerHTML='<span class="badge bg-primary" style="font-size:.55rem;">✓ Đã duyệt</span>';
        space.style.position='relative';space.innerHTML+=stampHtmlV704649(approval);
        name.textContent=approval.tenBGH||'';
      }else if(stale){
        space.innerHTML='<span class="badge bg-danger" style="font-size:.55rem;">⚠ Cần duyệt lại</span>';name.textContent='';
      }else{space.innerHTML='<span class="text-muted" style="font-size:.55rem;">Chưa duyệt</span>';name.textContent='';}
    }
    const bgh=getBghSessionV684(),mode=String(document.getElementById('viewBookMode')?.value||'LOP_CHINH'),selectedClass=String(document.getElementById('viewLop')?.value||''),isGroup=['CHUYEN_DE','GDTC'].includes(String(loaiSoTheoLopV22(selectedClass)||'')); // V70.4.6.17
    if(panel)panel.classList.toggle('d-none',!(bgh&&bgh.sessionToken));if(!(bgh&&bgh.sessionToken))return;
    if(note)note.value=priorApproval?(approval.ykien||''):'';
    if(state){state.textContent=stale?'Dữ liệu đã thay đổi':hasApproval?'Đã duyệt':'Chưa duyệt';state.className='badge '+(stale?'bg-danger':hasApproval?'bg-primary':'bg-secondary');}
    if(meta){
      if(stale)meta.textContent=`Lần duyệt trước: ${approval.tenBGH||'BGH'}${approval.time?' · '+approval.time:''}. Dữ liệu thay đổi${approval.dataChangedAt?' lúc '+approval.dataChangedAt:''}; cần kiểm tra và duyệt lại.`;
      else meta.textContent=hasApproval?`Đã duyệt bởi ${approval.tenBGH||'BGH'}${approval.time?' · '+approval.time:''}${approval.chucVu?' · '+approval.chucVu:''}`:'';
    }
    const gvcnClosed=!!(chot&&chot.success);if(btn){btn.disabled=!gvcnClosed;btn.textContent=stale?'Duyệt lại & ký':hasApproval?'Cập nhật duyệt & ký':'Duyệt & ký chốt';}
    if(hint){hint.textContent=!gvcnClosed?(isGroup?'GV phụ trách nhóm chưa ký chốt tuần. BGH sẽ duyệt sau khi giáo viên hoàn tất ký chốt.':'GVCN chưa ký chốt tuần. BGH sẽ duyệt sau khi GVCN hoàn tất ký chốt.'):stale?'Dữ liệu của lớp/tuần đã thay đổi sau lần BGH duyệt. Chữ ký cũ không còn được coi là trạng thái duyệt hiện hành; hãy rà soát rồi duyệt lại.':'BGH có thể duyệt/cập nhật duyệt bất kỳ thời điểm nào; không áp dụng mốc 12h/18h hoặc giới hạn ngày.';}
  }

  async function guiDuyetTuanBGHV684(){
    const bgh=getBghSessionV684();
    if(!bgh?.sessionToken){showToastV9('Tài khoản hiện tại không có quyền BGH.','danger');return;}
    const lop=String(document.getElementById('viewLop')?.value||'').trim();
    const tuan=Math.max(1,Math.min(52,parseInt(document.getElementById('viewTuan')?.value)||1));
    const ykien=String(document.getElementById('bghApprovalNoteV684')?.value||'').trim();
    if(!lop){showToastV9('Chưa chọn lớp cần duyệt.','danger');return;}
    const ok=await confirmV13(`Xác nhận BGH duyệt và ký chốt lớp ${lop} - Tuần ${tuan}?`,{title:'Duyệt sổ cuối tuần',confirmText:'Duyệt & ký',danger:false});
    if(!ok)return;
    const btn=document.getElementById('bghApproveBtnV684'),old=btn?.textContent||'Duyệt & ký chốt';
    if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Đang duyệt...';}
    try{
      const mode=String(document.getElementById('viewBookMode')?.value||'LOP_CHINH');
      const classType=String(loaiSoTheoLopV22(lop)||'LOP_CHINH');
      const method=(classType==='CHUYEN_DE'||classType==='GDTC')?'duyetTuanNhomBGHV6951':'duyetTuanBGHV684';
      const revision=typeof bghOpenedReviewV7044!=='undefined'&&bghOpenedReviewV7044?.lop===lop&&Number(bghOpenedReviewV7044?.tuan)===tuan?bghOpenedReviewV7044.revision:null;
      const r=await callSodbEdgeRpcV67(method,[{lop,tuan,ykien,revision,requestId:crypto.randomUUID()},{token:bgh.sessionToken}]);
      if(!r?.success)throw new Error(r?.message||'Không duyệt được tuần.');
      showToastV9(r.message||'Đã duyệt tuần.','success');
      [...sodbViewCacheV6.keys()].filter(k=>String(k).startsWith(lop+'|'+tuan+'|')).forEach(k=>sodbViewCacheV6.delete(k));
      if(typeof invalidateBghWorkflowCacheV701==='function')invalidateBghWorkflowCacheV701();
      await traCuuSoDauBaiTuanGop(true);
    }catch(e){
      showToastV9(e&&e.message?e.message:String(e),'danger');
      if(btn){btn.disabled=false;btn.textContent=old;}
    }
  }

  let sodbViewRequestV704 = 0;
  function traCuuSoDauBaiTuanGop(forceRefreshV6) {
    const lop=document.getElementById('viewLop').value;
    const tuan=parseInt(document.getElementById('viewTuan').value)||1;
    const bookMode=document.getElementById('viewBookMode')?.value||'LOP_CHINH';
    const tbody=document.getElementById('sodbTableBody');
    if(!lop){
      showToastV9('Vui lòng chọn lớp cần xem.','danger');
      return Promise.resolve(null);
    }
    const requestIdV704 = ++sodbViewRequestV704;
    window.sodbWorkspace?.loading();
    const titleEl=document.querySelector('#printPageSingle .so-title');
    if(titleEl)titleEl.textContent=tieuDeSoTheoLopV22(lop,bookMode);
    const lbl=document.getElementById('lblLop'); if(lbl)lbl.innerText=lop;
    document.getElementById('lblTuan').innerText=tuan;

    const partsStart=START_DATE_WEEK1_STR.split('-');
    const startDateWeek1=new Date(parseInt(partsStart[0]),parseInt(partsStart[1])-1,parseInt(partsStart[2]));
    const mondayOfWeek=new Date(startDateWeek1);
    mondayOfWeek.setDate(startDateWeek1.getDate()+(tuan-1)*7);

    const cacheKey=String(lop)+'|'+String(tuan)+'|'+String(bookMode);
    const cached=sodbViewCacheV6.get(cacheKey);

    function applyChotV10(chotRes){
      const space=document.getElementById('printGVCNSigSpace');
      const nameElem=document.getElementById('printGVCNName');
      const ykienElem=document.getElementById('printGVCNYKien');
      if(!space||!nameElem||!ykienElem)return;
      if(chotRes&&chotRes.success){
        ykienElem.innerText=chotRes.ykien||'Không có ý kiến.';
        nameElem.innerText=chotRes.tenGVCN||'';
        const gvcnSigRaw=String(chotRes.chuKyGVCN||chotRes.kySo||chotRes.signatureRef||'');
        const gvcnSigUrl=normalizeSignatureUrlV67_1(gvcnSigRaw);
        if(gvcnSigUrl){
          space.innerHTML=`<img src="${escapeHtml(gvcnSigUrl)}" class="sig-gvcn-print" alt="Chữ ký GVCN" onerror="handleSignatureImageErrorV682(this)">`;
        }else{
          space.innerHTML='<span class="badge bg-success" style="font-size:.55rem;">✓ Đã ký chốt</span>';
        }
      }else{
        ykienElem.innerText='Chưa có ý kiến...';
        nameElem.innerText='';
        space.innerHTML='<span class="text-muted" style="font-size:.58rem;">Chưa chốt ký</span>';
      }
    }

    function renderPageV10(payload){
      if(requestIdV704 !== sodbViewRequestV704) return;
      window.sodbWorkspace?.render(payload, {lop,tuan,bookMode,mondayOfWeek});
      const res=payload&&payload.sodb?payload.sodb:payload;
      const table=tbody?.closest('table');
      if(table)table.classList.remove('compact-special-book-v29');
      const serverTitle=(payload&&payload.bookTitle)||res?.bookTitle||tieuDeSoTheoLopV22(lop,bookMode);
      const titleNow=document.querySelector('#printPageSingle .so-title');if(titleNow)titleNow.textContent=serverTitle;
      if(typeof applyGroupBookUiV6951==='function')applyGroupBookUiV6951(payload,lop,tuan,bookMode);
      if(!res||!res.success){
        tbody.innerHTML='<tr><td colspan="12" class="text-danger py-3 text-center">Không thể tải dữ liệu sổ đầu bài.</td></tr>';
        return;
      }
      if(res.foundCount===0){
        tbody.innerHTML=`<tr><td colspan="12" class="text-warning py-3 text-center">Chưa có dữ liệu lớp ${escapeHtml(lop)} - Tuần ${tuan}</td></tr>`;
        applyChotV10(payload&&payload.chot);
        applyBghApprovalV684(payload&&payload.bghDuyet,payload&&payload.chot);
        if(typeof renderReviewV7044==='function')renderReviewV7044(payload?.review||null);
        return;
      }

      if(res.compactBook||res.bookType==='GDTC'||res.bookType==='CHUYEN_DE'){
        renderCompactSpecialBookV29(res,mondayOfWeek);
        document.getElementById('sumVangP').innerText=res.summary.vangP;
        document.getElementById('sumVangKP').innerText=res.summary.vangKP;
        document.getElementById('sumDTB').innerText=res.summary.dtbTuan;
        document.getElementById('sumXepLoai').innerText=Number(res.summary.dtbTuan)>=8?'Loại A':(Number(res.summary.dtbTuan)>=6.5?'Loại B':'Loại C');
        document.getElementById('sumTietChuaKy').innerText=res.summary.soTietChuaKy;
        applyChotV10(payload&&payload.chot);
        applyBghApprovalV684(payload&&payload.bghDuyet,payload&&payload.chot);
        if(typeof renderReviewV7044==='function')renderReviewV7044(payload?.review||null);
        sodbViewCacheV6.set(cacheKey,{ts:Date.now(),res:payload});
        const stamp=document.getElementById('sodbLoadedAtV10');
        if(stamp)stamp.textContent=payload&&payload.serverTime?('Cập nhật: '+payload.serverTime):'';
        return;
      }

      const thuArrFull=[
        {name:'Thứ 2',offset:0},{name:'Thứ 3',offset:1},{name:'Thứ 4',offset:2},
        {name:'Thứ 5',offset:3},{name:'Thứ 6',offset:4},{name:'Thứ 7',offset:5}
      ];
      let out='';
      thuArrFull.forEach((thuObj,dayIdx)=>{
        const currentDate=new Date(mondayOfWeek);
        currentDate.setDate(mondayOfWeek.getDate()+thuObj.offset);
        const dateFormatted=`${String(currentDate.getDate()).padStart(2,'0')}/${String(currentDate.getMonth()+1).padStart(2,'0')}`;
        for(let i=0;i<10;i++){
          const buoi=i<5?'Sang':'Chieu';
          const tiet=i<5?i+1:i-4;
          const key=thuObj.name+'_'+buoi+'_'+tiet;
          const cellData=res.matrix[key]||{};
          const sigCell=renderSignatureCell(cellData,true);
          let rowClass='';
          if(i===0&&dayIdx>0)rowClass='row-day-start';
          else if(i===5)rowClass='row-chieu-start';

          out+=`<tr class="${rowClass}">`;
          if(i===0)out+=`<td rowspan="10" class="fw-bold align-middle bg-light text-center"><div>${thuObj.name}</div><div class="text-dark" style="font-size:.55rem;">${dateFormatted}</div></td>`;
          out+=`
            <td class="fw-bold"><span class="badge ${buoi==='Sang'?'text-primary':'text-danger'} buoi-tag">${buoi==='Sang'?'S':'C'}</span> ${tiet}</td>
            <td class="text-left-cell">${renderPeriodStatusBadgeV683(cellData)}${renderMixedField(cellData,'mon')}</td>
            <td class="fw-bold text-primary">${renderMixedField(cellData,'tietCT')}</td>
            <td class="text-left-cell" style="font-size:.7rem;">${escapeHtml(cellData.hsVang||'')}</td>
            <td class="text-left-cell">${renderMixedField(cellData,'tenBai')}</td>
            <td class="text-left-cell" style="font-size:.7rem;">${escapeHtml(sodbNhanXetSafeV83(cellData))}</td>
            <td>${cellData.diemHT||''}</td>
            <td>${cellData.diemKL||''}</td>
            <td>${cellData.diemNN||''}</td>
            <td class="fw-bold">${cellData.diemTB||''}</td>
            <td>${sigCell}</td>
          </tr>`;
        }
      });
      tbody.innerHTML=out;
      hydrateSignatureFallbackPlaceholdersV704637(tbody,false);
      document.getElementById('sumVangP').innerText=res.summary.vangP;
      document.getElementById('sumVangKP').innerText=res.summary.vangKP;
      document.getElementById('sumDTB').innerText=res.summary.dtbTuan;
      document.getElementById('sumXepLoai').innerText=Number(res.summary.dtbTuan)>=8?'Loại A':(Number(res.summary.dtbTuan)>=6.5?'Loại B':'Loại C');
      document.getElementById('sumTietChuaKy').innerText=res.summary.soTietChuaKy;
      applyChotV10(payload&&payload.chot);
      applyBghApprovalV684(payload&&payload.bghDuyet,payload&&payload.chot);
        if(typeof renderReviewV7044==='function')renderReviewV7044(payload?.review||null);
      sodbViewCacheV6.set(cacheKey,{ts:Date.now(),res:payload});
      const stamp=document.getElementById('sodbLoadedAtV10');
      if(stamp)stamp.textContent=payload&&payload.serverTime?('Cập nhật: '+payload.serverTime):'';
    }

    if(!forceRefreshV6&&cached&&Date.now()-cached.ts<SODB_VIEW_CACHE_MS_V6){
      renderPageV10(cached.res);
      return Promise.resolve(cached.res);
    }

    tbody.innerHTML=`
      <tr><td colspan="12" class="py-4 text-center">
        <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
        <span class="text-muted">Đang tải sổ đầu bài...</span>
      </td></tr>`;
    const viewPerfStartedV63=performance.now();
    return new Promise((resolve,reject)=>{
      google.script.run
        .withSuccessHandler(function(payload){
          console.info('[V66 PERF] Xem sổ tổng:',Math.round(performance.now()-viewPerfStartedV63)+'ms','server:',(payload&&payload.serverMs!==undefined?payload.serverMs:'—')+'ms',lop,'Tuần '+tuan,bookMode);
          renderPageV10(payload);
          resolve(payload);
        })
        .withFailureHandler(function(err){
          if(requestIdV704 !== sodbViewRequestV704){resolve(null);return;}
          window.sodbWorkspace?.error();
          tbody.innerHTML='<tr><td colspan="12" class="text-danger py-3 text-center">Không thể tải dữ liệu. Vui lòng thử lại.</td></tr>';
          showToastV9('Không tải được sổ đầu bài: '+(err&&err.message?err.message:err),'danger');
          reject(err);
        })
        .layTrangSoDauBaiV24(lop,tuan,bookMode,getAnyAuthV6());
    });
  }

  /* HÀM CẬP NHẬT TUẦN, THỨ VÀ KIỂM TRA CHẶN NHẬP NGÀY TƯƠNG LAI */
function capNhatTuanVaThu() {
  let dateVal = document.getElementById('ngayDay').value;
  if (!dateVal) return;

  let selectedDate = new Date(dateVal);
  selectedDate.setHours(0, 0, 0, 0);

  let today = new Date();
  today.setHours(0, 0, 0, 0);

  // KIỂM TRA: KHÔNG CHO PHÉP CHỌN NGÀY TƯƠNG LAI
  if (selectedDate > today) {
    showToastV9('Không được nhập trước tiết học cho ngày trong tương lai.','danger');
    
    // Tự động trả về ngày hôm nay
    let yyyy = today.getFullYear();
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('ngayDay').value = `${yyyy}-${mm}-${dd}`;
    
    selectedDate = today;
  }

  let startDate = new Date(START_DATE_WEEK1_STR);
  startDate.setHours(0, 0, 0, 0);

  let diffDays = Math.floor((selectedDate - startDate) / (1000 * 60 * 60 * 24));
  let tuan = Math.floor(diffDays / 7) + 1;
  document.getElementById('tuanHoc').value = tuan < 1 ? 1 : tuan;
  
  let thuArr = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  document.getElementById('thuDay').value = thuArr[selectedDate.getDay()];
  if (gvbmDangNhapInfo) {
    capNhatMoKhoaTuanCuV685(false);
    loadDanhSachBaiDay();
  }
}

/* CHẶN LẦN NỮA KHI LƯU SỔ ĐẦU BÀI */
/* KHÓA CHỐNG TRÙNG LẶP / LƯU 2 LẦN KHI BẤM NÚT LƯU SỔ ĐẦU BÀI */
let isSodbSubmitting = false; // Biến cờ khóa trạng thái gửi

function newClientRequestIdV54(){
  try{return crypto.randomUUID();}catch(e){return 'REQ-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);}
}
function showSaveSuccessV54(message){
  const box=document.getElementById('saveSuccessV54');
  if(!box)return;
  box.textContent=message;
  box.classList.remove('d-none');
  clearTimeout(showSaveSuccessV54._t);
  showSaveSuccessV54._t=setTimeout(()=>box.classList.add('d-none'),6500);
}
let inputDeadlineLockedV683=false;
function onDayThayToggleV683(){
  const checked=!!document.getElementById('isDayThayV683')?.checked;
  document.getElementById('dayThayBoxV683')?.classList.toggle('d-none',!checked);
  const inp=document.getElementById('gvDuocThayV683');if(inp){inp.required=checked;if(!checked)inp.value='';}
  if(!gvbmDangNhapInfo)return;
  const khoiSel=document.getElementById('khoi'),lopSel=document.getElementById('lop');
  if(checked&&khoiSel&&lopSel){
    const oldK=String(khoiSel.value||'10'),oldL=String(lopSel.value||'');
    khoiSel.innerHTML='';['10','11','12'].forEach(k=>khoiSel.add(new Option('Khối '+k,k)));khoiSel.value=['10','11','12'].includes(oldK)?oldK:'10';
    napLopVaoSelectV22(lopSel,khoiSel.value,true);if(oldL&&[...lopSel.options].some(o=>o.value===oldL))lopSel.value=oldL;
    const note=document.getElementById('phanCongDayNoteV39');if(note){note.textContent='Chế độ dạy thay: được chọn lớp ngoài phân công thường xuyên; môn học vẫn phải thuộc chuyên môn của tài khoản đang đăng nhập.';note.className='small text-warning fw-semibold mb-2';}
  }else if(!checked){capNhatKhoiVaLopPhanCongV39(true);}
  onInputClassChangedV26();capNhatHanNhapTietV683();
}
async function capNhatHanNhapTietV683(){
  const box=document.getElementById('inputDeadlineStatusV683'),btn=document.getElementById('btnSubmit');
  if(!box||!gvbmDangNhapInfo?.sessionToken)return;
  const lop=String(document.getElementById('lop')?.value||''),date=String(document.getElementById('ngayDay')?.value||''),buoi=String(document.getElementById('buoiDay')?.value||'Sáng'),tiet=Number(document.getElementById('tietDay')?.value||0);
  if(!lop||!date||!tiet)return;
  try{
    const r=await callSodbEdgeRpcV67('kiemTraHanNhapTietV683',[lop,date,buoi,tiet,{token:gvbmDangNhapInfo.sessionToken}]);
    inputDeadlineLockedV683=!!r?.locked;
    const deadlineState=String(r?.state||''),approvedLate=deadlineState==='APPROVED_DAY_THAY_LATE';
    box.className='alert border py-2 px-3 mb-3 small '+(r?.locked?'alert-danger':(approvedLate?'alert-success':(['ADMIN_UNLOCK','BULK_WEEK_UNLOCK'].includes(deadlineState)?'alert-warning':'alert-info')));
    box.innerHTML=`<strong>${r?.locked?'Đã khóa':(approvedLate?'Dạy thay đã duyệt':'Thời hạn ký')}:</strong> ${escapeHtml(r?.message||'')}`;
    if(btn&&!isSodbSubmitting)btn.disabled=inputDeadlineLockedV683;
  }catch(err){
    inputDeadlineLockedV683=false;
    box.className='alert alert-warning border py-2 px-3 mb-3 small';
    box.textContent='Chưa kiểm tra được thời hạn nhập tiết. Máy chủ vẫn sẽ kiểm tra khi bấm Lưu.';
  }
}

function resetPeriodFormAfterSaveV54(){
  teachingSuggestV704649();
  // Giữ nguyên đúng các trường thao tác liên tục: Ngày - Lớp - Môn.
  const idsToBlank=['tietDay','tietCT','tenHSVang','nhanXet'];
  idsToBlank.forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const absent=document.getElementById('hsVang');if(absent)absent.value='0';
  if(typeof resetGroupAttendanceAfterSaveV6951==='function')resetGroupAttendanceAfterSaveV6951();
  ['diemHocTap','diemKyLuat','diemNeNep'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='10';});
  const lesson=document.getElementById('tenBaiDaySelect');if(lesson)lesson.value='';
  const custom=document.getElementById('tenBaiDayCustom');if(custom){custom.value='';custom.classList.add('d-none');custom.required=false;}
  const mixed=document.getElementById('isTietTron');if(mixed)mixed.checked=false;
  const dayThay=document.getElementById('isDayThayV683');if(dayThay)dayThay.checked=false;
  const gvThay=document.getElementById('gvDuocThayV683');if(gvThay)gvThay.value='';
  onDayThayToggleV683();
  const proxyToggle=document.getElementById('proxySigningToggleV682');if(proxyToggle)proxyToggle.checked=false;
  const proxyName=document.getElementById('proxyTeacherNameV682');if(proxyName)proxyName.value='';
  const proxyExternal=document.getElementById('proxyExternalStaffIdV693');if(proxyExternal)proxyExternal.value='';
  if(typeof clearInputTeachingOperationV7042==='function')clearInputTeachingOperationV7042();
  else if(typeof currentInputOperationV693!=='undefined')currentInputOperationV693=null;
  const opBanner=document.getElementById('inputOperationBannerV693');if(opBanner){opBanner.classList.add('d-none');opBanner.innerHTML='';}
  configureProxySigningUiV682();
  const c2=document.getElementById('gdtcClass2V26'),c3=document.getElementById('gdtcClass3V26');
  if(c2)c2.value='';if(c3)c3.value='';syncGdtcClassMixNoteV26();
  tinhDiemTB();
}

document.getElementById('sodbForm').addEventListener('submit', function(e) {
  e.preventDefault();
  e.stopPropagation();
  if (isSodbSubmitting) return false;

  let dateVal = document.getElementById('ngayDay').value;
  if (dateVal) {
    let selectedDate = new Date(dateVal);
    selectedDate.setHours(0, 0, 0, 0);

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      showToastV9('Không được nhập trước tiết học cho ngày trong tương lai.','danger');
      return;
    }
  }

  if(gvbmHasGdtcV25() && isGdtcBaseSubjectV25(document.getElementById('monHoc').value) && !getEffectiveMonHocV25()){
    showToastV9('Vui lòng chọn môn dạy GDTC: Cầu lông hoặc Bóng chuyền.','danger');
    return;
  }
  if(gvbmHasTechnologyV657() && isTechnologyBaseSubjectV657(document.getElementById('monHoc').value) && !getEffectiveMonHocV25()){
    showToastV9('Vui lòng chọn Công nghệ nông nghiệp hoặc Công nghệ công nghiệp.','danger');
    return;
  }

  if(typeof validateAttendanceBeforeSaveV7013==='function' && !validateAttendanceBeforeSaveV7013()) return;

  let lesson1 = getSelectedLessonData();
  if (!lesson1 || !lesson1.tenBaiDay) {
    showToastV9('Vui lòng chọn hoặc nhập nội dung bài dạy.','danger');
    return;
  }

  // Tiết trộn: mỗi giáo viên chỉ nhập phần của chính mình. Backend tự ghép 2 GV cùng lớp-ngày-buổi-tiết.
  let isMixed = document.getElementById('isTietTron').checked;

  // V70.4.6.9: kiểm tra điều hành ở frontend chỉ để hiển thị banner, KHÔNG chặn tiết bình thường.
  // Backend rpcSaveSodb luôn tự tra lại hồ sơ điều hành đã duyệt theo session + lớp/ngày/buổi/tiết/môn trước khi commit.
  if(typeof inputTeachingLoadingV7042!=='undefined' && inputTeachingLoadingV7042){showToastV9('Hồ sơ điều hành đang được kiểm tra nền; máy chủ sẽ xác minh lại khi lưu.','info');}
  if(typeof inputTeachingFailedV7042!=='undefined' && inputTeachingFailedV7042){try{refreshTeachingOperationForInputV693();}catch(_e){}showToastV9('Chưa tải được banner điều hành; máy chủ vẫn kiểm tra hồ sơ khi lưu.','warning');}
  const teachingOperation=typeof currentInputOperationV693!=='undefined'?currentInputOperationV693:null;
  const isDayThay=!!(teachingOperation?.id && teachingOperation.loai==='DAY_THAY');
  const gvDuocThay=isDayThay?String(teachingOperation.gvGocName||'').trim():'';
  if(isDayThay&&!gvDuocThay){showToastV9('Hồ sơ dạy thay thiếu tên giáo viên gốc. Vui lòng kiểm tra tại Điều hành.','danger');return;}

  const proxySigningToggle=document.getElementById('proxySigningToggleV682');
  const proxyNameInput=document.getElementById('proxyTeacherNameV682');
  const proxySigning=isSpecialProxySignerV682(gvbmDangNhapInfo) && !!(proxySigningToggle&&proxySigningToggle.checked);
  const proxyTeacherName=String(proxyNameInput&&proxyNameInput.value||'').trim();
  if(proxySigning && !proxyTeacherName){
    showToastV9('Vui lòng nhập họ tên nhân sự được ký thay.','danger');
    return;
  }
  if(proxySigning&&isDayThay&&!currentInputOperationV693?.id){showToastV9('Không bật đồng thời “Dạy thay” và “Ký thay nhân sự ngoài nhà trường”.','danger');return;}
  if(inputDeadlineLockedV683){showToastV9('Tiết đang bị khóa theo thời hạn ký. Nếu cần bổ sung, liên hệ Admin mở khóa.','danger');return;}

  let btn = document.getElementById('btnSubmit');
  isSodbSubmitting = true;
  btn.disabled = true;
  btn.innerText = "⏳ Đang lưu dữ liệu...";
  tinhDiemTB();

  let formData = {
    ...teachingFormV704649(),
    khoi: document.getElementById('khoi').value,
    lop: document.getElementById('lop').value,
    buoiDay: document.getElementById('buoiDay').value,
    ngayDay: document.getElementById('ngayDay').value,
    thuDay: document.getElementById('thuDay').value,
    tuanHoc: document.getElementById('tuanHoc').value,
    tietDay: document.getElementById('tietDay').value,
    monHoc: getEffectiveMonHocV25(),
    tietCT: lesson1.tietCT,
    tenBaiDay: lesson1.tenBaiDay,
    yeuCauCanDat: lesson1.yeuCauCanDat,
    khbdId: lesson1.khbdId || '',
    lessonSource: lesson1.lessonSource || '',
    diemHocTap: document.getElementById('diemHocTap').value,
    diemKyLuat: document.getElementById('diemKyLuat').value,
    diemNeNep: document.getElementById('diemNeNep').value,
    diemTB: varDiemTB,
    xepLoai: varXepLoai,
    hsVang: document.getElementById('hsVang').value,
    tenHSVang: document.getElementById('tenHSVang').value,
    attendanceComplete: (typeof isAttendanceCompleteV701==='function'?isAttendanceCompleteV701():Number(document.getElementById('hsVang')?.value||0)===0),
    absentStudentIds: (typeof getMainAbsentStudentIdsV701==='function'?getMainAbsentStudentIdsV701():[]),
    groupAbsentStudentIds: (typeof getGroupAbsentStudentIdsV6951==='function'?getGroupAbsentStudentIdsV6951():[]),
    tenGV: document.getElementById('tenGV').value,
    cccd: document.getElementById('cccd').value,
    sdtGV1: gvbmDangNhapInfo ? gvbmDangNhapInfo.sdt : "",
    nhanXet: document.getElementById('nhanXet').value,
    trangThaiKySo: urlChuKyGlobal ? ("IMAGE:" + urlChuKyGlobal) : "Đã ký",
    isTietTron: isMixed,
    isDayThay: isDayThay,
    gvDuocThay: gvDuocThay,
    proxySigning: proxySigning,
    proxyTeacherName: proxyTeacherName,
    proxyExternalStaffId: String(document.getElementById('proxyExternalStaffIdV693')?.value||''),
    operationId: currentInputOperationV693&&currentInputOperationV693.id||'',
    gdtcClasses: getGdtcClassMixV26(),
    clientRequestId: newClientRequestIdV54()
  };

  let wasEditingV4 = !!editingRecordIdV4;
  let runnerV4 = google.script.run
    .withSuccessHandler(function(res) {
      isSodbSubmitting = false;
      btn.disabled = false;
      btn.innerText = "Lưu vào Sổ Đầu Bài";

      if (res.success) {
        const signerSuffix=(formData.proxySigning&&formData.proxyTeacherName?` (ký thay: ${formData.proxyTeacherName})`:'')+(formData.isDayThay&&formData.gvDuocThay?` (dạy thay: ${formData.gvDuocThay})`:'');
        const savedText=wasEditingV4
          ? `✓ Đã cập nhật Tiết ${formData.tietDay} – ${formData.monHoc} – ${formData.lop}${signerSuffix}`
          : `✓ Đã lưu Tiết ${formData.tietDay} – ${formData.monHoc} – ${formData.lop}${signerSuffix}`;
        showSaveSuccessV54(savedText);
        showToastV9(savedText,'success');
        overviewStateV20.loadedAt=0;
        if(typeof invalidateBghWorkflowCacheV701==='function')invalidateBghWorkflowCacheV701();
        lastSavedRecordV4 = {recordId:res.recordId, lop:formData.lop, tuan:formData.tuanHoc, ngay:formData.ngayDay, buoi:formData.buoiDay, tiet:formData.tietDay};
        let reqBtn=document.getElementById('btnRequestEditV4'); if(reqBtn) reqBtn.classList.remove('d-none');
        if(wasEditingV4) {
          editingRecordIdV4=null;
          document.getElementById('btnCancelEditV4').classList.add('d-none');
          btn.classList.remove('btn-warning'); btn.classList.add('btn-primary');
        }else{
          resetPeriodFormAfterSaveV54();
        }
        invalidateSodbViewCacheV47(formData.lop,formData.tuanHoc);
        delete lessonPlanCache[[formData.khoi,formData.lop,formData.monHoc,formData.tuanHoc].join('|')];
        document.getElementById('viewLop').value=formData.lop;document.getElementById('viewTuan').value=formData.tuanHoc;
        // V55: ẩn ngay bài vừa dùng, sau đó bắt buộc hỏi lại backend để đồng bộ
        // toàn bộ danh sách còn lại của đúng Lớp + Môn + Tuần.
        hideJustUsedLessonV55(formData.tenBaiDay);
        loadDanhSachBaiDay(true);
      } else { 
        showToastV9("Lỗi: " + (res.message || "Không thể lưu dữ liệu."), "danger"); 
      }
    })
    .withFailureHandler(function(err) {
      isSodbSubmitting = false;
      btn.disabled = false;
      btn.innerText = "Lưu vào Sổ Đầu Bài";
      showToastV9("Lỗi kết nối máy chủ: " + err, "danger");
    });
  let authV4={token: gvbmDangNhapInfo ? gvbmDangNhapInfo.sessionToken : ""};
  if(wasEditingV4){
    formData.recordId=editingRecordIdV4;
    runnerV4.capNhatSoDauBaiV4(formData,authV4);
  }else{
    runnerV4.luuSoDauBai(formData,authV4);
  }
});

  function getSelectedLessonData() {
    let selectValue = document.getElementById('tenBaiDaySelect').value;
    if (selectValue === "KHAC") {
      return {
        tenBaiDay: document.getElementById('tenBaiDayCustom').value.trim(),
        tietCT: document.getElementById('tietCT').value.trim(),
        yeuCauCanDat: "",
        khbdId: "",
        lessonSource: (typeof currentExternalProgramPolicyV7044!=='undefined'&&currentExternalProgramPolicyV7044?.lessonSource)||"NHAP_THUC_TE"
      };
    }
    if (selectValue.indexOf("PLAN_") === 0) {
      let plan = danhSachBaiDay1[Number(selectValue.replace("PLAN_", ""))];
      if (!plan) return null;
      return {
        tenBaiDay: plan.tenBai,
        // V70.4.6.21: giá trị giáo viên đang nhập/đã chỉnh tay luôn được ưu tiên.
        // Nếu ô Tiết CT chưa có giá trị thì mới dùng gợi ý tự động từ KHBD/PPCT.
        tietCT: document.getElementById('tietCT').value.trim() || lessonPeriodCodeV704620(plan),
        // Không hiển thị ô YCCĐ ở tab nhập tiết; vẫn giữ dữ liệu KHBD tự động để tương thích dữ liệu cũ.
        yeuCauCanDat: plan.yeuCauCanDat || "",
        khbdId: plan.khbdId || plan.id || "",
        lessonSource: "KHBD_TRUONG"
      };
    }
    return null;
  }

  // V70.4.6.16: dùng một quy tắc cho khối 10/11/12.
  // Tiết CT đặc biệt lấy MÃ trực tiếp từ TÊN BÀI, không lấy số PPCT thường.
  // BH1/BH 1 -> BH1; CĐ1/CD 1/Chuyên đề 1 -> CĐ1.
  function specialLessonPeriodCodeV70612(plan){
    if(!plan)return '';
    const raw=String(plan.tenBai||'').trim();
    const title=raw.toUpperCase();
    const bh=title.match(/^BH\s*(\d+)?(?:\s*[-.:]|$)/);
    if(bh)return bh[1]?`BH${bh[1]}`:'BH';
    const cd=title.match(/^(?:CĐ|CD|CHUYÊN\s+ĐỀ|CHUYEN\s+DE)\s*(\d+)?(?:\s*[-.:]|$)/);
    if(cd)return cd[1]?`CĐ${cd[1]}`:'CĐ';
    return '';
  }

  // V70.4.6.20: nhận diện ngữ cảnh GDTC để Tiết CT bám đúng PPCT của bộ môn.
  function isGdtcLessonContextV704620(){
    const lop=document.getElementById('lop')?.value||'';
    const meta=typeof getClassMetaClientV26==='function'?getClassMetaClientV26(lop):null;
    const rawMon=document.getElementById('monHoc')?.value||'';
    const effective=typeof getEffectiveMonHocV25==='function'?getEffectiveMonHocV25():rawMon;
    return String(meta?.type||'').toUpperCase()==='GDTC'
      || (typeof isGdtcBaseSubjectV25==='function'&&isGdtcBaseSubjectV25(rawMon))
      || (typeof isGdtcDetailSubjectV25==='function'&&isGdtcDetailSubjectV25(effective));
  }
  function lessonPeriodCodeV704620(plan){
    if(!plan)return '';
    if(isGdtcLessonContextV704620())return String(plan.tietPPCT||'').trim();
    return specialLessonPeriodCodeV70612(plan)||String(plan.tietPPCT||'').trim();
  }

  function fillLessonSelect(selectElement, plans) {
    const policy=(typeof currentExternalProgramPolicyV7044!=='undefined'?currentExternalProgramPolicyV7044:null),mode=String(policy?.khbdMode||'OPTIONAL').toUpperCase();
    if(policy&&mode==='NONE'){
      selectElement.innerHTML='<option value="KHAC">➕ Nhập nội dung tiết dạy thực tế...</option>';
      selectElement.value='KHAC';
      setTimeout(()=>{try{dongBoTenBaiDay();}catch(_e){}},0);
      return;
    }
    selectElement.innerHTML = '<option value="">-- Chọn KHBD tuần này hoặc bài còn tồn --</option>';
    plans.forEach((plan, index) => {
      const gdtc=isGdtcLessonContextV704620();
      const special=gdtc?'':specialLessonPeriodCodeV70612(plan);
      let prefix = special ? "" : (plan.tietPPCT ? `PPCT ${plan.tietPPCT} — ` : "");
      if(plan.carryover)prefix=`↪ Tồn Tuần ${plan.plannedWeek||plan.tuan} · `+prefix;
      selectElement.add(new Option(prefix + plan.tenBai, `PLAN_${index}`));
    });
    if(!(policy&&mode==='REQUIRED'))selectElement.add(new Option("➕ Nhập tên bài dạy khác...", "KHAC"));
  }

  function hideJustUsedLessonV55(lessonName){
    const key=normalizeTextKey(lessonName||'');
    if(!key)return;
    // Ẩn ngay trên giao diện, không chờ request backend hoàn tất.
    danhSachBaiDay1=(danhSachBaiDay1||[]).filter(p=>normalizeTextKey(p&&p.tenBai||'')!==key);
    const sel=document.getElementById('tenBaiDaySelect');
    if(sel)fillLessonSelect(sel,danhSachBaiDay1);
  }

  function lessonPlanCacheKeyV54(){
    return [
      document.getElementById('khoi')?.value||'',
      document.getElementById('lop')?.value||'',
      getEffectiveMonHocV25(),
      document.getElementById('tuanHoc')?.value||'',
      document.getElementById('ngayDay')?.value||'',
      document.getElementById('proxyExternalStaffIdV693')?.value||'',
      (typeof currentInputOperationV693!=='undefined'&&currentInputOperationV693?.id)||''
    ].join('|');
  }

  function loadDanhSachBaiDay(forceRefresh) {
    const metaV26=getClassMetaClientV26(document.getElementById('lop')?.value||'');
    if(metaV26&&(metaV26.type==='CHUYEN_DE'||metaV26.type==='GDTC')&&metaV26.subject){
      // V70.4.6.5: bảo đảm lớp GDTC khôi phục đúng môn nền/nhánh khi mở lại form.
      ensureTeacherSubjectOptionV26(metaV26.subject);
    }
    configureGdtcInputV25();
    configureTechnologyInputV657();
    let mon = getEffectiveMonHocV25();
    let khoi = document.getElementById('khoi').value;
    let tuan = document.getElementById('tuanHoc').value;
    let selectBai = document.getElementById('tenBaiDaySelect');
    danhSachBaiDay1 = [];
    document.getElementById('tenBaiDayCustom').classList.add('d-none');
    document.getElementById('tenBaiDayCustom').required = false;
    document.getElementById('tietCT').value = "";
    if (!mon) {
      if(gvbmHasGdtcV25() && isGdtcBaseSubjectV25(document.getElementById('monHoc').value)){
        selectBai.innerHTML='<option value="">-- Chọn Cầu lông hoặc Bóng chuyền trước --</option>';
        document.getElementById('khbdWeekNotice').innerText='Chọn Môn dạy GDTC để tải đúng kế hoạch bài dạy.';
      }else if(gvbmHasTechnologyV657() && isTechnologyBaseSubjectV657(document.getElementById('monHoc').value)){
        selectBai.innerHTML='<option value="">-- Chọn Công nghệ nông nghiệp hoặc Công nghệ công nghiệp trước --</option>';
        document.getElementById('khbdWeekNotice').innerText='Chọn nhánh môn Công nghệ để tải đúng kế hoạch bài dạy.';
      }
      return;
    }

    let cacheKey = lessonPlanCacheKeyV54();
    if (!forceRefresh && lessonPlanCache[cacheKey]) {
      danhSachBaiDay1 = lessonPlanCache[cacheKey];
      fillLessonSelect(selectBai, danhSachBaiDay1);
      const carryCount=danhSachBaiDay1.filter(x=>x&&x.carryover).length;
      document.getElementById('khbdWeekNotice').innerText = danhSachBaiDay1.length
        ? `Đã nạp ${danhSachBaiDay1.length} bài cho Tuần ${tuan}${carryCount?` · có ${carryCount} KHBD còn tồn từ tuần trước`:''}.`
        : `Không có KHBD khả dụng cho Khối ${khoi} — ${mon} — Tuần ${tuan}. Có thể KHBD chưa được duyệt, giáo viên chưa tích nhận tuần này, hoặc bài đã dùng hết.`;
      return;
    }

    if(forceRefresh)delete lessonPlanCache[cacheKey];
    selectBai.innerHTML = '<option value="">-- Đang tải kế hoạch tuần... --</option>';
    // Request thường không chồng nhau; nhưng forceRefresh sau khi Lưu luôn được phép
    // tạo request mới. Phản hồi của request cũ sẽ bị serial bên dưới loại bỏ.
    if(lessonPlanPendingV47.has(cacheKey) && !forceRefresh)return;
    const requestSerial=(lessonPlanRequestSerialV55[cacheKey]||0)+1;
    lessonPlanRequestSerialV55[cacheKey]=requestSerial;
    lessonPlanPendingV47.add(cacheKey);
    google.script.run
      .withSuccessHandler(function(dsBai) {
        if(lessonPlanRequestSerialV55[cacheKey]!==requestSerial)return;
        lessonPlanPendingV47.delete(cacheKey);
        const rows=dsBai||[];
        lessonPlanCache[cacheKey]=rows;
        const currentKey=lessonPlanCacheKeyV54();
        if(currentKey!==cacheKey)return;
        danhSachBaiDay1 = rows;
        fillLessonSelect(selectBai, danhSachBaiDay1);
        const carryCount=danhSachBaiDay1.filter(x=>x&&x.carryover).length;
        document.getElementById('khbdWeekNotice').innerText = danhSachBaiDay1.length
          ? `Còn ${danhSachBaiDay1.length} bài khả dụng cho Tuần ${tuan}${carryCount?` · ${carryCount} bài tồn được ưu tiên ở đầu danh sách`:''}.`
          : `Không còn KHBD khả dụng cho Khối ${khoi} — ${mon} — Tuần ${tuan}. Kiểm tra Kế hoạch bài dạy → KHBD của tôi hoặc bài đã dùng hết.`;
      })
      .withFailureHandler(function(err) {
        if(lessonPlanRequestSerialV55[cacheKey]!==requestSerial)return;
        lessonPlanPendingV47.delete(cacheKey);
        const currentKey=lessonPlanCacheKeyV54();
        if(currentKey!==cacheKey)return;
        selectBai.innerHTML = '<option value="KHAC">➕ Nhập tên bài dạy khác...</option>';
        document.getElementById('khbdWeekNotice').innerText = "Không tải được kế hoạch: " + err;
      })
      .getDanhSachBaiDayTheoMon(mon, khoi, tuan, document.getElementById('ngayDay')?.value||'', document.getElementById('lop').value, {token: gvbmDangNhapInfo ? gvbmDangNhapInfo.sessionToken : '', dayThay: !!document.getElementById('isDayThayV683')?.checked, externalStaffId: document.getElementById('proxyExternalStaffIdV693')?.value||''});
  }

  function dongBoTenBaiDay() {
    let selectVal = document.getElementById('tenBaiDaySelect').value;
    let customInput = document.getElementById('tenBaiDayCustom');
    if (selectVal === "KHAC") {
      customInput.classList.remove('d-none');
      customInput.required = true;
      document.getElementById('tietCT').value = "";
    } else {
      customInput.classList.add('d-none');
      customInput.required = false;
      let plan = selectVal.indexOf("PLAN_") === 0 ? danhSachBaiDay1[Number(selectVal.replace("PLAN_", ""))] : null;
      document.getElementById('tietCT').value = plan ? lessonPeriodCodeV704620(plan) : "";
    }
  }

  function tinhDiemTB() {
    let ht = parseFloat(document.getElementById('diemHocTap').value) || 0;
    let kl = parseFloat(document.getElementById('diemKyLuat').value) || 0;
    let nn = parseFloat(document.getElementById('diemNeNep').value) || 0;
    varDiemTB = Math.round(((ht + kl + nn) / 3) * 10) / 10;
  }

  function traCuuVaLoadChuKy() {
    let cccdInput = document.getElementById('cccd').value.trim();
    if (!cccdInput) return;
    google.script.run.withSuccessHandler(function(res) {
      if (res.success) {
        document.getElementById('tenGV').value = res.tenGV;
        capNhatTrangThaiChuKyV21(res.urlChuKy||"");
      } else { alertV13("❌ " + res.message); }
    }).traCuuChuKyTheoCCCD(cccdInput,{token:gvbmDangNhapInfo?gvbmDangNhapInfo.sessionToken:""});
  }

  function chonAnhChuKyV21(){
    const input=document.getElementById('fileInput');
    if(input){ input.value=''; input.click(); }
  }

  function setSigStatusV21(text,type){
    const el=document.getElementById('sigSaveStatusV21');
    if(!el)return;
    el.classList.remove('d-none','status-saving','status-success','status-error');
    if(!text){el.classList.add('d-none');el.textContent='';return;}
    el.textContent=text;
    el.classList.add(type==='success'?'status-success':type==='error'?'status-error':'status-saving');
  }

  function capNhatTrangThaiChuKyV21(url){
    url=normalizeSignatureUrlV67_1(url);
    urlChuKyGlobal=url;
    const img=document.getElementById('sigImage');
    const placeholder=document.getElementById('sigPlaceholder');
    const btnDelete=document.getElementById('btnDeleteSignatureV21');
    const btnUpload=document.getElementById('btnUploadSignatureV21');
    if(url){
      if(img){setSignaturePreviewSrcV682(img,url);img.classList.remove('d-none');}
      if(placeholder)placeholder.classList.add('d-none');
      if(btnDelete)btnDelete.classList.remove('d-none');
      if(btnUpload)btnUpload.textContent='Đổi ảnh chữ ký';
    }else{
      if(img){img.removeAttribute('src');img.classList.add('d-none');}
      if(placeholder)placeholder.classList.remove('d-none');
      if(btnDelete)btnDelete.classList.add('d-none');
      if(btnUpload)btnUpload.textContent='Tải ảnh chữ ký';
    }
  }

  function xuLyTaiAnhChuKyLocal(event) {
    const file=event&&event.target&&event.target.files?event.target.files[0]:null;
    if(!file)return;
    if(!/^image\//i.test(file.type||'')){
      showToastV9('Vui lòng chọn đúng file ảnh chữ ký.','danger');
      return;
    }
    if(file.size>5000000){
      showToastV9('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5 MB.','danger');
      return;
    }

    setSigStatusV21('Đang xử lý ảnh chữ ký...','saving');
    const reader=new FileReader();
    reader.onload=function(e){
      const tempImg=document.createElement('img');
      tempImg.src=e.target.result;
      tempImg.onload=function(){
        xoaNenAnhChuKy(tempImg,function(processedDataUrl){
          // Preview ảnh đã xử lý trước khi gửi Supabase Storage.
          capNhatTrangThaiChuKyV21(processedDataUrl);
          setSigStatusV21('Đang lưu chữ ký vào Supabase Storage...','saving');

          google.script.run
            .withSuccessHandler(function(res){
              if(res&&res.success){
                capNhatTrangThaiChuKyV21(res.urlChuKy||'');
                if(gvbmDangNhapInfo){gvbmDangNhapInfo.urlChuKy=res.urlChuKy||'';gvbmDangNhapInfo.signatureRef=res.signatureRef||'';gvbmDangNhapInfo.signaturePath=res.signaturePath||'';}
                if(currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions){
                  if(currentUnifiedLoginV4.sessions.GVBM){currentUnifiedLoginV4.sessions.GVBM.urlChuKy=res.urlChuKy||'';currentUnifiedLoginV4.sessions.GVBM.signatureRef=res.signatureRef||'';currentUnifiedLoginV4.sessions.GVBM.signaturePath=res.signaturePath||'';}
                  if(currentUnifiedLoginV4.sessions.GVCN){currentUnifiedLoginV4.sessions.GVCN.urlChuKy=res.urlChuKy||'';currentUnifiedLoginV4.sessions.GVCN.signatureRef=res.signatureRef||'';currentUnifiedLoginV4.sessions.GVCN.signaturePath=res.signaturePath||'';}
                }
                if(gvcnDangNhapInfo){
                  gvcnDangNhapInfo.urlChuKy=res.urlChuKy||'';
                  urlGVCNGlobal=res.urlChuKy||'';
                }
                setSigStatusV21(res.message||'Đã lưu chữ ký.','success');
                showToastV9('Đã lưu chữ ký vào Supabase Storage.','success');
              }else{
                capNhatTrangThaiChuKyV21('');
                setSigStatusV21((res&&res.message)||'Không lưu được chữ ký.','error');
                showToastV9((res&&res.message)||'Không lưu được chữ ký.','danger');
              }
            })
            .withFailureHandler(function(err){
              capNhatTrangThaiChuKyV21('');
              const msg='Không lưu được chữ ký: '+(err&&err.message?err.message:err);
              setSigStatusV21(msg,'error');
              showToastV9(msg,'danger');
            })
            .luuChuKyGiaoVienV21(processedDataUrl,{token:gvbmDangNhapInfo?gvbmDangNhapInfo.sessionToken:""});
        });
      };
      tempImg.onerror=function(){
        setSigStatusV21('Không đọc được file ảnh.','error');
      };
    };
    reader.readAsDataURL(file);
  }

  async function xoaChuKyGiaoVienV21Ui(){
    if(!gvbmDangNhapInfo||!gvbmDangNhapInfo.sessionToken)return;
    const ok=await confirmV13('Xóa chữ ký đã lưu khỏi hồ sơ giáo viên?',{
      title:'Xóa chữ ký',
      confirmText:'Xóa chữ ký',
      danger:true
    });
    if(!ok)return;

    setSigStatusV21('Đang xóa chữ ký...','saving');
    google.script.run
      .withSuccessHandler(function(res){
        if(res&&res.success){
          capNhatTrangThaiChuKyV21('');
          if(gvbmDangNhapInfo){gvbmDangNhapInfo.urlChuKy='';gvbmDangNhapInfo.signatureRef='';gvbmDangNhapInfo.signaturePath='';}
          if(currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions){
            if(currentUnifiedLoginV4.sessions.GVBM){currentUnifiedLoginV4.sessions.GVBM.urlChuKy='';currentUnifiedLoginV4.sessions.GVBM.signatureRef='';currentUnifiedLoginV4.sessions.GVBM.signaturePath='';}
            if(currentUnifiedLoginV4.sessions.GVCN){currentUnifiedLoginV4.sessions.GVCN.urlChuKy='';currentUnifiedLoginV4.sessions.GVCN.signatureRef='';currentUnifiedLoginV4.sessions.GVCN.signaturePath='';}
          }
          if(gvcnDangNhapInfo){gvcnDangNhapInfo.urlChuKy='';urlGVCNGlobal='';}
          setSigStatusV21(res.message||'Đã xóa chữ ký.','success');
          showToastV9('Đã xóa chữ ký.','success');
        }else{
          setSigStatusV21((res&&res.message)||'Không xóa được chữ ký.','error');
        }
      })
      .withFailureHandler(function(err){
        setSigStatusV21('Không xóa được chữ ký: '+(err&&err.message?err.message:err),'error');
      })
      .xoaChuKyGiaoVienV21({token:gvbmDangNhapInfo.sessionToken});
  }


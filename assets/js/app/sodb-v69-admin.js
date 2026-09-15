  /* ======================== GIAO DIỆN V4 ======================== */
  async function guiYeuCauSuaBanGhiV4(){
    if(!lastSavedRecordV4||!gvbmDangNhapInfo)return;
    const lyDo=await promptV13('Vui lòng nêu lý do cần chỉnh sửa bản ghi vừa lưu.',{
      title:'Yêu cầu chỉnh sửa',
      label:'Lý do chỉnh sửa',
      placeholder:'Ví dụ: nhập nhầm nội dung bài dạy...'
    });
    if(!lyDo||!lyDo.trim())return;
    let payload=Object.assign({},lastSavedRecordV4,{lyDo:lyDo.trim()});
    google.script.run.withSuccessHandler(function(res){
      alertV13((res&&res.success?'✅ ':'❌ ')+(res?res.message:'Không gửi được yêu cầu'));
    }).guiYeuCauChinhSuaV4(payload,{token:gvbmDangNhapInfo.sessionToken});
  }


  function taiYeuCauChinhSuaAdminV4(){
    if(!adminDangNhapInfo)return;
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success)return;
      document.getElementById('editRequestsBodyV4').innerHTML=(res.data||[]).map(x=>`<tr><td>${escapeHtml(x.time)}</td><td>${escapeHtml(x.nguoi)}<br><small>${escapeHtml(x.sdt)}</small></td><td>${escapeHtml(x.lop)} / W${escapeHtml(x.tuan)} / ${escapeHtml(x.buoi)} T${escapeHtml(x.tiet)}</td><td>${escapeHtml(x.lyDo)}</td><td>${escapeHtml(x.trangThai)}</td><td>${x.trangThai==='CHỜ DUYỆT'?`<button class="btn btn-success btn-sm me-1" onclick="xuLyYeuCauAdminV4(decodeURIComponent('${encodeURIComponent(String(x.id||''))}'),'DUYỆT')">Duyệt</button><button class="btn btn-danger btn-sm" onclick="xuLyYeuCauAdminV4(decodeURIComponent('${encodeURIComponent(String(x.id||''))}'),'TỪ CHỐI')">Từ chối</button>`:''}</td></tr>`).join('');
    }).layYeuCauChinhSuaV4({token:adminDangNhapInfo.sessionToken});
  }
  async function xuLyYeuCauAdminV4(id,decision){
    const note=await promptV13('Có thể ghi chú lý do xử lý yêu cầu này. Nếu không cần, để trống và tiếp tục.',{
      title:decision==='DUYỆT'?'Duyệt yêu cầu chỉnh sửa':'Từ chối yêu cầu chỉnh sửa',
      label:'Ghi chú xử lý',
      placeholder:'Ghi chú (không bắt buộc)',
      confirmText:decision==='DUYỆT'?'Duyệt yêu cầu':'Xác nhận từ chối',
      danger:decision!=='DUYỆT'
    });
    if(note===null)return;
    google.script.run.withSuccessHandler(function(res){
      alertV13((res&&res.success?'✅ ':'❌ ')+(res?res.message:''));
      taiYeuCauChinhSuaAdminV4();
    }).xuLyYeuCauChinhSuaV4(id,decision,note||'',{token:adminDangNhapInfo.sessionToken});
  }
  function getAdminAuthV69(){
    const token=(adminDangNhapInfo&&adminDangNhapInfo.sessionToken)||(currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions&&currentUnifiedLoginV4.sessions.ADMIN&&currentUnifiedLoginV4.sessions.ADMIN.sessionToken)||'';
    return {token};
  }
  function taiQuyenDacBietV69(){
    const body=document.getElementById('specialPermissionBodyV69');
    if(!body||!hasRoleV4('ADMIN'))return;
    body.innerHTML='<tr><td colspan="6" class="text-center text-muted">Đang tải...</td></tr>';
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){body.innerHTML='<tr><td colspan="6" class="text-center text-danger">'+escapeHtml(res&&res.message||'Không tải được dữ liệu')+'</td></tr>';return;}
      const rows=res.data||[];
      body.innerHTML=rows.length?rows.map(r=>{
        const active=r.kich_hoat!==false;
        const range=escapeHtml(String(r.tu_ngay||''))+' → '+escapeHtml(String(r.den_ngay||'Không giới hạn'));
        return `<tr><td class="fw-semibold">${escapeHtml(r.tai_khoan||'')}</td><td>${escapeHtml(r.quyen||'')}</td><td>${range}</td><td>${escapeHtml(r.ly_do||'')}</td><td>${active?'<span class="badge text-bg-success">Đang hiệu lực</span>':'<span class="badge text-bg-secondary">Đã thu hồi</span>'}</td><td>${active?`<button type="button" class="btn btn-sm btn-outline-danger" onclick="thuHoiQuyenDacBietUiV69(decodeURIComponent('${encodeURIComponent(String(r.id||''))}'))">Thu hồi</button>`:''}</td></tr>`;
      }).join(''):'<tr><td colspan="6" class="text-center text-muted">Chưa cấp quyền đặc biệt nào.</td></tr>';
    }).withFailureHandler(function(err){body.innerHTML='<tr><td colspan="6" class="text-center text-danger">'+escapeHtml((err&&err.message)||String(err||'Lỗi'))+'</td></tr>';}).layQuyenDacBietV69(getAdminAuthV69());
  }
  function luuQuyenDacBietUiV69(){
    const account=String(document.getElementById('specialPermissionAccountV69')?.value||'').trim();
    const quyen=String(document.getElementById('specialPermissionCodeV69')?.value||'PROXY_SIGN').trim();
    const tuNgay=String(document.getElementById('specialPermissionFromV69')?.value||'').trim();
    const denNgay=String(document.getElementById('specialPermissionToV69')?.value||'').trim();
    const lyDo=String(document.getElementById('specialPermissionReasonV69')?.value||'').trim();
    if(!account){showToastV9('Vui lòng nhập tài khoản cần cấp quyền.','danger');return;}
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){showToastV9(res&&res.message||'Không cấp được quyền.','danger');return;}
      showToastV9('Đã cấp quyền đặc biệt V69.','success');
      taiQuyenDacBietV69();
    }).withFailureHandler(function(err){showToastV9((err&&err.message)||String(err||'Lỗi'),'danger');}).luuQuyenDacBietV69({taiKhoan:account,quyen,tuNgay,denNgay,lyDo,kichHoat:true},getAdminAuthV69());
  }
  function thuHoiQuyenDacBietUiV69(id){
    const reason=prompt('Lý do thu hồi quyền:','Thu hồi phân quyền V69');
    if(reason===null)return;
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){showToastV9(res&&res.message||'Không thu hồi được quyền.','danger');return;}
      showToastV9('Đã thu hồi quyền.','success');taiQuyenDacBietV69();
    }).withFailureHandler(function(err){showToastV9((err&&err.message)||String(err||'Lỗi'),'danger');}).thuHoiQuyenDacBietV69(String(id||''),String(reason||''),getAdminAuthV69());
  }

  function taiNhatKyAdminV4(){
    if(!adminDangNhapInfo)return;
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success)return;
      document.getElementById('auditBodyV4').innerHTML=(res.data||[]).map(x=>`<tr><td>${escapeHtml(x.time)}</td><td>${escapeHtml(x.role)}</td><td>${escapeHtml(x.ten||x.sdt)}</td><td>${escapeHtml(x.action)}</td><td>${escapeHtml(x.target)}</td><td>${escapeHtml(x.reason)}</td></tr>`).join('');
    }).layNhatKyV4(150,{token:adminDangNhapInfo.sessionToken});
  }
  function saoLuuNgayV4(){
    google.script.run.withSuccessHandler(function(res){document.getElementById('systemStatusV4').innerText=(res&&res.success?'✅ Đã sao lưu: '+res.name:'❌ '+(res?res.message:'Lỗi'));})
      .saoLuuDuLieuV4({token:adminDangNhapInfo.sessionToken});
  }
  function kiemTraToanVenV4(){
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){document.getElementById('systemStatusV4').innerText='❌ '+(res?res.message:'Lỗi');return;}
      document.getElementById('systemStatusV4').innerText=`🔏 Đã kiểm ${res.checked} bản ghi V4; lỗi toàn vẹn: ${res.invalidCount}; bản ghi cũ/chưa ký: ${res.legacyCount}.`;
    }).kiemTraToanVenDuLieuV4({token:adminDangNhapInfo.sessionToken});
  }

  function kiemTraSupabaseKHBDV61Ui(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken){
      alertV13('⚠️ Phiên Admin không hợp lệ.');return;
    }
    setBusyV13(true,'Đang kiểm tra Supabase...');
    const status=document.getElementById('systemStatusV4');
    google.script.run
      .withSuccessHandler(function(res){
        setBusyV13(false);
        if(!res||!res.success){
          if(status)status.textContent='❌ Supabase: '+(res&&res.message?res.message:'Không kiểm tra được kết nối.');
          return;
        }
        const count=(res.khbdCount===null||res.khbdCount===undefined)?'?':res.khbdCount;
        if(status)status.textContent=`✅ Supabase KHBD hoạt động bình thường · ${count} dòng KHBD · ${res.latencyMs||0} ms · chế độ ${res.mode||'PRIMARY'}.`;
        showToastV9('Supabase KHBD đang hoạt động.','success');
      })
      .withFailureHandler(function(err){
        setBusyV13(false);
        if(status)status.textContent='❌ '+(err&&err.message?err.message:'Không kết nối được máy chủ.');
      })
      .kiemTraSupabaseKHBDV61({token:adminDangNhapInfo.sessionToken});
  }


  function kiemTraSupabaseSoDauBaiV62Ui(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken){alertV13('⚠️ Phiên Admin không hợp lệ.');return;}
    const status=document.getElementById('systemStatusV4');setBusyV13(true,'Đang kiểm tra Supabase Sổ đầu bài...');
    google.script.run.withSuccessHandler(function(res){
      setBusyV13(false);if(!res||!res.success){if(status)status.textContent='❌ Supabase SĐB: '+(res&&res.message?res.message:'Không kiểm tra được.');return;}
      const count=(res.count===null||res.count===undefined)?'?':res.count;
      if(status)status.textContent=`✅ Supabase SĐB hoạt động · ${count} bản ghi · ${res.latencyMs||0} ms · chế độ ${res.mode||'MIRROR'}.`;
      showToastV9('Supabase Sổ đầu bài đang hoạt động.','success');
    }).withFailureHandler(function(err){setBusyV13(false);if(status)status.textContent='❌ '+(err&&err.message?err.message:'Không kết nối được máy chủ.');})
      .kiemTraSupabaseSoDauBaiV62({token:adminDangNhapInfo.sessionToken});
  }
  async function dongBoSoDauBaiSupabaseV62Ui(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken){alertV13('⚠️ Phiên Admin không hợp lệ.');return;}
    const ok=await confirmV13('Đồng bộ toàn bộ bản ghi Sổ đầu bài hiện có Record ID từ Google Sheet sang Supabase? Sau khi thành công hệ thống sẽ tự chuyển SĐB sang chế độ PRIMARY. Google Sheet không bị xóa.',{title:'Đồng bộ Sổ đầu bài',confirmText:'Đồng bộ và bật PRIMARY'});if(!ok)return;
    const status=document.getElementById('systemStatusV4');setBusyV13(true,'Đang đồng bộ Sổ đầu bài sang Supabase...');
    google.script.run.withSuccessHandler(function(res){
      setBusyV13(false);if(!res||!res.success){if(status)status.textContent='❌ '+(res&&res.message?res.message:'Đồng bộ thất bại.');return;}
      if(status)status.textContent=`✅ ${res.message} Đã quét ${res.scanned||0} dòng, bỏ qua ${res.skipped||0} dòng cũ chưa có Record ID.`;
      showToastV9('Đã bật Supabase PRIMARY cho Sổ đầu bài.','success');
    }).withFailureHandler(function(err){setBusyV13(false);if(status)status.textContent='❌ '+(err&&err.message?err.message:'Không đồng bộ được.');})
      .dongBoSoDauBaiSupabaseV62({token:adminDangNhapInfo.sessionToken});
  }
  function lamNongCacheV62Ui(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken){alertV13('⚠️ Phiên Admin không hợp lệ.');return;}
    const status=document.getElementById('systemStatusV4');setBusyV13(true,'Đang làm nóng cache đăng nhập...');
    google.script.run.withSuccessHandler(function(res){setBusyV13(false);if(status)status.textContent=(res&&res.success?'⚡ '+res.message+' '+(res.elapsedMs||0)+' ms.':'❌ '+(res&&res.message||'Không làm nóng được cache.'));})
      .withFailureHandler(function(err){setBusyV13(false);if(status)status.textContent='❌ '+(err&&err.message?err.message:'Không kết nối được máy chủ.');})
      .lamNongCacheV62({token:adminDangNhapInfo.sessionToken});
  }

  function taiFileMauLopV23(){
    if (retryWithXlsxV7(() => taiFileMauLopV23())) return;
    const rows=[["Khối","Tên lớp","Nhóm sổ","Môn/KHBD","Trạng thái","Thứ tự"]];
    let order=1;
    ["10","11","12"].forEach(k=>{
      for(let i=1;i<=13;i++)rows.push([k,`${k}A${String(i).padStart(2,'0')}`,"Lớp chính","","Đang dùng",order++]);
    });
    // Dòng mẫu nhóm độc lập. Nhà trường có thể đặt BC1, CL2... và khai báo Môn/KHBD tương ứng.
    rows.push([10,"BC1","GDTC","Bóng chuyền","Ngừng",90]);
    rows.push([10,"CL2","GDTC","Cầu lông","Ngừng",91]);
    // 13 dòng mẫu chuyên đề 12: nhập tên lớp thực tế + môn, rồi đổi trạng thái thành Đang dùng.
    for(let i=1;i<=13;i++){
      rows.push([12,`12 Chuyên đề ${String(i).padStart(2,'0')}`,"Chuyên đề","","Ngừng",100+i]);
    }
    const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:8},{wch:26},{wch:18},{wch:22},{wch:14},{wch:10}];
    XLSX.utils.book_append_sheet(wb,ws,"Lớp");
    XLSX.writeFile(wb,"FileMau_DanhSachLop.xlsx");
  }

  function docFileExcelLopV23(event){
    if(!window.XLSX){
      const input=event&&event.target;
      ensureXlsxV7().then(()=>docFileExcelLopV23({target:input})).catch(err=>alertV13('❌ '+(err.message||err)));
      return;
    }
    const f=event.target.files[0];
    if(!f)return;
    const rd=new FileReader();
    rd.onload=function(e){
      try{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
        const preferred=wb.SheetNames.find(n=>normalizeTextKey(n)==='lop')||wb.SheetNames[0];
        const ws=wb.Sheets[preferred];
        const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        parsedLopDataV23=(rows||[]).slice(1).filter(r=>r.some(v=>String(v).trim()!==''));
        document.getElementById('lopPreviewV23').innerText=`Đã đọc ${parsedLopDataV23.length} dòng lớp từ sheet "${preferred}".`;
      }catch(err){
        parsedLopDataV23=[];
        alertV13('❌ File danh sách lớp không hợp lệ: '+err);
      }
    };
    rd.readAsArrayBuffer(f);
  }

  function applyClassCatalogV23(res){
    if(!res)return;
    const mainCls=res.mainClasses||{}, specialCls=res.specialClasses||{}, cls=res.classes||{};
    classMetaV26=normalizeClassMetaV29(res.classMeta||{});
    ['10','11','12'].forEach(k=>{
      dsLopChinhTheoKhoiV22[k]=mainCls[k]||[];
      dsLopDacBietTheoKhoiV22[k]=specialCls[k]||[];
      dsLopTheoKhoi[k]=cls[k]||[...(dsLopChinhTheoKhoiV22[k]||[]),...(dsLopDacBietTheoKhoiV22[k]||[])];
    });
    chonKhoiLopView();chonKhoiLopInput();chonKhoiLopAdmin();khoiTaoDanhSachLopGiamThi();
    try{sessionStorage.removeItem('SODB_V6_BOOTSTRAP');sessionStorage.removeItem(bootstrapCacheKeyV62());}catch(e){}
  }


  function themMauChuyenDe12V27Ui(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken)return;
    setBusyV13(true,'Đang thêm mẫu Chuyên đề 12...');
    google.script.run
      .withSuccessHandler(function(res){
        setBusyV13(false);
        alertV13((res&&res.success?'✅ ':'❌ ')+(res?res.message:''));
        if(res&&res.success){
          applyClassCatalogV23(res);
          const p=document.getElementById('lopPreviewV23');
          if(p)p.innerText=res.added
            ? `Đã thêm ${res.added} dòng Chuyên đề 12. Hãy điền Môn/KHBD và đổi Trạng thái thành "Đang dùng".`
            : 'Đã có đủ mẫu Chuyên đề 12 trong sheet Lớp.';
        }
      })
      .withFailureHandler(function(err){
        setBusyV13(false);
        alertV13('❌ Không thêm được mẫu Chuyên đề 12: '+(err&&err.message?err.message:err));
      })
      .themMauChuyenDe12V27({token:adminDangNhapInfo.sessionToken});
  }

  function themLopChuyenDeV27Ui(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken)return;
    const lop=String(document.getElementById('specialClassNameV27')?.value||'').trim();
    const mon=String(document.getElementById('specialClassSubjectV27')?.value||'').trim();
    if(!lop){alertV13('⚠️ Vui lòng nhập tên lớp chuyên đề.');return;}
    if(!mon){alertV13('⚠️ Vui lòng nhập Môn/KHBD.');return;}

    setBusyV13(true,'Đang thêm lớp chuyên đề...');
    google.script.run
      .withSuccessHandler(function(res){
        setBusyV13(false);
        alertV13((res&&res.success?'✅ ':'❌ ')+(res?res.message:''));
        if(res&&res.success){
          applyClassCatalogV23(res);
          document.getElementById('specialClassNameV27').value='';
          document.getElementById('specialClassSubjectV27').value='';
          const p=document.getElementById('lopPreviewV23');
          if(p)p.innerText=res.message||'Đã cập nhật lớp chuyên đề.';
        }
      })
      .withFailureHandler(function(err){
        setBusyV13(false);
        alertV13('❌ Không thêm được lớp chuyên đề: '+(err&&err.message?err.message:err));
      })
      .themLopChuyenDeV27(lop,mon,{token:adminDangNhapInfo.sessionToken});
  }

  function taoSheetLopV23Ui(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken)return;
    google.script.run
      .withSuccessHandler(function(res){
        alertV13((res&&res.success?'✅ ':'❌ ')+(res?res.message:''));
        if(res&&res.success){
          document.getElementById('lopPreviewV23').innerText=`Sheet "${res.sheetName}" hiện có ${res.rows} lớp.`;
          google.script.run.withSuccessHandler(applyBootstrapV6).getBootstrapClientV6(tokenMapFromLoginV4(currentUnifiedLoginV4));
        }
      })
      .taoSheetLopV23({token:adminDangNhapInfo.sessionToken});
  }

  function uploadLopV23(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken)return;
    if(!parsedLopDataV23.length){alertV13('⚠️ Chưa chọn file danh sách lớp.');return;}
    const mode=document.getElementById('lopModeV23').value;
    google.script.run
      .withSuccessHandler(function(res){
        alertV13((res&&res.success?'✅ ':'❌ ')+(res?res.message:''));
        if(res&&res.success){
          applyClassCatalogV23(res);
          document.getElementById('lopPreviewV23').innerText=`Đã import ${res.rows||0} lớp. Dropdown lớp đã được cập nhật.`;
          parsedLopDataV23=[];
          const input=document.getElementById('lopFileV23');if(input)input.value='';
        }
      })
      .withFailureHandler(function(err){alertV13('❌ Không import được danh sách lớp: '+(err&&err.message?err.message:err));})
      .capNhatDanhSachLopV23(parsedLopDataV23,mode,{token:adminDangNhapInfo.sessionToken});
  }

  function taiFileMauHSV4(){
  if (retryWithXlsxV7(() => taiFileMauHSV4())) return;
    let data=[["Lớp","Mã HS","Họ tên","Trạng thái"],["10A01","HS001","Nguyễn Văn B","Đang học"]];
    let wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(data);XLSX.utils.book_append_sheet(wb,ws,"DanhSachHocSinh");XLSX.writeFile(wb,"FileMau_DanhSachHocSinh_V4.xlsx");
  }
  function docFileExcelHSV4(event){
  if (!window.XLSX) { const input = event && event.target; ensureXlsxV7().then(() => docFileExcelHSV4({target: input})).catch(err => alertV13('❌ ' + (err.message || err))); return; }
    let f=event.target.files[0];if(!f)return;let rd=new FileReader();
    rd.onload=function(e){try{let wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});parsedHSDataV4=(rows||[]).slice(1).filter(r=>r.some(v=>String(v).trim()!==''));document.getElementById('hsPreviewV4').innerText=`Đã đọc ${parsedHSDataV4.length} học sinh.`;}catch(err){parsedHSDataV4=[];alertV13('❌ File học sinh không hợp lệ: '+err);}};
    rd.readAsArrayBuffer(f);
  }
  function uploadHSV4(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken)return;
    if(!parsedHSDataV4.length){alertV13('⚠️ Chưa chọn file học sinh.');return;}
    google.script.run.withSuccessHandler(function(res){alertV13((res&&res.success?'✅ ':'❌ ')+(res?res.message:''));})
      .capNhatDanhSachHocSinhV4(parsedHSDataV4,document.getElementById('hsModeV4').value,{token:adminDangNhapInfo.sessionToken});
  }
  async function doiMatKhauAdminUiV4(){
    if(!adminDangNhapInfo)return;
    const oldPw=await promptV13('Nhập mật khẩu Admin hiện tại.',{
      title:'Đổi mật khẩu Admin',label:'Mật khẩu hiện tại',type:'password'
    });
    if(!oldPw)return;
    const newPw=await promptV13('Nhập mật khẩu mới. Mật khẩu nên có ít nhất 8 ký tự, gồm chữ và số.',{
      title:'Đổi mật khẩu Admin',label:'Mật khẩu mới',type:'password'
    });
    if(!newPw)return;
    google.script.run.withSuccessHandler(function(res){
      alertV13((res&&res.success?'✅ ':'❌ ')+(res?res.message:''));
      if(res&&res.success)location.reload();
    }).doiMatKhauAdminV4(oldPw,newPw,{token:adminDangNhapInfo.sessionToken});
  }
  function luuCauHinhUiV4(){
    if(!adminDangNhapInfo)return;
    let cfg={SCHOOL_YEAR:document.getElementById('cfgSchoolYearV4').value.trim(),WEEK1_START:document.getElementById('cfgWeek1V4').value,TKB_STRICT:document.getElementById('cfgTkbStrictV4').value};
    google.script.run.withSuccessHandler(function(res){alertV13((res&&res.success?'✅ ':'❌ ')+(res?res.message:''));if(res&&res.success&&cfg.WEEK1_START)START_DATE_WEEK1_STR=cfg.WEEK1_START;})
      .luuCauHinhV4(cfg,{token:adminDangNhapInfo.sessionToken});
  }


  function taiDanhSachBackupV4(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken)return;
    let sel=document.getElementById('backupSelectV4');sel.innerHTML='<option>⏳ Đang tải...</option>';
    google.script.run.withSuccessHandler(function(res){
      sel.innerHTML='<option value="">-- Chọn bản sao --</option>';
      if(!res||!res.success){alertV13('❌ '+(res?res.message:'Không tải được backup'));return;}
      (res.data||[]).forEach(function(x){sel.add(new Option(`${x.createdAt} — ${x.name}`,x.id));});
    }).lietKeBanSaoLuuV4({token:adminDangNhapInfo.sessionToken});
  }
  function phucHoiBackupUiV4(){
    return phucHoiBackupUiV11();
  }


  function taiYeuCauCuaToiV4(){
    if(!gvbmDangNhapInfo||!gvbmDangNhapInfo.sessionToken)return;
    let box=document.getElementById('myEditRequestsV4');box.innerHTML='⏳ Đang tải...';
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){box.innerHTML='❌ '+(res?escapeHtml(res.message):'Không tải được');return;}
      if(!res.data.length){box.innerHTML='<span class="text-muted">Chưa có yêu cầu chỉnh sửa.</span>';return;}
      box.innerHTML=res.data.map(function(x){
        let canEdit=x.trangThai==='ĐÃ DUYỆT';
        return `<div class="border rounded p-2 mb-1"><b>${escapeHtml(x.lop)} - Tuần ${escapeHtml(x.tuan)} - ${escapeHtml(x.buoi)} Tiết ${escapeHtml(x.tiet)}</b> · ${escapeHtml(x.trangThai)}<br><span class="text-muted">${escapeHtml(x.lyDo)}</span>${canEdit?`<br><button type="button" class="btn btn-warning btn-sm mt-1" onclick="taiBanGhiSuaV4(decodeURIComponent('${encodeURIComponent(String(x.recordId||''))}'))">✏️ Tải bản ghi để sửa</button>`:''}</div>`;
      }).join('');
    }).layYeuCauCuaToiV4({token:gvbmDangNhapInfo.sessionToken});
  }

  function taiBanGhiSuaV4(recordId){
    if(!recordId||!gvbmDangNhapInfo)return;
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){alertV13('❌ '+(res?res.message:'Không tải được bản ghi'));return;}
      let x=res.data;
      document.getElementById('ngayDay').value=x.ngay;
      document.getElementById('khoi').value=String(x.khoi||'').match(/\d+/)?.[0]||String(x.lop||'').match(/\d+/)?.[0]||'10';
      chonKhoiLopInput();document.getElementById('lop').value=x.lop;
      document.getElementById('buoiDay').value=x.buoi;
      document.getElementById('tietDay').value=String(x.tiet);
      capNhatTuanVaThu();
      if(isGdtcDetailSubjectV25(x.mon) && gvbmHasGdtcV25()){
        const baseMon=getGdtcBaseOptionValueV25();
        if(baseMon)document.getElementById('monHoc').value=baseMon;
        configureGdtcInputV25();
        configureTechnologyInputV657();
        document.getElementById('gdtcTeachingSubjectV25').value=x.mon;
      }else if(isTechnologyDetailSubjectV657(x.mon) && gvbmHasTechnologyV657()){
        const baseMon=getTechnologyBaseOptionValueV657();
        if(baseMon)document.getElementById('monHoc').value=baseMon;
        configureGdtcInputV25();
        configureTechnologyInputV657();
        document.getElementById('technologyTeachingSubjectV657').value=x.mon;
      }else{
        document.getElementById('monHoc').value=x.mon;
        configureGdtcInputV25();
        configureTechnologyInputV657();
      }
      document.getElementById('tietCT').value=x.tietCT||'';
      let sel=document.getElementById('tenBaiDaySelect');
      sel.innerHTML='<option value="KHAC">✏️ Nội dung đang chỉnh sửa</option>';sel.value='KHAC';
      let custom=document.getElementById('tenBaiDayCustom');custom.classList.remove('d-none');custom.required=true;custom.value=x.tenBai||'';
      document.getElementById('diemHocTap').value=x.diemHocTap;
      document.getElementById('diemKyLuat').value=x.diemKyLuat;
      document.getElementById('diemNeNep').value=x.diemNeNep;
      document.getElementById('hsVang').value=x.hsVang;
      document.getElementById('tenHSVang').value=x.tenHSVang||'';
      if(typeof refreshGroupAttendanceV6951==='function')setTimeout(()=>refreshGroupAttendanceV6951(Array.isArray(x.groupAbsentStudentIds)?x.groupAbsentStudentIds:[]),80);
      document.getElementById('nhanXet').value=x.nhanXet||'';
      document.getElementById('isTietTron').checked=!!x.isTietTron;
      if(Array.isArray(x.gdtcClasses)&&x.gdtcClasses.length){
        populateGdtcClassOptionsV26();
        const extra=x.gdtcClasses.filter(c=>c&&c!==x.lop);
        const c2=document.getElementById('gdtcClass2V26'),c3=document.getElementById('gdtcClass3V26');
        if(c2)c2.value=extra[0]||'';
        if(c3)c3.value=extra[1]||'';
        syncGdtcClassMixNoteV26();
      }
      editingRecordIdV4=recordId;
      let btn=document.getElementById('btnSubmit');btn.innerText='💾 Lưu chỉnh sửa đã được duyệt';btn.classList.remove('btn-primary');btn.classList.add('btn-warning');
      document.getElementById('btnCancelEditV4').classList.remove('d-none');
      window.scrollTo({top:document.getElementById('sodbForm').offsetTop-20,behavior:'smooth'});
    }).layBanGhiCuaToiV4(recordId,{token:gvbmDangNhapInfo.sessionToken});
  }

  function huyCheDoSuaV4(){
    editingRecordIdV4=null;
    let btn=document.getElementById('btnSubmit');btn.innerText='Lưu vào Sổ Đầu Bài';btn.classList.remove('btn-warning');btn.classList.add('btn-primary');
    document.getElementById('btnCancelEditV4').classList.add('d-none');
    loadDanhSachBaiDay();
  }




  /* ===== V9 DASHBOARD + UX ===== */
  function showToastV9(message, type){
    const stack=document.getElementById('toastStackV9');
    if(!stack){ console.log(message); return; }
    const el=document.createElement('div');
    el.className='toast-v9 '+(type||'success');
    el.textContent=message||'';
    stack.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-4px)'; el.style.transition='all .2s ease'; },3200);
    setTimeout(()=>el.remove(),3500);
  }

  function openTopTabV9(id){
    const btn=document.getElementById(id);
    if(!btn || btn.closest('li')?.classList.contains('d-none') || btn.closest('li')?.style.display==='none'){ showToastV9('Tài khoản hiện tại không có quyền sử dụng chức năng này.','danger'); return; }
    if(window.bootstrap&&bootstrap.Tab) bootstrap.Tab.getOrCreateInstance(btn).show();
  }

  /* V20: một yêu cầu cho một vai trò; bỏ phản hồi cũ khi đổi phạm vi. */
  let overviewStateV20={serial:0,pending:'',key:'',loadedAt:0,data:null,list:'recent',page:0};
  function schoolDateV20(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const pick=t=>parts.find(x=>x.type===t).value;
    return pick('year')+'-'+pick('month')+'-'+pick('day');
  }
  function resetOverviewV20(){
    overviewStateV20={serial:overviewStateV20.serial+1,pending:'',key:'',loadedAt:0,data:null,list:'recent',page:0};
    const sel=document.getElementById('overviewRoleV20');if(sel)sel.innerHTML='';
    const date=document.getElementById('overviewDateV20');if(date)date.value=schoolDateV20();
    document.getElementById('overviewRowsV20').innerHTML='';
    document.getElementById('overviewMetricsV20').innerHTML='';
  }
  function setupOverviewV20(){
    if(!currentUnifiedLoginV4)return false;
    const sessions=currentUnifiedLoginV4.sessions||{},sel=document.getElementById('overviewRoleV20');
    const roles=['BGH','ADMIN','GIAM_THI','TTCM','GVCN','GVBM'].filter(r=>sessions[r]&&sessions[r].sessionToken);
    const old=sel.value;
    if([...sel.options].map(x=>x.value).join('|')!==roles.join('|')){
      sel.replaceChildren();roles.forEach(r=>sel.add(new Option(roleLabelV4(r),r)));
      if(roles.includes(old))sel.value=old;
    }
    document.getElementById('overviewRoleWrapV20').classList.toggle('d-none',roles.length<2);
    const day=document.getElementById('overviewDateV20');day.max=schoolDateV20();if(!day.value)day.value=day.max;
    return !!sel.value;
  }
  function changeOverviewRoleV20(){
    document.getElementById('overviewClassV20').innerHTML='';
    refreshDashboardV9(true);
  }
  function overviewActionV20(tab){
    if(tab==='gvcn-tab' && gvcnDangNhapInfo && overviewStateV20.data){
      gvcnDangNhapInfo.lop=overviewStateV20.data.lop;
      const sel=document.getElementById('gvcnAuthorizedClassV4');
      if(sel){
        const normalize=x=>String(x).replace(/([A-Z])0+(\d+)$/,'$1$2');
        const match=[...sel.options].find(o=>normalize(o.value)===normalize(gvcnDangNhapInfo.lop));
        if(match){sel.value=match.value;gvcnDangNhapInfo.lop=match.value;}
      }
      document.getElementById('gvcnWelcomeMsg').textContent='Lớp chủ nhiệm: '+gvcnDangNhapInfo.lop;
      document.getElementById('gvcnTuan').value=overviewStateV20.data.week;
      document.getElementById('gvcnSummaryContent').classList.add('d-none');
    }
    openTopTabV9(tab);
  }

  function renderOverviewActionsV20(role){
    const actions={
      GVBM:[['Nhập tiết học','input-tab'],['Xem sổ đầu bài','view-tab']],
      GVCN:[['Kiểm tra và chốt tuần','gvcn-tab'],['Xem sổ đầu bài','view-tab']],
      TTCM:[['Kế hoạch bài dạy','ttcm-tab'],['Điều hành tiết dạy','control-tab-v693']],
      BGH:[['Điều hành tiết dạy','control-tab-v693'],['Kế hoạch bài dạy','ttcm-tab'],['Xem sổ đầu bài','view-tab']],
      GIAM_THI:[['Điều hành tiết dạy','control-tab-v693'],['Tra cứu, thống kê','giamthi-tab']],
      ADMIN:[['Điều hành tiết dạy','control-tab-v693'],['Quản trị hệ thống','admin-tab']]
    };
    document.getElementById('overviewActionsV20').innerHTML=(actions[role]||[]).map((a,i)=>
      `<button type="button" class="btn ${i?'btn-outline-primary':'btn-primary'}" onclick="overviewActionV20('${a[1]}')">${escapeHtml(a[0])}</button>`).join('');
  }
  function refreshDashboardV9(force){
    if(!setupOverviewV20())return;
    const role=document.getElementById('overviewRoleV20').value;
    const session=currentUnifiedLoginV4.sessions[role];
    const classSelect=document.getElementById('overviewClassV20');
    const titles={BGH:'Dashboard Ban Giám hiệu',GIAM_THI:'Dashboard Giám thị',GVBM:'Dashboard Giáo viên',GVCN:'Dashboard Giáo viên chủ nhiệm',TTCM:'Dashboard Tổ chuyên môn',ADMIN:'Dashboard Quản trị'};
    document.getElementById('overviewTitleV52').textContent=titles[role]||'Dashboard';
    document.getElementById('overviewRoleBadgeV52').textContent=roleLabelV4(role);
    const dashEl=document.getElementById('tabDashboardV9');if(dashEl){[...dashEl.classList].filter(c=>c.startsWith('overview-role-')&&c.endsWith('-v52')).forEach(c=>dashEl.classList.remove(c));dashEl.classList.add('overview-role-'+role.toLowerCase().replace('_','')+'-v52');}
    document.getElementById('overviewClassWrapV20').classList.toggle('d-none',role!=='GVCN');
    if(role==='GVCN'&&!classSelect.options.length){
      (session.dsLop&&session.dsLop.length?session.dsLop:[session.lop]).filter(Boolean).forEach(l=>classSelect.add(new Option(l,l)));
      if(session.lop)classSelect.value=session.lop;
    }
    const options={date:document.getElementById('overviewDateV20').value,lop:role==='GVCN'?classSelect.value:''};
    const key=[session.sessionToken,role,options.date,options.lop].join('|');
    if(overviewStateV20.pending===key)return;
    if(force!==true&&overviewStateV20.data&&overviewStateV20.key===key&&Date.now()-overviewStateV20.loadedAt<45000)return;
    const serial=++overviewStateV20.serial,login=currentUnifiedLoginV4;
    overviewStateV20.pending=key;overviewStateV20.data=null;
    renderOverviewActionsV20(role);
document.getElementById('overviewScopeV20').textContent='Đang tải tổng quan công việc';
    document.getElementById('overviewWeekV20').textContent='—';
    document.getElementById('overviewUpdatedV20').textContent='Đang tải dữ liệu…';
    document.getElementById('overviewDataV20').setAttribute('aria-busy','true');
    document.getElementById('overviewErrorV20').classList.add('d-none');
    document.getElementById('overviewProgressV20').classList.add('d-none');
    document.getElementById('overviewAnalyticsV52').classList.add('d-none');
    document.getElementById('overviewNeNepChartV52').innerHTML='';
    document.getElementById('overviewClassAlertV52').innerHTML='';
    document.getElementById('overviewClosureV20').classList.add('d-none');
    document.getElementById('overviewRefreshV20').disabled=true;
    document.getElementById('overviewNoticesV20').innerHTML='';
    document.getElementById('overviewListsV20').innerHTML='';
    document.getElementById('overviewListNoteV20').textContent='';
    document.getElementById('overviewCountV20').textContent='';
    document.getElementById('overviewPrevV20').disabled=true;document.getElementById('overviewNextV20').disabled=true;
    document.getElementById('overviewMetricsV20').innerHTML=[1,2,3,4].map(()=>'<div class="overview-metric-v20"><span>Đang tải</span><strong>—</strong><small>Đang kiểm tra dữ liệu</small></div>').join('');
    document.getElementById('overviewRowsV20').innerHTML='<tr><td colspan="5" class="overview-empty-v20">Đang tải danh sách…</td></tr>';
    function current(){return serial===overviewStateV20.serial&&currentUnifiedLoginV4===login;}
    function finish(){overviewStateV20.pending='';document.getElementById('overviewRefreshV20').disabled=false;document.getElementById('overviewDataV20').setAttribute('aria-busy','false');}
    function fail(message){
      if(!current())return;finish();
      const error=document.getElementById('overviewErrorV20');error.textContent=message||'Không tải được tổng quan. Bấm Cập nhật để thử lại.';error.classList.remove('d-none');
      document.getElementById('overviewUpdatedV20').textContent='Chưa cập nhật được dữ liệu';
      document.getElementById('overviewMetricsV20').innerHTML=[1,2,3,4].map(()=>'<div class="overview-metric-v20"><span>Chưa có dữ liệu</span><strong>—</strong></div>').join('');
      document.getElementById('overviewRowsV20').innerHTML='<tr><td colspan="5" class="overview-empty-v20">Chưa tải được danh sách.</td></tr>';
    }
    function handleDashboardSuccessV64(res,source,elapsedMs){
      if(!current())return;
      console.info('[V66 PERF] Dashboard tổng:',Math.round(Number(elapsedMs)||0)+'ms','server:',(res&&res.serverMs!==undefined?res.serverMs:'—')+'ms','cache:',!!(res&&res.cacheHit),'source:',source,role);
      if(!res||!res.success){fail(res&&res.message);return;}
      finish();overviewStateV20.key=key;overviewStateV20.loadedAt=Date.now();overviewStateV20.data=res;

      document.getElementById('overviewWeekV20').textContent='Tuần '+res.week+' · Năm học '+res.schoolYear;
      document.getElementById('overviewUpdatedV20').textContent='Cập nhật '+res.updatedAt;
      document.getElementById('overviewScopeV20').textContent=res.scope||'Tổng quan công việc';
      document.getElementById('overviewMetricsV20').innerHTML=res.metrics.map(m=>{
        const tag=m.list?'button':'div',warn=['unsigned','mixed','late'].includes(m.list)&&Number(m.value)>0;
        const extra=m.list?` type="button" onclick="selectOverviewListV20('${m.list}')"`:'';
        return `<${tag}${extra} class="overview-metric-v20${warn?' needs-attention':''}"><span>${escapeHtml(m.label)}</span><strong>${m.value===null?'—':escapeHtml(m.value)}</strong><small>${escapeHtml(m.detail)}</small></${tag}>`;
      }).join('');
      document.getElementById('overviewNoticesV20').innerHTML=(res.notices||[]).map(n=>`<div class="overview-notice-v20">${escapeHtml(n)}</div>`).join('');
      if(res.progress&&res.progress.total>0){
        const pct=Math.round(res.progress.done*100/res.progress.total);
        document.getElementById('overviewProgressV20').classList.remove('d-none');
        document.getElementById('overviewProgressTextV20').textContent='Đã ghi '+res.progress.done+'/'+res.progress.total+' phần tiết · '+pct+'%';
        const hint=document.getElementById('overviewProgressHintV31');
        if(hint)hint.textContent=res.role==='GVCN'?'Tiến độ ghi sổ của lớp chủ nhiệm':'Tiến độ dữ liệu trong phạm vi đã chọn';
        document.getElementById('overviewBarV20').style.width=pct+'%';
        document.getElementById('overviewMeterV20').setAttribute('aria-valuenow',String(pct));
      }
      if(res.closure){const c=document.getElementById('overviewClosureV20');c.textContent=res.closure.text;c.classList.remove('d-none');}
      if(res.role==='BGH'&&Array.isArray(res.neNepTrend)){
        document.getElementById('overviewAnalyticsV52').classList.remove('d-none');
        document.getElementById('overviewChartRangeV52').textContent='Đến tuần '+res.week;
        renderNeNepChartV52(res.neNepTrend);
        renderClassNeNepV52(res.classNeNep||[]);
      }
      const candidateKeys=['unsigned','mixed','late','recent'];
      const first=candidateKeys.find(k=>res.lists[k]&&res.lists[k].total>0)||'recent';
      selectOverviewListV20(first);
    }

    // V66: nếu Dashboard đã được Edge/backend gộp trong phản hồi đăng nhập thì hiển thị ngay,
    // không tạo thêm một vòng GitHub Pages → Apps Script (thường tốn ~2 giây dù server xử lý rất nhanh).
    const initialDashV64=login&&login.initialDashboardV64;
    if(force!==true&&initialDashV64&&initialDashV64.data&&initialDashV64.data.success&&initialDashV64.role===role){
      const initialOptionsV64=initialDashV64.options||{};
      const sameDateV64=String(initialOptionsV64.date||'')===String(options.date||'');
      const sameClassV64=role!=='GVCN'||String(initialOptionsV64.lop||'')===String(options.lop||'');
      if(sameDateV64&&sameClassV64){
        delete login.initialDashboardV64;
        handleDashboardSuccessV64(initialDashV64.data,'LOGIN_BUNDLE',0);
        return;
      }
    }

    const dashPerfStartedV66=performance.now();
    const tokenV66=String(session.sessionToken||'');
    if(tokenV66.startsWith('v66.')){
      callSodbEdgeV66({action:'dashboard',token:tokenV66,options}).then(function(res){
        if(res&&res.success){handleDashboardSuccessV64(res,'EDGE',performance.now()-dashPerfStartedV66);return;}
        throw new Error(res&&res.message?res.message:'Không tải được Dashboard Edge.');
      }).catch(function(edgeErr){
        console.warn('[V66 DASH EDGE] Fallback Apps Script:',edgeErr);
        const fallbackStarted=performance.now();
        google.script.run.withSuccessHandler(function(res){handleDashboardSuccessV64(res,'RPC_FALLBACK',performance.now()-fallbackStarted);})
          .withFailureHandler(()=>fail('Kết nối không thành công. Bấm Cập nhật để thử lại.')).layDashboardChuyenNghiepV66Fallback(options,{token:tokenV66});
      });
      return;
    }
    google.script.run.withSuccessHandler(function(res){
      handleDashboardSuccessV64(res,'RPC_FALLBACK',performance.now()-dashPerfStartedV66);
    }).withFailureHandler(()=>fail('Kết nối không thành công. Bấm Cập nhật để thử lại.')).layDashboardChuyenNghiepV66Fallback(options,{token:session.sessionToken});
  }
  function renderNeNepChartV52(rows){
    const el=document.getElementById('overviewNeNepChartV52');if(!el)return;
    const data=(rows||[]).filter(x=>x&&x.week);
    if(!data.length){el.innerHTML='<div class="overview-chart-empty-v52">Chưa có dữ liệu nề nếp để vẽ biểu đồ.</div>';return;}
    const W=760,H=250,p={l:42,r:16,t:18,b:34},plotW=W-p.l-p.r,plotH=H-p.t-p.b;
    const weeks=data.map(x=>Number(x.week));const minW=Math.min(...weeks),maxW=Math.max(...weeks);
    const x=w=>p.l+(maxW===minW?plotW/2:(w-minW)/(maxW-minW)*plotW);
    const y=v=>p.t+(10-Number(v))/10*plotH;
    const series=[['k10','Khối 10','#2563eb'],['k11','Khối 11','#f59e0b'],['k12','Khối 12','#10b981']];
    const grid=[0,2,4,6,8,10].map(v=>`<line x1="${p.l}" y1="${y(v)}" x2="${W-p.r}" y2="${y(v)}" class="chart-grid-v52"/><text x="${p.l-9}" y="${y(v)+4}" text-anchor="end" class="chart-label-v52">${v}</text>`).join('');
    const ticks=data.filter((_,i)=>data.length<=10||i===0||i===data.length-1||i%Math.ceil(data.length/8)===0).map(d=>`<text x="${x(d.week)}" y="${H-10}" text-anchor="middle" class="chart-label-v52">T${d.week}</text>`).join('');
    const paths=series.map(([key,label,color])=>{
      const pts=data.filter(d=>d[key]!==null&&d[key]!==undefined&&Number.isFinite(Number(d[key]))).map(d=>[x(d.week),y(d[key]),d]);
      if(!pts.length)return '';
      const path=pts.map((pt,i)=>(i?'L':'M')+pt[0].toFixed(1)+' '+pt[1].toFixed(1)).join(' ');
      const dots=pts.map(pt=>`<circle cx="${pt[0]}" cy="${pt[1]}" r="3.2" fill="${color}"><title>${label} · Tuần ${pt[2].week}: ${Number(pt[2][key]).toFixed(2)}</title></circle>`).join('');
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
    }).join('');
    el.innerHTML=`<div class="overview-chart-legend-v52">${series.map(s=>`<span><i style="background:${s[2]}"></i>${s[1]}</span>`).join('')}</div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${grid}${ticks}${paths}</svg>`;
  }
  function renderClassNeNepV52(rows){
    const el=document.getElementById('overviewClassAlertV52');if(!el)return;
    const arr=(rows||[]).slice(0,8);
    if(!arr.length){el.innerHTML='<div class="overview-class-empty-v52">Chưa có dữ liệu nề nếp trong tuần.</div>';return;}
    el.innerHTML=arr.map((r,i)=>`<div class="overview-class-row-v52"><span class="overview-rank-v52">${i+1}</span><div><strong>${escapeHtml(r.lop)}</strong><small>${escapeHtml(r.count)} tiết có điểm</small></div><b>${Number(r.avg).toFixed(2)}</b></div>`).join('');
  }
  function selectOverviewListV20(key){
    const data=overviewStateV20.data;if(!data||!data.lists[key])return;
    overviewStateV20.list=key;overviewStateV20.page=0;
    const listKeys=Object.keys(data.lists);
    document.getElementById('overviewListsV20').innerHTML=listKeys.map(k=>{
      const l=data.lists[k];return `<button type="button" class="${k===key?'active':''}" aria-pressed="${k===key}" onclick="selectOverviewListV20('${k}')">${escapeHtml(l.label)}<b>${l.total}</b></button>`;
    }).join('');
    document.getElementById('overviewListNoteV20').textContent=key==='mixed'?'Kiểm tra số giáo viên khác nhau trong từng tiết trộn; trạng thái chữ ký xem tại mục Chưa ký.'
      :key==='late'?'Các tiết trong tuần đến ngày đã chọn, có thời điểm lưu sang ngày sau ngày dạy.'
      :'Các phần môn/giáo viên từ đầu tuần đến ngày đã chọn; một tiết trộn có thể có hai phần.';
    renderOverviewRowsV20();
  }
  function renderOverviewRowsV20(){
    const data=overviewStateV20.data;if(!data)return;
    const l=data.lists[overviewStateV20.list],start=overviewStateV20.page*8,rows=l.rows.slice(start,start+8);
    document.getElementById('overviewRowsV20').innerHTML=rows.length?rows.map((r,i)=>{
      const day=(r.date||'').split('-').reverse().join('/');
      const buoi={Sang:'Sáng',Chieu:'Chiều',DayBu:'Dạy bù'}[r.buoi]||r.buoi;
      return `<tr><td><strong>${escapeHtml(r.lop)}</strong><small>${escapeHtml(day)}</small></td><td>${escapeHtml(buoi)} · Tiết ${escapeHtml(r.tiet)}</td><td><strong>${escapeHtml(r.mon)}</strong><small>${escapeHtml(r.tenGV||'Chưa xác định giáo viên')}</small></td><td><span class="overview-status-v20${r.status==='Đã ghi'?' recorded':''}">${escapeHtml(r.status)}</span>${r.time?'<small>Lưu '+escapeHtml(r.time)+'</small>':''}</td><td><button type="button" class="btn btn-sm btn-outline-primary" onclick="openOverviewRecordV20(${start+i})" aria-label="Xem sổ lớp ${escapeHtml(r.lop)}">Xem sổ</button></td></tr>`;
    }).join(''):`<tr><td colspan="5" class="overview-empty-v20">${escapeHtml(l.empty)}</td></tr>`;
    document.getElementById('overviewCountV20').textContent=l.rows.length?
      `${start+1}–${Math.min(start+8,l.rows.length)} / ${l.total} bản ghi`+(l.total>l.rows.length?' · Xem '+l.rows.length+' bản ghi đầu; tra cứu chi tiết để xem đầy đủ.':''):'0 bản ghi';
    document.getElementById('overviewPrevV20').disabled=start===0;
    document.getElementById('overviewNextV20').disabled=start+8>=l.rows.length;
  }
  function pageOverviewV20(direction){
    const d=overviewStateV20.data;if(!d)return;
    const last=Math.max(0,Math.ceil(d.lists[overviewStateV20.list].rows.length/8)-1);
    overviewStateV20.page=Math.max(0,Math.min(last,overviewStateV20.page+direction));renderOverviewRowsV20();
  }
  function openOverviewRecordV20(index){
    const data=overviewStateV20.data;if(!data)return;
    const row=data.lists[overviewStateV20.list].rows[index];if(!row)return;
    const grade=String(row.lop).slice(0,2),gradeSelect=document.getElementById('viewKhoi');
    gradeSelect.value=grade;chonKhoiLopView();
    const sel=document.getElementById('viewLop'),normalize=x=>String(x).replace(/([A-Z])0+(\d+)$/,'$1$2');
    const match=[...sel.options].find(o=>normalize(o.value)===normalize(row.lop));
    if(match)sel.value=match.value;else{sel.add(new Option(row.lop,row.lop));sel.value=row.lop;}
    document.getElementById('viewTuan').value=data.week;
    openTopTabV9('view-tab');traCuuSoDauBaiTuanGop();
  }


  function findFieldWrapperV16(el){
    if(!el)return null;
    return el.closest('.col-md-2, .col-md-3, .col-md-4, .col-md-5, .col-md-6, .col-md-8, .col-md-9, .col-lg-2, .col-lg-3, .col-lg-4, .col-lg-6, .col-lg-8, .col-sm-6, .col-sm-12, .mb-3, .mb-2, .form-group') || el.parentElement;
  }

  function initInputCompactV16(){
    const ids=['ngayDay','khoi','lop','buoiDay','tietDay','monHoc','gdtcTeachingSubjectV25','technologyTeachingSubjectV657','tenBaiDaySelect','tenBaiDayCustom','tietCT','hsVang','tenHSVang','nhanXet','diemHocTap','diemKyLuat','diemNeNep','isTietTron'];
    ids.forEach(id=>{
      const el=document.getElementById(id);
      const wrap=findFieldWrapperV16(el);
      if(wrap){
        wrap.classList.remove('d-none','advanced-input-v16');
        wrap.classList.add('input-priority-v16');
        delete wrap.dataset.v16AdvancedBound;
        const badge=wrap.querySelector('.advanced-badge-v16');
        if(badge)badge.remove();
      }
    });
    const s=document.getElementById('autoFillStatusV12');
    if(s)s.classList.add('d-none');
  }

  function toggleAdvancedInputV16(){ return; }

  document.addEventListener('DOMContentLoaded',function(){
    initInputCompactV16();
    const dashboardBtn=document.getElementById('dashboard-tab-v9');
    if(dashboardBtn) dashboardBtn.addEventListener('shown.bs.tab',refreshDashboardV9);
    document.querySelectorAll('#sodbTab .nav-link').forEach(btn=>{
      btn.addEventListener('shown.bs.tab',()=>syncMobileRoleNavV54(btn.id));
    });
    const moreBtn=document.getElementById('mobileMoreBtnV54'),moreMenu=document.getElementById('mobileMoreMenuV54');
    if(moreBtn&&moreMenu){
      moreBtn.addEventListener('click',function(e){e.stopPropagation();moreMenu.classList.toggle('d-none');});
      document.addEventListener('click',function(e){if(!moreMenu.contains(e.target)&&e.target!==moreBtn)moreMenu.classList.add('d-none');});
    }
    rebuildMobileRoleNavV54();
  });


  let actionModalResolverV11=null;
  function actionDialogV11(options){
    options=options||{};
    const modalEl=document.getElementById('actionModalV11');
    if(!modalEl||!window.bootstrap)return Promise.resolve(null);
    document.getElementById('actionModalTitleV11').textContent=options.title||'Xác nhận thao tác';
    document.getElementById('actionModalMessageV11').textContent=options.message||'';
    const input=document.getElementById('actionModalInputV11');
    const label=document.getElementById('actionModalLabelV11');
    const hint=document.getElementById('actionModalHintV11');
    const confirmBtn=document.getElementById('actionModalConfirmV11');
    const needsInput=!!options.input;
    input.classList.toggle('d-none',!needsInput);
    label.classList.toggle('d-none',!needsInput);
    hint.classList.toggle('d-none',!needsInput||!options.hint);
    label.textContent=options.label||'Nhập thông tin';
    hint.textContent=options.hint||'';
    input.type=options.type||'text';
    input.value='';
    input.placeholder=options.placeholder||'';
    confirmBtn.textContent=options.confirmText||'Xác nhận';
    confirmBtn.className='btn '+(options.danger?'btn-danger':'btn-primary');

    return new Promise(resolve=>{
      actionModalResolverV11=resolve;
      const modal=bootstrap.Modal.getOrCreateInstance(modalEl);
      const onConfirm=()=>{
        const value=needsInput?input.value:null;
        if(options.requiredValue && value!==options.requiredValue){
          input.classList.add('is-invalid');
          return;
        }
        input.classList.remove('is-invalid');
        cleanup(); modal.hide(); resolve(needsInput?value:true);
      };
      const onHidden=()=>{ cleanup(); resolve(null); };
      function cleanup(){
        confirmBtn.removeEventListener('click',onConfirm);
        modalEl.removeEventListener('hidden.bs.modal',onHidden);
      }
      confirmBtn.addEventListener('click',onConfirm);
      modalEl.addEventListener('hidden.bs.modal',onHidden,{once:true});
      modal.show();
      if(needsInput)setTimeout(()=>input.focus(),250);
    });
  }

  /* V11: khôi phục dữ liệu bằng dialog thay prompt/confirm trình duyệt */
  async function phucHoiBackupUiV11(){
    if(!adminDangNhapInfo||!adminDangNhapInfo.sessionToken)return;
    const id=document.getElementById('backupSelectV4').value;
    if(!id){showToastV9('Hãy chọn bản sao cần khôi phục.','danger');return;}
    const code=await actionDialogV11({
      title:'Khôi phục dữ liệu',
      message:'Đây là thao tác thay đổi dữ liệu toàn hệ thống. Hệ thống sẽ tạo một bản sao an toàn trước khi khôi phục.',
      input:true,label:'Nhập PHUC_HOI để xác nhận',requiredValue:'PHUC_HOI',
      placeholder:'PHUC_HOI',confirmText:'Khôi phục dữ liệu',danger:true
    });
    if(code!=='PHUC_HOI')return;
    document.getElementById('systemStatusV4').innerText='⏳ Đang khôi phục dữ liệu...';
    google.script.run.withSuccessHandler(function(res){
      document.getElementById('systemStatusV4').innerText=(res&&res.success?'✅ ':'❌ ')+(res?res.message:'Không khôi phục được');
      if(res&&res.success){taiNhatKyAdminV4();showToastV9(res.message||'Khôi phục thành công.','success');}
      else showToastV9((res&&res.message)||'Không khôi phục được.','danger');
    }).phucHoiDuLieuV4(id,code,{token:adminDangNhapInfo.sessionToken});
  }





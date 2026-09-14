let varDiemTB = 10;
  let varXepLoai = "Loại A (Tốt)";
  let urlChuKyGlobal = "";
  let urlGVCNGlobal = "";
  let gvcnDangNhapInfo = null;
  let gvbmDangNhapInfo = null;
  let giamThiDangNhapInfo = null;
  let adminDangNhapInfo = null;
  let isGVBMLoggingIn = false;
  let ttcmDangNhapInfo = null;
  let parsedKHBDData = [];
  let parsedHSDataV4 = [];
  let parsedLopDataV23 = [];
  let classMetaV26 = {};
  let danhSachBaiDay1 = [];
  let lessonPlanCache = {};
  let lastSavedRecordV4 = null;
  let editingRecordIdV4 = null;
  let currentUnifiedLoginV4 = null;
  const sodbViewCacheV6 = new Map();
  const SODB_VIEW_CACHE_MS_V6 = 180000; // 3 phút trên trình duyệt
  let bootstrapLoadedV6 = false;
  let bulkWeekUnlockStateV685={week:0,active:false,allowAllClasses:false};
  let bulkWeekUnlockRequestV685=0;
  let bootstrapPendingV47 = false;
  let classCatalogLoadedAtV47 = 0;
  const CLASS_CATALOG_REFRESH_MS_V47 = 120000;
  const lessonPlanPendingV47 = new Set();
  // V55: phiên bản request KHBD theo từng Lớp/Môn/Tuần để bỏ qua phản hồi cũ về trễ.
  const lessonPlanRequestSerialV55 = Object.create(null);

  function invalidateSodbViewCacheV47(lop,tuan){
    const prefix=String(lop)+'|'+String(tuan)+'|';
    [...sodbViewCacheV6.keys()].forEach(key=>{if(String(key).startsWith(prefix))sodbViewCacheV6.delete(key);});
  }

  const XLSX_LIB_URL_V7 = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  let xlsxLoadPromiseV7 = null;
  function ensureXlsxV7() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxLoadPromiseV7) return xlsxLoadPromiseV7;
    xlsxLoadPromiseV7 = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = XLSX_LIB_URL_V7;
      s.async = true;
      s.onload = () => resolve(window.XLSX);
      s.onerror = () => { xlsxLoadPromiseV7 = null; reject(new Error('Không tải được thư viện Excel.')); };
      document.head.appendChild(s);
    });
    return xlsxLoadPromiseV7;
  }
  function retryWithXlsxV7(fn) {
    if (window.XLSX) return false;
    ensureXlsxV7().then(fn).catch(err => alertV13('❌ ' + (err.message || err)));
    return true;
  }

  /* V68.5.6: đọc file Word .docx KHBD trực tiếp trên trình duyệt */
  const JSZIP_LIB_URL_V656 = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  let jszipLoadPromiseV656 = null;
  function ensureJsZipV656(){
    if(window.JSZip)return Promise.resolve(window.JSZip);
    if(jszipLoadPromiseV656)return jszipLoadPromiseV656;
    jszipLoadPromiseV656=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=JSZIP_LIB_URL_V656;s.async=true;
      s.onload=()=>resolve(window.JSZip);
      s.onerror=()=>{jszipLoadPromiseV656=null;reject(new Error('Không tải được thư viện đọc Word (.docx).'));};
      document.head.appendChild(s);
    });
    return jszipLoadPromiseV656;
  }

  let inputLessonLoadedV7 = false;
  function lazyLoadInputLessonV7() {
    if (inputLessonLoadedV7 || !gvbmDangNhapInfo || !(gvbmDangNhapInfo.dsMonGV||[]).length) return;
    inputLessonLoadedV7 = true;
    loadDanhSachBaiDay();
  }

  let adminSubjectsLoadedV7 = false;
  function lazyLoadAdminSubjectsV7() {
    if (adminSubjectsLoadedV7 || !hasRoleV4('ADMIN') || !adminDangNhapInfo || !adminDangNhapInfo.sessionToken) return;
    const sel=document.getElementById('khbdUploadMon');
    if(sel && sel.options.length) return;
    adminSubjectsLoadedV7=true;
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){adminSubjectsLoadedV7=false;return;}
      const s=document.getElementById('khbdUploadMon'); if(!s)return;
      s.innerHTML=''; (res.data||[]).forEach(m=>s.add(new Option(m,m)));
    }).withFailureHandler(function(){adminSubjectsLoadedV7=false;})
      .getDanhSachMonAdminV7({token:adminDangNhapInfo.sessionToken});
  }

  let START_DATE_WEEK1_STR = '2026-08-17';

  let dsLopChinhTheoKhoiV22 = {
    "10": ["10A01","10A02","10A03","10A04","10A05","10A06","10A07","10A08","10A09","10A10","10A11","10A12","10A13"],
    "11": ["11A01","11A02","11A03","11A04","11A05","11A06","11A07","11A08","11A09","11A10","11A11","11A12","11A13"],
    "12": ["12A01","12A02","12A03","12A04","12A05","12A06","12A07","12A08","12A09","12A10","12A11","12A12","12A13"]
  };
  let dsLopDacBietTheoKhoiV22 = {
    "10": [],
    "11": [],
    "12": ["12 Chuyên đề"]
  };
  let dsLopTheoKhoi = {};
  ["10","11","12"].forEach(k=>{dsLopTheoKhoi[k]=[...(dsLopChinhTheoKhoiV22[k]||[]),...(dsLopDacBietTheoKhoiV22[k]||[])];});

  function loaiSoTheoLopV22(lop){
    const meta=getClassMetaClientV26(lop);
    if(meta&&meta.type)return meta.type;
    const s=normalizeTextKey(lop);
    if(s.includes('chuyen de'))return 'CHUYEN_DE';
    return 'LOP_CHINH';
  }
  function tieuDeSoTheoLopV22(lop,bookMode){
    const k=String(lop||'').match(/10|11|12/); const khoi=k?k[0]:'';
    if(loaiSoTheoLopV22(lop)==='CHUYEN_DE'){
      const meta=classMetaV26[normalizeTextKey(lop)]||{};
      return `SỔ ĐẦU BÀI CHUYÊN ĐỀ - ${lop}${meta.subject?` - ${meta.subject}`:''}`;
    }
    if(bookMode==='GDTC')return `SỔ ĐẦU BÀI GDTC LỚP ${lop}`;
    return `SỔ ĐẦU BÀI LỚP ${lop}`;
  }
  function napLopVaoSelectV22(select,khoi,includeSpecial){
    if(!select)return;
    select.innerHTML='';
    const main=dsLopChinhTheoKhoiV22[khoi]||[];
    const special=includeSpecial?(dsLopDacBietTheoKhoiV22[khoi]||[]):[];
    if(main.length){
      const g=document.createElement('optgroup');g.label='Lớp chính';
      main.forEach(l=>g.appendChild(new Option(l,l)));select.appendChild(g);
    }
    if(special.length){
      const g=document.createElement('optgroup');g.label='Lớp / nhóm dạy riêng';
      special.forEach(l=>g.appendChild(new Option(l,l)));select.appendChild(g);
    }
  }



  /* ===== V39: LỌC KHỐI/LỚP THEO SHEET "Phân công dạy" ===== */
  function getClassGradeV39(lop){
    const meta=getClassMetaClientV26(lop);
    if(meta&&meta.khoi)return String(meta.khoi);
    const m=String(lop||'').match(/^(10|11|12)/);return m?m[1]:'';
  }
  function getAllMainClassesClientV39(){
    const out=[];['10','11','12'].forEach(k=>(dsLopChinhTheoKhoiV22[k]||[]).forEach(l=>{if(!out.includes(l))out.push(l);}));return out;
  }
  function getAssignedClassesForSubjectV39(subject){
    if(!gvbmDangNhapInfo)return [];
    if(isGdtcBaseSubjectV25(subject)||isGdtcDetailSubjectV25(subject))return getAllMainClassesClientV39();
    const map=gvbmDangNhapInfo.phanCongLopTheoMon||{};
    const direct=(map[normalizeTextKey(subject)]||[]).filter(Boolean);
    if(direct.length)return direct;
    if(isTechnologyDetailSubjectV657(subject)){
      const base=(map[normalizeTextKey('Công nghệ')]||[]).filter(Boolean);
      if(base.length)return base;
    }
    return [];
  }
  function renderAssignmentNoteV39(subject,classes){
    const note=document.getElementById('phanCongDayNoteV39');if(!note)return;
    if(isGdtcBaseSubjectV25(subject)||isGdtcDetailSubjectV25(subject)){
      note.textContent='GDTC: hệ thống cho phép chọn toàn bộ lớp chính của Khối 10, 11, 12.';
      note.className='small text-success fw-semibold mb-2';return;
    }
    if(isTechnologyBaseSubjectV657(subject)||isTechnologyDetailSubjectV657(subject)){
      note.className='small text-info fw-semibold mb-2';
      note.textContent=classes.length
        ? `Công nghệ: ${classes.length} lớp theo phân công; khi nhập tiết chọn Công nghệ nông nghiệp hoặc Công nghệ công nghiệp.`
        : 'Chưa đọc được lớp phân công cho môn Công nghệ. Kiểm tra sheet “Phân công dạy”.';
      if(!classes.length)note.className='small text-danger fw-semibold mb-2';
      return;
    }
    note.className='small text-primary fw-semibold mb-2';
    note.textContent=classes.length
      ? `Phân công dạy: ${classes.length} lớp được phép nhập cho môn ${subject}.`
      : `Chưa đọc được lớp phân công cho môn ${subject}. Kiểm tra SĐT/Tên GV, cột Môn và Danh sách lớp trong sheet “Phân công dạy”.`;
    if(!classes.length)note.className='small text-danger fw-semibold mb-2';
  }
  function napLopPhanCongV39(select,khoi,subject){
    if(!select)return;
    const allowed=getAssignedClassesForSubjectV39(subject);
    const list=allowed.filter(l=>getClassGradeV39(l)===String(khoi));
    select.innerHTML='';
    if(!list.length){select.add(new Option('-- Chưa có lớp được phân công --',''));return;}
    const main=list.filter(l=>loaiSoTheoLopV22(l)==='LOP_CHINH');
    const special=list.filter(l=>loaiSoTheoLopV22(l)!=='LOP_CHINH');
    if(main.length){const g=document.createElement('optgroup');g.label='Lớp được phân công';main.forEach(l=>g.appendChild(new Option(l,l)));select.appendChild(g);}
    if(special.length){const g=document.createElement('optgroup');g.label='Lớp / nhóm dạy riêng';special.forEach(l=>g.appendChild(new Option(l,l)));select.appendChild(g);}
  }
  function capNhatKhoiVaLopPhanCongV39(preserve){
    const monSel=document.getElementById('monHoc'),khoiSel=document.getElementById('khoi'),lopSel=document.getElementById('lop');
    if(!monSel||!khoiSel||!lopSel||!gvbmDangNhapInfo)return;
    if(document.getElementById('isDayThayV683')?.checked){
      const oldK=String(khoiSel.value||'10'),oldL=String(lopSel.value||'');
      khoiSel.innerHTML='';['10','11','12'].forEach(k=>khoiSel.add(new Option('Khối '+k,k)));khoiSel.value=['10','11','12'].includes(oldK)?oldK:'10';
      napLopVaoSelectV22(lopSel,khoiSel.value,true);if(oldL&&[...lopSel.options].some(o=>o.value===oldL))lopSel.value=oldL;
      const note=document.getElementById('phanCongDayNoteV39');if(note){note.textContent='Chế độ dạy thay: được chọn lớp ngoài phân công thường xuyên; môn học vẫn phải thuộc chuyên môn của tài khoản đang đăng nhập.';note.className='small text-warning fw-semibold mb-2';}
      onInputClassChangedV26();capNhatHanNhapTietV683();return;
    }
    if(bulkWeekUnlockStateV685.active&&bulkWeekUnlockStateV685.allowAllClasses&&Number(document.getElementById('tuanHoc')?.value||0)===Number(bulkWeekUnlockStateV685.week||0)){
      const oldK=String(khoiSel.value||'10'),oldL=String(lopSel.value||'');
      khoiSel.innerHTML='';['10','11','12'].forEach(k=>khoiSel.add(new Option('Khối '+k,k)));khoiSel.value=['10','11','12'].includes(oldK)?oldK:'10';
      napLopVaoSelectV22(lopSel,khoiSel.value,true);if(oldL&&[...lopSel.options].some(o=>o.value===oldL))lopSel.value=oldL;
      const note=document.getElementById('phanCongDayNoteV39');if(note){note.textContent=`Admin đang mở khóa Tuần ${bulkWeekUnlockStateV685.fromWeek}–${bulkWeekUnlockStateV685.toWeek}: được chọn toàn bộ lớp; hệ thống không đối chiếu lớp theo phân công hiện tại trong khoảng này.`;note.className='small text-success fw-bold mb-2';}
      onInputClassChangedV26();capNhatHanNhapTietV683();return;
    }
    const subject=String(monSel.value||'').trim();
    const allowed=getAssignedClassesForSubjectV39(subject);
    renderAssignmentNoteV39(subject,allowed);
    const oldKhoi=preserve?String(khoiSel.value||''):'',oldLop=preserve?String(lopSel.value||''):'';
    const grades=[];allowed.forEach(l=>{const k=getClassGradeV39(l);if(k&&!grades.includes(k))grades.push(k);});grades.sort();
    khoiSel.innerHTML='';
    if(!grades.length){khoiSel.add(new Option('-- Chưa phân công --',''));lopSel.innerHTML='<option value="">-- Chưa có lớp được phân công --</option>';onInputClassChangedV26();return;}
    grades.forEach(k=>khoiSel.add(new Option('Khối '+k,k)));
    khoiSel.value=grades.includes(oldKhoi)?oldKhoi:grades[0];
    napLopPhanCongV39(lopSel,khoiSel.value,subject);
    if(oldLop&&[...lopSel.options].some(o=>o.value===oldLop))lopSel.value=oldLop;
    onInputClassChangedV26();
  }
  function ensureAssignmentDataV39(){
    if(!gvbmDangNhapInfo||gvbmDangNhapInfo.phanCongLopTheoMon!==undefined)return;
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success)return;
      Object.assign(gvbmDangNhapInfo,res);
      if(currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions&&currentUnifiedLoginV4.sessions.GVBM){
        Object.assign(currentUnifiedLoginV4.sessions.GVBM,res);
        try{sessionStorage.setItem('SODB_V4_UNIFIED_LOGIN',JSON.stringify(currentUnifiedLoginV4));}catch(e){}
      }
      capNhatKhoiVaLopPhanCongV39(false);
    }).layPhanCongDayCuaGVV39({token:gvbmDangNhapInfo.sessionToken});
  }

  function hasRoleV4(role){
    return !!(currentUnifiedLoginV4 && Array.isArray(currentUnifiedLoginV4.roles) && currentUnifiedLoginV4.roles.includes(role));
  }

  function roleLabelV4(role){
    return ({GVBM:'Giáo viên',GVCN:'Giáo viên chủ nhiệm',TTCM:'Tổ trưởng/Tổ phó',BGH:'Ban giám hiệu',GIAM_THI:'Giám thị',ADMIN:'Quản trị'})[role] || role;
  }

  function setCentralLoginStatusV4(message,type){
    const el=document.getElementById('centralLoginStatusV4'); if(!el)return;
    el.classList.remove('d-none','alert-danger','alert-success','alert-info','alert-warning');
    if(!message){el.classList.add('d-none');el.textContent='';return;}
    el.classList.add(type==='success'?'alert-success':type==='info'?'alert-info':'alert-danger');
    el.textContent=message;
  }

  function toggleMatKhauTapTrungV4(){
    const p=document.getElementById('centralPasswordV4'); if(!p)return;
    p.type=p.type==='password'?'text':'password';
  }

  function moDoiMatKhauToanCucV36(){
    const sessions=(currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions)||{};
    const hasSession=Object.values(sessions).some(x=>x&&x.sessionToken);
    if(!hasSession){alertV13('Không xác định được tài khoản để đổi mật khẩu. Vui lòng đăng nhập lại.');return;}
    const oldEl=document.getElementById('passUnifiedOldV6853');
    const newEl=document.getElementById('passUnifiedNewV6853');
    const confirmEl=document.getElementById('passUnifiedConfirmV6853');
    const status=document.getElementById('passwordUnifiedStatusV6853');
    if(oldEl)oldEl.value='';if(newEl)newEl.value='';if(confirmEl)confirmEl.value='';
    if(status){status.textContent='';status.classList.add('d-none');}
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDoiMatKhauUnifiedV6853')).show();
    setTimeout(()=>oldEl?.focus(),120);
  }

  async function thucHienDoiMatKhauUnifiedV6853(){
    const oldPw=String(document.getElementById('passUnifiedOldV6853')?.value||'');
    const newPw=String(document.getElementById('passUnifiedNewV6853')?.value||'');
    const confirmPw=String(document.getElementById('passUnifiedConfirmV6853')?.value||'');
    const btn=document.getElementById('btnSaveUnifiedPasswordV6853');
    const status=document.getElementById('passwordUnifiedStatusV6853');
    const showStatus=(msg,type)=>{if(!status)return;status.textContent=msg;status.className='alert py-2 mt-3 mb-0 '+(type==='success'?'alert-success':'alert-danger');};
    if(!oldPw||!newPw||!confirmPw){showStatus('Vui lòng nhập đầy đủ 3 ô mật khẩu.','danger');return;}
    if(newPw!==confirmPw){showStatus('Mật khẩu mới và xác nhận mật khẩu không trùng nhau.','danger');return;}
    if(newPw.length<8||!/[A-Za-zÀ-ỹ]/.test(newPw)||!/\d/.test(newPw)){showStatus('Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ và số.','danger');return;}
    if(oldPw===newPw){showStatus('Mật khẩu mới phải khác mật khẩu hiện tại.','danger');return;}
    const auth=getAnyAuthV6();
    if(!auth||!auth.token){showStatus('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.','danger');return;}
    if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Đang đổi...';}
    google.script.run
      .withSuccessHandler(function(res){
        if(btn){btn.disabled=false;btn.textContent='Lưu mật khẩu mới';}
        if(!res||!res.success){showStatus((res&&res.message)||'Không đổi được mật khẩu.','danger');return;}
        showStatus(res.message||'Đổi mật khẩu thành công.','success');
        // V68.5.5: đổi mật khẩu chính chạy nhanh trực tiếp trên Edge/Supabase.
        // Đồng bộ mật khẩu dự phòng Google Sheet thực hiện nền, không bắt người dùng chờ.
        try{
          google.script.run
            .withSuccessHandler(function(r){console.info('[V68.5.5 PASSWORD SYNC]',r&&r.success?'OK':r);})
            .withFailureHandler(function(err){console.warn('[V68.5.5 PASSWORD SYNC]',err);})
            .dongBoMatKhauLegacyV6855(newPw,auth);
        }catch(_e){}
        setTimeout(()=>{bootstrap.Modal.getInstance(document.getElementById('modalDoiMatKhauUnifiedV6853'))?.hide();dangXuatTapTrungV4();},1200);
      })
      .withFailureHandler(function(err){if(btn){btn.disabled=false;btn.textContent='Lưu mật khẩu mới';}showStatus(err&&err.message?err.message:String(err),'danger');})
      .doiMatKhauTaiKhoanV6853(oldPw,newPw,auth);
  }

  function tokenMapFromLoginV4(login){
    const out={};
    Object.keys((login&&login.sessions)||{}).forEach(role=>{
      const x=login.sessions[role]; if(x&&x.sessionToken)out[role]=x.sessionToken;
    });
    return out;
  }

  function getAnyAuthV6(){
    const s=(currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions)||{};
    for(const r of ['GVBM','GVCN','TTCM','BGH','GIAM_THI','ADMIN']) if(s[r]&&s[r].sessionToken)return {token:s[r].sessionToken};
    return {token:''};
  }


  function normalizeClassMetaV29(raw){
    const out={};
    Object.keys(raw||{}).forEach(k=>{
      const m=raw[k];
      if(!m)return;
      const name=String(m.lop||k||'').trim();
      if(name)out[normalizeTextKey(name)]=m;
    });
    return out;
  }

  function bootstrapCacheKeyV62(){
    const login=currentUnifiedLoginV4||{};
    const profile=login.profile||{};
    const account=String(profile.taiKhoan||profile.sdt||'guest').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,60);
    const roles=(login.roles||[]).slice().sort().join('_')||'none';
    return 'SODB_V63_BOOTSTRAP_'+account+'_'+roles;
  }

  function applyBootstrapV6(data){
    if(!data||!data.success)return;
    const cfg=data.config||{};
    const schoolYear=document.getElementById('printSchoolYearV20');if(schoolYear)schoolYear.textContent=cfg.schoolYear||'2026 - 2027';
    if(cfg.week1Start)START_DATE_WEEK1_STR=cfg.week1Start;
    let fy=document.getElementById('cfgSchoolYearV4');if(fy)fy.value=cfg.schoolYear||'';
    let fw=document.getElementById('cfgWeek1V4');if(fw)fw.value=cfg.week1Start||'';
    let fs=document.getElementById('cfgTkbStrictV4');if(fs)fs.value=cfg.tkbStrict||'FALSE';
    const mainCls=data.mainClasses||{}, specialCls=data.specialClasses||{}, cls=data.classes||{};
    classMetaV26=normalizeClassMetaV29(data.classMeta||{});
    ['10','11','12'].forEach(k=>{
      if(Array.isArray(mainCls[k]))dsLopChinhTheoKhoiV22[k]=mainCls[k];
      if(Array.isArray(specialCls[k]))dsLopDacBietTheoKhoiV22[k]=specialCls[k];
      if(Array.isArray(cls[k]))dsLopTheoKhoi[k]=cls[k];
      else dsLopTheoKhoi[k]=[...(dsLopChinhTheoKhoiV22[k]||[]),...(dsLopDacBietTheoKhoiV22[k]||[])];
    });
    if(gvbmDangNhapInfo&&data.assignments){
      Object.assign(gvbmDangNhapInfo,{
        phanCongLopTheoMon:data.assignments.phanCongLopTheoMon||gvbmDangNhapInfo.phanCongLopTheoMon||{},
        dsLopDay:data.assignments.dsLopDay||gvbmDangNhapInfo.dsLopDay||[],
        dsMonGV:(data.assignments.dsMonDay&&data.assignments.dsMonDay.length)?data.assignments.dsMonDay:gvbmDangNhapInfo.dsMonGV
      });
      if(data.signature&&data.signature.url){
        gvbmDangNhapInfo.urlChuKy=data.signature.url;
        capNhatTrangThaiChuKyV21(data.signature.url);
      }
    }
    // V69: signed URL không được giữ lâu trong session. Bootstrap mới luôn làm mới chữ ký cho GVCN.
    if(gvcnDangNhapInfo&&data.signature){
      gvcnDangNhapInfo.urlChuKy=data.signature.url||'';
      if(data.signature.ref)gvcnDangNhapInfo.signatureRef=data.signature.ref;
      urlGVCNGlobal=data.signature.url||'';
      const preview=document.getElementById('previewChuKyGVCN');
      const placeholder=document.getElementById('placeholderChuKyGVCN');
      if(preview){
        if(urlGVCNGlobal){preview.src=urlGVCNGlobal;preview.classList.remove('d-none');if(placeholder)placeholder.classList.add('d-none');}
        else{preview.removeAttribute('src');preview.classList.add('d-none');if(placeholder)placeholder.classList.remove('d-none');}
      }
    }
    // V54: môn học đi cùng bootstrap, không cần request riêng sau đăng nhập.
    if(Array.isArray(data.subjects)&&data.subjects.length){
      const expanded=expandGdtcSubjectsV25(data.subjects);
      ['khbdUploadMon','khbdViewMon'].forEach(id=>{
        const sel=document.getElementById(id);if(!sel)return;
        const current=sel.value;sel.innerHTML='';expanded.forEach(m=>sel.add(new Option(m,m)));
        if([...sel.options].some(o=>o.value===current))sel.value=current;
      });
      if(hasRoleV4('ADMIN'))adminSubjectsLoadedV7=true;
    }
    if(data.currentWeek){
      const viewWeek=document.getElementById('viewTuan');if(viewWeek&&!viewWeek.value)viewWeek.value=data.currentWeek;
    }
    chonKhoiLopView();chonKhoiLopInput();chonKhoiLopLogin();chonKhoiLopAdmin();khoiTaoDanhSachLopGiamThi();capNhatTuanVaThu();bootstrapLoadedV6=true;classCatalogLoadedAtV47=Date.now();
    try{sessionStorage.setItem(bootstrapCacheKeyV62(),JSON.stringify({ts:Date.now(),data:data}));}catch(e){}
  }

  function taiBootstrapV6(force){
    if(bootstrapLoadedV6&&!force)return;
    if(!force){
      try{const raw=sessionStorage.getItem(bootstrapCacheKeyV62());if(raw){const x=JSON.parse(raw);if(x&&Date.now()-Number(x.ts||0)<600000)applyBootstrapV6(x.data);}}catch(e){}
      if(bootstrapLoadedV6)return;
    }
    if(bootstrapPendingV47)return;
    bootstrapPendingV47=true;
    const tokenMap=tokenMapFromLoginV4(currentUnifiedLoginV4);
    google.script.run.withSuccessHandler(function(data){bootstrapPendingV47=false;applyBootstrapV6(data);}).withFailureHandler(function(){bootstrapPendingV47=false;showToastV9('Không tải được dữ liệu khởi tạo. Vui lòng thử lại.','danger');}).getBootstrapClientV6(tokenMap);
  }

  function handleLoginResponseV66(res,loginStarted,source,btn,txt){
    btn.disabled=false;txt.textContent='Đăng nhập';
    if(!res||!res.success){setCentralLoginStatusV4(res&&res.message?res.message:'Không đăng nhập được.','danger');return;}
    document.getElementById('centralPasswordV4').value='';
    console.info('[V69 PERF] Login tổng:',Math.round(performance.now()-loginStarted)+'ms','server:',(res.serverMs??'—')+'ms','path:',res.loginPath||source,'dashboard gộp:',(res.dashboardBundledMs??'—')+'ms','backend:',res.backendVersion||source,'source:',source);
    apDungPhanQuyenV4(res,true);
  }

  async function dangNhapTapTrungV4(){
    const loginPerfStartedV66=performance.now();
    const account=(document.getElementById('centralAccountV4').value||'').trim();
    const password=document.getElementById('centralPasswordV4').value||'';
    const btn=document.getElementById('centralLoginBtnV4'), txt=document.getElementById('centralLoginBtnTextV4');
    if(!account||!password){setCentralLoginStatusV4('Vui lòng nhập đầy đủ tài khoản và mật khẩu.','danger');return;}
    btn.disabled=true;txt.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Đang xác thực nhanh...';
    setCentralLoginStatusV4('Đang xác thực qua máy chủ dữ liệu...','info');
    try{
      const edgeRes=await callSodbEdgeV66({action:'login',account,password});
      if(edgeRes&&edgeRes.success){
        if(String(edgeRes.backendVersion||'')!=='V69_EDGE')throw new Error('Edge Function chưa đúng V69 ARCHITECTURE REBUILD.');
        handleLoginResponseV66(edgeRes,loginPerfStartedV66,'SUPABASE_EDGE',btn,txt);return;
      }
      // Sai tài khoản/mật khẩu hoặc bị khóa: không gọi fallback để tránh nhân đôi lần thử.
      if(edgeRes&&edgeRes.success===false){handleLoginResponseV66(edgeRes,loginPerfStartedV66,'SUPABASE_EDGE',btn,txt);return;}
      throw new Error('Edge Function không trả dữ liệu hợp lệ.');
    }catch(edgeErr){
      btn.disabled=false;txt.textContent='Đăng nhập';
      const detail=(edgeErr&&edgeErr.message)?String(edgeErr.message):String(edgeErr||'Không rõ lỗi kết nối.');
      console.error('[V69 LOGIN] Supabase Edge không sẵn sàng:',edgeErr);
      setCentralLoginStatusV4('Không thể xác thực an toàn qua Supabase Edge: '+detail+' V69 không dùng đăng nhập fallback qua Google Sheet để tránh lệch nguồn dữ liệu.','danger');
    }
  }

  function setTopTabVisibleV4(buttonId,visible){
    const b=document.getElementById(buttonId); if(b&&b.parentElement)b.parentElement.classList.toggle('d-none',!visible);
  }

  function isTopTabVisibleV54(id){
    const b=document.getElementById(id);
    return !!(b&&b.parentElement&&!b.parentElement.classList.contains('d-none'));
  }
  function openRoleTabV54(id){
    const b=document.getElementById(id);if(!b||!isTopTabVisibleV54(id))return;
    try{if(window.bootstrap)bootstrap.Tab.getOrCreateInstance(b).show();else b.click();}catch(e){try{b.click();}catch(_e){}}
    document.getElementById('mobileMoreMenuV54')?.classList.add('d-none');
    syncMobileRoleNavV54(id);
  }
  function syncMobileRoleNavV54(activeId){
    document.querySelectorAll('#mobileRoleNavV54 [data-target-tab]').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.targetTab===activeId);
    });
  }
  function rebuildMobileRoleNavV54(){
    const dash=document.getElementById('mobileDashboardV54');
    const input=document.getElementById('mobileInputV54');
    const view=document.getElementById('mobileViewV54');
    if(dash)dash.classList.toggle('d-none',!isTopTabVisibleV54('dashboard-tab-v9'));
    if(input)input.classList.toggle('d-none',!isTopTabVisibleV54('input-tab'));
    if(view)view.classList.toggle('d-none',!isTopTabVisibleV54('view-tab'));
    const more=document.getElementById('mobileMoreMenuV54');
    if(more){
      const extras=[
        ['gvcn-tab','Chủ nhiệm'],
        ['giamthi-tab','Tra cứu, thống kê'],
        ['ttcm-tab','Kế hoạch bài dạy'],
        ['admin-tab','Quản trị']
      ].filter(x=>isTopTabVisibleV54(x[0]));
      more.innerHTML=extras.map(x=>`<button type="button" data-mobile-extra="${x[0]}">${x[1]}</button>`).join('');
      extras.forEach(x=>{
        const b=more.querySelector(`[data-mobile-extra="${x[0]}"]`);
        if(b)b.onclick=()=>openRoleTabV54(x[0]);
      });
      document.getElementById('mobileMoreBtnV54')?.parentElement?.classList.toggle('d-none',extras.length===0);
    }
    document.querySelectorAll('#mobileRoleNavV54 [data-target-tab]').forEach(btn=>{
      btn.onclick=()=>openRoleTabV54(btn.dataset.targetTab);
    });
    const active=document.querySelector('#sodbTab .nav-link.active');
    syncMobileRoleNavV54(active?active.id:'dashboard-tab-v9');
  }

  function ensureAdminReadonlyNoteV4(tabId,id,title,text){
    let note=document.getElementById(id);
    if(!note){
      note=document.createElement('div');note.id=id;note.className='admin-readonly-v4';
      note.innerHTML=`<div class="fw-bold mb-1">${title}</div><div class="small">${text}</div>`;
      const body=document.querySelector(`#${tabId} .card-body`); if(body)body.prepend(note);
    }
    note.classList.remove('d-none');
  }

  function hideAdminReadonlyNoteV4(id){const x=document.getElementById(id);if(x)x.classList.add('d-none');}



  function classMetaKeyV26(lop){ return normalizeTextKey(lop||''); }
  function getClassMetaClientV26(lop){ return classMetaV26[classMetaKeyV26(lop)]||null; }
  function ensureTeacherSubjectOptionV26(subject){
    const sel=document.getElementById('monHoc');
    if(!sel||!subject)return false;
    const key=normalizeTextKey(subject);
    let opt=[...sel.options].find(o=>normalizeTextKey(o.value)===key);
    if(!opt){
      const allowed=(gvbmDangNhapInfo?.dsMonGV||[]).some(m=>normalizeTextKey(m)===key);
      if(!allowed)return false;
      opt=new Option(subject,subject);sel.add(opt);
    }
    sel.value=opt.value;
    return true;
  }
  function onInputClassChangedV26(){
    const lop=document.getElementById('lop')?.value||'';
    const meta=getClassMetaClientV26(lop);
    const monSel=document.getElementById('monHoc');
    const note=document.getElementById('khbdWeekNotice');
    if(monSel){
      monSel.disabled=false;
      monSel.classList.remove('bg-light');
    }

    if(meta&&meta.type==='CHUYEN_DE'){
      const subject=String(meta.subject||'').trim();
      if(!subject){
        if(note)note.innerText=`Lớp chuyên đề "${lop}" chưa khai báo Môn/KHBD trong sheet Lớp.`;
        configureGdtcInputV25();
        configureTechnologyInputV657();
        return;
      }
      if(!ensureTeacherSubjectOptionV26(subject)){
        if(note)note.innerText=`Lớp chuyên đề "${lop}" được khai báo môn ${subject}, nhưng tài khoản này chưa được phân công môn đó.`;
        configureGdtcInputV25();
        configureTechnologyInputV657();
        return;
      }
      monSel.disabled=true;
      monSel.classList.add('bg-light');
      if(note)note.innerHTML=`<span class="special-class-subject-v26">Chuyên đề: ${escapeHtml(lop)} · Môn/KHBD: ${escapeHtml(subject)}</span>`;
    }

    configureGdtcInputV25();
    configureTechnologyInputV657();
    populateGdtcClassOptionsV26();
    loadDanhSachBaiDay();
  }

  function populateGdtcClassOptionsV26(){
    const c1=document.getElementById('gdtcClass1V26');
    const c2=document.getElementById('gdtcClass2V26');
    const c3=document.getElementById('gdtcClass3V26');
    if(!c1||!c2||!c3)return;
    const primary=document.getElementById('lop')?.value||'';
    const khoi=document.getElementById('khoi')?.value||'';
    c1.value=primary;
    const old2=c2.value,old3=c3.value;
    const main=(dsLopChinhTheoKhoiV22[khoi]||[]).filter(x=>x!==primary);

    const fill=(sel,keep,exclude)=>{
      sel.innerHTML='<option value="">-- Không ghép --</option>';
      main.filter(x=>!exclude.includes(x)).forEach(x=>sel.add(new Option(x,x)));
      if(keep && [...sel.options].some(o=>o.value===keep))sel.value=keep;
    };
    fill(c2,old2,[old3]);
    fill(c3,old3,[c2.value]);
    syncGdtcClassMixNoteV26();
  }

  function syncGdtcClassMixV26(){
    const c2=document.getElementById('gdtcClass2V26');
    const c3=document.getElementById('gdtcClass3V26');
    if(c2&&c3&&c2.value&&c2.value===c3.value)c3.value='';
    populateGdtcClassOptionsV26();
  }

  function getGdtcClassMixV26(){
    const primary=document.getElementById('lop')?.value||'';
    const arr=[primary,document.getElementById('gdtcClass2V26')?.value||'',document.getElementById('gdtcClass3V26')?.value||'']
      .filter(Boolean);
    return [...new Set(arr)].slice(0,3);
  }

  function syncGdtcClassMixNoteV26(){
    const note=document.getElementById('gdtcClassMixNoteV26');
    if(!note)return;
    const arr=getGdtcClassMixV26();
    note.textContent=arr.length>1
      ? `Tiết này sẽ xuất hiện trong Sổ đầu bài GDTC của ${arr.length} lớp: ${arr.join(', ')}.`
      : 'Nếu tiết chỉ học 1 lớp thì để Lớp 2 và Lớp 3 trống.';
  }

  function isGdtcBaseSubjectV25(value){
    const k=normalizeTextKey(value);
    return k==='gdtc'||k==='giao duc the chat'||k==='the duc';
  }
  function isGdtcDetailSubjectV25(value){
    const k=normalizeTextKey(value);
    return k==='cau long'||k==='bong chuyen';
  }
  function isTechnologyBaseSubjectV657(value){
    const k=normalizeTextKey(value);
    return k==='cong nghe'||k==='congnghe';
  }
  function isTechnologyDetailSubjectV657(value){
    const k=normalizeTextKey(value);
    return k==='cong nghe nong nghiep'||k==='congnghenongnghiep'||k==='cong nghe cong nghiep'||k==='congnghecongnghiep';
  }
  function gvbmHasTechnologyV657(){
    return !!(gvbmDangNhapInfo&&(gvbmDangNhapInfo.dsMonGV||[]).some(m=>isTechnologyBaseSubjectV657(m)||isTechnologyDetailSubjectV657(m)));
  }
  function getTechnologyBaseOptionValueV657(){
    const sel=document.getElementById('monHoc');
    if(!sel)return '';
    const opt=[...sel.options].find(o=>isTechnologyBaseSubjectV657(o.value));
    return opt?opt.value:'';
  }
  function configureTechnologyInputV657(){
    const wrap=document.getElementById('technologyTeachingSubjectWrapV657');
    const detail=document.getElementById('technologyTeachingSubjectV657');
    const mon=document.getElementById('monHoc');
    if(!wrap||!detail||!mon)return false;
    const show=gvbmHasTechnologyV657()&&isTechnologyBaseSubjectV657(mon.value);
    wrap.classList.toggle('d-none',!show);
    detail.required=show;
    if(!show)detail.value='';
    return show;
  }
  function gvbmHasGdtcV25(){
    return !!(gvbmDangNhapInfo&&(gvbmDangNhapInfo.dsMonGV||[]).some(isGdtcBaseSubjectV25));
  }
  function getGdtcBaseOptionValueV25(){
    const sel=document.getElementById('monHoc');
    if(!sel)return '';
    const opt=[...sel.options].find(o=>isGdtcBaseSubjectV25(o.value));
    return opt?opt.value:'';
  }
  function configureGdtcInputV25(){
    const wrap=document.getElementById('gdtcTeachingSubjectWrapV25');
    const detail=document.getElementById('gdtcTeachingSubjectV25');
    const mon=document.getElementById('monHoc');
    if(!wrap||!detail||!mon)return false;
    const show=gvbmHasGdtcV25()&&isGdtcBaseSubjectV25(mon.value);
    wrap.classList.toggle('d-none',!show);
    detail.required=show;
    if(!show){
      detail.value='';
      const c2=document.getElementById('gdtcClass2V26'),c3=document.getElementById('gdtcClass3V26');
      if(c2)c2.value='';if(c3)c3.value='';
    }else{
      populateGdtcClassOptionsV26();
    }
    return show;
  }
  function getEffectiveMonHocV25(){
    const mon=document.getElementById('monHoc');
    const gdtcDetail=document.getElementById('gdtcTeachingSubjectV25');
    const techDetail=document.getElementById('technologyTeachingSubjectV657');
    if(mon&&gvbmHasGdtcV25()&&isGdtcBaseSubjectV25(mon.value)){
      return gdtcDetail?String(gdtcDetail.value||'').trim():'';
    }
    if(mon&&gvbmHasTechnologyV657()&&isTechnologyBaseSubjectV657(mon.value)){
      return techDetail?String(techDetail.value||'').trim():'';
    }
    return mon?String(mon.value||'').trim():'';
  }
  function onMonHocChangedV25(){
    configureGdtcInputV25();
    configureTechnologyInputV657();
    if(gvbmDangNhapInfo){capNhatKhoiVaLopPhanCongV39(true);return;}
    loadDanhSachBaiDay();
  }
  function expandGdtcSubjectsV25(mons){
    const out=[],seen=new Set();
    (mons||[]).forEach(m=>{
      const k=normalizeTextKey(m);
      if(!seen.has(k)){seen.add(k);out.push(m);}
    });
    if(out.some(isGdtcBaseSubjectV25)){
      ['Cầu lông','Bóng chuyền'].forEach(m=>{
        const k=normalizeTextKey(m);if(!seen.has(k)){seen.add(k);out.push(m);}
      });
    }
    if(out.some(isTechnologyBaseSubjectV657)){
      ['Công nghệ nông nghiệp','Công nghệ công nghiệp'].forEach(m=>{
        const k=normalizeTextKey(m);if(!seen.has(k)){seen.add(k);out.push(m);}
      });
    }
    return out;
  }

  function isSpecialProxySignerV682(info){
    if(!info)return false;
    if(info.canProxySign===true)return true;
    return Array.isArray(info.specialPermissions)&&info.specialPermissions.includes('PROXY_SIGN');
  }
  function configureProxySigningUiV682(){
    const box=document.getElementById('proxySignBoxV682');
    const toggle=document.getElementById('proxySigningToggleV682');
    const input=document.getElementById('proxyTeacherNameV682');
    const hint=document.getElementById('proxySignHintV682');
    if(!box||!toggle||!input)return;
    const enabled=isSpecialProxySignerV682(gvbmDangNhapInfo);
    box.classList.toggle('d-none',!enabled);
    if(!enabled){
      toggle.checked=false;
      input.value='';
      input.disabled=true;
      input.required=false;
      if(hint)hint.textContent='';
      return;
    }
    input.disabled=!toggle.checked;
    input.required=!!toggle.checked;
    if(hint)hint.textContent=toggle.checked
      ? 'Tiết này sẽ hiển thị tên nhân sự ngoài trường; hệ thống ghi rõ tài khoản thực hiện ký thay trong nhật ký.'
      : 'Chỉ dùng khi ký thay cho nhân sự ngoài nhà trường.';
  }
  function onProxySigningToggleV682(){
    configureProxySigningUiV682();
    const input=document.getElementById('proxyTeacherNameV682');
    if(input && !input.disabled) setTimeout(()=>input.focus(),60);
  }

  function populateGVBMFromUnifiedV4(res){
    gvbmDangNhapInfo=res;
    document.getElementById('gvbmMainContent').classList.remove('d-none');
    document.getElementById('tenGV').value=res.tenGV||'';
    document.getElementById('cccd').value=res.cccd||'';
    const selectMon=document.getElementById('monHoc');selectMon.innerHTML='';
    (res.dsMonGV||[]).forEach(m=>selectMon.add(new Option(m,m)));
    if(!(res.dsMonGV||[]).length)selectMon.add(new Option('-- Chưa có môn --',''));
    configureGdtcInputV25();
    configureTechnologyInputV657();
    if(res.phanCongLopTheoMon!==undefined)capNhatKhoiVaLopPhanCongV39(false);
    else ensureAssignmentDataV39();
    capNhatTrangThaiChuKyV21(res.urlChuKy||"");
    configureProxySigningUiV682();
    setTimeout(()=>capNhatHanNhapTietV683(),120);
  }
  // V69: loại bỏ định nghĩa cũ của populateGVCNFromUnifiedV4; dùng implementation duy nhất ở khối GVCN V68.1/V69.


  function populateGiamThiFromUnifiedV4(res,isAdmin){
    giamThiDangNhapInfo=res;
    document.getElementById('giamThiMainContent').classList.remove('d-none');
    document.getElementById('giamThiWelcomeMsg').innerText=isAdmin?'🛡️ Quản trị đang truy cập mô-đun Giám thị':'🛡️ Quyền Giám thị: '+(res.tenGV||'')+(res.chucVu?' (Chức vụ: '+res.chucVu+')':'');
    setTimeout(()=>khoiTaoGiamThiTrangThaiV683(),120);
  }

  function isPhoHieuTruongClientV50(){
    const bgh=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions&&currentUnifiedLoginV4.sessions.BGH;
    return !!(bgh && normalizeTextKey(bgh.chucVu||'').includes('pho hieu truong'));
  }
  function isKhbdApproverClientV50(){
    return hasRoleV4('ADMIN') || isPhoHieuTruongClientV50();
  }
  function getKhbdApprovalAuthV50(){
    const sessions=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};
    if(isPhoHieuTruongClientV50()&&sessions.BGH)return {token:sessions.BGH.sessionToken};
    if(hasRoleV4('ADMIN')&&sessions.ADMIN)return {token:sessions.ADMIN.sessionToken};
    return {token:ttcmDangNhapInfo&&ttcmDangNhapInfo.sessionToken||''};
  }
  function populateTTCMFromUnifiedV4(res,fullAccessLabel){
    const isTtcm=hasRoleV4('TTCM'), isBgh=hasRoleV4('BGH'), isAdmin=hasRoleV4('ADMIN'), isPht=isPhoHieuTruongClientV50();
    const sessions=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};
    const bghSession=sessions.BGH;
    // V68.5.2: nếu một tài khoản đồng thời có TTCM + BGH thì phải ưu tiên phiên TTCM
    // để giữ đúng danh sách môn và quyền TẢI KHBD của Tổ trưởng/Tổ phó.
    const effectiveRes=(isTtcm&&sessions.TTCM)?sessions.TTCM:((isBgh&&bghSession)?bghSession:res);
    ttcmDangNhapInfo=effectiveRes;
    document.getElementById('ttcmMainContent').classList.remove('d-none');
    const mons=effectiveRes.dsMon||[];
    const name=effectiveRes.tenTTCM||effectiveRes.tenBGH||effectiveRes.tenGV||res.tenTTCM||res.tenBGH||res.tenGV||'';
    document.getElementById('ttcmWelcomeMsg').innerText=fullAccessLabel
      ? `✅ ${fullAccessLabel}${name?' — '+name:''} — quyền xem và quản lý KHBD toàn trường${isPht?' · Có quyền duyệt KHBD':''}`
      : `✅ ${name} — ${effectiveRes.chucVu||res.chucVu||'Tổ trưởng/Tổ phó chuyên môn'} — Môn: ${mons.join(', ')}`;
    const uploadMons=expandGdtcSubjectsV25(mons);
    const sel=document.getElementById('khbdUploadMon');if(sel){sel.innerHTML='';uploadMons.forEach(m=>sel.add(new Option(m,m)));}
    const viewMon=document.getElementById('khbdViewMon');if(viewMon){viewMon.innerHTML='';uploadMons.forEach(m=>viewMon.add(new Option(m,m)));}
    const viewKhoi=document.getElementById('khbdViewKhoi');if(viewKhoi)viewKhoi.value='10';
    const body=document.getElementById('khbdViewBodyV36');if(body)body.innerHTML='<tr><td colspan="6" class="text-center text-muted py-3">Chọn Khối, Môn và bấm “Xem KHBD”.</td></tr>';
    const summary=document.getElementById('khbdViewSummaryV36');if(summary){summary.textContent='Chưa tải danh sách.';delete summary.dataset.loaded;}
    const approvalBox=document.getElementById('khbdApprovalBoxV50');if(approvalBox)approvalBox.classList.add('d-none');

    // V68.5.2: TTCM/Tổ phó luôn được thấy tab Tải KHBD, kể cả khi cùng tài khoản có thêm quyền BGH.
    // BGH thuần chỉ xem; riêng Phó Hiệu trưởng được Duyệt/Trả lại. Admin vẫn có toàn quyền.
    const uploadNav=document.getElementById('khbd-upload-tab-v38')?.parentElement;
    const submittedNav=document.getElementById('khbd-submitted-nav-v659');
    const approvalNav=document.getElementById('khbd-approval-nav-v50');
    const canUploadKhbd=isTtcm||isAdmin;
    if(uploadNav)uploadNav.classList.toggle('d-none',!canUploadKhbd);
    if(submittedNav)submittedNav.classList.toggle('d-none',!isTtcm);
    if(approvalNav)approvalNav.classList.toggle('d-none',!(isPht||isAdmin));
    if(isTtcm)setTimeout(()=>taiKhbdDaTaiTTCMV659(false),140);
    if((isPht||isAdmin)&&!isTtcm){
      setTimeout(()=>{
        const tab=document.getElementById('khbd-approval-tab-v50');
        if(tab&&window.bootstrap)bootstrap.Tab.getOrCreateInstance(tab).show();
      },80);
    }else if(isBgh&&!isTtcm){
      setTimeout(()=>{const tab=document.getElementById('khbd-view-tab-v38');if(tab&&window.bootstrap)bootstrap.Tab.getOrCreateInstance(tab).show();},80);
    }else if(isTtcm){
      setTimeout(()=>{
        ensureTtcmUploadUiV6852();
        const tab=document.getElementById('khbd-upload-tab-v38');
        if(tab&&window.bootstrap)bootstrap.Tab.getOrCreateInstance(tab).show();
      },80);
    }
  }


  let khbdMyRowsV67=[];
  function configureTeacherKhbdV67(){
    const sessions=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};
    const hasTeacher=!!sessions.GVBM, hasManage=!!sessions.TTCM||!!sessions.BGH||!!sessions.ADMIN;
    const nav=document.getElementById('khbd-my-nav-v67');if(nav)nav.classList.toggle('d-none',!hasTeacher);
    if(!hasTeacher)return;
    document.getElementById('ttcmMainContent')?.classList.remove('d-none');
    const gv=sessions.GVBM;
    const monSel=document.getElementById('khbdMyMonV67');
    if(monSel){const old=monSel.value;monSel.innerHTML='';expandGdtcSubjectsV25(gv.dsMonGV||[]).forEach(m=>monSel.add(new Option(m,m)));if([...monSel.options].some(o=>o.value===old))monSel.value=old;}
    napLopKhbdCaNhanV691();
    if(!hasManage){
      document.getElementById('khbd-upload-tab-v38')?.parentElement?.classList.add('d-none');
      document.getElementById('khbd-view-tab-v38')?.parentElement?.classList.add('d-none');
      document.getElementById('khbd-submitted-nav-v659')?.classList.add('d-none');
      document.getElementById('khbd-approval-nav-v50')?.classList.add('d-none');
      const w=document.getElementById('ttcmWelcomeMsg');if(w)w.textContent=`✅ ${gv.tenGV||''} — chọn từng tiết/bài KHBD đã được Phó Hiệu trưởng duyệt để sử dụng riêng cho từng lớp.`;
      setTimeout(()=>{const t=document.getElementById('khbd-my-tab-v67');if(t&&window.bootstrap)bootstrap.Tab.getOrCreateInstance(t).show();},80);
    }
  }
  function ensureTtcmUploadUiV6852(){
    const sessions=currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions||{};
    if(!sessions.TTCM)return;
    const uploadTab=document.getElementById('khbd-upload-tab-v38');
    const uploadNav=uploadTab?.parentElement;
    const uploadPane=document.getElementById('khbd-upload-pane-v38');
    if(uploadNav)uploadNav.classList.remove('d-none');
    if(uploadPane)uploadPane.classList.remove('d-none');
    const active=document.querySelector('#khbdSubTabsV38 .nav-link.active');
    if(!active || active.closest('li')?.classList.contains('d-none')){
      if(uploadTab&&window.bootstrap)bootstrap.Tab.getOrCreateInstance(uploadTab).show();
    }
  }
  function getKhbdMyAuthV67(){return {token:gvbmDangNhapInfo&&gvbmDangNhapInfo.sessionToken||''};}
  function napLopKhbdCaNhanV691(){
    const sel=document.getElementById('khbdMyLopV691');if(!sel)return;
    const old=sel.value,khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=String(document.getElementById('khbdMyMonV67')?.value||'').trim();
    const map=gvbmDangNhapInfo?.phanCongLopTheoMon||{},key=normalizeTextKey(mon);let classes=Array.isArray(map[key])?map[key].slice():[];
    if(!classes.length&&(isGdtcBaseSubjectV25(mon)||isGdtcDetailSubjectV25(mon))){Object.keys(map).forEach(k=>{if(isGdtcBaseSubjectV25(k)||isGdtcDetailSubjectV25(k))classes.push(...(map[k]||[]));});}
    if(!classes.length&&isTechnologyDetailSubjectV657(mon)){Object.keys(map).forEach(k=>{if(isTechnologyBaseSubjectV657(k)||isTechnologyDetailSubjectV657(k))classes.push(...(map[k]||[]));});}
    classes=[...new Set(classes.map(x=>String(x||'').trim()).filter(Boolean))].filter(c=>{const meta=classMetaV26[normalizeTextKey(c)]||{};const g=Number(meta.khoi||String(c).match(/^(10|11|12)/)?.[1]||0);return !g||g===khoi;}).sort((a,b)=>a.localeCompare(b,'vi'));
    sel.innerHTML='<option value="">-- Chọn lớp --</option>';classes.forEach(c=>sel.add(new Option(c,c)));if(classes.includes(old))sel.value=old;else if(classes.length===1)sel.value=classes[0];
  }
  function capNhatThongKeKhbdTietV692(){
    const checks=[...document.querySelectorAll('.khbd-my-check-v67')], selected=checks.filter(x=>x.checked);
    const lop=String(document.getElementById('khbdMyLopV691')?.value||'').trim();
    const badge=document.getElementById('khbdMyCountV67');if(badge)badge.textContent=`${selected.length}/${checks.length} tiết đã chọn${lop?' · '+lop:''}`;
    const byWeek=new Map();
    checks.forEach(x=>{const w=Number(x.dataset.week||0);const g=byWeek.get(w)||{all:0,sel:0};g.all++;if(x.checked)g.sel++;byWeek.set(w,g);});
    const summary=[...byWeek.entries()].sort((a,b)=>a[0]-b[0]).map(([w,g])=>`Tuần ${w}: ${g.sel}/${g.all}`).join(' · ');
    const status=document.getElementById('khbdMySelectionSummaryV692');if(status)status.textContent=summary||'Chưa có tiết KHBD.';
  }
  function taiKhbdCaNhanV67(){
    if(!gvbmDangNhapInfo||!gvbmDangNhapInfo.sessionToken)return;
    const khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=String(document.getElementById('khbdMyMonV67')?.value||'').trim(),lop=String(document.getElementById('khbdMyLopV691')?.value||'').trim();
    const body=document.getElementById('khbdMyBodyV67'),status=document.getElementById('khbdMyStatusV67');if(!body||!status||!mon)return;
    if(!lop){body.innerHTML='<tr><td colspan="8" class="text-center text-muted py-4">Chọn lớp để tích từng tiết/bài KHBD riêng cho lớp đó.</td></tr>';status.textContent='Ví dụ Tuần 4 có 4 tiết: lớp 10A1 có thể chọn 4/4, lớp 10A2 chọn 3/4.';document.getElementById('khbdMyCountV67').textContent='0 tiết đã chọn';const sum=document.getElementById('khbdMySelectionSummaryV692');if(sum)sum.textContent='';return;}
    body.innerHTML='<tr><td colspan="8" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải các tiết KHBD đã duyệt...</td></tr>';
    google.script.run.withSuccessHandler(function(res){
      if(!res||!res.success){body.innerHTML='<tr><td colspan="8" class="text-center text-danger py-4">Không tải được KHBD.</td></tr>';status.textContent=res&&res.message||'Không tải được dữ liệu.';return;}
      khbdMyRowsV67=res.data||[];status.textContent=res.message||'';
      body.innerHTML=khbdMyRowsV67.length?khbdMyRowsV67.map(x=>`<tr>
        <td class="text-center"><input class="form-check-input khbd-my-check-v67" type="checkbox" data-khbd-id="${escapeHtml(x.khbdId||'')}" data-week="${escapeHtml(x.tuan)}" ${x.selected?'checked':''}></td>
        <td class="text-center fw-bold">${escapeHtml(x.tuan)}</td>
        <td class="text-center fw-semibold">${escapeHtml(x.tietPPCT||'—')}</td>
        <td class="fw-bold text-primary">${escapeHtml(lop)}</td>
        <td class="fw-semibold">${escapeHtml(x.mon)}</td>
        <td class="text-start">${escapeHtml(x.noiDung||'')}</td>
        <td class="text-start small text-muted">${escapeHtml(x.yeuCauCanDat||'')}</td>
        <td>${escapeHtml(x.selectedAt||'—')}</td>
      </tr>`).join(''):'<tr><td colspan="8" class="text-center text-muted py-4">Chưa có KHBD đã duyệt phù hợp.</td></tr>';
      body.querySelectorAll('.khbd-my-check-v67').forEach(x=>x.addEventListener('change',capNhatThongKeKhbdTietV692));
      capNhatThongKeKhbdTietV692();
    }).withFailureHandler(function(err){body.innerHTML='<tr><td colspan="8" class="text-center text-danger py-4">Lỗi Supabase.</td></tr>';status.textContent=String(err&&err.message||err);}).layKhbdCaNhanV67({khoi,mon,lop},getKhbdMyAuthV67());
  }
  function luuKhbdDaTichV67(){
    const khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=String(document.getElementById('khbdMyMonV67')?.value||'').trim(),lop=String(document.getElementById('khbdMyLopV691')?.value||'').trim(),khbdIds=[...document.querySelectorAll('.khbd-my-check-v67:checked')].map(x=>String(x.dataset.khbdId||'').trim()).filter(Boolean);
    if(!lop){showToastV9('Vui lòng chọn lớp trước khi lưu KHBD.','danger');return;}
    setBusyV13(true,'Đang lưu từng tiết KHBD cho lớp...');google.script.run.withSuccessHandler(function(res){setBusyV13(false);if(!res||!res.success){alertV13('❌ '+(res&&res.message||'Không lưu được'));return;}lessonPlanCache={};showToastV9(res.message||'Đã lưu.','success');taiKhbdCaNhanV67();}).withFailureHandler(function(err){setBusyV13(false);alertV13('❌ '+String(err&&err.message||err));}).chonKhbdCaNhanV67({mode:'SYNC_LESSONS',khoi,mon,lop,khbdIds},getKhbdMyAuthV67());
  }
  function chonToanBoKhbdV67(){const khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=String(document.getElementById('khbdMyMonV67')?.value||'').trim(),lop=String(document.getElementById('khbdMyLopV691')?.value||'').trim();if(!lop){showToastV9('Vui lòng chọn lớp.','danger');return;}google.script.run.withSuccessHandler(function(res){if(res?.success){showToastV9(res.message,'success');lessonPlanCache={};taiKhbdCaNhanV67();}else alertV13('❌ '+(res?.message||''));}).chonKhbdCaNhanV67({mode:'SELECT_ALL',khoi,mon,lop},getKhbdMyAuthV67());}
  function boChonKhbdV67(){const khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=String(document.getElementById('khbdMyMonV67')?.value||'').trim(),lop=String(document.getElementById('khbdMyLopV691')?.value||'').trim();if(!lop){showToastV9('Vui lòng chọn lớp.','danger');return;}google.script.run.withSuccessHandler(function(res){if(res?.success){showToastV9(res.message,'success');lessonPlanCache={};taiKhbdCaNhanV67();}}).chonKhbdCaNhanV67({mode:'CLEAR_SCOPE',khoi,mon,lop},getKhbdMyAuthV67());}


  function moTabMacDinhV33(res){
    setTimeout(function(){
      const btn=document.getElementById('dashboard-tab-v9');
      if(btn){
        try{
          if(window.bootstrap)bootstrap.Tab.getOrCreateInstance(btn).show();
          else btn.click();
        }catch(e){try{btn.click();}catch(_e){}}
      }
      const runDash=()=>refreshDashboardV9(false);
      if('requestIdleCallback' in window)requestIdleCallback(runDash,{timeout:350});else setTimeout(runDash,120);
    },40);
  }

  function apDungPhanQuyenV4(res,saveSession){
    initClientUiV7();
    currentUnifiedLoginV4=res;
    const sessions=res.sessions||{}, roles=res.roles||[], isAdmin=roles.includes('ADMIN'), isBgh=roles.includes('BGH');
    gvbmDangNhapInfo=null;gvcnDangNhapInfo=null;giamThiDangNhapInfo=null;ttcmDangNhapInfo=null;adminDangNhapInfo=null;

    // V54: chỉ hiện đúng mô-đun thuộc vai trò đang có; tài khoản nhiều vai trò dùng hợp quyền.
    setTopTabVisibleV4('dashboard-tab-v9',true);
    setTopTabVisibleV4('view-tab',!!sessions.GVBM||!!sessions.GVCN||!!sessions.BGH);
    setTopTabVisibleV4('input-tab',!!sessions.GVBM);
    setTopTabVisibleV4('gvcn-tab',!!sessions.GVCN);
    setTopTabVisibleV4('giamthi-tab',!!sessions.GIAM_THI);
    setTopTabVisibleV4('ttcm-tab',!!sessions.TTCM||!!sessions.BGH||!!sessions.GVBM);
    setTopTabVisibleV4('admin-tab',isAdmin);
    rebuildMobileRoleNavV54();

    // Reset module bodies before applying current role set.
    ['gvbmMainContent','gvcnMainContent','giamThiMainContent','ttcmMainContent','adminMainContent'].forEach(id=>{const x=document.getElementById(id);if(x)x.classList.add('d-none');});

    if(sessions.GVBM){hideAdminReadonlyNoteV4('adminInputReadonlyV4');populateGVBMFromUnifiedV4(sessions.GVBM);}
    else if(isAdmin){ensureAdminReadonlyNoteV4('tabInput','adminInputReadonlyV4','Quản trị đang xem mô-đun Nhập Tiết Học','Admin nhìn thấy tab này để kiểm tra quy trình nhưng không được ký hoặc ghi thay giáo viên. Muốn ghi tiết phải đăng nhập bằng tài khoản giáo viên tương ứng.');}

    if(sessions.GVCN){hideAdminReadonlyNoteV4('adminGvcnReadonlyV4');populateGVCNFromUnifiedV4(sessions.GVCN);}
    else if(isAdmin){ensureAdminReadonlyNoteV4('tabGVCN','adminGvcnReadonlyV4','Quản trị đang xem mô-đun GVCN','Admin không ký chốt thay GVCN. Việc ký chốt vẫn bắt buộc dùng đúng tài khoản GVCN để bảo đảm nhật ký và trách nhiệm người ký.');}

    if(sessions.GIAM_THI)populateGiamThiFromUnifiedV4(sessions.GIAM_THI,false);
    else if(isAdmin){
      const a=sessions.ADMIN;populateGiamThiFromUnifiedV4({sessionToken:a.sessionToken,tenGV:res.profile.ten,chucVu:'Quản trị hệ thống'},true);
    }

    if(sessions.TTCM)populateTTCMFromUnifiedV4(sessions.TTCM,'');
    else if(isBgh&&sessions.BGH)populateTTCMFromUnifiedV4(sessions.BGH,'Ban giám hiệu');
    else if(isAdmin){
      const a=sessions.ADMIN;populateTTCMFromUnifiedV4({sessionToken:a.sessionToken,sdt:'ADMIN',tenTTCM:res.profile.ten,chucVu:'Quản trị hệ thống',dsMon:a.dsMon||[]},'Quản trị hệ thống');
    }

    if(isAdmin){adminDangNhapInfo=sessions.ADMIN;document.getElementById('adminMainContent').classList.remove('d-none');}
    configureTeacherKhbdV67();

    moTabMacDinhV33(res);

    // User header.
    const profile=res.profile||{};document.getElementById('appUserNameV4').textContent=profile.ten||profile.taiKhoan||'Người dùng';
    document.getElementById('appUserMetaV4').textContent='Trường THPT Hồ Thị Bi';
    const initials=(profile.ten||'GV').trim().split(/\s+/).slice(-2).map(x=>x[0]||'').join('').toUpperCase();document.getElementById('appUserAvatarV4').textContent=initials||'GV';
    document.getElementById('appRoleBadgesV4').innerHTML=(res.roles||[]).map(r=>`<span class="role-chip-v4">${roleLabelV4(r)}</span>`).join('');
    capNhatLoiChaoTheoGioV48();

    document.getElementById('loginScreenV4').classList.add('d-none');
    document.getElementById('appShellV4').classList.remove('d-none');
    document.body.classList.remove('auth-locked-v4');
    setCentralLoginStatusV4('', '');
    if(saveSession){try{
      const savedLoginV64=JSON.parse(JSON.stringify(res));delete savedLoginV64.initialDashboardV64;
      // V69: không persist signed URL của chữ ký; khi khôi phục phiên sẽ xin URL mới từ Edge.
      Object.values(savedLoginV64.sessions||{}).forEach(function(session){if(session&&typeof session==='object')delete session.urlChuKy;});
      if(savedLoginV64.bootstrap&&savedLoginV64.bootstrap.signature)savedLoginV64.bootstrap.signature.url='';
      sessionStorage.setItem('SODB_V4_UNIFIED_LOGIN',JSON.stringify(savedLoginV64));
    }catch(e){}}
    // V63: bootstrap ưu tiên snapshot bền vững từ backend; không gọi request thứ hai khi đã có.
    if(res.bootstrap&&res.bootstrap.success)applyBootstrapV6(res.bootstrap);
    // Nếu chưa có bootstrap ấm, ưu tiên cache sessionStorage theo đúng tài khoản; chỉ gọi server khi thật sự cần.
    setTimeout(()=>{if(!bootstrapLoadedV6)taiBootstrapV6(false);},0);

    // V47: Dashboard chỉ tải khi người dùng thực sự mở tab; tránh quét sổ tuần
    // ở nền trong lúc hệ thống đang chuyển đến mô-đun mặc định của vai trò.
    resetOverviewV20();
  }

  // V49: Lời chào nổi bật theo 4 khung giờ, dùng giờ thiết bị của người dùng.
  function capNhatLoiChaoTheoGioV48(){
    const now=new Date();
    const minutes=now.getHours()*60+now.getMinutes();
    let greeting='Chào buổi tối!', icon='🌙';
    if(minutes<10*60){
      greeting='Chào buổi sáng!'; icon='☀️';
    }else if(minutes<13*60+30){
      greeting='Chào buổi trưa!'; icon='🌤️';
    }else if(minutes<17*60){
      greeting='Chào buổi chiều!'; icon='🌇';
    }
    const textEl=document.getElementById('headerGreetingTimeV48');
    const iconEl=document.getElementById('headerGreetingIconV48');
    if(textEl)textEl.textContent=greeting;
    if(iconEl)iconEl.textContent=icon;
  }

  // Cập nhật mỗi phút để tự đổi đúng tại 10:00, 13:30 và 17:00.
  capNhatLoiChaoTheoGioV48();
  setInterval(capNhatLoiChaoTheoGioV48,60000);

  function khoiPhucPhienTapTrungV4(){
    let raw='';try{raw=sessionStorage.getItem('SODB_V4_UNIFIED_LOGIN')||'';}catch(e){}
    if(!raw){document.body.classList.add('auth-locked-v4');return;}
    let saved;try{saved=JSON.parse(raw);}catch(e){try{sessionStorage.removeItem('SODB_V4_UNIFIED_LOGIN');}catch(_){};document.body.classList.add('auth-locked-v4');return;}

    // V6: khôi phục giao diện ngay từ sessionStorage; mọi API nhạy cảm vẫn kiểm token ở backend.
    if(saved&&saved.roles&&saved.roles.length)apDungPhanQuyenV4(saved,false);
    const tokenMap=tokenMapFromLoginV4(saved);
    google.script.run.withSuccessHandler(function(check){
      if(!check||!check.success){try{sessionStorage.removeItem('SODB_V4_UNIFIED_LOGIN');}catch(e){};resetLogoutUiV6();return;}
      const valid=new Set(check.roles||[]);saved.roles=(saved.roles||[]).filter(r=>valid.has(r));Object.keys(saved.sessions||{}).forEach(r=>{if(!valid.has(r))delete saved.sessions[r];});
      if(!saved.roles.length){resetLogoutUiV6();return;}
      currentUnifiedLoginV4=saved;
      // V49: áp lại giao diện sau khi backend loại các role vừa bị tắt trong PHÂN QUYỀN.
      apDungPhanQuyenV4(saved,false);
      // V69: signed URL chữ ký là ngắn hạn; luôn refresh bootstrap sau khi xác thực lại phiên.
      bootstrapLoadedV6=false;
      taiBootstrapV6(true);
    }).withFailureHandler(function(){/* Giữ UI; backend sẽ tự chặn nếu token thực sự hết hạn. */}).xacThucPhienHeThongV4(tokenMap);
  }


  function resetLogoutUiV6(){
    resetOverviewV20();
    inputLessonLoadedV7=false; adminSubjectsLoadedV7=false; bootstrapLoadedV6=false; bootstrapPendingV47=false;
    currentUnifiedLoginV4=null;gvbmDangNhapInfo=null;gvcnDangNhapInfo=null;giamThiDangNhapInfo=null;ttcmDangNhapInfo=null;adminDangNhapInfo=null;
    document.getElementById('appShellV4').classList.add('d-none');document.getElementById('loginScreenV4').classList.remove('d-none');document.body.classList.add('auth-locked-v4');
    const a=document.getElementById('centralAccountV4');if(a)setTimeout(()=>a.focus(),30);
  }

  function dangXuatTapTrungV4(){
    const tokenMap=tokenMapFromLoginV4(currentUnifiedLoginV4);
    try{sessionStorage.removeItem('SODB_V4_UNIFIED_LOGIN');}catch(e){}
    resetLogoutUiV6(); // phản hồi ngay, không chờ server và không reload cả trang
    try{google.script.run.dangXuatHeThongV4(tokenMap);}catch(e){}
  }


  let clientUiInitializedV7 = false;
  function initClientUiV7() {
    if (clientUiInitializedV7) return;
    clientUiInitializedV7 = true;
    chonKhoiLopView(); chonKhoiLopInput(); chonKhoiLopLogin(); chonKhoiLopAdmin();
    khoiTaoDanhSachLopGiamThi(); capNhatTuanVaThu();
  }

  document.addEventListener('DOMContentLoaded', function() {
    const today=new Date(),yyyy=today.getFullYear(),mm=String(today.getMonth()+1).padStart(2,'0'),dd=String(today.getDate()).padStart(2,'0'),todayStr=`${yyyy}-${mm}-${dd}`;
    ['ngayDay','gtTuNgay','gtDenNgay','gtDetailTuNgay','gtDetailDenNgay','gtLateTuNgay','gtLateDenNgay','adminTuNgay','adminDenNgay','specialPermissionFromV69'].forEach(id=>{const x=document.getElementById(id);if(x)x.value=todayStr;});
    const ngayDayElem=document.getElementById('ngayDay'); if(ngayDayElem)ngayDayElem.setAttribute('max',todayStr);

    const inputTab=document.getElementById('input-tab');
    if(inputTab)inputTab.addEventListener('shown.bs.tab',function(){refreshClassCatalogV29();lazyLoadInputLessonV7();});
    const viewTab=document.getElementById('view-tab');
    if(viewTab)viewTab.addEventListener('shown.bs.tab',refreshClassCatalogV29);
    const ttcmTab=document.getElementById('ttcm-tab'); if(ttcmTab)ttcmTab.addEventListener('shown.bs.tab',function(){
      lazyLoadAdminSubjectsV7();
      ensureTtcmUploadUiV6852();
      if(hasRoleV4('GVBM')){const my=document.getElementById('khbd-my-tab-v67');if(my&&my.classList.contains('active'))taiKhbdCaNhanV67();}
      if(isKhbdApproverClientV50()){
        const approval=document.getElementById('khbd-approval-tab-v50');
        if(approval&&approval.classList.contains('active'))taiHangDoiDuyetKHBDV50();
      }
    });

    // Màn hình đăng nhập hiển thị trước; các danh sách lớn chỉ khởi tạo sau khi xác thực.
    khoiPhucPhienTapTrungV4();
  });

  /* V51: LOAD MÔN HỌC/GIÁO VIÊN CHO ĐỐI SOÁT KHBD - CHỈ ADMIN */
  function getAdminCompareAuthV51(){
    const token=(adminDangNhapInfo&&adminDangNhapInfo.sessionToken)||(currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions&&currentUnifiedLoginV4.sessions.ADMIN&&currentUnifiedLoginV4.sessions.ADMIN.sessionToken)||'';
    return {token:token};
  }

  function loadDanhSachMonKHBDGiamThi() {
    google.script.run.withSuccessHandler(function(dsMon) {
      let selectMon = document.getElementById('gtCompareMon');
      selectMon.innerHTML = '<option value="">-- Chọn Môn học --</option>';
      if (dsMon && dsMon.length > 0) {
        dsMon.forEach(m => { selectMon.add(new Option(m, m)); });
      } else {
        selectMon.innerHTML = '<option value="">-- Chưa có Kế hoạch bài dạy --</option>';
      }
    }).getDanhSachMonKHBD(getAdminCompareAuthV51());
  }

  function loadDanhSachGVTheoMonGiamThi() {
  let mon = document.getElementById('gtCompareMon').value;
  let selectGV = document.getElementById('gtCompareGV');
  selectGV.innerHTML = '<option value="">-- Đang tải danh sách GV... --</option>';
  if (!mon) return;

  google.script.run.withSuccessHandler(function(dsGV) {
    selectGV.innerHTML = '<option value="ALL_GV">⚠️ Tất cả Giáo Viên dạy môn ' + mon + '</option>';
    if (dsGV && dsGV.length > 0) {
      dsGV.forEach(gv => { selectGV.add(new Option(gv.tenGV, gv.tenGV)); });
    }
  }).getDanhSachGVTheoMon(mon, getAdminCompareAuthV51());
}

  /* THỰC HIỆN ĐỐI SOÁT BÀI DẠY THỰC TẾ VỚI KẾ HOẠCH BÀI DẠY */
  function thucHienDoiSoatKHBDGiamThi() {
    let mon = document.getElementById('gtCompareMon').value;
    let tenGV = document.getElementById('gtCompareGV').value;
    let lop = document.getElementById('gtCompareLop').value;

    if (!mon || !tenGV) {
      showToastV9('Vui lòng chọn Môn học và Giáo viên cần kiểm tra.','danger');
      return;
    }

    let tbody = document.getElementById('gtCompareTableBody');
    tbody.innerHTML = `<tr><td colspan="8" class="py-3 text-center">⏳ Hệ thống đang rà soát dữ liệu Sổ Đầu Bài & KHBD...</td></tr>`;
    document.getElementById('gtCompareResultSection').classList.remove('d-none');
    document.getElementById('gtComparePlaceholder').classList.add('d-none');

    google.script.run.withSuccessHandler(function(res) {
      if (!res || !res.success) {
        alertV13("❌ Lỗi đối soát: " + (res ? res.message : "Không phản hồi"));
        return;
      }

      document.getElementById('gtCompareCountMsg').innerText = `📊 TÌM THẤY ${res.totalCount} TIẾT HỌC | 🚨 PHÁT HIỆN ${res.warningCount} TIẾT BẤT THƯỜNG (CẮT XÉN / ĐÔN TIẾT / SAI BÀI)`;
      tbody.innerHTML = "";

      if (res.results.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="py-4 text-warning fw-bold fs-6">⚠️ Không tìm thấy tiết học nào được ghi nhận cho giáo viên này!</td></tr>`;
        return;
      }

      res.results.forEach(item => {
        let badgeBg = "bg-success";
        if (item.statusType === "WARNING_JUMP") { badgeBg = "bg-danger"; }
        else if (item.statusType === "WARNING_MISMATCH") { badgeBg = "bg-warning text-dark"; }
        else if (item.statusType === "WARNING_DUPLICATE") { badgeBg = "bg-secondary"; }

        tbody.innerHTML += `<tr>
          <td class="fw-bold">${item.ngayFormatted}</td>
          <td class="fw-bold text-primary">${item.lop}</td>
          <td><span class="badge ${item.buoi === 'Sáng' ? 'bg-primary' : 'bg-danger'}">${item.buoi}</span> Tiết ${item.tiet}</td>
          <td class="fw-bold text-success fs-6">${item.tietCT}</td>
          <td class="text-start bg-light">${item.tenBaiThucTe}</td>
          <td class="text-start bg-light">${item.tenBaiChuan}</td>
          <td><span class="badge ${badgeBg} p-2" style="font-size:0.75rem;">${item.trangThaiAlert}</span></td>
          <td class="text-start"><b>${item.tenGV}</b></td>
        </tr>`;
      });
    }).doiSoatKHBDGiamThi(mon, tenGV, lop, getAdminCompareAuthV51());
  }

  function xuatExcelDoiSoatGiamThi() {
  if (retryWithXlsxV7(() => xuatExcelDoiSoatGiamThi())) return;
    let table = document.getElementById("gtCompareTableExcel");
    let wb = XLSX.utils.table_to_book(table, { sheet: "DoiSoatTienDoBaiDay" });
    XLSX.writeFile(wb, `BaoCao_DoiSoat_TienDo_BaiDay.xlsx`);
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
        <td class="fw-bold">${item.ngayDayFormatted}</td>
        <td class="small text-muted">${item.timeSubmitFormatted}</td>
        <td class="fw-bold text-primary fs-6">${item.lop}</td>
        <td><span class="badge ${item.buoi === 'Sáng' ? 'bg-primary' : 'bg-danger'}">${item.buoi}</span> Tiết ${item.tiet}</td>
        <td class="fw-semibold text-start">${escapeHtml(item.mon)} ${item.isTietTron ? '<span class="badge bg-warning text-dark">Tiết trộn</span>' : ''}</td>
        <td class="fw-bold text-success">${item.tietCT}</td>
        <td class="text-start">${item.tenBai}</td>
        <td><span class="badge ${badgeBg} p-2" style="font-size:0.75rem;">${item.trangThai}</span></td>
        <td class="text-start"><b>${item.tenGV}</b></td>
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
    const special=loaiSoTheoLopV22(lop)==='CHUYEN_DE';
    specialOpt.hidden=!special;
    sel.disabled=special;
    if(special)sel.value='CHUYEN_DE';
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

  function chonKhoiLopLogin() {
    const khoi=document.getElementById('loginKhoi').value;
    // GVCN chỉ áp dụng cho lớp chính A01-A13.
    napLopVaoSelectV22(document.getElementById('loginLop'),khoi,false);
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
    let scopeMon=document.getElementById('khbdUploadMon').value.trim();
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
      const mon=String(row[layout.mon]||scopeMon).trim();
      const weekMatch=String(row[layout.tuan]||'').match(/\d+/);
      const tuan=weekMatch?Number(weekMatch[0]):'';
      const tiet=layout.tiet>=0?String(row[layout.tiet]||'').trim():'';
      const bai=String(row[layout.bai]||'').trim();
      const yeuCau=String(row[layout.yeuCau]||'').trim();
      const range=tuan?getWeekRangeClient(tuan):{from:'',to:''};
      const rowNumber=i+1;
      if(khoi!==scopeKhoi)errors.push(`Dòng ${rowNumber}: Khối ${khoi||'trống'} khác Khối ${scopeKhoi}.`);
      if(normalizeTextKey(mon)!==normalizeTextKey(scopeMon))errors.push(`Dòng ${rowNumber}: Môn '${mon||'trống'}' khác '${scopeMon}'.`);
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
    const scopeMon=document.getElementById('khbdUploadMon').value.trim();
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
    let scopeMon = document.getElementById('khbdUploadMon').value.trim();
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
          let mon = String(row[layout.mon] || scopeMon).trim();
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
          if (normalizeTextKey(mon) !== normalizeTextKey(scopeMon)) errors.push(`Dòng ${rowNumber}: Môn '${mon || "trống"}' khác '${scopeMon}'.`);
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
      mon: document.getElementById('khbdUploadMon').value.trim()
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
    const mon=(document.getElementById('khbdViewMon')?.value||'').trim();
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
    if(ms){let opt=[...ms.options].find(o=>normalizeTextKey(o.value)===normalizeTextKey(mon));if(!opt){opt=new Option(mon,mon);ms.add(opt);}ms.value=opt.value;}
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

  /* ĐĂNG NHẬP TAB TỔ TRƯỞNG CHUYÊN MÔN */
  function xuLyDangNhapTTCM() {
    let sdt = document.getElementById('loginTTCMSdt').value.trim();
    let pw = document.getElementById('loginTTCMMatKhau').value.trim();
    if (!sdt || !pw) { alertV13("⚠️ Vui lòng nhập SĐT và mật khẩu TTCM."); return; }
    let btn = document.getElementById('btnLoginTTCM');
    btn.disabled = true; btn.innerText = "⏳ Đang đăng nhập...";
    google.script.run
      .withSuccessHandler(function(res) {
        btn.disabled = false; btn.innerText = "🔐 Đăng nhập TTCM";
        if (!res || !res.success) { alertV13("❌ " + (res ? res.message : "Không đăng nhập được.")); return; }
        ttcmDangNhapInfo = res;
        document.getElementById('ttcmAuthBox').classList.add('d-none');
        document.getElementById('ttcmMainContent').classList.remove('d-none');
        document.getElementById('ttcmWelcomeMsg').innerText = `✅ ${res.tenTTCM} — ${res.chucVu || 'Tổ trưởng chuyên môn'} — Môn: ${(res.dsMon || []).join(', ')}`;
        let monSelect = document.getElementById('khbdUploadMon');
        monSelect.innerHTML = '';
        (res.dsMon || []).forEach(mon => monSelect.add(new Option(mon, mon)));
      })
      .withFailureHandler(function(err) {
        btn.disabled = false; btn.innerText = "🔐 Đăng nhập TTCM";
        alertV13("❌ Lỗi kết nối: " + err);
      })
      .dangNhapTTCM(sdt, pw);
  }

  function moModalDoiMatKhauTTCM() {
    document.getElementById('passTTCMCu').value = '';
    document.getElementById('passTTCMMoi').value = '';
    document.getElementById('passTTCMMoiXacNhan').value = '';
    new bootstrap.Modal(document.getElementById('modalDoiMatKhauTTCM')).show();
  }

  function thucHienDoiMatKhauTTCM() {
    if (!ttcmDangNhapInfo) return;
    let cu = document.getElementById('passTTCMCu').value.trim();
    let moi = document.getElementById('passTTCMMoi').value.trim();
    let xacNhan = document.getElementById('passTTCMMoiXacNhan').value.trim();
    if (!cu || !moi || !xacNhan) { alertV13("⚠️ Vui lòng nhập đủ thông tin."); return; }
    if (moi !== xacNhan) { alertV13("❌ Mật khẩu mới không trùng khớp."); return; }
    google.script.run.withSuccessHandler(function(res) {
      if (!res || !res.success) { alertV13("❌ " + (res ? res.message : "Không đổi được mật khẩu.")); return; }
      showToastV9(res.message || 'Đổi mật khẩu thành công.','success');
      let modal = bootstrap.Modal.getInstance(document.getElementById('modalDoiMatKhauTTCM'));
      if (modal) modal.hide();
      setTimeout(dangXuatTapTrungV4,700);
    }).doiMatKhauTTCM(ttcmDangNhapInfo.sdt, cu, moi, {token: ttcmDangNhapInfo.sessionToken});
  }

  /* ĐĂNG NHẬP TAB NHẬP TIẾT HỌC */
  function setTrangThaiDangNhapGVBM(isLoading, message, type) {
    const btn = document.getElementById('btnLoginGVBM');
    const btnText = document.getElementById('btnLoginGVBMText');
    const status = document.getElementById('gvbmLoginStatus');

    if (btn) btn.disabled = !!isLoading;

    if (btnText) {
      btnText.innerHTML = isLoading
        ? '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang đăng nhập...'
        : '🔓 Đăng Nhập';
    }

    if (status) {
      if (message) {
        status.classList.remove('d-none', 'text-primary', 'text-success', 'text-danger', 'text-warning');
        status.classList.add(type === 'success' ? 'text-success' : (type === 'danger' ? 'text-danger' : 'text-primary'));
        status.innerHTML = message;
      } else {
        status.classList.add('d-none');
        status.innerHTML = '';
      }
    }
  }

  function xuLyDangNhapGVBM() {
    // Chặn bấm nút/nhấn Enter nhiều lần trong lúc đang chờ Apps Script phản hồi.
    if (isGVBMLoggingIn) return;

    let sdt = document.getElementById('loginGvbmSdt').value.trim();
    let pw = document.getElementById('loginGvbmMatKhau').value.trim();

    if (!sdt || !pw) {
      setTrangThaiDangNhapGVBM(false, '⚠️ Vui lòng nhập đủ SĐT và mật khẩu.', 'danger');
      if (!sdt) {
        document.getElementById('loginGvbmSdt').focus();
      } else {
        document.getElementById('loginGvbmMatKhau').focus();
      }
      return;
    }

    isGVBMLoggingIn = true;
    setTrangThaiDangNhapGVBM(
      true,
      '⏳ Hệ thống đang kiểm tra tài khoản giáo viên, vui lòng không bấm lại...',
      'primary'
    );

    google.script.run
      .withSuccessHandler(function(res) {
        isGVBMLoggingIn = false;

        if (res && res.success) {
          setTrangThaiDangNhapGVBM(false, '✅ Đăng nhập thành công.', 'success');

          gvbmDangNhapInfo = res;
          document.getElementById('gvbmAuthBox').classList.add('d-none');
          document.getElementById('gvbmMainContent').classList.remove('d-none');

          document.getElementById('tenGV').value = res.tenGV;
          document.getElementById('cccd').value = res.cccd || "";

          let selectMon = document.getElementById('monHoc');
          selectMon.innerHTML = '';

          if (res.dsMonGV && res.dsMonGV.length > 0) {
            res.dsMonGV.forEach(m => {
              selectMon.add(new Option(m, m));
            });
          } else {
            selectMon.add(new Option("-- Chưa có môn --", ""));
          }
          if(res.phanCongLopTheoMon!==undefined)capNhatKhoiVaLopPhanCongV39(false);
          else ensureAssignmentDataV39();

          if (res.urlChuKy) {
            urlChuKyGlobal = normalizeSignatureUrlV67_1(res.urlChuKy);
            let img = document.getElementById('sigImage');
            img.src = urlChuKyGlobal;
            img.classList.remove('d-none');
            document.getElementById('sigPlaceholder').classList.add('d-none');
          }
        } else {
          setTrangThaiDangNhapGVBM(
            false,
            '❌ ' + (res && res.message ? res.message : 'SĐT hoặc mật khẩu không đúng.'),
            'danger'
          );
          document.getElementById('loginGvbmMatKhau').select();
        }
      })
      .withFailureHandler(function(err) {
        isGVBMLoggingIn = false;
        setTrangThaiDangNhapGVBM(
          false,
          '❌ Không thể kết nối để đăng nhập. Vui lòng thử lại.',
          'danger'
        );
        console.error('Lỗi đăng nhập GVBM:', err);
      })
      .dangNhapGVBM(sdt, pw);
  }

  /* ĐĂNG NHẬP TAB GIÁM THỊ */
  function xuLyDangNhapGiamThi() {
  let sdt=document.getElementById('loginGiamThiSdt').value.trim();
  let pw=document.getElementById('loginGiamThiMatKhau').value.trim();
  if(!sdt||!pw){alertV13("⚠️ Vui lòng nhập SĐT và mật khẩu Giám thị.");return;}
  google.script.run.withSuccessHandler(function(res){
    if(res&&res.success){
      giamThiDangNhapInfo=res;
      document.getElementById('giamThiAuthBox').classList.add('d-none');
      document.getElementById('giamThiMainContent').classList.remove('d-none');
      document.getElementById('giamThiWelcomeMsg').innerText=`🛡️ Quyền Giám Thị: ${res.tenGV} (Chức vụ: ${res.chucVu})`;
    } else alertV13("❌ "+(res?res.message:"Không đăng nhập được"));
  }).dangNhapGiamThi(sdt,pw);
}


  /* ĐỔI MẬT KHẨU TAB NHẬP TIẾT HỌC */
  function moModalDoiMatKhauGVBM() {
    document.getElementById('passGvbmCu').value = "";
    document.getElementById('passGvbmMoi').value = "";
    document.getElementById('passGvbmMoiXacNhan').value = "";
    let modal = new bootstrap.Modal(document.getElementById('modalDoiMatKhauGVBM'));
    modal.show();
  }

  function thucHienDoiMatKhauGVBM() {
    let passCu = document.getElementById('passGvbmCu').value.trim();
    let passMoi = document.getElementById('passGvbmMoi').value.trim();
    let passMoiXacNhan = document.getElementById('passGvbmMoiXacNhan').value.trim();

    if (!passCu || !passMoi || !passMoiXacNhan) {
      alertV13("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (passMoi !== passMoiXacNhan) {
      alertV13("❌ Mật khẩu mới không trùng khớp!");
      return;
    }

    google.script.run.withSuccessHandler(function(res) {
      if (res.success) {
        showToastV9(res.message || "Đã lưu dữ liệu.", "success");
        let modalElem = document.getElementById('modalDoiMatKhauGVBM');
        let modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();
        setTimeout(dangXuatTapTrungV4,700);
      } else {
        alertV13("❌ " + res.message);
      }
    }).doiMatKhauGiaovien(gvbmDangNhapInfo.sdt, passCu, passMoi, {token: gvbmDangNhapInfo.sessionToken});
  }

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
          <td><b>${item.lop}</b></td>
          <td class="fw-bold text-primary fs-5">${item.dtbChung}</td>
          <td class="fw-bold ${item.tongVang > 0 ? 'text-danger' : 'text-dark'} fs-5">${item.tongVang}</td>
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
          <td class="fw-bold">${item.ngayFormatted}</td>
          <td><span class="badge ${item.buoi === 'Sáng' ? 'bg-primary' : 'bg-danger'}">${item.buoi}</span> <br>Tiết ${item.tiet}</td>
          <td class="fw-bold text-primary fs-6">${item.lop}</td>
          <td class="fw-semibold text-start">${escapeHtml(item.mon)} ${item.isTietTron ? '<span class="badge bg-warning text-dark">Tiết trộn</span>' : ''}</td>
          <td class="fw-bold text-success">${item.tietCT}</td>
          <td class="text-start">${item.tenBai}</td>
          <td class="text-start small text-danger">${item.hsVang || "---"}</td>
          <td class="text-start small text-muted">${item.nhanXet || "---"}</td>
          <td class="fw-bold">${item.diemTB}</td>
          <td class="text-start"><b>${item.tenGV}</b></td>
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
    document.getElementById('adminAuthBox').classList.add('d-none');
    document.getElementById('adminMainContent').classList.remove('d-none');
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
          <td class="text-start"><b>${item.tenGV}</b><br><small class="text-muted">CCCD/SĐT: ${item.cccd}</small></td>
          <td class="fw-bold">${item.ngayFormatted}</td>
          <td><span class="badge bg-warning text-dark">${item.buoi}</span> <strong class="text-danger">Tiết ${item.tiet}</strong></td>
          <td class="text-start bg-light">
            <b>Lớp / Nhập 1: ${item.lop1}</b> (${item.mon1})<br>
            <small class="text-muted">Bài: ${item.bai1}</small>
          </td>
          <td class="text-start bg-light">
            <b>Lớp / Nhập 2: ${item.lop2}</b> (${item.mon2})<br>
            <small class="text-muted">Bài: ${item.bai2}</small>
          </td>
          <td class="small text-secondary">${item.sheet1}<br>${item.sheet2}</td>
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

  function xuLyDangNhapGVCN() {
    let lop = document.getElementById('loginLop').value;
    let sdt = document.getElementById('loginSdt').value;
    let pw = document.getElementById('loginMatKhau').value;

    google.script.run.withSuccessHandler(function(res) {
      if (res.success) {
        gvcnDangNhapInfo = res;
        document.getElementById('gvcnAuthBox').classList.add('d-none');
        document.getElementById('gvcnMainContent').classList.remove('d-none');
        document.getElementById('gvcnWelcomeMsg').innerText = `✅ Xin chào GVCN ${res.tenGVCN} - Lớp ${res.lop}`;
        if (res.urlChuKy) {
          urlGVCNGlobal = normalizeSignatureUrlV67_1(res.urlChuKy);
          let imgElem = document.getElementById('gvcnSigImage');
          imgElem.src = urlGVCNGlobal;
          imgElem.classList.remove('d-none');
          document.getElementById('gvcnSigPlaceholder').classList.add('d-none');
        }
      } else {
        alertV13("❌ " + res.message);
      }
    }).dangNhapGVCN(lop, sdt, pw);
  }

  function moModalDoiMatKhau() {
    document.getElementById('passCu').value = "";
    document.getElementById('passMoi').value = "";
    document.getElementById('passMoiXacNhan').value = "";
    let modal = new bootstrap.Modal(document.getElementById('modalDoiMatKhau'));
    modal.show();
  }

  function thucHienDoiMatKhau() {
    let passCu = document.getElementById('passCu').value.trim();
    let passMoi = document.getElementById('passMoi').value.trim();
    let passMoiXacNhan = document.getElementById('passMoiXacNhan').value.trim();

    if (!passCu || !passMoi || !passMoiXacNhan) {
      alertV13("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (passMoi !== passMoiXacNhan) {
      alertV13("❌ Mật khẩu mới và Mật khẩu xác nhận không khớp nhau!");
      return;
    }

    if (!gvcnDangNhapInfo || !gvcnDangNhapInfo.lop) {
      alertV13("⚠️ Phiên làm việc không hợp lệ, vui lòng đăng nhập lại!");
      return;
    }

    google.script.run.withSuccessHandler(function(res) {
      if (res.success) {
        alertV13("✅ " + res.message);
        let modalElem = document.getElementById('modalDoiMatKhau');
        let modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();
        setTimeout(dangXuatTapTrungV4,700);
      } else {
        alertV13("❌ " + res.message);
      }
    }).doiMatKhauGVCN(gvcnDangNhapInfo.lop, passCu, passMoi, {token: gvcnDangNhapInfo.sessionToken});
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
      lyDoTrangThai: cellData.lyDoTrangThai || ""
    }];
  }

  function renderMixedField(cellData, fieldName) {
    let entries = getCellEntries(cellData);
    return entries.map((entry, index) => {
      let badge = fieldName === "mon" && entries.length > 1 && index === 0
        ? '<span class="badge bg-warning text-dark mixed-badge">TRỘN</span> '
        : '';
      return `<div class="mixed-entry">${badge}${escapeHtml(entry[fieldName] || "")}</div>`;
    }).join("");
  }

  function renderPeriodStatusBadgeV683(cellData){
    const status=String(cellData&&cellData.trangThaiTiet||'HOC_BINH_THUONG').toUpperCase();
    if(status==='DAY_THAY')return '<span class="badge bg-warning text-dark me-1">DẠY THAY</span>';
    if(status==='NGHI')return '<span class="badge bg-secondary me-1">NGHỈ</span>';
    if(status==='BO_TIET')return '<span class="badge bg-danger me-1">BỎ TIẾT</span>';
    if(status==='DAY_BU')return '<span class="badge bg-info text-dark me-1">DẠY BÙ</span>';
    return '';
  }

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
      const nameHtml=name?`<div class="sig-name">${escapeHtml(name)}</div>`:'';
      if(sigUrl){
        const altText=name?`Chữ ký ${name}`:'Chữ ký giáo viên';
        const rawSig=entry.signatureUrl||entry.kySo||'';
        const candidates=buildSignatureUrlCandidatesV682(rawSig);
        const firstSig=candidates[0]||sigUrl;
        return `<div class="sig-container mixed-entry"${clickAttr}><img src="${escapeHtml(firstSig)}" class="sig-img-preview" loading="eager" decoding="async" alt="${escapeHtml(altText)}" data-sig-candidates='${escapeHtml(JSON.stringify(candidates))}' data-sig-index="0" onerror="handleSignatureImageErrorV682(this)">${nameHtml}</div>`;
      }
      return name?`<div class="sig-container mixed-entry"${clickAttr}>${nameHtml}</div>`:'';
    }).join('')}</div>`;
  }



  function sodbNhanXetSafeV83(cellData){
    if(!cellData) return '';
    const value=String(cellData.nhanXet||'').trim();
    if(!value) return '';
    const normalize=v=>String(v||'').trim().toLocaleLowerCase('vi');
    const bad=new Set();
    (cellData.entries||[]).forEach(e=>{
      if(e.tenGV) bad.add(normalize(e.tenGV));
      if(e.cccd) bad.add(String(e.cccd).trim());
      if(e.teacherLookup) bad.add(String(e.teacherLookup).trim());
    });
    const vnorm=normalize(value);
    if(bad.has(vnorm)||bad.has(value)) return '';
    if(/^IMAGE:/i.test(value)||/^https?:\/\//i.test(value)) return '';
    return value;
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
  }

  function getBghSessionV684(){
    return currentUnifiedLoginV4&&currentUnifiedLoginV4.sessions?currentUnifiedLoginV4.sessions.BGH:null;
  }
  function applyBghApprovalV684(approval,chot){
    const space=document.getElementById('printBGHSigSpace');
    const name=document.getElementById('printBGHName');
    const panel=document.getElementById('bghWeekApprovalV684');
    const state=document.getElementById('bghApprovalStateV684');
    const note=document.getElementById('bghApprovalNoteV684');
    const meta=document.getElementById('bghApprovalMetaV684');
    const hint=document.getElementById('bghApprovalHintV684');
    const btn=document.getElementById('bghApproveBtnV684');
    const hasApproval=!!(approval&&approval.success);
    if(space&&name){
      if(hasApproval){
        const sigRaw=String(approval.chuKyBGH||approval.kySo||approval.signatureRef||'');
        const sigUrl=normalizeSignatureUrlV67_1(sigRaw);
        if(sigUrl){
          space.innerHTML=`<img src="${escapeHtml(sigUrl)}" class="sig-bgh-print" alt="Chữ ký Hiệu trưởng" onerror="handleSignatureImageErrorV682(this)">`;
        }else{
          space.innerHTML='<span class="badge bg-primary" style="font-size:.55rem;">✓ Đã duyệt</span>';
        }
        name.textContent=approval.tenBGH||'';
      }else{
        space.innerHTML='<span class="text-muted" style="font-size:.55rem;">Chưa duyệt</span>';
        name.textContent='';
      }
    }
    const bgh=getBghSessionV684();
    const isMain=String(document.getElementById('viewBookMode')?.value||'LOP_CHINH')==='LOP_CHINH';
    if(panel)panel.classList.toggle('d-none',!(bgh&&bgh.sessionToken&&isMain));
    if(!(bgh&&bgh.sessionToken&&isMain))return;
    if(note)note.value=hasApproval?(approval.ykien||''):'';
    if(state){
      state.textContent=hasApproval?'Đã duyệt':'Chưa duyệt';
      state.className='badge '+(hasApproval?'bg-primary':'bg-secondary');
    }
    if(meta)meta.textContent=hasApproval?`Đã duyệt bởi ${approval.tenBGH||'BGH'}${approval.time?' · '+approval.time:''}${approval.chucVu?' · '+approval.chucVu:''}`:'';
    const gvcnClosed=!!(chot&&chot.success);
    if(btn){
      btn.disabled=!gvcnClosed;
      btn.textContent=hasApproval?'Cập nhật duyệt & ký':'Duyệt & ký chốt';
    }
    if(hint){
      hint.textContent=gvcnClosed
        ? 'BGH có thể duyệt/cập nhật duyệt bất kỳ thời điểm nào; không áp dụng mốc 12h/18h hoặc giới hạn ngày.'
        : 'GVCN chưa ký chốt tuần. BGH sẽ duyệt sau khi GVCN hoàn tất ký chốt.';
    }
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
      const r=await callSodbEdgeRpcV67('duyetTuanBGHV684',[{lop,tuan,ykien},{token:bgh.sessionToken}]);
      if(!r?.success)throw new Error(r?.message||'Không duyệt được tuần.');
      showToastV9(r.message||'Đã duyệt tuần.','success');
      [...sodbViewCacheV6.keys()].filter(k=>String(k).startsWith(lop+'|'+tuan+'|')).forEach(k=>sodbViewCacheV6.delete(k));
      setTimeout(()=>traCuuSoDauBaiTuanGop(true),100);
    }catch(e){
      showToastV9(e&&e.message?e.message:String(e),'danger');
      if(btn){btn.disabled=false;btn.textContent=old;}
    }
  }

  function traCuuSoDauBaiTuanGop(forceRefreshV6) {
    const lop=document.getElementById('viewLop').value;
    const tuan=parseInt(document.getElementById('viewTuan').value)||1;
    const bookMode=document.getElementById('viewBookMode')?.value||'LOP_CHINH';
    const tbody=document.getElementById('sodbTableBody');
    if(!lop){
      showToastV9('Vui lòng chọn lớp cần xem.','danger');
      return;
    }
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
      const res=payload&&payload.sodb?payload.sodb:payload;
      const table=tbody?.closest('table');
      if(table)table.classList.remove('compact-special-book-v29');
      const serverTitle=(payload&&payload.bookTitle)||res.bookTitle||tieuDeSoTheoLopV22(lop,bookMode);
      const titleNow=document.querySelector('#printPageSingle .so-title');if(titleNow)titleNow.textContent=serverTitle;
      if(!res||!res.success){
        tbody.innerHTML='<tr><td colspan="12" class="text-danger py-3 text-center">Không thể tải dữ liệu sổ đầu bài.</td></tr>';
        return;
      }
      if(res.foundCount===0){
        tbody.innerHTML=`<tr><td colspan="12" class="text-warning py-3 text-center">Chưa có dữ liệu lớp ${escapeHtml(lop)} - Tuần ${tuan}</td></tr>`;
        applyChotV10(payload&&payload.chot);
        applyBghApprovalV684(payload&&payload.bghDuyet,payload&&payload.chot);
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
      document.getElementById('sumVangP').innerText=res.summary.vangP;
      document.getElementById('sumVangKP').innerText=res.summary.vangKP;
      document.getElementById('sumDTB').innerText=res.summary.dtbTuan;
      document.getElementById('sumXepLoai').innerText=Number(res.summary.dtbTuan)>=8?'Loại A':(Number(res.summary.dtbTuan)>=6.5?'Loại B':'Loại C');
      document.getElementById('sumTietChuaKy').innerText=res.summary.soTietChuaKy;
      applyChotV10(payload&&payload.chot);
      applyBghApprovalV684(payload&&payload.bghDuyet,payload&&payload.chot);
      sodbViewCacheV6.set(cacheKey,{ts:Date.now(),res:payload});
      const stamp=document.getElementById('sodbLoadedAtV10');
      if(stamp)stamp.textContent=payload&&payload.serverTime?('Cập nhật: '+payload.serverTime):'';
    }

    if(!forceRefreshV6&&cached&&Date.now()-cached.ts<SODB_VIEW_CACHE_MS_V6){
      renderPageV10(cached.res);
      return;
    }

    tbody.innerHTML=`
      <tr><td colspan="12" class="py-4 text-center">
        <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
        <span class="text-muted">Đang tải sổ đầu bài...</span>
      </td></tr>`;
    const viewPerfStartedV63=performance.now();
    google.script.run
      .withSuccessHandler(function(payload){
        console.info('[V66 PERF] Xem sổ tổng:',Math.round(performance.now()-viewPerfStartedV63)+'ms','server:',(payload&&payload.serverMs!==undefined?payload.serverMs:'—')+'ms',lop,'Tuần '+tuan,bookMode);
        renderPageV10(payload);
      })
      .withFailureHandler(function(err){
        tbody.innerHTML='<tr><td colspan="12" class="text-danger py-3 text-center">Không thể tải dữ liệu. Vui lòng thử lại.</td></tr>';
        showToastV9('Không tải được sổ đầu bài: '+(err&&err.message?err.message:err),'danger');
      })
      .layTrangSoDauBaiV24(lop,tuan,bookMode,getAnyAuthV6());
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
    box.className='alert border py-2 px-3 mb-3 small '+(r?.locked?'alert-danger':(['ADMIN_UNLOCK','BULK_WEEK_UNLOCK'].includes(String(r?.state||''))?'alert-warning':'alert-info'));
    box.innerHTML=`<strong>${r?.locked?'Đã khóa':'Thời hạn ký'}:</strong> ${escapeHtml(r?.message||'')}`;
    if(btn&&!isSodbSubmitting)btn.disabled=inputDeadlineLockedV683;
  }catch(err){
    inputDeadlineLockedV683=false;
    box.className='alert alert-warning border py-2 px-3 mb-3 small';
    box.textContent='Chưa kiểm tra được thời hạn nhập tiết. Máy chủ vẫn sẽ kiểm tra khi bấm Lưu.';
  }
}

function resetPeriodFormAfterSaveV54(){
  // Giữ nguyên đúng các trường thao tác liên tục: Ngày - Lớp - Môn.
  const idsToBlank=['tietDay','tietCT','tenHSVang','nhanXet'];
  idsToBlank.forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const absent=document.getElementById('hsVang');if(absent)absent.value='0';
  ['diemHocTap','diemKyLuat','diemNeNep'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='10';});
  const lesson=document.getElementById('tenBaiDaySelect');if(lesson)lesson.value='';
  const custom=document.getElementById('tenBaiDayCustom');if(custom){custom.value='';custom.classList.add('d-none');custom.required=false;}
  const mixed=document.getElementById('isTietTron');if(mixed)mixed.checked=false;
  const dayThay=document.getElementById('isDayThayV683');if(dayThay)dayThay.checked=false;
  const gvThay=document.getElementById('gvDuocThayV683');if(gvThay)gvThay.value='';
  onDayThayToggleV683();
  const proxyToggle=document.getElementById('proxySigningToggleV682');if(proxyToggle)proxyToggle.checked=false;
  const proxyName=document.getElementById('proxyTeacherNameV682');if(proxyName)proxyName.value='';
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

  let lesson1 = getSelectedLessonData();
  if (!lesson1 || !lesson1.tenBaiDay) {
    showToastV9('Vui lòng chọn hoặc nhập nội dung bài dạy.','danger');
    return;
  }

  // Tiết trộn: mỗi giáo viên chỉ nhập phần của chính mình. Backend tự ghép 2 GV cùng lớp-ngày-buổi-tiết.
  let isMixed = document.getElementById('isTietTron').checked;

  const isDayThay=!!document.getElementById('isDayThayV683')?.checked;
  const gvDuocThay=String(document.getElementById('gvDuocThayV683')?.value||'').trim();
  if(isDayThay&&!gvDuocThay){showToastV9('Vui lòng nhập tên giáo viên được dạy thay.','danger');return;}

  const proxySigningToggle=document.getElementById('proxySigningToggleV682');
  const proxyNameInput=document.getElementById('proxyTeacherNameV682');
  const proxySigning=isSpecialProxySignerV682(gvbmDangNhapInfo) && !!(proxySigningToggle&&proxySigningToggle.checked);
  const proxyTeacherName=String(proxyNameInput&&proxyNameInput.value||'').trim();
  if(proxySigning && !proxyTeacherName){
    showToastV9('Vui lòng nhập họ tên nhân sự được ký thay.','danger');
    return;
  }
  if(proxySigning&&isDayThay){showToastV9('Không bật đồng thời “Dạy thay” và “Ký thay nhân sự ngoài nhà trường”.','danger');return;}
  if(inputDeadlineLockedV683){showToastV9('Tiết đang bị khóa theo thời hạn ký. Nếu cần bổ sung, liên hệ Admin mở khóa.','danger');return;}

  let btn = document.getElementById('btnSubmit');
  isSodbSubmitting = true;
  btn.disabled = true;
  btn.innerText = "⏳ Đang lưu dữ liệu...";
  tinhDiemTB();

  let formData = {
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
    diemHocTap: document.getElementById('diemHocTap').value,
    diemKyLuat: document.getElementById('diemKyLuat').value,
    diemNeNep: document.getElementById('diemNeNep').value,
    diemTB: varDiemTB,
    xepLoai: varXepLoai,
    hsVang: document.getElementById('hsVang').value,
    tenHSVang: document.getElementById('tenHSVang').value,
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
        yeuCauCanDat: ""
      };
    }
    if (selectValue.indexOf("PLAN_") === 0) {
      let plan = danhSachBaiDay1[Number(selectValue.replace("PLAN_", ""))];
      if (!plan) return null;
      return {
        tenBaiDay: plan.tenBai,
        tietCT: document.getElementById('tietCT').value.trim(),
        // Không hiển thị ô YCCĐ ở tab nhập tiết; vẫn giữ dữ liệu KHBD tự động để tương thích dữ liệu cũ.
        yeuCauCanDat: plan.yeuCauCanDat || ""
      };
    }
    return null;
  }

  function fillLessonSelect(selectElement, plans) {
    selectElement.innerHTML = '<option value="">-- Chọn bài dạy đúng tuần --</option>';
    plans.forEach((plan, index) => {
      let prefix = plan.tietPPCT ? `PPCT ${plan.tietPPCT} — ` : "";
      selectElement.add(new Option(prefix + plan.tenBai, `PLAN_${index}`));
    });
    selectElement.add(new Option("➕ Nhập tên bài dạy khác...", "KHAC"));
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
      document.getElementById('tuanHoc')?.value||''
    ].join('|');
  }

  function loadDanhSachBaiDay(forceRefresh) {
    const metaV26=getClassMetaClientV26(document.getElementById('lop')?.value||'');
    if(metaV26&&metaV26.type==='CHUYEN_DE'&&metaV26.subject){
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

    let cacheKey = [khoi, document.getElementById('lop').value, mon, tuan].join('|');
    if (!forceRefresh && lessonPlanCache[cacheKey]) {
      danhSachBaiDay1 = lessonPlanCache[cacheKey];
      fillLessonSelect(selectBai, danhSachBaiDay1);
      document.getElementById('khbdWeekNotice').innerText = danhSachBaiDay1.length
        ? `Đã nạp ${danhSachBaiDay1.length} bài: Khối ${khoi} — ${mon} — Tuần ${tuan}.`
        : `Không có KHBD khả dụng cho Khối ${khoi} — ${mon} — Tuần ${tuan}. Có thể KHBD chưa được duyệt, giáo viên chưa tích nhận tuần này, hoặc bài đã dùng hết. Vào Kế hoạch bài dạy → KHBD của tôi để tích nhận.`;
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
        const currentKey=[document.getElementById('khoi').value,document.getElementById('lop').value,getEffectiveMonHocV25(),document.getElementById('tuanHoc').value].join('|');
        if(currentKey!==cacheKey)return;
        danhSachBaiDay1 = rows;
        fillLessonSelect(selectBai, danhSachBaiDay1);
        document.getElementById('khbdWeekNotice').innerText = danhSachBaiDay1.length
          ? `Còn ${danhSachBaiDay1.length} bài chưa dùng: Khối ${khoi} — ${mon} — Tuần ${tuan}.`
          : `Không còn KHBD khả dụng cho Khối ${khoi} — ${mon} — Tuần ${tuan}. Kiểm tra Kế hoạch bài dạy → KHBD của tôi hoặc bài đã dùng hết.`;
      })
      .withFailureHandler(function(err) {
        if(lessonPlanRequestSerialV55[cacheKey]!==requestSerial)return;
        lessonPlanPendingV47.delete(cacheKey);
        const currentKey=[document.getElementById('khoi').value,document.getElementById('lop').value,getEffectiveMonHocV25(),document.getElementById('tuanHoc').value].join('|');
        if(currentKey!==cacheKey)return;
        selectBai.innerHTML = '<option value="KHAC">➕ Nhập tên bài dạy khác...</option>';
        document.getElementById('khbdWeekNotice').innerText = "Không tải được kế hoạch: " + err;
      })
      .getDanhSachBaiDayTheoMon(mon, khoi, tuan, '', document.getElementById('lop').value, {token: gvbmDangNhapInfo ? gvbmDangNhapInfo.sessionToken : '', dayThay: !!document.getElementById('isDayThayV683')?.checked});
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
      document.getElementById('tietCT').value = plan ? (plan.tietPPCT || "") : "";
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
    const layout=(laSoGop5TuanV57()?document.getElementById('gtPrintLayoutV57')?.value:'ONE_WEEK')||'ONE_WEEK';
    const msg=layout==='FIVE_WEEKS'
      ? `Đã chuẩn bị ${loaded}/${dsTuan.length} tuần · khi in sẽ gộp tối đa 5 tuần / trang A3 - ${bookLabel}.`
      : `Đã chuẩn bị ${loaded}/${dsTuan.length} tuần · 1 tuần / trang A3 - ${bookLabel}.`;
    showToastV9(msg,'success');
  } else {
    container.innerHTML = `<div class="text-center py-5 text-warning fw-bold">⚠️ Không tìm thấy dữ liệu phù hợp cho lớp ${escapeHtml(lop)}!</div>`;
  }
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
      out+=`<tr class="${i===0&&dayIdx>0?'row-day-start':''}">`;
      if(i===0)out+=`<td rowspan="${dayRows.length}" class="compact-day-v29 text-center align-middle"><div>${escapeHtml(thu)}</div><div>${dateFormatted}</div></td>`;
      out+=`
        <td class="compact-slot-v29"><span class="badge ${r.buoi==='Sang'?'text-primary':'text-danger'} buoi-tag">${buoiLabel}</span> ${r.tiet}</td>
        <td class="text-left-cell"><div class="a3-cell-clamp-v56 a3-one-line-v56">${renderPeriodStatusBadgeV683(c)}${renderMixedField(c,'mon')}</div></td>
        <td class="fw-bold text-primary">${renderMixedField(c,'tietCT')}</td>
        <td class="text-left-cell"><div class="a3-cell-clamp-v56 a3-one-line-v56">${escapeHtml(c.hsVang||'')}</div></td>
        <td class="text-left-cell"><div class="a3-cell-clamp-v56">${renderMixedField(c,'tenBai')}</div></td>
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
              let rowClass = '';
              if (i === 0 && dayIdx > 0) rowClass = 'row-day-start';
              else if (i === 5) rowClass = 'row-chieu-start';
              tableBodyHtml += `<tr class="${rowClass}">`;
              if (i === 0) tableBodyHtml += `<td rowspan="10" class="fw-bold align-middle bg-light text-center"><div>${thuObj.name}</div><div class="text-dark" style="font-size:0.55rem;">${dateFormatted}</div></td>`;
              tableBodyHtml += `
                <td class="fw-bold"><span class="badge ${buoi === 'Sang' ? 'text-primary' : 'text-danger'} buoi-tag">${buoi === 'Sang' ? 'S' : 'C'}</span> ${tiet}</td>
                <td class="text-left-cell"><div class="a3-cell-clamp-v56 a3-one-line-v56">${renderPeriodStatusBadgeV683(cellData)}${renderMixedField(cellData, 'mon')}</div></td>
                <td class="fw-bold text-primary">${renderMixedField(cellData, 'tietCT')}</td>
                <td class="text-left-cell"><div class="a3-cell-clamp-v56 a3-one-line-v56">${escapeHtml(cellData.hsVang || '')}</div></td>
                <td class="text-left-cell"><div class="a3-cell-clamp-v56">${renderMixedField(cellData, 'tenBai')}</div></td>
                <td class="text-left-cell"><div class="a3-cell-clamp-v56">${escapeHtml(sodbNhanXetSafeV83(cellData))}</div></td>
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
            ? `<img src="${escapeHtml(bghSigUrl)}" class="sig-bgh-print" alt="Chữ ký Hiệu trưởng">`
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
            <div><strong>Ý kiến GVCN:</strong> <span class="fst-italic text-secondary">${escapeHtml(ykienText)}</span></div>
            <div class="signature-footer">
              <div class="signature-box"><div class="signature-title">GIÁO VIÊN CHỦ NHIỆM</div><div class="signature-space">${sigSpaceHtml}</div><div class="fw-bold" style="font-size:8pt;">${escapeHtml(gvcnNameText)}</div></div>
              <div class="signature-box"><div class="signature-title">HIỆU TRƯỞNG</div><div class="signature-space">${bghSigSpaceHtml}</div><div class="fw-bold" style="font-size:8pt;">${escapeHtml(bghNameText)}</div></div>
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
      document.getElementById('editRequestsBodyV4').innerHTML=(res.data||[]).map(x=>`<tr><td>${escapeHtml(x.time)}</td><td>${escapeHtml(x.nguoi)}<br><small>${escapeHtml(x.sdt)}</small></td><td>${escapeHtml(x.lop)} / W${escapeHtml(x.tuan)} / ${escapeHtml(x.buoi)} T${escapeHtml(x.tiet)}</td><td>${escapeHtml(x.lyDo)}</td><td>${escapeHtml(x.trangThai)}</td><td>${x.trangThai==='CHỜ DUYỆT'?`<button class="btn btn-success btn-sm me-1" onclick="xuLyYeuCauAdminV4('${x.id}','DUYỆT')">Duyệt</button><button class="btn btn-danger btn-sm" onclick="xuLyYeuCauAdminV4('${x.id}','TỪ CHỐI')">Từ chối</button>`:''}</td></tr>`).join('');
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
        return `<tr><td class="fw-semibold">${escapeHtml(r.tai_khoan||'')}</td><td>${escapeHtml(r.quyen||'')}</td><td>${range}</td><td>${escapeHtml(r.ly_do||'')}</td><td>${active?'<span class="badge text-bg-success">Đang hiệu lực</span>':'<span class="badge text-bg-secondary">Đã thu hồi</span>'}</td><td>${active?`<button type="button" class="btn btn-sm btn-outline-danger" onclick="thuHoiQuyenDacBietUiV69('${escapeHtml(r.id||'')}')">Thu hồi</button>`:''}</td></tr>`;
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
    chonKhoiLopView();chonKhoiLopInput();chonKhoiLopLogin();chonKhoiLopAdmin();khoiTaoDanhSachLopGiamThi();
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
        return `<div class="border rounded p-2 mb-1"><b>${escapeHtml(x.lop)} - Tuần ${escapeHtml(x.tuan)} - ${escapeHtml(x.buoi)} Tiết ${escapeHtml(x.tiet)}</b> · ${escapeHtml(x.trangThai)}<br><span class="text-muted">${escapeHtml(x.lyDo)}</span>${canEdit?`<br><button type="button" class="btn btn-warning btn-sm mt-1" onclick="taiBanGhiSuaV4('${x.recordId}')">✏️ Tải bản ghi để sửa</button>`:''}</div>`;
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
      TTCM:[['Kế hoạch bài dạy','ttcm-tab'],['Xem sổ đầu bài','view-tab']],
      BGH:[['Kế hoạch bài dạy','ttcm-tab'],['Xem sổ đầu bài','view-tab']],
      GIAM_THI:[['Tra cứu, thống kê','giamthi-tab'],['Xem sổ đầu bài','view-tab']],
      ADMIN:[['Quản trị hệ thống','admin-tab'],['Xem sổ đầu bài','view-tab']]
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




  /* ===== V12: NHẬP TIẾT NHANH ===== */
  let quickEntryLoadedV12=false;

  function markAutofillV12(ids){
    (ids||[]).forEach(id=>{
      const el=document.getElementById(id);
      if(!el)return;
      el.classList.add('field-autofilled-v12');
      setTimeout(()=>el.classList.remove('field-autofilled-v12'),900);
    });
  }

  function applyQuickSlotV12(x){
    if(!x)return;
    const map={
      lop:x.lop||'',
      buoiDay:x.buoi||'',
      tietDay:String(x.tiet||''),
      monHoc:x.mon||''
    };
    if(x.lop){
      const khoi=String(x.lop).match(/^(10|11|12)/);
      if(khoi){
        const khoiEl=document.getElementById('khoi');
        if(khoiEl){khoiEl.value=khoi[1];chonKhoiLopInput();}
      }
    }
    Object.keys(map).forEach(id=>{
      const el=document.getElementById(id);
      if(el&&map[id]!==undefined&&map[id]!==null&&map[id]!=='')el.value=map[id];
    });
    const today=new Date();
    const yyyy=today.getFullYear(),mm=String(today.getMonth()+1).padStart(2,'0'),dd=String(today.getDate()).padStart(2,'0');
    const ngay=document.getElementById('ngayDay');
    if(ngay)ngay.value=`${yyyy}-${mm}-${dd}`;
    capNhatTuanVaThu();
    if(x.mon){
      const mon=document.getElementById('monHoc');
      if(mon)mon.value=x.mon;
    }
    loadDanhSachBaiDay();
    markAutofillV12(['khoi','lop','buoiDay','tietDay','monHoc','ngayDay','thuDay','tuanHoc']);
    const s=document.getElementById('autoFillStatusV12');
    if(s){
      s.classList.add('ok');
      s.textContent=`Đã điền : ${x.lop||''} · ${x.buoi||''} · Tiết ${x.tiet||''} · ${x.mon||''}`;
    }
    showToastV9('Đã điền nhanh thông tin tiết học.','success');
  }

  function taiNguCanhNhapNhanhV12(force){
    if(!gvbmDangNhapInfo||!gvbmDangNhapInfo.sessionToken)return;
    if(quickEntryLoadedV12&&!force)return;
    const hint=document.getElementById('quickEntryHintV12');
    const box=document.getElementById('quickEntryButtonsV12');
    if(hint)hint.textContent='Đang tải lịch dạy hôm nay...';
    if(box)box.innerHTML='<span class="small text-muted">Đang tải...</span>';

    google.script.run
      .withSuccessHandler(function(res){
        if(!res||!res.success){
          if(hint)hint.textContent=(res&&res.message)||'Không tải được lịch dạy.';
          if(box)box.innerHTML='';
          return;
        }
        quickEntryLoadedV12=true;
        if(hint)hint.textContent=`${res.teacher.tenGV||''} · ${res.thu||''} · Tuần ${res.week||''}`;
        if(!box)return;
        const rows=res.tkbToday||[];
        if(!rows.length){
          box.innerHTML='<span class="small text-muted">Không có tiết dạy trong TKB hôm nay.</span>';
          return;
        }
        box.innerHTML=rows.map((x,i)=>`
          <button type="button" class="quick-slot-v12" data-qidx="${i}">
            <strong>${escapeHtml(x.lop||'')} · ${escapeHtml(x.buoi||'')} T${escapeHtml(x.tiet||'')}</strong>
            <small>${escapeHtml(x.mon||'')}</small>
          </button>`).join('');
        [...box.querySelectorAll('[data-qidx]')].forEach(btn=>{
          btn.addEventListener('click',()=>applyQuickSlotV12(rows[Number(btn.dataset.qidx)]));
        });
      })
      .withFailureHandler(function(err){
        if(hint)hint.textContent='Không kết nối được lịch dạy.';
        if(box)box.innerHTML='';
      })
      /* Đã bỏ gọi ngữ cảnh TKB nhanh theo yêu cầu */
  }

  /* Khi tab Nhập tiết được mở, chỉ tải lịch nhanh 1 lần. */
  document.addEventListener('DOMContentLoaded',function(){
    const inputTab=document.getElementById('input-tab');
    if(inputTab)inputTab.addEventListener('shown.bs.tab',function(){
      initInputCompactV16();
    });
  });

  /* Sau khi đổi lớp/môn/tuần, cập nhật trạng thái tự điền. */
  ['lop','monHoc','tuanHoc','ngayDay'].forEach(function(id){
    document.addEventListener('change',function(e){
      if(!e.target||e.target.id!==id)return;
      const s=document.getElementById('autoFillStatusV12');
      if(s&&!s.classList.contains('ok'))s.textContent='Đang đồng bộ danh sách bài dạy phù hợp...';
    });
  });


  /* ===== V13: CHUẨN HÓA THÔNG BÁO TOÀN HỆ THỐNG ===== */
  const nativeAlertV13 = window.alert.bind(window);
  const nativeConfirmV13 = window.confirm.bind(window);
  const nativePromptV13 = window.prompt.bind(window);

  function alertV13(message){
    const text=String(message||'').replace(/^[✅❌⚠️🔓]+\s*/,'');
    const isErr=/lỗi|không|thất bại|cảnh báo|vui lòng|chưa/i.test(text);
    showToastV9(text,isErr?'danger':'success');
  }

  async function confirmV13(message, options){
    const res=await actionDialogV11({
      title:(options&&options.title)||'Xác nhận thao tác',
      message:String(message||''),
      confirmText:(options&&options.confirmText)||'Xác nhận',
      danger:!!(options&&options.danger)
    });
    return !!res;
  }

  async function promptV13(message, options){
    const res=await actionDialogV11({
      title:(options&&options.title)||'Nhập thông tin',
      message:String(message||''),
      input:true,
      label:(options&&options.label)||'Nội dung',
      placeholder:(options&&options.placeholder)||'',
      type:(options&&options.type)||'text',
      confirmText:(options&&options.confirmText)||'Tiếp tục',
      danger:!!(options&&options.danger)
    });
    return res===null?null:String(res);
  }


  function setBusyV13(show,text){
    const box=document.getElementById('globalBusyV13');
    const label=document.getElementById('globalBusyTextV13');
    if(label&&text)label.textContent=text;
    if(box)box.classList.toggle('d-none',!show);
  }


  /* ===== V14 FINAL: IN A3 ỔN ĐỊNH ===== */
  async function preloadPrintImagesV14(root){
    if(!root)return;
    const imgs=[...root.querySelectorAll('img')];
    await Promise.all(imgs.map(img=>{
      if(img.complete)return Promise.resolve();
      return new Promise(resolve=>{
        const done=()=>resolve();
        img.addEventListener('load',done,{once:true});
        img.addEventListener('error',done,{once:true});
        setTimeout(done,1200);
      });
    }));
  }


  window.addEventListener('afterprint',function(){
    document.body.classList.remove('a3-tracuu-v56');
    const root=document.getElementById('a3PrintRootV56');
    if(root)root.remove();
    setBusyV13(false);
  });


  /* ===== V57: NGOẠI LỆ IN GỘP GDTC / CHUYÊN ĐỀ ===== */
  function taoTrangGop5TuanV57(group){
    if(!group||!group.length)return '';
    const first=group[0];
    const firstHeader=first.querySelector('.so-header-print');
    const logo=firstHeader?.querySelector('.school-logo')?.src||'';
    const title=firstHeader?.querySelector('.so-title')?.textContent?.trim()||'SỔ ĐẦU BÀI';
    const sub=firstHeader?.querySelector('.so-subhead')?.textContent?.replace(/\s+/g,' ').trim()||'';
    const yearMatch=sub.match(/Năm học:\s*(.+)$/i);
    const schoolYear=yearMatch?yearMatch[1].trim():'2026 - 2027';
    const weeks=group.map(p=>p.dataset.week||'').filter(Boolean);
    const range=weeks.length===1?`Tuần ${weeks[0]}`:`Tuần ${weeks[0]} – ${weeks[weeks.length-1]}`;
    const blocks=group.map(page=>{
      const week=page.dataset.week||'';
      const table=page.querySelector('.table-sodb');
      const summary=page.querySelector('.summary-box');
      const summaryText=summary?summary.innerText.replace(/\s+/g,' ').trim():'';
      const dtb=(summaryText.match(/Điểm TB tuần:\s*([^\s(]+)/i)||[])[1]||'';
      const chuaKy=(summaryText.match(/Chưa ký:\s*(\d+)/i)||[])[1]||'0';
      const vang=(summaryText.match(/Vắng:\s*([^|]+\|\s*[^\s]+)/i)||[])[1]||'';
      const rowCount=table?Math.max(1,table.querySelectorAll('tbody tr').length):1;
      const weight=Math.max(4,rowCount+3);
      return `<section class="a3-special-week-block-v57" data-week="${escapeHtml(week)}" style="flex:${weight} 1 0">\n        <div class="a3-special-week-title-v57"><span>TUẦN ${escapeHtml(week)}</span><span>${escapeHtml(title)}</span></div>\n        ${table?table.outerHTML:'<div class="text-center">Không có dữ liệu</div>'}\n        <div class="a3-special-week-summary-v57"><span><strong>Vắng:</strong> ${escapeHtml(vang||'0 | 0')}</span><span><strong>ĐTB:</strong> ${escapeHtml(dtb||'0.0')}</span><span><strong>Chưa ký:</strong> ${escapeHtml(chuaKy)} tiết</span></div>\n      </section>`;
    }).join('');
    return `<div class="a3-special-multi-page-v57" data-book-mode="${escapeHtml(first.dataset.bookMode||'')}" style="--week-count-v57:${group.length}">\n      <div class="a3-special-multi-head-v57">\n        ${logo?`<img src="${escapeHtml(logo)}" alt="Logo" class="school-logo">`:''}\n        <div style="font-size:5.1pt;font-weight:800;line-height:1">SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HỒ CHÍ MINH</div>\n        <div style="font-size:5.6pt;font-weight:900;line-height:1">TRƯỜNG THPT HỒ THỊ BI</div>\n        <div class="a3-special-multi-title-v57">${escapeHtml(title)}</div>\n        <div class="a3-special-multi-sub-v57">${escapeHtml(range)} &nbsp;|&nbsp; Năm học: ${escapeHtml(schoolYear)}</div>\n      </div>\n      <div class="a3-special-weeks-grid-v57">${blocks}</div>\n    </div>`;
  }

  function taoHtmlInTraCuuV57(pages){
    const layout=(laSoGop5TuanV57()?document.getElementById('gtPrintLayoutV57')?.value:'ONE_WEEK')||'ONE_WEEK';
    if(layout!=='FIVE_WEEKS')return pages.map(p=>p.outerHTML).join('');
    const eligible=pages.every(p=>['GDTC','CHUYEN_DE'].includes(String(p.dataset.bookMode||'').toUpperCase()));
    if(!eligible)return pages.map(p=>p.outerHTML).join('');
    let html='';
    for(let i=0;i<pages.length;i+=5)html+=taoTrangGop5TuanV57(pages.slice(i,i+5));
    return html;
  }

  /* ===== V56/V57: CHỈ IN A3 TỪ TAB TRA CỨU ===== */
  async function inA3TraCuuV56(){
    const source=document.getElementById('gtPrintPagesContainer');
    const pages=source?[...source.querySelectorAll('.print-page-block')]:[];
    if(!source||!pages.length){
      alertV13('⚠️ Vui lòng tải dữ liệu tuần trước khi in A3.');
      return;
    }

    const old=document.getElementById('a3PrintRootV56');
    if(old)old.remove();
    const root=document.createElement('div');
    root.id='a3PrintRootV56';
    root.setAttribute('aria-hidden','true');
    const coverHtml=document.getElementById('gtPrintCoverV684')?.checked
      ? taoTrangBiaA3V684(document.getElementById('gtPrintLop')?.value||'',document.getElementById('gtPrintBookMode')?.value||'LOP_CHINH')
      : '';
    root.innerHTML=coverHtml+taoHtmlInTraCuuV57(pages);
    document.body.appendChild(root);
    document.body.classList.add('a3-tracuu-v56');
    const layout=(laSoGop5TuanV57()?document.getElementById('gtPrintLayoutV57')?.value:'ONE_WEEK')||'ONE_WEEK';
    setBusyV13(true,layout==='FIVE_WEEKS'?'Đang gộp tối đa 5 tuần trên mỗi trang A3...':'Đang dàn mỗi tuần thành 1 trang A3...');
    try{
      await preloadPrintImagesV14(root);
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      window.print();
    }catch(err){
      console.error('Lỗi chuẩn bị bản in A3',err);
      alertV13('❌ Không chuẩn bị được bản in A3. Vui lòng thử lại.');
      document.body.classList.remove('a3-tracuu-v56');
      root.remove();
      setBusyV13(false);
    }
  }


  function capNhatLoaiLopV22(selectId,noteId){
    const sel=document.getElementById(selectId), note=document.getElementById(noteId);
    if(!sel||!note)return;
    const type=loaiSoTheoLopV22(sel.value);
    if(type==='LOP_CHINH'){note.textContent='';note.classList.add('d-none');return;}
    note.classList.remove('d-none');
    const meta=getClassMetaClientV26(sel.value)||{};
    note.textContent='Lớp chuyên đề được nhập bình thường, xuất sổ riêng'+(meta.subject?` và tải KHBD theo môn ${meta.subject}.`:'.');
  }
  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='lop')capNhatLoaiLopV22('lop','specialClassNoteInputV22');
    if(e.target&&e.target.id==='viewLop')capNhatLoaiLopV22('viewLop','specialClassNoteViewV22');
  });


  document.addEventListener('DOMContentLoaded',function(){
    [['lop','specialClassNoteInputV22'],['viewLop','specialClassNoteViewV22']].forEach(pair=>{
      const sel=document.getElementById(pair[0]); if(!sel||document.getElementById(pair[1]))return;
      const note=document.createElement('div'); note.id=pair[1]; note.className='special-class-note-v22 d-none';
      sel.insertAdjacentElement('afterend',note);
    });
  });



  /* ===== V68.5: Admin mở khóa hàng loạt tuần cũ ===== */
  async function moKhoaTuanHangLoatV685(){
    if(!adminDangNhapInfo?.sessionToken){showToastV9('Phiên Admin không hợp lệ.','danger');return;}
    const payload={tuTuan:Number(document.getElementById('adminBulkFromWeekV685')?.value||0),denTuan:Number(document.getElementById('adminBulkToWeekV685')?.value||0),soGio:Number(document.getElementById('adminBulkHoursV685')?.value||24),choPhepTatCaLop:!!document.getElementById('adminBulkAllClassesV685')?.checked,lyDo:String(document.getElementById('adminBulkReasonV685')?.value||'').trim()};
    if(!payload.tuTuan||!payload.denTuan||payload.tuTuan>payload.denTuan){showToastV9('Khoảng tuần không hợp lệ.','danger');return;}
    if(!payload.lyDo){showToastV9('Bắt buộc nhập lý do mở khóa.','danger');return;}
    const ok=await confirmV13(`Mở khóa toàn trường từ Tuần ${payload.tuTuan} đến Tuần ${payload.denTuan}${payload.choPhepTatCaLop?' và cho giáo viên thấy toàn bộ lớp':''}?`,{title:'Mở khóa tuần cũ',confirmText:'Mở khóa',danger:false});if(!ok)return;
    try{
      const r=await callSodbEdgeRpcV67('adminMoKhoaTuanHangLoatV685',[payload,{token:adminDangNhapInfo.sessionToken}]);
      if(r?.success){showToastV9(r.message||'Đã mở khóa.','success');document.getElementById('adminBulkReasonV685').value='';taiMoKhoaTuanHangLoatV685();}
      else showToastV9(r?.message||'Không mở khóa được.','danger');
    }catch(e){showToastV9(e.message||String(e),'danger');}
  }
  async function taiMoKhoaTuanHangLoatV685(){
    const box=document.getElementById('adminBulkUnlockListV685');if(!box||!adminDangNhapInfo?.sessionToken)return;
    box.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Đang tải...';
    try{
      const r=await callSodbEdgeRpcV67('layMoKhoaTuanHangLoatV685',[{token:adminDangNhapInfo.sessionToken}]);const rows=r?.data||[];
      box.innerHTML=rows.length?`<div class="table-responsive"><table class="table table-sm table-bordered align-middle mb-0"><thead><tr><th>Khoảng tuần</th><th>Toàn bộ lớp</th><th>Hết hạn</th><th>Lý do</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td class="fw-bold">Tuần ${escapeHtml(x.tu_tuan)} → ${escapeHtml(x.den_tuan)}</td><td>${x.cho_phep_tat_ca_lop?'<span class="badge bg-success">Có</span>':'<span class="badge bg-secondary">Không</span>'}</td><td>${escapeHtml(x.het_han?new Date(x.het_han).toLocaleString('vi-VN'):'')}</td><td>${escapeHtml(x.ly_do||'')}</td><td class="text-end"><button type="button" class="btn btn-outline-danger btn-sm" onclick="dongMoKhoaTuanHangLoatV685(${Number(x.id)||0})">Đóng</button></td></tr>`).join('')}</tbody></table></div>`:'Không có khoảng tuần nào đang mở.';
    }catch(e){box.textContent='Không tải được: '+(e.message||e);}
  }
  async function dongMoKhoaTuanHangLoatV685(id){
    if(!adminDangNhapInfo?.sessionToken||!id)return;
    const ok=await confirmV13('Đóng quyền mở khóa hàng loạt này ngay?',{title:'Đóng mở khóa',confirmText:'Đóng',danger:true});if(!ok)return;
    try{const r=await callSodbEdgeRpcV67('dongMoKhoaTuanHangLoatV685',[id,{token:adminDangNhapInfo.sessionToken}]);if(r?.success){showToastV9(r.message||'Đã đóng.','success');taiMoKhoaTuanHangLoatV685();}else showToastV9(r?.message||'Không đóng được.','danger');}catch(e){showToastV9(e.message||String(e),'danger');}
  }
  async function capNhatMoKhoaTuanCuV685(force){
    if(!gvbmDangNhapInfo?.sessionToken)return;
    const week=Number(document.getElementById('tuanHoc')?.value||0);if(!week)return;
    if(!force&&Number(bulkWeekUnlockStateV685.week||0)===week&&bulkWeekUnlockStateV685.checkedAt&&Date.now()-bulkWeekUnlockStateV685.checkedAt<12000)return;
    const serial=++bulkWeekUnlockRequestV685;
    try{
      const r=await callSodbEdgeRpcV67('kiemTraMoKhoaTuanHangLoatV685',[week,{token:gvbmDangNhapInfo.sessionToken}]);if(serial!==bulkWeekUnlockRequestV685)return;
      const oldAll=!!bulkWeekUnlockStateV685.allowAllClasses;
      bulkWeekUnlockStateV685={week,active:!!r?.active,allowAllClasses:!!r?.allowAllClasses,fromWeek:Number(r?.fromWeek||0),toWeek:Number(r?.toWeek||0),reason:String(r?.reason||''),expiresLabel:String(r?.expiresLabel||''),checkedAt:Date.now()};
      const notice=document.getElementById('bulkWeekUnlockNoticeV685');
      if(notice){
        if(bulkWeekUnlockStateV685.active){notice.classList.remove('d-none');notice.innerHTML=`<strong>Tuần cũ đang được Admin mở:</strong> Tuần ${bulkWeekUnlockStateV685.fromWeek}–${bulkWeekUnlockStateV685.toWeek}${bulkWeekUnlockStateV685.allowAllClasses?' · <strong>Được chọn toàn bộ lớp</strong>':''}${bulkWeekUnlockStateV685.expiresLabel?' · Hết hạn '+escapeHtml(bulkWeekUnlockStateV685.expiresLabel):''}.`;}
        else{notice.classList.add('d-none');notice.textContent='';}
      }
      if(oldAll!==bulkWeekUnlockStateV685.allowAllClasses || bulkWeekUnlockStateV685.allowAllClasses)capNhatKhoiVaLopPhanCongV39(true);
    }catch(e){console.warn('[V68.5 BULK UNLOCK]',e);}
  }

  /* ===== V68.3: hạn nhập tiết, Admin mở khóa, Giám thị dạy thay/nghỉ ===== */
  function todayIsoV683(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}
  function chonKhoiLopAdminInputV683(){const k=document.getElementById('adminInputKhoiV683')?.value||'10';napLopVaoSelectV22(document.getElementById('adminInputLopV683'),k,true);}
  function khoiTaoMoKhoaNhapTietV683(){
    const d=document.getElementById('adminInputDateV683');if(d&&!d.value)d.value=todayIsoV683();chonKhoiLopAdminInputV683();taiMoKhoaNhapTietV683();
  }
  async function moKhoaNhapTietAdminV683(){
    if(!adminDangNhapInfo?.sessionToken){showToastV9('Phiên Admin không hợp lệ.','danger');return;}
    const payload={lop:document.getElementById('adminInputLopV683')?.value||'',ngayDay:document.getElementById('adminInputDateV683')?.value||'',buoi:document.getElementById('adminInputBuoiV683')?.value||'',tiet:Number(document.getElementById('adminInputTietV683')?.value||0),soGio:Number(document.getElementById('adminInputHoursV683')?.value||4),lyDo:String(document.getElementById('adminInputReasonV683')?.value||'').trim()};
    if(!payload.lop||!payload.ngayDay||!payload.lyDo){showToastV9('Chọn lớp, ngày và nhập lý do mở khóa.','danger');return;}
    try{const r=await callSodbEdgeRpcV67('adminMoKhoaNhapTietV683',[payload,{token:adminDangNhapInfo.sessionToken}]);if(r?.success){showToastV9(r.message,'success');document.getElementById('adminInputReasonV683').value='';taiMoKhoaNhapTietV683();}else showToastV9(r?.message||'Không mở khóa được.','danger');}catch(e){showToastV9(e.message||String(e),'danger');}
  }
  async function taiMoKhoaNhapTietV683(){
    const box=document.getElementById('adminInputUnlockListV683');if(!box||!adminDangNhapInfo?.sessionToken)return;box.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Đang tải...';
    try{const r=await callSodbEdgeRpcV67('layMoKhoaNhapTietV683',[{token:adminDangNhapInfo.sessionToken}]);const rows=r?.data||[];box.innerHTML=rows.length?`<div class="table-responsive"><table class="table table-sm table-bordered mb-0"><thead><tr><th>Lớp</th><th>Ngày</th><th>Buổi/Tiết</th><th>Hết hạn</th><th>Lý do</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${escapeHtml(x.lop||'')}</td><td>${escapeHtml(x.ngay_day||'')}</td><td>${escapeHtml(x.buoi||'Cả ngày')} / ${x.tiet?('Tiết '+x.tiet):'Cả buổi'}</td><td>${escapeHtml(x.het_han?new Date(x.het_han).toLocaleString('vi-VN'):'')}</td><td>${escapeHtml(x.ly_do||'')}</td></tr>`).join('')}</tbody></table></div>`:'Không có khóa nhập tiết nào đang mở.';}catch(e){box.textContent='Không tải được: '+(e.message||e);}
  }
  function chonKhoiLopGiamThiStatusV683(){
    const k=document.getElementById('gtStatusKhoiV683')?.value||'10',sel=document.getElementById('gtStatusLopV683');if(!sel)return;napLopVaoSelectV22(sel,k,true);const opt=new Option('-- Tất cả --','');sel.insertBefore(opt,sel.firstChild);sel.value='';
  }
  function chonKhoiLopGiamThiReportV683(){const k=document.getElementById('gtReportKhoiV683')?.value||'10';napLopVaoSelectV22(document.getElementById('gtReportLopV683'),k,true);}
  function khoiTaoGiamThiTrangThaiV683(){
    const today=todayIsoV683();['gtStatusFromV683','gtStatusToV683','gtReportDateV683'].forEach(id=>{const e=document.getElementById(id);if(e&&!e.value)e.value=today;});chonKhoiLopGiamThiStatusV683();chonKhoiLopGiamThiReportV683();
  }
  function statusLabelV683(s){return ({DAY_THAY:'Dạy thay',NGHI:'Nghỉ/không tổ chức học',GV_VANG:'GV vắng',BO_TIET:'Bỏ tiết',DAY_BU:'Dạy bù',HOC_BINH_THUONG:'Học bình thường'})[String(s||'').toUpperCase()]||String(s||'');}
  async function taiTrangThaiTietGiamThiV683(){
    if(!giamThiDangNhapInfo?.sessionToken){showToastV9('Phiên Giám thị không hợp lệ.','danger');return;}
    const from=document.getElementById('gtStatusFromV683')?.value||'',to=document.getElementById('gtStatusToV683')?.value||from,lop=document.getElementById('gtStatusLopV683')?.value||'',status=document.getElementById('gtStatusFilterV683')?.value||'ALL',body=document.getElementById('gtStatusBodyV683');body.innerHTML='<tr><td colspan="10" class="py-4"><span class="spinner-border spinner-border-sm"></span> Đang tải...</td></tr>';
    try{const r=await callSodbEdgeRpcV67('traCuuTrangThaiTietGiamThiV683',[from,to,lop,status,{token:giamThiDangNhapInfo.sessionToken}]);const rows=r?.results||[];body.innerHTML=rows.length?rows.map(x=>`<tr><td>${escapeHtml(x.ngayFormatted||x.ngayDay||'')}</td><td class="fw-bold">${escapeHtml(x.lop||'')}</td><td>${escapeHtml(x.buoi||'')} · Tiết ${escapeHtml(x.tiet||'')}</td><td><span class="badge ${x.trangThaiTiet==='NGHI'?'bg-secondary':x.trangThaiTiet==='GV_VANG'?'bg-warning text-dark':x.trangThaiTiet==='BO_TIET'?'bg-danger':x.trangThaiTiet==='DAY_THAY'?'bg-primary':'bg-info text-dark'}">${escapeHtml(statusLabelV683(x.trangThaiTiet))}</span>${x.trangThaiXuLy==='DA_XU_LY'?'<br><small class="text-success">Đã xử lý</small>':''}</td><td>${escapeHtml(x.mon||'')}${x.tietCT?'<br><small>CT '+escapeHtml(x.tietCT)+'</small>':''}</td><td>${escapeHtml(x.tenGV||x.nguoiGhi||'')}</td><td>${escapeHtml(x.gvDuocThay||'')}</td><td class="text-start">${escapeHtml(x.tenBai||'')}</td><td class="text-start">${escapeHtml(x.lyDo||x.nhanXet||'')}${x.canDayBu?'<br><span class="badge bg-warning text-dark">Cần dạy bù</span>':''}</td><td>${x.source==='PERIOD_STATUS'&&x.trangThaiXuLy!=='DA_XU_LY'?`<button class="btn btn-outline-danger btn-sm" onclick="huyTrangThaiTietGiamThiV691('${escapeHtml(x.recordId||'')}')">Hủy</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="10" class="text-muted py-4">Không có trường hợp đặc biệt trong khoảng đã chọn.</td></tr>';}catch(e){body.innerHTML=`<tr><td colspan="10" class="text-danger py-4">${escapeHtml(e.message||String(e))}</td></tr>`;}
  }
  async function huyTrangThaiTietGiamThiV691(id){
    const lyDo=prompt('Nhập lý do hủy khai báo trạng thái tiết:','Nhập nhầm thông tin');if(!lyDo)return;
    try{const r=await callSodbEdgeRpcV67('huyTrangThaiTietGiamThiV691',[id,lyDo,{token:giamThiDangNhapInfo.sessionToken}]);if(r?.success){showToastV9(r.message||'Đã hủy.','success');taiTrangThaiTietGiamThiV683();}else showToastV9(r?.message||'Không hủy được.','danger');}catch(e){showToastV9(e.message||String(e),'danger');}
  }
  async function ghiTrangThaiTietGiamThiV683(){
    if(!giamThiDangNhapInfo?.sessionToken)return;
    const payload={ngayDay:document.getElementById('gtReportDateV683')?.value||'',lop:document.getElementById('gtReportLopV683')?.value||'',buoiDay:document.getElementById('gtReportBuoiV683')?.value||'Sáng',tietDay:Number(document.getElementById('gtReportTietV683')?.value||0),monHoc:String(document.getElementById('gtReportMonV683')?.value||'').trim(),trangThaiTiet:document.getElementById('gtReportStatusV683')?.value||'NGHI',gvNghi:String(document.getElementById('gtReportTeacherV683')?.value||'').trim(),nhomLyDo:document.getElementById('gtReportReasonTypeV691')?.value||'KHAC',canDayBu:!!document.getElementById('gtReportNeedMakeupV691')?.checked,lyDo:String(document.getElementById('gtReportReasonV683')?.value||'').trim()};
    if(!payload.ngayDay||!payload.lop||!payload.tietDay||!payload.lyDo){showToastV9('Vui lòng chọn ngày, lớp, tiết và nhập lý do.','danger');return;}if(payload.trangThaiTiet==='GV_VANG'&&!payload.gvNghi){showToastV9('Khai báo GV vắng cần nhập tên giáo viên vắng.','danger');return;}
    try{const r=await callSodbEdgeRpcV67('ghiTrangThaiTietGiamThiV683',[payload,{token:giamThiDangNhapInfo.sessionToken}]);if(r?.success){showToastV9(r.message,'success');document.getElementById('gtReportReasonV683').value='';document.getElementById('gtReportTeacherV683').value='';document.getElementById('gtReportNeedMakeupV691').checked=false;document.getElementById('gtStatusFromV683').value=payload.ngayDay;document.getElementById('gtStatusToV683').value=payload.ngayDay;taiTrangThaiTietGiamThiV683();}else showToastV9(r?.message||'Không ghi được trạng thái.','danger');}catch(e){showToastV9(e.message||String(e),'danger');}
  }

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

  /* V69.5.5: DANH MỤC TÊN MÔN CHUẨN - dùng chung toàn frontend */
  function subjectLooseKeyV6955(value){
    return (value===null||value===undefined?'':String(value)).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d')
      .replace(/[^a-z0-9]+/g,' ').trim();
  }
  function canonicalSubjectV6955(value){
    const raw=(value===null||value===undefined?'':String(value)).trim();if(!raw)return '';
    const k=subjectLooseKeyV6955(raw),compact=k.replace(/\s+/g,'');
    const exact={
      'toan':'Toán','ngu van':'Ngữ văn','tieng anh':'Tiếng Anh','ngoai ngu':'Tiếng Anh',
      'vat li':'Vật lý','vat ly':'Vật lý','hoa hoc':'Hóa học','sinh':'Sinh học','sinh hoc':'Sinh học',
      'lich su':'Lịch sử','dia li':'Địa lý','dia ly':'Địa lý','tin hoc':'Tin học',
      'am nhac':'Âm nhạc','my thuat':'Mỹ thuật','giao duc the chat':'GDTC','the duc':'GDTC',
      'cau long':'Cầu lông','bong chuyen':'Bóng chuyền','cong nghe':'Công nghệ',
      'cong nghe nong nghiep':'Công nghệ nông nghiệp','cong nghe cong nghiep':'Công nghệ công nghiệp',
      'giao duc kinh te va phap luat':'Giáo dục kinh tế và pháp luật',
      'giao duc quoc phong va an ninh':'Giáo dục quốc phòng và an ninh',
      'giao duc dia phuong':'Giáo dục địa phương'
    };
    if(exact[k])return exact[k];
    if(['gdtc','giaoducthechat','theduc'].includes(compact))return 'GDTC';
    if(['gdktpl','gdktpluat','giaoduckinhtevaphapluat'].includes(compact))return 'Giáo dục kinh tế và pháp luật';
    if(['gdqpan','gdqp','qpan','giaoducquocphongvaanninh'].includes(compact))return 'Giáo dục quốc phòng và an ninh';
    if(['gddp','giaoducdiaphuong'].includes(compact))return 'Giáo dục địa phương';
    const hd=compact.match(/^hdtn(?:hn)?([123])$/);if(hd)return `HĐTN ${hd[1]}`;const hdLong=compact.match(/^hoatdongtrainghiemhuongnghiep([123])$/);if(hdLong)return `HĐTN ${hdLong[1]}`;
    return raw;
  }
  function subjectKeyV6955(value){return subjectLooseKeyV6955(canonicalSubjectV6955(value)).replace(/\s+/g,'');}
  function canonicalSubjectListV6955(values){
    const out=[];for(const v of (values||[])){const c=canonicalSubjectV6955(v);if(c&&!out.some(x=>subjectKeyV6955(x)===subjectKeyV6955(c)))out.push(c);}return out;
  }
  function canonicalAssignmentMapV6955(raw){
    const out={};Object.entries(raw||{}).forEach(([k,arr])=>{const key=subjectKeyV6955(k);if(!key)return;if(!out[key])out[key]=[];(arr||[]).forEach(l=>{if(l&&!out[key].includes(l))out[key].push(l);});});return out;
  }

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
      s.innerHTML=''; canonicalSubjectListV6955(res.data||[]).forEach(m=>s.add(new Option(m,m)));
    }).withFailureHandler(function(){adminSubjectsLoadedV7=false;})
      .getDanhSachMonAdminV7({token:adminDangNhapInfo.sessionToken});
  }

  let START_DATE_WEEK1_STR = '2026-08-17';

  let dsLopChinhTheoKhoiV22 = {"10":[],"11":[],"12":[]};
  let dsLopDacBietTheoKhoiV22 = {"10":[],"11":[],"12":[]};
  let dsLopTheoKhoi = {};
  ["10","11","12"].forEach(k=>{dsLopTheoKhoi[k]=[...(dsLopChinhTheoKhoiV22[k]||[]),...(dsLopDacBietTheoKhoiV22[k]||[])];});

  function loaiSoTheoLopV22(lop){
    const meta=getClassMetaClientV26(lop);
    if(meta&&meta.type)return meta.type;
    const s=normalizeTextKey(lop);
    if(s.includes('chuyen de'))return 'CHUYEN_DE';
    if(s.includes('gdtc')||s.includes('giao duc the chat'))return 'GDTC';
    return 'LOP_CHINH';
  }
  function tieuDeSoTheoLopV22(lop,bookMode){
    const k=String(lop||'').match(/10|11|12/); const khoi=k?k[0]:'';
    const classType=loaiSoTheoLopV22(lop);
    if(classType==='CHUYEN_DE'){
      const meta=classMetaV26[normalizeTextKey(lop)]||{};
      return `SỔ ĐẦU BÀI CHUYÊN ĐỀ - ${lop}${meta.subject?` - ${meta.subject}`:''}`;
    }
    if(classType==='GDTC'||bookMode==='GDTC'){
      const meta=classMetaV26[normalizeTextKey(lop)]||{};
      return `SỔ ĐẦU BÀI GDTC - ${lop}${meta.subject?` - ${meta.subject}`:''}`;
    }
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
    const map=gvbmDangNhapInfo.phanCongLopTheoMon||{};
    const direct=(map[subjectKeyV6955(subject)]||[]).filter(Boolean);
    if(direct.length)return [...new Set(direct)];
    if(isGdtcBaseSubjectV25(subject)||isGdtcDetailSubjectV25(subject)){
      const out=[];
      Object.entries(map).forEach(([k,arr])=>{
        if(isGdtcBaseSubjectV25(k)||isGdtcDetailSubjectV25(k)) (arr||[]).forEach(l=>{if(l&&!out.includes(l))out.push(l);});
      });
      return out;
    }
    if(isTechnologyDetailSubjectV657(subject)){
      const base=(map[subjectKeyV6955('Công nghệ')]||[]).filter(Boolean);
      if(base.length)return base;
    }
    return [];
  }
  function renderAssignmentNoteV39(subject,classes){
    const note=document.getElementById('phanCongDayNoteV39');if(!note)return;
    if(isGdtcBaseSubjectV25(subject)||isGdtcDetailSubjectV25(subject)){
      note.textContent=classes.length
        ? `GDTC: ${classes.length} lớp/nhóm độc lập (VD: BC1, CL2) theo phân công dạy.`
        : 'Chưa có lớp/nhóm GDTC được phân công. Kiểm tra sheet “Phân công dạy” và danh mục Lớp.';
      note.className='small fw-semibold mb-2 '+(classes.length?'text-success':'text-danger');return;
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
    const subject=canonicalSubjectV6955(monSel.value);
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
      if(name){const c={...m};if('subject' in c)c.subject=canonicalSubjectV6955(c.subject);if('monKhbd' in c)c.monKhbd=canonicalSubjectV6955(c.monKhbd);out[normalizeTextKey(name)]=c;}
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
        phanCongLopTheoMon:canonicalAssignmentMapV6955(data.assignments.phanCongLopTheoMon||gvbmDangNhapInfo.phanCongLopTheoMon||{}),
        dsLopDay:data.assignments.dsLopDay||gvbmDangNhapInfo.dsLopDay||[],
        dsMonGV:canonicalSubjectListV6955((data.assignments.dsMonDay&&data.assignments.dsMonDay.length)?data.assignments.dsMonDay:gvbmDangNhapInfo.dsMonGV)
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
      const expanded=expandGdtcSubjectsV25(canonicalSubjectListV6955(data.subjects));
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
    chonKhoiLopView();chonKhoiLopInput();chonKhoiLopAdmin();khoiTaoDanhSachLopGiamThi();capNhatTuanVaThu();bootstrapLoadedV6=true;classCatalogLoadedAtV47=Date.now();
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
        ['control-tab-v693','Điều hành'],
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
      const heading=document.createElement('div');heading.className='fw-bold mb-1';heading.textContent=String(title||'');
      const detail=document.createElement('div');detail.className='small';detail.textContent=String(text||'');
      note.replaceChildren(heading,detail);
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
    subject=canonicalSubjectV6955(subject);const key=subjectKeyV6955(subject);
    let opt=[...sel.options].find(o=>normalizeTextKey(o.value)===key);
    if(!opt){
      const allowed=(gvbmDangNhapInfo?.dsMonGV||[]).some(m=>subjectKeyV6955(m)===key)
        || (isGdtcDetailSubjectV25(subject)&&gvbmHasGdtcV25());
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

    if(meta&&(meta.type==='CHUYEN_DE'||meta.type==='GDTC')){
      const subject=String(meta.subject||'').trim();
      const label=meta.type==='GDTC'?'GDTC':'Chuyên đề';
      if(!subject){
        if(note)note.innerText=`Lớp/nhóm ${label} "${lop}" chưa khai báo Môn/KHBD trong sheet Lớp.`;
        configureGdtcInputV25();
        configureTechnologyInputV657();
        if(typeof refreshGroupAttendanceV6951==='function')refreshGroupAttendanceV6951();
        return;
      }
      if(!ensureTeacherSubjectOptionV26(subject)){
        if(note)note.innerText=`Lớp/nhóm ${label} "${lop}" được khai báo môn ${subject}, nhưng tài khoản này chưa được phân công môn đó.`;
        configureGdtcInputV25();
        configureTechnologyInputV657();
        if(typeof refreshGroupAttendanceV6951==='function')refreshGroupAttendanceV6951();
        return;
      }
      monSel.disabled=true;
      monSel.classList.add('bg-light');
      if(note)note.innerHTML=`<span class="special-class-subject-v26">${label}: ${escapeHtml(lop)} · Môn/KHBD: ${escapeHtml(subject)}</span>`;
    }

    configureGdtcInputV25();
    configureTechnologyInputV657();
    populateGdtcClassOptionsV26();
    loadDanhSachBaiDay();
    if(typeof refreshGroupAttendanceV6951==='function')refreshGroupAttendanceV6951();
  }

  function populateGdtcClassOptionsV26(){
    // V69.5.1: GDTC là lớp/nhóm độc lập (BC1, CL2...), không ghép 2-3 lớp trên một bản ghi.
    return [document.getElementById('lop')?.value||''].filter(Boolean);
  }
  function syncGdtcClassMixV26(){ return populateGdtcClassOptionsV26(); }
  function getGdtcClassMixV26(){
    const primary=document.getElementById('lop')?.value||'';
    return primary?[primary]:[];
  }
  function syncGdtcClassMixNoteV26(){ return; }

  function isGdtcBaseSubjectV25(value){
    const k=normalizeTextKey(value);
    return k==='gdtc'||k==='giao duc the chat'||k==='the duc';
  }
  function isGdtcDetailSubjectV25(value){
    const k=normalizeTextKey(value),compact=k.replace(/\s+/g,'');
    return k==='cau long'||k==='bong chuyen'||compact==='caulong'||compact==='bongchuyen';
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
    if(!show)detail.value='';
    return show;
  }
  function getEffectiveMonHocV25(){
    const mon=document.getElementById('monHoc');
    const gdtcDetail=document.getElementById('gdtcTeachingSubjectV25');
    const techDetail=document.getElementById('technologyTeachingSubjectV657');
    if(mon&&gvbmHasGdtcV25()&&isGdtcBaseSubjectV25(mon.value)){
      return gdtcDetail?canonicalSubjectV6955(gdtcDetail.value):'';
    }
    if(mon&&gvbmHasTechnologyV657()&&isTechnologyBaseSubjectV657(mon.value)){
      return techDetail?canonicalSubjectV6955(techDetail.value):'';
    }
    return mon?canonicalSubjectV6955(mon.value):'';
  }
  function onMonHocChangedV25(){
    configureGdtcInputV25();
    configureTechnologyInputV657();
    if(gvbmDangNhapInfo){capNhatKhoiVaLopPhanCongV39(true);return;}
    loadDanhSachBaiDay();
  }
  function expandGdtcSubjectsV25(mons){
    const out=[],seen=new Set();
    canonicalSubjectListV6955(mons||[]).forEach(m=>{
      const k=subjectKeyV6955(m);
      if(!seen.has(k)){seen.add(k);out.push(m);}
    });
    if(out.some(isGdtcBaseSubjectV25)){
      ['Cầu lông','Bóng chuyền'].forEach(m=>{
        const k=subjectKeyV6955(m);if(!seen.has(k)){seen.add(k);out.push(m);}
      });
    }
    if(out.some(isTechnologyBaseSubjectV657)){
      ['Công nghệ nông nghiệp','Công nghệ công nghiệp'].forEach(m=>{
        const k=subjectKeyV6955(m);if(!seen.has(k)){seen.add(k);out.push(m);}
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
    res={...res,dsMonGV:canonicalSubjectListV6955(res.dsMonGV||[]),phanCongLopTheoMon:canonicalAssignmentMapV6955(res.phanCongLopTheoMon||{})};
    gvbmDangNhapInfo=res;
    document.getElementById('gvbmMainContent').classList.remove('d-none');
    document.getElementById('tenGV').value=res.tenGV||'';
    document.getElementById('cccd').value=res.cccd||'';
    const selectMon=document.getElementById('monHoc');selectMon.innerHTML='';
    canonicalSubjectListV6955(res.dsMonGV||[]).forEach(m=>selectMon.add(new Option(m,m)));
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
    const mons=canonicalSubjectListV6955(effectiveRes.dsMon||[]);
    const name=effectiveRes.tenTTCM||effectiveRes.tenBGH||effectiveRes.tenGV||res.tenTTCM||res.tenBGH||res.tenGV||'';
    document.getElementById('ttcmWelcomeMsg').innerText=fullAccessLabel
      ? `✅ ${fullAccessLabel}${name?' — '+name:''} — quyền xem và quản lý KHBD toàn trường${isPht?' · Có quyền duyệt KHBD':''}`
      : `✅ ${name} — ${effectiveRes.chucVu||res.chucVu||'Tổ trưởng/Tổ phó chuyên môn'} — Môn: ${mons.join(', ')}`;
    const uploadMons=expandGdtcSubjectsV25(canonicalSubjectListV6955(mons));
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
    if(monSel){const old=monSel.value;monSel.innerHTML='';expandGdtcSubjectsV25(canonicalSubjectListV6955(gv.dsMonGV||[])).forEach(m=>monSel.add(new Option(m,m)));if([...monSel.options].some(o=>o.value===old))monSel.value=old;}
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
    const old=sel.value,khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=canonicalSubjectV6955(document.getElementById('khbdMyMonV67')?.value);
    const map=gvbmDangNhapInfo?.phanCongLopTheoMon||{},key=subjectKeyV6955(mon);let classes=Array.isArray(map[key])?map[key].slice():[];
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
    const khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=canonicalSubjectV6955(document.getElementById('khbdMyMonV67')?.value),lop=String(document.getElementById('khbdMyLopV691')?.value||'').trim();
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
    const khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=canonicalSubjectV6955(document.getElementById('khbdMyMonV67')?.value),lop=String(document.getElementById('khbdMyLopV691')?.value||'').trim(),khbdIds=[...document.querySelectorAll('.khbd-my-check-v67:checked')].map(x=>String(x.dataset.khbdId||'').trim()).filter(Boolean);
    if(!lop){showToastV9('Vui lòng chọn lớp trước khi lưu KHBD.','danger');return;}
    setBusyV13(true,'Đang lưu từng tiết KHBD cho lớp...');google.script.run.withSuccessHandler(function(res){setBusyV13(false);if(!res||!res.success){alertV13('❌ '+(res&&res.message||'Không lưu được'));return;}lessonPlanCache={};showToastV9(res.message||'Đã lưu.','success');taiKhbdCaNhanV67();}).withFailureHandler(function(err){setBusyV13(false);alertV13('❌ '+String(err&&err.message||err));}).chonKhbdCaNhanV67({mode:'SYNC_LESSONS',khoi,mon,lop,khbdIds},getKhbdMyAuthV67());
  }
  function chonToanBoKhbdV67(){const khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=canonicalSubjectV6955(document.getElementById('khbdMyMonV67')?.value),lop=String(document.getElementById('khbdMyLopV691')?.value||'').trim();if(!lop){showToastV9('Vui lòng chọn lớp.','danger');return;}google.script.run.withSuccessHandler(function(res){if(res?.success){showToastV9(res.message,'success');lessonPlanCache={};taiKhbdCaNhanV67();}else alertV13('❌ '+(res?.message||''));}).chonKhbdCaNhanV67({mode:'SELECT_ALL',khoi,mon,lop},getKhbdMyAuthV67());}
  function boChonKhbdV67(){const khoi=Number(document.getElementById('khbdMyKhoiV67')?.value||10),mon=canonicalSubjectV6955(document.getElementById('khbdMyMonV67')?.value),lop=String(document.getElementById('khbdMyLopV691')?.value||'').trim();if(!lop){showToastV9('Vui lòng chọn lớp.','danger');return;}google.script.run.withSuccessHandler(function(res){if(res?.success){showToastV9(res.message,'success');lessonPlanCache={};taiKhbdCaNhanV67();}}).chonKhbdCaNhanV67({mode:'CLEAR_SCOPE',khoi,mon,lop},getKhbdMyAuthV67());}


  function moTabMacDinhV33(res){
    setTimeout(function(){
      const btn=document.getElementById('dashboard-tab-v9');
      if(btn){
        try{
          if(window.bootstrap)bootstrap.Tab.getOrCreateInstance(btn).show();
          else btn.click();
        }catch(e){try{btn.click();}catch(_e){}}
      }
      const runDash=()=>{
        refreshDashboardV9(false);
        const roles=Array.isArray(currentUnifiedLoginV4?.roles)?currentUnifiedLoginV4.roles:[];
        const canControl=roles.some(r=>['GIAM_THI','BGH','ADMIN'].includes(r));
        if(canControl&&typeof refreshDashboardControlSummaryV693==='function')setTimeout(()=>refreshDashboardControlSummaryV693(false),260);
        if(typeof alertAllowedV695==='function'&&alertAllowedV695()&&typeof loadAutomaticAlertsV695==='function')setTimeout(()=>loadAutomaticAlertsV695(false),720);
      };
      if('requestIdleCallback' in window)requestIdleCallback(runDash,{timeout:600});else setTimeout(runDash,180);
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
    setTopTabVisibleV4('control-tab-v693',!!sessions.GIAM_THI||!!sessions.BGH||isAdmin);
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

    if(isAdmin){adminDangNhapInfo=sessions.ADMIN;document.getElementById('adminAuthBox')?.classList.add('d-none');document.getElementById('adminMainContent')?.classList.remove('d-none');}
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
    chonKhoiLopView(); chonKhoiLopInput(); chonKhoiLopAdmin();
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


  /* ========================================================================
     SODB V69 RUNTIME / API BRIDGE
     ------------------------------------------------------------------------
     - Khi index chạy trong Google Apps Script: giữ nguyên google.script.run.
     - Khi index chạy trên GitHub Pages: mô phỏng google.script.run và gửi RPC
       tới Web App Apps Script bằng fetch().

     VIỆC DUY NHẤT CẦN LÀM TRƯỚC KHI UP GITHUB:
     Thay URL bên dưới bằng URL Web App kết thúc bằng /exec sau khi Deploy lại
     file Code_GitHub_API.gs.
     ======================================================================== */
  const SODB_API_URL = "https://script.google.com/macros/s/AKfycbz9MXRTWMHFul61vWxTr3gOVNpfsL6R7zMZ8s-e_jh17wqmC6cYp9u25J-4onRhaJfnbA/exec";
  // V68: Supabase-first cho đăng nhập, Dashboard, KHBD, Sổ đầu bài và dữ liệu vận hành. Publishable key an toàn để dùng ở browser; Secret key tuyệt đối không nằm tại đây.
  const SODB_SUPABASE_URL_V66 = "https://mlwhxxpmnhrrkbkivvye.supabase.co";
  const SODB_SUPABASE_PUBLISHABLE_KEY_V66 = "sb_publishable_Hq6KRH5KDT1eiOYLwwQhkw_c45sZkgi";
  const SODB_EDGE_URL_V66 = SODB_SUPABASE_URL_V66 + "/functions/v1/sodb-core-v69";
  const SODB_FRONTEND_VERSION = "V70.4.4";
  window.__SODB_BACKEND_VERSION__ = "UNKNOWN";
  // V69.2.2 Stable: đo thời gian thực tế các chặng mạng để tối ưu dựa trên số liệu.
  window.__SODB_PERF__ = Array.isArray(window.__SODB_PERF__) ? window.__SODB_PERF__ : [];
  function recordSodbPerfV6922(source, action, startedAt, ok){
    try{
      const ms=Math.max(0,Math.round(performance.now()-startedAt));
      const row={ts:new Date().toISOString(),source:String(source||''),action:String(action||''),ms,ok:!!ok};
      window.__SODB_PERF__.push(row);
      if(window.__SODB_PERF__.length>200)window.__SODB_PERF__.splice(0,window.__SODB_PERF__.length-200);
      return row;
    }catch(_e){return null;}
  }
  window.sodbPerfReportV6922=function(){
    const rows=(window.__SODB_PERF__||[]).slice();
    const groups={};
    rows.forEach(r=>{const k=r.source+':'+r.action;(groups[k]||(groups[k]=[])).push(Number(r.ms)||0);});
    const summary=Object.entries(groups).map(([action,vals])=>({action,count:vals.length,avgMs:Math.round(vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length)),maxMs:Math.max(...vals)})).sort((a,b)=>b.avgMs-a.avgMs);
    return {rows,summary};
  };

  function normalizeSignatureUrlV67_1(raw){
    let url=String(raw||'').trim();
    if(!url)return '';
    url=url.replace(/^IMAGE:/i,'').trim();
    if(/^STORAGE:/i.test(url)||/^teachers\//i.test(url)||/^evidence\//i.test(url)){
      // V69: bucket chữ ký private; browser không được tự dựng public URL.
      return '';
    }
    if(/\/storage\/v1\/object\/(?:public|sign)\/teacher-signatures\//i.test(url)) return url;
    if(/^(data:image\/|blob:)/i.test(url))return url;
    if(/drive\.google\.com/i.test(url)){
      const m=url.match(/[-\w]{25,}/);
      if(m)return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(m[0])+'&sz=w480';
    }
    return url;
  }

  function buildSignatureUrlCandidatesV682(raw){
    let s=String(raw||'').trim();
    if(!s)return [];
    s=s.replace(/^IMAGE:/i,'').trim();
    const out=[];
    const add=u=>{u=String(u||'').trim();if(u&&!out.includes(u))out.push(u);};
    if(/^STORAGE:/i.test(s)||/^teachers\//i.test(s)||/^evidence\//i.test(s)){
      // V69: private ref chỉ được Edge đổi thành signed URL.
      return out;
    }
    if(/^(https?:\/\/|data:image\/|blob:)/i.test(s))add(s);
    return out;
  }
  function setSignaturePreviewSrcV682(img,url){
    if(!img)return;
    const candidates=buildSignatureUrlCandidatesV682(url);
    img.dataset.sigCandidates=JSON.stringify(candidates);
    img.dataset.sigIndex='0';
    img.src=candidates[0]||normalizeSignatureUrlV67_1(url||'');
  }
  function handleSignatureImageErrorV682(img){
    if(!img)return;
    let candidates=[];
    try{candidates=JSON.parse(img.dataset.sigCandidates||'[]');}catch(_e){}
    let idx=parseInt(img.dataset.sigIndex||'0',10);
    if(Number.isNaN(idx))idx=0;
    if(idx+1<candidates.length){
      idx+=1;
      img.dataset.sigIndex=String(idx);
      img.src=candidates[idx];
      return;
    }
    img.classList.add('d-none');
    const holder=img.closest('.signature-preview-v21, .gvcn-signature-preview-v681, .sig-container');
    const ph=holder ? (holder.querySelector('.sig-fallback-v682')||holder.querySelector('#sigPlaceholder')||holder.querySelector('#gvcnSigPlaceholder')) : null;
    if(ph){
      if(ph.classList) ph.classList.remove('d-none');
      if(ph.id!=='sigPlaceholder' && ph.id!=='gvcnSigPlaceholder' && !ph.textContent.trim()) ph.textContent='Đã xác nhận điện tử';
    }else if(holder){
      const span=document.createElement('span');
      span.className='sig-fallback-v682 text-muted';
      span.textContent='Đã xác nhận điện tử';
      holder.appendChild(span);
    }
  }

  // V69 ARCHITECTURE REBUILD: Supabase là nguồn vận hành chuẩn; Apps Script chỉ còn tác vụ Google Drive/backup.
  // V68: các RPC dữ liệu vận hành chạy trực tiếp trên Supabase Edge.
  // Các chức năng Google Drive/backup đặc thù vẫn đi Apps Script.
  const SODB_EDGE_RPC_METHODS_V67 = new Set([
    'getBootstrapClientV6','getDanhSachLopMoiV29','dangXuatHeThongV701','capNhatDanhSachLopV701','capNhatDanhSachHocSinhV701','layDanhSachHocSinhLopV701','layPhanCongDayCuaGVV39','xacThucPhienHeThongV4',
    'getDanhSachBaiDayTheoMon','layDanhSachKHBDTheoKhoiV36','capNhatKeHoachBaiDay',
    'layDanhSachDuyetKHBDV50','layKhbdDaTaiCuaTTCMV659','xuLyDuyetKHBDV50','layKhbdCaNhanV67','chonKhbdCaNhanV67','resetKhbdAdminV69552',
    'layTrangSoDauBaiV24','layDuLieuSoDauBaiTuanGop','luuSoDauBai','luuChotTuanGVCN','duyetTuanBGHV684','layTrungTamDuyetTuanBGHV698','layMaTranDuyetTuanBGHV698',
    'kiemTraTrangThaiKhoaTuan','adminMoKhoaTuan','adminMoKhoaTuanHangLoatV685','layMoKhoaTuanHangLoatV685','dongMoKhoaTuanHangLoatV685','kiemTraMoKhoaTuanHangLoatV685','layNhatKyV4',
    'getDanhSachMonAdminV7','getDanhSachMonKHBD','getDanhSachGVTheoMon','luuCauHinhV4',
    'traCuuChiTietGiamThi','kiemTraNhapTreGiamThi','traCuuThongKeTheoKhoiNgay',
    'kiemTraTrungTietAdmin','doiSoatKHBDGiamThi',
    'kiemTraHanNhapTietV683','adminMoKhoaNhapTietV683','layMoKhoaNhapTietV683',
    'ghiTrangThaiTietGiamThiV683','traCuuTrangThaiTietGiamThiV683','huyTrangThaiTietGiamThiV691',
    'luuChuKyGiaoVienV21','xoaChuKyGiaoVienV21','traCuuChuKyTheoCCCD','doiMatKhauTaiKhoanV6853',
    'capNhatSoDauBaiV4','guiYeuCauChinhSuaV4','layYeuCauCuaToiV4','layYeuCauChinhSuaV4','xuLyYeuCauChinhSuaV4','layBanGhiCuaToiV4',
    'layQuyenDacBietV69','luuQuyenDacBietV69','thuHoiQuyenDacBietV69',
    'layPhanQuyenTaiKhoanV69553','luuPhanQuyenTaiKhoanV69553','khoiPhucPhanQuyenTuDongV69553','moKhoaDangNhapAdminV699','layTrungTamChatLuongDuLieuV699','layLichSuBanGhiV699',
    'layVongDoiNamHocV700','kiemTraDongNamHocV700','dongNamHocTaoNamMoiV700','layLuuTruNamHocV700','layLuuTruNamHocV702','layChuKyLuuTruV702','layHoSoInLuuTruV702',
    'layDuLieuGocAdminV696','luuGiaoVienAdminV696','luuPhanCongDayAdminV696','xoaPhanCongDayAdminV696','luuGvcnAdminV696','xoaGvcnAdminV696','luuToChuyenMonAdminV696','xoaToChuyenMonAdminV696',
    'layDanhSachGiaoVienDieuHanhV693','layChuongTrinhNgoaiTruongV7044','luuChuongTrinhNgoaiTruongV7044','danhDauDaKiemTraBGHV7044','duyetNhieuSoDaKiemTraV7044','layNhanSuNgoaiTruongV693','luuNhanSuNgoaiTruongV693','doiTrangThaiNhanSuNgoaiTruongV693','layNhanSuNgoaiTruongChoKyV693',
    'layHoSoNghiGiaoVienV693','luuHoSoNghiGiaoVienV693','duyetHoSoNghiGiaoVienV693',
    'layDieuHanhTietDayV693','luuDieuHanhTietDayV693','duyetDieuHanhTietDayV693','layDieuHanhTietCuaToiV693','layNhiemVuDieuHanhCuaToiV693','tongQuanDieuHanhV693','layDanhMucMaTranKHBDV694','layMaTranKHBDLopV694','baoCaoDieuHanhNangCaoV694','layCanhBaoTuDongV695','layDanhSachHocSinhNhomV6951','luuDanhSachHocSinhNhomV6951','luuChotTuanNhomV6951','duyetTuanNhomBGHV6951','baoCaoNhomHocV6951'
  ]);

  (function installSodbV69RuntimeBridge(){
    // Nếu đang chạy bên trong HtmlService của Apps Script thì dùng cầu nối gốc.
    if (window.google && window.google.script && window.google.script.run) return;

    function assertApiUrlV59(){
      const url=String(SODB_API_URL||'').trim();
      if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:[?#].*)?$/.test(url) || url.includes('PASTE_DEPLOYMENT_ID_HERE')){
        throw new Error('Chưa cấu hình SODB_API_URL. Hãy dán URL Web App Apps Script kết thúc bằng /exec vào đầu phần SODB V69 RUNTIME / API BRIDGE trong index.html.');
      }
      return url;
    }

    function apiHelpUrlV58(){
      try{
        const u=new URL(assertApiUrlV59());
        u.searchParams.set('health','1');
        return u.toString();
      }catch(_e){ return String(SODB_API_URL||''); }
    }

    function apiHtmlErrorV58(raw){
      const text=String(raw||'');
      if(/accounts\.google\.com|servicelogin|đăng nhập.*google|sign in.*google|authorization required/i.test(text)){
        return 'Web App đang yêu cầu đăng nhập Google. Hãy vào Deploy → Manage deployments và đặt Execute as: Me; Who has access: Anyone.';
      }
      if(/script function not found|function.*not found/i.test(text)){
        return 'Deployment đang chạy phiên bản mã không có API cần thiết. Hãy Deploy → Manage deployments → Edit → New version → Deploy.';
      }
      if(/page not found|requested url was not found|deployment.*not found/i.test(text)){
        return 'Không tìm thấy deployment Apps Script. Kiểm tra lại URL /exec và deployment đang hoạt động.';
      }
      return 'Apps Script trả về HTML thay vì JSON. Kiểm tra quyền Web App: Execute as = Me và Who has access = Anyone.';
    }

    async function callAppsScriptRpcV59(action,args){
      const perfStart=performance.now(); let perfOk=false;
      const apiUrl=assertApiUrlV59();
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),60000);
      try{
        const response=await fetch(apiUrl,{
          method:'POST',
          mode:'cors',
          redirect:'follow',
          credentials:'omit',
          cache:'no-store',
          headers:{'Content-Type':'text/plain;charset=utf-8'},
          body:JSON.stringify({rpc:'sodb-v1',action:String(action||''),args:Array.isArray(args)?args:[]}),
          signal:controller.signal
        });
        const raw=await response.text();
        if(!response.ok){
          throw new Error('Apps Script HTTP '+response.status+'. '+(raw?String(raw).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,180):'Không có nội dung phản hồi.'));
        }
        let payload;
        try{ payload=JSON.parse(raw); }
        catch(parseErr){
          const looksHtml=/^\s*</.test(raw||'');
          throw new Error(looksHtml ? apiHtmlErrorV58(raw) : 'Phản hồi API không phải JSON hợp lệ.');
        }
        if(payload&&payload.appVersion){
          window.__SODB_BACKEND_VERSION__=String(payload.appVersion);
        }
        if(!payload || payload.ok!==true){
          const baseErr=payload&&payload.error?payload.error:'API không thực hiện được yêu cầu.';
          if(!payload?.appVersion || String(payload.appVersion)!==SODB_FRONTEND_VERSION){
            throw new Error('Backend chưa đúng '+SODB_FRONTEND_VERSION+' (đang '+(payload?.appVersion||'phiên bản cũ/không xác định')+'). Hãy Deploy → Manage deployments → Edit → New version → Deploy. Chi tiết: '+baseErr);
          }
          throw new Error(baseErr);
        }
        if(String(payload.appVersion||'')!==SODB_FRONTEND_VERSION){
          throw new Error('Lệch phiên bản: frontend '+SODB_FRONTEND_VERSION+' nhưng backend '+(payload.appVersion||'không xác định')+'. Hãy deploy lại Apps Script đúng phiên bản.');
        }
        perfOk=true;
        return payload.result;
      }catch(err){
        if(err&&err.name==='AbortError') throw new Error('Máy chủ phản hồi quá 60 giây. Kiểm tra Apps Script hoặc thử lại.');
        if(err instanceof TypeError){
          throw new Error('Trình duyệt không kết nối được Apps Script (Failed to fetch/CORS). URL /exec đã cấu hình; hãy kiểm tra Deploy → Manage deployments → Execute as: Me → Who has access: Anyone.');
        }
        throw err;
      }finally{
        clearTimeout(timeout);
        recordSodbPerfV6922('APPS_SCRIPT',action,perfStart,perfOk);
      }
    }

    window.__SODB_API_HEALTH_URL__=apiHelpUrlV58();

    function makeRunnerV59(successHandler,failureHandler){
      return new Proxy({}, {
        get:function(_target,prop){
          if(prop==='withSuccessHandler'){
            return function(fn){ return makeRunnerV59(typeof fn==='function'?fn:null,failureHandler); };
          }
          if(prop==='withFailureHandler'){
            return function(fn){ return makeRunnerV59(successHandler,typeof fn==='function'?fn:null); };
          }
          // Tránh bị coi như Promise/thenable khi trình duyệt hoặc thư viện kiểm tra object.
          if(prop==='then') return undefined;
          return function(){
            const args=Array.prototype.slice.call(arguments);
            const method=String(prop);
            const rpcPromise=SODB_EDGE_RPC_METHODS_V67.has(method)
              ? callSodbEdgeRpcV67(method,args)
              : callAppsScriptRpcV59(method,args);
            rpcPromise
              .then(function(result){ if(successHandler) successHandler(result); })
              .catch(function(error){
                if(failureHandler) failureHandler(error);
                else console.error('[SODB API]',prop,error);
              });
          };
        }
      });
    }

    window.google=window.google||{};
    window.google.script=window.google.script||{};
    window.google.script.run=makeRunnerV59(null,null);
    window.__SODB_GITHUB_MODE__=true;
  })();

  function sodbErrorTextV658(value){
    if(value===null||value===undefined)return '';
    if(typeof value==='string')return value;
    if(value instanceof Error)return value.message||String(value);
    if(typeof value==='object'){
      const parts=[];
      ['message','details','hint','code','error_description','error'].forEach(k=>{
        const v=value[k];
        if(v!==undefined&&v!==null&&String(v).trim()&&String(v)!=='[object Object]')parts.push(String(v).trim());
      });
      if(parts.length)return [...new Set(parts)].join(' · ');
      try{return JSON.stringify(value);}catch(_e){return String(value);}
    }
    return String(value);
  }

  async function callSodbEdgeV66(payload,timeoutMs){
    const perfStart=performance.now(); let perfOk=false;
    const perfAction=String(payload?.method||payload?.action||'edge');
    const controller=new AbortController();
    const timeoutLimit=Math.max(3000,Number(timeoutMs)||12000);
    const timeout=setTimeout(()=>controller.abort(),timeoutLimit);
    try{
      const r=await fetch(SODB_EDGE_URL_V66,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json','apikey':SODB_SUPABASE_PUBLISHABLE_KEY_V66},body:JSON.stringify(payload||{}),signal:controller.signal});
      let data=null;try{data=await r.json();}catch(_e){}
      if(r.ok){perfOk=true;return data;}
      if(data&&data.success===false&&[400,401,403,429].includes(r.status)){perfOk=true;return data;}
      throw new Error(data&&data.message?sodbErrorTextV658(data.message):('Supabase Edge HTTP '+r.status));
    }catch(e){
      if(e&&e.name==='AbortError')throw new Error(`Supabase Edge phản hồi quá ${Math.round(timeoutLimit/1000)} giây.`);
      throw e;
    }finally{clearTimeout(timeout);recordSodbPerfV6922('EDGE',perfAction,perfStart,perfOk);}
  }
  async function callSodbEdgeRpcV67(method,args,timeoutMs){
    const data=await callSodbEdgeV66({action:'rpc',method:String(method||''),args:Array.isArray(args)?args:[]},timeoutMs);
    if(!data||data.success!==true)throw new Error(data&&data.message?sodbErrorTextV658(data.message):'Supabase V69 không thực hiện được yêu cầu.');
    return data.result;
  }
  window.__SODB_EDGE_URL_V66__=SODB_EDGE_URL_V66;


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
    const label=type==='GDTC'?'Lớp/nhóm GDTC':'Lớp Chuyên đề';
    note.textContent=`${label} được quản lý như lớp nhóm độc lập, có danh sách học sinh và sổ riêng`+(meta.subject?` · KHBD môn ${meta.subject}.`:'.');
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
  function statusLabelV683(s){return ({DAY_THAY:'Dạy thay',NGHI:'Nghỉ/không tổ chức học',GV_VANG:'GV vắng',BO_TIET:'Bỏ tiết',DAY_BU:'Dạy bù',HOAN_DOI:'Hoán đổi tiết',HOC_BINH_THUONG:'Học bình thường'})[String(s||'').toUpperCase()]||String(s||'');}
  async function taiTrangThaiTietGiamThiV683(){
    if(!giamThiDangNhapInfo?.sessionToken){showToastV9('Phiên Giám thị không hợp lệ.','danger');return;}
    const from=document.getElementById('gtStatusFromV683')?.value||'',to=document.getElementById('gtStatusToV683')?.value||from,lop=document.getElementById('gtStatusLopV683')?.value||'',status=document.getElementById('gtStatusFilterV683')?.value||'ALL',body=document.getElementById('gtStatusBodyV683');body.innerHTML='<tr><td colspan="10" class="py-4"><span class="spinner-border spinner-border-sm"></span> Đang tải...</td></tr>';
    try{const r=await callSodbEdgeRpcV67('traCuuTrangThaiTietGiamThiV683',[from,to,lop,status,{token:giamThiDangNhapInfo.sessionToken}]);const rows=r?.results||[];body.innerHTML=rows.length?rows.map(x=>`<tr><td>${escapeHtml(x.ngayFormatted||x.ngayDay||'')}</td><td class="fw-bold">${escapeHtml(x.lop||'')}</td><td>${escapeHtml(x.buoi||'')} · Tiết ${escapeHtml(x.tiet||'')}</td><td><span class="badge ${x.trangThaiTiet==='NGHI'?'bg-secondary':x.trangThaiTiet==='GV_VANG'?'bg-warning text-dark':x.trangThaiTiet==='BO_TIET'?'bg-danger':x.trangThaiTiet==='DAY_THAY'?'bg-primary':'bg-info text-dark'}">${escapeHtml(statusLabelV683(x.trangThaiTiet))}</span>${x.trangThaiXuLy==='DA_XU_LY'?'<br><small class="text-success">Đã xử lý</small>':''}</td><td>${escapeHtml(x.mon||'')}${x.tietCT?'<br><small>CT '+escapeHtml(x.tietCT)+'</small>':''}</td><td>${escapeHtml(x.tenGV||x.nguoiGhi||'')}</td><td>${escapeHtml(x.gvDuocThay||'')}</td><td class="text-start">${escapeHtml(x.tenBai||'')}</td><td class="text-start">${escapeHtml(x.lyDo||x.nhanXet||'')}${x.canDayBu?'<br><span class="badge bg-warning text-dark">Cần dạy bù</span>':''}</td><td>${x.source==='PERIOD_STATUS'&&x.trangThaiXuLy!=='DA_XU_LY'?`<button class="btn btn-outline-danger btn-sm" onclick="huyTrangThaiTietGiamThiV691(decodeURIComponent('${encodeURIComponent(String(x.recordId||''))}'))">Hủy</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="10" class="text-muted py-4">Không có trường hợp đặc biệt trong khoảng đã chọn.</td></tr>';}catch(e){body.innerHTML=`<tr><td colspan="10" class="text-danger py-4">${escapeHtml(e.message||String(e))}</td></tr>`;}
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

/* ===== V69.5.3: RESET VỊ TRÍ CUỘN KHI MỞ QUẢN TRỊ =====
   Tránh giữ scrollTop từ tab dài trước đó làm người dùng thấy một vùng trắng lớn. */
document.addEventListener('DOMContentLoaded',function(){
  const adminTab=document.getElementById('admin-tab');
  if(adminTab)adminTab.addEventListener('shown.bs.tab',function(){
    requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));
  });
});

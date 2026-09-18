  /* ===== V69 GVCN: Supabase-first, rà soát + ký chốt ===== */
  let gvcnLastBookV681=null;
  let gvcnLastCloseV681=null;
  let gvcnLastLockV681=null;
  let gvcnLastValidationV7045=null;

  function gvcnCurrentWeekV681(){
    try{
      const start=new Date(START_DATE_WEEK1_STR+'T00:00:00');
      const now=new Date();now.setHours(0,0,0,0);
      return Math.max(1,Math.min(52,Math.floor((now-start)/86400000/7)+1));
    }catch(_e){return 1;}
  }
  function gvcnSignedV681(v){
    const s=normalizeTextKey(String(v||''));
    return !!String(v||'').trim() && !s.includes('chua ky') && !s.includes('chua xac nhan');
  }
  function gvcnSetBusyV681(on,text){
    const b=document.getElementById('gvcnLoadBtnV681');
    if(b){b.disabled=!!on;b.innerHTML=on?'<span class="spinner-border spinner-border-sm me-1"></span>'+(text||'Đang tải...'):'Tải dữ liệu tuần';}
  }
  function gvcnSetStateV681(text,state){
    const el=document.getElementById('gvcnWeekStateV681');if(!el)return;
    el.textContent=text||'Chưa tải dữ liệu';
    el.className='gvcn-week-state-v681 state-'+(state||'idle');
  }
  function gvcnWeekLabelV681(lockRes,chot){
    if(chot&&chot.success)return ['Đã ký chốt','closed'];
    const state=String(lockRes&&lockRes.state||'').toUpperCase();
    if(state==='TEMP_UNLOCK')return ['Đang mở tạm','warning'];
    if(state==='OVERDUE')return ['Tuần đã qua','warning'];
    if(lockRes&&lockRes.locked)return ['Đang khóa','danger'];
    return ['Đang mở','open'];
  }
  function gvcnXepLoaiV681(dtb){
    const n=Number(dtb)||0;return n>=8?'Loại A':(n>=6.5?'Loại B':'Loại C');
  }
  function gvcnSlotOrderV681(key){
    const p=String(key||'').split('_');
    const day={'Thứ 2':0,'Thứ 3':1,'Thứ 4':2,'Thứ 5':3,'Thứ 6':4,'Thứ 7':5,'Chủ Nhật':6}[p[0]]??9;
    const buoi=normalizeTextKey(p[1]).includes('chieu')?1:0;
    return day*100+buoi*20+(Number(p[2])||0);
  }
  function gvcnSlotLabelV681(key){
    const p=String(key||'').split('_');
    const buoi=normalizeTextKey(p[1]).includes('chieu')?'Chiều':'Sáng';
    return `${p[0]||''} · ${buoi} · Tiết ${p[2]||''}`;
  }
  function gvcnRenderDetailV681(res){
    const body=document.getElementById('gvcnDetailBodyV681');if(!body)return;
    const matrix=res&&res.matrix||{};
    const keys=Object.keys(matrix).filter(k=>{const c=matrix[k]||{};return !!(c.mon||c.tenBai||(Array.isArray(c.entries)&&c.entries.length));}).sort((a,b)=>gvcnSlotOrderV681(a)-gvcnSlotOrderV681(b));
    document.getElementById('gvcnDetailCountV681').textContent=keys.length?`${keys.length} tiết có dữ liệu`:'Chưa có tiết';
    if(!keys.length){body.innerHTML='<tr><td colspan="5" class="text-center text-muted py-4">Tuần này chưa có dữ liệu sổ đầu bài.</td></tr>';return;}
    body.innerHTML=keys.map(k=>{
      const c=matrix[k]||{},entries=Array.isArray(c.entries)&&c.entries.length?c.entries:[c];
      const signed=entries.every(e=>gvcnSignedV681(e.kySo||e.signatureUrl||c.kySo||c.signatureUrl));
      const mons=entries.map(e=>e.mon||'').filter(Boolean).join(' / ')||c.mon||'';
      const teachers=entries.map(e=>e.tenGV||'').filter(Boolean).join(' / ')||c.tenGV||'';
      const lessons=entries.map(e=>e.tenBai||'').filter(Boolean).join(' / ')||c.tenBai||'';
      const statusBadge=renderPeriodStatusBadgeV683(c);
      return `<tr class="${signed?'':'gvcn-row-unsigned-v681'}"><td class="fw-semibold text-nowrap">${escapeHtml(gvcnSlotLabelV681(k))}</td><td>${statusBadge}${escapeHtml(mons)}</td><td>${escapeHtml(teachers)}</td><td>${escapeHtml(lessons)}</td><td class="text-nowrap">${signed?'<span class="badge text-bg-success">Đã ký</span>':'<span class="badge text-bg-warning">Chưa ký</span>'}</td></tr>`;
    }).join('');
  }
  function gvcnRenderValidationV7045(v){
    gvcnLastValidationV7045=v&&v.success?v:null;
    const summary=document.getElementById('gvcnValidationSummaryV7045'),issues=document.getElementById('gvcnValidationIssuesV7045');
    const morning=document.getElementById('gvcnMorningV7045'),afternoon=document.getElementById('gvcnAfternoonV7045');
    if(!v||!v.success){if(summary){summary.className='alert alert-warning border py-2 mb-2';summary.textContent='Chưa có kết quả kiểm tra.';}if(issues)issues.innerHTML='';return;}
    if(morning)morning.textContent=`${Number(v.morning?.valid||0)}/${Number(v.morning?.expected||0)}`;
    if(afternoon)afternoon.textContent=`${Number(v.afternoon?.valid||0)}/${Number(v.afternoon?.expected||0)}`;
    const pass=String(v.status)==='PASS',fresh=!!v.storedFresh;
    if(summary){summary.className='alert '+(pass?(fresh?'alert-success':'alert-info'):'alert-warning')+' border py-2 mb-2';summary.innerHTML=pass?(fresh?`<b>ĐẠT</b> · ${v.validSlots}/${v.expectedSlots} ô hợp lệ · Đã kiểm tra ${escapeHtml(v.checkedAt||'')}`:`<b>Dữ liệu hiện tại đạt</b> ${v.validSlots}/${v.expectedSlots}, nhưng GVCN cần bấm <b>Kiểm tra sổ tuần</b> để xác nhận trước khi ký.`):`<b>CHƯA ĐẠT</b> · ${v.validSlots}/${v.expectedSlots} ô hợp lệ · ${v.blockingCount} lỗi chặn${v.warningCount?` · ${v.warningCount} cảnh báo`:''}.`;}
    const list=Array.isArray(v.issues)?v.issues:[];
    if(issues)issues.innerHTML=list.length?`<div class="vstack gap-1">${list.slice(0,20).map(x=>`<div class="border rounded px-2 py-1 ${x.severity==='BLOCKING'?'bg-danger-subtle':x.severity==='WARNING'?'bg-warning-subtle':'bg-light'}"><span class="fw-semibold">${x.severity==='BLOCKING'?'🔴':x.severity==='WARNING'?'🟠':'ℹ️'} ${escapeHtml(x.code||'')}</span> · ${escapeHtml(x.message||'')}</div>`).join('')}</div>${list.length>20?`<div class="text-muted mt-1">Còn ${list.length-20} mục khác.</div>`:''}`:'<div class="text-success fw-semibold">✓ Không có lỗi cần xử lý.</div>';
  }
  async function kiemTraSoTuanGVCNV7045(persist=true){
    if(!gvcnDangNhapInfo?.sessionToken)return;
    const lop=String(gvcnDangNhapInfo.lop||document.getElementById('gvcnAuthorizedClassV4')?.value||'').trim(),tuan=Number(document.getElementById('gvcnTuan')?.value||1),btn=document.getElementById('gvcnValidateBtnV7045'),old=btn?.textContent||'Kiểm tra sổ tuần';
    if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Đang kiểm tra...';}
    try{const v=await callSodbEdgeRpcV67('kiemTraSoTuanGVCNV7045',[lop,tuan,!!persist,{token:gvcnDangNhapInfo.sessionToken}]);if(!v?.success)throw new Error(v?.message||'Không kiểm tra được sổ tuần.');gvcnRenderValidationV7045(v);gvcnApplyValidatorCloseStateV7045();if(persist)showToastV9(v.status==='PASS'?'Sổ tuần đã đạt điều kiện kiểm tra.':`Còn ${v.blockingCount} lỗi chặn cần xử lý.`,v.status==='PASS'?'success':'warning');return v;}catch(e){showToastV9(e.message||String(e),'danger');return null;}finally{if(btn){btn.disabled=false;btn.textContent=old;}}
  }
  function gvcnApplyValidatorCloseStateV7045(){
    const btn=document.getElementById('gvcnCloseBtnV681'),hint=document.getElementById('gvcnCloseHintV681'),v=gvcnLastValidationV7045,chot=gvcnLastCloseV681;
    const canClose=!chot&&v&&v.status==='PASS'&&v.storedFresh===true;
    if(btn){btn.disabled=!canClose;btn.textContent=chot?'Đã ký chốt':canClose?'Ký chốt tuần':'Chưa đủ điều kiện';}
    if(hint){if(chot)hint.textContent='Tuần đã được GVCN ký chốt và khóa.';else if(!v)hint.textContent='Hãy tải dữ liệu và kiểm tra sổ tuần trước khi ký.';else if(v.configurationRequired)hint.textContent='Admin chưa cấu hình khung tiết Sáng/Chiều cho lớp này.';else if(v.status!=='PASS')hint.textContent=`Còn ${v.blockingCount} lỗi chặn; xử lý xong rồi kiểm tra lại.`;else if(!v.storedFresh)hint.textContent='Dữ liệu đạt nhưng cần bấm “Kiểm tra sổ tuần” để xác nhận kết quả hiện tại.';else hint.textContent='Kết quả kiểm tra PASS còn hiệu lực. Có thể ký chốt tuần.';}
  }

  function gvcnApplySummaryV681(payload,lockRes,validation){
    const res=payload&&payload.sodb?payload.sodb:payload;
    if(!res||!res.success)throw new Error((res&&res.message)||'Không tải được dữ liệu tuần.');
    gvcnLastBookV681=res;gvcnLastCloseV681=payload&&payload.chot&&payload.chot.success?payload.chot:null;gvcnLastLockV681=lockRes||null;
    const s=res.summary||{},total=Number(res.foundCount||0),unsigned=Number(s.soTietChuaKy||0),signed=Math.max(0,total-unsigned),pct=total?Math.round(signed*100/total):0;
    document.getElementById('gvcnTongTietV681').textContent=validation&&validation.success?`${Number(validation.accountedSlots||0)}/${Number(validation.expectedSlots||0)}`:String(total);
    document.getElementById('gvcnVangP').textContent=String(s.vangP??0);
    document.getElementById('gvcnVangKP').textContent=String(s.vangKP??0);
    document.getElementById('gvcnDTB').textContent=String(s.dtbTuan??'0.0');
    document.getElementById('gvcnXepLoaiV681').textContent=total?gvcnXepLoaiV681(s.dtbTuan):'Chưa có dữ liệu';
    document.getElementById('gvcnChuaKy').textContent=unsigned+' tiết';
    document.getElementById('gvcnMonChuaKyV681').textContent=unsigned?('Môn: '+String(s.monChuaKy||'Chưa xác định')):'Tất cả đã ký';
    const validatorPct=validation&&validation.success?Number(validation.completionPercent||0):pct;
    document.getElementById('gvcnProgressPctV681').textContent=validatorPct+'%';
    document.getElementById('gvcnProgressTextV681').textContent=validation&&validation.success?`Hợp lệ ${validation.validSlots}/${validation.expectedSlots} ô · Sáng ${validation.morning?.valid||0}/${validation.morning?.expected||0} · Chiều ${validation.afternoon?.valid||0}/${validation.afternoon?.expected||0}.`:(total?`Đã ký ${signed}/${total} tiết có dữ liệu.`:'Tuần này chưa có tiết được ghi.');
    const bar=document.getElementById('gvcnProgressBarV681');bar.style.width=validatorPct+'%';bar.className='progress-bar '+(validatorPct===100?'bg-success':'bg-warning');
    gvcnRenderDetailV681(res);
    const chot=gvcnLastCloseV681, yk=document.getElementById('gvcnYKien'), meta=document.getElementById('gvcnClosedMetaV681');
    if(chot){
      if(yk)yk.value=chot.ykien||'';
      if(meta)meta.textContent=`Đã ký chốt bởi ${chot.tenGVCN||'GVCN'}${chot.time?' · '+chot.time:''}`;
    }else if(meta)meta.textContent='';
    const state=gvcnWeekLabelV681(lockRes,chot);gvcnSetStateV681(state[0],state[1]);
    gvcnRenderValidationV7045(validation);
    gvcnApplyValidatorCloseStateV7045();
    document.getElementById('gvcnPlaceholderMsg').classList.add('d-none');
    document.getElementById('gvcnSummaryContent').classList.remove('d-none');
  }

  function populateGVCNFromUnifiedV4(res){
    gvcnDangNhapInfo=res;
    document.getElementById('gvcnMainContent').classList.remove('d-none');
    const name=res.tenGVCN||res.tenGV||'';
    const ds=(res.dsLop||[res.lop]).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i);
    if(!gvcnDangNhapInfo.lop&&ds.length)gvcnDangNhapInfo.lop=ds[0];
    const welcome=document.getElementById('gvcnWelcomeMsg');if(welcome)welcome.textContent=`${name?name+' · ':''}Theo dõi lớp chủ nhiệm trên Supabase`;
    const sel=document.getElementById('gvcnAuthorizedClassV4');
    if(sel){sel.innerHTML='';ds.forEach(l=>sel.add(new Option(l,l)));if(gvcnDangNhapInfo.lop)sel.value=gvcnDangNhapInfo.lop;sel.onchange=function(){gvcnDangNhapInfo.lop=this.value;document.getElementById('gvcnSummaryContent').classList.add('d-none');document.getElementById('gvcnPlaceholderMsg').classList.remove('d-none');taiThongTinChotTuan();};}
    const week=document.getElementById('gvcnTuan');if(week&&!Number(week.value))week.value=gvcnCurrentWeekV681();else if(week)week.value=gvcnCurrentWeekV681();
    urlGVCNGlobal=normalizeSignatureUrlV67_1(res.urlChuKy||'');
    const img=document.getElementById('gvcnSigImage'),ph=document.getElementById('gvcnSigPlaceholder'),del=document.getElementById('gvcnDeleteSigBtnV681');
    if(urlGVCNGlobal){if(img){setSignaturePreviewSrcV682(img,urlGVCNGlobal);img.classList.remove('d-none');}ph?.classList.add('d-none');del?.classList.remove('d-none');}
    else{if(img){img.removeAttribute('src');img.classList.add('d-none');}ph?.classList.remove('d-none');del?.classList.add('d-none');}
    Promise.resolve().then(()=>taiThongTinChotTuan());
  }

  function gvcnShiftWeekV681(delta){
    const el=document.getElementById('gvcnTuan');if(!el)return;
    el.value=String(Math.max(1,Math.min(52,(parseInt(el.value)||1)+Number(delta||0))));
    taiThongTinChotTuan();
  }

  async function taiThongTinChotTuan(){
    if(!gvcnDangNhapInfo||!gvcnDangNhapInfo.sessionToken)return;
    const lop=String(gvcnDangNhapInfo.lop||document.getElementById('gvcnAuthorizedClassV4')?.value||'').trim();
    const tuan=Math.max(1,Math.min(52,parseInt(document.getElementById('gvcnTuan')?.value)||1));
    if(!lop){showToastV9('Chưa xác định lớp chủ nhiệm.','danger');return;}
    gvcnSetBusyV681(true,'Đang tải');gvcnSetStateV681('Đang tải dữ liệu','idle');
    try{
      const auth={token:gvcnDangNhapInfo.sessionToken};
      const [payload,lockRes,validation]=await Promise.all([
        callSodbEdgeRpcV67('layTrangSoDauBaiV24',[lop,tuan,'LOP_CHINH',auth]),
        callSodbEdgeRpcV67('kiemTraTrangThaiKhoaTuan',[lop,tuan]),
        callSodbEdgeRpcV67('kiemTraSoTuanGVCNV7045',[lop,tuan,false,auth])
      ]);
      gvcnApplySummaryV681(payload,lockRes,validation);
    }catch(err){
      console.error('[GVCN V68.1]',err);gvcnSetStateV681('Không tải được dữ liệu','danger');
      showToastV9('Không tải được dữ liệu chủ nhiệm: '+(err&&err.message?err.message:err),'danger');
    }finally{gvcnSetBusyV681(false);}
  }

  function xuLyTaiAnhGVCN(event){
    const file=event?.target?.files?.[0];if(!file)return;
    if(!/^image\/(png|jpeg|webp)$/i.test(file.type||'')){showToastV9('Chỉ nhận ảnh PNG, JPG hoặc WEBP.','danger');return;}
    const status=document.getElementById('gvcnSigStatusV681');if(status)status.textContent='Đang xử lý ảnh chữ ký...';
    const reader=new FileReader();
    reader.onload=function(e){
      const tempImg=document.createElement('img');tempImg.src=e.target.result;
      tempImg.onload=function(){
        xoaNenAnhChuKy(tempImg,function(processedDataUrl){
          const img=document.getElementById('gvcnSigImage'),ph=document.getElementById('gvcnSigPlaceholder');if(img){setSignaturePreviewSrcV682(img,processedDataUrl);img.classList.remove('d-none');}ph?.classList.add('d-none');
          if(status)status.textContent='Đang lưu vào Supabase Storage...';
          google.script.run.withSuccessHandler(function(res){
            if(res&&res.success){
              urlGVCNGlobal=normalizeSignatureUrlV67_1(res.urlChuKy||'');if(img)setSignaturePreviewSrcV682(img,urlGVCNGlobal||processedDataUrl);
              if(gvcnDangNhapInfo)gvcnDangNhapInfo.urlChuKy=res.urlChuKy||'';
              const sess=currentUnifiedLoginV4?.sessions||{};if(sess.GVCN)sess.GVCN.urlChuKy=res.urlChuKy||'';if(sess.GVBM)sess.GVBM.urlChuKy=res.urlChuKy||'';
              document.getElementById('gvcnDeleteSigBtnV681')?.classList.remove('d-none');if(status)status.textContent='Đã lưu chữ ký trên Supabase.';showToastV9('Đã lưu chữ ký GVCN.','success');
            }else{if(status)status.textContent=(res&&res.message)||'Không lưu được chữ ký.';showToastV9((res&&res.message)||'Không lưu được chữ ký.','danger');}
          }).withFailureHandler(function(err){if(status)status.textContent='Không lưu được chữ ký.';showToastV9(err&&err.message?err.message:String(err),'danger');}).luuChuKyGiaoVienV21(processedDataUrl,{token:gvcnDangNhapInfo.sessionToken});
        });
      };
    };
    reader.readAsDataURL(file);event.target.value='';
  }

  async function xoaChuKyGvcnV681(){
    if(!gvcnDangNhapInfo?.sessionToken)return;
    const ok=await confirmV13('Xóa chữ ký đang lưu trên Supabase?',{title:'Xóa chữ ký GVCN',confirmText:'Xóa chữ ký',danger:true});if(!ok)return;
    const status=document.getElementById('gvcnSigStatusV681');if(status)status.textContent='Đang xóa...';
    google.script.run.withSuccessHandler(function(res){
      if(res&&res.success){urlGVCNGlobal='';gvcnDangNhapInfo.urlChuKy='';const img=document.getElementById('gvcnSigImage');if(img){img.removeAttribute('src');img.classList.add('d-none');}document.getElementById('gvcnSigPlaceholder')?.classList.remove('d-none');document.getElementById('gvcnDeleteSigBtnV681')?.classList.add('d-none');if(status)status.textContent='Đã xóa chữ ký.';showToastV9('Đã xóa chữ ký GVCN.','success');}
      else{if(status)status.textContent=(res&&res.message)||'Không xóa được chữ ký.';showToastV9((res&&res.message)||'Không xóa được chữ ký.','danger');}
    }).withFailureHandler(function(err){if(status)status.textContent='Không xóa được chữ ký.';showToastV9(err&&err.message?err.message:String(err),'danger');}).xoaChuKyGiaoVienV21({token:gvcnDangNhapInfo.sessionToken});
  }

  async function guiChotTuanGVCN(){
    if(!gvcnDangNhapInfo?.sessionToken)return;
    const v=gvcnLastValidationV7045;
    if(!v||v.status!=='PASS'){showToastV9('Sổ tuần chưa đạt kiểm tra. Hãy xử lý các lỗi chặn trước.','danger');return;}
    if(!v.storedFresh){showToastV9('Hãy bấm “Kiểm tra sổ tuần” ngay trước khi ký chốt.','warning');return;}
    if(gvcnLastCloseV681){showToastV9('Tuần này đã được ký chốt.','warning');return;}
    const ok=await confirmV13(`Xác nhận ký chốt lớp ${gvcnDangNhapInfo.lop} - Tuần ${document.getElementById('gvcnTuan').value}? Sau khi chốt, dữ liệu tuần sẽ bị khóa.`,{title:'Ký chốt tuần',confirmText:'Ký chốt',danger:false});if(!ok)return;
    const btn=document.getElementById('gvcnCloseBtnV681'),old=btn?.textContent||'Ký chốt tuần';if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Đang ký chốt...';}
    const payload={lop:gvcnDangNhapInfo.lop,tuan:Number(document.getElementById('gvcnTuan').value),ykien:document.getElementById('gvcnYKien').value,tenGVCN:gvcnDangNhapInfo.tenGVCN||''};
    google.script.run.withSuccessHandler(async function(r){
      if(r&&r.success){
        showToastV9(r.message||'Đã ký chốt tuần.','success');
        if(typeof invalidateBghWorkflowCacheV701==='function')invalidateBghWorkflowCacheV701();
        await taiThongTinChotTuan();
      }else{showToastV9((r&&r.message)||'Không ký chốt được.','danger');if(btn){btn.disabled=false;btn.textContent=old;}}
    }).withFailureHandler(function(err){showToastV9(err&&err.message?err.message:String(err),'danger');if(btn){btn.disabled=false;btn.textContent=old;}}).luuChotTuanGVCN(payload,{token:gvcnDangNhapInfo.sessionToken});
  }

  async function moSoTuGvcnV681(){
    if(!gvcnDangNhapInfo)return;
    const lop=String(gvcnDangNhapInfo.lop||''),tuan=Number(document.getElementById('gvcnTuan')?.value||1);
    try{
      const tabBtn=document.getElementById('view-tab');
      if(typeof showMainTabAndWaitV701==='function')await showMainTabAndWaitV701(tabBtn);
      else openTopTabV9('view-tab');
      if(typeof ensureViewClassReadyV701==='function')await ensureViewClassReadyV701(lop);
      else{
        const khoi=(lop.match(/^(10|11|12)/)||[])[1]||'';
        if(khoi){const k=document.getElementById('viewKhoi');if(k){k.value=khoi;chonKhoiLopView();}}
        const sel=document.getElementById('viewLop');if(sel){const norm=x=>String(x).replace(/([A-Z])0+(\d+)$/,'$1$2');const opt=[...sel.options].find(o=>norm(o.value)===norm(lop));if(opt)sel.value=opt.value;}
      }
      const mode=document.getElementById('viewBookMode');if(mode)mode.value='LOP_CHINH';
      const w=document.getElementById('viewTuan');if(w)w.value=String(tuan);
      await Promise.resolve(traCuuSoDauBaiTuanGop(true));
    }catch(err){showToastV9('Không mở được sổ lớp: '+(err&&err.message?err.message:err),'danger');}
  }




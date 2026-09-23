/* V70.4.6.26 - ADMIN STUDENT CRUD + TRANSFER CLASS */
(function(){
  'use strict';
  const state={rows:[],initialized:false,current:null,loading:false};
  const $=id=>document.getElementById(id);
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const auth=()=>typeof getAdminAuthV69==='function'?getAdminAuthV69():{token:(window.adminDangNhapInfo&&adminDangNhapInfo.sessionToken)||''};
  function toast(msg,type='info'){if(typeof showToastV9==='function')showToastV9(msg,type);else alert(msg);}
  function normalize(s){return String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');}
  function classes(){
    const out=[];
    try{['10','11','12'].forEach(k=>(window.dsLopChinhTheoKhoiV22?.[k]||dsLopChinhTheoKhoiV22?.[k]||[]).forEach(x=>out.push(String(x||'').trim())));}catch(_e){}
    return [...new Set(out.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi',{numeric:true}));
  }
  async function ensureClasses(force=false){
    let list=classes();
    if((force||!list.length)&&typeof callSodbEdgeRpcV67==='function'){
      try{const res=await callSodbEdgeRpcV67('getDanhSachLopMoiV29',[],20000);if(res?.success&&typeof applyClassCatalogV23==='function')applyClassCatalogV23(res);}catch(_e){}
      list=classes();
    }
    const sel=$('studentAdminClassV704625');if(!sel)return;
    const keep=sel.value;
    sel.innerHTML='<option value="">-- Chọn lớp --</option>'+list.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    if(keep&&list.includes(keep))sel.value=keep;
  }
  function render(){
    const body=$('studentAdminBodyV704625'),count=$('studentAdminCountV704625');if(!body)return;
    const q=normalize($('studentAdminSearchV704625')?.value||'');
    const rows=q?state.rows.filter(r=>normalize(`${r.maHs||''} ${r.hoTen||''}`).includes(q)):state.rows.slice();
    if(count)count.textContent=`${rows.length}/${state.rows.length} học sinh`;
    if(!rows.length){body.innerHTML='<tr><td colspan="5" class="text-center text-muted py-4">Không có học sinh phù hợp.</td></tr>';return;}
    body.innerHTML=rows.map((r,i)=>{
      const groups=Array.isArray(r.groups)&&r.groups.length?r.groups.join(', '):'—';
      return `<tr><td class="text-center">${i+1}</td><td><code>${esc(r.maHs||'')}</code></td><td class="fw-semibold">${esc(r.hoTen||'')}</td><td>${esc(groups)}</td><td class="text-nowrap"><button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="studentAdminEditV704625(decodeURIComponent('${encodeURIComponent(String(r.id||''))}'))">Sửa</button><button type="button" class="btn btn-sm btn-outline-warning me-1" onclick="studentAdminTransferV704626(decodeURIComponent('${encodeURIComponent(String(r.id||''))}'))">Chuyển lớp</button><button type="button" class="btn btn-sm btn-outline-danger" onclick="studentAdminDeleteV704625(decodeURIComponent('${encodeURIComponent(String(r.id||''))}'))">Xóa</button></td></tr>`;
    }).join('');
  }
  async function load(force=false){
    const lop=String($('studentAdminClassV704625')?.value||'').trim();
    const body=$('studentAdminBodyV704625'),status=$('studentAdminStatusV704625');
    if(!lop){state.rows=[];render();if(status)status.textContent='Chọn lớp để tải danh sách học sinh.';return;}
    if(state.loading&&!force)return;state.loading=true;
    if(body)body.innerHTML='<tr><td colspan="5" class="text-center text-muted py-4">Đang tải...</td></tr>';
    try{
      const res=await callSodbEdgeRpcV67('adminDanhSachHocSinhV704625',[lop,auth()],20000);
      if(!res?.success)throw new Error(res?.message||'Không tải được danh sách học sinh.');
      state.rows=Array.isArray(res.data)?res.data:[];render();
      if(status)status.textContent=`Năm học ${res.namHoc||''} · Lớp ${lop} · ${state.rows.length} học sinh đang học.`;
    }catch(e){state.rows=[];render();if(status)status.textContent='Không tải được danh sách.';toast((e&&e.message)||String(e),'danger');}
    finally{state.loading=false;}
  }
  async function init(force=false){
    if(!auth().token)return;
    if(!state.initialized||force){await ensureClasses(force);state.initialized=true;}
    const sel=$('studentAdminClassV704625');if(sel?.value)await load(force);
  }
  function openAdd(){
    const lop=String($('studentAdminClassV704625')?.value||'').trim();if(!lop){toast('Vui lòng chọn lớp trước khi thêm học sinh.','warning');return;}
    state.current=null;
    $('studentAdminModalTitleV704625').textContent='Thêm học sinh';
    $('studentAdminEditIdV704625').value='';$('studentAdminEditClassV704625').value=lop;$('studentAdminEditCodeV704625').value='';$('studentAdminEditCodeV704625').readOnly=false;$('studentAdminEditNameV704625').value='';
    $('studentAdminModalHelpV704625').textContent='Mã HS có thể để trống để hệ thống tự tạo.';
    bootstrap.Modal.getOrCreateInstance($('modalAdminStudentV704625')).show();setTimeout(()=>$('studentAdminEditNameV704625')?.focus(),180);
  }
  function openEdit(id){
    const r=state.rows.find(x=>String(x.id)===String(id));if(!r){toast('Không tìm thấy học sinh trong danh sách hiện tại.','warning');return;}
    state.current=r;
    $('studentAdminModalTitleV704625').textContent='Sửa học sinh';
    $('studentAdminEditIdV704625').value=r.id||'';$('studentAdminEditClassV704625').value=r.lop||$('studentAdminClassV704625').value;$('studentAdminEditCodeV704625').value=r.maHs||'';$('studentAdminEditCodeV704625').readOnly=true;$('studentAdminEditNameV704625').value=r.hoTen||'';
    $('studentAdminModalHelpV704625').textContent='Mã HS được khóa để bảo toàn liên kết điểm danh và nhóm GDTC/Chuyên đề.';
    bootstrap.Modal.getOrCreateInstance($('modalAdminStudentV704625')).show();setTimeout(()=>$('studentAdminEditNameV704625')?.focus(),180);
  }
  function localIsoDateV704626(){
    const d=new Date(),off=d.getTimezoneOffset()*60000;return new Date(d.getTime()-off).toISOString().slice(0,10);
  }
  function sameGradeV704626(a,b){const ma=String(a||'').match(/^(10|11|12)/),mb=String(b||'').match(/^(10|11|12)/);return !!(ma&&mb&&ma[1]===mb[1]);}
  function openTransfer(id){
    const r=state.rows.find(x=>String(x.id)===String(id));if(!r){toast('Không tìm thấy học sinh trong danh sách hiện tại.','warning');return;}
    state.current=r;
    $('studentTransferIdV704626').value=r.id||'';$('studentTransferNameV704626').value=r.hoTen||'';$('studentTransferCodeV704626').value=r.maHs||'';$('studentTransferFromV704626').value=r.lop||'';
    const target=$('studentTransferToV704626'),list=classes().filter(x=>x!==r.lop&&sameGradeV704626(x,r.lop));
    target.innerHTML='<option value="">-- Chọn lớp mới cùng khối --</option>'+list.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    $('studentTransferDateV704626').value=localIsoDateV704626();$('studentTransferKeepGroupsV704626').checked=false;$('studentTransferReasonV704626').value='';
    bootstrap.Modal.getOrCreateInstance($('modalAdminStudentTransferV704626')).show();setTimeout(()=>$('studentTransferToV704626')?.focus(),180);
  }
  async function saveTransfer(){
    const id=String($('studentTransferIdV704626')?.value||'').trim(),targetClass=String($('studentTransferToV704626')?.value||'').trim(),transferDate=String($('studentTransferDateV704626')?.value||'').trim(),reason=String($('studentTransferReasonV704626')?.value||'').trim(),keepGroups=!!$('studentTransferKeepGroupsV704626')?.checked;
    const r=state.rows.find(x=>String(x.id)===id)||state.current;if(!r){toast('Không tìm thấy học sinh cần chuyển lớp.','warning');return;}
    if(!targetClass||!transferDate||!reason){toast('Cần chọn lớp mới, ngày chuyển lớp và nhập lý do.','warning');return;}
    if(!sameGradeV704626(r.lop,targetClass)){toast('Chức năng chuyển lớp chỉ cho phép chuyển trong cùng khối.','warning');return;}
    let ok=true;const groupText=keepGroups?'Giữ nguyên các nhóm GDTC/Chuyên đề và đổi lớp chủ nhiệm sang lớp mới.':'Ngừng các nhóm GDTC/Chuyên đề hiện tại để phân nhóm lại.';
    if(typeof confirmV13==='function')ok=await confirmV13(`Chuyển ${r.hoTen} (${r.maHs}) từ ${r.lop} sang ${targetClass} từ ngày ${transferDate}?\n\n${groupText}\n\nLịch sử lớp cũ sẽ được giữ nguyên.`,{title:'Xác nhận chuyển lớp',confirmText:'Chuyển lớp',danger:false});else ok=confirm(`Chuyển ${r.hoTen} từ ${r.lop} sang ${targetClass}?`);if(!ok)return;
    const btn=$('btnStudentTransferV704626');if(btn)btn.disabled=true;
    try{
      const res=await callSodbEdgeRpcV67('adminChuyenLopHocSinhV704626',[{id,targetClass,transferDate,keepGroups,reason},auth()],30000);if(!res?.success)throw new Error(res?.message||'Không chuyển được lớp.');
      invalidate();bootstrap.Modal.getOrCreateInstance($('modalAdminStudentTransferV704626')).hide();toast(res.message||'Đã chuyển lớp học sinh.','success');await load(true);
    }catch(e){toast((e&&e.message)||String(e),'danger');}finally{if(btn)btn.disabled=false;}
  }
  function invalidate(){
    try{if(window.sodbViewCacheV6?.clear)sodbViewCacheV6.clear();}catch(_e){}
    try{sessionStorage.removeItem('SODB_V6_BOOTSTRAP');if(typeof bootstrapCacheKeyV62==='function')sessionStorage.removeItem(bootstrapCacheKeyV62());}catch(_e){}
  }
  async function save(){
    const id=String($('studentAdminEditIdV704625')?.value||'').trim(),lop=String($('studentAdminEditClassV704625')?.value||'').trim(),maHs=String($('studentAdminEditCodeV704625')?.value||'').trim(),hoTen=String($('studentAdminEditNameV704625')?.value||'').trim();
    if(!lop||!hoTen){toast('Cần có Lớp và Họ tên học sinh.','warning');return;}
    const btn=$('btnAdminStudentSaveV704625');if(btn)btn.disabled=true;
    try{
      const method=id?'adminSuaHocSinhV704625':'adminThemHocSinhV704625',payload=id?{id,hoTen}:{lop,maHs,hoTen};
      const res=await callSodbEdgeRpcV67(method,[payload,auth()],20000);if(!res?.success)throw new Error(res?.message||'Không lưu được học sinh.');
      invalidate();bootstrap.Modal.getOrCreateInstance($('modalAdminStudentV704625')).hide();toast(res.message||'Đã lưu học sinh.','success');await load(true);
    }catch(e){toast((e&&e.message)||String(e),'danger');}finally{if(btn)btn.disabled=false;}
  }
  async function remove(id){
    const r=state.rows.find(x=>String(x.id)===String(id));if(!r){toast('Không tìm thấy học sinh.','warning');return;}
    let ok=true;if(typeof confirmV13==='function')ok=await confirmV13(`Xóa ${r.hoTen} (${r.maHs}) khỏi danh sách đang học của lớp ${r.lop}?\n\nDữ liệu lịch sử điểm danh vẫn được giữ. Các nhóm GDTC/Chuyên đề đang hoạt động của học sinh này sẽ được ngừng.`,{title:'Xóa học sinh',confirmText:'Xóa khỏi danh sách',danger:true});else ok=confirm(`Xóa ${r.hoTen}?`);if(!ok)return;
    try{const res=await callSodbEdgeRpcV67('adminXoaHocSinhV704625',[{id:r.id},auth()],20000);if(!res?.success)throw new Error(res?.message||'Không xóa được học sinh.');invalidate();toast(res.message||'Đã xóa học sinh khỏi danh sách đang học.','success');await load(true);}catch(e){toast((e&&e.message)||String(e),'danger');}
  }
  window.studentAdminInitV704625=init;
  window.studentAdminLoadV704625=load;
  window.studentAdminRenderV704625=render;
  window.studentAdminAddV704625=openAdd;
  window.studentAdminEditV704625=openEdit;
  window.studentAdminSaveV704625=save;
  window.studentAdminDeleteV704625=remove;
  window.studentAdminTransferV704626=openTransfer;
  window.studentAdminTransferSaveV704626=saveTransfer;
})();

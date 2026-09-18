'use strict';
(()=>{
 const $=id=>document.getElementById(id);let session=null,home=null,rosterReady=false,seq=0,busy=false,requestId=null,khbd={mode:"NONE",lessons:[]};
 try{session=JSON.parse(sessionStorage.getItem('sodbPartnerV7044')||'null');}catch{}
 const message=(s)=>{$('message').textContent=String(s||'');};
 const auth=()=>({token:session?.sessionToken||''});
 async function rpc(name,args=[]){const r=await callSodbEdgeRpcV67(name,[...args,auth()]);if(!r?.success)throw new Error(r?.message||'Không thực hiện được yêu cầu.');return r;}
 function saveEnabled(){$('save').disabled=busy||!rosterReady||!home?.hasSignature||!$('task').value||(khbd.mode==='REQUIRED'&&!$('khbd').value);}
 function clearSession(){session=null;sessionStorage.removeItem('sodbPartnerV7044');$('portal').hidden=true;$('logout').hidden=true;$('loginCard').hidden=false;$('lessonForm').reset();$('roster').replaceChildren();home=null;rosterReady=false;seq++;}
 async function load(){
  rosterReady=false;saveEnabled();const r=await rpc('partnerHomeV7044');home=r;
  $('loginCard').hidden=true;$('portal').hidden=false;$('logout').hidden=false;
  $('teacher').textContent=r.staff.hoTen;$('program').textContent=`${r.staff.chuongTrinh} · ${r.staff.donVi}`;
  $('scope').textContent=`Hiệu lực: ${r.staff.tuNgay} – ${r.staff.denNgay} · Lớp: ${r.staff.phamViLop.join(', ')} · Môn: ${r.staff.phamViMon.join(', ')}`;
  $('signatureStatus').textContent=r.hasSignature?'Đã lưu chữ ký cá nhân.':'Chưa có chữ ký. Vui lòng tải lên trước khi ký tiết.';
  $('signaturePreview').hidden=!r.signatureUrl;if(r.signatureUrl)$('signaturePreview').src=r.signatureUrl;
  const old=$('task').value;$('task').replaceChildren(new Option('Chọn tiết được phân công',''));
  $('history').replaceChildren();let done=0;
  for(const t of r.tasks){const label=`${t.ngayThucHien} · ${t.lopThucHien} · ${t.buoiThucHien} tiết ${t.tietThucHien} · ${t.monThucHien}`;
   if(t.trangThai==='DA_DUYET'){$('task').add(new Option(label,t.id));}else{const line=document.createElement('p');line.textContent=`✓ ${label} · ${t.completedAt||''} · ${t.sodbRecordId||''}`;$('history').append(line);done++;}}
  if(!done)$('history').textContent='Chưa có tiết đã ký.';
  if([...$('task').options].some(o=>o.value===old))$('task').value=old;
  await selectTask();
 }
 async function selectTask(){
  const n=++seq;rosterReady=false;requestId=null;saveEnabled();$('attendanceChecked').checked=false;$('roster').replaceChildren();khbd={mode:'NONE',lessons:[]};$('khbdPanel').hidden=true;$('khbdHint').textContent='';$('khbd').replaceChildren(new Option('Nhập nội dung thực tế',''));for(const id of ['title','ppct','requirements']){$(id).value='';$(id).readOnly=false;}
  const t=home?.tasks.find(t=>t.id===$('task').value);$('taskInfo').textContent=t?`Hồ sơ ${t.maHoSo} · ${t.lyDo||''}`:'';
  if(!t){$('rosterStatus').textContent='Chọn tiết để tải danh sách lớp.';return;}
  $('rosterStatus').textContent='Đang tải danh sách học sinh…';
  try{const r=await rpc('partnerRosterV7044',[t.id]);if(n!==seq)return;
   khbd=r.khbd||{mode:'NONE',lessons:[]};$('khbdPanel').hidden=khbd.mode==='NONE';$('khbd').required=khbd.mode==='REQUIRED';$('khbd').options[0].textContent=khbd.mode==='REQUIRED'?'Chọn bài KHBD bắt buộc':'Nhập nội dung thực tế';for(const lesson of khbd.lessons)$('khbd').add(new Option(`${lesson.ppct||''} · ${lesson.title}`,lesson.id));$('khbdHint').textContent=khbd.mode==='REQUIRED'?(khbd.lessons.length?'Chương trình yêu cầu chọn bài từ KHBD đã duyệt.':'Chưa có bài KHBD đã duyệt cho tiết này. Vui lòng liên hệ nhà trường.'):(khbd.mode==='NONE'?'Chương trình không dùng KHBD; nhập nội dung thực tế.':'Có thể chọn bài KHBD đã duyệt hoặc nhập nội dung thực tế.');
   for(const x of r.data||[]){const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.value=x.maHS;label.append(input,document.createTextNode(x.hoTen));$('roster').append(label);}
   rosterReady=true;$('rosterStatus').textContent=r.data?.length?`${r.data.length} học sinh · Tích chọn học sinh vắng.`:'Lớp chưa có danh sách học sinh. Chỉ xác nhận nếu lớp đủ; liên hệ nhà trường để bổ sung danh sách khi có học sinh vắng.';
  }catch(e){if(n===seq)$('rosterStatus').textContent=e.message;}finally{if(n===seq)saveEnabled();}
 }
 $('loginForm').onsubmit=async ev=>{ev.preventDefault();const btn=ev.submitter;btn.disabled=true;try{const r=await callSodbEdgeV66({action:'login',account:$('account').value.trim(),password:$('password').value});$('password').value='';if(!r.partner||!r.sessions?.PARTNER)throw new Error('Tài khoản này dùng cổng cán bộ, giáo viên nhà trường.');session=r.sessions.PARTNER;sessionStorage.setItem('sodbPartnerV7044',JSON.stringify(session));await load();message('');}catch(e){message(e.message);}finally{btn.disabled=false;}};
 $('task').onchange=selectTask;
 $('khbd').onchange=()=>{const lesson=khbd.lessons.find(x=>x.id===$('khbd').value);for(const [id,key] of [['title','title'],['ppct','ppct'],['requirements','requirements']]){$(id).readOnly=!!lesson;$(id).value=lesson?.[key]||'';}saveEnabled();};
 $('refresh').onclick=()=>load().catch(e=>message(e.message));
 $('lessonForm').onsubmit=async ev=>{
  ev.preventDefault();if(busy||!rosterReady||!home?.hasSignature)return;
  if(!window.confirm('Xác nhận lưu nội dung và ký tiết được phân công bằng chữ ký cá nhân?'))return;
  busy=true;saveEnabled();$('task').disabled=true;$('refresh').disabled=true;
  requestId=requestId||crypto.randomUUID();const absent=[...$('roster').querySelectorAll('input:checked')].map(x=>x.value);
  try{const r=await rpc('partnerSaveV7044',[{operationId:$('task').value,khbdId:$('khbd').value,clientRequestId:requestId,tenBaiDay:$('title').value,tietCT:$('ppct').value,yeuCauCanDat:$('requirements').value,diemHocTap:Number($('learning').value),diemKyLuat:Number($('discipline').value),diemNeNep:Number($('order').value),nhanXet:$('remarks').value,attendanceComplete:!absent.length,absentStudentIds:absent}]);
   requestId=null;$('lessonForm').reset();await load();message(r.message||'Đã lưu và ký tiết.');
  }catch(e){message(e.message+' Nếu mất kết nối, bấm lưu lại để kiểm tra yêu cầu cũ.');}
  finally{busy=false;$('task').disabled=false;$('refresh').disabled=false;saveEnabled();}
 };
 $('uploadSignature').onclick=async()=>{const file=$('signatureFile').files[0];if(!file||!['image/png','image/jpeg'].includes(file.type)||file.size>2*1024*1024){message('Chọn ảnh PNG/JPG không quá 2 MB.');return;}const btn=$('uploadSignature');btn.disabled=true;try{const data=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(file);});await rpc('luuChuKyGiaoVienV21',[data]);await load();message('Đã lưu chữ ký.');}catch(e){message(e.message);}finally{btn.disabled=false;}};
 $('passwordForm').onsubmit=async ev=>{ev.preventDefault();ev.submitter.disabled=true;try{const r=await rpc('doiMatKhauTaiKhoanV6853',[$('oldPassword').value,$('newPassword').value]);$('passwordForm').reset();clearSession();message(r.message);}catch(e){message(e.message);}finally{ev.submitter.disabled=false;}};
 $('logout').onclick=async()=>{try{await rpc('dangXuatHeThongV701');}catch(e){message(e.message);}finally{clearSession();}};
 if(session?.sessionToken)load().catch(e=>{clearSession();message(e.message);});
})();

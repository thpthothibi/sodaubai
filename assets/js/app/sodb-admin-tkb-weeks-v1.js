// Admin controls only; the server independently authorizes every read/write.
(function(){
  'use strict';
  const el=id=>document.getElementById(id);
  const state={loaded:false,busy:false,schoolYear:'',expectedValue:null,currentWeek:0,seq:0};
  function token(){return typeof adminDangNhapInfo!=='undefined'?String(adminDangNhapInfo?.sessionToken||''):'';}
  function status(message,error=false){const box=el('adminTkbStatusV1');if(box){box.textContent=message;box.className='small mt-3 '+(error?'text-danger':'text-muted');}}
  function selected(){return [...document.querySelectorAll('#adminTkbWeeksV1 input:checked')].map(cb=>Number(cb.value));}
  function lock(){
    el('adminTkbWeeksFieldsetV1').disabled=state.busy||!state.loaded;
    for(const id of ['adminTkbSaveV1','adminTkbClearV1','adminTkbCurrentV1'])el(id).disabled=state.busy||!state.loaded;
    el('adminTkbReloadV1').disabled=state.busy;
    el('adminTkbSaveV1').textContent=state.busy?'Đang xử lý…':'Lưu các tuần đã chọn';
  }
  function render(r){
    if(!Array.isArray(r.weeks)||typeof r.schoolYear!=='string'||(r.expectedValue!==null&&typeof r.expectedValue!=='string'))throw new Error('Máy chủ chưa trả cấu hình hợp lệ. Kiểm tra bản cập nhật Supabase.');
    state.schoolYear=r.schoolYear;state.expectedValue=r.expectedValue;state.currentWeek=Number(r.currentWeek||state.currentWeek);state.loaded=true;
    el('adminTkbYearV1').textContent='Năm học '+r.schoolYear;
    const weeks=new Set(r.weeks);
    el('adminTkbWeeksV1').innerHTML=Array.from({length:53},(_,i)=>{const w=i+1;return `<label class="border rounded p-2 d-flex gap-2 align-items-center bg-light" style="cursor:pointer" for="adminTkbWeekV1-${w}"><input type="checkbox" class="form-check-input m-0" id="adminTkbWeekV1-${w}" value="${w}" ${weeks.has(w)?'checked':''}><span>Tuần ${w}</span></label>`;}).join('');
    el('adminTkbReasonV1').value=r.reason||'';
    const when=r.updatedAt?new Date(r.updatedAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'';
    status((r.message||(r.weeks.length?'Đang miễn tuần '+r.weeks.join(', ')+'.':'Chưa chọn tuần miễn; tuần 7 trở đi vẫn kiểm tra TKB.'))+(when?' Lưu gần nhất: '+when+(r.updatedBy?' · '+r.updatedBy:'')+'.':'')+(r.auditWarning?' '+r.auditWarning:''),!!r.auditWarning);
  }
  async function load(){
    if(state.busy)return;
    const authToken=token();if(!authToken){state.loaded=false;status('Đăng nhập bằng tài khoản quản trị để cấu hình.',true);lock();return;}
    const request=++state.seq;state.busy=true;lock();status('Đang tải cấu hình từ máy chủ…');
    try{
      const r=await callSodbEdgeRpcV67('layMienKiemTraTkbTheoTuanV1',[{token:authToken}]);
      if(request!==state.seq||authToken!==token()){state.loaded=false;return;}
      if(!r?.success)throw new Error(r?.message||'Không tải được cấu hình. Hãy cập nhật Edge Function trước.');
      render(r);
    }catch(e){state.loaded=false;status(e.message||String(e),true);}
    finally{if(request===state.seq){state.busy=false;lock();}}
  }
  async function save(){
    if(state.busy||!state.loaded)return;
    const authToken=token();if(!authToken){state.loaded=false;lock();return;}
    const payload={schoolYear:state.schoolYear,weeks:selected(),reason:el('adminTkbReasonV1').value.trim(),expectedValue:state.expectedValue};
    const request=++state.seq;state.busy=true;lock();status('Đang lưu các tuần đã chọn…');
    try{
      const r=await callSodbEdgeRpcV67('luuMienKiemTraTkbTheoTuanV1',[payload,{token:authToken}]);
      if(request!==state.seq||authToken!==token()){state.loaded=false;return;}
      if(!r?.success){if(r?.conflict)state.loaded=false;throw new Error(r?.message||'Không lưu được cấu hình.');}
      render(r);
    }catch(e){status(e.message||String(e),true);}
    finally{if(request===state.seq){state.busy=false;lock();}}
  }
  function pending(){const weeks=selected();status('Chưa lưu: '+(weeks.length?'miễn tuần '+weeks.join(', '):'bật lại kiểm tra TKB từ tuần 7')+'. Bấm Lưu để áp dụng.');}
  function init(){
    if(!el('adminTkbExemptionCardV1'))return;
    el('adminTkbReloadV1').addEventListener('click',load);
    el('adminTkbSaveV1').addEventListener('click',save);
    el('adminTkbWeeksV1').addEventListener('change',pending);
    el('adminTkbReasonV1').addEventListener('input',pending);
    el('adminTkbClearV1').addEventListener('click',()=>{document.querySelectorAll('#adminTkbWeeksV1 input').forEach(cb=>{cb.checked=false;});pending();});
    el('adminTkbCurrentV1').addEventListener('click',()=>{const cb=el('adminTkbWeekV1-'+state.currentWeek);if(cb){cb.checked=true;pending();}});
    const tab=el('pills-unlock-tab');
    if(tab){tab.addEventListener('click',()=>{if(!state.loaded)load();});tab.addEventListener('shown.bs.tab',()=>{if(!state.loaded&&!state.busy)load();});}
    lock();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

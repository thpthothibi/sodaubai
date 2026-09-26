/* V70.4.6.49.3: teaching mode + explicit week selector and draggable BGH stamp positioner. */
'use strict';
function teachingModeFromDateV704649(value){
  const raw=String(value||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return '';
  const day=new Date(raw+'T12:00:00').getDay();
  return day===0||day===6?'Trực tuyến':'Trực tiếp';
}
function teachingPublicClientV704649(r={}) {
  const inferred=!r.hinhThucDay,mode=r.hinhThucDay||teachingModeFromDateV704649(r.ngayDay||r.ngay||r.ngay_day)||'';
  return {hinhThucDay:mode,nenTangDay:mode==='Trực tuyến'?(r.nenTangDay||''):'',linkPhongHoc:mode==='Trực tuyến'?(r.linkPhongHoc||''):'',hinhThucSuyDien:!!r.hinhThucSuyDien||inferred};
}
function teachingFieldV704649(r={},field) {
  let text=String(r[field]||'');
  if(r.hinhThucDay!=='Trực tuyến')return text;
  if(field==='mon'&&text&&!/^Online\s*[-–:]/i.test(text))return 'Online - '+text;
  if(field==='nhanXet'&&r.nenTangDay){const tag='['+r.nenTangDay+']';if(!text.includes(tag))text=(text?text+' ':'')+tag;}
  return text;
}
function teachingFormV704649(){
  const mode=document.querySelector('input[name="hinhThucDayV49"]:checked')?.value||'Trực tiếp';
  return {hinhThucDay:mode,nenTangDay:mode==='Trực tuyến'?document.getElementById('onlinePlatformV49').value:'',linkPhongHoc:mode==='Trực tuyến'?document.getElementById('onlineLinkV49').value.trim():''};
}
function teachingToggleV704649(){
  const online=teachingFormV704649().hinhThucDay==='Trực tuyến';
  document.getElementById('onlineDetailsV49').hidden=!online;
  document.getElementById('onlineLinkV49').disabled=!online;
}
function teachingLoadV704649(r,fromSuggestion=false){
  if(!fromSuggestion)++teachingSuggestRequestV49;
  const mode=r.hinhThucDay||teachingModeFromDateV704649(r.ngayDay||r.ngay||r.ngay_day||document.getElementById('ngayDay')?.value)||'Trực tiếp';
  document.querySelectorAll('input[name="hinhThucDayV49"]').forEach(e=>e.checked=e.value===mode);
  document.getElementById('onlinePlatformV49').value=r.nenTangDay||'';
  document.getElementById('onlineLinkV49').value=r.linkPhongHoc||'';
  document.getElementById('teachingHintV49').textContent=r.hinhThucSuyDien?'Tiết cũ: hình thức được hiển thị theo quy tắc ngày dạy.':'';
  teachingToggleV704649();
}
let teachingSuggestRequestV49=0,teachingModeManualV49=false,teachingLastDateV49='';
async function teachingSuggestV704649(forceDateDefault=false){
  const ticket=++teachingSuggestRequestV49;
  if(typeof editingRecordIdV4!=='undefined'&&editingRecordIdV4)return;
  const $=id=>document.getElementById(id),date=String($('ngayDay')?.value||''),day=new Date(date+'T12:00:00').getDay();
  const dateChanged=date!==teachingLastDateV49;
  if(forceDateDefault||dateChanged)teachingModeManualV49=false;
  teachingLastDateV49=date;
  const automaticOnline=day===0||day===6;
  if(!teachingModeManualV49)teachingLoadV704649({hinhThucDay:automaticOnline?'Trực tuyến':'Trực tiếp'},true);
  const online=teachingFormV704649().hinhThucDay==='Trực tuyến';
  if(!online)return;
  $('teachingHintV49').textContent=automaticOnline?'Gợi ý ngày Thứ 7/Chủ Nhật: trực tuyến. Giáo viên vẫn có thể đổi theo thực tế.':'Đã chọn trực tuyến. Giáo viên có thể đổi lại Trực tiếp theo thực tế.';
  try{
    const token=typeof gvbmDangNhapInfo!=='undefined'?gvbmDangNhapInfo?.sessionToken:'';
    if(!token)return;
    const r=await callSodbEdgeRpcV67('teachingDefaultV704649',[{lop:$('lop').value},{token}],12000);
    if(ticket!==teachingSuggestRequestV49||teachingFormV704649().hinhThucDay!=='Trực tuyến')return;
    if(r?.success&&r.data){$('onlinePlatformV49').value=r.data.nen_tang_day||'';$('onlineLinkV49').value=r.data.link_phong_hoc||'';}
  }catch(_e){/* Missing optional suggestion never blocks entry. */}
}
function stampPositionNumberV493(value,fallback){
  const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):fallback;
}
function stampHtmlV704649(approval){
  if(!approval?.success||approval.dataChanged||!approval.stampUrl)return '';
  const x=stampPositionNumberV493(approval.stampX,40),y=stampPositionNumberV493(approval.stampY,100);
  return `<img src="${escapeHtml(approval.stampUrl)}" alt="Dấu nhà trường" class="school-stamp-v49" style="position:absolute;width:12mm;height:12mm;object-fit:contain;left:${x}%;top:${y}%;transform:translate(-50%,-50%);max-width:none;max-height:none;filter:none;pointer-events:none">`;
}
let stampApprovalStateV493=null,stampPositionStateV493={x:40,y:100},stampObjectUrlV493='';
function stampSelectedTargetV493(){
  return {lop:String(document.getElementById('stampClassV493')?.value||'').trim(),tuan:Number(document.getElementById('stampWeekV493')?.value||0)};
}
function stampSignatureUrlV493(raw){
  const value=String(raw||'').trim();if(!value)return '';
  if(value.startsWith('IMAGE:'))return value.slice(6);
  try{return typeof normalizeSignatureUrlV67_1==='function'?normalizeSignatureUrlV67_1(value):value;}catch(_e){return value;}
}
function stampClassChoicesV493(){
  const out=[];const add=v=>{v=String(v||'').trim();if(v&&!out.includes(v))out.push(v);};
  try{['10','11','12'].forEach(k=>(dsLopTheoKhoi?.[k]||[]).forEach(add));}catch(_e){}
  document.querySelectorAll('#viewLop option').forEach(o=>add(o.value));
  add(document.getElementById('complianceClassV49')?.value);
  return out.sort((a,b)=>a.localeCompare(b,'vi',{numeric:true}));
}
function stampRefreshClassOptionsV493(){
  const sel=document.getElementById('stampClassV493');if(!sel)return;
  const current=sel.value||document.getElementById('viewLop')?.value||document.getElementById('complianceClassV49')?.value||'';
  const values=stampClassChoicesV493();sel.innerHTML='<option value="">-- Chọn lớp / nhóm --</option>'+values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  if(current&&values.includes(current))sel.value=current;
}
function stampFillWeeksV493(){
  const sel=document.getElementById('stampWeekV493');if(!sel||sel.options.length>1)return;
  for(let i=1;i<=53;i++)sel.add(new Option('Tuần '+i,String(i)));
  const current=String(document.getElementById('viewTuan')?.value||'');if(current&&Number(current)>=1&&Number(current)<=53)sel.value=current;
}
function stampSetPositionV493(x,y){
  stampPositionStateV493={x:stampPositionNumberV493(x,40),y:stampPositionNumberV493(y,100)};
  const img=document.getElementById('stampDragV493');if(img){img.style.left=stampPositionStateV493.x+'%';img.style.top=stampPositionStateV493.y+'%';}
  const label=document.getElementById('stampPositionV493');if(label)label.textContent=`Vị trí: X ${stampPositionStateV493.x.toFixed(1)}% · Y ${stampPositionStateV493.y.toFixed(1)}%`;
}
function stampResetPositionV493(){stampSetPositionV493(40,100);}
function stampCurrentSealSrcV493(){
  if(stampObjectUrlV493)return stampObjectUrlV493;
  return stampApprovalStateV493?.approval?.stampUrl||'';
}
function stampRenderEditorV493(){
  const box=document.getElementById('stampEditorV493'),sig=document.getElementById('stampBghSignatureV493'),none=document.getElementById('stampNoSignatureV493'),name=document.getElementById('stampBghNameV493'),seal=document.getElementById('stampDragV493'),apply=document.getElementById('stampApplyBtnV493');
  const a=stampApprovalStateV493?.approval;if(!box||!sig||!none||!name||!seal||!apply)return;
  if(!a){box.classList.add('d-none');apply.disabled=true;return;}
  box.classList.remove('d-none');const sigUrl=stampSignatureUrlV493(a.chuKyBGH||a.kySo||a.signatureRef||'');
  if(sigUrl){sig.src=sigUrl;sig.hidden=false;none.hidden=true;}else{sig.removeAttribute('src');sig.hidden=true;none.hidden=false;}
  name.textContent=a.tenBGH||'';
  const sealSrc=stampCurrentSealSrcV493();if(sealSrc){seal.src=sealSrc;seal.hidden=false;}else{seal.removeAttribute('src');seal.hidden=true;}
  const valid=!!a.success&&!a.dataChanged&&['ĐÃ DUYỆT','DA_DUYET'].includes(String(a.trangThai||'').toUpperCase());
  apply.disabled=!valid||!sealSrc;stampSetPositionV493(stampPositionStateV493.x,stampPositionStateV493.y);
}
function stampTargetChangedV493(){
  stampApprovalStateV493=null;stampSetPositionV493(40,100);stampRenderEditorV493();
  const status=document.getElementById('stampStatusV49');if(status)status.textContent='Chọn lớp/nhóm, tuần rồi bấm “Tải chữ ký BGH để đặt dấu”.';
}
async function stampLoadApprovalV493(btn){
  const t=stampSelectedTargetV493(),status=document.getElementById('stampStatusV49');
  if(!t.lop||!Number.isInteger(t.tuan)||t.tuan<1||t.tuan>53){status.textContent='Chọn đầy đủ lớp/nhóm và tuần cần đóng dấu.';return false;}
  const old=btn?.textContent||'';if(btn){btn.disabled=true;btn.textContent='Đang tải...';}status.textContent='Đang tải lần duyệt và chữ ký BGH...';
  try{
    const r=await callSodbEdgeRpcV67('stampApprovalPreviewV7046493',[t,getAdminAuthV700()],20000);
    if(!r?.success)throw new Error(r?.message||'Không tải được lần duyệt BGH.');
    stampApprovalStateV493={lop:t.lop,tuan:t.tuan,approval:r.approval};
    stampSetPositionV493(r.approval?.stampX, r.approval?.stampY);
    stampRenderEditorV493();
    if(r.approval?.dataChanged)status.textContent='Tuần này đã thay đổi sau lần BGH duyệt. Cần BGH duyệt lại trước khi đóng dấu.';
    else if(!['ĐÃ DUYỆT','DA_DUYET'].includes(String(r.approval?.trangThai||'').toUpperCase()))status.textContent='Tuần này chưa ở trạng thái BGH đã duyệt.';
    else status.textContent=r.approval?.stampUrl?'Đã tải dấu hiện tại. Có thể kéo để đổi vị trí hoặc chọn ảnh dấu mới.':'Đã tải chữ ký BGH. Chọn ảnh dấu PNG rồi kéo đến vị trí cần đóng.';
    return true;
  }catch(e){stampApprovalStateV493=null;stampRenderEditorV493();status.textContent=e.message||'Không tải được chữ ký BGH.';return false;}
  finally{if(btn){btn.disabled=false;btn.textContent=old;}}
}
function stampInstallDragV493(){
  const img=document.getElementById('stampDragV493'),anchor=document.getElementById('stampAnchorV493');if(!img||!anchor||img.dataset.dragReady==='1')return;img.dataset.dragReady='1';
  let dragging=false;
  const move=e=>{if(!dragging)return;const r=anchor.getBoundingClientRect();if(!r.width||!r.height)return;stampSetPositionV493((e.clientX-r.left)*100/r.width,(e.clientY-r.top)*100/r.height);};
  img.addEventListener('pointerdown',e=>{dragging=true;img.setPointerCapture?.(e.pointerId);e.preventDefault();move(e);});
  img.addEventListener('pointermove',move);img.addEventListener('pointerup',e=>{dragging=false;try{img.releasePointerCapture?.(e.pointerId);}catch(_e){}});img.addEventListener('pointercancel',()=>dragging=false);
  img.addEventListener('keydown',e=>{let dx=0,dy=0;if(e.key==='ArrowLeft')dx=-1;if(e.key==='ArrowRight')dx=1;if(e.key==='ArrowUp')dy=-1;if(e.key==='ArrowDown')dy=1;if(!dx&&!dy)return;e.preventDefault();stampSetPositionV493(stampPositionStateV493.x+dx,stampPositionStateV493.y+dy);});
}
function complianceFilterV704649(){
  const $=id=>document.getElementById(id);
  return {schoolYear:$('complianceYearV49').value.trim(),lop:$('complianceClassV49').value.trim(),fromWeek:Number($('complianceFromV49').value),toWeek:Number($('complianceToV49').value),hinhThucDay:$('complianceModeV49').value};
}
let complianceResultV49=null;
const complianceColumnsV49=['Lớp','Tuần','Ngày','Buổi','Tiết','Môn','Tiết CT','Tên bài dạy','Giáo viên','Hình thức dạy','Nền tảng','Link phòng học','Nhận xét','Nguồn hình thức'];
function complianceRowV704649(r){return [r.lop,r.tuan,r.ngay,r.buoi,r.tiet,teachingFieldV704649(r,'mon'),r.tietCT,teachingFieldV704649(r,'tenBai'),r.giaoVien,r.hinhThucDay,r.nenTangDay,r.linkPhongHoc,teachingFieldV704649(r,'nhanXet'),r.hinhThucSuyDien?'Quy tắc tiết cũ':'Đã lưu'];}
async function complianceRunV704649(btn,excel){
  btn.disabled=true;complianceResultV49=null;
  const status=document.getElementById('complianceSummaryV49');status.textContent='Đang tổng hợp...';
  try{
    const r=await callSodbEdgeRpcV67('teachingComplianceV704649',[complianceFilterV704649(),getAdminAuthV700()],180000);
    if(!r?.success)throw new Error(r?.message||'Không tải được báo cáo.');
    complianceResultV49=r;
    status.textContent=`${r.schoolYear} · ${r.summary.total} tiết · Trực tuyến: ${r.summary.online} (${r.summary.percent}%) · Trực tiếp: ${r.summary.offline}. ${r.summary.inferred} tiết dùng quy tắc dữ liệu cũ; ${r.summary.missingPlatform} tiết trực tuyến chưa khai báo nền tảng. ${r.data.length} dòng theo bộ lọc.`;
    if(excel){
      await ensureXlsxLibraryV704649();
      const wb=XLSX.utils.book_new(),info=[['Năm học',r.schoolYear],['Phạm vi',JSON.stringify(r.filter)],['Tổng tiết',r.summary.total],['Trực tuyến',r.summary.online],['Tỷ lệ trực tuyến (%)',r.summary.percent],['Trực tiếp',r.summary.offline],['Tiết theo quy tắc cũ',r.summary.inferred],['Trực tuyến thiếu nền tảng',r.summary.missingPlatform],['Cách đếm','Mỗi lớp/ngày/buổi/tiết tính một tiết; tiết trộn có phần trực tuyến tính là có trực tuyến.'],['Ghi chú','Thông tin phục vụ quản lý; không thay thế hồ sơ/minh chứng dạy học.']];
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(info),'Tổng hợp');
      const ws=XLSX.utils.aoa_to_sheet([complianceColumnsV49,...r.data.map(complianceRowV704649)]);ws['!autofilter']={ref:ws['!ref']};ws['!cols']=complianceColumnsV49.map((_,i)=>({wch:i===7||i===12?55:i===11?40:18}));
      XLSX.utils.book_append_sheet(wb,ws,'Chi tiết');XLSX.writeFile(wb,'SODB_HinhThucDay_'+r.schoolYear+'.xlsx');
    }
  }catch(e){status.textContent=e.message||'Chưa tổng hợp được. Vui lòng thử lại.';}finally{btn.disabled=false;}
}
async function ensureXlsxLibraryV704649(){
  if(typeof XLSX!=='undefined')return;
  if(typeof ensureXlsxV7==='function')await ensureXlsxV7();
  else if(typeof loadXlsxLibrary==='function')await loadXlsxLibrary();
  if(typeof XLSX==='undefined')throw new Error('Chưa tải được công cụ Excel. Vui lòng thử lại.');
}
function compliancePrintV704649(){
  const r=complianceResultV49;if(!r){showToastV9('Bấm Thống kê trước khi in.','warning');return;}
  if(JSON.stringify(r.filter)!==JSON.stringify(complianceFilterV704649())){showToastV9('Bộ lọc đã đổi. Bấm Thống kê lại trước khi in.','warning');return;}
  const w=window.open('','_blank');if(!w){showToastV9('Cho phép mở cửa sổ in rồi thử lại.','warning');return;}
  const esc=escapeHtml;
  w.document.write(`<!doctype html><html lang="vi"><meta charset="utf-8"><title>Báo cáo hình thức dạy</title><style>@page{size:A3 landscape;margin:10mm}body{font-family:'Times New Roman',serif;font-size:10pt}table{width:100%;border-collapse:collapse}th,td{border:1px solid #777;padding:4px;overflow-wrap:anywhere}thead{display:table-header-group}@media print{button{display:none}}</style><button onclick="window.print()">In</button><h2>BÁO CÁO HÌNH THỨC DẠY — ${esc(r.schoolYear)}</h2><p>${esc(document.getElementById('complianceSummaryV49').textContent)}</p><table><thead><tr>${complianceColumnsV49.map(x=>'<th>'+esc(x)+'</th>').join('')}</tr></thead><tbody>${r.data.map(x=>'<tr>'+complianceRowV704649(x).map(v=>'<td>'+esc(String(v??''))+'</td>').join('')+'</tr>').join('')}</tbody></table></html>`);w.document.close();
}
async function stampApplyV704649(btn){
  const t=stampSelectedTargetV493(),file=document.getElementById('stampFileV49')?.files?.[0],status=document.getElementById('stampStatusV49'),a=stampApprovalStateV493?.approval;
  if(!t.lop||!Number.isInteger(t.tuan)||t.tuan<1||t.tuan>53){status.textContent='Chọn đầy đủ lớp/nhóm và tuần cần đóng dấu.';return;}
  if(!stampApprovalStateV493||stampApprovalStateV493.lop!==t.lop||stampApprovalStateV493.tuan!==t.tuan){status.textContent='Bấm “Tải chữ ký BGH để đặt dấu” trước khi đóng dấu.';return;}
  if(!a?.success||a.dataChanged||!['ĐÃ DUYỆT','DA_DUYET'].includes(String(a.trangThai||'').toUpperCase())){status.textContent='Lần duyệt BGH không còn hiệu lực. Cần tải lại hoặc duyệt lại tuần.';return;}
  if(file&&(file.type!=='image/png'||file.size>1048576)){status.textContent='Ảnh dấu phải là PNG tối đa 1 MB.';return;}
  if(!file&&!a.stampUrl){status.textContent='Chọn ảnh dấu PNG trước khi đóng dấu.';return;}
  btn.disabled=true;status.textContent='Đang lưu con dấu và vị trí đã chọn...';
  try{
    let dataUrl='';if(file)dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=reject;reader.readAsDataURL(file);});
    const r=await callSodbEdgeRpcV67('stampApprovalV704649',[{lop:t.lop,tuan:t.tuan,dataUrl,reuseExisting:!file,stampX:stampPositionStateV493.x,stampY:stampPositionStateV493.y},getAdminAuthV700()],30000);
    if(!r?.success)throw new Error(r?.message||'Không đóng dấu được.');
    status.textContent='Đã đóng dấu đúng vị trí đã chọn. Xem sổ và bản in A3 sẽ dùng cùng vị trí này.';
    if(typeof invalidateSodbViewCacheV47==='function')invalidateSodbViewCacheV47(t.lop,t.tuan);
    document.getElementById('stampFileV49').value='';if(stampObjectUrlV493){URL.revokeObjectURL(stampObjectUrlV493);stampObjectUrlV493='';}
    await stampLoadApprovalV493(null);
    status.textContent='Đã đóng dấu đúng vị trí đã chọn. Xem sổ và bản in A3 sẽ dùng cùng vị trí này.';
  }catch(e){status.textContent=e.message||'Không đóng dấu được.';}finally{btn.disabled=false;stampRenderEditorV493();}
}
async function saveOnlineDefaultV704649(btn){
  const f=complianceFilterV704649();if(!f.lop){showToastV9('Nhập lớp để lưu gợi ý phòng học.','warning');return;}
  btn.disabled=true;try{const r=await callSodbEdgeRpcV67('teachingDefaultV704649',[{save:true,lop:f.lop,nenTangDay:document.getElementById('onlineDefaultPlatformV49').value,linkPhongHoc:document.getElementById('onlineDefaultLinkV49').value.trim()},getAdminAuthV700()],15000);if(!r?.success)throw new Error(r?.message||'Không lưu được.');showToastV9('Đã lưu gợi ý phòng học cho '+f.lop+'.','success');}catch(e){showToastV9(e.message,'danger');}finally{btn.disabled=false;}
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('input-tab')?.addEventListener('shown.bs.tab',()=>teachingSuggestV704649(false));
  document.getElementById('ngayDay')?.addEventListener('change',()=>teachingSuggestV704649(true));
  for(const id of ['buoiDay','monHoc','lop'])document.getElementById(id)?.addEventListener('change',()=>teachingSuggestV704649(false));
  document.querySelectorAll('input[name="hinhThucDayV49"]').forEach(e=>e.addEventListener('change',()=>{teachingModeManualV49=true;++teachingSuggestRequestV49;teachingToggleV704649();}));
  for(const id of ['onlinePlatformV49','onlineLinkV49'])document.getElementById(id)?.addEventListener('input',()=>++teachingSuggestRequestV49);
  document.getElementById('sodbForm')?.addEventListener('reset',()=>{teachingModeManualV49=false;teachingLastDateV49='';setTimeout(()=>teachingSuggestV704649(true),0);});
  stampFillWeeksV493();stampRefreshClassOptionsV493();stampInstallDragV493();
  document.getElementById('stampClassV493')?.addEventListener('focus',stampRefreshClassOptionsV493);
  document.getElementById('stampClassV493')?.addEventListener('change',stampTargetChangedV493);
  document.getElementById('stampWeekV493')?.addEventListener('change',stampTargetChangedV493);
  document.getElementById('stampFileV49')?.addEventListener('change',e=>{
    const f=e.target.files?.[0],status=document.getElementById('stampStatusV49');if(stampObjectUrlV493){URL.revokeObjectURL(stampObjectUrlV493);stampObjectUrlV493='';}
    if(f&&(f.type!=='image/png'||f.size>1048576)){e.target.value='';status.textContent='Ảnh dấu phải là PNG tối đa 1 MB.';stampRenderEditorV493();return;}
    if(f)stampObjectUrlV493=URL.createObjectURL(f);stampRenderEditorV493();
    if(f&&!stampApprovalStateV493)status.textContent='Đã chọn ảnh dấu. Tiếp theo chọn lớp/nhóm, tuần và tải chữ ký BGH.';
  });
  teachingToggleV704649();
});

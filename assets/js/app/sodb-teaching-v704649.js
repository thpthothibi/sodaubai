/* V70.4.6.49: teaching mode, inspection exports and approval-bound stamps. */
'use strict';
function teachingPublicClientV704649(r={}) {
  return {hinhThucDay:r.hinhThucDay||'',nenTangDay:r.nenTangDay||'',linkPhongHoc:r.linkPhongHoc||'',hinhThucSuyDien:!!r.hinhThucSuyDien};
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
  const mode=r.hinhThucDay||'Trực tiếp';
  document.querySelectorAll('input[name="hinhThucDayV49"]').forEach(e=>e.checked=e.value===mode);
  document.getElementById('onlinePlatformV49').value=r.nenTangDay||'';
  document.getElementById('onlineLinkV49').value=r.linkPhongHoc||'';
  document.getElementById('teachingHintV49').textContent=r.hinhThucSuyDien?'Tiết cũ: hình thức được hiển thị theo quy tắc ngày dạy.':'';
  teachingToggleV704649();
}
let teachingSuggestRequestV49=0;
async function teachingSuggestV704649(){
  const ticket=++teachingSuggestRequestV49;
  if(typeof editingRecordIdV4!=='undefined'&&editingRecordIdV4)return;
  const $=id=>document.getElementById(id),day=new Date(($('ngayDay')?.value||'')+'T12:00:00').getDay();
  const subject=String($('monHoc')?.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const online=day===6;
  teachingLoadV704649({hinhThucDay:online?'Trực tuyến':'Trực tiếp'},true);
  if(!online)return;
  $('teachingHintV49').textContent='Gợi ý tất cả các môn ngày Thứ 7: trực tuyến. Có thể đổi theo thực tế.';
  try{
    const token=typeof gvbmDangNhapInfo!=='undefined'?gvbmDangNhapInfo?.sessionToken:'';
    if(!token)return;
    const r=await callSodbEdgeRpcV67('teachingDefaultV704649',[{lop:$('lop').value},{token}],12000);
    if(ticket!==teachingSuggestRequestV49||teachingFormV704649().hinhThucDay!=='Trực tuyến')return;
    if(r?.success&&r.data){$('onlinePlatformV49').value=r.data.nen_tang_day||'';$('onlineLinkV49').value=r.data.link_phong_hoc||'';}
  }catch(_e){/* Missing optional suggestion never blocks entry. */}
}
function stampHtmlV704649(approval){
  if(!approval?.success||approval.dataChanged||!approval.stampUrl)return '';
  return `<img src="${escapeHtml(approval.stampUrl)}" alt="Dấu nhà trường" class="school-stamp-v49" style="position:absolute;width:12mm;height:12mm;object-fit:contain;left:calc(50% - 20mm);top:-2mm;max-width:none;max-height:none;filter:none;pointer-events:none">`;
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
  const f=complianceFilterV704649(),file=document.getElementById('stampFileV49').files[0],status=document.getElementById('stampStatusV49');
  if(!f.lop||f.fromWeek!==f.toWeek){status.textContent='Chọn một lớp/nhóm và cùng một tuần bắt đầu, kết thúc.';return;}
  if(!file||file.type!=='image/png'||file.size>1048576){status.textContent='Chọn ảnh PNG tối đa 1 MB.';return;}
  btn.disabled=true;status.textContent='Đang kiểm tra duyệt và đóng dấu...';
  try{
    const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
    const r=await callSodbEdgeRpcV67('stampApprovalV704649',[{...f,tuan:f.fromWeek,dataUrl},getAdminAuthV700()],30000);
    if(!r?.success)throw new Error(r?.message||'Không đóng dấu được.');
    status.textContent='Đã đóng dấu. Tải lại sổ hoặc tạo lại bản in A3 để xem.';
    if(typeof invalidateSodbViewCacheV47==='function')invalidateSodbViewCacheV47(f.lop,f.fromWeek);
  }catch(e){status.textContent=e.message||'Không đóng dấu được.';}finally{btn.disabled=false;}
}
async function saveOnlineDefaultV704649(btn){
  const f=complianceFilterV704649();if(!f.lop){showToastV9('Nhập lớp để lưu gợi ý phòng học.','warning');return;}
  btn.disabled=true;try{const r=await callSodbEdgeRpcV67('teachingDefaultV704649',[{save:true,lop:f.lop,nenTangDay:document.getElementById('onlineDefaultPlatformV49').value,linkPhongHoc:document.getElementById('onlineDefaultLinkV49').value.trim()},getAdminAuthV700()],15000);if(!r?.success)throw new Error(r?.message||'Không lưu được.');showToastV9('Đã lưu gợi ý phòng học cho '+f.lop+'.','success');}catch(e){showToastV9(e.message,'danger');}finally{btn.disabled=false;}
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('input-tab')?.addEventListener('shown.bs.tab',teachingSuggestV704649);
  for(const id of ['ngayDay','buoiDay','monHoc','lop'])document.getElementById(id)?.addEventListener('change',teachingSuggestV704649);
  document.querySelectorAll('input[name="hinhThucDayV49"]').forEach(e=>e.addEventListener('change',()=>{++teachingSuggestRequestV49;teachingToggleV704649();}));
  for(const id of ['onlinePlatformV49','onlineLinkV49'])document.getElementById(id)?.addEventListener('input',()=>++teachingSuggestRequestV49);
  document.getElementById('sodbForm')?.addEventListener('reset',()=>setTimeout(teachingSuggestV704649,0));
  document.getElementById('stampFileV49')?.addEventListener('change',e=>{const p=document.getElementById('stampPreviewV49'),f=e.target.files[0];if(p.dataset.url)URL.revokeObjectURL(p.dataset.url);p.hidden=true;if(f?.type==='image/png'&&f.size<=1048576){p.src=URL.createObjectURL(f);p.dataset.url=p.src;p.hidden=false;}});
  teachingToggleV704649();
});

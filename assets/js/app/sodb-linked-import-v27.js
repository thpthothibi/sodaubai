'use strict';
let linkedStateV27={rows:[],columns:[],preview:null,filename:''},linkedReadSeqV27=0;
function linkedKeyV27(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/\s+/g,' ').trim();}
function linkedXmlRowsV27(text){
  const doc=new DOMParser().parseFromString(text,'application/xml');
  if(doc.querySelector('parsererror'))throw new Error('File XML không hợp lệ.');
  const ns='urn:schemas-microsoft-com:office:spreadsheet',sheet=doc.getElementsByTagNameNS(ns,'Worksheet')[0];
  if(!sheet)throw new Error('Không tìm thấy bảng Excel XML.');
  const rows=[];let ri=0;
  for(const row of sheet.getElementsByTagNameNS(ns,'Row')){
    ri=Number(row.getAttributeNS(ns,'Index')||ri+1)-1;let ci=0;const values=[];
    for(const cell of row.getElementsByTagNameNS(ns,'Cell')){
      ci=Number(cell.getAttributeNS(ns,'Index')||ci+1)-1;
      const v=cell.getElementsByTagNameNS(ns,'Data')[0]?.textContent||'';
      const across=Number(cell.getAttributeNS(ns,'MergeAcross')||0);
      for(let n=0;n<=across;n++)values[ci+n]=v;
      ci+=across+1;
    }rows[ri]=values;ri++;
  }return rows;
}
function parseLinkedRowsV27(rows){
  const header=rows.findIndex(r=>r&&linkedKeyV27(r[0])==='thu'&&linkedKeyV27(r[1])==='buoi'&&linkedKeyV27(r[2])==='tiet');
  if(header<0)throw new Error('Cần bảng Theo môn với ba cột đầu: Thứ, Buổi, Tiết.');
  const cols=[],out=[],errors=[],seen=new Set();let subject='';
  for(let c=3;c<(rows[header]||[]).length;c++){
    if(rows[header][c])subject=String(rows[header][c]).trim();
    if(subject)cols.push({col:c,subject,teacher:String(rows[header+1]?.[c]||'').trim()});
  }
  let thu=0,buoi='';
  for(let i=header+2;i<rows.length;i++){
    const r=rows[i]||[],day=String(r[0]||'').trim(),session=linkedKeyV27(r[1]);
    if(day){thu=Number(day.replace(/^Thứ\s*/i,''));buoi='';}
    if(session)buoi=({s:'Sáng',sang:'Sáng',c:'Chiều',chieu:'Chiều'})[session]||'';
    const tiet=Number(r[2]);
    for(const col of cols){
      const cell=String(r[col.col]||'').trim();if(!cell)continue;
      const matches=[...cell.matchAll(/\b((?:10|11|12)A\d{1,2})\b/gi)];
      if(!matches.length){if(tiet>=1&&tiet<=5)errors.push(`Dòng ${i+1}, cột ${col.col+1}: không nhận diện lớp (${cell}).`);continue;}
      if(!Number.isInteger(thu)||thu<2||thu>7||!buoi||!Number.isInteger(tiet)||tiet<1||tiet>4){errors.push(`Dòng ${i+1}: Thứ/Buổi/Tiết không hợp lệ (${day||thu}/${buoi}/${tiet}). Chỉ nhận tiết 1–4.`);continue;}
      for(const match of matches){const lop=match[1].toUpperCase(),key=[lop,thu,buoi,tiet,col.subject].join('|');
        if(seen.has(key)){errors.push(`Trùng tiết: ${key}.`);continue;}seen.add(key);
        out.push({lop,khoi:Number(lop.slice(0,2)),thu,buoi,tiet,col:col.col,subject:col.subject,sourceRow:i+1});
      }
    }
  }
  if(errors.length)throw new Error(errors.slice(0,12).join('\n'));
  if(!out.length)throw new Error('Không có tiết hợp lệ trong file.');
  const title=String(rows[0]?.[0]||''),date=title.match(/(?:NGÀY|ngày)\s+(\d{2})[-/](\d{2})[-/](\d{4})/);
  return {rows:out,columns:cols.filter(c=>out.some(r=>r.col===c.col)),suggestedDate:date?`${date[3]}-${date[2]}-${date[1]}`:''};
}
function invalidateLinkedPreviewV27(){linkedStateV27.preview=null;document.getElementById('linkedSaveV27').disabled=true;document.getElementById('linkedPreviewV27').replaceChildren();}
function linkedProgramsOptionsV27(subject){
  const programs=batchCatalogV704645.programs||[],matching=programs.filter(p=>[p.tenMon,p.tenChuongTrinh].some(v=>linkedKeyV27(v)===linkedKeyV27(subject)));
  return '<option value="">-- Chọn chương trình --</option>'+programs.map(p=>`<option value="${escV693(p.id)}" ${matching.length===1&&matching[0].id===p.id?'selected':''}>${escV693(p.tenChuongTrinh)} · ${escV693(p.tenMon)}</option>`).join('');
}
function linkedStaffOptionsV27(col){
  const programId=document.getElementById('linkedProgramV27_'+col)?.value||'',c=linkedStateV27.columns.find(x=>x.col===col);
  const staff=(batchCatalogV704645.staff||[]).filter(s=>s.programId===programId),exact=staff.filter(s=>linkedKeyV27(s.hoTen)===linkedKeyV27(c?.teacher));
  const el=document.getElementById('linkedStaffV27_'+col);el.innerHTML='<option value="">-- Chọn nhân sự --</option>'+staff.map(s=>`<option value="${escV693(s.id)}" ${exact.length===1&&exact[0].id===s.id?'selected':''}>${escV693(s.hoTen)}</option>`).join('');invalidateLinkedPreviewV27();
}
async function readLinkedFileV27(input){
  const seq=++linkedReadSeqV27;invalidateLinkedPreviewV27();linkedStateV27={rows:[],columns:[],preview:null,filename:''};
  const file=input.files?.[0],status=document.getElementById('linkedStatusV27');document.getElementById('linkedMapV27').replaceChildren();if(!file)return;
  try{
    if(file.size>15*1024*1024)throw new Error('File tối đa 15 MB.');
    const bytes=await file.arrayBuffer();if(seq!==linkedReadSeqV27)return;
    const text=new TextDecoder().decode(bytes);let rows;
    if(text.trimStart().startsWith('<?xml')||text.includes('urn:schemas-microsoft-com:office:spreadsheet'))rows=linkedXmlRowsV27(text);
    else{const wb=XLSX.read(bytes,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});for(const m of ws['!merges']||[])if(m.s.r===m.e.r)for(let c=m.s.c+1;c<=m.e.c;c++)rows[m.s.r][c]=rows[m.s.r][m.s.c];}
    const parsed=parseLinkedRowsV27(rows);linkedStateV27={...parsed,filename:file.name,preview:null};
    if(parsed.suggestedDate)document.getElementById('linkedFromV27').value=parsed.suggestedDate;
    await new Promise((resolve,reject)=>google.script.run.withSuccessHandler(r=>{if(!r?.success)return reject(new Error(r?.message||'Không tải được danh mục.'));batchCatalogV704645=r;resolve();}).withFailureHandler(reject).layDanhMucKyThayHangLoatV704645(batchAuthV704645()));
    if(seq!==linkedReadSeqV27)return;
    document.getElementById('linkedMapV27').innerHTML='<table class="table table-sm table-bordered"><thead><tr><th>Môn trong file</th><th>Nhân sự trong file</th><th>Chương trình</th><th>Nhân sự thực tế</th></tr></thead><tbody>'+parsed.columns.map(c=>`<tr><td>${escV693(c.subject)}</td><td>${escV693(c.teacher)}</td><td><select class="form-select" id="linkedProgramV27_${c.col}" onchange="linkedStaffOptionsV27(${c.col})">${linkedProgramsOptionsV27(c.subject)}</select></td><td><select class="form-select" id="linkedStaffV27_${c.col}" onchange="invalidateLinkedPreviewV27()"></select></td></tr>`).join('')+'</tbody></table>';
    parsed.columns.forEach(c=>linkedStaffOptionsV27(c.col));status.textContent=`Đã đọc ${parsed.rows.length} tiết, ${new Set(parsed.rows.map(r=>r.lop)).size} lớp. Kiểm tra ngày áp dụng và ghép đủ các cột.`;
  }catch(e){if(seq===linkedReadSeqV27){linkedStateV27={rows:[],columns:[],preview:null,filename:''};status.textContent=e.message||String(e);}}
}
function linkedPayloadV27(){
  if(!linkedStateV27.rows.length)throw new Error('Chọn file TKB trước.');
  const rows=linkedStateV27.rows.map(r=>{const programId=document.getElementById('linkedProgramV27_'+r.col)?.value,externalStaffId=document.getElementById('linkedStaffV27_'+r.col)?.value;if(!programId||!externalStaffId)throw new Error(`Chưa ghép chương trình/nhân sự cho ${r.subject} · ${linkedStateV27.columns.find(c=>c.col===r.col)?.teacher||''}.`);return {...r,programId,externalStaffId};});
  return {rows,tuNgay:document.getElementById('linkedFromV27').value,denNgay:document.getElementById('linkedToV27').value,hocKy:document.getElementById('linkedSemesterV27').value,filename:linkedStateV27.filename};
}
async function linkedRpcV27(p){return await callSodbEdgeRpcV67('importKhungTietLienKetV27',[p,batchAuthV704645()],60000);}
async function previewLinkedV27(btn){
  invalidateLinkedPreviewV27();btn.disabled=true;const status=document.getElementById('linkedStatusV27');
  try{const p=linkedPayloadV27(),snapshot=JSON.stringify(p),r=await linkedRpcV27({...p,preview:true});if(!r?.success)throw new Error(r?.message||'Không xem trước được.');if(snapshot!==JSON.stringify(linkedPayloadV27()))throw new Error('Dữ liệu đã đổi. Bấm xem trước lại.');linkedStateV27.preview={payload:p,revision:r.revision};
    status.textContent=`${r.rows} tiết mới; ${r.closed} tiết lịch cũ sẽ kết thúc ngày ${r.previousEnd}. Phạm vi: ${r.scopes} chương trình/khối. Không thay đổi dữ liệu sổ đã nhập.`;
    document.getElementById('linkedPreviewV27').innerHTML='<table class="table table-sm table-bordered"><thead><tr><th>Lớp</th><th>Thứ</th><th>Buổi</th><th>Tiết</th><th>Môn</th></tr></thead><tbody>'+p.rows.map(x=>`<tr><td>${escV693(x.lop)}</td><td>${x.thu}</td><td>${escV693(x.buoi)}</td><td>${x.tiet}</td><td>${escV693(x.subject)}</td></tr>`).join('')+'</tbody></table>';document.getElementById('linkedSaveV27').disabled=false;
  }catch(e){status.textContent=e.message||String(e);}finally{btn.disabled=false;}
}
async function saveLinkedV27(btn){
  btn.disabled=true;const status=document.getElementById('linkedStatusV27');
  try{const preview=linkedStateV27.preview;if(!preview||JSON.stringify(preview.payload)!==JSON.stringify(linkedPayloadV27()))throw new Error('Cần xem trước lại trước khi nhập.');status.textContent='Đang nhập TKB...';const r=await linkedRpcV27({...preview.payload,preview:false,expectedRevision:preview.revision});if(!r?.success)throw new Error(r?.message||'Không nhập được.');linkedStateV27.preview=null;status.textContent=`Đã nhập ${r.rows} tiết; đã chốt ${r.closed} tiết lịch cũ đến ${r.previousEnd}.`;taiKhungTietLienKetV704645();
  }catch(e){linkedStateV27.preview=null;status.textContent=(e.message||String(e))+' Bấm Xem trước để kiểm tra trước khi thử lại.';}
}

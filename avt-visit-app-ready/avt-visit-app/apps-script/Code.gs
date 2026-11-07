/**
 * AVT · Đồng bộ viếng thăm với Google Sheet
 * Cách dùng: mở Google Sheet > Tiện ích mở rộng > Apps Script > xóa code cũ, dán toàn bộ file này.
 * Đổi MAT_KHAU bên dưới, rồi: Triển khai > Tùy chọn triển khai mới > Ứng dụng web
 *   - Thực thi dưới tên: Tôi
 *   - Người có quyền truy cập: Bất kỳ ai
 * Sao chép "URL ứng dụng web" dán vào tab Cài đặt của app.
 */
const MAT_KHAU = "doi-mat-khau-cua-ban";

const TT = {NH:"TRUNG TÂM FAHASA NGUYỄN HUỆ", XT:"TRUNG TÂM FAHASA XUÂN THU", GD:"TRUNG TÂM FAHASA GIA ĐỊNH", PN:"TRUNG TÂM FAHASA PHÚ NHUẬN"};
const NV = {TVT:"Trần Văn Thiện", NHN:"Nguyễn Hữu Nghĩa", VTN:"Vương Tuyết Nhung", BN:"Nguyễn Hồng Bảo Nhi"};
const CV = ["Vệ sinh trưng bày hàng hóa tại điểm bán","Đưa biên bản CTKM","ĐCCN","Kết hợp trả MTBH"];
const DATA_HDR = ["id","collection","json","updated"];
const VIEW_HDR = ["id","Ngày","Buổi","Trung tâm","Nhân viên","Điểm bán","Có đi theo kế hoạch","Công việc thực hiện","Báo cáo ảnh Zalo","Tính chỉ tiêu 24 lượt","Lý do / ghi chú","Phương án bù"];

function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sheet_(name, hdr){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if(!s){ s = ss.insertSheet(name); s.appendRow(hdr); s.setFrozenRows(1); }
  return s;
}
function upsert_(s, p, mkRow){
  const n = s.getLastRow();
  const ids = n > 0 ? s.getRange(1,1,n,1).getValues().flat() : [];
  const i = ids.indexOf(p.id);
  if(p.op === "del"){ if(i > 0) s.deleteRow(i+1); return; }
  const row = mkRow();
  if(i > 0) s.getRange(i+1,1,1,row.length).setValues([row]); else s.appendRow(row);
}
function viewRow_(p){
  const v = p.data, ok = v.go && v.zl && v.ty === "f";
  return [p.id, v.d, v.ss === "S" ? "Sáng" : "Chiều", TT[v.c]||v.c, NV[v.s]||v.s, v.on,
    v.go ? "CÓ GHÉ THĂM" : "KHÔNG GHÉ THĂM", (v.tk||[]).map(i=>CV[i]).join("; "),
    v.go ? (v.zl ? "CÓ" : "KHÔNG") : "", ok ? "CÓ" : "KHÔNG", v.n||"", v.alt||""];
}
function doGet(e){
  if((e.parameter.k||"") !== MAT_KHAU) return out_({error:"Sai mật khẩu đồng bộ"});
  const r = {visits:{}, audits:{}, cfg:{}};
  sheet_("AVT_DATA", DATA_HDR).getDataRange().getValues().slice(1).forEach(x=>{
    if(x[0] && r[x[1]]) r[x[1]][x[0]] = JSON.parse(x[2]);
  });
  return out_(r);
}
function doPost(e){
  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  try{
    const p = JSON.parse(e.postData.contents);
    if(p.k !== MAT_KHAU) return out_({error:"Sai mật khẩu đồng bộ"});
    upsert_(sheet_("AVT_DATA", DATA_HDR), p, ()=>[p.id, p.col, JSON.stringify(p.data), new Date()]);
    if(p.col === "visits") upsert_(sheet_("LUOT_VIEN_THAM", VIEW_HDR), p, ()=>viewRow_(p));
    return out_({ok:true});
  } finally { lock.releaseLock(); }
}

import ExcelJS from 'exceljs';
import { Teacher, WorkHistory, TeachingLog, ResearchLog } from '../types';
import { getTeacherTeachingNorm, ACTIVITY_DATA } from '../data';

const TEMPLATE_URL = '/templates/Mau01_CaNhan.xlsx';
const SHEET_NAME = 'Ca nhan';

// Tên category trong ACTIVITY_DATA → tương ứng mục của Mẫu 01
const CAT_SECTION3 = 'Hướng dẫn & Olympic'; // → Mục 3: Hướng dẫn học viên (rows 47-48)
const CAT_SECTION4 = 'Hội đồng & Tham dự';  // → Mục 4: Hội đồng/Hội thảo (rows 53-56)

// Lấy category của một research type (undefined nếu không có trong ACTIVITY_DATA)
function getCategoryOf(type: string): string | undefined {
  for (const cat of ACTIVITY_DATA) {
    if (cat.items.some(item => item.id === type)) return cat.category;
  }
  return undefined;
}

function mapTeachingLog(log: TeachingLog) {
  const t = log.type;
  const h = log.actualHours;
  if (t === 'theoretical') return { E: h };
  if (t === 'theoretical_night') return { F: h };
  if (t === 'practical_day_lab' || t === 'practical') return { G: h };
  if (t === 'practical_night_lab') return { H: h };
  if (t === 'foreign_language_teaching' || t === 'military_special_teaching') return { I: h };
  return { E: h };
}

function mapResearchLog(log: ResearchLog) {
  const type = log.type;
let B = 'Đề tài';

if (type.startsWith('sk_tu_tuc_')) {
  B = 'Sáng kiến tự bảo đảm';
}
else if (type.startsWith('sk_')) {
  B = 'Sáng kiến';
}
else if (type.startsWith('bc_') || type.startsWith('td_')) {
  B = 'Báo cáo KH';
}
else if (
  type.startsWith('gt_') ||
  type.startsWith('book_')
) {
  B = 'Giáo trình, tài liệu';
}
else if (
  type.startsWith('bb_') ||
  type.startsWith('isi_')
) {
  B = 'Bài báo KH';
}
else if (type.startsWith('hd_') || type.startsWith('ol_')) {
  B = 'Sáng kiến';
}

  let I = 'Nhà trường';
  if (type.includes('cs_truong') || type.includes('university')) I = 'Nhà trường';
  else if (type.includes('cs_tongcuc')) I = 'BTTM/TCCT/Tổng cục';
  else if (type.includes('bo') || type.includes('ministry')) I = 'Tỉnh (Thành phố)/Bộ';
  else if (type.includes('qg') || type.includes('national')) I = 'Quốc gia';
  else if (type.includes('khoa')) I = 'Khoa';
  else if (type.includes('issn')) I = 'ISSN';
  else if (type.includes('hdgsnn')) I = 'HĐGSNN';
  else if (type.includes('isi') || type.includes('scopus') || type.includes('q1') || type.includes('q2') || type.includes('q3') || type.includes('q4')) I = 'WoS/Scopus';

  let M = '';
  if (type.includes('_xs')) M = 'Xuất sắc';
  else if (type.includes('_kha')) M = 'Khá';
  else if (type.includes('_dat')) M = 'Đạt';
  else if (type.includes('q1')) M = 'Q1';
  else if (type.includes('q2') || type.includes('q3')) M = 'Q2/ Q3';
  else if (type.includes('q4')) M = 'Q4';

  let N = 'Tham gia';
  if (log.role === 'leader' || log.role === 'main') N = 'Chủ nhiệm';

  const P = log.members || 1;
  let Q = 0;
  if (P <= 1) Q = 100;
  else if (log.role === 'main') Q = Math.round((1/P + (1-1/P)/P) * 100);
  else Q = Math.round((1/P) * 100);

  return { B, I, L: log.years || 1, M, N, P, Q };
}

function getCellText(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'object' && 'text' in cell.value) return (cell.value as any).text;
  return String(cell.value);
}

function isValidPos(pos: string, ws: ExcelJS.Worksheet): boolean {
  const wb = (ws as any).workbook as ExcelJS.Workbook;
  const qd = wb?.getWorksheet('Quy doi');
  if (!qd) return false;
  for (let r = 3; r <= 25; r++) {
    if (getCellText(qd.getCell(`A${r}`)) === pos) return true;
  }
  return false;
}

function getPercent(pos: string, ws: ExcelJS.Worksheet): number | null {
  const wb = (ws as any).workbook as ExcelJS.Workbook;
  const qd = wb?.getWorksheet('Quy doi');
  if (!qd) return null;
  for (let r = 3; r <= 25; r++) {
    if (getCellText(qd.getCell(`A${r}`)) === pos) {
      return qd.getCell(`B${r}`).value as number || null;
    }
  }
  return null;
}

export async function exportTeacherMau01(
  teacher: Teacher,
  wh: WorkHistory,
  teachingLogs: TeachingLog[],
  researchLogs: ResearchLog[],
  selectedYear: string
): Promise<void> {
  const resp = await fetch(TEMPLATE_URL);
  if (!resp.ok) throw new Error('Không tìm thấy file template');
  const buf = await resp.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const ws = wb.getWorksheet(SHEET_NAME);
  if (!ws) throw new Error(`Không tìm thấy sheet "${SHEET_NAME}"`);

  // HEADER
  ws.getCell('D3').value = 'Khoa Ô tô';
  ws.getCell('L3').value = wh.department || teacher.department;
  ws.getCell('D4').value = teacher.name;
  ws.getCell('L4').value = wh.position;
  ws.getCell('P5').value = 0;

  if (!isValidPos(wh.position, ws)) {
    const pct = getPercent(wh.position, ws);
    if (pct !== null) {
      ws.getCell('E5').value = pct;
    } else {
      const norm = getTeacherTeachingNorm(wh.position, wh.party);
      ws.getCell('E5').value = norm.percent / 100;
    }
  }

  // MỤC 1: GIẢNG DẠY (rows 12-26)
for (let r = 12; r <= 26; r++) {
  ['B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','S'].forEach(c => {
    ws.getCell(`${c}${r}`).value = null;
  });

  // Giữ nguyên công thức của template tại cột Q và R
  // Không gán value = null hoặc gán công thức mới
}

  const yearTeaching = teachingLogs.filter(
    log => log.teacherId === teacher.id && log.academicYear === selectedYear
  );
  let ti = 0;
  for (const log of yearTeaching) {
    if (ti >= 15) break;
    const r = 12 + ti;
    const m = mapTeachingLog(log);
    if (m.E) ws.getCell(`E${r}`).value = m.E;
    if (m.F) ws.getCell(`F${r}`).value = m.F;
    if (m.G) ws.getCell(`G${r}`).value = m.G;
    if (m.H) ws.getCell(`H${r}`).value = m.H;
    if (m.I) ws.getCell(`I${r}`).value = m.I;
    ws.getCell(`B${r}`).value = log.className || log.subjectCode;
    ws.getCell(`C${r}`).value = log.studentCount;
    ws.getCell(`D${r}`).value = log.subjectCode;
    ws.getCell(`S${r}`).value = `Tờ ${log.tkbSheets ?? 0} / ${log.semester}`;
    //ws.getCell(`R${r}`).value = log.convertedHours;
    ti++;
  }

  // Chuẩn bị dữ liệu NCKH theo năm (approved)
  const yearResearch = researchLogs.filter(
    log => log.teacherId === teacher.id && log.status === 'approved' && log.period === selectedYear
  );

  // Hàm đếm tổng số lượng (quantity) của một research type
  const countType = (typeId: string): number =>
    yearResearch
      .filter(l => l.type === typeId)
      .reduce((sum, l) => sum + (l.quantity || 1), 0);

  // MỤC 2: NCKH (rows 31-41) — chỉ gồm các category KHÁC 2 category mục 3/4
  for (let r = 31; r <= 41; r++) {
    ['B','I','L','M','N','P','Q','S'].forEach(c => {
      ws.getCell(`${c}${r}`).value = null;
    });
  }

  const section2Logs = yearResearch.filter(log => {
    const cat = getCategoryOf(log.type);
    return cat !== CAT_SECTION3 && cat !== CAT_SECTION4;
  });

  let ri = 0;
  for (const log of section2Logs) {
    if (ri >= 11) break;
    const r = 31 + ri;
    const m = mapResearchLog(log);
    ws.getCell(`B${r}`).value = m.B;
    ws.getCell(`I${r}`).value = m.I;
    ws.getCell(`L${r}`).value = m.L;
    ws.getCell(`M${r}`).value = m.M;
    ws.getCell(`N${r}`).value = m.N;
    ws.getCell(`P${r}`).value = m.P;
    ws.getCell(`Q${r}`).value = m.Q;
    ws.getCell(`C${r}`).value = log.title;
    ws.getCell(`S${r}`).value = log.journalOrOrganization || '';
    //ws.getCell(`R${r}`).value = log.convertedHours;
    ri++;
  }

// MỤC 3: HƯỚNG DẪN HỌC VIÊN & OLYMPIC (rows 47-48)
// Row 47: Hướng dẫn HV thực hiện đề tài NCKH — I47=XS(75đ), J47=Khá(30đ, không có item), M47=Đạt(30đ)
ws.getCell('I47').value = countType('hd_cs_xs');
ws.getCell('J47').value = 0;
ws.getCell('M47').value = countType('hd_cs_dat');

// Row 48: Hướng dẫn HV tham gia hội thi toàn quân/quốc gia — I48=Nhất(300đ), J48=Nhì(250đ), M48=Ba(200đ)
ws.getCell('I48').value = countType('ol_nhat');
ws.getCell('J48').value = countType('ol_nhi');
ws.getCell('M48').value = countType('ol_ba');

// MỤC 4: HỘI ĐỒNG & THAM DỰ (rows 53-56)
// J53: Xét duyệt đề cương (hd_cuong, 3đ)
ws.getCell('J53').value = countType('hd_cuong');
// J54: Nghiệm thu sản phẩm (hd_nghiemthu, 6đ)
ws.getCell('J54').value = countType('hd_nghiemthu');
// J55: Tham dự hội thảo cấp TRƯỜNG (td_truong, 4đ)
ws.getCell('J55').value = countType('td_truong');
// J56: Tham dự hội thảo cấp KHOA (td_khoa, 3đ)
ws.getCell('J56').value = countType('td_khoa');

  // KÝ TÊN
  const now = new Date();
  const d = now.getDate(), mth = now.getMonth()+1, y = now.getFullYear();
  ws.getCell('J63').value = `Thành phố Hồ Chí Minh, ngày ${d} tháng ${mth} năm ${y}`;
  ws.getCell('M68').value = teacher.name;
  ws.getCell('B68').value = null;

  // FORCE RECALC
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.value && typeof cell.value === 'object' && 'formula' in (cell.value as any)) {
        cell.value = { formula: (cell.value as any).formula };
      }
    });
  });

  // Bật Wrap Text cho vùng B31:S41
for (let r = 31; r <= 41; r++) {
  for (let c = 2; c <= 19; c++) {
    const cell = ws.getRow(r).getCell(c);

    cell.alignment = {
      ...cell.alignment,
      wrapText: true
    };
  }
}
  // XUẤT FILE
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
const fileName = teacher.name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[đĐ]/g, (c) => c === 'đ' ? 'd' : 'D')
  .replace(/[^a-zA-Z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

a.download = `Mau01_${fileName}_${selectedYear}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
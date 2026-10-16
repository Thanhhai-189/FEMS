import { Teacher, TeachingLog, ResearchLog, RankNorm, AcademicYearConfig, DepartmentConfig, WorkHistory } from './types';

export interface PositionNorm {
  pos: string;
  party: string;
  percent: number;
  hours: number;
}

export const POSITION_NORMS: PositionNorm[] = [
  { pos: 'Giảng viên', party: '', percent: 100, hours: 280 },
  { pos: 'Trưởng bộ môn', party: '', percent: 80, hours: 224 },
  { pos: 'Chủ nhiệm khoa', party: 'Không kiêm nhiệm', percent: 60, hours: 168 },
  { pos: 'Chủ nhiệm khoa', party: 'Bí thư chi bộ', percent: 45, hours: 126 },
  { pos: 'Chủ nhiệm khoa', party: 'Phó Bí thư chi bộ', percent: 50, hours: 140 },
  { pos: 'Phó Chủ nhiệm khoa', party: 'Không kiêm nhiệm', percent: 70, hours: 196 },
  { pos: 'Phó Chủ nhiệm khoa', party: 'Bí thư chi bộ', percent: 55, hours: 154 },
  { pos: 'Phó Chủ nhiệm khoa', party: 'Phó Bí thư chi bộ', percent: 60, hours: 168 },
];

export function getTeacherTeachingNorm(position: string, party?: string): { percent: number; hours: number } {
  const normBase = 280;

  // Normalize position
  let posNormalized = 'Giảng viên';
  const posLower = position.toLowerCase();
  if (posLower.includes('chủ nhiệm khoa') || posLower.includes('trưởng khoa')) {
    posNormalized = 'Chủ nhiệm khoa';
  } else if (posLower.includes('phó chủ nhiệm khoa') || posLower.includes('phó trưởng khoa')) {
    posNormalized = 'Phó Chủ nhiệm khoa';
  } else if (posLower.includes('trưởng bộ môn') || posLower.includes('trưởng bm')) {
    posNormalized = 'Trưởng bộ môn';
  }

  // Normalize party
  let partyNormalized = '';
  const partyLower = (party || '').toLowerCase();
  if (partyLower.includes('phó bí thư')) {
    partyNormalized = 'Phó Bí thư chi bộ';
  } else if (partyLower.includes('bí thư')) {
    partyNormalized = 'Bí thư chi bộ';
  } else if (partyLower.includes('không') || party === 'Không kiêm nhiệm') {
    partyNormalized = 'Không kiêm nhiệm';
  } else if (party) {
    // defaults to 'Không kiêm nhiệm' if there's position that requires party assignment
    partyNormalized = 'Không kiêm nhiệm';
  }

  // Find exact spec in POSITION_NORMS
  const matched = POSITION_NORMS.find(r => {
    if (r.pos !== posNormalized) return false;
    if (posNormalized === 'Giảng viên' || posNormalized === 'Trưởng bộ môn') {
      return true;
    }
    return r.party === partyNormalized;
  });

  if (matched) {
    return { percent: matched.percent, hours: matched.hours };
  }

  // Fallbacks:
  if (posNormalized === 'Chủ nhiệm khoa') {
    return { percent: 60, hours: 168 };
  }
  if (posNormalized === 'Phó Chủ nhiệm khoa') {
    return { percent: 70, hours: 196 };
  }
  if (posNormalized === 'Trưởng bộ môn') {
    return { percent: 80, hours: 224 };
  }
  return { percent: 100, hours: 280 };
}

export const DEFAULT_RANKS_NORM: RankNorm[] = [
  { rank: 'GS', rankName: 'Giáo sư', teachingNorm: 140, researchNorm: 600 },
  { rank: 'PGS', rankName: 'Phó Giáo sư', teachingNorm: 180, researchNorm: 600 },
  { rank: 'TS', rankName: 'Tiến sĩ', teachingNorm: 220, researchNorm: 600 },
  { rank: 'ThS', rankName: 'Thạc sĩ', teachingNorm: 280, researchNorm: 600 },
  { rank: 'CN', rankName: 'Cử nhân/Trợ giảng', teachingNorm: 300, researchNorm: 600 }
];

export const DEPARTMENTS: DepartmentConfig[] = [
  { id: 'NLDCD', name: 'Nguyên lý Động cơ - Điện' },
  { id: 'NLKCOT', name: 'Nguyên lý Kết cấu ô tô' },
  { id: 'QLKT', name: 'Quản lý Khai thác' }
];

export const ACADEMIC_YEARS: AcademicYearConfig[] = [
  { id: '1', year: '2023-2024', isActive: false },
  { id: '2', year: '2024-2025', isActive: true },
  { id: '3', year: '2025-2026', isActive: false }
];

// Không còn dữ liệu giảng viên mẫu
export const TEACHERS_SAMPLE: Teacher[] = [];

// Không còn dữ liệu quá trình công tác mẫu
export const WORK_HISTORY_SAMPLE: WorkHistory[] = [];

// Không còn dữ liệu giảng dạy mẫu
export const TEACHING_LOGS_SAMPLE: TeachingLog[] = [];

// Không còn dữ liệu nghiên cứu khoa học mẫu
export const RESEARCH_LOGS_SAMPLE: ResearchLog[] = [];

export interface TeachingActivity {
  id: string;
  category: string;
  label: string;
  helperText: string;
  unit: string;
  baseHour: number;
}

export const TEACHING_ACTIVITIES: TeachingActivity[] = [
  // 1. Hoạt động giảng dạy và hướng dẫn trực tiếp
  { id: 'theoretical', category: '1. Giảng dạy & Hướng dẫn trực tiếp', label: 'Giảng dạy ban ngày - Tại giảng đường', helperText: 'Một tiết tại giảng đường tính 1.0 giờ', unit: 'tiết', baseHour: 1.0 },
  { id: 'practical_day_lab', category: '1. Giảng dạy & Hướng dẫn trực tiếp', label: 'Giảng dạy ban ngày - Tại thao trường, xưởng, nhà máy', helperText: 'Một tiết tại thao trường, xưởng, nhà máy... tính 1.2 giờ', unit: 'tiết', baseHour: 1.2 },
  { id: 'theoretical_night', category: '1. Giảng dạy & Hướng dẫn trực tiếp', label: 'Giảng dạy ban đêm - Tại giảng đường', helperText: 'Một tiết tại giảng đường tính 1.2 giờ', unit: 'tiết', baseHour: 1.2 },
  { id: 'practical_night_lab', category: '1. Giảng dạy & Hướng dẫn trực tiếp', label: 'Giảng dạy ban đêm - Tại thao trường, xưởng thực hành', helperText: 'Một tiết tại thao trường, xưởng thực hành... tính 1.5 giờ', unit: 'tiết', baseHour: 1.5 },
  { id: 'master_teaching', category: '1. Giảng dạy & Hướng dẫn trực tiếp', label: 'Đào tạo sau ĐH - Thạc sĩ', helperText: 'Một tiết giảng trình độ Thạc sĩ tính 1.5 giờ', unit: 'tiết', baseHour: 1.5 },
  { id: 'phd_teaching', category: '1. Giảng dạy & Hướng dẫn trực tiếp', label: 'Đào tạo sau ĐH - Tiến sĩ', helperText: 'Một tiết giảng trình độ Tiến sĩ tính 2.0 giờ', unit: 'tiết', baseHour: 2.0 },
  { id: 'foreign_language_teaching', category: '1. Giảng dạy & Hướng dẫn trực tiếp', label: 'Giảng dạy bằng tiếng nước ngoài', helperText: 'Môn không phải ngoại ngữ tính 2.0 giờ/tiết', unit: 'tiết', baseHour: 2.0 },
  { id: 'military_special_teaching', category: '1. Giảng dạy & Hướng dẫn trực tiếp', label: 'Giảng dạy môi trường quân sự đặc thù (xe tăng, tàu ngầm...)', helperText: 'Được quy đổi không vượt quá 2.0 giờ/tiết', unit: 'tiết', baseHour: 2.0 },

  // 2. Hướng dẫn tốt nghiệp, luận văn, luận án
  { id: 'project_guide', category: '2. Hướng dẫn Tốt nghiệp & Luận văn', label: 'Hướng dẫn Đồ án, Khóa luận tốt nghiệp', helperText: 'Hướng dẫn 01 đồ án tính tối đa 25 giờ', unit: 'đồ án', baseHour: 25.0 },
  { id: 'master_thesis_guide1', category: '2. Hướng dẫn Tốt nghiệp & Luận văn', label: 'Hướng dẫn luận văn Thạc sĩ - Người thứ nhất', helperText: 'Người hướng dẫn 1 hưởng tối đa 40 giờ', unit: 'học viên', baseHour: 40.0 },
  { id: 'master_thesis_guide2', category: '2. Hướng dẫn Tốt nghiệp & Luận văn', label: 'Hướng dẫn luận văn Thạc sĩ - Người thứ hai', helperText: 'Người hướng dẫn 2 hưởng tối đa 30 giờ', unit: 'học viên', baseHour: 30.0 },
  { id: 'phd_instruction1', category: '2. Hướng dẫn Tốt nghiệp & Luận văn', label: 'Hướng dẫn luận án Tiến sĩ - Người thứ nhất', helperText: 'Người hướng dẫn 1 hưởng tối đa 120 giờ', unit: 'nghiên cứu sinh', baseHour: 120.0 },
  { id: 'phd_instruction2', category: '2. Hướng dẫn Tốt nghiệp & Luận văn', label: 'Hướng dẫn luận án Tiến sĩ - Người thứ hai', helperText: 'Người hướng dẫn 2 hưởng tối đa 80 giờ', unit: 'nghiên cứu sinh', baseHour: 80.0 },

  // 3. Công tác khảo thí
  { id: 'exam_writing_choice', category: '3. Công tác Khảo thí', label: 'Biên soạn đề thi trắc nghiệm (kèm đáp án)', helperText: 'Tính 2.0 giờ/đề', unit: 'đề', baseHour: 2.0 },
  { id: 'exam_writing_essay', category: '3. Công tác Khảo thí', label: 'Biên soạn đề thi tự luận (kèm đáp án)', helperText: 'Tính 1.5 giờ/đề', unit: 'đề', baseHour: 1.5 },
  { id: 'exam_writing_practical', category: '3. Công tác Khảo thí', label: 'Biên soạn đề thi thực hành (kèm đáp án)', helperText: 'Tính 1.0 giờ/đề', unit: 'đề', baseHour: 1.0 },
  { id: 'exam_writing_oral', category: '3. Công tác Khảo thí', label: 'Biên soạn đề thi vấn đáp (kèm đáp án)', helperText: 'Tính 0.75 giờ/đề', unit: 'đề', baseHour: 0.75 },
  { id: 'exam_proctoring', category: '3. Công tác Khảo thí', label: 'Coi thi kết thúc học phần', helperText: 'Tính 0.3 giờ/tiết coi thi', unit: 'tiết', baseHour: 0.3 },
  { id: 'exam_grading_choice', category: '3. Công tác Khảo thí', label: 'Chấm thi bài trắc nghiệm học phần', helperText: 'Tính 0.1 giờ/bài', unit: 'bài', baseHour: 0.1 },
  { id: 'exam_grading_essay', category: '3. Công tác Khảo thí', label: 'Chấm thi bài tự luận học phần', helperText: 'Tính 0.2 giờ/bài', unit: 'bài', baseHour: 0.2 },
  { id: 'exam_grading_oral_lecture', category: '3. Công tác Khảo thí', label: 'Chấm thi vấn đáp/thực hành - Tại giảng đường', helperText: 'Tính 0.5 giờ/tiết', unit: 'tiết', baseHour: 0.5 },
  { id: 'exam_grading_oral_field', category: '3. Công tác Khảo thí', label: 'Chấm thi vấn đáp/thực hành - Tại thao trường, xưởng', helperText: 'Tính 0.75 giờ/tiết', unit: 'tiết', baseHour: 0.75 },

  // 4. Công tác thi tốt nghiệp và Hội đồng đánh giá
  { id: 'grad_exam_writing_choice', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Biên soạn đề thi tốt nghiệp trắc nghiệm', helperText: 'Tính 2.5 giờ/đề', unit: 'đề', baseHour: 2.5 },
  { id: 'grad_exam_writing_essay', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Biên soạn đề thi tốt nghiệp tự luận', helperText: 'Tính 2.0 giờ/đề', unit: 'đề', baseHour: 2.0 },
  { id: 'grad_exam_writing_practical', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Biên soạn đề thi tốt nghiệp thực hành', helperText: 'Tính 1.5 giờ/đề', unit: 'đề', baseHour: 1.5 },
  { id: 'grad_exam_writing_oral', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Biên soạn đề thi tốt nghiệp vấn đáp', helperText: 'Tính 1.25 giờ/đề', unit: 'đề', baseHour: 1.25 },
  { id: 'grad_exam_proctoring', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Coi thi tốt nghiệp', helperText: 'Tính 0.5 giờ/tiết', unit: 'tiết', baseHour: 0.5 },
  { id: 'grad_exam_grading_choice', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Chấm thi tốt nghiệp bài trắc nghiệm', helperText: 'Tính 0.2 giờ/bài', unit: 'bài', baseHour: 0.2 },
  { id: 'grad_exam_grading_essay', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Chấm thi tốt nghiệp bài tự luận', helperText: 'Tính 0.4 giờ/bài', unit: 'bài', baseHour: 0.4 },
  { id: 'grad_exam_grading_oral_lecture', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Chấm thi tốt nghiệp vấn đáp/thực hành - Giảng đường', helperText: 'Tính 1.0 giờ/tiết', unit: 'tiết', baseHour: 1.0 },
  { id: 'grad_exam_grading_oral_field', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Chấm thi tốt nghiệp vấn đáp/thực hành - Thao trường, xưởng', helperText: 'Tính 1.2 giờ/tiết', unit: 'tiết', baseHour: 1.2 },
  { id: 'grad_project_grading', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Chấm đồ án/khóa luận tốt nghiệp', helperText: 'Tính 1.5 giờ/đồ án', unit: 'đồ án', baseHour: 1.5 },
  { id: 'master_council_member', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Hội đồng nhận xét luận văn Thạc sĩ (thành viên)', helperText: 'Tính 3.0 giờ/buổi bảo vệ', unit: 'buổi bảo vệ', baseHour: 3.0 },
  { id: 'phd_council_member', category: '4. Thi Tốt nghiệp & Hội đồng', label: 'Hội đồng nhận xét luận án Tiến sĩ (thành viên)', helperText: 'Tính 6.0 giờ/buổi bảo vệ', unit: 'buổi bảo vệ', baseHour: 6.0 }
];

// Helper to translate categories
export const getTeachingTypeName = (type: string): string => {
  const matched = TEACHING_ACTIVITIES.find(a => a.id === type);
  if (matched) return matched.label;
  switch (type) {
    case 'theoretical': return 'Lý thuyết';
    case 'practical': return 'Thực hành / Thí nghiệm';
    case 'project': return 'Đồ án / Khóa luận tốt nghiệp';
    case 'master_thesis': return 'Hướng dẫn Thạc sĩ';
    case 'phd_instruction': return 'Hướng dẫn Nghiên cứu sinh';
    default: return type;
  }
};

export const ACTIVITY_DATA = [
  {
    category: "Đề tài nghiên cứu",
    items: [
      { id: "dt_cs_truong", label: "Cấp Cơ sở (Hiệu trưởng phê duyệt)", points: 1200 },
      { id: "dt_cs_tongcuc", label: "Cấp Cơ sở (BTTM/TC phê duyệt)", points: 1800 },
      { id: "dt_bo", label: "Cấp Bộ", points: 2400 },
      { id: "dt_qg", label: "Cấp Quốc gia", points: 3600 },
    ]
  },
  {
    category: "Sáng kiến",
    items: [
      { id: "sk_tu_tuc_xs", label: "Sáng kiến tự túc - Xuất sắc", points: 300 },
      { id: "sk_tu_tuc_kha", label: "Sáng kiến tự túc - Khá", points: 250 },
      { id: "sk_tu_tuc_dat", label: "Sáng kiến tự túc - Đạt", points: 200 },
      { id: "sk_cs_truong", label: "Sáng kiến cấp Cơ sở (Hiệu trưởng phê duyệt)", points: 300 },
      { id: "sk_cs_tongcuc", label: "Sáng kiến cấp Cơ sở (Tổng cục phê duyệt)", points: 450 },
      { id: "sk_bo", label: "Sáng kiến cấp Bộ", points: 600 },
      { id: "sk_qg", label: "Sáng kiến cấp Quốc gia", points: 900 },
    ]
  },
  {
    category: "Báo cáo / Hội thảo",
    items: [
      { id: "bc_khoa", label: "Báo cáo hội thảo cấp Khoa", points: 100 },
      { id: "bc_truong", label: "Báo cáo hội thảo cấp Trường", points: 200 },
      { id: "bc_cs_tc", label: "Báo cáo hội thảo cấp Cơ sở (TC)", points: 300 },
      { id: "bc_bo", label: "Báo cáo hội thảo cấp Bộ", points: 450 },
      { id: "bc_qg", label: "Báo cáo hội thảo cấp Quốc gia", points: 600 },
    ]
  },
  {
    category: "Giáo trình & Tài liệu",
    items: [
      { id: "gt_tl", label: "Giáo trình/Tài liệu dạy học/Điều lệnh", points: 1200 },
    ]
  },
  {
    category: "Bài báo khoa học",
    items: [
      { id: "bb_issn", label: "Tạp chí có mã ISSN", points: 300 },
      { id: "bb_hdgsnn", label: "Tạp chí tính điểm HĐGSNN", points: 600 },
      { id: "bb_isi_q1", label: "ISI/Scopus - Xếp hạng Q1", points: 1200 },
      { id: "bb_isi_q23", label: "ISI/Scopus - Xếp hạng Q2, Q3", points: 1000 },
      { id: "bb_isi_q4", label: "ISI/Scopus - Xếp hạng Q4", points: 800 },
    ]
  },
  {
    category: "Hướng dẫn & Olympic",
    items: [
      { id: "hd_cs_xs", label: "Hướng dẫn HV NCKH cấp Cơ sở - Xuất sắc", points: 75 },
      { id: "hd_cs_dat", label: "Hướng dẫn HV NCKH cấp Cơ sở - Đạt", points: 30 },
      { id: "ol_nhat", label: "Giải Nhất Olympic/Hội thi Toàn quân/Quốc", points: 300 },
      { id: "ol_nhi", label: "Giải Nhì Olympic/Hội thi Toàn quân/Quốc", points: 250 },
      { id: "ol_ba", label: "Giải Ba Olympic/Hội thi Toàn quân/Quốc", points: 200 },
    ]
  },
  {
    category: "Hội đồng & Tham dự",
    items: [
      { id: "hd_cuong", label: "Hội đồng thông qua đề cương", points: 3 },
      { id: "hd_nghiemthu", label: "Hội đồng nghiệm thu sản phẩm", points: 6 },
      { id: "td_khoa", label: "Tham dự hội thảo cấp Khoa", points: 3 },
      { id: "td_truong", label: "Tham dự hội thảo cấp Trường", points: 4 },
    ]
  }
];

const formatNum = (num: number): number => {
  return Math.round(num * 10) / 10;
};

// Tính giờ cá nhân NCKH
export const calculateNCKHPersonal = (
  basePoints: number,
  quantity: number,
  years: number,
  members: number,
  role: 'main' | 'co_author' | 'leader' | 'member'
): number => {
  if (!years || years <= 0) return 0;
  const total = (Number(basePoints) * Number(quantity)) / Number(years);
  const m = Number(members);

  if (m <= 1) return formatNum(total);

  let share = 0;
  if (m === 2) {
    share = role === "main" ? (2 / 3) * total : (1 / 3) * total;
  } else if (m === 3) {
    share = role === "main" ? (1 / 2) * total : (1 / 4) * total;
  } else {
    // >3 members
    share = role === "main"
      ? (1 / 3) * total + ((2 / 3) * total) / m
      : ((2 / 3) * total) / m;
  }
  return formatNum(share);
};

export const getResearchTypeName = (type: string): string => {
  // Find in ACTIVITY_DATA first
  for (const cat of ACTIVITY_DATA) {
    const matched = cat.items.find(item => item.id === type);
    if (matched) return matched.label;
  }

  switch (type) {
    case 'isi_scopus_q1': return 'Bài báo ISI/Scopus Q1';
    case 'isi_scopus_q2_q4': return 'Bài báo ISI/Scopus Q2-Q4';
    case 'international_journal': return 'Tạp chí Quốc tế khác';
    case 'national_journal_075': return 'Tạp chí Trong nước (Điểm ≥ 0.75)';
    case 'national_journal_05': return 'Tạp chí Trong nước (Điểm < 0.75)';
    case 'book_compilation': return 'Viết / Biên soạn sách, giáo trình';
    case 'patent': return 'Bằng độc quyền sáng chế / GPHI';
    case 'project_national': return 'Đề tài nghiên cứu cấp Nhà nước';
    case 'project_ministry': return 'Đề tài nghiên cứu cấp Bộ / Tỉnh';
    case 'project_university': return 'Đề tài nghiên cứu cấp Cơ sở';
    case 'student_research_guide': return 'Hướng dẫn Sinh viên NCKH (đạt giải)';
    default: return type;
  }
};

export const getRoleName = (role: string): string => {
  switch (role) {
    case 'main': return 'Tác giả chính / Liên hệ';
    case 'co_author': return 'Tham gia';
    case 'leader': return 'Chủ trì / Chủ nhiệm';
    case 'member': return 'Thành viên tham gia';
    default: return role;
  }
};

export const getRankString = (rank: string): string => {
  switch (rank) {
    case 'GS': return 'Giáo sư';
    case 'PGS': return 'Phó Giáo sư';
    case 'TS': return 'Tiến sĩ';
    case 'ThS': return 'Thạc sĩ';
    case 'CN': return 'Cử nhân / Kỹ sư';
    default: return rank;
  }
};

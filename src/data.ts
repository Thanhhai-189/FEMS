import { Teacher, TeachingLog, ResearchLog, RankNorm, AcademicYearConfig, DepartmentConfig } from './types';

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
  { rank: 'ThS', rankName: 'Thạc sĩ', teachingNorm: 270, researchNorm: 600 },
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

export const TEACHERS_SAMPLE: Teacher[] = [
  {
    id: 'GV01',
    code: 'GV.NLDCD.01',
    name: 'GS. TS. Nguyễn Văn Hùng',
    email: 'nvhung@vnua.edu.vn',
    department: 'Nguyên lý Động cơ - Điện',
    rank: 'GS',
    position: 'Chủ nhiệm khoa',
    party: 'Bí thư chi bộ',
    status: 'A',
    reductionRate: 55, // 45% norm rate = 55% reduction
    startYear: 2005,
    pedagogyCertYear: '2007',
    languageCert: 'IELTS 7.5',
    itCert: 'Tin học nâng cao',
    unitExperience: 'Cấp lữ đoàn'
  },
  {
    id: 'GV02',
    code: 'GV.NLKCOT.02',
    name: 'PGS. TS. Lê Thị Thúy',
    email: 'ltthuy@vnua.edu.vn',
    department: 'Nguyên lý Kết cấu ô tô',
    rank: 'PGS',
    position: 'Trưởng bộ môn',
    party: 'Không kiêm nhiệm',
    status: 'A',
    reductionRate: 20, // 80% norm rate = 20% reduction
    startYear: 2010,
    pedagogyCertYear: '2012',
    languageCert: 'TOEFL iBT 90',
    itCert: 'MOS Excel Expert',
    unitExperience: 'Cấp trung đoàn'
  },
  {
    id: 'GV03',
    code: 'GV.QLKT.03',
    name: 'TS. Trần Minh Quang',
    email: 'tmquang@vnua.edu.vn',
    department: 'Quản lý Khai thác',
    rank: 'TS',
    position: 'Giảng viên chính',
    status: 'A',
    reductionRate: 0,
    startYear: 2015,
    pedagogyCertYear: '2016',
    languageCert: 'B2 English',
    itCert: 'Đại học chuyên ngành',
    unitExperience: 'Cấp phân đội'
  },
  {
    id: 'GV04',
    code: 'GV.NLDCD.04',
    name: 'TS. Phạm Thanh Sơn',
    email: 'ptson@vnua.edu.vn',
    department: 'Nguyên lý Động cơ - Điện',
    rank: 'TS',
    position: 'Giảng viên',
    status: 'A',
    reductionRate: 0
  },
  {
    id: 'GV05',
    code: 'GV.NLKCOT.05',
    name: 'ThS. Nguyễn Thị Mai',
    email: 'ntmai@vnua.edu.vn',
    department: 'Nguyên lý Kết cấu ô tô',
    rank: 'ThS',
    position: 'Giảng viên',
    status: 'A',
    reductionRate: 0
  },
  {
    id: 'GV06',
    code: 'GV.NLKCOT.06',
    name: 'ThS. Hoàng Văn Nam',
    email: 'hvnam@vnua.edu.vn',
    department: 'Nguyên lý Kết cấu ô tô',
    rank: 'ThS',
    position: 'Giảng viên',
    status: 'A',
    reductionRate: 0
  },
  {
    id: 'GV07',
    code: 'GV.NLDCD.07',
    name: 'ThS. Bùi Thị Vân',
    email: 'btvan@vnua.edu.vn',
    department: 'Nguyên lý Động cơ - Điện',
    rank: 'ThS',
    position: 'Trợ giảng',
    status: 'A',
    reductionRate: 0
  },
  {
    id: 'GV08',
    code: 'GV.QLKT.08',
    name: 'CN. Đỗ Văn Đạt',
    email: 'dvdat@vnua.edu.vn',
    department: 'Quản lý Khai thác',
    rank: 'CN',
    position: 'Trợ giảng',
    status: 'A',
    reductionRate: 0
  },
  {
    id: 'GV09',
    code: 'GV.NLDCD.09',
    name: 'TS. Vũ Hoàng Dương',
    email: 'vhduong@vnua.edu.vn',
    department: 'Nguyên lý Động cơ - Điện',
    rank: 'TS',
    position: 'Giảng viên (Đang nghiên cứu sinh nước ngoài)',
    status: 'I', // Đang đi học, miễn giảm 100% giờ giảng dạy, NCKH giảm 50%
    reductionRate: 100
  }
];

export const TEACHING_LOGS_SAMPLE: TeachingLog[] = [
  // Nguyễn Văn Hùng (GS - giảm 50% định mức giờ giảng: 140 * 0.5 = 70 giờ)
  {
    id: 'T001',
    teacherId: 'GV01',
    subjectCode: 'CS401',
    subjectName: 'Trí tuệ Nhân tạo Nâng cao',
    className: 'K65KHMT',
    credits: 3,
    studentCount: 45,
    type: 'theoretical',
    coefficient: 1.0,
    actualHours: 45,
    convertedHours: 45,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T002',
    teacherId: 'GV01',
    subjectCode: 'CS501',
    subjectName: 'Hướng dẫn Nghiên cứu chuyên sâu',
    className: 'CH24A',
    credits: 2,
    studentCount: 12,
    type: 'master_thesis',
    coefficient: 1.5,
    actualHours: 30,
    convertedHours: 45,
    semester: 'HK2',
    academicYear: '2024-2025'
  },

  // Lê Thị Thúy (PGS - giảm 30% định mức giảng dạy: 180 * 0.7 = 126 giờ)
  {
    id: 'T003',
    teacherId: 'GV02',
    subjectCode: 'SE302',
    subjectName: 'Kiến trúc Phần mềm',
    className: 'K66KTPM1',
    credits: 3,
    studentCount: 95, // Lớp đông
    type: 'theoretical',
    coefficient: 1.2, // Hệ số lớp đông
    actualHours: 45,
    convertedHours: 54,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T004',
    teacherId: 'GV02',
    subjectCode: 'SE499',
    subjectName: 'Hướng dẫn Đồ án tốt nghiệp',
    className: 'K65KTPM',
    credits: 4,
    studentCount: 5, // 5 sinh viên
    type: 'project',
    coefficient: 0.5, // 1 SV đồ án TN = 15 giờ quy đổi
    actualHours: 60,
    convertedHours: 75, // Quy sang giờ chuẩn hướng dẫn: 15 giờ/SV * 5 = 75 giờ
    semester: 'HK2',
    academicYear: '2024-2025'
  },

  // Trần Minh Quang (TS - định mức 220 giờ)
  {
    id: 'T005',
    teacherId: 'GV03',
    subjectCode: 'IS201',
    subjectName: 'Cơ sở dữ liệu',
    className: 'K67HTTT',
    credits: 3,
    studentCount: 110, // Lớp siêu đông
    type: 'theoretical',
    coefficient: 1.3,
    actualHours: 45,
    convertedHours: 58.5,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T006',
    teacherId: 'GV03',
    subjectCode: 'IS201',
    subjectName: 'Thực hành Cơ sở dữ liệu',
    className: 'K67HTTT_TH1',
    credits: 1,
    studentCount: 35,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 30,
    convertedHours: 20.1,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T007',
    teacherId: 'GV03',
    subjectCode: 'IS201',
    subjectName: 'Thực hành Cơ sở dữ liệu',
    className: 'K67HTTT_TH2',
    credits: 1,
    studentCount: 38,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 30,
    convertedHours: 20.1,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T008',
    teacherId: 'GV03',
    subjectCode: 'IS305',
    subjectName: 'Phân tích & Thiết kế HTTT',
    className: 'K66HTTT',
    credits: 3,
    studentCount: 65,
    type: 'theoretical',
    coefficient: 1.0,
    actualHours: 45,
    convertedHours: 45,
    semester: 'HK2',
    academicYear: '2024-2025'
  },
  {
    id: 'T009',
    teacherId: 'GV03',
    subjectCode: 'IS499',
    subjectName: 'Đồ án Chuyên ngành HTTT',
    className: 'K65HTTT',
    credits: 2,
    studentCount: 6,
    type: 'project',
    coefficient: 0.5,
    actualHours: 30,
    convertedHours: 45, // 6 SV * 7.5 giờ/SV = 45 giờ
    semester: 'HK2',
    academicYear: '2024-2025'
  },

  // Phạm Thanh Sơn (TS - Định mức 220 giờ)
  {
    id: 'T010',
    teacherId: 'GV04',
    subjectCode: 'SEC301',
    subjectName: 'Mật mã học cơ sở',
    className: 'K66ATTT',
    credits: 3,
    studentCount: 75,
    type: 'theoretical',
    coefficient: 1.0,
    actualHours: 45,
    convertedHours: 45,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T011',
    teacherId: 'GV04',
    subjectCode: 'SEC402',
    subjectName: 'An ninh Hệ điều hành',
    className: 'K65ATTT',
    credits: 3,
    studentCount: 50,
    type: 'theoretical',
    coefficient: 1.0,
    actualHours: 45,
    convertedHours: 45,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T012',
    teacherId: 'GV04',
    subjectCode: 'SEC420',
    subjectName: 'Thực hành Hacker Mũ Trắng',
    className: 'K65ATTT_TH',
    credits: 2,
    studentCount: 45,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 60,
    convertedHours: 40.2,
    semester: 'HK2',
    academicYear: '2024-2025'
  },

  // Nguyễn Thị Mai (ThS - Định mức 270 giờ)
  {
    id: 'T013',
    teacherId: 'GV05',
    subjectCode: 'NET101',
    subjectName: 'Nhập môn Mạng máy tính',
    className: 'K68MMT',
    credits: 3,
    studentCount: 135, // Lớp rất đông
    type: 'theoretical',
    coefficient: 1.5,
    actualHours: 45,
    convertedHours: 67.5,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T014',
    teacherId: 'GV05',
    subjectCode: 'NET101',
    subjectName: 'Thực hành Nhập môn Mạng',
    className: 'K68MMT_TH1',
    credits: 1,
    studentCount: 45,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 35,
    convertedHours: 23.45,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T015',
    teacherId: 'GV05',
    subjectCode: 'NET101',
    subjectName: 'Thực hành Nhập môn Mạng',
    className: 'K68MMT_TH2',
    credits: 1,
    studentCount: 45,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 35,
    convertedHours: 23.45,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T016',
    teacherId: 'GV05',
    subjectCode: 'NET101',
    subjectName: 'Thực hành Nhập môn Mạng',
    className: 'K68MMT_TH3',
    credits: 1,
    studentCount: 45,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 35,
    convertedHours: 23.45,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T017',
    teacherId: 'GV05',
    subjectCode: 'NET302',
    subjectName: 'Mạng Máy Tính Nâng Cao',
    className: 'K66MMT',
    credits: 3,
    studentCount: 82,
    type: 'theoretical',
    coefficient: 1.2,
    actualHours: 45,
    convertedHours: 54,
    semester: 'HK2',
    academicYear: '2024-2025'
  },
  {
    id: 'T018',
    teacherId: 'GV05',
    subjectCode: 'NET302',
    subjectName: 'Thực hành Mạng Nâng cao',
    className: 'K66MMT_TH1',
    credits: 1,
    studentCount: 41,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 30,
    convertedHours: 20.1,
    semester: 'HK2',
    academicYear: '2024-2025'
  },
  {
    id: 'T019',
    teacherId: 'GV05',
    subjectCode: 'NET302',
    subjectName: 'Thực hành Mạng Nâng cao',
    className: 'K66MMT_TH2',
    credits: 1,
    studentCount: 41,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 30,
    convertedHours: 20.1,
    semester: 'HK2',
    academicYear: '2024-2025'
  },

  // Hoàng Văn Nam (ThS - Định mức 270 giờ)
  {
    id: 'T020',
    teacherId: 'GV06',
    subjectCode: 'SE201',
    subjectName: 'Công nghệ phần mềm',
    className: 'K67KTPM',
    credits: 3,
    studentCount: 125,
    type: 'theoretical',
    coefficient: 1.5,
    actualHours: 45,
    convertedHours: 67.5,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T021',
    teacherId: 'GV06',
    subjectCode: 'SE310',
    subjectName: 'Kiểm thử Phần mềm',
    className: 'K66KTPM2',
    credits: 3,
    studentCount: 85,
    type: 'theoretical',
    coefficient: 1.2,
    actualHours: 45,
    convertedHours: 54,
    semester: 'HK2',
    academicYear: '2024-2025'
  },

  // Bùi Thị Vân (ThS - Định mức 270 giờ)
  {
    id: 'T022',
    teacherId: 'GV07',
    subjectCode: 'CS101',
    subjectName: 'Tin học cơ sở',
    className: 'K69MT1',
    credits: 3,
    studentCount: 150, // Lớp rất đông
    type: 'theoretical',
    coefficient: 1.5,
    actualHours: 45,
    convertedHours: 67.5,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T023',
    teacherId: 'GV07',
    subjectCode: 'CS101',
    subjectName: 'Thực hành Tin học cơ sở',
    className: 'K69MT1_TH1',
    credits: 1,
    studentCount: 50,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 30,
    convertedHours: 20.1,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T024',
    teacherId: 'GV07',
    subjectCode: 'CS101',
    subjectName: 'Thực hành Tin học cơ sở',
    className: 'K69MT1_TH2',
    credits: 1,
    studentCount: 50,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 30,
    convertedHours: 20.1,
    semester: 'HK1',
    academicYear: '2024-2025'
  },
  {
    id: 'T025',
    teacherId: 'GV07',
    subjectCode: 'CS101',
    subjectName: 'Thực hành Tin học cơ sở',
    className: 'K69MT1_TH3',
    credits: 1,
    studentCount: 50,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 30,
    convertedHours: 20.1,
    semester: 'HK1',
    academicYear: '2024-2025'
  },

  // Đỗ Văn Đạt (CN - Định mức 300 giờ)
  {
    id: 'T026',
    teacherId: 'GV08',
    subjectCode: 'SEC101',
    subjectName: 'Thực tập Kỹ thuật An toàn mạng',
    className: 'K66ATTT_TT',
    credits: 3,
    studentCount: 42,
    type: 'practical',
    coefficient: 0.67,
    actualHours: 90,
    convertedHours: 60.3,
    semester: 'HK1',
    academicYear: '2024-2025'
  }
];

export const RESEARCH_LOGS_SAMPLE: ResearchLog[] = [
  // Nguyễn Văn Hùng (GS - Nghiên cứu định mức: 300 * 0.5 = 150 giờ)
  {
    id: 'R001',
    teacherId: 'GV01',
    title: 'A Deep Learning Approach for Rice Disease Classification',
    type: 'isi_scopus_q1',
    role: 'main',
    points: 10,
    convertedHours: 250,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'Computers and Electronics in Agriculture',
    status: 'approved',
    notes: 'Bài báo uy tín tạp chí hạng Q1 Elsevier.'
  },
  {
    id: 'R002',
    teacherId: 'GV01',
    title: 'Đề tài Nghiên cứu Quốc gia về Ứng dụng AI trong Dự báo Khí tượng Thủy văn',
    type: 'project_national',
    role: 'leader',
    points: 20,
    convertedHours: 400,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'Bộ Khoa học và Công nghệ',
    status: 'approved',
    notes: 'Đề tài cấp nhà nước, chủ trì.'
  },

  // Lê Thị Thúy (PGS - Nghiên cứu định mức: 260 * 0.7 = 182 giờ)
  {
    id: 'R003',
    teacherId: 'GV02',
    title: 'Evaluating Software Architecture Metrics in Microservices',
    type: 'isi_scopus_q2_q4',
    role: 'main',
    points: 8,
    convertedHours: 200,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'IEEE Access',
    status: 'approved',
    notes: 'Tạp chí Q2 Scopus.'
  },
  {
    id: 'R004',
    teacherId: 'GV02',
    title: 'Giáo trình Kiến trúc và Phát triển Hệ thống Phần mềm Hiện đại',
    type: 'book_compilation',
    role: 'leader',
    points: 9,
    convertedHours: 180,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'NXB Bách Khoa',
    status: 'approved',
    notes: 'Chủ biên giáo trình đã nghiệm thu cấp trường.'
  },

  // Trần Minh Quang (TS - 220 giờ)
  {
    id: 'R005',
    teacherId: 'GV03',
    title: 'Phát triển hệ thống thông tin địa lý GIS hỗ trợ nông nghiệp thông minh',
    type: 'project_ministry',
    role: 'member',
    points: 4,
    convertedHours: 80,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'Bộ Nông nghiệp và PTNT',
    status: 'approved',
    notes: 'Thành viên đề tài cấp Bộ.'
  },
  {
    id: 'R006',
    teacherId: 'GV03',
    title: 'Hướng dẫn nhóm SV đạt giải Nhất NCKH cấp Trường',
    type: 'student_research_guide',
    role: 'leader',
    points: 4,
    convertedHours: 80,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'Hội đồng Khoa học Trường',
    status: 'approved',
    notes: 'Học viên K65HTTT.'
  },

  // Phạm Thanh Sơn (TS - 220 giờ)
  {
    id: 'R007',
    teacherId: 'GV04',
    title: 'A Novel Lightweight Encryption Method for loT Grid Devices',
    type: 'international_journal',
    role: 'main',
    points: 7,
    convertedHours: 150,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'Journal of Computer Security',
    status: 'approved'
  },
  {
    id: 'R008',
    teacherId: 'GV04',
    title: 'Đề tài thiết kế Module mật mã bảo mật thông tin nội bộ khoa',
    type: 'project_university',
    role: 'leader',
    points: 6,
    convertedHours: 120,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'Hội đồng Khoa học Trường',
    status: 'approved'
  },

  // Nguyễn Thị Mai (ThS - 140 giờ)
  {
    id: 'R009',
    teacherId: 'GV05',
    title: 'Phân tích hiệu năng giao thức định tuyến trong mạng cảm biến không dây',
    type: 'national_journal_075',
    role: 'main',
    points: 5,
    convertedHours: 100,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'Tạp chí Tin học và Điều khiển học',
    status: 'approved'
  },

  // Hoàng Văn Nam (ThS - 140 giờ)
  {
    id: 'R010',
    teacherId: 'GV06',
    title: 'Phương pháp kiểm thử tự động giao diện dựa trên Machine Learning',
    type: 'national_journal_05',
    role: 'main',
    points: 3,
    convertedHours: 60,
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'Tạp chí Khoa học và Công nghệ',
    status: 'approved'
  },

  // Vũ Hoàng Dương (TS - Đang đi học, được miễn giảm định mức 100% giảng dạy nhưng chỉ miễn giảm 50% NCKH: Định mức còn 110 giờ NCKH)
  {
    id: 'R011',
    teacherId: 'GV09',
    title: 'Federated Learning for Edge Computing Devices: A Survey',
    type: 'isi_scopus_q2_q4',
    role: 'co_author',
    points: 4,
    convertedHours: 100, // Tác giả phụ hưởng 50% giờ quy đổi: 200 * 0.5 = 100
    publicationYear: '2024',
    period: '2024-2025',
    journalOrOrganization: 'Computer Science Review',
    status: 'approved'
  }
];

// Helper to translate categories
export const getTeachingTypeName = (type: string): string => {
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
    case 'co_author': return 'Đồng tác giả';
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

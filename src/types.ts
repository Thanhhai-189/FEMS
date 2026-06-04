export type AcademicRank = 'GS' | 'PGS' | 'TS' | 'ThS' | 'CN' | 'KS';

export interface RankNorm {
  rank: AcademicRank;
  rankName: string;
  teachingNorm: number; // Định mức giờ giảng (giờ quy chuẩn)
  researchNorm: number; // Định mức giờ NCKH (giờ quy chuẩn)
}

export interface Teacher {
  id: string;
  code: string; // Mã giảng viên
  name: string;
  email: string;
  department: string; // Bộ môn: Kỹ thuật phần mềm, Hệ thống thông tin, An ninh mạng, v.v.
  rank: AcademicRank; // Học hàm/Học vị
  position: string; // Giảng viên, Giảng viên chính, Trợ giảng, Trưởng bộ môn, v.v.
  party?: string; // Không kiêm nhiệm, Bí thư chi bộ, Phó Bí thư chi bộ, v.v.
  status: 'A' | 'I'; // Hoạt động (Active) / Nghỉ thai sản, đi học (Inactive) - để giảm trừ định mức
  reductionRate: number; // Tỷ lệ giảm trừ định mức (%) - ví dụ làm quản lý giảm 30%, thai sản giảm 50%
  startYear?: number; // Năm bắt đầu giảng dạy để tính thời gian giữ ngạch, công tác
  masterObtainYear?: number; // Năm nhận học vị Thạc sĩ
  phdObtainYear?: number; // Năm nhận học vị Tiến sĩ
  pedagogyCertYear?: string; // Năm cấp chứng chỉ nghiệp vụ sư phạm
  languageCert?: string; // Chứng chỉ ngoại ngữ
  itCert?: string; // Chứng chỉ tin học
  unitExperience?: string; // Thực tế đơn vị (Cấp phân đội, Trung đoàn, Lữ đoàn...)
  unitExperienceYear?: string; // Năm đi thực tế đơn vị
  phone?: string; // Số điện thoại
  academicTitle?: string; // Chức danh
  academicTitleYear?: string; // Năm nhận chức danh
  gvgYears?: string; // Các năm đạt danh hiệu Giảng viên giỏi
  notes?: string; // Ghi chú thêm/ghi nhớ mật khẩu từ admin
}

/**
 * WorkHistory: Lưu trữ quá trình công tác của giảng viên theo từng năm học.
 * Đây là hồ sơ gốc để khi lọc lấy dữ liệu theo năm lịch sử.
 */
export interface WorkHistory {
  id: string;
  teacherId: string;
  academicYear: string;      // Năm học, vd: "2025-2026"
  department: string;        // Đơn vị công tác
  position: string;          // Chức vụ
  academicTitle: string;     // Chức danh chuyên môn
  rank: AcademicRank;        // Học vị trong năm đó
  reductionRate: number;     // Tỷ lệ giảm trừ (%)
  status: 'A' | 'I';        // Trạng thái hoạt động
  party: string;             // Chức vụ Đảng (nếu có)
  createdBy?: string;        // Người tạo (admin)
  createdAt?: number;        // Timestamp
}

export type TeachingType = 
  | 'theoretical'
  | 'practical_day_lab'
  | 'theoretical_night'
  | 'practical_night_lab'
  | 'master_teaching'
  | 'phd_teaching'
  | 'foreign_language_teaching'
  | 'military_special_teaching'
  | 'project_guide'
  | 'master_thesis_guide1'
  | 'master_thesis_guide2'
  | 'phd_instruction1'
  | 'phd_instruction2'
  | 'exam_writing_choice'
  | 'exam_writing_essay'
  | 'exam_writing_practical'
  | 'exam_writing_oral'
  | 'exam_proctoring'
  | 'exam_grading_choice'
  | 'exam_grading_essay'
  | 'exam_grading_oral_lecture'
  | 'exam_grading_oral_field'
  | 'grad_exam_writing_choice'
  | 'grad_exam_writing_essay'
  | 'grad_exam_writing_practical'
  | 'grad_exam_writing_oral'
  | 'grad_exam_proctoring'
  | 'grad_exam_grading_choice'
  | 'grad_exam_grading_essay'
  | 'grad_exam_grading_oral_lecture'
  | 'grad_exam_grading_oral_field'
  | 'grad_project_grading'
  | 'master_council_member'
  | 'phd_council_member'
  | string;

export interface TeachingLog {
  id: string;
  teacherId: string;
  subjectCode: string;
  subjectName: string;
  className: string;
  credits: number;
  studentCount: number;
  type: TeachingType; // Lý thuyết, Thực hành, Đồ án, Thạc sĩ, Tiến sĩ
  coefficient: number; // Hệ số quy đổi (ví dụ: thực hành hệ số 0.67, lớp đông cộng thêm, v.v.)
  actualHours: number; // Số giờ giảng dạy thực tế trên lớp (ví dụ: 3 tín chỉ lý thuyết = 45 giờ)
  convertedHours: number; // Số giờ quy đổi = actualHours * coefficient
  semester: 'HK1' | 'HK2' | 'HK3';
  academicYear: string; // Ví dụ: 2024-2025
}

export type ResearchType = string;

export interface ResearchLog {
  id: string;
  teacherId: string;
  title: string; // Tên công trình / bài báo / đề tài
  type: ResearchType;
  role: 'main' | 'co_author' | 'leader' | 'member'; // Vai trò: Tác giả chính, Đồng tác giả, Chủ trì, Thành viên
  points: number; // Số điểm khoa học
  convertedHours: number; // Giờ quy đổi từ điểm hoặc tính trực tiếp
  publicationYear: string;
  period: string; // Ví dụ học kỳ/vòng đánh giá
  journalOrOrganization: string; // Tên tạp chí, nhà xuất bản hoặc quỹ quản lý đề tài
  status: 'pending' | 'approved' | 'rejected'; // Trạng thái phê duyệt minh chứng
  notes?: string;
  years?: number; // Số năm thực hiện
  members?: number; // Số thành viên tham gia
  quantity?: number; // Số lượng đề tài/bài báo
}

export interface AcademicYearConfig {
  id: string;
  year: string;
  isActive: boolean;
}

export interface DepartmentConfig {
  id: string;
  name: string;
}
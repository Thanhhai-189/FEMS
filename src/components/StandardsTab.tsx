import { useState, useMemo } from 'react';
import { Teacher, ResearchLog } from '../types';
import { ACTIVITY_DATA, getRankString } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  MapPin, 
  Clock, 
  FileCode2, 
  Lightbulb, 
  BookOpen, 
  Globe2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Building2, 
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  UserCheck
} from 'lucide-react';

interface StandardsTabProps {
  teachers: Teacher[];
  researchLogs: ResearchLog[];
}

export default function StandardsTab({ teachers, researchLogs }: StandardsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [targetTitleFilter, setTargetTitleFilter] = useState<'all' | 'GV' | 'GVC' | 'GVCC'>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  // 1. Unique Departments list
  const departments = useMemo(() => {
    return Array.from(new Set(teachers.map((t) => t.department)));
  }, [teachers]);

  // 2. Evaluator Logic: Check teachers against Professional Title Standards
  const evaluatedTeachers = useMemo(() => {
    return teachers.map((teacher) => {
      const teachingYears = teacher.startYear ? (currentYear - teacher.startYear) : 0;
      
      // Determine military unit experience
      const hasUnitExp = !!(
        teacher.unitExperience && 
        teacher.unitExperience.trim() !== '' && 
        teacher.unitExperience !== 'Chưa đi'
      );
      const unitExpText = hasUnitExp 
        ? `${teacher.unitExperience} (${teacher.unitExperienceYear || 'Chưa rõ năm'})` 
        : 'Chưa đi thực hành thực tế đơn vị';

      // Parse approved research logs
      const approvedLogs = researchLogs.filter(
        (log) => log.teacherId === teacher.id && log.status === 'approved'
      );

      // --- 1. OVERALL/LIFETIME STATISTICS FOR TABLE DISPLAY ---
      const lifetimeProjects = approvedLogs.filter((log) => {
        const isProjectCode = log.type.startsWith('dt_') || log.type.startsWith('project_');
        const inProjectCategory = ACTIVITY_DATA.find(c => c.category === "Đề tài nghiên cứu")
          ?.items.some(item => item.id === log.type);
        const hasProjectKeyword = log.title.toLowerCase().includes('đề tài');
        return isProjectCode || inProjectCategory || hasProjectKeyword;
      });

      const lifetimeProjectLeaderCount = lifetimeProjects.filter(l => l.role === 'leader' || l.role === 'main').length;
      const lifetimeProjectMemberCount = lifetimeProjects.filter(l => l.role === 'member' || l.role === 'co_author').length;

      const lifetimeInitiatives = approvedLogs.filter((log) => {
        const isInitiativeCode = log.type.startsWith('sk_') || log.type.startsWith('initiative_');
        const inInitiativeCategory = ACTIVITY_DATA.find(c => c.category === "Sáng kiến")
          ?.items.some(item => item.id === log.type);
        const hasInitiativeKeyword = log.title.toLowerCase().includes('sáng kiến');
        return isInitiativeCode || inInitiativeCategory || hasInitiativeKeyword;
      });
      const lifetimeInitiativeCount = lifetimeInitiatives.length;

      const lifetimeArticles = approvedLogs.filter((log) => {
        const isArticleCode = log.type.startsWith('bb_') || log.type.startsWith('isi_') || log.type.startsWith('international_journal') || log.type.startsWith('national_journal');
        const inArticleCategory = ACTIVITY_DATA.find(c => c.category === "Bài báo khoa học")
          ?.items.some(item => item.id === log.type);
        const hasArticleKeyword = log.title.toLowerCase().includes('bài báo') || log.title.toLowerCase().includes('tạp chí');
        return isArticleCode || inArticleCategory || hasArticleKeyword;
      });

      const lifetimeInternationalArticles = lifetimeArticles.filter(log => {
        const isIntCode = log.type.startsWith('bb_isi') || log.type.includes('isi') || log.type.includes('scopus') || log.type.startsWith('international_');
        const isIntTitle = log.title.toLowerCase().includes('isi') || log.title.toLowerCase().includes('scopus') || log.title.toLowerCase().includes('international');
        return isIntCode || isIntTitle;
      });
      const lifetimeDomesticArticles = lifetimeArticles.length - lifetimeInternationalArticles.length;

      const lifetimeBooks = approvedLogs.filter((log) => {
        const isBookCode = log.type === 'gt_tl' || log.type === 'book_compilation';
        const inBookCategory = ACTIVITY_DATA.find(c => c.category === "Giáo trình & Tài liệu")
          ?.items.some(item => item.id === log.type);
        const hasBookKeyword = log.title.toLowerCase().includes('giáo trình') || log.title.toLowerCase().includes('sách chuyên khảo');
        return isBookCode || inBookCategory || hasBookKeyword;
      });
      const lifetimeBookLeaderCount = lifetimeBooks.filter(l => l.role === 'leader' || l.role === 'main').length;

      // --- 2. APPLIED RESET STRATEGY FOR GVC & GVCC VALS ---
      const curTitle = teacher.academicTitle || 'Không';
      const titleYearNum = teacher.academicTitleYear ? parseInt(teacher.academicTitleYear) : null;

      // Reset conditions for Giảng viên chính (GVC): only count logs published from the year they became Giảng viên
      const hasGvReset = (curTitle === 'Giảng viên' || curTitle === 'Giảng viên chính' || curTitle === 'Giảng viên cao cấp') && titleYearNum !== null;
      const gvReceiptYear = (curTitle === 'Giảng viên' && titleYearNum) ? titleYearNum : (curTitle === 'Giảng viên chính' || curTitle === 'Giảng viên cao cấp' ? (titleYearNum - 3) : null); // fallback if date missing/estimated

      const gvcApprovedLogs = approvedLogs.filter((log) => {
        if (hasGvReset && titleYearNum) {
          const pubYear = parseInt(log.publicationYear);
          // Only take achievements of or after the lecturer receipt title year
          // Let's check GVC evaluation starting from the specific appointment year
          const resetThreshold = curTitle === 'Giảng viên' ? titleYearNum : (titleYearNum - 4); // safe offset estimate for higher designations if viewed historically
          return isNaN(pubYear) || pubYear >= resetThreshold;
        }
        return true;
      });

      const gvcProjects = gvcApprovedLogs.filter((log) => {
        const isProjectCode = log.type.startsWith('dt_') || log.type.startsWith('project_');
        const inProjectCategory = ACTIVITY_DATA.find(c => c.category === "Đề tài nghiên cứu")
          ?.items.some(item => item.id === log.type);
        const hasProjectKeyword = log.title.toLowerCase().includes('đề tài');
        return isProjectCode || inProjectCategory || hasProjectKeyword;
      });
      const gvcProjectLeaderCount = gvcProjects.filter(l => l.role === 'leader' || l.role === 'main').length;
      const gvcProjectMemberCount = gvcProjects.filter(l => l.role === 'member' || l.role === 'co_author').length;

      const gvcInitiatives = gvcApprovedLogs.filter((log) => {
        const isInitiativeCode = log.type.startsWith('sk_') || log.type.startsWith('initiative_');
        const inInitiativeCategory = ACTIVITY_DATA.find(c => c.category === "Sáng kiến")
          ?.items.some(item => item.id === log.type);
        const hasInitiativeKeyword = log.title.toLowerCase().includes('sáng kiến');
        return isInitiativeCode || inInitiativeCategory || hasInitiativeKeyword;
      });
      const gvcInitiativeCount = gvcInitiatives.length;

      const gvcArticles = gvcApprovedLogs.filter((log) => {
        const isArticleCode = log.type.startsWith('bb_') || log.type.startsWith('isi_') || log.type.startsWith('international_journal') || log.type.startsWith('national_journal');
        const inArticleCategory = ACTIVITY_DATA.find(c => c.category === "Bài báo khoa học")
          ?.items.some(item => item.id === log.type);
        const hasArticleKeyword = log.title.toLowerCase().includes('bài báo') || log.title.toLowerCase().includes('tạp chí');
        return isArticleCode || inArticleCategory || hasArticleKeyword;
      });

      // Reset conditions for Giảng viên cao cấp (GVCC): only count logs published from the year they became Giảng viên chính
      const hasGvcReset = (curTitle === 'Giảng viên chính' || curTitle === 'Giảng viên cao cấp') && titleYearNum !== null;
      const gvcReceiptYearValue = (curTitle === 'Giảng viên chính' && titleYearNum) ? titleYearNum : null;

      const gvccApprovedLogs = approvedLogs.filter((log) => {
        if (hasGvcReset && titleYearNum) {
          const pubYear = parseInt(log.publicationYear);
          return isNaN(pubYear) || pubYear >= titleYearNum;
        }
        if (hasGvReset && titleYearNum) {
          // If they target GVCC but currently a GV, they still reset after their GV achievement date
          const pubYear = parseInt(log.publicationYear);
          return isNaN(pubYear) || pubYear >= titleYearNum;
        }
        return true;
      });

      const gvccProjects = gvccApprovedLogs.filter((log) => {
        const isProjectCode = log.type.startsWith('dt_') || log.type.startsWith('project_');
        const inProjectCategory = ACTIVITY_DATA.find(c => c.category === "Đề tài nghiên cứu")
          ?.items.some(item => item.id === log.type);
        const hasProjectKeyword = log.title.toLowerCase().includes('đề tài');
        return isProjectCode || inProjectCategory || hasProjectKeyword;
      });
      const gvccProjectLeaderCount = gvccProjects.filter(l => l.role === 'leader' || l.role === 'main').length;

      const gvccArticles = gvccApprovedLogs.filter((log) => {
        const isArticleCode = log.type.startsWith('bb_') || log.type.startsWith('isi_') || log.type.startsWith('international_journal') || log.type.startsWith('national_journal');
        const inArticleCategory = ACTIVITY_DATA.find(c => c.category === "Bài báo khoa học")
          ?.items.some(item => item.id === log.type);
        const hasArticleKeyword = log.title.toLowerCase().includes('bài báo') || log.title.toLowerCase().includes('tạp chí');
        return isArticleCode || inArticleCategory || hasArticleKeyword;
      });

      const gvccInternationalArticles = gvccArticles.filter(log => {
        const isIntCode = log.type.startsWith('bb_isi') || log.type.includes('isi') || log.type.includes('scopus') || log.type.startsWith('international_');
        const isIntTitle = log.title.toLowerCase().includes('isi') || log.title.toLowerCase().includes('scopus') || log.title.toLowerCase().includes('international');
        return isIntCode || isIntTitle;
      });

      const gvccBooks = gvccApprovedLogs.filter((log) => {
        const isBookCode = log.type === 'gt_tl' || log.type === 'book_compilation';
        const inBookCategory = ACTIVITY_DATA.find(c => c.category === "Giáo trình & Tài liệu")
          ?.items.some(item => item.id === log.type);
        const hasBookKeyword = log.title.toLowerCase().includes('giáo trình') || log.title.toLowerCase().includes('sách chuyên khảo');
        return isBookCode || inBookCategory || hasBookKeyword;
      });
      const gvccBookLeaderCount = gvccBooks.filter(l => l.role === 'leader' || l.role === 'main').length;

      // --- Lang & IT certs ---
      const langCertStr = (teacher.languageCert || '').trim();
      const hasLangCert = langCertStr !== '' && langCertStr.toLowerCase() !== 'không' && langCertStr.toLowerCase() !== 'chưa có';
      const langCertLower = langCertStr.toLowerCase();
      
      // Language levels standard 6-tier Vietnamese framework mapping
      // Returns 1-6 representing Bậc 1 to Bậc 6
      const langLevel: number = (() => {
        if (!hasLangCert) return 0;
        
        // Custom degree or top certifications count as highest
        if (langCertLower.includes('cử nhân') || langCertLower.includes('ngôn ngữ anh') || langCertLower.includes('đại học ngoại ngữ')) {
          return 5; // Bậc 5 / C1 minimum
        }
        
        // Parsing IELTS
        if (langCertLower.includes('ielts')) {
          const match = langCertLower.match(/ielts\s*(\d+(\.\d+)?)/);
          const val = match ? parseFloat(match[1]) : 0;
          if (val >= 6.0) return 5; // Bậc 5
          if (val >= 5.0) return 4; // Bậc 4
          if (val >= 4.0) return 3; // Bậc 3
          if (val >= 3.0) return 2; // Bậc 2
          return 2; // default ielts is at least Bậc 2
        }
        
        // Parsing TOEFL
        if (langCertLower.includes('toefl')) {
          const match = langCertLower.match(/(?:toefl\s*ibt|toefl)\s*(\d+)/);
          const val = match ? parseInt(match[1]) : 0;
          if (val >= 95) return 5;
          if (val >= 72) return 4;
          if (val >= 42) return 3;
          if (val >= 30) return 2;
          return 3; // default
        }

        // Parsing TOEIC
        if (langCertLower.includes('toeic')) {
          const match = langCertLower.match(/toeic\s*(\d+)/);
          const val = match ? parseInt(match[1]) : 0;
          if (val >= 850) return 5;
          if (val >= 600) return 4;
          if (val >= 450) return 3;
          if (val >= 150) return 2;
          return 3;
        }

        // Parsing Bậc / CEFR keywords
        if (langCertLower.includes('bậc 6') || langCertLower.includes('c2')) return 6;
        if (langCertLower.includes('bậc 5') || langCertLower.includes('c1')) return 5;
        if (langCertLower.includes('bậc 4') || langCertLower.includes('b2')) return 4;
        if (langCertLower.includes('bậc 3') || langCertLower.includes('b1')) return 3;
        if (langCertLower.includes('bậc 2') || langCertLower.includes('a2')) return 2;
        if (langCertLower.includes('bậc 1') || langCertLower.includes('a1')) return 1;

        // Fallbacks
        if (langCertLower.includes('khá') || langCertLower.includes('tốt') || langCertLower.includes('cao cấp')) return 4;
        if (langCertLower.includes('trung cấp') || langCertLower.includes('sơ cấp')) return 2;
        
        return 2; // general fallback for other text
      })();

      const isBậc2orHigher = langLevel >= 2;
      const isBậc3orHigher = langLevel >= 3;
      const isBậc4orHigher = langLevel >= 4;

      const hasITCert = !!(
        teacher.itCert && 
        teacher.itCert.trim() !== '' && 
        teacher.itCert.toLowerCase() !== 'không' && 
        teacher.itCert.toLowerCase() !== 'chưa có'
      );

      // --- EVALUATION OF LEVELS ---
      
      // 1. Giảng viên (GV - Điều 22)
      const meetsGvDegree = ['CN', 'ThS', 'TS', 'PGS', 'GS'].includes(teacher.rank);
      const hasPedagogyCert = !!(
        teacher.pedagogyCertYear && 
        teacher.pedagogyCertYear.trim() !== '' && 
        teacher.pedagogyCertYear.toLowerCase() !== 'không' && 
        teacher.pedagogyCertYear.toLowerCase() !== 'chưa có'
      );

      const gvMissing: string[] = [];
      if (!meetsGvDegree) {
        gvMissing.push('Yêu cầu Bằng cấp: Có bằng tốt nghiệp đại học trở lên phù hợp');
      }
      if (!hasPedagogyCert) {
        gvMissing.push('Yêu cầu Nghiệp vụ: Có chứng chỉ bồi dưỡng nghiệp vụ sư phạm cho giảng viên');
      }
      if (teachingYears < 1) {
        gvMissing.push(`Yêu cầu Kinh nghiệm: Có thời gian làm công tác giảng dạy tối thiểu 01 năm (Hiện tại: ${teachingYears} năm)`);
      }
      if (!isBậc2orHigher) {
        gvMissing.push('Yêu cầu Ngoại ngữ: Trình độ ngoại ngữ bậc 2 trở lên');
      }
      if (!hasITCert) {
        gvMissing.push('Yêu cầu CNTT: Đạt chuẩn kỹ năng sử dụng CNTT cơ bản');
      }
      const meetsGv = gvMissing.length === 0;

      // 2. Giảng viên chính (GVC - Điều 23)
      const meetsGvcDegree = ['ThS', 'TS', 'PGS', 'GS'].includes(teacher.rank);
      const gvcMissing: string[] = [];
      
      if (!meetsGvcDegree) {
        gvcMissing.push('Yêu cầu Bằng cấp: Có bằng Thạc sĩ (hoặc Chuyên khoa cấp I) trở lên phù hợp');
      }
      if (teachingYears < 6) {
        gvcMissing.push(`Yêu cầu thời gian giữ ngạch: Có ít nhất 06 năm giữ chức danh Giảng viên hoặc tương đương (Hiện tại: ${teachingYears} năm)`);
      }
      if (!isBậc3orHigher) {
        gvcMissing.push('Yêu cầu Ngoại ngữ: Trình độ bậc 3 trở lên');
      }
      if (!hasUnitExp) {
        gvcMissing.push('Thiếu điều kiện thực hành thực tế đơn vị cơ sở');
      }
      
      // NCKH (Đề tài)
      const meetsGvcProjects = (gvcProjectLeaderCount >= 1) || (gvcProjectMemberCount >= 2);
      if (!meetsGvcProjects) {
        if (hasGvReset && curTitle === 'Giảng viên') {
          gvcMissing.push(`Yêu cầu Nghiên cứu (sau mốc bổ nhiệm GV ${titleYearNum}): Chủ trì ít nhất 01 đề tài hoặc tham gia ít nhất 02 đề tài cấp cơ sở trở lên (Hiện có: ${gvcProjectLeaderCount} chủ trì / ${gvcProjectMemberCount} thành viên)`);
        } else {
          gvcMissing.push('Yêu cầu Nghiên cứu: Chủ trì ít nhất 01 đề tài hoặc tham gia ít nhất 02 đề tài cấp cơ sở trở lên đã nghiệm thu');
        }
      }

      // Biên soạn
      const gvcBooks = gvcApprovedLogs.filter((log) => {
        const isBookCode = log.type === 'gt_tl' || log.type === 'book_compilation';
        const inBookCategory = ACTIVITY_DATA.find(c => c.category === "Giáo trình & Tài liệu")
          ?.items.some(item => item.id === log.type);
        const hasBookKeyword = log.title.toLowerCase().includes('giáo trình') || log.title.toLowerCase().includes('sách chuyên khảo') || log.title.toLowerCase().includes('tài liệu') || log.title.toLowerCase().includes('sách biên soạn');
        return isBookCode || inBookCategory || hasBookKeyword;
      });
      const gvcBookLeaderCount = gvcBooks.filter(l => l.role === 'leader' || l.role === 'main').length;
      const gvcBookMemberCount = gvcBooks.filter(l => l.role === 'member' || l.role === 'co_author').length;
      const meetsGvcBooks = (gvcBookLeaderCount >= 1) || (gvcBookMemberCount >= 2);
      
      if (!meetsGvcBooks) {
        if (hasGvReset && curTitle === 'Giảng viên') {
          gvcMissing.push(`Yêu cầu Biên soạn (sau mốc bổ nhiệm GV ${titleYearNum}): Chủ trì biên soạn ít nhất 01 hoặc tham gia biên soạn ít nhất 02 tài liệu, giáo trình (Sẵn có: ${gvcBookLeaderCount} chủ biên / ${gvcBookMemberCount} tham gia)`);
        } else {
          gvcMissing.push('Yêu cầu Biên soạn: Chủ trì biên soạn ít nhất 01 hoặc tham gia biên soạn ít nhất 02 tài liệu, giáo trình đã được đưa vào sử dụng');
        }
      }

      // Bài báo
      if (gvcArticles.length < 2) {
        if (hasGvReset && curTitle === 'Giảng viên') {
          gvcMissing.push(`Yêu cầu Bài báo (sau mốc bổ nhiệm GV ${titleYearNum}): Có ít nhất 02 bài báo khoa học hoặc báo cáo hội thảo công bố (Đã đạt: ${gvcArticles.length} bài)`);
        } else {
          gvcMissing.push(`Yêu cầu Bài báo: Có ít nhất 02 bài báo khoa học hoặc báo cáo tại hội thảo khoa học được công bố (Hiện có: ${gvcArticles.length} bài)`);
        }
      }

      // Hướng dẫn
      const gvcGuidances = gvcApprovedLogs.filter((log) => {
        const isGuideCode = log.type === 'student_research_guide' || log.type.includes('guide') || log.type.includes('instruct');
        const hasGuideKeyword = log.title.toLowerCase().includes('hướng dẫn') || log.title.toLowerCase().includes('dạy giỏi') || log.title.toLowerCase().includes('giảng viên giỏi');
        return isGuideCode || hasGuideKeyword;
      });
      const meetsGvcGuidance = gvcGuidances.length >= 1;
      if (!meetsGvcGuidance) {
        gvcMissing.push('Yêu cầu Hướng dẫn: Có thành tích trong hướng dẫn học viên NCKH hoặc đạt danh hiệu giảng viên dạy giỏi cấp Học viện');
      }

      const meetsGvc = gvcMissing.length === 0 && meetsGv;

      // 3. Giảng viên cao cấp (GVCC - Điều 24)
      const meetsGvccDegree = ['TS', 'PGS', 'GS'].includes(teacher.rank);
      const yearsInCurrentTitle = titleYearNum ? (currentYear - titleYearNum) : 0;
      const requiredGvccNgachYears = (curTitle === 'Giảng viên chính') ? yearsInCurrentTitle : (teachingYears - 6);
      const meetsGvccNgach = requiredGvccNgachYears >= 6;

      const gvccMissing: string[] = [];
      if (!meetsGvccDegree) {
        gvccMissing.push('Yêu cầu Bằng cấp: Có bằng Tiến sĩ (hoặc Chuyên khoa cấp II) trở lên phù hợp');
      }
      if (!meetsGvccNgach) {
        gvccMissing.push(`Yêu cầu giữ ngạch: Có ít nhất 06 năm giữ chức danh Giảng viên chính hoặc tương đương (Hiện tại: ${requiredGvccNgachYears} năm)`);
      }
      if (!isBậc4orHigher) {
        gvccMissing.push('Yêu cầu Ngoại ngữ: Trình độ bậc 4 trở lên');
      }
      if (!hasUnitExp) {
        gvccMissing.push('Thiếu kinh nghiệm thực tế đơn vị chủ lực chuyên môn');
      }
      
      // NCKH (Đề tài)
      const gvccLeaderProjects = gvccProjects.filter(l => l.role === 'leader' || l.role === 'main');
      const gvccHighLeaderCount = gvccLeaderProjects.filter(
        l => l.type === 'project_national' || l.type === 'project_ministry' || l.type.includes('national') || l.type.includes('ministry') || l.type.startsWith('dt_b') || l.type.startsWith('dt_nn') || l.title.toLowerCase().includes('bộ') || l.title.toLowerCase().includes('ngành') || l.title.toLowerCase().includes('tỉnh') || l.title.toLowerCase().includes('nhà nước')
      ).length;
      const totalGvccLeaderCount = gvccLeaderProjects.length;
      const meetsGvccResearch = (gvccHighLeaderCount >= 1) || (totalGvccLeaderCount >= 2);

      if (!meetsGvccResearch) {
        if (hasGvcReset && curTitle === 'Giảng viên chính') {
          gvccMissing.push(`Yêu cầu Nghiên cứu (sau mốc bổ nhiệm GVC ${titleYearNum}): Chủ trì ít nhất 02 đề tài cấp cơ sở hoặc 01 đề tài cấp Bộ/Ngành trở lên (Đạt: ${gvccHighLeaderCount} cấp Bộ / ${totalGvccLeaderCount} chủ trì cấp cơ sở)`);
        } else {
          gvccMissing.push('Yêu cầu Nghiên cứu: Chủ trì ít nhất 02 đề tài cấp cơ sở hoặc 01 đề tài cấp Bộ/Ngành trở lên đã nghiệm thu');
        }
      }

      // Biên soạn
      const gvccBookMemberCount = gvccBooks.filter(l => l.role === 'member' || l.role === 'co_author').length;
      const meetsGvccBooks = (gvccBookLeaderCount >= 2) || (gvccBookLeaderCount + gvccBookMemberCount >= 3);

      if (!meetsGvccBooks) {
        if (hasGvcReset && curTitle === 'Giảng viên chính') {
          gvccMissing.push(`Yêu cầu Biên soạn (sau mốc bổ nhiệm GVC ${titleYearNum}): Chủ trì biên soạn ít nhất 02 hoặc tham gia biên soạn ít nhất 03 tài liệu, giáo trình (Đạt: ${gvccBookLeaderCount} chủ biên / ${gvccBookLeaderCount + gvccBookMemberCount} tham gia)`);
        } else {
          gvccMissing.push('Yêu cầu Biên soạn: Chủ trì biên soạn ít nhất 02 hoặc tham gia biên soạn ít nhất 03 tài liệu, giáo trình');
        }
      }

      // Bài báo
      if (gvccArticles.length < 3) {
        if (hasGvcReset && curTitle === 'Giảng viên chính') {
          gvccMissing.push(`Yêu cầu Bài báo (sau mốc bổ nhiệm GVC ${titleYearNum}): Ít nhất 03 bài báo khoa học đã công bố chuyên ngành / hội thảo (Đạt: ${gvccArticles.length} bài)`);
        } else {
          gvccMissing.push(`Yêu cầu Bài báo: Có ít nhất 03 bài báo khoa học công bố trên các tạp chí chuyên ngành hoặc kỷ yếu hội thảo (Hiện có: ${gvccArticles.length} bài)`);
        }
      }

      // Hướng dẫn
      const gvccGuidances = gvccApprovedLogs.filter((log) => {
        const isGuideCode = log.type === 'master_thesis' || log.type === 'phd_instruction' || log.type.includes('master') || log.type.includes('phd');
        const hasGuideKeyword = log.title.toLowerCase().includes('bảo vệ thành công') || log.title.toLowerCase().includes('thạc sĩ') || log.title.toLowerCase().includes('tiến sĩ') || log.title.toLowerCase().includes('nghiên cứu sinh') || log.title.toLowerCase().includes('cao học') || log.title.toLowerCase().includes('luận văn') || log.title.toLowerCase().includes('luận án');
        return isGuideCode || hasGuideKeyword;
      });
      const gvccPhdGuidanceCount = gvccGuidances.filter(l => l.title.toLowerCase().includes('tiến sĩ') || l.title.toLowerCase().includes('nghiên cứu sinh') || l.type === 'phd_instruction').length;
      const meetsGvccGuidances = (gvccPhdGuidanceCount >= 1) || (gvccGuidances.length >= 2);

      if (!meetsGvccGuidances) {
        if (hasGvcReset && curTitle === 'Giảng viên chính') {
          gvccMissing.push(`Yêu cầu Hướng dẫn (sau mốc bổ nhiệm GVC ${titleYearNum}): Hướng dẫn thành công ít nhất 02 học viên cao học hoặc 01 nghiên cứu sinh bảo vệ thành công luận văn/luận án`);
        } else {
          gvccMissing.push('Yêu cầu Hướng dẫn: Hướng dẫn thành công ít nhất 02 học viên cao học hoặc 01 nghiên cứu sinh bảo vệ thành công luận văn/luận án');
        }
      }

      const meetsGvcc = gvccMissing.length === 0 && meetsGvc;

      // Derived current qualified title rank
      let currentQualified: 'Giảng viên cao cấp' | 'Giảng viên chính' | 'Giảng viên' | 'Chưa đạt Chuẩn' = 'Chưa đạt Chuẩn';
      if (meetsGvcc) {
        currentQualified = 'Giảng viên cao cấp';
      } else if (meetsGvc) {
        currentQualified = 'Giảng viên chính';
      } else if (meetsGv) {
        currentQualified = 'Giảng viên';
      }

      // Next level indicators
      let nextLevel = 'Giảng viên';
      let nextMissing = gvMissing;
      if (currentQualified === 'Giảng viên') {
        nextLevel = 'Giảng viên chính';
        nextMissing = gvcMissing;
      } else if (currentQualified === 'Giảng viên chính') {
        nextLevel = 'Giảng viên cao cấp';
        nextMissing = gvccMissing;
      } else if (currentQualified === 'Giảng viên cao cấp') {
        nextLevel = 'Đã đạt danh hiệu cao nhất';
        nextMissing = [];
      }

      // Determine actual held title with a fallback to position
      let heldTitle = teacher.academicTitle || 'Không';
      if (heldTitle === 'Không' && teacher.position) {
        if (['Giảng viên', 'Giảng viên chính', 'Giảng viên cao cấp'].includes(teacher.position)) {
          heldTitle = teacher.position;
        }
      }

      // Map target evaluation details based on heldTitle
      let targetEvalTitle = 'Giảng viên';
      let targetEvalPassed = false;
      let targetEvalMissing: string[] = [];

      if (heldTitle === 'Giảng viên cao cấp') {
        targetEvalTitle = 'Giảng viên cao cấp';
        targetEvalPassed = meetsGvcc;
        targetEvalMissing = gvccMissing;
      } else if (heldTitle === 'Giảng viên chính') {
        targetEvalTitle = 'Giảng viên cao cấp';
        targetEvalPassed = meetsGvcc;
        targetEvalMissing = gvccMissing;
      } else if (heldTitle === 'Giảng viên') {
        targetEvalTitle = 'Giảng viên chính';
        targetEvalPassed = meetsGvc;
        targetEvalMissing = gvcMissing;
      } else {
        targetEvalTitle = 'Giảng viên';
        targetEvalPassed = meetsGv;
        targetEvalMissing = gvMissing;
      }

      return {
        ...teacher,
        teachingYears,
        hasUnitExp,
        unitExpText,
        projects: lifetimeProjects,
        projectLeaderCount: lifetimeProjectLeaderCount,
        projectMemberCount: lifetimeProjectMemberCount,
        initiatives: lifetimeInitiatives,
        initiativeCount: lifetimeInitiativeCount,
        articles: lifetimeArticles,
        internationalArticlesCount: lifetimeInternationalArticles.length,
        domesticArticlesCount: lifetimeDomesticArticles,
        bookLeaderCount: lifetimeBookLeaderCount,
        langCertStr,
        itCertStr: teacher.itCert || 'Chưa cập nhật',
        gv: { passed: meetsGv, missing: gvMissing },
        gvc: { passed: meetsGvc, missing: gvcMissing },
        gvcc: { passed: meetsGvcc, missing: gvccMissing },
        currentQualified,
        nextLevel,
        nextMissing,
        heldTitle,
        targetEvalTitle,
        targetEvalPassed,
        targetEvalMissing,
        // Reset logs and info metadata for rendering
        hasGvReset,
        gvReceiptYear: titleYearNum,
        hasGvcReset,
        gvcReceiptYear: titleYearNum,
        gvcArticlesCount: gvcArticles.length,
        gvcProjectsCount: gvcProjects.length,
        gvcProjectLeaderCount,
        gvcProjectMemberCount,
        gvcInitiativeCount,
        gvccArticlesCount: gvccArticles.length,
        gvccProjectsCount: gvccProjects.length,
        gvccProjectLeaderCount,
        gvccInternationalArticlesCount: gvccInternationalArticles.length,
        gvccBookLeaderCount,
        
        // Detailed indicators for view modal mapping
        meetsGvDegree,
        hasPedagogyCert,
        gvcBookLeaderCount,
        gvcBookMemberCount,
        gvcBooksCount: gvcBooks.length,
        gvcGuidanceCount: gvcGuidances.length,
        gvccBookMemberCount,
        gvccBooksCount: gvccBooks.length,
        gvccGuidancesCount: gvccGuidances.length,
        gvccPhdGuidanceCount
      };
    });
  }, [teachers, researchLogs, currentYear]);

  // 3. Filtering logic
  const filteredEvaluations = useMemo(() => {
    return evaluatedTeachers.filter((item) => {
      const matchSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchDept = selectedDept === 'all' || item.department === selectedDept;
      
      let matchTitle = true;
      if (targetTitleFilter === 'GV') {
        matchTitle = item.currentQualified === 'Giảng viên';
      } else if (targetTitleFilter === 'GVC') {
        matchTitle = item.currentQualified === 'Giảng viên chính';
      } else if (targetTitleFilter === 'GVCC') {
        matchTitle = item.currentQualified === 'Giảng viên cao cấp';
      }

      return matchSearch && matchDept && matchTitle;
    });
  }, [evaluatedTeachers, searchQuery, selectedDept, targetTitleFilter]);

  const selectedTeacher = useMemo(() => {
    if (!selectedTeacherId) return null;
    return evaluatedTeachers.find(t => t.id === selectedTeacherId) || null;
  }, [evaluatedTeachers, selectedTeacherId]);

  return (
    <div className="space-y-6">
      {/* Tab Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Award className="w-40 h-40 text-blue-600" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Khảo sát chuẩn hoá CM, KT
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Tiêu chuẩn Bộ Giáo dục
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Tiêu chuẩn và Đánh giá học hàm, học vị chuyên môn kỹ thuật</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Hệ thống tự động tra cứu thâm niên, chứng chỉ nghiệp vụ sư phạm, tin học ngoại ngữ và kết hợp rà soát các công trình đề tài khoa học công bố của giảng viên đối chiếu chuẩn Quốc gia (Giảng viên, Giảng viên chính, và Giảng viên cao cấp)
          </p>
        </div>
      </div>

      {/* Official requirements checklist cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Giảng viên */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-slate-800 font-extrabold text-xs uppercase tracking-wider px-2.5 py-1 bg-slate-100 rounded-md">
                Giảng viên (Hạng III)
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Mã số: V.07.01.03</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><b>Kinh nghiệm:</b> Thời gian làm công tác giảng dạy tối thiểu <b>01 năm</b>.</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><b>Bằng cấp:</b> Đạt trình độ Đại học trở lên phù hợp chuyên ngành.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><b>Nghiệp vụ:</b> Có chứng chỉ bồi dưỡng nghiệp vụ sư phạm.</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><b>Ngoại ngữ:</b> Trình độ ngoại ngữ đạt từ cực tiểu <b>Bậc 2</b> trở lên.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><b>Tin học:</b> Chuẩn kỹ năng sử dụng CNTT cơ bản.</span>
              </li>
            </ul>
          </div>
          <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tiêu chuẩn Hạng III (Điều 22)</span>
            <span className="text-slate-700 font-bold">Đại học</span>
          </div>
        </div>

        {/* Card 2: Giảng viên chính */}
        <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-3xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-blue-50/10 to-transparent">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-blue-800 font-extrabold text-xs uppercase tracking-wider px-2.5 py-1 bg-blue-50 rounded-md">
                Giảng viên chính (Hạng II)
              </span>
              <span className="text-[10px] text-blue-500 font-bold">Mã số: V.07.01.02</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><b>Thâm niên giữ ngạch:</b> Có ít nhất <b>06 năm</b> giữ chức danh Giảng viên.</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><b>Bằng cấp:</b> Trình độ Thạc sĩ (hoặc Chuyên khoa cấp I) trở lên.</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><b>Ngoại ngữ:</b> Trình độ ngoại ngữ từ <b>Bậc 3</b> trở lên (Eng B1).</span>
              </li>
              <li className="flex items-start gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><b>Nghiên cứu:</b> Chủ trì $\ge 1$ đề tài hoặc tham gia $\ge 2$ đề tài cơ sở.</span>
              </li>
              <li className="flex items-start gap-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><b>Biên soạn:</b> Chủ biên $\ge 1$ hoặc tham gia biên soạn $\ge 2$ giáo trình.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><b>Bài báo & Hướng dẫn:</b> $\ge 2$ bài báo khoa học & NCKH SV/Dạy giỏi.</span>
              </li>
            </ul>
          </div>
          <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-[11px] text-blue-600 font-semibold">
            <span>Tiêu chuẩn Hạng II (Điều 23)</span>
            <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 rounded">Thạc sĩ</span>
          </div>
        </div>

        {/* Card 3: Giảng viên cao cấp */}
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-3xs flex flex-col justify-between bg-gradient-to-b from-amber-50/10 to-transparent">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-amber-800 font-extrabold text-xs uppercase tracking-wider px-2.5 py-1 bg-amber-50 rounded-md">
                Giảng viên cao cấp (Hạng I)
              </span>
              <span className="text-[10px] text-amber-600 font-bold">Mã số: V.07.01.01</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><b>Thâm niên giữ ngạch:</b> Có ít nhất <b>06 năm</b> giữ chức danh Giảng viên chính.</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><b>Bằng cấp:</b> Trình độ Tiến sĩ (hoặc Chuyên khoa cấp II) trở lên.</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><b>Ngoại ngữ:</b> Trình độ ngoại ngữ từ <b>Bậc 4</b> trở lên (Eng B2).</span>
              </li>
              <li className="flex items-start gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><b>Nghiên cứu:</b> Chủ trì $\ge 2$ đề tài cơ sở hoặc $\ge 1$ đề tài Bộ/Ngành.</span>
              </li>
              <li className="flex items-start gap-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><b>Biên soạn:</b> Chủ biên $\ge 2$ hoặc tham gia biên soạn $\ge 3$ tài liệu.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><b>Bài báo & Hướng dẫn:</b> $\ge 3$ bài báo, HD thành công $\ge 2$ thạc sĩ hoặc 1 NCS.</span>
              </li>
            </ul>
          </div>
          <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-[11px] text-amber-600 font-semibold">
            <span>Tiêu chuẩn Hạng I (Điều 24)</span>
            <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 rounded">Tiến sĩ</span>
          </div>
        </div>
      </div>

      {/* Control panel: search, filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên giảng viên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">Tất cả Bộ môn</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={targetTitleFilter}
              onChange={(e) => setTargetTitleFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">Đánh giá chung (Tất cả)</option>
              <option value="GV">Đã đạt chuẩn Giảng viên</option>
              <option value="GVC">Đạt chuẩn Giảng viên chính</option>
              <option value="GVCC">Đạt chuẩn Giảng viên cao cấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Screen */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Danh sách kết quả rà soát tiêu chuẩn học hàm chuyên môn kỹ thuật ({filteredEvaluations.length} đồng chí)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-bold">Thực tế • Đơn vị • Công trình NCKH</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Họ và Tên / Chức vụ</th>
                <th className="py-3 px-4">Thâm niên / Sư phạm</th>
                <th className="py-3 px-4">Thực tế đơn vị</th>
                <th className="py-3 px-4">Đề tài & Sáng kiến</th>
                <th className="py-3 px-4">Công bố bài báo</th>
                <th className="py-3 px-4">Ngoại ngữ & Tin học</th>
                <th className="py-3 px-4 text-center">Đánh giá chuẩn đạt</th>
                <th className="py-3 px-4 text-center">Sự vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy dữ liệu giảng viên phù hợp với lọc tài vụ.
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{item.name}</span>
                          <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">
                            {item.department} • {item.position}
                          </span>
                          {item.academicTitle && item.academicTitle !== 'Không' && item.academicTitleYear && (
                            <div className="mt-1">
                              <span className="text-[9px] inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-bold max-w-full border border-amber-200/60 shadow-3xs" title={`Toàn bộ thành tích NCKH trước năm ${item.academicTitleYear} được reset khi xét chức danh kế tiếp`}>
                                <Calendar className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                Reset NCKH từ {item.academicTitleYear} ({item.academicTitle})
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="font-semibold text-slate-700">{item.teachingYears} năm</span>
                          </div>
                          {item.pedagogyCertYear ? (
                            <span className="text-[9px] inline-block bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded font-bold">
                              NV Sư phạm: {item.pedagogyCertYear}
                            </span>
                          ) : (
                            <span className="text-[9px] inline-block bg-rose-50 text-rose-600 px-1 py-0.2 rounded font-bold">
                              Chưa có NVSP
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {item.hasUnitExp ? (
                          <div className="space-y-0.5 max-w-[150px]">
                            <span className="text-[10px] font-bold text-slate-700 block truncate" title={item.unitExperience}>
                              {item.unitExperience}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold block">
                              Mục tiêu: Đã hoàn tất ({item.unitExperienceYear})
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 block">Chưa đi thực tế</span>
                            <span className="text-[9px] text-amber-600 font-semibold block">⚠️ Thiếu để xét Gvc & Gvcc</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="font-semibold text-slate-700">Đề tài:</span>
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-bold font-mono">
                              {item.projectLeaderCount} chính / {item.projects.length} tổng
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="font-semibold text-slate-700 font-sans">Sáng kiến:</span>
                            <span className="bg-amber-100/60 text-amber-700 px-1.5 py-0.2 rounded font-bold font-mono">
                              {item.initiativeCount} SK
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="font-semibold text-slate-700">Tổng số:</span>
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold font-mono">
                              {item.articles.length} bài báo
                            </span>
                          </div>
                          {item.internationalArticlesCount > 0 && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded block w-fit">
                              🌐 {item.internationalArticlesCount} Quốc tế (ISI/Scopus)
                            </span>
                          )}
                          {item.bookLeaderCount > 0 && (
                            <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.2 rounded block w-fit">
                              📚 {item.bookLeaderCount} Giáo trình (Chủ biên)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1 text-[10px]">
                          <div>
                            <span className="text-slate-400">NN: </span>
                            <span className="font-bold text-slate-700">
                              {item.langCertStr || 'Chưa cập nhật'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-sans">Tin học: </span>
                            <span className="font-bold text-slate-700">
                              {item.itCertStr || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.heldTitle === 'Giảng viên cao cấp' ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-extrabold text-[10px] tracking-wider border border-amber-200 shadow-3xs">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              ĐẠT CHUẨN GVCC
                            </span>
                            <span className="text-[8px] text-amber-600 font-bold mt-1 uppercase tracking-wider">Hàm cao nhất</span>
                          </div>
                        ) : item.targetEvalPassed ? (
                          <div className="flex flex-col items-center">
                            {item.targetEvalTitle === 'Giảng viên cao cấp' && (
                              <>
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider border border-amber-200 shadow-3xs">
                                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                                  ĐỦ ĐIỀU KIỆN GVCC
                                </span>
                                <span className="text-[8px] text-amber-600 font-bold mt-1 uppercase tracking-wider">Đủ chuẩn thăng hạng I</span>
                              </>
                            )}
                            {item.targetEvalTitle === 'Giảng viên chính' && (
                              <>
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider border border-blue-200 shadow-3xs">
                                  <CheckCircle2 className="w-3 h-3 text-blue-500 animate-pulse" />
                                  ĐỦ ĐIỀU KIỆN GVC
                                </span>
                                <span className="text-[8px] text-blue-600 font-bold mt-1 uppercase tracking-wider">Đủ chuẩn thăng hạng II</span>
                              </>
                            )}
                            {item.targetEvalTitle === 'Giảng viên' && (
                              <>
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider border border-emerald-200 shadow-3xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  ĐẠT CHUẨN GV
                                </span>
                                <span className="text-[8px] text-emerald-600 font-bold mt-1 tracking-wider uppercase">Đạt chuẩn Hạng III</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            {item.targetEvalTitle === 'Giảng viên cao cấp' && (
                              <>
                                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full font-semibold text-[10px] tracking-wider border border-slate-200 shadow-3xs" title={item.targetEvalMissing.join('\n')}>
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  CHƯA ĐẠT CHUẨN GVCC
                                </span>
                                <span className="text-[9px] text-amber-600 font-semibold mt-1">
                                  Thiếu {item.targetEvalMissing.length} tiêu chuẩn rà soát
                                </span>
                              </>
                            )}
                            {item.targetEvalTitle === 'Giảng viên chính' && (
                              <>
                                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full font-semibold text-[10px] tracking-wider border border-slate-200 shadow-3xs" title={item.targetEvalMissing.join('\n')}>
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  CHƯA ĐẠT CHUẨN GVC
                                </span>
                                <span className="text-[9px] text-amber-600 font-semibold mt-1">
                                  Thiếu {item.targetEvalMissing.length} tiêu chuẩn rà soát
                                </span>
                              </>
                            )}
                            {item.targetEvalTitle === 'Giảng viên' && (
                              <>
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-semibold text-[10px] tracking-wider border border-rose-200 shadow-3xs" title={item.targetEvalMissing.join('\n')}>
                                  <XCircle className="w-3 h-3 text-rose-500" />
                                  CHƯA ĐẠT CHUẨN GV
                                </span>
                                <span className="text-[9px] text-rose-600 font-semibold mt-1">
                                  Thiếu {item.targetEvalMissing.length} tiêu chuẩn nền
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedTeacherId(item.id)}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer transition-all"
                        >
                          Chi tiết & Lộ trình
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual detail modal / card popup for lộ trình - path of promotion */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Hồ sơ & Bản đồ thăng tiến chuyên môn
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Giảng viên: <b>{selectedTeacher.name}</b></p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeacherId(null)}
                  className="w-6 h-6 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-700 cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                {/* Visual promotion track */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3.5">
                    Hành trình thăng hạng Chức danh chuyên môn
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {/* Step GV */}
                    <div className={`p-3 rounded-lg border ${selectedTeacher.gv.passed ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className="font-bold flex items-center justify-center gap-1">
                        {selectedTeacher.gv.passed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                        Giảng viên (III)
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">Đầy đủ điều kiện nền</span>
                    </div>

                    {/* Step GVC */}
                    <div className={`p-3 rounded-lg border ${selectedTeacher.gvc.passed ? 'bg-blue-50/50 border-blue-200 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className="font-bold flex items-center justify-center gap-1">
                        {selectedTeacher.gvc.passed ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 pointer-events-none" />}
                        Giảng viên chính (II)
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        {selectedTeacher.gvc.passed ? 'Đã đạt' : `Còn thiếu ${selectedTeacher.gvc.missing.length} học phần`}
                      </span>
                    </div>

                    {/* Step GVCC */}
                    <div className={`p-3 rounded-lg border ${selectedTeacher.gvcc.passed ? 'bg-amber-50/50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className="font-bold flex items-center justify-center gap-1">
                        {selectedTeacher.gvcc.passed ? <Check className="w-3.5 h-3.5 text-amber-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 pointer-events-none" />}
                        Giảng viên cao cấp (I)
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        {selectedTeacher.gvcc.passed ? 'Đầy đủ tất cả' : `Còn thiếu ${selectedTeacher.gvcc.missing.length} học phần`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-criteria detailed state review */}
                <div className="row-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    Biểu đối chiếu các tiêu chí cá nhân hiện tại
                  </h4>

                  {selectedTeacher.academicTitle && selectedTeacher.academicTitle !== 'Không' && selectedTeacher.academicTitleYear && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-relaxed font-semibold">
                      <div className="flex items-center gap-1 text-amber-900 font-bold mb-1">
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        Quy tắc thăng hạng (Lọc reset thành tích cũ):
                      </div>
                      Đồng chí nhận hàm thăng chức danh <span className="text-blue-700 font-bold">{selectedTeacher.academicTitle}</span> vào năm <span className="text-blue-700 font-bold">{selectedTeacher.academicTitleYear}</span>. 
                      Toàn bộ các đề tài, sáng kiến cải tiến, sách xuất bản và các bài báo khoa học công bố trước năm <b>{selectedTeacher.academicTitleYear}</b> đã được sử dụng quy đổi cho chức danh hiện thời nên <span className="text-rose-600 font-bold">không được sử dụng lại (Reset)</span> khi thăng hạng chức danh tiếp theo.
                    </div>
                  )}

                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">1. Số năm giảng dạy:</span>
                      <span className="col-span-2 font-bold text-slate-800">
                        {selectedTeacher.teachingYears} năm (Bắt đầu giảng dạy từ năm {selectedTeacher.startYear || 'N/A'})
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">2. Nghiệp vụ sư phạm:</span>
                      <span className="col-span-2 font-bold text-slate-800">
                        {selectedTeacher.pedagogyCertYear ? `Năm cấp: ${selectedTeacher.pedagogyCertYear}` : '❌ Chưa bổ sung thông tin chứng chỉ sư phạm'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">3. Thực tế đơn vị:</span>
                      <span className="col-span-2 font-bold text-slate-800">
                        {selectedTeacher.unitExpText}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">4. Đề tài KHCN:</span>
                      <span className="col-span-2 font-bold text-slate-800">
                        <div>
                          {selectedTeacher.projects.length} đề tài nghiệm thu trọn đời ({selectedTeacher.projectLeaderCount} chủ trì / {selectedTeacher.projectMemberCount} thành viên)
                          {selectedTeacher.hasGvReset && selectedTeacher.academicTitle === 'Giảng viên' && (
                            <span className="text-amber-700 block mt-1 text-[10px] bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Được tính xét GVC (sau mốc {selectedTeacher.gvReceiptYear}):</b> {selectedTeacher.gvcProjectsCount} đề tài ({selectedTeacher.gvcProjectLeaderCount} chủ trì / {selectedTeacher.gvcProjectMemberCount} thành viên)
                            </span>
                          )}
                          {selectedTeacher.hasGvcReset && selectedTeacher.academicTitle === 'Giảng viên chính' && (
                            <span className="text-amber-700 block mt-1 text-[10px] bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Được tính xét GVCC (sau mốc {selectedTeacher.gvReceiptYear}):</b> {selectedTeacher.gvccProjectsCount} đề tài ({selectedTeacher.gvccProjectLeaderCount} chủ trì)
                            </span>
                          )}
                        </div>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">5. Sáng kiến cải tiến:</span>
                      <span className="col-span-2 font-bold text-slate-800">
                        <div>
                          {selectedTeacher.initiativeCount} sáng kiến được nghiệm thu trọn đời
                          {selectedTeacher.hasGvReset && (
                            <span className="text-amber-700 block mt-1 text-[10px] bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Sau mốc {selectedTeacher.gvReceiptYear}:</b> {selectedTeacher.gvcInitiativeCount} sáng kiến
                            </span>
                          )}
                        </div>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">6. Sách & Giáo trình:</span>
                      <span className="col-span-2 font-bold text-slate-800">
                        <div>
                          {selectedTeacher.bookLeaderCount} giáo trình chủ biên trọn đời
                          {selectedTeacher.hasGvcReset && (
                            <span className="text-amber-700 block mt-1 text-[10px] bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Sau mốc {selectedTeacher.gvReceiptYear} (xét GVCC):</b> {selectedTeacher.gvccBookLeaderCount} giáo trình chủ biên
                            </span>
                          )}
                        </div>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">7. Bài báo khoa học:</span>
                      <span className="col-span-2 font-bold text-slate-800">
                        <div>
                          {selectedTeacher.articles.length} bài đăng tạp chí chuyên ngành trọn đời (Có {selectedTeacher.internationalArticlesCount} bài ISI/Scopus nước ngoài)
                          {selectedTeacher.hasGvReset && selectedTeacher.academicTitle === 'Giảng viên' && (
                            <span className="text-amber-700 block mt-1 text-[10px] bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Để xét GVC (sau {selectedTeacher.gvReceiptYear}):</b> {selectedTeacher.gvcArticlesCount} bài báo khoa học
                            </span>
                          )}
                          {selectedTeacher.hasGvcReset && selectedTeacher.academicTitle === 'Giảng viên chính' && (
                            <span className="text-amber-700 block mt-1 text-[10px] bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Để xét GVCC (sau {selectedTeacher.gvReceiptYear}):</b> {selectedTeacher.gvccArticlesCount} bài báo khoa học ({selectedTeacher.gvccInternationalArticlesCount} bài ISI/Scopus)
                            </span>
                          )}
                        </div>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pb-1">
                      <span className="font-semibold text-slate-400">8. Ngoại ngữ & Tin học:</span>
                      <span className="col-span-2 font-bold text-slate-800">
                        Chứng chỉ NN: <b>{selectedTeacher.langCertStr || 'Chưa nộp'}</b> | Tin học: <b>{selectedTeacher.itCertStr}</b>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Growth path recommendations */}
                <div className="p-4 bg-orange-50/60 border border-orange-100 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                    Định hướng tích lũy & Lộ trình Thăng hạng đề xuất khuyên dùng
                  </h4>
                  {selectedTeacher.nextMissing.length === 0 ? (
                    <p className="text-[11px] text-emerald-800 font-medium">
                      🎉 Tuyệt vời! Đồng chí {selectedTeacher.name} đã tích lũy đầy đủ toàn diện các chỉ số đề kháng và công trình nghiên cứu khoa học đạt chuẩn của chức danh cao nhất (Giảng viên cao cấp Hạng I). Không có khuyến nghị thiếu hụt nào thêm!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-600 font-medium">
                        Để hướng tới chuẩn danh hiệu tiếp theo là <b>{selectedTeacher.nextLevel}</b>, đồng chí cần lập phương án bổ sung thâm niên hoặc thực tế khoa học sau:
                      </p>
                      <ul className="space-y-1.5">
                        {selectedTeacher.nextMissing.map((missingItem, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] text-red-600 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            <span>{missingItem}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug font-medium italic">
                        *Lưu ý: Các hoạt động nghiên cứu khoa học khoa đề án cần được thẩm duyệt và nghiệm thu ở trạng thái "Đã thông duyệt" mới được ghi nhận vào hệ thống thăng hạng.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedTeacherId(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Xác nhận đóng hồ sơ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

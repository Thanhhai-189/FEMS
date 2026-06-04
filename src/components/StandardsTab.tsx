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
  Shield,
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
      
      // Determine military unit experience level:
      // 0: Chưa đi | 1: Cấp phân đội | 2: Cấp tiểu đoàn | 3: Cấp trung đoàn / Cấp lữ đoàn trở lên
      const getUnitExpLevel = (exp: string | undefined): number => {
        if (!exp) return 0;
        const low = exp.toLowerCase();
        if (low.includes('sư đoàn') || low.includes('quân đoàn') || low.includes('bộ tư lệnh')) return 4;
        if (low.includes('lữ đoàn') || low.includes('trung đoàn')) return 3;
        if (low.includes('tiểu đoàn')) return 2;
        if (low.includes('phân đội')) return 1;
        if (low === 'chưa đi' || low === 'chưa đi thực tế') return 0;
        if (exp.trim() !== '') return 1;
        return 0;
      };

      const unitExpLevel = getUnitExpLevel(teacher.unitExperience);

      // GV requires "cấp tiểu đoàn trở lên" (level >= 2)
      const meetsGvUnitExp = unitExpLevel >= 2;
      // GVC and GVCC requires "cấp trung (lữ) đoàn trở lên" (level >= 3)
      const meetsGvcUnitExp = unitExpLevel >= 3;
      const meetsGvccUnitExp = unitExpLevel >= 3;

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
      // Đối với giảng viên tại trường sĩ quan, trường đại học thì phải từ Cử nhân, Kỹ sư trở lên
      const meetsGvDegree = ['CN', 'ThS', 'TS', 'PGS', 'GS'].includes(teacher.rank);
      const hasPedagogyCert = !!(
        teacher.pedagogyCertYear && 
        teacher.pedagogyCertYear.trim() !== '' && 
        teacher.pedagogyCertYear.toLowerCase() !== 'không' && 
        teacher.pedagogyCertYear.toLowerCase() !== 'chưa có'
      );

      const gvMissing: string[] = [];
      if (!meetsGvDegree) {
        gvMissing.push('Yêu cầu Bằng cấp: Có trình độ Cử nhân hoặc Kỹ sư trở lên');
      }
      if (!hasPedagogyCert) {
        gvMissing.push('Yêu cầu Nghiệp vụ: Có chứng chỉ bồi dưỡng nghiệp vụ sư phạm cho giảng viên');
      }
      if (teachingYears < 1) {
        gvMissing.push(`Yêu cầu Thời gian công tác: Có thời gian làm công tác giảng dạy tối thiểu 01 năm (Hiện tại: ${teachingYears} năm). Đối với giảng viên đang giảng dạy, đào tạo bậc đại học tại trường sĩ quan, các trường hợp đi thực tế, đi đào tạo, bồi dưỡng được tính là thời gian làm công tác giảng dạy.`);
      }
      if (!isBậc2orHigher) {
        gvMissing.push('Yêu cầu Ngoại ngữ: Trình độ ngoại ngữ bậc 2 trở lên');
      }
      if (!hasITCert) {
        gvMissing.push('Yêu cầu CNTT: Đạt chuẩn kỹ năng sử dụng CNTT cơ bản');
      }
      if (!meetsGvUnitExp) {
        gvMissing.push('Thiếu điều kiện thực tế đơn vị (Yêu cầu cấp tiểu đoàn trở lên)');
      }
      const meetsGv = gvMissing.length === 0;

      // 2. Giảng viên chính (GVC - Điều 23)
      const meetsGvcDegree = ['ThS', 'TS', 'PGS', 'GS'].includes(teacher.rank);
      
      // Calculate years holding Giảng viên designation
      let yearsAsGv = 0;
      if (curTitle === 'Giảng viên') {
        yearsAsGv = titleYearNum ? (currentYear - titleYearNum) : 0;
      } else if (curTitle === 'Giảng viên chính' || curTitle === 'Giảng viên cao cấp') {
        yearsAsGv = 6; // Meets standard
      } else {
        // 'Không' - estimate based on teaching years
        yearsAsGv = Math.max(0, teachingYears - 1);
      }

      const masterYears = teacher.masterObtainYear ? (currentYear - teacher.masterObtainYear) : (['ThS', 'TS', 'PGS', 'GS'].includes(teacher.rank) ? teachingYears : 0);
      const phdYears = teacher.phdObtainYear ? (currentYear - teacher.phdObtainYear) : (['TS', 'PGS', 'GS'].includes(teacher.rank) ? teachingYears : 0);

      // Giảng viên chính Special cases (nếu chưa đủ 06 năm giữ ngạch Giảng viên):
      // 1) Có bằng thạc sĩ tối thiểu 06 năm hoặc bằng tiến sĩ tối thiểu 02 năm, và 01 năm cuối đang là giảng viên của trường
      // 2) Đã giữ chức vụ chỉ huy cấp tiểu đoàn hoặc ban/tương đương trở lên
      const isGvcSpecial1 = (
        ((['ThS', 'TS', 'PGS', 'GS'].includes(teacher.rank) && masterYears >= 6) ||
         (['TS', 'PGS', 'GS'].includes(teacher.rank) && phdYears >= 2)) &&
        yearsAsGv >= 1
      );
      
      const isGvcSpecial2 = (
        teacher.position.toLowerCase().includes('tiểu đoàn') ||
        teacher.position.toLowerCase().includes('chỉ huy') ||
        teacher.position.toLowerCase().includes('tiểu ban') ||
        teacher.position.toLowerCase().includes('trưởng ban') ||
        teacher.position.toLowerCase().includes('trưởng bộ môn') ||
        (teacher.notes && (
          teacher.notes.toLowerCase().includes('tiểu đoàn') ||
          teacher.notes.toLowerCase().includes('chỉ huy') ||
          teacher.notes.toLowerCase().includes('tiểu ban') ||
          teacher.notes.toLowerCase().includes('trưởng ban') ||
          teacher.notes.toLowerCase().includes('trưởng bộ môn')
        ))
      );

      const meetsGvcNgachYears = (yearsAsGv >= 6 && yearsAsGv >= 1) || isGvcSpecial1 || isGvcSpecial2;

      const gvcMissing: string[] = [];
      if (!meetsGvcDegree) {
        gvcMissing.push('Yêu cầu Bằng cấp: Có bằng Thạc sĩ trở lên phù hợp');
      }
      if (!meetsGvcNgachYears) {
        gvcMissing.push(`Yêu cầu Thời gian giữ ngạch: Có thời gian giữ ngạch Giảng viên tối thiểu 06 năm (Hơn nữa, thời gian gần nhất giữ chức danh Giảng viên phải tối thiểu 01 năm tính đến thời điểm đăng ký xét duyệt. Hoặc đáp ứng diện đặc biệt: Có bằng thạc sĩ ≥ 06 năm / tiến sĩ ≥ 02 năm + 01 năm cuối làm GV của trường, hoặc đã giữ chức vụ chỉ huy cấp tiểu đoàn/tương đương trở lên). Hiện có: ${yearsAsGv} năm.`);
      }
      if (!isBậc3orHigher) {
        gvcMissing.push('Yêu cầu Ngoại ngữ: Trình độ bậc 3 trở lên');
      }
      if (!meetsGvcUnitExp) {
        gvcMissing.push('Thiếu điều kiện thực tế đơn vị (Yêu cầu cấp trung/lữ đoàn trở lên)');
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
      const meetsGvcGuidance = gvcGuidances.length >= 1 || !!(teacher.gvgYears && teacher.gvgYears.trim());
      if (!meetsGvcGuidance) {
        gvcMissing.push('Yêu cầu Hướng dẫn: Có thành tích trong hướng dẫn học viên NCKH hoặc đạt danh hiệu giảng viên dạy giỏi cấp Học viện');
      }

      const meetsGvc = gvcMissing.length === 0 && meetsGv;

      // 3. Giảng viên cao cấp (GVCC - Điều 24)
      const meetsGvccDegree = ['TS', 'PGS', 'GS'].includes(teacher.rank);
      
      // Calculate years holding Giảng viên chính designation
      let yearsAsGvc = 0;
      if (curTitle === 'Giảng viên chính') {
        yearsAsGvc = titleYearNum ? (currentYear - titleYearNum) : 0;
      } else if (curTitle === 'Giảng viên cao cấp') {
        yearsAsGvc = 6; // Meets standard
      } else {
        yearsAsGvc = 0; // Chưa có
      }

      const phdYearsForGvcc = teacher.phdObtainYear ? (currentYear - teacher.phdObtainYear) : (['TS', 'PGS', 'GS'].includes(teacher.rank) ? teachingYears : 0);

      // Giảng viên cao cấp Special cases (nếu chưa đủ 06 năm giữ ngạch Giảng viên chính):
      // 1) Có bằng tiến sĩ tối thiểu 06 năm và 01 năm cuối đang là giảng viên chính của trường
      // 2) Đã giữ chức vụ chỉ huy cấp trung (lữ) đoàn hoặc ban chỉ huy/chức vụ tương đương trở lên
      const isGvccSpecial1 = (
        ['TS', 'PGS', 'GS'].includes(teacher.rank) && 
        phdYearsForGvcc >= 6 && 
        yearsAsGvc >= 1
      );
      
      const isGvccSpecial2 = (
        teacher.position.toLowerCase().includes('trung đoàn') ||
        teacher.position.toLowerCase().includes('lữ đoàn') ||
        teacher.position.toLowerCase().includes('chỉ huy') ||
        teacher.position.toLowerCase().includes('ban trưởng') ||
        teacher.position.toLowerCase().includes('trưởng ban') ||
        (teacher.notes && (
          teacher.notes.toLowerCase().includes('trung đoàn') ||
          teacher.notes.toLowerCase().includes('lữ đoàn') ||
          teacher.notes.toLowerCase().includes('chỉ huy') ||
          teacher.notes.toLowerCase().includes('ban trưởng') ||
          teacher.notes.toLowerCase().includes('trưởng ban')
        ))
      );

      const meetsGvccNgachYears = (yearsAsGvc >= 6 && yearsAsGvc >= 1) || isGvccSpecial1 || isGvccSpecial2;

      const gvccMissing: string[] = [];
      if (!meetsGvccDegree) {
        gvccMissing.push('Yêu cầu Bằng cấp: Có bằng Tiến sĩ trở lên phù hợp');
      }
      if (!meetsGvccNgachYears) {
        gvccMissing.push(`Yêu cầu Thời gian giữ ngạch: Có thời gian giữ ngạch chức danh Giảng viên chính tối thiểu 06 năm (Trong đó, thời gian gần nhất giữ chức danh GVC tối thiểu là 01 năm tính đến thời điểm đăng ký xét duyệt. Hoặc đáp ứng diện đặc biệt: Có bằng tiến sĩ tối thiểu 06 năm và 01 năm cuối đang là giảng viên chính của trường; hoặc đã/đang giữ chức vụ chỉ huy cấp trung (lữ) đoàn/tương đương trở lên). Hiện có: ${yearsAsGvc} năm.`);
      }
      if (!isBậc4orHigher) {
        gvccMissing.push('Yêu cầu Ngoại ngữ: Trình độ bậc 4 trở lên');
      }
      if (!meetsGvccUnitExp) {
        gvccMissing.push('Thiếu điều kiện thực tế đơn vị (Yêu cầu cấp trung/lữ đoàn trở lên)');
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

      // Determine actual held title solely based on academic title
      const heldTitle = teacher.academicTitle || 'Không';

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
        meetsGvUnitExp,
        meetsGvcUnitExp,
        meetsGvccUnitExp,
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
        isBậc2orHigher,
        isBậc3orHigher,
        isBậc4orHigher,
        hasITCert,
        gvcBookLeaderCount,
        gvcBookMemberCount,
        gvcBooksCount: gvcBooks.length,
        gvcGuidanceCount: gvcGuidances.length,
        gvccBookMemberCount,
        gvccBooksCount: gvccBooks.length,
        gvccGuidancesCount: gvccGuidances.length,
        gvccPhdGuidanceCount,
        yearsAsGv,
        yearsAsGvc,
        isGvcSpecial1,
        isGvcSpecial2,
        isGvccSpecial1,
        isGvccSpecial2,
        meetsGvcNgachYears,
        meetsGvccNgachYears
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
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              THÔNG TƯ 07/2021 - BQP
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Tiêu chuẩn Chức danh sĩ quan chuyên môn - kỹ thuật - nghiệp vụ</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Hệ thống tự động tra cứu thời gian giữ ngạch, chứng chỉ nghiệp vụ sư phạm, tin học ngoại ngữ và kết hợp rà soát các công trình đề tài khoa học công bố của giảng viên đối chiếu chuẩn Quốc gia (Giảng viên, Giảng viên chính, và Giảng viên cao cấp)
          </p>
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-4 text-left">
                  Họ tên<br />
                  Chức vụ<br />
                  Chức danh
                </th>                
                <th className="py-3 px-4">Thời gian giữ ngạch</th>
                <th className="py-3 px-4">Bằng cấp</th>
                <th className="py-3 px-4">Thực tế đơn vị</th>
                <th className="py-3 px-4">Hoạt động chuyên môn</th>
                <th className="py-3 px-4">
                  <div>Ngoại ngữ</div>
                  <div>Tin học</div>
                  <div>Sư phạm</div>
                </th>
                <th className="py-3 px-4 text-center">Đánh giá</th>
                <th className="py-3 px-4 text-center">Chi tiết</th>
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
                          <span className="text-xs text-slate-500 block font-bold mt-1 tracking-wider">
                            {item.department}
                          </span>
                          
                          <div className="flex flex-col gap-0.5 mt-1 text-xs font-medium text-slate-600">
                            <div className="mt-1">
                              {item.academicTitle && item.academicTitle !== 'Không' ? (
                                <span className="font-extrabold text-blue-700 px-1 py-0.2">
                                  {item.academicTitle}
                                </span>
                              ) : (
                                <span className="font-bold text-slate-400 px-1 py-0.2">
                                  Không (Chưa có)
                                </span>
                              )}
                            </div>
                          </div>

                          {item.academicTitle && item.academicTitle !== 'Không' && item.academicTitleYear && (
                            <div className="mt-1.5">
                              <span className="text-xs inline-flex  gap-1 text-amber-700 px-1.5 py-0.5 rounded-md font-bold max-w-full shadow-3xs" title={`Toàn bộ thành tích NCKH trước năm ${item.academicTitleYear} được reset khi xét chức danh kế tiếp`}>
                                Năm {item.academicTitleYear} 
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {(() => {
                            const target = item.targetEvalTitle;
                            
                            if (target === 'Giảng viên cao cấp') {
                              if (item.yearsAsGvc >= 6) {
                                return (
                                  <div className="text-xs text-emerald-700 font-bold w-fit flex items-center gap-1.5" title="Đồng chí đã có thời gian giữ ngạch GVC đủ điều kiện (≥ 6 năm)">
                                    ✓ Giữ ngạch GVC: {item.yearsAsGvc} năm
                                  </div>
                                );
                              }
                              
                              if (item.isGvccSpecial1) {
                                  return (
                                    <div className="text-xs text-emerald-700 font-bold w-fit flex items-center gap-1.5" title="Thỏa mãn đặc cách học vị GVCC (TS ≥ 6 năm)">
                                      ✓ Học vị: TS ≥ 6 năm
                                    </div>
                                  );
                                }
                              
                              if (item.isGvccSpecial2) {
                                return (
                                  <div className="text-xs text-emerald-700 font-bold w-fit flex items-center gap-1.5" title="Xét đặc cách/miễn thâm niên do giữ chức vụ chỉ huy cấp Trung / Lữ đoàn">
                                    ✓ Chỉ huy Trung/Lữ đoàn
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="text-xs text-rose-600 font-bold w-fit flex items-center gap-1.5" title={`Chưa đạt mốc 6 năm giữ ngạch GVC. Hiện tại: ${item.yearsAsGvc} năm`}>
                                  ✗ Giữ ngạch GVC: {item.yearsAsGvc}/6 năm
                                </div>
                              );
                            }

                            if (target === 'Giảng viên chính') {
                              if (item.yearsAsGv >= 6) {
                                return (
                                  <div className="text-xs text-emerald-700 font-bold w-fit flex items-center gap-1.5" title="Đồng chí đã có thời gian giữ ngạch GV đủ điều kiện (≥ 6 năm)">
                                    ✓ Giữ ngạch GV: {item.yearsAsGv} năm
                                  </div>
                                );
                              }

                              if (item.isGvcSpecial1) {
                                const typeStr = item.rank === 'TS' || item.rank === 'PGS' || item.rank === 'GS' ? 'TS ≥ 2 năm' : 'ThS ≥ 6 năm';
                                return (
                                  <div className="text-xs text-emerald-700 font-bold w-fit flex items-center gap-1.5" title={`Thỏa mãn đặc cách học vị GVC (${typeStr})`}>
                                    ✓ Học vị: {typeStr}
                                  </div>
                                );
                              }

                              if (item.isGvcSpecial2) {
                                return (
                                  <div className="text-xs text-emerald-700 font-bold w-fit flex items-center gap-1.5" title="Xét đặc cách/miễn thâm niên do giữ chức vụ chỉ huy cấp Tiểu đoàn / Trưởng bộ môn">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    ✓ Chỉ huy Tiểu đoàn/Bộ môn
                                  </div>
                                );
                              }

                              return (
                                <div className="text-xs text-rose-600 font-bold w-fit flex items-center gap-1.5" title={`Chưa đạt mốc 6 năm giữ ngạch GV. Hiện tại: ${item.yearsAsGv} năm`}>
                                  ✗ Giữ ngạch GV: {item.yearsAsGv}/6 năm
                                </div>
                              );
                            }

                            // Fallback for Giảng viên evaluation or other
                            if (item.teachingYears >= 1) {
                              return (
                                <div className="text-xs text-emerald-700 font-bold w-fit flex items-center gap-1.5" title="Có thời gian làm công tác giảng dạy đủ 1 năm trở lên">
                                  ✓ Công tác: {item.teachingYears} năm
                                </div>
                              );
                            }

                            return (
                              <div className="text-xs text-rose-600 font-bold w-fit flex items-center gap-1.5" title="Chưa đạt yêu cầu thời gian công tác (tối thiểu 1 năm)">
                                ✗ Công tác: {item.teachingYears}/1 năm
                              </div>
                            );
                          })()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {(() => {
                          const degreeText = item.rank === 'CN' ? 'Cử nhân/Kỹ sư' : item.rank === 'ThS' ? 'Thạc sĩ' : item.rank === 'TS' ? 'Tiến sĩ' : item.rank === 'PGS' ? 'Phó Giáo sư' : item.rank === 'GS' ? 'Giáo sư' : item.rank;
                          const isDegreePassed = item.targetEvalTitle === 'Giảng viên cao cấp'
                            ? ['TS', 'PGS', 'GS'].includes(item.rank)
                            : item.targetEvalTitle === 'Giảng viên chính'
                              ? ['ThS', 'TS', 'PGS', 'GS'].includes(item.rank)
                              : ['CN', 'ThS', 'TS', 'PGS', 'GS'].includes(item.rank);
                          
                          return (
                            <div className="flex items-center">
                              {isDegreePassed ? (
                                <span className="text-xs font-bold text-emerald-700 w-fit flex items-center gap-1" title={`${item.targetEvalTitle === 'Giảng viên cao cấp' ? 'Yêu cầu: Tiến sĩ' : item.targetEvalTitle === 'Giảng viên chính' ? 'Yêu cầu: Thạc sĩ' : 'Yêu cầu: Cử nhân/Kỹ sư'}`}>
                                  ✓ {degreeText}
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-rose-600 w-fit flex items-center gap-1" title={`Chưa đạt yêu cầu tối thiểu cho ${item.targetEvalTitle}`}>
                                  ✗ {degreeText}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-4">
                        {(() => {
                          const meetsExp = item.targetEvalTitle === 'Giảng viên cao cấp'
                            ? item.meetsGvccUnitExp
                            : item.targetEvalTitle === 'Giảng viên chính'
                              ? item.meetsGvcUnitExp
                              : item.meetsGvUnitExp;
                          
                          const reqText = item.targetEvalTitle === 'Giảng viên' ? 'Yêu cầu: Cấp tiểu đoàn trở lên' : 'Yêu cầu: Cấp trung (lữ) đoàn trở lên';
                          
                          if (meetsExp) {
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-emerald-700 w-fit flex items-center gap-1" title={reqText}>
                                  ✓ {item.unitExperience}
                                </span>
                                {item.unitExperienceYear && (
                                  <span className="text-xs text-slate-500 block font-medium pl-1">
                                    Năm: {item.unitExperienceYear}
                                  </span>
                                )}
                              </div>
                            );
                          } else {
                            const expText = item.unitExperience && item.unitExperience !== 'Chưa đi' && item.unitExperience !== 'Chưa đi thực tế'
                              ? item.unitExperience
                              : 'Chưa đi thực tế';
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-rose-600 w-fit flex items-center gap-1" title={reqText}>
                                  ✗ {expText}
                                </span>
                                {item.unitExperience && item.unitExperience !== 'Chưa đi' && item.unitExperience !== 'Chưa đi thực tế' && item.unitExperienceYear && (
                                  <span className="text-xs text-slate-400 block font-medium pl-1">
                                    Năm: {item.unitExperienceYear}
                                  </span>
                                )}
                              </div>
                            );
                          }
                        })()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {(() => {
                            const target = item.targetEvalTitle;
                            // Quyết định dùng bộ số liệu nào dựa trên target title
                            const projectCount = target === 'Giảng viên cao cấp'
                              ? item.gvccProjectsCount
                              : item.gvcProjectsCount;
                            const projectLeaderCount = target === 'Giảng viên cao cấp'
                              ? item.gvccProjectLeaderCount
                              : item.gvcProjectLeaderCount;
                            const projectMemberCount = target === 'Giảng viên cao cấp'
                              ? (item.gvccProjectsCount - item.gvccProjectLeaderCount)
                              : item.gvcProjectMemberCount;
                            const bookLeaderCount = target === 'Giảng viên cao cấp'
                              ? item.gvccBookLeaderCount
                              : item.gvcBookLeaderCount;
                            const bookMemberCount = target === 'Giảng viên cao cấp'
                              ? item.gvccBookMemberCount
                              : item.gvcBookMemberCount;
                            const articleCount = target === 'Giảng viên cao cấp'
                              ? item.gvccArticlesCount
                              : item.gvcArticlesCount;
                            const guidanceCount = target === 'Giảng viên cao cấp'
                              ? item.gvccGuidancesCount
                              : item.gvcGuidanceCount;
                            const phdGuidanceCount = target === 'Giảng viên cao cấp'
                              ? item.gvccPhdGuidanceCount
                              : 0;

                            // Điều kiện đạt cho từng mục
                            // GVC: Chủ trì ≥ 1 hoặc tham gia ≥ 2 | GVCC: Chủ trì ≥ 2 (cấp CS) hoặc ≥ 1 cấp cao hơn
                            let meetsProject = false;
                            let projectReqText = '';
                            if (target === 'Giảng viên cao cấp') {
                              // GVCC: Chủ trì ≥ 2 đề tài cấp cơ sở HOẶC ≥ 1 đề tài cấp Bộ/Ngành trở lên
                              meetsProject = (projectLeaderCount >= 2) || (projectLeaderCount >= 1 && (item.gvccHighLeaderCount ?? 0) >= 1);
                              projectReqText = 'Chủ trì ≥ 2 cấp CS hoặc ≥ 1 cấp Bộ';
                            } else if (target === 'Giảng viên chính') {
                              meetsProject = (projectLeaderCount >= 1) || (projectMemberCount >= 2);
                              projectReqText = 'Chủ trì ≥ 1 hoặc tham gia ≥ 2';
                            } else {
                              meetsProject = true; // GV không yêu cầu
                              projectReqText = 'Chưa yêu cầu (GV)';
                            }

                            // GT-TL: GVC: Chủ trì ≥ 1 hoặc tham gia ≥ 2 | GVCC: Chủ trì ≥ 2 hoặc tổng tham gia ≥ 3
                            let meetsBook = false;
                            let bookReqText = '';
                            if (target === 'Giảng viên cao cấp') {
                              meetsBook = (bookLeaderCount >= 2) || (bookLeaderCount + bookMemberCount >= 3);
                              bookReqText = 'Chủ trì ≥ 2 hoặc tổng ≥ 3';
                            } else if (target === 'Giảng viên chính') {
                              meetsBook = (bookLeaderCount >= 1) || (bookMemberCount >= 2);
                              bookReqText = 'Chủ trì ≥ 1 hoặc tham gia ≥ 2';
                            } else {
                              meetsBook = true;
                              bookReqText = 'Chưa yêu cầu (GV)';
                            }

                            // Bài báo: GVC: ≥ 2 | GVCC: ≥ 3
                            let meetsArticle = false;
                            let articleReqText = '';
                            if (target === 'Giảng viên cao cấp') {
                              meetsArticle = articleCount >= 3;
                              articleReqText = 'Cần ≥ 3 bài báo';
                            } else if (target === 'Giảng viên chính') {
                              meetsArticle = articleCount >= 2;
                              articleReqText = 'Cần ≥ 2 bài báo';
                            } else {
                              meetsArticle = true;
                              articleReqText = 'Chưa yêu cầu (GV)';
                            }

                            // Hướng dẫn:
                            // GVC: TS - ≥ 1 HV cao học BVTC; ThS - ≥ 3 HV/NCKH/sáng kiến; Thay thế - ≥ 3 giải Olympic (≥ giải 3)
                            // GVCC: ≥ 2 HV cao học HOẶC ≥ 1 NCS bảo vệ thành công
                            let meetsGuidance = false;
                            let guidanceReqText = '';
                            if (target === 'Giảng viên cao cấp') {
                              meetsGuidance = (phdGuidanceCount >= 1) || (guidanceCount >= 2);
                              guidanceReqText = '≥ 2 HV cao học HOẶC ≥ 1 NCS BVTC';
                            } else if (target === 'Giảng viên chính') {
                              const isPhd = ['TS', 'PGS', 'GS'].includes(item.rank);
                              if (isPhd) {
                                meetsGuidance = (phdGuidanceCount >= 1) || (guidanceCount >= 1);
                                guidanceReqText = 'TS: ≥ 1 HV cao học BVTC';
                              } else {
                                meetsGuidance = (guidanceCount >= 3) || !!(item.gvgYears && item.gvgYears.trim());
                                guidanceReqText = 'ThS: ≥ 3 HV/NCKH hoặc GVG';
                              }
                            } else {
                              meetsGuidance = true;
                              guidanceReqText = 'Chưa yêu cầu (GV)';
                            }

                            // Hiển thị 4 hàng
                            return (
                              <div className="space-y-1.5">
                                {/* Row 1: Đề tài */}
                                <div className="flex items-center gap-1.5">
                                  {meetsProject ? (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-emerald-700" title={`Đạt yêu cầu: ${projectReqText} (Hiện: ${projectLeaderCount} chủ trì / ${projectMemberCount} thành viên)`}>
                                      <span>✓ Đề tài: <span className="font-mono">{projectLeaderCount} chính / {projectCount} tổng</span></span>
                                    </span>
                                  ) : (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-rose-600" title={`Chưa đạt: ${projectReqText} (Hiện: ${projectLeaderCount} chủ trì / ${projectMemberCount} thành viên)`}>
                                      <span>✗ Đề tài: <span className="font-mono">{projectLeaderCount} chính / {projectCount} tổng</span></span>
                                    </span>
                                  )}
                                </div>

                                {/* Row 2: GT-TL */}
                                <div className="flex items-center gap-1.5">
                                  {meetsBook ? (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-emerald-700" title={`Đạt yêu cầu: ${bookReqText} (Hiện: ${bookLeaderCount} chủ biên / ${bookMemberCount} tham gia)`}>
                                      <span>✓ GT-TL: <span className="font-mono">{bookLeaderCount} chủ biên / {bookMemberCount + bookLeaderCount} tổng</span></span>
                                    </span>
                                  ) : (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-rose-600" title={`Chưa đạt: ${bookReqText} (Hiện: ${bookLeaderCount} chủ biên / ${bookMemberCount} tham gia)`}>
                                      <span>✗ GT-TL: <span className="font-mono">{bookLeaderCount} chủ biên / {bookMemberCount + bookLeaderCount} tổng</span></span>
                                    </span>
                                  )}
                                </div>

                                {/* Row 3: Bài báo */}
                                <div className="flex items-center gap-1.5">
                                  {meetsArticle ? (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-emerald-700" title={`Đạt yêu cầu: ${articleReqText} (Hiện: ${articleCount} bài)`}>
                                      <span>✓ Bài báo: <span className="font-mono">{articleCount} bài</span></span>
                                    </span>
                                  ) : (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-rose-600" title={`Chưa đạt: ${articleReqText} (Hiện: ${articleCount} bài)`}>
                                      <span>✗ Bài báo: <span className="font-mono">{articleCount} bài</span></span>
                                    </span>
                                  )}
                                </div>

                                {/* Row 4: Hướng dẫn */}
                                <div className="flex items-center gap-1.5">
                                  {meetsGuidance ? (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-emerald-700" title={`Đạt yêu cầu: ${guidanceReqText} (Hiện: ${guidanceCount} lượt, ${phdGuidanceCount} NCS)`}>
                                      <span>✓ Hướng dẫn: <span className="font-mono">{guidanceCount} lượt{phdGuidanceCount > 0 ? ` (${phdGuidanceCount} NCS)` : ''}</span></span>
                                    </span>
                                  ) : (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-rose-600" title={`Chưa đạt: ${guidanceReqText} (Hiện: ${guidanceCount} lượt, ${phdGuidanceCount} NCS)`}>
                                      <span>✗ Hướng dẫn: <span className="font-mono">{guidanceCount} lượt{phdGuidanceCount > 0 ? ` (${phdGuidanceCount} NCS)` : ''}</span></span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {(() => {
                            const meetsLang = item.targetEvalTitle === 'Giảng viên cao cấp' 
                              ? item.isBậc4orHigher 
                              : item.targetEvalTitle === 'Giảng viên chính' 
                                ? item.isBậc3orHigher 
                                : item.isBậc2orHigher;

                            const requiredLangText = item.targetEvalTitle === 'Giảng viên cao cấp' 
                              ? 'Bậc 4' 
                              : item.targetEvalTitle === 'Giảng viên chính' 
                                ? 'Bậc 3' 
                                : 'Bậc 2';

                            return (
                              <>
                                <div className="pt-0.5">
                                  {meetsLang ? (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-emerald-700" title={`Chứng chỉ NN đạt chuẩn yêu cầu (Yêu cầu ≥ ${requiredLangText})`}>
                                      ✓ NN: {item.langCertStr || 'Đạt chuẩn'}
                                    </span>
                                  ) : (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-rose-600" title={`Yêu cầu tối thiểu đạt chuẩn ${requiredLangText}`}>
                                      ✗ NN: {item.langCertStr || 'Chưa đạt'}
                                    </span>
                                  )}
                                </div>

                                <div className="pt-0.5">
                                  {item.hasITCert ? (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-emerald-700" title="Đã có chứng chỉ tin học đạt chuẩn">
                                      ✓ Tin học: Đạt
                                    </span>
                                  ) : (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-rose-600" title="Chưa có thông tin chứng chỉ CNTT">
                                      ✗ Tin học: Chưa đạt
                                    </span>
                                  )}
                                </div>

                                <div className="pt-0.5">
                                  {item.hasPedagogyCert ? (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-emerald-700" title={`Đã có chứng chỉ Nghiệp vụ Sư phạm, năm cấp: ${item.pedagogyCertYear}`}>
                                      ✓ NVSP: {item.pedagogyCertYear}
                                    </span>
                                  ) : (
                                    <span className="text-xs inline-flex items-center gap-1 font-bold text-rose-600" title="Chưa có thông tin chứng chỉ Nghiệp vụ Sư phạm">
                                      ✗ Chưa có NVSP
                                    </span>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </td>



                      <td className="py-3 px-4 text-center">
                        {item.heldTitle === 'Giảng viên cao cấp' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full font-extrabold text-xs tracking-wider border border-amber-400 shadow-[0_2px_10px_rgba(245,158,11,0.25)]">
                              <Sparkles className="w-3 h-3 text-white animate-pulse" />
                              ĐẠT CHUẨN GVCC
                            </span>
                            <span className="text-xs text-amber-700 font-extrabold uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Hàm cao nhất (Hạng I)</span>
                          </div>
                        ) : item.targetEvalPassed ? (
                          <div className="flex flex-col items-center gap-1">
                            {item.targetEvalTitle === 'Giảng viên cao cấp' && (
                              <>
                                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full font-extrabold text-xs tracking-wider border border-orange-400 shadow-[0_2px_12px_rgba(249,115,22,0.3)]">
                                  <Sparkles className="w-3 h-3 text-white animate-pulse" />
                                  ĐỦ ĐIỀU KIỆN GVCC
                                </span>
                                <span className="text-xs text-orange-700 font-extrabold uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded border border-orange-200">Đủ chuẩn thăng hạng I</span>
                              </>
                            )}
                            {item.targetEvalTitle === 'Giảng viên chính' && (
                              <>
                                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full font-extrabold text-xs tracking-wider border border-blue-500 shadow-[0_2px_12px_rgba(37,99,235,0.3)]">
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                  ĐỦ ĐIỀU KIỆN GVC
                                </span>
                                <span className="text-xs text-blue-700 font-extrabold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Đủ chuẩn thăng hạng II</span>
                              </>
                            )}
                            {item.targetEvalTitle === 'Giảng viên' && (
                              <>
                                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full font-extrabold text-xs tracking-wider border border-emerald-500 shadow-[0_2px_10px_rgba(16,185,129,0.25)]">
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                  ĐẠT CHUẨN GV
                                </span>
                                <span className="text-xs text-emerald-700 font-extrabold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Đạt chuẩn Hạng III</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            {item.targetEvalTitle === 'Giảng viên cao cấp' && (
                              <>
                                <span className="inline-flex items-center gap-1.5 bg-amber-50/80 text-amber-900 px-3 py-1.5 rounded-full font-extrabold text-xs tracking-wider border border-dashed border-amber-300 shadow-3xs" title={item.targetEvalMissing.join('\n')}>
                                  <XCircle className="w-3.5 h-3.5 text-amber-500" />
                                  Chưa đạt GVCC
                                </span>
                                <span className="text-xs text-amber-700 font-bold bg-amber-50/60 px-2 py-0.5 rounded border border-amber-200/40">
                                  Thiếu {item.targetEvalMissing.length} tiêu chí
                                </span>
                              </>
                            )}
                            {item.targetEvalTitle === 'Giảng viên chính' && (
                              <>
                                <span className="inline-flex items-center gap-1.5 bg-blue-50/90 text-blue-900 px-3 py-1.5 rounded-full font-extrabold text-xs tracking-wider border border-dashed border-blue-300 shadow-3xs" title={item.targetEvalMissing.join('\n')}>
                                  <XCircle className="w-3.5 h-3.5 text-blue-500" />
                                  Chưa đạt GVC
                                </span>
                                <span className="text-xs text-blue-700 font-bold bg-blue-50/50 px-2 py-0.5 rounded border border-blue-200/40">
                                  Thiếu {item.targetEvalMissing.length} tiêu chí
                                </span>
                              </>
                            )}
                            {item.targetEvalTitle === 'Giảng viên' && (
                              <>
                                <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-900 px-3 py-1.5 rounded-full font-extrabold text-xs tracking-wider border border-rose-300 shadow-sm" title={item.targetEvalMissing.join('\n')}>
                                  <XCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                  Chưa đạt GV
                                </span>
                                <span className="text-xs text-rose-700 font-extrabold bg-rose-50/80 px-2 py-0.5 rounded border border-rose-200 shadow-3xs">
                                  Thiếu {item.targetEvalMissing.length} tiêu chí
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedTeacherId(item.id)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer transition-all"
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

      {/* Official requirements checklist cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Giảng viên */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-slate-800 font-extrabold text-xs uppercase tracking-wider px-2.5 py-1 bg-slate-100 rounded-md">
                Giảng viên (Hạng III)
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <b>Thời gian công tác:</b> Thời gian làm công tác giảng dạy tối thiểu <b>01 năm</b> tính đến thời điểm đăng ký hồ sơ xét duyệt.
                </span>
              </li>
              <li className="flex items-start gap-2 text-blue-700 bg-blue-50/50 p-1.5 rounded-md border border-blue-105">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">
                  <b>Lưu ý học viên SQ:</b> Giảng viên giảng dạy bậc đại học tại trường sĩ quan phải có bằng <b>Thạc sĩ trở lên</b>. Đi thực tế, đào tạo, bồi dưỡng được tính vào thời gian giảng dạy.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Globe2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><b>Ngoại ngữ:</b> Trình độ ngoại ngữ đạt từ cực tiểu <b>Bậc 2</b> trở lên.</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><b>Thực tế đơn vị:</b> Yêu cầu đi thực tế từ <b>cấp tiểu đoàn trở lên</b>.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><b>Tin học & Nghiệp vụ:</b> Sư phạm đầy đủ & kỹ năng sử dụng CNTT cơ bản.</span>
              </li>
            </ul>
          </div>
          <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Tiêu chuẩn Hạng III (Điều 22)</span>
            <span className="text-blue-700 font-bold bg-blue-50 px-1.5 rounded">Thạc sĩ (SQ)</span>
          </div>
        </div>

        {/* Card 2: Giảng viên chính */}
        <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-3xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-blue-50/10 to-transparent">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-blue-800 font-extrabold text-xs uppercase tracking-wider px-2.5 py-1 bg-blue-55 rounded-md">
                Giảng viên chính (Hạng II)
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <b>Thời gian giữ ngạch:</b> Giữ ngạch chức danh Giảng viên tối thiểu <b>06 năm</b>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <b>Điều kiện kèm theo:</b> Thời gian gần nhất giữ chức danh Giảng viên tối thiểu <b>01 năm</b> tính đến thời điểm nộp hồ sơ.
                </span>
              </li>
              <li className="flex items-start gap-2 text-violet-700 bg-violet-50/50 p-2 rounded-md border border-violet-100">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-500" />
                <span className="text-xs leading-relaxed">
                  <b>Trường hợp đặc biệt (nếu chưa đủ 06 năm):</b>
                  <span className="block mt-1">• Có bằng ThS tối thiểu 06 năm hoặc Tiến sĩ tối thiểu 02 năm, và 01 năm cuối đang là giảng viên trường.</span>
                  <span className="block mt-0.5">• Đã giữ chức vụ chỉ huy cấp tiểu đoàn hoặc tương đương trở lên.</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><b>Thực tế đơn vị:</b> Yêu cầu đi thực tế từ <b>cấp trung (lữ) đoàn trở lên</b>.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><b>NCKH:</b> Chủ trì 01 hoặc tham gia 02 đề tài cấp cơ sở; 02 bài báo & chủ biên 01 GT/tài liệu.</span>
              </li>
            </ul>
          </div>
          <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-xs text-blue-600 font-semibold">
            <span>Tiêu chuẩn Hạng II (Điều 23)</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-1.5 rounded">Thạc sĩ</span>
          </div>
        </div>

        {/* Card 3: Giảng viên cao cấp */}
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-3xs flex flex-col justify-between bg-gradient-to-b from-amber-50/10 to-transparent">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-amber-800 font-extrabold text-xs uppercase tracking-wider px-2.5 py-1 bg-amber-50 rounded-md">
                Giảng viên cao cấp (Hạng I)
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <b>Thời gian giữ ngạch:</b> Giữ ngạch chức danh Giảng viên chính tối thiểu <b>06 năm</b>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <b>Điều kiện kèm theo:</b> Thời gian gần nhất giữ chức danh Giảng viên chính tối thiểu <b>01 năm</b> tính đến thời điểm nộp hồ sơ.
                </span>
              </li>
              <li className="flex items-start gap-2 text-amber-800 bg-amber-50/50 p-2 rounded-md border border-amber-150">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                <span className="text-xs leading-relaxed">
                  <b>Trường hợp đặc biệt (nếu chưa đủ 06 năm):</b>
                  <span className="block mt-1">• Có bằng Tiến sĩ tối thiểu 06 năm và 01 năm cuối đang là giảng viên chính của trường.</span>
                  <span className="block mt-0.5">• Đã giữ chức vụ chỉ huy cấp trung (lữ) đoàn hoặc tương đương trở lên.</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Globe2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><b>Ngoại ngữ & Trình độ:</b> Tiêu chuẩn ngoại ngữ Bậc 4 & Học vị Tiến sĩ.</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><b>Thực tế đơn vị:</b> Yêu cầu đi thực tế từ <b>cấp trung (lữ) đoàn trở lên</b>.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><b>NCKH:</b> Chủ chủ trì 02 đề tài cơ sở hoặc 01 Bộ/Ngành; 03 bài báo & chủ biên 02 GT/tài liệu; hướng dẫn 02 Ths hoặc 01 NCS.</span>
              </li>
            </ul>
          </div>
          <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-xs text-amber-600 font-semibold">
            <span>Tiêu chuẩn Hạng I (Điều 24)</span>
            <span className="bg-amber-100 text-amber-800 text-xs px-1.5 rounded">Tiến sĩ</span>
          </div>
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
                      Hồ sơ & Lộ trình đạt chuẩn chức danh
                    </h3>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-slate-500 mt-0.5 font-medium">
                      <span>Giảng viên: <b className="text-slate-800">{selectedTeacher.name}</b></span>
                      <span>•</span>
                      <span>Chức vụ: <b className="text-slate-700">{selectedTeacher.position}</b></span>
                      <span>•</span>
                      <span>Chức danh: <b className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 py-0.2 rounded-sm">{selectedTeacher.academicTitle && selectedTeacher.academicTitle !== 'Không' ? selectedTeacher.academicTitle : 'Không'}</b></span>
                    </div>
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
                {/* Visual promotion track with distinct positions and academic titles */}
                {(() => {
                  const heldTitle = selectedTeacher.academicTitle || 'Không';

                  const stepGvPassed = ['Giảng viên', 'Giảng viên chính', 'Giảng viên cao cấp'].includes(heldTitle);
                  const stepGvcPassed = ['Giảng viên chính', 'Giảng viên cao cấp'].includes(heldTitle);
                  const stepGvccPassed = ['Giảng viên cao cấp'].includes(heldTitle);

                  // Phase 1: Giảng viên (Grade III)
                  let gvBgClass = 'bg-slate-50 border-slate-200 text-slate-400';
                  let gvIcon = <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />;
                  let gvStatusText = 'Chưa đạt chuẩn';
                  let gvLabelText = selectedTeacher.gv.passed ? 'Đủ điều kiện đạt' : `Thiếu ${selectedTeacher.gv.missing.length} tiêu chuẩn`;

                  if (stepGvPassed) {
                    gvBgClass = 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs';
                    gvIcon = <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3px] shrink-0" />;
                    gvStatusText = 'Đã đạt chức danh';
                    gvLabelText = 'Chức danh hiện thời';
                  } else if (selectedTeacher.gv.passed) {
                    gvBgClass = 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-700 animate-pulse';
                    gvIcon = <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
                    gvStatusText = 'Đủ tiêu chuẩn';
                    gvLabelText = 'Đạt chuẩn Hạng III';
                  }

                  // Phase 2: Giảng viên chính (Grade II)
                  let gvcBgClass = 'bg-slate-50 border-slate-200 text-slate-400';
                  let gvcIcon = <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />;
                  let gvcStatusText = 'Chưa đạt chuẩn';
                  let gvcLabelText = heldTitle === 'Không' ? 'Cần đạt GV trước' : `Thiếu ${selectedTeacher.gvc.missing.length} tiêu chuẩn`;

                  if (stepGvcPassed) {
                    gvcBgClass = 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs';
                    gvcIcon = <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3px] shrink-0" />;
                    gvcStatusText = 'Đã đạt chức danh';
                    gvcLabelText = 'Chức danh hiện thời';
                  } else if (heldTitle === 'Giảng viên') {
                    if (selectedTeacher.gvc.passed) {
                      gvcBgClass = 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-700 animate-pulse';
                      gvcIcon = <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
                      gvcStatusText = 'Đủ tiêu chuẩn';
                      gvcLabelText = 'Đủ chuẩn GVC';
                    } else {
                      gvcBgClass = 'bg-slate-50 border-slate-200 text-slate-600';
                      gvcIcon = <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />;
                      gvcStatusText = 'Đang tích lũy';
                      gvcLabelText = `Còn thiếu ${selectedTeacher.gvc.missing.length} tiêu chí`;
                    }
                  }

                  // Phase 3: Giảng viên cao cấp (Grade I)
                  let gvccBgClass = 'bg-slate-50 border-slate-200 text-slate-400';
                  let gvccIcon = <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />;
                  let gvccStatusText = 'Chưa đạt chuẩn';
                  let gvccLabelText = heldTitle === 'Giảng viên chính' ? `Thiếu ${selectedTeacher.gvcc.missing.length} tiêu chuẩn` : 'Cần đạt GVC trước';

                  if (stepGvccPassed) {
                    gvccBgClass = 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs';
                    gvccIcon = <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3px] shrink-0" />;
                    gvccStatusText = 'HÀM CAO NHẤT';
                    gvccLabelText = 'Chức danh hiện thời';
                  } else if (heldTitle === 'Giảng viên chính') {
                    if (selectedTeacher.gvcc.passed) {
                      gvccBgClass = 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-700 animate-pulse';
                      gvccIcon = <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
                      gvccStatusText = 'Đủ tiêu chuẩn';
                      gvccLabelText = 'Đủ chuẩn GVCC';
                    } else {
                      gvccBgClass = 'bg-slate-50 border-slate-200 text-slate-600';
                      gvccIcon = <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />;
                      gvccStatusText = 'Đang tích lũy';
                      gvccLabelText = `Còn thiếu ${selectedTeacher.gvcc.missing.length} tiêu chí`;
                    }
                  }

                  return (
                    <div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        {/* Step GV */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between items-center min-h-[96px] ${gvBgClass}`}>
                          <div className="font-bold flex items-center justify-center gap-1 text-xs tracking-wide">
                            {gvIcon}
                            Giảng viên (III)
                          </div>
                          <div>
                            <span className="text-xs font-extrabold px-1.5 py-0.5 rounded shadow-3xs block border border-slate-200/40 bg-white/70">
                              {gvStatusText}
                            </span>
                            <span className="text-xs text-slate-500 block mt-1 font-semibold leading-snug">
                              {gvLabelText}
                            </span>
                          </div>
                        </div>

                        {/* Step GVC */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between items-center min-h-[96px] ${gvcBgClass}`}>
                          <div className="font-bold flex items-center justify-center gap-1 text-xs tracking-wide">
                            {gvcIcon}
                            Giảng viên chính (II)
                          </div>
                          <div>
                            <span className="text-xs font-extrabold px-1.5 py-0.5 rounded shadow-3xs block border border-slate-200/40 bg-white/70">
                              {gvcStatusText}
                            </span>
                            <span className="text-xs text-slate-500 block mt-1 font-semibold leading-snug">
                              {gvcLabelText}
                            </span>
                          </div>
                        </div>

                        {/* Step GVCC */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between items-center min-h-[96px] ${gvccBgClass}`}>
                          <div className="font-bold flex items-center justify-center gap-1 text-xs tracking-wide">
                            {gvccIcon}
                            Giảng viên cao cấp (I)
                          </div>
                          <div>
                            <span className="text-xs font-extrabold px-1.5 py-0.5 rounded shadow-3xs block border border-slate-200/40 bg-white/70">
                              {gvccStatusText}
                            </span>
                            <span className="text-xs text-slate-500 block mt-1 font-semibold leading-snug">
                              {gvccLabelText}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Sub-criteria detailed state review */}
                <div className="row-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    Đối chiếu các tiêu chí cá nhân hiện tại
                  </h4>

                  {selectedTeacher.academicTitle && selectedTeacher.academicTitle !== 'Không' && selectedTeacher.academicTitleYear && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed font-semibold">
                      <div className="flex items-center gap-1 text-amber-900 font-bold mb-1">
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        Quy tắc tính thành tích NCKH khi xét thăng hạng chức danh mới:
                      </div>
                      Đồng chí nhận chức danh <span className="text-blue-700 font-bold">{selectedTeacher.academicTitle}</span> vào năm <span className="text-blue-700 font-bold">{selectedTeacher.academicTitleYear}</span>. 
                      Toàn bộ các công trình NCKH trước năm <b>{selectedTeacher.academicTitleYear}</b> đã được sử dụng xét duyệt cho chức danh hiện thời nên <span className="text-rose-600 font-bold">không được sử dụng lại</span> khi xét chức danh tiếp theo.
                    </div>
                  )}

                  <div className="space-y-2.5 text-xs text-slate-700">
                    {/* 1. Bằng cấp */}
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">1. Bằng cấp:</span>
                      <div className="col-span-2 font-bold text-slate-800">
                        <div>
                          {(() => {
                            const degreeText = selectedTeacher.rank === 'CN' ? 'Cử nhân/Kỹ sư' 
                              : selectedTeacher.rank === 'ThS' ? 'Thạc sĩ' 
                              : selectedTeacher.rank === 'TS' ? 'Tiến sĩ' 
                              : selectedTeacher.rank === 'PGS' ? 'Phó Giáo sư' 
                              : selectedTeacher.rank === 'GS' ? 'Giáo sư' 
                              : selectedTeacher.rank;
                            
                            // So sánh với yêu cầu của chức danh tiếp theo
                            const heldTitle = selectedTeacher.academicTitle || 'Không';
                            let requiredDegree = '';
                            let requiredDegreeFull = '';
                            let meetsRequired = false;
                            
                            if (heldTitle === 'Giảng viên cao cấp') {
                              // Đã đạt cao nhất
                              requiredDegree = '';
                            } else if (heldTitle === 'Giảng viên chính') {
                              // Mục tiêu: GVCC yêu cầu TS
                              requiredDegree = 'TS';
                              requiredDegreeFull = 'Tiến sĩ';
                              meetsRequired = ['TS', 'PGS', 'GS'].includes(selectedTeacher.rank);
                            } else if (heldTitle === 'Giảng viên') {
                              // Mục tiêu: GVC yêu cầu ThS
                              requiredDegree = 'ThS';
                              requiredDegreeFull = 'Thạc sĩ';
                              meetsRequired = ['ThS', 'TS', 'PGS', 'GS'].includes(selectedTeacher.rank);
                            } else {
                              // Chưa có chức danh - mục tiêu GV yêu cầu CN
                              requiredDegree = 'CN';
                              requiredDegreeFull = 'Cử nhân/Kỹ sư';
                              meetsRequired = ['CN', 'ThS', 'TS', 'PGS', 'GS'].includes(selectedTeacher.rank);
                            }

                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded ${selectedTeacher.rank === 'TS' || selectedTeacher.rank === 'PGS' || selectedTeacher.rank === 'GS' ? 'bg-blue-50 text-blue-700' : selectedTeacher.rank === 'ThS' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {degreeText}
                                  </span>
                                </div>
                                {requiredDegree && (
                                  <div className="text-xs">
                                    {meetsRequired ? (
                                      <span className="text-emerald-700 font-semibold">
                                        ✓ Đạt yêu cầu {selectedTeacher.targetEvalTitle === 'Giảng viên cao cấp' ? 'GVCC' : 'GVC'} (cần {requiredDegreeFull})
                                      </span>
                                    ) : (
                                      <span className="text-rose-600 font-semibold">
                                        ✗ Chưa đạt yêu cầu {selectedTeacher.targetEvalTitle === 'Giảng viên cao cấp' ? 'GVCC' : 'GVC'} (cần {requiredDegreeFull})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* 2. Thời gian giữ ngạch */}
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">                      <span className="font-semibold text-slate-400">2. Thời gian giữ ngạch:</span>
                      <div className="col-span-2 text-slate-800">
                        <div className="font-bold">
                          • Thời gian giữ ngạch Giảng viên: <span className="text-blue-700">{selectedTeacher.yearsAsGv} năm</span>
                          {selectedTeacher.meetsGvcNgachYears ? ' (Đạt chuẩn GVC)' : ' (Chưa đủ 06 năm)'}
                        </div>
                        <div className="font-bold mt-1">
                          • Thời gian giữ ngạch Giảng viên chính: <span className="text-blue-700">{selectedTeacher.yearsAsGvc} năm</span>
                          {selectedTeacher.meetsGvccNgachYears ? ' (Đạt chuẩn GVCC)' : ' (Chưa đủ 06 năm)'}
                        </div>

                        {(selectedTeacher.isGvcSpecial1 || selectedTeacher.isGvcSpecial2 || selectedTeacher.isGvccSpecial1 || selectedTeacher.isGvccSpecial2) && (
                          <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-1 rounded border border-emerald-200">
                            <b>Đặc cách ghi nhận:</b>
                            {selectedTeacher.isGvcSpecial1 && <span className="block">• Thỏa mãn ThS ≥ 06 năm / TS ≥ 02 năm + giữ ngạch GV ≥ 01 năm.</span>}
                            {selectedTeacher.isGvcSpecial2 && <span className="block">• Có chức vụ chỉ huy cấp Tiểu đoàn/tương đương trở lên ({selectedTeacher.position}).</span>}
                            {selectedTeacher.isGvccSpecial1 && <span className="block">• Thỏa mãn TS ≥ 06 năm + giữ ngạch GVC ≥ 01 năm.</span>}
                            {selectedTeacher.isGvccSpecial2 && <span className="block">• Có chức vụ chỉ huy cấp Trung (Lữ) đoàn/tương đương trở lên ({selectedTeacher.position}).</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Thực tế đơn vị */}
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">3. Thực tế đơn vị:</span>
                      <div className="col-span-2 text-slate-800">
                        <span className="font-bold block">
                          {selectedTeacher.unitExpText}
                        </span>
                        {(() => {
                          const meetsExp = selectedTeacher.targetEvalTitle === 'Giảng viên cao cấp'
                            ? selectedTeacher.meetsGvccUnitExp
                            : selectedTeacher.targetEvalTitle === 'Giảng viên chính'
                              ? selectedTeacher.meetsGvcUnitExp
                              : selectedTeacher.meetsGvUnitExp;

                          const reqText = selectedTeacher.targetEvalTitle === 'Giảng viên' ? 'Yêu cầu: Cấp tiểu đoàn trở lên' : 'Yêu cầu: Cấp trung (lữ) đoàn trở lên';

                          return meetsExp ? (
                            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 mt-1 inline-block font-semibold">
                              ✓ Đạt chuẩn thực tế đơn vị
                            </span>
                          ) : (
                            <span className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 mt-1 inline-block font-semibold">
                              ✗ Chưa đạt thực tế đơn vị
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 4. Hoạt động chuyên môn */}
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">4. Hoạt động chuyên môn:</span>
                      <div className="col-span-2 font-bold text-slate-800 space-y-1">
                        {/* 4a. Đề tài */}
                        <div>
                          <span className="text-slate-500">a. Đề tài:</span> {selectedTeacher.projects.length} đề tài ({selectedTeacher.projectLeaderCount} chủ trì / {selectedTeacher.projectMemberCount} thành viên)
                          {selectedTeacher.hasGvReset && selectedTeacher.academicTitle === 'Giảng viên' && (
                            <span className="text-amber-700 block mt-0.5 text-xs bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Xét GVC (sau {selectedTeacher.gvReceiptYear}):</b> {selectedTeacher.gvcProjectsCount} đề tài ({selectedTeacher.gvcProjectLeaderCount} CT)
                            </span>
                          )}
                          {selectedTeacher.hasGvcReset && selectedTeacher.academicTitle === 'Giảng viên chính' && (
                            <span className="text-amber-700 block mt-0.5 text-xs bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Xét GVCC (sau {selectedTeacher.gvReceiptYear}):</b> {selectedTeacher.gvccProjectsCount} đề tài ({selectedTeacher.gvccProjectLeaderCount} CT)
                            </span>
                          )}
                        </div>
                        {/* 4b. Giáo trình */}
                        <div>
                          <span className="text-slate-500">b. Giáo trình:</span> {selectedTeacher.bookLeaderCount} chủ biên
                          {selectedTeacher.hasGvcReset && (
                            <span className="text-amber-700 block mt-0.5 text-xs bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Xét GVCC (sau {selectedTeacher.gvReceiptYear}):</b> {selectedTeacher.gvccBookLeaderCount} GT chủ biên
                            </span>
                          )}
                        </div>
                        {/* 4c. Bài báo */}
                        <div>
                          <span className="text-slate-500">c. Bài báo:</span> {selectedTeacher.articles.length} bài (Có {selectedTeacher.internationalArticlesCount} bài ISI/Scopus)
                          {selectedTeacher.hasGvReset && selectedTeacher.academicTitle === 'Giảng viên' && (
                            <span className="text-amber-700 block mt-0.5 text-xs bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Xét GVC (sau {selectedTeacher.gvReceiptYear}):</b> {selectedTeacher.gvcArticlesCount} bài
                            </span>
                          )}
                          {selectedTeacher.hasGvcReset && selectedTeacher.academicTitle === 'Giảng viên chính' && (
                            <span className="text-amber-700 block mt-0.5 text-xs bg-amber-50/60 py-0.5 px-1.5 rounded w-fit">
                              ↳ <b>Xét GVCC (sau {selectedTeacher.gvReceiptYear}):</b> {selectedTeacher.gvccArticlesCount} bài ({selectedTeacher.gvccInternationalArticlesCount} ISI/Scopus)
                            </span>
                          )}
                        </div>
                        {/* 4d. Hướng dẫn */}
                        <div>
                          <span className="text-slate-500">d. Hướng dẫn:</span> {selectedTeacher.gvcGuidancesCount || 0} lượt hướng dẫn NCKH
                          {selectedTeacher.gvccPhdGuidanceCount > 0 && (
                            <span className="ml-1 text-blue-700">({selectedTeacher.gvccPhdGuidanceCount} NCS)</span>
                          )}
                          {selectedTeacher.gvgYears && (
                            <span className="text-rose-600 block mt-0.5 text-xs bg-rose-50/50 border border-rose-100/60 rounded px-1.5 py-0.5 w-fit">
                              GVG: {selectedTeacher.gvgYears} (Thay thế hướng dẫn khoa học)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 5. Ngoại ngữ, tin học, NV sư phạm */}
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-2">
                      <span className="font-semibold text-slate-400">5. Ngoại ngữ, tin học, NV sư phạm:</span>
                      <div className="col-span-2 font-bold text-slate-800 space-y-1">
                        <div>
                          <span className="text-slate-500">Ngoại ngữ:</span> <b>{selectedTeacher.langCertStr || 'Chưa nộp'}</b>
                        </div>
                        <div>
                          <span className="text-slate-500">Tin học:</span> <b>{selectedTeacher.itCertStr}</b>
                        </div>
                        <div>
                          <span className="text-slate-500">Nghiệp vụ sư phạm:</span> <b>{selectedTeacher.pedagogyCertYear ? `Năm cấp: ${selectedTeacher.pedagogyCertYear}` : '❌ Chưa có'}</b>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Growth path recommendations */}
                <div className="p-4 bg-orange-50/60 border border-orange-100 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                    Định hướng tích lũy & Lộ trình đề xuất
                  </h4>
                  {selectedTeacher.nextMissing.length === 0 ? (
                    <p className="text-xs text-emerald-800 font-medium">
                      🎉 Tuyệt vời! Đồng chí {selectedTeacher.name} đã tích lũy đầy đủ toàn diện các tiêu chí đạt chuẩn của chức danh cao nhất (Giảng viên cao cấp Hạng I). Không có khuyến nghị thiếu hụt nào thêm!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 font-medium">
                        Để hướng tới chức danh tiếp theo là <b>{selectedTeacher.nextLevel}</b>, đồng chí cần lập phương án bổ sung một số tiêu chí sau:
                      </p>
                      <ul className="space-y-1.5">
                        {selectedTeacher.nextMissing.map((missingItem, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-red-600 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            <span>{missingItem}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-slate-400 mt-1 leading-snug font-medium italic">
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

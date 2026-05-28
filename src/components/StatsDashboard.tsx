import { useState, useMemo } from 'react';
import { Teacher, TeachingLog, ResearchLog, RankNorm } from '../types';
import { getRankString, getTeachingTypeName, getResearchTypeName, getTeacherTeachingNorm, ACTIVITY_DATA } from '../data';
import { motion } from 'motion/react';
import { 
  Users, BookOpen, FileCode2, Award, 
  CheckCircle2, AlertTriangle, HelpCircle, 
  ChevronRight, TrendingUp, Filter, BarChart3, PieChart
} from 'lucide-react';

interface StatsDashboardProps {
  teachers: Teacher[];
  teachingLogs: TeachingLog[];
  researchLogs: ResearchLog[];
  rankNorms: RankNorm[];
  academicYear: string;
}

export default function StatsDashboard({ teachers, teachingLogs, researchLogs, rankNorms, academicYear }: StatsDashboardProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const departments = useMemo(() => {
    const list = new Set(teachers.map(t => t.department));
    return ['all', ...Array.from(list)];
  }, [teachers]);

  // Filter teachers by department
  const filteredTeachers = useMemo(() => {
    if (selectedDepartment === 'all') return teachers;
    return teachers.filter(t => t.department === selectedDepartment);
  }, [teachers, selectedDepartment]);

  const filteredTeacherIds = useMemo(() => {
    return new Set(filteredTeachers.map(t => t.id));
  }, [filteredTeachers]);

  // Calculations for teacher statistics
  const teacherStats = useMemo(() => {
    return teachers.map(teacher => {
      // Find norms
      const normConfig = rankNorms.find(rn => rn.rank === teacher.rank) || { teachingNorm: 200, researchNorm: 150 };
      
      const isStaff = teacher.position && (teacher.position.toLowerCase() === 'nhân viên' || teacher.position.toLowerCase().includes('nhân viên'));

      // For teaching norms, we use the user's specific position and party-based 280 hours baseline configuration
      const posNorm = isStaff ? { percent: 0, hours: 0 } : getTeacherTeachingNorm(teacher.position, teacher.party);
      const baseTeachingNorm = posNorm.hours;
      
      // Giảm định mức giảng dạy theo tỉ lệ khi nhập vào ô "% Giảm trừ định mức (0-100%)" (hoặc 100% nếu inactive)
      const actualReduction = teacher.status === 'I' ? 100 : (teacher.reductionRate || 0);
      const adjustedTeachingNorm = isStaff ? 0 : Math.round(baseTeachingNorm * (1 - actualReduction / 100));
      
      // Base research norm is 600 administrative hours
      const baseResearchNorm = isStaff ? 0 : 600;
      
      // Research norm reduction: 
      // "không giảm trừ đối với người giữ chức, nhưng vẫn giảm trừ đối với người không thực hiện full năm, ví dụ nghỉ đẻ, công tác, tính theo % giảm"
      let researchReduction = 0;
      if (isStaff) {
        researchReduction = 100;
      } else if (teacher.status === 'I') {
        // "ví dụ nghỉ đẻ, công tác" - status Inactive
        researchReduction = teacher.reductionRate > 0 ? teacher.reductionRate : 50;
      } else {
        // For active teachers, if they do not hold a leadership position ("người giữ chức"), we can apply their general reduction rate if any.
        // Leadership positions have their teaching norm reduced automatically based on POSITION_NORMS; they are NOT reduced for research.
        const holdsPosition = teacher.position && (
          teacher.position.toLowerCase().includes('chủ nhiệm') ||
          teacher.position.toLowerCase().includes('trưởng') ||
          teacher.position.toLowerCase().includes('phó')
        );
        if (!holdsPosition) {
          researchReduction = teacher.reductionRate;
        } else {
          researchReduction = 0; // "không giảm trừ đối với người giữ chức"
        }
      }
      const adjustedResearchNorm = isStaff ? 0 : Math.round(baseResearchNorm * (1 - researchReduction / 100));

      // Calculate total logged teaching hours
      const teachingSum = Math.round(teachingLogs
        .filter(log => log.teacherId === teacher.id && log.academicYear === academicYear)
        .reduce((sum, log) => sum + log.convertedHours, 0) * 10) / 10;

      // Calculate total approved research hours
      const researchSum = Math.round(researchLogs
        .filter(log => log.teacherId === teacher.id && log.status === 'approved' && log.period === academicYear)
        .reduce((sum, log) => sum + log.convertedHours, 0) * 10) / 10;

      const teachingProgress = isStaff ? 100 : (adjustedTeachingNorm === 0 ? 100 : Math.min(100, (teachingSum / adjustedTeachingNorm) * 100));
      const researchProgress = isStaff ? 100 : (adjustedResearchNorm === 0 ? 100 : Math.min(100, (researchSum / adjustedResearchNorm) * 100));

      const teachingStatus = isStaff ? 'completed' : (teachingSum >= adjustedTeachingNorm ? 'completed' : 'pending');
      const researchStatus = isStaff ? 'completed' : (researchSum >= adjustedResearchNorm ? 'completed' : 'pending');

      const overTimeHours = Math.max(0, Math.round((teachingSum - adjustedTeachingNorm) * 10) / 10);
      const overTimeResearch = Math.max(0, Math.round((researchSum - adjustedResearchNorm) * 10) / 10);

      return {
        teacher,
        academicYear,
        norms: {
          originalTeaching: baseTeachingNorm,
          originalResearch: baseResearchNorm,
          adjustedTeaching: adjustedTeachingNorm,
          adjustedResearch: adjustedResearchNorm,
        },
        teachingSum,
        researchSum,
        teachingProgress,
        researchProgress,
        teachingStatus,
        researchStatus,
        overTimeHours,
        overTimeResearch,
        totalOvertime: Math.round((overTimeHours + overTimeResearch) * 10) / 10,
        metBoth: teachingSum >= adjustedTeachingNorm && researchSum >= adjustedResearchNorm
      };
    });
  }, [teachers, teachingLogs, researchLogs, rankNorms, academicYear]);

  // Filter stats for currently selected department
  const filteredTeacherStats = useMemo(() => {
    return teacherStats.filter(stat => filteredTeacherIds.has(stat.teacher.id));
  }, [teacherStats, filteredTeacherIds]);

  // Aggregate stats
  const aggregateMetrics = useMemo(() => {
    let totalTeachingHours = 0;
    let totalResearchHours = 0;
    let metBothCount = 0;
    let teachingCompleteCount = 0;
    let researchCompleteCount = 0;

    const eligibleStats = filteredTeacherStats.filter(stat => {
      const pos = stat.teacher.position?.toLowerCase() || '';
      return !pos.includes('nhân viên');
    });
    const eligibleCount = eligibleStats.length;

    eligibleStats.forEach(stat => {
      totalTeachingHours += stat.teachingSum;
      totalResearchHours += stat.researchSum;
      if (stat.metBoth) metBothCount++;
      if (stat.teachingSum >= stat.norms.adjustedTeaching) teachingCompleteCount++;
      if (stat.researchSum >= stat.norms.adjustedResearch) researchCompleteCount++;
    });

    const activeCount = filteredTeachers.filter(t => t.status === 'A' && !(t.position?.toLowerCase() || '').includes('nhân viên')).length;

    return {
      teachersCount: eligibleCount,
      activeCount,
      totalTeachingHours: Math.round(totalTeachingHours * 10) / 10,
      totalResearchHours: Math.round(totalResearchHours * 10) / 10,
      metBothRate: eligibleCount ? Math.round((metBothCount / eligibleCount) * 100) : 0,
      teachingCompleteRate: eligibleCount ? Math.round((teachingCompleteCount / eligibleCount) * 100) : 0,
      researchCompleteRate: eligibleCount ? Math.round((researchCompleteCount / eligibleCount) * 100) : 0,
    };
  }, [filteredTeacherStats, filteredTeachers]);

  // Teaching hours by type breakdown
  const teachingHoursByType = useMemo(() => {
    const types: Record<string, number> = {
      theoretical: 0,
      practical: 0,
      project: 0,
      master_thesis: 0,
      phd_instruction: 0
    };

    teachingLogs
      .filter(log => filteredTeacherIds.has(log.teacherId) && log.academicYear === academicYear)
      .forEach(log => {
        if (types[log.type] !== undefined) {
          types[log.type] += log.convertedHours;
        }
      });

    const total = Object.values(types).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(types).map(([key, value]) => ({
      key,
      name: getTeachingTypeName(key),
      value: Math.round(value * 10) / 10,
      percentage: Math.round((value / total) * 100)
    }));
  }, [teachingLogs, filteredTeacherIds, academicYear]);

  // Research hours by main category groups matching ACTIVITY_DATA
  const researchHoursByCategory = useMemo(() => {
    const groups = {
      projects: { name: 'Đề tài nghiên cứu', hours: 0, count: 0 },
      initiatives: { name: 'Sáng kiến', hours: 0, count: 0 },
      workshops: { name: 'Báo cáo / Hội thảo', hours: 0, count: 0 },
      curriculum: { name: 'Giáo trình & Tài liệu', hours: 0, count: 0 },
      articles: { name: 'Bài báo khoa học', hours: 0, count: 0 },
      competitions: { name: 'Hướng dẫn & Olympic', hours: 0, count: 0 },
      councils: { name: 'Hội đồng & Tham dự', hours: 0, count: 0 }
    };

    researchLogs
      .filter(log => filteredTeacherIds.has(log.teacherId) && log.status === 'approved' && log.period === academicYear)
      .forEach(log => {
        let categoryName = '';
        
        // Find category name dynamically from ACTIVITY_DATA
        for (const cat of ACTIVITY_DATA) {
          if (cat.items.some(item => item.id === log.type)) {
            categoryName = cat.category;
            break;
          }
        }

        // Fallbacks for legacy/sample types
        if (!categoryName) {
          if (log.type.startsWith('isi_scopus_') || log.type.startsWith('international_journal') || log.type.startsWith('national_journal_') || log.type === 'patent') {
            categoryName = "Bài báo khoa học";
          } else if (log.type.startsWith('project_')) {
            categoryName = "Đề tài nghiên cứu";
          } else if (log.type === 'book_compilation') {
            categoryName = "Giáo trình & Tài liệu";
          } else if (log.type === 'student_research_guide') {
            categoryName = "Hướng dẫn & Olympic";
          } else {
            categoryName = "Hội đồng & Tham dự";
          }
        }

        // Distribute to corresponding group
        if (categoryName === 'Đề tài nghiên cứu') {
          groups.projects.hours += log.convertedHours;
          groups.projects.count += 1;
        } else if (categoryName === 'Sáng kiến') {
          groups.initiatives.hours += log.convertedHours;
          groups.initiatives.count += 1;
        } else if (categoryName === 'Báo cáo / Hội thảo') {
          groups.workshops.hours += log.convertedHours;
          groups.workshops.count += 1;
        } else if (categoryName === 'Giáo trình & Tài liệu') {
          groups.curriculum.hours += log.convertedHours;
          groups.curriculum.count += 1;
        } else if (categoryName === 'Bài báo khoa học') {
          groups.articles.hours += log.convertedHours;
          groups.articles.count += 1;
        } else if (categoryName === 'Hướng dẫn & Olympic') {
          groups.competitions.hours += log.convertedHours;
          groups.competitions.count += 1;
        } else if (categoryName === 'Hội đồng & Tham dự') {
          groups.councils.hours += log.convertedHours;
          groups.councils.count += 1;
        }
      });

    const totalHours = Object.values(groups).reduce((acc, g) => acc + g.hours, 0) || 1;
    return Object.entries(groups).map(([key, val]) => ({
      key,
      ...val,
      hours: Math.round(val.hours * 10) / 10,
      percentage: Math.round((val.hours / totalHours) * 100)
    }));
  }, [researchLogs, filteredTeacherIds, academicYear]);

  // Top overall workload teachers (teaching + research)
  const topTeachers = useMemo(() => {
    return [...filteredTeacherStats]
      .sort((a, b) => (b.teachingSum + b.researchSum) - (a.teachingSum + a.researchSum))
      .slice(0, 5);
  }, [filteredTeacherStats]);

  return (
    <div className="space-y-6">
      {/* Header filter controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-display">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Tổng quan dữ liệu năm học {academicYear}
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            Hiển thị mức độ hoàn thành chỉ tiêu định mức giảng dạy & nghiên cứu khoa học của tập thể giảng viên.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-[13px] font-medium text-slate-600">Bộ môn:</span>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-[13px] border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả Bộ môn</option>
            {departments.filter(d => d !== 'all').map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[13px] text-slate-500 block font-medium">Giảng viên nhân sự</span>
            <span className="text-2xl font-bold text-slate-800">
              {aggregateMetrics.teachersCount}
            </span>
            <span className="text-[13px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded ml-1.5">
              {aggregateMetrics.activeCount} Hoạt động
            </span>
          </div>
        </motion.div>

        {/* KPI 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[13px] text-slate-500 block font-medium">Tổng giờ giảng quy đổi</span>
            <span className="text-2xl font-bold text-slate-800">
              {aggregateMetrics.totalTeachingHours}
            </span>
            <span className="text-[13px] text-slate-500 block mt-0.5">
              Đạt tiêu chuẩn {aggregateMetrics.teachingCompleteRate}% GV
            </span>
          </div>
        </motion.div>

        {/* KPI 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[13px] text-slate-500 block font-medium">Giờ NCKH phê duyệt</span>
            <span className="text-2xl font-bold text-slate-800">
              {aggregateMetrics.totalResearchHours}
            </span>
            <span className="text-[13px] text-slate-500 block mt-0.5">
              Đạt tiêu chuẩn {aggregateMetrics.researchCompleteRate}% GV
            </span>
          </div>
        </motion.div>

        {/* KPI 4 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[13px] text-slate-500 block font-medium">Đạt kép giảng & NCKH</span>
            <span className="text-2xl font-bold text-slate-800">
              {aggregateMetrics.metBothRate}%
            </span>
            <span className="text-[13px] text-slate-500 block mt-0.5">
              Giảng viên hoàn thành 100% hai định mức
            </span>
          </div>
        </motion.div>
      </div>

      {/* Visual charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Teaching hours by type */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
              <PieChart className="w-4 h-4 text-blue-500" />
              Cơ cấu giờ giảng dạy quy đổi
            </h3>
            <span className="text-[13px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {aggregateMetrics.totalTeachingHours} giờ chuẩn
            </span>
          </div>
          
          <div className="space-y-4">
            {/* Horizontal custom bar comparison */}
            <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {teachingHoursByType.map((item, idx) => {
                const colors = [
                  'bg-blue-600 hover:bg-blue-700', 
                  'bg-sky-500 hover:bg-sky-600', 
                  'bg-emerald-500 hover:bg-emerald-600', 
                  'bg-violet-500 hover:bg-violet-600', 
                  'bg-amber-500 hover:bg-amber-600'
                ];
                return item.value > 0 ? (
                  <div 
                    key={item.key}
                    style={{ width: `${item.percentage}%` }}
                    className={`${colors[idx % colors.length]} transition-all duration-300 relative group cursor-pointer h-full`}
                    title={`${item.name}: ${item.value} giờ (${item.percentage}%)`}
                  />
                ) : null;
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {teachingHoursByType.map((item, idx) => {
                const colors = ['bg-blue-600', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'];
                return (
                  <div key={item.key} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg">
                    <div className={`w-3 h-3 rounded-xs ${colors[idx % colors.length]}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-semibold text-slate-700 block truncate">{item.name}</span>
                      <span className="text-[13px] text-slate-400 font-mono">
                        {item.value} giờ quy đổi ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Research logs breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Thống kê nghiên cứu khoa học đạt
            </h3>
            <span className="text-[13px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
              {aggregateMetrics.totalResearchHours} giờ NCKH
            </span>
          </div>

          <div className="space-y-3.5">
            {researchHoursByCategory.map((category, idx) => {
              const borderColors = [
                'border-l-rose-500', 
                'border-l-blue-500', 
                'border-l-teal-500', 
                'border-l-amber-500', 
                'border-l-indigo-500', 
                'border-l-emerald-500', 
                'border-l-violet-500'
              ];
              const bgColors = [
                'bg-rose-500', 
                'bg-blue-500', 
                'bg-teal-500', 
                'bg-amber-500', 
                'bg-indigo-500', 
                'bg-emerald-500', 
                'bg-violet-500'
              ];
              return (
                <div key={category.key} className={`border-l-4 ${borderColors[idx % 7]} pl-3 py-1 bg-slate-50 rounded-r-lg`}>
                  <div className="flex justify-between text-[13px] font-semibold text-slate-700">
                    <span>{category.name}</span>
                    <span className="font-mono">{category.hours} giờ ({category.count} CT)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full ${bgColors[idx % 7]} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main List: Teacher workload monitoring grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-display">Bảng theo dõi định mức theo Giảng viên</h3>
            <p className="text-[13px] text-slate-500 mt-0.5 font-medium">Giám sát tổng số giờ giảng và hoàn thành công tác nghiên cứu khoa học khoa dạt định mức</p>
          </div>
          <span className="text-[13px] text-slate-500 font-semibold">Hiện có {filteredTeacherStats.length} giảng viên</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[13px] font-semibold text-slate-500">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Giảng viên</th>
                <th className="py-3 px-4">Chức danh / Học hàm</th>
                <th className="py-3 px-4 w-44">Tỷ lệ giờ giảng</th>
                <th className="py-3 px-4 w-44">Tỷ lệ NCKH</th>
                <th className="py-3 px-4 text-center">Đạt KPI kép</th>
                <th className="py-3 px-4 text-right">Giờ vượt mức</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeacherStats.map((stat, idx) => {
                const totalWork = stat.teachingSum + stat.researchSum;
                return (
                  <tr key={stat.teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-center text-[13px] font-semibold font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="text-[13px] font-bold text-slate-800 block">{stat.teacher.name}</span>
                        <span className="text-[13px] text-slate-400 font-mono">{stat.teacher.department}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] text-slate-600 font-medium">
                          {getRankString(stat.teacher.rank)}
                        </span>
                        {stat.teacher.reductionRate > 0 && (
                          <span className="text-[13px] text-blue-600 font-bold bg-blue-50 px-1 py-0.2 rounded w-fit">
                            Giảm {stat.teacher.reductionRate}% {stat.teacher.status === 'I' ? '(Nghỉ học/Công tác)' : `(${stat.teacher.position})`}
                          </span>
                        )}
                        {stat.teacher.status === 'I' && stat.teacher.reductionRate === 0 && (
                          <span className="text-[13px] text-amber-600 font-bold bg-amber-50 px-1 py-0.2 rounded w-fit">
                            Tạm dừng hoạt động
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[13px]">
                          <span className="font-semibold text-slate-700">
                            {stat.teachingSum} <span className="text-slate-400 font-normal">/ {stat.norms.adjustedTeaching}h</span>
                          </span>
                          <span className={`font-mono font-bold ${stat.teachingSum >= stat.norms.adjustedTeaching ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {Math.round(stat.teachingProgress)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${stat.teachingProgress}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              stat.teachingSum >= stat.norms.adjustedTeaching 
                                ? 'bg-emerald-500' 
                                : stat.teachingProgress > 50 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[13px]">
                          <span className="font-semibold text-slate-700">
                            {stat.researchSum} <span className="text-slate-400 font-normal">/ {stat.norms.adjustedResearch}h</span>
                          </span>
                          <span className={`font-mono font-bold ${stat.researchSum >= stat.norms.adjustedResearch ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {Math.round(stat.researchProgress)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${stat.researchProgress}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              stat.researchSum >= stat.norms.adjustedResearch 
                                ? 'bg-cyan-500' 
                                : stat.researchProgress > 50 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        {stat.metBoth ? (
                          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 shadow-3xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ĐẠT CHUẨN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            CHƯA ĐỦ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[13px] font-bold">
                      {stat.totalOvertime > 0 ? (
                        <span className="text-blue-600 flex items-center justify-end gap-0.5">
                          +{stat.totalOvertime} <span className="text-[13px] text-slate-400 font-normal">giờ</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top workload contributors row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 teachers leaderboard */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs lg:col-span-2">
          <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            🥇 Gương mặt nghiên cứu & giảng dạy tiêu biểu
          </h3>
          <div className="divide-y divide-slate-100 text-[13px]">
            {topTeachers.map((stat, idx) => (
              <div key={stat.teacher.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-slate-100 text-slate-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-slate-800 block">{stat.teacher.name}</span>
                    <span className="text-[13px] text-slate-400">{stat.teacher.position} • {stat.teacher.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[13px] text-slate-400 block">Thực tế giảng dạy</span>
                    <span className="text-[13px] font-bold text-slate-700">{stat.teachingSum} giờ quy đổi</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[13px] text-slate-400 block">Nghiên cứu khoa học</span>
                    <span className="text-[13px] font-bold text-slate-700">{stat.researchSum} giờ chuẩn</span>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-[13px] font-extrabold text-blue-600 font-mono">+{stat.totalOvertime}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic conversion table guidelines */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-3 font-display">
             Hệ số quy đổi giờ giảng chuẩn
          </h3>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[13px] p-2.5 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Lý thuyết tiêu chuẩn</span>
              <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[13px]">1.0 x số tiết</span>
            </div>
            <div className="flex justify-between items-center text-[13px] p-2.5 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Lớp học đông (&gt;80 SV)</span>
              <span className="font-mono bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-bold text-[13px]">1.2 x số tiết</span>
            </div>
            <div className="flex justify-between items-center text-[13px] p-2.5 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Lớp siêu đông (&gt;120 SV)</span>
              <span className="font-mono bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded font-bold text-[13px]">1.5 x số tiết</span>
            </div>
            <div className="flex justify-between items-center text-[13px] p-2.5 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Thực hành / Thí nghiệm</span>
              <span className="font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold text-[13px]">0.67 x số tiết</span>
            </div>
            <div className="flex justify-between items-center text-[13px] p-2.5 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Hướng dẫn Đồ án / KLTN</span>
              <span className="font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold text-[13px]">15.0h / SV hướng dẫn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

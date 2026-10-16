import React, { useState, useMemo } from 'react';
import { Teacher, TeachingLog, ResearchLog, RankNorm, WorkHistory } from '../types';
import { getRankString, getTeachingTypeName, getResearchTypeName, getTeacherTeachingNorm, ACTIVITY_DATA } from '../data';
import { motion } from 'motion/react';
import { 
  Users, BookOpen, FileCode2, Award, 
  CheckCircle2, AlertTriangle, HelpCircle, 
  ChevronRight, TrendingUp, Filter, BarChart3, PieChart as PieIcon
} from 'lucide-react';

interface StatsDashboardProps {
  teachers: Teacher[];
  teachingLogs: TeachingLog[];
  researchLogs: ResearchLog[];
  rankNorms: RankNorm[];
  academicYear: string;
  workHistories?: WorkHistory[];
}

// ── Component PieChart SVG ──
interface PieChartProps {
  data: { label: string; hours: number }[];
  size?: number;
  totalHours: number;
}

const PieChart = React.memo(({ data, size = 280, totalHours }: PieChartProps) => {
  const [hoveredArc, setHoveredArc] = React.useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

  if (data.length === 0) return null;
  const cx = size / 2, cy = size / 2, r = size / 2 - 15;
  const total = data.reduce((s, d) => s + d.hours, 0);
  if (total <= 0) return null;

  const COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
    '#06b6d4', '#a855f7', '#e11d48', '#0ea5e9', '#d946ef',
  ];

  // Tính các arc
  const arcs: {
    path: string;
    isFullCircle?: boolean;
    fill: string;
    label: string;
    percent: number;
    hours: number;
    color: string;
    midX: number;
    midY: number;
  }[] = [];
  let currentAngle = -90;

  data.forEach((d, i) => {
    const percent = d.hours / total;
    const angle = percent * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    if (angle < 0.01) return;

    if (percent >= 0.999) {
      arcs.push({
        path: '',
        isFullCircle: true,
        fill: COLORS[i % COLORS.length],
        label: d.label,
        percent: percent * 100,
        hours: d.hours,
        color: COLORS[i % COLORS.length],
        midX: cx,
        midY: cy - r * 0.65,
      });
      return;
    }

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    // Tính góc giữa để đặt tooltip
    const midAngle = startAngle + angle / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const tooltipDist = r * 0.65;

    arcs.push({
      path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`,
      fill: COLORS[i % COLORS.length],
      label: d.label,
      percent: percent * 100,
      hours: d.hours,
      color: COLORS[i % COLORS.length],
      midX: cx + tooltipDist * Math.cos(midRad),
      midY: cy + tooltipDist * Math.sin(midRad),
    });
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="cursor-pointer" onMouseMove={handleMouseMove}>
        {arcs.map((arc, i) => (
          <g key={i}>
            {arc.isFullCircle ? (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={arc.fill}
                stroke="white"
                strokeWidth="2"
                onMouseEnter={() => setHoveredArc(i)}
                onMouseLeave={() => setHoveredArc(null)}
                className="transition-all duration-150"
                style={{ opacity: hoveredArc !== null && hoveredArc !== i ? 0.4 : 1 }}
              />
            ) : (
              <path
                d={arc.path}
                fill={arc.fill}
                stroke="white"
                strokeWidth="2"
                onMouseEnter={() => setHoveredArc(i)}
                onMouseLeave={() => setHoveredArc(null)}
                className="transition-all duration-150"
                style={{ opacity: hoveredArc !== null && hoveredArc !== i ? 0.4 : 1, transformOrigin: `${cx}px ${cy}px` }}
              />
            )}
          </g>
        ))}
        {/* Vòng tròn trắng ở giữa */}
        <circle cx={cx} cy={cy} r={r * 0.4} fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#334155" fontSize="16" fontWeight="bold">
          {totalHours.toFixed(1)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="11">
          Tổng giờ
        </text>
      </svg>

      {/* Tooltip */}
      {hoveredArc !== null && arcs[hoveredArc] && (() => {
        const arc = arcs[hoveredArc];
        const tipX = Math.min(arc.midX, size - 10);
        const tipY = Math.min(arc.midY, size - 10);
        return (
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: tipX,
              top: tipY,
              transform: 'translate(-50%, -100%) translateY(-8px)',
            }}
          >
            <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200 rounded-lg px-3 py-2 text-center overflow-visible">
              <p className="text-xs font-black text-slate-700 whitespace-nowrap">{arc.label}</p>
              <p className="text-lg font-black mt-0.5" style={{ color: arc.color }}>{arc.hours.toFixed(1)} giờ</p>
              <p className="text-xs font-bold text-slate-400">({arc.percent.toFixed(1)}%)</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
});

export default function StatsDashboard({ teachers, teachingLogs, researchLogs, rankNorms, academicYear, workHistories = [] }: StatsDashboardProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Lọc giảng viên chỉ lấy những người có bản ghi WorkHistory trong năm học được chọn
  const yearTeachers = useMemo(() => {
    if (!workHistories || workHistories.length === 0) return teachers;
    const teacherIdsInYear = new Set(
      workHistories
        .filter(wh => wh.academicYear === academicYear)
        .map(wh => wh.teacherId)
    );
    return teachers.filter(t => teacherIdsInYear.has(t.id));
  }, [teachers, workHistories, academicYear]);

  const departments = useMemo(() => {
    const list = new Set(yearTeachers.map(t => t.department));
    return ['all', ...Array.from(list)];
  }, [yearTeachers]);

  // Filter teachers by department
  const filteredTeachers = useMemo(() => {
    if (selectedDepartment === 'all') return yearTeachers;
    return yearTeachers.filter(t => t.department === selectedDepartment);
  }, [yearTeachers, selectedDepartment]);

  const filteredTeacherIds = useMemo(() => {
    return new Set(filteredTeachers.map(t => t.id));
  }, [filteredTeachers]);

  // Calculations for teacher statistics
  // Sử dụng dữ liệu WorkHistory theo năm học để tính định mức và giảm trừ
  const teacherStats = useMemo(() => {
    // Tạo map WorkHistory theo teacherId cho năm đang chọn
    const yearWorkHistoryMap = new Map<string, WorkHistory>();
    if (workHistories && workHistories.length > 0) {
      workHistories
        .filter(wh => wh.academicYear === academicYear)
        .forEach(wh => {
          // Nếu có nhiều bản ghi cùng năm, lấy bản ghi mới nhất (giả định theo thứ tự xuất hiện)
          const existing = yearWorkHistoryMap.get(wh.teacherId);
          if (!existing) {
            yearWorkHistoryMap.set(wh.teacherId, wh);
          }
        });
    }

    return teachers.map(teacher => {
      // Lấy WorkHistory theo năm học nếu có, fallback về thông tin hiện tại
      const wh = yearWorkHistoryMap.get(teacher.id);
      const yearPosition = wh?.position ?? teacher.position;
      const yearParty = wh?.party ?? teacher.party;
      const yearRank = wh?.rank ?? teacher.rank;
      const yearStatus = wh?.status ?? teacher.status;
      const yearReductionRate = wh?.reductionRate ?? teacher.reductionRate ?? 0;
      const yearDepartment = wh?.department ?? teacher.department;

      // Find norms
      const normConfig = rankNorms.find(rn => rn.rank === yearRank) || { teachingNorm: 200, researchNorm: 150 };
      
      const isStaff = yearPosition && (yearPosition.toLowerCase() === 'nhân viên' || yearPosition.toLowerCase().includes('nhân viên'));

      // Tính định mức giảng dạy theo chức vụ & chức vụ đảng trong năm học
      const posNorm = isStaff ? { percent: 0, hours: 0 } : getTeacherTeachingNorm(yearPosition, yearParty);
      const baseTeachingNorm = posNorm.hours;
      
      // Áp dụng tỷ lệ giảm trừ theo năm học (từ WorkHistory)
      const actualReduction = yearStatus === 'I' ? 100 : (yearReductionRate || 0);
      const adjustedTeachingNorm = isStaff ? 0 : Math.round(baseTeachingNorm * (1 - actualReduction / 100));
      
      // Base research norm is 600 administrative hours
      const baseResearchNorm = isStaff ? 0 : 600;
      
      // Research norm reduction theo logic chức vụ trong năm học
      let researchReduction = 0;
      if (isStaff) {
        researchReduction = 100;
      } else if (yearStatus === 'I') {
        researchReduction = yearReductionRate > 0 ? yearReductionRate : 50;
      } else {
        // Người giữ chức vụ lãnh đạo không giảm trừ NCKH
        const holdsPosition = yearPosition && (
          yearPosition.toLowerCase().includes('chủ nhiệm') ||
          yearPosition.toLowerCase().includes('trưởng') ||
          yearPosition.toLowerCase().includes('phó')
        );
        if (!holdsPosition) {
          researchReduction = yearReductionRate;
        } else {
          researchReduction = 0;
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

      const teachingExcess = Math.max(0, Math.round((teachingSum - adjustedTeachingNorm) * 10) / 10);
      const researchDeficit = Math.max(0, Math.round((adjustedResearchNorm - researchSum) * 10) / 10);
      const totalOvertime = Math.max(0, Math.round((teachingExcess - researchDeficit / 3) * 10) / 10);

      return {
        teacher: { ...teacher, position: yearPosition, party: yearParty, rank: yearRank, status: yearStatus as 'A' | 'I', reductionRate: yearReductionRate, department: yearDepartment },
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
        overTimeHours: teachingExcess,
        overTimeResearch: Math.max(0, Math.round((researchSum - adjustedResearchNorm) * 10) / 10),
        totalOvertime,
        metBoth: teachingSum >= adjustedTeachingNorm && researchSum >= adjustedResearchNorm
      };
    });
  }, [teachers, teachingLogs, researchLogs, rankNorms, academicYear, workHistories]);

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
    const types: Record<string, number> = {};

    teachingLogs
      .filter(log => filteredTeacherIds.has(log.teacherId) && log.academicYear === academicYear)
      .forEach(log => {
        types[log.type] = (types[log.type] || 0) + log.convertedHours;
      });

    const total = Object.values(types).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(types).map(([key, value]) => ({
      key,
      name: getTeachingTypeName(key),
      value: Math.round(value * 10) / 10,
      percentage: Math.round((value / total) * 100)
    }));
  }, [teachingLogs, filteredTeacherIds, academicYear]);

  // Compute data for CustomPieChart Component
  const pieChartData = useMemo(() => {
    return teachingHoursByType
      .filter(item => item.value > 0)
      .map(item => ({
        label: item.name,
        hours: item.value,
      }));
  }, [teachingHoursByType]);

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
          <p className="text-xs text-slate-500 mt-1">
            Hiển thị mức độ hoàn thành chỉ tiêu định mức giảng dạy & nghiên cứu khoa học của tập thể giảng viên.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">Bộ môn:</span>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toàn Khoa</option>
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
            <span className="text-xs text-slate-500 block font-medium">Quân số</span>
            <span className="text-2xl font-bold text-slate-800">
              {aggregateMetrics.teachersCount + 1}
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
            <span className="text-xs text-slate-500 block font-medium">Tổng giờ giảng quy đổi</span>
            <span className="text-2xl font-bold text-slate-800">
              {aggregateMetrics.totalTeachingHours}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
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
            <span className="text-xs text-slate-500 block font-medium">Giờ NCKH phê duyệt</span>
            <span className="text-2xl font-bold text-slate-800">
              {aggregateMetrics.totalResearchHours}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
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
            <span className="text-xs text-slate-500 block font-medium">Đạt định mức GD & NCKH</span>
            <span className="text-2xl font-bold text-slate-800">
              {aggregateMetrics.metBothRate}%
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              GV hoàn thành 100% hai định mức
            </span>
          </div>
        </motion.div>
      </div>

      {/* Visual charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Teaching hours by type - Done as Pie/Donut Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
              <PieIcon className="w-4 h-4 text-blue-500" />
              Cơ cấu giờ giảng dạy quy đổi
            </h3>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {aggregateMetrics.totalTeachingHours} giờ chuẩn
            </span>
          </div>
          
          <div className="flex flex-col items-center gap-4 pt-2">
            {/* SVG Pie / Donut Chart */}
            <div className="relative shrink-0 flex items-center justify-center">
              {aggregateMetrics.totalTeachingHours === 0 ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="100" r="80" className="fill-slate-50 stroke-slate-200" strokeWidth="2" />
                    <text x="100" y="105" textAnchor="middle" className="fill-slate-400 font-bold text-xs">Chưa có dữ liệu</text>
                  </svg>
                </div>
              ) : (
                <PieChart 
                  data={pieChartData} 
                  size={250} 
                  totalHours={aggregateMetrics.totalTeachingHours} 
                />
              )}
            </div>

            {/* Detailed Legend List - Placed below, only showing categories with values > 0 in a beautiful grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              {pieChartData.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-4 w-full col-span-full">
                  Chưa ghi nhận giờ giảng quy đổi cho năm học này.
                </div>
              ) : (
                (() => {
                  const COLORS = [
                    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
                    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
                    '#06b6d4', '#a855f7', '#e11d48', '#0ea5e9', '#d946ef',
                  ];
                  return pieChartData.map((slice, idx) => {
                    const color = COLORS[idx % COLORS.length];
                    const percent = aggregateMetrics.totalTeachingHours > 0 
                      ? (slice.hours / aggregateMetrics.totalTeachingHours) * 100 
                      : 0;
                    return (
                      <div 
                        key={slice.label} 
                        className="flex items-center gap-3 bg-slate-50/60 p-2.5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 rounded-lg transition-colors group"
                      >
                        <div 
                          className="w-3 h-3 rounded-xs shrink-0 group-hover:scale-110 transition-transform" 
                          style={{ backgroundColor: color }} 
                        />
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 truncate">{slice.label}</span>
                          <span className="text-xs text-slate-500 font-mono font-bold whitespace-nowrap">
                            {slice.hours}h <span className="text-slate-400 font-normal">({percent.toFixed(1)}%)</span>
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
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
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
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
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
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
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Giám sát tổng số giờ giảng và hoàn thành công tác nghiên cứu khoa học khoa dạt định mức</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">Hiện có {filteredTeacherStats.length} giảng viên</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Giảng viên</th>
                <th className="py-3 px-4">Học hàm</th>
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
                    <td className="py-3.5 px-4 text-center text-xs font-semibold font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="text-sm font-bold text-slate-800 block">{stat.teacher.name}</span>
                        <span className="text-xs text-slate-400 ">{stat.teacher.department}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-600 font-medium">
                          {getRankString(stat.teacher.rank)}
                        </span>
                        {stat.teacher.reductionRate > 0 && (
                          <span className="text-xs text-blue-600 font-bold bg-blue-50 px-1 py-0.2 rounded w-fit">
                            Giảm {stat.teacher.reductionRate}% {stat.teacher.status === 'I' ? '(Nghỉ học/Công tác)' : ``}
                          </span>
                        )}
                        {stat.teacher.status === 'I' && stat.teacher.reductionRate === 0 && (
                          <span className="text-xs text-amber-600 font-bold bg-amber-50 px-1 py-0.2 rounded w-fit">
                            Tạm dừng giảng dạy
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
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
                        <div className="flex justify-between text-xs">
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
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 shadow-3xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ĐỦ ĐỊNH MỨC GD & NCKH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            CHƯA ĐỦ ĐỊNH MỨC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-bold">
                      {stat.totalOvertime > 0 ? (
                        <span className="text-blue-600 flex items-center justify-end gap-0.5">
                          +{stat.totalOvertime} <span className="text-xs text-slate-400 font-normal">giờ</span>
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            🥇 Gương mặt nghiên cứu & giảng dạy tiêu biểu
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {topTeachers.map((stat, idx) => (
              <div key={stat.teacher.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-slate-100 text-slate-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{stat.teacher.name}</span>
                    <span className="text-xs text-slate-400">{stat.teacher.position} • {stat.teacher.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Giảng dạy</span>
                    <span className="text-xs font-bold text-slate-700">{stat.teachingSum} giờ chuẩn</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Nghiên cứu khoa học</span>
                    <span className="text-xs font-bold text-slate-700">{stat.researchSum} giờ hành chính</span>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-xs font-extrabold text-blue-600 font-mono">+{stat.totalOvertime}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">


          {/* Overtime guidelines block */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-display">
               Nguyên tắc tính giờ vượt mức
            </h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-2.5 bg-slate-50 rounded-lg border-l-4 border-l-blue-500">
                <strong className="text-slate-800 block mb-1">Công thức tính:</strong>
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-blue-600 block w-fit mt-1">
                  Giờ vượt mức = Giờ giảng còn dư - Giờ NCKH còn thiếu (Giờ hành chính)
                </code>
              </div>
              <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100/70 text-amber-800">
                <strong>Bù trừ khi thiếu:</strong> Số giờ giảng dạy còn dư được sử dụng để bù đắp cho số giờ NCKH còn thiếu theo tỷ lệ quy đổi <strong>1 giờ giảng dạy = 3 giờ NCKH</strong> (bằng cách trừ đi 1/3 số giờ NCKH thiếu).
              </div>
              <div className="bg-slate-50/65 p-2.5 rounded-lg border border-slate-100 text-slate-500">
                <strong>Không bù ngược lại:</strong> Số giờ NCKH dư thừa <strong>không được phép sử dụng</strong> để bù đắp cho số giờ giảng dạy thiếu hụt.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

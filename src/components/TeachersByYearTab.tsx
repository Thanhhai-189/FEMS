import { useMemo, useState } from 'react';
import { Teacher, WorkHistory, RankNorm } from '../types';
import { getRankString, getTeacherTeachingNorm, DEFAULT_RANKS_NORM } from '../data';
import {
  Search, Building, Briefcase, Award, GraduationCap,
  Calendar, UserCheck, Users, FileCode2, BookOpen, Phone, Mail
} from 'lucide-react';

interface TeachersByYearTabProps {
  teachers: Teacher[];
  workHistories: WorkHistory[];
  rankNorms: RankNorm[];
  selectedYear: string;
}

export default function TeachersByYearTab({
  teachers,
  workHistories,
  rankNorms,
  selectedYear
}: TeachersByYearTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRank, setSelectedRank] = useState('all');

  const activeWorkHistories = useMemo(() => {
    return workHistories.filter(wh => 
      wh.academicYear === selectedYear && wh.status === 'A'
    );
  }, [workHistories, selectedYear]);

  const activeTeachersWithInfo = useMemo(() => {
    const result: {
      teacher: Teacher;
      workInfo: WorkHistory;
      teachingNorm: number;
      researchNorm: number;
      actualTeachingNorm: number;
      actualResearchNorm: number;
    }[] = [];

    for (const wh of activeWorkHistories) {
      const teacher = teachers.find(t => t.id === wh.teacherId);
      if (!teacher) continue;

      // Tính định mức giảng dạy theo chức vụ + chức vụ đảng trong năm học
      // (giống tab Tổng quan thống kê)
      const isStaff = wh.position && (
        wh.position.toLowerCase() === 'nhân viên' ||
        wh.position.toLowerCase().includes('nhân viên')
      );
      const posNorm = isStaff ? { percent: 0, hours: 0 } : getTeacherTeachingNorm(wh.position, wh.party);
      const teachingN = posNorm.hours;

      // Định mức NCKH cố định 600 giờ (giống tab Tổng quan)
      const researchN = isStaff ? 0 : 600;

      const reductionPercent = wh.reductionRate > 0 ? (100 - wh.reductionRate) / 100 : 1;

      result.push({
        teacher,
        workInfo: wh,
        teachingNorm: teachingN,
        researchNorm: researchN,
        actualTeachingNorm: Math.round(teachingN * reductionPercent * 10) / 10,
        actualResearchNorm: Math.round(researchN * reductionPercent * 10) / 10
      });
    }

    return result;
  }, [activeWorkHistories, teachers, rankNorms]);

  const filteredList = useMemo(() => {
    return activeTeachersWithInfo.filter(item => {
      const matchSearch = item.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.workInfo.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === 'all' || item.workInfo.department === selectedDept;
      const matchRank = selectedRank === 'all' || item.workInfo.rank === selectedRank;
      return matchSearch && matchDept && matchRank;
    });
  }, [activeTeachersWithInfo, searchQuery, selectedDept, selectedRank]);

  const stats = useMemo(() => {
    const totalTeachingNorm = filteredList.reduce((sum, item) => sum + item.actualTeachingNorm, 0);
    const totalResearchNorm = filteredList.reduce((sum, item) => sum + item.actualResearchNorm, 0);
    return {
      total: filteredList.length,
      totalTeachingNorm: Math.round(totalTeachingNorm * 10) / 10,
      totalResearchNorm: Math.round(totalResearchNorm * 10) / 10
    };
  }, [filteredList]);

  const departments = useMemo(() => {
    const depts = new Set(activeWorkHistories.map(wh => wh.department));
    return Array.from(depts).sort();
  }, [activeWorkHistories]);

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">
              Giảng viên năm học {selectedYear}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Danh sách giảng viên đang hoạt động trong năm học được chọn
            </p>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Tổng số GV</span>
          <span className="text-xl font-extrabold text-slate-800 font-mono mt-0.5 block">{stats.total} GV</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Tổng định mức giảng dạy</span>
          <span className="text-lg font-extrabold text-blue-700 font-mono mt-0.5 block">{stats.totalTeachingNorm} giờ</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Tổng định mức NCKH</span>
          <span className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5 block">{stats.totalResearchNorm} giờ</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Năm học</span>
          <span className="text-lg font-extrabold text-indigo-700 font-mono mt-0.5 block">{selectedYear}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên giảng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium placeholder:text-slate-400"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
          >
            <option value="all">Tất cả đơn vị</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={selectedRank}
            onChange={(e) => setSelectedRank(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
          >
            <option value="all">Tất cả học vị</option>
            <option value="TS">Tiến sĩ</option>
            <option value="ThS">Thạc sĩ</option>
            <option value="CN">Cử nhân</option>
          </select>
        </div>
      </div>

      {/* Bảng giảng viên */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[200px]">Họ tên</th>
                <th className="py-3 px-4">Đơn vị</th>
                <th className="py-3 px-4">Chức vụ</th>
                <th className="py-3 px-4">Chức danh</th>
                <th className="py-3 px-4">Học vị</th>
                <th className="py-3 px-4 text-center">Giảm trừ</th>
                <th className="py-3 px-4 text-center">Định mức GD</th>
                <th className="py-3 px-4 text-center">Định mức NCKH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                    <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    Không có giảng viên nào hoạt động trong năm học {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.teacher.id} className="hover:bg-slate-50/80 transition-colors text-sm">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{item.teacher.name}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {item.teacher.email}
                        </span>
                        {item.teacher.phone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {item.teacher.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 font-medium">{item.workInfo.department}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{item.workInfo.position}</span>
                        {item.workInfo.party && item.workInfo.party !== 'Không kiêm nhiệm' && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded mt-0.5 self-start">
                            {item.workInfo.party}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700">
                          {item.workInfo.academicTitle && item.workInfo.academicTitle !== 'Không' 
                            ? item.workInfo.academicTitle 
                            : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold px-1.5 py-0.2 rounded-full text-xs ${
                          item.workInfo.rank === 'GS' || item.workInfo.rank === 'PGS' 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : item.workInfo.rank === 'TS' 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {getRankString(item.workInfo.rank)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold font-mono text-sm ${
                        item.workInfo.reductionRate > 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {item.workInfo.reductionRate > 0 ? `${item.workInfo.reductionRate}%` : '0%'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold text-blue-700 font-mono">{item.actualTeachingNorm}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold text-emerald-700 font-mono">{item.actualResearchNorm}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
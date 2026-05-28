import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Teacher, TeachingLog, TeachingType, AcademicYearConfig } from '../types';
import { getRankString, getTeachingTypeName } from '../data';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, AlertCircle, 
  HelpCircle, Check, X, Filter, Sparkles, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TeachingHoursTabProps {
  teachers: Teacher[];
  teachingLogs: TeachingLog[];
  academicYears: AcademicYearConfig[];
  selectedYear: string;
  onAddTeachingLog: (log: TeachingLog) => void;
  onEditTeachingLog: (log: TeachingLog) => void;
  onDeleteTeachingLog: (id: string) => void;
  userRole?: 'admin' | 'teacher';
  currentTeacherId?: string;
}

export default function TeachingHoursTab({ 
  teachers, 
  teachingLogs, 
  academicYears, 
  selectedYear,
  onAddTeachingLog, 
  onEditTeachingLog, 
  onDeleteTeachingLog,
  userRole = 'admin',
  currentTeacherId
}: TeachingHoursTabProps) {
  const isAdmin = userRole === 'admin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    return userRole === 'teacher' && currentTeacherId ? currentTeacherId : 'all';
  });

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TeachingLog | null>(null);

  // Custom delete state
  const [logToDelete, setLogToDelete] = useState<{ id: string; subject: string; className: string } | null>(null);

  // Form field states
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formSubjectCode, setFormSubjectCode] = useState('');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formClassName, setFormClassName] = useState('');
  const [formCredits, setFormCredits] = useState(3);
  const [formStudentCount, setFormStudentCount] = useState(40);
  const [formType, setFormType] = useState<TeachingType>('theoretical');
  const [formCoefficient, setFormCoefficient] = useState(1.0);
  const [formActualHours, setFormActualHours] = useState(45);
  const [formConvertedHours, setFormConvertedHours] = useState(45);
  const [formSemester, setFormSemester] = useState<'HK1' | 'HK2' | 'HK3'>('HK1');
  const [formYear, setFormYear] = useState(selectedYear);

  // Auto-calculate coefficient and hours when key fields change
  useEffect(() => {
    let coef = 1.0;
    let actual = formCredits * 15;

    switch (formType) {
      case 'theoretical':
        actual = formCredits * 15;
        if (formStudentCount > 120) {
          coef = 1.5;
        } else if (formStudentCount > 80) {
          coef = 1.3;
        } else if (formStudentCount > 50) {
          coef = 1.1;
        } else {
          coef = 1.0;
        }
        break;
      case 'practical':
        actual = formCredits * 30; // 1 tín chỉ thực hành thường là 30 tiết/giờ trên lớp
        coef = 0.67;
        break;
      case 'project':
        // Hướng dẫn Đồ án tốt nghiệp / Đồ án môn học
        // Quy đổi: tính 15 giờ chuẩn cho mỗi sinh viên hoàn thành
        actual = formStudentCount * 30;
        coef = 0.5; // 30 tiết * 0.5 = 15 giờ chuẩn/SV
        break;
      case 'master_thesis':
        actual = formStudentCount * 30;
        coef = 1.5; // Hướng dẫn cao học: 1.5 x số giờ, quy đổi 45 giờ/học viên
        break;
      case 'phd_instruction':
        actual = formStudentCount * 40;
        coef = 2.0; // Hướng dẫn NCS: quy đổi 80 giờ chuẩn
        break;
    }

    setFormActualHours(actual);
    setFormCoefficient(coef);
    setFormConvertedHours(Math.round(actual * coef * 100) / 100);
  }, [formType, formCredits, formStudentCount]);

  const openAddModal = () => {
    setEditingLog(null);
    setFormTeacherId(userRole === 'teacher' && currentTeacherId ? currentTeacherId : (teachers[0]?.id || ''));
    setFormSubjectCode('');
    setFormSubjectName('');
    setFormClassName('');
    setFormCredits(3);
    setFormStudentCount(40);
    setFormType('theoretical');
    setFormSemester('HK1');
    setFormYear(selectedYear);
    setIsModalOpen(true);
  };

  const openEditModal = (log: TeachingLog) => {
    setEditingLog(log);
    setFormTeacherId(log.teacherId);
    setFormSubjectCode(log.subjectCode);
    setFormSubjectName(log.subjectName);
    setFormClassName(log.className);
    setFormCredits(log.credits);
    setFormStudentCount(log.studentCount);
    setFormType(log.type);
    setFormSemester(log.semester);
    setFormYear(log.academicYear);
    
    // Set overridden values if they differ
    setTimeout(() => {
      setFormCoefficient(log.coefficient);
      setFormActualHours(log.actualHours);
      setFormConvertedHours(log.convertedHours);
    }, 50);

    setIsModalOpen(true);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!formTeacherId || !formSubjectName.trim() || !formClassName.trim()) {
      alert('Vui lòng điền đầy đủ thông tin: Chọn giảng viên, tên môn học và tên lớp.');
      return;
    }

    const logData: TeachingLog = {
      id: editingLog ? editingLog.id : `log-${Date.now()}`,
      teacherId: formTeacherId,
      subjectCode: formSubjectCode.trim() || 'MH000',
      subjectName: formSubjectName.trim(),
      className: formClassName.trim(),
      credits: Number(formCredits),
      studentCount: Number(formStudentCount),
      type: formType,
      coefficient: Number(formCoefficient),
      actualHours: Number(formActualHours),
      convertedHours: Number(formConvertedHours),
      semester: formSemester,
      academicYear: formYear
    };

    if (editingLog) {
      onEditTeachingLog(logData);
    } else {
      onAddTeachingLog(logData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string, subject: string, cls: string) => {
    setLogToDelete({ id, subject, className: cls });
  };

  const executeDelete = () => {
    if (logToDelete) {
      onDeleteTeachingLog(logToDelete.id);
      setLogToDelete(null);
    }
  };

  // Filter list
  const filteredLogs = useMemo(() => {
    return teachingLogs.filter(log => {
      if (log.academicYear !== selectedYear) return false;
      
      const teacher = teachers.find(t => t.id === log.teacherId);
      const teacherName = teacher ? teacher.name : '';
      
      const matchSearch = log.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          teacherName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchSemester = selectedSemester === 'all' || log.semester === selectedSemester;
      const matchTeacher = selectedTeacherId === 'all' || log.teacherId === selectedTeacherId;
      
      return matchSearch && matchSemester && matchTeacher;
    });
  }, [teachingLogs, selectedYear, searchQuery, selectedSemester, selectedTeacherId, teachers]);

  // Aggregate sum of filtered logs
  const totalFilteredHours = useMemo(() => {
    const act = filteredLogs.reduce((sum, log) => sum + log.actualHours, 0);
    const conv = filteredLogs.reduce((sum, log) => sum + log.convertedHours, 0);
    return {
      actual: Math.round(act * 10) / 10,
      converted: Math.round(conv * 10) / 10
    };
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      {/* Search and control bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Môn học, mã lớp, tên giảng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-[13px] w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Teacher filter */}
          <select
            value={selectedTeacherId}
            disabled={!isAdmin}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className={`text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isAdmin && <option value="all">Tất cả giảng viên</option>}
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({getRankString(t.rank)})</option>
            ))}
          </select>

          {/* Semester filter */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
          >
            <option value="all">Tất cả Học kỳ</option>
            <option value="HK1">Học kỳ 1</option>
            <option value="HK2">Học kỳ 2</option>
            <option value="HK3">Học kỳ phụ (HK3)</option>
          </select>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-[13px] px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all self-start lg:self-auto"
        >
          <Plus className="w-4 h-4" />
          Khai báo giờ giảng dạy
        </button>
      </div>

      {/* Aggregate indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 font-medium text-[10px] block uppercase font-bold tracking-wider">Tổng hợp hồ sơ hiển thị</span>
          <span className="text-xl font-bold text-slate-800 font-mono mt-0.5 block">{filteredLogs.length} lớp học</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 font-medium text-[10px] block uppercase font-bold tracking-wider">Số tiết thực tế trên lớp</span>
          <span className="text-xl font-bold text-slate-800 font-mono mt-0.5 block">{totalFilteredHours.actual} tiết</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/15 shadow-sm">
          <span className="text-blue-600 font-bold text-[10px] block uppercase font-bold tracking-wider">Giờ quy đổi tiêu chuẩn</span>
          <span className="text-xl font-extrabold text-blue-700 font-mono mt-0.5 block">{totalFilteredHours.converted} giờ</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[13px] font-semibold text-slate-500">
                <th className="py-3.5 px-4">Giảng viên</th>
                <th className="py-3.5 px-4">Môn giảng dạy</th>
                <th className="py-3.5 px-4">Lớp & Sĩ số</th>
                <th className="py-3.5 px-4">Học kỳ</th>
                <th className="py-3.5 px-4">Hình thức</th>
                <th className="py-3.5 px-4 text-center">Số tiết</th>
                <th className="py-3.5 px-4 text-center">Hệ số</th>
                <th className="py-3.5 px-4 text-right">Giờ quy chuẩn</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[13px] text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    Không có bản ghi giờ giảng nào phù hợp bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const teacher = teachers.find(t => t.id === log.teacherId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-[13px] items-center">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-800 block">{teacher ? teacher.name : 'N/A'}</span>
                          <span className="text-[10px] text-slate-400">{teacher ? teacher.department : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-slate-700 block">{log.subjectName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.subjectCode} • {log.credits} tín chỉ</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-medium text-slate-700 font-mono block">{log.className}</span>
                          <span className="text-[10px] text-slate-505 font-semibold text-slate-400">{log.studentCount} sinh viên</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {log.semester === 'HK1' ? 'Học kỳ 1' : log.semester === 'HK2' ? 'Học kỳ 2' : 'Học kỳ phụ (HK3)'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                          log.type === 'theoretical' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          log.type === 'practical' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {getTeachingTypeName(log.type)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600">
                        {log.actualHours}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold text-[10px]">
                          x{log.coefficient}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-blue-600">
                        {log.convertedHours} h
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          {(isAdmin || log.teacherId === currentTeacherId) ? (
                            <>
                              <button
                                onClick={() => openEditModal(log)}
                                className="p-1 hover:bg-blue-50 rounded-md text-blue-600 cursor-pointer"
                                title="Sửa hồ sơ"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(log.id, log.subjectName, log.className)}
                                className="p-1 hover:bg-rose-50 rounded-md text-rose-600 cursor-pointer"
                                title="Xóa hồ sơ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium select-none">Bảo mật</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 lg:max-w-4xl max-w-lg w-full overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800">
                  {editingLog ? 'Sửa thông tin giờ giảng dạy' : 'Khai báo lớp học & Giờ giảng chuẩn'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="col-span-2 lg:col-span-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Giảng viên trực tiếp phụ trách <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formTeacherId}
                      disabled={!isAdmin}
                      onChange={(e) => setFormTeacherId(e.target.value)}
                      className={`text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold ${!isAdmin ? 'opacity-70 cursor-not-allowed font-bold' : ''}`}
                    >
                      <option value="">-- Chọn giảng viên --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({getRankString(t.rank)} - {t.department})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Tên môn học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Cơ sở dữ liệu phân tán"
                      value={formSubjectName}
                      onChange={(e) => setFormSubjectName(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Mã môn học
                    </label>
                    <input
                      type="text"
                      placeholder="Mã học phần MH101"
                      value={formSubjectCode}
                      onChange={(e) => setFormSubjectCode(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Tên lớp chính thức <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="K68OT1"
                      value={formClassName}
                      onChange={(e) => setFormClassName(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Số tín chỉ môn học
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={formCredits}
                      onChange={(e) => setFormCredits(Number(e.target.value))}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Hình thức giảng dạy
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as TeachingType)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="theoretical">Lý thuyết tiêu chuẩn</option>
                      <option value="practical">Thực hành / Thí nghiệm</option>
                      <option value="project">Hướng dẫn Đồ án tốt nghiệp / KLTN</option>
                      <option value="master_thesis">Hướng dẫn Học viên Thạc sĩ</option>
                      <option value="phd_instruction">Hướng dẫn Nghiên cứu sinh</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Sĩ số lớp (quy định hệ số đông)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={formStudentCount}
                      onChange={(e) => setFormStudentCount(Number(e.target.value))}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Học kỳ
                    </label>
                    <select
                      value={formSemester}
                      onChange={(e) => setFormSemester(e.target.value as 'HK1' | 'HK2' | 'HK3')}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="HK1">Học kỳ 1</option>
                      <option value="HK2">Học kỳ 2</option>
                      <option value="HK3">Học kỳ phụ (HK3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Năm học giảng dạy
                    </label>
                    <select
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {academicYears.map(y => (
                        <option key={y.id} value={y.year}>{y.year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Automation highlight card */}
                <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100 flex gap-3 text-[13px] shadow-2xs">
                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <span className="font-bold text-blue-950 block select-none">Hệ thống tính toán tự động:</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-2 text-[11px] text-slate-600">
                      <div>
                        <span className="select-none font-medium">Tiết nguyên bản:</span>
                        <input 
                          type="number" 
                          value={formActualHours} 
                          onChange={(e) => {
                            setFormActualHours(Number(e.target.value));
                            setFormConvertedHours(Math.round(Number(e.target.value) * formCoefficient * 100) / 100);
                          }}
                          className="font-semibold block bg-white border border-slate-200 rounded text-center py-0.5 w-16 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="select-none font-medium">Hệ số quy đổi:</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={formCoefficient} 
                          onChange={(e) => {
                            setFormCoefficient(Number(e.target.value));
                            setFormConvertedHours(Math.round(formActualHours * Number(e.target.value) * 100) / 100);
                          }}
                          className="font-semibold block bg-white border border-slate-200 rounded text-center py-0.5 w-16 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <span className="text-blue-600 font-bold select-none">Giờ quy đổi chính thức:</span>
                        <span className="font-extrabold text-sm text-blue-700 block mt-0.5 font-mono">
                          {formConvertedHours} h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[13px] px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-[13px] px-4 py-2 rounded-lg shadow-xs cursor-pointer transition-colors"
                  >
                    Lưu giờ giảng
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {logToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-md w-full p-5 overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-rose-50 text-rose-600 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-800">Xác nhận xóa giờ giảng</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    Bạn có chắc chắn muốn xóa hồ sơ giảng dạy môn <strong className="text-slate-800">"{logToDelete.subject}"</strong> của lớp <strong className="text-slate-800">"{logToDelete.className}"</strong>?
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Hành động này không thể hoàn tác. Số giờ quy đổi liên quan sẽ được khấu trừ khỏi tổng số giờ của giảng viên.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-lg cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={executeDelete}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  Xác nhận Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

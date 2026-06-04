import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Teacher, TeachingLog, TeachingType, AcademicYearConfig } from '../types';
import { getRankString, getTeachingTypeName, TEACHING_ACTIVITIES } from '../data';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, AlertCircle, 
  HelpCircle, Check, X, Filter, Sparkles, Receipt,
  Users, Calendar, GraduationCap, CheckCircle
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

  // Preview Modal state
  const [detailPreview, setDetailPreview] = useState<TeachingLog | null>(null);

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

  // Handle change of type
  const handleTypeChange = (newType: string) => {
    setFormType(newType);
    const activity = TEACHING_ACTIVITIES.find(act => act.id === newType);
    const coef = activity ? activity.baseHour : 1.0;
    let actual = formCredits * 15;

    if (activity) {
      if (activity.unit === 'tiết') {
        actual = formCredits * 15;
      } else if (activity.unit === 'bài') {
        actual = formStudentCount || 40;
      } else if (activity.unit === 'đồ án') {
        actual = formStudentCount > 0 ? formStudentCount : 1;
      } else {
        actual = 1;
      }
    }

    setFormActualHours(actual);
    setFormCoefficient(coef);
    setFormConvertedHours(Math.round(actual * coef * 100) / 100);
  };

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
    
    // Explicitly set default calculation states
    setFormActualHours(45);
    setFormCoefficient(1.0);
    setFormConvertedHours(45);
    
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
    setFormCoefficient(log.coefficient);
    setFormActualHours(log.actualHours);
    setFormConvertedHours(log.convertedHours);

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
              className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Teacher filter */}
          <select
            value={selectedTeacherId}
            disabled={!isAdmin}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className={`text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
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
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
          >
            <option value="all">Tất cả Học kỳ</option>
            <option value="HK1">Học kỳ 1</option>
            <option value="HK2">Học kỳ 2</option>
            <option value="HK3">Học kỳ phụ (HK3)</option>
          </select>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all self-start lg:self-auto"
        >
          <Plus className="w-4 h-4" />
          Khai báo giờ giảng dạy
        </button>
      </div>

      {/* Aggregate indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 font-medium text-xs block uppercase font-bold tracking-wider">Tổng hợp hồ sơ hiển thị</span>
          <span className="text-xl font-bold text-slate-800 font-mono mt-0.5 block">{filteredLogs.length} lớp học</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 font-medium text-xs block uppercase font-bold tracking-wider">Số tiết thực tế trên lớp</span>
          <span className="text-xl font-bold text-slate-800 font-mono mt-0.5 block">{totalFilteredHours.actual} tiết</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/15 shadow-sm">
          <span className="text-blue-600 font-bold text-xs block uppercase font-bold tracking-wider">Giờ chuẩn</span>
          <span className="text-xl font-extrabold text-blue-700 font-mono mt-0.5 block">{totalFilteredHours.converted} giờ</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-4">Giảng viên</th>
                <th className="py-3.5 px-4">Môn giảng dạy</th>
                <th className="py-3.5 px-4">Lớp & Sĩ số</th>
                <th className="py-3.5 px-4">Học kỳ</th>
                <th className="py-3.5 px-4">Hình thức</th>
                <th className="py-3.5 px-4 text-center">Số tiết</th>
                <th className="py-3.5 px-4 text-center">Hệ số</th>
                <th className="py-3.5 px-4 text-center">Giờ chuẩn</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    Không có bản ghi giờ giảng nào phù hợp bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const teacher = teachers.find(t => t.id === log.teacherId);
                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/80 transition-colors text-sm cursor-pointer"
                      onClick={() => setDetailPreview(log)}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-slate-800 block">{teacher ? teacher.name : 'N/A'}</span>
                          <span className="text-xs text-slate-400">{teacher ? teacher.department : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-slate-800 block hover:text-blue-600">{log.subjectName}</span>
                          <span className="text-xs text-slate-400 font-mono">{log.subjectCode} • {log.credits} tín chỉ</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-slate-700 font-mono block">{log.className}</span>
                          <span className="text-xs font-semibold text-slate-400">{log.studentCount} học viên</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600 text-xs">
                        {log.semester === 'HK1' ? 'Học kỳ 1' : log.semester === 'HK2' ? 'Học kỳ 2' : 'Học kỳ phụ (HK3)'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                          log.type === 'theoretical' ? ' text-blue-700 ' :
                          log.type === 'practical' ? ' text-emerald-700' :
                          'text-amber-700'
                        }`}>
                          {getTeachingTypeName(log.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-650">
                        <div className="flex flex-col items-center">
                          <span>{log.actualHours}</span>
                          <span className="text-slate-400 font-normal text-xs">
                            {TEACHING_ACTIVITIES.find(a => a.id === log.type)?.unit || 'tiết'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold text-xs" title={`Hệ số định chuẩn: x${log.coefficient}`}>
                          x{log.coefficient}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-extrabold text-blue-600">
                        {log.convertedHours} 
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-1">
                          {(isAdmin || log.teacherId === currentTeacherId) ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(log);
                                }}
                                className="p-1 hover:bg-blue-50 rounded-md text-blue-600 cursor-pointer"
                                title="Sửa hồ sơ"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(log.id, log.subjectName, log.className);
                                }}
                                className="p-1 hover:bg-rose-50 rounded-md text-rose-600 cursor-pointer"
                                title="Xóa hồ sơ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium select-none">Bảo mật</span>
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
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs p-4 flex items-start justify-center">
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
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Giảng viên trực tiếp phụ trách <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formTeacherId}
                      disabled={!isAdmin}
                      onChange={(e) => setFormTeacherId(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="">-- Chọn giảng viên --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({getRankString(t.rank)} - {t.department})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Tên học phần <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Cấu tạo ô tô"
                      value={formSubjectName}
                      onChange={(e) => setFormSubjectName(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Mã học phần
                    </label>
                    <input
                      type="text"
                      placeholder="MH101"
                      value={formSubjectCode}
                      onChange={(e) => setFormSubjectCode(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Lớp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="K68OT1"
                      value={formClassName}
                      onChange={(e) => setFormClassName(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Số tín chỉ
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={formCredits}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormCredits(val);
                        // Auto-update hours if unit is 'tiết'
                        const activity = TEACHING_ACTIVITIES.find(act => act.id === formType);
                        if (activity && activity.unit === 'tiết') {
                          const newActual = val * 15;
                          setFormActualHours(newActual);
                          setFormConvertedHours(Math.round(newActual * formCoefficient * 100) / 100);
                        }
                      }}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div class="col-span-2 lg:col-span-4">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Hình thức giảng dạy / Hoạt động
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {Array.from(new Set(TEACHING_ACTIVITIES.map(a => a.category))).map(catName => (
                        <optgroup key={catName} label={catName} className="font-bold text-slate-500 text-[11px]">
                          {TEACHING_ACTIVITIES.filter(a => a.category === catName).map(activity => (
                            <option key={activity.id} value={activity.id} className="font-normal text-slate-800 text-xs">
                              {activity.label} ({activity.baseHour}h/{activity.unit})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {TEACHING_ACTIVITIES.find(a => a.id === formType) && (
                    <div className="col-span-2 lg:col-span-4 p-2.5 bg-blue-50/20 border border-blue-100 rounded-lg text-[11px] text-slate-650 flex gap-2">
                      <HelpCircle className="w-4.5 h-4.5 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">Quy định hiện hành: </span>
                        {TEACHING_ACTIVITIES.find(a => a.id === formType)?.helperText}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Sĩ số lớp 
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={formStudentCount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormStudentCount(val);
                        // Auto-update hours if unit is 'bài' or 'đồ án' or 'học viên' or 'nghiên cứu sinh'
                        const activity = TEACHING_ACTIVITIES.find(act => act.id === formType);
                        if (activity) {
                          if (activity.unit === 'bài') {
                            setFormActualHours(val);
                            setFormConvertedHours(Math.round(val * formCoefficient * 100) / 100);
                          } else if (activity.unit === 'đồ án' || activity.unit === 'học viên' || activity.unit === 'nghiên cứu sinh') {
                            setFormActualHours(val);
                            setFormConvertedHours(Math.round(val * formCoefficient * 100) / 100);
                          }
                        }
                      }}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Học kỳ
                    </label>
                    <select
                      value={formSemester}
                      onChange={(e) => setFormSemester(e.target.value as 'HK1' | 'HK2' | 'HK3')}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="HK1">Học kỳ 1</option>
                      <option value="HK2">Học kỳ 2</option>
                      <option value="HK3">Học kỳ phụ (HK3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Năm học giảng dạy
                    </label>
                    <select
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {academicYears.map(y => (
                        <option key={y.id} value={y.year}>{y.year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Automation highlight card */}
                <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100 flex gap-3 text-xs shadow-2xs">
                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <span className="font-bold text-blue-950 block select-none">Hệ thống tính toán tự động:</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-2 text-xs text-slate-600">
                      <div>
                        <span className="select-none font-medium">
                          Số lượng ({TEACHING_ACTIVITIES.find(a => a.id === formType)?.unit || 'tiết'}):
                        </span>
                        <input 
                          type="number" 
                          value={formActualHours} 
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormActualHours(val);
                            setFormConvertedHours(Math.round(val * formCoefficient * 100) / 100);
                          }}
                          className="font-semibold block bg-white border border-slate-200 rounded text-center py-0.5 w-16 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-550"
                        />
                      </div>
                      <div>
                        <span className="select-none font-medium">Hệ số định mức:</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={formCoefficient} 
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormCoefficient(val);
                            setFormConvertedHours(Math.round(formActualHours * val * 100) / 100);
                          }}
                          className="font-semibold block bg-white border border-slate-200 rounded text-center py-0.5 w-16 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-550"
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
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer transition-colors"
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
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bạn có chắc chắn muốn xóa hồ sơ giảng dạy môn <strong className="text-slate-800">"{logToDelete.subject}"</strong> của lớp <strong className="text-slate-800">"{logToDelete.className}"</strong>?
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Hành động này không thể hoàn tác. Số giờ quy đổi liên quan sẽ được khấu trừ khỏi tổng số giờ của giảng viên.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={executeDelete}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  Xác nhận Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {detailPreview && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/55">
                <h4 className="text-xs font-extrabold text-slate-400 header-font-mono uppercase tracking-widest">
                  Chi tiết giờ giảng dạy
                </h4>
                <button
                  onClick={() => setDetailPreview(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="px-5 py-4 overflow-y-auto space-y-4 text-slate-700">
                <div className="pb-3 border-b border-slate-100 flex flex-col gap-1">
                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded border self-start ${
                    detailPreview.type === 'theoretical' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    detailPreview.type === 'practical' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {getTeachingTypeName(detailPreview.type)}
                  </span>
                  <span className="text-base font-extrabold text-slate-900 tracking-tight block mt-1 leading-relaxed">
                    {detailPreview.subjectName}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-400 block">
                    Mã học phần: {detailPreview.subjectCode || 'N/A'} • {detailPreview.credits} tín chỉ
                  </span>
                </div>

                <div className="space-y-3.5 text-sm">
                  <div>
                    <span className="text-slate-450 block mb-0.5 text-xs uppercase font-bold tracking-wider">Giảng viên đảm nhiệm:</span>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">
                          {teachers.find(t => t.id === detailPreview.teacherId)?.name || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium ml-1.5 block sm:inline">
                          ({teachers.find(t => t.id === detailPreview.teacherId)?.department || 'Bộ môn'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-450 block mb-0.5 text-xs uppercase font-bold tracking-wider">Lớp học:</span>
                      <div className="font-bold text-slate-800 text-xs bg-slate-50 px-2.5 py-1 rounded border border-slate-100 inline-block font-mono">
                        {detailPreview.className}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-450 block mb-0.5 text-xs uppercase font-bold tracking-wider">Sĩ số sinh viên:</span>
                      <div className="font-semibold text-slate-700 text-xs bg-slate-50 px-2.5 py-1 rounded border border-slate-100 inline-block font-mono">
                        {detailPreview.studentCount} sinh viên
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-450 block mb-0.5 text-xs uppercase font-bold tracking-wider">Học kỳ:</span>
                      <div className="font-bold text-slate-800 text-xs">
                        {detailPreview.semester === 'HK1' ? 'Học kỳ 1' : detailPreview.semester === 'HK2' ? 'Học kỳ 2' : 'Học kỳ phụ (HK3)'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-450 block mb-0.5 text-xs uppercase font-bold tracking-wider">Năm học:</span>
                      <div className="font-semibold text-slate-700 font-mono text-xs">
                        {detailPreview.academicYear}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 text-center text-xs font-semibold text-slate-600">
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Số lượng / Quy mô</span>
                      <span className="font-mono text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200/50 text-xs font-bold">
                        {detailPreview.actualHours} {TEACHING_ACTIVITIES.find(a => a.id === detailPreview.type)?.unit || 'tiết'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Hệ số quy đổi</span>
                      <span className="font-mono text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200/50 text-xs font-bold text-amber-700">
                        x{detailPreview.coefficient}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-450 block mb-1.5 text-xs uppercase font-bold tracking-wider font-semibold">Thành quả quy chuẩn:</span>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-3 flex justify-between items-center shadow-sm">
                      <div className="space-y-0.5">
                        <span className="text-xs text-blue-100 block font-semibold uppercase tracking-wider">Giờ chuẩn quy đổi</span>
                        <span className="text-base font-extrabold font-mono text-white block">+{detailPreview.convertedHours} giờ chuẩn</span>
                      </div>
                      <div className="bg-white/10 rounded-full p-1 text-emerald-300">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/55 flex justify-end gap-2.5">
                {(isAdmin || detailPreview.teacherId === currentTeacherId) && (
                  <button
                    type="button"
                    onClick={() => {
                      const copyingLog = { ...detailPreview };
                      setDetailPreview(null);
                      setTimeout(() => {
                        openEditModal(copyingLog);
                      }, 200);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 font-bold text-xs px-3.5 py-1.5 rounded-lg border border-blue-200 cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Sửa thông tin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailPreview(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer transition-all"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

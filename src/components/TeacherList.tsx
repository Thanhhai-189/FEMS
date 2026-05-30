import { useState, useMemo, FormEvent } from 'react';
import { Teacher, AcademicRank, DepartmentConfig } from '../types';
import { getRankString } from '../data';
import { 
  UserPlus, Search, Edit2, Trash2, Shield, Mail, Building, 
  MapPin, UserCheck, UserX, X, AlertTriangle, ChevronRight, Eye,
  Calendar, Award, Briefcase, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TeacherListProps {
  teachers: Teacher[];
  departments: DepartmentConfig[];
  onAddTeacher: (teacher: Teacher) => void;
  onEditTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  userRole?: 'admin' | 'teacher';
  currentTeacherId?: string;
}

export default function TeacherList({ 
  teachers, 
  departments, 
  onAddTeacher, 
  onEditTeacher, 
  onDeleteTeacher,
  userRole = 'admin',
  currentTeacherId 
}: TeacherListProps) {
  const isAdmin = userRole === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRank, setSelectedRank] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formRank, setFormRank] = useState<AcademicRank>('ThS');
  const [formPosition, setFormPosition] = useState('');
  const [formParty, setFormParty] = useState('');
  const [formStatus, setFormStatus] = useState<'A' | 'I'>('A');
  const [formReduction, setFormReduction] = useState(0);

  // New fields form states
  const [formStartYear, setFormStartYear] = useState<number | ''>('');
  const [formMasterObtainYear, setFormMasterObtainYear] = useState<number | ''>('');
  const [formPhdObtainYear, setFormPhdObtainYear] = useState<number | ''>('');
  const [formPedagogyCertYear, setFormPedagogyCertYear] = useState('');
  const [formLanguageCert, setFormLanguageCert] = useState('');
  const [formItCert, setFormItCert] = useState('');
  const [formUnitExperience, setFormUnitExperience] = useState('');
  const [formUnitExperienceYear, setFormUnitExperienceYear] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAcademicTitle, setFormAcademicTitle] = useState('Không');
  const [formAcademicTitleYear, setFormAcademicTitleYear] = useState('');

  // Sate for custom delete confirmation modal
  const [teacherToDelete, setTeacherToDelete] = useState<{ id: string; name: string } | null>(null);

  // Profile Drawer/View - pre-select themselves on startup if they are a teacher
  const [selectedTeacherProfile, setSelectedTeacherProfile] = useState<Teacher | null>(() => {
    if (userRole === 'teacher' && currentTeacherId) {
      return teachers.find(t => t.id === currentTeacherId) || null;
    }
    return null;
  });

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormCode(`GV.${departments[0]?.id || 'NLDCD'}.${String(teachers.length + 1).padStart(2, '0')}`);
    setFormEmail('');
    setFormDept(departments[0]?.name || 'Nguyên lý Động cơ - Điện');
    setFormRank('ThS');
    setFormPosition('Giảng viên');
    setFormParty('Không kiêm nhiệm');
    setFormStatus('A');
    setFormReduction(0);
    // Initialize new fields
    setFormStartYear('');
    setFormMasterObtainYear('');
    setFormPhdObtainYear('');
    setFormPedagogyCertYear('');
    setFormLanguageCert('');
    setFormItCert('');
    setFormUnitExperience('');
    setFormUnitExperienceYear('');
    setFormPhone('');
    setFormAcademicTitle('Không');
    setFormAcademicTitleYear('');
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormName(teacher.name);
    setFormCode(teacher.code);
    setFormEmail(teacher.email);
    setFormDept(teacher.department);
    setFormRank(teacher.rank);
    setFormPosition(teacher.position);
    setFormParty(teacher.party || 'Không kiêm nhiệm');
    setFormStatus(teacher.status);
    setFormReduction(teacher.reductionRate);
    // Initialize new fields with teacher data
    setFormStartYear(teacher.startYear !== undefined ? teacher.startYear : '');
    setFormMasterObtainYear(teacher.masterObtainYear !== undefined ? teacher.masterObtainYear : '');
    setFormPhdObtainYear(teacher.phdObtainYear !== undefined ? teacher.phdObtainYear : '');
    setFormPedagogyCertYear(teacher.pedagogyCertYear || '');
    setFormLanguageCert(teacher.languageCert || '');
    setFormItCert(teacher.itCert || '');
    setFormUnitExperience(teacher.unitExperience || '');
    setFormUnitExperienceYear(teacher.unitExperienceYear || '');
    setFormPhone(teacher.phone || '');
    setFormAcademicTitle(teacher.academicTitle || 'Không');
    setFormAcademicTitleYear(teacher.academicTitleYear || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (Họ tên, Email)');
      return;
    }

    const teacherData: Teacher = {
      id: editingTeacher ? editingTeacher.id : `teacher-${Date.now()}`,
      name: formName.trim(),
      code: formCode.trim(),
      email: formEmail.trim(),
      department: formDept,
      rank: formRank,
      position: formPosition.trim() || 'Giảng viên',
      party: formParty || 'Không kiêm nhiệm',
      status: formStatus,
      reductionRate: Number(formReduction) || 0,
      startYear: formStartYear !== '' ? Number(formStartYear) : undefined,
      masterObtainYear: formMasterObtainYear !== '' ? Number(formMasterObtainYear) : undefined,
      phdObtainYear: formPhdObtainYear !== '' ? Number(formPhdObtainYear) : undefined,
      pedagogyCertYear: formPedagogyCertYear.trim() || undefined,
      languageCert: formLanguageCert.trim() || undefined,
      itCert: formItCert.trim() || undefined,
      unitExperience: formUnitExperience.trim() || undefined,
      unitExperienceYear: formUnitExperienceYear.trim() || undefined,
      phone: formPhone.trim() || undefined,
      academicTitle: formAcademicTitle,
      academicTitleYear: formAcademicTitleYear.trim() || undefined
    };

    if (editingTeacher) {
      onEditTeacher(teacherData);
    } else {
      onAddTeacher(teacherData);
    }
    // Update active profile view state if currently displaying the updated teacher
    if (selectedTeacherProfile && selectedTeacherProfile.id === teacherData.id) {
      setSelectedTeacherProfile(teacherData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setTeacherToDelete({ id, name });
  };

  const executeDelete = () => {
    if (teacherToDelete) {
      onDeleteTeacher(teacherToDelete.id);
      if (selectedTeacherProfile?.id === teacherToDelete.id) {
        setSelectedTeacherProfile(null);
      }
      setTeacherToDelete(null);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === 'all' || t.department === selectedDept;
      const matchRank = selectedRank === 'all' || t.rank === selectedRank;
      return matchSearch && matchDept && matchRank;
    });
  }, [teachers, searchQuery, selectedDept, selectedRank]);

  return (
    <div className="space-y-6">
      {/* Search and control bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-[13px] w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Dept filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
          >
            <option value="all">Tất cả bộ môn</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
            {teachers.some(t => t.department === 'Ban chủ nhiệm') && (
              <option value="Ban chủ nhiệm">Ban chủ nhiệm</option>
            )}
          </select>

          {/* Rank filter */}
          <select
            value={selectedRank}
            onChange={(e) => setSelectedRank(e.target.value)}
            className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
          >
            <option value="all">Tất cả học vị</option>
            <option value="TS">Tiến sĩ</option>
            <option value="ThS">Thạc sĩ</option>
            <option value="CN">Cử nhân</option>
          </select>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-[13px] px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Thêm Giảng viên mới
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Teacher List Grid */}
        <div className="lg:col-span-2 space-y-3">
          {filteredTeachers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-200">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Không tìm thấy giảng viên trùng khớp</p>
              <p className="text-[13px] text-slate-400 mt-1">Vui lòng thử điều chỉnh lại điều kiện lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <motion.div 
                layout
                key={teacher.id}
                className={`bg-white p-4 rounded-xl border ${
                  selectedTeacherProfile?.id === teacher.id ? 'border-blue-500 ring-1 ring-blue-100' : 'border-slate-100'
                } shadow-xs hover:border-slate-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
              >
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setSelectedTeacherProfile(teacher)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-extrabold text-slate-800 hover:text-blue-600 flex items-center gap-1">
                      {teacher.name}
                    </span>
                    <span className={`text-[13px] font-bold px-1.5 py-0.2 rounded-full ${
                      teacher.rank === 'GS' || teacher.rank === 'PGS' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      teacher.rank === 'TS' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {getRankString(teacher.rank)}
                    </span>
                    {teacher.status === 'I' && (
                      <span className="text-[13px] font-bold bg-rose-50 text-rose-600 px-1.5 rounded-full">
                        Đang nghỉ/phóng đi học
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-3 mt-1.5 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{teacher.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <span className="text-slate-400 font-medium">Chức vụ:</span>
                      <span className="text-slate-700 font-semibold">{teacher.position}</span>
                      {teacher.party && teacher.party !== 'Không kiêm nhiệm' && (
                        <span className="text-blue-600 font-semibold"> • {teacher.party}</span>
                      )}
                      {teacher.reductionRate > 0 && (
                        <span className="text-rose-600 font-semibold text-[13px] bg-rose-50 px-1 rounded-sm ml-1">
                          (Giảm {teacher.reductionRate}% định mức)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t border-slate-50 pt-3 sm:border-0 sm:pt-0">
                  <button
                    onClick={() => setSelectedTeacherProfile(teacher)}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 cursor-pointer tooltip"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {(isAdmin || teacher.id === currentTeacherId) && (
                    <button
                      onClick={() => openEditModal(teacher)}
                      className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600 cursor-pointer animate-pulse-slow font-medium"
                      title={teacher.id === currentTeacherId ? "Tự sửa thông tin của bạn" : "Sửa thông tin giảng viên"}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteClick(teacher.id, teacher.name)}
                      className="p-1.5 hover:bg-rose-50 rounded-md text-rose-600 cursor-pointer"
                      title="Xóa giảng viên"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Selected Teacher Details Cards Column */}
        <div className="lg:col-span-1">
          {selectedTeacherProfile ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 sticky top-4"
            >
              <div className="flex justify-between items-start">
                <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                  Chi tiết giảng viên
                </h4>
                <button 
                  onClick={() => setSelectedTeacherProfile(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-50 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="pb-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800 mt-1 block">{selectedTeacherProfile.name}</span>
                <span className="text-[13px] text-slate-500 font-medium block mt-0.5">{selectedTeacherProfile.department}</span>
              </div>

              <div className="space-y-3.5 text-[13px]">
                <div>
                  <span className="text-slate-400 block mb-0.5 text-[13px] uppercase font-bold tracking-wider">Học vị:</span>
                  <div className="font-semibold text-slate-700">
                    {getRankString(selectedTeacherProfile.rank)} ({selectedTeacherProfile.rank})
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5 text-[13px] uppercase font-bold tracking-wider">Chức vụ:</span>
                  <div className="font-semibold text-slate-700">
                    {selectedTeacherProfile.position}
                    {selectedTeacherProfile.party && selectedTeacherProfile.party !== 'Không kiêm nhiệm' && (
                      <span className="text-blue-600 font-semibold"> • {selectedTeacherProfile.party}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[13px] uppercase font-bold tracking-wider">Liên hệ Email:</span>
                    <div className="font-mono text-slate-600 truncate" title={selectedTeacherProfile.email}>
                      {selectedTeacherProfile.email}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[13px] uppercase font-bold tracking-wider">Số điện thoại:</span>
                    <div className="font-mono text-slate-700 font-semibold truncate" title={selectedTeacherProfile.phone}>
                      {selectedTeacherProfile.phone || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>

                {/* Professional Qualifications & Credentials */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-slate-400 block mb-1 text-[13px] uppercase font-bold tracking-wider">Hồ sơ chuyên môn & Chứng chỉ:</span>
                  
                  <div className="grid grid-cols-1 gap-2 bg-slate-50/60 p-3 rounded-lg border border-slate-100 text-[13px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-medium">Thâm niên giảng dạy: </span>
                        <span className="font-bold text-slate-700">
                          {selectedTeacherProfile.startYear 
                            ? `${new Date().getFullYear() - selectedTeacherProfile.startYear} năm (Bắt đầu từ ${selectedTeacherProfile.startYear})` 
                            : 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-medium">Bồi dưỡng NV sư phạm: </span>
                        <span className="font-semibold text-slate-700">
                          {selectedTeacherProfile.pedagogyCertYear 
                            ? `Năm ${selectedTeacherProfile.pedagogyCertYear}` 
                            : 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>

                    {selectedTeacherProfile.masterObtainYear && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <div>
                          <span className="text-slate-400 font-medium">Năm nhận bằng ThS: </span>
                          <span className="font-semibold text-slate-700">
                            Năm {selectedTeacherProfile.masterObtainYear}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedTeacherProfile.phdObtainYear && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <div>
                          <span className="text-slate-400 font-medium">Năm nhận bằng TS: </span>
                          <span className="font-semibold text-slate-700">
                            Năm {selectedTeacherProfile.phdObtainYear}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-medium">Chức danh: </span>
                        <span className="font-bold text-slate-700">
                          {selectedTeacherProfile.academicTitle && selectedTeacherProfile.academicTitle !== 'Không'
                            ? `${selectedTeacherProfile.academicTitle}${selectedTeacherProfile.academicTitleYear ? ` (Năm ${selectedTeacherProfile.academicTitleYear})` : ''}`
                            : 'Chưa cập nhật/Không'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-medium">Ngoại ngữ: </span>
                        <span className="font-semibold text-slate-700">
                          {selectedTeacherProfile.languageCert || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-medium">Tin học: </span>
                        <span className="font-semibold text-slate-700">
                          {selectedTeacherProfile.itCert || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-medium">Thực tế đơn vị: </span>
                        <span className={`font-bold inline-block px-1.5 py-0.5 rounded text-[13px] ${
                          selectedTeacherProfile.unitExperience && selectedTeacherProfile.unitExperience !== 'Chưa đi thực tế'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {selectedTeacherProfile.unitExperience 
                            ? `${selectedTeacherProfile.unitExperience}${selectedTeacherProfile.unitExperienceYear ? ` (Năm đi: ${selectedTeacherProfile.unitExperienceYear})` : ''}` 
                            : 'Chưa đi thực tế'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1 text-[13px] uppercase font-bold tracking-wider">Tình trạng miễn giảm:</span>
                  <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 font-medium block">Tỷ lệ giảm:</span>
                      <span className="text-sm font-bold text-blue-700">{selectedTeacherProfile.reductionRate}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 font-medium block">Trạng thái:</span>
                      <span className={`inline-flex items-center gap-1 font-bold text-[13px] ${
                        selectedTeacherProfile.status === 'A' ? 'text-emerald-700' : 'text-slate-500'
                      }`}>
                        {selectedTeacherProfile.status === 'A' ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Đang hoạt động
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5 text-rose-500" />
                            Nghỉ thai sản/học tập
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl text-center text-slate-400 text-[13px] font-medium">
              <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Chọn một giảng viên bên danh sách để xem thông tin chi tiết nhanh.
            </div>
          )}
        </div>
      </div>

      {/* Interactive Modal for Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs p-4 flex items-start justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 lg:max-w-4xl max-w-md w-full overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-[13px] font-bold text-slate-800">
                  {editingTeacher ? 'Cập nhật thông tin Giảng viên' : 'Thêm mới Giảng viên'}
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
                  <div className="col-span-2 lg:col-span-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Họ và Tên giảng viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="username@tdnu.edu.vn"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Bộ môn
                    </label>
                    <select
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {(formPosition?.toLowerCase().includes('chủ nhiệm') || formPosition?.toLowerCase().includes('phó chủ nhiệm')) && (
                        <option value="Ban chủ nhiệm">Ban chủ nhiệm</option>
                      )}
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Học vị
                    </label>
                    <select
                      value={formRank}
                      onChange={(e) => setFormRank(e.target.value as AcademicRank)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="TS">Tiến sĩ</option>
                      <option value="ThS">Thạc sĩ</option>
                      <option value="KS">Kỹ sư</option>
                      <option value="CN">Cử nhân</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Chức vụ
                    </label>
                    <select
                      value={formPosition}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormPosition(val);
                        if (val.toLowerCase().includes('chủ nhiệm') || val.toLowerCase().includes('phó chủ nhiệm')) {
                          setFormDept('Ban chủ nhiệm');
                        } else {
                          if (formDept === 'Ban chủ nhiệm') {
                            setFormDept(departments[0]?.name || 'Nguyên lý Động cơ - Điện');
                          }
                        }
                      }}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Giảng viên">Giảng viên / Trợ giảng</option>
                      <option value="Trưởng bộ môn">Trưởng bộ môn</option>
                      <option value="Chủ nhiệm khoa">Chủ nhiệm khoa</option>
                      <option value="Phó Chủ nhiệm khoa">Phó Chủ nhiệm khoa</option>
                      <option value="Nhân viên">Nhân viên (Không tính định mức)</option>
                    </select>
                  </div>



                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Chức vụ Đảng
                    </label>
                    <select
                      value={formParty}
                      onChange={(e) => setFormParty(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                      disabled={formPosition !== 'Chủ nhiệm khoa' && formPosition !== 'Phó Chủ nhiệm khoa'}
                    >
                      <option value="Không kiêm nhiệm">Không</option>
                      <option value="Bí thư chi bộ">Bí thư chi bộ</option>
                      <option value="Phó Bí thư chi bộ">Phó Bí thư chi bộ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Tình trạng nhân sự
                    </label>
                    <select
                      value={formStatus}
                      disabled={!isAdmin}
                      onChange={(e) => setFormStatus(e.target.value as 'A' | 'I')}
                      className={`text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="A">Đang Hoạt động</option>
                      <option value="I">Tạm dừng giảng (Thai sản/Đi học...)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      % Giảm trừ định mức (0-100%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={!isAdmin}
                      value={formReduction}
                      onChange={(e) => setFormReduction(Number(e.target.value))}
                      className={`text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-4 border-t border-slate-150 pt-3 my-1">
                    <span className="text-[13px] font-extrabold text-blue-600 uppercase tracking-wider block">
                      Hồ sơ chuyên môn & Chứng chỉ bổ sung
                    </span>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Năm bắt đầu giảng dạy
                    </label>
                    <input
                      type="number"
                      min="1970"
                      max={new Date().getFullYear()}
                      placeholder="Ví dụ: 2015"
                      value={formStartYear}
                      onChange={(e) => setFormStartYear(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Năm nhận bằng Thạc sĩ
                    </label>
                    <input
                      type="number"
                      min="1970"
                      max={new Date().getFullYear()}
                      placeholder="Ví dụ: 2018"
                      value={formMasterObtainYear}
                      onChange={(e) => setFormMasterObtainYear(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Năm nhận bằng Tiến sĩ
                    </label>
                    <input
                      type="number"
                      min="1970"
                      max={new Date().getFullYear()}
                      placeholder="Ví dụ: 2022"
                      value={formPhdObtainYear}
                      onChange={(e) => setFormPhdObtainYear(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Năm có CC nghiệp vụ sư phạm
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 2018"
                      value={formPedagogyCertYear}
                      onChange={(e) => setFormPedagogyCertYear(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Chứng chỉ Ngoại ngữ
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: IELTS 6.5, B2"
                      value={formLanguageCert}
                      onChange={(e) => setFormLanguageCert(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Chứng chỉ Tin học
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: MOS, IC3, Đại học"
                      value={formItCert}
                      onChange={(e) => setFormItCert(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Chức danh chuyên môn
                    </label>
                    <select
                      value={formAcademicTitle}
                      onChange={(e) => setFormAcademicTitle(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Không">Không</option>
                      <option value="Giảng viên">Giảng viên</option>
                      <option value="Giảng viên chính">Giảng viên chính</option>
                      <option value="Giảng viên cao cấp">Giảng viên cao cấp</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Năm nhận chức danh
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 2020"
                      value={formAcademicTitleYear}
                      disabled={formAcademicTitle === 'Không'}
                      onChange={(e) => setFormAcademicTitleYear(e.target.value)}
                      className={`text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium ${formAcademicTitle === 'Không' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Thực tế đơn vị (Đơn vị)
                    </label>
                    <select
                      value={formUnitExperience}
                      onChange={(e) => setFormUnitExperience(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="">Chưa đi thực tế</option>
                      <option value="Cấp phân đội">Cấp phân đội</option>
                      <option value="Cấp tiểu đoàn">Cấp tiểu đoàn</option>
                      <option value="Cấp trung đoàn">Cấp trung đoàn</option>
                      <option value="Cấp lữ đoàn">Cấp lữ đoàn</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 uppercase block mb-1">
                      Năm đi thực tế
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 2021"
                      value={formUnitExperienceYear}
                      disabled={!formUnitExperience}
                      onChange={(e) => setFormUnitExperienceYear(e.target.value)}
                      className={`text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium ${!formUnitExperience ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
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
                    Lưu dữ liệu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {teacherToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-md w-full p-5 overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-rose-50 text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-800">Xác nhận xóa giảng viên</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    Bạn có chắc chắn muốn xóa giảng viên <strong className="text-slate-800">"{teacherToDelete.name}"</strong> khỏi hệ thống?
                  </p>
                  <p className="text-[13px] text-rose-600 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 font-medium leading-relaxed">
                    ⚠️ <strong>Chú ý quan trọng:</strong> Hành động này sẽ thực hiện xóa liên hoàn (cascade delete) toàn bộ các hồ sơ giảng dạy và minh chứng nghiên cứu khoa học liên quan của giảng viên này. Dữ liệu sau khi xóa sẽ không thể khôi phục!
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  onClick={() => setTeacherToDelete(null)}
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

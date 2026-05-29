import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Teacher, ResearchLog, ResearchType, AcademicYearConfig } from '../types';
import { getRankString, getResearchTypeName, getRoleName, ACTIVITY_DATA, calculateNCKHPersonal } from '../data';
import { 
  Plus, Search, Edit2, Trash2, FileCode2, Sparkles, Check, X, 
  CheckCircle, AlertCircle, RefreshCw, Eye, BookOpen, Clock, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResearchTabProps {
  teachers: Teacher[];
  researchLogs: ResearchLog[];
  selectedYear: string;
  academicYears?: AcademicYearConfig[];
  onAddResearchLog: (log: ResearchLog) => void;
  onEditResearchLog: (log: ResearchLog) => void;
  onDeleteResearchLog: (id: string) => void;
  onApproveLog?: (id: string, status: 'approved' | 'rejected' | 'pending') => void;
  userRole?: 'admin' | 'teacher';
  currentTeacherId?: string;
}

export default function ResearchTab({ 
  teachers, 
  researchLogs, 
  selectedYear,
  academicYears = [],
  onAddResearchLog, 
  onEditResearchLog, 
  onDeleteResearchLog,
  onApproveLog,
  userRole = 'admin',
  currentTeacherId
}: ResearchTabProps) {
  const isAdmin = userRole === 'admin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    return userRole === 'teacher' && currentTeacherId ? currentTeacherId : 'all';
  });

  // Modal open states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ResearchLog | null>(null);

  // Custom delete state
  const [researchToDelete, setResearchToDelete] = useState<{ id: string; title: string } | null>(null);

  // Form fields
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<ResearchType>('dt_cs_truong');
  const [formRole, setFormRole] = useState<'main' | 'co_author' | 'leader' | 'member'>('main');
  const [formPoints, setFormPoints] = useState(12);
  const [formConvertedHours, setFormConvertedHours] = useState(1200);
  const [formYears, setFormYears] = useState<number>(1);
  const [formMembers, setFormMembers] = useState<number>(1);
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formPublicationYear, setFormPublicationYear] = useState('2024');
  const [formJournal, setFormJournal] = useState('');
  const [formPeriod, setFormPeriod] = useState<string>(selectedYear);
  const [formStatus, setFormStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [formNotes, setFormNotes] = useState('');

  // Unique existing works from all research logs
  const uniqueExistingWorks = useMemo(() => {
    const seen = new Set<string>();
    const works: { title: string; type: ResearchType; journal: string; year: string }[] = [];
    researchLogs.forEach(log => {
      const normalized = log.title.trim().toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        works.push({
          title: log.title,
          type: log.type,
          journal: log.journalOrOrganization || '',
          year: log.publicationYear || ''
        });
      }
    });
    return works;
  }, [researchLogs]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!formTitle.trim()) {
      return uniqueExistingWorks;
    }
    const query = formTitle.toLowerCase();
    return uniqueExistingWorks.filter(w => 
      w.title.toLowerCase().includes(query) || 
      w.journal.toLowerCase().includes(query)
    );
  }, [uniqueExistingWorks, formTitle]);

  // Selected Detail preview
  const [detailPreview, setDetailPreview] = useState<ResearchLog | null>(null);

  // Auto-calculated fields when type, role, years, members, or quantity shifts
  useEffect(() => {
    let basePoints = 0;
    // Find base points from ACTIVITY_DATA
    for (const cat of ACTIVITY_DATA) {
      const matched = cat.items.find(item => item.id === formType);
      if (matched) {
        basePoints = matched.points;
        break;
      }
    }

    // Default fallback if not found in ACTIVITY_DATA (support old items gracefully)
    if (basePoints === 0) {
      switch (formType) {
        case 'isi_scopus_q1': basePoints = 1200; break;
        case 'isi_scopus_q2_q4': basePoints = 1000; break;
        case 'international_journal': basePoints = 300; break;
        case 'national_journal_075': basePoints = 300; break;
        case 'national_journal_05': basePoints = 200; break;
        case 'book_compilation': basePoints = 1200; break;
        case 'patent': basePoints = 1200; break;
        case 'project_national': basePoints = 3600; break;
        case 'project_ministry': basePoints = 2400; break;
        case 'project_university': basePoints = 1200; break;
        case 'student_research_guide': basePoints = 75; break;
        default: basePoints = 300;
      }
    }

    const calcRole = (formRole === 'main' || formRole === 'leader') ? 'main' : 'co_author';
    const computedHours = calculateNCKHPersonal(basePoints, formQuantity, formYears, formMembers, calcRole);
    
    setFormConvertedHours(computedHours);
    // Let points be a clean visual index, e.g., basePoints / 100 (1200h -> 12 points)
    setFormPoints(Math.round((basePoints / 100) * 10) / 10);
  }, [formType, formRole, formYears, formMembers, formQuantity]);

  // Adjust Roles options dynamically according to research logs type
  const availableRoles = useMemo(() => {
    const isLeaderMemberType = formType.startsWith('dt_') || formType.startsWith('sk_') || formType === 'gt_tl' || formType.startsWith('project') || formType === 'book_compilation';
    if (isLeaderMemberType) {
      return [
        { value: 'leader', label: 'Chủ trì / Chủ nhiệm / Chủ biên' },
        { value: 'member', label: 'Thành viên' }
      ];
    }
    return [
      { value: 'main', label: 'Tác giả chính / liên hệ (First/Corresponding Author)' },
      { value: 'co_author', label: 'Đồng tác giả (Co-author)' }
    ];
  }, [formType]);

  // Force role reset to matching values of selection
  useEffect(() => {
    const isLeaderMemberType = formType.startsWith('dt_') || formType.startsWith('sk_') || formType === 'gt_tl' || formType.startsWith('project') || formType === 'book_compilation';
    if (isLeaderMemberType && (formRole === 'main' || formRole === 'co_author')) {
      setFormRole('leader');
    } else if (!isLeaderMemberType && (formRole === 'leader' || formRole === 'member')) {
      setFormRole('main');
    }
  }, [formType, formRole]);

  const openAddModal = () => {
    setEditingLog(null);
    setFormTeacherId(userRole === 'teacher' && currentTeacherId ? currentTeacherId : (teachers[0]?.id || ''));
    setFormTitle('');
    setFormType('dt_cs_truong');
    setFormRole('leader');
    setFormYears(1);
    setFormMembers(1);
    setFormQuantity(1);
    setFormPublicationYear(selectedYear.split('-')[0] || '2024');
    setFormPeriod(selectedYear);
    setFormJournal('');
    setFormStatus(userRole === 'teacher' ? 'pending' : 'approved');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (log: ResearchLog) => {
    setEditingLog(log);
    setFormTeacherId(log.teacherId);
    setFormTitle(log.title);
    setFormType(log.type);
    setFormRole(log.role);
    setFormYears(log.years || 1);
    setFormMembers(log.members || 1);
    setFormQuantity(log.quantity || 1);
    setFormPublicationYear(log.publicationYear);
    setFormPeriod(log.period || selectedYear);
    setFormJournal(log.journalOrOrganization);
    setFormStatus(log.status);
    setFormNotes(log.notes || '');

    // Delayed override
    setTimeout(() => {
      setFormPoints(log.points);
      setFormConvertedHours(log.convertedHours);
    }, 50);

    setIsModalOpen(true);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!formTeacherId || !formTitle.trim() || !formJournal.trim()) {
      alert('Vui lòng điền đầy đủ thông tin: Chọn giảng viên, tên công trình và đơn vị xuất bản.');
      return;
    }

    const logData: ResearchLog = {
      id: editingLog ? editingLog.id : `res-${Date.now()}`,
      teacherId: formTeacherId,
      title: formTitle.trim(),
      type: formType,
      role: formRole,
      points: Number(formPoints),
      convertedHours: Number(formConvertedHours),
      publicationYear: formPublicationYear,
      period: formPeriod, // Lưu giá trị năm học được chọn trong form
      journalOrOrganization: formJournal.trim(),
      status: formStatus,
      notes: formNotes.trim() || undefined,
      years: Number(formYears),
      members: Number(formMembers),
      quantity: Number(formQuantity)
    };

    if (editingLog) {
      onEditResearchLog(logData);
    } else {
      onAddResearchLog(logData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setResearchToDelete({ id, title: name });
  };

  const executeDelete = () => {
    if (researchToDelete) {
      onDeleteResearchLog(researchToDelete.id);
      setResearchToDelete(null);
    }
  };

  const toggleApproval = (id: string, currentStatus: 'approved' | 'rejected' | 'pending') => {
    if (!onApproveLog) return;
    const nextStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    onApproveLog(id, nextStatus);
  };

  // Filter list
  const filteredResearchLogs = useMemo(() => {
    return researchLogs.filter(log => {
      if (log.period !== selectedYear) return false;

      const teacher = teachers.find(t => t.id === log.teacherId);
      const teacherName = teacher ? teacher.name : '';

      const matchSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.journalOrOrganization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          teacherName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = selectedType === 'all' || log.type === selectedType;
      const matchStatus = selectedStatus === 'all' || log.status === selectedStatus;
      const matchTeacher = selectedTeacherId === 'all' || log.teacherId === selectedTeacherId;

      return matchSearch && matchType && matchStatus && matchTeacher;
    });
  }, [researchLogs, selectedYear, searchQuery, selectedType, selectedStatus, selectedTeacherId, teachers]);

  const stats = useMemo(() => {
    const totalPoints = filteredResearchLogs.reduce((acc, log) => acc + log.points, 0);
    const totalHours = filteredResearchLogs.reduce((acc, log) => acc + log.convertedHours, 0);
    const approvedCount = filteredResearchLogs.filter(l => l.status === 'approved').length;
    const pendingCount = filteredResearchLogs.filter(l => l.status === 'pending').length;
    return {
      points: Math.round(totalPoints * 10) / 10,
      hours: Math.round(totalHours * 10) / 10,
      approvedCount,
      pendingCount
    };
  }, [filteredResearchLogs]);

  return (
    <div className="space-y-6">
      {/* Filters heading control */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm công trình, bài báo, tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-[13px] w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Teacher select filter */}
          <select
            value={selectedTeacherId}
            disabled={!isAdmin}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className={`text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isAdmin && <option value="all">Mọi tác giả</option>}
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">Mọi trạng thái xét duyệt</option>
            <option value="approved font-semibold text-emerald-600"> Đã phê duyệt minh chứng</option>
            <option value="pending font-semibold text-amber-600">⏱️ Đang chờ thẩm định</option>
            <option value="rejected font-semibold text-rose-600"> Thất bại / Từ chối</option>
          </select>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-[13px] px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all self-start xl:self-auto"
        >
          <Plus className="w-4 h-4" />
          Khai báo minh chứng NCKH
        </button>
      </div>

      {/* Aggregate Indicators grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium text-[10px] block uppercase">Tổng công trình</span>
          <span className="text-lg font-extrabold text-slate-800 font-mono mt-0.5 block">{filteredResearchLogs.length} đề tài/bài báo</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium text-[10px] block uppercase">Tổng điểm khoa học</span>
          <span className="text-lg font-extrabold text-slate-800 font-mono mt-0.5 block">{stats.points} điểm</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-emerald-600 font-bold text-[10px] block uppercase">Đã phê duyệt</span>
          <span className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5 block">{stats.approvedCount} công trình</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/10 shadow-xs">
          <span className="text-blue-600 font-bold text-[10px] block uppercase">Tổng số giờ quy đổi</span>
          <span className="text-lg font-extrabold text-blue-700 font-mono mt-0.5 block">{stats.hours} giờ chuẩn</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-3.5">
          {filteredResearchLogs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-200">
              <FileCode2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-[13px] text-slate-400 font-medium">Không tìm thấy minh chứng nghiên cứu khoa học nào phù hợp bộ lọc.</p>
            </div>
          ) : (
            filteredResearchLogs.map((log) => {
              const teacher = teachers.find(t => t.id === log.teacherId);
              return (
                <motion.div 
                  layout
                  key={log.id}
                  className={`bg-white p-4.5 rounded-xl border ${
                    detailPreview?.id === log.id ? 'border-blue-500 ring-1 ring-blue-50/50' : 'border-slate-100'
                  } shadow-2xs hover:border-slate-200 transition-all space-y-2.5 cursor-pointer`}
                  onClick={() => setDetailPreview(log)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          log.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          log.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {log.status === 'approved' ? 'Đã duyệt' : log.status === 'pending' ? 'Chờ thẩm định' : 'Từ chối'}
                        </span>
                        
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-100">
                          {log.publicationYear}
                        </span>

                        <span className="text-[10px] font-semibold text-slate-500">
                          {getResearchTypeName(log.type)}
                        </span>
                      </div>
                      
                      <h4 className="text-[13px] font-bold text-slate-800 leading-relaxed block hover:text-blue-600">
                        {log.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium block">Giờ chuẩn quy đổi</span>
                      <span className="text-[13px] font-extrabold text-blue-600 font-mono">{log.convertedHours} h</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-slate-400">Tác giả:</span> <b className="text-slate-700">{teacher ? teacher.name : 'N/A'}</b>
                      </div>
                      <div className="h-3 w-px bg-slate-200 hidden sm:block" />
                      <div>
                        <span className="text-slate-400">Vai trò:</span> <span className="text-blue-600 font-bold bg-blue-50/50 px-1 rounded-sm">{getRoleName(log.role)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && onApproveLog && (
                        <button 
                          onClick={() => toggleApproval(log.id, log.status)}
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-sm border font-extrabold text-[10px] cursor-pointer transition-colors ${
                            log.status === 'approved' 
                              ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                          }`}
                          title={log.status === 'approved' ? 'Hủy phê duyệt xuống chờ duyệt' : 'Phê duyệt nhanh chỉ số'}
                        >
                          {log.status === 'approved' ? <Clock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          {log.status === 'approved' ? 'Hủy Duyệt' : 'Duyệt'}
                        </button>
                      )}
                      
                      {(isAdmin || log.teacherId === currentTeacherId) ? (
                        <>
                          <button
                            onClick={() => openEditModal(log)}
                            className="p-1 hover:bg-blue-50 rounded-md text-blue-600 cursor-pointer"
                            title="Sửa bản ghi nghiên cứu"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(log.id, log.title)}
                            className="p-1 hover:bg-rose-50 rounded-md text-rose-600 cursor-pointer"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium select-none bg-slate-100 px-1.5 py-0.5 rounded">Bảo mật</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Selected research logs review side profile */}
        <div className="lg:col-span-1">
          {detailPreview ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 sticky top-4"
            >
              <div className="flex justify-between items-start">
                <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                  Chi tiết minh chứng
                </h4>
                <button 
                  onClick={() => setDetailPreview(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-50 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="pb-3 border-b border-slate-100">
                <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-100">
                  {getResearchTypeName(detailPreview.type)}
                </span>
                <span className="text-[13px] font-bold text-slate-800 mt-2.5 block leading-relaxed">{detailPreview.title}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold tracking-wider">Đơn vị xuất bản / Quỹ tài trợ:</span>
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    {detailPreview.journalOrOrganization}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[12px] uppercase font-bold tracking-wider">Năm xuất bản:</span>
                    <div className="font-semibold text-slate-700 font-mono">
                      {detailPreview.publicationYear}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold tracking-wider">Điểm chất lượng:</span>
                    <div className="font-semibold text-emerald-600 font-bold font-mono">
                      {detailPreview.points} điểm KH
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100 grid grid-cols-3 gap-1.5 text-center text-[11px] font-semibold text-slate-600">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Số lượng</span>
                    <span className="font-mono text-slate-800">{detailPreview.quantity || 1}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Số năm</span>
                    <span className="font-mono text-slate-800">{detailPreview.years || 1}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Số thành viên</span>
                    <span className="font-mono text-slate-800">{detailPreview.members || 1}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold tracking-wider">Vai trò nghiên cứu:</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                    {getRoleName(detailPreview.role)}
                  </div>
                </div>

                {detailPreview.notes && (
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[13px] uppercase font-bold tracking-wider">Ghi chú minh chứng:</span>
                    <p className="text-slate-600 italic leading-normal bg-slate-50/50 p-2.5 rounded border border-dashed border-slate-200 text-[11px]">
                      "{detailPreview.notes}"
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold tracking-wider">Thành quả quy đổi:</span>
                  <div className="bg-blue-600 text-white rounded-xl p-3 flex justify-between items-center shadow-xs">
                    <div>
                      <span className="text-[9px] text-blue-100 block font-semibold uppercase">Giờ chuẩn đóng góp</span>
                      <span className="text-sm font-extrabold font-mono text-white block">+{detailPreview.convertedHours} giờ</span>
                    </div>
                    {detailPreview.status === 'approved' && (
                      <div className="bg-white/10 rounded-full p-1 text-emerald-300">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl text-center text-slate-400 text-[13px] font-medium">
              <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              Chọn một bài báo hay đề tài khoa học từ bảng danh sách bên để kiểm định nhanh các minh chứng liên quan.
            </div>
          )}
        </div>
      </div>

      {/* Insert modal dialog */}
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
                  {editingLog ? 'Chỉnh sửa tài liệu khoa học' : 'Khai báo thành tựu Nghiên cứu khoa học'}
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
                    <label className="text-[13px] font-bold text-slate-500 block mb-1">
                      Giảng viên thực hiện / Nhóm trưởng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formTeacherId}
                      disabled={!isAdmin}
                      onChange={(e) => setFormTeacherId(e.target.value)}
                      className={`text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold ${!isAdmin ? 'opacity-70 cursor-not-allowed font-bold' : ''}`}
                    >
                      <option value="">-- Chọn giảng viên nghiên cứu --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({getRankString(t.rank)} - {t.department})</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 lg:col-span-4 relative">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[13px] font-bold text-slate-500 block mb-1">
                        Tên công trình / Đề tài / Tên bài báo quốc tế <span className="text-rose-500">*</span>
                      </label>
                      {uniqueExistingWorks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(!showSuggestions)}
                          className="text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Chọn từ công trình có sẵn ({uniqueExistingWorks.length})
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Research on cyber threat defense using AI..."
                      value={formTitle}
                      onChange={(e) => {
                        setFormTitle(e.target.value);
                        setShowSuggestions(true);
                       }}
                      onFocus={() => {
                        if (uniqueExistingWorks.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay blurring so click options can register
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />

                    {/* Suggestions list dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                        <div className="bg-slate-50 px-3 py-1 text-[9px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center sticky top-0 border-b border-slate-100">
                          <span>Chọn công trình đã khai báo (Tự điền nhanh)</span>
                          <span className="text-[8px] font-normal font-mono">Tìm thấy {filteredSuggestions.length}</span>
                        </div>
                        {filteredSuggestions.map((work, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => {
                              setFormTitle(work.title);
                              setFormType(work.type);
                              setFormJournal(work.journal);
                              setFormPublicationYear(work.year);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col gap-1 transition-colors group cursor-pointer"
                          >
                            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 line-clamp-2 leading-snug">
                              {work.title}
                            </span>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-medium truncate">
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded shrink-0 font-bold">
                                {getResearchTypeName(work.type)}
                              </span>
                              {work.journal && (
                                <span className="truncate">
                                  Nơi công bố: <b>{work.journal}</b>
                                </span>
                              )}
                              {work.year && <span>• Năm {work.year}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 lg:col-span-2">
                    <label className="text-[13px] font-bold text-slate-500 block mb-1">
                      Chọn loại thành tựu / Đề tài NCKH <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as ResearchType)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {ACTIVITY_DATA.map((cat) => (
                        <optgroup key={cat.category} label={cat.category}>
                          {cat.items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label} ({item.points} giờ)
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 lg:col-span-2">
                    <label className="text-[13px] font-bold text-slate-500 block mb-1">
                      Vai trò thực hiện <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className="text-[13px] w-full border border-slate-150 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {availableRoles.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Group for Quantity, Years, and Members */}
                  <div className="col-span-2 lg:col-span-4 grid grid-cols-3 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Số lượng <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(Math.max(1, Number(e.target.value)))}
                        className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Số năm thực hiện <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formYears}
                        onChange={(e) => setFormYears(Math.max(1, Number(e.target.value)))}
                        className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Số thành viên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formMembers}
                        onChange={(e) => setFormMembers(Math.max(1, Number(e.target.value)))}
                        className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 lg:col-span-2">
                    <label className="text-[13px] font-bold text-slate-500 block mb-1">
                      Tạp chí / Đơn vị nghiệm thu cấp phép <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Elsevier / Springer / Cục SHTT / ĐH Quốc Gia"
                      value={formJournal}
                      onChange={(e) => setFormJournal(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[13px] font-bold text-slate-500 block mb-1">
                      Năm xuất bản / nghiệm thu
                    </label>
                    <input
                      type="text"
                      placeholder="2024"
                      value={formPublicationYear}
                      onChange={(e) => setFormPublicationYear(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[13px] font-bold text-slate-500 block mb-1">
                      Chọn Năm học <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formPeriod}
                      onChange={(e) => setFormPeriod(e.target.value)}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {academicYears && academicYears.length > 0 ? (
                        academicYears.map((yr) => (
                          <option key={yr.id} value={yr.year}>
                            {yr.year}
                          </option>
                        ))
                      ) : (
                        <option value={selectedYear}>{selectedYear}</option>
                      )}
                    </select>
                  </div>

                  <div className="col-span-2 lg:col-span-4">
                    <label className="text-[13px] font-bold text-slate-500 block mb-1">
                      Tình trạng kiểm tra
                    </label>
                    <select
                      value={formStatus}
                      disabled={!isAdmin}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className={`text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <option value="approved">Đã kiểm tra chứng minh & duyệt</option>
                      <option value="pending">Đang chờ tổ bộ môn xét duyệt</option>
                      <option value="rejected">Mất minh chứng / Từ chối tính điểm</option>
                    </select>
                  </div>

                  <div className="col-span-2 lg:col-span-4">
                    <label className="text-[13px] font-bold text-slate-500 block mb-1">
                      Tài liệu đính kèm hoặc Mô tả link minh chứng
                    </label>
                    <textarea
                      placeholder="Link DOI hoặc link DRIVE thư mục quyết định, chứng thực..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={2}
                      className="text-[13px] w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                {/* Automation highlight card */}
                <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 flex gap-3 text-[13px]">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <span className="font-bold text-emerald-950 block">Điểm quy đổi & Giờ chuẩn khoa học:</span>
                    <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] text-slate-600">
                      <div>
                        <span>Giờ quy chuẩn:</span>
                        <input 
                          type="number" 
                          value={formConvertedHours} 
                          onChange={(e) => setFormConvertedHours(Number(e.target.value))}
                          className="font-semibold block bg-white border border-slate-200 rounded text-center py-0.5 w-16 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                      <div className="col-span-1">
                        <span className="text-emerald-700 font-bold block">Tổng giờ ghi nhận:</span>
                        <span className="font-extrabold text-sm text-emerald-700 block mt-0.5 font-mono">
                          {formStatus === 'approved' ? `${formConvertedHours} h` : '0 h (Chưa duyệt)'}
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
                    Khai báo công trình
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {researchToDelete && (
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
                  <h3 className="text-sm font-extrabold text-slate-800">Xác nhận xóa công trình NCKH</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    Bạn có chắc chắn muốn xóa minh chứng nghiên cứu khoa học: <strong className="text-slate-800">"{researchToDelete.title}"</strong>?
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Hành động này không thể hoàn tác. Số giờ quy đổi nghiên cứu khoa học liên quan sẽ được khấu trừ khỏi tổng số giờ của giảng viên.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  onClick={() => setResearchToDelete(null)}
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

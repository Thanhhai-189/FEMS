import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Teacher, ResearchLog, ResearchType, AcademicYearConfig } from '../types';
import { getRankString, getResearchTypeName, getRoleName, ACTIVITY_DATA, calculateNCKHPersonal } from '../data';
import { 
  Plus, Search, Edit2, Trash2, FileCode2, Sparkles, Check, X, 
  CheckCircle, AlertCircle, RefreshCw, Eye, BookOpen, Clock, FileText, Users
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
  const [formCoAuthorIds, setFormCoAuthorIds] = useState<string[]>([]);
  const [showCoAuthorPanel, setShowCoAuthorPanel] = useState(false);

  // Unique existing works from all research logs (store full log reference for auto-fill)
  const uniqueExistingWorks = useMemo(() => {
    const seen = new Set<string>();
    const works: ResearchLog[] = [];
    researchLogs.forEach(log => {
      const normalized = log.title.trim().toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        works.push(log);
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
      (w.journalOrOrganization || '').toLowerCase().includes(query)
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
      { value: 'main', label: 'Tác giả chính / liên hệ' },
      { value: 'co_author', label: 'Đồng tác giả' }
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
    setFormCoAuthorIds([]);
    setShowCoAuthorPanel(false);
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
      
      // Tự động tạo bản ghi cho các đồng tác giả được chọn
      if (formCoAuthorIds.length > 0) {
        const coAuthorRole: 'main' | 'co_author' | 'leader' | 'member' = 
          (formType.startsWith('dt_') || formType.startsWith('sk_') || formType === 'gt_tl' || formType.startsWith('project') || formType.startsWith('book_compilation'))
            ? 'member' 
            : 'co_author';
        
        // Tổng số thành viên = 1 (chủ trì) + số đồng tác giả được chọn
        const totalMembers = 1 + formCoAuthorIds.length;
        
        formCoAuthorIds.forEach((coAuthorId) => {
          // Tính giờ cho đồng tác giả (role: member/co_author)
          const coAuthorHours = calculateNCKHPersonal(
            Number(formPoints) * 100, // Convert back to base points
            Number(formQuantity),
            Number(formYears),
            totalMembers,
            'co_author'
          );
          
          const coAuthorLog: ResearchLog = {
            id: `res-${Date.now()}-${coAuthorId}`,
            teacherId: coAuthorId,
            title: formTitle.trim(),
            type: formType,
            role: coAuthorRole,
            points: Number(formPoints),
            convertedHours: coAuthorHours,
            publicationYear: formPublicationYear,
            period: formPeriod,
            journalOrOrganization: formJournal.trim(),
            status: formStatus,
            notes: `[Đồng tác giả] ${formNotes.trim() || ''}`.trim() || undefined,
            years: Number(formYears),
            members: totalMembers,
            quantity: Number(formQuantity)
          };
          onAddResearchLog(coAuthorLog);
        });
      }
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
    const totalHours = filteredResearchLogs.reduce((acc, log) => acc + log.convertedHours, 0);
    const approvedCount = filteredResearchLogs.filter(l => l.status === 'approved').length;
    const pendingCount = filteredResearchLogs.filter(l => l.status === 'pending').length;
    return {
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
              className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Teacher select filter */}
          <select
            value={selectedTeacherId}
            disabled={!isAdmin}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className={`text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
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
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">Mọi trạng thái xét duyệt</option>
            <option value="approved font-semibold text-emerald-600"> Đã phê duyệt minh chứng</option>
            <option value="pending font-semibold text-amber-600">⏱️ Đang chờ thẩm định</option>
            <option value="rejected font-semibold text-rose-600"> Thất bại / Từ chối</option>
          </select>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all self-start xl:self-auto"
        >
          <Plus className="w-4 h-4" />
          Khai báo minh chứng NCKH
        </button>
      </div>

      {/* Aggregate Indicators grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium text-[10px] block uppercase">Tổng công trình</span>
          <span className="text-lg font-extrabold text-slate-800 font-mono mt-0.5 block">{filteredResearchLogs.length} đề tài/bài báo</span>
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

      {/* Main List & Table with w-full */}
      <div className="w-full mt-6">
        {filteredResearchLogs.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-200">
            <FileCode2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Không tìm thấy minh chứng nghiên cứu khoa học nào phù hợp bộ lọc.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table view */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3 min-w-[320px]">Tên đề tài / bài báo</th>
                    <th className="px-4 py-3">Tác giả</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Nơi công bố</th>
                    <th className="px-4 py-3 text-right">Giờ NCKH</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResearchLogs.map((log) => {
                    const teacher = teachers.find(t => t.id === log.teacherId);
                    return (
                      <tr 
                        key={log.id} 
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setDetailPreview(log)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100">
                                {log.publicationYear}
                              </span>
                              <span className="text-xs font-semibold text-slate-500 bg-slate-100/65 px-1.5 py-0.2 rounded">
                                {getResearchTypeName(log.type)}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 leading-snug hover:text-blue-600 block mt-1 line-clamp-2">
                              {log.title}
                            </h4>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                          {teacher ? teacher.name : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs">
                            {getRoleName(log.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-[150px] truncate" title={log.journalOrOrganization}>
                          {log.journalOrOrganization}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-blue-600 font-mono">
                          {log.convertedHours}
                        </td>
                        <td className="px-1 py-3.5 text-center whitespace-nowrap">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                            log.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                            log.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                            'bg-rose-50 text-rose-700 border border-rose-150'
                          }`}>
                            {log.status === 'approved' ? 'Đã duyệt' : log.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                          </span>
                        </td>
                        <td className="px-1 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
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
                                {log.status === 'approved' ? 'Hủy' : 'Duyệt'}
                              </button>
                            )}
                            
                            {(isAdmin || log.teacherId === currentTeacherId) ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(log);
                                  }}
                                  className="p-1 hover:bg-blue-50 rounded-md text-blue-600 cursor-pointer"
                                  title="Sửa bản ghi nghiên cứu"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(log.id, log.title);
                                  }}
                                  className="p-1 hover:bg-rose-50 rounded-md text-rose-600 cursor-pointer"
                                  title="Xóa bản ghi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium select-none bg-slate-100 px-1.5 py-0.5 rounded">Bảo mật</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card view (still w-full, but layout as responsive cards) */}
            <div className="block md:hidden space-y-3.5">
              {filteredResearchLogs.map((log) => {
                const teacher = teachers.find(t => t.id === log.teacherId);
                return (
                  <motion.div 
                    layout
                    key={log.id}
                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs hover:border-slate-200 transition-all space-y-2.5 cursor-pointer"
                    onClick={() => setDetailPreview(log)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block text-xs font-bold px-1.5 py-0.2 rounded ${
                            log.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            log.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {log.status === 'approved' ? 'Đã duyệt' : log.status === 'pending' ? 'Chờ thẩm định' : 'Từ chối'}
                          </span>
                          
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100">
                            {log.publicationYear}
                          </span>

                          <span className="text-xs font-semibold text-slate-500">
                            {getResearchTypeName(log.type)}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-bold text-slate-800 leading-relaxed block hover:text-blue-600">
                          {log.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-400 font-medium block">Quy đổi</span>
                        <span className="text-sm font-extrabold text-blue-600 font-mono">{log.convertedHours} h</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-slate-400">Tác giả:</span> <b className="text-slate-700">{teacher ? teacher.name : 'N/A'}</b>
                        </div>
                        <div className="h-3 w-px bg-slate-200" />
                        <div>
                          <span className="text-slate-400">Vai trò:</span> <span className="text-blue-600 font-bold bg-blue-50/50 px-1 rounded-sm">{getRoleName(log.role)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && onApproveLog && (
                          <button 
                            onClick={() => toggleApproval(log.id, log.status)}
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-sm border font-extrabold text-xs cursor-pointer transition-colors ${
                              log.status === 'approved' 
                                ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            }`}
                          >
                            {log.status === 'approved' ? <Clock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {log.status === 'approved' ? 'Hủy' : 'Duyệt'}
                          </button>
                        )}
                        
                        {(isAdmin || log.teacherId === currentTeacherId) ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(log);
                              }}
                              className="p-1 hover:bg-blue-50 rounded-md text-blue-600 cursor-pointer ml-auto"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(log.id, log.title);
                              }}
                              className="p-1 hover:bg-rose-50 rounded-md text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium select-none bg-slate-100 px-1.5 py-0.5 rounded ml-auto">Bảo mật</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Floating popup modal for Research Details review */}
      <AnimatePresence>
        {detailPreview && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs p-4 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/55">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                  Chi tiết minh chứng nghiên cứu
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
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 self-start">
                    {getResearchTypeName(detailPreview.type)}
                  </span>
                  <span className="text-base font-extrabold text-slate-900 tracking-tight block mt-1 leading-relaxed">
                    {detailPreview.title}
                  </span>
                </div>

                <div className="space-y-3.5 text-sm">
                  <div>
                    <span className="text-slate-440 block mb-0.5 text-xs uppercase font-bold tracking-wider">Đơn vị xuất bản / Quỹ tài trợ:</span>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      {detailPreview.journalOrOrganization}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-440 block mb-0.5 text-xs uppercase font-bold tracking-wider">Năm xuất bản:</span>
                      <div className="font-semibold text-slate-700 font-mono text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
                        {detailPreview.publicationYear}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-440 block mb-0.5 text-xs uppercase font-bold tracking-wider">Tác giả:</span>
                      <div className="font-bold text-slate-800 text-xs">
                        {teachers.find(t => t.id === detailPreview.teacherId)?.name || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-440 block mb-0.5 text-xs uppercase font-bold tracking-wider">Vai trò nghiên cứu:</span>
                      <div className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block text-xs">
                        {getRoleName(detailPreview.role)}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-440 block mb-0.5 text-xs uppercase font-bold tracking-wider">Năm học:</span>
                      <div className="font-semibold text-slate-700 font-mono text-xs">
                        {detailPreview.period}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-600">
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Số lượng</span>
                      <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200/50">{detailPreview.quantity || 1}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Số năm</span>
                      <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200/50">{detailPreview.years || 1}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Số thành viên</span>
                      <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200/50">{detailPreview.members || 1}</span>
                    </div>
                  </div>

                  {detailPreview.notes && (
                    <div>
                      <span className="text-slate-440 block mb-1 text-xs uppercase font-bold tracking-wider">Tài liệu đính kèm / Ghi chú:</span>
                      <p className="text-slate-600 leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-dashed border-slate-200 text-xs break-all">
                        {detailPreview.notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-440 block mb-1.5 text-xs uppercase font-bold tracking-wider">Thành quả quy đổi:</span>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-3 flex justify-between items-center shadow-sm">
                      <div className="space-y-0.5">
                        <span className="text-xs text-blue-100 block font-semibold uppercase tracking-wider">Giờ chuẩn đóng góp</span>
                        <span className="text-sm font-extrabold font-mono text-white block">+{detailPreview.convertedHours} giờ</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${
                          detailPreview.status === 'approved' ? 'bg-emerald-500/20 text-emerald-200' :
                          detailPreview.status === 'pending' ? 'bg-amber-500/20 text-amber-200' :
                          'bg-rose-500/20 text-rose-200'
                        }`}>
                          {detailPreview.status === 'approved' ? 'Đã duyệt' : detailPreview.status === 'pending' ? 'Chở duyệt' : 'Từ chối'}
                        </span>
                        {detailPreview.status === 'approved' && (
                          <div className="bg-white/10 rounded-full p-1 text-emerald-300">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        )}
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
                    className="inline-flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-blue-200 cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Sửa thông tin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailPreview(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Insert modal dialog */}
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
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Giảng viên thực hiện <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formTeacherId}
                      disabled={!isAdmin}
                      onChange={(e) => setFormTeacherId(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="">-- Chọn giảng viên nghiên cứu --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({getRankString(t.rank)} - {t.department})</option>
                      ))}
                    </select>
                  </div>

                  {/* Đồng tác giả selection - chỉ hiện khi khai báo mới */}
                  {!editingLog && (
                    <div className="col-span-2 lg:col-span-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-500 block">
                          Đồng tác giả (tự động tính giờ cho từng người)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCoAuthorPanel(!showCoAuthorPanel)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Users className="w-2.5 h-2.5" />
                          {formCoAuthorIds.length > 0 
                            ? `Đã chọn ${formCoAuthorIds.length} đồng tác giả` 
                            : 'Chọn đồng tác giả'}
                        </button>
                      </div>
                      {showCoAuthorPanel && (
                        <div className="border border-slate-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                          <div className="p-2 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 sticky top-0">
                            Chọn giảng viên đồng tác giả trong khoa
                          </div>
                          {teachers
                            .filter(t => t.id !== formTeacherId)
                            .map((teacher) => (
                              <label
                                key={teacher.id}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                              >
                                <input
                                  type="checkbox"
                                  checked={formCoAuthorIds.includes(teacher.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormCoAuthorIds(prev => [...prev, teacher.id]);
                                    } else {
                                      setFormCoAuthorIds(prev => prev.filter(id => id !== teacher.id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-slate-700 truncate">{teacher.name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{teacher.department} • {getRankString(teacher.rank)}</div>
                                </div>
                              </label>
                            ))
                          }
                        </div>
                      )}
                      {formCoAuthorIds.length > 0 && !showCoAuthorPanel && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formCoAuthorIds.map(id => {
                            const t = teachers.find(te => te.id === id);
                            return t ? (
                              <span key={id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-100">
                                {t.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="col-span-2 lg:col-span-4 relative">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        Tên công trình / Đề tài / Bài báo <span className="text-rose-500">*</span>
                      </label>
                      {uniqueExistingWorks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(!showSuggestions)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm flex items-center gap-1 cursor-pointer transition-colors"
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
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />

                    {/* Suggestions list dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                        <div className="bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center sticky top-0 border-b border-slate-100">
                          <span>Chọn công trình đã khai báo (Tự điền nhanh)</span>
                          <span className="text-xs font-normal font-mono">Tìm thấy {filteredSuggestions.length}</span>
                        </div>
                        {filteredSuggestions.map((work, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => {
                              // Tự động điền TẤT CẢ thông tin từ công trình đã lưu
                              setFormTitle(work.title);
                              setFormType(work.type);
                              setFormJournal(work.journalOrOrganization || '');
                              setFormPublicationYear(work.publicationYear || '');
                              setFormRole(work.role || 'leader');
                              setFormQuantity(work.quantity || 1);
                              setFormYears(work.years || 1);
                              setFormMembers(work.members || 1);
                              setFormNotes(work.notes || '');
                              // Giữ nguyên teacherId và period hiện tại (không copy từ bản ghi cũ)
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col gap-1 transition-colors group cursor-pointer"
                          >
                            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 line-clamp-2 leading-snug">
                              {work.title}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium truncate">
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded shrink-0 font-bold">
                                {getResearchTypeName(work.type)}
                              </span>
                              {work.journalOrOrganization && (
                                <span className="truncate">
                                  Nơi công bố: <b>{work.journalOrOrganization}</b>
                                </span>
                              )}
                              {work.publicationYear && <span>• Năm {work.publicationYear}</span>}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium truncate">
                              <span>SLL: {work.quantity || 1}</span>
                              <span>• SN: {work.years || 1}</span>
                              <span>• STV: {work.members || 1}</span>
                              <span>• {getRoleName(work.role)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 lg:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Chọn loại nhiệm vụ NCKH <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as ResearchType)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
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
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Vai trò thực hiện <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className="text-xs w-full border border-slate-150 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {availableRoles.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Group for Quantity, Years, and Members */}
                  <div className="col-span-2 lg:col-span-4 grid grid-cols-3 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                        Số lượng <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(Math.max(1, Number(e.target.value)))}
                        className="text-xs w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                        Số năm thực hiện <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formYears}
                        onChange={(e) => setFormYears(Math.max(1, Number(e.target.value)))}
                        className="text-xs w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                        Số thành viên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formMembers}
                        onChange={(e) => setFormMembers(Math.max(1, Number(e.target.value)))}
                        className="text-xs w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 lg:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Tạp chí / Đơn vị nghiệm thu cấp phép <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Elsevier / Springer / Cục SHTT / ĐH Quốc Gia"
                      value={formJournal}
                      onChange={(e) => setFormJournal(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Năm xuất bản / nghiệm thu
                    </label>
                    <input
                      type="text"
                      placeholder="2024"
                      value={formPublicationYear}
                      onChange={(e) => setFormPublicationYear(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Chọn Năm học <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formPeriod}
                      onChange={(e) => setFormPeriod(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
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

                  <div className="col-span-2 lg:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Tình trạng kiểm tra
                    </label>
                    <select
                      value={formStatus}
                      disabled={!isAdmin}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="approved">Đã kiểm tra chứng minh & duyệt</option>
                      <option value="pending">Đang chờ xét duyệt</option>
                      <option value="rejected">Mất minh chứng / Từ chối tính điểm</option>
                    </select>
                  </div>

                  <div className="col-span-2 lg:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Tài liệu đính kèm hoặc Mô tả link minh chứng
                    </label>
                    <textarea
                      placeholder="Link DOI hoặc link DRIVE thư mục quyết định, chứng thực..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={2}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                {/* Automation highlight card */}
                <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 flex gap-3 text-xs">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <span className="font-bold text-emerald-950 block">Quy đổi Giờ chuẩn khoa học:</span>
                    <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-slate-600">
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
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer transition-colors"
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
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bạn có chắc chắn muốn xóa minh chứng nghiên cứu khoa học: <strong className="text-slate-800">"{researchToDelete.title}"</strong>?
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Hành động này không thể hoàn tác. Số giờ quy đổi nghiên cứu khoa học liên quan sẽ được khấu trừ khỏi tổng số giờ của giảng viên.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  onClick={() => setResearchToDelete(null)}
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
      </AnimatePresence>
    </div>
  );
}

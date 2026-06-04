import { useState, FormEvent } from 'react';
import { Teacher, WorkHistory, AcademicRank } from '../types';
import { getRankString, DEPARTMENTS, ACADEMIC_YEARS } from '../data';
import { 
  Plus, Edit2, Trash2, X, Calendar, Building, 
  Briefcase, Award, GraduationCap, UserCheck, UserX, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkHistoryManagerProps {
  teacher: Teacher;
  workHistories: WorkHistory[];
  academicYears: { id: string; year: string; isActive: boolean }[];
  onAddWorkHistory: (wh: WorkHistory) => void;
  onEditWorkHistory: (wh: WorkHistory) => void;
  onDeleteWorkHistory: (id: string) => void;
  isAdmin: boolean;
}

export default function WorkHistoryManager({
  teacher,
  workHistories,
  academicYears,
  onAddWorkHistory,
  onEditWorkHistory,
  onDeleteWorkHistory,
  isAdmin
}: WorkHistoryManagerProps) {
  // Lọc work histories của giảng viên này
  const teacherWorkHistories = workHistories
    .filter(wh => wh.teacherId === teacher.id)
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWH, setEditingWH] = useState<WorkHistory | null>(null);

  // Form states
  const [formAcademicYear, setFormAcademicYear] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formAcademicTitle, setFormAcademicTitle] = useState('');
  const [formRank, setFormRank] = useState<AcademicRank>('ThS');
  const [formReductionRate, setFormReductionRate] = useState(0);
  const [formStatus, setFormStatus] = useState<'A' | 'I'>('A');
  const [formParty, setFormParty] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; year: string } | null>(null);

  const openAddModal = () => {
    setEditingWH(null);
    setFormAcademicYear(academicYears.length > 0 ? [...academicYears].sort((a, b) => b.year.localeCompare(a.year))[0].year : '');
    setFormDepartment(teacher.department);
    setFormPosition(teacher.position);
    setFormAcademicTitle(teacher.academicTitle || 'Không');
    setFormRank(teacher.rank);
    setFormReductionRate(teacher.reductionRate);
    setFormStatus(teacher.status);
    setFormParty(teacher.party || 'Không kiêm nhiệm');
    setIsModalOpen(true);
  };

  const openEditModal = (wh: WorkHistory) => {
    setEditingWH(wh);
    setFormAcademicYear(wh.academicYear);
    setFormDepartment(wh.department);
    setFormPosition(wh.position);
    setFormAcademicTitle(wh.academicTitle);
    setFormRank(wh.rank);
    setFormReductionRate(wh.reductionRate);
    setFormStatus(wh.status);
    setFormParty(wh.party);
    setIsModalOpen(true);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!formAcademicYear || !formDepartment || !formPosition) {
      alert('Vui lòng điền đầy đủ: Năm học, Đơn vị, Chức vụ');
      return;
    }

    const whData: WorkHistory = {
      id: editingWH ? editingWH.id : `wh-${Date.now()}`,
      teacherId: teacher.id,
      academicYear: formAcademicYear,
      department: formDepartment,
      position: formPosition,
      academicTitle: formAcademicTitle,
      rank: formRank,
      reductionRate: Number(formReductionRate),
      status: formStatus,
      party: formParty,
      createdBy: 'admin',
      createdAt: Date.now()
    };

    if (editingWH) {
      onEditWorkHistory(whData);
    } else {
      onAddWorkHistory(whData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string, year: string) => {
    setDeleteConfirm({ id, year });
  };

  const executeDelete = () => {
    if (deleteConfirm) {
      onDeleteWorkHistory(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
          Quá trình công tác theo năm học
        </h3>
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openAddModal(); }}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm bản ghi
          </button>
        )}
      </div>

      {teacherWorkHistories.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">
            Chưa có dữ liệu quá trình công tác cho giảng viên này.
          </p>
          {isAdmin && (
            <p className="text-xs text-slate-400 mt-1">
              Nhấn "Thêm bản ghi" để tạo mới.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Năm học</th>
                <th className="py-2.5 px-3">Đơn vị</th>
                <th className="py-2.5 px-3">Chức vụ</th>
                <th className="py-2.5 px-3">Chức danh</th>
                <th className="py-2.5 px-3">Học vị</th>
                <th className="py-2.5 px-3 text-center">Giảm trừ</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                {isAdmin && <th className="py-2.5 px-3 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherWorkHistories.map((wh) => (
                <tr key={wh.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-700 font-mono">
                    {wh.academicYear}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span>{wh.department}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">{wh.position}</span>
                      {wh.party && wh.party !== 'Không kiêm nhiệm' && (
                        <span className="text-blue-600 font-bold text-[10px] bg-blue-50 px-1 py-0.2 rounded">
                          • {wh.party}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={wh.academicTitle && wh.academicTitle !== 'Không' ? 'font-semibold text-slate-700' : 'text-slate-400'}>
                        {wh.academicTitle || 'Không'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">{getRankString(wh.rank)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-bold font-mono ${
                      wh.reductionRate > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}>
                      {wh.reductionRate > 0 ? `${wh.reductionRate}%` : '0%'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      wh.status === 'A' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {wh.status === 'A' ? (
                        <><UserCheck className="w-2.5 h-2.5" /> Hoạt động</>
                      ) : (
                        <><UserX className="w-2.5 h-2.5" /> Tạm dừng</>
                      )}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEditModal(wh); }}
                          className="p-1 hover:bg-blue-50 rounded text-blue-600 cursor-pointer"
                          title="Sửa"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(wh.id, wh.academicYear); }}
                          className="p-1 hover:bg-rose-50 rounded text-rose-600 cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs p-4 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"
            >
              <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800">
                  {editingWH ? 'Sửa bản ghi quá trình công tác' : 'Thêm bản ghi quá trình công tác'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Giảng viên
                    </label>
                    <input
                      type="text"
                      value={teacher.name}
                      disabled
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 font-semibold text-slate-700 cursor-not-allowed"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Năm học <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formAcademicYear}
                      onChange={(e) => setFormAcademicYear(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="">-- Chọn năm học --</option>
                      {[...academicYears]
                        .sort((a, b) => b.year.localeCompare(a.year))
                        .map((yr) => (
                          <option key={yr.id} value={yr.year}>
                            {yr.year} {yr.isActive ? '(Đang áp dụng)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Đơn vị công tác <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                      <option value="Ban chủ nhiệm">Ban chủ nhiệm</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Chức vụ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Giảng viên">Giảng viên / Trợ giảng</option>
                      <option value="Trưởng bộ môn">Trưởng bộ môn</option>
                      <option value="Chủ nhiệm khoa">Chủ nhiệm khoa</option>
                      <option value="Phó Chủ nhiệm khoa">Phó Chủ nhiệm khoa</option>
                      <option value="Giảng viên chính">Giảng viên chính</option>
                      <option value="Nhân viên">Nhân viên</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Chức vụ Đảng
                    </label>
                    <select
                      value={formParty}
                      onChange={(e) => setFormParty(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Không kiêm nhiệm">Không</option>
                      <option value="Bí thư chi bộ">Bí thư chi bộ</option>
                      <option value="Phó Bí thư chi bộ">Phó Bí thư chi bộ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Chức danh chuyên môn
                    </label>
                    <select
                      value={formAcademicTitle}
                      onChange={(e) => setFormAcademicTitle(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Không">Không</option>
                      <option value="Giảng viên">Giảng viên</option>
                      <option value="Giảng viên chính">Giảng viên chính</option>
                      <option value="Giảng viên cao cấp">Giảng viên cao cấp</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Học vị <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formRank}
                      onChange={(e) => setFormRank(e.target.value as AcademicRank)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="TS">Tiến sĩ</option>
                      <option value="ThS">Thạc sĩ</option>
                      <option value="CN">Cử nhân</option>
                      <option value="KS">Kỹ sư</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Giảm trừ định mức (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formReductionRate}
                      onChange={(e) => setFormReductionRate(Number(e.target.value))}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'A' | 'I')}
                      className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="A">Đang hoạt động</option>
                      <option value="I">Tạm dừng (Nghỉ/Đi học)</option>
                    </select>
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
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSave(e as any); }}
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer transition-colors"
                  >
                    Lưu dữ liệu
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
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
                  <h3 className="text-sm font-extrabold text-slate-800">Xác nhận xóa</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bạn có chắc chắn muốn xóa bản ghi quá trình công tác năm học <strong className="text-slate-800">"{deleteConfirm.year}"</strong>?
                  </p>
                  <p className="text-xs text-rose-600 font-medium">
                    Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
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
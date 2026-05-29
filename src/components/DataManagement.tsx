import { useState, FormEvent } from 'react';
import { RankNorm, AcademicYearConfig, DepartmentConfig } from '../types';
import { 
  Settings, Key, Bookmark, Calendar, Trash2, RotateCcw, 
  Download, Upload, Save, CheckCircle2, Server, HelpCircle, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { POSITION_NORMS } from '../data';

interface DataManagementProps {
  rankNorms: RankNorm[];
  academicYears: AcademicYearConfig[];
  selectedYear: string;
  onUpdateNorms: (norms: RankNorm[]) => void;
  onSetAcademicYear: (year: string) => void;
  onAddAcademicYear: (yearConfig: AcademicYearConfig) => void;
  onResetToDefault: () => void;
  onImportData: (dataJson: string) => boolean;
  onExportData: () => string;
}

export default function DataManagement({
  rankNorms,
  academicYears,
  selectedYear,
  onUpdateNorms,
  onSetAcademicYear,
  onAddAcademicYear,
  onResetToDefault,
  onImportData,
  onExportData
}: DataManagementProps) {
  
  // New year form
  const [newYearName, setNewYearName] = useState('');
  const [successYear, setSuccessYear] = useState(false);

  // Import / Export state
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Custom reset states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  const handleCreateYear = (e: FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim()) {
      alert('Vui lòng điền tên năm học (ví dụ: 2025-2026)');
      return;
    }
    const isExist = academicYears.some(y => y.year.toLowerCase() === newYearName.trim().toLowerCase());
    if (isExist) {
      alert('Năm học này đã có sẵn trong danh sách!');
      return;
    }

    const newYearConfig: AcademicYearConfig = {
      id: `year-${Date.now()}`,
      year: newYearName.trim(),
      isActive: false
    };

    onAddAcademicYear(newYearConfig);
    setNewYearName('');
    setSuccessYear(true);
    setTimeout(() => setSuccessYear(false), 3000);
  };

  const handleExportClick = () => {
    try {
      const dataStr = onExportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_teaching_research_data_${selectedYear}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Lỗi xuất dữ liệu: ' + e);
    }
  };

  const handleImportSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) {
      setImportStatus('error');
      return;
    }

    const success = onImportData(importText);
    if (success) {
      setImportStatus('success');
      setImportText('');
      setTimeout(() => setImportStatus('idle'), 3000);
    } else {
      setImportStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module 1: Norm setting (Cấu hình định mức giờ giảng & NCKH) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="mb-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
              <Settings className="w-4.5 h-4.5 text-blue-500" />
              Thông tin quy định định mức giảng dạy & NCKH
            </h3>
            <p className="text-[13px] text-slate-400 mt-0.5 font-medium">
              Quy định về thời gian nghĩa vụ chi tiết và định mức tối thiểu cần hoàn thành trong một năm học của giảng viên.
            </p>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-[13px] text-blue-700 leading-relaxed font-semibold">
            <span className="font-extrabold uppercase mr-1 text-blue-800">📌 Quy định định mức NCKH:</span>
            Định mức giờ nghiên cứu khoa học là <strong className="font-extrabold font-mono text-[13px] text-blue-900 bg-blue-100/60 px-1 rounded">600</strong> giờ hành chính, không giảm trừ đối với người giữ chức, nhưng vẫn giảm trừ đối với người không thực hiện full năm (ví dụ đi học, nghỉ đẻ, công tác, tính theo % giảm tương ứng).
          </div>

          {/* Định mức theo Chức vụ & Đảng (280 giờ chuẩn) */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[13px] font-bold text-slate-705 mb-1.5 uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-500" />
              Định mức Giảng dạy theo Chức vụ & Kiêm nhiệm Đảng (Chuẩn 280 giờ)
            </h4>
            <p className="text-[13px] text-slate-400 mb-3 leading-relaxed">
              Thời gian nghĩa vụ chi tiết được tính tự động dựa trên vị trí chính quyền và vai trò kiêm nhiệm Đảng của giảng viên theo cấu hình định mức khoa.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-[13px] bg-slate-50/20">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.1 px-4 font-bold text-[13px] uppercase tracking-wider py-2">Chức vụ phụ trách</th>
                    <th className="py-2.1 px-4 font-bold text-[13px] uppercase tracking-wider py-2">Kiêm nhiệm Đảng</th>
                    <th className="py-2.1 px-4 text-center font-bold text-[13px] uppercase tracking-wider py-2">Tỷ lệ định mức</th>
                    <th className="py-2.1 px-4 text-right font-bold text-[13px] uppercase tracking-wider py-2">Định mức quy đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {POSITION_NORMS.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-4 font-bold text-slate-700">{item.pos}</td>
                      <td className="py-2 px-4 text-slate-500 font-medium">{item.party || 'Không kiêm nhiệm'}</td>
                      <td className="py-2 px-4 text-center text-blue-600 font-bold font-mono">{item.percent}%</td>
                      <td className="py-2 px-4 text-right text-slate-800 font-extrabold font-mono">{item.hours} tiết/năm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Module 2: Year Configuration (Quản lý chu kỳ Năm học) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
              <Calendar className="w-4.5 h-4.5 text-blue-500" />
              Chu kỳ Năm học tác vụ
            </h3>
            <p className="text-[13px] text-slate-400 mt-0.5 font-medium">
              Thiết lập chu kỳ năm học làm việc hiện tại của toàn văn phòng khoa.
            </p>
          </div>

          {successYear && (
            <div className="bg-emerald-50 text-emerald-700 text-[13px] p-2.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Năm học mới đã được tạo thành công!
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[13px] font-bold text-slate-500 block mb-1">
                Năm học đang kích hoạt hoạt động
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => onSetAcademicYear(e.target.value)}
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-bold text-blue-600 flex-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {academicYears.map(y => (
                    <option key={y.id} value={y.year}>{y.year} {y.year === selectedYear ? '(Hiện tại)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleCreateYear} className="pt-3 border-t border-slate-100">
              <label className="text-[13px] font-bold text-slate-500 block mb-1">
                Tạo chu kỳ Năm học mới
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: 2025-2026"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-medium flex-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-[13px] px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Module 3: Import / Export & Reset database block */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
            <Server className="w-4.5 h-4.5 text-blue-500" />
            Cơ sở dữ liệu & Sao lưu
          </h3>
          <p className="text-[13px] text-slate-400 mt-0.5 font-medium">
            Xem xét xuất dữ liệu ra tệp tin JSON hoặc nhập lại dữ liệu lưu chuẩn từ tệp dự phòng khoa bộ môn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Export / Reset triggers list */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <span className="text-[13px] font-bold text-slate-400 uppercase block">Thao tác nhanh</span>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleExportClick}
                  className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[13px] px-4 py-2.5 rounded-lg cursor-pointer border border-blue-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Xuất dữ liệu dự phòng (.JSON)
                </button>
                
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[13px] px-4 py-2.5 rounded-lg cursor-pointer border border-rose-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Khôi phục dữ liệu mẫu ban đầu
                </button>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 text-[13px] text-amber-900 leading-normal">
              <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Nhắc nhở chỉ số:</span>
                <p>
                  Toàn bộ cập nhật chỉ số của hệ thống sẽ được lưu trên trình duyệt của bạn (Local Storage). Khi bạn xuất tệp JSON, các danh tiếng giảng viên, bản ghi đăng ký tiết giảng và bài báo nghiên cứu sẽ được lưu trữ an toàn để bạn nhập lại trên bất kỳ nền tảng nào.
                </p>
              </div>
            </div>
          </div>

          {/* Import JSON Form */}
          <form onSubmit={handleImportSubmit} className="space-y-3">
            <label className="text-[13px] font-bold text-slate-400 uppercase block">
              Nhập mã JSON phục hồi dữ liệu
            </label>
            <textarea
              placeholder="Dán nội dung JSON phục hồi tại đây..."
              rows={4}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="text-[13px] w-full font-mono border border-slate-200 rounded-lg p-3 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[13px] px-4 py-2.5 rounded-lg cursor-pointer transition-colors w-full sm:w-auto"
            >
              <Upload className="w-4 h-4" />
              Khôi phục từ JSON dán
            </button>

            {importStatus === 'success' && (
              <p className="text-[13px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" /> Nhập dữ liệu và phục hồi hoàn toàn thành công!
              </p>
            )}
            {importStatus === 'error' && (
              <p className="text-[13px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                <Trash2 className="w-4 h-4" /> Mã JSON không hợp lệ. Vui lòng kiểm tra lại cấu trúc tệp tin.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Custom Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-md w-full p-5 overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600 shrink-0">
                <RotateCcw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-[13px] font-extrabold text-slate-800">Đặt lại cơ sở dữ liệu?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn đặt lại toàn bộ cơ sở dữ liệu về mẫu mặc định ban đầu của hệ thống?
                </p>
                <p className="text-[13px] text-rose-650 bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-semibold leading-relaxed">
                  ⚠️ Cảnh báo: Toàn bộ giảng viên tự thêm mới, giờ giảng đã đăng ký, bài báo hay công trình nghiên cứu khoa học bạn đã thay đổi sẽ bị xóa hoàn toàn.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-lg cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onResetToDefault();
                  setShowResetConfirm(false);
                  setShowResetSuccess(true);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] rounded-lg cursor-pointer shadow-xs transition-colors"
              >
                Xác nhận Đặt lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reset Success Modal */}
      {showResetSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-md w-full p-5 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="text-[13px] font-extrabold text-slate-800">Phục hồi thành công!</h3>
              <p className="text-[13px] text-slate-500">
                Đã khôi phục hoàn chỉnh cấu hình và hệ dữ liệu mặc định ban đầu thành công.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setShowResetSuccess(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[13px] rounded-lg cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

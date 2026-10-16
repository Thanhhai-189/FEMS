import { useState, useMemo } from 'react';
import { AuditLog } from '../types';
import { 
  Search, FileCode2, Clock, UserCheck, Shield, Trash2, Edit2, Plus, 
  Filter, X, ChevronDown
} from 'lucide-react';

interface AuditLogTabProps {
  auditLogs: AuditLog[];
}

const COLLECTION_LABELS: Record<string, string> = {
  teachers: 'Giảng viên',
  teaching_logs: 'Giờ giảng dạy',
  research_logs: 'NCKH',
  work_histories: 'Quá trình công tác',
  rank_norms: 'Định mức',
  academic_years: 'Năm học',
};
const ACTION_ICONS: Record<string, JSX.Element> = {
  CREATE: <Plus className="w-3 h-3 text-emerald-500" />,
  UPDATE: <Edit2 className="w-3 h-3 text-blue-500" />,
  DELETE: <Trash2 className="w-3 h-3 text-rose-500" />,
};
const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AuditLogTab({ auditLogs }: AuditLogTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch = 
        log.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.performedByName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      const matchCollection = collectionFilter === 'all' || log.collection === collectionFilter;
      return matchSearch && matchAction && matchCollection;
    });
  }, [auditLogs, searchQuery, actionFilter, collectionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">Nhật ký hệ thống</h2>
            <p className="text-xs text-slate-400 font-medium">
              Ghi lại toàn bộ thao tác thay đổi dữ liệu của người dùng
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo nội dung, người thực hiện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-medium"
        >
          <option value="all">Mọi thao tác</option>
          <option value="CREATE">Thêm mới</option>
          <option value="UPDATE">Cập nhật</option>
          <option value="DELETE">Xóa</option>
        </select>
        <select
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-medium"
        >
          <option value="all">Mọi phân hệ</option>
          {Object.entries(COLLECTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-bold text-[10px] block uppercase">Tổng số bản ghi</span>
          <span className="text-xl font-extrabold text-slate-800 font-mono mt-0.5 block">{auditLogs.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/10">
          <span className="text-emerald-600 font-bold text-[10px] block uppercase">Thêm mới</span>
          <span className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5 block">{auditLogs.filter(l => l.action === 'CREATE').length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/10">
          <span className="text-blue-600 font-bold text-[10px] block uppercase">Cập nhật</span>
          <span className="text-lg font-extrabold text-blue-700 font-mono mt-0.5 block">{auditLogs.filter(l => l.action === 'UPDATE').length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-100 bg-rose-50/10">
          <span className="text-rose-600 font-bold text-[10px] block uppercase">Xóa</span>
          <span className="text-lg font-extrabold text-rose-700 font-mono mt-0.5 block">{auditLogs.filter(l => l.action === 'DELETE').length}</span>
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileCode2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Chưa có nhật ký nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Thao tác</th>
                  <th className="px-4 py-3">Phân hệ</th>
                  <th className="px-4 py-3">Nội dung</th>
                  <th className="px-4 py-3">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono font-bold text-slate-600">
                          {new Date(log.timestamp).toLocaleString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-bold text-xs px-1.5 py-0.5 rounded border ${ACTION_COLORS[log.action] || 'bg-slate-50 text-slate-600'}`}>
                        {ACTION_ICONS[log.action]}
                        {log.action === 'CREATE' ? 'Thêm' : log.action === 'UPDATE' ? 'Sửa' : log.action === 'DELETE' ? 'Xóa' : log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-700">
                        {COLLECTION_LABELS[log.collection] || log.collection}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-700 font-medium line-clamp-2">{log.summary}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-bold">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        {log.performedByName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
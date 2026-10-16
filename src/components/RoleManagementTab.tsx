import { useState, useMemo } from 'react';
import { Teacher, UserRole } from '../types';
import { getRankString } from '../data';
import { Shield, Search, Users, Save, Edit2, Check, X, Settings } from 'lucide-react';

interface RoleManagementTabProps {
  teachers: Teacher[];
  userRoles: UserRole[];
  onSaveUserRole: (role: UserRole) => void;
  onDeleteUserRole: (teacherId: string) => void;
  currentUserRole?: 'admin' | 'teacher';
  currentTeacherId?: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:              { label: 'Admin (Toàn quyền)', color: 'bg-red-100 text-red-700 border-red-200' },
  manager:            { label: 'Trưởng khoa', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  headOfDepartment:   { label: 'Trưởng bộ môn', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  teacher:            { label: 'Giảng viên', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  viewer:             { label: 'Xem (Viewer)', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

// Tự động phân quyền dựa trên chức vụ
function getDefaultRoleForPosition(position: string, email: string): string {
  const pos = position.toLowerCase();
  if (email === 'thanhhaihvkt@gmail.com') return 'admin';
  if (pos.includes('chủ nhiệm khoa')) return 'manager';
  if (pos.includes('phó chủ nhiệm khoa')) return 'manager';
  if (pos.includes('trưởng bộ môn')) return 'headOfDepartment';
  if (pos === 'nhân viên' || pos.includes('nhân viên')) return 'viewer';
  return 'teacher'; // Mặc định: giảng viên thường
}

function getDefaultPermissionsForRole(role: string, department: string): Partial<UserRole> {
  const base = PRESETS[role] || PRESETS.viewer;
  // Trưởng bộ môn chỉ quản lý GV trong khoa mình
  if (role === 'headOfDepartment') {
    return { ...base, canManageTeachers: true };
  }
  return base;
}

const PRESETS: Record<string, Partial<UserRole>> = {
  admin: {
    canManageTeachers: true, canManageSettings: true,
    canViewTeachingHours: true, canManageTeachingHours: true,
    canViewResearch: true, canManageResearch: true, canApproveResearch: true,
    canViewAuditLog: true, canManageWorkHistory: true,
  },
  manager: {
    canManageTeachers: true, canManageSettings: false,
    canViewTeachingHours: true, canManageTeachingHours: true,
    canViewResearch: true, canManageResearch: true, canApproveResearch: true,
    canViewAuditLog: true, canManageWorkHistory: true,
  },
  headOfDepartment: {
    canManageTeachers: true, canManageSettings: false,
    canViewTeachingHours: true, canManageTeachingHours: true,
    canViewResearch: true, canManageResearch: true, canApproveResearch: true,
    canViewAuditLog: true, canManageWorkHistory: true,
  },
  teacher: {
    canManageTeachers: false, canManageSettings: false,
    canViewTeachingHours: true, canManageTeachingHours: false,
    canViewResearch: true, canManageResearch: false, canApproveResearch: false,
    canViewAuditLog: false, canManageWorkHistory: false,
  },
  viewer: {
    canManageTeachers: false, canManageSettings: false,
    canViewTeachingHours: true, canManageTeachingHours: false,
    canViewResearch: true, canManageResearch: false, canApproveResearch: false,
    canViewAuditLog: false, canManageWorkHistory: false,
  },
};

export default function RoleManagementTab({
  teachers, userRoles, onSaveUserRole, onDeleteUserRole, currentUserRole, currentTeacherId
}: RoleManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('viewer');
  const [permissions, setPermissions] = useState<Partial<UserRole>>(PRESETS.viewer);

  const allUserRoles = useMemo(() => {
    const rolesMap = new Map<string, UserRole>();
    userRoles.forEach(r => rolesMap.set(r.teacherId, r));
    
    return teachers.map(t => {
      const existing = rolesMap.get(t.id);
      if (existing) return { teacher: t, role: existing, isDefault: false };
      
      // Tự động phân quyền dựa trên chức vụ nếu chưa có role
      const defaultRole = getDefaultRoleForPosition(t.position, t.email);
      const defaultPerms = getDefaultPermissionsForRole(defaultRole, t.department);
      const autoRole: UserRole = {
        teacherId: t.id,
        email: t.email,
        name: t.name,
        role: defaultRole as UserRole['role'],
        canManageTeachers: defaultPerms.canManageTeachers ?? false,
        canManageSettings: defaultPerms.canManageSettings ?? false,
        canViewTeachingHours: defaultPerms.canViewTeachingHours ?? false,
        canManageTeachingHours: defaultPerms.canManageTeachingHours ?? false,
        canViewResearch: defaultPerms.canViewResearch ?? false,
        canManageResearch: defaultPerms.canManageResearch ?? false,
        canApproveResearch: defaultPerms.canApproveResearch ?? false,
        canViewAuditLog: defaultPerms.canViewAuditLog ?? false,
        canManageWorkHistory: defaultPerms.canManageWorkHistory ?? false,
      };
      return { teacher: t, role: autoRole, isDefault: true };
    });
  }, [teachers, userRoles]);

  const filteredList = useMemo(() => {
    return allUserRoles.filter(item =>
      item.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allUserRoles, searchQuery]);

  const startEdit = (item: { teacher: Teacher; role: UserRole | null }) => {
    setEditingId(item.teacher.id);
    setSelectedRole(item.role?.role || 'viewer');
    setPermissions(item.role || PRESETS.viewer);
  };

  const handleSaveRole = (teacher: Teacher) => {
    const roleData: UserRole = {
      teacherId: teacher.id,
      email: teacher.email,
      name: teacher.name,
      role: selectedRole as UserRole['role'],
      canManageTeachers: permissions.canManageTeachers ?? false,
      canManageSettings: permissions.canManageSettings ?? false,
      canViewTeachingHours: permissions.canViewTeachingHours ?? false,
      canManageTeachingHours: permissions.canManageTeachingHours ?? false,
      canViewResearch: permissions.canViewResearch ?? false,
      canManageResearch: permissions.canManageResearch ?? false,
      canApproveResearch: permissions.canApproveResearch ?? false,
      canViewAuditLog: permissions.canViewAuditLog ?? false,
      canManageWorkHistory: permissions.canManageWorkHistory ?? false,
    };
    onSaveUserRole(roleData);
    setEditingId(null);
  };

  const applyPreset = (roleName: string) => {
    setSelectedRole(roleName);
    setPermissions(PRESETS[roleName] || PRESETS.viewer);
  };

  const permLabels: { key: keyof UserRole; label: string; desc: string }[] = [
    { key: 'canManageTeachers', label: 'Quản lý GV', desc: 'Thêm/sửa/xóa hồ sơ' },
    { key: 'canManageSettings', label: 'Cài đặt', desc: 'Định mức, năm học' },
    { key: 'canViewTeachingHours', label: 'Xem giảng dạy', desc: 'Xem giờ giảng dạy' },
    { key: 'canManageTeachingHours', label: 'QL giảng dạy', desc: 'Thêm/sửa/xóa giờ' },
    { key: 'canViewResearch', label: 'Xem NCKH', desc: 'Xem minh chứng' },
    { key: 'canManageResearch', label: 'QL NCKH', desc: 'Thêm/sửa/xóa NCKH' },
    { key: 'canApproveResearch', label: 'Phê duyệt NCKH', desc: 'Duyệt/Từ chối' },
    { key: 'canViewAuditLog', label: 'Xem nhật ký', desc: 'Nhật ký hệ thống' },
    { key: 'canManageWorkHistory', label: 'QL công tác', desc: 'Quá trình CT' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">Phân quyền người dùng</h2>
            <p className="text-xs text-slate-400 font-medium">Điều chỉnh quyền truy cập và thao tác cho từng giảng viên</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên, email giảng viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Giảng viên</th>
                <th className="px-4 py-3">Vai trò hiện tại</th>
                <th className="px-4 py-3 text-center">Phân quyền</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map(({ teacher, role }) => {
                const isEditing = editingId === teacher.id;
                const roleInfo = role?.role ? ROLE_LABELS[role.role] : ROLE_LABELS.viewer;
                return (
                  <tr key={teacher.id} className={`hover:bg-slate-50/60 transition-colors ${isEditing ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-slate-800">{teacher.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{getRankString(teacher.rank)}</span>
                      <span className="text-xs text-slate-500 block">{teacher.department}</span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          {Object.entries(PRESETS).map(([name, preset]) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => applyPreset(name)}
                              className={`text-[10px] font-bold px-2 py-1 rounded border cursor-pointer ${
                                selectedRole === name ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {ROLE_LABELS[name].label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${roleInfo?.color || 'bg-slate-100 text-slate-600'}`}>
                          {roleInfo?.label || 'Chưa phân quyền'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-1.5">
                          {permLabels.map(({ key, label }) => (
                            <label key={key} className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!permissions[key]}
                                onChange={(e) => setPermissions(p => ({ ...p, [key]: e.target.checked }))}
                                className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-[10px] font-semibold text-slate-600">{label}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">{role ? 'Đã thiết lập' : 'Mặc định (Viewer)'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveRole(teacher)}
                            className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
                            title="Lưu"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit({ teacher, role })}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 cursor-pointer"
                            title="Chỉnh sửa quyền"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {role && (
                            <button
                              onClick={() => onDeleteUserRole(teacher.id)}
                              className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 cursor-pointer"
                              title="Xóa quyền (trở về mặc định)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
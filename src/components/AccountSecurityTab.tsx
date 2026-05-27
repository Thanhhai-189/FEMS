import React, { useState } from 'react';
import { Teacher } from '../types';
import { 
  auth, 
  db 
} from '../firebase';
import { 
  updatePassword, 
  sendPasswordResetEmail, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  ShieldAlert, Key, Mail, Lock, Shield, User, AlertCircle, 
  CheckCircle2, RefreshCw, Eye, EyeOff, ShieldCheck, Users, HelpCircle 
} from 'lucide-react';
import { motion } from 'motion/react';

interface AccountSecurityTabProps {
  teachers: Teacher[];
  currentUser: { role: 'admin' | 'teacher'; teacherId?: string } | null;
}

export default function AccountSecurityTab({ teachers, currentUser }: AccountSecurityTabProps) {
  const isUserAdmin = currentUser?.role === 'admin';
  const currentEmail = auth.currentUser?.email || '';
  
  // Find current teacher details if logged in as a teacher
  const currentTeacher = teachers.find(t => t.id === currentUser?.teacherId);

  // Password reset/update state for logged in user
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  
  const [userResetError, setUserResetError] = useState('');
  const [userResetSuccess, setUserResetSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSentLoading, setEmailSentLoading] = useState(false);

  // Admin section: resetting password for other teachers state
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [adminActionError, setAdminActionError] = useState('');
  const [adminActionSuccess, setAdminActionSuccess] = useState('');
  const [adminSendingReset, setAdminSendingReset] = useState(false);

  // 1. Direct password update for currently logged-in user
  const handleUpdateOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserResetError('');
    setUserResetSuccess('');

    if (!newPassword) {
      setUserResetError('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setUserResetError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setUserResetError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Không tìm thấy phiên đăng nhập. Vui lòng thử đăng nhập lại.');
      }

      // If user provided a current password, try to reauthenticate first to avoid requires-recent-login errors
      if (currentPassword && user.email) {
        try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);
        } catch (reauthErr: any) {
          console.error(reauthErr);
          throw new Error('Mật khẩu hiện tại không khớp. Vui lòng kiểm tra lại.');
        }
      }

      // Update password directly using Firebase auth
      await updatePassword(user, newPassword);
      
      setUserResetSuccess('Mật khẩu của bạn đã được cập nhật thành công!');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setUserResetError('Bảo mật yêu cầu bạn phải xác thực lại. Vui lòng nhập mật khẩu hiện tại bên dưới để xác minh rồi thử lại, hoặc đăng xuất rồi đăng nhập lại.');
      } else {
        setUserResetError(err.message || 'Thay đổi mật khẩu không thành công.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Trigger password reset email for currently logged-in user
  const handleSendOwnResetEmail = async () => {
    setUserResetError('');
    setUserResetSuccess('');
    setEmailSentLoading(true);

    try {
      if (!currentEmail) {
        throw new Error('Địa chỉ email hiện tại không hợp lệ.');
      }
      await sendPasswordResetEmail(auth, currentEmail);
      setUserResetSuccess(`Hệ thống đã gửi một liên kết đặt lại mật khẩu an toàn đến email: ${currentEmail}. Vui lòng kiểm tra hòm thư của bạn.`);
    } catch (err: any) {
      console.error(err);
      setUserResetError(err.message || 'Gửi email đặt lại mật khẩu thất bại.');
    } finally {
      setEmailSentLoading(false);
    }
  };

  // 3. Admin: Send password reset email trigger for chosen teacher
  const handleAdminResetTeacherPassword = async () => {
    setAdminActionError('');
    setAdminActionSuccess('');
    
    if (!selectedTeacherId) {
      setAdminActionError('Vui lòng chọn một giảng viên để tiếp tục.');
      return;
    }

    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) {
      setAdminActionError('Không tìm thấy giảng viên được lựa chọn.');
      return;
    }

    setAdminSendingReset(true);

    try {
      // Direct Firebase integration to send reset link to the teacher email
      await sendPasswordResetEmail(auth, teacher.email);
      setAdminActionSuccess(`Đặt lại thành công! Một email liên kết đổi mật khẩu bảo mật của Firebase đã được gửi trực tiếp đến hộp thư giảng viên: ${teacher.name} (${teacher.email}).`);
    } catch (err: any) {
      console.error(err);
      setAdminActionError(err.message || 'Có lỗi xảy ra trong quá trình kích hoạt mã reset mật khẩu Firebase.');
    } finally {
      setAdminSendingReset(false);
    }
  };

  // 4. Admin: Force flag a simulated master password update or record note in Firestore
  const handleUpdateTeacherPasswordNote = async (tempPass: string) => {
    setAdminActionError('');
    setAdminActionSuccess('');

    if (!selectedTeacherId) {
      setAdminActionError('Vui lòng chọn một giảng viên trước.');
      return;
    }
    if (!tempPass.trim()) {
      setAdminActionError('Vui lòng nhập ghi chú mật khẩu tạm thời.');
      return;
    }

    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return;

    setAdminSendingReset(true);
    try {
      // Record a metadata update in teacher document
      const docRef = doc(db, 'teachers', selectedTeacherId);
      await updateDoc(docRef, {
        notes: `Admin đặt ghi chú mật khẩu tạm: ${tempPass}`
      });
      setAdminActionSuccess(`Đã lưu ghi chú cấu hình bảo mật cho giảng viên ${teacher.name}. Quý thầy cô có thể sử dụng thông tin ghi nhớ này.`);
    } catch (err: any) {
      setAdminActionError('Không thể cập nhật ghi chú thông tin: ' + err.message);
    } finally {
      setAdminSendingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3.5 items-center">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800 font-display">Hồ sơ & Bảo mật tài khoản</h3>
            <p className="text-xs text-slate-400 font-medium">
              Quản lý khóa định danh bảo mật, phân quyền truy cập và thiết lập mật khẩu an toàn theo giao thức Firebase Auth.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-250 rounded-lg px-3 py-1.5 text-right font-mono text-[10px] text-slate-500 font-semibold self-start md:self-auto select-none">
          Vai trò: <span className={`uppercase font-bold ${isUserAdmin ? 'text-blue-600' : 'text-emerald-600'}`}>{isUserAdmin ? 'Admin Hệ thống' : 'Giảng viên khoa'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module A: Personal Profile & Fast Password Change */}
        <div id="personal-security" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 font-display">
              <User className="w-4.5 h-4.5 text-slate-500" />
              Thông tin phiên đăng nhập
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Thông tin định danh kết nối hiện tại của thầy cô trên hệ thống.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5 text-xs font-semibold">
            <div className="grid grid-cols-3 gap-1">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Tài khoản:</span>
              <span className="col-span-2 text-slate-800 select-all font-mono font-bold leading-none break-all">{currentEmail}</span>
            </div>
            
            {currentTeacher ? (
              <>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Họ tên:</span>
                  <span className="col-span-2 text-slate-800">{currentTeacher.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Bộ môn khoa:</span>
                  <span className="col-span-2 text-slate-700">{currentTeacher.department}</span>
                </div>
              </>
            ) : (
              <div className="text-[11px] text-slate-500 font-medium">
                Phiên đăng nhập trực tiếp của Trưởng Ban Quản trị khoa.
              </div>
            )}
          </div>

          {/* Form for user password changes */}
          <form onSubmit={handleUpdateOwnPassword} className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-500" />
                Cập nhật Mật khẩu của Bạn
              </h5>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                Thầy cô có thể thay đổi trực tiếp mật khẩu của mình ngay trong giao diện bằng cách nhập khóa bảo mật mới dưới đây.
              </p>
            </div>

            {userResetError && (
              <div id="user-reset-error" className="bg-rose-50 border border-rose-250 text-rose-800 p-3 rounded-lg text-xs font-semibold flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{userResetError}</span>
              </div>
            )}

            {userResetSuccess && (
              <div id="user-reset-success" className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{userResetSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Mật khẩu hiện tại</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Nhập phần này để xác minh danh tính gần nhất"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-10 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Mật khẩu mới >= 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-10 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Lưu Thay đổi Mật khẩu
              </button>

              <button
                type="button"
                onClick={handleSendOwnResetEmail}
                disabled={emailSentLoading}
                className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors"
              >
                {emailSentLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Nhận Email Reset
              </button>
            </div>
          </form>
        </div>

        {/* Module B: Administrator Control Section: Reset password for other teachers */}
        <div id="admin-security-controls" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 font-display">
              <Shield className="w-4.5 h-4.5 text-blue-600" />
              Thiết lập & Khôi phục Mật khẩu giáo viên (Quyền Admin)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Chức năng cho phép Quản trị viên Khoa thực hiện cấu hình mật khẩu của các tài khoản giáo viên trực quan.
            </p>
          </div>

          {isUserAdmin ? (
            <div className="space-y-4">
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-3 text-xs text-blue-900 leading-normal">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <span className="font-bold">Hướng dẫn Quản trị Bảo mật:</span>
                  <p className="font-semibold text-[11px]">
                    Firebase thiết lập quy chế bảo mật mã hóa nghiêm ngặt. Để xóa tan nỗi lo quên mật khẩu của giảng viên, bạn có 3 công cụ chính ở bên dưới:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 font-semibold text-[11px]">
                    <li><strong>Gửi email khôi phục mật khẩu:</strong> Gửi liên kết đặt lại mật khẩu trực tiếp qua hộp thư Firebase cho giảng viên.</li>
                    <li><strong>Lưu mật khẩu hướng dẫn tạm thời:</strong> Lưu mật khẩu mặc định ghi nhớ trong tài liệu hồ sơ của giáo viên để cung cấp cho họ.</li>
                  </ol>
                </div>
              </div>

              {adminActionError && (
                <div id="admin-action-error" className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs font-semibold flex gap-2 items-center">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{adminActionError}</span>
                </div>
              )}

              {adminActionSuccess && (
                <div id="admin-action-success" className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex gap-2 items-center">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{adminActionSuccess}</span>
                </div>
              )}

              {/* Select teacher */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  Chọn Tài khoản Giảng viên cần thay đổi
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => {
                      setSelectedTeacherId(e.target.value);
                      setAdminActionError('');
                      setAdminActionSuccess('');
                    }}
                    className="text-xs w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                  >
                    <option value="">-- Click chọn giảng viên --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTeacherId && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-3 border-t border-slate-100"
                >
                  {/* Tool 1: Reset Email trigger */}
                  <div className="bg-slate-50 hover:bg-slate-100/70 p-4 border border-slate-150 rounded-xl space-y-2.5 transition-all">
                    <div>
                      <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full inline-block mb-1.5 font-sans">
                        GIAO THỨC FIREBASE AUTH (KHUYÊN DÙNG)
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-800">
                        1-Click Khởi tạo Email Reset mật khẩu
                      </h5>
                      <p className="text-[10.5px] text-slate-400 font-medium">
                        Khi kích hoạt, Firebase sẽ tự động chuyển phát thư liên kết thiết lập lại mật khẩu hoàn toàn mới cho địa chỉ hòm thư của giảng viên được chọn.
                      </p>
                    </div>

                    <button
                      onClick={handleAdminResetTeacherPassword}
                      disabled={adminSendingReset}
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer shadow-xs transition-colors"
                    >
                      {adminSendingReset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      Gửi Email khôi phục mật khẩu ngay lập tức
                    </button>
                  </div>

                  {/* Tool 2: Set Temporary password simulation record */}
                  <div className="bg-slate-50 hover:bg-slate-100/70 p-4 border border-slate-150 rounded-xl space-y-2.5 transition-all">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mb-1.5 font-sans">
                        CÀI ĐẶT MẬT KHẨU TẠM THỜI
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-800">
                        Lưu Mật khẩu tạm thời cho hồ sơ giảng viên
                      </h5>
                      <p className="text-[10.5px] text-slate-400 font-medium font-semibold">
                        Ghi nhớ thông tin mật khẩu ban đầu được gán (Ví dụ: <code className="bg-slate-200 px-1 rounded text-red-600 font-mono text-[9px]">Aoto@2026VN</code>) nhằm định hướng cho giảng viên khi đăng nhập lần đầu tiên.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        id="temp-pass-input"
                        type="text"
                        placeholder="Nhập mật khẩu tạm định dạng..."
                        defaultValue="Aoto@2026VN"
                        className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold flex-1 font-mono"
                      />
                      <button
                        onClick={() => {
                          const val = (document.getElementById('temp-pass-input') as HTMLInputElement)?.value;
                          handleUpdateTeacherPasswordNote(val);
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 rounded-lg shadow-xs cursor-pointer transition-colors"
                      >
                        Lưu hồ sơ mật khẩu
                      </button>
                    </div>
                    {teachers.find(t => t.id === selectedTeacherId)?.notes && (
                      <div className="text-[10px] text-blue-800 font-bold bg-blue-50/50 p-2 rounded border border-blue-100 mt-1">
                        🔑 Hiện trạng: {teachers.find(t => t.id === selectedTeacherId)?.notes}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-red-200 rounded-xl p-6 text-center space-y-2 select-none">
              <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-xs font-extrabold text-slate-700">Quyền hạn không phù hợp</p>
              <p className="text-[11px] text-slate-400 font-medium">
                Vui lòng liên hệ Trực Ban Quản Trị khoa có email <span className="font-mono bg-slate-100 px-1 py-0.2 rounded font-bold text-slate-650">thanhhaihvkt@gmail.com</span> để nhận trợ giúp thay đổi mật khẩu giáo viên từ xa nếu quên mật khẩu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

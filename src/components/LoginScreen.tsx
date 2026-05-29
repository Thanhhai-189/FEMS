import React, { useState } from 'react';
import { Teacher } from '../types';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, loginWithGoogle } from '../firebase';
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, Phone, FileText, HelpCircle, ShieldCheck, Download
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  teachers: Teacher[];
  onLogin: (role: 'admin' | 'teacher', teacherId?: string) => void;
}

// Highly stylized logo image for Vietnam Military/National insignia
const VietnamMilitaryEmblem = () => (
  <img 
    src="https://i.ibb.co/TBgCM3fw/logo-vhp-2.png" 
    alt="Logo Sĩ Quan Kỹ Thuật Quân Sự" 
    className="w-24 h-24 object-contain mx-auto md:mx-0 drop-shadow-2xl select-none" 
    referrerPolicy="no-referrer"
  />
);

export default function LoginScreen({ teachers, onLogin }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification state logic
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified && email !== 'thanhhaihvkt@gmail.com') {
        setNeedsVerification(true);
        setVerifyMessage(`Tài khoản của bạn chưa được xác thực email. Vui lòng kiểm tra hộp thư: ${email}`);
        setLoading(false);
        return;
      }

      if (email === 'thanhhaihvkt@gmail.com') {
        onLogin('admin', user.uid);
      } else {
        onLogin('teacher', user.uid);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Địa chỉ email hoặc mật khẩu không chính xác.');
      } else {
        setError('Có lỗi xảy ra khi xác thực thông tin. Vui lòng đăng nhập lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user.email === 'thanhhaihvkt@gmail.com') {
        onLogin('admin', user.uid);
      } else {
        onLogin('teacher', user.uid);
      }
    } catch (err: any) {
      console.error(err);
      setError('Đăng nhập bằng tài khoản Google không thành công.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckReloadVerification = async () => {
    setLoading(true);
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        setNeedsVerification(false);
        onLogin('teacher', auth.currentUser.uid);
      } else {
        setError('Bạn vẫn chưa kích hoạt tài khoản qua email liên kết.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-[#075685] flex items-center justify-center p-4 sm:p-6 relative font-sans text-white">
        <div className="absolute top-0 left-0 w-96 h-96 bg-sky-600 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-20 translate-x-1/2 translate-y-1/2 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#09476e]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10 p-6 sm:p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-white/5 text-yellow-300 rounded-full flex items-center justify-center mx-auto border border-yellow-500/30">
            <Mail className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Xác thực địa chỉ Email</h2>
            <p className="text-[13px] text-slate-300 leading-relaxed">
              Hệ thống yêu cầu xác nhận email để bảo mật thông tin hồ sơ của giảng viên.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 text-[13px] text-sky-200 leading-relaxed text-left">
            {verifyMessage}
          </div>

          {error && (
            <div className="bg-rose-950/50 border border-rose-500/20 text-rose-300 p-3 rounded-lg text-[13px] font-medium flex gap-2 items-center text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              id="btn_confirm_verified"
              onClick={handleCheckReloadVerification}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:bg-sky-800 text-white font-bold text-[13px] py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-sky-500/10 transition-colors"
            >
              Tôi đã xác nhận
            </button>
            <button
              id="btn_back_to_login"
              onClick={() => { setNeedsVerification(false); setError(''); }}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/25 disabled:bg-white/5 text-slate-100 font-bold text-[13px] py-2.5 px-4 rounded-xl cursor-pointer border border-white/10 transition-colors"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#075685] flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden font-sans text-white">
      {/* Dynamic ambient lights to enrich background */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sky-500 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl opacity-15 translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
        
        {/* LEFT COLUMN: BRAND & INFORMATION (Visible only on lg, or simplified on mobile) */}
        <div className="lg:col-span-7 flex flex-col space-y-6 md:space-y-8 select-none">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
            <VietnamMilitaryEmblem />
            <div className="space-y-1.5 self-center">
              <h1 className="font-extrabold text-[15px] md:text-[17px] tracking-wider uppercase text-sky-200">
                Khoa Ô Tô
              </h1>
              <h2 className="font-semibold text-slate-300 text-xs md:text-[13px] uppercase tracking-wide">
                Trường Sĩ quan Kỹ thuật Quân sự
              </h2>
              <div className="h-[2px] w-20 bg-yellow-400 mx-auto md:mx-0 mt-2" />
            </div>
          </div>

          <div className="text-center md:text-left space-y-2.5">
            <h3 className="font-black text-xl md:text-3xl leading-tight text-white tracking-tight uppercase font-display drop-shadow-md">
              Hệ thống quản lý đào tạo <br className="hidden md:inline" /> & Nghiên cứu khoa học
            </h3>
          </div>

          {/* Dotted border separator */}
          <div className="border-t border-dashed border-white/20 pt-6 space-y-5 hidden md:block">
            {/* Feature 1 */}
            <div className="flex items-start gap-3 text-slate-250">
              <div className="w-5 h-5 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-[13px]">
                <p className="font-bold text-slate-200">Thống kê số liệu giờ giảng & NCKH</p>
                <p className="text-slate-400 text-xs mt-0.5">Tổng hợp định mức tối thiểu, miễn giảm, và số giờ vượt cấp theo từng năm học.</p>
              </div>
            </div>

            {/* Support Box */}
            <div className="flex items-start gap-3 text-slate-250">
              <div className="w-5 h-5 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="text-[13px]">
                <p className="font-bold text-slate-200">Hỗ trợ kỹ thuật</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Email liên hệ: <span className="text-sky-300 font-semibold font-mono">thanhhaihvkt@gmail.com</span> <br />
                </p>
              </div>
            </div>

            {/* Guide Box */}
            <div className="flex items-start gap-3 text-slate-250">
              <div className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="text-[13px] space-y-1">
                <p className="font-bold text-slate-200">Tài liệu & Hướng dẫn sử dụng</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sky-350 text-xs">
                  <a href="#" className="hover:text-yellow-400 inline-flex items-center gap-1 transition-colors font-medium">
                    <Download className="w-3 h-3 text-slate-400" /> Tài liệu hướng dẫn sử dụng hệ thống
                  </a>
                  <a href="#" className="hover:text-yellow-400 inline-flex items-center gap-1 transition-colors font-medium">
                    <Download className="w-3 h-3 text-slate-400" /> Quy định định mức giờ chuẩn Giảng viên
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <p className="text-[11px] text-slate-400 font-medium tracking-wide pt-2 hidden md:block">
            2026 © Khoa Ô tô - Trường Sĩ quan Kỹ thuật Quân sự
          </p>
        </div>


        {/* RIGHT COLUMN: PROFESSIONAL LOGIN CARD */}
        <div className="lg:col-span-5 w-full flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[440px] bg-[#094870]/90 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8 space-y-6 shadow-2xl relative"
          >
            {/* Dashed outer accent line matching the mockup image style */}
            <div className="absolute inset-1.5 border border-dashed border-white/20 rounded-xl pointer-events-none" />

            {/* Red text Title style on the box 
            <div className="text-center pb-2 pt-1">
              <h2 className="text-[#d6111a] font-black tracking-wider uppercase text-lg md:text-xl font-display drop-shadow-[0_1.2px_1.2px_rgba(254,240,138,0.7)]">
                KHOA Ô TÔ
              </h2>
              <div className="h-[1px] w-24 bg-red-500/30 mx-auto mt-2.5" />
            </div>*/}

            {error && (
              <div className="bg-rose-950/55 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-[13px] font-semibold flex gap-2.5 items-center relative z-10">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-blue-200 uppercase tracking-wider block">
                  Tên đăng nhập / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-sky-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login_email"
                    type="email"
                    required
                    placeholder="nhap.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-[13px] w-full border border-white/10 rounded-lg pl-10 pr-3.5 py-3.5 bg-slate-900/40 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium text-white placeholder:text-slate-400 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-blue-200 uppercase tracking-wider block">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-sky-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login_password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-[13px] w-full border border-white/10 rounded-lg pl-10 pr-11 py-3.5 bg-slate-900/40 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium text-white placeholder:text-slate-400 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-350 hover:text-white cursor-pointer p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn_login_submit"
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#2d9bf0] hover:bg-[#3caafd] active:bg-[#1a8be0] disabled:bg-blue-300/40 disabled:text-blue-200/50 text-white font-extrabold text-[13.5px] uppercase tracking-wider py-3.5 px-4 rounded-lg cursor-pointer transition-all duration-150 select-none shadow-md mt-2"
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="relative py-1.5 z-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-[#094870] px-3 font-extrabold text-slate-300 uppercase tracking-wider">
                  Hoặc
                </span>
              </div>
            </div>

            <button
              id="btn_google_signin"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2.5 bg-[#0b2f4a] border border-white/5 text-white hover:bg-[#061e31] font-bold text-[13px] py-3 px-4 rounded-lg cursor-pointer transition-all select-none duration-150 relative z-10"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.1-.13-.19-.27-.23-.43z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Đăng nhập bằng Gmail
            </button>

            {/* Mobile simplified copyright & footer info */}
            <div className="text-center pt-2 md:hidden text-[11px] text-slate-300/80 font-medium space-y-1 relative z-10">
              <p className="font-bold text-sky-200">Khoa Ô tô - Trường Sĩ quan Kỹ thuật Quân sự</p>
              <p className="text-slate-400">Copyright © 2026. All rights reserved.</p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Teacher, AcademicRank, DepartmentConfig } from '../types';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, loginWithGoogle, db, cleanDocData } from '../firebase';
import { DEPARTMENTS } from '../data';
import { 
  GraduationCap, Mail, Lock, Shield, User, AlertCircle, ArrowRight, 
  UserPlus, Eye, EyeOff, Calendar, FileText, Globe, Cpu, Compass, CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  teachers: Teacher[];
  onLogin: (role: 'admin' | 'teacher', teacherId?: string) => void;
}

export default function LoginScreen({ teachers, onLogin }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification Screen Indicator
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');

  // Sign Up Extra Fields
  const [fullName, setFullName] = useState('');
  const [teacherCode, setTeacherCode] = useState('GV.' + Math.floor(100000 + Math.random() * 900000));
  const [department, setDepartment] = useState(DEPARTMENTS[0].name);
  const [rank, setRank] = useState<AcademicRank>('ThS');
  const [position, setPosition] = useState('Giảng viên');
  const [party, setParty] = useState('Không kiêm nhiệm');
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [pedagogyCertYear, setPedagogyCertYear] = useState('');
  const [languageCert, setLanguageCert] = useState('');
  const [itCert, setItCert] = useState('');
  const [unitExperience, setUnitExperience] = useState('Cấp phân đội');

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
        // User not verified
        setNeedsVerification(true);
        setVerifyMessage(`Vui lòng xác thực tài khoản của bạn. Một email xác nhận đã được gửi đến: ${email}. Hãy kiểm tra hòm thư của bạn.`);
        setLoading(false);
        return;
      }

      // Successful login
      if (email === 'thanhhaihvkt@gmail.com') {
        onLogin('admin', user.uid);
      } else {
        onLogin('teacher', user.uid);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email hoặc mật khẩu không chính xác.');
      } else {
        setError(err.message || 'Có lỗi xảy ra trong quá trình đăng nhập.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc (*).');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create matching Teacher document in Firestore
      const newTeacher: Teacher = {
        id: user.uid,
        code: teacherCode,
        name: fullName,
        email: email,
        department: department,
        rank: rank,
        position: position,
        party: party,
        status: 'A',
        reductionRate: 0,
        startYear: Number(startYear),
        pedagogyCertYear: pedagogyCertYear || undefined,
        languageCert: languageCert || undefined,
        itCert: itCert || undefined,
        unitExperience: unitExperience || undefined
      };

      await setDoc(doc(db, 'teachers', user.uid), cleanDocData(newTeacher));

      // Send verification email
      await sendEmailVerification(user);

      setNeedsVerification(true);
      setVerifyMessage(`Đăng ký thành công! Chúng tôi đã gửi email xác nhận đến: ${email}. Vui lòng kích hoạt tài khoản của bạn để vào cổng tác vụ.`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Địa chỉ email đã được liên kết với một tài khoản khác.');
      } else {
        setError(err.message || 'Lỗi đăng ký tài khoản mới.');
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
      setError('Đăng nhập bằng tài khoản Google thất bại.');
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
        setError('Tài khoản vẫn chưa được xác nhận. Vui lòng kiểm tra email của bạn hoặc bấm gửi lại.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError('');
    setLoading(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setVerifyMessage(`Đã gửi lại email xác nhận đến: ${auth.currentUser.email}. Vui lòng kiểm tra lại.`);
      } else {
        setError('Vui lòng thử đăng nhập lại để nhận email.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative font-sans">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-10 p-6 sm:p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
            <Mail className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-800">Xác thực địa chỉ Email</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Hệ thống Khoa Ô tô yêu cầu xác nhận email để bảo mật thông tin hồ sơ của giảng viên.
            </p>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs font-semibold text-blue-800 leading-relaxed text-left">
            {verifyMessage}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs font-medium flex gap-2 items-center text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCheckReloadVerification}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-blue-500/10 transition-colors"
            >
              Tôi đã xác nhận email
            </button>
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer border border-slate-200 transition-colors"
            >
              Gửi lại email
            </button>
          </div>

          <button
            onClick={() => { setNeedsVerification(false); setError(''); }}
            className="text-xs text-slate-400 hover:text-slate-600 font-semibold underline block mx-auto cursor-pointer"
          >
            Quay lại đăng nhập
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-10"
      >
        {/* Header bar */}
        <div className="bg-slate-900 px-6 py-8 text-white relative">
          <div className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 select-none">
            v2.0 Firebase
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white border border-blue-500 shadow-sm animate-pulse">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wide font-display">FEMS-PORTAL</h1>
              <p className="text-xs text-slate-400 font-medium">Hệ thống phân bộ giảng dạy chuẩn khoa</p>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-300 antialiased font-medium leading-relaxed">
            Hệ thống phân bổ chỉ tiêu định mức giờ dạy, theo dõi hoạt động nghiên cứu khoa học chuyên nghiệp chạy trên cơ sở dữ liệu Firebase Firestore.
          </p>
        </div>

        {/* Tab selectors */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('signin'); setError(''); }}
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Đăng nhập tài khoản
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); }}
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Đăng ký Gi giảng viên
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs font-medium flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-blue-500/10 transition-colors"
              >
                {loading ? 'Đang xác thực bảo mật...' : 'Đăng nhập hệ thống'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Họ và tên giảng viên <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Bộ môn trực thuộc</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Học hàm / Học vị</label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value as AcademicRank)}
                    className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="GS">Giáo sư (GS)</option>
                    <option value="PGS">Phó Giáo sư (PGS)</option>
                    <option value="TS">Tiến sĩ (TS)</option>
                    <option value="ThS">Thạc sĩ (ThS)</option>
                    <option value="CN">Cử nhân (CN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Chức vụ phụ trách</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Giảng viên">Giảng viên / Trợ giảng</option>
                    <option value="Trưởng bộ môn">Trưởng bộ môn</option>
                    <option value="Chủ nhiệm khoa">Chủ nhiệm khoa</option>
                    <option value="Phó Chủ nhiệm khoa">Phó Chủ nhiệm khoa</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Chức vụ Đảng</label>
                  <select
                    value={party}
                    onChange={(e) => setParty(e.target.value)}
                    className="text-xs w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    disabled={position !== 'Chủ nhiệm khoa' && position !== 'Phó Chủ nhiệm khoa'}
                  >
                    <option value="Không kiêm nhiệm">Không kiêm nhiệm</option>
                    <option value="Bí thư chi bộ">Bí thư chi bộ</option>
                    <option value="Phó Bí thư chi bộ">Phó Bí thư chi bộ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Năm giảng dạy (tính thâm niên)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={startYear}
                      onChange={(e) => setStartYear(Number(e.target.value))}
                      className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-3">
                <h3 className="text-xs font-extrabold text-blue-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Chứng chỉ & Thâm niên thực thực tế
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">CC Nghiệp vụ sư phạm (năm)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 2021"
                      value={pedagogyCertYear}
                      onChange={(e) => setPedagogyCertYear(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Chứng chỉ ngoại ngữ</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: IELTS 6.5, TOEIC 750"
                      value={languageCert}
                      onChange={(e) => setLanguageCert(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Chứng chỉ tin học</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: MOS Excel, MOS Word"
                      value={itCert}
                      onChange={(e) => setItCert(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Thực tế đơn vị</label>
                    <select
                      value={unitExperience}
                      onChange={(e) => setUnitExperience(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Cấp lữ đoàn">Cấp Lữ đoàn</option>
                      <option value="Cấp trung đoàn">Cấp Trung đoàn</option>
                      <option value="Cấp phân đội">Cấp Phân đội</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Địa chỉ Email <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Mật khẩu mới (≥6 ký tự) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-xs w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-blue-500/10 transition-colors"
              >
                Gửi mã kích hoạt & Tạo tài khoản mới
              </button>
            </form>
          )}

          {/* Prompt 1-click login with Google */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-250" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 font-extrabold text-slate-400">HOẶC TIẾP TỤC VỚI GMAIL</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-slate-900 border border-slate-800 text-white hover:bg-slate-850 font-bold text-xs py-3 px-4 rounded-xl cursor-pointer shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            Sử dụng Google Sign-In (Xác thực nhanh)
          </button>

          {/* Instruction Panel for Administrators */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-[10px] text-slate-500 font-medium leading-relaxed">
            <span className="font-extrabold text-blue-800 block mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Báo cáo phân quyền Admin Khoa Ô tô:
            </span>
            <ul className="list-disc pl-3.5 space-y-1 font-semibold">
              <li>Địa chỉ email đăng nhập của Quản trị trưởng <span className="bg-blue-100 px-1 py-0.2 rounded font-mono font-bold text-blue-700">thanhhaihvkt@gmail.com</span> sẽ tự động được gán quyền Admin toàn năng.</li>
              <li>Mọi địa chỉ email khác sẽ được định danh là Giảng viên.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

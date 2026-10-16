import { useState, useEffect } from 'react';
import { Teacher, TeachingLog, ResearchLog, RankNorm, AcademicYearConfig, WorkHistory, AuditLog, UserRole } from './types';
import { 
  DEFAULT_RANKS_NORM, 
  ACADEMIC_YEARS, 
  DEPARTMENTS, 
  TEACHERS_SAMPLE, 
  TEACHING_LOGS_SAMPLE, 
  RESEARCH_LOGS_SAMPLE,
  WORK_HISTORY_SAMPLE
} from './data';
import StatsDashboard from './components/StatsDashboard';
import TeacherList from './components/TeacherList';
import TeachingHoursTab from './components/TeachingHoursTab';
import ResearchTab from './components/ResearchTab';
import DataManagement from './components/DataManagement';
import LoginScreen from './components/LoginScreen';
import AccountSecurityTab from './components/AccountSecurityTab';
import StandardsTab from './components/StandardsTab';
import TeachersByYearTab from './components/TeachersByYearTab';
import AuditLogTab from './components/AuditLogTab';
import RoleManagementTab from './components/RoleManagementTab';
import { 
  BarChart3, Users, BookOpen, FileCode2, Settings, 
  GraduationCap, Calendar, Sparkles, LogOut, ShieldCheck, UserCheck, Award, ClipboardList
} from 'lucide-react';
import { motion, LayoutGroup } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, cleanDocData } from './firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ 
    role: 'admin' | 'teacher'; 
    teacherId?: string;
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'stats' | 'teachers' | 'teaching' | 'research' | 'settings' | 'account' | 'standards' | 'teachersByYear' | 'audit' | 'roles'>('stats');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachingLogs, setTeachingLogs] = useState<TeachingLog[]>([]);
  const [researchLogs, setResearchLogs] = useState<ResearchLog[]>([]);
  const [rankNorms, setRankNorms] = useState<RankNorm[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearConfig[]>([]);
  const [workHistories, setWorkHistories] = useState<WorkHistory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');
  const [hasInitYearOnFetch, setHasInitYearOnFetch] = useState(false);

  const initializeFirebaseDataIfEmpty = async () => {
    try {
      const snap = await getDocs(collection(db, 'rank_norms'));
      if (snap.empty) {
        for (const norm of DEFAULT_RANKS_NORM) await setDoc(doc(db, 'rank_norms', norm.rank), cleanDocData(norm));
        for (const yr of ACADEMIC_YEARS) await setDoc(doc(db, 'academic_years', yr.id), cleanDocData(yr));
        for (const t of TEACHERS_SAMPLE) await setDoc(doc(db, 'teachers', t.id), cleanDocData(t));
        for (const tl of TEACHING_LOGS_SAMPLE) await setDoc(doc(db, 'teaching_logs', tl.id), cleanDocData(tl));
        for (const rl of RESEARCH_LOGS_SAMPLE) await setDoc(doc(db, 'research_logs', rl.id), cleanDocData(rl));
        for (const wh of WORK_HISTORY_SAMPLE) await setDoc(doc(db, 'work_histories', wh.id), cleanDocData(wh));
      }
    } catch (error) { console.error('Error seeding data:', error); }
  };

  // Migrate dữ liệu cũ: research_logs.role 'co_author' → 'member'
  // (chạy mỗi lần app khởi động; idempotent — query trả rỗng khi đã migrate)
  const migrateLegacyCoAuthorRole = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'research_logs'), where('role', '==', 'co_author')));
      if (snap.empty) return;
      for (const d of snap.docs) {
        await updateDoc(doc(db, 'research_logs', d.id), { role: 'member' });
      }
      console.log(`Đã migrate ${snap.size} research_logs: co_author → member`);
    } catch (err) { console.error('Lỗi migrate role co_author:', err); }
  };

  useEffect(() => {
    const localSelectedYear = localStorage.getItem('faculty_selected_year');
    setSelectedYear(localSelectedYear || '2025-2026');
  }, []);

  useEffect(() => {
    if (!currentUser) { setTeachers([]); setTeachingLogs([]); setResearchLogs([]); setRankNorms([]); setAcademicYears([]); setWorkHistories([]); setUserRoles([]); return; }
    initializeFirebaseDataIfEmpty();
    migrateLegacyCoAuthorRole();
    const unsubscribes: (() => void)[] = [];

    const add = (col: string, setter: (list: any[]) => void) => {
      const unsub = onSnapshot(collection(db, col), (snap) => {
        const list: any[] = []; snap.forEach(d => list.push(d.data()));
        setter(list);
      }, (err) => handleFirestoreError(err, OperationType.GET, col));
      unsubscribes.push(unsub);
    };

    add('teachers', setTeachers);
    add('teaching_logs', setTeachingLogs);
    add('research_logs', setResearchLogs);
    add('rank_norms', setRankNorms);
    add('user_roles', setUserRoles);
    add('work_histories', setWorkHistories);

    const unsubYears = onSnapshot(collection(db, 'academic_years'), (snap) => {
      const list: AcademicYearConfig[] = []; snap.forEach(d => list.push(d.data() as AcademicYearConfig));
      setAcademicYears(list);
      if (list.length > 0 && !hasInitYearOnFetch) {
        const sorted = [...list].sort((a, b) => b.year.localeCompare(a.year));
        setSelectedYear(sorted[0].year);
        localStorage.setItem('faculty_selected_year', sorted[0].year);
        setHasInitYearOnFetch(true);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'academic_years'));
    unsubscribes.push(unsubYears);

    const unsubAudit = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      const list: AuditLog[] = []; snap.forEach(d => list.push(d.data() as AuditLog));
      list.sort((a, b) => b.timestamp - a.timestamp);
      setAuditLogs(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'audit_logs'));
    unsubscribes.push(unsubAudit);

    return () => { unsubscribes.forEach(u => u()); };
  }, [currentUser]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || '';
        const uid = firebaseUser.uid;
        const photoURL = firebaseUser.photoURL;
        const displayName = firebaseUser.displayName;
        if (email === 'thanhhaihvkt@gmail.com') {
          setCurrentUser({ role: 'admin', teacherId: uid, photoURL, displayName, email });
        } else {
          try {
            const q = query(collection(db, 'teachers'), where('email', '==', email.trim().toLowerCase()));
            const qs = await getDocs(q);
            if (!qs.empty) {
              const td = qs.docs[0].data() as Teacher;
              setCurrentUser({ role: 'teacher', teacherId: qs.docs[0].id, photoURL, displayName: td.name || displayName, email });
            } else {
              try { await firebaseUser.delete(); } catch (err) { console.error(err); }
              await signOut(auth);
              setCurrentUser(null);
            }
          } catch (e) {
            console.error(e);
            try { await firebaseUser.delete(); } catch (err) { console.error(err); }
            await signOut(auth);
            setCurrentUser(null);
          }
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogin = (role: 'admin' | 'teacher', teacherId?: string) => { setCurrentUser({ role, teacherId }); setActiveTab('stats'); };
  const handleLogout = async () => { try { await signOut(auth); setCurrentUser(null); } catch {} };
  const syncSelectedYear = (year: string) => { setSelectedYear(year); localStorage.setItem('faculty_selected_year', year); };

  const writeAuditLog = async (action: 'CREATE' | 'UPDATE' | 'DELETE', collection: string, documentId: string, summary: string) => {
    try {
      const mt = teachers.find(t => t.id === currentUser?.teacherId);
      const log: AuditLog = { id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), action, collection, documentId, summary, performedBy: currentUser?.teacherId || 'unknown', performedByName: mt?.name || 'Admin' };
      await setDoc(doc(db, 'audit_logs', log.id), cleanDocData(log));
    } catch {}
  };

  const handleAddTeacher = async (teacher: Teacher) => { try { await setDoc(doc(db, 'teachers', teacher.id), cleanDocData(teacher)); writeAuditLog('CREATE', 'teachers', teacher.id, `Thêm GV: ${teacher.name}`); } catch (err) { handleFirestoreError(err, OperationType.CREATE, `teachers/${teacher.id}`); } };
  const handleEditTeacher = async (teacher: Teacher) => { try { await setDoc(doc(db, 'teachers', teacher.id), cleanDocData(teacher)); writeAuditLog('UPDATE', 'teachers', teacher.id, `Sửa GV: ${teacher.name}`); } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `teachers/${teacher.id}`); } };
  const handleDeleteTeacher = async (id: string) => {
    const tn = teachers.find(t => t.id === id)?.name || id;
    try { await deleteDoc(doc(db, 'teachers', id)); writeAuditLog('DELETE', 'teachers', id, `Xóa GV: ${tn}`);
      for (const l of teachingLogs.filter(l => l.teacherId === id)) await deleteDoc(doc(db, 'teaching_logs', l.id));
      for (const l of researchLogs.filter(l => l.teacherId === id)) await deleteDoc(doc(db, 'research_logs', l.id));
      for (const w of workHistories.filter(w => w.teacherId === id)) await deleteDoc(doc(db, 'work_histories', w.id));
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, `teachers/${id}`); }
  };

  const handleAddTeachingLog = async (log: TeachingLog) => { try { await setDoc(doc(db, 'teaching_logs', log.id), cleanDocData(log)); writeAuditLog('CREATE', 'teaching_logs', log.id, `Thêm giờ giảng: ${log.subjectName}`); } catch (err) { handleFirestoreError(err, OperationType.CREATE, `teaching_logs/${log.id}`); } };
  const handleEditTeachingLog = async (log: TeachingLog) => { try { await setDoc(doc(db, 'teaching_logs', log.id), cleanDocData(log)); writeAuditLog('UPDATE', 'teaching_logs', log.id, `Sửa giờ giảng: ${log.subjectName}`); } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `teaching_logs/${log.id}`); } };
  const handleDeleteTeachingLog = async (id: string) => { const l = teachingLogs.find(l => l.id === id); try { await deleteDoc(doc(db, 'teaching_logs', id)); writeAuditLog('DELETE', 'teaching_logs', id, `Xóa giờ giảng: ${l?.subjectName || id}`); } catch (err) { handleFirestoreError(err, OperationType.DELETE, `teaching_logs/${id}`); } };

  const handleAddResearchLog = async (log: ResearchLog) => { try { await setDoc(doc(db, 'research_logs', log.id), cleanDocData(log)); writeAuditLog('CREATE', 'research_logs', log.id, `Thêm NCKH: ${log.title.substring(0, 60)}`); } catch (err) { handleFirestoreError(err, OperationType.CREATE, `research_logs/${log.id}`); } };
  const handleEditResearchLog = async (log: ResearchLog) => { try { await setDoc(doc(db, 'research_logs', log.id), cleanDocData(log)); writeAuditLog('UPDATE', 'research_logs', log.id, `Sửa NCKH: ${log.title.substring(0, 60)}`); } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `research_logs/${log.id}`); } };
  const handleDeleteResearchLog = async (id: string) => { const l = researchLogs.find(l => l.id === id); try { await deleteDoc(doc(db, 'research_logs', id)); writeAuditLog('DELETE', 'research_logs', id, `Xóa NCKH: ${l?.title?.substring(0, 60) || id}`); } catch (err) { handleFirestoreError(err, OperationType.DELETE, `research_logs/${id}`); } };
  const handleApproveResearchLog = async (id: string, status: 'approved' | 'rejected' | 'pending') => { const l = researchLogs.find(l => l.id === id); try { await updateDoc(doc(db, 'research_logs', id), { status }); writeAuditLog('UPDATE', 'research_logs', id, `Phê duyệt: ${l?.title?.substring(0, 50)} → ${status}`); } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `research_logs/${id}`); } };

  const handleAddWorkHistory = async (wh: WorkHistory) => { try { await setDoc(doc(db, 'work_histories', wh.id), cleanDocData(wh)); writeAuditLog('CREATE', 'work_histories', wh.id, `Thêm CT: ${wh.position} (${wh.academicYear})`); } catch (err) { handleFirestoreError(err, OperationType.CREATE, `work_histories/${wh.id}`); } };
  const handleEditWorkHistory = async (wh: WorkHistory) => { try { await setDoc(doc(db, 'work_histories', wh.id), cleanDocData(wh)); writeAuditLog('UPDATE', 'work_histories', wh.id, `Sửa CT: ${wh.position} (${wh.academicYear})`); } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `work_histories/${wh.id}`); } };
  const handleDeleteWorkHistory = async (id: string) => { const w = workHistories.find(w => w.id === id); try { await deleteDoc(doc(db, 'work_histories', id)); writeAuditLog('DELETE', 'work_histories', id, `Xóa CT: ${w?.position || id}`); } catch (err) { handleFirestoreError(err, OperationType.DELETE, `work_histories/${id}`); } };

  const handleSaveUserRole = async (role: UserRole) => { try { await setDoc(doc(db, 'user_roles', role.teacherId), cleanDocData(role)); writeAuditLog('UPDATE', 'user_roles', role.teacherId, `Phân quyền ${role.name}: ${role.role}`); } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `user_roles/${role.teacherId}`); } };
  const handleDeleteUserRole = async (teacherId: string) => { try { await deleteDoc(doc(db, 'user_roles', teacherId)); writeAuditLog('DELETE', 'user_roles', teacherId, `Xóa phân quyền`); } catch (err) { handleFirestoreError(err, OperationType.DELETE, `user_roles/${teacherId}`); } };

  const handleUpdateNorms = async (norms: RankNorm[]) => { try { for (const n of norms) await setDoc(doc(db, 'rank_norms', n.rank), cleanDocData(n)); } catch (err) { handleFirestoreError(err, OperationType.UPDATE, 'rank_norms'); } };
  const handleSetAcademicYear = (year: string) => syncSelectedYear(year);
  const handleAddAcademicYear = async (yc: AcademicYearConfig) => { try { await setDoc(doc(db, 'academic_years', yc.id), cleanDocData(yc)); syncSelectedYear(yc.year); } catch (err) { handleFirestoreError(err, OperationType.CREATE, `academic_years/${yc.id}`); } };
  const handleResetToDefault = async () => { try { for (const t of teachers) await deleteDoc(doc(db, 'teachers', t.id)); for (const l of teachingLogs) await deleteDoc(doc(db, 'teaching_logs', l.id)); for (const l of researchLogs) await deleteDoc(doc(db, 'research_logs', l.id)); for (const n of rankNorms) await deleteDoc(doc(db, 'rank_norms', n.rank)); for (const y of academicYears) await deleteDoc(doc(db, 'academic_years', y.id)); for (const w of workHistories) await deleteDoc(doc(db, 'work_histories', w.id)); await initializeFirebaseDataIfEmpty(); } catch (err) { console.error(err); } };
  const handleImportData = (d: string): boolean => { try { const p = JSON.parse(d); if (p.teachers && p.teachingLogs && p.researchLogs && p.rankNorms) { p.teachers.forEach((t: any) => setDoc(doc(db, 'teachers', t.id), cleanDocData(t))); p.teachingLogs.forEach((t: any) => setDoc(doc(db, 'teaching_logs', t.id), cleanDocData(t))); p.researchLogs.forEach((t: any) => setDoc(doc(db, 'research_logs', t.id), cleanDocData(t))); p.rankNorms.forEach((t: any) => setDoc(doc(db, 'rank_norms', t.rank), cleanDocData(t))); if (p.academicYears) p.academicYears.forEach((y: any) => setDoc(doc(db, 'academic_years', y.id), cleanDocData(y))); if (p.workHistories) p.workHistories.forEach((w: any) => setDoc(doc(db, 'work_histories', w.id), cleanDocData(w))); if (p.selectedYear) syncSelectedYear(p.selectedYear); return true; } return false; } catch { return false; } };
  const handleExportData = (): string => JSON.stringify({ teachers, teachingLogs, researchLogs, rankNorms, academicYears, workHistories, selectedYear }, null, 2);

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p className="mt-4 text-xs font-bold text-slate-500">Đang đồng bộ...</p></div>;
  if (!currentUser) return <LoginScreen teachers={teachers} onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased">
      <aside className="w-64 bg-[#062f4a] text-white flex flex-col shrink-0 hidden md:flex h-screen sticky top-0 border-r border-white/10">
        <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
          <img src="https://i.ibb.co/TBgCM3fw/logo-vhp-2.png" alt="Logo" className="w-12 h-12 object-contain select-none" referrerPolicy="no-referrer" />
          <div className="leading-tight"><p className="text-xs font-extrabold text-sky-300 header-khoa">KHOA Ô TÔ</p><h1 className="font-bold text-xs tracking-wider text-white uppercase font-display">TRƯỜNG SQKTQS</h1><div className="h-[2px] w-full bg-yellow-400 mt-1.5" /></div>
        </div>
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          {([
            { tab: 'stats' as const, icon: <BarChart3 className="w-4 h-4 shrink-0" />, label: 'Tổng quan thống kê' },
            { tab: 'teachersByYear' as const, icon: <UserCheck className="w-4 h-4 shrink-0" />, label: 'Giảng viên năm học' },
            { tab: 'teaching' as const, icon: <BookOpen className="w-4 h-4 shrink-0" />, label: 'Giờ giảng dạy' },
            { tab: 'research' as const, icon: <FileCode2 className="w-4 h-4 shrink-0" />, label: 'Nghiên cứu khoa học' },
            { tab: 'standards' as const, icon: <Award className="w-4 h-4 shrink-0" />, label: 'Chức danh CM, KT' },
            { tab: 'account' as const, icon: <ShieldCheck className="w-4 h-4 shrink-0" />, label: 'Hồ sơ & Bảo mật' },
          ]).map(i => (
            <button key={i.tab} onClick={() => setActiveTab(i.tab)} className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 text-xs font-semibold uppercase tracking-wider transition-all text-left cursor-pointer ${activeTab === i.tab ? 'bg-[#094870]/50 border-sky-400 text-sky-200 font-extrabold' : 'border-transparent text-slate-300/85 hover:text-white hover:bg-white/5'}`}>
              {i.icon}<span>{i.label}</span>
            </button>
          ))}
          {(currentUser?.role === 'admin' || teachers.find(t => t.id === currentUser?.teacherId && (t.position.toLowerCase().includes('chủ nhiệm khoa') || t.position.toLowerCase().includes('phó chủ nhiệm khoa')))) && (
            <>
              <div className="h-px bg-white/10 my-4 mx-6" />
              <div className="px-6 py-1 text-[10px] font-bold text-sky-400/70 uppercase tracking-widest">Quản lý</div>
              {([
                { tab: 'settings' as const, icon: <Settings className="w-4 h-4 shrink-0 text-sky-300" />, label: 'Cài đặt' },
                { tab: 'teachers' as const, icon: <Users className="w-4 h-4 shrink-0 text-sky-300" />, label: 'Hồ sơ giảng viên' },
                { tab: 'roles' as const, icon: <ClipboardList className="w-4 h-4 shrink-0 text-sky-300" />, label: 'Phân quyền' },
                { tab: 'audit' as const, icon: <ClipboardList className="w-4 h-4 shrink-0 text-sky-300" />, label: 'Nhật ký hệ thống' },
              ]).map(i => (
                <button key={i.tab} onClick={() => setActiveTab(i.tab)} className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 text-xs font-semibold uppercase tracking-wider transition-all text-left cursor-pointer ${activeTab === i.tab ? 'bg-[#094870]/50 border-sky-400 text-sky-200 font-extrabold' : 'border-transparent text-slate-300/85 hover:text-white hover:bg-white/5'}`}>
                  {i.icon}<span>{i.label}</span>
                </button>
              ))}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-3.5 shrink-0 bg-[#042236]">
          <div className="flex items-center gap-2 px-2">
            {(() => {
              const mt = teachers.find(t => t.id === currentUser?.teacherId);
              const dn = mt?.name || currentUser?.displayName || (currentUser?.role === 'admin' ? 'Admin' : 'GV');
              return currentUser?.role === 'admin' ? (<><div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-xs text-white font-mono">AD</div><div className="text-xs min-w-0 flex-1"><p className="font-bold text-slate-200 truncate">{dn}</p><p className="text-xs text-sky-200/70">Admin</p></div></>) : (<><div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-extrabold text-xs text-white font-mono">GV</div><div className="text-xs min-w-0 flex-1"><p className="font-bold text-slate-200 truncate">{dn}</p><p className="text-xs text-sky-200/70 truncate">Giảng viên</p></div></>);
            })()}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-[#094870]/40 hover:bg-rose-950/40 hover:text-rose-300 text-blue-200 font-bold text-xs py-1.5 px-3 rounded-lg border border-white/10 cursor-pointer transition-colors">
            <LogOut className="w-3.5 h-3.5" />Đăng xuất
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co/TBgCM3fw/logo-vhp-2.png" alt="Logo" className="w-8 h-8 object-contain select-none md:hidden" referrerPolicy="no-referrer" />
            <div><h2 className="text-sm sm:text-lg font-bold text-slate-800">Hệ thống Quản lý Đào tạo & NCKH</h2></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); localStorage.setItem('faculty_selected_year', e.target.value); }} className="font-bold text-slate-800 font-mono bg-transparent border-none focus:outline-hidden pr-1 cursor-pointer">
                {!academicYears.some(y => y.year === selectedYear) && <option value={selectedYear}>{selectedYear}</option>}
                {[...academicYears].sort((a, b) => b.year.localeCompare(a.year)).map(y => <option key={y.id || y.year} value={y.year}>{y.year}</option>)}
              </select>
            </div>
          </div>
        </header>
        <nav className="md:hidden bg-[#062f4a] border-b border-white/10 py-1.5 sticky top-16 z-30 shadow-xs">
          <div className="px-4 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex gap-1.5">
              {[{tab:'stats',l:'Tổng quan'},{tab:'teachers',l:'Giảng viên'},{tab:'teachersByYear',l:'GV năm học'},{tab:'teaching',l:'Giờ giảng'},{tab:'research',l:'NCKH'},{tab:'standards',l:'Chức danh'},{tab:'account',l:'Tài khoản'},{tab:'settings',l:'Cài đặt'}].map(i=>(
                <button key={i.tab} onClick={()=>setActiveTab(i.tab as any)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${activeTab===i.tab?'bg-[#094870] text-white font-extrabold shadow-sm border border-white/10':'text-blue-200/80 hover:text-white'}`}>{i.l}</button>
              ))}
            </div>
          </div>
        </nav>
        <main className="flex-grow p-4 sm:p-8 space-y-6">
          <LayoutGroup>
            <motion.div key={activeTab} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
              {activeTab === 'stats' && <StatsDashboard teachers={teachers} teachingLogs={teachingLogs} researchLogs={researchLogs} rankNorms={rankNorms} academicYear={selectedYear} workHistories={workHistories} />}
              {activeTab === 'teachers' && <TeacherList teachers={teachers} departments={DEPARTMENTS} onAddTeacher={handleAddTeacher} onEditTeacher={handleEditTeacher} onDeleteTeacher={handleDeleteTeacher} userRole={currentUser?.role} currentTeacherId={currentUser?.teacherId} workHistories={workHistories} academicYears={academicYears} onAddWorkHistory={handleAddWorkHistory} onEditWorkHistory={handleEditWorkHistory} onDeleteWorkHistory={handleDeleteWorkHistory} />}
              {activeTab === 'teachersByYear' && <TeachersByYearTab teachers={teachers} workHistories={workHistories} rankNorms={rankNorms} teachingLogs={teachingLogs} researchLogs={researchLogs} selectedYear={selectedYear} />}
              {activeTab === 'teaching' && <TeachingHoursTab teachers={teachers} teachingLogs={teachingLogs} academicYears={academicYears} selectedYear={selectedYear} onAddTeachingLog={handleAddTeachingLog} onEditTeachingLog={handleEditTeachingLog} onDeleteTeachingLog={handleDeleteTeachingLog} userRole={currentUser?.role} currentTeacherId={currentUser?.teacherId} />}
              {activeTab === 'research' && <ResearchTab teachers={teachers} researchLogs={researchLogs} selectedYear={selectedYear} academicYears={academicYears} onAddResearchLog={handleAddResearchLog} onEditResearchLog={handleEditResearchLog} onDeleteResearchLog={handleDeleteResearchLog} onApproveLog={handleApproveResearchLog} userRole={currentUser?.role} currentTeacherId={currentUser?.teacherId} />}
              {activeTab === 'standards' && <StandardsTab teachers={teachers} researchLogs={researchLogs} />}
              {activeTab === 'settings' && <DataManagement rankNorms={rankNorms} academicYears={academicYears} selectedYear={selectedYear} onUpdateNorms={handleUpdateNorms} onSetAcademicYear={handleSetAcademicYear} onAddAcademicYear={handleAddAcademicYear} onResetToDefault={handleResetToDefault} onImportData={handleImportData} onExportData={handleExportData} />}
              {activeTab === 'roles' && <RoleManagementTab teachers={teachers} userRoles={userRoles} onSaveUserRole={handleSaveUserRole} onDeleteUserRole={handleDeleteUserRole} />}
              {activeTab === 'audit' && <AuditLogTab auditLogs={auditLogs} />}
              {activeTab === 'account' && <AccountSecurityTab teachers={teachers} currentUser={currentUser} />}
            </motion.div>
          </LayoutGroup>
        </main>
        <footer className="bg-white border-t border-slate-200 py-5 px-4 sm:px-8"><div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400"><span>© {new Date().getFullYear()} FEMS-Portal</span></div></footer>
      </div>
    </div>
  );
}
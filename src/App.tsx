import { useState, useEffect } from 'react';
import { Teacher, TeachingLog, ResearchLog, RankNorm, AcademicYearConfig } from './types';
import { 
  DEFAULT_RANKS_NORM, 
  ACADEMIC_YEARS, 
  DEPARTMENTS, 
  TEACHERS_SAMPLE, 
  TEACHING_LOGS_SAMPLE, 
  RESEARCH_LOGS_SAMPLE 
} from './data';
import StatsDashboard from './components/StatsDashboard';
import TeacherList from './components/TeacherList';
import TeachingHoursTab from './components/TeachingHoursTab';
import ResearchTab from './components/ResearchTab';
import DataManagement from './components/DataManagement';
import LoginScreen from './components/LoginScreen';
import AccountSecurityTab from './components/AccountSecurityTab';
import StandardsTab from './components/StandardsTab';
import { 
  BarChart3, Users, BookOpen, FileCode2, Settings, 
  GraduationCap, Calendar, Sparkles, LogOut, ShieldCheck, UserCheck, Award
} from 'lucide-react';
import { motion, LayoutGroup } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, cleanDocData } from './firebase';

export default function App() {
  // Use Firebase User State & Auth Loading
  const [currentUser, setCurrentUser] = useState<{ 
    role: 'admin' | 'teacher'; 
    teacherId?: string;
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'stats' | 'teachers' | 'teaching' | 'research' | 'settings' | 'account' | 'standards'>('stats');

  // Core Data States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachingLogs, setTeachingLogs] = useState<TeachingLog[]>([]);
  const [researchLogs, setResearchLogs] = useState<ResearchLog[]>([]);
  const [rankNorms, setRankNorms] = useState<RankNorm[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearConfig[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');
  const [hasInitYearOnFetch, setHasInitYearOnFetch] = useState(false);

  // Seeding initial data if empty
  const initializeFirebaseDataIfEmpty = async () => {
    try {
      const snap = await getDocs(collection(db, 'rank_norms'));
      if (snap.empty) {
        console.log('Seeding initial data to Firestore...');
        for (const norm of DEFAULT_RANKS_NORM) {
          await setDoc(doc(db, 'rank_norms', norm.rank), cleanDocData(norm));
        }
        for (const yr of ACADEMIC_YEARS) {
          await setDoc(doc(db, 'academic_years', yr.id), cleanDocData(yr));
        }
        for (const t of TEACHERS_SAMPLE) {
          await setDoc(doc(db, 'teachers', t.id), cleanDocData(t));
        }
        for (const tl of TEACHING_LOGS_SAMPLE) {
          await setDoc(doc(db, 'teaching_logs', tl.id), cleanDocData(tl));
        }
        for (const rl of RESEARCH_LOGS_SAMPLE) {
          await setDoc(doc(db, 'research_logs', rl.id), cleanDocData(rl));
        }
        console.log('Firestore seeded successfully!');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  };

  // 1. Retrieve local settings on mount
  useEffect(() => {
    const localSelectedYear = localStorage.getItem('faculty_selected_year');
    if (localSelectedYear) {
      setSelectedYear(localSelectedYear);
    } else {
      setSelectedYear('2025-2026');
      localStorage.setItem('faculty_selected_year', '2025-2026');
    }
  }, []);

  // 2. Load Firestore Data in real-time & seed if empty (only when user session is active)
  useEffect(() => {
    if (!currentUser) {
      // Clear data when signed out to prevent leaking state
      setTeachers([]);
      setTeachingLogs([]);
      setResearchLogs([]);
      setRankNorms([]);
      setAcademicYears([]);
      return;
    }

    // Run seeding check seamlessly
    initializeFirebaseDataIfEmpty();

    const unsubscribes: (() => void)[] = [];

    const unsubscribeTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      const list: Teacher[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Teacher);
      });
      setTeachers(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'teachers');
    });
    unsubscribes.push(unsubscribeTeachers);

    const unsubscribeTeaching = onSnapshot(collection(db, 'teaching_logs'), (snap) => {
      const list: TeachingLog[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as TeachingLog);
      });
      setTeachingLogs(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'teaching_logs');
    });
    unsubscribes.push(unsubscribeTeaching);

    const unsubscribeResearch = onSnapshot(collection(db, 'research_logs'), (snap) => {
      const list: ResearchLog[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as ResearchLog);
      });
      setResearchLogs(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'research_logs');
    });
    unsubscribes.push(unsubscribeResearch);

    const unsubscribeNorms = onSnapshot(collection(db, 'rank_norms'), (snap) => {
      const list: RankNorm[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as RankNorm);
      });
      setRankNorms(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'rank_norms');
    });
    unsubscribes.push(unsubscribeNorms);

    const unsubscribeYears = onSnapshot(collection(db, 'academic_years'), (snap) => {
      const list: AcademicYearConfig[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as AcademicYearConfig);
      });
      setAcademicYears(list);

      // Auto-select the newest cycle on initial data fetch of the database
      if (list.length > 0 && !hasInitYearOnFetch) {
        const sorted = [...list].sort((a, b) => b.year.localeCompare(a.year));
        const latestYear = sorted[0].year;
        setSelectedYear(latestYear);
        localStorage.setItem('faculty_selected_year', latestYear);
        setHasInitYearOnFetch(true);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'academic_years');
    });
    unsubscribes.push(unsubscribeYears);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser]);

  // 3. Listen to Auth State changes & resolve current user roles
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
            // Pre-validation to match existing teacher record pre-created by the admin
            const q = query(collection(db, 'teachers'), where('email', '==', email.trim().toLowerCase()));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const teacherDoc = querySnapshot.docs[0];
              const teacherData = teacherDoc.data() as Teacher;
              setCurrentUser({ 
                role: 'teacher', 
                teacherId: teacherDoc.id, 
                photoURL, 
                displayName: teacherData.name || displayName, 
                email 
              });
            } else {
              // De-authorize and instantly delete the newly created/unlisted user so they never appear in Auth
              try {
                await firebaseUser.delete();
              } catch (delError) {
                console.error('Error deleting unlisted user under onAuthStateChanged:', delError);
              }
              await signOut(auth);
              setCurrentUser(null);
            }
          } catch (e) {
            console.error('Error linking/verifying teacher email:', e);
            try {
              await firebaseUser.delete();
            } catch (delError) {
              console.error('Error deleting user under error catch branch:', delError);
            }
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

  const handleLogin = (role: 'admin' | 'teacher', teacherId?: string) => {
    setCurrentUser({ role, teacherId });
    setActiveTab('stats');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const syncSelectedYear = (year: string) => {
    setSelectedYear(year);
    localStorage.setItem('faculty_selected_year', year);
  };

  // HANDLERS
  // Teacher CRUD in Firestore
  const handleAddTeacher = async (teacher: Teacher) => {
    try {
      await setDoc(doc(db, 'teachers', teacher.id), cleanDocData(teacher));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `teachers/${teacher.id}`);
    }
  };

  const handleEditTeacher = async (teacher: Teacher) => {
    try {
      await setDoc(doc(db, 'teachers', teacher.id), cleanDocData(teacher));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teachers/${teacher.id}`);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'teachers', id));
      // Cascade delete logs
      const updatedTeaching = teachingLogs.filter(log => log.teacherId === id);
      const updatedResearch = researchLogs.filter(log => log.teacherId === id);
      for (const log of updatedTeaching) {
        await deleteDoc(doc(db, 'teaching_logs', log.id));
      }
      for (const log of updatedResearch) {
        await deleteDoc(doc(db, 'research_logs', log.id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teachers/${id}`);
    }
  };

  // Teaching Log CRUD in Firestore
  const handleAddTeachingLog = async (log: TeachingLog) => {
    try {
      await setDoc(doc(db, 'teaching_logs', log.id), cleanDocData(log));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `teaching_logs/${log.id}`);
    }
  };

  const handleEditTeachingLog = async (log: TeachingLog) => {
    try {
      await setDoc(doc(db, 'teaching_logs', log.id), cleanDocData(log));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teaching_logs/${log.id}`);
    }
  };

  const handleDeleteTeachingLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'teaching_logs', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teaching_logs/${id}`);
    }
  };

  // Research Log CRUD in Firestore
  const handleAddResearchLog = async (log: ResearchLog) => {
    try {
      await setDoc(doc(db, 'research_logs', log.id), cleanDocData(log));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `research_logs/${log.id}`);
    }
  };

  const handleEditResearchLog = async (log: ResearchLog) => {
    try {
      await setDoc(doc(db, 'research_logs', log.id), cleanDocData(log));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `research_logs/${log.id}`);
    }
  };

  const handleDeleteResearchLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'research_logs', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `research_logs/${id}`);
    }
  };

  const handleApproveResearchLog = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await updateDoc(doc(db, 'research_logs', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `research_logs/${id}`);
    }
  };

  // Settings Handlers
  const handleUpdateNorms = async (norms: RankNorm[]) => {
    try {
      for (const norm of norms) {
        await setDoc(doc(db, 'rank_norms', norm.rank), cleanDocData(norm));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'rank_norms');
    }
  };

  const handleSetAcademicYear = (year: string) => {
    syncSelectedYear(year);
  };

  const handleAddAcademicYear = async (yearConfig: AcademicYearConfig) => {
    try {
      await setDoc(doc(db, 'academic_years', yearConfig.id), cleanDocData(yearConfig));
      syncSelectedYear(yearConfig.year);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `academic_years/${yearConfig.id}`);
    }
  };

  const handleResetToDefault = async () => {
    try {
      for (const t of teachers) {
        await deleteDoc(doc(db, 'teachers', t.id));
      }
      for (const tl of teachingLogs) {
        await deleteDoc(doc(db, 'teaching_logs', tl.id));
      }
      for (const rl of researchLogs) {
        await deleteDoc(doc(db, 'research_logs', rl.id));
      }
      for (const norm of rankNorms) {
        await deleteDoc(doc(db, 'rank_norms', norm.rank));
      }
      for (const yr of academicYears) {
        await deleteDoc(doc(db, 'academic_years', yr.id));
      }
      await initializeFirebaseDataIfEmpty();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const handleImportData = (dataJson: string): boolean => {
    try {
      const parsed = JSON.parse(dataJson);
      if (parsed.teachers && parsed.teachingLogs && parsed.researchLogs && parsed.rankNorms) {
        parsed.teachers.forEach((t: any) => {
          setDoc(doc(db, 'teachers', t.id), cleanDocData(t)).catch(err => {
            handleFirestoreError(err, OperationType.CREATE, `teachers/${t.id}`);
          });
        });
        parsed.teachingLogs.forEach((tl: any) => {
          setDoc(doc(db, 'teaching_logs', tl.id), cleanDocData(tl)).catch(err => {
            handleFirestoreError(err, OperationType.CREATE, `teaching_logs/${tl.id}`);
          });
        });
        parsed.researchLogs.forEach((rl: any) => {
          setDoc(doc(db, 'research_logs', rl.id), cleanDocData(rl)).catch(err => {
            handleFirestoreError(err, OperationType.CREATE, `research_logs/${rl.id}`);
          });
        });
        parsed.rankNorms.forEach((norm: any) => {
          setDoc(doc(db, 'rank_norms', norm.rank), cleanDocData(norm)).catch(err => {
            handleFirestoreError(err, OperationType.CREATE, `rank_norms/${norm.rank}`);
          });
        });
        if (parsed.academicYears) {
          parsed.academicYears.forEach((yr: any) => {
            setDoc(doc(db, 'academic_years', yr.id), cleanDocData(yr)).catch(err => {
              handleFirestoreError(err, OperationType.CREATE, `academic_years/${yr.id}`);
            });
          });
        }
        if (parsed.selectedYear) syncSelectedYear(parsed.selectedYear);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleExportData = (): string => {
    const data = {
      teachers,
      teachingLogs,
      researchLogs,
      rankNorms,
      academicYears,
      selectedYear
    };
    return JSON.stringify(data, null, 2);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[13px] font-bold text-slate-500">Đang đồng bộ cơ sở dữ liệu Firebase...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen 
        teachers={teachers} 
        onLogin={handleLogin} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#062f4a] text-white flex flex-col shrink-0 hidden md:flex h-screen sticky top-0 border-r border-white/10">
        <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
          <img 
            src="https://i.ibb.co/TBgCM3fw/logo-vhp-2.png" 
            alt="Logo Sĩ Quan Kỹ Thuật Quân Sự" 
            className="w-10 h-10 object-contain select-none" 
            referrerPolicy="no-referrer"
          />
          <div className="leading-tight">
            <h1 className="font-bold text-[13px] tracking-wider text-white uppercase font-display">TRƯỜNG SQKTQS</h1>
            <p className="text-[13px] font-extrabold text-sky-300 header-khoa">KHOA Ô TÔ </p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 text-[13px] font-semibold uppercase tracking-wider transition-all text-left cursor-pointer ${
              activeTab === 'stats' 
                ? 'bg-[#094870]/50 border-sky-400 text-sky-200 font-extrabold' 
                : 'border-transparent text-slate-300/85 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Tổng quan thống kê</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 text-[13px] font-semibold uppercase tracking-wider transition-all text-left cursor-pointer ${
              activeTab === 'teachers' 
                ? 'bg-[#094870]/50 border-sky-400 text-sky-200 font-extrabold' 
                : 'border-transparent text-slate-300/85 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Hồ sơ giảng viên</span>
          </button>

          <button
            onClick={() => setActiveTab('teaching')}
            className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 text-[13px] font-semibold uppercase tracking-wider transition-all text-left cursor-pointer ${
              activeTab === 'teaching' 
                ? 'bg-[#094870]/50 border-sky-400 text-sky-200 font-extrabold' 
                : 'border-transparent text-slate-300/85 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Giờ giảng dạy</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 text-[13px] font-semibold uppercase tracking-wider transition-all text-left cursor-pointer ${
              activeTab === 'research' 
                ? 'bg-[#094870]/50 border-sky-400 text-sky-200 font-extrabold' 
                : 'border-transparent text-slate-300/85 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileCode2 className="w-4 h-4 shrink-0" />
            <span>Nghiên cứu khoa học</span>
          </button>

          <button
            onClick={() => setActiveTab('standards')}
            className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 text-[13px] font-semibold uppercase tracking-wider transition-all text-left cursor-pointer ${
              activeTab === 'standards' 
                ? 'bg-[#094870]/50 border-sky-400 text-sky-200 font-extrabold' 
                : 'border-transparent text-slate-300/85 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Chức danh CM, KT</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 text-[13px] font-semibold uppercase tracking-wider transition-all text-left cursor-pointer ${
              activeTab === 'account' 
                ? 'bg-[#094870]/50 border-sky-400 text-sky-200 font-extrabold' 
                : 'border-transparent text-slate-300/85 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Hồ sơ & Bảo mật</span>
          </button>

          {currentUser?.role === 'admin' && (
            <>
              <div className="h-px bg-white/10 my-4 mx-6" />

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 text-[13px] font-semibold uppercase tracking-wider transition-all text-left cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-[#094870]/50 border-sky-400 text-sky-200 font-extrabold' 
                    : 'border-transparent text-slate-300/85 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0 text-sky-300" />
                <span>Cài đặt</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3.5 shrink-0 bg-[#042236]">
          <div className="flex items-center gap-2 px-2">
            {(() => {
              const matchedTeacher = teachers.find(t => 
                t.id === currentUser?.teacherId || 
                (currentUser?.email && t.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
              );
              const displayName = matchedTeacher?.name || currentUser?.displayName || (currentUser?.role === 'admin' ? 'Admin Quản lý' : 'Giảng viên');
              
              if (currentUser?.role === 'admin') {
                return (
                  <>
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-lg object-cover bg-slate-850"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-[13px] text-white font-mono">AD</div>
                    )}
                    <div className="text-[13px] min-w-0 flex-1">
                      <p className="font-bold text-slate-200 truncate">{displayName}</p>
                      <p className="text-[13px] text-sky-200/70">Admin</p>
                    </div>
                  </>
                );
              } else {
                return (
                  <>
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-lg object-cover bg-slate-850"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-extrabold text-[13px] text-white font-mono">GV</div>
                    )}
                    <div className="text-[13px] min-w-0 flex-1">
                      <p className="font-bold text-slate-200 truncate">{displayName}</p>
                      <p className="text-[13px] text-sky-200/70 truncate">Giảng viên Khoa</p>
                    </div>
                  </>
                );
              }
            })()}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#094870]/40 hover:bg-rose-950/40 hover:text-rose-300 text-blue-200 hover:border-rose-500/30 font-bold text-[13px] py-1.5 px-3 rounded-lg border border-white/10 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.ibb.co/TBgCM3fw/logo-vhp-2.png" 
              alt="Logo" 
              className="w-8 h-8 object-contain select-none md:hidden" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                Hệ thống Quản lý Đào tạo & NCKH
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-semibold bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="hidden xs:inline shrink-0">Năm học: </span>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  localStorage.setItem('faculty_selected_year', e.target.value);
                }}
                className="font-bold text-slate-800 font-mono bg-transparent border-none focus:outline-hidden pr-1 cursor-pointer"
              >
                {!academicYears.some((item) => item.year === selectedYear) && (
                  <option value={selectedYear}>{selectedYear}</option>
                )}
                {[...academicYears]
                  .sort((a, b) => b.year.localeCompare(a.year))
                  .map((item) => (
                    <option key={item.id || item.year} value={item.year}>
                      {item.year}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Bar */}
        <nav className="md:hidden bg-[#062f4a] border-b border-white/10 py-1.5 sticky top-16 z-30 shadow-xs">
          <div className="px-4 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('stats')}
                className={`text-[13px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'stats' 
                    ? 'bg-[#094870] text-white font-extrabold shadow-sm border border-white/10' 
                    : 'text-blue-200/80 hover:text-white'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('teachers')}
                className={`text-[13px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'teachers' 
                    ? 'bg-[#094870] text-white font-extrabold shadow-sm border border-white/10' 
                    : 'text-blue-200/80 hover:text-white'
                }`}
              >
                Giảng viên
              </button>
              <button
                onClick={() => setActiveTab('teaching')}
                className={`text-[13px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'teaching' 
                    ? 'bg-[#094870] text-white font-extrabold shadow-sm border border-white/10' 
                    : 'text-blue-200/80 hover:text-white'
                }`}
              >
                Giờ giảng
              </button>
              <button
                onClick={() => setActiveTab('research')}
                className={`text-[13px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'research' 
                    ? 'bg-[#094870] text-white font-extrabold shadow-sm border border-white/10' 
                    : 'text-blue-200/80 hover:text-white'
                }`}
              >
                NCKH
              </button>
              <button
                onClick={() => setActiveTab('standards')}
                className={`text-[13px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'standards' 
                    ? 'bg-[#094870] text-white font-extrabold shadow-sm border border-white/10' 
                    : 'text-blue-200/80 hover:text-white'
                }`}
              >
                Chức danh
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`text-[13px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'account' 
                    ? 'bg-[#094870] text-white font-extrabold shadow-sm border border-white/10' 
                    : 'text-blue-200/80 hover:text-white'
                }`}
              >
                Tài khoản
              </button>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`text-[13px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                    activeTab === 'settings' 
                      ? 'bg-[#094870] text-white font-extrabold shadow-sm border border-white/10' 
                      : 'text-blue-200/80 hover:text-white'
                  }`}
                >
                  Cài đặt
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Dynamic content view */}
        <main className="flex-grow p-4 sm:p-8 space-y-6">
          <LayoutGroup>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'stats' && (
                <StatsDashboard 
                  teachers={teachers}
                  teachingLogs={teachingLogs}
                  researchLogs={researchLogs}
                  rankNorms={rankNorms}
                  academicYear={selectedYear}
                />
              )}

              {activeTab === 'teachers' && (
                <TeacherList 
                  teachers={teachers}
                  departments={DEPARTMENTS}
                  onAddTeacher={handleAddTeacher}
                  onEditTeacher={handleEditTeacher}
                  onDeleteTeacher={handleDeleteTeacher}
                  userRole={currentUser?.role}
                  currentTeacherId={currentUser?.teacherId}
                />
              )}

              {activeTab === 'teaching' && (
                <TeachingHoursTab 
                  teachers={teachers}
                  teachingLogs={teachingLogs}
                  academicYears={academicYears}
                  selectedYear={selectedYear}
                  onAddTeachingLog={handleAddTeachingLog}
                  onEditTeachingLog={handleEditTeachingLog}
                  onDeleteTeachingLog={handleDeleteTeachingLog}
                  userRole={currentUser?.role}
                  currentTeacherId={currentUser?.teacherId}
                />
              )}

              {activeTab === 'research' && (
                <ResearchTab 
                  teachers={teachers}
                  researchLogs={researchLogs}
                  selectedYear={selectedYear}
                  academicYears={academicYears}
                  onAddResearchLog={handleAddResearchLog}
                  onEditResearchLog={handleEditResearchLog}
                  onDeleteResearchLog={handleDeleteResearchLog}
                  onApproveLog={handleApproveResearchLog}
                  userRole={currentUser?.role}
                  currentTeacherId={currentUser?.teacherId}
                />
              )}

              {activeTab === 'standards' && (
                <StandardsTab 
                  teachers={teachers}
                  researchLogs={researchLogs}
                />
              )}

              {activeTab === 'settings' && (
                <DataManagement 
                  rankNorms={rankNorms}
                  academicYears={academicYears}
                  selectedYear={selectedYear}
                  onUpdateNorms={handleUpdateNorms}
                  onSetAcademicYear={handleSetAcademicYear}
                  onAddAcademicYear={handleAddAcademicYear}
                  onResetToDefault={handleResetToDefault}
                  onImportData={handleImportData}
                  onExportData={handleExportData}
                />
              )}

              {activeTab === 'account' && (
                <AccountSecurityTab 
                  teachers={teachers}
                  currentUser={currentUser}
                />
              )}
            </motion.div>
          </LayoutGroup>
        </main>

        {/* Humble, clean professional footer */}
        <footer className="bg-white border-t border-slate-200 py-5 px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-slate-400">
            <div className="flex items-center gap-1">
              <span>© {new Date().getFullYear()} FEMS-Portal. Hệ thống thông tin phân bộ giảng dạy chuẩn khoa.</span>
            </div>

          </div>
        </footer>
      </div>
    </div>
  );
}

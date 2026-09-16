import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useRef,
  ReactNode 
} from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { Student } from '../types/student';
import { SubjectScore, Semester } from '../types/score';
import { ConductRecord } from '../types/conduct';
import { AttendanceRecord } from '../types/attendance';
import { ClassroomInfo } from '../types/class';
import { WeeklyPointTransaction } from '../types/pointTransaction';
import { PointRule } from '../types/pointRule';
import { LearningRecord } from '../types/learning';
import { TimetablePeriod } from '../types/timetable';
import { getOrCreateClassroom, setClassLockStatus } from '../services/classService';
import { batchSeedStudents } from '../services/studentService';
import { batchSaveScores } from '../services/scoreService';
import { batchSeedConduct } from '../services/conductService';
import { seedDefaultPointRulesIfEmpty } from '../services/pointRuleService';
import { 
  SAMPLE_STUDENTS_DATA, 
  generateSampleScores, 
  generateSampleConducts 
} from '../utils/seedData';

export type SyncStatusType = 'saved' | 'syncing' | 'error';

interface ClassContextType {
  classroom: ClassroomInfo | null;
  students: Student[];
  scores: SubjectScore[];
  conductRecords: ConductRecord[];
  pointTransactions: WeeklyPointTransaction[];
  pointRules: PointRule[];
  attendanceRecords: AttendanceRecord[];
  learningRecords: LearningRecord[];
  timetable: TimetablePeriod[];
  loading: boolean;
  error: string | null;
  isRealtimeConnected: boolean;
  syncStatus: SyncStatusType;
  lastSyncedAt: Date | null;
  isDataLocked: boolean;
  selectedGroupFilter: number | 'all';
  setSelectedGroupFilter: (g: number | 'all') => void;
  selectedWeek: number;
  setSelectedWeek: (w: number) => void;
  selectedSemester: Semester;
  setSelectedSemester: (s: Semester) => void;
  toggleDataLock: (locked: boolean) => Promise<void>;
  seedSampleClassData: () => Promise<void>;
  setSyncStatus: (s: SyncStatusType) => void;
  refreshAllData: () => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export function ClassProvider({ children }: { children: ReactNode }) {
  const { currentUser, teacherProfile } = useAuth();
  const { showToast } = useUI();

  const [classroom, setClassroom] = useState<ClassroomInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<SubjectScore[]>([]);
  const [conductRecords, setConductRecords] = useState<ConductRecord[]>([]);
  const [pointTransactions, setPointTransactions] = useState<WeeklyPointTransaction[]>([]);
  const [pointRules, setPointRules] = useState<PointRule[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  const [timetable, setTimetable] = useState<TimetablePeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('saved');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  // Bộ lọc dùng chung toàn ứng dụng
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | 'all'>('all');
  const [selectedWeek, setSelectedWeek] = useState<number>(12);
  const [selectedSemester, setSelectedSemester] = useState<Semester>('HK1');

  const isDataLocked = classroom?.isDataLocked ?? false;
  const isSeedingRulesRef = useRef<boolean>(false);

  // Khởi tạo hoặc lấy lớp của GVCN
  useEffect(() => {
    if (!currentUser) {
      setClassroom(null);
      setStudents([]);
      setScores([]);
      setConductRecords([]);
      setPointTransactions([]);
      setPointRules([]);
      setAttendanceRecords([]);
      setLearningRecords([]);
      setTimetable([]);
      setLoading(false);
      setIsRealtimeConnected(false);
      return;
    }

    let isMounted = true;

    async function initClass() {
      try {
        setLoading(true);
        const classData = await getOrCreateClassroom(
          currentUser!.uid,
          currentUser!.email || '',
          teacherProfile?.displayName || 'Giáo viên Chủ nhiệm'
        );
        if (isMounted) {
          setClassroom(classData);
          setSelectedWeek(classData.currentWeek || 12);
          setSelectedSemester(classData.currentSemester || 'HK1');
        }
      } catch (err: any) {
        console.error('Error init classroom:', err);
        if (isMounted) setError('Không thể tải thông tin lớp chủ nhiệm.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initClass();

    return () => {
      isMounted = false;
    };
  }, [currentUser, teacherProfile]);

  // Thiết lập cơ chế Realtime onSnapshot cho tất cả các collection khi classroom đã có
  useEffect(() => {
    if (!classroom?.id || !currentUser) return;

    const unsubs: Unsubscribe[] = [];
    const classId = classroom.id;

    try {
      // 1. Lắng nghe cập nhật thông tin lớp & trạng thái Khóa/Mở dữ liệu
      const unsubClass = onSnapshot(doc(db, 'classes', classId), (snap) => {
        if (snap.exists()) {
          const data = { ...snap.data(), id: snap.id } as ClassroomInfo;
          setClassroom(data);
          setIsRealtimeConnected(true);
        }
      }, (err) => {
        console.error('Realtime Class error:', err);
        setIsRealtimeConnected(false);
      });
      unsubs.push(unsubClass);

      // 2. Lắng nghe danh sách học sinh theo thời gian thực
      const studentsQuery = query(
        collection(db, 'students'),
        where('classId', '==', classId)
      );
      const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
        const studentList: Student[] = [];
        snapshot.forEach((docSnap) => {
          studentList.push({ ...docSnap.data(), id: docSnap.id } as Student);
        });
        // Sắp xếp theo số thứ tự/mã hoặc họ tên
        studentList.sort((a, b) => a.studentCode.localeCompare(b.studentCode, 'vi'));
        setStudents(studentList);
        setIsRealtimeConnected(true);
      }, (err) => {
        console.error('Realtime Students error:', err);
      });
      unsubs.push(unsubStudents);

      // 3. Lắng nghe bảng điểm học tập theo thời gian thực
      const scoresQuery = query(
        collection(db, 'academic_scores'),
        where('classId', '==', classId)
      );
      const unsubScores = onSnapshot(scoresQuery, (snapshot) => {
        const scoreList: SubjectScore[] = [];
        snapshot.forEach((docSnap) => {
          scoreList.push({ ...docSnap.data(), id: docSnap.id } as SubjectScore);
        });
        setScores(scoreList);
      }, (err) => {
        console.error('Realtime Scores error:', err);
      });
      unsubs.push(unsubScores);

      // 4. Lắng nghe nề nếp, vi phạm & điểm cộng theo thời gian thực
      const conductQuery = query(
        collection(db, 'conduct_records'),
        where('classId', '==', classId)
      );
      const unsubConduct = onSnapshot(conductQuery, (snapshot) => {
        const list: ConductRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as ConductRecord);
        });
        // Sắp xếp mới nhất lên trước
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setConductRecords(list);
      }, (err) => {
        console.error('Realtime Conduct error:', err);
      });
      unsubs.push(unsubConduct);

      // 5. Lắng nghe giao dịch điểm tuần (Weekly Point Transactions) theo thời gian thực
      const txQuery = query(
        collection(db, 'weekly_point_transactions'),
        where('classId', '==', classId)
      );
      const unsubTx = onSnapshot(txQuery, (snapshot) => {
        const list: WeeklyPointTransaction[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as WeeklyPointTransaction);
        });
        // Sắp xếp mới nhất lên trước
        list.sort((a, b) => {
          const dateDiff = (b.date || '').localeCompare(a.date || '');
          if (dateDiff !== 0) return dateDiff;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
        setPointTransactions(list);
        setSyncStatus('saved');
        setLastSyncedAt(new Date());
      }, (err) => {
        console.error('Realtime Point Transactions error:', err);
        setSyncStatus('error');
      });
      unsubs.push(unsubTx);

      // 6. Lắng nghe chuyên cần điểm danh theo thời gian thực
      const attendQuery = query(
        collection(db, 'attendance_records'),
        where('classId', '==', classId)
      );
      const unsubAttend = onSnapshot(attendQuery, (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as AttendanceRecord);
        });
        setAttendanceRecords(list);
      }, (err) => {
        console.error('Realtime Attendance error:', err);
      });
      unsubs.push(unsubAttend);

      // 7. Lắng nghe quy tắc chấm điểm (Point Rules) do GVCN thiết lập
      const rulesQuery = query(
        collection(db, 'point_rules'),
        where('classId', '==', classId)
      );
      const unsubRules = onSnapshot(rulesQuery, (snapshot) => {
        const list: PointRule[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as PointRule);
        });
        // Sắp xếp: quy tắc cộng điểm trước, sau đó theo order, rồi theo tên
        list.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'plus' ? -1 : 1;
          if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
          return a.name.localeCompare(b.name, 'vi');
        });

        // Nếu lớp học chưa có quy tắc nào, tự động khởi tạo bộ quy tắc mẫu
        if (list.length === 0 && !isSeedingRulesRef.current) {
          isSeedingRulesRef.current = true;
          seedDefaultPointRulesIfEmpty(classId, currentUser?.email || 'GVCN')
            .catch(err => {
              console.warn('Auto-seed default point rules error:', err);
            })
            .finally(() => {
              setTimeout(() => {
                isSeedingRulesRef.current = false;
              }, 2000);
            });
        }

        setPointRules(list);
      }, (err) => {
        console.error('Realtime Point Rules error:', err);
      });
      unsubs.push(unsubRules);

      // 8. Lắng nghe hồ sơ theo dõi học tập (Learning Records) theo thời gian thực
      const learningQuery = query(
        collection(db, 'learning_records'),
        where('classId', '==', classId)
      );
      const unsubLearning = onSnapshot(learningQuery, (snapshot) => {
        const list: LearningRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as LearningRecord);
        });
        // Sắp xếp bài kiểm tra mới nhất lên đầu
        list.sort((a, b) => b.date.localeCompare(a.date));
        setLearningRecords(list);
      }, (err) => {
        console.error('Realtime Learning Records error:', err);
      });
      unsubs.push(unsubLearning);

      // 9. Lắng nghe Thời khóa biểu theo thời gian thực
      const timetableQuery = query(
        collection(db, 'timetable'),
        where('classId', '==', classId)
      );
      const unsubTimetable = onSnapshot(timetableQuery, (snapshot) => {
        const list: TimetablePeriod[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as TimetablePeriod);
        });
        list.sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
          if (a.session !== b.session) return a.session === 'morning' ? -1 : 1;
          return a.period - b.period;
        });
        setTimetable(list);
      }, (err) => {
        console.error('Realtime Timetable error:', err);
      });
      unsubs.push(unsubTimetable);

    } catch (err: any) {
      console.error('Setup realtime listeners error:', err);
      setError('Lỗi kết nối cơ sở dữ liệu thời gian thực.');
      setIsRealtimeConnected(false);
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [classroom?.id, currentUser?.uid]);

  // Cập nhật lại toàn bộ từ Firestore (dùng sau khi Restore hoặc đồng bộ cưỡng bức)
  const refreshAllData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setSyncStatus('syncing');
      setLoading(true);
      const classData = await getOrCreateClassroom(
        currentUser.uid,
        currentUser.email || '',
        teacherProfile?.displayName || 'Giáo viên Chủ nhiệm'
      );
      setClassroom(classData);
      setSyncStatus('saved');
      setLastSyncedAt(new Date());
    } catch (err: any) {
      console.error('Refresh all data error:', err);
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, teacherProfile]);

  // Chức năng Khóa/Mở dữ liệu (Chỉ GVCN)
  const toggleDataLock = useCallback(async (locked: boolean) => {
    if (!classroom?.id) return;
    try {
      await setClassLockStatus(classroom.id, locked);
      showToast(
        locked ? 'warning' : 'success',
        locked ? 'Đã khóa sổ dữ liệu' : 'Đã mở khóa dữ liệu',
        locked 
          ? 'Tất cả thao tác nhập sửa điểm, xóa học sinh và nề nếp đã bị tạm khóa.'
          : 'GVCN có thể tiếp tục nhập, chỉnh sửa điểm và hồ sơ học sinh.'
      );
    } catch (err: any) {
      console.error('Toggle lock error:', err);
      showToast('error', 'Không thể cập nhật trạng thái khóa sổ', err.message);
    }
  }, [classroom?.id, showToast]);

  // Khởi tạo nhanh dữ liệu mẫu lớp THPT
  const seedSampleClassData = useCallback(async () => {
    if (!classroom?.id) return;
    try {
      setLoading(true);
      await batchSeedStudents(classroom.id, SAMPLE_STUDENTS_DATA);
      showToast('success', 'Khởi tạo thành công 20 học sinh THPT mẫu chia đều 4 tổ!');
    } catch (err: any) {
      console.error('Seed data error:', err);
      showToast('error', 'Lỗi khi tạo dữ liệu mẫu', err.message);
    } finally {
      setLoading(false);
    }
  }, [classroom?.id, showToast]);

  return (
    <ClassContext.Provider
      value={{
        classroom,
        students,
        scores,
        conductRecords,
        pointTransactions,
        pointRules,
        attendanceRecords,
        learningRecords,
        timetable,
        loading,
        error,
        isRealtimeConnected,
        syncStatus,
        lastSyncedAt,
        isDataLocked,
        selectedGroupFilter,
        setSelectedGroupFilter,
        selectedWeek,
        setSelectedWeek,
        selectedSemester,
        setSelectedSemester,
        toggleDataLock,
        seedSampleClassData,
        setSyncStatus,
        refreshAllData,
      }}
    >
      {children}
    </ClassContext.Provider>
  );
}

export function useClass() {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClass must be used within ClassProvider');
  }
  return context;
}

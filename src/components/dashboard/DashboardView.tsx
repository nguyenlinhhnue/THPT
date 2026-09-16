import React, { useState, useEffect, useMemo } from 'react';
import { useClass } from '../../context/ClassContext';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Trophy, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  PlusCircle, 
  Calendar, 
  BookOpen,
  Filter,
  ChevronLeft,
  ChevronRight,
  School,
  Sparkles,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { GroupStatisticsCard, GroupStatData } from './GroupStatisticsCard';
import { ConductStatisticsCard, ViolationStatItem } from './ConductStatisticsCard';
import { AcademicStatisticsCard, AcademicGradeDistribution } from './AcademicStatisticsCard';
import { WeeklyClassificationSummary } from './WeeklyClassificationSummary';
import { MonthlyClassificationSummary } from './MonthlyClassificationSummary';
import { AttentionStudentsModal, AttentionStudentItem } from './AttentionStudentsModal';
import { 
  ClassificationCriteriaConfig, 
  DEFAULT_CLASSIFICATION_CONFIG,
  StudentClassificationResult
} from '../../types/classification';
import { 
  calculateClassifications, 
  subscribeClassificationConfig 
} from '../../services/classificationService';
import { Semester } from '../../types/score';

// Danh sách các tháng trong năm học THPT (Tháng 9 đến Tháng 5 năm sau)
const SCHOOL_MONTHS = [
  { value: '2026-09', label: 'Tháng 9/2026', shortLabel: 'Th.9' },
  { value: '2026-10', label: 'Tháng 10/2026', shortLabel: 'Th.10' },
  { value: '2026-11', label: 'Tháng 11/2026', shortLabel: 'Th.11' },
  { value: '2026-12', label: 'Tháng 12/2026', shortLabel: 'Th.12' },
  { value: '2027-01', label: 'Tháng 01/2027', shortLabel: 'Th.1' },
  { value: '2027-02', label: 'Tháng 02/2027', shortLabel: 'Th.2' },
  { value: '2027-03', label: 'Tháng 03/2027', shortLabel: 'Th.3' },
  { value: '2027-04', label: 'Tháng 04/2027', shortLabel: 'Th.4' },
  { value: '2027-05', label: 'Tháng 05/2027', shortLabel: 'Th.5' },
];

export function DashboardView() {
  const { 
    classroom, 
    students, 
    conductRecords, 
    pointTransactions, 
    pointRules,
    learningRecords,
    scores,
    selectedWeek, 
    setSelectedWeek,
    selectedSemester,
    setSelectedSemester,
    isDataLocked,
    seedSampleClassData 
  } = useClass();

  const { setActiveTab } = useUI();
  const { currentUser, teacherProfile } = useAuth();

  // Chế độ lọc phân tích của Dashboard: 'week' | 'month' | 'semester'
  const [filterMode, setFilterMode] = useState<'week' | 'month' | 'semester'>('week');
  
  // Bộ lọc thời gian
  const [currentWeek, setCurrentWeek] = useState<number>(selectedWeek || 12);
  const [currentMonth, setCurrentMonth] = useState<string>('2026-10');
  const [currentSemester, setCurrentSemester] = useState<Semester>(selectedSemester || 'HK1');

  // Cấu hình xếp loại (lắng nghe realtime từ Firestore)
  const [classificationConfig, setClassificationConfig] = useState<ClassificationCriteriaConfig>({
    ...DEFAULT_CLASSIFICATION_CONFIG,
    classId: classroom?.id || 'default_class',
  });

  // Modal hiển thị danh sách học sinh cần lưu ý
  const [isAttentionModalOpen, setIsAttentionModalOpen] = useState(false);

  // Đăng ký lắng nghe cấu hình xếp loại realtime
  useEffect(() => {
    if (!classroom?.id) return;
    const unsub = subscribeClassificationConfig(classroom.id, (cfg) => {
      setClassificationConfig(cfg);
    });
    return () => unsub();
  }, [classroom?.id]);

  // Đồng bộ tuần khi selectedWeek thay đổi
  useEffect(() => {
    if (selectedWeek && selectedWeek !== currentWeek) {
      setCurrentWeek(selectedWeek);
    }
  }, [selectedWeek]);

  // Nhãn thời gian của phạm vi lọc hiện tại
  const currentPeriodLabel = useMemo(() => {
    if (filterMode === 'week') return `Tuần ${currentWeek}`;
    if (filterMode === 'month') {
      const m = SCHOOL_MONTHS.find(item => item.value === currentMonth);
      return m ? m.label : currentMonth;
    }
    return currentSemester === 'HK1' 
      ? 'Học kỳ 1' 
      : currentSemester === 'HK2' 
      ? 'Học kỳ 2' 
      : 'Cả năm học';
  }, [filterMode, currentWeek, currentMonth, currentSemester]);

  // =========================================================================
  // 1. TÍNH TOÁN DỮ LIỆU GIAO DỊCH VÀ BÀI KIỂM TRA THEO BỘ LỌC ĐANG CHỌN
  // Tuyệt đối không lưu thống kê riêng, mọi thứ trích xuất live từ state hiện tại
  // =========================================================================

  // Các giao dịch điểm nề nếp hợp lệ trong kỳ lọc
  const filteredTransactions = useMemo(() => {
    const valid = pointTransactions.filter(t => t.status === 'valid');
    if (filterMode === 'week') {
      return valid.filter(t => t.weekNumber === currentWeek);
    }
    if (filterMode === 'month') {
      return valid.filter(t => t.date && t.date.startsWith(currentMonth));
    }
    // Semester
    return valid.filter(t => {
      if (t.semester) {
        return currentSemester === 'CaNam' || t.semester === currentSemester;
      }
      if (t.weekNumber) {
        if (currentSemester === 'HK1') return t.weekNumber >= 1 && t.weekNumber <= 18;
        if (currentSemester === 'HK2') return t.weekNumber >= 19 && t.weekNumber <= 35;
        return true;
      }
      return true;
    });
  }, [pointTransactions, filterMode, currentWeek, currentMonth, currentSemester]);

  // Các bài kiểm tra học tập trong kỳ lọc
  const filteredLearningRecords = useMemo(() => {
    if (filterMode === 'week') {
      return learningRecords.filter(r => r.weekNumber === currentWeek);
    }
    if (filterMode === 'month') {
      return learningRecords.filter(r => 
        (r.date && r.date.startsWith(currentMonth)) || (r.month === currentMonth)
      );
    }
    // Semester
    return learningRecords.filter(r => {
      if (currentSemester === 'CaNam') return true;
      return r.semester === currentSemester;
    });
  }, [learningRecords, filterMode, currentWeek, currentMonth, currentSemester]);

  // =========================================================================
  // 2. TÍNH TOÁN CÁC CHỈ SỐ CƠ BẢN TOÀN LỚP (REALTIME)
  // =========================================================================
  const totalStudents = students.length;
  const activeStudentsCount = students.filter(s => s.status === 'dang_hoc' || !s.status).length;
  const otherStatusCount = totalStudents - activeStudentsCount;
  const maleCount = students.filter(s => s.gender === 'nam').length;
  const femaleCount = students.filter(s => s.gender === 'nu').length;
  const unionMembers = students.filter(s => s.isUnionMember).length;
  const basePoints = classroom?.baseCompetitionPoints || 100;

  // Điểm rèn luyện của từng học sinh trong kỳ lọc
  const studentConductScoresMap = useMemo(() => {
    const map = new Map<string, {
      conductScore: number;
      plusPoints: number;
      minusPoints: number;
      violationsCount: number;
      rewardsCount: number;
    }>();

    students.forEach(s => {
      map.set(s.id, {
        conductScore: basePoints,
        plusPoints: 0,
        minusPoints: 0,
        violationsCount: 0,
        rewardsCount: 0,
      });
    });

    filteredTransactions.forEach(t => {
      const current = map.get(t.studentId);
      if (current) {
        const absScore = Math.abs(t.score);
        if (t.score > 0 || t.type === 'plus') {
          current.plusPoints += absScore;
          current.rewardsCount++;
        } else if (t.score < 0 || t.type === 'minus') {
          current.minusPoints += absScore;
          current.violationsCount++;
        }
        current.conductScore = basePoints + current.plusPoints - current.minusPoints;
      }
    });

    return map;
  }, [students, filteredTransactions, basePoints]);

  // Điểm trung bình rèn luyện toàn lớp
  const classAvgConductScore = useMemo(() => {
    if (students.length === 0) return basePoints;
    let sum = 0;
    students.forEach(s => {
      const stats = studentConductScoresMap.get(s.id);
      sum += stats ? stats.conductScore : basePoints;
    });
    return Math.round((sum / students.length) * 10) / 10;
  }, [students, studentConductScoresMap, basePoints]);

  // Điểm trung bình học tập toàn lớp (thang điểm 10)
  const classAvgAcademicScore = useMemo(() => {
    if (filteredLearningRecords.length === 0) return null;
    const sum = filteredLearningRecords.reduce((acc, r) => acc + (r.score || 0), 0);
    return Math.round((sum / filteredLearningRecords.length) * 100) / 100;
  }, [filteredLearningRecords]);

  // =========================================================================
  // 3. TÍNH TOÁN DANH SÁCH HỌC SINH CẦN LƯU Ý
  // =========================================================================
  const attentionStudentsList: AttentionStudentItem[] = useMemo(() => {
    const list: AttentionStudentItem[] = [];

    // Nhóm bài kiểm tra theo studentId
    const studentAssessmentsMap = new Map<string, number[]>();
    const studentSupportNeededMap = new Map<string, string[]>();

    filteredLearningRecords.forEach(r => {
      const scoresArr = studentAssessmentsMap.get(r.studentId) || [];
      scoresArr.push(r.score);
      studentAssessmentsMap.set(r.studentId, scoresArr);

      if (r.supportNeeded && r.supportNeeded.trim()) {
        const supportArr = studentSupportNeededMap.get(r.studentId) || [];
        supportArr.push(r.supportNeeded);
        studentSupportNeededMap.set(r.studentId, supportArr);
      }
    });

    students.forEach(s => {
      const conduct = studentConductScoresMap.get(s.id) || {
        conductScore: basePoints,
        plusPoints: 0,
        minusPoints: 0,
        violationsCount: 0,
        rewardsCount: 0,
      };

      const academicScores = studentAssessmentsMap.get(s.id) || [];
      const academicAvg = academicScores.length > 0 
        ? academicScores.reduce((a, b) => a + b, 0) / academicScores.length 
        : null;

      const supportIssues = studentSupportNeededMap.get(s.id) || [];
      const reasons: string[] = [];

      // Điều kiện cảnh báo 1: Điểm rèn luyện < 80 hoặc trừ nhiều
      if (conduct.conductScore < 80) {
        reasons.push(`Điểm rèn luyện thấp (${conduct.conductScore} đ)`);
      }

      // Điều kiện cảnh báo 2: Vi phạm từ 2 lần trở lên trong kỳ
      if (conduct.violationsCount >= 2) {
        reasons.push(`${conduct.violationsCount} lượt vi phạm nề nếp`);
      }

      // Điều kiện cảnh báo 3: ĐTB học tập < 5.0
      if (academicAvg !== null && academicAvg < 5.0) {
        reasons.push(`ĐTB học tập chưa đạt (${academicAvg.toFixed(1)}/10)`);
      }

      // Điều kiện cảnh báo 4: Có ghi nhận cần hỗ trợ bồi dưỡng
      if (supportIssues.length > 0) {
        reasons.push(`Cần hỗ trợ phụ đạo (${supportIssues.length} môn)`);
      }

      // Điều kiện cảnh báo 5: Học sinh có trạng thái không bình thường
      if (s.status && s.status !== 'dang_hoc') {
        reasons.push(`Trạng thái: ${s.status === 'nghi_hoc' ? 'Nghỉ học' : 'Chuyển lớp'}`);
      }

      if (reasons.length > 0) {
        list.push({
          student: s,
          conductScore: conduct.conductScore,
          violationsCount: conduct.violationsCount,
          rewardsCount: conduct.rewardsCount,
          academicAvg,
          academicSupportNeededCount: supportIssues.length,
          academicIssues: supportIssues,
          conductIssues: [],
          reasons,
        });
      }
    });

    // Sắp xếp học sinh cần lưu ý: Điểm rèn luyện thấp nhất lên đầu
    return list.sort((a, b) => a.conductScore - b.conductScore);
  }, [students, studentConductScoresMap, filteredLearningRecords, basePoints]);

  const attentionStudentsCount = attentionStudentsList.length;

  // =========================================================================
  // 4. THỐNG KÊ CHI TIẾT THEO CÁC TỔ (ĐỘNG TỪ CLASSROOM HOẶC MẶC ĐỊNH 4 TỔ)
  // Tự động thích ứng tức thì khi học sinh chuyển tổ!
  // =========================================================================
  const groupsStatisticsData: GroupStatData[] = useMemo(() => {
    const totalGroupsCount = classroom?.totalGroups || 4;
    const groupNums = Array.from({ length: totalGroupsCount }, (_, i) => i + 1);

    const groups: GroupStatData[] = groupNums.map(gNum => {
      const groupStudents = students.filter(s => s.groupNumber === gNum);
      const groupTx = filteredTransactions.filter(t => {
        // Tra cứu theo student hiện tại để đảm bảo chuyển tổ realtime, nếu học sinh đã xóa thì dùng snapshot
        const s = students.find(item => item.id === t.studentId);
        const currentGroup = s ? s.groupNumber : t.groupNumberSnapshot;
        return currentGroup === gNum;
      });

      let plus = 0;
      let minus = 0;
      let violations = 0;
      let rewards = 0;

      groupTx.forEach(t => {
        const absScore = Math.abs(t.score);
        if (t.score > 0 || t.type === 'plus') {
          plus += absScore;
          rewards++;
        } else if (t.score < 0 || t.type === 'minus') {
          minus += absScore;
          violations++;
        }
      });

      const totalCompetitionPoints = basePoints + plus - minus;

      // Điểm TB rèn luyện tổ
      let sumConduct = 0;
      groupStudents.forEach(s => {
        const stats = studentConductScoresMap.get(s.id);
        sumConduct += stats ? stats.conductScore : basePoints;
      });
      const avgConductScore = groupStudents.length > 0 
        ? sumConduct / groupStudents.length 
        : basePoints;

      // Điểm TB học tập tổ
      const groupAssessments = filteredLearningRecords.filter(r => {
        const s = students.find(item => item.id === r.studentId);
        const currentGroup = s ? s.groupNumber : r.groupNumberSnapshot;
        return currentGroup === gNum;
      });

      const avgAcademicScore = groupAssessments.length > 0
        ? groupAssessments.reduce((acc, r) => acc + (r.score || 0), 0) / groupAssessments.length
        : null;

      return {
        groupNumber: gNum,
        studentsCount: groupStudents.length,
        totalCompetitionPoints,
        plusPoints: plus,
        minusPoints: minus,
        violationsCount: violations,
        rewardsCount: rewards,
        avgConductScore,
        avgAcademicScore,
        academicAssessmentsCount: groupAssessments.length,
        rank: 1, // Sẽ tính bên dưới
      };
    });

    // Tính thứ hạng thi đua tổ (Điểm cao hơn xếp trên, nếu bằng điểm xét ít vi phạm hơn)
    const sorted = [...groups].sort((a, b) => {
      if (b.totalCompetitionPoints !== a.totalCompetitionPoints) {
        return b.totalCompetitionPoints - a.totalCompetitionPoints;
      }
      return a.violationsCount - b.violationsCount;
    });

    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });

    return groups;
  }, [students, filteredTransactions, filteredLearningRecords, basePoints, studentConductScoresMap]);

  // =========================================================================
  // 5. THỐNG KÊ RÈN LUYỆN & TOP LỖI VI PHẠM
  // =========================================================================
  const conductStats = useMemo(() => {
    let totalViolations = 0;
    let totalRewards = 0;
    let totalMinusPoints = 0;
    let totalPlusPoints = 0;

    // Thống kê lỗi vi phạm theo quy tắc
    const ruleViolationsMap = new Map<string, { count: number; totalPoints: number; name: string }>();

    filteredTransactions.forEach(t => {
      const absScore = Math.abs(t.score);
      if (t.score < 0 || t.type === 'minus') {
        totalViolations++;
        totalMinusPoints += absScore;

        const key = t.ruleSnapshot?.label || t.reason || 'Vi phạm nề nếp khác';
        const curr = ruleViolationsMap.get(key) || { count: 0, totalPoints: 0, name: key };
        curr.count++;
        curr.totalPoints += absScore;
        ruleViolationsMap.set(key, curr);
      } else if (t.score > 0 || t.type === 'plus') {
        totalRewards++;
        totalPlusPoints += absScore;
      }
    });

    const topViolations: ViolationStatItem[] = Array.from(ruleViolationsMap.entries())
      .map(([key, data]) => ({
        ruleId: key,
        ruleName: data.name,
        count: data.count,
        totalPoints: data.totalPoints,
        percentage: totalViolations > 0 ? Math.round((data.count / totalViolations) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalViolations,
      totalRewards,
      totalMinusPoints,
      totalPlusPoints,
      topViolations,
      recentTransactions: [...filteredTransactions]
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 5),
    };
  }, [filteredTransactions]);

  // =========================================================================
  // 6. THỐNG KÊ HỌC TẬP & PHỔ ĐIỂM
  // =========================================================================
  const academicDistribution: AcademicGradeDistribution = useMemo(() => {
    let excellentCount = 0;
    let goodCount = 0;
    let averageCount = 0;
    let weakCount = 0;
    let praisedCount = 0;
    let supportNeededCount = 0;

    filteredLearningRecords.forEach(r => {
      const score = r.score;
      if (score >= 8.0) excellentCount++;
      else if (score >= 6.5) goodCount++;
      else if (score >= 5.0) averageCount++;
      else weakCount++;

      if (r.achievement || score >= 9.0) praisedCount++;
      if (r.supportNeeded && r.supportNeeded.trim()) supportNeededCount++;
    });

    return {
      totalAssessments: filteredLearningRecords.length,
      classAvgScore: classAvgAcademicScore,
      excellentCount,
      goodCount,
      averageCount,
      weakCount,
      praisedCount,
      supportNeededCount,
    };
  }, [filteredLearningRecords, classAvgAcademicScore]);

  // =========================================================================
  // 7. XẾP LOẠI TUẦN & XẾP LOẠI THÁNG (TÍNH TOÁN TRỰC TIẾP TỪ NGUỒN GỐC)
  // =========================================================================
  // Kết quả xếp loại cho Tuần được chọn
  const weeklyClassificationResults = useMemo(() => {
    return calculateClassifications({
      periodType: 'week',
      selectedWeek: currentWeek,
      selectedMonth: currentMonth,
      selectedSemester: currentSemester,
      config: classificationConfig,
      basePoints,
      students,
      transactions: pointTransactions,
      learningRecords,
    });
  }, [currentWeek, currentMonth, currentSemester, classificationConfig, basePoints, students, pointTransactions, learningRecords]);

  // Kết quả xếp loại cho Tháng được chọn
  const monthlyClassificationResults = useMemo(() => {
    return calculateClassifications({
      periodType: 'month',
      selectedWeek: currentWeek,
      selectedMonth: currentMonth,
      selectedSemester: currentSemester,
      config: classificationConfig,
      basePoints,
      students,
      transactions: pointTransactions,
      learningRecords,
    });
  }, [currentWeek, currentMonth, currentSemester, classificationConfig, basePoints, students, pointTransactions, learningRecords]);

  // Tên giáo viên chủ nhiệm & thông tin lớp
  const teacherName = classroom?.homeroomTeacher || teacherProfile?.fullName || currentUser?.displayName || 'Thầy/Cô Chủ Nhiệm';
  const className = classroom?.className || '12A1';
  const schoolName = classroom?.schoolName || 'Trường THPT';
  const schoolYear = classroom?.schoolYear || '2025 - 2026';

  // Nếu lớp chưa có học sinh nào, hiển thị màn hình hướng dẫn khởi tạo
  if (totalStudents === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-teal-900 to-emerald-800 text-white rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <School className="w-6 h-6 text-teal-300" />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-800/80 text-teal-200 border border-teal-700">
              Năm học {schoolYear}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Bàn Điều Hành Chủ Nhiệm — Lớp {className}
          </h2>
          <p className="mt-1 text-sm text-teal-100 max-w-xl leading-relaxed">
            Giáo viên chủ nhiệm: <strong className="text-white">{teacherName}</strong> • {schoolName}
          </p>
        </div>

        <EmptyState
          title="Lớp học chưa có dữ liệu học sinh"
          description="Thầy/Cô có thể tạo từng học sinh thủ công trong mục Hồ sơ Học sinh, hoặc nhấn nút Khởi tạo dữ liệu mẫu THPT (gồm 20 học sinh chia đều 4 tổ) để trải nghiệm toàn diện hệ thống quản lý nề nếp & học tập ngay lập tức."
          actionLabel="Khởi tạo 20 học sinh THPT mẫu"
          onAction={seedSampleClassData}
          secondaryAction={
            <button
              onClick={() => setActiveTab('students')}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Thêm học sinh thủ công
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* A. HEADER CHÍNH: TÊN LỚP, GVCN, NĂM HỌC & TRẠNG THÁI ĐỒNG BỘ REALTIME */}
      {/* =================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-50 text-teal-800 border border-teal-200">
                <School className="w-3.5 h-3.5 text-teal-600" />
                Lớp {className}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Năm học {schoolYear}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đồng bộ Realtime
              </span>
              {isDataLocked && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Sổ đang khóa bảo mật
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
              Bảng Điều Hành Tổng Quan — Lớp {className}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
              <span>GVCN: <strong className="text-slate-800 font-bold">{teacherName}</strong></span>
              <span>•</span>
              <span>{schoolName}</span>
              <span>•</span>
              <span className="text-slate-500">Dữ liệu nguồn gốc trực tiếp từ nề nếp & học tập</span>
            </p>
          </div>

          {/* Nút hành động nhanh */}
          <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">
            <button
              onClick={() => setActiveTab('weekly_points')}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nhập Điểm Tuần</span>
            </button>

            <button
              onClick={() => setActiveTab('classification')}
              className="px-3.5 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-teal-700" />
              <span>Sổ Xếp Loại</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* B. BỘ LỌC ĐA NĂNG: TUẦN / THÁNG / HỌC KỲ                           */}
        {/* =================================================================== */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              Bộ lọc:
            </span>

            {/* Selector chế độ lọc: Tuần / Tháng / Học kỳ */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterMode('week')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'week'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo Tuần
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'month'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo Tháng
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('semester')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'semester'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo Học Kỳ
              </button>
            </div>
          </div>

          {/* Các điều khiển con theo từng chế độ lọc */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {filterMode === 'week' && (
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, currentWeek - 1);
                    setCurrentWeek(next);
                    setSelectedWeek(next);
                  }}
                  disabled={currentWeek <= 1}
                  className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Tuần trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={currentWeek}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    setCurrentWeek(w);
                    setSelectedWeek(w);
                  }}
                  className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  {Array.from({ length: 35 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tuần {i + 1} {i + 1 <= 18 ? '(HK1)' : '(HK2)'}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(35, currentWeek + 1);
                    setCurrentWeek(next);
                    setSelectedWeek(next);
                  }}
                  disabled={currentWeek >= 35}
                  className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Tuần sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {filterMode === 'month' && (
              <div className="flex items-center gap-2">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  {SCHOOL_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterMode === 'semester' && (
              <div className="inline-flex rounded-xl bg-slate-50 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSemester('HK1');
                    setSelectedSemester('HK1');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    currentSemester === 'HK1' 
                      ? 'bg-teal-700 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Học kỳ 1 (Tuần 1-18)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSemester('HK2');
                    setSelectedSemester('HK2');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    currentSemester === 'HK2' 
                      ? 'bg-teal-700 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Học kỳ 2 (Tuần 19-35)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSemester('CaNam');
                    setSelectedSemester('CaNam');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    currentSemester === 'CaNam' 
                      ? 'bg-teal-700 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cả năm
                </button>
              </div>
            )}

            <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 hidden sm:block">
              Đang xem: <strong className="text-teal-900">{currentPeriodLabel}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* C. 4 THẺ THỐNG KÊ TRỌNG TÂM: SĨ SỐ, ĐANG HỌC, LƯU Ý, ĐIỂM TB LỚP     */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Sĩ số & Học sinh đang học */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sĩ Số & Tình Trạng
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
              <span className="text-xs text-slate-500">học sinh</span>
            </div>

            <div className="mt-2 text-xs text-slate-600 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeStudentsCount} đang học
              </span>
              {otherStatusCount > 0 && (
                <span className="text-slate-400">({otherStatusCount} chuyển/nghỉ)</span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Nam: <strong className="text-slate-800">{maleCount}</strong> • Nữ: <strong className="text-slate-800">{femaleCount}</strong></span>
            <span>Đoàn: <strong className="text-teal-700">{unionMembers}</strong></span>
          </div>
        </div>

        {/* Thẻ 2: Số học sinh cần lưu ý (Click để mở modal danh sách) */}
        <div 
          onClick={() => setIsAttentionModalOpen(true)}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 hover:shadow-sm cursor-pointer transition-all group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-800 transition-colors">
                Học Sinh Cần Lưu Ý
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black ${attentionStudentsCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {attentionStudentsCount}
              </span>
              <span className="text-xs text-slate-500">em cần quan tâm</span>
            </div>

            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              {attentionStudentsCount === 0 
                ? 'Tuyệt vời! Không có học sinh thuộc diện cảnh báo' 
                : 'Điểm rèn luyện thấp, vi phạm nề nếp hoặc cần phụ đạo'}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800 font-semibold group-hover:text-amber-900">
            <span>Bấm để xem chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Thẻ 3: Điểm trung bình rèn luyện lớp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ĐTB Rèn Luyện Lớp
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{classAvgConductScore}</span>
              <span className="text-xs text-slate-500">/ {basePoints} điểm chuẩn</span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="text-emerald-700 font-medium">
                +{conductStats.totalPlusPoints} thưởng
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-600 font-medium">
                -{conductStats.totalMinusPoints} phạt
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Đánh giá chung:</span>
            <span className="font-bold text-emerald-800">
              {classAvgConductScore >= 90 ? 'Xuất sắc' : classAvgConductScore >= 80 ? 'Tốt' : classAvgConductScore >= 65 ? 'Khá' : 'Cần chấn chỉnh'}
            </span>
          </div>
        </div>

        {/* Thẻ 4: Điểm trung bình học tập lớp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ĐTB Học Tập Lớp
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-teal-800">
                {classAvgAcademicScore !== null ? classAvgAcademicScore.toFixed(2) : '—'}
              </span>
              <span className="text-xs text-slate-500">/ 10 điểm</span>
            </div>

            <div className="mt-2 text-xs text-slate-500">
              {filteredLearningRecords.length > 0 ? (
                <span>Tổng hợp từ <strong className="text-slate-800">{filteredLearningRecords.length}</strong> bài kiểm tra</span>
              ) : (
                <span>Chưa có bài kiểm tra nào trong kỳ</span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Học lực dự kiến:</span>
            <span className="font-bold text-teal-900">
              {classAvgAcademicScore !== null && classAvgAcademicScore >= 8.0 ? 'Giỏi' :
               classAvgAcademicScore !== null && classAvgAcademicScore >= 6.5 ? 'Khá' :
               classAvgAcademicScore !== null && classAvgAcademicScore >= 5.0 ? 'Đạt' : 'Cần bồi dưỡng'}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* D. THỐNG KÊ THEO TỔ: 4 TỔ ĐUA ĐIỂM, SĨ SỐ, VI PHẠM, KHEN THƯỞNG, ĐTB */}
      {/* =================================================================== */}
      <GroupStatisticsCard
        groupsData={groupsStatisticsData}
        basePoints={basePoints}
        periodLabel={currentPeriodLabel}
        onViewCompetitionDetails={() => setActiveTab('competition')}
      />

      {/* =================================================================== */}
      {/* E. 2 KHỐI XẾP LOẠI: XẾP LOẠI TUẦN & XẾP LOẠI THÁNG                    */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Xếp loại tuần */}
        <WeeklyClassificationSummary
          weekNumber={currentWeek}
          results={weeklyClassificationResults}
          config={classificationConfig}
          onViewDetailedClassification={() => setActiveTab('classification')}
        />

        {/* Xếp loại tháng */}
        <MonthlyClassificationSummary
          selectedMonth={currentMonth}
          monthLabel={SCHOOL_MONTHS.find(m => m.value === currentMonth)?.label || currentMonth}
          results={monthlyClassificationResults}
          config={classificationConfig}
          onViewDetailedClassification={() => setActiveTab('classification')}
        />
      </div>

      {/* =================================================================== */}
      {/* F. THỐNG KÊ RÈN LUYỆN & THỐNG KÊ HỌC TẬP                             */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thống kê rèn luyện */}
        <ConductStatisticsCard
          totalViolations={conductStats.totalViolations}
          totalRewards={conductStats.totalRewards}
          totalMinusPoints={conductStats.totalMinusPoints}
          totalPlusPoints={conductStats.totalPlusPoints}
          topViolations={conductStats.topViolations}
          recentTransactions={conductStats.recentTransactions}
          students={students}
          periodLabel={currentPeriodLabel}
          onViewConductDetails={() => setActiveTab('conduct')}
          onRecordNewConduct={() => setActiveTab('weekly_points')}
        />

        {/* Thống kê học tập */}
        <AcademicStatisticsCard
          distribution={academicDistribution}
          recentLearningRecords={filteredLearningRecords.slice(0, 5)}
          students={students}
          periodLabel={currentPeriodLabel}
          onViewLearningDetails={() => setActiveTab('learning')}
          onAddNewAssessment={() => setActiveTab('learning')}
        />
      </div>

      {/* =================================================================== */}
      {/* G. MODAL XEM NHANH DANH SÁCH HỌC SINH CẦN LƯU Ý                     */}
      {/* =================================================================== */}
      <AttentionStudentsModal
        isOpen={isAttentionModalOpen}
        onClose={() => setIsAttentionModalOpen(false)}
        attentionList={attentionStudentsList}
        periodLabel={currentPeriodLabel}
        onNavigateToStudent={(studentId) => {
          setActiveTab('students');
        }}
        onNavigateToConduct={() => {
          setActiveTab('conduct');
        }}
      />
    </div>
  );
}

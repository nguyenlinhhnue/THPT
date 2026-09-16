import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student } from '../types/student';
import { WeeklyPointTransaction } from '../types/pointTransaction';
import { LearningRecord } from '../types/learning';
import { Semester } from '../types/score';
import { 
  ClassificationPeriodType, 
  ClassificationTier, 
  ClassificationCriteriaConfig, 
  StudentClassificationResult, 
  OfficialClassificationDoc, 
  DEFAULT_CLASSIFICATION_CONFIG 
} from '../types/classification';

const CONFIGS_COLLECTION = 'classification_configs';
const OFFICIAL_COLLECTION = 'official_classifications';

/**
 * Lấy cấu hình thang điểm và điều kiện xếp loại của lớp từ Firestore
 */
export async function getClassificationConfig(classId: string): Promise<ClassificationCriteriaConfig> {
  try {
    const configRef = doc(db, CONFIGS_COLLECTION, classId);
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      return snap.data() as ClassificationCriteriaConfig;
    }
  } catch (err) {
    console.warn('Get classification config fallback to default:', err);
  }

  return {
    ...DEFAULT_CLASSIFICATION_CONFIG,
    classId,
  };
}

/**
 * Lưu cấu hình thang điểm và điều kiện xếp loại (GVCN tùy chỉnh)
 */
export async function saveClassificationConfig(
  classId: string, 
  config: ClassificationCriteriaConfig,
  teacherEmail: string
): Promise<void> {
  const configRef = doc(db, CONFIGS_COLLECTION, classId);
  const dataToSave: ClassificationCriteriaConfig = {
    ...config,
    classId,
    // Đảm bảo các tier được sắp xếp giảm dần theo minScore
    tiers: [...config.tiers].sort((a, b) => b.minScore - a.minScore),
    updatedAt: new Date().toISOString(),
    updatedBy: teacherEmail,
  };
  await setDoc(configRef, dataToSave, { merge: true });
}

/**
 * Lắng nghe cấu hình xếp loại realtime
 */
export function subscribeClassificationConfig(
  classId: string,
  onUpdate: (config: ClassificationCriteriaConfig) => void
): () => void {
  const configRef = doc(db, CONFIGS_COLLECTION, classId);
  return onSnapshot(configRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as ClassificationCriteriaConfig);
    } else {
      onUpdate({ ...DEFAULT_CLASSIFICATION_CONFIG, classId });
    }
  }, (err) => {
    console.warn('Lỗi lắng nghe cấu hình xếp loại:', err);
  });
}

interface CalculateOptions {
  students: Student[];
  transactions: WeeklyPointTransaction[];
  learningRecords: LearningRecord[];
  periodType: ClassificationPeriodType;
  selectedWeek: number;
  selectedMonth: string; // 'YYYY-MM' hoặc 'MM'
  selectedSemester: Semester;
  config: ClassificationCriteriaConfig;
  basePoints?: number;
  lockedDoc?: OfficialClassificationDoc | null;
}

/**
 * Tính toán xếp loại trực tiếp từ hệ thống transactions và học tập
 * KHÔNG nhập tay điểm; Đảm bảo tính minh bạch và truy nguyên dữ liệu gốc.
 */
export function calculateClassifications({
  students,
  transactions,
  learningRecords,
  periodType,
  selectedWeek,
  selectedMonth,
  selectedSemester,
  config,
  basePoints = 100,
  lockedDoc,
}: CalculateOptions): StudentClassificationResult[] {
  // 1. Lọc các giao dịch hợp lệ theo chu kỳ thời gian
  const validTransactions = transactions.filter(t => t.status === 'valid');

  let periodTransactions: WeeklyPointTransaction[] = [];
  let periodLearningRecords: LearningRecord[] = [];
  const activeWeeksSet = new Set<number>();

  if (periodType === 'week') {
    periodTransactions = validTransactions.filter(t => t.weekNumber === selectedWeek);
    periodLearningRecords = learningRecords.filter(r => r.weekNumber === selectedWeek);
  } else if (periodType === 'month') {
    periodTransactions = validTransactions.filter(t => {
      if (t.date && t.date.startsWith(selectedMonth)) {
        if (t.weekNumber) activeWeeksSet.add(t.weekNumber);
        return true;
      }
      return false;
    });
    periodLearningRecords = learningRecords.filter(r => {
      if (r.date && r.date.startsWith(selectedMonth)) return true;
      if (r.month === selectedMonth) return true;
      return false;
    });
  } else {
    // Semester
    periodTransactions = validTransactions.filter(t => {
      let matches = false;
      if (t.semester) {
        matches = (selectedSemester === 'CaNam') || (t.semester === selectedSemester);
      } else if (t.weekNumber) {
        if (selectedSemester === 'HK1') {
          matches = t.weekNumber >= 1 && t.weekNumber <= 18;
        } else if (selectedSemester === 'HK2') {
          matches = t.weekNumber >= 19 && t.weekNumber <= 35;
        } else {
          matches = true; // CaNam
        }
      }
      if (matches && t.weekNumber) {
        activeWeeksSet.add(t.weekNumber);
      }
      return matches;
    });
    periodLearningRecords = learningRecords.filter(r => {
      if (selectedSemester === 'CaNam') return true;
      return r.semester === selectedSemester;
    });
  }

  // 2. Kiểm tra điều kiện đủ dữ liệu cấp lớp (Class-level sufficiency)
  let isPeriodClassLevelSufficient = true;
  let classLevelInsufficientReason = '';

  if (periodType === 'month') {
    if (activeWeeksSet.size < config.minWeeksRequiredForMonth) {
      isPeriodClassLevelSufficient = false;
      classLevelInsufficientReason = `Chưa đủ dữ liệu: Mới ghi nhận ${activeWeeksSet.size}/${config.minWeeksRequiredForMonth} tuần hoạt động trong tháng này.`;
    }
  } else if (periodType === 'semester') {
    if (activeWeeksSet.size < config.minWeeksRequiredForSemester) {
      isPeriodClassLevelSufficient = false;
      classLevelInsufficientReason = `Chưa đủ dữ liệu: Mới ghi nhận ${activeWeeksSet.size}/${config.minWeeksRequiredForSemester} tuần hoạt động trong học kỳ.`;
    }
  }

  // Sắp xếp các thang điểm giảm dần
  const sortedTiers = [...config.tiers].sort((a, b) => b.minScore - a.minScore);

  // Map dữ liệu đã khóa (nếu có bản ghi chính thức)
  const lockedResultMap = new Map<string, StudentClassificationResult>();
  if (lockedDoc?.isLocked && lockedDoc.studentResults) {
    lockedDoc.studentResults.forEach(r => {
      lockedResultMap.set(r.studentId, r);
    });
  }

  // 3. Tính toán cho từng học sinh
  return students.map(student => {
    // Lấy transactions của học sinh này trong kỳ
    const studentTxs = periodTransactions.filter(t => t.studentId === student.id);
    const studentLearning = periodLearningRecords.filter(r => r.studentId === student.id);

    // Tính điểm trực tiếp từ transactions
    let totalPlus = 0;
    let totalMinus = 0;
    let violationsCount = 0;
    let rewardsCount = 0;
    const sourceTransactionIds: string[] = [];

    studentTxs.forEach(t => {
      sourceTransactionIds.push(t.id);
      if (t.score > 0 || t.type === 'plus') {
        totalPlus += Math.abs(t.score);
        rewardsCount += 1;
      } else if (t.score < 0 || t.type === 'minus') {
        totalMinus += Math.abs(t.score);
        violationsCount += 1;
      }
    });

    const netScore = Math.round((basePoints + totalPlus - totalMinus) * 10) / 10;

    // Tính kết quả học tập nếu có
    const academicTestsCount = studentLearning.length;
    const academicAchievementsCount = studentLearning.filter(r => r.achievement && r.achievement.trim() !== '').length;
    const academicSupportCount = studentLearning.filter(r => r.supportNeeded && r.supportNeeded.trim() !== '').length;
    let academicScoreAverage: number | undefined = undefined;
    if (academicTestsCount > 0) {
      const sumAcademic = studentLearning.reduce((sum, r) => sum + r.score, 0);
      academicScoreAverage = Math.round((sumAcademic / academicTestsCount) * 10) / 10;
    }

    // 4. Kiểm tra điều kiện đủ dữ liệu của học sinh này
    let isSufficientData = isPeriodClassLevelSufficient;
    let insufficientReason: string | undefined = classLevelInsufficientReason || undefined;

    if (config.requireTransactionsExist && studentTxs.length < config.minTransactionsRequired) {
      isSufficientData = false;
      insufficientReason = `Chưa đủ dữ liệu: Yêu cầu tối thiểu ${config.minTransactionsRequired} giao dịch (hiện có ${studentTxs.length}).`;
    }

    if (config.requireAcademicData && academicTestsCount === 0) {
      isSufficientData = false;
      insufficientReason = 'Chưa đủ dữ liệu: Chưa có điểm kiểm tra học tập nào trong kỳ.';
    }

    // 5. Xác định mức xếp loại
    let rankName = 'Chưa đủ dữ liệu';
    let tierId: string | undefined = undefined;
    let badgeColor = 'slate';

    if (isSufficientData) {
      // Tìm tier phù hợp đầu tiên
      const matchedTier = sortedTiers.find(t => netScore >= t.minScore);
      if (matchedTier) {
        rankName = matchedTier.name;
        tierId = matchedTier.id;
        badgeColor = matchedTier.badgeColor;
      } else {
        // Fallback về tier thấp nhất
        const lowestTier = sortedTiers[sortedTiers.length - 1];
        if (lowestTier) {
          rankName = lowestTier.name;
          tierId = lowestTier.id;
          badgeColor = lowestTier.badgeColor;
        }
      }
    }

    // Nhận xét của GV (Nếu đã khóa, lấy nhận xét từ snapshot)
    const lockedRec = lockedResultMap.get(student.id);
    const teacherComment = lockedRec?.teacherComment || '';

    // Dấu vết truy nguyên dữ liệu gốc
    const traceability = {
      sourceTransactionIds,
      sourceTransactionCount: studentTxs.length,
      sourceSnapshotTimestamp: new Date().toISOString(),
      sourceNetPointsSnapshot: netScore,
      sourceViolationsCountSnapshot: violationsCount,
      sourceRewardsCountSnapshot: rewardsCount,
    };

    // Kiểm tra xem dữ liệu nguồn có bị thay đổi sau khi khóa chính thức hay không
    let hasSourceDataChanged = false;
    let sourceDataChangeDiff: number | undefined = undefined;

    if (lockedDoc?.isLocked && lockedRec) {
      const lockedNet = lockedRec.traceability.sourceNetPointsSnapshot ?? lockedRec.netScore;
      if (Math.abs(netScore - lockedNet) > 0.001 || violationsCount !== lockedRec.traceability.sourceViolationsCountSnapshot) {
        hasSourceDataChanged = true;
        sourceDataChangeDiff = Math.round((netScore - lockedNet) * 10) / 10;
      }
    }

    return {
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentCode,
      stt: student.stt,
      groupNumber: student.groupNumber,
      periodType,
      weekNumber: periodType === 'week' ? selectedWeek : undefined,
      month: periodType === 'month' ? selectedMonth : undefined,
      semester: periodType === 'semester' ? selectedSemester : undefined,
      isSufficientData,
      insufficientReason,
      baseScore: basePoints,
      netScore,
      totalPlusScore: totalPlus,
      totalMinusScore: totalMinus,
      violationsCount,
      rewardsCount,
      academicScoreAverage,
      academicTestsCount,
      academicAchievementsCount,
      academicSupportCount,
      rankName,
      tierId,
      badgeColor,
      teacherComment,
      traceability,
      hasSourceDataChanged,
      sourceDataChangeDiff,
    };
  });
}

/**
 * Tạo Period Key chuẩn định danh bản ghi xếp loại
 */
export function getPeriodKey(periodType: ClassificationPeriodType, week: number, month: string, semester: Semester): string {
  if (periodType === 'week') return `week_${week}`;
  if (periodType === 'month') return `month_${month}`;
  return `semester_${semester}`;
}

export function getPeriodLabel(periodType: ClassificationPeriodType, week: number, month: string, semester: Semester): string {
  if (periodType === 'week') return `Tuần ${week}`;
  if (periodType === 'month') return `Tháng ${month}`;
  return semester === 'HK1' ? 'Học kỳ 1' : semester === 'HK2' ? 'Học kỳ 2' : 'Cả năm';
}

/**
 * Lấy văn bản xếp loại chính thức đã khóa từ Firestore (nếu có)
 */
export async function getOfficialClassification(
  classId: string, 
  periodKey: string
): Promise<OfficialClassificationDoc | null> {
  try {
    const docId = `${classId}_${periodKey}`;
    const snap = await getDoc(doc(db, OFFICIAL_COLLECTION, docId));
    if (snap.exists()) {
      return snap.data() as OfficialClassificationDoc;
    }
  } catch (err) {
    console.error('Error fetching official classification:', err);
  }
  return null;
}

/**
 * Lắng nghe realtime văn bản xếp loại chính thức
 */
export function subscribeOfficialClassification(
  classId: string,
  periodKey: string,
  callback: (docData: OfficialClassificationDoc | null) => void
) {
  const docId = `${classId}_${periodKey}`;
  return onSnapshot(doc(db, OFFICIAL_COLLECTION, docId), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as OfficialClassificationDoc);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error('Realtime official classification error:', err);
  });
}

/**
 * Khóa và ban hành Xếp loại Chính thức
 * Lưu toàn bộ snapshot kết quả kèm transaction IDs để bảo toàn khả năng truy nguyên dữ liệu gốc
 */
export async function lockOfficialClassification(
  classId: string,
  periodType: ClassificationPeriodType,
  periodKey: string,
  periodLabel: string,
  config: ClassificationCriteriaConfig,
  results: StudentClassificationResult[],
  teacherEmail: string,
  teacherName: string
): Promise<void> {
  const docId = `${classId}_${periodKey}`;
  const now = new Date().toISOString();

  // Tính thống kê tổng kết
  const tierCounts: Record<string, number> = {};
  let sufficientCount = 0;
  let insufficientCount = 0;
  let sumScore = 0;

  results.forEach(r => {
    if (r.isSufficientData) {
      sufficientCount += 1;
      sumScore += r.netScore;
      tierCounts[r.rankName] = (tierCounts[r.rankName] || 0) + 1;
    } else {
      insufficientCount += 1;
      tierCounts['Chưa đủ dữ liệu'] = (tierCounts['Chưa đủ dữ liệu'] || 0) + 1;
    }
  });

  const avg = sufficientCount > 0 ? Math.round((sumScore / sufficientCount) * 10) / 10 : 0;

  const officialDoc: OfficialClassificationDoc = {
    id: docId,
    classId,
    periodType,
    periodKey,
    periodLabel,
    isLocked: true,
    lockedAt: now,
    lockedBy: teacherEmail,
    lockedByName: teacherName,
    configSnapshot: config,
    studentResults: results,
    summaryStats: {
      totalStudents: results.length,
      sufficientCount,
      insufficientCount,
      tierCounts,
      averageScore: avg,
    },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, OFFICIAL_COLLECTION, docId), officialDoc);
}

/**
 * Mở khóa xếp loại chính thức (Chỉ GVCN)
 */
export async function unlockOfficialClassification(
  classId: string,
  periodKey: string,
  teacherEmail: string
): Promise<void> {
  const docId = `${classId}_${periodKey}`;
  const now = new Date().toISOString();

  await updateDoc(doc(db, OFFICIAL_COLLECTION, docId), {
    isLocked: false,
    unlockedAt: now,
    unlockedBy: teacherEmail,
    updatedAt: now,
  });
}

/**
 * Cập nhật nhận xét của giáo viên cho một học sinh trong bản xếp loại
 */
export async function updateStudentCommentInOfficialDoc(
  classId: string,
  periodKey: string,
  studentId: string,
  comment: string
): Promise<void> {
  const docId = `${classId}_${periodKey}`;
  const snap = await getDoc(doc(db, OFFICIAL_COLLECTION, docId));
  if (!snap.exists()) return;

  const currentData = snap.data() as OfficialClassificationDoc;
  const updatedResults = currentData.studentResults.map(r => {
    if (r.studentId === studentId) {
      return { ...r, teacherComment: comment };
    }
    return r;
  });

  await updateDoc(doc(db, OFFICIAL_COLLECTION, docId), {
    studentResults: updatedResults,
    updatedAt: new Date().toISOString(),
  });
}

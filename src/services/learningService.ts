import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student } from '../types/student';
import { THPT_SUBJECTS } from '../types/score';
import { 
  LearningRecord, 
  CreateLearningRecordInput, 
  UpdateLearningRecordInput, 
  LearningStats 
} from '../types/learning';
import { 
  addPointTransaction, 
  deletePointTransactionPermanently 
} from './pointTransactionService';

export const LEARNING_RECORDS_COLLECTION = 'learning_records';

/**
 * Tạo bản ghi theo dõi học tập mới cho học sinh
 * Lưu ý: Chỉ tạo giao dịch rèn luyện (WeeklyPointTransaction) nếu giáo viên tích chọn xác nhận rõ ràng.
 */
export async function createLearningRecord(
  classId: string,
  student: Student,
  input: CreateLearningRecordInput,
  teacherEmail: string,
  teacherName: string
): Promise<LearningRecord> {
  const docRef = doc(collection(db, LEARNING_RECORDS_COLLECTION));
  const now = new Date().toISOString();

  // Xác định tên môn học
  const subject = THPT_SUBJECTS.find(s => s.code === input.subjectCode);
  const subjectName = input.subjectName || subject?.name || 'Môn học';

  // Chuẩn hóa điểm 0 - 10
  const normalizedScore = Math.max(0, Math.min(10, Math.round(input.score * 10) / 10));

  // Trích xuất tháng từ ngày kiểm tra (YYYY-MM)
  const month = input.date.substring(0, 7);
  const weekNumber = input.weekNumber || 12;

  let linkedTxId: string | null = null;
  let bonusScore: number | undefined = undefined;

  // Xử lý liên kết rèn luyện nếu giáo viên chủ nhiệm yêu cầu
  if (input.createConductTransaction && input.conductBonusScore && input.conductBonusScore !== 0) {
    bonusScore = input.conductBonusScore;
    const txReason = input.conductReason?.trim() || 
      `Thành tích học tập: ${input.assessmentName} môn ${subjectName} (${normalizedScore} điểm)`;

    const tx = await addPointTransaction({
      classId,
      studentId: student.id,
      weekNumber,
      date: input.date,
      category: 'hoc_tap',
      categoryLabel: 'Học tập',
      reason: txReason,
      score: bonusScore,
      studentNameSnapshot: student.fullName,
      studentCodeSnapshot: student.studentCode,
      groupNumberSnapshot: student.groupNumber,
      createdBy: teacherEmail,
      createdByName: teacherName,
      note: `Ghi nhận tự động từ module Theo dõi học tập [Mã bài: ${docRef.id}]`,
    });

    linkedTxId = tx.id;
  }

  const newRecord: LearningRecord = {
    id: docRef.id,
    classId,
    studentId: student.id,
    studentNameSnapshot: student.fullName,
    studentCodeSnapshot: student.studentCode,
    groupNumberSnapshot: student.groupNumber,
    subjectCode: input.subjectCode,
    subjectName,
    assessmentType: input.assessmentType,
    assessmentName: input.assessmentName.trim(),
    date: input.date,
    weekNumber,
    month,
    semester: input.semester,
    score: normalizedScore,
    feedback: input.feedback?.trim() || '',
    achievement: input.achievement?.trim() || '',
    supportNeeded: input.supportNeeded?.trim() || '',
    hasConductBonus: Boolean(linkedTxId),
    conductTransactionId: linkedTxId,
    conductBonusScore: bonusScore,
    originSource: 'learning', // Dữ liệu nguồn gốc là học tập
    createdAt: now,
    updatedAt: now,
    createdBy: teacherEmail,
  };

  await setDoc(docRef, newRecord);
  return newRecord;
}

/**
 * Cập nhật bản ghi học tập
 */
export async function updateLearningRecord(
  recordId: string,
  input: UpdateLearningRecordInput,
  existingRecord: LearningRecord,
  teacherEmail: string
): Promise<void> {
  const docRef = doc(db, LEARNING_RECORDS_COLLECTION, recordId);
  const now = new Date().toISOString();

  const updates: Partial<LearningRecord> = {
    updatedAt: now,
  };

  if (input.subjectCode) {
    updates.subjectCode = input.subjectCode;
    const subj = THPT_SUBJECTS.find(s => s.code === input.subjectCode);
    updates.subjectName = input.subjectName || subj?.name || existingRecord.subjectName;
  }

  if (input.assessmentType) updates.assessmentType = input.assessmentType;
  if (input.assessmentName) updates.assessmentName = input.assessmentName.trim();
  if (input.date) {
    updates.date = input.date;
    updates.month = input.date.substring(0, 7);
  }
  if (input.weekNumber !== undefined) updates.weekNumber = input.weekNumber;
  if (input.semester) updates.semester = input.semester;
  if (input.score !== undefined) {
    updates.score = Math.max(0, Math.min(10, Math.round(input.score * 10) / 10));
  }
  if (input.feedback !== undefined) updates.feedback = input.feedback.trim();
  if (input.achievement !== undefined) updates.achievement = input.achievement.trim();
  if (input.supportNeeded !== undefined) updates.supportNeeded = input.supportNeeded.trim();

  await updateDoc(docRef, updates);
}

/**
 * Xóa bản ghi học tập (Đồng thời dọn dẹp transaction rèn luyện liên kết nếu có)
 */
export async function deleteLearningRecord(
  recordId: string,
  existingRecord: LearningRecord,
  deleteLinkedConductTransaction: boolean = true
): Promise<void> {
  const docRef = doc(db, LEARNING_RECORDS_COLLECTION, recordId);
  await deleteDoc(docRef);

  if (deleteLinkedConductTransaction && existingRecord.conductTransactionId) {
    try {
      await deletePointTransactionPermanently(existingRecord.conductTransactionId);
    } catch (err) {
      console.warn('Lỗi khi xóa transaction rèn luyện liên kết:', err);
    }
  }
}

/**
 * Tính toán số liệu thống kê học tập (Đảm bảo KHÔNG tính trùng lặp dữ liệu)
 */
export function calculateLearningStats(records: LearningRecord[]): LearningStats {
  // Loại bỏ các bản ghi trùng lặp ID (nếu có)
  const uniqueMap = new Map<string, LearningRecord>();
  records.forEach(r => {
    if (r && r.id && !uniqueMap.has(r.id)) {
      uniqueMap.set(r.id, r);
    }
  });

  const uniqueRecords = Array.from(uniqueMap.values());

  if (uniqueRecords.length === 0) {
    return {
      averageScore: 0,
      totalAssessments: 0,
      highestScore: 0,
      lowestScore: 0,
      scoreDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        average: 0,
        weak: 0,
      },
      trend: 'stable',
      trendDelta: 0,
      totalAchievements: 0,
      totalSupportNeeded: 0,
    };
  }

  let totalScore = 0;
  let highest = uniqueRecords[0].score;
  let lowest = uniqueRecords[0].score;
  let totalAchievements = 0;
  let totalSupportNeeded = 0;

  const distribution = {
    excellent: 0, // >= 9.0
    good: 0,      // 8.0 - 8.9
    fair: 0,      // 6.5 - 7.9
    average: 0,   // 5.0 - 6.4
    weak: 0,      // < 5.0
  };

  uniqueRecords.forEach(r => {
    const s = r.score;
    totalScore += s;
    if (s > highest) highest = s;
    if (s < lowest) lowest = s;

    if (s >= 9.0) distribution.excellent++;
    else if (s >= 8.0) distribution.good++;
    else if (s >= 6.5) distribution.fair++;
    else if (s >= 5.0) distribution.average++;
    else distribution.weak++;

    if (r.achievement && r.achievement.trim() !== '') totalAchievements++;
    if (r.supportNeeded && r.supportNeeded.trim() !== '') totalSupportNeeded++;
  });

  const averageScore = Math.round((totalScore / uniqueRecords.length) * 100) / 100;

  // Tính xu hướng điểm: Sắp xếp theo ngày tăng dần và so sánh nửa sau với nửa đầu
  const sortedByDate = [...uniqueRecords].sort((a, b) => a.date.localeCompare(b.date));
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendDelta = 0;

  if (sortedByDate.length >= 2) {
    const mid = Math.floor(sortedByDate.length / 2);
    const firstHalf = sortedByDate.slice(0, mid);
    const secondHalf = sortedByDate.slice(mid);

    const avgFirst = firstHalf.reduce((acc, cur) => acc + cur.score, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((acc, cur) => acc + cur.score, 0) / secondHalf.length;

    trendDelta = Math.round((avgSecond - avgFirst) * 10) / 10;
    if (trendDelta >= 0.3) trend = 'up';
    else if (trendDelta <= -0.3) trend = 'down';
    else trend = 'stable';
  }

  return {
    averageScore,
    totalAssessments: uniqueRecords.length,
    highestScore: highest,
    lowestScore: lowest,
    scoreDistribution: distribution,
    trend,
    trendDelta,
    totalAchievements,
    totalSupportNeeded,
  };
}

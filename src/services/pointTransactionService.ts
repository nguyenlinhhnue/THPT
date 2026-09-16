import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  WeeklyPointTransaction, 
  TransactionCategory, 
  TransactionType,
  AuditLogEntry
} from '../types/pointTransaction';
import { ConductRecord } from '../types/conduct';

export const POINT_TRANSACTIONS_COLLECTION = 'weekly_point_transactions';
export const CONDUCT_COLLECTION = 'conduct_records';

// In-memory idempotency cache để chống double-click trong vòng 3.5 giây
const recentSubmissionHashes = new Set<string>();

export function generateTransactionCode(weekNumber: number): string {
  const timestamp = Date.now().toString().slice(-5);
  const rand = Math.floor(100 + Math.random() * 900);
  return `TX-W${weekNumber}-${timestamp}-${rand}`;
}

export interface CreatePointTransactionInput {
  classId: string;
  studentId: string;
  weekNumber: number;
  date: string;
  category: TransactionCategory;
  categoryLabel: string;
  reason: string;
  score: number;
  type?: TransactionType;
  note?: string;
  createdBy: string;
  createdByName?: string;
  studentNameSnapshot: string;
  studentCodeSnapshot: string;
  groupNumberSnapshot: number;
  ruleSnapshot?: {
    ruleId?: string;
    label: string;
    defaultScore: number;
    category: string;
  };
}

/**
 * Kiểm tra và ghi nhận chống trùng lặp double-click
 */
function checkIdempotency(input: CreatePointTransactionInput): boolean {
  // Tạo signature dựa trên studentId, week, date, score, reason
  const hashKey = `${input.studentId}_${input.weekNumber}_${input.date}_${input.score}_${input.reason.trim()}`;
  if (recentSubmissionHashes.has(hashKey)) {
    return false; // Trùng lặp!
  }
  recentSubmissionHashes.add(hashKey);
  setTimeout(() => {
    recentSubmissionHashes.delete(hashKey);
  }, 3500); // 3.5 giây
  return true;
}

/**
 * Tạo một transaction điểm tuần cho MỘT học sinh
 */
export async function addPointTransaction(
  input: CreatePointTransactionInput
): Promise<WeeklyPointTransaction> {
  if (!checkIdempotency(input)) {
    throw new Error('Thao tác ghi nhận điểm đang được xử lý hoặc bị trùng lặp. Vui lòng không nhấn liên tục.');
  }

  const now = new Date().toISOString();
  const txRef = doc(collection(db, POINT_TRANSACTIONS_COLLECTION));
  const txCode = generateTransactionCode(input.weekNumber);
  const normalizedType: TransactionType = input.score >= 0 ? 'plus' : 'minus';

  const newTx: WeeklyPointTransaction = {
    id: txRef.id,
    transactionId: txCode,
    studentId: input.studentId,
    classId: input.classId,
    weekId: `week_${input.weekNumber}`,
    weekNumber: input.weekNumber,
    date: input.date,
    category: input.category,
    categoryLabel: input.categoryLabel,
    reason: input.reason.trim(),
    score: input.score,
    type: normalizedType,
    note: input.note?.trim() || '',
    createdBy: input.createdBy,
    createdByName: input.createdByName || 'Giáo viên Chủ nhiệm',
    createdAt: now,
    updatedAt: now,
    studentNameSnapshot: input.studentNameSnapshot,
    studentCodeSnapshot: input.studentCodeSnapshot,
    groupNumberSnapshot: input.groupNumberSnapshot,
    ruleSnapshot: input.ruleSnapshot,
    status: 'valid',
    auditLog: [
      {
        action: 'created',
        by: input.createdByName || input.createdBy,
        timestamp: now,
        note: `Khởi tạo giao dịch ${input.score > 0 ? '+' : ''}${input.score} điểm: "${input.reason.trim()}"`,
      },
    ],
  };

  // Đồng thời lưu vào cả weekly_point_transactions và mirrored conduct_records để tương thích 100%
  const conductRef = doc(db, CONDUCT_COLLECTION, txRef.id);
  const mirroredConduct: ConductRecord = {
    id: txRef.id,
    classId: input.classId,
    studentId: input.studentId,
    groupNumber: input.groupNumberSnapshot,
    week: input.weekNumber,
    month: new Date(input.date).getMonth() + 1,
    type: input.score >= 0 ? 'khen_thuong' : 'vi_pham',
    category: input.category as any,
    description: input.reason.trim(),
    points: input.score,
    date: input.date,
    createdAt: now,
  };

  const batch = writeBatch(db);
  batch.set(txRef, newTx);
  batch.set(conductRef, mirroredConduct);
  await batch.commit();

  return newTx;
}

/**
 * Cộng/Trừ điểm HÀNG LOẠT cho nhiều học sinh
 * YÊU CẦU BẮT BUỘC: Mỗi học sinh PHẢI tạo transaction RIÊNG BIỆT với snapshot tương ứng
 */
export async function addBatchPointTransactions(
  inputs: CreatePointTransactionInput[]
): Promise<WeeklyPointTransaction[]> {
  if (inputs.length === 0) return [];

  const now = new Date().toISOString();
  const batch = writeBatch(db);
  const results: WeeklyPointTransaction[] = [];

  for (const input of inputs) {
    const txRef = doc(collection(db, POINT_TRANSACTIONS_COLLECTION));
    const txCode = generateTransactionCode(input.weekNumber);
    const normalizedType: TransactionType = input.score >= 0 ? 'plus' : 'minus';

    const newTx: WeeklyPointTransaction = {
      id: txRef.id,
      transactionId: txCode,
      studentId: input.studentId,
      classId: input.classId,
      weekId: `week_${input.weekNumber}`,
      weekNumber: input.weekNumber,
      date: input.date,
      category: input.category,
      categoryLabel: input.categoryLabel,
      reason: input.reason.trim(),
      score: input.score,
      type: normalizedType,
      note: input.note?.trim() || '',
      createdBy: input.createdBy,
      createdByName: input.createdByName || 'Giáo viên Chủ nhiệm',
      createdAt: now,
      updatedAt: now,
      studentNameSnapshot: input.studentNameSnapshot,
      studentCodeSnapshot: input.studentCodeSnapshot,
      groupNumberSnapshot: input.groupNumberSnapshot,
      ruleSnapshot: input.ruleSnapshot,
      status: 'valid',
      auditLog: [
        {
          action: 'created',
          by: input.createdByName || input.createdBy,
          timestamp: now,
          note: `Khởi tạo hàng loạt: ${input.score > 0 ? '+' : ''}${input.score} điểm cho ${input.studentNameSnapshot}`,
        },
      ],
    };

    const conductRef = doc(db, CONDUCT_COLLECTION, txRef.id);
    const mirroredConduct: ConductRecord = {
      id: txRef.id,
      classId: input.classId,
      studentId: input.studentId,
      groupNumber: input.groupNumberSnapshot,
      week: input.weekNumber,
      month: new Date(input.date).getMonth() + 1,
      type: input.score >= 0 ? 'khen_thuong' : 'vi_pham',
      category: input.category as any,
      description: input.reason.trim(),
      points: input.score,
      date: input.date,
      createdAt: now,
    };

    batch.set(txRef, newTx);
    batch.set(conductRef, mirroredConduct);
    results.push(newTx);
  }

  await batch.commit();
  return results;
}

/**
 * Chỉnh sửa Transaction điểm tuần (Có ghi nhận Audit Log)
 */
export async function updatePointTransaction(
  txId: string,
  existingTx: WeeklyPointTransaction,
  updates: {
    score?: number;
    reason?: string;
    category?: TransactionCategory;
    categoryLabel?: string;
    date?: string;
    note?: string;
  },
  editorName: string
): Promise<void> {
  const now = new Date().toISOString();
  const txRef = doc(db, POINT_TRANSACTIONS_COLLECTION, txId);
  const conductRef = doc(db, CONDUCT_COLLECTION, txId);

  const diffNotes: string[] = [];
  if (updates.score !== undefined && updates.score !== existingTx.score) {
    diffNotes.push(`Điểm: ${existingTx.score} ➔ ${updates.score}`);
  }
  if (updates.reason !== undefined && updates.reason !== existingTx.reason) {
    diffNotes.push(`Lý do: "${existingTx.reason}" ➔ "${updates.reason}"`);
  }
  if (updates.date !== undefined && updates.date !== existingTx.date) {
    diffNotes.push(`Ngày: ${existingTx.date} ➔ ${updates.date}`);
  }

  const newAuditEntry: AuditLogEntry = {
    action: 'updated',
    by: editorName,
    timestamp: now,
    note: 'Chỉnh sửa giao dịch',
    diffSummary: diffNotes.join('; ') || 'Cập nhật thông tin',
  };

  const newScore = updates.score !== undefined ? updates.score : existingTx.score;
  const newType: TransactionType = newScore >= 0 ? 'plus' : 'minus';

  const txUpdates: Partial<WeeklyPointTransaction> = {
    ...updates,
    score: newScore,
    type: newType,
    updatedAt: now,
    auditLog: [...(existingTx.auditLog || []), newAuditEntry],
  };

  const batch = writeBatch(db);
  batch.update(txRef, txUpdates);

  // Cập nhật mirrored conduct nếu còn hiệu lực
  if (existingTx.status === 'valid') {
    batch.update(conductRef, {
      description: updates.reason !== undefined ? updates.reason : existingTx.reason,
      points: newScore,
      type: newScore >= 0 ? 'khen_thuong' : 'vi_pham',
      date: updates.date !== undefined ? updates.date : existingTx.date,
      ...(updates.category ? { category: updates.category as any } : {}),
    });
  }

  await batch.commit();
}

/**
 * Hoàn tác / Hủy giao dịch (Void Transaction)
 */
export async function voidPointTransaction(
  txId: string,
  existingTx: WeeklyPointTransaction,
  operatorName: string,
  voidReason?: string
): Promise<void> {
  const now = new Date().toISOString();
  const txRef = doc(db, POINT_TRANSACTIONS_COLLECTION, txId);
  const conductRef = doc(db, CONDUCT_COLLECTION, txId);

  const newAuditEntry: AuditLogEntry = {
    action: 'voided',
    by: operatorName,
    timestamp: now,
    note: voidReason || 'Hoàn tác giao dịch điểm',
  };

  const batch = writeBatch(db);
  batch.update(txRef, {
    status: 'voided',
    voidedAt: now,
    voidedBy: operatorName,
    voidReason: voidReason || 'GVCN hoàn tác',
    updatedAt: now,
    auditLog: [...(existingTx.auditLog || []), newAuditEntry],
  });

  // Khi void, xóa bản ghi mirrored conduct để không ảnh hưởng điểm thi đua
  batch.delete(conductRef);

  await batch.commit();
}

/**
 * Khôi phục giao dịch đã hủy (Restore Transaction)
 */
export async function restorePointTransaction(
  txId: string,
  existingTx: WeeklyPointTransaction,
  operatorName: string
): Promise<void> {
  const now = new Date().toISOString();
  const txRef = doc(db, POINT_TRANSACTIONS_COLLECTION, txId);
  const conductRef = doc(db, CONDUCT_COLLECTION, txId);

  const newAuditEntry: AuditLogEntry = {
    action: 'restored',
    by: operatorName,
    timestamp: now,
    note: 'Khôi phục lại giao dịch đã hủy',
  };

  const batch = writeBatch(db);
  batch.update(txRef, {
    status: 'valid',
    voidedAt: null as any,
    voidedBy: null as any,
    voidReason: null as any,
    updatedAt: now,
    auditLog: [...(existingTx.auditLog || []), newAuditEntry],
  });

  // Tái tạo bản ghi mirrored conduct
  const mirroredConduct: ConductRecord = {
    id: txId,
    classId: existingTx.classId,
    studentId: existingTx.studentId,
    groupNumber: existingTx.groupNumberSnapshot,
    week: existingTx.weekNumber,
    month: new Date(existingTx.date).getMonth() + 1,
    type: existingTx.score >= 0 ? 'khen_thuong' : 'vi_pham',
    category: existingTx.category as any,
    description: existingTx.reason,
    points: existingTx.score,
    date: existingTx.date,
    createdAt: now,
  };
  batch.set(conductRef, mirroredConduct);

  await batch.commit();
}

/**
 * Xóa vĩnh viễn giao dịch khỏi cơ sở dữ liệu (Sau confirmation)
 */
export async function deletePointTransactionPermanently(txId: string): Promise<void> {
  const txRef = doc(db, POINT_TRANSACTIONS_COLLECTION, txId);
  const conductRef = doc(db, CONDUCT_COLLECTION, txId);

  const batch = writeBatch(db);
  batch.delete(txRef);
  batch.delete(conductRef);
  await batch.commit();
}

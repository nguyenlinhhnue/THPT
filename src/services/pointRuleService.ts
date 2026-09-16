import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  PointRule, 
  CreatePointRuleInput, 
  UpdatePointRuleInput, 
  CATEGORY_LABELS,
  DEFAULT_INITIAL_RULES 
} from '../types/pointRule';

export const POINT_RULES_COLLECTION = 'point_rules';

/**
 * Lấy danh sách tất cả quy tắc chấm điểm của lớp
 */
export async function getPointRules(classId: string): Promise<PointRule[]> {
  const q = query(
    collection(db, POINT_RULES_COLLECTION),
    where('classId', '==', classId)
  );
  const snap = await getDocs(q);
  const rules: PointRule[] = [];
  snap.forEach((docSnap) => {
    rules.push({ ...docSnap.data(), id: docSnap.id } as PointRule);
  });

  return rules.sort((a, b) => {
    // Sắp xếp: quy tắc cộng điểm trước, rồi theo order, rồi theo tên
    if (a.type !== b.type) {
      return a.type === 'plus' ? -1 : 1;
    }
    if ((a.order || 0) !== (b.order || 0)) {
      return (a.order || 0) - (b.order || 0);
    }
    return a.name.localeCompare(b.name, 'vi');
  });
}

/**
 * Thêm quy tắc chấm điểm mới
 */
export async function createPointRule(
  classId: string,
  input: CreatePointRuleInput,
  teacherEmail?: string
): Promise<PointRule> {
  const docRef = doc(collection(db, POINT_RULES_COLLECTION));
  const now = new Date().toISOString();

  // Chuẩn hóa điểm: Nếu là trừ điểm thì phải là số âm, nếu cộng điểm thì phải là số dương
  const normalizedScore = input.type === 'minus'
    ? -Math.abs(input.score)
    : Math.abs(input.score);

  const categoryLabel = input.categoryLabel || CATEGORY_LABELS[input.category] || 'Khác';

  const newRule: PointRule = {
    id: docRef.id,
    classId,
    name: input.name.trim(),
    type: input.type,
    category: input.category,
    categoryLabel,
    score: normalizedScore,
    description: input.description?.trim() || '',
    isActive: input.isActive ?? true,
    order: Date.now(),
    createdAt: now,
    updatedAt: now,
    createdBy: teacherEmail || 'GVCN',
  };

  await setDoc(docRef, newRule);
  return newRule;
}

/**
 * Cập nhật quy tắc chấm điểm
 * 
 * QUAN TRỌNG: Thao tác này chỉ cập nhật cấu hình quy tắc trong collection `point_rules`.
 * Tuyệt đối KHÔNG làm thay đổi bất kỳ giao dịch nào đã ghi nhận trong quá khứ (`weekly_point_transactions`).
 * Các giao dịch cũ giữ nguyên snapshot điểm tại thời điểm tạo.
 */
export async function updatePointRule(
  ruleId: string,
  input: UpdatePointRuleInput,
  teacherEmail?: string
): Promise<void> {
  const docRef = doc(db, POINT_RULES_COLLECTION, ruleId);
  const now = new Date().toISOString();

  const updateData: Record<string, any> = {
    updatedAt: now,
  };

  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }

  if (input.type !== undefined) {
    updateData.type = input.type;
  }

  if (input.score !== undefined) {
    const targetType = input.type !== undefined ? input.type : (input.score >= 0 ? 'plus' : 'minus');
    updateData.score = targetType === 'minus' ? -Math.abs(input.score) : Math.abs(input.score);
  }

  if (input.category !== undefined) {
    updateData.category = input.category;
    updateData.categoryLabel = input.categoryLabel || CATEGORY_LABELS[input.category] || 'Khác';
  }

  if (input.description !== undefined) {
    updateData.description = input.description.trim();
  }

  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive;
  }

  await updateDoc(docRef, updateData);
}

/**
 * Bật hoặc tắt trạng thái sử dụng của quy tắc
 */
export async function togglePointRuleActive(ruleId: string, isActive: boolean): Promise<void> {
  const docRef = doc(db, POINT_RULES_COLLECTION, ruleId);
  await updateDoc(docRef, {
    isActive,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Xóa quy tắc chấm điểm
 * 
 * LƯU Ý: Xóa quy tắc này chỉ loại bỏ nó khỏi danh mục chọn nhanh khi nhập điểm mới.
 * Toàn bộ các giao dịch cũ đã được ghi bằng quy tắc này vẫn được bảo toàn nguyên vẹn.
 */
export async function deletePointRule(ruleId: string): Promise<void> {
  const docRef = doc(db, POINT_RULES_COLLECTION, ruleId);
  await deleteDoc(docRef);
}

/**
 * Khởi tạo bộ quy tắc mẫu ban đầu nếu lớp chưa có bất kỳ quy tắc nào
 */
export async function seedDefaultPointRulesIfEmpty(
  classId: string,
  teacherEmail?: string
): Promise<PointRule[]> {
  const existingRules = await getPointRules(classId);
  if (existingRules.length > 0) {
    return existingRules;
  }

  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const createdList: PointRule[] = [];

  for (let i = 0; i < DEFAULT_INITIAL_RULES.length; i++) {
    const item = DEFAULT_INITIAL_RULES[i];
    const docRef = doc(collection(db, POINT_RULES_COLLECTION));
    const rule: PointRule = {
      ...item,
      id: docRef.id,
      classId,
      createdAt: now,
      updatedAt: now,
      createdBy: teacherEmail || 'GVCN',
    };
    batch.set(docRef, rule);
    createdList.push(rule);
  }

  await batch.commit();
  return createdList;
}

/**
 * Khôi phục lại toàn bộ bộ quy tắc mẫu mặc định (xóa cái cũ và tạo mới)
 */
export async function resetToDefaultPointRules(
  classId: string,
  teacherEmail?: string
): Promise<PointRule[]> {
  // Lấy các rules hiện tại để xóa
  const currentRules = await getPointRules(classId);
  const batch = writeBatch(db);

  for (const r of currentRules) {
    batch.delete(doc(db, POINT_RULES_COLLECTION, r.id));
  }

  const now = new Date().toISOString();
  const createdList: PointRule[] = [];

  for (let i = 0; i < DEFAULT_INITIAL_RULES.length; i++) {
    const item = DEFAULT_INITIAL_RULES[i];
    const docRef = doc(collection(db, POINT_RULES_COLLECTION));
    const rule: PointRule = {
      ...item,
      id: docRef.id,
      classId,
      createdAt: now,
      updatedAt: now,
      createdBy: teacherEmail || 'GVCN',
    };
    batch.set(docRef, rule);
    createdList.push(rule);
  }

  await batch.commit();
  return createdList;
}

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ClassroomInfo } from '../types/class';

const CLASSES_COLLECTION = 'classes';

export async function getOrCreateClassroom(teacherId: string, teacherEmail: string, teacherName: string): Promise<ClassroomInfo> {
  const q = query(
    collection(db, CLASSES_COLLECTION),
    where('teacherId', '==', teacherId)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const docData = snap.docs[0].data() as ClassroomInfo;
    return { ...docData, id: snap.docs[0].id };
  }

  // Nếu chưa có lớp, tạo lớp mặc định cho GVCN
  const newClassId = `class_${teacherId.slice(0, 10)}`;
  const defaultClassroom: ClassroomInfo = {
    id: newClassId,
    className: '12A1',
    grade: 12,
    schoolYear: '2025-2026',
    schoolName: 'Trường THPT Chuyên',
    teacherId,
    teacherName: teacherName || 'Giáo viên Chủ nhiệm',
    teacherEmail: teacherEmail || '',
    isDataLocked: false,
    currentWeek: 12,
    currentSemester: 'HK1',
    totalGroups: 4,
    baseCompetitionPoints: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, CLASSES_COLLECTION, newClassId), defaultClassroom);
  return defaultClassroom;
}

export async function updateClassroomSettings(
  classId: string, 
  updates: Partial<ClassroomInfo>
): Promise<void> {
  const ref = doc(db, CLASSES_COLLECTION, classId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function setClassLockStatus(classId: string, isLocked: boolean): Promise<void> {
  const ref = doc(db, CLASSES_COLLECTION, classId);
  await updateDoc(ref, {
    isDataLocked: isLocked,
    updatedAt: new Date().toISOString(),
  });
}

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

const STUDENTS_COLLECTION = 'students';

export async function addStudent(
  classId: string, 
  studentData: Omit<Student, 'id' | 'classId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const studentRef = doc(collection(db, STUDENTS_COLLECTION));
  const newStudent: Student = {
    ...studentData,
    id: studentRef.id,
    classId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(studentRef, newStudent);
  return studentRef.id;
}

export async function updateStudent(studentId: string, updates: Partial<Student>): Promise<void> {
  const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
  await updateDoc(studentRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteStudent(studentId: string): Promise<void> {
  const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
  await deleteDoc(studentRef);
}

export async function batchSeedStudents(
  classId: string, 
  initialStudents: Omit<Student, 'id' | 'classId' | 'createdAt' | 'updatedAt'>[]
): Promise<void> {
  const batch = writeBatch(db);
  for (const s of initialStudents) {
    const sRef = doc(collection(db, STUDENTS_COLLECTION));
    const fullData: Student = {
      ...s,
      id: sRef.id,
      classId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(sRef, fullData);
  }
  await batch.commit();
}

export async function batchImportStudents(
  classId: string,
  importedList: Omit<Student, 'id' | 'classId' | 'createdAt' | 'updatedAt'>[]
): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;
  for (const s of importedList) {
    const sRef = doc(collection(db, STUDENTS_COLLECTION));
    const fullData: Student = {
      ...s,
      id: sRef.id,
      classId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(sRef, fullData);
    count++;
  }
  await batch.commit();
  return count;
}

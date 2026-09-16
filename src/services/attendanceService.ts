import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AttendanceRecord } from '../types/attendance';

const ATTENDANCE_COLLECTION = 'attendance_records';

export async function saveAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<string> {
  const docId = `${record.classId}_${record.studentId}_${record.date}_${record.session}`;
  const ref = doc(db, ATTENDANCE_COLLECTION, docId);

  const data: AttendanceRecord = {
    ...record,
    id: docId,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, data, { merge: true });
  return docId;
}

export async function batchSaveAttendance(records: Omit<AttendanceRecord, 'id'>[]): Promise<void> {
  const batch = writeBatch(db);
  for (const r of records) {
    const docId = `${r.classId}_${r.studentId}_${r.date}_${r.session}`;
    const ref = doc(db, ATTENDANCE_COLLECTION, docId);
    batch.set(ref, {
      ...r,
      id: docId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  await batch.commit();
}

export async function deleteAttendance(recordId: string): Promise<void> {
  const ref = doc(db, ATTENDANCE_COLLECTION, recordId);
  await deleteDoc(ref);
}

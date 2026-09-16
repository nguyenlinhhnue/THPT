import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ConductRecord } from '../types/conduct';

const CONDUCT_COLLECTION = 'conduct_records';

export async function addConductRecord(record: Omit<ConductRecord, 'id' | 'createdAt'>): Promise<string> {
  const ref = doc(collection(db, CONDUCT_COLLECTION));
  const newRecord: ConductRecord = {
    ...record,
    id: ref.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, newRecord);
  return ref.id;
}

export async function updateConductRecord(recordId: string, updates: Partial<ConductRecord>): Promise<void> {
  const ref = doc(db, CONDUCT_COLLECTION, recordId);
  await updateDoc(ref, updates);
}

export async function deleteConductRecord(recordId: string): Promise<void> {
  const ref = doc(db, CONDUCT_COLLECTION, recordId);
  await deleteDoc(ref);
}

export async function batchSeedConduct(records: Omit<ConductRecord, 'id' | 'createdAt'>[]): Promise<void> {
  const batch = writeBatch(db);
  for (const rec of records) {
    const ref = doc(collection(db, CONDUCT_COLLECTION));
    batch.set(ref, {
      ...rec,
      id: ref.id,
      createdAt: new Date().toISOString(),
    });
  }
  await batch.commit();
}

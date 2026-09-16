import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SubjectScore, Semester } from '../types/score';

const SCORES_COLLECTION = 'academic_scores';

export function getScoreDocId(classId: string, studentId: string, subjectCode: string, semester: Semester): string {
  return `${classId}_${studentId}_${subjectCode}_${semester}`;
}

export async function saveSubjectScore(score: Omit<SubjectScore, 'id'>): Promise<string> {
  const docId = getScoreDocId(score.classId, score.studentId, score.subjectCode, score.semester);
  const scoreRef = doc(db, SCORES_COLLECTION, docId);

  const data: SubjectScore = {
    ...score,
    id: docId,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(scoreRef, data, { merge: true });
  return docId;
}

export async function deleteSubjectScore(scoreId: string): Promise<void> {
  const scoreRef = doc(db, SCORES_COLLECTION, scoreId);
  await deleteDoc(scoreRef);
}

export async function batchSaveScores(scores: Omit<SubjectScore, 'id'>[]): Promise<void> {
  const batch = writeBatch(db);
  for (const sc of scores) {
    const docId = getScoreDocId(sc.classId, sc.studentId, sc.subjectCode, sc.semester);
    const ref = doc(db, SCORES_COLLECTION, docId);
    batch.set(ref, {
      ...sc,
      id: docId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  await batch.commit();
}

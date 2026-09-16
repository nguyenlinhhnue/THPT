import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Kiểm tra xem cấu hình Firebase đã đầy đủ và hợp lệ hay chưa
export const checkFirebaseConfig = (): { isConfigured: boolean; missingFields: string[]; message?: string } => {
  const missing: string[] = [];
  if (!firebaseConfigJson.apiKey || firebaseConfigJson.apiKey.trim() === '' || firebaseConfigJson.apiKey.includes('YOUR_')) {
    missing.push('apiKey');
  }
  if (!firebaseConfigJson.projectId || firebaseConfigJson.projectId.trim() === '') {
    missing.push('projectId');
  }
  if (!firebaseConfigJson.appId || firebaseConfigJson.appId.trim() === '') {
    missing.push('appId');
  }

  if (missing.length > 0) {
    return {
      isConfigured: false,
      missingFields: missing,
      message: 'Firebase chưa được cấu hình. Thiếu các thông số: ' + missing.join(', '),
    };
  }

  return { isConfigured: true, missingFields: [] };
};

export const firebaseConfigStatus = checkFirebaseConfig();
export const isFirebaseConfigured = firebaseConfigStatus.isConfigured;

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || '',
  authDomain: firebaseConfigJson.authDomain || '',
  projectId: firebaseConfigJson.projectId || '',
  storageBucket: firebaseConfigJson.storageBucket || '',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '',
  appId: firebaseConfigJson.appId || '',
};

let appInstance: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage;

if (isFirebaseConfigured) {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);
  dbInstance = firebaseConfigJson.firestoreDatabaseId
    ? getFirestore(appInstance, firebaseConfigJson.firestoreDatabaseId)
    : getFirestore(appInstance);
  storageInstance = getStorage(appInstance);
} else {
  // Mock dummy objects to prevent module loading crash, will be blocked by UI check
  console.warn('Firebase chưa được cấu hình đầy đủ trong firebase-applet-config.json');
  appInstance = {} as any;
  authInstance = {} as any;
  dbInstance = {} as any;
  storageInstance = {} as any;
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const configDetails = {
  projectId: firebaseConfigJson.projectId,
  authDomain: firebaseConfigJson.authDomain,
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId || '(default)',
};

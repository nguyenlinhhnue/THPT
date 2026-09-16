import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut as fbSignOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { getAuthErrorMessage } from '../utils/authErrors';

export interface TeacherProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'giao_vien_chu_nhiem'; // Chỉ duy nhất vai trò GVCN trong toàn hệ thống
  phone?: string;
  schoolName?: string;
  teachingSubject?: string;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  teacherProfile: TeacherProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpTeacher: (email: string, pass: string, name: string, school?: string, subject?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Khởi tạo và duy trì session Firebase Auth
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // Đảm bảo session duy trì khi refresh trang hoặc mở tab mới
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Persistence error:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const teacherDocRef = doc(db, 'teachers', user.uid);
          const teacherDoc = await getDoc(teacherDocRef);

          if (teacherDoc.exists()) {
            const data = teacherDoc.data() as TeacherProfile;
            // Kiểm tra bảo mật: Chỉ cho phép role giao_vien_chu_nhiem
            if (data.role !== 'giao_vien_chu_nhiem') {
              await fbSignOut(auth);
              setCurrentUser(null);
              setTeacherProfile(null);
              setError('Tài khoản này không có quyền Giáo viên Chủ nhiệm.');
              setLoading(false);
              return;
            }
            setTeacherProfile(data);
          } else {
            // Tự động khởi tạo hồ sơ GVCN trong Firestore cho tài khoản mới
            const newProfile: TeacherProfile = {
              uid: user.uid,
              email: user.email || 'gvcn@thpt.edu.vn',
              displayName: user.displayName || 'Giáo viên Chủ nhiệm',
              role: 'giao_vien_chu_nhiem',
              schoolName: 'Trường THPT',
              teachingSubject: 'Toán học',
              createdAt: new Date().toISOString(),
            };
            await setDoc(teacherDocRef, newProfile);
            setTeacherProfile(newProfile);
          }

          setCurrentUser(user);
        } catch (err: any) {
          console.error('Lỗi khi đọc hồ sơ GVCN:', err);
          // Nếu có lỗi quyền Firestore
          if (err?.code === 'permission-denied') {
            setError('Lỗi quyền truy cập Firestore: Tài khoản chưa được phân quyền.');
          } else {
            setError(err.message || 'Lỗi đọc dữ liệu tài khoản.');
          }
          setCurrentUser(user);
          // Set profile tối thiểu để không sập app
          setTeacherProfile({
            uid: user.uid,
            email: user.email || 'gvcn@thpt.edu.vn',
            displayName: user.displayName || 'Giáo viên Chủ nhiệm',
            role: 'giao_vien_chu_nhiem',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setCurrentUser(null);
        setTeacherProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase chưa được cấu hình.');
    }

    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      const msg = getAuthErrorMessage(err?.code, err?.message);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase chưa được cấu hình.');
    }

    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      console.error('Email Sign-in error:', err);
      const msg = getAuthErrorMessage(err?.code, err?.message);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signUpTeacher = async (
    email: string, 
    pass: string, 
    name: string,
    school?: string,
    subject?: string
  ) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase chưa được cấu hình.');
    }

    try {
      setLoading(true);
      setError(null);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const newProfile: TeacherProfile = {
        uid: cred.user.uid,
        email: email.trim(),
        displayName: name.trim(),
        role: 'giao_vien_chu_nhiem',
        schoolName: school?.trim() || 'Trường THPT',
        teachingSubject: subject?.trim() || 'Toán học',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'teachers', cred.user.uid), newProfile);
      setTeacherProfile(newProfile);
      setCurrentUser(cred.user);
    } catch (err: any) {
      console.error('Sign up error:', err);
      const msg = getAuthErrorMessage(err?.code, err?.message);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase chưa được cấu hình.');
    }

    try {
      setError(null);
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Password reset error:', err);
      const msg = getAuthErrorMessage(err?.code, err?.message);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signOut = async () => {
    try {
      if (auth) {
        await fbSignOut(auth);
      }
      setTeacherProfile(null);
      setCurrentUser(null);
      setError(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        teacherProfile,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpTeacher,
        resetPassword,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

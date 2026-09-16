import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  GraduationCap, 
  School, 
  BookOpen, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function LoginView() {
  const { signInWithEmail, signUpTeacher, signInWithGoogle, resetPassword, error, clearError } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [teachingSubject, setTeachingSubject] = useState('Toán học');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const displayError = localError || error;

  const handleModeChange = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    setLocalError(null);
    setResetSuccessMessage(null);
    clearError();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setResetSuccessMessage(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Vui lòng nhập địa chỉ email của Giáo viên.');
      return;
    }

    // Chế độ Quên mật khẩu
    if (mode === 'forgot') {
      try {
        setIsSubmitting(true);
        await resetPassword(email);
        setResetSuccessMessage(`Hệ thống đã gửi liên kết khôi phục mật khẩu đến hòm thư: ${email}. Thầy/Cô vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam).`);
      } catch (err: any) {
        setLocalError(err.message || 'Không thể gửi email đặt lại mật khẩu.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      setLocalError('Vui lòng nhập mật khẩu.');
      return;
    }

    // Chế độ Đăng ký tài khoản GVCN mới
    if (mode === 'signup') {
      if (!displayName.trim()) {
        setLocalError('Vui lòng nhập Họ và tên Giáo viên.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Mật khẩu bảo mật phải có tối thiểu 6 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Mật khẩu xác nhận không trùng khớp.');
        return;
      }

      try {
        setIsSubmitting(true);
        await signUpTeacher(email, password, displayName, schoolName, teachingSubject);
      } catch (err: any) {
        setLocalError(err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Chế độ Đăng nhập bình thường
    try {
      setIsSubmitting(true);
      await signInWithEmail(email, password);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    try {
      setIsSubmitting(true);
      await signInWithGoogle();
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Container chính */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Tên ứng dụng */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-4 ring-4 ring-indigo-50">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            QUẢN LÝ LỚP CHỦ NHIỆM
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>HỆ THỐNG DÀNH RIÊNG CHO GIÁO VIÊN CHỦ NHIỆM</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Không cấp tài khoản học sinh • Dữ liệu đồng bộ trực tiếp trên Firebase
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200">
          {/* Thông báo lỗi nếu có */}
          {displayError && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Thông báo lỗi:</span>
                <span className="mt-0.5 block leading-relaxed">{displayError}</span>
              </div>
            </div>
          )}

          {/* Thông báo gửi email reset thành công */}
          {resetSuccessMessage && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Thành công:</span>
                <span className="mt-0.5 block leading-relaxed">{resetSuccessMessage}</span>
              </div>
            </div>
          )}

          {/* Form chính */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {/* Trường Họ tên và Trường (Chỉ khi đăng ký mới) */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Họ và tên Giáo viên Chủ nhiệm *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Thầy/Cô Nguyễn Văn An"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Trường THPT
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="THPT Chuyên..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Môn giảng dạy
                    </label>
                    <input
                      type="text"
                      value={teachingSubject}
                      onChange={(e) => setTeachingSubject(e.target.value)}
                      placeholder="vd: Toán, Văn..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Giáo viên *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gvcn@thpt.edu.vn"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Mật khẩu (không hiển thị ở chế độ forgot) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mật khẩu *
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('forgot')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Xác nhận mật khẩu (khi đăng ký) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Xác nhận lại mật khẩu *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>
            )}

            {/* Nút Submit chính */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xác thực thông tin...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signin'
                        ? 'Đăng Nhập Với Tư Cách GVCN'
                        : mode === 'signup'
                        ? 'Tạo Tài Khoản GVCN Mới'
                        : 'Gửi Email Khôi Phục Mật Khẩu'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Phân tách hoặc Google Auth */}
          {mode === 'signin' && (
            <>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Hoặc
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng Nhập Bằng Google (Email GVCN)</span>
                </button>
              </div>
            </>
          )}

          {/* Chuyển đổi giữa các chế độ */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            {mode === 'signin' ? (
              <p>
                Chưa có tài khoản quản lý lớp?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className="font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Đăng ký tài khoản GVCN
                </button>
              </p>
            ) : mode === 'signup' ? (
              <p>
                Đã có tài khoản GVCN?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className="font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Quay lại Đăng nhập
                </button>
              </p>
            ) : (
              <p>
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className="font-bold text-indigo-600 hover:text-indigo-700"
                >
                  ← Quay lại màn hình Đăng nhập
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Cảnh báo bảo mật bên dưới */}
        <div className="mt-6 p-4 rounded-2xl bg-white/70 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            Quy định bảo mật cơ sở dữ liệu THPT
          </p>
          <p>
            Hệ thống áp dụng Firebase Firestore Security Rules: Mọi quyền ghi sổ điểm, thêm sửa hồ sơ học sinh và xếp loại chỉ được cấp sau khi xác thực thành công tài khoản GVCN.
          </p>
        </div>
      </div>
    </div>
  );
}

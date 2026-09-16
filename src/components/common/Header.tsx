import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClass } from '../../context/ClassContext';
import { useUI } from '../../context/UIContext';
import { 
  Lock, 
  Unlock, 
  LogOut, 
  Wifi, 
  WifiOff, 
  School,
  ShieldCheck,
  Calendar
} from 'lucide-react';

export function Header() {
  const { teacherProfile, signOut } = useAuth();
  const { classroom, isDataLocked, isRealtimeConnected, toggleDataLock, selectedWeek } = useClass();
  const { showConfirmDialog } = useUI();

  const handleToggleLock = () => {
    const nextLocked = !isDataLocked;
    showConfirmDialog({
      title: nextLocked ? 'Xác nhận Khóa sổ dữ liệu' : 'Xác nhận Mở khóa dữ liệu',
      message: nextLocked
        ? 'Khi đã khóa sổ, tất cả thao tác sửa/xóa điểm, thông tin học sinh và nề nếp sẽ bị tạm dừng để bảo toàn dữ liệu. Bạn có chắc chắn muốn khóa?'
        : 'Mở khóa sẽ cho phép GVCN tiếp tục cập nhật điểm, nề nếp và thông tin học sinh. Bạn có muốn mở khóa ngay?',
      confirmLabel: nextLocked ? 'Khóa sổ ngay' : 'Mở khóa',
      isDestructive: nextLocked,
      onConfirm: async () => {
        await toggleDataLock(nextLocked);
      },
    });
  };

  const handleSignOut = () => {
    showConfirmDialog({
      title: 'Đăng xuất khỏi hệ thống',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc của Giáo viên Chủ nhiệm?',
      confirmLabel: 'Đăng xuất',
      cancelLabel: 'Ở lại',
      isDestructive: false,
      onConfirm: async () => {
        await signOut();
      },
    });
  };

  return (
    <header 
      id="app-header" 
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Class identity info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-indigo-200">
            {classroom?.className?.slice(0, 3) || '12A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Lớp {classroom?.className || '12A1'}
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                Năm học {classroom?.schoolYear || '2025-2026'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-slate-400" />
                {classroom?.schoolName || 'Trường THPT'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Tuần {selectedWeek} ({classroom?.currentSemester || 'HK1'})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Teacher Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Realtime Status Indicator */}
          <div 
            id="realtime-status-badge" 
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-600"
            title="Trạng thái kết nối Firebase Firestore Realtime"
          >
            {isRealtimeConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Realtime</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <WifiOff className="w-3 h-3 text-amber-500" />
                <span>Đang kết nối</span>
              </>
            )}
          </div>

          {/* Lock / Unlock Data Button (Chỉ GVCN) */}
          <button
            id="header-toggle-lock-btn"
            onClick={handleToggleLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isDataLocked
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={isDataLocked ? 'Dữ liệu đang bị khóa. Nhấn để mở khóa' : 'Dữ liệu đang mở. Nhấn để khóa sổ'}
          >
            {isDataLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Đã khóa sổ</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Sổ dữ liệu mở</span>
              </>
            )}
          </button>

          {/* Teacher Info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {teacherProfile?.displayName?.[0] || 'T'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {teacherProfile?.displayName || 'Thầy/Cô Chủ Nhiệm'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-700 tracking-wide uppercase">
                  GVCN
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="header-logout-btn"
              onClick={handleSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="Đăng xuất khỏi phiên GVCN"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

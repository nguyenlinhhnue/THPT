import React, { useState, useEffect } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { updateClassroomSettings } from '../../services/classService';
import { 
  Settings, 
  Lock, 
  Unlock, 
  Save, 
  School, 
  Users, 
  FileText, 
  RefreshCw,
  Sparkles,
  Database
} from 'lucide-react';

export function SettingsView() {
  const { classroom, isDataLocked, toggleDataLock, seedSampleClassData, students } = useClass();
  const { teacherProfile } = useAuth();
  const { showToast, showConfirmDialog } = useUI();

  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState<10 | 11 | 12>(12);
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [schoolName, setSchoolName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [baseCompetitionPoints, setBaseCompetitionPoints] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);

  // Số lượng học sinh thực tế đang có trong hệ thống
  const actualActiveCount = students.filter(s => s.status === 'dang_hoc').length;
  const totalCount = students.length;

  useEffect(() => {
    if (classroom) {
      setClassName(classroom.className || '12A1');
      setGrade(classroom.grade || 12);
      setSchoolYear(classroom.schoolYear || '2025-2026');
      setSchoolName(classroom.schoolName || 'Trường THPT Chuyên');
      setTeacherName(classroom.teacherName || teacherProfile?.displayName || 'Giáo viên Chủ nhiệm');
      setTeacherPhone(classroom.teacherPhone || teacherProfile?.phone || '');
      // Nếu chưa có sĩ số đã lưu, lấy số lượng học sinh thực tế
      setTotalStudents(classroom.totalStudents !== undefined ? classroom.totalStudents : totalCount);
      setNotes(classroom.notes || '');
      setBaseCompetitionPoints(classroom.baseCompetitionPoints || 100);
    }
  }, [classroom, teacherProfile, totalCount]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom?.id) return;

    if (!className.trim()) {
      showToast('error', 'Lỗi nhập liệu', 'Vui lòng nhập tên lớp.');
      return;
    }

    try {
      setSubmitting(true);
      await updateClassroomSettings(classroom.id, {
        className: className.trim(),
        grade,
        schoolYear: schoolYear.trim(),
        schoolName: schoolName.trim(),
        teacherName: teacherName.trim(),
        teacherPhone: teacherPhone.trim(),
        totalStudents: Number(totalStudents),
        notes: notes.trim(),
        baseCompetitionPoints,
      });
      showToast('success', 'Đã lưu cài đặt lớp chủ nhiệm', `Thông tin lớp ${className.trim()} đã được cập nhật đồng bộ lên Firebase Firestore.`);
    } catch (err: any) {
      console.error('Update settings error:', err);
      showToast('error', 'Lỗi lưu cấu hình', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncActualStudentCount = () => {
    setTotalStudents(totalCount);
    showToast('info', 'Đã cập nhật theo sĩ số thực tế', `Sĩ số được đặt thành ${totalCount} học sinh theo danh sách hiện tại.`);
  };

  const handleSeedData = () => {
    showConfirmDialog({
      title: 'Khởi tạo dữ liệu mẫu 20 học sinh THPT',
      message: 'Hệ thống sẽ thêm 20 học sinh mẫu chia đều vào 4 tổ thi đua, có phân công Lớp trưởng, Bí thư, Tổ trưởng để Thầy/Cô trải nghiệm đầy đủ các tính năng. Tiếp tục?',
      confirmLabel: 'Khởi tạo ngay',
      isDestructive: false,
      onConfirm: async () => {
        await seedSampleClassData();
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Cài Đặt Lớp Chủ Nhiệm
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý thông tin định danh lớp học, giáo viên chủ nhiệm, sĩ số và trạng thái khóa dữ liệu
        </p>
      </div>

      {/* Lock Control Section */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isDataLocked 
          ? 'bg-amber-50/50 border-amber-300' 
          : 'bg-emerald-50/50 border-emerald-300'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-xl shrink-0 ${isDataLocked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isDataLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Trạng thái Khóa sổ Dữ liệu: {isDataLocked ? 'ĐÃ KHÓA SỔ' : 'ĐANG MỞ'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-lg leading-relaxed">
                {isDataLocked
                  ? 'Khi đã khóa sổ, tất cả thao tác sửa/xóa điểm, thông tin học sinh và nề nếp sẽ bị tạm dừng để bảo toàn dữ liệu.'
                  : 'Sổ đang mở cho phép Giáo viên Chủ nhiệm tự do nhập điểm, sửa đổi thông tin học sinh và quản lý nề nếp.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleDataLock(!isDataLocked)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-2 ${
              isDataLocked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isDataLocked ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>Mở khóa sổ ngay</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Khóa sổ bảo mật</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form Cài đặt Thông tin Lớp */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <School className="w-4 h-4 text-indigo-600" />
            Thông Tin Lớp Học & Giáo Viên Chủ Nhiệm
          </h3>
          <span className="text-xs text-slate-400">
            Lưu trực tiếp trên Cloud Firestore
          </span>
        </div>

        {/* Nhóm 1: Tên lớp, Khối, Năm học */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên lớp chủ nhiệm *
            </label>
            <input
              type="text"
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="10A1, 11B2, 12A1..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-black text-indigo-900"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Đổi tên lớp (vd 10A1 → 10A2) sẽ tự động cập nhật khắp hệ thống
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Khối lớp *
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value) as 10 | 11 | 12)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
            >
              <option value={10}>Khối 10 THPT</option>
              <option value={11}>Khối 11 THPT</option>
              <option value={12}>Khối 12 THPT</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Năm học *
            </label>
            <input
              type="text"
              required
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
            />
          </div>
        </div>

        {/* Nhóm 2: Tên trường & Sĩ số */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên Trường THPT *
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="vd: Trường THPT Chuyên Lê Hồng Phong"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sĩ số lớp
              </label>
              <button
                type="button"
                onClick={handleSyncActualStudentCount}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                title="Đặt sĩ số bằng số học sinh hiện có trong danh sách"
              >
                Lấy thực tế ({totalCount})
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={totalStudents}
                onChange={(e) => setTotalStudents(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                HS
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Thực tế trong danh sách: {totalCount} HS ({actualActiveCount} đang học)
            </span>
          </div>
        </div>

        {/* Nhóm 3: Thông tin GVCN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Họ và tên Giáo viên Chủ nhiệm *
            </label>
            <input
              type="text"
              required
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Thầy/Cô Nguyễn Văn An"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Số điện thoại GVCN
            </label>
            <input
              type="text"
              value={teacherPhone}
              onChange={(e) => setTeacherPhone(e.target.value)}
              placeholder="0901 234 567"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            />
          </div>
        </div>

        {/* Nhóm 4: Thông tin Ghi chú lớp */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Thông tin ghi chú về lớp
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú về đặc điểm lớp, phòng học chuyên đề, ban cán sự, mục tiêu phấn đấu năm học..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Nhóm 5: Điểm chuẩn thi đua tuần */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Điểm khởi đầu thi đua tuần của mỗi Tổ
            </label>
            <p className="text-xs text-slate-500">
              Mặc định 100 điểm. Điểm tổng kết tuần = Điểm khởi đầu + Điểm cộng - Điểm trừ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="10"
              max="1000"
              value={baseCompetitionPoints}
              onChange={(e) => setBaseCompetitionPoints(Number(e.target.value))}
              className="w-28 px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-black text-center"
            />
            <span className="text-xs font-bold text-slate-600">điểm / tổ</span>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu lên Firestore...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi Thông Tin Lớp</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tiện ích Khởi tạo dữ liệu mẫu nếu lớp trống */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          Tiện Ích Khởi Tạo & Dữ Liệu
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Hiện tại lớp <strong>{className}</strong> đang có <strong>{students.length} học sinh</strong> được lưu trữ đồng bộ thời gian thực trên Firebase Firestore.
        </p>

        <button
          onClick={handleSeedData}
          className="px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Khởi tạo 20 học sinh THPT mẫu chia đều 4 tổ</span>
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Student, CLASS_ROLES, ClassRole, Gender, StudentStatus, STUDENT_STATUS_LIST } from '../../types/student';
import { addStudent, updateStudent } from '../../services/studentService';
import { useClass } from '../../context/ClassContext';
import { useUI } from '../../context/UIContext';
import { X, ShieldAlert, UserCheck, AlertCircle } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent?: Student | null;
}

export function StudentModal({ isOpen, onClose, editingStudent }: StudentModalProps) {
  const { classroom, students, isDataLocked } = useClass();
  const { showToast } = useUI();

  const [stt, setStt] = useState<number>(1);
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('nam');
  const [dateOfBirth, setDateOfBirth] = useState('2008-01-01');
  const [groupNumber, setGroupNumber] = useState<number>(1);
  const [role, setRole] = useState<ClassRole>('thanh_vien');
  const [status, setStatus] = useState<StudentStatus>('dang_hoc');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isUnionMember, setIsUnionMember] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingStudent) {
      setStt(editingStudent.stt || 1);
      setStudentCode(editingStudent.studentCode || '');
      setFullName(editingStudent.fullName || '');
      setGender(editingStudent.gender || 'nam');
      setDateOfBirth(editingStudent.dateOfBirth || '2008-01-01');
      setGroupNumber(editingStudent.groupNumber || 1);
      setRole(editingStudent.role || 'thanh_vien');
      setStatus(editingStudent.status || 'dang_hoc');
      setPhone(editingStudent.phone || '');
      setParentName(editingStudent.parentName || '');
      setParentPhone(editingStudent.parentPhone || '');
      setAddress(editingStudent.address || '');
      setIsUnionMember(editingStudent.isUnionMember ?? true);
      setNotes(editingStudent.notes || '');
    } else {
      // Gợi ý STT và Mã học sinh tiếp theo
      const nextStt = students.length + 1;
      setStt(nextStt);
      const gradeStr = classroom?.grade || 12;
      const paddedStt = nextStt < 10 ? `0${nextStt}` : `${nextStt}`;
      setStudentCode(`HS${gradeStr}${paddedStt}`);
      setFullName('');
      setGender('nam');
      setDateOfBirth('2008-01-01');
      setGroupNumber(((nextStt - 1) % 4) + 1); // Phân đều vào 4 tổ
      setRole('thanh_vien');
      setStatus('dang_hoc');
      setPhone('');
      setParentName('');
      setParentPhone('');
      setAddress('');
      setIsUnionMember(true);
      setNotes('');
    }
  }, [editingStudent, isOpen, students.length, classroom?.grade]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom?.id) return;
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã bị khóa', 'Vui lòng mở khóa sổ trước khi thêm hoặc sửa học sinh.');
      return;
    }

    if (!studentCode.trim() || !fullName.trim()) {
      showToast('warning', 'Thiếu thông tin bắt buộc', 'Vui lòng nhập Mã học sinh và Họ tên.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          stt: Number(stt),
          studentCode: studentCode.trim(),
          fullName: fullName.trim(),
          gender,
          dateOfBirth,
          groupNumber: Number(groupNumber),
          role,
          status,
          phone: phone.trim(),
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          address: address.trim(),
          isUnionMember,
          notes: notes.trim(),
        });
        showToast('success', 'Cập nhật thành công', `Đã lưu hồ sơ học sinh ${fullName.trim()}. Dữ liệu điểm và lịch sử nề nếp được bảo toàn.`);
      } else {
        await addStudent(classroom.id, {
          stt: Number(stt),
          studentCode: studentCode.trim(),
          fullName: fullName.trim(),
          gender,
          dateOfBirth,
          groupNumber: Number(groupNumber),
          role,
          status,
          phone: phone.trim(),
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          address: address.trim(),
          isUnionMember,
          notes: notes.trim(),
        });
        showToast('success', 'Thêm học sinh thành công', `Đã thêm em ${fullName.trim()} vào danh sách lớp.`);
      }
      onClose();
    } catch (err: any) {
      console.error('Save student error:', err);
      showToast('error', 'Lỗi lưu thông tin', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingStudent ? 'Chỉnh Sửa Hồ Sơ Học Sinh' : 'Thêm Học Sinh Mới Vào Lớp'}
            </h3>
            <p className="text-xs text-slate-500">
              Lưu trực tiếp vào Firestore • Điểm số và lịch sử vi phạm/khen thưởng được bảo toàn trọn vẹn
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cảnh báo phân quyền bắt buộc */}
        <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý:</strong> Chức vụ (Lớp trưởng, Bí thư, Tổ trưởng...) chỉ là thông tin quản lý hành chính trong hồ sơ lớp. Cán sự lớp <strong>không được cấp tài khoản, không được đăng nhập và không được nhập/sửa dữ liệu</strong>.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* STT, Mã HS, Họ và tên */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                STT *
              </label>
              <input
                type="number"
                required
                min="1"
                max="200"
                value={stt}
                onChange={(e) => setStt(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold text-center"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mã học sinh *
              </label>
              <input
                type="text"
                required
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="HS1201"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono font-semibold"
              />
            </div>

            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Họ và tên học sinh *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn An"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Giới tính, Ngày sinh, Tổ, Trạng thái */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Giới tính
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
              >
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nhóm / Tổ thi đua *
              </label>
              <select
                value={groupNumber}
                onChange={(e) => setGroupNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-black text-indigo-700"
              >
                {Array.from({ length: classroom?.totalGroups || 4 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tổ {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Trạng thái học *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StudentStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold text-slate-800"
              >
                {STUDENT_STATUS_LIST.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chức vụ cán sự lớp */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Chức vụ trong lớp:
              </label>
              <span className="text-[11px] text-slate-500">
                Lớp trưởng • Bí thư • Lớp phó • Tổ trưởng • Tổ phó • Thành viên
              </span>
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ClassRole)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold text-indigo-900"
            >
              {CLASS_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Thông tin liên hệ & Phụ huynh */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SĐT Học sinh
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ tên Phụ huynh
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Bác Nguyễn Văn B"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SĐT Phụ huynh
              </label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="0987..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Địa chỉ & Đoàn viên */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ cư trú
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, phố/thôn, phường/xã"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUnionMember}
                  onChange={(e) => setIsUnionMember(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Đoàn viên Đoàn TNCS HCM
                </span>
              </label>
            </div>
          </div>

          {/* Ghi chú riêng của GVCN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú của GVCN (Hoàn cảnh gia đình, sức khỏe, học lực, năng khiếu...)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thông tin ghi chú phục vụ công tác chủ nhiệm..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{editingStudent ? 'Lưu Cập Nhật Hồ Sơ' : 'Thêm Học Sinh Vào Lớp'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

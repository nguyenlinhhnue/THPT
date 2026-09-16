import React, { useState, useEffect } from 'react';
import { Student } from '../../types/student';
import { THPT_SUBJECTS, Semester } from '../../types/score';
import { 
  LearningRecord, 
  AssessmentType, 
  ASSESSMENT_TYPE_LABELS, 
  CreateLearningRecordInput, 
  UpdateLearningRecordInput 
} from '../../types/learning';
import { 
  X, 
  Save, 
  BookOpen, 
  User, 
  Calendar, 
  Award, 
  HelpCircle, 
  MessageSquareQuote, 
  Scale,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface LearningRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateLearningRecordInput | UpdateLearningRecordInput) => Promise<void>;
  students: Student[];
  initialRecord?: LearningRecord | null;
  defaultStudentId?: string;
  isDataLocked?: boolean;
}

export function LearningRecordModal({
  isOpen,
  onClose,
  onSave,
  students,
  initialRecord,
  defaultStudentId,
  isDataLocked = false,
}: LearningRecordModalProps) {
  const isEditing = Boolean(initialRecord);

  // Form states
  const [studentId, setStudentId] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState<string>('toan');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('15_phut');
  const [assessmentName, setAssessmentName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weekNumber, setWeekNumber] = useState<number>(12);
  const [semester, setSemester] = useState<Semester>('HK1');
  const [score, setScore] = useState<string>('8.0');
  const [feedback, setFeedback] = useState<string>('');
  const [achievement, setAchievement] = useState<string>('');
  const [supportNeeded, setSupportNeeded] = useState<string>('');

  // Tùy chọn liên kết điểm rèn luyện thi đua
  const [createConductTransaction, setCreateConductTransaction] = useState<boolean>(false);
  const [conductBonusScore, setConductBonusScore] = useState<number>(2);
  const [conductReason, setConductReason] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Khởi tạo giá trị form khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    if (initialRecord) {
      setStudentId(initialRecord.studentId);
      setSubjectCode(initialRecord.subjectCode);
      setAssessmentType(initialRecord.assessmentType);
      setAssessmentName(initialRecord.assessmentName);
      setDate(initialRecord.date);
      setWeekNumber(initialRecord.weekNumber || 12);
      setSemester(initialRecord.semester || 'HK1');
      setScore(initialRecord.score.toString());
      setFeedback(initialRecord.feedback || '');
      setAchievement(initialRecord.achievement || '');
      setSupportNeeded(initialRecord.supportNeeded || '');
      setCreateConductTransaction(initialRecord.hasConductBonus || false);
      setConductBonusScore(initialRecord.conductBonusScore || 2);
      setConductReason('');
    } else {
      setStudentId(defaultStudentId || (students.length > 0 ? students[0].id : ''));
      setSubjectCode('toan');
      setAssessmentType('15_phut');
      setAssessmentName('Kiểm tra 15 phút');
      setDate(new Date().toISOString().split('T')[0]);
      setWeekNumber(12);
      setSemester('HK1');
      setScore('8.0');
      setFeedback('');
      setAchievement('');
      setSupportNeeded('');
      setCreateConductTransaction(false);
      setConductBonusScore(2);
      setConductReason('');
    }
    setFormError(null);
  }, [isOpen, initialRecord, defaultStudentId, students]);

  // Tự động gợi ý tên bài kiểm tra khi đổi loại hoặc môn nếu người dùng chưa sửa
  const handleSubjectOrTypeChange = (newSubject: string, newType: AssessmentType) => {
    setSubjectCode(newSubject);
    setAssessmentType(newType);

    const subj = THPT_SUBJECTS.find(s => s.code === newSubject);
    const typeLabel = ASSESSMENT_TYPE_LABELS[newType] || 'Kiểm tra';
    if (!isEditing && (!assessmentName || assessmentName.startsWith('Kiểm tra'))) {
      setAssessmentName(`${typeLabel} ${subj?.name || ''}`.trim());
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDataLocked) {
      setFormError('Sổ dữ liệu đang bị khóa. Không thể thực hiện lưu.');
      return;
    }

    if (!studentId) {
      setFormError('Vui lòng chọn học sinh.');
      return;
    }

    if (!assessmentName.trim()) {
      setFormError('Vui lòng nhập tên bài kiểm tra.');
      return;
    }

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      setFormError('Điểm số phải là số từ 0.0 đến 10.0');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const subj = THPT_SUBJECTS.find(s => s.code === subjectCode);

      if (isEditing) {
        await onSave({
          subjectCode,
          subjectName: subj?.name,
          assessmentType,
          assessmentName: assessmentName.trim(),
          date,
          weekNumber,
          semester,
          score: Math.round(numScore * 10) / 10,
          feedback: feedback.trim(),
          achievement: achievement.trim(),
          supportNeeded: supportNeeded.trim(),
          updateLinkedConductTransaction: createConductTransaction,
          conductBonusScore: createConductTransaction ? conductBonusScore : undefined,
        });
      } else {
        await onSave({
          studentId,
          subjectCode,
          subjectName: subj?.name,
          assessmentType,
          assessmentName: assessmentName.trim(),
          date,
          weekNumber,
          semester,
          score: Math.round(numScore * 10) / 10,
          feedback: feedback.trim(),
          achievement: achievement.trim(),
          supportNeeded: supportNeeded.trim(),
          createConductTransaction,
          conductBonusScore: createConductTransaction ? conductBonusScore : undefined,
          conductReason: conductReason.trim() || undefined,
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving learning record:', err);
      setFormError(err.message || 'Không thể lưu bản ghi học tập.');
    } finally {
      setSaving(false);
    }
  };

  const selectedStudent = students.find(s => s.id === studentId);
  const numScore = parseFloat(score);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEditing ? 'Chỉnh sửa Bản ghi Học tập' : 'Ghi nhận Điểm & Theo dõi Học tập'}
              </h2>
              <p className="text-xs text-slate-500">
                Chỉ GVCN có quyền quản lý và lưu trữ dữ liệu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Chọn học sinh (Nếu thêm mới) hoặc hiển thị tên (Nếu sửa) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Học sinh theo dõi *
            </label>
            {isEditing ? (
              <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 flex items-center justify-between">
                <span>{initialRecord?.studentNameSnapshot} ({initialRecord?.studentCodeSnapshot})</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                  Tổ {initialRecord?.groupNumberSnapshot}
                </span>
              </div>
            ) : (
              <select
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    STT {s.stt}: {s.fullName} - {s.studentCode} (Tổ {s.groupNumber})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Môn học & Loại kiểm tra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Môn học *
              </label>
              <select
                value={subjectCode}
                onChange={e => handleSubjectOrTypeChange(e.target.value, assessmentType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {THPT_SUBJECTS.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Loại kiểm tra *
              </label>
              <select
                value={assessmentType}
                onChange={e => handleSubjectOrTypeChange(subjectCode, e.target.value as AssessmentType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(ASSESSMENT_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Tên bài kiểm tra & Điểm số */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên bài kiểm tra / Nội dung đánh giá *
              </label>
              <input
                type="text"
                value={assessmentName}
                onChange={e => setAssessmentName(e.target.value)}
                placeholder="VD: Kiểm tra 15 phút Đạo hàm, Khảo sát chất lượng..."
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Điểm số (0.0 - 10.0) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-base font-bold text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {!isNaN(numScore) && (
                  <span className={`absolute right-2.5 top-2.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                    numScore >= 9.0 ? 'bg-emerald-100 text-emerald-800' :
                    numScore >= 8.0 ? 'bg-blue-100 text-blue-800' :
                    numScore >= 6.5 ? 'bg-indigo-100 text-indigo-800' :
                    numScore >= 5.0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {numScore >= 9 ? 'Xuất sắc' : numScore >= 8 ? 'Giỏi' : numScore >= 6.5 ? 'Khá' : numScore >= 5 ? 'TB' : 'Cần cố gắng'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Thời gian: Ngày kiểm tra, Tuần, Học kỳ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Ngày kiểm tra *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tuần học *
              </label>
              <select
                value={weekNumber}
                onChange={e => setWeekNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>
                    Tuần {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Học kỳ *
              </label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value as Semester)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
                <option value="CaNam">Cả năm</option>
              </select>
            </div>
          </div>

          {/* 5. Nhận xét của GV */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-slate-500" />
              Nhận xét của giáo viên
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="VD: Bài làm trình bày sạch sẽ, hiểu bài; cần chú ý đơn vị và điều kiện nghiệm..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* 6. Thành tích nổi bật & Nội dung cần hỗ trợ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Thành tích ghi nhận (Nếu có)
              </label>
              <input
                type="text"
                value={achievement}
                onChange={e => setAchievement(e.target.value)}
                placeholder="VD: Điểm 10 xuất sắc, Tiến bộ vượt bậc..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                Nội dung cần hỗ trợ / Phụ đạo
              </label>
              <input
                type="text"
                value={supportNeeded}
                onChange={e => setSupportNeeded(e.target.value)}
                placeholder="VD: Chưa thuộc công thức lượng giác, cần kèm thêm..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* 7. Khối tích hợp Điểm rèn luyện thi đua (Tuân thủ nguyên tắc nguồn gốc dữ liệu) */}
          <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-3">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="conductBonusCheck"
                checked={createConductTransaction}
                onChange={e => setCreateConductTransaction(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="conductBonusCheck" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  Ghi nhận cộng điểm rèn luyện thi đua cho kết quả học tập này?
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Nguồn gốc dữ liệu là <strong className="text-indigo-700">Học tập</strong>. Hệ thống sẽ tự động tạo Transaction điểm thi đua tương ứng. Không tự ý cộng điểm rèn luyện nếu chưa xác nhận.
                </p>
              </div>
            </div>

            {createConductTransaction && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-100/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Mức điểm cộng rèn luyện
                  </label>
                  <select
                    value={conductBonusScore}
                    onChange={e => setConductBonusScore(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-emerald-700 focus:outline-hidden"
                  >
                    <option value={1}>+1 điểm</option>
                    <option value={2}>+2 điểm (Khuyến khích)</option>
                    <option value={3}>+3 điểm (Xuất sắc)</option>
                    <option value={5}>+5 điểm (Thành tích đặc biệt)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Lý do giao dịch rèn luyện (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={conductReason}
                    onChange={e => setConductReason(e.target.value)}
                    placeholder={`Thành tích học tập: ${assessmentName || 'Kiểm tra'} (${score}đ)`}
                    className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || isDataLocked}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu vào Firebase...' : isEditing ? 'Cập nhật bản ghi' : 'Lưu bản ghi học tập'}
          </button>
        </div>
      </div>
    </div>
  );
}

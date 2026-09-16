import React, { useState, useEffect, useRef } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { 
  WeeklyPointTransaction, 
  TransactionCategory 
} from '../../types/pointTransaction';
import { PointRule, CATEGORY_LABELS } from '../../types/pointRule';
import { 
  addPointTransaction, 
  updatePointTransaction 
} from '../../services/pointTransactionService';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  User, 
  Calendar,
  Lock,
  ArrowRight,
  Scale,
  Sliders
} from 'lucide-react';

interface SingleTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  initialScoreType?: 'plus' | 'minus';
  editingTransaction?: WeeklyPointTransaction | null;
}

export function SingleTransactionModal({
  isOpen,
  onClose,
  initialStudentId,
  initialScoreType = 'plus',
  editingTransaction,
}: SingleTransactionModalProps) {
  const { classroom, students, pointRules, selectedWeek, isDataLocked, setSyncStatus } = useClass();
  const { currentUser, teacherProfile } = useAuth();
  const { showToast, setActiveTab } = useUI();

  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [score, setScore] = useState<number>(2);
  const [isPositive, setIsPositive] = useState<boolean>(true);
  const [category, setCategory] = useState<TransactionCategory>('hoc_tap');
  const [categoryLabel, setCategoryLabel] = useState<string>('Học tập');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Khóa chống double-click phần cứng (Hardware & logic lock)
  const isSubmittingRef = useRef<boolean>(false);

  // Danh sách quy tắc đang kích hoạt theo loại điểm (Cộng / Trừ)
  const activeRulesForType = pointRules.filter(
    (r) => r.isActive && (isPositive ? r.type === 'plus' : r.type === 'minus')
  );

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setStudentId(editingTransaction.studentId);
      setDate(editingTransaction.date);
      setScore(Math.abs(editingTransaction.score));
      setIsPositive(editingTransaction.score >= 0);
      setCategory(editingTransaction.category);
      setCategoryLabel(editingTransaction.categoryLabel);
      setReason(editingTransaction.reason);
      setNote(editingTransaction.note || '');
      setSelectedRuleId(editingTransaction.ruleSnapshot?.ruleId || null);
    } else {
      setStudentId(initialStudentId || (students[0]?.id ?? ''));
      setDate(new Date().toISOString().split('T')[0]);
      const isPos = initialScoreType === 'plus';
      setIsPositive(isPos);
      
      // Tìm quy tắc mẫu đầu tiên phù hợp
      const defaultRule = pointRules.find(r => r.isActive && (isPos ? r.type === 'plus' : r.type === 'minus'));
      if (defaultRule) {
        setScore(Math.abs(defaultRule.score));
        setCategory(defaultRule.category);
        setCategoryLabel(defaultRule.categoryLabel);
        setReason(defaultRule.name);
        setSelectedRuleId(defaultRule.id);
      } else {
        setScore(isPos ? 1 : 2);
        setCategory(isPos ? 'hoc_tap' : 'chuyen_can');
        setCategoryLabel(isPos ? 'Học tập' : 'Chuyên cần');
        setReason(isPos ? 'Phát biểu xây dựng bài' : 'Đi học muộn');
        setSelectedRuleId(null);
      }

      setNote('');
      setStudentSearch('');
    }
  }, [isOpen, editingTransaction, initialStudentId, initialScoreType, students, pointRules]);

  if (!isOpen) return null;

  const handleSelectRule = (rule: PointRule) => {
    setSelectedRuleId(rule.id);
    setIsPositive(rule.type === 'plus');
    setScore(Math.abs(rule.score));
    setCategory(rule.category);
    setCategoryLabel(rule.categoryLabel || CATEGORY_LABELS[rule.category]);
    setReason(rule.name);
  };

  const handleSetQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current || submitting) {
      return; // Chặn double click tuyệt đối
    }

    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa', 'Vui lòng mở khóa sổ trước khi thực hiện thao tác.');
      return;
    }

    if (!classroom?.id) {
      showToast('error', 'Chưa có thông tin lớp');
      return;
    }

    if (!studentId) {
      showToast('warning', 'Chưa chọn học sinh', 'Vui lòng chọn học sinh được ghi nhận điểm.');
      return;
    }

    if (!reason.trim()) {
      showToast('warning', 'Thiếu nội dung', 'Vui lòng nhập lý do cộng/trừ điểm.');
      return;
    }

    if (!score || score <= 0) {
      showToast('warning', 'Điểm không hợp lệ', 'Điểm phải lớn hơn 0.');
      return;
    }

    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) {
      showToast('error', 'Học sinh không tồn tại trong danh sách lớp.');
      return;
    }

    const finalScore = isPositive ? Math.abs(score) : -Math.abs(score);
    const teacherName = teacherProfile?.displayName || 'Giáo viên Chủ nhiệm';
    const teacherEmail = currentUser?.email || 'gvcn';

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);
      setSyncStatus('syncing');

      if (editingTransaction) {
        // Cập nhật giao dịch đã có
        await updatePointTransaction(
          editingTransaction.id,
          editingTransaction,
          {
            score: finalScore,
            reason: reason.trim(),
            category,
            categoryLabel,
            date,
            note: note.trim(),
          },
          teacherName
        );

        showToast(
          'success',
          'Đã cập nhật transaction điểm tuần',
          `${targetStudent.fullName} • ${finalScore > 0 ? '+' : ''}${finalScore} điểm`
        );
      } else {
        // Tạo TRANSACTION MỚI độc lập
        const matchedRule = pointRules.find((r) => r.id === selectedRuleId);

        await addPointTransaction({
          classId: classroom.id,
          studentId: targetStudent.id,
          weekNumber: selectedWeek,
          date,
          category,
          categoryLabel,
          reason: reason.trim(),
          score: finalScore,
          type: isPositive ? 'plus' : 'minus',
          note: note.trim(),
          createdBy: teacherEmail,
          createdByName: teacherName,
          studentNameSnapshot: targetStudent.fullName,
          studentCodeSnapshot: targetStudent.studentCode,
          groupNumberSnapshot: targetStudent.groupNumber,
          ruleSnapshot: matchedRule
            ? {
                ruleId: matchedRule.id,
                label: matchedRule.name,
                defaultScore: matchedRule.score,
                category: matchedRule.category,
              }
            : {
                label: reason.trim(),
                defaultScore: finalScore,
                category: category,
              },
        });

        showToast(
          'success',
          isPositive ? 'Đã tạo Transaction CỘNG điểm' : 'Đã tạo Transaction TRỪ điểm',
          `Học sinh: ${targetStudent.fullName} (Tổ ${targetStudent.groupNumber}) • ${finalScore > 0 ? '+' : ''}${finalScore} đ • Tuần ${selectedWeek}`
        );
      }

      onClose();
    } catch (err: any) {
      console.error('Point transaction error:', err);
      showToast('error', 'Lỗi thực hiện giao dịch', err.message);
      setSyncStatus('error');
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Lọc danh sách học sinh theo ô tìm kiếm
  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.stt?.toString() === studentSearch
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {editingTransaction ? 'Chỉnh Sửa Giao Dịch Điểm Tuần' : 'Nhập Transaction Điểm Tuần (1 Học Sinh)'}
            </h3>
            <p className="text-xs text-slate-500">
              Chỉ GVCN có quyền ghi nhận • Tuần {selectedWeek} • Tự động ghi nhận snapshot & audit log
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Chọn học sinh */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Học sinh được ghi nhận điểm <span className="text-rose-500">*</span>
            </label>

            {!editingTransaction ? (
              <div className="space-y-2">
                {/* Search input if class is large */}
                {students.length > 8 && (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo họ tên, mã HS hoặc STT..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                >
                  <option value="" disabled>-- Chọn học sinh trong danh sách --</option>
                  {[1, 2, 3, 4].map((groupNum) => {
                    const groupMembers = filteredStudents.filter((s) => s.groupNumber === groupNum);
                    if (groupMembers.length === 0) return null;
                    return (
                      <optgroup key={groupNum} label={`--- TỔ ${groupNum} (${groupMembers.length} HS) ---`}>
                        {groupMembers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.stt ? `${s.stt}. ` : ''}{s.fullName} ({s.studentCode}) • Tổ {s.groupNumber}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                <span>{editingTransaction.studentNameSnapshot}</span>
                <span className="text-indigo-600 font-mono">Tổ {editingTransaction.groupNumberSnapshot}</span>
              </div>
            )}
          </div>

          {/* 2. Loại giao dịch (Cộng hoặc Trừ) & Số điểm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                2. Loại giao dịch điểm
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPositive(true);
                    const firstPlus = pointRules.find(r => r.isActive && r.type === 'plus');
                    if (firstPlus) handleSelectRule(firstPlus);
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isPositive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Cộng điểm (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPositive(false);
                    const firstMinus = pointRules.find(r => r.isActive && r.type === 'minus');
                    if (firstMinus) handleSelectRule(firstMinus);
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    !isPositive
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Trừ điểm (-)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Số điểm ({isPositive ? '+ điểm' : '- điểm'}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className={`absolute left-3 top-2 font-black text-base ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPositive ? '+' : '-'}
                </div>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(Math.max(0.5, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2 text-base font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Mẫu quy tắc chọn nhanh (Không hard-code, lấy từ danh mục quy tắc của lớp) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                3. Chọn quy tắc chấm điểm (Lớp {classroom?.className || 'THPT'})
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveTab('point_rules');
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
                title="Tự thiết lập thêm hoặc sửa quy tắc chấm điểm"
              >
                <Scale className="w-3 h-3" />
                Quản lý quy tắc
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50/50 rounded-xl border border-slate-200/60">
              {activeRulesForType.length === 0 ? (
                <div className="w-full py-4 text-center text-xs text-slate-500">
                  <span>Chưa có quy tắc {isPositive ? 'cộng' : 'trừ'} điểm nào đang kích hoạt. </span>
                  <button
                    type="button"
                    onClick={() => { onClose(); setActiveTab('point_rules'); }}
                    className="text-indigo-600 underline font-semibold ml-1"
                  >
                    Bấm để thiết lập quy tắc
                  </button>
                </div>
              ) : (
                activeRulesForType.map((rule) => {
                  const isSelected = selectedRuleId === rule.id;
                  return (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => handleSelectRule(rule)}
                      className={`px-3 py-1.5 text-xs rounded-xl border font-medium transition-all ${
                        isSelected
                          ? isPositive
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                            : 'bg-rose-100 border-rose-500 text-rose-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{rule.name}</span>
                      <span className={`ml-1.5 font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                        ({rule.score > 0 ? `+${rule.score}` : rule.score})
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 4. Nội dung cụ thể & Ngày */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                4. Nội dung / Lý do ghi nhận <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Hăng hái phát biểu xây dựng bài, Đi học muộn 15 phút..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Ngày ghi nhận
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(0)}
                    className="px-2.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(1)}
                    className="px-2.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                  >
                    Hôm qua
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Ghi chú bổ sung (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm cho GVCN..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chống ghi đè & chống double-click tự động</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting || isDataLocked}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                  isPositive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu Transaction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingTransaction ? 'Lưu Thay Đổi' : 'Tạo Transaction'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

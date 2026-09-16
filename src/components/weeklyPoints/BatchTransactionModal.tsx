import React, { useState, useRef } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { 
  TransactionCategory 
} from '../../types/pointTransaction';
import { PointRule, CATEGORY_LABELS } from '../../types/pointRule';
import { 
  addBatchPointTransactions, 
  CreatePointTransactionInput 
} from '../../services/pointTransactionService';
import { 
  X, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  CheckSquare, 
  Square,
  Search,
  Filter,
  Scale,
  Sliders
} from 'lucide-react';

interface BatchTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchTransactionModal({ isOpen, onClose }: BatchTransactionModalProps) {
  const { classroom, students, pointRules, selectedWeek, isDataLocked, setSyncStatus } = useClass();
  const { currentUser, teacherProfile } = useAuth();
  const { showToast, setActiveTab } = useUI();

  // Danh sách ID học sinh được chọn
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPositive, setIsPositive] = useState<boolean>(true);
  const [score, setScore] = useState<number>(5);
  const [category, setCategory] = useState<TransactionCategory>('ve_sinh');
  const [categoryLabel, setCategoryLabel] = useState<string>('Vệ sinh');
  const [reason, setReason] = useState<string>('Trực nhật xuất sắc, lớp sạch đẹp');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isSubmittingRef = useRef<boolean>(false);

  // Danh sách quy tắc đang kích hoạt theo loại điểm
  const activeRulesForType = pointRules.filter(
    (r) => r.isActive && (isPositive ? r.type === 'plus' : r.type === 'minus')
  );

  if (!isOpen) return null;

  // Chọn / Bỏ chọn học sinh
  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Chọn toàn bộ 1 tổ
  const selectByGroup = (groupNum: number) => {
    const groupMemberIds = students
      .filter((s) => s.groupNumber === groupNum && s.status === 'dang_hoc')
      .map((s) => s.id);
    
    // Nếu cả tổ đã chọn -> Bỏ chọn tổ; ngược lại gom vào
    const allSelected = groupMemberIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !groupMemberIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...groupMemberIds])));
    }
  };

  // Chọn tất cả
  const selectAll = () => {
    const allIds = students.filter((s) => s.status === 'dang_hoc').map((s) => s.id);
    setSelectedStudentIds(allIds);
  };

  // Bỏ chọn tất cả
  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleSelectRule = (rule: PointRule) => {
    setSelectedRuleId(rule.id);
    setIsPositive(rule.type === 'plus');
    setScore(Math.abs(rule.score));
    setCategory(rule.category);
    setCategoryLabel(rule.categoryLabel || CATEGORY_LABELS[rule.category]);
    setReason(rule.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current || submitting) return;

    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa', 'Không thể ghi nhận điểm khi sổ đang khóa.');
      return;
    }

    if (!classroom?.id) {
      showToast('error', 'Chưa có thông tin lớp');
      return;
    }

    if (selectedStudentIds.length === 0) {
      showToast('warning', 'Chưa chọn học sinh nào', 'Vui lòng tích chọn ít nhất 1 học sinh hoặc 1 tổ.');
      return;
    }

    if (!reason.trim()) {
      showToast('warning', 'Thiếu nội dung', 'Vui lòng nhập nội dung lý do cộng/trừ điểm.');
      return;
    }

    const teacherName = teacherProfile?.displayName || 'Giáo viên Chủ nhiệm';
    const teacherEmail = currentUser?.email || 'gvcn';
    const finalScore = isPositive ? Math.abs(score) : -Math.abs(score);
    const matchedRule = pointRules.find((r) => r.id === selectedRuleId);

    // Chuẩn bị MỖI TRANSACTION RIÊNG BIỆT cho từng học sinh
    const inputs: CreatePointTransactionInput[] = selectedStudentIds.map((sid) => {
      const student = students.find((s) => s.id === sid)!;
      return {
        classId: classroom.id,
        studentId: student.id,
        weekNumber: selectedWeek,
        date,
        category,
        categoryLabel,
        reason: reason.trim(),
        score: finalScore,
        type: isPositive ? 'plus' : 'minus',
        note: note.trim() ? `${note.trim()} (Ghi nhận hàng loạt)` : 'Ghi nhận hàng loạt',
        createdBy: teacherEmail,
        createdByName: teacherName,
        studentNameSnapshot: student.fullName,
        studentCodeSnapshot: student.studentCode,
        groupNumberSnapshot: student.groupNumber,
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
              category,
            },
      };
    });

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);
      setSyncStatus('syncing');

      const created = await addBatchPointTransactions(inputs);

      showToast(
        'success',
        `Tạo thành công ${created.length} Transaction riêng biệt!`,
        `${isPositive ? 'Cộng' : 'Trừ'} ${Math.abs(finalScore)} điểm cho ${created.length} học sinh • Tuần ${selectedWeek}`
      );

      onClose();
    } catch (err: any) {
      console.error('Batch points error:', err);
      showToast('error', 'Lỗi khi ghi nhận hàng loạt', err.message);
      setSyncStatus('error');
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.stt?.toString() === searchFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Ghi Nhận Điểm Hàng Loạt (Nhiều Học Sinh / Cả Tổ)
            </h3>
            <p className="text-xs text-slate-500">
              Mỗi học sinh sẽ được tạo một Transaction độc lập với snapshot tên và tổ riêng biệt
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Kiến trúc Transaction độc lập Banner */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Đang chọn <strong>{selectedStudentIds.length}</strong> học sinh. Hệ thống sẽ tạo đúng{' '}
                <strong>{selectedStudentIds.length} Transaction riêng biệt</strong> trong Firestore.
              </span>
            </div>
            <span className="font-bold text-indigo-700 font-mono">Tuần {selectedWeek}</span>
          </div>

          {/* 1. Chọn học sinh / Chọn tổ */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Chọn học sinh áp dụng ({selectedStudentIds.length}/{students.length}) <span className="text-rose-500">*</span>
              </label>

              {/* Quick group selectors */}
              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: classroom?.totalGroups || 4 }).map((_, i) => {
                  const g = i + 1;
                  const groupMemberIds = students
                    .filter((s) => s.groupNumber === g && s.status === 'dang_hoc')
                    .map((s) => s.id);
                  const isAllInGroup =
                    groupMemberIds.length > 0 &&
                    groupMemberIds.every((id) => selectedStudentIds.includes(id));

                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => selectByGroup(g)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                        isAllInGroup
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      Tổ {g}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
                >
                  Tất cả lớp
                </button>

                {selectedStudentIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>
            </div>

            {/* Student Search & List Checkboxes */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="p-2 border-b border-slate-200 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Lọc danh sách học sinh theo tên..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {filteredStudents.map((s) => {
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      onClick={() => toggleStudent(s.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="truncate flex-1">
                        <span className="text-slate-400 mr-1">{s.stt ? `${s.stt}.` : ''}</span>
                        <span>{s.fullName}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 shrink-0">
                        T{s.groupNumber}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Loại giao dịch & Số điểm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                2. Loại giao dịch điểm
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPositive(true)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    isPositive
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Cộng điểm hàng loạt (+)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPositive(false)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    !isPositive
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Trừ điểm hàng loạt (-)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Mức điểm cho mỗi học sinh <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-2 font-black text-base ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPositive ? '+' : '-'}
                </span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(Math.max(1, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2 text-sm font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Mẫu chọn nhanh (Từ danh mục quy tắc của lớp) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                3. Chọn quy tắc chấm điểm
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveTab('point_rules');
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
                title="Tự thiết lập quy tắc của lớp"
              >
                <Scale className="w-3 h-3" />
                Quản lý quy tắc
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50/50 rounded-xl border border-slate-200/60">
              {activeRulesForType.length === 0 ? (
                <div className="w-full py-3 text-center text-xs text-slate-500">
                  <span>Chưa có quy tắc nào đang dùng. </span>
                  <button
                    type="button"
                    onClick={() => { onClose(); setActiveTab('point_rules'); }}
                    className="text-indigo-600 underline font-semibold ml-1"
                  >
                    Bấm để thiết lập quy tắc
                  </button>
                </div>
              ) : (
                activeRulesForType.map((rule) => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => handleSelectRule(rule)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                      selectedRuleId === rule.id
                        ? isPositive
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                          : 'bg-rose-100 border-rose-500 text-rose-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {rule.name} ({rule.score > 0 ? `+${rule.score}` : rule.score})
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 4. Nội dung & Ngày */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Lý do / Nội dung <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Trực nhật tổ sạch đẹp, Cả tổ cùng tiến..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Ngày ghi nhận
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Tổng số bản ghi sẽ sinh ra:{' '}
              <strong className="text-indigo-600 font-bold">{selectedStudentIds.length}</strong> Transaction
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
                disabled={submitting || selectedStudentIds.length === 0 || isDataLocked}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang tạo {selectedStudentIds.length} Transaction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tạo Hàng Loạt ({selectedStudentIds.length} HS)</span>
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

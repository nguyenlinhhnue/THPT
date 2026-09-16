import React, { useState, useMemo } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { 
  WeeklyPointTransaction, 
  CATEGORY_LABELS, 
  CATEGORY_COLOR_MAP,
  TransactionCategory 
} from '../../types/pointTransaction';
import { 
  addPointTransaction, 
  voidPointTransaction,
  deletePointTransactionPermanently
} from '../../services/pointTransactionService';
import { formatDateVN } from '../../utils/formatters';
import { AuditLogModal } from '../weeklyPoints/AuditLogModal';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Lock,
  Search,
  Calendar,
  Sparkles,
  Users,
  Clock,
  FileSpreadsheet,
  ArrowRight,
  Scale
} from 'lucide-react';

export function ConductView() {
  const { 
    classroom, 
    students, 
    pointTransactions, 
    pointRules,
    selectedWeek, 
    setSelectedWeek, 
    isDataLocked,
    setSyncStatus
  } = useClass();

  const { currentUser, teacherProfile } = useAuth();
  const { showConfirm, showToast, setActiveTab } = useUI();

  // Total groups (dynamic: default 4)
  const totalGroups = classroom?.totalGroups || 4;

  // Form State for Recording Violation
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('ky_luat');
  const [reason, setReason] = useState('');
  const [score, setScore] = useState<number>(2); // Positive input, converted to negative
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter State
  const [filterPeriodMode, setFilterPeriodMode] = useState<'week' | 'month' | 'all'>('week');
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const today = new Date();
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    return `${today.getFullYear()}-${m}`;
  });
  const [filterGroup, setFilterGroup] = useState<number | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'voided'>('all');

  // Modal Audit Log
  const [viewingAuditTx, setViewingAuditTx] = useState<WeeklyPointTransaction | null>(null);

  // Active minus rules defined in the Point Rules system
  const activeMinusRules = useMemo(() => {
    return pointRules.filter(r => r.type === 'minus' && r.isActive);
  }, [pointRules]);

  // Handle choosing a preset rule from pointRules
  const handleSelectRule = (rule: typeof pointRules[0]) => {
    setSelectedRuleId(rule.id);
    setSelectedCategory((rule.category as TransactionCategory) || 'ky_luat');
    setReason(rule.name);
    setScore(Math.abs(rule.score));
    if (rule.description && !note) {
      setNote(rule.description);
    }
  };

  // Submit Violation Transaction
  const handleRecordViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom?.id) return;

    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa', 'Vui lòng mở khóa sổ trước khi ghi nhận vi phạm.');
      return;
    }

    if (!selectedStudentId) {
      showToast('warning', 'Chưa chọn học sinh', 'Vui lòng chọn học sinh vi phạm.');
      return;
    }

    if (!reason.trim()) {
      showToast('warning', 'Thiếu nội dung vi phạm', 'Vui lòng nhập lý do hoặc chọn một quy tắc.');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      showToast('error', 'Không tìm thấy học sinh');
      return;
    }

    const matchedRule = pointRules.find(r => r.id === selectedRuleId);
    const finalScore = -Math.abs(Number(score) || 1);

    try {
      setSubmitting(true);
      setSyncStatus('syncing');

      const newTx = await addPointTransaction({
        classId: classroom.id,
        studentId: student.id,
        weekNumber: selectedWeek,
        date,
        category: selectedCategory,
        categoryLabel: CATEGORY_LABELS[selectedCategory] || 'Kỷ luật & Nề nếp',
        reason: reason.trim(),
        score: finalScore,
        type: 'minus',
        note: note.trim(),
        createdBy: currentUser?.email || 'gvcn',
        createdByName: teacherProfile?.displayName || 'Giáo viên Chủ nhiệm',
        studentNameSnapshot: student.fullName,
        studentCodeSnapshot: student.studentCode,
        groupNumberSnapshot: student.groupNumber,
        ruleSnapshot: matchedRule ? {
          ruleId: matchedRule.id,
          label: matchedRule.name,
          defaultScore: matchedRule.score,
          category: matchedRule.category
        } : {
          label: reason.trim(),
          defaultScore: finalScore,
          category: selectedCategory
        }
      });

      setSyncStatus('saved');
      showToast(
        'success',
        `Đã ghi nhận vi phạm ${finalScore} điểm`,
        `${student.fullName} (Tổ ${student.groupNumber}) • Mã TX: ${newTx.transactionId} • Tự động đồng bộ điểm ngày, tuần, tháng & thi đua tổ.`
      );

      // Reset form
      setReason('');
      setNote('');
      setSelectedRuleId('');
    } catch (err: any) {
      console.error('Record violation error:', err);
      setSyncStatus('error');
      showToast('error', 'Lỗi khi ghi nhận vi phạm', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Void (Hoàn tác) Violation
  const handleVoidViolation = (tx: WeeklyPointTransaction) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa');
      return;
    }

    showConfirm({
      title: 'Hoàn tác ghi nhận vi phạm?',
      message: `Bạn có chắc muốn hủy ghi nhận lỗi "${tx.reason}" (${tx.score} đ) của học sinh ${tx.studentNameSnapshot}? Điểm tuần và điểm thi đua của Tổ sẽ lập tức được phục hồi.`,
      confirmLabel: 'Hoàn tác vi phạm',
      cancelLabel: 'Giữ lại',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setSyncStatus('syncing');
          await voidPointTransaction(
            tx.id,
            tx,
            teacherProfile?.displayName || 'GVCN',
            'GVCN hoàn tác từ module Vi phạm Rèn luyện'
          );
          setSyncStatus('saved');
          showToast('success', 'Đã hoàn tác vi phạm thành công');
        } catch (err: any) {
          setSyncStatus('error');
          showToast('error', 'Lỗi khi hoàn tác', err.message);
        }
      },
    });
  };

  // Permanently Delete Violation
  const handleDeleteViolation = (tx: WeeklyPointTransaction) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa');
      return;
    }

    showConfirm({
      title: 'Xóa vĩnh viễn bản ghi vi phạm?',
      message: `Hành động này sẽ xóa hoàn toàn Transaction ${tx.transactionId} khỏi hệ thống. Chỉ nên thực hiện khi nhập sai nghiêm trọng.`,
      confirmLabel: 'Xóa vĩnh viễn',
      cancelLabel: 'Hủy bỏ',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setSyncStatus('syncing');
          await deletePointTransactionPermanently(tx.id);
          setSyncStatus('saved');
          showToast('success', 'Đã xóa vĩnh viễn bản ghi');
        } catch (err: any) {
          setSyncStatus('error');
          showToast('error', 'Lỗi khi xóa bản ghi', err.message);
        }
      },
    });
  };

  // Filter all minus/violation transactions
  const allViolationTransactions = useMemo(() => {
    return pointTransactions.filter(t => t.score < 0 || t.type === 'minus');
  }, [pointTransactions]);

  // Apply filters to violations list
  const filteredViolations = useMemo(() => {
    return allViolationTransactions.filter(tx => {
      // Period filter
      if (filterPeriodMode === 'week' && tx.weekNumber !== selectedWeek) {
        return false;
      }
      if (filterPeriodMode === 'month') {
        if (filterMonth && !tx.date.startsWith(filterMonth)) {
          return false;
        }
      }

      // Group filter (based on current student group or snapshot)
      if (filterGroup !== 'all') {
        const student = students.find(s => s.id === tx.studentId);
        const currentGroup = student ? student.groupNumber : tx.groupNumberSnapshot;
        if (currentGroup !== filterGroup) {
          return false;
        }
      }

      // Category filter
      if (filterCategory !== 'all' && tx.category !== filterCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'valid' && tx.status !== 'valid') return false;
      if (statusFilter === 'voided' && tx.status !== 'voided') return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = tx.studentNameSnapshot?.toLowerCase().includes(query);
        const matchCode = tx.studentCodeSnapshot?.toLowerCase().includes(query);
        const matchReason = tx.reason?.toLowerCase().includes(query);
        const matchTxId = tx.transactionId?.toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchReason && !matchTxId) return false;
      }

      return true;
    });
  }, [allViolationTransactions, filterPeriodMode, selectedWeek, filterMonth, filterGroup, filterCategory, statusFilter, searchTerm, students]);

  // Statistics for current filtered scope
  const stats = useMemo(() => {
    const validList = filteredViolations.filter(t => t.status === 'valid');
    const totalViolations = validList.length;
    const totalPointsDeducted = validList.reduce((sum, t) => sum + Math.abs(t.score), 0);

    // Group with most violations
    const groupCountMap: Record<number, number> = {};
    for (const t of validList) {
      const student = students.find(s => s.id === t.studentId);
      const g = student ? student.groupNumber : t.groupNumberSnapshot;
      groupCountMap[g] = (groupCountMap[g] || 0) + 1;
    }
    let topGroupNum: number | null = null;
    let maxGroupViolations = 0;
    Object.entries(groupCountMap).forEach(([g, count]) => {
      if (count > maxGroupViolations) {
        maxGroupViolations = count;
        topGroupNum = Number(g);
      }
    });

    // Student with most violations
    const studentCountMap: Record<string, { name: string; count: number; points: number }> = {};
    for (const t of validList) {
      if (!studentCountMap[t.studentId]) {
        studentCountMap[t.studentId] = { name: t.studentNameSnapshot, count: 0, points: 0 };
      }
      studentCountMap[t.studentId].count++;
      studentCountMap[t.studentId].points += Math.abs(t.score);
    }
    let topStudent: { name: string; count: number; points: number } | null = null;
    Object.values(studentCountMap).forEach(s => {
      if (!topStudent || s.count > topStudent.count) {
        topStudent = s;
      }
    });

    return {
      totalViolations,
      totalPointsDeducted,
      topGroupNum,
      maxGroupViolations,
      topStudent,
    };
  }, [filteredViolations, students]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Module Vi phạm Rèn luyện
            </span>
            {isDataLocked && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Đã khóa sổ
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Quản Lý & Ghi Nhận Vi Phạm Nề Nếp Lớp {classroom?.className || '12A1'}
          </h1>
          <p className="text-xs text-slate-500">
            Tất cả vi phạm đều liên kết với hệ thống Transaction • Tự động tính điểm ngày, điểm tuần, điểm tháng, xếp loại và thi đua tổ
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('point_rules')}
            className="px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all flex items-center gap-1.5"
            title="Tự thiết lập các mức điểm trừ vi phạm của lớp"
          >
            <Scale className="w-3.5 h-3.5 text-amber-600" />
            <span>Quy tắc chấm điểm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weekly_points')}
            className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sổ Điểm Tuần</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tổng số lỗi vi phạm
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-rose-700">
                {stats.totalViolations}
              </span>
              <span className="text-xs text-slate-400 font-medium">lượt ghi nhận</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tổng điểm trừ nề nếp
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-amber-700">
                -{stats.totalPointsDeducted}
              </span>
              <span className="text-xs text-slate-400 font-medium">điểm thi đua</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tổ vi phạm nhiều nhất
            </span>
            <div className="mt-0.5 truncate">
              {stats.topGroupNum ? (
                <span className="text-sm font-black text-slate-900">
                  Tổ {stats.topGroupNum} ({stats.maxGroupViolations} lượt)
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-400">Chưa có vi phạm</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Học sinh cần nhắc nhở
            </span>
            <div className="mt-0.5 truncate">
              {stats.topStudent ? (
                <span className="text-sm font-bold text-rose-700 truncate block" title={stats.topStudent.name}>
                  {stats.topStudent.name} ({stats.topStudent.count} lần, -{stats.topStudent.points}đ)
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600">Lớp không vi phạm</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left Form + Right Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Ghi nhận Vi phạm mới (5 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-600" />
                Ghi Nhận Vi Phạm Mới
              </h3>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                Tạo Transaction trừ
              </span>
            </div>

            {/* Quick Rules chips from active pointRules */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quy tắc vi phạm mẫu:
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('point_rules')}
                  className="text-[11px] text-indigo-600 hover:underline font-medium"
                >
                  Sửa quy tắc
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                {activeMinusRules.length === 0 ? (
                  <span className="text-xs text-slate-400 italic p-1">Chưa có quy tắc trừ nào được kích hoạt</span>
                ) : (
                  activeMinusRules.map((rule) => (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => handleSelectRule(rule)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all text-left font-medium ${
                        selectedRuleId === rule.id
                          ? 'bg-rose-100 border-rose-500 text-rose-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50/50'
                      }`}
                    >
                      {rule.name} ({rule.score})
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Form */}
            <form id="record-violation-form" onSubmit={handleRecordViolation} className="space-y-3.5">
              {/* 1. Chọn học sinh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Chọn Học Sinh Vi Phạm <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="">-- Chọn học sinh trong danh sách --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.stt ? `${s.stt}. ` : ''}{s.fullName} ({s.studentCode}) — Tổ {s.groupNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Ngày vi phạm & Tuần */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Ngày vi phạm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tuần sinh hoạt <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {Array.from({ length: 35 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Tuần {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Loại vi phạm (Danh mục) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  3. Nhóm vi phạm <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as TransactionCategory)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="chuyen_can">Chuyên cần (Đi muộn, vắng không phép...)</option>
                  <option value="hoc_tap">Học tập (Quên bài, không chuẩn bị bài, mất trật tự...)</option>
                  <option value="dong_phuc">Đồng phục & Tác phong (Không bảng tên, dép lê...)</option>
                  <option value="ve_sinh">Vệ sinh & Trực nhật (Quên trực nhật, xả rác...)</option>
                  <option value="ky_luat">Kỷ luật & Nội quy chung</option>
                  <option value="khac">Khác</option>
                </select>
              </div>

              {/* 4. Nội dung lỗi vi phạm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  4. Nội dung / Tên vi phạm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="vd: Đi học muộn 15p, Không làm bài tập Toán..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-medium"
                />
              </div>

              {/* 5. Mức điểm trừ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  5. Mức điểm trừ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-black text-rose-600 text-sm">-</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    required
                    value={score}
                    onChange={(e) => setScore(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-black text-rose-700 bg-rose-50/40 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Hệ thống sẽ ghi nhận giao dịch: <strong>-{Math.abs(score || 1)} điểm</strong>
                </span>
              </div>

              {/* 6. Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  6. Ghi chú bổ sung (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="vd: Tiết 3 cô Lan báo, Đã nhắc nhở lần 1..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || isDataLocked || students.length === 0}
                className={`w-full py-2.5 px-4 text-xs font-bold text-white rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 ${
                  isDataLocked || students.length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 active:scale-[0.98]'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{submitting ? 'Đang tạo Transaction...' : 'Lưu Vi Phạm & Tạo Transaction'}</span>
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            💡 Mỗi lần lưu sẽ tạo 1 <strong>Transaction</strong> trừ điểm kèm snapshot học sinh & tổ, lập tức trừ điểm ngày, điểm tuần, tháng và điểm thi đua của tổ học sinh đó.
          </div>
        </div>

        {/* Danh sách các vi phạm trong lớp (7 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {/* Header & Filter Controls */}
          <div className="flex flex-col gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Danh Sách Giao Dịch Vi Phạm ({filteredViolations.length})
              </h3>

              {/* Scope Switcher: Tuần / Tháng / Tất cả */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterPeriodMode('week')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterPeriodMode === 'week'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo Tuần {selectedWeek}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPeriodMode('month')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterPeriodMode === 'month'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPeriodMode('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterPeriodMode === 'all'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất Cả
                </button>
              </div>
            </div>

            {/* Extra Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm học sinh, lỗi vi phạm, mã TX..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Group Filter (Dynamic 1..totalGroups) */}
              <div className="sm:col-span-3">
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">Tất cả các tổ</option>
                  {Array.from({ length: totalGroups }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tổ {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Picker if Month mode */}
              {filterPeriodMode === 'month' && (
                <div className="sm:col-span-4">
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Status Filter */}
              <div className={filterPeriodMode === 'month' ? 'sm:col-span-12 flex gap-2' : 'sm:col-span-4 flex gap-2'}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="valid">Chỉ vi phạm hợp lệ</option>
                  <option value="voided">Chỉ vi phạm đã hủy/hoàn tác</option>
                </select>
              </div>
            </div>
          </div>

          {/* Violations List Table */}
          {filteredViolations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Không có vi phạm nào trong bộ lọc này</p>
              <p className="text-xs text-slate-400">
                Lớp học đang duy trì nề nếp rất tốt! Sử dụng form bên trái để ghi nhận khi có vi phạm mới.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Mã & Ngày</th>
                    <th className="py-2.5 px-3">Học Sinh</th>
                    <th className="py-2.5 px-2 text-center">Tổ</th>
                    <th className="py-2.5 px-3">Nội Dung Vi Phạm</th>
                    <th className="py-2.5 px-3 text-center">Điểm Trừ</th>
                    <th className="py-2.5 px-2 text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredViolations.map((tx) => {
                    const isVoided = tx.status === 'voided';
                    const currentStudent = students.find(s => s.id === tx.studentId);
                    const isGroupChanged = currentStudent && currentStudent.groupNumber !== tx.groupNumberSnapshot;

                    return (
                      <tr 
                        key={tx.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isVoided ? 'bg-slate-50/40 text-slate-400' : ''
                        }`}
                      >
                        {/* Transaction ID & Date */}
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[11px] font-bold text-indigo-700 block">
                            {tx.transactionId}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDateVN(tx.date)} • T{tx.weekNumber}
                          </span>
                        </td>

                        {/* Student Name */}
                        <td className="py-2.5 px-3">
                          <span className={`font-bold block ${isVoided ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {tx.studentNameSnapshot}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {tx.studentCodeSnapshot || '—'}
                          </span>
                        </td>

                        {/* Group Number & Transfer Notice */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-700">
                              Tổ {currentStudent?.groupNumber || tx.groupNumberSnapshot}
                            </span>
                            {isGroupChanged && (
                              <span className="text-[9px] text-amber-600 font-medium mt-0.5" title={`Lúc ghi nhận ở Tổ ${tx.groupNumberSnapshot}`}>
                                (Gốc: T{tx.groupNumberSnapshot})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Reason / Category / Note */}
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <p className={`font-medium ${isVoided ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {tx.reason}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              {tx.categoryLabel || tx.category}
                            </span>
                            {tx.note && (
                              <span className="text-[10px] text-slate-400 italic">
                                • {tx.note}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Points */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl font-black text-xs ${
                              isVoided
                                ? 'bg-slate-100 text-slate-400 line-through'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {tx.score}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2 text-center">
                          {!isVoided ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Hợp lệ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-2.5 h-2.5" /> Đã hủy
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingAuditTx(tx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="Xem Audit Log và Snapshot"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>

                            {!isVoided ? (
                              <button
                                type="button"
                                disabled={isDataLocked}
                                onClick={() => handleVoidViolation(tx)}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-30"
                                title="Hoàn tác vi phạm này"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isDataLocked}
                                onClick={() => handleDeleteViolation(tx)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30"
                                title="Xóa vĩnh viễn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Modal */}
      {viewingAuditTx && (
        <AuditLogModal
          isOpen={Boolean(viewingAuditTx)}
          transaction={viewingAuditTx}
          onClose={() => setViewingAuditTx(null)}
        />
      )}
    </div>
  );
}

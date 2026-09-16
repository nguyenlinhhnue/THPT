import React, { useState, useEffect, useMemo } from 'react';
import { useClass } from '../../context/ClassContext';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { Semester } from '../../types/score';
import { 
  ClassificationPeriodType, 
  ClassificationCriteriaConfig, 
  StudentClassificationResult, 
  OfficialClassificationDoc, 
  DEFAULT_CLASSIFICATION_CONFIG 
} from '../../types/classification';
import { 
  getClassificationConfig, 
  saveClassificationConfig, 
  calculateClassifications, 
  getPeriodKey, 
  getPeriodLabel, 
  subscribeOfficialClassification, 
  lockOfficialClassification, 
  unlockOfficialClassification,
  updateStudentCommentInOfficialDoc
} from '../../services/classificationService';
import { ClassificationConfigModal } from './ClassificationConfigModal';
import { ClassificationTraceModal } from './ClassificationTraceModal';
import { EmptyState } from '../common/EmptyState';
import { 
  Award, 
  Sliders, 
  Lock, 
  Unlock, 
  Search, 
  Filter, 
  Calendar, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  HelpCircle, 
  MessageSquareQuote, 
  Save, 
  BookOpen,
  Sparkles,
  Layers,
  Scale
} from 'lucide-react';

export function ClassificationView() {
  const { 
    classroom, 
    students, 
    pointTransactions, 
    learningRecords, 
    selectedWeek, 
    setSelectedWeek,
    selectedSemester,
    setSelectedSemester,
    isDataLocked: isGlobalDataLocked
  } = useClass();
  const { showToast, openConfirmDialog } = useUI();
  const { currentUser, teacherProfile } = useAuth();

  // Period state
  const [periodType, setPeriodType] = useState<ClassificationPeriodType>('week');
  const [currentWeek, setCurrentWeek] = useState<number>(selectedWeek || 12);
  const [currentMonth, setCurrentMonth] = useState<string>('2025-10');
  const [currentSemester, setCurrentSemester] = useState<Semester>(selectedSemester || 'HK1');

  // Config state
  const [config, setConfig] = useState<ClassificationCriteriaConfig>({
    ...DEFAULT_CLASSIFICATION_CONFIG,
    classId: classroom?.id || 'default_class',
  });
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Official classification locked document state
  const [officialDoc, setOfficialDoc] = useState<OfficialClassificationDoc | null>(null);
  const [loadingOfficial, setLoadingOfficial] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  const [rankFilter, setRankFilter] = useState<string>('all');

  // Trace modal state
  const [traceResult, setTraceResult] = useState<StudentClassificationResult | null>(null);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);

  // Inline comments state (Draft comments before locking or when editing)
  const [commentsMap, setCommentsMap] = useState<Record<string, string>>({});
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);

  // Key đại diện chu kỳ hiện tại
  const periodKey = useMemo(() => {
    return getPeriodKey(periodType, currentWeek, currentMonth, currentSemester);
  }, [periodType, currentWeek, currentMonth, currentSemester]);

  const periodLabel = useMemo(() => {
    return getPeriodLabel(periodType, currentWeek, currentMonth, currentSemester);
  }, [periodType, currentWeek, currentMonth, currentSemester]);

  // 1. Tải cấu hình thang điểm và điều kiện
  useEffect(() => {
    if (!classroom?.id) return;
    getClassificationConfig(classroom.id)
      .then(cfg => setConfig(cfg))
      .catch(err => console.error('Fetch classification config error:', err));
  }, [classroom?.id]);

  // 2. Lắng nghe realtime văn bản xếp loại chính thức của chu kỳ này
  useEffect(() => {
    if (!classroom?.id) return;
    setLoadingOfficial(true);
    const unsub = subscribeOfficialClassification(classroom.id, periodKey, (docData) => {
      setOfficialDoc(docData);
      setLoadingOfficial(false);

      // Đồng bộ nhận xét của giáo viên
      if (docData?.studentResults) {
        const map: Record<string, string> = {};
        docData.studentResults.forEach(r => {
          if (r.teacherComment) map[r.studentId] = r.teacherComment;
        });
        setCommentsMap(prev => ({ ...prev, ...map }));
      }
    });

    return () => unsub();
  }, [classroom?.id, periodKey]);

  // 3. Tính toán xếp loại trực tiếp từ hệ thống transactions
  const calculatedResults: StudentClassificationResult[] = useMemo(() => {
    if (!students || students.length === 0) return [];

    const baseResults = calculateClassifications({
      students,
      transactions: pointTransactions,
      learningRecords,
      periodType,
      selectedWeek: currentWeek,
      selectedMonth: currentMonth,
      selectedSemester: currentSemester,
      config,
      basePoints: classroom?.baseCompetitionPoints || 100,
      lockedDoc: officialDoc,
    });

    // Bổ sung nhận xét của giáo viên từ local state
    return baseResults.map(r => ({
      ...r,
      teacherComment: commentsMap[r.studentId] ?? r.teacherComment ?? '',
    }));
  }, [
    students,
    pointTransactions,
    learningRecords,
    periodType,
    currentWeek,
    currentMonth,
    currentSemester,
    config,
    classroom?.baseCompetitionPoints,
    officialDoc,
    commentsMap,
  ]);

  // 4. Lọc kết quả tìm kiếm và bộ lọc tổ/xếp loại
  const filteredResults = useMemo(() => {
    return calculatedResults.filter(r => {
      // Tìm kiếm
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = r.studentName.toLowerCase().includes(q) || r.studentCode.toLowerCase().includes(q);
        const matchRank = r.rankName.toLowerCase().includes(q);
        const matchComment = (r.teacherComment || '').toLowerCase().includes(q);
        if (!matchName && !matchRank && !matchComment) return false;
      }

      // Lọc tổ
      if (groupFilter !== 'all' && r.groupNumber !== groupFilter) return false;

      // Lọc mức xếp loại
      if (rankFilter !== 'all' && r.rankName !== rankFilter) return false;

      return true;
    });
  }, [calculatedResults, searchTerm, groupFilter, rankFilter]);

  // 5. Thống kê tổng hợp realtime
  const stats = useMemo(() => {
    const total = calculatedResults.length;
    let sufficientCount = 0;
    let insufficientCount = 0;
    let sumScore = 0;
    const tierCounts: Record<string, number> = {};
    let sourceChangedCount = 0;

    calculatedResults.forEach(r => {
      if (r.isSufficientData) {
        sufficientCount += 1;
        sumScore += r.netScore;
        tierCounts[r.rankName] = (tierCounts[r.rankName] || 0) + 1;
      } else {
        insufficientCount += 1;
        tierCounts['Chưa đủ dữ liệu'] = (tierCounts['Chưa đủ dữ liệu'] || 0) + 1;
      }

      if (r.hasSourceDataChanged) {
        sourceChangedCount += 1;
      }
    });

    return {
      total,
      sufficientCount,
      insufficientCount,
      averageScore: sufficientCount > 0 ? Math.round((sumScore / sufficientCount) * 10) / 10 : 0,
      tierCounts,
      sourceChangedCount,
    };
  }, [calculatedResults]);

  // Xử lý lưu cấu hình thang điểm mới
  const handleSaveConfig = async (newConfig: ClassificationCriteriaConfig) => {
    if (!classroom?.id) return;
    try {
      await saveClassificationConfig(classroom.id, newConfig, currentUser?.email || 'GVCN');
      setConfig(newConfig);
      showToast('success', 'Đã lưu cấu hình thang xếp loại', 'Kết quả xếp loại được tính toán lại ngay lập tức.');
    } catch (err: any) {
      showToast('error', 'Lỗi lưu cấu hình', err.message);
    }
  };

  // Xử lý Khóa Xếp loại Chính thức
  const handleLockOfficial = () => {
    if (!classroom?.id) return;

    if (stats.insufficientCount > 0) {
      openConfirmDialog({
        title: 'Khóa Xếp loại Chính thức?',
        message: `Hiện có ${stats.insufficientCount} học sinh ở trạng thái "Chưa đủ dữ liệu". Bạn có chắc chắn muốn khóa và ban hành xếp loại chính thức cho ${periodLabel}?`,
        confirmText: 'Vẫn khóa chính thức',
        cancelText: 'Xem lại',
        onConfirm: async () => {
          await executeLock();
        },
      });
      return;
    }

    openConfirmDialog({
      title: 'Khóa & Ban hành Xếp loại Chính thức?',
      message: `Hệ thống sẽ lưu vết toàn bộ transaction nguồn gốc và cố định kết quả xếp loại ${periodLabel}. Sau khi khóa, không ai có thể tự ý sửa điểm nếu chưa mở khóa.`,
      confirmText: 'Khóa chính thức ngay',
      cancelText: 'Hủy',
      onConfirm: async () => {
        await executeLock();
      },
    });
  };

  const executeLock = async () => {
    if (!classroom?.id) return;
    try {
      await lockOfficialClassification(
        classroom.id,
        periodType,
        periodKey,
        periodLabel,
        config,
        calculatedResults,
        currentUser?.email || 'GVCN',
        teacherProfile?.displayName || 'Giáo viên Chủ nhiệm'
      );
      showToast('success', 'Đã khóa xếp loại chính thức!', `Bản xếp loại ${periodLabel} đã được cố định và lưu vết thành công.`);
    } catch (err: any) {
      console.error('Lock official error:', err);
      showToast('error', 'Không thể khóa xếp loại', err.message);
    }
  };

  // Xử lý Mở khóa Xếp loại Chính thức
  const handleUnlockOfficial = () => {
    if (!classroom?.id) return;

    openConfirmDialog({
      title: 'Mở khóa Xếp loại Chính thức?',
      message: `Bạn đang yêu cầu mở khóa kết quả xếp loại ${periodLabel}. Sau khi mở khóa, kết quả sẽ chuyển về trạng thái tạm thời (realtime) và có thể tính toán lại theo giao dịch điểm mới nhất.`,
      confirmText: 'Mở khóa chỉnh sửa',
      cancelText: 'Giữ khóa',
      isDanger: true,
      onConfirm: async () => {
        try {
          await unlockOfficialClassification(classroom.id, periodKey, currentUser?.email || 'GVCN');
          showToast('info', 'Đã mở khóa xếp loại', 'Hiện có thể cập nhật nhận xét và tính toán lại dữ liệu.');
        } catch (err: any) {
          console.error('Unlock official error:', err);
          showToast('error', 'Không thể mở khóa', err.message);
        }
      },
    });
  };

  // Cập nhật nhận xét cho một học sinh
  const handleSaveComment = async (studentId: string, comment: string) => {
    setCommentsMap(prev => ({ ...prev, [studentId]: comment }));

    if (officialDoc?.isLocked && classroom?.id) {
      try {
        setSavingCommentId(studentId);
        await updateStudentCommentInOfficialDoc(classroom.id, periodKey, studentId, comment);
        showToast('success', 'Đã lưu nhận xét học sinh');
      } catch (err: any) {
        showToast('error', 'Lỗi lưu nhận xét', err.message);
      } finally {
        setSavingCommentId(null);
      }
    }
  };

  // Mở modal kiểm tra nguồn gốc transaction
  const handleOpenTrace = (result: StudentClassificationResult) => {
    setTraceResult(result);
    setIsTraceModalOpen(true);
  };

  // In bảng xếp loại
  const handlePrint = () => {
    window.print();
  };

  const isLocked = officialDoc?.isLocked ?? false;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Status Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              XẾP LOẠI HỌC SINH
            </h1>
            
            {/* Huy hiệu trạng thái Tạm thời / Chính thức */}
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <Lock className="w-3.5 h-3.5" />
                Xếp loại Chính thức (ĐÃ KHÓA)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                Xếp loại Tạm thời (Realtime)
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 max-w-2xl">
            Điểm xếp loại được trích xuất trực tiếp từ hệ thống giao dịch nề nếp và dữ liệu học tập. Không nhập lại điểm thủ công; bảo toàn khả năng truy nguyên dữ liệu gốc bất biến.
          </p>

          {isLocked && (
            <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
              <span>Đã khóa ngày: <strong className="text-slate-700">{new Date(officialDoc.lockedAt).toLocaleDateString('vi-VN')} {new Date(officialDoc.lockedAt).toLocaleTimeString('vi-VN')}</strong></span>
              <span>•</span>
              <span>Bởi GVCN: <strong className="text-slate-700">{officialDoc.lockedByName || officialDoc.lockedBy}</strong></span>
            </div>
          )}
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            Cấu hình Thang & Điều kiện
          </button>

          {isLocked ? (
            <button
              type="button"
              onClick={handleUnlockOfficial}
              className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Unlock className="w-4 h-4" />
              Mở khóa xếp loại
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLockOfficial}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              Khóa & Ban hành Chính thức
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            title="In bảng xếp loại"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cảnh báo thay đổi dữ liệu nguồn nếu đã khóa chính thức */}
      {isLocked && stats.sourceChangedCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 text-amber-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Cảnh báo thay đổi dữ liệu nguồn ({stats.sourceChangedCount} học sinh bị ảnh hưởng)
              </h3>
              <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                Kể từ thời điểm khóa bản xếp loại chính thức, hệ thống phát hiện có giao dịch điểm mới hoặc giao dịch bị sửa/xóa liên quan đến {periodLabel}. 
                Kết quả chính thức vẫn đang được bảo lưu nguyên trạng. Thầy/Cô có thể nhấn nút <strong>Mở khóa xếp loại</strong> để cập nhật lại nếu cần.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUnlockOfficial}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs whitespace-nowrap self-start sm:self-auto transition-all"
          >
            Mở khóa & Cập nhật
          </button>
        </div>
      )}

      {/* Bộ chọn Chu kỳ Thời gian: Tuần / Tháng / Học kỳ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPeriodType('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodType === 'week' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Theo Tuần
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodType === 'month' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Theo Tháng
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('semester')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodType === 'semester' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Theo Học Kỳ
            </button>
          </div>

          {/* Period value selector */}
          <div className="flex items-center gap-2">
            {periodType === 'week' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                  disabled={currentWeek <= 1}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={currentWeek}
                  onChange={e => setCurrentWeek(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 focus:outline-hidden"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>
                      Tuần {w}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCurrentWeek(Math.min(35, currentWeek + 1))}
                  disabled={currentWeek >= 35}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {periodType === 'month' && (
              <select
                value={currentMonth}
                onChange={e => setCurrentMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 focus:outline-hidden"
              >
                <option value="2025-09">Tháng 9/2025</option>
                <option value="2025-10">Tháng 10/2025</option>
                <option value="2025-11">Tháng 11/2025</option>
                <option value="2025-12">Tháng 12/2025</option>
                <option value="2026-01">Tháng 1/2026</option>
                <option value="2026-02">Tháng 2/2026</option>
                <option value="2026-03">Tháng 3/2026</option>
                <option value="2026-04">Tháng 4/2026</option>
                <option value="2026-05">Tháng 5/2026</option>
              </select>
            )}

            {periodType === 'semester' && (
              <select
                value={currentSemester}
                onChange={e => setCurrentSemester(e.target.value as Semester)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 focus:outline-hidden"
              >
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
                <option value="CaNam">Cả năm</option>
              </select>
            )}
          </div>
        </div>

        {/* Filter Bar: Tìm kiếm, lọc tổ, lọc mức xếp loại */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm học sinh, mã số, nhận xét..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
            >
              <option value="all">Tất cả các tổ</option>
              <option value={1}>Tổ 1</option>
              <option value={2}>Tổ 2</option>
              <option value={3}>Tổ 3</option>
              <option value={4}>Tổ 4</option>
            </select>
          </div>

          <div>
            <select
              value={rankFilter}
              onChange={e => setRankFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
            >
              <option value="all">Tất cả mức xếp loại</option>
              {config.tiers.map(t => (
                <option key={t.id} value={t.name}>
                  Mức {t.name}
                </option>
              ))}
              <option value="Chưa đủ dữ liệu">Chưa đủ dữ liệu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Sĩ số */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sĩ số lớp</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">học sinh</div>
        </div>

        {/* Điểm trung bình */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ĐTB Rèn luyện</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">
            {stats.sufficientCount > 0 ? stats.averageScore.toFixed(1) : '--'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Thang điểm chuẩn {classroom?.baseCompetitionPoints || 100}</div>
        </div>

        {/* Từng Tier thống kê */}
        {config.tiers.map(t => {
          const count = stats.tierCounts[t.name] || 0;
          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          const colorClass = 
            t.badgeColor === 'emerald' ? 'text-emerald-700' :
            t.badgeColor === 'blue' ? 'text-blue-700' :
            t.badgeColor === 'amber' ? 'text-amber-700' : 'text-rose-700';

          return (
            <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Xếp loại {t.name}
              </div>
              <div className={`text-2xl font-bold mt-1 ${colorClass}`}>
                {count}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {pct}% sĩ số (≥ {t.minScore}đ)
              </div>
            </div>
          );
        })}

        {/* Chưa đủ dữ liệu */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chưa đủ dữ liệu</div>
          <div className={`text-2xl font-bold mt-1 ${stats.insufficientCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {stats.insufficientCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Không tự ý xếp loại</div>
        </div>
      </div>

      {/* Danh Sách Xếp Loại Học Sinh */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <span>Bảng Xếp loại {periodLabel}</span>
            <span className="text-slate-400 font-normal">({filteredResults.length} học sinh)</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Nguồn gốc: Weekly Point Transactions</span>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="Không có học sinh nào phù hợp"
              description="Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc tổ / mức xếp loại."
              actionLabel="Xóa bộ lọc"
              onAction={() => {
                setSearchTerm('');
                setGroupFilter('all');
                setRankFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-3 text-center">Điểm Rèn Luyện</th>
                  <th className="py-3 px-3 text-center">Vi phạm</th>
                  <th className="py-3 px-4">Kết quả học tập</th>
                  <th className="py-3 px-3 text-center">Mức Xếp Loại</th>
                  <th className="py-3 px-4">Nhận xét của GVCN</th>
                  <th className="py-3 px-3 text-center w-20">Nguồn gốc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((item, idx) => {
                  return (
                    <tr key={item.studentId} className="hover:bg-slate-50/70 transition-colors">
                      {/* STT */}
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {item.stt}
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{item.studentName}</span>
                          {item.hasSourceDataChanged && (
                            <span title="Dữ liệu giao dịch nguồn đã thay đổi sau khi khóa">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{item.studentCode}</span>
                          <span>•</span>
                          <span className="font-semibold text-indigo-600">Tổ {item.groupNumber}</span>
                        </div>
                      </td>

                      {/* Điểm tổng hợp trực tiếp từ transactions */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-block text-center">
                          <span className={`text-base font-bold px-2.5 py-0.5 rounded-lg ${
                            item.netScore >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            item.netScore >= 80 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            item.netScore >= 65 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.netScore.toFixed(1)}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            +{item.totalPlusScore} / -{item.totalMinusScore}
                          </div>
                        </div>
                      </td>

                      {/* Số lần vi phạm */}
                      <td className="py-3 px-3 text-center">
                        {item.violationsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="w-3 h-3" />
                            {item.violationsCount} lỗi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Tốt
                          </span>
                        )}
                      </td>

                      {/* Kết quả học tập nếu có */}
                      <td className="py-3 px-4">
                        {item.academicTestsCount > 0 ? (
                          <div>
                            <div className="font-semibold text-slate-700 flex items-center gap-1">
                              <span>ĐTB: <strong className="text-indigo-700">{item.academicScoreAverage?.toFixed(1)}</strong></span>
                              <span className="text-[10px] text-slate-400 font-normal">({item.academicTestsCount} bài)</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              {item.academicAchievementsCount > 0 && (
                                <span className="text-emerald-700 font-medium">+{item.academicAchievementsCount} khen</span>
                              )}
                              {item.academicSupportCount > 0 && (
                                <span className="text-rose-600 font-medium">• {item.academicSupportCount} cần phụ đạo</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Chưa có điểm bài</span>
                        )}
                      </td>

                      {/* Mức Xếp loại */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.isSufficientData ? (
                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                            item.badgeColor === 'emerald' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            item.badgeColor === 'blue' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            item.badgeColor === 'amber' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            item.badgeColor === 'purple' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {item.rankName}
                          </span>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                              Chưa đủ dữ liệu
                            </span>
                            {item.insufficientReason && (
                              <span className="text-[10px] text-slate-400 max-w-[140px] truncate mt-0.5" title={item.insufficientReason}>
                                {item.insufficientReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Nhận xét của GVCN */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.teacherComment}
                          onChange={e => setCommentsMap(prev => ({ ...prev, [item.studentId]: e.target.value }))}
                          onBlur={e => handleSaveComment(item.studentId, e.target.value)}
                          placeholder="Ghi nhận xét đánh giá..."
                          className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg text-xs text-slate-800 transition-colors focus:outline-hidden"
                        />
                      </td>

                      {/* Nút kiểm tra nguồn gốc transaction */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenTrace(item)}
                          title="Xem chi tiết các transaction nguồn gốc"
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        >
                          <History className="w-4 h-4" />
                          <span className="hidden sm:inline">Soi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cấu hình thang điểm và điều kiện */}
      <ClassificationConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        isLocked={isLocked}
      />

      {/* Modal Truy nguyên nguồn gốc transaction */}
      <ClassificationTraceModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        result={traceResult}
        transactions={pointTransactions}
        learningRecords={learningRecords}
      />
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { WeeklyPointTransaction } from '../../types/pointTransaction';
import { SingleTransactionModal } from './SingleTransactionModal';
import { BatchTransactionModal } from './BatchTransactionModal';
import { TransactionHistoryTable } from './TransactionHistoryTable';
import { StudentWeeklyTable } from './StudentWeeklyTable';
import { AuditLogModal } from './AuditLogModal';
import { calculateWeeklyCompetitionFromTransactions } from '../../utils/calculations';
import { voidPointTransaction } from '../../services/pointTransactionService';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Layers, 
  RotateCcw, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Trophy, 
  FileText, 
  History, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Users,
  Scale
} from 'lucide-react';

export function WeeklyPointsView() {
  const { 
    classroom, 
    students, 
    pointTransactions, 
    selectedWeek, 
    setSelectedWeek, 
    isDataLocked,
    syncStatus,
    lastSyncedAt,
    setSyncStatus
  } = useClass();

  const { teacherProfile } = useAuth();
  const { showToast, showConfirm, setActiveTab } = useUI();

  // Modals state
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [auditLogTx, setAuditLogTx] = useState<WeeklyPointTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<WeeklyPointTransaction | null>(null);
  const [targetStudentId, setTargetStudentId] = useState<string | undefined>(undefined);
  const [targetScoreType, setTargetScoreType] = useState<'plus' | 'minus'>('plus');

  // Active view subtab
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'history' | 'groups'>('students');

  // Filter transactions by current selected week
  const weekTransactions = useMemo(() => {
    return pointTransactions.filter((tx) => tx.weekNumber === selectedWeek);
  }, [pointTransactions, selectedWeek]);

  // Valid transactions only
  const validWeekTransactions = useMemo(() => {
    return weekTransactions.filter((tx) => tx.status === 'valid');
  }, [weekTransactions]);

  // Summary statistics for current week
  const weekStats = useMemo(() => {
    let plus = 0;
    let minus = 0;
    let plusCount = 0;
    let minusCount = 0;

    for (const tx of validWeekTransactions) {
      if (tx.score >= 0) {
        plus += tx.score;
        plusCount++;
      } else {
        minus += Math.abs(tx.score);
        minusCount++;
      }
    }

    return {
      totalTransactions: weekTransactions.length,
      validTransactions: validWeekTransactions.length,
      voidedTransactions: weekTransactions.length - validWeekTransactions.length,
      plus,
      plusCount,
      minus,
      minusCount,
      netScore: plus - minus,
    };
  }, [weekTransactions, validWeekTransactions]);

  // Tính thi đua 4 tổ từ transactions tuần
  const groupCompetition = useMemo(() => {
    return calculateWeeklyCompetitionFromTransactions(pointTransactions, students, selectedWeek, 100);
  }, [pointTransactions, students, selectedWeek]);

  const topGroup = useMemo(() => {
    if (!groupCompetition.length) return null;
    const sorted = [...groupCompetition].sort((a, b) => b.totalPoints - a.totalPoints);
    return sorted[0];
  }, [groupCompetition]);

  // Quick Undo the latest valid transaction
  const handleQuickUndo = () => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa');
      return;
    }

    const latestValidTx = validWeekTransactions[0];
    if (!latestValidTx) {
      showToast('info', 'Không có giao dịch nào để hoàn tác trong tuần này.');
      return;
    }

    showConfirm({
      title: 'Hoàn tác giao dịch gần nhất?',
      message: `Bạn muốn hoàn tác giao dịch "${latestValidTx.score > 0 ? '+' : ''}${latestValidTx.score} đ" của ${latestValidTx.studentNameSnapshot} (${latestValidTx.reason})?`,
      confirmLabel: 'Hoàn tác',
      cancelLabel: 'Giữ lại',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setSyncStatus('syncing');
          await voidPointTransaction(
            latestValidTx.id,
            latestValidTx,
            teacherProfile?.displayName || 'GVCN',
            'Hoàn tác nhanh giao dịch gần nhất'
          );
          showToast('success', 'Đã hoàn tác giao dịch gần nhất thành công');
        } catch (err: any) {
          showToast('error', 'Lỗi khi hoàn tác', err.message);
          setSyncStatus('error');
        }
      },
    });
  };

  // Open single modal for new entry
  const handleOpenAddPoint = (studentId?: string, type: 'plus' | 'minus' = 'plus') => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa', 'Vui lòng mở khóa sổ trước khi nhập điểm.');
      return;
    }
    setEditingTx(null);
    setTargetStudentId(studentId);
    setTargetScoreType(type);
    setIsSingleModalOpen(true);
  };

  // Open edit modal for existing transaction
  const handleOpenEdit = (tx: WeeklyPointTransaction) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa');
      return;
    }
    setEditingTx(tx);
    setTargetStudentId(tx.studentId);
    setTargetScoreType(tx.score >= 0 ? 'plus' : 'minus');
    setIsSingleModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Module Header & Control Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Độc quyền GVCN
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Kiến trúc Transaction Độc Lập
              </span>
              {isDataLocked && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Đã khóa sổ
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Nhập Điểm Tuần & Thi Đua Lớp {classroom?.className || '10A1'}
            </h1>
            <p className="text-xs text-slate-500">
              Mỗi lần cộng/trừ điểm tạo một Transaction độc lập • Điểm tuần = tổng transaction hợp lệ • Đồng bộ thời gian thực
            </p>
          </div>

          {/* Week Navigator & Sync Status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Realtime Sync Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200 text-xs">
              {syncStatus === 'saved' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-700">Đã lưu</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    {lastSyncedAt ? `(${lastSyncedAt.toLocaleTimeString('vi-VN')})` : ''}
                  </span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="font-semibold text-amber-700">Đang đồng bộ...</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="font-semibold text-rose-700">Lỗi đồng bộ</span>
                </>
              )}
            </div>

            {/* Week Selector Box */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                disabled={selectedWeek <= 1}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-all"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-white rounded-lg shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tuần {selectedWeek}</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWeek(Math.min(35, selectedWeek + 1))}
                disabled={selectedWeek >= 35}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-all"
                title="Tuần sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Button 1: Single Student Entry */}
            <button
              type="button"
              disabled={isDataLocked}
              onClick={() => handleOpenAddPoint()}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nhập Điểm 1 Học Sinh</span>
            </button>

            {/* Button 2: Batch Entry */}
            <button
              type="button"
              disabled={isDataLocked}
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Layers className="w-4 h-4" />
              <span>Ghi Nhận Hàng Loạt (Cả Tổ/Nhiều HS)</span>
            </button>

            {/* Button 3: Quick Undo */}
            <button
              type="button"
              disabled={isDataLocked || validWeekTransactions.length === 0}
              onClick={handleQuickUndo}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Hoàn tác giao dịch mới nhất trong tuần"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Hoàn tác gần nhất</span>
            </button>

            {/* Button 4: Thiết lập quy tắc chấm điểm */}
            <button
              type="button"
              onClick={() => setActiveTab('point_rules')}
              className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all flex items-center gap-1.5"
              title="Thiết lập các mức điểm cộng/trừ linh hoạt cho lớp"
            >
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span>Quy tắc chấm điểm</span>
            </button>
          </div>

          {/* Subtabs Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubTab('students')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'students'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bảng Điểm Tuần Học Sinh</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch Sử & Audit Log ({weekTransactions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('groups')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'groups'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Thi Đua 4 Tổ Tuần {selectedWeek}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bar for Selected Week */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Metric 1: Total TX */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Tổng Giao Dịch
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {weekStats.validTransactions}
            </span>
            <span className="text-xs text-slate-400">TX hợp lệ</span>
          </div>
          {weekStats.voidedTransactions > 0 && (
            <span className="text-[10px] text-amber-600 font-semibold block mt-1">
              ({weekStats.voidedTransactions} TX đã hủy)
            </span>
          )}
        </div>

        {/* Metric 2: Plus Points */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Tổng Điểm Cộng (+)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              +{weekStats.plus}
            </span>
            <span className="text-xs text-emerald-600">({weekStats.plusCount} lần)</span>
          </div>
        </div>

        {/* Metric 3: Minus Points */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            Tổng Điểm Trừ (-)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono">
              -{weekStats.minus}
            </span>
            <span className="text-xs text-rose-600">({weekStats.minusCount} lỗi)</span>
          </div>
        </div>

        {/* Metric 4: Net Score */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Điểm Thuần Tuần
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${weekStats.netScore >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {weekStats.netScore > 0 ? `+${weekStats.netScore}` : weekStats.netScore}
            </span>
            <span className="text-xs text-slate-400">điểm nề nếp</span>
          </div>
        </div>

        {/* Metric 5: Top Group */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20 col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            Tổ Dẫn Đầu Tuần
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">
              {topGroup ? `Tổ ${topGroup.groupNumber}` : '—'}
            </span>
            <span className="text-xs font-bold text-amber-700">
              {topGroup ? `${topGroup.totalPoints} đ` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-View Content */}
      {activeSubTab === 'students' && (
        <StudentWeeklyTable
          students={students}
          transactions={pointTransactions}
          selectedWeek={selectedWeek}
          onOpenAddPoint={handleOpenAddPoint}
          onFilterByStudent={(studentName) => {
            setActiveSubTab('history');
          }}
        />
      )}

      {activeSubTab === 'history' && (
        <TransactionHistoryTable
          transactions={weekTransactions}
          onOpenEdit={handleOpenEdit}
          onOpenAuditLog={(tx) => setAuditLogTx(tx)}
        />
      )}

      {activeSubTab === 'groups' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Kết Quả Thi Đua 4 Tổ - Tuần {selectedWeek}
              </h3>
              <p className="text-xs text-slate-500">
                Công thức: Điểm xuất phát (100) + Tổng điểm cộng tổ - Tổng điểm trừ tổ (Tính từ các Transaction hợp lệ)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {groupCompetition.map((g) => {
              const isRank1 = g.rank === 1;
              return (
                <div
                  key={g.groupNumber}
                  className={`bg-white p-5 rounded-2xl border shadow-xs space-y-3 relative overflow-hidden ${
                    isRank1 ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200'
                  }`}
                >
                  {isRank1 && (
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-100 rounded-full flex items-end justify-start p-3 opacity-60">
                      <Trophy className="w-6 h-6 text-amber-600" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        TỔ {g.groupNumber}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">
                        {g.studentsCount} học sinh
                      </h4>
                    </div>

                    <div
                      className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center ${
                        isRank1
                          ? 'bg-amber-500 text-white shadow-xs'
                          : g.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : g.rank === 3
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{g.rank}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Điểm xuất phát:</span>
                      <span className="font-semibold font-mono">{g.basePoints} đ</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Tổng điểm cộng:</span>
                      <span className="font-bold font-mono">+{g.plusPoints} đ ({g.rewardsCount} lượt)</span>
                    </div>
                    <div className="flex justify-between text-rose-700">
                      <span>Tổng điểm trừ:</span>
                      <span className="font-bold font-mono">-{g.minusPoints} đ ({g.violationsCount} lỗi)</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Điểm tổng tuần:</span>
                    <span className="text-xl font-black text-indigo-700 font-mono">
                      {g.totalPoints} đ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Modals */}
      <SingleTransactionModal
        isOpen={isSingleModalOpen}
        onClose={() => {
          setIsSingleModalOpen(false);
          setEditingTx(null);
        }}
        initialStudentId={targetStudentId}
        initialScoreType={targetScoreType}
        editingTransaction={editingTx}
      />

      <BatchTransactionModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />

      <AuditLogModal
        isOpen={Boolean(auditLogTx)}
        onClose={() => setAuditLogTx(null)}
        transaction={auditLogTx}
      />
    </div>
  );
}

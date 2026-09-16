import React, { useState, useMemo } from 'react';
import { useClass } from '../../context/ClassContext';
import { useUI } from '../../context/UIContext';
import { 
  calculateCompetitionFromTransactions,
  CompetitionFilterOptions,
  GroupCompetitionResult 
} from '../../utils/calculations';
import { updateClassroomSettings } from '../../services/classService';
import { updateStudent } from '../../services/studentService';
import { formatDateVN } from '../../utils/formatters';
import { Student, CLASS_ROLES } from '../../types/student';
import { 
  Trophy, 
  Award, 
  AlertTriangle, 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle2,
  Medal,
  ChevronRight,
  PlusCircle,
  Settings,
  ArrowRightLeft,
  Filter,
  Sparkles,
  ShieldAlert,
  ArrowUpDown,
  X
} from 'lucide-react';

export function CompetitionView() {
  const { 
    classroom, 
    students, 
    pointTransactions, 
    selectedWeek, 
    setSelectedWeek,
    isDataLocked,
    setSyncStatus
  } = useClass();

  const { showConfirm, showToast, setActiveTab } = useUI();

  // Dynamic number of groups (defaults to 4 if not configured, allowed 2..8)
  const totalGroups = classroom?.totalGroups || 4;

  // Time filter mode: 'week' | 'month' | 'range'
  const [filterMode, setFilterMode] = useState<'week' | 'month' | 'range'>('week');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    return `${today.getFullYear()}-${m}`;
  });
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Selected group for inspection
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<number>(1);
  const [detailTab, setDetailTab] = useState<'members' | 'transactions'>('members');

  // Modals
  const [isSettingGroupsModalOpen, setIsSettingGroupsModalOpen] = useState(false);
  const [newTotalGroups, setNewTotalGroups] = useState<number>(totalGroups);
  
  // Student Transfer Modal
  const [transferModalStudent, setTransferModalStudent] = useState<Student | null>(null);
  const [targetGroup, setTargetGroup] = useState<number>(1);
  const [transferring, setTransferring] = useState(false);

  // Filter options
  const filterOptions: CompetitionFilterOptions = useMemo(() => {
    return {
      mode: filterMode,
      week: selectedWeek,
      month: selectedMonth,
      startDate,
      endDate,
    };
  }, [filterMode, selectedWeek, selectedMonth, startDate, endDate]);

  // Base competition points (defaults to 100)
  const basePoints = classroom?.baseCompetitionPoints || 100;

  // Calculate competition results based directly on transactions and CURRENT student membership
  const competitionResults: GroupCompetitionResult[] = useMemo(() => {
    return calculateCompetitionFromTransactions(
      pointTransactions,
      students,
      filterOptions,
      basePoints,
      totalGroups
    );
  }, [pointTransactions, students, filterOptions, basePoints, totalGroups]);

  // Ranked results for podium display
  const rankedResults = useMemo(() => {
    return [...competitionResults].sort((a, b) => a.rank - b.rank);
  }, [competitionResults]);

  // Students belonging to currently selected group
  const currentGroupStudents = useMemo(() => {
    return students
      .filter(s => s.groupNumber === selectedGroupDetail && s.status === 'dang_hoc')
      .sort((a, b) => (a.stt ?? 999) - (b.stt ?? 999));
  }, [students, selectedGroupDetail]);

  // Filtered transactions for students in currently selected group during this period
  const currentGroupTransactions = useMemo(() => {
    const studentIdSet = new Set(currentGroupStudents.map(s => s.id));
    return pointTransactions.filter(t => {
      if (t.status !== 'valid') return false;
      if (!studentIdSet.has(t.studentId)) return false;

      if (filterMode === 'week') {
        return t.weekNumber === selectedWeek;
      }
      if (filterMode === 'month') {
        if (!selectedMonth) return true;
        return t.date.startsWith(selectedMonth);
      }
      if (filterMode === 'range') {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return true;
      }
      return true;
    });
  }, [pointTransactions, currentGroupStudents, filterMode, selectedWeek, selectedMonth, startDate, endDate]);

  // Save number of groups
  const handleSaveTotalGroups = async () => {
    if (!classroom?.id) return;
    if (newTotalGroups === totalGroups) {
      setIsSettingGroupsModalOpen(false);
      return;
    }

    try {
      setSyncStatus('syncing');
      await updateClassroomSettings(classroom.id, {
        totalGroups: newTotalGroups,
      });
      setSyncStatus('saved');
      showToast('success', `Đã cập nhật số tổ thành ${newTotalGroups} tổ`);
      setIsSettingGroupsModalOpen(false);
      if (selectedGroupDetail > newTotalGroups) {
        setSelectedGroupDetail(1);
      }
    } catch (err: any) {
      setSyncStatus('error');
      showToast('error', 'Lỗi khi cập nhật số tổ', err.message);
    }
  };

  // Open Transfer Modal
  const openTransferModal = (student: Student) => {
    setTransferModalStudent(student);
    // Default to the first different group
    const otherGroup = student.groupNumber === 1 ? 2 : 1;
    setTargetGroup(otherGroup <= totalGroups ? otherGroup : 1);
  };

  // Execute Student Group Transfer
  const handleExecuteTransfer = async () => {
    if (!transferModalStudent || targetGroup === transferModalStudent.groupNumber) {
      setTransferModalStudent(null);
      return;
    }

    const student = transferModalStudent;
    const oldGroup = student.groupNumber;

    try {
      setTransferring(true);
      setSyncStatus('syncing');

      await updateStudent(student.id, {
        groupNumber: targetGroup,
      });

      setSyncStatus('saved');
      showToast(
        'success',
        `Đã chuyển em ${student.fullName} sang Tổ ${targetGroup}`,
        `Điểm thi đua hiện tại của Tổ ${targetGroup} và Tổ ${oldGroup} đã được tính toán lại ngay lập tức. Lịch sử giao dịch cũ vẫn lưu snapshot Tổ ${oldGroup}.`
      );

      setTransferModalStudent(null);
    } catch (err: any) {
      console.error('Error transferring student group:', err);
      setSyncStatus('error');
      showToast('error', 'Lỗi khi chuyển tổ', err.message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-600" /> Thi Đua Theo Tổ ({totalGroups} tổ)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
              Điểm xuất phát: {basePoints} đ
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Bảng Xếp Hạng Thi Đua Các Tổ Lớp {classroom?.className || '12A1'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tính toán trực tiếp từ học sinh thuộc mỗi tổ • Cập nhật điểm ngay khi chuyển tổ • Lịch sử transaction bảo toàn snapshot
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Change Total Groups */}
          <button
            type="button"
            onClick={() => {
              setNewTotalGroups(totalGroups);
              setIsSettingGroupsModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
            title="Đổi số tổ trong lớp (2..8 tổ)"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Đổi Số Tổ ({totalGroups} tổ)</span>
          </button>

          {/* Shortcut to Point Input */}
          <button
            type="button"
            onClick={() => setActiveTab('weekly_points')}
            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Nhập Điểm Tuần</span>
          </button>

          {/* Shortcut to Violation Recording */}
          <button
            type="button"
            onClick={() => setActiveTab('conduct')}
            className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Ghi Nhận Vi Phạm</span>
          </button>
        </div>
      </div>

      {/* Time Filter Bar: Tuần / Tháng / Khoảng thời gian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Xem thi đua theo:
          </span>

          {/* Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterMode('week')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filterMode === 'week'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Tuần
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filterMode === 'month'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Tháng
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('range')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filterMode === 'range'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khoảng Thời Gian
            </button>
          </div>
        </div>

        {/* Dynamic Controls based on selected Mode */}
        <div className="flex items-center gap-2">
          {filterMode === 'week' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Chọn tuần:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-indigo-700"
              >
                {Array.from({ length: 35 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tuần {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'month' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Chọn tháng:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-indigo-700"
              />
            </div>
          )}

          {filterMode === 'range' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg"
              />
              <span className="text-xs font-medium text-slate-500">Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Podium Cards for All Groups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Medal className="w-4 h-4 text-amber-500" />
            Bảng Xếp Hạng {totalGroups} Tổ ({
              filterMode === 'week' ? `Tuần ${selectedWeek}` :
              filterMode === 'month' ? `Tháng ${selectedMonth}` :
              `Từ ${formatDateVN(startDate)} đến ${formatDateVN(endDate)}`
            })
          </h2>
          <span className="text-xs text-slate-400">
            Bấm vào tổ để xem chi tiết thành viên & lịch sử
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rankedResults.map((res) => {
            const isSelected = selectedGroupDetail === res.groupNumber;
            const rank = res.rank;

            return (
              <div
                key={res.groupNumber}
                onClick={() => setSelectedGroupDetail(res.groupNumber)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 shadow-md transform -translate-y-0.5'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Header: Rank Badge + Student Count */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      rank === 1
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : rank === 2
                        ? 'bg-slate-200 text-slate-800 border border-slate-300'
                        : rank === 3
                        ? 'bg-orange-100 text-orange-900 border border-orange-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rank === 1 ? '🥇 HẠNG 1' : rank === 2 ? '🥈 HẠNG 2' : rank === 3 ? '🥉 HẠNG 3' : `HẠNG ${rank}`}
                  </span>

                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {res.studentsCount} học sinh
                  </span>
                </div>

                {/* Group Name & Main Total Score */}
                <div className="mt-4">
                  <h3 className="text-xl font-black text-slate-900">
                    Tổ {res.groupNumber}
                  </h3>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-indigo-700">
                      {res.totalPoints}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      tổng điểm
                    </span>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Điểm khởi đầu:</span>
                    <span className="font-semibold">{res.basePoints} đ</span>
                  </div>
                  <div className="flex items-center justify-between text-indigo-700 font-medium">
                    <span>Điểm TB mỗi học sinh:</span>
                    <span className="font-bold">{res.averagePoints} đ/em</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 font-medium">
                    <span>Thành tích (+ {res.rewardsCount} lượt):</span>
                    <span className="font-bold">+{res.plusPoints} đ</span>
                  </div>
                  <div className="flex items-center justify-between text-rose-700 font-medium">
                    <span>Vi phạm (- {res.violationsCount} lượt):</span>
                    <span className="font-bold">-{res.minusPoints} đ</span>
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-4 pt-2.5 flex items-center justify-between text-[11px] font-bold text-indigo-600 border-t border-slate-100/60">
                  <span>{isSelected ? 'Đang xem chi tiết' : 'Xem danh sách & chuyển tổ'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Ranking Comparison Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Bảng So Sánh Chỉ Số Thi Đua Toàn Diện Giữa Các Tổ
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3 text-center">Thứ Hạng</th>
                <th className="py-2.5 px-3">Tên Tổ</th>
                <th className="py-2.5 px-3 text-center">Sĩ Số HS</th>
                <th className="py-2.5 px-3 text-center">Điểm Gốc</th>
                <th className="py-2.5 px-3 text-center text-emerald-700">Lượt Cộng / Thưởng</th>
                <th className="py-2.5 px-3 text-center text-rose-700">Lượt Trừ / Vi Phạm</th>
                <th className="py-2.5 px-3 text-center text-indigo-700 font-bold">Điểm TB / HS</th>
                <th className="py-2.5 px-3 text-center font-black">Tổng Điểm Thi Đua</th>
                <th className="py-2.5 px-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedResults.map((r) => (
                <tr 
                  key={r.groupNumber}
                  onClick={() => setSelectedGroupDetail(r.groupNumber)}
                  className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                    selectedGroupDetail === r.groupNumber ? 'bg-indigo-50/25' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center font-black">
                    {r.rank === 1 ? '🥇 1' : r.rank === 2 ? '🥈 2' : r.rank === 3 ? '🥉 3' : r.rank}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    Tổ {r.groupNumber}
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                    {r.studentsCount}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-500">
                    {r.basePoints}
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                    +{r.plusPoints} ({r.rewardsCount} lần)
                  </td>
                  <td className="py-2.5 px-3 text-center text-rose-700 font-bold">
                    -{r.minusPoints} ({r.violationsCount} lần)
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                    {r.averagePoints}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-slate-900 text-sm">
                    {r.totalPoints}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Xem tổ {r.groupNumber} &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group Detail Workspace */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        {/* Detail Header with quick group tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Chi Tiết Hoạt Động & Thành Viên: Tổ {selectedGroupDetail}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {currentGroupStudents.length} học sinh
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              GVCN có thể chuyển học sinh sang tổ khác bất cứ lúc nào. Điểm thi đua sẽ tự động cập nhật ngay.
            </p>
          </div>

          {/* Group Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from({ length: totalGroups }).map((_, i) => {
              const g = i + 1;
              const isCurrent = selectedGroupDetail === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGroupDetail(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tổ {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-tabs: Members vs Transactions */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setDetailTab('members')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
              detailTab === 'members'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Danh Sách Thành Viên Hiện Tại ({currentGroupStudents.length} HS)
          </button>
          <button
            type="button"
            onClick={() => setDetailTab('transactions')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
              detailTab === 'transactions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            2. Nhật Ký Điểm & Vi Phạm Của Học Sinh ({currentGroupTransactions.length} giao dịch)
          </button>
        </div>

        {/* TAB 1: MEMBERS */}
        {detailTab === 'members' && (
          <div className="space-y-4">
            {currentGroupStudents.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">Tổ {selectedGroupDetail} hiện chưa có học sinh nào</p>
                <p className="text-xs text-slate-400">
                  Bạn có thể chuyển học sinh từ các tổ khác sang tổ này bằng nút "Chuyển tổ".
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-3 text-center w-12">STT</th>
                      <th className="py-2.5 px-3">Mã & Họ Tên Học Sinh</th>
                      <th className="py-2.5 px-3 text-center">Chức Vụ</th>
                      <th className="py-2.5 px-3 text-center text-emerald-700">Điểm Thưởng (+)</th>
                      <th className="py-2.5 px-3 text-center text-rose-700">Điểm Vi Phạm (-)</th>
                      <th className="py-2.5 px-3 text-center font-bold">Điểm Ròng</th>
                      <th className="py-2.5 px-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentGroupStudents.map((s) => {
                      // Calculate this student's points in the period
                      const studentTxs = currentGroupTransactions.filter(t => t.studentId === s.id);
                      let sPlus = 0;
                      let sMinus = 0;
                      for (const t of studentTxs) {
                        if (t.score >= 0) sPlus += t.score;
                        else sMinus += Math.abs(t.score);
                      }
                      const sNet = sPlus - sMinus;

                      const roleObj = CLASS_ROLES.find(r => r.value === s.role);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                            {s.stt ?? '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">
                              {s.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {s.studentCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {roleObj ? roleObj.label : 'Thành viên'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                            +{sPlus}
                          </td>
                          <td className="py-2.5 px-3 text-center text-rose-700 font-bold">
                            -{sMinus}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black">
                            <span className={sNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {sNet > 0 ? `+${sNet}` : sNet}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              disabled={isDataLocked}
                              onClick={() => openTransferModal(s)}
                              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all flex items-center gap-1 ml-auto disabled:opacity-40"
                              title="Chuyển học sinh sang tổ khác"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-indigo-600" />
                              <span>Chuyển tổ</span>
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
        )}

        {/* TAB 2: TRANSACTIONS */}
        {detailTab === 'transactions' && (
          <div className="space-y-4">
            {currentGroupTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Chưa có giao dịch phát sinh</p>
                <p className="text-xs text-slate-400">
                  Các thành viên hiện tại của Tổ {selectedGroupDetail} chưa có bản ghi điểm cộng/trừ trong khoảng thời gian này.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-3">Mã TX & Ngày</th>
                      <th className="py-2.5 px-3">Học Sinh</th>
                      <th className="py-2.5 px-3">Nội Dung Điểm</th>
                      <th className="py-2.5 px-3 text-center">Điểm</th>
                      <th className="py-2.5 px-3 text-center">Ghi Chú Snapshot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentGroupTransactions.map((tx) => {
                      const wasDifferentGroup = tx.groupNumberSnapshot !== selectedGroupDetail;

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[11px] font-bold text-indigo-700 block">
                              {tx.transactionId}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatDateVN(tx.date)} • T{tx.weekNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {tx.studentNameSnapshot}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-800 block">
                              {tx.reason}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {tx.categoryLabel || tx.category} {tx.note && `• ${tx.note}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-lg font-black text-xs ${
                                tx.score >= 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {tx.score > 0 ? `+${tx.score}` : tx.score}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-[11px]">
                            {wasDifferentGroup ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                Lúc phát sinh: Tổ {tx.groupNumberSnapshot}
                              </span>
                            ) : (
                              <span className="text-slate-400">Tổ {tx.groupNumberSnapshot}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Cấu hình số tổ trong lớp (2..8 tổ) */}
      {isSettingGroupsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Thiết Lập Số Tổ Trong Lớp
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingGroupsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Mặc định lớp học có 4 tổ. GVCN có thể tùy chỉnh từ 2 đến 8 tổ tùy theo cấu trúc tổ chức của lớp.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chọn số lượng tổ:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNewTotalGroups(num)}
                    className={`py-2 text-sm font-black rounded-xl border transition-all ${
                      newTotalGroups === num
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num} Tổ
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900">
              💡 Khi thay đổi số tổ, bảng thi đua sẽ tự động tính toán lại theo cấu hình mới.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSettingGroupsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveTotalGroups}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Chuyển tổ học sinh */}
      {transferModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Chuyển Tổ Học Sinh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Học sinh được chuyển:
              </span>
              <span className="text-base font-black text-slate-900 block mt-0.5">
                {transferModalStudent.fullName}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Mã HS: {transferModalStudent.studentCode} • Hiện tại: <strong>Tổ {transferModalStudent.groupNumber}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chuyển sang tổ mới:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: totalGroups }).map((_, i) => {
                  const g = i + 1;
                  const isCurrent = transferModalStudent.groupNumber === g;
                  const isSelected = targetGroup === g;

                  return (
                    <button
                      key={g}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => setTargetGroup(g)}
                      className={`py-2 text-xs font-black rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Tổ {g} {isCurrent && '(Hiện tại)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanatory callout */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                Nguyên tắc bảo toàn dữ liệu:
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                <li>Điểm thi đua hiện tại của <strong>Tổ {targetGroup}</strong> sẽ cập nhật nhận học sinh.</li>
                <li>Lịch sử các giao dịch cũ vẫn giữ nguyên <strong>snapshot Tổ {transferModalStudent.groupNumber}</strong> tại thời điểm phát sinh để không làm sai lệch lịch sử.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferModalStudent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={transferring || targetGroup === transferModalStudent.groupNumber}
                onClick={handleExecuteTransfer}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs disabled:opacity-40"
              >
                {transferring ? 'Đang chuyển...' : `Xác Nhận Chuyển Sang Tổ ${targetGroup}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

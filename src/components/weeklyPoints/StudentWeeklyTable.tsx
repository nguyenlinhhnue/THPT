import React, { useState } from 'react';
import { useClass } from '../../context/ClassContext';
import { Student, CLASS_ROLES } from '../../types/student';
import { WeeklyPointTransaction } from '../../types/pointTransaction';
import { calculateStudentWeeklyTransactionScore } from '../../utils/calculations';
import { 
  Plus, 
  Minus, 
  Eye, 
  Search, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  UserCheck, 
  Award,
  Filter
} from 'lucide-react';

interface StudentWeeklyTableProps {
  students: Student[];
  transactions: WeeklyPointTransaction[];
  selectedWeek: number;
  onOpenAddPoint: (studentId: string, type: 'plus' | 'minus') => void;
  onFilterByStudent: (studentName: string) => void;
}

export function StudentWeeklyTable({
  students,
  transactions,
  selectedWeek,
  onOpenAddPoint,
  onFilterByStudent,
}: StudentWeeklyTableProps) {
  const { isDataLocked } = useClass();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');

  // Tính điểm tuần cho tất cả học sinh
  const studentScoresList = students
    .filter((s) => s.status === 'dang_hoc')
    .map((s) => {
      const stats = calculateStudentWeeklyTransactionScore(transactions, s.id, selectedWeek);
      return {
        student: s,
        ...stats,
      };
    });

  // Xếp hạng: Học sinh có điểm tuần cao nhất xếp trước
  studentScoresList.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.minusPoints - b.minusPoints; // Ít điểm trừ xếp trên
  });

  const rankedStudents = studentScoresList.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  // Lọc hiển thị
  const displayStudents = rankedStudents.filter((item) => {
    if (groupFilter !== 'all' && item.student.groupNumber !== groupFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = item.student.fullName.toLowerCase().includes(q);
      const matchCode = item.student.studentCode.toLowerCase().includes(q);
      const matchStt = item.student.stt?.toString() === searchTerm;
      return matchName || matchCode || matchStt;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Bộ lọc học sinh */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm học sinh theo tên, mã HS hoặc STT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setGroupFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                groupFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            {[1, 2, 3, 4].map((g) => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  groupFilter === g
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tổ {g}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Tổng số: <strong>{displayStudents.length}</strong> học sinh đang học
        </div>
      </div>

      {/* Bảng điểm tổng hợp tuần */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">Hạng</th>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Họ và Tên Học Sinh</th>
                <th className="py-3 px-3">Tổ</th>
                <th className="py-3 px-3">Chức Vụ</th>
                <th className="py-3 px-4 text-center text-emerald-700">Điểm Cộng (+)</th>
                <th className="py-3 px-4 text-center text-rose-700">Điểm Trừ (-)</th>
                <th className="py-3 px-4 text-center font-black">Tổng Điểm Tuần</th>
                <th className="py-3 px-4 text-center">Số Giao Dịch</th>
                <th className="py-3 px-4 text-right">Nhập Điểm Nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {displayStudents.map((item) => {
                const s = item.student;
                const isTop3 = item.rank <= 3 && item.totalScore > 0;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Rank */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          item.rank === 1
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : item.rank === 2
                            ? 'bg-slate-200 text-slate-700'
                            : item.rank === 3
                            ? 'bg-orange-100 text-orange-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.rank}
                      </span>
                    </td>

                    {/* STT */}
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {s.stt || '—'}
                    </td>

                    {/* Họ tên */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{s.fullName}</span>
                        {isTop3 && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {s.studentCode}
                      </span>
                    </td>

                    {/* Tổ */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-700">
                        Tổ {s.groupNumber}
                      </span>
                    </td>

                    {/* Chức vụ */}
                    <td className="py-3 px-3">
                      {s.role && s.role !== 'thanh_vien' && s.role !== 'hoc_sinh' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {CLASS_ROLES.find((r) => r.value === s.role)?.label || s.role}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Thành viên</span>
                      )}
                    </td>

                    {/* Điểm cộng */}
                    <td className="py-3 px-4 text-center">
                      {item.plusPoints > 0 ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          +{item.plusPoints} ({item.plusCount} lần)
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Điểm trừ */}
                    <td className="py-3 px-4 text-center">
                      {item.minusPoints > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                          -{item.minusPoints} ({item.minusCount} lỗi)
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* ĐIỂM TUẦN = Tổng tất cả transaction hợp lệ */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-xl text-sm font-black ${
                          item.totalScore > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.totalScore < 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.totalScore > 0 ? `+${item.totalScore}` : item.totalScore}
                      </span>
                    </td>

                    {/* Số transaction */}
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-mono font-semibold text-slate-600">
                        {item.totalTransactions} TX
                      </span>
                    </td>

                    {/* Nút nhập điểm nhanh 1 click */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút cộng điểm nhanh */}
                        <button
                          type="button"
                          title={`Cộng điểm cho ${s.fullName}`}
                          disabled={isDataLocked}
                          onClick={() => onOpenAddPoint(s.id, 'plus')}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút trừ điểm nhanh */}
                        <button
                          type="button"
                          title={`Trừ điểm vi phạm của ${s.fullName}`}
                          disabled={isDataLocked}
                          onClick={() => onOpenAddPoint(s.id, 'minus')}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition-colors disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút xem lịch sử riêng học sinh này */}
                        <button
                          type="button"
                          title={`Xem tất cả transaction của ${s.fullName}`}
                          onClick={() => onFilterByStudent(s.fullName)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

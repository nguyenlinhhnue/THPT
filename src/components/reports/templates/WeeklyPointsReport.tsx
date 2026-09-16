import React from 'react';
import { Student } from '../../../types/student';
import { WeeklyPointTransaction } from '../../../types/pointTransaction';
import { DEFAULT_CLASSIFICATION_CONFIG } from '../../../types/classification';
import { calculateClassifications } from '../../../services/classificationService';

interface WeeklyPointsReportProps {
  students: Student[];
  transactions: WeeklyPointTransaction[];
  weekNumber: number;
  groupFilter: number | 'all';
}

export function WeeklyPointsReport({
  students,
  transactions,
  weekNumber,
  groupFilter,
}: WeeklyPointsReportProps) {
  const filteredStudents = React.useMemo(() => {
    let list = [...students];
    if (groupFilter !== 'all') {
      list = list.filter(s => s.groupNumber === groupFilter);
    }
    return list.sort((a, b) => (a.stt || 0) - (b.stt || 0));
  }, [students, groupFilter]);

  // Lọc transaction của tuần này (chỉ lấy giao dịch hợp lệ status === 'valid')
  const weekTransactions = React.useMemo(() => {
    return transactions.filter(t => t.weekNumber === weekNumber && t.status === 'valid');
  }, [transactions, weekNumber]);

  // Tính kết quả xếp loại tuần cho các học sinh
  const classificationResults = React.useMemo(() => {
    const config = { ...DEFAULT_CLASSIFICATION_CONFIG, classId: 'default' };
    return calculateClassifications({
      students: filteredStudents,
      transactions,
      learningRecords: [],
      periodType: 'week',
      selectedWeek: weekNumber,
      selectedMonth: '2026-09',
      selectedSemester: 'HK1',
      config,
    });
  }, [filteredStudents, transactions, weekNumber]);

  // Thống kê nhanh
  const stats = React.useMemo(() => {
    const scores = classificationResults.map(r => r.netScore);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '100.0';
    const totalPlus = weekTransactions.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
    const totalMinus = weekTransactions.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
    const totalViolations = weekTransactions.filter(t => t.type === 'minus').length;

    return { avgScore, totalPlus, totalMinus, totalViolations };
  }, [classificationResults, weekTransactions]);

  return (
    <div className="space-y-4">
      {/* Thẻ thống kê đầu tuần */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 border border-slate-300 p-3 rounded-lg">
        <div>
          <span className="text-slate-600 block">Điểm trung bình tuần:</span>
          <strong className="text-base font-bold text-emerald-800">{stats.avgScore} đ</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Tổng điểm cộng toàn lớp:</span>
          <strong className="text-base font-bold text-teal-800">+{stats.totalPlus} đ</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Tổng điểm trừ vi phạm:</span>
          <strong className="text-base font-bold text-rose-800">-{stats.totalMinus} đ</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Số lượt vi phạm nề nếp:</span>
          <strong className="text-base font-bold text-amber-800">{stats.totalViolations} lượt</strong>
        </div>
      </div>

      {/* Bảng chi tiết điểm tuần */}
      <table className="w-full text-left border-collapse border border-slate-400 text-xs">
        <thead>
          <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
            <th className="border border-slate-400 p-2 w-10">STT</th>
            <th className="border border-slate-400 p-2 w-20">Mã HS</th>
            <th className="border border-slate-400 p-2 text-left">Họ và Tên</th>
            <th className="border border-slate-400 p-2 w-14">Tổ</th>
            <th className="border border-slate-400 p-2 w-20">Điểm gốc</th>
            <th className="border border-slate-400 p-2 w-20 text-teal-800">Cộng (+)</th>
            <th className="border border-slate-400 p-2 w-20 text-rose-800">Trừ (-)</th>
            <th className="border border-slate-400 p-2 w-24">Điểm tuần</th>
            <th className="border border-slate-400 p-2 w-20">Số vi phạm</th>
            <th className="border border-slate-400 p-2 w-28">Xếp loại</th>
            <th className="border border-slate-400 p-2">Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {classificationResults.length === 0 ? (
            <tr>
              <td colSpan={11} className="border border-slate-400 p-4 text-center text-slate-500 italic">
                Chưa có dữ liệu học sinh trong tuần {weekNumber}.
              </td>
            </tr>
          ) : (
            classificationResults.map((r, index) => {
              const studentTx = weekTransactions.filter(t => t.studentId === r.studentId);
              const plus = studentTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
              const minus = studentTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);

              return (
                <tr key={r.studentId} className="hover:bg-slate-50/50">
                  <td className="border border-slate-400 p-2 text-center font-medium">{index + 1}</td>
                  <td className="border border-slate-400 p-2 text-center font-mono font-semibold text-slate-700">
                    {r.studentCode}
                  </td>
                  <td className="border border-slate-400 p-2 font-bold text-slate-900">
                    {r.studentName}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold">
                    {r.groupNumber}
                  </td>
                  <td className="border border-slate-400 p-2 text-center text-slate-600">
                    100
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-teal-700">
                    {plus > 0 ? `+${plus}` : '0'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-rose-700">
                    {minus > 0 ? `-${minus}` : '0'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-black text-sm text-slate-900">
                    {r.netScore}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-semibold">
                    {r.violationsCount > 0 ? (
                      <span className="text-rose-700 font-bold">{r.violationsCount}</span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold border border-slate-300">
                      {r.rankName}
                    </span>
                  </td>
                  <td className="border border-slate-400 p-2 text-[11px] text-slate-600">
                    {r.teacherComment || (r.violationsCount === 0 ? 'Thực hiện tốt nề nếp' : '')}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function getWeeklyPointsExportData(
  students: Student[],
  transactions: WeeklyPointTransaction[],
  weekNumber: number,
  groupFilter: number | 'all'
) {
  let list = [...students];
  if (groupFilter !== 'all') {
    list = list.filter(s => s.groupNumber === groupFilter);
  }
  list.sort((a, b) => (a.stt || 0) - (b.stt || 0));

  const weekTransactions = transactions.filter(t => t.weekNumber === weekNumber && t.status === 'valid');

  const config = { ...DEFAULT_CLASSIFICATION_CONFIG, classId: 'default' };
  const results = calculateClassifications({
    students: list,
    transactions,
    learningRecords: [],
    periodType: 'week',
    selectedWeek: weekNumber,
    selectedMonth: '2026-09',
    selectedSemester: 'HK1',
    config,
  });

  const headers = [
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Tổ',
    'Điểm chuẩn ban đầu',
    'Điểm cộng (+)',
    'Điểm trừ (-)',
    'Tổng điểm tuần',
    'Số lần vi phạm',
    'Xếp loại tuần',
    'Ghi chú',
  ];

  const rows = results.map((r, idx) => {
    const studentTx = weekTransactions.filter(t => t.studentId === r.studentId);
    const plus = studentTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
    const minus = studentTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);

    return [
      idx + 1,
      r.studentCode,
      r.studentName,
      `Tổ ${r.groupNumber}`,
      100,
      plus,
      minus,
      r.netScore,
      r.violationsCount,
      r.rankName,
      r.teacherComment || (r.violationsCount === 0 ? 'Thực hiện tốt nề nếp' : ''),
    ];
  });

  return [headers, ...rows];
}

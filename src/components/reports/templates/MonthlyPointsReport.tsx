import React from 'react';
import { Student } from '../../../types/student';
import { WeeklyPointTransaction } from '../../../types/pointTransaction';
import { DEFAULT_CLASSIFICATION_CONFIG } from '../../../types/classification';
import { calculateClassifications } from '../../../services/classificationService';

interface MonthlyPointsReportProps {
  students: Student[];
  transactions: WeeklyPointTransaction[];
  selectedMonth: string; // 'YYYY-MM', ví dụ: '2026-09'
  groupFilter: number | 'all';
}

export function MonthlyPointsReport({
  students,
  transactions,
  selectedMonth,
  groupFilter,
}: MonthlyPointsReportProps) {
  const filteredStudents = React.useMemo(() => {
    let list = [...students];
    if (groupFilter !== 'all') {
      list = list.filter(s => s.groupNumber === groupFilter);
    }
    return list.sort((a, b) => (a.stt || 0) - (b.stt || 0));
  }, [students, groupFilter]);

  // Các giao dịch thuộc tháng đã chọn (hợp lệ)
  const monthTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      if (t.status === 'voided') return false;
      if (t.date && t.date.startsWith(selectedMonth)) return true;
      return false;
    });
  }, [transactions, selectedMonth]);

  // Lấy danh sách các tuần xuất hiện trong tháng
  const weeksInMonth = React.useMemo(() => {
    const set = new Set<number>();
    monthTransactions.forEach(t => {
      if (t.weekNumber) set.add(t.weekNumber);
    });
    const arr = Array.from(set).sort((a, b) => a - b);
    return arr.length > 0 ? arr : [1, 2, 3, 4];
  }, [monthTransactions]);

  // Tính kết quả xếp loại tháng
  const classificationResults = React.useMemo(() => {
    const config = { ...DEFAULT_CLASSIFICATION_CONFIG, classId: 'default' };
    return calculateClassifications({
      students: filteredStudents,
      transactions,
      learningRecords: [],
      periodType: 'month',
      selectedWeek: 1,
      selectedMonth,
      selectedSemester: 'HK1',
      config,
    });
  }, [filteredStudents, transactions, selectedMonth]);

  // Thống kê nhanh tháng
  const summary = React.useMemo(() => {
    const scores = classificationResults.map(r => r.netScore);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '100.0';
    const totalViolations = monthTransactions.filter(t => t.type === 'minus').length;
    const totalBonus = monthTransactions.filter(t => t.type === 'plus').length;

    return { avgScore, totalViolations, totalBonus };
  }, [classificationResults, monthTransactions]);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthDisplay = `Tháng ${parseInt(monthStr, 10)}/${yearStr}`;

  return (
    <div className="space-y-4">
      {/* Thẻ tóm tắt tháng */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 border border-slate-300 p-3 rounded-lg">
        <div>
          <span className="text-slate-600 block">Kỳ báo cáo:</span>
          <strong className="text-base font-bold text-slate-900">{monthDisplay}</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Điểm trung bình tháng:</span>
          <strong className="text-base font-bold text-emerald-800">{summary.avgScore} đ</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Tổng số vi phạm nề nếp:</span>
          <strong className="text-base font-bold text-rose-800">{summary.totalViolations} lượt</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Tổng số lượt khen thưởng:</span>
          <strong className="text-base font-bold text-teal-800">{summary.totalBonus} lượt</strong>
        </div>
      </div>

      {/* Bảng chi tiết điểm tháng */}
      <table className="w-full text-left border-collapse border border-slate-400 text-xs">
        <thead>
          <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
            <th className="border border-slate-400 p-2 w-10">STT</th>
            <th className="border border-slate-400 p-2 w-20">Mã HS</th>
            <th className="border border-slate-400 p-2 text-left">Họ và Tên</th>
            <th className="border border-slate-400 p-2 w-14">Tổ</th>
            {weeksInMonth.map(w => (
              <th key={w} className="border border-slate-400 p-2 w-16">
                Tuần {w}
              </th>
            ))}
            <th className="border border-slate-400 p-2 w-24">ĐTB Tháng</th>
            <th className="border border-slate-400 p-2 w-20">Số vi phạm</th>
            <th className="border border-slate-400 p-2 w-28">Xếp loại</th>
            <th className="border border-slate-400 p-2">Đánh giá / Nhận xét</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {classificationResults.length === 0 ? (
            <tr>
              <td colSpan={8 + weeksInMonth.length} className="border border-slate-400 p-4 text-center text-slate-500 italic">
                Chưa có dữ liệu giao dịch nề nếp trong {monthDisplay}.
              </td>
            </tr>
          ) : (
            classificationResults.map((r, index) => {
              const studentTx = monthTransactions.filter(t => t.studentId === r.studentId);
              
              // Tính điểm từng tuần trong tháng
              const weekScores: Record<number, number> = {};
              weeksInMonth.forEach(w => {
                const wTx = studentTx.filter(t => t.weekNumber === w);
                const p = wTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
                const m = wTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
                weekScores[w] = Math.max(0, 100 + p - m);
              });

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
                  {weeksInMonth.map(w => (
                    <td key={w} className="border border-slate-400 p-2 text-center font-mono">
                      {weekScores[w]}
                    </td>
                  ))}
                  <td className="border border-slate-400 p-2 text-center font-black text-sm text-slate-950">
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
                  <td className="border border-slate-400 p-2 text-[11px] text-slate-700">
                    {r.teacherComment || (r.violationsCount === 0 ? 'Duy trì nề nếp tốt suốt tháng' : 'Cần cố gắng khắc phục')}
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

export function getMonthlyPointsExportData(
  students: Student[],
  transactions: WeeklyPointTransaction[],
  selectedMonth: string,
  groupFilter: number | 'all'
) {
  let list = [...students];
  if (groupFilter !== 'all') {
    list = list.filter(s => s.groupNumber === groupFilter);
  }
  list.sort((a, b) => (a.stt || 0) - (b.stt || 0));

  const monthTransactions = transactions.filter(t => {
    if (t.status === 'voided') return false;
    return t.date && t.date.startsWith(selectedMonth);
  });

  const set = new Set<number>();
  monthTransactions.forEach(t => {
    if (t.weekNumber) set.add(t.weekNumber);
  });
  const weeksInMonth = Array.from(set).sort((a, b) => a - b);
  const activeWeeks = weeksInMonth.length > 0 ? weeksInMonth : [1, 2, 3, 4];

  const config = { ...DEFAULT_CLASSIFICATION_CONFIG, classId: 'default' };
  const results = calculateClassifications({
    students: list,
    transactions,
    learningRecords: [],
    periodType: 'month',
    selectedWeek: 1,
    selectedMonth,
    selectedSemester: 'HK1',
    config,
  });

  const headers = [
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Tổ',
    ...activeWeeks.map(w => `Tuần ${w}`),
    'Điểm TB tháng',
    'Số lần vi phạm',
    'Xếp loại tháng',
    'Đánh giá / Nhận xét',
  ];

  const rows = results.map((r, idx) => {
    const studentTx = monthTransactions.filter(t => t.studentId === r.studentId);
    const weekScores = activeWeeks.map(w => {
      const wTx = studentTx.filter(t => t.weekNumber === w);
      const p = wTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
      const m = wTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
      return Math.max(0, 100 + p - m);
    });

    return [
      idx + 1,
      r.studentCode,
      r.studentName,
      `Tổ ${r.groupNumber}`,
      ...weekScores,
      r.netScore,
      r.violationsCount,
      r.rankName,
      r.teacherComment || (r.violationsCount === 0 ? 'Duy trì nề nếp tốt suốt tháng' : 'Cần cố gắng khắc phục'),
    ];
  });

  return [headers, ...rows];
}

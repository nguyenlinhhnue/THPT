import React from 'react';
import { Student } from '../../../types/student';
import { WeeklyPointTransaction } from '../../../types/pointTransaction';
import { LearningRecord } from '../../../types/learning';
import { Trophy } from 'lucide-react';

interface GroupCompetitionReportProps {
  students: Student[];
  transactions: WeeklyPointTransaction[];
  learningRecords: LearningRecord[];
  scopeLabel: string;
}

export function GroupCompetitionReport({
  students,
  transactions,
  learningRecords,
  scopeLabel,
}: GroupCompetitionReportProps) {
  // Tính toán thống kê theo 4 tổ
  const groupStats = React.useMemo(() => {
    const groups = [1, 2, 3, 4].map(gNum => {
      const members = students.filter(s => s.groupNumber === gNum);
      const memberIds = new Set(members.map(s => s.id));

      const groupTx = transactions.filter(t => t.status !== 'voided' && memberIds.has(t.studentId));
      const groupLearning = learningRecords.filter(l => memberIds.has(l.studentId));

      const plusPoints = groupTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
      const minusPoints = groupTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
      const violationCount = groupTx.filter(t => t.type === 'minus').length;
      const bonusCount = groupTx.filter(t => t.type === 'plus').length;

      // Điểm rèn luyện TB thành viên
      const baseTotal = members.length * 100;
      const netTotal = baseTotal + plusPoints - minusPoints;
      const avgConduct = members.length > 0 ? (netTotal / members.length) : 100;

      // Điểm học tập TB
      const learningScores = groupLearning.map(l => l.score).filter(s => typeof s === 'number');
      const avgLearning = learningScores.length > 0 
        ? (learningScores.reduce((a, b) => a + b, 0) / learningScores.length)
        : null;

      // Điểm tổng hợp thi đua = Điểm rèn luyện TB (trọng số 0.7) + Điểm học tập TB quy đổi x10 (trọng số 0.3)
      const learningContribution = avgLearning !== null ? avgLearning * 10 : 80;
      const competitionScore = +(avgConduct * 0.7 + learningContribution * 0.3).toFixed(1);

      // Tìm học sinh tiêu biểu (ít vi phạm nhất & nhiều điểm cộng nhất)
      let topStudent: Student | null = null;
      let topScore = -999;
      members.forEach(m => {
        const mTx = groupTx.filter(t => t.studentId === m.id);
        const p = mTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
        const mi = mTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
        const score = 100 + p - mi;
        if (score > topScore) {
          topScore = score;
          topStudent = m;
        }
      });

      return {
        groupNumber: gNum,
        members,
        memberCount: members.length,
        avgConduct: +avgConduct.toFixed(1),
        avgLearning: avgLearning !== null ? +avgLearning.toFixed(2) : null,
        violationCount,
        bonusCount,
        competitionScore,
        topStudent,
        topScore,
      };
    });

    // Xếp hạng theo điểm thi đua
    groups.sort((a, b) => b.competitionScore - a.competitionScore);
    return groups;
  }, [students, transactions, learningRecords]);

  return (
    <div className="space-y-6">
      {/* Bảng tổng hợp xếp hạng 4 tổ */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-600" />
          BẢNG XẾP HẠNG THI ĐUA CÁC TỔ ({scopeLabel})
        </h3>
        <table className="w-full text-left border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
              <th className="border border-slate-400 p-2 w-16">Xếp hạng</th>
              <th className="border border-slate-400 p-2 w-28">Tên Tổ</th>
              <th className="border border-slate-400 p-2 w-20">Sĩ số</th>
              <th className="border border-slate-400 p-2 w-28 text-emerald-800">ĐTB Rèn luyện</th>
              <th className="border border-slate-400 p-2 w-28 text-indigo-800">ĐTB Học tập</th>
              <th className="border border-slate-400 p-2 w-24 text-rose-800">Lượt vi phạm</th>
              <th className="border border-slate-400 p-2 w-24 text-teal-800">Lượt khen thưởng</th>
              <th className="border border-slate-400 p-2 w-28 font-black text-slate-950">Điểm thi đua</th>
              <th className="border border-slate-400 p-2">Học sinh tiêu biểu của tổ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {groupStats.map((g, idx) => (
              <tr key={g.groupNumber} className="hover:bg-slate-50/50">
                <td className="border border-slate-400 p-2 text-center font-bold">
                  {idx === 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black">
                      🥇 Hạng 1
                    </span>
                  ) : idx === 1 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 text-slate-900 font-bold">
                      🥈 Hạng 2
                    </span>
                  ) : idx === 2 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                      🥉 Hạng 3
                    </span>
                  ) : (
                    <span className="text-slate-600 font-bold">Hạng 4</span>
                  )}
                </td>
                <td className="border border-slate-400 p-2 text-center font-black text-slate-900 text-sm">
                  TỔ {g.groupNumber}
                </td>
                <td className="border border-slate-400 p-2 text-center font-semibold">
                  {g.memberCount} học sinh
                </td>
                <td className="border border-slate-400 p-2 text-center font-bold text-emerald-800">
                  {g.avgConduct} đ
                </td>
                <td className="border border-slate-400 p-2 text-center font-bold text-indigo-800">
                  {g.avgLearning !== null ? g.avgLearning : 'Chưa có'}
                </td>
                <td className="border border-slate-400 p-2 text-center font-bold text-rose-700">
                  {g.violationCount}
                </td>
                <td className="border border-slate-400 p-2 text-center font-bold text-teal-700">
                  {g.bonusCount}
                </td>
                <td className="border border-slate-400 p-2 text-center font-black text-sm text-slate-950">
                  {g.competitionScore}
                </td>
                <td className="border border-slate-400 p-2 text-slate-800">
                  {g.topStudent ? (
                    <span className="font-semibold text-slate-900">
                      {g.topStudent.fullName} ({g.topScore}đ)
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chi tiết thành viên và phân công theo từng tổ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groupStats.map(g => (
          <div key={g.groupNumber} className="border border-slate-300 rounded-lg p-3 bg-slate-50">
            <div className="flex justify-between items-center border-b border-slate-300 pb-2 mb-2">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                TỔ {g.groupNumber} ({g.memberCount} học sinh)
              </span>
              <span className="text-[11px] font-semibold text-slate-600">
                Điểm thi đua: <strong className="text-slate-900 font-bold">{g.competitionScore}</strong>
              </span>
            </div>
            <ul className="text-xs divide-y divide-slate-200">
              {g.members.map((m, idx) => (
                <li key={m.id} className="py-1 flex justify-between items-center text-slate-700">
                  <div>
                    <span className="text-slate-500 font-mono mr-1.5">{idx + 1}.</span>
                    <span className="font-semibold text-slate-900">{m.fullName}</span>
                    {m.role !== 'hoc_sinh' && m.role !== 'thanh_vien' && (
                      <span className="ml-1 text-[10px] text-teal-800 font-medium">({m.role})</span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-600">{m.studentCode}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function getGroupCompetitionExportData(
  students: Student[],
  transactions: WeeklyPointTransaction[],
  learningRecords: LearningRecord[],
  scopeLabel: string
) {
  const groups = [1, 2, 3, 4].map(gNum => {
    const members = students.filter(s => s.groupNumber === gNum);
    const memberIds = new Set(members.map(s => s.id));

    const groupTx = transactions.filter(t => t.status !== 'voided' && memberIds.has(t.studentId));
    const groupLearning = learningRecords.filter(l => memberIds.has(l.studentId));

    const plusPoints = groupTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
    const minusPoints = groupTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
    const violationCount = groupTx.filter(t => t.type === 'minus').length;
    const bonusCount = groupTx.filter(t => t.type === 'plus').length;

    const baseTotal = members.length * 100;
    const netTotal = baseTotal + plusPoints - minusPoints;
    const avgConduct = members.length > 0 ? (netTotal / members.length) : 100;

    const learningScores = groupLearning.map(l => l.score).filter(s => typeof s === 'number');
    const avgLearning = learningScores.length > 0 
      ? (learningScores.reduce((a, b) => a + b, 0) / learningScores.length)
      : null;

    const learningContribution = avgLearning !== null ? avgLearning * 10 : 80;
    const competitionScore = +(avgConduct * 0.7 + learningContribution * 0.3).toFixed(1);

    let topStudentName = '';
    let topScore = -999;
    members.forEach(m => {
      const mTx = groupTx.filter(t => t.studentId === m.id);
      const p = mTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
      const mi = mTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
      const score = 100 + p - mi;
      if (score > topScore) {
        topScore = score;
        topStudentName = m.fullName;
      }
    });

    return {
      groupNumber: gNum,
      memberCount: members.length,
      avgConduct: +avgConduct.toFixed(1),
      avgLearning: avgLearning !== null ? +avgLearning.toFixed(2) : 'Chưa có',
      violationCount,
      bonusCount,
      competitionScore,
      topStudentName,
      topScore,
    };
  });

  groups.sort((a, b) => b.competitionScore - a.competitionScore);

  const headers = [
    'Xếp hạng',
    'Tổ',
    'Sĩ số thành viên',
    'ĐTB Rèn luyện',
    'ĐTB Học tập',
    'Lượt vi phạm',
    'Lượt khen thưởng',
    'Điểm thi đua tổng hợp',
    'Học sinh tiêu biểu nhất tổ',
  ];

  const rows = groups.map((g, idx) => [
    `Hạng ${idx + 1}`,
    `Tổ ${g.groupNumber}`,
    g.memberCount,
    g.avgConduct,
    g.avgLearning,
    g.violationCount,
    g.bonusCount,
    g.competitionScore,
    g.topStudentName ? `${g.topStudentName} (${g.topScore}đ)` : '—',
  ]);

  return [headers, ...rows];
}

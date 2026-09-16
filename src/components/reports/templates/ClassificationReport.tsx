import React from 'react';
import { Student } from '../../../types/student';
import { WeeklyPointTransaction } from '../../../types/pointTransaction';
import { LearningRecord } from '../../../types/learning';
import { DEFAULT_CLASSIFICATION_CONFIG } from '../../../types/classification';
import { calculateClassifications } from '../../../services/classificationService';
import { Award } from 'lucide-react';

interface ClassificationReportProps {
  students: Student[];
  transactions: WeeklyPointTransaction[];
  learningRecords: LearningRecord[];
  period: 'week' | 'month' | 'semester';
  targetWeek: number;
  targetMonth: string;
  scopeLabel: string;
  groupFilter: number | 'all';
}

export function ClassificationReport({
  students,
  transactions,
  learningRecords,
  period,
  targetWeek,
  targetMonth,
  scopeLabel,
  groupFilter,
}: ClassificationReportProps) {
  const filteredStudents = React.useMemo(() => {
    let list = [...students];
    if (groupFilter !== 'all') {
      list = list.filter(s => s.groupNumber === groupFilter);
    }
    return list.sort((a, b) => (a.stt || 0) - (b.stt || 0));
  }, [students, groupFilter]);

  // Tính kết quả xếp loại
  const results = React.useMemo(() => {
    const config = { ...DEFAULT_CLASSIFICATION_CONFIG, classId: 'default' };
    return calculateClassifications({
      students: filteredStudents,
      transactions: transactions.filter(t => t.status !== 'voided'),
      learningRecords,
      periodType: period,
      selectedWeek: targetWeek,
      selectedMonth: targetMonth,
      selectedSemester: 'HK1',
      config,
    });
  }, [filteredStudents, transactions, learningRecords, period, targetWeek, targetMonth]);

  // Thống kê phân loại theo từng tier
  const tierCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    DEFAULT_CLASSIFICATION_CONFIG.tiers.forEach(t => {
      counts[t.id] = 0;
    });

    results.forEach(r => {
      if (r.tierId && counts[r.tierId] !== undefined) {
        counts[r.tierId] += 1;
      }
    });

    return counts;
  }, [results]);

  const total = results.length;

  return (
    <div className="space-y-6">
      {/* Thống kê tỷ lệ các mức xếp loại */}
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-teal-700" />
          THỐNG KÊ KẾT QUẢ XẾP LOẠI ({scopeLabel})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DEFAULT_CLASSIFICATION_CONFIG.tiers.map(tier => {
            const count = tierCounts[tier.id] || 0;
            const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';

            return (
              <div key={tier.id} className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                <span className="text-xs font-bold text-slate-700 block uppercase">
                  Mức {tier.name}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-black text-slate-900">{count} HS</span>
                  <span className="text-xs text-slate-500">({percent}%)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Điểm chuẩn ≥ {tier.minScore}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bảng chi tiết xếp loại từng học sinh */}
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">
          BẢNG TỔNG HỢP ĐIỂM SỐ VÀ XẾP LOẠI CHI TIẾT
        </h3>
        <table className="w-full text-left border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
              <th className="border border-slate-400 p-2 w-10">STT</th>
              <th className="border border-slate-400 p-2 w-20">Mã HS</th>
              <th className="border border-slate-400 p-2 text-left">Họ và Tên</th>
              <th className="border border-slate-400 p-2 w-14">Tổ</th>
              <th className="border border-slate-400 p-2 w-24">Điểm rèn luyện</th>
              <th className="border border-slate-400 p-2 w-24">Điểm học tập</th>
              <th className="border border-slate-400 p-2 w-20 text-rose-800">Số vi phạm</th>
              <th className="border border-slate-400 p-2 w-28">Mức xếp loại</th>
              <th className="border border-slate-400 p-2">Căn cứ xếp loại / Lý do hạ bậc</th>
              <th className="border border-slate-400 p-2 w-32">Nhận xét GVCN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {results.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-slate-400 p-4 text-center text-slate-500 italic">
                  Chưa đủ dữ liệu để xếp loại.
                </td>
              </tr>
            ) : (
              results.map((r, idx) => (
                <tr key={r.studentId} className="hover:bg-slate-50/50">
                  <td className="border border-slate-400 p-2 text-center font-medium">{idx + 1}</td>
                  <td className="border border-slate-400 p-2 text-center font-mono font-semibold text-slate-700">
                    {r.studentCode}
                  </td>
                  <td className="border border-slate-400 p-2 font-bold text-slate-900">
                    {r.studentName}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold">
                    {r.groupNumber}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-black text-sm text-slate-900">
                    {r.netScore}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-semibold text-indigo-900">
                    {r.academicScoreAverage !== undefined ? r.academicScoreAverage.toFixed(1) : '—'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-rose-700">
                    {r.violationsCount}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold border border-slate-300">
                      {r.rankName}
                    </span>
                  </td>
                  <td className="border border-slate-400 p-2 text-[11px] text-slate-700">
                    {r.insufficientReason ? (
                      <span className="text-amber-800 font-medium">{r.insufficientReason}</span>
                    ) : (
                      'Đạt chuẩn tiêu chí'
                    )}
                  </td>
                  <td className="border border-slate-400 p-2 text-[11px] text-slate-600">
                    {r.teacherComment || (r.rankName === 'Tốt' ? 'Chăm ngoan, tích cực' : r.rankName === 'Khá' ? 'Ngoan, nỗ lực hơn' : 'Cần rèn luyện thêm')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function getClassificationExportData(
  students: Student[],
  transactions: WeeklyPointTransaction[],
  learningRecords: LearningRecord[],
  period: 'week' | 'month' | 'semester',
  targetWeek: number,
  targetMonth: string,
  groupFilter: number | 'all'
) {
  let list = [...students];
  if (groupFilter !== 'all') {
    list = list.filter(s => s.groupNumber === groupFilter);
  }
  list.sort((a, b) => (a.stt || 0) - (b.stt || 0));

  const config = { ...DEFAULT_CLASSIFICATION_CONFIG, classId: 'default' };
  const results = calculateClassifications({
    students: list,
    transactions: transactions.filter(t => t.status !== 'voided'),
    learningRecords,
    periodType: period,
    selectedWeek: targetWeek,
    selectedMonth: targetMonth,
    selectedSemester: 'HK1',
    config,
  });

  const headers = [
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Tổ',
    'Điểm rèn luyện',
    'Điểm học tập',
    'Số lần vi phạm',
    'Mức xếp loại',
    'Căn cứ / Lý do hạ bậc',
    'Nhận xét GVCN',
  ];

  const rows = results.map((r, idx) => [
    idx + 1,
    r.studentCode,
    r.studentName,
    `Tổ ${r.groupNumber}`,
    r.netScore,
    r.academicScoreAverage !== undefined ? r.academicScoreAverage.toFixed(1) : '',
    r.violationsCount,
    r.rankName,
    r.insufficientReason || 'Đạt chuẩn',
    r.teacherComment || (r.rankName === 'Tốt' ? 'Chăm ngoan, tích cực' : r.rankName === 'Khá' ? 'Ngoan, nỗ lực hơn' : 'Cần rèn luyện thêm'),
  ]);

  return [headers, ...rows];
}

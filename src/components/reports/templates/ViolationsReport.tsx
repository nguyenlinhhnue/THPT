import React from 'react';
import { Student } from '../../../types/student';
import { WeeklyPointTransaction } from '../../../types/pointTransaction';
import { AlertCircle } from 'lucide-react';

interface ViolationsReportProps {
  students: Student[];
  transactions: WeeklyPointTransaction[];
  scopeLabel: string;
  groupFilter: number | 'all';
}

export function ViolationsReport({
  students,
  transactions,
  scopeLabel,
  groupFilter,
}: ViolationsReportProps) {
  // Lọc chỉ lấy các giao dịch trừ điểm (vi phạm) hợp lệ
  const studentMap = React.useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  const violationList = React.useMemo(() => {
    return transactions
      .filter(t => {
        if (t.status === 'voided') return false;
        if (t.type !== 'minus') return false;
        if (groupFilter !== 'all') {
          const st = studentMap.get(t.studentId);
          if (!st || st.groupNumber !== groupFilter) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
  }, [transactions, groupFilter, studentMap]);

  // Thống kê các lỗi vi phạm phổ biến nhất (Top lỗi)
  const topErrors = React.useMemo(() => {
    const countMap: Record<string, { count: number; totalMinus: number }> = {};
    violationList.forEach(t => {
      const title = t.ruleSnapshot?.label || t.reason || 'Vi phạm khác';
      if (!countMap[title]) {
        countMap[title] = { count: 0, totalMinus: 0 };
      }
      countMap[title].count += 1;
      countMap[title].totalMinus += (t.score || 0);
    });

    return Object.entries(countMap)
      .map(([rule, data]) => ({ rule, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [violationList]);

  const totalViolations = violationList.length;
  const totalMinusPoints = violationList.reduce((sum, t) => sum + (t.score || 0), 0);

  return (
    <div className="space-y-6">
      {/* Tóm tắt nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 border border-slate-300 p-3 rounded-lg">
        <div>
          <span className="text-slate-600 block">Kỳ thống kê:</span>
          <strong className="text-sm font-bold text-slate-900">{scopeLabel}</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Tổng số lượt vi phạm:</span>
          <strong className="text-base font-bold text-rose-800">{totalViolations} lượt</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Tổng điểm bị trừ:</span>
          <strong className="text-base font-bold text-rose-800">-{totalMinusPoints} điểm</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Số loại lỗi ghi nhận:</span>
          <strong className="text-base font-bold text-slate-900">{topErrors.length} nội quy</strong>
        </div>
      </div>

      {/* Bảng Top lỗi vi phạm nhiều nhất */}
      {topErrors.length > 0 && (
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            TỔNG HỢP CÁC LỖI VI PHẠM PHỔ BIẾN
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {topErrors.slice(0, 6).map((item, idx) => (
              <div key={idx} className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block truncate max-w-[180px]" title={item.rule}>
                    {idx + 1}. {item.rule}
                  </span>
                  <span className="text-[11px] text-slate-500">Trừ tổng: -{item.totalMinus} điểm</span>
                </div>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-900 font-bold rounded-md text-xs">
                  {item.count} lần
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bảng chi tiết từng trường hợp vi phạm */}
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">
          DANH SÁCH CHI TIẾT CÁC LƯỢT VI PHẠM KỶ LUẬT
        </h3>
        <table className="w-full text-left border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
              <th className="border border-slate-400 p-2 w-10">STT</th>
              <th className="border border-slate-400 p-2 w-24">Ngày ghi</th>
              <th className="border border-slate-400 p-2 w-14">Tuần</th>
              <th className="border border-slate-400 p-2 w-20">Mã HS</th>
              <th className="border border-slate-400 p-2 text-left">Họ và Tên học sinh</th>
              <th className="border border-slate-400 p-2 w-14">Tổ</th>
              <th className="border border-slate-400 p-2 text-left">Nội quy vi phạm</th>
              <th className="border border-slate-400 p-2 w-20 text-rose-800">Điểm trừ</th>
              <th className="border border-slate-400 p-2">Chi tiết lý do / Biện pháp chấn chỉnh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {violationList.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-slate-400 p-6 text-center text-slate-500 italic">
                  Không có vi phạm nào được ghi nhận trong khoảng thời gian này. Lớp duy trì nề nếp kỷ luật rất tốt!
                </td>
              </tr>
            ) : (
              violationList.map((t, idx) => {
                const st = studentMap.get(t.studentId);
                const dateDisplay = t.date ? t.date.split('-').reverse().join('/') : '—';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="border border-slate-400 p-2 text-center font-medium">{idx + 1}</td>
                    <td className="border border-slate-400 p-2 text-center font-mono">{dateDisplay}</td>
                    <td className="border border-slate-400 p-2 text-center font-semibold">T.{t.weekNumber}</td>
                    <td className="border border-slate-400 p-2 text-center font-mono font-semibold text-slate-700">
                      {st?.studentCode || '—'}
                    </td>
                    <td className="border border-slate-400 p-2 font-bold text-slate-900">
                      {st?.fullName || 'Học sinh'}
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-bold">
                      {st?.groupNumber || '—'}
                    </td>
                    <td className="border border-slate-400 p-2 font-semibold text-slate-900">
                      {t.ruleSnapshot?.label || t.reason || 'Vi phạm nề nếp'}
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-black text-rose-700">
                      -{t.score} đ
                    </td>
                    <td className="border border-slate-400 p-2 text-[11px] text-slate-700">
                      {t.note || t.reason || 'Đã nhắc nhở rút kinh nghiệm'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function getViolationsExportData(
  students: Student[],
  transactions: WeeklyPointTransaction[],
  groupFilter: number | 'all'
) {
  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  const violationList = transactions
    .filter(t => {
      if (t.status === 'voided') return false;
      if (t.type !== 'minus') return false;
      if (groupFilter !== 'all') {
        const st = studentMap.get(t.studentId);
        if (!st || st.groupNumber !== groupFilter) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  const headers = [
    'STT',
    'Ngày vi phạm',
    'Tuần',
    'Mã học sinh',
    'Họ và tên',
    'Tổ',
    'Nội quy vi phạm',
    'Điểm trừ',
    'Lý do / Nội dung chi tiết',
  ];

  const rows = violationList.map((t, idx) => {
    const st = studentMap.get(t.studentId);
    return [
      idx + 1,
      t.date || '',
      `Tuần ${t.weekNumber}`,
      st?.studentCode || '',
      st?.fullName || '',
      st ? `Tổ ${st.groupNumber}` : '',
      t.ruleSnapshot?.label || t.reason || 'Vi phạm nề nếp',
      `-${t.score}`,
      t.note || t.reason || 'Đã nhắc nhở',
    ];
  });

  return [headers, ...rows];
}

import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  ArrowRight, 
  TrendingDown, 
  CheckCircle2,
  Clock 
} from 'lucide-react';
import { WeeklyPointTransaction } from '../../types/pointTransaction';
import { Student } from '../../types/student';

export interface ViolationStatItem {
  ruleId: string;
  ruleName: string;
  count: number;
  totalPoints: number;
  percentage: number;
}

interface ConductStatisticsCardProps {
  totalViolations: number;
  totalRewards: number;
  totalMinusPoints: number;
  totalPlusPoints: number;
  topViolations: ViolationStatItem[];
  recentTransactions: WeeklyPointTransaction[];
  students: Student[];
  periodLabel: string;
  onViewConductDetails?: () => void;
  onRecordNewConduct?: () => void;
}

export function ConductStatisticsCard({
  totalViolations,
  totalRewards,
  totalMinusPoints,
  totalPlusPoints,
  topViolations,
  recentTransactions,
  students,
  periodLabel,
  onViewConductDetails,
  onRecordNewConduct,
}: ConductStatisticsCardProps) {
  const studentMap = React.useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Thống Kê Rèn Luyện & Nề Nếp ({periodLabel})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu hợp lệ từ giao dịch nề nếp • Tuyệt đối không nhập điểm thủ công
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onRecordNewConduct && (
              <button
                onClick={onRecordNewConduct}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
              >
                + Ghi nhận nề nếp
              </button>
            )}
            {onViewConductDetails && (
              <button
                onClick={onViewConductDetails}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                <span>Xem sổ nề nếp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Mini Cards rèn luyện */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Vi phạm
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-rose-600">{totalViolations}</span>
              <span className="text-xs text-slate-500">lượt lỗi</span>
            </div>
            <span className="text-[11px] text-rose-600 font-medium block mt-0.5">
              -{totalMinusPoints} điểm trừ
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Khen thưởng
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-700">{totalRewards}</span>
              <span className="text-xs text-slate-500">lượt biểu dương</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
              +{totalPlusPoints} điểm cộng
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Chênh lệch điểm
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-black ${totalPlusPoints - totalMinusPoints >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                {totalPlusPoints - totalMinusPoints > 0 ? `+${totalPlusPoints - totalMinusPoints}` : totalPlusPoints - totalMinusPoints}
              </span>
              <span className="text-xs text-slate-500">điểm ròng</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Thi đua tập thể
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tỉ lệ chấp hành
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">
                {totalViolations === 0 
                  ? '100%' 
                  : `${Math.max(0, 100 - totalViolations * 2)}%`}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Chỉ số nền nếp
            </span>
          </div>
        </div>

        {/* Top lỗi vi phạm phổ biến */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Các Lỗi Vi Phạm Cần Chấn Chỉnh Nhiều Nhất</span>
            <span className="text-[11px] font-normal text-slate-400">Tần suất xuất hiện</span>
          </h4>

          {topViolations.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 text-center">
              <p className="text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Lớp thực hiện nền nếp rất tốt! Không có lỗi vi phạm nào trong kỳ.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {topViolations.slice(0, 4).map((violation, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[70%]">
                      {idx + 1}. {violation.ruleName}
                    </span>
                    <span className="text-slate-500 font-medium">
                      <strong className="text-rose-600 font-bold">{violation.count} lượt</strong> ({violation.totalPoints} đ)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(8, violation.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nhật ký nề nếp gần nhất */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            Ghi Nhận Nề Nếp Gần Đây
          </h4>

          {recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Chưa có giao dịch nề nếp nào trong chu kỳ này.
            </p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.slice(0, 3).map((tx) => {
                const student = studentMap.get(tx.studentId);
                const isReward = tx.score > 0 || tx.type === 'plus';
                const reasonText = tx.reason || tx.ruleSnapshot?.label || 'Giao dịch nề nếp';
                const displayScore = Math.abs(tx.score);

                return (
                  <div 
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isReward ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {student?.fullName || tx.studentNameSnapshot || 'Học sinh'}
                          <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                            (Tổ {student?.groupNumber || tx.groupNumberSnapshot})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{reasonText}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className={`font-black ${isReward ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {isReward ? `+${displayScore}` : `-${displayScore}`} đ
                      </span>
                      {tx.weekNumber && (
                        <span className="block text-[10px] text-slate-400">Tuần {tx.weekNumber}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

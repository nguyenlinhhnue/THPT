import React from 'react';
import { 
  Award, 
  ArrowRight, 
  AlertTriangle, 
  HelpCircle,
  Calendar,
  Lock,
  Sparkles 
} from 'lucide-react';
import { StudentClassificationResult, ClassificationCriteriaConfig } from '../../types/classification';

interface MonthlyClassificationSummaryProps {
  selectedMonth: string; // 'YYYY-MM'
  monthLabel: string;
  results: StudentClassificationResult[];
  config: ClassificationCriteriaConfig;
  onViewDetailedClassification?: () => void;
}

export function MonthlyClassificationSummary({
  selectedMonth,
  monthLabel,
  results,
  config,
  onViewDetailedClassification,
}: MonthlyClassificationSummaryProps) {
  // Thống kê phân phối theo từng Tier
  const tierDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let insufficientCount = 0;

    config.tiers.forEach(t => {
      counts[t.id] = 0;
    });

    results.forEach(r => {
      if (!r.isSufficientData) {
        insufficientCount++;
      } else if (r.tierId) {
        counts[r.tierId] = (counts[r.tierId] || 0) + 1;
      }
    });

    return { counts, insufficientCount };
  }, [results, config.tiers]);

  const totalStudents = results.length;
  const denominator = totalStudents > 0 ? totalStudents : 1;

  // Kiểm tra xem có học sinh nào bị báo thiếu tuần hoạt động không
  const firstInsufficient = results.find(r => !r.isSufficientData);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xếp Loại Rèn Luyện {monthLabel}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đánh giá tháng học • Yêu cầu tối thiểu {config.minWeeksRequiredForMonth} tuần dữ liệu nề nếp
              </p>
            </div>
          </div>

          {onViewDetailedClassification && (
            <button
              onClick={onViewDetailedClassification}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 self-start sm:self-center transition-colors"
            >
              <span>Xem bảng xếp loại tháng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Cảnh báo nếu chưa đủ tuần hoạt động trong tháng */}
        {firstInsufficient && firstInsufficient.insufficientReason && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Lưu ý kiểm soát dữ liệu tháng: </span>
              <span>{firstInsufficient.insufficientReason}</span>
            </div>
          </div>
        )}

        {/* Stacked Progress Bar */}
        <div className="mb-4">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            {config.tiers.map(tier => {
              const count = tierDistribution.counts[tier.id] || 0;
              if (count === 0) return null;
              const pct = (count / denominator) * 100;
              
              const colorClass = 
                tier.badgeColor === 'emerald' ? 'bg-emerald-600' :
                tier.badgeColor === 'blue' ? 'bg-teal-600' :
                tier.badgeColor === 'amber' ? 'bg-amber-500' :
                tier.badgeColor === 'rose' ? 'bg-rose-500' :
                tier.badgeColor === 'purple' ? 'bg-purple-600' : 'bg-slate-500';

              return (
                <div
                  key={tier.id}
                  className={`${colorClass} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${tier.name}: ${count} HS (${Math.round(pct)}%)`}
                />
              );
            })}

            {tierDistribution.insufficientCount > 0 && (
              <div
                className="bg-slate-400 transition-all"
                style={{ width: `${(tierDistribution.insufficientCount / denominator) * 100}%` }}
                title={`Chưa đủ dữ liệu: ${tierDistribution.insufficientCount} HS`}
              />
            )}
          </div>
        </div>

        {/* Grid các mức xếp loại tháng */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          {config.tiers.map((tier) => {
            const count = tierDistribution.counts[tier.id] || 0;
            const pct = Math.round((count / denominator) * 100);

            const badgeStyle = 
              tier.badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              tier.badgeColor === 'blue' ? 'bg-teal-50 text-teal-800 border-teal-200' :
              tier.badgeColor === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' :
              tier.badgeColor === 'rose' ? 'bg-rose-50 text-rose-800 border-rose-200' :
              tier.badgeColor === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' :
              'bg-slate-50 text-slate-800 border-slate-200';

            return (
              <div 
                key={tier.id}
                className={`p-3 rounded-xl border flex flex-col justify-between ${badgeStyle}`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold truncate">{tier.name}</span>
                  <span className="text-[10px] opacity-75">$\ge {tier.minScore}$ đ</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-black">{count}</span>
                  <span className="text-xs font-semibold opacity-80">{pct}%</span>
                </div>
              </div>
            );
          })}

          {tierDistribution.insufficientCount > 0 && (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 truncate">Chưa đủ dữ liệu</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-800">{tierDistribution.insufficientCount}</span>
                <span className="text-xs font-semibold text-slate-500">
                  {Math.round((tierDistribution.insufficientCount / denominator) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Kỳ đánh giá: {monthLabel}
        </span>
        <span className="font-medium text-teal-800">
          Tỉ lệ Tốt/Xuất sắc: {Math.round((((tierDistribution.counts[config.tiers[0]?.id] || 0) + (tierDistribution.counts[config.tiers[1]?.id] || 0)) / denominator) * 100)}%
        </span>
      </div>
    </div>
  );
}

import React from 'react';
import { LearningStats } from '../../types/learning';
import { 
  Calculator, 
  FileCheck2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Award, 
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface LearningStatsCardsProps {
  stats: LearningStats;
}

export function LearningStatsCards({ stats }: LearningStatsCardsProps) {
  const getTrendBadge = () => {
    if (stats.trend === 'up') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          <TrendingUp className="w-3 h-3" />
          Tiến bộ (+{stats.trendDelta})
        </span>
      );
    }
    if (stats.trend === 'down') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
          <TrendingDown className="w-3 h-3" />
          Giảm sút ({stats.trendDelta})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        <Minus className="w-3 h-3" />
        Ổn định ({stats.trendDelta >= 0 ? `+${stats.trendDelta}` : stats.trendDelta})
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-emerald-700';
    if (score >= 6.5) return 'text-blue-700';
    if (score >= 5.0) return 'text-amber-700';
    return 'text-rose-700';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Điểm trung bình */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Điểm trung bình</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
            {stats.totalAssessments > 0 ? stats.averageScore.toFixed(2) : '--'}
          </span>
          <span className="text-xs text-slate-600">/ 10.0</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
          <span>Quy mô: {stats.totalAssessments} bài</span>
          {stats.totalAssessments > 0 && getTrendBadge()}
        </div>
      </div>

      {/* 2. Số lượng bài kiểm tra */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Số bài kiểm tra</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-800">{stats.totalAssessments}</span>
          <span className="text-xs text-slate-600">đầu điểm</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
          <span>Không trùng lặp ID</span>
          <span className="text-emerald-700 font-medium">Realtime</span>
        </div>
      </div>

      {/* 3. Điểm cao nhất */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Điểm cao nhất</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-700">
            {stats.totalAssessments > 0 ? stats.highestScore.toFixed(1) : '--'}
          </span>
          <span className="text-xs text-slate-600">điểm max</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
          <span>{stats.scoreDistribution.excellent} bài đạt ≥ 9.0</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        </div>
      </div>

      {/* 4. Điểm thấp nhất */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Điểm thấp nhất</span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${stats.lowestScore < 5 ? 'text-rose-600' : 'text-slate-700'}`}>
            {stats.totalAssessments > 0 ? stats.lowestScore.toFixed(1) : '--'}
          </span>
          <span className="text-xs text-slate-600">điểm min</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
          <span className={stats.scoreDistribution.weak > 0 ? 'text-rose-700 font-medium' : 'text-slate-600'}>
            {stats.scoreDistribution.weak} bài &lt; 5.0
          </span>
          <span>{stats.totalAssessments > 0 ? `${Math.round(((stats.totalAssessments - stats.scoreDistribution.weak) / stats.totalAssessments) * 100)}% đạt` : ''}</span>
        </div>
      </div>

      {/* 5. Thành tích & Cần hỗ trợ */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Nhận xét & Hỗ trợ</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-amber-700">{stats.totalAchievements}</div>
            <div className="text-[11px] text-slate-600">Thành tích</div>
          </div>
          <div className="h-7 w-px bg-slate-200"></div>
          <div>
            <div className="text-lg font-bold text-rose-700">{stats.totalSupportNeeded}</div>
            <div className="text-[11px] text-slate-600">Cần phụ đạo</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-600 border-t border-slate-100 pt-2 truncate">
          GVCN theo dõi sát sao
        </div>
      </div>
    </div>
  );
}

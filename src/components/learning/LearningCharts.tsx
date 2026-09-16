import React, { useState } from 'react';
import { LearningRecord, LearningStats } from '../../types/learning';
import { THPT_SUBJECTS } from '../../types/score';
import { BarChart3, TrendingUp, BookOpen, Layers } from 'lucide-react';

interface LearningChartsProps {
  records: LearningRecord[];
  stats: LearningStats;
}

export function LearningCharts({ records, stats }: LearningChartsProps) {
  const [chartView, setChartView] = useState<'distribution' | 'timeline' | 'subjects'>('distribution');

  // Phân bố điểm
  const total = stats.totalAssessments || 1;
  const dist = stats.scoreDistribution;
  const categories = [
    { label: 'Xuất sắc (≥ 9.0)', count: dist.excellent, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgSoft: 'bg-emerald-50' },
    { label: 'Giỏi (8.0 - 8.9)', count: dist.good, color: 'bg-blue-500', textColor: 'text-blue-700', bgSoft: 'bg-blue-50' },
    { label: 'Khá (6.5 - 7.9)', count: dist.fair, color: 'bg-indigo-500', textColor: 'text-indigo-700', bgSoft: 'bg-indigo-50' },
    { label: 'Trung bình (5.0 - 6.4)', count: dist.average, color: 'bg-amber-500', textColor: 'text-amber-700', bgSoft: 'bg-amber-50' },
    { label: 'Cần cố gắng (< 5.0)', count: dist.weak, color: 'bg-rose-500', textColor: 'text-rose-700', bgSoft: 'bg-rose-50' },
  ];

  // Thống kê theo môn học
  const subjectMap = new Map<string, { name: string; totalScore: number; count: number }>();
  records.forEach(r => {
    const existing = subjectMap.get(r.subjectCode) || { name: r.subjectName, totalScore: 0, count: 0 };
    existing.totalScore += r.score;
    existing.count += 1;
    subjectMap.set(r.subjectCode, existing);
  });

  const subjectStats = Array.from(subjectMap.entries())
    .map(([code, data]) => ({
      code,
      name: data.name,
      avg: Math.round((data.totalScore / data.count) * 10) / 10,
      count: data.count,
    }))
    .sort((a, b) => b.avg - a.avg);

  // Dữ liệu dòng thời gian (20 bài gần nhất sắp xếp theo ngày tăng dần)
  const timelineRecords = [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-15);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
      {/* Chart Header with Tab Switching */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Trực quan Hóa Dữ liệu Học tập
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật thời gian thực dựa trên {stats.totalAssessments} bài kiểm tra đã lưu
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium text-slate-600 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartView('distribution')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              chartView === 'distribution'
                ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Phân bố điểm
          </button>
          <button
            type="button"
            onClick={() => setChartView('timeline')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              chartView === 'timeline'
                ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Xu hướng điểm
          </button>
          <button
            type="button"
            onClick={() => setChartView('subjects')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              chartView === 'subjects'
                ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Theo môn học
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="pt-4">
        {stats.totalAssessments === 0 ? (
          <div className="py-10 text-center text-xs text-slate-600">
            Chưa có dữ liệu bài kiểm tra nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : chartView === 'distribution' ? (
          /* 1. Biểu đồ phân bố thang điểm */
          <div className="space-y-3">
            {categories.map((c, i) => {
              const pct = Math.round((c.count / total) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{c.label}</span>
                    <span className="text-slate-500 font-semibold">
                      {c.count} bài <span className="font-normal text-slate-600">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${c.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : chartView === 'timeline' ? (
          /* 2. Biểu đồ đường xu hướng kết quả */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Diễn biến điểm số các bài kiểm tra gần đây (Tối đa 15 bài)</span>
              <span className="font-semibold text-indigo-700">ĐTB toàn kỳ: {stats.averageScore.toFixed(1)}</span>
            </div>
            
            {/* SVG Trend Line */}
            <div className="h-44 w-full relative pt-2 pb-6">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                {/* Background grid lines */}
                <line x1="0" y1="0" x2="500" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#e2e8f0" strokeWidth="1" />

                {/* Average baseline */}
                {stats.averageScore > 0 && (
                  <line
                    x1="0"
                    y1={120 - (stats.averageScore / 10) * 120}
                    x2="500"
                    y2={120 - (stats.averageScore / 10) * 120}
                    stroke="#818cf8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Points and connecting path */}
                {timelineRecords.length > 1 && (
                  <path
                    d={timelineRecords.reduce((acc, rec, idx) => {
                      const x = (idx / (timelineRecords.length - 1)) * 500;
                      const y = 120 - (rec.score / 10) * 120;
                      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Points circles */}
                {timelineRecords.map((rec, idx) => {
                  const x = timelineRecords.length === 1 ? 250 : (idx / (timelineRecords.length - 1)) * 500;
                  const y = 120 - (rec.score / 10) * 120;
                  return (
                    <g key={rec.id} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill={rec.score >= 8 ? '#10b981' : rec.score >= 5 ? '#4f46e5' : '#ef4444'}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      {/* Score label text */}
                      <text
                        x={x}
                        y={Math.max(12, y - 8)}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fill="#334155"
                      >
                        {rec.score}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Labels below */}
              <div className="flex justify-between items-center text-[10px] text-slate-600 mt-2">
                <span>{timelineRecords[0]?.date}</span>
                <span>{timelineRecords[timelineRecords.length - 1]?.date}</span>
              </div>
            </div>
          </div>
        ) : (
          /* 3. Thống kê theo môn học */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {subjectStats.map(s => (
              <div key={s.code} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">{s.name}</div>
                  <div className="text-[11px] text-slate-500">{s.count} bài kiểm tra</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    s.avg >= 8.0 ? 'text-emerald-600' : s.avg >= 6.5 ? 'text-blue-600' : s.avg >= 5.0 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {s.avg.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-600">ĐTB môn</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

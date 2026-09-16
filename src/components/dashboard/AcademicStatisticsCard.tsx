import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  HeartHandshake, 
  ArrowRight, 
  BarChart3, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { LearningRecord, ASSESSMENT_TYPE_LABELS } from '../../types/learning';
import { Student } from '../../types/student';

export interface AcademicGradeDistribution {
  excellentCount: number; // >= 8.0
  goodCount: number;      // 6.5 - 7.9
  averageCount: number;   // 5.0 - 6.4
  weakCount: number;      // < 5.0
  totalAssessments: number;
  classAvgScore: number | null;
  praisedCount: number;
  supportNeededCount: number;
}

interface AcademicStatisticsCardProps {
  distribution: AcademicGradeDistribution;
  recentLearningRecords: LearningRecord[];
  students: Student[];
  periodLabel: string;
  onViewLearningDetails?: () => void;
  onAddNewAssessment?: () => void;
}

export function AcademicStatisticsCard({
  distribution,
  recentLearningRecords,
  students,
  periodLabel,
  onViewLearningDetails,
  onAddNewAssessment,
}: AcademicStatisticsCardProps) {
  const { 
    totalAssessments, 
    classAvgScore, 
    excellentCount, 
    goodCount, 
    averageCount, 
    weakCount, 
    praisedCount, 
    supportNeededCount 
  } = distribution;

  const total = totalAssessments > 0 ? totalAssessments : 1;
  const excellentPct = Math.round((excellentCount / total) * 100);
  const goodPct = Math.round((goodCount / total) * 100);
  const averagePct = Math.round((averageCount / total) * 100);
  const weakPct = Math.round((weakCount / total) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Thống Kê Học Tập & Bài Kiểm Tra ({periodLabel})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu bài kiểm tra định kỳ & thường xuyên • Đồng bộ với GV bộ môn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onAddNewAssessment && (
              <button
                onClick={onAddNewAssessment}
                className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors"
              >
                + Nhập kết quả học tập
              </button>
            )}
            {onViewLearningDetails && (
              <button
                onClick={onViewLearningDetails}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
              >
                <span>Sổ theo dõi học tập</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Mini Cards học tập */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tổng số bài KT
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{totalAssessments}</span>
              <span className="text-xs text-slate-500">lượt chấm</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Thường xuyên & định kỳ
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              ĐTB Học tập lớp
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-teal-700">
                {classAvgScore !== null ? classAvgScore.toFixed(2) : '—'}
              </span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {classAvgScore !== null && classAvgScore >= 8.0 
                ? 'Chất lượng Giỏi' 
                : classAvgScore !== null && classAvgScore >= 6.5 
                ? 'Chất lượng Khá' 
                : 'Cần bồi dưỡng thêm'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Khen thưởng học tập
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-700">{praisedCount}</span>
              <span className="text-xs text-slate-500">bài xuất sắc</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
              Thành tích cao / Điểm $\ge 9$
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Cần phụ đạo
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-black ${supportNeededCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {supportNeededCount}
              </span>
              <span className="text-xs text-slate-500">học sinh</span>
            </div>
            <span className="text-[11px] text-amber-600 font-medium block mt-0.5">
              Có ghi chú cần hỗ trợ
            </span>
          </div>
        </div>

        {/* Phổ điểm học tập */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Phổ Điểm Học Tập Toàn Lớp</span>
            <span className="text-[11px] font-normal text-slate-400">{totalAssessments} bài kiểm tra</span>
          </h4>

          {totalAssessments === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Chưa có bài kiểm tra nào được ghi nhận trong chu kỳ này.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Stacked visual bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                {excellentCount > 0 && (
                  <div 
                    className="bg-emerald-600 transition-all"
                    style={{ width: `${excellentPct}%` }}
                    title={`Giỏi (>=8.0): ${excellentCount} bài (${excellentPct}%)`}
                  />
                )}
                {goodCount > 0 && (
                  <div 
                    className="bg-teal-500 transition-all"
                    style={{ width: `${goodPct}%` }}
                    title={`Khá (6.5-7.9): ${goodCount} bài (${goodPct}%)`}
                  />
                )}
                {averageCount > 0 && (
                  <div 
                    className="bg-amber-400 transition-all"
                    style={{ width: `${averagePct}%` }}
                    title={`Trung bình (5.0-6.4): ${averageCount} bài (${averagePct}%)`}
                  />
                )}
                {weakCount > 0 && (
                  <div 
                    className="bg-rose-500 transition-all"
                    style={{ width: `${weakPct}%` }}
                    title={`Yếu (<5.0): ${weakCount} bài (${weakPct}%)`}
                  />
                )}
              </div>

              {/* Legend 4 mức */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-slate-600">Giỏi ($\ge 8$):</span>
                  <strong className="text-slate-900">{excellentCount}</strong>
                  <span className="text-slate-400">({excellentPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                  <span className="text-slate-600">Khá (6.5-7.9):</span>
                  <strong className="text-slate-900">{goodCount}</strong>
                  <span className="text-slate-400">({goodPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-slate-600">TB (5-6.4):</span>
                  <strong className="text-slate-900">{averageCount}</strong>
                  <span className="text-slate-400">({averagePct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-slate-600">Yếu (&lt; 5):</span>
                  <strong className="text-slate-900">{weakCount}</strong>
                  <span className="text-slate-400">({weakPct}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Danh sách bài kiểm tra gần nhất */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            Bài Kiểm Tra Mới Ghi Nhận
          </h4>

          {recentLearningRecords.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Chưa có kết quả học tập nào được nhập gần đây.
            </p>
          ) : (
            <div className="space-y-2">
              {recentLearningRecords.slice(0, 3).map((rec) => (
                <div 
                  key={rec.id}
                  className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-teal-100/70 text-teal-800 font-bold flex items-center justify-center shrink-0 text-xs">
                      {rec.score}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {rec.studentNameSnapshot}
                        <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                          • {rec.subjectName} ({rec.assessmentName || ASSESSMENT_TYPE_LABELS[rec.assessmentType] || 'Kiểm tra'})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {rec.date} {rec.supportNeeded ? `• Cần hỗ trợ: ${rec.supportNeeded}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                      rec.score >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      rec.score >= 6.5 ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                      rec.score >= 5.0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {rec.score >= 8 ? 'Giỏi' : rec.score >= 6.5 ? 'Khá' : rec.score >= 5 ? 'Đạt' : 'Chưa đạt'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

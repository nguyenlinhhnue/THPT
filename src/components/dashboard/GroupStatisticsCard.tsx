import React from 'react';
import { Trophy, Users, Award, AlertTriangle, ArrowRight, BookOpen, TrendingUp } from 'lucide-react';
import { Student } from '../../types/student';

export interface GroupStatData {
  groupNumber: number;
  studentsCount: number;
  totalCompetitionPoints: number;
  plusPoints: number;
  minusPoints: number;
  violationsCount: number;
  rewardsCount: number;
  avgConductScore: number;
  avgAcademicScore: number | null;
  academicAssessmentsCount: number;
  rank: number;
}

interface GroupStatisticsCardProps {
  groupsData: GroupStatData[];
  basePoints: number;
  periodLabel: string;
  onViewCompetitionDetails?: () => void;
}

export function GroupStatisticsCard({
  groupsData,
  basePoints,
  periodLabel,
  onViewCompetitionDetails,
}: GroupStatisticsCardProps) {
  // Sắp xếp theo rank tăng dần (Hạng 1 đến Hạng 4)
  const sortedGroups = [...groupsData].sort((a, b) => a.rank - b.rank);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Thống Kê & Xếp Hạng 4 Tổ ({periodLabel})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Điểm thi đua = Điểm chuẩn ({basePoints}) + Thưởng - Phạt • Tự động tính từ các thành viên trong tổ
          </p>
        </div>

        {onViewCompetitionDetails && (
          <button
            onClick={onViewCompetitionDetails}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 self-start sm:self-center transition-colors"
          >
            <span>Chi tiết thi đua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid 4 Tổ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedGroups.map((g) => {
          const isRank1 = g.rank === 1;
          const isRank2 = g.rank === 2;
          const isRank3 = g.rank === 3;

          const rankBadge = isRank1 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              🥇 Hạng 1
            </span>
          ) : isRank2 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
              🥈 Hạng 2
            </span>
          ) : isRank3 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
              🥉 Hạng 3
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
              Hạng 4
            </span>
          );

          const cardBorder = isRank1 
            ? 'border-emerald-300 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-200/50' 
            : 'border-slate-200 bg-white hover:border-slate-300';

          return (
            <div 
              key={g.groupNumber}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${cardBorder}`}
            >
              <div>
                {/* Header card tổ */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-black text-slate-900">
                    Tổ {g.groupNumber}
                  </span>
                  {rankBadge}
                </div>

                {/* Điểm thi đua nổi bật */}
                <div className="mt-1">
                  <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5">
                    <span className={isRank1 ? 'text-emerald-700' : 'text-slate-800'}>
                      {g.totalCompetitionPoints}
                    </span>
                    <span className="text-xs font-normal text-slate-500">điểm thi đua</span>
                  </div>
                </div>

                {/* Các chỉ số chi tiết */}
                <div className="mt-4 space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Sĩ số tổ
                    </span>
                    <span className="font-semibold text-slate-800">{g.studentsCount} HS</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      Khen thưởng
                    </span>
                    <span className="font-semibold text-emerald-700">+{g.plusPoints} đ ({g.rewardsCount} lượt)</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      Vi phạm
                    </span>
                    <span className="font-semibold text-rose-600">-{g.minusPoints} đ ({g.violationsCount} lỗi)</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                      ĐTB Rèn luyện
                    </span>
                    <span className="font-bold text-slate-800">{g.avgConductScore.toFixed(1)} đ</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      ĐTB Học tập
                    </span>
                    <span className="font-bold text-slate-800">
                      {g.avgAcademicScore !== null ? `${g.avgAcademicScore.toFixed(1)} / 10` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Khảo sát: {g.academicAssessmentsCount} bài KT</span>
                <span className="text-teal-700 font-medium">Tổ {g.groupNumber}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

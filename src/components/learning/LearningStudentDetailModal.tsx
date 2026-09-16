import React from 'react';
import { Student } from '../../types/student';
import { 
  LearningRecord, 
  ASSESSMENT_TYPE_LABELS, 
  ASSESSMENT_TYPE_BADGES 
} from '../../types/learning';
import { calculateLearningStats } from '../../services/learningService';
import { 
  X, 
  User, 
  Award, 
  HelpCircle, 
  Calculator, 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  PlusCircle,
  MessageSquareQuote,
  Scale
} from 'lucide-react';

interface LearningStudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  records: LearningRecord[];
  onAddNewAssessment: (studentId: string) => void;
  onEditAssessment: (record: LearningRecord) => void;
}

export function LearningStudentDetailModal({
  isOpen,
  onClose,
  student,
  records,
  onAddNewAssessment,
  onEditAssessment,
}: LearningStudentDetailModalProps) {
  if (!isOpen || !student) return null;

  // Lọc tất cả bài kiểm tra của học sinh này (không tính trùng lặp)
  const studentRecords = records.filter(r => r.studentId === student.id);
  const stats = calculateLearningStats(studentRecords);

  // Thu thập các thành tích và nội dung cần hỗ trợ
  const achievements = studentRecords.filter(r => r.achievement && r.achievement.trim() !== '');
  const supports = studentRecords.filter(r => r.supportNeeded && r.supportNeeded.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {student.stt}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">{student.fullName}</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-semibold">
                  Tổ {student.groupNumber}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Mã: {student.studentCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hồ sơ theo dõi học tập cá nhân toàn diện dành riêng cho GVCN
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">ĐTB Kiểm tra</div>
              <div className="text-xl font-bold text-indigo-700 mt-1">
                {stats.totalAssessments > 0 ? stats.averageScore.toFixed(2) : '--'}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">Thang điểm 10</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Số bài kiểm tra</div>
              <div className="text-xl font-bold text-slate-800 mt-1">
                {stats.totalAssessments}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">Không trùng lặp</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Cao / Thấp nhất</div>
              <div className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                <span className="text-emerald-700">{stats.totalAssessments > 0 ? stats.highestScore : '--'}</span>
                <span className="text-slate-300 font-normal">/</span>
                <span className={stats.lowestScore < 5 ? 'text-rose-600' : 'text-slate-700'}>
                  {stats.totalAssessments > 0 ? stats.lowestScore : '--'}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">Biên độ điểm</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Xu hướng kết quả</div>
              <div className="text-sm font-bold mt-1.5 flex items-center gap-1">
                {stats.trend === 'up' ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> Tiến bộ (+{stats.trendDelta})
                  </span>
                ) : stats.trend === 'down' ? (
                  <span className="text-rose-600 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" /> Giảm sút ({stats.trendDelta})
                  </span>
                ) : (
                  <span className="text-slate-600 flex items-center gap-1">
                    <Minus className="w-4 h-4" /> Ổn định
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">So sánh nửa kỳ</div>
            </div>
          </div>

          {/* Highlights: Achievements & Support Needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Thành tích */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Thành tích học tập ghi nhận ({achievements.length})
              </div>
              {achievements.length === 0 ? (
                <p className="text-xs text-slate-600 italic">Chưa ghi nhận thành tích đặc biệt.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {achievements.map(a => (
                    <li key={a.id} className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-emerald-900">{a.achievement}</span>
                        <span className="text-slate-500 block text-[11px]">
                          {a.subjectName} ({a.score}đ) • Ngày {a.date}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cần hỗ trợ */}
            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">
                <HelpCircle className="w-4 h-4 text-rose-600" />
                Nội dung cần hỗ trợ / Phụ đạo ({supports.length})
              </div>
              {supports.length === 0 ? (
                <p className="text-xs text-slate-600 italic">Không có cảnh báo hỗ trợ đặc biệt.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {supports.map(s => (
                    <li key={s.id} className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-rose-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-rose-900">{s.supportNeeded}</span>
                        <span className="text-slate-500 block text-[11px]">
                          {s.subjectName} ({s.score}đ) • Ngày {s.date}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Timeline of Assessments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                Lịch sử kiểm tra ({studentRecords.length} bài)
              </h3>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddNewAssessment(student.id);
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Thêm bài kiểm tra mới
              </button>
            </div>

            {studentRecords.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                Chưa có dữ liệu bài kiểm tra nào cho học sinh này.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {studentRecords.map(rec => {
                  const badge = ASSESSMENT_TYPE_BADGES[rec.assessmentType] || ASSESSMENT_TYPE_BADGES.khac;
                  return (
                    <div key={rec.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {ASSESSMENT_TYPE_LABELS[rec.assessmentType] || 'Kiểm tra'}
                          </span>
                          <span className="font-semibold text-sm text-slate-800">
                            {rec.subjectName}: {rec.assessmentName}
                          </span>
                          {rec.hasConductBonus && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Scale className="w-3 h-3" />
                              +{rec.conductBonusScore || 2}đ Rèn luyện
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {rec.date}
                          </span>
                          <span>Tuần {rec.weekNumber}</span>
                          <span>{rec.semester}</span>
                        </div>

                        {rec.feedback && (
                          <div className="text-xs text-slate-600 bg-slate-100/70 p-2 rounded-lg mt-1 flex items-start gap-1.5">
                            <MessageSquareQuote className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <span>{rec.feedback}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className={`text-xl font-bold ${
                            rec.score >= 8 ? 'text-emerald-600' :
                            rec.score >= 6.5 ? 'text-blue-600' :
                            rec.score >= 5 ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {rec.score.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-slate-600">Điểm số</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditAssessment(rec);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

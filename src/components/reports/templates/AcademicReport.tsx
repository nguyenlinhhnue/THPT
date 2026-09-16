import React from 'react';
import { Student } from '../../../types/student';
import { LearningRecord, ASSESSMENT_TYPE_LABELS } from '../../../types/learning';
import { SubjectScore, THPT_SUBJECTS } from '../../../types/score';
import { calculateOverallAverage } from '../../../utils/calculations';
import { BookOpen, Star, AlertTriangle } from 'lucide-react';

interface AcademicReportProps {
  students: Student[];
  learningRecords: LearningRecord[];
  scores: SubjectScore[];
  scopeLabel: string;
  groupFilter: number | 'all';
}

export function AcademicReport({
  students,
  learningRecords,
  scores,
  scopeLabel,
  groupFilter,
}: AcademicReportProps) {
  const filteredStudents = React.useMemo(() => {
    let list = [...students];
    if (groupFilter !== 'all') {
      list = list.filter(s => s.groupNumber === groupFilter);
    }
    return list.sort((a, b) => (a.stt || 0) - (b.stt || 0));
  }, [students, groupFilter]);

  const studentIds = React.useMemo(() => new Set(filteredStudents.map(s => s.id)), [filteredStudents]);

  const activeLearningRecords = React.useMemo(() => {
    return learningRecords.filter(l => studentIds.has(l.studentId));
  }, [learningRecords, studentIds]);

  // Phổ điểm học tập
  const scoreStats = React.useMemo(() => {
    const list = activeLearningRecords.map(l => l.score).filter(s => typeof s === 'number');
    const total = list.length;
    const avg = total > 0 ? (list.reduce((a, b) => a + b, 0) / total).toFixed(2) : '—';

    const gioi = list.filter(s => s >= 8.0).length;
    const kha = list.filter(s => s >= 6.5 && s < 8.0).length;
    const trungBinh = list.filter(s => s >= 5.0 && s < 6.5).length;
    const yeu = list.filter(s => s < 5.0).length;

    return { total, avg, gioi, kha, trungBinh, yeu };
  }, [activeLearningRecords]);

  // Danh sách khen ngợi & Cần phụ đạo
  const achievements = React.useMemo(() => {
    return activeLearningRecords.filter(l => l.achievement || l.score >= 9.0);
  }, [activeLearningRecords]);

  const needSupport = React.useMemo(() => {
    return activeLearningRecords.filter(l => l.supportNeeded || l.score < 5.0);
  }, [activeLearningRecords]);

  return (
    <div className="space-y-6">
      {/* Thẻ thống kê kết quả học tập */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-slate-50 border border-slate-300 p-3 rounded-lg">
        <div>
          <span className="text-slate-600 block">Kỳ báo cáo:</span>
          <strong className="text-sm font-bold text-slate-900">{scopeLabel}</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Điểm TB toàn lớp:</span>
          <strong className="text-base font-bold text-indigo-900">{scoreStats.avg}</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Giỏi (8.0 - 10):</span>
          <strong className="text-base font-bold text-emerald-800">{scoreStats.gioi} lượt</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Khá (6.5 - 7.9):</span>
          <strong className="text-base font-bold text-blue-800">{scoreStats.kha} lượt</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Dưới 5.0 (Cần hỗ trợ):</span>
          <strong className="text-base font-bold text-rose-800">{scoreStats.yeu} lượt</strong>
        </div>
      </div>

      {/* 2 Khối Thành tích & Cần bồi dưỡng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Khen ngợi */}
        <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
          <h4 className="text-xs sm:text-sm font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-emerald-600" />
            TUYÊN DƯƠNG HỌC TẬP & THÀNH TÍCH NỔI BẬT ({achievements.length})
          </h4>
          <ul className="text-xs space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {achievements.length === 0 ? (
              <li className="text-slate-500 italic py-2">Chưa ghi nhận thành tích đặc biệt trong kỳ này.</li>
            ) : (
              achievements.slice(0, 10).map(item => (
                <li key={item.id} className="bg-white p-2 rounded border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{item.studentNameSnapshot} (Tổ {item.groupNumberSnapshot})</span>
                    <span className="text-emerald-700">{item.score} điểm • {item.subjectName}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {item.achievement || item.assessmentName || 'Đạt điểm số cao trong bài kiểm tra'}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Cần hỗ trợ phụ đạo */}
        <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
          <h4 className="text-xs sm:text-sm font-bold text-rose-900 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            HỌC SINH CẦN QUAN TÂM BỒI DƯỠNG & PHỤ ĐẠO ({needSupport.length})
          </h4>
          <ul className="text-xs space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {needSupport.length === 0 ? (
              <li className="text-slate-500 italic py-2">Không có học sinh nào bị điểm dưới trung bình!</li>
            ) : (
              needSupport.slice(0, 10).map(item => (
                <li key={item.id} className="bg-white p-2 rounded border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{item.studentNameSnapshot} (Tổ {item.groupNumberSnapshot})</span>
                    <span className="text-rose-700">{item.score} điểm • {item.subjectName}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {item.supportNeeded || 'Cần GVBM và bạn cùng bàn hỗ trợ củng cố kiến thức'}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Bảng chi tiết điểm trung bình học tập từng học sinh */}
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-700" />
          BẢNG TỔNG HỢP KẾT QUẢ HỌC TẬP TỪNG HỌC SINH
        </h3>
        <table className="w-full text-left border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
              <th className="border border-slate-400 p-2 w-10">STT</th>
              <th className="border border-slate-400 p-2 w-20">Mã HS</th>
              <th className="border border-slate-400 p-2 text-left">Họ và Tên</th>
              <th className="border border-slate-400 p-2 w-14">Tổ</th>
              <th className="border border-slate-400 p-2 w-24">Số bài KT</th>
              <th className="border border-slate-400 p-2 w-24 font-bold text-indigo-950">ĐTB Kiểm tra</th>
              <th className="border border-slate-400 p-2 w-24">ĐTB Môn học</th>
              <th className="border border-slate-400 p-2 w-28">Đánh giá chung</th>
              <th className="border border-slate-400 p-2">Kế hoạch hỗ trợ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {filteredStudents.map((s, idx) => {
              const sLearning = activeLearningRecords.filter(l => l.studentId === s.id);
              const scoresArr = sLearning.map(l => l.score).filter(sc => typeof sc === 'number');
              const avgLearning = scoresArr.length > 0 
                ? (scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length).toFixed(1)
                : '—';

              const sScores = scores.filter(sc => sc.studentId === s.id);
              const subjectAvg = calculateOverallAverage(sScores);
              const subjectAvgDisplay = subjectAvg !== null ? subjectAvg.toFixed(1) : '—';

              return (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="border border-slate-400 p-2 text-center font-medium">{idx + 1}</td>
                  <td className="border border-slate-400 p-2 text-center font-mono font-semibold text-slate-700">
                    {s.studentCode}
                  </td>
                  <td className="border border-slate-400 p-2 font-bold text-slate-900">
                    {s.fullName}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold">
                    {s.groupNumber}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-semibold">
                    {scoresArr.length} bài
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-black text-sm text-indigo-900">
                    {avgLearning}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-slate-800">
                    {subjectAvgDisplay}
                  </td>
                  <td className="border border-slate-400 p-2 text-center">
                    {avgLearning !== '—' && parseFloat(avgLearning) >= 8.0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900">
                        Học tốt
                      </span>
                    ) : avgLearning !== '—' && parseFloat(avgLearning) >= 6.5 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-900">
                        Khá
                      </span>
                    ) : avgLearning !== '—' && parseFloat(avgLearning) >= 5.0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900">
                        Đạt
                      </span>
                    ) : avgLearning !== '—' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900">
                        Cần cố gắng
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="border border-slate-400 p-2 text-[11px] text-slate-700">
                    {scoresArr.some(sc => sc < 5.0) 
                      ? 'Kèm cặp thêm các môn có điểm dưới 5.0'
                      : 'Tiếp tục phát huy phong độ học tập'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function getAcademicExportData(
  students: Student[],
  learningRecords: LearningRecord[],
  scores: SubjectScore[],
  groupFilter: number | 'all'
) {
  let list = [...students];
  if (groupFilter !== 'all') {
    list = list.filter(s => s.groupNumber === groupFilter);
  }
  list.sort((a, b) => (a.stt || 0) - (b.stt || 0));

  const headers = [
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Tổ',
    'Số bài kiểm tra đã nhập',
    'Điểm TB kiểm tra',
    'Điểm TB môn học',
    'Đánh giá chung',
    'Kế hoạch bồi dưỡng',
  ];

  const rows = list.map((s, idx) => {
    const sLearning = learningRecords.filter(l => l.studentId === s.id);
    const scoresArr = sLearning.map(l => l.score).filter(sc => typeof sc === 'number');
    const avgLearning = scoresArr.length > 0 
      ? (scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length).toFixed(1)
      : '';

    const sScores = scores.filter(sc => sc.studentId === s.id);
    const subjectAvg = calculateOverallAverage(sScores);
    const subjectAvgDisplay = subjectAvg !== null ? subjectAvg.toFixed(1) : '';

    let rating = '—';
    if (avgLearning && parseFloat(avgLearning) >= 8.0) rating = 'Học tốt';
    else if (avgLearning && parseFloat(avgLearning) >= 6.5) rating = 'Khá';
    else if (avgLearning && parseFloat(avgLearning) >= 5.0) rating = 'Đạt';
    else if (avgLearning) rating = 'Cần cố gắng';

    return [
      idx + 1,
      s.studentCode,
      s.fullName,
      `Tổ ${s.groupNumber}`,
      scoresArr.length,
      avgLearning,
      subjectAvgDisplay,
      rating,
      scoresArr.some(sc => sc < 5.0) ? 'Kèm cặp thêm các môn dưới 5.0' : 'Duy trì phong độ tốt',
    ];
  });

  return [headers, ...rows];
}

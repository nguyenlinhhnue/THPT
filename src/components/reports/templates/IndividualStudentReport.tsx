import React from 'react';
import { Student, CLASS_ROLES } from '../../../types/student';
import { WeeklyPointTransaction } from '../../../types/pointTransaction';
import { LearningRecord } from '../../../types/learning';
import { SubjectScore, THPT_SUBJECTS } from '../../../types/score';
import { DEFAULT_CLASSIFICATION_CONFIG } from '../../../types/classification';
import { calculateClassifications } from '../../../services/classificationService';
import { calculateOverallAverage } from '../../../utils/calculations';
import { User, Calendar, Award, AlertCircle, BookOpen, MessageSquare } from 'lucide-react';

interface IndividualStudentReportProps {
  student: Student;
  transactions: WeeklyPointTransaction[];
  learningRecords: LearningRecord[];
  scores: SubjectScore[];
  selectedSemester: string;
}

export function IndividualStudentReport({
  student,
  transactions,
  learningRecords,
  scores,
  selectedSemester,
}: IndividualStudentReportProps) {
  // Lọc dữ liệu của riêng học sinh này (chỉ lấy giao dịch hợp lệ status !== 'voided')
  const studentTx = React.useMemo(() => {
    return transactions
      .filter(t => t.studentId === student.id && t.status !== 'voided')
      .sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
  }, [transactions, student.id]);

  const violations = React.useMemo(() => {
    return studentTx.filter(t => t.type === 'minus');
  }, [studentTx]);

  const bonuses = React.useMemo(() => {
    return studentTx.filter(t => t.type === 'plus');
  }, [studentTx]);

  const studentLearning = React.useMemo(() => {
    return learningRecords
      .filter(l => l.studentId === student.id)
      .sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
  }, [learningRecords, student.id]);

  const studentScores = React.useMemo(() => {
    return scores.filter(s => s.studentId === student.id);
  }, [scores, student.id]);

  // Diễn biến điểm theo từng tuần
  const weeklyPointProgression = React.useMemo(() => {
    const weeks: { weekNumber: number; plus: number; minus: number; net: number }[] = [];
    const maxWeek = Math.max(1, ...studentTx.map(t => t.weekNumber || 1));

    for (let w = 1; w <= Math.min(maxWeek, 18); w++) {
      const wTx = studentTx.filter(t => t.weekNumber === w);
      const plus = wTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
      const minus = wTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
      weeks.push({
        weekNumber: w,
        plus,
        minus,
        net: Math.max(0, 100 + plus - minus),
      });
    }
    return weeks;
  }, [studentTx]);

  // Điểm các tháng trong học kỳ
  const monthlySummary = React.useMemo(() => {
    const months = ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01'];
    return months.map(m => {
      const mTx = studentTx.filter(t => t.date && t.date.startsWith(m));
      const p = mTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
      const mi = mTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
      const mScore = Math.max(0, 100 + p - mi);
      const label = `Tháng ${parseInt(m.split('-')[1], 10)}`;

      let tier = 'Tốt';
      if (mScore < 65) tier = 'Chưa đạt';
      else if (mScore < 80) tier = 'Đạt';
      else if (mScore < 90) tier = 'Khá';

      return {
        monthKey: m,
        label,
        score: mTx.length > 0 ? mScore : 100,
        violations: mTx.filter(t => t.type === 'minus').length,
        tier,
      };
    });
  }, [studentTx]);

  // Xếp loại tổng thể học kỳ
  const semesterClassification = React.useMemo(() => {
    const config = { ...DEFAULT_CLASSIFICATION_CONFIG, classId: 'default' };
    const res = calculateClassifications({
      students: [student],
      transactions: studentTx,
      learningRecords: studentLearning,
      config,
      periodType: 'semester',
      selectedWeek: 1,
      selectedMonth: '2026-09',
      selectedSemester: (selectedSemester as any) || 'HK1',
    });
    return res[0] || null;
  }, [student, studentTx, studentLearning, selectedSemester]);

  const overallAcademicAvg = calculateOverallAverage(studentScores);
  const roleObj = CLASS_ROLES.find(r => r.value === student.role);

  return (
    <div className="space-y-6">
      {/* Khối 1: Thông tin học sinh */}
      <div className="border border-slate-400 rounded-lg p-3 bg-slate-50 text-xs">
        <h3 className="font-bold text-slate-900 uppercase mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
          <User className="w-4 h-4 text-teal-800" />
          I. THÔNG TIN HỌC SINH
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800">
          <div>
            <span className="text-slate-500 block text-[11px]">Họ và tên:</span>
            <strong className="text-sm font-bold text-slate-950">{student.fullName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Mã học sinh:</span>
            <strong className="font-mono text-slate-900 font-bold">{student.studentCode}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Tổ sinh hoạt:</span>
            <strong className="text-slate-900 font-bold">Tổ {student.groupNumber}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Chức vụ trong lớp:</span>
            <strong className="text-slate-900 font-bold">{roleObj?.label || 'Thành viên'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Ngày sinh:</span>
            <span>{student.dateOfBirth || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Giới tính:</span>
            <span>{student.gender === 'nam' ? 'Nam' : 'Nữ'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Số điện thoại PH:</span>
            <span>{student.parentPhone || student.phone || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Trạng thái học tập:</span>
            <span className="text-emerald-800 font-semibold">Đang học</span>
          </div>
        </div>
      </div>

      {/* Khối 2: Tổng hợp điểm rèn luyện từng tuần */}
      <div>
        <h3 className="font-bold text-slate-900 uppercase mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
          <Calendar className="w-4 h-4 text-teal-800" />
          II. DIỄN BIẾN ĐIỂM RÈN LUYỆN THEO TỪNG TUẦN
        </h3>
        <div className="overflow-x-auto border border-slate-400 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
                <th className="border border-slate-400 p-2">Chỉ số</th>
                {weeklyPointProgression.map(w => (
                  <th key={w.weekNumber} className="border border-slate-400 p-2 min-w-[50px]">
                    Tuần {w.weekNumber}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-mono text-center">
              <tr>
                <td className="border border-slate-400 p-2 font-sans font-semibold text-left text-slate-700">
                  Cộng (+)
                </td>
                {weeklyPointProgression.map(w => (
                  <td key={w.weekNumber} className="border border-slate-400 p-2 text-teal-700 font-bold">
                    {w.plus > 0 ? `+${w.plus}` : '0'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-400 p-2 font-sans font-semibold text-left text-slate-700">
                  Trừ (-)
                </td>
                {weeklyPointProgression.map(w => (
                  <td key={w.weekNumber} className="border border-slate-400 p-2 text-rose-700 font-bold">
                    {w.minus > 0 ? `-${w.minus}` : '0'}
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-black">
                <td className="border border-slate-400 p-2 font-sans text-left text-slate-900">
                  Tổng điểm tuần
                </td>
                {weeklyPointProgression.map(w => (
                  <td key={w.weekNumber} className="border border-slate-400 p-2 text-slate-950 text-sm">
                    {w.net}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Khối 3: Kết quả theo tháng */}
      <div>
        <h3 className="font-bold text-slate-900 uppercase mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
          <Award className="w-4 h-4 text-teal-800" />
          III. TỔNG HỢP THEO THÁNG
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {monthlySummary.map(m => (
            <div key={m.monthKey} className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-center">
              <span className="font-bold text-slate-700 block mb-1">{m.label}</span>
              <span className="text-xl font-black text-slate-900 block">{m.score} đ</span>
              <div className="mt-1 flex items-center justify-center gap-1 text-[11px]">
                <span className="text-rose-700 font-semibold">{m.violations} vi phạm</span>
                <span>•</span>
                <span className="font-bold text-emerald-800">{m.tier}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Khối 4: Lịch sử vi phạm kỷ luật */}
      <div>
        <h3 className="font-bold text-slate-900 uppercase mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-rose-700" />
          IV. GHI NHẬN VI PHẠM KỶ LUẬT & NỀ NẾP ({violations.length} LƯỢT)
        </h3>
        <table className="w-full text-left border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
              <th className="border border-slate-400 p-2 w-10">STT</th>
              <th className="border border-slate-400 p-2 w-24">Ngày</th>
              <th className="border border-slate-400 p-2 w-16">Tuần</th>
              <th className="border border-slate-400 p-2 text-left">Nội quy vi phạm</th>
              <th className="border border-slate-400 p-2 w-20 text-rose-800">Điểm trừ</th>
              <th className="border border-slate-400 p-2">Lý do chi tiết & Biện pháp khắc phục</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {violations.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-slate-400 p-4 text-center text-emerald-800 font-semibold italic">
                  ✓ Học sinh có ý thức rèn luyện rất tốt, chưa từng vi phạm nề nếp trong kỳ báo cáo.
                </td>
              </tr>
            ) : (
              violations.map((v, idx) => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="border border-slate-400 p-2 text-center font-medium">{idx + 1}</td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    {v.date ? v.date.split('-').reverse().join('/') : '—'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center">Tuần {v.weekNumber}</td>
                  <td className="border border-slate-400 p-2 font-semibold text-slate-900">
                    {v.ruleSnapshot?.label || v.reason || 'Vi phạm'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-rose-700">
                    -{v.score} đ
                  </td>
                  <td className="border border-slate-400 p-2 text-[11px] text-slate-600">
                    {v.note || v.reason || 'Đã nhắc nhở kiểm điểm trước lớp'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Khối 5: Kết quả học tập */}
      <div>
        <h3 className="font-bold text-slate-900 uppercase mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
          <BookOpen className="w-4 h-4 text-indigo-800" />
          V. KẾT QUẢ HỌC TẬP & ĐIỂM KIỂM TRA MÔN
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
            <span className="font-bold text-slate-900 block mb-1">Ghi nhận học tập các tuần gần đây</span>
            <ul className="text-xs space-y-1 max-h-40 overflow-y-auto pr-1">
              {studentLearning.length === 0 ? (
                <li className="text-slate-500 italic py-2 text-center">Chưa có bản ghi học tập tuần nào.</li>
              ) : (
                studentLearning.map(l => (
                  <li key={l.id} className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 mr-2">{l.subjectName}</span>
                      <span className="text-slate-500 text-[11px]">{l.assessmentName}</span>
                    </div>
                    <span className={`font-black text-sm ${l.score >= 8 ? 'text-emerald-700' : l.score >= 5 ? 'text-indigo-700' : 'text-rose-700'}`}>
                      {l.score} đ
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 block mb-1">Điểm trung bình các môn học (ĐTB Học tập)</span>
              <div className="text-3xl font-black text-indigo-950 mt-2">
                {overallAcademicAvg !== null ? overallAcademicAvg.toFixed(2) : 'Chưa đủ điểm môn'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Đã nhập điểm cho {studentScores.length} / {THPT_SUBJECTS.length} môn học theo chương trình GDPT.
              </p>
            </div>
            <div className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 mt-2">
              <strong>Ghi nhận học lực: </strong>
              {overallAcademicAvg !== null && overallAcademicAvg >= 8.0 
                ? 'Học lực Tốt/Giỏi' 
                : overallAcademicAvg !== null && overallAcademicAvg >= 6.5 
                ? 'Học lực Khá' 
                : overallAcademicAvg !== null 
                ? 'Học lực Đạt' 
                : 'Đang tiếp tục cập nhật'}
            </div>
          </div>
        </div>
      </div>

      {/* Khối 6: Xếp loại & Nhận xét của GVCN */}
      <div className="border-2 border-slate-800 rounded-lg p-4 bg-slate-50 text-xs">
        <h3 className="font-black text-slate-950 uppercase mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
          <MessageSquare className="w-4 h-4 text-teal-800" />
          VI. ĐÁNH GIÁ & XẾP LOẠI TOÀN DIỆN CỦA GIÁO VIÊN CHỦ NHIỆM
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="bg-white p-2.5 rounded border border-slate-300 text-center">
            <span className="text-slate-500 block text-[11px]">Điểm rèn luyện kỳ:</span>
            <span className="text-xl font-black text-slate-950">
              {semesterClassification?.netScore || 100} đ
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-300 text-center">
            <span className="text-slate-500 block text-[11px]">Tổng số lần vi phạm:</span>
            <span className="text-xl font-black text-rose-700">
              {violations.length} lần
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-300 text-center">
            <span className="text-slate-500 block text-[11px]">Mức xếp loại rèn luyện:</span>
            <span className="text-xl font-black text-emerald-800 uppercase">
              {semesterClassification?.rankName || 'Tốt'}
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded border border-slate-300">
          <span className="font-bold text-slate-900 block mb-1">Nhận xét chi tiết của GVCN:</span>
          <p className="text-xs text-slate-800 leading-relaxed italic">
            {violations.length === 0 
              ? `Em ${student.fullName} có tinh thần tự giác cao, chấp hành nghiêm túc nội quy nhà trường và nề nếp của lớp. Tích cực tham gia các hoạt động tập thể và hỗ trợ bạn bè trong học tập.`
              : `Em ${student.fullName} nhìn chung có cố gắng, tuy nhiên trong kỳ còn để xảy ra một số lần vi phạm nề nếp (${violations.length} lần). Cần chú ý rút kinh nghiệm, chấp hành nghiêm quy định về trang phục và giờ giấc.`}
            {overallAcademicAvg !== null && overallAcademicAvg >= 8.0 
              ? ' Kết quả học tập xuất sắc, cần tiếp tục phát huy trong giai đoạn tiếp theo.' 
              : ' Cần phân bổ thêm thời gian ôn tập để đạt kết quả học tập cao hơn.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function getIndividualExportData(
  student: Student,
  transactions: WeeklyPointTransaction[],
  learningRecords: LearningRecord[],
  scores: SubjectScore[]
) {
  const studentTx = transactions.filter(t => t.studentId === student.id && t.status !== 'voided');
  const violations = studentTx.filter(t => t.type === 'minus');
  const plus = studentTx.filter(t => t.type === 'plus').reduce((sum, t) => sum + (t.score || 0), 0);
  const minus = studentTx.filter(t => t.type === 'minus').reduce((sum, t) => sum + (t.score || 0), 0);
  const netScore = Math.max(0, 100 + plus - minus);

  const studentLearning = learningRecords.filter(l => l.studentId === student.id);
  const studentScores = scores.filter(s => s.studentId === student.id);
  const overallAcademicAvg = calculateOverallAverage(studentScores);

  const rows = [
    ['HỒ SƠ RÈN LUYỆN VÀ HỌC TẬP CÁ NHÂN HỌC SINH', ''],
    ['Họ và tên', student.fullName],
    ['Mã học sinh', student.studentCode],
    ['Ngày sinh', student.dateOfBirth || ''],
    ['Giới tính', student.gender === 'nam' ? 'Nam' : 'Nữ'],
    ['Tổ', `Tổ ${student.groupNumber}`],
    ['Chức vụ', student.role || 'Học sinh'],
    ['SĐT liên hệ', student.parentPhone || student.phone || ''],
    ['', ''],
    ['ĐIỂM RÈN LUYỆN & NỀ NẾP', ''],
    ['Điểm rèn luyện tổng hợp', netScore],
    ['Tổng điểm cộng (+)', plus],
    ['Tổng điểm trừ (-)', minus],
    ['Tổng số lần vi phạm', violations.length],
    ['', ''],
    ['KẾT QUẢ HỌC TẬP', ''],
    ['Số bài kiểm tra đã ghi nhận', studentLearning.length],
    ['Điểm TB môn học', overallAcademicAvg !== null ? overallAcademicAvg.toFixed(2) : 'Chưa có'],
    ['', ''],
    ['DANH SÁCH VI PHẠM KỶ LUẬT', ''],
    ['Ngày', 'Tuần', 'Nội dung vi phạm', 'Điểm trừ'],
    ...violations.map(v => [
      v.date || '',
      `Tuần ${v.weekNumber}`,
      v.ruleSnapshot?.label || v.reason || 'Vi phạm nề nếp',
      `-${v.score}`,
    ]),
  ];

  return rows;
}

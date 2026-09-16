import React, { useState } from 'react';
import { useClass } from '../../context/ClassContext';
import { useUI } from '../../context/UIContext';
import { THPT_SUBJECTS, Semester, SubjectScore } from '../../types/score';
import { saveSubjectScore } from '../../services/scoreService';
import { calculateSubjectAverage } from '../../utils/calculations';
import { EmptyState } from '../common/EmptyState';
import { 
  GraduationCap, 
  Lock, 
  Save, 
  Calculator, 
  AlertCircle,
  Search,
  CheckCircle2
} from 'lucide-react';

export function ScoresView() {
  const { 
    classroom, 
    students, 
    scores, 
    isDataLocked, 
    selectedSemester, 
    setSelectedSemester 
  } = useClass();
  const { showToast } = useUI();

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('toan');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingScoreMap, setEditingScoreMap] = useState<{ [studentId: string]: Partial<SubjectScore> }>({});
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);

  const currentSubject = THPT_SUBJECTS.find(s => s.code === selectedSubjectCode) || THPT_SUBJECTS[0];

  const filteredStudents = students.filter(
    s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lấy bản ghi điểm hiện tại của học sinh theo môn và học kỳ đang chọn
  const getExistingScore = (studentId: string): SubjectScore | undefined => {
    return scores.find(
      s => s.studentId === studentId && 
           s.subjectCode === selectedSubjectCode && 
           s.semester === selectedSemester
    );
  };

  const handleScoreChange = (studentId: string, field: 'tx1' | 'tx2' | 'tx3' | 'tx4' | 'gk' | 'ck', valStr: string) => {
    if (isDataLocked) return;

    let val: number | null = null;
    if (valStr.trim() !== '') {
      const num = parseFloat(valStr);
      if (isNaN(num) || num < 0 || num > 10) return;
      val = Math.round(num * 10) / 10;
    }

    setEditingScoreMap(prev => {
      const current = prev[studentId] || getExistingScore(studentId) || {};
      return {
        ...prev,
        [studentId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  const handleSaveScore = async (studentId: string) => {
    if (!classroom?.id) return;
    if (isDataLocked) {
      showToast('error', 'Sổ điểm đã khóa', 'Vui lòng mở khóa sổ trước khi lưu điểm.');
      return;
    }

    const editData = editingScoreMap[studentId];
    if (!editData) return;

    try {
      setSavingStudentId(studentId);
      const existing = getExistingScore(studentId);

      await saveSubjectScore({
        classId: classroom.id,
        studentId,
        subjectCode: selectedSubjectCode,
        subjectName: currentSubject.name,
        semester: selectedSemester,
        schoolYear: classroom.schoolYear,
        tx1: editData.tx1 !== undefined ? editData.tx1 : existing?.tx1 ?? null,
        tx2: editData.tx2 !== undefined ? editData.tx2 : existing?.tx2 ?? null,
        tx3: editData.tx3 !== undefined ? editData.tx3 : existing?.tx3 ?? null,
        tx4: editData.tx4 !== undefined ? editData.tx4 : existing?.tx4 ?? null,
        gk: editData.gk !== undefined ? editData.gk : existing?.gk ?? null,
        ck: editData.ck !== undefined ? editData.ck : existing?.ck ?? null,
      });

      // Clear local dirty edit
      setEditingScoreMap(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });

      showToast('success', 'Đã lưu điểm môn ' + currentSubject.name);
    } catch (err: any) {
      console.error('Save score error:', err);
      showToast('error', 'Lỗi lưu điểm', err.message);
    } finally {
      setSavingStudentId(null);
    }
  };

  if (students.length === 0) {
    return (
      <EmptyState
        title="Chưa có danh sách học sinh để vào điểm"
        description="Thầy/Cô vui lòng thêm học sinh ở tab Hồ sơ Học sinh trước khi nhập điểm bộ môn."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Subject & Semester Selector Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Sổ Điểm Môn: {currentSubject.name}
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {selectedSemester}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quy chế THPT: ĐTB môn được tính theo công thức TT 22 từ điểm gốc (TX: hệ số 1, GK: hệ số 2, CK: hệ số 3)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Chọn Học kỳ */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            {(['HK1', 'HK2', 'CaNam'] as Semester[]).map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedSemester === sem
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sem === 'CaNam' ? 'Cả năm' : sem}
              </button>
            ))}
          </div>

          {/* Chọn Môn Học */}
          <select
            value={selectedSubjectCode}
            onChange={(e) => {
              setSelectedSubjectCode(e.target.value);
              setEditingScoreMap({});
            }}
            className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800"
          >
            {THPT_SUBJECTS.map((sub) => (
              <option key={sub.code} value={sub.code}>
                Môn: {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lock Notice if applicable */}
      {isDataLocked && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Sổ điểm đang bị khóa:</strong> Không thể chỉnh sửa hoặc nhập thêm điểm. Vui lòng mở khóa ở góc trên màn hình để thao tác.
          </span>
        </div>
      )}

      {/* Search student */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm học sinh theo tên hoặc mã..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-hidden"
        />
      </div>

      {/* Score Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">STT</th>
                <th className="py-3 px-3 w-20">Mã HS</th>
                <th className="py-3 px-4 min-w-[160px]">Họ và Tên</th>
                <th className="py-3 px-2 w-14 text-center">Tổ</th>
                <th className="py-3 px-2 w-16 text-center">TX 1</th>
                <th className="py-3 px-2 w-16 text-center">TX 2</th>
                <th className="py-3 px-2 w-16 text-center">TX 3</th>
                <th className="py-3 px-2 w-16 text-center">TX 4</th>
                <th className="py-3 px-2 w-20 text-center bg-indigo-50/40 text-indigo-800">Giữa kỳ (x2)</th>
                <th className="py-3 px-2 w-20 text-center bg-indigo-50/40 text-indigo-800">Cuối kỳ (x3)</th>
                <th className="py-3 px-3 w-20 text-center bg-slate-100 font-black text-slate-800">ĐTB Môn</th>
                <th className="py-3 px-3 w-16 text-center">Lưu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredStudents.map((student, idx) => {
                const existing = getExistingScore(student.id);
                const dirty = editingScoreMap[student.id];
                const currentData = { ...existing, ...dirty };
                const isDirty = !!dirty;

                // Tính toán ĐTB môn tức thì từ dữ liệu hiện hành
                const calculatedAvg = calculateSubjectAverage(currentData);

                return (
                  <tr 
                    key={student.id}
                    className={`hover:bg-slate-50/70 transition-colors ${isDirty ? 'bg-amber-50/30' : ''}`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">
                      {student.studentCode}
                    </td>

                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {student.fullName}
                    </td>

                    <td className="py-2.5 px-2 text-center font-semibold text-slate-600">
                      {student.groupNumber}
                    </td>

                    {/* Điểm Thường Xuyên 1 */}
                    <td className="py-2.5 px-1.5 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        disabled={isDataLocked}
                        value={currentData.tx1 ?? ''}
                        onChange={(e) => handleScoreChange(student.id, 'tx1', e.target.value)}
                        className="w-12 py-1 text-center font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-50"
                      />
                    </td>

                    {/* Điểm Thường Xuyên 2 */}
                    <td className="py-2.5 px-1.5 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        disabled={isDataLocked}
                        value={currentData.tx2 ?? ''}
                        onChange={(e) => handleScoreChange(student.id, 'tx2', e.target.value)}
                        className="w-12 py-1 text-center font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-50"
                      />
                    </td>

                    {/* Điểm Thường Xuyên 3 */}
                    <td className="py-2.5 px-1.5 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        disabled={isDataLocked}
                        value={currentData.tx3 ?? ''}
                        onChange={(e) => handleScoreChange(student.id, 'tx3', e.target.value)}
                        className="w-12 py-1 text-center font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-50"
                      />
                    </td>

                    {/* Điểm Thường Xuyên 4 */}
                    <td className="py-2.5 px-1.5 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        disabled={isDataLocked}
                        value={currentData.tx4 ?? ''}
                        onChange={(e) => handleScoreChange(student.id, 'tx4', e.target.value)}
                        className="w-12 py-1 text-center font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-50"
                      />
                    </td>

                    {/* Giữa kỳ (hệ số 2) */}
                    <td className="py-2.5 px-1.5 text-center bg-indigo-50/20">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        disabled={isDataLocked}
                        value={currentData.gk ?? ''}
                        onChange={(e) => handleScoreChange(student.id, 'gk', e.target.value)}
                        className="w-14 py-1 text-center font-bold text-indigo-900 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-50"
                      />
                    </td>

                    {/* Cuối kỳ (hệ số 3) */}
                    <td className="py-2.5 px-1.5 text-center bg-indigo-50/20">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        disabled={isDataLocked}
                        value={currentData.ck ?? ''}
                        onChange={(e) => handleScoreChange(student.id, 'ck', e.target.value)}
                        className="w-14 py-1 text-center font-bold text-indigo-900 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-50"
                      />
                    </td>

                    {/* ĐTB Môn tính tự động */}
                    <td className="py-2.5 px-3 text-center bg-slate-100">
                      <span className={`inline-block font-black text-sm px-2 py-0.5 rounded-md ${
                        calculatedAvg === null
                          ? 'text-slate-400'
                          : calculatedAvg >= 8.0
                          ? 'text-emerald-700 bg-emerald-50'
                          : calculatedAvg >= 6.5
                          ? 'text-blue-700 bg-blue-50'
                          : calculatedAvg >= 5.0
                          ? 'text-amber-700 bg-amber-50'
                          : 'text-rose-700 bg-rose-50'
                      }`}>
                        {calculatedAvg !== null ? calculatedAvg.toFixed(1) : '—'}
                      </span>
                    </td>

                    {/* Nút Lưu điểm từng HS */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleSaveScore(student.id)}
                        disabled={!isDirty || isDataLocked || savingStudentId === student.id}
                        className={`p-1.5 rounded-lg transition-all ${
                          isDirty
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                        title={isDirty ? 'Lưu điểm em này vào Firebase' : 'Chưa có thay đổi'}
                      >
                        {savingStudentId === student.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

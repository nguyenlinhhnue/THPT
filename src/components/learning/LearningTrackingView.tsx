import React, { useState, useMemo } from 'react';
import { useClass } from '../../context/ClassContext';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { THPT_SUBJECTS, Semester } from '../../types/score';
import { Student } from '../../types/student';
import { 
  LearningRecord, 
  AssessmentType, 
  ASSESSMENT_TYPE_LABELS, 
  ASSESSMENT_TYPE_BADGES,
  CreateLearningRecordInput,
  UpdateLearningRecordInput
} from '../../types/learning';
import { 
  createLearningRecord, 
  updateLearningRecord, 
  deleteLearningRecord, 
  calculateLearningStats 
} from '../../services/learningService';
import { LearningStatsCards } from './LearningStatsCards';
import { LearningCharts } from './LearningCharts';
import { LearningRecordModal } from './LearningRecordModal';
import { LearningStudentDetailModal } from './LearningStudentDetailModal';
import { ScoresView } from '../scores/ScoresView';
import { EmptyState } from '../common/EmptyState';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Lock, 
  Calendar, 
  Trash2, 
  Edit3, 
  Award, 
  HelpCircle, 
  MessageSquareQuote, 
  Scale, 
  User, 
  Eye, 
  Layers, 
  Table, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export function LearningTrackingView() {
  const { 
    classroom, 
    students, 
    learningRecords, 
    isDataLocked, 
    selectedSemester, 
    setSelectedSemester,
    selectedWeek,
    setSelectedWeek
  } = useClass();
  const { showToast, openConfirmDialog } = useUI();
  const { currentUser, teacherProfile } = useAuth();

  // Mode: 'assessments' (danh sách bài kiểm tra & theo dõi), 'students_overview' (hồ sơ từng học sinh), 'matrix' (sổ điểm ma trận bộ môn)
  const [activeSubTab, setActiveSubTab] = useState<'assessments' | 'students_overview' | 'matrix'>('assessments');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudentId, setFilterStudentId] = useState<string>('all');
  const [filterSubjectCode, setFilterSubjectCode] = useState<string>('all');
  const [filterAssessmentType, setFilterAssessmentType] = useState<string>('all');
  const [filterWeek, setFilterWeek] = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<Semester | 'all'>('all');
  const [hasAchievementOnly, setHasAchievementOnly] = useState(false);
  const [hasSupportOnly, setHasSupportOnly] = useState(false);

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LearningRecord | null>(null);
  const [preselectedStudentId, setPreselectedStudentId] = useState<string | undefined>(undefined);
  
  // Detail Modal State
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Danh sách các tháng có dữ liệu
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    learningRecords.forEach(r => {
      if (r.month) months.add(r.month);
    });
    return Array.from(months).sort();
  }, [learningRecords]);

  // Bộ lọc dữ liệu đa chiều (Đảm bảo không tính trùng lặp)
  const filteredRecords = useMemo(() => {
    // Sử dụng Map để loại bỏ bản ghi trùng ID (nếu có)
    const uniqueMap = new Map<string, LearningRecord>();
    learningRecords.forEach(r => {
      if (r && r.id) uniqueMap.set(r.id, r);
    });

    return Array.from(uniqueMap.values()).filter(r => {
      // 1. Tìm kiếm theo tên học sinh, mã HS, tên bài, nhận xét
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchStudent = (r.studentNameSnapshot || '').toLowerCase().includes(query) ||
                             (r.studentCodeSnapshot || '').toLowerCase().includes(query);
        const matchAssessment = (r.assessmentName || '').toLowerCase().includes(query) ||
                                (r.subjectName || '').toLowerCase().includes(query) ||
                                (r.feedback || '').toLowerCase().includes(query) ||
                                (r.achievement || '').toLowerCase().includes(query) ||
                                (r.supportNeeded || '').toLowerCase().includes(query);
        if (!matchStudent && !matchAssessment) return false;
      }

      // 2. Lọc theo học sinh
      if (filterStudentId !== 'all' && r.studentId !== filterStudentId) return false;

      // 3. Lọc theo môn học
      if (filterSubjectCode !== 'all' && r.subjectCode !== filterSubjectCode) return false;

      // 4. Lọc theo loại kiểm tra
      if (filterAssessmentType !== 'all' && r.assessmentType !== filterAssessmentType) return false;

      // 5. Lọc theo tuần
      if (filterWeek !== 'all' && r.weekNumber !== filterWeek) return false;

      // 6. Lọc theo tháng
      if (filterMonth !== 'all' && r.month !== filterMonth) return false;

      // 7. Lọc theo học kỳ
      if (filterSemester !== 'all' && r.semester !== filterSemester) return false;

      // 8. Lọc chỉ có thành tích
      if (hasAchievementOnly && (!r.achievement || r.achievement.trim() === '')) return false;

      // 9. Lọc chỉ có nội dung cần hỗ trợ
      if (hasSupportOnly && (!r.supportNeeded || r.supportNeeded.trim() === '')) return false;

      return true;
    });
  }, [
    learningRecords, 
    searchTerm, 
    filterStudentId, 
    filterSubjectCode, 
    filterAssessmentType, 
    filterWeek, 
    filterMonth, 
    filterSemester,
    hasAchievementOnly,
    hasSupportOnly
  ]);

  // Thống kê Realtime dựa trên dữ liệu đã lọc
  const stats = useMemo(() => {
    return calculateLearningStats(filteredRecords);
  }, [filteredRecords]);

  // Xử lý Thêm / Cập nhật bản ghi học tập
  const handleSaveRecord = async (inputData: CreateLearningRecordInput | UpdateLearningRecordInput) => {
    if (!classroom?.id) return;
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Vui lòng mở khóa trước khi thao tác.');
      return;
    }

    const teacherEmail = currentUser?.email || 'GVCN';
    const teacherName = teacherProfile?.displayName || 'Giáo viên Chủ nhiệm';

    if (editingRecord) {
      await updateLearningRecord(
        editingRecord.id, 
        inputData as UpdateLearningRecordInput, 
        editingRecord, 
        teacherEmail
      );
      showToast('success', 'Đã cập nhật bài kiểm tra', 'Thống kê đã được cập nhật thời gian thực.');
    } else {
      const createInput = inputData as CreateLearningRecordInput;
      const targetStudent = students.find(s => s.id === createInput.studentId);
      if (!targetStudent) throw new Error('Không tìm thấy học sinh được chọn.');

      await createLearningRecord(
        classroom.id, 
        targetStudent, 
        createInput, 
        teacherEmail, 
        teacherName
      );
      showToast('success', 'Đã lưu điểm kiểm tra', 'Điểm số và thống kê đã được cập nhật thời gian thực.');
    }
  };

  // Xử lý Xóa bản ghi học tập
  const handleDeleteRecord = (record: LearningRecord) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Vui lòng mở khóa trước khi thao tác.');
      return;
    }

    openConfirmDialog({
      title: 'Xóa bài kiểm tra này?',
      message: `Bạn có chắc chắn muốn xóa bài kiểm tra "${record.assessmentName}" (${record.score}đ) của học sinh ${record.studentNameSnapshot}? ${
        record.hasConductBonus ? 'Lưu ý: Điểm rèn luyện liên kết cũng sẽ tự động được dọn dẹp để đảm bảo toàn vẹn dữ liệu.' : ''
      }`,
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Giữ lại',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteLearningRecord(record.id, record, true);
          showToast('info', 'Đã xóa bản ghi học tập', 'Thống kê liên quan đã được tính toán lại realtime.');
        } catch (err: any) {
          console.error('Delete learning record error:', err);
          showToast('error', 'Không thể xóa', err.message);
        }
      },
    });
  };

  const handleOpenAddModal = (studentId?: string) => {
    setEditingRecord(null);
    setPreselectedStudentId(studentId);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditModal = (rec: LearningRecord) => {
    setEditingRecord(rec);
    setIsRecordModalOpen(true);
  };

  const handleOpenStudentDetail = (student: Student) => {
    setDetailStudent(student);
    setIsDetailModalOpen(true);
  };

  // Đặt lại bộ lọc
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStudentId('all');
    setFilterSubjectCode('all');
    setFilterAssessmentType('all');
    setFilterWeek('all');
    setFilterMonth('all');
    setFilterSemester('all');
    setHasAchievementOnly(false);
    setHasSupportOnly(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Role Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              THEO DÕI HỌC TẬP
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Chỉ GVCN quản lý
            </span>
            {isDataLocked && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Lock className="w-3.5 h-3.5" />
                Đã khóa dữ liệu
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Theo dõi chi tiết điểm kiểm tra, môn học, ngày tháng, nhận xét, thành tích và nội dung cần hỗ trợ. Tự động tính toán thống kê thời gian thực và liên kết minh bạch với hệ thống rèn luyện thi đua.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            disabled={isDataLocked}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            + Nhập điểm kiểm tra mới
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('assessments')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'assessments'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Layers className="w-4 h-4" />
            Bảng theo dõi bài kiểm tra ({filteredRecords.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('students_overview')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'students_overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <User className="w-4 h-4" />
            Hồ sơ học tập từng học sinh ({students.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Table className="w-4 h-4" />
            Sổ điểm ma trận bộ môn (TX/GK/CK)
          </button>
        </div>
      </div>

      {/* When SubTab is Matrix: Show the traditional ScoresView component directly */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <ScoresView />
        </div>
      )}

      {/* When SubTab is Assessments or Students Overview: Show Stats, Charts & Filters */}
      {activeSubTab !== 'matrix' && (
        <>
          {/* 1. Realtime Statistics Cards */}
          <LearningStatsCards stats={stats} />

          {/* 2. Visual Charts (Distribution & Trend) */}
          <LearningCharts records={filteredRecords} stats={stats} />

          {/* 3. Comprehensive Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Tìm học sinh, môn, bài kiểm tra, nhận xét..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Quick Filter Badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => setHasAchievementOnly(!hasAchievementOnly)}
                  className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    hasAchievementOnly
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Có thành tích ({stats.totalAchievements})
                </button>

                <button
                  type="button"
                  onClick={() => setHasSupportOnly(!hasSupportOnly)}
                  className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    hasSupportOnly
                      ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                  Cần phụ đạo ({stats.totalSupportNeeded})
                </button>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-xs underline"
                >
                  Đặt lại lọc
                </button>
              </div>
            </div>

            {/* Dropdown Selectors Grid (Multi-dimensional Tracking) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
              {/* Theo Học sinh */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Học sinh</label>
                <select
                  value={filterStudentId}
                  onChange={e => setFilterStudentId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  <option value="all">Tất cả học sinh ({students.length})</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.stt}. {s.fullName} (Tổ {s.groupNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Theo Môn học */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Môn học</label>
                <select
                  value={filterSubjectCode}
                  onChange={e => setFilterSubjectCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  <option value="all">Tất cả môn học</option>
                  {THPT_SUBJECTS.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theo Loại kiểm tra */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Loại kiểm tra</label>
                <select
                  value={filterAssessmentType}
                  onChange={e => setFilterAssessmentType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  <option value="all">Tất cả loại bài</option>
                  {Object.entries(ASSESSMENT_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theo Tuần */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tuần học</label>
                <select
                  value={filterWeek}
                  onChange={e => setFilterWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  <option value="all">Tất cả tuần</option>
                  {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>
                      Tuần {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theo Tháng */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tháng</label>
                <select
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  <option value="all">Tất cả tháng</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theo Học kỳ */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Học kỳ</label>
                <select
                  value={filterSemester}
                  onChange={e => setFilterSemester(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  <option value="all">Tất cả học kỳ</option>
                  <option value="HK1">Học kỳ 1</option>
                  <option value="HK2">Học kỳ 2</option>
                  <option value="CaNam">Cả năm</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Active SubTab Body */}
          {activeSubTab === 'assessments' ? (
            /* Tab 1: Danh sách bài kiểm tra & Theo dõi */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800">
                  Danh sách bài kiểm tra ({filteredRecords.length} bài)
                </div>
                <div className="text-xs text-slate-500">
                  Cập nhật thời gian thực khi sửa/xóa
                </div>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    title="Chưa có dữ liệu bài kiểm tra phù hợp"
                    description="Nhấn nút '+ Nhập điểm kiểm tra mới' ở trên để bắt đầu ghi nhận điểm số, nhận xét và hỗ trợ cho học sinh."
                    actionLabel="+ Nhập điểm kiểm tra"
                    onAction={() => handleOpenAddModal()}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">STT</th>
                        <th className="py-3 px-4">Học sinh</th>
                        <th className="py-3 px-4">Môn & Tên bài kiểm tra</th>
                        <th className="py-3 px-3">Loại bài</th>
                        <th className="py-3 px-3">Thời gian</th>
                        <th className="py-3 px-3 text-center">Điểm số</th>
                        <th className="py-3 px-4">Nhận xét & Hỗ trợ</th>
                        <th className="py-3 px-3 text-center">Rèn luyện</th>
                        <th className="py-3 px-4 text-right w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((rec, index) => {
                        const badge = ASSESSMENT_TYPE_BADGES[rec.assessmentType] || ASSESSMENT_TYPE_BADGES.khac;
                        const student = students.find(s => s.id === rec.studentId);

                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* STT */}
                            <td className="py-3 px-4 text-center font-medium text-slate-400">
                              {index + 1}
                            </td>

                            {/* Học sinh */}
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => student && handleOpenStudentDetail(student)}
                                className="text-left font-semibold text-slate-800 hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                              >
                                {rec.studentNameSnapshot}
                              </button>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{rec.studentCodeSnapshot}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium">
                                  Tổ {rec.groupNumberSnapshot}
                                </span>
                              </div>
                            </td>

                            {/* Môn & Tên bài */}
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{rec.assessmentName}</div>
                              <div className="text-[11px] text-indigo-600 font-medium">{rec.subjectName}</div>
                            </td>

                            {/* Loại bài */}
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {ASSESSMENT_TYPE_LABELS[rec.assessmentType] || 'Kiểm tra'}
                              </span>
                            </td>

                            {/* Thời gian */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="font-medium text-slate-700 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {rec.date}
                              </div>
                              <div className="text-[10px] text-slate-500">Tuần {rec.weekNumber} • {rec.semester}</div>
                            </td>

                            {/* Điểm số */}
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block text-base font-bold px-2 py-0.5 rounded-lg ${
                                rec.score >= 9.0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                rec.score >= 8.0 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                rec.score >= 6.5 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                rec.score >= 5.0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {rec.score.toFixed(1)}
                              </span>
                            </td>

                            {/* Nhận xét & Thành tích / Hỗ trợ */}
                            <td className="py-3 px-4 max-w-xs">
                              {rec.feedback && (
                                <p className="text-xs text-slate-700 italic line-clamp-2">
                                  "{rec.feedback}"
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                {rec.achievement && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <Award className="w-3 h-3 text-emerald-600" />
                                    {rec.achievement}
                                  </span>
                                )}
                                {rec.supportNeeded && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                                    <HelpCircle className="w-3 h-3 text-rose-600" />
                                    {rec.supportNeeded}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Rèn luyện liên kết */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {rec.hasConductBonus ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Scale className="w-3 h-3 text-indigo-600" />
                                  +{rec.conductBonusScore || 2}đ
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">--</span>
                              )}
                            </td>

                            {/* Thao tác */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(rec)}
                                  disabled={isDataLocked}
                                  title="Chỉnh sửa bài kiểm tra"
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(rec)}
                                  disabled={isDataLocked}
                                  title="Xóa bài kiểm tra"
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: Hồ sơ học tập từng học sinh (Grid cards) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(s => {
                const sRecords = learningRecords.filter(r => r.studentId === s.id);
                const sStats = calculateLearningStats(sRecords);

                return (
                  <div 
                    key={s.id} 
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between hover:border-indigo-300 transition-all group"
                  >
                    <div>
                      {/* Student Info Header */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                            {s.stt}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {s.fullName}
                            </h3>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <span>{s.studentCode}</span>
                              <span>•</span>
                              <span className="font-semibold text-indigo-600">Tổ {s.groupNumber}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`text-base font-bold px-2 py-0.5 rounded-lg ${
                          sStats.averageScore >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          sStats.averageScore >= 6.5 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          sStats.averageScore >= 5 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          sStats.totalAssessments > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {sStats.totalAssessments > 0 ? sStats.averageScore.toFixed(1) : '--'}
                        </span>
                      </div>

                      {/* Mini Metrics */}
                      <div className="grid grid-cols-3 gap-2 py-3 text-center border-b border-slate-100 text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-semibold">Số bài</div>
                          <div className="font-bold text-slate-700 mt-0.5">{sStats.totalAssessments}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-semibold">Max / Min</div>
                          <div className="font-bold text-slate-700 mt-0.5">
                            {sStats.totalAssessments > 0 ? `${sStats.highestScore}/${sStats.lowestScore}` : '--'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-semibold">Xu hướng</div>
                          <div className={`font-bold mt-0.5 ${
                            sStats.trend === 'up' ? 'text-emerald-600' : sStats.trend === 'down' ? 'text-rose-600' : 'text-slate-600'
                          }`}>
                            {sStats.trend === 'up' ? '↗ Tiến bộ' : sStats.trend === 'down' ? '↘ Giảm' : '→ Ổn định'}
                          </div>
                        </div>
                      </div>

                      {/* Recent highlights */}
                      <div className="py-2.5 space-y-1 text-xs">
                        {sStats.totalAchievements > 0 && (
                          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium truncate">
                            <Award className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span>{sStats.totalAchievements} thành tích được khen thưởng</span>
                          </div>
                        )}
                        {sStats.totalSupportNeeded > 0 && (
                          <div className="text-[11px] text-rose-700 flex items-center gap-1 font-medium truncate">
                            <HelpCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            <span>{sStats.totalSupportNeeded} nội dung cần phụ đạo thêm</span>
                          </div>
                        )}
                        {sStats.totalAchievements === 0 && sStats.totalSupportNeeded === 0 && (
                          <div className="text-[11px] text-slate-400 italic">
                            Chưa có ghi chú thành tích / hỗ trợ đặc biệt.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenStudentDetail(s)}
                        className="flex-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        Xem chi tiết
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(s.id)}
                        disabled={isDataLocked}
                        className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Nhập điểm
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Thêm / Sửa bản ghi học tập */}
      <LearningRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveRecord}
        students={students}
        initialRecord={editingRecord}
        defaultStudentId={preselectedStudentId}
        isDataLocked={isDataLocked}
      />

      {/* Modal Xem chi tiết học tập từng học sinh */}
      <LearningStudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        student={detailStudent}
        records={learningRecords}
        onAddNewAssessment={studentId => handleOpenAddModal(studentId)}
        onEditAssessment={rec => handleOpenEditModal(rec)}
      />
    </div>
  );
}

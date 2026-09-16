import React, { useState, useMemo } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { 
  TimetablePeriod, 
  DayOfWeek, 
  TimetableSession, 
  DAYS_OF_WEEK, 
  MORNING_TIME_SLOTS, 
  AFTERNOON_TIME_SLOTS, 
  SUGGESTED_SUBJECTS 
} from '../../types/timetable';
import { 
  saveTimetablePeriod, 
  deleteTimetablePeriod, 
  batchSaveTimetable, 
  clearClassTimetable,
  generateSampleTimetable,
  exportTimetableToCSV 
} from '../../services/timetableService';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  Printer, 
  FileSpreadsheet, 
  Sparkles, 
  Sun, 
  Sunset, 
  Layers, 
  MapPin, 
  User, 
  AlertCircle,
  X,
  Check,
  RotateCcw
} from 'lucide-react';

export function TimetableManagementView() {
  const { classroom, timetable, isDataLocked } = useClass();
  const { currentUser, teacherProfile } = useAuth();
  const { showToast, showConfirmDialog } = useUI();

  // Chế độ xem: 'all' (Cả ngày), 'morning' (Sáng), 'afternoon' (Chiều)
  const [activeSessionView, setActiveSessionView] = useState<'all' | 'morning' | 'afternoon'>('all');
  // Lọc theo thứ: 'all' (Thứ 2 -> Thứ 7) hoặc một thứ cụ thể
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');

  // Trạng thái Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<TimetablePeriod | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    dayOfWeek: 2 as DayOfWeek,
    session: 'morning' as TimetableSession,
    period: 1,
    subject: '',
    teacherName: '',
    room: '',
    note: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map nhanh thời khóa biểu theo key: `${dayOfWeek}_${session}_${period}`
  const timetableMap = useMemo(() => {
    const map = new Map<string, TimetablePeriod>();
    timetable.forEach((item) => {
      map.set(`${item.dayOfWeek}_${item.session}_${item.period}`, item);
    });
    return map;
  }, [timetable]);

  // Tìm màu sắc chủ đề cho môn học
  const getSubjectColor = (subjectName: string) => {
    const found = SUGGESTED_SUBJECTS.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
    if (found) return found.color;
    return 'bg-slate-50 text-slate-800 border-slate-200';
  };

  // Mở modal Thêm mới
  const handleOpenAddModal = (defaultDay?: DayOfWeek, defaultSession?: TimetableSession, defaultPeriod?: number) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Vui lòng mở khóa sổ trước khi chỉnh sửa thời khóa biểu.');
      return;
    }

    setEditingPeriod(null);
    setFormData({
      dayOfWeek: defaultDay ?? 2,
      session: defaultSession ?? (activeSessionView === 'afternoon' ? 'afternoon' : 'morning'),
      period: defaultPeriod ?? 1,
      subject: 'Toán học',
      teacherName: teacherProfile?.displayName || '',
      room: 'P.302',
      note: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Mở modal Sửa
  const handleOpenEditModal = (period: TimetablePeriod) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Vui lòng mở khóa sổ trước khi chỉnh sửa thời khóa biểu.');
      return;
    }

    setEditingPeriod(period);
    setFormData({
      dayOfWeek: period.dayOfWeek,
      session: period.session,
      period: period.period,
      subject: period.subject,
      teacherName: period.teacherName,
      room: period.room || '',
      note: period.note || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Xóa một tiết học
  const handleDeletePeriod = (period: TimetablePeriod) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Không thể xóa khi sổ đang bị khóa.');
      return;
    }

    showConfirmDialog({
      title: 'Xóa tiết học khỏi Thời khóa biểu?',
      message: `Thầy/Cô có chắc chắn muốn xóa môn ${period.subject} (Thứ ${period.dayOfWeek}, Tiết ${period.period} ${period.session === 'morning' ? 'Sáng' : 'Chiều'})?`,
      confirmLabel: 'Xóa tiết học',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTimetablePeriod(period.id);
          showToast('success', 'Đã xóa tiết học thành công');
        } catch (err: any) {
          showToast('error', 'Lỗi khi xóa tiết học', err.message);
        }
      },
    });
  };

  // Lưu Form Thêm/Sửa
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom?.id) return;

    if (!formData.subject.trim()) {
      setFormError('Vui lòng chọn hoặc nhập tên Môn học.');
      return;
    }
    if (!formData.teacherName.trim()) {
      setFormError('Vui lòng nhập tên Giáo viên phụ trách.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await saveTimetablePeriod(
        classroom.id,
        {
          id: editingPeriod ? editingPeriod.id : undefined,
          dayOfWeek: formData.dayOfWeek,
          session: formData.session,
          period: Number(formData.period),
          subject: formData.subject,
          teacherName: formData.teacherName,
          room: formData.room,
          note: formData.note,
        },
        currentUser?.email || 'GVCN'
      );

      showToast(
        'success',
        editingPeriod ? 'Đã cập nhật tiết học' : 'Đã thêm tiết học mới',
        `${formData.subject} - Thứ ${formData.dayOfWeek} (Tiết ${formData.period})`
      );
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu thời khóa biểu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khởi tạo TKB mẫu chuẩn THPT
  const handleSeedSampleTimetable = () => {
    if (!classroom?.id) return;

    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Vui lòng mở khóa sổ trước khi thực hiện.');
      return;
    }

    showConfirmDialog({
      title: 'Khởi tạo Thời khóa biểu mẫu chuẩn THPT?',
      message: 'Hệ thống sẽ thiết lập thời khóa biểu đầy đủ từ Thứ 2 đến Thứ 7 (Buổi sáng và các buổi chiều phụ đạo môn thi tốt nghiệp). Dữ liệu mẫu sẽ ghi đè các tiết trùng. Bạn có muốn tiếp tục?',
      confirmLabel: 'Khởi tạo ngay',
      isDestructive: false,
      onConfirm: async () => {
        try {
          const samplePeriods = generateSampleTimetable(classroom.id, teacherProfile?.displayName || classroom.teacherName || 'GVCN');
          await batchSaveTimetable(samplePeriods);
          showToast('success', 'Đã khởi tạo thời khóa biểu mẫu thành công!');
        } catch (err: any) {
          showToast('error', 'Lỗi khởi tạo TKB mẫu', err.message);
        }
      },
    });
  };

  // Xóa trắng toàn bộ thời khóa biểu
  const handleClearAll = () => {
    if (!classroom?.id) return;
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa');
      return;
    }

    showConfirmDialog({
      title: 'Xóa toàn bộ Thời khóa biểu?',
      message: 'Hành động này sẽ xóa tất cả các tiết học hiện có trong thời khóa biểu của lớp. Thầy/Cô có chắc chắn không?',
      confirmLabel: 'Xóa tất cả',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await clearClassTimetable(classroom.id);
          showToast('success', 'Đã xóa toàn bộ thời khóa biểu.');
        } catch (err: any) {
          showToast('error', 'Lỗi khi xóa thời khóa biểu', err.message);
        }
      },
    });
  };

  // In thời khóa biểu
  const handlePrint = () => {
    window.print();
  };

  // Xuất Excel CSV
  const handleExportCSV = () => {
    if (timetable.length === 0) {
      showToast('warning', 'Chưa có thời khóa biểu', 'Vui lòng nhập ít nhất một tiết học trước khi xuất file.');
      return;
    }
    exportTimetableToCSV(timetable, classroom?.className || '12A1');
    showToast('success', 'Đã xuất thời khóa biểu ra file CSV (Excel)');
  };

  // Lọc danh sách Thứ hiển thị
  const displayedDays = useMemo(() => {
    if (selectedDayFilter === 'all') return DAYS_OF_WEEK;
    return DAYS_OF_WEEK.filter(d => d.value === selectedDayFilter);
  }, [selectedDayFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Thời Khóa Biểu Lớp {classroom?.className || '12A1'}
              </h2>
              <p className="text-xs text-slate-500">
                Lịch phân phối chương trình giảng dạy THPT (Thứ 2 → Thứ 7: Buổi sáng & Buổi chiều)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {timetable.length === 0 && (
            <button
              onClick={handleSeedSampleTimetable}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Nạp TKB Mẫu Chuẩn THPT</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Xuất bảng Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="In ấn hoặc lưu PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">In / PDF</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            disabled={isDataLocked}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tiết Học</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs: Buổi & Thứ */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Toggle Buổi Sáng / Chiều / Cả ngày */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSessionView('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSessionView === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cả ngày</span>
          </button>

          <button
            onClick={() => setActiveSessionView('morning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSessionView === 'morning'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Buổi sáng (Tiết 1-5)</span>
          </button>

          <button
            onClick={() => setActiveSessionView('afternoon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSessionView === 'afternoon'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sunset className="w-3.5 h-3.5 text-indigo-500" />
            <span>Buổi chiều (Tiết 1-5)</span>
          </button>
        </div>

        {/* Lọc nhanh theo Thứ 2 -> Thứ 7 */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">
            Xem thứ:
          </span>
          <button
            onClick={() => setSelectedDayFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              selectedDayFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tất cả (Thứ 2 - 7)
          </button>
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDayFilter(d.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedDayFilter === d.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {d.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* TIÊU ĐỀ IN ẤN (Chỉ hiển thị khi in) */}
      <div className="hidden print:block text-center pb-4 border-b border-slate-300">
        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
          THỜI KHÓA BIỂU HỌC KỲ - LỚP {classroom?.className || '12A1'}
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Năm học: {classroom?.academicYear || '2026-2027'} • GVCN: {teacherProfile?.displayName || classroom?.teacherName || 'Giáo viên Chủ nhiệm'}
        </p>
      </div>

      {/* BẢNG THỜI KHÓA BIỂU: BUỔI SÁNG */}
      {(activeSessionView === 'all' || activeSessionView === 'morning') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Buổi sáng */}
          <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                Buổi Sáng: Tiết 1 → Tiết 5 (07:00 – 11:25)
              </h3>
            </div>
            <span className="text-xs font-medium text-amber-800 hidden sm:inline">
              Khung giờ học chính khóa THPT
            </span>
          </div>

          {/* Table Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-700">
                  <th className="py-2.5 px-3 font-bold w-24 text-center border-r border-slate-200">
                    Tiết / Giờ
                  </th>
                  {displayedDays.map((day) => (
                    <th key={day.value} className="py-2.5 px-3 font-bold text-center border-r border-slate-200 last:border-r-0">
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {MORNING_TIME_SLOTS.map((slot) => (
                  <tr key={`morning_${slot.period}`} className="hover:bg-slate-50/50 transition-colors">
                    {/* Cột Tiết */}
                    <td className="py-2 px-2.5 text-center font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                      <div className="text-xs font-extrabold text-indigo-700">{slot.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </td>

                    {/* Các ô theo từng Thứ */}
                    {displayedDays.map((day) => {
                      const item = timetableMap.get(`${day.value}_morning_${slot.period}`);

                      if (!item) {
                        return (
                          <td 
                            key={`${day.value}_${slot.period}`}
                            onClick={() => handleOpenAddModal(day.value, 'morning', slot.period)}
                            className="py-2 px-2 text-center border-r border-slate-200 last:border-r-0 relative group cursor-pointer hover:bg-indigo-50/40 transition-colors"
                          >
                            <div className="h-16 flex flex-col items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                              <span className="text-[11px] opacity-0 group-hover:opacity-100 font-bold flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> Thêm
                              </span>
                              <span className="text-slate-300 group-hover:hidden text-[11px]">-</span>
                            </div>
                          </td>
                        );
                      }

                      const colorClass = getSubjectColor(item.subject);

                      return (
                        <td 
                          key={`${day.value}_${slot.period}`}
                          className="py-1.5 px-2 border-r border-slate-200 last:border-r-0 align-top"
                        >
                          <div 
                            onClick={() => handleOpenEditModal(item)}
                            className={`p-2 rounded-xl border transition-all relative group cursor-pointer hover:shadow-xs ${colorClass}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-extrabold text-xs block leading-tight">
                                {item.subject}
                              </span>

                              {/* Action buttons on hover */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity print:hidden">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal(item);
                                  }}
                                  className="p-1 hover:bg-black/10 rounded-md text-slate-700"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePeriod(item);
                                  }}
                                  className="p-1 hover:bg-rose-100 rounded-md text-rose-600"
                                  title="Xóa tiết"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Tên Giáo viên */}
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-medium opacity-90 truncate">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item.teacherName}</span>
                            </div>

                            {/* Phòng học & Ghi chú */}
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {item.room && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/80 border border-black/10 text-[10px] font-bold text-slate-700">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {item.room}
                                </span>
                              )}
                              {item.note && (
                                <span className="text-[10px] italic opacity-80 truncate block max-w-full">
                                  {item.note}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BẢNG THỜI KHÓA BIỂU: BUỔI CHIỀU */}
      {(activeSessionView === 'all' || activeSessionView === 'afternoon') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Buổi chiều */}
          <div className="px-5 py-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sunset className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wide">
                Buổi Chiều: Tiết 1 → Tiết 5 (13:00 – 17:20)
              </h3>
            </div>
            <span className="text-xs font-medium text-indigo-800 hidden sm:inline">
              Phụ đạo, ôn tập thi tốt nghiệp THPT, chuyên đề & bồi dưỡng
            </span>
          </div>

          {/* Table Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-700">
                  <th className="py-2.5 px-3 font-bold w-24 text-center border-r border-slate-200">
                    Tiết / Giờ
                  </th>
                  {displayedDays.map((day) => (
                    <th key={day.value} className="py-2.5 px-3 font-bold text-center border-r border-slate-200 last:border-r-0">
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {AFTERNOON_TIME_SLOTS.map((slot) => (
                  <tr key={`afternoon_${slot.period}`} className="hover:bg-slate-50/50 transition-colors">
                    {/* Cột Tiết */}
                    <td className="py-2 px-2.5 text-center font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                      <div className="text-xs font-extrabold text-indigo-700">{slot.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </td>

                    {/* Các ô theo từng Thứ */}
                    {displayedDays.map((day) => {
                      const item = timetableMap.get(`${day.value}_afternoon_${slot.period}`);

                      if (!item) {
                        return (
                          <td 
                            key={`${day.value}_afternoon_${slot.period}`}
                            onClick={() => handleOpenAddModal(day.value, 'afternoon', slot.period)}
                            className="py-2 px-2 text-center border-r border-slate-200 last:border-r-0 relative group cursor-pointer hover:bg-indigo-50/40 transition-colors"
                          >
                            <div className="h-16 flex flex-col items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                              <span className="text-[11px] opacity-0 group-hover:opacity-100 font-bold flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> Thêm
                              </span>
                              <span className="text-slate-300 group-hover:hidden text-[11px]">-</span>
                            </div>
                          </td>
                        );
                      }

                      const colorClass = getSubjectColor(item.subject);

                      return (
                        <td 
                          key={`${day.value}_afternoon_${slot.period}`}
                          className="py-1.5 px-2 border-r border-slate-200 last:border-r-0 align-top"
                        >
                          <div 
                            onClick={() => handleOpenEditModal(item)}
                            className={`p-2 rounded-xl border transition-all relative group cursor-pointer hover:shadow-xs ${colorClass}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-extrabold text-xs block leading-tight">
                                {item.subject}
                              </span>

                              {/* Action buttons on hover */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity print:hidden">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal(item);
                                  }}
                                  className="p-1 hover:bg-black/10 rounded-md text-slate-700"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePeriod(item);
                                  }}
                                  className="p-1 hover:bg-rose-100 rounded-md text-rose-600"
                                  title="Xóa tiết"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Tên Giáo viên */}
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-medium opacity-90 truncate">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item.teacherName}</span>
                            </div>

                            {/* Phòng học & Ghi chú */}
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {item.room && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/80 border border-black/10 text-[10px] font-bold text-slate-700">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {item.room}
                                </span>
                              )}
                              {item.note && (
                                <span className="text-[10px] italic opacity-80 truncate block max-w-full">
                                  {item.note}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Controls & Stats */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 print:hidden">
        <div className="flex items-center gap-4">
          <span>Tổng số tiết đã xếp: <strong className="text-slate-900">{timetable.length} tiết</strong></span>
          <span>•</span>
          <span>Sáng: <strong className="text-amber-700">{timetable.filter(p => p.session === 'morning').length} tiết</strong></span>
          <span>•</span>
          <span>Chiều: <strong className="text-indigo-700">{timetable.filter(p => p.session === 'afternoon').length} tiết</strong></span>
        </div>

        {timetable.length > 0 && !isDataLocked && (
          <button
            onClick={handleClearAll}
            className="text-xs text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa trắng thời khóa biểu</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL THÊM / SỬA TIẾT HỌC */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingPeriod ? 'Chỉnh Sửa Tiết Học' : 'Thêm Tiết Học Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Hàng 1: Thứ & Buổi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Thứ trong tuần <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) as DayOfWeek })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Buổi học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.session}
                    onChange={(e) => setFormData({ ...formData, session: e.target.value as TimetableSession })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="morning">Buổi sáng</option>
                    <option value="afternoon">Buổi chiều</option>
                  </select>
                </div>
              </div>

              {/* Hàng 2: Tiết học */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tiết học <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                >
                  {(formData.session === 'morning' ? MORNING_TIME_SLOTS : AFTERNOON_TIME_SLOTS).map((slot) => (
                    <option key={slot.period} value={slot.period}>
                      {slot.label} ({slot.startTime} – {slot.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hàng 3: Môn học */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Môn học <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={SUGGESTED_SUBJECTS.some(s => s.name === formData.subject) ? formData.subject : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value !== '__custom__') {
                        setFormData({ ...formData, subject: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  >
                    <option value="" disabled>-- Chọn môn học THPT --</option>
                    {SUGGESTED_SUBJECTS.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="__custom__">Môn khác / Tự nhập...</option>
                  </select>

                  {/* Cho phép tự nhập tên môn nếu muốn */}
                  <input
                    type="text"
                    placeholder="Hoặc nhập tên môn học (vd: Tin học ứng dụng, Âm nhạc...)"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Hàng 4: Giáo viên bộ môn */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Giáo viên bộ môn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thầy Trần Quốc Hùng, Cô Lê Thị Mai..."
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Hàng 5: Phòng học nếu cần */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Phòng học / Địa điểm (nếu có)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: P.302, Phòng Lab Hóa, Phòng Tin 1, Sân trường..."
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Hàng 6: Ghi chú thêm */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Ghi chú dặn dò (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mang máy tính bỏ túi, ôn bài cũ..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingPeriod ? 'Lưu Thay Đổi' : 'Thêm Tiết Học'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

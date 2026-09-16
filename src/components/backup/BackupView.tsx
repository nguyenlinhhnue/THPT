import React, { useState, useEffect, useRef } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { 
  exportClassDataAsJSON, 
  exportStudentsAsJSON,
  exportStudentsToCSV, 
  exportPointTransactionsAsJSON,
  exportPointTransactionsToCSV,
  exportConfigAsJSON,
  exportTimetableAsJSON,
  exportScoresToCSV, 
  saveBackupToFirestore, 
  getBackupsList, 
  restoreClassDataSafely,
  validateBackupFile,
  BackupMetadata, 
  BackupValidationResult,
  FullClassBackup
} from '../../services/backupService';
import { exportTimetableToCSV } from '../../services/timetableService';
import { THPT_SUBJECTS, Semester } from '../../types/score';
import { formatDateVN } from '../../utils/formatters';
import { 
  HardDriveDownload, 
  UploadCloud, 
  FileSpreadsheet, 
  FileJson, 
  Database, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
  Settings,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  X,
  ArrowRight,
  ShieldAlert,
  Users
} from 'lucide-react';

export function BackupView() {
  const { 
    classroom, 
    students, 
    scores, 
    conductRecords, 
    pointTransactions, 
    pointRules, 
    timetable, 
    learningRecords,
    attendanceRecords,
    isDataLocked,
    refreshAllData 
  } = useClass();
  const { currentUser, teacherProfile } = useAuth();
  const { showToast, showConfirmDialog } = useUI();

  // Snapshot đám mây
  const [cloudBackups, setCloudBackups] = useState<BackupMetadata[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingCloudBackup, setCreatingCloudBackup] = useState(false);
  const [backupNote, setBackupNote] = useState('');

  // Trạng thái Khôi phục từ File
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedBackupContent, setParsedBackupContent] = useState<any | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [autoBackupBeforeRestore, setAutoBackupBeforeRestore] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  // Tab xuất điểm CSV tùy chọn
  const [selectedSubject, setSelectedSubject] = useState<string>('toan');
  const [selectedSemester, setSelectedSemester] = useState<Semester>('HK1');

  const loadBackups = async () => {
    if (!classroom?.id) return;
    try {
      setLoadingBackups(true);
      const list = await getBackupsList(classroom.id);
      setCloudBackups(list);
    } catch (err: any) {
      console.error('Load backups error:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, [classroom?.id]);

  // =========================================================================
  // 1. CÁC HÀM XUẤT SAO LƯU (EXPORTS)
  // =========================================================================

  // 1.1 Xuất toàn bộ dữ liệu (Full Backup JSON)
  const handleExportFullJSON = () => {
    exportClassDataAsJSON(
      classroom, 
      students, 
      scores, 
      conductRecords, 
      pointTransactions, 
      pointRules, 
      timetable, 
      learningRecords, 
      attendanceRecords
    );
    showToast('success', 'Đã tải xuống tệp sao lưu toàn bộ lớp học (.JSON)');
  };

  // 1.2 Xuất Danh sách học sinh (JSON & CSV)
  const handleExportStudentsJSON = () => {
    if (students.length === 0) {
      showToast('warning', 'Chưa có dữ liệu học sinh để xuất.');
      return;
    }
    exportStudentsAsJSON(students, classroom?.className || '12A1');
    showToast('success', 'Đã tải xuống danh sách học sinh (.JSON)');
  };

  const handleExportStudentsCSV = () => {
    if (students.length === 0) {
      showToast('warning', 'Chưa có học sinh', 'Danh sách hiện chưa có dữ liệu học sinh để xuất.');
      return;
    }
    exportStudentsToCSV(students, classroom?.className || '12A1');
    showToast('success', 'Đã xuất danh sách học sinh ra file CSV (Excel)');
  };

  // 1.3 Xuất Transaction Điểm Tuần (JSON & CSV)
  const handleExportTransactionsJSON = () => {
    if (pointTransactions.length === 0) {
      showToast('warning', 'Chưa có giao dịch điểm tuần nào để xuất.');
      return;
    }
    exportPointTransactionsAsJSON(pointTransactions, classroom?.className || '12A1');
    showToast('success', 'Đã tải xuống giao dịch điểm tuần (.JSON)');
  };

  const handleExportTransactionsCSV = () => {
    if (pointTransactions.length === 0) {
      showToast('warning', 'Chưa có giao dịch điểm tuần nào để xuất.');
      return;
    }
    exportPointTransactionsToCSV(pointTransactions, classroom?.className || '12A1');
    showToast('success', 'Đã xuất sổ giao dịch điểm thi đua ra CSV (Excel)');
  };

  // 1.4 Xuất Cấu hình Lớp & Quy tắc (JSON)
  const handleExportConfigJSON = () => {
    exportConfigAsJSON(classroom, pointRules, null, classroom?.className || '12A1');
    showToast('success', 'Đã tải xuống tệp cấu hình lớp & quy tắc chấm điểm (.JSON)');
  };

  // 1.5 Xuất Thời khóa biểu (JSON & CSV)
  const handleExportTimetableJSON = () => {
    if (timetable.length === 0) {
      showToast('warning', 'Thời khóa biểu hiện chưa có tiết học nào.');
      return;
    }
    exportTimetableAsJSON(timetable, classroom?.className || '12A1');
    showToast('success', 'Đã tải xuống thời khóa biểu (.JSON)');
  };

  const handleExportTimetableCSV = () => {
    if (timetable.length === 0) {
      showToast('warning', 'Thời khóa biểu hiện chưa có tiết học nào.');
      return;
    }
    exportTimetableToCSV(timetable, classroom?.className || '12A1');
    showToast('success', 'Đã xuất thời khóa biểu ra CSV (Excel)');
  };

  // 1.6 Xuất Điểm Môn học CSV
  const handleExportScoresCSV = () => {
    if (students.length === 0) {
      showToast('warning', 'Chưa có học sinh', 'Vui lòng thêm học sinh trước khi xuất bảng điểm.');
      return;
    }
    exportScoresToCSV(students, scores, selectedSubject, selectedSemester, classroom?.className || '12A1');
    showToast('success', 'Đã xuất bảng điểm môn học ra file CSV');
  };

  // 1.7 Tạo Snapshot trên đám mây Firestore
  const handleCreateCloudBackup = async () => {
    if (!classroom?.id || !currentUser) return;

    try {
      setCreatingCloudBackup(true);
      const fullBackup: FullClassBackup = {
        version: '2.0',
        system: 'QL_LOP_CN_THPT',
        exportedAt: new Date().toISOString(),
        classroom,
        students,
        scores,
        conductRecords,
        pointTransactions,
        pointRules,
        timetable,
        learningRecords,
        attendanceRecords,
      };

      await saveBackupToFirestore(
        classroom.id,
        classroom.className || '12A1',
        classroom.academicYear || '2026-2027',
        currentUser.uid,
        fullBackup,
        backupNote.trim() || 'Bản sao lưu thủ công của GVCN'
      );

      showToast('success', 'Đã lưu bản sao lưu đám mây', 'Dữ liệu được lưu trữ bảo mật trên Firestore.');
      setBackupNote('');
      await loadBackups();
    } catch (err: any) {
      console.error('Create cloud backup error:', err);
      showToast('error', 'Lỗi sao lưu đám mây', err.message);
    } finally {
      setCreatingCloudBackup(false);
    }
  };

  // =========================================================================
  // 2. KHÔI PHỤC DỮ LIỆU & KIỂM TRA FILE (RESTORE ENGINE)
  // =========================================================================

  // Xử lý khi GVCN chọn file từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Vui lòng mở khóa sổ trước khi thực hiện khôi phục.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        // Chạy bộ kiểm tra cấu trúc file
        const validation = validateBackupFile(parsed);
        setParsedBackupContent(parsed);
        setValidationResult(validation);

        if (!validation.isValid) {
          showToast('error', 'File không đúng định dạng', validation.errors[0] || 'Tệp sao lưu bị lỗi cấu trúc.');
        } else {
          setShowRestoreModal(true);
        }
      } catch (err: any) {
        setValidationResult({
          isValid: false,
          errors: ['Tệp được chọn không thể phân tích cú pháp JSON hợp lệ.'],
          warnings: [],
          summary: {
            version: 'unknown',
            studentsCount: 0,
            scoresCount: 0,
            conductCount: 0,
            transactionsCount: 0,
            timetableCount: 0,
            rulesCount: 0,
            learningCount: 0,
            hasConfig: false,
          }
        });
        showToast('error', 'Lỗi tệp sao lưu', 'Không thể đọc nội dung file JSON này.');
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Thực hiện Khôi phục sau khi GVCN xác nhận
  const handleConfirmRestore = async () => {
    if (!classroom?.id || !parsedBackupContent) return;

    try {
      setIsRestoring(true);
      const res = await restoreClassDataSafely(
        parsedBackupContent,
        classroom.id,
        {
          autoBackupBeforeRestore,
          currentUserUid: currentUser?.uid,
          currentUserEmail: currentUser?.email || undefined,
          currentClassroom: classroom,
          currentStudents: students,
          currentScores: scores,
          currentConduct: conductRecords,
          currentTransactions: pointTransactions,
          currentRules: pointRules,
          currentTimetable: timetable,
        }
      );

      // Cập nhật lại TOÀN BỘ menu và số liệu từ Firestore
      await refreshAllData();
      await loadBackups();

      setShowRestoreModal(false);
      setUploadedFile(null);
      setParsedBackupContent(null);
      setValidationResult(null);

      showToast(
        'success',
        'Khôi phục dữ liệu thành công!',
        `Đã nạp: ${res.stats.studentsRestored} học sinh, ${res.stats.transactionsRestored} giao dịch điểm, ${res.stats.timetableRestored} tiết TKB. Menu và dữ liệu đã được cập nhật lại từ Firestore.`
      );
    } catch (err: any) {
      console.error('Lỗi khi khôi phục:', err);
      showToast('error', 'Lỗi khôi phục dữ liệu', err.message || 'Không thể áp dụng bản sao lưu.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Trung Tâm Sao Lưu & Khôi Phục Dữ Liệu
            </h2>
            <p className="text-xs text-slate-500">
              Lớp {classroom?.className || '12A1'} • Quyền độc quyền của GVCN: Xuất file, sao lưu đám mây và khôi phục an toàn chống trùng lặp
            </p>
          </div>
        </div>

        {/* Nút cập nhật cưỡng bức */}
        <button
          onClick={async () => {
            await refreshAllData();
            await loadBackups();
          }}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới toàn bộ từ Firestore</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PHẦN 1: SAO LƯU DỮ LIỆU (BACKUP) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HardDriveDownload className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            1. SAO LƯU DỮ LIỆU (XUẤT DỮ LIỆU)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Toàn bộ dữ liệu */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-1">
                <FileJson className="w-4 h-4" />
                <span>Xuất Toàn Bộ Dữ Liệu</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tải về tệp JSON tổng hợp gồm: Học sinh, Bảng điểm, Transaction điểm tuần, Quy tắc, Thời khóa biểu và Cấu hình lớp.
              </p>
            </div>
            <button
              onClick={handleExportFullJSON}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              <span>Tải Bản Sao Lưu Tổng Thể (.JSON)</span>
            </button>
          </div>

          {/* Card 2: Danh sách học sinh */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Xuất Danh Sách Học Sinh</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hồ sơ lý lịch {students.length} học sinh: Họ tên, tổ, chức vụ, ngày sinh, liên lạc phụ huynh.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportStudentsJSON}
                className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <FileJson className="w-3.5 h-3.5 text-indigo-600" />
                <span>File .JSON</span>
              </button>
              <button
                onClick={handleExportStudentsCSV}
                className="py-2 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>File .CSV</span>
              </button>
            </div>
          </div>

          {/* Card 3: Giao dịch điểm tuần */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Xuất Transaction Điểm Tuần</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sổ nhật ký ghi điểm thi đua: {pointTransactions.length} giao dịch cộng/trừ điểm nề nếp của học sinh.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportTransactionsJSON}
                className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <FileJson className="w-3.5 h-3.5 text-amber-600" />
                <span>File .JSON</span>
              </button>
              <button
                onClick={handleExportTransactionsCSV}
                className="py-2 px-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                <span>File .CSV</span>
              </button>
            </div>
          </div>

          {/* Card 4: Cấu hình lớp & Quy tắc */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                <Settings className="w-4 h-4 text-blue-600" />
                <span>Xuất Cấu Hình Lớp & Quy Tắc</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thông số lớp học, điểm khởi đầu thi đua, {pointRules.length} quy tắc chấm điểm và tiêu chí xếp loại.
              </p>
            </div>
            <button
              onClick={handleExportConfigJSON}
              className="w-full py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <FileJson className="w-4 h-4 text-blue-600" />
              <span>Xuất Cấu Hình (.JSON)</span>
            </button>
          </div>

          {/* Card 5: Thời khóa biểu */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Xuất Thời Khóa Biểu</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lịch phân phối chương trình: {timetable.length} tiết học từ Thứ 2 đến Thứ 7 (sáng và chiều).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportTimetableJSON}
                className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <FileJson className="w-3.5 h-3.5 text-purple-600" />
                <span>File .JSON</span>
              </button>
              <button
                onClick={handleExportTimetableCSV}
                className="py-2 px-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                <span>File .CSV</span>
              </button>
            </div>
          </div>

          {/* Card 6: Bảng điểm môn học (CSV) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <span>Xuất Bảng Điểm Môn Học</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {THPT_SUBJECTS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as Semester)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="HK1">Học kỳ 1</option>
                  <option value="HK2">Học kỳ 2</option>
                  <option value="CaNam">Cả năm</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleExportScoresCSV}
              className="w-full py-2 px-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>Xuất Bảng Điểm (.CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHẦN 2: KHÔI PHỤC DỮ LIỆU (RESTORE) */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            2. KHÔI PHỤC DỮ LIỆU (RESTORE ENGINE)
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Chọn Tệp Sao Lưu Để Khôi Phục
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Quy trình khôi phục an toàn: Kiểm tra cấu trúc file • Cảnh báo xác nhận chi tiết • Tự động tạo backup trước khi khôi phục • Chống trùng lặp dữ liệu (de-duplication) • Không làm mất dữ liệu nếu file lỗi • Đồng bộ lại toàn bộ menu từ Firestore.
              </p>
            </div>
          </div>

          {/* Khu vực chọn file */}
          <div className="p-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 rounded-2xl text-center space-y-3 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              disabled={isDataLocked}
              className="hidden"
              id="restore-file-input"
            />
            <label
              htmlFor="restore-file-input"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs ${
                isDataLocked ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Chọn File Sao Lưu (.JSON) Từ Máy Tính</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Hỗ trợ file sao lưu tổng thể, danh sách học sinh, giao dịch điểm, cấu hình hoặc thời khóa biểu
            </p>
          </div>

          {/* Cảnh báo nếu file lỗi */}
          {validationResult && !validationResult.isValid && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Tệp sao lưu không hợp lệ - Hệ thống đã ngăn chặn khôi phục để bảo vệ dữ liệu</span>
              </div>
              <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                {validationResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHẦN 3: SNAPSHOT ĐÁM MÂY FIRESTORE */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            3. LƯU TRỮ ĐÁM MÂY FIRESTORE
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tạo Snapshot mới */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Tạo Bản Sao Lưu Đám Mây</h4>
            <p className="text-xs text-slate-500">
              Lưu trữ snapshot dữ liệu lớp hiện tại an toàn trên cơ sở dữ liệu Firestore.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Ghi chú (vd: Cuối Học kỳ 1, Trước thi tốt nghiệp...)"
                value={backupNote}
                onChange={(e) => setBackupNote(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />

              <button
                onClick={handleCreateCloudBackup}
                disabled={creatingCloudBackup || isDataLocked}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creatingCloudBackup ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>Lưu Snapshot Lên Firestore</span>
              </button>
            </div>
          </div>

          {/* Lịch sử Sao lưu đám mây */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Lịch Sử Các Bản Sao Lưu Trên Đám Mây ({cloudBackups.length})
              </h4>
              <button
                onClick={loadBackups}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                title="Làm mới danh sách"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingBackups ? (
              <div className="py-8 text-center text-xs text-slate-400">Đang tải lịch sử sao lưu...</div>
            ) : cloudBackups.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có bản sao lưu nào được lưu trên đám mây Firestore.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {cloudBackups.map((bk) => (
                  <div
                    key={bk.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{bk.note || 'Bản sao lưu'}</span>
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {bk.className} ({bk.schoolYear})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-2">
                        <span>{formatDateVN(bk.createdAt)}</span>
                        <span>•</span>
                        <span>{bk.studentsCount} học sinh</span>
                        <span>•</span>
                        <span>{bk.transactionsCount || 0} GD điểm</span>
                        <span>•</span>
                        <span>{bk.timetableCount || 0} tiết TKB</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã bảo lưu
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL CẢNH BÁO, XÁC NHẬN & KIỂM TRA TRƯỚC KHI KHÔI PHỤC */}
      {/* ========================================================================= */}
      {showRestoreModal && validationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Xác Nhận Khôi Phục Dữ Liệu Lớp Học
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kiểm tra cấu trúc và xác thực an toàn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRestoreModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Cảnh báo */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold">Cảnh báo quan trọng trước khi khôi phục:</p>
                  <p className="leading-relaxed">
                    Dữ liệu từ tệp sẽ được đồng bộ vào lớp học. Hệ thống áp dụng cơ chế <strong>chống tạo bản ghi trùng lặp (de-duplication)</strong> tự động bằng cách đối chiếu mã định danh của học sinh, điểm, giao dịch và thời khóa biểu.
                  </p>
                </div>
              </div>

              {/* Bảng tóm tắt thông tin tệp */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>Thông tin tệp sao lưu:</span>
                  <span className="text-[11px] font-normal text-slate-500">{uploadedFile?.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Học sinh:</span>
                    <strong className="text-slate-900 text-sm">{validationResult.summary.studentsCount}</strong> em
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">GD điểm tuần:</span>
                    <strong className="text-slate-900 text-sm">{validationResult.summary.transactionsCount}</strong> GD
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Thời khóa biểu:</span>
                    <strong className="text-slate-900 text-sm">{validationResult.summary.timetableCount}</strong> tiết
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Quy tắc & Cấu hình:</span>
                    <strong className="text-slate-900 text-sm">{validationResult.summary.rulesCount}</strong> quy tắc
                  </div>
                </div>

                {validationResult.summary.exportedAt && (
                  <p className="text-[11px] text-slate-400 pt-1">
                    Ngày xuất bản gốc: {new Date(validationResult.summary.exportedAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>

              {/* Tùy chọn Tự động backup trước khi restore */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors">
                <input
                  type="checkbox"
                  checked={autoBackupBeforeRestore}
                  onChange={(e) => setAutoBackupBeforeRestore(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs text-indigo-950 font-medium">
                  <strong>Tự động tạo bản sao lưu khẩn cấp dữ liệu hiện tại</strong> trước khi khôi phục (Khuyến nghị an toàn)
                </span>
              </label>

              {/* Thông báo kết quả sau restore */}
              <p className="text-[11px] text-slate-500 italic">
                * Sau khi khôi phục thành công, toàn bộ menu và các mục dữ liệu sẽ được tự động đồng bộ lại từ Firestore.
              </p>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={() => setShowRestoreModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={handleConfirmRestore}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang khôi phục & đồng bộ...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Xác Nhận Khôi Phục An Toàn</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

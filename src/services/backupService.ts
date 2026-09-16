import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Classroom, ClassroomInfo } from '../types/class';
import { Student } from '../types/student';
import { SubjectScore, THPT_SUBJECTS, Semester } from '../types/score';
import { ConductRecord } from '../types/conduct';
import { WeeklyPointTransaction } from '../types/pointTransaction';
import { PointRule } from '../types/pointRule';
import { TimetablePeriod } from '../types/timetable';
import { LearningRecord } from '../types/learning';
import { AttendanceRecord } from '../types/attendance';
import { ClassificationCriteriaConfig } from '../types/classification';
import { calculateSubjectAverage } from '../utils/calculations';

export interface BackupMetadata {
  id: string;
  classId: string;
  className: string;
  schoolYear: string;
  createdAt: string;
  createdBy: string;
  studentsCount: number;
  scoresCount: number;
  conductCount: number;
  transactionsCount?: number;
  timetableCount?: number;
  rulesCount?: number;
  note?: string;
}

export interface FullClassBackup {
  version: '1.0' | '2.0';
  system: 'QL_LOP_CN_THPT';
  exportedAt: string;
  classroom: ClassroomInfo | Classroom | null;
  students: Student[];
  scores: SubjectScore[];
  conductRecords: ConductRecord[];
  pointTransactions?: WeeklyPointTransaction[];
  pointRules?: PointRule[];
  timetable?: TimetablePeriod[];
  learningRecords?: LearningRecord[];
  attendanceRecords?: AttendanceRecord[];
  classificationConfig?: ClassificationCriteriaConfig | null;
}

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    version: string;
    exportedAt?: string;
    className?: string;
    studentsCount: number;
    scoresCount: number;
    conductCount: number;
    transactionsCount: number;
    timetableCount: number;
    rulesCount: number;
    learningCount: number;
    hasConfig: boolean;
  };
}

/**
 * Tải file dữ liệu xuống máy tính của GVCN
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =========================================================================
// CÁC HÀM XUẤT DỮ LIỆU (EXPORTS)
// =========================================================================

/**
 * 1. Xuất TOÀN BỘ dữ liệu lớp học dưới dạng JSON sao lưu đầy đủ
 */
export function exportClassDataAsJSON(
  classroom: ClassroomInfo | Classroom | null,
  students: Student[],
  scores: SubjectScore[],
  conductRecords: ConductRecord[],
  pointTransactions: WeeklyPointTransaction[] = [],
  pointRules: PointRule[] = [],
  timetable: TimetablePeriod[] = [],
  learningRecords: LearningRecord[] = [],
  attendanceRecords: AttendanceRecord[] = [],
  classificationConfig: ClassificationCriteriaConfig | null = null
) {
  const backup: FullClassBackup = {
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
    classificationConfig,
  };

  const className = classroom?.className || '12A1';
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `SaoLuu_ToanBo_${className}_${dateStr}.json`;
  downloadFile(JSON.stringify(backup, null, 2), filename, 'application/json');
}

/**
 * 2. Xuất Danh sách học sinh (JSON)
 */
export function exportStudentsAsJSON(students: Student[], className: string) {
  const payload = {
    type: 'STUDENTS_EXPORT',
    version: '2.0',
    className,
    exportedAt: new Date().toISOString(),
    total: students.length,
    data: students,
  };
  const filename = `DanhSachHocSinh_${className}_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json');
}

/**
 * 3. Xuất Danh sách học sinh ra file CSV (Excel có dấu tiếng Việt UTF-8 BOM)
 */
export function exportStudentsToCSV(students: Student[], className: string) {
  const headers = ['STT', 'Mã HS', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Tổ', 'Chức vụ', 'Đoàn viên', 'SĐT Học sinh', 'Phụ huynh', 'SĐT Phụ huynh', 'Địa chỉ'];
  
  const rows = students.map((s, idx) => [
    idx + 1,
    `"${s.studentCode}"`,
    `"${s.fullName}"`,
    s.gender === 'nam' ? 'Nam' : 'Nữ',
    `"${s.dateOfBirth}"`,
    s.groupNumber,
    `"${s.role}"`,
    s.isUnionMember ? 'Có' : 'Chưa',
    `"${s.phone || ''}"`,
    `"${s.parentName || ''}"`,
    `"${s.parentPhone || ''}"`,
    `"${s.address || ''}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadFile(csvContent, `DanhSachHocSinh_${className}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * 4. Xuất Transaction Điểm Tuần (JSON)
 */
export function exportPointTransactionsAsJSON(transactions: WeeklyPointTransaction[], className: string) {
  const payload = {
    type: 'POINT_TRANSACTIONS_EXPORT',
    version: '2.0',
    className,
    exportedAt: new Date().toISOString(),
    total: transactions.length,
    data: transactions,
  };
  const filename = `GiaoDichDiemTuan_${className}_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json');
}

/**
 * 5. Xuất Transaction Điểm Tuần ra file CSV
 */
export function exportPointTransactionsToCSV(transactions: WeeklyPointTransaction[], className: string) {
  const headers = ['Mã GD', 'Tuần', 'Ngày', 'Mã HS', 'Họ và tên', 'Tổ', 'Phân loại', 'Nội dung / Lý do', 'Điểm (+/-)', 'Ghi chú', 'Người lập'];
  
  const rows = transactions.map(t => [
    `"${t.id || t.transactionId || ''}"`,
    `"Tuần ${t.weekNumber}"`,
    `"${t.date || ''}"`,
    `"${t.studentCodeSnapshot || ''}"`,
    `"${t.studentNameSnapshot || ''}"`,
    `"Tổ ${t.groupNumberSnapshot || 1}"`,
    `"${t.categoryLabel || t.category}"`,
    `"${(t.reason || '').replace(/"/g, '""')}"`,
    t.score > 0 ? `+${t.score}` : t.score,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    `"${t.createdBy || 'GVCN'}"`,
  ]);

  const csvContent = '\uFEFF' + [
    `SỔ GIAO DỊCH CỘNG TRỪ ĐIỂM THI ĐUA - LỚP: ${className}`,
    headers.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\r\n');

  downloadFile(csvContent, `GiaoDichDiemTuan_${className}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * 6. Xuất Cấu hình Lớp & Quy tắc Chấm điểm & Tiêu chí Xếp loại (JSON)
 */
export function exportConfigAsJSON(
  classroom: ClassroomInfo | Classroom | null,
  pointRules: PointRule[],
  classificationConfig: ClassificationCriteriaConfig | null,
  className: string
) {
  const payload = {
    type: 'CONFIGURATION_EXPORT',
    version: '2.0',
    className,
    exportedAt: new Date().toISOString(),
    classroomSettings: classroom ? {
      className: classroom.className,
      schoolYear: classroom.schoolYear,
      grade: classroom.grade,
      teacherName: classroom.teacherName,
      totalStudents: classroom.totalStudents,
      baseCompetitionPoints: classroom.baseCompetitionPoints,
      currentSemester: classroom.currentSemester,
    } : null,
    pointRules,
    classificationConfig,
  };
  const filename = `CauHinhLop_${className}_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json');
}

/**
 * 7. Xuất Thời khóa biểu (JSON)
 */
export function exportTimetableAsJSON(timetable: TimetablePeriod[], className: string) {
  const payload = {
    type: 'TIMETABLE_EXPORT',
    version: '2.0',
    className,
    exportedAt: new Date().toISOString(),
    totalPeriods: timetable.length,
    data: timetable,
  };
  const filename = `ThoiKhoaBieu_${className}_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json');
}

/**
 * 8. Xuất Sổ điểm bộ môn ra CSV
 */
export function exportScoresToCSV(
  students: Student[],
  scores: SubjectScore[],
  subjectCode: string,
  semester: Semester,
  className: string
) {
  const subject = THPT_SUBJECTS.find(s => s.code === subjectCode);
  const subjectName = subject?.name || subjectCode;

  const headers = ['STT', 'Mã HS', 'Họ và tên', 'Tổ', 'TX1', 'TX2', 'TX3', 'TX4', 'GK (x2)', 'CK (x3)', 'ĐTB Môn'];

  const rows = students.map((student, idx) => {
    const sc = scores.find(
      s => s.studentId === student.id && s.subjectCode === subjectCode && s.semester === semester
    );
    const avg = sc ? calculateSubjectAverage(sc) : null;

    return [
      idx + 1,
      `"${student.studentCode}"`,
      `"${student.fullName}"`,
      student.groupNumber,
      sc?.tx1 ?? '',
      sc?.tx2 ?? '',
      sc?.tx3 ?? '',
      sc?.tx4 ?? '',
      sc?.gk ?? '',
      sc?.ck ?? '',
      avg !== null ? avg.toFixed(1) : '',
    ];
  });

  const csvContent = '\uFEFF' + [
    `BẢNG ĐIỂM MÔN ${subjectName.toUpperCase()} - HỌC KỲ: ${semester} - LỚP: ${className}`,
    headers.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\r\n');

  downloadFile(
    csvContent, 
    `BangDiem_${subjectCode}_${semester}_${className}_${new Date().toISOString().slice(0, 10)}.csv`, 
    'text/csv;charset=utf-8;'
  );
}

// =========================================================================
// KIỂM TRA & XÁC THỰC FILE SAO LƯU (VALIDATION ENGINE)
// =========================================================================

/**
 * Kiểm tra tính hợp lệ và toàn vẹn của file backup trước khi khôi phục
 */
export function validateBackupFile(content: any): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || typeof content !== 'object') {
    return {
      isValid: false,
      errors: ['File không phải là một đối tượng JSON hợp lệ hoặc file rỗng.'],
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
    };
  }

  // Nhận dạng loại file
  let students: any[] = [];
  let scores: any[] = [];
  let conductRecords: any[] = [];
  let pointTransactions: any[] = [];
  let pointRules: any[] = [];
  let timetable: any[] = [];
  let learningRecords: any[] = [];
  let hasConfig = false;
  let version = content.version || '1.0';
  let className = content.classroom?.className || content.className;

  if (content.type === 'STUDENTS_EXPORT') {
    students = Array.isArray(content.data) ? content.data : [];
  } else if (content.type === 'POINT_TRANSACTIONS_EXPORT') {
    pointTransactions = Array.isArray(content.data) ? content.data : [];
  } else if (content.type === 'TIMETABLE_EXPORT') {
    timetable = Array.isArray(content.data) ? content.data : [];
  } else if (content.type === 'CONFIGURATION_EXPORT') {
    hasConfig = true;
    pointRules = Array.isArray(content.pointRules) ? content.pointRules : [];
  } else {
    // Full backup hoặc format cũ
    if (Array.isArray(content.students)) students = content.students;
    if (Array.isArray(content.scores)) scores = content.scores;
    if (Array.isArray(content.conductRecords)) conductRecords = content.conductRecords;
    if (Array.isArray(content.pointTransactions)) pointTransactions = content.pointTransactions;
    if (Array.isArray(content.pointRules)) pointRules = content.pointRules;
    if (Array.isArray(content.timetable)) timetable = content.timetable;
    if (Array.isArray(content.learningRecords)) learningRecords = content.learningRecords;
    if (content.classroom || content.classificationConfig) hasConfig = true;
  }

  const totalEntities = 
    students.length + 
    scores.length + 
    conductRecords.length + 
    pointTransactions.length + 
    pointRules.length + 
    timetable.length + 
    learningRecords.length +
    (hasConfig ? 1 : 0);

  if (totalEntities === 0) {
    errors.push('Tệp không chứa bất kỳ thực thể dữ liệu nào hợp lệ (học sinh, điểm, nề nếp, thời khóa biểu hoặc cấu hình).');
  }

  // Kiểm tra cấu trúc học sinh nếu có
  if (students.length > 0) {
    const invalidStudents = students.filter(s => !s || typeof s !== 'object' || (!s.fullName && !s.studentCode));
    if (invalidStudents.length > 0) {
      errors.push(`Có ${invalidStudents.length} bản ghi học sinh thiếu Họ tên hoặc Mã học sinh.`);
    }
  }

  // Kiểm tra cấu trúc thời khóa biểu nếu có
  if (timetable.length > 0) {
    const invalidPeriods = timetable.filter(p => !p || typeof p !== 'object' || !p.dayOfWeek || !p.period || !p.subject);
    if (invalidPeriods.length > 0) {
      errors.push(`Có ${invalidPeriods.length} tiết thời khóa biểu thiếu thông tin bắt buộc (Thứ, Tiết hoặc Môn học).`);
    }
  }

  // Kiểm tra transactions điểm nếu có
  if (pointTransactions.length > 0) {
    const invalidTx = pointTransactions.filter(t => !t || typeof t !== 'object' || t.score === undefined || !t.reason);
    if (invalidTx.length > 0) {
      warnings.push(`Có ${invalidTx.length} giao dịch điểm thiếu thông tin điểm số hoặc lý do.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      version,
      exportedAt: content.exportedAt,
      className,
      studentsCount: students.length,
      scoresCount: scores.length,
      conductCount: conductRecords.length,
      transactionsCount: pointTransactions.length,
      timetableCount: timetable.length,
      rulesCount: pointRules.length,
      learningCount: learningRecords.length,
      hasConfig,
    }
  };
}

// =========================================================================
// KHÔI PHỤC DỮ LIỆU AN TOÀN (SAFE RESTORE ENGINE VỚI DE-DUPLICATION)
// =========================================================================

export interface RestoreOptions {
  autoBackupBeforeRestore?: boolean;
  currentUserUid?: string;
  currentUserEmail?: string;
  currentClassroom?: ClassroomInfo | null;
  currentStudents?: Student[];
  currentScores?: SubjectScore[];
  currentConduct?: ConductRecord[];
  currentTransactions?: WeeklyPointTransaction[];
  currentRules?: PointRule[];
  currentTimetable?: TimetablePeriod[];
}

export interface RestoreResult {
  success: boolean;
  message: string;
  autoBackupId?: string;
  stats: {
    studentsRestored: number;
    scoresRestored: number;
    conductRestored: number;
    transactionsRestored: number;
    timetableRestored: number;
    rulesRestored: number;
  };
}

/**
 * Khôi phục dữ liệu an toàn từ đối tượng parsed JSON
 * Đảm bảo:
 * 1. Tự động tạo backup an toàn nếu được yêu cầu
 * 2. Chống duplicate triệt để bằng khóa document định danh chuẩn
 * 3. Không làm hỏng dữ liệu hiện có nếu lỗi phát sinh
 */
export async function restoreClassDataSafely(
  backupContent: any,
  targetClassId: string,
  options: RestoreOptions = {}
): Promise<RestoreResult> {
  const stats = {
    studentsRestored: 0,
    scoresRestored: 0,
    conductRestored: 0,
    transactionsRestored: 0,
    timetableRestored: 0,
    rulesRestored: 0,
  };

  // 1. Nếu người dùng chọn tự động tạo backup khẩn cấp trước khi khôi phục
  let autoBackupId: string | undefined = undefined;
  if (options.autoBackupBeforeRestore && options.currentClassroom && options.currentUserUid) {
    try {
      const emergencyBackup: FullClassBackup = {
        version: '2.0',
        system: 'QL_LOP_CN_THPT',
        exportedAt: new Date().toISOString(),
        classroom: options.currentClassroom,
        students: options.currentStudents || [],
        scores: options.currentScores || [],
        conductRecords: options.currentConduct || [],
        pointTransactions: options.currentTransactions || [],
        pointRules: options.currentRules || [],
        timetable: options.currentTimetable || [],
      };
      
      autoBackupId = await saveBackupToFirestore(
        targetClassId,
        options.currentClassroom.className || '12A1',
        options.currentClassroom.schoolYear || '2026-2027',
        options.currentUserUid,
        emergencyBackup,
        'Bản sao lưu an toàn tự động trước khi Khôi phục'
      );
    } catch (bkErr) {
      console.warn('Auto emergency backup failed, but proceeding safely:', bkErr);
    }
  }

  // 2. Trích xuất các thực thể từ payload
  let studentsToRestore: Student[] = [];
  let scoresToRestore: SubjectScore[] = [];
  let conductToRestore: ConductRecord[] = [];
  let transactionsToRestore: WeeklyPointTransaction[] = [];
  let rulesToRestore: PointRule[] = [];
  let timetableToRestore: TimetablePeriod[] = [];

  if (backupContent.type === 'STUDENTS_EXPORT') {
    studentsToRestore = backupContent.data || [];
  } else if (backupContent.type === 'POINT_TRANSACTIONS_EXPORT') {
    transactionsToRestore = backupContent.data || [];
  } else if (backupContent.type === 'TIMETABLE_EXPORT') {
    timetableToRestore = backupContent.data || [];
  } else if (backupContent.type === 'CONFIGURATION_EXPORT') {
    rulesToRestore = backupContent.pointRules || [];
  } else {
    // Full backup
    studentsToRestore = backupContent.students || [];
    scoresToRestore = backupContent.scores || [];
    conductToRestore = backupContent.conductRecords || [];
    transactionsToRestore = backupContent.pointTransactions || [];
    rulesToRestore = backupContent.pointRules || [];
    timetableToRestore = backupContent.timetable || [];
  }

  // 3. Thực hiện ghi theo từng batch an toàn (tối đa 400 operations mỗi batch)
  const operations: { ref: any; data: any }[] = [];

  // Học sinh: de-duplication bằng ID hoặc studentCode
  for (const s of studentsToRestore) {
    if (!s || !s.fullName) continue;
    const docId = s.id || `student_${targetClassId}_${s.studentCode || Date.now()}`;
    operations.push({
      ref: doc(db, 'students', docId),
      data: { ...s, id: docId, classId: targetClassId }
    });
    stats.studentsRestored++;
  }

  // Điểm số môn học: de-duplication bằng docId
  for (const score of scoresToRestore) {
    if (!score || !score.studentId) continue;
    const docId = score.id || `score_${targetClassId}_${score.studentId}_${score.subjectCode}_${score.semester}`;
    operations.push({
      ref: doc(db, 'academic_scores', docId),
      data: { ...score, id: docId, classId: targetClassId }
    });
    stats.scoresRestored++;
  }

  // Nề nếp kỷ luật
  for (const c of conductToRestore) {
    if (!c || !c.studentId) continue;
    const docId = c.id || `conduct_${targetClassId}_${c.studentId}_${Date.now()}`;
    operations.push({
      ref: doc(db, 'conduct_records', docId),
      data: { ...c, id: docId, classId: targetClassId }
    });
    stats.conductRestored++;
  }

  // Giao dịch điểm tuần
  for (const tx of transactionsToRestore) {
    if (!tx || !tx.studentId) continue;
    const docId = tx.id || tx.transactionId || `tx_${targetClassId}_${tx.studentId}_${Date.now()}`;
    operations.push({
      ref: doc(db, 'weekly_point_transactions', docId),
      data: { ...tx, id: docId, classId: targetClassId }
    });
    stats.transactionsRestored++;
  }

  // Thời khóa biểu: de-duplication theo Thứ - Buổi - Tiết
  for (const p of timetableToRestore) {
    if (!p || !p.dayOfWeek || !p.period || !p.subject) continue;
    const docId = p.id || `tt_${targetClassId}_d${p.dayOfWeek}_${p.session}_p${p.period}`;
    operations.push({
      ref: doc(db, 'timetable', docId),
      data: { ...p, id: docId, classId: targetClassId }
    });
    stats.timetableRestored++;
  }

  // Quy tắc chấm điểm
  for (const r of rulesToRestore) {
    if (!r || !r.name) continue;
    const docId = r.id || `rule_${targetClassId}_${r.name.replace(/\s+/g, '_')}`;
    operations.push({
      ref: doc(db, 'point_rules', docId),
      data: { ...r, id: docId, classId: targetClassId }
    });
    stats.rulesRestored++;
  }

  // Cấu hình xếp loại nếu có trong file
  if (backupContent.classificationConfig) {
    operations.push({
      ref: doc(db, 'classification_configs', targetClassId),
      data: { ...backupContent.classificationConfig, classId: targetClassId }
    });
  }

  // Chạy các batch tuần tự
  const chunkSize = 400;
  for (let i = 0; i < operations.length; i += chunkSize) {
    const chunk = operations.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const op of chunk) {
      batch.set(op.ref, op.data, { merge: true });
    }
    await batch.commit();
  }

  return {
    success: true,
    message: 'Khôi phục dữ liệu thành công hoàn tất.',
    autoBackupId,
    stats,
  };
}

/**
 * Lưu snapshot sao lưu lên đám mây Firestore
 */
export async function saveBackupToFirestore(
  classId: string,
  className: string,
  schoolYear: string,
  userId: string,
  backupData: FullClassBackup,
  note?: string
): Promise<string> {
  const backupId = `backup_${classId}_${Date.now()}`;
  const backupDocRef = doc(db, 'backups', backupId);

  const payload = {
    id: backupId,
    classId,
    className,
    schoolYear,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    studentsCount: backupData.students?.length || 0,
    scoresCount: backupData.scores?.length || 0,
    conductCount: backupData.conductRecords?.length || 0,
    transactionsCount: backupData.pointTransactions?.length || 0,
    timetableCount: backupData.timetable?.length || 0,
    rulesCount: backupData.pointRules?.length || 0,
    note: note || 'Bản sao lưu đám mây của GVCN',
    data: backupData,
  };

  await setDoc(backupDocRef, payload);
  return backupId;
}

/**
 * Lấy danh sách các bản sao lưu từ Firestore
 */
export async function getBackupsList(classId: string): Promise<BackupMetadata[]> {
  try {
    const q = query(
      collection(db, 'backups'),
      where('classId', '==', classId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: d.id,
        classId: d.classId,
        className: d.className,
        schoolYear: d.schoolYear,
        createdAt: d.createdAt,
        createdBy: d.createdBy,
        studentsCount: d.studentsCount || 0,
        scoresCount: d.scoresCount || 0,
        conductCount: d.conductCount || 0,
        transactionsCount: d.transactionsCount || 0,
        timetableCount: d.timetableCount || 0,
        rulesCount: d.rulesCount || 0,
        note: d.note,
      };
    });
  } catch (err) {
    console.error('Lỗi khi tải danh sách backup:', err);
    return [];
  }
}

/**
 * Khôi phục trực tiếp từ một bản snapshot trên Firestore
 */
export async function restoreFromCloudBackup(backupId: string, targetClassId: string, options: RestoreOptions = {}): Promise<RestoreResult> {
  const backupDoc = await getDoc(doc(db, 'backups', backupId));
  if (!backupDoc.exists()) {
    throw new Error('Không tìm thấy bản sao lưu trên Firestore.');
  }
  const backupData = backupDoc.data().data as FullClassBackup;
  return restoreClassDataSafely(backupData, targetClassId, options);
}

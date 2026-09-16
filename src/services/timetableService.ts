import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { TimetablePeriod, DayOfWeek, TimetableSession, DAYS_OF_WEEK } from '../types/timetable';

export const TIMETABLE_COLLECTION = 'timetable';

/**
 * Sinh ID duy nhất theo tọa độ (Lớp - Thứ - Buổi - Tiết) để chống duplicate tự nhiên
 */
export function generatePeriodDocId(
  classId: string, 
  dayOfWeek: DayOfWeek, 
  session: TimetableSession, 
  period: number
): string {
  return `tt_${classId}_d${dayOfWeek}_${session}_p${period}`;
}

/**
 * Lưu hoặc Cập nhật một tiết học trong Thời khóa biểu
 */
export async function saveTimetablePeriod(
  classId: string,
  data: Omit<TimetablePeriod, 'id' | 'classId'> & { id?: string },
  userEmail?: string
): Promise<TimetablePeriod> {
  const docId = data.id || generatePeriodDocId(classId, data.dayOfWeek, data.session, data.period);
  const docRef = doc(db, TIMETABLE_COLLECTION, docId);

  const payload: TimetablePeriod = {
    id: docId,
    classId,
    dayOfWeek: data.dayOfWeek,
    session: data.session,
    period: data.period,
    subject: data.subject.trim(),
    subjectCode: data.subjectCode || '',
    teacherName: data.teacherName.trim(),
    room: data.room?.trim() || '',
    note: data.note?.trim() || '',
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail || 'GVCN',
  };

  await setDoc(docRef, payload, { merge: true });
  return payload;
}

/**
 * Xóa một tiết học khỏi Thời khóa biểu
 */
export async function deleteTimetablePeriod(periodId: string): Promise<void> {
  const docRef = doc(db, TIMETABLE_COLLECTION, periodId);
  await deleteDoc(docRef);
}

/**
 * Xóa toàn bộ thời khóa biểu của một lớp
 */
export async function clearClassTimetable(classId: string): Promise<void> {
  const q = query(collection(db, TIMETABLE_COLLECTION), where('classId', '==', classId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

/**
 * Lưu hàng loạt tiết học (dùng khi khôi phục hoặc khởi tạo mẫu)
 */
export async function batchSaveTimetable(periods: TimetablePeriod[]): Promise<void> {
  if (periods.length === 0) return;
  
  // Tách thành từng mẻ 400 documents để an toàn với giới hạn batch của Firestore
  const chunkSize = 400;
  for (let i = 0; i < periods.length; i += chunkSize) {
    const chunk = periods.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const p of chunk) {
      const docId = p.id || generatePeriodDocId(p.classId, p.dayOfWeek, p.session, p.period);
      const docRef = doc(db, TIMETABLE_COLLECTION, docId);
      batch.set(docRef, { ...p, id: docId }, { merge: true });
    }
    await batch.commit();
  }
}

/**
 * Tải danh sách tiết học từ Firestore
 */
export async function getTimetableForClass(classId: string): Promise<TimetablePeriod[]> {
  try {
    const q = query(collection(db, TIMETABLE_COLLECTION), where('classId', '==', classId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as TimetablePeriod);
  } catch (err) {
    console.error('Lỗi khi lấy Thời khóa biểu:', err);
    return [];
  }
}

/**
 * Tạo dữ liệu Thời khóa biểu THPT chuẩn mẫu (Thứ 2 -> Thứ 7, sáng và chiều)
 */
export function generateSampleTimetable(classId: string, homeroomTeacher: string): TimetablePeriod[] {
  const periods: TimetablePeriod[] = [
    // === THỨ HAI ===
    { id: generatePeriodDocId(classId, 2, 'morning', 1), classId, dayOfWeek: 2, session: 'morning', period: 1, subject: 'Chào cờ', teacherName: 'BGH & Đoàn trường', room: 'Sân trường', note: 'Đồng phục áo trắng trang nghiêm' },
    { id: generatePeriodDocId(classId, 2, 'morning', 2), classId, dayOfWeek: 2, session: 'morning', period: 2, subject: 'Toán học', teacherName: 'Thầy Trần Quốc Hùng', room: 'P.302' },
    { id: generatePeriodDocId(classId, 2, 'morning', 3), classId, dayOfWeek: 2, session: 'morning', period: 3, subject: 'Toán học', teacherName: 'Thầy Trần Quốc Hùng', room: 'P.302' },
    { id: generatePeriodDocId(classId, 2, 'morning', 4), classId, dayOfWeek: 2, session: 'morning', period: 4, subject: 'Ngữ văn', teacherName: 'Cô Lê Hoàng Mai', room: 'P.302' },
    { id: generatePeriodDocId(classId, 2, 'morning', 5), classId, dayOfWeek: 2, session: 'morning', period: 5, subject: 'Ngữ văn', teacherName: 'Cô Lê Hoàng Mai', room: 'P.302' },
    
    // Thứ Hai Chiều
    { id: generatePeriodDocId(classId, 2, 'afternoon', 1), classId, dayOfWeek: 2, session: 'afternoon', period: 1, subject: 'Toán học', teacherName: 'Thầy Trần Quốc Hùng', room: 'P.302', note: 'Chuyên đề ôn thi TN THPT' },
    { id: generatePeriodDocId(classId, 2, 'afternoon', 2), classId, dayOfWeek: 2, session: 'afternoon', period: 2, subject: 'Toán học', teacherName: 'Thầy Trần Quốc Hùng', room: 'P.302', note: 'Luyện đề trắc nghiệm' },

    // === THỨ BA ===
    { id: generatePeriodDocId(classId, 3, 'morning', 1), classId, dayOfWeek: 3, session: 'morning', period: 1, subject: 'Tiếng Anh', teacherName: 'Cô Nguyễn Thu Hương', room: 'P.302' },
    { id: generatePeriodDocId(classId, 3, 'morning', 2), classId, dayOfWeek: 3, session: 'morning', period: 2, subject: 'Tiếng Anh', teacherName: 'Cô Nguyễn Thu Hương', room: 'P.302' },
    { id: generatePeriodDocId(classId, 3, 'morning', 3), classId, dayOfWeek: 3, session: 'morning', period: 3, subject: 'Vật lí', teacherName: 'Thầy Hoàng Văn Tuấn', room: 'P.302' },
    { id: generatePeriodDocId(classId, 3, 'morning', 4), classId, dayOfWeek: 3, session: 'morning', period: 4, subject: 'Vật lí', teacherName: 'Thầy Hoàng Văn Tuấn', room: 'P.302' },
    { id: generatePeriodDocId(classId, 3, 'morning', 5), classId, dayOfWeek: 3, session: 'morning', period: 5, subject: 'GDQP - AN', teacherName: 'Thầy Đặng Thanh Bình', room: 'Sân trường' },

    // === THỨ TƯ ===
    { id: generatePeriodDocId(classId, 4, 'morning', 1), classId, dayOfWeek: 4, session: 'morning', period: 1, subject: 'Hóa học', teacherName: 'Cô Vũ Thị Lan', room: 'Phòng Lab Hóa' },
    { id: generatePeriodDocId(classId, 4, 'morning', 2), classId, dayOfWeek: 4, session: 'morning', period: 2, subject: 'Hóa học', teacherName: 'Cô Vũ Thị Lan', room: 'Phòng Lab Hóa' },
    { id: generatePeriodDocId(classId, 4, 'morning', 3), classId, dayOfWeek: 4, session: 'morning', period: 3, subject: 'Sinh học', teacherName: 'Cô Phạm Hồng Hà', room: 'P.302' },
    { id: generatePeriodDocId(classId, 4, 'morning', 4), classId, dayOfWeek: 4, session: 'morning', period: 4, subject: 'Lịch sử', teacherName: 'Thầy Đỗ Minh Đức', room: 'P.302' },
    { id: generatePeriodDocId(classId, 4, 'morning', 5), classId, dayOfWeek: 4, session: 'morning', period: 5, subject: 'Địa lí', teacherName: 'Cô Bùi Minh Ngọc', room: 'P.302' },

    // Thứ Tư Chiều
    { id: generatePeriodDocId(classId, 4, 'afternoon', 1), classId, dayOfWeek: 4, session: 'afternoon', period: 1, subject: 'Tiếng Anh', teacherName: 'Cô Nguyễn Thu Hương', room: 'P.302', note: 'Bồi dưỡng kỹ năng Đọc - Hiểu' },
    { id: generatePeriodDocId(classId, 4, 'afternoon', 2), classId, dayOfWeek: 4, session: 'afternoon', period: 2, subject: 'Tiếng Anh', teacherName: 'Cô Nguyễn Thu Hương', room: 'P.302' },

    // === THỨ NĂM ===
    { id: generatePeriodDocId(classId, 5, 'morning', 1), classId, dayOfWeek: 5, session: 'morning', period: 1, subject: 'Toán học', teacherName: 'Thầy Trần Quốc Hùng', room: 'P.302' },
    { id: generatePeriodDocId(classId, 5, 'morning', 2), classId, dayOfWeek: 5, session: 'morning', period: 2, subject: 'Toán học', teacherName: 'Thầy Trần Quốc Hùng', room: 'P.302' },
    { id: generatePeriodDocId(classId, 5, 'morning', 3), classId, dayOfWeek: 5, session: 'morning', period: 3, subject: 'Tin học', teacherName: 'Thầy Ngô Kiến Huy', room: 'Phòng Máy 1' },
    { id: generatePeriodDocId(classId, 5, 'morning', 4), classId, dayOfWeek: 5, session: 'morning', period: 4, subject: 'Ngữ văn', teacherName: 'Cô Lê Hoàng Mai', room: 'P.302' },
    { id: generatePeriodDocId(classId, 5, 'morning', 5), classId, dayOfWeek: 5, session: 'morning', period: 5, subject: 'Công nghệ', teacherName: 'Thầy Đoàn Thanh Tùng', room: 'P.302' },

    // === THỨ SÁU ===
    { id: generatePeriodDocId(classId, 6, 'morning', 1), classId, dayOfWeek: 6, session: 'morning', period: 1, subject: 'Tiếng Anh', teacherName: 'Cô Nguyễn Thu Hương', room: 'P.302' },
    { id: generatePeriodDocId(classId, 6, 'morning', 2), classId, dayOfWeek: 6, session: 'morning', period: 2, subject: 'Hóa học', teacherName: 'Cô Vũ Thị Lan', room: 'P.302' },
    { id: generatePeriodDocId(classId, 6, 'morning', 3), classId, dayOfWeek: 6, session: 'morning', period: 3, subject: 'Sinh học', teacherName: 'Cô Phạm Hồng Hà', room: 'P.302' },
    { id: generatePeriodDocId(classId, 6, 'morning', 4), classId, dayOfWeek: 6, session: 'morning', period: 4, subject: 'GDTC (Thể dục)', teacherName: 'Thầy Nguyễn Trọng Hoàng', room: 'Nhà Đa năng' },
    { id: generatePeriodDocId(classId, 6, 'morning', 5), classId, dayOfWeek: 6, session: 'morning', period: 5, subject: 'GDTC (Thể dục)', teacherName: 'Thầy Nguyễn Trọng Hoàng', room: 'Nhà Đa năng' },

    // Thứ Sáu Chiều
    { id: generatePeriodDocId(classId, 6, 'afternoon', 1), classId, dayOfWeek: 6, session: 'afternoon', period: 1, subject: 'Ngữ văn', teacherName: 'Cô Lê Hoàng Mai', room: 'P.302', note: 'Ôn luyện nghị luận văn học' },
    { id: generatePeriodDocId(classId, 6, 'afternoon', 2), classId, dayOfWeek: 6, session: 'afternoon', period: 2, subject: 'Ngữ văn', teacherName: 'Cô Lê Hoàng Mai', room: 'P.302' },

    // === THỨ BẢY ===
    { id: generatePeriodDocId(classId, 7, 'morning', 1), classId, dayOfWeek: 7, session: 'morning', period: 1, subject: 'Vật lí', teacherName: 'Thầy Hoàng Văn Tuấn', room: 'P.302' },
    { id: generatePeriodDocId(classId, 7, 'morning', 2), classId, dayOfWeek: 7, session: 'morning', period: 2, subject: 'GDKT & PL', teacherName: 'Cô Lương Ngọc Ánh', room: 'P.302' },
    { id: generatePeriodDocId(classId, 7, 'morning', 3), classId, dayOfWeek: 7, session: 'morning', period: 3, subject: 'HĐTN - HN', teacherName: homeroomTeacher || 'GVCN', room: 'P.302' },
    { id: generatePeriodDocId(classId, 7, 'morning', 4), classId, dayOfWeek: 7, session: 'morning', period: 4, subject: 'HĐTN - HN', teacherName: homeroomTeacher || 'GVCN', room: 'P.302' },
    { id: generatePeriodDocId(classId, 7, 'morning', 5), classId, dayOfWeek: 7, session: 'morning', period: 5, subject: 'Sinh hoạt lớp', teacherName: homeroomTeacher || 'GVCN', room: 'P.302', note: 'Tổng kết thi đua tuần và nhận xét' },
  ];

  return periods;
}

/**
 * Xuất Thời khóa biểu ra file CSV (Excel tiếng Việt có BOM)
 */
export function exportTimetableToCSV(periods: TimetablePeriod[], className: string) {
  const headers = ['Buổi', 'Tiết', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  
  const getPeriodContent = (day: DayOfWeek, session: TimetableSession, periodNum: number) => {
    const item = periods.find(p => p.dayOfWeek === day && p.session === session && p.period === periodNum);
    if (!item) return '-';
    return `"${item.subject} (${item.teacherName}${item.room ? ' - ' + item.room : ''})"`;
  };

  const rows: string[] = [];

  // Buổi sáng
  for (let p = 1; p <= 5; p++) {
    const row = [
      'Sáng',
      `Tiết ${p}`,
      ...DAYS_OF_WEEK.map(d => getPeriodContent(d.value, 'morning', p))
    ];
    rows.push(row.join(','));
  }

  // Buổi chiều
  for (let p = 1; p <= 5; p++) {
    const row = [
      'Chiều',
      `Tiết ${p} (${p + 5})`,
      ...DAYS_OF_WEEK.map(d => getPeriodContent(d.value, 'afternoon', p))
    ];
    rows.push(row.join(','));
  }

  const csvContent = '\uFEFF' + [
    `THỜI KHÓA BIỂU - LỚP: ${className.toUpperCase()}`,
    headers.join(','),
    ...rows
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ThoiKhoaBieu_${className}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

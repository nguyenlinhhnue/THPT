export type DayOfWeek = 2 | 3 | 4 | 5 | 6 | 7; // Thứ 2 -> Thứ 7

export type TimetableSession = 'morning' | 'afternoon'; // Buổi sáng (Tiết 1-5), Buổi chiều (Tiết 1-5)

export interface TimetablePeriod {
  id: string; // Document ID duy nhất: vd tt_classId_d2_morning_p1
  classId: string;
  dayOfWeek: DayOfWeek; // 2 -> 7
  session: TimetableSession; // 'morning' | 'afternoon'
  period: number; // 1 -> 5
  subject: string; // Tên môn học
  subjectCode?: string; // Mã môn nếu có (toan, van, anh...)
  teacherName: string; // Giáo viên phụ trách
  room?: string; // Phòng học (P.102, Phòng Tin, Lab, Sân trường...)
  note?: string; // Ghi chú thêm
  updatedAt?: string;
  updatedBy?: string;
}

export interface PeriodTimeSlot {
  period: number;
  startTime: string;
  endTime: string;
  label: string;
}

export const MORNING_TIME_SLOTS: PeriodTimeSlot[] = [
  { period: 1, startTime: '07:00', endTime: '07:45', label: 'Tiết 1' },
  { period: 2, startTime: '07:50', endTime: '08:35', label: 'Tiết 2' },
  { period: 3, startTime: '09:00', endTime: '09:45', label: 'Tiết 3' },
  { period: 4, startTime: '09:50', endTime: '10:35', label: 'Tiết 4' },
  { period: 5, startTime: '10:40', endTime: '11:25', label: 'Tiết 5' },
];

export const AFTERNOON_TIME_SLOTS: PeriodTimeSlot[] = [
  { period: 1, startTime: '13:00', endTime: '13:45', label: 'Tiết 1 (Tiết 6)' },
  { period: 2, startTime: '13:50', endTime: '14:35', label: 'Tiết 2 (Tiết 7)' },
  { period: 3, startTime: '14:55', endTime: '15:40', label: 'Tiết 3 (Tiết 8)' },
  { period: 4, startTime: '15:45', endTime: '16:30', label: 'Tiết 4 (Tiết 9)' },
  { period: 5, startTime: '16:35', endTime: '17:20', label: 'Tiết 5 (Tiết 10)' },
];

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string; shortLabel: string }[] = [
  { value: 2, label: 'Thứ Hai', shortLabel: 'Thứ 2' },
  { value: 3, label: 'Thứ Ba', shortLabel: 'Thứ 3' },
  { value: 4, label: 'Thứ Tư', shortLabel: 'Thứ 4' },
  { value: 5, label: 'Thứ Năm', shortLabel: 'Thứ 5' },
  { value: 6, label: 'Thứ Sáu', shortLabel: 'Thứ 6' },
  { value: 7, label: 'Thứ Bảy', shortLabel: 'Thứ 7' },
];

// Danh sách môn học THPT chuẩn gợi ý
export const SUGGESTED_SUBJECTS: { name: string; category: 'natural' | 'social' | 'foreign' | 'physical' | 'activity'; color: string }[] = [
  { name: 'Toán học', category: 'natural', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { name: 'Ngữ văn', category: 'social', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { name: 'Tiếng Anh', category: 'foreign', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { name: 'Vật lí', category: 'natural', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  { name: 'Hóa học', category: 'natural', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  { name: 'Sinh học', category: 'natural', color: 'bg-green-50 text-green-800 border-green-200' },
  { name: 'Lịch sử', category: 'social', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  { name: 'Địa lí', category: 'social', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { name: 'GDKT & PL', category: 'social', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { name: 'Tin học', category: 'natural', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { name: 'Công nghệ', category: 'natural', color: 'bg-slate-50 text-slate-800 border-slate-200' },
  { name: 'GDTC (Thể dục)', category: 'physical', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  { name: 'GDQP - AN', category: 'physical', color: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
  { name: 'HĐTN - HN', category: 'activity', color: 'bg-violet-50 text-violet-800 border-violet-200' },
  { name: 'Chào cờ', category: 'activity', color: 'bg-red-50 text-red-800 border-red-200 font-bold' },
  { name: 'Sinh hoạt lớp', category: 'activity', color: 'bg-indigo-50 text-indigo-900 border-indigo-300 font-bold' },
];

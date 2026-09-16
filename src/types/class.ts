export interface ClassroomInfo {
  id: string;
  className: string;      // Tên lớp, ví dụ "12A1"
  grade: 10 | 11 | 12;     // Khối lớp
  schoolYear: string;     // Năm học, ví dụ "2025-2026"
  schoolName: string;     // Trường THPT
  teacherId: string;      // UID của GVCN
  teacherName: string;    // Họ và tên GVCN
  teacherEmail: string;   // Email GVCN
  teacherPhone?: string;
  totalStudents?: number; // Sĩ số học sinh
  totalGroups?: number;   // Số tổ trong lớp (mặc định 4 tổ, GVCN có thể cấu hình từ 2 đến 8 tổ)
  notes?: string;         // Thông tin ghi chú của lớp
  isDataLocked: boolean;  // Trạng thái khóa dữ liệu (chỉ GVCN khóa/mở)
  currentWeek: number;    // Tuần học hiện tại (1 - 35)
  currentSemester: 'HK1' | 'HK2';
  baseCompetitionPoints: number; // Điểm khởi đầu mỗi tuần của 1 tổ (thường là 100 điểm)
  createdAt: string;
  updatedAt: string;
}

export type Classroom = ClassroomInfo;

export type Gender = 'nam' | 'nu';

export type StudentStatus = 'dang_hoc' | 'nghi_hoc' | 'chuyen_lop' | 'chuyen_di';

export type ClassRole = 
  | 'thanh_vien'
  | 'hoc_sinh' 
  | 'lop_truong' 
  | 'bi_thu' 
  | 'lop_pho'
  | 'lop_pho_hoc_tap' 
  | 'lop_pho_lao_dong' 
  | 'lop_pho_van_the' 
  | 'pho_bi_thu' 
  | 'to_truong' 
  | 'to_pho';

export interface Student {
  id: string;
  classId: string;
  stt?: number;        // Số thứ tự trong danh sách lớp
  studentCode: string; // Mã học sinh (vd: HS1201)
  fullName: string;
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD
  groupNumber: number; // Nhóm / Tổ: 1, 2, 3, 4
  role: ClassRole;     // Chức vụ trong lớp (chỉ để quản lý, KHÔNG PHẢI TÀI KHOẢN, không có quyền đăng nhập)
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  isUnionMember?: boolean; // Đoàn viên
  notes?: string;
  avatarUrl?: string;
  status: StudentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export const CLASS_ROLES: { value: ClassRole; label: string; badgeColor: string }[] = [
  { value: 'thanh_vien', label: 'Thành viên', badgeColor: 'bg-slate-100 text-slate-700' },
  { value: 'hoc_sinh', label: 'Học sinh', badgeColor: 'bg-slate-100 text-slate-700' },
  { value: 'lop_truong', label: 'Lớp trưởng', badgeColor: 'bg-blue-100 text-blue-800 font-semibold' },
  { value: 'bi_thu', label: 'Bí thư', badgeColor: 'bg-rose-100 text-rose-800 font-semibold' },
  { value: 'lop_pho', label: 'Lớp phó', badgeColor: 'bg-indigo-100 text-indigo-800' },
  { value: 'lop_pho_hoc_tap', label: 'Lớp phó Học tập', badgeColor: 'bg-indigo-100 text-indigo-800' },
  { value: 'lop_pho_lao_dong', label: 'Lớp phó Lao động', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { value: 'lop_pho_van_the', label: 'Lớp phó Văn thể', badgeColor: 'bg-amber-100 text-amber-800' },
  { value: 'pho_bi_thu', label: 'Phó Bí thư', badgeColor: 'bg-pink-100 text-pink-800' },
  { value: 'to_truong', label: 'Tổ trưởng', badgeColor: 'bg-teal-100 text-teal-800' },
  { value: 'to_pho', label: 'Tổ phó', badgeColor: 'bg-cyan-100 text-cyan-800' },
];

export const STUDENT_STATUS_LIST: { value: StudentStatus; label: string; badgeColor: string }[] = [
  { value: 'dang_hoc', label: 'Đang học', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'nghi_hoc', label: 'Nghỉ học', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'chuyen_lop', label: 'Chuyển lớp', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'chuyen_di', label: 'Chuyển trường', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
];

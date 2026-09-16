export type Semester = 'HK1' | 'HK2' | 'CaNam';

export interface SubjectScore {
  id: string;
  classId: string;
  studentId: string;
  subjectCode: string; // 'toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdcd', 'tin'
  subjectName: string;
  semester: Semester;
  schoolYear: string; // vd: '2025-2026'
  
  // Điểm thành phần gốc
  tx1?: number | null; // Thường xuyên 1
  tx2?: number | null; // Thường xuyên 2
  tx3?: number | null; // Thường xuyên 3
  tx4?: number | null; // Thường xuyên 4
  gk?: number | null;  // Giữa kỳ (hệ số 2)
  ck?: number | null;  // Cuối kỳ (hệ số 3)

  updatedAt?: string;
  updatedByTeacher?: string;
}

export interface SubjectDefinition {
  code: string;
  name: string;
  category: 'khoa_hoc_tu_nhien' | 'khoa_hoc_xa_hoi' | 'co_ban' | 'khac';
}

export const THPT_SUBJECTS: SubjectDefinition[] = [
  { code: 'toan', name: 'Toán học', category: 'co_ban' },
  { code: 'van', name: 'Ngữ văn', category: 'co_ban' },
  { code: 'anh', name: 'Tiếng Anh', category: 'co_ban' },
  { code: 'ly', name: 'Vật lí', category: 'khoa_hoc_tu_nhien' },
  { code: 'hoa', name: 'Hóa học', category: 'khoa_hoc_tu_nhien' },
  { code: 'sinh', name: 'Sinh học', category: 'khoa_hoc_tu_nhien' },
  { code: 'su', name: 'Lịch sử', category: 'khoa_hoc_xa_hoi' },
  { code: 'dia', name: 'Địa lí', category: 'khoa_hoc_xa_hoi' },
  { code: 'gdcd', name: 'GDKT & Pháp luật', category: 'khoa_hoc_xa_hoi' },
  { code: 'tin', name: 'Tin học', category: 'khac' },
  { code: 'cong_nghe', name: 'Công nghệ', category: 'khac' },
  { code: 'gdqp', name: 'GDQP & An ninh', category: 'khac' },
];

export type ConductType = 'vi_pham' | 'khen_thuong';

export type ConductCategory = 
  | 'dong_phuc'      // Đồng phục, tác phong, bảng tên
  | 'chuyen_can'     // Đi muộn, vắng không phép
  | 'hoc_tap'        // Quên bài, mất trật tự, điểm 10 kiểm tra miệng
  | 've_sinh'        // Trực nhật, xả rác
  | 'hoat_dong_doan' // Tham gia phong trào Đoàn, văn nghệ
  | 'guong_tot'      // Nhặt được của rơi, giúp bạn
  | 'khac';

export interface ConductRecord {
  id: string;
  classId: string;
  studentId: string;
  groupNumber: number; // Tổ 1, 2, 3, 4
  week: number;        // Tuần 1 đến 35
  month: number;       // Tháng 9 đến 5
  type: ConductType;
  category: ConductCategory;
  description: string;
  points: number;      // Giá trị số điểm (dương nếu khen thưởng, âm nếu vi phạm)
  date: string;        // YYYY-MM-DD
  createdAt: string;
}

export interface ConductRuleTemplate {
  category: ConductCategory;
  label: string;
  defaultPoints: number;
  type: ConductType;
}

export const STANDARD_CONDUCT_RULES: ConductRuleTemplate[] = [
  // Khen thưởng (+ điểm thi đua)
  { category: 'hoc_tap', label: 'Điểm 9, 10 kiểm tra miệng / bảng', defaultPoints: 5, type: 'khen_thuong' },
  { category: 'guong_tot', label: 'Việc tốt / Nhặt được của rơi', defaultPoints: 10, type: 'khen_thuong' },
  { category: 'hoat_dong_doan', label: 'Đạt giải phong trào trường / Đoàn', defaultPoints: 15, type: 'khen_thuong' },
  { category: 've_sinh', label: 'Trực nhật xuất sắc / Lớp sạch sẽ', defaultPoints: 5, type: 'khen_thuong' },

  // Vi phạm (- điểm thi đua)
  { category: 'chuyen_can', label: 'Đi muộn / Trễ học', defaultPoints: -2, type: 'vi_pham' },
  { category: 'dong_phuc', label: 'Sai đồng phục / Không đeo bảng tên / Dép lê', defaultPoints: -2, type: 'vi_pham' },
  { category: 'hoc_tap', label: 'Không thuộc bài / Không làm bài tập', defaultPoints: -3, type: 'vi_pham' },
  { category: 'hoc_tap', label: 'Sử dụng điện thoại trong giờ học', defaultPoints: -5, type: 'vi_pham' },
  { category: 'hoc_tap', label: 'Mất trật tự trong giờ / Bị ghi sổ đầu bài', defaultPoints: -5, type: 'vi_pham' },
  { category: 'chuyen_can', label: 'Nghỉ học không phép / Bỏ tiết', defaultPoints: -10, type: 'vi_pham' },
  { category: 've_sinh', label: 'Trực nhật bẩn / Quên trực nhật', defaultPoints: -5, type: 'vi_pham' },
];

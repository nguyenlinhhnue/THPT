export type TransactionType = 'plus' | 'minus';

export type TransactionStatus = 'valid' | 'voided';

export type TransactionCategory = 
  | 'hoc_tap'        // Phát biểu, điểm kiểm tra, bài tập, sổ đầu bài
  | 'chuyen_can'     // Đi muộn, trễ tiết, nghỉ không phép
  | 'dong_phuc'      // Tác phong, phù hiệu, bảng tên, dép lê
  | 've_sinh'        // Trực nhật, xả rác, vệ sinh lớp
  | 'hoat_dong_doan' // Phong trào Đoàn, văn nghệ, thể thao
  | 'guong_tot'      // Người tốt việc tốt, giúp bạn
  | 'ky_luat'        // Điện thoại, mất trật tự, kỷ luật
  | 'khac';          // Ghi nhận khác

export interface AuditLogEntry {
  action: 'created' | 'updated' | 'voided' | 'restored' | 'deleted';
  by: string;         // Email hoặc tên GVCN
  timestamp: string;  // ISO string
  note?: string;      // Ghi chú lý do thay đổi
  diffSummary?: string; // Tóm tắt thay đổi
}

export interface WeeklyPointTransaction {
  id: string;                    // Firestore Document ID
  transactionId: string;         // Mã giao dịch hiển thị (ví dụ: TX-W12-001)
  studentId: string;             // ID học sinh
  classId: string;               // ID lớp học
  weekId: string;                // ID tuần (ví dụ: "week_12")
  weekNumber: number;            // Tuần 1 đến 35
  date: string;                  // YYYY-MM-DD
  category: TransactionCategory; // Danh mục phân loại
  categoryLabel: string;         // Tên hiển thị danh mục tiếng Việt
  reason: string;                // Nội dung / Lý do cộng trừ điểm
  score: number;                 // Điểm (+2, -3, +5, -10...)
  type: TransactionType;         // 'plus' hoặc 'minus'
  note?: string;                 // Ghi chú thêm của GVCN
  createdBy: string;             // Email GVCN
  createdByName?: string;        // Tên GVCN
  createdAt: string;             // ISO String
  updatedAt: string;             // ISO String
  
  // Snapshots bất biến tại thời điểm phát sinh giao dịch
  studentNameSnapshot: string;   // Tên học sinh
  studentCodeSnapshot: string;   // Mã học sinh (ví dụ: HS1001)
  groupNumberSnapshot: number;   // Tổ thi đua (1, 2, 3, 4)
  
  // Snapshot quy tắc mẫu (nếu chọn từ preset)
  ruleSnapshot?: {
    ruleId?: string;
    label: string;
    defaultScore: number;
    category: string;
  };

  // Trạng thái giao dịch
  status: TransactionStatus;     // 'valid' (hợp lệ) hoặc 'voided' (đã hoàn tác/hủy)
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;

  // Nguồn gốc và học kỳ (hỗ trợ phân loại và truy nguyên)
  origin?: string;
  semester?: 'HK1' | 'HK2' | 'CaNam';

  // Lịch sử Audit Log
  auditLog: AuditLogEntry[];
}

export interface PresetRule {
  id: string;
  label: string;
  category: TransactionCategory;
  categoryLabel: string;
  score: number;
  type: TransactionType;
  description?: string;
}

export const PRESET_POINT_RULES: PresetRule[] = [
  // --- Khen thưởng / Cộng điểm (+) ---
  {
    id: 'r_phat_bieu',
    label: 'Hăng hái phát biểu xây dựng bài',
    category: 'hoc_tap',
    categoryLabel: 'Học tập',
    score: 2,
    type: 'plus',
  },
  {
    id: 'r_diem_10',
    label: 'Đạt điểm 9, 10 kiểm tra miệng / bảng',
    category: 'hoc_tap',
    categoryLabel: 'Học tập',
    score: 5,
    type: 'plus',
  },
  {
    id: 'r_truc_nhat_tot',
    label: 'Trực nhật xuất sắc, lớp sạch đẹp',
    category: 've_sinh',
    categoryLabel: 'Vệ sinh',
    score: 5,
    type: 'plus',
  },
  {
    id: 'r_viec_tot',
    label: 'Gương tốt / Nhặt được của rơi trả lại',
    category: 'guong_tot',
    categoryLabel: 'Gương tốt',
    score: 10,
    type: 'plus',
  },
  {
    id: 'r_phong_trao',
    label: 'Tham gia & đạt giải phong trào Đoàn / Hội thao',
    category: 'hoat_dong_doan',
    categoryLabel: 'Đoàn - Phong trào',
    score: 15,
    type: 'plus',
  },
  {
    id: 'r_giup_ban',
    label: 'Giúp đỡ bạn trong học tập / đôi bạn cùng tiến',
    category: 'guong_tot',
    categoryLabel: 'Gương tốt',
    score: 5,
    type: 'plus',
  },

  // --- Vi phạm / Trừ điểm (-) ---
  {
    id: 'r_di_muon',
    label: 'Đi học muộn / Vào lớp trễ giờ',
    category: 'chuyen_can',
    categoryLabel: 'Chuyên cần',
    score: -2,
    type: 'minus',
  },
  {
    id: 'r_sai_dong_phuc',
    label: 'Sai đồng phục / Không đeo bảng tên / Đi dép lê',
    category: 'dong_phuc',
    categoryLabel: 'Đồng phục - Tác phong',
    score: -2,
    type: 'minus',
  },
  {
    id: 'r_quen_bai',
    label: 'Không thuộc bài / Quên bài tập về nhà',
    category: 'hoc_tap',
    categoryLabel: 'Học tập',
    score: -3,
    type: 'minus',
  },
  {
    id: 'r_mat_trat_tu',
    label: 'Mất trật tự trong giờ / Bị ghi sổ đầu bài',
    category: 'ky_luat',
    categoryLabel: 'Kỷ luật nề nếp',
    score: -5,
    type: 'minus',
  },
  {
    id: 'r_dien_thoai',
    label: 'Sử dụng điện thoại trong giờ học không xin phép',
    category: 'ky_luat',
    categoryLabel: 'Kỷ luật nề nếp',
    score: -5,
    type: 'minus',
  },
  {
    id: 'r_bo_tiet',
    label: 'Nghỉ học không phép / Bỏ tiết học',
    category: 'chuyen_can',
    categoryLabel: 'Chuyên cần',
    score: -10,
    type: 'minus',
  },
  {
    id: 'r_truc_nhat_ban',
    label: 'Trực nhật bẩn / Bỏ trực nhật',
    category: 've_sinh',
    categoryLabel: 'Vệ sinh',
    score: -5,
    type: 'minus',
  },
  {
    id: 'r_xa_rac',
    label: 'Xả rác bừa bãi trong lớp hoặc khuôn viên',
    category: 've_sinh',
    categoryLabel: 'Vệ sinh',
    score: -3,
    type: 'minus',
  },
  {
    id: 'r_vo_le',
    label: 'Thiếu tôn trọng thầy cô / Gây gổ với bạn',
    category: 'ky_luat',
    categoryLabel: 'Kỷ luật nề nếp',
    score: -20,
    type: 'minus',
  },
];

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  hoc_tap: 'Học tập',
  chuyen_can: 'Chuyên cần',
  dong_phuc: 'Đồng phục & Tác phong',
  ve_sinh: 'Vệ sinh & Trực nhật',
  hoat_dong_doan: 'Đoàn & Phong trào',
  guong_tot: 'Gương tốt việc tốt',
  ky_luat: 'Kỷ luật & Nội quy',
  khac: 'Khác',
};

export const CATEGORY_COLOR_MAP: Record<TransactionCategory, { bg: string; text: string; border: string }> = {
  hoc_tap: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  chuyen_can: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  dong_phuc: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  ve_sinh: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  hoat_dong_doan: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  guong_tot: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  ky_luat: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  khac: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

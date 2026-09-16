import { TransactionCategory, TransactionType } from './pointTransaction';

export interface PointRule {
  id: string;                    // Firestore Document ID
  classId: string;               // ID lớp học áp dụng quy tắc
  name: string;                  // Nội dung quy tắc (ví dụ: "Đi học đúng giờ", "Phát biểu xây dựng bài")
  type: TransactionType;         // 'plus' (cộng điểm) | 'minus' (trừ điểm)
  category: TransactionCategory; // Nhóm hành vi
  categoryLabel: string;         // Tên hiển thị nhóm hành vi (ví dụ: "Chuyên cần", "Học tập")
  score: number;                 // Mức điểm (+1, +2, -2, -3...)
  description?: string;          // Mô tả chi tiết / Tiêu chí chấm
  isActive: boolean;             // Trạng thái sử dụng (true: Sử dụng, false: Tạm ngưng)
  order?: number;                // Thứ tự sắp xếp
  createdAt: string;             // ISO Date String
  updatedAt: string;             // ISO Date String
  createdBy?: string;            // Email GVCN thiết lập
}

export interface CreatePointRuleInput {
  name: string;
  type: TransactionType;
  category: TransactionCategory;
  categoryLabel?: string;
  score: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePointRuleInput {
  name?: string;
  type?: TransactionType;
  category?: TransactionCategory;
  categoryLabel?: string;
  score?: number;
  description?: string;
  isActive?: boolean;
}

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  hoc_tap: 'Học tập',
  chuyen_can: 'Chuyên cần',
  dong_phuc: 'Đồng phục - Tác phong',
  ve_sinh: 'Vệ sinh - Lao động',
  hoat_dong_doan: 'Đoàn - Phong trào',
  guong_tot: 'Gương tốt việc tốt',
  ky_luat: 'Kỷ luật nề nếp',
  khac: 'Ghi nhận khác',
};

export const DEFAULT_INITIAL_RULES: Array<Omit<PointRule, 'id' | 'classId' | 'createdAt' | 'updatedAt'>> = [
  // --- Quy tắc cộng điểm (+) ---
  {
    name: 'Đi học đúng giờ',
    type: 'plus',
    category: 'chuyen_can',
    categoryLabel: 'Chuyên cần',
    score: 1,
    description: 'Đến lớp đúng giờ, chuyên cần cả tuần',
    isActive: true,
    order: 1,
  },
  {
    name: 'Phát biểu xây dựng bài',
    type: 'plus',
    category: 'hoc_tap',
    categoryLabel: 'Học tập',
    score: 1,
    description: 'Hăng hái phát biểu xây dựng bài trong tiết học',
    isActive: true,
    order: 2,
  },
  {
    name: 'Giúp đỡ bạn',
    type: 'plus',
    category: 'guong_tot',
    categoryLabel: 'Gương tốt việc tốt',
    score: 2,
    description: 'Đôi bạn cùng tiến, hỗ trợ bạn có hoàn cảnh khó khăn hoặc học yếu',
    isActive: true,
    order: 3,
  },
  {
    name: 'Đạt điểm 9, 10 bài kiểm tra',
    type: 'plus',
    category: 'hoc_tap',
    categoryLabel: 'Học tập',
    score: 5,
    description: 'Đạt điểm giỏi kiểm tra miệng, kiểm tra 15 phút hoặc bài tập lớn',
    isActive: true,
    order: 4,
  },
  {
    name: 'Trực nhật xuất sắc, lớp sạch đẹp',
    type: 'plus',
    category: 've_sinh',
    categoryLabel: 'Vệ sinh - Lao động',
    score: 5,
    description: 'Trực nhật đúng giờ, phòng học sạch sẽ, bàn ghế ngay ngắn',
    isActive: true,
    order: 5,
  },
  {
    name: 'Tham gia & đạt giải phong trào Đoàn',
    type: 'plus',
    category: 'hoat_dong_doan',
    categoryLabel: 'Đoàn - Phong trào',
    score: 5,
    description: 'Đại diện lớp tham gia hội thao, văn nghệ, hoạt động tình nguyện',
    isActive: true,
    order: 6,
  },

  // --- Quy tắc trừ điểm (-) ---
  {
    name: 'Đi học muộn',
    type: 'minus',
    category: 'chuyen_can',
    categoryLabel: 'Chuyên cần',
    score: -2,
    description: 'Vào lớp sau hiệu lệnh chuông báo hoặc trễ giờ truy bài',
    isActive: true,
    order: 7,
  },
  {
    name: 'Không làm bài',
    type: 'minus',
    category: 'hoc_tap',
    categoryLabel: 'Học tập',
    score: -2,
    description: 'Không chuẩn bị bài tập về nhà, không soạn bài',
    isActive: true,
    order: 8,
  },
  {
    name: 'Vi phạm nội quy',
    type: 'minus',
    category: 'ky_luat',
    categoryLabel: 'Kỷ luật nề nếp',
    score: -3,
    description: 'Vi phạm các quy định chung của nhà trường và lớp học',
    isActive: true,
    order: 9,
  },
  {
    name: 'Mất trật tự trong giờ học',
    type: 'minus',
    category: 'ky_luat',
    categoryLabel: 'Kỷ luật nề nếp',
    score: -2,
    description: 'Nói chuyện riêng, làm việc riêng, gây ảnh hưởng giờ học',
    isActive: true,
    order: 10,
  },
  {
    name: 'Sai đồng phục / tác phong',
    type: 'minus',
    category: 'dong_phuc',
    categoryLabel: 'Đồng phục - Tác phong',
    score: -2,
    description: 'Không mang phù hiệu, đi dép lê, trang phục không đúng quy định',
    isActive: true,
    order: 11,
  },
  {
    name: 'Sử dụng điện thoại không xin phép',
    type: 'minus',
    category: 'ky_luat',
    categoryLabel: 'Kỷ luật nề nếp',
    score: -5,
    description: 'Dùng điện thoại trong giờ học khi chưa được giáo viên cho phép',
    isActive: true,
    order: 12,
  },
];

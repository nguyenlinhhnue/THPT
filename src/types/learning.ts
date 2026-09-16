import { Semester } from './score';

export type AssessmentType = 
  | 'mieng'
  | '15_phut'
  | '1_tiet'
  | 'giua_ky'
  | 'cuoi_ky'
  | 'chuyen_de'
  | 'khao_sat'
  | 'khac';

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  mieng: 'Kiểm tra miệng',
  '15_phut': 'Kiểm tra 15 phút',
  '1_tiet': 'Kiểm tra 1 tiết / Định kỳ',
  giua_ky: 'Kiểm tra Giữa kỳ',
  cuoi_ky: 'Kiểm tra Cuối kỳ',
  chuyen_de: 'Chuyên đề / Dự án',
  khao_sat: 'Khảo sát chất lượng',
  khac: 'Đánh giá khác',
};

export const ASSESSMENT_TYPE_BADGES: Record<AssessmentType, { bg: string; text: string; border: string }> = {
  mieng: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '15_phut': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '1_tiet': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  giua_ky: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  cuoi_ky: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  chuyen_de: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  khao_sat: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  khac: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export interface LearningRecord {
  id: string;
  classId: string;
  studentId: string;
  studentNameSnapshot: string;
  studentCodeSnapshot: string;
  groupNumberSnapshot: number;
  subjectCode: string;
  subjectName: string;
  assessmentType: AssessmentType;
  assessmentName: string;
  date: string;           // Định dạng YYYY-MM-DD
  weekNumber: number;     // 1 - 35
  month: string;          // Định dạng YYYY-MM
  semester: Semester;     // 'HK1' | 'HK2' | 'CaNam'
  score: number;          // Thang điểm 0 - 10
  feedback?: string;      // Nhận xét của GVCN/Bộ môn
  achievement?: string;   // Thành tích nổi bật (nếu có)
  supportNeeded?: string; // Nội dung cần hỗ trợ, bồi dưỡng/phụ đạo
  
  // Liên kết hệ thống rèn luyện & thi đua
  hasConductBonus: boolean;
  conductTransactionId?: string | null;
  conductBonusScore?: number;
  originSource: 'learning' | 'conduct_bonus'; // Xác định rõ nguồn gốc dữ liệu
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateLearningRecordInput {
  studentId: string;
  subjectCode: string;
  subjectName?: string;
  assessmentType: AssessmentType;
  assessmentName: string;
  date: string;
  weekNumber?: number;
  semester: Semester;
  score: number;
  feedback?: string;
  achievement?: string;
  supportNeeded?: string;
  
  // Tùy chọn liên kết điểm rèn luyện
  createConductTransaction?: boolean;
  conductBonusScore?: number;
  conductReason?: string;
}

export interface UpdateLearningRecordInput {
  subjectCode?: string;
  subjectName?: string;
  assessmentType?: AssessmentType;
  assessmentName?: string;
  date?: string;
  weekNumber?: number;
  semester?: Semester;
  score?: number;
  feedback?: string;
  achievement?: string;
  supportNeeded?: string;
  
  // Cập nhật transaction rèn luyện liên kết (nếu có)
  updateLinkedConductTransaction?: boolean;
  conductBonusScore?: number;
}

export interface LearningStats {
  averageScore: number;
  totalAssessments: number;
  highestScore: number;
  lowestScore: number;
  scoreDistribution: {
    excellent: number; // >= 9.0
    good: number;      // 8.0 - 8.9
    fair: number;      // 6.5 - 7.9
    average: number;   // 5.0 - 6.4
    weak: number;      // < 5.0
  };
  trend: 'up' | 'down' | 'stable';
  trendDelta: number;
  totalAchievements: number;
  totalSupportNeeded: number;
}

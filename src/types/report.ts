import { Semester } from './score';

export type ReportType = 
  | 'student_list'       // 1. Báo cáo danh sách học sinh
  | 'weekly_points'      // 2. Báo cáo điểm tuần
  | 'monthly_points'     // 3. Báo cáo điểm tháng
  | 'group_competition'  // 4. Báo cáo thi đua tổ
  | 'violations'         // 5. Báo cáo vi phạm
  | 'academic'           // 6. Báo cáo học tập
  | 'classification'     // 7. Báo cáo xếp loại
  | 'individual';        // 8. Báo cáo cá nhân từng học sinh

export interface ReportFilterOptions {
  reportType: ReportType;
  weekNumber: number;                     // 1 - 35
  selectedMonth: string;                  // 'YYYY-MM', vd: '2026-09'
  dateRange: {
    startDate: string;                    // 'YYYY-MM-DD'
    endDate: string;                      // 'YYYY-MM-DD'
  };
  selectedStudentId: string;              // Dành cho báo cáo cá nhân
  groupNumber: number | 'all';            // 'all' | 1 | 2 | 3 | 4
  semester: Semester;                     // 'HK1' | 'HK2' | 'CaNam'
  paperOrientation: 'portrait' | 'landscape';
}

export interface ReportMetadata {
  id: ReportType;
  title: string;
  shortTitle: string;
  description: string;
  defaultOrientation: 'portrait' | 'landscape';
  badgeColor: string;
}

export const REPORT_TYPES_METADATA: Record<ReportType, ReportMetadata> = {
  student_list: {
    id: 'student_list',
    title: 'Báo Cáo Danh Sách Học Sinh',
    shortTitle: 'Danh sách HS',
    description: 'Bảng tổng hợp trích xuất danh sách lớp, thông tin liên lạc, tổ, chức vụ và đoàn thể',
    defaultOrientation: 'landscape',
    badgeColor: 'text-teal-700 bg-teal-50 border-teal-200',
  },
  weekly_points: {
    id: 'weekly_points',
    title: 'Báo Cáo Điểm Thi Đua & Nề Nếp Tuần',
    shortTitle: 'Điểm tuần',
    description: 'Bảng điểm chuẩn, điểm cộng/trừ và xếp loại thi đua nề nếp từng học sinh theo tuần',
    defaultOrientation: 'portrait',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  monthly_points: {
    id: 'monthly_points',
    title: 'Báo Cáo Điểm Thi Đua & Nề Nếp Tháng',
    shortTitle: 'Điểm tháng',
    description: 'Tổng hợp điểm rèn luyện, số lượt vi phạm/khen thưởng và xếp loại trong tháng',
    defaultOrientation: 'portrait',
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  group_competition: {
    id: 'group_competition',
    title: 'Báo Cáo Thi Đua Giữa Các Tổ',
    shortTitle: 'Thi đua tổ',
    description: 'Bảng xếp hạng 4 tổ thi đua, so sánh điểm số, vi phạm, khen thưởng và học tập',
    defaultOrientation: 'portrait',
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
  violations: {
    id: 'violations',
    title: 'Báo Cáo Vi Phạm Nề Nếp & Kỷ Luật',
    shortTitle: 'Vi phạm',
    description: 'Báo cáo chi tiết các lỗi vi phạm, phân loại theo nội quy, thời gian và học sinh',
    defaultOrientation: 'landscape',
    badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
  },
  academic: {
    id: 'academic',
    title: 'Báo Cáo Kết Quả Học Tập & Kiểm Tra',
    shortTitle: 'Học tập',
    description: 'Tổng hợp kết quả kiểm tra định kỳ & thường xuyên, phổ điểm và danh sách bồi dưỡng',
    defaultOrientation: 'landscape',
    badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  classification: {
    id: 'classification',
    title: 'Báo Cáo Xếp Loại Rèn Luyện & Học Lực',
    shortTitle: 'Xếp loại',
    description: 'Bảng xếp loại học sinh theo tiêu chí thi đua kết hợp nề nếp và học lực chuẩn',
    defaultOrientation: 'landscape',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  individual: {
    id: 'individual',
    title: 'Báo Cáo Đánh Giá Cá Nhân Học Sinh',
    shortTitle: 'Cá nhân HS',
    description: 'Hồ sơ rèn luyện cá nhân chi tiết: điểm từng tuần, vi phạm, học tập, xếp loại và nhận xét',
    defaultOrientation: 'portrait',
    badgeColor: 'text-teal-800 bg-teal-50 border-teal-200',
  },
};

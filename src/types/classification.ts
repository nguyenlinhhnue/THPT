import { Semester } from './score';

export type ClassificationPeriodType = 'week' | 'month' | 'semester';

export interface ClassificationTier {
  id: string;
  name: string;
  minScore: number;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'slate';
  description?: string;
}

export interface ClassificationCriteriaConfig {
  classId: string;
  tiers: ClassificationTier[];
  
  // Tiêu chí & Điều kiện đủ dữ liệu
  minWeeksRequiredForMonth: number;
  minWeeksRequiredForSemester: number;
  requireTransactionsExist: boolean;
  minTransactionsRequired: number;
  requireAcademicData: boolean;
  
  updatedAt: string;
  updatedBy: string;
}

export interface TraceabilitySourceInfo {
  sourceTransactionIds: string[];
  sourceTransactionCount: number;
  sourceSnapshotTimestamp: string;
  sourceNetPointsSnapshot: number;
  sourceViolationsCountSnapshot: number;
  sourceRewardsCountSnapshot: number;
}

export interface StudentClassificationResult {
  studentId: string;
  studentName: string;
  studentCode: string;
  stt: number;
  groupNumber: number;
  
  periodType: ClassificationPeriodType;
  weekNumber?: number;
  month?: string;
  semester?: Semester;
  
  // Kiểm tra đủ dữ liệu
  isSufficientData: boolean;
  insufficientReason?: string;
  
  // Điểm lấy trực tiếp từ transactions
  baseScore: number;
  netScore: number;
  totalPlusScore: number;
  totalMinusScore: number;
  violationsCount: number;
  rewardsCount: number;
  
  // Kết quả học tập trong kỳ nếu có
  academicScoreAverage?: number;
  academicTestsCount: number;
  academicAchievementsCount: number;
  academicSupportCount: number;
  
  // Xếp loại & Nhận xét
  rankName: string; // 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' | 'Chưa đủ dữ liệu' | custom name
  tierId?: string;
  badgeColor: string;
  teacherComment: string;
  
  // Dấu vết dữ liệu gốc (Traceability)
  traceability: TraceabilitySourceInfo;
  hasSourceDataChanged?: boolean;
  sourceDataChangeDiff?: number;
}

export interface OfficialClassificationDoc {
  id: string; // e.g. `${classId}_week_${weekNumber}` or `${classId}_month_${month}`
  classId: string;
  periodType: ClassificationPeriodType;
  periodKey: string;
  periodLabel: string;
  
  isLocked: boolean;
  lockedAt: string;
  lockedBy: string;
  lockedByName: string;
  unlockedAt?: string;
  unlockedBy?: string;
  
  configSnapshot: ClassificationCriteriaConfig;
  studentResults: StudentClassificationResult[];
  
  summaryStats: {
    totalStudents: number;
    sufficientCount: number;
    insufficientCount: number;
    tierCounts: Record<string, number>;
    averageScore: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Cấu hình mặc định mẫu
export const DEFAULT_CLASSIFICATION_TIERS: ClassificationTier[] = [
  {
    id: 'tier_tot',
    name: 'Tốt',
    minScore: 90,
    badgeColor: 'emerald',
    description: 'Rèn luyện xuất sắc, không vi phạm nghiêm trọng',
  },
  {
    id: 'tier_kha',
    name: 'Khá',
    minScore: 80,
    badgeColor: 'blue',
    description: 'Ý thức rèn luyện tốt, vi phạm ít',
  },
  {
    id: 'tier_dat',
    name: 'Đạt',
    minScore: 65,
    badgeColor: 'amber',
    description: 'Đáp ứng yêu cầu nề nếp cơ bản',
  },
  {
    id: 'tier_chua_dat',
    name: 'Chưa đạt',
    minScore: 0,
    badgeColor: 'rose',
    description: 'Cần cố gắng rèn luyện, nhắc nhở đặc biệt',
  },
];

export const DEFAULT_CLASSIFICATION_CONFIG: Omit<ClassificationCriteriaConfig, 'classId'> = {
  tiers: DEFAULT_CLASSIFICATION_TIERS,
  minWeeksRequiredForMonth: 2,
  minWeeksRequiredForSemester: 8,
  requireTransactionsExist: false,
  minTransactionsRequired: 0,
  requireAcademicData: false,
  updatedAt: new Date().toISOString(),
  updatedBy: 'Hệ thống',
};

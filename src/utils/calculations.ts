import { SubjectScore } from '../types/score';
import { ConductRecord } from '../types/conduct';
import { Student } from '../types/student';
import { WeeklyPointTransaction } from '../types/pointTransaction';

/**
 * Tính điểm tuần của 1 học sinh theo kiến trúc Transaction:
 * Điểm tuần = tổng tất cả transaction hợp lệ của học sinh trong tuần.
 */
export function calculateStudentWeeklyTransactionScore(
  transactions: WeeklyPointTransaction[],
  studentId: string,
  weekNumber: number
): {
  totalScore: number;
  plusPoints: number;
  minusPoints: number;
  plusCount: number;
  minusCount: number;
  totalTransactions: number;
} {
  const studentWeekTxs = transactions.filter(
    tx => tx.studentId === studentId && tx.weekNumber === weekNumber && tx.status === 'valid'
  );

  let plus = 0;
  let minus = 0;
  let pCount = 0;
  let mCount = 0;

  for (const tx of studentWeekTxs) {
    if (tx.score >= 0) {
      plus += tx.score;
      pCount++;
    } else {
      minus += Math.abs(tx.score);
      mCount++;
    }
  }

  return {
    totalScore: plus - minus,
    plusPoints: plus,
    minusPoints: minus,
    plusCount: pCount,
    minusCount: mCount,
    totalTransactions: studentWeekTxs.length,
  };
}

export interface GroupCompetitionResult {
  groupNumber: number;
  basePoints: number;
  plusPoints: number;
  minusPoints: number;
  totalPoints: number;
  averagePoints: number;
  violationsCount: number;
  rewardsCount: number;
  studentsCount: number;
  rank: number;
}

export type CompetitionFilterMode = 'week' | 'month' | 'range';

export interface CompetitionFilterOptions {
  mode: CompetitionFilterMode;
  week?: number;
  month?: string; // "YYYY-MM" or "1".."12"
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
}

/**
 * Tính điểm thi đua các tổ trực tiếp từ các Transaction điểm:
 * - Hỗ trợ lọc theo Tuần, Tháng, hoặc Khoảng thời gian tự do.
 * - Tính tổng điểm tổ dựa trên danh sách học sinh thuộc tổ hiện tại.
 * - Khi chuyển học sinh từ Tổ 1 sang Tổ 2, dữ liệu lập tức cập nhật theo cấu hình mới,
 *   đồng thời transaction vẫn giữ groupNumberSnapshot lịch sử.
 * - Hỗ trợ số tổ động (từ 2 đến 8 tổ, mặc định 4 tổ).
 */
export function calculateCompetitionFromTransactions(
  transactions: WeeklyPointTransaction[],
  students: Student[],
  filter: CompetitionFilterOptions,
  basePoints: number = 100,
  totalGroups: number = 4
): GroupCompetitionResult[] {
  const numGroups = Math.max(2, Math.min(8, totalGroups || 4));
  const groups = Array.from({ length: numGroups }, (_, i) => i + 1);

  // Lọc transactions hợp lệ theo khoảng thời gian được chọn
  const validTxs = transactions.filter(t => {
    if (t.status !== 'valid') return false;

    if (filter.mode === 'week') {
      return t.weekNumber === (filter.week || 1);
    }

    if (filter.mode === 'month') {
      if (!filter.month) return true;
      // Hỗ trợ cả định dạng "YYYY-MM" và định dạng số tháng "9".."12"
      if (filter.month.includes('-')) {
        return t.date.startsWith(filter.month);
      }
      const m = parseInt(filter.month, 10);
      const txMonth = new Date(t.date).getMonth() + 1;
      return txMonth === m;
    }

    if (filter.mode === 'range') {
      const txDate = t.date;
      if (filter.startDate && txDate < filter.startDate) return false;
      if (filter.endDate && txDate > filter.endDate) return false;
      return true;
    }

    return true;
  });

  const results: GroupCompetitionResult[] = groups.map(groupNumber => {
    // Học sinh thuộc tổ tại thời điểm hiện tại
    const groupStudents = students.filter(s => s.groupNumber === groupNumber && s.status === 'dang_hoc');
    const studentIdSet = new Set(groupStudents.map(s => s.id));

    // Điểm tổ tính dựa trên dữ liệu học sinh thuộc tổ đó
    const groupTxs = validTxs.filter(t => studentIdSet.has(t.studentId));

    let plus = 0;
    let minus = 0;
    let vCount = 0;
    let rCount = 0;

    for (const tx of groupTxs) {
      if (tx.score >= 0) {
        plus += tx.score;
        rCount++;
      } else {
        minus += Math.abs(tx.score);
        vCount++;
      }
    }

    const total = basePoints + plus - minus;
    const avg = groupStudents.length > 0 
      ? Math.round((total / groupStudents.length) * 10) / 10 
      : basePoints;

    return {
      groupNumber,
      basePoints,
      plusPoints: plus,
      minusPoints: minus,
      totalPoints: total,
      averagePoints: avg,
      violationsCount: vCount,
      rewardsCount: rCount,
      studentsCount: groupStudents.length,
      rank: 0,
    };
  });

  // Xếp hạng: Điểm cao xếp trước, nếu bằng điểm thì tổ ít vi phạm hơn xếp trước, nếu bằng tiếp thì nhiều thành tích hơn
  results.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (a.violationsCount !== b.violationsCount) {
      return a.violationsCount - b.violationsCount;
    }
    return b.rewardsCount - a.rewardsCount;
  });

  // Gán rank 1..N
  results.forEach((item, index) => {
    item.rank = index + 1;
  });

  return results.sort((a, b) => a.groupNumber - b.groupNumber);
}

/**
 * Tính điểm thi đua các tổ trực tiếp từ các Transaction điểm tuần (Hàm tương thích tuần)
 */
export function calculateWeeklyCompetitionFromTransactions(
  transactions: WeeklyPointTransaction[],
  students: Student[],
  week: number,
  basePoints: number = 100,
  totalGroups: number = 4
): GroupCompetitionResult[] {
  return calculateCompetitionFromTransactions(
    transactions,
    students,
    { mode: 'week', week },
    basePoints,
    totalGroups
  );
}

/**
 * Tính điểm trung bình môn học theo quy chế THPT (Thông tư 22/2021/BGDĐT):
 * ĐTBmhk = (Tổng điểm ĐĐGtx + 2 * Điểm ĐĐGgk + 3 * Điểm ĐĐGck) / (Số ĐĐGtx + 5)
 */
export function calculateSubjectAverage(score?: Partial<SubjectScore> | null): number | null {
  if (!score) return null;

  const txList: number[] = [];
  if (typeof score.tx1 === 'number' && !isNaN(score.tx1)) txList.push(score.tx1);
  if (typeof score.tx2 === 'number' && !isNaN(score.tx2)) txList.push(score.tx2);
  if (typeof score.tx3 === 'number' && !isNaN(score.tx3)) txList.push(score.tx3);
  if (typeof score.tx4 === 'number' && !isNaN(score.tx4)) txList.push(score.tx4);

  const hasGk = typeof score.gk === 'number' && !isNaN(score.gk);
  const hasCk = typeof score.ck === 'number' && !isNaN(score.ck);

  // Phải có ít nhất điểm CK và 1 điểm TX mới tính được ĐTB dự kiến
  if (!hasCk && !hasGk && txList.length === 0) return null;

  let totalPoints = 0;
  let totalWeights = 0;

  for (const tx of txList) {
    totalPoints += tx;
    totalWeights += 1;
  }

  if (hasGk) {
    totalPoints += score.gk! * 2;
    totalWeights += 2;
  }

  if (hasCk) {
    totalPoints += score.ck! * 3;
    totalWeights += 3;
  }

  if (totalWeights === 0) return null;

  const avg = totalPoints / totalWeights;
  return Math.round(avg * 10) / 10; // Làm tròn 1 chữ số thập phân
}

/**
 * Tính điểm trung bình tất cả các môn của 1 học sinh
 */
export function calculateOverallAverage(scores: SubjectScore[]): number | null {
  if (!scores || scores.length === 0) return null;

  let sum = 0;
  let count = 0;

  for (const s of scores) {
    const subAvg = calculateSubjectAverage(s);
    if (subAvg !== null) {
      sum += subAvg;
      count++;
    }
  }

  if (count === 0) return null;
  return Math.round((sum / count) * 10) / 10;
}

export type AcademicRating = 'XuatSac' | 'Gioi' | 'Kha' | 'Dat' | 'ChuaDat' | 'ChuaDuDiem';

/**
 * Xếp loại kết quả học tập (Thông tư 22/2021/BGDĐT cho THPT)
 */
export function classifyAcademicRating(overallAvg: number | null, scores: SubjectScore[]): {
  rating: AcademicRating;
  label: string;
  badgeClass: string;
} {
  if (overallAvg === null || scores.length < 3) {
    return { rating: 'ChuaDuDiem', label: 'Chưa đủ điểm', badgeClass: 'bg-slate-100 text-slate-600' };
  }

  const subjectAverages = scores
    .map(s => calculateSubjectAverage(s))
    .filter((a): a is number => a !== null);

  const minSubjectAvg = subjectAverages.length > 0 ? Math.min(...subjectAverages) : 0;
  const countHighAvg = subjectAverages.filter(a => a >= 9.0).length;

  if (overallAvg >= 9.0 && minSubjectAvg >= 6.5 && countHighAvg >= 6) {
    return { rating: 'XuatSac', label: 'Xuất sắc', badgeClass: 'bg-purple-100 text-purple-800 font-semibold' };
  }
  if (overallAvg >= 8.0 && minSubjectAvg >= 6.5) {
    return { rating: 'Gioi', label: 'Giỏi', badgeClass: 'bg-emerald-100 text-emerald-800 font-semibold' };
  }
  if (overallAvg >= 6.5 && minSubjectAvg >= 5.0) {
    return { rating: 'Kha', label: 'Khá', badgeClass: 'bg-blue-100 text-blue-800' };
  }
  if (overallAvg >= 5.0 && minSubjectAvg >= 3.5) {
    return { rating: 'Dat', label: 'Đạt', badgeClass: 'bg-amber-100 text-amber-800' };
  }
  return { rating: 'ChuaDat', label: 'Chưa đạt', badgeClass: 'bg-rose-100 text-rose-800' };
}

/**
 * Thống kê tổng hợp nề nếp của 1 học sinh theo tuần
 */
export function calculateStudentConductStats(
  records: ConductRecord[],
  studentId: string,
  week?: number
) {
  const filtered = records.filter(
    r => r.studentId === studentId && (week === undefined || r.week === week)
  );

  let plusPoints = 0;
  let minusPoints = 0;
  let violationsCount = 0;
  let rewardsCount = 0;

  for (const r of filtered) {
    if (r.type === 'khen_thuong' || r.points > 0) {
      plusPoints += Math.abs(r.points);
      rewardsCount++;
    } else {
      minusPoints += Math.abs(r.points);
      violationsCount++;
    }
  }

  return {
    plusPoints,
    minusPoints,
    netPoints: plusPoints - minusPoints,
    violationsCount,
    rewardsCount,
    recordsCount: filtered.length,
  };
}

/**
 * Tính điểm thi đua tuần cho 4 tổ
 * Công thức: Điểm tổng = Điểm xuất phát (100) + Tổng điểm cộng tổ - Tổng điểm trừ tổ
 */
export function calculateWeeklyCompetition(
  records: ConductRecord[],
  students: Student[],
  week: number,
  basePoints: number = 100,
  totalGroups: number = 4
): GroupCompetitionResult[] {
  const numGroups = Math.max(2, Math.min(8, totalGroups || 4));
  const groups = Array.from({ length: numGroups }, (_, i) => i + 1);

  const results: GroupCompetitionResult[] = groups.map(groupNumber => {
    const groupStudents = students.filter(s => s.groupNumber === groupNumber && s.status === 'dang_hoc');
    const groupRecords = records.filter(r => r.groupNumber === groupNumber && r.week === week);

    let plus = 0;
    let minus = 0;
    let vCount = 0;
    let rCount = 0;

    for (const rec of groupRecords) {
      if (rec.type === 'khen_thuong' || rec.points > 0) {
        plus += Math.abs(rec.points);
        rCount++;
      } else {
        minus += Math.abs(rec.points);
        vCount++;
      }
    }

    const total = basePoints + plus - minus;
    const avg = groupStudents.length > 0
      ? Math.round((total / groupStudents.length) * 10) / 10
      : basePoints;

    return {
      groupNumber,
      basePoints,
      plusPoints: plus,
      minusPoints: minus,
      totalPoints: total,
      averagePoints: avg,
      violationsCount: vCount,
      rewardsCount: rCount,
      studentsCount: groupStudents.length,
      rank: 0,
    };
  });

  // Xếp hạng: Điểm cao xếp trước, nếu bằng điểm thì tổ ít vi phạm hơn xếp trước
  results.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.violationsCount - b.violationsCount;
  });

  // Gán rank 1..4
  results.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Trả về thứ tự theo tổ 1, 2, 3, 4 kèm thứ hạng
  return results.sort((a, b) => a.groupNumber - b.groupNumber);
}

/**
 * Xếp loại rèn luyện (Hạnh kiểm) theo điểm nề nếp kỳ/năm
 */
export function classifyConductRating(netConductPoints: number): {
  label: string;
  badgeClass: string;
} {
  if (netConductPoints >= 10) {
    return { label: 'Tốt', badgeClass: 'bg-emerald-100 text-emerald-800 font-medium' };
  }
  if (netConductPoints >= -5) {
    return { label: 'Khá', badgeClass: 'bg-blue-100 text-blue-800 font-medium' };
  }
  if (netConductPoints >= -20) {
    return { label: 'Đạt', badgeClass: 'bg-amber-100 text-amber-800 font-medium' };
  }
  return { label: 'Chưa đạt', badgeClass: 'bg-rose-100 text-rose-800 font-medium' };
}

export type AttendanceStatus = 'co_mat' | 'co_phep' | 'khong_phep' | 'di_muon';

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  session: 'sang' | 'chieu';
  status: AttendanceStatus;
  reason?: string;
  updatedAt?: string;
}

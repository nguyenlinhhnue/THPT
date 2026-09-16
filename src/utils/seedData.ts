import { Student } from '../types/student';
import { SubjectScore } from '../types/score';
import { ConductRecord } from '../types/conduct';

export const SAMPLE_STUDENTS_DATA: Omit<Student, 'id' | 'classId' | 'createdAt' | 'updatedAt'>[] = [
  // Tổ 1
  {
    studentCode: 'HS1201',
    fullName: 'Nguyễn Hoàng Minh',
    gender: 'nam',
    dateOfBirth: '2008-03-15',
    groupNumber: 1,
    role: 'lop_truong',
    phone: '0912345671',
    parentName: 'Nguyễn Văn Hùng',
    parentPhone: '0987654321',
    address: '12 Lê Lợi, Phường 1',
    isUnionMember: true,
    status: 'dang_hoc',
    notes: 'Học sinh gương mẫu, quản lý tốt'
  },
  {
    studentCode: 'HS1202',
    fullName: 'Trần Thị Mai Anh',
    gender: 'nu',
    dateOfBirth: '2008-05-20',
    groupNumber: 1,
    role: 'to_truong',
    phone: '0912345672',
    parentName: 'Trần Văn Bình',
    parentPhone: '0987654322',
    address: '45 Trần Phú',
    isUnionMember: true,
    status: 'dang_hoc',
    notes: 'Tổ trưởng gương mẫu'
  },
  {
    studentCode: 'HS1203',
    fullName: 'Lê Gia Huy',
    gender: 'nam',
    dateOfBirth: '2008-11-02',
    groupNumber: 1,
    role: 'hoc_sinh',
    phone: '0912345673',
    parentName: 'Lê Văn Cường',
    parentPhone: '0987654323',
    address: '78 Nguyễn Trãi',
    isUnionMember: true,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1204',
    fullName: 'Phạm Quỳnh Chi',
    gender: 'nu',
    dateOfBirth: '2008-08-14',
    groupNumber: 1,
    role: 'hoc_sinh',
    phone: '0912345674',
    parentName: 'Phạm Đức Dũng',
    parentPhone: '0987654324',
    address: '102 Hoàng Diệu',
    isUnionMember: false,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1205',
    fullName: 'Vũ Đức Duy',
    gender: 'nam',
    dateOfBirth: '2008-02-28',
    groupNumber: 1,
    role: 'hoc_sinh',
    phone: '0912345675',
    parentName: 'Vũ Quang Đạt',
    parentPhone: '0987654325',
    address: '24 Hai Bà Trưng',
    isUnionMember: true,
    status: 'dang_hoc',
  },

  // Tổ 2
  {
    studentCode: 'HS1206',
    fullName: 'Đặng Ngọc Linh',
    gender: 'nu',
    dateOfBirth: '2008-09-09',
    groupNumber: 2,
    role: 'bi_thu',
    phone: '0912345676',
    parentName: 'Đặng Quốc Hưng',
    parentPhone: '0987654326',
    address: '56 Phan Chu Trinh',
    isUnionMember: true,
    status: 'dang_hoc',
    notes: 'Bí thư năng nổ nhiệt huyết'
  },
  {
    studentCode: 'HS1207',
    fullName: 'Hoàng Quốc Bảo',
    gender: 'nam',
    dateOfBirth: '2008-04-18',
    groupNumber: 2,
    role: 'to_truong',
    phone: '0912345677',
    parentName: 'Hoàng Hải Hà',
    parentPhone: '0987654327',
    address: '89 Quang Trung',
    isUnionMember: true,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1208',
    fullName: 'Bùi Phương Thảo',
    gender: 'nu',
    dateOfBirth: '2008-12-25',
    groupNumber: 2,
    role: 'lop_pho_hoc_tap',
    phone: '0912345678',
    parentName: 'Bùi Văn Kính',
    parentPhone: '0987654328',
    address: '15 Nguyễn Huệ',
    isUnionMember: true,
    status: 'dang_hoc',
    notes: 'Học giỏi Toán, hỗ trợ các bạn kèm cặp'
  },
  {
    studentCode: 'HS1209',
    fullName: 'Đỗ Tuấn Kiệt',
    gender: 'nam',
    dateOfBirth: '2008-07-03',
    groupNumber: 2,
    role: 'hoc_sinh',
    phone: '0912345679',
    parentName: 'Đỗ Mạnh Long',
    parentPhone: '0987654329',
    address: '33 Đinh Tiên Hoàng',
    isUnionMember: false,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1210',
    fullName: 'Ngô Bảo Châu',
    gender: 'nu',
    dateOfBirth: '2008-01-19',
    groupNumber: 2,
    role: 'hoc_sinh',
    phone: '0912345680',
    parentName: 'Ngô Thanh Nam',
    parentPhone: '0987654330',
    address: '67 Lý Thường Kiệt',
    isUnionMember: true,
    status: 'dang_hoc',
  },

  // Tổ 3
  {
    studentCode: 'HS1211',
    fullName: 'Dương Văn Nam',
    gender: 'nam',
    dateOfBirth: '2008-06-12',
    groupNumber: 3,
    role: 'to_truong',
    phone: '0912345681',
    parentName: 'Dương Đình Phúc',
    parentPhone: '0987654331',
    address: '90 Bà Triệu',
    isUnionMember: true,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1212',
    fullName: 'Phan Khánh Vy',
    gender: 'nu',
    dateOfBirth: '2008-10-30',
    groupNumber: 3,
    role: 'lop_pho_van_the',
    phone: '0912345682',
    parentName: 'Phan Hữu Quân',
    parentPhone: '0987654332',
    address: '14 Điện Biên Phủ',
    isUnionMember: true,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1213',
    fullName: 'Võ Minh Quân',
    gender: 'nam',
    dateOfBirth: '2008-03-05',
    groupNumber: 3,
    role: 'hoc_sinh',
    phone: '0912345683',
    parentName: 'Võ Thành Sơn',
    parentPhone: '0987654333',
    address: '52 Hùng Vương',
    isUnionMember: false,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1214',
    fullName: 'Trịnh Thúy Hằng',
    gender: 'nu',
    dateOfBirth: '2008-08-22',
    groupNumber: 3,
    role: 'hoc_sinh',
    phone: '0912345684',
    parentName: 'Trịnh Xuân Thắng',
    parentPhone: '0987654334',
    address: '76 Pasteurs',
    isUnionMember: true,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1215',
    fullName: 'Lý Quốc Thịnh',
    gender: 'nam',
    dateOfBirth: '2008-05-14',
    groupNumber: 3,
    role: 'hoc_sinh',
    phone: '0912345685',
    parentName: 'Lý Văn Trung',
    parentPhone: '0987654335',
    address: '110 Nam Kỳ Khởi Nghĩa',
    isUnionMember: false,
    status: 'dang_hoc',
  },

  // Tổ 4
  {
    studentCode: 'HS1216',
    fullName: 'Nguyễn Tấn Đạt',
    gender: 'nam',
    dateOfBirth: '2008-02-10',
    groupNumber: 4,
    role: 'lop_pho_lao_dong',
    phone: '0912345686',
    parentName: 'Nguyễn Tấn Vinh',
    parentPhone: '0987654336',
    address: '88 Lê Duẩn',
    isUnionMember: true,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1217',
    fullName: 'Lâm Thùy Trang',
    gender: 'nu',
    dateOfBirth: '2008-09-17',
    groupNumber: 4,
    role: 'to_truong',
    phone: '0912345687',
    parentName: 'Lâm Văn Vũ',
    parentPhone: '0987654337',
    address: '42 Tôn Đức Thắng',
    isUnionMember: true,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1218',
    fullName: 'Đinh Trọng Tấn',
    gender: 'nam',
    dateOfBirth: '2008-12-08',
    groupNumber: 4,
    role: 'hoc_sinh',
    phone: '0912345688',
    parentName: 'Đinh Trọng An',
    parentPhone: '0987654338',
    address: '95 Võ Văn Tần',
    isUnionMember: true,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1219',
    fullName: 'Lê Hồng Nhung',
    gender: 'nu',
    dateOfBirth: '2008-04-26',
    groupNumber: 4,
    role: 'hoc_sinh',
    phone: '0912345689',
    parentName: 'Lê Minh Đức',
    parentPhone: '0987654339',
    address: '31 Cách Mạng Tháng 8',
    isUnionMember: false,
    status: 'dang_hoc',
  },
  {
    studentCode: 'HS1220',
    fullName: 'Tô Vĩnh Phát',
    gender: 'nam',
    dateOfBirth: '2008-07-21',
    groupNumber: 4,
    role: 'hoc_sinh',
    phone: '0912345690',
    parentName: 'Tô Văn Phú',
    parentPhone: '0987654340',
    address: '63 Nguyễn Đình Chiểu',
    isUnionMember: true,
    status: 'dang_hoc',
  },
];

export function generateSampleScores(classId: string, studentIds: { [code: string]: string }): Omit<SubjectScore, 'id'>[] {
  const scores: Omit<SubjectScore, 'id'>[] = [];
  const subjects = [
    { code: 'toan', name: 'Toán học' },
    { code: 'van', name: 'Ngữ văn' },
    { code: 'anh', name: 'Tiếng Anh' },
    { code: 'ly', name: 'Vật lí' },
    { code: 'hoa', name: 'Hóa học' },
  ];

  // Random realistic scores for a subset of students
  const studentKeys = Object.keys(studentIds);
  for (const code of studentKeys) {
    const studentId = studentIds[code];
    for (const sub of subjects) {
      // Deterministic pseudo score based on code and sub
      const hash = (code.charCodeAt(4) || 0) + sub.code.charCodeAt(0);
      const base = 7 + (hash % 3); // 7, 8, or 9
      scores.push({
        classId,
        studentId,
        subjectCode: sub.code,
        subjectName: sub.name,
        semester: 'HK1',
        schoolYear: '2025-2026',
        tx1: Math.min(10, Math.max(5, base + (hash % 2) * 0.5)),
        tx2: Math.min(10, Math.max(6, base + ((hash + 1) % 2) * 0.5)),
        tx3: Math.min(10, Math.max(5, base - ((hash + 2) % 2) * 0.5)),
        gk: Math.min(10, Math.max(5, base + 0.5)),
        ck: Math.min(10, Math.max(6, base + 1)),
      });
    }
  }
  return scores;
}

export function generateSampleConducts(classId: string, students: { id: string; groupNumber: number }[]): Omit<ConductRecord, 'id' | 'createdAt'>[] {
  const records: Omit<ConductRecord, 'id' | 'createdAt'>[] = [];
  const sampleEvents = [
    { type: 'khen_thuong' as const, category: 'hoc_tap' as const, desc: 'Điểm 10 môn Toán kiểm tra miệng', pts: 5 },
    { type: 'khen_thuong' as const, category: 've_sinh' as const, desc: 'Trực nhật sạch sẽ, được cờ luân lưu', pts: 5 },
    { type: 'khen_thuong' as const, category: 'hoat_dong_doan' as const, desc: 'Tích cực tham gia văn nghệ chào mừng 20/11', pts: 10 },
    { type: 'vi_pham' as const, category: 'chuyen_can' as const, desc: 'Đi học muộn 15 phút', pts: -2 },
    { type: 'vi_pham' as const, category: 'dong_phuc' as const, desc: 'Không đeo phù hiệu trường', pts: -2 },
    { type: 'vi_pham' as const, category: 'hoc_tap' as const, desc: 'Không chuẩn bị bài môn Ngữ văn', pts: -3 },
    { type: 'khen_thuong' as const, category: 'guong_tot' as const, desc: 'Nhặt được ví tiền trả lại người đánh rơi', pts: 10 },
  ];

  let eventIdx = 0;
  for (let i = 0; i < Math.min(students.length, 12); i++) {
    const s = students[i];
    const ev = sampleEvents[eventIdx % sampleEvents.length];
    records.push({
      classId,
      studentId: s.id,
      groupNumber: s.groupNumber,
      week: 12,
      month: 11,
      type: ev.type,
      category: ev.category,
      description: ev.desc,
      points: ev.pts,
      date: '2025-11-18',
    });
    eventIdx++;
  }

  return records;
}

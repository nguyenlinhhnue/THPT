import React from 'react';
import { Student, CLASS_ROLES, STUDENT_STATUS_LIST } from '../../../types/student';

interface StudentListReportProps {
  students: Student[];
  groupFilter: number | 'all';
}

export function StudentListReport({ students, groupFilter }: StudentListReportProps) {
  const filteredStudents = React.useMemo(() => {
    let list = [...students];
    if (groupFilter !== 'all') {
      list = list.filter(s => s.groupNumber === groupFilter);
    }
    return list.sort((a, b) => (a.stt || 0) - (b.stt || 0));
  }, [students, groupFilter]);

  const total = filteredStudents.length;
  const maleCount = filteredStudents.filter(s => s.gender === 'nam').length;
  const femaleCount = filteredStudents.filter(s => s.gender === 'nu').length;
  const unionCount = filteredStudents.filter(s => s.isUnionMember).length;
  const activeCount = filteredStudents.filter(s => s.status === 'dang_hoc' || !s.status).length;

  return (
    <div className="space-y-4">
      {/* Bảng thống kê tóm tắt đầu danh sách */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-slate-50 border border-slate-300 p-3 rounded-lg">
        <div>
          <span className="text-slate-600 block">Tổng số học sinh:</span>
          <strong className="text-sm font-bold text-slate-900">{total} em</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Đang theo học:</span>
          <strong className="text-sm font-bold text-emerald-800">{activeCount} em</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Nam / Nữ:</span>
          <strong className="text-sm font-bold text-slate-900">{maleCount} Nam / {femaleCount} Nữ</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Đoàn viên:</span>
          <strong className="text-sm font-bold text-teal-800">{unionCount} em</strong>
        </div>
        <div>
          <span className="text-slate-600 block">Phạm vi danh sách:</span>
          <strong className="text-sm font-bold text-slate-900">
            {groupFilter === 'all' ? 'Toàn lớp (4 Tổ)' : `Tổ ${groupFilter}`}
          </strong>
        </div>
      </div>

      {/* Bảng danh sách chi tiết */}
      <table className="w-full text-left border-collapse border border-slate-400 text-xs">
        <thead>
          <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
            <th className="border border-slate-400 p-2 w-10">STT</th>
            <th className="border border-slate-400 p-2 w-20">Mã HS</th>
            <th className="border border-slate-400 p-2 text-left">Họ và Tên</th>
            <th className="border border-slate-400 p-2 w-16">Giới tính</th>
            <th className="border border-slate-400 p-2 w-24">Ngày sinh</th>
            <th className="border border-slate-400 p-2 w-14">Tổ</th>
            <th className="border border-slate-400 p-2 w-28">Chức vụ</th>
            <th className="border border-slate-400 p-2 w-16">Đoàn</th>
            <th className="border border-slate-400 p-2 w-28">SĐT Học sinh</th>
            <th className="border border-slate-400 p-2 w-28">SĐT Phụ huynh</th>
            <th className="border border-slate-400 p-2 w-24">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {filteredStudents.length === 0 ? (
            <tr>
              <td colSpan={11} className="border border-slate-400 p-4 text-center text-slate-500 italic">
                Không có dữ liệu học sinh nào thỏa mãn bộ lọc.
              </td>
            </tr>
          ) : (
            filteredStudents.map((s, index) => {
              const roleObj = CLASS_ROLES.find(r => r.value === s.role);
              const statusObj = STUDENT_STATUS_LIST.find(st => st.value === s.status);

              return (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="border border-slate-400 p-2 text-center font-medium">{index + 1}</td>
                  <td className="border border-slate-400 p-2 text-center font-mono font-semibold text-slate-700">
                    {s.studentCode}
                  </td>
                  <td className="border border-slate-400 p-2 font-bold text-slate-900">
                    {s.fullName}
                  </td>
                  <td className="border border-slate-400 p-2 text-center">
                    {s.gender === 'nam' ? 'Nam' : 'Nữ'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center">
                    {s.dateOfBirth ? s.dateOfBirth.split('-').reverse().join('/') : '—'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-bold">
                    {s.groupNumber}
                  </td>
                  <td className="border border-slate-400 p-2 text-center">
                    {roleObj?.label || 'Học sinh'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center">
                    {s.isUnionMember ? 'ĐV' : '—'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono text-[11px]">
                    {s.phone || '—'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono text-[11px]">
                    {s.parentPhone || '—'}
                  </td>
                  <td className="border border-slate-400 p-2 text-center">
                    <span className="font-medium text-slate-800">
                      {statusObj?.label || 'Đang học'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Trả về mảng 2D cho file Excel và CSV
 */
export function getStudentListExportData(students: Student[], groupFilter: number | 'all') {
  let list = [...students];
  if (groupFilter !== 'all') {
    list = list.filter(s => s.groupNumber === groupFilter);
  }
  list.sort((a, b) => (a.stt || 0) - (b.stt || 0));

  const headers = [
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Giới tính',
    'Ngày sinh',
    'Tổ',
    'Chức vụ',
    'Đoàn viên',
    'SĐT học sinh',
    'Tên phụ huynh',
    'SĐT phụ huynh',
    'Địa chỉ',
    'Trạng thái',
  ];

  const rows = list.map((s, idx) => {
    const roleObj = CLASS_ROLES.find(r => r.value === s.role);
    const statusObj = STUDENT_STATUS_LIST.find(st => st.value === s.status);

    return [
      idx + 1,
      s.studentCode,
      s.fullName,
      s.gender === 'nam' ? 'Nam' : 'Nữ',
      s.dateOfBirth || '',
      `Tổ ${s.groupNumber}`,
      roleObj?.label || 'Học sinh',
      s.isUnionMember ? 'Đoàn viên' : 'Chưa',
      s.phone || '',
      s.parentName || '',
      s.parentPhone || '',
      s.address || '',
      statusObj?.label || 'Đang học',
    ];
  });

  return [headers, ...rows];
}

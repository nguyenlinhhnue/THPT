import React, { useState, useMemo } from 'react';
import { useClass } from '../../context/ClassContext';
import { useUI } from '../../context/UIContext';
import { Student, CLASS_ROLES, STUDENT_STATUS_LIST, StudentStatus } from '../../types/student';
import { deleteStudent } from '../../services/studentService';
import { downloadFile } from '../../services/backupService';
import { formatDateVN, formatPhone } from '../../utils/formatters';
import { StudentModal } from './StudentModal';
import { ImportStudentsModal } from './ImportStudentsModal';
import { EmptyState } from '../common/EmptyState';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Users, 
  Phone, 
  Lock, 
  CheckCircle2, 
  Download, 
  UploadCloud, 
  ArrowUpDown, 
  ShieldAlert,
  GraduationCap,
  FileSpreadsheet
} from 'lucide-react';

type SortOption = 'stt' | 'name' | 'group' | 'dob';

export function StudentListView() {
  const { classroom, students, isDataLocked, seedSampleClassData } = useClass();
  const { showConfirmDialog, showToast } = useUI();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('stt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Lọc và sắp xếp học sinh
  const processedStudents = useMemo(() => {
    let list = students.filter((s) => {
      const matchSearch = 
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.parentPhone && s.parentPhone.includes(searchTerm)) ||
        (s.stt && s.stt.toString().includes(searchTerm));

      const matchGroup = selectedGroup === 'all' || s.groupNumber === selectedGroup;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchRole = roleFilter === 'all' 
        ? true 
        : roleFilter === 'can_su' 
        ? (s.role !== 'thanh_vien' && s.role !== 'hoc_sinh')
        : s.role === roleFilter;

      return matchSearch && matchGroup && matchStatus && matchRole;
    });

    // Sắp xếp
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'stt') {
        const sttA = a.stt ?? 999;
        const sttB = b.stt ?? 999;
        comparison = sttA - sttB;
      } else if (sortBy === 'name') {
        // Tách tên để sắp theo tên tiếng Việt
        const nameA = a.fullName.trim().split(' ').slice(-1)[0] || '';
        const nameB = b.fullName.trim().split(' ').slice(-1)[0] || '';
        comparison = nameA.localeCompare(nameB, 'vi');
      } else if (sortBy === 'group') {
        comparison = a.groupNumber - b.groupNumber;
      } else if (sortBy === 'dob') {
        comparison = (a.dateOfBirth || '').localeCompare(b.dateOfBirth || '');
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [students, searchTerm, selectedGroup, statusFilter, roleFilter, sortBy, sortDirection]);

  // Thống kê trạng thái
  const countActive = students.filter(s => s.status === 'dang_hoc').length;
  const countInactive = students.filter(s => s.status === 'nghi_hoc').length;
  const countTransferred = students.filter(s => s.status === 'chuyen_lop' || s.status === 'chuyen_di').length;

  const handleOpenAdd = () => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Vui lòng mở khóa sổ trên thanh tiêu đề để thêm học sinh.');
      return;
    }
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Vui lòng mở khóa sổ để chỉnh sửa thông tin học sinh.');
      return;
    }
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = (student: Student) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Không thể xóa học sinh khi sổ dữ liệu đang khóa.');
      return;
    }

    showConfirmDialog({
      title: `Xác nhận xóa học sinh: ${student.fullName}`,
      message: `Hành động này sẽ xóa hồ sơ của em ${student.fullName} (Mã ${student.studentCode}) khỏi lớp ${classroom?.className || ''}. Điểm số cũ liên kết với mã học sinh này sẽ không còn hiển thị. Bạn có chắc chắn?`,
      confirmLabel: 'Xóa vĩnh viễn',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteStudent(student.id);
          showToast('success', 'Đã xóa học sinh', `Đã xóa em ${student.fullName} khỏi danh sách lớp.`);
        } catch (err: any) {
          showToast('error', 'Lỗi khi xóa học sinh', err.message);
        }
      },
    });
  };

  // Xuất Excel / CSV
  const handleExportCSV = () => {
    if (students.length === 0) {
      showToast('warning', 'Chưa có học sinh', 'Danh sách hiện chưa có dữ liệu học sinh để xuất.');
      return;
    }

    const headers = [
      'STT',
      'Mã HS',
      'Họ và tên',
      'Giới tính',
      'Ngày sinh',
      'Tổ',
      'Chức vụ',
      'Trạng thái',
      'Đoàn viên',
      'SĐT Học sinh',
      'Phụ huynh',
      'SĐT Phụ huynh',
      'Địa chỉ',
      'Ghi chú'
    ];

    const rows = processedStudents.map((s, idx) => {
      const roleConfig = CLASS_ROLES.find(r => r.value === s.role);
      const statusConfig = STUDENT_STATUS_LIST.find(st => st.value === s.status);
      return [
        s.stt || idx + 1,
        `"${s.studentCode}"`,
        `"${s.fullName}"`,
        s.gender === 'nam' ? 'Nam' : 'Nữ',
        `"${s.dateOfBirth}"`,
        s.groupNumber,
        `"${roleConfig?.label || s.role}"`,
        `"${statusConfig?.label || s.status}"`,
        s.isUnionMember ? 'Có' : 'Chưa',
        `"${s.phone || ''}"`,
        `"${s.parentName || ''}"`,
        `"${s.parentPhone || ''}"`,
        `"${s.address || ''}"`,
        `"${s.notes || ''}"`,
      ];
    });

    const csvContent = '\uFEFF' + [
      `DANH SÁCH HỌC SINH LỚP ${classroom?.className || '12A1'} - NĂM HỌC ${classroom?.schoolYear || '2025-2026'}`,
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    downloadFile(csvContent, `DanhSach_Lop_${classroom?.className || '12A1'}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    showToast('success', 'Xuất file thành công', `Đã xuất danh sách ${processedStudents.length} học sinh ra file CSV (Excel tiếng Việt).`);
  };

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Quản Lý Hồ Sơ Học Sinh — Lớp {classroom?.className || '12A1'}
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {students.length} học sinh
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Độc quyền GVCN • Chức vụ cán sự lớp không phải là tài khoản đăng nhập • Dữ liệu điểm được bảo toàn khi đổi tên/tổ
          </p>
        </div>

        {/* Action buttons: Import, Export, Add */}
        <div className="flex flex-wrap items-center gap-2.5">
          {students.length === 0 && (
            <button
              onClick={seedSampleClassData}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors"
            >
              Nạp mẫu 20 HS
            </button>
          )}

          <button
            onClick={() => setIsImportModalOpen(true)}
            disabled={isDataLocked}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs disabled:opacity-40"
            title="Nhập danh sách học sinh từ file Excel / CSV"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Nhập Excel/CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs"
            title="Xuất danh sách học sinh ra file CSV mở bằng Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel/CSV</span>
          </button>

          <button
            id="add-student-btn"
            onClick={handleOpenAdd}
            disabled={isDataLocked}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isDataLocked
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Học Sinh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, mã học sinh, STT, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Group Filter (Tổ 1 - 4) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Tổ:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedGroup === 'all' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
              {Array.from({ length: classroom?.totalGroups || 4 }).map((_, i) => {
                const g = i + 1;
                return (
                  <button
                    key={g}
                    onClick={() => setSelectedGroup(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedGroup === g ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tổ {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trạng thái Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StudentStatus | 'all')}
              className="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="all">Tất cả ({students.length})</option>
              <option value="dang_hoc">Đang học ({countActive})</option>
              <option value="nghi_hoc">Nghỉ học ({countInactive})</option>
              <option value="chuyen_lop">Chuyển lớp ({countTransferred})</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Chức vụ:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="all">Tất cả chức vụ</option>
              <option value="can_su">Ban Cán sự & Tổ trưởng</option>
              {CLASS_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick sort buttons */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Sắp xếp theo:</span>
            <button
              onClick={() => toggleSort('stt')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                sortBy === 'stt' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              <span>STT</span>
              {sortBy === 'stt' && <ArrowUpDown className="w-3 h-3" />}
            </button>

            <button
              onClick={() => toggleSort('name')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                sortBy === 'name' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              <span>Tên (A-Z)</span>
              {sortBy === 'name' && <ArrowUpDown className="w-3 h-3" />}
            </button>

            <button
              onClick={() => toggleSort('group')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                sortBy === 'group' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              <span>Tổ</span>
              {sortBy === 'group' && <ArrowUpDown className="w-3 h-3" />}
            </button>

            <button
              onClick={() => toggleSort('dob')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                sortBy === 'dob' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              <span>Ngày sinh</span>
              {sortBy === 'dob' && <ArrowUpDown className="w-3 h-3" />}
            </button>
          </div>

          <div>
            Đang hiển thị <strong>{processedStudents.length}</strong> / {students.length} học sinh
          </div>
        </div>
      </div>

      {/* Student List Table */}
      {processedStudents.length === 0 ? (
        <EmptyState
          title="Không tìm thấy học sinh phù hợp"
          description={
            students.length === 0
              ? `Lớp ${classroom?.className || ''} hiện chưa có học sinh nào. Thầy/Cô vui lòng nhấn "Thêm Học Sinh" hoặc "Nhập Excel/CSV" để tạo danh sách lớp.`
              : 'Không có học sinh nào trùng khớp với bộ lọc hoặc từ khóa tìm kiếm.'
          }
          actionLabel={students.length === 0 ? 'Thêm học sinh đầu tiên' : undefined}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3">Mã HS</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-3 text-center">Giới tính</th>
                  <th className="py-3 px-3 text-center">Tổ</th>
                  <th className="py-3 px-3">Chức vụ</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-3 text-center">Đoàn viên</th>
                  <th className="py-3 px-4">Liên hệ PH</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {processedStudents.map((student, idx) => {
                  const roleConfig = CLASS_ROLES.find((r) => r.value === student.role);
                  const statusConfig = STUDENT_STATUS_LIST.find((st) => st.value === student.status);

                  return (
                    <tr 
                      key={student.id} 
                      className="hover:bg-indigo-50/20 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold">
                        {student.stt ?? idx + 1}
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-600">
                        {student.studentCode}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {student.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{formatDateVN(student.dateOfBirth)}</span>
                          {student.notes && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-500 truncate max-w-[150px]" title={student.notes}>
                                {student.notes}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          student.gender === 'nam' ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {student.gender === 'nam' ? 'Nam' : 'Nữ'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-50/50">
                          Tổ {student.groupNumber}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          roleConfig?.badgeColor || 'bg-slate-100 text-slate-700'
                        }`}>
                          {roleConfig?.label || 'Thành viên'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          statusConfig?.badgeColor || 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {statusConfig?.label || 'Đang học'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {student.isUnionMember ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Có
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Chưa</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          {student.parentName || '—'}
                        </div>
                        {student.parentPhone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{formatPhone(student.parentPhone)}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            disabled={isDataLocked}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40"
                            title="Sửa hồ sơ học sinh"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            disabled={isDataLocked}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                            title="Xóa học sinh khỏi lớp"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa học sinh */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingStudent={editingStudent}
      />

      {/* Modal Nhập danh sách từ Excel/CSV */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}

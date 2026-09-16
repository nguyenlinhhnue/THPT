import React, { useState } from 'react';
import { Student, ClassRole, Gender, StudentStatus } from '../../types/student';
import { batchImportStudents } from '../../services/studentService';
import { useClass } from '../../context/ClassContext';
import { useUI } from '../../context/UIContext';
import { downloadFile } from '../../services/backupService';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle 
} from 'lucide-react';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportStudentsModal({ isOpen, onClose }: ImportStudentsModalProps) {
  const { classroom, students, isDataLocked } = useClass();
  const { showToast } = useUI();

  const [parsedList, setParsedList] = useState<Omit<Student, 'id' | 'classId' | 'createdAt' | 'updatedAt'>[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Tải file CSV mẫu
  const handleDownloadTemplate = () => {
    const headers = [
      'STT',
      'MaHS',
      'HoVaTen',
      'GioiTinh',
      'NgaySinh',
      'To',
      'ChucVu',
      'TrangThai',
      'SDT',
      'PhuHuynh',
      'SDT_PH',
      'DiaChi',
      'DoanVien',
      'GhiChu'
    ];

    const sampleRows = [
      ['1', 'HS1201', 'Nguyễn Hoàng Minh', 'Nam', '2008-03-15', '1', 'Lớp trưởng', 'Đang học', '0912345678', 'Nguyễn Văn Hải', '0987654321', 'Số 10 Phố Huế, Hà Nội', 'Có', 'Học sinh chăm ngoan'],
      ['2', 'HS1202', 'Trần Thu Hà', 'Nữ', '2008-07-22', '1', 'Bí thư', 'Đang học', '0912345679', 'Trần Văn Bình', '0987654322', 'Số 15 Lê Duẩn, Hà Nội', 'Có', 'Năng nổ hoạt động Đoàn'],
      ['3', 'HS1203', 'Lê Tuấn Anh', 'Nam', '2008-01-10', '2', 'Lớp phó', 'Đang học', '0912345680', 'Lê Văn Cường', '0987654323', 'Số 20 Giải Phóng, Hà Nội', 'Có', 'Giỏi Tin học'],
      ['4', 'HS1204', 'Phạm Quỳnh Nga', 'Nữ', '2008-11-05', '2', 'Tổ trưởng', 'Đang học', '0912345681', 'Phạm Văn Dũng', '0987654324', 'Số 25 Kim Mã, Hà Nội', 'Có', 'Tổ trưởng tổ 2'],
      ['5', 'HS1205', 'Vũ Đức Thành', 'Nam', '2008-09-18', '3', 'Tổ phó', 'Đang học', '0912345682', 'Vũ Văn Hùng', '0987654325', 'Số 30 Cầu Giấy, Hà Nội', 'Chưa', ''],
      ['6', 'HS1206', 'Đỗ Mai Chi', 'Nữ', '2008-05-30', '4', 'Thành viên', 'Đang học', '0912345683', 'Đỗ Văn Long', '0987654326', 'Số 35 Đống Đa, Hà Nội', 'Có', ''],
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\r\n');
    downloadFile(csvContent, 'Mau_DanhSachHocSinh_THPT.csv', 'text/csv;charset=utf-8;');
  };

  // Đọc file CSV người dùng tải lên
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);

        if (lines.length < 2) {
          setParseError('File không có dòng dữ liệu học sinh nào.');
          return;
        }

        const dataRows = lines.slice(1);
        const parsed: Omit<Student, 'id' | 'classId' | 'createdAt' | 'updatedAt'>[] = [];

        for (let i = 0; i < dataRows.length; i++) {
          const rowText = dataRows[i];
          // Tách dấu phẩy an toàn (xử lý trường hợp có ngoặc kép)
          const cols = rowText.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          
          if (cols.length < 3) continue;

          const stt = parseInt(cols[0], 10) || (students.length + parsed.length + 1);
          const studentCode = cols[1] || `HS12${stt < 10 ? '0' + stt : stt}`;
          const fullName = cols[2];

          if (!fullName) continue;

          // Giới tính
          const genderRaw = (cols[3] || '').toLowerCase();
          const gender: Gender = genderRaw.includes('nữ') || genderRaw.includes('nu') ? 'nu' : 'nam';

          // Ngày sinh
          let dateOfBirth = cols[4] || '2008-01-01';
          if (dateOfBirth.includes('/')) {
            const parts = dateOfBirth.split('/');
            if (parts.length === 3) {
              dateOfBirth = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }

          // Tổ
          const groupNumber = parseInt(cols[5], 10) || (((stt - 1) % 4) + 1);

          // Chức vụ
          const roleRaw = (cols[6] || '').toLowerCase();
          let role: ClassRole = 'thanh_vien';
          if (roleRaw.includes('lớp trưởng') || roleRaw.includes('lop truong')) role = 'lop_truong';
          else if (roleRaw.includes('bí thư') || roleRaw.includes('bi thu')) role = 'bi_thu';
          else if (roleRaw.includes('lớp phó') || roleRaw.includes('lop pho')) role = 'lop_pho';
          else if (roleRaw.includes('tổ trưởng') || roleRaw.includes('to truong')) role = 'to_truong';
          else if (roleRaw.includes('tổ phó') || roleRaw.includes('to pho')) role = 'to_pho';

          // Trạng thái
          const statusRaw = (cols[7] || '').toLowerCase();
          let status: StudentStatus = 'dang_hoc';
          if (statusRaw.includes('nghỉ') || statusRaw.includes('nghi')) status = 'nghi_hoc';
          else if (statusRaw.includes('chuyển') || statusRaw.includes('chuyen')) status = 'chuyen_lop';

          const phone = cols[8] || '';
          const parentName = cols[9] || '';
          const parentPhone = cols[10] || '';
          const address = cols[11] || '';
          const isUnionMember = (cols[12] || '').toLowerCase().includes('có') || (cols[12] || '').toLowerCase().includes('co');
          const notes = cols[13] || '';

          parsed.push({
            stt,
            studentCode,
            fullName,
            gender,
            dateOfBirth,
            groupNumber,
            role,
            status,
            phone,
            parentName,
            parentPhone,
            address,
            isUnionMember,
            notes,
          });
        }

        if (parsed.length === 0) {
          setParseError('Không tìm thấy bản ghi học sinh hợp lệ nào từ file đã chọn.');
        } else {
          setParsedList(parsed);
        }
      } catch (err: any) {
        setParseError('Lỗi đọc nội dung file CSV. Vui lòng kiểm tra lại định dạng file.');
      }
    };

    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // Thực hiện ghi vào Firestore
  const handleConfirmImport = async () => {
    if (!classroom?.id || parsedList.length === 0) return;
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang bị khóa', 'Vui lòng mở khóa sổ trước khi nhập danh sách học sinh.');
      return;
    }

    try {
      setIsImporting(true);
      const count = await batchImportStudents(classroom.id, parsedList);
      showToast('success', 'Nhập danh sách thành công', `Đã thêm ${count} học sinh vào lớp ${classroom.className}. Dữ liệu đồng bộ tức thời trên Cloud.`);
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      showToast('error', 'Lỗi nhập dữ liệu', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nhập Danh Sách Học Sinh Từ File Excel / CSV
              </h3>
              <p className="text-xs text-slate-500">
                Thêm nhanh danh sách cả lớp vào Firestore với đầy đủ STT, Mã HS, Họ tên, Tổ và Chức vụ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Khu vực hướng dẫn & Tải file mẫu */}
        <div className="mt-5 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 text-xs text-indigo-950">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Thầy/Cô chưa có file theo đúng định dạng mẫu?</span>
              <span className="text-indigo-800 text-[11px] block mt-0.5">
                Tải file CSV mẫu chuẩn THPT đã điền sẵn các cột STT, Mã HS, Họ và tên, Ngày sinh, Tổ, Chức vụ.
              </span>
            </div>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Tải File Mẫu CSV</span>
          </button>
        </div>

        {/* Upload Zone */}
        <div className="mt-5">
          <label className="block w-full p-6 text-center rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 cursor-pointer transition-all">
            <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-800 block">
              {fileName ? `Đã chọn: ${fileName}` : 'Nhấn vào đây để chọn tệp CSV / Excel'}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Hỗ trợ file .csv mã hóa UTF-8 với dấu tiếng Việt
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Báo lỗi nếu có */}
        {parseError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Preview danh sách học sinh */}
        {parsedList.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Xem trước {parsedList.length} học sinh sẵn sàng nạp:
              </span>
              <span className="text-xs text-slate-500">
                Sẽ được phân bổ vào các Tổ tương ứng
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase">
                  <tr>
                    <th className="py-2 px-3 text-center">STT</th>
                    <th className="py-2 px-3">Mã HS</th>
                    <th className="py-2 px-3">Họ và Tên</th>
                    <th className="py-2 px-2 text-center">Giới tính</th>
                    <th className="py-2 px-2 text-center">Tổ</th>
                    <th className="py-2 px-3">Chức vụ</th>
                    <th className="py-2 px-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedList.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono text-slate-400">{s.stt || idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-700">{s.studentCode}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{s.fullName}</td>
                      <td className="py-2 px-2 text-center">{s.gender === 'nam' ? 'Nam' : 'Nữ'}</td>
                      <td className="py-2 px-2 text-center font-bold text-indigo-700">Tổ {s.groupNumber}</td>
                      <td className="py-2 px-3 text-slate-700">{s.role}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          {s.status === 'dang_hoc' ? 'Đang học' : s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isImporting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={isImporting || parsedList.length === 0 || isDataLocked}
            onClick={handleConfirmImport}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang ghi vào Firestore...</span>
              </>
            ) : (
              <>
                <span>Xác Nhận Nạp {parsedList.length} Học Sinh</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

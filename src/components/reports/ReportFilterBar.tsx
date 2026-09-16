import React from 'react';
import { 
  ReportType, 
  REPORT_TYPES_METADATA 
} from '../../types/report';
import { Student } from '../../types/student';
import { 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Eye, 
  Filter,
  Calendar,
  Users,
  ChevronDown
} from 'lucide-react';

interface ReportFilterBarProps {
  selectedType: ReportType;
  onChangeType: (type: ReportType) => void;
  selectedWeek: number;
  onChangeWeek: (week: number) => void;
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  startDate: string;
  endDate: string;
  onChangeDateRange: (start: string, end: string) => void;
  selectedGroup: number | 'all';
  onChangeGroup: (group: number | 'all') => void;
  selectedStudentId: string;
  onChangeStudentId: (id: string) => void;
  students: Student[];
  paperOrientation: 'portrait' | 'landscape';
  onChangeOrientation: (ori: 'portrait' | 'landscape') => void;
  onPrint: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
}

const MONTH_OPTIONS = [
  { value: '2026-09', label: 'Tháng 9 / 2026' },
  { value: '2026-10', label: 'Tháng 10 / 2026' },
  { value: '2026-11', label: 'Tháng 11 / 2026' },
  { value: '2026-12', label: 'Tháng 12 / 2026' },
  { value: '2027-01', label: 'Tháng 01 / 2027' },
  { value: '2027-02', label: 'Tháng 02 / 2027' },
  { value: '2027-03', label: 'Tháng 03 / 2027' },
  { value: '2027-04', label: 'Tháng 04 / 2027' },
  { value: '2027-05', label: 'Tháng 05 / 2027' },
];

export function ReportFilterBar({
  selectedType,
  onChangeType,
  selectedWeek,
  onChangeWeek,
  selectedMonth,
  onChangeMonth,
  startDate,
  endDate,
  onChangeDateRange,
  selectedGroup,
  onChangeGroup,
  selectedStudentId,
  onChangeStudentId,
  students,
  paperOrientation,
  onChangeOrientation,
  onPrint,
  onExportExcel,
  onExportCSV,
}: ReportFilterBarProps) {
  const currentMeta = REPORT_TYPES_METADATA[selectedType];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4 no-print">
      {/* 8 Tab chọn loại báo cáo nhanh */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Chọn loại biểu mẫu báo cáo (8 Báo cáo chuẩn)
          </label>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${currentMeta.badgeColor}`}>
            {currentMeta.title}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {(Object.keys(REPORT_TYPES_METADATA) as ReportType[]).map(typeKey => {
            const item = REPORT_TYPES_METADATA[typeKey];
            const isActive = selectedType === typeKey;

            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => onChangeType(typeKey)}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border text-left flex flex-col justify-between ${
                  isActive
                    ? 'bg-teal-900 text-white border-teal-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] opacity-75">Mẫu #{typeKey.slice(0, 3).toUpperCase()}</span>
                <span className="truncate w-full mt-0.5">{item.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dòng bộ lọc thời gian, tổ, học sinh tương ứng */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        {/* Lọc tuần */}
        {(selectedType === 'weekly_points' || selectedType === 'violations' || selectedType === 'academic' || selectedType === 'classification') && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Chọn Tuần học:
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => onChangeWeek(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium"
            >
              {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>
                  Tuần {w}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lọc tháng */}
        {(selectedType === 'monthly_points' || selectedType === 'violations' || selectedType === 'classification' || selectedType === 'group_competition') && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Chọn Tháng:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => onChangeMonth(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium"
            >
              {MONTH_OPTIONS.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lọc Tổ */}
        {selectedType !== 'individual' && selectedType !== 'group_competition' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Phạm vi Tổ:
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => onChangeGroup(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium"
            >
              <option value="all">Tất cả các tổ (Toàn lớp)</option>
              <option value={1}>Tổ 1</option>
              <option value={2}>Tổ 2</option>
              <option value={3}>Tổ 3</option>
              <option value={4}>Tổ 4</option>
            </select>
          </div>
        )}

        {/* Lọc Học sinh (Bắt buộc với Báo cáo cá nhân) */}
        {selectedType === 'individual' && (
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Chọn học sinh xuất phiếu cá nhân:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => onChangeStudentId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-bold text-slate-900"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.studentCode} — {s.fullName} (Tổ {s.groupNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Khổ giấy in */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Khổ giấy A4:
          </label>
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onChangeOrientation('portrait')}
              className={`py-1 text-[11px] font-bold rounded-lg transition-colors ${
                paperOrientation === 'portrait'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 Dọc
            </button>
            <button
              type="button"
              onClick={() => onChangeOrientation('landscape')}
              className={`py-1 text-[11px] font-bold rounded-lg transition-colors ${
                paperOrientation === 'landscape'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 Ngang
            </button>
          </div>
        </div>

        {/* Khoảng ngày (tùy chọn) */}
        {selectedType === 'violations' && (
          <div className="flex items-center gap-1.5">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Từ ngày:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onChangeDateRange(e.target.value, endDate)}
                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Đến ngày:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onChangeDateRange(startDate, e.target.value)}
                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Các nút hành động: Xem trước, In, Xuất PDF, Xuất Excel, Xuất CSV */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 italic">
          * Dữ liệu tự động đồng bộ theo thời gian thực từ hệ thống sổ điểm và nề nếp kỷ luật gốc.
        </p>

        <div className="flex items-center gap-2">
          {/* Nút Xuất Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
            title="Tải xuống tệp bảng tính Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Xuất Excel</span>
          </button>

          {/* Nút Xuất CSV */}
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
            title="Tải xuống tệp CSV UTF-8"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất CSV</span>
          </button>

          {/* Nút Xuất PDF */}
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
            title="Lưu hoặc In văn bản định dạng PDF"
          >
            <FileText className="w-4 h-4 text-rose-700" />
            <span>Xuất PDF</span>
          </button>

          {/* Nút In trực tiếp */}
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Kích hoạt lệnh in tiêu chuẩn A4"
          >
            <Printer className="w-4 h-4" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

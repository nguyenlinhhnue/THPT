import React, { useState, useMemo, useEffect } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { ReportType, REPORT_TYPES_METADATA } from '../../types/report';
import { exportToExcel, exportToCSV, printReport } from '../../utils/exportUtils';
import { ReportHeaderA4 } from './ReportHeaderA4';
import { ReportFooterA4 } from './ReportFooterA4';
import { ReportFilterBar } from './ReportFilterBar';

// Import templates
import { 
  StudentListReport, 
  getStudentListExportData 
} from './templates/StudentListReport';
import { 
  WeeklyPointsReport, 
  getWeeklyPointsExportData 
} from './templates/WeeklyPointsReport';
import { 
  MonthlyPointsReport, 
  getMonthlyPointsExportData 
} from './templates/MonthlyPointsReport';
import { 
  GroupCompetitionReport, 
  getGroupCompetitionExportData 
} from './templates/GroupCompetitionReport';
import { 
  ViolationsReport, 
  getViolationsExportData 
} from './templates/ViolationsReport';
import { 
  AcademicReport, 
  getAcademicExportData 
} from './templates/AcademicReport';
import { 
  ClassificationReport, 
  getClassificationExportData 
} from './templates/ClassificationReport';
import { 
  IndividualStudentReport, 
  getIndividualExportData 
} from './templates/IndividualStudentReport';

import { EmptyState } from '../common/EmptyState';
import { FileBarChart, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export function ReportsView() {
  const { 
    classroom, 
    students, 
    pointTransactions, 
    learningRecords, 
    scores, 
    selectedWeek: defaultWeek,
    selectedSemester 
  } = useClass();
  const { currentUser } = useAuth();
  const { showToast } = useUI();

  // State bộ lọc và loại báo cáo
  const [selectedType, setSelectedType] = useState<ReportType>('student_list');
  const [selectedWeek, setSelectedWeek] = useState<number>(defaultWeek || 1);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Tự động gán học sinh đầu tiên khi danh sách tải xong
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Đồng bộ tuần khi context thay đổi
  useEffect(() => {
    if (defaultWeek) {
      setSelectedWeek(defaultWeek);
    }
  }, [defaultWeek]);

  // Khi đổi loại báo cáo, đặt khổ giấy mặc định tối ưu
  const handleTypeChange = (type: ReportType) => {
    setSelectedType(type);
    const meta = REPORT_TYPES_METADATA[type];
    if (meta) {
      setPaperOrientation(meta.defaultOrientation);
    }
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const currentStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  const teacherName = classroom?.teacherName || currentUser?.displayName || 'Giáo viên Chủ nhiệm';
  const className = classroom?.className || '12A1';

  // Nhãn thời gian hiển thị linh hoạt
  const periodDescription = useMemo(() => {
    switch (selectedType) {
      case 'weekly_points':
        return `Tuần ${selectedWeek} (Học kỳ 1)`;
      case 'monthly_points': {
        const [y, m] = selectedMonth.split('-');
        return `Tháng ${parseInt(m, 10)}/${y}`;
      }
      case 'group_competition':
        return `Bảng tổng hợp thi đua (Kỳ báo cáo Tháng ${selectedMonth.split('-')[1]})`;
      case 'violations':
        return `Thống kê vi phạm kỷ luật • Lớp ${className}`;
      case 'academic':
        return `Kết quả đánh giá học tập • Học kỳ 1`;
      case 'classification':
        return `Kết quả xếp loại rèn luyện & học lực • Tuần ${selectedWeek}`;
      case 'individual':
        return currentStudent 
          ? `Học sinh: ${currentStudent.fullName} (Mã HS: ${currentStudent.studentCode})` 
          : 'Hồ sơ học sinh';
      case 'student_list':
      default:
        return `Toàn thể học sinh lớp ${className}`;
    }
  }, [selectedType, selectedWeek, selectedMonth, className, currentStudent]);

  // Trích xuất dữ liệu mảng 2D phục vụ xuất Excel & CSV
  const getExportData = (): { fileName: string; sheetName: string; rows: any[][] } => {
    const timeStamp = new Date().toISOString().slice(0, 10);
    const meta = REPORT_TYPES_METADATA[selectedType];
    const baseName = `BaoCao_${meta.shortTitle.replace(/\s+/g, '_')}_Lop_${className}_${timeStamp}`;

    switch (selectedType) {
      case 'student_list':
        return {
          fileName: baseName,
          sheetName: 'DanhSachHocSinh',
          rows: getStudentListExportData(students, selectedGroup),
        };
      case 'weekly_points':
        return {
          fileName: `${baseName}_Tuan_${selectedWeek}`,
          sheetName: `DiemTuan_${selectedWeek}`,
          rows: getWeeklyPointsExportData(students, pointTransactions, selectedWeek, selectedGroup),
        };
      case 'monthly_points':
        return {
          fileName: `${baseName}_${selectedMonth}`,
          sheetName: `DiemThang_${selectedMonth}`,
          rows: getMonthlyPointsExportData(students, pointTransactions, selectedMonth, selectedGroup),
        };
      case 'group_competition':
        return {
          fileName: `${baseName}_ThiDuaTo`,
          sheetName: 'ThiDuaTo',
          rows: getGroupCompetitionExportData(students, pointTransactions, learningRecords, periodDescription),
        };
      case 'violations':
        return {
          fileName: `${baseName}_ViPham`,
          sheetName: 'ViPham',
          rows: getViolationsExportData(students, pointTransactions, selectedGroup),
        };
      case 'academic':
        return {
          fileName: `${baseName}_HocTap`,
          sheetName: 'KetQuaHocTap',
          rows: getAcademicExportData(students, learningRecords, scores, selectedGroup),
        };
      case 'classification':
        return {
          fileName: `${baseName}_XepLoai_Tuan_${selectedWeek}`,
          sheetName: 'XepLoai',
          rows: getClassificationExportData(
            students, 
            pointTransactions, 
            learningRecords, 
            'week', 
            selectedWeek, 
            selectedMonth, 
            selectedGroup
          ),
        };
      case 'individual':
        return {
          fileName: `${baseName}_${currentStudent?.studentCode || 'HS'}`,
          sheetName: 'CaNhan',
          rows: currentStudent 
            ? getIndividualExportData(currentStudent, pointTransactions, learningRecords, scores) 
            : [],
        };
      default:
        return { fileName: baseName, sheetName: 'BaoCao', rows: [] };
    }
  };

  // Thao tác Xuất Excel
  const handleExportExcel = () => {
    const { fileName, sheetName, rows } = getExportData();
    if (rows.length === 0) {
      showToast('warning', 'Không có dữ liệu để xuất file Excel');
      return;
    }
    const success = exportToExcel({ fileName, sheetName, rows });
    if (success) {
      showToast('success', 'Xuất Excel thành công', `Tệp ${fileName}.xlsx đã được lưu về máy.`);
    } else {
      showToast('error', 'Lỗi khi xuất file Excel');
    }
  };

  // Thao tác Xuất CSV
  const handleExportCSV = () => {
    const { fileName, rows } = getExportData();
    if (rows.length === 0) {
      showToast('warning', 'Không có dữ liệu để xuất file CSV');
      return;
    }
    const success = exportToCSV({ fileName, rows });
    if (success) {
      showToast('success', 'Xuất CSV thành công', `Tệp ${fileName}.csv đã được tải về.`);
    } else {
      showToast('error', 'Lỗi khi xuất file CSV');
    }
  };

  // Thao tác In trực tiếp / Xuất PDF
  const handlePrint = () => {
    printReport();
  };

  if (students.length === 0) {
    return (
      <EmptyState
        title="Chưa có dữ liệu học sinh để kết xuất báo cáo"
        description="Thầy/Cô vui lòng nhập danh sách học sinh lớp chủ nhiệm vào hệ thống để bắt đầu tạo và in các biểu mẫu báo cáo."
      />
    );
  }

  const currentMeta = REPORT_TYPES_METADATA[selectedType];

  return (
    <div className="space-y-6">
      {/* Thanh công cụ chọn loại báo cáo và bộ lọc thời gian / tổ / học sinh */}
      <ReportFilterBar
        selectedType={selectedType}
        onChangeType={handleTypeChange}
        selectedWeek={selectedWeek}
        onChangeWeek={setSelectedWeek}
        selectedMonth={selectedMonth}
        onChangeMonth={setSelectedMonth}
        startDate={startDate}
        endDate={endDate}
        onChangeDateRange={handleDateRangeChange}
        selectedGroup={selectedGroup}
        onChangeGroup={setSelectedGroup}
        selectedStudentId={selectedStudentId}
        onChangeStudentId={setSelectedStudentId}
        students={students}
        paperOrientation={paperOrientation}
        onChangeOrientation={setPaperOrientation}
        onPrint={handlePrint}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
      />

      {/* Thanh công cụ xem trước (Zoom & Thông tin mẫu in) */}
      <div className="flex items-center justify-between bg-slate-200/80 px-4 py-2 rounded-xl text-xs text-slate-700 no-print">
        <div className="flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-teal-800" />
          <span className="font-semibold text-slate-900">
            Xem trước bản in: <strong className="uppercase">{currentMeta.title}</strong>
          </span>
          <span className="text-slate-500">• Khổ {paperOrientation === 'portrait' ? 'A4 Đứng' : 'A4 Nằm ngang'}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Thu phóng:</span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(prev - 10, 70))}
            className="p-1 hover:bg-slate-300 rounded text-slate-700"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono font-bold text-[11px] w-10 text-center">{zoomLevel}%</span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(prev + 10, 130))}
            className="p-1 hover:bg-slate-300 rounded text-slate-700"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="p-1 hover:bg-slate-300 rounded text-slate-700"
            title="Đặt lại 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Khung tài liệu giấy A4 xem trước & in ấn */}
      <div className="overflow-x-auto pb-8 flex justify-center">
        <div 
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150"
        >
          <div
            id="printable-report-document"
            className={`print-container bg-white text-slate-950 p-6 sm:p-10 shadow-lg border border-slate-300 rounded-sm mx-auto ${
              paperOrientation === 'landscape' ? 'w-[1050px] min-h-[740px]' : 'w-[820px] min-h-[1100px]'
            }`}
          >
            {/* Đầu đề văn bản hành chính sư phạm chuẩn A4 */}
            <ReportHeaderA4
              classroom={classroom}
              teacherName={teacherName}
              reportTitle={currentMeta.title}
              periodDescription={periodDescription}
              subTitle={currentMeta.description}
            />

            {/* Thân báo cáo tương ứng với 1 trong 8 mẫu */}
            <div className="my-6">
              {selectedType === 'student_list' && (
                <StudentListReport 
                  students={students} 
                  groupFilter={selectedGroup} 
                />
              )}

              {selectedType === 'weekly_points' && (
                <WeeklyPointsReport
                  students={students}
                  transactions={pointTransactions}
                  weekNumber={selectedWeek}
                  groupFilter={selectedGroup}
                />
              )}

              {selectedType === 'monthly_points' && (
                <MonthlyPointsReport
                  students={students}
                  transactions={pointTransactions}
                  selectedMonth={selectedMonth}
                  groupFilter={selectedGroup}
                />
              )}

              {selectedType === 'group_competition' && (
                <GroupCompetitionReport
                  students={students}
                  transactions={pointTransactions}
                  learningRecords={learningRecords}
                  scopeLabel={periodDescription}
                />
              )}

              {selectedType === 'violations' && (
                <ViolationsReport
                  students={students}
                  transactions={pointTransactions}
                  scopeLabel={periodDescription}
                  groupFilter={selectedGroup}
                />
              )}

              {selectedType === 'academic' && (
                <AcademicReport
                  students={students}
                  learningRecords={learningRecords}
                  scores={scores}
                  scopeLabel={periodDescription}
                  groupFilter={selectedGroup}
                />
              )}

              {selectedType === 'classification' && (
                <ClassificationReport
                  students={students}
                  transactions={pointTransactions}
                  learningRecords={learningRecords}
                  period="week"
                  targetWeek={selectedWeek}
                  targetMonth={selectedMonth}
                  scopeLabel={periodDescription}
                  groupFilter={selectedGroup}
                />
              )}

              {selectedType === 'individual' && currentStudent && (
                <IndividualStudentReport
                  student={currentStudent}
                  transactions={pointTransactions}
                  learningRecords={learningRecords}
                  scores={scores}
                  selectedSemester={selectedSemester}
                />
              )}
            </div>

            {/* Chân trang văn bản hành chính & chữ ký xác nhận */}
            <ReportFooterA4
              teacherName={teacherName}
              isIndividual={selectedType === 'individual'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

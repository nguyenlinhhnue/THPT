import React from 'react';
import { 
  X, 
  AlertTriangle, 
  BookOpen, 
  ShieldAlert, 
  ArrowRight,
  UserCheck,
  CheckCircle2 
} from 'lucide-react';
import { Student } from '../../types/student';

export interface AttentionStudentItem {
  student: Student;
  conductScore: number;
  violationsCount: number;
  rewardsCount: number;
  academicAvg: number | null;
  academicSupportNeededCount: number;
  academicIssues: string[];
  conductIssues: string[];
  reasons: string[];
}

interface AttentionStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attentionList: AttentionStudentItem[];
  periodLabel: string;
  onNavigateToStudent?: (studentId: string) => void;
  onNavigateToConduct?: () => void;
}

export function AttentionStudentsModal({
  isOpen,
  onClose,
  attentionList,
  periodLabel,
  onNavigateToStudent,
  onNavigateToConduct,
}: AttentionStudentsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Danh Sách Học Sinh Cần Lưu Ý ({attentionList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Phạm vi: <span className="font-medium text-slate-700">{periodLabel}</span> • Tự động rà soát từ nề nếp và kết quả học tập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100">
          {attentionList.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Không có học sinh nào thuộc diện cảnh báo!
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Tất cả học sinh trong lớp đều đạt điểm rèn luyện tốt, không có lỗi vi phạm nghiêm trọng và học tập ổn định trong chu kỳ này.
              </p>
            </div>
          ) : (
            attentionList.map((item) => {
              const { student, conductScore, violationsCount, academicAvg, academicSupportNeededCount, reasons } = item;
              
              return (
                <div key={student.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        {student.stt ? `#${student.stt}` : student.studentCode}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {student.fullName}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Tổ {student.groupNumber}
                      </span>
                      {student.role && student.role !== 'hoc_sinh' && student.role !== 'thanh_vien' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          {student.role}
                        </span>
                      )}
                    </div>

                    {/* Lý do cảnh báo */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {reasons.map((r, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100"
                        >
                          <ShieldAlert className="w-3 h-3 text-rose-500" />
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Chỉ số nhanh */}
                  <div className="flex items-center gap-3 sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-700">
                        Rèn luyện: <span className={`font-bold ${conductScore < 80 ? 'text-rose-600' : 'text-emerald-700'}`}>{conductScore} đ</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {violationsCount > 0 ? (
                          <span className="text-rose-600 font-medium">{violationsCount} lỗi vi phạm</span>
                        ) : (
                          <span>0 vi phạm</span>
                        )}
                        {academicAvg !== null && (
                          <span> • ĐTB: <strong className="text-slate-800">{academicAvg.toFixed(1)}</strong></span>
                        )}
                      </div>
                    </div>

                    {onNavigateToStudent && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToStudent(student.id);
                        }}
                        className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="Xem hồ sơ học sinh"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Khuyến nghị: Thầy/Cô chủ nhiệm gặp riêng để nhắc nhở và phối hợp phụ huynh.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

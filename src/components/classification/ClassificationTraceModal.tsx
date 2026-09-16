import React from 'react';
import { StudentClassificationResult } from '../../types/classification';
import { WeeklyPointTransaction } from '../../types/pointTransaction';
import { LearningRecord } from '../../types/learning';
import { 
  X, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  ShieldAlert, 
  Calendar, 
  Calculator,
  User,
  Scale
} from 'lucide-react';

interface ClassificationTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: StudentClassificationResult | null;
  transactions: WeeklyPointTransaction[];
  learningRecords: LearningRecord[];
}

export function ClassificationTraceModal({
  isOpen,
  onClose,
  result,
  transactions,
  learningRecords,
}: ClassificationTraceModalProps) {
  if (!isOpen || !result) return null;

  // Lấy danh sách các transactions nguồn của học sinh này
  const sourceIdsSet = new Set(result.traceability?.sourceTransactionIds || []);
  const sourceTransactions = transactions.filter(t => sourceIdsSet.has(t.id));

  // Lấy các bản ghi học tập tương ứng
  const studentLearning = learningRecords.filter(r => r.studentId === result.studentId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Truy Nguyên Nguồn Gốc Dữ Liệu Xếp Loại
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-semibold">
                  Tổ {result.groupNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Học sinh: <strong className="text-slate-800">{result.studentName}</strong> ({result.studentCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Cảnh báo thay đổi dữ liệu nguồn nếu có */}
          {result.hasSourceDataChanged && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-amber-950">
                  Dữ liệu nguồn đã thay đổi sau khi khóa chính thức!
                </div>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Điểm tại thời điểm khóa: <strong>{result.traceability.sourceNetPointsSnapshot} điểm</strong>. 
                  Hiện tại tổng hợp từ transactions: <strong>{result.netScore} điểm</strong> (Lệch: {result.sourceDataChangeDiff && result.sourceDataChangeDiff > 0 ? `+${result.sourceDataChangeDiff}` : result.sourceDataChangeDiff}đ).
                  Hệ thống bảo toàn nguyên vẹn bản ghi khóa chính thức để bảo đảm pháp lý và tính minh bạch.
                </p>
              </div>
            </div>
          )}

          {/* Công thức tính toán minh bạch */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-600" />
              Công thức tổng hợp điểm trực tiếp từ Transaction:
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Điểm khởi tạo</div>
                <div className="text-lg font-bold text-slate-800 mt-1">{result.baseScore}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                <div className="text-[10px] text-emerald-700 font-semibold uppercase">Tổng điểm cộng (+)</div>
                <div className="text-lg font-bold text-emerald-600 mt-1">+{result.totalPlusScore}</div>
                <div className="text-[10px] text-slate-500">{result.rewardsCount} lượt thưởng</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-rose-200">
                <div className="text-[10px] text-rose-700 font-semibold uppercase">Tổng điểm trừ (-)</div>
                <div className="text-lg font-bold text-rose-600 mt-1">-{result.totalMinusScore}</div>
                <div className="text-[10px] text-slate-500">{result.violationsCount} lượt vi phạm</div>
              </div>

              <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-[10px] text-indigo-700 font-semibold uppercase">Điểm xếp loại chốt</div>
                <div className="text-lg font-bold text-indigo-700 mt-1">{result.netScore}</div>
                <div className="text-[10px] font-bold text-indigo-900 mt-0.5">Xếp loại: {result.rankName}</div>
              </div>
            </div>
          </div>

          {/* Danh sách các Transaction nguồn gốc */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-600" />
                Các giao dịch điểm nguồn ({sourceTransactions.length} giao dịch)
              </h3>
              <span className="text-[11px] text-slate-500">ID giao dịch được lưu vết bất biến</span>
            </div>

            {sourceTransactions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                Học sinh không có giao dịch cộng/trừ nào trong kỳ này (Giữ nguyên 100 điểm chuẩn).
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {sourceTransactions.map(t => (
                  <div key={t.id} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <span>{t.reason || t.ruleSnapshot?.label || 'Giao dịch điểm'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">#{t.id.slice(0, 8)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{t.date}</span>
                        {t.weekNumber && <span>• Tuần {t.weekNumber}</span>}
                        {(t.createdByName || t.createdBy) && <span>• Người nhập: {t.createdByName || t.createdBy}</span>}
                        {t.origin && <span className="text-indigo-600 font-medium">({t.origin})</span>}
                      </div>
                    </div>

                    <div className={`font-bold text-sm px-2.5 py-1 rounded-lg ${
                      t.score > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {t.score > 0 ? `+${t.score}` : t.score}đ
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dữ liệu học tập liên quan (nếu có) */}
          {studentLearning.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Kết quả học tập ghi nhận trong kỳ ({studentLearning.length} bài)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {studentLearning.map(rec => (
                  <div key={rec.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{rec.subjectName}: {rec.assessmentName}</div>
                      <div className="text-[10px] text-slate-500">{rec.date} • Tuần {rec.weekNumber}</div>
                    </div>
                    <span className="font-bold text-indigo-700 text-sm">{rec.score}đ</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

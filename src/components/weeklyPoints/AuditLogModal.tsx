import React from 'react';
import { WeeklyPointTransaction } from '../../types/pointTransaction';
import { formatDateVN } from '../../utils/formatters';
import { 
  History, 
  X, 
  User, 
  Calendar, 
  Tag, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: WeeklyPointTransaction | null;
}

export function AuditLogModal({ isOpen, onClose, transaction }: AuditLogModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lịch Sử Audit Log Giao Dịch
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Mã: {transaction.transactionId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Snapshot Info Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Snapshot Dữ Liệu Bất Biến Lúc Phát Sinh
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block">Học sinh:</span>
                <span className="font-bold text-slate-800">{transaction.studentNameSnapshot}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mã học sinh:</span>
                <span className="font-bold text-slate-800">{transaction.studentCodeSnapshot || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tổ thi đua:</span>
                <span className="font-bold text-indigo-700">Tổ {transaction.groupNumberSnapshot}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tuần ghi nhận:</span>
                <span className="font-bold text-slate-800">Tuần {transaction.weekNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ngày phát sinh:</span>
                <span className="font-bold text-slate-800">{formatDateVN(transaction.date)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Điểm số hiện tại:</span>
                <span className={`font-black text-sm ${transaction.score >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {transaction.score > 0 ? `+${transaction.score}` : transaction.score} đ
                </span>
              </div>

              {transaction.ruleSnapshot && (
                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[11px]">Snapshot Quy tắc (Bảo toàn lịch sử không đổi):</span>
                  <span className="font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block mt-1">
                    {transaction.ruleSnapshot.label} ({transaction.ruleSnapshot.defaultScore > 0 ? `+${transaction.ruleSnapshot.defaultScore}` : transaction.ruleSnapshot.defaultScore} điểm) • Nhóm: {transaction.categoryLabel || transaction.category}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status info if voided */}
          {transaction.status === 'voided' && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Giao dịch này đã được GVCN HOÀN TÁC (Vô hiệu hóa)</span>
                <span>Lý do: {transaction.voidReason || 'GVCN hủy điểm'} • Bởi: {transaction.voidedBy || 'GVCN'} ({formatDateVN(transaction.voidedAt?.split('T')[0] || '')})</span>
              </div>
            </div>
          )}

          {/* Audit Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Nhật Ký Thao Tác (Audit Trail)
            </h4>

            <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2">
              {(transaction.auditLog || []).map((entry, idx) => {
                const isCreated = entry.action === 'created';
                const isUpdated = entry.action === 'updated';
                const isVoided = entry.action === 'voided';
                const isRestored = entry.action === 'restored';

                return (
                  <div key={idx} className="relative">
                    {/* Bullet */}
                    <div className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                      isCreated ? 'bg-emerald-500' :
                      isVoided ? 'bg-amber-500' :
                      isRestored ? 'bg-indigo-500' :
                      'bg-blue-500'
                    }`} />

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${
                          isCreated ? 'text-emerald-700' :
                          isVoided ? 'text-amber-700' :
                          isRestored ? 'text-indigo-700' :
                          'text-blue-700'
                        }`}>
                          {isCreated && '🟢 Khởi tạo giao dịch điểm'}
                          {isUpdated && '✏️ Chỉnh sửa thông tin'}
                          {isVoided && '⚠️ Hoàn tác / Hủy giao dịch'}
                          {isRestored && '🔄 Khôi phục giao dịch'}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Người thực hiện: </span>
                        {entry.by || 'GVCN'}
                      </div>

                      {entry.diffSummary && (
                        <div className="text-[11px] font-mono p-1.5 bg-slate-50 rounded-md text-slate-700 border border-slate-100">
                          {entry.diffSummary}
                        </div>
                      )}

                      {entry.note && (
                        <div className="text-xs text-slate-500 italic">
                          "{entry.note}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

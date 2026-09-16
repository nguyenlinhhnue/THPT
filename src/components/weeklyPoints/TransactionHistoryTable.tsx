import React, { useState } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { 
  WeeklyPointTransaction, 
  CATEGORY_COLOR_MAP 
} from '../../types/pointTransaction';
import { 
  voidPointTransaction, 
  restorePointTransaction, 
  deletePointTransactionPermanently 
} from '../../services/pointTransactionService';
import { formatDateVN } from '../../utils/formatters';
import { 
  History, 
  Edit3, 
  RotateCcw, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

interface TransactionHistoryTableProps {
  transactions: WeeklyPointTransaction[];
  onOpenEdit: (tx: WeeklyPointTransaction) => void;
  onOpenAuditLog: (tx: WeeklyPointTransaction) => void;
}

export function TransactionHistoryTable({
  transactions,
  onOpenEdit,
  onOpenAuditLog,
}: TransactionHistoryTableProps) {
  const { isDataLocked, setSyncStatus } = useClass();
  const { currentUser, teacherProfile } = useAuth();
  const { showToast, showConfirm } = useUI();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'plus' | 'minus'>('all');
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'voided'>('all');

  const teacherName = teacherProfile?.displayName || 'Giáo viên Chủ nhiệm';

  // Hoàn tác / Hủy giao dịch (Void transaction)
  const handleVoid = (tx: WeeklyPointTransaction) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa', 'Vui lòng mở khóa sổ trước khi thực hiện.');
      return;
    }

    showConfirm({
      title: 'Xác nhận hoàn tác giao dịch điểm?',
      message: `Bạn có chắc muốn hủy ghi nhận "${tx.score > 0 ? '+' : ''}${tx.score} điểm" của học sinh ${tx.studentNameSnapshot}? Giao dịch sẽ được đánh dấu đã hủy và ghi nhận vào Audit Log.`,
      confirmLabel: 'Hoàn tác giao dịch',
      cancelLabel: 'Giữ lại',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setSyncStatus('syncing');
          await voidPointTransaction(tx.id, tx, teacherName, 'GVCN hoàn tác từ danh sách lịch sử');
          showToast('success', 'Đã hoàn tác giao dịch thành công');
        } catch (err: any) {
          showToast('error', 'Lỗi khi hoàn tác', err.message);
          setSyncStatus('error');
        }
      },
    });
  };

  // Khôi phục giao dịch đã hủy
  const handleRestore = async (tx: WeeklyPointTransaction) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa');
      return;
    }

    try {
      setSyncStatus('syncing');
      await restorePointTransaction(tx.id, tx, teacherName);
      showToast('success', 'Đã khôi phục giao dịch điểm', `${tx.studentNameSnapshot} • ${tx.score > 0 ? '+' : ''}${tx.score} đ`);
    } catch (err: any) {
      showToast('error', 'Lỗi khôi phục', err.message);
      setSyncStatus('error');
    }
  };

  // Xóa vĩnh viễn
  const handleDeletePermanently = (tx: WeeklyPointTransaction) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đã khóa');
      return;
    }

    showConfirm({
      title: 'XÓA VĨNH VIỄN GIAO DỊCH?',
      message: `CẢNH BÁO: Hành động này sẽ xóa hoàn toàn Transaction [${tx.transactionId}] khỏi cơ sở dữ liệu và không thể hoàn tác. Thường chỉ nên dùng "Hoàn tác" để giữ lịch sử Audit Log.`,
      confirmLabel: 'Xóa vĩnh viễn',
      cancelLabel: 'Hủy',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setSyncStatus('syncing');
          await deletePointTransactionPermanently(tx.id);
          showToast('info', 'Đã xóa vĩnh viễn giao dịch khỏi hệ thống');
        } catch (err: any) {
          showToast('error', 'Lỗi xóa giao dịch', err.message);
          setSyncStatus('error');
        }
      },
    });
  };

  // Lọc dữ liệu
  const filteredList = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (groupFilter !== 'all' && tx.groupNumberSnapshot !== groupFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = tx.studentNameSnapshot.toLowerCase().includes(q);
      const matchCode = (tx.studentCodeSnapshot || '').toLowerCase().includes(q);
      const matchReason = tx.reason.toLowerCase().includes(q);
      const matchTxId = tx.transactionId.toLowerCase().includes(q);
      return matchName || matchCode || matchReason || matchTxId;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Bộ lọc & Tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, mã HS, lý do, mã TX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Lọc loại điểm */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="all">Tất cả loại điểm (+ / -)</option>
            <option value="plus">Chỉ điểm cộng (+)</option>
            <option value="minus">Chỉ điểm trừ (-)</option>
          </select>

          {/* Lọc tổ */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="all">Tất cả các tổ</option>
            <option value="1">Tổ 1</option>
            <option value="2">Tổ 2</option>
            <option value="3">Tổ 3</option>
            <option value="4">Tổ 4</option>
          </select>

          {/* Lọc trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="valid">Hợp lệ (Đang tính điểm)</option>
            <option value="voided">Đã hoàn tác / Đã hủy</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị: <strong>{filteredList.length}</strong> / {transactions.length} giao dịch
        </div>
      </div>

      {/* Bảng dữ liệu Transaction */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">Không tìm thấy giao dịch điểm nào phù hợp</p>
            <p className="text-xs text-slate-400">
              Hãy bấm nút "Nhập Điểm Một Học Sinh" hoặc "Ghi Nhận Hàng Loạt" để tạo transaction mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã TX & Ngày</th>
                  <th className="py-3 px-4">Học Sinh</th>
                  <th className="py-3 px-3">Tổ</th>
                  <th className="py-3 px-4">Danh Mục</th>
                  <th className="py-3 px-4 min-w-[220px]">Nội Dung / Lý Do</th>
                  <th className="py-3 px-4 text-center">Điểm Tuần</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredList.map((tx) => {
                  const isVoided = tx.status === 'voided';
                  const catStyle = CATEGORY_COLOR_MAP[tx.category] || CATEGORY_COLOR_MAP.khac;

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isVoided ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Mã TX & Ngày */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-indigo-700 block">
                          {tx.transactionId}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateVN(tx.date)}
                        </span>
                      </td>

                      {/* Học sinh */}
                      <td className="py-3 px-4">
                        <span className={`font-bold block ${isVoided ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {tx.studentNameSnapshot}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {tx.studentCodeSnapshot || '—'}
                        </span>
                      </td>

                      {/* Tổ */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-700">
                          Tổ {tx.groupNumberSnapshot}
                        </span>
                      </td>

                      {/* Danh mục */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          {tx.categoryLabel || tx.category}
                        </span>
                      </td>

                      {/* Nội dung */}
                      <td className="py-3 px-4">
                        <p className={`font-medium ${isVoided ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {tx.reason}
                        </p>
                        {tx.note && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5">
                            Ghi chú: {tx.note}
                          </p>
                        )}
                      </td>

                      {/* Điểm */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-xl font-black text-sm ${
                            isVoided
                              ? 'bg-slate-100 text-slate-400 line-through'
                              : tx.score >= 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {tx.score > 0 ? `+${tx.score}` : tx.score}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4">
                        {!isVoided ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Hợp lệ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Đã hủy
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Nút xem Audit Log */}
                          <button
                            type="button"
                            title="Xem lịch sử Audit Log"
                            onClick={() => onOpenAuditLog(tx)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Sửa nếu còn hiệu lực */}
                          {!isVoided ? (
                            <>
                              <button
                                type="button"
                                title="Chỉnh sửa giao dịch"
                                disabled={isDataLocked}
                                onClick={() => onOpenEdit(tx)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="Hoàn tác (Hủy điểm)"
                                disabled={isDataLocked}
                                onClick={() => handleVoid(tx)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              title="Khôi phục lại giao dịch này"
                              disabled={isDataLocked}
                              onClick={() => handleRestore(tx)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-30"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Xóa vĩnh viễn */}
                          <button
                            type="button"
                            title="Xóa vĩnh viễn"
                            disabled={isDataLocked}
                            onClick={() => handleDeletePermanently(tx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
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
        )}
      </div>
    </div>
  );
}

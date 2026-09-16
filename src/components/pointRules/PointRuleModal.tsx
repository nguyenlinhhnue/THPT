import React, { useState, useEffect } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { 
  PointRule, 
  CreatePointRuleInput, 
  UpdatePointRuleInput, 
  CATEGORY_LABELS 
} from '../../types/pointRule';
import { TransactionCategory, TransactionType } from '../../types/pointTransaction';
import { createPointRule, updatePointRule } from '../../services/pointRuleService';
import { 
  X, 
  Plus, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Shield, 
  Sliders, 
  Info,
  Layers,
  HelpCircle
} from 'lucide-react';

interface PointRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRule?: PointRule | null;
}

export function PointRuleModal({ isOpen, onClose, editingRule }: PointRuleModalProps) {
  const { classroom, isDataLocked, setSyncStatus } = useClass();
  const { currentUser } = useAuth();
  const { showToast } = useUI();

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('plus');
  const [score, setScore] = useState<number>(1);
  const [category, setCategory] = useState<TransactionCategory>('hoc_tap');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingRule) {
      setName(editingRule.name);
      setType(editingRule.type);
      setScore(Math.abs(editingRule.score));
      setCategory(editingRule.category);
      setDescription(editingRule.description || '');
      setIsActive(editingRule.isActive);
    } else {
      setName('');
      setType('plus');
      setScore(1);
      setCategory('hoc_tap');
      setDescription('');
      setIsActive(true);
    }
  }, [isOpen, editingRule]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('error', 'Thiếu nội dung', 'Vui lòng nhập tên/nội dung quy tắc.');
      return;
    }

    if (!score || score <= 0) {
      showToast('error', 'Điểm không hợp lệ', 'Vui lòng nhập số điểm lớn hơn 0.');
      return;
    }

    if (!classroom?.id) {
      showToast('error', 'Chưa có lớp học', 'Không xác định được lớp học hiện tại.');
      return;
    }

    setSubmitting(true);
    setSyncStatus('syncing');

    try {
      if (editingRule) {
        // Cập nhật quy tắc
        const updateData: UpdatePointRuleInput = {
          name: name.trim(),
          type,
          category,
          categoryLabel: CATEGORY_LABELS[category],
          score: type === 'minus' ? -Math.abs(score) : Math.abs(score),
          description: description.trim(),
          isActive,
        };

        await updatePointRule(editingRule.id, updateData, currentUser?.email || 'GVCN');
        showToast(
          'success', 
          'Đã cập nhật quy tắc', 
          `Quy tắc "${name.trim()}" đã được lưu. Mức điểm mới sẽ áp dụng cho các giao dịch mới.`
        );
      } else {
        // Thêm quy tắc mới
        const createData: CreatePointRuleInput = {
          name: name.trim(),
          type,
          category,
          categoryLabel: CATEGORY_LABELS[category],
          score: Math.abs(score),
          description: description.trim(),
          isActive,
        };

        await createPointRule(classroom.id, createData, currentUser?.email || 'GVCN');
        showToast(
          'success', 
          'Đã thêm quy tắc mới', 
          `Quy tắc "${name.trim()}" (${type === 'plus' ? '+' : '-'}${score}đ) đã sẵn sàng để sử dụng.`
        );
      }

      setSyncStatus('saved');
      onClose();
    } catch (err: any) {
      console.error('Save point rule error:', err);
      showToast('error', 'Lỗi lưu quy tắc', err.message || 'Không thể lưu quy tắc.');
      setSyncStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              type === 'plus' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">
                {editingRule ? 'Chỉnh sửa Quy tắc Chấm điểm' : 'Thêm Quy tắc Chấm điểm Mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingRule ? 'Điều chỉnh nội dung hoặc mức điểm áp dụng mới' : 'Tạo tiêu chí cộng hoặc trừ điểm thi đua cho lớp'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Loại quy tắc: Cộng hay Trừ điểm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Loại quy tắc <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('plus')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border font-medium text-sm transition-all ${
                  type === 'plus'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                  type === 'plus' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>+</div>
                Nội dung Cộng điểm (+)
              </button>

              <button
                type="button"
                onClick={() => setType('minus')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border font-medium text-sm transition-all ${
                  type === 'minus'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                  type === 'minus' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>-</div>
                Nội dung Trừ điểm (-)
              </button>
            </div>
          </div>

          {/* Tên / Nội dung quy tắc */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên / Nội dung quy tắc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'plus' ? 'Ví dụ: Phát biểu xây dựng bài, Đi học đúng giờ...' : 'Ví dụ: Đi học muộn, Không làm bài tập...'}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Hàng: Số điểm và Nhóm hành vi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mức điểm ({type === 'plus' ? '+' : '-'}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base ${
                  type === 'plus' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {type === 'plus' ? '+' : '-'}
                </span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max="100"
                  required
                  value={score}
                  onChange={(e) => setScore(Math.abs(parseFloat(e.target.value) || 1))}
                  className="w-full pl-8 pr-12 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  điểm
                </span>
              </div>
              {/* Quick score pill buttons */}
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 5, 10].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setScore(val)}
                    className={`px-2 py-0.5 text-xs rounded font-medium border transition-colors ${
                      score === val 
                        ? (type === 'plus' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300')
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type === 'plus' ? `+${val}` : `-${val}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nhóm hành vi <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                  <option key={catKey} value={catKey}>
                    {catLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mô tả / Tiêu chí áp dụng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô tả / Hướng dẫn áp dụng (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú điều kiện hoặc trường hợp cụ thể để GVCN áp dụng quy tắc này..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Trạng thái kích hoạt */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-sm font-semibold text-slate-800 block">
                Trạng thái sử dụng
              </span>
              <span className="text-xs text-slate-500">
                {isActive ? 'Hiển thị trong danh sách chọn nhanh khi nhập điểm tuần' : 'Tạm tắt (không xuất hiện trong danh sách chọn)'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Historical Integrity Callout */}
          <div className="p-3.5 bg-amber-50/80 rounded-lg border border-amber-200 flex gap-3 text-xs text-amber-900">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">
                Bảo toàn lịch sử điểm (Historical Integrity):
              </p>
              <p className="text-amber-800 leading-relaxed">
                Khi thay đổi mức điểm quy tắc (ví dụ từ -2 sang -3), mức điểm mới <strong className="font-bold">chỉ áp dụng cho các giao dịch tạo mới sau này</strong>. Toàn bộ các giao dịch cũ đã ghi nhận trong quá khứ vẫn giữ nguyên snapshot điểm ban đầu.
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingRule ? 'Cập nhật Quy tắc' : 'Lưu Quy tắc Mới'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

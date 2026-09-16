import React, { useState } from 'react';
import { 
  ClassificationCriteriaConfig, 
  ClassificationTier, 
  DEFAULT_CLASSIFICATION_TIERS 
} from '../../types/classification';
import { 
  X, 
  Save, 
  Sliders, 
  Plus, 
  Trash2, 
  RotateCcw, 
  AlertCircle, 
  ShieldCheck,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface ClassificationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassificationCriteriaConfig;
  onSave: (updatedConfig: ClassificationCriteriaConfig) => Promise<void>;
  isLocked?: boolean;
}

export function ClassificationConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
  isLocked = false,
}: ClassificationConfigModalProps) {
  const [tiers, setTiers] = useState<ClassificationTier[]>(config.tiers || DEFAULT_CLASSIFICATION_TIERS);
  const [minWeeksRequiredForMonth, setMinWeeksRequiredForMonth] = useState<number>(config.minWeeksRequiredForMonth ?? 2);
  const [minWeeksRequiredForSemester, setMinWeeksRequiredForSemester] = useState<number>(config.minWeeksRequiredForSemester ?? 8);
  const [requireTransactionsExist, setRequireTransactionsExist] = useState<boolean>(config.requireTransactionsExist ?? false);
  const [minTransactionsRequired, setMinTransactionsRequired] = useState<number>(config.minTransactionsRequired ?? 1);
  const [requireAcademicData, setRequireAcademicData] = useState<boolean>(config.requireAcademicData ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Cập nhật thuộc tính của một tier
  const handleUpdateTier = (index: number, field: keyof ClassificationTier, value: any) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  // Thêm một mức xếp loại mới
  const handleAddTier = () => {
    const newTier: ClassificationTier = {
      id: `tier_${Date.now()}`,
      name: 'Mức mới',
      minScore: 75,
      badgeColor: 'blue',
      description: 'Mô tả mức xếp loại',
    };
    // Chèn vào vị trí phù hợp
    setTiers([...tiers, newTier]);
  };

  // Xóa một tier
  const handleDeleteTier = (index: number) => {
    if (tiers.length <= 2) {
      setError('Cần giữ lại ít nhất 2 mức xếp loại.');
      return;
    }
    const updated = tiers.filter((_, i) => i !== index);
    setTiers(updated);
  };

  // Khôi phục mặc định
  const handleResetDefault = () => {
    setTiers(DEFAULT_CLASSIFICATION_TIERS);
    setMinWeeksRequiredForMonth(2);
    setMinWeeksRequiredForSemester(8);
    setRequireTransactionsExist(false);
    setMinTransactionsRequired(0);
    setRequireAcademicData(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError('Bản xếp loại hiện tại đang bị khóa. Vui lòng mở khóa trước khi thay đổi cấu hình.');
      return;
    }

    // Validate tên các tier không được rỗng
    for (const t of tiers) {
      if (!t.name.trim()) {
        setError('Tên các mức xếp loại không được để trống.');
        return;
      }
      if (t.minScore < 0 || t.minScore > 100) {
        setError('Ngưỡng điểm tối thiểu phải từ 0 đến 100.');
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      const updatedConfig: ClassificationCriteriaConfig = {
        ...config,
        tiers: [...tiers].sort((a, b) => b.minScore - a.minScore),
        minWeeksRequiredForMonth: Number(minWeeksRequiredForMonth),
        minWeeksRequiredForSemester: Number(minWeeksRequiredForSemester),
        requireTransactionsExist,
        minTransactionsRequired: Number(minTransactionsRequired),
        requireAcademicData,
      };

      await onSave(updatedConfig);
      onClose();
    } catch (err: any) {
      console.error('Save config error:', err);
      setError(err.message || 'Không thể lưu cấu hình thang điểm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Cấu hình Thang Xếp loại & Điều kiện Dữ liệu
              </h2>
              <p className="text-xs text-slate-500">
                Tùy chỉnh ngưỡng điểm, tên mức xếp loại và tiêu chí xác định đủ dữ liệu
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Phần 1: Các mức xếp loại (Tiers) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Danh sách Mức Xếp loại & Ngưỡng điểm
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống tự động xếp học sinh vào mức cao nhất thỏa mãn ngưỡng điểm tối thiểu (minScore)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm mức
              </button>
            </div>

            <div className="space-y-2.5">
              {tiers.map((tier, idx) => (
                <div 
                  key={tier.id || idx}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1">
                    {/* Tên mức */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Tên mức xếp loại
                      </label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={e => handleUpdateTier(idx, 'name', e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Ngưỡng điểm từ */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Điểm từ (≥ minScore)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={tier.minScore}
                        onChange={e => handleUpdateTier(idx, 'minScore', Number(e.target.value))}
                        required
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Màu hiển thị */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Màu huy hiệu
                      </label>
                      <select
                        value={tier.badgeColor}
                        onChange={e => handleUpdateTier(idx, 'badgeColor', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden"
                      >
                        <option value="emerald">Xanh lá (Tốt/Xuất sắc)</option>
                        <option value="blue">Xanh dương (Khá)</option>
                        <option value="amber">Vàng hổ phách (Đạt)</option>
                        <option value="rose">Đỏ hồng (Chưa đạt)</option>
                        <option value="purple">Tím (Đặc biệt)</option>
                      </select>
                    </div>
                  </div>

                  {/* Nút xóa mức */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTier(idx)}
                    title="Xóa mức này"
                    className="self-end sm:self-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Phần 2: Điều kiện đủ dữ liệu để xếp loại */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                2. Điều kiện xác định ĐỦ DỮ LIỆU
              </h3>
              <p className="text-xs text-slate-500">
                Nếu không thỏa mãn các điều kiện này, hệ thống sẽ <strong>KHÔNG</strong> tự động xếp loại mà hiển thị trạng thái <em>"Chưa đủ dữ liệu"</em>.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200 text-xs">
              {/* Điều kiện theo tháng */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-800">Xếp loại Tháng yêu cầu tối thiểu số tuần:</div>
                  <div className="text-[11px] text-slate-500">Số tuần có hoạt động ghi nhận trong tháng để đủ điều kiện xét tháng</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={minWeeksRequiredForMonth}
                    onChange={e => setMinWeeksRequiredForMonth(Number(e.target.value))}
                    className="w-16 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-indigo-700"
                  />
                  <span className="text-slate-600 font-medium">tuần</span>
                </div>
              </div>

              {/* Điều kiện theo học kỳ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <div className="font-semibold text-slate-800">Xếp loại Học kỳ yêu cầu tối thiểu số tuần:</div>
                  <div className="text-[11px] text-slate-500">Số tuần có hoạt động ghi nhận trong học kỳ để đủ điều kiện xét học kỳ</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={minWeeksRequiredForSemester}
                    onChange={e => setMinWeeksRequiredForSemester(Number(e.target.value))}
                    className="w-16 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-indigo-700"
                  />
                  <span className="text-slate-600 font-medium">tuần</span>
                </div>
              </div>

              {/* Tùy chọn yêu cầu số lượng giao dịch tối thiểu */}
              <div className="pt-2 border-t border-slate-200/60 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="reqTxsCheck"
                  checked={requireTransactionsExist}
                  onChange={e => setRequireTransactionsExist(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="reqTxsCheck" className="font-semibold text-slate-800 cursor-pointer">
                    Yêu cầu học sinh phải có ít nhất số giao dịch điểm rèn luyện
                  </label>
                  <div className="text-[11px] text-slate-500">
                    Tránh xếp loại khi học sinh chưa có bất kỳ đánh giá nề nếp nào trong kỳ
                  </div>
                  {requireTransactionsExist && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] text-slate-600 font-medium">Tối thiểu:</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={minTransactionsRequired}
                        onChange={e => setMinTransactionsRequired(Number(e.target.value))}
                        className="w-16 px-2 py-0.5 bg-white border border-slate-300 rounded-md text-xs text-center font-bold text-indigo-700"
                      />
                      <span className="text-[11px] text-slate-600">giao dịch</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tùy chọn yêu cầu có điểm học tập */}
              <div className="pt-2 border-t border-slate-200/60 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="reqAcadCheck"
                  checked={requireAcademicData}
                  onChange={e => setRequireAcademicData(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="reqAcadCheck" className="font-semibold text-slate-800 cursor-pointer">
                    Yêu cầu phải có dữ liệu kiểm tra học tập
                  </label>
                  <div className="text-[11px] text-slate-500">
                    Bắt buộc phải có ít nhất 1 bài kiểm tra được ghi nhận trong kỳ mới xét xếp loại
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục mặc định
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || isLocked}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { PointRule, CATEGORY_LABELS } from '../../types/pointRule';
import { TransactionCategory, TransactionType, CATEGORY_COLOR_MAP } from '../../types/pointTransaction';
import { 
  deletePointRule, 
  togglePointRuleActive, 
  resetToDefaultPointRules 
} from '../../services/pointRuleService';
import { PointRuleModal } from './PointRuleModal';
import { 
  Scale, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  ShieldCheck, 
  ArrowRight,
  Sliders,
  Check,
  Power,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  Info
} from 'lucide-react';

export function PointRulesManagementView() {
  const { classroom, pointRules, isDataLocked, setSyncStatus } = useClass();
  const { currentUser } = useAuth();
  const { showToast, showConfirmDialog, setActiveTab } = useUI();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TransactionCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PointRule | null>(null);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = pointRules.length;
    const plusCount = pointRules.filter(r => r.type === 'plus').length;
    const minusCount = pointRules.filter(r => r.type === 'minus').length;
    const activeCount = pointRules.filter(r => r.isActive).length;
    const inactiveCount = pointRules.filter(r => !r.isActive).length;

    return { total, plusCount, minusCount, activeCount, inactiveCount };
  }, [pointRules]);

  // Danh sách đã lọc
  const filteredRules = useMemo(() => {
    return pointRules.filter(rule => {
      // 1. Tìm kiếm theo từ khóa (tên, mô tả, số điểm, nhóm hành vi)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = rule.name.toLowerCase().includes(query);
        const matchDesc = (rule.description || '').toLowerCase().includes(query);
        const matchCat = (rule.categoryLabel || '').toLowerCase().includes(query);
        const matchScore = rule.score.toString().includes(query) || Math.abs(rule.score).toString().includes(query);
        if (!matchName && !matchDesc && !matchCat && !matchScore) {
          return false;
        }
      }

      // 2. Lọc theo Loại (Cộng / Trừ)
      if (typeFilter !== 'all' && rule.type !== typeFilter) {
        return false;
      }

      // 3. Lọc theo Nhóm hành vi
      if (categoryFilter !== 'all' && rule.category !== categoryFilter) {
        return false;
      }

      // 4. Lọc theo Trạng thái (Đang dùng / Đã tắt)
      if (statusFilter === 'active' && !rule.isActive) return false;
      if (statusFilter === 'inactive' && rule.isActive) return false;

      return true;
    });
  }, [pointRules, searchTerm, typeFilter, categoryFilter, statusFilter]);

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (rule: PointRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  // Bật / Tắt trạng thái quy tắc
  const handleToggleActive = async (rule: PointRule) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang khóa', 'Mở khóa dữ liệu để điều chỉnh quy tắc.');
      return;
    }

    try {
      const nextStatus = !rule.isActive;
      await togglePointRuleActive(rule.id, nextStatus);
      showToast(
        'info', 
        nextStatus ? 'Đã kích hoạt quy tắc' : 'Đã tạm tắt quy tắc', 
        `Quy tắc "${rule.name}" hiện ${nextStatus ? 'sẽ xuất hiện' : 'sẽ ẩn'} trong danh mục chọn nhanh.`
      );
    } catch (err: any) {
      showToast('error', 'Lỗi cập nhật', err.message);
    }
  };

  // Xóa quy tắc
  const handleDeleteRule = (rule: PointRule) => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang khóa');
      return;
    }

    showConfirmDialog({
      title: 'Xác nhận xóa quy tắc',
      message: `Bạn có chắc muốn xóa quy tắc "${rule.name}" (${rule.score > 0 ? '+' : ''}${rule.score}đ)?\n\n📌 LƯU Ý: Các giao dịch điểm đã tạo trước đây bằng quy tắc này vẫn sẽ được giữ nguyên vẹn trong lịch sử.`,
      confirmLabel: 'Xóa quy tắc',
      cancelLabel: 'Giữ lại',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deletePointRule(rule.id);
          showToast('success', 'Đã xóa quy tắc', `Đã loại bỏ "${rule.name}" khỏi danh mục quy tắc.`);
        } catch (err: any) {
          showToast('error', 'Lỗi khi xóa quy tắc', err.message);
        }
      },
    });
  };

  // Khôi phục bộ quy tắc mặc định
  const handleResetDefaults = () => {
    if (isDataLocked) {
      showToast('error', 'Sổ dữ liệu đang khóa');
      return;
    }

    if (!classroom?.id) return;

    showConfirmDialog({
      title: 'Khôi phục quy tắc chuẩn',
      message: 'Hệ thống sẽ tái thiết lập toàn bộ quy tắc về danh mục tiêu chuẩn của nhà trường (Đi học đúng giờ +1, Phát biểu +1, Giúp bạn +2, Đi học muộn -2, Không làm bài -2, Vi phạm nội quy -3...).\n\n📌 LƯU Ý: Lịch sử điểm của các học sinh trong tuần và các giao dịch trước đây hoàn toàn không bị ảnh hưởng.',
      confirmLabel: 'Khôi phục mặc định',
      cancelLabel: 'Hủy bỏ',
      isDestructive: false,
      onConfirm: async () => {
        setSyncStatus('syncing');
        try {
          await resetToDefaultPointRules(classroom.id, currentUser?.email || 'GVCN');
          showToast('success', 'Đã khôi phục quy tắc chuẩn', 'Bộ quy tắc mẫu đã được cài đặt thành công.');
          setSyncStatus('saved');
        } catch (err: any) {
          showToast('error', 'Lỗi khôi phục quy tắc', err.message);
          setSyncStatus('error');
        }
      },
    });
  };

  return (
    <div id="point-rules-management-view" className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                Cấu hình Chấm điểm Linh hoạt
              </span>
              <span className="text-xs text-slate-400">• Không hard-code</span>
              <span className="text-xs text-slate-400">• Tự động bảo toàn lịch sử</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hệ thống Quy tắc Chấm điểm Thi đua
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Giáo viên Chủ nhiệm toàn quyền thiết lập các mức điểm cộng/trừ và tiêu chí nề nếp theo văn hóa của lớp. Khi sửa đổi mức điểm, các giao dịch cũ trong lịch sử được bảo lưu nguyên vẹn qua cơ chế Snapshot.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Khôi phục danh mục quy tắc mẫu ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Quy tắc mẫu
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('weekly_points')}
              className="px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Đến bảng Nhập Điểm
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Thêm quy tắc mới
            </button>
          </div>
        </div>

        {/* Quick Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60">
            <span className="text-xs text-slate-500 block font-medium">Tổng số quy tắc</span>
            <span className="text-xl font-bold text-slate-800">{stats.total}</span>
          </div>

          <div className="bg-emerald-50/70 rounded-lg p-3 border border-emerald-200/60">
            <span className="text-xs text-emerald-700 block font-medium">Nội dung cộng điểm (+)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-700">{stats.plusCount}</span>
              <span className="text-xs text-emerald-600 font-medium">quy tắc</span>
            </div>
          </div>

          <div className="bg-rose-50/70 rounded-lg p-3 border border-rose-200/60">
            <span className="text-xs text-rose-700 block font-medium">Nội dung trừ điểm (-)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-rose-700">{stats.minusCount}</span>
              <span className="text-xs text-rose-600 font-medium">quy tắc</span>
            </div>
          </div>

          <div className="bg-blue-50/70 rounded-lg p-3 border border-blue-200/60">
            <span className="text-xs text-blue-700 block font-medium">Đang sử dụng</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-blue-700">{stats.activeCount}</span>
              <span className="text-xs text-blue-600 font-medium">kích hoạt</span>
            </div>
          </div>

          <div className="bg-slate-100/70 rounded-lg p-3 border border-slate-200/60">
            <span className="text-xs text-slate-500 block font-medium">Đã tạm tắt</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-600">{stats.inactiveCount}</span>
              <span className="text-xs text-slate-500 font-medium">ẩn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Integrity Guarantee Banner */}
      <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-amber-950 text-sm">
              Cam kết Bảo toàn Lịch sử (Snapshot Architecture)
            </h3>
            <p className="text-amber-800 leading-relaxed">
              Mỗi lần GVCN ghi nhận điểm cho học sinh, hệ thống sẽ lưu một <strong>Transaction bất biến</strong> chứa chính xác số điểm và bản sao tên quy tắc tại thời điểm đó. Nếu hôm nay bạn đổi mức điểm từ <strong>-2</strong> thành <strong>-3</strong>, các tuần trước đó vẫn được bảo toàn nguyên vẹn <strong>-2</strong> điểm.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm quy tắc theo tên, mô tả, số điểm..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả loại điểm</option>
              <option value="plus">Cộng điểm (+)</option>
              <option value="minus">Trừ điểm (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả nhóm hành vi</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                <option key={catKey} value={catKey}>
                  {catLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang sử dụng</option>
              <option value="inactive">Đã tạm tắt</option>
            </select>
          </div>
        </div>

        {/* Filter Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Lọc nhanh:</span>

          <button
            type="button"
            onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); setStatusFilter('all'); setSearchTerm(''); }}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              typeFilter === 'all' && categoryFilter === 'all' && statusFilter === 'all' && !searchTerm
                ? 'bg-indigo-100 border-indigo-300 text-indigo-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({pointRules.length})
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter(typeFilter === 'plus' ? 'all' : 'plus')}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              typeFilter === 'plus'
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cộng điểm ({stats.plusCount})
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter(typeFilter === 'minus' ? 'all' : 'minus')}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              typeFilter === 'minus'
                ? 'bg-rose-100 border-rose-300 text-rose-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Trừ điểm ({stats.minusCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              statusFilter === 'active'
                ? 'bg-blue-100 border-blue-300 text-blue-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đang dùng ({stats.activeCount})
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4 min-w-[240px]">Tên / Nội dung quy tắc</th>
                <th className="py-3.5 px-4 min-w-[150px]">Nhóm hành vi</th>
                <th className="py-3.5 px-4 w-36 text-center">Mức điểm</th>
                <th className="py-3.5 px-4 w-36 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 w-32 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Scale className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-800">Không tìm thấy quy tắc nào</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all'
                          ? 'Không có quy tắc nào khớp với bộ lọc hiện tại. Hãy thử xóa bớt tiêu chí tìm kiếm.'
                          : 'Lớp học hiện chưa có quy tắc nào. Bạn có thể nhấn nút dưới để tạo hoặc khôi phục quy tắc chuẩn.'}
                      </p>
                      <div className="pt-2 flex justify-center gap-2">
                        {searchTerm || typeFilter !== 'all' ? (
                          <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setTypeFilter('all'); setCategoryFilter('all'); setStatusFilter('all'); }}
                            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Xóa bộ lọc
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResetDefaults}
                            className="px-3.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            Khôi phục quy tắc chuẩn
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, idx) => {
                  const catColor = CATEGORY_COLOR_MAP[rule.category] || CATEGORY_COLOR_MAP.khac;
                  return (
                    <tr 
                      key={rule.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !rule.isActive ? 'bg-slate-50/40 opacity-70' : ''
                      }`}
                    >
                      {/* STT */}
                      <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* Tên & Mô tả */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                            rule.type === 'plus' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {rule.name}
                            </span>
                            {rule.description && (
                              <span className="text-xs text-slate-500 mt-0.5 block line-clamp-1">
                                {rule.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Nhóm hành vi */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                          {rule.categoryLabel || CATEGORY_LABELS[rule.category] || 'Khác'}
                        </span>
                      </td>

                      {/* Mức điểm */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-lg text-sm ${
                          rule.type === 'plus'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {rule.type === 'plus' ? `+${Math.abs(rule.score)}` : `-${Math.abs(rule.score)}`} điểm
                        </span>
                      </td>

                      {/* Trạng thái sử dụng (Toggle Switch) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rule)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                            rule.isActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Nhấp để bật hoặc tắt áp dụng quy tắc này"
                        >
                          <span className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {rule.isActive ? 'Đang dùng' : 'Đã tắt'}
                        </button>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rule)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Chỉnh sửa nội dung hoặc điểm quy tắc"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa quy tắc (không làm mất lịch sử các tuần cũ)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
          <span>
            Đang hiển thị <strong>{filteredRules.length}</strong> / <strong>{pointRules.length}</strong> quy tắc
          </span>
          <span className="text-slate-400">
            Chỉ áp dụng các quy tắc "Đang dùng" khi nhập điểm tuần
          </span>
        </div>
      </div>

      {/* Modal Add / Edit */}
      <PointRuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        editingRule={editingRule}
      />
    </div>
  );
}

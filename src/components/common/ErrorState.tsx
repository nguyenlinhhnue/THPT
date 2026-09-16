import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Đã xảy ra lỗi kết nối',
  message = 'Không thể đồng bộ dữ liệu từ hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div id="error-state" className="flex flex-col items-center justify-center min-h-[360px] p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          id="error-retry-btn"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </button>
      )}
    </div>
  );
}

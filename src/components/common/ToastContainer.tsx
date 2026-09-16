import React from 'react';
import { useUI } from '../../context/UIContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useUI();

  if (toasts.length === 0) return null;

  return (
    <div 
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        let bg = 'bg-white border-slate-200 text-slate-800';
        let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;

        if (t.type === 'success') {
          bg = 'bg-emerald-50 border-emerald-200 text-emerald-950';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (t.type === 'error') {
          bg = 'bg-rose-50 border-rose-200 text-rose-950';
          icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
        } else if (t.type === 'warning') {
          bg = 'bg-amber-50 border-amber-200 text-amber-950';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
        }

        return (
          <div
            key={t.id}
            id={`toast-${t.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 ${bg}`}
            role="alert"
          >
            {icon}
            <div className="flex-1 text-sm">
              <p className="font-semibold">{t.title}</p>
              {t.message && <p className="mt-0.5 text-xs opacity-90 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

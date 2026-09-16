import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

export function ConfirmDialog() {
  const { confirmDialog, closeConfirmDialog } = useUI();
  const [submitting, setSubmitting] = useState(false);

  if (!confirmDialog.isOpen) return null;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await confirmDialog.onConfirm();
      closeConfirmDialog();
    } catch (err) {
      console.error('Confirm action error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      id="confirm-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div 
        id="confirm-dialog-content"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${confirmDialog.isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
            {confirmDialog.isDestructive ? <AlertCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{confirmDialog.title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{confirmDialog.message}</p>
          </div>
          <button 
            onClick={closeConfirmDialog}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            id="confirm-dialog-cancel-btn"
            disabled={submitting}
            onClick={closeConfirmDialog}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {confirmDialog.cancelLabel || 'Hủy bỏ'}
          </button>
          <button
            type="button"
            id="confirm-dialog-action-btn"
            disabled={submitting}
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
              confirmDialog.isDestructive 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {confirmDialog.confirmLabel || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

export type NavTab = 
  | 'dashboard' 
  | 'classification'
  | 'learning'
  | 'weekly_points'
  | 'point_rules'
  | 'students' 
  | 'scores' 
  | 'conduct' 
  | 'competition' 
  | 'timetable'
  | 'reports' 
  | 'backup'
  | 'settings';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
}

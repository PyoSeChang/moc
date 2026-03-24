import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

interface ToastEntryProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastEntry: React.FC<ToastEntryProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const dur = toast.duration ?? 4000;
    if (dur > 0) {
      const timer = setTimeout(() => onDismiss(toast.id), dur);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-card border border-subtle shadow-lg text-sm text-default min-w-[280px] animate-in slide-in-from-right duration-200 border-l-[3px]`} style={{ borderLeftColor: `var(--status-${toast.type})` }}>
      <span style={{ color: `var(--status-${toast.type})`, flexShrink: 0 }}>{ICONS[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-0 bg-transparent border-none text-muted cursor-pointer hover:text-default transition-colors flex items-center justify-center"
      >
        <X size={14} />
      </button>
    </div>
  );
};

let addToastFn: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function showToast(type: ToastType, message: string, duration?: number) {
  addToastFn?.({ type, message, duration });
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastEntry key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body
  );
};

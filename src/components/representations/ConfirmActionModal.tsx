import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmActionModalProps {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  tone?: 'danger' | 'primary';
  footer?: ReactNode;
  loading?: boolean;
}

export function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  open,
  onConfirm,
  onClose,
  tone = 'primary',
  footer,
  loading,
}: ConfirmActionModalProps) {
  if (!open) return null;

  const confirmClasses = cn(
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition',
    tone === 'danger'
      ? 'bg-rose-600 text-white hover:bg-rose-700'
      : 'bg-slate-900 text-white hover:bg-slate-800',
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && <p className="text-sm text-slate-600">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {footer && <div className="mt-4 text-sm text-slate-700">{footer}</div>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button type="button" className={confirmClasses} onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

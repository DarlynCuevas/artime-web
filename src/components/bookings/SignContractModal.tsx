import { useState } from 'react';
import { FileSignature, X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  confirmLabel: string;
  onConfirm: (params: { conditionsAccepted: boolean }) => Promise<void>;
  onClose: () => void;
};

export function SignContractModal({
  open,
  title,
  confirmLabel,
  onConfirm,
  onClose,
}: Props) {
  const [conditionsAccepted, setConditionsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (loading) return;
        onClose();
        setConditionsAccepted(false);
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <FileSignature className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contrato</p>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (loading) return;
              onClose();
              setConditionsAccepted(false);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={conditionsAccepted}
                onChange={(e) => setConditionsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-amber-200"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">Acepto las condiciones del contrato</p>
                <p className="text-xs text-slate-500 mt-0.5">La firma se registrará en ARTIME para trazabilidad.</p>
              </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                if (loading) return;
                onClose();
                setConditionsAccepted(false);
              }}
              disabled={loading}
              className="h-11 w-full sm:w-auto px-5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading || !conditionsAccepted}
              onClick={async () => {
                setLoading(true);
                try {
                  await onConfirm({ conditionsAccepted });
                  onClose();
                  setConditionsAccepted(false);
                } finally {
                  setLoading(false);
                }
              }}
              className="h-11 w-full sm:w-auto px-6 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {loading ? 'Procesando…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

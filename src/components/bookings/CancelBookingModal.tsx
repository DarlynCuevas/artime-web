import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  confirmLabel: string;
  onConfirm: (params: { reason: string; description: string }) => Promise<void>;
  onClose: () => void;
};

export function CancelBookingModal({
  open,
  title,
  confirmLabel,
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (loading) return;
        onClose();
        setReason('');
        setDescription('');
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cancelación</p>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (loading) return;
              onClose();
              setReason('');
              setDescription('');
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Motivo</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
            >
              <option value="">Selecciona un motivo</option>
              <option value="ARTIST_UNJUSTIFIED">Cancelación del artista (no justificada)</option>
              <option value="ARTIST_JUSTIFIED">Cancelación del artista (causa mayor)</option>
              <option value="VENUE">Cancelación de la sala/promotor</option>
              <option value="FORCE_MAJEURE">Fuerza mayor</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
              placeholder="Añade contexto para trazabilidad (opcional)"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                if (loading) return;
                onClose();
                setReason('');
                setDescription('');
              }}
              disabled={loading}
              className="h-11 w-full sm:w-auto px-5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading || !reason}
              onClick={async () => {
                setLoading(true);
                try {
                  await onConfirm({ reason, description });
                  onClose();
                  setReason('');
                  setDescription('');
                } finally {
                  setLoading(false);
                }
              }}
              className="h-11 w-full sm:w-auto px-6 rounded-xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {loading ? 'Procesando…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

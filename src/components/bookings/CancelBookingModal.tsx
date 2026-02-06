import { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-10 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="px-8 pt-8 pb-6 border-b border-slate-50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{title}</h2>
              <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Protocolo de rescisión operativa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Motivo de la Cancelación</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-5 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="">Selecciona un motivo</option>
              <option value="ARTIST_UNJUSTIFIED">Cancelación del artista (no justificada)</option>
              <option value="ARTIST_JUSTIFIED">Cancelación del artista (causa mayor)</option>
              <option value="VENUE">Cancelación de la sala/promotor</option>
              <option value="FORCE_MAJEURE">Fuerza mayor</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Descripción y Detalles (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all outline-none resize-none placeholder:text-slate-300"
              rows={4}
              placeholder="Especifica los detalles para el registro administrativo..."
            />
          </div>

          <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100/50">
            <p className="text-[10px] font-black text-red-900 uppercase tracking-[0.15em] leading-relaxed text-center">
              Esta acción es irreversible y afectará a la reputación operativa en la plataforma.
            </p>
          </div>
        </div>

        <footer className="px-8 py-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-3">
          <button
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
            className="flex-1 h-14 inline-flex items-center justify-center gap-3 rounded-2xl bg-red-600 text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-600/10 hover:bg-red-700 disabled:opacity-30 transition-all group"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : confirmLabel}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-14 inline-flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-900 text-[13px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
          >
            Abortar
          </button>
        </footer>
      </div>
    </div>
  );
}

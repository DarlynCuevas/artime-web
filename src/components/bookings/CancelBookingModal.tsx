import { useState } from 'react';

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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{ background: '#fff', padding: 24, maxWidth: 520, width: '100%' }}>
        <h2>{title}</h2>

        <div style={{ marginTop: 16 }}>
          <label>
            Motivo
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4 }}
            >
              <option value="">Selecciona un motivo</option>
              <option value="ARTIST_DECISION">Decisión del artista</option>
              <option value="VENUE_DECISION">Decisión de la sala</option>
              <option value="SCHEDULING_ISSUE">Problema de agenda</option>
              <option value="OTHER">Otro</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <label>
            Descripción (opcional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4 }}
              rows={4}
            />
          </label>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
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
            style={{
              background: '#000',
              color: '#fff',
              padding: '8px 12px',
              border: 'none',
            }}
          >
            {confirmLabel}
          </button>

          <button onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

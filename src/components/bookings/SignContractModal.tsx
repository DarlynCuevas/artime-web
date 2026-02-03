import { useState } from 'react';

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
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={conditionsAccepted}
              onChange={(e) => setConditionsAccepted(e.target.checked)}
            />
            Acepto las condiciones del contrato.
          </label>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <button
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

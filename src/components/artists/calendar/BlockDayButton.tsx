type Props = {
  selectedDate: string | null;
  selectedStatus: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | null;
  onBlockDay?: (date: string) => void;
  onUnblockDay?: (date: string) => void;
};

export function BlockDayButton({ selectedDate, selectedStatus, onBlockDay, onUnblockDay }: Props) {
  if (!selectedDate) return null;

  const canBlock = selectedDate && selectedStatus === 'AVAILABLE';
  const canUnblock = selectedDate && selectedStatus === 'BLOCKED';
  const isBooked = selectedStatus === 'BOOKED';

  if (isBooked) {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 200, color: '#333' }}>
          Día seleccionado: {selectedDate}
          <div style={{ color: '#b71c1c', fontSize: 12 }}>Este día está reservado; no se puede bloquear ni desbloquear.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 200, color: '#333' }}>
        Día seleccionado: {selectedDate}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          style={{ padding: '10px 14px', border: "1px solid #222", background: '#111', color: '#fff' }}
          disabled={!canBlock}
          onClick={() => selectedDate && onBlockDay?.(selectedDate)}
        >
          Bloquear día
        </button>
        <button
          type="button"
          style={{ padding: '10px 14px', border: "1px solid #ccc", background: '#fff', color: '#111' }}
          disabled={!canUnblock}
          onClick={() => selectedDate && onUnblockDay?.(selectedDate)}
        >
          Desbloquear día
        </button>
      </div>
    </div>
  );
}

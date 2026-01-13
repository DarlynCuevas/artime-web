import { Payout } from '../types/payout.type';
import { PayoutStatusBadge } from './PayoutStatusBadge';

export function PayoutItem({ payout }: { payout: Payout }) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8 }}>
      <div>
        <strong>Evento:</strong> {payout.booking.venueName ?? '—'}
      </div>

      <div>
        <strong>Fecha:</strong> {payout.booking.date}
      </div>

      <div>
        <strong>Importe neto:</strong> {payout.artistAmount} {payout.currency}
      </div>

      <PayoutStatusBadge status={payout.status} />

      {payout.status === 'FAILED' && payout.failureReason && (
        <p style={{ color: 'red' }}>{payout.failureReason}</p>
      )}
    </div>
  );
}

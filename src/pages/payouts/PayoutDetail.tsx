import { Payout } from '../../types/payout.type';
import { PayoutStatusBadge } from './PayoutStatusBadge';
import { PayoutStatus } from '../../types/payout-status.enum';

export function PayoutDetail({ payout }: { payout: Payout }) {
  return (
    <div>
      <h1>Detalle del pago</h1>

      <PayoutStatusBadge status={payout.status} />

      <hr />

      <p>
        <strong>Evento:</strong> {payout.booking.venueName ?? '—'}
      </p>

      <p>
        <strong>Fecha:</strong> {payout.booking.date}
      </p>

      <p>
        <strong>Importe neto:</strong>{' '}
        {payout.artistAmount} {payout.currency}
      </p>

      {payout.executedAt && (
        <p>
          <strong>Pagado el:</strong> {payout.executedAt}
        </p>
      )}

      {payout.status === PayoutStatus.FAILED &&
        payout.failureReason && (
          <p style={{ color: 'red' }}>
            {payout.failureReason}
          </p>
        )}
    </div>
  );
}

export default PayoutDetail;

import Link from 'next/link';
import { Payout } from '../../types/payout.type';
import { PayoutStatusBadge } from './PayoutStatusBadge';

export function PayoutList({ payouts }: { payouts: Payout[] }) {
  return (
    <div>
      {payouts.map((payout) => (
        <div key={payout.id} style={{ marginBottom: 16 }}>
          <span>
            {payout.booking.venueName ?? '—'} — {payout.artistAmount}{' '}
            {payout.currency}
          </span>
          <PayoutStatusBadge status={payout.status} />
          <Link href={`/payouts/${payout.id}`} style={{ marginLeft: 12 }}>
            Ver detalle
          </Link>
        </div>
      ))}
    </div>
  );
}

export default PayoutList;

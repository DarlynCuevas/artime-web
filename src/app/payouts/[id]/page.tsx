'use client';

import { useEffect, useState } from 'react';
import { fetchPayoutById } from '../../services/payouts.service';
import { Payout } from '../../types/payout.type';
import { PayoutDetail } from '../PayoutDetail';

export default function PayoutDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [payout, setPayout] = useState<Payout | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayoutById(params.id)
      .then(setPayout)
      .catch(err => setError(err.message));
  }, [params.id]);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!payout) {
    return <p>Cargando payout…</p>;
  }

  return <PayoutDetail payout={payout} />;
}

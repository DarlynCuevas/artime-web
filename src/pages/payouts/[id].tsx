import { useEffect, useState } from 'react';

import { fetchPayoutById } from '@/services/payouts/payouts.service';
import { useAuth } from '@/hooks/auth/useAuth';
import { Payout } from '@/types/payout.type';
import { PayoutDetail } from './PayoutDetail';

export default function PayoutDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [payout, setPayout] = useState<Payout | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  useEffect(() => {
    if (!user?.token) return;
    fetchPayoutById(params.id, user.token)
      .then(setPayout)
      .catch(err => setError(err.message));
  }, [params.id, user?.token]);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!payout) {
    return <p>Cargando payout…</p>;
  }

  return <PayoutDetail payout={payout} />;
}

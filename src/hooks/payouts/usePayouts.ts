import { fetchPayouts } from '@/services/payouts/payouts.service';
import { Payout } from '@/types/payout.type';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';

export function usePayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.token) return;
    fetchPayouts(user.token)
      .then(setPayouts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.token]);
  return { payouts, loading, error };
}

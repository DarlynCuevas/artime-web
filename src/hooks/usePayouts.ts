import { useEffect, useState } from 'react';
import { fetchPayouts } from '../services/payouts.service';
import { Payout } from '../types/payout.type';

export function usePayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts()
      .then(setPayouts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { payouts, loading, error };
}

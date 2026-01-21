import { useAuth } from '@/hooks/auth/useAuth';
import { getContractByBooking } from '@/services/contracts/contracts.service';
import { useEffect, useState, useCallback } from 'react';

export function useContract(bookingId?: string) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadContract = useCallback(async () => {
    if (!bookingId || !user?.token) {
      setContract(null);
      return;
    }

    setLoading(true);
    try {
      const data = await getContractByBooking(bookingId, user.token);
      setContract(data);
    } catch {
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId, user?.token]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  return {
    contract,
    loading,
    refresh: loadContract,
  };
}

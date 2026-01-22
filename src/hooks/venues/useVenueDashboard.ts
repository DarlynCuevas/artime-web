import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';

type VenueDashboard = {
  metrics: {
    activeBookingsCount: number;
    upcomingBookingsCount: number;
    totalRevenue: number;
    pendingActionsCount: number;
    confirmedSpent: number;
    expectedSpent: number;
  };
  upcomingBookings: {
    bookingId: string;
    artistName: string;
    startDate: string;
    status: string;
    totalAmount: number;
    currency: string;
  }[];
};

export function useVenueDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<VenueDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/venues/dashboard`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [user?.token]);

  return { data, loading };
}

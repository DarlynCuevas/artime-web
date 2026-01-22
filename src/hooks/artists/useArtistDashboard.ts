import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';

type ArtistDashboard = {
  metrics: {
    activeBookingsCount: number;
    upcomingBookingsCount: number;
    expectedIncome: number;
    confirmedIncome: number;
    pendingActionsCount: number;
    forecastIncome: number;
    occupancyRate: number;
    reservedDaysCount: number;
    blockedDaysCount: number;
  };
  upcomingBookings: {
    bookingId: string;
    venueName: string;
    startDate: string;
    status: string;
    totalAmount: number;
    currency: string;
  }[];
};

export function useArtistDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ArtistDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/dashboard`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar el dashboard');
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.token]);

  return { data, loading, error };
}

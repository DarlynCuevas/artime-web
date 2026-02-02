import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';

export function usePromoterDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    // MOCK: Elimina esto cuando el backend esté listo
    setTimeout(() => {
      setData({
        profile: { id: 'mock-id', name: 'Promotor Demo' },
        metrics: {
          totalEvents: 3,
          activeEvents: 2,
          draftEvents: 1,
        },
        events: [
          { id: 'evt1', name: 'Evento 1', status: 'ACTIVE', start_date: new Date().toISOString() },
          { id: 'evt2', name: 'Evento 2', status: 'DRAFT', start_date: new Date().toISOString() },
        ],
      });
      setLoading(false);
    }, 500);
    // FIN MOCK
    // Descomenta esto cuando el backend esté listo
    /*
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/promoters/dashboard`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    */
  }, [user?.token]);

  return { data, loading };
}

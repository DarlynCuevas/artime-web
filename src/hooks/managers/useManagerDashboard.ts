import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { PayoutStatus } from '@/types/payout-status.enum';

export type ManagerDashboardData = {
  summary: {
    representedArtists: number;
    activeBookings: number;
    actionRequired: number;
    managerNetIncome: number;
  };
  artists: {
    id: string;
    name: string;
    avatar?: string;
    status: 'ACTIVE' | 'PAUSED';
    nextShow?: string | null;
    activeBookings: number;
  }[];
  actionBookings: {
    id: string;
    artistName: string;
    partnerName: string;
    date: string;
    status:
      | 'PENDING'
      | 'NEGOTIATING'
      | 'FINAL_OFFER_SENT'
      | 'ACCEPTED'
      | 'CONTRACT_SENT'
      | 'CONTRACT_SIGNED';
    actionLabel: string;
  }[];
  activeBookings: {
    id: string;
    artistName: string;
    partnerName: string;
    date: string;
    status:
      | 'PENDING'
      | 'NEGOTIATING'
      | 'FINAL_OFFER_SENT'
      | 'ACCEPTED'
      | 'CONTRACT_SIGNED'
      | 'PAID_PARTIAL'
      | 'PAID_FULL';
  }[];
  payouts: {
    upcoming: {
      id: string;
      amount: number;
      currency: string;
      expectedDate: string;
      status: PayoutStatus;
    }[];
    completed: {
      id: string;
      amount: number;
      currency: string;
      paidDate: string;
      status: PayoutStatus;
    }[];
  };
};

export function useManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Replace with real API call when backend endpoint is ready.
    // For now we mock a deterministic snapshot so UI can ship.
    if (!user?.token) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const mock: ManagerDashboardData = {
      summary: {
        representedArtists: 3,
        activeBookings: 8,
        actionRequired: 3,
        managerNetIncome: 12450,
      },
      artists: [
        {
          id: 'artist-1',
          name: 'Luna Norte',
          avatar: '/artists/luna-norte.png',
          status: 'ACTIVE',
          nextShow: new Date().toISOString(),
          activeBookings: 3,
        },
        {
          id: 'artist-2',
          name: 'Electric Río',
          avatar: '/artists/electric-rio.png',
          status: 'ACTIVE',
          nextShow: null,
          activeBookings: 2,
        },
        {
          id: 'artist-3',
          name: 'Mar de Fuego',
          avatar: '/artists/mar-de-fuego.png',
          status: 'PAUSED',
          nextShow: null,
          activeBookings: 1,
        },
      ],
      actionBookings: [
        {
          id: 'bk-1201',
          artistName: 'Luna Norte',
          partnerName: 'Sala Brava',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'NEGOTIATING',
          actionLabel: 'Responder negociación',
        },
        {
          id: 'bk-1184',
          artistName: 'Electric Río',
          partnerName: 'Promotor Vértigo',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'FINAL_OFFER_SENT',
          actionLabel: 'Aceptar o rechazar oferta',
        },
        {
          id: 'bk-1173',
          artistName: 'Mar de Fuego',
          partnerName: 'Sala Atlántico',
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'CONTRACT_SENT',
          actionLabel: 'Firmar contrato',
        },
      ],
      activeBookings: [
        {
          id: 'bk-1201',
          artistName: 'Luna Norte',
          partnerName: 'Sala Brava',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'NEGOTIATING',
        },
        {
          id: 'bk-1184',
          artistName: 'Electric Río',
          partnerName: 'Promotor Vértigo',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'FINAL_OFFER_SENT',
        },
        {
          id: 'bk-1173',
          artistName: 'Mar de Fuego',
          partnerName: 'Sala Atlántico',
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'CONTRACT_SIGNED',
        },
        {
          id: 'bk-1168',
          artistName: 'Luna Norte',
          partnerName: 'Promotor Norte',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PAID_PARTIAL',
        },
        {
          id: 'bk-1150',
          artistName: 'Electric Río',
          partnerName: 'Sala Horizonte',
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PAID_FULL',
        },
      ],
      payouts: {
        upcoming: [
          {
            id: 'py-301',
            amount: 1800,
            currency: 'EUR',
            expectedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: PayoutStatus.READY_TO_PAY,
          },
          {
            id: 'py-298',
            amount: 950,
            currency: 'EUR',
            expectedDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            status: PayoutStatus.PENDING,
          },
        ],
        completed: [
          {
            id: 'py-295',
            amount: 2200,
            currency: 'EUR',
            paidDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            status: PayoutStatus.PAID,
          },
          {
            id: 'py-291',
            amount: 1300,
            currency: 'EUR',
            paidDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            status: PayoutStatus.PAID,
          },
        ],
      },
    };

    setData(mock);
    setLoading(false);
  }, [user?.token]);

  return { data, loading, error };
}

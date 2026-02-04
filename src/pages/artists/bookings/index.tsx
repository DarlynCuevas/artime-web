import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { StatusBadge } from '@/components/ui/StatusBadge';

import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';

type BookingDto = {
  id: string;
  status: string;
  start_date: string | null;
  totalAmount: number | null;
  currency: string;
  venueId?: string | null;
  venueName?: string | null;
  city?: string | null;
  createdAt?: string | null;
  paidPercent?: number | null;
  eventName?: string | null;
};

function groupByStatus(bookings: BookingDto[]) {
  return bookings.reduce<Record<string, BookingDto[]>>((acc, booking) => {
    if (!acc[booking.status]) acc[booking.status] = [];
    acc[booking.status].push(booking);
    return acc;
  }, {});
}

const TABS = [
  {
    key: 'PENDING',
    label: 'Pendientes',
    statuses: ['PENDING', 'FINAL_OFFER_SENT'],
  },
  {
    key: 'NEGOTIATING',
    label: 'En negociación',
    statuses: ['NEGOTIATING'],
  },
  {
    key: 'CONFIRMED',
    label: 'Confirmadas',
    statuses: ['ACCEPTED', 'CONTRACT_SIGNED'],
  },
  {
    key: 'PAID',
    label: 'Pagadas',
    statuses: ['PAID_PARTIAL', 'PAID_FULL', 'PAID', 'PAID_50', 'PAID_75', 'PAID_100', 'PAID_BALANCE'],
  },
  {
    key: 'HISTORIC',
    label: 'Histórico',
    statuses: ['COMPLETED', 'REJECTED', 'CANCELLED'],
  },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function ArtistBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('PENDING');

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudieron cargar las contrataciones');
        return res.json();
      })
      .then((data: any[]) => {
        const normalized = data.map((b) => ({
          id: b.id,
          status: b.status,
          start_date: b.start_date ?? null,
          totalAmount: b.totalAmount ?? null,
          currency: b.currency ?? 'EUR',
          venueId: b.venueId ?? null,
          venueName: b.venueName ?? null,
          city: b.city ?? null,
          createdAt: b.createdAt ?? null,
          paidPercent: b.paidPercent ?? null,
          eventName: b.eventName ?? null,
        })) as BookingDto[];
        setBookings(normalized);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.token]);

  if (loading) {
    return <p style={{ padding: 40 }}>Cargando contrataciones…</p>;
  }

  if (error) {
    return (
      <p style={{ padding: 40, color: 'red' }}>
        {error}
      </p>
    );
  }

  const bookingsByStatus = groupByStatus(bookings);

  const countsByTab = useMemo(() => {
    const map: Record<string, number> = {};
    TABS.forEach((tab) => {
      const base = bookings.filter((b) => tab.statuses.includes(b.status));
      map[tab.key] = tab.key === 'CONFIRMED'
        ? base.filter((b) => b.status !== 'PENDING').length
        : base.length;
    });
    return map;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab) return [] as BookingDto[];
    const base = bookings.filter((b) => tab.statuses.includes(b.status));
    const filtered =
      tab.key === 'CONFIRMED'
        ? base.filter((b) => b.status !== 'PENDING')
        : base;

    if (tab.key === 'PENDING') {
      return [...filtered].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    return filtered;
  }, [bookings, activeTab]);

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Bookings</h1>
        <p style={{ color: '#555' }}>
          Vista del artista con estado de contrataciones, fee y sala.
        </p>
      </header>

      <section style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: activeTab === tab.key ? '1px solid #0f172a' : '1px solid #ddd',
              background: activeTab === tab.key ? '#0f172a' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#0f172a',
              cursor: 'pointer',
              minWidth: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : '#f2f2f2',
                color: activeTab === tab.key ? '#fff' : '#0f172a',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {countsByTab[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </section>

      {bookings.length === 0 && (
        <section
          style={{
            padding: 24,
            border: '1px solid #ddd',
            background: '#fafafa',
          }}
        >
          <p>No hay bookings activos.</p>
          <p style={{ color: '#666' }}>
            Cuando tengas nuevas contrataciones aparecerán aquí.
          </p>
        </section>
      )}

      {bookings.length > 0 && (
        <section style={{ border: '1px solid #ddd' }}>
          <header
            style={{
              padding: '16px',
              borderBottom: '1px solid #ddd',
              background: '#f5f5f5',
            }}
          >
            <h2 style={{ fontSize: 16, marginBottom: 4 }}>{TABS.find((t) => t.key === activeTab)?.label}</h2>
            <p style={{ fontSize: 13, color: '#555' }}>
              {filteredBookings.length}{' '}
              {filteredBookings.length === 1 ? 'booking' : 'bookings'}
            </p>
          </header>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {filteredBookings.map((booking) => (
              <li
                key={booking.id}
                style={{
                  padding: 16,
                  borderTop: '1px solid #eee',
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 2fr 1fr',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>
                    {booking.eventName || booking.venueName || booking.venueId || 'Venue sin nombre'}
                  </strong>
                  {booking.eventName && (
                    <div style={{ color: '#666', fontSize: 13 }}>
                      Sala: {booking.venueName || booking.venueId || 'Sala sin nombre'}
                    </div>
                  )}
                  <div style={{ color: '#666', fontSize: 13 }}>
                    {booking.city ? `Ciudad: ${booking.city}` : 'Ciudad no indicada'}
                  </div>
                </div>

                <div>
                  Fecha: {booking.start_date ? formatDate(booking.start_date) : '—'}
                </div>

                <div>
                  Fee: {booking.totalAmount ? `${booking.totalAmount} ${booking.currency}` : '—'}
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <StatusBadge status={booking.status} paidPercent={booking.paidPercent} />
                  </div>
                  <Link href={`/bookings/${booking.id}`}>
                    Abrir booking
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default withRole(ArtistBookingsPage, ['ARTIST']);

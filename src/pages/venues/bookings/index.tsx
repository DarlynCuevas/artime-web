import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { getInterestedArtistCalls, InterestedArtistCall } from '@/services/venues/artist-calls.service';

type BookingDto = {
  id: string;
  status: string;
  start_date: string | null;
  totalAmount: number | null;
  currency: string;
  artistId?: string | null;
  artistName?: string | null;
  city?: string | null;
};

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
    statuses: ['ACCEPTED', 'CONTRACT_SIGNED', 'PAID', 'PAID_50', 'PAID_75', 'PAID_100', 'PAID_BALANCE'],
  },
  {
    key: 'INTERESTED',
    label: 'Interesados',
    statuses: [],
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

function BookingsVenuePage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [interestedCalls, setInterestedCalls] = useState<InterestedArtistCall[]>([]);
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

    Promise.all([
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
            artistId: b.artistId ?? null,
            artistName: b.artistName ?? null,
            city: b.artistCity ?? b.city ?? null,
          })) as BookingDto[];
          setBookings(normalized);
        }),
      getInterestedArtistCalls(user.token).then(setInterestedCalls),
    ])
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

  const countsByTab = useMemo(() => {
    const map: Record<string, number> = {};
    TABS.forEach((tab) => {
      if (tab.key === 'INTERESTED') {
        map[tab.key] = interestedCalls.length;
      } else {
        map[tab.key] = bookings.filter((b) => tab.statuses.includes(b.status)).length;
      }
    });
    return map;
  }, [bookings, interestedCalls]);

  const filteredBookings = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab) return [] as BookingDto[];
    return bookings.filter((b) => tab.statuses.includes(b.status));
  }, [bookings, activeTab]);

  const activeInterested = activeTab === 'INTERESTED';

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          Bookings
        </h1>
        <p style={{ color: '#555' }}>
          Vista del venue con estado de contrataciones, fee y artista.
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

      {bookings.length === 0 && !activeInterested && (
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

      {(bookings.length > 0 || activeInterested) && (
        <section style={{ border: '1px solid #ddd' }}>
          <header
            style={{
              padding: '16px',
              borderBottom: '1px solid #ddd',
              background: '#f5f5f5',
            }}
          >
            <h2 style={{ fontSize: 16, marginBottom: 4 }}>{TABS.find((t) => t.key === activeTab)?.label}</h2>
            {!activeInterested && (
              <p style={{ fontSize: 13, color: '#555' }}>
                {filteredBookings.length}{' '}
                {filteredBookings.length === 1 ? 'booking' : 'bookings'}
              </p>
            )}
            {activeInterested && (
              <p style={{ fontSize: 13, color: '#555' }}>
                {interestedCalls.length}{' '}
                {interestedCalls.length === 1 ? 'artista interesado' : 'artistas interesados'}
              </p>
            )}
          </header>

          {!activeInterested && (
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
                    <strong>{booking.artistName || booking.artistId || 'Artista sin nombre'}</strong>
                    <div style={{ color: '#666', fontSize: 13 }}>
                      {booking.city ? booking.city : ''}
                      {booking.city ? ` · Booking ${booking.id.slice(0, 8)}…` : `Booking ${booking.id.slice(0, 8)}…`}
                    </div>
                  </div>

                  <div>
                    Fecha: {booking.start_date ? formatDate(booking.start_date) : '—'}
                  </div>

                  <div>
                    Fee: {booking.totalAmount ? `${booking.totalAmount} ${booking.currency}` : '—'}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Link href={`/bookings/${booking.id}`}>
                      Abrir booking
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {activeInterested && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {interestedCalls.map((item) => (
                <li
                  key={`${item.callId}-${item.artistId ?? 'unknown'}`}
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
                    <strong>{item.artistName}</strong>
                    <div style={{ color: '#666', fontSize: 13 }}>
                      {item.artistCity ?? 'Ciudad no indicada'}
                      {item.city ? ` · Convocatoria: ${item.city}` : ''}
                    </div>
                  </div>

                  <div>
                    Fecha interesada: {item.date ? formatDate(item.date) : '—'}
                  </div>

                  <div>
                    Oferta del venue: {item.offeredPrice ? `${item.offeredPrice} ${item.currency}` : '—'}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Link href={`/venues/bookings/new?artistId=${item.artistId ?? ''}&date=${item.date ?? ''}&amount=${item.offeredPrice ?? ''}`}>
                      Iniciar contratación
                    </Link>
                  </div>
                </li>
              ))}

              {interestedCalls.length === 0 && (
                <li style={{ padding: 16 }}>
                  <p style={{ color: '#666', margin: 0 }}>Todavía no hay artistas interesados.</p>
                </li>
              )}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

export default withRole(BookingsVenuePage, ['VENUE', 'PROMOTER']);


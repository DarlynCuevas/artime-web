import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { Booking } from '@/types/booking';

type BookingDto = {
  id: string;
  status: string;
  start_date: string | null;
  totalAmount?: number;
  currency?: string;
};

function groupByStatus(bookings: BookingDto[]) {
  return bookings.reduce<Record<string, BookingDto[]>>(
    (acc, booking) => {
      if (!acc[booking.status]) {
        acc[booking.status] = [];
      }
      acc[booking.status].push(booking);
      return acc;
    },
    {},
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) return;

    setLoading(true);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error();
        }
        return res.json();
      })
      .then(setBookings)
      .catch(() =>
        setError('No se pudieron cargar las contrataciones'),
      )
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

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          Bookings
        </h1>
        <p style={{ color: '#555' }}>
          Listado de contrataciones registradas y su estado
          actual.
        </p>
      </header>

      {/* EMPTY STATE */}
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
            No existen responsabilidades operativas en este
            momento.
          </p>
        </section>
      )}

      {/* BOOKINGS BY STATUS */}
      {bookings.length > 0 && (
        <section>
          {Object.entries(bookingsByStatus).map(
            ([status, statusBookings]) => (
              <section
                key={status}
                style={{
                  marginBottom: 32,
                  border: '1px solid #ddd',
                }}
              >
                {/* STATUS HEADER */}
                <header
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #ddd',
                    background: '#f5f5f5',
                  }}
                >
                  <h2
                    style={{
                      fontSize: 16,
                      marginBottom: 4,
                    }}
                  >
                    {status}
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#555',
                    }}
                  >
                    {statusBookings.length}{' '}
                    {statusBookings.length === 1
                      ? 'booking'
                      : 'bookings'}
                  </p>
                </header>

                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {statusBookings.map((booking) => (
                    <li
                      key={booking.id}
                      style={{
                        padding: 16,
                        borderTop:
                          '1px solid #eee',
                        display: 'grid',
                        gridTemplateColumns:
                          '2fr 2fr 2fr 1fr',
                        gap: 16,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>
                          Booking{' '}
                          {booking.id.slice(0, 8)}…
                        </strong>
                      </div>

                      <div>
                        Fecha:{' '}
                        {booking.start_date
                          ? formatDate(
                              booking.start_date,
                            )
                          : '—'}
                      </div>

                      <div>
                        Importe:{' '}
                        {booking.totalAmount
                          ? `${booking.totalAmount} ${booking.currency}`
                          : '—'}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <Link
                          href={`/bookings/${booking.id}`}
                        >
                          Abrir booking
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </section>
      )}
    </main>
  );
}


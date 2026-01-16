import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { BookingDto } from '@/services/bookings/bookings.service';

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
          throw new Error('Error cargando las contrataciones');
        }
        return res.json();
      })
      .then(setBookings)
      .catch(() => setError('No se pudieron cargar las contrataciones'))
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
          Contrataciones
        </h1>
        <p style={{ color: '#555' }}>
          Gestión de tus actuaciones y propuestas activas.
        </p>
      </header>

      {bookings.length === 0 && (
        <section
          style={{
            padding: 24,
            border: '1px solid #ddd',
            background: '#fafafa',
          }}
        >
          <p>
            No tienes contrataciones registradas.
          </p>
        </section>
      )}

      {bookings.length > 0 && (
        <section
          style={{
            border: '1px solid #ddd',
            padding: 16,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <th align="left">Referencia</th>
                <th align="left">Fecha</th>
                <th align="left">Estado</th>
                <th align="right">Importe</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => {
                const isCancelled =
                  booking.status === 'CANCELLED' ||
                  booking.status === 'CANCELLED_PENDING_REVIEW';

                return (
                  <tr
                    key={booking.id}
                    style={{
                      borderTop: '1px solid #eee',
                      background: isCancelled ? '#fafafa' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 0' }}>
                      {booking.id.slice(0, 8)}…
                    </td>

                    <td>
                      {booking.start_date
                        ? new Date(
                            booking.start_date,
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      <span
                        style={{
                          fontWeight: 500,
                          color: isCancelled ? '#999' : '#000',
                        }}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td align="right">
                      {booking.totalAmount} {booking.currency}
                    </td>

                    <td align="right">
                      <Link href={`/bookings/${booking.id}`}>
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

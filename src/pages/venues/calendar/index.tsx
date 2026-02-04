import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { ArtistCalendar, type CalendarDay } from '@/components/artists/calendar/ArtistCalendar';
import { formatCurrency } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

function VenueCalendarPage() {
  const { user } = useAuth();
  const { role } = useMe();

  const [month, setMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/bookings`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudieron cargar los bookings');
        return res.json();
      })
      .then((data) => setBookings(data ?? []))
      .catch((err: any) => setError(err?.message || 'Error al cargar bookings'))
      .finally(() => setLoading(false));
  }, [user?.token]);

  // Fechas reservadas por la sala (booking con fecha y no cancelado/rechazado)
  const bookedByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    bookings
      .filter((b) => b.start_date && !['CANCELLED', 'REJECTED'].includes((b.status || '').toUpperCase()))
      .forEach((b) => {
        const date = b.start_date.slice(0, 10);
        if (!map.has(date)) map.set(date, []);
        map.get(date)!.push(b);
      });
    return map;
  }, [bookings]);

  const calendarDays: CalendarDay[] = useMemo(() => {
    return Array.from(bookedByDate.entries()).map(([date, list]) => ({
      date,
      status: 'BOOKED',
      bookings: list.map((b) => ({
        id: b.id,
        title: b.eventName ?? 'Booking',
        venueName: b.venueName ?? undefined,
      })),
    }));
  }, [bookedByDate]);

  const selectedBookings = useMemo(() => {
    if (!selectedDate) return [] as any[];
    return bookedByDate.get(selectedDate) ?? [];
  }, [bookedByDate, selectedDate]);

  const nextMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const prevMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));

  if (!user || role !== 'VENUE') {
    return <p style={{ padding: 24 }}>Acceso no autorizado</p>;
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0 }}>Calendario</h1>
          <p style={{ color: '#555', marginTop: 4 }}>
            Fechas reservadas y disponibilidad de la sala.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={prevMonth} disabled={loading} style={{ padding: '6px 10px' }}>Anterior</button>
          <strong>
            {month.toLocaleString('default', { month: 'long' })} {month.getFullYear()}
          </strong>
          <button onClick={nextMonth} disabled={loading} style={{ padding: '6px 10px' }}>Siguiente</button>
        </div>
      </header>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Cargando disponibilidad…</p>
      ) : (
        <ArtistCalendar
          month={month.getMonth()}
          year={month.getFullYear()}
          days={calendarDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onBlockDay={undefined}
          onUnblockDay={undefined}
        />
      )}

      {selectedDate && (
        <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Detalle del día</h3>
          <p style={{ margin: 0, color: '#555' }}>Fecha: {selectedDate}</p>
          {selectedBookings.length === 0 && (
            <p style={{ marginTop: 8 }}>No hay bookings en esta fecha.</p>
          )}
          {selectedBookings.length > 0 && (
            <div style={{ marginTop: 8, display: 'grid', gap: 10 }}>
              {selectedBookings.map((b) => (
                <div key={b.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{b.eventName ?? 'Booking'}</strong>
                    <span style={{ color: '#111' }}>
                      {typeof b.totalAmount === 'number'
                        ? formatCurrency(b.totalAmount, b.currency ?? 'EUR')
                        : '—'}
                    </span>
                  </div>
                  <div style={{ color: '#555', fontSize: 13 }}>
                    Estado: {b.status ?? '—'}
                  </div>
                  {b.artistName && (
                    <div style={{ color: '#555', fontSize: 13 }}>
                      Artista: {b.artistName}
                    </div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    <Link
                      href={`/bookings/${b.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Ver booking
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default withRole(VenueCalendarPage, ['VENUE']);

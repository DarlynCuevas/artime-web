import { useEffect, useMemo, useState } from 'react';
import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistAvailability } from '@/hooks/artists/useArtistAvailability';
import { createArtistCalendarBlock, deleteArtistCalendarBlock, getArtistCalendarBlocks, getArtistBookingByDate } from '@/services/artists/calendar.service';
import { ArtistCalendar, CalendarDay } from '@/components/artists/calendar/ArtistCalendar';

function ArtistCalendarPage() {
  const { user } = useAuth();
  const { role, profileId } = useMe();
  const [month, setMonth] = useState(() => new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { days: availabilityDays, loading } = useArtistAvailability(profileId, month, user?.token);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!user?.token) return;

    const from = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const to = new Date(Date.UTC(month.getFullYear(), month.getMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);

    getArtistCalendarBlocks(from, to, user.token)
      .then((data) => {
        setBlockedDates(new Set((data ?? []).map((d: any) => d.date)));
      })
      .catch((err) => setError(err?.message || 'No se pudieron cargar los bloqueos'));
  }, [month, user?.token]);

  useEffect(() => {
    setError(null);
    setSelectedDate(null);
    setBookingDetail(null);
  }, [month]);

  const calendarDays: CalendarDay[] = useMemo(() => {
    const list: CalendarDay[] = availabilityDays.map((d) => ({
      date: d.date,
      status: d.status === 'BOOKED' ? 'BOOKED' : d.status === 'UNAVAILABLE' ? 'BLOCKED' : 'AVAILABLE',
      bookings: [],
    }));

    blockedDates.forEach((date) => {
      const existing = list.find((d) => d.date === date);
      if (existing) {
        existing.status = 'BLOCKED';
      } else {
        list.push({ date, status: 'BLOCKED', bookings: [] });
      }
    });

    return list;
  }, [availabilityDays, blockedDates]);

  const selectedDay = useMemo(
    () => (selectedDate ? calendarDays.find((d) => d.date === selectedDate) ?? null : null),
    [calendarDays, selectedDate],
  );

  useEffect(() => {
    setBookingDetail(null);
    if (!selectedDate || !user?.token) return;
    const day = calendarDays.find((d) => d.date === selectedDate);
    if (!day || day.status !== 'BOOKED') return;

    setBookingLoading(true);
    getArtistBookingByDate(selectedDate, user.token)
      .then((data) => setBookingDetail(data))
      .catch((err: any) => setError(err?.message || 'No se pudo cargar el booking'))
      .finally(() => setBookingLoading(false));
  }, [selectedDate, calendarDays, user?.token]);

  const handleBlock = async (date: string) => {
    if (!user?.token) return;
    setSubmitting(true);
    setError(null);
    try {
      await createArtistCalendarBlock(date, user.token);
      setBlockedDates((prev) => new Set(prev).add(date));
    } catch (err: any) {
      setError(err?.message || 'No se pudo bloquear el día');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (date: string) => {
    if (!user?.token) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteArtistCalendarBlock(date, user.token);
      setBlockedDates((prev) => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo desbloquear el día');
    } finally {
      setSubmitting(false);
    }
  };

  const nextMonth = () => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };

  if (!user || role !== 'ARTIST') {
    return <p style={{ padding: 24 }}>Acceso no autorizado</p>;
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0 }}>Calendario</h1>
          <p style={{ color: '#555', marginTop: 4 }}>Bloquea fechas para evitar nuevas propuestas.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={prevMonth} disabled={submitting} style={{ padding: '6px 10px' }}>Anterior</button>
          <strong>
            {month.toLocaleString('default', { month: 'long' })} {month.getFullYear()}
          </strong>
          <button onClick={nextMonth} disabled={submitting} style={{ padding: '6px 10px' }}>Siguiente</button>
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
          onBlockDay={submitting ? undefined : handleBlock}
          onUnblockDay={submitting ? undefined : handleUnblock}
        />
      )}

      {selectedDay && selectedDay.status === 'BOOKED' && (
        <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Detalle de booking</h3>
          <p style={{ margin: 0, color: '#555' }}>Fecha: {selectedDay.date}</p>
          {bookingLoading && <p style={{ marginTop: 8 }}>Cargando booking…</p>}
          {!bookingLoading && bookingDetail && (
            <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
              <div><strong>Estado:</strong> {bookingDetail.status}</div>
              <div><strong>Monto:</strong> {bookingDetail.totalAmount ?? '—'} {bookingDetail.currency ?? ''}</div>
              {bookingDetail.venue && (
                <div>
                  <strong>Sala:</strong> {bookingDetail.venue.name ?? '—'}{bookingDetail.venue.city ? ` · ${bookingDetail.venue.city}` : ''}
                </div>
              )}
              {!bookingDetail.venue && (
                <div>
                  <strong>Sala:</strong> —
                </div>
              )}
            </div>
          )}
          {!bookingLoading && !bookingDetail && (
            <p style={{ marginTop: 8, color: '#b71c1c' }}>No se encontró información del booking.</p>
          )}
        </section>
      )}
    </main>
  );
}

export default withRole(ArtistCalendarPage, ['ARTIST']);

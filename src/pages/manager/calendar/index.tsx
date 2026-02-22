import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/auth/useAuth';
import { getMyRepresentedArtists } from '@/services/managers/managers.service';

type RepresentedArtist = {
  id: string;
  name: string;
};

type BookingRow = {
  id: string;
  artistId: string | null;
  artistName: string;
  venueName?: string | null;
  eventName?: string | null;
  startDate: string;
  status: string;
};

type RawRepresentedArtist = {
  id?: string;
  name?: string | null;
};

type RawBooking = {
  id?: string;
  artistId?: string | null;
  artistName?: string | null;
  venueName?: string | null;
  eventName?: string | null;
  start_date?: string;
  status?: string;
};

function ManagerCalendarPage() {
  const { user } = useAuth();
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [artistFilter, setArtistFilter] = useState('ALL');
  const [artists, setArtists] = useState<RepresentedArtist[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [representedData, bookingsRes] = await Promise.all([
          getMyRepresentedArtists(user.token),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        if (!bookingsRes.ok) {
          throw new Error('No se pudo cargar el calendario de bookings');
        }

        const bookingsData = (await bookingsRes.json()) as RawBooking[];
        const represented = (Array.isArray(representedData) ? representedData : [])
          .filter((item: RawRepresentedArtist) => item?.id)
          .map((item: RawRepresentedArtist) => ({
            id: item.id as string,
            name: item.name ?? 'Artista',
          }));
        const representedIds = new Set(represented.map((a) => a.id));
        const normalizedBookings = (Array.isArray(bookingsData) ? bookingsData : [])
          .filter((item) => item?.id && item?.start_date && item?.status)
          .map((item) => ({
            id: item.id as string,
            artistId: item.artistId ?? null,
            artistName: item.artistName ?? 'Artista',
            venueName: item.venueName ?? null,
            eventName: item.eventName ?? null,
            startDate: item.start_date as string,
            status: item.status as string,
          }))
          .filter((item: BookingRow) => !item.artistId || representedIds.has(item.artistId));

        setArtists(represented);
        setBookings(normalizedBookings);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar calendario');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.token]);

  const monthDays = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    bookings.forEach((row) => {
      const parsed = new Date(row.startDate);
      if (Number.isNaN(parsed.getTime())) return;
      const sameMonth = `${parsed.getFullYear()}-${parsed.getMonth() + 1}` === monthKey;
      if (!sameMonth) return;
      if (artistFilter !== 'ALL' && row.artistName !== artistFilter) return;
      const key = formatIsoDay(parsed);
      const current = map.get(key) ?? [];
      current.push(row);
      map.set(key, current);
    });
    return map;
  }, [bookings, monthKey, artistFilter]);

  const totalMonthBookings = Array.from(bookingsByDate.values()).reduce((acc, rows) => acc + rows.length, 0);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Calendario</p>
        <h1 className="text-3xl font-semibold text-slate-900">Fechas reservadas de artistas representados</h1>
        <p className="text-slate-600">Visibilidad mensual para anticipar conflictos y gestionar prioridades.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(monthDate)}
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonthDate((prev) => addMonths(prev, -1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMonthDate(startOfMonth(new Date()))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setMonthDate((prev) => addMonths(prev, 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-slate-600 inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            Artista
          </label>
          <select
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          >
            <option value="ALL">Todos</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.name}>
                {artist.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">{totalMonthBookings} bookings en este mes</span>
        </div>
      </section>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!error && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthDays.map((date) => {
            const key = formatIsoDay(date);
            const dayBookings = bookingsByDate.get(key) ?? [];
            return (
              <article key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[150px]">
                <header className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-900">{formatDayLabel(date)}</p>
                  <span className="text-[11px] text-slate-500">{dayBookings.length} reservas</span>
                </header>

                {dayBookings.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin reservas.</p>
                ) : (
                  <div className="space-y-2">
                    {dayBookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <p className="text-xs font-semibold text-slate-900">{booking.artistName}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {booking.eventName || booking.venueName || 'Booking'}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={booking.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default withRole(ManagerCalendarPage, ['MANAGER']);

function startOfMonth(input: Date) {
  return new Date(input.getFullYear(), input.getMonth(), 1);
}

function addMonths(input: Date, diff: number) {
  return new Date(input.getFullYear(), input.getMonth() + diff, 1);
}

function getMonthDays(input: Date) {
  const year = input.getFullYear();
  const month = input.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) => new Date(year, month, index + 1));
}

function formatIsoDay(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date);
}

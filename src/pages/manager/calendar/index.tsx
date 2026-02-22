import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ShieldCheck, Users } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Calendario</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Agenda de representados</h1>
            </div>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white">
                <CalendarDays className="h-4 w-4 text-white/70" />
                {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(monthDate)}
              </div>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMonthDate((prev) => addMonths(prev, -1))}
                  className="rounded-xl border border-white/15 bg-white/5 p-2 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMonthDate(startOfMonth(new Date()))}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setMonthDate((prev) => addMonths(prev, 1))}
                  className="rounded-xl border border-white/15 bg-white/5 p-2 text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-black uppercase tracking-widest text-white/60 inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-white/70" />
                Artista
              </label>
              <select
                value={artistFilter}
                onChange={(e) => setArtistFilter(e.target.value)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none"
              >
                <option value="ALL" className="text-slate-900">Todos</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.name} className="text-slate-900">
                    {artist.name}
                  </option>
                ))}
              </select>
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">{totalMonthBookings} bookings este mes</span>
            </div>
          </section>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {!error && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthDays.map((date) => {
              const key = formatIsoDay(date);
              const dayBookings = bookingsByDate.get(key) ?? [];
              return (
                <article key={key} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.04)] min-h-[170px]">
                  <header className="flex items-center justify-between mb-3">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-wide">{formatDayLabel(date)}</p>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{dayBookings.length} reservas</span>
                  </header>

                  {dayBookings.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin reservas.</p>
                  ) : (
                    <div className="space-y-2">
                      {dayBookings.map((booking) => (
                        <div key={booking.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-900">{booking.artistName}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {booking.eventName || booking.venueName || 'Booking'}
                          </p>
                          <div className="mt-2">
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
    </div>
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

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Filter, ShieldCheck, Ticket, Users } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/auth/useAuth';

type ManagerBookingRow = {
  id: string;
  artistName: string;
  partnerName: string;
  startDate: string;
  status: string;
  venueName?: string | null;
  eventName?: string | null;
};

type RawBooking = {
  id?: string;
  artistName?: string | null;
  venueName?: string | null;
  eventName?: string | null;
  start_date?: string;
  status?: string;
};

function ManagerBookingsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ManagerBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artistFilter, setArtistFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) throw new Error('No se pudieron cargar los bookings');
        const data = (await res.json()) as RawBooking[];
        const normalized = (Array.isArray(data) ? data : [])
          .filter((item) => item?.id && item?.start_date && item?.status)
          .map((item) => ({
            id: item.id as string,
            artistName: item.artistName ?? 'Artista',
            partnerName: item.venueName ?? item.eventName ?? 'Contratante',
            venueName: item.venueName ?? null,
            eventName: item.eventName ?? null,
            startDate: item.start_date as string,
            status: item.status as string,
          }));
        setRows(normalized);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar bookings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.token]);

  const artistOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(rows.map((r) => r.artistName))).sort((a, b) => a.localeCompare(b))],
    [rows],
  );

  const statusOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(rows.map((r) => r.status)))],
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (artistFilter !== 'ALL' && row.artistName !== artistFilter) return false;
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      return true;
    });
  }, [rows, artistFilter, statusFilter]);

  const groupedByArtist = useMemo(() => {
    return filtered.reduce<Record<string, ManagerBookingRow[]>>((acc, row) => {
      const key = row.artistName || 'Sin artista';
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
  }, [filtered]);

  const orderedArtists = useMemo(
    () => Object.keys(groupedByArtist).sort((a, b) => a.localeCompare(b)),
    [groupedByArtist],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando bookings...</p>
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
              <Ticket className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Bookings</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Operativa por artista</h1>
            </div>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-white/60">
              <Filter className="h-4 w-4" />
              Filtros
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={artistFilter}
                onChange={(e) => setArtistFilter(e.target.value)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
              >
                {artistOptions.map((artist) => (
                  <option key={artist} value={artist} className="text-slate-900">
                    {artist === 'ALL' ? 'Todos los artistas' : artist}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status} className="text-slate-900">
                    {status === 'ALL' ? 'Todos los estados' : status}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {!error && filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
            No hay bookings para los filtros seleccionados.
          </div>
        )}

        {!error &&
          orderedArtists.map((artist) => (
            <section key={artist} className="rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
              <header className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-slate-600" />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-widest">{artist}</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{groupedByArtist[artist].length} bookings</span>
              </header>

              <div className="divide-y divide-slate-100">
                {groupedByArtist[artist]
                  .slice()
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/bookings/${booking.id}`}
                      className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {booking.eventName || booking.venueName || booking.partnerName}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(booking.startDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={booking.status} />
                        <span className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center group-hover:border-amber-300 group-hover:bg-amber-50 transition-all">
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600" />
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
      </main>
    </div>
  );
}

export default withRole(ManagerBookingsPage, ['MANAGER']);

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Fecha pendiente';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

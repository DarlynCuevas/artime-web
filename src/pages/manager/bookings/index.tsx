import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Filter, Loader2, Ticket, Users } from 'lucide-react';

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Bookings</p>
        <h1 className="text-3xl font-semibold text-slate-900">Bookings de artistas representados</h1>
        <p className="text-slate-600">Ordenados por artista para operar rápido desde el rol de manager.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          >
            {artistOptions.map((artist) => (
              <option key={artist} value={artist}>
                {artist === 'ALL' ? 'Todos los artistas' : artist}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'Todos los estados' : status}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!error && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          No hay bookings para los filtros seleccionados.
        </div>
      )}

      {!error &&
        orderedArtists.map((artist) => (
          <section key={artist} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Users className="h-4 w-4 text-slate-600" />
                <h2 className="font-semibold">{artist}</h2>
              </div>
              <span className="text-xs text-slate-500">{groupedByArtist[artist].length} bookings</span>
            </header>

            <div className="divide-y divide-slate-100">
              {groupedByArtist[artist]
                .slice()
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}`}
                    className="block px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {booking.eventName || booking.venueName || booking.partnerName}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(booking.startDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-slate-500" />
                        <StatusBadge status={booking.status} />
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        ))}
    </main>
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

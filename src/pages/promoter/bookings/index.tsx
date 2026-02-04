import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Filter } from 'lucide-react';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';

type BookingDto = {
  id: string;
  status: string;
  start_date: string | null;
  totalAmount: number | null;
  currency: string;
  artistId?: string | null;
  artistName?: string | null;
  venueName?: string | null;
  eventName?: string | null;
  city?: string | null;
  createdAt?: string | null;
  paidPercent?: number | null;
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

function PromoterBookingsPage() {
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
          artistId: b.artistId ?? null,
          artistName: b.artistName ?? null,
          venueName: b.venueName ?? null,
          eventName: b.eventName ?? null,
          city: b.artistCity ?? b.city ?? null,
          createdAt: b.createdAt ?? null,
          paidPercent: b.paidPercent ?? null,
        })) as BookingDto[];
        setBookings(normalized);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.token]);

  if (loading) {
    return <p className="p-10">Cargando contrataciones…</p>;
  }

  if (error) {
    return (
      <p className="p-10 text-red-600">
        {error}
      </p>
    );
  }

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
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Bookings</p>
          <h1 className="text-3xl font-semibold text-slate-900">Contrataciones del promotor</h1>
          <p className="text-slate-600">Lista y estado de tus bookings como promotor.</p>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition ${activeTab === tab.key
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {countsByTab[tab.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{TABS.find((t) => t.key === activeTab)?.label}</h2>
              <p className="text-sm text-slate-600">
                {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
              </p>
            </div>
          </header>

          <div className="divide-y divide-slate-100">
            {filteredBookings.length === 0 && (
              <div className="py-12 text-center text-slate-500">No hay bookings en esta sección.</div>
            )}

            {filteredBookings.map((booking, index) => (
              <div
                key={booking.id}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 py-4 hover:bg-slate-50 transition"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div>
                  <p className="font-medium text-slate-900 truncate">{booking.artistName || booking.artistId || 'Artista sin nombre'}</p>
                  <p className="text-sm text-slate-500 truncate">
                    {booking.eventName
                      ? `Evento: ${booking.eventName}`
                      : booking.venueName
                        ? `Sala: ${booking.venueName}`
                        : 'Evento/Sala no indicado'}
                    {` · Booking ${booking.id.slice(0, 8)}…`}
                  </p>
                </div>
                <div className="text-sm text-slate-700">
                  Fecha: {booking.start_date ? formatDate(booking.start_date) : '—'}
                </div>
                <div className="text-sm text-slate-700">
                  Fee: {booking.totalAmount ? `${booking.totalAmount} ${booking.currency}` : '—'}
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={booking.status} paidPercent={booking.paidPercent} />
                  </div>
                  <Link href={`/bookings/${booking.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                    Abrir booking
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default withRole(PromoterBookingsPage, ['PROMOTER']);

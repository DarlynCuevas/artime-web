import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Filter, LayoutList, MapPin, Search, Ticket } from 'lucide-react';

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
    statuses: ['PENDING'],
  },
  {
    key: 'NEGOTIATING',
    label: 'En negociación',
    statuses: ['NEGOTIATING', 'FINAL_OFFER_SENT'],
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

function groupByStatus(bookings: BookingDto[]) {
  return bookings.reduce<Record<string, BookingDto[]>>((acc, booking) => {
    if (!acc[booking.status]) acc[booking.status] = [];
    acc[booking.status].push(booking);
    return acc;
  }, {});
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function PromoterBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [query, setQuery] = useState('');

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
    const grouped = groupByStatus(bookings);
    return TABS.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.key] = tab.statuses.reduce((sum, status) => sum + (grouped[status]?.length ?? 0), 0);
      return acc;
    }, {});
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

    if (!query.trim()) return filtered;

    const q = query.toLowerCase();
    return filtered.filter((b) => {
      const name = b.eventName || b.artistName || b.venueName || b.artistId || '';
      return name.toLowerCase().includes(q) || (b.city ?? '').toLowerCase().includes(q);
    });
  }, [bookings, activeTab, query]);

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Bookings</p>
        <h1 className="text-3xl font-semibold text-slate-900">Contrataciones del promotor</h1>
        <p className="text-slate-600">Estados claros, sin ruido.</p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        {TABS.map((tab) => (
          <FilterChip
            key={tab.key}
            label={tab.label}
            count={countsByTab[tab.key] ?? 0}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm w-full sm:w-auto">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por evento, artista o ciudad"
            className="w-full sm:w-72 text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 shadow-sm">
          <Filter className="h-4 w-4 text-slate-500" />
          <span>{bookings.length} totales</span>
          <span className="text-slate-400">•</span>
          <span>{filteredBookings.length} en esta vista</span>
        </div>
      </section>

      {bookings.length === 0 && (
        <Card
          title="Sin bookings"
          subtitle="Cuando haya nuevas contrataciones aparecerán aquí"
          icon={<LayoutList className="h-4 w-4 text-slate-600" />}
        >
          <p className="text-sm text-slate-600">Aún no tienes contrataciones activas.</p>
        </Card>
      )}

      {bookings.length > 0 && (
        <Card
          title={TABS.find((t) => t.key === activeTab)?.label ?? 'Bookings'}
          subtitle={`${filteredBookings.length} ${filteredBookings.length === 1 ? 'booking' : 'bookings'}`}
          icon={<Ticket className="h-4 w-4 text-slate-600" />}
        >
          <div className="divide-y divide-slate-100">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4">
                <div className="md:col-span-5">
                  <p className="font-semibold text-slate-900">{booking.artistName || booking.artistId || 'Artista sin nombre'}</p>
                  <p className="text-xs text-slate-500">Evento: {booking.eventName || 'Sin nombre'}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {booking.city ? `Ciudad: ${booking.city}` : 'Ciudad no indicada'}
                  </p>
                </div>
                <div className="md:col-span-3 text-sm text-slate-600 space-y-1">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Fecha: {booking.start_date ? formatDate(booking.start_date) : 'No definida'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Creado: {booking.createdAt ? formatDate(booking.createdAt) : '—'}</span>
                  </div>
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <StatusBadge status={booking.status} paidPercent={booking.paidPercent ?? undefined} />
                  <p className="text-xs text-slate-500">Fee: {booking.totalAmount ? `${booking.totalAmount} ${booking.currency}` : 'No definido'}</p>
                </div>
                <div className="md:col-span-2 text-right">
                  <Link href={`/bookings/${booking.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-slate-900">
                    Ver booking
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}

export default withRole(PromoterBookingsPage, ['PROMOTER']);

function Card({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon && <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
      </header>
      {children}
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition shadow-sm ${
        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs ${active ? 'text-white/80' : 'text-slate-500'}`}>{count}</span>
    </button>
  );
}

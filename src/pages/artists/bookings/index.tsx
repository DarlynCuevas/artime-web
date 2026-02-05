import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { ArrowRight, Calendar, Filter, LayoutList, MapPin, Search, Ticket, Clock, AlertCircle } from 'lucide-react';

type BookingDto = {
  id: string;
  status: string;
  start_date: string | null;
  totalAmount: number | null;
  currency: string;
  venueId?: string | null;
  venueName?: string | null;
  city?: string | null;
  createdAt?: string | null;
  paidPercent?: number | null;
  eventName?: string | null;
};

function groupByStatus(bookings: BookingDto[]) {
  return bookings.reduce<Record<string, BookingDto[]>>((acc, booking) => {
    if (!acc[booking.status]) acc[booking.status] = [];
    acc[booking.status].push(booking);
    return acc;
  }, {});
}

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
] as const;

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return date;
  }
}

function ArtistBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('PENDING');
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
          venueId: b.venueId ?? null,
          venueName: b.venueName ?? null,
          city: b.city ?? null,
          createdAt: b.createdAt ?? null,
          paidPercent: b.paidPercent ?? null,
          eventName: b.eventName ?? null,
        })) as BookingDto[];
        setBookings(normalized);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.token]);

  const countsByTab = useMemo(() => {
    const grouped = groupByStatus(bookings);
    return TABS.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.key] = tab.statuses.reduce((sum, status) => sum + (grouped[status]?.length ?? 0), 0);
      return acc;
    }, {});
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    const byTab = tab ? bookings.filter((b) => tab.statuses.includes(b.status)) : bookings;
    if (!query.trim()) return byTab;
    const q = query.toLowerCase();
    return byTab.filter((b) => {
      const name = b.eventName || b.venueName || b.venueId || '';
      return name.toLowerCase().includes(q) || (b.city ?? '').toLowerCase().includes(q);
    });
  }, [activeTab, bookings, query]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 animate-pulse font-medium text-sm">
          <Clock className="h-4 w-4" />
          <span>Cargando listado de contrataciones...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto rounded-xl border border-red-100 bg-red-50 p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="border-b border-slate-100 pb-8 mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-900" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Artime OS</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contrataciones del artista</h1>
          <p className="text-sm text-slate-500 max-w-2xl">Control centralizado de flujos de negociación, contratos y estados de pago.</p>
        </div>
      </header>

      <div className="space-y-8">
        <section className="flex flex-wrap items-center gap-2">
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

        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group w-full md:w-96">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por evento, venue o ciudad..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 shadow-sm whitespace-nowrap">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              <span>{bookings.length} totales</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-slate-900">{filteredBookings.length} filtrados</span>
          </div>
        </section>

        {bookings.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-white">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <LayoutList className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold">Sin bookings registrados</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Cuando se generen nuevas propuestas o contratos, aparecerán en este listado.</p>
          </div>
        ) : (
          <Card
            title={TABS.find((t) => t.key === activeTab)?.label ?? 'Bookings'}
            subtitle={`${filteredBookings.length} ${filteredBookings.length === 1 ? 'operación activa' : 'operaciones activas'}`}
            icon={<Ticket className="h-4 w-4" />}
          >
            {filteredBookings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400 font-medium italic">No se encontraron resultados para el filtro actual.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 -mx-6">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 px-6 py-6 hover:bg-slate-50/50 transition-all group items-center">
                    <div className="md:col-span-4 space-y-1">
                      <p className="font-bold text-slate-900 leading-tight">
                        {booking.eventName || booking.venueName || booking.venueId || 'Evento sin nombre'}
                      </p>
                      {booking.eventName && (
                        <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-tight">Sala: {booking.venueName || booking.venueId || '—'}</p>
                      )}
                      <p className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {booking.city || 'Ubicación no especificada'}
                      </p>
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <div className="flex items-center gap-2 text-[13px] text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold">{booking.start_date ? formatDate(booking.start_date) : 'Sin fecha'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Recibido: {booking.createdAt ? formatDate(booking.createdAt) : '—'}</span>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col gap-2">
                      <StatusBadge status={booking.status} paidPercent={booking.paidPercent ?? undefined} className="w-fit" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Neto:</span>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          {booking.totalAmount ? `${booking.totalAmount} ${booking.currency}` : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-2 text-right">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-white border border-slate-200 text-[13px] font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm group/btn"
                      >
                        Gestionar
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}

export default withRole(ArtistBookingsPage, ['ARTIST']);

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
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <header className="px-6 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-slate-900 p-2 text-white shadow-sm">{icon}</div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-none">{title}</h2>
            {subtitle && <p className="text-[12px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{subtitle}</p>}
          </div>
        </div>
      </header>
      <div className="px-6">
        {children}
      </div>
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
      className={`inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-[13px] font-bold transition-all shadow-sm ${
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-slate-900/10'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
        active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
      }`}>
        {count}
      </span>
    </button>
  );
}

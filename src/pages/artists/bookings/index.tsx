import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Search,
  Ticket,
  Clock,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'PENDING', label: 'Pendientes', statuses: ['PENDING'] },
  { key: 'NEGOTIATING', label: 'En negociación', statuses: ['NEGOTIATING', 'FINAL_OFFER_SENT'] },
  { key: 'CONFIRMED', label: 'Confirmadas', statuses: ['ACCEPTED', 'CONTRACT_SIGNED'] },
  { key: 'PAID', label: 'Pagadas', statuses: ['PAID_PARTIAL', 'PAID_FULL', 'PAID', 'PAID_50', 'PAID_75', 'PAID_100', 'PAID_BALANCE'] },
  { key: 'HISTORIC', label: 'Canceladas', statuses: ['COMPLETED', 'REJECTED', 'CANCELLED', 'CANCELLED_PENDING_REVIEW'] },
  { key: 'ALL', label: 'Todos', statuses: [] as string[] }
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: 'Pendiente', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  NEGOTIATING: { label: 'Negociando', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  FINAL_OFFER_SENT: { label: 'Oferta Final', bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  ACCEPTED: { label: 'Aceptado', bg: 'bg-emerald-500/10', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CONTRACT_SIGNED: { label: 'Firmado', bg: 'bg-blue-500/10', text: 'text-blue-700', dot: 'bg-blue-500' },
  PAID_PARTIAL: { label: 'Pago parcial', bg: 'bg-teal-500/10', text: 'text-teal-700', dot: 'bg-teal-500' },
  PAID_FULL: { label: 'Pagado', bg: 'bg-green-500/10', text: 'text-green-700', dot: 'bg-green-500' },
  COMPLETED: { label: 'Completado', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  REJECTED: { label: 'Rechazado', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelado', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
  CANCELLED_PENDING_REVIEW: { label: 'Cancelación en revisión', bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg} ${c.text} text-[10px] font-bold uppercase tracking-wider`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({ booking }: { booking: BookingDto }) {
  const displayName = booking.eventName || booking.venueName || booking.venueId || 'Sin nombre';
  const subName = booking.eventName ? (booking.venueName || booking.venueId || '') : '';
  const paidPct = booking.paidPercent ?? 0;

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="group block bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="space-y-0.5 min-w-0">
          <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
            {displayName}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {booking.city ? `${booking.city}` : 'Ciudad no indicada'}
              {subName ? ` · ${subName}` : ''}
            </span>
          </div>
        </div>
        <StatusPill status={booking.status} />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            {booking.start_date
              ? new Date(booking.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })
              : 'No definida'}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Importe</p>
          <p className="text-sm font-black text-slate-900 tabular-nums">
            {booking.totalAmount != null
              ? `${booking.totalAmount.toLocaleString('es-ES')} ${booking.currency}`
              : '—'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pago</p>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-600 tabular-nums">{paidPct}%</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-600 transition-colors">
          Ver detalle <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

// ─── KPI Pill ─────────────────────────────────────────────────────────────────
function KpiPill({ label, value, icon: Icon, colorClass }: { label: string; value: number; icon: any; colorClass: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg bg-white/5 ${colorClass}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</span>
      </div>
      <p className="text-xl font-black text-white tabular-nums">{value}</p>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
        <Search className="w-7 h-7 text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">
        {filtered ? 'No hay bookings que coincidan' : 'Aún no tienes contrataciones'}
      </h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto">
        {filtered
          ? 'Prueba a cambiar los filtros o el término de búsqueda.'
          : 'Cuando haya nuevas contrataciones, aparecerán aquí.'}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function ArtistBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [query, setQuery] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings`, {
      headers: { Authorization: `Bearer ${user.token}` },
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

  // ── Derived ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: bookings.length,
    negotiating: bookings.filter(b => ['NEGOTIATING', 'FINAL_OFFER_SENT'].includes(b.status)).length,
    confirmed: bookings.filter(b => ['ACCEPTED', 'CONTRACT_SIGNED'].includes(b.status)).length,
  }), [bookings]);

  const countsByTab = useMemo(() => {
    return TABS.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.key] = tab.statuses.length === 0
        ? bookings.length
        : bookings.filter(b => (tab.statuses as readonly string[]).includes(b.status)).length;
      return acc;
    }, {});
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const rawQuery = query.trim();
    // Si hay búsqueda activa, se busca globalmente en todos los bookings (independiente de la pestaña).
    if (rawQuery) {
      const q = normalizeSearchValue(rawQuery);
      return bookings.filter((b) => {
        const searchable = [
          b.eventName,
          b.venueName,
          b.venueId,
          b.city,
          b.status,
          b.id,
          b.start_date ? new Date(b.start_date).toLocaleDateString('es-ES') : '',
        ]
          .filter(Boolean)
          .map((value) => normalizeSearchValue(String(value)))
          .join(' ');

        return searchable.includes(q);
      });
    }

    const tab = TABS.find((t) => t.key === activeTab);
    const byTab = (!tab || tab.statuses.length === 0)
      ? bookings
      : bookings.filter((b) => (tab.statuses as readonly string[]).includes(b.status));

    return byTab;
  }, [activeTab, bookings, query]);

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white/60 text-sm">Cargando contrataciones…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── Hero ── */}
      <div className="relative w-full overflow-hidden bg-slate-900 pt-14 pb-24 px-4 sm:px-6 rounded-3xl">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Title + KPIs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Ticket className="w-3.5 h-3.5" /> Mi Agenda
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Bookings</span>
              </h1>
              <p className="text-white/50 text-base">
                Gestiona tus eventos, sigue tus pagos y cierra negociaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto md:min-w-[360px]">
              <KpiPill label="Total" value={stats.total} icon={TrendingUp} colorClass="text-blue-400" />
              <KpiPill label="Negociando" value={stats.negotiating} icon={Clock} colorClass="text-amber-400" />
              <KpiPill label="Confirmados" value={stats.confirmed} icon={CheckCircle} colorClass="text-emerald-400" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Tab pills */}
            <div className="flex items-center p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl overflow-x-auto gap-1 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${activeTab === tab.key
                    ? 'bg-amber-500 text-amber-950 shadow-[0_4px_16px_rgba(245,158,11,0.3)]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {tab.label}
                  {countsByTab[tab.key] > 0 && (
                    <span className={`ml-1.5 text-[9px] ${activeTab === tab.key ? 'text-amber-900/70' : 'text-white/30'}`}>
                      {countsByTab[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por venue, evento o ciudad…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-500/40 focus:bg-white/[0.07] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
        {filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <EmptyState filtered={bookings.length > 0} />
        )}
      </section>
    </div>
  );
}

export default withRole(ArtistBookingsPage, ['ARTIST']);

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

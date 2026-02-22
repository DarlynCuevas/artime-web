import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Coins, FileSignature, ShieldCheck, Users, Zap } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { PayoutStatus } from '@/types/payout-status.enum';
import { useManagerDashboard } from '@/hooks/managers/useManagerDashboard';

const ACTIVE_BOOKING_STATUSES = [
  'PENDING',
  'NEGOTIATING',
  'FINAL_OFFER_SENT',
  'ACCEPTED',
  'CONTRACT_SIGNED',
  'PAID_PARTIAL',
  'PAID_FULL',
] as const;

type ActiveStatusFilter = (typeof ACTIVE_BOOKING_STATUSES)[number] | 'ALL';

type StatusCopy = {
  label: string;
  tone: string;
};

const actionCopyByStatus: Record<string, StatusCopy> = {
  NEGOTIATING: { label: 'Responder negociación', tone: 'Resuelve la contrapropuesta' },
  FINAL_OFFER_SENT: { label: 'Aceptar o rechazar oferta', tone: 'Define si avanzamos' },
  CONTRACT_SENT: { label: 'Firmar contrato', tone: 'Necesita firma' },
  CONTRACT_SIGNED: { label: 'Contrato firmado', tone: 'Verifica condiciones' },
  PENDING: { label: 'Tomar control', tone: 'Disponible para manejar' },
};

function ManagerDashboardPage() {
  const { data, loading, error } = useManagerDashboard();
  const [statusFilter, setStatusFilter] = useState<ActiveStatusFilter>('ALL');

  const filteredActiveBookings = useMemo(() => {
    if (!data?.activeBookings) return [];
    if (statusFilter === 'ALL') return data.activeBookings;
    return data.activeBookings.filter((booking) => booking.status === statusFilter);
  }, [data?.activeBookings, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-8 text-rose-700">{error ?? 'No hay datos disponibles.'}</div>;
  }

  const kpis = [
    { label: 'Artistas representados', value: data.summary.representedArtists, icon: <Users className="w-4 h-4" />, accent: false },
    { label: 'Bookings activos', value: data.summary.activeBookings, icon: <ClipboardList className="w-4 h-4" />, accent: false },
    { label: 'Requieren acción', value: data.summary.actionRequired, icon: <FileSignature className="w-4 h-4" />, accent: true },
    { label: 'Ingresos acumulados', value: formatCurrency(data.summary.managerNetIncome, 'EUR'), icon: <Coins className="w-4 h-4" />, accent: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Panel operativo del manager</h1>
              </div>
            </div>
            {data.summary.actionRequired > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest animate-pulse ml-16 sm:ml-0">
                <Zap className="w-3 h-3" /> {data.summary.actionRequired} pendiente{data.summary.actionRequired > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`rounded-2xl px-4 py-3 border ${kpi.accent ? 'bg-amber-500/20 border-amber-400/30' : 'bg-white/5 border-white/10'}`}>
                <div className={`flex items-center gap-1.5 mb-1 ${kpi.accent ? 'text-amber-400' : 'text-white/40'}`}>
                  {kpi.icon}
                  <p className="text-[10px] font-bold uppercase tracking-widest">{kpi.label}</p>
                </div>
                <p className={`text-xl font-black tabular-nums ${kpi.accent ? 'text-amber-300' : 'text-white'}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ArtistsBlock artists={data.artists} />
            <ActionBookingsBlock bookings={data.actionBookings} />
          </div>
          <div className="space-y-6">
            <PayoutsBlock payouts={data.payouts} />
          </div>
        </section>

        <ActiveBookingsBlock
          bookings={filteredActiveBookings}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </main>
    </div>
  );
}

export default withRole(ManagerDashboardPage, ['MANAGER']);

function ArtistsBlock({
  artists,
}: {
  artists: {
    id: string;
    name: string;
    avatar?: string;
    status: 'ACTIVE' | 'PAUSED';
    nextShow?: string | null;
    activeBookings: number;
  }[];
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Artistas representados</h2>
            <p className="text-[10px] text-slate-400 font-bold">{artists.length} activo{artists.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {artists.map((artist) => (
          <div key={artist.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/40 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <AvatarFallback name={artist.name} image={artist.avatar} />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{artist.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <StatusPill status={artist.status} />
                  <span className="hidden sm:inline">•</span>
                  <span>{artist.activeBookings} bookings activos</span>
                  {artist.nextShow && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>Próxima fecha: {formatDate(artist.nextShow)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/artists/profile/${artist.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest transition-colors shrink-0"
            >
              Ver artista
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionBookingsBlock({
  bookings,
}: {
  bookings: {
    id: string;
    artistName: string;
    partnerName: string;
    date: string;
    status: string;
    actionLabel: string;
  }[];
}) {
  return (
    <section className="bg-white border border-amber-100 rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.06)] overflow-hidden">
      <div className="px-6 py-5 border-b border-amber-50 bg-amber-50/30 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <FileSignature className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Bookings que requieren acción</h2>
          <p className="text-[10px] text-amber-600 font-bold">Prioridad operativa</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="p-6 text-sm text-amber-800">Nada pendiente ahora mismo.</div>
      ) : (
        <div className="p-6 space-y-3">
          {bookings.map((booking) => {
            const copy = actionCopyByStatus[booking.status] ?? { label: booking.actionLabel, tone: booking.actionLabel };
            return (
              <div key={booking.id} className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5">
                  <CheckCircle2 className="h-5 w-5 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{booking.artistName}</p>
                      <span className="text-xs text-slate-500 truncate">{booking.partnerName}</span>
                    </div>
                    <StatusBadge status={booking.status} className="shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <span>{formatDate(booking.date)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-amber-700 font-medium">{copy.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{copy.tone}</p>
                </div>
                <Link
                  href={`/bookings/${booking.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900"
                >
                  Abrir
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ActiveBookingsBlock({
  bookings,
  statusFilter,
  onFilterChange,
}: {
  bookings: {
    id: string;
    artistName: string;
    partnerName: string;
    date: string;
    status: (typeof ACTIVE_BOOKING_STATUSES)[number];
  }[];
  statusFilter: ActiveStatusFilter;
  onFilterChange: (value: ActiveStatusFilter) => void;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Bookings activos</h2>
          <p className="text-[10px] text-slate-400 font-bold">{bookings.length} resultados en filtro</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterChip label="ALL" active={statusFilter === 'ALL'} onClick={() => onFilterChange('ALL')} />
          {ACTIVE_BOOKING_STATUSES.map((status) => (
            <FilterChip key={status} label={status} active={statusFilter === status} onClick={() => onFilterChange(status)} />
          ))}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="p-6 text-sm text-slate-500">No hay bookings activos para este filtro.</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {bookings.map((booking) => (
            <div key={booking.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{booking.artistName}</p>
                <p className="text-xs text-slate-500 truncate">
                  {booking.partnerName} • {formatDate(booking.date)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={booking.status} />
                <Link
                  href={`/bookings/${booking.id}`}
                  className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest"
                >
                  Abrir
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PayoutsBlock({
  payouts,
}: {
  payouts: {
    upcoming: {
      id: string;
      amount: number;
      currency: string;
      expectedDate: string;
      status: PayoutStatus;
    }[];
    completed: {
      id: string;
      amount: number;
      currency: string;
      paidDate: string;
      status: PayoutStatus;
    }[];
  };
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50">
        <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Payouts</h2>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Próximos</p>
          <div className="space-y-2">
            {payouts.upcoming.length === 0 ? (
              <p className="text-xs text-slate-500">Sin payouts pendientes.</p>
            ) : (
              payouts.upcoming.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount, item.currency)}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.expectedDate)}</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Completados</p>
          <div className="space-y-2">
            {payouts.completed.length === 0 ? (
              <p className="text-xs text-slate-500">Sin pagos completados.</p>
            ) : (
              payouts.completed.map((item) => (
                <div key={item.id} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount, item.currency)}</p>
                  <p className="text-xs text-emerald-700">{formatDate(item.paidDate)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AvatarFallback({ name, image }: { name: string; image?: string }) {
  if (image) {
    return <img src={image} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  }
  return (
    <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatusPill({ status }: { status: 'ACTIVE' | 'PAUSED' }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-500'}`} />
      {isActive ? 'Activo' : 'Pausado'}
    </span>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
    >
      {label}
    </button>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Fecha pendiente';
  return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}


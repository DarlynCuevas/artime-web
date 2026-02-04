import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Coins, FileSignature, HandCoins, Users } from 'lucide-react';

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
    return data.activeBookings.filter((b) => b.status === statusFilter);
  }, [data?.activeBookings, statusFilter]);

  if (loading) {
    return <div className="p-8">Cargando dashboard…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  if (!data) {
    return <div className="p-8">No hay datos disponibles.</div>;
  }

  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Panel operativo del manager</h1>
        <p className="text-slate-600">Visibilidad total sin sustituir al artista. El backend es la fuente de verdad.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Artistas representados" value={data.summary.representedArtists} icon={<Users className="h-4 w-4" />} />
        <KpiCard title="Bookings activos" value={data.summary.activeBookings} icon={<ClipboardList className="h-4 w-4" />} />
        <KpiCard title="Requieren acción" value={data.summary.actionRequired} icon={<FileSignature className="h-4 w-4" />} tone="amber" />
        <KpiCard
          title="Ingresos acumulados"
          value={formatCurrency(data.summary.managerNetIncome, 'EUR')}
          icon={<Coins className="h-4 w-4" />}
        />
      </section>

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
  );
}

export default withRole(ManagerDashboardPage, ['MANAGER']);

function KpiCard({
  title,
  value,
  icon,
  tone = 'slate',
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'slate' | 'amber' | 'emerald';
}) {
  const toneClass = {
    slate: 'bg-slate-900 text-white',
    amber: 'bg-amber-600 text-white',
    emerald: 'bg-emerald-600 text-white',
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">{icon}<span>{title}</span></div>
      <div className={`px-4 py-4 ${toneClass}`}>
        <p className="text-3xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

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
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Representados</p>
          <h2 className="text-xl font-semibold text-slate-900">Artistas</h2>
        </div>
        <div className="text-sm text-slate-500">{artists.length} activos</div>
      </header>

      <div className="divide-y divide-slate-100">
        {artists.map((artist) => (
          <div key={artist.id} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <AvatarFallback name={artist.name} image={artist.avatar} />
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{artist.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <StatusPill status={artist.status} />
                  <span className="hidden sm:inline">•</span>
                  <span>Bookings activos: {artist.activeBookings}</span>
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
              href={`/artists/${artist.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Ver artista
              <ArrowRight className="h-4 w-4" />
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
    <section className="rounded-xl border border-amber-200 bg-amber-50/70 shadow-sm p-5 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-amber-700">Crítico</p>
          <h2 className="text-xl font-semibold text-slate-900">Bookings que requieren acción</h2>
          <p className="text-sm text-amber-800">Si el manager no actúa aquí, nadie lo hará.</p>
        </div>
        <FileSignature className="h-6 w-6 text-amber-700" />
      </header>

      {bookings.length === 0 ? (
        <p className="text-sm text-amber-800">Nada pendiente ahora mismo.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const copy = actionCopyByStatus[booking.status] ?? { label: booking.actionLabel, tone: booking.actionLabel };
            return (
              <div key={booking.id} className="rounded-lg border border-amber-200 bg-white/80 px-4 py-3 flex items-start gap-3">
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
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-slate-500">Operativa</p>
          <h2 className="text-xl font-semibold text-slate-900">Bookings activos</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip label="Todos" active={statusFilter === 'ALL'} onClick={() => onFilterChange('ALL')} />
          {ACTIVE_BOOKING_STATUSES.map((status) => (
            <FilterChip
              key={status}
              label={statusLabel(status)}
              active={statusFilter === status}
              onClick={() => onFilterChange(status)}
            />
          ))}
        </div>
      </header>

      {bookings.length === 0 ? (
        <p className="text-sm text-slate-500">No hay bookings en estos estados.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px] divide-y divide-slate-100">
            {bookings.map((booking) => (
              <div key={booking.id} className="grid grid-cols-12 items-center gap-3 py-3">
                <div className="col-span-3">
                  <p className="font-medium text-slate-900">{booking.artistName}</p>
                  <p className="text-xs text-slate-500">{booking.partnerName}</p>
                </div>
                <div className="col-span-3 text-sm text-slate-600">{formatDate(booking.date)}</div>
                <div className="col-span-3">
                  <StatusBadge status={booking.status} />
                </div>
                <div className="col-span-3 text-right">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-slate-900"
                  >
                    Ver booking
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
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
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Liquidez</p>
          <h2 className="text-xl font-semibold text-slate-900">Pagos y payouts</h2>
        </div>
        <HandCoins className="h-5 w-5 text-slate-600" />
      </header>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Próximos payouts</p>
            <span className="text-xs text-slate-500">Siempre visibles</span>
          </div>
          {payouts.upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">No hay payouts próximos.</p>
          ) : (
            <div className="space-y-3">
              {payouts.upcoming.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 border border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">{formatCurrency(payout.amount, payout.currency)}</p>
                    <p className="text-xs text-slate-500">Esperado: {formatDate(payout.expectedDate)}</p>
                  </div>
                  <PayoutBadge status={payout.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-medium text-slate-700">Payouts realizados</p>
          </div>
          {payouts.completed.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay pagos cerrados.</p>
          ) : (
            <div className="space-y-3">
              {payouts.completed.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2">
                  <div>
                    <p className="font-medium text-slate-900">{formatCurrency(payout.amount, payout.currency)}</p>
                    <p className="text-xs text-slate-500">Pagado: {formatDate(payout.paidDate)}</p>
                  </div>
                  <PayoutBadge status={payout.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AvatarFallback({ name, image }: { name: string; image?: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (image) {
    return (
      <div className="size-10 rounded-full bg-slate-200 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div className="size-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
      {initials}
    </div>
  );
}

function StatusPill({ status }: { status: 'ACTIVE' | 'PAUSED' }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
      <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-500'}`} />
      {isActive ? 'Active' : 'Pausado'}
    </span>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function PayoutBadge({ status }: { status: PayoutStatus }) {
  const palette: Record<PayoutStatus, { label: string; className: string }> = {
    [PayoutStatus.PENDING]: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800' },
    [PayoutStatus.READY_TO_PAY]: { label: 'Listo para pago', className: 'bg-blue-100 text-blue-800' },
    [PayoutStatus.PAID]: { label: 'Pagado', className: 'bg-emerald-100 text-emerald-800' },
    [PayoutStatus.FAILED]: { label: 'Fallido', className: 'bg-red-100 text-red-800' },
  };

  const styles = palette[status];

  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${styles.className}`}>{styles.label}</span>;
}

function statusLabel(status: (typeof ACTIVE_BOOKING_STATUSES)[number]) {
  const labels: Record<(typeof ACTIVE_BOOKING_STATUSES)[number], string> = {
    PENDING: 'Pendiente',
    NEGOTIATING: 'Negociando',
    FINAL_OFFER_SENT: 'Oferta final',
    ACCEPTED: 'Aceptado',
    CONTRACT_SIGNED: 'Contrato firmado',
    PAID_PARTIAL: 'Pagado parcial',
    PAID_FULL: 'Pagado completo',
  };
  return labels[status];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

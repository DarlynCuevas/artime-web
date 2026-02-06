import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';
import { Calendar, CheckCircle2, Copy, Eye, EyeOff, Sparkles, Users, ArrowRight, LayoutGrid, Zap } from 'lucide-react';

import type { Event } from '@/types/event';
import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/auth/useAuth';
import { useEventBookings } from '@/hooks/events/useEventBookings';
import { useArtists } from '@/hooks/artists/useArtists';
import { useEventInvitations } from '@/hooks/events/useEventInvitations';

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllAccepted, setShowAllAccepted] = useState(false);

  const {
    bookings: eventBookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useEventBookings(event?.id);

  const { artists } = useArtists();

  const { invitations, loading: invitationsLoading } =
    useEventInvitations(event?.id);

  const canSearchArtists =
    event?.status === 'DRAFT' || event?.status === 'SEARCHING';
  const eventDateForQuery = event?.start_date
    ? new Date(event.start_date).toISOString().slice(0, 10)
    : '';

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    if (!user?.token) return;

    eventsService
      .getEvent(id, user.token)
      .then(setEvent)
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setLoading(false));
  }, [id, user?.token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Artime OS • Event Control</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-4 text-red-600">
          <Sparkles className="h-6 w-6" />
          <p className="font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center">
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No se encontró el evento operativo.</p>
        </div>
      </div>
    );
  }

  const handleToggleVisibility = async () => {
    if (!user?.token) return;

    const nextVisibility =
      event.visibility === 'PRIVATE' ? 'VISIBLE' : 'PRIVATE';

    await eventsService.updateEventVisibility(
      event.id,
      nextVisibility,
      user.token
    );

    const updated = await eventsService.getEvent(event.id, user.token);
    setEvent(updated);
  };

  const handleSearchArtists = async () => {
    if (!event || !user?.token) return;

    if (event.status !== 'SEARCHING') {
      await eventsService.startSearch(event.id, user.token);
    }

    router.push(`/events/${event.id}/search-artists`);
  };

  const handleDuplicateEvent = async () => {
    if (!event || !user?.token) return;
    const duplicated = await eventsService.duplicateEvent(event.id, user.token);
    router.push(`/events/${duplicated.id}`);
  };

  const handleCreateBooking = (artistId: string) => {
    if (!event) return;
    const date = event.start_date
      ? new Date(event.start_date).toISOString().slice(0, 10)
      : '';
    const query = new URLSearchParams();
    query.set('artistId', artistId);
    query.set('eventId', event.id);
    if (date) query.set('date', date);
    router.push(`/bookings/new?${query.toString()}`);
  };

  const artistNameById = (artistId: string) => {
    const artist = artists.find((a) => a.id === artistId);
    return artist?.name ?? 'Artista';
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === 'PENDING' || inv.status === 'SENT',
  );
  const acceptedInvitations = invitations.filter(
    (inv) => inv.status === 'ACCEPTED' || inv.status === 'INTERESTED',
  );
  const declinedInvitations = invitations.filter(
    (inv) => inv.status === 'DECLINED',
  );
  const rejectedBookingArtists = eventBookings
    .filter((booking) =>
      ['CANCELLED', 'REJECTED'].includes(booking.status),
    )
    .map((booking) => ({
      artistId: (booking as any).artistId ?? booking.artist?.id ?? '',
      name: booking.artist?.name ?? null,
    }))
    .filter((item) => item.artistId);

  const rejectedArtistIds = new Set(
    rejectedBookingArtists.map((item) => item.artistId),
  );

  const contractSignedArtistIds = new Set(
    eventBookings
      .filter((booking) => booking.status === 'CONTRACT_SIGNED')
      .map((booking) => (booking as any).artistId ?? booking.artist?.id ?? '')
      .filter(Boolean),
  );

  const acceptedInvitationsFiltered = acceptedInvitations.filter(
    (inv) =>
      !rejectedArtistIds.has(inv.artistId) &&
      !contractSignedArtistIds.has(inv.artistId),
  );

  const bookingByArtistId = new Map(
    eventBookings
      .map((booking) => ({
        artistId: (booking as any).artistId ?? booking.artist?.id ?? '',
        bookingId: booking.id,
        status: booking.status,
      }))
      .filter((item) => item.artistId),
  );

  const rejectedItems = [
    ...declinedInvitations.map((inv) => ({
      artistId: inv.artistId,
      name: artistNameById(inv.artistId),
    })),
    ...rejectedBookingArtists.map((item) => ({
      artistId: item.artistId,
      name: item.name ?? artistNameById(item.artistId),
    })),
  ];

  const seenRejected = new Set<string>();
  const uniqueRejectedItems = rejectedItems.filter((item) => {
    if (!item.artistId || seenRejected.has(item.artistId)) return false;
    seenRejected.add(item.artistId);
    return true;
  });

  const visibleAcceptedInvitations = showAllAccepted
    ? acceptedInvitationsFiltered
    : acceptedInvitationsFiltered.slice(0, 5);

  const visibilityLabel = event.visibility === 'PRIVATE' ? 'Publicar Evento' : 'Hacer Privado';

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 bg-white min-h-screen">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-slate-900" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Artime OS • Event Control</p>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{event.name}</h1>
            <div className="flex items-center gap-4">
               <span className="inline-flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-xs bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  <Calendar className="h-3.5 w-3.5" />
                  {event.start_date ? formatDate(event.start_date) : 'Fecha pendiente'}
               </span>
               <Pill label={event.status} tone="slate" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDuplicateEvent}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicar
          </button>
          <button
            type="button"
            onClick={handleToggleVisibility}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
          >
            {event.visibility === 'PRIVATE' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {visibilityLabel}
          </button>
          {canSearchArtists && (
            <button
              type="button"
              onClick={handleSearchArtists}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
            >
              <Zap className="h-4 w-4" /> Buscar Artistas
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Visibilidad"
          value={event.visibility === 'PRIVATE' ? 'Privado' : 'Público'}
          icon={<Eye className="h-4 w-4" />}
          tone={event.visibility === 'PRIVATE' ? 'slate' : 'emerald'}
        />
        <KpiCard
          title="Fase Operativa"
          value={event.status}
          icon={<LayoutGrid className="h-4 w-4" />}
          tone="slate"
        />
        <KpiCard
          title="Presupuesto Estimado"
          value={event.estimatedBudget ?? '—'}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="amber"
          subtitle="Referencia para ofertas"
        />
      </section>

      <Card title="Panel de Invitaciones" subtitle="Gestión de flujo de artistas" icon={<Users className="h-5 w-5" />}>
        {invitationsLoading && (
          <div className="py-12 flex items-center justify-center gap-3">
             <div className="w-6 h-6 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actualizando invitaciones...</p>
          </div>
        )}

        {!invitationsLoading && invitations.length === 0 && (
          <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sin invitaciones cursadas</p>
          </div>
        )}

        {!invitationsLoading && invitations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <InvitationColumn title="Pendientes" items={pendingInvitations} emptyCopy="Sin acciones pendientes" tone="slate">
              {(inv) => (
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-900 transition-all">
                  <span className="text-sm font-black text-slate-900 truncate">{artistNameById(inv.artistId)}</span>
                  <div className="size-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}
            </InvitationColumn>

            <InvitationColumn title="Aceptados / Interés" items={visibleAcceptedInvitations} emptyCopy="Sin confirmaciones aún" tone="emerald">
              {(inv) => (
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4 group hover:border-emerald-500 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-900 truncate">{artistNameById(inv.artistId)}</span>
                    <Link
                      href={`/artists/profile/${inv.artistId}?eventId=${event?.id ?? ''}&date=${eventDateForQuery}`}
                      className="size-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="pt-3 border-t border-slate-50">
                    {bookingByArtistId.has(inv.artistId) ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                           <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Estado Booking</p>
                           <p className="text-[10px] font-bold text-emerald-600 truncate uppercase">{bookingByArtistId.get(inv.artistId)?.status}</p>
                        </div>
                        <Link
                          href={`/bookings/${bookingByArtistId.get(inv.artistId)?.bookingId}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                        >
                          Ver
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateBooking(inv.artistId)}
                        className="w-full py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                      >
                        Formalizar Booking
                      </button>
                    )}
                  </div>
                </div>
              )}
            </InvitationColumn>

            <InvitationColumn title="Rechazados / Desestimados" items={uniqueRejectedItems} emptyCopy="Sin desestimaciones" tone="slate">
              {(item) => (
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                   <span className="text-sm font-black text-slate-900">{item.name}</span>
                </div>
              )}
            </InvitationColumn>
          </div>
        )}

        {acceptedInvitationsFiltered.length > 5 && (
          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllAccepted((s) => !s)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors py-2 px-6 rounded-full border border-slate-100 bg-slate-50"
            >
              {showAllAccepted ? 'Mostrar menos artistas' : `Ver todos (${acceptedInvitationsFiltered.length})`}
            </button>
          </div>
        )}
      </Card>

      <Card title="Line-up Confirmado" subtitle="Contrataciones formalizadas" icon={<Sparkles className="h-5 w-5" />}>
        {bookingsLoading && (
          <div className="py-8 flex items-center gap-3">
             <div className="w-5 h-5 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Validando bookings...</p>
          </div>
        )}

        {bookingsError && (
          <div className="p-4 bg-red-50 rounded-2xl text-red-600 border border-red-100 text-[11px] font-bold">
             {bookingsError}
          </div>
        )}

        {!bookingsLoading && !bookingsError && eventBookings.length === 0 && (
          <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <LayoutGrid className="h-8 w-8 text-slate-300 mx-auto mb-2" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin contrataciones asociadas</p>
          </div>
        )}

        {!bookingsLoading && !bookingsError && eventBookings.length > 0 && (
          <div className="space-y-3">
            {eventBookings.map((booking) => (
              <div key={booking.id} className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-3xl border border-slate-100 bg-white hover:border-slate-900 transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-lg font-black text-slate-900 truncate leading-none tracking-tight">
                       {booking.artist?.name ?? 'Artista sin registro'}
                    </p>
                    <Pill label={booking.status} tone="slate" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Operación #{booking.id.slice(0, 8)}
                  </p>
                </div>

                <div className="flex items-center gap-8 md:gap-12 shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Evento</p>
                    <div className="flex items-center justify-end gap-2 text-slate-900 font-black text-sm tabular-nums">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {booking.start_date ? formatDate(booking.start_date) : '—'}
                    </div>
                  </div>

                  <Link
                    href={`/bookings/${booking.id}`}
                    className="size-12 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}

function KpiCard({ title, value, icon, tone = 'slate', subtitle }: { title: string; value: string; icon: ReactNode; tone?: 'slate' | 'amber' | 'emerald'; subtitle?: string }) {
  const accentBg = {
    slate: 'bg-slate-900',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
  }[tone];

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col group hover:border-slate-400 transition-colors">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-50 bg-slate-50/50">
        <div className="text-slate-400 group-hover:text-slate-900 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{title}</span>
      </div>
      <div className={`px-6 py-8 ${accentBg} text-white space-y-1`}>
        <p className="text-2xl font-black tracking-tighter uppercase leading-none">{value}</p>
        {subtitle && <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{subtitle}</p>}
      </div>
    </div>
  );
}

function Card({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <header className="px-8 py-8 border-b border-slate-50 flex items-center gap-5">
        {icon && (
          <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h2>
          {subtitle && <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em] leading-none">{subtitle}</p>}
        </div>
      </header>
      <div className="p-8 flex-1">
        {children}
      </div>
    </section>
  );
}

function Pill({ label, tone = 'slate' }: { label: string; tone?: 'slate' | 'amber' | 'emerald' }) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-slate-50 text-slate-700 border-slate-100';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${toneClass}`}>
      {label}
    </span>
  );
}

function InvitationColumn<T>({ title, items, emptyCopy, children, tone = 'slate' }: { title: string; items: T[]; emptyCopy: string; children: (item: T) => ReactNode; tone?: 'slate' | 'emerald' }) {
  const accentClass = tone === 'emerald' ? 'border-emerald-500' : 'border-slate-900';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
         <div className={`h-1.5 w-1.5 rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : 'bg-slate-900'}`} />
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      </div>
      <div className={`rounded-3xl border-t-2 ${accentClass} bg-slate-50/50 p-4 space-y-3 min-h-[200px]`}>
        {items.length === 0 ? (
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest py-8 text-center">{emptyCopy}</p>
        ) : (
          <div className="space-y-3">{items.map((item, idx) => <div key={idx} className="animate-in fade-in slide-in-from-top-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>{children(item)}</div>)}</div>
        )}
      </div>
    </div>
  );
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
}

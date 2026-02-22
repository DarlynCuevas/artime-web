import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Copy, Eye, EyeOff, Sparkles, Users, Search, ArrowRight, UserCircle2, Coins, MapPin } from 'lucide-react';

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
    refetch: refetchBookings,
  } = useEventBookings(event?.id);

  const { artists, artistsLoading, artistsError } = useArtists();

  const { invitations, loading: invitationsLoading, refetch: refetchInvitations } =
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

  useEffect(() => {
    const handleFocus = () => {
      refetchBookings?.();
      refetchInvitations?.();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchBookings, refetchInvitations]);

  useEffect(() => {
    if (!router.events) return;
    const handleRouteChange = () => {
      refetchBookings?.();
      refetchInvitations?.();
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, refetchBookings, refetchInvitations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center animate-pulse mb-4">
          <Calendar className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando evento…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-200 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm font-bold text-slate-900">{error || 'No se encontró el evento'}</p>
        <Link href="/promoter/events" className="mt-4 text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest">Volver a mis eventos</Link>
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

  const bookingByArtistId = new Map<string, { bookingId: string; status: string }>(
    eventBookings
      .map((booking) => [
        (booking as any).artistId ?? (booking as any).artist_id ?? booking.artist?.id ?? '',
        {
          bookingId: booking.id,
          status: booking.status,
        },
      ] as const)
      .filter(([artistId]) => !!artistId),
  );

  const bookingInProgressStatuses = new Set([
    'PENDING',
    'NEGOTIATING',
    'FINAL_OFFER_SENT',
  ]);

  const bookingByArtistIdInProgress = new Set(
    [...bookingByArtistId.entries()]
      .filter(([, booking]) => booking && bookingInProgressStatuses.has(booking.status))
      .map(([artistId]) => artistId),
  );

  const acceptedInvitationsFiltered = acceptedInvitations.filter(
    (inv) =>
      !rejectedArtistIds.has(inv.artistId) &&
      !contractSignedArtistIds.has(inv.artistId) &&
      !bookingByArtistId.has(inv.artistId),
  );

  const inProgressInvitations = acceptedInvitations.filter(
    (inv) =>
      bookingByArtistIdInProgress.has(inv.artistId) &&
      !rejectedArtistIds.has(inv.artistId),
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

  const visibilityLabel = event.visibility === 'PRIVATE' ? 'Hacer público' : 'Hacer privado';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          {/* Back link */}
          <Link href="/promoter/events" className="inline-flex items-center gap-2 text-white/50 hover:text-white uppercase tracking-widest text-[10px] font-black mb-8 transition-colors">
            ← Volver a mis eventos
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Calendar className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-1">
                  Evento
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                  {event.name}
                </h1>
                <div className="flex items-center gap-4 text-xs font-bold text-white/60 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 focus:outline-none">
                    <Calendar className="w-3.5 h-3.5" />
                    {event.start_date ? formatDate(event.start_date) : 'Fecha por definir'}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDuplicateEvent}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicar
              </button>
              <button
                type="button"
                onClick={handleToggleVisibility}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                {event.visibility === 'PRIVATE' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {visibilityLabel}
              </button>
              {canSearchArtists && (
                <button
                  type="button"
                  onClick={handleSearchArtists}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-amber text-amber-950 px-4 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                >
                  <Search className="h-3.5 w-3.5" /> Buscar artistas
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 space-y-6">

        {/* Métricas Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Visibilidad" icon={<Eye className="w-4 h-4 text-amber-600" />}>
            <Pill label={event.visibility} tone={event.visibility === 'VISIBLE' ? 'emerald' : 'slate'} />
          </MetricCard>
          <MetricCard title="Estado" icon={<Sparkles className="w-4 h-4 text-blue-600" />}>
            <Pill label={event.status} tone="slate" />
          </MetricCard>
          <MetricCard title="Presupuesto" icon={<Coins className="w-4 h-4 text-emerald-600" />}>
            <p className="text-xl font-black text-slate-900 tracking-tight">{event.estimatedBudget ? `${event.estimatedBudget} €` : '—'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Estimado</p>
          </MetricCard>
        </div>

        {/* Invitaciones */}
        <section className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Artistas invitados</h2>
            </div>
          </div>

          <div className="p-6">
            {invitationsLoading ? (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-8">Cargando invitaciones…</p>
            ) : invitations.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-slate-300" />
                </div>
                <p className="font-bold text-slate-900 text-sm">Sin invitaciones</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">No has invitado a ningún artista todavía. Usa el botón "Buscar artistas".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InvitationColumn title="Pendientes" items={[...pendingInvitations, ...inProgressInvitations]} emptyCopy="Sin pendientes" tone="amber">
                  {(inv) => (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-amber-100 shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <UserCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate">{artistNameById(inv.artistId)}</span>
                      </div>
                      {bookingByArtistId.has(inv.artistId) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 shrink-0">En curso</span>
                      )}
                    </div>
                  )}
                </InvitationColumn>

                <InvitationColumn title="Aceptados" items={visibleAcceptedInvitations} emptyCopy="Sin aceptados" tone="emerald">
                  {(inv) => (
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-white border border-emerald-100 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate">{artistNameById(inv.artistId)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {bookingByArtistId.has(inv.artistId) ? (
                          <Link
                            href={`/bookings/${bookingByArtistId.get(inv.artistId)?.bookingId}`}
                            className="flex-1 flex justify-center items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Ver booking
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCreateBooking(inv.artistId)}
                            className="flex-1 rounded-lg bg-emerald-500 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-950 hover:bg-emerald-400 transition-colors text-center"
                          >
                            Contratar
                          </button>
                        )}
                        <Link
                          href={`/artists/profile/${inv.artistId}?eventId=${event?.id ?? ''}&date=${eventDateForQuery}`}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
                          title="Ver perfil"
                        >
                          <UserCircle2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </InvitationColumn>

                <InvitationColumn title="Rechazados" items={uniqueRejectedItems} emptyCopy="Sin rechazados" tone="slate">
                  {(item) => (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-6 h-6 rounded-md bg-slate-200/50 text-slate-400 flex items-center justify-center shrink-0">
                        <UserCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-slate-500 truncate">{item.name}</span>
                    </div>
                  )}
                </InvitationColumn>
              </div>
            )}

            {acceptedInvitationsFiltered.length > 5 && (
              <div className="pt-6 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllAccepted((s) => !s)}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-full hover:bg-slate-100"
                >
                  {showAllAccepted ? 'Ocultar resto' : `Ver ${acceptedInvitationsFiltered.length - 5} más`}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Line-up Bookings */}
        <section className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Line-up (Contrataciones)</h2>
          </div>

          <div className="p-0">
            {bookingsLoading ? (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-8">Cargando contrataciones…</p>
            ) : bookingsError ? (
              <p className="text-sm text-red-500 font-bold text-center py-8">No se pudieron cargar las contrataciones</p>
            ) : eventBookings.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-bold text-slate-400 text-sm">Sin contrataciones creadas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {eventBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}`}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{booking.artist?.name ?? 'Artista desconocido'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Booking #{booking.id.slice(0, 8)}</p>
                      </div>
                      <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{booking.start_date ? formatDate(booking.start_date) : 'Sin fecha'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                      <Pill label={booking.status} tone="slate" />
                      <div className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center group-hover:border-amber-300 group-hover:bg-amber-50 transition-all">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function MetricCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}

function Pill({ label, tone = 'slate' }: { label: string; tone?: 'slate' | 'amber' | 'emerald' }) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-50 text-amber-700 ring-amber-200/50'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/50'
        : 'bg-slate-50 text-slate-700 ring-slate-200/50';
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${toneClass}`}>
      {label}
    </span>
  );
}

function InvitationColumn<T>({ title, items, emptyCopy, tone, children }: { title: string; items: T[]; emptyCopy: string; tone: 'amber' | 'emerald' | 'slate'; children: (item: T) => ReactNode }) {
  const bgClass =
    tone === 'amber' ? 'bg-amber-50/30 border-amber-100' :
      tone === 'emerald' ? 'bg-emerald-50/30 border-emerald-100' :
        'bg-slate-50 border-slate-100';

  const titleColor =
    tone === 'amber' ? 'text-amber-900/60' :
      tone === 'emerald' ? 'text-emerald-900/60' :
        'text-slate-400';

  return (
    <div className={`rounded-2xl border ${bgClass} p-4 space-y-4`}>
      <p className={`text-[10px] font-black uppercase tracking-widest ${titleColor}`}>{title} <span className="opacity-50">({items.length})</span></p>
      {items.length === 0 ? (
        <p className="text-xs font-semibold text-slate-400">{emptyCopy}</p>
      ) : (
        <div className="space-y-2">{items.map((item, idx) => <div key={idx}>{children(item)}</div>)}</div>
      )}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

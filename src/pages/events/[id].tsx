import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Copy, Eye, EyeOff, Sparkles, Users } from 'lucide-react';

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

  const { artists, artistsLoading, artistsError } = useArtists();

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

  if (loading) return <div className="p-8 text-slate-700">Cargando evento…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!event) return <div className="p-8 text-red-600">No se encontró el evento.</div>;

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

  const visibilityLabel = event.visibility === 'PRIVATE' ? 'Hacer evento visible' : 'Ocultar evento';

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">Evento</p>
          <h1 className="text-3xl font-semibold text-slate-900">{event.name}</h1>
          <p className="text-slate-600 flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" /> {event.start_date ? formatDate(event.start_date) : 'Fecha por definir'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDuplicateEvent}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" /> Duplicar
          </button>
          <button
            type="button"
            onClick={handleToggleVisibility}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            {event.visibility === 'PRIVATE' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {visibilityLabel}
          </button>
          {canSearchArtists && (
            <button
              type="button"
              onClick={handleSearchArtists}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Users className="h-4 w-4" /> Buscar artistas
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Visibilidad" icon={<Eye className="h-4 w-4 text-slate-600" />}>
          <Pill label={event.visibility} tone="amber" />
        </Card>
        <Card title="Estado" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
          <Pill label={event.status} tone="slate" />
        </Card>
        <Card title="Presupuesto estimado" icon={<CheckCircle2 className="h-4 w-4 text-slate-600" />}>
          <p className="text-lg font-semibold text-slate-900">{event.estimatedBudget ?? '—'}</p>
          <p className="text-xs text-slate-500">Referencia para ofertas</p>
        </Card>
      </section>

      <Card title="Artistas invitados" icon={<Users className="h-4 w-4 text-slate-600" />}>
        {invitationsLoading && <p className="text-sm text-slate-600">Cargando invitaciones…</p>}

        {!invitationsLoading && invitations.length === 0 && (
          <p className="text-sm text-slate-600">No hay invitaciones todavía.</p>
        )}

        {!invitationsLoading && invitations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InvitationColumn title="Pendientes" items={pendingInvitations} emptyCopy="Sin pendientes">
              {(inv) => <span className="text-sm text-slate-700">{artistNameById(inv.artistId)}</span>}
            </InvitationColumn>

            <InvitationColumn title="Aceptados" items={visibleAcceptedInvitations} emptyCopy="Sin aceptados">
              {(inv) => (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700">{artistNameById(inv.artistId)}</span>
                  <div className="flex items-center gap-2">
                    {bookingByArtistId.has(inv.artistId) ? (
                      <>
                        <span className="text-xs text-slate-500">Booking {bookingByArtistId.get(inv.artistId)?.status}</span>
                        <Link
                          href={`/bookings/${bookingByArtistId.get(inv.artistId)?.bookingId}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                        >
                          Ver booking
                        </Link>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateBooking(inv.artistId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Crear booking
                      </button>
                    )}
                    <Link
                      href={`/artists/profile/${inv.artistId}?eventId=${event?.id ?? ''}&date=${eventDateForQuery}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </div>
              )}
            </InvitationColumn>

            <InvitationColumn title="Rechazados" items={uniqueRejectedItems} emptyCopy="Sin rechazados">
              {(item) => <span className="text-sm text-slate-700">{item.name}</span>}
            </InvitationColumn>
          </div>
        )}

        {acceptedInvitationsFiltered.length > 5 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAllAccepted((s) => !s)}
              className="text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              {showAllAccepted ? 'Ver menos' : 'Ver más'}
            </button>
          </div>
        )}
      </Card>

      <Card title="Line-up (bookings)" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
        {bookingsLoading && <p className="text-sm text-slate-600">Cargando contrataciones…</p>}
        {bookingsError && <p className="text-sm text-red-600">No se pudieron cargar las contrataciones</p>}

        {!bookingsLoading && !bookingsError && eventBookings.length === 0 && (
          <p className="text-sm text-slate-600">No hay contrataciones asociadas.</p>
        )}

        {!bookingsLoading && !bookingsError && eventBookings.length > 0 && (
          <div className="divide-y divide-slate-100">
            {eventBookings.map((booking) => (
              <div key={booking.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3">
                <div className="md:col-span-5">
                  <p className="font-medium text-slate-900">{booking.artist?.name ?? 'Artista desconocido'}</p>
                  <p className="text-xs text-slate-500">Booking #{booking.id}</p>
                </div>
                <div className="md:col-span-3 text-sm text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{booking.start_date ? formatDate(booking.start_date) : '—'}</span>
                </div>
                <div className="md:col-span-2">
                  <Pill label={booking.status} tone="slate" />
                </div>
                <div className="md:col-span-2 text-right">
                  <Link href={`/bookings/${booking.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-slate-900">
                    Ver contratación
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

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <header className="flex items-center gap-2">
        {icon && <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Pill({ label, tone = 'slate' }: { label: string; tone?: 'slate' | 'amber' | 'emerald' }) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : tone === 'emerald'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>{label}</span>;
}

function InvitationColumn<T>({ title, items, emptyCopy, children }: { title: string; items: T[]; emptyCopy: string; children: (item: T) => ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{emptyCopy}</p>
      ) : (
        <div className="space-y-2">{items.map((item, idx) => <div key={idx}>{children(item)}</div>)}</div>
      )}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, CreditCard, FileText, AlertTriangle, MessageSquare, HandCoins, CheckCircle2, XCircle } from 'lucide-react';

import { CancelBookingModal } from '@/components/bookings/CancelBookingModal';
import { NegotiationPanel } from '@/components/bookings/NegotiationPanel';
import { SignContractModal } from '@/components/bookings/SignContractModal';
import { useContract } from '@/hooks/bookings/contracts/useContract';
import { useBooking } from '@/hooks/bookings/useBooking';
import { useNegotiation } from '@/hooks/bookings/useNegotiation';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { Role } from '@/types/booking';
import { withRole } from '@/components/auth/withRole';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/StatusBadge';

import { cancelBooking } from '@/services/bookings/cancellations.service';
import { confirmPaymentForMilestone } from '@/services/bookings/payments/confirmPayment.service';
import {
  createPaymentIntentForMilestone,
  getMilestonesForBooking,
} from '@/services/bookings/payments/payments.service.';
import { signContract } from '@/services/contracts/contracts.service';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

import { getStatusMessage } from '@/components/bookings/booking-ui.helpers';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { role, loading: meLoading, profileId } = useMe();

  const bookingId = typeof id === 'string' ? id : undefined;

  const {
    booking,
    loading,
    isHandledByOther,
    refresh,
  } = useBooking(bookingId);

  const { messages: negotiationMessages, loading: negotiationLoading } = useNegotiation(bookingId);

  const { contract, refresh: refreshContract } = useContract(bookingId);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSignContractModal, setShowSignContractModal] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (loading || meLoading) return <p style={{ padding: 24 }}>Cargando contratación…</p>;
  if (!booking) return <p>No se pudo cargar la contratación.</p>;
  if (!user) return null;

  // Control de ownership por rol
  const isArtistOwner = role === 'ARTIST' && profileId && booking.artistId === profileId;
  const isVenueOwner = role === 'VENUE' && profileId && booking.venueId === profileId;
  const isManagerOwner = role === 'MANAGER' && profileId && booking.managerId === profileId;
  const isPromoterOwner = role === 'PROMOTER' && profileId && booking.promoterId === profileId;
  const isAuthorized = isArtistOwner || isVenueOwner || isManagerOwner || isPromoterOwner;

  if (!isAuthorized) {
    return <p style={{ padding: 24 }}>Acceso no autorizado</p>;
  }

  const venueName = (booking as any).venue?.name ?? (booking as any).venueName ?? 'Sala';
  const venueCity = (booking as any).venue?.city ?? null;
  const venueId = (booking as any).venue?.id ?? booking.venueId;
  const artistName = (booking as any).artist?.name ?? (booking as any).artistName ?? null;

  // Si el backend define el turno, úsalo como fuente principal.
  const hasTurn = booking.handledByRole
    ? booking.handledByRole === role
    : !isHandledByOther;

  const statusMessage = getStatusMessage({
    bookingStatus: booking.status,
    contractStatus: contract?.status,
    role: role as Role,
    hasTurn,
  });

  const handledByLabel =
    booking.handledByRole === 'PROMOTER'
      ? 'promotor'
      : booking.handledByRole === 'VENUE'
        ? 'sala'
        : booking.handledByRole === 'ARTIST'
          ? 'artista'
          : booking.handledByRole === 'MANAGER'
            ? 'manager'
            : null;

  const actionTurnMessage = hasTurn
    ? 'Es tu turno para responder o cancelar la propuesta.'
    : handledByLabel
      ? `Turno de ${handledByLabel}.`
      : 'La otra parte estÃ¡ gestionando este booking.';

  const hasContract = Boolean(contract);
  const canSignContract =
    Boolean(contract) &&
    contract?.status === 'DRAFT' &&
    (role === 'ARTIST' || role === 'MANAGER');
  const backHref =
    role === 'VENUE' || role === 'PROMOTER'
      ? '/venues/bookings'
      : role === 'ARTIST'
        ? '/artists/bookings'
        : '/bookings';

  const lastActivity = booking.handledAt ?? (booking as any).updatedAt ?? (booking as any).createdAt ?? null;
  const bookingAmount = (booking as any).totalAmount ?? (booking as any).amount ?? null;
  const bookingCurrency = (booking as any).currency ?? 'EUR';
  const eventDate = booking.start_date ?? (booking as any).startDate ?? null;
  const timelineEvents = negotiationMessages
    .map((m) => ({
      id: m.id,
      createdAt: m.createdAt,
      role: m.senderRole,
      amount: m.proposedFee,
      isFinal: m.isFinalOffer,
      note: m.message,
    }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const hasArtistResponse = timelineEvents.some((event) => event.role === 'ARTIST');
  const firstVenueOffer = timelineEvents.find(
    (event) => event.role === 'VENUE' && typeof event.amount === 'number'
  );
  const lastNumericOffer = [...timelineEvents]
    .reverse()
    .find((event) => typeof event.amount === 'number');
  const bookingData = {
    conditions: {
      originalPrice: firstVenueOffer?.amount ?? null,
      currentOffer: lastNumericOffer?.amount ?? firstVenueOffer?.amount ?? null,
      currency: bookingCurrency,
      includes: ['Alojamiento', 'Backline básico', 'Cena para el artista'],
      excludes: ['Transporte', 'Sonido PA'],
    },
  };

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a bookings
      </Link>

      <div className="action-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">{artistName ?? 'Artista'}</h1>
                <p className="text-xs text-muted-foreground">Booking #{booking.id}</p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-muted-foreground">
              {artistName ?? 'Artista'} → {venueName}
              {venueCity ? ` · ${venueCity}` : ''}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Última actividad</p>
            <p>{lastActivity ? formatRelativeTime(lastActivity) : 'Sin actividad'}</p>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
       

          <div className="action-panel">
            <h2 className="font-semibold text-foreground mb-4">Detalles del evento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="text-foreground">{formatDate(eventDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Turno</p>
                  <p className="text-foreground">{booking.handledByRole ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Sala</p>
                  <p className="text-foreground">
                    {venueName}
                    {venueCity ? `, ${venueCity}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Importe</p>
                  <p className="text-foreground">{formatCurrency(bookingAmount, bookingCurrency)}</p>
                </div>
              </div>
            </div>

            {venueId && (
              <div className="mt-4">
                <Link
                  href={`/venues/${venueId}${artistName ? `?artistName=${encodeURIComponent(artistName)}` : ''}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver sala
                </Link>
              </div>
            )}
          </div>

          <div className="action-panel">
            <h2 className="font-semibold text-foreground mb-4">Condiciones en negociación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Propuesta inicial</p>
                <p className="text-lg text-muted-foreground line-through">
                  {formatCurrency(bookingData.conditions.originalPrice, bookingData.conditions.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Oferta actual</p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatCurrency(bookingData.conditions.currentOffer, bookingData.conditions.currency)}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Incluido</p>
                <ul className="space-y-1">
                  {bookingData.conditions.includes.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">No incluido</p>
                <ul className="space-y-1">
                  {bookingData.conditions.excludes.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {contract?.status === 'SIGNED' && (role === 'VENUE' || role === 'PROMOTER') && (
            <div className="action-panel">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground">Pagos</h2>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>

              {!clientSecret && (
                <Button
                  variant="default"
                  onClick={async () => {
                    const milestones = await getMilestonesForBooking(
                      booking.id,
                      user.token
                    );

                    const pending = milestones.find(
                      (m: any) => m.props?.status === 'PENDING'
                    );

                    if (!pending) {
                      setPaymentError('No hay milestones pendientes');
                      return;
                    }

                    const result = await createPaymentIntentForMilestone(
                      pending.props.id,
                      user.token
                    );

                    setMilestoneId(pending.props.id);
                    setClientSecret(result.clientSecret);
                  }}
                >
                  Proceder al pago
                </Button>
              )}

              {clientSecret && milestoneId && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SimpleCardPaymentForm
                    clientSecret={clientSecret}
                    bookingId={booking.id}
                    milestoneId={milestoneId}
                    token={user.token}
                    onSuccess={refresh}
                  />
                </Elements>
              )}

              {paymentError && <p className="mt-2 text-sm text-red-600">{paymentError}</p>}
            </div>
          )}

       

          <div className="action-panel">
            <h2 className="font-semibold text-foreground mb-4">Historial de negociación</h2>
            {negotiationLoading ? (
              <p className="text-sm text-muted-foreground">Cargando historial…</p>
            ) : timelineEvents.length === 0 ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Sin actividad de negociación.</p>
                {statusMessage && <p className="text-foreground">{statusMessage}</p>}
              </div>
            ) : (
              <div className="relative">
                {!hasArtistResponse && statusMessage && (
                  <div className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    {statusMessage}
                  </div>
                )}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-4">
                  {timelineEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="relative flex items-start gap-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${getTimelineColor(event)}`}>
                        {getTimelineIcon(event)}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">
                            {event.isFinal ? 'Oferta final' : event.amount ? 'Propuesta' : 'Mensaje'}
                          </p>
                          {typeof event.amount === 'number' && (
                            <p className="font-medium text-foreground">
                              {formatCurrency(event.amount, bookingCurrency)}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{event.role.toLowerCase()}</p>
                        {event.note && (
                          <p className="text-sm text-muted-foreground mt-1">{event.note}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatShortDate(event.createdAt)} · {formatShortTime(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <NegotiationPanel
            bookingId={booking.id}
            bookingStatus={booking.status}
            userRole={role as any}
            handledByRole={booking.handledByRole as any}
            isHandledByOther={isHandledByOther}
            onBookingUpdated={refresh}
            refreshContract={refreshContract}
            onCancelBooking={() => setShowCancelModal(true)}
          />
        </div>

        <div className="space-y-6">
          <div className="action-panel border-l-4 border-l-amber-400 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Turno de acción</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {actionTurnMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="action-panel">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Estado contractual
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasContract ? `Contrato ${contract?.status ?? 'en preparación'}` : 'Aún no hay contrato generado.'}
            </p>
            {canSignContract && (
              <div className="mt-3">
                <Button
                  onClick={() => setShowSignContractModal(true)}
                  variant="default"
                >
                  Firmar contrato
                </Button>
              </div>
            )}
          </div>


          <div className="text-xs text-muted-foreground text-center">
            Booking ID: {booking.id}
          </div>
        </div>
      </div>

      <Separator />

      <CancelBookingModal
        open={showCancelModal}
        title="Cancelar booking"
        confirmLabel="Cancelar booking"
        onClose={() => setShowCancelModal(false)}
        onConfirm={async ({ reason, description }) => {
          await cancelBooking({
            bookingId: booking.id,
            reason,
            description,
            token: user.token,
            initiator: role as any,
          });
          await refresh();
        }}
      />

      <SignContractModal
        open={showSignContractModal}
        title="Firmar contrato"
        confirmLabel="Firmar contrato"
        onClose={() => setShowSignContractModal(false)}
        onConfirm={async () => {
          if (!contract?.id) return;
          await signContract(contract.id, user.token);
          await refreshContract();
          await refresh();
        }}
      />
    </main>
  );
}

export default withRole(BookingDetailPage, ['VENUE', 'PROMOTER', 'ARTIST', 'MANAGER']);

/* =========================
   FORMULARIO DE PAGO STRIPE
   ========================= */

function SimpleCardPaymentForm({
  clientSecret,
  bookingId,
  milestoneId,
  token,
  onSuccess,
}: {
  clientSecret: string;
  bookingId: string;
  milestoneId: string;
  token: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message ?? 'Pago fallido');
      setLoading(false);
      return;
    }

    if (result.paymentIntent?.status === 'succeeded') {
      await confirmPaymentForMilestone({
        bookingId,
        milestoneId,
        token,
      });
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="mt-4 space-y-3">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handlePay} disabled={loading} className="w-full">
        {loading ? 'Procesando…' : 'Pagar'}
      </Button>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'hace unos segundos';
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;

  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} mes${months === 1 ? '' : 'es'}`;

  const years = Math.floor(months / 12);
  return `hace ${years} año${years === 1 ? '' : 's'}`;
}

function formatShortDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function getTimelineColor(event: { isFinal: boolean; amount?: number }) {
  if (event.isFinal) return 'bg-amber-100 text-amber-700';
  if (typeof event.amount === 'number') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}

function getTimelineIcon(event: { isFinal: boolean; amount?: number }) {
  if (event.isFinal) return <HandCoins className="h-5 w-5" />;
  if (typeof event.amount === 'number') return <HandCoins className="h-5 w-5" />;
  return <MessageSquare className="h-5 w-5" />;
}

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}

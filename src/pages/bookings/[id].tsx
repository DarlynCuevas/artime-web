import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Clock, CreditCard, FileText, AlertTriangle, MessageSquare, HandCoins, CheckCircle2, XCircle } from 'lucide-react';

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
import { StatusBadge } from '@/components/ui/StatusBadge';

import { cancelBooking } from '@/services/bookings/cancellations.service';
import { eventsService } from '@/services/events/events.service';
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
  const [eventName, setEventName] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<{
    paidAmount: number;
    totalAmount: number;
    percent: number;
  } | null>(null);

  useEffect(() => {
    if (!booking?.eventId || !user?.token) {
      setEventName(null);
      return;
    }

    eventsService
      .getEvent(booking.eventId, user.token)
      .then((event) => setEventName(event.name ?? null))
      .catch(() => setEventName(null));
  }, [booking?.eventId, user?.token]);

  useEffect(() => {
    if (!bookingId || !user?.token || !booking?.totalAmount) {
      setPaymentSummary(null);
      return;
    }

    getMilestonesForBooking(bookingId, user.token)
      .then((milestones) => {
        const paidAmount = (milestones ?? [])
          .filter((m: any) => {
            const status = m?.props?.status ?? m?.status;
            return status === 'PAID' || status === 'FINALIZED';
          })
          .reduce((sum: number, m: any) => {
            const amount = m?.props?.amount ?? m?.amount ?? 0;
            return sum + amount;
          }, 0);

        const totalAmount = booking.totalAmount ?? 0;
        const percent =
          totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

        setPaymentSummary({
          paidAmount,
          totalAmount,
          percent,
        });
      })
      .catch(() => setPaymentSummary(null));
  }, [bookingId, booking?.totalAmount, user?.token]);

  if (loading || meLoading) return <p style={{ padding: 24 }}>Cargando contratación…</p>;
  if (!booking) return <p>No se pudo cargar la contratación.</p>;
  if (!user) return null;

  // Control de ownership por rol
  const isArtistOwner = role === 'ARTIST' && profileId && booking.artistId === profileId;
  const isVenueOwner = role === 'VENUE' && profileId && booking.venueId === profileId;
  const isManagerOwner = role === 'MANAGER' && booking.managerId === profileId;
  const isPromoterOwner = role === 'PROMOTER' && profileId && booking.promoterId === profileId;
  // El backend ya controla el acceso por token/representación; no bloqueamos en frontend.

  const venueName = (booking as any).venue?.name ?? (booking as any).venueName ?? 'Sala';
  const venueCity = (booking as any).venue?.city ?? null;
  const venueId = (booking as any).venue?.id ?? booking.venueId;
  const artistId = booking.artistId ?? (booking as any).artistId ?? null;
  const promoterId = (booking as any).promoter?.id ?? booking.promoterId ?? null;
  const artistName = (booking as any).artist?.name ?? (booking as any).artistName ?? null;

  // Turno: si hay handler asignado a otra parte, no es tu turno; si no, se decide por últimos mensajes
  const lastNegotiation = negotiationMessages.length > 0 ? negotiationMessages[negotiationMessages.length - 1] : null;
  const lastSenderRole = lastNegotiation?.senderRole as Role | undefined;
  const isArtistSide = role === 'ARTIST' || role === 'MANAGER';
  const isLastFromArtistSide = lastSenderRole === 'ARTIST' || lastSenderRole === 'MANAGER';
  const isLastFromVenueSide = lastSenderRole === 'VENUE' || lastSenderRole === 'PROMOTER';
  const isMyTurnByMessages = !lastSenderRole
    ? true
    : isArtistSide
      ? isLastFromVenueSide
      : isLastFromArtistSide;
  const lockedToOther = booking.handledByRole && booking.handledByRole !== role;
  const hasTurn = lockedToOther ? false : isMyTurnByMessages;

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

  const canCancelBooking =
    booking.status !== 'CANCELLED' && booking.status !== 'CANCELLED_PENDING_REVIEW';
  const backHref =
    role === 'VENUE'
      ? '/venues/bookings'
      : role === 'PROMOTER'
        ? '/promoter/bookings'
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
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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



  const headerTargetName = eventName ?? venueName;
  const headerTargetMeta = eventName ? null : venueCity;

  const isArtistSideViewer = role === 'ARTIST' || role === 'MANAGER';
  const counterpartyHref = isArtistSideViewer
    ? (venueId ? `/venues/profile/${venueId}` : null)
    : (artistId ? `/artists/profile/${artistId}` : null);
  const counterpartyLabel = isArtistSideViewer ? 'Ver sala' : 'Ver artista';


  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Volver a bookings
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{artistName ?? 'Artista'}</h1>
                <p className="text-xs text-slate-500">Booking #{booking.id}</p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-sm text-slate-600">
              {artistName ?? 'Artista'} → {headerTargetName}
              {headerTargetMeta ? ` · ${headerTargetMeta}` : ''}
            </p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p className="font-medium text-slate-900">Última actividad</p>
            <p>{lastActivity ? formatRelativeTime(lastActivity) : 'Sin actividad'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <KpiCard label="Estado" value={booking.status} />
          <KpiCard label="Importe" value={formatCurrency(bookingAmount, bookingCurrency)} />
          <KpiCard
            label="Pago"
            value={paymentSummary ? (paymentSummary.percent >= 100 ? 'Pagado completo' : `Pagado ${paymentSummary.percent}%`) : '—'}
            helper={paymentSummary ? `${formatCurrency(paymentSummary.paidAmount, bookingCurrency)} de ${formatCurrency(paymentSummary.totalAmount, bookingCurrency)}` : undefined}
          />
          <KpiCard label="Turno" value={hasTurn ? 'Tu turno' : handledByLabel ? `Turno de ${handledByLabel}` : 'En gestión'} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Evento y condiciones" subtitle="Fuente: backend" icon={<Calendar className="h-4 w-4 text-slate-600" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Fecha" value={formatDate(eventDate)} icon={<Calendar className="h-4 w-4 text-slate-500" />} />
              <InfoRow label="Turno" value={booking.handledByRole ?? '—'} icon={<Clock className="h-4 w-4 text-slate-500" />} />
              <InfoRow label="Sala" value={`${venueName}${venueCity ? `, ${venueCity}` : ''}`} icon={<MapPin className="h-4 w-4 text-slate-500" />} />
              <InfoRow label="Importe" value={formatCurrency(bookingAmount, bookingCurrency)} icon={<CreditCard className="h-4 w-4 text-slate-500" />} />
            </div>

            {(counterpartyHref || promoterId) && (
              <div className="flex flex-wrap gap-3 pt-4">
                {counterpartyHref && (
                  <Link href={counterpartyHref} className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-slate-900">
                    {counterpartyLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {promoterId && role !== 'PROMOTER' && (
                  <Link href={`/promoter/profile/${promoterId}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-slate-900">
                    Ver promotor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </Card>

          <Card title="Condiciones en negociación" subtitle="Incluido / no incluido" icon={<CreditCard className="h-4 w-4 text-slate-600" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <InfoRow label="Propuesta inicial" value={formatCurrency(bookingData.conditions.originalPrice, bookingData.conditions.currency)} muted strike />
              <InfoRow label="Oferta actual" value={formatCurrency(bookingData.conditions.currentOffer, bookingData.conditions.currency)} strong />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-800 mb-2">Incluido</p>
                <ul className="space-y-1">
                  {bookingData.conditions.includes.map((item) => (
                    <li key={item} className="text-sm text-slate-600 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 mb-2">No incluido</p>
                <ul className="space-y-1">
                  {bookingData.conditions.excludes.map((item) => (
                    <li key={item} className="text-sm text-slate-600 flex items-center gap-2">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {contract?.status === 'SIGNED' && (role === 'VENUE' || role === 'PROMOTER') && !['PAID_FULL', 'COMPLETED'].includes(booking.status) && (
            <Card title="Pagos" subtitle="Procesa milestones pendientes" icon={<CreditCard className="h-4 w-4 text-slate-600" />}>
              {!clientSecret && (
                <Button
                  variant="default"
                  onClick={async () => {
                    try {
                      setPaymentError(null);
                      setPaymentInfo(null);
                      const milestones = await getMilestonesForBooking(booking.id, user.token);
                      const pending = milestones.find((m: any) => m.props?.status === 'PENDING');
                      if (!pending) {
                        setPaymentError('No hay milestones pendientes');
                        return;
                      }
                      const result = await createPaymentIntentForMilestone(pending.props.id, user.token);
                      if (result.status === 'succeeded') {
                        setPaymentInfo('Pago confirmado en Stripe. Actualizando booking...');
                        await confirmPaymentForMilestone({ bookingId: booking.id, milestoneId: pending.props.id, token: user.token });
                        await refresh();
                        return;
                      }
                      if (result.status) {
                        setPaymentInfo(`Estado del PaymentIntent: ${result.status}`);
                      }
                      setMilestoneId(pending.props.id);
                      setClientSecret(result.clientSecret);
                    } catch (err) {
                      setPaymentError(err instanceof Error ? err.message : 'Error creando PaymentIntent');
                    }
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

              {paymentInfo && <p className="mt-2 text-sm text-slate-600">{paymentInfo}</p>}
              {paymentError && <p className="mt-2 text-sm text-red-600">{paymentError}</p>}
            </Card>
          )}

          <Card title="Historial de negociación" subtitle="Lo más reciente primero" icon={<MessageSquare className="h-4 w-4 text-slate-600" />}>
            {negotiationLoading ? (
              <p className="text-sm text-slate-500">Cargando historial…</p>
            ) : timelineEvents.length === 0 ? (
              <div className="space-y-2 text-sm text-slate-600">
                <p>Sin actividad de negociación.</p>
                {statusMessage && <p className="text-slate-900">{statusMessage}</p>}
              </div>
            ) : (
              <div className="relative">
                {!hasArtistResponse && statusMessage && (
                  <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {statusMessage}
                  </div>
                )}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200" />
                <div className="space-y-4">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="relative flex items-start gap-4" style={{ animationDelay: `${index * 40}ms` }}>
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${getTimelineColor(event)}`}>
                        {getTimelineIcon(event)}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900">{event.isFinal ? 'Oferta final' : event.amount ? 'Propuesta' : 'Mensaje'}</p>
                          {typeof event.amount === 'number' && (
                            <p className="font-medium text-slate-900">{formatCurrency(event.amount, bookingCurrency)}</p>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 capitalize">{event.role.toLowerCase()}</p>
                        {event.note && <p className="text-sm text-slate-600 mt-1">{event.note}</p>}
                        <p className="text-xs text-slate-500 mt-1">{formatShortDate(event.createdAt)} · {formatShortTime(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="Acciones" subtitle="Turno y cancelación" icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}>
            <p className="text-sm text-slate-700 mb-3">{actionTurnMessage}</p>
            <NegotiationPanel
              bookingId={booking.id}
              bookingStatus={booking.status}
              userRole={role as any}
              handledByRole={booking.handledByRole as any}
              isHandledByOther={isHandledByOther}
              onBookingUpdated={refresh}
              refreshContract={refreshContract}
              onCancelBooking={() => {
                if (canCancelBooking) setShowCancelModal(true);
              }}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Contrato" subtitle="Estado contractual" icon={<FileText className="h-4 w-4 text-slate-600" />}>
            <p className="text-sm text-slate-600">{hasContract ? `Contrato ${contract?.status ?? 'en preparación'}` : 'Aún no hay contrato generado.'}</p>
            {canSignContract && (
              <div className="mt-3">
                <Button onClick={() => setShowSignContractModal(true)} variant="default">
                  Firmar contrato
                </Button>
              </div>
            )}
          </Card>

          <Card title="Metadatos" subtitle="Auditoría" icon={<HandCoins className="h-4 w-4 text-slate-600" />}>
            <div className="space-y-2 text-sm text-slate-700">
              <InfoRow label="Booking ID" value={booking.id} />
              <InfoRow label="Última actividad" value={lastActivity ? formatDateTime(lastActivity) : '—'} />
            </div>
          </Card>
        </div>
      </section>

      {canCancelBooking && (
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
              bookingStatus: booking.status,
              hasPayments: Boolean(paymentSummary && paymentSummary.paidAmount > 0),
            });
            await refresh();
          }}
        />
      )}

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

function Card({ title, subtitle, icon, children, tone = 'slate' }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode; tone?: 'slate' | 'amber' }) {
  const borderClass = tone === 'amber' ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-white';
  return (
    <section className={`rounded-xl ${borderClass} shadow-sm p-5 space-y-3`}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
      </header>
      {children}
    </section>
  );
}

function KpiCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      {helper && <p className="text-xs text-slate-500 mt-0.5">{helper}</p>}
    </div>
  );
}

function InfoRow({ label, value, icon, muted = false, strong = false, strike = false }: { label: string; value: string | number; icon?: ReactNode; muted?: boolean; strong?: boolean; strike?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      {icon}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`${muted ? 'text-slate-500' : 'text-slate-900'} ${strong ? 'text-2xl font-semibold' : 'font-medium'} ${strike ? 'line-through' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

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




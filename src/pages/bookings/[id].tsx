import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Clock, CreditCard, FileText, AlertTriangle, MessageSquare, HandCoins, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';

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

  if (loading || meLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 animate-pulse font-medium text-sm">
          <Clock className="h-4 w-4" />
          <span>Cargando detalle de contratación...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto rounded-xl border border-slate-200 bg-white p-6 text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-900">No se pudo cargar la contratación.</p>
          <Link href="/bookings" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const venueName = (booking as any).venue?.name ?? (booking as any).venueName ?? 'Sala';
  const venueCity = (booking as any).venue?.city ?? null;
  const venueId = (booking as any).venue?.id ?? booking.venueId;
  const artistId = booking.artistId ?? (booking as any).artistId ?? null;
  const promoterId = (booking as any).promoter?.id ?? booking.promoterId ?? null;
  const artistName = (booking as any).artist?.name ?? (booking as any).artistName ?? null;

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

  const handlerIsArtistSide = booking.handledByRole === 'ARTIST' || booking.handledByRole === 'MANAGER';
  const lockedToOther = handlerIsArtistSide && isArtistSide && booking.handledByRole !== role;
  const hasTurn = lockedToOther ? false : isMyTurnByMessages;

  const statusMessage = getStatusMessage({
    bookingStatus: booking.status,
    contractStatus: contract?.status,
    role: role as Role,
    hasTurn,
  });

  const hasContract = Boolean(contract);

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
      : 'La otra parte está gestionando este booking.';

  const canSignContract =
    hasContract &&
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
  const isFullyPaid = booking.status === 'PAID_FULL' || paymentSummary?.percent === 100;
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
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <Link href={backHref} className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">
        <ChevronLeft className="h-4 w-4" />
        Volver a bookings
      </Link>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-900" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Artime OS · Operativo</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{artistName ?? 'Artista'}</h1>
                <StatusBadge status={booking.status} className="scale-110" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Booking #{booking.id}</p>
            </div>

            <div className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
              <span className="text-slate-400">{artistName ?? 'Artista'}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
              <span>{headerTargetName}{headerTargetMeta ? `, ${headerTargetMeta}` : ''}</span>
            </div>
          </div>

          <div className="text-right md:pt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Última actividad</p>
            <div className="flex items-center justify-end gap-2 text-slate-900 font-bold">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{lastActivity ? formatRelativeTime(lastActivity) : 'Sin actividad'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/30">
          <KpiCard label="Importe acordado" value={formatCurrency(bookingAmount, bookingCurrency)} />
          <KpiCard
            label="Estado de pago"
            value={paymentSummary ? `${paymentSummary.percent}%` : '—'}
            helper={paymentSummary ? `${formatCurrency(paymentSummary.paidAmount, bookingCurrency)} liquidados` : undefined}
            tone={paymentSummary?.percent === 100 ? 'emerald' : 'slate'}
          />
          <KpiCard
            label="Turno operativo"
            value={hasTurn ? 'Tu turno' : handledByLabel ? handledByLabel : 'En gestión'}
            tone={hasTurn ? 'amber' : 'slate'}
          />
          <KpiCard
            label="Fecha del evento"
            value={eventDate ? new Date(eventDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
            helper={eventDate ? new Date(eventDate).getFullYear().toString() : undefined}
          />
        </div>
      </section>

      {statusMessage && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 text-[13px] font-bold text-amber-900 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          {statusMessage}
        </div>
      )}

      {contract?.status === 'SIGNED' && (role === 'VENUE' || role === 'PROMOTER') && !['PAID_FULL', 'COMPLETED'].includes(booking.status) && !isFullyPaid && (
        <Card title="Gestión de pagos" subtitle="Liquidación de hitos pendientes" icon={<CreditCard className="h-4 w-4" />}>
          {!clientSecret && (
            <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-xl shadow-slate-900/10">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Acción requerida</p>
                <h4 className="text-xl font-bold">Procesar siguiente milestone</h4>
              </div>
              <Button
                variant="default"
                className="w-full bg-white text-slate-900 hover:bg-slate-100 h-12 font-bold rounded-xl transition-all"
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
                Proceder al pago seguro
              </Button>
            </div>
          )}

          {clientSecret && milestoneId && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SimpleCardPaymentForm
                  clientSecret={clientSecret}
                  bookingId={booking.id}
                  milestoneId={milestoneId}
                  token={user.token}
                  onSuccess={refresh}
                />
              </Elements>
            </div>
          )}

          {paymentInfo && <p className="mt-4 text-[13px] font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-lg">{paymentInfo}</p>}
          {paymentError && <p className="mt-4 text-[13px] font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg">{paymentError}</p>}
        </Card>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Card title="Evento y condiciones" subtitle="Detalles técnicos y de ubicación" icon={<Calendar className="h-4 w-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <InfoRow label="Fecha del evento" value={formatDate(eventDate)} icon={<Calendar className="h-4 w-4 text-slate-400" />} />
              <InfoRow label="Responsable actual" value={booking.handledByRole ?? 'No asignado'} icon={<Clock className="h-4 w-4 text-slate-400" />} />
              <InfoRow label="Lugar de actuación" value={`${venueName}${venueCity ? `, ${venueCity}` : ''}`} icon={<MapPin className="h-4 w-4 text-slate-400" />} />
              <InfoRow label="Caché pactado" value={formatCurrency(bookingAmount, bookingCurrency)} icon={<CreditCard className="h-4 w-4 text-slate-400" />} />
            </div>

            {(counterpartyHref || promoterId) && (
              <div className="flex flex-wrap gap-4 pt-2">
                {counterpartyHref && (
                  <Link href={counterpartyHref} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm">
                    {counterpartyLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {promoterId && role !== 'PROMOTER' && (
                  <Link href={`/promoter/profile/${promoterId}`} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm">
                    Ver perfil de promotor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </Card>

          <Card title="Condiciones en negociación" subtitle="Servicios incluidos y exclusiones" icon={<CreditCard className="h-4 w-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-slate-50 pb-8">
              <InfoRow label="Oferta inicial" value={formatCurrency(bookingData.conditions.originalPrice, bookingData.conditions.currency)} muted strike />
              <InfoRow label="Valor actual" value={formatCurrency(bookingData.conditions.currentOffer, bookingData.conditions.currency)} strong />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                   <div className="h-1 w-4 bg-emerald-500 rounded-full" />
                   Incluido en el fee
                </p>
                <ul className="space-y-3">
                  {bookingData.conditions.includes.map((item) => (
                    <li key={item} className="text-[13px] text-slate-600 flex items-center gap-3 font-medium">
                      <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <div className="h-1 w-4 bg-slate-200 rounded-full" />
                   Fuera del acuerdo
                </p>
                <ul className="space-y-3">
                  {bookingData.conditions.excludes.map((item) => (
                    <li key={item} className="text-[13px] text-slate-500 flex items-center gap-3 font-medium">
                      <div className="h-5 w-5 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                        <XCircle className="h-3 w-3" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card title="Historial operativo" subtitle="Trazabilidad de la negociación" icon={<MessageSquare className="h-4 w-4" />}>
            {negotiationLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-slate-400 animate-pulse">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Recuperando histórico...</span>
              </div>
            ) : timelineEvents.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-sm text-slate-400 font-medium">Sin actividad de negociación registrada.</p>
                {statusMessage && <p className="text-slate-900 font-bold mt-2">{statusMessage}</p>}
              </div>
            ) : (
              <div className="relative pt-4">
                <div className="absolute left-[19px] top-6 bottom-6 w-px bg-slate-100" />
                <div className="space-y-8">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="relative flex items-start gap-6 group" style={{ animationDelay: `${index * 40}ms` }}>
                      <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${getTimelineColor(event)}`}>
                        {getTimelineIcon(event)}
                      </div>
                      <div className="flex-1 min-w-0 bg-white group-hover:bg-slate-50/50 p-4 rounded-2xl transition-all border border-transparent group-hover:border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-slate-900">
                            {event.isFinal ? 'Oferta final' : event.amount ? 'Propuesta económica' : 'Comunicación'}
                          </p>
                          {typeof event.amount === 'number' && (
                            <p className="text-lg font-black text-slate-900 tabular-nums">{formatCurrency(event.amount, bookingCurrency)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{event.role}</span>
                          <span className="text-slate-200">·</span>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{formatShortDate(event.createdAt)} · {formatShortTime(event.createdAt)}</p>
                        </div>
                        {event.note && (
                          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 mt-3">
                            <p className="text-[13px] text-slate-700 leading-relaxed font-medium">"{event.note}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="Consola de acciones" subtitle="Foco y respuesta rápida" icon={<AlertTriangle className="h-4 w-4" />} tone={hasTurn ? 'amber' : 'slate'}>
            <div className={`p-6 rounded-2xl border ${hasTurn ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${hasTurn ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                   <Clock className="h-4 w-4" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">{actionTurnMessage}</p>
              </div>
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
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card title="Documentación" subtitle="Contrato oficial" icon={<FileText className="h-4 w-4 text-slate-400" />}>
             <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Estado contractual</p>
                  <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">
                    {hasContract ? contract?.status : 'PENDIENTE'}
                  </p>
                </div>
              </div>

              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                {hasContract
                  ? `El contrato se encuentra en estado ${contract?.status?.toLowerCase()}.`
                  : 'El contrato digital se generará automáticamente tras el acuerdo económico.'}
              </p>

              {canSignContract && (
                <Button
                  onClick={() => setShowSignContractModal(true)}
                  variant="default"
                  className="w-full h-11 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                  Firmar documento digital
                </Button>
              )}
            </div>
          </Card>

          <Card title="Metadatos" subtitle="Auditoría de sistema" icon={<HandCoins className="h-4 w-4 text-slate-400" />}>
            <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <InfoRow label="Identificador de booking" value={booking.id} />
              <div className="h-px bg-slate-200/50" />
              <InfoRow label="Registro de actividad" value={lastActivity ? formatDateTime(lastActivity) : '—'} />
            </div>
          </Card>
        </div>
      </section>

      {canCancelBooking && (
        <CancelBookingModal
          open={showCancelModal}
          title="Cancelar booking"
          confirmLabel="Ejecutar cancelación"
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
        title="Confirmación de firma"
        confirmLabel="Confirmar firma digital"
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
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-slate-900 text-white shadow-sm'}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight uppercase leading-none">{title}</h2>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">{subtitle}</p>}
        </div>
      </header>
      <div className="pt-2">
        {children}
      </div>
    </section>
  );
}

function KpiCard({ label, value, helper, tone = 'slate' }: { label: string; value: string | number; helper?: string; tone?: 'slate' | 'emerald' | 'amber' }) {
  const valueColor = tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-900';

  return (
    <div className="px-8 py-6 flex flex-col gap-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-xl font-black tabular-nums ${valueColor}`}>{value}</p>
      {helper && <p className="text-[11px] font-bold text-slate-400 leading-none">{helper}</p>}
    </div>
  );
}

function InfoRow({ label, value, icon, muted = false, strong = false, strike = false }: { label: string; value: string | number; icon?: ReactNode; muted?: boolean; strong?: boolean; strike?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-1">{icon}</div>}
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">{label}</p>
        <p className={`leading-tight ${muted ? 'text-slate-400' : 'text-slate-900'} ${strong ? 'text-2xl font-black' : 'text-[14px] font-bold'} ${strike ? 'line-through decoration-slate-300' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

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
    <div className="space-y-4">
      <PaymentElement />
      {error && <p className="text-[13px] font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
      <Button onClick={handlePay} disabled={loading} className="w-full h-12 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10">
        {loading ? 'Procesando pago seguro...' : 'Confirmar pago ahora'}
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
  if (minutes < 60) return `hace ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;

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
  if (typeof event.amount === 'number') return 'bg-slate-900 text-white';
  return 'bg-slate-100 text-slate-500';
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

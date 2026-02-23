import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Clock, CreditCard, FileText, AlertTriangle, MessageSquare, HandCoins, CheckCircle2, XCircle, Music2, Flag, Ban, Download, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

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
import { downloadContractPdf, signContract } from '@/services/contracts/contracts.service';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

import { getStatusMessage } from '@/components/bookings/booking-ui.helpers';
import {
  isArtistSideRole,
  isMyTurnByLastMessage,
  isArtistSideOwnerLocked,
} from '@/components/bookings/booking-turns';

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
  const [showConditions, setShowConditions] = useState(false);
  const [eventName, setEventName] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<{
    paidAmount: number;
    totalAmount: number;
    percent: number;
    lastPaidAt?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!booking?.eventId || !user?.token) {
      setEventName(null);
      return;
    }

    eventsService
      .getEvent(booking.eventId, user.token)
      .then((event) => {
        setEventName(event.name ?? null);
      })
      .catch(() => {
        setEventName(null);
      });
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

        const paidAtCandidates = (milestones ?? [])
          .filter((m: any) => {
            const status = m?.props?.status ?? m?.status;
            return status === 'PAID' || status === 'FINALIZED';
          })
          .map((m: any) => m?.props?.paidAt ?? m?.paidAt ?? m?.props?.resolvedAt ?? m?.resolvedAt)
          .filter(Boolean)
          .map((value: any) => new Date(value).getTime());

        const lastPaidAt =
          paidAtCandidates.length > 0
            ? new Date(Math.max(...paidAtCandidates)).toISOString()
            : null;

        const totalAmount = booking.totalAmount ?? 0;
        const percent =
          totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

        setPaymentSummary({
          paidAmount,
          totalAmount,
          percent,
          lastPaidAt,
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
  const resolvedEventName = eventName ?? (booking as any).eventName ?? null;

  // Turno: si hay handler asignado a otra parte, no es tu turno; si no, se decide por últimos mensajes
  const lastNegotiation = negotiationMessages.length > 0 ? negotiationMessages[negotiationMessages.length - 1] : null;
  const lastSenderRole = lastNegotiation?.senderRole as Role | undefined;
  const lastFinalOffer = [...negotiationMessages].reverse().find((m) => m.isFinalOffer);
  const lastFinalOfferSenderRole = lastFinalOffer?.senderRole as Role | undefined;
  const isArtistSide = isArtistSideRole(role);
  const isMyTurnByMessages = isMyTurnByLastMessage({
    lastSenderRole,
    currentRole: role,
  });
  const isOwnerLocked = isArtistSideOwnerLocked({
    currentRole: role,
    currentUserId: user?.id,
    ownerRole: booking.handledByRole,
    ownerUserId: booking.handledByUserId,
  });

  const hasTurn = isOwnerLocked
    ? false
    : booking.status === 'PENDING'
      ? isArtistSide
      : isMyTurnByMessages;

  const statusMessage = getStatusMessage({
    bookingStatus: booking.status,
    contractStatus: contract?.status,
    role: role as Role,
    hasTurn,
    lastFinalOfferSenderRole,
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

  const actionTurnMessage =
    booking.status === 'REJECTED'
      ? 'La propuesta fue rechazada.'
      : booking.status === 'CANCELLED_PENDING_REVIEW'
        ? 'La contratación ha sido cancelada y se encuentra bajo revisión por el equipo de Artime para procesar la resolución.'
        : booking.status === 'CANCELLED'
          ? 'La contratación ha sido cancelada.'
          : booking.status === 'CONTRACT_SIGNED'
            ? 'Contrato firmado. Pendiente de pagos.'
            : booking.status === 'PAID_PARTIAL'
              ? 'Pagos en curso. Pendiente de completar el importe.'
              : booking.status === 'PAID_FULL' || booking.status === 'COMPLETED'
                ? 'Contratación finalizada. El booking está cerrado y los pagos se han completado con éxito.'
                : booking.status === 'ACCEPTED'
                  ? 'Contratación aceptada. Pendiente de firma de contrato.'
                  : booking.status === 'FINAL_OFFER_SENT'
                    ? hasTurn
                      ? 'Tienes una oferta final pendiente de aceptar o rechazar.'
                      : handledByLabel
                        ? `Turno de ${handledByLabel} para aceptar o rechazar la oferta final.`
                        : 'La otra parte debe aceptar o rechazar la oferta final.'
                    : hasTurn
                      ? 'Es tu turno para responder o cancelar la propuesta.'
                      : handledByLabel
                        ? `Turno de ${handledByLabel}.`
                        : 'La otra parte está gestionando este booking.';

  const turnLabel =
    booking.status === 'REJECTED' ||
      booking.status === 'CANCELLED' ||
      booking.status === 'CANCELLED_PENDING_REVIEW' ||
      booking.status === 'ACCEPTED' ||
      booking.status === 'CONTRACT_SIGNED' ||
      booking.status === 'PAID_PARTIAL' ||
      booking.status === 'PAID_FULL' ||
      booking.status === 'COMPLETED'
      ? '—'
      : hasTurn
        ? 'Tu turno'
        : 'En espera';

  const hasContract = Boolean(contract);
  const canDownloadContract = contract?.status === 'SIGNED';
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

  const lastActivityCandidates = [
    lastNegotiation?.createdAt,
    contract?.signedAt,
    paymentSummary?.lastPaidAt,
    booking.handledAt,
    (booking as any).updatedAt,
    (booking as any).createdAt,
  ]
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime());

  const lastActivity =
    lastActivityCandidates.length > 0
      ? new Date(Math.max(...lastActivityCandidates))
      : null;
  const bookingAmount = (booking as any).totalAmount ?? (booking as any).amount ?? null;
  const bookingCurrency = (booking as any).currency ?? 'EUR';
  const eventDate = booking.start_date ?? (booking as any).startDate ?? null;
  const timelineEvents = negotiationMessages
    .map((m) => ({
      id: m.id,
      createdAt: m.createdAt,
      role: m.senderRole,
      amount: m.proposedFee,
      allIn: m.allIn ?? false,
      isFinal: m.isFinalOffer,
      note: m.message,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const hasArtistResponse = timelineEvents.some((event) => event.role === 'ARTIST');
  const firstVenueOffer = timelineEvents.find(
    (event) => event.role === 'VENUE' && typeof event.amount === 'number'
  );
  const lastNumericOffer = [...negotiationMessages]
    .reverse()
    .find((m) => typeof m.proposedFee === 'number');
  const agreedAmount =
    typeof lastNumericOffer?.proposedFee === 'number'
      ? lastNumericOffer.proposedFee
      : bookingAmount;
  const agreedAllIn =
    typeof lastNumericOffer?.allIn === 'boolean'
      ? lastNumericOffer.allIn
      : booking.allIn;
  const amountSubLabel = agreedAllIn ? 'Importe + gastos' : 'Importe base';

  const bookingData = {
    conditions: {
      originalPrice: firstVenueOffer?.amount ?? null,
      currentOffer: agreedAmount ?? null,
      currency: bookingCurrency,
      includes: ['Alojamiento', 'Backline básico', 'Cena para el artista'],
      excludes: ['Transporte', 'Sonido PA'],
    },
  };



  const headerTargetName = resolvedEventName ?? venueName;
  const headerTargetMeta = resolvedEventName ? null : venueCity;
  const headerSecondaryMeta = eventName
    ? `${promoterId ? 'Promotor' : 'Sala'}`
    : null;

  const isArtistSideViewer = role === 'ARTIST' || role === 'MANAGER';
  const counterpartyHref = isArtistSideViewer
    ? (venueId ? `/venues/profile/${venueId}` : null)
    : (artistId ? `/artists/profile/${artistId}` : null);
  const counterpartyLabel = isArtistSideViewer ? 'Ver sala' : 'Ver artista';


  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ── TOP NAVIGATION ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Volver a bookings
        </Link>
      </div>

      {/* ── BOOKING HERO ────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-fintech-dark rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-15" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-8">

          {/* Artista → Sala / Estado */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-white/50 font-semibold uppercase tracking-widest">Contratación</p>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{artistName ?? 'Artista'}</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/60 text-sm ml-[52px]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {venueName}{venueCity ? ` · ${venueCity}` : ''}
                </span>
                {eventDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(eventDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {/* Status badge + última actividad */}
            <div className="flex flex-col items-start sm:items-end gap-2 ml-[52px] sm:ml-0">
              <HeroStatusBadge status={booking.status} />
              {lastActivity && (
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatRelativeTime(lastActivity)}
                </span>
              )}
            </div>
          </div>

          {/* KPI Pills — 3 métricas sin redundar el status */}
          <div className="grid grid-cols-3 gap-3">
          <KpiPill
            label="Importe"
            value={formatCurrency(agreedAmount, bookingCurrency)}
            subLabel={amountSubLabel}
          />
            <KpiPill
              label="Pago"
              value={paymentSummary ? (paymentSummary.percent >= 100 ? '100%' : `${paymentSummary.percent}%`) : '—'}
            />
            <KpiPill label="Turno" value={turnLabel} accent={hasTurn && !['REJECTED', 'CANCELLED', 'CANCELLED_PENDING_REVIEW', 'ACCEPTED', 'CONTRACT_SIGNED', 'PAID_PARTIAL', 'PAID_FULL', 'COMPLETED'].includes(booking.status)} />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna Principal ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Panel Acciones */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Acción requerida</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4">
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{actionTurnMessage}</p>
                </div>
                {booking.status === 'ACCEPTED' && canCancelBooking && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="h-11 w-full sm:w-auto px-5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-100 font-bold text-[11px] uppercase tracking-widest transition-all duration-300 text-center"
                  >
                    Cancelar booking
                  </button>
                )}
                {/* Pago Stripe — solo VENUE/PROMOTER con contrato firmado */}
                {contract?.status === 'SIGNED' && (role === 'VENUE' || role === 'PROMOTER') && !['PAID_FULL', 'COMPLETED', 'CANCELLED', 'CANCELLED_PENDING_REVIEW'].includes(booking.status) && (
                  <div className="space-y-3">
                    {!clientSecret && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setPaymentError(null);
                            setPaymentInfo(null);
                            const milestones = await getMilestonesForBooking(booking.id, user.token);
                            const pending = milestones.find((m: any) => m.props?.status === 'PENDING');
                            if (!pending) { setPaymentError('No hay milestones pendientes'); return; }
                            const result = await createPaymentIntentForMilestone(pending.props.id, user.token);
                            if (result.status === 'succeeded') {
                              setPaymentInfo('Pago confirmado en Stripe. Actualizando booking...');
                              await confirmPaymentForMilestone({ bookingId: booking.id, milestoneId: pending.props.id, token: user.token });
                              await refresh();
                              return;
                            }
                            if (result.status) setPaymentInfo(`Estado del PaymentIntent: ${result.status}`);
                            setMilestoneId(pending.props.id);
                            setClientSecret(result.clientSecret);
                          } catch (err) {
                            setPaymentError(err instanceof Error ? err.message : 'Error creando PaymentIntent');
                          }
                        }}
                        className="h-11 w-full sm:w-auto px-6 rounded-xl border border-amber-400 text-amber-700 hover:bg-amber-50 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 text-center"
                      >
                        <CreditCard className="w-4 h-4" /> Proceder al pago
                      </button>
                    )}
                    {clientSecret && milestoneId && (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <div className="w-full">
                          <SimpleCardPaymentForm
                            clientSecret={clientSecret}
                            bookingId={booking.id}
                            milestoneId={milestoneId}
                            token={user.token}
                            onSuccess={refresh}
                          />
                        </div>
                      </Elements>
                    )}
                    {paymentInfo && <p className="text-sm text-slate-600">{paymentInfo}</p>}
                    {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}
                  </div>
                )}
                <NegotiationPanel
                  bookingId={booking.id}
                  bookingStatus={booking.status}
                  userRole={role as any}
                  handledByRole={booking.handledByRole as any}
                  handledByUserId={booking.handledByUserId}
                  onBookingUpdated={refresh}
                  refreshContract={refreshContract}
                  onCancelBooking={() => { if (canCancelBooking) setShowCancelModal(true); }}
                />
              </div>
            </div>

            {/* Historial de Negociación en burbujas */}
            <NegotiationHistory
              timelineEvents={timelineEvents}
              role={role as string}
              bookingCurrency={bookingCurrency}
              negotiationLoading={negotiationLoading}
            />

            {/* Condiciones */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <button
                onClick={() => setShowConditions(!showConditions)}
                className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  <h2 className="font-bold text-slate-900 text-sm">Condiciones en negociación</h2>
                </div>
                {showConditions ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showConditions && (
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {bookingData.conditions.originalPrice !== null && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">Propuesta inicial</p>
                          <p className="text-xl font-black text-slate-400 line-through tabular-nums">
                            {formatCurrency(bookingData.conditions.originalPrice, bookingData.conditions.currency)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Incluido</p>
                        <ul className="space-y-1.5">
                          {bookingData.conditions.includes.map((item) => (
                            <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">No incluido</p>
                        <ul className="space-y-1.5">
                          {bookingData.conditions.excludes.map((item) => (
                            <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Links a contrapartes */}
                  {(counterpartyHref || promoterId) && (
                    <div className="pt-4 border-t border-slate-100 mt-4 flex flex-wrap gap-3">
                      {counterpartyHref && (
                        <Link href={counterpartyHref} className="text-xs font-bold text-slate-700 hover:text-brand-amber transition-colors flex items-center gap-1">
                          {counterpartyLabel} <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                      {promoterId && role !== 'PROMOTER' && (
                        <Link href={`/promoter/profile/${promoterId}`} className="text-xs font-bold text-slate-700 hover:text-brand-amber transition-colors flex items-center gap-1">
                          Ver promotor <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar mobile */}
            <div className="block lg:hidden space-y-6">
              <BookingSidebar
                booking={booking}
                contract={contract}
                hasContract={hasContract}
                canSignContract={canSignContract}
                canDownloadContract={canDownloadContract}
                paymentSummary={paymentSummary}
                bookingCurrency={bookingCurrency}
                eventDate={eventDate}
                venueName={venueName}
                venueCity={venueCity}
                counterpartyHref={counterpartyHref}
                counterpartyLabel={counterpartyLabel}
                promoterId={promoterId}
                role={role as string}
                setShowSignContractModal={setShowSignContractModal}
                user={user}
              />
            </div>
          </div>

          {/* ── Sidebar (desktop) ─────────────────────────────── */}
          <aside className="hidden lg:block space-y-6">
            <BookingSidebar
              booking={booking}
              contract={contract}
              hasContract={hasContract}
              canSignContract={canSignContract}
              canDownloadContract={canDownloadContract}
              paymentSummary={paymentSummary}
              bookingCurrency={bookingCurrency}
              eventDate={eventDate}
              venueName={venueName}
              venueCity={venueCity}
              counterpartyHref={counterpartyHref}
              counterpartyLabel={counterpartyLabel}
              promoterId={promoterId}
              role={role as string}
              setShowSignContractModal={setShowSignContractModal}
              user={user}
            />
          </aside>

        </div>
      </main>

      {/* ── Modales (sin cambios) ──────────────────────────── */}
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
    </div>
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

function KpiPill({ label, value, subLabel, accent = false }: { label: string; value: string | number; subLabel?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3 border ${accent
      ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
      : 'bg-white/5 border-white/10 text-white'
      }`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
      <p className={`text-base font-black tabular-nums ${accent ? 'text-amber-300' : 'text-white'}`}>{value}</p>
      {subLabel ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] mt-1 text-white/70">{subLabel}</p>
      ) : null}
    </div>
  );
}

function HeroStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; dot: string; border: string; text: string; pulse?: boolean }> = {
    PENDING: { label: 'Pendiente', dot: 'bg-amber-400', border: 'border-amber-400/40', text: 'text-amber-300', pulse: true },
    NEGOTIATING: { label: 'Negociando', dot: 'bg-amber-400', border: 'border-amber-400/40', text: 'text-amber-300', pulse: true },
    FINAL_OFFER_SENT: { label: 'Oferta Final', dot: 'bg-orange-400', border: 'border-orange-400/40', text: 'text-orange-300', pulse: true },
    ACCEPTED: { label: 'Aceptado', dot: 'bg-emerald-400', border: 'border-emerald-400/40', text: 'text-emerald-300' },
    REJECTED: { label: 'Rechazado', dot: 'bg-red-400', border: 'border-red-400/40', text: 'text-red-300' },
    CONTRACT_SIGNED: { label: 'Contrato Firmado', dot: 'bg-blue-400', border: 'border-blue-400/40', text: 'text-blue-300' },
    PAID_PARTIAL: { label: 'Pago Parcial', dot: 'bg-sky-400', border: 'border-sky-400/40', text: 'text-sky-300' },
    PAID_FULL: { label: 'Pagado', dot: 'bg-green-400', border: 'border-green-400/40', text: 'text-green-300' },
    COMPLETED: { label: 'Completado', dot: 'bg-green-400', border: 'border-green-400/40', text: 'text-green-300' },
    CANCELLED: { label: 'Cancelado', dot: 'bg-slate-400', border: 'border-slate-400/40', text: 'text-slate-300' },
    CANCELLED_PENDING_REVIEW: { label: 'Cancelación Revisión', dot: 'bg-slate-400', border: 'border-slate-400/40', text: 'text-slate-300' },
  };
  const c = config[status] ?? { label: status, dot: 'bg-slate-400', border: 'border-slate-400/40', text: 'text-slate-300' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white/10 backdrop-blur-sm text-xs font-bold uppercase tracking-wider ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
}

function NegotiationHistory({
  timelineEvents, role, bookingCurrency, negotiationLoading,
}: {
  timelineEvents: { id: string; role: string; amount?: number; allIn: boolean; isFinal: boolean; note?: string; createdAt: string }[];
  role: string; bookingCurrency: string; negotiationLoading: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const roleInitial: Record<string, string> = { VENUE: 'S', ARTIST: 'A', MANAGER: 'M', PROMOTER: 'P' };
  const roleLabel: Record<string, string> = { VENUE: 'Sala', ARTIST: 'Artista', MANAGER: 'Manager', PROMOTER: 'Promotor' };

  const visible = showAll ? timelineEvents : timelineEvents.slice(0, 1);
  const hidden = timelineEvents.length - 1;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900 text-sm">Historial de negociación</h2>
          {timelineEvents.length > 0 && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{timelineEvents.length} mensaje{timelineEvents.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {!showAll && hidden > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-amber-500 hover:text-amber-950 transition-all duration-300"
          >
            <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
            Ver {hidden} anterior{hidden !== 1 ? 'es' : ''}
          </button>
        )}
        {showAll && hidden > 0 && (
          <button
            onClick={() => setShowAll(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all duration-300"
          >
            <ChevronUp className="w-3 h-3" />
            Colapsar
          </button>
        )}
      </div>
      <div className="p-5">
        {negotiationLoading ? (
          <p className="text-sm text-slate-500">Cargando historial…</p>
        ) : timelineEvents.length === 0 ? (
          <p className="text-sm text-slate-500">Sin actividad de negociación todavía.</p>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-100/50">
            {visible.map((event) => {
              const isOwn = event.role === role;
              return (
                <div key={event.id} className={`flex gap-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar con Glow */}
                  <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 transition-transform duration-300 hover:scale-110 shadow-lg ${isOwn ? 'bg-amber-500 text-amber-950 ring-2 ring-amber-500/20' : 'bg-slate-200 text-slate-600 ring-2 ring-slate-200/20'}`}>
                    {roleInitial[event.role] ?? event.role[0]}
                    {event.isFinal && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 border-2 border-white rounded-full animate-bounce" />}
                  </div>

                  <div className={`w-full max-w-full sm:max-w-[72%] flex flex-col gap-2 ${isOwn ? 'items-end text-right' : 'items-start text-left'}`}>
                    {/* Header Burbuja */}
                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className={isOwn ? 'text-amber-600' : 'text-slate-600'}>{roleLabel[event.role] ?? event.role}</span>
                      <span className="opacity-30">·</span>
                      <span>{formatShortDate(event.createdAt)}</span>
                      {event.isFinal && (
                        <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                          <Flag className="w-2.5 h-2.5" /> FINAL
                        </span>
                      )}
                    </div>

                    {/* Burbuja Glass */}
                    <div className={`relative group rounded-3xl px-5 py-4 transition-all duration-300 break-words ${isOwn
                      ? 'bg-gradient-to-br from-amber-50/50 to-white/50 border border-amber-200/50 shadow-sm rounded-tr-sm hover:shadow-md'
                      : 'bg-white border border-slate-100 shadow-sm rounded-tl-sm hover:shadow-md'
                      }`}>
                      {typeof event.amount === 'number' && (
                        <div className="mb-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Oferta propuesta</p>
                          <p className={`text-3xl font-black tabular-nums tracking-tighter ${isOwn ? 'text-amber-600' : 'text-slate-900'}`}>
                            {formatCurrency(event.amount, bookingCurrency)}
                          </p>
                          <div className={`mt-1 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isOwn ? 'text-amber-700' : 'text-slate-600'}`}>
                            <span className={`px-2 py-0.5 rounded-lg border ${event.allIn ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                              {event.allIn ? 'All-in' : '+ gastos'}
                            </span>
                          </div>
                        </div>
                      )}
                      {event.note && (
                        <p className="text-sm leading-relaxed text-slate-600 italic">
                          "{event.note}"
                        </p>
                      )}

                      {/* Decoración Glass */}
                      <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingSidebar({
  booking, contract, hasContract, canSignContract, canDownloadContract,
  paymentSummary, bookingCurrency, eventDate, venueName, venueCity,
  counterpartyHref, counterpartyLabel, promoterId, role,
  setShowSignContractModal, user,
}: {
  booking: any; contract: any; hasContract: boolean;
  canSignContract: boolean; canDownloadContract: boolean;
  paymentSummary: { paidAmount: number; totalAmount: number; percent: number } | null;
  bookingCurrency: string; eventDate: string | null | undefined;
  venueName: string; venueCity: string | null;
  counterpartyHref: string | null; counterpartyLabel: string;
  promoterId: string | null; role: string;
  setShowSignContractModal: (v: boolean) => void;
  user: any;
}) {
  const [isEventOpen, setIsEventOpen] = useState(false);
  const contractStatusLabel = contract?.status === 'SIGNED' ? 'Firmado' : contract?.status === 'DRAFT' ? 'Borrador — Pendiente de firma' : 'Pendiente de generación';
  const paidPercent = paymentSummary?.percent ?? 0;

  return (
    <>
      {/* Card Contrato */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          <h2 className="font-bold text-slate-900 text-sm">Contrato</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${contract?.status === 'SIGNED' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <p className="text-sm text-slate-600">{hasContract ? contractStatusLabel : 'Aún no generado'}</p>
          </div>
          {canSignContract && (
            <button
              onClick={() => setShowSignContractModal(true)}
              className="w-full h-10 rounded-xl border border-amber-400 text-amber-700 hover:bg-amber-50 font-bold text-sm transition-all duration-200"
            >
              Firmar contrato
            </button>
          )}
          {canDownloadContract && (
            <button
              type="button"
              onClick={async () => { await downloadContractPdf(booking.id, user.token); }}
              className="w-full h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Descargar PDF
            </button>
          )}
        </div>
      </div>

      {/* Card Evento */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <button
          onClick={() => setIsEventOpen(!isEventOpen)}
          className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
          type="button"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-sm">Evento</h2>
          </div>
          {isEventOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {isEventOpen && (
          <div className="p-5 space-y-3">
            {eventDate && (
              <div>
                <p className="text-xs text-slate-500">Fecha del evento</p>
                <p className="font-bold text-slate-900 text-sm">
                  {new Date(eventDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500">Sala</p>
              <p className="font-bold text-slate-900 text-sm">{venueName}</p>
              {venueCity && <p className="text-xs text-slate-500">{venueCity}</p>}
            </div>
            {counterpartyHref && (
              <Link href={counterpartyHref} className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                {counterpartyLabel} <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Card Pagos */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-500" />
          <h2 className="font-bold text-slate-900 text-sm">Pagos</h2>
        </div>
        <div className="p-5">
          <div className="flex items-end justify-between mb-2">
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {formatCurrency(paymentSummary?.paidAmount ?? 0, bookingCurrency)}
            </p>
            <p className="text-sm text-slate-400 tabular-nums">
              de {formatCurrency(paymentSummary?.totalAmount ?? (booking?.totalAmount ?? 0), bookingCurrency)}
            </p>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(paidPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{paidPercent}% completado</span>
            {paidPercent < 100 && (
              <span className="text-amber-600 font-bold">
                Pendiente: {formatCurrency((paymentSummary?.totalAmount ?? 0) - (paymentSummary?.paidAmount ?? 0), bookingCurrency)}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
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

function formatRelativeTime(value?: string | Date | null) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
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

function formatBookingStatusLabel(status: string, currentRole?: string | null, finalOfferSenderRole?: string | null) {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    NEGOTIATING: 'En negociación',
    FINAL_OFFER_SENT: 'Oferta final enviada',
    FINAL_OFFER_ACCEPTED: 'Oferta final aceptada',
    FINAL_OFFER_REJECTED: 'Oferta final rechazada',
    ACCEPTED: 'Aceptado',
    CONTRACT_SENT: 'Contrato enviado',
    CONTRACT_SIGNED: 'Contrato firmado',
    PAID_PARTIAL: 'Pago parcial',
    PAID_FULL: 'Pago completo',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
    CANCELLED_PENDING_REVIEW: 'Cancelado (revisión)',
    REJECTED: 'Rechazado',
  };

  if (status === 'FINAL_OFFER_SENT') {
    return 'Oferta final';
  }

  return labels[status] ?? status;
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

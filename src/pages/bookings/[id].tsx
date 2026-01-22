import { NegotiationPanel } from "@/components/bookings/NegotiationPanel";
import { useContract } from '@/hooks/bookings/contracts/useContract';
import { useBooking } from "@/hooks/bookings/useBooking";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMe } from "@/hooks/auth/useMe";
import { UserRole } from "@/types/user-role";
import { useRouter } from "next/router";
import { useState } from "react";
import { signContract } from '@/services/contracts/contracts.service';
import { CancelBookingModal } from '@/components/bookings/CancelBookingModal';
import { cancelBooking } from "@/services/bookings/cancellations.service";
import { Role } from "@/types/booking";
import { withRole } from '@/components/auth/withRole';

import { confirmPaymentForMilestone } from "@/services/bookings/payments/confirmPayment.service";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import {
  createPaymentIntentForMilestone,
  getMilestonesForBooking,
} from "@/services/bookings/payments/payments.service.";

import {
  getPrimaryAction,
  getSecondaryActions,
  getStatusMessage,
} from "@/components/bookings/booking-ui.helpers";

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

  const { contract, refresh: refreshContract } = useContract(bookingId);

  const [showCancelModal, setShowCancelModal] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [conditionsAccepted, setConditionsAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

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

  // Si lo maneja la otra parte, no es tu turno
  const hasTurn = !isHandledByOther;

  const statusMessage = getStatusMessage({
    bookingStatus: booking.status,
    contractStatus: contract?.status,
    role: role as Role,
    hasTurn,
  });

  const primaryAction = getPrimaryAction({
    bookingStatus: booking.status,
    contractStatus: contract?.status,
    role: role as Role,
    hasTurn,
  });

  const secondaryActions = getSecondaryActions({
    bookingStatus: booking.status,
    contractStatus: contract?.status,
    role: role as Role,
    hasTurn,
  });

  const hasContract = Boolean(contract);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      {/* HEADER */}
      <header style={{ marginBottom: 32 }}>
        <h1>Booking</h1>
        <p>Relación contractual y estado operativo vigente.</p>
      </header>

      {/* 1️⃣ ESTADO CONTRACTUAL */}
      <section style={{ border: '1px solid #ddd', padding: 16, marginBottom: 24 }}>
        <p><strong>Estado del booking:</strong> {booking.status}</p>
        {statusMessage && <p>{statusMessage}</p>}
      </section>

      {/* 2️⃣ ACCIONES PERMITIDAS */}
      {(primaryAction || secondaryActions.length > 0) && (
        <section style={{ marginBottom: 32 }}>
          {primaryAction?.type === 'SIGN_CONTRACT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                disabled={signing}
                onClick={async () => {
                  if (!contract?.id) {
                    setSignError('No hay contrato generado todavía');
                    return;
                  }
                  if (!user?.token) return;
                  setSigning(true);
                  setSignError(null);
                  try {
                    await signContract(contract.id, user.token);
                    await Promise.all([refresh(), refreshContract()]);
                  } catch (err: any) {
                    setSignError(err?.message || 'No se pudo firmar el contrato');
                  } finally {
                    setSigning(false);
                  }
                }}
              >
                {signing ? 'Firmando…' : 'Firmar contrato'}
              </button>
              {signError && <p style={{ color: 'red', margin: 0 }}>{signError}</p>}
            </div>
          )}

          {secondaryActions.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {secondaryActions
                .filter(Boolean)
                .map(action => {
                  switch (action!.type) {
                    case 'CANCEL_BOOKING':
                      return (
                        <button
                          key="cancel"
                          onClick={() => setShowCancelModal(true)}
                        >
                          Cancelar booking
                        </button>
                      );
                    default:
                      return null;
                  }
                })}
            </div>
          )}
        </section>
      )}

      {/* 3️⃣ VÍNCULO CONTRACTUAL */}
      <section style={{ border: '1px solid #ddd', padding: 16, marginBottom: 32 }}>
        <p><strong>ID:</strong> {booking.id}</p>
        <p><strong>Fecha:</strong> {booking.start_date}</p>
        <p><strong>Importe:</strong> {booking.totalAmount} €</p>
        {contract && (
          <p><strong>Contrato:</strong> {contract.status}</p>
        )}
      </section>

      {/* 4️⃣ PAGO */}
      {booking.status === 'CONTRACT_SIGNED' &&
        (role === 'VENUE' || role === 'PROMOTER') && (
          <section style={{ border: '1px solid #ddd', padding: 16, marginBottom: 32 }}>
            <h2>Pago</h2>

            {!clientSecret && (
              <button
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
              </button>
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

            {paymentError && <p>{paymentError}</p>}
          </section>
        )}

      {/* 5️⃣ NEGOCIACIÓN */}
      {!hasContract && (
        <NegotiationPanel
          bookingId={booking.id}
          isHandledByOther={isHandledByOther}
          bookingStatus={booking.status}
          userRole={role as UserRole}
          onBookingUpdated={refresh}
          refreshContract={refreshContract}
        />
      )}

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
    <div style={{ marginTop: 16 }}>
      <PaymentElement />
      {error && <p>{error}</p>}
      <button onClick={handlePay} disabled={loading}>
        {loading ? 'Procesando…' : 'Pagar'}
      </button>
    </div>
  );
}

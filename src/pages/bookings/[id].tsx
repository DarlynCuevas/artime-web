import { NegotiationPanel } from "@/components/bookings/NegotiationPanel";
import { useContract } from '@/hooks/bookings/contracts/useContract';
import { useBooking } from "@/hooks/bookings/useBooking";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user-role";
import { useRouter } from "next/router";
import { useState } from "react";
import { acceptBooking } from '@/services/bookings/bookings.service';
import { signContract } from '@/services/contracts/contracts.service';
import { CancelBookingModal } from '@/components/bookings/CancelBookingModal';
import { cancelBooking } from "@/services/bookings/cancellations.service";
import { BookingStatus, Role } from "@/types/booking";


import { confirmPaymentForMilestone } from "@/services/bookings/payments/confirmPayment.service";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { createPaymentIntentForMilestone, getMilestonesForBooking } from "@/services/bookings/payments/payments.service.";
import { getPrimaryAction, getSecondaryActions, getStatusMessage } from "@/components/bookings/booking-ui.helpers";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const bookingId = typeof id === 'string' ? id : undefined;

  const {
    booking,
    loading,
    isHandledByOther,
    refresh,
  } = useBooking(bookingId);

  const { contract, refresh: refreshContract } = useContract(bookingId);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [conditionsAccepted, setConditionsAccepted] = useState(false);



  if (loading) return <p style={{ padding: 24 }}>Cargando contratación…</p>;
  if (!booking) return <p>No se pudo cargar la contratación.</p>;
  const hasTurn = isHandledByOther;
  const statusMessage = getStatusMessage({
    bookingStatus: booking.status,
    contractStatus: contract?.status,
    role: user.role as Role,
    hasTurn,
  });

  const primaryAction = getPrimaryAction({
    bookingStatus: booking.status,
    contractStatus: contract?.status,
    role: user.role as Role,
    hasTurn,
  });

  const secondaryActions = getSecondaryActions({
    bookingStatus: booking.status,
    contractStatus: contract?.status,
    role: user.role as Role,
    hasTurn: isHandledByOther
  });

  const hasContract = Boolean(contract);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 32 }}>
        <h1>Contratación</h1>
        <p>Estado actual de la actuación y negociación asociada.</p>
      </header>

      {/* DATOS BOOKING */}
      <section style={{ border: '1px solid #ddd', padding: 16, marginBottom: 32 }}>
        <p><strong>ID:</strong> {booking.id}</p>
        <p><strong>Fecha:</strong> {booking.start_date}</p>
        <p><strong>Importe:</strong> {booking.totalAmount} €</p>
        <p><strong>Estado:</strong> {booking.status}</p>
      </section>

      <section style={{ marginTop: 32 }}>
        {/* Mensaje de estado */}
        {statusMessage && (
          <p style={{ marginBottom: 12 }}>
            {statusMessage}
          </p>
        )}

        {/* Acción principal */}
        {primaryAction && (
          <div style={{ marginBottom: 12 }}>
            {primaryAction.type === 'SIGN_CONTRACT' && (
              <button>Firmar contrato</button>
            )}
          </div>
        )}

        {/* Acciones secundarias → AQUÍ va lo que preguntas */}
        {secondaryActions.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {secondaryActions
              .filter((action): action is NonNullable<typeof action> => action !== null)
              .map(action => {
                switch (action.type) {
                  case 'REJECT_PROPOSAL':
                    return (
                      <button key="reject">
                        Rechazar propuesta
                      </button>
                    );

                  case 'CANCEL_BOOKING':
                    return (
                      <button
                        key="cancel"
                        onClick={() => setShowCancelModal(true)}
                      >
                        Cancelar booking
                      </button>
                    );

                  case 'ANNUL_CONTRACT':
                    return (
                      <button key="annul">
                        Anular contrato
                      </button>
                    );

                  default:
                    return null;
                }
              })}
          </div>
        )}
      </section>


      {/* NEGOCIACIÓN */}
      {!hasContract && (
        <NegotiationPanel
          bookingId={booking.id}
          isHandledByOther={isHandledByOther}
          bookingStatus={booking.status}
          userRole={user?.role as UserRole}
          onBookingUpdated={refresh}
          refreshContract={refreshContract}
        />
      )}

      {/* FIRMAR CONTRATO / ESPERA FIRMA */}
      {booking.status === 'ACCEPTED' && contract?.status === 'DRAFT' && (
        <>
          {(user.role === 'ARTIST' || user.role === 'MANAGER') && (
            <>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={conditionsAccepted}
                  onChange={(e) => setConditionsAccepted(e.target.checked)}
                />
                Acepto las{' '}
                <a href="/legal/conditions" target="_blank" rel="noopener noreferrer">
                  condiciones generales de ARTIME
                </a>
              </label>
              <div>
                <button
                  disabled={isSigning || !conditionsAccepted}
                  onClick={async () => {
                    setIsSigning(true);
                    await signContract(contract.id, user.token);
                    await refresh();
                    await refreshContract();
                    setIsSigning(false);
                  }}
                >
                  Firmar contrato
                </button>
              </div>
            </>
          )}
        </>
      )}


      {/* PAGO */}
      {booking.status === 'CONTRACT_SIGNED' &&
        (user?.role === 'VENUE' || user?.role === 'PROMOTER') && (
          <section style={{ marginTop: 32, border: '1px solid #ddd', padding: 16 }}>
            <h2>Pago de la actuación</h2>

            {!clientSecret && (
              <button
                onClick={async () => {
                  try {
                    const milestones = await getMilestonesForBooking(
                      booking.id,
                      user.token
                    );

                    const pending = milestones.find(
                      (m: any) => m.props?.status === 'PENDING'
                    );
                    console.log('Milestone pendiente:', pending);

                    if (!pending) {
                      setPaymentError('No hay milestones pendientes');
                      return;
                    }

                    const milestoneId = pending.props?.id;
                    const result = await createPaymentIntentForMilestone(
                      milestoneId,
                      user.token
                    );
                    const { clientSecret } = result;

                    setMilestoneId(pending.props.id);
                    setClientSecret(clientSecret);
                  } catch (e) {
                    setPaymentError('No se pudo preparar el pago');
                    console.error('Error en el flujo de pago:', e);
                  }
                }}
              >
                Proceder al pago
              </button>
            )}

            {(() => {
              if (clientSecret && milestoneId) {
                return (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SimpleCardPaymentForm
                      clientSecret={clientSecret}
                      bookingId={booking.id}
                      milestoneId={milestoneId}
                      token={user.token}
                      onSuccess={async () => {
                        await refresh();
                      }}
                    />
                  </Elements>
                );
              }
              return null;
            })()}

            {paymentError && <p>{paymentError}</p>}
          </section>
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
            initiator: user.role as any,
          });
          await refresh();
        }}
      />
    </main>
  );
}

/* =========================
   FORMULARIO STRIPE LIMPIO
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

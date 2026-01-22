import { useState } from 'react';
import { useNegotiation } from '@/hooks/bookings/useNegotiation';
import type { UserRole } from '@/types/user-role';
import { useAuth } from '@/hooks/auth/useAuth';
import { acceptFinalOffer } from '@/services/bookings/negotiations.service';
import { acceptBooking } from '@/services/bookings/bookings.service';

type Props = {
  bookingId: string;
  isHandledByOther: boolean;
  bookingStatus: string;
  userRole: UserRole;
  onBookingUpdated: () => void;
  refreshContract: () => void;
};

export function NegotiationPanel({
  bookingId,
  isHandledByOther,
  userRole,
  bookingStatus,
  onBookingUpdated,
  refreshContract,
}: Props) {
  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    sendOfferFinal,
    reject,
  } = useNegotiation(bookingId);

  const { user } = useAuth();

  const [text, setText] = useState('');
  const [fee, setFee] = useState<number | ''>('');
  const [isFinalOffer, setIsFinalOffer] = useState(false);

  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  const isArtistSide =
    userRole === 'ARTIST' || userRole === 'MANAGER';

  const isVenueSide =
    userRole === 'VENUE' || userRole === 'PROMOTER';

  // Si lo maneja la otra parte, no es tu turno
  const isMyTurn =
    !isHandledByOther && (!lastMessage || lastMessage.senderUserId !== user?.id);

  const canWrite =
    ['PENDING', 'NEGOTIATING'].includes(bookingStatus) &&
    isMyTurn &&
    !(bookingStatus === 'PENDING' && isVenueSide);

  const parsedFee = Number(fee);
  const needsFee =
    !fee || isNaN(parsedFee) || parsedFee <= 0;

  const canMarkAsFinalOffer =
    isMyTurn &&
    (
      (isArtistSide &&
        ['PENDING', 'NEGOTIATING'].includes(bookingStatus)) ||
      (isVenueSide && bookingStatus === 'NEGOTIATING')
    );

  const canAcceptOrReject =
    ['PENDING', 'NEGOTIATING', 'FINAL_OFFER_SENT'].includes(bookingStatus) &&
    isMyTurn &&
    !(bookingStatus === 'PENDING' && isVenueSide);

  return (
    <section style={{ marginTop: 32 }}>
      <h2>Negociación</h2>

      {/* 1️⃣ ESTADO DE NEGOCIACIÓN */}
      <section style={{ marginBottom: 16 }}>
        {loading && <p>Cargando negociación…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!canWrite && !canAcceptOrReject && (
          <p style={{ color: '#666' }}>
            La negociación está pendiente de acción de la otra
            parte.
          </p>
        )}
      </section>

      {/* 2️⃣ HISTORIAL TRAZABLE */}
      <section
        style={{
          border: '1px solid #ddd',
          padding: 12,
          marginBottom: 24,
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: '#666' }}>
            No existen propuestas registradas.
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 16 }}>
            <div>
              <strong>{msg.senderRole}</strong>
              {typeof msg.proposedFee === 'number' && (
                <strong> — {msg.proposedFee} €</strong>
              )}
              {msg.isFinalOffer && (
                <span style={{ marginLeft: 8 }}>
                  (OFERTA FINAL)
                </span>
              )}
            </div>

            {msg.message && (
              <div style={{ marginTop: 4 }}>
                {msg.message}
              </div>
            )}

            <small style={{ color: '#999' }}>
              {new Date(msg.createdAt).toLocaleString()}
            </small>
          </div>
        ))}
      </section>

      {/* 3️⃣ ENVÍO DE PROPUESTA */}
      {canWrite && (
        <section style={{ marginBottom: 24 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            placeholder="Mensaje opcional"
            style={{
              width: '100%',
              minHeight: 80,
              marginBottom: 8,
            }}
          />

          <input
            type="number"
            placeholder="Importe (€)"
            value={fee}
            onChange={(e) =>
              setFee(e.target.value ? Number(e.target.value) : '')
            }
            style={{ width: '100%', marginBottom: 4 }}
          />

          {needsFee && (
            <p style={{ color: '#b00020', fontSize: 13 }}>
              Es necesario indicar un importe válido.
            </p>
          )}

          {canMarkAsFinalOffer && (
            <label style={{ display: 'block', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={isFinalOffer}
                onChange={(e) => setIsFinalOffer(e.target.checked)}
              />{' '}
              Marcar como oferta final
            </label>
          )}

          <button
            type="button"
            disabled={sending || needsFee}
            onClick={async () => {
              if (needsFee) return;

              if (isFinalOffer) {
                await sendOfferFinal({
                  proposedFee: parsedFee,
                  message: text || '',
                });
              } else {
                await sendMessage({
                  message: text || '',
                  proposedFee: parsedFee,
                });
              }

              setText('');
              setFee('');
              setIsFinalOffer(false);
            }}
          >
            Enviar propuesta
          </button>
        </section>
      )}

      {/* 4️⃣ DECISIÓN CONTRACTUAL */}
      {canAcceptOrReject && (
        <section>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled={sending}
              onClick={async () => {
                if (bookingStatus === 'FINAL_OFFER_SENT') {
                  await acceptFinalOffer(bookingId, user?.token);
                } else if (bookingStatus === 'PENDING') {
                  await acceptBooking(bookingId, user?.token);
                }

                onBookingUpdated();
                refreshContract();
              }}
            >
              Aceptar
            </button>

            <button
              type="button"
              disabled={sending}
              onClick={async () => {
                await reject(bookingStatus);
                onBookingUpdated();
              }}
            >
              Rechazar
            </button>
          </div>
        </section>
      )}
    </section>
  );
}

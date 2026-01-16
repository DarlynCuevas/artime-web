import { useState } from 'react';
import { useNegotiation } from '@/hooks/bookings/useNegotiation';
import type { UserRole } from '@/types/user-role';
import { useAuth } from '@/hooks/useAuth';
type Props = {
  bookingId: string;
  isHandledByOther: boolean;
  bookingStatus: string;
  userRole: UserRole;
  onBookingUpdated: () => void;
};

export function NegotiationPanel({
  bookingId,
  isHandledByOther,
  userRole,
  bookingStatus,
  onBookingUpdated,
}: Props) {
  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    sendOfferFinal,
    accept,
    reject,
  } = useNegotiation(bookingId);

  const { user } = useAuth();
  const [text, setText] = useState('');
  const [fee, setFee] = useState<number | ''>('');

  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  const isArtistSide =
    userRole === 'ARTIST' || userRole === 'MANAGER';

  const isVenueSide =
    userRole === 'VENUE' || userRole === 'PROMOTER';

  //  Turno: la otra parte fue la última en actuar
  const isMyTurn =
    !lastMessage || lastMessage.senderUserId !== user?.id;

  // Caso especial: mensaje inicial automático del venue
  const isInitialPendingVenue =
    bookingStatus === 'PENDING' && isVenueSide;

  //  Puede escribir / negociar
  const canWrite =
    ['PENDING', 'NEGOTIATING'].includes(bookingStatus) &&
    isMyTurn &&
    !isInitialPendingVenue;

  //  Validación de importe para contraoferta
  const parsedFee = Number(fee);
  const needsFee =
    bookingStatus === 'NEGOTIATING' &&
    (!fee || isNaN(parsedFee) || parsedFee <= 0);

  //  Enviar oferta final
  const canSendFinalOffer =
    isMyTurn &&
    (
      (isArtistSide &&
        ['PENDING', 'NEGOTIATING'].includes(bookingStatus)) ||
      (isVenueSide && bookingStatus === 'NEGOTIATING')
    );

  //  Aceptar /  Rechazar booking u oferta
  const canAcceptOrReject =
    ['PENDING', 'NEGOTIATING', 'FINAL_OFFER_SENT'].includes(bookingStatus) &&
    isMyTurn &&
    !(
      bookingStatus === 'PENDING' &&
      isVenueSide
    );

  return (
    <section style={{ marginTop: 32 }}>
      <h2>Negociación</h2>

      {loading && <p>Cargando mensajes…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* HISTORIAL */}
      <div
        style={{
          border: '1px solid #ddd',
          padding: 12,
          marginBottom: 16,
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: '#666' }}>
            Aún no hay mensajes de negociación.
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 12 }}>
            <strong>{msg.senderRole}</strong>

            {typeof msg.proposedFee === 'number' && (
              <strong> — {msg.proposedFee} €</strong>
            )}

            {msg.isFinalOffer && (
              <span style={{ marginLeft: 8, color: 'red' }}>
                (OFERTA FINAL)
              </span>
            )}

            {msg.message && <div>{msg.message}</div>}

            <small style={{ color: '#999' }}>
              {new Date(msg.createdAt).toLocaleString()}
            </small>
          </div>
        ))}
      </div>

      {/* MENSAJE DE ESPERA */}
      {!canWrite && !canAcceptOrReject && (
        <p style={{ color: '#999' }}>
          Debes esperar a que la otra parte responda.
        </p>
      )}

      {/* ENVÍO CONTRAOFERTA / OFERTA FINAL */}
      {canWrite && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            placeholder="Mensaje opcional…"
            style={{ width: '100%', minHeight: 80, marginBottom: 8 }}
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
              Debes indicar un importe para enviar una contraoferta.
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {bookingStatus === 'NEGOTIATING' && (
              <button
                type="button"
                disabled={sending || needsFee}
                onClick={async () => {
                  if (needsFee) return;

                  await sendMessage({
                    message: text ?? '',
                    proposedFee: parsedFee,
                  });
                  setText('');
                  setFee('');
                }}
              >
                Enviar contraoferta
              </button>
            )}

            {canSendFinalOffer && (
              <button
                type="button"
                disabled={sending || !fee}
                style={{ background: '#000', color: '#fff' }}
                onClick={async () => {
                  await sendOfferFinal({
                    proposedFee: parsedFee,
                    message: text ?? '',
                  });
                  setText('');
                  setFee('');
                }}
              >
                Enviar oferta final
              </button>
            )}
          </div>
        </>
      )}

      {/* ACEPTAR / RECHAZAR */}
      {canAcceptOrReject && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            type="button"
            disabled={sending}
            onClick={async () => {
              await accept(bookingStatus);
              onBookingUpdated();
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
      )}
    </section>
  );
}

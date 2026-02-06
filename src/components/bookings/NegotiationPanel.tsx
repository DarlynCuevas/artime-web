import { useState } from 'react';
import { useNegotiation } from '@/hooks/bookings/useNegotiation';
import type { UserRole } from '@/types/user-role';
import { useAuth } from '@/hooks/auth/useAuth';
import { acceptFinalOffer } from '@/services/bookings/negotiations.service';
import { acceptBooking } from '@/services/bookings/bookings.service';
import { Send, Check, X, AlertCircle, Clock, Info } from 'lucide-react';

type Props = {
  bookingId: string;
  isHandledByOther: boolean;
  bookingStatus: string;
  userRole: UserRole;
  handledByRole?: UserRole | null;
  onBookingUpdated: () => void;
  refreshContract: () => void;
  onCancelBooking: () => void;
};

export function NegotiationPanel({
  bookingId,
  isHandledByOther,
  userRole,
  bookingStatus,
  handledByRole,
  onBookingUpdated,
  refreshContract,
  onCancelBooking,
}: Props) {
  const isClosed = [
    'PAID_PARTIAL',
    'PAID_FULL',
    'COMPLETED',
    'CANCELLED',
    'CANCELLED_PENDING_REVIEW',
  ].includes(bookingStatus);
  if (isClosed) {
    return null;
  }

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

  const lastSenderRole = lastMessage?.senderRole as UserRole | undefined;
  const isLastFromArtistSide =
    lastSenderRole === 'ARTIST' || lastSenderRole === 'MANAGER';
  const isLastFromVenueSide =
    lastSenderRole === 'VENUE' || lastSenderRole === 'PROMOTER';

  const isMyTurnByMessages =
    !lastSenderRole
      ? true
      : isArtistSide
        ? isLastFromVenueSide
        : isLastFromArtistSide;

  const handlerIsArtistSide = handledByRole === 'ARTIST' || handledByRole === 'MANAGER';
  const lockedToOther = handlerIsArtistSide && isArtistSide && handledByRole !== userRole;
  const isMyTurn = lockedToOther ? false : isMyTurnByMessages;

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
    <div className="space-y-6 pt-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1 w-6 bg-slate-900 rounded-full" />
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Módulo de Negociación</h2>
      </div>

      {/* 1️⃣ ESTADO DE NEGOCIACIÓN */}
      <section>
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 animate-pulse py-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Cargando estado...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 flex items-center gap-3 text-red-700 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-[12px] font-bold">{error}</p>
          </div>
        )}

        {!canWrite && !canAcceptOrReject && !loading && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
              La negociación está en curso. Actualmente no se requiere ninguna acción de tu parte; estamos esperando la respuesta de la otra parte.
            </p>
          </div>
        )}
      </section>

      {/* 3️⃣ ENVÍO DE PROPUESTA */}
      {canWrite && (
        <section className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Comentarios (Opcional)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
              placeholder="Ej: Ajuste de fee según rider técnico..."
              className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-white text-[13px] font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Importe de la propuesta (€)</label>
            <div className="relative group">
              <input
                type="number"
                placeholder="0.00"
                value={fee}
                onChange={(e) =>
                  setFee(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full h-12 pl-4 pr-12 rounded-xl border border-slate-200 bg-white text-[15px] font-bold tabular-nums outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
              />
              <div className="absolute right-4 inset-y-0 flex items-center text-slate-400 font-bold text-xs uppercase">
                EUR
              </div>
            </div>
            {needsFee && (
              <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1.5 ml-1">
                <AlertCircle className="h-3 w-3" />
                Indica un importe válido para continuar.
              </p>
            )}
          </div>

          {canMarkAsFinalOffer && (
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer group hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={isFinalOffer}
                onChange={(e) => setIsFinalOffer(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-slate-900">Marcar como oferta final</span>
                <span className="text-[11px] text-slate-400 font-medium">Esta acción bloqueará nuevas contraofertas simples.</span>
              </div>
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

              await onBookingUpdated();
              setText('');
              setFee('');
              setIsFinalOffer(false);
            }}
            className="w-full h-12 rounded-xl bg-slate-900 text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/10"
          >
            {sending ? 'Procesando envío...' : (
              <>
                <Send className="h-4 w-4" />
                Enviar propuesta operativa
              </>
            )}
          </button>
        </section>
      )}

      {/* 4️⃣ DECISIÓN CONTRACTUAL */}
      {canAcceptOrReject && (
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
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
              className="flex-1 h-12 rounded-xl bg-emerald-600 text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Aceptar acuerdo
            </button>

            <button
              type="button"
              disabled={sending}
              onClick={async () => {
                await reject(bookingStatus);
                onBookingUpdated();
              }}
              className="flex-1 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 text-[13px] font-bold flex items-center justify-center gap-2 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Rechazar
            </button>
          </div>
          <p className="text-[11px] text-center text-slate-400 font-medium italic pt-1">
            Al aceptar, se procederá con la generación del contrato digital.
          </p>
        </section>
      )}

      {!canWrite && !canAcceptOrReject && !['CANCELLED', 'CANCELLED_PENDING_REVIEW'].includes(bookingStatus) && (
        <section className="pt-2 border-t border-slate-50 mt-4">
          <button
            type="button"
            disabled={sending}
            onClick={onCancelBooking}
            className="w-full h-11 rounded-xl bg-white border border-red-100 text-red-600 text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all group"
          >
            <AlertCircle className="h-4 w-4 text-red-300 group-hover:text-red-600" />
            Cerrar negociación (Cancelar booking)
          </button>
        </section>
      )}
    </div>
  );
}

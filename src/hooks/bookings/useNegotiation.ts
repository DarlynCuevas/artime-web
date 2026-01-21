import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';

import {
  getNegotiationMessages,
  sendNegotiationMessage,
  sendFinalOffer,
  rejectBooking,
  rejectFinalOffer,
  NegotiationMessageDto,
} from '@/services/bookings/negotiations.service';

export function useNegotiation(bookingId?: string) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<NegotiationMessageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    if (!bookingId || !user?.token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getNegotiationMessages(bookingId, user.token);
      setMessages(data);
    } catch {
      setError('No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [bookingId, user?.token]);

  const lastOffer = useMemo(() => {
    return [...messages]
      .reverse()
      .find(
        (m) =>
          typeof m.proposedFee === 'number' || m.isFinalOffer,
      ) ?? null;
  }, [messages]);

  const sendMessage = async (payload: {
    message?: string;
    proposedFee?: number;
  }) => {
    if (!bookingId || !user?.token) return;

    setSending(true);
    setError(null);

    try {
      await sendNegotiationMessage(bookingId, user.token, {
        message: payload.message ?? '',
        proposedFee: payload.proposedFee,
      });
      await loadMessages();
    } catch {
      setError('No se pudo enviar la contraoferta');
      throw new Error();
    } finally {
      setSending(false);
    }
  };

  const sendOfferFinal = async (payload: {
    proposedFee: number;
    message?: string;
  }) => {
    if (!bookingId || !user?.token) return;

    setSending(true);
    setError(null);

    try {
      await sendFinalOffer(bookingId, user.token, {
        proposedFee: payload.proposedFee,
        message: payload.message ?? '',
      });
      await loadMessages();
    } catch {
      setError('No se pudo enviar la oferta final');
      throw new Error();
    } finally {
      setSending(false);
    }
  };
 

  const reject = async (bookingStatus: string) => {
    if (!bookingId || !user?.token) return;

    setSending(true);
    setError(null);

    try {
      if (bookingStatus === 'FINAL_OFFER_SENT') {
        await rejectFinalOffer(bookingId, user.token);
      } else {
        await rejectBooking(bookingId, user.token);
      }
      await loadMessages();
    } catch {
      setError('No se pudo rechazar');
      throw new Error();
    } finally {
      setSending(false);
    }
  };

return {
  messages,
  lastOffer,
  loading,
  sending,
  error,
  sendMessage,
  sendOfferFinal,
  reject,
};

}

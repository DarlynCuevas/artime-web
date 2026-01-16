export type BookingStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'NEGOTIATING'
  | 'FINAL_OFFER_SENT'
  | 'ACCEPTED'
  | 'CONTRACT_SIGNED'
  | 'PAID_PARTIAL'
  | 'PAID_FULL'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CANCELLED_PENDING_REVIEW';

export interface BookingArtist {
  id: string;
  name: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  start_date?: string;
  
  handledByRole: 'ARTIST' | 'MANAGER' | 'VENUE' | 'PROMOTER' | null;
  handledByUserId: string | null;
  handledAt: string | null;

  artist: BookingArtist;
  messagesCount?: number;
}

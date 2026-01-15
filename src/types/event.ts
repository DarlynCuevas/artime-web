export type EventVisibility = 'PRIVATE' | 'VISIBLE';
export type EventStatus =
  | 'DRAFT'
  | 'SEARCHING'
  | 'CONFIRMED'
  | 'CANCELLED';

export interface Event {
  id: string;
  name: string;
  status: EventStatus;

  start_date: string;
  endDate: string | null;

  venueId: string | null;
  type: string | null;

  estimatedBudget: number | null;
  description: string | null;

  createdAt: string;
  updatedAt: string;

  location:string

  visibility: EventVisibility;
  days?: EventDay[];
  bookings?: EventBookingLink[];

}

export type EventDay = {
  id: string;
  date: string;
  order: number;
};

export type EventBookingLink = {
  id: string;
  booking_id: string;
  event_day_id?: string;
  order?: number;
  start_time?: string;
  end_time?: string;
};


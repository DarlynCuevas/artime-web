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
}

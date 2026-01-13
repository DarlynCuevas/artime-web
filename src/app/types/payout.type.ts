import { PayoutStatus } from './payout-status.enum';

export interface Payout {
  id: string;
  status: PayoutStatus;
  currency: string;

  grossAmount: number;
  artistAmount: number;
  managerAmount: number;
  artimeFee: number;

  booking: {
    id: string;
    date: string;
    venueName?: string;
  };

  executedAt?: string;
  failureReason?: string;
}

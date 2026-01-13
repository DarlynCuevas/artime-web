import { PayoutStatus } from '../types/payout-status.enum';
import { Payout } from '../types/payout.type';

export async function fetchPayoutById(id: string): Promise<Payout> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/payouts/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch payout');
  }

  return res.json();
}
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTIiLCJyb2xlIjoiQVJUSVNUIiwiaWF0IjoxNzY4Mjk5NzAzLCJleHAiOjE3NjgzODYxMDN9.q5DbVMvBw3L6OjJMdz83Ube_dpoegJWMH11GAwTpenA"
export async function fetchPayouts(): Promise<Payout[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/payouts`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch payouts');
  }

  return res.json();
}

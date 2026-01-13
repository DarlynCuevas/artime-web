import { Payout } from "@/types/payout.type";


export async function fetchPayoutById(id: string, token: string): Promise<Payout> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/payouts/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch payout');
  }

  return res.json();
}
export async function fetchPayouts(token: string): Promise<Payout[]> {
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

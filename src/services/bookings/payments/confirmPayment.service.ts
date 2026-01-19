export async function confirmPaymentForMilestone({
  bookingId,
  milestoneId,
  token,
}: {
  bookingId: string
  milestoneId: string
  token: string
}) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings/${bookingId}/payments/confirm`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ milestoneId }),
    }
  )

  if (!res.ok) {
    throw new Error('Error confirmando el pago en ARTIME')
  }
}
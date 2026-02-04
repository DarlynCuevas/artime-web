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
    let detail = ''
    try {
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => null)
        detail =
          (data && (data.message ?? data.error ?? JSON.stringify(data))) || ''
      } else {
        detail = await res.text().catch(() => '')
      }
    } catch {
      detail = ''
    }

    const suffix = detail ? `: ${detail}` : ''
    throw new Error(
      `Error confirmando el pago en ARTIME (${res.status})${suffix}`
    )
  }
}

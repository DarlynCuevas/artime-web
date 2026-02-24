const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isRetryableStripeStatusError = (status: number, detail: string) => {
  if (status !== 400) return false
  return /PaymentIntent not succeeded \(status=(processing|requires_confirmation)\)/i.test(
    detail
  )
}

export async function confirmPaymentForMilestone({
  bookingId,
  milestoneId,
  token,
}: {
  bookingId: string
  milestoneId: string
  token: string
}) {
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

    if (res.ok) return

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

    if (
      attempt < maxAttempts &&
      isRetryableStripeStatusError(res.status, detail)
    ) {
      await sleep(800 * attempt)
      continue
    }

    const suffix = detail ? `: ${detail}` : ''
    throw new Error(
      `Error confirmando el pago en ARTIME (${res.status})${suffix}`
    )
  }
}

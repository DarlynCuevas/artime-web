const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function startArtistStripeOnboarding(params: {
  artistId: string;
  token: string;
}): Promise<{ onboardingUrl: string }> {
  const res = await fetch(`${API}/payments/stripe/artists/${params.artistId}/onboarding`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
  });

  if (!res.ok) {
    throw new Error('No se pudo iniciar Stripe Connect.');
  }

  return res.json();
}


const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

type StripeRole = 'ARTIST' | 'VENUE' | 'PROMOTER' | 'MANAGER';
type StripeStatus = 'NOT_STARTED' | 'PENDING' | 'COMPLETED';

export type StripeOnboardingStatusResponse = {
  role: StripeRole;
  profileId: string;
  stripeAccountId: string | null;
  onboardingStatus: StripeStatus;
  isConnected: boolean;
};

export async function startStripeOnboarding(params: {
  role: StripeRole;
  profileId: string;
  token: string;
}): Promise<{ onboardingUrl: string }> {
  const rolePath = {
    ARTIST: 'artists',
    VENUE: 'venues',
    PROMOTER: 'promoters',
    MANAGER: 'managers',
  }[params.role];

  const res = await fetch(`${API}/payments/stripe/${rolePath}/${params.profileId}/onboarding`, {
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

export async function getStripeOnboardingStatus(params: {
  role: StripeRole;
  profileId: string;
  token: string;
}): Promise<StripeOnboardingStatusResponse> {
  const rolePath = {
    ARTIST: 'artists',
    VENUE: 'venues',
    PROMOTER: 'promoters',
    MANAGER: 'managers',
  }[params.role];

  const res = await fetch(`${API}/payments/stripe/${rolePath}/${params.profileId}/status`, {
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
  });

  if (!res.ok) {
    throw new Error('No se pudo cargar el estado de Stripe.');
  }

  return res.json();
}

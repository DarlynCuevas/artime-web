type ArtistProfile = {
  id: string;
  email: string;
  stripeOnboardingStatus: string;
  name: string;
  city: string;
  genres: string[];
  basePrice: number;
  currency: string;
  isNegotiable: boolean;
  bio: string;
  format: string;
  stripeAccountId?: string;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  managerId?: string;
};
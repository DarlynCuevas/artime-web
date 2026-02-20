export type DiscoverArtist = {
  id: string;
  profileImageUrl?: string | null;
  name: string;
  city: string;
  genres: string[];
  basePrice: number;
  currency: string;
  rating?: number;
  isPremium?: boolean;
};

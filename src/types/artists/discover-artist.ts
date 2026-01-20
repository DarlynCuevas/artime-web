export type DiscoverArtist = {
  id: string;
  name: string;
  city: string;
  genres: string[];
  basePrice: number;
  currency: string;
  rating?: number;
  isPremium?: boolean;
};

import { useEffect, useState } from 'react';
import { getArtists } from '@/services/artists/artists.service';
import { useAuth } from '@/hooks/useAuth';

export function useArtists() {
  const { user } = useAuth();

  const [artists, setArtists] = useState<any[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [artistsError, setArtistsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) return;
    setArtistsLoading(true);
    getArtists(user.token)
      .then(setArtists)
      .catch(() => setArtistsError('No se pudieron cargar los artistas'))
      .finally(() => setArtistsLoading(false));
  }, [user?.token]);

  return {
    artists,
    artistsLoading,
    artistsError,
  };
}

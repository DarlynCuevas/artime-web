import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

type Role = 'VENUE' | 'ARTIST' | 'MANAGER' | 'PROMOTER' | null;

type MeResponse = {
  profiles: {
    artist: { id: string; name: string } | null;
    venue: { id: string; name: string } | null;
    promoter?: { id: string; name: string } | null;
    manager?: { id: string; name: string } | null;
  };
};

export function useMe() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [profileId, setProfileId] = useState<string | undefined>(undefined);

  useEffect(() => {
    console.log('[useMe] mount', { user, loading, role });

    if (!user?.token) {
      setRole(null);
      setProfileId(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => r.json())
      .then((data: MeResponse) => {
        console.log('Respuesta /me', data);
        const profiles = data?.profiles;

        if (profiles?.venue) {
          setRole('VENUE');
          setProfileId(profiles.venue.id);
          console.log('Set role VENUE');
        } else if (profiles?.artist) {
          setRole('ARTIST');
          setProfileId(profiles.artist.id);
          console.log('Set role ARTIST');
        } else if (profiles?.manager) {
          setRole('MANAGER');
          setProfileId(profiles.manager.id);
          console.log('Set role MANAGER');
        } else if (profiles?.promoter) {
          setRole('PROMOTER');
          setProfileId(profiles.promoter.id);
          console.log('Set role PROMOTER');
        } else {
          setRole(null);
          setProfileId(undefined);
          console.log('Set role null');
        }
        console.log('Role final:', profiles, role);
      })
      .finally(() => setLoading(false));

    return () => {
      console.log('[useMe] unmount');
    };
  }, [user?.token]);

  return {
    loading,
    role,
    profileId,
  };
}

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
  const [profileName, setProfileName] = useState<string | undefined>(undefined);

  useEffect(() => {
    console.log('[useMe] mount', { user, loading, role });

    if (!user?.token) {
      setRole(null);
      setProfileId(undefined);
      setProfileName(undefined);
      setLoading(false);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      console.error('[useMe] NEXT_PUBLIC_API_BASE_URL no definido');
      setRole(null);
      setProfileId(undefined);
      setProfileName(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`${baseUrl}/me`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`/me respondió ${res.status}`);
        }

        const data: MeResponse = await res.json();
        console.log('Respuesta /me', data);
        const profiles = data?.profiles;

        if (profiles?.venue) {
          setRole('VENUE');
          setProfileId(profiles.venue.id);
          setProfileName(profiles.venue.name);
          console.log('Set role VENUE');
        } else if (profiles?.artist) {
          setRole('ARTIST');
          setProfileId(profiles.artist.id);
          setProfileName(profiles.artist.name);
          console.log('Set role ARTIST');
        } else if (profiles?.manager) {
          setRole('MANAGER');
          setProfileId(profiles.manager.id);
          setProfileName(profiles.manager.name);
          console.log('Set role MANAGER');
        } else if (profiles?.promoter) {
          setRole('PROMOTER');
          setProfileId(profiles.promoter.id);
          setProfileName(profiles.promoter.name);
          console.log('Set role PROMOTER');
        } else {
          setRole(null);
          setProfileId(undefined);
          setProfileName(undefined);
          console.log('Set role null');
        }
        console.log('Role final:', profiles, role);
      } catch (err) {
        console.error('[useMe] error', err);
        setRole(null);
        setProfileId(undefined);
        setProfileName(undefined);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      console.log('[useMe] unmount');
    };
  }, [user?.token]);

  return {
    loading,
    role,
    profileId,
    profileName,
  };
}

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

export function useMe(opts?: { enabled?: boolean }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [profileId, setProfileId] = useState<string | undefined>(undefined);
  const [profileName, setProfileName] = useState<string | undefined>(undefined);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const enabled = opts?.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      setRole(null);
      setProfileId(undefined);
      setProfileName(undefined);
      setLoading(false);
      return;
    }

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
        const profiles = data?.profiles;

        // Prioritize manager to avoid "acceso no autorizado" when the user also has other profiles.
        if (profiles?.manager) {
          setRole('MANAGER');
          setProfileId(profiles.manager.id);
          setProfileName(profiles.manager.name);
        } else if (profiles?.venue) {
          setRole('VENUE');
          setProfileId(profiles.venue.id);
          setProfileName(profiles.venue.name);
        } else if (profiles?.artist) {
          setRole('ARTIST');
          setProfileId(profiles.artist.id);
          setProfileName(profiles.artist.name);
        } else if (profiles?.promoter) {
          setRole('PROMOTER');
          setProfileId(profiles.promoter.id);
          setProfileName(profiles.promoter.name);
        } else {
          setRole(null);
          setProfileId(undefined);
          setProfileName(undefined);
        }
      } catch (err) {
        // Network errors (backend down / CORS / wrong baseUrl) should not crash the app.
        console.warn('[useMe] no se pudo resolver /me');
        setRole(null);
        setProfileId(undefined);
        setProfileName(undefined);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
    };
  }, [enabled, user?.token, refreshIndex]);

  return {
    loading,
    role,
    profileId,
    profileName,
    refresh: () => setRefreshIndex((i) => i + 1),
  };
}

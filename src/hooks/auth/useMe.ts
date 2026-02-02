import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

type Role = 'VENUE' | 'ARTIST' | 'MANAGER' | 'PROMOTER' | null;

type ProfileResponse = {
  id?: string;
  name?: string;
};

type RoleEndpoint = {
  role: Exclude<Role, null>;
  path: string;
};

const ROLE_ENDPOINTS: RoleEndpoint[] = [
  { role: 'VENUE', path: '/venues/me' },
  { role: 'ARTIST', path: '/artists/me' },
  { role: 'MANAGER', path: '/managers/me' },
  { role: 'PROMOTER', path: '/promoters/me' },
];

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
        const authHeaders = {
          Authorization: `Bearer ${user.token}`,
        };
        let resolvedProfile: ProfileResponse | null = null;
        let resolvedRole: Role = null;

        for (const endpoint of ROLE_ENDPOINTS) {
          const res = await fetch(`${baseUrl}${endpoint.path}`, {
            headers: authHeaders,
          });

          if (res.status === 404) {
            continue;
          }

          if (!res.ok) {
            throw new Error(`${endpoint.path} respondió ${res.status}`);
          }

          const data: ProfileResponse = await res.json();
          resolvedProfile = data;
          resolvedRole = endpoint.role;
          break;
        }

        setRole(resolvedRole);
        setProfileId(resolvedProfile?.id);
        setProfileName(resolvedProfile?.name);
        console.log('Role final:', resolvedRole, resolvedProfile);
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

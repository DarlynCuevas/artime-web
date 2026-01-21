import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

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
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!user?.token) {
      setData(null);
      setLoading(false);
      return;
    }
    console.log('token',user.token);
    

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [user?.token]);

  return { data, loading };
}

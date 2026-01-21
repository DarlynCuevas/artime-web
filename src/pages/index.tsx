import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';

export default function IndexPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: me, loading: meLoading } = useMe();
  const router = useRouter();


  useEffect(() => {
    if (authLoading || meLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (me?.profiles.venue) {
      router.replace('/venue');
      return;
    }

    if (me?.profiles.artist) {
      router.replace('/artists/dashboard');
      return;
    }

    if (me?.profiles.promoter) {
      router.replace('/events');
      return;
    }

    // Caso: usuario sin perfiles → onboarding
    router.replace('/onboarding');
  }, [user, me, authLoading, meLoading, router]);

  return (
    <main style={{ padding: 32 }}>
      <p>Cargando…</p>
    </main>
  );
}

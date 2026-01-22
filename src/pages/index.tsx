import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';

export default function IndexPage() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: meLoading } = useMe();
  const router = useRouter();


  useEffect(() => {
    if (authLoading || meLoading) {
      return;
    }

    // Si loading terminó y no hay usuario, login

    // Solo redirigir a login si loading terminó y user es null
    if (!user && !authLoading && !meLoading) {
      router.replace('/login');
      return;
    }

    // Si hay usuario y role definido
    if (role === 'VENUE') {
      router.replace('/venues');
      return;
    }
    if (role === 'ARTIST') {
      router.replace('/artists/dashboard');
      return;
    }
    if (role === 'PROMOTER') {
      router.replace('/events');
      return;
    }

    // Si loading terminó y no hay usuario, login
    // Si user existe pero role es null, NO redirigir (esperar a que role se actualice)
  }, [user, role, authLoading, meLoading, router]);

  return (
    <main style={{ padding: 32 }}>
      <p>Cargando…</p>
    </main>
  );
}

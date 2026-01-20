import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function IndexPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    switch (user.role) {
      case 'VENUE':
        router.replace('/venue'); // home sala
        break;

      case 'ARTIST':
        router.replace('/artists/dashboard');
        break;

      case 'MANAGER':
        router.replace('/artists/dashboard');
        break;

      case 'PROMOTER':
        router.replace('/events');
        break;

      default:
        router.replace('/');
    }
  }, [user, router]);

  return (
    <main style={{ padding: 32 }}>
      <p>Cargando…</p>
    </main>
  );
}

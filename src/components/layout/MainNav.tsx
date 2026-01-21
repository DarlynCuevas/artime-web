import Link from 'next/link';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';

export function MainNav() {
const { user, loading: authLoading } = useAuth();
const { data: me, loading: meLoading } = useMe();
console.log('ME', me);
  if (!user) return null;

  return (
    <nav
      style={{
        borderBottom: '1px solid #ddd',
        padding: '12px 24px',
        display: 'flex',
        gap: 32, // Espacio uniforme entre los elementos
        alignItems: 'center',
        justifyContent: 'center', // Centra los elementos horizontalmente
      }}
    >
      {me?.profiles?.venue && (
        <>
          <Link href="/venues/discover">Discover</Link>
          <Link href="/venues/search">Search</Link>
          <Link href="/bookings">Bookings</Link>
          <Link href="/venues">Dashboard</Link>
        </>
      )}

      {me?.profiles?.artist && (
        <>
          <Link href="/artists/dashboard">Dashboard</Link>
          <Link href="/artists/calendar">Calendario</Link>
          <Link href="/bookings">Bookings</Link>
          <Link href="/artists/profile">Perfil</Link>
        </>
      )}

      {me?.profiles?.manager && (
        <>
          <Link href="/artists/dashboard">Dashboard</Link>
          <Link href="/bookings">Bookings</Link>
        </>
      )}

      {me?.profiles?.promoter && (
        <>
          <Link href="/events">Eventos</Link>
          <Link href="/bookings">Bookings</Link>
        </>
      )}
    </nav>
  );
}

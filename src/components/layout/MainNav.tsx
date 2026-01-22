import Link from 'next/link';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';

export function MainNav() {
  const { user } = useAuth();
  const { role, loading } = useMe();

  if (!user || loading) return null;

  return (
    <nav
      style={{
        borderBottom: '1px solid #ddd',
        padding: '12px 24px',
        display: 'flex',
        gap: 32,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {role === 'VENUE' && (
        <>
          <Link href="/venues/discover">Discover</Link>
          <Link href="/venues/search">Search</Link>
          <Link href="/venues/bookings">Bookings</Link>
          {/* <Link href="/venues">Dashboard</Link> */}
          <Link href="/venues/dashboard">Dashboard</Link>
        </>
      )}

      {role === 'ARTIST' && (
        <>
          <Link href="/artists/dashboard">Dashboard</Link>
          <Link href="/artists/calendar">Calendario</Link>
          <Link href="/artists/bookings">Bookings</Link>
          <Link href="/artists">Perfil</Link>
        </>
      )}

      {role === 'MANAGER' && (
        <>
          <Link href="/artists/dashboard">Dashboard</Link>
          <Link href="/bookings">Bookings</Link>
        </>
      )}

      {role === 'PROMOTER' && (
        <>
          <Link href="/events">Eventos</Link>
          <Link href="/venues/bookings">Bookings</Link>
        </>
      )}
    </nav>
  );
}

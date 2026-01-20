import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function MainNav() {
  const { user } = useAuth();

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
      {user.role === 'VENUE' && (
        <>
          <Link href="/venue/discover">Discover</Link>
          <Link href="/venue/search">Search</Link>
          <Link href="/bookings">Bookings</Link>
          <Link href="/venue">Dashboard</Link>
        </>
      )}

      {user.role === 'ARTIST' && (
        <>
          <Link href="/artists/dashboard">Dashboard</Link>
          <Link href="/artists/calendar">Calendario</Link>
          <Link href="/bookings">Bookings</Link>
          <Link href="/artists/profile">Perfil</Link>
        </>
      )}

      {user.role === 'MANAGER' && (
        <>
          <Link href="/artists/dashboard">Dashboard</Link>
          <Link href="/bookings">Bookings</Link>
        </>
      )}

      {user.role === 'PROMOTER' && (
        <>
          <Link href="/events">Eventos</Link>
          <Link href="/bookings">Bookings</Link>
        </>
      )}
    </nav>
  );
}

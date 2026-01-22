import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistNotifications } from '@/hooks/artists/useArtistNotifications';
import { useEffect, useMemo, useRef, useState } from 'react';

export function MainNav() {
  const { user } = useAuth();
  const { role, loading, profileId } = useMe();
  const [showDropdown, setShowDropdown] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const { notifications, unreadCount, markAsRead } = useArtistNotifications({
    artistId: role === 'ARTIST' ? profileId : undefined,
    token: user?.token,
    limit: 5,
  });

  const latestNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  useEffect(() => {
    function handleClickOutside(evt: MouseEvent) {
      if (!bellRef.current) return;
      if (bellRef.current.contains(evt.target as Node)) return;
      setShowDropdown(false);
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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
          <div style={{ position: 'relative' }} ref={bellRef}>
            <button
              onClick={() => setShowDropdown((s) => !s)}
              style={{
                position: 'relative',
                border: '1px solid #ddd',
                borderRadius: 16,
                padding: '6px 10px',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#ff4d4f',
                    color: '#fff',
                    borderRadius: '50%',
                    minWidth: 18,
                    height: 18,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: 8,
                  width: 320,
                  background: '#fff',
                  border: '1px solid #ddd',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                  borderRadius: 8,
                  zIndex: 20,
                  padding: 8,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Notificaciones</div>
                {latestNotifications.length === 0 && (
                  <p style={{ color: '#666', fontSize: 14, margin: 0 }}>Sin notificaciones</p>
                )}
                <div style={{ display: 'grid', gap: 8 }}>
                  {latestNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={async () => {
                        if (n.status === 'UNREAD') {
                          await markAsRead(n.id);
                        }
                        const callId = n.payload?.callId;
                        if (callId) {
                          const query = new URLSearchParams();
                          if (n.payload?.city) query.set('city', n.payload.city);
                          if (n.payload?.date) query.set('date', n.payload.date);
                          if (n.payload?.offeredMaxPrice) query.set('price', String(n.payload.offeredMaxPrice));
                          if (n.payload?.venueName) query.set('venueName', n.payload.venueName);
                          router.push(`/artists/calls/${callId}?${query.toString()}`);
                        }
                        setShowDropdown(false);
                      }}
                      style={{
                        border: '1px solid #eee',
                        padding: 10,
                        borderRadius: 6,
                        background: n.status === 'UNREAD' ? '#f6fbff' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {n.type === 'ARTIST_CALL_CREATED'
                          ? 'Nueva convocatoria'
                          : n.type}
                      </div>
                      <div style={{ fontSize: 12, color: '#555' }}>
                        {n.payload?.venueName ? `${n.payload.venueName} · ` : ''}
                        {n.payload?.city ?? ''}
                      </div>
                      <div style={{ fontSize: 12, color: '#333' }}>
                        {n.payload?.date ?? ''}
                        {n.payload?.offeredMaxPrice ? ` · Oferta: €${n.payload.offeredMaxPrice}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase/supabaseClient';
import {
  ArtistNotification,
  getArtistNotifications,
  markNotificationRead,
} from '@/services/notifications/artist-notifications.service';

export function useArtistNotifications(params: { artistId?: string; token?: string; limit?: number }) {
  const { artistId, token, limit = 50 } = params;
  const [notifications, setNotifications] = useState<ArtistNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!artistId || !token) return;
    let cancelled = false;

    const fetchOnce = () =>
      getArtistNotifications(token, limit)
        .then((data) => {
          if (!cancelled) setNotifications(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    setLoading(true);
    fetchOnce();

    // Poll de respaldo por si Realtime no entrega (cada 15s)
    const interval = setInterval(fetchOnce, 15_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [artistId, token, limit]);

  useEffect(() => {
    if (!artistId || !token) return;

    const channel = supabase.channel(`artist_notifications_${artistId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'artist_notifications',
          filter: `artist_id=eq.${artistId}`,
        },
        (payload) => {
          const next = payload.new as ArtistNotification;
          setNotifications((prev) => [next, ...prev]);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') return;
        if (status === 'CHANNEL_ERROR') {
          // fallback: refetch on error
          getArtistNotifications(token, limit).then(setNotifications).catch(() => undefined);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId, token, limit]);

  const unreadCount = useMemo(() => notifications.filter((n) => n.status === 'UNREAD').length, [notifications]);

  const markAsRead = async (id: string) => {
    if (!token || !artistId) return;
    await markNotificationRead(id, token);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n)));
  };

  return { notifications, unreadCount, loading, markAsRead };
}

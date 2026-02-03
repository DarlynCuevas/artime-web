import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArtistNotification,
  getArtistNotifications,
  markNotificationRead,
} from '@/services/notifications/artist-notifications.service';
import { useArtistNotificationsRealtime } from '@/hooks/notifications/useArtistNotificationsRealtime';

export function useArtistNotifications(params: { userId?: string; role?: string; token?: string; limit?: number }) {
  const { userId, role, token, limit = 50 } = params;
  const [notifications, setNotifications] = useState<ArtistNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !token) return;
    let cancelled = false;

    const fetchOnce = () =>
      getArtistNotifications(token, limit, role)
        .then((data) => {
          if (!cancelled) setNotifications(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    setLoading(true);
    fetchOnce();
    const intervalId = setInterval(fetchOnce, 10_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [userId, token, limit, role]);

  const handleRealtime = useCallback(
    (notification: ArtistNotification) => {
      setNotifications((prev) => [notification, ...prev]);
    },
    [],
  );

  useArtistNotificationsRealtime(userId, handleRealtime);

  const unreadCount = useMemo(() => notifications.filter((n) => n.status === 'UNREAD').length, [notifications]);

  const markAsRead = async (id: string) => {
    if (!token || !userId) return;
    await markNotificationRead(id, token);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n)));
  };

  return { notifications, unreadCount, loading, markAsRead };
}

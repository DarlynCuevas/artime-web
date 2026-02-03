import { useEffect } from 'react';
import { supabase } from '@/services/supabase/supabaseClient';

export function useArtistNotificationsRealtime(
  userId: string | undefined,
  onNewNotification: (notification: any) => void,
) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('artist-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'artist_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNewNotification(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNewNotification]);
}

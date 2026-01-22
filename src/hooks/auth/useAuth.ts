import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase/supabaseClient';
import type {
  Session,
  AuthChangeEvent,
} from '@supabase/supabase-js';

type AuthUser = {
  token: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useAuth] mount', { user, loading });
    // 1️ Sesión inicial
    supabase.auth.getSession().then(
      (response: { data: { session: Session | null } }) => {
        const session = response.data.session;

        if (session) {
          setUser({
            token: session.access_token,
          });
        }

        setLoading(false);
      }
    );

    // 2️ Cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!session) {
          setUser(null);
          return;
        }

        setUser({
          token: session.access_token,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
      console.log('[useAuth] unmount');
    };
  }, []);

  return {
    user,
    loading,
  };
}

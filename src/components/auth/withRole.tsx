import { ComponentType, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/context/MeContext';

type AllowedRole = 'VENUE' | 'ARTIST' | 'MANAGER' | 'PROMOTER';

export function withRole<P extends object>(
  Wrapped: ComponentType<P>,
  allowedRoles: AllowedRole[]
): ComponentType<P> {
  const RoleGuard: ComponentType<P> = (props: P) => {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { role, isAdmin, loading } = useMe();

    const isLoading = authLoading || loading;
    const hasAllowedRole = Boolean(user?.token && role && allowedRoles.includes(role));
    // Admin solo debe operar en rutas admin, no en rutas de rol.
    const isAuthorized = hasAllowedRole;

    useEffect(() => {
      if (isLoading || isAuthorized) return;
      const next = encodeURIComponent(router.asPath || '/');
      if (!user?.token) {
        router.replace(`/?next=${next}`);
        return;
      }
      if (isAdmin && !hasAllowedRole) {
        router.replace('/admin/verifications');
        return;
      }
      // Evita bucles login<->ruta protegida cuando hay sesión pero /me no resuelve rol válido.
      router.replace(`/?next=${next}`);
    }, [hasAllowedRole, isLoading, isAuthorized, isAdmin, router, user?.token]);

    if (isLoading) {
      return <div style={{ padding: 24 }}>Cargando…</div>;
    }

    if (!isAuthorized) {
      return null;
    }

    return <Wrapped {...props} />;
  };

  RoleGuard.displayName = `withRole(${Wrapped.displayName || Wrapped.name || 'Component'})`;

  return RoleGuard;
}

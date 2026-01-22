import { ComponentType } from 'react';
import { useMe } from '@/hooks/auth/useMe';

type AllowedRole = 'VENUE' | 'ARTIST' | 'MANAGER' | 'PROMOTER';

export function withRole<P extends object>(
  Wrapped: ComponentType<P>,
  allowedRoles: AllowedRole[]
): ComponentType<P> {
  const RoleGuard: ComponentType<P> = (props: P) => {
    const { role, loading } = useMe();

    if (loading) {
      return <div style={{ padding: 24 }}>Cargando…</div>;
    }

    if (!role || !allowedRoles.includes(role)) {
      return <div style={{ padding: 24 }}>Acceso no autorizado</div>;
    }

    return <Wrapped {...props} />;
  };

  RoleGuard.displayName = `withRole(${Wrapped.displayName || Wrapped.name || 'Component'})`;

  return RoleGuard;
}

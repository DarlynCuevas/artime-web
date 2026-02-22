import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { useMe as useMeHook } from '@/hooks/auth/useMe';

type MeContextValue = ReturnType<typeof useMeHook>;

const MeContext = createContext<MeContextValue | null>(null);

export function MeProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const me = useMeHook({ enabled });
  // Memoize to avoid unnecessary rerenders
  const value = useMemo(
    () => me,
    [me.loading, me.role, me.profileId, me.profileName, me.refresh]
  );
  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe() {
  const context = useContext(MeContext);
  if (context === null) {
    throw new Error('useMe debe usarse dentro de <MeProvider>');
  }
  return context;
}

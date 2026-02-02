import React, { createContext, useContext, useMemo } from 'react';
import { useMe as useMeHook } from '@/hooks/auth/useMe';

const MeContext = createContext(null);

export function MeProvider({ children }) {
  const me = useMeHook();
  // Memoize to avoid unnecessary rerenders
  const value = useMemo(() => me, [me.loading, me.role, me.profileId, me.profileName]);
  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe() {
  const context = useContext(MeContext);
  if (context === null) {
    throw new Error('useMe debe usarse dentro de <MeProvider>');
  }
  return context;
}

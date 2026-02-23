import React, { ReactNode, createContext, useContext } from 'react';
import { useMe as useMeHook } from '@/hooks/auth/useMe';

type MeContextValue = ReturnType<typeof useMeHook>;

const MeContext = createContext<MeContextValue | null>(null);

export function MeProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const me = useMeHook({ enabled });
  return <MeContext.Provider value={me}>{children}</MeContext.Provider>;
}

export function useMe() {
  const context = useContext(MeContext);
  if (context === null) {
    throw new Error('useMe debe usarse dentro de <MeProvider>');
  }
  return context;
}

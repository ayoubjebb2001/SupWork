'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  clearTokens,
  decodeJwtPayload,
  getAccessToken,
  type JwtPayload,
} from '@/lib/api';

type AuthContextValue = {
  user: JwtPayload | null;
  ready: boolean;
  refreshUser: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(() => {
    const t = getAccessToken();
    setUser(t ? decodeJwtPayload(t) : null);
  }, []);

  useEffect(() => {
    refreshUser();
    setReady(true);
  }, [refreshUser]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, refreshUser, logout }),
    [user, ready, refreshUser, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

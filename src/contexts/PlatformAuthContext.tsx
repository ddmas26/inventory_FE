import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PlatformUserResponse } from '../types';
import {
  platformApi,
  storePlatformSession,
  clearPlatformSession,
  PLATFORM_TOKEN_KEY,
  PLATFORM_USER_KEY,
} from '../api/platform';

interface PlatformAuthContextType {
  user: PlatformUserResponse | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | null>(null);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUserResponse | null>(() => {
    const stored = localStorage.getItem(PLATFORM_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(PLATFORM_TOKEN_KEY),
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await platformApi.login(email, password);
    storePlatformSession(res);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await platformApi.logout();
    } catch {
      // Best effort — clear local state regardless.
    }
    clearPlatformSession();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <PlatformAuthContext.Provider value={{ user, isAuthenticated: !!token, login, logout }}>
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth() {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
  return ctx;
}

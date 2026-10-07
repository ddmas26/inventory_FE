import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { LoginRequest, RegisterRequest, UserResponse, LoginResponse, ClaimsResponse } from '../types';
import { authApi } from '../api/auth';
import {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  PERMS_KEY,
  UNAUTHORIZED_EVENT,
  TOKEN_REFRESHED_EVENT,
  storeTokenPair,
  clearAuthStorage,
} from '../api/client';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  /** Name of the company (tenant) the signed-in user belongs to. */
  companyName: string | null;
  /** Lifecycle status of the user's company: pending | approved | rejected | suspended. */
  companyStatus: string | null;
  /** True when the user is the company owner (root). */
  isRoot: boolean;
  permissions: string[];
  hasPermission: (code: string) => boolean;
  /** Re-fetches session claims (e.g. to pick up a company approval). */
  refreshClaims: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  /** Revokes the session in Redis (best effort) and clears local state. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [permissions, setPermissions] = useState<string[]>(() => {
    const stored = localStorage.getItem(PERMS_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [isRoot, setIsRoot] = useState(false);

  /** Drops the local session. The API client has already revoked the tokens. */
  const clearAuth = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    setPermissions([]);
    setCompanyName(null);
    setCompanyStatus(null);
    setIsRoot(false);
  }, []);

  /** Applies fresh session claims to local state. */
  const applyClaims = useCallback((claims: ClaimsResponse) => {
    setPermissions(claims.permissions);
    setCompanyName(claims.company_name ?? null);
    setCompanyStatus(claims.company_status ?? null);
    setIsRoot(!!claims.is_root);
    localStorage.setItem(PERMS_KEY, JSON.stringify(claims.permissions));
  }, []);

  // On mount, if we have a token but no permissions, fetch claims
  useEffect(() => {
    if (token && permissions.length === 0) {
      authApi.me()
        .then(applyClaims)
        .catch(() => {
          // Token invalid and could not be refreshed — clear the local session.
          clearAuth();
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    storeTokenPair(res);
    setToken(res.token);
    setUser(res.user);

    // Fetch claims after login
    try {
      const claims = await authApi.me();
      applyClaims(claims);
    } catch {
      // Non-critical — permissions will be empty
    }
  }, [applyClaims]);

  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      // Revoke the access session and refresh token in Redis.
      await authApi.logout(refreshToken);
    } catch {
      // Best effort — the local session is cleared either way.
    }
    clearAuth();
  }, [clearAuth]);

  // The API client silently refreshes expired access tokens; keep state in sync.
  useEffect(() => {
    const onRefreshed = (event: Event) => {
      const pair = (event as CustomEvent<LoginResponse>).detail;
      setToken(pair.token);
      if (pair.user) setUser(pair.user);
    };
    window.addEventListener(TOKEN_REFRESHED_EVENT, onRefreshed);
    return () => window.removeEventListener(TOKEN_REFRESHED_EVENT, onRefreshed);
  }, []);

  // A request stayed unauthorised even after a refresh attempt — sign out.
  useEffect(() => {
    const onUnauthorized = () => clearAuth();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearAuth]);

  const hasPermission = useCallback(
    (code: string) => permissions.includes(code),
    [permissions],
  );

  const refreshClaims = useCallback(async () => {
    const claims = await authApi.me();
    applyClaims(claims);
  }, [applyClaims]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, companyName, companyStatus, isRoot, permissions, hasPermission, refreshClaims, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

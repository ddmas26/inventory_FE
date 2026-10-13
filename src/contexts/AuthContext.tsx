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
  /**
   * False until the server-verified claims behind the stored token have been
   * loaded. The company approval gate must never be evaluated before then.
   */
  claimsReady: boolean;
  /** Re-fetches session claims (e.g. to pick up a company approval). */
  refreshClaims: () => Promise<void>;
  /**
   * Signs in and returns the fresh claims (or null when they could not be read),
   * so callers can tell an approved sign-in from an "awaiting approval" one.
   */
  login: (data: LoginRequest) => Promise<ClaimsResponse | null>;
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
  // These claims are deliberately NOT hydrated from localStorage. Only the
  // permission codes are cached (to render the menu instantly), while the
  // company's approval status is re-read from the server on every page load —
  // a tab opened tomorrow must not inherit yesterday's verdict.
  const [claimsReady, setClaimsReady] = useState(false);

  /** Drops the local session. The API client has already revoked the tokens. */
  const clearAuth = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    setPermissions([]);
    setCompanyName(null);
    setCompanyStatus(null);
    setIsRoot(false);
    setClaimsReady(true);
  }, []);

  /** Applies fresh session claims to local state. */
  const applyClaims = useCallback((claims: ClaimsResponse) => {
    setPermissions(claims.permissions);
    setCompanyName(claims.company_name ?? null);
    setCompanyStatus(claims.company_status ?? null);
    setIsRoot(!!claims.is_root);
    localStorage.setItem(PERMS_KEY, JSON.stringify(claims.permissions));
  }, []);

  // A stored token is only a hint that we *might* have a session. Permissions and
  // — critically — the company's approval status live server-side and may have
  // changed since this browser last talked to the API, so re-read them on every
  // mount before the user is let into the app. The old code only fetched when the
  // cached permission list was empty, which meant a brand new tab skipped the
  // check entirely and rendered the app shell for an unapproved company.
  useEffect(() => {
    if (!token) {
      setClaimsReady(true);
      return;
    }

    authApi.me()
      .then(applyClaims)
      .catch(() => {
        // Token invalid and could not be refreshed — clear the local session.
        clearAuth();
      })
      .finally(() => setClaimsReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    storeTokenPair(res);
    setToken(res.token);
    setUser(res.user);

    // The login response carries no company status, so read the claims. A failure
    // here is not fatal: the gate treats unknown claims as "not approved".
    let claims: ClaimsResponse | null = null;
    try {
      claims = await authApi.me();
      applyClaims(claims);
    } catch {
      // Permissions stay empty; the caller will not report a successful sign-in.
    }
    setClaimsReady(true);

    return claims;
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
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, companyName, companyStatus, isRoot, permissions, hasPermission, claimsReady, refreshClaims, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

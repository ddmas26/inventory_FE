const BASE_URL = '/api';

// Storage keys are exported so the auth context and this module never drift apart.
export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'auth_refresh_token';
export const USER_KEY = 'auth_user';
export const PERMS_KEY = 'auth_permissions';

/** Fired when the session could not be refreshed and the user must log in again. */
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';
/** Fired after the client silently refreshed the token pair. */
export const TOKEN_REFRESHED_EVENT = 'auth:refreshed';

/**
 * Auth endpoints that must never trigger a refresh attempt: login/register fail
 * with 401 for bad credentials, and refresh/logout manage tokens themselves.
 */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export interface TokenPair {
  token: string;
  refresh_token: string;
  expires_in: number;
  user?: unknown;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Removes every trace of the local session. */
export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PERMS_KEY);
}

/** Persists a freshly issued token pair. */
export function storeTokenPair(pair: TokenPair) {
  localStorage.setItem(TOKEN_KEY, pair.token);
  localStorage.setItem(REFRESH_TOKEN_KEY, pair.refresh_token);
  if (pair.user) localStorage.setItem(USER_KEY, JSON.stringify(pair.user));
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// A single in-flight refresh shared by every concurrent 401, so a burst of failed
// requests rotates the refresh token exactly once.
let refreshInFlight: Promise<boolean> | null = null;

function refreshTokenPair(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      // Another tab may have rotated the pair while this call was in flight.
      return localStorage.getItem(REFRESH_TOKEN_KEY) !== refreshToken;
    }

    const pair = (await res.json()) as TokenPair;
    storeTokenPair(pair);
    window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: pair }));
    return true;
  } catch {
    return false;
  }
}

function handleUnauthorized() {
  clearAuthStorage();
  // Don't bounce while the user is already on (or heading to) the login page.
  if (!window.location.pathname.startsWith('/login')) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    handleUnauthorized();
    const body = await response.json().catch(() => ({}));
    throw new ApiError(401, body.error || 'Session expired. Please log in again.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

function shouldSkipRefresh(path: string) {
  return NO_REFRESH_PATHS.some((p) => path.includes(p));
}

/**
 * Sends a request with the current access token. If the API answers 401 (expired
 * access token) it refreshes the pair once and replays the request.
 */
async function send(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = { ...(init.headers as Record<string, string> | undefined), ...authHeaders() };
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status !== 401 || shouldSkipRefresh(path)) {
    return res;
  }

  const refreshed = await refreshTokenPair();
  if (!refreshed) return res;

  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), ...authHeaders() },
  });
}

/** Appends query parameters to a path (encoding handled by URLSearchParams). */
function withParams(path: string, params?: Record<string, string>): string {
  if (!params) return path;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => search.set(key, value));

  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  return handleResponse<T>(await send(withParams(path, params)));
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return handleResponse<T>(await send(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  return handleResponse<T>(await send(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

export async function del<T = void>(path: string, params?: Record<string, string>): Promise<T> {
  return handleResponse<T>(await send(withParams(path, params), { method: 'DELETE' }));
}

export async function patch<T>(path: string, body?: unknown): Promise<T> {
  return handleResponse<T>(await send(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }));
}

export async function postMultipart<T>(path: string, formData: FormData): Promise<T> {
  return handleResponse<T>(await send(path, { method: 'POST', body: formData }));
}

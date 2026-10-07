import type {
  CompanyDto,
  PaginatedResponse,
  PlatformDashboardData,
  PlatformLoginResponse,
  PlatformUserResponse,
  CompanyStatus,
} from '../types';

const BASE_URL = '/api';

// Platform sessions are stored under their own keys so they never collide with a
// company user's session in the same browser.
export const PLATFORM_TOKEN_KEY = 'platform_token';
export const PLATFORM_USER_KEY = 'platform_user';

export class PlatformApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'PlatformApiError';
  }
}

export function storePlatformSession(data: PlatformLoginResponse) {
  localStorage.setItem(PLATFORM_TOKEN_KEY, data.token);
  localStorage.setItem(PLATFORM_USER_KEY, JSON.stringify(data.user));
}

export function clearPlatformSession() {
  localStorage.removeItem(PLATFORM_TOKEN_KEY);
  localStorage.removeItem(PLATFORM_USER_KEY);
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), ...authHeaders() },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new PlatformApiError(res.status, body.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function withParams(path: string, params?: Record<string, string | undefined>): string {
  if (!params) return path;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') search.set(k, v);
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export const platformApi = {
  login: (email: string, password: string) =>
    request<PlatformLoginResponse>('/platform/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<PlatformUserResponse>('/platform/auth/me'),

  logout: () => request<void>('/platform/auth/logout', { method: 'POST' }),

  dashboard: () => request<PlatformDashboardData>('/platform/dashboard'),

  companies: (params?: { status?: CompanyStatus | ''; search?: string; page_index?: number; page_size?: number }) =>
    request<PaginatedResponse<CompanyDto>>(
      withParams('/platform/companies', {
        status: params?.status,
        search: params?.search,
        page_index: params?.page_index?.toString(),
        page_size: params?.page_size?.toString(),
      }),
    ),

  company: (id: string) => request<CompanyDto>(`/platform/companies/${id}`),

  approve: (id: string) =>
    request<{ id: string; status: CompanyStatus }>(`/platform/companies/${id}/approve`, { method: 'PATCH' }),

  reject: (id: string) =>
    request<{ id: string; status: CompanyStatus }>(`/platform/companies/${id}/reject`, { method: 'PATCH' }),

  suspend: (id: string) =>
    request<{ id: string; status: CompanyStatus }>(`/platform/companies/${id}/suspend`, { method: 'PATCH' }),
};

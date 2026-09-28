import { post, get } from './client';
import type { LoginRequest, RegisterRequest, LoginResponse, UserResponse, ClaimsResponse } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    post<UserResponse>('/auth/register', data),

  me: () =>
    get<ClaimsResponse>('/auth/me'),

  /** Exchanges a refresh token for a new access + refresh token pair (rotated). */
  refresh: (refreshToken: string) =>
    post<LoginResponse>('/auth/refresh', { refresh_token: refreshToken }),

  /** Revokes the access session and refresh token in Redis. */
  logout: (refreshToken?: string | null) =>
    post<void>('/auth/logout', { refresh_token: refreshToken ?? '' }),
};

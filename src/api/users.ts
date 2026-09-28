import { get, put, del, patch, post } from './client';
import type { UserDto, PaginatedResponse } from '../types';

export const usersApi = {
  list: (pageIndex = 1, pageSize = 20, search = '') =>
    get<PaginatedResponse<UserDto>>(`/users?page_index=${pageIndex}&page_size=${pageSize}&search=${search}`),

  getById: (id: string) =>
    get<UserDto>(`/users/${id}`),

  create: (data: { name: string; email: string; password: string; role_id?: string | null }) =>
    post<UserDto>('/users', data),

  update: (id: string, data: { name: string; email: string; role_id?: string | null }) =>
    put<UserDto>(`/users/${id}`, data),

  delete: (id: string) =>
    del(`/users/${id}`),

  activate: (id: string) =>
    patch<{ message: string }>(`/users/${id}/activate`),

  deactivate: (id: string) =>
    patch<{ message: string }>(`/users/${id}/deactivate`),
};

import { get, post, put, del } from './client';
import type { PermissionResponse, CreatePermissionRequest } from '../types';

export const permissionsApi = {
  list: () =>
    get<PermissionResponse[]>('/permissions'),

  create: (data: CreatePermissionRequest) =>
    post<PermissionResponse>('/permissions', data),

  update: (id: string, data: CreatePermissionRequest) =>
    put<PermissionResponse>(`/permissions/${id}`, data),

  delete: (id: string) =>
    del(`/permissions/${id}`),
};

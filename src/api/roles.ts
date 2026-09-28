import { get, post, put, del } from './client';
import type { RoleWithPermissionsResponse, CreateRoleRequest, RoleResponse } from '../types';

export const rolesApi = {
  list: () =>
    get<RoleWithPermissionsResponse[]>('/roles'),

  getById: (id: string) =>
    get<RoleWithPermissionsResponse>(`/roles/${id}`),

  create: (data: CreateRoleRequest) =>
    post<RoleResponse>('/roles', data),

  update: (id: string, data: CreateRoleRequest) =>
    put<RoleWithPermissionsResponse>(`/roles/${id}`, data),

  delete: (id: string) =>
    del(`/roles/${id}`),

  addPermission: (roleId: string, permissionId: string) =>
    post<RoleWithPermissionsResponse>(`/roles/${roleId}/permissions`, { permission_id: permissionId }),

  removePermission: (roleId: string, permissionId: string) =>
    del<RoleWithPermissionsResponse>(`/roles/${roleId}/permissions/${permissionId}`),
};

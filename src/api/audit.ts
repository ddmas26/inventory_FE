import { get } from './client';
import type { AuditLogEntry, PaginatedResponse } from '../types';

export interface AuditQuery {
  action?: string;
  entity_type?: string;
  actor_type?: string;
  search?: string;
  from?: string;
  to?: string;
  page_index?: number;
  page_size?: number;
}

/** Serialises the audit query, dropping empty values. */
function toQuery(params: AuditQuery): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const auditApi = {
  /** The caller's company audit trail. */
  list: (params: AuditQuery = {}) =>
    get<PaginatedResponse<AuditLogEntry>>(`/audit-logs${toQuery(params)}`),
};

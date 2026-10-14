import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Input, Select, Space, Typography, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AuditLogEntry, PaginatedResponse } from '../types';
import type { AuditQuery } from '../api/audit';

const actorColor: Record<string, string> = {
  user: 'blue',
  platform: 'geekblue',
  system: 'default',
};

/** Renders a JSON blob (before/after/metadata) in a readable block. */
function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value === undefined || value === null) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <Typography.Text strong style={{ fontSize: 12 }}>{label}</Typography.Text>
      <pre
        style={{
          background: '#f6f8fa',
          padding: 8,
          borderRadius: 4,
          margin: '4px 0 0',
          fontSize: 12,
          overflowX: 'auto',
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

/**
 * Shared audit-log table. The tenant page and the platform page differ only in
 * the fetch function and whether the company column is shown.
 */
export default function AuditLogTable({
  fetchLogs,
  showCompany = false,
}: {
  fetchLogs: (params: AuditQuery) => Promise<PaginatedResponse<AuditLogEntry>>;
  showCompany?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [actorType, setActorType] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auditLogs', search, actorType, page, pageSize, showCompany],
    queryFn: () => fetchLogs({
      search: search || undefined,
      actor_type: actorType || undefined,
      page_index: page,
      page_size: pageSize,
    }),
  });

  const columns: ColumnsType<AuditLogEntry> = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    ...(showCompany
      ? [{ title: 'Company', dataIndex: 'company_name', key: 'company_name', render: (v?: string) => v || '—' }]
      : []),
    {
      title: 'Actor',
      key: 'actor',
      render: (_: unknown, r: AuditLogEntry) => (
        <Space size={4}>
          <Tag color={actorColor[r.actor_type] ?? 'default'}>{r.actor_type}</Tag>
          <span>{r.actor_name || '—'}</span>
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Entity',
      key: 'entity',
      render: (_: unknown, r: AuditLogEntry) =>
        r.entity_type ? `${r.entity_type}${r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ''}` : '—',
    },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 140, render: (v?: string) => v || '—' },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Search actor, action or entity id"
          allowClear
          style={{ width: 300 }}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Select
          value={actorType}
          style={{ width: 170 }}
          onChange={(v) => {
            setActorType(v);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All actors' },
            { value: 'user', label: 'Company user' },
            { value: 'platform', label: 'Platform' },
            { value: 'system', label: 'System' },
          ]}
        />
        <Button onClick={() => refetch()}>Refresh</Button>
      </Space>

      <Table<AuditLogEntry>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.data ?? []}
        columns={columns}
        expandable={{
          expandedRowRender: (r) => {
            const hasDetail = r.old_values !== undefined || r.new_values !== undefined || r.metadata !== undefined;
            return (
              <div>
                {hasDetail ? (
                  <>
                    <JsonBlock label="Before" value={r.old_values} />
                    <JsonBlock label="After" value={r.new_values} />
                    <JsonBlock label="Metadata" value={r.metadata} />
                  </>
                ) : (
                  <Typography.Text type="secondary">No extra detail recorded.</Typography.Text>
                )}
              </div>
            );
          },
        }}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </>
  );
}

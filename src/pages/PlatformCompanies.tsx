import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Space, message, Popconfirm, Input, Select, Drawer, Descriptions } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { platformApi } from '../api/platform';
import type { CompanyDto, CompanyStatus } from '../types';

const statusColor: Record<CompanyStatus, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  suspended: 'orange',
};

export default function PlatformCompanies() {
  const [rows, setRows] = useState<CompanyDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<CompanyStatus | ''>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CompanyDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformApi.companies({ status, search, page_index: page, page_size: pageSize });
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [status, search, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: (id: string) => Promise<unknown>, id: string, ok: string) => {
    try {
      await fn(id);
      message.success(ok);
      setDetail(null);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const openDetail = async (id: string) => {
    try {
      setDetail(await platformApi.company(id));
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const columns: ColumnsType<CompanyDto> = [
    { title: 'Company', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: CompanyStatus) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: 'Registered',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, r: CompanyDto) => (
        <Space wrap>
          <Button size="small" onClick={() => openDetail(r.id)}>
            Details
          </Button>
          {r.status !== 'approved' && (
            <Button size="small" type="primary" onClick={() => act(platformApi.approve, r.id, 'Company approved')}>
              Approve
            </Button>
          )}
          {r.status !== 'rejected' && (
            <Popconfirm title="Reject this company?" onConfirm={() => act(platformApi.reject, r.id, 'Company rejected')}>
              <Button size="small" danger>
                Reject
              </Button>
            </Popconfirm>
          )}
          {r.status === 'approved' && (
            <Popconfirm title="Suspend this company?" onConfirm={() => act(platformApi.suspend, r.id, 'Company suspended')}>
              <Button size="small">Suspend</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="Companies">
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Search name, slug or phone"
          allowClear
          style={{ width: 280 }}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Select
          value={status}
          style={{ width: 160 }}
          onChange={(v: CompanyStatus | '') => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
        <Button onClick={load}>Refresh</Button>
      </Space>

      <Table<CompanyDto>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Drawer width={480} open={!!detail} onClose={() => setDetail(null)} title="Company details">
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Name">{detail.name}</Descriptions.Item>
            <Descriptions.Item label="Slug">{detail.slug}</Descriptions.Item>
            <Descriptions.Item label="Phone">{detail.phone}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColor[detail.status]}>{detail.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Registered">{new Date(detail.created_at).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Approved at">
              {detail.approved_at ? new Date(detail.approved_at).toLocaleString() : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Root user">{detail.root_user_name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Root email">{detail.root_user_email || '—'}</Descriptions.Item>
            <Descriptions.Item label="Root phone">{detail.root_user_phone || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Card>
  );
}

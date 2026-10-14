import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, message, Select, Drawer, Typography,
  Modal, Input, Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { platformApi } from '../api/platform';
import type {
  CompanyProfileRequestDto, CompanyProfileRequestDetail, CompanyProfile, ProfileRequestStatus,
} from '../types';

const statusColor: Record<ProfileRequestStatus, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
};

const FIELDS: { key: keyof CompanyProfile; label: string }[] = [
  { key: 'legal_name', label: 'Legal name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website' },
  { key: 'tax_id', label: 'Tax / registration no.' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'description', label: 'Description' },
  { key: 'logo_url', label: 'Logo URL' },
];

export default function PlatformProfileRequests() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<ProfileRequestStatus | ''>('pending');
  const [detail, setDetail] = useState<CompanyProfileRequestDetail | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['platformProfileRequests', status, page, pageSize],
    queryFn: () => platformApi.profileRequests({ status, page_index: page, page_size: pageSize }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['platformProfileRequests'] });

  const openDetail = async (id: string) => {
    try {
      setDetail(await platformApi.profileRequest(id));
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const approve = async (id: string) => {
    try {
      await platformApi.approveProfileRequest(id);
      message.success('Profile change approved');
      setDetail(null);
      refresh();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const doReject = async () => {
    if (!detail) return;
    try {
      await platformApi.rejectProfileRequest(detail.request.id, reason);
      message.success('Profile change rejected');
      setRejectOpen(false);
      setReason('');
      setDetail(null);
      refresh();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const columns: ColumnsType<CompanyProfileRequestDto> = [
    { title: 'Company', dataIndex: 'company_name', key: 'company_name' },
    {
      title: 'Requested by',
      dataIndex: 'requested_by_name',
      key: 'requested_by_name',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: ProfileRequestStatus) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, r: CompanyProfileRequestDto) => (
        <Button size="small" onClick={() => openDetail(r.id)}>
          {r.status === 'pending' ? 'Review' : 'View'}
        </Button>
      ),
    },
  ];

  const compareColumns: ColumnsType<{ key: string; label: string; current: string; requested: string; changed: boolean }> = [
    { title: 'Field', dataIndex: 'label', key: 'label', width: 170 },
    {
      title: 'Current',
      dataIndex: 'current',
      key: 'current',
      render: (v: string) => (v ? v : '—'),
    },
    {
      title: 'Requested',
      dataIndex: 'requested',
      key: 'requested',
      render: (v: string, r) =>
        r.changed ? <Typography.Text strong>{v || '—'}</Typography.Text> : (v || '—'),
    },
  ];

  const compareRows = detail
    ? FIELDS.map((f) => {
        const current = (detail.current[f.key] as string) ?? '';
        const requested = (detail.request.profile[f.key] as string) ?? '';
        return {
          key: f.key as string,
          label: f.label,
          current,
          requested,
          changed: current !== requested,
        };
      })
    : [];

  const isPending = detail?.request.status === 'pending';

  return (
    <Card title="Profile Requests">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          value={status}
          style={{ width: 180 }}
          onChange={(v: ProfileRequestStatus | '') => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: '', label: 'All statuses' },
          ]}
        />
        <Button onClick={refresh}>Refresh</Button>
      </Space>

      <Table<CompanyProfileRequestDto>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.data ?? []}
        columns={columns}
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

      <Drawer
        width={640}
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Profile change · ${detail.request.company_name ?? ''}` : 'Profile change'}
        extra={isPending && detail && (
          <Space>
            <Popconfirm title="Approve these changes?" onConfirm={() => approve(detail.request.id)}>
              <Button type="primary">Approve</Button>
            </Popconfirm>
            <Button danger onClick={() => setRejectOpen(true)}>Reject</Button>
          </Space>
        )}
      >
        {detail && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Typography.Text type="secondary">
              Requested by {detail.request.requested_by_name || '—'} ·{' '}
              {new Date(detail.request.created_at).toLocaleString()}
            </Typography.Text>
            {detail.request.status === 'rejected' && detail.request.reason && (
              <Typography.Text type="danger">Rejection reason: {detail.request.reason}</Typography.Text>
            )}
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              columns={compareColumns}
              dataSource={compareRows}
              rowClassName={(r) => (r.changed ? 'profile-diff-row' : '')}
            />
          </Space>
        )}
      </Drawer>

      <Modal
        title="Reject profile change"
        open={rejectOpen}
        onOk={doReject}
        onCancel={() => { setRejectOpen(false); setReason(''); }}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (shared with the company)"
        />
      </Modal>
    </Card>
  );
}

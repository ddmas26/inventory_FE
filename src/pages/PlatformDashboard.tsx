import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button, Space, message, Popconfirm, Drawer, Descriptions } from 'antd';
import { useNavigate } from 'react-router-dom';
import { platformApi } from '../api/platform';
import type { CompanyDto, PlatformDashboardData } from '../types';

export default function PlatformDashboard() {
  const [data, setData] = useState<PlatformDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CompanyDto | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await platformApi.dashboard());
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const columns = [
    { title: 'Company', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
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
        <Space>
          <Button size="small" onClick={() => openDetail(r.id)}>
            Details
          </Button>
          <Button size="small" type="primary" onClick={() => act(platformApi.approve, r.id, 'Company approved')}>
            Approve
          </Button>
          <Popconfirm title="Reject this company?" onConfirm={() => act(platformApi.reject, r.id, 'Company rejected')}>
            <Button size="small" danger>
              Reject
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={4}>
          <Card>
            <Statistic title="Total" value={data?.counts.total ?? 0} />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic title="Pending" value={data?.counts.pending ?? 0} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic title="Approved" value={data?.counts.approved ?? 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic title="Rejected" value={data?.counts.rejected ?? 0} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic title="Suspended" value={data?.counts.suspended ?? 0} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            Pending approvals
            {!!data?.counts.pending && <Tag color="gold">{data.counts.pending}</Tag>}
          </Space>
        }
        extra={<Button onClick={() => navigate('/platform/companies')}>View all companies</Button>}
      >
        <Table<CompanyDto>
          rowKey="id"
          loading={loading}
          dataSource={data?.pending ?? []}
          columns={columns}
          pagination={false}
          locale={{ emptyText: 'No companies awaiting approval' }}
        />
      </Card>

      <Drawer width={480} open={!!detail} onClose={() => setDetail(null)} title="Company details">
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Name">{detail.name}</Descriptions.Item>
            <Descriptions.Item label="Slug">{detail.slug}</Descriptions.Item>
            <Descriptions.Item label="Phone">{detail.phone}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag>{detail.status}</Tag>
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
    </Space>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Descriptions, Button, Modal, Form, Input, Space, Tag, Typography,
  Alert, Table, message, Image,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined } from '@ant-design/icons';
import { companyProfileApi } from '../api/companyProfile';
import { useAuth } from '../contexts/AuthContext';
import type { CompanyProfile, CompanyProfileRequestDto } from '../types';

const requestStatusColor: Record<string, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
};

function orDash(v?: string) {
  return v && v.trim() !== '' ? v : '—';
}

export default function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('company.edit');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<CompanyProfile>();

  const { data, isLoading } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: () => companyProfileApi.get(),
  });

  const { data: history } = useQuery({
    queryKey: ['companyProfileRequests'],
    queryFn: () => companyProfileApi.history(),
  });

  const updateMutation = useMutation({
    mutationFn: companyProfileApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      queryClient.invalidateQueries({ queryKey: ['companyProfileRequests'] });
      message.success('Your changes were submitted for review');
      setModalOpen(false);
      form.resetFields();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const profile = data?.profile;
  const pending = data?.pending;

  const openEdit = () => {
    // Prefill with the pending proposal when one exists so the user can tweak it,
    // otherwise with the currently approved profile.
    form.setFieldsValue(pending?.profile ?? profile ?? ({} as CompanyProfile));
    setModalOpen(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => updateMutation.mutate(values));
  };

  const historyColumns: ColumnsType<CompanyProfileRequestDto> = [
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => <Tag color={requestStatusColor[s] ?? 'default'}>{s}</Tag>,
    },
    {
      title: 'Requested by',
      dataIndex: 'requested_by_name',
      key: 'requested_by_name',
      width: 160,
      render: (v?: string) => v || '—',
    },
    {
      title: 'Review note',
      dataIndex: 'reason',
      key: 'reason',
      render: (v?: string) => v || '—',
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="Company Profile"
        loading={isLoading}
        extra={canEdit && <Button type="primary" icon={<EditOutlined />} onClick={openEdit}>Edit profile</Button>}
      >
        {pending && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Your changes are under review"
            description={
              <span>
                Submitted {new Date(pending.created_at).toLocaleString()}. The profile below stays
                live until a platform admin approves your changes.
              </span>
            }
          />
        )}

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Company name">{orDash(data?.name)}</Descriptions.Item>
          <Descriptions.Item label="Legal name">{orDash(pending?.profile.legal_name ?? profile?.legal_name)}</Descriptions.Item>
          <Descriptions.Item label="Email">{orDash(pending?.profile.email ?? profile?.email)}</Descriptions.Item>
          <Descriptions.Item label="Phone">{orDash(pending?.profile.phone ?? profile?.phone)}</Descriptions.Item>
          <Descriptions.Item label="Website">{orDash(pending?.profile.website ?? profile?.website)}</Descriptions.Item>
          <Descriptions.Item label="Tax / registration no.">{orDash(pending?.profile.tax_id ?? profile?.tax_id)}</Descriptions.Item>
          <Descriptions.Item label="Address">{orDash(pending?.profile.address ?? profile?.address)}</Descriptions.Item>
          <Descriptions.Item label="City">{orDash(pending?.profile.city ?? profile?.city)}</Descriptions.Item>
          <Descriptions.Item label="Country">{orDash(pending?.profile.country ?? profile?.country)}</Descriptions.Item>
          <Descriptions.Item label="Description">{orDash(pending?.profile.description ?? profile?.description)}</Descriptions.Item>
          <Descriptions.Item label="Logo">
            {(pending?.profile.logo_url ?? profile?.logo_url)
              ? <Image width={120} src={pending?.profile.logo_url ?? profile?.logo_url} />
              : '—'}
          </Descriptions.Item>
        </Descriptions>

        {pending && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
            Values shown above are your <strong>proposed</strong> changes. They replace the live
            profile only after approval.
          </Typography.Paragraph>
        )}
      </Card>

      <Card title="Change history">
        <Table
          rowKey="id"
          columns={historyColumns}
          dataSource={history ?? []}
          pagination={false}
          locale={{ emptyText: 'No profile changes yet' }}
        />
      </Card>

      <Modal
        title="Edit company profile"
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText="Submit for approval"
        confirmLoading={updateMutation.isPending}
        width={600}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Changes require approval"
          description="Submitting sends your changes to the platform for review. The current profile stays live until they approve it."
        />
        <Form form={form} layout="vertical">
          <Form.Item name="legal_name" label="Legal name">
            <Input placeholder="Registered legal name" />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle" align="start">
            <Form.Item name="email" label="Email" style={{ flex: 1 }}>
              <Input type="email" />
            </Form.Item>
            <Form.Item name="phone" label="Phone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="middle" align="start">
            <Form.Item name="website" label="Website" style={{ flex: 1 }}>
              <Input placeholder="https://example.com" />
            </Form.Item>
            <Form.Item name="tax_id" label="Tax / registration no." style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle" align="start">
            <Form.Item name="city" label="City" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="country" label="Country" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="logo_url" label="Logo URL">
            <Input placeholder="https://…/logo.png" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

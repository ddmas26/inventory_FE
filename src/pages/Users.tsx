import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Card, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { usersApi } from '../api/users';
import { rolesApi } from '../api/roles';
import type { UserDto } from '../types';

export default function Users() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersApi.list(1, 100, search),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
  });

  const invalidateUserRelated = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role_id?: string | null }) =>
      usersApi.create(data),
    onSuccess: () => {
      invalidateUserRelated();
      message.success('User created');
      setCreateModalOpen(false);
      createForm.resetFields();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; email: string; role_id?: string | null }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      invalidateUserRelated();
      message.success('User updated');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      invalidateUserRelated();
      message.success('User deleted');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: usersApi.activate,
    onSuccess: () => {
      invalidateUserRelated();
      message.success('User activated');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => {
      invalidateUserRelated();
      message.success('User deactivated');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const openCreate = () => {
    createForm.resetFields();
    setCreateModalOpen(true);
  };

  const openEdit = (user: UserDto) => {
    setEditing(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role_id: user.role_id,
    });
    setModalOpen(true);
  };

  const handleCreateOk = () => {
    createForm.validateFields().then((values) => {
      createMutation.mutate(values);
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editing) {
        updateMutation.mutate({ id: editing.id, ...values });
      }
    });
  };

  const roleMap = new Map((rolesData ?? []).map((r) => [r.id, r.name]));
  const roleColors = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'];
  const getRoleColor = (name: string) => roleColors[name.length % roleColors.length];

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => v ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },
    {
      title: 'Role',
      dataIndex: 'role_id',
      key: 'role_id',
      render: (roleId: string | null) => {
        const roleName = roleId ? roleMap.get(roleId) : null;
        return roleName
          ? <Tag color={getRoleColor(roleName)}>{roleName}</Tag>
          : <Typography.Text type="secondary">—</Typography.Text>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: UserDto) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          {record.is_active ? (
            <Popconfirm title="Deactivate this user?" onConfirm={() => deactivateMutation.mutate(record.id)}>
              <Button icon={<CloseCircleOutlined />} size="small" danger>
                Deactivate
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="Activate this user?" onConfirm={() => activateMutation.mutate(record.id)}>
              <Button icon={<CheckCircleOutlined />} size="small" type="primary">
                Activate
              </Button>
            </Popconfirm>
          )}
          <Popconfirm title="Delete this user?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Users"
        extra={
          <Space>
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add User
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, total: data?.total ?? 0 }}
        />
      </Card>

      <Modal
        title="Create User"
        open={createModalOpen}
        onOk={handleCreateOk}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        confirmLoading={createMutation.isPending}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role_id" label="Role">
            <Select
              allowClear
              placeholder="Select role"
              options={(rolesData ?? []).map((r) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit User"
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role_id" label="Role">
            <Select
              allowClear
              placeholder="Select role"
              options={(rolesData ?? []).map((r) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

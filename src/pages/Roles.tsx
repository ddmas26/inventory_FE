import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, Input, Space, Popconfirm, message,
  Card, Tag, Typography, Popover, Badge, Divider,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined,
} from '@ant-design/icons';
import { rolesApi } from '../api/roles';
import { permissionsApi } from '../api/permissions';
import type { RoleWithPermissionsResponse, PermissionResponse } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Extract the module name from a permission code (e.g. "products.create" → "products") */
function moduleFromCode(code: string): string {
  return code.split('.')[0];
}

/** Capitalize first letter */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Prettify action name from code (e.g. "products.create" → "Create") */
function actionFromCode(code: string): string {
  return capitalize(code.split('.')[1] ?? code);
}

/** Module display colours */
const moduleColors: Record<string, string> = {
  products: 'blue',
  inventories: 'cyan',
  stock: 'green',
  users: 'purple',
  roles: 'geekblue',
  permissions: 'magenta',
  dashboard: 'gold',
};

/** Group permissions by their module prefix */
function groupByModule(permissions: PermissionResponse[]): Record<string, PermissionResponse[]> {
  const groups: Record<string, PermissionResponse[]> = {};
  for (const p of permissions) {
    const mod = moduleFromCode(p.code);
    if (!groups[mod]) groups[mod] = [];
    groups[mod].push(p);
  }
  return groups;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Roles() {
  const queryClient = useQueryClient();
  const [roleModal, setRoleModal] = useState(false);
  const [editing, setEditing] = useState<RoleWithPermissionsResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissionsResponse | null>(null);
  const [roleForm] = Form.useForm();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
  });

  const { data: allPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Role created');
      setRoleModal(false);
      roleForm.resetFields();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description: string }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Role updated');
      setRoleModal(false);
      setEditing(null);
      roleForm.resetFields();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Role deleted');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const addPermMutation = useMutation({
    mutationFn: ({ roleId, permId }: { roleId: string; permId: string }) =>
      rolesApi.addPermission(roleId, permId),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRole(updatedRole);
      message.success('Permission added to role');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const removePermMutation = useMutation({
    mutationFn: ({ roleId, permId }: { roleId: string; permId: string }) =>
      rolesApi.removePermission(roleId, permId),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRole(updatedRole);
      message.success('Permission removed from role');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    roleForm.resetFields();
    setRoleModal(true);
  };

  const openEdit = (role: RoleWithPermissionsResponse) => {
    setEditing(role);
    roleForm.setFieldsValue(role);
    setRoleModal(true);
  };

  const handleRoleOk = () => {
    roleForm.validateFields().then((values) => {
      if (editing) {
        updateMutation.mutate({ id: editing.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    });
  };

  // ── Permissions column renderer ────────────────────────────
  const renderPermissions = (_: unknown, record: RoleWithPermissionsResponse) => {
    const grouped = groupByModule(record.permissions);
    const modules = Object.keys(grouped).sort();

    if (modules.length === 0) {
      return <Typography.Text type="secondary">None</Typography.Text>;
    }

    return (
      <Space wrap size={[4, 6]}>
        {modules.map((mod) => {
          const perms = grouped[mod];
          const color = moduleColors[mod] ?? 'default';
          const allActions = perms.map((p) => ({
            id: p.id,
            action: actionFromCode(p.code),
            code: p.code,
          }));

          const popoverContent = (
            <div style={{ minWidth: 180 }}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                {capitalize(mod)} — {perms.length} permission{perms.length > 1 ? 's' : ''}
              </Typography.Text>
              <Divider style={{ margin: '8px 0' }} />
              <Space wrap size={4}>
                {allActions.map((a) => (
                  <Tag
                    key={a.id}
                    color={color}
                    style={{ margin: 0, cursor: 'pointer' }}
                    closable
                    onClose={(e) => {
                      e.preventDefault();
                      removePermMutation.mutate({ roleId: record.id, permId: a.id });
                    }}
                  >
                    {a.action}
                  </Tag>
                ))}
              </Space>
            </div>
          );

          return (
            <Popover
              key={mod}
              content={popoverContent}
              title={null}
              trigger="hover"
              placement="top"
              mouseEnterDelay={0.2}
            >
              <Tag
                color={color}
                style={{ cursor: 'pointer', fontWeight: 500, padding: '2px 10px' }}
              >
                {capitalize(mod)}
                <Badge
                  count={perms.length}
                  size="small"
                  style={{
                    backgroundColor: '#fff',
                    color: color === 'gold' ? '#d48806' : '#1677ff',
                    fontSize: 10,
                    marginLeft: 6,
                    boxShadow: 'none',
                  }}
                />
              </Tag>
            </Popover>
          );
        })}
      </Space>
    );
  };

  const roleColors = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'];
  const getRoleColor = (name: string) => roleColors[name.length % roleColors.length];

  // ── Table columns ──────────────────────────────────────────
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string) => <Tag color={getRoleColor(name)}>{name}</Tag>,
    },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Users',
      dataIndex: 'user_count',
      key: 'user_count',
      width: 80,
      render: (count: number) => <Tag>{count}</Tag>,
    },
    {
      title: 'Permissions',
      key: 'permissions',
      render: renderPermissions,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: RoleWithPermissionsResponse) => (
        <Space>
          <Button
            icon={<LinkOutlined />}
            size="small"
            onClick={() => setSelectedRole(record)}
            title="Add Permission"
          />
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this role?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <Card
        title="Roles"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Role</Button>}
      >
        <Table
          dataSource={roles ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </Card>

      {/* Role Create/Edit Modal */}
      <Modal
        title={editing ? 'Edit Role' : 'Create Role'}
        open={roleModal}
        onOk={handleRoleOk}
        onCancel={() => { setRoleModal(false); setEditing(null); roleForm.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Permission to Role Modal */}
      <Modal
        title={`Permissions for "${selectedRole?.name ?? ''}"`}
        open={!!selectedRole}
        onCancel={() => setSelectedRole(null)}
        footer={null}
        width={520}
      >
        {selectedRole && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {allPermissions && allPermissions.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {Object.entries(groupByModule(allPermissions)).sort().map(([mod, perms]) => {
                  const assignedIds = new Set(selectedRole.permissions.map((p) => p.id));
                  const color = moduleColors[mod] ?? 'default';
                  return (
                    <div key={mod}>
                      <Typography.Text
                        strong
                        style={{ fontSize: 12, textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: 4 }}
                      >
                        {capitalize(mod)}
                      </Typography.Text>
                      <Space wrap size={4}>
                        {perms.map((p) => {
                          const isAssigned = assignedIds.has(p.id);
                          return (
                            <Tag
                              key={p.id}
                              color={color}
                              style={{
                                cursor: 'pointer',
                                opacity: isAssigned ? 0.55 : 1,
                                padding: '2px 10px',
                              }}
                              onClick={() => {
                                if (isAssigned) {
                                  removePermMutation.mutate({ roleId: selectedRole.id, permId: p.id });
                                } else {
                                  addPermMutation.mutate({ roleId: selectedRole.id, permId: p.id });
                                }
                              }}
                            >
                              {actionFromCode(p.code)}
                            </Tag>
                          );
                        })}
                      </Space>
                    </div>
                  );
                })}
              </Space>
            ) : (
              <Typography.Text type="secondary">No permissions available.</Typography.Text>
            )}
          </Space>
        )}
      </Modal>
    </>
  );
}

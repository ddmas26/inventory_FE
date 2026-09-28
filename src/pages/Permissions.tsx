import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Tag, Typography, Space, message, Row, Col } from 'antd';
import { CheckCircleFilled, MinusCircleOutlined } from '@ant-design/icons';
import { rolesApi } from '../api/roles';
import { permissionsApi } from '../api/permissions';
import type { RoleWithPermissionsResponse } from '../types';

// ── Allowed modules and verbs ──────────────────────────────────────────
const MODULES = ['products', 'inventories', 'stock', 'users', 'roles', 'permissions', 'dashboard'] as const;

const VERBS_BY_MODULE: Record<string, string[]> = {
  products: ['create', 'read', 'edit', 'delete'],
  inventories: ['create', 'read', 'edit', 'delete'],
  stock: ['create', 'read', 'edit', 'delete'],
  users: ['create', 'read', 'edit', 'delete'],
  roles: ['create', 'read', 'edit', 'delete'],
  permissions: ['create', 'read', 'edit', 'delete'],
  dashboard: ['read'],
};

const MODULE_LABELS: Record<string, string> = {
  products: 'Products',
  inventories: 'Inventories',
  stock: 'Stock',
  users: 'Users',
  roles: 'Roles',
  permissions: 'Permissions',
  dashboard: 'Dashboard',
};

const VERB_LABELS: Record<string, string> = {
  create: 'Create',
  read: 'Read',
  edit: 'Edit',
  delete: 'Delete',
};

const MODULE_COLORS: Record<string, string> = {
  products: 'blue',
  inventories: 'cyan',
  stock: 'green',
  users: 'purple',
  roles: 'geekblue',
  permissions: 'magenta',
  dashboard: 'gold',
};

/** Build a set of permission codes for a role for fast lookup */
function buildPermSet(role: RoleWithPermissionsResponse): Set<string> {
  return new Set(role.permissions.map((p) => p.code));
}

/** Capitalize first letter */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Verb display helper */
function verbLabel(verb: string): string {
  return VERB_LABELS[verb] ?? capitalize(verb);
}

// ── Component ─────────────────────────────────────────────────────────

export default function Permissions() {
  const queryClient = useQueryClient();

  // Fetch all roles (with permissions) and all available permission codes
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
  });

  const { data: allPermissions, isLoading: permsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.list(),
  });

  // Build a lookup: permission code → permission id
  const permCodeToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of allPermissions ?? []) {
      map.set(p.code, p.id);
    }
    return map;
  }, [allPermissions]);

  // Mutations for toggling permissions
  const addPermMutation = useMutation({
    mutationFn: ({ roleId, permId }: { roleId: string; permId: string }) =>
      rolesApi.addPermission(roleId, permId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  const removePermMutation = useMutation({
    mutationFn: ({ roleId, permId }: { roleId: string; permId: string }) =>
      rolesApi.removePermission(roleId, permId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  const handleToggle = (role: RoleWithPermissionsResponse, code: string) => {
    const permId = permCodeToId.get(code);
    if (!permId) return;

    const hasIt = buildPermSet(role).has(code);
    if (hasIt) {
      removePermMutation.mutate({ roleId: role.id, permId });
    } else {
      addPermMutation.mutate({ roleId: role.id, permId });
    }
  };

  const loading = rolesLoading || permsLoading;

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        Permissions
      </Typography.Title>

      <Row gutter={[16, 16]}>
        {(roles ?? []).map((role) => (
          <Col xs={24} lg={12} key={role.id}>
            <RoleCard
              role={role}
              permSet={buildPermSet(role)}
              onToggle={handleToggle}
              loading={addPermMutation.isPending || removePermMutation.isPending}
            />
          </Col>
        ))}
      </Row>

      {!loading && (roles ?? []).length === 0 && (
        <Typography.Text type="secondary">No roles found.</Typography.Text>
      )}
    </div>
  );
}

// ── Role Card Sub-component ────────────────────────────────────────────

function RoleCard({
  role,
  permSet,
  onToggle,
  loading,
}: {
  role: RoleWithPermissionsResponse;
  permSet: Set<string>;
  onToggle: (role: RoleWithPermissionsResponse, code: string) => void;
  loading: boolean;
}) {
  const roleColors = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'];
  const roleColor = roleColors[role.name.length % roleColors.length];

  return (
    <Card
      title={
        <Space>
          <Tag color={roleColor} style={{ fontSize: 14, fontWeight: 600, padding: '2px 12px' }}>
            {role.name}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {role.description}
          </Typography.Text>
        </Space>
      }
      style={{ height: '100%' }}
    >
      {MODULES.map((mod) => {
        const verbs = VERBS_BY_MODULE[mod];
        const color = MODULE_COLORS[mod] ?? 'default';
        const hasAny = verbs.some((v) => permSet.has(`${mod}.${v}`));

        return (
          <div key={mod} style={{ marginBottom: 14, opacity: hasAny ? 1 : 0.5 }}>
            <Typography.Text
              strong
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                color: '#666',
                display: 'block',
                marginBottom: 6,
              }}
            >
              {MODULE_LABELS[mod]}
            </Typography.Text>
            <Space wrap size={[6, 6]}>
              {verbs.map((verb) => {
                const code = `${mod}.${verb}`;
                const hasIt = permSet.has(code);
                return (
                  <Tag
                    key={code}
                    color={hasIt ? color : undefined}
                    style={{
                      cursor: loading ? 'not-allowed' : 'pointer',
                      padding: '2px 10px',
                      fontSize: 13,
                      userSelect: 'none',
                      opacity: hasIt ? 1 : 0.65,
                      border: hasIt ? undefined : `1px solid #d9d9d9`,
                      background: hasIt ? undefined : '#fafafa',
                    }}
                    onClick={() => !loading && onToggle(role, code)}
                    icon={
                      hasIt ? (
                        <CheckCircleFilled style={{ marginRight: 4 }} />
                      ) : (
                        <MinusCircleOutlined style={{ marginRight: 4, color: '#bbb' }} />
                      )
                    }
                  >
                    {verbLabel(verb)}
                  </Tag>
                );
              })}
            </Space>
          </div>
        );
      })}
    </Card>
  );
}

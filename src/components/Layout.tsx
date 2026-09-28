import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Dropdown, Space, Avatar } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  HomeOutlined,
  StockOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  KeyOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

type MenuItem = { key: string; icon: React.ReactNode; label: string; perm: string };

const allMainItems: MenuItem[] = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard', perm: 'dashboard.read' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Products', perm: 'products.read' },
  { key: '/inventories', icon: <HomeOutlined />, label: 'Inventories', perm: 'inventories.read' },
  { key: '/stock', icon: <StockOutlined />, label: 'Stock', perm: 'stock.read' },
];

const allAdminItems: MenuItem[] = [
  { key: '/users', icon: <TeamOutlined />, label: 'Users', perm: 'users.read' },
  { key: '/roles', icon: <SafetyOutlined />, label: 'Roles', perm: 'roles.read' },
  { key: '/permissions', icon: <KeyOutlined />, label: 'Permissions', perm: 'permissions.read' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const mainMenuItems = useMemo(
    () => allMainItems.filter((m) => hasPermission(m.perm)),
    [hasPermission],
  );
  const adminMenuItems = useMemo(
    () => allAdminItems.filter((m) => hasPermission(m.perm)),
    [hasPermission],
  );

  const currentLabel = [...mainMenuItems, ...adminMenuItems]
    .find((m) => m.key === location.pathname)?.label || 'Inventory Management';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? 'Inv' : 'Inventory'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            { key: 'main', type: 'group', label: collapsed ? '' : 'Inventory', children: mainMenuItems },
            ...(adminMenuItems.length > 0
              ? [
                  { type: 'divider' as const },
                  { key: 'admin', type: 'group' as const, label: collapsed ? '' : 'Administration', children: adminMenuItems },
                ]
              : []),
          ]}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{currentLabel}</span>
          <Dropdown
            menu={{
              items: [
                { key: 'profile', label: user?.name, disabled: true },
                { type: 'divider' },
                {
                  key: 'logout', label: 'Logout', icon: <LogoutOutlined />,
                  danger: true,
                  onClick: async () => { await logout(); navigate('/login'); },
                },
              ],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

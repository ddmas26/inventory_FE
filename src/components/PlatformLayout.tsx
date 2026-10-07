import { Layout, Menu, Typography, Button, Space, Tag } from 'antd';
import { DashboardOutlined, BankOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '../contexts/PlatformAuthContext';

const { Header, Sider, Content } = Layout;

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = usePlatformAuth();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            Platform
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            { key: '/platform', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: '/platform/companies', icon: <BankOutlined />, label: 'Companies' },
          ]}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 600 }}>Platform administration</span>
          <Space>
            {user?.name && <Tag color="geekblue">{user.name}</Tag>}
            <Button
              icon={<LogoutOutlined />}
              onClick={async () => {
                await logout();
                navigate('/platform/login');
              }}
            >
              Sign out
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}

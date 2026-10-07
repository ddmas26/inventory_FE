import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Redirect an already-authenticated visitor away from /login. This must run in
  // an effect: calling navigate() during render triggers a React warning and can
  // loop between /login and / when the stored token turns out to be stale.
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Login successful');
      navigate('/', { replace: true });
    } catch (err) {
      message.error((err as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: 24,
    }}>
      <Card style={{ width: 420, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Inventory Management
        </Typography.Title>
        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="your@email.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Login
          </Button>
        </Form>
        <Divider plain>New here?</Divider>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
          <Link to="/register">Register your company</Link>
          <Link to="/platform/login">Platform admin login</Link>
        </div>
      </Card>
    </div>
  );
}

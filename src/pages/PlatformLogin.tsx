import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Tag } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { usePlatformAuth } from '../contexts/PlatformAuthContext';

export default function PlatformLogin() {
  const { login, isAuthenticated } = usePlatformAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/platform', { replace: true });
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Signed in');
      navigate('/platform', { replace: true });
    } catch (err) {
      message.error((err as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        padding: 24,
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Tag icon={<SafetyOutlined />} color="geekblue">
            Platform
          </Tag>
        </div>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Platform admin
        </Typography.Title>
        <Form onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="platform@inventory.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign in
          </Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login">Back to company login</Link>
        </div>
      </Card>
    </div>
  );
}

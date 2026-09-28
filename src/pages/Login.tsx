import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  if (isAuthenticated) {
    navigate('/', { replace: true });
  }

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Login successful');
      navigate('/', { replace: true });
    } catch (err: any) {
      message.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      await register(values);
      message.success('Registration successful! You can now log in.');
      form.resetFields();
    } catch (err: any) {
      message.error(err.message || 'Registration failed');
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
    }}>
      <Card style={{ width: 420, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Inventory Management
        </Typography.Title>
        <Tabs
          centered
          items={[
            {
              key: 'login',
              label: 'Login',
              children: (
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
              ),
            },
            {
              key: 'register',
              label: 'Register',
              children: (
                <Form onFinish={handleRegister} layout="vertical" size="large">
                  <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}>
                    <Input prefix={<UserOutlined />} placeholder="Full name" />
                  </Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<MailOutlined />} placeholder="your@email.com" />
                  </Form.Item>
                  <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Min. 8 characters" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    Register
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

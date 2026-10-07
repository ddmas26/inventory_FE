import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Result } from 'antd';
import {
  ShopOutlined,
  PhoneOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { authApi } from '../api/auth';
import type { RegisterRequest } from '../types';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onFinish = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      await authApi.register(values);
      setDone(true);
    } catch (err) {
      message.error((err as Error).message || 'Registration failed');
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
        background: '#f0f2f5',
        padding: 24,
      }}
    >
      <Card style={{ width: 460, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {done ? (
          <Result
            status="success"
            title="Registration submitted"
            subTitle="Your company is pending approval. You can sign in, but full access is unlocked once a platform admin approves it."
            extra={
              <Link to="/login">
                <Button type="primary">Back to login</Button>
              </Link>
            }
          />
        ) : (
          <>
            <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
              Register your company
            </Typography.Title>
            <Form onFinish={onFinish} layout="vertical" size="large">
              <Form.Item name="company_name" label="Company name" rules={[{ required: true, min: 2 }]}>
                <Input prefix={<ShopOutlined />} placeholder="Acme Inc." />
              </Form.Item>
              <Form.Item name="company_phone" label="Company phone" rules={[{ required: true }]}>
                <Input prefix={<PhoneOutlined />} placeholder="+1 555 000 0000" />
              </Form.Item>
              <Form.Item name="name" label="Your name" rules={[{ required: true, min: 2 }]}>
                <Input prefix={<UserOutlined />} placeholder="Full name" />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input prefix={<MailOutlined />} placeholder="you@company.com" />
              </Form.Item>
              <Form.Item name="phone" label="Your phone" rules={[{ required: true }]}>
                <Input prefix={<PhoneOutlined />} placeholder="+1 555 000 0000" />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Min. 8 characters" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Register company
              </Button>
            </Form>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login">Already have an account? Sign in</Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

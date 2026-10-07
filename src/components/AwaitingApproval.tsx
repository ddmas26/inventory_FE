import { useState } from 'react';
import { Result, Button, Typography, Space } from 'antd';
import { useAuth } from '../contexts/AuthContext';

type Info = {
  status: 'info' | 'error' | 'warning';
  title: string;
  sub: string;
};

const MESSAGES: Record<string, Info> = {
  pending: {
    status: 'info',
    title: 'Awaiting approval',
    sub: 'Your company registration is under review. Full access unlocks as soon as a platform admin approves it.',
  },
  rejected: {
    status: 'error',
    title: 'Registration rejected',
    sub: 'Your company registration was rejected. Please contact the platform administrator.',
  },
  suspended: {
    status: 'warning',
    title: 'Account suspended',
    sub: 'Your company has been suspended. Please contact the platform administrator.',
  },
};

/** Full-screen gate shown to users whose company is not (yet) approved. */
export default function AwaitingApproval() {
  const { companyName, companyStatus, refreshClaims, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const info = MESSAGES[companyStatus ?? 'pending'] ?? MESSAGES.pending;

  const check = async () => {
    setChecking(true);
    try {
      await refreshClaims();
    } finally {
      setChecking(false);
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
      }}
    >
      <Result
        status={info.status}
        title={info.title}
        subTitle={
          <Space direction="vertical" size={4}>
            {companyName && <Typography.Text strong>{companyName}</Typography.Text>}
            <span>{info.sub}</span>
          </Space>
        }
        extra={[
          <Button key="check" type="primary" loading={checking} onClick={check}>
            Check again
          </Button>,
          <Button key="logout" onClick={() => logout()}>
            Sign out
          </Button>,
        ]}
      />
    </div>
  );
}

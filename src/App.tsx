import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './contexts/AuthContext';
import { usePlatformAuth } from './contexts/PlatformAuthContext';
import AppLayout from './components/Layout';
import PlatformLayout from './components/PlatformLayout';
import AwaitingApproval from './components/AwaitingApproval';
import Login from './pages/Login';
import Register from './pages/Register';
import PlatformLogin from './pages/PlatformLogin';
import PlatformDashboard from './pages/PlatformDashboard';
import PlatformCompanies from './pages/PlatformCompanies';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventories from './pages/Inventories';
import StockPage from './pages/Stock';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';

/** Full-page spinner shown while the session claims are being revalidated. */
function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Spin size="large" />
    </div>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, companyStatus, claimsReady } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // A token in localStorage proves nothing about the company's approval state, so
  // hold the shell back until /auth/me answers. Without this, opening the app in a
  // fresh tab rendered the entire layout (products, inventories, stock…) for a
  // company that was never approved.
  if (!claimsReady) return <LoadingScreen />;
  // Anything other than an explicit "approved" — pending, rejected, suspended or an
  // unknown status — keeps the user on the gate.
  if (companyStatus !== 'approved') return <AwaitingApproval />;
  return <AppLayout>{children}</AppLayout>;
}

function PlatformProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = usePlatformAuth();
  if (!isAuthenticated) return <Navigate to="/platform/login" replace />;
  return <PlatformLayout>{children}</PlatformLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Platform (operator) area */}
      <Route path="/platform/login" element={<PlatformLogin />} />
      <Route path="/platform" element={<PlatformProtected><PlatformDashboard /></PlatformProtected>} />
      <Route path="/platform/companies" element={<PlatformProtected><PlatformCompanies /></PlatformProtected>} />

      {/* Company (tenant) area */}
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/products" element={<ProtectedLayout><Products /></ProtectedLayout>} />
      <Route path="/inventories" element={<ProtectedLayout><Inventories /></ProtectedLayout>} />
      <Route path="/stock" element={<ProtectedLayout><StockPage /></ProtectedLayout>} />
      <Route path="/users" element={<ProtectedLayout><Users /></ProtectedLayout>} />
      <Route path="/roles" element={<ProtectedLayout><Roles /></ProtectedLayout>} />
      <Route path="/permissions" element={<ProtectedLayout><Permissions /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

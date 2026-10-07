import { Routes, Route, Navigate } from 'react-router-dom';
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

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, companyStatus } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Companies that are not approved (pending/rejected/suspended) only see the
  // "awaiting approval" screen, regardless of what they try to reach.
  if (companyStatus && companyStatus !== 'approved') return <AwaitingApproval />;
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

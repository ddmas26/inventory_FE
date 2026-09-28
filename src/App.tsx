import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventories from './pages/Inventories';
import StockPage from './pages/Stock';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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

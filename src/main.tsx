import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { PlatformAuthProvider } from './contexts/PlatformAuthContext';
import { ApiError } from './api/client';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 401 — the session is gone, the user is sent to login.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
        <BrowserRouter>
          <AuthProvider>
            <PlatformAuthProvider>
              <App />
            </PlatformAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

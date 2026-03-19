import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Schedules from './pages/Schedules';
import Contacts from './pages/Contacts';
import History from './pages/History';
import Settings from './pages/Settings';

function NeonSpinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div className="spinner-neon" />
      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>loading...</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <NeonSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <NeonSpinner />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1f2d',
              color: '#e8f5e9',
              border: '1px solid #1a3a4a',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#00e676', secondary: '#060d17' },
            },
            error: {
              iconTheme: { primary: '#ff1744', secondary: '#060d17' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

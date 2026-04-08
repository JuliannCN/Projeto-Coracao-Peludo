import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import Header from './components/Header';

// Pages
import Home from './pages/Home';
import PetsList from './pages/PetsList';
import PetDetails from './pages/PetDetails';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import UserDashboard from './pages/UserDashboard';
import OngDashboard from './pages/OngDashboard';
import Forum from './pages/Forum';
import ForumPost from './pages/ForumPost';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-pulse text-[#564F62]">Carregando...</div>
      </div>
    );
  }

  if (!user || user === false) {
    return <Navigate to="/auth?mode=login" state={{ from: location }} replace />;
  }

  return children;
}

// Dashboard Router - redirects based on user type
function DashboardRouter() {
  const { user } = useAuth();
  
  if (user?.user_type === 'ong' || user?.user_type === 'admin') {
    return <OngDashboard />;
  }
  
  return <UserDashboard />;
}

// Main App Router
function AppRouter() {
  const location = useLocation();
  
  // Check for OAuth callback session_id BEFORE rendering routes
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/pets" element={<PetsList />} />
      <Route path="/pets/:id" element={<PetDetails />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/forum/:id" element={<ForumPost />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />
      <Route path="/messages/:partnerId" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Layout wrapper
function Layout({ children }) {
  const location = useLocation();
  const hideHeader = location.pathname === '/auth' || location.pathname === '/auth/callback';
  
  return (
    <>
      {!hideHeader && <Header />}
      <main>{children}</main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <AppRouter />
        </Layout>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

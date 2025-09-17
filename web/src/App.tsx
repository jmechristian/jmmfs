import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import PublicLeaderboardPage from './pages/PublicLeaderboardPage';
import AdminPage from './pages/AdminPage';
import AdminSpreadPage from './pages/AdminSpreadPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - user:', user, 'loading:', loading);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-nfl-primary'></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to='/login' />;
};

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginForm onToggleMode={() => setIsLogin(false)} />
  ) : (
    <RegisterForm onToggleMode={() => setIsLogin(true)} />
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  console.log('AppRoutes - user:', user);

  return (
    <Routes>
      <Route path='/login' element={<AuthPage />} />
      <Route path='/register' element={<AuthPage />} />
      <Route path='/public-leaderboard' element={<PublicLeaderboardPage />} />
      <Route path='/leaderboard-public' element={<PublicLeaderboardPage />} />
      <Route path='/standings' element={<PublicLeaderboardPage />} />
      <Route
        path='/'
        element={
          <ProtectedRoute>
            <Layout>
              <HomePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/leaderboard'
        element={
          <ProtectedRoute>
            <Layout>
              <LeaderboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin'
        element={
          <ProtectedRoute>
            <Layout>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/spreads'
        element={
          <ProtectedRoute>
            <Layout>
              <AdminSpreadPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path='*' element={<Navigate to='/' />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

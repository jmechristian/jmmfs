import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Trophy,
  Calendar,
  Users,
  Settings,
  LogOut,
  User,
  Shield,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-nfl-primary text-white shadow-lg'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <Trophy className='h-8 w-8 text-nfl-gold mr-3' />
              <h1 className='text-xl font-bold'>
                The James Murray Memorial Football Showdown
              </h1>
            </div>

            {user && (
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  <User className='h-5 w-5' />
                  <span className='text-sm'>{user.displayName}</span>
                  {user.role === 'admin' && (
                    <Shield className='h-4 w-4 text-nfl-gold' title='Admin' />
                  )}
                </div>
                <button
                  onClick={logout}
                  className='flex items-center space-x-1 text-sm hover:text-nfl-gold transition-colors'
                >
                  <LogOut className='h-4 w-4' />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      {user && (
        <nav className='bg-white shadow-sm border-b'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex space-x-8'>
              <Link
                to='/'
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/')
                    ? 'border-nfl-primary text-nfl-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className='h-4 w-4' />
                <span>Current Week</span>
              </Link>

              <Link
                to='/leaderboard'
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/leaderboard')
                    ? 'border-nfl-primary text-nfl-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className='h-4 w-4' />
                <span>Leaderboard</span>
              </Link>

              {user.role === 'admin' && (
                <>
                  <Link
                    to='/admin'
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      isActive('/admin')
                        ? 'border-nfl-primary text-nfl-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings className='h-4 w-4' />
                    <span>Admin</span>
                  </Link>
                  <Link
                    to='/admin/spreads'
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      isActive('/admin/spreads')
                        ? 'border-nfl-primary text-nfl-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Shield className='h-4 w-4' />
                    <span>Spread Management</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {children}
      </main>
    </div>
  );
};

export default Layout;

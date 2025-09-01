import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/tenant-provider';

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { tenant } = useTenant();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {tenant?.companyName || 'ERP System'}
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/"
                  className="text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium"
                >
                  Dashboard
                </a>
                <a
                  href="#"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
                >
                  Customers
                </a>
                <a
                  href="#"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
                >
                  Inventory
                </a>
                <a
                  href="#"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
                >
                  Reports
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-2">
                <div className="text-sm">
                  <p className="text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.[0] || 'U'}
                  </span>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
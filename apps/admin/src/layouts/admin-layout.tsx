import React from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { 
  LayoutDashboard, 
  Building2, 
  Settings, 
  Users, 
  CreditCard, 
  BarChart3, 
  Database, 
  LogOut,
  Shield,
  Package
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tenants', href: '/tenants', icon: Building2 },
    { name: 'Modules', href: '/modules', icon: Package },
    { name: 'System Status', href: '/system', icon: Database },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-800">
            <Shield className="h-8 w-8 text-indigo-400" />
            <h1 className="ml-3 text-lg font-semibold text-white">
              Super Admin Portal
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col overflow-y-auto">
            <ul role="list" className="flex flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.name}>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold mx-2 ${
                              isActive
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`
                          }
                        >
                          <Icon className="h-6 w-6 shrink-0" />
                          {item.name}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>

          {/* User menu */}
          <div className="flex flex-col gap-y-4 px-4 py-4 border-t border-gray-700">
            <div className="flex items-center gap-x-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.[0] || 'S'}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-400 hover:text-white hover:bg-gray-800 w-full text-left"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
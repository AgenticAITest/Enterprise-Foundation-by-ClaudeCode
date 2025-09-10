import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { TenantAdminProvider, useTenantAdmin } from '@/providers/tenant-admin-provider';
import { 
  Users, 
  Shield, 
  Database, 
  BarChart3, 
  Settings, 
  FileText,
  Menu,
  X,
  Building2,
  LogOut,
  DollarSign,
  Link as LinkIcon
} from 'lucide-react';

/**
 * Simplified Tenant Admin Layout (no pseudo-selectors)
 * Layout for tenant administrators with navigation and admin features
 */
const TenantAdminLayoutInner: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin, isLoading } = useTenantAdmin();

  console.log('TenantAdminLayout - isLoading:', isLoading, 'isAdmin:', isAdmin);

  // Mock user data - in real app, this would come from auth context
  const user = {
    name: 'John Admin',
    email: 'admin@company.com',
    role: 'Tenant Administrator',
    tenant: 'Acme Corporation'
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ 
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  // TEMPORARILY DISABLED FOR TESTING - ALLOW ALL ACCESS
  // if (!isAdmin) {
  //   console.log('User is not admin, redirecting to home');
  //   return <Navigate to="/" replace />;
  // }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: BarChart3,
      current: location.pathname === '/admin'
    },
    {
      name: 'Module Dashboard', 
      href: '/admin/modules',
      icon: Database,
      current: location.pathname === '/admin/modules'
    },
    {
      name: 'User Management',
      href: '/admin/users', 
      icon: Users,
      current: location.pathname.startsWith('/admin/users')
    },
    {
      name: 'Role Management',
      href: '/admin/roles',
      icon: Shield, 
      current: location.pathname.startsWith('/admin/roles')
    },
    {
      name: 'Data Scopes',
      href: '/admin/data-scopes',
      icon: Database,
      current: location.pathname.startsWith('/admin/data-scopes')
    },
    {
      name: 'Audit Logs',
      href: '/admin/audit',
      icon: FileText,
      current: location.pathname.startsWith('/admin/audit')
    },
    {
      name: 'Settings',
      href: '/admin/settings', 
      icon: Settings,
      current: location.pathname.startsWith('/admin/settings')
    },
    {
      name: 'Tenants',
      href: '/admin/tenants',
      icon: Building2,
      current: location.pathname.startsWith('/admin/tenants')
    },
    {
      name: 'Currencies',
      href: '/admin/currencies',
      icon: DollarSign,
      current: location.pathname.startsWith('/admin/currencies')
    },
    {
      name: 'Integrations',
      href: '/admin/integrations',
      icon: LinkIcon,
      current: location.pathname.startsWith('/admin/integrations')
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed for desktop, hidden by default on mobile */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '256px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        zIndex: 50,
        transform: window.innerWidth >= 1024 ? 'translateX(0)' : (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'),
        transition: 'transform 0.3s ease-in-out'
      }}>
        {/* Sidebar header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} color="#3b82f6" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                Admin Portal
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {user.tenant}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: item.current ? '#eff6ff' : 'transparent',
                    color: item.current ? '#2563eb' : '#374151'
                  }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {user.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '4px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        marginLeft: window.innerWidth >= 1024 ? '256px' : '0'
      }}>
        {/* Top header */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                display: window.innerWidth >= 1024 ? 'none' : 'block',
                padding: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                borderRadius: '6px'
              }}
            >
              <Menu size={20} />
            </button>
            
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Tenant Administration
              </h1>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              fontSize: '12px',
              fontWeight: '500',
              borderRadius: '6px'
            }}>
              {user.tenant}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/**
 * Main Tenant Admin Layout with Provider
 */
const TenantAdminLayoutSimple: React.FC = () => {
  return (
    <TenantAdminProvider>
      <TenantAdminLayoutInner />
    </TenantAdminProvider>
  );
};

export default TenantAdminLayoutSimple;
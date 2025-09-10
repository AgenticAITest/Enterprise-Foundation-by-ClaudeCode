import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import { 
  Users, 
  Shield, 
  Database, 
  FileText, 
  Settings,
  Activity,
  ArrowRight
} from 'lucide-react';

/**
 * Simplified Tenant Admin Dashboard
 * Main dashboard for tenant administrators (no CSS pseudo-selectors)
 */
const AdminDashboardSimple: React.FC = () => {
  const { 
    tenantModules, 
    tenantUsers, 
    tenantRoles, 
    isLoading: adminLoading,
    error: adminError
  } = useTenantAdmin();
  
  const [dashboardData, setDashboardData] = useState<any>({
    stats: {
      totalUsers: 0,
      totalRoles: 0,
      activeModules: 0,
      recentActivities: 0
    },
    modules: [],
    recentActivities: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const compileDashboardData = () => {
      try {
        setLoading(true);
        console.log('Compiling tenant admin dashboard data...');

        // Use data from admin context
        const mockData = {
          stats: {
            totalUsers: tenantUsers.length,
            totalRoles: tenantRoles.length,
            activeModules: tenantModules.filter(m => m.status === 'active').length,
            recentActivities: 28 // Mock for now
          },
          modules: tenantModules,
          recentActivities: [
            { id: 1, action: 'User assigned to WMS module', user: 'john.doe@company.com', time: '2 minutes ago', type: 'assignment' },
            { id: 2, action: 'Role permissions updated', role: 'Warehouse Manager', time: '15 minutes ago', type: 'permission' },
            { id: 3, action: 'New user registered', user: 'jane.smith@company.com', time: '1 hour ago', type: 'user' }
          ],
          alerts: [
            { id: 1, type: 'warning', message: '3 users have not logged in for 30+ days', action: 'Review inactive users' },
            { id: 2, type: 'info', message: 'Integration Module trial expires in 7 days', action: 'Upgrade subscription' }
          ]
        };

        setDashboardData(mockData);
        setError(adminError);
      } catch (err) {
        console.error('Failed to compile dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (!adminLoading) {
      compileDashboardData();
    }
  }, [tenantModules, tenantUsers, tenantRoles, adminLoading, adminError]);

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          Dashboard
        </h1>
        <div>Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          Dashboard
        </h1>
        <div style={{ 
          color: '#dc2626', 
          backgroundColor: '#fef2f2', 
          padding: '12px', 
          borderRadius: '6px',
          border: '1px solid #fecaca'
        }}>
          Error: {error}
        </div>
      </div>
    );
  }

  const { stats, recentActivities, alerts } = dashboardData;

  const quickActions = [
    {
      name: 'Manage Users',
      description: 'Add, edit, and assign roles to users',
      href: '/admin/users',
      icon: Users,
      color: '#3b82f6',
      bgColor: '#eff6ff'
    },
    {
      name: 'Role Management',
      description: 'Create and configure user roles',
      href: '/admin/roles',
      icon: Shield,
      color: '#10b981',
      bgColor: '#f0fdf4'
    },
    {
      name: 'Module Dashboard',
      description: 'View and manage active modules',
      href: '/admin/modules',
      icon: Database,
      color: '#f59e0b',
      bgColor: '#fffbeb'
    },
    {
      name: 'Audit Logs',
      description: 'Review system activities and changes',
      href: '/admin/audit',
      icon: FileText,
      color: '#8b5cf6',
      bgColor: '#faf5ff'
    }
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>
          Welcome to your tenant administration dashboard. Manage users, roles, and system settings.
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              padding: '8px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px'
            }}>
              <Users size={20} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
              Total Users
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
            {stats.totalUsers}
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Active user accounts
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              padding: '8px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px'
            }}>
              <Shield size={20} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
              Total Roles
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
            {stats.totalRoles}
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Configured roles
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              padding: '8px',
              backgroundColor: '#fffbeb',
              borderRadius: '8px'
            }}>
              <Database size={20} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
              Active Modules
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
            {stats.activeModules}
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Enabled modules
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              padding: '8px',
              backgroundColor: '#faf5ff',
              borderRadius: '8px'
            }}>
              <Activity size={20} color="#8b5cf6" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
              Recent Activities
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
            {stats.recentActivities}
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Last 24 hours
          </p>
        </div>
      </div>

      {/* System alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            System Alerts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((alert: any) => (
              <div key={alert.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: alert.type === 'warning' ? '#fef3c7' : '#dbeafe',
                border: `1px solid ${alert.type === 'warning' ? '#fcd34d' : '#93c5fd'}`,
                borderRadius: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                    {alert.message}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: alert.type === 'warning' ? '#d97706' : '#2563eb',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  {alert.action} →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Quick Actions
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '16px' 
        }}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                to={action.href}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      padding: '8px',
                      backgroundColor: action.bgColor,
                      borderRadius: '8px'
                    }}>
                      <Icon size={20} color={action.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                        {action.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {action.description}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} color="#6b7280" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activities */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Recent Activities
          </h2>
          <Link
            to="/admin/audit"
            style={{
              fontSize: '14px',
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            View all →
          </Link>
        </div>
        <div>
          {recentActivities.map((activity: any, index: number) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 24px',
                borderBottom: index < recentActivities.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}
            >
              <div style={{
                padding: '6px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px'
              }}>
                <Activity size={16} color="#6b7280" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: '#1f2937' }}>
                  {activity.action}
                </div>
                {activity.user && (
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    User: {activity.user}
                  </div>
                )}
                {activity.role && (
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Role: {activity.role}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSimple;
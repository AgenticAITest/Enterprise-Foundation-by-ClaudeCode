import React, { useState } from 'react';
import { PermissionProvider, usePermissions } from '@/contexts/PermissionContext';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { withPermissions, withRoles, withAccess } from '@/components/permissions/withPermissions';
import { ConditionalRender, ShowIf, HideIf, PermissionSwitch, PermissionCase } from '@/components/permissions/ConditionalRender';
import { PermissionButton, PermissionLink } from '@/components/permissions/PermissionButton';
import { useHasPermission, useHasRole, useCanAccess, usePermissionSummary } from '@/hooks/usePermissionCheck';
import {
  Shield,
  User,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Key,
  Users,
  DollarSign,
  BarChart3,
  FileText,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  Save,
  AlertTriangle
} from 'lucide-react';

// Sample components protected by HOCs
const AdminOnlyComponent = withRoles(() => (
  <div style={{
    padding: '16px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626'
  }}>
    🔒 Admin Only Content - This is only visible to administrators
  </div>
), ['admin_user', 'super_admin']);

const FinanceManagerComponent = withPermissions(() => (
  <div style={{
    padding: '16px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fed7aa',
    borderRadius: '8px',
    color: '#92400e'
  }}>
    💰 Finance Manager Content - Requires finance permissions
  </div>
), {
  permissions: ['finance.budget.create', 'finance.reports.create'],
  requireAll: false
});

const SuperAdminComponent = withAccess(() => (
  <div style={{
    padding: '16px',
    backgroundColor: '#ddd6fe',
    border: '1px solid #c4b5fd',
    borderRadius: '8px',
    color: '#7c3aed'
  }}>
    ⚡ Super Admin Component - Full system access required
  </div>
), 'admin', 'manage');

const PermissionRenderingDemoContent: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('finance_manager');
  const [debugMode, setDebugMode] = useState(false);

  const { user, roles, refreshPermissions } = usePermissions();
  const { permissions, roleDetails } = usePermissionSummary();
  
  // Hook examples
  const canCreateBudget = useHasPermission('finance.budget.create');
  const canDeleteUsers = useHasPermission('admin.users.delete');
  const isAdmin = useHasRole(['admin_user', 'super_admin']);
  const canAccessReports = useCanAccess('finance', 'reports', 'read');

  const mockUsers = [
    { id: 'user_123', role: 'finance_manager', permissions: ['finance.budget.read', 'finance.budget.create'] },
    { id: 'admin_456', role: 'admin_user', permissions: ['admin.users.read', 'admin.users.create'] },
    { id: 'viewer_789', role: 'viewer', permissions: ['core.dashboard.read'] },
    { id: 'super_999', role: 'super_admin', permissions: ['*'] }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '8px',
          margin: 0
        }}>
          🛡️ Permission-Based Component Rendering Demo
        </h1>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          Comprehensive demo of permission guards, HOCs, conditional rendering, and permission hooks
        </p>
      </div>

      {/* User Info & Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <User size={16} />
            Current User Info
          </h3>
          
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Email:</strong> {user?.email}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Roles:</strong> {user?.roles.join(', ')}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Permissions Count:</strong> {permissions.length}
            </div>
            <div>
              <strong>Role Details:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {roleDetails.map(role => (
                  <li key={role?.id}>{role?.name} ({role?.permissions.length} permissions)</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Settings size={16} />
            Demo Controls
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
                display: 'block'
              }}>
                Simulate User Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="finance_manager">Finance Manager</option>
                <option value="admin_user">Admin User</option>
                <option value="viewer">Viewer</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  style={{ marginRight: '4px' }}
                />
                Debug Mode
              </label>
            </div>

            <button
              onClick={() => refreshPermissions()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Refresh Permissions
            </button>
          </div>
        </div>
      </div>

      {/* Hook Results */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Key size={16} />
          Permission Hooks Results
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {canCreateBudget ? <Eye size={16} style={{ color: '#10b981' }} /> : <EyeOff size={16} style={{ color: '#ef4444' }} />}
            <span style={{ fontSize: '14px', color: canCreateBudget ? '#10b981' : '#ef4444' }}>
              Can Create Budget: {canCreateBudget ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {canDeleteUsers ? <Eye size={16} style={{ color: '#10b981' }} /> : <EyeOff size={16} style={{ color: '#ef4444' }} />}
            <span style={{ fontSize: '14px', color: canDeleteUsers ? '#10b981' : '#ef4444' }}>
              Can Delete Users: {canDeleteUsers ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAdmin ? <Eye size={16} style={{ color: '#10b981' }} /> : <EyeOff size={16} style={{ color: '#ef4444' }} />}
            <span style={{ fontSize: '14px', color: isAdmin ? '#10b981' : '#ef4444' }}>
              Is Admin: {isAdmin ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {canAccessReports ? <Eye size={16} style={{ color: '#10b981' }} /> : <EyeOff size={16} style={{ color: '#ef4444' }} />}
            <span style={{ fontSize: '14px', color: canAccessReports ? '#10b981' : '#ef4444' }}>
              Can Access Reports: {canAccessReports ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* PermissionGuard Examples */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Shield size={16} />
          PermissionGuard Examples
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Hidden (default behavior)
            </h4>
            <PermissionGuard permission="admin.users.delete" debug={debugMode}>
              <div style={{ padding: '12px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534' }}>
                ✅ You can delete users!
              </div>
            </PermissionGuard>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              With placeholder fallback
            </h4>
            <PermissionGuard 
              permission="admin.roles.manage" 
              fallbackType="placeholder"
              debug={debugMode}
            >
              <div style={{ padding: '12px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534' }}>
                ✅ You can manage roles!
              </div>
            </PermissionGuard>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              With error fallback
            </h4>
            <PermissionGuard 
              permission="system.admin.access" 
              fallbackType="error"
              debug={debugMode}
            >
              <div style={{ padding: '12px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534' }}>
                ✅ You have system admin access!
              </div>
            </PermissionGuard>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Resource/Action based
            </h4>
            <PermissionGuard 
              resource="finance" 
              action="budget" 
              scope="create"
              fallbackType="placeholder"
              debug={debugMode}
            >
              <div style={{ padding: '12px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534' }}>
                ✅ You can create finance budgets!
              </div>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* HOC Protected Components */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Lock size={16} />
          HOC Protected Components
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AdminOnlyComponent />
          <FinanceManagerComponent />
          <SuperAdminComponent />
        </div>
      </div>

      {/* Conditional Rendering */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Eye size={16} />
          Conditional Rendering Components
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              ShowIf Component
            </h4>
            <ShowIf permission="finance.budget.create" debug={debugMode}>
              <div style={{ padding: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#1d4ed8' }}>
                📊 Budget creation tools are available
              </div>
            </ShowIf>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              HideIf Component (shows when NOT authorized)
            </h4>
            <HideIf permission="admin.users.delete" debug={debugMode}>
              <div style={{ padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fed7aa', borderRadius: '6px', color: '#92400e' }}>
                ⚠️ User deletion is restricted for your role
              </div>
            </HideIf>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              PermissionSwitch Component
            </h4>
            <PermissionSwitch
              fallback={
                <div style={{ padding: '12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', color: '#6b7280' }}>
                  No matching permissions found
                </div>
              }
            >
              <PermissionCase permission="admin.access">
                <div style={{ padding: '12px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626' }}>
                  🔧 Admin Dashboard Available
                </div>
              </PermissionCase>
              <PermissionCase permission="finance.dashboard.read">
                <div style={{ padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fed7aa', borderRadius: '6px', color: '#92400e' }}>
                  💰 Finance Dashboard Available
                </div>
              </PermissionCase>
              <PermissionCase permission="core.dashboard.read">
                <div style={{ padding: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#1d4ed8' }}>
                  📈 Basic Dashboard Available
                </div>
              </PermissionCase>
            </PermissionSwitch>
          </div>
        </div>
      </div>

      {/* Permission Buttons & Links */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FileText size={16} />
          Permission Buttons & Links
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Action Buttons
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <PermissionButton 
                permission="finance.budget.create"
                variant="primary"
                showIcon
              >
                Create Budget
              </PermissionButton>

              <PermissionButton 
                permission="admin.users.delete"
                variant="destructive"
                disableWhenUnauthorized
                showIcon
              >
                Delete Users
              </PermissionButton>

              <PermissionButton 
                permission="finance.reports.export"
                variant="outline"
                hideWhenUnauthorized
              >
                Export Reports
              </PermissionButton>

              <PermissionButton 
                resource="admin"
                action="settings"
                variant="secondary"
                disableWhenUnauthorized
              >
                Admin Settings
              </PermissionButton>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Permission Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <PermissionLink 
                permission="admin.users.read"
                href="/admin/users"
                showIcon
              >
                User Management
              </PermissionLink>

              <PermissionLink 
                permission="finance.dashboard.read"
                href="/finance/dashboard"
                showIcon
              >
                Finance Dashboard
              </PermissionLink>

              <PermissionLink 
                permission="admin.audit.read"
                href="/admin/audit"
                hideWhenUnauthorized
                showIcon
              >
                Audit Logs
              </PermissionLink>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div style={{
        marginTop: '32px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#0369a1',
          marginBottom: '12px'
        }}>
          🎯 Permission System Status
        </h3>
        <ul style={{ fontSize: '14px', color: '#0369a1', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
          <li>✅ PermissionContext: Working with mock user and permissions</li>
          <li>✅ PermissionGuard: Multiple fallback types implemented</li>
          <li>✅ HOCs: withPermissions, withRoles, withAccess implemented</li>
          <li>✅ Conditional Rendering: ShowIf, HideIf, PermissionSwitch implemented</li>
          <li>✅ Permission Hooks: useHasPermission, useHasRole, useCanAccess working</li>
          <li>✅ Permission UI: PermissionButton, PermissionLink with states</li>
          <li>✅ Debug Mode: Console logging for development</li>
        </ul>
      </div>
    </div>
  );
};

const PermissionRenderingDemo: React.FC = () => {
  return (
    <PermissionProvider>
      <PermissionRenderingDemoContent />
    </PermissionProvider>
  );
};

export default PermissionRenderingDemo;
import React, { ComponentType } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { AlertTriangle, Lock, Shield } from 'lucide-react';

export interface WithPermissionsOptions {
  permissions?: string | string[];
  roles?: string | string[];
  resource?: string;
  action?: string;
  scope?: string;
  requireAll?: boolean;
  fallbackComponent?: ComponentType<any>;
  redirectTo?: string;
  showFallback?: boolean;
}

// Default fallback component for unauthorized access
const DefaultUnauthorized: React.FC<{
  permissions?: string | string[];
  roles?: string | string[];
  resource?: string;
  action?: string;
}> = ({ permissions, roles, resource, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    minHeight: '400px'
  }}>
    <div style={{
      width: '64px',
      height: '64px',
      backgroundColor: '#fee2e2',
      borderRadius: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px'
    }}>
      <Shield size={32} style={{ color: '#dc2626' }} />
    </div>
    
    <h2 style={{
      fontSize: '24px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '8px',
      margin: 0
    }}>
      Access Denied
    </h2>
    
    <p style={{
      fontSize: '16px',
      color: '#6b7280',
      marginBottom: '24px',
      maxWidth: '400px',
      lineHeight: '1.5',
      margin: '8px 0 24px 0'
    }}>
      You don't have the required permissions to access this content.
    </p>
    
    <div style={{
      padding: '16px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#6b7280'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: '500' }}>Required:</div>
      {permissions && (
        <div>Permissions: {Array.isArray(permissions) ? permissions.join(', ') : permissions}</div>
      )}
      {roles && (
        <div>Roles: {Array.isArray(roles) ? roles.join(', ') : roles}</div>
      )}
      {resource && action && (
        <div>Access: {resource}.{action}</div>
      )}
    </div>
  </div>
);

// HOC for protecting entire components with permissions
export function withPermissions<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithPermissionsOptions
) {
  const PermissionProtectedComponent: React.FC<P> = (props) => {
    const { 
      hasPermission, 
      hasRole, 
      canAccess, 
      hasAllPermissions, 
      hasAnyPermission,
      isLoading 
    } = usePermissions();

    const {
      permissions,
      roles,
      resource,
      action,
      scope,
      requireAll = false,
      fallbackComponent: FallbackComponent = DefaultUnauthorized,
      showFallback = true
    } = options;

    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              Checking permissions...
            </span>
          </div>
        </div>
      );
    }

    let hasAccess = false;

    // Check resource + action based access
    if (resource && action) {
      hasAccess = canAccess(resource, action, scope);
    }
    // Check role-based access
    else if (roles) {
      hasAccess = hasRole(roles);
    }
    // Check permission-based access
    else if (permissions) {
      if (Array.isArray(permissions)) {
        hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
      } else {
        hasAccess = hasPermission(permissions);
      }
    }

    if (hasAccess) {
      return <WrappedComponent {...props} />;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <FallbackComponent 
        permissions={permissions}
        roles={roles}
        resource={resource}
        action={action}
      />
    );
  };

  PermissionProtectedComponent.displayName = `withPermissions(${WrappedComponent.displayName || WrappedComponent.name})`;

  return PermissionProtectedComponent;
}

// Utility HOC for role-based protection
export function withRoles<P extends object>(
  WrappedComponent: ComponentType<P>,
  roles: string | string[],
  options?: Omit<WithPermissionsOptions, 'roles'>
) {
  return withPermissions(WrappedComponent, { ...options, roles });
}

// Utility HOC for permission-based protection
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  permissions: string | string[],
  options?: Omit<WithPermissionsOptions, 'permissions'>
) {
  return withPermissions(WrappedComponent, { ...options, permissions });
}

// Utility HOC for resource-action based protection
export function withAccess<P extends object>(
  WrappedComponent: ComponentType<P>,
  resource: string,
  action: string,
  options?: Omit<WithPermissionsOptions, 'resource' | 'action'>
) {
  return withPermissions(WrappedComponent, { ...options, resource, action });
}
import React, { ReactNode } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';

export interface PermissionGuardProps {
  children: ReactNode;
  permission?: string | string[];
  role?: string | string[];
  resource?: string;
  action?: string;
  scope?: string;
  requireAll?: boolean; // For multiple permissions, require all vs any
  fallback?: ReactNode;
  showFallback?: boolean;
  fallbackType?: 'hidden' | 'placeholder' | 'error' | 'custom';
  debug?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  role,
  resource,
  action,
  scope,
  requireAll = false,
  fallback,
  showFallback = true,
  fallbackType = 'hidden',
  debug = false
}) => {
  const { hasPermission, hasRole, canAccess, hasAllPermissions, hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <div style={{
          width: '14px',
          height: '14px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        Checking permissions...
      </div>
    );
  }

  let hasAccess = false;

  // Check resource + action based access
  if (resource && action) {
    hasAccess = canAccess(resource, action, scope);
  }
  // Check role-based access
  else if (role) {
    hasAccess = hasRole(role);
  }
  // Check permission-based access
  else if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission);
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  // Debug information
  if (debug && process.env.NODE_ENV === 'development') {
    console.log('PermissionGuard Debug:', {
      hasAccess,
      permission,
      role,
      resource,
      action,
      scope,
      requireAll
    });
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle unauthorized access
  if (!showFallback) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  switch (fallbackType) {
    case 'hidden':
      return null;
    
    case 'placeholder':
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          border: '1px dashed #d1d5db',
          borderRadius: '6px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          <EyeOff size={16} />
          Content requires additional permissions
        </div>
      );
    
    case 'error':
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          <AlertTriangle size={16} />
          Access denied: Insufficient permissions
        </div>
      );
    
    default:
      return null;
  }
};

export default PermissionGuard;
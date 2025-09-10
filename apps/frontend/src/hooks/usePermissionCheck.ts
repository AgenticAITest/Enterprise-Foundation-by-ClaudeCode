import { useMemo } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';

export interface PermissionCheckOptions {
  permissions?: string | string[];
  roles?: string | string[];
  resource?: string;
  action?: string;
  scope?: string;
  requireAll?: boolean;
}

export interface PermissionCheckResult {
  allowed: boolean;
  loading: boolean;
  permissions: string[];
  roles: string[];
  user: any;
  reason?: string;
}

/**
 * Hook for checking permissions with detailed results
 */
export const usePermissionCheck = (options: PermissionCheckOptions): PermissionCheckResult => {
  const { 
    user,
    hasPermission, 
    hasRole, 
    canAccess, 
    hasAllPermissions, 
    hasAnyPermission,
    getUserPermissions,
    isLoading 
  } = usePermissions();

  const {
    permissions,
    roles,
    resource,
    action,
    scope,
    requireAll = false
  } = options;

  const result = useMemo((): PermissionCheckResult => {
    if (isLoading) {
      return {
        allowed: false,
        loading: true,
        permissions: [],
        roles: [],
        user: null
      };
    }

    if (!user) {
      return {
        allowed: false,
        loading: false,
        permissions: [],
        roles: [],
        user: null,
        reason: 'User not authenticated'
      };
    }

    let allowed = false;
    let reason: string | undefined;

    // Check resource + action based access
    if (resource && action) {
      allowed = canAccess(resource, action, scope);
      if (!allowed) {
        reason = `Missing access to ${resource}.${action}${scope ? `.${scope}` : ''}`;
      }
    }
    // Check role-based access
    else if (roles) {
      allowed = hasRole(roles);
      if (!allowed) {
        const rolesList = Array.isArray(roles) ? roles : [roles];
        reason = `Missing required role(s): ${rolesList.join(', ')}`;
      }
    }
    // Check permission-based access
    else if (permissions) {
      if (Array.isArray(permissions)) {
        allowed = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
        if (!allowed) {
          reason = requireAll 
            ? `Missing all required permissions: ${permissions.join(', ')}`
            : `Missing any of required permissions: ${permissions.join(', ')}`;
        }
      } else {
        allowed = hasPermission(permissions);
        if (!allowed) {
          reason = `Missing permission: ${permissions}`;
        }
      }
    }

    return {
      allowed,
      loading: false,
      permissions: getUserPermissions(),
      roles: user.roles,
      user,
      reason
    };
  }, [
    user,
    permissions,
    roles,
    resource,
    action,
    scope,
    requireAll,
    hasPermission,
    hasRole,
    canAccess,
    hasAllPermissions,
    hasAnyPermission,
    getUserPermissions,
    isLoading
  ]);

  return result;
};

/**
 * Simple hook for checking if user has specific permission(s)
 */
export const useHasPermission = (permission: string | string[], requireAll = false): boolean => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) return false;

    if (Array.isArray(permission)) {
      return requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission);
    }
    
    return hasPermission(permission);
  }, [permission, requireAll, hasPermission, hasAllPermissions, hasAnyPermission, isLoading]);
};

/**
 * Simple hook for checking if user has specific role(s)
 */
export const useHasRole = (role: string | string[]): boolean => {
  const { hasRole, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) return false;
    return hasRole(role);
  }, [role, hasRole, isLoading]);
};

/**
 * Hook for checking resource access
 */
export const useCanAccess = (resource: string, action: string, scope?: string): boolean => {
  const { canAccess, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) return false;
    return canAccess(resource, action, scope);
  }, [resource, action, scope, canAccess, isLoading]);
};

/**
 * Hook for getting user's permission summary
 */
export const usePermissionSummary = () => {
  const { user, getUserPermissions, roles, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading || !user) {
      return {
        loading: true,
        user: null,
        permissions: [],
        roles: [],
        roleDetails: []
      };
    }

    const userPermissions = getUserPermissions();
    const userRoles = user.roles;
    const roleDetails = userRoles.map(roleId => roles.find(r => r.id === roleId)).filter(Boolean);

    return {
      loading: false,
      user,
      permissions: userPermissions,
      roles: userRoles,
      roleDetails
    };
  }, [user, getUserPermissions, roles, isLoading]);
};
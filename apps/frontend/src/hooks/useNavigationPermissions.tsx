import { useCallback, useMemo } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useModule } from '@/contexts/ModuleContext';

export interface NavigationPermissionCheck {
  canAccess: boolean;
  reason?: string;
  missingPermissions?: string[];
  moduleRequired?: string;
}

export interface NavigationPermissionsHook {
  checkPathAccess: (path: string) => NavigationPermissionCheck;
  getAccessiblePaths: () => string[];
  canAccessGroup: (groupId: string) => boolean;
  getNavigationStats: () => {
    totalItems: number;
    accessibleItems: number;
    totalGroups: number;
    accessibleGroups: number;
    moduleBasedItems: number;
    permissionBasedItems: number;
  };
  getCurrentPathInfo: () => {
    path: string;
    item: any | null;
    hasAccess: boolean;
    breadcrumbs: any[];
  };
  filterNavigationByPermission: (permission: string) => any[];
  getNavigationByRole: (rolePermissions: string[]) => any[];
}

// Mock user permissions - in production, this would come from authentication context
const mockUserPermissions = [
  'core.dashboard.read',
  'core.analytics.read',
  'finance.dashboard.read',
  'finance.budget.read',
  'finance.reports.read',
  'finance.expenses.read',
  'hr.dashboard.read',
  'hr.employee.read',
  'sales.dashboard.read',
  'sales.leads.read',
  'projects.dashboard.read',
  'projects.tasks.read',
  'projects.team.read',
  'admin.access',
  'admin.dashboard.read',
  'admin.users.read',
  'admin.roles.read'
];

const useNavigationPermissions = (): NavigationPermissionsHook => {
  const {
    flatNavigation,
    getAccessibleNavigation,
    findNavigationItem,
    getBreadcrumbs,
    hasNavigationAccess
  } = useNavigation();
  
  const { hasModuleAccess } = useModule();

  const checkPathAccess = useCallback((path: string): NavigationPermissionCheck => {
    const item = findNavigationItem(path);
    
    if (!item) {
      return {
        canAccess: false,
        reason: 'Navigation item not found'
      };
    }

    // Check module access
    if (item.moduleCode && !hasModuleAccess(item.moduleCode)) {
      return {
        canAccess: false,
        reason: 'Module not accessible',
        moduleRequired: item.moduleCode
      };
    }

    // Check permissions
    if (item.permissions.length > 0) {
      const missingPermissions = item.permissions.filter(
        permission => !mockUserPermissions.includes(permission)
      );

      if (missingPermissions.length === item.permissions.length) {
        return {
          canAccess: false,
          reason: 'Insufficient permissions',
          missingPermissions
        };
      }
    }

    return {
      canAccess: true
    };
  }, [findNavigationItem, hasModuleAccess]);

  const getAccessiblePaths = useCallback((): string[] => {
    return flatNavigation
      .filter(item => hasNavigationAccess(item))
      .map(item => item.path);
  }, [flatNavigation, hasNavigationAccess]);

  const canAccessGroup = useCallback((groupId: string): boolean => {
    const accessibleNavigation = getAccessibleNavigation();
    return accessibleNavigation.some(group => group.id === groupId);
  }, [getAccessibleNavigation]);

  const getNavigationStats = useCallback(() => {
    const accessibleNavigation = getAccessibleNavigation();
    const accessibleItems = flatNavigation.filter(item => hasNavigationAccess(item));
    
    return {
      totalItems: flatNavigation.length,
      accessibleItems: accessibleItems.length,
      totalGroups: accessibleNavigation.length,
      accessibleGroups: accessibleNavigation.length,
      moduleBasedItems: flatNavigation.filter(item => item.moduleCode).length,
      permissionBasedItems: flatNavigation.filter(item => item.permissions.length > 0).length
    };
  }, [flatNavigation, getAccessibleNavigation, hasNavigationAccess]);

  const getCurrentPathInfo = useCallback(() => {
    const path = window.location.pathname;
    const item = findNavigationItem(path);
    const hasAccess = item ? hasNavigationAccess(item) : false;
    const breadcrumbs = getBreadcrumbs(path);

    return {
      path,
      item,
      hasAccess,
      breadcrumbs
    };
  }, [findNavigationItem, hasNavigationAccess, getBreadcrumbs]);

  const filterNavigationByPermission = useCallback((permission: string) => {
    return flatNavigation.filter(item => 
      item.permissions.includes(permission) && hasNavigationAccess(item)
    );
  }, [flatNavigation, hasNavigationAccess]);

  const getNavigationByRole = useCallback((rolePermissions: string[]) => {
    return flatNavigation.filter(item => {
      // Check if user has module access
      if (item.moduleCode && !hasModuleAccess(item.moduleCode)) {
        return false;
      }

      // Check if user has required permissions
      if (item.permissions.length === 0) {
        return true; // No permissions required
      }

      return item.permissions.some(permission => 
        rolePermissions.includes(permission)
      );
    });
  }, [flatNavigation, hasModuleAccess]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    checkPathAccess,
    getAccessiblePaths,
    canAccessGroup,
    getNavigationStats,
    getCurrentPathInfo,
    filterNavigationByPermission,
    getNavigationByRole
  }), [
    checkPathAccess,
    getAccessiblePaths,
    canAccessGroup,
    getNavigationStats,
    getCurrentPathInfo,
    filterNavigationByPermission,
    getNavigationByRole
  ]);
};

export default useNavigationPermissions;
import pool from '../config/database.js';
import { createPermissionMiddleware } from './permission.middleware.js';
import { authenticateToken, requireTenantAccess } from './auth.js';

// Create permission middleware instance
export const permissionMiddleware = createPermissionMiddleware(pool);

// Re-export auth middleware
export { authenticateToken, requireTenantAccess };

// Common permission patterns
export const requireWMSAccess = permissionMiddleware.requireModuleAccess('wms');
export const requireAccountingAccess = permissionMiddleware.requireModuleAccess('accounting');
export const requirePOSAccess = permissionMiddleware.requireModuleAccess('pos');
export const requireHRAccess = permissionMiddleware.requireModuleAccess('hr');

// Common permission checks
export const canManageUsers = permissionMiddleware.requirePermission({
  resource: 'core_user_management',
  action: 'manage',
  allowSuperAdmin: true
});

export const canViewUsers = permissionMiddleware.requirePermission({
  resource: 'core_user_management',
  action: 'view',
  allowSuperAdmin: true
});

export const canManageRoles = permissionMiddleware.requirePermission({
  resource: 'core_role_management',
  action: 'manage',
  allowSuperAdmin: true
});

export const canViewReports = permissionMiddleware.requireAnyPermission([
  'wms_reports_analytics',
  'accounting_reports',
  'pos_reports',
  'hr_reports'
], 'view');

// WMS specific permissions
export const canManageInventory = permissionMiddleware.requirePermission({
  resource: 'wms_inventory_tracking',
  action: 'manage',
  module: 'wms'
});

export const canViewInventory = permissionMiddleware.requirePermission({
  resource: 'wms_inventory_tracking',
  action: 'view',
  module: 'wms'
});

export const canManageInbound = permissionMiddleware.requirePermission({
  resource: 'wms_inbound_operations',
  action: 'manage',
  module: 'wms'
});

export const canManageOutbound = permissionMiddleware.requirePermission({
  resource: 'wms_outbound_operations',
  action: 'manage',
  module: 'wms'
});

// Hierarchical permission examples
export const canAccessWarehouseOperations = permissionMiddleware.requireHierarchicalPermission(
  'wms_warehouse_operations',
  'wms_inventory_tracking'
);

export const canAccessSettings = permissionMiddleware.requireHierarchicalPermission(
  'core_settings',
  'core_general_settings'
);

// Data scope middleware
export const applyWMSDataScope = permissionMiddleware.applyDataScope('wms');
export const applyAccountingDataScope = permissionMiddleware.applyDataScope('accounting');
export const applyPOSDataScope = permissionMiddleware.applyDataScope('pos');
export const applyHRDataScope = permissionMiddleware.applyDataScope('hr');

/**
 * Helper function to create custom permission middleware
 */
export const createCustomPermission = (options: {
  resource?: string;
  action?: 'view' | 'manage';
  module?: string;
  allowSuperAdmin?: boolean;
  skipTenantCheck?: boolean;
}) => {
  return permissionMiddleware.requirePermission(options);
};

/**
 * Helper function to create module-specific permission chain
 */
export const requireModulePermission = (moduleCode: string, resourceCode: string, action: 'view' | 'manage' = 'view') => {
  return [
    authenticateToken,
    requireTenantAccess,
    permissionMiddleware.requireModuleAccess(moduleCode),
    permissionMiddleware.requirePermission({
      resource: resourceCode,
      action,
      module: moduleCode
    })
  ];
};

/**
 * Helper function for common CRUD permission patterns
 */
export const createCRUDPermissions = (resourceCode: string, moduleCode?: string) => {
  return {
    create: permissionMiddleware.requirePermission({
      resource: resourceCode,
      action: 'manage',
      module: moduleCode
    }),
    read: permissionMiddleware.requirePermission({
      resource: resourceCode,
      action: 'view',
      module: moduleCode
    }),
    update: permissionMiddleware.requirePermission({
      resource: resourceCode,
      action: 'manage',
      module: moduleCode
    }),
    delete: permissionMiddleware.requirePermission({
      resource: resourceCode,
      action: 'manage',
      module: moduleCode
    })
  };
};
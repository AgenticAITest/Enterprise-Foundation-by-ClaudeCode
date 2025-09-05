# Permission Middleware Documentation

This document explains how to use the comprehensive permission and security middleware system for the modular ERP RBAC system.

## Overview

The permission middleware system provides multiple layers of security:

1. **Authentication** - User identity verification
2. **Tenant Access** - Multi-tenant isolation 
3. **Module Access** - Module-level permissions
4. **Resource Permissions** - Fine-grained resource access control
5. **Hierarchical Permissions** - Parent-child permission inheritance
6. **Data Scoping** - Row-level security based on user scope
7. **Advanced Features** - Time-based, IP-based, and custom access controls

## Basic Usage

### Simple Permission Check

```typescript
import { requirePermission } from '../middleware/index.js';

// Require 'manage' permission for user management
router.post('/users', 
  authenticateToken,
  requireTenantAccess,
  createCustomPermission({
    resource: 'core_user_management',
    action: 'manage'
  }),
  async (req, res) => {
    // Handler code
  }
);
```

### Pre-configured Permission Helpers

```typescript
import { canManageUsers, canViewUsers, canManageRoles } from '../middleware/index.js';

// Using pre-configured middleware
router.get('/users', authenticateToken, requireTenantAccess, canViewUsers, handler);
router.post('/users', authenticateToken, requireTenantAccess, canManageUsers, handler);
router.put('/roles/:id', authenticateToken, requireTenantAccess, canManageRoles, handler);
```

## Module-Specific Permissions

### Basic Module Access

```typescript
import { requireWMSAccess, requireAccountingAccess } from '../middleware/index.js';

// WMS routes - user must have access to WMS module
router.get('/wms/inventory', 
  authenticateToken,
  requireTenantAccess,
  requireWMSAccess,
  canViewInventory,
  handler
);
```

### Module Permission Chain

```typescript
import { requireModulePermission } from '../middleware/index.js';

// Complete permission chain for WMS inventory management
const wmsInventoryPermissions = requireModulePermission('wms', 'wms_inventory_tracking', 'manage');

router.put('/wms/inventory/:id', 
  ...wmsInventoryPermissions,  // Expands to: [authenticateToken, requireTenantAccess, requireWMSAccess, canManageInventory]
  handler
);
```

## Hierarchical Permissions

### Parent-Child Permission Inheritance

```typescript
import { permissionMiddleware } from '../middleware/index.js';

// Check child permission first, fall back to parent
router.get('/wms/inventory/audit',
  authenticateToken,
  requireTenantAccess,
  permissionMiddleware.requireHierarchicalPermission(
    'wms_warehouse_operations',    // Parent permission
    'wms_inventory_audit',         // Child permission
    'view'
  ),
  handler
);
```

### Multiple Permission Options

```typescript
// User needs ANY of these permissions
router.get('/reports',
  authenticateToken,
  requireTenantAccess,
  permissionMiddleware.requireAnyPermission([
    'wms_reports_analytics',
    'accounting_reports',
    'pos_reports',
    'hr_reports'
  ], 'view'),
  handler
);

// User needs ALL of these permissions
router.post('/advanced-operation',
  authenticateToken,
  requireTenantAccess,
  permissionMiddleware.requireAllPermissions([
    'wms_inventory_tracking',
    'wms_outbound_operations'
  ], 'manage'),
  handler
);
```

## Data Scoping

### Apply Data Scope Filters

```typescript
import { applyWMSDataScope } from '../middleware/index.js';

router.get('/wms/inventory',
  authenticateToken,
  requireTenantAccess,
  requireWMSAccess,
  applyWMSDataScope,  // Adds user's data scope to req.dataScope
  async (req, res) => {
    const { dataScope } = req;
    
    // Use data scope to filter query
    if (dataScope) {
      // Apply warehouse, location, or department filters
      const filters = {
        warehouse_id: dataScope.type === 'warehouse' ? dataScope.values : undefined,
        location_id: dataScope.type === 'location' ? dataScope.values : undefined
      };
      
      const inventory = await inventoryService.getWithScope(filters);
      res.json({ inventory });
    }
  }
);
```

## Advanced Protection Patterns

### CRUD Permission Pattern

```typescript
import { createCRUDPermissions } from '../middleware/index.js';

const userCRUD = createCRUDPermissions('core_user_management');
const wmsCRUD = createCRUDPermissions('wms_inventory_tracking', 'wms');

// Apply different permissions for different operations
router.get('/users', authenticateToken, requireTenantAccess, userCRUD.read, handler);
router.post('/users', authenticateToken, requireTenantAccess, userCRUD.create, handler);
router.put('/users/:id', authenticateToken, requireTenantAccess, userCRUD.update, handler);
router.delete('/users/:id', authenticateToken, requireTenantAccess, userCRUD.delete, handler);
```

### Advanced Permission Configuration

```typescript
import { requireAdvancedPermission } from '../middleware/api-protection.middleware.js';

router.post('/wms/complex-operation',
  authenticateToken,
  requireTenantAccess,
  requireAdvancedPermission({
    primaryResource: 'wms_inventory_tracking',
    fallbackResources: ['wms_warehouse_operations'],
    requiredAction: 'manage',
    moduleCode: 'wms',
    dataScope: true,
    hierarchicalParent: 'wms_operations'
  }),
  handler
);
```

### Auto-Protection Middleware

```typescript
import { autoProtect } from '../middleware/api-protection.middleware.js';

// Automatically determines permissions based on route pattern
router.use('/api/protected/*', autoProtect());
```

## Time and IP-Based Access Control

### Business Hours Restriction

```typescript
import { requireTimeBasedAccess } from '../middleware/api-protection.middleware.js';

router.post('/financial/transactions',
  authenticateToken,
  requireTenantAccess,
  requireTimeBasedAccess({
    businessHours: true,
    allowedDays: [1, 2, 3, 4, 5], // Monday-Friday
    timezone: 'America/New_York'
  }),
  handler
);
```

### IP Whitelist

```typescript
import { requireIPAccess } from '../middleware/api-protection.middleware.js';

router.get('/admin/sensitive-data',
  authenticateToken,
  requireIPAccess(['192.168.1.100', '10.0.0.50']),
  handler
);
```

## Permission Information in Requests

After permission middleware runs successfully, permission information is available in the request:

```typescript
router.get('/protected-resource', 
  permissionMiddleware,
  async (req: AuthenticatedRequest, res) => {
    // Single permission info
    const { permission } = req;
    console.log('Resource:', permission?.resourceCode);
    console.log('Level:', permission?.level);
    console.log('Granted by:', permission?.grantedByRole);
    
    // Multiple permissions (from requireAllPermissions)
    const { permissions } = req;
    permissions?.forEach(p => {
      console.log(`${p.resourceCode}: ${p.level}`);
    });
    
    // Module context
    console.log('Module:', req.moduleContext);
    
    // Data scope
    const { dataScope } = req;
    if (dataScope) {
      console.log('Scope type:', dataScope.type);
      console.log('Scope values:', dataScope.values);
      console.log('Filters:', dataScope.filters);
    }
  }
);
```

## Error Handling

The middleware system throws `AppError` instances with appropriate status codes:

- `401` - Authentication required
- `403` - Access denied (insufficient permissions)
- `404` - Resource not found
- `500` - Internal permission system error

## Super Admin Bypass

Super admin users (`req.user.role === 'super_admin'`) automatically bypass most permission checks unless explicitly disabled:

```typescript
// Super admin bypass enabled (default)
createCustomPermission({
  resource: 'sensitive_resource',
  action: 'manage'
});

// Super admin bypass disabled
createCustomPermission({
  resource: 'sensitive_resource', 
  action: 'manage',
  allowSuperAdmin: false
});
```

## Performance Considerations

1. **Permission Caching**: Results are cached during request lifecycle
2. **Batch Checks**: Use `requireAllPermissions` or `requireAnyPermission` for multiple checks
3. **Hierarchical Optimization**: Child permissions are checked before parents
4. **Data Scope Lazy Loading**: Scope is only loaded when `applyDataScope` middleware is used

## Complete Example: WMS Inventory Route

```typescript
import { 
  authenticateToken, 
  requireTenantAccess,
  requireWMSAccess,
  applyWMSDataScope,
  permissionMiddleware 
} from '../middleware/index.js';

// Complete WMS inventory management route with full security
router.put('/wms/inventory/:inventoryId',
  // 1. Authentication
  authenticateToken,
  
  // 2. Tenant access validation
  requireTenantAccess,
  
  // 3. WMS module access
  requireWMSAccess,
  
  // 4. Hierarchical permission check (inventory management or warehouse operations)
  permissionMiddleware.requireHierarchicalPermission(
    'wms_warehouse_operations',
    'wms_inventory_tracking',
    'manage'
  ),
  
  // 5. Apply data scope filtering
  applyWMSDataScope,
  
  // 6. Business hours restriction
  requireTimeBasedAccess({ businessHours: true }),
  
  // Route handler
  async (req: AuthenticatedRequest, res: Response) => {
    const { permission, dataScope } = req;
    
    // Permission information available
    console.log(`Access granted by: ${permission?.grantedByRole}`);
    
    // Data scope filtering applied
    const allowedWarehouses = dataScope?.type === 'warehouse' ? dataScope.values : null;
    
    // Your business logic here
    const result = await inventoryService.updateInventory(
      req.params.inventoryId,
      req.body,
      { warehouseFilter: allowedWarehouses }
    );
    
    res.json({ success: true, result });
  }
);
```

This comprehensive middleware system provides enterprise-grade security for your modular ERP system while maintaining flexibility and performance.
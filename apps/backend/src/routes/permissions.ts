import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { PermissionService } from '../services/permission.service';
import { authenticateToken, requireTenantAccess } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();
const permissionService = new PermissionService(pool);

// Get resources for a module
router.get('/modules/:moduleCode/resources', 
  authenticateToken, 
  async (req: Request, res: Response) => {
    try {
      const { moduleCode } = req.params;
      const { include_non_leaf } = req.query;
      
      const resources = await permissionService.getModuleResources(
        moduleCode, 
        include_non_leaf === 'true'
      );
      
      res.json({ resources });
    } catch (error) {
      throw new AppError('Failed to fetch module resources', 500);
    }
  }
);

// Get resource hierarchy for a module
router.get('/modules/:moduleCode/hierarchy', 
  authenticateToken, 
  async (req: Request, res: Response) => {
    try {
      const { moduleCode } = req.params;
      const hierarchy = await permissionService.getResourceHierarchy(moduleCode);
      res.json({ hierarchy });
    } catch (error) {
      throw new AppError('Failed to fetch resource hierarchy', 500);
    }
  }
);

// Get user's effective permissions
router.get('/tenants/:tenantId/users/:userId/effective-permissions', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = req.params;
      const { module_code } = req.query;
      const tenantSchema = `tenant_${tenantId}`;

      const permissions = await permissionService.getUserEffectivePermissions(
        tenantSchema, 
        userId, 
        module_code as string
      );
      
      res.json({ permissions });
    } catch (error) {
      throw new AppError('Failed to fetch user permissions', 500);
    }
  }
);

// Check user permission for specific resource
router.get('/tenants/:tenantId/users/:userId/check/:resourceCode', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId, resourceCode } = req.params;
      const { required_level } = req.query;
      const tenantSchema = `tenant_${tenantId}`;

      const check = await permissionService.checkUserPermission(
        tenantSchema, 
        userId, 
        resourceCode, 
        (required_level as 'manage' | 'view_only') || 'view_only'
      );
      
      res.json({ check });
    } catch (error) {
      throw new AppError('Failed to check user permission', 500);
    }
  }
);

// Get user's accessible modules
router.get('/tenants/:tenantId/users/:userId/accessible-modules', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      const modules = await permissionService.getUserAccessibleModules(tenantSchema, userId);
      res.json({ modules });
    } catch (error) {
      throw new AppError('Failed to fetch accessible modules', 500);
    }
  }
);

// Get user's menu permissions for a module
router.get('/tenants/:tenantId/users/:userId/menu-permissions/:moduleCode', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId, moduleCode } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      const menuPermissions = await permissionService.getUserMenuPermissions(
        tenantSchema, 
        userId, 
        moduleCode
      );
      
      res.json({ menu_permissions: menuPermissions });
    } catch (error) {
      throw new AppError('Failed to fetch menu permissions', 500);
    }
  }
);

// Get user's data scope for a module
router.get('/tenants/:tenantId/users/:userId/data-scopes/:moduleCode', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId, moduleCode } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      const dataScope = await permissionService.getUserDataScope(
        tenantSchema, 
        userId, 
        moduleCode
      );
      
      res.json({ data_scope: dataScope });
    } catch (error) {
      throw new AppError('Failed to fetch user data scope', 500);
    }
  }
);

// Update user's data scope for a module
router.put('/tenants/:tenantId/users/:userId/data-scopes', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = req.params;
      const { module_code, scope_type, scope_values, resource_filters } = req.body;
      const tenantSchema = `tenant_${tenantId}`;

      if (!module_code || !scope_type) {
        throw new AppError('Module code and scope type are required', 400);
      }

      await permissionService.setUserDataScope(tenantSchema, userId, {
        module_code,
        scope_type,
        scope_values: scope_values || [],
        resource_filters
      });
      
      res.json({ message: 'Data scope updated successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update data scope', 500);
    }
  }
);

// Get scopeable resources for a module
router.get('/tenants/:tenantId/modules/:moduleCode/scopeable-resources', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { moduleCode } = req.params;
      
      const resources = await permissionService.getModuleScopeableResources(moduleCode);
      res.json({ resources });
    } catch (error) {
      throw new AppError('Failed to fetch scopeable resources', 500);
    }
  }
);

// Validate API endpoint access
router.post('/tenants/:tenantId/users/:userId/validate-access', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = req.params;
      const { endpoint, method } = req.body;
      const tenantSchema = `tenant_${tenantId}`;

      if (!endpoint || !method) {
        throw new AppError('Endpoint and method are required', 400);
      }

      const hasAccess = await permissionService.validateResourceAccess(
        tenantSchema, 
        userId, 
        endpoint, 
        method
      );
      
      res.json({ has_access: hasAccess });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to validate access', 500);
    }
  }
);

// Calculate and cache effective permissions for user
router.post('/tenants/:tenantId/users/:userId/calculate-permissions', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      await permissionService.calculateEffectivePermissions(tenantSchema, userId);
      res.json({ message: 'Permissions calculated successfully' });
    } catch (error) {
      throw new AppError('Failed to calculate permissions', 500);
    }
  }
);

export default router;
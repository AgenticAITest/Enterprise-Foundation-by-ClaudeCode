import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { RoleService } from '../services/role.service';
import { 
  authenticateToken, 
  requireTenantAccess, 
  canManageRoles,
  canViewUsers,
  createCustomPermission 
} from '../middleware/index.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();
const roleService = new RoleService(pool);

// Get role templates for a module
router.get('/templates/:moduleCode', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { moduleCode } = req.params;
    const templates = await roleService.getRoleTemplates(moduleCode);
    res.json({ templates });
  } catch (error) {
    throw new AppError('Failed to fetch role templates', 500);
  }
});

// Get all role templates
router.get('/templates', authenticateToken, async (req: Request, res: Response) => {
  try {
    const templates = await roleService.getRoleTemplates();
    res.json({ templates });
  } catch (error) {
    throw new AppError('Failed to fetch role templates', 500);
  }
});

// Get roles for a specific tenant and module
router.get('/tenants/:tenantId/modules/:moduleCode/roles', 
  authenticateToken, 
  requireTenantAccess,
  createCustomPermission({ resource: 'core_role_management', action: 'view' }),
  async (req: Request, res: Response) => {
    try {
      const { tenantId, moduleCode } = req.params;
      const tenantSchema = `tenant_${tenantId}`;
      
      const roles = await roleService.getRolesByModule(tenantSchema, moduleCode);
      res.json({ roles });
    } catch (error) {
      throw new AppError('Failed to fetch roles', 500);
    }
  }
);

// Get specific role details
router.get('/tenants/:tenantId/roles/:roleId', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, roleId } = req.params;
      const tenantSchema = `tenant_${tenantId}`;
      
      const role = await roleService.getRoleById(tenantSchema, roleId);
      if (!role) {
        throw new AppError('Role not found', 404);
      }

      const permissions = await roleService.getRolePermissions(tenantSchema, roleId);
      
      res.json({ role, permissions });
    } catch (error) {
      throw new AppError('Failed to fetch role details', 500);
    }
  }
);

// Create new role
router.post('/tenants/:tenantId/modules/:moduleCode/roles', 
  authenticateToken, 
  requireTenantAccess,
  canManageRoles,
  async (req: Request, res: Response) => {
    try {
      const { tenantId, moduleCode } = req.params;
      const { name, description, permissions } = req.body;
      const tenantSchema = `tenant_${tenantId}`;

      if (!name) {
        throw new AppError('Role name is required', 400);
      }

      const role = await roleService.createRole(tenantSchema, {
        name,
        description,
        module_code: moduleCode,
        permissions
      });

      res.status(201).json({ role });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create role', 500);
    }
  }
);

// Create role from template
router.post('/tenants/:tenantId/roles/from-template', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const { templateId, customName } = req.body;
      const tenantSchema = `tenant_${tenantId}`;

      if (!templateId) {
        throw new AppError('Template ID is required', 400);
      }

      const role = await roleService.createRoleFromTemplate(tenantSchema, templateId, customName);
      res.status(201).json({ role });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create role from template', 500);
    }
  }
);

// Update role
router.put('/tenants/:tenantId/roles/:roleId', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, roleId } = req.params;
      const { name, description, permissions } = req.body;
      const tenantSchema = `tenant_${tenantId}`;

      const role = await roleService.updateRole(tenantSchema, roleId, {
        name,
        description,
        permissions
      });

      res.json({ role });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update role', 500);
    }
  }
);

// Clone role
router.post('/tenants/:tenantId/roles/:roleId/clone', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, roleId } = req.params;
      const { name, description } = req.body;
      const tenantSchema = `tenant_${tenantId}`;

      if (!name) {
        throw new AppError('New role name is required', 400);
      }

      const role = await roleService.cloneRole(tenantSchema, roleId, name, description);
      res.status(201).json({ role });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to clone role', 500);
    }
  }
);

// Delete role
router.delete('/tenants/:tenantId/roles/:roleId', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, roleId } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      await roleService.deleteRole(tenantSchema, roleId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete role', 500);
    }
  }
);

// Get role permissions
router.get('/tenants/:tenantId/roles/:roleId/permissions', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, roleId } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      const permissions = await roleService.getRolePermissions(tenantSchema, roleId);
      res.json({ permissions });
    } catch (error) {
      throw new AppError('Failed to fetch role permissions', 500);
    }
  }
);

// Update role permissions
router.put('/tenants/:tenantId/roles/:roleId/permissions', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, roleId } = req.params;
      const { permissions } = req.body;
      const tenantSchema = `tenant_${tenantId}`;

      if (!Array.isArray(permissions)) {
        throw new AppError('Permissions must be an array', 400);
      }

      const role = await roleService.updateRole(tenantSchema, roleId, { permissions });
      res.json({ role });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update role permissions', 500);
    }
  }
);

export default router;
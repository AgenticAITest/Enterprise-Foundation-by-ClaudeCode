import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { UserRoleService } from '../services/user-role.service';
import { authenticateToken, requireTenantAccess } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();
const userRoleService = new UserRoleService(pool);

// Get all users in tenant
router.get('/tenants/:tenantId/users', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      const query = `
        SELECT id, email, first_name, last_name, is_active, created_at
        FROM ${tenantSchema}.users 
        WHERE is_active = true
        ORDER BY last_name, first_name
      `;
      
      const result = await pool.query(query);
      res.json({ users: result.rows });
    } catch (error) {
      throw new AppError('Failed to fetch users', 500);
    }
  }
);

// Get user's module roles
router.get('/tenants/:tenantId/users/:userId/module-roles', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      const roles = await userRoleService.getUserModuleRoles(tenantSchema, userId);
      res.json({ module_roles: roles });
    } catch (error) {
      throw new AppError('Failed to fetch user module roles', 500);
    }
  }
);

// Get user's role in specific module
router.get('/tenants/:tenantId/users/:userId/modules/:moduleCode/role', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId, moduleCode } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      const role = await userRoleService.getUserRoleInModule(tenantSchema, userId, moduleCode);
      res.json({ role });
    } catch (error) {
      throw new AppError('Failed to fetch user role in module', 500);
    }
  }
);

// Assign user to role in module
router.post('/tenants/:tenantId/users/:userId/module-roles', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = req.params;
      const { module_code, role_id, valid_from, valid_until } = req.body;
      const tenantSchema = `tenant_${tenantId}`;
      
      // Get assigned_by from JWT token (assuming it's in req.user)
      const assignedBy = (req as any).user?.id || 'system';

      if (!module_code || !role_id) {
        throw new AppError('Module code and role ID are required', 400);
      }

      const assignment = await userRoleService.assignUserToRole(tenantSchema, {
        user_id: userId,
        module_code,
        role_id,
        assigned_by: assignedBy,
        valid_from: valid_from ? new Date(valid_from) : undefined,
        valid_until: valid_until ? new Date(valid_until) : undefined
      });

      res.status(201).json({ assignment });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to assign user to role', 500);
    }
  }
);

// Update user's role in module
router.put('/tenants/:tenantId/users/:userId/module-roles/:moduleCode', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId, moduleCode } = req.params;
      const { role_id, valid_until } = req.body;
      const tenantSchema = `tenant_${tenantId}`;
      
      const assignedBy = (req as any).user?.id || 'system';

      if (!role_id) {
        throw new AppError('Role ID is required', 400);
      }

      const assignment = await userRoleService.updateUserRoleInModule(
        tenantSchema,
        userId,
        moduleCode,
        role_id,
        assignedBy,
        valid_until ? new Date(valid_until) : undefined
      );

      res.json({ assignment });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update user role', 500);
    }
  }
);

// Remove user from module
router.delete('/tenants/:tenantId/users/:userId/module-roles/:moduleCode', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId, moduleCode } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      await userRoleService.removeUserFromModule(tenantSchema, userId, moduleCode);
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to remove user from module', 500);
    }
  }
);

// Bulk assign users to role
router.post('/tenants/:tenantId/bulk-assign-role', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const { user_ids, module_code, role_id } = req.body;
      const tenantSchema = `tenant_${tenantId}`;
      
      const assignedBy = (req as any).user?.id || 'system';

      if (!Array.isArray(user_ids) || !module_code || !role_id) {
        throw new AppError('User IDs array, module code, and role ID are required', 400);
      }

      const assignments = await userRoleService.bulkAssignUsersToRole(
        tenantSchema,
        user_ids,
        module_code,
        role_id,
        assignedBy
      );

      res.json({ 
        assignments,
        successful_count: assignments.length,
        failed_count: user_ids.length - assignments.length
      });
    } catch (error) {
      throw new AppError('Failed to bulk assign users', 500);
    }
  }
);

// Get users in module
router.get('/tenants/:tenantId/modules/:moduleCode/users', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, moduleCode } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      const users = await userRoleService.getModuleUsers(tenantSchema, moduleCode);
      res.json({ users });
    } catch (error) {
      throw new AppError('Failed to fetch module users', 500);
    }
  }
);

// Get users without module access
router.get('/tenants/:tenantId/modules/:moduleCode/available-users', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, moduleCode } = req.params;
      const tenantSchema = `tenant_${tenantId}`;

      const users = await userRoleService.getUsersWithoutModuleAccess(tenantSchema, moduleCode);
      res.json({ available_users: users });
    } catch (error) {
      throw new AppError('Failed to fetch available users', 500);
    }
  }
);

// Create temporary role assignment
router.post('/tenants/:tenantId/users/:userId/temporary-role', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = req.params;
      const { module_code, role_id, duration_hours, reason } = req.body;
      const tenantSchema = `tenant_${tenantId}`;
      
      const assignedBy = (req as any).user?.id || 'system';

      if (!module_code || !role_id || !duration_hours) {
        throw new AppError('Module code, role ID, and duration are required', 400);
      }

      if (duration_hours > 72) {
        throw new AppError('Temporary assignments cannot exceed 72 hours', 400);
      }

      const assignment = await userRoleService.createTemporaryRoleAssignment(
        tenantSchema,
        userId,
        module_code,
        role_id,
        assignedBy,
        duration_hours,
        reason
      );

      res.status(201).json({ assignment });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create temporary assignment', 500);
    }
  }
);

// Get user role history
router.get('/tenants/:tenantId/users/:userId/role-history', 
  authenticateToken, 
  requireTenantAccess, 
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = req.params;
      const { limit } = req.query;
      const tenantSchema = `tenant_${tenantId}`;

      const history = await userRoleService.getUserRoleHistory(
        tenantSchema, 
        userId, 
        limit ? parseInt(limit as string) : 50
      );
      
      res.json({ history });
    } catch (error) {
      throw new AppError('Failed to fetch user role history', 500);
    }
  }
);

// System endpoint to expire temporary assignments (should be called by cron job)
router.post('/system/expire-temporary-assignments', 
  authenticateToken, 
  async (req: Request, res: Response) => {
    try {
      // This should have system-level authentication in production
      const expiredCount = await userRoleService.expireTemporaryAssignments();
      res.json({ expired_assignments: expiredCount });
    } catch (error) {
      throw new AppError('Failed to expire temporary assignments', 500);
    }
  }
);

export default router;
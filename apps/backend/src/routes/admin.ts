import { Router, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/express.js';
import { query, tenantQuery } from '../config/database.js';
import bcrypt from 'bcrypt';

const router = Router();

// Admin middleware to check admin permissions
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'super_admin' && req.user.role !== 'admin') || !req.user.permissions.includes('admin')) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

// Apply admin middleware to all routes
router.use(requireAdmin as any);

// Get all tenants
router.get('/tenants', async (req: any, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id,
        subdomain,
        company_name as "companyName",
        plan_id as "planId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM public.tenants 
      ORDER BY created_at DESC
    `);

    // Get additional stats for each tenant
    const tenantsWithStats = await Promise.all(
      result.rows.map(async (tenant: any) => {
        try {
          // Get user count from tenant-specific users table (public.users table)
          const userCountResult = await query(
            'SELECT COUNT(*) as user_count FROM public.users WHERE tenant_id = $1',
            [tenant.id]
          );
          
          // Get module count for tenant
          const moduleCountResult = await query(
            'SELECT COUNT(*) as module_count FROM public.tenant_modules WHERE tenant_id = $1 AND status = $2',
            [tenant.id, 'active']
          );

          return {
            ...tenant,
            userCount: parseInt(userCountResult.rows[0]?.user_count || '0'),
            moduleCount: parseInt(moduleCountResult.rows[0]?.module_count || '0'),
            status: 'active' // Default status, can be enhanced later
          };
        } catch (error) {
          logger.error(`Error getting stats for tenant ${tenant.id}:`, error);
          return {
            ...tenant,
            userCount: 0,
            moduleCount: 0,
            status: 'active'
          };
        }
      })
    );

    res.json({
      status: 'success',
      data: { tenants: tenantsWithStats }
    });
  } catch (error) {
    logger.error('Admin tenants fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tenants'
    });
  }
});

// Get tenant details
router.get('/tenants/:tenantId', async (req: any, res: Response) => {
  try {
    const { tenantId } = req.params;
    
    // Get basic tenant information
    const tenantResult = await query(`
      SELECT 
        id,
        subdomain,
        company_name as "companyName",
        plan_id as "planId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM public.tenants 
      WHERE id = $1
    `, [tenantId]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];

    // Get detailed usage statistics
    const [userCountResult, moduleResult, auditResult] = await Promise.all([
      query('SELECT COUNT(*) as user_count FROM public.users WHERE tenant_id = $1', [tenantId]),
      query(`
        SELECT m.name, tm.status, tm.activated_at 
        FROM public.tenant_modules tm 
        JOIN public.modules m ON tm.module_id = m.id 
        WHERE tm.tenant_id = $1
      `, [tenantId]),
      query(`
        SELECT COUNT(*) as activity_count, MAX(created_at) as last_activity 
        FROM public.audit_logs 
        WHERE tenant_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      `, [tenantId])
    ]);

    const tenantWithDetails = {
      ...tenant,
      status: 'active',
      settings: {
        maxUsers: 100, // Default limit, can be made configurable
        storageLimit: '50 GB',
        featuresEnabled: moduleResult.rows.filter(m => m.status === 'active').map(m => m.name)
      },
      usage: {
        currentUsers: parseInt(userCountResult.rows[0]?.user_count || '0'),
        storageUsed: 'N/A', // Would need file system integration
        apiCallsThisMonth: parseInt(auditResult.rows[0]?.activity_count || '0'),
        lastActivity: auditResult.rows[0]?.last_activity || null
      },
      modules: moduleResult.rows
    };

    res.json({
      status: 'success',
      data: { tenant: tenantWithDetails }
    });
  } catch (error) {
    logger.error('Admin tenant detail fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tenant details'
    });
  }
});

// Update tenant status
router.put('/tenants/:tenantId/status', async (req: any, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be active, suspended, or inactive'
      });
    }

    // Update tenant status in database
    const updateResult = await query(
      'UPDATE public.tenants SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [tenantId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }

    logger.info(`Admin ${req.user?.email} updated tenant ${tenantId} status to ${status}`);

    res.json({
      status: 'success',
      message: 'Tenant status updated successfully'
    });
  } catch (error) {
    logger.error('Admin tenant status update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update tenant status'
    });
  }
});

// Get system-wide usage statistics
router.get('/stats', async (req: any, res: Response) => {
  try {
    // Get real system-wide statistics
    const [tenantStats, userStats, moduleStats, auditStats] = await Promise.all([
      query(`
        SELECT COUNT(*) as total_tenants,
               COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as new_tenants_this_month
        FROM public.tenants
      `),
      query('SELECT COUNT(*) as total_users FROM public.users'),
      query(`
        SELECT COUNT(*) as total_active_modules 
        FROM public.tenant_modules 
        WHERE status = 'active'
      `),
      query(`
        SELECT COUNT(*) as api_calls_today 
        FROM public.audit_logs 
        WHERE DATE(created_at) = CURRENT_DATE
      `)
    ]);

    const stats = {
      totalTenants: parseInt(tenantStats.rows[0]?.total_tenants || '0'),
      activeTenants: parseInt(tenantStats.rows[0]?.total_tenants || '0'), // All tenants considered active for now
      suspendedTenants: 0, // Would need status field
      inactiveTenants: 0,
      totalUsers: parseInt(userStats.rows[0]?.total_users || '0'),
      totalStorageUsed: 'N/A', // Would need file system integration
      apiCallsToday: parseInt(auditStats.rows[0]?.api_calls_today || '0'),
      revenueThisMonth: 0, // Would need billing integration
      newTenantsThisMonth: parseInt(tenantStats.rows[0]?.new_tenants_this_month || '0'),
      totalActiveModuleSubscriptions: parseInt(moduleStats.rows[0]?.total_active_modules || '0')
    };

    res.json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    logger.error('Admin stats fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch system statistics'
    });
  }
});

//==============================================================================
// RBAC MANAGEMENT - User and Role Management
//==============================================================================

// Get all users for a specific tenant
router.get('/tenants/:tenantId/users', async (req: any, res: Response) => {
  try {
    const { tenantId } = req.params;
    
    // Get tenant subdomain first
    const tenantResult = await query(
      'SELECT subdomain FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }
    
    const subdomain = tenantResult.rows[0].subdomain;
    
    // Get users from tenant schema
    const usersResult = await tenantQuery(
      subdomain,
      'SELECT id, email, first_name, last_name, role, permissions, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      status: 'success',
      data: { users: usersResult.rows }
    });
  } catch (error) {
    logger.error('Admin users fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// Create new user in tenant
router.post('/tenants/:tenantId/users', async (req: any, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { email, password, firstName, lastName, role, permissions } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, first name, last name, and role are required'
      });
    }

    // Validate role
    if (!['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Role must be admin, manager, or user'
      });
    }

    // Get tenant subdomain
    const tenantResult = await query(
      'SELECT subdomain FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }
    
    const subdomain = tenantResult.rows[0].subdomain;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Set default permissions based on role
    const defaultPermissions = {
      'admin': ['read', 'write', 'delete', 'admin'],
      'manager': ['read', 'write'],
      'user': ['read']
    };

    const userPermissions = permissions || defaultPermissions[role];

    // Create user in tenant schema
    const result = await tenantQuery(
      subdomain,
      'INSERT INTO users (email, password_hash, first_name, last_name, role, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role, permissions, created_at',
      [email, passwordHash, firstName, lastName, role, userPermissions]
    );

    logger.info(`Admin ${req.user?.email} created user ${email} in tenant ${subdomain}`);

    res.status(201).json({
      status: 'success',
      data: { user: result.rows[0] },
      message: 'User created successfully'
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    logger.error('Admin user creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
  }
});

// Update user permissions/role
router.put('/tenants/:tenantId/users/:userId', async (req: any, res: Response) => {
  try {
    const { tenantId, userId } = req.params;
    const { role, permissions, isActive } = req.body;

    // Get tenant subdomain
    const tenantResult = await query(
      'SELECT subdomain FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }
    
    const subdomain = tenantResult.rows[0].subdomain;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (role) {
      if (!['admin', 'manager', 'user'].includes(role)) {
        return res.status(400).json({
          status: 'error',
          message: 'Role must be admin, manager, or user'
        });
      }
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (permissions) {
      updates.push(`permissions = $${paramCount++}`);
      values.push(permissions);
    }

    if (typeof isActive === 'boolean') {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, permissions, is_active, updated_at
    `;

    const result = await tenantQuery(subdomain, updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    logger.info(`Admin ${req.user?.email} updated user ${userId} in tenant ${subdomain}`);

    res.json({
      status: 'success',
      data: { user: result.rows[0] },
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Admin user update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
});

// Delete/deactivate user
router.delete('/tenants/:tenantId/users/:userId', async (req: any, res: Response) => {
  try {
    const { tenantId, userId } = req.params;
    const { hardDelete } = req.query;

    // Get tenant subdomain
    const tenantResult = await query(
      'SELECT subdomain FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }
    
    const subdomain = tenantResult.rows[0].subdomain;

    if (hardDelete === 'true') {
      // Hard delete - remove from database
      const result = await tenantQuery(
        subdomain,
        'DELETE FROM users WHERE id = $1 RETURNING email',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      logger.info(`Admin ${req.user?.email} deleted user ${result.rows[0].email} from tenant ${subdomain}`);
      
      res.json({
        status: 'success',
        message: 'User deleted permanently'
      });
    } else {
      // Soft delete - deactivate user
      const result = await tenantQuery(
        subdomain,
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING email',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      logger.info(`Admin ${req.user?.email} deactivated user ${result.rows[0].email} in tenant ${subdomain}`);
      
      res.json({
        status: 'success',
        message: 'User deactivated successfully'
      });
    }
  } catch (error) {
    logger.error('Admin user deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
});

// Get available roles and permissions
router.get('/roles', async (req: any, res: Response) => {
  try {
    const rolesAndPermissions = {
      availableRoles: [
        {
          name: 'admin',
          description: 'Full access to tenant resources and user management',
          defaultPermissions: ['read', 'write', 'delete', 'admin']
        },
        {
          name: 'manager',
          description: 'Read and write access to business data',
          defaultPermissions: ['read', 'write']
        },
        {
          name: 'user',
          description: 'Read-only access to assigned resources',
          defaultPermissions: ['read']
        }
      ],
      availablePermissions: [
        {
          name: 'read',
          description: 'View data and resources'
        },
        {
          name: 'write',
          description: 'Create and update data'
        },
        {
          name: 'delete',
          description: 'Delete data and resources'
        },
        {
          name: 'admin',
          description: 'Manage users and system settings'
        }
      ]
    };

    res.json({
      status: 'success',
      data: rolesAndPermissions
    });
  } catch (error) {
    logger.error('Admin roles fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch roles and permissions'
    });
  }
});

export default router;
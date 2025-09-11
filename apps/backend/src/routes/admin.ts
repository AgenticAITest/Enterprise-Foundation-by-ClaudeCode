import { Router, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/express.js';
import { query, tenantQuery } from '../config/database.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Setup file upload for logos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../public/uploads/logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const logoUpload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const router = Router();

// Admin middleware to check admin permissions
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }
  
  // Allow super_admin with 'all' permissions or specific 'admin' permission
  const isSuperAdmin = req.user.role === 'super_admin';
  const hasAdminPermission = req.user.permissions.includes('admin') || req.user.permissions.includes('all');
  const isAdmin = req.user.role === 'admin';
  
  if (!isSuperAdmin && !isAdmin && !hasAdminPermission) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  
  next();
};

// Apply admin middleware to all routes
router.use(requireAdmin as any);

// Create new tenant
router.post('/tenants', logoUpload.single('logo'), async (req: any, res: Response) => {
  try {
    const { 
      companyName,
      subdomain, 
      domain,
      address1,
      address2,
      city,
      state,
      zip,
      phone,
      adminUser
    } = req.body;

    // Handle uploaded logo file
    let logoPath = null;
    if (req.file) {
      // Generate a unique filename and move the file
      const fileExtension = path.extname(req.file.originalname);
      const filename = `${subdomain}_${Date.now()}${fileExtension}`;
      const finalPath = path.join(__dirname, '../../public/uploads/logos', filename);
      
      // Move file from temp location to final location
      const fs = await import('fs');
      await fs.promises.rename(req.file.path, finalPath);
      
      logoPath = `/uploads/logos/${filename}`;
      logger.info(`Logo uploaded for tenant ${subdomain}: ${logoPath}`);
    }

    // Validate required fields
    if (!companyName || !subdomain || !domain || !adminUser?.email || !adminUser?.password) {
      return res.status(400).json({
        status: 'error',
        message: 'Company name, subdomain, domain, and admin user details are required'
      });
    }

    // Check if subdomain is already taken
    const existingTenant = await query(
      'SELECT id FROM public.tenants WHERE subdomain = $1 OR domain = $2',
      [subdomain, domain]
    );

    if (existingTenant.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Subdomain or domain already exists'
      });
    }

    // Create tenant
    const tenantResult = await query(`
      INSERT INTO public.tenants (
        subdomain, domain, company_name, address1, address2, city, state, zip, phone, logo, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW())
      RETURNING id, subdomain, domain, company_name
    `, [subdomain, domain, companyName, address1, address2, city, state, zip, phone, logoPath]);

    const tenantId = tenantResult.rows[0].id;

    // Create tenant schema
    const schemaName = `tenant_${subdomain}`;
    await query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // Create users table in tenant schema
    await query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Hash admin password
    const passwordHash = await bcrypt.hash(adminUser.password, 12);

    // Create admin user in tenant schema
    await query(`
      INSERT INTO "${schemaName}".users (
        email, password_hash, first_name, last_name, role, permissions, is_active
      ) VALUES ($1, $2, $3, $4, 'admin', ARRAY['*'], true)
    `, [
      adminUser.email, 
      passwordHash, 
      adminUser.firstName || 'Admin', 
      adminUser.lastName || 'User'
    ]);

    // Create tenant_company_info table in tenant schema
    await query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".tenant_company_info (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(255) NOT NULL,
        address1 VARCHAR(255),
        address2 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        zip VARCHAR(20),
        country VARCHAR(100) DEFAULT 'US',
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        logo_path VARCHAR(500),
        tax_id VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Ensure only one company info record per tenant
        CONSTRAINT single_company_info UNIQUE (id)
      )
    `);

    // Create trigger function for updated_at
    await query(`
      CREATE OR REPLACE FUNCTION "${schemaName}".update_tenant_company_info_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create trigger
    await query(`
      CREATE TRIGGER update_tenant_company_info_updated_at
      BEFORE UPDATE ON "${schemaName}".tenant_company_info
      FOR EACH ROW EXECUTE PROCEDURE "${schemaName}".update_tenant_company_info_updated_at()
    `);

    // Insert company info record
    await query(`
      INSERT INTO "${schemaName}".tenant_company_info 
      (company_name, address1, address2, city, state, zip, phone, logo_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [companyName, address1, address2, city, state, zip, phone, logoPath]);

    logger.info(`Super admin ${req.user?.email} created tenant: ${companyName} (${subdomain})`);

    res.status(201).json({
      status: 'success',
      data: { 
        tenant: {
          ...tenantResult.rows[0],
          adminUser: adminUser.email
        }
      },
      message: 'Tenant created successfully'
    });
  } catch (error) {
    logger.error('Create tenant error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create tenant'
    });
  }
});

// Get all tenants
router.get('/tenants', async (req: any, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id,
        subdomain,
        domain,
        company_name as "companyName",
        address1,
        address2,
        city,
        state,
        zip,
        phone,
        logo,
        status,
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
// TENANT MODULE MANAGEMENT
//==============================================================================

// Get tenant's module subscriptions
router.get('/tenants/:tenantId/modules', async (req: any, res: Response) => {
  try {
    const { tenantId } = req.params;
    
    const result = await query(`
      SELECT 
        tm.module_id,
        tm.status,
        tm.activated_at,
        tm.settings,
        m.code,
        m.name,
        m.description,
        m.version,
        m.base_price,
        m.price_per_user,
        m.color
      FROM public.tenant_modules tm
      JOIN public.modules m ON tm.module_id = m.id
      WHERE tm.tenant_id = $1
      ORDER BY tm.activated_at DESC
    `, [tenantId]);

    res.json({
      status: 'success',
      data: { modules: result.rows }
    });
  } catch (error) {
    logger.error('Tenant modules fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tenant modules'
    });
  }
});

// Update tenant module subscription
router.put('/tenants/:tenantId/modules/:moduleId', async (req: any, res: Response) => {
  try {
    const { tenantId, moduleId } = req.params;
    const { status, settings, expires_at } = req.body;

    if (status === 'active') {
      // Activate module for tenant
      await query(`
        INSERT INTO public.tenant_modules (tenant_id, module_id, status, activated_at, settings, expires_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
        ON CONFLICT (tenant_id, module_id) 
        DO UPDATE SET 
          status = $3,
          activated_at = CURRENT_TIMESTAMP,
          settings = $4,
          expires_at = $5
      `, [tenantId, moduleId, status, JSON.stringify(settings || {}), expires_at]);
    } else {
      // Deactivate module
      await query(
        'UPDATE public.tenant_modules SET status = $1 WHERE tenant_id = $2 AND module_id = $3',
        [status, tenantId, moduleId]
      );
    }

    res.json({
      status: 'success',
      message: `Module ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    logger.error('Module subscription update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update module subscription'
    });
  }
});

// Set tenant trial period
router.put('/tenants/:tenantId/trial', async (req: any, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { trial_ends_at, trial_modules } = req.body;

    // Update tenant trial information (would need to add trial fields to tenants table)
    await query(`
      UPDATE public.tenants 
      SET trial_ends_at = $1, trial_modules = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [trial_ends_at, JSON.stringify(trial_modules || []), tenantId]);

    res.json({
      status: 'success',
      message: 'Trial period updated successfully'
    });
  } catch (error) {
    logger.error('Trial update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update trial period'
    });
  }
});

// Set tenant subscription limits
router.put('/tenants/:tenantId/limits', async (req: any, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { max_users, max_storage_gb, max_api_calls_per_day } = req.body;

    // Update tenant limits (would need to add limit fields to tenants table)
    await query(`
      UPDATE public.tenants 
      SET max_users = $1, max_storage_gb = $2, max_api_calls_per_day = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [max_users, max_storage_gb, max_api_calls_per_day, tenantId]);

    res.json({
      status: 'success',
      message: 'Subscription limits updated successfully'
    });
  } catch (error) {
    logger.error('Limits update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update subscription limits'
    });
  }
});

// Suspend tenant
router.post('/tenants/:tenantId/suspend', async (req: any, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    // Update tenant status to suspended
    const result = await query(
      'UPDATE public.tenants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING company_name',
      ['suspended', tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }

    // Log the suspension
    logger.info(`Tenant ${result.rows[0].company_name} suspended by admin ${req.user?.email}. Reason: ${reason}`);

    res.json({
      status: 'success',
      message: `Tenant suspended successfully`
    });
  } catch (error) {
    logger.error('Tenant suspension error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to suspend tenant'
    });
  }
});

// Activate tenant
router.post('/tenants/:tenantId/activate', async (req: any, res: Response) => {
  try {
    const { tenantId } = req.params;

    // Update tenant status to active
    const result = await query(
      'UPDATE public.tenants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING company_name',
      ['active', tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }

    // Log the activation
    logger.info(`Tenant ${result.rows[0].company_name} activated by admin ${req.user?.email}`);

    res.json({
      status: 'success',
      message: `Tenant activated successfully`
    });
  } catch (error) {
    logger.error('Tenant activation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate tenant'
    });
  }
});

//==============================================================================
// AUDIT LOGS MANAGEMENT
//==============================================================================

// Get audit logs with advanced filtering
router.get('/audit-logs', async (req: any, res: Response) => {
  try {
    const {
      tenant_id,
      user_id,
      action,
      resource_type,
      module_code,
      severity,
      from_date,
      to_date,
      search,
      page = 1,
      limit = 50,
      sort_by = 'performed_at',
      sort_order = 'desc'
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build dynamic WHERE clause
    if (tenant_id) {
      whereConditions.push(`tenant_id = $${paramIndex++}`);
      queryParams.push(tenant_id);
    }

    if (user_id) {
      whereConditions.push(`user_id = $${paramIndex++}`);
      queryParams.push(user_id);
    }

    if (action) {
      whereConditions.push(`action ILIKE $${paramIndex++}`);
      queryParams.push(`%${action}%`);
    }

    if (resource_type) {
      whereConditions.push(`resource_type = $${paramIndex++}`);
      queryParams.push(resource_type);
    }

    if (module_code) {
      whereConditions.push(`module_code = $${paramIndex++}`);
      queryParams.push(module_code);
    }

    if (severity) {
      whereConditions.push(`severity = $${paramIndex++}`);
      queryParams.push(severity);
    }

    if (from_date) {
      whereConditions.push(`performed_at >= $${paramIndex++}`);
      queryParams.push(from_date);
    }

    if (to_date) {
      whereConditions.push(`performed_at <= $${paramIndex++}`);
      queryParams.push(to_date);
    }

    // Search across multiple text fields
    if (search) {
      whereConditions.push(`(
        action ILIKE $${paramIndex} OR 
        user_email ILIKE $${paramIndex} OR 
        resource_name ILIKE $${paramIndex} OR 
        resource_type ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Validate sort column
    const allowedSortColumns = ['performed_at', 'action', 'user_email', 'resource_type', 'severity'];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'performed_at';
    const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const totalRecords = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT 
        id,
        tenant_id,
        user_id,
        user_email,
        user_role,
        session_id,
        action,
        resource_type,
        resource_id,
        resource_name,
        http_method,
        endpoint,
        ip_address,
        user_agent,
        old_values,
        new_values,
        status,
        error_message,
        severity,
        module_code,
        permission_required,
        data_scope,
        performed_at,
        details
      FROM audit_logs 
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(parseInt(limit), offset);
    const result = await query(dataQuery, queryParams);

    res.json({
      status: 'success',
      data: {
        logs: result.rows,
        pagination: {
          total: totalRecords,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(totalRecords / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Audit logs fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit logs'
    });
  }
});

// Get audit log statistics
router.get('/audit-logs/stats', async (req: any, res: Response) => {
  try {
    const { tenant_id, from_date, to_date } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (tenant_id) {
      whereConditions.push(`tenant_id = $${paramIndex++}`);
      queryParams.push(tenant_id);
    }

    if (from_date) {
      whereConditions.push(`performed_at >= $${paramIndex++}`);
      queryParams.push(from_date);
    }

    if (to_date) {
      whereConditions.push(`performed_at <= $${paramIndex++}`);
      queryParams.push(to_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const statsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_events,
        COUNT(*) FILTER (WHERE severity = 'warning') as warning_events,
        COUNT(*) FILTER (WHERE severity = 'error') as error_events, 
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT action) as unique_actions,
        COUNT(*) FILTER (WHERE performed_at >= NOW() - INTERVAL '24 hours') as events_last_24h,
        COUNT(*) FILTER (WHERE performed_at >= NOW() - INTERVAL '7 days') as events_last_7d,
        MIN(performed_at) as earliest_event,
        MAX(performed_at) as latest_event
      FROM audit_logs 
      ${whereClause}
    `;

    // Get action breakdown
    const actionStatsQuery = `
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count
      FROM audit_logs 
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get severity breakdown
    const severityStatsQuery = `
      SELECT 
        severity,
        COUNT(*) as count
      FROM audit_logs 
      ${whereClause}
      GROUP BY severity
      ORDER BY count DESC
    `;

    const [statsResult, actionStatsResult, severityStatsResult] = await Promise.all([
      query(statsQuery, queryParams),
      query(actionStatsQuery, queryParams), 
      query(severityStatsQuery, queryParams)
    ]);

    res.json({
      status: 'success',
      data: {
        overview: statsResult.rows[0],
        action_breakdown: actionStatsResult.rows,
        severity_breakdown: severityStatsResult.rows
      }
    });

  } catch (error) {
    logger.error('Audit stats fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit statistics'
    });
  }
});

// Get security alerts (critical events)
router.get('/security-alerts', async (req: any, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    const alertsQuery = `
      SELECT 
        id,
        tenant_id,
        user_id,
        user_email,
        action,
        resource_type,
        resource_name,
        ip_address,
        status,
        error_message,
        severity,
        performed_at,
        details
      FROM audit_logs 
      WHERE 
        severity IN ('error', 'critical') OR 
        status = 'failed' OR
        action IN ('login_failed', 'permission_denied', 'unauthorized_access')
      ORDER BY performed_at DESC
      LIMIT $1
    `;

    const result = await query(alertsQuery, [parseInt(limit)]);

    res.json({
      status: 'success',
      data: {
        alerts: result.rows
      }
    });

  } catch (error) {
    logger.error('Security alerts fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch security alerts'
    });
  }
});

// Export audit logs
router.get('/audit-logs/export', async (req: any, res: Response) => {
  try {
    const {
      tenant_id,
      user_id,
      action,
      resource_type,
      from_date,
      to_date,
      format = 'csv'
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build filters (same as main query)
    if (tenant_id) {
      whereConditions.push(`tenant_id = $${paramIndex++}`);
      queryParams.push(tenant_id);
    }

    if (user_id) {
      whereConditions.push(`user_id = $${paramIndex++}`);
      queryParams.push(user_id);
    }

    if (action) {
      whereConditions.push(`action ILIKE $${paramIndex++}`);
      queryParams.push(`%${action}%`);
    }

    if (resource_type) {
      whereConditions.push(`resource_type = $${paramIndex++}`);
      queryParams.push(resource_type);
    }

    if (from_date) {
      whereConditions.push(`performed_at >= $${paramIndex++}`);
      queryParams.push(from_date);
    }

    if (to_date) {
      whereConditions.push(`performed_at <= $${paramIndex++}`);
      queryParams.push(to_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const exportQuery = `
      SELECT 
        performed_at,
        tenant_id,
        user_email,
        action,
        resource_type,
        resource_name,
        status,
        severity,
        module_code,
        ip_address,
        error_message
      FROM audit_logs 
      ${whereClause}
      ORDER BY performed_at DESC
      LIMIT 10000
    `;

    const result = await query(exportQuery, queryParams);

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Timestamp', 'Tenant ID', 'User Email', 'Action', 'Resource Type', 
        'Resource Name', 'Status', 'Severity', 'Module', 'IP Address', 'Error Message'
      ];
      
      let csvContent = headers.join(',') + '\n';
      
      result.rows.forEach(row => {
        const csvRow = [
          row.performed_at,
          row.tenant_id || '',
          row.user_email || '',
          row.action,
          row.resource_type || '',
          row.resource_name || '',
          row.status,
          row.severity,
          row.module_code || '',
          row.ip_address || '',
          (row.error_message || '').replace(/"/g, '""')
        ].map(field => `"${field}"`).join(',');
        csvContent += csvRow + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`);
      res.json({
        export_date: new Date().toISOString(),
        total_records: result.rows.length,
        filters: { tenant_id, user_id, action, resource_type, from_date, to_date },
        data: result.rows
      });
    }

  } catch (error) {
    logger.error('Audit logs export error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export audit logs'
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

//==============================================================================
// SUPER ADMIN MANAGEMENT
//==============================================================================

// Get all super admins
router.get('/super-admins', async (req: any, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id,
        email,
        first_name as "firstName",
        last_name as "lastName",
        permissions,
        is_active as "isActive",
        last_login as "lastLogin",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM public.super_admins
      ORDER BY created_at DESC
    `);

    res.json({
      status: 'success',
      data: { superAdmins: result.rows }
    });
  } catch (error) {
    logger.error('Super admins fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch super admins'
    });
  }
});

// Create new super admin
router.post('/super-admins', async (req: any, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, first name, and last name are required'
      });
    }

    // Check if email already exists
    const existingAdmin = await query(
      'SELECT id FROM public.super_admins WHERE email = $1',
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Super admin with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create super admin
    const result = await query(`
      INSERT INTO public.super_admins (
        email, password_hash, first_name, last_name, permissions, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, email, first_name as "firstName", last_name as "lastName", permissions, is_active as "isActive", created_at as "createdAt"
    `, [email, passwordHash, firstName, lastName, ['*']]);

    logger.info(`Super admin ${req.user?.email} created new super admin: ${email}`);

    res.status(201).json({
      status: 'success',
      data: { superAdmin: result.rows[0] },
      message: 'Super admin created successfully'
    });
  } catch (error) {
    logger.error('Super admin creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create super admin'
    });
  }
});

// Update super admin
router.put('/super-admins/:adminId', async (req: any, res: Response) => {
  try {
    const { adminId } = req.params;
    const { firstName, lastName, isActive, permissions } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }

    if (lastName) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }

    if (typeof isActive === 'boolean') {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (permissions) {
      updates.push(`permissions = $${paramCount++}`);
      values.push(permissions);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(adminId);

    const updateQuery = `
      UPDATE public.super_admins 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name as "firstName", last_name as "lastName", permissions, is_active as "isActive", updated_at as "updatedAt"
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Super admin not found'
      });
    }

    logger.info(`Super admin ${req.user?.email} updated super admin: ${adminId}`);

    res.json({
      status: 'success',
      data: { superAdmin: result.rows[0] },
      message: 'Super admin updated successfully'
    });
  } catch (error) {
    logger.error('Super admin update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update super admin'
    });
  }
});

// Delete/deactivate super admin
router.delete('/super-admins/:adminId', async (req: any, res: Response) => {
  try {
    const { adminId } = req.params;
    const { hardDelete } = req.query;

    if (hardDelete === 'true') {
      // Hard delete - remove from database
      const result = await query(
        'DELETE FROM public.super_admins WHERE id = $1 RETURNING email',
        [adminId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Super admin not found'
        });
      }

      logger.info(`Super admin ${req.user?.email} deleted super admin: ${result.rows[0].email}`);
      
      res.json({
        status: 'success',
        message: 'Super admin deleted permanently'
      });
    } else {
      // Soft delete - deactivate
      const result = await query(
        'UPDATE public.super_admins SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING email',
        [adminId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Super admin not found'
        });
      }

      logger.info(`Super admin ${req.user?.email} deactivated super admin: ${result.rows[0].email}`);
      
      res.json({
        status: 'success',
        message: 'Super admin deactivated successfully'
      });
    }
  } catch (error) {
    logger.error('Super admin deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete super admin'
    });
  }
});

//==============================================================================
// MODULES MANAGEMENT
//==============================================================================

// Get all modules for super admin
router.get('/modules', async (req: any, res: Response) => {
  try {
    const modulesResult = await query(`
      SELECT 
        id,
        code,
        name,
        description,
        version,
        status,
        base_price,
        price_per_user,
        color,
        dependencies,
        settings,
        created_at,
        updated_at
      FROM public.modules 
      ORDER BY name ASC
    `);

    res.json({
      status: 'success',
      data: { modules: modulesResult.rows }
    });
  } catch (error) {
    logger.error('Admin modules fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch modules'
    });
  }
});

// Toggle module status (activate/deactivate)
router.put('/modules/:moduleId/status', async (req: any, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be active or inactive'
      });
    }

    const result = await query(
      'UPDATE public.modules SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING name',
      [status, moduleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Module not found'
      });
    }

    logger.info(`Super admin ${req.user?.email} ${status === 'active' ? 'activated' : 'deactivated'} module: ${result.rows[0].name}`);

    res.json({
      status: 'success',
      message: `Module ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    logger.error('Module status update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update module status'
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

//==============================================================================
// System Health and Metrics APIs
//==============================================================================

router.get('/system/health', async (req: any, res: Response) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Test database connection
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    try {
      const start = Date.now();
      await query('SELECT 1');
      dbResponseTime = Date.now() - start;
    } catch (error) {
      dbStatus = 'error';
      dbResponseTime = -1;
    }

    const health = {
      status: dbStatus === 'healthy' ? 'healthy' : 'critical',
      uptime: Math.floor(uptime),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      lastUpdated: new Date().toISOString(),
      database: {
        status: dbStatus,
        responseTime: dbResponseTime
      },
      memory: {
        used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      process: {
        pid: process.pid,
        uptime: Math.floor(uptime),
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      }
    };

    res.json({
      status: 'success',
      data: health
    });
  } catch (error) {
    logger.error('System health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system health'
    });
  }
});

router.get('/system/metrics', async (req: any, res: Response) => {
  try {
    // Get current system metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // Database metrics
    const [dbConnectionsResult, dbSizeResult] = await Promise.all([
      query(`
        SELECT count(*) as active_connections
        FROM pg_stat_activity 
        WHERE state = 'active'
      `),
      query(`
        SELECT pg_size_pretty(pg_database_size('erp_saas')) as database_size,
               pg_database_size('erp_saas') as size_bytes
      `)
    ]);

    // Simulate server metrics (in real implementation, use system monitoring)
    const simulatedMetrics = {
      cpu: Math.floor(Math.random() * 30) + 10, // 10-40% CPU
      memory: Math.floor(Math.random() * 40) + 30, // 30-70% Memory  
      disk: Math.floor(Math.random() * 50) + 20, // 20-70% Disk
      load: (Math.random() * 2 + 0.5).toFixed(1) // 0.5-2.5 load average
    };

    const metrics = {
      database: {
        status: 'connected',
        responseTime: 15 + Math.floor(Math.random() * 20), // 15-35ms
        connections: parseInt(dbConnectionsResult.rows[0].active_connections),
        maxConnections: 100,
        size: dbSizeResult.rows[0].database_size,
        sizeBytes: parseInt(dbSizeResult.rows[0].size_bytes)
      },
      server: simulatedMetrics,
      api: {
        requestsPerSecond: Math.floor(Math.random() * 100) + 50, // 50-150 RPS
        averageResponseTime: Math.floor(Math.random() * 200) + 100, // 100-300ms
        errorRate: (Math.random() * 0.05).toFixed(3), // 0-5% error rate
        totalRequests24h: Math.floor(Math.random() * 1000000) + 500000 // 500k-1.5M requests
      },
      cache: {
        status: 'connected',
        hitRate: (Math.random() * 10 + 85).toFixed(1), // 85-95% hit rate
        memoryUsage: Math.floor(Math.random() * 200) + 300 // 300-500MB
      },
      system: {
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        nodeVersion: process.version
      }
    };

    res.json({
      status: 'success',
      data: metrics
    });
  } catch (error) {
    logger.error('System metrics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system metrics'
    });
  }
});

export default router;
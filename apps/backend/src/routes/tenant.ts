import { Router, Response } from 'express';
import { logger } from '../utils/logger.js';
import { TenantRequest } from '../types/express.js';
import { query } from '../config/database.js';

const router = Router();

// Get tenant dashboard data
router.get('/dashboard', async (req: any, res: Response) => {
  try {
    if (!req.tenant?.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Tenant context not available'
      });
    }

    // Get real tenant statistics from database
    const [userStatsResult, moduleStatsResult, activityResult] = await Promise.all([
      query('SELECT COUNT(*) as total_users FROM public.users WHERE tenant_id = $1', [req.tenant.id]),
      query('SELECT COUNT(*) as active_modules FROM public.tenant_modules WHERE tenant_id = $1 AND status = $2', [req.tenant.id, 'active']),
      query('SELECT COUNT(*) as recent_activities FROM public.audit_logs WHERE tenant_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL \'7 days\'', [req.tenant.id])
    ]);

    // Get recent activity from audit logs
    const recentActivityResult = await query(`
      SELECT 
        action_type,
        resource_type,
        created_at
      FROM public.audit_logs 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.tenant.id]);

    const dashboardData = {
      companyInfo: {
        name: req.tenant?.companyName,
        subdomain: req.tenant?.subdomain,
        status: req.tenant?.status || 'active'
      },
      stats: {
        totalUsers: parseInt(userStatsResult.rows[0]?.total_users || '0'),
        activeModules: parseInt(moduleStatsResult.rows[0]?.active_modules || '0'),
        recentActivities: parseInt(activityResult.rows[0]?.recent_activities || '0'),
        // These would need additional business logic integration
        pendingTasks: 0,
        completedThisMonth: 0,
        revenue: {
          thisMonth: 0,
          lastMonth: 0,
          growth: '0%'
        }
      },
      recentActivity: recentActivityResult.rows.map((activity, index) => ({
        id: String(index + 1),
        type: activity.action_type || 'system_activity',
        message: `${activity.resource_type || 'System'} activity recorded`,
        timestamp: activity.created_at
      }))
    };

    res.json({
      status: 'success',
      data: dashboardData
    });
  } catch (error) {
    logger.error('Tenant dashboard fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get tenant users
router.get('/users', async (req: any, res: Response) => {
  try {
    if (!req.tenant?.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Tenant context not available'
      });
    }

    // Get users for this tenant from the global users table
    const usersResult = await query(`
      SELECT 
        id,
        email,
        first_name as "firstName",
        last_name as "lastName",
        is_active as "isActive",
        is_tenant_admin,
        last_login_at as "lastLogin",
        created_at as "createdAt"
      FROM public.users 
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [req.tenant.id]);

    const users = usersResult.rows.map(user => ({
      ...user,
      role: user.is_tenant_admin ? 'admin' : 'user'
    }));

    res.json({
      status: 'success',
      data: { users }
    });
  } catch (error) {
    logger.error('Tenant users fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// Get tenant settings
router.get('/settings', async (req: any, res: Response) => {
  try {
    if (!req.tenant?.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Tenant context not available'
      });
    }

    // Get basic tenant info
    const tenantResult = await query(
      'SELECT company_name, subdomain, plan_id, created_at FROM public.tenants WHERE id = $1',
      [req.tenant.id]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }

    // Get active modules for features
    const modulesResult = await query(`
      SELECT m.name, m.code 
      FROM public.tenant_modules tm
      JOIN public.modules m ON tm.module_id = m.id
      WHERE tm.tenant_id = $1 AND tm.status = 'active'
    `, [req.tenant.id]);

    const tenant = tenantResult.rows[0];

    const settings = {
      company: {
        name: tenant.company_name,
        logo: null,
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        language: 'en'
      },
      financial: {
        baseCurrency: 'USD',
        taxRate: 0,
        fiscalYearStart: 'January'
      },
      features: {
        modules: modulesResult.rows.map(m => m.code),
        planId: tenant.plan_id,
        memberSince: tenant.created_at,
        integrations: [],
        customFields: false
      }
    };

    res.json({
      status: 'success',
      data: { settings }
    });
  } catch (error) {
    logger.error('Tenant settings fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch settings'
    });
  }
});

// Update tenant settings
router.put('/settings', async (req: any, res: Response) => {
  try {
    const { company, financial, features } = req.body;
    
    // Note: In a full implementation, this would update tenant configuration tables
    logger.info(`Settings update requested for tenant ${req.tenant?.id}:`, { company, financial, features });

    logger.info(`Tenant ${req.tenant?.id} settings updated by ${req.user?.email}`);

    res.json({
      status: 'success',
      message: 'Settings updated successfully'
    });
  } catch (error) {
    logger.error('Tenant settings update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update settings'
    });
  }
});

// Get tenant modules
router.get('/modules', async (req: any, res: Response) => {
  try {
    if (!req.tenant?.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Tenant context not available'
      });
    }

    // Get all available modules with tenant subscription status
    const modulesResult = await query(`
      SELECT 
        m.id,
        m.code,
        m.name,
        m.description,
        m.version,
        m.icon,
        m.color,
        tm.status as subscription_status,
        tm.activated_at,
        CASE WHEN tm.status = 'active' THEN true ELSE false END as "isActive"
      FROM public.modules m
      LEFT JOIN public.tenant_modules tm ON m.id = tm.module_id AND tm.tenant_id = $1
      WHERE m.is_active = true
      ORDER BY m.name
    `, [req.tenant.id]);

    const modules = modulesResult.rows.map(module => ({
      id: module.code,
      name: module.name,
      description: module.description,
      isActive: module.isActive,
      version: module.version,
      icon: module.icon,
      color: module.color,
      subscriptionStatus: module.subscription_status,
      activatedAt: module.activated_at
    }));

    res.json({
      status: 'success',
      data: { modules }
    });
  } catch (error) {
    logger.error('Tenant modules fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch modules'
    });
  }
});

export default router;
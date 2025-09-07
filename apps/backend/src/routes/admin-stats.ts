import { Router, Response } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/express.js';
import pool from '../config/database.js';

const router = Router();

/**
 * Get system-wide tenant statistics
 * GET /api/admin/tenants/stats
 */
router.get('/tenants/stats',
  authenticateToken,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const client = await pool.connect();
      
      try {
        // Get tenant statistics
        const tenantStatsQuery = `
          SELECT 
            COUNT(*) as total_tenants,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tenants,
            COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_tenants,
            COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_tenants,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_tenants_30d,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_tenants_7d
          FROM tenants;
        `;
        
        const tenantStats = await client.query(tenantStatsQuery);
        
        // Get user statistics across all tenant schemas
        // First get all tenant schemas
        const tenantSchemasResult = await client.query(`
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name LIKE 'tenant_%'
        `);
        
        let userStats = { rows: [{ total_users: 0, new_users_30d: 0, new_users_7d: 0 }] };
        
        if (tenantSchemasResult.rows.length > 0) {
          // Build dynamic query to count users across all tenant schemas
          const userCountQueries = tenantSchemasResult.rows.map(row => 
            `SELECT 
               COUNT(*) as users,
               COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_30d,
               COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_7d
             FROM ${row.schema_name}.users`
          ).join(' UNION ALL ');
          
          const aggregateQuery = `
            WITH user_counts AS (${userCountQueries})
            SELECT 
              SUM(users) as total_users,
              SUM(new_30d) as new_users_30d, 
              SUM(new_7d) as new_users_7d
            FROM user_counts
          `;
          
          userStats = await client.query(aggregateQuery);
        }
        
        // Get module activation statistics
        const moduleStatsQuery = `
          SELECT 
            m.name as module_name,
            m.code as module_code,
            COUNT(tm.tenant_id) as active_tenants,
            COUNT(CASE WHEN tm.activated_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_activations_30d
          FROM modules m
          LEFT JOIN tenant_modules tm ON m.id = tm.module_id AND tm.status = 'active'
          GROUP BY m.id, m.name, m.code
          ORDER BY active_tenants DESC;
        `;
        
        const moduleStats = await client.query(moduleStatsQuery);
        
        // Get growth trends (last 12 months)
        const growthQuery = `
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as tenant_count
          FROM tenants
          WHERE created_at >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month;
        `;
        
        const growthTrends = await client.query(growthQuery);
        
        res.json({
          status: 'success',
          data: {
            tenant_overview: tenantStats.rows[0],
            user_overview: userStats.rows[0],
            module_usage: moduleStats.rows,
            growth_trends: growthTrends.rows
          }
        });
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch tenant statistics'
      });
    }
  }
);

/**
 * Get module usage across all tenants
 * GET /api/admin/modules/usage
 */
router.get('/modules/usage',
  authenticateToken,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const client = await pool.connect();
      
      try {
        // Get detailed module usage statistics
        const moduleUsageQuery = `
          WITH module_stats AS (
            SELECT 
              m.id,
              m.name,
              m.code,
              m.description,
              COUNT(tm.tenant_id) as active_tenants,
              COUNT(CASE WHEN tm.activated_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_activations,
              AVG(CASE WHEN tm.status = 'active' THEN 
                EXTRACT(EPOCH FROM (NOW() - tm.activated_at))/86400 
              END) as avg_usage_days
            FROM modules m
            LEFT JOIN tenant_modules tm ON m.id = tm.module_id
            GROUP BY m.id, m.name, m.code, m.description
          ),
          tenant_counts AS (
            SELECT COUNT(*) as total_tenants FROM tenants WHERE status = 'active'
          )
          SELECT 
            ms.*,
            tc.total_tenants,
            ROUND((ms.active_tenants::decimal / NULLIF(tc.total_tenants, 0)) * 100, 2) as adoption_rate
          FROM module_stats ms, tenant_counts tc
          ORDER BY ms.active_tenants DESC;
        `;
        
        const moduleUsage = await client.query(moduleUsageQuery);
        
        // Get module activation trends over time
        const activationTrendsQuery = `
          SELECT 
            m.name as module_name,
            m.code as module_code,
            DATE_TRUNC('month', tm.activated_at) as month,
            COUNT(*) as activations
          FROM modules m
          JOIN tenant_modules tm ON m.id = tm.module_id
          WHERE tm.activated_at >= NOW() - INTERVAL '12 months'
          GROUP BY m.id, m.name, m.code, DATE_TRUNC('month', tm.activated_at)
          ORDER BY month, module_name;
        `;
        
        const activationTrends = await client.query(activationTrendsQuery);
        
        res.json({
          status: 'success',
          data: {
            module_stats: moduleUsage.rows,
            activation_trends: activationTrends.rows
          }
        });
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching module usage:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch module usage statistics'
      });
    }
  }
);

/**
 * Get revenue analytics (placeholder for billing integration)
 * GET /api/admin/billing/revenue
 */
router.get('/billing/revenue',
  authenticateToken,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Note: This is a placeholder implementation
      // In a real system, this would integrate with billing service
      
      // Calculate revenue based on actual module pricing and tenant subscriptions
      const client = await pool.connect();
      
      try {
        // Get revenue calculation based on actual data
        const revenueQuery = `
          SELECT 
            SUM(m.base_price::numeric) as total_base_revenue,
            COUNT(tm.tenant_id) as total_subscriptions,
            AVG(m.base_price::numeric) as avg_module_price
          FROM tenant_modules tm
          JOIN modules m ON tm.module_id = m.id
          WHERE tm.status = 'active'
        `;
        
        const moduleRevenueQuery = `
          SELECT 
            m.code as module_code,
            m.name as module_name,
            COUNT(tm.tenant_id) as tenants,
            SUM(m.base_price::numeric) as revenue
          FROM modules m
          LEFT JOIN tenant_modules tm ON m.id = tm.module_id AND tm.status = 'active'
          GROUP BY m.id, m.code, m.name, m.base_price
          ORDER BY revenue DESC NULLS LAST
        `;
        
        const [revenueResult, moduleRevenueResult] = await Promise.all([
          client.query(revenueQuery),
          client.query(moduleRevenueQuery)
        ]);
        
        const baseRevenue = parseFloat(revenueResult.rows[0]?.total_base_revenue || '0');
        
        const revenueData = {
          total_monthly_recurring_revenue: baseRevenue,
          total_annual_recurring_revenue: baseRevenue * 12,
          monthly_growth_rate: 0, // Would need historical data
          churn_rate: 0, // Would need billing integration
          average_revenue_per_tenant: parseFloat(revenueResult.rows[0]?.avg_module_price || '0'),
          revenue_by_module: moduleRevenueResult.rows.map(row => ({
            module_code: row.module_code,
            module_name: row.module_name,
            revenue: parseFloat(row.revenue || '0'),
            tenants: parseInt(row.tenants || '0')
          })),
          monthly_trends: [], // Would need historical billing data
          note: 'Revenue calculated from module base prices. Historical trends require billing integration.'
        };
        
        res.json({
          status: 'success',
          data: revenueData
        });
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch revenue analytics'
      });
    }
  }
);

/**
 * Update global module settings
 * PUT /api/admin/modules/:moduleId/settings
 */
router.put('/modules/:moduleId/settings',
  authenticateToken,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { moduleId } = req.params;
      const { settings } = req.body;
      const adminUser = req.user;
      
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          status: 'error',
          message: 'Valid settings object is required'
        });
      }
      
      const client = await pool.connect();
      
      try {
        // Check if module exists
        const moduleCheck = await client.query(
          'SELECT id, name, code FROM modules WHERE id = $1',
          [moduleId]
        );
        
        if (moduleCheck.rows.length === 0) {
          return res.status(404).json({
            status: 'error',
            message: 'Module not found'
          });
        }
        
        const module = moduleCheck.rows[0];
        
        // Update module settings
        await client.query(
          'UPDATE modules SET settings = $1, updated_at = NOW() WHERE id = $2',
          [JSON.stringify(settings), moduleId]
        );
        
        // Log the settings update
        await client.query(`
          INSERT INTO audit_logs (
            user_id, action, resource_type, resource_id, module_code,
            details, severity, performed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          adminUser?.id,
          'module_settings_updated',
          'module',
          moduleId,
          module.code,
          JSON.stringify({ 
            module_name: module.name, 
            updated_by: adminUser?.email,
            settings: settings
          }),
          'info'
        ]);
        
        res.json({
          status: 'success',
          message: `Settings updated for module "${module.name}"`,
          data: {
            module_id: moduleId,
            module_name: module.name,
            module_code: module.code,
            settings: settings
          }
        });
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating module settings:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update module settings'
      });
    }
  }
);

export default router;
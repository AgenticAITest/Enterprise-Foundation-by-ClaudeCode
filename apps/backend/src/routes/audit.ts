import { Router, Response } from 'express';
import { AuditService } from '../services/audit.service.js';
import { authenticateToken, requireTenantAccess } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/express.js';
import pool from '../config/database.js';

const router = Router();
const auditService = new AuditService(pool);

/**
 * Get audit logs with filtering
 * GET /api/audit/logs
 */
router.get('/logs', 
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Authentication required' 
        });
      }

      // Super admin can see all logs, others only their tenant
      const tenantId = user.role === 'super_admin' 
        ? req.query.tenant_id as string || undefined
        : user.tenantId;

      const filters = {
        tenant_id: tenantId,
        user_id: req.query.user_id as string,
        action: req.query.action as string,
        resource_type: req.query.resource_type as string,
        module_code: req.query.module_code as string,
        severity: req.query.severity as string,
        from_date: req.query.from_date ? new Date(req.query.from_date as string) : undefined,
        to_date: req.query.to_date ? new Date(req.query.to_date as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const logs = await auditService.queryLogs(filters);
      
      res.json({
        status: 'success',
        data: logs,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: logs.length
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch audit logs'
      });
    }
  }
);

/**
 * Get audit logs for specific tenant
 * GET /api/audit/tenants/:tenantId/logs
 */
router.get('/tenants/:tenantId/logs',
  authenticateToken,
  requireTenantAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tenantId } = req.params;
      
      const filters = {
        tenant_id: tenantId,
        user_id: req.query.user_id as string,
        action: req.query.action as string,
        resource_type: req.query.resource_type as string,
        module_code: req.query.module_code as string,
        severity: req.query.severity as string,
        from_date: req.query.from_date ? new Date(req.query.from_date as string) : undefined,
        to_date: req.query.to_date ? new Date(req.query.to_date as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const logs = await auditService.queryLogs(filters);
      
      res.json({
        status: 'success',
        data: logs,
        tenant_id: tenantId
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch tenant audit logs'
      });
    }
  }
);

/**
 * Get user activity logs
 * GET /api/audit/users/:userId/activity
 */
router.get('/users/:userId/activity',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const user = req.user;
      
      // Users can only see their own activity unless they're admin
      if (user?.id !== userId && user?.role !== 'super_admin' && user?.role !== 'tenant_admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      const filters = {
        tenant_id: user?.role === 'super_admin' ? req.query.tenant_id as string : user?.tenantId,
        user_id: userId,
        from_date: req.query.from_date ? new Date(req.query.from_date as string) : undefined,
        to_date: req.query.to_date ? new Date(req.query.to_date as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const logs = await auditService.queryLogs(filters);
      
      res.json({
        status: 'success',
        data: logs,
        user_id: userId
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user activity'
      });
    }
  }
);

/**
 * Get security events (failed logins, permission denied, etc.)
 * GET /api/audit/security-events
 */
router.get('/security-events',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      
      // Only admins can view security events
      if (user?.role !== 'super_admin' && user?.role !== 'tenant_admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }

      const filters = {
        tenant_id: user.role === 'super_admin' ? req.query.tenant_id as string : user.tenantId,
        action: req.query.action as string,
        severity: req.query.severity as string || 'warning',
        from_date: req.query.from_date ? new Date(req.query.from_date as string) : undefined,
        to_date: req.query.to_date ? new Date(req.query.to_date as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      // Filter for security-related events
      const securityActions = ['login_failed', 'permission_denied', 'rate_limit_hit', 'unauthorized_access'];
      if (!filters.action) {
        // If no specific action, search for any security event
        const logs = await Promise.all(
          securityActions.map(action => 
            auditService.queryLogs({ ...filters, action, limit: 25 })
          )
        );
        
        const allLogs = logs.flat()
          .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
          .slice(0, filters.limit);
          
        res.json({
          status: 'success',
          data: allLogs,
          event_types: securityActions
        });
      } else {
        const logs = await auditService.queryLogs(filters);
        res.json({
          status: 'success',
          data: logs
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch security events'
      });
    }
  }
);

/**
 * Get audit statistics
 * GET /api/audit/statistics
 */
router.get('/statistics',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      const tenantId = user?.role === 'super_admin' 
        ? req.query.tenant_id as string 
        : user?.tenantId;

      const stats = await auditService.getStatistics(tenantId);
      
      res.json({
        status: 'success',
        data: stats,
        tenant_id: tenantId
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch audit statistics'
      });
    }
  }
);

export default router;
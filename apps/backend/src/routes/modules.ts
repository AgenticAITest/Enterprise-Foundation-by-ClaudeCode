import { Router, Response } from 'express';
import { ModuleService } from '../services/module.service.js';
import { AuthenticatedRequest } from '../types/express.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Middleware to check super admin or tenant admin permissions
const requireAdminAccess = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (!req.user || (req.user.role !== 'super_admin' && !req.user.is_tenant_admin)) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * GET /api/modules
 * Get all available modules
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const modules = await ModuleService.getAllModules();
    
    res.json({
      status: 'success',
      data: { modules }
    });
  } catch (error) {
    logger.error('Error fetching modules:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch modules'
    });
  }
});

/**
 * GET /api/modules/:code
 * Get specific module by code
 */
router.get('/:code', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.params;
    const module = await ModuleService.getModuleByCode(code);
    
    if (!module) {
      return res.status(404).json({
        status: 'error',
        message: 'Module not found'
      });
    }

    res.json({
      status: 'success',
      data: { module }
    });
  } catch (error) {
    logger.error('Error fetching module:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch module'
    });
  }
});

/**
 * GET /api/modules/:code/stats
 * Get module statistics (super admin only)
 */
router.get('/:code/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only super admins can view module statistics
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Super admin access required'
      });
    }

    const { code } = req.params;
    const stats = await ModuleService.getModuleStatistics(code);
    
    res.json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    logger.error('Error fetching module statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch module statistics'
    });
  }
});

/**
 * GET /api/tenants/:tenantId/modules
 * Get modules for a specific tenant
 */
router.get('/tenants/:tenantId/modules', requireAdminAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    
    // Tenant admins can only access their own tenant's modules
    if (req.user?.role !== 'super_admin' && req.user?.tenantId !== tenantId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const modules = await ModuleService.getTenantModules(tenantId);
    
    res.json({
      status: 'success',
      data: { modules }
    });
  } catch (error) {
    logger.error('Error fetching tenant modules:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tenant modules'
    });
  }
});

/**
 * POST /api/tenants/:tenantId/modules/:moduleCode/activate
 * Activate a module for a tenant
 */
router.post('/tenants/:tenantId/modules/:moduleCode/activate', requireAdminAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, moduleCode } = req.params;
    const { settings = {}, isTrialMode = false } = req.body;
    
    // Tenant admins can only manage their own tenant
    if (req.user?.role !== 'super_admin' && req.user?.tenantId !== tenantId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check dependencies
    const dependencyCheck = await ModuleService.checkModuleDependencies(moduleCode, tenantId);
    if (!dependencyCheck.satisfied) {
      return res.status(400).json({
        status: 'error',
        message: 'Module dependencies not satisfied',
        data: { missing: dependencyCheck.missing }
      });
    }

    const success = await ModuleService.activateModuleForTenant(
      tenantId, 
      moduleCode, 
      settings, 
      isTrialMode
    );
    
    if (success) {
      logger.info(`Module ${moduleCode} activated for tenant ${tenantId} by user ${req.user?.email}`);
      res.json({
        status: 'success',
        message: `Module ${moduleCode} activated successfully`
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to activate module'
      });
    }
  } catch (error) {
    logger.error('Error activating module:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to activate module'
    });
  }
});

/**
 * DELETE /api/tenants/:tenantId/modules/:moduleCode/deactivate
 * Deactivate a module for a tenant
 */
router.delete('/tenants/:tenantId/modules/:moduleCode/deactivate', requireAdminAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, moduleCode } = req.params;
    
    // Tenant admins can only manage their own tenant
    if (req.user?.role !== 'super_admin' && req.user?.tenantId !== tenantId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Prevent deactivating core module
    if (moduleCode === 'core') {
      return res.status(400).json({
        status: 'error',
        message: 'Core module cannot be deactivated'
      });
    }

    const success = await ModuleService.deactivateModuleForTenant(tenantId, moduleCode);
    
    if (success) {
      logger.info(`Module ${moduleCode} deactivated for tenant ${tenantId} by user ${req.user?.email}`);
      res.json({
        status: 'success',
        message: `Module ${moduleCode} deactivated successfully`
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to deactivate module'
      });
    }
  } catch (error) {
    logger.error('Error deactivating module:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to deactivate module'
    });
  }
});

/**
 * PUT /api/tenants/:tenantId/modules/:moduleCode/settings
 * Update module settings for a tenant
 */
router.put('/tenants/:tenantId/modules/:moduleCode/settings', requireAdminAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, moduleCode } = req.params;
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Valid settings object is required'
      });
    }

    // Tenant admins can only manage their own tenant
    if (req.user?.role !== 'super_admin' && req.user?.tenantId !== tenantId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const success = await ModuleService.updateTenantModuleSettings(tenantId, moduleCode, settings);
    
    if (success) {
      logger.info(`Module ${moduleCode} settings updated for tenant ${tenantId} by user ${req.user?.email}`);
      res.json({
        status: 'success',
        message: 'Module settings updated successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update module settings'
      });
    }
  } catch (error) {
    logger.error('Error updating module settings:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update module settings'
    });
  }
});

/**
 * GET /api/tenants/:tenantId/modules/:moduleCode/access
 * Check if tenant has access to a module
 */
router.get('/tenants/:tenantId/modules/:moduleCode/access', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, moduleCode } = req.params;
    
    // Users can only check access for their own tenant
    if (req.user?.role !== 'super_admin' && req.user?.tenantId !== tenantId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const hasAccess = await ModuleService.tenantHasModule(tenantId, moduleCode);
    
    res.json({
      status: 'success',
      data: { hasAccess, moduleCode, tenantId }
    });
  } catch (error) {
    logger.error('Error checking module access:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check module access'
    });
  }
});

/**
 * PUT /api/modules/:id/activate
 * Activate a module system-wide (super admin only)
 */
router.put('/:id/activate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only super admins can manage system-wide module status
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Super admin access required'
      });
    }

    const { id } = req.params;
    const success = await ModuleService.activateModule(id);
    
    if (success) {
      logger.info(`Module ${id} activated system-wide by user ${req.user?.email}`);
      res.json({
        status: 'success',
        message: 'Module activated successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to activate module'
      });
    }
  } catch (error) {
    logger.error('Error activating module:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to activate module'
    });
  }
});

/**
 * PUT /api/modules/:id/deactivate
 * Deactivate a module system-wide (super admin only)
 */
router.put('/:id/deactivate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only super admins can manage system-wide module status
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Super admin access required'
      });
    }

    const { id } = req.params;
    
    // Prevent deactivating core module
    if (id === 'core') {
      return res.status(400).json({
        status: 'error',
        message: 'Core module cannot be deactivated'
      });
    }

    // Check if any tenants are using this module
    const dependentTenants = await ModuleService.getTenantsUsingModule(id);
    if (dependentTenants.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot deactivate module - it is currently in use by tenants',
        data: { 
          dependentTenants: dependentTenants.length,
          tenantIds: dependentTenants.map(t => t.id)
        }
      });
    }

    const success = await ModuleService.deactivateModule(id);
    
    if (success) {
      logger.info(`Module ${id} deactivated system-wide by user ${req.user?.email}`);
      res.json({
        status: 'success',
        message: 'Module deactivated successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to deactivate module'
      });
    }
  } catch (error) {
    logger.error('Error deactivating module:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to deactivate module'
    });
  }
});

export default router;
import { Router, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/express.js';

const router = Router();

// Admin middleware to check admin permissions
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin' || !req.user.permissions.includes('admin')) {
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
    // TODO: Implement actual database query
    // const tenants = await db.query('SELECT * FROM public.tenants ORDER BY created_at DESC');
    
    // Mock data for development
    const mockTenants = [
      {
        id: 'tenant_1',
        subdomain: 'acme',
        companyName: 'ACME Corporation',
        status: 'active',
        planId: 'business',
        createdAt: new Date(),
        userCount: 25,
        storageUsed: '2.4 GB'
      },
      {
        id: 'tenant_2',
        subdomain: 'techcorp',
        companyName: 'Tech Corp Ltd',
        status: 'active',
        planId: 'enterprise',
        createdAt: new Date(),
        userCount: 150,
        storageUsed: '8.7 GB'
      }
    ];

    res.json({
      status: 'success',
      data: { tenants: mockTenants }
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
    
    // TODO: Implement actual database query
    // const tenant = await db.query('SELECT * FROM public.tenants WHERE id = ?', [tenantId]);
    
    // Mock detailed tenant data
    const mockTenant = {
      id: tenantId,
      subdomain: 'acme',
      companyName: 'ACME Corporation',
      status: 'active',
      planId: 'business',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      settings: {
        maxUsers: 50,
        storageLimit: '10 GB',
        featuresEnabled: ['crm', 'inventory', 'accounting']
      },
      usage: {
        currentUsers: 25,
        storageUsed: '2.4 GB',
        apiCallsThisMonth: 15420,
        lastActivity: new Date()
      }
    };

    res.json({
      status: 'success',
      data: { tenant: mockTenant }
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

    // TODO: Implement actual database update
    // await db.query('UPDATE public.tenants SET status = ?, updated_at = NOW() WHERE id = ?', [status, tenantId]);

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
    // TODO: Implement actual database queries for stats
    const mockStats = {
      totalTenants: 156,
      activeTenants: 142,
      suspendedTenants: 12,
      inactiveTenants: 2,
      totalUsers: 3420,
      totalStorageUsed: '247.8 GB',
      apiCallsToday: 89650,
      revenueThisMonth: 45680.00,
      newTenantsThisMonth: 8
    };

    res.json({
      status: 'success',
      data: { stats: mockStats }
    });
  } catch (error) {
    logger.error('Admin stats fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch system statistics'
    });
  }
});

export default router;
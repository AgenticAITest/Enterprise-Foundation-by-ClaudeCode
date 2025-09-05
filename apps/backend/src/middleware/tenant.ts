import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { TenantRequest } from '../types/express.js';

export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract subdomain from request
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];

    // Skip tenant resolution for localhost development
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      // For development, use default tenant or extract from headers
      const devTenantId = req.headers['x-tenant-id'] as string || 'dev';
      req.tenant = {
        id: devTenantId,
        subdomain: devTenantId,
        companyName: 'Development Tenant',
        schema: `tenant_${devTenantId}`,
        status: 'active'
      };
      return next();
    }

    // Note: In production, implement actual tenant lookup from database
    // const tenant = await query('SELECT * FROM tenants WHERE subdomain = ?', [subdomain]);
    if (subdomain && subdomain !== 'www') {
      req.tenant = {
        id: `tenant_${subdomain}`,
        subdomain,
        companyName: `${subdomain} Company`,
        schema: `tenant_${subdomain}`,
        status: 'active'
      };
    } else {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }

    logger.info(`Tenant resolved: ${req.tenant.subdomain} (${req.tenant.id})`);
    next();
  } catch (error) {
    logger.error('Tenant middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to resolve tenant'
    });
  }
};
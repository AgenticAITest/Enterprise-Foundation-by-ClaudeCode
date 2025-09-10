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
    let subdomain = host.split('.')[0];

    // For development environments (localhost), use header override
    if (process.env.NODE_ENV === 'development' && (host.includes('localhost') || host.includes('127.0.0.1'))) {
      subdomain = req.headers['x-tenant-subdomain'] as string || 'dev';
    }

    // Look up tenant from database (try subdomain first, then domain)
    const { query } = await import('../config/database.js');
    let tenantResult = await query(
      'SELECT id, subdomain, company_name, status FROM tenants WHERE subdomain = $1 AND status = $2',
      [subdomain, 'active']
    );

    // If not found by subdomain, try domain lookup
    if (tenantResult.rows.length === 0 && subdomain.includes('.')) {
      tenantResult = await query(
        'SELECT id, subdomain, company_name, status FROM tenants WHERE domain = $1 AND status = $2',
        [subdomain, 'active']
      );
    }

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Tenant '${subdomain}' not found or inactive`
      });
    }

    const tenant = tenantResult.rows[0];
    req.tenant = {
      id: tenant.id,
      subdomain: tenant.subdomain,
      companyName: tenant.company_name,
      schema: `tenant_${tenant.subdomain}`,
      status: tenant.status
    };

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
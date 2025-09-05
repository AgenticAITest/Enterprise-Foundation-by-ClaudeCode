import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express.js';

/**
 * Enhanced rate limiting middleware for modular ERP system
 * Supports IP-based, module-specific, role-based, and operation-based limits
 */

// Rate limit store (in production, use Redis)
const rateLimitStore = new Map();

/**
 * 1. Global Rate Limiting (2000/15min per IP)
 * Considers multiple users sharing same public IP (office NAT)
 */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 2000,                 // 2000 requests per IP (higher for shared IPs)
  message: {
    status: 'error',
    message: 'Too many requests from this IP address. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to handle proxy scenarios
  keyGenerator: (req: Request) => {
    // Use X-Forwarded-For if behind proxy, otherwise use IP
    return req.get('X-Forwarded-For') || req.ip || req.connection.remoteAddress || 'unknown';
  }
});

/**
 * 2. Module-Specific Rate Limiting
 */

// Authentication (5/15min)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                    // 5 attempts per IP
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false     // Count failed attempts
});

// Core APIs (100/min)
export const coreAPIRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 100,                  // 100 requests
  message: {
    status: 'error', 
    message: 'Too many core API requests. Please slow down.',
    retryAfter: '1 minute'
  }
});

// WMS (300/min)
export const wmsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 300,                  // 300 requests
  message: {
    status: 'error',
    message: 'Too many WMS requests. Please slow down.',
    retryAfter: '1 minute'
  }
});

// Accounting (150/min)
export const accountingRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 150,                  // 150 requests
  message: {
    status: 'error',
    message: 'Too many accounting requests. Please slow down.',
    retryAfter: '1 minute'
  }
});

// POS (800/min) - High volume for retail
export const posRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 800,                  // 800 requests
  message: {
    status: 'error',
    message: 'Too many POS requests. Please slow down.',
    retryAfter: '1 minute'
  }
});

// HR (50/min)
export const hrRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 50,                   // 50 requests
  message: {
    status: 'error',
    message: 'Too many HR requests. Please slow down.',
    retryAfter: '1 minute'
  }
});

// Read-Only (500/min) - Higher for dashboards/reports
export const readOnlyRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 500,                  // 500 requests
  message: {
    status: 'error',
    message: 'Too many read requests. Please slow down.',
    retryAfter: '1 minute'
  }
});

/**
 * 3. Role-Based Rate Limiting
 * Pre-created rate limit instance for role-based limits
 */
export const roleBasedRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: (req: AuthenticatedRequest) => {
    const user = req.user;
    if (!user) return 10; // Unauthenticated users get very low limit

    // Role-based multipliers
    switch (user.role) {
      case 'super_admin':
        return 1000;        // Super Admin (1000)
      case 'tenant_admin':
        return 500;         // Tenant Admin (500)
      case 'api_user':
        return 2000;        // API-Only (2000)
      default:
        return 200;         // Regular Users (200)
    }
  },
  keyGenerator: (req: AuthenticatedRequest) => {
    // Use user ID + IP for more accurate rate limiting
    const user = req.user;
    const ip = req.ip || 'unknown';
    return user ? `user_${user.id}_${ip}` : `ip_${ip}`;
  },
  message: (req: AuthenticatedRequest) => ({
    status: 'error',
    message: `Rate limit exceeded for ${req.user?.role || 'user'} role. Please slow down.`,
    retryAfter: '1 minute'
  })
});

/**
 * 4. Operation-Based Rate Limiting
 */

// Bulk Operations (10/5min)
export const bulkOperationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,   // 5 minutes
  max: 10,                   // 10 bulk operations
  message: {
    status: 'error',
    message: 'Too many bulk operations. Please wait before trying again.',
    retryAfter: '5 minutes'
  },
  keyGenerator: (req: AuthenticatedRequest) => {
    return req.user ? `bulk_${req.user.id}` : `bulk_${req.ip}`;
  }
});

// File Uploads (10/min)
export const fileUploadRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 10,                   // 10 file uploads
  message: {
    status: 'error',
    message: 'Too many file uploads. Please wait before uploading more files.',
    retryAfter: '1 minute'
  },
  keyGenerator: (req: AuthenticatedRequest) => {
    return req.user ? `upload_${req.user.id}` : `upload_${req.ip}`;
  }
});

// Report Generation (10/15min)
export const reportGenerationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                   // 10 reports
  message: {
    status: 'error',
    message: 'Too many report generation requests. Please wait before generating more reports.',
    retryAfter: '15 minutes'
  },
  keyGenerator: (req: AuthenticatedRequest) => {
    return req.user ? `report_${req.user.id}` : `report_${req.ip}`;
  }
});

/**
 * Smart Module Rate Limiting
 * Automatically applies appropriate rate limit based on request path
 */
export const smartModuleRateLimit = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const path = req.path.toLowerCase();
  
  // Determine which module-specific rate limit to apply
  if (path.includes('/auth/')) {
    return authRateLimit(req, res, next);
  } else if (path.includes('/wms/')) {
    return wmsRateLimit(req, res, next);
  } else if (path.includes('/accounting/')) {
    return accountingRateLimit(req, res, next);
  } else if (path.includes('/pos/')) {
    return posRateLimit(req, res, next);
  } else if (path.includes('/hr/')) {
    return hrRateLimit(req, res, next);
  } else if (req.method === 'GET' && (path.includes('/dashboard') || path.includes('/reports'))) {
    return readOnlyRateLimit(req, res, next);
  } else if (path.includes('/roles/') || path.includes('/users/') || path.includes('/permissions/')) {
    return coreAPIRateLimit(req, res, next);
  }
  
  // Default: apply role-based rate limiting
  return roleBasedRateLimit(req, res, next);
};

/**
 * Combined Rate Limiting Middleware
 * Applies multiple rate limits in sequence
 */
export const createCombinedRateLimit = (limits: Array<any>) => {
  return (req: AuthenticatedRequest, res: Response, next: Function) => {
    let currentIndex = 0;
    
    const applyNextLimit = () => {
      if (currentIndex >= limits.length) {
        return next();
      }
      
      const currentLimit = limits[currentIndex++];
      currentLimit(req, res, (err?: any) => {
        if (err) return next(err);
        applyNextLimit();
      });
    };
    
    applyNextLimit();
  };
};

/**
 * Rate Limit Information Endpoint
 * Provides current rate limit status to clients
 */
export const rateLimitInfo = (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  
  const info = {
    global: {
      window: '15 minutes',
      limit: 2000,
      message: 'Global IP-based limit'
    },
    modules: {
      authentication: { window: '15 minutes', limit: 5 },
      core_apis: { window: '1 minute', limit: 100 },
      wms: { window: '1 minute', limit: 300 },
      accounting: { window: '1 minute', limit: 150 },
      pos: { window: '1 minute', limit: 800 },
      hr: { window: '1 minute', limit: 50 },
      read_only: { window: '1 minute', limit: 500 }
    },
    role_based: {
      current_role: user?.role || 'unauthenticated',
      current_limit: user?.role === 'super_admin' ? 1000 :
                     user?.role === 'tenant_admin' ? 500 :
                     user?.role === 'api_user' ? 2000 : 200,
      window: '1 minute'
    },
    operations: {
      bulk_operations: { window: '5 minutes', limit: 10 },
      file_uploads: { window: '1 minute', limit: 10 },
      report_generation: { window: '15 minutes', limit: 10 }
    }
  };
  
  res.json({
    status: 'success',
    rate_limits: info
  });
};

/**
 * Rate Limit Bypass for Testing/Development
 */
export const bypassRateLimit = (req: AuthenticatedRequest, res: Response, next: Function) => {
  if (process.env.NODE_ENV === 'development' || process.env.BYPASS_RATE_LIMIT === 'true') {
    return next();
  }
  
  // In production, apply normal rate limiting
  return smartModuleRateLimit(req, res, next);
};

// Export all rate limiting functions
export default {
  globalRateLimit,
  authRateLimit,
  coreAPIRateLimit,
  wmsRateLimit,
  accountingRateLimit,
  posRateLimit,
  hrRateLimit,
  readOnlyRateLimit,
  roleBasedRateLimit,
  bulkOperationRateLimit,
  fileUploadRateLimit,
  reportGenerationRateLimit,
  smartModuleRateLimit,
  createCombinedRateLimit,
  rateLimitInfo,
  bypassRateLimit
};
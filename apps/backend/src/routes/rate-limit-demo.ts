import { Router, Request, Response } from 'express';
import { 
  authRateLimit,
  bulkOperationRateLimit, 
  fileUploadRateLimit,
  reportGenerationRateLimit,
  rateLimitInfo,
  roleBasedRateLimit
} from '../middleware/rate-limit.middleware.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/express.js';

const router = Router();

/**
 * Rate Limit Information Endpoint
 * GET /api/rate-limits/info
 */
router.get('/info', authenticateToken, rateLimitInfo);

/**
 * Authentication Rate Limit Demo
 * POST /api/rate-limits/demo/auth
 * Limited to 5 attempts per 15 minutes
 */
router.post('/demo/auth', authRateLimit, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Authentication attempt successful',
    limit: '5 attempts per 15 minutes',
    remaining: res.getHeader('X-RateLimit-Remaining'),
    resetTime: new Date(Date.now() + 15 * 60 * 1000)
  });
});

/**
 * Bulk Operation Rate Limit Demo
 * POST /api/rate-limits/demo/bulk
 * Limited to 10 operations per 5 minutes
 */
router.post('/demo/bulk', 
  authenticateToken,
  bulkOperationRateLimit,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      status: 'success',
      message: 'Bulk operation completed',
      user: req.user?.email,
      limit: '10 operations per 5 minutes',
      remaining: res.getHeader('X-RateLimit-Remaining'),
      resetTime: new Date(Date.now() + 5 * 60 * 1000)
    });
  }
);

/**
 * File Upload Rate Limit Demo
 * POST /api/rate-limits/demo/upload
 * Limited to 10 uploads per minute
 */
router.post('/demo/upload',
  authenticateToken,
  fileUploadRateLimit,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      status: 'success',
      message: 'File upload completed',
      user: req.user?.email,
      limit: '10 uploads per minute',
      remaining: res.getHeader('X-RateLimit-Remaining'),
      resetTime: new Date(Date.now() + 1 * 60 * 1000)
    });
  }
);

/**
 * Report Generation Rate Limit Demo  
 * POST /api/rate-limits/demo/report
 * Limited to 10 reports per 15 minutes
 */
router.post('/demo/report',
  authenticateToken,
  reportGenerationRateLimit,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      status: 'success',
      message: 'Report generation started',
      user: req.user?.email,
      limit: '10 reports per 15 minutes',
      remaining: res.getHeader('X-RateLimit-Remaining'),
      resetTime: new Date(Date.now() + 15 * 60 * 1000)
    });
  }
);

/**
 * Role-Based Rate Limit Demo
 * GET /api/rate-limits/demo/role-based
 * Limits based on user role (Super Admin: 1000, Tenant Admin: 500, etc.)
 */
router.get('/demo/role-based',
  authenticateToken,
  roleBasedRateLimit,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const roleLimit = user?.role === 'super_admin' ? 1000 :
                      user?.role === 'tenant_admin' ? 500 :
                      user?.role === 'api_user' ? 2000 : 200;

    res.json({
      status: 'success',
      message: 'Role-based rate limit applied',
      user: {
        email: user?.email,
        role: user?.role
      },
      limit: `${roleLimit} requests per minute`,
      remaining: res.getHeader('X-RateLimit-Remaining'),
      resetTime: new Date(Date.now() + 1 * 60 * 1000)
    });
  }
);

/**
 * Rate Limit Status Check
 * GET /api/rate-limits/status
 */
router.get('/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: 'success',
    message: 'Rate limiting is active',
    timestamp: new Date(),
    user: req.user?.email,
    ip: req.ip,
    headers: {
      remaining: res.getHeader('X-RateLimit-Remaining'),
      limit: res.getHeader('X-RateLimit-Limit'),
      reset: res.getHeader('X-RateLimit-Reset')
    }
  });
});

export default router;
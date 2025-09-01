import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/express.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No valid authentication token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // TODO: Implement actual user lookup from database
    // const user = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    // For now, mock user data based on token
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      tenantId: decoded.tenantId,
      permissions: decoded.permissions || ['read']
    };

    // Validate that user belongs to the current tenant (for tenant routes)
    if (req.tenant && req.user.tenantId && req.user.tenantId !== req.tenant.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: Invalid tenant access'
      });
    }

    logger.info(`User authenticated: ${req.user.email} (${req.user.role})`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token'
      });
    }
    
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};
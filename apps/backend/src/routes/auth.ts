import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger.js';
import { tenantQuery, query } from '../config/database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Check if this is a super admin first
    const superAdminResult = await query(
      'SELECT id, email, password_hash, first_name, last_name, permissions, is_active FROM super_admins WHERE email = $1 AND is_active = true',
      [email]
    );

    if (superAdminResult.rows.length > 0) {
      const superAdmin = superAdminResult.rows[0];
      
      if (!await bcrypt.compare(password, superAdmin.password_hash)) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      const token = jwt.sign(
        {
          userId: superAdmin.id,
          email: superAdmin.email,
          role: 'super_admin',
          tenantId: null,
          permissions: superAdmin.permissions,
          firstName: superAdmin.first_name,
          lastName: superAdmin.last_name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      logger.info(`Super admin logged in: ${superAdmin.email}`);

      return res.json({
        status: 'success',
        data: {
          token,
          user: {
            id: superAdmin.id,
            email: superAdmin.email,
            role: 'super_admin',
            tenantId: null,
            permissions: superAdmin.permissions,
            firstName: superAdmin.first_name,
            lastName: superAdmin.last_name
          }
        }
      });
    }

    // Extract tenant from email domain
    const emailDomain = email.split('@')[1];
    
    if (!emailDomain) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    // Find tenant by email domain
    const tenantResult = await query(
      'SELECT id, subdomain, company_name, status FROM tenants WHERE domain = $1 AND status = $2',
      [emailDomain, 'active']
    );

    if (tenantResult.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: `Organization '${emailDomain}' not found or inactive`
      });
    }

    const tenant = tenantResult.rows[0];
    
    const userResult = await tenantQuery(
      tenant.subdomain,
      'SELECT id, email, password_hash, first_name, last_name, role, permissions, is_active FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];
    
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token for tenant user
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant.subdomain,
        permissions: user.permissions,
        firstName: user.first_name,
        lastName: user.last_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`User logged in: ${user.email} (tenant: ${tenant.subdomain})`);

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: tenant.subdomain,
          permissions: user.permissions,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed'
    });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  // In a real implementation, you might want to blacklist the token
  // or clear server-side session data
  res.json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// Token validation endpoint
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Note: In production, you may want to refresh user data from database
    res.json({
      status: 'success',
      data: {
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          tenantId: decoded.tenantId,
          permissions: decoded.permissions
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
});

export default router;
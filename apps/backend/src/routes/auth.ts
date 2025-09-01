import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger.js';

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

    // TODO: Implement actual user lookup from database
    // const user = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    // For development, create mock user authentication
    const mockUsers = [
      {
        id: 'user_1',
        email: 'admin@example.com',
        password_hash: await bcrypt.hash('password', 10),
        role: 'admin',
        tenantId: 'dev',
        permissions: ['read', 'write', 'delete', 'admin']
      },
      {
        id: 'user_2',
        email: 'user@example.com',
        password_hash: await bcrypt.hash('password', 10),
        role: 'user',
        tenantId: 'dev',
        permissions: ['read', 'write']
      }
    ];

    const user = mockUsers.find(u => u.email === email);
    
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        permissions: user.permissions
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`User logged in: ${user.email}`);

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          permissions: user.permissions
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
    
    // TODO: Get fresh user data from database
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
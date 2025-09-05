import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { globalRateLimit, smartModuleRateLimit } from './middleware/rate-limit.middleware.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { logger } from './utils/logger.js';
import { initializeDatabase } from './config/database.js';
import adminRoutes from './routes/admin.js';
import tenantRoutes from './routes/tenant.js';
import authRoutes from './routes/auth.js';
import moduleRoutes from './routes/modules.js';
import roleRoutes from './routes/roles.js';
import permissionRoutes from './routes/permissions.js';
import userRoleRoutes from './routes/user-roles.js';
import rateLimitRoutes from './routes/rate-limit-demo.js';
import auditRoutes from './routes/audit.js';
import adminStatsRoutes from './routes/admin-stats.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3005', 
    'http://localhost:3006',
    'http://localhost:3007'
  ],
  credentials: true
}));

// Global rate limiting (2000/15min per IP - accounts for office NAT)
app.use(globalRateLimit);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes that don't need smart rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/admin', authMiddleware as any, adminStatsRoutes);
app.use('/api/rate-limits', rateLimitRoutes);

// Smart module-based rate limiting for other API routes
app.use('/api', smartModuleRateLimit);

// Routes with smart rate limiting
app.use('/api/admin', authMiddleware as any, adminRoutes);
app.use('/api/modules', authMiddleware as any, moduleRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api', tenantMiddleware as any, authMiddleware as any, tenantRoutes);

app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
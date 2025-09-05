import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { permissionMiddleware } from './index.js';

/**
 * Advanced API route protection middleware that automatically applies
 * permission checks based on route patterns and HTTP methods
 */
export class APIProtectionMiddleware {
  
  /**
   * Automatic permission detection based on route and method
   */
  static autoProtect() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // Skip protection for public routes
        if (APIProtectionMiddleware.isPublicRoute(req.path)) {
          return next();
        }

        // Super admin bypass
        if (req.user?.role === 'super_admin') {
          return next();
        }

        // Get permission requirements based on route
        const permissionConfig = APIProtectionMiddleware.getRoutePermissions(req.path, req.method);
        
        if (!permissionConfig) {
          // No specific permission required, but user must be authenticated
          if (!req.user) {
            return res.status(401).json({
              status: 'error',
              message: 'Authentication required'
            });
          }
          return next();
        }

        // Apply the determined permission check
        const permissionCheck = permissionMiddleware.requirePermission(permissionConfig);
        return permissionCheck(req, res, next);

      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: 'Permission check failed'
        });
      }
    };
  }

  /**
   * Module-specific route protection
   */
  static protectModule(moduleCode: string) {
    return [
      permissionMiddleware.requireModuleAccess(moduleCode),
      permissionMiddleware.applyDataScope(moduleCode)
    ];
  }

  /**
   * CRUD operation protection with hierarchical checks
   */
  static protectCRUD(baseResource: string, moduleCode?: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const method = req.method.toLowerCase();
      let action: 'view' | 'manage' = 'view';
      
      // Determine required action based on HTTP method
      switch (method) {
        case 'get':
          action = 'view';
          break;
        case 'post':
        case 'put':
        case 'patch':
        case 'delete':
          action = 'manage';
          break;
        default:
          action = 'view';
      }

      // Check specific resource permission first, then parent resource
      const specificResource = `${baseResource}_${method}`;
      
      const hierarchicalCheck = permissionMiddleware.requireHierarchicalPermission(
        baseResource,
        specificResource,
        action
      );

      return hierarchicalCheck(req, res, next);
    };
  }

  /**
   * Advanced permission patterns
   */
  static requireAdvancedPermission(config: {
    primaryResource: string;
    fallbackResources?: string[];
    requiredAction?: 'view' | 'manage';
    moduleCode?: string;
    dataScope?: boolean;
    hierarchicalParent?: string;
  }) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const middlewareChain = [];

      // Add module access check if specified
      if (config.moduleCode) {
        middlewareChain.push(permissionMiddleware.requireModuleAccess(config.moduleCode));
      }

      // Add data scope if requested
      if (config.dataScope && config.moduleCode) {
        middlewareChain.push(permissionMiddleware.applyDataScope(config.moduleCode));
      }

      // Add hierarchical check if parent specified
      if (config.hierarchicalParent) {
        middlewareChain.push(
          permissionMiddleware.requireHierarchicalPermission(
            config.hierarchicalParent,
            config.primaryResource,
            config.requiredAction || 'view'
          )
        );
      } else if (config.fallbackResources) {
        // Use multiple resource check with fallbacks
        middlewareChain.push(
          permissionMiddleware.requireAnyPermission(
            [config.primaryResource, ...config.fallbackResources],
            config.requiredAction || 'view'
          )
        );
      } else {
        // Simple permission check
        middlewareChain.push(
          permissionMiddleware.requirePermission({
            resource: config.primaryResource,
            action: config.requiredAction || 'view',
            module: config.moduleCode
          })
        );
      }

      // Execute middleware chain
      let currentIndex = 0;
      const executeNext = (error?: any) => {
        if (error) return next(error);
        
        if (currentIndex >= middlewareChain.length) {
          return next();
        }

        const middleware = middlewareChain[currentIndex++];
        middleware(req, res, executeNext);
      };

      executeNext();
    };
  }

  /**
   * Time-based permission checks (e.g., business hours)
   */
  static requireTimeBasedAccess(config: {
    businessHours?: boolean;
    allowedDays?: number[]; // 0-6 (Sunday-Saturday)
    timezone?: string;
  }) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const now = new Date();
      
      // Check business hours (9 AM - 5 PM by default)
      if (config.businessHours) {
        const hour = now.getHours();
        if (hour < 9 || hour >= 17) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied: Outside business hours'
          });
        }
      }

      // Check allowed days
      if (config.allowedDays) {
        const dayOfWeek = now.getDay();
        if (!config.allowedDays.includes(dayOfWeek)) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied: Not allowed on this day'
          });
        }
      }

      next();
    };
  }

  /**
   * IP-based access control
   */
  static requireIPAccess(allowedIPs: string[] = []) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (allowedIPs.length === 0) return next();

      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      
      if (!clientIP || !allowedIPs.includes(clientIP)) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied: IP not allowed'
        });
      }

      next();
    };
  }

  /**
   * Determine if a route is public (no authentication required)
   */
  private static isPublicRoute(path: string): boolean {
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/health',
      '/api/status'
    ];

    return publicPaths.some(publicPath => path.startsWith(publicPath));
  }

  /**
   * Get permission configuration based on route pattern
   */
  private static getRoutePermissions(path: string, method: string): any {
    // Remove dynamic segments for pattern matching
    const normalizedPath = path
      .replace(/\/[a-f0-9-]{36}/g, '/:id')
      .replace(/\/tenants\/[^\/]+/, '/tenants/:tenantId')
      .replace(/\/users\/[^\/]+/, '/users/:userId');

    const routes: Record<string, any> = {
      // Role management routes
      'GET:/api/roles/tenants/:tenantId/modules': {
        resource: 'core_role_management',
        action: 'view',
        allowSuperAdmin: true
      },
      'POST:/api/roles/tenants/:tenantId/modules': {
        resource: 'core_role_management',
        action: 'manage',
        allowSuperAdmin: true
      },
      'PUT:/api/roles/tenants/:tenantId/roles': {
        resource: 'core_role_management',
        action: 'manage',
        allowSuperAdmin: true
      },
      'DELETE:/api/roles/tenants/:tenantId/roles': {
        resource: 'core_role_management',
        action: 'manage',
        allowSuperAdmin: true
      },

      // User management routes
      'GET:/api/user-roles/tenants/:tenantId/users': {
        resource: 'core_user_management',
        action: 'view',
        allowSuperAdmin: true
      },
      'POST:/api/user-roles/tenants/:tenantId/users': {
        resource: 'core_user_management',
        action: 'manage',
        allowSuperAdmin: true
      },

      // Module-specific routes would be handled by module middleware
      // WMS routes
      'GET:/api/wms': {
        resource: 'wms_dashboard',
        action: 'view',
        module: 'wms'
      },
      'POST:/api/wms/inventory': {
        resource: 'wms_inventory_tracking',
        action: 'manage',
        module: 'wms'
      }
    };

    const key = `${method}:${normalizedPath}`;
    return routes[key] || null;
  }
}

// Export convenience methods
export const autoProtect = APIProtectionMiddleware.autoProtect;
export const protectModule = APIProtectionMiddleware.protectModule;
export const protectCRUD = APIProtectionMiddleware.protectCRUD;
export const requireAdvancedPermission = APIProtectionMiddleware.requireAdvancedPermission;
export const requireTimeBasedAccess = APIProtectionMiddleware.requireTimeBasedAccess;
export const requireIPAccess = APIProtectionMiddleware.requireIPAccess;
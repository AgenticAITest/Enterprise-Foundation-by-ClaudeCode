import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { PermissionService } from '../services/permission.service.js';
import { AppError } from './error-handler.js';
import { AuthenticatedRequest } from '../types/express.js';

export interface PermissionCheckOptions {
  resource?: string;
  action?: 'view' | 'manage';
  module?: string;
  allowSuperAdmin?: boolean;
  skipTenantCheck?: boolean;
}

export class PermissionMiddleware {
  constructor(private db: Pool) {}

  private permissionService = new PermissionService(this.db);

  /**
   * Create permission check middleware
   */
  requirePermission(options: PermissionCheckOptions) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) {
          throw new AppError('Authentication required', 401);
        }

        // Super admin bypass (if allowed)
        if (options.allowSuperAdmin !== false && user.role === 'super_admin') {
          return next();
        }

        // Extract tenant info
        const tenantId = req.params.tenantId || user.tenantId;
        if (!tenantId && !options.skipTenantCheck) {
          throw new AppError('Tenant context required', 400);
        }

        const tenantSchema = `tenant_${tenantId}`;

        // Determine resource to check
        let resourceCode = options.resource;
        if (!resourceCode) {
          // Auto-detect resource from route
          resourceCode = this.mapRouteToResource(req.path, req.method);
        }

        if (!resourceCode) {
          throw new AppError('Resource not found for permission check', 404);
        }

        // Check module access first
        if (options.module) {
          const hasModuleAccess = await this.permissionService.checkUserModuleAccess(
            tenantSchema, 
            user.id, 
            options.module
          );

          if (!hasModuleAccess) {
            throw new AppError('Access denied: Module not accessible', 403);
          }
        }

        // Check specific resource permission
        const requiredLevel = options.action === 'manage' ? 'manage' : 'view_only';
        const permissionCheck = await this.permissionService.checkUserPermission(
          tenantSchema,
          user.id,
          resourceCode,
          requiredLevel
        );

        if (!permissionCheck.hasAccess) {
          throw new AppError('Access denied: Insufficient permissions', 403);
        }

        // Add permission info to request for downstream use
        req.permission = {
          resourceCode,
          level: permissionCheck.permissionLevel,
          grantedByRole: permissionCheck.grantedByRole
        };

        next();
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Permission check failed', 500);
      }
    };
  }

  /**
   * Check multiple permissions (hierarchical)
   */
  requireAnyPermission(resourceCodes: string[], action: 'view' | 'manage' = 'view') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) {
          throw new AppError('Authentication required', 401);
        }

        // Super admin bypass
        if (user.role === 'super_admin') {
          return next();
        }

        const tenantId = req.params.tenantId || user.tenantId;
        if (!tenantId) {
          throw new AppError('Tenant context required', 400);
        }

        const tenantSchema = `tenant_${tenantId}`;
        const requiredLevel = action === 'manage' ? 'manage' : 'view_only';

        // Check if user has permission for ANY of the resources
        for (const resourceCode of resourceCodes) {
          const permissionCheck = await this.permissionService.checkUserPermission(
            tenantSchema,
            user.id,
            resourceCode,
            requiredLevel
          );

          if (permissionCheck.hasAccess) {
            req.permission = {
              resourceCode,
              level: permissionCheck.permissionLevel,
              grantedByRole: permissionCheck.grantedByRole
            };
            return next();
          }
        }

        throw new AppError('Access denied: No sufficient permissions found', 403);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Permission check failed', 500);
      }
    };
  }

  /**
   * Check all permissions (hierarchical)
   */
  requireAllPermissions(resourceCodes: string[], action: 'view' | 'manage' = 'view') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) {
          throw new AppError('Authentication required', 401);
        }

        // Super admin bypass
        if (user.role === 'super_admin') {
          return next();
        }

        const tenantId = req.params.tenantId || user.tenantId;
        if (!tenantId) {
          throw new AppError('Tenant context required', 400);
        }

        const tenantSchema = `tenant_${tenantId}`;
        const requiredLevel = action === 'manage' ? 'manage' : 'view_only';

        // Check if user has permission for ALL resources
        const permissionResults = [];
        for (const resourceCode of resourceCodes) {
          const permissionCheck = await this.permissionService.checkUserPermission(
            tenantSchema,
            user.id,
            resourceCode,
            requiredLevel
          );

          if (!permissionCheck.hasAccess) {
            throw new AppError(`Access denied: Missing permission for ${resourceCode}`, 403);
          }

          permissionResults.push({
            resourceCode,
            level: permissionCheck.permissionLevel,
            grantedByRole: permissionCheck.grantedByRole
          });
        }

        req.permissions = permissionResults;
        next();
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Permission check failed', 500);
      }
    };
  }

  /**
   * Check hierarchical permissions (parent -> child inheritance)
   */
  requireHierarchicalPermission(
    parentResource: string, 
    childResource: string, 
    action: 'view' | 'manage' = 'view'
  ) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) {
          throw new AppError('Authentication required', 401);
        }

        // Super admin bypass
        if (user.role === 'super_admin') {
          return next();
        }

        const tenantId = req.params.tenantId || user.tenantId;
        if (!tenantId) {
          throw new AppError('Tenant context required', 400);
        }

        const tenantSchema = `tenant_${tenantId}`;
        const requiredLevel = action === 'manage' ? 'manage' : 'view_only';

        // Check child permission first (most specific)
        const childPermission = await this.permissionService.checkUserPermission(
          tenantSchema,
          user.id,
          childResource,
          requiredLevel
        );

        if (childPermission.hasAccess) {
          req.permission = {
            resourceCode: childResource,
            level: childPermission.permissionLevel,
            grantedByRole: childPermission.grantedByRole
          };
          return next();
        }

        // If child permission not found or insufficient, check parent
        const parentPermission = await this.permissionService.checkUserPermission(
          tenantSchema,
          user.id,
          parentResource,
          requiredLevel
        );

        if (parentPermission.hasAccess) {
          // Parent permission grants access to child
          req.permission = {
            resourceCode: parentResource,
            level: parentPermission.permissionLevel,
            grantedByRole: parentPermission.grantedByRole,
            inheritedBy: childResource
          };
          return next();
        }

        throw new AppError('Access denied: Insufficient hierarchical permissions', 403);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Hierarchical permission check failed', 500);
      }
    };
  }

  /**
   * Module access check middleware
   */
  requireModuleAccess(moduleCode: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) {
          throw new AppError('Authentication required', 401);
        }

        // Super admin bypass
        if (user.role === 'super_admin') {
          return next();
        }

        const tenantId = req.params.tenantId || user.tenantId;
        if (!tenantId) {
          throw new AppError('Tenant context required', 400);
        }

        const tenantSchema = `tenant_${tenantId}`;

        // Check if user has access to the module
        const hasAccess = await this.permissionService.checkUserModuleAccess(
          tenantSchema,
          user.id,
          moduleCode
        );

        if (!hasAccess) {
          throw new AppError(`Access denied: ${moduleCode} module not accessible`, 403);
        }

        req.moduleContext = moduleCode;
        next();
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Module access check failed', 500);
      }
    };
  }

  /**
   * Data scope filtering middleware
   */
  applyDataScope(moduleCode: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) {
          throw new AppError('Authentication required', 401);
        }

        // Super admin bypass
        if (user.role === 'super_admin') {
          return next();
        }

        const tenantId = req.params.tenantId || user.tenantId;
        if (!tenantId) {
          throw new AppError('Tenant context required', 400);
        }

        const tenantSchema = `tenant_${tenantId}`;

        // Get user's data scope for the module
        const dataScope = await this.permissionService.getUserDataScope(
          tenantSchema,
          user.id,
          moduleCode
        );

        if (dataScope) {
          req.dataScope = {
            type: dataScope.scope_type,
            values: dataScope.scope_values,
            filters: dataScope.resource_filters
          };
        }

        next();
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Data scope application failed', 500);
      }
    };
  }

  /**
   * Map API routes to resource codes
   */
  private mapRouteToResource(path: string, method: string): string | null {
    // Remove tenant/user IDs from path for mapping
    const normalizedPath = path
      .replace(/\/tenants\/[^\/]+/, '')
      .replace(/\/users\/[^\/]+/, '')
      .replace(/\/[a-f0-9-]{36}/g, ''); // Remove UUIDs

    const mappings: Record<string, string> = {
      // Role management
      'GET:/roles': 'core_role_management',
      'POST:/roles': 'core_role_management',
      'PUT:/roles': 'core_role_management',
      'DELETE:/roles': 'core_role_management',

      // User management
      'GET:/users': 'core_user_management',
      'POST:/users': 'core_user_management',
      'PUT:/users': 'core_user_management',
      'DELETE:/users': 'core_user_management',

      // WMS routes
      'GET:/wms/inbound': 'wms_inbound_operations',
      'POST:/wms/inbound': 'wms_inbound_operations',
      'GET:/wms/outbound': 'wms_outbound_operations',
      'POST:/wms/outbound': 'wms_outbound_operations',
      'GET:/wms/inventory': 'wms_inventory_tracking',
      'PUT:/wms/inventory': 'wms_inventory_tracking',
      'GET:/wms/reports': 'wms_reports_analytics',
      'GET:/wms/dashboard': 'wms_dashboard',

      // Settings
      'GET:/settings': 'core_general_settings',
      'PUT:/settings': 'core_general_settings'
    };

    const key = `${method}:${normalizedPath}`;
    return mappings[key] || null;
  }
}

// Create singleton instance
export const createPermissionMiddleware = (db: Pool) => new PermissionMiddleware(db);
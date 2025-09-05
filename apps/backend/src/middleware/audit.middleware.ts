import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service.js';
import { AuthenticatedRequest } from '../types/express.js';
import pool from '../config/database.js';

const auditService = new AuditService(pool);

/**
 * Audit middleware for automatically logging API requests
 */
export const auditMiddleware = (options?: {
  logAllRequests?: boolean;  // Log all API calls (default: false)
  logOnlyFailures?: boolean; // Log only failed requests (default: false)
  skipPaths?: string[];      // Paths to skip auditing
  logBodies?: boolean;       // Log request/response bodies (default: false)
}) => {
  const config = {
    logAllRequests: false,
    logOnlyFailures: false,
    skipPaths: ['/api/health', '/api/status', '/api/rate-limits/status'],
    logBodies: false,
    ...options
  };

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Skip certain paths
    if (config.skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;
    let responseBody: any;

    // Capture response
    res.send = function(body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // Continue with request
    next();

    // Log after response is sent
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const isError = res.statusCode >= 400;
        const shouldLog = config.logAllRequests || 
                          (config.logOnlyFailures && isError) ||
                          isError || 
                          isSecuritySensitiveEndpoint(req.path);

        if (shouldLog) {
          await auditService.logFromRequest(
            req,
            'api_call',
            'api_endpoint',
            req.path,
            `${req.method} ${req.path}`,
            config.logBodies ? req.body : undefined,
            config.logBodies && responseBody ? { 
              status: res.statusCode, 
              body: responseBody,
              duration 
            } : { status: res.statusCode, duration },
            isError ? 'failed' : 'success',
            isError ? `HTTP ${res.statusCode}` : undefined
          );
        }
      } catch (error) {
        console.error('Audit middleware error:', error);
      }
    });
  };
};

/**
 * Enhanced audit middleware for specific operations
 */
export const auditSecurityEvent = (action: string, resourceType?: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    let responseData: any;

    res.send = function(body: any) {
      responseData = body;
      return originalSend.call(this, body);
    };

    next();

    res.on('finish', async () => {
      try {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        
        await auditService.logFromRequest(
          req,
          action,
          resourceType,
          req.params.id || req.params.roleId || req.params.userId,
          getResourceName(req),
          getOldValues(req),
          getNewValues(req, responseData),
          isSuccess ? 'success' : 'failed',
          isSuccess ? undefined : `HTTP ${res.statusCode}`
        );
      } catch (error) {
        console.error('Security audit error:', error);
      }
    });
  };
};

/**
 * Audit login attempts
 */
export const auditLoginAttempt = async (
  req: Request,
  user: { id?: string; email?: string; role?: string } | null,
  success: boolean,
  tenantId?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    await auditService.logAuthEvent(
      success ? 'login' : 'login_failed',
      user,
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      },
      tenantId,
      errorMessage
    );
  } catch (error) {
    console.error('Login audit error:', error);
  }
};

/**
 * Audit logout events
 */
export const auditLogout = async (
  req: AuthenticatedRequest,
  tenantId?: string
): Promise<void> => {
  try {
    const user = req.user;
    await auditService.logAuthEvent(
      'logout',
      user ? { id: user.id, email: user.email, role: user.role } : null,
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      },
      tenantId
    );
  } catch (error) {
    console.error('Logout audit error:', error);
  }
};

/**
 * Manual audit logging helpers
 */
export const auditUserOperation = async (
  action: 'create_user' | 'update_user' | 'delete_user' | 'activate_user' | 'deactivate_user',
  performedBy: { id: string; email: string; role: string },
  targetUser: { id: string; email: string },
  tenantId: string,
  oldValues?: any,
  newValues?: any,
  request?: { ip?: string; endpoint?: string }
): Promise<void> => {
  try {
    await auditService.logUserAction(
      action,
      performedBy,
      targetUser,
      tenantId,
      oldValues,
      newValues,
      request
    );
  } catch (error) {
    console.error('User operation audit error:', error);
  }
};

export const auditRoleOperation = async (
  action: 'create_role' | 'update_role' | 'delete_role' | 'assign_role' | 'remove_role',
  performedBy: { id: string; email: string; role: string },
  role: { id?: string; name: string },
  tenantId: string,
  moduleCode: string,
  oldValues?: any,
  newValues?: any,
  targetUser?: { id: string; email: string }
): Promise<void> => {
  try {
    await auditService.logRoleAction(
      action,
      performedBy,
      role,
      tenantId,
      moduleCode,
      oldValues,
      newValues,
      targetUser
    );
  } catch (error) {
    console.error('Role operation audit error:', error);
  }
};

export const auditModuleOperation = async (
  action: 'activate_module' | 'deactivate_module' | 'update_module_settings',
  performedBy: { id: string; email: string; role: string },
  moduleCode: string,
  tenantId: string,
  oldSettings?: any,
  newSettings?: any
): Promise<void> => {
  try {
    await auditService.logModuleAction(
      action,
      performedBy,
      moduleCode,
      tenantId,
      oldSettings,
      newSettings
    );
  } catch (error) {
    console.error('Module operation audit error:', error);
  }
};

/**
 * Helper functions
 */
function isSecuritySensitiveEndpoint(path: string): boolean {
  const sensitivePatterns = [
    '/auth/',
    '/users/',
    '/roles/',
    '/permissions/',
    '/modules/',
    '/admin/'
  ];
  
  return sensitivePatterns.some(pattern => path.includes(pattern));
}

function getResourceName(req: AuthenticatedRequest): string | undefined {
  // Try to extract resource name from request body or params
  if (req.body?.name) return req.body.name;
  if (req.body?.email) return req.body.email;
  if (req.params?.roleName) return req.params.roleName;
  if (req.params?.userName) return req.params.userName;
  return undefined;
}

function getOldValues(req: AuthenticatedRequest): any {
  // This would typically come from the service layer before changes are made
  // For now, return undefined - services should provide old values explicitly
  return undefined;
}

function getNewValues(req: AuthenticatedRequest, responseData: any): any {
  // Extract relevant new values from request body or response
  if (req.method === 'POST' || req.method === 'PUT') {
    const { password, ...safeBody } = req.body || {};
    return safeBody;
  }
  return responseData;
}

export { auditService };
export default auditMiddleware;
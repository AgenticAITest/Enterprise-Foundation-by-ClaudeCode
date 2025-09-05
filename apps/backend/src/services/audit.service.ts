import { Pool } from 'pg';
import { AuthenticatedRequest } from '../types/express.js';

export interface AuditLogEntry {
  // Context
  tenant_id?: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  session_id?: string;
  
  // Action Details
  action: string;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  
  // Request Information
  http_method?: string;
  endpoint?: string;
  ip_address?: string;
  user_agent?: string;
  
  // Changes
  old_values?: any;
  new_values?: any;
  
  // Status
  status?: 'success' | 'failed' | 'pending';
  error_message?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  
  // Additional Context
  module_code?: string;
  permission_required?: string;
  data_scope?: any;
}

export class AuditService {
  constructor(private db: Pool) {}

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO audit_logs (
          tenant_id, user_id, user_email, user_role, session_id,
          action, resource_type, resource_id, resource_name,
          http_method, endpoint, ip_address, user_agent,
          old_values, new_values, status, error_message, severity,
          module_code, permission_required, data_scope, performed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP
        )
      `;

      const values = [
        entry.tenant_id || null,
        entry.user_id || null,
        entry.user_email || null,
        entry.user_role || null,
        entry.session_id || null,
        entry.action,
        entry.resource_type || null,
        entry.resource_id || null,
        entry.resource_name || null,
        entry.http_method || null,
        entry.endpoint || null,
        entry.ip_address || null,
        entry.user_agent || null,
        entry.old_values ? JSON.stringify(entry.old_values) : null,
        entry.new_values ? JSON.stringify(entry.new_values) : null,
        entry.status || 'success',
        entry.error_message || null,
        entry.severity || 'info',
        entry.module_code || null,
        entry.permission_required || null,
        entry.data_scope ? JSON.stringify(entry.data_scope) : null
      ];

      await this.db.query(query, values);
    } catch (error) {
      // Don't let audit logging failures break the application
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Log user authentication events
   */
  async logAuthEvent(
    action: 'login' | 'logout' | 'login_failed',
    user: { id?: string; email?: string; role?: string } | null,
    request: { ip?: string; userAgent?: string; sessionId?: string },
    tenantId?: string,
    error?: string
  ): Promise<void> {
    await this.log({
      tenant_id: tenantId,
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      session_id: request.sessionId,
      action,
      resource_type: 'authentication',
      ip_address: request.ip,
      user_agent: request.userAgent,
      status: error ? 'failed' : 'success',
      error_message: error,
      severity: error ? 'warning' : 'info',
      module_code: 'core'
    });
  }

  /**
   * Log user management operations
   */
  async logUserAction(
    action: 'create_user' | 'update_user' | 'delete_user' | 'activate_user' | 'deactivate_user',
    performedBy: { id: string; email: string; role: string },
    targetUser: { id: string; email: string },
    tenantId: string,
    oldValues?: any,
    newValues?: any,
    request?: { ip?: string; endpoint?: string }
  ): Promise<void> {
    await this.log({
      tenant_id: tenantId,
      user_id: performedBy.id,
      user_email: performedBy.email,
      user_role: performedBy.role,
      action,
      resource_type: 'user',
      resource_id: targetUser.id,
      resource_name: targetUser.email,
      ip_address: request?.ip,
      endpoint: request?.endpoint,
      old_values: oldValues,
      new_values: newValues,
      severity: action.includes('delete') || action.includes('deactivate') ? 'warning' : 'info',
      module_code: 'core'
    });
  }

  /**
   * Log role management operations
   */
  async logRoleAction(
    action: 'create_role' | 'update_role' | 'delete_role' | 'assign_role' | 'remove_role',
    performedBy: { id: string; email: string; role: string },
    role: { id?: string; name: string },
    tenantId: string,
    moduleCode: string,
    oldValues?: any,
    newValues?: any,
    targetUser?: { id: string; email: string }
  ): Promise<void> {
    await this.log({
      tenant_id: tenantId,
      user_id: performedBy.id,
      user_email: performedBy.email,
      user_role: performedBy.role,
      action,
      resource_type: 'role',
      resource_id: role.id,
      resource_name: role.name,
      old_values: oldValues,
      new_values: {
        ...newValues,
        target_user: targetUser
      },
      severity: action.includes('delete') ? 'warning' : 'info',
      module_code: moduleCode
    });
  }

  /**
   * Log permission changes
   */
  async logPermissionAction(
    action: 'update_permissions' | 'create_permission' | 'delete_permission',
    performedBy: { id: string; email: string; role: string },
    resource: { type: string; id: string; name: string },
    tenantId: string,
    moduleCode: string,
    oldPermissions?: any,
    newPermissions?: any
  ): Promise<void> {
    await this.log({
      tenant_id: tenantId,
      user_id: performedBy.id,
      user_email: performedBy.email,
      user_role: performedBy.role,
      action,
      resource_type: 'permission',
      resource_id: resource.id,
      resource_name: resource.name,
      old_values: oldPermissions,
      new_values: newPermissions,
      severity: 'warning', // Permission changes are always important
      module_code: moduleCode
    });
  }

  /**
   * Log module operations
   */
  async logModuleAction(
    action: 'activate_module' | 'deactivate_module' | 'update_module_settings',
    performedBy: { id: string; email: string; role: string },
    moduleCode: string,
    tenantId: string,
    oldSettings?: any,
    newSettings?: any
  ): Promise<void> {
    await this.log({
      tenant_id: tenantId,
      user_id: performedBy.id,
      user_email: performedBy.email,
      user_role: performedBy.role,
      action,
      resource_type: 'module',
      resource_id: moduleCode,
      resource_name: moduleCode,
      old_values: oldSettings,
      new_values: newSettings,
      severity: 'info',
      module_code: moduleCode
    });
  }

  /**
   * Log system events
   */
  async logSystemEvent(
    action: string,
    details: any,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): Promise<void> {
    await this.log({
      action,
      resource_type: 'system',
      new_values: details,
      severity,
      module_code: 'system'
    });
  }

  /**
   * Log from Express request context
   */
  async logFromRequest(
    req: AuthenticatedRequest,
    action: string,
    resourceType?: string,
    resourceId?: string,
    resourceName?: string,
    oldValues?: any,
    newValues?: any,
    status: 'success' | 'failed' = 'success',
    error?: string
  ): Promise<void> {
    const user = req.user;
    const tenantId = req.params.tenantId || user?.tenantId;

    await this.log({
      tenant_id: tenantId,
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      session_id: req.sessionID,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      http_method: req.method,
      endpoint: req.path,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      old_values: oldValues,
      new_values: newValues,
      status,
      error_message: error,
      severity: error ? 'error' : 'info',
      module_code: req.moduleContext,
      data_scope: req.dataScope
    });
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(filters: {
    tenant_id?: string;
    user_id?: string;
    action?: string;
    resource_type?: string;
    module_code?: string;
    severity?: string;
    from_date?: Date;
    to_date?: Date;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build dynamic WHERE clause
    if (filters.tenant_id) {
      whereConditions.push(`tenant_id = $${paramIndex++}`);
      queryParams.push(filters.tenant_id);
    }

    if (filters.user_id) {
      whereConditions.push(`user_id = $${paramIndex++}`);
      queryParams.push(filters.user_id);
    }

    if (filters.action) {
      whereConditions.push(`action = $${paramIndex++}`);
      queryParams.push(filters.action);
    }

    if (filters.resource_type) {
      whereConditions.push(`resource_type = $${paramIndex++}`);
      queryParams.push(filters.resource_type);
    }

    if (filters.module_code) {
      whereConditions.push(`module_code = $${paramIndex++}`);
      queryParams.push(filters.module_code);
    }

    if (filters.severity) {
      whereConditions.push(`severity = $${paramIndex++}`);
      queryParams.push(filters.severity);
    }

    if (filters.from_date) {
      whereConditions.push(`performed_at >= $${paramIndex++}`);
      queryParams.push(filters.from_date);
    }

    if (filters.to_date) {
      whereConditions.push(`performed_at <= $${paramIndex++}`);
      queryParams.push(filters.to_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const query = `
      SELECT * FROM audit_logs 
      ${whereClause}
      ORDER BY performed_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);

    const result = await this.db.query(query, queryParams);
    return result.rows;
  }

  /**
   * Get audit statistics
   */
  async getStatistics(tenantId?: string): Promise<any> {
    const tenantCondition = tenantId ? 'WHERE tenant_id = $1' : '';
    const params = tenantId ? [tenantId] : [];

    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_events,
        COUNT(*) FILTER (WHERE severity = 'warning') as warning_events,
        COUNT(*) FILTER (WHERE severity = 'error') as error_events,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT action) as unique_actions,
        MIN(performed_at) as earliest_event,
        MAX(performed_at) as latest_event
      FROM audit_logs 
      ${tenantCondition}
    `;

    const result = await this.db.query(query, params);
    return result.rows[0];
  }
}

export default AuditService;
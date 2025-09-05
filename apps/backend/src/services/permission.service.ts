import { Pool } from 'pg';

export interface PermissionResource {
  id: string;
  code: string;
  name: string;
  description?: string;
  module_code: string;
  parent_code?: string;
  resource_type: 'menu' | 'api' | 'report' | 'widget' | 'data';
  display_order: number;
  is_leaf: boolean;
  created_at: Date;
}

export interface UserEffectivePermission {
  user_id: string;
  module_code: string;
  resource_code: string;
  permission_level: 'manage' | 'view_only' | 'no_access';
  granted_by_role: string;
}

export interface PermissionCheck {
  hasAccess: boolean;
  permissionLevel: 'manage' | 'view_only' | 'no_access';
  grantedByRole?: string;
}

export class PermissionService {
  constructor(private db: Pool) {}

  async getModuleResources(moduleCode: string, includeNonLeaf = false): Promise<PermissionResource[]> {
    let query = `
      SELECT * FROM permission_resources 
      WHERE module_code = $1
    `;
    
    if (!includeNonLeaf) {
      query += ' AND is_leaf = true';
    }
    
    query += ' ORDER BY display_order';
    
    const result = await this.db.query(query, [moduleCode]);
    return result.rows;
  }

  async getResourceHierarchy(moduleCode: string): Promise<PermissionResource[]> {
    const query = `
      WITH RECURSIVE resource_hierarchy AS (
        -- Root level resources (no parent)
        SELECT *, 0 as level, ARRAY[display_order] as path
        FROM permission_resources 
        WHERE module_code = $1 AND parent_code IS NULL
        
        UNION ALL
        
        -- Child resources
        SELECT pr.*, rh.level + 1, rh.path || pr.display_order
        FROM permission_resources pr
        JOIN resource_hierarchy rh ON pr.parent_code = rh.code
        WHERE pr.module_code = $1
      )
      SELECT * FROM resource_hierarchy 
      ORDER BY path
    `;
    
    const result = await this.db.query(query, [moduleCode]);
    return result.rows;
  }

  async getUserEffectivePermissions(tenantId: string, userId: string, moduleCode?: string): Promise<UserEffectivePermission[]> {
    let query = `
      SELECT 
        umr.user_id,
        r.module_code,
        rp.resource_code,
        rp.permission_level,
        r.name as granted_by_role
      FROM ${tenantId}.user_module_roles umr
      JOIN ${tenantId}.roles r ON umr.role_id = r.id
      JOIN ${tenantId}.role_permissions rp ON r.id = rp.role_id
      WHERE umr.user_id = $1
    `;
    
    const params: any[] = [userId];
    
    if (moduleCode) {
      query += ' AND r.module_code = $2';
      params.push(moduleCode);
    }
    
    query += ' ORDER BY r.module_code, rp.resource_code';
    
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async checkUserPermission(
    tenantId: string, 
    userId: string, 
    resourceCode: string, 
    requiredLevel: 'manage' | 'view_only' = 'view_only'
  ): Promise<PermissionCheck> {
    const query = `
      SELECT 
        rp.permission_level,
        r.name as role_name,
        pr.module_code
      FROM ${tenantId}.user_module_roles umr
      JOIN ${tenantId}.roles r ON umr.role_id = r.id
      JOIN ${tenantId}.role_permissions rp ON r.id = rp.role_id
      JOIN permission_resources pr ON rp.resource_code = pr.code
      WHERE umr.user_id = $1 AND rp.resource_code = $2
      ORDER BY 
        CASE rp.permission_level 
          WHEN 'manage' THEN 3 
          WHEN 'view_only' THEN 2 
          WHEN 'no_access' THEN 1 
        END DESC
      LIMIT 1
    `;
    
    const result = await this.db.query(query, [userId, resourceCode]);
    
    if (result.rows.length === 0) {
      return {
        hasAccess: false,
        permissionLevel: 'no_access'
      };
    }
    
    const permission = result.rows[0];
    const hasAccess = this.permissionLevelMeets(permission.permission_level, requiredLevel);
    
    return {
      hasAccess,
      permissionLevel: permission.permission_level,
      grantedByRole: permission.role_name
    };
  }

  async checkUserModuleAccess(tenantId: string, userId: string, moduleCode: string): Promise<boolean> {
    const query = `
      SELECT 1 
      FROM ${tenantId}.user_module_roles umr
      JOIN ${tenantId}.roles r ON umr.role_id = r.id
      WHERE umr.user_id = $1 AND r.module_code = $2
      LIMIT 1
    `;
    
    const result = await this.db.query(query, [userId, moduleCode]);
    return result.rows.length > 0;
  }

  async getUserAccessibleModules(tenantId: string, userId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT r.module_code
      FROM ${tenantId}.user_module_roles umr
      JOIN ${tenantId}.roles r ON umr.role_id = r.id
      ORDER BY r.module_code
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows.map(row => row.module_code);
  }

  async getUserMenuPermissions(tenantId: string, userId: string, moduleCode: string): Promise<Array<{
    resourceCode: string;
    resourceName: string;
    parentCode: string | null;
    permissionLevel: string;
    isLeaf: boolean;
  }>> {
    const query = `
      SELECT 
        pr.code as resource_code,
        pr.name as resource_name,
        pr.parent_code,
        COALESCE(rp.permission_level, 'no_access') as permission_level,
        pr.is_leaf
      FROM permission_resources pr
      LEFT JOIN ${tenantId}.role_permissions rp ON pr.code = rp.resource_code
      LEFT JOIN ${tenantId}.roles r ON rp.role_id = r.id
      LEFT JOIN ${tenantId}.user_module_roles umr ON r.id = umr.role_id AND umr.user_id = $1
      WHERE pr.module_code = $2 AND pr.resource_type = 'menu'
      ORDER BY pr.display_order
    `;
    
    const result = await this.db.query(query, [userId, moduleCode]);
    return result.rows;
  }

  async setUserDataScope(tenantId: string, userId: string, scopeData: {
    module_code: string;
    scope_type: string;
    scope_values: string[];
    resource_filters?: any;
  }): Promise<void> {
    const query = `
      INSERT INTO ${tenantId}.user_data_scopes (
        user_id, module_code, scope_type, scope_values, resource_filters
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, module_code) 
      DO UPDATE SET 
        scope_type = EXCLUDED.scope_type,
        scope_values = EXCLUDED.scope_values,
        resource_filters = EXCLUDED.resource_filters,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await this.db.query(query, [
      userId,
      scopeData.module_code,
      scopeData.scope_type,
      JSON.stringify(scopeData.scope_values),
      JSON.stringify(scopeData.resource_filters || {})
    ]);
  }

  async getUserDataScope(tenantId: string, userId: string, moduleCode: string): Promise<any> {
    const query = `
      SELECT * FROM ${tenantId}.user_data_scopes 
      WHERE user_id = $1 AND module_code = $2
    `;
    
    const result = await this.db.query(query, [userId, moduleCode]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const scope = result.rows[0];
    return {
      ...scope,
      scope_values: JSON.parse(scope.scope_values || '[]'),
      resource_filters: JSON.parse(scope.resource_filters || '{}')
    };
  }

  async getModuleScopeableResources(moduleCode: string): Promise<PermissionResource[]> {
    const query = `
      SELECT * FROM permission_resources 
      WHERE module_code = $1 
      AND resource_type = 'data'
      AND is_leaf = true
      ORDER BY display_order
    `;
    
    const result = await this.db.query(query, [moduleCode]);
    return result.rows;
  }

  private permissionLevelMeets(currentLevel: string, requiredLevel: string): boolean {
    const levels = {
      'no_access': 0,
      'view_only': 1,
      'manage': 2
    };
    
    return levels[currentLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels];
  }

  async validateResourceAccess(tenantId: string, userId: string, apiEndpoint: string, method: string): Promise<boolean> {
    // Map API endpoints to resource codes
    const resourceCode = this.mapApiToResourceCode(apiEndpoint, method);
    
    if (!resourceCode) {
      // If no mapping found, allow access (for backward compatibility)
      return true;
    }
    
    const requiredLevel = method === 'GET' ? 'view_only' : 'manage';
    const check = await this.checkUserPermission(tenantId, userId, resourceCode, requiredLevel);
    
    return check.hasAccess;
  }

  private mapApiToResourceCode(endpoint: string, method: string): string | null {
    // Define API endpoint to resource mappings
    const mappings: Record<string, string> = {
      // WMS mappings
      'POST:/api/wms/inbound': 'wms_inbound_operations',
      'GET:/api/wms/inbound': 'wms_inbound_operations',
      'POST:/api/wms/outbound': 'wms_outbound_operations',
      'GET:/api/wms/outbound': 'wms_outbound_operations',
      'GET:/api/wms/inventory': 'wms_inventory_tracking',
      'PUT:/api/wms/inventory': 'wms_inventory_tracking',
      'GET:/api/wms/reports': 'wms_reports_analytics',
      'GET:/api/wms/dashboard': 'wms_dashboard',
      
      // Core mappings
      'GET:/api/users': 'core_user_management',
      'POST:/api/users': 'core_user_management',
      'PUT:/api/users': 'core_user_management',
      'DELETE:/api/users': 'core_user_management',
      'GET:/api/settings': 'core_general_settings',
      'PUT:/api/settings': 'core_general_settings'
    };
    
    const key = `${method}:${endpoint}`;
    return mappings[key] || null;
  }

  async calculateEffectivePermissions(tenantId: string, userId: string): Promise<void> {
    // This could be used to pre-calculate and cache user permissions
    // for performance optimization
    const query = `
      INSERT INTO ${tenantId}.user_effective_permissions (user_id, resource_code, permission_level, calculated_at)
      SELECT 
        $1 as user_id,
        rp.resource_code,
        MAX(CASE rp.permission_level 
          WHEN 'manage' THEN 3 
          WHEN 'view_only' THEN 2 
          WHEN 'no_access' THEN 1 
        END) as max_level,
        CURRENT_TIMESTAMP
      FROM ${tenantId}.user_module_roles umr
      JOIN ${tenantId}.roles r ON umr.role_id = r.id
      JOIN ${tenantId}.role_permissions rp ON r.id = rp.role_id
      WHERE umr.user_id = $1
      GROUP BY rp.resource_code
      ON CONFLICT (user_id, resource_code) 
      DO UPDATE SET 
        permission_level = CASE EXCLUDED.permission_level
          WHEN 3 THEN 'manage'
          WHEN 2 THEN 'view_only'
          WHEN 1 THEN 'no_access'
        END,
        calculated_at = CURRENT_TIMESTAMP
    `;
    
    await this.db.query(query, [userId]);
  }
}
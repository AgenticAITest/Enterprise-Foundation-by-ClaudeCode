/**
 * Tenant Admin API Client
 * Handles all tenant admin operations for the portal
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

class TenantAdminApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'TenantAdminApiError';
  }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new TenantAdminApiError(
      errorText || `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

export const tenantAdminApi = {
  // ==========================================
  // MODULE MANAGEMENT
  // ==========================================
  
  /**
   * Get tenant's active modules
   */
  getTenantModules: async (tenantId: string) => {
    const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}/modules`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Activate a module for tenant
   */
  activateModule: async (tenantId: string, moduleId: string, settings?: any) => {
    const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}/modules/${moduleId}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
    });
    return handleResponse(response);
  },

  /**
   * Update module settings
   */
  updateModuleSettings: async (tenantId: string, moduleId: string, settings: any) => {
    const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}/modules/${moduleId}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  },

  /**
   * Deactivate a module
   */
  deactivateModule: async (tenantId: string, moduleId: string) => {
    const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}/modules/${moduleId}/deactivate`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ==========================================
  // ROLE MANAGEMENT
  // ==========================================
  
  /**
   * Get all roles for a tenant in a specific module
   */
  getTenantModuleRoles: async (tenantId: string, moduleId: string) => {
    const response = await fetch(`${API_BASE_URL}/roles/tenants/${tenantId}/modules/${moduleId}/roles`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Create a new role
   */
  createRole: async (tenantId: string, moduleId: string, roleData: any) => {
    const response = await fetch(`${API_BASE_URL}/roles/tenants/${tenantId}/modules/${moduleId}/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(roleData),
    });
    return handleResponse(response);
  },

  /**
   * Update an existing role
   */
  updateRole: async (tenantId: string, roleId: string, roleData: any) => {
    const response = await fetch(`${API_BASE_URL}/roles/tenants/${tenantId}/roles/${roleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(roleData),
    });
    return handleResponse(response);
  },

  /**
   * Delete a role
   */
  deleteRole: async (tenantId: string, roleId: string) => {
    const response = await fetch(`${API_BASE_URL}/roles/tenants/${tenantId}/roles/${roleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get role templates for a module
   */
  getRoleTemplates: async (moduleCode?: string) => {
    const url = moduleCode 
      ? `${API_BASE_URL}/roles/templates/${moduleCode}`
      : `${API_BASE_URL}/roles/templates`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Create role from template
   */
  createRoleFromTemplate: async (tenantId: string, templateData: any) => {
    const response = await fetch(`${API_BASE_URL}/roles/tenants/${tenantId}/roles/from-template`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    });
    return handleResponse(response);
  },

  /**
   * Clone an existing role
   */
  cloneRole: async (tenantId: string, roleId: string, newRoleData: any) => {
    const response = await fetch(`${API_BASE_URL}/roles/tenants/${tenantId}/roles/${roleId}/clone`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newRoleData),
    });
    return handleResponse(response);
  },

  /**
   * Get role permissions
   */
  getRolePermissions: async (tenantId: string, roleId: string) => {
    const response = await fetch(`${API_BASE_URL}/roles/tenants/${tenantId}/roles/${roleId}/permissions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update role permissions
   */
  updateRolePermissions: async (tenantId: string, roleId: string, permissions: any) => {
    const response = await fetch(`${API_BASE_URL}/roles/tenants/${tenantId}/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissions }),
    });
    return handleResponse(response);
  },

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  
  /**
   * Get all users in tenant
   */
  getTenantUsers: async (tenantId: string) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get user's module roles
   */
  getUserModuleRoles: async (tenantId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/users/${userId}/module-roles`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get user's role in specific module
   */
  getUserModuleRole: async (tenantId: string, userId: string, moduleCode: string) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/users/${userId}/modules/${moduleCode}/role`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Assign module role to user
   */
  assignUserModuleRole: async (tenantId: string, userId: string, assignmentData: any) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/users/${userId}/module-roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(assignmentData),
    });
    return handleResponse(response);
  },

  /**
   * Update user's module role
   */
  updateUserModuleRole: async (tenantId: string, userId: string, moduleCode: string, roleData: any) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/users/${userId}/module-roles/${moduleCode}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(roleData),
    });
    return handleResponse(response);
  },

  /**
   * Remove user from module
   */
  removeUserModuleRole: async (tenantId: string, userId: string, moduleCode: string) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/users/${userId}/module-roles/${moduleCode}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Bulk assign role to multiple users
   */
  bulkAssignRole: async (tenantId: string, assignmentData: any) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/bulk-assign-role`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(assignmentData),
    });
    return handleResponse(response);
  },

  /**
   * Get users in specific module
   */
  getModuleUsers: async (tenantId: string, moduleCode: string) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/modules/${moduleCode}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get available users for module (not yet assigned)
   */
  getAvailableUsers: async (tenantId: string, moduleCode: string) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/modules/${moduleCode}/available-users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get user's role history
   */
  getUserRoleHistory: async (tenantId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/user-roles/tenants/${tenantId}/users/${userId}/role-history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ==========================================
  // PERMISSIONS & DATA SCOPES
  // ==========================================
  
  /**
   * Get user's effective permissions
   */
  getUserEffectivePermissions: async (tenantId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/permissions/tenants/${tenantId}/users/${userId}/effective-permissions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Check specific permission for user
   */
  checkUserPermission: async (tenantId: string, userId: string, resourceCode: string) => {
    const response = await fetch(`${API_BASE_URL}/permissions/tenants/${tenantId}/users/${userId}/check/${resourceCode}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get user's accessible modules
   */
  getUserAccessibleModules: async (tenantId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/permissions/tenants/${tenantId}/users/${userId}/accessible-modules`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get user's menu permissions for module
   */
  getUserMenuPermissions: async (tenantId: string, userId: string, moduleCode: string) => {
    const response = await fetch(`${API_BASE_URL}/permissions/tenants/${tenantId}/users/${userId}/menu-permissions/${moduleCode}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get user's data scopes for module
   */
  getUserDataScopes: async (tenantId: string, userId: string, moduleCode: string) => {
    const response = await fetch(`${API_BASE_URL}/permissions/tenants/${tenantId}/users/${userId}/data-scopes/${moduleCode}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update user's data scopes
   */
  updateUserDataScopes: async (tenantId: string, userId: string, scopeData: any) => {
    const response = await fetch(`${API_BASE_URL}/permissions/tenants/${tenantId}/users/${userId}/data-scopes`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(scopeData),
    });
    return handleResponse(response);
  },

  /**
   * Get scopeable resources for module
   */
  getScopeableResources: async (tenantId: string, moduleCode: string) => {
    const response = await fetch(`${API_BASE_URL}/permissions/tenants/${tenantId}/modules/${moduleCode}/scopeable-resources`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Validate user access
   */
  validateUserAccess: async (tenantId: string, userId: string, accessData: any) => {
    const response = await fetch(`${API_BASE_URL}/permissions/tenants/${tenantId}/users/${userId}/validate-access`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(accessData),
    });
    return handleResponse(response);
  },

  /**
   * Get permission resources for module
   */
  getModulePermissionResources: async (moduleCode: string) => {
    const response = await fetch(`${API_BASE_URL}/permissions/modules/${moduleCode}/resources`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get module permission hierarchy
   */
  getModulePermissionHierarchy: async (moduleCode: string) => {
    const response = await fetch(`${API_BASE_URL}/permissions/modules/${moduleCode}/hierarchy`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ==========================================
  // MODULES & SYSTEM
  // ==========================================
  
  /**
   * Get all available modules
   */
  getAllModules: async () => {
    const response = await fetch(`${API_BASE_URL}/modules`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get module details
   */
  getModuleDetails: async (moduleId: string) => {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ==========================================
  // AUDIT LOGS (Tenant-specific)
  // ==========================================
  
  /**
   * Get tenant's audit logs
   */
  getTenantAuditLogs: async (tenantId: string, params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = `${API_BASE_URL}/audit/logs${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        'X-Tenant-ID': tenantId, // Filter by tenant
      },
    });
    return handleResponse(response);
  },
};

export type { TenantAdminApiError };
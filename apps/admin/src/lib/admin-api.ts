/**
 * Centralized Admin API Client
 * Handles all API calls to the backend admin endpoints with proper authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

interface TenantStats {
  tenant_overview: {
    total_tenants: string;
    active_tenants: string;
    inactive_tenants: string;
    suspended_tenants: string;
    new_tenants_30d: string;
    new_tenants_7d: string;
  };
  user_overview: {
    total_users: string;
    new_users_30d: string;
    new_users_7d: string;
  };
  module_usage: Array<{
    module_name: string;
    module_code: string;
    active_tenants: string;
    new_activations_30d: string;
  }>;
  growth_trends: Array<{
    month: string;
    tenant_count: string;
  }>;
}

interface ModuleUsage {
  module_code: string;
  module_name: string;
  active_tenants: number;
  total_subscriptions: number;
  revenue: number;
  adoption_rate: number;
}

interface RevenueAnalytics {
  total_revenue: number;
  monthly_revenue: number;
  revenue_by_module: Array<{
    module_code: string;
    revenue: number;
  }>;
  revenue_by_tenant: Array<{
    tenant_id: string;
    company_name: string;
    revenue: number;
  }>;
}

class AdminApiClient {
  private getAuthHeaders(): HeadersInit {
    // Use the same token key as the main app since super admins login through the main app
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'API request failed');
    }

    return data.data as T;
  }

  // Admin Statistics APIs
  async getTenantStats(): Promise<TenantStats> {
    return this.request<TenantStats>('/api/admin/tenants/stats');
  }

  async getModuleUsage(): Promise<ModuleUsage[]> {
    return this.request<ModuleUsage[]>('/api/admin/modules/usage');
  }

  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    return this.request<RevenueAnalytics>('/api/admin/billing/revenue');
  }

  // Tenant Management APIs
  async createTenant(tenantData: {
    companyName: string;
    subdomain: string;
    domain: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    logo?: File;
    adminUser: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    };
  }): Promise<any> {
    // Use FormData for file upload
    const formData = new FormData();
    
    // Add all fields to FormData
    formData.append('companyName', tenantData.companyName);
    formData.append('subdomain', tenantData.subdomain);
    formData.append('domain', tenantData.domain);
    
    if (tenantData.address1) formData.append('address1', tenantData.address1);
    if (tenantData.address2) formData.append('address2', tenantData.address2);
    if (tenantData.city) formData.append('city', tenantData.city);
    if (tenantData.state) formData.append('state', tenantData.state);
    if (tenantData.zip) formData.append('zip', tenantData.zip);
    if (tenantData.phone) formData.append('phone', tenantData.phone);
    if (tenantData.logo) formData.append('logo', tenantData.logo);
    
    // Add admin user data
    formData.append('adminUser.email', tenantData.adminUser.email);
    formData.append('adminUser.password', tenantData.adminUser.password);
    if (tenantData.adminUser.firstName) formData.append('adminUser.firstName', tenantData.adminUser.firstName);
    if (tenantData.adminUser.lastName) formData.append('adminUser.lastName', tenantData.adminUser.lastName);

    // Make request without setting Content-Type (browser will set multipart/form-data automatically)
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3003'}/api/admin/tenants`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Don't set Content-Type - let browser set it with boundary for multipart/form-data
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'API request failed');
    }

    return data.data;
  }

  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    return this.request(`/api/admin/tenants/${tenantId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async activateTenant(tenantId: string): Promise<void> {
    return this.request(`/api/admin/tenants/${tenantId}/activate`, {
      method: 'POST',
    });
  }

  async getTenants(): Promise<any[]> {
    const data = await this.request('/api/admin/tenants');
    return data.tenants;
  }

  async getTenantDetails(tenantId: string): Promise<any> {
    return this.request(`/api/admin/tenants/${tenantId}`);
  }

  async getTenantModules(tenantId: string): Promise<any[]> {
    const data = await this.request(`/api/admin/tenants/${tenantId}/modules`);
    return data.modules;
  }

  async updateTenantModuleSubscription(
    tenantId: string, 
    moduleId: string, 
    status: string, 
    settings?: any, 
    expiresAt?: string
  ): Promise<void> {
    return this.request(`/api/admin/tenants/${tenantId}/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, settings, expires_at: expiresAt }),
    });
  }

  async updateTenantTrial(
    tenantId: string, 
    trialEndsAt: string, 
    trialModules: string[]
  ): Promise<void> {
    return this.request(`/api/admin/tenants/${tenantId}/trial`, {
      method: 'PUT',
      body: JSON.stringify({ trial_ends_at: trialEndsAt, trial_modules: trialModules }),
    });
  }

  async updateTenantLimits(
    tenantId: string, 
    maxUsers: number, 
    maxStorageGb: number, 
    maxApiCallsPerDay: number
  ): Promise<void> {
    return this.request(`/api/admin/tenants/${tenantId}/limits`, {
      method: 'PUT',
      body: JSON.stringify({ 
        max_users: maxUsers, 
        max_storage_gb: maxStorageGb, 
        max_api_calls_per_day: maxApiCallsPerDay 
      }),
    });
  }

  // Audit Log APIs
  async getAuditLogs(params: {
    tenant_id?: string;
    user_id?: string;
    action?: string;
    resource_type?: string;
    module_code?: string;
    severity?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.request(`/api/admin/audit-logs?${queryParams.toString()}`);
  }

  async getAuditLogStats(params?: {
    tenant_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }
    
    return this.request(`/api/admin/audit-logs/stats?${queryParams.toString()}`);
  }

  async getSecurityAlerts(limit: number = 20): Promise<any> {
    return this.request(`/api/admin/security-alerts?limit=${limit}`);
  }

  async exportAuditLogs(params: {
    tenant_id?: string;
    user_id?: string;
    action?: string;
    resource_type?: string;
    from_date?: string;
    to_date?: string;
    format?: 'csv' | 'json';
  }): Promise<Response> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value);
      }
    });
    
    return fetch(`${API_BASE_URL}/api/admin/audit-logs/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  // Module Management APIs
  async getModules(): Promise<any[]> {
    const data = await this.request('/api/admin/modules');
    return data.modules;
  }

  async updateModuleStatus(moduleId: string, status: 'active' | 'inactive'): Promise<void> {
    return this.request(`/api/admin/modules/${moduleId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateModuleSettings(moduleId: string, settings: any): Promise<void> {
    return this.request(`/api/admin/modules/${moduleId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // System Health APIs
  async getSystemHealth(): Promise<any> {
    return this.request('/api/admin/system/health');
  }

  async getSystemMetrics(): Promise<any> {
    return this.request('/api/admin/system/metrics');
  }

  async getSecurityEvents(): Promise<any[]> {
    return this.request<any[]>('/api/audit/security-events');
  }

  // Super Admin Management APIs
  async getSuperAdmins(): Promise<any[]> {
    const data = await this.request('/api/admin/super-admins');
    return data.superAdmins;
  }

  async createSuperAdmin(adminData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<any> {
    return this.request('/api/admin/super-admins', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  }

  async updateSuperAdmin(adminId: string, adminData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
  }): Promise<any> {
    return this.request(`/api/admin/super-admins/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(adminData),
    });
  }

  async deleteSuperAdmin(adminId: string): Promise<void> {
    return this.request(`/api/admin/super-admins/${adminId}`, {
      method: 'DELETE',
    });
  }

  // Error handling wrapper for React components
  async safeRequest<T>(
    requestFn: () => Promise<T>,
    fallback?: T
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const data = await requestFn();
      return { data, error: null };
    } catch (error) {
      console.error('Admin API Error:', error);
      return {
        data: fallback || null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export singleton instance
export const adminApi = new AdminApiClient();

// Export types for use in components
export type {
  TenantStats,
  ModuleUsage,
  RevenueAnalytics,
  ApiResponse,
};
/**
 * TypeScript interfaces for Admin API responses and data structures
 */

export interface SuperAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Tenant {
  id: string;
  companyName: string;
  subdomain: string;
  status: 'active' | 'suspended' | 'inactive' | 'trial';
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  userCount: number;
  createdAt: string;
  lastActiveAt?: string;
  billingEmail: string;
  modules: string[];
  settings: Record<string, any>;
}

export interface SystemHealth {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  responseTime?: string;
  lastCheck: string;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
  };
  redis: {
    connected: boolean;
    memory: number;
    commands: number;
  };
}

export interface AuditLog {
  id: string;
  tenantId: string | null;
  userId: string;
  userEmail: string;
  actionType: string;
  resourceType: string;
  resourceId: string | null;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  eventType: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  userId?: string;
  tenantId?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ModuleInfo {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  basePrice: number;
  category: string;
  features: string[];
  dependencies: string[];
  settings: Record<string, any>;
}

export interface BillingInfo {
  tenantId: string;
  totalRevenue: number;
  monthlyRevenue: number;
  lastPayment: string;
  nextPayment: string;
  status: 'active' | 'overdue' | 'cancelled';
  modules: Array<{
    moduleCode: string;
    price: number;
    startDate: string;
    endDate?: string;
  }>;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// Dashboard specific interfaces
export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  monthlyRevenue: number;
  systemUptime: string;
  avgResponseTime: string;
}

export interface RecentActivity {
  id: string;
  type: 'tenant_created' | 'user_registered' | 'module_activated' | 'payment_received';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Chart data interfaces
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TenantGrowthData {
  monthly: ChartDataPoint[];
  weekly: ChartDataPoint[];
  daily: ChartDataPoint[];
}

export interface RevenueData {
  total: ChartDataPoint[];
  byModule: Array<{
    moduleCode: string;
    moduleName: string;
    data: ChartDataPoint[];
  }>;
  byTenant: Array<{
    tenantId: string;
    companyName: string;
    data: ChartDataPoint[];
  }>;
}

// Filter interfaces
export interface AuditLogFilters {
  tenantId?: string;
  userId?: string;
  actionType?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface TenantFilters {
  status?: Tenant['status'][];
  subscriptionTier?: Tenant['subscriptionTier'][];
  modules?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'lastActiveAt' | 'companyName' | 'userCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SecurityEventFilters {
  eventType?: SecurityEvent['eventType'][];
  severity?: SecurityEvent['severity'][];
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  userId?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
}

// Form interfaces
export interface CreateTenantForm {
  companyName: string;
  subdomain: string;
  billingEmail: string;
  subscriptionTier: Tenant['subscriptionTier'];
  modules: string[];
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

export interface UpdateTenantForm {
  companyName?: string;
  billingEmail?: string;
  subscriptionTier?: Tenant['subscriptionTier'];
  modules?: string[];
  settings?: Record<string, any>;
}

export interface ModuleSettingsForm {
  isActive: boolean;
  basePrice: number;
  features: string[];
  settings: Record<string, any>;
}
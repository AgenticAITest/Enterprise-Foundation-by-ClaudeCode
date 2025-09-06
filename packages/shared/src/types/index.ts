export interface Tenant {
  id: string;
  subdomain: string;
  companyName: string;
  status: 'active' | 'suspended' | 'inactive';
  planId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  tenantId: string;
  isActive: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBase: boolean;
  exchangeRate?: number;
}

export interface CompanySettings {
  companyName: string;
  logo?: string;
  addresses: CompanyAddress[];
  baseCurrency: string;
  allowedCurrencies: string[];
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

export interface CompanyAddress {
  type: 'head_office' | 'branch' | 'warehouse';
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  email?: string;
}

export interface Document {
  id: string;
  type: string;
  title: string;
  contentHtml: string;
  metadata: Record<string, any>;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  is_active: boolean;
  base_price: number;
  price_per_user: number;
  icon: string;
  color: string;
  dependencies?: string[];
  settings_schema?: object;
  created_at: Date;
  updated_at: Date;
}

export interface TenantModule extends Module {
  status: 'active' | 'suspended' | 'trial' | 'expired';
  settings: object;
  trial_ends_at?: Date;
  activated_at: Date;
  suspended_at?: Date;
}

export interface ModuleRole {
  id: string;
  module_id: string;
  role_code: string;
  role_name: string;
  description: string;
  based_on_template_id?: string;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ModuleRoleTemplate {
  id: string;
  module_id: string;
  role_code: string;
  role_name: string;
  description: string;
  is_system: boolean;
  sort_order: number;
  default_permissions: object;
  created_at: Date;
}

export interface PermissionResource {
  id: string;
  module_id: string;
  resource_code: string;
  resource_name: string;
  resource_type: 'menu' | 'api' | 'report' | 'widget' | 'data';
  parent_resource_id?: string;
  path?: string;
  sort_order: number;
  actions: string[];
  data_scope_types: string[];
  is_active: boolean;
  created_at: Date;
}

export interface RolePermission {
  id: string;
  role_id: string;
  resource_id: string;
  actions: string[];
  data_scope: object;
  field_permissions: object;
  conditions: object;
  granted: boolean;
  created_at: Date;
}

export interface UserModuleRole {
  user_id: string;
  module_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
}

export interface UserDataScope {
  id: string;
  user_id: string;
  module_id: string;
  scope_type: string;
  scope_values: object;
  is_inclusive: boolean;
  created_at: Date;
}

export interface BillingUsage {
  tenantId: string;
  metricType: 'users' | 'storage' | 'api_calls' | 'modules';
  usageValue: number;
  billingPeriod: Date;
  createdAt: Date;
}

export interface TestResult {
  testScenario: string;
  expectedResult: string;
  actualResult: string;
  screenshots?: string[];
  executionTime: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  errorMessage?: string;
}

// Integration Module Types
export interface Integration {
  id: string;
  tenant_id: string;
  name: string;
  type: 'inbound_api' | 'outbound_api' | 'webhook';
  status: 'active' | 'inactive' | 'error';
  description?: string;
  environment: 'development' | 'staging' | 'production';
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InboundAPI {
  id: string;
  integration_id: string;
  endpoint_path: string;
  http_methods: string[];
  authentication_type: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'oauth2';
  api_key?: string;
  rate_limit_requests: number;
  rate_limit_window_minutes: number;
  request_validation_schema?: object;
  response_mapping?: object;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OutboundAPI {
  id: string;
  integration_id: string;
  name: string;
  base_url: string;
  authentication_type: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'oauth2';
  auth_credentials?: object;
  default_headers?: object;
  timeout_seconds: number;
  retry_attempts: number;
  retry_delay_seconds: number;
  request_template?: object;
  response_mapping?: object;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Webhook {
  id: string;
  integration_id: string;
  name: string;
  url: string;
  events: string[];
  authentication_type: 'none' | 'api_key' | 'bearer_token' | 'signature';
  auth_credentials?: object;
  headers?: object;
  payload_template?: object;
  retry_attempts: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  integration_type: string;
  execution_type: 'inbound_request' | 'outbound_request' | 'webhook_delivery';
  status: 'success' | 'error' | 'pending' | 'timeout';
  request_data?: object;
  response_data?: object;
  error_message?: string;
  execution_time_ms?: number;
  created_at: Date;
}

export interface IntegrationAPIKey {
  id: string;
  integration_id: string;
  key_name: string;
  api_key_hash: string;
  permissions: string[];
  last_used_at?: Date;
  expires_at?: Date;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IntegrationFieldMapping {
  id: string;
  integration_id: string;
  mapping_type: 'inbound' | 'outbound' | 'webhook';
  source_field: string;
  target_field: string;
  transformation_rule?: object;
  is_required: boolean;
  default_value?: string;
  created_at: Date;
  updated_at: Date;
}
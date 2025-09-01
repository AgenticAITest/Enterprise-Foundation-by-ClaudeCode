export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  MODULE_ADMIN: 'module_admin',
  USER: 'user',
  READONLY: 'readonly'
} as const;

export const PERMISSIONS = {
  TENANT_CREATE: 'tenant:create',
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  MODULE_CONFIGURE: 'module:configure',
  BILLING_VIEW: 'billing:view',
  BILLING_MANAGE: 'billing:manage',
  SETTINGS_UPDATE: 'settings:update'
} as const;

export const MODULES = {
  ACCOUNTING: 'accounting',
  INVENTORY: 'inventory',
  CRM: 'crm',
  HR: 'hr',
  PROJECT: 'project',
  PROCUREMENT: 'procurement'
} as const;

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 }
] as const;

export const BILLING_METRICS = {
  USERS: 'users',
  STORAGE: 'storage',
  API_CALLS: 'api_calls',
  MODULES: 'modules'
} as const;
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
  CORE: 'core',
  WMS: 'wms',
  ACCOUNTING: 'accounting',
  POS: 'pos',
  HR: 'hr',
  INVENTORY: 'inventory',
  CRM: 'crm',
  PROJECT: 'project',
  PROCUREMENT: 'procurement',
  MANUFACTURING: 'manufacturing'
} as const;

export const MODULE_ROLES = {
  // Core module roles
  CORE: {
    TENANT_ADMIN: 'tenant_admin',
    SYSTEM_MANAGER: 'system_manager',
    USER_MANAGER: 'user_manager',
    READONLY_USER: 'readonly_user'
  },
  // WMS module roles
  WMS: {
    WAREHOUSE_ADMIN: 'warehouse_admin',
    WAREHOUSE_MANAGER: 'warehouse_manager',
    WAREHOUSE_SUPERVISOR: 'warehouse_supervisor',
    WAREHOUSE_WORKER: 'warehouse_worker',
    INVENTORY_AUDITOR: 'inventory_auditor'
  },
  // Accounting module roles
  ACCOUNTING: {
    FINANCE_ADMIN: 'finance_admin',
    FINANCE_MANAGER: 'finance_manager',
    ACCOUNTANT: 'accountant',
    BOOKKEEPER: 'bookkeeper',
    EXPENSE_SUBMITTER: 'expense_submitter'
  },
  // POS module roles
  POS: {
    POS_ADMIN: 'pos_admin',
    REGIONAL_MANAGER: 'regional_manager',
    STORE_MANAGER: 'store_manager',
    SHIFT_SUPERVISOR: 'shift_supervisor',
    CASHIER: 'cashier'
  },
  // HR module roles
  HR: {
    HR_ADMIN: 'hr_admin',
    HR_MANAGER: 'hr_manager',
    PAYROLL_PROCESSOR: 'payroll_processor',
    DEPARTMENT_MANAGER: 'department_manager',
    EMPLOYEE: 'employee'
  }
} as const;

export const PERMISSION_ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  EXPORT: 'export',
  PROCESS: 'process',
  SEND: 'send',
  VOID: 'void',
  FILE: 'file'
} as const;

export const RESOURCE_TYPES = {
  MENU: 'menu',
  API: 'api',
  REPORT: 'report',
  WIDGET: 'widget',
  DATA: 'data'
} as const;

export const DATA_SCOPE_TYPES = {
  ALL: 'all',
  OWN_RECORDS: 'own_records',
  DEPARTMENT: 'department',
  LOCATION: 'location',
  WAREHOUSE: 'warehouse',
  STORE: 'store',
  REGION: 'region',
  TEAM: 'team',
  MANAGER: 'manager'
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
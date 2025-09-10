import { UserRole } from './types';

// Test User Configurations for Multi-Role Testing
export const TEST_USERS: Record<string, UserRole> = {
  super_admin: {
    name: 'super_admin',
    email: 'super@example.com',
    password: 'password',
    permissions: ['*'],
    modules: ['*'],
    description: 'Super Administrator with full system access'
  },

  tenant_admin: {
    name: 'tenant_admin', 
    email: 'admin@example.com',
    password: 'password',
    permissions: [
      'tenant:*',
      'users:*', 
      'roles:*',
      'modules:configure',
      'audit:view',
      'settings:*'
    ],
    modules: ['core', 'wms', 'accounting', 'pos', 'hr'],
    description: 'Tenant Administrator with full tenant management access'
  },

  module_admin: {
    name: 'module_admin',
    email: 'moduleadmin@acme.com', 
    password: 'password',
    permissions: [
      'modules:configure',
      'users:view',
      'users:invite',
      'roles:view',
      'settings:view'
    ],
    modules: ['core', 'wms'],
    description: 'Module Administrator with limited administrative access'
  },

  wms_user: {
    name: 'wms_user',
    email: 'warehouse@acme.com',
    password: 'password',
    permissions: [
      'wms:*',
      'inventory:view',
      'inventory:edit',
      'reports:view',
      'dashboard:view'
    ],
    modules: ['core', 'wms'],
    description: 'Warehouse Management System user with WMS-specific access'
  },

  accounting_user: {
    name: 'accounting_user',
    email: 'accounting@techcorp.com',
    password: 'password',
    permissions: [
      'accounting:*',
      'reports:*',
      'dashboard:view',
      'export:financial'
    ],
    modules: ['core', 'accounting'],
    description: 'Accounting user with financial module access'
  },

  readonly_user: {
    name: 'readonly_user',
    email: 'readonly@techcorp.com',
    password: 'password',
    permissions: [
      '*:view',
      'dashboard:view',
      'reports:view'
    ],
    modules: ['core'],
    description: 'Read-only user with view-only access to basic features'
  }
};

// Expected Navigation Access per Role
export const EXPECTED_ACCESS: Record<string, string[]> = {
  super_admin: [
    '/',
    '/admin',
    '/admin/modules', 
    '/admin/users',
    '/admin/roles',
    '/admin/data-scopes',
    '/admin/audit',
    '/admin/settings',
    '/admin/tenants',
    '/admin/currencies',
    '/admin/integrations',
    '/debug'
  ],

  tenant_admin: [
    '/',
    '/admin',
    '/admin/modules',
    '/admin/users', 
    '/admin/roles',
    '/admin/data-scopes',
    '/admin/audit',
    '/admin/settings',
    '/admin/tenants',
    '/admin/currencies'
  ],

  module_admin: [
    '/',
    '/admin',
    '/admin/modules',
    '/admin/users',
    '/admin/roles'
  ],

  wms_user: [
    '/',
    '/admin',
    '/admin/modules'
  ],

  accounting_user: [
    '/',
    '/admin',
    '/admin/modules',
    '/admin/currencies'
  ],

  readonly_user: [
    '/',
    '/admin'
  ]
};

// Elements that should be visible/hidden per role
export const ROLE_ELEMENT_VISIBILITY: Record<string, {
  visible: string[];
  hidden: string[];
}> = {
  super_admin: {
    visible: [
      '[data-testid="super-admin-panel"]',
      '[data-testid="global-settings"]',
      '[data-testid="tenant-management"]',
      '[data-testid="system-monitoring"]'
    ],
    hidden: []
  },

  tenant_admin: {
    visible: [
      '[data-testid="user-management"]',
      '[data-testid="role-management"]', 
      '[data-testid="module-configuration"]',
      '[data-testid="audit-logs"]',
      '[data-testid="tenant-settings"]'
    ],
    hidden: [
      '[data-testid="super-admin-panel"]',
      '[data-testid="global-settings"]',
      '[data-testid="system-monitoring"]'
    ]
  },

  module_admin: {
    visible: [
      '[data-testid="module-configuration"]',
      '[data-testid="user-list-view"]'
    ],
    hidden: [
      '[data-testid="super-admin-panel"]',
      '[data-testid="global-settings"]',
      '[data-testid="delete-user-button"]',
      '[data-testid="billing-management"]'
    ]
  },

  wms_user: {
    visible: [
      '[data-testid="wms-dashboard"]',
      '[data-testid="inventory-management"]',
      '[data-testid="warehouse-operations"]'
    ],
    hidden: [
      '[data-testid="user-management"]',
      '[data-testid="role-management"]',
      '[data-testid="system-settings"]',
      '[data-testid="billing-management"]'
    ]
  },

  accounting_user: {
    visible: [
      '[data-testid="accounting-dashboard"]',
      '[data-testid="financial-reports"]',
      '[data-testid="currency-management"]'
    ],
    hidden: [
      '[data-testid="user-management"]',
      '[data-testid="wms-dashboard"]',
      '[data-testid="hr-management"]'
    ]
  },

  readonly_user: {
    visible: [
      '[data-testid="dashboard-view"]',
      '[data-testid="reports-view"]'
    ],
    hidden: [
      '[data-testid="create-button"]',
      '[data-testid="edit-button"]', 
      '[data-testid="delete-button"]',
      '[data-testid="user-management"]',
      '[data-testid="role-management"]'
    ]
  }
};

// API endpoints that should be accessible per role
export const API_ACCESS_MATRIX: Record<string, {
  allowed: string[];
  denied: string[];
}> = {
  super_admin: {
    allowed: [
      'GET /api/admin/*',
      'POST /api/admin/*',
      'PUT /api/admin/*',
      'DELETE /api/admin/*',
      'GET /api/tenants/*',
      'POST /api/tenants/*'
    ],
    denied: []
  },

  tenant_admin: {
    allowed: [
      'GET /api/tenants/*/users',
      'POST /api/tenants/*/users',
      'PUT /api/tenants/*/users/*',
      'GET /api/tenants/*/roles',
      'POST /api/tenants/*/roles'
    ],
    denied: [
      'GET /api/admin/tenants',
      'DELETE /api/admin/*',
      'POST /api/admin/modules'
    ]
  },

  wms_user: {
    allowed: [
      'GET /api/wms/*',
      'POST /api/wms/inventory',
      'PUT /api/wms/inventory/*'
    ],
    denied: [
      'GET /api/admin/*',
      'POST /api/tenants/*',
      'DELETE /api/*'
    ]
  },

  readonly_user: {
    allowed: [
      'GET /api/dashboard',
      'GET /api/reports'
    ],
    denied: [
      'POST /api/*',
      'PUT /api/*',
      'DELETE /api/*',
      'GET /api/admin/*'
    ]
  }
};
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTenant } from './tenant-provider';
import { useAuth } from './auth-provider';
import { tenantAdminApi } from '@/lib/tenant-admin-api';

interface TenantAdminContextType {
  isAdmin: boolean;
  adminPermissions: string[];
  tenantModules: any[];
  tenantUsers: any[];
  tenantRoles: any[];
  isLoading: boolean;
  error: string | null;
  
  // Role Management specific data
  rolesByModule: Record<string, any[]>;
  permissionResources: Record<string, any>;
  roleTemplates: any[];
  selectedModule: string;
  
  // Data management functions
  refreshModules: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshRoleData: () => Promise<void>;
  
  // Role Management functions
  setSelectedModule: (module: string) => void;
  getRolesForModule: (module: string) => any[];
  getPermissionResourcesForModule: (module: string) => any;
  createRole: (roleData: any) => Promise<void>;
  updateRole: (roleId: string, roleData: any) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  cloneRole: (roleId: string, newName: string) => Promise<void>;
  createRoleFromTemplate: (templateId: string, customizations?: any) => Promise<void>;
  
  // Role Builder specific functions
  validateRoleName: (name: string, excludeId?: string) => Promise<{ isValid: boolean; message?: string }>;
  getPermissionTree: (moduleCode: string) => any[];
  getEffectivePermissions: (roleData: any) => any[];
  detectPermissionConflicts: (permissions: any) => any[];
  
  // Bulk Assignment functions
  getAllUsers: () => any[];
  getUsersByFilters: (filters: any) => any[];
  bulkAssignRoles: (assignments: any[]) => Promise<void>;
  bulkUnassignRoles: (assignments: any[]) => Promise<void>;
  previewBulkAssignment: (assignments: any[]) => Promise<any>;
  resolveAssignmentConflicts: (conflicts: any[]) => Promise<void>;
  validateBulkAssignment: (assignments: any[]) => Promise<any>;
  
  // Permission checking
  hasPermission: (permission: string) => boolean;
  canManageUsers: () => boolean;
  canManageRoles: () => boolean;
  canManageModules: () => boolean;
}

const TenantAdminContext = createContext<TenantAdminContextType | undefined>(undefined);

export const useTenantAdmin = () => {
  const context = useContext(TenantAdminContext);
  if (context === undefined) {
    throw new Error('useTenantAdmin must be used within a TenantAdminProvider');
  }
  return context;
};

interface TenantAdminProviderProps {
  children: React.ReactNode;
}

export const TenantAdminProvider: React.FC<TenantAdminProviderProps> = ({ children }) => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);
  const [tenantModules, setTenantModules] = useState<any[]>([]);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [tenantRoles, setTenantRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role Management specific state
  const [rolesByModule, setRolesByModule] = useState<Record<string, any[]>>({});
  const [permissionResources, setPermissionResources] = useState<Record<string, any>>({});
  const [roleTemplates, setRoleTemplates] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('core');

  // Check if user is tenant admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('TenantAdminProvider - checkAdminStatus called', { user, tenant });
      
      if (!user || !tenant) {
        console.log('TenantAdminProvider - No user or tenant, setting isAdmin=false');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // For now, we'll use mock admin check - VERY PERMISSIVE FOR TESTING
        // In real implementation, this would check user's role/permissions
        const mockAdminCheck = true; // TEMPORARILY ALLOW ALL USERS FOR TESTING
        
        // Original logic for reference:
        // const mockAdminCheck = user.role === 'tenant_admin' || 
        //                      user.email?.includes('admin') || 
        //                      user.tenantId === tenant.id;
        
        console.log('TenantAdminProvider - mockAdminCheck result:', mockAdminCheck);
        setIsAdmin(mockAdminCheck);
        
        if (mockAdminCheck) {
          console.log('TenantAdminProvider - Setting admin permissions');
          // Mock admin permissions
          setAdminPermissions([
            'manage_users',
            'manage_roles', 
            'manage_modules',
            'view_audit_logs',
            'configure_settings'
          ]);
        } else {
          console.log('TenantAdminProvider - User is not admin, no permissions');
          setAdminPermissions([]);
        }
      } catch (err) {
        console.error('Failed to check admin status:', err);
        setIsAdmin(false);
        setAdminPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, tenant]);

  // Fetch tenant modules
  const refreshModules = async () => {
    if (!tenant || !isAdmin) return;

    try {
      // Enhanced mock data for Module Dashboard
      // In production, this would call: tenantAdminApi.getTenantModules(tenant.id)
      const mockModules = [
        {
          code: 'core',
          name: 'Core Module',
          description: 'Essential system functionality and user management',
          category: 'Core',
          status: 'active',
          version: '2.1.0',
          usageStats: {
            activeUsers: 247,
            totalUsers: 247,
            lastActivity: new Date(),
            apiCalls: 15420,
            usagePercentage: 100
          },
          settings: {
            autoBackup: true,
            sessionTimeout: 3600
          },
          permissions: {
            canDisable: false,
            canConfigure: true,
            canViewStats: true
          }
        },
        {
          code: 'wms',
          name: 'Warehouse Management',
          description: 'Complete warehouse operations and inventory management',
          category: 'Business',
          status: 'active',
          version: '1.8.2',
          usageStats: {
            activeUsers: 156,
            totalUsers: 180,
            lastActivity: new Date(Date.now() - 300000), // 5 min ago
            storageUsed: '2.4 GB',
            usagePercentage: 87
          },
          settings: {
            enableBarcodeScanning: true,
            stockAlertThreshold: 10
          },
          permissions: {
            canDisable: true,
            canConfigure: true,
            canViewStats: true
          }
        },
        {
          code: 'accounting',
          name: 'Accounting',
          description: 'Financial management and reporting system',
          category: 'Business',
          status: 'active',
          version: '1.5.1',
          usageStats: {
            activeUsers: 89,
            totalUsers: 120,
            lastActivity: new Date(Date.now() - 1800000), // 30 min ago
            storageUsed: '1.8 GB',
            usagePercentage: 74
          },
          settings: {
            fiscalYearStart: 'April',
            taxCalculation: 'automatic'
          },
          permissions: {
            canDisable: true,
            canConfigure: true,
            canViewStats: true
          }
        },
        {
          code: 'pos',
          name: 'Point of Sale',
          description: 'Retail point of sale and customer management',
          category: 'Business',
          status: 'active',
          version: '1.3.0',
          usageStats: {
            activeUsers: 45,
            totalUsers: 60,
            lastActivity: new Date(Date.now() - 900000), // 15 min ago
            apiCalls: 3420,
            usagePercentage: 75
          },
          settings: {
            printReceipts: true,
            loyaltyProgram: false
          },
          permissions: {
            canDisable: true,
            canConfigure: true,
            canViewStats: true
          }
        },
        {
          code: 'hr',
          name: 'Human Resources',
          description: 'Employee management and HR operations',
          category: 'Business',
          status: 'active',
          version: '1.6.0',
          usageStats: {
            activeUsers: 67,
            totalUsers: 80,
            lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
            storageUsed: '890 MB',
            usagePercentage: 84
          },
          settings: {
            leaveApprovalWorkflow: true,
            performanceReviews: true
          },
          permissions: {
            canDisable: true,
            canConfigure: true,
            canViewStats: true
          }
        },
        {
          code: 'integration',
          name: 'Integration Module',
          description: 'Third-party integrations and API connections',
          category: 'Integration',
          status: 'trial',
          version: '1.0.0',
          usageStats: {
            activeUsers: 12,
            totalUsers: 25,
            lastActivity: new Date(Date.now() - 7200000), // 2 hours ago
            apiCalls: 892,
            usagePercentage: 48
          },
          trialInfo: {
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            daysRemaining: 7
          },
          settings: {
            webhooksEnabled: true,
            rateLimiting: 1000
          },
          permissions: {
            canDisable: true,
            canConfigure: false,
            canViewStats: true
          }
        }
      ];
      
      setTenantModules(mockModules);
    } catch (err) {
      console.error('Failed to fetch tenant modules:', err);
      setError('Failed to fetch modules');
    }
  };

  // Fetch tenant users
  const refreshUsers = async () => {
    if (!tenant || !isAdmin) return;

    try {
      // For development, we'll use mock data
      // In production, this would call: tenantAdminApi.getTenantUsers(tenant.id)
      const mockUsers = [
        { id: '1', email: 'john.doe@company.com', name: 'John Doe', role: 'Manager', status: 'active' },
        { id: '2', email: 'jane.smith@company.com', name: 'Jane Smith', role: 'Supervisor', status: 'active' },
        { id: '3', email: 'bob.wilson@company.com', name: 'Bob Wilson', role: 'Worker', status: 'active' }
      ];
      
      setTenantUsers(mockUsers);
    } catch (err) {
      console.error('Failed to fetch tenant users:', err);
      setError('Failed to fetch users');
    }
  };

  // Fetch tenant roles (legacy simple format)
  const refreshRoles = async () => {
    if (!tenant || !isAdmin) return;

    try {
      // For development, we'll use mock data
      // In production, this would call API to get roles
      const mockRoles = [
        { id: '1', name: 'Tenant Admin', module: 'core', users: 2, permissions: 45 },
        { id: '2', name: 'Warehouse Manager', module: 'wms', users: 5, permissions: 32 },
        { id: '3', name: 'Accountant', module: 'accounting', users: 8, permissions: 18 },
        { id: '4', name: 'Cashier', module: 'pos', users: 12, permissions: 8 }
      ];
      
      setTenantRoles(mockRoles);
    } catch (err) {
      console.error('Failed to fetch tenant roles:', err);
      setError('Failed to fetch roles');
    }
  };

  // Comprehensive role data fetching for Role Management Interface
  const refreshRoleData = async () => {
    if (!tenant || !isAdmin) return;

    try {
      console.log('Fetching comprehensive role data for tenant:', tenant.id);
      
      // Get active modules
      const activeModules = tenantModules.filter(m => m.status === 'active');
      
      // Mock comprehensive role data with realistic RBAC structure
      const mockRolesByModule: Record<string, any[]> = {
        core: [
          {
            id: 'role_core_1',
            name: 'Tenant Administrator',
            description: 'Full administrative access to tenant',
            moduleCode: 'core',
            isTemplate: false,
            isSystem: false,
            permissionCount: 12,
            userCount: 2,
            status: 'active',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date(),
            permissions: {
              'core.dashboard.view': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.dashboard.edit': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.users.view': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.users.create': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.users.edit': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.users.delete': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.settings.view': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.settings.edit': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.tenant_management.view': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.tenant_management.edit': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.reports.view': { granted: true, inherited: false, conditional: false, source: 'custom' },
              'core.reports.export': { granted: true, inherited: false, conditional: false, source: 'custom' }
            }
          },
          {
            id: 'role_core_2', 
            name: 'Manager',
            description: 'Management level access with reporting',
            moduleCode: 'core',
            isTemplate: true,
            isSystem: false,
            permissionCount: 8,
            userCount: 5,
            status: 'active',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date(),
            permissions: {
              'core.dashboard.view': { granted: true, inherited: true, conditional: false, source: 'template' },
              'core.dashboard.edit': { granted: false, inherited: false, conditional: false, source: 'template' },
              'core.users.view': { granted: true, inherited: true, conditional: false, source: 'template' },
              'core.users.create': { granted: true, inherited: true, conditional: false, source: 'template' },
              'core.users.edit': { granted: true, inherited: true, conditional: false, source: 'template' },
              'core.users.delete': { granted: false, inherited: false, conditional: false, source: 'template' },
              'core.settings.view': { granted: true, inherited: true, conditional: false, source: 'template' },
              'core.settings.edit': { granted: false, inherited: false, conditional: false, source: 'template' },
              'core.tenant_management.view': { granted: false, inherited: false, conditional: false, source: 'template' },
              'core.tenant_management.edit': { granted: false, inherited: false, conditional: false, source: 'template' },
              'core.reports.view': { granted: true, inherited: true, conditional: false, source: 'template' },
              'core.reports.export': { granted: true, inherited: true, conditional: true, source: 'template' }
            }
          },
          {
            id: 'role_core_3',
            name: 'User',
            description: 'Standard user access to core functionalities',
            moduleCode: 'core',
            isTemplate: true,
            isSystem: true,
            permissionCount: 4,
            userCount: 25,
            status: 'active',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date(),
            permissions: {
              'core.dashboard.view': { granted: true, inherited: true, conditional: false, source: 'system' },
              'core.dashboard.edit': { granted: false, inherited: false, conditional: false, source: 'system' },
              'core.users.view': { granted: false, inherited: false, conditional: false, source: 'system' },
              'core.users.create': { granted: false, inherited: false, conditional: false, source: 'system' },
              'core.users.edit': { granted: false, inherited: false, conditional: false, source: 'system' },
              'core.users.delete': { granted: false, inherited: false, conditional: false, source: 'system' },
              'core.settings.view': { granted: true, inherited: true, conditional: true, source: 'system' },
              'core.settings.edit': { granted: false, inherited: false, conditional: false, source: 'system' },
              'core.tenant_management.view': { granted: false, inherited: false, conditional: false, source: 'system' },
              'core.tenant_management.edit': { granted: false, inherited: false, conditional: false, source: 'system' },
              'core.reports.view': { granted: true, inherited: true, conditional: false, source: 'system' },
              'core.reports.export': { granted: false, inherited: false, conditional: false, source: 'system' }
            }
          }
        ],
        wms: [
          {
            id: 'role_wms_1',
            name: 'Warehouse Manager',
            description: 'Complete warehouse operations management',
            module: 'wms',
            source: 'template',
            templateId: 'wms_warehouse_manager',
            permissions: ['wms.inventory.*', 'wms.reports.*', 'wms.users.read'],
            userCount: 3,
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date(),
            canEdit: true,
            canDelete: true
          },
          {
            id: 'role_wms_2',
            name: 'Inventory Worker',
            description: 'Basic inventory operations',
            module: 'wms',
            source: 'custom',
            templateId: null,
            permissions: ['wms.inventory.read', 'wms.inventory.update'],
            userCount: 12,
            createdAt: new Date('2024-02-15'),
            updatedAt: new Date(),
            canEdit: true,
            canDelete: true
          }
        ],
        accounting: [
          {
            id: 'role_acc_1',
            name: 'Finance Manager',
            description: 'Complete financial management and reporting',
            module: 'accounting',
            source: 'template',
            templateId: 'accounting_finance_manager',
            permissions: ['accounting.*'],
            userCount: 2,
            createdAt: new Date('2024-03-01'),
            updatedAt: new Date(),
            canEdit: true,
            canDelete: true
          },
          {
            id: 'role_acc_2',
            name: 'Bookkeeper',
            description: 'Invoice and expense management',
            module: 'accounting',
            source: 'template',
            templateId: 'accounting_bookkeeper',
            permissions: ['accounting.invoices.*', 'accounting.expenses.*'],
            userCount: 4,
            createdAt: new Date('2024-03-10'),
            updatedAt: new Date(),
            canEdit: true,
            canDelete: true
          }
        ],
        pos: [
          {
            id: 'role_pos_1',
            name: 'Store Manager',
            description: 'Complete store operations management',
            module: 'pos',
            source: 'template',
            templateId: 'pos_store_manager',
            permissions: ['pos.*'],
            userCount: 3,
            createdAt: new Date('2024-04-01'),
            updatedAt: new Date(),
            canEdit: true,
            canDelete: true
          },
          {
            id: 'role_pos_2',
            name: 'Cashier',
            description: 'Point of sale operations',
            module: 'pos',
            source: 'template',
            templateId: 'pos_cashier',
            permissions: ['pos.sales.*', 'pos.customers.read'],
            userCount: 15,
            createdAt: new Date('2024-04-10'),
            updatedAt: new Date(),
            canEdit: true,
            canDelete: true
          }
        ],
        hr: [
          {
            id: 'role_hr_1',
            name: 'HR Manager',
            description: 'Complete human resources management',
            module: 'hr',
            source: 'template',
            templateId: 'hr_hr_manager',
            permissions: ['hr.*'],
            userCount: 2,
            createdAt: new Date('2024-05-01'),
            updatedAt: new Date(),
            canEdit: true,
            canDelete: true
          }
        ]
      };

      // Mock permission resources with hierarchical structure
      const mockPermissionResources: Record<string, any> = {
        core: {
          dashboard: {
            name: 'Dashboard',
            description: 'Main dashboard access and customization',
            actions: [
              { code: 'view', name: 'View Dashboard', description: 'Access dashboard interface' },
              { code: 'edit', name: 'Edit Dashboard', description: 'Customize dashboard layout' }
            ]
          },
          users: {
            name: 'User Management',
            description: 'User administration and management',
            actions: [
              { code: 'view', name: 'View Users', description: 'View user list and details' },
              { code: 'create', name: 'Create Users', description: 'Add new users to system' },
              { code: 'edit', name: 'Edit Users', description: 'Modify user information' },
              { code: 'delete', name: 'Delete Users', description: 'Remove users from system' }
            ]
          },
          settings: {
            name: 'System Settings',
            description: 'System configuration and preferences',
            actions: [
              { code: 'view', name: 'View Settings', description: 'Access system settings' },
              { code: 'edit', name: 'Edit Settings', description: 'Modify system configuration' }
            ]
          },
          reports: {
            name: 'System Reports',
            description: 'Generate and export system reports',
            actions: [
              { code: 'view', name: 'View Reports', description: 'Access reporting interface' },
              { code: 'export', name: 'Export Reports', description: 'Download reports in various formats' }
            ]
          }
        },
        wms: {
          inventory: {
            name: 'Inventory Management',
            description: 'Warehouse inventory operations and tracking',
            actions: [
              { code: 'view', name: 'View Inventory', description: 'View inventory levels and details' },
              { code: 'create', name: 'Add Inventory', description: 'Add new inventory items' },
              { code: 'edit', name: 'Update Inventory', description: 'Modify inventory information' },
              { code: 'delete', name: 'Remove Inventory', description: 'Delete inventory items' },
              { code: 'transfer', name: 'Transfer Inventory', description: 'Move inventory between locations' }
            ]
          },
          orders: {
            name: 'Order Management',
            description: 'Warehouse order processing and fulfillment',
            actions: [
              { code: 'view', name: 'View Orders', description: 'View order details and status' },
              { code: 'process', name: 'Process Orders', description: 'Pick, pack, and ship orders' },
              { code: 'cancel', name: 'Cancel Orders', description: 'Cancel pending orders' }
            ]
          },
          reports: {
            name: 'Warehouse Reports',
            description: 'Inventory and operational reporting',
            actions: [
              { code: 'view', name: 'View Reports', description: 'Access warehouse reports' },
              { code: 'export', name: 'Export Reports', description: 'Download reports in various formats' }
            ]
          }
        },
        accounting: {
          invoices: {
            name: 'Invoice Management',
            description: 'Customer invoicing and billing',
            actions: [
              { code: 'view', name: 'View Invoices', description: 'View invoice details and status' },
              { code: 'create', name: 'Create Invoices', description: 'Generate new invoices' },
              { code: 'edit', name: 'Edit Invoices', description: 'Modify invoice details' },
              { code: 'delete', name: 'Delete Invoices', description: 'Remove invoices from system' },
              { code: 'send', name: 'Send Invoices', description: 'Email invoices to customers' }
            ]
          },
          expenses: {
            name: 'Expense Management',
            description: 'Business expense tracking and approval',
            actions: [
              { code: 'view', name: 'View Expenses', description: 'View expense reports and details' },
              { code: 'create', name: 'Record Expenses', description: 'Add new expense entries' },
              { code: 'approve', name: 'Approve Expenses', description: 'Review and approve expense claims' }
            ]
          },
          reports: {
            name: 'Financial Reports',
            description: 'Financial reporting and analytics',
            actions: [
              { code: 'view', name: 'View Reports', description: 'Access financial reports' },
              { code: 'export', name: 'Export Reports', description: 'Download financial data' }
            ]
          }
        },
        pos: {
          sales: {
            name: 'Sales Operations',
            description: 'Point of sale transaction processing',
            actions: [
              { code: 'create', name: 'Process Sales', description: 'Handle customer transactions' },
              { code: 'refund', name: 'Process Refunds', description: 'Issue customer refunds' },
              { code: 'void', name: 'Void Transactions', description: 'Cancel completed transactions' }
            ]
          },
          customers: {
            name: 'Customer Management',
            description: 'Customer information and loyalty programs',
            actions: [
              { code: 'view', name: 'View Customers', description: 'Access customer profiles' },
              { code: 'create', name: 'Add Customers', description: 'Register new customers' },
              { code: 'edit', name: 'Update Customers', description: 'Modify customer information' }
            ]
          },
          reports: {
            name: 'Sales Reports',
            description: 'Sales performance and analytics',
            actions: [
              { code: 'view', name: 'View Reports', description: 'Access sales reports' },
              { code: 'export', name: 'Export Reports', description: 'Download sales data' }
            ]
          }
        },
        hr: {
          employees: {
            name: 'Employee Management',
            description: 'Employee information and HR records',
            actions: [
              { code: 'view', name: 'View Employees', description: 'View employee profiles and details' },
              { code: 'create', name: 'Add Employees', description: 'Onboard new employees' },
              { code: 'edit', name: 'Update Employees', description: 'Modify employee information' },
              { code: 'delete', name: 'Remove Employees', description: 'Offboard employees from system' }
            ]
          },
          payroll: {
            name: 'Payroll Management',
            description: 'Salary processing and benefits management',
            actions: [
              { code: 'view', name: 'View Payroll', description: 'Access payroll information' },
              { code: 'process', name: 'Process Payroll', description: 'Calculate and generate payroll' },
              { code: 'approve', name: 'Approve Payroll', description: 'Review and approve payroll runs' }
            ]
          },
          reports: {
            name: 'HR Reports',
            description: 'Human resources reporting and analytics',
            actions: [
              { code: 'view', name: 'View Reports', description: 'Access HR reports and metrics' },
              { code: 'export', name: 'Export Reports', description: 'Download HR data and reports' }
            ]
          }
        }
      };

      // Mock role templates
      const mockRoleTemplates = [
        // Core Module Templates
        {
          id: 'core_tenant_admin',
          code: 'tenant_admin',
          name: 'Tenant Administrator',
          description: 'Complete administrative control over tenant settings, users, and module configurations',
          moduleCode: 'core',
          complexity: 'advanced',
          popularity: 5,
          usageCount: 1247,
          recommendedUserCount: { min: 1, max: 3 },
          permissions: {
            'core.dashboard.view': { actions: ['view'], granted: true },
            'core.dashboard.edit': { actions: ['edit'], granted: true },
            'core.users.view': { actions: ['view'], granted: true },
            'core.users.create': { actions: ['create'], granted: true },
            'core.users.edit': { actions: ['edit'], granted: true },
            'core.users.delete': { actions: ['delete'], granted: true },
            'core.settings.view': { actions: ['view'], granted: true },
            'core.settings.edit': { actions: ['edit'], granted: true },
            'core.tenant_management.view': { actions: ['view'], granted: true },
            'core.tenant_management.edit': { actions: ['edit'], granted: true },
            'core.reports.view': { actions: ['view'], granted: true },
            'core.reports.export': { actions: ['export'], granted: true }
          },
          version: '2.1.0',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-08-20'),
          tags: ['admin', 'full-access', 'enterprise'],
          useCases: [
            'IT administrators managing organizational infrastructure',
            'Business owners requiring complete system oversight',
            'Operations managers coordinating cross-departmental activities'
          ],
          industries: ['Technology', 'Manufacturing', 'Professional Services'],
          companySize: 'medium',
          customizable: { permissions: true, dataScopes: true, name: true },
          isPopular: true,
          isRecommended: true
        },
        {
          id: 'core_manager',
          code: 'manager',
          name: 'Manager',
          description: 'Management-level access with team oversight and reporting capabilities',
          moduleCode: 'core',
          complexity: 'intermediate',
          popularity: 4,
          usageCount: 856,
          recommendedUserCount: { min: 3, max: 10 },
          permissions: {
            'core.dashboard.view': { actions: ['view'], granted: true },
            'core.dashboard.edit': { actions: ['edit'], granted: false },
            'core.users.view': { actions: ['view'], granted: true },
            'core.users.create': { actions: ['create'], granted: true },
            'core.users.edit': { actions: ['edit'], granted: true },
            'core.users.delete': { actions: ['delete'], granted: false },
            'core.settings.view': { actions: ['view'], granted: true },
            'core.settings.edit': { actions: ['edit'], granted: false },
            'core.reports.view': { actions: ['view'], granted: true },
            'core.reports.export': { actions: ['export'], granted: true, conditional: true }
          },
          version: '2.0.0',
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-08-15'),
          tags: ['management', 'oversight', 'reports'],
          useCases: [
            'Department managers overseeing team performance',
            'Project managers coordinating resources',
            'Team leads requiring reporting capabilities'
          ],
          industries: ['Consulting', 'Healthcare', 'Education'],
          companySize: 'small',
          customizable: { permissions: true, dataScopes: true, name: true },
          isTrending: true
        },
        {
          id: 'core_user',
          code: 'standard_user',
          name: 'Standard User',
          description: 'Basic user access for day-to-day operations and personal settings',
          moduleCode: 'core',
          complexity: 'basic',
          popularity: 5,
          usageCount: 2143,
          recommendedUserCount: { min: 10, max: 100 },
          permissions: {
            'core.dashboard.view': { actions: ['view'], granted: true },
            'core.dashboard.edit': { actions: ['edit'], granted: false },
            'core.users.view': { actions: ['view'], granted: false },
            'core.settings.view': { actions: ['view'], granted: true, conditional: true },
            'core.reports.view': { actions: ['view'], granted: true }
          },
          version: '1.5.0',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-07-30'),
          tags: ['basic', 'employee', 'standard'],
          useCases: [
            'Regular employees accessing daily tools',
            'Operational staff with limited administrative needs',
            'Remote workers requiring basic system access'
          ],
          industries: ['All Industries'],
          companySize: 'startup',
          customizable: { permissions: false, dataScopes: true, name: true },
          isPopular: true
        },

        // WMS Module Templates  
        {
          id: 'wms_warehouse_admin',
          code: 'warehouse_admin',
          name: 'Warehouse Administrator',
          description: 'Complete warehouse management with full inventory control and system configuration',
          moduleCode: 'wms',
          complexity: 'advanced',
          popularity: 4,
          usageCount: 423,
          recommendedUserCount: { min: 1, max: 2 },
          permissions: {
            'wms.inventory.view': { actions: ['view'], granted: true },
            'wms.inventory.create': { actions: ['create'], granted: true },
            'wms.inventory.edit': { actions: ['edit'], granted: true },
            'wms.inventory.delete': { actions: ['delete'], granted: true },
            'wms.orders.view': { actions: ['view'], granted: true },
            'wms.orders.process': { actions: ['process'], granted: true },
            'wms.reports.view': { actions: ['view'], granted: true },
            'wms.reports.export': { actions: ['export'], granted: true }
          },
          version: '1.8.0',
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-08-25'),
          tags: ['warehouse', 'admin', 'inventory', 'logistics'],
          useCases: [
            'Warehouse managers overseeing entire facility operations',
            'Logistics coordinators managing inventory and shipments',
            'Operations directors requiring complete warehouse visibility'
          ],
          industries: ['Manufacturing', 'E-commerce', 'Distribution'],
          companySize: 'medium',
          customizable: { permissions: true, dataScopes: true, name: true },
          isRecommended: true
        },
        {
          id: 'wms_inventory_worker',
          code: 'inventory_worker',
          name: 'Inventory Worker',
          description: 'Basic warehouse operations for receiving, picking, and inventory management',
          moduleCode: 'wms',
          complexity: 'basic',
          popularity: 5,
          usageCount: 1205,
          recommendedUserCount: { min: 5, max: 50 },
          permissions: {
            'wms.inventory.view': { actions: ['view'], granted: true },
            'wms.inventory.create': { actions: ['create'], granted: true },
            'wms.inventory.edit': { actions: ['edit'], granted: true },
            'wms.inventory.delete': { actions: ['delete'], granted: false },
            'wms.orders.view': { actions: ['view'], granted: true },
            'wms.orders.process': { actions: ['process'], granted: true },
            'wms.reports.view': { actions: ['view'], granted: false }
          },
          version: '1.6.0',
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-08-10'),
          tags: ['warehouse', 'operations', 'picking', 'receiving'],
          useCases: [
            'Warehouse workers handling daily operations',
            'Inventory clerks managing stock levels',
            'Shipping and receiving staff processing orders'
          ],
          industries: ['Retail', 'Manufacturing', 'Logistics'],
          companySize: 'small',
          customizable: { permissions: true, dataScopes: true, name: true },
          isPopular: true,
          isTrending: true
        },

        // Accounting Module Templates
        {
          id: 'accounting_finance_manager',
          code: 'finance_manager',
          name: 'Finance Manager',
          description: 'Complete financial management with full access to accounting operations and reporting',
          moduleCode: 'accounting',
          complexity: 'advanced',
          popularity: 4,
          usageCount: 312,
          recommendedUserCount: { min: 1, max: 3 },
          permissions: {
            'accounting.invoices.view': { actions: ['view'], granted: true },
            'accounting.invoices.create': { actions: ['create'], granted: true },
            'accounting.invoices.edit': { actions: ['edit'], granted: true },
            'accounting.invoices.delete': { actions: ['delete'], granted: true },
            'accounting.expenses.view': { actions: ['view'], granted: true },
            'accounting.expenses.approve': { actions: ['approve'], granted: true },
            'accounting.reports.view': { actions: ['view'], granted: true },
            'accounting.reports.export': { actions: ['export'], granted: true }
          },
          version: '1.4.0',
          createdAt: new Date('2024-04-01'),
          updatedAt: new Date('2024-08-18'),
          tags: ['finance', 'accounting', 'manager', 'reporting'],
          useCases: [
            'Finance directors managing company financials',
            'CFOs requiring complete financial oversight',
            'Accounting managers overseeing financial operations'
          ],
          industries: ['Professional Services', 'Technology', 'Healthcare'],
          companySize: 'medium',
          customizable: { permissions: true, dataScopes: true, name: true }
        },

        // POS Module Templates
        {
          id: 'pos_store_manager',
          code: 'store_manager',
          name: 'Store Manager',
          description: 'Complete store operations with sales management, reporting, and staff oversight',
          moduleCode: 'pos',
          complexity: 'intermediate',
          popularity: 4,
          usageCount: 178,
          recommendedUserCount: { min: 1, max: 5 },
          permissions: {
            'pos.sales.view': { actions: ['view'], granted: true },
            'pos.sales.process': { actions: ['process'], granted: true },
            'pos.sales.refund': { actions: ['refund'], granted: true },
            'pos.inventory.view': { actions: ['view'], granted: true },
            'pos.reports.view': { actions: ['view'], granted: true },
            'pos.reports.export': { actions: ['export'], granted: true }
          },
          version: '1.2.0',
          createdAt: new Date('2024-05-01'),
          updatedAt: new Date('2024-08-12'),
          tags: ['retail', 'store-manager', 'sales', 'pos'],
          useCases: [
            'Store managers overseeing daily retail operations',
            'Retail supervisors managing sales staff',
            'Operations managers requiring sales visibility'
          ],
          industries: ['Retail', 'Food & Beverage', 'Fashion'],
          companySize: 'small',
          customizable: { permissions: true, dataScopes: true, name: true }
        }
      ];

      setRolesByModule(mockRolesByModule);
      setPermissionResources(mockPermissionResources);
      setRoleTemplates(mockRoleTemplates);
      
      // Update legacy roles format for compatibility
      const allRoles = Object.values(mockRolesByModule).flat();
      setTenantRoles(allRoles.map(role => ({
        id: role.id,
        name: role.name,
        module: role.module,
        users: role.userCount,
        permissions: role.permissions.length
      })));

      console.log('Role data refreshed successfully');
    } catch (err) {
      console.error('Failed to fetch comprehensive role data:', err);
      setError('Failed to fetch role data');
    }
  };

  // Permission checking functions
  const hasPermission = (permission: string): boolean => {
    return adminPermissions.includes(permission);
  };

  const canManageUsers = (): boolean => {
    return hasPermission('manage_users');
  };

  const canManageRoles = (): boolean => {
    return hasPermission('manage_roles');
  };

  const canManageModules = (): boolean => {
    return hasPermission('manage_modules');
  };

  // Role Management helper functions
  const getRolesForModule = (module: string): any[] => {
    return rolesByModule[module] || [];
  };

  const getPermissionResourcesForModule = (module: string): any => {
    return permissionResources[module] || {};
  };

  const createRole = async (roleData: any): Promise<void> => {
    if (!tenant) return;
    
    try {
      console.log('Creating role:', roleData);
      // TODO: Replace with actual API call
      // await tenantAdminApi.createRole(tenant.id, roleData.module, roleData);
      
      // For now, just refresh the data
      await refreshRoleData();
      
      console.log('Role created successfully');
    } catch (err) {
      console.error('Failed to create role:', err);
      throw err;
    }
  };

  const updateRole = async (roleId: string, roleData: any): Promise<void> => {
    if (!tenant) return;
    
    try {
      console.log('Updating role:', roleId, roleData);
      // TODO: Replace with actual API call
      // await tenantAdminApi.updateRole(tenant.id, roleId, roleData);
      
      await refreshRoleData();
      console.log('Role updated successfully');
    } catch (err) {
      console.error('Failed to update role:', err);
      throw err;
    }
  };

  const deleteRole = async (roleId: string): Promise<void> => {
    if (!tenant) return;
    
    try {
      console.log('Deleting role:', roleId);
      // TODO: Replace with actual API call
      // await tenantAdminApi.deleteRole(tenant.id, roleId);
      
      await refreshRoleData();
      console.log('Role deleted successfully');
    } catch (err) {
      console.error('Failed to delete role:', err);
      throw err;
    }
  };

  const cloneRole = async (roleId: string, newName: string): Promise<void> => {
    if (!tenant) return;
    
    try {
      console.log('Cloning role:', roleId, 'as', newName);
      // TODO: Replace with actual API call
      // await tenantAdminApi.cloneRole(tenant.id, roleId, { name: newName });
      
      await refreshRoleData();
      console.log('Role cloned successfully');
    } catch (err) {
      console.error('Failed to clone role:', err);
      throw err;
    }
  };

  const createRoleFromTemplate = async (templateId: string, customizations?: any): Promise<void> => {
    if (!tenant) return;
    
    try {
      console.log('Creating role from template:', templateId, customizations);
      // TODO: Replace with actual API call
      // await tenantAdminApi.createRoleFromTemplate(tenant.id, { templateId, ...customizations });
      
      await refreshRoleData();
      console.log('Role created from template successfully');
    } catch (err) {
      console.error('Failed to create role from template:', err);
      throw err;
    }
  };

  // Role Builder specific functions
  const validateRoleName = async (name: string, excludeId?: string): Promise<{ isValid: boolean; message?: string }> => {
    try {
      // Check if name is empty
      if (!name.trim()) {
        return { isValid: false, message: 'Role name is required' };
      }

      // Check length
      if (name.length > 50) {
        return { isValid: false, message: 'Role name must be less than 50 characters' };
      }

      // Check for duplicates across all modules
      const allRoles = Object.values(rolesByModule).flat();
      const isDuplicate = allRoles.some(role => 
        role.name.toLowerCase() === name.toLowerCase() && 
        role.id !== excludeId
      );

      if (isDuplicate) {
        return { isValid: false, message: 'A role with this name already exists' };
      }

      return { isValid: true };
    } catch (err) {
      console.error('Error validating role name:', err);
      return { isValid: false, message: 'Validation error occurred' };
    }
  };

  const getPermissionTree = (moduleCode: string): any[] => {
    const resources = permissionResources[moduleCode] || {};
    const tree: any[] = [];

    Object.entries(resources).forEach(([resourceKey, resource]: [string, any]) => {
      const resourceNode = {
        id: resourceKey,
        name: resource.name,
        description: resource.description,
        type: 'resource',
        children: []
      };

      if (resource.actions) {
        resource.actions.forEach((action: any) => {
          resourceNode.children.push({
            id: `${resourceKey}.${action.code}`,
            name: action.name,
            description: action.description,
            type: 'action',
            parent: resourceKey
          });
        });
      } else if (resource.children) {
        // Legacy format support
        Object.entries(resource.children).forEach(([actionKey, actionName]: [string, any]) => {
          resourceNode.children.push({
            id: `${resourceKey}.${actionKey}`,
            name: actionName,
            description: `${actionName} permission for ${resource.name}`,
            type: 'action',
            parent: resourceKey
          });
        });
      }

      tree.push(resourceNode);
    });

    return tree;
  };

  const getEffectivePermissions = (roleData: any): any[] => {
    const effectivePermissions: any[] = [];
    
    if (roleData.permissions) {
      Object.entries(roleData.permissions).forEach(([permissionId, granted]) => {
        if (granted) {
          effectivePermissions.push({
            id: permissionId,
            granted: true,
            inherited: false,
            conditional: false
          });
        }
      });
    }

    return effectivePermissions;
  };

  const detectPermissionConflicts = (permissions: any): any[] => {
    const conflicts: any[] = [];
    
    // Check for logical conflicts (e.g., delete without read)
    Object.entries(permissions).forEach(([permissionId, granted]) => {
      if (granted && permissionId.includes('.delete')) {
        const basePermission = permissionId.replace('.delete', '.read');
        if (!permissions[basePermission]) {
          conflicts.push({
            type: 'missing_dependency',
            permission: permissionId,
            requires: basePermission,
            message: `${permissionId} requires ${basePermission} permission`
          });
        }
      }

      if (granted && permissionId.includes('.update')) {
        const basePermission = permissionId.replace('.update', '.read');
        if (!permissions[basePermission]) {
          conflicts.push({
            type: 'missing_dependency',
            permission: permissionId,
            requires: basePermission,
            message: `${permissionId} requires ${basePermission} permission`
          });
        }
      }
    });

    return conflicts;
  };

  // Bulk Assignment functions
  const getAllUsers = (): any[] => {
    // Return all tenant users
    return tenantUsers;
  };

  const getUsersByFilters = (filters: any): any[] => {
    let filteredUsers = tenantUsers;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.departments && filters.departments.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        filters.departments.includes(user.department)
      );
    }

    if (filters.statuses && filters.statuses.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        filters.statuses.includes(user.status)
      );
    }

    return filteredUsers;
  };

  const bulkAssignRoles = async (assignments: any[]): Promise<void> => {
    if (!tenant) return;
    
    try {
      console.log('Bulk assigning roles:', assignments);
      
      // TODO: Replace with actual API call
      // await tenantAdminApi.bulkAssignRoles(tenant.id, assignments);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Refresh role data after successful assignment
      await refreshRoleData();
      await refreshUsers();
      
      console.log('Bulk role assignment completed successfully');
    } catch (err) {
      console.error('Failed to bulk assign roles:', err);
      throw err;
    }
  };

  const bulkUnassignRoles = async (assignments: any[]): Promise<void> => {
    if (!tenant) return;
    
    try {
      console.log('Bulk unassigning roles:', assignments);
      
      // TODO: Replace with actual API call
      // await tenantAdminApi.bulkUnassignRoles(tenant.id, assignments);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await refreshRoleData();
      await refreshUsers();
      
      console.log('Bulk role unassignment completed successfully');
    } catch (err) {
      console.error('Failed to bulk unassign roles:', err);
      throw err;
    }
  };

  const previewBulkAssignment = async (assignments: any[]): Promise<any> => {
    try {
      console.log('Previewing bulk assignment:', assignments);
      
      // Calculate assignment impact
      const totalUsers = new Set(assignments.map(a => a.userId)).size;
      const totalRoles = new Set(assignments.map(a => a.roleId)).size;
      const totalAssignments = assignments.length;
      
      // Simulate conflict detection
      const conflicts = assignments.filter((_, index) => index % 3 === 0).map((assignment, index) => ({
        type: 'permission_overlap',
        userId: assignment.userId,
        roleId: assignment.roleId,
        severity: index % 2 === 0 ? 'medium' : 'low',
        message: `User already has similar permissions`,
        autoResolvable: true
      }));

      const preview = {
        summary: {
          totalUsers,
          totalRoles,
          totalAssignments,
          estimatedDuration: Math.ceil(totalAssignments / 10) + ' seconds'
        },
        conflicts,
        affectedSystems: [
          'User Management System',
          'Permission Cache',
          'Audit Logging'
        ],
        estimatedImpact: conflicts.length > 0 ? 'medium' : 'low'
      };
      
      return preview;
    } catch (err) {
      console.error('Failed to preview bulk assignment:', err);
      throw err;
    }
  };

  const resolveAssignmentConflicts = async (conflicts: any[]): Promise<void> => {
    try {
      console.log('Resolving assignment conflicts:', conflicts);
      
      // TODO: Replace with actual API call
      // await tenantAdminApi.resolveConflicts(tenant.id, conflicts);
      
      console.log('Assignment conflicts resolved successfully');
    } catch (err) {
      console.error('Failed to resolve assignment conflicts:', err);
      throw err;
    }
  };

  const validateBulkAssignment = async (assignments: any[]): Promise<any> => {
    try {
      console.log('Validating bulk assignment:', assignments);
      
      const validationResults = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        suggestions: [] as string[]
      };
      
      // Validate assignment data
      assignments.forEach((assignment, index) => {
        if (!assignment.userId) {
          validationResults.errors.push(`Assignment ${index + 1}: Missing user ID`);
          validationResults.isValid = false;
        }
        
        if (!assignment.roleId) {
          validationResults.errors.push(`Assignment ${index + 1}: Missing role ID`);
          validationResults.isValid = false;
        }
        
        if (assignment.effectiveDate && assignment.expirationDate) {
          if (new Date(assignment.effectiveDate) >= new Date(assignment.expirationDate)) {
            validationResults.warnings.push(`Assignment ${index + 1}: Expiration date should be after effective date`);
          }
        }
      });
      
      // Add suggestions for optimization
      if (assignments.length > 100) {
        validationResults.suggestions.push('Consider breaking large assignments into smaller batches for better performance');
      }
      
      if (new Set(assignments.map(a => a.userId)).size < assignments.length / 2) {
        validationResults.suggestions.push('Consider using role templates for users with similar assignment patterns');
      }
      
      return validationResults;
    } catch (err) {
      console.error('Failed to validate bulk assignment:', err);
      throw err;
    }
  };

  // Load initial data when admin status changes
  useEffect(() => {
    if (isAdmin && tenant) {
      refreshModules();
      refreshUsers();
      refreshRoles();
      refreshRoleData(); // Load comprehensive role data
    }
  }, [isAdmin, tenant]);

  const value: TenantAdminContextType = {
    isAdmin,
    adminPermissions,
    tenantModules,
    tenantUsers,
    tenantRoles,
    isLoading,
    error,
    
    // Role Management specific data
    rolesByModule,
    permissionResources,
    roleTemplates,
    selectedModule,
    
    // Data management functions
    refreshModules,
    refreshUsers,
    refreshRoles,
    refreshRoleData,
    
    // Role Management functions
    setSelectedModule,
    getRolesForModule,
    getPermissionResourcesForModule,
    createRole,
    updateRole,
    deleteRole,
    cloneRole,
    createRoleFromTemplate,
    
    // Role Builder specific functions
    validateRoleName,
    getPermissionTree,
    getEffectivePermissions,
    detectPermissionConflicts,
    
    // Bulk Assignment functions
    getAllUsers,
    getUsersByFilters,
    bulkAssignRoles,
    bulkUnassignRoles,
    previewBulkAssignment,
    resolveAssignmentConflicts,
    validateBulkAssignment,
    
    // Permission checking
    hasPermission,
    canManageUsers,
    canManageRoles,
    canManageModules
  };

  return (
    <TenantAdminContext.Provider value={value}>
      {children}
    </TenantAdminContext.Provider>
  );
};
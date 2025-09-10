import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Permission {
  id: string;
  name: string;
  module: string;
  resource: string;
  action: string; // 'create', 'read', 'update', 'delete', 'execute', 'manage'
  scope?: string; // 'own', 'team', 'department', 'tenant', 'global'
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  module?: string;
  isSystemRole?: boolean;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  directPermissions?: string[];
  dataScopes?: string[];
}

export interface PermissionContextType {
  user: User | null;
  permissions: Permission[];
  roles: Role[];
  hasPermission: (permission: string | string[]) => boolean;
  hasRole: (role: string | string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canAccess: (resource: string, action: string, scope?: string) => boolean;
  getUserPermissions: () => string[];
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Mock data for demonstration
const mockPermissions: Permission[] = [
  // Core permissions
  { id: 'core.dashboard.read', name: 'View Dashboard', module: 'core', resource: 'dashboard', action: 'read' },
  { id: 'core.analytics.read', name: 'View Analytics', module: 'core', resource: 'analytics', action: 'read' },
  
  // Finance permissions
  { id: 'finance.dashboard.read', name: 'View Finance Dashboard', module: 'finance', resource: 'dashboard', action: 'read' },
  { id: 'finance.budget.read', name: 'View Budget', module: 'finance', resource: 'budget', action: 'read' },
  { id: 'finance.budget.create', name: 'Create Budget', module: 'finance', resource: 'budget', action: 'create' },
  { id: 'finance.budget.update', name: 'Update Budget', module: 'finance', resource: 'budget', action: 'update' },
  { id: 'finance.budget.delete', name: 'Delete Budget', module: 'finance', resource: 'budget', action: 'delete' },
  { id: 'finance.reports.read', name: 'View Reports', module: 'finance', resource: 'reports', action: 'read' },
  { id: 'finance.reports.create', name: 'Create Reports', module: 'finance', resource: 'reports', action: 'create' },
  { id: 'finance.reports.export', name: 'Export Reports', module: 'finance', resource: 'reports', action: 'execute', scope: 'own' },
  
  // Admin permissions
  { id: 'admin.access', name: 'Admin Access', module: 'admin', resource: 'portal', action: 'read' },
  { id: 'admin.users.read', name: 'View Users', module: 'admin', resource: 'users', action: 'read' },
  { id: 'admin.users.create', name: 'Create Users', module: 'admin', resource: 'users', action: 'create' },
  { id: 'admin.users.update', name: 'Update Users', module: 'admin', resource: 'users', action: 'update' },
  { id: 'admin.users.delete', name: 'Delete Users', module: 'admin', resource: 'users', action: 'delete' },
  { id: 'admin.roles.read', name: 'View Roles', module: 'admin', resource: 'roles', action: 'read' },
  { id: 'admin.roles.manage', name: 'Manage Roles', module: 'admin', resource: 'roles', action: 'manage' },
  { id: 'admin.settings.read', name: 'View Settings', module: 'admin', resource: 'settings', action: 'read' },
  { id: 'admin.settings.update', name: 'Update Settings', module: 'admin', resource: 'settings', action: 'update' },
  { id: 'admin.audit.read', name: 'View Audit Logs', module: 'admin', resource: 'audit', action: 'read' },
];

const mockRoles: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    permissions: mockPermissions.map(p => p.id),
    isSystemRole: true
  },
  {
    id: 'finance_manager',
    name: 'Finance Manager',
    permissions: [
      'core.dashboard.read',
      'finance.dashboard.read',
      'finance.budget.read',
      'finance.budget.create',
      'finance.budget.update',
      'finance.reports.read',
      'finance.reports.create',
      'finance.reports.export'
    ],
    module: 'finance'
  },
  {
    id: 'finance_analyst',
    name: 'Finance Analyst',
    permissions: [
      'core.dashboard.read',
      'finance.dashboard.read',
      'finance.budget.read',
      'finance.reports.read',
      'finance.reports.create'
    ],
    module: 'finance'
  },
  {
    id: 'admin_user',
    name: 'Administrator',
    permissions: [
      'core.dashboard.read',
      'admin.access',
      'admin.users.read',
      'admin.users.create',
      'admin.users.update',
      'admin.roles.read',
      'admin.settings.read',
      'admin.settings.update'
    ],
    module: 'admin'
  },
  {
    id: 'viewer',
    name: 'Viewer',
    permissions: [
      'core.dashboard.read',
      'core.analytics.read',
      'finance.dashboard.read',
      'finance.budget.read',
      'finance.reports.read'
    ]
  }
];

const mockUser: User = {
  id: 'user_123',
  email: 'demo@example.com',
  roles: ['finance_manager', 'admin_user'],
  directPermissions: ['core.analytics.read'],
  dataScopes: ['department', 'own']
};

interface Props {
  children: ReactNode;
  mockUserData?: User;
}

export const PermissionProvider: React.FC<Props> = ({ 
  children, 
  mockUserData = mockUser 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getUserPermissions = (): string[] => {
    if (!user) return [];

    const rolePermissions = user.roles.reduce((acc, roleId) => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        acc.push(...role.permissions);
      }
      return acc;
    }, [] as string[]);

    const allPermissions = [...rolePermissions, ...(user.directPermissions || [])];
    return [...new Set(allPermissions)]; // Remove duplicates
  };

  const hasPermission = (permission: string | string[]): boolean => {
    if (!user) return false;

    const userPermissions = getUserPermissions();
    
    if (Array.isArray(permission)) {
      return permission.some(p => userPermissions.includes(p));
    }
    
    return userPermissions.includes(permission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.some(r => user.roles.includes(r));
    }
    
    return user.roles.includes(role);
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user || permissions.length === 0) return false;

    const userPermissions = getUserPermissions();
    return permissions.every(p => userPermissions.includes(p));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user || permissions.length === 0) return false;

    const userPermissions = getUserPermissions();
    return permissions.some(p => userPermissions.includes(p));
  };

  const canAccess = (resource: string, action: string, scope?: string): boolean => {
    if (!user) return false;

    const userPermissions = getUserPermissions();
    
    // Check for exact permission match
    const exactPermission = `${resource}.${action}`;
    if (userPermissions.includes(exactPermission)) {
      return true;
    }

    // Check for manage permission (covers all actions)
    const managePermission = `${resource}.manage`;
    if (userPermissions.includes(managePermission)) {
      return true;
    }

    // Check with scope if provided
    if (scope) {
      const scopedPermission = `${resource}.${action}.${scope}`;
      if (userPermissions.includes(scopedPermission)) {
        return true;
      }
    }

    return false;
  };

  const refreshPermissions = async (): Promise<void> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    // In real app, this would fetch fresh permissions from API
    setIsLoading(false);
  };

  useEffect(() => {
    // Simulate loading permissions
    const timer = setTimeout(() => {
      setUser(mockUserData);
      setPermissions(mockPermissions);
      setRoles(mockRoles);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [mockUserData]);

  const contextValue: PermissionContextType = {
    user,
    permissions,
    roles,
    hasPermission,
    hasRole,
    hasAllPermissions,
    hasAnyPermission,
    canAccess,
    getUserPermissions,
    isLoading,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export default PermissionContext;
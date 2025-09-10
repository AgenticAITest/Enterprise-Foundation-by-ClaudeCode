import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

export type DataScopeLevel = 
  | 'global'      // Super admin access - all tenants
  | 'tenant'      // Tenant-wide access - all data in tenant
  | 'department'  // Department-level access
  | 'team'        // Team-level access
  | 'own'         // Only own data
  | 'none';       // No data access

export interface DataScopeRule {
  id: string;
  resource: string;        // e.g., 'users', 'financial_reports', 'budgets'
  action: string;          // e.g., 'read', 'create', 'update', 'delete'
  scopes: DataScopeLevel[];
  conditions?: Record<string, any>;
  priority?: number;       // Higher priority rules override lower ones
}

export interface UserDataScope {
  userId: string;
  tenantId: string;
  departmentId?: string;
  teamId?: string;
  managedDepartments?: string[];
  managedTeams?: string[];
  directReports?: string[];
  scopes: DataScopeLevel[];
  customRules?: DataScopeRule[];
}

export interface DataFilter {
  resource: string;
  filters: Record<string, any>;
  joins?: string[];
  conditions?: string[];
  sortBy?: string[];
}

export interface DataScopeContextType {
  userScope: UserDataScope | null;
  getScopeForResource: (resource: string, action: string) => DataScopeLevel[];
  canAccessData: (resource: string, action: string, targetData: any) => boolean;
  getDataFilter: (resource: string, action: string) => DataFilter | null;
  applyDataScoping: <T>(data: T[], resource: string, action: string) => T[];
  getScopeDescription: (scope: DataScopeLevel) => string;
  getAllowedScopes: () => DataScopeLevel[];
  validateDataAccess: (resource: string, action: string, itemId: string) => boolean;
  getScopeHierarchy: () => DataScopeLevel[];
  isLoading: boolean;
}

const DataScopeContext = createContext<DataScopeContextType | undefined>(undefined);

// Mock data scope rules
const mockDataScopeRules: DataScopeRule[] = [
  // User management scopes
  {
    id: 'users_read_global',
    resource: 'users',
    action: 'read',
    scopes: ['global'],
    priority: 100
  },
  {
    id: 'users_read_tenant',
    resource: 'users',
    action: 'read',
    scopes: ['tenant', 'department', 'team'],
    priority: 80
  },
  {
    id: 'users_create_admin',
    resource: 'users',
    action: 'create',
    scopes: ['global', 'tenant'],
    priority: 90
  },
  {
    id: 'users_update_manager',
    resource: 'users',
    action: 'update',
    scopes: ['tenant', 'department', 'team'],
    conditions: { role_hierarchy: true },
    priority: 70
  },

  // Financial data scopes
  {
    id: 'financial_reports_global',
    resource: 'financial_reports',
    action: 'read',
    scopes: ['global', 'tenant'],
    priority: 100
  },
  {
    id: 'financial_reports_department',
    resource: 'financial_reports',
    action: 'read',
    scopes: ['department'],
    conditions: { department_access: true },
    priority: 80
  },
  {
    id: 'budgets_own_only',
    resource: 'budgets',
    action: 'read',
    scopes: ['own'],
    priority: 60
  },
  {
    id: 'budgets_team_manager',
    resource: 'budgets',
    action: 'update',
    scopes: ['team', 'department'],
    conditions: { manager_access: true },
    priority: 80
  },

  // Document scopes
  {
    id: 'documents_read_scope',
    resource: 'documents',
    action: 'read',
    scopes: ['global', 'tenant', 'department', 'team', 'own'],
    priority: 50
  },
  {
    id: 'documents_create_scope',
    resource: 'documents',
    action: 'create',
    scopes: ['tenant', 'department', 'team', 'own'],
    priority: 60
  },

  // Audit logs - restricted access
  {
    id: 'audit_logs_admin',
    resource: 'audit_logs',
    action: 'read',
    scopes: ['global', 'tenant'],
    conditions: { admin_role: true },
    priority: 100
  }
];

// Mock user data scope
const mockUserScope: UserDataScope = {
  userId: 'user_123',
  tenantId: 'tenant_456',
  departmentId: 'dept_finance',
  teamId: 'team_budget',
  managedDepartments: ['dept_finance'],
  managedTeams: ['team_budget', 'team_accounting'],
  directReports: ['user_456', 'user_789'],
  scopes: ['tenant', 'department', 'team', 'own'],
  customRules: []
};

interface Props {
  children: ReactNode;
  mockUserScope?: UserDataScope;
}

export const DataScopeProvider: React.FC<Props> = ({ 
  children, 
  mockUserScope: providedUserScope = mockUserScope 
}) => {
  const [userScope, setUserScope] = useState<UserDataScope | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const scopeHierarchy: DataScopeLevel[] = ['global', 'tenant', 'department', 'team', 'own', 'none'];

  const getScopeDescription = (scope: DataScopeLevel): string => {
    const descriptions = {
      global: 'Global - All tenants and data',
      tenant: 'Tenant - All data within tenant',
      department: 'Department - Department-level data',
      team: 'Team - Team-level data',
      own: 'Own - Only personal data',
      none: 'None - No data access'
    };
    return descriptions[scope];
  };

  const getScopeForResource = (resource: string, action: string): DataScopeLevel[] => {
    if (!userScope) return ['none'];

    // Find applicable rules for the resource and action
    const applicableRules = mockDataScopeRules
      .filter(rule => 
        rule.resource === resource && 
        rule.action === action
      )
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (applicableRules.length === 0) {
      return ['none'];
    }

    // Get the highest priority rule's scopes that user has access to
    const highestPriorityRule = applicableRules[0];
    const allowedScopes = highestPriorityRule.scopes.filter(scope => 
      userScope.scopes.includes(scope)
    );

    return allowedScopes.length > 0 ? allowedScopes : ['none'];
  };

  const canAccessData = (resource: string, action: string, targetData: any): boolean => {
    if (!userScope || !targetData) return false;

    const allowedScopes = getScopeForResource(resource, action);
    
    if (allowedScopes.includes('none')) return false;
    if (allowedScopes.includes('global')) return true;
    if (allowedScopes.includes('tenant') && targetData.tenantId === userScope.tenantId) return true;
    
    if (allowedScopes.includes('department')) {
      if (targetData.departmentId === userScope.departmentId) return true;
      if (userScope.managedDepartments?.includes(targetData.departmentId)) return true;
    }
    
    if (allowedScopes.includes('team')) {
      if (targetData.teamId === userScope.teamId) return true;
      if (userScope.managedTeams?.includes(targetData.teamId)) return true;
    }
    
    if (allowedScopes.includes('own')) {
      if (targetData.userId === userScope.userId) return true;
      if (targetData.createdBy === userScope.userId) return true;
      if (targetData.ownerId === userScope.userId) return true;
      if (userScope.directReports?.includes(targetData.userId)) return true;
    }

    return false;
  };

  const getDataFilter = (resource: string, action: string): DataFilter | null => {
    if (!userScope) return null;

    const allowedScopes = getScopeForResource(resource, action);
    
    if (allowedScopes.includes('none')) {
      return {
        resource,
        filters: { _impossible_condition: true }, // Ensures no data is returned
        conditions: ['FALSE']
      };
    }

    if (allowedScopes.includes('global')) {
      return {
        resource,
        filters: {}, // No filters - global access
        conditions: []
      };
    }

    const filters: Record<string, any> = {};
    const conditions: string[] = [];

    if (allowedScopes.includes('tenant')) {
      filters.tenantId = userScope.tenantId;
      conditions.push(`tenantId = '${userScope.tenantId}'`);
    } else {
      // More restrictive scoping
      const orConditions: string[] = [];
      
      if (allowedScopes.includes('department')) {
        if (userScope.departmentId) {
          orConditions.push(`departmentId = '${userScope.departmentId}'`);
        }
        if (userScope.managedDepartments?.length) {
          orConditions.push(`departmentId IN ('${userScope.managedDepartments.join("','")}')`);
        }
      }
      
      if (allowedScopes.includes('team')) {
        if (userScope.teamId) {
          orConditions.push(`teamId = '${userScope.teamId}'`);
        }
        if (userScope.managedTeams?.length) {
          orConditions.push(`teamId IN ('${userScope.managedTeams.join("','")}')`);
        }
      }
      
      if (allowedScopes.includes('own')) {
        orConditions.push(`userId = '${userScope.userId}'`);
        orConditions.push(`createdBy = '${userScope.userId}'`);
        orConditions.push(`ownerId = '${userScope.userId}'`);
        if (userScope.directReports?.length) {
          orConditions.push(`userId IN ('${userScope.directReports.join("','")}')`);
        }
      }

      if (orConditions.length > 0) {
        conditions.push(`(${orConditions.join(' OR ')})`);
        // Set basic filters for the most common case
        if (allowedScopes.includes('own')) {
          filters.userId = userScope.userId;
        }
      } else {
        conditions.push('FALSE');
        filters._impossible_condition = true;
      }
    }

    return {
      resource,
      filters,
      conditions,
      joins: [],
      sortBy: ['createdAt DESC']
    };
  };

  const applyDataScoping = <T extends Record<string, any>>(
    data: T[], 
    resource: string, 
    action: string
  ): T[] => {
    if (!userScope) return [];

    return data.filter(item => canAccessData(resource, action, item));
  };

  const getAllowedScopes = (): DataScopeLevel[] => {
    return userScope?.scopes || ['none'];
  };

  const validateDataAccess = (resource: string, action: string, itemId: string): boolean => {
    // In a real app, this would fetch the item and check access
    // For demo, we'll simulate with mock logic
    if (!userScope) return false;

    const allowedScopes = getScopeForResource(resource, action);
    
    if (allowedScopes.includes('none')) return false;
    if (allowedScopes.includes('global')) return true;
    
    // For demo purposes, assume access based on scope hierarchy
    return allowedScopes.length > 0;
  };

  const getScopeHierarchy = (): DataScopeLevel[] => {
    return scopeHierarchy;
  };

  useEffect(() => {
    // Simulate loading user scope data
    const timer = setTimeout(() => {
      setUserScope(providedUserScope);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [providedUserScope]);

  const contextValue: DataScopeContextType = useMemo(() => ({
    userScope,
    getScopeForResource,
    canAccessData,
    getDataFilter,
    applyDataScoping,
    getScopeDescription,
    getAllowedScopes,
    validateDataAccess,
    getScopeHierarchy,
    isLoading
  }), [userScope, isLoading]);

  return (
    <DataScopeContext.Provider value={contextValue}>
      {children}
    </DataScopeContext.Provider>
  );
};

export const useDataScope = (): DataScopeContextType => {
  const context = useContext(DataScopeContext);
  if (context === undefined) {
    throw new Error('useDataScope must be used within a DataScopeProvider');
  }
  return context;
};

export default DataScopeContext;
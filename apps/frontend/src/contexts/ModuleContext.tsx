import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'inactive' | 'trial' | 'suspended';
  category: string;
  icon?: string;
  permissions: string[];
  dependencies?: string[];
  metadata?: {
    lastAccessed?: string;
    usage?: {
      dailyActions: number;
      weeklyActions: number;
      monthlyActions: number;
    };
    features?: string[];
  };
}

export interface ModuleContextType {
  availableModules: Module[];
  accessibleModules: Module[];
  currentModule: Module | null;
  switchModule: (moduleCode: string) => void;
  refreshModules: () => Promise<void>;
  hasModuleAccess: (moduleCode: string) => boolean;
  getModulePermissions: (moduleCode: string) => string[];
  isLoading: boolean;
  error: string | null;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
  tenantId?: string;
  userId?: string;
}

// Mock data for demonstration - in production, this would come from API
const mockModules: Module[] = [
  {
    id: 'mod-001',
    code: 'core',
    name: 'Core System',
    description: 'Essential system features and dashboard',
    version: '2.1.0',
    status: 'active',
    category: 'system',
    icon: 'Home',
    permissions: ['core.dashboard.read', 'core.settings.read'],
    metadata: {
      lastAccessed: '2024-01-15T16:30:00Z',
      usage: {
        dailyActions: 45,
        weeklyActions: 280,
        monthlyActions: 1150
      },
      features: ['Dashboard', 'User Profile', 'Settings']
    }
  },
  {
    id: 'mod-002', 
    code: 'finance',
    name: 'Finance & Accounting',
    description: 'Financial management and accounting features',
    version: '1.8.2',
    status: 'active',
    category: 'business',
    icon: 'DollarSign',
    permissions: ['finance.dashboard.read', 'finance.budget.read', 'finance.reports.read'],
    metadata: {
      lastAccessed: '2024-01-15T14:20:00Z',
      usage: {
        dailyActions: 89,
        weeklyActions: 520,
        monthlyActions: 2100
      },
      features: ['Budget Management', 'Financial Reports', 'Expense Tracking', 'Invoice Management']
    }
  },
  {
    id: 'mod-003',
    code: 'hr',
    name: 'Human Resources',
    description: 'Employee management and HR operations',
    version: '1.5.1',
    status: 'active', 
    category: 'business',
    icon: 'Users',
    permissions: ['hr.dashboard.read', 'hr.employee.read'],
    metadata: {
      lastAccessed: '2024-01-15T11:45:00Z',
      usage: {
        dailyActions: 32,
        weeklyActions: 180,
        monthlyActions: 750
      },
      features: ['Employee Records', 'Payroll', 'Performance Reviews', 'Time Tracking']
    }
  },
  {
    id: 'mod-004',
    code: 'sales',
    name: 'Sales & CRM',
    description: 'Customer relationship management and sales tracking',
    version: '2.0.0',
    status: 'trial',
    category: 'business',
    icon: 'TrendingUp',
    permissions: ['sales.dashboard.read', 'sales.leads.read', 'sales.opportunities.read'],
    metadata: {
      lastAccessed: '2024-01-14T09:15:00Z',
      usage: {
        dailyActions: 67,
        weeklyActions: 340,
        monthlyActions: 1420
      },
      features: ['Lead Management', 'Sales Pipeline', 'Customer Database', 'Analytics']
    }
  },
  {
    id: 'mod-005',
    code: 'inventory',
    name: 'Inventory Management',
    description: 'Stock control and warehouse management',
    version: '1.3.0',
    status: 'inactive',
    category: 'operations',
    icon: 'Package',
    permissions: [],
    metadata: {
      lastAccessed: null,
      usage: {
        dailyActions: 0,
        weeklyActions: 0,
        monthlyActions: 0
      },
      features: ['Stock Control', 'Warehouse Management', 'Purchase Orders']
    }
  },
  {
    id: 'mod-006',
    code: 'projects',
    name: 'Project Management',
    description: 'Project tracking and task management',
    version: '1.9.1',
    status: 'active',
    category: 'productivity',
    icon: 'Briefcase',
    permissions: ['projects.dashboard.read', 'projects.tasks.read', 'projects.team.read'],
    metadata: {
      lastAccessed: '2024-01-15T13:30:00Z',
      usage: {
        dailyActions: 156,
        weeklyActions: 890,
        monthlyActions: 3200
      },
      features: ['Task Management', 'Team Collaboration', 'Time Tracking', 'Reporting']
    }
  }
];

// Mock user permissions - in production, this would come from authentication context
const mockUserPermissions = [
  'core.dashboard.read',
  'core.settings.read',
  'finance.dashboard.read',
  'finance.budget.read', 
  'finance.reports.read',
  'hr.dashboard.read',
  'hr.employee.read',
  'sales.dashboard.read',
  'sales.leads.read',
  'projects.dashboard.read',
  'projects.tasks.read',
  'projects.team.read'
];

export const ModuleProvider: React.FC<Props> = ({ 
  children, 
  tenantId = 'tenant-001', 
  userId = 'user-001' 
}) => {
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [accessibleModules, setAccessibleModules] = useState<Module[]>([]);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasModuleAccess = (moduleCode: string): boolean => {
    const module = availableModules.find(m => m.code === moduleCode);
    if (!module || module.status === 'inactive' || module.status === 'suspended') {
      return false;
    }

    // Check if user has at least one permission for the module
    return module.permissions.some(permission => 
      mockUserPermissions.includes(permission)
    );
  };

  const getModulePermissions = (moduleCode: string): string[] => {
    const module = availableModules.find(m => m.code === moduleCode);
    if (!module) return [];
    
    return module.permissions.filter(permission => 
      mockUserPermissions.includes(permission)
    );
  };

  const switchModule = (moduleCode: string) => {
    const module = accessibleModules.find(m => m.code === moduleCode);
    if (module) {
      setCurrentModule(module);
      
      // Update last accessed timestamp
      const updatedModules = availableModules.map(m => 
        m.code === moduleCode 
          ? { ...m, metadata: { ...m.metadata, lastAccessed: new Date().toISOString() } }
          : m
      );
      setAvailableModules(updatedModules);
      
      // Store in localStorage for persistence
      localStorage.setItem('currentModule', moduleCode);
      
      // Trigger custom event for other components to listen
      window.dispatchEvent(new CustomEvent('moduleChanged', { 
        detail: { module, moduleCode } 
      }));
    }
  };

  const refreshModules = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, this would be:
      // const response = await fetch(`/api/tenants/${tenantId}/modules`);
      // const modules = await response.json();
      
      setAvailableModules(mockModules);
      
      // Filter accessible modules based on permissions and status
      const accessible = mockModules.filter(module => 
        hasModuleAccess(module.code)
      );
      setAccessibleModules(accessible);
      
      // Set current module from localStorage or default to first accessible
      const savedModule = localStorage.getItem('currentModule');
      if (savedModule && accessible.find(m => m.code === savedModule)) {
        setCurrentModule(accessible.find(m => m.code === savedModule)!);
      } else if (accessible.length > 0) {
        setCurrentModule(accessible[0]);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshModules();
  }, [tenantId, userId]);

  const contextValue: ModuleContextType = {
    availableModules,
    accessibleModules,
    currentModule,
    switchModule,
    refreshModules,
    hasModuleAccess,
    getModulePermissions,
    isLoading,
    error
  };

  return (
    <ModuleContext.Provider value={contextValue}>
      {children}
    </ModuleContext.Provider>
  );
};

export const useModule = (): ModuleContextType => {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
};

export default ModuleContext;
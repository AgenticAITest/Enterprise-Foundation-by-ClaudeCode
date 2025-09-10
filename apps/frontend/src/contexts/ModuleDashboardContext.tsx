import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { useDataScope } from '@/contexts/DataScopeContext';

export type DashboardWidgetType = 
  | 'metric'           // KPI metrics with numbers
  | 'chart'           // Charts and graphs
  | 'table'           // Data tables
  | 'list'            // Simple lists
  | 'progress'        // Progress bars/rings
  | 'alert'           // Alerts and notifications
  | 'activity'        // Activity feeds
  | 'calendar'        // Calendar widgets
  | 'map'             // Geographic data
  | 'custom';         // Custom components

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type WidgetPosition = { x: number; y: number; w: number; h: number };

export interface DashboardWidget {
  id: string;
  moduleId: string;
  type: DashboardWidgetType;
  title: string;
  description?: string;
  size: WidgetSize;
  position?: WidgetPosition;
  requiredPermissions: string[];
  requiredRoles?: string[];
  requiredScopes?: string[];
  dataSource?: string;
  config?: Record<string, any>;
  refreshInterval?: number; // seconds
  category?: string;
  priority?: number;
  isCustomizable?: boolean;
  component?: string; // Component name for dynamic loading
}

export interface DashboardLayout {
  id: string;
  moduleId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  widgets: DashboardWidget[];
  layout: WidgetPosition[];
  permissions: string[];
  roles?: string[];
  isCustomizable?: boolean;
  createdBy?: string;
  updatedAt?: string;
}

export interface ModuleDashboard {
  id: string;
  moduleId: string;
  moduleName: string;
  layouts: DashboardLayout[];
  defaultLayout?: string;
  availableWidgets: DashboardWidget[];
  customizations?: Record<string, any>;
  permissions: string[];
}

export interface ModuleDashboardContextType {
  dashboards: ModuleDashboard[];
  currentModule: string | null;
  currentLayout: string | null;
  getModuleDashboard: (moduleId: string) => ModuleDashboard | null;
  getAccessibleWidgets: (moduleId: string) => DashboardWidget[];
  getCurrentLayout: () => DashboardLayout | null;
  setCurrentModule: (moduleId: string) => void;
  setCurrentLayout: (layoutId: string) => void;
  canCustomizeDashboard: (moduleId: string) => boolean;
  getWidgetData: (widgetId: string) => Promise<any>;
  refreshWidget: (widgetId: string) => Promise<void>;
  saveLayoutCustomization: (layoutId: string, changes: Partial<DashboardLayout>) => Promise<void>;
  isLoading: boolean;
}

const ModuleDashboardContext = createContext<ModuleDashboardContextType | undefined>(undefined);

// Mock dashboard data for different modules
const mockDashboards: ModuleDashboard[] = [
  // Core/Main Dashboard
  {
    id: 'core_dashboard',
    moduleId: 'core',
    moduleName: 'Core Dashboard',
    permissions: ['core.dashboard.read'],
    layouts: [
      {
        id: 'core_default',
        moduleId: 'core',
        name: 'Default Overview',
        description: 'Standard overview dashboard for all users',
        isDefault: true,
        permissions: ['core.dashboard.read'],
        isCustomizable: true,
        widgets: [
          {
            id: 'core_kpi_overview',
            moduleId: 'core',
            type: 'metric',
            title: 'System Overview',
            size: 'medium',
            requiredPermissions: ['core.dashboard.read'],
            category: 'overview',
            priority: 100,
            config: {
              metrics: ['users', 'active_sessions', 'system_health']
            }
          },
          {
            id: 'core_recent_activity',
            moduleId: 'core',
            type: 'activity',
            title: 'Recent Activity',
            size: 'large',
            requiredPermissions: ['core.dashboard.read'],
            category: 'activity',
            priority: 90,
            refreshInterval: 30
          },
          {
            id: 'core_quick_actions',
            moduleId: 'core',
            type: 'list',
            title: 'Quick Actions',
            size: 'small',
            requiredPermissions: ['core.dashboard.read'],
            category: 'actions',
            priority: 80
          }
        ],
        layout: [
          { x: 0, y: 0, w: 6, h: 4 },
          { x: 6, y: 0, w: 6, h: 8 },
          { x: 0, y: 4, w: 6, h: 4 }
        ]
      }
    ],
    availableWidgets: [
      {
        id: 'core_system_metrics',
        moduleId: 'core',
        type: 'metric',
        title: 'System Metrics',
        size: 'medium',
        requiredPermissions: ['core.dashboard.read'],
        category: 'system',
        isCustomizable: true
      },
      {
        id: 'core_user_analytics',
        moduleId: 'core',
        type: 'chart',
        title: 'User Analytics',
        size: 'large',
        requiredPermissions: ['core.analytics.read'],
        category: 'analytics',
        isCustomizable: true
      }
    ]
  },

  // Finance Dashboard
  {
    id: 'finance_dashboard',
    moduleId: 'finance',
    moduleName: 'Finance Dashboard',
    permissions: ['finance.dashboard.read'],
    layouts: [
      {
        id: 'finance_default',
        moduleId: 'finance',
        name: 'Financial Overview',
        description: 'Comprehensive financial metrics and reports',
        isDefault: true,
        permissions: ['finance.dashboard.read'],
        isCustomizable: true,
        widgets: [
          {
            id: 'finance_revenue_metrics',
            moduleId: 'finance',
            type: 'metric',
            title: 'Revenue Metrics',
            size: 'large',
            requiredPermissions: ['finance.dashboard.read'],
            requiredScopes: ['tenant', 'department'],
            category: 'revenue',
            priority: 100,
            config: {
              metrics: ['monthly_revenue', 'yearly_revenue', 'growth_rate'],
              period: 'current_quarter'
            }
          },
          {
            id: 'finance_expense_breakdown',
            moduleId: 'finance',
            type: 'chart',
            title: 'Expense Breakdown',
            size: 'medium',
            requiredPermissions: ['finance.expenses.read'],
            category: 'expenses',
            priority: 90,
            refreshInterval: 300
          },
          {
            id: 'finance_budget_status',
            moduleId: 'finance',
            type: 'progress',
            title: 'Budget Status',
            size: 'medium',
            requiredPermissions: ['finance.budget.read'],
            category: 'budget',
            priority: 85
          },
          {
            id: 'finance_pending_approvals',
            moduleId: 'finance',
            type: 'table',
            title: 'Pending Approvals',
            size: 'large',
            requiredPermissions: ['finance.approvals.read'],
            requiredRoles: ['finance_manager', 'cfo'],
            category: 'approvals',
            priority: 80,
            refreshInterval: 60
          }
        ],
        layout: [
          { x: 0, y: 0, w: 8, h: 4 },
          { x: 8, y: 0, w: 4, h: 4 },
          { x: 8, y: 4, w: 4, h: 4 },
          { x: 0, y: 4, w: 8, h: 4 }
        ]
      },
      {
        id: 'finance_executive',
        moduleId: 'finance',
        name: 'Executive View',
        description: 'High-level financial overview for executives',
        permissions: ['finance.dashboard.read'],
        roles: ['cfo', 'ceo', 'executive'],
        isCustomizable: false,
        widgets: [
          {
            id: 'finance_executive_summary',
            moduleId: 'finance',
            type: 'metric',
            title: 'Executive Summary',
            size: 'full',
            requiredPermissions: ['finance.sensitive.read'],
            requiredRoles: ['cfo', 'ceo'],
            category: 'executive',
            priority: 100,
            config: {
              includeProjections: true,
              confidentialMetrics: true
            }
          }
        ],
        layout: [
          { x: 0, y: 0, w: 12, h: 8 }
        ]
      }
    ],
    availableWidgets: [
      {
        id: 'finance_cash_flow',
        moduleId: 'finance',
        type: 'chart',
        title: 'Cash Flow Chart',
        size: 'large',
        requiredPermissions: ['finance.cashflow.read'],
        category: 'cashflow',
        isCustomizable: true
      },
      {
        id: 'finance_profit_margins',
        moduleId: 'finance',
        type: 'metric',
        title: 'Profit Margins',
        size: 'medium',
        requiredPermissions: ['finance.sensitive.read'],
        requiredRoles: ['finance_manager', 'cfo'],
        category: 'profitability',
        isCustomizable: true
      }
    ]
  },

  // Admin Dashboard
  {
    id: 'admin_dashboard',
    moduleId: 'admin',
    moduleName: 'Administration Dashboard',
    permissions: ['admin.access'],
    layouts: [
      {
        id: 'admin_default',
        moduleId: 'admin',
        name: 'System Administration',
        description: 'System monitoring and user management',
        isDefault: true,
        permissions: ['admin.access'],
        isCustomizable: true,
        widgets: [
          {
            id: 'admin_user_stats',
            moduleId: 'admin',
            type: 'metric',
            title: 'User Statistics',
            size: 'medium',
            requiredPermissions: ['admin.users.read'],
            category: 'users',
            priority: 100,
            refreshInterval: 120
          },
          {
            id: 'admin_system_health',
            moduleId: 'admin',
            type: 'progress',
            title: 'System Health',
            size: 'medium',
            requiredPermissions: ['admin.system.read'],
            category: 'system',
            priority: 95,
            refreshInterval: 60
          },
          {
            id: 'admin_security_alerts',
            moduleId: 'admin',
            type: 'alert',
            title: 'Security Alerts',
            size: 'large',
            requiredPermissions: ['admin.security.read'],
            category: 'security',
            priority: 90,
            refreshInterval: 30
          },
          {
            id: 'admin_audit_log',
            moduleId: 'admin',
            type: 'table',
            title: 'Recent Audit Events',
            size: 'large',
            requiredPermissions: ['admin.audit.read'],
            category: 'audit',
            priority: 80,
            refreshInterval: 60
          }
        ],
        layout: [
          { x: 0, y: 0, w: 6, h: 4 },
          { x: 6, y: 0, w: 6, h: 4 },
          { x: 0, y: 4, w: 6, h: 4 },
          { x: 6, y: 4, w: 6, h: 4 }
        ]
      }
    ],
    availableWidgets: [
      {
        id: 'admin_performance_metrics',
        moduleId: 'admin',
        type: 'chart',
        title: 'Performance Metrics',
        size: 'large',
        requiredPermissions: ['admin.system.read'],
        category: 'performance',
        isCustomizable: true
      },
      {
        id: 'admin_backup_status',
        moduleId: 'admin',
        type: 'progress',
        title: 'Backup Status',
        size: 'small',
        requiredPermissions: ['admin.system.read'],
        category: 'backup',
        isCustomizable: true
      }
    ]
  }
];

interface Props {
  children: ReactNode;
  mockDashboards?: ModuleDashboard[];
}

export const ModuleDashboardProvider: React.FC<Props> = ({ 
  children, 
  mockDashboards: providedDashboards = mockDashboards 
}) => {
  const [dashboards, setDashboards] = useState<ModuleDashboard[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentLayout, setCurrentLayout] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { hasPermission, hasRole } = usePermissions();
  const { getAllowedScopes } = useDataScope();

  const getModuleDashboard = (moduleId: string): ModuleDashboard | null => {
    return dashboards.find(d => d.moduleId === moduleId) || null;
  };

  const checkWidgetAccess = (widget: DashboardWidget): boolean => {
    // Check permissions
    if (widget.requiredPermissions.length > 0) {
      const hasRequiredPermissions = widget.requiredPermissions.some(permission => 
        hasPermission(permission)
      );
      if (!hasRequiredPermissions) return false;
    }

    // Check roles
    if (widget.requiredRoles && widget.requiredRoles.length > 0) {
      const hasRequiredRoles = widget.requiredRoles.some(role => 
        hasRole(role)
      );
      if (!hasRequiredRoles) return false;
    }

    // Check scopes
    if (widget.requiredScopes && widget.requiredScopes.length > 0) {
      const allowedScopes = getAllowedScopes();
      const hasRequiredScopes = widget.requiredScopes.some(scope => 
        allowedScopes.includes(scope as any)
      );
      if (!hasRequiredScopes) return false;
    }

    return true;
  };

  const getAccessibleWidgets = (moduleId: string): DashboardWidget[] => {
    const dashboard = getModuleDashboard(moduleId);
    if (!dashboard) return [];

    const currentLayoutData = getCurrentLayout();
    if (!currentLayoutData) return [];

    return currentLayoutData.widgets
      .filter(checkWidgetAccess)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  };

  const getCurrentLayout = (): DashboardLayout | null => {
    if (!currentModule) return null;
    
    const dashboard = getModuleDashboard(currentModule);
    if (!dashboard) return null;

    if (currentLayout) {
      const layout = dashboard.layouts.find(l => l.id === currentLayout);
      if (layout) return layout;
    }

    // Return default layout
    return dashboard.layouts.find(l => l.isDefault) || dashboard.layouts[0] || null;
  };

  const canCustomizeDashboard = (moduleId: string): boolean => {
    const dashboard = getModuleDashboard(moduleId);
    if (!dashboard) return false;

    const layout = getCurrentLayout();
    if (!layout) return false;

    return layout.isCustomizable || false;
  };

  // Mock data fetching for widgets
  const getWidgetData = async (widgetId: string): Promise<any> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Return mock data based on widget type
    const widget = dashboards
      .flatMap(d => d.layouts.flatMap(l => l.widgets))
      .find(w => w.id === widgetId);

    if (!widget) return null;

    switch (widget.type) {
      case 'metric':
        return {
          metrics: [
            { label: 'Total Users', value: 1234, change: '+5%', trend: 'up' },
            { label: 'Active Sessions', value: 89, change: '-2%', trend: 'down' },
            { label: 'System Health', value: 98, unit: '%', change: '+1%', trend: 'up' }
          ]
        };
      
      case 'chart':
        return {
          chartData: [
            { name: 'Jan', value: 4000 },
            { name: 'Feb', value: 3000 },
            { name: 'Mar', value: 5000 },
            { name: 'Apr', value: 4500 },
            { name: 'May', value: 6000 }
          ]
        };
      
      case 'table':
        return {
          columns: ['Name', 'Status', 'Date', 'Amount'],
          rows: [
            ['Budget Approval', 'Pending', '2024-03-15', '$15,000'],
            ['Expense Report', 'Approved', '2024-03-14', '$2,500'],
            ['Invoice Payment', 'Pending', '2024-03-13', '$8,750']
          ]
        };
      
      case 'activity':
        return {
          activities: [
            { user: 'John Doe', action: 'Updated budget', timestamp: '2 min ago' },
            { user: 'Jane Smith', action: 'Approved expense', timestamp: '5 min ago' },
            { user: 'Bob Johnson', action: 'Created report', timestamp: '10 min ago' }
          ]
        };
      
      case 'progress':
        return {
          progress: [
            { label: 'Q1 Budget', current: 75000, target: 100000, percentage: 75 },
            { label: 'Q2 Budget', current: 45000, target: 90000, percentage: 50 }
          ]
        };
      
      default:
        return { data: 'Mock data for ' + widget.type };
    }
  };

  const refreshWidget = async (widgetId: string): Promise<void> => {
    // Mock refresh implementation
    console.log(`Refreshing widget: ${widgetId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  };

  const saveLayoutCustomization = async (layoutId: string, changes: Partial<DashboardLayout>): Promise<void> => {
    // Mock save implementation
    console.log('Saving layout customization:', layoutId, changes);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state
    setDashboards(prev => prev.map(dashboard => ({
      ...dashboard,
      layouts: dashboard.layouts.map(layout => 
        layout.id === layoutId ? { ...layout, ...changes } : layout
      )
    })));
  };

  useEffect(() => {
    // Simulate loading dashboards
    const timer = setTimeout(() => {
      setDashboards(providedDashboards);
      // Set default module to core if available
      if (providedDashboards.length > 0) {
        const coreDashboard = providedDashboards.find(d => d.moduleId === 'core');
        if (coreDashboard) {
          setCurrentModule('core');
          const defaultLayout = coreDashboard.layouts.find(l => l.isDefault);
          if (defaultLayout) {
            setCurrentLayout(defaultLayout.id);
          }
        }
      }
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [providedDashboards]);

  const contextValue: ModuleDashboardContextType = useMemo(() => ({
    dashboards,
    currentModule,
    currentLayout,
    getModuleDashboard,
    getAccessibleWidgets,
    getCurrentLayout,
    setCurrentModule,
    setCurrentLayout,
    canCustomizeDashboard,
    getWidgetData,
    refreshWidget,
    saveLayoutCustomization,
    isLoading
  }), [
    dashboards,
    currentModule,
    currentLayout,
    isLoading
  ]);

  return (
    <ModuleDashboardContext.Provider value={contextValue}>
      {children}
    </ModuleDashboardContext.Provider>
  );
};

export const useModuleDashboard = (): ModuleDashboardContextType => {
  const context = useContext(ModuleDashboardContext);
  if (context === undefined) {
    throw new Error('useModuleDashboard must be used within a ModuleDashboardProvider');
  }
  return context;
};

export default ModuleDashboardContext;
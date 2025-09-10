import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  permissions: string[];
  moduleCode?: string;
  children?: NavigationItem[];
  badge?: string | number;
  isNew?: boolean;
  category?: string;
  order?: number;
}

export interface NavigationGroup {
  id: string;
  label: string;
  icon?: string;
  items: NavigationItem[];
  permissions: string[];
  moduleCode?: string;
  order?: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface NavigationContextType {
  navigationGroups: NavigationGroup[];
  flatNavigation: NavigationItem[];
  getAccessibleNavigation: () => NavigationGroup[];
  hasNavigationAccess: (item: NavigationItem) => boolean;
  getBreadcrumbs: (currentPath: string) => NavigationItem[];
  findNavigationItem: (path: string) => NavigationItem | null;
  isLoading: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
  mockUserPermissions?: string[];
}

// Simple mock navigation data
const mockNavigationGroups: NavigationGroup[] = [
  {
    id: 'core',
    label: 'Dashboard',
    icon: 'Home',
    order: 1,
    permissions: ['core.dashboard.read'],
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'BarChart3',
        permissions: ['core.dashboard.read'],
        order: 1
      },
      {
        id: 'analytics',
        label: 'Analytics', 
        path: '/analytics',
        icon: 'TrendingUp',
        permissions: ['core.analytics.read'],
        order: 2,
        badge: 'New'
      }
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'DollarSign',
    order: 2,
    permissions: ['finance.dashboard.read'],
    collapsible: true,
    defaultOpen: true,
    items: [
      {
        id: 'finance-dashboard',
        label: 'Finance Dashboard',
        path: '/finance/dashboard',
        icon: 'BarChart3',
        permissions: ['finance.dashboard.read'],
        order: 1
      },
      {
        id: 'budget',
        label: 'Budget Management',
        path: '/finance/budget',
        icon: 'Calculator',
        permissions: ['finance.budget.read'],
        order: 2
      },
      {
        id: 'reports',
        label: 'Financial Reports',
        path: '/finance/reports',
        icon: 'FileText',
        permissions: ['finance.reports.read'],
        order: 3,
        children: [
          {
            id: 'profit-loss',
            label: 'Profit & Loss',
            path: '/finance/reports/profit-loss',
            permissions: ['finance.reports.read']
          },
          {
            id: 'balance-sheet',
            label: 'Balance Sheet', 
            path: '/finance/reports/balance-sheet',
            permissions: ['finance.reports.read']
          }
        ]
      }
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: 'Settings',
    order: 99,
    permissions: ['admin.access'],
    collapsible: true,
    defaultOpen: false,
    items: [
      {
        id: 'users',
        label: 'User Management',
        path: '/admin/users',
        icon: 'Users',
        permissions: ['admin.users.read'],
        order: 1
      },
      {
        id: 'roles',
        label: 'Role Management',
        path: '/admin/roles',
        icon: 'Shield',
        permissions: ['admin.roles.read'],
        order: 2
      }
    ]
  }
];

// Default permissions for demo
const defaultPermissions = [
  'core.dashboard.read',
  'core.analytics.read',
  'finance.dashboard.read',
  'finance.budget.read',
  'finance.reports.read',
  'admin.access',
  'admin.users.read'
];

export const NavigationProvider: React.FC<Props> = ({ 
  children, 
  mockUserPermissions = defaultPermissions 
}) => {
  const [navigationGroups, setNavigationGroups] = useState<NavigationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Flatten navigation for easier searching
  const flatNavigation: NavigationItem[] = React.useMemo(() => {
    const flatten = (items: NavigationItem[]): NavigationItem[] => {
      const result: NavigationItem[] = [];
      items.forEach(item => {
        result.push(item);
        if (item.children) {
          result.push(...flatten(item.children));
        }
      });
      return result;
    };

    return navigationGroups.reduce((acc, group) => {
      return [...acc, ...flatten(group.items)];
    }, [] as NavigationItem[]);
  }, [navigationGroups]);

  const hasNavigationAccess = (item: NavigationItem): boolean => {
    if (item.permissions.length === 0) {
      return true; // No permissions required
    }
    return item.permissions.some(permission => 
      mockUserPermissions.includes(permission)
    );
  };

  const getAccessibleNavigation = (): NavigationGroup[] => {
    return navigationGroups
      .filter(group => {
        // Check if user has permissions for the group
        const hasGroupPermission = group.permissions.length === 0 || 
          group.permissions.some(permission => mockUserPermissions.includes(permission));
        
        if (!hasGroupPermission) {
          return false;
        }

        // Filter accessible items within the group
        const accessibleItems = group.items.filter(item => hasNavigationAccess(item));
        return accessibleItems.length > 0;
      })
      .map(group => ({
        ...group,
        items: group.items
          .filter(item => hasNavigationAccess(item))
          .map(item => ({
            ...item,
            children: item.children?.filter(child => hasNavigationAccess(child))
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const findNavigationItem = (path: string): NavigationItem | null => {
    return flatNavigation.find(item => item.path === path) || null;
  };

  const getBreadcrumbs = (currentPath: string): NavigationItem[] => {
    const breadcrumbs: NavigationItem[] = [];
    const segments = currentPath.split('/').filter(Boolean);
    
    let currentSegmentPath = '';
    segments.forEach(segment => {
      currentSegmentPath += `/${segment}`;
      const item = findNavigationItem(currentSegmentPath);
      if (item && hasNavigationAccess(item)) {
        breadcrumbs.push(item);
      }
    });

    return breadcrumbs;
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setNavigationGroups(mockNavigationGroups);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [mockUserPermissions]);

  const contextValue: NavigationContextType = {
    navigationGroups,
    flatNavigation,
    getAccessibleNavigation,
    hasNavigationAccess,
    getBreadcrumbs,
    findNavigationItem,
    isLoading
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export default NavigationContext;
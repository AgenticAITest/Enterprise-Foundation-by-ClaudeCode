import { useCallback, useMemo } from 'react';
import { useModule, Module } from '@/contexts/ModuleContext';

export interface ModuleAccessInfo {
  hasAccess: boolean;
  permissions: string[];
  status: Module['status'];
  reason?: string;
  module?: Module;
}

export interface ModuleAccessHook {
  checkModuleAccess: (moduleCode: string) => ModuleAccessInfo;
  getAccessibleModules: () => Module[];
  getCurrentModuleAccess: () => ModuleAccessInfo | null;
  canSwitchToModule: (moduleCode: string) => boolean;
  getModulesByCategory: () => Record<string, Module[]>;
  getModuleUsageStats: (moduleCode: string) => Module['metadata']['usage'] | null;
  isModuleActive: (moduleCode: string) => boolean;
  getRecentModules: (limit?: number) => Module[];
}

const useModuleAccess = (): ModuleAccessHook => {
  const {
    availableModules,
    accessibleModules,
    currentModule,
    hasModuleAccess,
    getModulePermissions
  } = useModule();

  const checkModuleAccess = useCallback((moduleCode: string): ModuleAccessInfo => {
    const module = availableModules.find(m => m.code === moduleCode);
    
    if (!module) {
      return {
        hasAccess: false,
        permissions: [],
        status: 'inactive',
        reason: 'Module not found'
      };
    }

    const hasAccess = hasModuleAccess(moduleCode);
    const permissions = getModulePermissions(moduleCode);
    
    let reason: string | undefined;
    if (!hasAccess) {
      switch (module.status) {
        case 'inactive':
          reason = 'Module is not activated for your tenant';
          break;
        case 'suspended':
          reason = 'Module access has been suspended';
          break;
        case 'trial':
          if (permissions.length === 0) {
            reason = 'Trial access expired or insufficient permissions';
          }
          break;
        case 'active':
          if (permissions.length === 0) {
            reason = 'You do not have the required permissions to access this module';
          }
          break;
        default:
          reason = 'Access denied';
      }
    }

    return {
      hasAccess,
      permissions,
      status: module.status,
      reason,
      module
    };
  }, [availableModules, hasModuleAccess, getModulePermissions]);

  const getAccessibleModules = useCallback((): Module[] => {
    return accessibleModules;
  }, [accessibleModules]);

  const getCurrentModuleAccess = useCallback((): ModuleAccessInfo | null => {
    if (!currentModule) return null;
    return checkModuleAccess(currentModule.code);
  }, [currentModule, checkModuleAccess]);

  const canSwitchToModule = useCallback((moduleCode: string): boolean => {
    const accessInfo = checkModuleAccess(moduleCode);
    return accessInfo.hasAccess && accessInfo.status !== 'suspended';
  }, [checkModuleAccess]);

  const getModulesByCategory = useCallback((): Record<string, Module[]> => {
    return accessibleModules.reduce((categories, module) => {
      const category = module.category || 'uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(module);
      return categories;
    }, {} as Record<string, Module[]>);
  }, [accessibleModules]);

  const getModuleUsageStats = useCallback((moduleCode: string): Module['metadata']['usage'] | null => {
    const module = availableModules.find(m => m.code === moduleCode);
    return module?.metadata?.usage || null;
  }, [availableModules]);

  const isModuleActive = useCallback((moduleCode: string): boolean => {
    const module = availableModules.find(m => m.code === moduleCode);
    return module?.status === 'active' || module?.status === 'trial';
  }, [availableModules]);

  const getRecentModules = useCallback((limit = 5): Module[] => {
    return accessibleModules
      .filter(module => module.metadata?.lastAccessed)
      .sort((a, b) => {
        const aDate = new Date(a.metadata?.lastAccessed || 0);
        const bDate = new Date(b.metadata?.lastAccessed || 0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, limit);
  }, [accessibleModules]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    checkModuleAccess,
    getAccessibleModules,
    getCurrentModuleAccess,
    canSwitchToModule,
    getModulesByCategory,
    getModuleUsageStats,
    isModuleActive,
    getRecentModules
  }), [
    checkModuleAccess,
    getAccessibleModules,
    getCurrentModuleAccess,
    canSwitchToModule,
    getModulesByCategory,
    getModuleUsageStats,
    isModuleActive,
    getRecentModules
  ]);
};

export default useModuleAccess;
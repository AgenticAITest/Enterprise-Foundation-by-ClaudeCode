// Permission Context and Hooks
export { PermissionProvider, usePermissions } from '@/contexts/PermissionContext';
export type { 
  Permission, 
  Role, 
  User, 
  PermissionContextType 
} from '@/contexts/PermissionContext';

export { 
  usePermissionCheck, 
  useHasPermission, 
  useHasRole, 
  useCanAccess, 
  usePermissionSummary 
} from '@/hooks/usePermissionCheck';
export type { 
  PermissionCheckOptions, 
  PermissionCheckResult 
} from '@/hooks/usePermissionCheck';

// Permission Guards and HOCs
export { default as PermissionGuard } from './PermissionGuard';
export type { PermissionGuardProps } from './PermissionGuard';

export { 
  withPermissions, 
  withRoles, 
  withPermission, 
  withAccess 
} from './withPermissions';
export type { WithPermissionsOptions } from './withPermissions';

// Conditional Rendering Components
export { 
  ConditionalRender,
  ShowIf,
  HideIf,
  PermissionSwitch,
  PermissionCase
} from './ConditionalRender';

// Permission UI Components
export { 
  PermissionButton, 
  PermissionLink 
} from './PermissionButton';

// Re-export everything for convenience
export * from '@/contexts/PermissionContext';
export * from '@/hooks/usePermissionCheck';
export * from './PermissionGuard';
export * from './withPermissions';
export * from './ConditionalRender';
export * from './PermissionButton';
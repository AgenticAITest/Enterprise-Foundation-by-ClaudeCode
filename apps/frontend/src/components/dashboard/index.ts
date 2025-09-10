// Module Dashboard Context and Types
export { ModuleDashboardProvider, useModuleDashboard } from '@/contexts/ModuleDashboardContext';
export type {
  DashboardWidgetType,
  WidgetSize,
  WidgetPosition,
  DashboardWidget,
  DashboardLayout,
  ModuleDashboard,
  ModuleDashboardContextType
} from '@/contexts/ModuleDashboardContext';

// Dashboard Components
export { default as DashboardWidget } from './DashboardWidget';
export { default as ModuleDashboardContainer } from './ModuleDashboardContainer';

// Re-export everything for convenience
export * from '@/contexts/ModuleDashboardContext';
export * from './DashboardWidget';
export * from './ModuleDashboardContainer';
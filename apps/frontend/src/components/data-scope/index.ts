// Data Scope Context and Types
export { DataScopeProvider, useDataScope } from '@/contexts/DataScopeContext';
export type {
  DataScopeLevel,
  DataScopeRule,
  UserDataScope,
  DataFilter,
  DataScopeContextType
} from '@/contexts/DataScopeContext';

// Data Filtering Hooks
export {
  useDataFiltering,
  useDataAccess,
  useCanAccessItem,
  useDataFilterConfig,
  useSearchableDataFilter,
  useBulkDataOperations
} from '@/hooks/useDataFiltering';
export type {
  DataFilterOptions,
  FilteredDataResult,
  DataAccessCheck
} from '@/hooks/useDataFiltering';

// Data Scope Components
export { default as ScopedDataTable } from './ScopedDataTable';
export type { TableColumn, ScopedDataTableProps } from './ScopedDataTable';

export { default as DataScopeFilter } from './DataScopeFilter';
export type { DataScopeFilterProps } from './DataScopeFilter';

// Re-export everything for convenience
export * from '@/contexts/DataScopeContext';
export * from '@/hooks/useDataFiltering';
export * from './ScopedDataTable';
export * from './DataScopeFilter';
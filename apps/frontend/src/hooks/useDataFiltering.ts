import { useMemo, useCallback } from 'react';
import { useDataScope, DataScopeLevel } from '@/contexts/DataScopeContext';

export interface DataFilterOptions {
  resource: string;
  action: string;
  additionalFilters?: Record<string, any>;
  sortBy?: string[];
  limit?: number;
  offset?: number;
}

export interface FilteredDataResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  appliedScopes: DataScopeLevel[];
  filters: Record<string, any>;
  loading: boolean;
}

export interface DataAccessCheck {
  canAccess: boolean;
  allowedScopes: DataScopeLevel[];
  reason?: string;
}

/**
 * Hook for applying data scope filtering to datasets
 */
export const useDataFiltering = <T extends Record<string, any>>(
  data: T[], 
  options: DataFilterOptions
): FilteredDataResult<T> => {
  const { 
    applyDataScoping, 
    getScopeForResource, 
    getDataFilter,
    isLoading 
  } = useDataScope();

  const { resource, action, additionalFilters, sortBy, limit, offset } = options;

  const result = useMemo((): FilteredDataResult<T> => {
    if (isLoading) {
      return {
        data: [],
        totalCount: 0,
        hasMore: false,
        appliedScopes: [],
        filters: {},
        loading: true
      };
    }

    // Apply scope-based filtering
    const scopeFilteredData = applyDataScoping(data, resource, action);
    const allowedScopes = getScopeForResource(resource, action);
    const dataFilter = getDataFilter(resource, action);

    // Apply additional filters if provided
    let filteredData = scopeFilteredData;
    if (additionalFilters) {
      filteredData = scopeFilteredData.filter(item => {
        return Object.entries(additionalFilters).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          if (typeof value === 'object' && value !== null) {
            // Handle range filters, etc.
            if ('min' in value && item[key] < value.min) return false;
            if ('max' in value && item[key] > value.max) return false;
            if ('contains' in value && !item[key]?.toLowerCase().includes(value.contains.toLowerCase())) return false;
            return true;
          }
          return item[key] === value;
        });
      });
    }

    // Apply sorting
    if (sortBy?.length) {
      filteredData.sort((a, b) => {
        for (const sortField of sortBy) {
          const [field, direction = 'ASC'] = sortField.split(' ');
          const aVal = a[field];
          const bVal = b[field];
          
          if (aVal < bVal) return direction === 'DESC' ? 1 : -1;
          if (aVal > bVal) return direction === 'DESC' ? -1 : 1;
        }
        return 0;
      });
    }

    const totalCount = filteredData.length;
    
    // Apply pagination
    let paginatedData = filteredData;
    if (offset || limit) {
      const start = offset || 0;
      const end = limit ? start + limit : filteredData.length;
      paginatedData = filteredData.slice(start, end);
    }

    return {
      data: paginatedData,
      totalCount,
      hasMore: limit ? (offset || 0) + limit < totalCount : false,
      appliedScopes: allowedScopes,
      filters: { ...dataFilter?.filters, ...additionalFilters },
      loading: false
    };
  }, [data, resource, action, additionalFilters, sortBy, limit, offset, applyDataScoping, getScopeForResource, getDataFilter, isLoading]);

  return result;
};

/**
 * Hook for checking data access permissions
 */
export const useDataAccess = (resource: string, action: string): DataAccessCheck => {
  const { getScopeForResource, isLoading } = useDataScope();

  return useMemo((): DataAccessCheck => {
    if (isLoading) {
      return {
        canAccess: false,
        allowedScopes: [],
        reason: 'Loading...'
      };
    }

    const allowedScopes = getScopeForResource(resource, action);
    const canAccess = !allowedScopes.includes('none') && allowedScopes.length > 0;
    
    return {
      canAccess,
      allowedScopes,
      reason: canAccess ? undefined : 'No access scope available for this resource and action'
    };
  }, [resource, action, getScopeForResource, isLoading]);
};

/**
 * Hook for checking if user can access specific data item
 */
export const useCanAccessItem = () => {
  const { canAccessData } = useDataScope();

  return useCallback((resource: string, action: string, item: any): boolean => {
    return canAccessData(resource, action, item);
  }, [canAccessData]);
};

/**
 * Hook for getting data filter configuration
 */
export const useDataFilterConfig = (resource: string, action: string) => {
  const { getDataFilter, getScopeForResource } = useDataScope();

  return useMemo(() => {
    const filter = getDataFilter(resource, action);
    const scopes = getScopeForResource(resource, action);
    
    return {
      filter,
      scopes,
      hasAccess: !scopes.includes('none'),
      isGlobalAccess: scopes.includes('global'),
      isTenantAccess: scopes.includes('tenant'),
      isDepartmentAccess: scopes.includes('department'),
      isTeamAccess: scopes.includes('team'),
      isOwnAccess: scopes.includes('own')
    };
  }, [resource, action, getDataFilter, getScopeForResource]);
};

/**
 * Hook for applying real-time data filtering with search
 */
export const useSearchableDataFilter = <T extends Record<string, any>>(
  data: T[],
  resource: string,
  action: string,
  searchTerm: string = '',
  searchFields: string[] = []
) => {
  const baseResult = useDataFiltering(data, { resource, action });

  const filteredResult = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) {
      return baseResult;
    }

    const searchFiltered = baseResult.data.filter(item => 
      searchFields.some(field => 
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    return {
      ...baseResult,
      data: searchFiltered,
      totalCount: searchFiltered.length
    };
  }, [baseResult, searchTerm, searchFields]);

  return filteredResult;
};

/**
 * Hook for bulk data operations with scope checking
 */
export const useBulkDataOperations = <T extends Record<string, any>>() => {
  const { canAccessData, applyDataScoping } = useDataScope();

  const filterAccessibleItems = useCallback((
    items: T[], 
    resource: string, 
    action: string
  ): T[] => {
    return items.filter(item => canAccessData(resource, action, item));
  }, [canAccessData]);

  const validateBulkOperation = useCallback((
    items: T[],
    resource: string,
    action: string
  ): { accessible: T[]; denied: T[]; } => {
    const accessible: T[] = [];
    const denied: T[] = [];

    items.forEach(item => {
      if (canAccessData(resource, action, item)) {
        accessible.push(item);
      } else {
        denied.push(item);
      }
    });

    return { accessible, denied };
  }, [canAccessData]);

  return {
    filterAccessibleItems,
    validateBulkOperation,
    applyScopeFiltering: applyDataScoping
  };
};
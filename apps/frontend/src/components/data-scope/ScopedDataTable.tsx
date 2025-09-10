import React, { useState, useMemo } from 'react';
import { useDataFiltering, useSearchableDataFilter } from '@/hooks/useDataFiltering';
import { useDataScope, DataScopeLevel } from '@/contexts/DataScopeContext';
import { 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Shield,
  Users,
  Building,
  User,
  Globe
} from 'lucide-react';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface ScopedDataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: TableColumn<T>[];
  resource: string;
  action: string;
  searchFields?: string[];
  pageSize?: number;
  showScopeInfo?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  showSelection?: boolean;
}

const ScopeIcon: React.FC<{ scope: DataScopeLevel; size?: number }> = ({ scope, size = 16 }) => {
  const icons = {
    global: Globe,
    tenant: Building,
    department: Users,
    team: Users,
    own: User,
    none: EyeOff
  };
  
  const Icon = icons[scope];
  return <Icon size={size} />;
};

export const ScopedDataTable = <T extends Record<string, any>>({
  data,
  columns,
  resource,
  action,
  searchFields = [],
  pageSize = 10,
  showScopeInfo = true,
  showSearch = true,
  showPagination = true,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  className = '',
  onRowClick,
  onSelectionChange,
  showSelection = false
}: ScopedDataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const { getScopeDescription, isLoading } = useDataScope();
  
  // Apply data filtering with search
  const filteredResult = useSearchableDataFilter(
    data,
    resource,
    action,
    searchTerm,
    searchFields
  );

  // Apply pagination
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredResult.data.slice(start, end);
  }, [filteredResult.data, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredResult.data.length / pageSize);

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    setSelectedItems(newSelection);
    
    if (onSelectionChange) {
      const selectedData = filteredResult.data.filter(item => 
        newSelection.has(item.id || item._id || String(item))
      );
      onSelectionChange(selectedData);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map(item => item.id || item._id || String(item)));
      setSelectedItems(allIds);
      onSelectionChange?.(paginatedData);
    } else {
      setSelectedItems(new Set());
      onSelectionChange?.([]);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px'
        }} />
        {loadingMessage}
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%' }}>
      {/* Header with scope info and search */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {showScopeInfo && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <Shield size={16} style={{ color: '#6b7280' }} />
            <span style={{ color: '#374151', fontWeight: '500' }}>
              Data Scope:
            </span>
            {filteredResult.appliedScopes.map((scope, index) => (
              <div key={scope} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <ScopeIcon scope={scope} size={12} />
                {getScopeDescription(scope).split(' - ')[0]}
                {index < filteredResult.appliedScopes.length - 1 && ','}
              </div>
            ))}
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              ({filteredResult.totalCount} items)
            </span>
          </div>
        )}

        {showSearch && searchFields.length > 0 && (
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <Search 
              size={16} 
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} 
            />
            <input
              type="text"
              placeholder={`Search ${searchFields.join(', ')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '32px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              {showSelection && (
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #e5e7eb',
                  width: '40px'
                }}>
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedItems.size === paginatedData.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.key}
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: column.width,
                    cursor: column.sortable ? 'pointer' : 'default'
                  }}
                  className={column.className}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showSelection ? 1 : 0)}
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}
                >
                  {filteredResult.appliedScopes.includes('none') ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <EyeOff size={20} />
                      Access denied - insufficient data scope permissions
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Eye size={20} />
                      {emptyMessage}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const itemId = item.id || item._id || String(item);
                const isSelected = selectedItems.has(itemId);
                
                return (
                  <tr
                    key={itemId}
                    style={{
                      borderBottom: index < paginatedData.length - 1 ? '1px solid #f3f4f6' : 'none',
                      cursor: onRowClick ? 'pointer' : 'default',
                      backgroundColor: isSelected ? '#f0f9ff' : 'transparent'
                    }}
                    onClick={() => onRowClick?.(item)}
                  >
                    {showSelection && (
                      <td style={{ padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectItem(itemId, e.target.checked);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    {columns.map(column => (
                      <td
                        key={column.key}
                        style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151'
                        }}
                        className={column.className}
                      >
                        {column.render
                          ? column.render(item[column.key], item, index)
                          : item[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'between',
          alignItems: 'center',
          marginTop: '16px',
          gap: '16px'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, filteredResult.data.length)} of {filteredResult.data.length} results
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: currentPage === 0 ? '#f9fafb' : 'white',
                color: currentPage === 0 ? '#9ca3af' : '#374151',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <span style={{ fontSize: '14px', color: '#6b7280', padding: '0 8px' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            
            <button
              disabled={currentPage === totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: currentPage === totalPages - 1 ? '#f9fafb' : 'white',
                color: currentPage === totalPages - 1 ? '#9ca3af' : '#374151',
                cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScopedDataTable;
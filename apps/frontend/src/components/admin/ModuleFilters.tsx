import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface ModuleFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalModules: number;
  filteredCount: number;
}

const ModuleFilters: React.FC<ModuleFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortChange,
  totalModules,
  filteredCount
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Status', count: 0 },
    { value: 'active', label: 'Active', count: 0 },
    { value: 'trial', label: 'Trial', count: 0 },
    { value: 'inactive', label: 'Inactive', count: 0 },
    { value: 'suspended', label: 'Suspended', count: 0 }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'core', label: 'Core' },
    { value: 'business', label: 'Business' },
    { value: 'integration', label: 'Integration' },
    { value: 'analytics', label: 'Analytics' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'status', label: 'Status' },
    { value: 'usage', label: 'Usage %' },
    { value: 'users', label: 'Active Users' },
    { value: 'lastActivity', label: 'Last Activity' }
  ];

  const clearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onCategoryFilterChange('all');
    onSortChange('name');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'name';

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px'
    }}>
      {/* Results Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          {filteredCount === totalModules ? (
            `Showing all ${totalModules} modules`
          ) : (
            `Showing ${filteredCount} of ${totalModules} modules`
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#6b7280',
              fontSize: '12px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'end'
      }}>
        {/* Search */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Search Modules
          </label>
          <div style={{ position: 'relative' }}>
            <Search 
              size={16} 
              color="#6b7280"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Filter size={14} />
            Active Filters:
          </div>
          
          {searchTerm && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              Search: "{searchTerm}"
              <button
                onClick={() => onSearchChange('')}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} color="#2563eb" />
              </button>
            </div>
          )}

          {statusFilter !== 'all' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              Status: {statusFilter}
              <button
                onClick={() => onStatusFilterChange('all')}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} color="#166534" />
              </button>
            </div>
          )}

          {categoryFilter !== 'all' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: '#fffbeb',
              color: '#d97706',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              Category: {categoryFilter}
              <button
                onClick={() => onCategoryFilterChange('all')}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} color="#d97706" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleFilters;
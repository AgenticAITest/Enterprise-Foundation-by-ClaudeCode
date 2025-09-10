import React, { useState } from 'react';
import { useDataScope, DataScopeLevel } from '@/contexts/DataScopeContext';
import { useDataFilterConfig } from '@/hooks/useDataFiltering';
import { 
  Filter, 
  ChevronDown, 
  Check, 
  X, 
  Globe, 
  Building, 
  Users, 
  User, 
  EyeOff,
  Info,
  AlertTriangle
} from 'lucide-react';

export interface DataScopeFilterProps {
  resource: string;
  action: string;
  onScopeChange?: (scopes: DataScopeLevel[]) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  showAdvanced?: boolean;
  className?: string;
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
  
  const colors = {
    global: '#dc2626',     // red
    tenant: '#f59e0b',     // amber
    department: '#3b82f6', // blue
    team: '#10b981',       // emerald
    own: '#8b5cf6',        // violet
    none: '#6b7280'        // gray
  };
  
  const Icon = icons[scope];
  return <Icon size={size} style={{ color: colors[scope] }} />;
};

export const DataScopeFilter: React.FC<DataScopeFilterProps> = ({
  resource,
  action,
  onScopeChange,
  onFilterChange,
  showAdvanced = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<Set<DataScopeLevel>>(new Set());
  
  const { getScopeDescription, getScopeHierarchy, userScope } = useDataScope();
  const filterConfig = useDataFilterConfig(resource, action);

  const availableScopes = getScopeHierarchy().filter(scope => 
    scope !== 'none' && filterConfig.scopes.includes(scope)
  );

  const handleScopeToggle = (scope: DataScopeLevel) => {
    const newSelection = new Set(selectedScopes);
    if (newSelection.has(scope)) {
      newSelection.delete(scope);
    } else {
      newSelection.add(scope);
    }
    setSelectedScopes(newSelection);
    onScopeChange?.(Array.from(newSelection));
  };

  const clearFilters = () => {
    setSelectedScopes(new Set());
    onScopeChange?.([]);
    onFilterChange?.({});
  };

  if (!filterConfig.hasAccess) {
    return (
      <div className={className} style={{
        padding: '16px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#dc2626'
      }}>
        <AlertTriangle size={16} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>
          No data access permissions for {resource}.{action}
        </span>
      </div>
    );
  }

  return (
    <div className={className} style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      {/* Filter Header */}
      <div 
        style={{
          padding: '12px 16px',
          borderBottom: isExpanded ? '1px solid #f3f4f6' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Data Scope Filter
          </span>
          <div style={{
            padding: '2px 6px',
            backgroundColor: '#f3f4f6',
            borderRadius: '10px',
            fontSize: '11px',
            color: '#6b7280'
          }}>
            {filterConfig.scopes.length} scope{filterConfig.scopes.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedScopes.size > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
          <ChevronDown 
            size={16} 
            style={{ 
              color: '#6b7280',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} 
          />
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div style={{ padding: '16px' }}>
          {/* Current Access Level */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              Current Access Level
            </div>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1d4ed8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={14} />
                <span>
                  You have {filterConfig.scopes.length > 1 ? 'multiple access levels' : filterConfig.scopes[0]} access 
                  for {resource}.{action}
                </span>
              </div>
            </div>
          </div>

          {/* Available Scopes */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              Available Data Scopes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableScopes.map(scope => {
                const isSelected = selectedScopes.has(scope);
                const isUserScope = userScope?.scopes.includes(scope);
                
                return (
                  <label
                    key={scope}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#eff6ff' : 'white',
                      cursor: isUserScope ? 'pointer' : 'not-allowed',
                      opacity: isUserScope ? 1 : 0.6,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => isUserScope && handleScopeToggle(scope)}
                      disabled={!isUserScope}
                      style={{ 
                        cursor: isUserScope ? 'pointer' : 'not-allowed',
                        margin: 0
                      }}
                    />
                    
                    <ScopeIcon scope={scope} />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: isSelected ? '#1d4ed8' : '#374151'
                      }}>
                        {getScopeDescription(scope).split(' - ')[0]}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {getScopeDescription(scope).split(' - ')[1]}
                      </div>
                    </div>
                    
                    {!isUserScope && (
                      <div style={{
                        padding: '2px 6px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        fontSize: '10px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        No Access
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* User Context Info */}
          {showAdvanced && userScope && (
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                User Context:
              </div>
              <div>Tenant: {userScope.tenantId}</div>
              {userScope.departmentId && <div>Department: {userScope.departmentId}</div>}
              {userScope.teamId && <div>Team: {userScope.teamId}</div>}
              <div>Available Scopes: {userScope.scopes.join(', ')}</div>
            </div>
          )}

          {/* Applied Filters Summary */}
          {filterConfig.filter && Object.keys(filterConfig.filter.filters).length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                System Applied Filters
              </div>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fed7aa',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#92400e',
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(filterConfig.filter.filters, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataScopeFilter;
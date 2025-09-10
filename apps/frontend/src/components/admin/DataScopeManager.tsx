import React, { useState, useEffect, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Shield, Plus, Edit, Trash2, Copy, Eye, Search, Filter, ChevronDown,
  ChevronRight, AlertTriangle, Check, X, Database, Lock, Unlock,
  Globe, Building, Users, User, Save, RotateCcw
} from 'lucide-react';

interface DataScope {
  id: string;
  name: string;
  type: 'global' | 'company' | 'department' | 'team' | 'personal';
  parentId?: string;
  description: string;
  rules: ScopeRule[];
  userIds: string[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

interface ScopeRule {
  id: string;
  moduleCode: string;
  resource: string;
  filterType: 'owner' | 'department' | 'team' | 'location' | 'custom';
  filterValue?: string;
  sqlCondition?: string;
  isActive: boolean;
}

interface DataScopeManagerProps {
  organizationalUnits: any[];
  onScopeChange?: (scopes: DataScope[]) => void;
}

const DataScopeManager: React.FC<DataScopeManagerProps> = ({
  organizationalUnits = [],
  onScopeChange
}) => {
  const { tenantModules, tenantUsers } = useTenantAdmin();
  
  const [dataScopes, setDataScopes] = useState<DataScope[]>([]);
  const [selectedScope, setSelectedScope] = useState<DataScope | null>(null);
  const [editingScope, setEditingScope] = useState<DataScope | null>(null);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedScopes, setExpandedScopes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'rules' | 'preview'>('basic');

  // Mock data scopes
  const mockDataScopes: DataScope[] = [
    {
      id: 'scope-global',
      name: 'Global Access',
      type: 'global',
      description: 'Full access to all tenant data across all modules',
      rules: [
        {
          id: 'rule-1',
          moduleCode: 'core',
          resource: '*',
          filterType: 'custom',
          sqlCondition: '1=1',
          isActive: true
        }
      ],
      userIds: ['user-1'], // Super admin only
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'system'
    },
    {
      id: 'scope-company',
      name: 'Company-wide Access',
      type: 'company',
      description: 'Access to all data within the company',
      rules: [
        {
          id: 'rule-2',
          moduleCode: 'core',
          resource: '*',
          filterType: 'custom',
          sqlCondition: 'tenant_id = current_tenant_id()',
          isActive: true
        }
      ],
      userIds: ['user-1'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'scope-sales-dept',
      name: 'Sales Department',
      type: 'department',
      parentId: 'scope-company',
      description: 'Access limited to sales department data',
      rules: [
        {
          id: 'rule-3',
          moduleCode: 'crm',
          resource: 'customers',
          filterType: 'department',
          filterValue: 'sales',
          isActive: true
        },
        {
          id: 'rule-4',
          moduleCode: 'crm',
          resource: 'opportunities',
          filterType: 'department',
          filterValue: 'sales',
          isActive: true
        }
      ],
      userIds: ['user-2', 'user-3'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'scope-marketing-dept',
      name: 'Marketing Department',
      type: 'department',
      parentId: 'scope-company',
      description: 'Access limited to marketing department data',
      rules: [
        {
          id: 'rule-5',
          moduleCode: 'crm',
          resource: 'campaigns',
          filterType: 'department',
          filterValue: 'marketing',
          isActive: true
        },
        {
          id: 'rule-6',
          moduleCode: 'crm',
          resource: 'leads',
          filterType: 'department',
          filterValue: 'marketing',
          isActive: true
        }
      ],
      userIds: ['user-4', 'user-5'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'scope-personal',
      name: 'Personal Data Only',
      type: 'personal',
      parentId: 'scope-sales-dept',
      description: 'Access only to user\'s own data',
      rules: [
        {
          id: 'rule-7',
          moduleCode: '*',
          resource: '*',
          filterType: 'owner',
          filterValue: 'current_user_id',
          isActive: true
        }
      ],
      userIds: ['user-6', 'user-7', 'user-8'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin'
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    setDataScopes(mockDataScopes);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onScopeChange) {
      onScopeChange(dataScopes);
    }
  }, [dataScopes, onScopeChange]);

  // Build scope hierarchy
  const buildScopeTree = (scopes: DataScope[], parentId?: string): any[] => {
    return scopes
      .filter(scope => scope.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(scope => ({
        ...scope,
        children: buildScopeTree(scopes, scope.id)
      }));
  };

  const filteredScopes = dataScopes.filter(scope => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!scope.name.toLowerCase().includes(searchLower) &&
          !scope.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    if (filterType !== 'all' && scope.type !== filterType) {
      return false;
    }
    
    return true;
  });

  const scopeTree = buildScopeTree(filteredScopes);

  const getScopeIcon = (type: string) => {
    switch (type) {
      case 'global': return <Globe size={16} />;
      case 'company': return <Building size={16} />;
      case 'department': return <Users size={16} />;
      case 'team': return <Users size={16} />;
      case 'personal': return <User size={16} />;
      default: return <Shield size={16} />;
    }
  };

  const getScopeColor = (type: string) => {
    switch (type) {
      case 'global': return '#ef4444';
      case 'company': return '#3b82f6';
      case 'department': return '#10b981';
      case 'team': return '#f59e0b';
      case 'personal': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const toggleExpansion = (scopeId: string) => {
    const newExpanded = new Set(expandedScopes);
    if (newExpanded.has(scopeId)) {
      newExpanded.delete(scopeId);
    } else {
      newExpanded.add(scopeId);
    }
    setExpandedScopes(newExpanded);
  };

  const handleCreateScope = () => {
    setEditingScope({
      id: '',
      name: '',
      type: 'department',
      description: '',
      rules: [],
      userIds: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user'
    });
    setActiveTab('basic');
    setShowScopeModal(true);
  };

  const handleEditScope = (scope: DataScope) => {
    setEditingScope({ ...scope });
    setActiveTab('basic');
    setShowScopeModal(true);
  };

  const handleCloneScope = (scope: DataScope) => {
    setEditingScope({
      ...scope,
      id: '',
      name: `${scope.name} (Copy)`,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user'
    });
    setActiveTab('basic');
    setShowScopeModal(true);
  };

  const handleDeleteScope = (scopeId: string) => {
    // Check if scope has children
    const hasChildren = dataScopes.some(s => s.parentId === scopeId);
    if (hasChildren) {
      setError('Cannot delete scope that has child scopes. Please remove or reassign children first.');
      return;
    }

    // Check if scope has users assigned
    const scope = dataScopes.find(s => s.id === scopeId);
    if (scope && scope.userIds.length > 0) {
      if (!window.confirm(`This scope is assigned to ${scope.userIds.length} users. Delete anyway?`)) {
        return;
      }
    }

    if (window.confirm('Are you sure you want to delete this data scope?')) {
      setDataScopes(scopes => scopes.filter(s => s.id !== scopeId));
      if (selectedScope?.id === scopeId) {
        setSelectedScope(null);
      }
    }
  };

  const handleSaveScope = () => {
    if (!editingScope || !editingScope.name.trim()) {
      setError('Scope name is required');
      return;
    }

    if (editingScope.rules.length === 0) {
      setError('At least one rule is required');
      return;
    }

    try {
      if (editingScope.id) {
        // Update existing
        setDataScopes(scopes => 
          scopes.map(s => s.id === editingScope.id ? editingScope : s)
        );
      } else {
        // Create new
        const newScope: DataScope = {
          ...editingScope,
          id: `scope-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        setDataScopes(scopes => [...scopes, newScope]);
      }
      
      setShowScopeModal(false);
      setEditingScope(null);
      setError(null);
    } catch (err) {
      setError('Failed to save data scope');
    }
  };

  const handleAddRule = () => {
    if (!editingScope) return;
    
    const newRule: ScopeRule = {
      id: `rule-${Date.now()}`,
      moduleCode: tenantModules[0]?.moduleCode || 'core',
      resource: '*',
      filterType: 'owner',
      isActive: true
    };
    
    setEditingScope({
      ...editingScope,
      rules: [...editingScope.rules, newRule]
    });
  };

  const handleUpdateRule = (ruleIndex: number, updates: Partial<ScopeRule>) => {
    if (!editingScope) return;
    
    const updatedRules = [...editingScope.rules];
    updatedRules[ruleIndex] = { ...updatedRules[ruleIndex], ...updates };
    
    setEditingScope({
      ...editingScope,
      rules: updatedRules
    });
  };

  const handleRemoveRule = (ruleIndex: number) => {
    if (!editingScope) return;
    
    setEditingScope({
      ...editingScope,
      rules: editingScope.rules.filter((_, index) => index !== ruleIndex)
    });
  };

  const renderScopeTree = (scopes: any[], level = 0) => {
    return scopes.map((scope) => {
      const isExpanded = expandedScopes.has(scope.id);
      const hasChildren = scope.children && scope.children.length > 0;
      const isSelected = selectedScope?.id === scope.id;

      return (
        <div key={scope.id} style={{ marginLeft: `${level * 16}px` }}>
          {/* Scope Row */}
          <div
            onClick={() => setSelectedScope(scope)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
              borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              borderRadius: '4px',
              margin: '1px 0'
            }}
          >
            {/* Expand/Collapse */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpansion(scope.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: '#6b7280'
                }}
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            ) : (
              <div style={{ width: '16px' }} />
            )}

            {/* Icon */}
            <div style={{ color: getScopeColor(scope.type) }}>
              {getScopeIcon(scope.type)}
            </div>

            {/* Name */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: isSelected ? '500' : 'normal',
                color: '#1f2937'
              }}>
                {scope.name}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                textTransform: 'capitalize'
              }}>
                {scope.type} • {scope.rules.length} rules • {scope.userIds.length} users
              </div>
            </div>

            {/* Status */}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: scope.isActive ? '#10b981' : '#6b7280'
            }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '2px', opacity: isSelected ? 1 : 0 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditScope(scope);
                }}
                style={{
                  padding: '3px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  color: '#6b7280'
                }}
                title="Edit scope"
              >
                <Edit size={12} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloneScope(scope);
                }}
                style={{
                  padding: '3px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  color: '#6b7280'
                }}
                title="Clone scope"
              >
                <Copy size={12} />
              </button>
              
              {scope.id !== 'scope-global' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteScope(scope.id);
                  }}
                  style={{
                    padding: '3px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    color: '#ef4444'
                  }}
                  title="Delete scope"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Children */}
          {isExpanded && hasChildren && renderScopeTree(scope.children, level + 1)}
        </div>
      );
    });
  };

  const renderRuleEditor = () => {
    if (!editingScope) return null;

    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: 0 }}>
            Data Access Rules ({editingScope.rules.length})
          </h4>
          <button
            onClick={handleAddRule}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <Plus size={12} />
            Add Rule
          </button>
        </div>

        {editingScope.rules.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '2px dashed #d1d5db'
          }}>
            <Database size={32} style={{ margin: '0 auto 8px', color: '#9ca3af' }} />
            <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
              No data access rules defined. Click "Add Rule" to start.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {editingScope.rules.map((rule, index) => (
              <div
                key={rule.id}
                style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              >
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>
                      Module
                    </label>
                    <select
                      value={rule.moduleCode}
                      onChange={(e) => handleUpdateRule(index, { moduleCode: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}
                    >
                      <option value="*">All Modules</option>
                      {tenantModules.map(module => (
                        <option key={module.moduleCode} value={module.moduleCode}>
                          {module.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>
                      Resource
                    </label>
                    <input
                      type="text"
                      value={rule.resource}
                      onChange={(e) => handleUpdateRule(index, { resource: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}
                      placeholder="customers, orders, *"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>
                      Filter Type
                    </label>
                    <select
                      value={rule.filterType}
                      onChange={(e) => handleUpdateRule(index, { filterType: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}
                    >
                      <option value="owner">Owner Only</option>
                      <option value="department">Department</option>
                      <option value="team">Team</option>
                      <option value="location">Location</option>
                      <option value="custom">Custom SQL</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleRemoveRule(index)}
                    style={{
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      borderRadius: '3px'
                    }}
                    title="Remove rule"
                  >
                    <X size={14} />
                  </button>
                </div>

                {(rule.filterType === 'department' || rule.filterType === 'team' || rule.filterType === 'location') && (
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>
                      Filter Value
                    </label>
                    <input
                      type="text"
                      value={rule.filterValue || ''}
                      onChange={(e) => handleUpdateRule(index, { filterValue: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}
                      placeholder={`Enter ${rule.filterType} identifier`}
                    />
                  </div>
                )}

                {rule.filterType === 'custom' && (
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>
                      SQL Condition
                    </label>
                    <textarea
                      value={rule.sqlCondition || ''}
                      onChange={(e) => handleUpdateRule(index, { sqlCondition: e.target.value })}
                      style={{
                        width: '100%',
                        minHeight: '50px',
                        padding: '4px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                      placeholder="department_id = current_user_department_id()"
                    />
                  </div>
                )}

                <div style={{ marginTop: '8px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={(e) => handleUpdateRule(index, { isActive: e.target.checked })}
                      style={{ transform: 'scale(0.8)' }}
                    />
                    Active
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!editingScope) return null;

    const exampleQueries = editingScope.rules.map(rule => {
      let condition = '';
      switch (rule.filterType) {
        case 'owner':
          condition = 'created_by = current_user_id()';
          break;
        case 'department':
          condition = `department_id = '${rule.filterValue}'`;
          break;
        case 'team':
          condition = `team_id = '${rule.filterValue}'`;
          break;
        case 'location':
          condition = `location_id = '${rule.filterValue}'`;
          break;
        case 'custom':
          condition = rule.sqlCondition || '';
          break;
      }

      return {
        module: rule.moduleCode,
        resource: rule.resource,
        query: `SELECT * FROM ${rule.resource} WHERE ${condition}`,
        description: `${rule.filterType} filter on ${rule.moduleCode}.${rule.resource}`
      };
    });

    return (
      <div style={{ padding: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: '0 0 12px 0' }}>
          Generated SQL Preview
        </h4>
        
        {exampleQueries.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '12px' }}>No rules to preview</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {exampleQueries.map((query, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {query.description}
                </div>
                <code style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#374151',
                  backgroundColor: 'white',
                  padding: '8px',
                  borderRadius: '3px',
                  border: '1px solid #e5e7eb'
                }}>
                  {query.query}
                </code>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fed7aa',
          borderRadius: '6px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px'
          }}>
            <AlertTriangle size={14} color="#f59e0b" />
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#92400e' }}>
              Preview Notice
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#92400e', margin: 0 }}>
            This is a simplified preview. Actual implementation will include proper parameter binding,
            tenant isolation, and security validations.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '600px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Left Panel - Scope Tree */}
      <div style={{
        width: '60%',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Data Scopes
            </h3>
            
            <button
              onClick={handleCreateScope}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              <Plus size={14} />
              Create Scope
            </button>
          </div>

          {/* Search and Filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={14} 
                style={{ 
                  position: 'absolute', 
                  left: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#6b7280' 
                }} 
              />
              <input
                type="text"
                placeholder="Search scopes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 6px 6px 28px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="all">All Types</option>
              <option value="global">Global</option>
              <option value="company">Company</option>
              <option value="department">Department</option>
              <option value="team">Team</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </div>

        {/* Scope Tree */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {scopeTree.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
                No data scopes found
              </h4>
              <p style={{ margin: 0, fontSize: '12px' }}>
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Click "Create Scope" to define your first data scope'
                }
              </p>
            </div>
          ) : (
            renderScopeTree(scopeTree)
          )}
        </div>
      </div>

      {/* Right Panel - Scope Details */}
      <div style={{ width: '40%', display: 'flex', flexDirection: 'column' }}>
        {selectedScope ? (
          <>
            {/* Details Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{ color: getScopeColor(selectedScope.type) }}>
                  {getScopeIcon(selectedScope.type)}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  {selectedScope.name}
                </h3>
              </div>
              
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {selectedScope.description}
              </div>
            </div>

            {/* Details Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {/* Basic Info */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                  Basic Information
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>Type: </span>
                    <span style={{ color: '#374151', textTransform: 'capitalize' }}>{selectedScope.type}</span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Status: </span>
                    <span style={{ color: selectedScope.isActive ? '#10b981' : '#ef4444' }}>
                      {selectedScope.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Created: </span>
                    <span style={{ color: '#374151' }}>
                      {new Date(selectedScope.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                  Data Access Rules ({selectedScope.rules.length})
                </h4>
                
                {selectedScope.rules.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>No rules defined</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedScope.rules.map((rule, index) => (
                      <div
                        key={rule.id}
                        style={{
                          padding: '8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '4px',
                          border: '1px solid #f3f4f6'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                          {rule.moduleCode}.{rule.resource}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'capitalize' }}>
                          {rule.filterType} filter
                          {rule.filterValue && ` (${rule.filterValue})`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Users */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                  Assigned Users ({selectedScope.userIds.length})
                </h4>
                
                {selectedScope.userIds.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>No users assigned</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedScope.userIds.slice(0, 5).map(userId => {
                      const user = tenantUsers.find(u => u.id === userId);
                      return user ? (
                        <div
                          key={userId}
                          style={{
                            padding: '6px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '3px',
                            fontSize: '11px',
                            color: '#374151'
                          }}
                        >
                          {user.name}
                        </div>
                      ) : null;
                    })}
                    
                    {selectedScope.userIds.length > 5 && (
                      <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                        +{selectedScope.userIds.length - 5} more users
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            textAlign: 'center',
            padding: '40px'
          }}>
            <div>
              <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
                No scope selected
              </h4>
              <p style={{ margin: 0, fontSize: '12px' }}>
                Select a data scope from the tree to view its details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scope Editor Modal */}
      {showScopeModal && editingScope && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowScopeModal(false);
              setEditingScope(null);
              setError(null);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '600px',
              maxHeight: '80vh',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {editingScope.id ? 'Edit Data Scope' : 'Create Data Scope'}
              </h3>
            </div>

            {/* Modal Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f9fafb'
            }}>
              {[
                { key: 'basic', label: 'Basic Info', icon: Shield },
                { key: 'rules', label: 'Access Rules', icon: Database },
                { key: 'preview', label: 'Preview', icon: Eye }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 16px',
                    backgroundColor: activeTab === key ? 'white' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === key ? '2px solid #3b82f6' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: activeTab === key ? '#3b82f6' : '#6b7280'
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {error && (
                <div style={{
                  margin: '16px',
                  padding: '8px 12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '12px'
                }}>
                  {error}
                </div>
              )}

              {activeTab === 'basic' && (
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Name *
                      </label>
                      <input
                        type="text"
                        value={editingScope.name}
                        onChange={(e) => setEditingScope({ ...editingScope, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        placeholder="Enter scope name"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Type
                      </label>
                      <select
                        value={editingScope.type}
                        onChange={(e) => setEditingScope({ ...editingScope, type: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="global">Global</option>
                        <option value="company">Company</option>
                        <option value="department">Department</option>
                        <option value="team">Team</option>
                        <option value="personal">Personal</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Description
                    </label>
                    <textarea
                      value={editingScope.description}
                      onChange={(e) => setEditingScope({ ...editingScope, description: e.target.value })}
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder="Describe what data this scope provides access to"
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={editingScope.isActive}
                        onChange={(e) => setEditingScope({ ...editingScope, isActive: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'rules' && renderRuleEditor()}
              {activeTab === 'preview' && renderPreview()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowScopeModal(false);
                  setEditingScope(null);
                  setError(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveScope}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {editingScope.id ? 'Save Changes' : 'Create Scope'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataScopeManager;
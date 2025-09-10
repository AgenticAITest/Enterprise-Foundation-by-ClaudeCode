import React, { useState, useEffect, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Settings, Shield, Database, Eye, Edit, Plus, X, Save, RotateCcw,
  AlertTriangle, Check, ChevronDown, ChevronRight, Lock, Unlock,
  Filter, Search, Code, Play, Pause
} from 'lucide-react';

interface AccessRule {
  id: string;
  moduleCode: string;
  resource: string;
  actions: string[];
  conditions: AccessCondition[];
  priority: number;
  isActive: boolean;
  description: string;
}

interface AccessCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'custom';
  value: string | string[];
  sqlExpression?: string;
}

interface AccessLevelControlsProps {
  dataScopes: any[];
  selectedScopeId?: string;
  onRulesChange?: (rules: AccessRule[]) => void;
}

const AccessLevelControls: React.FC<AccessLevelControlsProps> = ({
  dataScopes = [],
  selectedScopeId,
  onRulesChange
}) => {
  const { tenantModules } = useTenantAdmin();
  
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [editingRule, setEditingRule] = useState<AccessRule | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock access rules data
  const mockAccessRules: AccessRule[] = [
    {
      id: 'rule-1',
      moduleCode: 'crm',
      resource: 'customers',
      actions: ['read', 'create', 'update'],
      conditions: [
        {
          id: 'cond-1',
          field: 'department_id',
          operator: 'equals',
          value: 'current_user_department'
        }
      ],
      priority: 1,
      isActive: true,
      description: 'Department members can manage customers in their department'
    },
    {
      id: 'rule-2',
      moduleCode: 'crm',
      resource: 'opportunities',
      actions: ['read', 'update'],
      conditions: [
        {
          id: 'cond-2',
          field: 'assigned_to',
          operator: 'equals',
          value: 'current_user_id'
        },
        {
          id: 'cond-3',
          field: 'status',
          operator: 'not_in',
          value: ['closed', 'cancelled']
        }
      ],
      priority: 2,
      isActive: true,
      description: 'Users can read/update their own active opportunities'
    },
    {
      id: 'rule-3',
      moduleCode: 'finance',
      resource: 'invoices',
      actions: ['read'],
      conditions: [
        {
          id: 'cond-4',
          field: 'amount',
          operator: 'custom',
          value: '',
          sqlExpression: 'amount <= get_user_approval_limit(current_user_id)'
        }
      ],
      priority: 3,
      isActive: true,
      description: 'Users can view invoices within their approval limit'
    },
    {
      id: 'rule-4',
      moduleCode: 'hr',
      resource: 'employee_records',
      actions: ['read'],
      conditions: [
        {
          id: 'cond-5',
          field: 'employee_id',
          operator: 'equals',
          value: 'current_user_id'
        }
      ],
      priority: 4,
      isActive: true,
      description: 'Employees can only access their own HR records'
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    setAccessRules(mockAccessRules);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onRulesChange) {
      onRulesChange(accessRules);
    }
  }, [accessRules, onRulesChange]);

  // Filter rules based on selected scope
  const scopeFilteredRules = useMemo(() => {
    if (!selectedScopeId) return accessRules;
    
    // In a real implementation, this would filter rules based on the scope's context
    // For now, we'll show all rules as they would apply to the selected scope
    return accessRules;
  }, [accessRules, selectedScopeId]);

  // Apply search and filters
  const filteredRules = useMemo(() => {
    return scopeFilteredRules.filter(rule => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!rule.description.toLowerCase().includes(searchLower) &&
            !rule.resource.toLowerCase().includes(searchLower) &&
            !rule.moduleCode.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Module filter
      if (moduleFilter !== 'all' && rule.moduleCode !== moduleFilter) {
        return false;
      }

      // Active filter
      if (activeFilter === 'active' && !rule.isActive) return false;
      if (activeFilter === 'inactive' && rule.isActive) return false;

      return true;
    });
  }, [scopeFilteredRules, searchTerm, moduleFilter, activeFilter]);

  const toggleExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const handleCreateRule = () => {
    setEditingRule({
      id: '',
      moduleCode: tenantModules[0]?.moduleCode || 'core',
      resource: '',
      actions: [],
      conditions: [],
      priority: Math.max(...accessRules.map(r => r.priority), 0) + 1,
      isActive: true,
      description: ''
    });
    setShowRuleModal(true);
  };

  const handleEditRule = (rule: AccessRule) => {
    setEditingRule({ ...rule });
    setShowRuleModal(true);
  };

  const handleSaveRule = () => {
    if (!editingRule || !editingRule.resource.trim() || editingRule.actions.length === 0) {
      setError('Resource and at least one action are required');
      return;
    }

    try {
      if (editingRule.id) {
        // Update existing
        setAccessRules(rules => 
          rules.map(r => r.id === editingRule.id ? editingRule : r)
        );
      } else {
        // Create new
        const newRule: AccessRule = {
          ...editingRule,
          id: `rule-${Date.now()}`
        };
        setAccessRules(rules => [...rules, newRule]);
      }
      
      setShowRuleModal(false);
      setEditingRule(null);
      setError(null);
    } catch (err) {
      setError('Failed to save access rule');
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this access rule?')) {
      setAccessRules(rules => rules.filter(r => r.id !== ruleId));
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setAccessRules(rules =>
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const handleAddCondition = () => {
    if (!editingRule) return;
    
    const newCondition: AccessCondition = {
      id: `cond-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: ''
    };
    
    setEditingRule({
      ...editingRule,
      conditions: [...editingRule.conditions, newCondition]
    });
  };

  const handleUpdateCondition = (conditionIndex: number, updates: Partial<AccessCondition>) => {
    if (!editingRule) return;
    
    const updatedConditions = [...editingRule.conditions];
    updatedConditions[conditionIndex] = { ...updatedConditions[conditionIndex], ...updates };
    
    setEditingRule({
      ...editingRule,
      conditions: updatedConditions
    });
  };

  const handleRemoveCondition = (conditionIndex: number) => {
    if (!editingRule) return;
    
    setEditingRule({
      ...editingRule,
      conditions: editingRule.conditions.filter((_, index) => index !== conditionIndex)
    });
  };

  const runRuleTest = async (rule: AccessRule) => {
    // Mock test execution
    setTestMode(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const mockResults = [
        {
          scenario: 'User in Sales Department',
          userId: 'user-123',
          resource: rule.resource,
          action: rule.actions[0],
          result: 'ALLOWED',
          explanation: 'User department matches rule condition'
        },
        {
          scenario: 'User in Marketing Department',
          userId: 'user-456', 
          resource: rule.resource,
          action: rule.actions[0],
          result: 'DENIED',
          explanation: 'User department does not match rule condition'
        },
        {
          scenario: 'Admin User',
          userId: 'admin-789',
          resource: rule.resource,
          action: rule.actions[0],
          result: 'ALLOWED',
          explanation: 'Admin users have global access'
        }
      ];
      
      setTestResults(mockResults);
    } catch (error) {
      setError('Failed to run rule test');
    } finally {
      setTestMode(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'read': return <Eye size={12} />;
      case 'create': return <Plus size={12} />;
      case 'update': return <Edit size={12} />;
      case 'delete': return <X size={12} />;
      default: return <Settings size={12} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'read': return '#3b82f6';
      case 'create': return '#10b981';
      case 'update': return '#f59e0b';
      case 'delete': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const selectedScope = selectedScopeId ? dataScopes.find(s => s.id === selectedScopeId) : null;

  return (
    <div style={{ 
      height: '700px', 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      overflow: 'hidden',
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
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Access Level Controls
            </h3>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {selectedScope ? `Scope: ${selectedScope.name}` : 'Fine-tune data access permissions within scopes'}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setTestMode(!testMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: testMode ? '#ef4444' : '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {testMode ? <Pause size={12} /> : <Play size={12} />}
              {testMode ? 'Exit Test' : 'Test Mode'}
            </button>
            
            <button
              onClick={handleCreateRule}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
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
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={12} 
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
              placeholder="Search rules..."
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
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="all">All Modules</option>
            {tenantModules.map(module => (
              <option key={module.moduleCode} value={module.moduleCode}>
                {module.name}
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="all">All Rules</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {filteredRules.length} rules
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredRules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
              No access rules found
            </h4>
            <p style={{ margin: 0, fontSize: '12px' }}>
              {searchTerm || moduleFilter !== 'all' || activeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first access rule to control data access'
              }
            </p>
          </div>
        ) : (
          <div style={{ padding: '8px' }}>
            {filteredRules
              .sort((a, b) => a.priority - b.priority)
              .map((rule) => {
                const isExpanded = expandedRules.has(rule.id);
                
                return (
                  <div
                    key={rule.id}
                    style={{
                      marginBottom: '8px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Rule Header */}
                    <div
                      onClick={() => toggleExpansion(rule.id)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: rule.isActive ? 'white' : '#f9fafb'
                      }}
                    >
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: '#6b7280'
                        }}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {rule.isActive ? <Unlock size={14} color="#10b981" /> : <Lock size={14} color="#6b7280" />}
                        <span style={{
                          fontSize: '12px',
                          color: rule.isActive ? '#10b981' : '#6b7280',
                          fontWeight: '500'
                        }}>
                          Priority {rule.priority}
                        </span>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          {rule.moduleCode}.{rule.resource}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {rule.description}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {rule.actions.map(action => (
                          <div
                            key={action}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              padding: '2px 4px',
                              backgroundColor: getActionColor(action),
                              color: 'white',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: '500'
                            }}
                          >
                            {getActionIcon(action)}
                            {action}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {testMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              runRuleTest(rule);
                            }}
                            style={{
                              padding: '4px',
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                            title="Test rule"
                          >
                            <Play size={12} />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRule(rule.id);
                          }}
                          style={{
                            padding: '4px',
                            backgroundColor: rule.isActive ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                          title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                        >
                          {rule.isActive ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRule(rule);
                          }}
                          style={{
                            padding: '4px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                          title="Edit rule"
                        >
                          <Edit size={12} />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRule(rule.id);
                          }}
                          style={{
                            padding: '4px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                          title="Delete rule"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Rule Details */}
                    {isExpanded && (
                      <div style={{
                        padding: '16px',
                        borderTop: '1px solid #f3f4f6',
                        backgroundColor: '#f9fafb'
                      }}>
                        <h5 style={{ fontSize: '12px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                          Conditions ({rule.conditions.length})
                        </h5>
                        
                        {rule.conditions.length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                            No conditions defined - rule applies to all records
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {rule.conditions.map((condition, index) => (
                              <div
                                key={condition.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 8px',
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {index > 0 && (
                                  <span style={{ 
                                    color: '#6b7280', 
                                    fontSize: '10px',
                                    fontWeight: '500' 
                                  }}>
                                    AND
                                  </span>
                                )}
                                
                                <span style={{ color: '#3b82f6', fontWeight: '500' }}>
                                  {condition.field}
                                </span>
                                
                                <span style={{ color: '#6b7280' }}>
                                  {condition.operator}
                                </span>
                                
                                <span style={{ color: '#10b981' }}>
                                  {condition.operator === 'custom' 
                                    ? condition.sqlExpression 
                                    : Array.isArray(condition.value) 
                                      ? `[${condition.value.join(', ')}]`
                                      : condition.value
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Test Results */}
                        {testResults.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <h5 style={{ fontSize: '12px', fontWeight: '500', color: '#374151', margin: '0 0 6px 0' }}>
                              Test Results
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {testResults.map((result, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '4px 8px',
                                    backgroundColor: result.result === 'ALLOWED' ? '#f0fdf4' : '#fef2f2',
                                    border: `1px solid ${result.result === 'ALLOWED' ? '#bbf7d0' : '#fecaca'}`,
                                    borderRadius: '3px',
                                    fontSize: '11px'
                                  }}
                                >
                                  <span>{result.scenario}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{
                                      color: result.result === 'ALLOWED' ? '#059669' : '#dc2626',
                                      fontWeight: '500'
                                    }}>
                                      {result.result}
                                    </span>
                                    {result.result === 'ALLOWED' ? 
                                      <Check size={12} color="#059669" /> : 
                                      <X size={12} color="#dc2626" />
                                    }
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Rule Editor Modal */}
      {showRuleModal && editingRule && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRuleModal(false);
              setEditingRule(null);
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
                {editingRule.id ? 'Edit Access Rule' : 'Create Access Rule'}
              </h3>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {error && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '12px',
                  marginBottom: '16px'
                }}>
                  {error}
                </div>
              )}

              {/* Basic Rule Info */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: '0 0 12px 0' }}>
                  Basic Information
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Module
                    </label>
                    <select
                      value={editingRule.moduleCode}
                      onChange={(e) => setEditingRule({ ...editingRule, moduleCode: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      {tenantModules.map(module => (
                        <option key={module.moduleCode} value={module.moduleCode}>
                          {module.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Resource
                    </label>
                    <input
                      type="text"
                      value={editingRule.resource}
                      onChange={(e) => setEditingRule({ ...editingRule, resource: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder="customers, orders, etc."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Priority
                    </label>
                    <input
                      type="number"
                      value={editingRule.priority}
                      onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 1 })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      min="1"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Description
                  </label>
                  <textarea
                    value={editingRule.description}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Describe what this rule controls"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Allowed Actions
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['read', 'create', 'update', 'delete', 'export', 'import'].map(action => (
                      <label
                        key={action}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          backgroundColor: editingRule.actions.includes(action) ? getActionColor(action) : '#f3f4f6',
                          color: editingRule.actions.includes(action) ? 'white' : '#6b7280',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editingRule.actions.includes(action)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingRule({
                                ...editingRule,
                                actions: [...editingRule.actions, action]
                              });
                            } else {
                              setEditingRule({
                                ...editingRule,
                                actions: editingRule.actions.filter(a => a !== action)
                              });
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        {getActionIcon(action)}
                        {action}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Access Conditions */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: 0 }}>
                    Access Conditions
                  </h4>
                  <button
                    onClick={handleAddCondition}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    <Plus size={10} />
                    Add Condition
                  </button>
                </div>

                {editingRule.conditions.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '2px dashed #d1d5db'
                  }}>
                    <Database size={24} style={{ margin: '0 auto 8px', color: '#9ca3af' }} />
                    <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                      No conditions defined. Rule will apply to all records.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {editingRule.conditions.map((condition, index) => (
                      <div
                        key={condition.id}
                        style={{
                          padding: '12px',
                          backgroundColor: '#f9fafb',
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
                          <input
                            type="text"
                            value={condition.field}
                            onChange={(e) => handleUpdateCondition(index, { field: e.target.value })}
                            placeholder="Field name"
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />

                          <select
                            value={condition.operator}
                            onChange={(e) => handleUpdateCondition(index, { operator: e.target.value as any })}
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <option value="equals">equals</option>
                            <option value="not_equals">not equals</option>
                            <option value="in">in</option>
                            <option value="not_in">not in</option>
                            <option value="contains">contains</option>
                            <option value="starts_with">starts with</option>
                            <option value="custom">custom SQL</option>
                          </select>

                          <input
                            type="text"
                            value={condition.operator === 'custom' ? condition.sqlExpression || '' : 
                                    Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                            onChange={(e) => {
                              if (condition.operator === 'custom') {
                                handleUpdateCondition(index, { sqlExpression: e.target.value });
                              } else if (condition.operator === 'in' || condition.operator === 'not_in') {
                                handleUpdateCondition(index, { value: e.target.value.split(',').map(v => v.trim()) });
                              } else {
                                handleUpdateCondition(index, { value: e.target.value });
                              }
                            }}
                            placeholder={condition.operator === 'custom' ? 'SQL expression' : 'Value'}
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />

                          <button
                            onClick={() => handleRemoveCondition(index)}
                            style={{
                              padding: '4px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                  setShowRuleModal(false);
                  setEditingRule(null);
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
                onClick={handleSaveRule}
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
                {editingRule.id ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessLevelControls;
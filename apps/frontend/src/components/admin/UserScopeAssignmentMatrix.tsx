import React, { useState, useEffect, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Users, Shield, Search, Filter, Check, X, AlertTriangle, 
  Save, RotateCcw, Eye, Download, Upload, Settings, ChevronDown, ChevronUp
} from 'lucide-react';

interface ScopeAssignment {
  userId: string;
  scopeId: string;
  assignedAt: string;
  assignedBy: string;
  isActive: boolean;
}

interface UserScopeAssignmentMatrixProps {
  dataScopes: any[];
  organizationalUnits: any[];
  onAssignmentsChange?: (assignments: ScopeAssignment[]) => void;
}

const UserScopeAssignmentMatrix: React.FC<UserScopeAssignmentMatrixProps> = ({
  dataScopes = [],
  organizationalUnits = [],
  onAssignmentsChange
}) => {
  const { tenantUsers } = useTenantAdmin();
  
  const [assignments, setAssignments] = useState<ScopeAssignment[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [scopeSearchTerm, setScopeSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // all, assigned, unassigned
  const [scopeFilter, setScopeFilter] = useState('all'); // all, global, department, team, personal
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

  // Mock assignments data
  const mockAssignments: ScopeAssignment[] = [
    {
      userId: 'user-1',
      scopeId: 'scope-global',
      assignedAt: '2024-01-01T00:00:00Z',
      assignedBy: 'system',
      isActive: true
    },
    {
      userId: 'user-2',
      scopeId: 'scope-sales-dept',
      assignedAt: '2024-01-01T00:00:00Z',
      assignedBy: 'admin',
      isActive: true
    },
    {
      userId: 'user-3',
      scopeId: 'scope-sales-dept',
      assignedAt: '2024-01-01T00:00:00Z',
      assignedBy: 'admin',
      isActive: true
    },
    {
      userId: 'user-4',
      scopeId: 'scope-marketing-dept',
      assignedAt: '2024-01-01T00:00:00Z',
      assignedBy: 'admin',
      isActive: true
    },
    {
      userId: 'user-5',
      scopeId: 'scope-marketing-dept',
      assignedAt: '2024-01-01T00:00:00Z',
      assignedBy: 'admin',
      isActive: true
    },
    {
      userId: 'user-6',
      scopeId: 'scope-personal',
      assignedAt: '2024-01-01T00:00:00Z',
      assignedBy: 'admin',
      isActive: true
    },
    {
      userId: 'user-7',
      scopeId: 'scope-personal',
      assignedAt: '2024-01-01T00:00:00Z',
      assignedBy: 'admin',
      isActive: true
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    setAssignments(mockAssignments);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onAssignmentsChange) {
      onAssignmentsChange(assignments);
    }
  }, [assignments, onAssignmentsChange]);

  // Check for conflicts when assignments change
  useEffect(() => {
    checkConflicts();
  }, [assignments, dataScopes]);

  const checkConflicts = () => {
    const foundConflicts: any[] = [];
    
    // Check for users with multiple conflicting scopes
    const userScopeMap = assignments.reduce((acc, assignment) => {
      if (!assignment.isActive) return acc;
      
      if (!acc[assignment.userId]) {
        acc[assignment.userId] = [];
      }
      acc[assignment.userId].push(assignment.scopeId);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(userScopeMap).forEach(([userId, scopeIds]) => {
      if (scopeIds.length > 1) {
        // Check for hierarchical conflicts (e.g., both department and personal scope)
        const scopes = scopeIds.map(id => dataScopes.find(s => s.id === id)).filter(Boolean);
        const hasGlobal = scopes.some(s => s.type === 'global');
        const hasDepartment = scopes.some(s => s.type === 'department');
        const hasPersonal = scopes.some(s => s.type === 'personal');

        if ((hasGlobal && hasDepartment) || (hasDepartment && hasPersonal)) {
          const user = tenantUsers.find(u => u.id === userId);
          foundConflicts.push({
            type: 'hierarchical_conflict',
            userId,
            userName: user?.name || 'Unknown User',
            scopeIds,
            description: 'User has conflicting scope levels assigned'
          });
        }
      }
    });

    setConflicts(foundConflicts);
  };

  // Filter users and scopes
  const filteredUsers = useMemo(() => {
    return tenantUsers.filter(user => {
      // Search filter
      if (userSearchTerm) {
        const searchLower = userSearchTerm.toLowerCase();
        if (!user.name.toLowerCase().includes(searchLower) &&
            !user.email.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Assignment filter
      const hasAssignments = assignments.some(a => a.userId === user.id && a.isActive);
      if (userFilter === 'assigned' && !hasAssignments) return false;
      if (userFilter === 'unassigned' && hasAssignments) return false;

      return true;
    });
  }, [tenantUsers, userSearchTerm, userFilter, assignments]);

  const filteredScopes = useMemo(() => {
    return dataScopes.filter(scope => {
      // Search filter
      if (scopeSearchTerm) {
        const searchLower = scopeSearchTerm.toLowerCase();
        if (!scope.name.toLowerCase().includes(searchLower) &&
            !scope.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (scopeFilter !== 'all' && scope.type !== scopeFilter) {
        return false;
      }

      return scope.isActive;
    });
  }, [dataScopes, scopeSearchTerm, scopeFilter]);

  const isAssigned = (userId: string, scopeId: string): boolean => {
    return assignments.some(a => 
      a.userId === userId && 
      a.scopeId === scopeId && 
      a.isActive
    );
  };

  const toggleAssignment = (userId: string, scopeId: string) => {
    const existingAssignment = assignments.find(a => 
      a.userId === userId && a.scopeId === scopeId
    );

    if (existingAssignment) {
      // Toggle existing assignment
      setAssignments(prev => prev.map(a => 
        a.userId === userId && a.scopeId === scopeId
          ? { ...a, isActive: !a.isActive }
          : a
      ));
    } else {
      // Create new assignment
      const newAssignment: ScopeAssignment = {
        userId,
        scopeId,
        assignedAt: new Date().toISOString(),
        assignedBy: 'current-user',
        isActive: true
      };
      setAssignments(prev => [...prev, newAssignment]);
    }

    setHasChanges(true);
  };

  const handleBulkAssign = () => {
    const newAssignments: ScopeAssignment[] = [];
    
    selectedUsers.forEach(userId => {
      selectedScopes.forEach(scopeId => {
        if (!isAssigned(userId, scopeId)) {
          newAssignments.push({
            userId,
            scopeId,
            assignedAt: new Date().toISOString(),
            assignedBy: 'current-user',
            isActive: true
          });
        }
      });
    });

    setAssignments(prev => [...prev, ...newAssignments]);
    setSelectedUsers(new Set());
    setSelectedScopes(new Set());
    setHasChanges(true);
  };

  const handleBulkUnassign = () => {
    setAssignments(prev => prev.map(assignment => {
      if (selectedUsers.has(assignment.userId) && selectedScopes.has(assignment.scopeId)) {
        return { ...assignment, isActive: false };
      }
      return assignment;
    }));

    setSelectedUsers(new Set());
    setSelectedScopes(new Set());
    setHasChanges(true);
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSelectAllScopes = () => {
    if (selectedScopes.size === filteredScopes.length) {
      setSelectedScopes(new Set());
    } else {
      setSelectedScopes(new Set(filteredScopes.map(s => s.id)));
    }
  };

  const getScopeIcon = (type: string) => {
    switch (type) {
      case 'global': return '🌐';
      case 'company': return '🏢';
      case 'department': return '📋';
      case 'team': return '👥';
      case 'personal': return '👤';
      default: return '🔒';
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

  const getAssignmentStats = () => {
    const totalPossible = filteredUsers.length * filteredScopes.length;
    const totalActive = assignments.filter(a => a.isActive).length;
    const conflictCount = conflicts.length;
    
    return { totalPossible, totalActive, conflictCount };
  };

  const stats = getAssignmentStats();

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
              User-Scope Assignment Matrix
            </h3>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {stats.totalActive} assignments • {conflicts.length} conflicts
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              padding: '2px'
            }}>
              <button
                onClick={() => setViewMode('matrix')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: viewMode === 'matrix' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
              >
                Matrix
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
              >
                List
              </button>
            </div>

            {/* Bulk Actions */}
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              disabled={selectedUsers.size === 0 || selectedScopes.size === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: selectedUsers.size > 0 && selectedScopes.size > 0 ? '#3b82f6' : '#f3f4f6',
                color: selectedUsers.size > 0 && selectedScopes.size > 0 ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedUsers.size > 0 && selectedScopes.size > 0 ? 'pointer' : 'not-allowed',
                fontSize: '12px'
              }}
            >
              <Settings size={12} />
              Bulk Actions
              {showBulkActions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {hasChanges && (
              <button
                onClick={() => {
                  // Reset to original state
                  setAssignments(mockAssignments);
                  setHasChanges(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && (selectedUsers.size > 0 || selectedScopes.size > 0) && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{ fontSize: '12px', color: '#1e40af' }}>
                Selected: {selectedUsers.size} users × {selectedScopes.size} scopes = {selectedUsers.size * selectedScopes.size} operations
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleBulkAssign}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Assign All
                </button>
                
                <button
                  onClick={handleBulkUnassign}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Unassign All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px'
            }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#dc2626' }}>
                {conflicts.length} Assignment Conflicts
              </span>
            </div>
            {conflicts.slice(0, 2).map((conflict, index) => (
              <div key={index} style={{ fontSize: '11px', color: '#dc2626' }}>
                • {conflict.userName}: {conflict.description}
              </div>
            ))}
            {conflicts.length > 2 && (
              <div style={{ fontSize: '11px', color: '#dc2626' }}>
                • +{conflicts.length - 2} more conflicts
              </div>
            )}
          </div>
        )}

        {/* Search and Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* User Filters */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Users ({filteredUsers.length})
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search 
                  size={12} 
                  style={{ 
                    position: 'absolute', 
                    left: '6px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#6b7280' 
                  }} 
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 4px 4px 22px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}
                />
              </div>
              
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                style={{
                  padding: '4px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  fontSize: '11px'
                }}
              >
                <option value="all">All</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          {/* Scope Filters */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Data Scopes ({filteredScopes.length})
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search 
                  size={12} 
                  style={{ 
                    position: 'absolute', 
                    left: '6px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#6b7280' 
                  }} 
                />
                <input
                  type="text"
                  placeholder="Search scopes..."
                  value={scopeSearchTerm}
                  onChange={(e) => setScopeSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 4px 4px 22px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}
                />
              </div>
              
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                style={{
                  padding: '4px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  fontSize: '11px'
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
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {viewMode === 'matrix' ? (
          /* Matrix View */
          <div style={{ height: '100%', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 1 }}>
                <tr>
                  <th style={{
                    padding: '8px',
                    textAlign: 'left',
                    borderBottom: '1px solid #e5e7eb',
                    borderRight: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    minWidth: '150px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAllUsers}
                        style={{ transform: 'scale(0.8)' }}
                      />
                      <Users size={12} />
                      Users
                    </div>
                  </th>
                  {filteredScopes.map(scope => (
                    <th key={scope.id} style={{
                      padding: '8px',
                      textAlign: 'center',
                      borderBottom: '1px solid #e5e7eb',
                      borderRight: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      minWidth: '80px'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedScopes.has(scope.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedScopes);
                            if (e.target.checked) {
                              newSelected.add(scope.id);
                            } else {
                              newSelected.delete(scope.id);
                            }
                            setSelectedScopes(newSelected);
                          }}
                          style={{ transform: 'scale(0.8)' }}
                        />
                        <div style={{
                          writing: 'vertical-rl' as any,
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)',
                          whiteSpace: 'nowrap',
                          fontSize: '10px',
                          color: getScopeColor(scope.type)
                        }}>
                          {getScopeIcon(scope.type)} {scope.name}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td style={{
                      padding: '8px',
                      borderBottom: '1px solid #f3f4f6',
                      borderRight: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelected.add(user.id);
                            } else {
                              newSelected.delete(user.id);
                            }
                            setSelectedUsers(newSelected);
                          }}
                          style={{ transform: 'scale(0.8)' }}
                        />
                        
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '9px',
                          fontWeight: '500',
                          flexShrink: 0
                        }}>
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '500', color: '#374151' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '9px', color: '#6b7280' }}>
                            {user.department || 'No dept'}
                          </div>
                        </div>
                      </div>
                    </td>
                    {filteredScopes.map(scope => {
                      const assigned = isAssigned(user.id, scope.id);
                      const hasConflict = conflicts.some(c => 
                        c.userId === user.id && c.scopeIds.includes(scope.id)
                      );
                      
                      return (
                        <td key={scope.id} style={{
                          padding: '4px',
                          textAlign: 'center',
                          borderBottom: '1px solid #f3f4f6',
                          borderRight: '1px solid #f3f4f6',
                          backgroundColor: assigned ? (hasConflict ? '#fef2f2' : '#f0fdf4') : 'white',
                          cursor: 'pointer'
                        }}>
                          <button
                            onClick={() => toggleAssignment(user.id, scope.id)}
                            style={{
                              width: '20px',
                              height: '20px',
                              border: assigned ? 'none' : '1px solid #d1d5db',
                              borderRadius: '3px',
                              backgroundColor: assigned ? (hasConflict ? '#ef4444' : '#10b981') : 'white',
                              color: assigned ? 'white' : '#6b7280',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={assigned ? 'Click to unassign' : 'Click to assign'}
                          >
                            {assigned ? (
                              hasConflict ? <AlertTriangle size={10} /> : <Check size={10} />
                            ) : null}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* List View */
          <div style={{ height: '100%', overflow: 'auto', padding: '16px' }}>
            {assignments.filter(a => a.isActive).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
                  No active assignments
                </h4>
                <p style={{ margin: 0, fontSize: '12px' }}>
                  Use the matrix view to assign users to data scopes
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assignments
                  .filter(a => a.isActive)
                  .filter(a => {
                    const user = tenantUsers.find(u => u.id === a.userId);
                    const scope = dataScopes.find(s => s.id === a.scopeId);
                    return user && scope && 
                           filteredUsers.some(u => u.id === a.userId) &&
                           filteredScopes.some(s => s.id === a.scopeId);
                  })
                  .map(assignment => {
                    const user = tenantUsers.find(u => u.id === assignment.userId);
                    const scope = dataScopes.find(s => s.id === assignment.scopeId);
                    const hasConflict = conflicts.some(c => 
                      c.userId === assignment.userId && c.scopeIds.includes(assignment.scopeId)
                    );

                    return (
                      <div
                        key={`${assignment.userId}-${assignment.scopeId}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          backgroundColor: hasConflict ? '#fef2f2' : 'white',
                          border: `1px solid ${hasConflict ? '#fecaca' : '#e5e7eb'}`,
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                              {user?.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {user?.email}
                            </div>
                          </div>

                          <div style={{ 
                            fontSize: '20px', 
                            color: '#d1d5db',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            →
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '16px' }}>
                              {scope && getScopeIcon(scope.type)}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                {scope?.name}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: scope ? getScopeColor(scope.type) : '#6b7280',
                                textTransform: 'capitalize'
                              }}>
                                {scope?.type} scope
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {hasConflict && (
                            <AlertTriangle size={16} color="#ef4444" title="Conflict detected" />
                          )}
                          
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </div>
                          
                          <button
                            onClick={() => toggleAssignment(assignment.userId, assignment.scopeId)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserScopeAssignmentMatrix;
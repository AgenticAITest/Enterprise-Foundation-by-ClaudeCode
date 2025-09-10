import React, { useState, useEffect, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Users,
  Shield,
  Search,
  Filter,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Settings,
  Eye,
  Calendar,
  MapPin,
  Zap,
  RefreshCw,
  Save,
  Play,
  RotateCcw,
  FileText,
  Plus,
  Minus
} from 'lucide-react';

interface BulkAssignmentModalProps {
  isOpen: boolean;
  selectedModule: string;
  preselectedUsers?: string[];
  preselectedRoles?: string[];
  onClose: () => void;
  onAssign: (assignments: BulkAssignment[]) => Promise<void>;
}

interface BulkAssignment {
  userId: string;
  roleId: string;
  action: 'assign' | 'unassign';
  effectiveDate?: Date;
  expirationDate?: Date;
  reason?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  currentRoles: string[];
  location: string;
  avatar?: string;
  lastActivity: Date;
}

interface AssignmentConflict {
  type: 'duplicate_role' | 'permission_overlap' | 'time_conflict' | 'location_conflict';
  userId: string;
  roleId: string;
  existingRoleId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
  message: string;
  resolutionOptions: string[];
}

interface UserFilters {
  search: string;
  departments: string[];
  statuses: ('active' | 'inactive' | 'pending')[];
  currentRoles: string[];
  hasConflicts: boolean;
}

interface RoleFilters {
  search: string;
  modules: string[];
  complexity: string[];
  isTemplate: boolean;
}

const BulkAssignmentModal: React.FC<BulkAssignmentModalProps> = ({
  isOpen,
  selectedModule,
  preselectedUsers = [],
  preselectedRoles = [],
  onClose,
  onAssign
}) => {
  const {
    rolesByModule,
    roleTemplates,
    tenantUsers,
    isLoading
  } = useTenantAdmin();

  // State management
  const [selectedUsers, setSelectedUsers] = useState<string[]>(preselectedUsers);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(preselectedRoles);
  const [userFilters, setUserFilters] = useState<UserFilters>({
    search: '',
    departments: [],
    statuses: ['active'],
    currentRoles: [],
    hasConflicts: false
  });
  const [roleFilters, setRoleFilters] = useState<RoleFilters>({
    search: '',
    modules: [selectedModule],
    complexity: [],
    isTemplate: false
  });
  
  const [assignmentOptions, setAssignmentOptions] = useState({
    effectiveDate: new Date(),
    expirationDate: null as Date | null,
    scheduleMode: 'immediate' as 'immediate' | 'scheduled',
    conflictResolution: 'auto' as 'auto' | 'manual',
    reason: ''
  });

  const [conflicts, setConflicts] = useState<AssignmentConflict[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());

  // Mock users data for development
  const mockUsers: User[] = useMemo(() => [
    {
      id: 'user_1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      department: 'Engineering',
      status: 'active',
      currentRoles: ['developer', 'user'],
      location: 'New York',
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 'user_2',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      department: 'Marketing',
      status: 'active',
      currentRoles: ['manager', 'user'],
      location: 'San Francisco',
      lastActivity: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: 'user_3',
      name: 'Bob Wilson',
      email: 'bob.wilson@company.com',
      department: 'Sales',
      status: 'active',
      currentRoles: ['sales_rep'],
      location: 'Chicago',
      lastActivity: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    },
    {
      id: 'user_4',
      name: 'Alice Brown',
      email: 'alice.brown@company.com',
      department: 'Finance',
      status: 'active',
      currentRoles: ['accountant', 'user'],
      location: 'New York',
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      id: 'user_5',
      name: 'Charlie Davis',
      email: 'charlie.davis@company.com',
      department: 'Engineering',
      status: 'pending',
      currentRoles: [],
      location: 'Remote',
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    }
  ], []);

  // Filtered users based on current filters
  const filteredUsers = useMemo(() => {
    return mockUsers.filter(user => {
      if (userFilters.search && !user.name.toLowerCase().includes(userFilters.search.toLowerCase()) &&
          !user.email.toLowerCase().includes(userFilters.search.toLowerCase())) {
        return false;
      }
      
      if (userFilters.departments.length > 0 && !userFilters.departments.includes(user.department)) {
        return false;
      }
      
      if (userFilters.statuses.length > 0 && !userFilters.statuses.includes(user.status)) {
        return false;
      }
      
      return true;
    });
  }, [mockUsers, userFilters]);

  // Available roles for the selected module
  const availableRoles = useMemo(() => {
    return rolesByModule[selectedModule] || [];
  }, [rolesByModule, selectedModule]);

  // Filtered roles based on current filters
  const filteredRoles = useMemo(() => {
    return availableRoles.filter(role => {
      if (roleFilters.search && !role.name.toLowerCase().includes(roleFilters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [availableRoles, roleFilters]);

  // Detect conflicts when users or roles change
  useEffect(() => {
    detectConflicts();
  }, [selectedUsers, selectedRoles]);

  const detectConflicts = () => {
    const newConflicts: AssignmentConflict[] = [];
    
    selectedUsers.forEach(userId => {
      const user = mockUsers.find(u => u.id === userId);
      if (!user) return;

      selectedRoles.forEach(roleId => {
        const role = availableRoles.find(r => r.id === roleId);
        if (!role) return;

        // Check for duplicate roles
        if (user.currentRoles.includes(roleId)) {
          newConflicts.push({
            type: 'duplicate_role',
            userId,
            roleId,
            severity: 'low',
            autoResolvable: true,
            message: `${user.name} already has the ${role.name} role`,
            resolutionOptions: ['Skip assignment', 'Update existing assignment']
          });
        }

        // Check for permission overlaps
        const hasManagerRole = user.currentRoles.some(currentRole => currentRole.includes('manager'));
        if (hasManagerRole && roleId.includes('admin')) {
          newConflicts.push({
            type: 'permission_overlap',
            userId,
            roleId,
            severity: 'medium',
            autoResolvable: true,
            message: `${user.name} has manager role and being assigned admin role`,
            resolutionOptions: ['Keep highest privilege', 'Replace existing role', 'Allow both roles']
          });
        }
      });
    });

    setConflicts(newConflicts);
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleExecuteAssignment = async () => {
    try {
      setIsExecuting(true);
      
      const assignments: BulkAssignment[] = [];
      
      selectedUsers.forEach(userId => {
        selectedRoles.forEach(roleId => {
          assignments.push({
            userId,
            roleId,
            action: 'assign',
            effectiveDate: assignmentOptions.effectiveDate,
            expirationDate: assignmentOptions.expirationDate || undefined,
            reason: assignmentOptions.reason || 'Bulk assignment via admin portal'
          });
        });
      });

      await onAssign(assignments);
      onClose();
    } catch (error) {
      console.error('Error executing bulk assignment:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleConflictToggle = (conflictId: string) => {
    setExpandedConflicts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conflictId)) {
        newSet.delete(conflictId);
      } else {
        newSet.add(conflictId);
      }
      return newSet;
    });
  };

  const getAssignmentSummary = () => {
    const totalAssignments = selectedUsers.length * selectedRoles.length;
    const conflictCount = conflicts.length;
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length;
    
    return {
      totalAssignments,
      conflictCount,
      criticalConflicts,
      canExecute: criticalConflicts === 0
    };
  };

  if (!isOpen) return null;

  const summary = getAssignmentSummary();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        width: '95vw',
        maxWidth: '1600px',
        height: '90vh',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              Bulk Role Assignment
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Assign roles to multiple users in the {selectedModule} module
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: showPreview ? '#3b82f6' : 'white',
                color: showPreview ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Eye size={16} />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>

            <button
              onClick={handleExecuteAssignment}
              disabled={isExecuting || !summary.canExecute || summary.totalAssignments === 0}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: summary.canExecute && summary.totalAssignments > 0 ? '#10b981' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: summary.canExecute && summary.totalAssignments > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isExecuting ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Executing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Execute Assignment
                </>
              )}
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                borderRadius: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: showPreview ? '30% 30% 40%' : '50% 50%',
          overflow: 'hidden'
        }}>
          {/* User Selection Panel */}
          <div style={{
            borderRight: '1px solid #e2e8f0',
            padding: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Users size={18} color="#3b82f6" />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                User Selection
              </h3>
            </div>

            {/* User Search and Filters */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                position: 'relative',
                marginBottom: '12px'
              }}>
                <Search size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Filter Options */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {['active', 'inactive', 'pending'].map(status => (
                  <label key={status} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={userFilters.statuses.includes(status as any)}
                      onChange={(e) => {
                        setUserFilters(prev => ({
                          ...prev,
                          statuses: e.target.checked 
                            ? [...prev.statuses, status as any]
                            : prev.statuses.filter(s => s !== status)
                        }));
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{status}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSelectAllUsers}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    border: '1px solid #93c5fd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {selectedUsers.length === filteredUsers.length ? 'Clear All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* User List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}>
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleUserToggle(user.id)}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    backgroundColor: selectedUsers.includes(user.id) ? '#eff6ff' : 'white',
                    borderLeft: selectedUsers.includes(user.id) ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      {user.name.charAt(0)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '2px'
                      }}>
                        {user.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {user.email}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        marginTop: '2px'
                      }}>
                        {user.department} • {user.currentRoles.length} roles
                      </div>
                    </div>

                    <div style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      backgroundColor: user.status === 'active' ? '#dcfce7' : user.status === 'pending' ? '#fef3cd' : '#fef2f2',
                      color: user.status === 'active' ? '#16a34a' : user.status === 'pending' ? '#d97706' : '#dc2626'
                    }}>
                      {user.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {selectedUsers.length} of {filteredUsers.length} users selected
            </div>
          </div>

          {/* Role Selection Panel */}
          <div style={{
            borderRight: showPreview ? '1px solid #e2e8f0' : 'none',
            padding: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Shield size={18} color="#10b981" />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Role Selection
              </h3>
            </div>

            {/* Role Search */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                position: 'relative',
                marginBottom: '12px'
              }}>
                <Search size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }} />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={roleFilters.search}
                  onChange={(e) => setRoleFilters(prev => ({ ...prev, search: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                Module: <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{selectedModule}</span>
              </div>
            </div>

            {/* Role List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}>
              {filteredRoles.map(role => (
                <div
                  key={role.id}
                  onClick={() => handleRoleToggle(role.id)}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    backgroundColor: selectedRoles.includes(role.id) ? '#f0fdf4' : 'white',
                    borderLeft: selectedRoles.includes(role.id) ? '3px solid #10b981' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                    marginBottom: '4px'
                  }}>
                    {role.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    {role.description}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#9ca3af'
                  }}>
                    {role.userCount || 0} users • {role.permissionCount || 0} permissions
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {selectedRoles.length} of {filteredRoles.length} roles selected
            </div>
          </div>

          {/* Assignment Preview Panel */}
          {showPreview && (
            <div style={{
              padding: '20px',
              backgroundColor: '#f8fafc',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <Eye size={18} color="#f59e0b" />
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Assignment Preview
                </h3>
              </div>

              {/* Assignment Summary */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '12px'
                }}>
                  Assignment Summary
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Total Assignments:</span>
                    <span style={{ fontWeight: '500' }}>{summary.totalAssignments}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Conflicts Detected:</span>
                    <span style={{ 
                      fontWeight: '500',
                      color: summary.conflictCount > 0 ? '#f59e0b' : '#10b981'
                    }}>
                      {summary.conflictCount}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Schedule:</span>
                    <span style={{ fontWeight: '500' }}>
                      {assignmentOptions.scheduleMode === 'immediate' ? 'Immediate' : 'Scheduled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Matrix */}
              {summary.totalAssignments > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '12px'
                  }}>
                    Assignment Matrix
                  </div>
                  
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    fontSize: '12px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                          <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #e2e8f0' }}>User</th>
                          <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Roles</th>
                          <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUsers.map(userId => {
                          const user = mockUsers.find(u => u.id === userId);
                          if (!user) return null;
                          
                          const userConflicts = conflicts.filter(c => c.userId === userId);
                          
                          return (
                            <tr key={userId}>
                              <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>
                                {user.name.split(' ')[0]}
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                {selectedRoles.length}
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                {userConflicts.length > 0 ? (
                                  <span style={{ color: '#f59e0b' }}>⚠️</span>
                                ) : (
                                  <span style={{ color: '#10b981' }}>✓</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Conflict Resolution */}
              {conflicts.length > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '16px',
                  flex: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <AlertTriangle size={16} color="#f59e0b" />
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      Conflict Resolution
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {conflicts.map((conflict, index) => {
                      const conflictId = `conflict_${index}`;
                      const user = mockUsers.find(u => u.id === conflict.userId);
                      const role = availableRoles.find(r => r.id === conflict.roleId);
                      
                      return (
                        <div
                          key={conflictId}
                          style={{
                            marginBottom: '12px',
                            border: '1px solid #fed7aa',
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            onClick={() => handleConflictToggle(conflictId)}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#fef3cd',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: '500' }}>
                              {user?.name}: {role?.name}
                            </div>
                            {expandedConflicts.has(conflictId) ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </div>
                          
                          {expandedConflicts.has(conflictId) && (
                            <div style={{ padding: '12px', backgroundColor: 'white' }}>
                              <div style={{
                                fontSize: '11px',
                                color: '#92400e',
                                marginBottom: '8px'
                              }}>
                                {conflict.message}
                              </div>
                              
                              <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                <strong>Resolution Options:</strong>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                  {conflict.resolutionOptions.map((option, i) => (
                                    <li key={i} style={{ marginBottom: '2px' }}>
                                      {option}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              {conflict.autoResolvable && (
                                <button
                                  style={{
                                    marginTop: '6px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Auto-resolve
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkAssignmentModal;
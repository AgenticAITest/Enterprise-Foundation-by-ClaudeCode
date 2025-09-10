import React, { useState, useEffect } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import { X, Shield, AlertTriangle, Check, Users, Eye } from 'lucide-react';

interface UserRoleAssignmentModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, roleAssignments: any[]) => Promise<void>;
}

const UserRoleAssignmentModal: React.FC<UserRoleAssignmentModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave
}) => {
  const { tenantModules, rolesByModule, isLoading } = useTenantAdmin();
  
  const [selectedModule, setSelectedModule] = useState('');
  const [roleAssignments, setRoleAssignments] = useState<Record<string, string[]>>({});
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize role assignments from user data
  useEffect(() => {
    if (user && isOpen) {
      const assignments: Record<string, string[]> = {};
      
      user.roleAssignments.forEach((assignment: any) => {
        if (!assignments[assignment.moduleCode]) {
          assignments[assignment.moduleCode] = [];
        }
        assignments[assignment.moduleCode].push(assignment.roleId);
      });
      
      setRoleAssignments(assignments);
      
      // Set first available module as selected
      if (tenantModules.length > 0) {
        setSelectedModule(tenantModules[0].moduleCode);
      }
      
      setError(null);
    }
  }, [user, isOpen, tenantModules]);

  // Check for conflicts when role assignments change
  useEffect(() => {
    checkConflicts();
  }, [roleAssignments]);

  const checkConflicts = () => {
    const foundConflicts: any[] = [];
    
    // Check for conflicting permissions across modules
    Object.entries(roleAssignments).forEach(([moduleCode, roleIds]) => {
      roleIds.forEach(roleId => {
        const role = rolesByModule[moduleCode]?.find((r: any) => r.id === roleId);
        if (role) {
          // Check if this role conflicts with roles in other modules
          Object.entries(roleAssignments).forEach(([otherModule, otherRoleIds]) => {
            if (moduleCode !== otherModule) {
              otherRoleIds.forEach(otherRoleId => {
                const otherRole = rolesByModule[otherModule]?.find((r: any) => r.id === otherRoleId);
                if (otherRole && hasPermissionConflict(role, otherRole)) {
                  foundConflicts.push({
                    type: 'permission_conflict',
                    role1: { ...role, module: moduleCode },
                    role2: { ...otherRole, module: otherModule },
                    description: `${role.name} (${moduleCode}) and ${otherRole.name} (${otherModule}) have conflicting permissions`
                  });
                }
              });
            }
          });
        }
      });
    });
    
    setConflicts(foundConflicts);
  };

  const hasPermissionConflict = (role1: any, role2: any) => {
    // Simple conflict detection - in real app, this would be more sophisticated
    return role1.name.toLowerCase().includes('admin') && role2.name.toLowerCase().includes('admin');
  };

  const handleRoleToggle = (moduleCode: string, roleId: string) => {
    const currentAssignments = roleAssignments[moduleCode] || [];
    const newAssignments = { ...roleAssignments };
    
    if (currentAssignments.includes(roleId)) {
      newAssignments[moduleCode] = currentAssignments.filter(id => id !== roleId);
      if (newAssignments[moduleCode].length === 0) {
        delete newAssignments[moduleCode];
      }
    } else {
      newAssignments[moduleCode] = [...currentAssignments, roleId];
    }
    
    setRoleAssignments(newAssignments);
  };

  const getEffectivePermissions = () => {
    const permissions = new Set<string>();
    
    Object.entries(roleAssignments).forEach(([moduleCode, roleIds]) => {
      roleIds.forEach(roleId => {
        const role = rolesByModule[moduleCode]?.find((r: any) => r.id === roleId);
        if (role && role.permissions) {
          role.permissions.forEach((permission: any) => {
            permissions.add(`${moduleCode}.${permission.resource}.${permission.action}`);
          });
        }
      });
    });
    
    return Array.from(permissions).sort();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Convert assignments to the format expected by the API
      const formattedAssignments: any[] = [];
      
      Object.entries(roleAssignments).forEach(([moduleCode, roleIds]) => {
        roleIds.forEach(roleId => {
          const role = rolesByModule[moduleCode]?.find((r: any) => r.id === roleId);
          if (role) {
            formattedAssignments.push({
              moduleCode,
              roleId,
              roleName: role.name,
              assignedAt: new Date().toISOString()
            });
          }
        });
      });
      
      await onSave(user.id, formattedAssignments);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role assignments');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const effectivePermissions = getEffectivePermissions();
  const totalAssignments = Object.values(roleAssignments).flat().length;

  return (
    <div
      onClick={handleBackdropClick}
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
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '95vw',
          maxWidth: '1200px',
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
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
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0,
              marginBottom: '4px'
            }}>
              Assign Roles to {user.name}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Configure user roles across different modules
            </p>
          </div>
          
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

        {/* Content */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '300px 1fr 300px',
          overflow: 'hidden'
        }}>
          {/* Left Panel - User Info & Module Selection */}
          <div style={{
            padding: '24px',
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#fafbfc',
            overflowY: 'auto'
          }}>
            {/* User Info */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                User Information
              </h3>
              
              <div style={{
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {user.email}
                  </div>
                </div>
                
                {user.department && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Department: </span>
                    <span style={{ fontSize: '14px', color: '#374151' }}>{user.department}</span>
                  </div>
                )}
                
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Current Roles: </span>
                  <span style={{ fontSize: '14px', color: '#374151' }}>{totalAssignments}</span>
                </div>
              </div>
            </div>

            {/* Module Selection */}
            <div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Select Module
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {tenantModules.map(module => (
                  <button
                    key={module.moduleCode}
                    onClick={() => setSelectedModule(module.moduleCode)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: selectedModule === module.moduleCode ? '#3b82f6' : 'white',
                      color: selectedModule === module.moduleCode ? 'white' : '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{module.name}</span>
                    {roleAssignments[module.moduleCode]?.length > 0 && (
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 6px',
                        backgroundColor: selectedModule === module.moduleCode ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                        borderRadius: '10px'
                      }}>
                        {roleAssignments[module.moduleCode].length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Role Assignment */}
          <div style={{
            padding: '24px',
            overflowY: 'auto'
          }}>
            {selectedModule && (
              <>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 16px 0'
                }}>
                  Available Roles - {tenantModules.find(m => m.moduleCode === selectedModule)?.name}
                </h3>
                
                {rolesByModule[selectedModule] ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rolesByModule[selectedModule].map((role: any) => {
                      const isSelected = roleAssignments[selectedModule]?.includes(role.id) || false;
                      
                      return (
                        <div
                          key={role.id}
                          onClick={() => handleRoleToggle(selectedModule, role.id)}
                          style={{
                            padding: '16px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f0f9ff' : 'white',
                            borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                              }}>
                                <Shield size={16} color={isSelected ? '#3b82f6' : '#6b7280'} />
                                <span style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: isSelected ? '#1f2937' : '#374151'
                                }}>
                                  {role.name}
                                </span>
                                {isSelected && <Check size={16} color="#3b82f6" />}
                              </div>
                              
                              <p style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                margin: '0 0 8px 0'
                              }}>
                                {role.description}
                              </p>
                              
                              <div style={{
                                fontSize: '11px',
                                color: '#6b7280'
                              }}>
                                {role.permissions?.length || 0} permissions
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280'
                  }}>
                    <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p>No roles available for this module</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div style={{
            padding: '24px',
            borderLeft: '1px solid #e2e8f0',
            backgroundColor: '#fafbfc',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 16px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Assignment Preview
            </h3>

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px'
                }}>
                  <AlertTriangle size={14} color="#ef4444" />
                  <span style={{ fontSize: '12px', fontWeight: '500', color: '#dc2626' }}>
                    Conflicts Detected
                  </span>
                </div>
                {conflicts.map((conflict, index) => (
                  <p key={index} style={{
                    fontSize: '11px',
                    color: '#dc2626',
                    margin: '4px 0'
                  }}>
                    {conflict.description}
                  </p>
                ))}
              </div>
            )}

            {/* Summary */}
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                margin: '0 0 8px 0'
              }}>
                Summary
              </h4>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                <div>Total Roles: {totalAssignments}</div>
                <div>Total Permissions: {effectivePermissions.length}</div>
                <div>Modules: {Object.keys(roleAssignments).length}</div>
              </div>
            </div>

            {/* Effective Permissions */}
            <div>
              <h4 style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Eye size={12} />
                Effective Permissions
              </h4>
              
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '10px'
              }}>
                {effectivePermissions.length > 0 ? (
                  effectivePermissions.map(permission => (
                    <div
                      key={permission}
                      style={{
                        padding: '4px 8px',
                        margin: '2px 0',
                        backgroundColor: 'white',
                        border: '1px solid #f3f4f6',
                        borderRadius: '3px',
                        color: '#6b7280'
                      }}
                    >
                      {permission}
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: '11px' }}>
                    No permissions assigned
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {error && (
            <div style={{ color: '#ef4444', fontSize: '14px' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || conflicts.length > 0}
              style={{
                padding: '8px 16px',
                backgroundColor: conflicts.length > 0 ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: conflicts.length > 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {saving ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleAssignmentModal;
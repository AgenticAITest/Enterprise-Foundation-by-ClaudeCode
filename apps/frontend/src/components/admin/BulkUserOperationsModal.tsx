import React, { useState, useEffect, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  X, Users, Shield, Settings, Download, UserMinus, UserPlus, 
  AlertTriangle, Check, RefreshCw, Eye, ChevronRight, ChevronDown
} from 'lucide-react';

interface BulkUserOperationsModalProps {
  selectedUsers: any[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: (operation: string, results: any) => void;
}

type OperationType = 'assign_roles' | 'remove_roles' | 'change_status' | 'export_data' | 'send_invites';

const BulkUserOperationsModal: React.FC<BulkUserOperationsModalProps> = ({
  selectedUsers,
  isOpen,
  onClose,
  onComplete
}) => {
  const { tenantModules, rolesByModule, bulkUpdateUsers, isLoading } = useTenantAdmin();
  
  const [selectedOperation, setSelectedOperation] = useState<OperationType>('assign_roles');
  const [operationConfig, setOperationConfig] = useState<any>({});
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [previewResults, setPreviewResults] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Operation definitions
  const operations = {
    assign_roles: {
      title: 'Assign Roles',
      description: 'Add roles to selected users across modules',
      icon: UserPlus,
      color: '#10b981'
    },
    remove_roles: {
      title: 'Remove Roles',
      description: 'Remove specific roles from selected users',
      icon: UserMinus,
      color: '#ef4444'
    },
    change_status: {
      title: 'Change Status',
      description: 'Activate, deactivate, or suspend users',
      icon: Settings,
      color: '#f59e0b'
    },
    export_data: {
      title: 'Export Data',
      description: 'Export user data and permissions',
      icon: Download,
      color: '#3b82f6'
    },
    send_invites: {
      title: 'Send Invites',
      description: 'Send invitation emails to users',
      icon: Users,
      color: '#8b5cf6'
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedOperation('assign_roles');
      setOperationConfig({});
      setProcessing(false);
      setProcessingProgress(0);
      setConflicts([]);
      setPreviewResults([]);
      setShowPreview(false);
      setError(null);
    }
  }, [isOpen]);

  // Generate preview when operation or config changes
  useEffect(() => {
    if (selectedOperation && operationConfig && Object.keys(operationConfig).length > 0) {
      generatePreview();
    }
  }, [selectedOperation, operationConfig, selectedUsers]);

  const generatePreview = () => {
    const preview: any[] = [];
    const foundConflicts: any[] = [];

    selectedUsers.forEach(user => {
      const userPreview = {
        userId: user.id,
        userName: user.name,
        currentStatus: user.status,
        changes: [] as any[],
        conflicts: [] as any[],
        warnings: [] as any[]
      };

      switch (selectedOperation) {
        case 'assign_roles':
          if (operationConfig.roleAssignments) {
            Object.entries(operationConfig.roleAssignments).forEach(([moduleCode, roleIds]: [string, any]) => {
              (roleIds as string[]).forEach(roleId => {
                const role = rolesByModule[moduleCode]?.find((r: any) => r.id === roleId);
                if (role) {
                  // Check if user already has this role
                  const hasRole = user.roleAssignments.some((a: any) => 
                    a.moduleCode === moduleCode && a.roleId === roleId
                  );

                  if (hasRole) {
                    userPreview.warnings.push({
                      type: 'already_assigned',
                      message: `Already has ${role.name} in ${moduleCode}`
                    });
                  } else {
                    userPreview.changes.push({
                      type: 'add_role',
                      module: moduleCode,
                      roleName: role.name,
                      roleId: roleId
                    });
                  }
                }
              });
            });
          }
          break;

        case 'remove_roles':
          if (operationConfig.roleAssignments) {
            Object.entries(operationConfig.roleAssignments).forEach(([moduleCode, roleIds]: [string, any]) => {
              (roleIds as string[]).forEach(roleId => {
                const role = rolesByModule[moduleCode]?.find((r: any) => r.id === roleId);
                if (role) {
                  const hasRole = user.roleAssignments.some((a: any) => 
                    a.moduleCode === moduleCode && a.roleId === roleId
                  );

                  if (!hasRole) {
                    userPreview.warnings.push({
                      type: 'not_assigned',
                      message: `Doesn't have ${role.name} in ${moduleCode}`
                    });
                  } else {
                    userPreview.changes.push({
                      type: 'remove_role',
                      module: moduleCode,
                      roleName: role.name,
                      roleId: roleId
                    });
                  }
                }
              });
            });
          }
          break;

        case 'change_status':
          if (operationConfig.newStatus && operationConfig.newStatus !== user.status) {
            userPreview.changes.push({
              type: 'change_status',
              from: user.status,
              to: operationConfig.newStatus
            });
          }
          break;

        case 'export_data':
          userPreview.changes.push({
            type: 'export',
            format: operationConfig.format || 'csv',
            includePermissions: operationConfig.includePermissions || false
          });
          break;

        case 'send_invites':
          if (user.status === 'invited') {
            userPreview.warnings.push({
              type: 'already_invited',
              message: 'Already has pending invitation'
            });
          } else {
            userPreview.changes.push({
              type: 'send_invite',
              email: user.email
            });
          }
          break;
      }

      if (userPreview.conflicts.length > 0) {
        foundConflicts.push(...userPreview.conflicts);
      }

      preview.push(userPreview);
    });

    setPreviewResults(preview);
    setConflicts(foundConflicts);
  };

  const handleExecute = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      let results: any = {};
      
      switch (selectedOperation) {
        case 'assign_roles':
        case 'remove_roles':
          // Process in batches
          const batchSize = 10;
          const batches = [];
          for (let i = 0; i < selectedUsers.length; i += batchSize) {
            batches.push(selectedUsers.slice(i, i + batchSize));
          }
          
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            
            // Simulate API call with progress
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const batchResults = batch.map(user => ({
              userId: user.id,
              success: Math.random() > 0.1, // 90% success rate
              changes: previewResults.find(p => p.userId === user.id)?.changes || []
            }));
            
            results[batchIndex] = batchResults;
            setProcessingProgress(((batchIndex + 1) / batches.length) * 100);
          }
          break;
          
        case 'change_status':
          results = await bulkUpdateUsers(
            selectedUsers.map(u => u.id),
            { status: operationConfig.newStatus }
          );
          break;
          
        case 'export_data':
          // Generate export data
          results = {
            format: operationConfig.format,
            data: selectedUsers.map(user => ({
              name: user.name,
              email: user.email,
              status: user.status,
              roles: user.roleAssignments.map((a: any) => `${a.moduleCode}:${a.roleName}`).join(', '),
              lastActive: user.lastActive
            })),
            filename: `users_export_${new Date().toISOString().split('T')[0]}.${operationConfig.format}`
          };
          break;
          
        case 'send_invites':
          results = selectedUsers.map(user => ({
            userId: user.id,
            email: user.email,
            success: user.status !== 'invited'
          }));
          break;
      }
      
      setProcessingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause to show 100%
      
      onComplete(selectedOperation, results);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setProcessing(false);
    }
  };

  const renderOperationConfig = () => {
    switch (selectedOperation) {
      case 'assign_roles':
      case 'remove_roles':
        return (
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '500' }}>
              Select Roles to {selectedOperation === 'assign_roles' ? 'Assign' : 'Remove'}
            </h4>
            
            {tenantModules.map(module => {
              const moduleRoles = rolesByModule[module.moduleCode] || [];
              const selectedRoles = operationConfig.roleAssignments?.[module.moduleCode] || [];
              
              return (
                <div key={module.moduleCode} style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    {module.name}
                  </div>
                  
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '8px',
                    paddingLeft: '12px'
                  }}>
                    {moduleRoles.map((role: any) => (
                      <label
                        key={role.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px',
                          backgroundColor: selectedRoles.includes(role.id) ? '#f0f9ff' : 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={(e) => {
                            const newConfig = { ...operationConfig };
                            if (!newConfig.roleAssignments) {
                              newConfig.roleAssignments = {};
                            }
                            if (!newConfig.roleAssignments[module.moduleCode]) {
                              newConfig.roleAssignments[module.moduleCode] = [];
                            }
                            
                            if (e.target.checked) {
                              newConfig.roleAssignments[module.moduleCode] = [
                                ...newConfig.roleAssignments[module.moduleCode],
                                role.id
                              ];
                            } else {
                              newConfig.roleAssignments[module.moduleCode] = 
                                newConfig.roleAssignments[module.moduleCode].filter((id: string) => id !== role.id);
                            }
                            
                            setOperationConfig(newConfig);
                          }}
                        />
                        <Shield size={14} />
                        {role.name}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
        
      case 'change_status':
        return (
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '500' }}>
              New Status
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['active', 'inactive', 'suspended'].map(status => (
                <label key={status} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: operationConfig.newStatus === status ? '#f0f9ff' : 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={operationConfig.newStatus === status}
                    onChange={(e) => setOperationConfig({ ...operationConfig, newStatus: e.target.value })}
                  />
                  <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{status}</span>
                </label>
              ))}
            </div>
          </div>
        );
        
      case 'export_data':
        return (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '500' }}>
                Export Format
              </h4>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                {['csv', 'xlsx', 'json'].map(format => (
                  <label key={format} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: operationConfig.format === format ? '#f0f9ff' : 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    <input
                      type="radio"
                      name="format"
                      value={format}
                      checked={operationConfig.format === format}
                      onChange={(e) => setOperationConfig({ ...operationConfig, format: e.target.value })}
                    />
                    {format.toUpperCase()}
                  </label>
                ))}
              </div>
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
                  checked={operationConfig.includePermissions || false}
                  onChange={(e) => setOperationConfig({ 
                    ...operationConfig, 
                    includePermissions: e.target.checked 
                  })}
                />
                Include detailed permissions
              </label>
            </div>
          </div>
        );
        
      case 'send_invites':
        return (
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '500' }}>
              Invitation Options
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={operationConfig.customMessage || false}
                  onChange={(e) => setOperationConfig({ 
                    ...operationConfig, 
                    customMessage: e.target.checked 
                  })}
                />
                Include custom message
              </label>
              
              {operationConfig.customMessage && (
                <textarea
                  placeholder="Enter custom invitation message..."
                  value={operationConfig.message || ''}
                  onChange={(e) => setOperationConfig({ 
                    ...operationConfig, 
                    message: e.target.value 
                  })}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!isOpen || selectedUsers.length === 0) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !processing) {
      onClose();
    }
  };

  const canExecute = () => {
    switch (selectedOperation) {
      case 'assign_roles':
      case 'remove_roles':
        return operationConfig.roleAssignments && 
               Object.values(operationConfig.roleAssignments).some((roles: any) => roles.length > 0);
      case 'change_status':
        return operationConfig.newStatus;
      case 'export_data':
        return operationConfig.format;
      case 'send_invites':
        return true;
      default:
        return false;
    }
  };

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
          maxWidth: '1000px',
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
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
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0,
              marginBottom: '4px'
            }}>
              Bulk User Operations
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Apply operations to {selectedUsers.length} selected users
            </p>
          </div>
          
          {!processing && (
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
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Panel - Operation Selection */}
          <div style={{
            width: '250px',
            padding: '24px',
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#fafbfc',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Select Operation
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(operations).map(([key, operation]) => {
                const Icon = operation.icon;
                return (
                  <button
                    key={key}
                    onClick={() => !processing && setSelectedOperation(key as OperationType)}
                    disabled={processing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: selectedOperation === key ? operation.color : 'white',
                      color: selectedOperation === key ? 'white' : '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      fontSize: '14px',
                      opacity: processing ? 0.6 : 1
                    }}
                  >
                    <Icon size={16} />
                    <div>
                      <div style={{ fontWeight: '500' }}>{operation.title}</div>
                      <div style={{ 
                        fontSize: '12px', 
                        opacity: 0.8,
                        color: selectedOperation === key ? 'rgba(255,255,255,0.8)' : '#6b7280'
                      }}>
                        {operation.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Panel - Configuration */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {processing ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', color: '#3b82f6' }} />
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500' }}>
                  Processing Operation...
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                  {selectedOperation === 'assign_roles' || selectedOperation === 'remove_roles' 
                    ? `Processing users in batches...` 
                    : 'Please wait while we process your request...'}
                </p>
                
                <div style={{
                  width: '100%',
                  maxWidth: '300px',
                  margin: '0 auto',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${processingProgress}%`,
                    height: '8px',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                
                <div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
                  {processingProgress.toFixed(0)}% complete
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '500' }}>
                  Configure {operations[selectedOperation].title}
                </h3>
                
                {renderOperationConfig()}
              </>
            )}
          </div>

          {/* Right Panel - Preview */}
          {!processing && showPreview && previewResults.length > 0 && (
            <div style={{
              width: '300px',
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
                Preview Changes
              </h3>

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
                      {conflicts.length} Conflicts
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#dc2626' }}>
                    Review conflicts before proceeding
                  </div>
                </div>
              )}

              <div style={{ fontSize: '12px' }}>
                {previewResults.slice(0, 5).map((result, index) => (
                  <div key={result.userId} style={{
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {result.userName}
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      {result.changes.length} changes
                      {result.warnings.length > 0 && `, ${result.warnings.length} warnings`}
                    </div>
                  </div>
                ))}
                
                {previewResults.length > 5 && (
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '11px', 
                    textAlign: 'center',
                    marginTop: '8px' 
                  }}>
                    +{previewResults.length - 5} more users
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!processing && (
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
              {canExecute() && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <Eye size={14} />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              )}
              
              <button
                onClick={onClose}
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
                onClick={handleExecute}
                disabled={!canExecute() || conflicts.length > 0}
                style={{
                  padding: '8px 16px',
                  backgroundColor: !canExecute() || conflicts.length > 0 ? '#9ca3af' : operations[selectedOperation].color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !canExecute() || conflicts.length > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Execute Operation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUserOperationsModal;
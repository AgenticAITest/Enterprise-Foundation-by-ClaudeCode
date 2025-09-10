import React, { useState, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import { X, Shield, Eye, Search, Filter, ChevronDown, ChevronRight, Lock, Unlock } from 'lucide-react';

interface UserPermissionViewerProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const UserPermissionViewer: React.FC<UserPermissionViewerProps> = ({
  user,
  isOpen,
  onClose
}) => {
  const { tenantModules, rolesByModule } = useTenantAdmin();
  
  const [selectedView, setSelectedView] = useState<'matrix' | 'list'>('matrix');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, granted, denied

  // Calculate user's effective permissions
  const userPermissions = useMemo(() => {
    if (!user?.roleAssignments) return {};
    
    const permissions: Record<string, {
      moduleCode: string;
      resource: string;
      action: string;
      granted: boolean;
      source: Array<{ roleName: string; roleId: string }>;
      dataScope?: string;
    }[]> = {};

    // Collect all permissions from user's roles
    user.roleAssignments.forEach((assignment: any) => {
      const role = rolesByModule[assignment.moduleCode]?.find((r: any) => r.id === assignment.roleId);
      
      if (role && role.permissions) {
        if (!permissions[assignment.moduleCode]) {
          permissions[assignment.moduleCode] = [];
        }
        
        role.permissions.forEach((permission: any) => {
          const permissionKey = `${permission.resource}.${permission.action}`;
          
          // Check if this permission already exists
          const existing = permissions[assignment.moduleCode].find(
            p => p.resource === permission.resource && p.action === permission.action
          );
          
          if (existing) {
            // Add this role as another source
            existing.source.push({
              roleName: role.name,
              roleId: role.id
            });
          } else {
            // Add new permission
            permissions[assignment.moduleCode].push({
              moduleCode: assignment.moduleCode,
              resource: permission.resource,
              action: permission.action,
              granted: true,
              source: [{
                roleName: role.name,
                roleId: role.id
              }],
              dataScope: permission.dataScope || 'tenant'
            });
          }
        });
      }
    });

    return permissions;
  }, [user, rolesByModule]);

  // Filter permissions based on search and filter
  const filteredPermissions = useMemo(() => {
    const filtered: typeof userPermissions = {};
    
    Object.entries(userPermissions).forEach(([moduleCode, perms]) => {
      const filteredPerms = perms.filter(perm => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (
            !perm.resource.toLowerCase().includes(searchLower) &&
            !perm.action.toLowerCase().includes(searchLower) &&
            !perm.source.some(s => s.roleName.toLowerCase().includes(searchLower))
          ) {
            return false;
          }
        }

        // Status filter
        if (filterBy === 'granted' && !perm.granted) return false;
        if (filterBy === 'denied' && perm.granted) return false;

        return true;
      });
      
      if (filteredPerms.length > 0) {
        filtered[moduleCode] = filteredPerms;
      }
    });
    
    return filtered;
  }, [userPermissions, searchTerm, filterBy]);

  const toggleModuleExpansion = (moduleCode: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleCode)) {
      newExpanded.delete(moduleCode);
    } else {
      newExpanded.add(moduleCode);
    }
    setExpandedModules(newExpanded);
  };

  const getDataScopeIcon = (dataScope: string) => {
    switch (dataScope) {
      case 'global':
        return <Unlock size={14} color="#10b981" />;
      case 'department':
        return <Shield size={14} color="#f59e0b" />;
      case 'personal':
        return <Lock size={14} color="#ef4444" />;
      default:
        return <Shield size={14} color="#6b7280" />;
    }
  };

  const getDataScopeColor = (dataScope: string) => {
    switch (dataScope) {
      case 'global': return '#10b981';
      case 'department': return '#f59e0b';
      case 'personal': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!isOpen || !user) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const totalPermissions = Object.values(userPermissions).flat().length;
  const filteredCount = Object.values(filteredPermissions).flat().length;

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
              {user.name} - Permission Overview
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              View effective permissions across all modules ({totalPermissions} total permissions)
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

        {/* Controls */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#6b7280' 
              }} 
            />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 6px 6px 36px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Permissions</option>
            <option value="granted">Granted Only</option>
          </select>

          {/* View Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            padding: '2px'
          }}>
            <button
              onClick={() => setSelectedView('matrix')}
              style={{
                padding: '6px 12px',
                backgroundColor: selectedView === 'matrix' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Matrix View
            </button>
            <button
              onClick={() => setSelectedView('list')}
              style={{
                padding: '6px 12px',
                backgroundColor: selectedView === 'list' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              List View
            </button>
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {filteredCount !== totalPermissions ? `${filteredCount} of ` : ''}{totalPermissions} permissions
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {selectedView === 'matrix' ? (
            /* Matrix View */
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {Object.entries(filteredPermissions).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280'
                }}>
                  <Eye size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
                    No permissions found
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    {searchTerm || filterBy !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'This user has no role assignments'
                    }
                  </p>
                </div>
              ) : (
                Object.entries(filteredPermissions).map(([moduleCode, permissions]) => {
                  const module = tenantModules.find(m => m.moduleCode === moduleCode);
                  const isExpanded = expandedModules.has(moduleCode);
                  
                  return (
                    <div key={moduleCode} style={{ marginBottom: '24px' }}>
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModuleExpansion(moduleCode)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 16px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          marginBottom: '8px'
                        }}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Shield size={16} color="#3b82f6" />
                        <span style={{ fontSize: '16px', fontWeight: '500' }}>
                          {module?.name || moduleCode}
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          {permissions.length} permissions
                        </span>
                      </button>

                      {/* Permissions Grid */}
                      {isExpanded && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                          gap: '8px',
                          paddingLeft: '24px'
                        }}>
                          {permissions.map((perm, index) => (
                            <div
                              key={`${perm.resource}-${perm.action}-${index}`}
                              style={{
                                padding: '12px',
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                borderLeft: `3px solid ${getDataScopeColor(perm.dataScope || 'tenant')}`
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '8px'
                              }}>
                                {getDataScopeIcon(perm.dataScope || 'tenant')}
                                <span style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#1f2937'
                                }}>
                                  {perm.resource}.{perm.action}
                                </span>
                              </div>
                              
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                <div>Data Scope: {perm.dataScope || 'tenant'}</div>
                                <div>Source: {perm.source.map(s => s.roleName).join(', ')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* List View */
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {Object.entries(filteredPermissions).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280'
                }}>
                  <Eye size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
                    No permissions found
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    {searchTerm || filterBy !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'This user has no role assignments'
                    }
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Module
                      </th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Resource
                      </th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Action
                      </th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Data Scope
                      </th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Source Role(s)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(filteredPermissions).map(([moduleCode, permissions]) =>
                      permissions.map((perm, index) => {
                        const module = tenantModules.find(m => m.moduleCode === moduleCode);
                        
                        return (
                          <tr 
                            key={`${moduleCode}-${perm.resource}-${perm.action}-${index}`}
                            style={{ borderBottom: '1px solid #f3f4f6' }}
                          >
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {module?.name || moduleCode}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>
                              {perm.resource}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>
                              {perm.action}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {getDataScopeIcon(perm.dataScope || 'tenant')}
                                {perm.dataScope || 'tenant'}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                              {perm.source.map(s => s.roleName).join(', ')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
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
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Data Scope Legend: 
            <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Unlock size={12} color="#10b981" /> Global
            </span>
            <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} color="#6b7280" /> Tenant
            </span>
            <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} color="#f59e0b" /> Department
            </span>
            <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} color="#ef4444" /> Personal
            </span>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionViewer;
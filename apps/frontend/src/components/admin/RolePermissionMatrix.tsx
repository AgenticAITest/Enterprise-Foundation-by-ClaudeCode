import React, { useState, useMemo } from 'react';
import {
  Grid3X3,
  Search,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Circle,
  AlertTriangle,
  Info,
  Crown,
  Shield,
  User,
  Database,
  Warehouse,
  Calculator,
  ShoppingCart,
  UserCheck,
  Settings
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  moduleCode: string;
  isTemplate: boolean;
  isSystem: boolean;
  permissions: Record<string, {
    granted: boolean;
    inherited: boolean;
    conditional: boolean;
    source?: 'template' | 'custom' | 'system';
  }>;
}

interface PermissionResource {
  id: string;
  code: string;
  name: string;
  actions: string[];
  parentId?: string;
  category: string;
  description: string;
}

interface RolePermissionMatrixProps {
  selectedModule: string;
  roles: Role[];
  permissionResources: Record<string, PermissionResource>;
  onPermissionToggle: (roleId: string, permissionId: string, granted: boolean) => void;
  onBulkToggle: (type: 'role' | 'permission', id: string, granted: boolean) => void;
  readOnly?: boolean;
}

const RolePermissionMatrix: React.FC<RolePermissionMatrixProps> = ({
  selectedModule,
  roles,
  permissionResources,
  onPermissionToggle,
  onBulkToggle,
  readOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showOnlyGranted, setShowOnlyGranted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ roleId: string; permissionId: string } | null>(null);

  // Get module icon
  const getModuleIcon = (moduleCode: string) => {
    switch (moduleCode) {
      case 'core': return <Database size={16} color="#3b82f6" />;
      case 'wms': return <Warehouse size={16} color="#10b981" />;
      case 'accounting': return <Calculator size={16} color="#f59e0b" />;
      case 'pos': return <ShoppingCart size={16} color="#8b5cf6" />;
      case 'hr': return <UserCheck size={16} color="#ef4444" />;
      default: return <Settings size={16} color="#6b7280" />;
    }
  };

  // Get role icon
  const getRoleIcon = (role: Role) => {
    if (role.isSystem) return <Crown size={14} color="#dc2626" />;
    if (role.isTemplate) return <Shield size={14} color="#3b82f6" />;
    return <User size={14} color="#6b7280" />;
  };

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    return roles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  // Organize permissions into hierarchical structure
  const organizedPermissions = useMemo(() => {
    const permissions = Object.values(permissionResources);
    const parentGroups: Record<string, PermissionResource[]> = {};
    const childPermissions: Record<string, PermissionResource[]> = {};

    permissions.forEach(permission => {
      if (!permission.parentId) {
        if (!parentGroups[permission.category]) {
          parentGroups[permission.category] = [];
        }
        parentGroups[permission.category].push(permission);
      } else {
        if (!childPermissions[permission.parentId]) {
          childPermissions[permission.parentId] = [];
        }
        childPermissions[permission.parentId].push(permission);
      }
    });

    return { parentGroups, childPermissions };
  }, [permissionResources]);

  // Get all permission IDs in display order
  const allPermissionIds = useMemo(() => {
    const ids: string[] = [];
    Object.entries(organizedPermissions.parentGroups).forEach(([category, parents]) => {
      if (!expandedGroups[category]) return;
      
      parents.forEach(parent => {
        parent.actions.forEach(action => {
          ids.push(`${parent.code}.${action}`);
        });
        
        const children = organizedPermissions.childPermissions[parent.id] || [];
        children.forEach(child => {
          child.actions.forEach(action => {
            ids.push(`${child.code}.${action}`);
          });
        });
      });
    });
    return ids;
  }, [organizedPermissions, expandedGroups]);

  // Toggle group expansion
  const toggleGroup = (category: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Get permission status for a role
  const getPermissionStatus = (role: Role, permissionId: string) => {
    const permission = role.permissions[permissionId];
    if (!permission) return { granted: false, inherited: false, conditional: false };
    return permission;
  };

  // Get status color and icon
  const getStatusDisplay = (status: { granted: boolean; inherited: boolean; conditional: boolean }) => {
    if (status.granted) {
      if (status.inherited) {
        return { color: '#10b981', bg: '#dcfce7', icon: <Check size={12} />, label: 'Inherited' };
      }
      if (status.conditional) {
        return { color: '#f59e0b', bg: '#fef3c7', icon: <AlertTriangle size={12} />, label: 'Conditional' };
      }
      return { color: '#10b981', bg: '#dcfce7', icon: <Check size={12} />, label: 'Granted' };
    }
    return { color: '#ef4444', bg: '#fef2f2', icon: <X size={12} />, label: 'Denied' };
  };

  // Handle permission toggle
  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    if (readOnly) return;
    const role = roles.find(r => r.id === roleId);
    if (!role || role.isSystem) return;
    
    const currentStatus = getPermissionStatus(role, permissionId);
    onPermissionToggle(roleId, permissionId, !currentStatus.granted);
  };

  // Handle bulk role toggle
  const handleBulkRoleToggle = (roleId: string, granted: boolean) => {
    if (readOnly) return;
    const role = roles.find(r => r.id === roleId);
    if (!role || role.isSystem) return;
    
    onBulkToggle('role', roleId, granted);
  };

  // Handle bulk permission toggle
  const handleBulkPermissionToggle = (permissionId: string, granted: boolean) => {
    if (readOnly) return;
    onBulkToggle('permission', permissionId, granted);
  };

  // Calculate permission statistics
  const getPermissionStats = (permissionId: string) => {
    const totalRoles = filteredRoles.filter(r => !r.isSystem).length;
    const grantedCount = filteredRoles.filter(r => 
      !r.isSystem && getPermissionStatus(r, permissionId).granted
    ).length;
    return { total: totalRoles, granted: grantedCount };
  };

  // Calculate role statistics
  const getRoleStats = (role: Role) => {
    const totalPermissions = allPermissionIds.length;
    const grantedCount = allPermissionIds.filter(permId => 
      getPermissionStatus(role, permId).granted
    ).length;
    return { total: totalPermissions, granted: grantedCount };
  };

  return (
    <div>
      {/* Matrix Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Grid3X3 size={20} color="#3b82f6" />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            Permission Matrix - {selectedModule.charAt(0).toUpperCase() + selectedModule.slice(1)}
          </h3>
          {getModuleIcon(selectedModule)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '32px',
                padding: '6px 32px 6px 32px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '14px',
                width: '180px'
              }}
            />
          </div>

          {/* Filter Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={showOnlyGranted}
              onChange={(e) => setShowOnlyGranted(e.target.checked)}
              style={{ margin: 0 }}
            />
            Only granted
          </label>

          {/* Expand All */}
          <button
            onClick={() => {
              const allCategories = Object.keys(organizedPermissions.parentGroups);
              const allExpanded = allCategories.every(cat => expandedGroups[cat]);
              const newState: Record<string, boolean> = {};
              allCategories.forEach(cat => {
                newState[cat] = !allExpanded;
              });
              setExpandedGroups(newState);
            }}
            style={{
              padding: '6px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              backgroundColor: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {Object.values(expandedGroups).every(Boolean) ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Matrix Container */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Permission Headers */}
        <div style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#f9fafb',
          borderBottom: '2px solid #e5e7eb',
          zIndex: 10
        }}>
          {/* Category Headers */}
          {Object.entries(organizedPermissions.parentGroups).map(([category, parents]) => (
            <div key={category}>
              {/* Category Toggle */}
              <div
                onClick={() => toggleGroup(category)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {expandedGroups[category] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {category} ({parents.length} resources)
              </div>

              {/* Permission Columns */}
              {expandedGroups[category] && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '240px ' + allPermissionIds.map(() => '80px').join(' '),
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {/* Role Header */}
                  <div style={{
                    padding: '12px 16px',
                    fontWeight: '600',
                    fontSize: '12px',
                    color: '#374151',
                    backgroundColor: '#f9fafb',
                    borderRight: '1px solid #e5e7eb'
                  }}>
                    ROLES
                  </div>

                  {/* Permission Headers */}
                  {allPermissionIds.map(permissionId => {
                    const stats = getPermissionStats(permissionId);
                    return (
                      <div
                        key={permissionId}
                        style={{
                          padding: '8px',
                          fontSize: '10px',
                          fontWeight: '500',
                          color: '#374151',
                          borderRight: '1px solid #e5e7eb',
                          textAlign: 'center',
                          position: 'relative'
                        }}
                      >
                        <div style={{ 
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {permissionId.split('.').pop()}
                        </div>
                        <div style={{ 
                          position: 'absolute',
                          bottom: '4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '9px',
                          color: '#6b7280'
                        }}>
                          {stats.granted}/{stats.total}
                        </div>
                        {/* Bulk toggle for permission */}
                        {!readOnly && (
                          <button
                            onClick={() => handleBulkPermissionToggle(permissionId, stats.granted < stats.total)}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              width: '12px',
                              height: '12px',
                              border: 'none',
                              borderRadius: '2px',
                              backgroundColor: stats.granted === stats.total ? '#10b981' : '#e5e7eb',
                              cursor: 'pointer',
                              fontSize: '8px'
                            }}
                          >
                            {stats.granted === stats.total ? '✓' : '+'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Role Rows */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filteredRoles.map((role, index) => {
            const roleStats = getRoleStats(role);
            return (
              <div
                key={role.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '240px ' + allPermissionIds.map(() => '80px').join(' '),
                  borderBottom: index < filteredRoles.length - 1 ? '1px solid #f3f4f6' : 'none',
                  backgroundColor: selectedRole === role.id ? '#f0f9ff' : 'white'
                }}
              >
                {/* Role Info */}
                <div
                  onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
                  style={{
                    padding: '12px 16px',
                    borderRight: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getRoleIcon(role)}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {role.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {roleStats.granted}/{roleStats.total} permissions
                      </div>
                    </div>
                  </div>
                  
                  {/* Bulk role toggle */}
                  {!readOnly && !role.isSystem && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBulkRoleToggle(role.id, false);
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '2px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          fontSize: '10px',
                          color: '#ef4444'
                        }}
                        title="Deny all permissions"
                      >
                        ✗
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBulkRoleToggle(role.id, true);
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '2px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          fontSize: '10px',
                          color: '#10b981'
                        }}
                        title="Grant all permissions"
                      >
                        ✓
                      </button>
                    </div>
                  )}
                </div>

                {/* Permission Cells */}
                {allPermissionIds.map(permissionId => {
                  const status = getPermissionStatus(role, permissionId);
                  const display = getStatusDisplay(status);
                  const isHovered = hoveredCell?.roleId === role.id && hoveredCell?.permissionId === permissionId;

                  if (showOnlyGranted && !status.granted) {
                    return (
                      <div
                        key={permissionId}
                        style={{
                          borderRight: '1px solid #e5e7eb',
                          backgroundColor: '#f9fafb'
                        }}
                      />
                    );
                  }

                  return (
                    <div
                      key={permissionId}
                      onMouseEnter={() => setHoveredCell({ roleId: role.id, permissionId })}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        borderRight: '1px solid #e5e7eb',
                        position: 'relative',
                        backgroundColor: isHovered ? '#f0f9ff' : 'transparent'
                      }}
                    >
                      <button
                        onClick={() => handlePermissionToggle(role.id, permissionId)}
                        disabled={readOnly || role.isSystem}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: display.bg,
                          color: display.color,
                          cursor: readOnly || role.isSystem ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: readOnly || role.isSystem ? 0.6 : 1
                        }}
                        title={`${role.name} - ${permissionId}: ${display.label}`}
                      >
                        {display.icon}
                      </button>

                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          top: '-40px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#1f2937',
                          color: 'white',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          zIndex: 20
                        }}>
                          {role.name} - {permissionId}
                          <br />
                          {display.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredRoles.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Grid3X3 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              No roles found
            </h3>
            <p>
              {searchTerm ? 'Try adjusting your search terms.' : 'No roles available for this module.'}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        padding: '12px 16px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#dcfce7',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Check size={10} color="#10b981" />
          </div>
          Granted
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#fef2f2',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <X size={10} color="#ef4444" />
          </div>
          Denied
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={10} color="#f59e0b" />
          </div>
          Conditional
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crown size={14} color="#dc2626" />
          System Role (Read-only)
        </div>
      </div>
    </div>
  );
};

export default RolePermissionMatrix;
import React, { useState } from 'react';
import {
  Users,
  Shield,
  Edit,
  Copy,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Database,
  Warehouse,
  Calculator,
  ShoppingCart,
  UserCheck,
  Settings,
  Crown,
  User,
  MoreVertical
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  moduleCode: string;
  description: string;
  isTemplate: boolean;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive';
}

interface RoleListViewProps {
  rolesByModule: Record<string, Role[]>;
  selectedModule: string;
  onModuleChange: (moduleCode: string) => void;
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
  onCloneRole: (role: Role) => void;
  onDeleteRole: (role: Role) => void;
  onViewPermissions: (role: Role) => void;
}

const RoleListView: React.FC<RoleListViewProps> = ({
  rolesByModule,
  selectedModule,
  onModuleChange,
  onCreateRole,
  onEditRole,
  onCloneRole,
  onDeleteRole,
  onViewPermissions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'template' | 'custom' | 'system'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'users' | 'permissions' | 'updated'>('name');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  const getRoleIcon = (role: Role) => {
    if (role.isSystem) return <Crown size={16} color="#dc2626" />;
    if (role.isTemplate) return <Shield size={16} color="#3b82f6" />;
    return <User size={16} color="#6b7280" />;
  };

  const getRoleTypeLabel = (role: Role) => {
    if (role.isSystem) return 'System';
    if (role.isTemplate) return 'Template';
    return 'Custom';
  };

  const getRoleTypeColor = (role: Role) => {
    if (role.isSystem) return { bg: '#fecaca', text: '#dc2626', border: '#fca5a5' };
    if (role.isTemplate) return { bg: '#dbeafe', text: '#3b82f6', border: '#93c5fd' };
    return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'inactive': return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
      default: return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
    }
  };

  // Filter and sort roles
  const currentRoles = rolesByModule[selectedModule] || [];
  const filteredRoles = currentRoles
    .filter(role => {
      // Search filter
      if (searchTerm && !role.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !role.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && role.status !== statusFilter) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'system' && !role.isSystem) return false;
        if (typeFilter === 'template' && !role.isTemplate) return false;
        if (typeFilter === 'custom' && (role.isTemplate || role.isSystem)) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'users': return b.userCount - a.userCount;
        case 'permissions': return b.permissionCount - a.permissionCount;
        case 'updated': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name':
        default: return a.name.localeCompare(b.name);
      }
    });

  const handleDropdownAction = (roleId: string, action: string, role: Role) => {
    setOpenDropdown(null);
    switch (action) {
      case 'edit': onEditRole(role); break;
      case 'clone': onCloneRole(role); break;
      case 'delete': onDeleteRole(role); break;
      case 'permissions': onViewPermissions(role); break;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div>
      {/* Header with Module Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#3b82f6" />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Role Management
            </h2>
          </div>
          
          <div style={{ position: 'relative' }}>
            <select
              value={selectedModule}
              onChange={(e) => onModuleChange(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                minWidth: '140px',
                appearance: 'none'
              }}
            >
              {Object.keys(rolesByModule).map(moduleCode => (
                <option key={moduleCode} value={moduleCode}>
                  {moduleCode.charAt(0).toUpperCase() + moduleCode.slice(1)} Module
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#6b7280'
            }} />
          </div>
        </div>

        <button
          onClick={onCreateRole}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          Create Role
        </button>
      </div>

      {/* Filters and Search */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto auto',
        gap: '12px',
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Types</option>
          <option value="system">System</option>
          <option value="template">Template</option>
          <option value="custom">Custom</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="name">Name</option>
          <option value="users">User Count</option>
          <option value="permissions">Permissions</option>
          <option value="updated">Last Updated</option>
        </select>

        {/* Results Count */}
        <div style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
          {filteredRoles.length} of {currentRoles.length} roles
        </div>
      </div>

      {/* Role List */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {filteredRoles.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              No roles found
            </h3>
            <p style={{ marginBottom: '16px' }}>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : `No roles available for the ${selectedModule} module.`
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto auto auto auto',
              gap: '16px',
              padding: '16px 20px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Role</div>
              <div style={{ textAlign: 'center' }}>Type</div>
              <div style={{ textAlign: 'center' }}>Status</div>
              <div style={{ textAlign: 'center' }}>Users</div>
              <div style={{ textAlign: 'center' }}>Permissions</div>
              <div style={{ textAlign: 'center' }}>Actions</div>
            </div>

            {/* Role Rows */}
            {filteredRoles.map((role) => {
              const typeColors = getRoleTypeColor(role);
              const statusColors = getStatusColor(role.status);

              return (
                <div
                  key={role.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto auto auto',
                    gap: '16px',
                    padding: '16px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    alignItems: 'center'
                  }}
                >
                  {/* Role Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      padding: '8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {getModuleIcon(role.moduleCode)}
                      {getRoleIcon(role)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        {role.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        {role.description}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                        Updated {formatDate(role.updatedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: typeColors.bg,
                    color: typeColors.text,
                    border: `1px solid ${typeColors.border}`,
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {getRoleTypeLabel(role)}
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: statusColors.bg,
                    color: statusColors.text,
                    border: `1px solid ${statusColors.border}`,
                    textAlign: 'center',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap'
                  }}>
                    {role.status}
                  </div>

                  {/* User Count */}
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    textAlign: 'center',
                    color: role.userCount > 0 ? '#1f2937' : '#9ca3af'
                  }}>
                    {role.userCount}
                  </div>

                  {/* Permission Count */}
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    textAlign: 'center',
                    color: '#1f2937'
                  }}>
                    {role.permissionCount}
                  </div>

                  {/* Actions Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === role.id ? null : role.id)}
                      style={{
                        padding: '6px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <MoreVertical size={14} color="#6b7280" />
                    </button>

                    {openDropdown === role.id && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '4px',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 10,
                        minWidth: '140px'
                      }}>
                        <button
                          onClick={() => handleDropdownAction(role.id, 'permissions', role)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'left',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Shield size={14} />
                          View Permissions
                        </button>
                        
                        {!role.isSystem && (
                          <>
                            <button
                              onClick={() => handleDropdownAction(role.id, 'edit', role)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                textAlign: 'left',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <Edit size={14} />
                              Edit Role
                            </button>
                            
                            <button
                              onClick={() => handleDropdownAction(role.id, 'clone', role)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                textAlign: 'left',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <Copy size={14} />
                              Clone Role
                            </button>
                            
                            {role.userCount === 0 && (
                              <button
                                onClick={() => handleDropdownAction(role.id, 'delete', role)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  textAlign: 'left',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  color: '#dc2626'
                                }}
                              >
                                <Trash2 size={14} />
                                Delete Role
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
};

export default RoleListView;
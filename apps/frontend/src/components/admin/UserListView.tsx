import React, { useState, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Shield,
  Eye,
  UserMinus,
  UserPlus,
  Download,
  RefreshCw,
  Check,
  X,
  Clock,
  AlertCircle,
  Settings
} from 'lucide-react';

interface UserListViewProps {
  onEditUser: (user: any) => void;
  onAssignRoles: (user: any) => void;
  onViewPermissions: (user: any) => void;
  onBulkOperations: (users: any[]) => void;
  onUserActivity: (user: any) => void;
}

const UserListView: React.FC<UserListViewProps> = ({
  onEditUser,
  onAssignRoles,
  onViewPermissions,
  onBulkOperations,
  onUserActivity
}) => {
  const { tenantUsers, isLoading, refreshUsers } = useTenantAdmin();
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive, invited
  const [roleFilter, setRoleFilter] = useState('all'); // all, hasRoles, noRoles
  const [sortBy, setSortBy] = useState('name'); // name, email, lastActive, status
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = tenantUsers.filter(user => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.department?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }

      // Role filter
      if (roleFilter === 'hasRoles' && user.roleAssignments.length === 0) {
        return false;
      }
      if (roleFilter === 'noRoles' && user.roleAssignments.length > 0) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'lastActive':
          aValue = new Date(a.lastActive || 0).getTime();
          bValue = new Date(b.lastActive || 0).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tenantUsers, searchTerm, statusFilter, roleFilter, sortBy, sortDirection]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredAndSortedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(u => u.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: { bg: '#10b981', color: 'white', icon: Check },
      inactive: { bg: '#6b7280', color: 'white', icon: X },
      invited: { bg: '#f59e0b', color: 'white', icon: Clock },
      suspended: { bg: '#ef4444', color: 'white', icon: AlertCircle }
    };
    
    const style = styles[status as keyof typeof styles] || styles.inactive;
    const Icon = style.icon;
    
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        backgroundColor: style.bg,
        color: style.color,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRolesSummary = (roleAssignments: any[]) => {
    if (roleAssignments.length === 0) {
      return <span style={{ color: '#6b7280', fontSize: '14px' }}>No roles assigned</span>;
    }

    const rolesByModule = roleAssignments.reduce((acc, assignment) => {
      if (!acc[assignment.moduleCode]) {
        acc[assignment.moduleCode] = [];
      }
      acc[assignment.moduleCode].push(assignment.roleName);
      return acc;
    }, {} as Record<string, string[]>);

    return (
      <div style={{ fontSize: '14px' }}>
        {Object.entries(rolesByModule).map(([module, roles], index) => (
          <div key={module} style={{ marginBottom: index < Object.entries(rolesByModule).length - 1 ? '2px' : '0' }}>
            <span style={{ fontWeight: '500', color: '#374151' }}>{module}:</span>
            <span style={{ marginLeft: '4px', color: '#6b7280' }}>{roles.join(', ')}</span>
          </div>
        ))}
      </div>
    );
  };

  const formatLastActive = (lastActive: string | null) => {
    if (!lastActive) return 'Never';
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px' 
      }}>
        <RefreshCw className="animate-spin" size={24} />
        <span style={{ marginLeft: '8px' }}>Loading users...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: 0,
            marginBottom: '4px'
          }}>
            Users ({filteredAndSortedUsers.length})
          </h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
            Manage user accounts and role assignments
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => refreshUsers()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          
          {selectedUsers.size > 0 && (
            <button
              onClick={() => onBulkOperations(Array.from(selectedUsers).map(id => 
                tenantUsers.find(u => u.id === id)
              ).filter(Boolean))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <Settings size={16} />
              Bulk Operations ({selectedUsers.size})
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 36px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: showFilters ? '#3b82f6' : '#f3f4f6',
              color: showFilters ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
        
        {/* Filter Options */}
        {showFilters && (
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            padding: '16px', 
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="invited">Invited</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            {/* Role Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Roles
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Users</option>
                <option value="hasRoles">Has Roles</option>
                <option value="noRoles">No Roles</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* User Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 200px 150px 200px 120px 60px',
          gap: '16px',
          padding: '12px 16px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          alignItems: 'center'
        }}>
          <input
            type="checkbox"
            checked={selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
            onChange={handleSelectAll}
            style={{ cursor: 'pointer' }}
          />
          
          <button
            onClick={() => handleSort('name')}
            style={{ 
              background: 'none', 
              border: 'none', 
              textAlign: 'left', 
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              color: '#374151',
              textTransform: 'uppercase'
            }}
          >
            User {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          
          <button
            onClick={() => handleSort('email')}
            style={{ 
              background: 'none', 
              border: 'none', 
              textAlign: 'left', 
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              color: '#374151',
              textTransform: 'uppercase'
            }}
          >
            Email {sortBy === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          
          <button
            onClick={() => handleSort('status')}
            style={{ 
              background: 'none', 
              border: 'none', 
              textAlign: 'left', 
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              color: '#374151',
              textTransform: 'uppercase'
            }}
          >
            Status {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', textTransform: 'uppercase' }}>
            Roles
          </div>
          
          <button
            onClick={() => handleSort('lastActive')}
            style={{ 
              background: 'none', 
              border: 'none', 
              textAlign: 'left', 
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              color: '#374151',
              textTransform: 'uppercase'
            }}
          >
            Last Active {sortBy === 'lastActive' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          
          <div></div>
        </div>
        
        {/* Table Body */}
        {filteredAndSortedUsers.map((user) => (
          <div
            key={user.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 200px 150px 200px 120px 60px',
              gap: '16px',
              padding: '16px',
              borderBottom: '1px solid #f3f4f6',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <input
              type="checkbox"
              checked={selectedUsers.has(user.id)}
              onChange={() => handleSelectUser(user.id)}
              style={{ cursor: 'pointer' }}
            />
            
            {/* User Info */}
            <div>
              <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>
                {user.name}
              </div>
              {user.department && (
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {user.department}
                </div>
              )}
            </div>
            
            {/* Email */}
            <div style={{ fontSize: '14px', color: '#374151' }}>
              {user.email}
            </div>
            
            {/* Status */}
            <div>
              {getStatusBadge(user.status)}
            </div>
            
            {/* Roles */}
            <div>
              {getRolesSummary(user.roleAssignments)}
            </div>
            
            {/* Last Active */}
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {formatLastActive(user.lastActive)}
            </div>
            
            {/* Actions */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                <MoreVertical size={16} />
              </button>
              
              {openDropdown === user.id && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  minWidth: '180px'
                }}>
                  <button
                    onClick={() => {
                      onEditUser(user);
                      setOpenDropdown(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <Edit size={14} />
                    Edit User
                  </button>
                  
                  <button
                    onClick={() => {
                      onAssignRoles(user);
                      setOpenDropdown(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <Shield size={14} />
                    Assign Roles
                  </button>
                  
                  <button
                    onClick={() => {
                      onViewPermissions(user);
                      setOpenDropdown(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <Eye size={14} />
                    View Permissions
                  </button>
                  
                  <button
                    onClick={() => {
                      onUserActivity(user);
                      setOpenDropdown(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <Clock size={14} />
                    View Activity
                  </button>
                  
                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                  
                  <button
                    onClick={() => {
                      // Handle deactivate
                      setOpenDropdown(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#ef4444'
                    }}
                  >
                    <UserMinus size={14} />
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {filteredAndSortedUsers.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
              No users found
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No users have been added to this tenant yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListView;
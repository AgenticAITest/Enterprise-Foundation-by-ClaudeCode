import React, { useState, useMemo } from 'react';
import { 
  History, 
  User, 
  Shield, 
  Calendar, 
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Download,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Diff,
  GitBranch,
  ChevronDown,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface RoleChange {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  targetUserId: string;
  targetUserName: string;
  changeType: 'assignment' | 'removal' | 'modification' | 'creation' | 'deletion';
  roleId: string;
  roleName: string;
  module: string;
  previousPermissions?: string[];
  newPermissions?: string[];
  reason?: string;
  approver?: {
    id: string;
    name: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'auto-applied';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number;
  sessionId: string;
  ipAddress: string;
  rollbackAvailable: boolean;
  metadata?: {
    department?: string;
    projectCode?: string;
    expiresAt?: string;
    requestTicket?: string;
  };
}

interface Props {
  className?: string;
}

const mockRoleChanges: RoleChange[] = [
  {
    id: 'rc-001',
    timestamp: '2024-01-15T14:30:00Z',
    userId: 'usr-admin-001',
    userName: 'Sarah Chen',
    targetUserId: 'usr-emp-052',
    targetUserName: 'Mike Rodriguez',
    changeType: 'assignment',
    roleId: 'role-finance-mgr',
    roleName: 'Finance Manager',
    module: 'Finance',
    newPermissions: ['finance.budget.read', 'finance.budget.write', 'finance.reports.read', 'finance.approval.write'],
    reason: 'Promotion to Finance Manager position',
    approver: {
      id: 'usr-admin-001',
      name: 'Sarah Chen'
    },
    status: 'approved',
    riskLevel: 'medium',
    affectedUsers: 1,
    sessionId: 'sess-001',
    ipAddress: '192.168.1.101',
    rollbackAvailable: true,
    metadata: {
      department: 'Finance',
      requestTicket: 'TICK-2024-0089',
      expiresAt: '2025-01-15T14:30:00Z'
    }
  },
  {
    id: 'rc-002',
    timestamp: '2024-01-15T13:15:00Z',
    userId: 'usr-admin-002',
    userName: 'David Kim',
    targetUserId: 'usr-emp-034',
    targetUserName: 'Lisa Wang',
    changeType: 'removal',
    roleId: 'role-hr-admin',
    roleName: 'HR Administrator',
    module: 'HR',
    previousPermissions: ['hr.employee.read', 'hr.employee.write', 'hr.payroll.read', 'hr.reports.write'],
    reason: 'End of temporary assignment',
    approver: {
      id: 'usr-admin-002',
      name: 'David Kim'
    },
    status: 'approved',
    riskLevel: 'low',
    affectedUsers: 1,
    sessionId: 'sess-002',
    ipAddress: '192.168.1.102',
    rollbackAvailable: true,
    metadata: {
      department: 'HR',
      projectCode: 'PROJ-HR-2024-Q1'
    }
  },
  {
    id: 'rc-003',
    timestamp: '2024-01-15T12:45:00Z',
    userId: 'system-auto',
    userName: 'System Automation',
    targetUserId: 'multiple',
    targetUserName: '15 Users',
    changeType: 'modification',
    roleId: 'role-sales-rep',
    roleName: 'Sales Representative',
    module: 'Sales',
    previousPermissions: ['sales.leads.read', 'sales.opportunities.read'],
    newPermissions: ['sales.leads.read', 'sales.leads.write', 'sales.opportunities.read', 'sales.opportunities.write'],
    reason: 'Quarterly access expansion for Q1 targets',
    status: 'auto-applied',
    riskLevel: 'low',
    affectedUsers: 15,
    sessionId: 'sess-auto-003',
    ipAddress: 'system',
    rollbackAvailable: true,
    metadata: {
      department: 'Sales',
      expiresAt: '2024-03-31T23:59:59Z'
    }
  },
  {
    id: 'rc-004',
    timestamp: '2024-01-15T11:20:00Z',
    userId: 'usr-admin-001',
    userName: 'Sarah Chen',
    targetUserId: 'usr-emp-091',
    targetUserName: 'Carlos Martinez',
    changeType: 'assignment',
    roleId: 'role-it-security',
    roleName: 'IT Security Specialist',
    module: 'Security',
    newPermissions: ['security.audit.read', 'security.logs.read', 'security.policies.write', 'security.incidents.write'],
    reason: 'Security team expansion - new hire',
    approver: {
      id: 'usr-admin-001',
      name: 'Sarah Chen'
    },
    status: 'pending',
    riskLevel: 'high',
    affectedUsers: 1,
    sessionId: 'sess-004',
    ipAddress: '192.168.1.101',
    rollbackAvailable: false,
    metadata: {
      department: 'IT',
      requestTicket: 'TICK-2024-0091'
    }
  },
  {
    id: 'rc-005',
    timestamp: '2024-01-15T10:00:00Z',
    userId: 'usr-admin-003',
    userName: 'Emma Thompson',
    targetUserId: 'usr-emp-067',
    targetUserName: 'Robert Johnson',
    changeType: 'removal',
    roleId: 'role-admin-temp',
    roleName: 'Temporary Administrator',
    module: 'Admin',
    previousPermissions: ['admin.users.read', 'admin.users.write', 'admin.roles.read', 'admin.system.read'],
    reason: 'Temporary admin access expired',
    approver: {
      id: 'usr-admin-003',
      name: 'Emma Thompson'
    },
    status: 'approved',
    riskLevel: 'medium',
    affectedUsers: 1,
    sessionId: 'sess-005',
    ipAddress: '192.168.1.103',
    rollbackAvailable: false,
    metadata: {
      department: 'IT',
      projectCode: 'PROJ-MIGRATION-2024',
      expiresAt: '2024-01-15T10:00:00Z'
    }
  },
  {
    id: 'rc-006',
    timestamp: '2024-01-15T09:30:00Z',
    userId: 'usr-admin-001',
    userName: 'Sarah Chen',
    targetUserId: 'usr-emp-023',
    targetUserName: 'Jennifer Lee',
    changeType: 'creation',
    roleId: 'role-custom-proj-001',
    roleName: 'Project Alpha Lead',
    module: 'Projects',
    newPermissions: ['projects.alpha.read', 'projects.alpha.write', 'projects.budget.approve', 'projects.team.manage'],
    reason: 'Custom role for Project Alpha leadership',
    approver: {
      id: 'usr-admin-001',
      name: 'Sarah Chen'
    },
    status: 'rejected',
    riskLevel: 'critical',
    affectedUsers: 1,
    sessionId: 'sess-006',
    ipAddress: '192.168.1.101',
    rollbackAvailable: false,
    metadata: {
      department: 'Projects',
      requestTicket: 'TICK-2024-0095',
      projectCode: 'PROJ-ALPHA-2024'
    }
  }
];

const RoleChangeTracker: React.FC<Props> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedChangeType, setSelectedChangeType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState<'timestamp' | 'riskLevel' | 'affectedUsers'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState<string | null>(null);

  const modules = [...new Set(mockRoleChanges.map(change => change.module))];
  const changeTypes = [...new Set(mockRoleChanges.map(change => change.changeType))];
  const statuses = [...new Set(mockRoleChanges.map(change => change.status))];
  const riskLevels = [...new Set(mockRoleChanges.map(change => change.riskLevel))];

  const filteredChanges = useMemo(() => {
    let filtered = mockRoleChanges.filter(change => {
      const matchesSearch = !searchTerm || 
        change.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        change.targetUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        change.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        change.reason?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesModule = selectedModule === 'all' || change.module === selectedModule;
      const matchesChangeType = selectedChangeType === 'all' || change.changeType === selectedChangeType;
      const matchesStatus = selectedStatus === 'all' || change.status === selectedStatus;
      const matchesRiskLevel = selectedRiskLevel === 'all' || change.riskLevel === selectedRiskLevel;
      
      const matchesDateRange = (!dateRange.start || change.timestamp >= dateRange.start) &&
                              (!dateRange.end || change.timestamp <= dateRange.end);

      return matchesSearch && matchesModule && matchesChangeType && matchesStatus && matchesRiskLevel && matchesDateRange;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'riskLevel':
          const riskOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          aValue = riskOrder[a.riskLevel];
          bValue = riskOrder[b.riskLevel];
          break;
        case 'affectedUsers':
          aValue = a.affectedUsers;
          bValue = b.affectedUsers;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedModule, selectedChangeType, selectedStatus, selectedRiskLevel, dateRange, sortBy, sortOrder]);

  const toggleExpanded = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'assignment': return <CheckCircle size={14} />;
      case 'removal': return <XCircle size={14} />;
      case 'modification': return <Activity size={14} />;
      case 'creation': return <Shield size={14} />;
      case 'deletion': return <XCircle size={14} />;
      default: return <History size={14} />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'assignment': return '#10b981';
      case 'removal': return '#ef4444';
      case 'modification': return '#f59e0b';
      case 'creation': return '#3b82f6';
      case 'deletion': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      case 'auto-applied': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const handleExport = () => {
    const csvContent = [
      'Timestamp,User,Target User,Change Type,Role,Module,Status,Risk Level,Affected Users,Reason',
      ...filteredChanges.map(change => 
        `${change.timestamp},${change.userName},${change.targetUserName},${change.changeType},${change.roleName},${change.module},${change.status},${change.riskLevel},${change.affectedUsers},"${change.reason || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `role-changes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderPermissionComparison = (change: RoleChange) => {
    if (!change.previousPermissions && !change.newPermissions) return null;

    const previous = change.previousPermissions || [];
    const current = change.newPermissions || [];
    const added = current.filter(p => !previous.includes(p));
    const removed = previous.filter(p => !current.includes(p));
    const unchanged = current.filter(p => previous.includes(p));

    return (
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
          <Diff size={16} />
          Permission Changes
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
          {/* Added Permissions */}
          {added.length > 0 && (
            <div>
              <div style={{ color: '#10b981', fontWeight: '500', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} />
                Added ({added.length})
              </div>
              <div style={{ backgroundColor: '#dcfce7', padding: '8px', borderRadius: '4px' }}>
                {added.map(permission => (
                  <div key={permission} style={{ color: '#166534', fontFamily: 'monospace', fontSize: '11px' }}>
                    + {permission}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed Permissions */}
          {removed.length > 0 && (
            <div>
              <div style={{ color: '#ef4444', fontWeight: '500', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <XCircle size={12} />
                Removed ({removed.length})
              </div>
              <div style={{ backgroundColor: '#fecaca', padding: '8px', borderRadius: '4px' }}>
                {removed.map(permission => (
                  <div key={permission} style={{ color: '#dc2626', fontFamily: 'monospace', fontSize: '11px' }}>
                    - {permission}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Unchanged Permissions */}
        {unchanged.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ color: '#6b7280', fontWeight: '500', marginBottom: '4px', fontSize: '12px' }}>
              Unchanged ({unchanged.length})
            </div>
            <div style={{ backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px', maxHeight: '80px', overflowY: 'auto' }}>
              {unchanged.map(permission => (
                <div key={permission} style={{ color: '#475569', fontFamily: 'monospace', fontSize: '10px' }}>
                  {permission}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Role Change Tracker
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Track and analyze role assignments, modifications, and permission changes across your organization
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search users, roles, or reasons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 8px 8px 32px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          />
        </div>

        {/* Module Filter */}
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Modules</option>
          {modules.map(module => (
            <option key={module} value={module}>{module}</option>
          ))}
        </select>

        {/* Change Type Filter */}
        <select
          value={selectedChangeType}
          onChange={(e) => setSelectedChangeType(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Change Types</option>
          {changeTypes.map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
          ))}
        </select>

        {/* Risk Level Filter */}
        <select
          value={selectedRiskLevel}
          onChange={(e) => setSelectedRiskLevel(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Risk Levels</option>
          {riskLevels.map(level => (
            <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
          ))}
        </select>

        {/* Sort Options */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: 'white'
            }}
          >
            <option value="timestamp">Sort by Time</option>
            <option value="riskLevel">Sort by Risk</option>
            <option value="affectedUsers">Sort by Impact</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {sortOrder === 'desc' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '8px 0',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Showing {filteredChanges.length} of {mockRoleChanges.length} role changes
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }}></div>
            Critical: {filteredChanges.filter(c => c.riskLevel === 'critical').length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
            High: {filteredChanges.filter(c => c.riskLevel === 'high').length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
            Pending: {filteredChanges.filter(c => c.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Changes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredChanges.map((change) => (
          <div
            key={change.id}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Change Header */}
            <div
              style={{
                padding: '16px',
                cursor: 'pointer',
                borderLeft: `4px solid ${getRiskLevelColor(change.riskLevel)}`
              }}
              onClick={() => toggleExpanded(change.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {expandedChanges.has(change.id) ? 
                      <ChevronDown size={16} style={{ color: '#6b7280' }} /> : 
                      <ChevronRight size={16} style={{ color: '#6b7280' }} />
                    }
                    <div style={{ color: getChangeTypeColor(change.changeType) }}>
                      {getChangeTypeIcon(change.changeType)}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        {change.userName} {change.changeType === 'assignment' ? 'assigned' : 
                                           change.changeType === 'removal' ? 'removed' :
                                           change.changeType === 'modification' ? 'modified' :
                                           change.changeType === 'creation' ? 'created' :
                                           'deleted'} {change.roleName}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '500',
                        color: 'white',
                        backgroundColor: getChangeTypeColor(change.changeType),
                        borderRadius: '3px',
                        textTransform: 'uppercase'
                      }}>
                        {change.changeType}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {change.targetUserName !== 'multiple' ? `Target: ${change.targetUserName}` : `${change.affectedUsers} users affected`} • 
                      {' '}{change.module} Module • 
                      {' '}{new Date(change.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: getRiskLevelColor(change.riskLevel),
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {change.riskLevel}
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: getStatusColor(change.status),
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {change.status}
                  </div>
                  {change.rollbackAvailable && (
                    <div style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      color: '#3b82f6',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      <RotateCcw size={10} />
                      Rollback
                    </div>
                  )}
                </div>
              </div>

              {change.reason && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                  Reason: {change.reason}
                </div>
              )}
            </div>

            {/* Expanded Details */}
            {expandedChanges.has(change.id) && (
              <div style={{
                padding: '16px',
                borderTop: '1px solid #f3f4f6',
                backgroundColor: '#fafbfc'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  {/* Change Details */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '8px', margin: '0 0 8px 0' }}>
                      Change Details
                    </h4>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
                      <div><strong>Session ID:</strong> {change.sessionId}</div>
                      <div><strong>IP Address:</strong> {change.ipAddress}</div>
                      <div><strong>Affected Users:</strong> {change.affectedUsers}</div>
                      {change.approver && (
                        <div><strong>Approved by:</strong> {change.approver.name}</div>
                      )}
                      {change.metadata?.requestTicket && (
                        <div><strong>Ticket:</strong> {change.metadata.requestTicket}</div>
                      )}
                      {change.metadata?.expiresAt && (
                        <div><strong>Expires:</strong> {new Date(change.metadata.expiresAt).toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  {change.metadata && Object.keys(change.metadata).length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '8px', margin: '0 0 8px 0' }}>
                        Additional Information
                      </h4>
                      <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
                        {change.metadata.department && (
                          <div><strong>Department:</strong> {change.metadata.department}</div>
                        )}
                        {change.metadata.projectCode && (
                          <div><strong>Project:</strong> {change.metadata.projectCode}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Permission Comparison */}
                {renderPermissionComparison(change)}

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={12} />
                    View Full Details
                  </button>
                  {change.rollbackAvailable && (
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#92400e'
                      }}
                    >
                      <RotateCcw size={12} />
                      Rollback Change
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredChanges.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: '#6b7280'
        }}>
          <History size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No role changes found</h3>
          <p style={{ fontSize: '14px' }}>
            Try adjusting your filters or search terms to find role changes.
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleChangeTracker;
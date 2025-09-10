import React, { useState, useEffect, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Activity, Search, Filter, Download, RefreshCw, Eye, AlertTriangle,
  CheckCircle, XCircle, Clock, User, Shield, Database, Settings,
  ChevronDown, ChevronRight, Calendar, ExternalLink, Info
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  module: string;
  severity: 'info' | 'warning' | 'error' | 'security';
  ipAddress: string;
  userAgent: string;
  details: {
    beforeState?: any;
    afterState?: any;
    metadata?: Record<string, any>;
  };
  sessionId: string;
  outcome: 'success' | 'failure' | 'blocked';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface AuditLogViewerProps {
  selectedUserId?: string;
  selectedModule?: string;
  onLogSelect?: (log: AuditLogEntry) => void;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  selectedUserId,
  selectedModule,
  onLogSelect
}) => {
  const { tenantUsers, tenantModules } = useTenantAdmin();
  
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState(selectedModule || 'all');
  const [userFilter, setUserFilter] = useState(selectedUserId || 'all');
  const [dateRange, setDateRange] = useState('week'); // hour, day, week, month, all
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Mock audit log data
  const mockAuditLogs: AuditLogEntry[] = [
    {
      id: 'log-1',
      tenantId: 'tenant-123',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
      userId: 'user-1',
      userName: 'John Admin',
      action: 'role_assignment',
      resource: 'user_roles',
      module: 'system',
      severity: 'info',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        beforeState: { roles: ['User'] },
        afterState: { roles: ['User', 'Manager'] },
        metadata: {
          targetUserId: 'user-2',
          targetUserName: 'Jane Smith',
          addedRole: 'Manager',
          moduleCode: 'crm'
        }
      },
      sessionId: 'sess-abc123',
      outcome: 'success'
    },
    {
      id: 'log-2',
      tenantId: 'tenant-123',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
      userId: 'user-2',
      userName: 'Jane Smith',
      action: 'login_failed',
      resource: 'authentication',
      module: 'system',
      severity: 'warning',
      ipAddress: '192.168.1.201',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        metadata: {
          reason: 'invalid_password',
          attemptCount: 3,
          lockoutThreshold: 5
        }
      },
      sessionId: 'sess-def456',
      outcome: 'failure',
      riskLevel: 'medium'
    },
    {
      id: 'log-3',
      tenantId: 'tenant-123',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
      userId: 'user-3',
      userName: 'Bob Wilson',
      action: 'data_export',
      resource: 'customer_data',
      module: 'crm',
      severity: 'info',
      ipAddress: '192.168.1.150',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        metadata: {
          exportFormat: 'csv',
          recordCount: 1250,
          fileSize: '2.4MB',
          exportReason: 'quarterly_report'
        }
      },
      sessionId: 'sess-ghi789',
      outcome: 'success'
    },
    {
      id: 'log-4',
      tenantId: 'tenant-123',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      userId: 'user-4',
      userName: 'Alice Johnson',
      action: 'permission_escalation',
      resource: 'system_settings',
      module: 'system',
      severity: 'security',
      ipAddress: '192.168.1.75',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        beforeState: { permissions: ['read'] },
        afterState: { permissions: ['read', 'write', 'admin'] },
        metadata: {
          escalationType: 'temporary',
          approvedBy: 'user-1',
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        }
      },
      sessionId: 'sess-jkl012',
      outcome: 'success',
      riskLevel: 'high'
    },
    {
      id: 'log-5',
      tenantId: 'tenant-123',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      userId: 'user-5',
      userName: 'Charlie Brown',
      action: 'unauthorized_access',
      resource: 'financial_reports',
      module: 'finance',
      severity: 'error',
      ipAddress: '10.0.0.45',
      userAgent: 'curl/7.68.0',
      details: {
        metadata: {
          attemptedResource: '/api/finance/reports/confidential',
          userRole: 'Basic User',
          requiredRole: 'Finance Manager',
          blockReason: 'insufficient_permissions'
        }
      },
      sessionId: 'sess-mno345',
      outcome: 'blocked',
      riskLevel: 'critical'
    },
    {
      id: 'log-6',
      tenantId: 'tenant-123',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      userId: 'user-1',
      userName: 'John Admin',
      action: 'scope_assignment',
      resource: 'data_scopes',
      module: 'system',
      severity: 'info',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        beforeState: { scopes: ['personal'] },
        afterState: { scopes: ['personal', 'department'] },
        metadata: {
          targetUserId: 'user-6',
          targetUserName: 'Diana Prince',
          addedScope: 'Sales Department',
          scopeType: 'department'
        }
      },
      sessionId: 'sess-pqr678',
      outcome: 'success'
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAuditLogs(mockAuditLogs);
      setIsLoading(false);
    }, 500);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...auditLogs];

    // Date range filter
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (dateRange) {
      case 'hour':
        cutoffDate.setHours(now.getHours() - 1);
        break;
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0);
    }

    if (dateRange !== 'all') {
      filtered = filtered.filter(log => new Date(log.timestamp) >= cutoffDate);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchLower) ||
        log.resource.toLowerCase().includes(searchLower) ||
        log.userName.toLowerCase().includes(searchLower) ||
        log.details.metadata && JSON.stringify(log.details.metadata).toLowerCase().includes(searchLower)
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    // Outcome filter  
    if (outcomeFilter !== 'all') {
      filtered = filtered.filter(log => log.outcome === outcomeFilter);
    }

    // Module filter
    if (moduleFilter !== 'all') {
      filtered = filtered.filter(log => log.module === moduleFilter);
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(log => log.userId === userFilter);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, severityFilter, outcomeFilter, moduleFilter, userFilter, dateRange]);

  const handleLogClick = (log: AuditLogEntry) => {
    setSelectedLog(log);
    if (onLogSelect) {
      onLogSelect(log);
    }
  };

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const exportLogs = () => {
    const csvData = filteredLogs.map(log => ({
      timestamp: log.timestamp,
      user: log.userName,
      action: log.action,
      resource: log.resource,
      module: log.module,
      severity: log.severity,
      outcome: log.outcome,
      ipAddress: log.ipAddress
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <Info size={14} color="#3b82f6" />;
      case 'warning': return <AlertTriangle size={14} color="#f59e0b" />;
      case 'error': return <XCircle size={14} color="#ef4444" />;
      case 'security': return <Shield size={14} color="#8b5cf6" />;
      default: return <Info size={14} color="#6b7280" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'security': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success': return <CheckCircle size={14} color="#10b981" />;
      case 'failure': return <XCircle size={14} color="#ef4444" />;
      case 'blocked': return <Shield size={14} color="#f59e0b" />;
      default: return <Clock size={14} color="#6b7280" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;
    
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#7c2d12'
    };

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        backgroundColor: colors[riskLevel as keyof typeof colors],
        color: 'white',
        borderRadius: '10px',
        fontSize: '9px',
        fontWeight: '500',
        textTransform: 'uppercase'
      }}>
        {riskLevel}
      </span>
    );
  };

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
              Audit Log Viewer
            </h3>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Real-time tenant activity monitoring and compliance tracking
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => window.location.reload()}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            
            <button
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: filteredLogs.length > 0 ? '#10b981' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: filteredLogs.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '12px'
              }}
            >
              <Download size={12} />
              Export ({filteredLogs.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(6, auto)', gap: '8px', alignItems: 'center' }}>
          {/* Search */}
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
              placeholder="Search activities..."
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

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="hour">Past Hour</option>
            <option value="day">Past Day</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="all">All Time</option>
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="security">Security</option>
          </select>

          {/* Outcome */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Module */}
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
            <option value="system">System</option>
            {tenantModules.map(module => (
              <option key={module.moduleCode} value={module.moduleCode}>
                {module.name}
              </option>
            ))}
          </select>

          {/* User */}
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="all">All Users</option>
            {tenantUsers.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>

          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            whiteSpace: 'nowrap'
          }}>
            {filteredLogs.length} entries
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '200px' 
          }}>
            <RefreshCw className="animate-spin" size={24} />
            <span style={{ marginLeft: '8px', color: '#6b7280' }}>Loading audit logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
              No audit logs found
            </h4>
            <p style={{ margin: 0, fontSize: '12px' }}>
              {searchTerm || severityFilter !== 'all' || outcomeFilter !== 'all' || moduleFilter !== 'all' || userFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'No activity recorded for the selected time period'
              }
            </p>
          </div>
        ) : (
          <div style={{ padding: '8px' }}>
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogs.has(log.id);
              const isSelected = selectedLog?.id === log.id;
              
              return (
                <div
                  key={log.id}
                  style={{
                    marginBottom: '4px',
                    backgroundColor: isSelected ? '#f0f9ff' : 'white',
                    border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Log Header */}
                  <div
                    onClick={() => handleLogClick(log)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLogExpansion(log.id);
                      }}
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
                      {getSeverityIcon(log.severity)}
                      {getOutcomeIcon(log.outcome)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '2px'
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          backgroundColor: '#f3f4f6',
                          padding: '2px 6px',
                          borderRadius: '10px'
                        }}>
                          {log.module}
                        </span>

                        {log.riskLevel && getRiskBadge(log.riskLevel)}
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {log.userName} • {log.resource} • {formatTimestamp(log.timestamp)}
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {log.ipAddress}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{
                      padding: '16px',
                      borderTop: '1px solid #f3f4f6',
                      backgroundColor: '#f9fafb'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Basic Details */}
                        <div>
                          <h5 style={{ fontSize: '12px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                            Event Details
                          </h5>
                          <div style={{ fontSize: '11px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</div>
                            <div><strong>User:</strong> {log.userName} ({log.userId})</div>
                            <div><strong>Session:</strong> {log.sessionId}</div>
                            <div><strong>IP Address:</strong> {log.ipAddress}</div>
                            <div><strong>User Agent:</strong> {log.userAgent.substring(0, 50)}...</div>
                          </div>
                        </div>

                        {/* State Changes */}
                        {(log.details.beforeState || log.details.afterState) && (
                          <div>
                            <h5 style={{ fontSize: '12px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                              State Changes
                            </h5>
                            
                            {log.details.beforeState && (
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>BEFORE:</div>
                                <pre style={{
                                  fontSize: '10px',
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  padding: '6px',
                                  borderRadius: '3px',
                                  margin: 0,
                                  whiteSpace: 'pre-wrap'
                                }}>
                                  {JSON.stringify(log.details.beforeState, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.details.afterState && (
                              <div>
                                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>AFTER:</div>
                                <pre style={{
                                  fontSize: '10px',
                                  backgroundColor: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  padding: '6px',
                                  borderRadius: '3px',
                                  margin: 0,
                                  whiteSpace: 'pre-wrap'
                                }}>
                                  {JSON.stringify(log.details.afterState, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      {log.details.metadata && Object.keys(log.details.metadata).length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <h5 style={{ fontSize: '12px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                            Additional Metadata
                          </h5>
                          <pre style={{
                            fontSize: '10px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '8px',
                            borderRadius: '4px',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace'
                          }}>
                            {JSON.stringify(log.details.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ 
                        marginTop: '12px', 
                        display: 'flex', 
                        gap: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Copy JSON
                        </button>
                        
                        {log.severity === 'security' && (
                          <button
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
                            Create Alert
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogViewer;
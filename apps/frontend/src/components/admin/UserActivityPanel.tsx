import React, { useState, useEffect, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Activity, Search, Filter, Calendar, Clock, User, Shield, 
  FileText, Settings, Eye, Download, RefreshCw, ChevronDown
} from 'lucide-react';

interface UserActivityPanelProps {
  user: any;
  isVisible: boolean;
  onClose?: () => void;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  action: string;
  resource: string;
  module: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure' | 'warning';
  metadata?: any;
}

const UserActivityPanel: React.FC<UserActivityPanelProps> = ({
  user,
  isVisible,
  onClose
}) => {
  const { getUserActivity, isLoading } = useTenantAdmin();
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week'); // week, month, quarter, all
  const [resultFilter, setResultFilter] = useState('all'); // all, success, failure, warning
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Mock activity data - in real app, this would come from API
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      action: 'login',
      resource: 'authentication',
      module: 'system',
      details: 'User logged in successfully',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'success'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      action: 'view',
      resource: 'customer_list',
      module: 'CRM',
      details: 'Viewed customer list page',
      ipAddress: '192.168.1.100',
      result: 'success'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      action: 'create',
      resource: 'customer',
      module: 'CRM',
      details: 'Created new customer: Acme Corp',
      ipAddress: '192.168.1.100',
      result: 'success',
      metadata: { customerId: 'cust_123', customerName: 'Acme Corp' }
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      action: 'update',
      resource: 'user_profile',
      module: 'system',
      details: 'Updated profile information',
      ipAddress: '192.168.1.100',
      result: 'success'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      action: 'delete',
      resource: 'document',
      module: 'Documents',
      details: 'Attempted to delete protected document',
      ipAddress: '192.168.1.100',
      result: 'failure',
      metadata: { documentId: 'doc_456', reason: 'Insufficient permissions' }
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      action: 'export',
      resource: 'financial_report',
      module: 'Finance',
      details: 'Exported Q3 financial report',
      ipAddress: '192.168.1.101',
      result: 'success',
      metadata: { reportType: 'Q3_financials', format: 'pdf' }
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      action: 'role_assignment',
      resource: 'user_roles',
      module: 'system',
      details: 'Role assignment changed by admin',
      ipAddress: 'system',
      result: 'warning',
      metadata: { changedBy: 'admin@company.com', newRoles: ['Finance Manager'] }
    }
  ];

  // Load activities when user changes or panel becomes visible
  useEffect(() => {
    if (isVisible && user) {
      loadActivities();
    }
  }, [isVisible, user]);

  // Filter activities when filters change
  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, actionFilter, moduleFilter, dateRange, resultFilter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // In real app: const data = await getUserActivity(user.id);
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load user activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.action.toLowerCase().includes(searchLower) ||
        activity.resource.toLowerCase().includes(searchLower) ||
        activity.module.toLowerCase().includes(searchLower) ||
        activity.details.toLowerCase().includes(searchLower)
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(activity => activity.action === actionFilter);
    }

    // Module filter
    if (moduleFilter !== 'all') {
      filtered = filtered.filter(activity => activity.module === moduleFilter);
    }

    // Result filter
    if (resultFilter !== 'all') {
      filtered = filtered.filter(activity => activity.result === resultFilter);
    }

    // Date range filter
    const now = new Date();
    if (dateRange !== 'all') {
      const cutoffDate = new Date();
      switch (dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(activity => 
        new Date(activity.timestamp) >= cutoffDate
      );
    }

    setFilteredActivities(filtered);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <User size={14} />;
      case 'view':
      case 'read':
        return <Eye size={14} />;
      case 'create':
      case 'add':
        return <FileText size={14} />;
      case 'update':
      case 'edit':
        return <Settings size={14} />;
      case 'delete':
      case 'remove':
        return <FileText size={14} />;
      case 'export':
      case 'download':
        return <Download size={14} />;
      case 'role_assignment':
        return <Shield size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success': return '#10b981';
      case 'failure': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getResultBadge = (result: string) => {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        backgroundColor: getResultColor(result),
        color: 'white',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: '500',
        textTransform: 'uppercase'
      }}>
        {result}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const uniqueActions = useMemo(() => {
    return [...new Set(activities.map(a => a.action))];
  }, [activities]);

  const uniqueModules = useMemo(() => {
    return [...new Set(activities.map(a => a.module))];
  }, [activities]);

  if (!isVisible || !user) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '400px',
      backgroundColor: 'white',
      borderLeft: '1px solid #e2e8f0',
      boxShadow: '-4px 0 6px -1px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 999
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            User Activity
          </h3>
          
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                borderRadius: '4px'
              }}
            >
              ×
            </button>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '8px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              {filteredActivities.length}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>
              Total
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '8px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
              {filteredActivities.filter(a => a.result === 'success').length}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>
              Success
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '8px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>
              {filteredActivities.filter(a => a.result === 'failure').length}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>
              Failed
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              backgroundColor: showFilters ? '#3b82f6' : '#f3f4f6',
              color: showFilters ? 'white' : '#374151',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Filter size={12} />
            Filters
          </button>
          
          <button
            onClick={loadActivities}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search 
              size={14} 
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

          {/* Filter dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                padding: '4px 6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{
                padding: '4px 6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="all">All Modules</option>
              {uniqueModules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '4px 6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
              <option value="all">All Time</option>
            </select>
            
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              style={{
                padding: '4px 6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="all">All Results</option>
              <option value="success">Success Only</option>
              <option value="failure">Failures Only</option>
              <option value="warning">Warnings Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: '#3b82f6' }} />
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading activities...</div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
              No activities found
            </h4>
            <p style={{ margin: 0, fontSize: '12px' }}>
              {searchTerm || actionFilter !== 'all' || moduleFilter !== 'all' || dateRange !== 'all' || resultFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No activity recorded for this user'
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
                style={{
                  padding: '12px',
                  backgroundColor: selectedActivity?.id === activity.id ? '#f0f9ff' : 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  borderColor: selectedActivity?.id === activity.id ? '#3b82f6' : '#e5e7eb'
                }}
              >
                {/* Activity Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <div style={{ color: getResultColor(activity.result) }}>
                    {getActionIcon(activity.action)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '2px'
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {activity.action}
                      </span>
                      
                      <span style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6',
                        padding: '1px 4px',
                        borderRadius: '2px'
                      }}>
                        {activity.module}
                      </span>
                      
                      {getResultBadge(activity.result)}
                    </div>
                    
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {activity.resource}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={10} />
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>

                {/* Activity Details */}
                <div style={{
                  fontSize: '12px',
                  color: '#374151',
                  marginBottom: selectedActivity?.id === activity.id ? '8px' : '0'
                }}>
                  {activity.details}
                </div>

                {/* Expanded Details */}
                {selectedActivity?.id === activity.id && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>IP Address: </span>
                      <span style={{ fontSize: '11px', color: '#374151', fontFamily: 'monospace' }}>
                        {activity.ipAddress}
                      </span>
                    </div>
                    
                    {activity.userAgent && (
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>User Agent: </span>
                        <span style={{ fontSize: '10px', color: '#374151' }}>
                          {activity.userAgent.substring(0, 50)}...
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>Timestamp: </span>
                      <span style={{ fontSize: '11px', color: '#374151' }}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    {activity.metadata && (
                      <div style={{ marginTop: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>Metadata: </span>
                        <pre style={{
                          fontSize: '10px',
                          color: '#374151',
                          backgroundColor: '#f9fafb',
                          padding: '4px',
                          borderRadius: '3px',
                          margin: '2px 0 0 0',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityPanel;
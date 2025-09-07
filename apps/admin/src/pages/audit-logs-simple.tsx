import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';

const AuditLogsSimple: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    user_email: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAuditLogs(filters);
      console.log('Audit logs response:', response);
      
      // Handle different response structures
      let auditLogs = [];
      if (response && typeof response === 'object') {
        auditLogs = response.data || response.logs || response || [];
      }
      
      console.log('Parsed audit logs:', auditLogs);
      setLogs(Array.isArray(auditLogs) ? auditLogs : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityAlerts = async () => {
    try {
      const response = await adminApi.getSecurityAlerts(10);
      console.log('Security alerts response:', response);
      
      let alerts = [];
      if (response && typeof response === 'object') {
        alerts = response.data?.alerts || response.alerts || response.data || response || [];
      }
      
      setSecurityAlerts(Array.isArray(alerts) ? alerts : []);
    } catch (err) {
      console.error('Failed to fetch security alerts:', err);
    }
  };

  useEffect(() => {
    console.log('AuditLogsSimple: Component mounted, fetching data...');
    fetchAuditLogs();
    fetchSecurityAlerts();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchAuditLogs();
  };

  const handleRefresh = () => {
    fetchAuditLogs();
    fetchSecurityAlerts();
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading audit logs...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Audit Logs (Simple)</h1>
        <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '16px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            margin: '0 0 8px 0',
            color: '#1f2937'
          }}>
            Global Audit Logs Viewer
          </h1>
          <p style={{ 
            color: '#6b7280',
            margin: 0,
            fontSize: '14px'
          }}>
            Monitor system activities, security events, and user actions across all tenants
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: showFilters ? '#3b82f6' : '#f3f4f6',
              color: showFilters ? 'white' : '#374151',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button
            onClick={handleRefresh}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Content */}
        <div>
          {/* Filters Section */}
          {showFilters && (
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#374151'
              }}>
                Filters & Search
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <input
                  type="text"
                  placeholder="Search actions, users, resources..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                
                <select
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Filter by action..."
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                
                <input
                  type="text"
                  placeholder="Filter by user email..."
                  value={filters.user_email}
                  onChange={(e) => handleFilterChange('user_email', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSearch}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Apply Filters
                </button>
                
                <button
                  onClick={() => {
                    setFilters({ action: '', severity: '', user_email: '', search: '' });
                    setTimeout(handleSearch, 100);
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Showing {logs.length} audit log{logs.length !== 1 ? 's' : ''}
              {(filters.action || filters.severity || filters.user_email || filters.search) && 
                ' (filtered)'}
            </p>
          </div>

          {/* Audit Logs Table */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            {logs.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#6b7280' 
              }}>
                {loading ? 'Loading audit logs...' : 'No audit logs found.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead style={{ 
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Time
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        User / Email
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Action
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Resource
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Severity
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr 
                        key={log.id || index}
                        style={{
                          borderBottom: index < logs.length - 1 ? '1px solid #f3f4f6' : 'none',
                          backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '13px' }}>
                            {new Date(log.performed_at).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {new Date(log.performed_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '500' }}>
                            {log.user_email || 'System'}
                          </div>
                          {log.user_role && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {log.user_role}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '500' }}>
                            {log.action?.replace(/_/g, ' ')}
                          </div>
                          {log.module_code && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {log.module_code}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div>
                            {log.resource_name || log.resource_type || '-'}
                          </div>
                          {log.resource_id && (
                            <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                              {log.resource_id.substring(0, 12)}...
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: log.status === 'success' ? '#dcfce7' : 
                                           log.status === 'failed' ? '#fee2e2' : '#fef3c7',
                            color: log.status === 'success' ? '#166534' : 
                                   log.status === 'failed' ? '#dc2626' : '#92400e'
                          }}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: log.severity === 'critical' ? '#fee2e2' :
                                           log.severity === 'error' ? '#fed7aa' :
                                           log.severity === 'warning' ? '#fef3c7' : '#dcfce7',
                            color: log.severity === 'critical' ? '#dc2626' :
                                   log.severity === 'error' ? '#ea580c' :
                                   log.severity === 'warning' ? '#d97706' : '#16a34a'
                          }}>
                            {log.severity}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Security Alerts */}
        <div>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              backgroundColor: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              padding: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#dc2626',
                margin: 0,
                display: 'flex',
                alignItems: 'center'
              }}>
                🚨 Security Alerts ({securityAlerts.length})
              </h3>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {securityAlerts.length === 0 ? (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  No security alerts found.
                </div>
              ) : (
                securityAlerts.slice(0, 10).map((alert, index) => (
                  <div 
                    key={alert.id || index}
                    style={{
                      padding: '12px 16px',
                      borderBottom: index < securityAlerts.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '4px' }}>
                      {alert.action?.replace(/_/g, ' ') || 'Security Event'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      {alert.user_email || 'Unknown User'} • {new Date(alert.performed_at).toLocaleString()}
                    </div>
                    {alert.error_message && (
                      <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '4px' }}>
                        {alert.error_message}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '500',
                        backgroundColor: alert.severity === 'critical' ? '#fee2e2' :
                                       alert.severity === 'error' ? '#fed7aa' : '#fef3c7',
                        color: alert.severity === 'critical' ? '#dc2626' :
                               alert.severity === 'error' ? '#ea580c' : '#d97706'
                      }}>
                        {alert.severity}
                      </span>
                      {alert.ip_address && (
                        <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace' }}>
                          {alert.ip_address}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginTop: '16px',
            padding: '16px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: '#374151'
            }}>
              System Status
            </h4>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#10b981', 
                borderRadius: '50%',
                marginRight: '8px'
              }}></div>
              <span style={{ fontSize: '13px', color: '#374151' }}>Monitoring Active</span>
            </div>
            
            <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
              <div>Last Update: {new Date().toLocaleTimeString()}</div>
              <div>Auto-refresh: 30s interval</div>
              <div>Data Retention: 90 days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsSimple;
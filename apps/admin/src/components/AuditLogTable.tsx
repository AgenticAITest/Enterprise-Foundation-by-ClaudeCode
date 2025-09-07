import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Eye,
  Activity
} from 'lucide-react';

interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  session_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  http_method?: string;
  endpoint?: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: any;
  new_values?: any;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  module_code?: string;
  permission_required?: string;
  data_scope?: any;
  performed_at: string;
  details?: any;
}

interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  onPageChange: (page: number) => void;
  onSortChange: (column: string, direction: 'asc' | 'desc') => void;
  onRefresh: () => void;
  onExport: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  loading,
  pagination,
  onPageChange,
  onSortChange,
  onRefresh,
  onExport,
  sortBy,
  sortOrder
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      onRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const toggleRowExpansion = (logId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': 
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <User className="h-4 w-4" />;
    if (action.includes('permission') || action.includes('role')) return <Shield className="h-4 w-4" />;
    if (action.includes('view') || action.includes('read')) return <Eye className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const handleSort = (column: string) => {
    const newDirection = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(column, newDirection);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const SortableHeader: React.FC<{ column: string; children: React.ReactNode }> = ({ column, children }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === column && (
          <span className="text-blue-600">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  const renderExpandedContent = (log: AuditLog) => (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        {/* Technical Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
          <div className="space-y-1 text-gray-600">
            {log.session_id && <div><strong>Session:</strong> {log.session_id}</div>}
            {log.ip_address && <div><strong>IP Address:</strong> {log.ip_address}</div>}
            {log.http_method && log.endpoint && (
              <div><strong>Request:</strong> {log.http_method} {log.endpoint}</div>
            )}
            {log.user_agent && (
              <div><strong>User Agent:</strong> <span className="break-all">{log.user_agent}</span></div>
            )}
          </div>
        </div>

        {/* Resource Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Resource Details</h4>
          <div className="space-y-1 text-gray-600">
            {log.resource_type && <div><strong>Type:</strong> {log.resource_type}</div>}
            {log.resource_id && <div><strong>ID:</strong> {log.resource_id}</div>}
            {log.resource_name && <div><strong>Name:</strong> {log.resource_name}</div>}
            {log.module_code && <div><strong>Module:</strong> {log.module_code}</div>}
            {log.permission_required && <div><strong>Permission:</strong> {log.permission_required}</div>}
          </div>
        </div>

        {/* Changes */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Changes</h4>
          <div className="space-y-2">
            {log.old_values && (
              <div>
                <strong className="text-red-600">Before:</strong>
                <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto max-h-20">
                  {JSON.stringify(log.old_values, null, 2)}
                </pre>
              </div>
            )}
            {log.new_values && (
              <div>
                <strong className="text-green-600">After:</strong>
                <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto max-h-20">
                  {JSON.stringify(log.new_values, null, 2)}
                </pre>
              </div>
            )}
            {log.error_message && (
              <div>
                <strong className="text-red-600">Error:</strong>
                <div className="text-red-600 text-xs mt-1">{log.error_message}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.total_pages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {((pagination.page - 1) * pagination.limit) + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of{' '}
            <span className="font-medium">{pagination.total}</span> results
          </p>
        </div>
        
        <div className="flex space-x-2">
          {[...Array(Math.min(pagination.total_pages, 7))].map((_, idx) => {
            let pageNum;
            if (pagination.total_pages <= 7) {
              pageNum = idx + 1;
            } else if (pagination.page <= 4) {
              pageNum = idx + 1;
            } else if (pagination.page >= pagination.total_pages - 3) {
              pageNum = pagination.total_pages - 6 + idx;
            } else {
              pageNum = pagination.page - 3 + idx;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  pageNum === pagination.page
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
              <Badge variant="outline">
                {pagination.total.toLocaleString()} total events
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-refresh</span>
              </label>
              
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={onExport}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                </th>
                <SortableHeader column="performed_at">Time</SortableHeader>
                <SortableHeader column="severity">Severity</SortableHeader>
                <SortableHeader column="action">Action</SortableHeader>
                <SortableHeader column="user_email">User</SortableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      Loading audit logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRowExpansion(log.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedRows.has(log.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.performed_at)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(log.severity)}
                          <Badge 
                            variant={
                              log.severity === 'critical' || log.severity === 'error' ? 'destructive' :
                              log.severity === 'warning' ? 'warning' : 'secondary'
                            }
                          >
                            {log.severity}
                          </Badge>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          <span>{log.action}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <div className="text-gray-900">{log.user_email || 'System'}</div>
                          {log.user_role && (
                            <div className="text-gray-500">{log.user_role}</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{log.resource_type || '-'}</div>
                          {log.resource_name && (
                            <div className="text-gray-500 text-xs truncate max-w-32" title={log.resource_name}>
                              {log.resource_name}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(log.status)}
                          <span className={`text-sm ${
                            log.status === 'failed' ? 'text-red-600' :
                            log.status === 'success' ? 'text-green-600' :
                            'text-yellow-600'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.module_code || '-'}
                      </td>
                    </tr>
                    
                    {expandedRows.has(log.id) && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          {renderExpandedContent(log)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && renderPagination()}
      </CardContent>
    </Card>
  );
};

export default AuditLogTable;
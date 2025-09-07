import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Shield,
  Download,
  Activity,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
  Filter,
  Search,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import AuditLogTable from '@/components/AuditLogTable';
import LogFilters from '@/components/LogFilters';
import SecurityAlerts from '@/components/SecurityAlerts';
import { adminApi } from '@/lib/admin-api';

interface AuditLogsPageState {
  logs: any[];
  securityAlerts: any[];
  stats: any;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  filters: {
    tenant_id?: string;
    user_id?: string;
    action?: string;
    resource_type?: string;
    module_code?: string;
    severity?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  showFilters: boolean;
  selectedAlert: any | null;
}

const AuditLogsPage: React.FC = () => {
  const [state, setState] = useState<AuditLogsPageState>({
    logs: [],
    securityAlerts: [],
    stats: null,
    loading: true,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 50,
      total_pages: 0
    },
    filters: {},
    sortBy: 'performed_at',
    sortOrder: 'desc',
    showFilters: false,
    selectedAlert: null
  });

  // Load initial data
  useEffect(() => {
    loadData();
    loadStats();
    loadSecurityAlerts();
  }, []);

  // Reload logs when filters/pagination changes
  useEffect(() => {
    loadData();
  }, [state.filters, state.pagination.page, state.sortBy, state.sortOrder]);

  const loadData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await adminApi.getAuditLogs({
        ...state.filters,
        page: state.pagination.page,
        limit: state.pagination.limit,
        sort_by: state.sortBy,
        sort_order: state.sortOrder
      });

      setState(prev => ({
        ...prev,
        logs: response.data.logs,
        pagination: response.data.pagination,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load audit logs',
        loading: false
      }));
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminApi.getAuditLogStats();
      setState(prev => ({ ...prev, stats: response.data }));
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      const response = await adminApi.getSecurityAlerts(20);
      setState(prev => ({ ...prev, securityAlerts: response.data.alerts }));
    } catch (error) {
      console.error('Failed to load security alerts:', error);
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setState(prev => ({
      ...prev,
      filters: newFilters,
      pagination: { ...prev.pagination, page: 1 } // Reset to first page
    }));
  };

  const handleClearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {},
      pagination: { ...prev.pagination, page: 1 }
    }));
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }));
  };

  const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
    setState(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: direction,
      pagination: { ...prev.pagination, page: 1 }
    }));
  };

  const handleRefresh = () => {
    loadData();
    loadSecurityAlerts();
  };

  const handleExport = async () => {
    try {
      const response = await adminApi.exportAuditLogs({
        ...state.filters,
        format: 'csv'
      });
      
      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const toggleFilters = () => {
    setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const renderStatsCards = () => {
    if (!state.stats) return null;

    const { overview } = state.stats;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(parseInt(overview.total_events || 0))}
                </p>
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">
                    {formatNumber(parseInt(overview.events_last_24h || 0))} today
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Events</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatNumber(parseInt(overview.failed_events || 0))}
                </p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
                  <span className="text-sm text-red-600">
                    {((parseInt(overview.failed_events || 0) / parseInt(overview.total_events || 1)) * 100).toFixed(1)}% failure rate
                  </span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatNumber(parseInt(overview.unique_users || 0))}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600">
                    {formatNumber(parseInt(overview.events_last_7d || 0))} this week
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Events</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatNumber(parseInt(overview.critical_events || 0))}
                </p>
                <div className="flex items-center mt-2">
                  <Shield className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-sm text-orange-600">
                    Requires attention
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderActionBreakdown = () => {
    if (!state.stats?.action_breakdown) return null;

    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Actions</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {state.stats.action_breakdown.slice(0, 5).map((item: any, index: number) => (
              <div key={item.action} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </div>
                    {item.failed_count > 0 && (
                      <div className="text-sm text-red-600">
                        {item.failed_count} failed
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{item.count}</div>
                  <div className="text-sm text-gray-500">events</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Monitor system activities, security events, and user actions across all tenants
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Live Monitoring
          </Badge>
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{state.error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {renderStatsCards()}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Audit Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Breakdown */}
          {renderActionBreakdown()}

          {/* Filters */}
          <LogFilters
            filters={state.filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            isVisible={state.showFilters}
            onToggle={toggleFilters}
          />

          {/* Main Table */}
          <AuditLogTable
            logs={state.logs}
            loading={state.loading}
            pagination={state.pagination}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            onRefresh={handleRefresh}
            onExport={handleExport}
            sortBy={state.sortBy}
            sortOrder={state.sortOrder}
          />
        </div>

        {/* Sidebar - Security Alerts */}
        <div className="space-y-6">
          <SecurityAlerts
            alerts={state.securityAlerts}
            loading={false}
            onRefresh={loadSecurityAlerts}
            onViewDetails={(alert) => setState(prev => ({ ...prev, selectedAlert: alert }))}
          />

          {/* Quick Stats Card */}
          {state.stats?.severity_breakdown && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Severity Distribution</h3>
                <div className="space-y-3">
                  {state.stats.severity_breakdown.map((item: any) => (
                    <div key={item.severity} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.severity === 'critical' ? 'bg-red-600' :
                          item.severity === 'error' ? 'bg-red-500' :
                          item.severity === 'warning' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}></div>
                        <span className="text-sm font-medium capitalize">{item.severity}</span>
                      </div>
                      <span className="text-sm text-gray-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monitoring</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Update</span>
                  <span className="text-gray-900">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Data Retention</span>
                  <span className="text-gray-900">90 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Auto-refresh</span>
                  <span className="text-blue-600">30s interval</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alert Details Modal */}
      {state.selectedAlert && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setState(prev => ({ ...prev, selectedAlert: null }))}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Details</h3>
              <pre className="text-sm bg-gray-100 p-4 rounded-md overflow-auto">
                {JSON.stringify(state.selectedAlert, null, 2)}
              </pre>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setState(prev => ({ ...prev, selectedAlert: null }))}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
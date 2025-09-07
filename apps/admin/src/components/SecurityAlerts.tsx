import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  Shield,
  Lock,
  XCircle,
  Eye,
  Clock,
  User,
  MapPin,
  RefreshCw,
  Bell,
  BellOff,
  ExternalLink,
  Filter,
  AlertCircle,
  Skull
} from 'lucide-react';

interface SecurityAlert {
  id: string;
  tenant_id?: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource_type?: string;
  resource_name?: string;
  ip_address?: string;
  status: string;
  error_message?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  performed_at: string;
  details?: any;
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
  loading: boolean;
  onRefresh: () => void;
  onViewDetails: (alert: SecurityAlert) => void;
}

const SecurityAlerts: React.FC<SecurityAlertsProps> = ({
  alerts,
  loading,
  onRefresh,
  onViewDetails
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'error' | 'warning'>('all');
  const [notifications, setNotifications] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    setLastRefresh(new Date());
  }, [alerts]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <Skull className="h-5 w-5 text-red-700" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login_failed')) return <Lock className="h-4 w-4 text-red-500" />;
    if (action.includes('unauthorized') || action.includes('permission_denied')) return <Shield className="h-4 w-4 text-orange-500" />;
    if (action.includes('suspicious')) return <Eye className="h-4 w-4 text-purple-500" />;
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'error': return 'bg-red-50 border-red-400 text-red-700';
      case 'warning': return 'bg-yellow-50 border-yellow-400 text-yellow-700';
      default: return 'bg-blue-50 border-blue-400 text-blue-700';
    }
  };

  const getActionDescription = (action: string) => {
    const descriptions: { [key: string]: string } = {
      'login_failed': 'Failed login attempt',
      'permission_denied': 'Permission denied',
      'unauthorized_access': 'Unauthorized access attempt',
      'suspicious_activity': 'Suspicious activity detected',
      'account_locked': 'Account locked due to multiple failed attempts',
      'security_violation': 'Security policy violation',
      'data_breach_attempt': 'Potential data breach attempt',
      'privilege_escalation': 'Privilege escalation attempt'
    };
    return descriptions[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const errorCount = alerts.filter(a => a.severity === 'error').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  const renderAlertItem = (alert: SecurityAlert) => (
    <div
      key={alert.id}
      className={`p-4 border-l-4 ${getSeverityColor(alert.severity)} hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onViewDetails(alert)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getSeverityIcon(alert.severity)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {getActionIcon(alert.action)}
              <h4 className="text-sm font-semibold text-gray-900">
                {getActionDescription(alert.action)}
              </h4>
              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                {alert.severity}
              </Badge>
            </div>
            
            <div className="mt-1 text-sm text-gray-600">
              {alert.user_email && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{alert.user_email}</span>
                </div>
              )}
              {alert.ip_address && (
                <div className="flex items-center space-x-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>IP: {alert.ip_address}</span>
                </div>
              )}
              {alert.error_message && (
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {alert.error_message}
                </div>
              )}
            </div>
            
            {alert.resource_name && (
              <div className="mt-2 text-xs text-gray-500">
                Target: {alert.resource_type} - {alert.resource_name}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{formatTimeAgo(alert.performed_at)}</span>
          </div>
          <button className="mt-1 text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <ExternalLink className="h-3 w-3" />
            <span>Details</span>
          </button>
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
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
                <p className="text-sm text-gray-500">
                  Critical security events and suspicious activities
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setNotifications(!notifications)}
                className={`p-2 rounded-md ${notifications ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                title={notifications ? 'Disable notifications' : 'Enable notifications'}
              >
                {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>
              
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
              <div className="text-xs text-gray-500">Total Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{errorCount}</div>
              <div className="text-xs text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
              <div className="text-xs text-gray-500">Warnings</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All', count: alerts.length },
              { key: 'critical', label: 'Critical', count: criticalCount },
              { key: 'error', label: 'Errors', count: errorCount },
              { key: 'warning', label: 'Warnings', count: warningCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Last Refresh Info */}
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
          <div className="text-xs text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()} 
            {notifications && alerts.length > 0 && (
              <span className="ml-2 text-blue-600">● Live monitoring active</span>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading security alerts...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No security alerts' : `No ${filter} alerts`}
              </h4>
              <p className="text-sm">
                {filter === 'all' 
                  ? 'Great! No security issues detected recently.' 
                  : `No ${filter} level security events found.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAlerts.map(renderAlertItem)}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredAlerts.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredAlerts.length} of {alerts.length} alerts
              </div>
              <button
                onClick={() => {/* Navigate to full audit logs page */}}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all in audit logs →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityAlerts;
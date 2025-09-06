import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/tenant-provider';

interface IntegrationStats {
  totalIntegrations: number;
  activeIntegrations: number;
  apiCallsToday: number;
  webhookDeliveries: number;
  errorRate: number;
}

interface RecentActivity {
  id: string;
  type: 'api_call' | 'webhook' | 'error';
  integration: string;
  message: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

const IntegrationDashboard: React.FC = () => {
  const { token } = useAuth();
  const { tenant } = useTenant();
  const [stats, setStats] = useState<IntegrationStats>({
    totalIntegrations: 0,
    activeIntegrations: 0,
    apiCallsToday: 0,
    webhookDeliveries: 0,
    errorRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - in production would fetch from API
      setStats({
        totalIntegrations: 12,
        activeIntegrations: 10,
        apiCallsToday: 1847,
        webhookDeliveries: 234,
        errorRate: 2.3
      });

      setRecentActivity([
        {
          id: '1',
          type: 'api_call',
          integration: 'Customer API',
          message: 'Customer data updated successfully',
          timestamp: new Date(Date.now() - 300000),
          status: 'success'
        },
        {
          id: '2',
          type: 'webhook',
          integration: 'Order Webhook',
          message: 'Order confirmation sent to external system',
          timestamp: new Date(Date.now() - 600000),
          status: 'success'
        },
        {
          id: '3',
          type: 'error',
          integration: 'Payment Gateway',
          message: 'Connection timeout after 30 seconds',
          timestamp: new Date(Date.now() - 900000),
          status: 'error'
        },
        {
          id: '4',
          type: 'api_call',
          integration: 'Inventory API',
          message: 'Stock levels synchronized',
          timestamp: new Date(Date.now() - 1200000),
          status: 'success'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'api_call':
        return '🔗';
      case 'webhook':
        return '⚡';
      case 'error':
        return '⚠️';
      default:
        return '📊';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integration Hub</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your APIs, webhooks, and external integrations
          </p>
        </div>
        <div className="flex space-x-3">
          <Button asChild>
            <Link to="/integrations/create">New Integration</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/integrations/list">View All</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">🔧</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIntegrations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeIntegrations} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apiCallsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhook Deliveries</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">⚡</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.webhookDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              98.7% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">⚠️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errorRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.errorRate < 5 ? '✅ Good' : '⚠️ Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Button asChild variant="outline" className="h-20">
              <Link to="/integrations/create?type=inbound_api" className="flex flex-col items-center justify-center space-y-2">
                <span className="text-2xl">📥</span>
                <span>Create Inbound API</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20">
              <Link to="/integrations/create?type=outbound_api" className="flex flex-col items-center justify-center space-y-2">
                <span className="text-2xl">📤</span>
                <span>Create Outbound API</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20">
              <Link to="/integrations/create?type=webhook" className="flex flex-col items-center justify-center space-y-2">
                <span className="text-2xl">🪝</span>
                <span>Create Webhook</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/integrations/logs">View All Logs</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg border">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.integration}
                    </p>
                    <Badge variant="outline" className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {activity.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Integration Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Customer API</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Gateway</span>
                <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inventory Webhook</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Order Notifications</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Usage Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>• Peak usage: 2:00 PM - 4:00 PM</p>
              <p>• Most active endpoint: /api/customers</p>
              <p>• Average response time: 145ms</p>
              <p>• Fastest integration: Customer API (89ms)</p>
              <p>• Slowest integration: Inventory Sync (340ms)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntegrationDashboard;
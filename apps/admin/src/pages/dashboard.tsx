import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge
} from '@erp/ui';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Activity,
  TrendingUp,
  Server,
  Database,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { adminApi, type TenantStats } from '@/lib/admin-api';

const DashboardPage: React.FC = () => {
  const [tenantStats, setTenantStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration (fallback)
  const fallbackStats = {
    totalTenants: 156,
    activeTenants: 142,
    totalUsers: 3247,
    monthlyRevenue: 89420,
    systemUptime: '99.9%',
    avgResponseTime: '245ms'
  };

  const recentTenants = [
    {
      id: '1',
      companyName: 'Acme Corporation',
      subdomain: 'acme',
      status: 'active',
      users: 25,
      createdAt: '2024-01-15'
    },
    {
      id: '2', 
      companyName: 'TechStart Inc',
      subdomain: 'techstart',
      status: 'active',
      users: 12,
      createdAt: '2024-01-14'
    },
    {
      id: '3',
      companyName: 'Global Solutions',
      subdomain: 'globalsol',
      status: 'suspended',
      users: 45,
      createdAt: '2024-01-13'
    }
  ];

  const systemHealth = [
    { service: 'API Gateway', status: 'healthy', uptime: '99.9%' },
    { service: 'Database', status: 'healthy', uptime: '99.8%' },
    { service: 'Redis Cache', status: 'healthy', uptime: '100%' },
    { service: 'File Storage', status: 'warning', uptime: '98.5%' },
  ];

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const stats = await adminApi.getTenantStats();
        setTenantStats(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Dashboard data loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate derived stats from API data
  const systemStats = tenantStats ? {
    totalTenants: parseInt(tenantStats.tenant_overview.total_tenants),
    activeTenants: parseInt(tenantStats.tenant_overview.active_tenants),
    totalUsers: parseInt(tenantStats.user_overview.total_users),
    monthlyRevenue: 89420, // TODO: Add to revenue API
    systemUptime: '99.9%', // TODO: Add to system health API
    avgResponseTime: '32ms' // From our testing
  } : fallbackStats;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      suspended: 'destructive',
      inactive: 'secondary',
      healthy: 'default',
      warning: 'destructive',
      error: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your multi-tenant SaaS platform
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your multi-tenant SaaS platform
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error} - Showing fallback data.
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {tenantStats ? 
                  `+${tenantStats.tenant_overview.new_tenants_30d} last 30 days` : 
                  '+12 from last month'
                }
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {tenantStats ? 
                  `+${tenantStats.user_overview.new_users_30d} last 30 days` : 
                  '+201 from last week'
                }
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${systemStats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2% from last month
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.systemUptime}</div>
            <p className="text-xs text-muted-foreground">
              Avg response: {systemStats.avgResponseTime}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
            <CardDescription>
              Latest tenant registrations and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.companyName}</div>
                        <div className="text-sm text-muted-foreground">{tenant.subdomain}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>{tenant.users}</TableCell>
                    <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current status of core system services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealth.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {service.status === 'healthy' ? (
                      <Server className="h-5 w-5 text-green-600" />
                    ) : (
                      <Database className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium">{service.service}</p>
                      <p className="text-sm text-muted-foreground">Uptime: {service.uptime}</p>
                    </div>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <Building2 className="h-6 w-6 text-indigo-600 mb-2" />
              <h3 className="font-medium">Add New Tenant</h3>
              <p className="text-sm text-muted-foreground">Create a new tenant organization</p>
            </button>
            
            <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-6 w-6 text-indigo-600 mb-2" />
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm text-muted-foreground">View and manage user accounts</p>
            </button>
            
            <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <Activity className="h-6 w-6 text-indigo-600 mb-2" />
              <h3 className="font-medium">System Monitoring</h3>
              <p className="text-sm text-muted-foreground">Check system performance metrics</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
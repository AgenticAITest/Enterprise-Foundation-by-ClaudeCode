import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { 
  X, 
  Building2, 
  Users, 
  Package, 
  Calendar,
  DollarSign,
  Globe,
  Database,
  Activity,
  AlertTriangle,
  Check,
  Clock,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  Loader2
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface Tenant {
  id: string;
  subdomain: string;
  companyName: string;
  planId?: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  moduleCount: number;
  status: 'active' | 'suspended' | 'trial' | 'inactive';
  trialEndsAt?: string;
  lastActivity?: string;
  revenue?: number;
  maxUsers?: number;
  maxStorageGb?: number;
  maxApiCallsPerDay?: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

interface TenantDetailsProps {
  tenant: Tenant;
  onClose: () => void;
  onUpdate?: (updatedTenant: Tenant) => void;
}

const TenantDetails: React.FC<TenantDetailsProps> = ({ 
  tenant, 
  onClose, 
  onUpdate 
}) => {
  const [tenantDetails, setTenantDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'none' | 'limits' | 'trial'>('none');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Form states for editing
  const [limits, setLimits] = useState({
    maxUsers: tenant.maxUsers || 0,
    maxStorageGb: tenant.maxStorageGb || 0,
    maxApiCallsPerDay: tenant.maxApiCallsPerDay || 0
  });
  
  const [trial, setTrial] = useState({
    trialEndsAt: tenant.trialEndsAt || '',
    trialModules: [] as string[]
  });

  useEffect(() => {
    const loadTenantDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // For now, just use the tenant data passed in and mock the rest
        setTenantDetails(tenant);
        
        // Mock recent activity - in real app would come from audit logs
        setRecentActivity([
          {
            id: '1',
            type: 'user_login',
            message: 'User logged in successfully',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user: 'john.doe@example.com'
          },
          {
            id: '2',
            type: 'module_activation',
            message: 'WMS module activated',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            user: 'admin@tenant.com'
          },
          {
            id: '3',
            type: 'user_creation',
            message: 'New user account created',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            user: 'admin@tenant.com'
          }
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tenant details');
        console.error('Tenant details loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTenantDetails();
  }, [tenant.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRevenue = (amount?: number) => {
    if (!amount) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-600',
      trial: 'text-blue-600',
      suspended: 'text-red-600',
      inactive: 'text-gray-600'
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      active: Check,
      trial: Clock,
      suspended: AlertTriangle,
      inactive: X
    };
    const Icon = icons[status as keyof typeof icons] || icons.inactive;
    return <Icon className="h-4 w-4" />;
  };

  const handleSaveLimits = async () => {
    setSaving(true);
    setError(null);

    try {
      await adminApi.updateTenantLimits(
        tenant.id,
        limits.maxUsers,
        limits.maxStorageGb,
        limits.maxApiCallsPerDay
      );
      setEditMode('none');
      onUpdate?.({ ...tenant, ...limits });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update limits');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrial = async () => {
    setSaving(true);
    setError(null);

    try {
      await adminApi.updateTenantTrial(tenant.id, trial.trialEndsAt, trial.trialModules);
      setEditMode('none');
      onUpdate?.({ ...tenant, trialEndsAt: trial.trialEndsAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trial');
    } finally {
      setSaving(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      user_login: Users,
      module_activation: Package,
      user_creation: Users,
      system_update: Database
    };
    const Icon = icons[type as keyof typeof icons] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading tenant details...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{tenant.companyName}</h2>
              <p className="text-gray-500">{tenant.subdomain}.yourdomain.com</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 ${getStatusColor(tenant.status)}`}>
              {getStatusIcon(tenant.status)}
              <span className="font-medium capitalize">{tenant.status}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{tenant.userCount}</p>
                    <p className="text-sm text-gray-500">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{tenant.moduleCount}</p>
                    <p className="text-sm text-gray-500">Active Modules</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{formatRevenue(tenant.revenue)}</p>
                    <p className="text-sm text-gray-500">Monthly Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{recentActivity.length}</p>
                    <p className="text-sm text-gray-500">Recent Activities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Globe className="h-4 w-4" />
                      Subdomain
                    </div>
                    <span className="font-medium">{tenant.subdomain}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      Created
                    </div>
                    <span className="font-medium">{formatDate(tenant.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      Last Updated
                    </div>
                    <span className="font-medium">{formatDate(tenant.updatedAt)}</span>
                  </div>

                  {tenant.trialEndsAt && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="h-4 w-4" />
                        Trial Ends
                      </div>
                      <span className="font-medium">{formatDate(tenant.trialEndsAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subscription Limits */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Subscription Limits</CardTitle>
                  {editMode !== 'limits' ? (
                    <button 
                      onClick={() => setEditMode('limits')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditMode('none')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={handleSaveLimits}
                        disabled={saving}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode === 'limits' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                      <input
                        type="number"
                        value={limits.maxUsers}
                        onChange={(e) => setLimits({...limits, maxUsers: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Storage (GB)</label>
                      <input
                        type="number"
                        value={limits.maxStorageGb}
                        onChange={(e) => setLimits({...limits, maxStorageGb: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max API Calls/Day</label>
                      <input
                        type="number"
                        value={limits.maxApiCallsPerDay}
                        onChange={(e) => setLimits({...limits, maxApiCallsPerDay: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Users</span>
                      <span className="font-medium">{tenant.maxUsers || 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Storage</span>
                      <span className="font-medium">{tenant.maxStorageGb ? `${tenant.maxStorageGb} GB` : 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">API Calls/Day</span>
                      <span className="font-medium">{tenant.maxApiCallsPerDay?.toLocaleString() || 'Unlimited'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {activity.user} • {formatDate(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Manage Modules
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantDetails;
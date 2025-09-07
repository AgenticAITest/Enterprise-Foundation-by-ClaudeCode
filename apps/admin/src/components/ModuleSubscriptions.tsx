import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { 
  X,
  Package,
  DollarSign,
  Calendar,
  Power,
  Check,
  AlertTriangle,
  Loader2,
  Settings,
  TrendingUp,
  Users,
  Clock,
  Save
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface Module {
  module_id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  base_price: string;
  price_per_user: string;
  color: string;
  status: 'active' | 'inactive';
  activated_at?: string;
  expires_at?: string;
  settings?: any;
}

interface Tenant {
  id: string;
  companyName: string;
  subdomain: string;
  userCount: number;
}

interface ModuleSubscriptionsProps {
  tenant: Tenant;
  onClose: () => void;
  onUpdate?: () => void;
}

const ModuleSubscriptions: React.FC<ModuleSubscriptionsProps> = ({ 
  tenant, 
  onClose, 
  onUpdate 
}) => {
  const [tenantModules, setTenantModules] = useState<Module[]>([]);
  const [allModules, setAllModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [tenantModulesData, allModulesData] = await Promise.all([
          adminApi.getTenantModules(tenant.id),
          adminApi.getModules()
        ]);

        setTenantModules(tenantModulesData);
        
        // Get all modules and mark which ones are active for this tenant
        const tenantModuleIds = new Set(tenantModulesData.map(tm => tm.module_id));
        const enrichedModules = allModulesData.data.modules.map((module: any) => ({
          ...module,
          isSubscribed: tenantModuleIds.has(module.id),
          tenantStatus: tenantModulesData.find(tm => tm.module_id === module.id)?.status || 'inactive'
        }));
        
        setAllModules(enrichedModules);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load module data');
        console.error('Module subscription loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenant.id]);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num === 0 ? 'Free' : `$${num.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateMonthlyRevenue = (module: any) => {
    const basePrice = parseFloat(module.base_price);
    const pricePerUser = parseFloat(module.price_per_user);
    return basePrice + (pricePerUser * tenant.userCount);
  };

  const getTotalMonthlyRevenue = () => {
    return allModules
      .filter(m => m.isSubscribed && m.tenantStatus === 'active')
      .reduce((sum, module) => sum + calculateMonthlyRevenue(module), 0);
  };

  const handleToggleSubscription = async (moduleId: string, currentStatus: string) => {
    setSaving(moduleId);
    setError(null);
    setSuccess(null);

    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      if (newStatus === 'active') {
        // Set trial expiry to 30 days from now for new activations
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        await adminApi.updateTenantModuleSubscription(
          tenant.id, 
          moduleId, 
          newStatus, 
          {}, 
          expiresAt.toISOString()
        );
      } else {
        await adminApi.updateTenantModuleSubscription(tenant.id, moduleId, newStatus);
      }

      // Update local state
      setAllModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, isSubscribed: newStatus === 'active', tenantStatus: newStatus }
          : module
      ));

      const moduleName = allModules.find(m => m.id === moduleId)?.name;
      setSuccess(`${moduleName} ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
      
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update module subscription');
    } finally {
      setSaving(null);
    }
  };

  const filteredModules = allModules.filter(module => {
    if (filter === 'active') return module.isSubscribed && module.tenantStatus === 'active';
    if (filter === 'inactive') return !module.isSubscribed || module.tenantStatus !== 'active';
    return true;
  });

  const getStatusBadge = (module: any) => {
    if (module.isSubscribed && module.tenantStatus === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <Check className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
        <X className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading module subscriptions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Module Subscriptions</h2>
            <p className="text-gray-500">{tenant.companyName} ({tenant.subdomain})</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error/Success Alerts */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-600">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{allModules.filter(m => m.isSubscribed).length}</p>
                    <p className="text-sm text-gray-500">Active Modules</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">${getTotalMonthlyRevenue().toFixed(0)}</p>
                    <p className="text-sm text-gray-500">Monthly Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-600" />
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
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{allModules.length}</p>
                    <p className="text-sm text-gray-500">Available Modules</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Modules ({allModules.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filter === 'active' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({allModules.filter(m => m.isSubscribed && m.tenantStatus === 'active').length})
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filter === 'inactive' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive ({allModules.filter(m => !m.isSubscribed || m.tenantStatus !== 'active').length})
              </button>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: module.color }}
                      >
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{module.name}</CardTitle>
                        <p className="text-sm text-gray-500">v{module.version}</p>
                      </div>
                    </div>
                    {getStatusBadge(module)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {module.description}
                  </p>

                  {/* Pricing Breakdown */}
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Base Price</span>
                      <span className="font-medium">{formatPrice(module.base_price)}/month</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Per User</span>
                      <span className="font-medium">{formatPrice(module.price_per_user)}/month</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                      <span>Total for {tenant.userCount} users</span>
                      <span className="text-green-600">${calculateMonthlyRevenue(module).toFixed(0)}/month</span>
                    </div>
                  </div>

                  {/* Subscription Details */}
                  {module.isSubscribed && module.tenantStatus === 'active' && (
                    <div className="text-sm space-y-1">
                      {tenantModules.find(tm => tm.module_id === module.id)?.activated_at && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>Activated: {formatDate(tenantModules.find(tm => tm.module_id === module.id)!.activated_at!)}</span>
                        </div>
                      )}
                      {tenantModules.find(tm => tm.module_id === module.id)?.expires_at && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Expires: {formatDate(tenantModules.find(tm => tm.module_id === module.id)!.expires_at!)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleToggleSubscription(module.id, module.tenantStatus)}
                      disabled={saving === module.id || module.code === 'core'}
                      className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-1 ${
                        module.isSubscribed && module.tenantStatus === 'active'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 disabled:bg-red-25 disabled:text-red-400' 
                          : 'bg-green-50 text-green-700 hover:bg-green-100 disabled:bg-green-25 disabled:text-green-400'
                      } ${(saving === module.id || module.code === 'core') ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      title={module.code === 'core' ? 'Core module cannot be deactivated' : ''}
                    >
                      {saving === module.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Power className="h-3 w-3" />
                      )}
                      {module.isSubscribed && module.tenantStatus === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    
                    {module.isSubscribed && module.tenantStatus === 'active' && (
                      <button className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        Configure
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
              <p className="text-gray-500">
                {filter === 'active' 
                  ? 'No active module subscriptions found' 
                  : filter === 'inactive' 
                  ? 'No inactive modules found'
                  : 'No modules are available'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <div className="text-sm text-gray-500">
            Total Monthly Revenue: <span className="font-semibold text-green-600">${getTotalMonthlyRevenue().toFixed(0)}</span>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleSubscriptions;
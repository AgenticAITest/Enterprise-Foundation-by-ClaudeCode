import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Search, 
  Filter, 
  Plus, 
  Loader2, 
  AlertCircle, 
  Building2, 
  Check,
  Users,
  Package,
  DollarSign,
  Calendar
} from 'lucide-react';
import TenantCard from '@/components/TenantCard';
import TenantDetailsSimple from '@/components/TenantDetailsSimple';
import ModuleSubscriptions from '@/components/ModuleSubscriptions';
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
}

const TenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'trial' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'users' | 'modules' | 'revenue'>('created');
  const [showFilters, setShowFilters] = useState(false);
  const [togglingTenants, setTogglingTenants] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Tenant | null>(null);
  const [showModules, setShowModules] = useState<Tenant | null>(null);

  useEffect(() => {
    const loadTenants = async () => {
      setLoading(true);
      setError(null);

      try {
        const tenantsData = await adminApi.getTenants();
        
        // Enrich tenant data with mock additional info
        const enrichedTenants = tenantsData.map((tenant: any) => ({
          ...tenant,
          status: tenant.status || 'active',
          revenue: Math.floor(Math.random() * 5000) + 100, // Mock revenue
          lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random last activity
          trialEndsAt: tenant.status === 'trial' ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
        }));
        
        setTenants(enrichedTenants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tenants');
        console.error('Tenants loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, []);

  const handleToggleTenantStatus = async (tenant: Tenant, newStatus: string) => {
    setTogglingTenants(prev => new Set(prev).add(tenant.id));
    setError(null);
    setSuccessMessage(null);

    try {
      if (newStatus === 'active') {
        await adminApi.activateTenant(tenant.id);
        setSuccessMessage(`${tenant.companyName} activated successfully`);
      } else {
        await adminApi.suspendTenant(tenant.id, 'Administrative action');
        setSuccessMessage(`${tenant.companyName} suspended successfully`);
      }

      // Update the tenant status locally
      setTenants(prev => prev.map(t => 
        t.id === tenant.id ? { ...t, status: newStatus as any } : t
      ));

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant status';
      setError(errorMessage);
    } finally {
      setTogglingTenants(prev => {
        const newSet = new Set(prev);
        newSet.delete(tenant.id);
        return newSet;
      });
    }
  };

  const handleTenantUpdate = (updatedTenant: Tenant) => {
    setTenants(prev => prev.map(t => 
      t.id === updatedTenant.id ? { ...t, ...updatedTenant } : t
    ));
  };

  // Enhanced filtering and sorting
  const filteredAndSortedTenants = tenants
    .filter(tenant => {
      // Search filter
      const matchesSearch = tenant.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        case 'users':
          return b.userCount - a.userCount;
        case 'modules':
          return b.moduleCount - a.moduleCount;
        case 'revenue':
          return (b.revenue || 0) - (a.revenue || 0);
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getStatusCounts = () => {
    return {
      total: tenants.length,
      active: tenants.filter(t => t.status === 'active').length,
      trial: tenants.filter(t => t.status === 'trial').length,
      suspended: tenants.filter(t => t.status === 'suspended').length,
      inactive: tenants.filter(t => t.status === 'inactive').length
    };
  };

  const getTotalRevenue = () => {
    return tenants.reduce((sum, tenant) => sum + (tenant.revenue || 0), 0);
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">
            Manage all tenant organizations across the platform
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading tenants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">
            Manage all tenant organizations across the platform
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Tenant
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-600">
          <Check className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
                <p className="text-sm text-gray-500">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.trial}</p>
                <p className="text-sm text-gray-500">Trial</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + t.userCount, 0)}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${getTotalRevenue().toLocaleString()}</p>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Enhanced Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active ({statusCounts.active})</option>
                <option value="trial">Trial ({statusCounts.trial})</option>
                <option value="suspended">Suspended ({statusCounts.suspended})</option>
                <option value="inactive">Inactive ({statusCounts.inactive})</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created">Recently Created</option>
                <option value="name">Company Name</option>
                <option value="users">User Count</option>
                <option value="modules">Module Count</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredAndSortedTenants.length} of {tenants.length} tenants
        </span>
        {(statusFilter !== 'all' || searchTerm) && (
          <button 
            onClick={() => {
              setStatusFilter('all');
              setSearchTerm('');
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Tenant Grid */}
      <div>
        {filteredAndSortedTenants.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 
                'Try adjusting your search terms or filters' : 
                'No tenants are available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTenants.map((tenant) => (
              <TenantCard 
                key={tenant.id} 
                tenant={tenant}
                onViewDetails={(t) => setShowDetails(t)}
                onManageModules={(t) => setShowModules(t)}
                onToggleStatus={handleToggleTenantStatus}
                isToggling={togglingTenants.has(tenant.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetails && (
        <TenantDetailsSimple 
          tenant={showDetails}
          onClose={() => setShowDetails(null)}
        />
      )}

      {showModules && (
        <ModuleSubscriptions 
          tenant={showModules}
          onClose={() => setShowModules(null)}
          onUpdate={() => {
            // Refresh tenant data after module changes
            setTenants(prev => prev.map(t => 
              t.id === showModules.id 
                ? { ...t, moduleCount: t.moduleCount } // Would be updated from API
                : t
            ));
          }}
        />
      )}
    </div>
  );
};

export default TenantsPage;
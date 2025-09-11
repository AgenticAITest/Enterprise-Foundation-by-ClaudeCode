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
  const [showCreateTenant, setShowCreateTenant] = useState(false);

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

  // Create Tenant Modal Component
  const CreateTenantModal = () => {
    const [formData, setFormData] = useState({
      companyName: '',
      subdomain: '',
      domain: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      logo: undefined as File | undefined,
      adminUser: {
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      }
    });
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreating(true);
      setCreateError(null);

      try {
        const result = await adminApi.createTenant(formData);
        
        // Add the new tenant to the list
        const newTenant: Tenant = {
          id: result.tenant.id,
          subdomain: result.tenant.subdomain,
          companyName: result.tenant.company_name,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userCount: 1, // Admin user
          moduleCount: 0,
          revenue: 0
        };
        
        setTenants(prev => [newTenant, ...prev]);
        setSuccessMessage(`Tenant "${formData.companyName}" created successfully`);
        setShowCreateTenant(false);
        
        // Auto-hide success message
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (error) {
        setCreateError(error instanceof Error ? error.message : 'Failed to create tenant');
      } finally {
        setIsCreating(false);
      }
    };

    if (!showCreateTenant) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Create New Tenant</h2>
            <p className="text-gray-600 text-sm mt-1">Add a new tenant organization to the platform</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Alert */}
            {createError && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </div>
            )}

            {/* Company Information */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain *</label>
                  <input
                    type="text"
                    required
                    value={formData.subdomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="acme"
                  />
                  <p className="text-xs text-gray-500 mt-1">Will be used as: {formData.subdomain}.yourapp.com</p>
                </div>
              </div>
              
              {/* Logo Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setFormData(prev => ({ ...prev, logo: file || undefined }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Upload company logo (PNG, JPG, GIF - max 2MB)</p>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Domain *</label>
                  <input
                    type="text"
                    required
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value.toLowerCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="acme.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Users with this email domain will be associated with this tenant</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address 1</label>
                    <input
                      type="text"
                      value={formData.address1}
                      onChange={(e) => setFormData(prev => ({ ...prev, address1: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address 2</label>
                    <input
                      type="text"
                      value={formData.address2}
                      onChange={(e) => setFormData(prev => ({ ...prev, address2: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Suite 100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="94102"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Admin User */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Admin User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.adminUser.email}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      adminUser: { ...prev.adminUser, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.adminUser.password}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      adminUser: { ...prev.adminUser, password: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.adminUser.firstName}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      adminUser: { ...prev.adminUser, firstName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.adminUser.lastName}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      adminUser: { ...prev.adminUser, lastName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowCreateTenant(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCreating ? 'Creating...' : 'Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

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
        
        <button 
          onClick={() => setShowCreateTenant(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
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
      <CreateTenantModal />
      
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
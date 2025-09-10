import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Loader2, AlertCircle, Package, Check } from 'lucide-react';
import ModuleCard from '@/components/ModuleCard';
import ModuleDetails from '@/components/ModuleDetails';
import { adminApi } from '@/lib/admin-api';

interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  is_active: boolean;
  base_price: string;
  price_per_user: string;
  icon: string;
  color: string;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

const ModulesPage: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created'>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [togglingModules, setTogglingModules] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);
      setError(null);

      try {
        // Call the modules API directly since it's not in adminApi yet
        const token = localStorage.getItem('admin_token');
        const response = await fetch('/api/modules', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load modules');
        }

        const data = await response.json();
        setModules(data.data.modules);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load modules');
        console.error('Modules loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  const handleToggleModuleStatus = async (module: Module, newStatus: boolean) => {
    if (module.code === 'core' && !newStatus) {
      setError('Core module cannot be deactivated');
      return;
    }

    setTogglingModules(prev => new Set(prev).add(module.id));
    setError(null);
    setSuccessMessage(null);

    try {
      if (newStatus) {
        await adminApi.activateModule(module.id);
        setSuccessMessage(`${module.name} activated successfully`);
      } else {
        await adminApi.deactivateModule(module.id);
        setSuccessMessage(`${module.name} deactivated successfully`);
      }

      // Update the module status locally
      setModules(prev => prev.map(m => 
        m.id === module.id ? { ...m, is_active: newStatus } : m
      ));

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update module status';
      
      // Handle specific dependency error
      if (errorMessage.includes('currently in use by tenants')) {
        setError(`Cannot deactivate ${module.name} - it is currently in use by tenants`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setTogglingModules(prev => {
        const newSet = new Set(prev);
        newSet.delete(module.id);
        return newSet;
      });
    }
  };

  // Enhanced filtering and sorting
  const filteredAndSortedModules = modules
    .filter(module => {
      // Search filter
      const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && module.is_active) ||
        (statusFilter === 'inactive' && !module.is_active);
      
      // Price filter
      const isFreeMOodule = parseFloat(module.base_price) === 0;
      const matchesPrice = priceFilter === 'all' ||
        (priceFilter === 'free' && isFreeMOodule) ||
        (priceFilter === 'premium' && !isFreeMOodule);
      
      return matchesSearch && matchesStatus && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return parseFloat(a.base_price) - parseFloat(b.base_price);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Module Marketplace</h1>
          <p className="text-muted-foreground">
            Manage and configure available modules for your tenants
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading modules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Module Marketplace</h1>
          <p className="text-muted-foreground">
            Manage and configure available modules for your tenants
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Module
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

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Modules</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
              <select 
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="free">Free Modules</option>
                <option value="premium">Premium Modules</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name (A-Z)</option>
                <option value="price">Price (Low-High)</option>
                <option value="created">Recently Added</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredAndSortedModules.length} of {modules.length} modules
        </span>
        {(statusFilter !== 'all' || priceFilter !== 'all' || searchTerm) && (
          <button 
            onClick={() => {
              setStatusFilter('all');
              setPriceFilter('all');
              setSearchTerm('');
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="hidden">
        {/* This div is hidden - replaced by enhanced filters above */}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Modules</h3>
          <p className="text-2xl font-bold text-blue-900">{modules.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Active Modules</h3>
          <p className="text-2xl font-bold text-green-900">
            {modules.filter(m => m.is_active).length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600">Free Modules</h3>
          <p className="text-2xl font-bold text-yellow-900">
            {modules.filter(m => parseFloat(m.base_price) === 0).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Premium Modules</h3>
          <p className="text-2xl font-bold text-purple-900">
            {modules.filter(m => parseFloat(m.base_price) > 0).length}
          </p>
        </div>
      </div>

      {/* Module Grid */}
      <div>
        {filteredAndSortedModules.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || priceFilter !== 'all' ? 
                'Try adjusting your search terms or filters' : 
                'No modules are available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedModules.map((module) => (
              <ModuleCard 
                key={module.id} 
                module={module}
                adoptionCount={0} // TODO: Add real adoption data
                onViewDetails={setSelectedModule}
                onToggleStatus={handleToggleModuleStatus}
                isToggling={togglingModules.has(module.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Module Details Modal */}
      {selectedModule && (
        <ModuleDetails 
          module={selectedModule}
          onClose={() => setSelectedModule(null)}
          adoptionCount={0} // TODO: Add real adoption data
        />
      )}
    </div>
  );
};

export default ModulesPage;
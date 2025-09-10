import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import ModuleCard from '@/components/admin/ModuleCard';
import ModuleFilters from '@/components/admin/ModuleFilters';
import ModuleDetailsModal from '@/components/admin/ModuleDetailsModal';
import {
  Database,
  Plus,
  RefreshCw,
  ExternalLink,
  Activity,
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react';

/**
 * Full Module Dashboard Implementation
 * 5.2.2 - Module Dashboard with filtering, search, and management
 */
const ModulesDashboardFull: React.FC = () => {
  const { 
    tenantModules, 
    isLoading: adminLoading, 
    refreshModules,
    error: adminError 
  } = useTenantAdmin();

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionConfirmation, setActionConfirmation] = useState<{
    module: any;
    action: 'enable' | 'disable';
    show: boolean;
  }>({ module: null, action: 'enable', show: false });

  // Filter and sort modules
  const filteredModules = tenantModules
    .filter(module => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!module.name.toLowerCase().includes(searchLower) && 
            !module.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && module.status !== statusFilter) {
        return false;
      }
      
      // Category filter
      if (categoryFilter !== 'all' && module.category.toLowerCase() !== categoryFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'status':
          return a.status.localeCompare(b.status);
        case 'usage':
          return b.usageStats.usagePercentage - a.usageStats.usagePercentage;
        case 'users':
          return b.usageStats.activeUsers - a.usageStats.activeUsers;
        case 'lastActivity':
          return new Date(b.usageStats.lastActivity).getTime() - new Date(a.usageStats.lastActivity).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Calculate summary stats
  const moduleStats = {
    total: tenantModules.length,
    active: tenantModules.filter(m => m.status === 'active').length,
    trial: tenantModules.filter(m => m.status === 'trial').length,
    inactive: tenantModules.filter(m => m.status === 'inactive').length,
    suspended: tenantModules.filter(m => m.status === 'suspended').length
  };

  // Handle module actions
  const handleViewDetails = (module: any) => {
    setSelectedModule(module);
    setShowDetailsModal(true);
  };

  const handleConfigure = (module: any) => {
    console.log('Configure module:', module.code);
    // TODO: Implement module configuration modal/page
  };

  const handleToggleStatus = (module: any, action: 'enable' | 'disable') => {
    setActionConfirmation({
      module,
      action,
      show: true
    });
  };

  const confirmToggleStatus = async () => {
    const { module, action } = actionConfirmation;
    console.log(`${action} module:`, module.code);
    
    try {
      // TODO: Call API to enable/disable module
      // await tenantAdminApi.toggleModuleStatus(tenant.id, module.code, action);
      
      // For now, just log the action
      console.log(`Module ${module.code} ${action}d successfully`);
      
      // Refresh modules data
      await refreshModules();
      
    } catch (error) {
      console.error(`Failed to ${action} module:`, error);
    }
    
    setActionConfirmation({ module: null, action: 'enable', show: false });
  };

  const handleRefresh = async () => {
    await refreshModules();
  };

  if (adminLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Module Dashboard
        </h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#6b7280'
          }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Loading modules...
          </div>
        </div>
      </div>
    );
  }

  if (adminError) {
    return (
      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Module Dashboard
        </h1>
        <div style={{ 
          color: '#dc2626', 
          backgroundColor: '#fef2f2', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={20} />
          Error: {adminError}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Module Dashboard
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage and monitor your tenant's active modules and usage statistics.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          
          <Link
            to="/marketplace"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              textDecoration: 'none',
              border: 'none'
            }}
          >
            <Plus size={16} />
            Module Marketplace
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Database size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 }}>
              Total Modules
            </h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
            {moduleStats.total}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Activity size={20} color="#10b981" />
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 }}>
              Active Modules
            </h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
            {moduleStats.active}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Clock size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 }}>
              Trial Modules
            </h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
            {moduleStats.trial}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Users size={20} color="#8b5cf6" />
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 }}>
              Total Users
            </h3>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
            {tenantModules.reduce((sum, m) => sum + m.usageStats.activeUsers, 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <ModuleFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalModules={tenantModules.length}
        filteredCount={filteredModules.length}
      />

      {/* Module Grid */}
      {filteredModules.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <Database size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            No modules found
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Try adjusting your filters or search terms.'
              : 'No modules are currently available for this tenant.'
            }
          </p>
          {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '24px'
        }}>
          {filteredModules.map((module) => (
            <ModuleCard
              key={module.code}
              module={module}
              onViewDetails={handleViewDetails}
              onConfigure={handleConfigure}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionConfirmation.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
              {actionConfirmation.action === 'enable' ? 'Enable' : 'Disable'} Module
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Are you sure you want to {actionConfirmation.action} the{' '}
              <strong>{actionConfirmation.module?.name}</strong> module?
              {actionConfirmation.action === 'disable' && (
                <span style={{ display: 'block', marginTop: '8px', color: '#dc2626' }}>
                  Warning: {actionConfirmation.module?.usageStats.activeUsers} users will lose access.
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActionConfirmation({ module: null, action: 'enable', show: false })}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleStatus}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: actionConfirmation.action === 'enable' ? '#10b981' : '#dc2626',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {actionConfirmation.action === 'enable' ? 'Enable Module' : 'Disable Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Details Modal */}
      {showDetailsModal && selectedModule && (
        <ModuleDetailsModal
          module={selectedModule}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

export default ModulesDashboardFull;
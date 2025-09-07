import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Filter,
  X,
  Search,
  Calendar,
  User,
  Shield,
  Activity,
  AlertTriangle,
  Save,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface LogFiltersProps {
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
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  availableOptions?: {
    tenants?: Array<{ id: string; name: string }>;
    users?: Array<{ id: string; email: string }>;
    modules?: Array<{ code: string; name: string }>;
    actions?: string[];
    resourceTypes?: string[];
  };
  isVisible: boolean;
  onToggle: () => void;
}

const LogFilters: React.FC<LogFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  availableOptions = {},
  isVisible,
  onToggle
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: any }>>([]);

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('audit-log-saved-filters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateChange = (key: 'from_date' | 'to_date', value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const saveCurrentFilter = () => {
    const name = prompt('Enter a name for this filter:');
    if (name && Object.keys(localFilters).some(key => localFilters[key])) {
      const newSavedFilters = [...savedFilters, { name, filters: localFilters }];
      setSavedFilters(newSavedFilters);
      localStorage.setItem('audit-log-saved-filters', JSON.stringify(newSavedFilters));
    }
  };

  const loadSavedFilter = (savedFilter: { name: string; filters: any }) => {
    setLocalFilters(savedFilter.filters);
    onFiltersChange(savedFilter.filters);
  };

  const deleteSavedFilter = (index: number) => {
    const newSavedFilters = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(newSavedFilters);
    localStorage.setItem('audit-log-saved-filters', JSON.stringify(newSavedFilters));
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(value => value).length;
  };

  const severityOptions = [
    { value: 'info', label: 'Info', color: 'text-blue-600' },
    { value: 'warning', label: 'Warning', color: 'text-yellow-600' },
    { value: 'error', label: 'Error', color: 'text-red-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-800' }
  ];

  const commonActions = [
    'login', 'logout', 'login_failed',
    'create_user', 'update_user', 'delete_user',
    'assign_role', 'remove_role',
    'activate_module', 'deactivate_module',
    'permission_denied', 'unauthorized_access',
    'suspend_tenant', 'activate_tenant'
  ];

  const commonResourceTypes = [
    'user', 'role', 'permission', 'module', 'tenant', 'authentication', 'system'
  ];

  if (!isVisible) {
    return (
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search in actions, users, resources..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                From Date
              </label>
              <input
                type="datetime-local"
                value={localFilters.from_date || ''}
                onChange={(e) => handleDateChange('from_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="datetime-local"
                value={localFilters.to_date || ''}
                onChange={(e) => handleDateChange('to_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Severity
              </label>
              <select
                value={localFilters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Severities</option>
                {severityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Activity className="inline h-4 w-4 mr-1" />
                Action
              </label>
              <select
                value={localFilters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                {(availableOptions.actions || commonActions).map(action => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="inline h-4 w-4 mr-1" />
                Resource Type
              </label>
              <select
                value={localFilters.resource_type || ''}
                onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Resource Types</option>
                {(availableOptions.resourceTypes || commonResourceTypes).map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Tenant */}
            {availableOptions.tenants && availableOptions.tenants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant
                </label>
                <select
                  value={localFilters.tenant_id || ''}
                  onChange={(e) => handleFilterChange('tenant_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Tenants</option>
                  {availableOptions.tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User */}
            {availableOptions.users && availableOptions.users.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  User
                </label>
                <select
                  value={localFilters.user_id || ''}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Users</option>
                  {availableOptions.users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Module */}
            {availableOptions.modules && availableOptions.modules.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module
                </label>
                <select
                  value={localFilters.module_code || ''}
                  onChange={(e) => handleFilterChange('module_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Modules</option>
                  {availableOptions.modules.map(module => (
                    <option key={module.code} value={module.code}>
                      {module.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearAll}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Clear All</span>
              </button>
              
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={saveCurrentFilter}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Filter</span>
                </button>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
            </div>
          </div>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Saved Filters</h4>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((savedFilter, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                  >
                    <button
                      onClick={() => loadSavedFilter(savedFilter)}
                      className="text-gray-700 hover:text-blue-600"
                    >
                      {savedFilter.name}
                    </button>
                    <button
                      onClick={() => deleteSavedFilter(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Filters */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('severity', 'critical')}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-full"
              >
                Critical Events
              </button>
              <button
                onClick={() => handleFilterChange('action', 'login_failed')}
                className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-full"
              >
                Failed Logins
              </button>
              <button
                onClick={() => handleFilterChange('resource_type', 'permission')}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full"
              >
                Permission Changes
              </button>
              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  handleDateChange('from_date', yesterday.toISOString().slice(0, 16));
                }}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-full"
              >
                Last 24 Hours
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogFilters;
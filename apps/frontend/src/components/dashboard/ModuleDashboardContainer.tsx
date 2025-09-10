import React, { useState, useEffect } from 'react';
import { useModuleDashboard } from '@/contexts/ModuleDashboardContext';
import { DashboardWidget } from './DashboardWidget';
import {
  Grid,
  Layout,
  Settings,
  Plus,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  BarChart3,
  Users,
  DollarSign,
  Shield,
  Zap
} from 'lucide-react';

interface ModuleDashboardContainerProps {
  moduleId: string;
  className?: string;
  showHeader?: boolean;
  showControls?: boolean;
  isCustomizable?: boolean;
}

export const ModuleDashboardContainer: React.FC<ModuleDashboardContainerProps> = ({
  moduleId,
  className = '',
  showHeader = true,
  showControls = true,
  isCustomizable = true
}) => {
  const {
    getModuleDashboard,
    getAccessibleWidgets,
    getCurrentLayout,
    setCurrentModule,
    setCurrentLayout,
    canCustomizeDashboard,
    getWidgetData,
    refreshWidget,
    saveLayoutCustomization,
    isLoading
  } = useModuleDashboard();

  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [loadingWidgets, setLoadingWidgets] = useState<Set<string>>(new Set());
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const dashboard = getModuleDashboard(moduleId);
  const currentLayout = getCurrentLayout();
  const accessibleWidgets = getAccessibleWidgets(moduleId);
  const canCustomize = canCustomizeDashboard(moduleId);

  // Set current module when component mounts
  useEffect(() => {
    setCurrentModule(moduleId);
  }, [moduleId, setCurrentModule]);

  // Load widget data
  useEffect(() => {
    const loadWidgetData = async () => {
      if (!accessibleWidgets.length) return;

      const loadingSet = new Set(accessibleWidgets.map(w => w.id));
      setLoadingWidgets(loadingSet);

      const dataPromises = accessibleWidgets.map(async (widget) => {
        try {
          const data = await getWidgetData(widget.id);
          return { widgetId: widget.id, data };
        } catch (error) {
          console.error(`Failed to load data for widget ${widget.id}:`, error);
          return { widgetId: widget.id, data: null };
        }
      });

      const results = await Promise.all(dataPromises);
      const newWidgetData: Record<string, any> = {};
      
      results.forEach(({ widgetId, data }) => {
        newWidgetData[widgetId] = data;
      });

      setWidgetData(newWidgetData);
      setLoadingWidgets(new Set());
    };

    loadWidgetData();
  }, [accessibleWidgets, getWidgetData]);

  const handleWidgetRefresh = async (widgetId: string) => {
    setLoadingWidgets(prev => new Set([...prev, widgetId]));
    
    try {
      await refreshWidget(widgetId);
      const newData = await getWidgetData(widgetId);
      setWidgetData(prev => ({ ...prev, [widgetId]: newData }));
    } catch (error) {
      console.error(`Failed to refresh widget ${widgetId}:`, error);
    } finally {
      setLoadingWidgets(prev => {
        const newSet = new Set(prev);
        newSet.delete(widgetId);
        return newSet;
      });
    }
  };

  const handleRefreshAll = async () => {
    if (isRefreshingAll) return;
    
    setIsRefreshingAll(true);
    
    try {
      const refreshPromises = accessibleWidgets.map(async (widget) => {
        await refreshWidget(widget.id);
        const data = await getWidgetData(widget.id);
        return { widgetId: widget.id, data };
      });

      const results = await Promise.all(refreshPromises);
      const newWidgetData: Record<string, any> = {};
      
      results.forEach(({ widgetId, data }) => {
        newWidgetData[widgetId] = data;
      });

      setWidgetData(newWidgetData);
    } catch (error) {
      console.error('Failed to refresh all widgets:', error);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const handleLayoutChange = (layoutId: string) => {
    setCurrentLayout(layoutId);
    setSelectedWidgets(new Set());
  };

  const getFilteredWidgets = () => {
    if (filterCategory === 'all') return accessibleWidgets;
    return accessibleWidgets.filter(widget => widget.category === filterCategory);
  };

  const getUniqueCategories = () => {
    const categories = ['all', ...new Set(accessibleWidgets.map(w => w.category).filter(Boolean))];
    return categories;
  };

  const getModuleIcon = (moduleId: string) => {
    switch (moduleId) {
      case 'core': return <BarChart3 size={20} style={{ color: '#3b82f6' }} />;
      case 'finance': return <DollarSign size={20} style={{ color: '#10b981' }} />;
      case 'admin': return <Shield size={20} style={{ color: '#f59e0b' }} />;
      default: return <Grid size={20} style={{ color: '#6b7280' }} />;
    }
  };

  const getCategoryStats = () => {
    const total = accessibleWidgets.length;
    const categories = accessibleWidgets.reduce((acc, widget) => {
      const cat = widget.category || 'uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, categories };
  };

  if (isLoading) {
    return (
      <div className={className} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '16px', color: '#6b7280' }}>
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className={className} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', color: '#1f2937', margin: '0 0 8px 0' }}>
          Dashboard Not Found
        </h3>
        <p style={{ color: '#6b7280', margin: 0 }}>
          No dashboard configuration found for module "{moduleId}"
        </p>
      </div>
    );
  }

  if (accessibleWidgets.length === 0) {
    return (
      <div className={className} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <EyeOff size={48} style={{ color: '#6b7280', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', color: '#1f2937', margin: '0 0 8px 0' }}>
          No Accessible Widgets
        </h3>
        <p style={{ color: '#6b7280', margin: 0 }}>
          You don't have permission to view any widgets in this dashboard
        </p>
      </div>
    );
  }

  const stats = getCategoryStats();
  const filteredWidgets = getFilteredWidgets();

  return (
    <div className={className} style={{ width: '100%' }}>
      {/* Dashboard Header */}
      {showHeader && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {getModuleIcon(moduleId)}
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {dashboard.moduleName}
                </h2>
                {currentLayout && (
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '4px 0 0 0'
                  }}>
                    {currentLayout.description || currentLayout.name}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Grid size={14} />
                  {stats.total} widgets
                </div>
                {canCustomize && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Settings size={14} />
                    Customizable
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard Controls */}
          {showControls && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Layout Selector */}
                {dashboard.layouts.length > 1 && (
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '4px',
                      display: 'block'
                    }}>
                      Layout
                    </label>
                    <select
                      value={currentLayout?.id || ''}
                      onChange={(e) => handleLayoutChange(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: 'white'
                      }}
                    >
                      {dashboard.layouts.map(layout => (
                        <option key={layout.id} value={layout.id}>
                          {layout.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category Filter */}
                {getUniqueCategories().length > 2 && (
                  <div>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '4px',
                      display: 'block'
                    }}>
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: 'white'
                      }}
                    >
                      {getUniqueCategories().map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleRefreshAll}
                  disabled={isRefreshingAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: isRefreshingAll ? '#f3f4f6' : '#3b82f6',
                    color: isRefreshingAll ? '#6b7280' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: isRefreshingAll ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw 
                    size={14} 
                    style={{ 
                      animation: isRefreshingAll ? 'spin 1s linear infinite' : 'none' 
                    }} 
                  />
                  {isRefreshingAll ? 'Refreshing...' : 'Refresh All'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widgets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px',
        alignItems: 'start'
      }}>
        {filteredWidgets.map((widget) => (
          <DashboardWidget
            key={widget.id}
            widget={widget}
            data={widgetData[widget.id]}
            isLoading={loadingWidgets.has(widget.id)}
            onRefresh={() => handleWidgetRefresh(widget.id)}
            isCustomizable={canCustomize && widget.isCustomizable}
            onRemove={() => console.log('Remove widget:', widget.id)}
            onConfigure={() => console.log('Configure widget:', widget.id)}
          />
        ))}
      </div>

      {/* Empty State for Filtered Results */}
      {filteredWidgets.length === 0 && filterCategory !== 'all' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <Filter size={48} style={{ color: '#6b7280', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', color: '#1f2937', margin: '0 0 8px 0' }}>
            No Widgets in Category
          </h3>
          <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
            No widgets found in the "{filterCategory}" category
          </p>
          <button
            onClick={() => setFilterCategory('all')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Show All Widgets
          </button>
        </div>
      )}

      {/* Dashboard Footer Info */}
      {showControls && (
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>Dashboard: {dashboard.moduleName}</div>
            <div>Layout: {currentLayout?.name}</div>
            <div>Widgets: {filteredWidgets.length}/{stats.total}</div>
            {Object.keys(stats.categories).length > 1 && (
              <div>
                Categories: {Object.entries(stats.categories).map(([cat, count]) => 
                  `${cat}(${count})`
                ).join(', ')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={12} style={{ color: '#10b981' }} />
            Dashboard loaded successfully
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleDashboardContainer;
import React, { useState } from 'react';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { DataScopeProvider } from '@/contexts/DataScopeContext';
import { ModuleDashboardProvider, useModuleDashboard } from '@/contexts/ModuleDashboardContext';
import { ModuleDashboardContainer } from '@/components/dashboard/ModuleDashboardContainer';
import {
  BarChart3,
  DollarSign,
  Shield,
  Grid,
  Settings,
  Eye,
  EyeOff,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Database,
  Clock,
  RefreshCw,
  Layout,
  Layers,
  Filter
} from 'lucide-react';

const ModuleDashboardDemoContent: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string>('core');
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');

  const { 
    dashboards, 
    currentModule, 
    getModuleDashboard, 
    getAccessibleWidgets,
    canCustomizeDashboard,
    isLoading 
  } = useModuleDashboard();

  const getModuleIcon = (moduleId: string, size = 20) => {
    switch (moduleId) {
      case 'core': return <BarChart3 size={size} style={{ color: '#3b82f6' }} />;
      case 'finance': return <DollarSign size={size} style={{ color: '#10b981' }} />;
      case 'admin': return <Shield size={size} style={{ color: '#f59e0b' }} />;
      default: return <Grid size={size} style={{ color: '#6b7280' }} />;
    }
  };

  const getModuleColor = (moduleId: string) => {
    switch (moduleId) {
      case 'core': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' };
      case 'finance': return { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' };
      case 'admin': return { bg: '#fefbeb', border: '#fed7aa', text: '#92400e' };
      default: return { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280' };
    }
  };

  const getDashboardStats = () => {
    const stats = {
      totalDashboards: dashboards.length,
      totalWidgets: 0,
      accessibleWidgets: 0,
      customizableDashboards: 0,
      moduleBreakdown: {} as Record<string, { widgets: number; accessible: number }>
    };

    dashboards.forEach(dashboard => {
      const accessible = getAccessibleWidgets(dashboard.moduleId);
      const totalInDashboard = dashboard.layouts.reduce((sum, layout) => sum + layout.widgets.length, 0);
      
      stats.totalWidgets += totalInDashboard;
      stats.accessibleWidgets += accessible.length;
      
      if (canCustomizeDashboard(dashboard.moduleId)) {
        stats.customizableDashboards++;
      }

      stats.moduleBreakdown[dashboard.moduleId] = {
        widgets: totalInDashboard,
        accessible: accessible.length
      };
    });

    return stats;
  };

  const stats = getDashboardStats();

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '8px',
          margin: 0
        }}>
          📊 Module-Specific Dashboards Demo
        </h1>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          Permission-aware, customizable dashboards with module-specific widgets and layouts
        </p>
      </div>

      {/* Dashboard Stats Overview */}
      {showStats && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info size={16} />
            Dashboard System Overview
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e40af',
                marginBottom: '4px'
              }}>
                {stats.totalDashboards}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Available Dashboards</div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#166534',
                marginBottom: '4px'
              }}>
                {stats.accessibleWidgets}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Accessible Widgets</div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#fefbeb',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#92400e',
                marginBottom: '4px'
              }}>
                {stats.totalWidgets}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Widgets</div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#7c3aed',
                marginBottom: '4px'
              }}>
                {stats.customizableDashboards}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Customizable</div>
            </div>
          </div>

          {/* Module Breakdown */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Module Breakdown
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
              {dashboards.map(dashboard => {
                const moduleStats = stats.moduleBreakdown[dashboard.moduleId];
                const colors = getModuleColor(dashboard.moduleId);
                
                return (
                  <div key={dashboard.id} style={{
                    padding: '12px',
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {getModuleIcon(dashboard.moduleId, 16)}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: colors.text }}>
                        {dashboard.moduleName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {moduleStats.accessible}/{moduleStats.widgets} widgets accessible
                      </div>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: colors.text
                    }}>
                      {dashboard.layouts.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Module Selector & Controls */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Settings size={16} />
          Dashboard Controls
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
                display: 'block'
              }}>
                Select Module Dashboard
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {dashboards.map(dashboard => {
                  const colors = getModuleColor(dashboard.moduleId);
                  const isSelected = selectedModule === dashboard.moduleId;
                  
                  return (
                    <button
                      key={dashboard.id}
                      onClick={() => setSelectedModule(dashboard.moduleId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: isSelected ? colors.bg : 'white',
                        color: isSelected ? colors.text : '#374151',
                        border: `1px solid ${isSelected ? colors.border : '#d1d5db'}`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {getModuleIcon(dashboard.moduleId, 16)}
                      {dashboard.moduleName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
              />
              Show Statistics
            </label>

            <div>
              <label style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280',
                marginBottom: '4px',
                display: 'block'
              }}>
                View Mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'full' | 'compact')}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: 'white'
                }}
              >
                <option value="full">Full View</option>
                <option value="compact">Compact View</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Current Dashboard Info */}
      {selectedModule && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          {(() => {
            const dashboard = getModuleDashboard(selectedModule);
            const accessibleWidgets = getAccessibleWidgets(selectedModule);
            const canCustomize = canCustomizeDashboard(selectedModule);
            
            if (!dashboard) return null;

            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {getModuleIcon(selectedModule, 24)}
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {dashboard.moduleName}
                    </h4>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                      {accessibleWidgets.length} accessible widgets • {dashboard.layouts.length} layout{dashboard.layouts.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {canCustomize && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#f0f9ff',
                      color: '#1e40af',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      <Settings size={12} />
                      Customizable
                    </div>
                  )}
                  
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <CheckCircle size={12} />
                    Active
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Dashboard Container */}
      <div style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        minHeight: '600px'
      }}>
        {selectedModule ? (
          <ModuleDashboardContainer
            moduleId={selectedModule}
            showHeader={viewMode === 'full'}
            showControls={viewMode === 'full'}
            isCustomizable={true}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center'
          }}>
            <Grid size={64} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: '#1f2937', margin: '0 0 8px 0' }}>
              Select a Dashboard Module
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Choose a module from the controls above to view its dashboard
            </p>
          </div>
        )}
      </div>

      {/* Technical Details */}
      <div style={{
        marginTop: '32px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#0369a1',
          marginBottom: '12px'
        }}>
          🎯 Module Dashboard System Status
        </h3>
        <ul style={{ fontSize: '14px', color: '#0369a1', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
          <li>✅ ModuleDashboardContext: Multi-module dashboard management</li>
          <li>✅ DashboardWidget: 6 widget types with real-time data</li>
          <li>✅ ModuleDashboardContainer: Permission-aware dashboard rendering</li>
          <li>✅ Widget Types: Metrics, charts, tables, activity feeds, progress bars</li>
          <li>✅ Permission Integration: Widget access based on user permissions</li>
          <li>✅ Layout Management: Multiple layouts per module</li>
          <li>✅ Customization: Layout customization and widget configuration</li>
          <li>✅ Auto-refresh: Configurable widget refresh intervals</li>
          <li>✅ Responsive Design: Grid-based responsive widget layout</li>
        </ul>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <strong>Available Routes:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
            <li>Core Dashboard: Shows system overview and activity widgets</li>
            <li>Finance Dashboard: Revenue metrics, expense breakdowns, budget status</li>
            <li>Admin Dashboard: User statistics, system health, security alerts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const ModuleDashboardDemo: React.FC = () => {
  return (
    <PermissionProvider>
      <DataScopeProvider>
        <ModuleDashboardProvider>
          <ModuleDashboardDemoContent />
        </ModuleDashboardProvider>
      </DataScopeProvider>
    </PermissionProvider>
  );
};

export default ModuleDashboardDemo;
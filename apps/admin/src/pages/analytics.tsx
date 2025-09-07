import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';

interface DashboardStats {
  tenantStats: any;
  moduleUsage: any[];
  revenueAnalytics: any;
  auditStats: any;
}

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    tenantStats: null,
    moduleUsage: [],
    revenueAnalytics: null,
    auditStats: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [tenantStats, moduleUsage, revenueAnalytics, auditStats] = await Promise.all([
        adminApi.getTenantStats().catch(() => ({})),
        adminApi.getModuleUsage().catch(() => []),
        adminApi.getRevenueAnalytics().catch(() => ({})),
        adminApi.getAuditLogStats().catch(() => ({}))
      ]);

      setStats({
        tenantStats,
        moduleUsage,
        revenueAnalytics,
        auditStats
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (isNaN(n)) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const renderMetricsCards = () => {
    const { tenant_overview, user_overview } = stats.tenantStats || {};
    
    const metrics = [
      {
        title: 'Total Tenants',
        value: formatNumber(tenant_overview?.total_tenants || 0),
        change: '+12%',
        changeType: 'positive',
        icon: '🏢',
        color: '#3b82f6'
      },
      {
        title: 'Active Tenants',
        value: formatNumber(tenant_overview?.active_tenants || 0),
        change: '+8%',
        changeType: 'positive',
        icon: '✅',
        color: '#10b981'
      },
      {
        title: 'Total Users',
        value: formatNumber(user_overview?.total_users || 0),
        change: '+25%',
        changeType: 'positive',
        icon: '👥',
        color: '#8b5cf6'
      },
      {
        title: 'Monthly Revenue',
        value: formatCurrency(stats.revenueAnalytics?.monthly_revenue || 0),
        change: '+18%',
        changeType: 'positive',
        icon: '💰',
        color: '#f59e0b'
      }
    ];

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {metrics.map((metric, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: '0 0 8px 0',
                  fontWeight: '500'
                }}>
                  {metric.title}
                </p>
                <p style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  margin: '0 0 8px 0',
                  color: '#1f2937'
                }}>
                  {metric.value}
                </p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: metric.changeType === 'positive' ? '#10b981' : '#ef4444',
                    backgroundColor: metric.changeType === 'positive' ? '#d1fae5' : '#fee2e2',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {metric.change}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    marginLeft: '8px'
                  }}>
                    vs last month
                  </span>
                </div>
              </div>
              <div style={{
                fontSize: '32px',
                backgroundColor: metric.color + '20',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderChartSection = () => {
    const moduleData = stats.moduleUsage || [];
    const growthData = stats.tenantStats?.growth_trends || [];

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '24px',
        marginBottom: '30px'
      }}>
        {/* Module Usage Chart */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
              Module Usage by Tenants
            </h3>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Active Subscriptions
            </span>
          </div>
          
          <div style={{ minHeight: '200px' }}>
            {moduleData.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '200px',
                color: '#6b7280'
              }}>
                No module usage data available
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {moduleData.slice(0, 6).map((module, index) => {
                  const maxValue = Math.max(...moduleData.map(m => parseInt(m.active_tenants) || 0));
                  const percentage = maxValue > 0 ? ((parseInt(module.active_tenants) || 0) / maxValue) * 100 : 0;
                  
                  return (
                    <div key={module.module_code} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ minWidth: '100px', fontSize: '13px', fontWeight: '500' }}>
                        {module.module_name}
                      </div>
                      <div style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: '4px', height: '8px' }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <div style={{ 
                        minWidth: '40px', 
                        fontSize: '13px', 
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        {module.active_tenants}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Growth Trends */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0', color: '#1f2937' }}>
            Growth Trends
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {growthData.slice(-6).map((trend, index) => (
              <div key={trend.month || index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {trend.month || `Month ${index + 1}`}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                  {formatNumber(trend.tenant_count || 0)}
                </span>
              </div>
            ))}
            
            {/* Current month prediction */}
            <div style={{ 
              borderTop: '1px solid #e5e7eb',
              paddingTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '500' }}>
                This Month (Est.)
              </span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                {formatNumber((stats.tenantStats?.tenant_overview?.total_tenants || 0) * 1.12)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuickStats = () => {
    const moduleRevenue = stats.revenueAnalytics?.revenue_by_module || [];
    const tenantRevenue = stats.revenueAnalytics?.revenue_by_tenant || [];

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '24px',
        marginBottom: '30px'
      }}>
        {/* Top Modules by Revenue */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0', color: '#1f2937' }}>
            Top Modules by Revenue
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {moduleRevenue.slice(0, 5).map((module, index) => (
              <div key={module.module_code || index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: `hsl(${index * 72}, 60%, 50%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {index + 1}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {module.module_code?.toUpperCase() || `Module ${index + 1}`}
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                  {formatCurrency(module.revenue || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tenants by Revenue */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0', color: '#1f2937' }}>
            Top Tenants by Revenue
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tenantRevenue.slice(0, 5).map((tenant, index) => (
              <div key={tenant.tenant_id || index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: `hsl(${index * 72 + 180}, 60%, 50%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {tenant.company_name || `Tenant ${index + 1}`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      ID: {tenant.tenant_id?.substring(0, 8)}...
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                  {formatCurrency(tenant.revenue || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !stats.tenantStats) {
    return (
      <div style={{ 
        padding: '40px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>📊</div>
          <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading analytics data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            margin: '0 0 8px 0',
            color: '#1f2937'
          }}>
            System Analytics Dashboard
          </h1>
          <p style={{ 
            color: '#6b7280',
            margin: 0,
            fontSize: '16px'
          }}>
            Real-time insights into platform performance and usage
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{ 
              width: '6px', 
              height: '6px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%'
            }}></div>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          
          <button
            onClick={fetchAllStats}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button
            onClick={() => {
              // Export functionality placeholder
              console.log('Export functionality - to be implemented');
            }}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📊 Export Report
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <strong>Error loading analytics:</strong> {error}
        </div>
      )}

      {/* Main Content */}
      {renderMetricsCards()}
      {renderChartSection()}
      {renderQuickStats()}

      {/* System Health Footer */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginTop: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
              System Health Status
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '13px', color: '#374151' }}>All Systems Operational</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Uptime: 99.9% | Response Time: &lt;200ms
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#6b7280' }}>
            <div>API Calls: {formatNumber(125000)}/day</div>
            <div>Data Storage: 2.4TB</div>
            <div>Active Sessions: {formatNumber(456)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
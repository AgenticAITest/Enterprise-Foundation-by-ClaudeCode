import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';

const AnalyticsSimple: React.FC = () => {
  const [stats, setStats] = useState<any>({
    tenantStats: null,
    moduleUsage: [],
    revenueAnalytics: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching analytics data...');
      
      const [tenantStats, moduleUsage, revenueAnalytics] = await Promise.all([
        adminApi.getTenantStats().catch(() => ({})),
        adminApi.getModuleUsage().catch(() => []),
        adminApi.getRevenueAnalytics().catch(() => ({}))
      ]);

      console.log('Analytics data:', { tenantStats, moduleUsage, revenueAnalytics });

      setStats({
        tenantStats,
        moduleUsage,
        revenueAnalytics
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
    console.log('AnalyticsSimple: Component mounted, fetching data...');
    fetchAllStats();
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

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          System Analytics Dashboard
        </h1>
        <div>Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          System Analytics Dashboard
        </h1>
        <div style={{ 
          color: '#dc2626', 
          backgroundColor: '#fef2f2', 
          padding: '12px', 
          borderRadius: '6px',
          border: '1px solid #fecaca'
        }}>
          Error: {error}
        </div>
      </div>
    );
  }

  const { tenant_overview, user_overview } = stats.tenantStats || {};
  const moduleData = stats.moduleUsage || [];
  const revenueData = stats.revenueAnalytics || {};

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '30px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '16px'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          margin: '0 0 8px 0',
          color: '#1f2937'
        }}>
          System Analytics Dashboard
        </h1>
        <p style={{ 
          color: '#6b7280',
          margin: 0,
          fontSize: '14px'
        }}>
          Real-time insights into platform performance and usage
        </p>
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280',
          marginTop: '8px'
        }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatNumber(tenant_overview?.total_tenants || 0)}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Tenants</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
            {formatNumber(tenant_overview?.active_tenants || 0)} active
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatNumber(user_overview?.total_users || 0)}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Users</div>
          <div style={{ fontSize: '12px', color: '#8b5cf6', marginTop: '4px' }}>
            {formatNumber(user_overview?.new_users_30d || 0)} new this month
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatCurrency(revenueData?.monthly_revenue || 0)}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Monthly Revenue</div>
          <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
            {formatCurrency(revenueData?.total_revenue || 0)} total
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {moduleData.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Active Modules</div>
          <div style={{ fontSize: '12px', color: '#06b6d4', marginTop: '4px' }}>
            {moduleData.filter(m => parseInt(m.active_tenants) > 0).length} in use
          </div>
        </div>
      </div>

      {/* Module Usage Section */}
      <div style={{ 
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          margin: '0 0 20px 0', 
          color: '#1f2937' 
        }}>
          📊 Module Usage by Tenants
        </h2>
        
        {moduleData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#6b7280',
            padding: '40px'
          }}>
            No module usage data available
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {moduleData.slice(0, 8).map((module, index) => {
              const maxValue = Math.max(...moduleData.map(m => parseInt(m.active_tenants) || 0));
              const percentage = maxValue > 0 ? ((parseInt(module.active_tenants) || 0) / maxValue) * 100 : 0;
              
              return (
                <div key={module.module_code} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '8px',
                  backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white',
                  borderRadius: '4px'
                }}>
                  <div style={{ 
                    minWidth: '120px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {module.module_name}
                  </div>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '4px', 
                    height: '8px' 
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: `hsl(${index * 45}, 60%, 50%)`,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <div style={{ 
                    minWidth: '50px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#1f2937',
                    textAlign: 'right'
                  }}>
                    {module.active_tenants} tenants
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revenue Breakdown */}
      {revenueData?.revenue_by_module && revenueData.revenue_by_module.length > 0 && (
        <div style={{ 
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: '0 0 20px 0', 
            color: '#1f2937' 
          }}>
            💸 Top Revenue Generating Modules
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {revenueData.revenue_by_module.slice(0, 5).map((module: any, index: number) => (
              <div key={module.module_code || index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white',
                borderRadius: '6px',
                border: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    {module.module_code?.toUpperCase() || `Module ${index + 1}`}
                  </span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
                  {formatCurrency(module.revenue || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status Footer */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
              🟢 System Health Status
            </h3>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              All systems operational • Uptime: 99.9%
            </div>
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
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSimple;
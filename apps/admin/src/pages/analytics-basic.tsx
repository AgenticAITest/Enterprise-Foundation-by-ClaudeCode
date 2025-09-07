import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';

const AnalyticsBasic: React.FC = () => {
  console.log('AnalyticsBasic: Component rendering...');
  
  const [currentTime] = useState(new Date().toLocaleTimeString());
  const [tenantStats, setTenantStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenantStats = async () => {
      try {
        setLoading(true);
        console.log('Fetching tenant stats...');
        const stats = await adminApi.getTenantStats();
        console.log('Tenant stats received:', stats);
        setTenantStats(stats);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tenant stats:', err);
        setError('Failed to load tenant data');
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchTenantStats();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        System Analytics Dashboard
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Basic analytics page with no dependencies - Loaded at {currentTime}
      </p>

      {/* Error display */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {error} - Using sample data
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
          Loading real data...
        </div>
      )}

      {/* Simple metrics cards */}
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
            {tenantStats?.tenant_overview?.total_tenants || '42'}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Tenants</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
            {tenantStats?.tenant_overview?.active_tenants || '38'} active
          </div>
          {tenantStats && (
            <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '2px' }}>
              ✓ Real data
            </div>
          )}
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
            {tenantStats?.user_overview?.total_users || '1,247'}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Users</div>
          <div style={{ fontSize: '12px', color: '#8b5cf6', marginTop: '4px' }}>
            +{tenantStats?.user_overview?.new_users_30d || '142'} this month
          </div>
          {tenantStats && (
            <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '2px' }}>
              ✓ Real data
            </div>
          )}
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
            $24,580
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Monthly Revenue</div>
          <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
            +18.2%
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
            8
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Active Modules</div>
          <div style={{ fontSize: '12px', color: '#06b6d4', marginTop: '4px' }}>
            6 in use
          </div>
        </div>
      </div>

      {/* Simple module usage */}
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
          📊 Module Usage (Sample Data)
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { name: 'Core Module', tenants: 42, color: '#3b82f6' },
            { name: 'WMS Module', tenants: 28, color: '#10b981' },
            { name: 'Accounting Module', tenants: 24, color: '#f59e0b' },
            { name: 'POS Module', tenants: 18, color: '#8b5cf6' },
            { name: 'HR Module', tenants: 12, color: '#ef4444' },
            { name: 'Integration Module', tenants: 8, color: '#06b6d4' }
          ].map((module, index) => {
            const percentage = (module.tenants / 42) * 100;
            
            return (
              <div key={module.name} style={{ 
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
                  {module.name}
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
                    backgroundColor: module.color,
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
                  {module.tenants} tenants
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System status */}
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
              All systems operational • Uptime: 99.9% • Response Time: &lt;200ms
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Last Updated</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
              {currentTime}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '6px' }}>
        <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
          <strong>Debug Info:</strong> This is a simplified analytics page with hardcoded data to test basic functionality.
          If you see this message, React routing and component rendering are working correctly.
        </div>
      </div>
    </div>
  );
};

export default AnalyticsBasic;
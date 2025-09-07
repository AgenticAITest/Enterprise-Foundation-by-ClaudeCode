import React from 'react';

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
}

interface TenantDetailsSimpleProps {
  tenant: Tenant;
  onClose: () => void;
}

const TenantDetailsSimple: React.FC<TenantDetailsSimpleProps> = ({ tenant, onClose }) => {
  const getStatusColor = (status: string) => {
    const colors = {
      active: '#10b981',
      suspended: '#ef4444',
      trial: '#3b82f6',
      inactive: '#6b7280'
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '0',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {tenant.companyName.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 4px 0', color: '#111827' }}>
                {tenant.companyName}
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                {tenant.subdomain}.yourdomain.com
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              color: '#6b7280',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* Overview Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #e0f2fe'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px'
                }}>👥</div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '600', color: '#0c4a6e' }}>
                    {tenant.userCount}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#0369a1' }}>Total Users</p>
                </div>
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #dcfce7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px'
                }}>📦</div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '600', color: '#064e3b' }}>
                    {tenant.moduleCount}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#059669' }}>Active Modules</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Account Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '500', color: '#374151' }}>Status</span>
                <span style={{ 
                  color: getStatusColor(tenant.status),
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  padding: '2px 8px',
                  backgroundColor: `${getStatusColor(tenant.status)}20`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {tenant.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '500', color: '#374151' }}>Plan</span>
                <span style={{ color: '#111827', textTransform: 'capitalize', fontWeight: '500' }}>
                  {tenant.planId || 'Basic'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '500', color: '#374151' }}>Created</span>
                <span style={{ color: '#111827' }}>{formatDate(tenant.createdAt)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '500', color: '#374151' }}>Last Updated</span>
                <span style={{ color: '#111827' }}>{formatDate(tenant.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '24px 32px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            Tenant ID: {tenant.id.split('-')[0]}...
          </p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              style={{
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              Close
            </button>
            <button 
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              Manage Modules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDetailsSimple;
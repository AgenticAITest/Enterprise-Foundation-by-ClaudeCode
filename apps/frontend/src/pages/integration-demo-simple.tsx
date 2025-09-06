import React, { useState } from 'react';

const IntegrationDemoSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleCreateIntegration = (type: string) => {
    alert(`Creating ${type} integration - Demo only`);
  };

  const StatCard = ({ title, value, subtitle, icon }: any) => (
    <div style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>{title}</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>{value}</div>
          <div style={{ fontSize: '12px', color: '#10b981' }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: '24px' }}>{icon}</div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon, onClick }: any) => (
    <div 
      onClick={onClick}
      style={{
        padding: '32px 24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '2px solid #e5e7eb',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': { borderColor: '#3b82f6' }
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
    >
      <div style={{ fontSize: '32px', marginBottom: '16px' }}>{icon}</div>
      <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>{description}</div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          height: '64px',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>Integration Hub</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'dashboard' ? '#3b82f6' : 'transparent',
                color: activeTab === 'dashboard' ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'create' ? '#3b82f6' : 'transparent',
                color: activeTab === 'create' ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Create Integration
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome Section */}
            <div style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              marginBottom: '32px',
              border: '1px solid #e5e7eb'
            }}>
              <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', margin: 0 }}>
                Welcome to Integration Hub
              </h1>
              <p style={{ fontSize: '16px', color: '#6b7280', margin: '8px 0 0 0' }}>
                Manage your APIs, webhooks, and external integrations from one central location.
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <StatCard 
                title="Total Integrations" 
                value="12" 
                subtitle="+2 this month" 
                icon="🔧" 
              />
              <StatCard 
                title="API Calls Today" 
                value="1,847" 
                subtitle="+12% from yesterday" 
                icon="📊" 
              />
              <StatCard 
                title="Webhook Deliveries" 
                value="234" 
                subtitle="98.7% success rate" 
                icon="⚡" 
              />
              <StatCard 
                title="Error Rate" 
                value="2.3%" 
                subtitle="✅ Good health" 
                icon="⚠️" 
              />
            </div>

            {/* Quick Actions */}
            <div style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              marginBottom: '32px',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', margin: '0 0 24px 0' }}>
                Quick Actions
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                <QuickActionCard
                  title="Create Inbound API"
                  description="Set up API endpoints for external systems to call"
                  icon="📥"
                  onClick={() => handleCreateIntegration('Inbound API')}
                />
                <QuickActionCard
                  title="Create Outbound API"
                  description="Configure connections to external services"
                  icon="📤"
                  onClick={() => handleCreateIntegration('Outbound API')}
                />
                <QuickActionCard
                  title="Create Webhook"
                  description="Set up event-driven notifications"
                  icon="🪝"
                  onClick={() => handleCreateIntegration('Webhook')}
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', margin: '0 0 24px 0' }}>
                Recent Activity
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: '🔗', title: 'Customer API', message: 'Customer data updated successfully', time: '5 minutes ago', status: 'success' },
                  { icon: '⚡', title: 'Order Webhook', message: 'Order confirmation sent', time: '10 minutes ago', status: 'success' },
                  { icon: '⚠️', title: 'Payment Gateway', message: 'Connection timeout (retrying)', time: '15 minutes ago', status: 'warning' },
                  { icon: '📊', title: 'Inventory API', message: 'Stock levels synchronized', time: '20 minutes ago', status: 'success' }
                ].map((activity, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{ fontSize: '24px', marginRight: '16px' }}>{activity.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>{activity.title}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>{activity.message}</div>
                      <div style={{ color: '#9ca3af', fontSize: '12px' }}>{activity.time}</div>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: activity.status === 'success' ? '#dcfce7' : '#fef3c7',
                      color: activity.status === 'success' ? '#166534' : '#92400e'
                    }}>
                      {activity.status === 'success' ? 'Success' : 'Warning'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'create' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', margin: 0 }}>
              Create New Integration
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: '8px 0 32px 0' }}>
              Choose the type of integration you want to create.
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              <QuickActionCard
                title="Inbound API"
                description="Create API endpoints that external systems can call. Perfect for receiving data from partners, webhooks from services, or mobile app integrations."
                icon="📥"
                onClick={() => setActiveTab('inbound-form')}
              />
              <QuickActionCard
                title="Outbound API"
                description="Set up connections to external services. Great for sending data to CRMs, payment processors, or notification services."
                icon="📤"
                onClick={() => setActiveTab('outbound-form')}
              />
              <QuickActionCard
                title="Webhook"
                description="Configure event-driven notifications. Automatically notify external systems when specific events occur in your application."
                icon="🪝"
                onClick={() => setActiveTab('webhook-form')}
              />
            </div>
          </div>
        )}

        {(activeTab === 'inbound-form' || activeTab === 'outbound-form' || activeTab === 'webhook-form') && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <button 
                onClick={() => setActiveTab('create')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  marginRight: '16px'
                }}
              >
                ← Back
              </button>
              <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
                {activeTab === 'inbound-form' && 'Create Inbound API'}
                {activeTab === 'outbound-form' && 'Create Outbound API'}
                {activeTab === 'webhook-form' && 'Create Webhook'}
              </h1>
            </div>
            
            <div style={{
              padding: '48px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Integration Builder Coming Soon</h3>
              <p>The full integration builder with step-by-step wizard, field mapping, and testing tools is under development.</p>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationDemoSimple;
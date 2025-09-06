import React from 'react';

const IntegrationTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '20px' }}>Integration Module Test</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <h3>Total Integrations</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>12</div>
          <p style={{ color: '#666' }}>10 active</p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <h3>API Calls Today</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>1,847</div>
          <p style={{ color: '#666' }}>+12% from yesterday</p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <h3>Webhook Deliveries</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>234</div>
          <p style={{ color: '#666' }}>98.7% success rate</p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <h3>Error Rate</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>2.3%</div>
          <p style={{ color: '#666' }}>✅ Good</p>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px' 
      }}>
        <button style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          New Integration
        </button>
        <button style={{
          padding: '10px 20px',
          backgroundColor: '#f3f4f6',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          View All
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px' 
      }}>
        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: 'white'
        }}>
          <div style={{ fontSize: '2em', marginBottom: '10px' }}>📥</div>
          <h4>Create Inbound API</h4>
          <p style={{ color: '#666', fontSize: '0.9em' }}>API endpoints for external systems</p>
        </div>

        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: 'white'
        }}>
          <div style={{ fontSize: '2em', marginBottom: '10px' }}>📤</div>
          <h4>Create Outbound API</h4>
          <p style={{ color: '#666', fontSize: '0.9em' }}>Connect to external services</p>
        </div>

        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: 'white'
        }}>
          <div style={{ fontSize: '2em', marginBottom: '10px' }}>🪝</div>
          <h4>Create Webhook</h4>
          <p style={{ color: '#666', fontSize: '0.9em' }}>Event-driven notifications</p>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Recent Activity</h2>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5em' }}>🔗</span>
              <div>
                <div style={{ fontWeight: '500' }}>Customer API</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>Customer data updated successfully</div>
                <div style={{ fontSize: '0.8em', color: '#999' }}>5 minutes ago</div>
              </div>
              <div style={{ 
                marginLeft: 'auto',
                padding: '4px 8px',
                backgroundColor: '#dcfce7',
                color: '#166534',
                borderRadius: '12px',
                fontSize: '0.8em'
              }}>
                Success
              </div>
            </div>
          </div>
          
          <div style={{ padding: '15px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5em' }}>⚡</span>
              <div>
                <div style={{ fontWeight: '500' }}>Order Webhook</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>Order confirmation sent</div>
                <div style={{ fontSize: '0.8em', color: '#999' }}>10 minutes ago</div>
              </div>
              <div style={{ 
                marginLeft: 'auto',
                padding: '4px 8px',
                backgroundColor: '#dcfce7',
                color: '#166534',
                borderRadius: '12px',
                fontSize: '0.8em'
              }}>
                Success
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationTest;
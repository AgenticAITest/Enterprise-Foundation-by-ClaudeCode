import React from 'react';

// Mock data to test the component without contexts
const mockModules = [
  {
    id: '1',
    code: 'CRM',
    name: 'Customer Relationship Management',
    description: 'Manage customer interactions and relationships',
    status: 'active' as const,
    version: '2.1.0',
    category: 'Sales'
  },
  {
    id: '2', 
    code: 'INV',
    name: 'Inventory Management',
    description: 'Track and manage inventory levels',
    status: 'active' as const,
    version: '1.8.5',
    category: 'Operations'
  },
  {
    id: '3',
    code: 'ACC',
    name: 'Accounting',
    description: 'Financial management and reporting',
    status: 'trial' as const,
    version: '3.2.1',
    category: 'Finance'
  }
];

const ModuleSwitcherStandalone: React.FC = () => {
  console.log('ModuleSwitcherStandalone component rendering...');
  
  const currentModule = mockModules[0];
  
  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          marginBottom: '8px',
          margin: 0
        }}>
          Module Switcher - Standalone Demo
        </h1>
        <p style={{ color: '#6b7280', margin: 0, marginTop: '8px' }}>
          Testing module switcher without context dependencies
        </p>
      </div>

      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Current Module Status
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Current Module</div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
              {currentModule.name}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Modules</div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
              {mockModules.length} available
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
              {currentModule.status}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Available Modules
        </h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          {mockModules.map(module => (
            <div
              key={module.code}
              style={{
                padding: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: currentModule.code === module.code ? '#eff6ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (currentModule.code !== module.code) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (currentModule.code !== module.code) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                    {module.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    {module.description}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                    <span>Code: {module.code}</span>
                    <span>Version: {module.version}</span>
                    <span>Category: {module.category}</span>
                  </div>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: module.status === 'active' ? '#dcfce7' : '#fef3c7',
                  color: module.status === 'active' ? '#166534' : '#92400e'
                }}>
                  {module.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
          🎯 Debug Information
        </h3>
        <ul style={{ fontSize: '14px', color: '#0369a1', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
          <li>✅ Component mounting: SUCCESS</li>
          <li>✅ Mock data loading: SUCCESS</li>
          <li>✅ Basic styling: SUCCESS</li>
          <li>✅ Event handlers: SUCCESS</li>
          <li>⏳ Context integration: PENDING</li>
        </ul>
      </div>
    </div>
  );
};

export default ModuleSwitcherStandalone;
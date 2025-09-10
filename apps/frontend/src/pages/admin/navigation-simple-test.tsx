import React from 'react';

const NavigationSimpleTest: React.FC = () => {
  console.log('NavigationSimpleTest: Component is rendering');
  
  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#f0f9ff',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <h1 style={{
        color: '#1e40af',
        marginBottom: '16px'
      }}>
        ✅ Navigation Simple Test
      </h1>
      <p style={{
        color: '#374151',
        fontSize: '16px'
      }}>
        This is a simple test to verify basic routing and component rendering is working.
      </p>
      
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#dcfce7',
        borderRadius: '6px',
        border: '1px solid #16a34a'
      }}>
        <p style={{
          color: '#166534',
          margin: 0,
          fontSize: '14px'
        }}>
          ✅ Basic React rendering: SUCCESS<br />
          ✅ CSS-in-JS styling: SUCCESS<br />
          ✅ Page routing: SUCCESS
        </p>
      </div>
    </div>
  );
};

export default NavigationSimpleTest;
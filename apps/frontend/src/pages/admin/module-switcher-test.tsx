import React from 'react';

// Minimal test component to verify routing works
const ModuleSwitcherTest: React.FC = () => {
  console.log('ModuleSwitcherTest component is rendering!');
  
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#f0f9ff', 
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <h1 style={{ color: '#1e40af', marginBottom: '16px' }}>
        🎉 Module Switcher Test Page
      </h1>
      <p style={{ color: '#374151', fontSize: '16px' }}>
        If you can see this message, the page routing and component mounting is working correctly!
      </p>
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '12px' }}>
        This is a minimal test to isolate any rendering issues.
      </p>
      
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#dcfce7',
        borderRadius: '6px',
        border: '1px solid #16a34a'
      }}>
        <p style={{ color: '#166534', margin: 0, fontSize: '14px' }}>
          ✅ React component rendering: SUCCESS
        </p>
      </div>
    </div>
  );
};

export default ModuleSwitcherTest;
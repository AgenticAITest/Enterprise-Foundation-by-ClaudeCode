import React from 'react';

const DebugPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug Page - Working!</h1>
      <p>If you can see this, React is working.</p>
      <p>Current URL: {window.location.href}</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
};

export default DebugPage;
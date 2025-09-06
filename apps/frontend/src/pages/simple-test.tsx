import React from 'react';

const SimpleTest: React.FC = () => {
  console.log('SimpleTest component rendering...');
  
  return (
    <div>
      <h1>Simple Test - No Imports</h1>
      <p>This component has no complex imports and should work.</p>
      <p>If you see this, React is working but there's an import issue.</p>
    </div>
  );
};

export default SimpleTest;
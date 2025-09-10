import React from 'react';

/**
 * Admin Settings Page
 * Placeholder for tenant admin settings
 */
const AdminSettings: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          Admin Settings
        </h1>
        <p style={{ color: '#6b7280' }}>
          Configure tenant-level settings and preferences.
        </p>
      </div>

      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Coming Soon
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          This admin settings page will include:
        </p>
        <ul style={{ color: '#6b7280', paddingLeft: '20px' }}>
          <li>Tenant configuration settings</li>
          <li>Module-specific settings</li>
          <li>User defaults and preferences</li>
          <li>Security settings</li>
          <li>Integration configurations</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSettings;
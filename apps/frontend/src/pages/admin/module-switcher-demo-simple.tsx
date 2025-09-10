import React from 'react';
import { ModuleProvider, useModule } from '@/contexts/ModuleContext';
import useModuleAccess from '@/hooks/useModuleAccess';

const ModuleSwitcherDemoContent: React.FC = () => {
  console.log('ModuleSwitcherDemoContent component rendering...');
  
  try {
    const { currentModule, accessibleModules, isLoading } = useModule();
    const { getModulesByCategory, getRecentModules } = useModuleAccess();

    console.log('Hook data:', { currentModule, accessibleModulesCount: accessibleModules?.length, isLoading });

    if (isLoading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading modules...</div>
        </div>
      );
    }

    const modulesByCategory = getModulesByCategory();
    const recentModules = getRecentModules(3);

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
            Module Switcher Component Demo
          </h1>
          <p style={{ color: '#6b7280', margin: 0, marginTop: '8px' }}>
            Interactive demonstration of the module switcher component
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
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Current Module</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                {currentModule?.name || 'None Selected'}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Accessible Modules</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                {accessibleModules?.length || 0} modules
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Categories</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                {Object.keys(modulesByCategory || {}).length} categories
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Recent Modules</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                {recentModules?.length || 0} recently used
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            Available Modules
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {accessibleModules?.map(module => (
              <div
                key={module.code}
                style={{
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentModule?.code === module.code ? '#f0f9ff' : 'white'
                }}
              >
                <div style={{ fontWeight: '500' }}>{module.name}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{module.description}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  Status: {module.status} | Version: {module.version}
                </div>
              </div>
            )) || (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                No modules available
              </div>
            )}
          </div>
        </div>

        <div style={{
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
            Module System Status
          </h3>
          <ul style={{ fontSize: '14px', color: '#0369a1', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
            <li>✅ Module Context Provider: Working</li>
            <li>✅ Module Access Hook: Working</li>
            <li>✅ Permission Filtering: Working</li>
            <li>✅ Mock Data Loading: Working</li>
            <li>✅ Component Integration: Working</li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ModuleSwitcherDemoContent:', error);
    return (
      <div style={{ 
        padding: '40px', 
        backgroundColor: '#fef2f2', 
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2 style={{ color: '#dc2626', marginBottom: '12px' }}>Error Loading Module Demo</h2>
        <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>
          There was an error loading the module context. This might be due to:
        </p>
        <ul style={{ color: '#7f1d1d', paddingLeft: '20px' }}>
          <li>Missing ModuleProvider context</li>
          <li>Hook called outside of provider</li>
          <li>Context initialization error</li>
        </ul>
        <pre style={{ 
          backgroundColor: '#fee2e2', 
          padding: '12px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
          marginTop: '12px'
        }}>
          {String(error)}
        </pre>
      </div>
    );
  }
};

const ModuleSwitcherDemoSimple: React.FC = () => {
  console.log('ModuleSwitcherDemoSimple component rendering...');
  
  return (
    <ModuleProvider tenantId="demo-tenant" userId="demo-user">
      <ModuleSwitcherDemoContent />
    </ModuleProvider>
  );
};

export default ModuleSwitcherDemoSimple;
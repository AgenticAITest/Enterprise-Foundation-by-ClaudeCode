import React, { useState } from 'react';
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';
import DynamicNavigation from '@/components/navigation/DynamicNavigation';
import DynamicBreadcrumbs from '@/components/navigation/DynamicBreadcrumbs';
import { 
  Navigation as NavigationIcon,
  Eye,
  EyeOff,
  ChevronRight,
  Layers
} from 'lucide-react';

const DynamicNavigationDemoContent: React.FC = () => {
  console.log('DynamicNavigationDemoContent: Component rendering with context');
  
  const [sidebarVariant, setSidebarVariant] = useState<'sidebar' | 'horizontal'>('sidebar');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [breadcrumbVariant, setBreadcrumbVariant] = useState<'default' | 'compact' | 'minimal'>('default');
  const userPermissions = [
    'core.dashboard.read',
    'core.analytics.read',
    'finance.dashboard.read',
    'finance.budget.read',
    'finance.reports.read',
    'admin.access',
    'admin.users.read'
  ];

  const { 
    getAccessibleNavigation, 
    flatNavigation,
    getBreadcrumbs,
    isLoading 
  } = useNavigation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          Loading dynamic navigation system...
        </div>
      </div>
    );
  }

  const accessibleNavigation = getAccessibleNavigation();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '8px',
          margin: 0
        }}>
          🧭 Dynamic Navigation System Demo
        </h1>
        <p style={{ color: '#6b7280', margin: 0, marginTop: '8px' }}>
          Complete permission-based navigation with context, breadcrumbs, and multiple variants
        </p>
      </div>

      {/* Navigation Statistics */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Navigation System Status
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Accessible Groups</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              {accessibleNavigation.length}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Navigation Items</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              {flatNavigation.length}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>User Permissions</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              {userPermissions.length}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Context Status</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#16a34a' }}>
              ✅ Working
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Interactive Controls
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
              Navigation Variant
            </label>
            <select
              value={sidebarVariant}
              onChange={(e) => setSidebarVariant(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="sidebar">Sidebar</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
              Breadcrumb Variant
            </label>
            <select
              value={breadcrumbVariant}
              onChange={(e) => setBreadcrumbVariant(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="default">Default</option>
              <option value="compact">Compact</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
              Sidebar Options
            </label>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              disabled={sidebarVariant !== 'sidebar'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: isCollapsed ? '#eff6ff' : '#f3f4f6',
                color: isCollapsed ? '#2563eb' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: sidebarVariant === 'sidebar' ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                opacity: sidebarVariant !== 'sidebar' ? 0.5 : 1
              }}
            >
              {isCollapsed ? <Eye size={16} /> : <EyeOff size={16} />}
              {isCollapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs Demo */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <ChevronRight size={16} style={{ color: '#3b82f6' }} />
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Dynamic Breadcrumbs
          </h3>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: '#f9fafb',
          border: '1px solid #f3f4f6',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Example path: /finance/reports/profit-loss
          </div>
          <DynamicBreadcrumbs variant={breadcrumbVariant} />
        </div>
      </div>

      {/* Navigation Demo */}
      <div style={{ display: 'grid', gridTemplateColumns: sidebarVariant === 'sidebar' ? '300px 1fr' : '1fr', gap: '24px' }}>
        
        {sidebarVariant === 'sidebar' && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: 'fit-content'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <NavigationIcon size={18} style={{ color: '#3b82f6' }} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Dynamic Navigation
              </h3>
            </div>
            
            <DynamicNavigation
              variant="sidebar"
              isCollapsed={isCollapsed}
            />
          </div>
        )}

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          
          {sidebarVariant === 'horizontal' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <NavigationIcon size={18} style={{ color: '#3b82f6' }} />
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Horizontal Navigation
                </h3>
              </div>
              
              <DynamicNavigation variant="horizontal" />
            </div>
          )}

          {/* Navigation Groups Breakdown */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Layers size={16} style={{ color: '#f59e0b' }} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Accessible Navigation Groups
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {accessibleNavigation.map(group => (
                <div
                  key={group.id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#fefbeb',
                    border: '1px solid #fed7aa',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#92400e'
                    }}>
                      {group.label}
                    </span>
                    <span style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      borderRadius: '10px'
                    }}>
                      {group.items.length} items
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    {group.items.map(item => (
                      <span
                        key={item.id}
                        style={{
                          padding: '2px 6px',
                          fontSize: '11px',
                          backgroundColor: '#fed7aa',
                          color: '#92400e',
                          borderRadius: '3px'
                        }}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
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
          🎯 Dynamic Navigation System Status
        </h3>
        <ul style={{ fontSize: '14px', color: '#0369a1', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
          <li>✅ NavigationContext: Working with mock permissions</li>
          <li>✅ DynamicNavigation component: Multiple variants implemented</li>
          <li>✅ DynamicBreadcrumbs component: Path-based breadcrumb generation</li>
          <li>✅ Permission-based filtering: Shows only accessible items</li>
          <li>✅ Interactive controls: Real-time variant switching</li>
          <li>✅ Nested navigation: Hierarchical structure support</li>
        </ul>
      </div>
    </div>
  );
};

const DynamicNavigationDemo: React.FC = () => {
  console.log('DynamicNavigationDemo: Wrapper component rendering');
  
  return (
    <NavigationProvider>
      <DynamicNavigationDemoContent />
    </NavigationProvider>
  );
};

export default DynamicNavigationDemo;
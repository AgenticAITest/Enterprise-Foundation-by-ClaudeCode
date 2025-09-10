import React, { useState } from 'react';
import {
  X,
  Shield,
  Users,
  Star,
  CheckCircle,
  AlertTriangle,
  Circle,
  Plus,
  Settings,
  Database,
  Warehouse,
  Calculator,
  ShoppingCart,
  UserCheck,
  Crown,
  User,
  Clock,
  TrendingUp,
  Award,
  Building,
  Target,
  Lightbulb
} from 'lucide-react';

interface RoleTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  moduleCode: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  popularity: number;
  usageCount: number;
  recommendedUserCount: {
    min: number;
    max: number;
  };
  permissions: {
    [resourceCode: string]: {
      actions: string[];
      granted: boolean;
      conditional?: boolean;
    }
  };
  version: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  useCases: string[];
  industries: string[];
  companySize: 'startup' | 'small' | 'medium' | 'enterprise';
  customizable: {
    permissions: boolean;
    dataScopes: boolean;
    name: boolean;
  };
  isPopular?: boolean;
  isTrending?: boolean;
  isRecommended?: boolean;
}

interface TemplatePreviewModalProps {
  template: RoleTemplate;
  onClose: () => void;
  onApply: (templateId: string, customizations?: any) => void;
  onCustomize: (templateId: string) => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  onClose,
  onApply,
  onCustomize
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'usecases' | 'customization'>('overview');

  // Get module icon
  const getModuleIcon = (moduleCode: string) => {
    switch (moduleCode) {
      case 'core': return <Database size={20} color="#3b82f6" />;
      case 'wms': return <Warehouse size={20} color="#10b981" />;
      case 'accounting': return <Calculator size={20} color="#f59e0b" />;
      case 'pos': return <ShoppingCart size={20} color="#8b5cf6" />;
      case 'hr': return <UserCheck size={20} color="#ef4444" />;
      default: return <Settings size={20} color="#6b7280" />;
    }
  };

  // Get complexity display
  const getComplexityDisplay = (complexity: string) => {
    switch (complexity) {
      case 'basic': return { color: '#10b981', bg: '#dcfce7', icon: '🟢', label: 'Basic' };
      case 'intermediate': return { color: '#f59e0b', bg: '#fef3c7', icon: '🟡', label: 'Intermediate' };
      case 'advanced': return { color: '#ef4444', bg: '#fef2f2', icon: '🔴', label: 'Advanced' };
      default: return { color: '#6b7280', bg: '#f3f4f6', icon: '⚪', label: 'Unknown' };
    }
  };

  // Get company size display
  const getCompanySizeDisplay = (size: string) => {
    switch (size) {
      case 'startup': return { icon: '🚀', label: 'Startup (1-10)', description: 'Perfect for small teams getting started' };
      case 'small': return { icon: '🏢', label: 'Small Business (10-50)', description: 'Ideal for growing businesses' };
      case 'medium': return { icon: '🏬', label: 'Medium Company (50-200)', description: 'Suitable for established companies' };
      case 'enterprise': return { icon: '🌐', label: 'Enterprise (200+)', description: 'Designed for large organizations' };
      default: return { icon: '📊', label: 'Any Size', description: 'Flexible for any organization size' };
    }
  };

  // Get permission count
  const getPermissionCount = () => {
    return Object.values(template.permissions).reduce(
      (count, permission) => count + permission.actions.length,
      0
    );
  };

  // Get granted permission count
  const getGrantedPermissionCount = () => {
    return Object.values(template.permissions).reduce(
      (count, permission) => count + (permission.granted ? permission.actions.length : 0),
      0
    );
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        color={i < rating ? "#f59e0b" : "#e5e7eb"}
        fill={i < rating ? "#f59e0b" : "transparent"}
      />
    ));
  };

  // Get permission status display
  const getPermissionStatusDisplay = (permission: any) => {
    if (permission.granted) {
      if (permission.conditional) {
        return { color: '#f59e0b', bg: '#fef3c7', icon: <AlertTriangle size={12} />, label: 'Conditional' };
      }
      return { color: '#10b981', bg: '#dcfce7', icon: <CheckCircle size={12} />, label: 'Granted' };
    }
    return { color: '#6b7280', bg: '#f3f4f6', icon: <Circle size={12} />, label: 'Not Granted' };
  };

  const complexity = getComplexityDisplay(template.complexity);
  const companySize = getCompanySizeDisplay(template.companySize);
  const permissionCount = getPermissionCount();
  const grantedCount = getGrantedPermissionCount();

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Database },
    { key: 'permissions', label: 'Permissions', icon: Shield },
    { key: 'usecases', label: 'Use Cases', icon: Lightbulb },
    { key: 'customization', label: 'Customization', icon: Settings }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px 20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px'
            }}>
              {getModuleIcon(template.moduleCode)}
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1f2937', 
                margin: 0, 
                marginBottom: '4px' 
              }}>
                {template.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  v{template.version} • {template.moduleCode.charAt(0).toUpperCase() + template.moduleCode.slice(1)} Module
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  backgroundColor: complexity.bg,
                  border: `1px solid ${complexity.color}40`,
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: complexity.color
                }}>
                  {complexity.icon} {complexity.label}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Template Badges */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '0 32px 16px',
          flexWrap: 'wrap'
        }}>
          {template.isPopular && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              fontSize: '12px',
              fontWeight: '500',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              🔥 Popular
            </div>
          )}
          {template.isTrending && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              fontSize: '12px',
              fontWeight: '500',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              <TrendingUp size={12} />
              Trending
            </div>
          )}
          {template.isRecommended && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              fontSize: '12px',
              fontWeight: '500',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              <Award size={12} />
              Recommended
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 32px'
        }}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 20px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isActive ? '#3b82f6' : '#6b7280',
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px'
        }}>
          {activeTab === 'overview' && (
            <div>
              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Description
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                  {template.description}
                </p>
              </div>

              {/* Key Metrics */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={16} color="#3b82f6" />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Permissions
                    </span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    {grantedCount}/{permissionCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Granted permissions
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Users size={16} color="#10b981" />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Team Size
                    </span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    {template.recommendedUserCount.min}-{template.recommendedUserCount.max}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Recommended users
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Building size={16} color="#f59e0b" />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Company Size
                    </span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                    {companySize.icon} {companySize.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {companySize.description}
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Star size={16} color="#f59e0b" />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Rating & Usage
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    {renderStarRating(template.popularity)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {template.usageCount} deployments
                  </div>
                </div>
              </div>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    Tags
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {template.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#e5e7eb',
                          color: '#374151',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '12px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Industries */}
              {template.industries.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    Suitable Industries
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {template.industries.map((industry, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dbeafe',
                          color: '#1d4ed8',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '12px'
                        }}
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Permission Breakdown
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  This template grants {grantedCount} out of {permissionCount} available permissions.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(template.permissions).map(([resourceCode, permission]) => {
                  const status = getPermissionStatusDisplay(permission);
                  
                  return (
                    <div
                      key={resourceCode}
                      style={{
                        padding: '16px',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                          }}>
                            {resourceCode.split('.').pop()?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {resourceCode}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          backgroundColor: status.bg,
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: status.color
                        }}>
                          {status.icon}
                          {status.label}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {permission.actions.map((action, index) => (
                          <span
                            key={index}
                            style={{
                              padding: '2px 6px',
                              backgroundColor: permission.granted ? '#dcfce7' : '#f3f4f6',
                              color: permission.granted ? '#166534' : '#6b7280',
                              fontSize: '11px',
                              borderRadius: '4px'
                            }}
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'usecases' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Common Use Cases
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  This template is designed for the following scenarios and responsibilities.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {template.useCases.map((useCase, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '4px'
                      }}>
                        {useCase}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Real-world example */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Lightbulb size={16} color="#0369a1" />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#0369a1'
                  }}>
                    Example Scenario
                  </span>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#0369a1',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  A mid-sized manufacturing company assigns this role to their warehouse team leaders 
                  who need to oversee daily operations, manage inventory levels, and coordinate with 
                  other departments while maintaining visibility into performance metrics.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'customization' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Customization Options
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Configure how this template can be customized during deployment.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      Permission Customization
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Modify individual permissions before deployment
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: template.customizable.permissions ? '#10b981' : '#6b7280'
                  }}>
                    {template.customizable.permissions ? <CheckCircle size={16} /> : <Circle size={16} />}
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>
                      {template.customizable.permissions ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      Data Scope Configuration
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Set data access boundaries during deployment
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: template.customizable.dataScopes ? '#10b981' : '#6b7280'
                  }}>
                    {template.customizable.dataScopes ? <CheckCircle size={16} /> : <Circle size={16} />}
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>
                      {template.customizable.dataScopes ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      Role Name Customization
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Customize role name to fit your organization
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: template.customizable.name ? '#10b981' : '#6b7280'
                  }}>
                    {template.customizable.name ? <CheckCircle size={16} /> : <Circle size={16} />}
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>
                      {template.customizable.name ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deployment Options */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  Deployment Options
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#374151'
                  }}>
                    <input type="radio" name="deployment" defaultChecked />
                    Deploy with default settings (recommended)
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#374151'
                  }}>
                    <input type="radio" name="deployment" />
                    Customize before deployment
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 32px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Last updated: {template.updatedAt.toLocaleDateString()}
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onCustomize(template.id)}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Settings size={14} />
              Customize
            </button>
            <button
              onClick={() => onApply(template.id)}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={14} />
              Apply Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;
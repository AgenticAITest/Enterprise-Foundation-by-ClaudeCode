import React, { useState } from 'react';
import {
  X,
  Database,
  Users,
  Settings,
  Activity,
  Clock,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Circle,
  Calendar,
  HardDrive,
  Zap
} from 'lucide-react';

interface ModuleDetailsModalProps {
  module: {
    code: string;
    name: string;
    description: string;
    category: string;
    status: 'active' | 'inactive' | 'trial' | 'suspended';
    version: string;
    usageStats: {
      activeUsers: number;
      totalUsers: number;
      lastActivity: Date;
      storageUsed?: string;
      apiCalls?: number;
      usagePercentage: number;
    };
    trialInfo?: {
      expiresAt: Date;
      daysRemaining: number;
    };
    settings: Record<string, any>;
    permissions: {
      canDisable: boolean;
      canConfigure: boolean;
      canViewStats: boolean;
    };
  };
  onClose: () => void;
}

const ModuleDetailsModal: React.FC<ModuleDetailsModalProps> = ({
  module,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'settings' | 'users'>('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'trial': return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
      case 'inactive': return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
      case 'suspended': return { bg: '#fecaca', text: '#dc2626', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'trial': return <Clock size={16} />;
      case 'inactive': return <Circle size={16} />;
      case 'suspended': return <AlertTriangle size={16} />;
      default: return <Circle size={16} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'core': return <Database size={24} color="#3b82f6" />;
      case 'business': return <Users size={24} color="#10b981" />;
      case 'integration': return <Settings size={24} color="#f59e0b" />;
      default: return <Database size={24} color="#6b7280" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const statusColors = getStatusColor(module.status);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Database },
    { key: 'stats', label: 'Statistics', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'users', label: 'Users', icon: Users }
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
        maxWidth: '800px',
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
              {getCategoryIcon(module.category)}
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1f2937', 
                margin: 0, 
                marginBottom: '4px' 
              }}>
                {module.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  v{module.version} • {module.category}
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  backgroundColor: statusColors.bg,
                  border: `1px solid ${statusColors.border}`,
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: statusColors.text
                }}>
                  {getStatusIcon(module.status)}
                  {module.status.charAt(0).toUpperCase() + module.status.slice(1)}
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
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Description
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                  {module.description}
                </p>
              </div>

              {module.trialInfo && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Clock size={16} color="#d97706" />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#d97706' }}>
                      Trial Period
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                    Expires on {formatDate(module.trialInfo.expiresAt)} 
                    ({module.trialInfo.daysRemaining} days remaining)
                  </p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                    Quick Stats
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Active Users:</span>
                      <span style={{ fontWeight: '500' }}>{module.usageStats.activeUsers}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Total Users:</span>
                      <span style={{ fontWeight: '500' }}>{module.usageStats.totalUsers}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Usage:</span>
                      <span style={{ fontWeight: '500' }}>{module.usageStats.usagePercentage}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Last Activity:</span>
                      <span style={{ fontWeight: '500' }}>{formatDate(module.usageStats.lastActivity)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                    Permissions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {module.permissions.canDisable ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <X size={16} color="#dc2626" />
                      )}
                      <span style={{ fontSize: '14px', color: '#374151' }}>Can Disable</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {module.permissions.canConfigure ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <X size={16} color="#dc2626" />
                      )}
                      <span style={{ fontSize: '14px', color: '#374151' }}>Can Configure</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {module.permissions.canViewStats ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <X size={16} color="#dc2626" />
                      )}
                      <span style={{ fontSize: '14px', color: '#374151' }}>View Statistics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <Users size={24} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    {module.usageStats.activeUsers}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Active Users</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <Activity size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    {module.usageStats.usagePercentage}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Usage Rate</div>
                </div>

                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  {module.usageStats.storageUsed ? (
                    <>
                      <HardDrive size={24} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                        {module.usageStats.storageUsed}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Storage Used</div>
                    </>
                  ) : (
                    <>
                      <Zap size={24} color="#8b5cf6" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                        {module.usageStats.apiCalls?.toLocaleString() || 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>API Calls</div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                  Usage Trend
                </h3>
                <div style={{
                  padding: '40px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <BarChart3 size={48} style={{ margin: '0 auto 16px' }} />
                  Usage trend charts would be implemented here with a charting library like Chart.js or Recharts.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Module Settings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(module.settings).map(([key, value]) => (
                  <div key={key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        {key.split(/(?=[A-Z])/).join(' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Module Users
              </h3>
              <div style={{
                padding: '40px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <Users size={48} style={{ margin: '0 auto 16px' }} />
                Detailed user list and role assignments would be implemented here.
                <div style={{ marginTop: '16px', fontSize: '14px' }}>
                  Currently showing {module.usageStats.activeUsers} active users of {module.usageStats.totalUsers} total.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailsModal;